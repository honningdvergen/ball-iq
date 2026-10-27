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
import { CLUB_COUNTRIES } from './grid-club-countries.mjs';

// `minClubs`: the club-page grids (gen-grid-clubs.mjs, seo/grid-section.mjs)
// cross a club with a club, so a one-club player can never answer and is
// dropped (2). The daily grid also crosses clubs with a nation, a country and a
// teammate, where a one-club player can (buildDailyPool passes 1).
export function buildPool({ headerMin = Number(process.env.HEADER_MIN ?? 12), minClubs = 2 } = {}) {
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
const HEADER_MIN = headerMin;

const keptClubIdx = new Map();   // old index -> new index
const keptClubs = [];
CLUBS.forEach((name, i) => {
  if (!seniorClub(name)) return;
  keptClubIdx.set(i, keptClubs.length);
  keptClubs.push(name);
});

const players = {};
const spellsOf = {};   // pid -> [[club, from, to]], kept senior clubs with a start year
const nations = {};
let droppedWomens = 0, droppedNoClub = 0, droppedUnknown = 0;

for (const [pid, spells] of Object.entries(SPELLS)) {
  const meta = byId.get(pid);
  if (!meta) { droppedUnknown++; continue; }
  if (meta.nat && WOMENS.test(meta.nat)) { droppedWomens++; continue; }
  // ⚠️ A SPELL WITH NO START YEAR IS AN ACADEMY OR TRIAL ENTRY, and it is the
  // one class that produces FALSE POSITIVES — a cell accepting a player who
  // never played a senior game for the club named. Faiq Bolkiah carries
  // Chelsea, Arsenal, Leicester and Southampton with no years on any of them;
  // unfiltered he answers an Arsenal x Chelsea cell. 1,907 of 49,656 spells
  // (3.8%) are yearless. Under the zero-error bar a false positive is worse
  // than a false negative: the player never learns they were told wrong.
  const cs = [...new Set(spells.filter((s) => s[1] != null).map((s) => s[0]).filter((c) => keptClubIdx.has(c)))]
    .map((c) => keptClubIdx.get(c));
  // A club x club grid needs INTERSECTIONS, so a one-club player can never fill
  // one of its cells (see minClubs).
  if (cs.length < minClubs) { droppedNoClub++; continue; }
  players[pid] = cs;
  spellsOf[pid] = spells.filter((s) => s[1] != null && keptClubIdx.has(s[0])).map((s) => [keptClubIdx.get(s[0]), s[1], s[2]]);
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

  // ── Gates. A pool that cannot fill a grid must not be used. ─────────────
  const fail = [];
  if (Object.keys(players).length < 1200) fail.push(`only ${Object.keys(players).length} players survive (need 1200+)`);
  if (clubHeaders.length < 60) fail.push(`only ${clubHeaders.length} clubs qualify as headers (need 60+)`);
  if (pct(usable, pairs) < 55) fail.push(`only ${pct(usable, pairs)}% of top-40 club pairs are usable (need 55%+)`);
  // ⚠️ The Japan skew is the reason this gate exists. If one nationality still
  // dominates after curation, the grid will feel wrong however good the totals look.
  if (biggestNatShare > 0.18) fail.push(`${topNat[0][0]} is ${pct(topNat[0][1].size, Object.keys(players).length)}% of the pool (max 18%)`);

  return {
    clubs: keptClubs, players, spells: spellsOf, nations, clubPlayers, natPlayers, byId,
    headers: { clubs: clubHeaders, nations: natHeaders },
    stats: {
      players: Object.keys(players).length, sourcePlayers: Object.keys(SPELLS).length,
      clubs: keptClubs.length, sourceClubs: CLUBS.length,
      droppedNoClub, droppedWomens, droppedUnknown,
      usable, pairs, usablePct: pct(usable, pairs),
      topNat: topNat.slice(0, 6).map(([n, s]) => [n, s.size]),
      biggestNatPct: pct(topNat[0]?.[1].size ?? 0, Object.keys(players).length),
      ranked: ranked.slice(0, 6).map(([c, s]) => [keptClubs[c], s.size]),
    },
    fail,
  };
}

// ── The daily grid's pool (src/data/gridPool.json) ─────────────────────────
// Tiki Taka Toe crosses a club with a club, a nation ("from Argentina"), a
// country ("played in Germany") or a teammate ("played with Messi"). Each kind
// is written out here, so the client judges with lookups and holds no rule of
// its own that could drift from this one.

/** A star is a teammate header from this fame up (mysteryPool's `fame`). */
export const STAR_FAME = 150;
// A spell with no end year is still running when the careers were harvested.
const NOW = 2026;

/**
 * ⚠️ TEAMMATES BY A FULL SEASON, NOT A SHARED YEAR. Spells carry years only, so
 * "2004-2005" and "2005-2010" share 2005 and may never have met: one left in
 * the summer the other arrived. Two spells at one club count only when they
 * overlap by at least a year. A pair who did meet for half a season is missed,
 * which the judge reports as "can't confirm"; it never accepts a pair who
 * did not meet.
 */
export const overlapYears = (a, b) => Math.min(a[2] ?? NOW, b[2] ?? NOW) - Math.max(a[1], b[1]);

export function buildDailyPool() {
  const P = buildPool({ minClubs: 1 });
  const ids = Object.keys(P.players);

  // Nations as an index into one list: most players share a dozen of them.
  const N = [...new Set(ids.map((id) => P.nations[id]).filter(Boolean))].sort();
  const natIdx = new Map(N.map((n, i) => [n, i]));
  const n = {};
  for (const id of ids) if (P.nations[id]) n[id] = natIdx.get(P.nations[id]);

  // The clubs placed in a country, by pool index.
  const at = new Map(P.clubs.map((c, i) => [c, i]));
  const k = {};
  const missing = [];
  for (const [country, clubs] of Object.entries(CLUB_COUNTRIES)) {
    for (const c of clubs) {
      if (!at.has(c)) { missing.push(c); continue; }
      k[at.get(c)] = country;
    }
  }

  // Each star's teammates: anyone with a spell at one of his clubs that
  // overlaps his by a season (overlapYears).
  const stars = ids.filter((id) => (P.byId.get(id)?.fame ?? 0) >= STAR_FAME);
  const m = {};
  for (const s of stars) {
    const mine = P.spells[s];
    const mates = [];
    for (const id of ids) {
      if (id === s) continue;
      if (P.spells[id].some((a) => mine.some((b) => a[0] === b[0] && overlapYears(a, b) >= 1))) mates.push(id);
    }
    m[s] = mates.sort();
  }
  return { ...P, missingCountryClubs: missing, daily: { c: P.clubs, p: P.players, N, n, k, m } };
}

// ── CLI ────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
const P = buildPool();
const { stats: st, fail, headers } = P;
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);
console.log(`\n  grid pool (header minimum ${process.env.HEADER_MIN ?? 12} players)`);
console.log(`    players      ${st.players}  (from ${st.sourcePlayers})`);
console.log(`    senior clubs ${st.clubs}  (from ${st.sourceClubs}, dropped ${st.sourceClubs - st.clubs} youth/B/reserve)`);
console.log(`    dropped: <2 senior clubs ${st.droppedNoClub} · women's ${st.droppedWomens} · no metadata ${st.droppedUnknown}`);
console.log(`    club x club cells usable (top 40): ${st.usable}/${st.pairs} (${st.usablePct}%)`);
console.log(`    biggest nationality share: ${st.topNat[0]?.[0]} ${st.biggestNatPct}%`);
console.log(`    eligible headers: ${headers.clubs.length} clubs · ${headers.nations.length} nations`);
console.log(`    top clubs: ${st.ranked.map(([n, c]) => `${n.replace(/ (F\.?C\.?|Club de Fútbol)$/, '')} ${c}`).join(' · ')}`);

if (fail.length) {
  console.error(`\n  ✗ NOT WRITTEN — ${fail.length} gate(s) failed:`);
  for (const f of fail) console.error(`      · ${f}`);
  process.exit(1);
}
console.log('  ✓ all gates pass');

const D = buildDailyPool();
const mates = Object.entries(D.daily.m).map(([id, l]) => `${D.byId.get(id)?.name} ${l.length}`).join(' · ');
console.log(`\n  daily pool: ${Object.keys(D.daily.p).length} players · ${D.daily.N.length} nations · ${Object.keys(D.daily.k).length} clubs placed in a country`);
console.log(`    stars (fame ${STAR_FAME}+) and teammates: ${mates}`);
if (D.missingCountryClubs.length) {
  console.error(`  ✗ NOT WRITTEN — grid-club-countries.mjs names clubs the pool does not hold: ${D.missingCountryClubs.join(', ')}`);
  process.exit(1);
}

if (process.argv.includes('--write')) {
  const out = fileURLToPath(new URL('../src/data/gridPool.json', import.meta.url));
  writeFileSync(out, JSON.stringify(D.daily));
  console.log(`  → wrote ${out}`);
} else {
  console.log('  (report only — pass --write to emit src/data/gridPool.json)\n');
}
}
