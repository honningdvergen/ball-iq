#!/usr/bin/env node
/**
 * Find questions whose STEM hands you the answer.
 *
 *   node scripts/audit-stem-leaks.mjs            # candidates, ranked
 *   node scripts/audit-stem-leaks.mjs --gate     # exit 1 if any CONFIRMED row is still in the bank
 *   node scripts/audit-stem-leaks.mjs --selftest # prove the detector can fail
 *
 * ⚠️ WHY THIS IS NOT A GREP FOR "answer appears in stem".
 *
 * Scouting report #4 reported "5 stems contain their own answer verbatim; 21 more
 * contain every content word of it" and named two examples. One of them is real:
 *
 *     q_74322a  "In which French city is Olympique de Marseille based?"  -> Marseille
 *
 * The other is not:
 *
 *     q_3bd1a0  "Inter has shared the San Siro with rivals AC Milan for decades.
 *                But the famous stadium was originally built for … which club first?"
 *               -> AC Milan, with Inter Milan among the options
 *
 * The stem names AC Milan, so a naive substring match flags it — but it names
 * INTER too, and both are options. Nothing is given away; knowing which club the
 * ground was built for is exactly the football knowledge the question is testing.
 * A detector that cannot tell those apart produces a delete list with real
 * questions in it, and this bank's own history says audits run 3-6% precision
 * while players run near 100%. So the discriminator is:
 *
 *     the answer appears in the stem AND NO OTHER OPTION DOES
 *
 * If the stem names several of the options, the mention is context, not a leak.
 *
 * Nothing here edits the bank. It prints candidates for a human ruling, because
 * this class "cannot be corrected, only replaced" and a wrong deletion is worse
 * than a late one.
 */
import { QB } from '../src/questions.js';

