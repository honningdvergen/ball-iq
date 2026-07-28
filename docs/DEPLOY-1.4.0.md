# Deploy checklist — Ball IQ 1.4.0 (App Store + Google Play)

Generated 2026-07-28 via `/deploy-checklist`, adapted to this project's real
constraints (the generic template assumes CI/staging/canary — Ball IQ has none
of those; it has app-store review, a web/native boundary, and one device).

**What's in this release:** 329 verified question-bank changes · 5 mobile layout
fixes · Android store links everywhere · share/rate platform fixes · taster
doubled to 10 questions.

**Why it matters:** all 329 corrections are live on the web and in NEITHER app
binary. iOS 1.3.3 and Android build 6 currently ship the uncorrected bank to the
retained users — the ones with streaks who would actually notice.

---

## ⚠️ Pre-flight — the traps this project has actually hit

- [ ] **`rm -rf dist` before `cap sync`.** Not optional. `cap sync` serves a
      stale `dist/` otherwise and you debug a fix that never reached the binary.
      ```
      rm -rf dist && npm run build && npx cap sync ios      # and: android
      node scripts/prune-native-web-assets.mjs              # after EVERY sync
      ```
- [ ] **Bump the version.** iOS: `CURRENT_PROJECT_VERSION` in
      `ios/App/App.xcodeproj/project.pbxproj`. Android: `versionCode` (Play
      rejects a re-upload of a code already on file — build 6 is taken).
- [ ] **Keep `marketing/ball.png`.** `BiqNav.jsx` renders it unconditionally;
      deleting `marketing/` 404s the native nav logo.
- [ ] **Verify the question bank made it in.** The whole point of this release:
      ```
      grep -c "first German defender" ios/App/App/public/assets/questions-*.js
      ```
      Expect 1. If 0, `dist` was stale — go back to step one.

## ✅ Already verified (2026-07-28, don't redo)

- [x] Build green: `npm run build` exits 0, ESLint gate passed
- [x] Bank integrity: 5,834 questions, 0 malformed, 0 duplicate ids/options
- [x] SEO pages: 164 built, **0 thin-page refusals**
- [x] Playwright viewport audit: nothing playable below the fold on any page type
- [x] Internal links: 10,486 checked, **0 broken**
- [x] **`/get` is web-only and that is CORRECT.** It is a Vercel edge function
      and does not exist inside the app. The two relative `/get` links live in
      `MarketingHome.jsx` and `index.html`'s landing chrome, both gated:
      `_isBrowser = !_isNativeApp && !_isStandalonePWA`, plus 13 `native-app`
      killswitch rules in index.html. Native surfaces use the absolute
      `APP_STORE_URL` / `PLAY_STORE_URL` constants instead. **Do not "fix" this.**

## 📱 Device test — cannot be skipped or mocked

A green build proves compilation, not behaviour. On a real device:

- [ ] App launches; no white screen on cold start
- [ ] Play a Classic quiz — answer, reveal, **Next →**, results
- [ ] Footle loads and accepts a guess
- [ ] Settings → **Share** produces `balliq.app/get` (NOT an App Store URL —
      this was the bug: Android users were sharing App Store links)
- [ ] Settings → **Rate** opens the correct store for the platform you're on
- [ ] Sign in still works (Apple on iOS, Google on Android)

## 🚀 Submit

- [ ] **One version through App Store review at a time.** 1.3.3 is live, so the
      lane is clear.
- [ ] iOS: archive → App Store Connect → submit
- [ ] Android: `./android/gradlew -p android bundleRelease` (needs nvm node +
      JBR java on PATH) → upload AAB → release notes → send for review
- [ ] ⚠️ **Play managed publishing is OFF** — approval publishes automatically,
      with no second confirmation. Google reviewed build 6 in ~15 minutes.

## 🔙 Rollback

Mobile has no instant rollback — that is the point of the device test.

- **Play:** while in review, Publiseringsoversikt → "Opphev endringene".
  After it is live, halt the rollout or ship a new versionCode.
- **App Store:** you can reject your own binary while "Waiting for Review";
  once live, only a new build fixes it.
- **Web is independent** and already carries every one of these changes, so a
  bad native build never takes the corrections down with it.

## Rollback triggers

- Crash on launch on any tested device
- A quiz cannot be completed end to end
- Sign-in fails
- Share or Rate opens the wrong platform's store

## 📋 Post-deploy

- [ ] Tick the release in `docs/TODO.md`
- [ ] Update `project_ios_build_status` memory — it is the single source of
      truth for what is actually cut, and it goes stale silently
- [ ] Re-check GSC + Clarity in a week; the weekly Clarity routine fires Mondays
