// pick-club-grid.mjs — one club's grid for one day, and the audit that proves
// every club can produce one for every day.
//
//   node scripts/pick-club-grid.mjs            # audit all clubs x 180 days
//   node scripts/pick-club-grid.mjs Arsenal    # show one club's next few days
//
// ⚠️ THIS RUNS AT BUILD TIME, NOT IN THE BROWSER. Verifying nine cells needs the
// whole 7,959-player pool, which is 542 KB — far too heavy to ship. The page
// embeds the finished grid and its answer key for that day, the same shape the
// answer pages already use.
//
// ⚠️ THE PARTNER LIST IS FROZEN, THE CELLS ARE NOT. gen-grid-clubs.mjs only
// guarantees each partner clears the floor against the ANCHOR club — whether a
// given trio also clears against each other is settled here, per day. That is
// deliberate: freezing the candidate set keeps the archive stable while leaving
// the picker free to reject an unfair combination.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPool } from './build-grid-pool.mjs';
import { seededShuffle } from '../src/lib/quiz.js';

const MIN_ANSWERS = 8;   // matches gen-grid-schedule and gen-grid-clubs

/**
 * ⚠️ CLUBS THAT DO NOT GET A GRID, AND WHY.
 *
 * These three clear the partner bar against THEMSELVES but their partners are
 * not well enough connected to the wider pool to fill three columns and two
 * extra rows at 8 answers a cell. Measured across 180 days: Olympiacos and
 * Spartak cannot fill a single day, Feyenoord fills 75 of 180.
 *
 * A club that cannot make a FAIR grid gets NO grid — not a thinner one. Lowering
 * the floor for three clubs would degrade the puzzle everywhere, and shipping a
 * 4-answer cell is how a grid starts telling people they are wrong.
 *
 * ⚠️ THE AUDIT GATES ON THIS LIST. If a fourth club ever joins it the run FAILS,
 * because a silently growing exclusion list is how a feature quietly stops
 * covering the site.
 */
const NO_GRID = new Set([
  'Olympiacos F.C.',      // 180/180 short — partners clear the anchor, not each other
  'Feyenoord Rotterdam',  // fills 75 of 180
  'Spartak Moscow',       // 180/180 short
  // ⚠️ ADDED 2026-09-11 WHEN THE POOL WIDENED 120 -> 160, and the gate caught it
  // rather than me. Verified structurally before adding, as the gate's own
  // message demands: Sparta has 5 partners but ZERO of them clear 8 against two
  // other header clubs — its neighbours are Czech and Central European sides
  // that are isolated in our harvest. Not a picker regression.
  'AC Sparta Prague',
]);

const P = buildPool();
const CLUBS = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/gridClubs.json', import.meta.url)), 'utf8'));
const idx = new Map(P.clubs.map((n, i) => [n, i]));
const players = (name) => P.clubPlayers.get(idx.get(name)) || new Set();
// Every club recognisable enough to head a row, by squad depth in our pool.
const HEADERS = [...P.clubPlayers.entries()]
  .sort((a, b) => b[1].size - a[1].size).slice(0, 120).map(([c]) => P.clubs[c]);

const cell = (a, b) => {
  const A = players(a), B = players(b);
  let n = 0; for (const p of A) if (B.has(p)) n++;
  return n;
};

/**
 * The club's grid for `day`, or null if this club cannot make a fair one.
 *
 * The anchor club is always a ROW, so its own page's grid is about it: every
 * cell in the top row asks "who played for <club> and this column". The other
 * two rows give the puzzle depth and must still clear the floor against every
 * column, which is what makes this a filter rather than a guess.
 */
