// i18n step 4: every user-visible string on the finish panels (DailyDone,
// ResultFoot, ChallengeBanner), the results screens, the answer review, the
// History tab, Profile, Settings and Onboarding goes through t()
// (src/i18n/en.js), with Spanish in es.js.
//
//   • ENGLISH IS BYTE-IDENTICAL. Each surface is rendered in the states listed
//     in i18n-screens.scenarios.js and compared with i18n-screens.golden.json:
//     the markup the same scenarios produced on main before step 4 (12708880).
//     Do not regenerate the golden to make this pass: a diff here IS an
//     English regression.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const S = vi.hoisted(() => ({ calls: {}, state: null, auth: null }));
vi.mock('react', async (orig) => {
  const R = await orig();
  const { overriddenUseState } = await import('./i18n-screens.harness.js');
  const useState = overriddenUseState(S, R.useState);
  return { ...R, default: { ...R.default, useState }, useState };
});
// A static render cannot portal; the sheets Profile portals to document.body
// render in place instead.
vi.mock('react-dom', async (orig) => {
  const R = await orig();
  const createPortal = (c) => c;
  return { ...R, default: { ...R.default, createPortal }, createPortal };
});
vi.mock('../../src/useAuth.jsx', async (orig) => ({ ...(await orig()), useAuth: () => S.auth }));

const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { pinDefaultLocale, stubWalkableStorage } = await import('./i18n-screens.harness.js');
const { renderAll, buildScenarios } = await import('./i18n-screens.scenarios.js');
const { getLang, __resetI18nForTests } = await import('../../src/i18n/index.js');
const GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-screens.golden.json', import.meta.url)), 'utf8'));
// The first byte where two renders part, with context.
function firstDiff(was, now) {
  if (was === now) return null;
  let i = 0;
  while (was[i] === now[i]) i++;
  return `at ${i}\n  was: …${was.slice(Math.max(0, i - 80), i + 80)}…\n  now: …${String(now).slice(Math.max(0, i - 80), i + 80)}…`;
}

let store;
// Noon on 20 Oct 2026, as the golden was rendered.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));
  pinDefaultLocale();
  store = stubGlobals();
  stubWalkableStorage(store);
});
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); __resetI18nForTests(); });

describe('English is byte-identical (golden markup from main before step 4)', () => {
  it('every scenario still has a golden, and nothing extra', () => {
    expect(buildScenarios().map(([name]) => name).sort()).toEqual(Object.keys(GOLDEN).sort());
  });
  it('the finish panels, results, review, History, Profile, Settings and Onboarding render exactly as before', async () => {
    __resetI18nForTests();
    await bootLang(store, null);
    expect(getLang()).toBe('en');
    const now = renderAll(S, store);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
  it('an explicit biq_lang=en is the same English', async () => {
    __resetI18nForTests();
    await bootLang(store, 'en');
    const now = renderAll(S, store);
    for (const name of Object.keys(GOLDEN)) expect(firstDiff(GOLDEN[name], now[name]), name).toBe(null);
  });
});
