// Side-effect import: registers `beforeinstallprompt` + `appinstalled`
// listeners at module-load (pre-React) so we capture Chrome's early-firing
// install event before the React tree mounts. Missing this event leaves the
// install button inert for the rest of the session.
import './installPrompt.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { initAds } from './lib/ads.js'
// Root render-crash net for the marketing tree (the game tree gets the same
// boundary via GameRoot). Without it a render throw under the bare Suspense
// white-screened the page with zero Sentry capture.
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

// Sentry initialization — runs before app mount so render errors land in
// Sentry from the very first paint. DSN is environment-gated: prod builds
// ship with VITE_SENTRY_DSN set (Vercel env var); dev/preview builds run
// without it and Sentry no-ops silently.
if (import.meta.env.VITE_SENTRY_DSN) {
  // Native-gate performance tracing: the privacy policy states the *app* runs
  // no analytics, but browserTracingIntegration sampling records navigation/
  // pageload transactions (a usage measure). Keep crash reporting everywhere;
  // sample transactions on web only, never inside the Capacitor app.
  // (2026-07-12 medical, error-observability, medium.)
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true
  // Remove the URL fragment (Supabase returns access_token/refresh_token there
  // after OAuth/magic-link) and redact token query params so a credential can
  // never ride into a Sentry event via request.url or a navigation breadcrumb.
  const scrubUrl = (u) => {
    if (typeof u !== 'string') return u
    return u.split('#')[0].replace(/([?&])(access_token|refresh_token|provider_token|code|token|apikey)=[^&]*/gi, '$1$2=REDACTED')
  }
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_GIT_SHA,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: isNative ? 0 : 0.1,
    // PII scrub: strip user email + Supabase tokens from breadcrumbs, URLs and
    // event metadata. defaultPII is false; this hardens further.
    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.username
      }
      if (event.request?.url) event.request.url = scrubUrl(event.request.url)
      if (event.breadcrumbs) {
        for (const bc of event.breadcrumbs) {
          if (bc.data?.headers) {
            delete bc.data.headers.Authorization
            delete bc.data.headers.apikey
          }
          if (bc.data) {
            for (const k of ['url', 'to', 'from']) {
              if (typeof bc.data[k] === 'string') bc.data[k] = scrubUrl(bc.data[k])
            }
          }
        }
      }
      return event
    },
  })
}

// Sprint #62 fix 4: request persistent storage so the browser (and
// especially iOS PWAs) won't evict our localStorage / IndexedDB under
// quota pressure or after long inactivity. Supabase refresh tokens
// live in localStorage; eviction = forced re-login.
//   - Installed PWAs on Chrome/Edge/Android auto-grant without a
//     prompt.
//   - Standalone iOS PWAs prompt the user once; if granted, iOS stops
//     evicting after the ~7-day inactivity threshold.
//   - Browsers without the Storage API (older Safari, etc.) just
//     no-op — the try/catch absorbs any throw.
// Fire-and-forget: we don't block app mount or read the result; the
// promise resolves asynchronously and the next session has persistent
// storage if granted.
try {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {})
  }
} catch {}

// Native splash failsafe: capacitor.config.json sets launchAutoHide:false
// (deliberate — the app hides the splash once its first real frame is ready),
// which means a hang or crash before that hide() call strands the user on a
// permanent frozen splash with the ErrorBoundary unreachable beneath it. This
// timer guarantees the splash always lifts within ~8s — comfortably past any
// legitimate cold start, and hide() is idempotent so the normal early-hide
// path is unaffected. Web: gated off entirely.
try {
  if (window.Capacitor?.isNativePlatform?.()) {
    setTimeout(() => {
      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => SplashScreen.hide())
        .catch(() => {})
    }, 8000)
  }
} catch {}

// Stale dynamic-import self-heal (web/PWA only — native bundles its chunks
// locally and can't 404 them). After a deploy prunes the previous build's
// hashed assets, a long-lived tab's import('./questions.js') can fail with a
// ChunkLoadError that otherwise dead-ends in a generic "Couldn't start" toast.
// Reload once to pull the fresh index.html + matching chunks; a sessionStorage
// guard prevents a reload loop if the new build is still momentarily broken.
try {
  const isNative = !!(window.Capacitor?.isNativePlatform?.())
  if (!isNative) {
    const RELOAD_FLAG = 'biq_chunk_reload'
    const isChunkError = (msg) =>
      /ChunkLoadError|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(String(msg || ''))
    const heal = (msg) => {
      if (!isChunkError(msg)) return
      try {
        if (sessionStorage.getItem(RELOAD_FLAG)) return // one auto-reload per session
        sessionStorage.setItem(RELOAD_FLAG, '1')
      } catch {}
      window.location.reload()
    }
    window.addEventListener('vite:preloadError', (e) => { try { e.preventDefault() } catch {} heal(e?.payload?.message || 'vite:preloadError') })
    window.addEventListener('unhandledrejection', (e) => heal(e?.reason?.message || e?.reason))
  }
} catch {}

