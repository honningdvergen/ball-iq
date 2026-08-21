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
