// gen-grid-schedule.mjs — the FROZEN daily schedule for the football grid.
//
//   node scripts/gen-grid-schedule.mjs                       # report only
//   node scripts/gen-grid-schedule.mjs --write               # emit src/data/gridSchedule.json
//   node scripts/gen-grid-schedule.mjs --refreeze --write    # discard the freeze (see below)
//
// ⚠️ A DAILY SCHEDULE MUST BE FROZEN. This is the single rule that has already
// bitten this repo: Footle's answer used to be a modulo over a live list, so
// APPENDING ONE PLAYER silently rewrote every past and future puzzle — including
// the publicly indexed archive. It is now pinned to WORDLE_ANSWER_LOG. The grid
// inherits that lesson: the schedule is generated once, written to disk, and
// committed. Re-running this does not re-roll days that already exist.
//
// ⚠️ HEADERS ARE STORED AS NAMES AND IDS, NOT POOL INDICES. The pool is
// regenerated from a harvest, so its indices move whenever curation changes. A
// schedule of indices would quietly repoint every historic puzzle at different
// clubs — the same defect as the modulo, wearing a different hat. A club is its
// career name; the other headers are "nat:<nationality>", "in:<country>" and
// "with:<Wikidata id>" (headerKind in src/lib/grid.js).
//
// ⚠️ THE SHUFFLE IS seededShuffle, NOT Math.sin. The spec lets engines differ on
// approximated math: 137 of 3000 Math.sin values disagree between JavaScriptCore
// (iOS) and V8 (Android), which would hand two players different puzzles on the
// same day. seededShuffle is integer bitwise only and is verified bit-identical.
//
// v2 (2026-10-27): the three columns are always clubs; of the three rows, at
// most one is a nation, a country or a teammate. The mode had never been
// released (GRID_LIVE false), so v2 regenerated every day from the same anchor
// with --refreeze, once.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildDailyPool } from './build-grid-pool.mjs';
import { seededShuffle } from '../src/lib/quiz.js';
import { toJudgePool, fits, headerKind, GRID_FLAGS } from '../src/lib/grid.js';
import { matchGuess, normaliseName } from '../src/lib/mysteryPlayer.js';

const R = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'));
const OUT = fileURLToPath(new URL('../src/data/gridSchedule.json', import.meta.url));
const ANCHOR = '2026-09-12';          // grid #1
const DAYS = Number(process.env.DAYS ?? 180);
// Boards for two players on one phone. Drawn apart from the dailies, so a
// versus game never spoils a day still to come.
const DUELS = Number(process.env.DUELS ?? 60);
// ⚠️ EIGHT IS THE MEASURED CEILING, not a taste. At 4 the median grid had a
// cell with exactly 4 answers — technically fair, miserable to solve. Since v2
// the count is of players the judge accepts WHEN THE NAME IS TYPED (cellAnswers
// in lib/grid.js), not of raw intersections: v1 counted intersections and two
// of its cells held 7 by the stricter count.
const MIN_ANSWERS = 8;

// ⚠️ A HEADER IS A CLUB WE DRAW A KIT FOR. gridKits.json is written by hand, so
// a club without a row there has no shirt. The J-League clubs have kits (for
// other modes) but are not headers: they are deep in the harvest (Japan is 13%
// of it) and unknown to most of our players.
const KITS = R('../src/data/gridKits.json');
const NOT_HEADERS = new Set(['Cerezo Osaka', 'Gamba Osaka', 'JEF United Chiba', 'Kashiwa Reysol', 'Tokyo Verdy', 'Yokohama F. Marinos']);
const CLUBS = Object.keys(KITS).filter((c) => !NOT_HEADERS.has(c)).sort();
// Nations and countries are the ones we draw a flag for. Japan is left out of
// nations for the same reason as its clubs.
const NATIONS = ['Argentina', 'Belgium', 'Brazil', 'Croatia', 'England', 'France', 'Germany', 'Italy', 'Netherlands', 'Portugal', 'Spain', 'Uruguay'];
const COUNTRIES = ['Argentina', 'Brazil', 'England', 'France', 'Germany', 'Italy', 'Netherlands', 'Portugal', 'Spain', 'Turkey'];
// How a star is named on the board. Written out because "Cristiano Ronaldo"
// is "Ronaldo" to nobody under thirty and "Diego Maradona" is "Maradona".
const STAR_NAMES = { Q615: 'Messi', Q11571: 'Cristiano Ronaldo', Q142794: 'Neymar', Q12897: 'Pelé', Q17515: 'Maradona' };

