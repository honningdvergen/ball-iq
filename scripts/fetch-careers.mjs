// Career histories for the Mystery Player pool -> src/data/mysteryCareers.json
//
// WHY. The game we are modelling ours on states its own algorithm: "attributes
// associated with the player such as nationality, TEAMS PLAYED FOR, age and
// position". Teams PLAYED FOR — plural, the whole career. Their worked example
// only makes sense with it: Rivaldo ranks 5 for Ronaldinho because both are
// Brazilian AND both played for Barcelona.
//
// ⚠️⚠️ TWO BUGS THIS SCRIPT SHIPPED, both measured on 2026-08-05 by running the
// finished game rather than by reading the code. Between them they made the
// shared-club term — worth 420 points a match, the second-strongest signal in
// the model — either dead or actively misleading on EVERY day of the schedule.
//
// 1. `wdt:P54` IS THE TRUTHY PREFIX, AND IT LIES ABOUT CAREERS.
//    Wikidata's truthy prefix returns only PREFERRED-rank statements when any
//    exist. Editors mark a player's current club as preferred, so `wdt:P54`
//    returns exactly one team for most active players. Measured: Adrien Rabiot
//    came back as ["AC Milan"] — a man with six senior clubs. Across the
//    schedule, 359 of 400 answers (90%) had no career history at all, so the
//    term simply never fired.
//    -> Fixed by reading the STATEMENT NODES (p:P54 / ps:P54), which are
//       rank-blind. Rabiot goes 1 team -> 13.
//    (This is the same trap fetch-squads.mjs documents from the other side:
//     there `wdt:P54` returns too MUCH history. It is rank, not recency, that
//     decides — so neither "too many" nor "too few" is the real lesson. Use
//     statement nodes and filter explicitly.)
//
// 2. NATIONAL TEAMS ARE NOT CLUBS.
//    P54 covers every team membership, so "Serbia men's national football team"
//    and "Wales national under-17 football team" were being scored as shared
//    CLUBS. 1,894 of 6,487 career entries (29%) were national teams. The effect
//    is worse than noise, because it wears the colour of a right answer: on a
//    Chris Wood puzzle, Ben Old ranked 35 — a HOT GREEN band — purely for
//    sharing New Zealand caps. On a Jesse Lingard puzzle 1,490 of 1,539 players
//    ranked wrong.
//    -> Fixed by excluding on the team's CLASS (P31), not on its label.
//
// ⚠️ WHY CLASS AND NOT LABEL. Filtering `/national|under-\d+/` over team names
// is the obvious fix and it is the wrong one: it is a guess about naming that
// nothing verifies, and it silently catches real clubs (Espoli, Nacional,
// Atlético Nacional, National Bank of Egypt SC all contain "national"). The
// classes are a small enumerable set, so this script PRINTS every class it
// excludes and every class it keeps. Read that output — it is the audit.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const UA = 'BallIQ-squads/1.0 (https://balliq.app)';
// The two network passes take ~10 minutes and are pure lookups, while the
// FILTER below is a judgement call that wants iterating — the class list is
// only auditable once you have seen it, and the first pass through it missed
// four classes. Cache the raw answer so tuning the filter costs nothing.
// Delete this file (or pass --refresh) to re-snapshot during a transfer window.
const CACHE = '.cache/wikidata-careers-raw.json';
const REFRESH = process.argv.includes('--refresh');
const { default: pool } = await import('../src/data/mysteryPool.json', { with: { type: 'json' } });

const ids = pool.map((p) => p.id);
const BATCH = 100; // VALUES blocks much bigger than this start timing out

async function run(sparql, attempt = 1) {
  try {
    const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(sparql), {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
      signal: AbortSignal.timeout(60000),
    });
    const text = await r.text();
    // ⚠️ The endpoint answers overload with an HTML error page and a 200-ish
    // status, so `r.ok` is not enough — JSON.parse would throw on the retry
    // path and kill the whole run. Sniff the body.
    if (!text.trimStart().startsWith('{')) throw new Error('non-JSON (HTTP ' + r.status + ')');
    return JSON.parse(text).results.bindings;
  } catch (e) {
    if (attempt >= 5) { console.log(`    ✗ ${e.message}`); return null; }
    await new Promise((x) => setTimeout(x, attempt * 5000));
    return run(sparql, attempt + 1);
  }
}

