-- record_funnel_event: anonymous-by-contract native events, plus the rate cap
-- its three siblings already had.
--
-- ── WHY (1): "ANONYMOUS COUNTS ONLY" HAS TO BE TRUE SERVER-SIDE ──────────────
--
-- Decision, 2026-08-23: native builds may COUNT feature use but must never
-- IDENTIFY the player, so privacy §4 can keep making a real promise instead of
-- a false one. The client half of that is easy — send no biq_vid.
--
-- ⚠️ The client half is NOT enough, and this is the trap. This function
-- inserts `auth.uid()` as user_id on every call. A signed-in player's ACCOUNT
-- ID is a far stronger identifier than the random visitor id we just removed,
-- so passing p_visitor => null would have produced rows that still name the
-- person, while the code and the policy both read as anonymous. The promise
-- would have been false in exactly the way nobody would ever notice.
--
-- So anonymity is enforced HERE, where it cannot be undone by a client bug, a
-- stale bundle, or a future call site that forgets. p_anon nulls BOTH keys.
--
-- ── WHY (2): THE MISSING RATE CAP ───────────────────────────────────────────
--
-- Every sibling anon-writable RPC bounds itself: log_club_quiz 3000/hr,
-- record_challenge_event 500/hr, report_question 200/hr. record_funnel_event —
-- written in direct response to a pollution incident — bounded only the event
-- name length. It is also the one that has ALREADY been poisoned: 1,038 rows
-- in three hours on 2026-08-21, against a real DAU of 13-17.
--
-- 3000/hr is deliberately generous against real traffic (289 genuine rows in
-- the entire clean window to date) while capping a runaway loop or a hostile
-- script at something that cannot bury the signal.
--
-- Silent return on breach, matching the siblings: measurement must never
-- surface an error to a player mid-game.

create or replace function public.record_funnel_event(
  p_event   text,
  p_meta    jsonb   default null,
  p_visitor uuid    default null,
  p_anon    boolean default false
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_event is null or length(p_event) = 0 or length(p_event) > 64 then
    return;
  end if;
  if p_meta is not null and length(p_meta::text) > 2000 then
    p_meta := null;
  end if;

  -- Global hourly backstop. See header.
  if (select count(*) from public.funnel_events
        where created_at > now() - interval '1 hour') >= 3000 then
    return;
  end if;

  insert into public.funnel_events (event, meta, visitor_id, user_id)
  values (
    left(p_event, 64),
    p_meta,
    -- Both identifiers are dropped together when p_anon is set. Nulling only
    -- one of them is the failure mode this exists to make impossible.
    case when p_anon then null else p_visitor end,
    case when p_anon then null else auth.uid() end
  );
end;
$function$;

-- ⚠️ The 3-arg signature still exists as a separate overload after adding a
-- 4th parameter with a default, and PostgREST would happily keep routing to
-- it — leaving a live, uncapped, non-anonymous path. Drop it explicitly.
drop function if exists public.record_funnel_event(text, jsonb, uuid);

grant execute on function public.record_funnel_event(text, jsonb, uuid, boolean) to anon;
grant execute on function public.record_funnel_event(text, jsonb, uuid, boolean) to authenticated;
revoke execute on function public.record_funnel_event(text, jsonb, uuid, boolean) from public;
