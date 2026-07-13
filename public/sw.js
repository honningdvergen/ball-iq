/* Ball IQ service worker — cache-first for static assets, network for Supabase.
 *
 * Bump CACHE_VERSION any time you need to force-evict stale caches on
 * installed PWA clients. Browsers detect a sw.js content change and install a
 * new SW; the activate handler then deletes any cache that doesn't match the
 * current version. The HTTP cache-control headers in vercel.json prevent most
 * stale-cache failures already (no-cache on /, /index.html, /sw.js;
 * immutable on /assets/*) — bumping CACHE_VERSION is the belt-and-braces
 * escape hatch for when those fail (iOS PWA quirks) or when the SW logic
 * itself changes meaningfully.
 */

const CACHE_VERSION = 'balliq-v9'; // v9: bounded caches (docs split out + LRU-ish trims)
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const FONTS_CACHE = `${CACHE_VERSION}-fonts`;
const DOC_CACHE = `${CACHE_VERSION}-docs`;

// ── Cache bounds — trim, don't evict ──────────────────────────────────────
// The accumulation is load-bearing: an open tab running LAST deploy's HTML
// still lazy-loads LAST deploy's hashed chunks, so we must keep a few
// deploys' worth of stale assets alive. These bounds only trim the tail.
// MAX_STATIC_EXTRA = stale-asset entries allowed BEYOND the current deploy's
// protected set (~2-3 deploys of headroom at ~40 hashed assets each).
// MAX_DOCS bounds navigated HTML entries — before v9 every unique /c/<token>
// challenge URL became a permanent cache row for byte-identical SPA shell.
const MAX_STATIC_EXTRA = 120;
const MAX_DOCS = 24;

// Minimal app shell — the rest is picked up opportunistically on first fetch.
// Deliberately NOT including /icon-1024.png (1.27MB): it was never needed for
// first paint (favicons are /icon-192.png), and precaching it made every fresh
// SW install block on a >1MB download before the shell was ready. Icons are
// still served cache-first opportunistically via the STATIC_EXT matcher.
const APP_SHELL = [
  '/',
  '/index.html',
];

// Build-time precache manifest — scripts/gen-sw-precache.mjs replaces the empty
// array in dist/sw.js with every hashed /assets/* file of the deploy. Without
// this, the install visit cached zero JS/CSS (SW registers after load, assets
// were fetched uncontrolled), so an installed PWA opened offline white-screened
// until its SECOND full online load. Because the manifest hashes change per
// deploy, sw.js bytes change → the new SW installs and precaches the new
// assets BEFORE activating, which also closes the fresh-HTML/stale-assets gap.
// Stays [] in dev (source file) — behaviour there is unchanged.
const PRECACHE_MANIFEST = [];

// Origins we must NEVER cache — auth, realtime and API calls always go network.
const NEVER_CACHE_HOSTS = [
  'supabase.co',           // catches *.supabase.co subdomains too (see matcher below)
  'api.anthropic.com',
];

// Asset extensions served cache-first from same origin.
const STATIC_EXT = /\.(?:js|css|woff2?|png|svg|ico|webp|jpg|jpeg|gif)$/i;

// ─── Install: pre-cache the app shell ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(APP_SHELL)
          .catch(() => { /* allow partial */ })
          // Precache each asset individually (addAll is all-or-nothing; one 404
          // must not void the whole install). Failures fall back to the
          // opportunistic on-fetch caching path.
          .then(() => Promise.allSettled(PRECACHE_MANIFEST.map((u) => cache.add(u))))
      )
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: drop any cache whose name doesn't match the current version ─
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function isNeverCache(url) {
  return NEVER_CACHE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

function isGoogleFonts(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

// Trim a cache down to `max` entries, never touching protected pathnames.
// Cache keys() returns insertion order, so deleting from the front is an
// oldest-first (LRU-ish) trim. Best-effort: a failed trim must never break
// the fetch that triggered it.
async function trimCache(cacheName, max, isProtectedPath) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const candidates = keys.filter((req) => {
      try { return !isProtectedPath(new URL(req.url).pathname); } catch { return true; }
    });
    const excess = candidates.length - max;
    if (excess > 0) {
      await Promise.all(candidates.slice(0, excess).map((req) => cache.delete(req)));
    }
  } catch { /* trim is best-effort */ }
}

// Current deploy's assets are sacred — only PREVIOUS deploys' leftovers may go.
const PROTECTED_STATIC = new Set([...APP_SHELL, ...PRECACHE_MANIFEST]);
const isProtectedStatic = (pathname) => PROTECTED_STATIC.has(pathname);
const isProtectedDoc = (pathname) => pathname === '/' || pathname === '/index.html';

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      // Only cache cacheable responses (basic or cors, not opaque errors).
      cache.put(request, res.clone())
        .then(() => {
          if (cacheName === STATIC_CACHE) return trimCache(STATIC_CACHE, MAX_STATIC_EXTRA, isProtectedStatic);
        })
        .catch(() => {});
    }
    return res;
  } catch (err) {
    // Offline and nothing cached — re-throw so the browser can render its own error.
    throw err;
  }
}

async function networkFirstDocument(request) {
  // Normalize the cache key to origin+path: the HTML served for
  // /play?c=<token> is byte-identical to /play (the SPA reads the query from
  // location at runtime), so query variants must share ONE cache row.
  let docKey = request;
  try {
    const u = new URL(request.url);
    docKey = new Request(u.origin + u.pathname);
  } catch { /* keep original request as key */ }
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(DOC_CACHE);
      cache.put(docKey, res.clone())
        .then(() => trimCache(DOC_CACHE, MAX_DOCS, isProtectedDoc))
        .catch(() => {});
    }
    return res;
  } catch (err) {
    const docs = await caches.open(DOC_CACHE);
    const statics = await caches.open(STATIC_CACHE);
    const fallback = await docs.match(docKey)
      || await statics.match('/index.html') || await statics.match('/');
    if (fallback) return fallback;
    throw err;
  }
}

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only intercept GETs. Auth token refreshes, score inserts, friendship
  // mutations etc. are all POST/PATCH/DELETE — let them go straight to network.
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  // Never cache Supabase or Anthropic API traffic — always network.
  if (isNeverCache(url)) return;

  // Google Fonts: cache-first in a dedicated bucket so a version bump doesn't
  // nuke the font files alongside the app shell.
  if (isGoogleFonts(url)) {
    event.respondWith(cacheFirst(request, FONTS_CACHE));
    return;
  }

  // Same-origin static asset → cache-first.
  if (url.origin === self.location.origin && STATIC_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Same-origin navigations / HTML → network-first with cache fallback so the
  // app still opens offline after its first successful load.
  if (url.origin === self.location.origin && request.mode === 'navigate') {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  // Anything else: default browser behaviour (network).
});
