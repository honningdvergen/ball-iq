#!/usr/bin/env node
/**
 * Gate the Mystery Player pool against the two ways it has silently broken.
 *
 * WHY THIS EXISTS. Both defects below were found by PLAYING the game on a
 * device, weeks after they shipped, and in both cases the correct fix already
 * existed in the repo and had been quietly undone by a later pool rebuild.
 * Nothing failed. Nothing warned. The pool just got worse.
 *
 *  1. FAMOUS PLAYERS VANISHING (found 2026-08-15). Wikidata labels most
 *     wingers "wing half", the SLOT mapper only tested /winger/, and the build
 *     drops anyone whose slot is null. That removed 526 players — Neymar,
 *     Bale, Ribéry, George Best, Di María, Figo, Mahrez, Robinho, Götze,
 *     David Silva, Nani, Alexis Sánchez. Searching "neymar" returned nothing,
 *     which is the single worst thing this game can do to a player.
 *
 *  2. NATIONALITY REVERTING (found 2026-08-15, regressed 2026-08-12).
 *     derive-pool-nationality.mjs rewrites `nat` from national-team caps
 *     instead of legal citizenship. It is a SECOND PASS, so every pool rebuild
 *     wipes it unless it is re-run. It was correct on 08-05 (Vinícius=Brazil,
 *     Saka=England) and wrong again by 08-12 (both "Spain"/"United Kingdom").
 *     `nat` is a scored term in similarity(), so this is a RANKING bug, not a
 *     cosmetic one.
 *
 * The general check is the important one: anything famous enough to be in
 * _mystery-core but missing from the shipped pool, and not deliberately
 * excluded, is a bug. That would have caught Neymar the day it happened.
 *
 *   node scripts/audit-mystery-pool.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { NAME_OVERRIDES, CLUB_FIXES, BIRTH_FIXES, BIRTH_DISPUTED, NOT_IN_SQUAD, NEVER_AT_CLUB } from './_name-overrides.mjs';

const FAME_FLOOR = 70;      // above this, absence is a defect, not a judgement call
let bad = 0;
const fail = (m) => { console.error(`❌ ${m}`); bad++; };
const ok = (m) => console.log(`✅ ${m}`);

const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const coreRaw = JSON.parse(readFileSync('scripts/_mystery-core.json', 'utf8'));
const core = Array.isArray(coreRaw) ? coreRaw : (coreRaw.players || Object.values(coreRaw).find(Array.isArray));
const excl = existsSync('src/data/mysteryExclusions.json')
  ? JSON.parse(readFileSync('src/data/mysteryExclusions.json', 'utf8')) : {};
const excluded = new Set([...(excl.managers || []), ...(excl.notFootballers || [])]);
const removed = excl.removedFromPool || {};

// ── 1. nobody famous may go missing ─────────────────────────────────────────
const inPool = new Set(pool.map((p) => p.id));
/* Absence is only a defect for someone who is actually a footballer, and the
   build decides that on CAREER, not on fame or position — deliberately, because
   fame is football-blind and a blacklist only catches the names you thought of.
   This check has to use the same discriminator or it just re-reports the
   anti-Camus filter working.
   ⚠️ Position alone is NOT enough: the first run of this gate flagged Sean
   Connery (fame 144, P413 "midfielder" — he really did play amateur football)
   while the build log on the same run said "✓ excluded Sean Connery". Camus,
   Bohr and Connery have 0-1 clubs; Neymar has 7. */
const careers = existsSync('scripts/_mystery-careers.json')
  ? JSON.parse(readFileSync('scripts/_mystery-careers.json', 'utf8')) : {};
const clubCount = (id) => (careers[id] || []).length;

const missing = core
  .filter((p) => p.fame >= FAME_FLOOR && !inPool.has(p.id) && !excluded.has(p.name) && !(p.id in removed))
  .filter((p) => (p.poss || []).length > 0)
  .filter((p) => clubCount(p.id) >= 2);

if (missing.length) {
  fail(`${missing.length} player(s) with fame >= ${FAME_FLOOR} are missing from the pool:`);
  missing.sort((a, b) => b.fame - a.fame).slice(0, 15)
    .forEach((p) => console.error(`     ${String(p.fame).padStart(4)}  ${p.name}  ${JSON.stringify(p.poss)}`));
  console.error('   → usually an unmapped P413 position term falling through SLOT()');
  console.error('     in build-mystery-pool-v2.mjs and being dropped by the slot filter.');
} else {
  ok(`no player above fame ${FAME_FLOOR} is missing from the pool`);
}

