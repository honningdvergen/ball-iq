-- 1.1 Multiplayer — Hot Streak H2H mode (streak overlay on the synchronized race).
--
-- Additive + backward-compatible: `mode` defaults to 'race', so existing games
-- behave exactly as before. submit_answer now also maintains a per-player
-- consecutive-correct streak (and best_streak); points still accrue unchanged
-- as the Hot-Streak tiebreak. A host-only set_room_mode RPC lets the host pick
-- the mode in the lobby (broadcast to joiners via the existing game_rooms
-- realtime). NOT YET DEPLOYED — deploy together with the client + 2-device test,
-- since submit_answer is the timer-critical hot path.

-- ── schema ──────────────────────────────────────────────────────────────────
alter table public.game_rooms  add column if not exists mode text not null default 'race';
alter table public.game_rooms  add constraint game_rooms_mode_chk check (mode in ('race','hotstreak')) not valid;
alter table public.room_players add column if not exists streak      int not null default 0;
alter table public.room_players add column if not exists best_streak int not null default 0;

-- ── host picks the mode in the lobby ────────────────────────────────────────
create or replace function public.set_room_mode(p_code text, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid  uuid := auth.uid();
  v_room public.game_rooms%rowtype;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_mode not in ('race','hotstreak') then raise exception 'invalid mode: %', p_mode using errcode = '22023'; end if;
  select * into v_room from public.game_rooms where code = p_code for update;
  if not found then raise exception 'room not found: %', p_code using errcode = 'P0002'; end if;
  if v_room.host_id != v_uid then raise exception 'only the host can set the mode' using errcode = '42501'; end if;
  if v_room.state != 'lobby' then raise exception 'mode can only change in the lobby (state=%)', v_room.state using errcode = '42P01'; end if;
  update public.game_rooms set mode = p_mode where id = v_room.id;
  return jsonb_build_object('ok', true, 'mode', p_mode);
end;
$function$;

grant execute on function public.set_room_mode(text, text) to authenticated;
revoke execute on function public.set_room_mode(text, text) from public, anon;

-- ── submit_answer: same scoring, plus streak tracking ───────────────────────
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

  -- Streak: chain++ on correct (reset to 0 on wrong); best_streak is the high-water mark.
  v_new_streak := case when v_is_correct then v_player.streak + 1 else 0 end;

  update public.room_players
  set score              = score + v_score_delta,
      answered_question  = p_question_idx,
      streak             = v_new_streak,
      best_streak        = greatest(best_streak, v_new_streak)
  where room_id = v_room.id and user_id = v_uid;

  return jsonb_build_object(
    'accepted', true, 'correct', v_is_correct,
    'score_delta', v_score_delta, 'new_score', v_player.score + v_score_delta,
    'streak', v_new_streak, 'best_streak', greatest(v_player.best_streak, v_new_streak),
    'server_lock_time', v_server_lock_time
  );
end;
$function$;

grant execute on function public.submit_answer(text, integer, integer, integer) to authenticated;
revoke execute on function public.submit_answer(text, integer, integer, integer) from public, anon;
