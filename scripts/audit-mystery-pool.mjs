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

const FAME_FLOOR = 70;      // above this, absence is a defect, not a judgement call
let bad = 0;
const fail = (m) => { console.error(`❌ ${m}`); bad++; };
const ok = (m) => console.log(`✅ ${m}`);

const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const coreRaw = JSON.parse(readFileSync('scripts/_mystery-core.json', 'utf8'));
const core = Array.isArray(coreRaw) ? coreRaw : (coreRaw.players || Object.values(coreRaw).find(Array.isArray));
const excl = existsSync('src/data/mysteryExclusions.json')
  ? JSON.parse(readFileSync('src/data/mysteryExclusions.json', 'utf8')) : {};
const excluded = new Set([...(excl.managers || []), ...(excl.nonPlayers || [])]);

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
  .filter((p) => p.fame >= FAME_FLOOR && !inPool.has(p.id) && !excluded.has(p.name))
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

// ── 5. report the residual so it stays visible rather than forgotten ────────
const uk = pool.filter((p) => p.nat === 'United Kingdom').length;
if (uk) console.log(`ℹ️  ${uk} players still read "United Kingdom" — uncapped, so no caps to derive from. Known residual.`);

console.log(`\npool: ${pool.length} players`);
process.exitCode = bad ? 1 : 0;
