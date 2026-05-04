# scripts/ — operational tooling

This directory holds Node scripts that operate against the Supabase project. None of them ship to the client. They split into two groups:

- **One-shot maintenance** — `publish-review.mjs`, `find-vintage-candidates.mjs`, `phase1-migrate.mjs`. Manually-invoked, irregular cadence.
- **Stage 1 spike test suite** — `spike-1-realtime.mjs`, `spike-2-advance-race.mjs`. Run on a schedule (CI nightly + on demand).

The rest of this README focuses on the spike suite, which is the regression-safety surface for Stage 1 multiplayer.

---

## What the spikes test

| Spike | What it asserts |
|---|---|
| **spike-1** | One Supabase Realtime channel can carry **two** `postgres_changes` filters (one per table) and reliably deliver both event streams to the same subscriber. INSERT / UPDATE / DELETE all observed; cascade DELETE payloads carry full row data via REPLICA IDENTITY FULL. |
| **spike-2** | The `FOR UPDATE` + `expected_question` gate in `advance_question` serializes concurrent calls. Exactly one caller wins; the rest get `advanced=false, reason='expected_mismatch'`. Runs 70 iterations across 2/3/4-way concurrency to detect flakes. |

Both spikes use isolated `_spike_*` tables (separate from production `game_rooms` / `room_players`) and bespoke `_spike_write` / `_spike_advance` SECURITY DEFINER RPCs as the test fixtures. They exercise the same realtime + locking machinery the production tables use, but in a sandbox that won't pollute live game state.

## How to run locally

```bash
# Run individually
npm run test:spike-1
npm run test:spike-2

# Run both back-to-back
npm run test:spikes
```

Local runs read credentials from `.env.local` at the repo root. Required keys:

```
VITE_SUPABASE_KEY=...                  # anon key (already in .env.local for `vite dev`)
SUPABASE_SERVICE_ROLE_KEY=...          # service role key (NEVER commit)
```

If the legacy variables are absent, the spike scripts also accept the explicit names: `SPIKE_SUPABASE_ANON_KEY`, `SPIKE_SUPABASE_SERVICE_ROLE_KEY`.

The Supabase URL and test user email default to the production project + project owner's email when no env override is provided. Override either with:

```
SPIKE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
SPIKE_TEST_USER_EMAIL=spike-tester@balliq.app
```

## How to run in CI

> **BLOCKED — staging tier upgrade pending.** As of 2026-05-04, `spike-nightly` is incompatible with the free-tier staging project. Empirical testing shows free-tier doesn't deliver legacy `postgres_changes` events to channel subscribers (only the broadcast/messages model is wired). spike-1 reliably fails regardless of code state. See `docs/MULTIPLAYER.md` "Staging environment limitations" for diagnostic evidence. Decision pending: upgrade staging to Pro tier (~$25/month) vs rewrite spikes against the broadcast/messages model.

`.github/workflows/spike-nightly.yml` runs both spikes:

- **Schedule:** every night at 09:00 UTC (~02:00 PT, 11:00 CET) — chosen to land before working hours so a failed run is visible at start-of-day.
- **Trigger:** `workflow_dispatch` for manual re-runs.
- **Trigger:** `push` to any `staging` or `staging-*` branch.

Required GitHub repo secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `SPIKE_SUPABASE_URL` | Staging Supabase project URL (e.g., `https://abcd1234.supabase.co`) |
| `SPIKE_SUPABASE_ANON_KEY` | Staging anon key |
| `SPIKE_SUPABASE_SERVICE_ROLE_KEY` | Staging service role key — **never reuse production** |
| `SPIKE_TEST_USER_EMAIL` | Email of a test account in the staging project |

