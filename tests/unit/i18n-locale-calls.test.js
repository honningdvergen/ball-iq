// i18n step 6 (review of step 5, fix c): no date or number in src/ is
// formatted with the device's locale by accident.
//
// Since step 5, ios/App/App/Info.plist lists es in CFBundleLocalizations, so a
// Spanish-set iPhone can report es to the WebView even while I18N_LIVE is
// false. A bare toLocaleDateString() would then print "martes, 21 de octubre"
// in the English app. Every toLocaleString / toLocaleDateString /
// toLocaleTimeString and Intl.*Format call passes a locale: fmtLocale() (the
// active language; in English the device's formats, but 'en-GB' on a Spanish
// device, since step 7) or fmtLocaleEnglish() for text that is English whatever the language
// (the share card), or an explicit tag.
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const { stubGlobals, bootLang } = await import('./i18n-games.harness.js');
const { fmtLocale, fmtLocaleEnglish, __resetI18nForTests } = await import('../../src/i18n/index.js');

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
function srcFiles(dir = SRC) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) out.push(...srcFiles(p));
    else if (/\.(jsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
}
// Comments out (a comment may quote the bad call it replaced), strings kept.
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

// A call with no locale: empty parentheses, `undefined`, or a conditional
// that hands one branch `undefined` (the step 5 HomeScreen idiom).
const BARE = [
  /\.toLocale(?:Date|Time)?String\(\s*(?:\)|undefined\b)/,
  /\.toLocale(?:Date|Time)?String\([^)]*\?\s*undefined\s*:/,
  /\bIntl\.(?:DateTimeFormat|NumberFormat|RelativeTimeFormat|ListFormat|DisplayNames)\(\s*(?:\)|undefined\b)(?!\.resolvedOptions\(\)\.timeZone)/,
];
function bareCalls(src) {
  const hits = [];
  code(src).split('\n').forEach((line, i) => { if (BARE.some((re) => re.test(line))) hits.push(`${i + 1}: ${line.trim()}`); });
  return hits;
}

describe('every locale format call in src/ names its locale', () => {
  it('no bare toLocale*String() or Intl.*Format() anywhere in src/', () => {
    const found = [];
    for (const f of srcFiles()) for (const h of bareCalls(readFileSync(f, 'utf8'))) found.push(`${relative(SRC, f)}:${h}`);
    expect(found).toEqual([]);
  });
  it('the scan catches each bare form (and lets the time-zone lookup through)', () => {
    for (const bad of ['d.toLocaleDateString()', 'n.toLocaleString()', 'd.toLocaleTimeString(undefined, { hour: "2-digit" })', 'd.toLocaleDateString(lang === "en" ? undefined : lang, {})', 'new Intl.NumberFormat().format(3)', 'Intl.DateTimeFormat(undefined, o)']) {
      expect(bareCalls(bad), bad).toHaveLength(1);
    }
    for (const ok of ['d.toLocaleDateString(fmtLocale(), o)', 'n.toLocaleString(fmtLocaleEnglish())', 'd.toLocaleDateString("en-GB", o)', 'Intl.DateTimeFormat().resolvedOptions().timeZone', '// was d.toLocaleDateString()']) {
      expect(bareCalls(ok), ok).toEqual([]);
    }
  });
});

describe('fmtLocale: English never formats in Spanish', () => {
  let store;
  beforeAll(() => { store = stubGlobals(); });
  afterAll(() => { vi.unstubAllGlobals(); __resetI18nForTests(); });
  beforeEach(() => { __resetI18nForTests(); });

  it('English on an English device: the device\'s own formats, exactly as before (undefined)', async () => {
    vi.stubGlobal('navigator', { language: 'en-GB' });
    await bootLang(store, null);
    expect(fmtLocale()).toBeUndefined();
    expect(fmtLocaleEnglish()).toBeUndefined();
  });
  it('English on a Spanish device (the iPhone case): the app\'s British English formats (step 7: was en-US)', async () => {
    vi.stubGlobal('navigator', { language: 'es-ES' });
    await bootLang(store, null);
    expect(fmtLocale()).toBe('en-GB');
    expect(fmtLocaleEnglish()).toBe('en-GB');
    const d = new Date(2026, 9, 20, 12);
    expect(d.toLocaleDateString(fmtLocale(), { weekday: 'long', day: 'numeric', month: 'long' })).toBe('Tuesday 20 October');
    expect((12345).toLocaleString(fmtLocale())).toBe('12,345');
  });
  it('Spanish: Spanish formats; the share card\'s English keeps English formats', async () => {
    vi.stubGlobal('navigator', { language: 'es-ES' });
    await bootLang(store, 'es');
    expect(fmtLocale()).toBe('es');
    expect(fmtLocaleEnglish()).toBe('en-GB');
    expect(new Date(2026, 9, 20, 12).toLocaleDateString(fmtLocale(), { weekday: 'long', day: 'numeric', month: 'long' })).toBe('martes, 20 de octubre');
  });
});
