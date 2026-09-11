// build-grid-pool.mjs — the curated dataset behind a football grid (Tiki-Taka-Toe).
//
//   node scripts/build-grid-pool.mjs           # report only, writes nothing
//   node scripts/build-grid-pool.mjs --write   # emit src/data/gridPool.json
//
// ⚠️ WHY A CURATION PASS EXISTS AT ALL. The grid's answer key is "did this player
// play for BOTH of these", so every cell is a factual claim and a wrong one is a
// wrong answer under the bank's zero-error bar. The source we already ship,
// mysteryCareers.json, is a HARVEST and not a curated set — measured 2026-09-11:
//
//   - Japan is 1,181 of 9,032 players (13%), more than double Brazil (581). A
//     grid drawn from the raw pool keeps producing J-League names.
//   - A separate `Japan women's` nationality (155) sits in the same pool as the
//     men's club data.
//   - 147 of 5,161 "clubs" are youth, B or reserve sides — "FC Barcelona
//     Juvenil A", "FC Barcelona C", "Real Madrid Castilla". Unfiltered, the grid
//     would accept a player who never played a senior game for the club named.
//
// The shipped Mystery Player mode already solves this for itself, curating those
// 9,032 down to 649 answers. This does the same job for the grid, in code, so the
// rule is auditable instead of a one-off list.
//
// ⚠️ THIS SCRIPT REFUSES TO WRITE A POOL THAT CANNOT FILL A GRID. The gates at
// the bottom are the point: a dataset that looks fine in aggregate and cannot
// actually produce a 3x3 is exactly the failure that would ship silently.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const R = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8'));
const careers = R('../src/data/mysteryCareers.json');
const pool = R('../src/data/mysteryPool.json');

const CLUBS = careers.c;
const SPELLS = careers.p;
const byId = new Map(pool.map((p) => [p.id, p]));

// ── Filters ────────────────────────────────────────────────────────────────
// Anchored at the END on purpose: "Barcelona B" is a reserve side, "B 93" and
// "Bayer 04" are not. A bare token anywhere in the string matches far too much.
const NOT_SENIOR = /(\bB\b|\bC\b|\bII\b|\bIII\b|Reserves?|Atl[èe]tic|Castilla|Amateure|Juvenil|Youth|Academy|Jugend|Primavera|U-?\d{2}|Under-?\d{2})\s*$/i;
// Women's football is real football; it is simply not the same answer key as a
// men's club grid, and the pool mixes them. Split, never silently blend.
const WOMENS = /women/i;

const seniorClub = (name) => !NOT_SENIOR.test(name);

// ⚠️ THERE IS NO FAME FLOOR ON THE ANSWER POOL, AND THAT IS DELIBERATE.
// The first version of this script had one, set to 25, and it dropped exactly
// ZERO players — mysteryPool's own minimum fame IS 25, so the filter was
// decoration. Checking why surfaced a real design error: for a GRID, an obscure
// valid answer is a feature, not a defect. You only have to name ONE player per
// cell, so a wider pool makes the puzzle more solvable and rewards deep
// knowledge. What must not be obscure is the HEADERS — the clubs and nations
// that form the rows and columns. So the bar moved there (HEADER_MIN below),
// which is where it actually changes what a player sees.
const HEADER_MIN = Number(process.env.HEADER_MIN ?? 12);

const keptClubIdx = new Map();   // old index -> new index
const keptClubs = [];
CLUBS.forEach((name, i) => {
  if (!seniorClub(name)) return;
  keptClubIdx.set(i, keptClubs.length);
  keptClubs.push(name);
});

const players = {};
const nations = {};
let droppedWomens = 0, droppedNoClub = 0, droppedUnknown = 0;

for (const [pid, spells] of Object.entries(SPELLS)) {
  const meta = byId.get(pid);
  if (!meta) { droppedUnknown++; continue; }
  if (meta.nat && WOMENS.test(meta.nat)) { droppedWomens++; continue; }
  const cs = [...new Set(spells.map((s) => s[0]).filter((c) => keptClubIdx.has(c)))]
    .map((c) => keptClubIdx.get(c));
  // A grid needs INTERSECTIONS, so a one-club player can never fill a cell.
  if (cs.length < 2) { droppedNoClub++; continue; }
  players[pid] = cs;
  if (meta.nat) nations[pid] = meta.nat;
}

