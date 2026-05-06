# Ball IQ

Football trivia + multiplayer quiz app. Daily puzzles, real-time multiplayer rooms, themed modes (World Cup, Premier League, Champions League, Legends, Chaos, etc.), and a hidden reviewer tool for question-bank curation.

Built as a PWA. Deployed via Vercel; data layer via Supabase (Postgres + Realtime + Auth + RLS).

**Production:** https://balliq.app

## Quick start

```bash
npm install
npm run dev          # vite dev server, port 5173 by default
```

`.env.local` (gitignored) holds local secrets:

```
VITE_SUPABASE_KEY=<anon key>          # used by the SPA
SUPABASE_SERVICE_ROLE_KEY=<service>   # used only by scripts/publish-review.mjs
```

For spike testing against staging, also `.env.spike` with the staging-only credentials. See `scripts/README.md`.

## Stack

| Layer | Tech |
|---|---|
| UI | React 18 + Vite 5, single-bundle SPA |
| State | React hooks; no Redux/Zustand |
| Auth | Supabase Auth (magic link + password) |
| Data | Supabase Postgres with RLS |
| Realtime | Supabase Realtime postgres_changes (Stage 1 multiplayer) |
| Icons | Lucide React |
| Monitoring | Vercel Speed Insights (Web Vitals) |
| Deploy | Vercel — auto-deploys `main` on push |

## Architecture

Single-page app. Routing via in-memory `screen` state (no react-router; the app's screen flows are explicit and small).

Top-level components (in `src/App.jsx`):

- `App` → `ErrorBoundary` → `AppGate` (auth gate) → `AppInner` (router)
- `AppInner` switches on `screen` to mount: Home, Settings, FootballWordle, Daily/Review, MultiplayerLobby, OnlineEntry, ReviewScreen, etc.

Multiplayer architecture is documented separately — see `docs/MULTIPLAYER.md`.

Question-bank source of truth: `src/questions.js` (~3.4K MCQ + ~460 true-false). Review decisions in Supabase `question_review` table; promote-to-bank workflow via `scripts/publish-review.mjs`.

## Repository layout

```
src/
  App.jsx                       Main SPA — routing + most screens (~12K LoC, V1.1 split planned)
  useAuth.jsx                   Auth provider + helpers
  useMultiplayerRoom.js         Stage 1 multiplayer hook (single source of truth per room)
  multiplayerRpc.js             RPC retry layer for the 7 multiplayer RPCs
  questions.js                  Hand-curated question bank (lazy-loaded chunk)
  questions-loader.js           Lazy-load shim + per-mode bucket builders
  ReviewScreen.jsx              Hidden in-app reviewer tool (gated to one email)
  Login.jsx                     Magic-link + email/password sign-in
  DesktopNav.jsx                Top nav for desktop layouts
  supabase.js                   Single supabase-js client export
  safeStorage.js                localStorage wrapper with try/catch + size guard
  multiplayerRpc.js             RPC retry wrapper for Stage 1 multiplayer RPCs

scripts/
  publish-review.mjs            Apply review-tool decisions back to questions.js
  spike-1-realtime.mjs          Stage 1 SQL contract regression — realtime two-filter
  spike-2-advance-race.mjs      Stage 1 SQL contract regression — advance_question gate
  staging-migration.sql         Staging Supabase setup (Stage 1 spike fixtures)
  README.md                     scripts directory docs (see for spike CI details)

docs/
  MULTIPLAYER.md                Stage 1 multiplayer engineering reference
  PRODUCTION_RUNBOOK.md         SQL diagnostic queries for production incidents
  MONITORING_OPTIONS.md         Sentry vs alternatives (working draft)
  BUNDLE_SPLITTING_ANALYSIS.md  V1.1 lazy-load roadmap
  historical/                   Archived planning docs

CLAUDE.md                       Repo-specific conventions (deploy, cache, SW versioning)
```

## NPM scripts

```
npm run dev              # vite dev server
npm run build            # production build → dist/
npm run preview          # preview the production build locally

npm run publish-review:dry  # apply review decisions (dry run, no writes)
npm run publish-review      # apply review decisions to src/questions.js

npm run find-vintage     # heuristic scan for vintage-era questions
npm run test:spike-1     # Stage 1 realtime regression test (against Supabase)
npm run test:spike-2     # Stage 1 advance_question race test
npm run test:spikes      # both spikes back-to-back
```

## Deploys

`main` auto-deploys to Vercel on every push. See `vercel.json` for HTTP cache headers (CLAUDE.md explains the policy: HTML/SW always re-fetch; `/assets/*` immutable since Vite hashes filenames).

Service worker (`public/sw.js`) overlays cache strategy for installed PWAs. Bump `CACHE_VERSION` only for SW logic changes or emergency cache-bust — see CLAUDE.md "Deploy policy: cache invalidation".

## Production debugging

`docs/PRODUCTION_RUNBOOK.md` — SQL queries for common incident classes (stuck multiplayer room, join_room failure spike, realtime silent-delivery, question-bank quality regression). Run from the Supabase production dashboard SQL editor; no service-role key needed.

For GitHub data (workflow runs, PR status), `gh` CLI works well — see runbook section "GitHub CLI commands". Install via `brew install gh` then `gh auth login`.

## Contributing

Internal project. PRs land via direct push to `main` after smoke-test. Convention:

- Commit messages: `<area>: <imperative summary>` (e.g., `Stage 1: fix race condition in advance_question`). Body explains the why; references findings docs where relevant.
- Don't introduce automated test infrastructure pre-launch unless explicitly tasked — current quality gates are `npm run build` + manual smoke + spike scripts. V1.1 backlog item.
- Question bank edits land via `scripts/publish-review.mjs` after reviewing in the in-app tool. Direct edits to `src/questions.js` are fine for one-off fixes; preserve the stable `id` fields.

## Stack docs + further reading

- `CLAUDE.md` — deploy policy, cache invalidation rules, repo conventions
- `docs/MULTIPLAYER.md` — Stage 1 multiplayer architecture, SQL contracts, bug class catalog
- `docs/PRODUCTION_RUNBOOK.md` — incident triage SQL
- `scripts/README.md` — spike test suite operations
- Memory notes (`~/.claude/projects/.../memory/`) — failure-mode patterns and project-specific gotchas
