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
