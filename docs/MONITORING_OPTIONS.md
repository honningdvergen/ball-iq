# Production monitoring — options for World Cup launch

Drafted 2026-05-04 as research material; **no decision yet**. Goal is to choose monitoring before the WC2026 launch (39 days out) so the kickoff weekend is observable. This doc compares options across the dimensions Ball IQ actually cares about; the decision can be made deliberately later this week.

## What we'd want monitoring to catch

In rough priority for Ball IQ specifically:

1. **Unhandled JavaScript exceptions** — currently only visible if a user reports them. ErrorBoundary catches React render errors but not async/promise rejections, event handlers, or imperative code paths.
2. **Failed Supabase RPCs** — `create_room`, `join_room`, `advance_question`, `submit_answer`, `tick_login_streak`, etc. Currently `console.error`'d but never surfaces externally. Multiplayer Stage 1 has 7 SECURITY DEFINER RPCs whose failure modes are visible in code (errcodes 42501, 53300, P0002, etc.) but invisible in production.
3. **Realtime channel drops / reconnect storms** — `useMultiplayerRoom` recovery catch-up exists, but if it's firing often that's a signal of underlying flakiness we'd want to know about.
4. **Performance during traffic spikes** — World Cup kickoff weekend may bring the largest sustained concurrent load this app has seen. Web Vitals (LCP, INP, CLS) trends and any first-paint regressions matter.
5. **PWA-specific quirks** — iOS Safari ITP storage purges, service-worker cache misses, the forced-re-login pattern documented in memory.
6. **Auth flow errors** — Login.jsx send-magic-link failures, OAuth error redirects from Supabase.

Items 1, 2 are highest leverage. Items 3-6 are nice-to-have but worth at least passive capture.

## Already shipped

- **Vercel Speed Insights** — installed in commit `3a721b9` (today). Captures Web Vitals (LCP, FID, INP, CLS, TTFB) and ships them to Vercel. Free with the Pro plan; available on Vercel's dashboard. Covers item 4.
- **ErrorBoundary** — catches React render errors, shows a fallback UI. Covers a narrow slice of item 1 (render-time exceptions only).

What's still uncovered: items 1 (async/event-handler errors), 2, 3, 5, 6.

## Options under consideration

### Vercel Analytics (separate from Speed Insights)

- **What it is:** page-view tracking, traffic sources, audience analytics. Not error tracking.
- **Cost:** free tier on Vercel Pro plan (~2.5k events/month free, then paid).
- **Setup:** ~2 LoC (`<Analytics />` component). Same vendor as Speed Insights.
- **Covers:** none of the priority items (Vercel Analytics is for marketing/product, not engineering reliability).
- **Verdict:** orthogonal to error monitoring. Good to have for product insights, doesn't replace anything.

### Sentry

- **What it is:** the established standard for SPA error tracking. Captures unhandled exceptions, promise rejections, manual `Sentry.captureException`, network requests, breadcrumbs (user actions before the error). Performance monitoring + session replay are paid add-ons.
- **Cost:** free tier = 5k errors/month, 50 replays, 7-day retention. Paid starts at $26/month for 50k errors. World Cup launch may exceed free tier briefly during kickoff weekend; soft cap not hard.
- **Setup:** 1 SDK install + DSN env var + `Sentry.init({...})` in app entry. Source map upload via Vite plugin (5-min setup).
- **Covers:** items 1, 2 (with manual capture for RPC failures), 6 (auth errors auto-caught as exceptions). Performance plan adds item 4 overlap with Speed Insights. Session replay (paid) helps with item 3 (would show user perspective during a realtime drop).
- **Verdict:** strongest single tool for items 1, 2, 6. Replay would help item 3 but adds cost.

### Bugsnag

- **What it is:** Sentry's older competitor. Same fundamental model (capture errors, breadcrumbs, source maps).
- **Cost:** free tier = 7,500 errors/month, 30-day retention. Paid starts at $59/month.
- **Setup:** similar to Sentry.
- **Covers:** items 1, 2, 6 — same as Sentry.
- **Verdict:** broadly equivalent to Sentry for our needs. Sentry has stronger ecosystem (more integrations, larger community); Bugsnag has slightly more generous free tier.

### Datadog RUM

