-- ============================================================================
-- Sprint #91 FFF3 — join_room: existing-member check before lobby-state gate
-- ============================================================================
--
-- The original join_room function checked `state = 'lobby'` BEFORE checking
-- existing membership. That ordering blocked the rejoin path: a player who
-- force-quit during an active game (state = 'playing') would hit the
-- "room is not accepting joins" error when their client tried to rejoin
-- via pendingJoinCode after relaunch, even though their room_players row
-- still existed.
--
-- This migration swaps the two checks so existing members can rejoin
-- regardless of room state. New joiners still hit the lobby-state gate
-- (joining a game already in progress remains correctly rejected).
--
-- Behaviour matrix after this migration:
--   user in room + state lobby   → already_joined=true (was: same)
--   user in room + state playing → already_joined=true (was: ERROR — fixed)
--   new user     + state lobby   → inserted, joined=false (was: same)
--   new user     + state playing → ERROR "not accepting joins" (was: same)
--   any user     + state ended   → ERROR "room not found" (was: same)
--
-- No schema change; CREATE OR REPLACE swaps the function body atomically.
-- Existing GRANTs (authenticated, postgres, service_role) are preserved
-- across CREATE OR REPLACE; explicit GRANT + REVOKE re-applied as defence
-- per the project convention (RPC migrations end with REVOKE FROM PUBLIC).
-- ============================================================================

create or replace function public.join_room(
  p_code   text,
  p_name   text,
  p_avatar text default '⚽'::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  -- Sprint #91 FFF3: membership check moved ABOVE the lobby-state gate
  -- so existing members can rejoin a 'playing' room after force-quit.
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
$function$;

grant execute on function public.join_room(text, text, text) to authenticated;
revoke execute on function public.join_room(text, text, text) from public;
