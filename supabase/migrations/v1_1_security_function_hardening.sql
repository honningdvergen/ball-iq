-- 1.1 Security hardening (round 2) — clears the remaining function advisors.
--
-- 1) function_search_path_mutable: pin search_path on the profanity-check +
--    updated_at helper/trigger functions (defence against search_path hijacking
--    of unqualified object references). ALTER FUNCTION avoids recreating bodies.
-- 2) increment_xp is SECURITY DEFINER and still anon-executable via PUBLIC (only
--    its internal auth.uid() guard protected it). Revoke PUBLIC/anon EXECUTE so
--    it matches increment_score; the explicit authenticated grant stays.
-- 3) handle_new_user is an auth trigger (fires on auth.users INSERT), never meant
--    to be an RPC. Triggers fire regardless of EXECUTE grants, so removing all
--    EXECUTE makes it non-callable via /rest without affecting signup.

alter function public.set_updated_at() set search_path to 'public';
alter function public.profiles_check_profanity() set search_path to 'public';
alter function public.is_profane_username(text) set search_path to 'public';

grant execute on function public.increment_xp(uuid, integer) to authenticated;
revoke execute on function public.increment_xp(uuid, integer) from public, anon;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
