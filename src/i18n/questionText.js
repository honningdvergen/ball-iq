// The question bank in Spanish (i18n step 5): DISPLAY ONLY.
//
//   const loc = useQuestionText();   // in a component: re-renders when the table lands
//   const shown = loc.q(question);   // the same object in English; a copy with q/s, o, hint in Spanish
//
// src/i18n/questions.es.json maps a question id to { q, o?, hint? }, where `q`
// is the question (or a true/false row's statement `s`), and `o` has the
// English row's option count and ORDER. The game never sees it:
//   • the question objects the engines score, record, save, share and send
//     stay English. Only the text a component prints goes through here, and
//     answer indexes, ids, the Daily 7 draw and the leak table cannot change;
//   • an option is matched by its English text against the bank row's own
//     `o`, so the per-game option shuffle needs nothing from this file;
//   • any id, or any single field, the file lacks prints the English.
//
// ⚠️ ONLY A SPANISH PLAYER DOWNLOADS IT. The file is 3 MB, so it is not a JS
// chunk: the service worker precaches every .js in dist/assets for every
// visitor (scripts/gen-sw-precache.mjs), which would put it in each English
// install. `?url` makes Vite emit it as a hashed .json asset instead, which is
// not precached, and fetch() asks for it only while the language is 'es'.
// tests/unit/i18n-question-text.test.js pins both.
import { useEffect, useSyncExternalStore } from 'react';
import esBankUrl from './questions.es.json?url';
import { getLang, subscribe as subscribeLang, t } from './index.js';

// Rows whose Spanish still carries a translator's note in the text (an
// instruction, or the four options pasted into one). Each prints in English,
// whole, until the row is fixed in questions.es.json; the test lists the rows
// that still look like this, so a fixed row has to come off here.
// Empty since 21 Oct 2026: the nine found by step 5 were fixed by hand.
export const HELD_ES_ROWS = new Set([]);

const fetchBank = () => fetch(esBankUrl).then((r) => {
  if (!r.ok) throw new Error(`questions.es.json ${r.status}`);
  return r.json();
});
let loader = fetchBank;

let es = null;        // id -> { q, o?, hint? }
let english = null;   // id -> the bank's own row (its `o` in authored order)
let idByText = null;  // English question/statement text -> id (records that kept no id)
let inflight = null;
let pastCap = false;            // a quiz stopped waiting and opened in English (ES_BANK_WAIT_MS)
const shownEnglish = new Set(); // questions printed in English past the cap, this session
let version = 0;
const listeners = new Set();
function bump() {
  version++;
  for (const fn of listeners) { try { fn(); } catch { /* a listener must not break the others */ } }
}

/** True when questions should print in Spanish and the table is here. */
const active = () => es !== null && getLang() === 'es';

/**
 * Fetch the Spanish bank. Does nothing unless the language is Spanish.
 * Resolves (never rejects) once it is in, or has failed: a failure leaves the
 * questions in English and the next call tries again.
 */
export function loadSpanishQuestions() {
  if (getLang() !== 'es') return Promise.resolve(false);
  if (es) return Promise.resolve(true);
  if (!inflight) {
    inflight = loader()
      .then((table) => { es = table && typeof table === 'object' ? table : null; if (es) pastCap = false; bump(); return !!es; })
      .catch(() => false)
      .finally(() => { inflight = null; });
  }
  return inflight;
}
// A switch to Spanish mid-session fetches it then; a switch back just prints English.
subscribeLang(() => { if (getLang() === 'es' && !es) loadSpanishQuestions(); bump(); });

// ⚠️ A QUIZ NEVER WAITS LONGER THAN THIS FOR THE TABLE (step 6, the review of
// step 5). questions-loader.js used to put the fetch in the bank's Promise.all,
// so a slow or hanging connection held every Spanish quiz on its loading
// screen with no end. Now the bank waits up to ES_BANK_WAIT_MS; past that the
// quiz opens in English and the fetch carries on. A question that printed in
// English while the table was late stays English when it lands (no switching
// under the player's eyes); the next question is Spanish.
export const ES_BANK_WAIT_MS = 2500;

/**
 * loadSpanishQuestions(), but resolved after `ms` at the latest (false: the
 * table is late, questions print in English until it lands). Never rejects.
 */
export function loadSpanishQuestionsCapped(ms = ES_BANK_WAIT_MS) {
  const load = loadSpanishQuestions();
  if (es || getLang() !== 'es') return load;
  return new Promise((done) => {
    const timer = setTimeout(() => { if (!es) pastCap = true; done(false); }, ms);
    load.then((ok) => { clearTimeout(timer); done(ok); });
  });
}

// The English bank, for the answer review's id-less records (matched by their
// English text). questions-loader.js registers its loadQuestions() here; this
// file cannot import it (it imports this file).
let bankLoader = null;
export function registerBankLoader(fn) { bankLoader = fn; }

/**
 * questions-loader.js hands over the bank as it resolves, so an option can be
 * matched to its authored position and an id-less record to its row. The
 * maps are built on the first Spanish lookup, so English pays nothing.
 */
