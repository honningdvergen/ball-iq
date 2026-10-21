// i18n core (src/i18n/index.js): t(), interpolation, plurals, the English
// fallback, language choice (biq_lang override > device) and <html lang>.
// The string tables are replaced with fixtures here so these rules are tested
// independently of the real copy; i18n-pilot.test.js covers the real tables.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// index.js imports en.home.js, Home's eager slice; the full en.js registers
// itself when a lazy screen imports it (i18n step 5), so it is not stubbed.
vi.mock('../../src/i18n/en.home.js', () => ({
  default: {
    'tab.home': 'Home',
    'only.english': 'Only in English',
    'hello.name': 'Hello, {name}!',
    'score.line': '{sc}/{n} right',
    'goals_one': '{count} goal',
    'goals_other': '{count} goals',
    'lives_other': '{count} lives', // no _one form: a count of 1 falls back to _other
  },
}));
vi.mock('../../src/i18n/es.js', () => ({
  default: {
    'tab.home': 'Inicio',
    'hello.name': '¡Hola, {name}!',
    'goals_one': '{count} gol',
    'goals_other': '{count} goles',
    // 'only.english' and 'score.line' deliberately missing: they must fall back to English.
  },
}));

const i18n = await import('../../src/i18n/index.js');
const { t, setLang, getLang, initI18n, loadLang, detectDeviceLang, resolveLang, readStoredLang, subscribe, LANG_STORAGE_KEY, __resetI18nForTests } = i18n;

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _map: m,
  };
}
let store;
let doc;
function env({ stored, device = 'en-GB' } = {}) {
  store = fakeStorage(stored ? { [LANG_STORAGE_KEY]: stored } : {});
  doc = { documentElement: { lang: 'en' } };
  vi.stubGlobal('localStorage', store);
  vi.stubGlobal('navigator', { language: device });
  vi.stubGlobal('document', doc);
}

beforeEach(() => { __resetI18nForTests(); env(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('t(): interpolation and plurals', () => {
  it('returns the English string for a plain key', () => {
    expect(t('tab.home')).toBe('Home');
  });
  it('fills {name}-style placeholders, several per string, numbers included', () => {
    expect(t('hello.name', { name: 'Alex' })).toBe('Hello, Alex!');
    expect(t('score.line', { sc: 6, n: 7 })).toBe('6/7 right');
  });
  it('leaves a placeholder with no value as written — never "undefined" or "null"', () => {
    expect(t('hello.name', {})).toBe('Hello, {name}!');
    expect(t('hello.name', { name: undefined })).toBe('Hello, {name}!');
    expect(t('hello.name', { name: null })).not.toContain('null');
    expect(t('hello.name', { name: 0 })).toBe('Hello, 0!');
  });
  it('picks _one / _other from count, and falls back to _other when a form is missing', () => {
    expect(t('goals', { count: 1 })).toBe('1 goal');
    expect(t('goals', { count: 0 })).toBe('0 goals');
    expect(t('goals', { count: 5 })).toBe('5 goals');
    expect(t('lives', { count: 1 })).toBe('1 lives');
  });
  it('a key missing everywhere comes back as the key (a programmer error, never undefined)', () => {
    expect(t('no.such.key')).toBe('no.such.key');
  });
});

describe('fallback to English', () => {
  it('a key missing from es serves the English string, not the key or "undefined"', async () => {
    env({ stored: 'es' });
    await initI18n();
    expect(getLang()).toBe('es');
    expect(t('tab.home')).toBe('Inicio');
    expect(t('only.english')).toBe('Only in English');
    expect(t('score.line', { sc: 3, n: 7 })).toBe('3/7 right');
    for (const k of ['only.english', 'score.line']) {
      expect(t(k)).not.toBe(k);
      expect(t(k)).not.toContain('undefined');
    }
  });
  it('Spanish plurals and interpolation use the Spanish table (a "many" category falls to _other)', async () => {
    env({ stored: 'es' });
    await initI18n();
    expect(t('hello.name', { name: 'Alex' })).toBe('¡Hola, Alex!');
    expect(t('goals', { count: 1 })).toBe('1 gol');
    expect(t('goals', { count: 2 })).toBe('2 goles');
    expect(t('goals', { count: 1000000 })).toBe('1000000 goles');
  });
  it('before the Spanish table has arrived, Spanish mode still renders English (never blank)', () => {
    env({ stored: 'es' });
    setLang('es'); // load starts, has not resolved yet
    expect(getLang()).toBe('es');
    expect(t('tab.home')).toBe('Home');
  });
});

describe('not live yet (I18N_LIVE = false until step 4)', () => {
  it('a Spanish device stays English; only an explicit biq_lang switches', () => {
    expect(i18n.I18N_LIVE).toBe(false);
    env({ device: 'es-ES' });
    expect(resolveLang()).toBe('en');
    env({ stored: 'es', device: 'en-GB' });
    expect(resolveLang()).toBe('es');
  });
});

describe('language choice', () => {
  it('device language: "es…" is Spanish, everything else (or nothing) English', () => {
    for (const l of ['es', 'es-ES', 'es-MX', 'es-419', 'ES-ar']) expect(detectDeviceLang({ language: l }), l).toBe('es');
    for (const l of ['en-GB', 'en-US', 'pt-BR', 'fr', 'eu-ES', 'ca-ES', '', undefined]) expect(detectDeviceLang({ language: l }), String(l)).toBe('en');
    expect(detectDeviceLang(undefined)).toBe('en');
  });
  it('with no biq_lang, the device decides', () => {
    env({ device: 'es-MX' });
    expect(readStoredLang()).toBe(null);
    expect(resolveLang(true)).toBe('es');
    env({ device: 'en-US' });
    expect(resolveLang(true)).toBe('en');
  });
  it('an explicit biq_lang wins over the device, both ways', () => {
    env({ stored: 'en', device: 'es-ES' });
    expect(resolveLang(true)).toBe('en');
    env({ stored: 'es', device: 'en-GB' });
    expect(resolveLang(true)).toBe('es');
  });
  it('a junk biq_lang is ignored and the device decides', () => {
    env({ stored: 'klingon', device: 'es-ES' });
    expect(readStoredLang()).toBe(null);
    expect(resolveLang(true)).toBe('es');
  });
  it('storage that throws (private mode) falls back to the device', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } });
    vi.stubGlobal('navigator', { language: 'es-ES' });
    expect(resolveLang(true)).toBe('es');
    expect(() => setLang('en')).not.toThrow();
    expect(getLang()).toBe('en');
  });
});

