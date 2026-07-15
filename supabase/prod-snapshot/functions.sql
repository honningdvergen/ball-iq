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

CREATE OR REPLACE FUNCTION public.delete_user_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
