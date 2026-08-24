#!/usr/bin/env node
// Near-duplicate audit — the same fact asked twice, in almost the same words.
//
// ⚠️ FOUND 2026-08-24 while chasing a different item. Scouting report #4 said
// "29 near-duplicate pairs disagree with themselves about difficulty", framing
// this as a GRADING problem. Measuring it showed the grading disagreement is a
// symptom: the pairs disagree because they are the same question entered twice
// by different hands, and one hand said medium while the other said hard.
//
// The worst of them were verbatim:
//
//   "Ciro Immobile won the European Golden Shoe in 2019-20 with how many Serie A goals?"   [hard]
//   "Ciro Immobile won the 2019-20 European Golden Shoe with how many Serie A goals?"      [medium]
//
// and the 2000 UEFA Cup final existed THREE times. Eleven redundant copies were
// deleted; the survivors were chosen by two rules, in order: keep whichever copy
// the frozen Daily 7 log references (deleting it would rewrite a day players
// have already played), then keep whichever copy carries a translation
// (scripts/seo/clubs-<locale>.mjs hard-fails the SEO build on a translated
// question whose English source is gone — this fired on the Turkish Galatasaray
// page and is the reason the Galatasaray survivor was swapped).
//
// ── HOW SIMILARITY IS MEASURED ──────────────────────────────────────────────
// Jaccard overlap of content words, but ONLY between questions that already
// share an answer. Comparing every pair in a 6.7k bank is both slow and noisy;
// two questions with different answers are not duplicates however similar the
// wording, and two with the same answer and 80% shared vocabulary essentially
// always are.
//
// ⚠️ The stop-list is load-bearing. Without it "which/who/the/club/season"
// inflate every pair toward each other and the whole bank looks duplicated —
// the same failure mode that made the first stem-leak detector report 18 hits
// for 3 real ones.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { QB } = await import(join(ROOT, 'src/questions.js'));

const STOP = new Set(['the', 'and', 'for', 'which', 'who', 'what', 'was', 'were', 'did', 'has',
  'have', 'with', 'from', 'that', 'this', 'their', 'his', 'her', 'are', 'club', 'player', 'team',
  'season', 'year', 'years', 'won', 'win', 'only', 'first', 'most', 'how', 'many', 'one', 'two',
  'side', 'became']);

const words = (s) => String(s || '').toLowerCase()
  .replace(/[^a-z0-9à-ÿ ]+/g, ' ')
  .split(/\s+/)
  .filter((w) => w.length > 2 && !STOP.has(w));

const jaccard = (a, b) => {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
};

export const DUPLICATE_THRESHOLD = 0.8;

/**
 * Pairs that are the same question twice, hand-checked and deliberately kept.
 * ⚠️ Not a way to go green — each needs a reason that survives reading.
 */
export const RULED_NOT_DUPLICATES = {
  'q_40e514|q_e76078': "Genuinely a duplicate, and BOTH copies are referenced by the frozen Daily 7 log — deleting either would rewrite a day players have already played. Difficulty aligned to hard instead (an exact goal tally is not medium).",
  'q_755d1d|q_d905ee': "Not duplicates: same answer ('the English league system') but different subjects — one asks about Cardiff City, the other about Swansea City. Each belongs to its own club pack.",
};

export function findDuplicatePairs(bank = QB, threshold = DUPLICATE_THRESHOLD) {
  const mcq = bank.filter((q) => q?.type === 'mcq' && Array.isArray(q.o) && typeof q.a === 'number' && q.o[q.a]);
  const byAnswer = new Map();
  for (const q of mcq) {
    const a = String(q.o[q.a]).toLowerCase().trim();
    if (!byAnswer.has(a)) byAnswer.set(a, []);
    byAnswer.get(a).push(q);
  }
  const pairs = [];
  for (const [answer, qs] of byAnswer) {
    if (qs.length < 2) continue;
    const keys = qs.map((q) => new Set(words(q.q)));
    for (let i = 0; i < qs.length; i += 1) {
      for (let j = i + 1; j < qs.length; j += 1) {
        const sim = jaccard(keys[i], keys[j]);
        if (sim < threshold) continue;
        const [x, y] = [qs[i].id, qs[j].id].sort();
        pairs.push({ key: `${x}|${y}`, sim: +sim.toFixed(2), answer, a: qs[i], b: qs[j] });
      }
    }
  }
  return pairs;
}

function selfTest() {
  const planted = [
    { id: 'A', type: 'mcq', q: 'Ciro Immobile won the European Golden Shoe in 2019-20 with how many Serie A goals?', o: ['30', '36'], a: 1, diff: 'hard' },
    { id: 'B', type: 'mcq', q: 'Ciro Immobile won the 2019-20 European Golden Shoe with how many Serie A goals?', o: ['36', '30'], a: 0, diff: 'medium' },
  ];
  if (!findDuplicatePairs(planted).length) throw new Error('SELF-TEST FAILED: planted duplicate not detected');
  const distinct = [
    { id: 'C', type: 'mcq', q: 'Which club won the 2025-26 Premier League title?', o: ['Arsenal', 'Chelsea'], a: 0, diff: 'easy' },
    { id: 'D', type: 'mcq', q: 'Which club won the 2026 FA Cup at Wembley?', o: ['Arsenal', 'Chelsea'], a: 0, diff: 'easy' },
  ];
  if (findDuplicatePairs(distinct).length) throw new Error('SELF-TEST FAILED: distinct questions reported as duplicates');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  selfTest();
  const pairs = findDuplicatePairs();
  const unruled = pairs.filter((p) => !RULED_NOT_DUPLICATES[p.key]);
  console.log(`[duplicate-questions] scanned ${QB.length} · ${pairs.length} pairs at >=${DUPLICATE_THRESHOLD} · ${unruled.length} unruled`);
  if (!process.argv.includes('--quiet')) {
    for (const p of unruled) {
      console.log(`\n  ${p.sim}  [${p.a.diff}] ${p.a.id}  vs  [${p.b.diff}] ${p.b.id}   => ${p.answer}`);
      console.log(`     A: ${p.a.q}`);
      console.log(`     B: ${p.b.q}`);
    }
  }
  if (process.argv.includes('--strict') && unruled.length) process.exit(1);
}
