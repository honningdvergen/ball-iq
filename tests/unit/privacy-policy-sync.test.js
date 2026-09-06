import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/**
 * The privacy policy exists TWICE and the two copies must say the same thing.
 *
 * `public/privacy.html` is what the world sees (sitemap, site footer, both
 * store listings link it). `src/App.jsx` renders the same policy in-app. If
 * they diverge, in-app users and store reviewers read a different policy from
 * external visitors — and the store listing links the one we did not update.
 *
 * ⚠️ THE COMMENT-BASED RULE HAS NOW FAILED THREE TIMES. privacy.html's own
 * header says "If you edit one, edit the other in the same commit and bump
 * Last updated in both". Sprint #83 ZZ7 caught a drift; Sprint #84 AAA1
 * re-synced them; and on 2026-08-23 they were found drifted AGAIN — the two
 * "short version" paragraphs described different products, one naming
 * first-party events and the other naming Clarity. A rule that relies on
 * remembering has been given three chances. This is the version that runs.
 *
 * The check is deliberately claim-level, not character-level: the two files
 * are HTML and JSX and will never be byte-identical. What must match is every
 * PROMISE, because a promise is the thing a regulator or a store reviewer
 * holds us to.
 */

// Strip tags, JSX expressions and entities down to comparable prose.
const proseOf = (src, startMarker, endMarker) => {
  let s = src;
  const a = s.indexOf(startMarker);
  const b = endMarker ? s.indexOf(endMarker, a) : -1;
  if (a >= 0) s = s.slice(a, b > a ? b : undefined);
  return s
    .replace(/\{APP_NAME\}/g, 'Ball IQ')
    .replace(/\{[^{}]*\}/g, ' ')      // JSX expressions / style props
    .replace(/<[^>]+>/g, ' ')          // tags
    .replace(/&mdash;/g, '—').replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&rsquo;/g, "'").replace(/&amp;/g, '&')
    .replace(/[""]/g, '"').replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

// ⚠️ Strip code comments before scanning App.jsx. The first run of this file
// failed on src/App.jsx:2031 — a comment in loopEvent QUOTING the old policy
// wording to explain why it was removed. Flagging documentation of a fix as
// the defect itself is the classic detector false positive, and it would have
// taught the next person to delete the explanation rather than the claim.
// Only what a user can actually read counts.
const stripComments = (s) => s
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const htmlSrc = read('public/privacy.html').replace(/<!--[\s\S]*?-->/g, '');
const appSrc = stripComments(read('src/screens/PrivacyScreen.jsx'));

describe('the two privacy policy copies stay in sync', () => {
  it('both declare the same "Last updated" date', () => {
    const grab = (s) => (s.match(/Last updated:\s*([0-9]{1,2}\s+\w+\s+[0-9]{4})/) || [])[1];
    const h = grab(htmlSrc);
    const a = grab(appSrc);
    expect(h, 'no Last updated date in public/privacy.html').toBeTruthy();
    expect(a, 'no Last updated date in src/App.jsx').toBeTruthy();
    expect(a, `in-app says "${a}", website says "${h}" — edit both in the same commit`).toBe(h);
  });

  it('both carry an identical "short version" summary', () => {
    const h = proseOf(htmlSrc, 'The short version:', '</p>');
    const a = proseOf(appSrc, 'The short version:', '</p>');
    expect(h.length, 'short version not found in privacy.html').toBeGreaterThan(80);
    expect(a.length, 'short version not found in App.jsx').toBeGreaterThan(80);
    expect(a, '\n  The two "short version" paragraphs have drifted.\n').toBe(h);
  });

  it('neither copy still claims the app measures nothing', () => {
    // ⚠️ Load-bearing. 1.6.5 records anonymous feature counts from native, so
    // "does not measure how you use it" and "runs no usage tracking" became
    // FALSE the moment that build ships. Both phrasings must stay deleted.
    const banned = [/does not measure how you use it/i, /runs no usage tracking/i];
    const offenders = [];
    for (const [label, src] of [['public/privacy.html', htmlSrc], ['src/App.jsx', appSrc]]) {
      for (const re of banned) if (re.test(src)) offenders.push(`${label}: ${re}`);
    }
    expect(offenders, `\n  ${offenders.join('\n  ')}\n`).toEqual([]);
  });

  it('both disclose the anonymous app counts and the website visitor id', () => {
    for (const [label, src] of [['public/privacy.html', htmlSrc], ['src/App.jsx', appSrc]]) {
      expect(src, `${label} does not disclose biq_vid`).toMatch(/biq_vid/);
      expect(src, `${label} does not disclose anonymous feature counts`)
        .toMatch(/no identifier of any kind/i);
    }
  });

  it('neither copy contradicts itself about ads', () => {
    // The in-app screen said "Our website shows ads via Google" 26 lines above
    // "We do not currently display ads anywhere". AD_CLIENT is empty; the
    // second one is the true one.
    const offenders = [];
    for (const [label, src] of [['public/privacy.html', htmlSrc], ['src/App.jsx', appSrc]]) {
      if (/shows ads via Google/i.test(src)) offenders.push(`${label}: still claims the site shows ads`);
      if (/no consent prompt is shown/i.test(src)) offenders.push(`${label}: still claims no consent prompt exists`);
    }
    expect(offenders, `\n  ${offenders.join('\n  ')}\n`).toEqual([]);
  });
});
