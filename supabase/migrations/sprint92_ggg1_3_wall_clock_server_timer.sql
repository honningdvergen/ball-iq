-- ============================================================================
-- Sprint #92 GGG1 #3 — wall-clock server-side question timer
-- ============================================================================
--
-- Today's flow: client supplies p_lock_time (ms since question started)
-- when submitting; submit_answer trusts this value verbatim for score
-- computation. A malicious client can send p_lock_time=0 and earn the
-- max_score=1000 every question regardless of how long they actually took.
-- Client-side wall-clock anchors (Sprint #91 FFF2 Date.now() swap) only
-- protect honest clients from iOS WKWebView background-suspend skew —
-- they don't prevent intentional spoofing.
--
-- Fix: track current_question_started_at on game_rooms, set it from
-- start_game and advance_question, and compute lock_time SERVER-SIDE in
-- submit_answer using NOW() - current_question_started_at. The client's
-- p_lock_time becomes a telemetry-only hint; scoring uses the trusted
-- server value.
--
-- Side effects:
--   - Realtime payload latency (typically 50-200ms) means the client's
--     perceived question start is slightly after the server's stored
--     timestamp. Server-computed lock_time will be slightly higher than
--     what the client computed → slightly lower score than client
--     anticipated. Fair (same penalty for every player; rewards the
--     network roundtrip equally) and consistent across the table.
--   - Existing 'playing' rooms with NULL current_question_started_at
--     fall back to client p_lock_time so an in-flight game doesn't
--     break mid-round when this migration applies.
--
-- ─── DIFF SUMMARY ──────────────────────────────────────────────────────────
--   Schema:
--     game_rooms      + current_question_started_at TIMESTAMPTZ (nullable)
--   Functions:
--     start_game      UPDATE adds: current_question_started_at = now()
--     advance_question (non-end branch) UPDATE adds: current_question_started_at = now()
--                      (game_complete branch unchanged — no timer needed once ended)
--     submit_answer   computes v_server_lock_time from
--                      now() - v_room.current_question_started_at; clamps to
--                      [0, v_question_dur]; falls back to p_lock_time if
--                      timer column is NULL (legacy in-flight rooms)
-- ============================================================================

alter table public.game_rooms
  add column if not exists current_question_started_at timestamptz;

-- ─── start_game ──────────────────────────────────────────────────────────────
create or replace function public.start_game(
  p_code      text,
  p_questions jsonb,
  p_capacity  integer
)
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
      current_question_started_at = now()  -- Sprint #92 GGG1 #3
  where id = v_room.id;

  return jsonb_build_object(
    'started', true, 'room_id', v_room.id,
    'question_count', jsonb_array_length(p_questions)
  );
end;
$function$;

grant execute on function public.start_game(text, jsonb, integer) to authenticated;
revoke execute on function public.start_game(text, jsonb, integer) from public;

-- ─── advance_question ────────────────────────────────────────────────────────
create or replace function public.advance_question(
  p_code              text,
  p_expected_question integer
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid             uuid := auth.uid();
  v_room            public.game_rooms%rowtype;
  v_total_questions int;
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

  v_total_questions := jsonb_array_length(v_room.questions);

  if v_room.current_question + 1 >= v_total_questions then
    -- Game complete: no per-question timer needed; clear it for cleanliness.
    update public.game_rooms
    set current_question = current_question + 1,
        state = 'ended',
        ended_at = now(),
        current_question_started_at = null  -- Sprint #92 GGG1 #3
    where id = v_room.id;
    return jsonb_build_object(
      'advanced', true, 'current_question', v_room.current_question + 1,
      'state', 'ended', 'reason', 'game_complete'
    );
  end if;

  update public.game_rooms
  set current_question = current_question + 1,
      current_question_started_at = now()  -- Sprint #92 GGG1 #3
  where id = v_room.id;

  return jsonb_build_object(
    'advanced', true, 'current_question', v_room.current_question + 1,
    'state', 'playing', 'reason', 'advanced'
  );
end;
$function$;

grant execute on function public.advance_question(text, integer) to authenticated;
revoke execute on function public.advance_question(text, integer) from public;

-- ─── submit_answer ───────────────────────────────────────────────────────────
create or replace function public.submit_answer(
  p_code         text,
  p_question_idx integer,
  p_answer_idx   integer,
  p_lock_time    integer
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid          uuid := auth.uid();
  v_room         public.game_rooms%rowtype;
  v_player       public.room_players%rowtype;
  v_correct_idx  int;
  v_score_delta  int := 0;
  v_is_correct   boolean := false;
  v_question_dur int := 20000;
  v_max_score    int := 1000;
  v_min_score    int := 100;
  v_server_lock_time int;  -- Sprint #92 GGG1 #3
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;

  select * into v_room from public.game_rooms where code = p_code;
  if not found then raise exception 'room not found: %', p_code using errcode = 'P0002'; end if;
  if v_room.state != 'playing' then
    raise exception 'room is not in playing state (state=%)', v_room.state using errcode = '42P01';
  end if;

  if p_question_idx != v_room.current_question then
    return jsonb_build_object('accepted', false, 'reason', 'question_idx_mismatch',
      'current_question', v_room.current_question);
  end if;

  select * into v_player from public.room_players
  where room_id = v_room.id and user_id = v_uid
  for update;
  if not found then raise exception 'caller not in this room' using errcode = '42501'; end if;

  if v_player.answered_question >= p_question_idx then
    return jsonb_build_object('accepted', false, 'reason', 'already_answered',
      'current_score', v_player.score);
  end if;

  -- Sprint #92 GGG1 #3: compute lock_time SERVER-SIDE from the wall-clock
  -- delta between current_question_started_at (set by start_game /
  -- advance_question) and NOW(). Clamped to [0, v_question_dur]. Falls back
  -- to client-supplied p_lock_time when the timer column is NULL — only
  -- possible for rooms that started under the pre-migration schema and
  -- are still mid-round.
  if v_room.current_question_started_at is not null then
    v_server_lock_time := greatest(
      0,
      least(
        v_question_dur,
        (extract(epoch from (now() - v_room.current_question_started_at)) * 1000)::int
      )
    );
  else
    v_server_lock_time := greatest(0, least(v_question_dur, p_lock_time));
  end if;

  v_correct_idx := (v_room.questions -> p_question_idx ->> 'correct')::int;
  v_is_correct := (p_answer_idx = v_correct_idx);
  if v_is_correct then
    v_score_delta := greatest(
      v_min_score,
      v_max_score - ((v_max_score - v_min_score) * v_server_lock_time) / v_question_dur
    );
  end if;

  update public.room_players
  set score = score + v_score_delta, answered_question = p_question_idx
  where room_id = v_room.id and user_id = v_uid;

  return jsonb_build_object(
    'accepted', true, 'correct', v_is_correct,
    'score_delta', v_score_delta, 'new_score', v_player.score + v_score_delta,
    'server_lock_time', v_server_lock_time  -- telemetry: client can compare to its p_lock_time
  );
end;
$function$;

grant execute on function public.submit_answer(text, integer, integer, integer) to authenticated;
revoke execute on function public.submit_answer(text, integer, integer, integer) from public;
