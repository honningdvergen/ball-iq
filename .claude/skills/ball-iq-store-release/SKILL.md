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
- Bump `versionCode` and `versionName` in `android/app/build.gradle`. Play rejects a code it has already seen.
- Build the AAB with `./android/gradlew -p android bundleRelease`. It needs `JAVA_HOME` set to the Android Studio jbr, and the nvm node on PATH; see ball-iq-native-build. Copy the result to `~/ball-iq-release/play-upload/BallIQ-<ver>-<code>.aab`.
- **Run it before uploading.** Use the emulator and the WebView debug channel (the emulator's screencap lies): see `reference_simulator_and_emulator_traps_2026_10_13`.
- Release notes go in `~/ball-iq-release/play-notes-<ver>.txt`, in `<en-US>` blocks per language.

## Traps that have cost real time
- **Simulator first.** An unsigned simulator build gives a fake black launch; `sim-build.sh` ad-hoc signs it.
- **One simulator at a time.** Tell the Tide HQ session before booting; the hook refuses a second one.
- **Old simulator runtimes.** A simulator older than the installed iOS SDK passed build 138, which then died on every iOS 27 phone. bash-gates asks.
- **Release builds need a clean tree on main.** Vite bakes the git SHA in, and bash-gates asks otherwise.
- **Screenshots lag 1–2 s** behind taps in the simulator. Pause before trusting one.
