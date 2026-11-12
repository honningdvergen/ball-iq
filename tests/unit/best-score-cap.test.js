import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * "Best score" is out of ten (10 Nov 2026, simulator walk: a friend's profile
 * read "Best score 11/10"). Survival's score is the length of the run, and it
 * was counted as a quiz score. Survival no longer counts, the stored value is
 * capped on the next save, and the friend tile never prints more than ten.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');

describe('best score is out of ten', () => {
  it('a Survival run does not count, and the saved value is capped', () => {
    expect(read('../../src/App.jsx')).toContain('bestScore: Math.min(10, (isSpecialMode || mode === "survival") ? (stats.bestScore || 0) : Math.max(stats.bestScore || 0, newResult.score)),');
  });
  it('a friend\'s tile never shows more than ten', () => {
    expect(read('../../src/screens/ProfileScreen.jsx')).toContain('{Math.min(10, friendStats.bestScore||0)}<span');
  });
});
