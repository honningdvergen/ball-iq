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

## ZERO ERROR — the standing bar for generating questions

Alex, firm, 2026-07-16: *"we will use whatever time, resources and agents we need to meet that ZERO ERROR bar. Let us not rush the clubs if it just leads to audits later. Get it right the first time."*

This governs **how** new questions are generated (club expansion, forge runs, any bulk add):

- **Verify INLINE, never generate-fast-audit-later.** Each question goes generate → examiner → skeptic → adversarial fact-check, and **only survivors get committed.** The alternative — dump auto-generated questions in, audit afterwards — is exactly what produced the 412 flagged rows. Do not repeat it.
- **`a` is an INDEX into `o`, not the answer.** Off-by-one produces a fluent, confident, wrong answer. Resolve `o[a]` and verify the *resolved string*, not the index. Real trap: `q_0b5f8f` has `o:["1","2","3","0"], a:3` → answer is `"0"`, but `o[2]` is the string `"3"`, so a misread yields "3".
- **The verifier must be more conservative than the generator.** A false "this is wrong" that flips a *correct* answer is worse than a false negative. When a fact is genuinely contested or unverifiable, omit the question rather than ship a guess.
- **Slower is correct.** Whatever agent count inline verification costs, spend it. Never trade the bar for speed. No club/batch ships until its questions are verified true — 25k football obsessives read these under the app's name, and wrong answers land in the App Store.
- **Do NOT prioritise thin-history subjects** for volume (Saudi/US/expansion clubs founded post-2000): shallow genuine trivia forces the generator toward padding, which is where fabrication creeps in. History-rich subjects have real facts to draw on. See [[project_club_expansion]].
- **Stop adding pre-1950 questions** (Alex, 2026-07-28: *"nobody on app or web really cares about ancient football facts… at least do not add more, we have to think about the demographic we are serving"*). The bank already holds **424** questions referencing a pre-1950 year, which is enough for Legends/History colour. Do not remove the existing ones — they carry the deep-history categories and they are the basis of a real finding (the decade-distribution data study, `scripts/bank-insights.mjs`). Just do not generate more. New waves should sit **1990 onward**, where the bank is already concentrated and the audience actually is: 1990s 805 · 2000s 966 · 2010s 1,359 · 2020s 1,034, against 424 for everything before 1950.
  ⚠️ This sits in tension with the "favour SETTLED historical fact over the last 12 months" rule above — recent claims go stale. **The sweet spot is roughly 1990–2020**: modern enough that the demographic cares, settled enough that it will not need re-triaging next season.

## The two defects the forge does NOT catch (measured 2026-07-27)

The full-bank audit web-verified all 211 serious flags. Only 5% were false
positives — the screener was right, and these two classes were what it found.
**Both pass every answer-key check, which is why they shipped.**

1. **A FALSE PREMISE IN THE STEM, with the key correct.** 66 of 89 applied
   corrections were this. The question asks the right thing and the keyed
   answer is right — the *stem asserts something untrue on the way there*:
   - "the only side to go unbeaten in the modern format" (Arsenal did it too)
   - "the first German honoured since Beckenbauer" (Rummenigge '80/'81 and
     Matthäus '90 came in between — Sammer was the first German DEFENDER)
   - "before joining PSG that year" (he had joined four months earlier)
   - "only the second time Bayern hadn't won it in a decade" (it was six)
   **The examiner must fact-check every claim the stem MAKES, not just the
   answer it asks for.** Superlatives ("only", "first", "biggest", "record")
   and temporal clauses ("before joining", "since X") are where they hide.

2. **SELF-ANSWERING questions.** 89 of 211 serious flags — 42%, the single
   largest class. The stem gives the answer away: *"Italy's last appearance
   was 2014 — how many years before 2026?"* Not wrong, just pointless: free
   points that make the app feel cheap. **These cannot be corrected, only
   REPLACED**, which makes them the most expensive class to ship. Add an
   explicit gate: can this be answered from the stem alone, with no football
   knowledge? If yes, reject before it reaches the bank.

Tooling: `scripts/audit-harvest.mjs` reconstructs findings from a running
workflow's journal; `scripts/audit-apply.mjs` applies only confirmed+high
verdicts and refuses anything it cannot prove safe. Verify agents read
`.audit/vbatch/*.json` SNAPSHOTS, not `src/questions.js` — so **the bank can
be edited while an audit runs; no freeze is needed.**

⚠️ **A hint is an eligibility criterion, not just UX.** `playerHintRows` in
gen-seo-pages.mjs requires `x.hint`, so dropping one can push an SEO page
under MIN_HINTS and fail the build (this actually happened — Lewandowski at
14). When a correction changes the answer, re-forge the hint; don't just drop
it. And compare answers by normalised containment, not string equality, or
"Lewandowski" → "Robert Lewandowski" reads as a changed answer and bins a
still-accurate hint.

## The long-answer tell (gated 2026-08-29)

Alex, mid-MP-game: *"almost always the drastically longer answer option is
right which is a real defect."* Measured: longest-option-is-correct ran 42.4%
across 6,823 MCQs (chance ≈ 25-30%), with 21 DRASTIC cases (correct ≥1.6× the
longest distractor and ≥20 chars longer) — answerable with zero football
knowledge. Those were rebalanced by PADDING DISTRACTORS with parallel
plausible-but-wrong detail; the correct answer's text is never changed (hints
and SEO reference it). `tests/unit/answer-length-tell.test.js` fails the build
on any new drastic case. **When generating questions, write the four options
to comparable length** — if the true answer needs a clause of detail, give
every distractor a clause of (wrong) detail too.

## Standards

- **Hints:** the SEO generator throws rather than emit a page for any category/club with fewer than `MIN_HINTS` (15) hint-bearing MCQs. Adding a club without hints breaks the build, by design.
- **Fact-checking:** questions asserting recent events go stale. The bank has been triaged before (566 flagged → 418 false alarms, 35 real fixes, 113 stale rows rejected). Time-sensitive record facts are the usual offenders.
- **SEO prose is separate.** `scripts/seo/clubs.mjs` and `players.mjs` carry hand-written prose NOT covered by a `questions.js` triage — it went stale independently once, and it's live on indexed pages, so factual claims there are public.
- **Editorial calls are the user's.** Verify what you can; surface what needs a football judgment rather than guessing.

## Measurement caveat

⚠️ **This section used to say `scores` held only survival/daily/classic/wc2026/chaos/legends and that Footle, Club Quiz and League Quiz wrote nothing to it. That was wrong**, and it caused the activation rate to be reported as 50.7% when the real figure is ~31% (re-measured 2026-08-26). Verified counts by `game_mode`:

    daily 388 · footle 381 · classic 255 · survival 253 · trail 128
    chaos 41 · hotstreak 40 · wc2026 32 · legends 31 · league:PL 29
    mystery 26 · club:ManUtd 14 · club:Liverpool 14 · club:Arsenal 12 …

So `scores` **is** a usable answer to "did this account play anything". Two caveats that are still true:

- Footle's authoritative per-day record is `user_game_state.wordle_state`, and ~10% of finished Footle days have no matching `scores` row (was 84% in launch week, decaying — a residual leak, not a stopped write).
- `wordle_state` is **a map keyed by date**, not a state object: `{"2026-07-11":{"status":"won","guesses":[…]}}`. Query it with `jsonb_each`, and require `jsonb_array_length(guesses) > 0` — opening the board writes an empty `guesses` array, so counting non-empty JSON overcounts players by 10.
- `club_quiz_results` (the SEO-page surface) has **no `user_id` column at all**, so web club-quiz play can never be joined to a signup.
