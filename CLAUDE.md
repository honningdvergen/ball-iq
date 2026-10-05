# Ball IQ — repo notes

## Deploy policy: cache invalidation

Every deploy goes through Vercel. The cache pipeline has two layers:

- **HTTP cache-control headers** (`vercel.json`) — handle most cases automatically:
  - `/`, `/index.html`, `/sw.js` → `no-cache, no-store, must-revalidate` (browsers always re-fetch)
  - `/assets/*` → `public, max-age=31536000, immutable` (Vite outputs hashed filenames; safe to cache forever)

- **Service worker** (`public/sw.js`) — overlays browser cache for installed PWAs:
  - cache-first for static assets, network-first for HTML, never-cache for Supabase / Anthropic
  - `CACHE_VERSION` controls hard eviction. Browsers install a new SW when sw.js content changes; the new SW's activate handler deletes any cache that doesn't match the current version.

### When to bump CACHE_VERSION in `public/sw.js`

- **Routine deploys** (CSS tweaks, JSX changes, bug fixes): don't bump. The HTTP headers handle it.
- **SW logic changes** (cache strategy, never-cache list, app shell list): bump in the same commit so existing PWA installs evict old caches.
- **Emergency cache-bust** (something is silently broken on PWA installs and you suspect stale caches): bump CACHE_VERSION to force a hard eviction across all installed clients.

Never need to bump for normal feature work — the HTTP layer is the foundation; SW versioning is the escape hatch.

## Agent permissions

Project threads run in auto mode, which ignores the bare `"Bash"` allow rule. The narrow `Bash(...)` rules in `.claude/settings.json` are what let routine commands (tests, lint, build, `node scripts/*.mjs` audits and generators, git on the working branch, PR creation) run without a prompt. When a thread starts using a new routine command, add a narrow rule for it rather than a broad one. Force pushes, pushes to `main`, discarding checkouts and PR merges stay behind `ask` rules on purpose.

Cloud project threads end a code task by committing and pushing to their own `claude/*` branch and opening a draft PR.

**The local chat on Alex's Mac ("Website critique") works differently, by Alex's choice (2026-10-04):** it commits straight to `main` and pushes, one logical change per commit, never `git add -A` (a social session writes under `social/` in the same checkout), never `--amend` (other sessions commit to `main` too). Every push is followed by checking the production deploy status on that commit and that the changed page actually rendered; a red or pending deploy is not "shipped". Run `npm run build` before pushing: its last step is the Home JS budget gate, and a build that fails it leaves production silently on the previous deploy.
