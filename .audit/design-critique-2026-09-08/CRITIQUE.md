# Design critique — played in the iOS Simulator, 2026-09-08

Build: `App.app` from 22:08, HEAD 67fc055 (22:11). iPhone 17 Pro, fresh install (app terminated + uninstalled first), stayed a guest throughout. Every claim below has a screenshot in `shots/`; anything I could not capture is in section 4, not in the findings.

Flow played: onboarding taster → (the app hands an answered taster straight to Footle) → Footle, solved in 3 → Daily 7, all seven, 6/7 → Home → Arsenal club quiz, 3 questions, quit → Club Quizzes list → Online → History → Profile → Home → Daily review → Footle review → Footle help.

## 1. Verdict

**The biggest retention lever I saw is the finish screen's silence about progress it already tracks.** In one session a guest went from "Sunday League · 48 XP" (shot 08) to "Non-League · 108 XP" (shot 21) — a promotion — and nothing on either finish screen said so, nor said what the next rung is. The whole ladder ("192 XP to go" to Championship, shot 35/37) exists, but only three screens deep on Profile. The moment the app is best at (the finish) does not use the one mechanic it has for "come back tomorrow" beyond the streak line.

**Two things that are already excellent:** (1) The DailyDone finish panel itself — streak → tomorrow's stake → the other three puzzles still open → share → honest "on this phone only" (shots 08, 20–21). Order, copy and restraint are right; a first-timer is never asked to sign up before they have something worth saving. (2) The onboarding hand-off: one real question, "Nice — you're a natural", and "Let's play" drops you into a live Footle board with a colour legend and nothing else (shots 01–03). No menu, no tour. It is the best first minute I have seen in a quiz app.

## 2. Findings, ranked by expected retention impact

### F1 — A rank promotion happened and no screen marked it
- **Moment:** Footle finish said `Sunday League · 48 XP — on this phone only` (shot 08). Daily 7 finish said `Non-League · 108 XP — on this phone only` (shot 21). Non-League starts at 100 XP (`src/lib/scoring.js:55`).
- **First-timer experience:** the label quietly changed between two screens they were not comparing. "Non-League" as a word reads like a demotion to an English fan unless the ladder is visible.
- **Why it costs a return visit:** the ladder (shot 35) is the one long-horizon hook the guest has, and it is invisible from the finish screen. The next rung ("192 XP to go") is exactly the sentence that answers "why come back tomorrow" — and it is 3 screens away.
- **Code:** `App.jsx` `awardXp` has a full-screen `levelUpOverlay` (App.jsx:6748–6760, 3.5 s). My captures 1.0 s after the last Daily 7 answer (shot 19) and 2.5 s after tapping Results (shot 20) both show no overlay. I cannot prove it never fired (see section 4), but even if it did, a 3.5 s modal leaves no trace on the finish screen a player reads for a minute.
- **Change:** in the DailyDone save row, replace `Non-League · 108 XP — on this phone only.` with `Non-League · 108 XP · 192 to Championship — on this phone only.` (`save.line` at App.jsx:~6610 already calls `getLevelInfo(xp)`, which returns `{ level, nextLevel, progress }` — `scoring.js` — so the delta is `nextLevel.xpNeeded - xp` with no new data). On a promotion day, prefix the row with a one-line `Promoted to Non-League` in the amber streak colour, persistent, not a modal.
- **Measure:** `dd-view` already carries `remind`; add `tier`, `promoted:1|0`, `xpToNext`. Read `dd-view{promoted:1}` → D1→D2 return vs `promoted:0`.
- **Confidence:** 0.75

### F2 — The "Why?" explanation is clipped under the sticky footer on every 4-line question
- **Moment:** Daily 7 Q2 (shot 12), club quiz Q1/Q2/Q3 (shots 25, 27, 29). The last line of the explanation sits under the gradient and under "Report a problem" ("Scudetto ahead of city rivals Milan." / "comebacks." / "following season's Double." are half-hidden).
- **First-timer experience:** they read two lines, see text fade into a button, and press Next. The explanation is the product's stated differentiator (QuizEngine.jsx comment at ~858: "the one thing that earns a return visit").
- **Root cause (source-level):** `QuizEngine.jsx:363` scrolls by `CTA_INSET = 96` "sticky Next button + its margin". The footer grew on 2026-09-07 (A4) when the report link moved inside `.q-sticky-foot`: 22 px top padding + report row + 10 px gap + 54 px Next + `max(14px, safe-area)` ≈ 160 px on this device. The constant was never updated, so the shortest-scroll computation stops ~60–70 px short.
- **Change:** measure instead of assuming — `const foot = document.querySelector('.q-sticky-foot'); const inset = foot ? foot.getBoundingClientRect().height : 96;`. Verify on a 4-line question with a 3-line hint (Daily 7 Q2 today is one).
- **Measure:** none needed; it is a geometry defect. Gate it: the e2e daily-play helper can assert `whyRef.bottom <= footTop` after answer.
- **Confidence:** 0.95

