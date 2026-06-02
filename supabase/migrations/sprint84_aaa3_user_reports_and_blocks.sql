-- ============================================================================
-- Sprint #84 AAA3 — Report-user mechanism + user-blocking
-- ============================================================================
--
-- Two new tables:
--   - user_reports: any authenticated user can INSERT a report against
--     another user. Only service_role can SELECT — we read reports
--     manually via the dashboard for now (volume is expected to be low
--     pre-launch; add an admin page in v1.1 if needed).
--   - user_blocks: symmetric block. If A blocks B, then B disappears from
--     A's friend search and friend list. The filtering happens client-side
--     against the block list pulled for the current viewer; existing rows
--     in `friendships` are NOT deleted (block ≠ unfriend, by design — a
--     block-then-unblock cycle should restore the friendship).
--
-- App Store guideline 1.2 backstop for UGC apps. Without this, the
-- username + avatar are user-generated content with no abuse-handling
-- path, which can block review.
--
-- Reverse DDL (if rollback needed):
--   drop table if exists public.user_reports;
--   drop table if exists public.user_blocks;
-- ============================================================================

-- ─── user_reports ───────────────────────────────────────────────────────────
create table public.user_reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references auth.users(id) on delete cascade,
  reported_id   uuid not null references auth.users(id) on delete cascade,
  reason        text not null check (reason in (
    'offensive_username','harassment','spam','other'
  )),
  message       text check (length(message) <= 500),
  created_at    timestamptz not null default now(),
  -- Dedup: same reporter→reported→reason combo only once ever. Prevents
  -- a single reporter from flooding the table with duplicates. If they
  -- want to file a NEW report against the same user, they pick a
  -- different reason.
  constraint user_reports_dedup unique (reporter_id, reported_id, reason),
  -- Self-report makes no sense and is almost certainly a bug or troll.
  constraint user_reports_no_self check (reporter_id <> reported_id)
);

-- Memory: REVOKE supabase_admin defaults that grant anon full DML on
-- new public tables before adding back the minimal grants we need.
revoke all on public.user_reports from public, anon, authenticated;

grant insert on public.user_reports to authenticated;

alter table public.user_reports enable row level security;

create policy "Authenticated users can report others"
  on public.user_reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- No SELECT / UPDATE / DELETE policies on purpose. service_role bypasses
-- RLS for backoffice work; anyone else cannot read reports back.

create index user_reports_reported_id_idx on public.user_reports (reported_id, created_at desc);
create index user_reports_created_at_idx on public.user_reports (created_at desc);


-- ─── user_blocks ────────────────────────────────────────────────────────────
create table public.user_blocks (
  blocker_id   uuid not null references auth.users(id) on delete cascade,
  blocked_id   uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

revoke all on public.user_blocks from public, anon, authenticated;

grant select, insert, delete on public.user_blocks to authenticated;

alter table public.user_blocks enable row level security;

create policy "Users can see their own blocks"
  on public.user_blocks
  for select
  to authenticated
  using (auth.uid() = blocker_id);

create policy "Users can add their own blocks"
  on public.user_blocks
  for insert
  to authenticated
  with check (auth.uid() = blocker_id);

create policy "Users can remove their own blocks"
  on public.user_blocks
  for delete
  to authenticated
  using (auth.uid() = blocker_id);

-- No UPDATE policy — block rows are immutable (insert / delete only).

create index user_blocks_blocked_idx on public.user_blocks (blocked_id);

-- ─── get_block_mask() RPC ───────────────────────────────────────────────────
-- SECURITY DEFINER bypass so the caller gets the symmetric mask (both
-- directions) without us having to loosen the SELECT RLS — that would
-- otherwise leak "X blocked me" info to the blocked party. The RPC
-- returns UUIDs only; no direction info.

create or replace function public.get_block_mask()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select blocked_id from public.user_blocks where blocker_id = auth.uid()
  union
  select blocker_id from public.user_blocks where blocked_id = auth.uid();
$$;

revoke execute on function public.get_block_mask() from public;
grant execute on function public.get_block_mask() to authenticated;

-- ============================================================================
-- Verification (run after applying):
--
--   -- A user can report another user
--   insert into public.user_reports (reporter_id, reported_id, reason, message)
--   values (auth.uid(), '<other-user-id>', 'offensive_username', 'test')
--   returning id;
--
--   -- A user cannot report themselves (CHECK violation)
--   insert into public.user_reports (reporter_id, reported_id, reason)
--   values (auth.uid(), auth.uid(), 'spam');
--
--   -- A user cannot insert a report claiming to be someone else (RLS)
--   insert into public.user_reports (reporter_id, reported_id, reason)
--   values ('<different-uuid>', '<another-uuid>', 'spam');
--
--   -- Block / unblock self-roundtrip
--   insert into public.user_blocks (blocker_id, blocked_id)
--   values (auth.uid(), '<other-user-id>');
--   select * from public.user_blocks where blocker_id = auth.uid();
--   delete from public.user_blocks where blocked_id = '<other-user-id>';
-- ============================================================================
