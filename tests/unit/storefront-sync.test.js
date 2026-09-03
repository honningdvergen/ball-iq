import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/**
 * The Apple storefront list is duplicated FOUR times, by necessity.
 *
 * ⚠️ WHY IT IS DUPLICATED. Each copy lives somewhere that cannot import the
 * others: src/lib/links.js is the module used by React; api/get.js is an edge
 * function; index.html and the SEO generator emit inline scripts into static
 * HTML with no module system. Same constraint links.js already documents for
 * the static pages.
 *
 * ⚠️ WHY IT IS TESTED. Storefront routing is the fix for a measured revenue
 * problem — 2026-08-23, Apple showed 5.0 from 3 ratings in GB, 5.0 from 2 in
 * NO, 5.0 from 1 in FR and ZERO in the US, while every default link pointed at
 * /us/. If one copy drifts, some surface silently goes back to handing the
 * emptiest shelf to the readiest installers, and nothing errors. This repo has
 * been bitten repeatedly by exactly this shape (QUESTION_DURATION_MS client vs
 * server, the two privacy-policy copies, the standalone CSS mirror).
 */

const extract = (src, label) => {
  // Matches both the JS Set literal and the inline-script array literal.
  const m = src.match(/\[((?:\s*'[a-z]{2}'\s*,?)+)\]/);
  if (!m) throw new Error(`storefront list not found in ${label}`);
  return m[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean);
};

const SOURCES = {
  'src/lib/links.js': 'src/lib/links.js',
  'api/get.js': 'api/get.js',
  'index.html': 'index.html',
  'scripts/gen-seo-pages.mjs': 'scripts/gen-seo-pages.mjs',
};

describe('Apple storefront list stays in sync across all four copies', () => {
  const lists = Object.fromEntries(
    Object.entries(SOURCES).map(([label, path]) => [label, extract(read(path), label)]),
  );

  it('found a non-trivial list in every file', () => {
    for (const [label, list] of Object.entries(lists)) {
      expect(list.length, `${label} parsed a suspiciously short list`).toBeGreaterThan(20);
    }
  });

  it('all four copies are identical', () => {
    const [reference, ...rest] = Object.entries(lists);
    const [refLabel, refList] = reference;
    for (const [label, list] of rest) {
      const missing = refList.filter((c) => !list.includes(c));
      const extra = list.filter((c) => !refList.includes(c));
      expect(
        { missing, extra },
        `\n  ${label} has drifted from ${refLabel}.\n` +
        `  missing: ${missing.join(', ') || '(none)'}\n` +
        `  extra:   ${extra.join(', ') || '(none)'}\n`,
      ).toEqual({ missing: [], extra: [] });
    }
  });

  it('every copy includes the storefronts we actually hold ratings on', () => {
    // Measured live 2026-08-23. Dropping any of these re-breaks the fix for
    // precisely the users who already like the app enough to have rated it.
    for (const [label, list] of Object.entries(lists)) {
      for (const cc of ['gb', 'no', 'fr', 'us']) {
        expect(list, `${label} is missing the '${cc}' storefront`).toContain(cc);
      }
    }
  });

  it('no visitor-facing source hardcodes the /us/ storefront any more', () => {
    const offenders = [];
    for (const path of [
      'src/lib/links.js', 'api/get.js', 'index.html',
      'scripts/gen-seo-pages.mjs', 'scripts/seo/content.mjs',
      'src/App.jsx', 'src/BiqNav.jsx', 'src/screens/HomeScreen.jsx',
      'src/marketing/FrontDoor.jsx', 'scripts/seo/shell.mjs',
    ]) {
      for (const line of read(path).split('\n')) {
        // Comments explain the history on purpose — only flag real URLs.
        const t = line.trim();
        if (t.startsWith('//') || t.startsWith('*') || t.startsWith('<!--')) continue;
        if (/https:\/\/apps\.apple\.com\/us\//.test(line)) offenders.push(`${path}: ${t.slice(0, 90)}`);
      }
    }
    expect(offenders, `\n  ${offenders.join('\n  ')}\n`).toEqual([]);
  });

  it('the stale two-names-old slug is gone', () => {
    // `ball-iq-football-trivia` predates both renames and costs a 301 hop on
    // every tap. Apple routes by ID, so the slug buys nothing.
    const offenders = Object.values(SOURCES)
      .concat(['scripts/seo/content.mjs'])
      .filter((p) => read(p).includes('ball-iq-football-trivia/id'));
    expect(offenders).toEqual([]);
  });
});
