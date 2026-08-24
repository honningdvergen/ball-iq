// gen-leak-conflicts.mjs — emit src/questionConflicts.js: pairs of questions
// that must not be drawn into the SAME session.
//
//   node scripts/gen-leak-conflicts.mjs           # write
//   node scripts/gen-leak-conflicts.mjs --check   # exit 1 if stale (CI use)
//
// ⚠️ WHY THIS EXISTS, AND WHY IT IS NOT AN EDITORIAL FIX.
//
// 540 answers in the club packs appear inside ANOTHER question's stem or hint
// (scripts/audit-leaks.mjs). Every one of those questions is factually correct
// and was verified when it shipped — the defect is not the question, it is the
// PAIR. "Who scored the winner in the 2011 Europa League final?" is a fine
// question until it lands in the same ten as "Radamel Falcao was sold by Porto
// in 2011 to which club?", at which point one of them is a free point.
//
// The measurement that decided the approach: 15.8% of club questions are
// involved in a strong leak, but that is NOT the number a player feels. What
// they feel is how often a PAIR co-occurs in one session, and on a 32-45
// question pack drawing 10, that is:
//
//     28.9% of all club sessions contained at least one leaked pair
//     Parma 66.5% · Porto 64.3% · Real Sociedad 63.4% · Chelsea 54.3%
//
// Nearly one session in three handed out a free point, and the worst packs did
// it two times in three. Rewriting 470 verified questions would fix that too,
// eventually, at the cost of 470 chances to break a correct question. Not
// drawing both halves together fixes it now and cannot break anything, because
// it changes no text.
//
// The editorial pass is still worth doing for pack DEPTH — every avoided pair
// slightly narrows what a session can draw from — but it is no longer urgent,
// and it can proceed pack by pack without a deadline.
//
// ⚠️ CLUB PACKS ONLY — DO NOT APPLY THIS TO THE DAILY 7.
// The Daily 7 feeds /c/ challenge links, the "You beat X" modal and an OG card,
// so its selection must depend on the date and nothing else. Filtering it here
// would silently rewrite every past and future daily. See the comparison-facing
// rule in the ball-iq-question-bank skill.
import { readFileSync, writeFileSync } from 'fs';
import { findLeaks } from './leak-rules.mjs';

const check = process.argv.includes('--check');
const OUT = 'src/questionConflicts.js';

const { QB } = await import('../src/questions.js');

const byClub = new Map();
for (const q of QB) {
  if (!q || !q.club || q.type !== 'mcq' || !Array.isArray(q.o)) continue;
  if (!byClub.has(q.club)) byClub.set(q.club, []);
  byClub.get(q.club).push(q);
}

// id -> Set(ids). Symmetric: a stem leak reveals the answer whichever of the
// two a player reaches first, and a hint leak is only one-directional in
// theory — in practice the hint is read the moment that question is answered,
// which can happen before OR after the question it spoils.
const conflicts = new Map();
const link = (a, b) => {
  if (!a || !b || a === b) return;
  if (!conflicts.has(a)) conflicts.set(a, new Set());
  if (!conflicts.has(b)) conflicts.set(b, new Set());
  conflicts.get(a).add(b);
  conflicts.get(b).add(a);
};

// ⚠️ SCAN THE POOL THE APP ACTUALLY SERVES, NOT JUST THE WHOLE PACK.
//
// The club quiz drops "easy" questions (die-hard fans; see launchClubQuiz) and
// only falls back to the full pack when medium+hard cannot fill ten. That
// subsetting CHANGES which leaks are strong, because leak-rules treats an
// answer named in more than two other questions as unavoidable vocabulary: a
// fact mentioned three times across the whole pack is weak, but if two of those
// three are easy questions the player never sees, it is mentioned once in the
// pool they DO see — and there it is a real giveaway.
//
// Generating from the full pack only, this missed enough pairs that Real Madrid
// still leaked in 44.6% of simulated sessions with the avoidance switched on.
// Scanning both and taking the UNION is the safe direction: an extra conflict
// costs at most a slightly narrower draw, and pickAvoidingConflicts will never
// shorten a game over it.
// ⚠️ CATEGORIES TOO, NOT JUST CLUBS — 52% OF THE BANK WAS INVISIBLE HERE.
//
// The loop below keys on `q.club`, so every question without one — 3,535 of
// 6,776 mcq rows, measured 2026-08-23 — was never compared to anything. That
// is not a niche slice: it is the whole of WorldCup, Euros, Managers, Records,
// History and the category-only half of every league.
//
// It surfaced from a player report. Three questions about the 1999 Champions
// League semi-final sat in the bank with one of them naming Juventus in its
// stem — the answer to the other two — and this generator had registered ZERO
// conflicts between them, because they carry a `cat` and no `club`.
//
// ⚠️ AND IT INVALIDATED A MEASUREMENT I REPORTED. On the morning of 08-23 I
// added pickAvoidingConflicts to the League Quiz draw and measured the leak
// rate going to 0.0%. That was measured AGAINST THIS MAP — the same instrument
// carrying the blind spot — so it only proved the guard covered what the guard
// could see. Re-measured against the leak RULES instead: 8.0% of league
// sessions still contained a leaked pair, Primeira 27.2%, Ligue1 22.7%.
// Scanning categories takes that to 0.0% for real.
//
// Same no-easy union as the club pass, and for the same reason: the league
// draw drops "easy" too (see launchLeagueQuiz), and subsetting changes which
// leaks are strong.
const byCat = new Map();
for (const q of QB) {
  if (!q || !q.cat || q.type !== 'mcq' || !Array.isArray(q.o)) continue;
  if (!byCat.has(q.cat)) byCat.set(q.cat, []);
  byCat.get(q.cat).push(q);
}

