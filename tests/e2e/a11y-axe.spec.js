/**
 * Accessibility: axe-core over the five pages most visitors land on.
 *
 * WHY (7 Nov 2026). No automated check read the shipped pages for accessibility
 * defects (missing labels, contrast, landmark and ARIA mistakes). This runs
 * axe-core's WCAG 2.0/2.1 A and AA rules on:
 *   - the homepage, /quiz/arsenal/, /football-wordle/ and /transfer-trail/,
 *     as the STATIC generated pages from dist/ (served on 4177 in CI, see
 *     ci.yml; override with BALLIQ_STATIC_URL), because that is what a visitor
 *     actually gets at those URLs;
 *   - the app at /play, after the visitor declines the consent prompt, on the
 *     dev server (baseURL), the same route consent-banner.spec.js uses.
 *
 * A violation with impact "serious" or "critical" fails the test, unless it is
 * listed in KNOWN with its reason. Everything else axe finds is printed.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STATIC = process.env.BALLIQ_STATIC_URL || 'http://localhost:4177';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Rule ids that are known, reported, and not yet fixed (rule id -> reason).
// Adding one is a decision, not a way to make a red test green.
const KNOWN = {};

/** Answer the consent prompt as "no" on every origin, so the static pages scan their settled state. */
async function declinedVisitor(page) {
  await page.context().addInitScript(() => {
    try { window.localStorage.setItem('biq_consent_analytics', 'denied'); } catch { /* storage blocked */ }
  });
}

async function scan(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of violations) {
    const where = v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ');
    console.log(`[axe] ${label} · ${v.impact} · ${v.id} (${v.nodes.length}) · ${v.help} · ${where}`);
  }
  const blocking = violations.filter(
    (v) => (v.impact === 'serious' || v.impact === 'critical') && !(v.id in KNOWN),
  );
  expect(
    blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')})`),
    `serious/critical axe violations on ${label}`,
  ).toEqual([]);
}

for (const path of ['/', '/quiz/arsenal/', '/football-wordle/', '/transfer-trail/']) {
  test(`axe: ${path} (static page)`, async ({ page }) => {
    await declinedVisitor(page);
    await page.goto(`${STATIC}${path}`);
    await page.waitForLoadState('networkidle');
    await scan(page, path);
  });
}

test('axe: /play after Decline', async ({ page }) => {
  // Undo the "denied" seeded by playwright.config.js once, so the prompt shows
  // and the visitor declines it for real.
  await page.context().addInitScript(() => {
    try {
      if (!window.localStorage.getItem('__biq_axe_cleared')) {
        window.localStorage.removeItem('biq_consent_analytics');
        window.localStorage.setItem('__biq_axe_cleared', '1');
      }
    } catch { /* storage blocked */ }
  });
  await page.goto('/play?tab=daily');
  await page.locator('#biq-consent button', { hasText: 'Decline' }).click();
  await expect(page.locator('#biq-consent')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  await scan(page, '/play');
});
