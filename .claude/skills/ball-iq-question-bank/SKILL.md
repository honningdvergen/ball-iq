---
name: ball-iq-question-bank
description: Work on the Ball IQ question bank — adding, editing, fact-checking or triaging questions in src/questions.js, running the question forge, or handling flagged/reported questions. Use before any bulk edit to the bank, and before touching the Footle player list, which has a retroactive-rewrite trap.
---

# The question bank

`src/questions.js` holds ~4030 questions and is the product's content moat. It is also a **data file with 186 commits** — the most-churned file in the repo after App.jsx. Bank integrity is sacred: a bad edit ships wrong answers to real players and lands in the App Store.

## Traps that have already cost work

**1. `flag: true` markers are unclearable by design.**
`scripts/publish-review.mjs` only ever **adds** the flag field, never removes it. Prod's `question_review` table says 0 flagged; the shipped `src/questions.js` says **412**. A triage agent reading the file will faithfully re-open 412 questions already verified as false alarms. Before any triage run: reconcile the file against `question_review` in prod, and fix the publish step to clear resolved flags rather than accumulate them.

**2. The Footle schedule is retroactive.**
`src/lib/wordle.js` picks the daily answer from `WORDLE_PLAYERS`. It used to be a modulo over the list length — so **appending one player silently rewrote every past and future answer**, including the publicly indexed archive `api/footle.js` serves. It is now pinned to a frozen `WORDLE_ANSWER_LOG` (day #1 = 2026-05-04), modulo only as a fallback beyond the horizon. **Extend the log deliberately when adding players; never assume append-is-safe.**

**3. Anything comparison-facing must be date-deterministic and engine-stable.**
The Daily 7 (`getDailyQsForDate`, App.jsx) feeds `/c/` challenge links, the "You beat X!" modal and an OG card — so selection must depend on the date and nothing else. Two things broke that, both easy to reintroduce:
- **Never consume `applySeenFilter`** in a comparison-facing selection — it reads device-local 14-day history, so two players diverge. Still *record* into it via `_histKey` (other modes read it).
- **Never seed a shuffle with `Math.sin`** or any implementation-approximated math. The spec permits engines to differ: 137/3000 values differ between JavaScriptCore (iOS/Safari) and V8 (Android/Chrome). Use `seededShuffle` — integer bitwise only, ToUint32 is spec-exact, verified bit-identical on both.

## Standards

- **Hints:** the SEO generator throws rather than emit a page for any category/club with fewer than `MIN_HINTS` (15) hint-bearing MCQs. Adding a club without hints breaks the build, by design.
- **Fact-checking:** questions asserting recent events go stale. The bank has been triaged before (566 flagged → 418 false alarms, 35 real fixes, 113 stale rows rejected). Time-sensitive record facts are the usual offenders.
- **SEO prose is separate.** `scripts/seo/clubs.mjs` and `players.mjs` carry hand-written prose NOT covered by a `questions.js` triage — it went stale independently once, and it's live on indexed pages, so factual claims there are public.
- **Editorial calls are the user's.** Verify what you can; surface what needs a football judgment rather than guessing.

## Measurement caveat

`scores` records survival/daily/classic/wc2026/chaos/legends only — **Footle, Club Quiz and League Quiz write nothing to it**. Don't answer "what do people play?" from `scores` alone; Footle lives in `user_game_state.wordle_state` and is, by the 2026-07-15 numbers, the most-played mode.
