// Sprint #65 GG2 — Daily / Home visual consistency audit.
// Captures full-page screenshots of Home and Daily at iPhone 14 Pro
// (393x852, 3x). Run before + after the fix to confirm matching.
//
//   npx playwright test sprint65-gg2 --project=iphone-14-pro

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

test('home — full page', async ({ page }, testInfo) => {
  await page.goto('/play?tab=home')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  await page.screenshot({
    path: `test-results/sprint65-gg2-home-${testInfo.project.name}.png`,
    fullPage: true,
  })
})

test('daily — full page', async ({ page }, testInfo) => {
  await page.goto('/play?tab=home')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  // Browser tab: .fd-appbar tab; native / PWA: .tab-bar or .biq-nav rail —
  // whichever is visible (the hidden ones hang a click).
  const dailyTab = page.locator('.fd-appbar-tab, .tab-item, .biq-nav .bn-item')
    .filter({ hasText: 'Daily', visible: true })
  if (await dailyTab.count()) {
    await dailyTab.first().click()
    await page.waitForTimeout(500)
  }
  await page.screenshot({
    path: `test-results/sprint65-gg2-daily-${testInfo.project.name}.png`,
    fullPage: true,
  })
})
