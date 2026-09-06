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

// Third-party AdSense iframes throw cross-origin SecurityErrors under
// http://localhost (webkit especially) — ad-script noise, not app errors.
const AD_FRAME_NOISE = /googlesyndication|adtrafficquality|googleads|doubleclick/;

test('Daily tab — no console errors after extraction', async ({ page, context }) => {
  await seedGuestMode(context);
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

  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // In a browser tab the app's tabs are the .fd-appbar under the site
  // header (2026-09-03 web shell); native and installed PWAs keep the
  // .tab-bar / .biq-nav rail. Filter for whichever is visible.
  const dailyNav = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: 'Daily', visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(500);

  const body = await page.evaluate(() => document.body.innerText);
  expect(body, 'error-boundary visible').not.toContain('Something went wrong');
  expect(errors, `JS errors: ${errors.join('\n')}`).toEqual([]);
});

test('Daily tab — History renders (streak + recent days, no rows)', async ({ page, context }) => {
  // 2026-09-06 (Alex's call in the app-home critique): the Daily tab is
  // HISTORY — streak, the last-14-days form and the recent-days table. The
  // four today-puzzle rows live on Home only; the tab no longer repeats them
  // ("copies the app"). Mobile and desktop variants both live in the DOM
  // (display:contents/none swap at 1024px), so every text assertion filters
  // for the visible copy.
  await seedGuestMode(context);

  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Browser tab: .fd-appbar; native / PWA: .tab-bar or .biq-nav. The label is
  // "Daily" in the app bar and "History" in the native tab bar / left rail.
  const dailyNav = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: /Daily|History/, visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(400);

  await expect(page.locator('.daily-screen')).toBeVisible();
  await expect(page.getByText('History', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/New puzzles in/i).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/Recent days/i).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/day streak/i).filter({ visible: true }).first()).toBeVisible();

  // The rows are Home's. Their sublines must NOT appear in THIS screen (Home
  // stays mounted but hidden behind the tab switch, so scope to the screen).
  await expect(page.locator('.daily-screen').getByText('7 questions · ~3 min')).toHaveCount(0);
  await expect(page.locator('.daily-screen').getByText(/Surname of a footballer/i)).toHaveCount(0);

  const isDesktop = await page.locator('.daily-desktop').isVisible();
  if (isDesktop) {
    const streak = page.locator('.daily-desktop .hr-streak');
    await expect(streak).toBeVisible();
    await expect(streak.locator('.hr-form-cell')).toHaveCount(14);
  } else {
    const form = page.getByRole('group', { name: 'Form — last 14 days' }).filter({ visible: true }).first();
    await expect(form).toBeVisible();
    await expect(form.locator('span')).toHaveCount(14);
  }

  // v4 elements that MUST be gone — guard against accidental revival.
  await expect(page.locator('.tactics-card')).toHaveCount(0);
  await expect(page.locator('.daily-greet')).toHaveCount(0);

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
