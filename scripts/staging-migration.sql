-- ============================================================================
-- Stage 1 multiplayer — staging migration (RECONSTRUCTED)
-- ============================================================================
--
-- Generated 2026-05-03 by reconstructing the contract from:
--   - src/useMultiplayerRoom.js  (RPC argument shapes + return shapes)
--   - src/App.jsx                (caller error handling, errcode references)
--   - scripts/spike-1-realtime.mjs + spike-2-advance-race.mjs (spike helpers)
--   - docs/MULTIPLAYER.md        (architectural decisions)
--   - memory/project_stage_1_spike_findings.md  (REPLICA IDENTITY FULL, gate)
--   - memory/feedback_rpc_grants.md  (REVOKE FROM PUBLIC discipline)
--   - memory/feedback_supabase_admin_defaults.md  (REVOKE for anon DML)
--   - memory/feedback_question_duration_constant.md  (20000ms server cap)
--
-- !! IMPORTANT — read before applying !!
--
-- This is a BEST-EFFORT RECONSTRUCTION. The actual production SQL is in
-- the production Supabase project, not in this repo. Specific function
-- bodies are inferred from CALLER behavior (client-side error codes,
-- expected return shapes) rather than read from the source. Column
-- types, constraint names, and trigger details are educated guesses.
--
-- Before applying to staging:
--   1. Diff this file against the production project's migrations
--      (Supabase dashboard → Database → Migrations)
--   2. For any divergence, trust production over this file
--   3. Run scripts/spike-1-realtime.mjs and scripts/spike-2-advance-race.mjs
--      against staging immediately after apply to confirm the contract
--   4. If a spike fails, the staging contract diverges from production
--      and the bug is in this file, not in the spikes
--
-- Apply order: top to bottom. The file is idempotent (CREATE OR REPLACE
-- + IF NOT EXISTS) so partial runs can be re-applied safely.
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: PRODUCTION TABLES — game_rooms + room_players
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ─── game_rooms ─────────────────────────────────────────────────────────────
create table if not exists public.game_rooms (
  id                uuid primary key default gen_random_uuid(),
  code              varchar(6) not null,
  state             text not null default 'lobby'
                    check (state in ('lobby','playing','ended')),
  current_question  integer not null default 0,
  questions         jsonb not null default '[]'::jsonb,
  capacity          integer not null check (capacity between 2 and 10),
  host_id           uuid not null references auth.users(id) on delete cascade,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  ended_at          timestamptz
);

-- Unique constraint on code while room is active. A room with state='ended'
-- can share its code with a future fresh room (codes get reused over time).
create unique index if not exists game_rooms_code_active_idx
  on public.game_rooms (code)
  where state <> 'ended';

create index if not exists game_rooms_host_idx
  on public.game_rooms (host_id);

create index if not exists game_rooms_state_idx
  on public.game_rooms (state);

-- REPLICA IDENTITY FULL — required so cascade DELETE events carry full row
-- pre-image data (not just primary key). See project_stage_1_spike_findings.md.
alter table public.game_rooms replica identity full;

-- Per feedback_supabase_admin_defaults.md: explicit REVOKE for anon + the
-- structural privileges that supabase_admin grants by default.
revoke truncate, references, trigger on table public.game_rooms from anon, authenticated;
revoke select, insert, update, delete on table public.game_rooms from anon;
-- authenticated keeps SELECT/INSERT/UPDATE/DELETE — RLS policies are the gate
-- (see Section 3 below). All client writes go through SECURITY DEFINER RPCs;
-- direct INSERT/UPDATE/DELETE from authenticated is blocked by RLS.

