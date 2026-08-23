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
 * Deliberately does NOT blur the input when CONTENT moves: staying focused is
 * what lets a player guess repeatedly without re-tapping the field, which
 * every one of these modes wants. When rows grow, the fix is to move the
 * field, not to take the keyboard away.
 *
 * THE THIRD HALF (Alex, device-testing 2026-08-23): "when people search for
 * xabi alonso and want to scroll down... the keyboard is in the way. i was
 * thinking the keyboard disappears when they try to scroll. this stuff has to
 * be smooth." A deliberate DRAG is the opposite intent from typing — the
 * player is asking to see the page — so that, and only that, dismisses the
 * keyboard. The two rules don't conflict: content growth moves the field,
 * a finger drag drops the keyboard. Automatic for every mode using this hook;
 * no call-site wiring. On the native iOS shell, AppDelegate additionally sets
 * scrollView.keyboardDismissMode = .interactive, the genuinely smooth version
 * where the keyboard tracks the finger — this listener is the fallback that
 * gives PWA and Android the same behaviour.
 */

/** Below this much shrinkage we assume no on-screen keyboard (desktop, or a
 *  hardware keyboard). Without the gate, scrollIntoView yanks the page on a
 *  desktop browser where nothing is covered. */
const KEYBOARD_MIN_PX = 100;

/**
 * How tall a dropdown anchored under `anchorRef` may be before the keyboard
 * eats it. Returns a pixel number to drop straight into `maxHeight`.
 *
 * ⚠️ PLAYER-REPORTED TWICE. 2026-08-23 first pass bounded the Trail/Mystery
 * suggestion lists — and Alex still hit it on build 72: "i tried to scroll
 * here, it did not work, keyboard is stuck over the list of players." Two
 * defects in that first attempt, both of which this fixes:
 *
 *   1. IT WENT STALE. It recomputed on [suggestions.length, kbInset], so
 *      typing "Xa" -> "Xab" (length unchanged at 6) or adding a guess chip
 *      (which pushes the input DOWN) never re-measured. The bound stayed at
 *      whatever the first measurement said.
 *   2. IT MIXED COORDINATE SPACES. getBoundingClientRect() is in LAYOUT
 *      viewport coordinates; visualViewport.height is the VISUAL viewport.
 *      On iOS the page scrolls inside the layout viewport when the keyboard
 *      opens, so `visualViewport.height - rect.bottom` overestimates the free
 *      space by exactly visualViewport.offsetTop — the list then renders
 *      taller than the gap and the tail sits under the keyboard.
 *
 * Measuring on every visualViewport resize AND scroll, plus every render that
 * changes the anchor, makes both impossible. Shared so Trail and Mystery
 * cannot drift — the first version was copy-pasted into both, and a bug in a
 * copy-paste is a bug twice.
 */
export function useDropdownMaxHeight(anchorRef, { gap = 12, min = 132, max = 360 } = {}) {
  const [maxHeight, setMaxHeight] = useState(max);
  const measure = useRef(null);
  measure.current = () => {
    const el = anchorRef.current;
    if (!el || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    const rect = el.getBoundingClientRect();
    // Convert the anchor's bottom into VISUAL viewport space before comparing.
    const bottomInVisual = rect.bottom - (vv ? vv.offsetTop : 0);
    const viewportH = vv ? vv.height : window.innerHeight;
    const avail = viewportH - bottomInVisual - gap;
    setMaxHeight(Math.max(min, Math.min(max, Math.round(avail))));
  };
  useEffect(() => {
    const run = () => measure.current && measure.current();
    run();
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (vv) {
      vv.addEventListener('resize', run);
      vv.addEventListener('scroll', run);
    }
    window.addEventListener('resize', run);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', run);
        vv.removeEventListener('scroll', run);
      }
      window.removeEventListener('resize', run);
    };
  }, []);
  // Re-measure after every render: the anchor moves whenever a guess row is
  // added above it, and no dependency array can see that.
  useEffect(() => { measure.current(); });
  return maxHeight;
}

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

  // Dismiss-on-drag. Passive listeners; nothing here can jank the scroll.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let startY = null;
    let startX = null;
    let doneThisGesture = false;
    const onStart = (e) => {
      const t = e.touches && e.touches[0];
      startY = t ? t.clientY : null;
      startX = t ? t.clientX : null;
      doneThisGesture = false;
    };
    const onMove = (e) => {
      if (doneThisGesture || startY == null) return;
      const el = inputRef.current;
      if (!el || document.activeElement !== el) return;
      // Only when an on-screen keyboard is actually up — read the viewport
      // directly rather than the kbInset state, which is stale inside a
      // window-level listener.
      const vv = window.visualViewport;
      if (!vv || window.innerHeight - vv.height - vv.offsetTop <= KEYBOARD_MIN_PX) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      const dy = Math.abs(t.clientY - startY);
      const dx = Math.abs(t.clientX - (startX ?? t.clientX));
      // ⚠️ The threshold is what keeps taps alive. A tap on a suggestion row
      // moves a couple of pixels; blurring on that would collapse the layout
      // under the finger before the tap lands. 18px of mostly-vertical travel
      // is unambiguous scrolling intent and nothing else.
      if (dy > 18 && dy > dx) {
        doneThisGesture = true;
        try { el.blur(); } catch { /* nothing to drop */ }
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
    };
  }, []);

  return { inputRef, kbInset, keepInputVisible };
}
