// Sprint #63 EE4 — desktop quiz-screen audit at 1280 + 1920.
//
// Sprint #27 Y1 deferred the quiz-screen desktop audit to V1.1 because
// "mid-game state was hard to seed programmatically". Trying again: we
// click into each mode from Home as a guest, wait for the first question
// to render, and screenshot the mid-quiz layout at desktop widths.
//
// Output: test-results/sprint63-ee4-{mode}-{viewport}.png — one per
// mode × viewport combination. Alex reviews and triages.
//
// Run:
//   npx playwright test sprint63-ee4 --project=desktop-1280 --project=desktop-1920
//
// Targets balliq.app live so we audit what users actually see.

import { test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true')
      localStorage.setItem('biq_onboarded', '1')
      localStorage.setItem('biq_first_tip_shown', '1')
      localStorage.setItem('biq-splash', 'shown')
    } catch {}
  })
})

async function shotMode({ page, testInfo, modeName, openLocator }) {
  await page.goto('/play')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  const entry = openLocator(page)
  if (!(await entry.count())) {
    await page.screenshot({
      path: `test-results/sprint63-ee4-${modeName}-${testInfo.project.name}-NOENTRY.png`,
      fullPage: true,
    })
    return
  }
  await entry.first().click()
  // First question reaches the DOM within ~1500ms in normal conditions.
  // We don't interact — just want the mid-quiz steady-state layout.
  await page.waitForTimeout(2200)
  await page.screenshot({
    path: `test-results/sprint63-ee4-${modeName}-${testInfo.project.name}.png`,
    fullPage: true,
  })
}

test("Footle mid-play", async ({ page }, testInfo) => {
  await shotMode({
    page, testInfo, modeName: 'footle',
    openLocator: (p) => p.locator('.footle-hero'),
  })
})

test("Today's 7 mid-quiz", async ({ page }, testInfo) => {
  await shotMode({
    page, testInfo, modeName: 'todays7',
    openLocator: (p) => p.locator('.todays-seven-secondary'),
  })
})

for (const [modeName, label] of [
  ['classic', 'Classic'],
  ['survival', 'Survival'],
  ['hotstreak', 'Hot Streak'],
  ['legends', 'Legends'],
  ['balliq', 'Test'],   // "Ball IQ Test" button text contains "Test"
  ['chaos', 'Chaos'],
  ['wc2026', 'World Cup'],
]) {
  test(`${modeName} mid-quiz`, async ({ page }, testInfo) => {
    await shotMode({
      page, testInfo, modeName,
      openLocator: (p) => p.locator('.play-card').filter({ hasText: label }),
    })
    // Classic tap opens a difficulty picker rather than the quiz directly.
    if (modeName === 'classic') {
      const med = page.locator('button').filter({ hasText: /Medium/i }).first()
      if (await med.count()) {
        await med.click()
        await page.waitForTimeout(1500)
        await page.screenshot({
          path: `test-results/sprint63-ee4-${modeName}-${testInfo.project.name}.png`,
          fullPage: true,
        })
      }
    }
  })
}
