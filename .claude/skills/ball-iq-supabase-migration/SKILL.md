---
name: ball-iq-supabase-migration
description: Write, review or apply a Supabase migration for Ball IQ — any CREATE TABLE, CREATE FUNCTION/RPC, GRANT, or RLS policy change. Use before writing SQL that touches the prod database, and when reviewing a migration someone else wrote. Complements the generic supabase-postgres-best-practices skill with the two security rules this project has had to learn repeatedly.
---

# Ball IQ migrations

Prod project: `blcisypmngimqkwxrrdm`. Access via the Supabase MCP connector (the local `supabase-prod` MCP is broken). **`main` is prod** and there is no staging.

## Two rules the user has taught more than once

These exist because `supabase_admin` defaults are permissive and the failure is silent — nothing errors, the data is just exposed.

**1. Every function migration ends with an explicit REVOKE.**
```sql
grant execute on function public.my_fn(...) to authenticated;
revoke execute on function public.my_fn(...) from public;   -- ALWAYS last
```
Without it, `PUBLIC` (which includes `anon`) keeps execute.

**2. Every CREATE TABLE needs explicit REVOKE lines.**
`supabase_admin` defaults grant `anon` full DML on new public tables. Enable RLS *and* revoke — RLS without a policy blocks reads, but the grant is still wrong and the next policy you add may open more than you meant.

Current prod state is clean on this: **`anon` holds zero table grants** across all 13 tables. Keep it that way. The only intentional `anon` function grants are `is_profane_username` and `report_question`.

## Verify against the snapshot, not against memory

`supabase/prod-snapshot/` holds a committed copy of prod (captured 2026-07-14): all 30 function definitions verbatim, 13 tables, 28 policies, grants, indexes, triggers, the pg_cron job. Read it before writing a `create or replace` — **prod has drifted from the repo in both directions** (31 applied migrations vs 23 repo files; 9 prod-only changes with no file; `v1_2_async_challenges.sql` written but never applied, by design).

`migrations-ledger.md` in that directory reconciles the difference. **Refresh the snapshot after any dashboard-side change** — a stale snapshot is the disease it cured.

## Gotchas that have cost real time

- **`game_rooms` uses `state`, not `status`.** Verify live before any `create or replace`.
- **The `send_push_on_notification` trigger embeds live secrets** (service_role JWT + webhook secret) in its definition — standard Supabase webhook plumbing. Never commit an unredacted `pg_dump`; scrub the trigger first. **Rotating the service_role key requires RECREATING this trigger** or push dies silently.
- **`QUESTION_DURATION_MS` is duplicated** client-side (App.jsx) and server-side (`submit_answer`). Drift = unfair scoring. Touch both in the same change.
- **`game_rooms.mode` CHECK still allows `'hotstreak'`** (constraint is NOT VALID) though no UI can produce it. Tighten alongside MP answer-key Phase 2.
- Grants are wider than policies in a few places (`scores` UPDATE/DELETE, `profiles` DELETE) — RLS blocks them so there's no exposure, but they're cosmetic-REVOKE candidates.

## MP answer key — know the phase

`start_game` still writes `correct` into `game_rooms.questions`, readable by any client. **Scoring is safe** (`submit_answer` scores server-side), **secrecy is not**. Phase 1 dual-writes to `room_answer_keys` (RLS on, all grants revoked) with disclosure via the gated `reveal_question` RPC. Phase 2 — stripping `correct` from the payload — is deliberately deferred until native clients have *adopted* build ≥ 1.3.1(43). Adoption, not release. Don't force it.
