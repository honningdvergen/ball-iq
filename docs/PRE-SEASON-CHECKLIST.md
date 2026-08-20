# SCORECARD → A — the methodical pass (started 2026-08-20)

Alex: work each area of the scouting report to A/10-10, no deadline pressure,
specialized tools at every step. Full report: docs/review-panel-raw.json +
the published Scouting Report artifact. Weakest-first order.

| area | was | now working | shipped so far |
|---|---|---|---|
| Retention reach | 5/C | ◀ ACTIVE | web-push ask at the post-solve moment (`1ad33b4`) — the live engine had ZERO subscribers because only Settings asked. Remaining: streak-aware reminder body · widget (structural) · FCM Android push |
| Store & ratings | 6/C | | ratings floor (`0cb0702`): Daily 7 unblocked from the ask, 24h bad-moment suppression. Remaining: Play feature graphic · localised Play listings · Alex asks the orbit |
| Social loops | 6/C | | — k-factor measurement first (a script over loop-hit logs), then challenge-token table |
| Competitive | 6/C | | — mostly downstream of widget/localisation/archive |
| Onboarding | 7/B | | — first_game_started event · taster→first-game chain · cold LCP |
| Gameplay feel | 7/B | | — juice batch: Mystery celebration, timeout dwell, completion chord, clean-sweep moment |
| Accessibility | 7/B | | — colour-blind Footle toggle · taster ✓/✗ glyphs · aria-live guess summary |
| Content moat | 8/B | | — 9 future-tense WC stems · season freshness wave · 155 hard-question hints |

⚠️ Verification note for the web-push ask: the sandboxed pane has notifications
HARD-DENIED, so only the negative branch is verifiable here (verified live:
signed-in, denied, completed a daily, no sheet — the never-re-ask gate held).
The positive branch needs a real browser at permission 'default': sign in, play
a daily to the results screen, the "Keep your streak alive" sheet should rise
~7s later. Whoever taps "Yes, remind me" becomes web-push subscriber #1 and the
hourly cron takes it from there.

---

# Pre-season polish checklist — deadline FRIDAY 21 AUG 2026

Season starts in days and the product gets promoted. Everything below must be
**spotless**, and "spotless" means *exercised*, not *read*.

## The standard

⚠️ **A tick here means I drove it and watched it work.** Reading the code does
not count. Every real defect found this week came from playing the product or
from behavioural data — never from a code audit:

| how it was found | defects |
|---|---|
| Playing it | timeout said "✓ Correct!"; timed-out questions missing from review; **"5,000+ quiz questions" in the app** |
| Clarity behavioural data | **double-tap on Next skipped a question** (633 dead clicks) |
| A player | Van Persie twice in a week; Kane free point |
| Code audit | *(nothing)* |

⚠️ **Two gates were themselves blind this week.** The no-counts gate never
scanned the app, and its English pattern let one unlisted word through. Both
now fire, both proven by re-introducing the defect. **When a check passes,
ask what it would have missed.**

Lighthouse and the performance trace both came back **clean** while a
question-skipping bug was live. Synthetic checks confirm; they do not discover.

---

## A. GAME MODES — play each to completion, on a phone viewport

| mode | played end-to-end | notes |
|---|---|---|
| Classic | ✅ 19 Aug | 2 defects found + fixed (`a4f78df`, `f0b278b`) |
| Daily 7 | ✅ 19 Aug | full run, score + XP + review reconcile |
| Survival | ✅ 17 Aug | death screen rebuilt (`ce2d7af`) |
| Footle | ✅ 19 Aug | played to a WIN. Grading correct (green/amber/grey + keyboard state). Found disguise #8 of the question count on the win screen (`4ef1a64`). ⬜ still owed: a LOSS (6 wrong guesses) |
| Transfer Trail | ✅ 19 Aug | SOLVED (2 guesses), FAILED (5 guesses, via archive), archive replay works. Found + fixed archive-inappropriate copy (`37fc2a4`) |
| Mystery Player | ✅ 19 Aug | GIVE-UP played end-to-end: unlocks at exactly 5 guesses, clean reveal, no unverifiable claims. Ranking sane. ⬜ still owed: a SOLVE (use an archive day) |
| Club Quiz | ⬜ | the #1 SEO landing surface — never played in-app |
| League Quiz | ⬜ | |
| True/False | ⬜ | separate render path (`TrueFalseScreen`) |
| Speed / Legends / Chaos | ⬜ | share QuizEngine; the double-tap guard covers them |
| Online MP | ✅ | confirmed working by Alex, 19 Aug |
| Local pass & play | ⬜ | single device, testable here |

