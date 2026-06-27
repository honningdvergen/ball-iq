-- 1.1 Multiplayer — Survival Duel (elimination overlay on the synchronized race).
--
-- Additive + backward-compatible. Adds 'survival' as a third game mode. A wrong
-- answer eliminates the player (eliminated_at_q records the 0-based question they
-- fell on; null = still alive). Score + streak still accrue WHILE ALIVE so they
-- stay a fair tiebreak, but freeze the moment you're out. Race + Hot Streak
-- scoring are completely unchanged (the survival branches only fire when
-- game_rooms.mode = 'survival'). Deploy together with the client + 2-device test,
-- since submit_answer is the timer-critical hot path.

-- ── schema ──────────────────────────────────────────────────────────────────
-- Re-state the mode check to allow 'survival'. The hotstreak constraint was
-- added NOT VALID; drop + re-add covering all three modes (still NOT VALID so we
-- don't scan existing rows — every existing row is 'race' anyway).
alter table public.game_rooms drop constraint if exists game_rooms_mode_chk;
alter table public.game_rooms add constraint game_rooms_mode_chk
  check (mode in ('race','hotstreak','survival')) not valid;

-- null = still alive; otherwise the 0-based question index the player was knocked
-- out on. Defaults null so existing rows + new race/hotstreak players are "alive".
alter table public.room_players add column if not exists eliminated_at_q int;

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
  if p_mode not in ('race','hotstreak','survival') then raise exception 'invalid mode: %', p_mode using errcode = '22023'; end if;
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

-- ── submit_answer: race + hotstreak + survival ──────────────────────────────
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

  -- Survival: a player already knocked out is a spectator. Advance their
  -- answered_question marker so their client moves on, but freeze score/streak
  -- and leave them eliminated. (Race/hotstreak never set eliminated_at_q.)
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

  -- Streak: chain++ on correct (reset to 0 on wrong); best_streak is the high-water mark.
  v_new_streak := case when v_is_correct then v_player.streak + 1 else 0 end;

  -- Survival: a wrong answer from a still-alive player knocks them out on this
  -- question. Non-survival modes never set this (stays whatever it was — null).
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

  return jsonb_build_object(
    'accepted', true, 'correct', v_is_correct,
    'score_delta', v_score_delta, 'new_score', v_player.score + v_score_delta,
    'streak', v_new_streak, 'best_streak', greatest(v_player.best_streak, v_new_streak),
    'eliminated', v_elim_at is not null, 'eliminated_at_q', v_elim_at,
    'server_lock_time', v_server_lock_time
  );
end;
$function$;

grant execute on function public.submit_answer(text, integer, integer, integer) to authenticated;
revoke execute on function public.submit_answer(text, integer, integer, integer) from public, anon;
