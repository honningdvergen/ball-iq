import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';
import { findDuplicatePairs, RULED_NOT_DUPLICATES, DUPLICATE_THRESHOLD } from '../../scripts/audit-duplicate-questions.mjs';

/**
 * The same fact must not be asked twice in almost the same words.
 *
 * ⚠️ THE REPORT FRAMED THIS AS A GRADING PROBLEM — "29 near-duplicate pairs
 * disagree with themselves about difficulty". Measuring it showed the grading
 * disagreement is the SYMPTOM. The pairs disagree because they are the same
 * question entered twice by different hands, one of whom said medium and the
 * other hard. Fixing the grades would have hidden the duplicates and left a
 * player able to meet both halves in one session.
 *
 * Two were verbatim, and the 2000 UEFA Cup final existed THREE times. Eleven
 * redundant copies were deleted (6749 → 6738).
 *
 * ⚠️ SURVIVOR SELECTION HAS TWO HARD RULES, both learned the painful way:
 *   1. Keep whichever copy the frozen Daily 7 log references. Deleting it
 *      rewrites a day players have already played.
 *   2. Keep whichever copy carries a TRANSLATION. The SEO build hard-fails on a
 *      translated question whose English source is gone — this actually fired
 *      on /tr/quiz/galatasaray and forced that pair's survivor to be swapped.
 *      The build caught it; I had not.
 */

describe('the bank does not ask the same question twice', () => {
  it('the detector can see the bank', () => {
    expect(QB.length).toBeGreaterThan(6000);
    expect(QB.filter((q) => q?.type === 'mcq').length).toBeGreaterThan(5000);
  });

  it('the detector still catches a verbatim duplicate', () => {
    // ⚠️ Without this, a broken similarity rule reports a clean bank forever.
    const planted = [
      { id: 'A', type: 'mcq', diff: 'hard', a: 1, o: ['30', '36'],
        q: 'Ciro Immobile won the European Golden Shoe in 2019-20 with how many Serie A goals?' },
      { id: 'B', type: 'mcq', diff: 'medium', a: 0, o: ['36', '30'],
        q: 'Ciro Immobile won the 2019-20 European Golden Shoe with how many Serie A goals?' },
    ];
    expect(findDuplicatePairs(planted).length).toBe(1);
  });

  it('two different questions sharing an answer are not duplicates', () => {
    // The counterweight: "Arsenal" answers hundreds of questions legitimately.
    const distinct = [
      { id: 'C', type: 'mcq', diff: 'easy', a: 0, o: ['Arsenal', 'Chelsea'],
        q: 'Which club won the 2025-26 Premier League title?' },
      { id: 'D', type: 'mcq', diff: 'easy', a: 0, o: ['Arsenal', 'Chelsea'],
        q: 'Which club won the 2026 FA Cup at Wembley?' },
    ];
    expect(findDuplicatePairs(distinct)).toEqual([]);
  });

  it('no UNRULED near-duplicate pair survives', () => {
    const unruled = findDuplicatePairs(QB).filter((p) => !RULED_NOT_DUPLICATES[p.key]);
    expect(
      unruled.map((p) => `${p.key} sim=${p.sim} [${p.a.diff}/${p.b.diff}] => ${p.answer}\n      A: ${p.a.q}\n      B: ${p.b.q}`),
      '\n  Delete the redundant copy. Keep whichever one the frozen Daily 7 log\n' +
      '  references, then whichever one carries a translation in\n' +
      '  scripts/seo/clubs-<locale>.mjs — deleting either breaks something that\n' +
      '  will not be obvious until the build fails or a player sees history change.\n',
    ).toEqual([]);
  });

  it('every ruled pair still exists and carries a real reason', () => {
    const ids = new Set(QB.map((q) => q?.id));
    for (const [key, reason] of Object.entries(RULED_NOT_DUPLICATES)) {
      expect(reason.length, `${key} needs a real reason`).toBeGreaterThan(60);
      for (const id of key.split('|')) {
        expect(ids.has(id), `${key}: ${id} is ruled but no longer in the bank`).toBe(true);
      }
    }
  });

  it('the threshold has not been quietly relaxed to pass', () => {
    // Raising it is the easy way to make this test green while the duplicates
    // stay. 0.8 is where hand-checking found the boundary between "same
    // question" and "same fact, different question".
    expect(DUPLICATE_THRESHOLD).toBeLessThanOrEqual(0.8);
  });
});
