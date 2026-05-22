# Ball IQ — supported platforms

Last reviewed: Sprint #67 (May 2026).

This doc records the browser baseline Ball IQ targets, the PWA install paths per platform, and the known gaps. Stay realistic — the goal is "the v1.0 launch audience plays without hitting walls", not "every browser ever made works".

## Minimum browser versions

| Browser | Minimum version | Released | Notes |
|---|---|---|---|
| iOS Safari | **15.0** | Sept 2021 | iPhone 6s+ supported; iPhone 6 / SE 1st-gen capped at iOS 12-15 |
| Chrome (Android + desktop) | **88** | Jan 2021 | `aspect-ratio` floor; most Android Chrome is 100+ |
| Firefox (Android + desktop) | **89** | Jun 2021 | `aspect-ratio` floor |
| Edge | **88** | Jan 2021 | Chromium-based; matches Chrome |
| Samsung Internet | **14** | Jan 2021 | Chromium 87 fork; CSS floor matches Chrome 88 |
| Safari (macOS) | **15.0** | Sept 2021 | macOS 11 Big Sur+ |

**Build target:** `es2020` (`vite.config.js`). Anything older than the table above won't run the JS bundle.

**JavaScript floor:** Safari 14 / Chrome 80 / Firefox 74. Optional chaining + nullish coalescing are standard.

**CSS floor:** the harder constraint. `aspect-ratio` (used in Footle tiles, Daily form-strip cells, Match-7 cells) requires Safari 15 / Chrome 88. The `inset:` shorthand (used in every modal/overlay) requires Safari 14.5 / Chrome 87.

Sprint #67 II1 added `padding-top: 100%` fallbacks (via `::before`) for `aspect-ratio` and `top/right/bottom/left: 0` longhand alongside every `inset: 0`. iOS 14.0-14.4 PWA users get layout-equivalent rendering — slightly flat Footle tiles instead of perfectly square, but functional. Modal positioning correct.

## PWA install paths

| Platform | Install path | Standalone detection |
|---|---|---|
| iOS Safari (iPhone, iPad) | Share sheet → "Add to Home Screen" | `window.navigator.standalone === true` |
| iOS Chrome / Firefox / Edge | **Cannot install.** iOS restricts PWA install to Safari. App still works in-browser. | `false` always |
| Android Chrome | `beforeinstallprompt` event → in-app button (Settings card or post-Footle banner) | `matchMedia('(display-mode: standalone)').matches` |
| Android Samsung Internet | Menu → "Add page to" → "Home screen" | matchMedia same as Chrome |
| Android Firefox | Long-press URL bar → "Install" | matchMedia same |
| Desktop Chrome / Edge | URL-bar install icon OR `beforeinstallprompt` button | matchMedia same |
| Desktop Safari | Share sheet → "Add to Dock" (macOS 14+) | matchMedia same |
| Desktop Firefox | **Cannot install.** No PWA install on desktop Firefox. | matchMedia returns `false` |

`src/installPrompt.js` handles all detection. The in-app install affordances appear in two places:
- **Settings → Install card** — visible whenever install path is available and the user hasn't dismissed (30-day cooldown).
- **Post-Footle solve banner** — visible after a successful Footle solve, separate dismiss flag (30-day cooldown).

Both are suppressed when display-mode is standalone (already installed). Both suppress permanently for users we've ever observed completing install (handles the iOS Safari "reopen via Safari after install" edge case via `biq_install_completed` localStorage flag).

## Feature requirements by browser version

| Feature | Requires |
|---|---|
| Footle, Today's 7, classic quiz modes | Any supported browser |
| PWA installable home-screen launch | iOS Safari 15+, Chrome 76+, Edge 76+, Samsung 14+, Firefox Android with manual flow |
| Persistent storage (no overnight token eviction) | Chrome 55+, Safari 15.4+, Samsung 6+ |
| Web Share API (share quiz result via OS sheet) | Safari 12.2+, Chrome 89+ (Android), Edge 93+. Falls back to clipboard otherwise. |
| Clipboard API write (room-code share fallback) | Safari 13.4+, Chrome 66+. Falls back to user-visible prompt otherwise. |
| Haptic feedback on correct/wrong answer | Android Chrome / Samsung. iOS silently ignores `navigator.vibrate`. |
| Multiplayer Stage 1 realtime | Supabase realtime — same browser floor; requires WebSocket support (universal on supported list). |

## Known limitations

- **iOS PWA storage eviction.** iOS evicts localStorage / IndexedDB for installed PWAs after ~7 days of inactivity. Supabase refresh tokens live in localStorage → forced re-login. Sprint #62 added `navigator.storage.persist()` request to mitigate; Chrome/Edge auto-grant, iOS Safari prompts once.
- **iOS PWA cold-start splash.** Sprint #65 added `apple-touch-startup-image` PNGs at the most common iPhone sizes. iOS caches these at install time — existing installs may not pick up Sprint #65's splash images until reinstall.
- **iOS 14.0-14.4 visual fallbacks.** Sprint #67 II1 added padding-top + longhand inset fallbacks. iOS 14.x audience is sub-2% of expected launch traffic; the fallback is functional, not pixel-perfect.
- **Desktop Firefox cannot install PWAs.** Users browse the app in-tab. No banner / Settings card shown.
- **Landscape orientation on mobile.** `manifest.json` requests portrait; installed PWAs are locked. In browser mode, landscape renders the centered 420px column with gutters — functional, not optimized.
- **Older Android (pre-Chrome 80).** Won't run the JS bundle (`es2020` target). Realistic exposure for the launch audience is near zero.

## Untested platforms (real device required)

Code audit + Playwright cover most of the surface. The following are gaps a launch-week sanity pass should cover:

- iPhone 11 / 12 / 13 (older iOS, common audience) — Web Inspector doesn't capture true cold-start
- Low-end Android (Galaxy A-series, Pixel 4a, sub-2GB RAM) — Sprint #25 W1's 4.4s throttled-LCP estimate is the only real-device data point
- Samsung Internet on a real S22+
- Galaxy Fold (inner display, both folded and unfolded) — niche audience but worth one check

See `docs/MONITORING_OPTIONS.md` for the post-launch observability plan.

## Adding new browser-conditional features

If a sprint adds a new modern API:
1. Check support floor on caniuse.com.
2. If the floor is above this doc's table, either:
   - Add a feature detection guard (`if (typeof navigator.x === 'function')`) and provide a fallback, OR
   - Raise the doc's minimum and verify the impacted audience is acceptable.
3. Update this doc's "Feature requirements" table.

If a sprint adds a new CSS feature:
1. Same floor check.
2. If floor is above this doc's table, add a fallback in the same commit (precedent: Sprint #67 II1).