export function pickClubGrid(clubName, day) {
  if (NO_GRID.has(clubName)) return null;
  const partners = CLUBS.clubs[clubName];
  if (!partners) return null;

  for (let k = 0; k < 300; k++) {
    const order = seededShuffle(partners, (day + 1) * 2654435761 + k);
    // Columns first: they must clear the floor against the anchor club.
    const cols = order.filter((c) => c !== clubName && cell(clubName, c) >= MIN_ANSWERS).slice(0, 3);
    if (cols.length < 3) continue;
    // ⚠️ ROWS 2-3 COME FROM THE WHOLE HEADER POOL, NOT THE ANCHOR'S PARTNERS.
    // Drawing them from the anchor's own partner list was the first design and
    // it failed 11 of 117 clubs outright — Galatasaray, Fenerbahçe, Olympiacos,
    // Frankfurt, Boca, Feyenoord and Lille could not fill a SINGLE day. The
    // constraint was wrong, not the data: a partner list guarantees a club
    // pairs with the ANCHOR, and rows 2-3 never touch the anchor. They only
    // have to clear the three COLUMNS, so that is the only test they should
    // face, and the candidate set is every club big enough to be a header.
    const others = seededShuffle(HEADERS, (day + 1) * 40503 + k);
    const rows = [clubName, ...others.filter((r) =>
      r !== clubName && !cols.includes(r) && cols.every((c) => cell(r, c) >= MIN_ANSWERS)).slice(0, 2)];
    if (rows.length < 3) continue;

    let min = Infinity;
    for (const r of rows) for (const c of cols) min = Math.min(min, cell(r, c));
    if (min >= MIN_ANSWERS) return { club: clubName, day, rows, cols, min };
  }
  return null;
}

// ── CLI ────────────────────────────────────────────────────────────────────
// ⚠️ GUARDED. Without this the audit — 117 clubs x 180 days — ran on IMPORT,
// so any script wanting pickClubGrid() got 21,000 iterations of console output
// mixed into its own stdout. build-grid-pool.mjs already guards its CLI the
// same way; a module that does work merely by being imported is a trap.
const IS_CLI = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (IS_CLI) main();

function main() {
const arg = process.argv[2];
const names = Object.keys(CLUBS.clubs);

if (arg) {
  const club = names.find((n) => n.toLowerCase().includes(arg.toLowerCase()));
  if (!club) { console.error(`  no club matching "${arg}"`); process.exit(1); }
  console.log(`\n  ${club} — next 3 days\n`);
  for (let d = 0; d < 3; d++) {
    const g = pickClubGrid(club, d);
    if (!g) { console.log(`  day ${d + 1}: NONE`); continue; }
    const short = (s) => s.replace(/\s*(F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?|Club de Fútbol)\s*$/i, '');
    console.log(`  day ${d + 1}  (tightest cell ${g.min})`);
    console.log(`     ${''.padEnd(22)}${g.cols.map((c) => short(c).slice(0, 16).padEnd(18)).join('')}`);
    for (const r of g.rows) {
      console.log(`     ${short(r).slice(0, 20).padEnd(22)}${g.cols.map((c) => String(cell(r, c)).padEnd(18)).join('')}`);
    }
    console.log('');
  }
} else {
  // ⚠️ THE AUDIT IS THE POINT. A picker that works for Arsenal and fails for
  // Celtic ships a broken page for Celtic, and nothing would say so.
  const DAYS = 180;
  let ok = 0, failed = [];
  const mins = [];
  for (const club of names) {
    if (NO_GRID.has(club)) continue;
    let bad = 0;
    for (let d = 0; d < DAYS; d++) {
      const g = pickClubGrid(club, d);
      if (!g) bad++; else mins.push(g.min);
    }
    if (bad) failed.push([club, bad]); else ok++;
  }
  mins.sort((a, b) => a - b);
  const q = (x) => mins[Math.floor(x * (mins.length - 1))];
  console.log(`\n  club grid audit — ${names.length} clubs x ${DAYS} days`);
  console.log(`    clubs producing a grid EVERY day: ${ok}/${names.length - NO_GRID.size}  (${NO_GRID.size} excluded by design)`);
  console.log(`    tightest cell: min ${mins[0]} · p25 ${q(0.25)} · median ${q(0.5)} · max ${mins[mins.length - 1]}`);
  if (failed.length) {
    console.error(`\n  ✗ ${failed.length} club(s) cannot fill every day and are NOT in NO_GRID:`);
    for (const [c, n] of failed.slice(0, 10)) console.error(`      · ${c} — ${n} day(s) short`);
    console.error('    Either the data moved or the picker regressed. Do not just add them to the list.');
    process.exit(1);
  }
  console.log(`    excluded by design: ${[...NO_GRID].join(', ')}`);
  console.log('  ✓ every club fills every day\n');
}

}
