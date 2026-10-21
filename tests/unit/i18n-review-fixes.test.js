// i18n step 6: three fixes from the independent review of step 5 (the fourth,
// locale-less date and number formats, is i18n-locale-calls.test.js).
//
//   a. A Spanish quiz never waits more than ES_BANK_WAIT_MS (2.5 s) for the
//      Spanish bank. Past that it opens in English, and a question already on
//      screen in English stays English when the table lands (no switching
//      under the player's eyes); the next one is Spanish. English unchanged.
//   b. The Spanish review screens get the English bank they find id-less
//      records in, even straight after launch, before any quiz loaded it.
//   d. The service worker caches the hashed /assets/*.json (the Spanish bank)
//      cache-first, so Spanish works offline; /data/*.json stays network, the
//      bank is not precached, and CACHE_VERSION moved with the logic.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Effects run on render here (there is no DOM): what useQuestionText's effect
// asks for is what a mounted review screen asks for.
vi.mock('react', async (orig) => ({ ...(await orig()), useEffect: (fn) => { fn(); } }));

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { __resetI18nForTests, __setI18nLiveForTests } = await import('../../src/i18n/index.js');
const Q = await import('../../src/i18n/questionText.js');
const { loadQuestions } = await import('../../src/questions-loader.js');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');
const ES_BANK = JSON.parse(read('src/i18n/questions.es.json'));
const flush = () => new Promise((r) => setTimeout(r, 0));
const hang = () => new Promise(() => {});

let store;
beforeAll(() => { store = stubGlobals(); });
afterAll(() => { vi.unstubAllGlobals(); __setI18nLiveForTests(false); Q.__setSpanishQuestionsLoaderForTests(null); __resetI18nForTests(); });
beforeEach(() => {
  __setI18nLiveForTests(false);
  __resetI18nForTests();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in tests'))));
});

describe('a. the quiz never waits on a slow Spanish bank', () => {
  it('the cap is about 2.5 s, and the bank load uses it', () => {
    expect(Q.ES_BANK_WAIT_MS).toBeGreaterThan(0);
    expect(Q.ES_BANK_WAIT_MS).toBeLessThanOrEqual(2500);
    expect(read('src/questions-loader.js')).toContain('loadClubData(), loadSpanishQuestionsCapped()]');
    expect(read('src/questions-loader.js')).not.toMatch(/loadSpanishQuestions\(\)\]/);
  });

  it('a hanging fetch: the bank still resolves, after the cap, with English questions', async () => {
    Q.__setSpanishQuestionsLoaderForTests(hang);
    await bootLang(store, 'es');
    const t0 = Date.now();
    const bank = await loadQuestions(); // the first load in this file: really waits on the Spanish side
    const took = Date.now() - t0;
    expect(bank.QB.length).toBeGreaterThan(1000);
    expect(took).toBeGreaterThanOrEqual(Q.ES_BANK_WAIT_MS - 100);
    expect(took).toBeLessThan(15000);
    const row = bank.QB.find((r) => ES_BANK[r.id] && r.type === 'mcq');
    expect(Q.questionText.q(row)).toBe(row);
  });

  const BANKED = async () => (await loadQuestions()).QB.filter((r) => ES_BANK[r.id] && r.type === 'mcq' && !Q.HELD_ES_ROWS.has(r.id));

  it('a capped load resolves false at the cap; the question on screen stays English when the table lands, the next is Spanish', async () => {
    const [onScreen, next] = await BANKED();
    let release;
    Q.__setSpanishQuestionsLoaderForTests(() => new Promise((r) => { release = r; }));
    await bootLang(store, 'es');
    const t0 = Date.now();
    expect(await Q.loadSpanishQuestionsCapped(30)).toBe(false);
    expect(Date.now() - t0).toBeLessThan(1000);
    expect(Q.questionText.q(onScreen)).toBe(onScreen); // printed in English while late
    release(ES_BANK);
    await flush();
    expect(Q.questionText.q(onScreen)).toBe(onScreen); // no mid-question flip
    expect(Q.questionText.q(next).q).toBe(ES_BANK[next.id].q); // the next question is Spanish
  });

  it('a table that lands inside the cap: everything Spanish, nothing pinned', async () => {
    const [row] = await BANKED();
    Q.__setSpanishQuestionsLoaderForTests(async () => ES_BANK);
    await bootLang(store, 'es');
    expect(await Q.loadSpanishQuestionsCapped()).toBe(true);
    expect(Q.questionText.q(row).q).toBe(ES_BANK[row.id].q);
  });

  it('English: resolves at once, asks for nothing, prints the same object', async () => {
    const [row] = await BANKED();
    const loader = vi.fn(hang);
    Q.__setSpanishQuestionsLoaderForTests(loader);
    await bootLang(store, null);
    expect(await Q.loadSpanishQuestionsCapped()).toBe(false);
    expect(loader).not.toHaveBeenCalled();
    expect(Q.questionText.q(row)).toBe(row);
  });
});

