import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Never ask a player to rate the app right after it made them feel stupid —
 * and never let the funnel claim we asked when we did not.
 *
 * ⚠️ THE BOARD LISTED "timeout" AND "wrong-answer streak" AS TWO UNREGISTERED
 * BAD-MOMENT CLASSES. They are one thing (a stretch where the player was
 * losing), and taken literally they are a trap: a single timeout is ordinary
 * play, so marking every one would suppress the ask broadly enough to undo the
 * rating funnel it is meant to protect.
 *
 * Thresholds were picked from prod, not intuition (60 days):
 *   · Daily 7 ends at 2/7 or worse on 20.5% of plays (70 of 341)
 *   · 10-question quizzes end at 3/10 or worse on 8.3% (25 of 301)
 *   · ~48% of Survival runs end on the FIRST question — which is the mode
 *     working as designed, hence the exclusion.
 * For scale: the Footle-loss mark already shipping fires on 38% of days Footle
 * is played, so this rule is the more conservative of the two.
 *
 * ⚠️ AND THE INSTRUMENT ITSELF WAS LYING. `maybeRequestReview()` returns false
 * in silence when the ask is suppressed, but both native call sites logged
 * `rate-prompt-shown` BEFORE calling it — so every ask killed by a bad moment,
 * a cooldown or the lifetime cap was recorded as shown. The suppression levers
 * added all week are precisely what would have inflated that number: the
 * funnel would have looked healthiest exactly where it was most wrong.
 */

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
const REVIEW = readFileSync(fileURLToPath(new URL('../../src/lib/review.js', import.meta.url)), 'utf8');

/** Re-implements the shipped predicate so the thresholds can be exercised. */
function bruising({ answers = [], score, total, mode = 'classic' }) {
  let run = 0, worst = 0, timeouts = 0;
  for (const a of answers) {
    if (a?.isCorrect) { run = 0; continue; }
    run += 1;
    if (run > worst) worst = run;
    if (a?.timedOut) timeouts += 1;
  }
  const ratio = total >= 5 ? score / total : null;
  return mode !== 'survival' && (worst >= 4 || timeouts >= 3 || (ratio !== null && ratio <= 0.3));
}

const ok = (n) => Array.from({ length: n }, () => ({ isCorrect: true }));
const miss = (n, timedOut = false) => Array.from({ length: n }, () => ({ isCorrect: false, timedOut }));

describe('a bruising session suppresses the rating ask', () => {
  it('the predicate ships, with all three arms', () => {
    expect(APP).toMatch(/const bruising = mode !== "survival"/);
    expect(APP).toMatch(/worstMissRun >= 4/);
    expect(APP).toMatch(/timeouts >= 3/);
    expect(APP).toMatch(/ratio <= 0\.3/);
    expect(APP, 'a bruising session must actually mark one').toMatch(
      /if \(bruising\) \{\s*try \{ markBadReviewMoment\(\); \} catch \{\}/,
    );
  });

  it('marks the sessions that actually hurt', () => {
    expect(bruising({ answers: [...miss(4), ...ok(3)], score: 3, total: 7 }), 'four misses in a row').toBe(true);
    expect(bruising({ answers: [...miss(3, true), ...ok(7)], score: 7, total: 10 }), 'three timeouts').toBe(true);
    expect(bruising({ answers: [...ok(2), ...miss(5)], score: 2, total: 7 }), '2/7 — the 20.5% case').toBe(true);
    expect(bruising({ answers: [...ok(3), ...miss(7)], score: 3, total: 10 }), '3/10 — the 8.3% case').toBe(true);
  });

  it('leaves ordinary play alone', () => {
    // ⚠️ The half that protects the funnel. Over-marking is the failure mode
    // that looks like caution and quietly disables the ask.
    expect(bruising({ answers: [...ok(5), ...miss(2)], score: 5, total: 7 }), '5/7 is a good game').toBe(false);
    expect(bruising({ answers: [...ok(6), { isCorrect: false, timedOut: true }], score: 6, total: 7 }), 'one timeout is normal').toBe(false);
    expect(bruising({ answers: [...miss(3), ...ok(4)], score: 4, total: 7 }), 'a rough start, recovered').toBe(false);
    expect(bruising({ answers: [...ok(4), ...miss(3)], score: 4, total: 7 }), 'a rough finish').toBe(false);
  });

  it('never marks Survival, where dying IS the design', () => {
    // ~48% of Survival runs end on question one. Marking those would suppress
    // the ask for half that mode's players over a mode behaving correctly.
    expect(bruising({ answers: miss(1), score: 0, total: 1, mode: 'survival' })).toBe(false);
    expect(bruising({ answers: [...ok(1), ...miss(1)], score: 1, total: 2, mode: 'survival' })).toBe(false);
    // …and a 0/1 outside Survival is still not marked: total < 5 has no ratio.
    expect(bruising({ answers: miss(1), score: 0, total: 1 })).toBe(false);
  });

  it('the ask policy has exactly one implementation', () => {
    // Two copies of the thresholds would drift, and the drift would be silent.
    expect(REVIEW).toMatch(/export function nativeAskBlockedReason\(\)/);
    const fn = REVIEW.slice(REVIEW.indexOf('export async function maybeRequestReview'));
    expect(fn, 'maybeRequestReview must delegate, not re-check').toMatch(/if \(nativeAskBlockedReason\(\)\) return false;/);
    const body = fn.slice(0, fn.indexOf('\n}'));
    expect(body, 'a second copy of the bad-moment check has appeared').not.toMatch(/BAD_MOMENT_COOLDOWN_H/);
    expect(body, 'a second copy of the lifetime cap has appeared').not.toMatch(/MAX_LIFETIME/);
  });

  it('the funnel cannot record an ask that was suppressed', () => {
    // ⚠️ Every "rate-prompt-shown" must be preceded by the policy check, or the
    // number counts suppressed asks as real ones.
    const shows = [...APP.matchAll(/loopEvent\("rate-prompt-shown", \{ engine: "native"/g)];
    expect(shows.length, 'both native ask sites should still be instrumented').toBe(2);
    for (const m of shows) {
      const before = APP.slice(Math.max(0, m.index - 400), m.index);
      expect(
        before,
        '\n  A "shown" logged before nativeAskBlockedReason() counts suppressed\n' +
        '  asks as real ones — and the bad-moment levers are what inflate it.\n',
      ).toMatch(/const blocked = nativeAskBlockedReason\(\);/);
    }
  });

  it('read-only: asking why must not spend the budget', () => {
    const fn = REVIEW.slice(
      REVIEW.indexOf('export function nativeAskBlockedReason'),
      REVIEW.indexOf('export async function maybeRequestReview'),
    );
    // ⚠️ Case-insensitive: `safeSetItem` (the wrapper used elsewhere in this
    // codebase) does not contain lowercase "setItem", so a strict /setItem/
    // would miss a real write. That exact hole made a sibling guard useless.
    expect(fn, 'the reason check must never write to storage').not.toMatch(/setitem/i);
  });
});
