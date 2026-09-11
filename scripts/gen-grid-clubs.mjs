// gen-grid-clubs.mjs — the frozen per-club partner lists behind club-page grids.
//
//   node scripts/gen-grid-clubs.mjs           # report only
//   node scripts/gen-grid-clubs.mjs --write   # emit src/data/gridClubs.json
//
// WHY PARTNER LISTS AND NOT 118 x 180 SCHEDULES. A club page needs a fresh grid
// per day, which naively means freezing 118 clubs x 180 days x 6 headers — a
// multi-megabyte file that has to be committed to stay frozen. But the only
// thing that actually needs freezing is the SET each day draws from. Freeze the
// partner list once and a day's grid becomes a pure function of (club, day) via
// seededShuffle, so the archive can never re-date itself and the file stays
// small. Same guarantee as Footle's answer log, a fraction of the size.
//
// ⚠️ THE SHAPE IS CLUB x CLUB, AND THAT IS MEASURED. A club page grid crossed
// with NATIONALITIES was the obvious design and the data killed it: at our
// 8-answer floor only 38 of the top 120 clubs have three usable nation columns.
// Club x club clears 118 of 120 — everything except Anderlecht (3 partners) and
// Beşiktaş (4). Nationality can come back as a variant for the big clubs; it
// cannot be the primary shape.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPool } from './build-grid-pool.mjs';

const OUT = fileURLToPath(new URL('../src/data/gridClubs.json', import.meta.url));
const FLOOR = Number(process.env.MIN_ANSWERS ?? 8);   // matches gen-grid-schedule
const CLUB_POOL = Number(process.env.CLUB_POOL ?? 120);
const NEED = 5;                                        // 2 more rows + 3 columns

const P = buildPool();
if (P.fail.length) {
  console.error('  ✗ the pool failed its gates; fix that first:');
  for (const f of P.fail) console.error(`      · ${f}`);
  process.exit(1);
}

const ranked = [...P.clubPlayers.entries()].sort((a, b) => b[1].size - a[1].size);
const candidates = ranked.slice(0, CLUB_POOL);
const inter = (A, B) => { let n = 0; for (const p of A) if (B.has(p)) n++; return n; };

const clubs = {};
const short = [];
for (const [c, ps] of candidates) {
  // A partner must clear the floor against THIS club. Whether a given trio also
  // clears against each other is settled per day by the picker, which is why the
  // list is deliberately generous rather than pre-trimmed to six.
  const partners = ranked
    .filter(([o]) => o !== c && inter(ps, P.clubPlayers.get(o)) >= FLOOR)
    .map(([o]) => P.clubs[o]);
  if (partners.length < NEED) { short.push([P.clubs[c], partners.length]); continue; }
  clubs[P.clubs[c]] = partners;
}

// ⚠️ THE FILE IS { floor, clubs }, SO THE FREEZE CHECK MUST READ .clubs.
// First version compared against the wrapper and reported that the clubs
// "floor" and "clubs" had lost their partners. The gate firing on my own bug is
// the gate working; a freeze check that reads the wrong object would have waved
// through exactly the silent re-dating it exists to stop.
// ⚠️ --refreeze DISCARDS THE FREEZE ON PURPOSE. Legitimate only while nothing
// has been published from this data: the freeze protects a PUBLIC archive, and
// until a club page ships a grid there is no archive to protect. Once one has,
// this flag re-dates history and must not be used.
const REFREEZE = process.argv.includes('--refreeze');
const prevFile = !REFREEZE && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
const prev = prevFile?.clubs ?? null;
const counts = Object.values(clubs).map((v) => v.length).sort((a, b) => a - b);
const q = (x) => counts[Math.floor(x * (counts.length - 1))];
console.log(`\n  grid club partners (floor ${FLOOR} shared players)`);
console.log(`    clubs covered   ${Object.keys(clubs).length} of ${candidates.length}`);
console.log(`    partners each   min ${counts[0]} · median ${q(0.5)} · max ${counts[counts.length - 1]}`);
console.log(`    below the bar   ${short.length}${short.length ? ' — ' + short.map(([n, k]) => `${n.replace(/ (F\.?C\.?|Club de Fútbol)$/, '')} (${k})`).join(', ') : ''}`);

const fail = [];
if (Object.keys(clubs).length < 90) fail.push(`only ${Object.keys(clubs).length} clubs covered (need 90+)`);
if (counts[0] < NEED) fail.push(`a club has only ${counts[0]} partners (need ${NEED})`);
if (prev) {
  // ⚠️ THE FREEZE IS A GATE. A partner list that shrinks re-dates every grid a
  // club page has already published — the same defect as Footle's old modulo.
  const lost = Object.entries(prev).filter(([k, v]) => !clubs[k] || v.some((p) => !clubs[k].includes(p)));
  if (lost.length) fail.push(`${lost.length} club(s) would lose frozen partners: ${lost.slice(0, 3).map(([k]) => k).join(', ')}`);
}
if (fail.length) {
  console.error(`\n  ✗ NOT WRITTEN — ${fail.length} gate(s) failed:`);
  for (const f of fail) console.error(`      · ${f}`);
  process.exit(1);
}
console.log('  ✓ all gates pass');

if (process.argv.includes('--write')) {
  // Preserve the frozen ORDER of anything already published, then append.
  const merged = {};
  for (const [k, v] of Object.entries(clubs)) {
    const old = prev?.[k] ?? [];
    merged[k] = [...old, ...v.filter((p) => !old.includes(p))];
  }
  writeFileSync(OUT, JSON.stringify({ floor: FLOOR, clubs: merged }));
  console.log(`  → wrote ${OUT} (${Object.keys(merged).length} clubs)\n`);
} else {
  console.log('  (report only — pass --write to emit src/data/gridClubs.json)\n');
}
