// gen-grid-schedule.mjs — the FROZEN daily schedule for the football grid.
//
//   node scripts/gen-grid-schedule.mjs            # report only
//   node scripts/gen-grid-schedule.mjs --write    # emit src/data/gridSchedule.json
//
// ⚠️ A DAILY SCHEDULE MUST BE FROZEN. This is the single rule that has already
// bitten this repo: Footle's answer used to be a modulo over a live list, so
// APPENDING ONE PLAYER silently rewrote every past and future puzzle — including
// the publicly indexed archive. It is now pinned to WORDLE_ANSWER_LOG. The grid
// inherits that lesson: the schedule is generated once, written to disk, and
// committed. Re-running this does not re-roll days that already exist.
//
// ⚠️ HEADERS ARE STORED AS NAMES, NOT POOL INDICES. The pool is regenerated from
// a harvest, so its indices move whenever curation changes. A schedule of
// indices would quietly repoint every historic puzzle at different clubs — the
// same defect as the modulo, wearing a different hat. Names are stable.
//
// ⚠️ THE SHUFFLE IS seededShuffle, NOT Math.sin. The spec lets engines differ on
// approximated math: 137 of 3000 Math.sin values disagree between JavaScriptCore
// (iOS) and V8 (Android), which would hand two players different puzzles on the
// same day. seededShuffle is integer bitwise only and is verified bit-identical.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPool } from './build-grid-pool.mjs';
import { seededShuffle } from '../src/lib/quiz.js';

const OUT = fileURLToPath(new URL('../src/data/gridSchedule.json', import.meta.url));
const ANCHOR = '2026-09-12';          // grid #1
const DAYS = Number(process.env.DAYS ?? 180);
// ⚠️ EIGHT IS THE MEASURED CEILING, not a taste. At 4 the median grid had a
// cell with exactly 4 answers — technically fair, miserable to solve. Raising it
// works until 10, where 180 days can no longer stay unique and the duplicate
// gate fires with 3 repeats. 8 clears both: median tightest cell 8, no repeats.
const MIN_ANSWERS = 8;                // a cell with 3 is a coin flip for a good fan
// Headers must be RECOGNISABLE, which is a stricter bar than "has enough
// players". 754 clubs clear the pool's own header minimum; a daily grid should
// draw from the clubs a football fan can name without thinking.
const HEADER_POOL = Number(process.env.HEADER_POOL ?? 60);

const P = buildPool();
if (P.fail.length) {
  console.error('  ✗ the pool itself failed its gates; fix that first:');
  for (const f of P.fail) console.error(`      · ${f}`);
  process.exit(1);
}

// Top N clubs by squad depth — the recognisable end of the header list.
const ranked = [...P.clubPlayers.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, HEADER_POOL);
const pick = ranked.map(([c]) => c);
const nameOf = (c) => P.clubs[c];
const setOf = (c) => P.clubPlayers.get(c);

const cell = (a, b) => {
  let n = 0;
  const A = setOf(a), B = setOf(b);
  for (const p of A) if (B.has(p)) n++;
  return n;
};

/**
 * One day's 3x3, or null when this seed cannot make a fair one.
 *
 * ⚠️ CONSTRUCTED, NOT GUESSED. The first version took the first six clubs of a
 * shuffle and rejected the grid if any of the nine cells was thin. Nine roughly
 * independent checks at ~60% each survive about 1% of the time, so 400 rerolls
 * genuinely ran out on day 104 — the failure was the algorithm, not the data.
 * Picking the rows first and then keeping only columns that already clear every
 * row turns nine gambles into one filter, and every surviving grid is fair by
 * construction.
 */
function buildDay(seed) {
  const order = seededShuffle(pick, seed);
  // Rows and columns must be DISJOINT: a club crossed with itself is a
  // degenerate cell that every squad member answers.
  const rows = order.slice(0, 3);
  const cols = order
    .slice(3)
    .filter((c) => !rows.includes(c) && rows.every((r) => cell(r, c) >= MIN_ANSWERS))
    .slice(0, 3);
  if (cols.length < 3) return null;
  let min = Infinity;
  for (const r of rows) for (const c of cols) min = Math.min(min, cell(r, c));
  return { rows, cols, min };
}

