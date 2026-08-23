import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * THE USER OWNS THE GESTURE. Nothing may move the page while a finger is down.
 *
 * ⚠️ PLAYER-REPORTED, 2026-08-23, build 75: "it is very laggy, and not
 * responsive. it is like it thinks i stop dragging it even though i have not let
 * my finger off the screen. so i can not scroll up and down without lifting my
 * thumb up from the screen then dragging it the other direction again."
 *
 * Three separate things were grabbing at the same drag:
 *
 *   1. `keepInputVisible` was NOT memoized, and Trail/Mystery pass it into their
 *      own dependency arrays (exhaustive-deps asks for exactly that). A fresh
 *      identity every render made those arrays inert, so the effect ran on every
 *      render and fired a smooth programmatic scrollIntoView each time. With the
 *      keyboard up, kbInset churn re-renders constantly — the page was animating
 *      itself while the player dragged.
 *   2. The web drag-to-dismiss called blur() on native too, where AppDelegate's
 *      keyboardDismissMode already does the job natively. Two mechanisms racing
 *      on one gesture.
 *   3. useDropdownMaxHeight re-measured after every render, resizing the list
 *      under the thumb mid-drag.
 *
 * These are STRUCTURAL invariants, not behaviours — there is no jsdom in this
 * project, so a render test is not available and this reads the source instead.
 * That makes it weaker than a real test, so each pattern below is deliberately
 * anchored to a unique, load-bearing token rather than to formatting, and each
 * was verified to FAIL when the defect is seeded back in (see the mutation notes
 * in each assertion). A source guard that has never been seen to fail is a
 * decoration, not a test.
 */

const SRC = readFileSync(
  fileURLToPath(new URL('../../src/lib/useKeyboardAwareInput.js', import.meta.url)),
  'utf8',
);

describe('nothing moves the page while a finger is down', () => {
  it('keepInputVisible is memoized, so call-site dep arrays actually work', () => {
    // Mutation check: `const keepInputVisible = () => {` fails this.
    expect(
      /const keepInputVisible = useCallback\(/.test(SRC),
      'keepInputVisible must be wrapped in useCallback — Trail and Mystery pass it\n' +
      'into their own dependency arrays, so an unstable identity makes those\n' +
      'arrays inert and the effect fires on every render.',
    ).toBe(true);
    expect(/^import \{[^}]*useCallback/m.test(SRC), 'useCallback must be imported').toBe(true);
  });

  it('the scroll-back bails out while a touch is active', () => {
    // Mutation check: deleting the `if (touch.active) return undefined;` line
    // inside keepInputVisible fails this.
    const body = SRC.slice(SRC.indexOf('const keepInputVisible = useCallback('));
    const guard = body.slice(0, body.indexOf('requestAnimationFrame'));
    expect(
      /if \(touch\.active\) return undefined;/.test(guard),
      'keepInputVisible must return early while a touch is in progress, or its\n' +
      'smooth scrollIntoView fights the drag the user is currently performing.',
    ).toBe(true);
  });

  it('the dropdown does not resize under an active drag', () => {
    // Mutation check: `useEffect(() => { measure.current(); });` fails this.
    expect(
      /useEffect\(\(\) => \{ if \(!touch\.active\) measure\.current\(\); \}\);/.test(SRC),
      'The after-every-render re-measure must skip while a finger is down —\n' +
      'resizing a list mid-drag moves content under the thumb and aborts scroll.',
    ).toBe(true);
  });

  it('web drag-to-dismiss does not run on native, where iOS already owns it', () => {
    // Mutation check: dropping `|| IS_NATIVE` from the guard fails this.
    const i = SRC.indexOf('// Dismiss-on-drag.');
    expect(i, 'the dismiss-on-drag effect should still exist').toBeGreaterThan(-1);
    // ⚠️ Slice to END OF FILE, not a fixed character window. The first version
    // of this guard took `slice(i, i + 1400)`; adding the explanatory comment
    // above the effect pushed `el.blur()` past 1400 chars and the assertion
    // started failing on correct code. A guard anchored to a byte count is
    // measuring the comments, not the behaviour.
    const effect = SRC.slice(i);
    expect(
      /if \(typeof window === 'undefined' \|\| IS_NATIVE\) return undefined;/.test(effect),
      'The JS blur-on-drag must be web-only. AppDelegate sets keyboardDismissMode\n' +
      'on the native shell; running both makes two mechanisms race on one gesture.',
    ).toBe(true);
    // …and it must still be there for web/PWA/Android, which have no native path.
    expect(/el\.blur\(\)/.test(effect), 'web still needs the blur fallback').toBe(true);
  });

  it('the touch tracker only clears on the LAST finger up', () => {
    // A bare `touchend -> active = false` ends the gesture when a second finger
    // lifts, re-opening the window this whole file exists to close.
    expect(
      /e\.touches\.length === 0/.test(SRC),
      'touchend fires per finger; only the last lift ends the gesture.',
    ).toBe(true);
  });
});

describe('the native shell dismisses decisively, not interactively', () => {
  const SWIFT = readFileSync(
    fileURLToPath(new URL('../../ios/App/App/AppDelegate.swift', import.meta.url)),
    'utf8',
  );

  it('uses .onDrag, so a partial drag cannot oscillate the keyboard', () => {
    // ⚠️ .interactive tracks the finger and springs back if the drag is short.
    // Every spring-back fires a full willHide/didHide + willShow/didShow pair at
    // the bridge — Alex's build-75 log shows nine cycles — and each pair rewrote
    // kbInset, re-rendering the mode and re-bounding the list mid-gesture.
    expect(/keyboardDismissMode = \.onDrag/.test(SWIFT)).toBe(true);
    expect(
      /keyboardDismissMode = \.interactive/.test(SWIFT),
      '.interactive is what caused the keyboardHeight oscillation in build 75.',
    ).toBe(false);
  });
});
