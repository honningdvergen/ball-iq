# Production runbook — Ball IQ

Manual SQL diagnostics for production incidents, organized by symptom. Each section: how to recognize the incident, queries to run in the Supabase production SQL editor, and how to interpret results.

**Database:** production project `blcisypmngimqkwxrrdm` at `https://supabase.com/dashboard/project/blcisypmngimqkwxrrdm`.

**Auth:** dashboard sessions only — no service-role key in this doc. RLS-bypass needed for cross-user queries; the dashboard SQL editor runs as service-role automatically.

**Audit trail:** Supabase's SQL editor stores recent queries per-user; a self-managed log isn't required for V1.

---

## Incident: a multiplayer room is stuck

**Symptoms:** users report the game won't advance; "Couldn't advance — leave the room and rejoin" banner appears for the host.

### Step 1 — find the affected room

```sql
SELECT id, code, state, current_question, host_id, capacity,
       created_at, started_at, ended_at,
       jsonb_array_length(coalesce(questions, '[]'::jsonb)) as q_count
FROM game_rooms
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

If the user reported a specific code, filter directly:

```sql
SELECT * FROM game_rooms WHERE code = 'ABC123';
```

### Step 2 — players in that room

```sql
SELECT user_id, name, score, answered_question, joined_at
FROM room_players
WHERE room_id = '<UUID from step 1>'
ORDER BY joined_at;
```

### Step 3 — host vs joiner identification

```sql
SELECT
  CASE WHEN rp.user_id = gr.host_id THEN 'HOST' ELSE 'JOINER' END as role,
  rp.user_id, rp.name, rp.score, rp.answered_question, rp.joined_at
FROM room_players rp
JOIN game_rooms gr ON gr.id = rp.room_id
WHERE rp.room_id = '<UUID>'
ORDER BY rp.joined_at;
```

### Diagnosis matrix

| `current_question` | Players' `answered_question` | Diagnosis |
|---|---|---|
| 0 | 0 (all) | Game never advanced past Q1. `advance_question` RPC failed (network blip) — see Finding 6.1. Stage 1 retry layer (commit `8b017c8`, 2026-05-04) absorbs single blips; if multiple in a row, host network was bad. |
| 0 | 0 for some, ≥0 for others | Players answered but `advance_question` never fired server-side. Host disconnected silently OR host RPC stuck. |
| ≥1 | All match `current_question - 1` | Game advanced normally, room is mid-game. |
| ≥1 | One or more lag behind | Specific player's `submit_answer` failed; server has correct state. |

### Recovery actions (user-side, none from dashboard)

The runbook is read-only by design. If a room is genuinely stuck and the host won't recover:
- The room will naturally expire as players leave (joiners can leave anytime via the back arrow)
- No manual cleanup needed — abandoned rooms don't actively harm anything
- Future v1.1: server-side timeout to auto-end games stuck > N minutes (parking lot)

---

## Incident: spike in join_room failures

**Symptoms:** users report "This room is full" or "No room with that code" repeatedly when they expect the room to be valid.

### Step 1 — recent join attempts visible in Supabase auth log

The actual `join_room` RPC failures aren't directly logged. Look for the symptom indirectly:

```sql
-- Count recent room creates vs joins by attempting to detect the disparity:
SELECT date_trunc('minute', created_at) as minute, count(*) as rooms_created
FROM game_rooms
WHERE created_at > now() - interval '30 minutes'
GROUP BY 1
ORDER BY 1;

-- If rooms_created is normal but users still complain → the issue is on
-- the join side (capacity check, code-not-found).
```

### Step 2 — check for code collisions or expired rooms

```sql
-- Multiple rooms with same code (shouldn't happen, but check)
SELECT code, count(*) FROM game_rooms
WHERE state IN ('lobby', 'playing')
GROUP BY code HAVING count(*) > 1;

-- Rooms in "ended" state that users might still be trying to join
SELECT code, ended_at, current_question
FROM game_rooms
WHERE state = 'ended'
  AND ended_at > now() - interval '15 minutes'
ORDER BY ended_at DESC LIMIT 20;
```

If matches return rows, the user might be trying to use a code from a recently-ended room. Their UI should have updated; this is a client-side bug, not a server issue.

---

## Incident: realtime subscriptions silently delivering nothing

**Symptoms:** users report player counts not updating in lobby, scores not syncing in gameplay, host's "Next question" not propagating to joiners.

### Step 1 — verify replication slot health

```sql
SELECT slot_name, plugin, slot_type, active, active_pid,
       restart_lsn, confirmed_flush_lsn,
       pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn) AS bytes_behind