const raw = {};          // playerId -> Set(teamQid)
const teamLabel = {};    // teamQid  -> label
const teamClasses = {};  // teamQid  -> Set(class label)
let done = 0;

const cached = !REFRESH && existsSync(CACHE);
if (cached) {
  const c = JSON.parse(readFileSync(CACHE, 'utf8'));
  for (const [k, v] of Object.entries(c.raw)) raw[k] = new Set(v);
  Object.assign(teamLabel, c.teamLabel);
  for (const [k, v] of Object.entries(c.teamClasses)) teamClasses[k] = new Set(v);
  console.log(`Using cached snapshot (${CACHE}) — ${Object.keys(raw).length} players, ${Object.keys(teamLabel).length} teams.`);
  console.log('Pass --refresh to re-query Wikidata.\n');
}

// ── Pass 1: every team every pool player has ever been a member of ──────────
if (!cached) {
console.log('Pass 1 — career memberships (statement nodes, rank-blind)');
for (let i = 0; i < ids.length; i += BATCH) {
  const slice = ids.slice(i, i + BATCH);
  const rows = await run(`
SELECT ?p ?team ?teamLabel WHERE {
  VALUES ?p { ${slice.map((q) => 'wd:' + q).join(' ')} }
  ?p p:P54 ?st .
  ?st ps:P54 ?team .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`);
  if (!rows) { console.log(`  batch ${i / BATCH + 1}: FAILED`); continue; }
  for (const r of rows) {
    const pid = r.p.value.split('/').pop();
    const tid = r.team.value.split('/').pop();
    const label = r.teamLabel?.value;
    if (!label || /^Q\d+$/.test(label)) continue; // no English label
    (raw[pid] ||= new Set()).add(tid);
    teamLabel[tid] = label;
  }
  done += slice.length;
  console.log(`  ${done}/${ids.length} players · ${Object.keys(teamLabel).length} distinct teams`);
  await new Promise((r) => setTimeout(r, 900));
}

// ── Pass 2: what KIND of team is each one? ──────────────────────────────────
console.log('\nPass 2 — team classes (P31)');
const teamIds = Object.keys(teamLabel);
for (let i = 0; i < teamIds.length; i += BATCH) {
  const slice = teamIds.slice(i, i + BATCH);
  const rows = await run(`
SELECT ?team ?clsLabel WHERE {
  VALUES ?team { ${slice.map((q) => 'wd:' + q).join(' ')} }
  ?team wdt:P31 ?cls .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`);
  if (!rows) { console.log(`  batch ${i / BATCH + 1}: FAILED`); continue; }
  for (const r of rows) {
    const tid = r.team.value.split('/').pop();
    const cls = r.clsLabel?.value;
    if (!cls || /^Q\d+$/.test(cls)) continue;
    (teamClasses[tid] ||= new Set()).add(cls);
  }
  console.log(`  ${Math.min(i + BATCH, teamIds.length)}/${teamIds.length} teams`);
  await new Promise((r) => setTimeout(r, 900));
}

mkdirSync('.cache', { recursive: true });
writeFileSync(CACHE, JSON.stringify({
  raw: Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, [...v]])),
  teamLabel,
  teamClasses: Object.fromEntries(Object.entries(teamClasses).map(([k, v]) => [k, [...v]])),
}));
console.log(`  cached -> ${CACHE}`);
} // end !cached

