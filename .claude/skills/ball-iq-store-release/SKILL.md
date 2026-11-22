---
name: ball-iq-store-release
description: Cut, upload and submit a Ball IQ iOS release to TestFlight and App Store review, or prepare an Android Play release. Use whenever asked to make a TestFlight build, write What's New, submit for review, check what's live or in review, or ship to the Play Store. Complements ball-iq-native-build (which covers the build itself and the web/native boundary).
---

# Ball IQ store release

Everything release-side lives in `~/ball-iq-release/` (outside the public repo). The build runs in the clean clone at `~/ball-iq-release/1.7.6`, never in the working checkout, so another session's uncommitted files can't ride into a binary.

## Who decides what (standing, from Alex)
- **TestFlight uploads and store screenshots:** mine, no asking (12 Oct).
- **Submitting for review:** only when the blockers are closed AND Alex has played the build (12 Oct).
- **Release type:** every submission uses **AFTER_APPROVAL**, so it goes live by itself (15 Oct). `asc-store.mjs submit` refuses otherwise.
- **Tiki Taka Toe:** stays out of both stores until Alex has tested it. `submit` scans the build's archive and refuses if it's in there and `~/ball-iq-release/store/TTT_APPROVED` doesn't exist. Only create that file on Alex's word.
- **Android:** never upload an AAB that hasn't run on an Android emulator or device.
- **One iOS version in review at a time.** To pull one back: `node ~/ball-iq-release/store/cancelreview.mjs` (Alex runs it).

## Read the state first, never from memory
```bash
node scripts/asc.mjs versions
```
```bash
node scripts/asc.mjs builds
```
- **`versions`** lists the version records. READY_FOR_SALE means live; WAITING_FOR_REVIEW and IN_REVIEW mean in review; PREPARE_FOR_SUBMISSION means a draft.
- **`builds`** lists the newest uploads with their processing state. VALID means testers have it.
- **Session start** prints a cached version of both. Re-read with these commands before quoting anything to Alex.

## iOS: TestFlight build
1. **Commit and push the fixes to main first.** The push gate wants a green `npm run build` first. Deploy-verify as usual.
2. **Bump the build number.** Set `CURRENT_PROJECT_VERSION` (and `MARKETING_VERSION` for a new version) in `ios/App/App.xcodeproj/project.pbxproj`. Commit that as its own commit, e.g. "1.8.6 (iOS 167): TestFlight build with …", and push.
3. **Copy the newest `build-<N>.sh`** to `build-<N+1>.sh` and change the numbers. It does all of this:
   1. Pulls main into the clean clone and checks the pbxproj number.
   2. Runs `rm -rf dist && npm run build`, then `npx cap sync ios`, then `node scripts/prune-native-web-assets.mjs`.
   3. Runs `xcodebuild … archive` to `archives/BallIQ-<ver>-<N>.xcarchive`.
   4. Runs `xcodebuild -exportArchive -exportOptionsPlist ExportOptions-upload.plist`, which uploads.
   - The keys only ever go in as `-authenticationKeyPath`. Never cat, copy or print a `.p8`; the hooks deny it.
4. **Run it in the background,** with logs going to `~/ball-iq-release/*-<N>.log`. Read the log for `UPLOAD OK` and `EXPORT SUCCEEDED`.
5. **Wait for processing.** `node scripts/asc.mjs builds` should show `(<N>) VALID`. The TestFlight group "1.7 test" has allBuilds=true and contains Alex only, so he gets every VALID build automatically. There's nothing to add by hand.
6. **Keep the archive.** `submit` scans it for Tiki Taka Toe; without it, submit refuses.

## iOS: version record, What's New, submit
`asc-store.mjs` lives at `~/ball-iq-release/store/asc-store.mjs` and always acts on the one editable version.
1. **Create the version record.** `node ~/ball-iq-release/store/asc-store.mjs create <ver>` creates it with AFTER_APPROVAL already set.
2. **Write What's New** in `~/ball-iq-release/store/wn-<ver>/`, one file per language: `en, de, fr, es, it, nl, no, sv, pt, pt-BR, tr, ko, id, ar`.
   - The voice: a "New in <ver>:" line, then 3–5 bullets in plain words.
   - Never mention the question count. Say "thousands of questions"; the script refuses numbers.
   - Never name an untested feature.
