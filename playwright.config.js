// Playwright config — focused on mobile-viewport visual audits of the
// production site. Sprint #5 A5 sets up the toolchain so future sprints
// can run real-browser tests instead of the CSS-only static analysis we
// did in Sprint #4 TT.
//
// Profiles: 5 mobile devices spanning the realistic launch viewport range
// (360-430px phones + iPad Mini 768px portrait). Firefox profiles are
// intentionally omitted — we ship to a webview-and-Safari/Chrome audience,
// and Firefox install would add ~80 MB without much marginal coverage.

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BALLIQ_BASE_URL || 'https://balliq.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Mobile viewport profiles. Each tagged so individual viewports can be
  // run via `npx playwright test --project="iphone-se"`.
  projects: [
    {
      // 375 × 667 — iPhone SE 2nd/3rd gen. Tight viewport, common floor case.
      name: 'iphone-se',
      use: { ...devices['iPhone SE'] },
    },
    {
      // 393 × 852 — iPhone 14 Pro / 15 Pro. Modern flagship iOS.
      name: 'iphone-14-pro',
      use: { ...devices['iPhone 14 Pro'] },
    },
    {
      // 430 × 932 — iPhone 14 Pro Max / 15 Pro Max. Largest iOS phone.
      name: 'iphone-14-pro-max',
      use: { ...devices['iPhone 14 Pro Max'] },
    },
    {
      // 360 × 800 — Galaxy S22 / similar Android. Smallest realistic
      // launch-traffic phone width — the .app container's max-width
      // (420px) caps to viewport here, so this is the tightest content-area test.
      name: 'galaxy-s22',
      use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 800 } },
    },
    {
      // 768 × 1024 portrait — iPad Mini. Verifies the centered-mobile-in-tablet
      // layout the app falls into above 420px max-width.
      name: 'ipad-mini',
      use: { ...devices['iPad Mini'] },
    },
  ],
})
