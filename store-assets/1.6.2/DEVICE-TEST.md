# 1.6.2 device-test checklist (before upload — house rule)

Artifacts (rebuilt 2026-08-21 — these include the Trail keyboard fix; the
2026-08-20 pair did not, so use these):
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
- [ ] **Push E2E (only after the FCM_SERVICE_ACCOUNT secret is set)**: from a second
      account, send a friend request → banner arrives on the Android device.
      Prereq (Alex): Firebase console → ball-iq-499016 → Project settings →
      Service accounts → *Generate new private key*, then paste the full JSON into
      Supabase dashboard → Edge Functions → Secrets as `FCM_SERVICE_ACCOUNT`.
      The key is a true secret — never in the repo, never in chat.

## iOS (build 65)
- [ ] Same app-level checks (no widget on iOS yet — next cycle)
- [ ] Solve Footle → completion chord + haptic; rate sheet behaviour sane

Reminder: uploads are Alex's action, one release per store in review at a time.
