-- ── WHY ──────────────────────────────────────────────────────────────────────
-- "The reminder hour" was defined twice. The client computes a per-player
-- median of recent completion hours (lib/playHour.js), schedules NATIVE local
-- notifications at it, and prints "Reminder set for 21:00". The cron below
-- pivots on a hard-coded 19 for every row that has a timezone offset. So the
-- pill promised 21:00 and the push arrived at 19:00 — a promise broken daily
-- (bloodhound 2026-09-07, verified in prod). And a native device that schedules
-- local reminders ALSO sat in device_tokens, so the cron pushed it a second
-- banner for the same evening.
--
-- The server now owns WHEN; the client tells it what it knows. A new RPC
-- rather than a fourth parameter on register_device_token: adding a defaulted
-- parameter creates an ambiguous overload pair (42725) — the exact trap v2_0
-- fell into — and the hour changes independently of the token anyway.
alter table public.device_tokens
  add column if not exists reminder_hour smallint check (reminder_hour between 0 and 23),
  add column if not exists local_reminders boolean not null default false;
alter table public.web_push_subscriptions
  add column if not exists reminder_hour smallint check (reminder_hour between 0 and 23);

create or replace function public.set_reminder_hour(p_hour int, p_local boolean default false)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_hour is null or p_hour < 0 or p_hour > 23 then return; end if;
  update public.device_tokens set reminder_hour = p_hour, local_reminders = coalesce(p_local, false)
    where user_id = auth.uid();
  update public.web_push_subscriptions set reminder_hour = p_hour
    where user_id = auth.uid();
end;
$function$;
grant execute on function public.set_reminder_hour(int, boolean) to authenticated;
revoke execute on function public.set_reminder_hour(int, boolean) from public, anon;

-- enqueue_web_daily_reminders, verbatim from v1_11 with: reminder_hour + local_reminders carried through
-- sources/best, the pivot on coalesce(reminder_hour, 19), and local-reminder devices skipped.
create or replace function public.enqueue_web_daily_reminders()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_inserted int := 0;
begin
  with sources as (
    -- web push: a real, browser-reported offset
    select w.user_id, w.tz_offset_minutes, w.last_seen_at, 1 as pref, w.reminder_hour, false as local_reminders
    from public.web_push_subscriptions w
    union all
    -- native: offset when the app has registered one since v1_11
    -- prod already carried coalesce(d.last_seen_at, d.updated_at) here; the repo lacked it (snapshot drift, bloodhound 2026-09-08)
    select d.user_id, d.tz_offset_minutes, coalesce(d.last_seen_at, d.updated_at), 2 as pref, d.reminder_hour, d.local_reminders
    from public.device_tokens d
  ),
  best as (
    select distinct on (s.user_id) s.user_id, s.tz_offset_minutes, s.reminder_hour, s.local_reminders
    from sources s
    order by s.user_id, s.pref, s.last_seen_at desc nulls last
  ),
  -- most frequent UTC hour of play, for rows with no offset yet
  play_hour as (
    select s.user_id, (extract(hour from s.created_at))::int as hr, count(*) as n
    from public.scores s
    group by 1, 2
  ),
  modal_hour as (
    select distinct on (p.user_id) p.user_id, p.hr
    from play_hour p
    order by p.user_id, p.n desc, p.hr
  ),
  due as (
    select b.user_id,
           coalesce(b.tz_offset_minutes, 0) as tz_offset_minutes,
           ((now() at time zone 'utc') + make_interval(mins => coalesce(b.tz_offset_minutes, 0)))::date as local_date
    from best b
    left join modal_hour m on m.user_id = b.user_id
    where
      -- ONE engine per device: a native app that schedules its own local
      -- reminders at the player's hour must not also be pushed at it.
      not coalesce(b.local_reminders, false) and
      case
        when b.tz_offset_minutes is not null
          then extract(hour from (now() at time zone 'utc') + make_interval(mins => b.tz_offset_minutes)) = coalesce(b.reminder_hour, 19)
        else extract(hour from (now() at time zone 'utc')) = coalesce(m.hr, 19)
      end
  ),
  eligible as (
    select d.user_id, d.local_date, d.tz_offset_minutes,
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
          and s.created_at >= ((d.local_date::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
          and s.created_at <  (((d.local_date + 1)::timestamp
                                - make_interval(mins => d.tz_offset_minutes)) at time zone 'utc')
      )
      and not exists (
        select 1 from public.user_game_state u
        where u.user_id = d.user_id
          and jsonb_array_length(coalesce(
                u.wordle_state -> d.local_date::text -> 'guesses', '[]'::jsonb)) > 0
      )
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
             when e.last_day = e.local_day_index - 2 and e.streak >= 2
               then 'You missed yesterday — play tonight and your ' || e.streak || '-day streak can still be saved 🛡'
             when e.best >= 3
               then 'Your best run is ' || e.best || ' days — tonight is a good night to start the climb'
             else 'Today''s puzzles are still open — keep your streak going 🔥'
           end)
  from eligible e;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end $function$;
