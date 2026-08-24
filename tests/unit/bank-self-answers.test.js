import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';
import { findStemLeaks, findYearNarrowing, yearsIn, RULED_NOT_LEAKS } from '../../scripts/audit-stem-leaks.mjs';
import { findClubSelfAnswers } from '../../scripts/audit-club-self-answers.mjs';

/**
 * A question may never hand the player its own answer.
 *
 * ⚠️ ALEX'S LOUDEST BRIEF ITEM: the bank must be "spotless and not insult the
 * intellect of our users". Two shapes of insult are mechanically detectable, and
 * both had live instances until 2026-08-24:
 *
 *  1. THE STEM STATES THE ANSWER. "In which French city is Olympique de
 *     Marseille based?" — answerable with zero football knowledge. This is the
 *     class Alex already ruled on when he deleted the RB Leipzig / Red Bull
 *     question: it cannot be corrected, only replaced.
 *  2. THE ANSWER IS THE PACK YOU PICKED. "Which club won the most Bundesliga
 *     titles?" inside the Bayern pack is a free point with a badge on it —
 *     the player chose Bayern from a picker thirty seconds earlier.
 *
 * The report claimed 26 of the first and 15 of the second. Reproduced with
 * detectors written for this test, hand-checked: THREE of the first and 33 of
 * the second. Both original counts were inflated by naive string matching —
 * see the two audit scripts for the exact false-positive families, each pinned
 * by a self-test there.
 *
 * ⚠️ The second class was fixed by RE-HOMING, not deleting: "which club has won
 * the most Bundesliga titles" is a perfectly good League/Records question and is
 * only insulting inside the Bayern pack. Dropping the `club` field keeps every
 * question in the bank and removes it from the one draw where it gave itself
 * away. Bank size went 6782 → 6781, and the single deletion was the one stem
 * that cannot be repaired.
 */

describe('no question hands the player its own answer', () => {
  it('the detectors can still see the bank', () => {
    // ⚠️ A zero is only meaningful if the check ran. Both counts below would be
    // vacuously green against an empty or mis-shaped bank.
    expect(QB.length).toBeGreaterThan(6000);
    expect(QB.filter((q) => q?.club).length).toBeGreaterThan(3000);
  });

  it('no club-pack question answers with the pack you picked', () => {
    const hits = findClubSelfAnswers(QB);
    expect(
      hits.map((h) => `${h.id} [${h.club}] ${h.q.slice(0, 60)} => ${h.answer}`),
      '\n  A player who knows only which button they pressed can score on these.\n' +
      '  FIX: drop the `club` field so it leaves that pack but stays in the bank.\n' +
      '  ⚠️ Then also remove any TRANSLATED copy in scripts/seo/clubs-<locale>.mjs —\n' +
      '     the SEO build hard-fails on a translated question whose club changed.\n',
    ).toEqual([]);
  });

  it('no stem states its own answer, except ids ruled otherwise', () => {
    const unruled = findStemLeaks(QB)
      .filter((r) => r.verdict === 'CANDIDATE')
      .filter((r) => !RULED_NOT_LEAKS[r.id]);
    expect(
      unruled.map((r) => `${r.id} [${r.cat}] ${r.q.slice(0, 70)} => ${r.answer}`),
      '\n  The stem gives this away. Rewrite the clause that states it; delete only\n' +
      '  when the answer is inseparable from the subject (the RB Leipzig case).\n',
    ).toEqual([]);
  });

  it('no stem date quietly eliminates most of the options', () => {
    // ⚠️ PLAYER-REPORTED BY ALEX, and a hole in my own detector.
    //
    //   "Following the 1993 match-fixing scandal, Marseille were stripped of
    //    which season's Ligue 1 title?"  -> 1992-93
    //    options: 1990-91 · 1992-93 · 1988-89 · 1993-94
    //
    // Two of four options contain 1993, so the stem hands you a coin flip for
    // free — on a question graded HARD. His verdict: scrap it.
    //
    // findStemLeaks() could never have caught it: it SKIPS numeric answers, on
    // the reasoning that "how many goals … 106" legitimately repeats figures
    // from the stem. True for counts, false for dates — a year in a stem is not
    // vocabulary, it is a filter. The exclusion that made one class precise made
    // another invisible.
    const hits = findYearNarrowing(QB);
    expect(
      hits.map((h) => `${h.id} [${h.cat}/${h.diff}] ${h.survivors}/${h.of} survive — ${h.q.slice(0, 60)}`),
      '\n  A date in the stem eliminates half the options or more. Rewrite the\n' +
      '  stem to drop the date, or replace the distractors so it stops being a\n' +
      '  filter.\n',
    ).toEqual([]);
  });

  it('season notation is parsed, not grepped', () => {
    // "1993" does not appear in "1992-93", so a string match would have missed
    // the reported question entirely. The years have to be expanded.
    expect([...yearsIn('the 1993 scandal')]).toEqual([1993]);
    expect([...yearsIn('1992-93')].sort()).toEqual([1992, 1993]);
    expect([...yearsIn('1999-2000')].sort()).toEqual([1999, 2000]);
  });

  it('the ruled-not-leak list stays small and reasoned', () => {
    // It may shrink or gain a REASONED entry. It is not a way to go green.
    const entries = Object.entries(RULED_NOT_LEAKS);
    expect(entries.length).toBeLessThanOrEqual(5);
    for (const [id, reason] of entries) {
      expect(reason.length, `${id} needs a real reason, not a placeholder`).toBeGreaterThan(25);
    }
  });
});
