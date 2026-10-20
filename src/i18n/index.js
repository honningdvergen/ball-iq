// i18n core — the whole translation runtime, hand-written on purpose (no
// dependency: this file and en.js are the only i18n bytes on Home's eager path,
// and the Home JS budget gate in scripts/audit-home-budget.mjs is a deploy gate).
//
//   import { t, useT } from '../i18n/index.js';
//   const t = useT();                        // in a component: re-renders on a language change
//   t('tab.home')                            // "Home" / "Inicio"
//   t('home.challengedBy', { name })         // {name}-style interpolation
//   t('home.streakDays', { count: 3 })       // plural: picks home.streakDays_one / _other
//
// RULES (the tests in tests/unit/i18n-*.test.js pin them):
//   • en.js is the source of truth. Every key lives there first; es.js may lag.
//   • A key missing from the active table falls back to English, never to the
//     key and never to "undefined". English users therefore cannot be affected
//     by an incomplete translation.
//   • es.js is loaded LAZILY (dynamic import) and only for a Spanish player, so
//     English players download none of it.
//   • Language = the explicit choice in localStorage `biq_lang` ('en' | 'es'),
//     else the device: navigator.language starting with "es" is Spanish,
//     everything else English. Inside the Capacitor WebView that follows the
//     phone's language. <html lang> is kept in step.
import { useSyncExternalStore } from 'react';
import en from './en.js';

export const LANGS = ['en', 'es'];
// ⚠️ NOT LIVE YET (review, 20 Oct 2026). Until every screen is translated
// (steps 2-4), a Spanish phone must see today's English app, not Spanish tabs
// over English screens. With this false the device language is ignored and the
// Settings row is hidden; an explicit biq_lang='es' (a tester's own choice) still
// works. Step 4 flips it to true in the same PR that finishes the strings.
export const I18N_LIVE = false;
let live = I18N_LIVE;
/** Tests only: exercise the behaviour step 4 turns on. */
export function __setI18nLiveForTests(v) { live = !!v; }
export const DEFAULT_LANG = 'en';
export const LANG_STORAGE_KEY = 'biq_lang';
// Endonyms: each language is named in itself, in every language, so a player
// who switched by mistake can still find their way back. Not translated.
export const LANG_NAMES = { en: 'English', es: 'Español' };

// The non-English tables. Each is its own chunk; nothing imports them statically.
const LOADERS = {
  es: () => import('./es.js'),
};
// How long boot waits for a non-English table before painting in English. On
// native the chunk is a local file and arrives in a frame; this only matters on
// a slow web connection, where the strings fill in when the chunk lands.
const BOOT_WAIT_MS = 2000;

const tables = { en };
const inflight = {};
let lang = DEFAULT_LANG;
let version = 0;
let generation = 0; // bumped by the test reset so a load started before it cannot land after it
const listeners = new Set();

const isLang = (l) => LANGS.includes(l);

function emit() {
  version++;
  for (const fn of listeners) { try { fn(); } catch { /* a listener must not break the others */ } }
}

function applyHtmlLang(l) {
  try { if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = l; } catch { /* noop */ }
}

/** The explicit choice in localStorage, or null when there is none (or it is junk). */
export function readStoredLang() {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    return isLang(v) ? v : null;
  } catch { return null; }
}

/** The device language: "es…" → 'es', anything else (or nothing) → 'en'. */
export function detectDeviceLang(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  const raw = (nav && typeof nav.language === 'string') ? nav.language : '';
  return raw.toLowerCase().startsWith('es') ? 'es' : DEFAULT_LANG;
}

/** Explicit choice wins; otherwise the device. */
export function resolveLang(isLive = live) {
  return readStoredLang() || (isLive ? detectDeviceLang() : DEFAULT_LANG);
}

export function getLang() { return lang; }

/** True when the active language's table has arrived (always true for English). */
export function isLangLoaded(l = lang) { return !!tables[l]; }