FROM pg_replication_slots
WHERE slot_name LIKE '%supabase_realtime%';
```

**Healthy state:**
- 2 slots: `supabase_realtime_replication_slot_*` (plugin `wal2json`, this is postgres_changes) and `supabase_realtime_messages_replication_slot_*` (plugin `pgoutput`, broadcast/messages)
- Both `active = true`, `active_pid` non-null
- `bytes_behind` < 1 MB (normal). If millions of bytes behind, the realtime worker is stuck.

If the wal2json slot is missing or inactive: postgres_changes won't deliver. Restart the realtime worker via the dashboard (Settings → Database → Restart database — heavy-handed but safe in production-emergency).

### Step 2 — verify the multiplayer publication

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('game_rooms', 'room_players');
```

Both rows should appear. If missing:

```sql
-- Re-add a missing table to the publication (run only if needed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
```

After any publication change, NOTIFY PostgREST to reload its schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

### Step 3 — verify REPLICA IDENTITY

```sql
SELECT c.relname,
       CASE c.relreplident
         WHEN 'd' THEN 'DEFAULT (primary key)'
         WHEN 'n' THEN 'NOTHING'
         WHEN 'f' THEN 'FULL'
         WHEN 'i' THEN 'USING INDEX'
       END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('game_rooms', 'room_players');
```

**Required:** `room_players` MUST be `FULL` (per `feedback_terminal_data_via_ref.md` finding from Stage 1 spikes — DELETE payloads need full row to identify which player left). If not FULL:

```sql
ALTER TABLE public.room_players REPLICA IDENTITY FULL;
```

---

## Incident: question bank quality regression

**Symptoms:** user reports specific question IDs as broken (factually wrong, ambiguous, etc.).

### Step 1 — check review history for the user

```sql
SELECT question_id, source, status, updated_at
FROM question_review
WHERE reviewed_by = '<user_uuid>'
  AND status IN ('flagged', 'rejected')
ORDER BY updated_at DESC LIMIT 50;
```

### Step 2 — check overall flag rate per category

```sql
-- Combines all reviewers' decisions to find globally-problematic categories
SELECT
  qr.status,
  count(*) AS total
FROM question_review qr
WHERE qr.status IN ('flagged', 'rejected')
GROUP BY 1
ORDER BY 2 DESC;
```

(Cross-reference question_id values against `src/questions.js` to get cat/diff/tag — runbook can't do that join in SQL alone.)

---

## Operational queries (no incident, just monitoring)

### Active rooms right now

```sql
SELECT count(*) FROM game_rooms WHERE state IN ('lobby', 'playing');
```

### Room creation rate, last hour

```sql
SELECT date_trunc('minute', created_at) as minute, count(*)
FROM game_rooms
WHERE created_at > now() - interval '1 hour'
GROUP BY 1 ORDER BY 1;
```

### Players-per-room distribution

```sql
SELECT
  (SELECT count(*) FROM room_players rp WHERE rp.room_id = gr.id) as player_count,
  count(*) as rooms
FROM game_rooms gr
WHERE gr.state IN ('lobby', 'playing')
GROUP BY 1 ORDER BY 1;
```

### Daily active reviewers

```sql
SELECT date_trunc('day', updated_at) as day, count(distinct reviewed_by) as reviewers, count(*) as decisions
FROM question_review
WHERE updated_at > now() - interval '14 days'
GROUP BY 1 ORDER BY 1 DESC;
```

### Profile health

```sql
SELECT count(*) AS profiles_total,
       count(*) FILTER (WHERE total_score > 0) AS played_at_least_once,
       count(*) FILTER (WHERE created_at > now() - interval '7 days') AS new_signups_7d
FROM profiles;
```

---

## What this runbook does NOT cover (intentional gaps)

- **Performance triage** — needs Vercel Speed Insights dashboard or future error monitoring (Sentry decision pending in `docs/MONITORING_OPTIONS.md`).
- **User-specific session debugging** — auth.users data is sensitive; access via dashboard only on need.
- **Bulk modifications** — every modify operation should go through a code path (RPC or migration), not raw SQL via runbook.
- **Anything requiring service-role key locally** — service-role is for migrations and `publish-review.mjs`, not ad-hoc dashboard work.

---

## When to extend this runbook

After every production incident, ask: would a runbook entry have made triage faster? If yes, add a section. The four sections above were derived from real incident patterns (Stage 1 verification + audit work). New sections should follow the same shape: symptom, queries, diagnosis matrix.
