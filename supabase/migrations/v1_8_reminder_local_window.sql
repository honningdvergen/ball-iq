-- v1_8_reminder_local_window — the reminder's "day" is now the player's day.
--
-- Three defects in enqueue_web_daily_reminders(), all in the recipient filter
-- (the streak-aware message composition is untouched):
--
-- 1. ⚠️ THE WINDOW BOUNDARY WAS UTC MIDNIGHT, NOT LOCAL MIDNIGHT.
--    `d.local_date::timestamptz` casts the player's LOCAL calendar date at the
--    database's midnight (UTC). The function went to the trouble of computing
--    local_date per subscriber and then bounded "played today" by the wrong
--    midnight:
--      · West of UTC (US, −300): local "today" began at 19:00 local YESTERDAY,
--        so an evening play yesterday suppressed today's reminder. For the
--        exact audience the growth plan targets, the reminder silently skips
--        the most engaged players.
--      · East of UTC (Oslo, +120): plays between local 00:00 and 02:00 fell
--        before the window, so a post-midnight player could be nagged about a
--        day they had already played.
--    Fix: shift the boundary by the subscriber's own offset —
--    local midnight in UTC is (local_date - tz_offset).
--
-- 2. ⚠️ FOOTLE WAS INVISIBLE TO "HAVE THEY PLAYED TODAY".
--    The check read `scores` alone, and Footle — the most-played mode — writes
--    ONLY to user_game_state.wordle_state. Same measurement trap the funnel
--    fix documented: a player who did today's Footle and closed the tab was
--    treated as absent and nagged. wordle_state is keyed by the CLIENT'S local
--    date and a key exists the moment Footle is OPENED, so the check requires
--    a real guess (guesses > 0), per the standing rule.
--
-- 3. Multi-device users could enqueue twice: `select distinct user_id,
--    local_date` keeps one row per (user, date), but two devices with
--    DIFFERENT offsets reach 19:00 at different cron runs and the dedup
--    window shifted with the device. distinct on (user_id) with the freshest
--    device's offset makes one person one reminder, full stop.
--
-- Recipient logic verified against pg_get_functiondef on prod before this
-- replace (live = v1_6 file, byte-identical), per the migration rule. This
-- migration CHANGES that logic deliberately; the diffs are the three above.
create or replace function public.enqueue_web_daily_reminders()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_inserted int := 0;
begin
  with due as (
    -- One row per user: the freshest device decides the timezone. last_seen_at
    -- is re-written on every persist(), so "freshest" tracks where they
    -- actually are after travel or DST.
    select distinct on (w.user_id)
           w.user_id,
           w.tz_offset_minutes,
           ((now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes))::date as local_date
    from public.web_push_subscriptions w
    where extract(hour from (now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes)) = 19
    order by w.user_id, w.last_seen_at desc nulls last
  ),
  eligible as (
    select d.user_id, d.local_date,
           (d.local_date - date '1970-01-01') as local_day_index,
           coalesce((g.login_streak->>'streak')::int, 0)  as streak,
           coalesce((g.login_streak->>'best')::int, 0)    as best,
           coalesce((g.login_streak->>'lastDay')::int, 0) as last_day
    from due d
    left join public.user_game_state g on g.user_id = d.user_id
    where
      -- Scored modes today — bounded by the PLAYER'S midnight, expressed in
      -- UTC: local midnight = (local_date at 00:00 local) = local_date - offset.
      not exists (
        select 1 from public.scores s
        where s.user_id = d.user_id
          and s.created_at >= ((d.local_date::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
          and s.created_at <  (((d.local_date + 1)::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
      )
      -- Footle today — keyed by the client's local date already, so no offset
      -- math: the key IS the player's calendar. Requires a real guess; the key
      -- alone appears on open.
      and not exists (
        select 1 from public.user_game_state u
        where u.user_id = d.user_id
          and jsonb_array_length(coalesce(
                u.wordle_state -> d.local_date::text -> 'guesses', '[]'::jsonb)) > 0
      )
      -- Not already nudged today (same local-midnight boundary).
      and not exists (
        select 1 from public.notifications n
        where n.user_id = d.user_id
          and n.type = 'daily_reminder'
          and n.created_at >= ((d.local_date::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
      )
  )
  insert into public.notifications (user_id, type, payload)
  select e.user_id, 'daily_reminder',
         jsonb_build_object('body',
           case
             when e.last_day >= e.local_day_index - 1 and e.streak >= 2
               then '🔥 ' || e.streak || '-day streak — one puzzle tonight makes it ' || (e.streak + 1)
             when e.last_day >= e.local_day_index - 1 and e.streak = 1
               then '🔥 You lit a streak yesterday — one puzzle tonight makes it 2'
             when e.best >= 3
               then 'Your best run is ' || e.best || ' days — tonight is a good night to start the climb'
             else 'Today''s puzzles are still open — keep your streak going 🔥'
           end)
  from eligible e;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end $function$;

-- Standing rule: every function migration ends with explicit revokes.
-- Only the cron (postgres) calls this; nobody else should be able to.
revoke execute on function public.enqueue_web_daily_reminders() from public;
revoke execute on function public.enqueue_web_daily_reminders() from anon;
revoke execute on function public.enqueue_web_daily_reminders() from authenticated;
