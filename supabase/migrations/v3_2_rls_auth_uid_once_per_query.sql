-- v3_2 (8 Nov 2026): row-security rules evaluate auth.uid() once per query.
--
-- The Supabase performance advisor (read 7 Nov, lint 0003 auth_rls_initplan)
-- flagged 28 policies that call auth.uid() bare. Bare, Postgres re-evaluates
-- it for EVERY row the policy looks at; wrapped as (select auth.uid()) it is
-- an initplan evaluated once. The meaning is identical: same rows allowed,
-- same rows refused. ALTER POLICY changes only the expressions, so each
-- policy keeps its command (SELECT/INSERT/UPDATE/DELETE) and its roles.
-- No grants change, no table changes, no function changes.

alter policy "device_tokens_delete_own" on public.device_tokens using ((select auth.uid()) = user_id);
alter policy "device_tokens_select_own" on public.device_tokens using ((select auth.uid()) = user_id);

alter policy "Users can delete their own friendships" on public.friendships using (((select auth.uid()) = requester_id) or ((select auth.uid()) = addressee_id));
alter policy "Users can see their own friendships" on public.friendships using (((select auth.uid()) = requester_id) or ((select auth.uid()) = addressee_id));
alter policy "Users can send friend requests" on public.friendships with check ((select auth.uid()) = requester_id);

alter policy "notifications_delete_own" on public.notifications using ((select auth.uid()) = user_id);
alter policy "notifications_select_own" on public.notifications using ((select auth.uid()) = user_id);
alter policy "notifications_update_own" on public.notifications using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy "Users can insert own profile" on public.profiles with check ((select auth.uid()) = id);
alter policy "Users can update own profile" on public.profiles using ((select auth.uid()) = id);

alter policy "owner can delete" on public.question_review using (reviewed_by = (select auth.uid()));
alter policy "owner can insert" on public.question_review with check (reviewed_by = (select auth.uid()));
alter policy "owner can read" on public.question_review using (reviewed_by = (select auth.uid()));
alter policy "owner can update" on public.question_review using (reviewed_by = (select auth.uid())) with check (reviewed_by = (select auth.uid()));

alter policy "Users can insert own scores" on public.scores with check ((select auth.uid()) = user_id);

alter policy "insert own attribution once" on public.signup_attribution with check ((select auth.uid()) = user_id);

alter policy "Users can add their own blocks" on public.user_blocks with check ((select auth.uid()) = blocker_id);
alter policy "Users can remove their own blocks" on public.user_blocks using ((select auth.uid()) = blocker_id);
alter policy "Users can see their own blocks" on public.user_blocks using ((select auth.uid()) = blocker_id);

alter policy "user_game_state delete own" on public.user_game_state using ((select auth.uid()) = user_id);
alter policy "user_game_state insert own" on public.user_game_state with check ((select auth.uid()) = user_id);
alter policy "user_game_state select own" on public.user_game_state using ((select auth.uid()) = user_id);
alter policy "user_game_state update own" on public.user_game_state using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy "Authenticated users can report others" on public.user_reports with check ((select auth.uid()) = reporter_id);

alter policy "web_push_own_delete" on public.web_push_subscriptions using ((select auth.uid()) = user_id);
alter policy "web_push_own_insert" on public.web_push_subscriptions with check ((select auth.uid()) = user_id);
alter policy "web_push_own_select" on public.web_push_subscriptions using ((select auth.uid()) = user_id);
alter policy "web_push_own_update" on public.web_push_subscriptions using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