3. **Set What's New for all 19 locales from the 14 files** with `whatsnew <locale> <file>`:
   - en-US, en-GB, en-CA and en-AU take `en.txt`.
   - fr-FR and fr-CA take `fr.txt`.
   - es-ES and es-MX take `es.txt`.
   - pt-PT takes `pt.txt`; pt-BR takes `pt-BR.txt`.
   - de-DE takes `de`; it takes `it`; nl-NL takes `nl`; no takes `no`; sv takes `sv`; tr takes `tr`; ko takes `ko`; id takes `id`; ar-SA takes `ar`.
4. **Attach the build:** `attach <buildNumber>`.
5. **Check before submitting.** `inspect` must show every locale with a filled whatsNew. Confirm Alex has played this build.
6. **Submit.** `submit` runs the gates (AFTER_APPROVAL, the question count across all locales, Tiki Taka Toe in the archive) and then sends it.
7. **Confirm it landed.** `node scripts/asc.mjs versions` should show WAITING_FOR_REVIEW. When it later shows READY_FOR_SALE, tell Alex it's live.

## Android: Play
- Bump `versionCode` and `versionName` in `android/app/build.gradle` on main and push. Play rejects a code it has already seen.
- **Build with the script, never by hand:** copy the newest `~/ball-iq-release/aab-<N>.sh` (from `aab-70.sh` on) and run it with the commit to build. It copies `google-services.json` into the clean clone from `~/ball-iq-release/android-secrets/`, builds the bundle and a release APK, and refuses to finish unless both contain Firebase's `google_app_id`. Never report an Android build without its two lines: `BUNDLE IS <sha>` and `FIREBASE IS IN THE BUNDLE`.
- **Why (22 Nov 2026):** versions 63 to 69 were built in the clean clone without that git-ignored file. The live 1.8.6 then crashed on launch for every signed-in player who had allowed notifications (`FirebaseApp.getInstance`, about a hundred crashes, eleven players, nine days) and a player wrote in. `build.gradle` now refuses a release without the file, and `tests/unit/android-firebase-config-required.test.js` pins that.
- **Run it before uploading, and run the path that crashed.** On the emulator: install the release APK, `adb shell pm grant app.balliq android.permission.POST_NOTIFICATIONS`, launch, then over the WebView debug channel call `Capacitor.Plugins.PushNotifications.register()` and wait for the `registration` event. The process must still be alive, a token must arrive, and `adb logcat -d -s AndroidRuntime:E` must hold no FATAL EXCEPTION. Launch it cold a second time. (The emulator's screencap lies: see `reference_simulator_and_emulator_traps_2026_10_13`.)
- **When a player reports a crash, read the store's own crash data first:** Play Console, Quality, Android vitals, Crashes and ANRs; App Store Connect, Analytics, Metrics, Crashes. A native crash kills the app before Sentry can report, so Sentry being quiet proves nothing.
- Release notes go in `~/ball-iq-release/play-notes-<ver>.txt`, in `<en-US>` blocks per language, 500 characters at most per language.
- Play Console, production: Create new release, upload through the hidden file input, paste the notes, Next, Save, then Publishing overview and "Send changes for review". Only on Alex's own word to submit.

## Traps that have cost real time
- **Simulator first.** An unsigned simulator build gives a fake black launch; `sim-build.sh` ad-hoc signs it.
- **One simulator at a time.** Tell the Tide HQ session before booting; the hook refuses a second one.
- **Old simulator runtimes.** A simulator older than the installed iOS SDK passed build 138, which then died on every iOS 27 phone. bash-gates asks.
- **Release builds need a clean tree on main.** Vite bakes the git SHA in, and bash-gates asks otherwise.
- **Screenshots lag 1–2 s** behind taps in the simulator. Pause before trusting one.
