// i18n step 5: the question bank in Spanish (src/i18n/questionText.js).
//
//   • An English player never asks for the Spanish file: not on boot, not
//     when the bank loads, not when a question renders, and not on a Spanish
//     phone while I18N_LIVE is false.
//   • It is not a JS chunk anyone can preload: one importer, as a ?url asset.
//   • A Spanish render of a quiz question prints the Spanish question, options
//     and explanation, with the same correct index; scoring reads the English.
//   • A missing id, or a missing field, prints the English.
//   • The file itself: every row is a bank row, with the English option count.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const React = (await import('react')).default;
const { renderToStaticMarkup } = await import('react-dom/server');
const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { getLang, __resetI18nForTests, __setI18nLiveForTests } = await import('../../src/i18n/index.js');
const Q = await import('../../src/i18n/questionText.js');
const { QuizEngine } = await import('../../src/screens/QuizEngine.jsx');
const { WrongAnswersReview } = await import('../../src/components/WrongAnswersReview.jsx');
const { loadQuestions } = await import('../../src/questions-loader.js');

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const ES_BANK = JSON.parse(readFileSync(resolve(SRC, 'i18n/questions.es.json'), 'utf8'));
const { QB, TF_STATEMENTS } = await loadQuestions(); // the real bank, as the app loads it
const BANK = new Map([...QB, ...TF_STATEMENTS].map((r) => [r.id, r]));
const noop = () => {};
const html = (el) => renderToStaticMarkup(el);
const engine = (questions) => React.createElement(QuizEngine, {
  questions, mode: 'daily', diff: 'medium', timerEnabled: false, soundEnabled: false, hintsEnabled: true,
  onComplete: noop, onBack: noop, onReport: noop,
});
// The app's own per-game option shuffle (App.jsx getDailyQsForDate), fixed here.
const shuffled = (row, order = [3, 2, 1, 0]) => ({ ...row, o: order.map((i) => row.o[i]), a: order.indexOf(row.a), _histKey: row.id });
// React escapes text; compare like for like.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

// A four-option row with an explanation, in both languages, not held back.
const ROW = QB.find((r) => r.type === 'mcq' && r.o?.length === 4 && r.hint && ES_BANK[r.id]?.hint && !Q.HELD_ES_ROWS.has(r.id) && new Set(ES_BANK[r.id].o).size === 4 && ES_BANK[r.id].o.every((o, i) => o !== r.o[i]));
const TF_ROW = TF_STATEMENTS.find((r) => ES_BANK[r.id]);
const MISSING = [...BANK.keys()].filter((id) => !ES_BANK[id]);

let store;
let loader;
let fetchSpy;
beforeAll(() => { store = stubGlobals(); });
afterAll(() => { vi.unstubAllGlobals(); __setI18nLiveForTests(false); Q.__setSpanishQuestionsLoaderForTests(null); __resetI18nForTests(); });
beforeEach(async () => {
  __setI18nLiveForTests(false);
  __resetI18nForTests();
  fetchSpy = vi.fn(() => Promise.reject(new Error('no network in tests')));
  vi.stubGlobal('fetch', fetchSpy);
  loader = vi.fn(async () => ES_BANK);
  Q.__setSpanishQuestionsLoaderForTests(loader);
  vi.stubGlobal('navigator', { language: 'en-US', userAgent: 'Mozilla/5.0 (Macintosh)' });
});

