-- v1_11: the daily reminder cron reaches native devices.
--
-- MEASURED 2026-08-31, verified three ways (row counts, the function source,
-- and the cron schedule): enqueue_web_daily_reminders() selects FROM
-- web_push_subscriptions, a table holding exactly ONE row — while 42 users sit
-- in device_tokens completely invisible to it. Six daily_reminder rows have
-- ever been written, all to the same person, in the product's entire life.
-- The DELIVERY half already works: the notifications insert fires
-- send_push_on_notification, which reads device_tokens. Only the SELECT was
-- wrong. This is the largest reach multiplier available anywhere in the app,
-- and it is one query.
--
-- ⚠️ DROP BEFORE CREATE ON register_device_token. Adding a third defaulted
-- parameter does NOT replace the 2-arg function, it creates an OVERLOAD — and
-- then every existing 2-arg call from the shipped App Store binary becomes
-- "function is not unique" and fails. The old signature must go first, in the
-- same transaction, so 2-arg callers resolve to the new one via its default.
--
-- ⚠️ p_tz_offset IS DEFAULTED for the same reason: builds already in the wild
-- call with two arguments and must keep working until adoption catches up.

alter table public.device_tokens
  add column if not exists tz_offset_minutes int,
  add column if not exists last_seen_at timestamptz;

drop function if exists public.register_device_token(text, text);

create or replace function public.register_device_token(
  p_token text,
  p_platform text default 'ios',
  p_tz_offset int default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_token is null or length(p_token) < 8 then
    raise exception 'invalid token';
  end if;
  delete from public.device_tokens where token = p_token;
  insert into public.device_tokens (user_id, token, platform, tz_offset_minutes, last_seen_at)
  values (auth.uid(), p_token, coalesce(p_platform, 'ios'), p_tz_offset, now());
end;
$function$;

grant execute on function public.register_device_token(text, text, int) to authenticated;
revoke execute on function public.register_device_token(text, text, int) from public, anon;

-- ── the recipient set ────────────────────────────────────────────────────────
-- Unchanged: eligibility, the streak-aware copy, and the once-per-local-day
-- guard. They all key on user_id and do not care where the recipient came from.
--
-- ⚠️ THE TZ FALLBACK IS NOT A GUESS AT A TIMEZONE. The 42 existing tokens carry
-- no offset until their app next opens and re-registers. Rather than invent a
-- timezone (which sends notifications at 3am when it is wrong), fall back to the
-- hour that user has most often actually PLAYED in, taken from their own scores
-- — a time they are demonstrably awake and using the app. 31 of the 43 native
-- users have 3+ score rows to draw on. Users with neither an offset nor any
-- scores get 19:00 UTC, and correct themselves the moment the app reopens.
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
    select w.user_id, w.tz_offset_minutes, w.last_seen_at, 1 as pref
    from public.web_push_subscriptions w
    union all
    -- native: offset when the app has registered one since v1_11
    select d.user_id, d.tz_offset_minutes, d.last_seen_at, 2 as pref
    from public.device_tokens d
  ),
  best as (
    select distinct on (s.user_id) s.user_id, s.tz_offset_minutes
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
      case
        when b.tz_offset_minutes is not null
          then extract(hour from (now() at time zone 'utc') + make_interval(mins => b.tz_offset_minutes)) = 19
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

revoke execute on function public.enqueue_web_daily_reminders() from public, anon, authenticated;
