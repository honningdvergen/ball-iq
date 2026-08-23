import { useCallback, useEffect, useRef, useState } from 'react';

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
 * no call-site wiring.
 *
 * ⚠️ THE JS LISTENER IS THE FALLBACK, NOT THE MECHANISM. On the native iOS
 * shell AppDelegate sets scrollView.keyboardDismissMode = .onDrag and iOS owns
 * the gesture entirely; the listener below is disabled there. It exists for PWA
 * and Android, which have no native path. Running both — which build 75 did —
 * puts two mechanisms on one gesture and produces exactly the symptom Alex
 * reported: "it is like it thinks i stop dragging it."
 */

/** Below this much shrinkage we assume no on-screen keyboard (desktop, or a
 *  hardware keyboard). Without the gate, scrollIntoView yanks the page on a
 *  desktop browser where nothing is covered. */
const KEYBOARD_MIN_PX = 100;

/**
 * ⚠️ THE ROOT CAUSE OF EVERY KEYBOARD BUG IN THIS APP, found 2026-08-23 after
 * Alex reported the drag-to-dismiss failing on build 74 — the third keyboard
 * report in a row that my browser tests all said were fixed.
 *
 * capacitor.config.json sets `"Keyboard": { "resize": "none" }`. With that, the
 * native WebView is NEVER resized when the keyboard opens: the keyboard is an
 * overlay the web content is not told about, so on device
 * `window.visualViewport.height` DOES NOT SHRINK.
 *
 * Every fix in this file read exactly that value. So on native, all three of
 * these silently did nothing while passing every test:
 *   · kbInset computed 0     -> no bottom padding -> page not scrollable
 *   · useDropdownMaxHeight   -> saw a full-height viewport -> list unbounded
 *   · drag-to-dismiss        -> bailed at its "is a keyboard up?" guard
 * Desktop browsers DO shrink the visual viewport, and the simulated-keyboard
 * tests faked the shrink — so the browser said fixed and the phone said broken.
 * Three symptoms, one config line.
 *
 * The fix is to ask the platform instead of inferring. @capacitor/keyboard was
 * already installed and in the Podfile, and was never imported by anything.
 * Its keyboardWillShow event carries the real height.
 *
 * ⚠️ Deliberately NOT switching resize to "native". That would make
 * visualViewport work, but it resizes the WebView on every focus — and this
 * app's fixed chrome (the floating tab bar, safe-area insets, the
 * display-mode:standalone mirror with ~155 !important rules) is tuned against
 * a stable viewport. This route changes no layout; it only stops JS lying to
 * itself about whether a keyboard is present.
 */
