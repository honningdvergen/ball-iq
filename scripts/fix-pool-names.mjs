// Apply curated corrections from scripts/_name-overrides.mjs to the generated
// Mystery Player pool.
//
// ⚠️ RUN ORDER — LAST in the pipeline, because every earlier step rewrites the
// pool from Wikidata and would undo it:
//   fetch-squads -> build-mystery-pool -> fetch-careers -> derive-pool-nationality -> THIS
//
// Four jobs, all defences against upstream data we do not control:
//   1. Restore names that have been vandalised or mangled on Wikidata.
//   2. Drop entries Wikidata places in a squad they were never in.
//   3. Correct careers whose spells are linked to something that is not the
//      club (a city, a country, another sport), and the club label with them.
//      This one also rewrites src/data/mysteryCareers.json.
//   4. Restore birth dates that were wrong on Wikidata on the day our caches
//      were fetched. The caches keep the wrong date after Wikidata is fixed.
//
// The first two report no-ops loudly. An override that no longer matches means either
// Wikidata was fixed (delete the entry) or the QID moved (investigate) — and
// either way silence would be the wrong answer.
import { readFileSync, writeFileSync } from 'fs';
import { NAME_OVERRIDES, NOT_IN_SQUAD, CLUB_FIXES, BIRTH_FIXES } from './_name-overrides.mjs';

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

// ── 3. careers and club labels ──────────────────────────────────────────────
// The careers file interns club names: `c` is the table, `p[id]` a list of
// [index into c, start, end]. Indices are positions, so a name is only ever
// APPENDED to the table, never removed or reordered.
const careers = JSON.parse(readFileSync('src/data/mysteryCareers.json', 'utf8'));
const clubIndex = new Map(careers.c.map((n, i) => [n, i]));
const idx = (name) => {
  if (!clubIndex.has(name)) { clubIndex.set(name, careers.c.length); careers.c.push(name); }
  return clubIndex.get(name);
};
let fixed = 0, settled = 0;
for (const [qid, fix] of Object.entries(CLUB_FIXES)) {
  const p = keep.find((x) => x.id === qid);
  if (!p) { console.log(`  ⚠️  ${qid}: not in the pool at all — stale club fix?`); stale++; continue; }
  const before = JSON.stringify([p, careers.p[qid]]);
  let spells = (careers.p[qid] || []).map(([i, a, b]) => [careers.c[i], a, b]);
  for (const name of fix.drop || []) spells = spells.filter((sp) => sp[0] !== name);
  for (const [was, now] of Object.entries(fix.rename || {})) for (const sp of spells) if (sp[0] === was) sp[0] = now;
  for (const [name, [a, b]] of Object.entries(fix.years || {})) {
    const at = spells.filter((sp) => sp[0] === name);
    if (at.length !== 1) { console.error(`\n✗ ${p.name} (${qid}): expected one "${name}" spell to re-date, found ${at.length}`); process.exit(1); }
    at[0][1] = a; at[0][2] = b;
  }
  for (const [name, a, b] of fix.add || [])
    if (!spells.some((sp) => sp[0] === name && sp[1] === a && sp[2] === b)) spells.push([name, a, b]);
  careers.p[qid] = spells.map(([name, a, b]) => [idx(name), a, b]);
  Object.assign(p, { club: fix.club, clubId: fix.clubId, country: fix.country, clubCount: spells.length });
  if (fix.slot) p.slot = fix.slot;
  if (fix.position) p.position = fix.position;
  if (JSON.stringify([p, careers.p[qid]]) === before) { settled++; continue; }
  console.log(`  ✎ ${p.name}: ${p.club} · ${spells.map(([n, a, b]) => `${n} ${a ?? '?'}-${b ?? ''}`).join(' | ')}`);
  fixed++;
}
writeFileSync('src/data/mysteryCareers.json', JSON.stringify(careers));

// ── 4. birth dates ──────────────────────────────────────────────────────────
// `born` is what the reveal and the era hint print; `dob` is what the ranking
// reads. They are set together so a row can never tell two stories.
let dated = 0, datedAlready = 0;
for (const [qid, fix] of Object.entries(BIRTH_FIXES)) {
  const p = keep.find((x) => x.id === qid);
  if (!p) { console.log(`  ⚠️  ${qid}: not in the pool at all — stale birth fix?`); stale++; continue; }
  const born = Number(fix.dob.slice(0, 4));
  if (p.dob === fix.dob && p.born === born) { datedAlready++; continue; }
  console.log(`  ✎ ${p.name}: born ${p.dob || p.born} -> ${fix.dob}`);
  p.dob = fix.dob; p.born = born;
  dated++;
}

writeFileSync('src/data/mysteryPool.json', JSON.stringify(keep, null, 2));

console.log(`\nrenamed ${renamed} · removed ${removed} · no-op overrides ${stale}`);
console.log(`club fixes applied ${fixed} · already in place ${settled}`);
console.log(`birth dates corrected ${dated} · already in place ${datedAlready}`);
console.log(`pool: ${pool.length} -> ${keep.length}`);
const unresolved = [...schedule].filter((id) => !keep.some((p) => p.id === id));
console.log(`scheduled answers still resolvable: ${schedule.size - unresolved.length}/${schedule.size}`);
if (unresolved.length) { console.error('✗ schedule broken'); process.exit(1); }
