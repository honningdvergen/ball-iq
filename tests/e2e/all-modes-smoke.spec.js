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
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Mobile renders the .footle-hero card; desktop (>=1024px) hides it and
  // shows the inline DesktopFootleHero whose CTA is .ffh-cta.
  await page.locator('.footle-hero, .ffh-cta').filter({ visible: true }).first().click();
  await page.waitForTimeout(1500);
  await expectNoCrash(page, errs, 'Footle');
});

test("Today's 7 entry", async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.locator('.todays-seven-secondary').first().click();
  await page.waitForTimeout(2000);
  await expectNoCrash(page, errs, "Today's 7");
});

for (const mode of ['Classic', 'Survival', 'Hot Streak', 'Legends', 'Chaos']) {
  test(`More-modes — ${mode}`, async ({ page, context }) => {
    await seedGuestMode(context);
    const errs = await captureErrors(page);
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.locator('.play-card').filter({ hasText: mode }).first().click();
    await page.waitForTimeout(1500);
    await expectNoCrash(page, errs, `More-modes ${mode}`);
  });
}

test('Ball IQ Test stays dead — no home entry to the killed mode', async ({ page, context }) => {
  // The mode was killed 2026-08-10 (commit 04303db). Its grid tile outlived
  // the removal and silently started an unbranded generic quiz — this guard
  // keeps both the tile and the copy from coming back.
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await expect(page.locator('.play-card').filter({ hasText: /Ball IQ Test|IQ Test/ })).toHaveCount(0);
  await expect(page.getByText("What's your IQ?")).toHaveCount(0);
  await expectNoCrash(page, errs, 'Ball IQ Test guard');
});

test('Multiplayer Online entry (guest → auth prompt, no crash)', async ({ page, context }) => {
  // MultiplayerCard (Sprint #12, reworked 1.1): the primary CTA is now
  // "Invite friends" (aria: Create a room and invite friends). Guests get
  // the auth prompt instead of a room — the smoke intent is unchanged:
  // a guest tapping the online CTA must not crash the app.
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Create a room and invite friends' }).first().click();
  await page.waitForTimeout(1500);
  await expectNoCrash(page, errs, 'Multiplayer Online');
});

test('Multiplayer Local entry', async ({ page, context }) => {
  // Sprint #28 used to skip desktop profiles (Local CTA hidden >=1024px).
  // The desktop-web refresh re-shows both MP CTAs at desktop widths, so the
  // "Same phone" entry (aria: Play locally on one phone) is now smoke-covered
  // on every project.
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Play locally on one phone' }).first().click();
  await page.waitForTimeout(800);
  await expectNoCrash(page, errs, 'Multiplayer Local entry');
});
