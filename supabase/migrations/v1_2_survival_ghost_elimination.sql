-- 1.2 Survival integrity — ghost elimination + early end (server-side).
--
-- Two production failure modes in Survival, both fixed inside advance_question
-- so every existing client benefits the moment this deploys (no app build):
--
--   1. GHOSTS: a backgrounded/disconnected player never calls submit_answer,
--      so nothing ever sets their eliminated_at_q — they stay "alive" through
--      the whole game and get crowned winner on every real survivor's screen.
--      Now: advancing past question N first eliminates any still-alive player
--      who didn't answer N (answered_question is monotonically advanced by
--      submit_answer for alive AND eliminated players, so < N means "never
--      answered N"). A timeout without an answer is an elimination on N,
--      exactly like a wrong answer — correct Survival semantics.
--
--   2. LATE END: the game previously ended only at question exhaustion (or
--      the client's all-eliminated check), forcing a mathematically decided
--      game to grind through remaining questions. Now: the game ends as soon
--      as <=1 player remains alive in a 2+ player room (0 alive covers the
--      total-wipe draw; the client's ended ranking by eliminated_at_q is
--      unchanged and handles both).
--
-- Race + Hot Streak paths are untouched (all new logic gates on
-- mode = 'survival'). Everything else is byte-identical to the prior
-- definition from sprint92_ggg1_3_wall_clock_server_timer.sql.

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
    -- on N, the same as answering it wrong.
    update public.room_players
    set eliminated_at_q = v_room.current_question
    where room_id = v_room.id
      and eliminated_at_q is null
      and answered_question < v_room.current_question;

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

grant execute on function public.advance_question(text, integer) to authenticated;
revoke execute on function public.advance_question(text, integer) from public, anon;
