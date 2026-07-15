// Vitest config — unit tests for the pure src/lib/* modules. Deliberately
// standalone (NOT merged with vite.config.js): the app's vite config loads
// the full question bank + Sentry plugin, none of which unit tests need.
// tests/e2e/ stays Playwright-only (see playwright.config.js).
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
})
