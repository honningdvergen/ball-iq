// Apply curated corrections from scripts/_name-overrides.mjs to the generated
// Mystery Player pool.
//
// ⚠️ RUN ORDER — LAST in the pipeline, because every earlier step rewrites the
// pool from Wikidata and would undo it:
//   fetch-squads -> build-mystery-pool -> fetch-careers -> derive-pool-nationality -> THIS
//
// Two jobs, both defences against upstream data we do not control:
//   1. Restore names that have been vandalised or mangled on Wikidata.
//   2. Drop entries Wikidata places in a squad they were never in.
//
// Both report no-ops loudly. An override that no longer matches means either
// Wikidata was fixed (delete the entry) or the QID moved (investigate) — and
// either way silence would be the wrong answer.
import { readFileSync, writeFileSync } from 'fs';
import { NAME_OVERRIDES, NOT_IN_SQUAD } from './_name-overrides.mjs';

const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const schedule = new Set(JSON.parse(readFileSync('src/data/mysterySchedule.json', 'utf8')));

let renamed = 0, stale = 0;
for (const [qid, name] of Object.entries(NAME_OVERRIDES)) {
  const p = pool.find((x) => x.id === qid);
  if (!p) { console.log(`  ⚠️  ${qid}: not in the pool at all — stale override?`); stale++; continue; }
  if (p.name === name) { console.log(`  ○ ${qid}: already "${name}" — Wikidata may be fixed; consider deleting this override`); stale++; continue; }
  console.log(`  ✎ ${qid}: "${p.name}" -> "${name}"`);
  p.name = name;
  renamed++;
}

let removed = 0;
const keep = [];
for (const p of pool) {
  const reason = NOT_IN_SQUAD[p.id];
  if (!reason) { keep.push(p); continue; }
  // The schedule is a frozen log. Removing a scheduled answer leaves that day
  // with no resolvable player, and the screen falls back to "No Mystery Player
  // today" — a silently dead puzzle, which is exactly the Transfer Trail
  // failure. Refuse loudly instead.
  if (schedule.has(p.id)) {
    console.error(`\n✗ REFUSING: ${p.name} (${p.id}) is a SCHEDULED answer and cannot be removed.`);
    console.error(`  ${reason}`);
    console.error('  Fix: re-generate the schedule for FUTURE days only, then re-run.');
    process.exit(1);
  }
  console.log(`  ✗ removed ${p.name} — ${reason}`);
  removed++;
}

writeFileSync('src/data/mysteryPool.json', JSON.stringify(keep, null, 2));

console.log(`\nrenamed ${renamed} · removed ${removed} · no-op overrides ${stale}`);
console.log(`pool: ${pool.length} -> ${keep.length}`);
const unresolved = [...schedule].filter((id) => !keep.some((p) => p.id === id));
console.log(`scheduled answers still resolvable: ${schedule.size - unresolved.length}/${schedule.size}`);
if (unresolved.length) { console.error('✗ schedule broken'); process.exit(1); }
