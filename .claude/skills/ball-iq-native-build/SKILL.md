---
name: ball-iq-native-build
description: Cut, sync or ship a Ball IQ native build (iOS App Store or Android Play AAB). Use when asked to cut a build, bump a version, run cap sync, archive, or ship to the stores — and whenever editing anything that ends up in dist/, index.html, or app.css, because those cross the web/native boundary in ways the build system does not enforce.
---

# Shipping native, and the web/native boundary

Bundle id `app.balliq` (NOT `com.balliq.app` — the reversed form is a hard 404 and shipped in 5 CTAs once). Team `A99W5L256P`, signing Automatic. iOS scheme lives in the CocoaPods **workspace**, not the project: `xcodebuild -workspace ios/App/App.xcworkspace -scheme App`.

## The build command (both platforms)

```
rm -rf dist && npm run build && npx cap sync ios      # or: android
node scripts/prune-native-web-assets.mjs              # re-run after EVERY cap sync
```

`rm -rf dist` is not optional. **`cap sync` serves a stale `dist/` otherwise** — CSS/JS edits silently never reach the installed app, and you debug a fix that was never in the binary.

Android additionally needs both on PATH (a non-interactive shell has neither):
```
export PATH="/Users/alexanderbrynolsen/.nvm/versions/node/v25.9.0/bin:$PATH"
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./android/gradlew -p android bundleRelease
```

## Non-negotiables

- **Bump the version.** iOS: `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`. Android: `versionCode` — Play rejects a re-upload of a code already on file.
- **Device-test before submitting.** Permission prompts, splash behaviour and push cannot be mocked. A green build proves compilation, not behaviour.
- **One version through App Store review at a time.**
- **Uploading is the user's call**, every time. Building locally is free; publishing is not. Never upload without an explicit go-ahead for that specific build.
- **Prod status is unknowable from the repo.** `pbxproj` shows what's *cut*. Whether it's live is in App Store Connect — ask, or read it in the user's paired Chrome.

## The web/native boundary — the trap that keeps recurring

`capacitor.config.json` sets `webDir: "dist"`, so **everything you build for the web ships inside the native app**, reachable or not. The build system enforces nothing here; only runtime guards do.

Consequences that have actually bitten:

- **~7MB of web-only assets** ride in the binary (47 SEO page dirs, Safari-PWA splash PNGs, sitemap, verification files) — that's ~54% of the AAB. Hence `prune-native-web-assets.mjs`. **KEEP `marketing/ball.png`** — `BiqNav.jsx` renders it unconditionally; deleting `marketing/` 404s the native nav logo.
- **Third-party scripts must be native-guarded, mechanically.** The native app's privacy policy and App Store listing declare *no ads, no analytics*. AdSense is injected behind a native check in `index.html` and in the SEO generator's `head()`. A raw `<script src>` anywhere in `dist/` means the app fetches Google's ad script and the privacy declaration silently becomes false. The old defence was a comment asserting "these pages are web-only" — true for *rendering*, false for *bundling*. Guard it in code.
- **Detect native on BOTH platforms.** `location.protocol === 'capacitor:'` catches **iOS only** — Android runs `androidScheme: 'https'`. Use the full check: capacitor protocol **OR** `document.documentElement.classList.contains('native-app')` (set by index.html on both) **OR** `Capacitor.isNativePlatform()`.

## The standalone CSS mirror

`app.css` carries a `@media (display-mode: standalone)` mirror block (~155 `!important` rules) that re-hides/re-styles what the ≥1024px desktop reflow changes. **Any token or class you touch in the reflow must be checked against the mirror, and against `index.html`'s `html.native-app` killswitch.** Miss it and installed PWAs / the native app keep the old styling — a documented past incident. A single UI element commonly has hooks in four places: the component, the base rule, the reflow, and the mirror.

## Deep links

`public/.well-known/assetlinks.json` (Android) and `apple-app-site-association` (iOS) gate `/join/` and `/c/`. Static files DO beat the SPA catch-all rewrite on Vercel (verified — AASA serves `application/json`). assetlinks needs **both** SHA-256s: the Play App Signing cert *and* the upload key — Play re-signs, sideloads don't. Both live in Play Console → Appintegritet → Appsignering.
