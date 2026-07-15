# Prod schema — tables, RLS, policies, grants, triggers, indexes, cron

Captured 2026-07-14. All 13 public tables have **RLS enabled**. Row counts are
point-in-time. Function source lives in `functions.sql`.

## Tables (columns abridged to name:type; ¹=PK, →=FK, ✓=NOT NULL default noted)

**profiles** (58 rows) — id:uuid¹→auth.users, username:text UNIQUE, avatar_id:text ='ball', total_score:int =0, games_played:int =0, correct_answers:int =0, created_at:tstz =now(), avatar_url:text, xp:int =0, stats:jsonb ={}, onboarded_at:tstz (comment: cross-device onboarding, Sprint 26 X2)

**scores** (139) — id:uuid¹ =gen_random_uuid(), user_id:uuid→profiles, game_mode:text, score:int, correct_answers:int =0, total_questions:int =0, created_at:tstz =now()

**friendships** (3) — id:uuid¹, requester_id:uuid→profiles, addressee_id:uuid→profiles, status:text ='pending', created_at:tstz

**question_review** (4102) — question_id:text¹, reviewed_by:uuid¹→auth.users, source:text CHECK(qb|tf), status:text ='pending' CHECK(pending|approved|rejected|flagged), edits:jsonb, notes:text, reviewed_at:tstz, updated_at:tstz

**user_game_state** (58) — user_id:uuid¹→profiles, daily_scores:jsonb ={}, daily_wrong_answers:jsonb ={}, daily_all_answers:jsonb ={}, wordle_state:jsonb ={}, login_streak:jsonb, updated_at:tstz

**game_rooms** (52) — id:uuid¹, code:text, host_id:uuid, capacity:int =10 CHECK(1..10), state:text ='lobby' CHECK(lobby|playing|ended), current_question:int =0, questions:jsonb, started_at/ended_at/created_at:tstz, current_question_started_at:tstz, mode:text ='race' CHECK(race|hotstreak|survival — **NOT VALID**; 'hotstreak' still DB-legal, UI can no longer produce it)

**room_players** (56) — room_id:uuid¹→game_rooms, user_id:uuid¹, name:text, avatar:text ='⚽', score:int =0, answered_question:int =-1, joined_at:tstz, disconnected_at:tstz, streak:int =0, best_streak:int =0, eliminated_at_q:int

**room_answer_keys** (1) — room_id:uuid¹→game_rooms, keys:jsonb. NO grants to anon/authenticated (that's the point — answer keys unreadable by clients; disclosure only via reveal_question RPC)

**user_reports** (0) — id:uuid¹, reporter_id:uuid→auth.users, reported_id:uuid, reason:text CHECK(offensive_username|harassment|spam|other), message:text CHECK(len≤500), created_at:tstz. UNIQUE(reporter,reported,reason)

**user_blocks** (0) — blocker_id:uuid¹→auth.users, blocked_id:uuid¹→auth.users, created_at:tstz

**question_reports** (0) — id:uuid¹, question_id:text, question_text/picked/correct_answer/mode/reason:text, reporter_id:uuid, created_at:tstz

**notifications** (1) — id:uuid¹, user_id:uuid→auth.users, type:text CHECK(play_invite|friend_request|friend_accept), actor_id:uuid→auth.users, actor_name/actor_avatar:text, payload:jsonb ={}, read:bool =false, created_at:tstz

**device_tokens** (8) — id:uuid¹, user_id:uuid→auth.users, token:text UNIQUE, platform:text ='ios', updated_at:tstz

## Policies (28)
- device_tokens: SELECT/DELETE own (auth.uid()=user_id)
- friendships: SELECT/DELETE own (either side); INSERT requester=self; UPDATE by addressee (authenticated)
- game_rooms: SELECT is_room_member(id) (authenticated)
- room_players: SELECT is_room_member(room_id) (authenticated)
- notifications: SELECT/UPDATE/DELETE own
- profiles: SELECT everyone (true); INSERT/UPDATE own
- question_review: SELECT/INSERT/UPDATE/DELETE reviewed_by=self
- scores: SELECT everyone (true); INSERT own
- user_blocks: SELECT/INSERT/DELETE blocker=self (authenticated)
- user_game_state: SELECT/INSERT/UPDATE/DELETE own
- user_reports: INSERT reporter=self (authenticated) — no SELECT policy (write-only inbox)

## Table grants (anon has ZERO table grants — REVOKE discipline held)
authenticated: device_tokens D,S · friendships D,I,S,U · game_rooms S · notifications D,S,U · profiles D,I,S · question_review D,I,S,U · room_players S · scores D,I,S,U · user_blocks D,I,S · user_game_state D,I,S,U · user_reports I
Note: grants are wider than policies in spots (scores U/D, profiles D have no matching policy → RLS blocks; cosmetic-REVOKE candidates).

## Function grants
anon: is_profane_username, report_question (both intentional). PUBLIC: profiles_check_profanity, set_updated_at (trigger fns; default grant, cosmetic-REVOKE candidates). Everything else: authenticated only.

## Triggers (6)
- question_review_set_updated_at BEFORE UPDATE ON question_review → set_updated_at()
- on_profile_created AFTER INSERT ON profiles → create_user_game_state_for_new_profile()
- profiles_profanity_check BEFORE INSERT OR UPDATE OF username ON profiles → profiles_check_profanity()
- friendships_notify_request AFTER INSERT ON friendships → notify_friendship_event()
- friendships_notify_accept AFTER UPDATE OF status ON friendships → notify_friendship_event()
- send_push_on_notification AFTER INSERT ON notifications → supabase_functions.http_request('https://blcisypmngimqkwxrrdm.supabase.co/functions/v1/send-push', 'POST', '{"Content-type":"application/json","Authorization":"Bearer [REDACTED — service_role JWT; lives in pg_trigger in prod; recreate trigger if key rotates]","x-webhook-secret":"[REDACTED — matches PUSH_WEBHOOK_SECRET on the edge function]"}', '{}', '5000')

## Indexes (28)
device_tokens: pkey, token UNIQUE, user_idx · friendships: pkey, (requester,addressee) UNIQUE, (addressee,status) · game_rooms: pkey, host_id, **code UNIQUE WHERE state<>'ended'** · notifications: pkey, (user_id,read,created_at DESC) · profiles: pkey, username UNIQUE · question_reports: pkey, (question_id,created_at DESC) · question_review: pkey(question_id,reviewed_by), (reviewed_by,status) · room_answer_keys: pkey · room_players: pkey(room_id,user_id), user_id · scores: pkey · user_blocks: pkey(blocker,blocked), blocked_idx · user_reports: pkey, created_at DESC, (reporter,reported,reason) UNIQUE, (reported_id,created_at DESC)

## pg_cron (1) — was dashboard-only until this snapshot
- jobid 1 · **reap-stale-rooms** · `7 * * * *` · `select public.reap_stale_rooms();` · active

## Edge functions (1)
- **send-push** v11, ACTIVE, verify_jwt=true (source retrievable via MCP get_edge_function; not embedded here)