- **What it is:** enterprise-grade Real User Monitoring + APM + logs. Comprehensive.
- **Cost:** RUM starts at $1.50/1k sessions; minimum commitments apply at scale. Free trial only — no permanent free tier.
- **Setup:** SDK + tracking config; APM correlation needs server-side agent (we don't run a server).
- **Covers:** all priority items, but at significantly higher cost.
- **Verdict:** overkill for a small SPA. Worth the cost when there's a backend you also need to instrument; for a Vercel + Supabase stack, the breadth doesn't justify the price.

### LogRocket

- **What it is:** session-replay-first product. Records user sessions; errors are an overlay.
- **Cost:** free tier = 1,000 sessions/month, 14-day retention. Paid starts at $99/month.
- **Setup:** SDK + project ID.
- **Covers:** item 3 strongly (replay through a realtime drop is exactly the use case). Items 1, 2, 6 less detailed than Sentry.
- **Verdict:** great if we expect specific UX bugs that need visual repro. For a stable app with clearer error patterns, Sentry's capture is more useful than LogRocket's replay.

### PostHog

- **What it is:** product analytics + session replay + error tracking + feature flags + experiments. Open source with a hosted option.
- **Cost:** free tier = 1M events/month, 5k recordings/month. Paid starts at $0/month with metered overages. Self-host is free + infra cost.
- **Setup:** SDK + project ID. More integration surface (analytics + flags + replay + errors all in one).
- **Covers:** items 1, 3, plus product analytics, plus feature flag infrastructure (useful if we want to ship Stage 1 multiplayer behind a flag, etc.). Items 2, 6 via manual capture.
- **Verdict:** the broadest toolkit by feature count. Comes with more cognitive load (more dashboards, more concepts). Strong choice if we want one tool for engineering + product. Risk: spreads attention thin.

### Highlight.io

- **What it is:** open-source session replay + error tracking. Newer, smaller community.
- **Cost:** free tier = 500 sessions/month, 5k errors/month. Paid starts at $50/month.
- **Setup:** SDK + project ID.
- **Covers:** items 1, 3.
- **Verdict:** worth flagging as an option but smaller ecosystem than Sentry/LogRocket. Probably not the lowest-risk choice for launch.

## Quick comparison

| Tool | Items covered | Free tier | Setup | Best fit if... |
|---|---|---|---|---|
| Vercel Speed Insights *(installed)* | 4 | Free w/ Pro | Done | Already have it |
| Vercel Analytics | (product, not eng) | 2.5k events/mo | ~2 LoC | Want product insights |
| **Sentry** | **1, 2, 6 (3 paid)** | **5k errors/mo** | **~5 min + Vite plugin** | **Want broad error coverage, established tool** |
| Bugsnag | 1, 2, 6 | 7.5k errors/mo | ~5 min | Prefer their pricing/UX |
| Datadog RUM | All | Trial only | More involved | Have a server to instrument too |
| LogRocket | 3 strong, 1/2/6 weak | 1k sessions/mo | ~5 min | Need visual repro of user bugs |
| PostHog | 1, 3, + analytics | 1M events/mo | ~10 min | Want one tool for eng + product |
| Highlight.io | 1, 3 | 500 sessions/mo | ~5 min | Want OSS replay |

## Tentative recommendation (for your review)

**Sentry + the already-installed Vercel Speed Insights covers items 1, 2, 4, 6 cheaply.** Two SDKs, both well-supported in Vite, both with free tiers that should cover normal traffic. Item 3 (realtime drops) is observable indirectly via console errors that Sentry captures; if we want richer signal there, add LogRocket later.

**Setup steps if you green-light Sentry:**

1. `npm install @sentry/react @sentry/vite-plugin`
2. Get DSN from Sentry dashboard (sign up, create a "ball-iq" project)
3. Add `Sentry.init({...})` near the top of `src/App.jsx` or in `src/main.jsx`
4. Add Vite plugin to upload source maps (so prod errors show real file:line, not minified)
5. Wrap a couple of key Supabase RPC calls with `Sentry.captureException(...)` in their catch blocks — this surfaces RPC failures explicitly. Maybe 5-8 sites in Stage 1 (`create_room`, `join_room`, `start_game`, `submit_answer`, `advance_question`, `leave_room`) plus a few elsewhere (`tick_login_streak`, profile load).
6. Optional: add a `Sentry.captureMessage('Realtime channel error', { level: 'warning' })` in `useMultiplayerRoom`'s `CHANNEL_ERROR` / `CLOSED` handlers — turns a console.error into a tracked event.

Total install: ~30 min. Annual cost: probably $0 (within free tier) for the first year unless launch traffic exceeds 5k errors/month sustained, which would be a signal in itself.

**Decisions still open:**

- Do we want session replay (LogRocket / PostHog / paid Sentry tier) at all, or wait until a UX bug class actually demands it?
- Do we want product analytics in the same tool (PostHog), or keep that separate (Vercel Analytics for marketing, Sentry for eng)?

The boring answer is: ship Sentry for engineering reliability, ship Vercel Analytics for product/marketing, defer session replay until a real need surfaces. Total monthly cost at expected launch scale: $0.

---

Open questions for you to weigh in:

1. **Privacy/GDPR posture** — Sentry's default config sends a fair amount of context (URL, user agent, breadcrumbs of clicks). Do we need to scrub PII? `tracesSampleRate` and `beforeSend` hooks handle this. Worth ~30 min when wiring it up.
2. **Error volume budget** — if launch weekend produces >5k errors, free tier exceeds. We could either (a) accept paid plan kicking in if it does, or (b) be aggressive about ignoring known-noisy errors (network timeouts, ad-blocker rejections) so the free tier suffices.
3. **Source map upload** — required for de-minified stack traces in prod. The Sentry Vite plugin handles this automatically once the auth token is set. Worth adding to the install plan.

This doc is a working draft — promote, demote, or delete based on which directions you want to pursue.