// ── 2. nationality must be caps-derived, not citizenship ────────────────────
// Spot-check players whose citizenship and footballing nation genuinely differ.
// If derive-pool-nationality.mjs has been skipped after a rebuild, these revert.
const NAT_EXPECT = {
  'Vinícius Júnior': 'Brazil',
  Rodrygo: 'Brazil',
  'Bukayo Saka': 'England',
};
const natWrong = Object.entries(NAT_EXPECT).filter(([name, want]) => {
  const p = pool.find((x) => x.name === name);
  return p && p.nat !== want;
});
if (natWrong.length) {
  fail(`nationality has reverted to citizenship for ${natWrong.length} spot-check player(s):`);
  natWrong.forEach(([n, want]) => console.error(`     ${n}: got "${pool.find((x) => x.name === n).nat}", expected "${want}"`));
  console.error('   → re-run: node scripts/derive-pool-nationality.mjs');
  console.error('     (it is a SECOND PASS and every pool rebuild wipes it)');
} else {
  ok('nationality spot-checks are caps-derived, not citizenship');
}

// ── 3. the careers cache must COVER the pool, or nationality silently reverts ──
/* ⚠️ THE ORDERING TRAP, hit for real on 2026-08-15. The SLOT fix added 543
   players to the pool. The careers cache had been refreshed against the pool as
   it was BEFORE that, so every new arrival had no national-team data and
   derive-pool-nationality quietly fell back to citizenship for exactly them —
   Mahrez came out "France" (he plays for Algeria), Di María "Italy"
   (Argentina), Bale "United Kingdom" despite a century of Wales caps.

   Nothing errored. The nationality pass reported success. The only way to see
   it was to read the output for players you happen to know. So: whenever the
   pool grows, the cache must be re-fetched BEFORE the nationality pass, and
   this check is what says so out loud. */
const CACHE = '.cache/wikidata-careers-raw.json';
if (existsSync(CACHE)) {
  const cache = JSON.parse(readFileSync(CACHE, 'utf8'));
  const cached = new Set(Object.keys(cache.raw || {}));
  const uncovered = pool.filter((p) => !cached.has(p.id));
  if (uncovered.length > pool.length * 0.02) {
    fail(`${uncovered.length} of ${pool.length} pool players are absent from the careers cache`);
    console.error('   → the pool grew after the cache was built, so those players CANNOT get a');
    console.error('     caps-derived nationality and silently keep citizenship. Re-run in order:');
    console.error('       node scripts/fetch-careers.mjs --refresh');
    console.error('       node scripts/derive-pool-nationality.mjs');
  } else {
    ok(`careers cache covers the pool (${pool.length - uncovered.length}/${pool.length})`);
  }
}

// ── 4. `dob` must survive the rebuild, or the ranking goes coarse ───────────
/* ⚠️ THE FOURTH SECOND-PASS TO GET CLOBBERED, and the most invisible. `dob` is
   written by fetch-mystery-dob.mjs, NOT by the pool build, so a rebuild strips
   it from every player. similarity() keys its continuous age term on `dob`;
   without it every comparison falls back to a year, which gives about 13
   distinct levels, and team-mates in the same position score IDENTICALLY.

   Measured 2026-08-15, immediately after the pool rebuild: 9,032 of 9,032
   players had no `dob` (before: 10 of 8,489) and distinct scores collapsed from
   >80% to 6.3%. Nothing crashed. The mode still played. Ranks were just noise
   in long stretches — which is the failure this whole feature was rebuilt to
   fix in the first place. Caught only because tests/unit/mystery-player.test.js
   asserts the >0.8 ratio. This check makes it fail LOUDER and earlier. */
const noDob = pool.filter((p) => !p.dob).length;
if (noDob > pool.length * 0.05) {
  fail(`${noDob} of ${pool.length} players have no dob — the age tie-breaker is dead`);
  console.error('   → run: node scripts/fetch-mystery-dob.mjs --write   (a pool rebuild strips it)');
} else {
  ok(`dob present on ${pool.length - noDob}/${pool.length} players (age tie-breaker live)`);
}

/* ⚠️ `born` AND `dob` ARE TWO FETCHES. The year comes from _mystery-core.json
   and the day from _mystery-dob.json, taken days apart, and nothing compared
   them. On 2026-10-09 eighteen rows printed one year and ranked on another:
   Zhang Linpeng born 1989 beside 9 May 2000, Júnior Moraes 1987 beside 1997.
   A row that disagrees with itself means the date changed on Wikidata between
   the two fetches, so one of the two is somebody's edit. It costs nothing to
   check and needs no network. */
