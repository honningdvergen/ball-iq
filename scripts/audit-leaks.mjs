// Bank-wide answer-leak audit, per club pack.
//
// Answers the question "should I be worried about the ~17% leak figure?" with a
// number that means something. The old figure counted every string match, which
// on a club pack is dominated by vocabulary the topic cannot avoid — you cannot
// write about Santos without "Copa Libertadores", or Liverpool without
// "Liverpool". See scripts/leak-rules.mjs for the strong/weak split.
//
// Usage:
//   node scripts/audit-leaks.mjs              summary per club, worst first
//   node scripts/audit-leaks.mjs --club Arsenal   every strong leak in one pack
//   node scripts/audit-leaks.mjs --strong-only    hide the weak noise entirely
//
// NOT wired into the build. This reports on questions that already shipped, and
// a gate that fails the build for pre-existing content just teaches people to
// bypass the build.
import { readFileSync } from 'fs';
import { findLeaks } from './leak-rules.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? (process.argv[i + 1] ?? true) : d; };
const only = arg('club', null);
const strongOnly = process.argv.includes('--strong-only');

const { QB } = await import('../src/questions.js');

const byClub = new Map();
for (const q of QB) {
  if (!q || !q.club || q.type !== 'mcq' || !Array.isArray(q.o)) continue;
  if (only && q.club !== only) continue;
  if (!byClub.has(q.club)) byClub.set(q.club, []);
  byClub.get(q.club).push(q);
}

const rows = [];
for (const [club, qs] of byClub) {
  const leaks = findLeaks(qs, { clubName: club });
  const strong = leaks.filter((l) => l.severity === 'strong');
  const strongStem = strong.filter((l) => l.where === 'stem');
  const strongHint = strong.filter((l) => l.where === 'hint');
  // A question is "affected" if it is the one GIVING the answer away — that is
  // the one a human has to rewrite.
  const affected = new Set(strong.map((l) => l.at)).size;
  rows.push({ club, n: qs.length, raw: leaks.length, strong: strong.length, stem: strongStem.length, hint: strongHint.length, affected, pct: qs.length ? (affected / qs.length) * 100 : 0, leaks: strong });
}

rows.sort((a, b) => b.pct - a.pct);

if (only) {
  const r = rows[0];
  if (!r) { console.log(`no pack found for club "${only}"`); process.exit(0); }
  const qs = byClub.get(only);
  console.log(`\n${r.club} — ${r.n} questions, ${r.strong} STRONG leaks (${r.raw} raw)\n`);
  for (const l of r.leaks) {
    console.log(`  "${l.answer}"  answer of Q${l.answerOf}  ->  appears in ${l.where} of Q${l.at}`);
    console.log(`     Q${l.answerOf}: ${qs[l.answerOf].q}`);
    console.log(`     Q${l.at}: ${l.where === 'stem' ? qs[l.at].q : qs[l.at].hint}\n`);
  }
  process.exit(0);
}

const tot = rows.reduce((t, r) => ({
  n: t.n + r.n, raw: t.raw + r.raw, strong: t.strong + r.strong,
  stem: t.stem + r.stem, hint: t.hint + r.hint, affected: t.affected + r.affected,
}), { n: 0, raw: 0, strong: 0, stem: 0, hint: 0, affected: 0 });

console.log(`\nANSWER-LEAK AUDIT — ${byClub.size} club packs, ${tot.n} questions\n`);
console.log(`  raw string matches      ${tot.raw}`);
console.log(`  STRONG (real defects)   ${tot.strong}   —  ${tot.stem} in stems, ${tot.hint} in hints`);
console.log(`  weak (unavoidable)      ${tot.raw - tot.strong}   —  competitions, the pack's own club`);
console.log(`  questions to rewrite    ${tot.affected} of ${tot.n}  (${(tot.affected / tot.n * 100).toFixed(1)}%)\n`);

const bad = rows.filter((r) => r.strong > 0);
console.log(`packs with at least one STRONG leak: ${bad.length} of ${rows.length}\n`);
console.log('  club                  Qs   strong  stem  hint   % of pack');
for (const r of bad.slice(0, 20)) {
  console.log(`  ${r.club.padEnd(20)} ${String(r.n).padStart(4)} ${String(r.strong).padStart(7)} ${String(r.stem).padStart(5)} ${String(r.hint).padStart(5)}   ${r.pct.toFixed(1)}%`);
}
if (bad.length > 20) console.log(`  …and ${bad.length - 20} more`);
console.log('\n  node scripts/audit-leaks.mjs --club "<name>"   to see them in full\n');
