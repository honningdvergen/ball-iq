import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * THE FALSE-LOGOUT GATE. A real player reported being "logged out every
 * single time" he updated the app — while prod showed his June session
 * alive, refreshed the same morning, no re-auth since Aug 3. The logout
 * was client-painted: the session store's ONE bridge read failing (or
 * hanging past the boot watchdog) demoted a signed-in player to a guest
 * with a sign-in card, and 107 of his games forked into a guest bucket
 * the server never saw.
 *
 * Two properties this gate pins:
 *  1. A transient Preferences-bridge failure must NEVER read as "no
 *     session" — retry once, then fall back to the legacy localStorage
 *     copy. The original code had the legacy fallback INSIDE the same
 *     try/catch, so the one boot where the bridge failed was also the one
 *     boot that skipped the fallback that would have saved it.
 *  2. A bridge failure must never be CACHED — the next read with a healthy
 *     bridge must return the session.
 */

// The bridge mock: programmable per-test.
const prefState = { failures: 0, store: new Map() };
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }) => {
      if (prefState.failures > 0) { prefState.failures--; throw new Error('bridge hiccup'); }
      return { value: prefState.store.has(key) ? prefState.store.get(key) : null };
    }),
    set: vi.fn(async ({ key, value }) => { prefState.store.set(key, value); }),
    remove: vi.fn(async ({ key }) => { prefState.store.delete(key); }),
  },
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: {} }) }));

const localStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (localStore.has(k) ? localStore.get(k) : null),
  setItem: (k, v) => localStore.set(k, String(v)),
  removeItem: (k) => localStore.delete(k),
};

const { nativeStorage, readStoredSession } = await import('../../src/supabase.js');

const SESSION = JSON.stringify({ access_token: 'x', refresh_token: 'y', user: { id: 'u-123' } });

beforeEach(() => { prefState.failures = 0; prefState.store.clear(); localStore.clear(); });

describe('native session storage never invents a logout', () => {
  it('a double bridge failure still finds the legacy localStorage session', async () => {
    // key unique per test — the adapter has a module-level write-through cache
    const key = 'sb-test-legacy';
    localStore.set(key, SESSION);
    prefState.failures = 2; // both the read and its retry throw
    const v = await nativeStorage.getItem(key);
    expect(v).toBe(SESSION); // the OLD adapter returned null here — the false logout
  });

  it('one hiccup is absorbed by the retry without touching legacy', async () => {
    const key = 'sb-test-retry';
    prefState.store.set(key, SESSION);
    prefState.failures = 1; // first read throws, retry succeeds
    const v = await nativeStorage.getItem(key);
    expect(v).toBe(SESSION);
  });

  it('a total failure is not cached — the next healthy read recovers the session', async () => {
    const key = 'sb-test-nocache';
    prefState.store.set(key, SESSION);
    prefState.failures = 2; // this read fails outright (no legacy copy either)
    expect(await nativeStorage.getItem(key)).toBe(null);
    // bridge healthy again: the session MUST come back. Caching the failure
    // would pin "logged out" until the app is killed.
    expect(await nativeStorage.getItem(key)).toBe(SESSION);
  });

  it('a truly absent key is null and cacheable', async () => {
    const key = 'sb-test-absent';
    expect(await nativeStorage.getItem(key)).toBe(null);
    expect(await nativeStorage.getItem(key)).toBe(null);
  });

  it('readStoredSession surfaces the stored user for the boot watchdog', async () => {
    prefState.store.set('sb-blcisypmngimqkwxrrdm-auth-token', SESSION);
    const blob = await readStoredSession();
    expect(blob?.user?.id).toBe('u-123');
  });

  it('readStoredSession is null for garbage and for user-less blobs', async () => {
    // write THROUGH the adapter so the write-through mirror (authoritative by
    // design — the adapter is the only writer) updates too; poking the bridge
    // store directly would leave the previous test's value in the mirror.
    await nativeStorage.setItem('sb-blcisypmngimqkwxrrdm-auth-token', 'not-json{');
    expect(await readStoredSession()).toBe(null);
    await nativeStorage.setItem('sb-blcisypmngimqkwxrrdm-auth-token', JSON.stringify({ access_token: 'x' }));
    expect(await readStoredSession()).toBe(null); // no user id → not a session
  });
});
