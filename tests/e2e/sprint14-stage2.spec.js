// Sprint #14 Stage 2 — DailyScreen extraction verification (revised
// Sprint #16). Originally asserted on the Sprint #15 calendar / 4-stat
// row / Today container. Sprint #16's v3 redesign replaced those with
// FormHero + Up next + matchday list — the extraction itself (Daily
// tab lives in src/screens/DailyScreen.jsx) is still what this spec
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

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  await page.locator('.tab-item').filter({ hasText: 'Daily' }).first().click();
  await page.waitForTimeout(500);

  const body = await page.evaluate(() => document.body.innerText);
  expect(body, 'error-boundary visible').not.toContain('Something went wrong');
  expect(errors, `JS errors: ${errors.join('\n')}`).toEqual([]);
});

test('Daily tab — Sprint #16 v3 layout renders', async ({ page, context }) => {
  await seedGuestMode(context);

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.locator('.tab-item').filter({ hasText: 'Daily' }).first().click();
  await page.waitForTimeout(400);

  // Greeting strip with KO countdown chip (Stage 2)
  await expect(page.locator('.daily-greet')).toBeVisible();
  await expect(page.locator('.daily-greet-ko-val')).toBeVisible();

  // Form hero (Stage 1): unbeaten run + per-mode chips + form strip
  await expect(page.locator('.form-hero')).toBeVisible();
  await expect(page.getByText('match unbeaten run')).toBeVisible();
  await expect(page.locator('.run-chip.f')).toBeVisible();
  await expect(page.locator('.run-chip.t')).toBeVisible();
  await expect(page.locator('.form-strip .form-cell')).toHaveCount(14);

  // Up next card (Stage 3)
  await expect(page.locator('.up-next')).toBeVisible();
  await expect(page.getByText("Tomorrow's Daily")).toBeVisible();

  // Other modes panel (now "Friendlies" per Stage 7 vocab)
  await expect(page.getByText(/Friendlies|Between fixtures/i)).toBeVisible();

  // Removed in Sprint #16 Stage 6 — these must NOT exist anymore
  await expect(page.locator('.daily-stats-row')).toHaveCount(0);
  await expect(page.locator('.cal-grid')).toHaveCount(0);
  await expect(page.locator('.streak-hero')).toHaveCount(0);
  await expect(page.locator('.daily-zone[aria-label="Today"]')).toHaveCount(0);
});
