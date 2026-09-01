import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The pre-boot shell must honour the BUTTON THE PLAYER PRESSED, not just record it.
 *
 * ⚠️ WHAT THIS CAUGHT (2026-09-01, found by audit + confirmed by reading source):
 * The onboarding change shipped that morning hands an answered sample straight
 * into Footle, because "the momentum died on a menu". It worked on the React
 * path (`next` → `persistAndFinish(sampleAnswered !== null)`) and silently did
 * NOT work on the pre-boot replay path, which called `persistAndFinish()` bare.
 *
 * That is not a loud failure. `persistAndFinish(startGame)` ends with
 * `onDone?.(startGame === true)`; a bare call passes `undefined`,
 * `undefined === true` is `false`, and the player lands on Home — the exact
 * fourteen-choice menu the change existed to bypass. Everything else about the
 * path was correct: the shell recorded `{opt, act}` faithfully and
 * `sampleAnswered` was seeded from it. One missing argument.
 *
 * The cohort it hit is the one the shell was BUILT for: anyone quick enough to
 * tap before GameRoot arrives — a ~0.9s window on 4G, ~8.6s on Slow 3G.
 *
 * The sibling gate (preboot-shell-matches-onboarding) pins the shell's COPY and
 * that every button is wired. Nothing pinned what the replay then DOES, which
 * is why this shipped. Source-text assertions rather than a render harness,
 * matching the sibling gate's approach — App.jsx is a ~10k-line monolith and
 * mounting AppInner in jsdom is not a cheap test.
 */

const APP = readFileSync(
  fileURLToPath(new URL('../../src/App.jsx', import.meta.url)),
  'utf8',
);

describe('pre-boot replay honours the pressed button', () => {
  it('passes an explicit startGame argument — never a bare call', () => {
    // The replay effect, located by its guard rather than by line number.
    const effect = APP.match(
      /if \(!prebootRef\.current\?\.act \|\| prebootActReplayed\) return;[\s\S]{0,400}?\n\s*\}, \[\]\);/,
    );
    expect(effect, 'pre-boot replay effect not found — did the guard change?').toBeTruthy();

    const body = effect[0];
    expect(
      /persistAndFinish\(\s*\)/.test(body),
      'persistAndFinish() called with NO argument: undefined === true is false, '
        + 'so the shell path lands on Home and the Footle handoff never fires.',
    ).toBe(false);

    // It must decide from the recorded act AND whether the sample was answered,
    // mirroring `next`/`skip` — act:'skip' must not start a game.
    expect(body).toMatch(/persistAndFinish\([^)]*prebootRef\.current\.act === ['"]start['"]/);
    expect(body).toMatch(/persistAndFinish\([^)]*sampleAnswered !== null/);
  });

  it('still ends on onDone(startGame === true), which is what makes the argument load-bearing', () => {
    // If this contract ever changes, the assertion above stops meaning anything.
    expect(APP).toMatch(/const persistAndFinish = \(startGame\) =>/);
    expect(APP).toMatch(/onDone\?\.\(startGame === true\)/);
  });

  it('the React path and the replay path agree on what "start the game" means', () => {
    // `next` is the reference implementation; the replay must not drift from it.
    expect(APP).toMatch(/persistAndFinish\(sampleAnswered !== null\)/);
    expect(APP).toMatch(/persistAndFinish\(false\)/); // skip stays false
  });
});
