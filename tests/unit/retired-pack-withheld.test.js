import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { QB } from '../../src/questions.js';
import { TOPICAL_PACK, RETIRED_TAGS } from '../../src/lib/quiz.js';

/**
 * A retired pack must reach nobody, through any door.
 *
 * ⚠️ ALEX RETIRED SUMMER 2026 ON 2026-08-24, after playing it: "the questions
 * are factually correct and all but it is such a bad mode… like 40% of the
 * questions there have really disappointed me."
 *
 * Nulling TOPICAL_PACK removes the TILE. It does not remove the questions —
 * all 89 carry a real `cat` (Transfers 33, WorldCup 22, Managers 11, PL 8…)
 * and 26 still carry a `club`, so without a withhold they keep arriving in
 * Classic, in league quizzes, in club packs and in pass-and-play. The tile
 * would be gone and the disappointing questions would not be.
 *
 * ⚠️ AND THERE ARE FIVE DRAW PATHS, NOT ONE. getQs is only the general one;
 * club packs, league quizzes, pass-and-play and the MCQ fallback each filter
 * the bank DIRECTLY. Fixing getQs alone would have looked complete and changed
 * almost nothing — the exact "second implementation" habit this project has
 * been caught by repeatedly. This test exists to catch the SIXTH path.
 *
 * Withheld rather than deleted on purpose: none of the 89 are in the frozen
 * Daily 7 log, so deletion would be safe, but 89 rows is a large editorial call
 * and some fraction are fine. This makes them inert and fully recoverable.
 */

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

describe('a retired pack reaches nobody', () => {
  it('the tile is gone', () => {
    expect(TOPICAL_PACK).toBeNull();
  });

  it('the withheld set still names the pack', () => {
    expect(RETIRED_TAGS.has('summer2026')).toBe(true);
  });

  it('the questions are still IN the bank, just inert', () => {
    // Recoverable by deleting one string. If someone later decides to delete
    // them for real, this is the assertion to change deliberately.
    const tagged = QB.filter((q) => q?.tag === 'summer2026');
    expect(tagged.length).toBeGreaterThan(50);
  });

  it('EVERY direct bank draw withholds retired tags', () => {
    // ⚠️ The load-bearing one. Each `QB.filter(` in App.jsx is a door into the
    // bank; every one must apply the withhold within its own filter (or on the
    // line immediately after, which is how getQs does it).
    const draws = [...APP.matchAll(/QB\.filter\(/g)];
    expect(draws.length, 'App.jsx should still draw from the bank').toBeGreaterThanOrEqual(5);
    const unguarded = [];
    for (const m of draws) {
      const window = APP.slice(m.index, m.index + 500);
      if (!/RETIRED_TAGS\.has\(q\.tag\)/.test(window)) {
        unguarded.push(APP.slice(m.index, m.index + 90).replace(/\s+/g, ' '));
      }
    }
    expect(
      unguarded,
      '\n  A draw path that does not withhold retired tags will serve the pack\n' +
      '  Alex retired. There are five doors into the bank, not one.\n',
    ).toEqual([]);
  });

  it('no retired question can survive the withhold predicate', () => {
    // The predicate every door uses, applied to the real bank.
    const survives = (q) => !q.tag || !RETIRED_TAGS.has(q.tag);
    const leaked = QB.filter((q) => q?.tag === 'summer2026').filter(survives);
    expect(leaked.length, 'the predicate itself must exclude every retired row').toBe(0);
    // …and it must not be so broad that it eats the rest of the bank.
    const untagged = QB.filter((q) => q && !q.tag).filter(survives);
    expect(untagged.length, 'untagged questions must all survive').toBe(QB.filter((q) => q && !q.tag).length);
  });
});
