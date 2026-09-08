import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/**
 * The analytics consent gate exists TWICE, and the two copies must decide the
 * same thing.
 *
 * `index.html` gates the React app. `scripts/gen-seo-pages.mjs` head() gates
 * every generated club, player and list page — and those carry ~39% of all
 * play and most of the European search traffic that lands on this site. The
 * generator's own comment calls itself "byte-for-byte equivalent to the gate
 * in index.html". Nothing checked that, and the two had already drifted: the
 * generator gained an unconditional __biqConsentDefer on 2026-09-02 while both
 * files' comments went on claiming "static pages never set the flag".
 *
 * That stale claim is not a cosmetic problem. It is what made
 * tests/e2e/consent-banner.spec.js assert, against /quiz/arsenal/, that the
 * banner mounts on load. It does not — and the test only passed in CI because
 * the dev server has no dist/ and quietly served the SPA at that URL instead
 * of the real page. The e2e cannot reach the generated pages without a build
 * step, so their gate is covered here, at source, by executing it.
 *
 * These tests RUN both gates rather than grepping them. A regex would pass a
 * gate that had been reordered into nonsense; running it is the only way to
 * assert what a European visitor actually gets.
 */

/** Pull the inline <script> that carries the consent gate out of a file. */
const gateScript = (src, file) => {
  const at = src.indexOf('biq_consent_analytics');
  expect(at, `${file} no longer contains a consent gate`).toBeGreaterThan(-1);
  const open = src.lastIndexOf('<script>', at);
  const close = src.indexOf('</script>', at);
  expect(open, `${file}: could not find the gate's <script> open tag`).toBeGreaterThan(-1);
  expect(close, `${file}: could not find the gate's </script> close tag`).toBeGreaterThan(open);
  return src.slice(open + '<script>'.length, close);
};

const APP_GATE = gateScript(read('index.html'), 'index.html');
const SEO_GATE = gateScript(read('scripts/gen-seo-pages.mjs'), 'scripts/gen-seo-pages.mjs');

/**
 * Execute a gate against a stub browser and report what it decided.
 *
 * `tz: THROWS` models a browser that refuses to resolve a time zone at all —
 * the gate must fail towards asking, never towards tracking.
 */
const THROWS = Symbol('Intl throws');

function runGate(source, { tz = 'Europe/Oslo', choice = null, pathname = '/', search = '', native = false } = {}) {
  const appended = [];
  const win = {
    Capacitor: native ? { isNativePlatform: () => true } : undefined,
    __biqConsentDefer: undefined,
  };
  const doc = {
    documentElement: { classList: { contains: (c) => native && c === 'native-app' } },
    head: { appendChild: (el) => appended.push(el) },
    body: { appendChild: (el) => appended.push(el) },
    createElement: () => ({ setAttribute() {} }),
  };
  const loc = { protocol: native ? 'capacitor:' : 'https:', pathname, search, href: `https://balliq.app${pathname}${search}` };
  const intl = {
    DateTimeFormat: () => ({
      resolvedOptions: () => {
        if (tz === THROWS) throw new Error('resolvedOptions unavailable');
        return { timeZone: tz };
      },
    }),
  };
  const storage = { getItem: (k) => (k === 'biq_consent_analytics' ? choice : null), setItem() {} };

  new Function('window', 'document', 'location', 'localStorage', 'Intl', 'setTimeout', source)(
    win, doc, loc, storage, intl, () => {},
  );

  const srcs = appended.map((el) => el.src || '');
  return {
    clarity: srcs.some((s) => s.includes('clarity.ms')),
    banner: srcs.some((s) => s.includes('/consent.js')),
    deferred: win.__biqConsentDefer === true,
  };
}

/** Every timezone shape that changes the answer, plus a few that must not. */
const IN_SCOPE = ['Europe/Oslo', 'Europe/London', 'Europe/Dublin', 'UTC', '', THROWS];
const OUT_OF_SCOPE = ['America/New_York', 'Asia/Tokyo', 'Africa/Cairo', 'Australia/Sydney'];
const label = (tz) => (tz === THROWS ? 'a browser with no resolvable time zone' : tz === '' ? 'an empty time zone' : tz);

