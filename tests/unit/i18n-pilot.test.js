// i18n step 1 pilot, against the REAL tables (src/i18n/en.js, es.js):
//   • English output of the pilot strings is byte-identical to before i18n.
//   • The pilot renders in Spanish when biq_lang=es.
//   • Every es key exists in en, with the same {placeholders}.
//   • Every literal t('…') key used in src/ exists in en.
//   • es.js is only ever loaded lazily (Home's JS budget).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import en from '../../src/i18n/en.js';
import es from '../../src/i18n/es.js';
import * as i18n from '../../src/i18n/index.js';
import { t, initI18n, getLang, LANG_STORAGE_KEY, __resetI18nForTests } from '../../src/i18n/index.js';
import { HomeGreeting, greetingKey } from '../../src/components/HomeGreeting.jsx';

const SRC = fileURLToPath(new URL('../../src', import.meta.url));
const read = (p) => readFileSync(join(SRC, p), 'utf8');
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(f)) out.push(p);
  }
  return out;
}

function boot(stored, device = 'en-GB') {
  const m = new Map(stored ? [[LANG_STORAGE_KEY, stored]] : []);
  vi.stubGlobal('localStorage', { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) });
  vi.stubGlobal('navigator', { language: device });
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
  return initI18n();
}
const at = (h, min = 0) => new Date(2026, 9, 20, h, min);
const greet = (h, min) => renderToStaticMarkup(React.createElement(HomeGreeting, { now: at(h, min) }));

beforeEach(() => { __resetI18nForTests(); });
afterEach(() => { vi.unstubAllGlobals(); });

