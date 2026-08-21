# 1.6.2 device-test checklist (before upload — house rule)

Artifacts (rebuilt 2026-08-21 14:18 at sha 1998e1b — carries the three Stadiums
fixes, the Trail keyboard fix and the FCM push client. Any earlier vc20 pair is
stale; use these):
- Android sideload test build: `~/Downloads/BallIQ-1.6.2-vc20-test.apk` — signed
  release APK, installs straight onto the phone (the AAB cannot).
- Android Play upload: `~/Downloads/BallIQ-1.6.2-vc20-play-upload.aab`
  (also at `android/app/build/outputs/bundle/release/app-release.aab`; vc20,
  1.6.2, targetSdk 36). vc20 has never been uploaded, so this replaces the
  earlier vc20 rather than burning a version number.
- iOS: open `ios/App/App.xcworkspace`, scheme App — build 65 / 1.6.2 already stamped. Archive → upload.

## Android (real device)
- [ ] Install vc20 (internal testing track or `bundletool`), cold start clean
- [ ] Place the Ball IQ widget → shows 🔥 + 0/N or current state
- [ ] Solve any daily → widget count ticks within seconds
- [ ] Tomorrow morning (before opening the app): widget says "New puzzles ready"
- [ ] Tap widget → app opens
- [ ] Stadiums mode from More modes: type Etihad/Anfield, hint ladder, complete or give up
      (smoke-tested on the release APK: five leagues load, "Etihad" scored 0/20 → 1/20)
- [ ] **Transfer Trail keyboard (the bug you reported)**: play to the fourth and
      fifth club — the input must stay above the keyboard and the newest club must
      stay readable, with no need to leave and re-enter the mode.
- [ ] Daily tab: replay glyphs on old days; back-fill one → streak does NOT move; form square dims "caught up later"
- [ ] Timeout a Classic question → reveal holds with Next (no auto-advance)
- [ ] Mystery win → confetti + haptic
- [ ] Notifications, sign-in, MP quick round — smoke
- [ ] **Android push (new in 1.6.2)**: sign in → allow notifications → app must NOT
      crash (the old #1650 class — Firebase now ships in the build; boot verified on a
      Play-services emulator, zero fatal exceptions). Then check Supabase
      `device_tokens` has a row with platform `android` for your user.
- [ ] **Push E2E** — the `FCM_SERVICE_ACCOUNT` secret is SET and VERIFIED in prod
      (2026-08-21, probe token pruned; see docs/fcm-runbook.md). Nothing left to
      configure: from a second account send a friend request → a banner should
      arrive on the Android device. Token count was 35 ios / 0 android at go-live,
      so watch for android turning 1.
- [ ] **Stadiums on a real phone (the three fixes)**: board opens on "20 grounds
      to name" rather than a wall of empty rows · no "Ball IQ" stacked above
      "Name the Stadium" · with the keyboard up, the list scrolls far enough to
      reach the LAST club and the "Show me the answers" button.

## iOS (build 65)
- [ ] Same app-level checks (no widget on iOS yet — next cycle)
- [ ] Solve Footle → completion chord + haptic; rate sheet behaviour sane

Reminder: uploads are Alex's action, one release per store in review at a time.