const D = buildDailyPool();
if (D.fail.length || D.missingCountryClubs.length) {
  console.error('  ✗ the pool itself failed its gates; fix that first (node scripts/build-grid-pool.mjs)');
  process.exit(1);
}
for (const c of [...NATIONS, ...COUNTRIES]) if (!GRID_FLAGS[c]) { console.error(`  ✗ no flag for ${c} (GRID_FLAGS)`); process.exit(1); }
for (const c of CLUBS) if (!D.clubs.includes(c)) { console.error(`  ✗ kit club ${c} is not in the pool`); process.exit(1); }
const STARS = Object.keys(D.daily.m).filter((id) => STAR_NAMES[id]);

const names = R('../src/data/mysteryPool.json');
const pool = toJudgePool(D.daily, names);

// The players the judge reaches when their own name is typed. A player whose
// full name is shared with someone earlier in the index is judged as that other
// man, so he can never be an answer (see cellAnswers in lib/grid.js).
const groups = new Map();
for (const p of names) {
  const k = normaliseName(p.name);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(p);
}
const reachable = names.filter((p) => pool.players[p.id] && matchGuess(groups.get(normaliseName(p.name)), p.name)?.id === p.id).map((p) => p.id);

// Each header's answers, once.
const HEADERS = [...CLUBS, ...NATIONS.map((n) => `nat:${n}`), ...COUNTRIES.map((c) => `in:${c}`), ...STARS.map((s) => `with:${s}`)];
const answers = new Map(HEADERS.map((h) => [h, new Set(reachable.filter((id) => fits(pool, id, h)))]));
const cell = (a, b) => {
  const A = answers.get(a), B = answers.get(b);
  if (!A || !B) return 0;
  let n = 0;
  for (const p of A) if (B.has(p)) n++;
  return n;
};
const countryOf = new Map();
for (const [i, c] of Object.entries(D.daily.k)) countryOf.set(D.clubs[i], c);

// ⚠️ A SQUARE EVERY SQUAD MEMBER ANSWERS IS NOT A PUZZLE. "Barcelona × played
// in Spain" is every Barcelona player. A country header never meets a column
// club from that country.
const trivial = (row, col) => {
  const k = headerKind(row);
  return k.t === 'in' && countryOf.get(col) === k.v;
};

const SPECIAL = {
  nat: NATIONS.map((n) => `nat:${n}`),
  in: COUNTRIES.map((c) => `in:${c}`),
  with: STARS.map((s) => `with:${s}`),
};
// Which kind of row a day gets. Two days in six are all clubs; nations and
// countries come twice as often as teammates, since there are five stars.
const KINDS = ['nat', 'club', 'in', 'with', 'nat', 'club', 'in', 'nat', 'club', 'in', 'with', 'club'];

/**
 * One 3x3, or null when this seed cannot make a fair one.
 *
 * ⚠️ CONSTRUCTED, NOT GUESSED. Picking the rows first and then keeping only
 * columns that already clear every row turns nine gambles into one filter, and
 * every surviving grid is fair by construction.
 */
function buildDay(seed, kind) {
  const order = seededShuffle(CLUBS, seed);
  let rows = order.slice(0, 3);
  if (kind !== 'club') {
    const sp = seededShuffle(SPECIAL[kind], seed)[0];
    if (!sp) return null;
    rows = [...order.slice(0, 2)];
    rows.splice(seed % 3, 0, sp);
  }
  const cols = order
    .slice(3)
    .filter((c) => !rows.includes(c) && rows.every((r) => !trivial(r, c) && cell(r, c) >= MIN_ANSWERS))
    .slice(0, 3);
  if (cols.length < 3) return null;
  let min = Infinity;
  for (const r of rows) for (const c of cols) min = Math.min(min, cell(r, c));
  return { r: rows, c: cols, min };
}

const sig = (d) => [...d.r].sort().join('|') + '::' + [...d.c].sort().join('|');

function build(n, salt, taken) {
  const out = [];
  let attempts = 0;
  for (let d = 0; d < n; d++) {
    const want = KINDS[d % KINDS.length];
    let day = null;
    // The day's kind first; a kind that cannot make a fair board falls back
    // to all clubs rather than failing the day.
    for (const kind of [want, 'club']) {
      for (let k = 0; k < 400 && !day; k++) {
        attempts++;
        const b = buildDay(((d + 1) * 2654435761 + salt + k) >>> 0, kind);
        if (b && !taken.has(sig(b))) day = b;
      }
      if (day) break;
    }
    if (!day) { console.error(`  ✗ could not build a fair grid for ${salt ? 'duel' : 'day'} ${d + 1}`); process.exit(1); }
    taken.add(sig(day));
    out.push(day);
  }
  return { out, attempts };
}

