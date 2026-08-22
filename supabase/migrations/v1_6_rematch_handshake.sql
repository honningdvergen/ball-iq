-- v1.6 — rematch is a HANDSHAKE, not two independent creates.
--
-- ⚠️ PLAYER-REPORTED 2026-08-22 (Alex + friend, two devices): both tapped
-- Rematch after an online game and each ended up ALONE in a different room.
--
-- The client's handleRematch() called create_room() unconditionally, then sent
-- the other player a play_invite. With one tapper that works. With two it is
-- guaranteed to fail: A makes room X and invites B, B makes room Y and invites
-- A, and the two invitations cross in flight. The likelier both players are to
-- want a rematch, the more certainly it breaks — the failure scales with
-- enthusiasm, which is the worst possible property for a retention feature.
--
-- Fix: the FINISHED room becomes the rendezvous. The first tap creates the new
-- room and stamps its code onto the old one; every later tap reads that stamp
-- and joins. Serialised by `select ... for update` on the old room, so two
-- simultaneous taps cannot both win — one creates, the other joins.

-- 1 ── where the rendezvous is recorded -------------------------------------

alter table public.game_rooms
  add column if not exists rematch_code text;

comment on column public.game_rooms.rematch_code is
  'Set by claim_rematch(): the room this finished room''s players regroup in. '
  'The first player to tap Rematch creates it; everyone else joins it.';

-- 2 ── the handshake ---------------------------------------------------------

create or replace function public.claim_rematch(
  p_code text,
  p_name text default 'Player',
  p_avatar text default '⚽'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid       uuid := auth.uid();
  v_old       public.game_rooms%rowtype;
  v_new_code  text;
  v_new_id    uuid;
  v_attempt   int := 0;
  v_alphabet  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_existing  public.game_rooms%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- Lock the finished room. This is what makes the handshake atomic: the
  -- second concurrent caller blocks here and then sees the first caller's
  -- stamp, instead of racing it to create a second room.
  select * into v_old
  from public.game_rooms
  where code = upper(p_code)
  for update;

  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  -- Only someone who actually played may claim the rematch. Without this the
  -- room code — which is shared publicly in invite links — would let a
  -- stranger commandeer the rendezvous.
  if not exists (
    select 1 from public.room_players
    where room_id = v_old.id and user_id = v_uid
  ) then
    raise exception 'not a player in this room' using errcode = '42501';
  end if;

  -- Someone already claimed it. Join their room rather than making another —
  -- but only while it is still a lobby. A rematch room that has already
  -- started (or was itself rematched out of) is not somewhere to arrive.
  if v_old.rematch_code is not null then
    select * into v_existing
    from public.game_rooms
    where code = v_old.rematch_code;

    if found and v_existing.state = 'lobby' then
      insert into public.room_players (room_id, user_id, name, avatar)
      values (v_existing.id, v_uid, p_name, p_avatar)
      on conflict (room_id, user_id) do update
        set name = excluded.name, avatar = excluded.avatar;

      return jsonb_build_object(
        'room_id', v_existing.id,
        'code',    v_existing.code,
        'created', false
      );
    end if;
    -- Stale or already started: fall through and make a fresh one, replacing
    -- the stamp. Better a new room than a dead-end.
  end if;

  -- First claimer: create the room, mirroring the old one's shape so a
  -- survival rematch stays survival.
  v_new_id := gen_random_uuid();
  loop
    v_attempt := v_attempt + 1;
    v_new_code := '';
    for i in 1..6 loop
      v_new_code := v_new_code || substr(v_alphabet, floor(random() * length(v_alphabet))::int + 1, 1);
    end loop;
    begin
      insert into public.game_rooms (id, code, host_id, capacity, state, mode)
      values (v_new_id, v_new_code, v_uid, v_old.capacity, 'lobby', v_old.mode);
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'failed to generate unique room code after 5 attempts';
      end if;
    end;
  end loop;

  insert into public.room_players (room_id, user_id, name, avatar)
  values (v_new_id, v_uid, p_name, p_avatar);

  update public.game_rooms
     set rematch_code = v_new_code
   where id = v_old.id;

  return jsonb_build_object(
    'room_id', v_new_id,
    'code',    v_new_code,
    'created', true
  );
end;
$function$;

grant execute on function public.claim_rematch(text, text, text) to authenticated;
revoke execute on function public.claim_rematch(text, text, text) from public;
revoke execute on function public.claim_rematch(text, text, text) from anon;
