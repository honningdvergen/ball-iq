/* Ball IQ service worker — cache-first for static assets, network for Supabase.
 *
 * Bump CACHE_VERSION any time the shape of cached responses needs to change,
 * or when you want every installed client to force-refresh its asset cache.
 * The activate handler deletes any cache whose name doesn't match the current
 * version, so stale bundles are evicted as soon as the new SW takes over.
 */

const CACHE_VERSION = 'balliq-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const FONTS_CACHE = `${CACHE_VERSION}-fonts`;

// Minimal app shell — the rest is picked up opportunistically on first fetch.
const APP_SHELL = [
  '/',
  '/index.html',
  '/icon-1024.png',
];

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
      .then((cache) => cache.addAll(APP_SHELL).catch(() => { /* allow partial */ }))
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

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      // Only cache cacheable responses (basic or cors, not opaque errors).
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    // Offline and nothing cached — re-throw so the browser can render its own error.
    throw err;
  }
}

async function networkFirstDocument(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const cache = await caches.open(STATIC_CACHE);
    const fallback = await cache.match(request) || await cache.match('/index.html') || await cache.match('/');
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
