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

  await page.goto('/play');
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

test('Daily tab — "Today first" redesign renders', async ({ page, context }) => {
  // v4's tactics-card hero was replaced by the "Today first" Daily redesign:
  // greeting + Daily title with NEW PUZZLES IN countdown pill, the two
  // today-puzzle row-cards (Footle green / Daily 7 amber), the streak strip
  // with a last-14-days form group, and the Recent days table. Mobile and
  // desktop variants both live in the DOM (display:contents/none swap at
  // 1024px), so every text assertion filters for the visible copy.
  await seedGuestMode(context);

  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Browser tab: .fd-appbar; native / PWA: .tab-bar or .biq-nav. Filter
  // for whichever is visible at this viewport.
  const dailyNav = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: 'Daily', visible: true }).first();
  await dailyNav.click();
  await page.waitForTimeout(400);

  await expect(page.locator('.daily-screen')).toBeVisible();

  // Shared between both breakpoint variants.
  await expect(page.getByText('NEW PUZZLES IN').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('7 questions · ~3 min').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText('Recent days').filter({ visible: true }).first()).toBeVisible();

  // The two variants carry different copy — assert the one that's live.
  const isDesktop = await page.locator('.daily-desktop').isVisible();
  if (isDesktop) {
    await expect(page.getByText('surname of a footballer').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(/\d+ \/ \d+ played/).filter({ visible: true }).first()).toBeVisible();
    // Desktop streak card reuses the Home rail's hr-streak shape: 14 form cells.
    const streak = page.locator('.daily-desktop .hr-streak');
    await expect(streak).toBeVisible();
    await expect(streak.locator('.hr-form-cell')).toHaveCount(14);
  } else {
    // Same Footle prompt on both breakpoints since d58982a ("the prompt says
    // surname again"); this branch still asserted the older "Guess the player"
    // and was the one red test in the 2026-09-03 web-shell run.
    await expect(page.getByText('Surname of a footballer').filter({ visible: true }).first()).toBeVisible();
    // ⚠️ Do NOT hard-code the daily COUNT. This assertion read "of 2 played"
    // and silently broke the moment Trail and Mystery joined Footle and the
    // Daily 7 — the product now says 4. The contract worth testing is the
    // SHAPE of the counter, not a number that changes every time a mode ships.
    await expect(page.getByText(/\d+ of \d+ played/).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(/\d+ day streak/).filter({ visible: true }).first()).toBeVisible();
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
