import { describe, it, expect } from 'vitest';
import { computeCard, overallScore, ratingFromScore, cardTier, BASELINE, AVG_MULT, PRIOR_WEIGHT, WEAK_PRIOR_WEIGHT, GOLD_MIN_ANSWERS } from '../../src/lib/ballIqCard.js';

/**
 * Two rating rules from 11 Nov 2026 (Alex, on a test guest rated 68 after
 * 0 out of 10: "they can not get 68 if they score that low").
 *  1. A record below the baseline is believed sooner (a four-answer prior);
 *     at or above it the twenty-answer prior stands, so a lucky start still
 *     cannot print a number it will slide from.
 *  2. Gold waits for fifty answers; the number is shown, the tier holds.
 */
// n answers of average difficulty, `right` of them correct, in one category.
const record = (right, n) => ({ PL: { s: right * AVG_MULT, n, d: { u: [right, n] } } });
const overall = (right, n) => ratingFromScore(overallScore(record(right, n)).mean);

describe('a weak start reads low', () => {
  it('0 out of 10 is in the fifties, not the high sixties', () => {
    expect(overall(0, 10)).toBeLessThanOrEqual(57);
    expect(overall(0, 10)).toBeGreaterThanOrEqual(52);
    expect(overall(2, 10)).toBeLessThanOrEqual(62);
    expect(overall(0, 20)).toBeLessThan(overall(0, 10));
  });
  it('a record at or above the baseline is untouched (the twenty-answer prior)', () => {
    for (const [r, n] of [[6, 10], [8, 10], [10, 10], [12, 20], [30, 50]]) {
      const old = ratingFromScore((r * AVG_MULT + BASELINE * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT));
      expect(overall(r, n), `${r}/${n}`).toBe(old);
    }
  });
  it('more right never reads lower (no jump where the two priors meet)', () => {
    for (const n of [10, 20, 50]) {
      let prev = -1;
      for (let r = 0; r <= n; r++) { const v = overall(r, n); expect(v, `${r}/${n}`).toBeGreaterThanOrEqual(prev); prev = v; }
    }
  });
  it('the weights are the ones written down', () => {
    expect(WEAK_PRIOR_WEIGHT).toBe(4);
    expect(PRIOR_WEIGHT).toBe(20);
  });
});

describe('gold waits for fifty answers', () => {
  it('a gold number on a short record holds at silver and says how far', () => {
    const c = computeCard(record(8, 10));
    expect(cardTier(c.overall)).toBe('gold');
    expect(c.tier).toBe('silver');
    expect(c.goldIn).toBe(GOLD_MIN_ANSWERS - 10);
  });
  it('the same level over fifty answers is gold, with nothing to wait for', () => {
    const c = computeCard(record(40, 50));
    expect(c.tier).toBe('gold');
    expect(c.goldIn).toBe(0);
  });
  it('silver and bronze numbers are never held, and bronze is reachable', () => {
    expect(computeCard(record(4, 10)).goldIn).toBe(0);
    const weak = computeCard(record(0, 10));
    expect(weak.tier).toBe('bronze');
    expect(weak.goldIn).toBe(0);
  });
});
