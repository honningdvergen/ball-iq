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
 * Withheld rather than deleted, on purpose — and that turned out to be right.
 * Alex then reviewed all 89 individually and kept 55 of them: a blanket delete
 * would have binned every one. Verified before applying his ruling that none of
 * the 89 appear in the frozen Daily 7 log, so the 31 rejections could not
 * rewrite a day someone had already played.
 */

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
// The local pass & play engine draws from the bank too — it left App.jsx on
// 2026-09-06 (E16). The doors are counted across both files.
const LOCAL = readFileSync(fileURLToPath(new URL('../../src/screens/LocalPlay.jsx', import.meta.url)), 'utf8');
const DRAW_SOURCES = APP + '\n' + LOCAL;

describe('a retired pack reaches nobody', () => {
  it('the tile is gone', () => {
    expect(TOPICAL_PACK).toBeNull();
  });

  it('the withheld set still names the pack', () => {
    expect(RETIRED_TAGS.has('summer2026')).toBe(true);
  });

  it('only the questions Alex HELD are still withheld', () => {
    // ⚠️ 2026-08-24, second pass: Alex reviewed all 89 one by one and ruled
    // 55 approve · 31 reject · 3 hold. So the blanket withhold is over —
    // the approved 55 lost their tag and are back in Classic, league and club
    // draws, the 31 are deleted from the bank, and exactly three remain
    // withheld pending his editorial call.
    //
    // The MODE stays retired regardless (TOPICAL_PACK is null above): his
    // objection was to a pack about the last few weeks, not to these facts
    // appearing among ordinary questions.
    const tagged = QB.filter((q) => q?.tag === 'summer2026').map((q) => q.id).sort();
    expect(tagged).toEqual(['q_s26s06', 'q_s26w13', 'q_s26x04']);
  });

  it('the approved questions really did come back', () => {
    // A withhold that was "lifted" by deleting the rows instead of untagging
    // them would satisfy the assertion above and quietly bin 55 good questions.
    const returned = QB.filter((q) => /^q_s26/.test(q?.id || '') && !q.tag);
    expect(returned.length).toBe(55);
    // …and they are drawable: real cat, MCQ, four options.
    for (const q of returned) {
      expect(q.type, `${q.id} must be drawable`).toBe('mcq');
      expect(Array.isArray(q.o) && q.o.length >= 2, `${q.id} needs options`).toBe(true);
      expect(q.cat, `${q.id} needs a category`).toBeTruthy();
    }
  });

  it('the rejected 31 are gone, not merely hidden', () => {
    const REJECTED = ['q_s26a06', 'q_s26s08', 'q_s26x18', 'q_s26b02', 'q_s26s20', 'q_s26b01',
      'q_s26s19', 'q_s26s24', 'q_s26s01', 'q_s26s17', 'q_s26a04', 'q_s26a05', 'q_s26x05',
      'q_s26x06', 'q_s26x08', 'q_s26b03', 'q_s26t07', 'q_s26x02', 'q_s26x03', 'q_s26x10',
      'q_s26x12', 'q_s26x13', 'q_s26x17', 'q_s26x09', 'q_s26s03', 'q_s26w01', 'q_s26w11',
      'q_s26w24', 'q_s26w19', 'q_s26w20', 'q_s26w21'];
    expect(REJECTED.length).toBe(31);
    const ids = new Set(QB.map((q) => q?.id));
    expect(REJECTED.filter((id) => ids.has(id))).toEqual([]);
  });

  it('EVERY direct bank draw withholds retired tags', () => {
    // ⚠️ The load-bearing one. Each `QB.filter(` in App.jsx or LocalPlay.jsx is a door into the
    // bank; every one must apply the withhold within its own filter (or on the
    // line immediately after, which is how getQs does it).
    const draws = [...DRAW_SOURCES.matchAll(/QB\.filter\(/g)];
    expect(draws.length, 'App.jsx + LocalPlay.jsx should still draw from the bank').toBeGreaterThanOrEqual(5);
    const unguarded = [];
    for (const m of draws) {
      const window = DRAW_SOURCES.slice(m.index, m.index + 500);
      if (!/RETIRED_TAGS\.has\(q\.tag\)/.test(window)) {
        unguarded.push(DRAW_SOURCES.slice(m.index, m.index + 90).replace(/\s+/g, ' '));
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
