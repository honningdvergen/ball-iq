// Vitest config — unit tests for the pure src/lib/* modules. Deliberately
// standalone (NOT merged with vite.config.js): the app's vite config loads
// the full question bank + Sentry plugin, none of which unit tests need.
// tests/e2e/ stays Playwright-only (see playwright.config.js).
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
    // 20s, not vitest's 5s default. On 20 Oct two release builds failed on
    // time-outs, not findings: a dynamic import of the Footle screen and a scan
    // of every generated page each ran past 5s while the Mac was swapping. A
    // test that hangs still fails; one that is merely slow under load no longer
    // blocks the deploy gate.
    testTimeout: 20_000,
  },
})