describe('initI18n / setLang', () => {
  it('initI18n sets <html lang> to the chosen language', async () => { i18n.__setI18nLiveForTests(true); try {
    env({ device: 'es-AR' });
    await initI18n();
    expect(doc.documentElement.lang).toBe('es');
    env({ device: 'en-GB' });
    await initI18n();
    expect(doc.documentElement.lang).toBe('en'); } finally { i18n.__setI18nLiveForTests(false); }
  });
  it('setLang stores the choice, updates <html lang> and notifies subscribers at once', async () => {
    await initI18n();
    const seen = [];
    const off = subscribe(() => seen.push(getLang()));
    setLang('es');
    expect(store.getItem(LANG_STORAGE_KEY)).toBe('es');
    expect(doc.documentElement.lang).toBe('es');
    expect(seen[0]).toBe('es');
    await loadLang('es');
    expect(seen.length).toBeGreaterThanOrEqual(2); // and again when the table landed
    expect(t('tab.home')).toBe('Inicio');
    setLang('en');
    expect(store.getItem(LANG_STORAGE_KEY)).toBe('en');
    expect(t('tab.home')).toBe('Home');
    off();
  });
  it('setLang(null) drops the override and follows the device again', () => { i18n.__setI18nLiveForTests(true); try {
    env({ stored: 'en', device: 'es-ES' });
    setLang(null);
    expect(store.getItem(LANG_STORAGE_KEY)).toBe(null);
    expect(getLang()).toBe('es'); } finally { i18n.__setI18nLiveForTests(false); }
  });
  it('setLang ignores an unknown language', () => {
    setLang('en');
    setLang('de');
    expect(getLang()).toBe('en');
    expect(store.getItem(LANG_STORAGE_KEY)).toBe('en');
  });
  it('English boot resolves at once and loads no other table', async () => {
    env({ device: 'en-GB' });
    await initI18n();
    expect(i18n.isLangLoaded('es')).toBe(false);
  });
});