const twoStories = pool.filter((p) => p.dob && Number(p.dob.slice(0, 4)) !== p.born && !BIRTH_DISPUTED[p.id]);
if (twoStories.length) {
  fail(`${twoStories.length} player(s) print one birth year and carry a day from another:`);
  twoStories.slice(0, 15).forEach((p) => console.error(`     ${p.id}  ${p.name}: born ${p.born}, dob ${p.dob}`));
  console.error('   → node scripts/audit-pool-birthdates.mjs --all   reads Wikipedia for each. A confirmed date');
  console.error('     goes in BIRTH_FIXES, an unsettled one in BIRTH_DISPUTED (scripts/_name-overrides.mjs).');
} else {
  ok(`every birth year matches its day (${Object.keys(BIRTH_DISPUTED).length} disputed births listed and left alone)`);
}

// ── 5. nobody from another sport may be guessable ───────────────────────────
/* ⚠️ THE POOL IS WHAT A PLAYER SEARCHES, NOT ONLY WHAT CAN BE THE ANSWER.
   mysteryExclusions.json kept O. J. Simpson off the schedule from 2026-08-14,
   and until 2026-10-08 typing "Simpson" still offered him: a defender at the
   Buffalo Bills. Nora Mørk, a handball back, sat beside him. The career filter
   cannot see either, because their clubs are real teams, just not in this
   sport, so they are removed by Wikidata id and this checks all three shipped
   files, since a rebuild from the cached core fetch would bring them back. */
const answers = JSON.parse(readFileSync('src/data/mysteryAnswers.json', 'utf8'));
const shippedCareersFile = JSON.parse(readFileSync('src/data/mysteryCareers.json', 'utf8'));
const shippedCareers = shippedCareersFile.p || {};
const shippedCareersTable = shippedCareersFile.c || [];
const back = Object.keys(removed).filter((id) => inPool.has(id) || answers.includes(id) || id in shippedCareers);
if (back.length) {
  fail(`${back.length} removed non-footballer(s) are back in the shipped Mystery data:`);
  back.forEach((id) => console.error(`     ${id}  ${removed[id]}`));
  console.error('   → build-mystery-pool-v2.mjs filters these ids; a hand edit or an older build re-added them.');
} else {
  ok(`none of the ${Object.keys(removed).length} removed non-footballers is in the pool, answers or careers`);
}
/* The words in `position` are Wikidata's, and two of the ones that got through
   belong to other sports ("running back", and a bare "back", which is handball).
   A word this list has not seen fails the build until someone has looked at who
   carries it; that look is the whole point, so do not add a word unread. */
const FOOTBALL_POSITIONS = new Set([
  'goalkeeper', 'defender', 'centre-back', 'full-back', 'left back', 'right-back', 'wing-back',
  'sweeper', 'stopper', 'centerhalf', 'midfielder', 'defensive midfielder', 'central midfielder',
  'attacking midfielder', 'left midfielder', 'wide midfielder', 'playmaker', 'wing half', 'winger',
  'left winger', 'right winger', 'inverted winger', 'inside forward', 'second striker', 'forward',
  'centre-forward', 'attacker', 'coach',
]);
const oddPosition = pool.filter((p) => !FOOTBALL_POSITIONS.has(p.position));
if (oddPosition.length) {
  fail(`${oddPosition.length} pool player(s) carry a position this audit has not seen in football:`);
  oddPosition.slice(0, 15).forEach((p) => console.error(`     ${p.id}  ${p.name}  "${p.position}"  ${p.club}`));
  console.error('   → check the person is an association footballer. If not, add the id to');
  console.error('     removedFromPool in src/data/mysteryExclusions.json; if so, add the word above.');
} else {
  ok('every position in the pool is a football position');
}

// ── 6. the curated corrections must be IN the shipped files ─────────────────
/* ⚠️ THE FIFTH SECOND-PASS, AND IT WAS ALREADY BEING SKIPPED. fix-pool-names.mjs
   runs last because every rebuild rewrites the pool from Wikidata, which is
   where the wrong names and the wrong clubs come from. Nothing checked that it
   had run. On 2026-10-08 the pool held ten vandalised names, one of them a
   scheduled answer ("João Moutinh0": typing Moutinho found nobody), and fifteen
   players under a club they never played for, Edwin van der Sar at Barcelona
   among them. This compares the shipped rows with scripts/_name-overrides.mjs.

   Birth dates joined on 2026-10-09. They are the correction a rebuild is surest
   to undo: `born` is rewritten from one cache and `dob` from another, and both
   caches still hold the date that was wrong on the day they were fetched.
   Michael Owen read 1976 in the search list for two months. */
