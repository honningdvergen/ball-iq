# Ball IQ — senior app review (play-through), 2026-09-06

**Method.** Prod PWA at 375×812 in a browser with console + network open, cross-checked natively on an iPhone 17 Pro simulator. Played: Footle, Daily 7 (to results, both surfaces), Classic (to results), Survival, Club quiz, Stadiums, League list, Online (guest), Local multiplayer setup, Profile, Settings, join-by-code with a bad code. Console was clean on every screen. Running notes + screenshots: `NOTES.md` in this folder.

**Verdict.** The core loop is now in good shape: the four dailies, the results panel, the home. What separates it from a top-of-class app today is (1) three real bugs, (2) a handful of promises the app cannot keep, (3) one performance problem on the most-visited screen, and (4) an architecture that produces the same crash class every week. None is big; all are fixable in days.

## A. Bugs (fix first)

1. **P1 — Pending join re-prompts over a live quiz.** Type a wrong code, tap Join, do nothing: the "Join the game" modal comes back on every boot, including on top of a running quiz with the clock counting under it. `biq_pending_join` is re-armed without an in-game guard, an expiry, or validation. Fix: validate the room with one RPC before promising anything ("No room with that code"), never open while `inGame`, expire after 24h.
2. **P1 — Web shell chrome during a quiz.** On the web the tab strip (Play · Daily · Online · Profile · gear) and the search header stay visible and tappable during a quiz: a player can leave mid-round with no confirm, and ~110px of a 812px viewport is chrome while a clock runs. Native hides its bar in-game; the web must too.
3. **P2 — Sticky primary button covers the explanation.** After the last answer, "Results →" (and "Next →" on long questions) floats over the "Why?" box; the last explanation of a round is half-hidden. Reserve the button's height below the card or make the button part of the flow.
4. **P2 — Accidental reports.** "Report a problem" sits directly under the sticky Next button; I flagged a question twice by mis-tapping (one harness row now in `question_reports`). Move it into the card's overflow or require a second tap.

## B. Promises the app cannot keep (honesty)

5. **Settings** offers "Show Hints — first-letter hints on typed questions (Easy mode)" — the bank has had zero typed questions since 2026-05-07. "Timer … in Standard and Speed modes" names modes that do not exist on Home. "Sign up to unlock leaderboards and online play" — there is no leaderboard. And About shows `v1.1.0` (hardcoded) against 1.7.x store builds.
6. **The rating card fabricates precision.** After ONE Classic round with 1/10 the web Profile printed "57 · BRONZE", six league ratings 49–71 and "Strongest: Serie A · 71". Today's fix (answered questions required) is a floor; the model still prints a number from n=1. Gate each league on ≥10 answered in that league; print "—" and "Play 10 in the PL to unlock" until then.
7. **Era rule leaks into the shared daily.** Today's Daily 7 carried "Roma's first Scudetto … 1941-42" and "Torino co-founded by which Swiss businessman" (1906). The club packs have an era gate; the daily draw needs the same.

## C. Craft — where it still reads assembled

8. **Emoji as icons**, in clusters: results (+XP ⚡, 🔥 best streak), the report sheet (five reasons led by ❌🤔✏️🥱🧱), the join modal (⚡ Play as guest), the local-multiplayer setup (nine glyphs: ⚽🏆🎲⏱️⚡🔥🌱⚽🧠). Home, History, Online and the panel are Lucide now; these five screens are the last of the old idiom.
9. **Non-daily results = five stacked actions in three styles** (green filled, ghost, two green-outline, underlined text) + the wall the critique flagged on Home. One primary, one secondary, the rest as text — or reuse the panel's anatomy with "Play again" as the secondary. The missed-answers review under it is best-in-class; keep.
10. **Survival death on Q1** prints a 0 in 88px celebratory green. A first miss needs the soft landing ("Cruyff got you on question 1 — run it back?").
11. **Two account asks on one results screen.** The old guest save-line ("…on this phone only · Save · Later") renders above the panel in its own idiom; the panel already owns a Save row. One ask, in the panel.
12. **Difficulty pickers** still exist in Local multiplayer (with emoji) after Classic dropped its own today — same question, same answer.
13. **Bottom sheets vs centred boxes.** Quit is a sheet now; the join modal and the report sheet are still centred boxes with different paddings. One `Sheet` component.

## D. Performance (66% of sessions are mobile)

14. **Home loads ~1.7 MB of JS**: GameRoot 557 KB, `questions-index` 549 KB (fetched so Home can decide whether the topical tile exists), Supabase 211 KB, React 138 KB, main 123 KB, plus the Profile and Online screens the user is not on. Lazy the index behind first quiz start and the tab screens on first visit; set a budget (≤600 KB on Home) and check it in CI. A 30–40% cut is realistic without touching features.

## E. Architecture — why the same crash keeps happening

15. `App.jsx` is 14,027 lines with 19 lint escapes. Three times in one week a `const` was read above its declaration inside this file (today's countdown, the club-page engine last week, the services memo caught by its own guard), and each shipped past lint, 570 unit tests and the build gate, to be caught only by opening the screen. Two cheap guards: ESLint `no-use-before-define` (variables) scoped to App.jsx, and a 60-second Playwright smoke in the gate that boots Home → Classic → Q1, Home → Daily 7 → Q1, Home → Footle. The unit suite pins strings; nothing in the gate renders a screen.
16. Keep extracting screens out of App.jsx along the seam that already works (`services` objects): Results, the quiz engine, the Online hub, Settings. Each extraction removes a TDZ surface and makes a screen testable in isolation.

## F. Level-up list (what I would do next, in order)

1. Bugs A1–A4 (a day).
2. Settings honesty + version string; rating card gating; Daily 7 era gate (a day).
3. Web in-game chrome-less mode (half a day).
4. Emoji → Lucide on the five remaining screens; results non-daily on one anatomy; Survival soft landing; one save ask (a day).
5. Home JS budget: lazy index + lazy tabs (a day).
6. `no-use-before-define` + Playwright smoke in the gate (half a day).
7. Then measure: D1→D2 return, reachable%, share taps per finish, `daily_results` n per puzzle.

Everything above is grounded in a screenshot in this folder or a line in `NOTES.md`.
