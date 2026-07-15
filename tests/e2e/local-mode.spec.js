// Regression coverage for the Local-mode async-load crash.
// Before the fix: getQs (made async in commit fc6e7aa) was called from a
// useState initializer in LocalGameScreen — stored a Promise instead of an
// array and (Promise || []).filter threw a TypeError at mount.
// Should have been caught by Stage 1 / Stage 2 verification; wasn't.
// This spec exercises Local setup → game across all three sub-modes so the
// regression can't slip through again.

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

async function enterLocalSetup(page) {
  await page.goto('/play');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // MultiplayerCard's Local CTA on Home — labelled "Local" or "Pass-and-play"
  await page.getByRole('button', { name: /local/i }).first().click();
  await page.waitForTimeout(500);
}

async function startLocalGame(page, modeLabel) {
  // LocalSetup screen — pick mode then Start
  const modeBtn = page.getByText(new RegExp(modeLabel, 'i')).first();
  if (await modeBtn.count()) await modeBtn.click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /^start/i }).first().click();
  // Async question load — give it a generous window
  await page.waitForTimeout(2000);
}

async function assertNoCrash(page, errs, label) {
  const text = await page.evaluate(() => document.body.innerText);
  expect(text, `${label}: error-boundary visible`).not.toContain('Something went wrong');
  expect(errs.filter(e => /raw\s*\|\|/.test(e) || /filter is not a function/.test(e) || /Rendered more hooks/.test(e)),
    `${label}: caught hook/filter regression`).toEqual([]);
}

test.describe('Local mode — no crash on mount across all sub-modes', () => {
  for (const mode of ['Classic', 'Sprint', 'Survival']) {
    test(`Local — ${mode} starts and renders gameplay`, async ({ page, context }) => {
      await seedGuestMode(context);
      const errs = await captureErrors(page);
      await enterLocalSetup(page);
      await startLocalGame(page, mode);
      await assertNoCrash(page, errs, `Local ${mode}`);
      // After load, the handoff screen renders the player name + a Tap-to-start
      // affordance (or in survival, a different intro). Ensure body has SOME
      // gameplay scaffold visible rather than the spinner alone.
      const text = await page.evaluate(() => document.body.innerText);
      // Loading text only briefly; should be gone after 2s timeout above.
      expect(text).not.toContain('Loading questions…');
    });
  }
});