// A team is excluded when ANY of its classes says it is a representative side
// or a youth setup. Matching on the CLASS label is safe in a way that matching
// on the TEAM label is not — "national" in a class name always means a
// representative team, whereas in a club name it usually does not.
// RULE 1 — representative and youth sides are not clubs.
// ⚠️ The first version of this pattern was written by hand and MISSED four
// classes that the audit print then caught: "U-19 association football team",
// "national Olympic football team", "national youth football team" and
// "representation team". Hand-written patterns over a vocabulary you have not
// enumerated are guesses. Read the ✗/✓ lists after every run.
// Club academies go too, matching the editorial rule already locked for the
// Transfer Trail ("loans in and marked · youth out"). The modes should not
// disagree about what counts as having played for a club.
const EXCLUDE_REPRESENTATIVE =
  /\bnational\b[^,]*\bteam\b|\bnational\b[^,]*\bfootball\b|representation team|representative team|\b(?:u|under)-?\d+\b|youth (?:team|academy|system)|football academy/i;

// ⚠️ RESERVE AND B TEAMS STAY, DELIBERATELY.
// The tempting next step is a label rule like /\bII\b|Reserves|Under-\d+s/ to
// strip "FC Bayern Munich II" and "Norwich City F.C. Under-23s". Do not. That
// pattern also matches WILLEM II — a first-division Eredivisie club — and
// would silently delete it. Checked: reserve sides are 125 of 6,359 entries
// (2%), and unlike a national team a shared reserve side is weak signal rather
// than a false one. Not worth deleting a real club to remove.

// RULE 2 — other sports are not this game.
// Some pool entries are not footballers at all (Wikidata files a club's
// basketball and handball sections under names our squad query accepted), and
// their memberships drag in basketball and handball teams. Drop a team only
// when it has a non-football sport class and NO football class, so genuine
// multisport clubs with a football section survive.
const OTHER_SPORT = /basketball|baseball|handball|rugby|badminton|rowing|volleyball|ice hockey|cricket|futsal/i;
const IS_FOOTBALL = /football|soccer/i;

const excludedClasses = new Set();
const keptClasses = new Set();
const isExcluded = (tid) => {
  const cls = teamClasses[tid];
  // No class at all: KEEP. A missing P31 is a gap in Wikidata, and dropping on
  // absence of evidence would quietly delete real clubs.
  if (!cls || cls.size === 0) return false;
  let drop = false;
  for (const c of cls) { if (EXCLUDE_REPRESENTATIVE.test(c)) { excludedClasses.add(c); drop = true; } }
  if (!drop) {
    const other = [...cls].filter((c) => OTHER_SPORT.test(c) && !IS_FOOTBALL.test(c));
    if (other.length && ![...cls].some((c) => IS_FOOTBALL.test(c))) {
      other.forEach((c) => excludedClasses.add(c));
      drop = true;
    }
  }
  if (!drop) for (const c of cls) keptClasses.add(c);
  return drop;
};

const out = {};
let keptEntries = 0, droppedEntries = 0;
for (const [pid, set] of Object.entries(raw)) {
  const clubs = [...set].filter((tid) => { const d = isExcluded(tid); d ? droppedEntries++ : keptEntries++; return !d; })
    .map((tid) => teamLabel[tid]).sort();
  if (clubs.length) out[pid] = clubs;
}

writeFileSync('src/data/mysteryCareers.json', JSON.stringify(out));

// ── The audit. Read this, do not skip it. ───────────────────────────────────
console.log(`\n── EXCLUDED classes (${excludedClasses.size}) ──`);
[...excludedClasses].sort().forEach((c) => console.log('  ✗', c));
console.log(`\n── KEPT classes, 40 most common of ${keptClasses.size} ──`);
[...keptClasses].sort().slice(0, 40).forEach((c) => console.log('  ✓', c));

const sizes = Object.values(out).map((v) => v.length).sort((a, b) => a - b);
console.log(`\nentries kept ${keptEntries} · dropped ${droppedEntries}`);
console.log(`players with a career: ${Object.keys(out).length}/${ids.length}`);
console.log(`clubs per player: min ${sizes[0]} / median ${sizes[Math.floor(sizes.length / 2)]} / max ${sizes[sizes.length - 1]}`);
console.log(`players with >1 club: ${sizes.filter((s) => s > 1).length} (${(sizes.filter((s) => s > 1).length / ids.length * 100).toFixed(1)}%)`);
