import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The rating funnel must be measurable, and must not spend its budget on
 * nothing.
 *
 * ⚠️ Alex asked to "follow the data". On this loop there was none: the rating
 * prompt had ZERO loopEvents while the notification prompt — a strictly less
 * valuable loop — had five. We could not say how many asks had fired since the
 * engine landed, how many players tapped "Loving it", or how many reached a
 * store. That matters more than usual right now because 1.7.0 is the first iOS
 * build where the ratings engine exists AT ALL.
 *
 * ⚠️ AND THE BUDGET LEAKED. markWebRatePromptShown() ran where the ask was
 * SCHEDULED, 3.5s before anything rendered — a reviewer reproduced the loss by
 * solving Footle and reloading at 1s, watching the counter increment with no
 * sheet ever shown. The web budget is THREE asks in a lifetime, 60 days apart,
 * so each silent burn costs a third of it. My own screen-change gate had made
 * this worse by adding a second path that returns without rendering.
 */

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
const BOUNDARY = read('../../src/components/ErrorBoundary.jsx');
const REVIEW = read('../../src/lib/review.js');

describe('the rating funnel is measurable end to end', () => {
  it('every stage of the funnel emits an event', () => {
    // Mirrors the notif-prompt-* pattern verbatim, which is the one loop in the
    // app that can already be reasoned about from data.
    for (const evt of [
      'rate-prompt-shown',      // the ask actually rendered
      'rate-prompt-skipped',    // eligible, then suppressed before render
      'rate-prompt-loving',     // the sentiment split
      'rate-prompt-not-really',
      'rate-store-tap',         // reached a real store
      'rate-store-unreachable', // desktop: reached a toast, NOT a store
      'rate-prompt-dismissed',
    ]) {
      expect(APP.includes(`loopEvent("${evt}"`), `missing funnel event: ${evt}`).toBe(true);
    }
  });

  it('a desktop tap-through is not counted as reaching a store', () => {
    // Grouping it with the real taps would inflate the only conversion number
    // this funnel produces.
    expect(/loopEvent\("rate-store-unreachable", \{ store: "none" \}\)/.test(APP)).toBe(true);
  });

  it('the budget is spent where the sheet renders, never where it is scheduled', () => {
    // ⚠️ The load-bearing assertion. Every markWebRatePromptShown() call must
    // sit AFTER a ratingAskAllowed() gate — i.e. inside the timeout body, on
    // the path that actually shows the sheet.
    const calls = [...APP.matchAll(/markWebRatePromptShown\(\);/g)];
    expect(calls.length, 'both web ask sites should still exist').toBe(2);
    for (const m of calls) {
      const before = APP.slice(Math.max(0, m.index - 400), m.index);
      // ⚠️ Two separate conditions, not one regex spanning them. The first
      // version used `\{[^}]*return; \}` and failed on correct code, because
      // the gate's own meta object — { reason: "screen-changed", … } — contains
      // the closing brace the character class was told to exclude.
      expect(
        /if \(!ratingAskAllowed\(\)\)/.test(before) && /return; \}/.test(before),
        '\n  markWebRatePromptShown() must run only after the screen gate, inside\n' +
        '  the timeout. Spending it at schedule time burns one of THREE lifetime\n' +
        '  asks without ever showing the sheet.\n',
      ).toBe(true);
    }
  });

  it('a white screen suppresses the ask', () => {
    // TabErrorBoundary always did this; the ROOT boundary — the one that
    // white-screens the whole app, and also wraps the marketing tree and
    // AuthProvider — did not. A player could crash, restart, finish a game and
    // be asked "Enjoying Ball IQ?" inside the window built to prevent exactly
    // that.
    expect(/import \{ markBadReviewMoment \} from "\.\.\/lib\/review\.js";/.test(BOUNDARY)).toBe(true);
    const caught = BOUNDARY.slice(BOUNDARY.indexOf('componentDidCatch'));
    expect(/markBadReviewMoment\(\)/.test(caught.slice(0, 900))).toBe(true);
  });

  it('"too easy" does not mute our most engaged players', () => {
    // 16 of 30 reports carrying a pick came from someone who answered
    // CORRECTLY. "Too easy — gives itself away" is a five-star candidate
    // telling us the bank is beneath them, not a complaint.
    expect(/export function clearBadReviewMoment/.test(REVIEW)).toBe(true);
    expect(/if \(reason === 'too-easy'\) clearBadReviewMoment\(\);/.test(APP)).toBe(true);
    // ⚠️ And the mark must STILL happen up front for every other reason — the
    // panel's "gate the mark on reason" version would have disabled suppression
    // for skip and backdrop dismiss, where reason is null.
    const rq = APP.slice(APP.indexOf('const reportQuestion = useCallback'));
    expect(/markBadReviewMoment\(\);/.test(rq.slice(0, 900)),
      'reportQuestion must still mark unconditionally on tap').toBe(true);
  });

  it('the reason key matches the sheet that produces it', () => {
    // A gate keyed on a string the UI never emits is a no-op that looks fixed.
    expect(/\["too-easy", Moon/.test(APP), 'the sheet must still emit "too-easy"').toBe(true);
  });
});
