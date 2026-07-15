// Sprint #14 Stage 2 — DailyScreen extraction verification.
//
// Originally asserted on the Sprint #15 calendar / 4-stat row / Today
// container. Sprint #16's v3 redesign replaced those with FormHero +
// Up next + matchday list. Sprint #24 ships v4 — the tactics card
// hero + restructured fixtures list. The extraction itself (Daily tab
// lives in src/screens/DailyScreen.jsx) is still what this spec
// verifies; the rendered elements just changed.

import { test, expect } from '@playwright/test';

function seedGuestMode(context) {
  return context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });
}

test('Daily tab — no console errors after extraction', async ({ page, context }) => {
  await seedGuestMode(context);
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (/Failed to load resource/.test(t)) return;
      errors.push(`console.error: ${t}`);
    }
  });

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Sprint #27 Y2: at desktop viewports the mobile tab bar is replaced
  // by .desktop-nav. Both targets exist in the DOM at all viewports —
  // the inactive one is display:none. Filter for the visible one.
  const dailyNav = page.locator('.tab-item, .desktop-nav .dn-list button')
    .filter({ hasText: 'Daily', visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(500);

  const body = await page.evaluate(() => document.body.innerText);
  expect(body, 'error-boundary visible').not.toContain('Something went wrong');
  expect(errors, `JS errors: ${errors.join('\n')}`).toEqual([]);
});

test('Daily tab — Sprint #24 v4 layout renders', async ({ page, context }) => {
  await seedGuestMode(context);

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Sprint #27 Y2: at desktop viewports the mobile tab bar is replaced
  // by .desktop-nav. Both targets exist in the DOM at all viewports —
  // the inactive one is display:none. Filter for the visible one.
  const dailyNav = page.locator('.tab-item, .desktop-nav .dn-list button')
    .filter({ hasText: 'Daily', visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(400);

  // Greeting strip with KO countdown chip — unchanged from v3
  await expect(page.locator('.daily-greet')).toBeVisible();
  await expect(page.locator('.daily-greet-ko-val')).toBeVisible();

  // Tactics card hero (Sprint #24 Stage 2): MATCHDAY tag, orange
  // streak number, divider, form strip with 14 cells, axis labels.
  await expect(page.locator('.tactics-card')).toBeVisible();
  await expect(page.locator('.tactics-tag')).toBeVisible();
  await expect(page.locator('.tactics-num')).toBeVisible();
  await expect(page.locator('.tactics-strip .tactics-cell')).toHaveCount(14);
  await expect(page.locator('.tactics-strip-l')).toContainText(/today/i);

  // CRITICAL: streak number must NOT be rendered in JetBrains Mono.
  // Round 5 diagnosis identified the mono/tabular treatment as the
  // "techy" feel the v3 -> v4 redesign was specifically replacing.
  // Spec the font-family explicitly so future regressions break here.
  const numFont = await page.locator('.tactics-num').evaluate(el => getComputedStyle(el).fontFamily);
  expect(numFont, 'tactics-num must NOT render in JetBrains Mono').not.toMatch(/JetBrains Mono|SF Mono|Menlo|monospace/i);
  expect(numFont, 'tactics-num must use Inter (proportional)').toMatch(/Inter/i);

  // v3 elements that MUST be gone — guard against accidental revival.
  await expect(page.locator('.form-hero')).toHaveCount(0);
  await expect(page.locator('.run-chip')).toHaveCount(0);
  await expect(page.locator('.up-next')).toHaveCount(0);
  await expect(page.locator('.stats-footer')).toHaveCount(0);
  await expect(page.locator('.md-row')).toHaveCount(0);
  await expect(page.getByText(/Friendlies|Between fixtures|Tomorrow's Daily/i)).toHaveCount(0);

  // Older artefacts that were removed in earlier sprints
  await expect(page.locator('.daily-stats-row')).toHaveCount(0);
  await expect(page.locator('.cal-grid')).toHaveCount(0);
  await expect(page.locator('.streak-hero')).toHaveCount(0);
  await expect(page.locator('.daily-zone[aria-label="Today"]')).toHaveCount(0);
});