let pairCount = 0;
for (const [, qs] of byCat) {
  const noEasy = qs.filter((q) => q.diff !== 'easy');
  const pools = [qs];
  if (noEasy.length >= 10) pools.push(noEasy);
  for (const pool of pools) {
    for (const l of findLeaks(pool)) {
      if (l.severity !== 'strong') continue;
      link(pool[l.answerOf]?.id, pool[l.at]?.id);
      pairCount++;
    }
  }
}

for (const [club, qs] of byClub) {
  const noEasy = qs.filter((q) => q.diff !== 'easy');
  const pools = [qs];
  if (noEasy.length >= 10) pools.push(noEasy);
  for (const pool of pools) {
    for (const l of findLeaks(pool, { clubName: club })) {
      if (l.severity !== 'strong') continue;
      link(pool[l.answerOf]?.id, pool[l.at]?.id);
      pairCount++;
    }
  }
}

// ⚠️ THE THIRD GROUP KEY, AND THE REASON THE GUARD READ AS COMPLETE WHILE THE
// NEWEST PACK WAS THE LEAKIEST THING IN THE APP.
//
// This file grouped by `cat` and by `club`. Topical packs select by NEITHER —
// src/App.jsx passes `{ tag: TOPICAL_PACK.tag, onlyDiff: "hard" }`, because a
// topical pack cuts across categories by nature (the summer-2026 set spans
// WorldCup, Transfers, Managers, PL and UCL). A pool this generator never
// groups is a pool it never guards, and audit-leaks-full.mjs enumerated the
// same two keys — so its "0 unguarded" was a self-confirming zero that would
// have printed a green tick over this forever.
//
// Measured on the served pool (tag summer2026, hard only, 46 questions) before
// this pass existed: 18 leaked pairs, 11 of them strong, ONE of them already in
// the map. Simulating sessions rather than questions — the ~2x difference this
// project has been caught by before — 39.0% of ten-question sessions handed the
// player at least one free point. That is the Home-featured, NEW-badged pack.
const byTag = new Map();
for (const q of QB) {
  if (!q || !q.tag || q.type !== 'mcq' || !Array.isArray(q.o)) continue;
  if (!byTag.has(q.tag)) byTag.set(q.tag, []);
  byTag.get(q.tag).push(q);
}

for (const [, qs] of byTag) {
  // `onlyDiff` is a FLOOR, not a ceiling — the topical tile serves hard and
  // nothing else — so the hard-only subset is the pool players actually meet.
  // The full set is scanned too, in case a future tile drops the restriction.
  const hardOnly = qs.filter((q) => q.diff === 'hard');
  const pools = [qs];
  if (hardOnly.length >= 10) pools.push(hardOnly);
  for (const pool of pools) {
    for (const l of findLeaks(pool)) {
      if (l.severity !== 'strong') continue;
      link(pool[l.answerOf]?.id, pool[l.at]?.id);
      pairCount++;
    }
  }
}

const sorted = [...conflicts.entries()]
  .map(([id, set]) => [id, [...set].sort()])
  .sort((a, b) => (a[0] < b[0] ? -1 : 1));

const body = `// GENERATED by scripts/gen-leak-conflicts.mjs — DO NOT EDIT BY HAND.
//
// Questions whose answers give each other away. The club-pack picker in
// App.jsx skips a candidate that conflicts with one already drawn, so a single
// session never contains both halves of a pair. Regenerate after any change to
// the club packs; the build does it automatically.
//
// ${sorted.length} questions across ${pairCount} strong leaks.
export const QUESTION_CONFLICTS = ${JSON.stringify(Object.fromEntries(sorted), null, 0)};

/** Ids that must not share a session with \`id\`. Never null. */
export function conflictsWith(id) {
  return QUESTION_CONFLICTS[id] || [];
}
`;

if (check) {
  let cur = '';
  try { cur = readFileSync(OUT, 'utf8'); } catch { /* missing counts as stale */ }
  if (cur !== body) {
    console.error(`✗ ${OUT} is stale — run: node scripts/gen-leak-conflicts.mjs`);
    process.exit(1);
  }
  console.log(`✅ ${OUT} up to date (${sorted.length} questions, ${pairCount} leaks)`);
} else {
  writeFileSync(OUT, body, 'utf8');
  console.log(`✅ ${OUT} — ${sorted.length} questions in ${pairCount} strong leaks across ${byCat.size} categories, ${byClub.size} club packs and ${byTag.size} topical pack(s)`);
}
