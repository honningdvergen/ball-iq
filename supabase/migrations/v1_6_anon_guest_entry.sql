-- v1.6 — Guest entry for invite links (Supabase anonymous sign-in)
--
-- A friend tapping balliq.app/join/CODE previously had to create an account
-- before entering the room (the invite loop's biggest leak). With anonymous
-- sign-ins enabled, they get a real auth.uid() + JWT role `authenticated`,
-- so every rooms RPC and RLS policy works unchanged. This migration adds the
-- three server-side pieces the client work leans on:
--
--   1. profiles.is_anon — so guest profiles can be filtered out of friend
--      search, and flipped when the guest upgrades to a real account.
--   2. set_player_name RPC — guests join under a generated display name and
--      can edit it from the lobby (room_players.name is per-room, not tied
--      to profiles.username).
--   3. cleanup_stale_anon_users + pg_cron — abandoned anonymous accounts
--      (30+ days old, no session refreshed in 30 days) are deleted with the
--      same explicit per-table sweep delete_user_account uses. Guests still
--      playing keep refreshing their session, so they are never reaped.
--
-- REQUIRES (dashboard, not SQL): Auth → Providers → Anonymous sign-ins ON.
-- The client ships inert-safe: the "Play as guest" button falls back to the
-- normal sign-in prompt while the provider is disabled.

-- 1 ── profiles.is_anon ------------------------------------------------------

alter table public.profiles
  add column if not exists is_anon boolean not null default false;

-- Stamp it at signup. Verbatim copy of the prod handle_new_user (snapshot
-- 2026-07-14) plus the is_anon column; auth.users.is_anonymous is true for
-- anonymous signups.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, username, avatar_id, is_anon)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'player_' || substring(new.id::text from 1 for 8)),
    'ball',
    coalesce(new.is_anonymous, false)
  );
  return new;
end;
$function$;
revoke execute on function public.handle_new_user() from public;

-- Flip it on upgrade. When an anonymous user links an email/identity,
-- GoTrue sets auth.users.is_anonymous = false; mirror that into profiles so
-- the account immediately joins friend search etc.
create or replace function public.sync_profile_anon_flag()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if coalesce(old.is_anonymous, false) and not coalesce(new.is_anonymous, false) then
    update public.profiles set is_anon = false where id = new.id;
  end if;
  return new;
end;
$function$;
revoke execute on function public.sync_profile_anon_flag() from public;

drop trigger if exists on_auth_user_upgraded on auth.users;
create trigger on_auth_user_upgraded
  after update of is_anonymous on auth.users
  for each row execute function public.sync_profile_anon_flag();

-- 2 ── set_player_name -------------------------------------------------------

-- Rename yourself in a lobby you're already in. Guests join under a
-- generated name ("Turbo Poacher 87") and fix it from the lobby; the
-- room_players UPDATE broadcasts to everyone via realtime (REPLICA IDENTITY
-- FULL is already set on room_players). Lobby-only: renaming mid-game would
-- desync the scoreboard row players have already read.
create or replace function public.set_player_name(p_code text, p_name text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_uid  uuid := auth.uid();
  v_name text := trim(coalesce(p_name, ''));
  v_room public.game_rooms%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if length(v_name) < 1 or length(v_name) > 20 then
    raise exception 'name must be 1-20 characters' using errcode = '22001';
  end if;

  if public.is_profane_username(v_name) then
    raise exception 'name not allowed' using errcode = '23514';
  end if;

  select * into v_room from public.game_rooms
  where code = p_code and state = 'lobby'
  for update;

  if not found then
    raise exception 'room not found or not in lobby: %', p_code using errcode = 'P0002';
  end if;

  update public.room_players
     set name = v_name
   where room_id = v_room.id and user_id = v_uid;

  if not found then
    raise exception 'not a member of room %', p_code using errcode = '42501';
  end if;

  return jsonb_build_object('code', v_room.code, 'name', v_name);
end;
$function$;

grant execute on function public.set_player_name(text, text) to authenticated;
revoke execute on function public.set_player_name(text, text) from public;
revoke execute on function public.set_player_name(text, text) from anon;

-- 3 ── stale-anon cleanup ----------------------------------------------------

-- Mirrors delete_user_account's explicit per-table sweep (cascade-independent
-- on purpose — FK ON DELETE behaviour is not uniform across these tables).
-- "Stale" = anonymous, created 30+ days ago, AND no auth session refreshed in
-- the last 30 days: an active guest's refresh-token rotation keeps
-- auth.sessions.refreshed_at current, so they are excluded no matter how old
-- the account is.
create or replace function public.cleanup_stale_anon_users()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_ids   uuid[];
  v_count integer := 0;
begin
  select coalesce(array_agg(u.id), '{}') into v_ids
  from auth.users u
  where u.is_anonymous is true
    and u.created_at < now() - interval '30 days'
    and not exists (
      select 1 from auth.sessions s
      where s.user_id = u.id
        and coalesce(s.refreshed_at, s.created_at) > now() - interval '30 days'
    );

  if array_length(v_ids, 1) is null then
    return 0;
  end if;

  delete from public.user_blocks  where blocker_id  = any(v_ids) or blocked_id = any(v_ids);
  delete from public.friendships  where requester_id = any(v_ids) or addressee_id = any(v_ids);

  begin
    delete from public.challenge_invites where challenger_id = any(v_ids);
    update public.challenge_invites
       set accepted_id = null, accepted_name = null,
           accepted_score = null, accepted_total = null, accepted_at = null
     where accepted_id = any(v_ids);
  exception when undefined_table then
    null; -- async challenges not deployed here
  end;

  begin
    delete from public.web_push_subscriptions where user_id = any(v_ids);
  exception when undefined_table then
    null;
  end;

  delete from public.scores          where user_id = any(v_ids);
  delete from public.user_game_state where user_id = any(v_ids);
  delete from public.room_players    where user_id = any(v_ids);
  delete from public.game_rooms      where host_id = any(v_ids);
  delete from public.notifications   where user_id = any(v_ids) or actor_id = any(v_ids);
  delete from public.device_tokens   where user_id = any(v_ids);
  delete from public.user_reports    where reporter_id = any(v_ids);
  delete from public.question_review where reviewed_by = any(v_ids);
  delete from public.profiles        where id = any(v_ids);

  delete from auth.users where id = any(v_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- Cron-only: no client role may call this.
revoke execute on function public.cleanup_stale_anon_users() from public;
revoke execute on function public.cleanup_stale_anon_users() from anon;
revoke execute on function public.cleanup_stale_anon_users() from authenticated;

select cron.schedule(
  'cleanup-stale-anon-users',
  '37 4 * * *',
  $$select public.cleanup_stale_anon_users();$$
);
