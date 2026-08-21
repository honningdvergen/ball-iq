-- v1.6 — funnel_events: make the funnel readable in SQL
--
-- WHY. Three features shipped in August that cannot be read at all.
-- loopEvent() (src/App.jsx) fires window.clarity('event', name) and nothing
-- else, and Clarity's export API returns ONLY its own auto-detected smart
-- events — a query for onboard-done-answered, onboard-done-skipped,
-- first-game-started or clubq-play comes back empty. So the onboarding
-- rebuild, the activation instrumentation and the club-page hook are all
-- currently unmeasurable, and every recommendation about them in scouting
-- report #2 is reasoning rather than measurement.
--
-- This is deliberately the SMALLEST thing that fixes it: one append-only
-- table and one RPC, mirroring challenge_events (v1_6_challenge_events) so
-- there is one shape to learn rather than two. Clarity keeps working
-- unchanged — loopEvent will fan out to both, so session replay still lines
-- up with the numbers.
--
-- Timed to land BEFORE the season-start traffic and Alex's social push, on
-- the principle that instrumentation added after a spike measures the tail.

-- 1 ── table ------------------------------------------------------------------

create table if not exists public.funnel_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null,
  -- Free-form context (surface, club slug, variant…). Kept as jsonb so new
  -- events never need a migration; kept SMALL by the client.
  meta        jsonb,
  -- Anonymous visitors have no auth.uid() — the club pages carry ~39% of all
  -- play and almost none of it is signed in — so identity is a client-issued
  -- uuid, exactly as challenge_events does it. Never a fingerprint.
  visitor_id  uuid,
  -- Set only when there IS a session. Nullable by design.
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists funnel_events_event_created_idx
  on public.funnel_events (event, created_at desc);
create index if not exists funnel_events_created_idx
  on public.funnel_events (created_at desc);

-- ⚠️ supabase_admin defaults grant anon full DML on new public tables. RLS
-- alone is not enough — the grant is still wrong and the next policy added
-- may open more than intended. Revoke explicitly, then rely on the RPC.
alter table public.funnel_events enable row level security;
revoke all on table public.funnel_events from public;
revoke all on table public.funnel_events from anon;
revoke all on table public.funnel_events from authenticated;

-- No policies on purpose: nothing may read or write this table directly.
-- Writes go through the security-definer RPC below; reads are for the
-- service role and the dashboard only.

-- 2 ── the write path ---------------------------------------------------------

create or replace function public.record_funnel_event(
  p_event text,
  p_meta jsonb default null,
  p_visitor uuid default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Bound what a client can write. This RPC is callable by anon, so treat
  -- every argument as hostile: cap the event name, drop anything unreasonably
  -- large, and never echo input back.
  if p_event is null or length(p_event) = 0 or length(p_event) > 64 then
    return;
  end if;
  if p_meta is not null and length(p_meta::text) > 2000 then
    p_meta := null;
  end if;

  insert into public.funnel_events (event, meta, visitor_id, user_id)
  values (left(p_event, 64), p_meta, p_visitor, auth.uid());
end;
$function$;

grant execute on function public.record_funnel_event(text, jsonb, uuid) to anon;
grant execute on function public.record_funnel_event(text, jsonb, uuid) to authenticated;
revoke execute on function public.record_funnel_event(text, jsonb, uuid) from public;

-- 3 ── retention ---------------------------------------------------------------
-- Funnel rows are only useful while they are recent, and this table will be
-- the highest-volume thing in the database once traffic arrives. 180 days is
-- long enough to compare a season to its start.

create or replace function public.cleanup_funnel_events()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  delete from public.funnel_events where created_at < now() - interval '180 days';
end;
$function$;

revoke execute on function public.cleanup_funnel_events() from public;
revoke execute on function public.cleanup_funnel_events() from anon;
revoke execute on function public.cleanup_funnel_events() from authenticated;

select cron.schedule(
  'cleanup-funnel-events',
  '23 4 * * *',
  $$select public.cleanup_funnel_events();$$
);