const byId = new Map(pool.map((p) => [p.id, p]));
const spellsOf = (id) => (shippedCareers[id] || []).map(([i, a, b]) => [shippedCareersTable[i], a, b]);
const undone = [];
for (const [id, name] of Object.entries(NAME_OVERRIDES)) {
  const p = byId.get(id);
  if (p && p.name !== name) undone.push(`${id}  name is "${p.name}", should be "${name}"`);
}
for (const [id, fix] of Object.entries(CLUB_FIXES)) {
  const p = byId.get(id);
  if (!p) continue;
  const spells = spellsOf(id);
  const has = (name) => spells.some((sp) => sp[0] === name);
  const why = [];
  if (p.club !== fix.club) why.push(`club is "${p.club}", should be "${fix.club}"`);
  if (fix.slot && p.slot !== fix.slot) why.push(`slot is ${p.slot}, should be ${fix.slot}`);
  for (const name of [...(fix.drop || []), ...Object.keys(fix.rename || {})])
    if (has(name)) why.push(`career still holds "${name}"`);
  for (const [name, [a, b]] of Object.entries(fix.years || {}))
    if (!spells.some((sp) => sp[0] === name && sp[1] === a && sp[2] === b)) why.push(`"${name}" is not ${a}-${b ?? ''}`);
  for (const [name, a, b] of fix.add || [])
    if (!spells.some((sp) => sp[0] === name && sp[1] === a && sp[2] === b)) why.push(`career lacks "${name}" ${a}-${b ?? ''}`);
  if (why.length) undone.push(`${id}  ${p.name}: ${why.join('; ')}`);
}
for (const [id, fix] of Object.entries(BIRTH_FIXES)) {
  const p = byId.get(id);
  if (!p) continue;
  const born = Number(fix.dob.slice(0, 4));
  if (p.dob !== fix.dob || p.born !== born)
    undone.push(`${id}  ${p.name}: born ${p.born}, dob ${p.dob}; should be ${born}, ${fix.dob}`);
}
if (undone.length) {
  fail(`${undone.length} curated correction(s) are not in the shipped pool or careers:`);
  undone.slice(0, 15).forEach((m) => console.error(`     ${m}`));
  console.error('   → run: node scripts/fix-pool-names.mjs   (LAST in the pipeline; a rebuild undoes it)');
} else {
  ok(`all ${Object.keys(NAME_OVERRIDES).length} name, ${Object.keys(CLUB_FIXES).length} club and ${Object.keys(BIRTH_FIXES).length} birth date corrections are in the shipped files`);
}

// ── 7. no known false row in the squads the pool and the lineup builder read ──
/* squads.json decides the current-club label in the pool build and is the whole
   of the lineup builder's squad lists, and lineup.json is what the builder
   fetches. A basketball player sat in Real Madrid's squad in both from August
   to 2026-10-08, pickable as a forward. fetch-squads.mjs drops the ids listed
   in _name-overrides.mjs; this checks the two shipped files, because a refresh
   run from an older checkout would put them back. */
const squads = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));
const lineup = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const falseRows = [];
for (const [club, squad] of Object.entries(squads)) for (const p of squad)
  if (NOT_IN_SQUAD[p.id] || NEVER_AT_CLUB[p.id]?.squad === club) falseRows.push(`squads.json  ${club}: ${p.name}`);
for (const p of lineup.players) if (NOT_IN_SQUAD[p.i]) falseRows.push(`lineup.json  player: ${p.n}`);
for (const [club, slots] of Object.entries(lineup.teams || {})) for (const id of new Set(Object.values(slots).flat()))
  if (NOT_IN_SQUAD[id] || NEVER_AT_CLUB[id]?.squad === club) falseRows.push(`lineup.json  ${club} squad: ${id}`);
if (falseRows.length) {
  fail(`${falseRows.length} known false squad row(s) are in the shipped files:`);
  falseRows.forEach((m) => console.error(`     ${m}`));
  console.error('   → they are listed in scripts/_name-overrides.mjs (NOT_IN_SQUAD, NEVER_AT_CLUB);');
  console.error('     fetch-squads.mjs filters them, then rebuild public/data/lineup.json.');
} else {
  ok('no known false row in squads.json or lineup.json');
}

// ── 8. report the residual so it stays visible rather than forgotten ────────
const uk = pool.filter((p) => p.nat === 'United Kingdom').length;
if (uk) console.log(`ℹ️  ${uk} players still read "United Kingdom" — uncapped, so no caps to derive from. Known residual.`);

console.log(`\npool: ${pool.length} players`);
process.exitCode = bad ? 1 : 0;