// ── Front-door routing: marketing homepage ( / ) vs the game ( /play, … ) ────
// The "Matchday" marketing homepage renders ONLY for regular browser tabs at the
// root. The native iOS/Android app, installed PWAs, and EVERY other path
// (/play, /play/*, /join/*, /c/*, …) render the game — so deep links and the
// installed apps are never sent to the marketing page.
const MarketingHome = React.lazy(() => import('./marketing/MarketingHome.jsx'))

const _path = (typeof window !== 'undefined' && window.location.pathname) || '/'
const _isNativeApp =
  (typeof location !== 'undefined' && location.protocol === 'capacitor:') ||
  !!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) ||
  (typeof document !== 'undefined' && document.documentElement.classList.contains('native-app'))
const _isStandalonePWA =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true)
const _isBrowser = !_isNativeApp && !_isStandalonePWA
const showMarketing = _isBrowser && (_path === '/' || _path.startsWith('/home-preview'))

// The game tree is lazy too (see GameRoot.jsx) so marketing visitors never
// download the ~200KB-gz game bundle. React.lazy only fires its import() on
// first render — which is after createRoot + the initial reconcile — so for
// game paths we ALSO kick the import off here at module-eval. Both calls
// resolve to the same module promise (ESM dedupes by specifier), so this just
// starts the network fetch a render-cycle earlier, overlapping it with mount.
const loadGameRoot = () => import('./GameRoot.jsx')
const GameRoot = React.lazy(loadGameRoot)
if (!showMarketing) loadGameRoot()

// Suspense fallback for the lazily-loaded game tree: reproduces index.html's
// #root splash markup (the same wordmark + animated bar) so swapping the
// static HTML splash for React's tree during the GameRoot chunk fetch is
// visually seamless — no blank flash on web/PWA game paths. On native the
// chunk is bundled locally and resolves within a frame, so this shows only
// momentarily before AppGate takes over.
const SplashFallback = () => (
  <div className="biq-splash" aria-label="Loading Ball IQ">
    <div className="biq-splash-mark">Ball <em>IQ</em></div>
    <div className="biq-splash-dot"></div>
  </div>
)

// Full-bleed surfaces (marketing + the new Play dashboard preview) drop the
// game-nav gutter + landing chrome and match the #0A0A0A canvas.
const _fullBleed = () => {
  try {
    document.querySelectorAll('.landing-top, .landing-bottom').forEach((el) => { el.style.display = 'none' })
    const root = document.getElementById('root')
    if (root) { root.style.paddingLeft = '0'; root.style.maxWidth = 'none'; root.style.margin = '0'; root.style.background = '#0A0A0A' }
    document.documentElement.style.background = '#0A0A0A'
    document.body.style.background = '#0A0A0A'
  } catch {}
}

if (showMarketing) {
  _fullBleed()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary><React.Suspense fallback={null}><MarketingHome /></React.Suspense></ErrorBoundary>,
  )
} else {
  // desktop-web-refresh: mark the document as the game shell so the desktop
  // marketing chrome (.landing-top/.landing-bottom in index.html, shown at
  // >=1024 in browser) stays hidden around the game on /play. Set here at
  // module-eval — the earliest point we know this is a game route — so it
  // beats the landing chrome's paint far sooner than an AppInner mount effect
  // would, and it also covers the login screen (which is not AppInner). No-op
  // in native/PWA where the landing chrome is already killswitched.
  try { document.body.classList.add('biq-app') } catch { /* noop */ }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <React.Suspense fallback={<SplashFallback />}>
        <GameRoot />
      </React.Suspense>
    </React.StrictMode>,
  )
}

// Ads (web only, dormant until an AdSense client ID is set in lib/ads.js) —
// initialise off the critical path so it never competes with first paint.
if (typeof window !== 'undefined') {
  const startAds = () => { try { initAds() } catch {} }
  if ('requestIdleCallback' in window) window.requestIdleCallback(startAds, { timeout: 3000 })
  else window.addEventListener('load', () => setTimeout(startAds, 1200))
}

// Web-only, privacy-friendly analytics (cookieless Vercel Web Analytics).
// NEVER runs in the native app: the bundled capacitor:// scheme has no
// /_vercel endpoint, and the privacy policy promises the app collects no
// usage analytics — only the website (balliq.app) does. No cookies, no
// cross-site tracking, no personal identification. No-ops until Web Analytics
// is enabled for the project in the Vercel dashboard.
if (typeof window !== 'undefined' && !(window.Capacitor?.isNativePlatform?.())) {
  try {
    const s = document.createElement('script')
    s.defer = true
    s.src = '/_vercel/insights/script.js'
    document.head.appendChild(s)
  } catch {}
}
