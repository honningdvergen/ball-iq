-- 1.3 Profiles UPDATE hardening (deferred from the v1.1 audit).
--
-- Problem: the profiles UPDATE policy is row-scoped (self) but not COLUMN-scoped,
-- so any authenticated user can PATCH their own total_score / xp directly —
-- making the auth-guarded increment_score / increment_xp SECURITY DEFINER RPCs
-- meaningless for integrity (matters the moment any leaderboard is global).
--
-- Fix: column-level UPDATE grants. RLS keeps rows self-scoped; PostgREST
-- enforces the column list. Legitimate client writes today (verified against
-- src/App.jsx, src/screens/ProfileScreen.jsx, src/useAuth.jsx):
--   username, avatar_id, avatar_url, onboarded_at   (profile editing/onboarding)
--   games_played, correct_answers, stats            (post-game sync)
-- total_score and xp move to RPC-only.
--
-- Follow-up (NOT in this migration): move games_played/correct_answers/stats
-- into a record_game_result() SECURITY DEFINER RPC and drop them from this
-- grant — required before any global leaderboard is trusted.
--
-- Verify the live UPDATE policy is self-scoped before/after applying:
--   select polname, pg_get_expr(polqual, polrelid) as using_expr,
--          pg_get_expr(polwithcheck, polrelid) as check_expr
--   from pg_policy where polrelid = 'public.profiles'::regclass;
-- (If the UPDATE policy lacks WITH CHECK, recreate it with BOTH
--  using (auth.uid() = id) and with check (auth.uid() = id).)

revoke update on public.profiles from anon, authenticated;

grant update (username, avatar_id, avatar_url, onboarded_at,
              games_played, correct_answers, stats)
  on public.profiles to authenticated;

-- Standard hygiene: nothing for PUBLIC.
revoke all on public.profiles from public;
