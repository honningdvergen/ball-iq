#!/usr/bin/env node
/**
 * Exhaustive answer-leak coverage audit.
 *
 *   node scripts/audit-leaks-full.mjs          # report
 *   node scripts/audit-leaks-full.mjs --strict # exit 1 on any gap
 *
 * ⚠️ NOT IN THE BUILD GATE, ON PURPOSE. findLeaks is O(n^2) per pool and
 * History alone holds 857 questions, so a full pass takes ~25 seconds. The
 * vitest suite runs on every build in about two seconds; a 10x slowdown there
 * would buy a check the generator already performs as it writes the map.
 * tests/unit/answer-leaks.test.js keeps the cheap invariants the generator
 * cannot see — that the map, the draw thresholds and the picker still agree.
 *
 * ⚠️ WHY IT EXISTS AT ALL. gen-leak-conflicts.mjs keyed only on `q.club` until
 * 2026-08-23, so 3,535 of 6,776 mcq rows — 52% of the bank, the whole of
 * WorldCup, Euros, Managers, Records, History and the category-only half of
 * every league — were never compared to anything. A player found it, not a
 * check: three questions about the 1999 Champions League semi-final, one
 * naming Juventus in its stem, which is the answer to the other two, with zero
 * conflicts registered between them.
 *
 * And the blind spot invalidated a measurement. The League Quiz draw gained
 * pickAvoidingConflicts that same morning and the leak rate was reported as
 * 0.0% — measured against the MAP, i.e. against the same blind spot. Measured
 * against the RULES instead: 8.0% of league sessions still leaked, Primeira
 * 27.2%, Ligue1 22.7%.
 *
 * So this audit deliberately does not trust the map. It re-derives every strong
 * leak from leak-rules.mjs and asks whether the map covers it — an independent
 * source, which is the standing lesson from every detector that has been wrong
 * in this repo.
 */
import { findLeaks } from './leak-rules.mjs';

const strict = process.argv.includes('--strict');
const { QB } = await import('../src/questions.js');
const { conflictsWith } = await import('../src/questionConflicts.js');

const mcq = QB.filter((q) => q && q.type === 'mcq' && Array.isArray(q.o));

// Thresholds mirror the DRAW, not the generator: clubs widen to the full pack
// below 16 eligible (App.jsx launchClubQuiz), leagues below 10
// (launchLeagueQuiz). Auditing against the generator's own thresholds would
// only prove the generator agrees with itself.
// ⚠️ THIS LIST IS THE AUDIT'S BLIND SPOT, AND IT PRINTED A GREEN TICK OVER IT.
//
// The audit re-derives leaks from the RULES rather than from the generated map,
// which is genuinely good design — a map that is wrong cannot certify itself.
// But it enumerated the SAME group keys the generator does, so any pool the
// generator never grouped was a pool the audit never checked, and "0 unguarded"
// was a self-confirming zero rather than a clean bill of health.
//
// Topical packs select by `tag` (src/App.jsx passes { tag, onlyDiff:"hard" }),
// which was in neither list. The Home-featured summer-2026 pack therefore
// leaked in 14.8% of real sessions while this file reported nothing at all.
//
// `subset` is the SECOND pool each group serves, and it is not always "drop
// easy": the topical tile serves onlyDiff:'hard', a floor rather than a
// ceiling, so its served pool is the hard rows and nothing else. Auditing the
// wrong subset is how a guard reports clean on a pool no player ever meets.
const GROUPS = [
  { key: 'club', threshold: 16, useClubName: true, subset: (qs) => qs.filter((q) => q.diff !== 'easy') },
  { key: 'cat', threshold: 10, useClubName: false, subset: (qs) => qs.filter((q) => q.diff !== 'easy') },
  { key: 'tag', threshold: 10, useClubName: false, subset: (qs) => qs.filter((q) => q.diff === 'hard') },
];

let gaps = 0;
let checked = 0;

for (const { key, threshold, useClubName, subset } of GROUPS) {
  const groups = new Map();
  for (const q of mcq) {
    const v = q[key];
    if (!v) continue;
    if (!groups.has(v)) groups.set(v, []);
    groups.get(v).push(q);
  }

  const missingByGroup = new Map();
  for (const [name, qs] of groups) {
    const served = subset(qs);
    const pools = served.length >= threshold ? [qs, served] : [qs];
    // clubName downgrades a leak whose answer is the pack's own club —
    // "Tottenham Hotspur" inside a Tottenham question is unavoidable
    // vocabulary, not a giveaway. Omitting it reports phantom gaps; that is
    // exactly what the first run of the vitest version did, 9 of them.
    const opts = useClubName ? { clubName: name } : undefined;
    for (const pool of pools) {
      for (const l of findLeaks(pool, opts)) {
        if (l.severity !== 'strong') continue;
        const a = pool[l.answerOf]?.id;
        const b = pool[l.at]?.id;
        if (!a || !b || a === b) continue;
        checked += 1;
        if (!conflictsWith(a).includes(b)) {
          if (!missingByGroup.has(name)) missingByGroup.set(name, []);
          missingByGroup.get(name).push(`${a} <-> ${b}`);
          gaps += 1;
        }
      }
    }
  }

  const label = { club: 'CLUB PACKS', cat: 'CATEGORIES', tag: 'TOPICAL PACKS' }[key] || key.toUpperCase();
  if (missingByGroup.size === 0) {
    console.log(`  ✅ ${label}: every strong leak is guarded`);
  } else {
    console.log(`  ❌ ${label}: ${missingByGroup.size} group(s) with unguarded pairs`);
    for (const [name, pairs] of [...missingByGroup].sort((x, y) => y[1].length - x[1].length).slice(0, 10)) {
      console.log(`     ${name}: ${pairs.length}`);
      for (const pr of pairs.slice(0, 3)) console.log(`       ${pr}`);
    }
  }
}

console.log(`\n  ${checked} strong leak instances checked · ${gaps} unguarded`);
// ⚠️ A ZERO here is only meaningful if the audit could see anything at all.
// State the denominator so an empty result can never be mistaken for coverage.
if (checked < 500) {
  console.log('  ⚠️ suspiciously few instances checked — the audit may be blind, not clean');
  if (strict) process.exit(1);
}
if (gaps && strict) process.exit(1);