const IS_NATIVE = (() => {
  try {
    if (typeof window === 'undefined') return false;
    if (window.location?.protocol === 'capacitor:') return true;
    if (document.documentElement.classList.contains('native-app')) return true;
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch { return false; }
})();

/**
 * ⚠️ NEVER FIGHT THE FINGER. Alex, build 75: "it is like it thinks i stop
 * dragging it even though i have not let my finger off the screen."
 *
 * While a touch is in progress the user owns the scroll position and the
 * layout. Anything this module does during that window — a programmatic
 * scrollIntoView, a dropdown resize — cancels or overrides the drag WebKit is
 * already running, and the finger is still down, so it reads as the app
 * randomly letting go. Both consumers below gate on this.
 *
 * One module-level tracker with one set of listeners, rather than a pair per
 * hook instance: three modes mount this hook and Trail mounts it beside
 * useDropdownMaxHeight.
 */
const touch = { active: false };
if (typeof window !== 'undefined') {
  const down = () => { touch.active = true; };
  // touchend fires per finger; only the LAST lift ends the gesture.
  const up = (e) => { if (!e.touches || e.touches.length === 0) touch.active = false; };
  window.addEventListener('touchstart', down, { passive: true });
  window.addEventListener('touchend', up, { passive: true });
  window.addEventListener('touchcancel', up, { passive: true });
}

/**
 * Bottom of the visible area, in LAYOUT coordinates — the line the keyboard
 * starts at. Web reads the visual viewport; native reads the plugin-reported
 * height, because its visual viewport never moves.
 */
function visibleBottom(kbInset) {
  if (typeof window === 'undefined') return 0;
  if (IS_NATIVE) return window.innerHeight - kbInset;
  const vv = window.visualViewport;
  return vv ? vv.offsetTop + vv.height : window.innerHeight;
}

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
export function useDropdownMaxHeight(anchorRef, { gap = 12, min = 132, max = 360, kbInset = 0 } = {}) {
  const [maxHeight, setMaxHeight] = useState(max);
  const measure = useRef(null);
  measure.current = () => {
    const el = anchorRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    // visibleBottom() is the keyboard line in LAYOUT coordinates — plugin-fed
    // on native, visual-viewport-fed on web — so this one subtraction is
    // correct on both. Reading visualViewport here directly is what made the
    // list unbounded on device.
    const avail = visibleBottom(kbInset) - rect.bottom - gap;
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
  // added above it, and no dependency array can see that. This also covers
  // kbInset changing, since that re-renders the caller.
  //
  // ⚠️ Except while a finger is down. Resizing a list the user is currently
  // dragging moves the content under their thumb and aborts the scroll — and
  // on native this fired constantly, because the interactive keyboard dismiss
  // drove kbInset up and down throughout the drag. The bound is re-applied on
  // the next render after the lift, so nothing stays stale.
  useEffect(() => { if (!touch.active) measure.current(); });
  return maxHeight;
}

export function useKeyboardAwareInput() {
  const inputRef = useRef(null);
  const [kbInset, setKbInset] = useState(0);
  // Listeners below are attached once; state would be stale inside them.
  const kbInsetRef = useRef(0);
  kbInsetRef.current = kbInset;

  // NATIVE: ask the platform. See the IS_NATIVE block above for why the
  // visual-viewport route reports nothing on device.
  useEffect(() => {
    if (!IS_NATIVE) return undefined;
    let cancelled = false;
    const handles = [];
    import('@capacitor/keyboard')
      .then(({ Keyboard }) => {
        if (cancelled || !Keyboard) return;
        const add = (evt, fn) => {
          const r = Keyboard.addListener(evt, fn);
          // Capacitor 6 returns a promise for the handle.
          Promise.resolve(r).then((h) => { if (h) handles.push(h); }).catch(() => {});
        };
        add('keyboardWillShow', (info) => setKbInset(Math.round(info?.keyboardHeight || 0)));
        add('keyboardDidShow', (info) => setKbInset(Math.round(info?.keyboardHeight || 0)));
        add('keyboardWillHide', () => setKbInset(0));
        add('keyboardDidHide', () => setKbInset(0));
      })
      .catch(() => { /* plugin absent — degrade to no inset rather than throw */ });
    return () => {
      cancelled = true;
      handles.forEach((h) => { try { h.remove(); } catch { /* already gone */ } });
    };
  }, []);

  // WEB (browser + installed PWA): the visual viewport genuinely shrinks here.
  useEffect(() => {
    if (IS_NATIVE) return undefined;
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
  // ⚠️ useCallback IS LOAD-BEARING, not tidiness. Call sites pass this straight
  // into their own dependency array —
  //     useEffect(keepInputVisible, [shown, hint, done, keepInputVisible])
  // — which exhaustive-deps asks for. Unmemoized, its identity changed every
  // render, so that array never matched and the effect ran on EVERY RENDER,
  // firing a smooth programmatic scrollIntoView each time. With the keyboard up
  // on native, kbInset churn re-renders constantly, so the page was animating
  // itself while the player was trying to drag it. A fresh function in a dep
  // array is the same as having no dep array at all.
  const keepInputVisible = useCallback(() => {
    const el = inputRef.current;
    if (!el || document.activeElement !== el) return undefined;
    // Never scroll the page out from under an active drag. See `touch` above.
    if (touch.active) return undefined;
    // Gate on the REAL keyboard height. The old check asked whether the visual
    // viewport had shrunk, which is never true on native (resize: none) — so
    // this whole scroll-back never ran on a phone.
    if (kbInsetRef.current <= KEYBOARD_MIN_PX) return undefined;
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
  }, []);

  // Dismiss-on-drag. Passive listeners; nothing here can jank the scroll.
  //
  // ⚠️ WEB ONLY. On the native shell AppDelegate sets the WKWebView's
  // scrollView.keyboardDismissMode, so iOS already dismisses on drag — natively,
  // tracking the finger, without touching the DOM. Running both meant every drag
  // ALSO called blur(), which drops the keyboard instantly, reflows the page and
  // re-bounds the dropdown mid-gesture. Two mechanisms racing on one gesture is
  // why build 75 "kind of works but is very laggy": the native one animates the
  // keyboard down while the JS one has already yanked it. iOS owns this now.
  useEffect(() => {
    if (typeof window === 'undefined' || IS_NATIVE) return undefined;
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
      // Only when an on-screen keyboard is actually up. Reads the ref, because
      // this listener is attached once and would otherwise close over a stale
      // kbInset — and reads kbInset rather than the viewport, because on
      // native the viewport never moves.
      if (kbInsetRef.current <= KEYBOARD_MIN_PX) return;
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
