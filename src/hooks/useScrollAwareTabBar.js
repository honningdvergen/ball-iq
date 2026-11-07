import { useEffect, useRef } from "react";

// Extracted from AppInner on 2026-09-06 (review E16): one effect, one ref, two
// inputs. Returns the ref the tab bar mounts on.
export function useScrollAwareTabBar({ screen, inGame }) {
  // ── SCROLL-AWARE TAB BAR (Alex, 2026-08-12: "you know how it kind of
  // transforms when scrolling in threads and instagram?"). Scrolling DOWN
  // tucks the pill away so content owns the screen; any upward flick brings
  // it straight back, and it is always present at the very top and bottom.
  // Deliberately outside React state: this fires on every scroll frame, and
  // re-rendering the shell that often would cost far more than it buys.
  // rAF-throttled + passive listener so it never blocks the scroll thread.
  const tabBarRef = useRef(null);
  useEffect(() => {
    const el = tabBarRef.current;
    if (!el) return;
    let last = window.scrollY, ticking = false, hidden = false;
    const apply = () => {
      ticking = false;
      const y = window.scrollY;
      const dy = y - last;
      // ⚠️ SHORT PAGES MUST NOT PLAY THIS AT ALL. Home scrolls barely more
      // than a screen, so every small flick crossed the threshold and the bar
      // strobed in and out — from the device test: "there is minimal scroll on
      // the homepage so it dissappears and appears really quick which looks
      // quirky". Threads and Instagram feel right because the gesture only
      // exists where a long feed needs the room. Below ~0.6 of a screen of
      // scrollable content there is nothing to reclaim, so the bar stays put —
      // and any bar left tucked from a previous screen is restored here.
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable < window.innerHeight * 0.6) {
        if (hidden) { hidden = false; el.classList.remove('tab-bar--tucked'); }
        return;
      }
      // Deadzone widened 6 -> 14 and the arm threshold 90 -> 140: both were
      // tuned on long lists, where the bar has time to commit to a direction.
      if (Math.abs(dy) < 14) return;
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 24;
      const next = dy > 0 && y > 140 && !atBottom;
      if (next !== hidden) {
        hidden = next;
        el.classList.toggle('tab-bar--tucked', hidden);
      }
      last = y;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    // A tab switch puts the page back where that tab was (App.jsx, 7 Nov
    // 2026). That jump is not the player scrolling down, so it must neither
    // tuck the bar nor count as the start of the next scroll.
    const onRestore = () => { last = window.scrollY; if (hidden) { hidden = false; el.classList.remove('tab-bar--tucked'); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('biq:tab-restore', onRestore);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('biq:tab-restore', onRestore); };
  }, [screen, inGame]);
  return tabBarRef;
}
