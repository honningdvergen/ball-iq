# Pre-season polish checklist — deadline FRIDAY 21 AUG 2026

Season starts in days and the product gets promoted. Everything below must be
**spotless**, and "spotless" means *exercised*, not *read*.

## The standard

⚠️ **A tick here means I drove it and watched it work.** Reading the code does
not count. Every real defect found this week came from playing the product or
from behavioural data — never from a code audit:

| how it was found | defects |
|---|---|
| Playing it | timeout said "✓ Correct!"; timed-out questions missing from review |
| Clarity behavioural data | **double-tap on Next skipped a question** (633 dead clicks) |
| A player | Van Persie twice in a week; Kane free point |
| Code audit | *(nothing)* |

Lighthouse and the performance trace both came back **clean** while a
question-skipping bug was live. Synthetic checks confirm; they do not discover.

---

## A. GAME MODES — play each to completion, on a phone viewport

| mode | played end-to-end | notes |
|---|---|---|
| Classic | ✅ 19 Aug | 2 defects found + fixed (`a4f78df`, `f0b278b`) |
| Daily 7 | ✅ 19 Aug | full run, score + XP + review reconcile |
| Survival | ✅ 17 Aug | death screen rebuilt (`ce2d7af`) |
| Footle | ⬜ | typed a guess only — never played to a WIN or a LOSS |
| Transfer Trail | ⬜ | opened only; never solved, never failed all 5 |
| Mystery Player | ⬜ | guessed 3; never solved, never used give-up |
| Club Quiz | ⬜ | the #1 SEO landing surface — never played in-app |
| League Quiz | ⬜ | |
| True/False | ⬜ | separate render path (`TrueFalseScreen`) |
| Speed / Legends / Chaos | ⬜ | share QuizEngine; the double-tap guard covers them |
| Online MP | ⬜ | ⚠️ needs 2 devices — **Alex only** |
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
