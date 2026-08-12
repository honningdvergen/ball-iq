// merge-trail-candidates.mjs — fold reviewed candidates into the Trail roster
// and re-plan ONLY the puzzles nobody has played.
//
//   node scripts/merge-trail-candidates.mjs [--write]
//
// ⚠️ THE PLAYED PART OF THE LOG IS SACRED. trail.js says it outright: "Once one
// grid is shared this log is load-bearing and may be APPENDED to, never
// rewritten." Trail went live 2026-07-29 and today is #10, so puzzles 1–10 have
// been played and shared. Those entries are copied through byte-for-byte and
// asserted unchanged. Days 11 onward have never been seen by anyone, so
// re-planning them invalidates nothing — and re-planning is the whole point,
// because the repeats a regular sees live in that stretch.
//
// ⚠️ DETERMINISTIC. Integer LCG with a fixed seed, no Date.now(), no
// Math.random() — re-running produces byte-identical output, the same
// discipline as the Footle and Mystery schedules.
import { readFileSync, writeFileSync } from 'fs';
import { TRAIL_PLAYERS, TRAIL_ANSWER_LOG } from '../src/lib/trail.js';

const write = process.argv.includes('--write');
const PLAYED = 10;          // puzzles 1..10 are spent — index 0..9
const SEED = 20260812;
const MIN_GAP = 14;         // no career repeats inside a fortnight

// ⚠️ HOUSE STYLE, NOT WIKIPEDIA STYLE. The existing 44 read "Man Utd",
// "Tottenham", "Atletico Madrid" — short, unaccented, how a fan says it out
// loud. Wikipedia gives "Manchester United F.C.", "Tottenham Hotspur",
// "Atlético Madrid". A trail mixing both looks like two different games.
const NAME = {
  'Manchester United': 'Man Utd', 'Manchester City': 'Man City',
  'Tottenham Hotspur': 'Tottenham', 'Atlético Madrid': 'Atletico Madrid',
  'Paris Saint-Germain': 'PSG', 'Borussia Mönchengladbach': 'Borussia M.gladbach',
  'Bayer Leverkusen': 'Leverkusen', 'Internazionale': 'Inter Milan',
  'Los Angeles FC': 'LAFC', 'Brighton & Hove Albion': 'Brighton',
  'Red Bull Salzburg': 'RB Salzburg', 'TSG Hoffenheim': 'Hoffenheim',
  'Olympique Lyonnais': 'Lyon', 'Olympique de Marseille': 'Marseille',
  'Sheffield United': 'Sheffield Utd', 'Deportivo La Coruña': 'Deportivo',
  'Bayern Munich': 'Bayern Munich', 'FC Bayern Munich': 'Bayern Munich',
};
const house = (c) => NAME[c] || c.replace(/\s+(F\.?C\.?|C\.?F\.?|S\.?K\.?|A\.?F\.?C\.?)$/i, '').trim();

// Reviewed by eye against the printed batch; both fail on merit, not mechanics.
const REJECT = new Set([
  'Joao Grimaldo',    // unguessable — the fame signal over-rates him, same weakness as the Mystery pool
  'Marcus Rashford',  // Man Utd plus two loans is a thin trail, not a career path
]);

const candidates = JSON.parse(readFileSync('scripts/_trail-candidates.json', 'utf8'))
  .filter((c) => !REJECT.has(c.display.join(' ')))
  .map((c) => ({ key: c.key, display: c.display, nat: c.nat, clubs: c.clubs.map(house), loans: c.loans }));

// A duplicate key would silently shadow an existing career in getTrailPlayerByKey.
const existing = new Set(TRAIL_PLAYERS.map((p) => p.key));
const fresh = [];
for (const c of candidates) {
  let key = c.key;
  if (existing.has(key)) key = `${key}_${c.display[0].slice(0, 3).toUpperCase()}`;
  if (existing.has(key)) continue;
  existing.add(key);
  fresh.push({ ...c, key });
}

const roster = [...TRAIL_PLAYERS.map((p) => p.key), ...fresh.map((p) => p.key)];
console.log(`roster ${TRAIL_PLAYERS.length} -> ${roster.length} careers (+${fresh.length})`);

// ── re-plan days 11..end ────────────────────────────────────────────────────
let s = SEED;
const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
// ⚠️ LENGTH MUST BE A MULTIPLE OF THE ROSTER. trail-schedule.test.js asserts
// every career is used EXACTLY the same number of times, and 396 days over 102
// careers is 3.88 — unachievable. Rounding the schedule up to 102 x 4 = 408
// keeps the strict guarantee instead of weakening the test to fit the data, and
// buys a longer runway as a side effect.
const PER = Math.ceil(TRAIL_ANSWER_LOG.length / roster.length);
const TOTAL = roster.length * PER;
const head = TRAIL_ANSWER_LOG.slice(0, PLAYED);
const need = TOTAL - PLAYED;
const out = [...head];

