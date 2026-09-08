-- ── WHY ──────────────────────────────────────────────────────────────────────
-- v1_3_mp_reveal_picks gave submit_answer a guard: a timeout submits -1, and
-- `if p_answer_idx is not null and p_answer_idx >= 0` kept that -1 OUT of
-- room_answers so the reveal never showed a phantom pick. Prod does not have it
-- (bloodhound 2026-09-08; pg_get_functiondef shows an unconditional insert) — a
-- later re-declaration dropped the guard, and every timeout since has written
-- answer_idx = -1 as a real pick. This re-applies the repo body verbatim.
create or replace function public.submit_answer(p_code text, p_question_idx integer, p_answer_idx integer, p_lock_time integer)
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
  v_server_lock_time int;
  v_new_streak   int;
  v_elim_at      int;
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

  if v_room.mode = 'survival' and v_player.eliminated_at_q is not null then
    update public.room_players
    set answered_question = p_question_idx
    where room_id = v_room.id and user_id = v_uid;
    return jsonb_build_object('accepted', true, 'correct', false,
      'eliminated', true, 'eliminated_at_q', v_player.eliminated_at_q,
      'score_delta', 0, 'new_score', v_player.score, 'server_lock_time', 0);
  end if;

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

  v_new_streak := case when v_is_correct then v_player.streak + 1 else 0 end;

  v_elim_at := v_player.eliminated_at_q;
  if v_room.mode = 'survival' and not v_is_correct then
    v_elim_at := p_question_idx;
  end if;

  update public.room_players
  set score              = score + v_score_delta,
      answered_question  = p_question_idx,
      streak             = v_new_streak,
      best_streak        = greatest(best_streak, v_new_streak),
      eliminated_at_q    = v_elim_at
  where room_id = v_room.id and user_id = v_uid;

  -- NEW: record the pick for the reveal. Timeouts submit -1 and are skipped —
  -- "ran out of time" is already conveyed by answered_question, and a -1 would
  -- render as a phantom option.
  if p_answer_idx is not null and p_answer_idx >= 0 then
    insert into public.room_answers (room_id, question_idx, user_id, answer_idx)
    values (v_room.id, p_question_idx, v_uid, p_answer_idx)
    on conflict (room_id, question_idx, user_id) do nothing;
  end if;

  return jsonb_build_object(
    'accepted', true, 'correct', v_is_correct,
    'score_delta', v_score_delta, 'new_score', v_player.score + v_score_delta,
    'streak', v_new_streak, 'best_streak', greatest(v_player.best_streak, v_new_streak),
    'eliminated', v_elim_at is not null, 'eliminated_at_q', v_elim_at,
    'server_lock_time', v_server_lock_time
  );
end;
$function$;