// ── Report ─────────────────────────────────────────────────────────────────
const clubPlayers = new Map();
for (const [pid, cs] of Object.entries(players)) {
  for (const c of cs) {
    if (!clubPlayers.has(c)) clubPlayers.set(c, new Set());
    clubPlayers.get(c).add(pid);
  }
}
const ranked = [...clubPlayers.entries()].sort((a, b) => b[1].size - a[1].size);
const natPlayersPre = new Map();
for (const [pid, n] of Object.entries(nations)) {
  if (!natPlayersPre.has(n)) natPlayersPre.set(n, new Set());
  natPlayersPre.get(n).add(pid);
}
const TOP = ranked.slice(0, 40).map(([c]) => c);

let pairs = 0, usable = 0;
for (let i = 0; i < TOP.length; i++) {
  for (let j = i + 1; j < TOP.length; j++) {
    pairs++;
    const a = clubPlayers.get(TOP[i]), b = clubPlayers.get(TOP[j]);
    let n = 0; for (const p of a) if (b.has(p)) n++;
    if (n >= 3) usable++;
  }
}

const natPlayers = new Map();
for (const [pid, n] of Object.entries(nations)) {
  if (!natPlayers.has(n)) natPlayers.set(n, new Set());
  natPlayers.get(n).add(pid);
}
const topNat = [...natPlayers.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 15);
const biggestNatShare = topNat.length ? topNat[0][1].size / Object.keys(players).length : 0;

// Headers are what the player READS. A club nobody recognises as a row makes an
// unfair puzzle even when the answer key is perfect.
const clubHeaders = ranked.filter(([, s]) => s.size >= HEADER_MIN).map(([c]) => c);
const natHeaders = [...natPlayersPre.entries()].filter(([, s]) => s.size >= HEADER_MIN).map(([n]) => n);

const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
console.log(`\n  grid pool (header minimum ${HEADER_MIN} players)`);
console.log(`    players      ${Object.keys(players).length}  (from ${Object.keys(SPELLS).length})`);
console.log(`    senior clubs ${keptClubs.length}  (from ${CLUBS.length}, dropped ${CLUBS.length - keptClubs.length} youth/B/reserve)`);
console.log(`    dropped: <2 senior clubs ${droppedNoClub} · women's ${droppedWomens} · no metadata ${droppedUnknown}`);
console.log(`    club x club cells usable (top 40): ${usable}/${pairs} (${pct(usable, pairs)}%)`);
console.log(`    biggest nationality share: ${topNat[0]?.[0]} ${pct(topNat[0]?.[1].size ?? 0, Object.keys(players).length)}%`);
console.log(`    eligible headers: ${clubHeaders.length} clubs · ${natHeaders.length} nations (>=${HEADER_MIN} players)`);
console.log(`    top clubs: ${ranked.slice(0, 6).map(([c, s]) => `${keptClubs[c].replace(/ (F\.?C\.?|Club de Fútbol)$/, '')} ${s.size}`).join(' · ')}`);

// ── Gates. A pool that cannot fill a grid must not be written. ─────────────
const fail = [];
if (Object.keys(players).length < 1200) fail.push(`only ${Object.keys(players).length} players survive (need 1200+)`);
if (clubHeaders.length < 60) fail.push(`only ${clubHeaders.length} clubs qualify as headers (need 60+)`);
if (pct(usable, pairs) < 55) fail.push(`only ${pct(usable, pairs)}% of top-40 club pairs are usable (need 55%+)`);
// ⚠️ The Japan skew is the reason this gate exists. If one nationality still
// dominates after curation, the grid will feel wrong however good the totals look.
if (biggestNatShare > 0.18) fail.push(`${topNat[0][0]} is ${pct(topNat[0][1].size, Object.keys(players).length)}% of the pool (max 18%)`);

if (fail.length) {
  console.error(`\n  ✗ NOT WRITTEN — ${fail.length} gate(s) failed:`);
  for (const f of fail) console.error(`      · ${f}`);
  process.exit(1);
}
console.log('  ✓ all gates pass');

if (process.argv.includes('--write')) {
  const out = fileURLToPath(new URL('../src/data/gridPool.json', import.meta.url));
  writeFileSync(out, JSON.stringify({ c: keptClubs, p: players, n: nations, headers: { clubs: clubHeaders, nations: natHeaders } }));
  console.log(`  → wrote ${out}`);
} else {
  console.log('  (report only — pass --write to emit src/data/gridPool.json)\n');
}
