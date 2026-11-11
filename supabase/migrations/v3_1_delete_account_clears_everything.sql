-- v3_1: Delete Account now clears the last rows that kept the player's ID.
--
-- The privacy policy promises that deleting your account removes everything
-- we hold about you. Before this, four places kept the user ID afterwards:
--   daily_results    (no FK)       -> anonymised: user_id and visitor_id set to
--                                     null, so "how everyone did" keeps its counts
--   email_events     (no FK)       -> deleted (the account and its email are gone)
--   question_reports (no FK)       -> anonymised: reporter_id set to null, the
--                                     report about the question itself stays
--   funnel_events    (FK set null) -> visitor_id cleared too, so the rows can't
--                                     be tied back through the web visitor ID
--   user_reports     (reported_id has no FK) -> reports about this player deleted
--   challenge_events (no FK)       -> sender_id and sender_name cleared
-- Everything else is unchanged from the live definition read on 30 Oct 2026.

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
  delete from public.user_reports
    where reported_id = v_uid;          -- v3_1 (reporter side cascades)

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

  -- v3_1: tables with no cascading link to the account
  update public.daily_results
     set user_id = null, visitor_id = null
   where user_id = v_uid;
  delete from public.email_events where user_id = v_uid;
  update public.question_reports
     set reporter_id = null
   where reporter_id = v_uid;
  update public.funnel_events
     set visitor_id = null
   where user_id = v_uid;               -- user_id itself is nulled by its FK
  update public.challenge_events
     set sender_id = null, sender_name = null
   where sender_id = v_uid;             -- "beat my score" link events (no FK)

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
$function$;

grant  execute on function public.delete_user_account() to authenticated;
revoke execute on function public.delete_user_account() from public;
revoke execute on function public.delete_user_account() from anon;
