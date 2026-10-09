-- v2_8_reminder_quiet_when_a_phone_reminds_itself — the second half of "one
-- reminder a day, not two" (v2_7 is the first).
--
-- enqueue_web_daily_reminders() picks ONE row per player to decide whether and
-- when to remind them, and it preferred a web subscription over a phone. A web
-- row never "reminds itself", so a player with a browser subscription AND a
-- phone that schedules its own reminder was still judged "not reminded", got a
-- notification row, and the push trigger delivered it to the phone as well.
--
-- Checked in production on 2026-10-09: exactly one player had both (Alex, a
-- Chrome subscription from 31 Aug), which is how it was found.
--
-- The change is one ORDER BY: a row that reminds itself wins the pick, and the
-- existing `not coalesce(b.local_reminders, false)` filter then skips the
-- player. Nobody else's outcome moves: simulated against all 41 players the
-- cron considers, before and after, zero differences apart from the one case.
--
-- ⚠️ WRITTEN AS AN EDIT TO THE LIVE DEFINITION, ON PURPOSE. The function is
-- 5.6 KB and production has drifted from the repo's copy of it once already
-- (see the note inside v2_5). Retyping it here to change one line would risk
-- reverting whatever else differs. So this reads the deployed body, requires
-- the old ORDER BY to appear exactly once, and replaces that alone. If the
-- function has changed shape it raises and changes nothing.

do $mig$
declare
  v_def text;
  v_old constant text := 'order by s.user_id, s.pref, s.last_seen_at desc nulls last';
  v_new constant text := 'order by s.user_id, coalesce(s.local_reminders, false) desc, s.pref, s.last_seen_at desc nulls last';
  v_hits int;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'enqueue_web_daily_reminders';
  if v_def is null then raise exception 'enqueue_web_daily_reminders not found'; end if;
  v_hits := (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old);
  if v_hits <> 1 then
    raise exception 'expected exactly one ORDER BY to change, found %', v_hits;
  end if;
  execute replace(v_def, v_old, v_new);
end $mig$;

revoke execute on function public.enqueue_web_daily_reminders() from public, anon, authenticated;
