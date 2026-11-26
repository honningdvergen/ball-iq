// Shared set-up for the step 3 renders (tests/unit/i18n-games.test.js): the
// real Mystery pool and careers, loaded once, and the stubbed browser globals.
// The vi.mock calls themselves have to live in the test file (vitest hoists
// them only there); they read the `S` object filled here.
import { vi } from 'vitest';
import pool from '../../src/data/mysteryPool.json';
import careers from '../../src/data/mysteryCareers.json';
import fixes from '../../src/data/mysteryCareerFixes.json';
import { withCareerFixes } from '../../src/lib/mysteryCareer.js';
import nations from '../../src/data/mysteryNations.json';
import regions from '../../src/data/nationRegions.json';
import flags from '../../src/data/nationFlags.json';
import { LANG_STORAGE_KEY, initI18n } from '../../src/i18n/index.js';

export function fillPool(S) {
  S.mysteryPool = pool;
  S.mysteryCareers = withCareerFixes(careers, fixes);
  // What lib/mysteryRulesData.js loads for the tiles and hints (26 Nov 2026).
  // No photos: the reviewed list ships empty, so the shirt in a ring is drawn.
  S.mysteryRules = { nations, regions, flags, photos: {} };
}

/** Stub localStorage & co; returns the storage Map. `lang` is the explicit biq_lang. */
export function stubGlobals() {
  const store = new Map();
  vi.stubGlobal('localStorage', { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  vi.stubGlobal('navigator', { language: 'en-US', userAgent: 'Mozilla/5.0 (Macintosh)' });
  vi.stubGlobal('document', { documentElement: { lang: 'en', classList: { contains: () => false } } });
  return store;
}

/** Boot i18n with an explicit language (null = none stored). Storage is the stub's. */
export async function bootLang(store, lang) {
  store.clear();
  if (lang) store.set(LANG_STORAGE_KEY, lang);
  await initI18n();
}
