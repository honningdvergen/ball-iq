-- v1.3: room reaper (medical multiplayer-realtime medium)
--
-- game_rooms grew unbounded and abandoned lobby/playing rooms never reached
-- 'ended'. At deploy time prod had 36 rooms stuck in lobby/playing (up to 71
-- days old) out of 129 total. Running reap_stale_rooms() once ended those 36
-- and pruned 85 week-old finished rooms (129 -> 44, 0 stuck).
--
-- APPLIED TO PROD 2026-07-12 via the claude.ai Supabase connector (function +
-- one manual run). SCHEDULING is done in the Supabase dashboard Cron UI
-- (Integrations -> Cron): job "reap-stale-rooms", schedule '7 * * * *',
-- SQL `select public.reap_stale_rooms();`. The dashboard path auto-enables
-- pg_cron (available v1.6.4); a raw `create extension pg_cron` is blocked by
-- the connector's permission guard.
--
-- NOTE: game_rooms uses column `state` (lobby/playing/ended), NOT `status`.

create or replace function public.reap_stale_rooms()
returns table(ended int, deleted int)
language plpgsql
security definer
set search_path = public
as $$
declare v_ended int; v_deleted int;
begin
  -- Force-end rooms abandoned in lobby/playing. A real match finishes in
  -- minutes, so >2h in a non-ended state = abandoned.
  update public.game_rooms
     set state = 'ended', ended_at = coalesce(ended_at, now())
   where state <> 'ended'
     and created_at < now() - interval '2 hours';
  get diagnostics v_ended = row_count;

  -- Prune long-finished rooms (room_players cascade) to bound table growth.
  delete from public.game_rooms
   where state = 'ended'
     and coalesce(ended_at, created_at) < now() - interval '7 days';
  get diagnostics v_deleted = row_count;

  return query select v_ended, v_deleted;
end $$;

-- Maintenance function — never client-callable (only cron / service role).
revoke execute on function public.reap_stale_rooms() from public;
revoke execute on function public.reap_stale_rooms() from anon;
revoke execute on function public.reap_stale_rooms() from authenticated;
