# Native crash reporting — where it stands, and the wall in front of it

**Status: JS-layer crashes are now reported. Native-layer crashes are not.**
Written 2026-08-21 (scouting report #2, item 15).

## Update, 24 Nov 2026: Android wired, iOS blocked, the build NOT green yet

Done on the Capacitor 8 branch, read against Sentry's Capacitor guide and the
8-to-9 and 9-to-10 JavaScript migration guides:

- `@sentry/react` 8.55.2 to **10.76.2** and `@sentry/capacitor` **4.6.0**, both
  exact (4.6.0 pins the sibling to the patch; a caret breaks its postinstall
  check). `@sentry/vite-plugin` stays on 2.23.1: it is a build tool with no tie
  to the SDK version, and its debug-ID bytes are what the Home budget's 6 KB
  charge was measured on.
- `src/main.jsx`: one options object, two ways to start it. Where the native
  plugin is in the binary, `@sentry/capacitor`'s init wraps the React init;
  everywhere else the React init runs directly, as before. The reasons are in
  the comment there.
- **Android** has the plugin (sentry-android 8.64.0). Debug and release (R8)
  both build; the merged manifest gains three non-exported providers and one
  meta-data entry, and no permission.
- **iOS does not have it.** `@sentry/capacitor` removed its podspec in 4.4.0
  (Swift Package Manager only, because sentry-cocoa stopped publishing to
  CocoaPods after 9.19.1), and this iOS project is on CocoaPods:
  `pod install` stops at "No podspec found for SentryCapacitor". So
  `capacitor.config.json` carries `ios.includePlugins` to keep it out of the
  iOS sync, and iOS keeps the JavaScript-only reporting it had. The ways on:
  move the iOS project to SPM (every plugin in package.json already ships a
  Package.swift) and delete that list; or step back to 4.3.0, the last release
  with a podspec, which pins `@sentry/react` 10.69.0 and sentry-cocoa 9.16.1,
  is deprecated, and still has the bug 4.6.0 fixed (errors raised while the
  app boots are dropped, because the JavaScript client waits for native).
- **The Home JS budget (settled the same day).** The table below is the
  measurement that stopped the first attempt at 914 KB. The Transfer Trail’s
  career data then came off Home’s eager path (256b29e4, 893 to 851 KB on SDK
  8), and with SDK 10 and the wrapper behind `import()` the gate reads
  **873 KB against 909**. What follows is kept as the record of why the
  wrapper is imported lazily. SDK 10 is bigger
  than SDK 8. Measured with `vite build` and `scripts/audit-home-budget.mjs`,
  DSN in `.env.local`, budget 909 KB:

  | tree | main chunk | Home eager JS |
  |---|---|---|
  | before (SDK 8.55.2) | 95 KB | 894 KB |
  | SDK 10.76.2, wrapper imported statically (the guide as written) | 140 KB | 938 KB |
  | the same with `__SENTRY_DEBUG__: false` | 135 KB | 933 KB |
  | SDK 10.76.2 alone, no wrapper | 120 KB | 918 KB |
  | wrapper behind `import()` on native, `__SENTRY_DEBUG__: false` (what is in the tree) | 115 KB | **914 KB** |

  `__SENTRY_TRACING__: false` on top of the last row saves 1 KB and would end
  web tracing. Five KB still have to come from somewhere: off Home's eager
  path elsewhere, or from the budget, which is Alex's call and not a ratchet.
- Not done, because each needs a Sentry auth token in a native build:
  R8 mapping upload (the Sentry Android Gradle plugin) and, once iOS has the
  SDK, dSYM upload. Without the mapping, frames in `app.balliq`, Capacitor and
  the plugins read plainly (they are kept by proguard-rules.pro); frames
  inside androidx, Firebase and other minified libraries do not.

The sections below are the August note, kept for the reasoning.

## What got fixed today

`.env.local` had no `VITE_SENTRY_DSN`, and `src/main.jsx` guards the whole
Sentry init behind it, so Rollup dead-stripped the SDK out of every native
build. Vercel had the variable, so **web was always covered and native never
was** — both "worked", and only one reported. The DSN is now in `.env.local`
(gitignored; the value is not secret — it only permits sending events and it
already ships in the public web bundle), and it is **verified present in both
the iOS and Android bundles**, not merely assumed from a green build.

`src/lib/push.js` also stopped swallowing FCM registration failures, on the
one code path with a history of hard-crashing Android.

## What is still missing, and why it is not a one-line install

`@sentry/react` runs inside the webview. It cannot see a crash in the native
layer — and the crash this app has actually suffered was exactly that:
ticket #1650, `Default FirebaseApp is not initialized`, thrown outside the JS
bridge. A JS SDK never sees it. `@sentry/capacitor` is what does.

**The blocker is peer pinning.** Sentry pins peers to EXACT versions:

| @sentry/capacitor | requires @sentry/react |
|---|---|
| 1.0.0 | 8.27.0 |
| **1.1.0** | **8.42.0** |
| 2.0.0 | 9.27.0 |
| 2.1.0 | 9.38.0 |
| 4.3.0 (latest) | 10.69.0 |

This repo is on `@sentry/react@^8.55.2`. There is **no version of
@sentry/capacitor that drops in cleanly**:

- **v1.1.0** would mean *downgrading* the working web SDK from 8.55.2 to
  8.42.0 — taking a regression risk on the half that currently works, to add
  the half that does not.
- **v4.3.0** means `@sentry/react` 8 → 10: two major versions, across a
  ~10k-line `App.jsx`, with breaking changes in both.

## Why it was deliberately NOT attempted on 2026-08-21

Judgement call, recorded so the next person does not assume it was overlooked:

1. The **valuable half already landed**. The DSN fix moved native from "no
   crash reporting at all" to "JS crashes reported". `@sentry/capacitor` adds
   the native layer on top — real, but a smaller delta than the one just made.
2. **vc20 was in Play review that same day** carrying a week of work. A
   two-major dependency upgrade is the wrong thing to put behind a build
   already in flight.
3. It is a **dependency upgrade wearing an install's clothing**. Twenty
   minutes of typing, then an unknown amount of fixing — which is exactly the
   kind of thing that goes badly at the end of a long session.

## How to do it when picked up fresh

Take the **v10 path**, not the downgrade. Upgrading forward is the direction
the ecosystem is moving and the downgrade trades a working thing for a
broken one.

1. `@sentry/react` 8.55.2 → 10.69.0 and `@sentry/vite-plugin` to match.
   Read BOTH the v9 and v10 migration guides — the v9 breaking changes apply
   even though you skip through it.
2. Then `npm i @sentry/capacitor@4.3.0`.
3. Init changes: `@sentry/capacitor`'s `init` wraps the React one — the
   sibling SDK is passed in rather than initialised separately.
4. `npx cap sync` both platforms; the native SDKs arrive via CocoaPods and
   Gradle.
5. **Verify by causing a real native crash on a device**, not by reading a
   green build. The whole point is the class of crash a JS SDK cannot see, so
   a JS-thrown test error proves nothing about it.

## Also outstanding from item 15

A real **VoiceOver / TalkBack pass** on a device. The accessibility work
shipped this month (colour-blind Footle, the club-page glyph + live region,
aria labels) is verified present but has never been driven by an actual
screen-reader user. Present is not the same as usable.

## Review, 24 Nov 2026 (independent, read against node_modules)

What changed after it, and what is left as it is on purpose:

- **Breadcrumbs are cleaned when they are stored** (`beforeBreadcrumb`,
  `src/lib/sentryScrub.js`, on main since b116749f). The wrapper copies every
  stored breadcrumb to the native SDK, and a native crash is sent without
  passing `beforeSend`. Core runs `beforeBreadcrumb` before the scope stores
  the breadcrumb, so the copy is the cleaned one.
- **Android events carry an install ID as the Sentry user id**, on native
  crashes (sentry-android’s DefaultAndroidEventProcessor) and on JS events
  (the wrapper’s device context copies the native user). The web never sent a
  user. Nothing in this plugin can switch it off for native crashes. It is
  kept: it is what makes "users affected" mean something on Android. **Before
  a store release** the Play Data safety form and the Sentry sentence on
  public/privacy.html have to say so; both are Alex’s to change.
- **The web sends no IP-derived user any more.** SDK 10 sets `infer_ip:
  never` unless `sendDefaultPii` is on, so "users affected" goes blank on web
  issues. More private, kept.
- **No CultureContext on the web** (locale, time zone, calendar; new in SDK
  10): filtered out of the web client’s default integrations.
- **HttpContext is handed back on native**: the wrapper’s defaults drop it and
  Android JS issues lost their WebView version.
- **The earliest crashes are still invisible.** `io.sentry.auto-init` is
  false, so the native SDK starts when the WebView has run main.jsx and
  fetched the wrapper chunk. A crash before that is not reported, and a JS
  error in the few milliseconds before the chunk lands is dropped. Starting
  the native SDK from the manifest would close it; not done yet.
- Android JS issues regroup once (rewritten frame paths, another SDK name).
