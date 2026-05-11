// Sprint #13 Stage 1 — pilot refactor (Profile extraction) + K3 greeting fix.
// Smoke-verifies the dev build at the URL Playwright is configured with.

import { test, expect } from '@playwright/test';

test('home renders without console errors after extraction', async ({ page }) => {
  const errors = [];
  const networkFails = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      // 403s are reported as generic console-errors by the browser with no
      // detail. Filter them to networkFails for separate inspection so a
      // backend RLS response doesn't mask real JS errors from the refactor.
      if (/Failed to load resource/.test(t)) return;
      errors.push(`console.error: ${t}`);
    }
  });
  page.on('response', (resp) => {
    if (!resp.ok() && resp.status() !== 0) {
      networkFails.push(`${resp.status()} ${resp.url()}`);
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Hard fail only on real JS errors; surface network failures for context.
  expect(errors, `JS errors: ${errors.join('\n')}\nNetwork fails (info): ${networkFails.join('\n')}`).toEqual([]);
});

test('K3 greeting — no "Guest" placeholder visible on fresh load', async ({ page, context }) => {
  // Fresh storage state: brand-new install — no auth, no name set.
  await context.clearCookies();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Capture greeting frame-by-frame for the first 4 seconds.
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const text = await page.evaluate(() => document.body.innerText);
    seen.add(text);
    await page.waitForTimeout(200);
  }
  const combined = Array.from(seen).join('\n----\n');
  // Either we never reach the home screen (Login takes over) OR the home
  // greeting reads "Good morning" / "Good afternoon" / "Good evening" with
  // no trailing "Guest".
  expect(combined).not.toMatch(/Good (morning|afternoon|evening),\s*Guest/);
});

test('K1 — Profile tab renders Badges + Journey in guest mode', async ({ page, context }) => {
  // Seed guest mode + onboarded so AuthProvider takes the guest path AND
  // the home screen renders past any first-run onboarding overlay.
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });

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

  // Tap the Profile tab — the bottom nav exposes it by label "Profile".
  const profileTab = page.locator('.tab-item').filter({ hasText: 'Profile' });
  await profileTab.first().click();
  await page.waitForTimeout(400);

  // ProfileScreen renders these section headers.
  await expect(page.getByText(/Badges —/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Your Journey/i)).toBeVisible({ timeout: 5000 });

  await page.screenshot({ path: 'test-results/sprint13-stage1-profile.png', fullPage: true });

  expect(errors, `Console/page errors: ${errors.join('\n')}`).toEqual([]);
});

test('K1 — Profile avatar emoji picker opens (guest)', async ({ page, context }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  await page.locator('.tab-item').filter({ hasText: 'Profile' }).first().click();
  await page.waitForTimeout(400);
  // The profile avatar button — guests get the emoji picker directly.
  await page.getByRole('button', { name: 'Edit profile photo' }).first().click();
  await expect(page.getByText('Choose your avatar')).toBeVisible({ timeout: 3000 });
});
