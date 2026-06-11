-- Sprint #97: delete_user_account v2 — full account deletion (App Review 5.1.1(v))
--
-- Applied to prod 2026-06-11 as three migrations (v2, v2_1, v2_2); this file
-- is the canonical final state.
--
-- WHY: v1 deleted friendships/scores/game_rooms/profiles but left:
--   • auth.users row    → account survived; email blocked from re-signup;
--                         Apple/Google identity persisted; deleted users who
--                         signed in again got a ghost session w/o profile row.
--   • user_blocks rows  → no FK cascade, orphaned forever.
--   • avatar in Storage → avatars/{uid}.jpg orphaned.
-- Additionally, v1 had been THROWING for every real deletion attempt since
-- the Stage 1 multiplayer rework removed game_rooms.guest_id (plpgsql
-- compiles statements lazily, so the 42703 only surfaced at runtime).
--
-- Two bugs caught by the synthetic-user e2e test before shipping:
--   1. Supabase's storage.protect_delete() trigger blocks direct DELETEs on
--      storage.objects; the fix sets its escape-hatch GUC
--      (storage.allow_delete_query) transaction-locally, wrapped in an
--      exception guard so avatar cleanup can never abort the account delete.
--   2. game_rooms.guest_id no longer exists → participation now lives in
--      room_players(user_id); hosted rooms cascade their room_players.
--
-- user_reports rows are RETAINED deliberately (moderation/safety trail —
-- permitted under 5.1.1(v); post-deletion the uuid maps to no account).
--
-- e2e verified 2026-06-11: synthetic user seeded across auth.users,
-- auth.identities, profiles, user_game_state, storage.objects; after the
-- RPC ran under the user's simulated JWT claims, every count was 0 —
-- including auth.users (the account itself).

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
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

  -- Game data (scores / user_game_state also CASCADE from profiles;
  -- explicit deletes kept for clarity + cascade-independence)
  delete from public.scores          where user_id = v_uid;
  delete from public.user_game_state where user_id = v_uid;
  delete from public.room_players    where user_id = v_uid;
  delete from public.game_rooms      where host_id = v_uid;

  -- Profile row
  delete from public.profiles where id = v_uid;

  -- The account itself — LAST, after all app data is gone. Frees the
  -- email for re-signup and severs the Apple/Google identity link.
  delete from auth.users where id = v_uid;
end;
$$;

-- Grant hygiene (v1 had EXECUTE granted to PUBLIC — fixed here):
revoke execute on function public.delete_user_account() from public;
revoke execute on function public.delete_user_account() from anon;
grant  execute on function public.delete_user_account() to authenticated;
