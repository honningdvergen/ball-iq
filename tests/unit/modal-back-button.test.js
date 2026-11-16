// 16 Nov 2026, the 1.8.7 Android walk: a guest's FIRST league never showed
// its "ready, share the invite" step. The sheet closed itself about 230 ms
// after the sign-in remount. useModalA11y re-ran its whole effect on every
// render (onClose was a dependency and most callers pass a new function each
// time): history.back() for the old entry, pushState for a new one. A burst
// of renders queued several back() calls, a one-shot flag swallowed the first
// popstate only, and the next one closed the sheet as if the player had
// pressed back. Reproduced in Chromium with three quick renders.
//
// This runs the real hook against a small stand-in for React's two hooks and
// for the browser's history. The stand-in history behaves as Chromium and
// WebKit were MEASURED to (16 Nov 2026, Playwright): back() is asynchronous,
// and its target is the entry below the one that was current WHEN IT WAS
// CALLED, so back() followed at once by pushState() lands one step too far
// down and leaves the new entry ahead as a forward entry.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const host = { slots: [], at: 0 };
vi.mock('react', () => ({
  useRef: (v) => { const i = host.at++; host.slots[i] ??= { current: v }; return host.slots[i]; },
  useEffect: (fn, deps) => { const i = host.at++; host.slots[i] ??= {}; host.slots[i].next = { fn, deps }; },
}));

function makeBrowser() {
  const listeners = {};
  const entries = [{ state: null }]; let index = 0; const pending = [];
  const win = {
    addEventListener: (t, f) => { (listeners[t] ||= []).push(f); },
    removeEventListener: (t, f) => { listeners[t] = (listeners[t] || []).filter((x) => x !== f); },
    history: {
      get state() { return entries[index].state; },
      pushState: (s) => { entries.length = index + 1; entries.push({ state: s }); index += 1; },
      back: () => { pending.push(index - 1); },
    },
  };
  /** Let the queued traversals happen, each with its popstate, as a browser does later. */
  const flush = () => { while (pending.length) { const to = pending.shift(); if (to >= 0) { index = to; (listeners.popstate || []).forEach((f) => f({ state: entries[index].state })); } } };
  /** WebKit answered two quick back() calls with one event: lose the oldest queued one. */
  const lose = () => { pending.shift(); };
  let pushCount = 0; const realPush = win.history.pushState; win.history.pushState = (s) => { pushCount += 1; realPush(s); };
  return { win, flush, lose, pushes: () => pushCount, depth: () => index, id: () => entries[index].state?.biq_modal_id || null };
}

/** One mounted component that calls the hook; render() again re-renders it. */
function mount(useModalA11y, container) {
  const mine = { slots: [], cleanups: new Map() };
  const render = (props) => {
    host.slots = mine.slots; host.at = 0;
    useModalA11y({ ...props, ref: mine.ref ||= { current: container } });
    mine.slots.forEach((slot, i) => {
      if (!slot.next) return;
      const was = slot.deps; const now = slot.next.deps;
      const changed = !was || !now || now.length !== was.length || now.some((d, k) => d !== was[k]);
      if (changed) { mine.cleanups.get(i)?.(); mine.cleanups.set(i, slot.next.fn() || undefined); slot.deps = now; }
      slot.next = null;
    });
  };
  const unmount = () => { mine.cleanups.forEach((c) => c?.()); mine.cleanups.clear(); };
  return { render, unmount };
}

let browser, useModalA11y, closeTopModal;
const container = { querySelectorAll: () => [], focus() {}, contains: () => true };
beforeEach(async () => {
  vi.useFakeTimers({ now: 1_800_000_000_000 });
  vi.resetModules();
  browser = makeBrowser();
  globalThis.window = browser.win;
  globalThis.document = { activeElement: null };
  ({ useModalA11y, closeTopModal } = await import('../../src/useModalA11y.js'));
});

