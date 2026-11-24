// Side-effect import: registers `beforeinstallprompt` + `appinstalled`
// listeners at module-load (pre-React) so we capture Chrome's early-firing
// install event before the React tree mounts. Missing this event leaves the
// install button inert for the rest of the session.
import './installPrompt.js'
// The web palette, as CSS custom properties. Imported by the ENTRY rather than
// by MarketingHome, which is lazy -- a lazy CSS import lands after first paint
// and every var() would resolve to `inherit` for a frame. Generated from
// design/tokens.js; the 191 static pages inline the same bytes. ~450 bytes, so
// the game routes carry it too rather than duplicating the values a third time.
import './design/tokens.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { Capacitor } from '@capacitor/core'
import { initAds } from './lib/ads.js'
// Root render-crash net for BOTH trees. GameRoot carries its own boundary for
// errors inside the game tree, but a rejected React.lazy(GameRoot) import
// (e.g. supabase.js throwing at module scope on a missing VITE_SUPABASE_KEY)
// kills GameRoot before that boundary ever mounts — the rejection propagates
// past the bare Suspense and black-screens the page with zero Sentry capture.
// That failure mode hid a chronic e2e misconfig for weeks (2026-08-11) and
// would equally hide a misconfigured prod deploy, so the boundary must live
// HERE, above the lazy roots, in the statically-imported entry chunk.
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { normalizeSupabaseError } from './lib/sentryNormalize.js'
import { scrubBreadcrumb, scrubEvent } from './lib/sentryScrub.js'

// What a navigation away leaves behind: the chunk and stylesheet requests it
// cancelled, each reported as a load failure. Not faults (see __biqLeaving).
const LEAVING_NOISE = /Unable to preload CSS|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|ChunkLoadError/i

// Sentry initialization — runs before app mount so render errors land in
// Sentry from the very first paint. DSN is environment-gated: prod builds
// ship with VITE_SENTRY_DSN set (Vercel env var); dev/preview builds run
// without it and Sentry no-ops silently.
// A production build served from a dev machine (`vite preview`, the e2e
// server on :4177) still carries the prod DSN. Those sessions reported 2k+
// events as production (BALL-IQ-X: Vercel's /_vercel/speed-insights script
// 404s locally and comes back as index.html). Native is exempt: Android's
// Capacitor origin is https://localhost.
const _isLocalPreview = typeof window !== 'undefined' &&
  !window.Capacitor?.isNativePlatform?.() &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(window.location.hostname)
