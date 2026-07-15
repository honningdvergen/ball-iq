// Sprint #5 A6 — real mobile viewport audit.
// Captures full-page screenshots of three target screens (Home, Daily 7,
// Wordle) across all 5 mobile profiles defined in playwright.config.js.
//
// Sprint #6 B1 hardening: fullPage screenshots compose fixed-position
// elements (e.g. .tab-bar at viewport-bottom) at the wrong page-y, so a
// short viewport (iPhone SE 667h) renders the tab bar atop content like
// the WC countdown card and made Sprint #5 misread "34 days to go" as
// "0 days to go". The fullPage tests stay for whole-page review; the
// new "critical elements" test below captures key cards via
// locator.screenshot(), which auto-scrolls the element into view first
// so fixed overlays sit elsewhere on screen and don't occlude.
//
// Limitations:
//   - Daily 7 + Wordle entry points may sit behind the day's challenge
//     state. As a guest, the home page renders the same daily cards but
//     interaction depends on availability. We capture what's reachable.
//   - balliq.app is the target (live production). Run via:
//       npm run test:e2e -- viewport-audit.spec.js
//
// Output: test-results/viewport-{home,daily,wordle}-{profile}.png +
// test-results/viewport-element-{wc-card,friends-hero,daily-pair}-{profile}.png
// + the HTML report at playwright-report/index.html.

import { test } from '@playwright/test'

// Pre-seed the localStorage flag so AppGate routes us straight into guest
// mode without hitting the Login screen. Run BEFORE navigation; this
// fires per-test via Playwright's addInitScript hook.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true')
      // Suppress the onboarding overlay if it would otherwise block layout.
      localStorage.setItem('biq_onboarded', '1')
      // Suppress first-tip / splash so screenshots show the steady-state UI.
      localStorage.setItem('biq_first_tip_shown', '1')
      localStorage.setItem('biq-splash', 'shown')
    } catch {}
  })
})

test('home screen — full page', async ({ page }, testInfo) => {
  await page.goto('/play')
  await page.waitForLoadState('networkidle')
  // Give the lazy-loaded questions chunk a beat to settle so the home
  // mode picker renders fully populated.
  await page.waitForTimeout(800)
  await page.screenshot({
    path: `test-results/viewport-home-${testInfo.project.name}.png`,
    fullPage: true,
  })
})

test('daily tab — full page', async ({ page }, testInfo) => {
  await page.goto('/play')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  // Tap the Daily tab in the bottom tab bar. Its label is "Daily".
  // Match by accessible text — the .tab-item's .tab-label child carries it.
  const dailyTab = page.locator('button.tab-item:has-text("Daily")')
  if (await dailyTab.count()) {
    await dailyTab.first().click()
    await page.waitForTimeout(500)
  }
  await page.screenshot({
    path: `test-results/viewport-daily-${testInfo.project.name}.png`,
    fullPage: true,
  })
})

test('wordle main — full page', async ({ page }, testInfo) => {
  await page.goto('/play')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  // From the Daily section / mode picker, find the Puzzle (Wordle) entry.
  // The Daily-pair cards render with className "daily-pair-card.wordle".
  // Tapping it routes into the Wordle screen.
  const wordleEntry = page.locator('.daily-pair-card.wordle').first()
  if (await wordleEntry.count()) {
    await wordleEntry.click()
    await page.waitForTimeout(700)
  } else {
    // Fallback: scroll the home mode picker and find a "Puzzle"-labeled
    // play-card. Different surface but reaches the same screen.
    const fallback = page.locator('.play-card:has-text("Puzzle")').first()
    if (await fallback.count()) {
      await fallback.click()
      await page.waitForTimeout(700)
    }
  }
  await page.screenshot({
    path: `test-results/viewport-wordle-${testInfo.project.name}.png`,
    fullPage: true,
  })
})

// Per-element captures that are immune to the fullPage stitching artifact
// (fixed .tab-bar overlaying content at viewport-bottom). On short viewports
// (e.g. iPhone SE 667h) scrollIntoView alone is not enough — even after
// scrolling, the element can land at viewport-bottom under the fixed bar.
// We hide the fixed .tab-bar via injected CSS for this test only, so each
// locator.screenshot captures the element rect with no overlay regardless
// of how the auto-scroll resolves.
test('home — critical element captures', async ({ page }, testInfo) => {
  await page.goto('/play')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)

  await page.addStyleTag({
    content: '.tab-bar, .version-banner, .offline-banner { display: none !important; }',
  })

  const profile = testInfo.project.name
  const targets = [
    { name: 'wc-card', selector: '.wc-card' },
    { name: 'friends-hero', selector: '.hero-online' },
    { name: 'daily-pair', selector: '.daily-pair' },
  ]

  for (const t of targets) {
    const loc = page.locator(t.selector).first()
    if (!(await loc.count())) continue
    await loc.scrollIntoViewIfNeeded()
    await page.waitForTimeout(150)
    await loc.screenshot({
      path: `test-results/viewport-element-${t.name}-${profile}.png`,
    })
  }
})