describe('an open sheet and the back button', () => {
  it('re-rendering an open sheet does not touch the history, however often', () => {
    const closed = vi.fn();
    const sheet = mount(useModalA11y, container);
    for (let i = 0; i < 5; i++) sheet.render({ isOpen: true, onClose: () => closed(i) });
    browser.flush();
    expect(closed).not.toHaveBeenCalled();
    expect(browser.pushes()).toBe(1);
    expect(browser.depth()).toBe(1);
  });
  it('a real back press closes it, with the newest onClose', () => {
    const closed = vi.fn();
    const sheet = mount(useModalA11y, container);
    sheet.render({ isOpen: true, onClose: () => closed('first') });
    sheet.render({ isOpen: true, onClose: () => closed('latest') });
    browser.win.history.back(); browser.flush();
    expect(closed.mock.calls).toEqual([['latest']]);
  });
  it('the Android back button closes the top sheet the same way', () => {
    const closed = vi.fn();
    mount(useModalA11y, container).render({ isOpen: true, onClose: closed });
    expect(closeTopModal()).toBe(true);
    browser.flush();
    expect(closed).toHaveBeenCalledTimes(1);
  });
  it('sheets closed and reopened faster than the history answers never close the one that is open', () => {
    // The app's remount: the old sheet goes, the restored one mounts, twice
    // over, before a single popstate has arrived.
    const closed = vi.fn();
    const a = mount(useModalA11y, container); a.render({ isOpen: true, onClose: () => closed('a') });
    a.unmount();
    const b = mount(useModalA11y, container); b.render({ isOpen: true, onClose: () => closed('b') });
    b.unmount();
    const c = mount(useModalA11y, container); c.render({ isOpen: true, onClose: () => closed('c') });
    browser.flush();
    expect(closed).not.toHaveBeenCalled();
    // The survivor has its own entry, directly above where the page was.
    expect(browser.depth()).toBe(1);
    // And it still answers a real back press afterwards, landing where the page was.
    browser.win.history.back(); browser.flush();
    expect(closed.mock.calls).toEqual([['c']]);
    expect(browser.depth()).toBe(0);
  });
  it('a sheet that mounts while a back is in flight waits for it, then takes its entry', () => {
    const a = mount(useModalA11y, container); a.render({ isOpen: true, onClose: () => {} });
    a.unmount();                                   // back() queued, not landed
    const b = mount(useModalA11y, container); b.render({ isOpen: true, onClose: () => {} });
    expect(browser.pushes()).toBe(1);              // b has NOT pushed yet
    browser.flush();
    expect(browser.pushes()).toBe(2);
    expect(browser.depth()).toBe(1);
    // Closed by its own button, it takes its entry away again: nothing is left behind.
    b.unmount(); browser.flush();
    expect(browser.depth()).toBe(0);
  });
  it('an owed event that never comes does not swallow a real back press for long', () => {
    const closed = vi.fn();
    const a = mount(useModalA11y, container); a.render({ isOpen: true, onClose: () => {} });
    a.unmount(); browser.lose();                   // the engine never answers this back()
    const b = mount(useModalA11y, container); b.render({ isOpen: true, onClose: closed });
    vi.advanceTimersByTime(1600);                  // the owed event expires; b takes its entry
    expect(browser.id()).not.toBe(null);
    browser.win.history.back(); browser.flush();
    expect(closed).toHaveBeenCalledTimes(1);
  });
  it('a sheet that declines to close keeps answering the back button', () => {
    let busy = true; const closed = vi.fn();
    const sheet = mount(useModalA11y, container);
    sheet.render({ isOpen: true, onClose: () => { if (!busy) closed(); } });
    browser.win.history.back(); browser.flush();   // pressed while it is submitting
    expect(closed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);                   // still open: it is put back
    expect(browser.depth()).toBe(1);
    busy = false;
    expect(closeTopModal()).toBe(true); browser.flush();
    expect(closed).toHaveBeenCalledTimes(1);
  });
  it('a sheet that did close on back is not put back', () => {
    const sheet = mount(useModalA11y, container);
    sheet.render({ isOpen: true, onClose: () => sheet.unmount() });
    browser.win.history.back(); browser.flush();
    vi.advanceTimersByTime(500);
    expect(browser.depth()).toBe(0);
    expect(closeTopModal()).toBe(false);
  });
  it('closing by a button takes its own history entry away and nothing else', () => {
    const closed = vi.fn();
    const sheet = mount(useModalA11y, container);
    sheet.render({ isOpen: true, onClose: closed });
    sheet.unmount(); browser.flush();
    expect(browser.depth()).toBe(0);
    expect(closed).not.toHaveBeenCalled();
  });
});
