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
      // Sprint #66 HH2: 320 × 568 — iPhone SE 1st gen / iPhone 5s floor.
      // True minimum viewport in the wild. Anything that overflows or
      // text-clips here breaks for the ~1% of users still on the smallest
      // reachable iOS PWA viewport.
      name: 'iphone-5s',
      use: { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } },
    },
    {
      // Sprint #66 HH2: 430 × 932 — iPhone 15 / 16 Pro Max. Largest current
      // iOS phone. Audits the .app 420px cap and tall-form safe-area math.
      name: 'iphone-15-pro-max',
      use: { ...devices['iPhone 14 Pro Max'], viewport: { width: 430, height: 932 } },
    },
    {
      // Sprint #66 HH2: 412 × 915 — Galaxy S24 Ultra (and S23 Ultra / S22+
      // / Note 10+). Largest contemporary flagship Android phone. Sits
      // between galaxy-s22 (360w) and ipad-mini (768w) so any
      // tablet-vs-phone breakpoint regression here is caught.
      name: 'galaxy-s24-ultra',
      use: { ...devices['Galaxy S9+'], viewport: { width: 412, height: 915 } },
    },
    {
      // 768 × 1024 portrait — iPad Mini. Verifies the centered-mobile-in-tablet
      // layout the app falls into above 420px max-width.
      name: 'ipad-mini',
      use: { ...devices['iPad Mini'] },
    },
    {
      // Sprint #27 Y2: 1280 × 800 — mainstream laptop. Triggers the
      // >=1024px desktop CSS branch (left DesktopNav sidebar, .app at
      // 640px width). Caps the centered-column layout before the 1280
      // anchor-left rule (880px). Every desktop change must regression-
      // test here from this sprint forward.
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      // Sprint #34 BB1: 1440 × 900 — mid-laptop / smaller external monitor.
      // Sits between desktop-1280 and desktop-1920 in the >=1280px rule
      // branch. Same 880px .app column as 1920; only the right-side void
      // differs. Added so the three-viewport desktop audit cycle is native
      // instead of inferred from the 1280/1920 endpoints.
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // Sprint #27 Y2: 1920 × 1080 — large desktop. Triggers the
      // >=1280px rules (.app widens to 880px, anchored 40px from
      // sidebar). The right-side void at this width is the deliberate
      // architectural trade-off documented in App.jsx (Phase 5b notes).
      name: 'desktop-1920',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
  ],
})