// ⚠️ --refreeze DISCARDS THE FREEZE ON PURPOSE. Legitimate only while nothing
// has been published from this schedule. Once a grid has faced a user, this
// flag re-dates a public archive and must not be used.
const REFREEZE = process.argv.includes('--refreeze');
const prev = !REFREEZE && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
const taken = new Set();
let days, duels, attempts = 0;
if (prev?.days?.length >= DAYS && prev.duels?.length >= DUELS) {
  days = prev.days.slice(0, DAYS);
  duels = prev.duels.slice(0, DUELS);
} else {
  if (prev) { console.error('  ✗ the frozen schedule is shorter than asked for; extending it is not written yet'); process.exit(1); }
  const a = build(DAYS, 0, taken);
  const b = build(DUELS, 7919, taken);
  days = a.out; duels = b.out; attempts = a.attempts + b.attempts;
}

// ⚠️ A FROZEN DAY MUST STILL BE FAIR. The POOL underneath a frozen day can
// change. Re-score every day against the CURRENT pool and fail loudly rather
// than serve a puzzle that quietly stopped being solvable.
const rescore = (list) => list.map((d) => {
  let min = Infinity;
  for (const r of d.r) for (const c of d.c) min = Math.min(min, trivial(r, c) ? 0 : cell(r, c));
  return min;
});
const dayMins = rescore(days), duelMins = rescore(duels);

const mins = [...dayMins].sort((a, b) => a - b);
const q = (x) => mins[Math.floor(x * (mins.length - 1))];
const kinds = {};
for (const d of days) {
  const k = d.r.map((h) => headerKind(h).t).find((t) => t !== 'club') || 'club';
  kinds[k] = (kinds[k] || 0) + 1;
}
console.log(`\n  grid schedule — ${days.length} days from ${ANCHOR} (#1), ${duels.length} two-player boards`);
console.log(`    header pool      ${CLUBS.length} clubs · ${NATIONS.length} nations · ${COUNTRIES.length} countries · ${STARS.length} stars`);
console.log(`    days by row kind ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
console.log(`    tightest cell    min ${mins[0]} · p25 ${q(0.25)} · median ${q(0.5)} · max ${mins[mins.length - 1]}`);
console.log(`    reroll attempts  ${attempts}`);
console.log(`    grid #1          ${days[0].r.join(' / ')}  ×  ${days[0].c.join(' / ')}`);

// Gates — the schedule is worthless if any day is unfair or repeats itself.
const fail = [];
const low = [...dayMins, ...duelMins].filter((m) => m < MIN_ANSWERS).length;
if (low) fail.push(`${low} board(s) have a cell under ${MIN_ANSWERS} answers under the current pool`);
const all = [...days, ...duels];
if (new Set(all.map(sig)).size !== all.length) fail.push(`${all.length - new Set(all.map(sig)).size} duplicate grid(s) in the schedule`);
for (const d of all) {
  if (d.c.some((h) => headerKind(h).t !== 'club')) fail.push(`a column header is not a club: ${d.c.join(', ')}`);
  if (d.r.filter((h) => headerKind(h).t !== 'club').length > 1) fail.push(`a board has two non-club rows: ${d.r.join(', ')}`);
  if (new Set([...d.r, ...d.c]).size !== 6) fail.push(`a header repeats: ${[...d.r, ...d.c].join(', ')}`);
}
if (fail.length) {
  console.error(`\n  ✗ NOT WRITTEN — ${fail.length} gate(s) failed:`);
  for (const f of fail.slice(0, 10)) console.error(`      · ${f}`);
  process.exit(1);
}
console.log('  ✓ all gates pass');

if (process.argv.includes('--write')) {
  const stars = Object.fromEntries(STARS.map((s) => [s, STAR_NAMES[s]]));
  const strip = (list, m) => list.map((d, i) => ({ r: d.r, c: d.c, min: m[i] }));
  writeFileSync(OUT, JSON.stringify({ anchor: ANCHOR, minAnswers: MIN_ANSWERS, stars, days: strip(days, dayMins), duels: strip(duels, duelMins) }, null, 0));
  console.log(`  → wrote ${OUT} (${days.length} days, ${duels.length} two-player boards)\n`);
} else {
  console.log('  (report only — pass --write to emit src/data/gridSchedule.json)\n');
}
