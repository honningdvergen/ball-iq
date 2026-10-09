-- v2_7_register_keeps_reminder_hour — one reminder a day, not two.
--
-- FOUND 2026-10-09, from two banners on Alex's phone at 13:00.
--
-- v2_4 gave every device row a reminder_hour and a local_reminders flag: a
-- phone that schedules its own reminder says so through set_reminder_hour(),
-- and the hourly cron then skips it. But register_device_token() replaces the
-- device's row on every app open (delete, then insert) and the insert named
-- neither column, so both fell back to their defaults: no hour, and "does not
-- remind itself". The app sends the hour at launch and the push token lands a
-- moment later, so the replace usually came second and undid it.
--
-- Checked in production before writing this: the deployed function body is the
-- v1_11 one (delete + five-column insert). Of 18 devices seen in the last
-- fourteen days, 6 had lost their hour. Alex's own row read hour NULL, local
-- false, re-registered at 12:09; the cron then took the hour from his web
-- subscription (13), wrote one daily_reminder at 13:00, and the push trigger
-- delivered it to the phone, which had also fired its own.
--
-- The fix: the replace carries the two values over. It reads them only from
-- rows that belong to the caller (the row being replaced if it is theirs,
-- otherwise their most recently seen device), so a phone handed to another
-- account never inherits the last owner's hour. set_reminder_hour() writes
-- every row a player owns alike, so their rows agree by construction.
--
-- Same signature, so builds already in the stores keep working and the grants
-- carry over; they are restated so this file stands on its own. Rows that have
-- already lost their hour need no repair here: the app sends it again on its
-- next open, and from now on it stays.

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
declare
  v_hour smallint;
  v_local boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_token is null or length(p_token) < 8 then
    raise exception 'invalid token';
  end if;
  select d.reminder_hour, d.local_reminders
    into v_hour, v_local
  from public.device_tokens d
  where d.user_id = auth.uid()
  order by (d.token = p_token) desc, d.last_seen_at desc nulls last
  limit 1;
  delete from public.device_tokens where token = p_token;
  insert into public.device_tokens (user_id, token, platform, tz_offset_minutes, last_seen_at, reminder_hour, local_reminders)
  values (auth.uid(), p_token, coalesce(p_platform, 'ios'), p_tz_offset, now(), v_hour, coalesce(v_local, false));
end;
$function$;

grant execute on function public.register_device_token(text, text, int) to authenticated;
revoke execute on function public.register_device_token(text, text, int) from public, anon;