// ⚠️ --refreeze DISCARDS THE FREEZE ON PURPOSE. Legitimate only while nothing
// has been published from this schedule. Once a grid has faced a user, this
// flag re-dates a public archive and must not be used.
const REFREEZE = process.argv.includes('--refreeze');
const prev = !REFREEZE && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
const days = [];
let attempts = 0;
for (let d = 0; d < DAYS; d++) {
  // ⚠️ Re-running must not re-roll a day that already shipped.
  if (prev?.days?.[d]) { days.push(prev.days[d]); continue; }   // frozen — re-verified below
  let day = null;
  for (let k = 0; k < 400 && !day; k++) { attempts++; day = buildDay((d + 1) * 2654435761 + k); }
  if (!day) { console.error(`  ✗ could not build a fair grid for day ${d + 1}`); process.exit(1); }
  days.push({ r: day.rows.map(nameOf), c: day.cols.map(nameOf), min: day.min });
}

// ⚠️ A FROZEN DAY MUST STILL BE FAIR. Reusing a published day verbatim is the
// whole point of the freeze, but the POOL underneath it can change — and it did:
// dropping yearless spells shrank every club. A day frozen when its tightest
// cell held 8 answers might hold 5 now, and nothing would have said so. Re-score
// every frozen day against the CURRENT pool and fail loudly rather than serve a
// puzzle that quietly stopped being solvable.
const byName = new Map(P.clubs.map((n, i) => [n, i]));
const stale = [];
for (let i = 0; i < days.length; i++) {
  const d = days[i];
  let min = Infinity;
  for (const r of d.r) for (const c of d.c) {
    const ri = byName.get(r), ci = byName.get(c);
    if (ri == null || ci == null) { min = 0; break; }
    min = Math.min(min, cell(ri, ci));
  }
  if (min < MIN_ANSWERS) stale.push([i + 1, min]);
}

const mins = days.map((d) => d.min).sort((a, b) => a - b);
const q = (x) => mins[Math.floor(x * (mins.length - 1))];
console.log(`\n  grid schedule — ${days.length} days from ${ANCHOR} (#1)`);
console.log(`    header pool      ${pick.length} clubs`);
console.log(`    tightest cell    min ${mins[0]} · p25 ${q(0.25)} · median ${q(0.5)} · max ${mins[mins.length - 1]}`);
console.log(`    reroll attempts  ${attempts} for ${days.filter((_, i) => !prev?.days?.[i]).length} new day(s)`);
console.log(`    grid #1          ${days[0].r.join(' / ')}  ×  ${days[0].c.join(' / ')}`);

// Gates — the schedule is worthless if any day is unfair or repeats itself.
const fail = [];
if (stale.length) fail.push(`${stale.length} frozen day(s) fell below ${MIN_ANSWERS} answers under the current pool (worst: #${stale[0][0]} at ${stale[0][1]})`);
if (mins[0] < MIN_ANSWERS) fail.push(`a day has a cell with only ${mins[0]} answers (min ${MIN_ANSWERS})`);
const sigs = new Set(days.map((d) => [...d.r].sort().join('|') + '::' + [...d.c].sort().join('|')));
if (sigs.size !== days.length) fail.push(`${days.length - sigs.size} duplicate grid(s) in the schedule`);
if (prev?.days) {
  // ⚠️ The freeze itself is a gate, not a convention.
  const changed = prev.days.filter((o, i) => days[i] && JSON.stringify(o) !== JSON.stringify(days[i])).length;
  if (changed) fail.push(`${changed} already-published day(s) would change — the schedule is frozen`);
}
if (fail.length) {
  console.error(`\n  ✗ NOT WRITTEN — ${fail.length} gate(s) failed:`);
  for (const f of fail) console.error(`      · ${f}`);
  process.exit(1);
}
console.log('  ✓ all gates pass');

if (process.argv.includes('--write')) {
  writeFileSync(OUT, JSON.stringify({ anchor: ANCHOR, minAnswers: MIN_ANSWERS, days }, null, 0));
  console.log(`  → wrote ${OUT} (${days.length} days)\n`);
} else {
  console.log('  (report only — pass --write to emit src/data/gridSchedule.json)\n');
}
