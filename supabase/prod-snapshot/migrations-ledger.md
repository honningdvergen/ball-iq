# Migrations ledger — prod vs repo (2026-07-14)

Prod (`supabase_migrations.schema_migrations` via MCP `list_migrations`): **31 entries**.
Repo (`supabase/migrations/`): **23 files**.

## Applied in prod, NO repo file (9) — the reconstruction debt
| Version | Name | What it did (from name + observed schema) |
|---|---|---|
| 20260517193226 | sprint_26_x2_profile_onboarded_at | `profiles.onboarded_at` column (+ comment, still present) |
| 20260518143119 | sprint_28_z4_drop_upsert_login_streak | dropped legacy RPC (verified gone 2026-07-13) |
| 20260522192442 | sprint69_kk1_friendships_delete_policy | "Users can delete their own friendships" policy |
| 20260522192503 | sprint69_kk3_drop_redundant_profiles_select_policy | policy cleanup |
| 20260522193148 | sprint69_kk2_drop_legacy_profiles_columns | dropped legacy profiles columns |
| 20260531180321 | sprint84_aaa2_username_profanity_filter_translate_fix | current `is_profane_username` (translate map) |
| 20260531180718 | sprint84_aaa3_get_block_mask_rpc | `get_block_mask()` RPC |
| 20260611154026 | sprint97_delete_user_account_v2_1_storage_guard | avatar-cleanup guard in `delete_user_account` |
| 20260611154121 | sprint97_delete_user_account_v2_2_room_players | room_players cleanup in `delete_user_account` |

The *effects* of all 9 are captured in this snapshot (`functions.sql` +
`schema.md`), so the debt is now documented rather than invisible. Recreating
the 9 as retroactive repo files is optional polish — the snapshot supersedes.

## In repo, NEVER applied to prod (1)
- `v1_2_async_challenges.sql` — complete, security-hardened, grants anon so
  challenge recipients can play without signup. Zero client callers. This is
  sleeping giant A: applying it is a *product decision* (enables per-game async
  challenges), not a repair. Caveat from the scan: 35 question ids were
  rewritten in triage — validate ids on replay before wiring the client.

## Name mismatch (1, harmless)
- repo `v1_3_reap_stale_rooms.sql` ↔ prod `v1_3_reap_stale_rooms_fn` (20260712122818).

## Dashboard-only objects (now captured)
- pg_cron job **reap-stale-rooms** (`7 * * * *` → `select public.reap_stale_rooms();`, active) — see `schema.md`.
- `send_push_on_notification` webhook trigger (secrets REDACTED — see README).

## Observations for future migrations (low, non-urgent)
- `game_rooms.mode` CHECK still allows `'hotstreak'` (constraint is NOT VALID);
  client UI can no longer produce it. Tighten alongside MP answer-key Phase 2.
- Table grants are wider than policies in places (e.g. `scores` grants UPDATE/DELETE
  to authenticated with no UPDATE/DELETE policy — RLS blocks it, so no exposure,
  but REVOKE would be cleaner and match the house rule).
- `set_updated_at` + `profiles_check_profanity` have EXECUTE granted to PUBLIC
  (trigger functions; default grant, not directly exploitable — cosmetic REVOKE candidate).

## 2026-08-20 — v1_6_streak_aware_web_reminder (applied via MCP, file in repo)
`enqueue_web_daily_reminders()` replaced: reminder body is now composed per
player from `user_game_state.login_streak` at send time. ⚠️ The `lastDay`
freshness check is load-bearing — `streak` keeps its stale value after a lapse,
so composing without it would claim a dead streak lives. Recipient logic
byte-identical to the previous version (verified against pg_get_functiondef
before replace). Grants: execute revoked from public/anon/authenticated.

- **v1_6_challenge_events** (2026-08-20, via MCP apply_migration; repo file `supabase/migrations/v1_6_challenge_events.sql`) — challenge_events table + record_challenge_event() RPC for /c/ loop measurement. Verified post-apply: 0 client table grants, 0 policies, RLS on, RPC grants exactly anon+authenticated.

- **v1_6_streak_repair** (2026-08-20, applied via MCP; repo file `supabase/migrations/v1_6_streak_repair.sql`) — tick_login_streak now stashes an un-shielded fallen streak (>=3) as fell/fellDay for same-local-day repair; new repair_login_streak() restores it once (fell+current), authenticated-only with explicit REVOKEs. Verified live on balliqdev2 (state restored): lapse->fell:10, repair->11, second repair refused. Pre-replace drift check: live md5 matched snapshot.

