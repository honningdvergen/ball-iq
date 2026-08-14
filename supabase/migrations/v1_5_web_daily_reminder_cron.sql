-- The daily web reminder. Mirrors the native engine's rule exactly: 7pm LOCAL,
-- only if you have not played today, one nudge, never a second.
--
-- Runs HOURLY rather than once a day because "7pm local" is a different UTC
-- hour for every subscriber. Each run picks out only the people for whom it is
-- currently 19:00 where they are.
create or replace function public.enqueue_web_daily_reminders()
returns int
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_inserted int := 0;
begin
  with due as (
    select distinct w.user_id,
           ((now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes))::date as local_date
    from public.web_push_subscriptions w
    where extract(hour from (now() at time zone 'utc') + make_interval(mins => w.tz_offset_minutes)) = 19
  )
  insert into public.notifications (user_id, type, payload)
  select d.user_id, 'daily_reminder',
         jsonb_build_object('body', 'Today''s puzzles are still open — keep your streak going 🔥')
  from due d
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
    );
  get diagnostics v_inserted = row_count;
  return v_inserted;
end $$;

revoke all on function public.enqueue_web_daily_reminders() from public;

select cron.schedule('web-daily-reminder', '0 * * * *',
  $$select public.enqueue_web_daily_reminders()$$);
