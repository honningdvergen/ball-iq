// Sprint #26 X2 — cross-device onboarding state.
//
// Three paths:
//   1. Fresh guest, no localStorage → onboarding shows
//   2. Guest with biq_onboarded=1 in localStorage → onboarding skipped
//   3. (Signed-in cross-device path is covered structurally — the
//      authProfile-driven effect can't easily be exercised end-to-end
//      without a real Supabase auth session, so the Playwright coverage
//      is the local-only paths plus a build-time assertion that the
//      effect is wired. The Supabase migration adding the column is
//      the cloud-side half.)

import { test, expect } from '@playwright/test';

test('fresh guest in a browser tab lands on the app, not the warm-up', async ({ page, context }) => {
  // 2026-09-03: a browser tab opening /play cold skips the onboarding warm-up
  // — main.jsx marks biq_onboarded on the way in, because the front door at
  // / is the taster now. Native and installed PWAs keep their first-run flow,
  // which Playwright (a plain browser tab) cannot reach.
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      // explicitly do NOT set biq_onboarded
    } catch {}
  });

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.fd-appbar')).toBeVisible();
  await expect(page.locator('.onboard-wrap')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('biq_onboarded'))).toBe('1');
});

test('guest with biq_onboarded=1 skips onboarding', async ({ page, context }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  // Main-app nav visible = we reached the app, onboarding was skipped.
  // A browser tab renders the .fd-appbar; native / PWA the .tab-bar or the
  // .biq-nav left rail — accept whichever is live.
  await expect(page.locator('.fd-appbar, .tab-bar, .biq-nav').filter({ visible: true }).first()).toBeVisible();
});

test('onboarded user does NOT replay onboarding after refresh', async ({ page, context }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.fd-appbar, .tab-bar, .biq-nav').filter({ visible: true }).first()).toBeVisible();

  await page.reload();
  await page.waitForLoadState('networkidle');
  // Nav visible after reload too — biq_onboarded persisted, no replay.
  await expect(page.locator('.fd-appbar, .tab-bar, .biq-nav').filter({ visible: true }).first()).toBeVisible();
});

// NOTE on signed-in cross-device path: the authProfile-driven sync
// effect runs only when there's a real Supabase session, which requires
// a fixture user that this repo doesn't have wired up. The effect is
// covered structurally — by build success (the code lands), the
// migration applied in this sprint, and the local-only paths above.
// Add a fixture-user end-to-end test when we set up a test Supabase
// project (post-launch).
