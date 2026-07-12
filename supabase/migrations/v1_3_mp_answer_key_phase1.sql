-- MP answer-key hardening — PHASE 1 (APPLIED TO PROD 2026-07-13 via connector,
-- migration name v1_3_mp_answer_key_phase1). This file is the canonical copy.
--
-- Medical findings addressed:
--   * security-backend (medium): the correct-answer index for every MP question
--     lived in game_rooms.questions, which members SELECT wholesale and which
--     realtime rebroadcasts as WHOLE ROWS on every question transition — any
--     player could read every answer from dev tools.
--   * multiplayer-realtime (medium): survival ghost-elimination had no time
--     gate — a host answering then instantly advancing eliminated everyone who
--     hadn't answered within seconds.
--
-- DESIGN (from the agent-verified client-dependency sweep):
--   The client reads questions[].correct in EXACTLY ONE place — the reveal
--   highlight (OnlineMultiplayer QuestionView). submit_answer's response CANNOT
--   power it (eliminated spectators + late joiners never call it; timeout
--   players submit -1). So the reveal needs a member-callable, closed-gated
--   disclosure RPC. And because realtime ships whole rows (column grants don't
--   filter broadcasts), the key must live OUTSIDE game_rooms: room_answer_keys.
--
-- PHASE 1 (this file, additive — old clients unaffected). Client change ships
-- in the same deploy: QuestionView reads question.correct ?? RPC result, and
-- wrong-marking waits until the correct index is known.
--
-- PHASE 2 (LATER — gate on native adoption of builds >= 1.3.1(43)): stop
-- embedding `correct` in start_game's stored questions jsonb. Old native
-- clients read questions[].correct for the reveal; stripping while they are
-- common would silently corrupt their reveal colors (own correct pick renders
-- as a red X). Requires a 2-device MP smoke test when flipped.
--
-- HONESTY NOTE: the full question bank (with answers) ships inside every client
-- bundle for offline play, so a determined cheater can text-match prompts
-- against their local copy regardless. This closes the trivial
-- read-the-room-payload cheat; true answer secrecy needs a server-side bank
-- (future architecture, not mid-launch).

-- 1 ── answer-key table: no client grants, RLS on with no policies.
create table if not exists public.room_answer_keys (
  room_id uuid primary key references public.game_rooms(id) on delete cascade,
  keys    jsonb not null
);
alter table public.room_answer_keys enable row level security;
revoke all on public.room_answer_keys from public;
revoke all on public.room_answer_keys from anon;
revoke all on public.room_answer_keys from authenticated;

