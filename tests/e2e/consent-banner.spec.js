/**
 * Analytics consent gate.
 *
 * Guards a rule that is invisible from inside the repo and expensive to get
 * wrong: Microsoft Clarity records session replays, ~87% of this site's
 * traffic is EEA/UK, and until 2026-08-21 it loaded for everyone with no
 * prompt while the privacy policy claimed a prompt existed.
 *
 * The assertion that matters is NOT "a banner appeared" — it is "no request
 * reached clarity.ms". A banner that renders beautifully above a tag that
 * already fired is worth nothing, so every test here watches the network.
 *
 * These tests clear the storageState seeded in playwright.config.js, which
 * answers the prompt for the rest of the suite.
 *
 * ⚠️ EVERY ROUTE HERE MUST MEAN THE SAME THING ON EVERY SERVER THE SUITE CAN
 * POINT AT. This spec previously used '/quiz/arsenal/', and that one choice
 * made it pass in CI and fail on every developer machine for reasons that had
 * nothing to do with the product:
 *
 *   • CI boots the vite DEV server (reuseExistingServer is false under CI), and
 *     the dev server has no dist/, so '/quiz/arsenal/' fell through to the SPA
 *     index.html — a document no real visitor is ever served at that URL.
 *   • Locally, Playwright reuses whatever already listens on 4173. That is
 *     typically `vite preview`, which serves the REAL generated club page from
 *     dist/quiz/arsenal/index.html.
 *
 * Those two documents take opposite branches of the gate: the SPA mounts the
 * banner on load, the generated club page sets __biqConsentDefer and mounts
 * nothing until the visitor scrolls. So the test asserted a fiction in CI and
 * correctly failed against the real page locally. Diagnosed 2026-09-07.
 *
 * Every route below ('/play…' and '/') resolves to index.html under BOTH the
 * dev server and a preview server, so the document under test is the same one
 * either way — verified on both before this rewrite. Do not reintroduce a URL
 * that exists as a file in dist/; if the static club pages need e2e cover,
 * that needs a build step in the harness, not a URL that quietly changes
 * meaning. Their gate is covered at source level in
 * tests/unit/consent-gate-parity.test.js instead.
 */
import { test, expect } from '@playwright/test';

const CLARITY = /clarity\.ms/;

/** A route the app mounts the banner on immediately: no defer flag is set. */
const PROMPT_ON_LOAD = '/play?tab=daily';
/** Deep-linked play. index.html sets __biqConsentDefer for '?club='. */
const DEEP_LINK = '/play?club=arsenal';
/** The marketing homepage. index.html sets __biqConsentDefer for '/'. */
const HOMEPAGE = '/';

/**
 * Collect any request that reaches Microsoft, from the very first byte.
 *
 * Watches the CONTEXT rather than one page: the returning-visitor checks open
 * a second tab, and "this browser did not talk to clarity.ms" is a claim about
 * the profile, not about one tab.
 */
async function watchClarity(page) {
  const hits = [];
  page.context().on('request', (r) => { if (CLARITY.test(r.url())) hits.push(r.url()); });
  return hits;
}

/**
 * Start from a genuinely undecided visitor.
 *
 * ⚠️ addInitScript re-runs on EVERY navigation, reloads included. Clearing the
 * key unconditionally therefore erases the choice the test just made, the
 * banner correctly comes back, and the "is the decision remembered?" tests
 * fail while the product is working perfectly. A sentinel makes it clear once
 * and then get out of the way.
 *
 * ⚠️ THE SENTINEL LIVES IN localStorage, NOT sessionStorage. It used to be
 * per-tab, which was enough while the only revisit was reload(). The
 * returning-visitor checks now open a SECOND TAB, and a fresh tab starts with
 * empty sessionStorage — so a per-tab sentinel would wipe the very choice
 * under test and the suite would report a working product as broken.
 * Registered on the context so every tab inherits it.
 */
async function asUndecidedVisitor(page, { skipOnboarding = true } = {}) {
  await page.context().addInitScript((skip) => {
    try {
      if (!window.localStorage.getItem('__biq_consent_cleared')) {
        window.localStorage.removeItem('biq_consent_analytics');
        window.localStorage.setItem('__biq_consent_cleared', '1');
      }
      // Onboarding is a full-screen overlay and the banner deliberately hides
      // behind it (see consent.js). A test about the banner that lands on
      // onboarding measures a hidden element — boundingBox() returns null, and
      // it fails on timing rather than on any defect. Marking onboarding done
      // keeps these tests about consent. The one test that IS about onboarding
      // opts out via skipOnboarding:false.
      if (skip) window.localStorage.setItem('biq_onboarded', '1');
    } catch { /* private mode */ }
  }, skipOnboarding);
}

/**
 * Navigate, and assert the premise this whole spec rests on: the URL resolved
 * to the app shell, not to a generated static page that happens to sit at the
 * same path in dist/. Without this, the failure mode is a missing element and
 * an afternoon of debugging; with it, the failure names its own cause.
 */
