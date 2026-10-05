// Sentry performance tracing, loaded after first paint (see main.jsx).
// browserTracingIntegration is ~40 KB of the SDK; keeping it out of the eager
// graph keeps Home under its JS budget. The pageload span still starts at
// performance.timeOrigin, so its timings stay meaningful; Speed Insights
// remains the source of truth for Core Web Vitals.
import * as Sentry from '@sentry/react'

export function enableTracing() {
  Sentry.addIntegration(Sentry.browserTracingIntegration())
}
