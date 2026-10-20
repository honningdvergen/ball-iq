// i18n step 3: every user-visible string on the PLAY screens of the daily games
// goes through t() (src/i18n/en.js), with Spanish in es.js: Footle, the quiz
// engine (Daily 7 and the quiz modes), the Quiz topic screen, Transfer Trail,
// Mystery Player and Top 10.
//
//   • ENGLISH IS BYTE-IDENTICAL. Each screen is rendered in the states listed in
//     i18n-games.scenarios.js and compared with i18n-games.golden.json: the
//     markup the same scenarios produced on main before step 3 (d5d4cbc7). Do
//     not regenerate the golden to make this pass: a diff here IS an English
//     regression.
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const S = vi.hoisted(() => ({}));
// The player pool arrives on focus in the real screens (an import()); here it
// is the real pool, handed over at once, or nothing (S.poolReady false).
vi.mock('../../src/lib/usePlayerPool.js', () => ({
  usePlayerPool: ({ careers = false } = {}) => ({
    pool: S.poolReady ? S.mysteryPool : [],
    careers: S.poolReady && careers ? S.mysteryCareers : null,
    ready: !!S.poolReady,
    ensure: () => {},
  }),
}));
vi.mock('../../src/lib/scheduleRemote.js', async (orig) => {
  const m = await orig();
  return { ...m, mysteryAnswerIds: (...a) => (S.noAnswer ? [] : m.mysteryAnswerIds(...a)) };
});
// Top 10 loads its lists with an import() in an effect, which a static render
// never runs: its one `useState({ data: null, failed: false })` is handed the
// scenario's data instead. Every other useState is React's own.
vi.mock('react', async (orig) => {
  const R = await orig();
  const isTop10Init = (v) => v && typeof v === 'object' && !Array.isArray(v) && v.data === null && v.failed === false && Object.keys(v).length === 2;
  const useState = (init) => R.useState(isTop10Init(init)
    ? (S.top10 === 'failed' ? { data: null, failed: true } : { data: S.top10, failed: false })
    : init);
  return { ...R, default: { ...R.default, useState }, useState };
});

const { fillPool, stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { renderAll, buildScenarios } = await import('./i18n-games.scenarios.js');
const { getLang, __resetI18nForTests } = await import('../../src/i18n/index.js');
const GOLDEN = JSON.parse(readFileSync(fileURLToPath(new URL('./i18n-games.golden.json', import.meta.url)), 'utf8'));
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
  fillPool(S);
  store = stubGlobals();
});
afterAll(() => { vi.useRealTimers(); vi.unstubAllGlobals(); __resetI18nForTests(); });

describe('English is byte-identical (golden markup from main before step 3)', () => {
  it('every scenario still has a golden, and nothing extra', () => {
    expect(buildScenarios(S).map(([name]) => name).sort()).toEqual(Object.keys(GOLDEN).sort());
  });
  it('Footle, the quiz engine, the Quiz screen, Trail, Mystery and Top 10 render exactly as before', async () => {
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