### F3 — History is empty right after playing: "Today counts from tomorrow"
- **Moment:** shot 33. After Footle 3/6 and Daily 7 6/7, the History tab shows a 1-day streak strip and a card saying "Today counts from tomorrow — come back and this fills up." 70 % of the screen is blank.
- **First-timer experience:** the tab called History has no history of the two things they just did. The copy is honest about a design decision (today is excluded from Recent days, DailyScreen.jsx:775 comment) but it reads as a hedge for a missing state.
- **Why it costs a return visit:** History is the screen that should prove "you did something today, tomorrow adds a row". Showing today's row (Footle 3, Daily 7 6/7, Trail —, Mystery —) makes tomorrow's row an obvious next square; an empty card makes the tab feel dead on day 1, and day 1 is the day most players see it.
- **Change:** include today as the first row of Recent days with a `Today` label and its live results; drop the "counts from tomorrow" copy. Keep the desktop rule if it exists there for a reason, but mobile is where everyone is (the file's own comment).
- **Measure:** `history-view` with `rows:0|n` and `playedToday`; compare D1→D2 for players who opened History on day 1.
- **Confidence:** 0.7

### F4 — "How everyone did" never appeared on either finish
- **Moment:** shots 08 and 20–21. No distribution block under Share on Footle or Daily 7.
- **Code:** `DailyDone.jsx:206` renders it only when `summary` is non-null, i.e. `n >= MIN_N` (20, `dailyResults.js:17`). Native records rows without `visitor_id`; today's editions evidently had fewer than 20 results at 22:30 Oslo, or the fetch returned null.
- **First-timer experience:** "Brilliant!" and "Excellent!" are the app talking to itself. The strongest tomorrow-hook in Wordle-class games is "you beat 62 %"; the panel has the code for it and the guest saw none of it on the app's busiest daily.
- **Change (measurement first):** log `dd-view{dist:n}` and read the fraction of finishes shown a distribution per game per day. If most finishes land below n=20 in a 24-hour window, either (a) show the honest small-n version ("12 played so far · average 4.9/7", no percentiles) at n ≥ 5, or (b) pool across the day's editions on the website + app, which already write to the same table. Do not fabricate; the App Store 2.3 note in the file stands.
- **Confidence:** 0.6 (the gate may be correct and the day simply thin — the read will tell)

### F5 — Profile "Accuracy 100 %" contradicts the 6/7 the same guest just saw
- **Moment:** shot 38 shows `Accuracy 100%` under Scouting Report; shot 20 shows 6 correct out of 7 an hour earlier. Also "3 MORE TO GET RATED" (shot 34) with no noun.
- **First-timer experience:** a card that says 100 % after a miss is a card they stop trusting; "3 more" of what (answers) is a guess.
- **Code:** `ProfileScreen.jsx:1800` computes `totalCorrect/totalAnswered` from `stats`; `App.jsx:6014–6017` adds `newResult.score` and `newResult.total` on quiz completion. Something else fed `totalCorrect` — likely the onboarding taster or Footle counted as 1/1 before the Daily 7 landed, or the Daily 7 path writes `total` without `score`. Grep the writers of `totalCorrect` before assuming.
- **Change:** fix the arithmetic; change the card line to `ANSWER 3 MORE TO GET RATED` (the card already says `ANSWER 10 TO GET RATED` at zero, BallIqCardFace.jsx:119).
- **Confidence:** 0.8 that it is false; 0.5 on cause

### F6 — Club quiz starts a 15-second clock before a first-timer knows it is timed
- **Moment:** shot 24 — Q1 is on screen with the bar already at ~65 % and "10s" showing. Shot 25 — "Time's up" with the answer revealed; the panel counted it against me ("0 right from 2 answered", shot 30).
- **First-timer experience:** the dailies they just played had no clock (shots 09–19). The first club quiz question expires while they are reading it. Nothing on Home ("Arsenal" chip) or on entry says timed.
- **Why it costs a return visit:** the club page is the product for search traffic (memory: club pages carry the site). A first question lost to a rule you were not told is a reason to leave, not to return.
- **Change:** either a 1-second pre-roll ("15 s a question") on Q1 of a timed mode, or start the clock on first scroll/touch of Q1. Put `15s a question` in the club chip's subline on the Club Quizzes list (shot 31 has room).
- **Measure:** `quiz-q1-timeout` rate for players with `gamesPlayed <= 2`.
- **Confidence:** 0.65

### F7 — Two green pills after the taster: "Skip" and "Let's play" now do different things but look like a choice
- **Moment:** shot 02. After answering, the footer still shows `Skip` and `Let's play`. Per OnboardingScreen.jsx:124–150, Skip → Home, primary → Footle.
- **First-timer experience:** having just answered, "Skip" is a null word — skip what? Some will tap it out of caution and land on the 14-choice menu the comment says kills momentum.
- **Change:** once answered, relabel Skip to `Look around first` (it is what it does), or hide it. Cheap, and it makes the two exits honest.
- **Measure:** `onboard-done-answered` split by exit (`start` vs `skip`) → first-play rate.
- **Confidence:** 0.55

### F8 — Quitting a club quiz lands on the catalogue, not where you came from
- **Moment:** shot 31. Entered from the Home "Arsenal" chip (shot 22); Quit (shot 30) → Club Quizzes list without the tab bar.
- **First-timer experience:** mild disorientation; the tab bar is gone, the back arrow is the only way out. CTA-parity class of bug (memory: does your button do what the ✕ does).
- **Change:** Quit returns to the screen that launched the quiz.
- **Confidence:** 0.5

### F9 — The Footle review re-prints "+48 XP" as if earned again
- **Moment:** shot 42 (Review from Home) shows the same `+48 XP` line as the live finish (shot 07).
- **Change:** in review mode, render `48 XP earned` (past tense, no plus) or omit.
- **Confidence:** 0.5 (small, but it is the kind of false note the copy rule forbids)

## 3. Checked and found fine
- Onboarding taster: correct/incorrect state, "Nice — you're a natural", one primary (shots 01–02).
- Footle: keys register, absent letters dim on the keyboard, present-in-place letters go green, legend disappears once graded, help sheet is complete and short (shots 04–07, 43). Solved-board review is one tap from Home (shot 42).
- Footle NEXT countdown 01:29:58 at 22:30 Oslo = local midnight; History's "New puzzles in 1h 19m" agrees (shots 07, 33).
- Daily 7: progress pips colour per answer, correct/wrong states, "Why?" present on every answer, `Results →` on the last, finish screen reviews the missed answer with its explanation and a report link (shots 10, 14, 19–21).
- Home done/not-done: done rows say `Solved in 3` / `Done · 6/7` with a quiet `Review`; open rows keep their mode tint and `Play`; header `2/4 today ›` counts correctly and opens History (shots 22, 41). Per-mode Play tint is Alex's own 2026-09-06 call (`b006b1d`), not a regression.
- Streak count is consistent across Home pill, both finish panels, History and Profile (1 everywhere).
- Leave-quiz guard is honest and specific: "0 right from 2 answered — that's lost if you quit" (shot 30).
- Online tab for a guest is the settled pitch: one green CTA, "No account needed" section with code entry and Local pass & play (shot 32).
- Profile: ladder with "YOU ARE HERE" / "192 XP TO GO", 1/12 badges, "Saved on this phone only → Sign in" row (shots 34–38).
- Scroll-aware tab bar hides on Profile scroll and returns on an upward flick (shots 35 → 38); Home is too short to trigger it, as designed.
- No question-bank count printed anywhere I looked ("Search 96 clubs" is a club count).

## 4. Could not judge in a simulator
- Haptics and the level-up sound (`haptic("levelup")`, `playSound("levelup")`) — no way to feel or hear them; F1's "no visible trace" stands regardless.
- Whether the 3.5 s level-up overlay actually fired: my two captures bracket the likely windows and show nothing, but a modal that short can fall between screenshots. Add a `levelup-shown` event before trusting either reading.
- "Remind me": did not tap (it requests notification permission against prod). Cannot judge the permission-prompt moment or what a guest sees after.
- Share sheet, Stump a mate, Save → sign-in, Report a problem: not tapped (prod side effects).
- Real thumb reach on the ENTER bar and the bottom-anchored "Back to Home" link; synthetic taps do not tell you what a thumb misses.
- Slow human-paced drag vs text selection (memory: never fight the finger) — the simulator swipe is a flick.
- Confetti timing and any first-paint jank — screenshots are static.
