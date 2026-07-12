-- v1.3: delete_user_account — also purge challenge_invites
--
-- Medical audit (security-backend, medium): the async-challenges table
-- challenge_invites stores challenger_name / accepted_name (usernames) and was
-- added AFTER delete_user_account v2 was written, so a deleted user's username
-- survived there — an account-deletion completeness gap (App Review 5.1.1(v)).
--
-- Fix: delete challenges the user CREATED (their row + name), and anonymise
-- their ACCEPTANCE of someone else's challenge (null the accepted_* fields but
-- keep the challenger's row intact). Wrapped in an undefined_table guard so the
-- function still deploys/runs cleanly on environments where async challenges
-- aren't present yet. Everything else is byte-for-byte the v2 canonical state.

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

  -- The account itself — LAST, after all app data is gone. Frees the
  -- email for re-signup and severs the Apple/Google identity link.
  delete from auth.users where id = v_uid;
end;
$$;

-- Grant hygiene: EXECUTE to authenticated only.
revoke execute on function public.delete_user_account() from public;
revoke execute on function public.delete_user_account() from anon;
grant  execute on function public.delete_user_account() to authenticated;
