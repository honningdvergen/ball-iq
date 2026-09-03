// Sprint #13 Stage 1 — pilot refactor (Profile extraction) + K3 greeting fix.
// Smoke-verifies the dev build at the URL Playwright is configured with.

import { test, expect } from '@playwright/test';

// Third-party AdSense iframes throw cross-origin SecurityErrors under
// http://localhost (webkit especially) — ad-script noise, not app errors.
const AD_FRAME_NOISE = /googlesyndication|adtrafficquality|googleads|doubleclick/;

test('home renders without console errors after extraction', async ({ page }) => {
  const errors = [];
  const networkFails = [];
  page.on('pageerror', (e) => {
    if (AD_FRAME_NOISE.test(e.message)) return;
    errors.push(`pageerror: ${e.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      // 403s are reported as generic console-errors by the browser with no
      // detail. Filter them to networkFails for separate inspection so a
      // backend RLS response doesn't mask real JS errors from the refactor.
      if (/Failed to load resource/.test(t)) return;
      if (AD_FRAME_NOISE.test(t)) return;
      errors.push(`console.error: ${t}`);
    }
  });
  page.on('response', (resp) => {
    if (!resp.ok() && resp.status() !== 0) {
      networkFails.push(`${resp.status()} ${resp.url()}`);
    }
  });

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Hard fail only on real JS errors; surface network failures for context.
  expect(errors, `JS errors: ${errors.join('\n')}\nNetwork fails (info): ${networkFails.join('\n')}`).toEqual([]);
});

test('K3 greeting — no "Guest" / undefined / object placeholders during load', async ({ page, context }) => {
  // Fresh storage state: brand-new install — no auth, no name set.
  await context.clearCookies();
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  // Capture greeting frame-by-frame for the first 4 seconds, covering both
  // the no-name guest path and the signed-in-but-authProfile-still-loading
  // intermediate state (Sprint #14 M3 — same render path; the K3 fix's
  // `homeDisplayName || null` makes both cases fall through safely).
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const text = await page.evaluate(() => document.body.innerText);
    seen.add(text);
    await page.waitForTimeout(200);
  }
  const combined = Array.from(seen).join('\n----\n');
  // None of these placeholder/leak strings should ever render in the greeting.
  expect(combined).not.toMatch(/Good (morning|afternoon|evening),\s*Guest\b/);
  expect(combined).not.toMatch(/Good (morning|afternoon|evening),\s*undefined\b/);
  expect(combined).not.toMatch(/Good (morning|afternoon|evening),\s*null\b/);
  expect(combined).not.toMatch(/Good (morning|afternoon|evening),\s*\[object/);
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
  page.on('pageerror', (e) => {
    if (AD_FRAME_NOISE.test(e.message)) return;
    errors.push(`pageerror: ${e.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (/Failed to load resource/.test(t)) return;
      if (AD_FRAME_NOISE.test(t)) return;
      errors.push(`console.error: ${t}`);
    }
  });

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Tap the Profile tab. In a browser tab the app's tabs live in the
  // .fd-appbar under the site header (2026-09-03 web shell); native and
  // installed PWAs keep the .tab-bar / .biq-nav rail. Filter for the visible one.
  const profileTab = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: 'Profile', visible: true });
  await profileTab.first().click();
  await page.waitForTimeout(400);

  // ProfileScreen renders these section headers.
  await expect(page.getByText(/Badges —/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Your Journey/i)).toBeVisible({ timeout: 5000 });

  await page.screenshot({ path: 'test-results/sprint13-stage1-profile.png', fullPage: true });

  expect(errors, `Console/page errors: ${errors.join('\n')}`).toEqual([]);
});

test('K1 — Profile avatar tap routes guests to the save auth prompt', async ({ page, context }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  await page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: 'Profile', visible: true }).first().click();
  await page.waitForTimeout(400);
  // The emoji picker is gone (photo avatars replaced the emoji set). A guest
  // has nowhere to upload a photo TO, so tapping the avatar deliberately
  // opens the 'save' auth prompt instead of dead-tapping (ProfileScreen
  // openAvatarPicker). Assert the overlay's distinctive sub-copy — the
  // guest banner on the profile itself shares the "Save your progress"
  // headline, so the headline alone can't prove the overlay opened.
  // ProfileScreen auto-opens an example "elite card" to anyone with zero games
  // played (ProfileScreen.jsx:1457, `gamesPlayed === 0 && !sampleDismissed`),
  // which is exactly what a freshly-seeded guest is. It is a real modal with
  // aria-modal, so it intercepts the avatar click and this test failed on every
  // CI run for weeks — invisibly, because the job was continue-on-error.
  // Dismiss it the way a player does, by tapping the overlay.
  const sample = page.locator('.modal-overlay[aria-label="What an elite card looks like"]');
  if (await sample.isVisible().catch(() => false)) {
    await sample.click({ position: { x: 5, y: 5 } });
    await expect(sample).toBeHidden({ timeout: 3000 });
  }

  await page.getByRole('button', { name: 'Edit profile photo' }).first().click();
  await expect(
    page.getByText('so your XP, stats, and streak follow you to any device')
  ).toBeVisible({ timeout: 3000 });
});
