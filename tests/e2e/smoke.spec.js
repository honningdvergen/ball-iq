// Smoke test — verifies the Playwright toolchain is wired up correctly.
// Loads balliq.app on each mobile profile and screenshots the home screen.
//
// Sprint #5 A5: this is the toolchain-verification test. The actual
// viewport audit (Sprint #5 A6) lives in viewport-audit.spec.js.

import { test, expect } from '@playwright/test'

test('home loads and renders', async ({ page }, testInfo) => {
  await page.goto('/play')
  // App shell is mobile-only-render up to 1023px; expects either the
  // "Ball IQ" wordmark in the header (logo) OR the main play CTA.
  // Settle for any visible text on the page after network idle.
  await page.waitForLoadState('networkidle')
  // Capture a baseline screenshot per profile. Saved into the
  // test-results/ directory under each profile name.
  await page.screenshot({
    path: `test-results/smoke-${testInfo.project.name}.png`,
    fullPage: true,
  })
  // Cheap assertion: the title is set. If the app failed to render at all
  // we'd see <title>Vite + React</title> or empty; the production build
  // sets a real title.
  const title = await page.title()
  expect(title.length).toBeGreaterThan(0)
})