if (import.meta.env.VITE_SENTRY_DSN && !_isLocalPreview) {
  // Native-gate performance tracing: the privacy policy states the *app* runs
  // no analytics, but browserTracingIntegration sampling records navigation/
  // pageload transactions (a usage measure). Keep crash reporting everywhere;
  // sample transactions on web only, never inside the Capacitor app.
  // (2026-07-12 medical, error-observability, medium.)
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true
  const sentryOptions = {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_GIT_SHA,
    // Tracing is added after first paint (below), not here: it is ~40 KB of
    // Home's eager JS. Crash reporting stays eager.
    integrations: [],
    tracesSampleRate: isNative ? 0 : 0.1,
    // SDK 10 turns Sentry's log stream on by default (8 had none). Nothing here
    // calls Sentry.logger, and nothing should start sending without a decision.
    enableLogs: false,
    // A breadcrumb is cleaned of Supabase tokens BEFORE it is stored (see
    // lib/sentryScrub.js: the console breadcrumb keeps every console.log
    // argument, and the sign-in callback URL was one). If the scrub itself
    // fails the breadcrumb is dropped, never stored as it came.
    beforeBreadcrumb(breadcrumb) {
      try { return scrubBreadcrumb(breadcrumb) } catch { return null }
    },
    // PII scrub: strip user email + Supabase tokens from breadcrumbs, URLs and
    // event metadata. defaultPII is false; this hardens further.
    beforeSend(event, hint) {
      // Chunk and stylesheet requests cancelled because the page is leaving.
      if (window.__biqLeaving && LEAVING_NOISE.test(String(hint?.originalException?.message || event?.exception?.values?.[0]?.value || event?.message || ''))) return null
      event = normalizeSupabaseError(event, hint)
      if (!event) return null
      if (event.user) {
        delete event.user.email
        delete event.user.username
      }
      // The same pass again over the finished event: its URL, every
      // breadcrumb, the exception text and the extras. scrubEvent removes a
      // part it cannot clean and keeps the report.
      return scrubEvent(event)
    },
    // Page-load measurements (web only, sampled) never passed beforeSend.
    beforeSendTransaction(event) {
      return scrubEvent(event)
    },
  }
  // ONE CLIENT, TWO WAYS TO START IT (24 Nov 2026). @sentry/react lives in the
  // webview and cannot see a crash below it: a Java or Swift exception, a dead
  // WebView process, an ANR. Where the @sentry/capacitor plugin is in the
  // binary, its init starts Sentry's Android/iOS SDK and then calls the React
  // init itself, with these same options plus a transport that hands every
  // event to the native SDK (which keeps it on disk and sends it on the next
  // launch if the process dies first). Everywhere else, the website above all,
  // the React init runs directly, exactly as it did before this file knew
  // about native: the wrapper would otherwise swap the browser's default
  // integrations for its own (rewritten frame paths, another SDK name) and
  // regroup every web issue.
  //   isPluginAvailable is true only when the native side registered the
  // plugin, so a shell built without it (iOS today: ios.includePlugins in
  // capacitor.config.json) keeps the plain init instead of failing over to it.
  // Asked of @capacitor/core rather than window.Capacitor: before core has
  // loaded, the bridge's own isPluginAvailable answers a different question
  // (has JavaScript registered it yet) and would say no. Core is already in
  // this chunk through lib/review.js, so the import costs nothing.
  //   The wrapper is import()ed, not imported: it is 20 KB that only a native
  // shell can use, and a static import put it on the website's Home (measured:
  // main 115 KB to 135 KB). The price is that on native the client starts when
  // that chunk has arrived, a few milliseconds after this line instead of on
  // it. If the chunk cannot be loaded the plain init runs, as on the web.
  //   A native crash never passes through beforeSend above: the native SDK
  // sends it itself, with the device, the OS and the last breadcrumbs, no URL.
  const hasNativeSentry = isNative && Capacitor.isPluginAvailable('SentryCapacitor') === true
  if (hasNativeSentry) {
    import('@sentry/capacitor')
      .then((m) => m.init(sentryOptions, Sentry.init))
      .catch(() => { try { Sentry.init(sentryOptions) } catch { /* reporting must not stop the boot */ } })
  } else {
    Sentry.init(sentryOptions)
  }
  if (!isNative) {
    const loadTracing = () => {
      import('./lib/sentryTracing.js').then((m) => m.enableTracing()).catch(() => {})
    }
    const schedule = () => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(loadTracing, { timeout: 5000 })
      else setTimeout(loadTracing, 2000)
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
  }
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

// THE PAGE IS LEAVING. Set the moment any navigation away starts (a link, a
// redirect of ours, a reload), read by the self-heal below and by the Sentry
// filter above so neither treats the requests a navigation cancels as faults.
// A mailto:, an app link or a download fires this event without the page
// going anywhere, so the flag clears itself after four seconds.
try {
  window.addEventListener('beforeunload', () => {
    window.__biqLeaving = true
    setTimeout(() => { window.__biqLeaving = false }, 4000)
  })
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
    const heal = (msg, isLoadFailure = false) => {
      // A PAGE THAT IS ALREADY LEAVING cancels its own in-flight chunk and
      // stylesheet requests, and Vite reports each one as a preload error.
      // Healing that with a reload overrode the navigation: a browser visitor
      // on bare /play (sent to "/" further down) got the page, a RELOAD of
      // the page, and only then the redirect — three loads for one, two
      // errors in Sentry (BALL-IQ-35), and the one reload this session is
      // allowed was spent, so a real stale chunk later had no cure. Found on
      // the live site, 23 Nov 2026, in WebKit and Chromium alike.
      if (window.__biqReloading || window.__biqLeaving) return
      if (!isLoadFailure && !isChunkError(msg)) return
      // Offline, a reload cannot fetch the new build; it can only swap a page
      // that works for one that may not come back. A background warm-up that
      // fails in a tunnel used to do exactly that, mid-game.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return
      // One auto-reload per ten minutes. It was one per session, for ever: a
      // tab kept open across two deploys healed the first and dead-ended on
      // the second. And no working guard means no reload at all: with storage
      // blocked this used to fall through and reload on every failure.
      let guarded = false
      try {
        const last = Number(sessionStorage.getItem(RELOAD_FLAG)) || 0
        if (last && Date.now() - last < 10 * 60 * 1000) return
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
        guarded = sessionStorage.getItem(RELOAD_FLAG) != null
      } catch { guarded = false }
      if (!guarded) return
      // Boundaries read this to stay quiet while the page is going away.
      window.__biqReloading = true
      window.location.reload()
    }
    // ⚠️ NEVER preventDefault() here. Vite's preload helper treats a prevented
    // event as "handled" and RESOLVES the failed import() with undefined, so
    // React.lazy then crashes on `undefined.default` (BALL-IQ-4, 37 users) —
    // and when the one-reload guard was already spent, that crash was all the
    // player ever saw. Letting it throw gives the boundaries a real chunk error.
    window.addEventListener('vite:preloadError', (e) => heal(e?.payload?.message, true))
    window.addEventListener('unhandledrejection', (e) => heal(e?.reason?.message || e?.reason))
  }
} catch {}

