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

async function captureErrors(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (/Failed to load resource/.test(t)) return;
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
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.locator('.footle-hero').first().click();
  await page.waitForTimeout(1500);
  await expectNoCrash(page, errs, 'Footle');
});

test("Today's 7 entry", async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/');
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
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.locator('.play-card').filter({ hasText: mode }).first().click();
    await page.waitForTimeout(1500);
    await expectNoCrash(page, errs, `More-modes ${mode}`);
  });
}

test('Ball IQ Test entry', async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.locator('.play-card').filter({ hasText: /Ball IQ Test|IQ Test/ }).first().click();
  await page.waitForTimeout(2000);
  await expectNoCrash(page, errs, 'Ball IQ Test');
});

test('Multiplayer Online entry (guest → toast, no crash)', async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Play online multiplayer' }).first().click();
  await page.waitForTimeout(1500);
  await expectNoCrash(page, errs, 'Multiplayer Online');
});

test('Multiplayer Local entry', async ({ page, context }) => {
  await seedGuestMode(context);
  const errs = await captureErrors(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Play local multiplayer' }).first().click();
  await page.waitForTimeout(800);
  await expectNoCrash(page, errs, 'Multiplayer Local entry');
});
