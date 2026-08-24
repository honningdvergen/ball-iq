#!/usr/bin/env node
// Giveaway-distractor audit — the question you can answer by MATCHING, without
// knowing any football.
//
// The shape: a distinctive word appears in the stem AND in the correct option,
// and in none of the wrong ones. "Which club did X join from Wolverhampton
// Wanderers?" with "Wolverhampton Wanderers" sitting there as an option. The
// answer key is right, every option is a real club, and a player who has never
// watched a match scores it every time.
//
// Distinct from scripts/audit-distractor-plausibility.mjs, which asks whether a
// wrong option is CREDIBLE. This asks whether the right one is SIGNPOSTED.
//
// ⚠️ WHAT THE FIRST RUN TAUGHT ME. Per feedback_verify_detector_output, a
// detector's first run is a hypothesis. The naive rule — "any stem token that
// appears only in the correct option" — is almost entirely noise, because the
// legitimate reasons a stem shares a word with its answer are everywhere:
//
//   * SHARED CLUB/COUNTRY WORDS. "Which Manchester United player…" answered by
//     a person, where a distractor happens not to contain "Manchester". The
//     token is in the stem for context, not as a tell.
//   * THE QUESTION IS ABOUT THE WORD. "Which country's league is the
//     Eredivisie?" → "Netherlands" shares nothing, but "Copa del Rey" → "Real
//     Sociedad" trips a naive `rey`/`real` prefix match.
//   * NUMERALS AND SEASONS. "the 1992-93 title" → "1992-93". Handled by the
//     year-narrowing detector in audit-stem-leaks.mjs; double-reporting it here
//     would inflate both counts for one defect.
//
// So the rule is narrowed three ways: the token must be DISTINCTIVE across the
// whole bank (a rare word, not "united" or "city"), it must be a full-word
// match rather than a prefix, and the option set must otherwise be homogeneous
// — if the correct option is the only MULTI-WORD option, or the only one of its
// kind, that is a different (and real) defect this audit deliberately leaves to
// a human.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { QB } = await import(join(ROOT, 'src/questions.js'));

// Words too common to be a tell. Built FROM THE BANK rather than hand-listed:
// a token carried by many questions is vocabulary, not a fingerprint.
const DOC_FREQ = new Map();
const norm = (s) => String(s || '')
  .toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9À-ɏ]+/g, ' ')
  .trim();
const tokens = (s) => norm(s).split(' ').filter(Boolean);

for (const q of QB) {
  if (!q?.q) continue;
  for (const t of new Set(tokens(q.q))) DOC_FREQ.set(t, (DOC_FREQ.get(t) || 0) + 1);
}

/** A token is distinctive if it is long enough and rare across the bank. */
const RARE_MAX = 25;          // appears in at most this many stems, bank-wide
const MIN_LEN = 5;
function distinctive(t) {
  if (t.length < MIN_LEN) return false;
  if (/^\d+$/.test(t)) return false;            // years belong to audit-stem-leaks
  return (DOC_FREQ.get(t) || 0) <= RARE_MAX;
}

/**
 * Flagged, hand-checked, and ruled NOT a giveaway — with the reason.
 *
 * ⚠️ This is not a way to go green. Every entry is a question where the shared
 * token is INHERENT: removing it would misquote someone, break the fact, or
 * produce a question that no longer makes sense. Twelve of the twenty the
 * detector found on its first run WERE removable and were rewritten; these
 * eight are the residue.
 */
export const RULED_NOT_GIVEAWAYS = {
  q_24d9f1: "The sign's wording necessarily contains 'Anfield' — every plausible alternative wording would too, so the shared token carries no information.",
  q_07122c: "Cruyff actually said 'playing simple football is the hardest thing there is' in answer to 'football is very simple, but…'. The repetition IS the quote; editing it would misquote him.",
  q_2b48d0: "The Ajax-side copy of the same Cruyff quote. Same ruling — the words are his.",
  q_0f56ca: "The question is precisely that Sandro and Valentino Mazzola were son and father. The shared surname is the subject, not a tell.",
  q_2c5790: "The stem must say the badge carries a red cross; the question is WHICH cross. Removing the word leaves nothing to ask about.",
  q_2a09cd: "The stem has to state that Fiorentina became purple; the legend explains how they became purple. Both halves need the colour.",
  q_ac9ab2: "Both clubs in the Steel City derby are named Sheffield. No phrasing of this question can avoid the token.",
  q_0ac3e1: "The ground is named after the club's own city. Any stem identifying the club shares a word with the answer by construction.",
};

export function findGiveawayDistractors(bank = QB) {
  const hits = [];
  for (const q of bank) {
    if (!q || q.type !== 'mcq' || !Array.isArray(q.o) || q.o.length < 3) continue;
    if (typeof q.a !== 'number' || !q.o[q.a]) continue;
    const stem = new Set(tokens(q.q));
    const correct = new Set(tokens(q.o[q.a]));
    const wrong = q.o.filter((_, i) => i !== q.a).map((o) => new Set(tokens(o)));

    // A token in the stem AND the answer AND in none of the distractors.
    const tells = [...correct].filter((t) => (
      stem.has(t) && distinctive(t) && wrong.every((w) => !w.has(t))
    ));
    if (!tells.length) continue;

    hits.push({
      id: q.id,
      cat: q.cat,
      diff: q.diff,
      club: q.club || null,
      q: q.q,
      answer: q.o[q.a],
      options: q.o,
      tells,
    });
  }
  return hits;
}

// ── self-test ────────────────────────────────────────────────────────────────
// ⚠️ A detector that has never been shown a known defect is a hypothesis. These
// run on every invocation: if the rule stops catching the thing it was written
// for, the audit fails loudly rather than reporting a clean zero.
function selfTest() {
  const planted = [{
    id: 'TEST_positive', type: 'mcq', cat: 'Transfers', diff: 'hard',
    q: 'Which club signed Adama Traoré from Wolverhampton Wanderers in 2023?',
    o: ['Fulham', 'Wolverhampton Wanderers B', 'Everton', 'Brentford'], a: 1,
  }];
  const caught = findGiveawayDistractors(planted);
  if (!caught.length) throw new Error('SELF-TEST FAILED: planted giveaway not detected');

  const clean = [{
    id: 'TEST_negative', type: 'mcq', cat: 'PL', diff: 'medium',
    q: 'Which club won the 2025-26 Premier League title?',
    o: ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea'], a: 1,
  }];
  if (findGiveawayDistractors(clean).length) {
    throw new Error('SELF-TEST FAILED: clean question reported as a giveaway');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  selfTest();
  const hits = findGiveawayDistractors();
  const quiet = process.argv.includes('--quiet');
  console.log(`[giveaway-distractors] scanned ${QB.length} questions · ${hits.length} flagged`);
  if (!quiet) {
    for (const h of hits) {
      console.log(`\n  ${h.id} [${h.cat}/${h.diff}]${h.club ? ` {${h.club}}` : ''}  tell: ${h.tells.join(', ')}`);
      console.log(`    Q: ${h.q}`);
      console.log(`    A: ${h.answer}`);
      console.log(`    options: ${h.options.join(' · ')}`);
    }
  }
  const unruled = hits.filter((h) => !RULED_NOT_GIVEAWAYS[h.id]);
  console.log(`[giveaway-distractors] ${unruled.length} unruled · ${hits.length - unruled.length} ruled-inherent`);
  if (process.argv.includes('--strict') && unruled.length) process.exit(1);
}
