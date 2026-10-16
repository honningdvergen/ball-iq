// The one sentence about everyone else on a daily finish (16 Oct 2026): a tie
// is a tie, never counted as a loss, and a loss is never rubbed in.
import { describe, it, expect } from 'vitest';
import { comparisonLine, summariseDistribution } from '../../src/lib/dailyResults.js';

const line = (pairs, opts) => comparisonLine(pairs, pairs.reduce((s, [, c]) => s + c, 0), opts);

describe('comparisonLine', () => {
  it('a Trail solved like most players reads as a match, not "you beat 10%"', () => {
    expect(line([[2, 10], [3, 61], [4, 20], [0, 9]], { outOf: null, mine: 3, won: true })).toBe('Same as 61% of players');
  });
  it('nobody better: only N% matched you, or nobody did better when alone', () => {
    expect(line([[2, 5], [3, 30], [4, 40], [0, 25]], { outOf: null, mine: 2, won: true })).toBe('Only 5% matched you');
    expect(line([[2, 1], [3, 30], [0, 69]], { outOf: null, mine: 2, won: true })).toBe('Nobody did better');
  });
  it('a strong score reads as Top P%, the share who did as well or better', () => {
    expect(line([[10, 5], [9, 10], [5, 50], [3, 35]], { outOf: 10, mine: 9, won: true })).toBe('Top 15%');
  });
  it('a low score says what is true, and nothing when nothing is', () => {
    expect(line([[0, 4], [1, 13], [2, 26], [3, 29], [4, 17], [5, 6], [6, 5]], { outOf: 7, mine: 2, won: false })).toBe('Better than 17%');
    expect(line([[0, 10], [3, 90]], { outOf: 10, mine: 0, won: false })).toBe(null);
  });
  it('a loss in a guess game gets no comparison', () => {
    expect(line([[3, 50], [0, 50]], { outOf: null, mine: 0, won: false })).toBe(null);
  });
  it('summariseDistribution carries the line', () => {
    const s = summariseDistribution({ n: 100, won: 91, buckets: { 2: 10, 3: 61, 4: 20, 0: 9 } }, { game: 'trail', mine: 3, won: true });
    expect(s.line).toBe('Same as 61% of players');
  });
});