-- ─── room_players ──────────────────────────────────────────────────────────
create table if not exists public.room_players (
  id                  uuid primary key default gen_random_uuid(),
  room_id             uuid not null references public.game_rooms(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  avatar              text not null default '⚽',
  score               integer not null default 0,
  answered_question   integer not null default -1,
  joined_at           timestamptz not null default now(),
  unique (room_id, user_id)
);

create index if not exists room_players_room_idx
  on public.room_players (room_id);

create index if not exists room_players_user_idx
  on public.room_players (user_id);

-- Same REPLICA IDENTITY rationale — DELETE events need user_id payload so
-- the client knows which player left. Spike 1 validated this requirement.
alter table public.room_players replica identity full;

revoke truncate, references, trigger on table public.room_players from anon, authenticated;
revoke select, insert, update, delete on table public.room_players from anon;

-- ============================================================================
-- SECTION 2: is_room_member SECURITY DEFINER helper
-- ============================================================================
--
-- Avoids RLS recursion: the naive policy "user can SELECT room_players for
-- rooms they're a member of" would recurse — checking membership requires
-- another SELECT against room_players, which evaluates RLS again.
--
-- SECURITY DEFINER bypasses RLS for the helper's own queries, returning
-- a clean boolean to the calling RLS policy.
-- ============================================================================

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.room_players
    where room_id = p_room_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_room_member(uuid) to authenticated;
revoke execute on function public.is_room_member(uuid) from public;

-- ============================================================================
-- SECTION 3: RLS policies on game_rooms + room_players
-- ============================================================================

alter table public.game_rooms enable row level security;
alter table public.room_players enable row level security;

-- ─── game_rooms RLS ────────────────────────────────────────────────────────
-- Members can SELECT their own room. Writes happen via SECURITY DEFINER
-- RPCs (which bypass RLS), so no INSERT/UPDATE/DELETE policies are needed
-- for the authenticated role — RLS denies them by default.
drop policy if exists "members can read room" on public.game_rooms;
create policy "members can read room"
  on public.game_rooms
  for select
  to authenticated
  using (public.is_room_member(id));

-- ─── room_players RLS ──────────────────────────────────────────────────────
-- Same pattern — members can SELECT all rows for rooms they're in.
drop policy if exists "members can read players" on public.room_players;
create policy "members can read players"
  on public.room_players
  for select
  to authenticated
  using (public.is_room_member(room_id));

-- ============================================================================
-- SECTION 4: PRODUCTION RPCs (7 functions)
-- ============================================================================
-- Conventions:
--   - All SECURITY DEFINER (run as table owner; bypass RLS)
--   - Internal auth.uid() check is the security gate
--   - Return shape: jsonb with explicit fields (caller destructures)
--   - Use `using errcode = '...'` to surface known failure modes via
--     PostgreSQL errcodes that the client switches on
--   - Server-side question duration: 20000ms — keep in sync with
--     src/App.jsx QUESTION_DURATION_MS (memory note)
-- ============================================================================

-- ─── create_room ───────────────────────────────────────────────────────────
-- Creates a room in 'lobby' state with caller as host + caller's
-- room_players row. Returns { code, room_id }.

create or replace function public.create_room(
  p_capacity integer,
  p_name text,
  p_avatar text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_code varchar(6);
  v_room_id uuid;
  v_attempts int := 0;
begin
  if v_user_id is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if p_capacity not between 2 and 10 then
    raise exception 'capacity out of range' using errcode = '23514';
  end if;

  -- Generate a unique 6-char code. Crockford-ish base32 (no I/L/O/0/1).
  -- Retry on collision; cap attempts so a pathological case doesn't loop.
  loop
    v_code := upper(translate(substr(encode(gen_random_bytes(6), 'base64'), 1, 6),
                              '+/=ILO01', 'XYZHJK23'));
    begin
      insert into public.game_rooms (code, state, capacity, host_id)
      values (v_code, 'lobby', p_capacity, v_user_id)
      returning id into v_room_id;
      exit;  -- success
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 10 then
        raise exception 'room code generation exhausted' using errcode = '54000';
      end if;
    end;
  end loop;

  -- Insert the host as the first room_players row.
  insert into public.room_players (room_id, user_id, name, avatar)
  values (v_room_id, v_user_id, coalesce(nullif(p_name, ''), 'Player'), coalesce(nullif(p_avatar, ''), '⚽'));

  return jsonb_build_object('code', v_code, 'room_id', v_room_id);
end;
$$;

grant execute on function public.create_room(integer, text, text) to authenticated;
revoke execute on function public.create_room(integer, text, text) from public;

-- ─── join_room ─────────────────────────────────────────────────────────────
-- Joins an existing room by code. Errcodes the client switches on:
--   53300 = room is full (capacity reached)
--   P0002 = no row found (invalid code OR ended)
--   42P01 = room isn't accepting joins (state ≠ 'lobby')

create or replace function public.join_room(
  p_code text,
  p_name text,
  p_avatar text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room game_rooms%rowtype;
  v_player_count int;
begin
  if v_user_id is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  -- Lock the room row for the duration of this transaction so capacity
  -- checks can't race with concurrent joins. (Spike 3 — not yet built —
  -- would test this concurrency path. See scripts/README.md.)
  select * into v_room
  from public.game_rooms
  where code = upper(p_code) and state <> 'ended'
  for update;

  if not found then
    raise exception 'no room with that code' using errcode = 'P0002';
  end if;

  if v_room.state <> 'lobby' then
    raise exception 'room not accepting joins' using errcode = '42P01';
  end if;

  select count(*) into v_player_count from public.room_players where room_id = v_room.id;
  if v_player_count >= v_room.capacity then
    raise exception 'room is full' using errcode = '53300';
  end if;

  insert into public.room_players (room_id, user_id, name, avatar)
  values (v_room.id, v_user_id, coalesce(nullif(p_name, ''), 'Player'), coalesce(nullif(p_avatar, ''), '⚽'))
  on conflict (room_id, user_id) do nothing;  -- idempotent re-join

  return jsonb_build_object('room_id', v_room.id);
end;
$$;

grant execute on function public.join_room(text, text, text) to authenticated;
revoke execute on function public.join_room(text, text, text) from public;

-- ─── start_game ────────────────────────────────────────────────────────────
-- Host-only. Validates roster size hasn't changed since host tapped Start
-- (p_capacity arg = the player count host saw at tap time). Freezes the
-- questions array onto the room, flips state to 'playing'.
--
-- Return shape:
--   { started: true }                                                   -- success
--   { started: false, reason: 'roster_changed', current_count: N }      -- racey
--   { started: false, reason: 'not_host' | 'wrong_state' | ... }        -- block

create or replace function public.start_game(
  p_code text,
  p_questions jsonb,
  p_capacity integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room game_rooms%rowtype;
  v_current_count int;
begin
  if v_user_id is null then
    return jsonb_build_object('started', false, 'reason', 'no_auth');
  end if;

  select * into v_room
  from public.game_rooms
  where code = upper(p_code) and state <> 'ended'
  for update;

  if not found then
    return jsonb_build_object('started', false, 'reason', 'no_room');
  end if;

  if v_room.host_id <> v_user_id then
    return jsonb_build_object('started', false, 'reason', 'not_host');
  end if;

  if v_room.state <> 'lobby' then
    return jsonb_build_object('started', false, 'reason', 'wrong_state');
  end if;

  select count(*) into v_current_count from public.room_players where room_id = v_room.id;
  if v_current_count <> p_capacity then
    return jsonb_build_object(
      'started', false,
      'reason', 'roster_changed',
      'current_count', v_current_count
    );
  end if;

  if v_current_count < 2 then
    return jsonb_build_object('started', false, 'reason', 'min_players');
  end if;

  update public.game_rooms
  set state = 'playing',
      questions = p_questions,
      current_question = 0,
      started_at = now()
  where id = v_room.id;

  return jsonb_build_object('started', true);
end;
$$;

grant execute on function public.start_game(text, jsonb, integer) to authenticated;
revoke execute on function public.start_game(text, jsonb, integer) from public;

-- ─── submit_answer ─────────────────────────────────────────────────────────
-- Records the caller's answer for the given question.
--   p_answer_idx: 0-3 for a real pick, -1 for timeout
--   p_lock_time:  ms from question start; capped at QUESTION_DURATION_MS
--
-- Return shape:
--   { accepted: true }
--   { accepted: false, reason: 'question_idx_mismatch' | 'already_answered' | 'not_in_room' }

create or replace function public.submit_answer(
  p_code text,
  p_question_idx integer,
  p_answer_idx integer,
  p_lock_time integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_question_dur constant integer := 20000;  -- keep in sync with App.jsx QUESTION_DURATION_MS
  v_room game_rooms%rowtype;
  v_player room_players%rowtype;
  v_correct_idx integer;
  v_score_delta integer := 0;
begin
  if v_user_id is null then
    return jsonb_build_object('accepted', false, 'reason', 'no_auth');
  end if;

  select * into v_room from public.game_rooms where code = upper(p_code) and state = 'playing';
  if not found then
    return jsonb_build_object('accepted', false, 'reason', 'no_room');
  end if;

  if v_room.current_question <> p_question_idx then
    return jsonb_build_object('accepted', false, 'reason', 'question_idx_mismatch');
  end if;

  select * into v_player from public.room_players
  where room_id = v_room.id and user_id = v_user_id
  for update;

  if not found then
    return jsonb_build_object('accepted', false, 'reason', 'not_in_room');
  end if;

  if v_player.answered_question >= p_question_idx then
    return jsonb_build_object('accepted', false, 'reason', 'already_answered');
  end if;

  -- Clamp lock_time to [0, v_question_dur]. Out-of-range values count as full duration.
  if p_lock_time is null or p_lock_time < 0 or p_lock_time > v_question_dur then
    p_lock_time := v_question_dur;
  end if;

  -- Compute correctness from the room's frozen questions array.
  v_correct_idx := (v_room.questions -> p_question_idx ->> 'correct')::integer;
  if p_answer_idx >= 0 and p_answer_idx = v_correct_idx then
    -- Score: 100 base + speed bonus scaled by remaining time.
    -- Adjust formula here to match production scoring; client doesn't read
    -- score directly from this RPC — it sees room_players.score via realtime.
    v_score_delta := 100 + ((v_question_dur - p_lock_time) / 100);
  end if;

  update public.room_players
  set answered_question = p_question_idx,
      score = score + v_score_delta
  where id = v_player.id;

  return jsonb_build_object('accepted', true);
end;
$$;

grant execute on function public.submit_answer(text, integer, integer, integer) to authenticated;
revoke execute on function public.submit_answer(text, integer, integer, integer) from public;

-- ─── advance_question ──────────────────────────────────────────────────────
-- Host-only. Bumps current_question by 1 OR transitions to state='ended' if
-- we were already on the last question. The p_expected_question arg is the
-- expected current state — server uses FOR UPDATE to lock the row, then
-- verifies current_question === p_expected_question before mutating.
-- This is the gate that lets concurrent advance attempts be safe.
-- (Spike 2 validated 70/70 iterations across 2/3/4-way concurrency.)

create or replace function public.advance_question(
  p_code text,
  p_expected_question integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room game_rooms%rowtype;
  v_total_questions int;
begin
  if v_user_id is null then
    return jsonb_build_object('advanced', false, 'reason', 'no_auth');
  end if;

  select * into v_room from public.game_rooms
  where code = upper(p_code) and state = 'playing'
  for update;

  if not found then
    return jsonb_build_object('advanced', false, 'reason', 'no_room');
  end if;

  if v_room.host_id <> v_user_id then
    raise exception 'only host can advance' using errcode = '42501';
  end if;

  -- The gate: only advance if caller's expectation matches reality.
  -- Concurrent callers see the same FOR UPDATE-protected snapshot; only
  -- the first commit updates current_question; subsequent callers read
  -- the NEW value and return advanced=false with the new current.
  if v_room.current_question <> p_expected_question then
    return jsonb_build_object(
      'advanced', false,
      'reason', 'expected_mismatch',
      'current_question', v_room.current_question
    );
  end if;

  v_total_questions := jsonb_array_length(v_room.questions);

  if (v_room.current_question + 1) >= v_total_questions then
    -- Last question — game ends.
    update public.game_rooms
    set state = 'ended',
        ended_at = now()
    where id = v_room.id;
    return jsonb_build_object('advanced', true, 'ended', true);
  end if;

  update public.game_rooms
  set current_question = current_question + 1
  where id = v_room.id;

  return jsonb_build_object('advanced', true);
end;
$$;

grant execute on function public.advance_question(text, integer) to authenticated;
revoke execute on function public.advance_question(text, integer) from public;

-- ─── leave_room ────────────────────────────────────────────────────────────
-- Removes caller's room_players row. Other clients see DELETE via realtime
-- (REPLICA IDENTITY FULL ensures payload.old.user_id is populated).

create or replace function public.leave_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room game_rooms%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('left', false, 'reason', 'no_auth');
  end if;

  select * into v_room from public.game_rooms
  where code = upper(p_code) and state <> 'ended';

  if not found then
    return jsonb_build_object('left', false, 'reason', 'no_room');
  end if;

  delete from public.room_players
  where room_id = v_room.id and user_id = v_user_id;

  return jsonb_build_object('left', true);
end;
$$;

grant execute on function public.leave_room(text) to authenticated;
revoke execute on function public.leave_room(text) from public;

-- ─── end_game ──────────────────────────────────────────────────────────────
-- Host-only. Flips state to 'ended'. Currently no production caller — kept
-- for future "End game now" host control mid-game.

create or replace function public.end_game(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room game_rooms%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('ended', false, 'reason', 'no_auth');
  end if;

  select * into v_room from public.game_rooms
  where code = upper(p_code) and state <> 'ended';

  if not found then
    return jsonb_build_object('ended', false, 'reason', 'no_room');
  end if;

  if v_room.host_id <> v_user_id then
    raise exception 'only host can end' using errcode = '42501';
  end if;

  update public.game_rooms
  set state = 'ended', ended_at = now()
  where id = v_room.id;

  return jsonb_build_object('ended', true);
end;
$$;

grant execute on function public.end_game(text) to authenticated;
revoke execute on function public.end_game(text) from public;

-- ============================================================================
-- SECTION 5: REALTIME PUBLICATION
-- ============================================================================
-- Tables must be in the supabase_realtime publication for postgres_changes
-- to fire. Idempotent — `add table` on an already-published table is a no-op
-- error in some Postgres versions, so we wrap each in DO $$ BEGIN ... END $$
-- to swallow the duplicate_object exception.

do $$ begin
  alter publication supabase_realtime add table public.game_rooms;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.room_players;
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- SECTION 6: SPIKE TEST INFRASTRUCTURE — _spike_* tables + helpers
-- ============================================================================
--
-- These mirror the production tables but in a sandbox so spike-1 and spike-2
-- can exercise the realtime / FOR UPDATE machinery without touching live
-- game state. Each spike iteration uses crypto.randomUUID() for room IDs to
-- keep concurrent runs isolated.
--
-- The spike scripts live at:
--   scripts/spike-1-realtime.mjs    — validates two postgres_changes filters
--                                     on one channel + REPLICA IDENTITY FULL
--   scripts/spike-2-advance-race.mjs — validates the FOR UPDATE +
--                                       expected_question gate under
--                                       concurrent calls
--
-- Both run nightly via .github/workflows/spike-nightly.yml against this
-- staging project. See scripts/README.md for ops details.
-- ============================================================================

-- ─── _spike_room ───────────────────────────────────────────────────────────
create table if not exists public._spike_room (
  id                uuid primary key,
  current_question  integer not null default 0,
  state             text not null default 'lobby'
);

alter table public._spike_room replica identity full;
revoke truncate, references, trigger on table public._spike_room from anon, authenticated;
revoke select, insert, update, delete on table public._spike_room from anon;

alter table public._spike_room enable row level security;
drop policy if exists "spike: read all" on public._spike_room;
create policy "spike: read all" on public._spike_room
  for select to authenticated using (true);
-- Writes go through _spike_write SECURITY DEFINER — no INSERT/UPDATE/DELETE policy needed.

do $$ begin
  alter publication supabase_realtime add table public._spike_room;
exception when duplicate_object then null;
end $$;

-- ─── _spike_player ─────────────────────────────────────────────────────────
create table if not exists public._spike_player (
  room_id             uuid not null references public._spike_room(id) on delete cascade,
  user_id             uuid not null default auth.uid(),
  score               integer not null default 0,
  answered_question   integer not null default -1,
  joined_at           timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public._spike_player replica identity full;
revoke truncate, references, trigger on table public._spike_player from anon, authenticated;
revoke select, insert, update, delete on table public._spike_player from anon;

alter table public._spike_player enable row level security;
drop policy if exists "spike: read all" on public._spike_player;
create policy "spike: read all" on public._spike_player
  for select to authenticated using (true);

do $$ begin
  alter publication supabase_realtime add table public._spike_player;
exception when duplicate_object then null;
end $$;

-- ─── _spike_write ──────────────────────────────────────────────────────────
-- Generic write helper used by spike-1. Routes (op, target, payload) to the
-- appropriate table. Dispatch is deliberately simple — spikes are not
-- production code.

create or replace function public._spike_write(
  p_op text,
  p_target text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_room_id uuid;
  v_user_id uuid;
begin
  if p_target = 'room' then
    v_id := (p_payload->>'id')::uuid;
    if p_op = 'insert' then
      insert into public._spike_room (id, current_question, state)
      values (
        v_id,
        coalesce((p_payload->>'current_question')::integer, 0),
        coalesce(p_payload->>'state', 'lobby')
      );
    elsif p_op = 'update' then
      update public._spike_room set
        current_question = coalesce((p_payload->>'current_question')::integer, current_question),
        state = coalesce(p_payload->>'state', state)
      where id = v_id;
    elsif p_op = 'delete' then
      delete from public._spike_room where id = v_id;
    end if;
  elsif p_target = 'player' then
    v_room_id := (p_payload->>'room_id')::uuid;
    v_user_id := coalesce((p_payload->>'user_id')::uuid, auth.uid());
    if p_op = 'insert' then
      insert into public._spike_player (room_id, user_id, score, answered_question)
      values (
        v_room_id,
        v_user_id,
        coalesce((p_payload->>'score')::integer, 0),
        coalesce((p_payload->>'answered_question')::integer, -1)
      );
    elsif p_op = 'update' then
      update public._spike_player set
        score = coalesce((p_payload->>'score')::integer, score),
        answered_question = coalesce((p_payload->>'answered_question')::integer, answered_question)
      where room_id = v_room_id and user_id = v_user_id;
    elsif p_op = 'delete' then
      delete from public._spike_player
      where room_id = v_room_id and user_id = v_user_id;
    end if;
  end if;
end;
$$;

grant execute on function public._spike_write(text, text, jsonb) to authenticated;
revoke execute on function public._spike_write(text, text, jsonb) from public;

-- ─── _spike_advance ────────────────────────────────────────────────────────
-- Mirrors advance_question's FOR UPDATE + expected_question gate, plus a
-- pg_sleep(0.05) BEFORE the gate check so concurrent callers race observably
-- (forces serialization on the row lock to be visible in the spike).

create or replace function public._spike_advance(
  p_room_id uuid,
  p_expected_question integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room _spike_room%rowtype;
begin
  -- Take the row lock first, THEN sleep — so all callers serialize on the
  -- lock and only the first caller to acquire it sees the original
  -- current_question value.
  select * into v_room from public._spike_room where id = p_room_id for update;
  if not found then
    return jsonb_build_object('advanced', false, 'reason', 'no_room');
  end if;

  perform pg_sleep(0.05);  -- artificial widen-the-window for deterministic race

  if v_room.current_question <> p_expected_question then
    return jsonb_build_object(
      'advanced', false,
      'reason', 'expected_mismatch',
      'current_question', v_room.current_question
    );
  end if;

  update public._spike_room set current_question = current_question + 1
  where id = p_room_id;

  return jsonb_build_object('advanced', true, 'current_question', v_room.current_question + 1);
end;
$$;

grant execute on function public._spike_advance(uuid, integer) to authenticated;
revoke execute on function public._spike_advance(uuid, integer) from public;

-- ============================================================================
-- POST-APPLY VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to confirm the contract is in place.
-- Each should return the indicated row count or shape.
-- ============================================================================

-- 1. Tables exist with REPLICA IDENTITY FULL:
-- ┌─────────────────────┬──────────────────┐
-- │ relname             │ replica_identity │
-- ├─────────────────────┼──────────────────┤
-- │ game_rooms          │ f                │  -- 'f' = FULL
-- │ room_players        │ f                │
-- │ _spike_room         │ f                │
-- │ _spike_player       │ f                │
-- └─────────────────────┴──────────────────┘
--
-- select c.relname, c.relreplident as replica_identity
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relname in ('game_rooms','room_players','_spike_room','_spike_player');

-- 2. RPC grants — should NOT include PUBLIC:
--
-- select r.routine_name, p.grantee, p.privilege_type
-- from information_schema.routine_privileges p
-- join information_schema.routines r on r.specific_name = p.specific_name
-- where r.routine_schema = 'public'
--   and r.routine_name in (
--     'create_room','join_room','start_game','submit_answer',
--     'advance_question','leave_room','end_game',
--     'is_room_member','_spike_write','_spike_advance'
--   )
-- order by r.routine_name, p.grantee;
--
-- Expected grantees per function: authenticated + the function-owner role
-- (typically postgres). NEVER PUBLIC.

-- 3. Realtime publication includes the 4 tables:
--
-- select schemaname, tablename
-- from pg_publication_tables
-- where pubname = 'supabase_realtime'
--   and schemaname = 'public'
--   and tablename in ('game_rooms','room_players','_spike_room','_spike_player');

-- 4. Smoke-test the spikes (after creating a test user account):
--
-- $ SPIKE_SUPABASE_URL=https://<staging>.supabase.co \
--   SPIKE_SUPABASE_ANON_KEY=<anon> \
--   SPIKE_SUPABASE_SERVICE_ROLE_KEY=<service> \
--   SPIKE_TEST_USER_EMAIL=<test-user@example.com> \
--   npm run test:spikes
--
-- Both spikes should exit 0 with "PASS" in their output. If either fails,
-- diff the failing function body against this file and against production.

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
