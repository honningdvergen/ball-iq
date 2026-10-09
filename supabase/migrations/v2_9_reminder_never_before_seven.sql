-- v2_9_reminder_never_before_seven — the reminder is an evening thing.
--
-- Alex, 9 Oct 2026, after a reminder reached his phone at 13:00: "it just
-- feels right to get the notification at the end of the day if you have
-- forgotten about it, instead of kind of interrupting you mid-work or
-- mid-school ... when you won't even finish it anyway."
--
-- Since v2_4 the cron has fired at the hour each player's app reported, which
-- the app learned from when they finish (anywhere from 08:00 to 22:00).
-- Production on the day: of 33 phones that had reported an hour, 15 had
-- reported one before 19:00, four of them 08:00. Those hours stay in the table
-- (the apps in the stores keep sending them until they update); the cron now
-- reads each as "no earlier than 19:00". A later hour, for someone who
-- habitually plays later, is kept.
--
-- Rows with no timezone at all still fall back to the UTC hour that player
-- most often plays in. There is no evening to aim at without a timezone.
--
-- Applied 9 Oct 2026 with Alex's yes. Checked after: both expressions changed
-- once each, v2_8's ORDER BY still in place, one overload, anon and
-- authenticated cannot execute, the hourly job active; earliest local hour
-- across phones with a timezone moved from 8 to 19.
--
-- Written as an edit to the deployed definition, for the reason given in v2_8.

do $mig$
declare
  v_def text;
  v_pairs constant text[][] := array[
    ['= coalesce(b.reminder_hour, 19)', '= greatest(coalesce(b.reminder_hour, 19), 19)'],
    ['= coalesce(w.reminder_hour, 19)', '= greatest(coalesce(w.reminder_hour, 19), 19)']
  ];
  v_hits int;
  i int;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'enqueue_web_daily_reminders';
  if v_def is null then raise exception 'enqueue_web_daily_reminders not found'; end if;
  for i in 1 .. array_length(v_pairs, 1) loop
    v_hits := (length(v_def) - length(replace(v_def, v_pairs[i][1], ''))) / length(v_pairs[i][1]);
    if v_hits <> 1 then
      raise exception 'expected exactly one "%", found %', v_pairs[i][1], v_hits;
    end if;
    v_def := replace(v_def, v_pairs[i][1], v_pairs[i][2]);
  end loop;
  execute v_def;
end $mig$;

revoke execute on function public.enqueue_web_daily_reminders() from public, anon, authenticated;
