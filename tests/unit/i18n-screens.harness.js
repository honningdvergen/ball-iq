// Shared set-up for the step 4 renders (tests/unit/i18n-screens.test.js). The
// vi.mock calls themselves have to live in the test file (vitest hoists them
// only there); they read the `S` object.
import { vi } from 'vitest';

// The screens format dates and numbers with the device's locale (English) or
// the active language (Spanish). A test machine's default locale is whatever
// its environment says, so "the device's locale" is pinned to en-US here, the
// locale the golden was rendered in. An explicit locale passes through.
export function pinDefaultLocale() {
  const wrap = (proto, name) => {
    const orig = proto[name];
    vi.spyOn(proto, name).mockImplementation(function (locale, opts) {
      return orig.call(this, locale === undefined ? 'en-US' : locale, opts);
    });
  };
  wrap(Date.prototype, 'toLocaleDateString');
  wrap(Date.prototype, 'toLocaleTimeString');
  wrap(Date.prototype, 'toLocaleString');
  wrap(Number.prototype, 'toLocaleString');
}

/** A localStorage over `store` that can also be walked (length, key(i)): History reads every day that way. */
export function stubWalkableStorage(store) {
  vi.stubGlobal('localStorage', {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  });
}

/**
 * The useState override: `S.state` maps '<Component>:<n>' — the n-th useState
 * call (0-based) made by the component function of that name during one
 * scenario — to the value it starts with. The name is read off the call stack,
 * so the override follows the component, not its place in the tree. Wrap
 * React's useState with it in the test's vi.mock('react').
 */
export function overriddenUseState(S, realUseState) {
  return (init) => {
    if (!S.state) return realUseState(init);
    const frame = (new Error().stack || '').split('\n')[2] || '';
    const name = (/at (?:Object\.)?(\w+)/.exec(frame) || [])[1] || '?';
    S.calls[name] = (S.calls[name] || 0) + 1;
    const key = `${name}:${S.calls[name] - 1}`;
    return realUseState(Object.hasOwn(S.state, key) ? S.state[key] : init);
  };
}