describe('b. the Spanish review finds id-less records straight after launch', () => {
  const Probe = () => { Q.useQuestionText(); return null; };
  let row;
  let bank;
  beforeAll(async () => {
    bank = await loadQuestions();
    row = bank.QB.find((r) => ES_BANK[r.id]?.o && r.type === 'mcq' && !Q.HELD_ES_ROWS.has(r.id));
  });
  const record = () => ({ q: row.q, type: 'mcq', options: row.o, correctIdx: row.a, correctText: row.o[row.a] }); // App.jsx's answer review keeps no id

  it('without the English bank the record prints English; a review screen\'s render fetches the bank, then it prints Spanish', async () => {
    Q.__setSpanishQuestionsLoaderForTests(async () => ES_BANK);
    await bootLang(store, 'es');
    await Q.loadSpanishQuestions();
    Q.indexEnglishBank(null); // the state after launch: no quiz has loaded the bank
    expect(Q.questionText.answer(record()).q).toBe(row.q);
    const bankLoader = vi.fn(async () => { Q.indexEnglishBank(bank); return bank; });
    Q.registerBankLoader(bankLoader);
    renderToStaticMarkup(React.createElement(Probe));
    await flush();
    expect(bankLoader).toHaveBeenCalledTimes(1);
    expect(Q.questionText.answer(record()).q).toBe(ES_BANK[row.id].q);
    expect(Q.questionText.answer(record()).options[row.a]).toBe(ES_BANK[row.id].o[row.a]);
    renderToStaticMarkup(React.createElement(Probe)); // indexed now: no second load
    expect(bankLoader).toHaveBeenCalledTimes(1);
  });

  it('English: the review asks for neither the bank nor the Spanish table', async () => {
    const loader = vi.fn(async () => ES_BANK);
    Q.__setSpanishQuestionsLoaderForTests(loader);
    await bootLang(store, null);
    Q.indexEnglishBank(null);
    const bankLoader = vi.fn(async () => bank);
    Q.registerBankLoader(bankLoader);
    renderToStaticMarkup(React.createElement(Probe));
    await flush();
    expect(bankLoader).not.toHaveBeenCalled();
    expect(loader).not.toHaveBeenCalled();
    expect(Q.questionText.answer(record()).q).toBe(row.q);
  });

  it('the app wires the real loader: questions-loader.js registers loadQuestions, which indexes the bank', () => {
    const src = read('src/questions-loader.js');
    expect(src).toContain('registerBankLoader(loadQuestions);');
    expect(src).toContain('indexEnglishBank(cache);');
  });
  afterAll(async () => { Q.indexEnglishBank(bank); });
});

describe('d. offline Spanish: the service worker', () => {
  const SW = read('public/sw.js');
  function bootSw() {
    const handlers = {};
    const opened = [];
    const cache = { match: async () => undefined, put: async () => {}, keys: async () => [], delete: async () => true };
    const sandbox = {
      self: { addEventListener: (type, fn) => { handlers[type] = fn; }, location: { origin: 'https://balliq.app' }, skipWaiting() {}, clients: { claim: async () => {} }, registration: {} },
      caches: { open: async (name) => { opened.push(name); return cache; }, keys: async () => [], match: async () => undefined },
      fetch: async () => ({ ok: true, clone() { return this; } }),
      Request: class { constructor(u) { this.url = u; } },
      URL, Promise, console, setTimeout,
    };
    vm.runInNewContext(SW, sandbox);
    const fetchOf = async (path, mode = 'cors') => {
      let responded = null;
      handlers.fetch({ request: { method: 'GET', url: `https://balliq.app${path}`, mode }, respondWith: (p) => { responded = p; } });
      if (responded) await responded;
      return { responded: !!responded, cache: opened.at(-1) };
    };
    return { fetchOf, opened, version: vm.runInNewContext('CACHE_VERSION', sandbox) };
  }

  it('the hashed Spanish bank is cache-first in the static cache, like the JS', async () => {
    const sw = bootSw();
    const json = await sw.fetchOf('/assets/questions.es-B7x2kQ9a.json');
    expect(json.responded).toBe(true);
    expect(json.cache).toBe(`${sw.version}-static`);
    expect((await sw.fetchOf('/assets/index-abc123.js')).responded).toBe(true);
  });
  it('/data/*.json and other un-hashed JSON stay on the network', async () => {
    const sw = bootSw();
    expect((await sw.fetchOf('/data/top10.json')).responded).toBe(false);
    expect((await sw.fetchOf('/manifest.json')).responded).toBe(false);
    expect((await sw.fetchOf('/assets/nested/x.json')).responded).toBe(false);
  });
  it('CACHE_VERSION was bumped with the logic (repo rule), and the bank is not precached', () => {
    expect(bootSw().version).not.toBe('balliq-v13');
    expect(SW).toContain('const PRECACHE_MANIFEST = [];');
    // The precache list is js/css/fonts only: the 3 MB bank never reaches an English install.
    expect(read('scripts/gen-sw-precache.mjs')).toContain('.filter((f) => /\\.(js|css|woff2?)$/i.test(f))');
  });
});