## 2026-08-20 — v1_6_anon_guest_entry (⚠️ WRITTEN, NOT YET APPLIED)
File in repo; prod untouched (no connector/CLI auth in the authoring session).
Adds `profiles.is_anon` (+ handle_new_user stamps it, `on_auth_user_upgraded`
trigger on auth.users clears it on upgrade), `set_player_name(p_code, p_name)`
(lobby-only self-rename, profanity-gated, grant authenticated / revoke
public+anon), and `cleanup_stale_anon_users()` + pg_cron `37 4 * * *`
(explicit per-table sweep mirroring delete_user_account; "stale" = anonymous,
30+ days old, no auth.sessions row refreshed in 30 days; execute revoked from
public/anon/authenticated). Client code deployed ahead of it is inert-safe.
⚠️ Pairs with a DASHBOARD toggle: Auth → Sign In / Up → Anonymous sign-ins ON.
Refresh the snapshot after applying.

- **v1_6_funnel_events** (2026-08-21, via MCP apply_migration; repo file
  `supabase/migrations/v1_6_funnel_events.sql`) — funnel_events table +
  record_funnel_event(text, jsonb, uuid) RPC, so loopEvent() stops being
  write-only. Clarity's export API returns only its own auto-detected smart
  events, so onboard-done-*, first-game-started and clubq-play were
  unreadable and every scouting-report claim about them was reasoning rather
  than measurement. loopEvent now fans out to BOTH. Timed to land before the
  season-start traffic, on the principle that instrumentation added after a
  spike measures the tail. Verified post-apply: 0 client table grants, RLS on,
  0 policies, RPC granted anon+authenticated only, cleanup_funnel_events
  postgres-only, pg_cron '23 4 * * *' prunes past 180 days. End-to-end probe
  row confirmed.

- **v1_6_streak_repair_floor_2** (2026-08-21, via MCP apply_migration) —
  tick_login_streak repair floor 3 -> 2. Measured first: 179 rows carry a
  login_streak, 33 at 3+ but 54 at 2+, and ZERO have ever held a fell stash
  (the feature was one day old). Applied as a targeted `replace()` on the LIVE
  pg_get_functiondef rather than a retyped body — one token changed, with a
  raise if the token is absent. First attempt FAILED because the REVOKE line
  guessed a (integer, integer) signature; the real one is (p_local_day
  integer). It rolled back atomically and nothing changed. Verified after:
  new token at position 1854 where the old one sat, grants still
  postgres+authenticated. Client guest branch moved to match — the threshold
  is duplicated by necessity (guests have no RPC), so both must move together.

- **v1_6_anon_guest_entry** (2026-08-21, via MCP apply_migration — the entry
  above marked "WRITTEN, NOT YET APPLIED" is now SUPERSEDED) — profiles.is_anon
  (+ handle_new_user stamps it), on_auth_user_upgraded trigger clearing it on
  upgrade, set_player_name(text,text) [grant authenticated, revoke
  public+anon], cleanup_stale_anon_users() [postgres only] and pg_cron
  '37 4 * * *'. Paired with the DASHBOARD toggle Auth → Sign In/Providers →
  Allow anonymous sign-ins, which Alex enabled the same session.
  Pre-apply safety check: 0 anonymous users, 205 real accounts, and the sweep
  guards on `is_anonymous is true` so real accounts cannot be caught.
  Post-apply, VERIFIED END TO END: a live POST /auth/v1/signup returned
  is_anonymous=true with a session; the trigger created profile
  player_1437af8f with is_anon=true; cleanup_stale_anon_users() was INVOKED
  and returned 0 with 205 real accounts present, proving the guard. Test
  account deleted; back to 205/205 with 0 anonymous.

- **v1_9_challenge_result_notification** (2026-08-29, via MCP apply_migration,
  Alex approved "apply it") — challenge_events.sender_id uuid;
  record_challenge_event DROPPED (5-arg) and recreated as 6-arg with
  p_sender uuid default null [grant anon+authenticated, revoke public]. On a
  real 'played' with a valid, distinct, existing p_sender it inserts a
  notifications row type='challenge_result' (head-to-head body), which the
  existing send-push/send-web-push triggers deliver — their default case
  reads payload.body, no edge redeploy needed. Dedupe: one per
  (challenger, date, responder) via a 48h payload lookback; anon responders
  collapse to one/day. Client half (share links carry ?f=<uuid>, api/c.js
  forwards it, three RPC sites pass p_sender) shipped in repo commit 184362c
  AFTER the migration — ship order mattered, the 6-arg call 404s against the
  old function. ⚠️ The repo migration FILE could not be written this session
  (tooling permission); prod + this ledger entry are the source of truth
  until the file lands. Verified single overload + grants post-apply.

- **v1_9b_notifications_type_challenge_result** (2026-08-29, minutes after
  v1_9) — notifications_type_check re-created to admit 'challenge_result'.
  The live e2e caught v1_9's miss: the CHECK rejected the insert and the
  exception rolled back the WHOLE record_challenge_event call, losing the
  'played' event too. Lesson for every future notification type: the type
  CHECK gates inserts and a definer-function insert failure is not partial —
  extend the constraint IN the same migration that introduces a type.
  E2E after fix: anon responder on a ?f= link produced the notifications row
  ("A friend took your Daily 7 challenge — you hold the edge 4–1").