// ── Front-door routing: marketing homepage ( / ) vs the game ( /play, … ) ────
// The "Matchday" marketing homepage renders ONLY for regular browser tabs at the
// root. The native iOS/Android app, installed PWAs, and EVERY other path
// (/play, /play/*, /join/*, /c/*, …) render the game — so deep links and the
// installed apps are never sent to the marketing page.

const _path = (typeof window !== 'undefined' && window.location.pathname) || '/'
const _isNativeApp =
  (typeof location !== 'undefined' && location.protocol === 'capacitor:') ||
  !!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) ||
  (typeof document !== 'undefined' && document.documentElement.classList.contains('native-app'))
const _isStandalonePWA =
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true)
const _isBrowser = !_isNativeApp && !_isStandalonePWA
// "/" normally means marketing — but NOT when the URL is carrying a live
// hand-off. Two arrivals land on "/" and MUST reach the game instead:
//   • ?join=CODE — invite links already shared in the wild (api/join.js now
//     targets /play, but old links live forever in chat threads)
//   • an OAuth return — Supabase comes back with ?code=&state= (PKCE) or
//     #access_token= (implicit); rendering marketing here dropped the user on
//     the homepage after a successful Google sign-in and stranded the session
//     hand-off, because the auth listener lives inside the game bundle.
// Cheap string checks only — this runs at module-eval before React mounts.
const _search = (typeof window !== 'undefined' && window.location.search) || ''
const _hash = (typeof window !== 'undefined' && window.location.hash) || ''
const _hasHandoff =
  /[?&]join=/.test(_search) ||
  /[?&]code=/.test(_search) ||
  /access_token=/.test(_hash)
