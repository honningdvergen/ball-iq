// ⚠️ THE SHELL AROUND A TRANSLATED PAGE WAS ENGLISH FOR ITS WHOLE LIFE.
//
// Until 2026-09-15 all 49 localised pages wrapped Spanish, Italian, Turkish …
// content in "Today / Football games / Clubs / Quizzes / Lists / Sign in" and a
// search box saying "Find your club or league". Every check read the CONTENT.
// This file checks the FURNITURE.
//
// It also gates a claim. Every localised FAQ and hub said the questions were
// "written by hand / by fans, never generated automatically". That is false —
// the packs are drafted by a research pipeline and then verified twice — and it
// reached 30+ places across 8 languages because the first Spanish page was the
// template every later locale was copied from. A fix without a gate would be
// re-copied onto the next locale.
import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { SHELL_STRINGS, SHELL_KEYS, shellStrings } from '../../scripts/seo/shell-i18n.mjs';
import { shellHeader, shellFooter } from '../../scripts/seo/shell.mjs';

const SITE = { base: 'https://balliq.app', appStore: 'https://apps.apple.com/x', playStore: 'https://play.google.com/x' };
const SEO = resolve(__dirname, '../../scripts/seo');

// Every language that actually has pages, read from the locale data files
// rather than listed here — a ninth locale must not be able to skip this test.
const PAGE_LANGS = readdirSync(SEO)
  .map((f) => f.match(/^clubs-([a-z]{2})\.mjs$/))
  .filter(Boolean)
  .map((m) => m[1])
  .sort();

describe('shell chrome is translated for every language that has pages', () => {
  it('found the locale files', () => {
    expect(PAGE_LANGS.length).toBeGreaterThanOrEqual(8);
  });

  for (const lang of PAGE_LANGS) {
    it(`${lang}: carries every key, non-empty`, () => {
      const t = SHELL_STRINGS[lang];
      expect(t, `no SHELL_STRINGS.${lang} — its pages would render an English shell`).toBeTruthy();
      const missing = SHELL_KEYS.filter((k) => typeof t[k] !== 'string' || !t[k].trim());
      expect(missing).toEqual([]);
      // shellStrings() falls back to English WHOLE when anything is missing, so
      // resolving to itself is what proves the page will not silently go English.
      expect(shellStrings(lang)).toBe(t);
    });

    it(`${lang}: header shows none of the English controls`, () => {
      const h = shellHeader(SITE, '', lang);
      expect(h).not.toContain('placeholder="Find your club or league"');
      expect(h).not.toMatch(/>Sign in</);
      expect(h).not.toMatch(/>Football games</);
    });

    // French and Italian apostrophes are exactly what breaks a single-quoted JS
    // string, and the finder's dropdown text is baked into one. The module being
    // valid says nothing about the script it emits.
    it(`${lang}: every emitted <script> still parses`, () => {
      const html = shellHeader(SITE, '', lang) + shellFooter(SITE, lang);
      const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      expect(scripts.length).toBeGreaterThan(0);
      for (const src of scripts) expect(() => new vm.Script(src)).not.toThrow();
    });
  }

  it('an unknown language gets the English shell, not a broken one', () => {
    expect(shellStrings('xx')).toBe(SHELL_STRINGS.en);
  });
});