The staging project must have the `_spike_*` tables + `_spike_write` / `_spike_advance` RPCs deployed (same migration that's in production). Without these the scripts will fail at the first `_spike_write` call with a clear "function does not exist" error.

## Output format for CI

Each spike emits exactly one JSON line at the end of its stdout, prefixed `SPIKE_SUMMARY`:

```
SPIKE_SUMMARY {"spike":1,"status":"pass","roomCounts":{...},"playerCounts":{...},...}
SPIKE_SUMMARY {"spike":2,"status":"pass","totals":{...},"perBatch":[...]}
```

The CI workflow extracts these summaries and posts them to the run summary so the per-batch latency numbers are visible without scrolling raw logs. The exit code (0 = pass, non-zero = fail) is the source of truth for the workflow's pass/fail state.

## When a spike fails

The workflow does **not** automatically retry. False positives would erode trust in the suite — any failure should be looked at.

Failure modes to expect:

| Failure pattern | Likely cause | Action |
|---|---|---|
| `subscribe failed: TIMED_OUT` (spike-1) | Realtime cluster degraded or staging project paused due to inactivity | Re-run manually via `workflow_dispatch`. If repeats, check Supabase project status. |
| `event count mismatch` (spike-1) | REPLICA IDENTITY changed off FULL on one of the spike tables, OR a postgres_changes filter regression in the Supabase image | Investigate — this is a real Stage 1 contract regression. |
| `event count mismatch` (spike-1) AND realtime worker logs mention only `Broadcast Changes` activity | Free-tier staging not delivering legacy postgres_changes — see `docs/MULTIPLAYER.md` "Staging environment limitations" | Not a production regression. Awaiting tier-upgrade decision. |
| `flakes > 0` (spike-2) | The `FOR UPDATE + expected_question` gate stopped serializing — a regression in `_spike_advance` (or by extension the production `advance_question` if the migration was modified) | Investigate — this is the bug class that broke production in Stage 1C iterations. |
| `generateLink: ...` failure | Test user doesn't exist in staging, or service role key is invalid | Check staging project state + secret values. |
| `missing required env vars` | Secret missing in GitHub repo settings | Add the secret under Settings → Secrets and variables → Actions. |

If staging Supabase is unreachable (project paused, region outage), the workflow fails loudly. There's no auto-recover — that would mask a real outage.

## When to add a new spike

Add a spike test for any **SQL contract change** that:

- Introduces a new RPC (especially SECURITY DEFINER) called from realtime / multiplayer code paths
- Modifies a row-locking pattern (`FOR UPDATE`, `FOR NO KEY UPDATE`, advisory locks)
- Adds or modifies a realtime publication / `postgres_changes` filter
- Touches the cascade-DELETE behavior on `game_rooms` / `room_players` (or any table that other tables FK to)

The spike doesn't need to test happy-path behavior (the app's smoke tests cover that). Spike tests are for **race conditions and contract guarantees** — the things that work on a single dev machine but break under concurrency or specific event timing.

A spike test should:

1. Set up a controlled scenario (often: insert known state, fire concurrent calls).
2. Assert specific contract guarantees (exactly-one-winner, all-events-delivered, capacity-not-exceeded).
3. Repeat enough iterations to catch flakes (50× for tight races, 10× for slow ones).
4. Print a human-readable summary + a `SPIKE_SUMMARY {...}` JSON line at the end.
5. Exit 0 on pass, non-zero on fail.

Use `scripts/lib/spike-utils.mjs` for env loading, auth, assertion helpers, and the JSON summary emitter — keeps boilerplate consistent.

## Test isolation

- Each spike iteration uses `crypto.randomUUID()` for room IDs → concurrent runs on the same project don't collide.
- Each iteration cleans up its own rows (DELETE at end). If a run crashes mid-way, stale `_spike_room` / `_spike_player` rows may persist; they're harmless (separate tables from production) but accumulate. A monthly manual sweep is fine; no auto-purge implemented.
- Test users are NOT created on the fly — the same configured `SPIKE_TEST_USER_EMAIL` account is reused. This means concurrent CI runs sharing a staging project would conflict on auth state. Don't run two workflows simultaneously against the same staging project.

## Future: spike-3 — `join_room` capacity race (scoped, not yet implemented)

**What it would test:** `join_room`'s capacity check + row-locking. Fire N > capacity concurrent join attempts; verify exactly capacity succeed, the rest fail with errcode `53300` ("This room is full").

**Why it's not built yet:** The other spikes use a single test user. spike-3 needs N concurrent users with distinct `auth.uid()` values to exercise the real concurrency path. Two viable approaches:

1. **Pre-allocate a pool of test users** in the staging project (e.g., `spike-pool-1@balliq.app` through `spike-pool-10@balliq.app`). Sign each in once at test start, reuse across iterations. Heaviest setup but cleanest contract test.
2. **Per-iteration `admin.createUser()` + cleanup** — creates N users on the fly, races them through `join_room`, deletes them after. Generates auth.users audit trail noise.
3. **Add a `_spike_join_room` SECURITY DEFINER RPC** that takes a fake `user_id` argument and bypasses `auth.uid()`. Mirrors the spike-2 pattern (custom test RPC). Requires SQL migration.

Recommended: option 1 (pool of test users). Tracked as a follow-up; deferred to keep the initial CI rollout simple. If a `join_room` regression bites in production before then, escalate to "implement spike-3 this week."

## Existing one-shot scripts

Briefly, for orientation:

- `publish-review.mjs` — promotes reviewed-OK questions from the staging review pool into the production QB. Manual.
- `find-vintage-candidates.mjs` — heuristically flags QB rows that look like they could be tagged "vintage" (older era questions). Manual content tooling.
- `phase1-migrate.mjs` — one-shot migration helper used during the Phase I `user_game_state` table cutover. Already executed; preserved as historical reference.

These are NOT part of the spike test suite and don't run in CI.
