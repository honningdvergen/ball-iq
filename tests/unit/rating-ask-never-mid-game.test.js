import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * A rating ask must never land on a live question.
 *
 * ⚠️ Scouting report #4: the prompt "can land on top of a live game and block
 * every control while the clock runs — and on iOS its twin spends one of
 * Apple's ~3-per-year review tickets, possibly mid-question, on a build where
 * the ratings engine reaches iPhone for the FIRST time."
 *
 * The ask is SCHEDULED at a celebration and FIRES up to 3.5s later. Finish a
 * Classic round, tap straight into another game, and the timer queued on the
 * results screen fires over question 1 of the next one. With only 8 ratings on
 * file, one prompt that costs somebody a round is a meaningful fraction of the
 * store page.
 *
 * ⚠️ AND THE OBVIOUS FIX IS A TRAP. The panel recommended clearing
 * `celebrationTimeoutsRef` from a screen-keyed effect; the critic traced it and
 * found `setScreen("results")` is the LAST statement of handleComplete, inside
 * the same synchronous callback that pushes every celebration timer — so a
 * screen-keyed effect would clear the timers just queued and silently delete
 * the app's entire celebration layer (streak toasts, confetti, perfect-round).
 * Both halves are pinned below: the ask is gated, and the timers are NOT.
 */

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

/** Every `setTimeout(() => { … }, n)` body in App.jsx, as source text. */
function scheduledBodies(src) {
  return [...src.matchAll(/setTimeout\(\(\) => \{([\s\S]{0,400}?)\}, \d+\)/g)].map((m) => m[1]);
}

describe('the rating ask cannot interrupt a live question', () => {
  const bodies = scheduledBodies(APP);

  it('finds the scheduled callbacks at all', () => {
    // ⚠️ A zero here would make every assertion below vacuously true — the
    // exact shape of blind guard this project has shipped before.
    expect(bodies.length).toBeGreaterThan(5);
  });

  it('every scheduled rating ask is gated on the current screen', () => {
    // Mutation check: removing any one `if (!ratingAskAllowed()) return;` fails.
    const asks = bodies.filter((b) => /maybeRequestReview\(\)|setShowRatePrompt\(true\)/.test(b));
    expect(asks.length, 'there should be four scheduled asks').toBeGreaterThanOrEqual(4);
    const ungated = asks.filter((b) => !/ratingAskAllowed\(\)/.test(b));
    expect(
      ungated.map((b) => b.trim().slice(0, 90)),
      '\n  A rating ask scheduled without a screen gate can fire over a live\n' +
      '  question and block every control while the clock runs.\n',
    ).toEqual([]);
  });

  it('the blocked list covers the timed quiz screen', () => {
    const m = APP.match(/const RATING_ASK_BLOCKED = new Set\(\[([^\]]*)\]\)/);
    expect(m, 'RATING_ASK_BLOCKED must exist').toBeTruthy();
    expect(m[1]).toMatch(/"quiz"/);
  });

  it('the screen is read at FIRE time, not captured at schedule time', () => {
    // State would be captured stale by the scheduled closure — which is exactly
    // the screen we are trying to detect leaving. Must be a ref.
    expect(/const screenRef = useRef\(screen\);/.test(APP)).toBe(true);
    expect(/screenRef\.current = screen;/.test(APP)).toBe(true);
    expect(/RATING_ASK_BLOCKED\.has\(screenRef\.current\)/.test(APP)).toBe(true);
  });

  it('celebration timers are cleared ONLY on unmount, never on a screen change', () => {
    // ⚠️ This is the guard against the fix the critic killed. If someone adds a
    // screen-keyed effect that clears these, the celebration layer dies.
    const all = APP.match(/celebrationTimeoutsRef\.current\.forEach\(clearTimeout\)/g) || [];
    expect(all.length, 'there must be exactly one place that clears these timers').toBe(1);
    const idx = APP.indexOf('celebrationTimeoutsRef.current.forEach(clearTimeout)');
    // …and its effect must have an empty dependency array (unmount only)
    const after = APP.slice(idx, idx + 200);
    expect(
      /\}, \[\]\);/.test(after),
      'the clearing effect must be unmount-only (`}, []);`). A screen-keyed\n' +
      'dependency array would clear the timers handleComplete just queued.',
    ).toBe(true);
  });
});
