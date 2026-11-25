// All-modes smoke. Promoted from the ad-hoc _all-modes-smoke spec used
// during Sprint #14's Local-mode fix into a permanent committed spec per
// the verification-gate lesson: refactor smoke must cover what didn't
// change as well as what did.

import { test, expect } from '@playwright/test';

function seedGuestMode(context) {
  return context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });
}

// Third-party AdSense iframes (loaded by the shared index.html shell) throw
// cross-origin SecurityErrors under http://localhost — pure environment
// noise from the ad script, not app failures. Filter them out of the crash
// assertion the same way resource-load 403s already are.
const AD_FRAME_NOISE = /googlesyndication|adtrafficquality|googleads|doubleclick/;

async function captureErrors(page) {
  const errs = [];
  page.on('pageerror', (e) => {
    if (AD_FRAME_NOISE.test(e.message)) return;
    errs.push(`pageerror: ${e.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (/Failed to load resource/.test(t)) return;
      if (AD_FRAME_NOISE.test(t)) return;
      // Chrome's own notice, not an app fault: a game opened by its link (Hot Streak has no
      // row on Home since 25 Nov 2026) can ask for a haptic before the first tap, and Chrome
      // refuses it and says so. Timing decides whether it shows, so it made this run flaky.
      if (/Blocked call to navigator\.vibrate/.test(t)) return;
      errs.push(`console.error: ${t}`);
    }
  });
  return errs;
}

async function expectNoCrash(page, errs, label) {
  const text = await page.evaluate(() => document.body.innerText);
  expect(text, `${label}: error-boundary visible`).not.toContain('Something went wrong');
  expect(errs, `${label}: console errors`).toEqual([]);
}

test('Footle entry', async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Footle is the first of the four Today rows since 2026-09-05 (the hero
  // card and the desktop DesktopFootleHero both left Home with it).
  await page.locator('.todays-seven-secondary').filter({ hasText: /Footle/ }).first().click();
  await page.waitForTimeout(1500);
  await expectNoCrash(page, errs, 'Footle');
});

test("Today's 7 entry", async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.locator('.todays-seven-secondary').first().click();
  await page.waitForTimeout(2000);
  await expectNoCrash(page, errs, "Today's 7");
});

test('More-modes — Survival', async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // A row of the More modes card since 25 Nov 2026 (it was a .play-card tile).
  await page.locator('.home-list .todays-seven-secondary').filter({ hasText: 'Survival' }).first().click();
  await page.waitForTimeout(1500);
  await expectNoCrash(page, errs, 'More-modes Survival');
});

// Hot Streak has no row on Home since 25 Nov 2026. The mode is still there: this
// starts it the way the website's own card does, by its link.
test('Hot Streak — by its link', async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play?game=hotstreak');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await expect(page.locator('.home-list')).toHaveCount(0); // in the game, not on Home
  await expectNoCrash(page, errs, 'Hot Streak by link');
});

// Classic, Legends and Chaos left the grid on 16 Oct 2026: one Quiz row opens
// the Quiz screen, where each is a chip ("Everything" is the old Classic).
for (const [mode, chip] of [['Classic', 'Everything'], ['Legends', 'Legends'], ['Chaos', 'Chaos'], ['League', 'Premier League']]) {
  test(`Quiz screen — ${mode}`, async ({ page, context }) => {
    await seedGuestMode(context);
    const errs = await captureErrors(page);
    await page.goto('/play?tab=home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.locator('.quiz-entry').first().click();
    await page.locator('.qz-chip').filter({ hasText: chip }).first().click();
    await page.locator('.qz-start').click();
    await page.waitForTimeout(1500);
    await expectNoCrash(page, errs, `Quiz screen ${mode}`);
  });
}

test('Ball IQ Test stays dead — no home entry to the killed mode', async ({ page, context }) => {
  // The mode was killed 2026-08-10 (commit 04303db). Its grid tile outlived
  // the removal and silently started an unbranded generic quiz — this guard
  // keeps both the tile and the copy from coming back.
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await expect(page.locator('.home-list .todays-seven-secondary, .play-card').filter({ hasText: /Ball IQ Test|IQ Test/ })).toHaveCount(0);
  await expect(page.getByText("What's your IQ?")).toHaveCount(0);
  await expectNoCrash(page, errs, 'Ball IQ Test guard');
});

test('Multiplayer Online entry (guest → auth prompt, no crash)', async ({ page, context }) => {
  // MultiplayerCard: since 24 Nov 2026 the Home row has one target, which
  // opens the Multiplayer tab (the "Invite" pill that created a room from
  // Home is gone). The smoke intent is unchanged: a guest tapping the online
  // entry must not crash the app.
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Open the Multiplayer tab' }).first().click();
  await page.waitForTimeout(1500);
  await expectNoCrash(page, errs, 'Multiplayer Online');
});

test('Multiplayer Local entry', async ({ page, context }) => {
  // "Same phone" left the Home card on 2026-09-06 (the card became a single
  // row with one quiet Invite pill). Couch play is entered from the Online
  // tab's "Local pass & play" row, so the smoke goes there.
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play?tab=online');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.getByText('Local pass & play').locator('xpath=ancestor::div[2]').getByRole('button', { name: 'Play' }).first().click();
  await page.waitForTimeout(800);
  await expectNoCrash(page, errs, 'Multiplayer Local entry');
});
