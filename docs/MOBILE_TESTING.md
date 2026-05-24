# Mobile testing playbook — Ball IQ Capacitor build

Sprint #81 YY1 prep. Used during Phase 5 of the Capacitor rollout
(real-device verification before App Store / Play Store submission).

---

## Device matrix

Coverage tiers ranked by priority. Tier 1 = must-pass before submission.
Tier 2 = should-pass; bug filed if not. Tier 3 = nice-to-have coverage.

### Tier 1 (must-pass)

| Device | OS | Viewport | Why it's tier 1 |
|---|---|---|---|
| iPhone 14 Pro (Alex's primary) | iOS 18+ | 393×852 @3x | Primary test device. Stress every flow here first. Reference for all bug repros. |
| iPhone SE 3rd gen | iOS 17+ | 375×667 @2x | Smallest viewport we support. Tests bottom-sheet maxHeight Sprint #79 WW3 fix. Tests two-line text wrapping. |
| Pixel 7 or 8 | Android 14+ | 412×915 dp | Reference Android. Tests hardware back button TT1 bridge + native sheets + Material You theming behavior. |

### Tier 2 (should-pass)

| Device | OS | Viewport | Why |
|---|---|---|---|
| iPhone 16 Pro Max | iOS 18+ | 440×956 @3x | Newest device class. Tests Sprint #71 MM3 splash for that device. |
| Samsung Galaxy A-series (mid-range Android, Snapdragon 695-class) | Android 12-13 | varies | Most common Android phone in EU. Tests perf floor — animations should stay 60fps. |
| Borrowed older iPhone (iPhone X / 11 if available) | iOS 16+ | 375×812 / 414×896 | Validates Sprint #67 iOS 14.x fallbacks weren't a regression on 16-17. |

### Tier 3 (opportunistic)

| Device | OS | Viewport | Why |
|---|---|---|---|
| iPad mini | iPadOS 17+ | 744×1133 | Detects tablet-layout regressions. App is iPhone-first; iPad falls through to scaled iPhone layout — verify it's not broken. |
| Android tablet | Android 13+ | varies | Same — validate the iPhone-shaped layout doesn't break on tablet aspect. |

---

## Per-device smoke checklist (run on EVERY tier 1 device)

10-step matrix. Each step has a pass/fail and a sub-note for what to capture if failing.

### 1. Cold launch performance
- **Action:** Force-quit app, wait 30s, tap icon
- **Expected:** Native splash → in-app splash → Home in <2s on Tier 1, <3s on Tier 2
- **Capture if fail:** Sentry trace if available; time-to-Home with stopwatch
- **Why it matters:** First impression. Sprint #71 MM3 splash work is verified here.

### 2. Classic quiz end-to-end
- **Action:** Home → tap Classic → pick Medium → answer 10 questions (mix correct/wrong) → see results
- **Expected:** Smooth question transitions, haptic on each answer (NEW for iOS via Sprint #80 touch-point 8), sound effects play (if sound enabled in settings), results screen shows score + streak
- **Capture if fail:** Which question index, which input (option tap / typed), screenshot
- **Why:** Core game loop. Haptics on iPhone is the touch-point 8 quality win.

### 3. Daily 7 completion
- **Action:** Daily tab → tap Daily 7 (if not done today) → answer all 7 → see Daily countdown
- **Expected:** Score persists, KO countdown shows time to LOCAL midnight (Sprint #70 LL6 fix), Matchday row updates to today's score (Sprint #71 MM2)
- **Capture if fail:** Whether score saved (check Daily tab on cold relaunch)

### 4. Footle full round + native share
- **Action:** Footle from Daily tab → guess until win (e.g., MESSI) → tap Share → confirm native iOS share sheet appears
- **Expected:** Native share sheet (iOS) / chooser (Android) with text containing emoji grid; first-name reveal renders correctly (Sprint #81 YY2 once shipped)
- **Capture if fail:** Whether share menu was native or fallback to clipboard

### 5. Multiplayer create + join (CRITICAL)
- **Action:** Device A: sign in → Play with Friends → Online Multiplayer → Create Room → screenshot 6-character code. Device B (or simulator on same machine, different account): sign in → Join with Code → enter code → assert both devices show each other in lobby
- **Expected:** Both devices see lobby. Start Game. Question appears on both at the same time. Submit answers. Score advances.
- **Capture if fail:** Network traces if possible, Sentry breadcrumb dump, screenshot of the lobby state
- **Why:** Highest-risk flow. Sprint #75 QQ6 audited multiplayer code; this is the real-device verification.

### 6. Hardware back button → modal close
- **Action:** Open Settings → tap "Sign out" → modal appears → press iOS swipe-back / Android system back
- **Expected:** Modal closes; user remains on Settings; app does NOT exit
- **Capture if fail:** Whether app exited, whether modal stayed, screenshot
- **Why:** Sprint #78 TT1 web-popstate + Sprint #80 touch-point 10 native-back bridge. CRITICAL on Android (most-used native UX pattern).

### 7. Deep-link from external app
- **Action:** From iMessage / SMS / WhatsApp, send yourself `https://balliq.app/join/ABCDEF`. Tap it.
- **Expected:** iOS prompts to open in Ball IQ app (or opens directly if Universal Links work); Android opens directly via App Link verification. Land in online lobby with code pre-filled.
- **Capture if fail:** Whether it opened in browser instead, whether the code was preserved
- **Why:** Universal Links + App Links are Phase 2 touch-point 7 work. Verifies it.

### 8. Theme switch
- **Action:** Settings → Theme → Light. Confirm status bar (top of screen, time/battery) inverts. Switch back to Dark.
- **Expected:** Status bar colors flip to match theme (StatusBar plugin from touch-point 9)
- **Capture if fail:** Whether status bar stayed dark on light theme (unreadable system clock)

### 9. iOS silent-mode sound behavior
- **Action:** During a Classic quiz, flip the iPhone silent-mode switch
- **Expected:** Sound effects stop firing (matches Sprint #80 touch-point 12 decision to accept iOS default)
- **Capture if fail:** Whether sounds kept playing when phone was on silent (would be unexpected from iOS user)
- **Why:** Confirms touch-point 12 decision works as expected.

### 10. Background → resume mid-game
- **Action:** Mid-Classic quiz (answered 3 of 10), swipe to home screen, wait 30s, return to app
- **Expected:** App resumes at same question, score intact, timer continues from where it left off (NOT reset). For Daily / Footle: state persists via localStorage (existing behavior).
- **Capture if fail:** Whether the game restarted, whether localStorage was preserved

---

## Multiplayer extended scenarios (Tier 1 multiplayer test pair)

Beyond the basic create+join in step 5, run these on Device A (iPhone) + Device B (Android) for cross-platform parity:

### M1: WiFi drop mid-game
- Start a multiplayer game on both devices
- Toggle WiFi off on Device A for 10s, then back on
- **Expected:** Device A's UI shows a brief reconnecting state; reconnect catches up via `refetchInitialState` (Sprint #75 QQ6 code). Game continues. Score state preserved.
- **Capture if fail:** Whether Device A got stuck, whether Device B advanced without A

### M2: Background mid-game
- Start a multiplayer game on both devices
- Device A: lock screen for 30s
- **Expected:** Channel may close while backgrounded (iOS suspends sockets). On return, channel resubscribes + refetches state. Game state is correct. Worst case: Device A sees a "you missed N questions" advance.
- **Capture if fail:** Whether Device A's game is unrecoverable

### M3: Quit + relaunch in same room
- Start a multiplayer game on both devices
- Device A: force-quit the app
- Within 30s, relaunch
- **Expected:** Device A lands back on Home (multiplayer rooms don't persist across cold-restart by design — confirmed in Sprint #75 QQ3). Device B's lobby shows Device A as left.
- **Capture if fail:** Crash on relaunch, or ghost state

### M4: Both devices submit answer simultaneously
- Mid-game, both Device A and Device B tap an answer within 100ms
- **Expected:** Both answers recorded. Submit_answer RPC's retry layer (multiplayerRpc.js RETRY_CONFIG) handles any race. Scores update on both clients.
- **Capture if fail:** One device's answer dropped, or scores diverge

---

## Touch-point-specific verification

These map back to Sprint #80 plan's 12 native-context touch-points. Run once per device after Capacitor build is on-device.

| # | Touch-point | Verification | Pass criteria |
|---|---|---|---|
| 1 | PWA install affordances hidden | Look at Settings + Home + Daily tab; no "Install Ball IQ" banner anywhere | Zero install-prompt UI visible |
| 2 | Desktop landing chrome hidden | Use Capacitor WebView at "tablet" size if possible | No .landing-top / .landing-bottom rendered |
| 3 | navigator.share routes to native sheet | Step 4 above | Native sheet, not web fallback |
| 4 | Service worker NOT registered | Chrome DevTools → Application → Service Workers (Android) / Safari Web Inspector → Console (iOS) | `serviceWorker.controller === null` |
| 5 | Splash handoff is clean | Step 1 above | No double-flash; native splash → in-app splash transition smooth |
| 6 | App icons + manifest | Check home screen icon + iOS Settings → Ball IQ | Icon matches our design, no default Capacitor icon |
| 7 | Deep links | Step 7 above | Universal Link verified, app opens directly |
| 8 | Haptics fire | Step 2 above | Tactile feedback on every answer + streak |
| 9 | Status bar theme | Step 8 above | Bar inverts on theme switch |
| 10 | Hardware back | Step 6 above | Modal closes, app doesn't exit |
| 11 | Sentry native crash | Force a JS error via Safari Web Inspector → check Sentry dashboard within 60s | Event appears in Sentry with `boundary: app-root` tag |
| 12 | Web Audio + silent mode | Step 9 above | Sound mutes when silent switch flipped |

---

## Pre-submission gate

Before tapping "Submit for Review" in App Store Connect / "Send to production" in Play Console:

1. ☐ Tier 1 device matrix complete (3 devices × 10-step checklist = 30 passes)
2. ☐ Tier 1 multiplayer extended scenarios M1-M4 passed on iOS+Android pair
3. ☐ All 12 touch-point verifications passed on iPhone 14 Pro (reference device)
4. ☐ Sentry shows no new critical-tier errors from beta testing
5. ☐ Store listing screenshots captured at correct sizes (5 per device class)
6. ☐ Privacy nutrition label / Data Safety form matches actual Sentry + Supabase data flow
7. ☐ Demo account credentials in App Review notes are working
8. ☐ Latest commit on `main` matches the Capacitor build (no diverged state)
9. ☐ Production build numbers incremented (iOS build, Android versionCode)
10. ☐ Sentry release tag uploaded (Sprint #73 OO5 sourcemap pipeline)

---

## What to do when something fails

| Failure category | Action |
|---|---|
| Cosmetic on a single device | File in Linear, add to v1.0.1 backlog, ship v1.0 if other tier 1 devices pass |
| Functional on tier 1 device | Block submission until fixed |
| Functional on tier 2 device | Best-effort fix; submit only if reproducible AND we have a workaround |
| Multiplayer race / network bug | Block submission. Multiplayer is differentiated functionality for App Store Guideline 4.7 — broken multiplayer = rejection risk. |
| Crash on cold launch | Block. Period. |
| Crash mid-game | Block. |
| Sentry-only diagnostic (user couldn't repro) | Investigate, but don't block on it unless rate >0.5% of sessions |

---

This playbook is locked unless Alex requests changes. Used as the
checklist during Phase 5 (Day 8-12 of post-approval timeline).
