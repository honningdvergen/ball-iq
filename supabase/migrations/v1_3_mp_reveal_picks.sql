-- v1_3_mp_reveal_picks.sql
--
-- GOAL: at the reveal, show what each opponent answered — the other half of
-- the MP reveal moment (the scoreboard freeze shipped in 8af449a).
--
-- WHY A NEW TABLE INSTEAD OF A COLUMN ON room_players
-- room_players is SELECT-able by any room member (policy: is_room_member).
-- Putting the pick there would let a modified client poll opponents' answers
-- BEFORE answering — if three of four peers picked B, that is a strong hint.
-- That would undercut the answer-key hardening in v1_3_mp_answer_key_phase1,
-- which deliberately keeps keys in room_answer_keys with ZERO client grants,
-- disclosed only through the gated reveal_question RPC.
--
-- So picks live in their own grant-less table and are disclosed by the SAME
-- RPC, inheriting its "question is closed" gate for free. A client can never
-- read a pick earlier than it can already read the correct answer.
--
-- A column on room_players was also rejected for a second reason: the app
-- selects room_players with `*`, and column-level grants would have required
-- revoking table SELECT and re-granting every column by name — one forgotten
-- column silently breaks the lobby.

create table if not exists public.room_answers (
  room_id      uuid not null references public.game_rooms(id) on delete cascade,
  question_idx int  not null,
  user_id      uuid not null,
  answer_idx   int  not null,
  answered_at  timestamptz not null default now(),
  primary key (room_id, question_idx, user_id)
);

comment on table public.room_answers is
  'Per-question MP picks. NO client grants by design — readable only via the reveal_question RPC, which gates on the question being closed. Mirrors room_answer_keys.';

create index if not exists room_answers_room_q_idx
  on public.room_answers (room_id, question_idx);

-- supabase_admin's defaults hand anon full DML on new public tables, so the
-- REVOKE has to be explicit and total. RLS is belt-and-braces on top: with no
-- grants and no policies, nothing but SECURITY DEFINER functions can touch it.
alter table public.room_answers enable row level security;

revoke all on public.room_answers from anon;
revoke all on public.room_answers from authenticated;
revoke all on public.room_answers from public;

-- ── submit_answer ──────────────────────────────────────────────────────────
-- Body is the SHIPPED implementation verbatim (scoring, streaks, survival
-- elimination, already_answered, server_lock_time all unchanged). The ONLY
-- addition is the room_answers insert, placed after the score UPDATE so a
-- failure recording the pick can never cost a player their points, and
-- ON CONFLICT DO NOTHING so a retry or double-tap cannot overwrite a locked
-- pick — "first answer wins" is preserved.
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

revoke execute on function public.submit_answer(text, integer, integer, integer) from public;
revoke execute on function public.submit_answer(text, integer, integer, integer) from anon;
grant  execute on function public.submit_answer(text, integer, integer, integer) to authenticated;

-- ── reveal_question ────────────────────────────────────────────────────────
-- Body is the SHIPPED implementation verbatim. The ONLY addition is `picks` in
-- the success return — placed AFTER the v_closed gate, so picks are never
-- disclosed any earlier than the correct answer already is.
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
  v_picks      jsonb;
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

  -- NEW: every pick for this question, as {user_id: answer_idx}. Players who
  -- timed out simply have no entry.
  select coalesce(jsonb_object_agg(user_id::text, answer_idx), '{}'::jsonb)
  into v_picks
  from public.room_answers
  where room_id = v_room.id and question_idx = p_question_idx;

  return jsonb_build_object('revealed', true, 'correct', v_correct, 'picks', v_picks);
end;
$function$;

revoke execute on function public.reveal_question(text, integer) from public;
revoke execute on function public.reveal_question(text, integer) from anon;
grant  execute on function public.reveal_question(text, integer) to authenticated;