/** Fetch a language table. Resolves true when it is available, false if the load failed. */
export function loadLang(l) {
  if (tables[l]) return Promise.resolve(true);
  if (!LOADERS[l]) return Promise.resolve(false);
  if (!inflight[l]) {
    const gen = generation;
    inflight[l] = LOADERS[l]()
      .then((m) => {
        if (gen !== generation) return false;
        tables[l] = m.default || m;
        if (l === lang) emit();
        return true;
      })
      .catch(() => false) // offline / stale chunk: stay on the English fallback
      .finally(() => { if (gen === generation) delete inflight[l]; });
  }
  return inflight[l];
}

/**
 * Boot: pick the language and start loading its table. The returned promise
 * always resolves (never rejects): when the table arrives, or after
 * BOOT_WAIT_MS, whichever is first. English resolves at once.
 */
export function initI18n({ waitMs = BOOT_WAIT_MS } = {}) {
  lang = resolveLang();
  applyHtmlLang(lang);
  emit();
  if (tables[lang]) return Promise.resolve();
  return new Promise((done) => {
    const timer = setTimeout(done, waitMs);
    loadLang(lang).then(() => { clearTimeout(timer); done(); });
  });
}

/**
 * Change language at runtime ('en' | 'es'), or pass null to drop the explicit
 * choice and follow the device again. Components using useT()/useLang()
 * re-render at once; a lazy table fills in when it arrives.
 */
export function setLang(next) {
  try {
    if (next == null) localStorage.removeItem(LANG_STORAGE_KEY);
    else if (isLang(next)) localStorage.setItem(LANG_STORAGE_KEY, next);
    else return lang;
  } catch { /* storage blocked: still switch for this session */ }
  const target = next == null ? (live ? detectDeviceLang() : DEFAULT_LANG) : next;
  if (target !== lang) {
    lang = target;
    applyHtmlLang(lang);
    emit();
  }
  loadLang(lang);
  return lang;
}

const pluralRules = {};
function pluralCategory(n) {
  try {
    if (!pluralRules[lang]) pluralRules[lang] = new Intl.PluralRules(lang);
    return pluralRules[lang].select(n);
  } catch {
    return n === 1 ? 'one' : 'other';
  }
}

function lookup(key) {
  const active = tables[lang];
  const hit = active && active[key];
  if (typeof hit === 'string') return hit;
  const base = en[key];
  return typeof base === 'string' ? base : undefined;
}

function interpolate(s, vars) {
  // A placeholder with no value is left as written ({name}), never "undefined".
  return s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
}

/**
 * Translate `key` into the active language.
 * vars: values for {placeholders}. A numeric `count` also selects the plural
 * form `${key}_one` / `${key}_other` (CLDR categories via Intl.PluralRules;
 * a category the table lacks falls back to `_other`, then to the bare key).
 * A key missing everywhere returns the key itself — a programmer error that
 * tests/unit/i18n-core.test.js makes impossible for literal keys in src/.
 */
export function t(key, vars) {
  let s;
  if (vars && typeof vars.count === 'number') {
    s = lookup(`${key}_${pluralCategory(vars.count)}`);
    if (s === undefined) s = lookup(`${key}_other`);
  }
  if (s === undefined) s = lookup(key);
  if (s === undefined) return key;
  return vars ? interpolate(s, vars) : s;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const getVersion = () => version;

/** React: the active language; the component re-renders when it (or its table) changes. */
export function useLang() {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return lang;
}

/** React: `t`, with the component subscribed to language changes. */
export function useT() {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return t;
}

/** Tests only: back to a clean English state with no loaded tables. */
export function __resetI18nForTests() {
  generation++;
  lang = DEFAULT_LANG;
  for (const k of Object.keys(inflight)) delete inflight[k];
  for (const k of Object.keys(tables)) if (k !== 'en') delete tables[k];
  for (const k of Object.keys(pluralRules)) delete pluralRules[k];
  emit();
}
