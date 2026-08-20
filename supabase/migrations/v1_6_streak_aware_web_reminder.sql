-- v1_6_streak_aware_web_reminder — the reminder now knows your flame.
--
-- Scouting report (retention 5/C, 2026-08-20): the cron sent every subscriber
-- the same generic line. It runs at SEND time, so it can read streak state and
-- say something true about THIS player. Duolingo's whole reminder engine rests
-- on this — "don't lose your 54-day streak" outpulls "come play" by miles.
--
-- ⚠️ THE lastDay CHECK IS THE POINT, NOT AN OPTIMISATION. login_streak.streak
-- keeps its old value after a lapse (nothing rewrites it until the next tick),
-- so composing from `streak` alone would tell a player whose run died last week
-- to "keep your streak alive" — a claim the app itself would then contradict.
-- Same defect class as the timeout that said "Correct!". A streak is only
-- claimed ALIVE if it ticked yesterday or today in the player's own calendar
-- (lastDay is a UTC day index; local_date - epoch gives the same index).
--
-- Recipient logic (due/played-today/already-nudged) is byte-identical to the
-- live function — verified against pg_get_functiondef on prod before this
-- replace, per the migration rule.
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
    select distinct w.user_id,
           -- The subscriber's local calendar date, used both for the 7pm test
           -- and for "have they played TODAY" — which must be their today, not
           -- ours, or someone eight hours away gets nagged after they played.
           ((now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes))::date as local_date
    from public.web_push_subscriptions w
    where extract(hour from (now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes)) = 19
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
      not exists (
        select 1 from public.scores s
        where s.user_id = d.user_id
          and s.created_at >= d.local_date::timestamptz
          and s.created_at <  (d.local_date + 1)::timestamptz
      )
      and not exists (
        select 1 from public.notifications n
        where n.user_id = d.user_id
          and n.type = 'daily_reminder'
          and n.created_at >= d.local_date::timestamptz
      )
  )
  insert into public.notifications (user_id, type, payload)
  select e.user_id, 'daily_reminder',
         jsonb_build_object('body',
           case
             -- Streak ALIVE (ticked yesterday; ticking today would have been
             -- caught by the played-today filter): name the number at stake.
             when e.last_day >= e.local_day_index - 1 and e.streak >= 2
               then '🔥 ' || e.streak || '-day streak — one puzzle tonight makes it ' || (e.streak + 1)
             when e.last_day >= e.local_day_index - 1 and e.streak = 1
               then '🔥 You lit a streak yesterday — one puzzle tonight makes it 2'
             -- Streak LAPSED: never claim it lives. Point at the summit instead.
             when e.best >= 3
               then 'Your best run is ' || e.best || ' days — tonight is a good night to start the climb'
             else 'Today''s puzzles are still open — keep your streak going 🔥'
           end)
  from eligible e;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end $function$;

-- Standing rule: every function migration ends with explicit grants.
-- Only the cron (postgres) calls this; nobody else should be able to.
revoke execute on function public.enqueue_web_daily_reminders() from public;
revoke execute on function public.enqueue_web_daily_reminders() from anon;
revoke execute on function public.enqueue_web_daily_reminders() from authenticated;