let bank = null;
export function indexEnglishBank(b) {
  bank = b || null;
  english = null;
  idByText = null;
  bump();
}
function buildMaps() {
  if (english || !bank) return;
  const { QB = [], TF_STATEMENTS = [] } = bank;
  english = new Map();
  idByText = new Map();
  const dup = new Set();
  for (const row of [...QB, ...TF_STATEMENTS]) {
    if (!row || !row.id) continue;
    english.set(row.id, row);
    const text = typeof row.q === 'string' ? row.q : row.s;
    if (typeof text !== 'string') continue;
    if (idByText.has(text)) dup.add(text); else idByText.set(text, row.id);
  }
  for (const text of dup) idByText.delete(text); // ambiguous: print it as it is
}

function rowFor(id, text) {
  if (!active()) return null;
  buildMaps();
  const key = id != null && es[id] ? id : (idByText && typeof text === 'string' ? idByText.get(text) : undefined);
  if (key == null || HELD_ES_ROWS.has(key)) return null;
  const row = es[key];
  return row ? { key, row } : null;
}
const str = (v) => typeof v === 'string' && v.trim() !== '';

/** One option, English text in, the Spanish of the same authored option out. */
function optionFor(key, row, text) {
  if (!Array.isArray(row.o) || typeof text !== 'string') return text;
  const authored = english && english.get(key);
  const i = authored && Array.isArray(authored.o) && authored.o.length === row.o.length ? authored.o.indexOf(text) : -1;
  return i >= 0 && str(row.o[i]) ? row.o[i] : text;
}

/** A bank question as the player sees it. English: the very same object. */
function locQuestion(q) {
  if (!q || typeof q !== 'object') return q;
  const text = typeof q.q === 'string' ? q.q : q.s;
  if (getLang() === 'es') {
    const seen = q.id ?? text;
    if (!es) { if (pastCap && seen != null) shownEnglish.add(seen); return q; }
    if (shownEnglish.has(seen)) return q;
  }
  const hit = rowFor(q.id, text);
  if (!hit) return q;
  const { key, row } = hit;
  const out = { ...q };
  if (str(row.q)) {
    if (typeof q.q === 'string') out.q = row.q;
    if (typeof q.s === 'string') out.s = row.q;
  }
  if (str(row.hint) && typeof q.hint === 'string') out.hint = row.hint;
  if (Array.isArray(q.o)) out.o = q.o.map((o) => optionFor(key, row, o));
  return out;
}

/**
 * A missed-answer record ({ id, q, correct, user?, hint }, components/
 * WrongAnswersReview.jsx). `correct` and `user` are option texts, or TRUE /
 * FALSE for a true-or-false row.
 */
function locMissed(w) {
  if (!w || typeof w !== 'object') return w;
  const hit = rowFor(w.id, w.q);
  if (!hit) return w;
  const { key, row } = hit;
  const tf = (v) => (v === 'TRUE' ? t('quiz.true') : v === 'FALSE' ? t('quiz.false') : null);
  const opt = (v) => tf(v) ?? optionFor(key, row, v);
  const out = { ...w };
  if (str(row.q)) out.q = row.q;
  if (str(row.hint) && typeof w.hint === 'string') out.hint = row.hint;
  if (typeof w.correct === 'string') out.correct = opt(w.correct);
  if (typeof w.user === 'string') out.user = opt(w.user);
  return out;
}

/**
 * An answer-review record ({ q, type, options, correctText, … }, App.jsx
 * ReviewQuestionCard). It keeps no id, so its row is found by its English
 * question text. TRUE / FALSE options are the card's own labels, not the bank's.
 */
function locAnswer(a) {
  if (!a || typeof a !== 'object') return a;
  const hit = rowFor(a.id, a.q);
  if (!hit) return a;
  const { key, row } = hit;
  const out = { ...a };
  if (str(row.q)) out.q = row.q;
  if (a.type === 'mcq' && Array.isArray(a.options)) out.options = a.options.map((o) => optionFor(key, row, o));
  return out;
}

export const questionText = { q: locQuestion, missed: locMissed, answer: locAnswer };

function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const getVersion = () => version;

/** React: the display helpers, with the component re-rendering when the table or the language changes. */
export function useQuestionText() {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  // A screen that prints stored questions (History's review) can open before
  // any bank load has asked for the table, or for the English bank its
  // id-less records are found in (step 6: straight after launch the review
  // printed English); for English this does nothing.
  const lang = getLang();
  useEffect(() => {
    if (lang !== 'es') return;
    if (!es) loadSpanishQuestions();
    if (!bank && bankLoader) Promise.resolve().then(bankLoader).catch(() => { /* offline: English, as before */ });
  }, [lang]);
  return questionText;
}

/** Tests only: swap the fetch (resolve to the table) and forget a loaded table. */
export function __setSpanishQuestionsLoaderForTests(fn) { loader = fn || fetchBank; es = null; inflight = null; pastCap = false; shownEnglish.clear(); bump(); }