describe('an English player never downloads the Spanish bank', () => {
  it('boot, the bank load, a question on screen and its review: no request', async () => {
    await bootLang(store, null);
    expect(getLang()).toBe('en');
    expect(await Q.loadSpanishQuestions()).toBe(false);
    const q = shuffled(ROW);
    const out = html(engine([q]));
    expect(out).toContain(esc(ROW.q));
    expect(Q.questionText.q(q)).toBe(q); // the very same object: nothing is copied for English
    html(React.createElement(WrongAnswersReview, { wrongAnswers: [{ id: ROW.id, q: ROW.q, correct: ROW.o[ROW.a], user: ROW.o[(ROW.a + 1) % 4], hint: ROW.hint }] }));
    expect(loader).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('an explicit biq_lang=en, and a Spanish phone while Spanish is not live: no request', async () => {
    await bootLang(store, 'en');
    vi.stubGlobal('navigator', { language: 'es-ES', userAgent: 'Mozilla/5.0 (iPhone)' });
    await bootLang(store, null);
    expect(getLang()).toBe('en');
    await Q.loadSpanishQuestions();
    html(engine([shuffled(ROW)]));
    expect(loader).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('the file has one importer, as a ?url asset (never a JS chunk, which the service worker would precache for everyone)', () => {
    const files = [];
    (function walk(dir) {
      for (const n of readdirSync(dir)) {
        const p = resolve(dir, n);
        if (statSync(p).isDirectory()) walk(p); else if (/\.(jsx?)$/.test(n)) files.push(p);
      }
    })(SRC);
    const importers = files.filter((f) => readFileSync(f, 'utf8').includes('questions.es.json')).map((f) => relative(SRC, f));
    expect(importers).toEqual(['i18n/questionText.js']);
    const src = readFileSync(resolve(SRC, 'i18n/questionText.js'), 'utf8');
    expect(src).toContain("import esBankUrl from './questions.es.json?url';");
    expect(src).not.toMatch(/import\(\s*['"][^'"]*questions\.es\.json/);
    // The one fetch, behind the language check.
    expect(src).toMatch(/export function loadSpanishQuestions\(\) \{\n {2}if \(getLang\(\) !== 'es'\) return Promise\.resolve\(false\);/);
  });
});

describe('a Spanish player', () => {
  beforeEach(async () => {
    await bootLang(store, 'es');
    expect(await Q.loadSpanishQuestions()).toBe(true);
  });

  it('asks for the table once', () => {
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('reads the quiz question, options and explanation in Spanish, the correct index unchanged', () => {
    const es = ES_BANK[ROW.id];
    const q = shuffled(ROW);
    const shown = Q.questionText.q(q);
    expect(shown.q).toBe(es.q);
    expect(shown.hint).toBe(es.hint);
    expect(shown.o).toEqual([3, 2, 1, 0].map((i) => es.o[i]));
    // Same id, same answer index: the option at `a` is the Spanish of the English answer.
    expect(shown.id).toBe(q.id);
    expect(shown.a).toBe(q.a);
    expect(shown.o[q.a]).toBe(es.o[ROW.a]);
    expect(q.o[q.a]).toBe(ROW.o[ROW.a]); // and the object the engine scores is still English
    const out = html(engine([q]));
    expect(out).toContain(esc(es.q));
    expect(out).not.toContain(esc(ROW.q));
    // Options render in the shuffled order.
    const at = shown.o.map((o) => out.indexOf(esc(o)));
    expect(at.every((i) => i > 0)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
  });

  it('a true-or-false statement too', () => {
    const shown = Q.questionText.q({ ...TF_ROW, _histKey: `tf:${TF_ROW.id}` });
    expect(shown.s).toBe(ES_BANK[TF_ROW.id].q);
    expect(shown.a).toBe(TF_ROW.a);
  });

  it('the missed-answer review prints Spanish; TRUE / FALSE are the quiz words', () => {
    const es = ES_BANK[ROW.id];
    const w = { id: ROW.id, q: ROW.q, correct: ROW.o[ROW.a], user: ROW.o[(ROW.a + 1) % 4], hint: ROW.hint };
    expect(Q.questionText.missed(w)).toEqual({ ...w, q: es.q, correct: es.o[ROW.a], user: es.o[(ROW.a + 1) % 4], hint: es.hint });
    expect(Q.questionText.missed({ id: TF_ROW.id, q: TF_ROW.s, correct: 'TRUE' }).correct).toBe('VERDADERO');
    const out = html(React.createElement(WrongAnswersReview, { wrongAnswers: [w] }));
    expect(out).toContain(esc(es.q));
  });

  it('the answer review finds an id-less record by its English question', () => {
    const a = { q: ROW.q, type: 'mcq', options: shuffled(ROW).o, correctIdx: shuffled(ROW).a, correctText: ROW.o[ROW.a] };
    const shown = Q.questionText.answer(a);
    expect(shown.q).toBe(ES_BANK[ROW.id].q);
    expect(shown.options[a.correctIdx]).toBe(ES_BANK[ROW.id].o[ROW.a]);
    expect(shown.correctIdx).toBe(a.correctIdx);
  });

  it('a question the file lacks prints in English', () => {
    expect(MISSING.length).toBeGreaterThan(0);
    const row = BANK.get(MISSING[0]);
    expect(Q.questionText.q(row)).toBe(row);
    if (row.o) expect(html(engine([row]))).toContain(esc(row.q));
  });

  it('a field the file lacks prints in English, field by field', () => {
    Q.__setSpanishQuestionsLoaderForTests(async () => ({ [ROW.id]: { q: 'Solo la pregunta' } }));
    return Q.loadSpanishQuestions().then(() => {
      const shown = Q.questionText.q(shuffled(ROW));
      expect(shown.q).toBe('Solo la pregunta');
      expect(shown.o).toEqual(shuffled(ROW).o);
      expect(shown.hint).toBe(ROW.hint);
    });
  });

  it('a held row (a translator\'s note in the text) prints in English, whole', () => {
    const held = [...Q.HELD_ES_ROWS][0];
    const row = BANK.get(held);
    expect(Q.questionText.q(row)).toBe(row);
  });

  it('switching back to English prints English at once', async () => {
    await bootLang(store, 'en');
    const q = shuffled(ROW);
    expect(Q.questionText.q(q)).toBe(q);
  });
});

describe('questions.es.json', () => {
  it('every row is a bank row, with the English option count (so `a` indexes both)', () => {
    const notInBank = Object.keys(ES_BANK).filter((id) => !BANK.has(id));
    expect(notInBank).toEqual([]);
    const countDiffers = Object.entries(ES_BANK).filter(([id, r]) => (Array.isArray(BANK.get(id).o) ? BANK.get(id).o.length : 0) !== (Array.isArray(r.o) ? r.o.length : 0)).map(([id]) => id);
    expect(countDiffers).toEqual([]);
    expect(Object.values(ES_BANK).filter((r) => typeof r.q !== 'string' || !r.q.trim()).length).toBe(0);
  });
  it('HELD_ES_ROWS is exactly the rows that still carry a translator\'s note', () => {
    const NOTE = /\bo\[\d\]|\bo: ?\[|\boptions?\b|\bhint\b|\bwrite\b|\band (make|in)\b|\binclude\b|\bshould\b|\btranslat|\bSpanish\b/i;
    const noted = Object.entries(ES_BANK).filter(([id, r]) => {
      const en = BANK.get(id);
      const pairs = [[r.q, en.q ?? en.s], [r.hint || '', en.hint || ''], ...(r.o || []).map((o, i) => [o, en.o[i]])];
      return pairs.some(([es, eng]) => NOTE.test(es) && !NOTE.test(eng));
    }).map(([id]) => id).sort();
    expect(noted).toEqual([...Q.HELD_ES_ROWS].sort());
  });
});