// The exact markup HomeScreen.jsx rendered before i18n (main f02c6bcd): the
// inline <div className="hg-greet" style={{…}}>{greeting}</div>.
const BEFORE = (text) => `<div class="hg-greet" style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:var(--t1);line-height:1.1;max-width:100%">${text}</div>`;
// …and the hour rule it used: h<5 "Still up", h<12 morning, h<18 afternoon, else evening.
const BEFORE_TEXT = (h) => (h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');

describe('English is byte-identical for the pilot strings', () => {
  it('the Home greeting renders exactly the pre-i18n markup at every hour', async () => {
    await boot(null, 'en-GB');
    for (let h = 0; h < 24; h++) expect(greet(h, 30), `hour ${h}`).toBe(BEFORE(BEFORE_TEXT(h)));
    expect(greet(4, 59)).toBe(BEFORE('Still up'));
    expect(greet(5, 0)).toBe(BEFORE('Good morning'));
    expect(greet(17, 59)).toBe(BEFORE('Good afternoon'));
    expect(greet(18, 0)).toBe(BEFORE('Good evening'));
  });
  it('an explicit biq_lang=en on a Spanish phone is English too', async () => {
    await boot('en', 'es-ES');
    expect(getLang()).toBe('en');
    expect(greet(9)).toBe(BEFORE('Good morning'));
    expect(t('tab.home')).toBe('Home');
  });
  it('the tab bar labels are the four strings it printed before', async () => {
    await boot(null, 'en-US');
    expect(['tab.home', 'tab.online', 'tab.daily', 'tab.profile'].map((k) => t(k))).toEqual(['Home', 'Multiplayer', 'History', 'Profile']);
  });
  it('App.jsx builds the tab bar from those keys, in the same order', () => {
    const app = read('App.jsx');
    const at0 = app.indexOf('<nav className="tab-bar"');
    expect(at0).toBeGreaterThan(-1);
    const bar = app.slice(at0, app.indexOf('</nav>', at0));
    const items = [...bar.matchAll(/\{ id:"(\w+)",\s+Icon: \w+,\s+label:t\("(tab\.\w+)"\)/g)].map((m) => [m[1], m[2]]);
    expect(items).toEqual([['home', 'tab.home'], ['online', 'tab.online'], ['daily', 'tab.daily'], ['profile', 'tab.profile']]);
    expect(bar).not.toMatch(/label:"/);
    expect(app).toMatch(/const t = useT\(\);/);
  });
  it('HomeScreen renders the greeting through <HomeGreeting />, with no copy of the old hour logic left', () => {
    const home = read('screens/HomeScreen.jsx');
    expect(home).toContain('<HomeGreeting />');
    expect(home).not.toMatch(/return "(Good (morning|afternoon|evening)|Still up)"/);
    expect(home).not.toMatch(/homeGreetingBase/);
  });
});

describe('the pilot renders in Spanish when biq_lang=es', () => {
  it('greeting, in Spanish, with the Spanish evening boundary (20:00)', async () => {
    await boot('es', 'en-GB');
    expect(getLang()).toBe('es');
    expect(greet(2)).toBe(BEFORE('Trasnochando'));
    expect(greet(9)).toBe(BEFORE('Buenos días'));
    expect(greet(15)).toBe(BEFORE('Buenas tardes'));
    expect(greet(19, 30)).toBe(BEFORE('Buenas tardes'));
    expect(greet(20)).toBe(BEFORE('Buenas noches'));
    expect(greetingKey(19, 'en')).toBe('home.greeting.evening');
    expect(greetingKey(19, 'es')).toBe('home.greeting.afternoon');
  });
  it('tab bar labels, in Spanish', async () => {
    await boot('es');
    expect(['tab.home', 'tab.online', 'tab.daily', 'tab.profile'].map((k) => t(k))).toEqual(['Inicio', 'Multijugador', 'Historial', 'Perfil']);
  });
  it('a Spanish phone with no biq_lang gets Spanish too, and <html lang="es">', async () => { i18n.__setI18nLiveForTests(true); try {
    await boot(null, 'es-MX');
    expect(getLang()).toBe('es');
    expect(document.documentElement.lang).toBe('es');
    expect(t('tab.profile')).toBe('Perfil'); } finally { i18n.__setI18nLiveForTests(false); }
  });
});

describe('the tables', () => {
  const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  it('every key in es exists in en', () => {
    const missing = Object.keys(es).filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });
  it('every value is a non-empty string, and es keeps en\'s {placeholders}', () => {
    for (const [k, v] of Object.entries(en)) expect(typeof v === 'string' && v.trim().length > 0, `en ${k}`).toBe(true);
    for (const [k, v] of Object.entries(es)) {
      expect(typeof v === 'string' && v.trim().length > 0, `es ${k}`).toBe(true);
      expect(placeholders(v), `es ${k} placeholders`).toEqual(placeholders(en[k]));
    }
  });
  it('plural keys come as a set: any _one has an _other', () => {
    for (const table of [en, es]) for (const k of Object.keys(table)) {
      if (k.endsWith('_one')) expect(table, k).toHaveProperty([k.replace(/_one$/, '_other')]);
    }
  });
  it('every literal t("…") key used in src/ exists in en', () => {
    // Callers of the i18n core (src/i18n/ itself is skipped: its doc comment shows example keys).
    const users = walk(SRC).filter((p) => !relative(SRC, p).startsWith('i18n') && /i18n\/index\.js['"]/.test(readFileSync(p, 'utf8')));
    expect(users.length).toBeGreaterThanOrEqual(3);
    const unknown = [];
    for (const p of users) {
      for (const m of readFileSync(p, 'utf8').matchAll(/\bt\(\s*["']([\w.]+)["']/g)) {
        if (!(m[1] in en) && !(`${m[1]}_other` in en)) unknown.push(`${relative(SRC, p)}: ${m[1]}`);
      }
    }
    expect(unknown).toEqual([]);
  });
});

describe('Home budget: Spanish is lazy', () => {
  it('nothing in src/ imports es.js statically; i18n/index.js loads it with import()', () => {
    const offenders = [];
    for (const p of walk(SRC)) {
      const src = readFileSync(p, 'utf8');
      if (/(?:from\s*|import\s*)["'][^"']*i18n\/es(?:\.js)?["']/.test(src) || /from\s*["']\.\/es(?:\.js)?["']/.test(src)) offenders.push(relative(SRC, p));
    }
    expect(offenders).toEqual([]);
    expect(read('i18n/index.js')).toMatch(/import\('\.\/es\.js'\)/);
  });
  it('the language row is in Settings (lazy screen), reusing the settings-row styles', () => {
    const s = read('screens/SettingsScreen.jsx');
    expect(s).toMatch(/<div className="sr-label">\{t\("settings\.language"\)\}<\/div>/);
    expect(s).toContain('<SettingsLangSwitch label={t("settings.language")} />');
  });
});