describe('no page claims the questions are hand-written or never automated', () => {
  // One pattern per language. Matched against string content only — code
  // comments are allowed to discuss the claim, published copy is not.
  const CLAIMS = [
    /\bwritten (?:and [a-z-]+ )?by (?:hand|fans|football fans)\b/i,
    /\b(?:checked|fact-checked) by hand\b/i,
    /\bhand-written question bank\b/i,
    /\bnever auto-?generated\b/i,
    /escrit[ao]s? y (?:verificad|contrastad)[ao]s? (?:a mano|por aficionados)|nunca generad[ao]s? automáticamente/i,
    /escrit[ao]s? e (?:verificad|conferid)[ao]s? (?:à mão|por torcedores)|nunca gerad[ao]s? automaticamente/i,
    /scritt[ae] e verificat[ae] (?:a mano|da tifosi)|mai generat[ae] automaticamente/i,
    /von Hand geschrieben|von Fans geschrieben|nie automatisch erzeugt/i,
    /écrites? et vérifiées? (?:à la main|par des passionnés)|jamais générées? automatiquement/i,
    /met de hand geschreven|door fans geschreven|nooit automatisch gegenereerd/i,
    /elle yazılıyor|futbolseverler tarafından yazılır|otomatik üretilm/i,
    /ditulis dan diperiksa (?:manual|oleh penggemar)|tidak pernah dibuat otomatis/i,
  ];
  const FILES = [
    ...readdirSync(SEO).filter((f) => f.endsWith('.mjs')).map((f) => resolve(SEO, f)),
    resolve(__dirname, '../../scripts/gen-seo-pages.mjs'),
  ];
  const stripComments = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');

  for (const f of FILES) {
    it(f.split('/').slice(-2).join('/'), () => {
      const src = stripComments(readFileSync(f, 'utf8'));
      const hits = CLAIMS.flatMap((re) => (src.match(new RegExp(re.source, re.flags + 'g')) || []));
      expect(hits, 'publishes a claim about how questions are made that is not true — say "researched against sources and verified" instead').toEqual([]);
    });
  }
});

describe('the nav folds into the menu before any language can wrap it', () => {
  // Measured widths are in the comment above the rule in shell.mjs. The worst
  // language (Turkish) fits from 969px; the rule folds below 1020px.
  const FOLD = /@media ?\(min-width:721px\) and \(max-width:1020px\) ?\{\s*\.fd-nav\{display:none\}/;
  it('the shell folds every header at the measured breakpoint', async () => {
    const { SHELL_CSS } = await import('../../scripts/seo/shell.mjs');
    expect(SHELL_CSS).toMatch(FOLD);
  });
  it('the front door folds at the SAME breakpoint, so the static-to-React header swap never changes shape', () => {
    const front = readFileSync(resolve(__dirname, '../../src/design/front.css'), 'utf8');
    expect(front).toMatch(FOLD);
  });
  it('inside the open menu at those widths, Sign in is not repeated', async () => {
    const { SHELL_CSS } = await import('../../scripts/seo/shell.mjs');
    const front = readFileSync(resolve(__dirname, '../../src/design/front.css'), 'utf8');
    for (const css of [SHELL_CSS, front]) expect(css).toContain('.fd-nav.is-open .fd-nav-signin{display:none}');
  });
});

describe('the Spanish layer says "en vivo", not "en directo"', () => {
  // ⚠️ IT WAS NEVER A DIALECT CHOICE — IT WAS A CONTRADICTION. Every /es/ page
  // said BOTH: "1v1 en vivo" in the club band (17 places in clubs-es.mjs) and
  // "1v1 en directo" in the finish-screen door and the hub band. "en vivo" is
  // standard across Latin America — where the measured traffic is, /es/ River
  // Plate pulling 134 impressions to the English page's 8 — and reads correctly
  // in Spain too, while "en directo" reads foreign to every Latin American
  // reader. Portuguese already says "ao vivo" everywhere and needs no such rule.
  const ES_FILES = ['scripts/seo/bq-i18n.mjs', 'scripts/seo/hubs-intl.mjs', 'scripts/seo/clubs-es.mjs'];
  for (const f of ES_FILES) {
    it(`${f.split('/').pop()} contains no "en directo"`, () => {
      const src = readFileSync(resolve(__dirname, '../../', f), 'utf8');
      // Other locales live in the same two shared files; only flag the Spanish phrase.
      expect(src.match(/en directo/g) || []).toEqual([]);
    });
  }
});
