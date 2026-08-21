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
 */
import { test, expect } from '@playwright/test';

const CLARITY = /clarity\.ms/;

/** Collect any request that reaches Microsoft, from the very first byte. */
async function watchClarity(page) {
  const hits = [];
  page.on('request', (r) => { if (CLARITY.test(r.url())) hits.push(r.url()); });
  return hits;
}

/**
 * Start from a genuinely undecided visitor.
 *
 * ⚠️ addInitScript re-runs on EVERY navigation, reloads included. Clearing the
 * key unconditionally therefore erases the choice the test just made, the
 * banner correctly comes back, and the "is the decision remembered?" tests
 * fail while the product is working perfectly. The sessionStorage sentinel
 * survives reloads within the tab, so this clears once and then gets out of
 * the way.
 */
async function asUndecidedVisitor(page, { skipOnboarding = true } = {}) {
  await page.addInitScript((skip) => {
    try {
      if (!window.sessionStorage.getItem('__biq_consent_cleared')) {
        window.localStorage.removeItem('biq_consent_analytics');
        window.sessionStorage.setItem('__biq_consent_cleared', '1');
      }
      // ⚠️ The dev server rewrites every unknown path to the SPA, so
      // '/quiz/arsenal/' locally serves the APP, not the static club page
      // (those exist only in dist/). The app then renders onboarding, the
      // banner correctly hides itself behind it, and a test about the
      // banner's geometry measures a hidden element — boundingBox() returns
      // null. It passed in isolation and failed under load purely on timing,
      // which is the signature of a racy premise rather than a racy product.
      // Marking onboarding done keeps these tests about consent.
      if (skip) window.localStorage.setItem('biq_onboarded', '1');
    } catch { /* private mode */ }
  }, skipOnboarding);
}

test.describe('analytics consent', () => {
  test('a European visitor is asked, and Clarity does not load until they say yes', async ({ page }) => {
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page);

    // A club-page URL: these carry ~39% of all play and are where most
    // European search traffic lands, so they are the half that most needs the
    // gate. Note that against the DEV server this resolves to the SPA, not the
    // generated static page — what it proves is that the gate holds on this
    // route, not which template rendered it.
    await page.goto('/quiz/arsenal/');

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

  test('declining is remembered and keeps Clarity off across a reload', async ({ page }) => {
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page);
    await page.goto('/quiz/arsenal/');

    await page.locator('#biq-consent button', { hasText: 'Decline' }).click();
    await expect(page.locator('#biq-consent')).toHaveCount(0);

    // The decision has to survive a reload, or we would re-prompt forever and
    // the "no" would mean nothing. reload(), not a second goto() to the URL we
    // are already on — that races the page's own navigation and fails as
    // "interrupted by another navigation".
    await page.reload();
    await expect(page.locator('#biq-consent')).toHaveCount(0);
    expect(hits, 'a declined visitor must never reach clarity.ms').toEqual([]);
  });

  test('allowing loads Clarity and is remembered', async ({ page }) => {
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page);
    await page.goto('/quiz/arsenal/');

    await page.locator('#biq-consent button', { hasText: 'Allow' }).click();
    await expect(page.locator('#biq-consent')).toHaveCount(0);

    // The consent has to actually turn the thing ON, or we have built a
    // banner that only ever says no.
    await expect.poll(() => hits.length, { timeout: 10_000 }).toBeGreaterThan(0);

    await page.reload();
    await expect(page.locator('#biq-consent')).toHaveCount(0);
  });

  test('the banner stays out of the way of onboarding', async ({ page }) => {
    // Onboarding is the highest-stakes screen in the product (activation was
    // measured at 15%). The banner must not sit across it — and crucially,
    // Clarity must still be withheld the whole time it is hidden.
    const hits = await watchClarity(page);
    await asUndecidedVisitor(page, { skipOnboarding: false });
    await page.goto('/play');

    const onboarding = page.locator('.onboard-wrap');
    if (await onboarding.count()) {
      await expect(page.locator('#biq-consent')).toBeHidden();
      expect(hits, 'hidden banner must not mean silent tracking').toEqual([]);
    }
  });
});