async function gotoApp(page, url) {
  const res = await page.goto(url);
  try {
    await expect(page.locator('#root')).toHaveCount(1, { timeout: 10_000 });
  } catch {
    // A guard that only says "0 elements" sends the next person hunting the
    // product. Say what actually arrived instead.
    const seen = await page
      .evaluate(() => ({
        url: location.href,
        title: document.title,
        bytes: document.documentElement.outerHTML.length,
        head: document.documentElement.outerHTML.slice(0, 200).replace(/\s+/g, ' '),
      }))
      .catch((e) => ({ evaluateFailed: String(e).split('\n')[0] }));
    throw new Error(
      `${url} did not resolve to the SPA shell. ` +
      `HTTP ${res && res.status()} ${(res && res.headers()['content-type']) || ''} — ` +
      `document: ${JSON.stringify(seen)}. ` +
      'Every url in this spec must serve index.html under BOTH the dev server and a ' +
      'preview server; if the base URL is serving a generated page from dist/, the ' +
      'consent branch under test is not the one this spec describes.',
    );
  }
}

/**
 * Come back as a returning visitor: a fresh TAB on the same browser profile.
 *
 * ⚠️ NOT reload(), and NOT a navigation issued from /play. Every variant of
 * those was tried and measured on 2026-09-07, and they fail for one shared
 * reason: /play rewrites its own url asynchronously, so anything that
 * navigates out of it is racing that rewrite.
 *
 *   • AppInner consumes ?tab= / ?club= / ?quiz= and strips them with
 *     replaceState (App.jsx ~6297) about 400ms after load. reload() therefore
 *     replays bare '/play', which main.jsx:194 redirects to the front door
 *     ("the website is the home", 2026-09-05) — WebKit reports the interrupted
 *     load as "Frame load interrupted".
 *   • goto()-ing anywhere else from that page is aborted as "interrupted by
 *     another navigation" whenever the strip is still pending, and waiting for
 *     the strip first does not help: on a warm bundle the app boots fast
 *     enough to fire it before the next document's load event.
 *
 * A new tab has no pending navigation of its own to race, shares localStorage
 * with the tab that made the decision, and is a fairer picture of a returning
 * visitor than a reload ever was. It lands on '/', which rewrites nothing —
 * one main-frame navigation, measured.
 *
 * '/' is also a DEFERRED surface, and that sharpens the question rather than
 * softening it: an undecided visitor who scrolls there IS asked (the deferred
 * tests below prove precisely that), so a decided visitor who scrolls and is
 * not asked is evidence about the stored choice, not about the deferral.
 */
async function returningVisitor(page) {
  const fresh = await page.context().newPage();
  await gotoApp(fresh, HOMEPAGE);
  return fresh;
}

/**
 * The trigger a deferred surface waits for: the reader leaves the hero.
 *
 * ⚠️ WAIT FOR THE PAGE TO BE TALL ENOUGH FIRST. consent.js arms on
 * `scrollY > innerHeight * 0.9`, and you cannot scroll a document that is one
 * viewport tall — scrollTo silently clamps to 0 and the trigger never fires.
 * Measured on 2026-09-07: at the load event the front door is EXACTLY one
 * viewport (scrollHeight === innerHeight) and only reaches 2.35x-10.2x once it
 * has rendered. Against the built bundle that gap is invisible; against the
 * dev server, which CI runs, it is wide enough that scrolling immediately
 * armed nothing and this test failed on 7 of 11 profiles.
 *
 * The two waits are also the assertion: if the front door ever becomes short
 * enough that a reader cannot scroll past the threshold, this fails loudly —
 * and it should, because at that point the marketing site would only ever ask
 * for consent via the 60s backstop.
 */
async function scrollPastTheHero(page) {
  await page.waitForFunction(
    () => document.documentElement.scrollHeight - window.innerHeight > window.innerHeight * 0.9,
  );
  await page.evaluate(() => window.scrollTo(0, Math.round(window.innerHeight * 1.5)));
  await page.waitForFunction(() => window.scrollY > window.innerHeight * 0.9);
}

