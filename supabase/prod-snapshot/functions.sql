-- Prod function snapshot — blcisypmngimqkwxrrdm, captured 2026-07-14 via
-- pg_get_functiondef() over every function in schema public (30 total).
-- This is the LIVE source, including the 9 migrations that have no repo file.
-- See README.md for provenance and migrations-ledger.md for reconciliation.

CREATE OR REPLACE FUNCTION public.advance_question(p_code text, p_expected_question integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_room(p_capacity integer DEFAULT 10, p_name text DEFAULT 'Player'::text, p_avatar text DEFAULT '⚽'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid      uuid := auth.uid();
  v_code     text;
  v_room_id  uuid := gen_random_uuid();
  v_attempt  int  := 0;
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_capacity < 1 or p_capacity > 10 then
    raise exception 'capacity must be between 1 and 10' using errcode = '22023';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1);
    end loop;
    begin
      insert into public.game_rooms (id, code, host_id, capacity, state)
      values (v_room_id, v_code, v_uid, p_capacity, 'lobby');
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'failed to generate unique room code after 5 attempts';
      end if;
    end;
  end loop;

  insert into public.room_players (room_id, user_id, name, avatar)
  values (v_room_id, v_uid, p_name, p_avatar);

  return jsonb_build_object('room_id', v_room_id, 'code', v_code, 'capacity', p_capacity);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_game_state_for_new_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.user_game_state (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$function$
;

create or replace function public.delete_user_account()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Storage: avatar object (best-effort; never blocks the account delete)
  begin
    perform set_config('storage.allow_delete_query', 'true', true);
    delete from storage.objects
      where bucket_id = 'avatars' and name = v_uid || '.jpg';
    perform set_config('storage.allow_delete_query', 'false', true);
  exception when others then
    raise warning 'delete_user_account: avatar cleanup failed for %: %', v_uid, sqlerrm;
  end;

  -- Social graph + moderation state owned by the user
  delete from public.user_blocks
    where blocker_id = v_uid or blocked_id = v_uid;
  delete from public.friendships
    where requester_id = v_uid or addressee_id = v_uid;

  -- Async challenges: remove created challenges (row + challenger_name), and
  -- anonymise acceptances of others' challenges. Guarded so pre-async-challenge
  -- environments don't error on the missing table.
  begin
    delete from public.challenge_invites where challenger_id = v_uid;
    update public.challenge_invites
       set accepted_id = null, accepted_name = null,
           accepted_score = null, accepted_total = null, accepted_at = null
     where accepted_id = v_uid;
  exception when undefined_table then
    null; -- async challenges not deployed here
  end;

  -- Mates' leagues (v3_0). Leagues the user owns stay for the other members.
  delete from public.league_members    where user_id = v_uid;
  delete from public.league_results    where user_id = v_uid;
  delete from public.league_claims     where from_user = v_uid;
  delete from public.league_join_tries where user_id = v_uid;
  update public.leagues set owner_id = null where owner_id = v_uid;

  -- Game data (scores / user_game_state also CASCADE from profiles;
  -- explicit deletes kept for clarity + cascade-independence)
  delete from public.scores          where user_id = v_uid;
  delete from public.user_game_state where user_id = v_uid;
  delete from public.room_players    where user_id = v_uid;
  delete from public.game_rooms      where host_id = v_uid;

  -- Profile row
  delete from public.profiles where id = v_uid;

  -- The account itself — LAST, after all app data is gone.
  delete from auth.users where id = v_uid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.end_game(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid  uuid := auth.uid();
  v_room public.game_rooms%rowtype;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_room from public.game_rooms where code = p_code for update;
  if not found then raise exception 'room not found: %', p_code using errcode = 'P0002'; end if;
  if v_room.host_id != v_uid then raise exception 'only the host can end the game' using errcode = '42501'; end if;
  if v_room.state = 'ended' then
    return jsonb_build_object('ended', false, 'reason', 'already_ended');
  end if;
  update public.game_rooms set state = 'ended', ended_at = now() where id = v_room.id;
  return jsonb_build_object('ended', true, 'state', 'ended');
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_block_mask()
 RETURNS SETOF uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select blocked_id from public.user_blocks where blocker_id = auth.uid()
  union
  select blocker_id from public.user_blocks where blocked_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, username, avatar_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'player_' || substring(new.id::text from 1 for 8)),
    'ball'
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_score(user_id uuid, score_delta integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if user_id is distinct from auth.uid() then
    raise exception 'unauthorized';
  end if;
  update public.profiles
    set total_score = total_score + score_delta
    where id = user_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_xp(user_id uuid, xp_delta integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  UPDATE public.profiles
    SET xp = COALESCE(xp, 0) + xp_delta
    WHERE id = user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_profane_username(p_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare
  n text;
  w text;
  t text;
  terms text[] := array[
    'fuck','shit','cunt','bitch',
    'nigg','fag','faggot','tranny','kike','spic','chink','gook','wetback',
    'retard','rape','pedo','molest',
    'neger','judensau','fotze',
    'maricon','puto','pendejo',
    'pute','salope','pede','encule',
    'frocio','troia','stronzo',
    'viado','puta','bicha'
  ];
  whitelist text[] := array[
    'scunthorpe','penistone','arsenal','arshavin','mexes','esposito','shittu'
  ];
begin
  if p_name is null or btrim(p_name) = '' then
    return false;
  end if;
  n := lower(p_name);
  -- translate(): position-aligned map. src=@4310!$57 → tgt=aaeioisst
  --   @→a 4→a 3→e 1→i 0→o !→i $→s 5→s 7→t
  n := translate(n, '@4310!$57', 'aaeioisst');
  n := regexp_replace(n, '[^a-zà-ÿ]', '', 'g');
  foreach w in array whitelist loop
    n := replace(n, w, '_');
  end loop;
  foreach t in array terms loop
    if position(t in n) > 0 then
      return true;
    end if;
  end loop;
  return false;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_room_member(p_room_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.room_players
    where room_id = p_room_id and user_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.join_room(p_code text, p_name text, p_avatar text DEFAULT '⚽'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid    uuid := auth.uid();
  v_room   public.game_rooms%rowtype;
  v_count  int;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_room from public.game_rooms
  where code = p_code and state != 'ended'
  for update;

  if not found then
    raise exception 'room not found: %', p_code using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.room_players
    where room_id = v_room.id and user_id = v_uid
  ) then
    return jsonb_build_object(
      'room_id', v_room.id,
      'code',    v_room.code,
      'already_joined', true
    );
  end if;

  if v_room.state != 'lobby' then
    raise exception 'room is not accepting joins (state=%)', v_room.state
      using errcode = '42P01';
  end if;

  select count(*) into v_count from public.room_players where room_id = v_room.id;
  if v_count >= v_room.capacity then
    raise exception 'room is full (%/% players)', v_count, v_room.capacity
      using errcode = '53300';
  end if;

  insert into public.room_players (room_id, user_id, name, avatar)
  values (v_room.id, v_uid, p_name, p_avatar);

  return jsonb_build_object(
    'room_id', v_room.id,
    'code',    v_room.code,
    'already_joined', false
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.leave_room(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid       uuid := auth.uid();
  v_room      public.game_rooms%rowtype;
  v_remaining int;
  v_was_in    boolean;
begin
  if v_uid is null then raise exception 'authentication required' using errcode = '42501'; end if;

  select * into v_room from public.game_rooms
  where code = p_code and state != 'ended'
  for update;

  if not found then
    return jsonb_build_object('left', false, 'reason', 'room_not_found');
  end if;

  delete from public.room_players
  where room_id = v_room.id and user_id = v_uid
  returning true into v_was_in;

  if not v_was_in then
    return jsonb_build_object('left', false, 'reason', 'not_in_room');
  end if;

  if v_room.host_id = v_uid and v_room.state = 'lobby' then
    update public.game_rooms set state = 'ended', ended_at = now() where id = v_room.id;
    return jsonb_build_object('left', true, 'room_ended', true, 'reason', 'host_left_lobby');
  end if;

  select count(*) into v_remaining from public.room_players where room_id = v_room.id;
  if v_remaining = 0 then
    update public.game_rooms set state = 'ended', ended_at = now() where id = v_room.id;
    return jsonb_build_object('left', true, 'room_ended', true, 'reason', 'empty');
  end if;

  return jsonb_build_object('left', true, 'room_ended', false);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_friendship_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, type, actor_id, actor_name, actor_avatar, payload, read)
    select new.addressee_id, 'friend_request', new.requester_id, p.username, p.avatar_id,
           jsonb_build_object('friendship_id', new.id), true
    from public.profiles p where p.id = new.requester_id;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    insert into public.notifications (user_id, type, actor_id, actor_name, actor_avatar, payload, read)
    select new.requester_id, 'friend_accept', new.addressee_id, p.username, p.avatar_id,
           jsonb_build_object('friendship_id', new.id), true
    from public.profiles p where p.id = new.addressee_id;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.profiles_check_profanity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.username is not null and public.is_profane_username(new.username) then
    raise exception 'Username not allowed'
      using errcode = 'check_violation',
            hint = 'Choose a different username.';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reap_stale_rooms()
 RETURNS TABLE(ended integer, deleted integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_ended int; v_deleted int;
begin
  -- Force-end rooms abandoned in lobby/playing. A real match finishes in
  -- minutes, so >2h in a non-ended state = abandoned.
  update public.game_rooms
     set state = 'ended', ended_at = coalesce(ended_at, now())
   where state <> 'ended'
     and created_at < now() - interval '2 hours';
  get diagnostics v_ended = row_count;

  -- Prune long-finished rooms (room_players cascade) to bound table growth.
  delete from public.game_rooms
   where state = 'ended'
     and coalesce(ended_at, created_at) < now() - interval '7 days';
  get diagnostics v_deleted = row_count;

  return query select v_ended, v_deleted;
end $function$
;

CREATE OR REPLACE FUNCTION public.register_device_token(p_token text, p_platform text DEFAULT 'ios'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_token is null or length(p_token) < 8 then
    raise exception 'invalid token';
  end if;
  delete from public.device_tokens where token = p_token;
  insert into public.device_tokens (user_id, token, platform)
  values (auth.uid(), p_token, coalesce(p_platform, 'ios'));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.report_question(p_question_id text, p_question_text text, p_picked text DEFAULT NULL::text, p_correct text DEFAULT NULL::text, p_mode text DEFAULT NULL::text, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_qid text := nullif(trim(p_question_id), '');
begin
  if p_question_text is null or length(trim(p_question_text)) = 0 then
    raise exception 'question text required' using errcode = '22023';
  end if;

  -- Silent throttles (return without inserting; callers can't distinguish).
  if (select count(*) from public.question_reports
        where created_at > now() - interval '1 hour') >= 200 then
    return; -- global hourly backstop
  end if;
  if v_qid is not null and
     (select count(*) from public.question_reports
        where question_id = v_qid
          and created_at > now() - interval '1 hour') >= 20 then
    return; -- per-question hourly cap
  end if;
  if auth.uid() is not null and v_qid is not null and
     exists (select 1 from public.question_reports
               where reporter_id = auth.uid() and question_id = v_qid) then
    return; -- signed-in dedup: one report per user per question
  end if;

  insert into public.question_reports
    (question_id, question_text, picked, correct_answer, mode, reason, reporter_id)
  values
    (v_qid,
     left(p_question_text, 600),
     left(p_picked, 300),
     left(p_correct, 300),
     left(p_mode, 60),
     left(p_reason, 600),
     auth.uid());
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_user_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.profiles
  set
    total_score      = 0,
    xp               = 0,
    games_played     = 0,
    correct_answers  = 0,
    stats            = '{}'::jsonb
  where id = v_uid;

  update public.user_game_state
  set
    daily_scores        = '{}'::jsonb,
    daily_wrong_answers = '{}'::jsonb,
    daily_all_answers   = '{}'::jsonb,
    wordle_state        = null,
    login_streak        = null
  where user_id = v_uid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.reveal_question(p_code text, p_question_idx integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.send_play_invite(p_addressee uuid, p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_friends boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_addressee is null or p_addressee = auth.uid() then
    raise exception 'invalid addressee';
  end if;
  select exists(
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = p_addressee)
        or (f.addressee_id = auth.uid() and f.requester_id = p_addressee))
  ) into v_friends;
  if not v_friends then
    raise exception 'not friends';
  end if;
  insert into public.notifications (user_id, type, actor_id, actor_name, actor_avatar, payload)
  select p_addressee, 'play_invite', auth.uid(), p.username, p.avatar_id,
         jsonb_build_object('code', coalesce(p_code, ''))
  from public.profiles p
  where p.id = auth.uid();
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_room_mode(p_code text, p_mode text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.start_game(p_code text, p_questions jsonb, p_capacity integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.submit_answer(p_code text, p_question_idx integer, p_answer_idx integer, p_lock_time integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  return jsonb_build_object(
    'accepted', true, 'correct', v_is_correct,
    'score_delta', v_score_delta, 'new_score', v_player.score + v_score_delta,
    'streak', v_new_streak, 'best_streak', greatest(v_player.best_streak, v_new_streak),
    'eliminated', v_elim_at is not null, 'eliminated_at_q', v_elim_at,
    'server_lock_time', v_server_lock_time
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.tick_login_streak(p_local_day integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid       uuid := auth.uid();
  v_utc_day   int  := (current_date - date '1970-01-01');
  v_today     int;
  v_streak    jsonb;
  v_last_day  int;
  v_count     int;
  v_best      int;
  v_used      int;
  v_xp        int;
  v_earned    int;
  v_avail     int;
  v_ticked    boolean := false;
  v_shielded  boolean := false;
  v_fell      int := 0;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_local_day is not null and abs(p_local_day - v_utc_day) <= 2 then
    v_today := p_local_day;
  else
    v_today := v_utc_day;
  end if;

  select login_streak into v_streak
  from public.user_game_state
  where user_id = v_uid;

  v_last_day := coalesce((v_streak->>'lastDay')::int, 0);
  v_count    := coalesce((v_streak->>'streak')::int,  0);
  v_best     := coalesce((v_streak->>'best')::int,    0);
  v_used     := coalesce((v_streak->>'shieldsUsed')::int, 0);

  select coalesce(xp, 0) into v_xp from public.profiles where id = v_uid;
  v_earned := floor(coalesce(v_xp, 0) / 200);
  v_avail  := least(3, greatest(0, v_earned - v_used));

  if v_last_day = v_today then
    v_ticked := false;
  elsif v_last_day > v_today then
    -- Already banked a LATER day (legacy UTC tick / device further east).
    -- Never reset for that — leave state untouched.
    v_ticked := false;
  elsif v_last_day = v_today - 1 then
    v_count    := v_count + 1;
    v_best     := greatest(v_best, v_count);
    v_last_day := v_today;
    v_ticked   := true;
  elsif v_last_day = v_today - 2 and v_count > 0 and v_avail > 0 then
    -- Streak freeze: exactly one missed day, covered by an available shield.
    v_used     := v_used + 1;
    v_count    := v_count + 1;
    v_best     := greatest(v_best, v_count);
    v_last_day := v_today;
    v_ticked   := true;
    v_shielded := true;
  else
    -- Un-shielded break. Stash a meaningful fallen streak so
    -- repair_login_streak can restore it — today only.
    if v_count >= 3 then
      v_fell := v_count;
    end if;
    v_count    := 1;
    v_best     := greatest(v_best, 1);
    v_last_day := v_today;
    v_ticked   := true;
  end if;

  v_streak := jsonb_build_object(
    'lastDay',     v_last_day,
    'streak',      v_count,
    'best',        v_best,
    'shieldsUsed', v_used
  );
  if v_fell > 0 then
    v_streak := v_streak || jsonb_build_object('fell', v_fell, 'fellDay', v_today);
  end if;

  if v_ticked then
    update public.user_game_state
    set login_streak = v_streak
    where user_id = v_uid;
  end if;

  return v_streak || jsonb_build_object('ticked', v_ticked, 'shieldSaved', v_shielded);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_daily_all_answers(p_ymd text, p_answers jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_ymd !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid ymd format: %', p_ymd;
  end if;
  update public.user_game_state
  set daily_all_answers = jsonb_set(
        coalesce(daily_all_answers, '{}'::jsonb),
        array[p_ymd],
        p_answers
      )
  where user_id = v_uid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_daily_score(p_ymd text, p_score integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_ymd !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid ymd format: %', p_ymd;
  end if;
  if p_score < 0 or p_score > 7 then
    raise exception 'score out of range: %', p_score;
  end if;
  update public.user_game_state
  set daily_scores = jsonb_set(
        coalesce(daily_scores, '{}'::jsonb),
        array[p_ymd],
        to_jsonb(p_score)
      )
  where user_id = v_uid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_daily_wrong_answers(p_ymd text, p_wrongs jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_ymd !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid ymd format: %', p_ymd;
  end if;
  update public.user_game_state
  set daily_wrong_answers = jsonb_set(
        coalesce(daily_wrong_answers, '{}'::jsonb),
        array[p_ymd],
        p_wrongs
      )
  where user_id = v_uid;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_wordle_state(p_ymd text, p_state jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_ymd !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid ymd format: %', p_ymd;
  end if;
  update public.user_game_state
  set wordle_state = jsonb_set(
        coalesce(wordle_state, '{}'::jsonb),
        array[p_ymd],
        p_state
      )
  where user_id = v_uid;
end;
$function$
;


CREATE OR REPLACE FUNCTION public.repair_login_streak(p_local_day integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid      uuid := auth.uid();
  v_utc_day  int  := (current_date - date '1970-01-01');
  v_today    int;
  v_streak   jsonb;
  v_fell     int;
  v_fell_day int;
  v_count    int;
  v_best     int;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_local_day is not null and abs(p_local_day - v_utc_day) <= 2 then
    v_today := p_local_day;
  else
    v_today := v_utc_day;
  end if;

  select login_streak into v_streak
  from public.user_game_state
  where user_id = v_uid;

  v_fell     := coalesce((v_streak->>'fell')::int, 0);
  v_fell_day := coalesce((v_streak->>'fellDay')::int, 0);
  v_count    := coalesce((v_streak->>'streak')::int, 0);
  v_best     := coalesce((v_streak->>'best')::int, 0);

  -- Repairable only on the local day the break was discovered, and only
  -- while the stash is unconsumed. Anything else returns state untouched
  -- (repaired:false) — the client treats that as "window closed".
  if v_fell <= 0 or v_fell_day <> v_today
     or coalesce((v_streak->>'lastDay')::int, 0) <> v_today then
    return coalesce(v_streak, '{}'::jsonb) || jsonb_build_object('repaired', false);
  end if;

  v_count := v_fell + v_count;   -- fallen streak + the day(s) since the break
  v_best  := greatest(v_best, v_count);
  v_streak := (v_streak - 'fell' - 'fellDay')
    || jsonb_build_object('streak', v_count, 'best', v_best);

  update public.user_game_state
  set login_streak = v_streak
  where user_id = v_uid;

  return v_streak || jsonb_build_object('repaired', true);
end;
$function$
;


-- ════ v3_0_mates_leagues (applied 2026-10-16) ════
-- ── HELPERS (no grants) ─────────────────────────────────────────────────────

-- Edition -> the puzzle's day index. Anchors in step with the JS (see header).
create or replace function public._league_day_index(p_game text, p_edition integer)
returns integer
language sql immutable set search_path to 'public'
as $function$
  select case p_game
    when 'footle' then p_edition + 20576
    when 'trail'  then p_edition + 20667
    when 'top10'  then p_edition + 20737
    when 'daily7' then p_edition
    else null
  end;
$function$;

-- The fixed scale. Every played daily is worth 1 to 10.
--   footle  bucket = guesses when won: 1->10 ... 6->5; missed -> 1
--   trail   bucket = clubs used when won: 1->10 ... 6 or more -> 5; missed -> 1
--   daily7  bucket = score 0..7: 0 -> 1, otherwise score + 3
--   top10   bucket = names found 0..10: the number found, minimum 1
create or replace function public._league_points(p_game text, p_bucket integer, p_won boolean)
returns smallint
language sql immutable set search_path to 'public'
as $function$
  select (case
    when p_game in ('footle','trail') then
      case when p_won is not true or p_bucket is null or p_bucket < 1 then 1
           else greatest(5, 11 - p_bucket) end
    when p_game = 'daily7' then
      case when coalesce(p_bucket, 0) <= 0 then 1 else least(7, p_bucket) + 3 end
    when p_game = 'top10' then greatest(1, least(10, coalesce(p_bucket, 0)))
    else null
  end)::smallint;
$function$;

-- Monday of the week containing a day. Day 0 (1970-01-01) was a Thursday.
create or replace function public._league_week_start(p_day integer)
returns integer
language sql immutable set search_path to 'public'
as $function$
  select p_day - ((p_day + 3) % 7);
$function$;

-- Today, as a day index, in a zone.
create or replace function public._league_today(p_tz text)
returns integer
language sql stable set search_path to 'public'
as $function$
  select ((now() at time zone p_tz)::date - date '1970-01-01');
$function$;

-- Monday 00:00 after the week, in the league's zone, as an instant.
create or replace function public._league_whistle(p_league_id uuid, p_week_start integer)
returns timestamptz
language sql stable set search_path to 'public'
as $function$
  select ((date '1970-01-01' + (p_week_start + 7))::timestamp at time zone l.tz)
  from public.leagues l where l.id = p_league_id;
$function$;

-- The week's table as jsonb rows, ordered, with banter labels computed. Holds
-- each row's user id under "uid": callers strip it before anything leaves.
--   order:  points, then 10-point results, then days played; equal on all three
--           shares a rank ("=2"); earliest join only orders the display.
--   crown:  rank 1 (with points). Shared rank 1 -> joint winners.
--   spoon:  lowest total among members who scored; needs 3+ who scored, and a
--           table where not everyone is level.
--   bottled: the OUTRIGHT leader on Monday to Thursday points who finished worse
--           than third; needs 4+ who scored.
--   ghost:  no results all week, for a member who joined by Thursday.
create or replace function public._league_standings(p_league_id uuid, p_week_start integer)
returns jsonb
language plpgsql stable set search_path to 'public'
as $function$
declare
  v_whistle timestamptz := public._league_whistle(p_league_id, p_week_start);
  v_out jsonb;
begin
  if v_whistle is null then return '[]'::jsonb; end if;
  with m as (
    select lm.user_id, lm.display_name, lm.joined_at, lm.joined_day
    from public.league_members lm
    where lm.league_id = p_league_id
      and lm.joined_at < v_whistle
      and lm.joined_day <= p_week_start + 6
      and (lm.left_at is null or lm.left_at >= v_whistle)
  ),
  r as (
    select m.user_id, lr.day_index, lr.points
    from m
    join public.league_results lr on lr.user_id = m.user_id
    where lr.day_index between p_week_start and p_week_start + 6
      and lr.day_index >= m.joined_day
      and lr.recorded_at < v_whistle
  ),
  d as (
    select r.user_id, r.day_index, sum(r.points)::int as pts
    from r group by r.user_id, r.day_index
  ),
  agg as (
    select m.user_id, m.display_name, m.joined_at, m.joined_day,
      coalesce((select sum(d.pts) from d where d.user_id = m.user_id), 0)::int as points,
      (select count(*) from r where r.user_id = m.user_id and r.points = 10)::int as tens,
      (select count(*) from d where d.user_id = m.user_id)::int as days,
      coalesce((select sum(d.pts) from d where d.user_id = m.user_id and d.day_index <= p_week_start + 3), 0)::int as early,
      (select jsonb_agg((select d.pts from d where d.user_id = m.user_id and d.day_index = p_week_start + g.i) order by g.i)
         from generate_series(0, 6) as g(i)) as per_day
    from m
  ),
  ranked as (
    select agg.*,
      rank() over (order by agg.points desc, agg.tens desc, agg.days desc) as rnk
    from agg
  ),
  te as (
    select max(ranked.early) as top_early from ranked
  ),
  s as (
    select
      count(*) filter (where ranked.points > 0) as scorers,
      min(ranked.points) filter (where ranked.points > 0) as low,
      max(ranked.points) as high,
      max(te.top_early) as top_early,
      count(*) filter (where ranked.early = te.top_early) as top_early_n
    from ranked cross join te
  )
  select jsonb_agg(jsonb_build_object(
      'uid', ranked.user_id,
      'rank', ranked.rnk,
      'tied', (select count(*) from ranked t where t.rnk = ranked.rnk) > 1,
      'name', ranked.display_name,
      'points', ranked.points,
      'tens', ranked.tens,
      'days', ranked.days,
      'per_day', ranked.per_day,
      'joined_day', ranked.joined_day,
      'labels', to_jsonb(array_remove(array[
        case when ranked.rnk = 1 and ranked.points > 0 then 'crown' end,
        case when s.scorers >= 3 and ranked.points > 0 and ranked.points = s.low and s.low < s.high then 'spoon' end,
        case when s.scorers >= 4 and ranked.rnk > 3 and s.top_early > 0 and s.top_early_n = 1
              and ranked.early = s.top_early then 'bottled' end,
        case when ranked.days = 0 and ranked.joined_day <= p_week_start + 3 then 'ghost' end
      ]::text[], null))
    ) order by ranked.rnk, ranked.joined_at)
  into v_out
  from ranked cross join s;
  return coalesce(v_out, '[]'::jsonb);
end;
$function$;

-- Is the week final? At the whistle, or earlier from Sunday once every member
-- who joined by Sunday has a result for all four games on Sunday's day.
create or replace function public._league_is_final(p_league_id uuid, p_week_start integer)
returns boolean
language plpgsql stable set search_path to 'public'
as $function$
declare
  v_tz text;
  v_whistle timestamptz;
  v_sunday integer := p_week_start + 6;
begin
  select l.tz into v_tz from public.leagues l where l.id = p_league_id;
  if v_tz is null then return false; end if;
  v_whistle := public._league_whistle(p_league_id, p_week_start);
  if now() >= v_whistle then return true; end if;
  if public._league_today(v_tz) < v_sunday then return false; end if;
  return exists (
      select 1 from public.league_members lm
      where lm.league_id = p_league_id and lm.left_at is null and lm.joined_day <= v_sunday
    )
    and not exists (
      select 1 from public.league_members lm
      where lm.league_id = p_league_id and lm.left_at is null and lm.joined_day <= v_sunday
        and (select count(distinct lr.game) from public.league_results lr
             where lr.user_id = lm.user_id and lr.day_index = v_sunday and lr.recorded_at < v_whistle) < 4
    );
end;
$function$;

-- The stored final for a week, written on first read once the week is final.
-- Returns null while the week is still live.
create or replace function public._league_final_rows(p_league_id uuid, p_week_start integer)
returns jsonb
language plpgsql volatile set search_path to 'public'
as $function$
declare
  v_rows jsonb;
begin
  select w.standings into v_rows from public.league_weeks w
  where w.league_id = p_league_id and w.week_start = p_week_start;
  if found then return v_rows; end if;
  if not public._league_is_final(p_league_id, p_week_start) then return null; end if;
  v_rows := public._league_standings(p_league_id, p_week_start);
  insert into public.league_weeks (league_id, week_start, standings)
  values (p_league_id, p_week_start, v_rows)
  on conflict (league_id, week_start) do nothing;
  select w.standings into v_rows from public.league_weeks w
  where w.league_id = p_league_id and w.week_start = p_week_start;
  return v_rows;
end;
$function$;

-- Rows as a client may see them: no user ids, "is_me" instead, and labels
-- only on a final table.
create or replace function public._league_public_rows(p_rows jsonb, p_me uuid, p_final boolean)
returns jsonb
language sql immutable set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(
      (e - 'uid' - 'labels')
      || jsonb_build_object('is_me', (e ->> 'uid') = p_me::text)
      || jsonb_build_object('labels', case when p_final then coalesce(e -> 'labels', '[]'::jsonb) else '[]'::jsonb end)
      order by o), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) with ordinality as x(e, o);
$function$;

-- A display name, cleaned: trimmed, inner whitespace collapsed. Null if empty,
-- too long or profane.
create or replace function public._league_clean_name(p_name text, p_max integer)
returns text
language plpgsql immutable set search_path to 'public'
as $function$
declare
  v text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if v = '' or char_length(v) > p_max then return null; end if;
  if public.is_profane_username(v) then return null; end if;
  return v;
end;
$function$;

-- ── CLIENT FUNCTIONS ────────────────────────────────────────────────────────

-- The only write of a result. Records for any session holder, member or not,
-- so the join day counts for a signed-in player who joins later that day.
-- Returns the stored points (the first write's, on a replay), or null.
create or replace function public.record_league_result(
  p_game text, p_edition integer, p_bucket integer, p_won boolean
) returns smallint
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_day integer;
  v_now double precision := extract(epoch from now());
  v_pts smallint;
begin
  if v_uid is null then return null; end if;
  if p_game is null or p_game not in ('footle','daily7','trail','top10') then return null; end if;
  if p_edition is null or p_edition < 0 or p_edition > 100000 then return null; end if;
  if p_bucket is null or p_bucket < 0 then return null; end if;
  if (p_game = 'footle' and p_bucket > 6) or (p_game = 'trail' and p_bucket > 30)
     or (p_game = 'daily7' and p_bucket > 7) or (p_game = 'top10' and p_bucket > 10) then
    return null;
  end if;
  v_day := public._league_day_index(p_game, p_edition);
  if v_day is null then return null; end if;
  -- Live somewhere on Earth: from UTC+14's midnight to UTC-12's end of the day.
  if v_now < v_day::double precision * 86400 - 14 * 3600
     or v_now > (v_day + 1)::double precision * 86400 + 12 * 3600 then
    return null;
  end if;
  select lr.points into v_pts from public.league_results lr
  where lr.user_id = v_uid and lr.game = p_game and lr.edition = p_edition;
  if found then return v_pts; end if;
  -- Global throttle, same posture as record_daily_result.
  if (select count(*) from public.league_results where recorded_at > now() - interval '1 hour') >= 5000 then
    return null;
  end if;
  insert into public.league_results (user_id, game, edition, day_index, bucket, won, points)
  values (v_uid, p_game, p_edition, v_day, p_bucket, coalesce(p_won, true),
          public._league_points(p_game, p_bucket, coalesce(p_won, true)))
  on conflict (user_id, game, edition) do nothing;
  select lr.points into v_pts from public.league_results lr
  where lr.user_id = v_uid and lr.game = p_game and lr.edition = p_edition;
  return v_pts;
end;
$function$;

-- Create a league; the caller is its owner and first member.
-- Returns {id, code, name} or {error: bad_name | bad_display_name | rate_limited | too_many}.
create or replace function public.create_league(
  p_name text, p_tz text, p_display_name text, p_seed text default 'manual'
) returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_member text;
  v_tz text := 'UTC';
  v_seed text := 'manual';
  v_alpha constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_bytes bytea;
  v_code text;
  v_id uuid;
  v_try integer := 0;
  v_idx integer[] := array[0,1,2,3,4,5,7,9];  -- uuid v4 bytes with no fixed bits
  i integer;
begin
  if v_uid is null then return null; end if;
  v_name := public._league_clean_name(p_name, 32);
  if v_name is null then return jsonb_build_object('error', 'bad_name'); end if;
  v_member := public._league_clean_name(p_display_name, 22);
  if v_member is null then return jsonb_build_object('error', 'bad_display_name'); end if;
  if p_tz is not null and char_length(p_tz) <= 64
     and exists (select 1 from pg_timezone_names where name = p_tz) then
    v_tz := p_tz;
  end if;
  if p_seed in ('manual','h2h_footle','h2h_trail','h2h_top10','h2h_daily7') then v_seed := p_seed; end if;
  if (select count(*) from public.leagues l where l.owner_id = v_uid and l.created_at > now() - interval '24 hours') >= 10 then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  if (select count(*) from public.league_members lm where lm.user_id = v_uid and lm.left_at is null) >= 10 then
    return jsonb_build_object('error', 'too_many');
  end if;
  loop
    v_try := v_try + 1;
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    foreach i in array v_idx loop
      v_code := v_code || substr(v_alpha, (get_byte(v_bytes, i) % 31) + 1, 1);
    end loop;
    begin
      insert into public.leagues (code, name, tz, owner_id, seed)
      values (v_code, v_name, v_tz, v_uid, v_seed)
      returning id into v_id;
      exit;
    exception when unique_violation then
      if v_try >= 8 then raise; end if;
    end;
  end loop;
  insert into public.league_members (league_id, user_id, display_name, joined_day)
  values (v_id, v_uid, v_member, public._league_today(v_tz));
  return jsonb_build_object('id', v_id, 'code', v_code, 'name', v_name);
end;
$function$;

-- Join by code. Throttled per user: 30 tries an hour, counted here.
-- Returns {id, code, name, seed} or {error: rate_limited | not_found | bad_display_name | full | too_many}.
create or replace function public.join_league(p_code text, p_display_name text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_member text;
  v_league public.leagues%rowtype;
  v_existing public.league_members%rowtype;
  v_had boolean;
begin
  if v_uid is null then return null; end if;
  delete from public.league_join_tries where user_id = v_uid and tried_at < now() - interval '1 hour';
  if (select count(*) from public.league_join_tries where user_id = v_uid) >= 30 then
    return jsonb_build_object('error', 'rate_limited');
  end if;
  insert into public.league_join_tries (user_id) values (v_uid);
  if v_code !~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$' then
    return jsonb_build_object('error', 'not_found');
  end if;
  select * into v_league from public.leagues where code = v_code;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  v_member := public._league_clean_name(p_display_name, 22);
  if v_member is null then return jsonb_build_object('error', 'bad_display_name'); end if;
  select * into v_existing from public.league_members
  where league_id = v_league.id and user_id = v_uid;
  v_had := found;
  if v_had and v_existing.left_at is null then
    return jsonb_build_object('id', v_league.id, 'code', v_league.code, 'name', v_league.name, 'seed', v_league.seed);
  end if;
  if (select count(*) from public.league_members lm where lm.league_id = v_league.id and lm.left_at is null) >= 20 then
    return jsonb_build_object('error', 'full');
  end if;
  if (select count(*) from public.league_members lm where lm.user_id = v_uid and lm.left_at is null) >= 10 then
    return jsonb_build_object('error', 'too_many');
  end if;
  if v_had then
    -- Rejoining clears left_at; the original join day stands.
    update public.league_members set left_at = null, display_name = v_member
    where league_id = v_league.id and user_id = v_uid;
  else
    insert into public.league_members (league_id, user_id, display_name, joined_day)
    values (v_league.id, v_uid, v_member, public._league_today(v_league.tz));
  end if;
  return jsonb_build_object('id', v_league.id, 'code', v_league.code, 'name', v_league.name, 'seed', v_league.seed);
end;
$function$;

create or replace function public.leave_league(p_league_id uuid)
returns boolean
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return null; end if;
  update public.league_members set left_at = now()
  where league_id = p_league_id and user_id = v_uid and left_at is null;
  return found;
end;
$function$;

create or replace function public.set_league_display_name(p_league_id uuid, p_name text)
returns boolean
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then return null; end if;
  v_name := public._league_clean_name(p_name, 22);
  if v_name is null then return false; end if;
  update public.league_members set display_name = v_name
  where league_id = p_league_id and user_id = v_uid and left_at is null;
  return found;
end;
$function$;

-- One line per active league, latest activity first: rank, points, gap to the
-- leader, the leader's name, this week's seven day totals, whether the week is
-- final and whether last week's final is still unseen.
create or replace function public.get_my_leagues()
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_out jsonb := '[]'::jsonb;
  rec record;
  v_today integer;
  v_week integer;
  v_rows jsonb;
  v_final boolean;
  v_me jsonb;
  v_lead jsonb;
  v_prev_unseen boolean;
  v_activity timestamptz;
begin
  if v_uid is null then return null; end if;
  for rec in
    select l.id, l.code, l.name, l.tz, l.created_at, lm.joined_at, lm.seen_week
    from public.league_members lm
    join public.leagues l on l.id = lm.league_id
    where lm.user_id = v_uid and lm.left_at is null
  loop
    v_today := public._league_today(rec.tz);
    v_week := public._league_week_start(v_today);
    v_final := public._league_is_final(rec.id, v_week);
    v_rows := case when v_final then public._league_final_rows(rec.id, v_week)
                   else public._league_standings(rec.id, v_week) end;
    select e into v_me from jsonb_array_elements(v_rows) e where e ->> 'uid' = v_uid::text limit 1;
    select e into v_lead from jsonb_array_elements(v_rows) e order by (e ->> 'points')::int desc limit 1;
    -- Last week had a table for this member if they were in before its whistle.
    v_prev_unseen := rec.joined_at < public._league_whistle(rec.id, v_week - 7)
      and coalesce(rec.seen_week, -1) < v_week - 7;
    select max(lr.recorded_at) into v_activity
    from public.league_members m2
    join public.league_results lr on lr.user_id = m2.user_id
    where m2.league_id = rec.id and m2.left_at is null
      and lr.day_index between v_week and v_week + 6;
    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', rec.id,
      'code', rec.code,
      'name', rec.name,
      'tz', rec.tz,
      'week_start', v_week,
      'today', v_today,
      'is_final', v_final,
      'members', jsonb_array_length(v_rows),
      'my_rank', v_me -> 'rank',
      'my_tied', v_me -> 'tied',
      'my_points', coalesce((v_me ->> 'points')::int, 0),
      'my_days', coalesce(v_me -> 'per_day', '[]'::jsonb),
      'leader_name', case when (v_lead ->> 'uid') = v_uid::text then null else v_lead ->> 'name' end,
      'leader_points', coalesce((v_lead ->> 'points')::int, 0),
      'gap', greatest(0, coalesce((v_lead ->> 'points')::int, 0) - coalesce((v_me ->> 'points')::int, 0)),
      'last_final_unseen', coalesce(v_prev_unseen, false),
      'activity', greatest(coalesce(v_activity, rec.joined_at), rec.joined_at)
    ));
  end loop;
  select coalesce(jsonb_agg(e order by (e ->> 'activity') desc), '[]'::jsonb) into v_out
  from jsonb_array_elements(v_out) e;
  return v_out;
end;
$function$;

-- The table for one week (default: this week). Members only. Never returns
-- another member's user id. Writes the final snapshot on the first read after
-- the whistle or the early final, and marks the final as seen.
create or replace function public.get_league_table(p_league_id uuid, p_week_start integer default null)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_league public.leagues%rowtype;
  v_member public.league_members%rowtype;
  v_today integer;
  v_current integer;
  v_week integer;
  v_final boolean;
  v_rows jsonb;
  v_prev jsonb;
  v_last jsonb := null;
  v_winners text[];
  v_top integer;
begin
  if v_uid is null then return null; end if;
  select * into v_member from public.league_members
  where league_id = p_league_id and user_id = v_uid and left_at is null;
  if not found then return null; end if;
  select * into v_league from public.leagues where id = p_league_id;
  if not found then return null; end if;
  v_today := public._league_today(v_league.tz);
  v_current := public._league_week_start(v_today);
  v_week := coalesce(p_week_start, v_current);
  if v_week > v_current or v_week <> public._league_week_start(v_week) then return null; end if;
  v_final := public._league_is_final(p_league_id, v_week);
  if v_final then
    v_rows := public._league_final_rows(p_league_id, v_week);
    update public.league_members set seen_week = greatest(coalesce(seen_week, -1), v_week)
    where league_id = p_league_id and user_id = v_uid;
  else
    v_rows := public._league_standings(p_league_id, v_week);
  end if;
  -- Last week's one line, from its stored final.
  if v_league.created_at < public._league_whistle(p_league_id, v_week - 7) then
    v_prev := public._league_final_rows(p_league_id, v_week - 7);
    if v_prev is not null and jsonb_array_length(v_prev) > 0 then
      select max((e ->> 'points')::int) into v_top from jsonb_array_elements(v_prev) e;
      if v_top > 0 then
        select array_agg(e ->> 'name' order by o) into v_winners
        from jsonb_array_elements(v_prev) with ordinality as x(e, o)
        where (e ->> 'points')::int = v_top and (e ->> 'rank')::int = 1;
        v_last := jsonb_build_object('winners', to_jsonb(v_winners), 'points', v_top, 'week_start', v_week - 7);
      end if;
    end if;
  end if;
  return jsonb_build_object(
    'meta', jsonb_build_object(
      'id', v_league.id,
      'name', v_league.name,
      'code', v_league.code,
      'tz', v_league.tz,
      'seed', v_league.seed,
      'week_start', v_week,
      'today', v_today,
      'whistle', public._league_whistle(p_league_id, v_week),
      'is_final', v_final,
      'is_owner', v_league.owner_id = v_uid,
      'my_joined_day', v_member.joined_day,
      'my_name', v_member.display_name
    ),
    'rows', public._league_public_rows(v_rows, v_uid, v_final),
    'last_week', v_last
  );
end;
$function$;

-- Before an anonymous player signs in to an existing account: a single-use
-- token (stored hashed, 30 minutes) that league_claim redeems from the account.
create or replace function public.league_issue_claim()
returns text
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_token text;
begin
  if v_uid is null then return null; end if;
  if not exists (select 1 from auth.users u where u.id = v_uid and u.is_anonymous is true) then
    return null;
  end if;
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  delete from public.league_claims where from_user = v_uid or expires_at < now();
  insert into public.league_claims (token_hash, from_user, expires_at)
  values (encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), v_uid, now() + interval '30 minutes');
  return v_token;
end;
$function$;

-- Redeem a claim: moves the anonymous source's memberships and results onto
-- the caller. The account's own rows win where both exist. Only ever moves
-- FROM an account that is still anonymous. Returns the number of rows moved.
create or replace function public.league_claim(p_token text)
returns integer
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_from uuid;
  v_n1 integer := 0;
  v_n2 integer := 0;
begin
  if v_uid is null or p_token is null or char_length(p_token) <> 64 then return 0; end if;
  delete from public.league_claims
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and expires_at > now()
  returning from_user into v_from;
  if v_from is null or v_from = v_uid then return 0; end if;
  if not exists (select 1 from auth.users u where u.id = v_from and u.is_anonymous is true) then
    return 0;
  end if;
  insert into public.league_members (league_id, user_id, display_name, joined_at, joined_day, left_at, seen_week)
  select lm.league_id, v_uid, lm.display_name, lm.joined_at, lm.joined_day, lm.left_at, lm.seen_week
  from public.league_members lm where lm.user_id = v_from
  on conflict (league_id, user_id) do nothing;
  get diagnostics v_n1 = row_count;
  delete from public.league_members where user_id = v_from;
  insert into public.league_results (user_id, game, edition, day_index, bucket, won, points, recorded_at)
  select v_uid, lr.game, lr.edition, lr.day_index, lr.bucket, lr.won, lr.points, lr.recorded_at
  from public.league_results lr where lr.user_id = v_from
  on conflict (user_id, game, edition) do nothing;
  get diagnostics v_n2 = row_count;
  delete from public.league_results where user_id = v_from;
  update public.leagues set owner_id = v_uid where owner_id = v_from;
  -- Stored finals name members by uid; keep "is_me" true for the mover.
  update public.league_weeks
     set standings = replace(standings::text, v_from::text, v_uid::text)::jsonb
   where standings::text like '%' || v_from::text || '%';
  return v_n1 + v_n2;
end;
$function$;

