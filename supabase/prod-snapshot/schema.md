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

**challenge_events** (0, added 2026-08-20) — id:uuid¹, event:text CHECK(open|played), challenge_date:date, sender_score:int CHECK(0..7), sender_name:text CHECK(len≤24), visitor_id:uuid, my_score:int CHECK(0..7), created_at:tstz =now(). RLS ON, ZERO policies, ZERO client table grants — writes only via record_challenge_event() (SECURITY DEFINER, granted anon+authenticated, 500/hr global throttle). Indexes: created_at; (challenge_date,event).

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


## Mates' leagues (v3_0, applied 2026-10-16)
Six tables, RLS on, NO policies, every grant revoked from anon/authenticated/public; clients reach rows only through the nine security-definer RPCs (authenticated-only). Verified after apply: anon table grants 0.

```sql
create table public.leagues (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$'),
  name        text not null check (char_length(name) between 1 and 32),
  tz          text not null,
  owner_id    uuid references auth.users (id) on delete set null,
  seed        text not null default 'manual'
              check (seed in ('manual','h2h_footle','h2h_trail','h2h_top10','h2h_daily7')),
  created_at  timestamptz not null default now()
);
create index leagues_owner_id_idx on public.leagues (owner_id);
comment on table public.leagues is
  'Mates'' leagues. Read and written only through the league RPCs (v3_0). tz is an IANA name from the creator''s device; the week goes final at Monday 00:00 there.';

create table public.league_members (
  league_id     uuid not null references public.leagues (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 22),
  joined_at     timestamptz not null default now(),
  joined_day    integer not null,
  left_at       timestamptz,
  seen_week     integer,
  primary key (league_id, user_id)
);
create index league_members_user_id_idx on public.league_members (user_id);
create index league_members_active_user_idx on public.league_members (user_id) where left_at is null;
comment on column public.league_members.joined_day is
  'Day index (days since 1970-01-01) in the league''s zone when the member joined. Points count from this day, in full.';

create table public.league_results (
  user_id      uuid not null references auth.users (id) on delete cascade,
  game         text not null check (game in ('footle','daily7','trail','top10')),
  edition      integer not null check (edition >= 0),
  day_index    integer not null,
  bucket       smallint not null check (bucket between 0 and 30),
  won          boolean not null,
  points       smallint not null check (points between 1 and 10),
  recorded_at  timestamptz not null default now(),
  primary key (user_id, game, edition)
);
create index league_results_user_day_idx on public.league_results (user_id, day_index);
create index league_results_recorded_at_idx on public.league_results (recorded_at);
comment on table public.league_results is
  'One result per player per daily puzzle, first write wins. Written only by record_league_result(); points computed in SQL by _league_points(). Counts in every league the player is in.';

create table public.league_weeks (
  league_id   uuid not null references public.leagues (id) on delete cascade,
  week_start  integer not null,
  final_at    timestamptz not null default now(),
  standings   jsonb not null,
  primary key (league_id, week_start)
);
comment on table public.league_weeks is
  'Final tables, written on the first read after the whistle (or the early final). Keeps the final card stable if members later leave or rename. Holds user ids: never returned to clients as stored.';

create table public.league_claims (
  token_hash  text primary key,
  from_user   uuid not null references auth.users (id) on delete cascade,
  expires_at  timestamptz not null
);
create index league_claims_from_user_idx on public.league_claims (from_user);

create table public.league_join_tries (
  user_id   uuid not null references auth.users (id) on delete cascade,
  tried_at  timestamptz not null default now()
);
create index league_join_tries_user_idx on public.league_join_tries (user_id, tried_at);

alter table public.leagues           enable row level security;
alter table public.league_members    enable row level security;
alter table public.league_results    enable row level security;
alter table public.league_weeks      enable row level security;
alter table public.league_claims     enable row level security;
alter table public.league_join_tries enable row level security;
-- No policies. Defaults grant client roles privileges on a new public table,
-- so revoke explicitly (standing rule).
revoke all on table public.leagues           from anon, authenticated, public;
revoke all on table public.league_members    from anon, authenticated, public;
revoke all on table public.league_results    from anon, authenticated, public;
revoke all on table public.league_weeks      from anon, authenticated, public;
revoke all on table public.league_claims     from anon, authenticated, public;
revoke all on table public.league_join_tries from anon, authenticated, public;
```
