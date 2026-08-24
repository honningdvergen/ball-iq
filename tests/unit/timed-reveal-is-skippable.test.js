import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * An answer reveal is a CEILING, never a minimum.
 *
 * ⚠️ Scouting report #4 measured Hot Streak's wrong-answer reveal at 1,825ms and
 * 1,820ms with the 60-second clock running straight through it (39 → 38 → 37),
 * and confirmed that card tap, body click, Enter and Space ALL failed to
 * advance. Roughly 45% of the clock, in the one mode whose entire identity is
 * speed — and Hot Streak has the worst repeat rate of any core mode, 1.75
 * plays/user against Survival's 6.6.
 *
 * The hold itself is right: a miss should teach you something, and the
 * explanation is the product's differentiator. What was wrong is that it was
 * COMPULSORY.
 *
 * ⚠️ Deliberately NOT shortened and NOT clock-paused. Shortening takes the
 * explanation from the player who wanted it; pausing the clock inflates every
 * score and makes existing personal bests incomparable. Skipping costs neither.
 *
 * ⚠️ TrueFalseEngine had the SAME defect with a LONGER hold (2,400ms) and the
 * report never looked at it. Fixed in the same change rather than left as the
 * second implementation of a defect we had just closed — which is the habit
 * this project has been caught by six times.
 *
 * Verified live in a browser, not inferred: tap advanced in 26ms, Enter in
 * 27ms, and with no interaction at all the ceiling still fired at 1,823ms.
 */

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');

const engine = (name) => {
  const start = APP.indexOf(`function ${name}(`);
  expect(start, `${name} should exist`).toBeGreaterThan(-1);
  // to the next top-level function declaration
  const next = APP.indexOf('\nfunction ', start + 10);
  return APP.slice(start, next === -1 ? APP.length : next);
};

describe.each(['HotStreakEngine', 'TrueFalseEngine'])('%s reveal can be skipped', (name) => {
  const SRC = engine(name);

  it('the hold is scheduled through advance(), not an inline setState', () => {
    // Mutation check: inlining the body back into the setTimeout fails this.
    expect(/const advance = useCallback\(/.test(SRC), 'needs a single advance()').toBe(true);
    expect(/setTimeout\(advance, delay\)/.test(SRC),
      'the timeout must call the same advance() a tap calls, so both paths agree').toBe(true);
  });

  it('a tap anywhere that is not a control advances', () => {
    expect(/const onHoldTap = \(e\) => \{/.test(SRC)).toBe(true);
    // ⚠️ Must ignore taps on real buttons — back and "how to play" are live
    // during the hold, and advancing on those would eat the tap meant to leave.
    expect(/e\.target\.closest\("button"\)/.test(SRC),
      'a tap on a real control must not be swallowed as a skip').toBe(true);
    expect(/className="quiz-wrap" onClick=\{onHoldTap\}/.test(SRC),
      'the handler has to actually be wired to the wrap').toBe(true);
  });

  it('Enter and Space advance too', () => {
    // Both were tried by the reviewer first and both did nothing.
    expect(/e\.key !== "Enter" && e\.key !== " " && e\.key !== "Spacebar"/.test(SRC)).toBe(true);
    expect(/window\.addEventListener\("keydown", onKey\)/.test(SRC)).toBe(true);
    expect(/window\.removeEventListener\("keydown", onKey\)/.test(SRC),
      'the listener must be torn down or it stacks per answer').toBe(true);
  });

  it('advance() has no side effect inside a state updater', () => {
    // ⚠️ React updaters must be pure — they can run twice (StrictMode, and
    // again during concurrent re-render), which would fire completion twice.
    // My first version of TrueFalseEngine's advance called setDone INSIDE a
    // setIdx updater; this pins the corrected shape.
    expect(/setIdx\(i => \{[\s\S]{0,200}setDone/.test(SRC),
      'setDone must not live inside a setIdx updater').toBe(false);
  });
});

describe('the skip is discoverable', () => {
  it('Hot Streak tells the player the hold can be skipped', () => {
    // A skip nobody can see is not a skip — especially while a clock runs.
    expect(engine('HotStreakEngine').includes('tap to skip')).toBe(true);
  });
});