test.describe('analytics consent', () => {
  test('a European visitor is asked, and Clarity does not load until they say yes', async ({ page }) => {
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page);
    await gotoApp(page, PROMPT_ON_LOAD);

    const banner = page.locator('#biq-consent');
    await expect(banner).toBeVisible();
    expect(hits, 'Clarity must not load before consent').toEqual([]);

    // Both choices must be equally reachable — a "reject" that is harder to
    // find than "accept" invalidates the consent it collects.
    const buttons = banner.locator('button');
    await expect(buttons).toHaveCount(2);
    const [declineBox, allowBox] = await Promise.all([
      buttons.nth(0).boundingBox(),
      buttons.nth(1).boundingBox(),
    ]);
    expect(declineBox.height).toBeGreaterThanOrEqual(44); // tap-target floor
    expect(allowBox.height).toBeGreaterThanOrEqual(44);
    // Within 20% of each other in width: same visual weight, not a nudge.
    const ratio = declineBox.width / allowBox.width;
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
  });

  test('declining is remembered and keeps Clarity off on the next page load', async ({ page }) => {
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page);
    await gotoApp(page, PROMPT_ON_LOAD);

    await page.locator('#biq-consent button', { hasText: 'Decline' }).click();
    await expect(page.locator('#biq-consent')).toHaveCount(0);

    // The decision has to survive a fresh page load, or we would re-prompt
    // forever and the "no" would mean nothing. Scrolling is what summons the
    // bar on this surface for someone who has not decided — so a scroll that
    // summons nothing is the "no" being honoured, not the deferral hiding it.
    const next = await returningVisitor(page);
    await scrollPastTheHero(next);
    await expect(next.locator('#biq-consent')).toHaveCount(0);
    expect(hits, 'a declined visitor must never reach clarity.ms').toEqual([]);
  });

  test('allowing loads Clarity and is remembered', async ({ page }) => {
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page);
    await gotoApp(page, PROMPT_ON_LOAD);

    await page.locator('#biq-consent button', { hasText: 'Allow' }).click();
    await expect(page.locator('#biq-consent')).toHaveCount(0);

    // The consent has to actually turn the thing ON, or we have built a
    // banner that only ever says no.
    await expect.poll(() => hits.length, { timeout: 10_000 }).toBeGreaterThan(0);

    // And the yes has to be remembered: on the next page the visitor is not
    // asked again, and Clarity loads on that document without being asked for.
    const before = hits.length;
    const next = await returningVisitor(page);
    await expect(next.locator('#biq-consent')).toHaveCount(0);
    await expect
      .poll(() => hits.length, { timeout: 10_000 })
      .toBeGreaterThan(before);
  });

  test('the banner stays out of the way of onboarding', async ({ page }) => {
    // Onboarding is the highest-stakes screen in the product (activation was
    // measured at 15%). The banner must not sit across it — and crucially,
    // Clarity must still be withheld the whole time it is hidden.
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page, { skipOnboarding: false });
    await gotoApp(page, '/play?tab=home');

    const onboarding = page.locator('.onboard-wrap');
    if (await onboarding.count()) {
      await expect(page.locator('#biq-consent')).toBeHidden();
      expect(hits, 'hidden banner must not mean silent tracking').toEqual([]);
    }
  });

  /**
   * The DEFERRED half of the gate — the branch the old '/quiz/arsenal/' test
   * was silently missing.
   *
   * Three surfaces hold the banner back rather than showing it on load: the
   * marketing homepage and deep-linked play (index.html), and every generated
   * club/list page (gen-seo-pages.mjs). The reason is the same in all three —
   * the bar is 172px of fixed furniture at the bottom of the fold, and on each
   * of those surfaces that fold contains a playable question whose answer
   * options it covered (measured in WebKit at 390x664 on 2026-09-02).
   *
   * ⚠️ A DEFERRED BANNER IS ONLY ACCEPTABLE IF IT ACTUALLY ARRIVES. consent.js
   * says so in its own comment and nothing tested it. If the trigger ever
   * stops firing, the product does not crash and no test goes red — it just
   * quietly never asks anyone, and Clarity never runs again on the surfaces
   * that carry most of the traffic. That silence is what these two tests buy.
   */
  test.describe('deferred surfaces still ask, and stay silent until they do', () => {
    test('a deep-linked player is not interrupted, then is asked at the natural pause', async ({ page }) => {
      const hits = await watchClarity(page);
      await asUndecidedVisitor(page);
      await gotoApp(page, DEEP_LINK);

      // The whole point of the deferral: the first question is not spent on
      // GDPR furniture.
      await expect(page.locator('#biq-consent')).toHaveCount(0);
      expect(hits, 'deferring the ASK must never mean tracking meanwhile').toEqual([]);

      // App.jsx fires this at the first natural pause (results screen, or
      // bailing back home). The unit test asserts the app still dispatches it;
      // this asserts consent.js still listens.
      await page.evaluate(() => window.dispatchEvent(new Event('biq:consent-moment')));
      await expect(page.locator('#biq-consent')).toBeVisible();
      expect(hits, 'the banner appearing is not consent').toEqual([]);
    });

    test('the homepage asks once the reader has scrolled past the hero', async ({ page }) => {
      const hits = await watchClarity(page);
      await asUndecidedVisitor(page);
      await gotoApp(page, HOMEPAGE);

      await expect(page.locator('#biq-consent')).toHaveCount(0);
      expect(hits, 'the homepage must not track while it waits to ask').toEqual([]);

      // ⚠️ The homepage never fires biq:consent-moment — it is not the /play
      // app. Scroll is the trigger that has to carry it, and if this assertion
      // is ever relaxed the marketing site stops asking anyone at all.
      await scrollPastTheHero(page);
      await expect(page.locator('#biq-consent')).toBeVisible();
      expect(hits, 'scrolling is not consent either').toEqual([]);
    });
  });
});