// FRONT DOOR (Alex, 2026-09-03): "/" renders the GAME for everyone. The site
// is the product; a stranger lands on the same home screen a player uses —
// today's Footle, the Daily 7, the club finder, the modes — not a marketing
// page about them. The two marketing surfaces stay reachable for comparison
// and as the visual rollback: /home-preview (Scouting Report), /home-old.
// SECOND PASS, same day: rendering the app shell at "/" read as "a copy of
// the app, designed for an app" (Alex). A field study of 13 quiz sites
// (memory: project_quiz_sites_field_study) says a website prints the date,
// puts the whole catalogue on the page as links, and keeps the browser's own
// scroll. FrontDoor.jsx is that page: dark, one system, every game a link
// into the app. The app itself stays at /play.
// RETIRED 2026-09-03: /home-preview (the Scouting Report) and /home-old (the
// page before it). Both were kept as rollbacks while the front door was on a
// branch; it is merged and live, and two rejected homepages should not be
// reachable by anyone. Their files are deleted; the real rollback is git.
const showMarketing = _isBrowser && !_hasHandoff && _path === '/'
// THE WEBSITE IS THE HOME (Alex, 2026-09-05, on seeing /play in a browser:
// "why should we have another one that just copies the app?"). A browser
// visitor who opens BARE /play — no game, no tab, no hand-off — goes to the
// front door, which already lists every mode as a link. The shell stays for
// what the site does not have: ?game=<mode> (a bare runner for the modes
// without a page yet), ?tab=profile|online (account, live rooms), ?club= /
// ?quiz= / ?join= / ?c= / an OAuth return — and for every installed PWA and
// native boot, which never see the website and keep the full app home.
const _barePlay = _isBrowser && !_hasHandoff && /^\/play\/?$/.test(_path) && !_search && !_hash
if (_barePlay) { try { window.__biqLeaving = true; window.location.replace('/') } catch { /* nothing to fall back to: the branch below renders nothing */ } }
// A browser visitor who opens /play cold skips the onboarding warm-up ("Quick
// one — give it a go") and lands on the app under the site header. The
// front door's game doors already bypass it; a taster before the product is
// the thing the 2026-09-03 rethink retired. Native and installed PWAs keep
// their first-run flow; deep links and OAuth returns never reach this line.
if (_isBrowser && !_hasHandoff && /^\/play\/?$/.test(_path)) {
  try { if (localStorage.getItem('biq_onboarded') !== '1') localStorage.setItem('biq_onboarded', '1') } catch {}
}
const loadFrontDoor = () => import('./marketing/FrontDoor.jsx')
const FrontDoor = React.lazy(loadFrontDoor)


// The game tree is lazy too (see GameRoot.jsx) so marketing visitors never
// download the ~200KB-gz game bundle. React.lazy only fires its import() on
// first render — which is after createRoot + the initial reconcile — so for
// game paths we ALSO kick the import off here at module-eval. Both calls
// resolve to the same module promise (ESM dedupes by specifier), so this just
// starts the network fetch a render-cycle earlier, overlapping it with mount.
// The .then waits for GameRoot's i18nReady (instant for English; the lazy
// Spanish table for a Spanish player, capped at 2 s, never rejects).
const loadGameRoot = () => import('./GameRoot.jsx').then((m) => (m.i18nReady ? m.i18nReady.then(() => m) : m))
const GameRoot = React.lazy(loadGameRoot)
if (!showMarketing && !_barePlay) loadGameRoot()
// Same render-cycle head start for the front door — React.lazy waits for
// first render; a visitor's LCP is inside this chunk. NOT on bare /play: that
// page is already navigating to "/", which cancels the fetch and its
// stylesheets (see the self-heal above for what that used to set off).
else if (!_barePlay) loadFrontDoor()

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
// game-nav gutter and match the #0B0C10 canvas. (The desktop landing chrome
// this also used to hide was deleted from index.html on 2026-09-05 — it had
// been hidden on every route since the front door shipped.)
const _fullBleed = () => {
  try {
    const root = document.getElementById('root')
    if (root) { root.style.paddingLeft = '0'; root.style.maxWidth = 'none'; root.style.margin = '0'; root.style.background = 'var(--bg)' }
    document.documentElement.style.background = 'var(--bg)'
    document.body.style.background = 'var(--bg)'
  } catch {}
}

if (_barePlay) {
  // Redirecting to / — render nothing behind the navigation.
} else if (showMarketing) {
  _fullBleed()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary><React.Suspense fallback={null}>
      <FrontDoor />
    </React.Suspense></ErrorBoundary>,
  )
} else {
  // desktop-web-refresh: mark the document as the game shell (body.biq-app /
  // body.biq-web drive the desktop rail + web-only CSS in app.css). Set here at
  // module-eval — the earliest point we know this is a game route — so it
  // beats first paint, and it also covers the login screen (not AppInner).
  try { document.body.classList.add('biq-app'); if (_isBrowser) document.body.classList.add('biq-web') } catch { /* noop */ }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <React.Suspense fallback={<SplashFallback />}>
          <GameRoot />
        </React.Suspense>
      </ErrorBoundary>
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