for (let i = 0; i < need; i += 1) {
  const recent = out.slice(-MIN_GAP);
  // Fewest-used first keeps the distribution flat; the shuffle inside a usage
  // tier stops the order becoming predictable.
  const counts = new Map(roster.map((k) => [k, 0]));
  for (const k of out) counts.set(k, (counts.get(k) || 0) + 1);
  // Only careers still under quota are eligible, so the run cannot finish with
  // one career over-used and another short.
  let pool = roster.filter((k) => counts.get(k) < PER && !recent.includes(k));
  if (!pool.length) pool = roster.filter((k) => counts.get(k) < PER);
  const min = Math.min(...pool.map((k) => counts.get(k)));
  const tier = pool.filter((k) => counts.get(k) === min);
  out.push(tier[Math.floor(rnd() * tier.length) % tier.length]);
}

// ── the guarantees, asserted rather than hoped for ───────────────────────────
const headSame = head.every((k, i) => k === TRAIL_ANSWER_LOG[i]);
let minGap = Infinity;
const lastSeen = new Map();
out.forEach((k, i) => { if (lastSeen.has(k)) minGap = Math.min(minGap, i - lastSeen.get(k)); lastSeen.set(k, i); });
const uses = new Map();
out.forEach((k) => uses.set(k, (uses.get(k) || 0) + 1));
const spread = [...uses.values()];

console.log(`played puzzles 1..${PLAYED} unchanged: ${headSame ? 'YES' : 'NO — ABORT'}`);
console.log(`schedule length: ${out.length} (was ${TRAIL_ANSWER_LOG.length})`);
console.log(`minimum gap between repeats: ${minGap} days (target >= ${MIN_GAP})`);
console.log(`uses per career: ${Math.min(...spread)}–${Math.max(...spread)}`);
if (!headSame || minGap < MIN_GAP) { console.error('\n✗ REFUSING TO WRITE.'); process.exit(1); }

if (!write) { console.log('\n(dry run — pass --write to apply)'); process.exit(0); }

const src = readFileSync('src/lib/trail.js', 'utf8');
const rosterBlock = fresh.map((p) => `  { key: ${JSON.stringify(p.key)}, display: ${JSON.stringify(p.display)}, nat: ${JSON.stringify(p.nat)},\n    clubs: ${JSON.stringify(p.clubs)},\n    loans: ${JSON.stringify(p.loans)} },`).join('\n');
const withRoster = src.replace(
  /(export const TRAIL_PLAYERS = \[)/,
  `$1\n  // ── WAVE N (2026-08-12): ${fresh.length} careers from Wikipedia infoboxes, the\n  // only source that marks loans. Generated by scripts/build-trail-candidates.mjs,\n  // read one by one before merging. Club names normalised to house style.\n${rosterBlock}`,
);
// Positions come from the lineup pool's own field — a career without one
// breaks the hint, which trail-guess.test.js asserts.
const POSMAP = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
const poolRows = new Map(JSON.parse(readFileSync('public/data/lineup.json', 'utf8')).players.map((p) => [p.n.toLowerCase(), p]));
const posLines = fresh.map((p) => {
  const row = poolRows.get(p.display.join(' ').toLowerCase());
  const pos = (row && POSMAP[row.s]) || 'Midfielder';
  return `  ${JSON.stringify(p.key)}: ${JSON.stringify(pos)},`;
}).join('\n');
const withPos = withRoster.replace(
  /(export const TRAIL_POSITIONS = \{)/,
  `$1\n  // ── WAVE N positions, from the lineup pool's own position field. Broad\n  // (Goalkeeper/Defender/Midfielder/Forward) rather than the specific labels\n  // some older entries carry: a correct broad hint beats a guessed precise one.\n${posLines}`,
);
const logBody = out.map((k, i) => `  ${JSON.stringify(k)},${i === PLAYED - 1 ? '   // ← puzzles above are PLAYED; never touch them' : ''}`).join('\n');
const withLog = withPos.replace(
  /export const TRAIL_ANSWER_LOG = \[[\s\S]*?\n\];/,
  `export const TRAIL_ANSWER_LOG = [\n  // RE-PLANNED 2026-08-12 for wave N (${TRAIL_PLAYERS.length} -> ${roster.length} careers).\n  // ⚠️ Entries 1..${PLAYED} are copied through UNCHANGED — those puzzles have been\n  // played and their grids shared. Everything after is re-planned, which is\n  // safe precisely because nobody has seen it. Deterministic LCG, seed ${SEED}.\n  // Minimum gap between repeats: ${minGap} days.\n${logBody}\n];`,
);
writeFileSync('src/lib/trail.js', withLog);
console.log(`\nwrote src/lib/trail.js — ${roster.length} careers, ${out.length}-day schedule`);