-- 2 ── start_game v2: byte-identical to live (verified via pg_get_functiondef
-- before replace) + the dual-write block.
create or replace function public.start_game(p_code text, p_questions jsonb, p_capacity integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid   uuid := auth.uid();
  v_room  public.game_rooms%rowtype;
  v_count int;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;

  select * into v_room from public.game_rooms where code = p_code for update;
  if not found then raise exception 'room not found: %', p_code using errcode = 'P0002'; end if;
  if v_room.host_id != v_uid then raise exception 'only the host can start the game' using errcode = '42501'; end if;
  if v_room.state != 'lobby' then raise exception 'room is not in lobby (state=%)', v_room.state using errcode = '42P01'; end if;

  if jsonb_typeof(p_questions) != 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'questions must be a non-empty array' using errcode = '22023';
  end if;

  select count(*) into v_count from public.room_players where room_id = v_room.id;
  if v_count != p_capacity then
    return jsonb_build_object(
      'started', false, 'reason', 'roster_changed',
      'current_count', v_count, 'expected_count', p_capacity
    );
  end if;

  update public.game_rooms
  set state = 'playing',
      current_question = 0,
      questions = p_questions,
      started_at = now(),
      current_question_started_at = now()
  where id = v_room.id;

  -- Phase 1 dual-write: answer key into the non-broadcast table. Phase 2 will
  -- additionally strip `correct` from the questions jsonb stored above.
  insert into public.room_answer_keys (room_id, keys)
  select v_room.id,
         coalesce(jsonb_agg((q.value ->> 'correct')::int order by q.ordinality), '[]'::jsonb)
  from jsonb_array_elements(p_questions) with ordinality q
  on conflict (room_id) do update set keys = excluded.keys;

  return jsonb_build_object(
    'started', true, 'room_id', v_room.id,
    'question_count', jsonb_array_length(p_questions)
  );
end;
$function$;

-- 3 ── reveal_question: post-close disclosure of the correct index.
create or replace function public.reveal_question(p_code text, p_question_idx integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid        uuid := auth.uid();
  v_room       public.game_rooms%rowtype;
  v_correct    int;
  v_unanswered int;
  v_closed     boolean := false;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;

  select * into v_room from public.game_rooms where code = p_code;
  if not found then raise exception 'room not found: %', p_code using errcode = 'P0002'; end if;
  if not exists (select 1 from public.room_players where room_id = v_room.id and user_id = v_uid) then
    raise exception 'caller not in this room' using errcode = '42501';
  end if;
  if p_question_idx is null or p_question_idx < 0
     or p_question_idx >= jsonb_array_length(v_room.questions) then
    raise exception 'question index out of range' using errcode = '22023';
  end if;

  -- Closed when: the room ended, play moved past this question, every living
  -- player answered it, or the server wall clock for it expired (19.5s margin
  -- under the 20s question duration absorbs clock drift).
  if v_room.state = 'ended' or v_room.current_question > p_question_idx then
    v_closed := true;
  elsif v_room.current_question = p_question_idx then
    select count(*) into v_unanswered
    from public.room_players
    where room_id = v_room.id
      and answered_question < p_question_idx
      and (v_room.mode <> 'survival' or eliminated_at_q is null);
    if v_unanswered = 0 then
      v_closed := true;
    elsif v_room.current_question_started_at is not null
      and now() >= v_room.current_question_started_at + interval '19.5 seconds' then
      v_closed := true;
    end if;
  end if;

  if not v_closed then
    return jsonb_build_object('revealed', false, 'reason', 'question_open');
  end if;

  select (k.keys ->> p_question_idx)::int into v_correct
  from public.room_answer_keys k
  where k.room_id = v_room.id;
  if v_correct is null then
    -- Rooms started before this migration keep their embedded key.
    v_correct := (v_room.questions -> p_question_idx ->> 'correct')::int;
  end if;

  return jsonb_build_object('revealed', true, 'correct', v_correct);
end;
$function$;

revoke execute on function public.reveal_question(text, integer) from public;
revoke execute on function public.reveal_question(text, integer) from anon;
grant  execute on function public.reveal_question(text, integer) to authenticated;

-- 4 ── advance_question v2: byte-identical to live + the ghost-elimination
-- time gate (kills the "answer then instantly advance" wipe exploit).
create or replace function public.advance_question(p_code text, p_expected_question integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid             uuid := auth.uid();
  v_room            public.game_rooms%rowtype;
  v_total_questions int;
  v_alive           int;
  v_players         int;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;

  select * into v_room from public.game_rooms where code = p_code for update;
  if not found then raise exception 'room not found: %', p_code using errcode = 'P0002'; end if;
  if v_room.host_id != v_uid then raise exception 'only the host can advance' using errcode = '42501'; end if;
  if v_room.state != 'playing' then raise exception 'room is not in playing state' using errcode = '42P01'; end if;

  if v_room.current_question != p_expected_question then
    return jsonb_build_object(
      'advanced', false, 'current_question', v_room.current_question,
      'state', v_room.state, 'reason', 'expected_mismatch'
    );
  end if;

  if v_room.mode = 'survival' then
    -- Ghost elimination: leaving question N without an answer knocks you out
    -- on N, the same as answering it wrong. TIME GATE (2026-07-13 medical):
    -- only eliminate when the question genuinely closed — i.e. its 20s wall
    -- clock ran out (19.5s margin for drift). If every living player already
    -- answered, the UPDATE matches nobody regardless, so an early legit
    -- advance is unaffected; an exploitative early advance now eliminates
    -- no one instead of wiping the lobby.
    if v_room.current_question_started_at is null
       or now() >= v_room.current_question_started_at + interval '19.5 seconds' then
      update public.room_players
      set eliminated_at_q = v_room.current_question
      where room_id = v_room.id
        and eliminated_at_q is null
        and answered_question < v_room.current_question;
    end if;

    select count(*) filter (where eliminated_at_q is null), count(*)
    into v_alive, v_players
    from public.room_players
    where room_id = v_room.id;

    -- Early end: the outcome is settled once <=1 player is alive. Guard on
    -- 2+ players so a hypothetical solo room can't end on its first advance.
    if v_players >= 2 and v_alive <= 1 then
      update public.game_rooms
      set current_question = current_question + 1,
          state = 'ended',
          ended_at = now(),
          current_question_started_at = null
      where id = v_room.id;
      return jsonb_build_object(
        'advanced', true, 'current_question', v_room.current_question + 1,
        'state', 'ended', 'reason', 'survival_decided'
      );
    end if;
  end if;

  v_total_questions := jsonb_array_length(v_room.questions);

  if v_room.current_question + 1 >= v_total_questions then
    -- Game complete: no per-question timer needed; clear it for cleanliness.
    update public.game_rooms
    set current_question = current_question + 1,
        state = 'ended',
        ended_at = now(),
        current_question_started_at = null
    where id = v_room.id;
    return jsonb_build_object(
      'advanced', true, 'current_question', v_room.current_question + 1,
      'state', 'ended', 'reason', 'game_complete'
    );
  end if;

  update public.game_rooms
  set current_question = current_question + 1,
      current_question_started_at = now()
  where id = v_room.id;

  return jsonb_build_object(
    'advanced', true, 'current_question', v_room.current_question + 1,
    'state', 'playing', 'reason', 'advanced'
  );
end;
$function$;
