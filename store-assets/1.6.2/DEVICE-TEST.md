# 1.6.2 device-test checklist (before upload — house rule)

Artifacts:
- Android: `android/app/build/outputs/bundle/release/app-release.aab` (vc20, 1.6.2, targetSdk 36)
- iOS: open `ios/App/App.xcworkspace`, scheme App — build 65 / 1.6.2 already stamped. Archive → upload.

## Android (real device)
- [ ] Install vc20 (internal testing track or `bundletool`), cold start clean
- [ ] Place the Ball IQ widget → shows 🔥 + 0/N or current state
- [ ] Solve any daily → widget count ticks within seconds
- [ ] Tomorrow morning (before opening the app): widget says "New puzzles ready"
- [ ] Tap widget → app opens
- [ ] Stadiums mode from More modes: type Etihad/Anfield, hint ladder, complete or give up
- [ ] Daily tab: replay glyphs on old days; back-fill one → streak does NOT move; form square dims "caught up later"
- [ ] Timeout a Classic question → reveal holds with Next (no auto-advance)
- [ ] Mystery win → confetti + haptic
- [ ] Notifications, sign-in, MP quick round — smoke

## iOS (build 65)
- [ ] Same app-level checks (no widget on iOS yet — next cycle)
- [ ] Solve Footle → completion chord + haptic; rate sheet behaviour sane

Reminder: uploads are Alex's action, one release per store in review at a time.