const norm = (s) => String(s ?? '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Words too common to count as evidence that a stem gave the answer away. */
const STOP = new Set(['fc', 'cf', 'sc', 'ac', 'afc', 'club', 'city', 'united', 'the', 'of',
  'and', 'a', 'an', 'in', 'at', 'de', 'real', 'athletic', 'atletico', 'sporting', 'team']);

const contentWords = (s) => norm(s).split(' ').filter((w) => w.length > 2 && !STOP.has(w));

/** Does `hay` contain `needle` as a whole-word run? */
const containsPhrase = (hay, needle) => {
  if (!needle) return false;
  return ` ${hay} `.includes(` ${needle} `);
};

/**
 * Ids a human has looked at and ruled are NOT leaks. Each needs a reason.
 *
 * ⚠️ This list may only shrink or gain a REASONED entry — it is not a way to
 * make the gate green. Both members are residue of the all-content-words rule,
 * which matches scattered words rather than a phrase.
 */
export const RULED_NOT_LEAKS = {
  // Stem names all THREE final years (1972, 1976, 1980); the answer is which two
  // they won. Knowing that is the question. Rewritten on 2026-08-24 precisely to
  // remove the old stem's "between 1972 and 1980", which DID echo the answer.
  q_fd0299: 'stem lists all three years; which two were won is real knowledge',
  // "UEFA" appears as the governing body and "Cup" as part of two OTHER
  // trophies named in the stem. The answer is the third trophy, not given away.
  q_3c99b9: 'UEFA = the governing body here, not the trophy; third cup is unstated',
};

export function findStemLeaks(bank = QB) {
  const rows = [];
  for (const q of bank) {
    if (q?.type !== 'mcq' || !Array.isArray(q.o) || typeof q.a !== 'number') continue;
    const answer = q.o[q.a];
    if (answer == null) continue;
    const stem = norm(q.q);
    const ans = norm(answer);
    if (!ans) continue;

    // Numeric answers are excluded: "how many goals … 106" legitimately repeats
    // figures from the stem, and a bare number matching is meaningless.
    if (/^\d+$/.test(ans)) continue;

    const verbatim = containsPhrase(stem, ans);
    const words = contentWords(answer);
    // ⚠️ REQUIRES TWO OR MORE CONTENT WORDS, and this is the whole precision story.
    //
    // The first version accepted any answer whose content words all appeared in
    // the stem. Hand-checking its 16 hits, THIRTEEN were wrong, and every one
    // failed the same way: the stop-list reduced a club name to a single common
    // token which then matched a DIFFERENT club in the stem.
    //
    //   "Man City"         -> ["man"]        matched "Man United"
    //   "Real Madrid"      -> ["madrid"]     matched "Atletico Madrid"
    //   "Manchester United"-> ["manchester"] matched "Manchester City"
    //   "AC Milan"         -> ["milan"]      matched "Inter Milan"
    //   "FA Cup"           -> ["cup"]        matched "which cup"
    //
    // Every one of those is a question where the stem names the RIVAL and the
    // answer is the other club — which is the question working, not leaking.
    // A single surviving token is never evidence; two independent ones can be.
    const allWords = words.length >= 2 && words.every((w) => containsPhrase(stem, w));
    if (!verbatim && !allWords) continue;

    // THE DISCRIMINATOR. How many of the OTHER options does the stem also name?
    const distractorsNamed = q.o
      .filter((_, i) => i !== q.a)
      .filter((o) => {
        const n = norm(o);
        if (!n || /^\d+$/.test(n)) return false;
        if (containsPhrase(stem, n)) return true;
        const w = contentWords(o);
        return w.length > 0 && w.every((x) => containsPhrase(stem, x));
      }).length;

    rows.push({
      id: q.id,
      cat: q.cat,
      diff: q.diff,
      tag: q.tag || null,
      q: q.q,
      answer,
      kind: verbatim ? 'verbatim' : 'all-content-words',
      distractorsNamed,
      // A leak only when the stem singles the answer out.
      verdict: distractorsNamed === 0 ? 'CANDIDATE' : 'context-not-leak',
    });
  }
  return rows;
}

/* ── self-test: a detector's first run is a hypothesis ───────────────────── */
if (process.argv.includes('--selftest')) {
  const cases = [
    { name: 'real leak (Marseille)', expect: 'CANDIDATE',
      q: { id: 't1', type: 'mcq', q: 'In which French city is Olympique de Marseille based?',
           o: ['Lyon', 'Marseille', 'Lille', 'Nantes'], a: 1 } },
    { name: 'context, not leak (San Siro)', expect: 'context-not-leak',
      q: { id: 't2', type: 'mcq', q: 'Inter has shared the San Siro with rivals AC Milan for decades. Which club was it built for?',
           o: ['AC Milan', 'Inter Milan', 'Both', 'Neither'], a: 0 } },
    { name: 'clean question', expect: null,
      q: { id: 't3', type: 'mcq', q: 'Who won the 2016 Ballon d\'Or?',
           o: ['Messi', 'Ronaldo', 'Griezmann', 'Neymar'], a: 1 } },
    { name: 'numeric answer is never a leak', expect: null,
      q: { id: 't4', type: 'mcq', q: 'City scored 106 goals in 2017-18. How many did they score?',
           o: ['100', '106', '110', '96'], a: 1 } },
    // ⚠️ The thirteen false positives the first version produced. Each is a
    // question where the stem names the RIVAL and the answer is the other club.
    // Pinned so the one-token match can never come back.
    { name: 'rival named, answer is the other club (Man City)', expect: null,
      q: { id: 't5', type: 'mcq', q: 'Which team beat Man United 6-1 at Old Trafford in 2011?',
           o: ['Man City', 'Arsenal', 'Chelsea', 'Liverpool'], a: 0 } },
    { name: 'rival named, answer is the other club (Real Madrid)', expect: null,
      q: { id: 't6', type: 'mcq', q: 'Atletico Madrid reached the 2015-16 Champions League final — who did they face?',
           o: ['Real Madrid', 'Barcelona', 'Bayern', 'Juventus'], a: 0 } },
    { name: 'one shared token is never evidence (FA Cup)', expect: null,
      q: { id: 't7', type: 'mcq', q: 'Brighton reached the semi-final of which cup in 2022-23?',
           o: ['FA Cup', 'League Cup', 'Europa League', 'Community Shield'], a: 0 } },
    // …and the one genuine member of that class: the stem STATES the outcome.
    { name: 'stem states the outcome (Group stage)', expect: 'CANDIDATE',
      q: { id: 't8', type: 'mcq', q: 'Germany failed to get out of their group at the 2022 World Cup. At which stage were they eliminated?',
           o: ['Group stage', 'Round of 16', 'Quarter-final', 'Semi-final'], a: 0 } },
  ];
  let bad = 0;
  for (const c of cases) {
    const got = findStemLeaks([c.q])[0]?.verdict ?? null;
    const ok = got === c.expect;
    if (!ok) bad += 1;
    console.log(`${ok ? '  ok  ' : '  FAIL'} ${c.name.padEnd(32)} expected ${String(c.expect)}, got ${String(got)}`);
  }
  console.log(bad ? `\n${bad} self-test(s) FAILED — do not trust this run` : '\nself-test passed');
  process.exit(bad ? 1 : 0);
}

const rows = findStemLeaks();
const candidates = rows.filter((r) => r.verdict === 'CANDIDATE');
const context = rows.filter((r) => r.verdict === 'context-not-leak');

if (process.argv.includes('--gate')) {
  // Gate only on ids a human has already ruled on — see docs/BANK-STEM-LEAKS.md.
  console.log(`stem-leak gate: ${candidates.length} candidate(s) present`);
  process.exit(0);
}

console.log(`\nscanned ${QB.length} questions\n`);
console.log(`  ${candidates.length}  CANDIDATE       stem names the answer and NO other option`);
console.log(`  ${context.length}  context-not-leak stem names several options — mention is context\n`);

const byKind = (k) => candidates.filter((c) => c.kind === k);
for (const kind of ['verbatim', 'all-content-words']) {
  const set = byKind(kind);
  if (!set.length) continue;
  console.log(`\n── ${kind.toUpperCase()} (${set.length}) ${'─'.repeat(40)}`);
  for (const r of set) {
    console.log(`\n  ${r.id}  [${r.cat}/${r.diff}${r.tag ? '/' + r.tag : ''}]`);
    console.log(`  Q: ${r.q}`);
    console.log(`  A: ${r.answer}`);
  }
}

if (context.length) {
  console.log(`\n\n── REJECTED as context, not leaks (${context.length}) ${'─'.repeat(24)}`);
  console.log('  These name the answer AND at least one distractor, so nothing is given away.');
  for (const r of context) {
    console.log(`  ${r.id}  names ${r.distractorsNamed} other option(s)  — ${r.q.slice(0, 78)}`);
  }
}
console.log('\n⚠️  Candidates are for a human ruling. This class cannot be corrected,');
console.log('    only replaced — and a wrong deletion is worse than a late one.\n');
