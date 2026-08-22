import { useEffect, useRef, useState } from 'react';

/**
 * Keep a focused text input clear of the on-screen keyboard.
 *
 * ⚠️ THIS BUG HAS NOW BEEN REPORTED THREE TIMES, in three different modes, from
 * one root cause. It was fixed twice by hand before anyone extracted it:
 *
 *   2026-08-11  Trail    "keyboard would not go away and the app would not
 *                         let him scroll"
 *   2026-08-21  Trail    "keyboard stuck on top of the game when the fourth
 *                         and fifth club appears"
 *   2026-08-22  Mystery  same shape — and Alex correctly predicted it would be
 *                         in every mode where you type.
 *
 * THE SHAPE. Every typing mode in this app grows content ABOVE its input: a
 * guess row, a revealed club, a hint block, a solved stadium. iOS scrolls a
 * focused field into view when it GAINS focus and never again — so each new row
 * pushes the field a little further down until it sits under the keyboard. The
 * keyboard-shrunk viewport then makes the whole page read as scroll-locked, and
 * the only way out a player finds is leaving the mode and coming back.
 *
 * TWO HALVES, and a mode needs both:
 *
 *   kbInset          how much of the viewport the keyboard is eating. Add it as
 *                    bottom padding so content below the fold can still be
 *                    scrolled ABOVE the keyboard. Without this the last row of
 *                    a list is permanently unreachable.
 *   keepInputVisible pulls the focused field back into view when content grows.
 *                    Without this the input itself disappears while the player
 *                    is still typing into it.
 *
 * Usage:
 *   const { inputRef, kbInset, keepInputVisible } = useKeyboardAwareInput();
 *   useEffect(keepInputVisible, [rowsRevealed, hintShown, done]);
 *   <div style={{ paddingBottom: 32 + kbInset }}>…
 *   <input ref={inputRef} …/>
 *
 * Deliberately does NOT blur the input: staying focused is what lets a player
 * guess repeatedly without re-tapping the field, which every one of these modes
 * wants. The fix is to move the field, not to take the keyboard away.
 */

/** Below this much shrinkage we assume no on-screen keyboard (desktop, or a
 *  hardware keyboard). Without the gate, scrollIntoView yanks the page on a
 *  desktop browser where nothing is covered. */
const KEYBOARD_MIN_PX = 100;

export function useKeyboardAwareInput() {
  const inputRef = useRef(null);
  const [kbInset, setKbInset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return undefined;
    const measure = () => {
      // The visible viewport shrinks by exactly the keyboard's height, and
      // offsetTop covers the case where the page is scrolled within it.
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      setKbInset(hidden > KEYBOARD_MIN_PX ? Math.round(hidden) : 0);
    };
    measure();
    vv.addEventListener('resize', measure);
    vv.addEventListener('scroll', measure);
    return () => {
      vv.removeEventListener('resize', measure);
      vv.removeEventListener('scroll', measure);
    };
  }, []);

  /**
   * Pass straight to useEffect: `useEffect(keepInputVisible, [deps…])`.
   * Returns a cleanup, so it satisfies useEffect's contract as-is.
   */
  const keepInputVisible = () => {
    const el = inputRef.current;
    if (!el || document.activeElement !== el) return undefined;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv || vv.height >= window.innerHeight - KEYBOARD_MIN_PX) return undefined;
    // ⚠️ rAF, not a bare call: the DOM row that caused this has usually not
    // been laid out yet at effect time, so scrolling immediately targets the
    // OLD position. (rAF does not fire in a hidden tab — which is why a
    // verification run in a background tab once reported this fix as doing
    // nothing at all.)
    const id = requestAnimationFrame(() => {
      // `center` clears the keyboard without needing to know which ancestor
      // actually scrolls — these modes differ in that.
      try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* older WebViews */ }
    });
    return () => cancelAnimationFrame(id);
  };

  return { inputRef, kbInset, keepInputVisible };
}
