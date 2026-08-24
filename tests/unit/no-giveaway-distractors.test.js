import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';
import { findGiveawayDistractors, RULED_NOT_GIVEAWAYS } from '../../scripts/audit-giveaway-distractors.mjs';

/**
 * A question you can answer by matching words is not a football question.
 *
 * The shape: a distinctive word sits in the stem AND in the correct option and
 * in none of the wrong ones. "Which club is Feyenoord's local rival in the
 * ROTTERDAM derby?" with "Sparta ROTTERDAM" on the list. The answer key is
 * right, every option is a real club, and someone who has never watched a match
 * scores it every time. That is the "insults the intellect of our users" class
 * Alex cares most about, and no per-question fact-check can see it — each
 * option is individually fine; the defect is the RELATIONSHIP.
 *
 * ⚠️ THE REPORT SAID 26. The detector found 20, and hand-checking split them
 * almost down the middle: TWELVE were real and removable, EIGHT are inherent.
 * Same pattern as the two earlier bank claims (26 stem leaks → 3 real; 15 club
 * self-answers → 33 real). Counts in the report are a starting hypothesis.
 *
 * The twelve were fixed by deleting the tell, never the question: the nickname
 * "King Arturo" left the stem for Arturo Vidal, "Rotterdam derby" became "local
 * city rival", the "Batman and Robben" pun came out of the Robben question, and
 * the Superga crash stopped naming Superga. Answers unchanged in all twelve.
 */

describe('no question can be answered by matching words', () => {
  it('the detector can see the bank', () => {
    // ⚠️ A zero is meaningless if the scan ran on nothing.
    expect(QB.length).toBeGreaterThan(6000);
    expect(QB.filter((q) => q?.type === 'mcq').length).toBeGreaterThan(5000);
  });

  it('the detector still catches a planted giveaway', () => {
    // The script self-tests on import path too, but pin it here so the rule
    // cannot quietly stop working and report a clean bank.
    const planted = [{
      id: 'PLANT', type: 'mcq', cat: 'Transfers', diff: 'hard',
      q: "Which club is Feyenoord's local rival in the Rotterdam derby?",
      o: ['Sparta Rotterdam', 'Vitesse', 'Ajax', 'PSV Eindhoven'], a: 0,
    }];
    expect(findGiveawayDistractors(planted).length).toBe(1);
  });

  it('does not flag a clean question', () => {
    const clean = [{
      id: 'CLEAN', type: 'mcq', cat: 'PL', diff: 'medium',
      q: 'Which club won the 2025-26 Premier League title?',
      o: ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea'], a: 1,
    }];
    expect(findGiveawayDistractors(clean)).toEqual([]);
  });

  it('no UNRULED giveaway survives in the bank', () => {
    const unruled = findGiveawayDistractors(QB).filter((h) => !RULED_NOT_GIVEAWAYS[h.id]);
    expect(
      unruled.map((h) => `${h.id} [${h.cat}] tell:${h.tells.join('/')} — ${h.q.slice(0, 60)} => ${h.answer}`),
      '\n  Delete the TELL, not the question: reword the stem so the shared word\n' +
      '  is gone, or rephrase the option. The answer must not change.\n' +
      '  If the token is genuinely inseparable from the fact, add a REASONED\n' +
      '  entry to RULED_NOT_GIVEAWAYS.\n',
    ).toEqual([]);
  });

  it('the ruled list stays small and every entry carries a real reason', () => {
    // It is not a way to go green.
    const entries = Object.entries(RULED_NOT_GIVEAWAYS);
    expect(entries.length).toBeLessThanOrEqual(12);
    for (const [id, reason] of entries) {
      expect(reason.length, `${id} needs a real reason, not a placeholder`).toBeGreaterThan(40);
      expect(QB.some((q) => q?.id === id), `${id} is ruled but no longer in the bank`).toBe(true);
    }
  });
});
