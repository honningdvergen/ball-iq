/**
 * Synthetic traffic must never reach the funnel.
 *
 * Origin, measured 2026-08-21: three hours after funnel_events went live it
 * held 905 rows, 767 of them `first-game-started` at ~250/hour, exactly one
 * per visitor, arriving in precisely the hours this suite was running — against
 * a real DAU of 13-17. The e2e suite runs against localhost, localhost reads
 * .env.local, and .env.local points at PRODUCTION Supabase because there is no
 * staging project. The suite was corrupting the instrument the product's
 * decisions come from, at roughly 50 synthetic rows per real one.
 *
 * ⚠️ THIS TEST MUST ACTUALLY ENTER A GAME. The first version only loaded
 * /play, asserted zero writes, and passed — including with the gate
 * deliberately disabled, because `first-game-started` fires on the PLAYING
 * state, not on page load. It proved nothing. Verified the current version by
 * disabling the gate and watching it fail.
 */
import { test, expect } from '@playwright/test';

test('automated traffic never reaches the funnel', async ({ page }) => {
  const funnelWrites = [];
  page.on('request', (r) => {
    if (/record_funnel_event/.test(r.url())) funnelWrites.push(r.url());
  });

  // Same seeding the other 40 specs use: guest mode + onboarding done, so we
  // land on Home rather than the onboarding overlay.
  await page.context().addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
      localStorage.setItem('biq_consent_analytics', 'denied');
      // The event is once-per-device; a stale flag would make this vacuous.
      localStorage.removeItem('biq_first_game_started');
    } catch { /* private mode */ }
  });

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // The gate keys off navigator.webdriver, so if this is ever false the test
  // is not testing what it claims to.
  expect(
    await page.evaluate(() => navigator.webdriver),
    'only meaningful under automation',
  ).toBe(true);

  // Enter a game — this is what sets `playing` and fires first-game-started.
  // Survival starts directly (Classic opens a difficulty picker first).
  await page.locator('.play-card').filter({ hasText: 'Survival' }).first().click();

  // Confirm we really are in a game, so a silent navigation failure cannot
  // masquerade as "the gate worked".
  await expect
    .poll(async () => page.evaluate(() => document.body.classList.contains('in-focused-play')), {
      timeout: 15_000,
    })
    .toBe(true);

  await page.waitForTimeout(2000);

  expect(
    funnelWrites,
    `a robot wrote ${funnelWrites.length} row(s) into the production funnel`,
  ).toEqual([]);
});
