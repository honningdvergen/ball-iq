// Sprint #14 Stage 2 — DailyScreen extraction verification.
// Confirms Daily tab renders without errors and that all the post-
// extraction surfaces (Today actions, StreakHero, week chip, calendar,
// Other modes) are present.

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

  expect(errors, `JS errors: ${errors.join('\n')}`).toEqual([]);
});

test('Daily tab — Today actions + Streak hero + Calendar + Other modes all render', async ({ page, context }) => {
  await seedGuestMode(context);

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.locator('.tab-item').filter({ hasText: 'Daily' }).first().click();
  await page.waitForTimeout(400);

  // Today's 7 + Footle pills (top of Daily tab)
  await expect(page.locator('.today-actions .ta-title').filter({ hasText: "Today's 7" })).toBeVisible();
  await expect(page.locator('.today-actions .ta-title').filter({ hasText: 'Footle' })).toBeVisible();
  // Streak hero
  await expect(page.locator('.streak-hero-label')).toHaveText(/Day Streak/i);
  // 4-stat row (Sprint #15 Stage 4)
  await expect(page.locator('.daily-stats-row')).toBeVisible();
  await expect(page.locator('.daily-stats-row .stat-tile')).toHaveCount(4);
  await expect(page.getByText('This Month', { exact: true })).toBeVisible();
  await expect(page.getByText('Perfect Days', { exact: true })).toBeVisible();
  await expect(page.getByText('Lifetime', { exact: true })).toBeVisible();
  await expect(page.getByText('Win Rate', { exact: true })).toBeVisible();
  // Week chip exists
  await expect(page.locator('.week-chip')).toBeVisible();
  // Calendar headers visible
  await expect(page.locator('.cal-month')).toBeVisible();
  // Other modes / While you wait
  await expect(page.getByText(/Other modes to try|While you wait for tomorrow/i)).toBeVisible();

  await page.screenshot({ path: 'test-results/sprint14-stage2-daily.png', fullPage: true });
});

test('Daily calendar — month navigation works', async ({ page, context }) => {
  await seedGuestMode(context);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.locator('.tab-item').filter({ hasText: 'Daily' }).first().click();
  await page.waitForTimeout(400);

  const monthLabel = page.locator('.cal-month');
  const before = await monthLabel.textContent();
  await page.getByRole('button', { name: 'Previous month' }).click();
  await page.waitForTimeout(200);
  const after = await monthLabel.textContent();
  expect(after).not.toBe(before);
});