describe('the two consent gates agree', () => {
  // The generated pages always run on a club/list URL; the app gate is
  // exercised on a route that does not defer, so the two are compared on the
  // decision they share: does Clarity load, and is the banner fetched.
  const surfaces = [
    ['index.html', APP_GATE, { pathname: '/play', search: '?tab=daily' }],
    ['gen-seo-pages.mjs', SEO_GATE, { pathname: '/quiz/arsenal/', search: '' }],
  ];

  for (const [name, gate, route] of surfaces) {
    describe(name, () => {
      for (const tz of IN_SCOPE) {
        it(`asks ${label(tz)} and loads nothing until they answer`, () => {
          const r = runGate(gate, { ...route, tz, choice: null });
          expect(r.clarity, 'Clarity must not load before consent').toBe(false);
          expect(r.banner, 'an undecided European visitor must be asked').toBe(true);
        });

        it(`honours a stored "denied" for ${label(tz)} without re-asking`, () => {
          const r = runGate(gate, { ...route, tz, choice: 'denied' });
          expect(r.clarity).toBe(false);
          expect(r.banner, 'a "no" must not be re-litigated on every page view').toBe(false);
        });

        it(`honours a stored "granted" for ${label(tz)}`, () => {
          const r = runGate(gate, { ...route, tz, choice: 'granted' });
          expect(r.clarity, 'consent that does not turn analytics on is theatre').toBe(true);
          expect(r.banner).toBe(false);
        });
      }

      for (const tz of OUT_OF_SCOPE) {
        it(`does not interrupt a visitor in ${tz}`, () => {
          const r = runGate(gate, { ...route, tz, choice: null });
          expect(r.clarity).toBe(true);
          expect(r.banner).toBe(false);
        });
      }

      it('never loads anything inside the native app', () => {
        for (const tz of [...IN_SCOPE, ...OUT_OF_SCOPE]) {
          const r = runGate(gate, { ...route, tz, choice: null, native: true });
          expect(r.clarity, 'the store listings declare no analytics').toBe(false);
          expect(r.banner, 'and therefore there is nothing to consent to').toBe(false);
        }
      });
    });
  }
});

describe('which surfaces defer the banner', () => {
  /**
   * ⚠️ THIS IS THE FACT BOTH FILES' COMMENTS USED TO DENY. The generated pages
   * defer — always, since 2026-09-02, because the bar covered the taster's
   * answer options on the best-converting arrival on the site. A test that
   * expects a banner on load against a real club page is asserting a fiction.
   */
  it('every generated page defers, because its fold is a playable question', () => {
    for (const tz of IN_SCOPE) {
      const r = runGate(SEO_GATE, { tz, pathname: '/quiz/arsenal/', choice: null });
      expect(r.banner, 'it must still fetch the banner').toBe(true);
      expect(r.deferred, 'and it must not mount it on load').toBe(true);
    }
  });

  // The app defers for exactly the surfaces whose fold is also a live
  // question: the marketing homepage, and any deep link that drops the visitor
  // straight into a timed one.
  const DEFERS = [
    ['/', '', 'the marketing homepage'],
    ['/index.html', '', 'the homepage by its explicit filename'],
    ['/play', '?club=arsenal', 'a club deep link'],
    ['/play', '?quiz=arsenal', 'a quiz deep link'],
    ['/play', '?c=ABC123', 'a room deep link'],
    ['/c/ABC123', '', 'a short room link'],
    ['/join/ABC123', '', 'a join link'],
  ];
  const PROMPTS = [
    ['/play', '?tab=daily', 'the daily tab'],
    ['/play', '?tab=home', 'the app home tab'],
    ['/play', '', 'the bare app route'],
  ];

  for (const [pathname, search, what] of DEFERS) {
    it(`the app defers on ${what}`, () => {
      const r = runGate(APP_GATE, { pathname, search, choice: null });
      expect(r.banner).toBe(true);
      expect(r.deferred).toBe(true);
    });
  }

  for (const [pathname, search, what] of PROMPTS) {
    it(`the app asks straight away on ${what}`, () => {
      const r = runGate(APP_GATE, { pathname, search, choice: null });
      expect(r.banner).toBe(true);
      expect(r.deferred, `${what} has no timed question in the fold, so there is nothing to defer for`).toBe(false);
    });
  }
});

describe('a deferred banner has a trigger that actually fires', () => {
  /**
   * Deferring is only defensible because the ask still arrives. If the trigger
   * ever stops firing, nothing goes red: the product simply never asks anyone
   * again, and Clarity never runs on the surfaces that carry most of the
   * traffic. consent.js warns about exactly this in prose; these assertions
   * are the version that runs.
   */
  const CONSENT_JS = read('public/consent.js');
  const APP_JSX = read('src/App.jsx');

  it('consent.js waits on the app’s natural pause', () => {
    expect(CONSENT_JS).toMatch(/addEventListener\(\s*['"]biq:consent-moment['"]/);
  });

  it('…and the app still dispatches it', () => {
    expect(
      APP_JSX,
      'consent.js listens for biq:consent-moment; if nothing dispatches it, deep-linked players are never asked',
    ).toMatch(/dispatchEvent\(\s*new Event\(\s*['"]biq:consent-moment['"]/);
  });

  it('…and falls back to scroll, for surfaces that never fire that event', () => {
    // The marketing homepage is not the /play app and never dispatches the
    // event, so scroll is the only trigger it has.
    expect(CONSENT_JS).toMatch(/addEventListener\(\s*['"]scroll['"]/);
    expect(CONSENT_JS).toMatch(/window\.scrollY/);
  });

  it('…and to a dwell backstop, so a reader who never scrolls is still asked', () => {
    expect(CONSENT_JS).toMatch(/setTimeout\(\s*go\s*,\s*\d+\s*\)/);
  });
});
