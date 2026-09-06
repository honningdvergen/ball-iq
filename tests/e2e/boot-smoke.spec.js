// Boot smoke — renders three screens the unit suite only pins as strings.
//
// ⚠️ Three times in one week (2026-09-06 review, E15) a `const` in App.jsx was
// read above its declaration — the countdown effect, the club-page engine, the
// services memo — and each shipped past lint, ~570 unit tests and the build
// gate, to be caught only by OPENING THE SCREEN. Nothing else in the gate
// renders one. This does: Home → Classic → Q1, Home → Daily 7 → Q1,
// Home → Footle board. A TDZ throw lands in `pageerror` and fails here.

import { test, expect } from '@playwright/test';

function seedGuest(context) {
  return context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
    } catch {}
  });
}

const NOISE = /googlesyndication|adtrafficquality|googleads|doubleclick|Failed to load resource|Unexpected token '<'/;

function captureErrors(page) {
  const errs = [];
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errs.push(`pageerror: ${e.message}`); });
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errs.push(`console.error: ${m.text().slice(0, 200)}`); });
  return errs;
}

async function home(page) {
  await page.goto('/play?tab=home');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.todays-seven-secondary').first()).toBeVisible({ timeout: 15000 });
}

async function expectQuestionOnScreen(page, label) {
  // A rendered question: the progress counter ("1/10", "1/7") and at least
  // two answer options with text. Both come from QuizEngine, after every
  // hook in it has run — a TDZ inside the engine never gets this far.
  // Mobile renders the counter as .q-ctr ("1/10"); the desktop layout keeps
  // that span in the DOM but hidden and shows .qd-counter instead.
  await expect(page.locator('.q-ctr:visible, .qd-counter:visible').first(), `${label}: progress counter`).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.q-ctr:visible, .qd-counter:visible').first()).toHaveText(/1\s*(\/|of)\s*(7|10)/);
  const opts = page.locator('button').filter({ hasText: /\S/ });
  expect(await opts.count(), `${label}: answer options`).toBeGreaterThan(2);
}

test('Home → Classic → Q1 renders', async ({ page, context }) => {
  await seedGuest(context);
  const errs = captureErrors(page);
  await home(page);
  await page.locator('.play-card').filter({ hasText: 'Classic' }).first().click();
  await expectQuestionOnScreen(page, 'Classic');
  expect(errs).toEqual([]);
});

test('Home → Daily 7 → Q1 renders', async ({ page, context }) => {
  await seedGuest(context);
  const errs = captureErrors(page);
  await home(page);
  await page.locator('.todays-seven-secondary').filter({ hasText: /Daily 7/ }).first().click();
  await expectQuestionOnScreen(page, 'Daily 7');
  expect(errs).toEqual([]);
});

test('Home → Footle → board renders', async ({ page, context }) => {
  await seedGuest(context);
  const errs = captureErrors(page);
  await home(page);
  await page.locator('.todays-seven-secondary').filter({ hasText: /Footle/ }).first().click();
  // The board is a grid of tiles plus the on-screen keyboard's ENTER key
  // (aria-label "Enter key — submit guess", class .wd-key-enter).
  await expect(page.locator('.wd-key-enter').first()).toBeVisible({ timeout: 15000 });
  expect(errs).toEqual([]);
});