## B. THE STATES INSIDE EACH MODE — not the screens

- ⬜ every mode's **empty** state (no history, first ever play)
- ⬜ every mode's **completed-today** state (replay/blocked/archive)
- ⬜ every mode's **loss/failure** state — historically the least-polished
- ⬜ **offline**: airplane mode mid-quiz, and cold-boot offline
  ⚠️ boot-path awaits need a TIMER not a `.catch()` — has hung the splash before
- ⬜ **interrupted**: backgrounded mid-question, returned after the timer expired

## C. WEB SURFACES

- ✅ club page technical (Lighthouse 100/100/100/100, English + localised)
- ✅ "100% explained" claim true (3,197/3,197) and gated so it cannot lie
- ⬜ **`/quiz/premier-league/` — 16 dead clicks in 4 sessions**, the worst
  dead-click rate in the product. Find what is being tapped.
- ⬜ "Skip ahead" — 119 dead clicks
- ⬜ Footle keyboard keys (⌫ 361, ENTER 160, A 156): confirm these are Clarity
  mis-scoring a custom keyboard and NOT a real input failure
- ⬜ homepage as a first-time visitor, phone viewport
- ⬜ `/lists` pages — 47% of impressions, 4% of clicks
- ⬜ one localised page per language, read for register and broken furniture

## D. CROSS-CUTTING

- ⬜ **accessibility** — contrast, focus order, touch targets, screen-reader
  labels on the quiz controls
- ⬜ **native parity** — anything web-only that ships in the binary
- ✅ all four daily schedules frozen; 0 leaked pairs in 400 logged days
- ✅ bundle: 2.2 MB bank prefetched during idle, TTFQ 1,674 ms (not blocking)
- ⬜ data cost on mobile: ~1.3 MB gzip of lazy chunks — acceptable for BR/ID?

## E. STORE — the promotion surface

- ✅ Play screenshots framed + reordered (hook → identity → habit)
- ✅ 1.6.1 release notes, 15 locales
- ✅ Arabic listing strengthened (still wants a native read)
- ⬜ **iOS screenshots** — are the live ones current? 1.6.0 just approved
- ⬜ App Store listing text vs the app as it is today
- ⬜ ⚠️ any store copy asserting something now false (counts, mode lists)

## F. DATA INTEGRITY

- ✅ 0 duplicate stems, 0 duplicate options, 0 blank options
- ✅ era targeting fine; difficulty mix sane
- ⬜ **the 27 question issues awaiting Alex's editorial call**
- ⬜ trail careers re-verified against transfer windows (`verify-trail-careers`)
- ⬜ Mystery photo quality spot-check
- ✅ **Mystery pool `club` data is CURRENT** — spot-checked Salah→Trabzonspor
  against the news (he signed 6 Aug 2026). ⚠️ I nearly filed this as a data bug
  from stale knowledge; the web-search plugin corrected me. **297 players have a
  stale `country` field, but `league country` was deliberately dropped from the
  ranking as "actively misleading" — so it is dead data with zero gameplay
  impact.** Do not re-open it.

## G. BACKEND

- ⬜ RLS/grants unchanged since the snapshot (`anon` holds zero table grants)
- ⬜ Apple client secret expiry 2026-12-10 — not urgent, but confirm
- ⬜ backups confirmed running on Pro

---

## Order of work (2 days)

1. **Finish playing every mode** (A) — highest historical yield, by far
2. **Chase the remaining dead-click signals** (C) — Clarity found the best bug
3. **The loss/failure and offline states** (B) — least-polished by nature
4. **a11y sweep** (D) — cheap with the right tooling, and promotion means scrutiny
5. **Store surfaces** (E) — the thing people see BEFORE they install

⬜ = not yet exercised · ✅ = driven and watched
