# Transfer Trail — build spec

> Daily 'put the career in order' mode. Winner of the 2026-07-18 multi-agent design panel (5 designs → 3 judges → synthesis). Web-first MVP ~1.5 weeks on Footle's scaffolding.

# Ball IQ — new daily mode: **Transfer Trail**

## Decision: which design, and why (honest weighing)

**Base = Transfer Trail. Graft the best of CHAIN, Trail (Journey), and Footprint onto it.**

CHAIN won the raw average (80.7 vs Transfer Trail's 77), and it's the cleverest concept in the field. I'm overriding that on the exact criterion you set — *a mode that can't ship or can't be shared loses*:

- **CHAIN can't ship cheaply, and can't stay shipped.** Buildability 6/6/6 — the field's weakest among contenders, and all three judges independently flagged the *same* structural cost: a **hand-curated daily start/target/ban schedule that needs per-puzzle BFS difficulty analysis, forever.** Footle's whole value is a *frozen, zero-maintenance* answer log (`WORDLE_ANSWER_LOG`, 400 days out). CHAIN cannot replicate that — every day carries a tuning tax. For a solo dev already carrying the question bank, native builds, marketing, and App Store firefighting, that's a liability disguised as a feature.
- **CHAIN's best share artifact spoils the puzzle.** The route-image people actually post *reveals the intermediate players* — see it, can't play it. The genuinely spoiler-free version is just coloured rungs + par, which is a *weaker* artifact than Footle's grid. Share-ability is the #1 job; CHAIN's is compromised at the core.
- **CHAIN raises the recall wall** (Judge 3's lone worry: "high skill floor against the activation bottleneck"). Your measured #1 problem is activation collapse (100→38→15%). Transfer Trail's *order-deduction* verb **lowers** the recall wall — the clubs are handed to you — which is the correct direction for that exact bottleneck.

Transfer Trail is the safest high-share bet (buildability 8/7/7, distinctiveness 8/8/8), ships in ~1.5 wk on Footle's scaffolding, produces a **truly spoiler-free** grid, and carries the leanest/safest data (self-contained public-record club order — no graph-balance trap, no clue-uniqueness trap). Its one real weakness — *recognition collapse* ("once you know the player, ordering is trivial", Judge 3) — is fixable in curation, and I graft CHAIN's difficulty-lever thinking to fix it.

**Grafts folded in:** CHAIN's "content faucet" → a second, socials-native *blind career-ladder* artifact; CHAIN's difficulty lever → shape-based curation + hidden years to kill recognition-collapse; Trail/Footprint's archive binge → a past-puzzles screen as an activation aid; Trail's pure-IQ flex → a v1.1 "name the player" bonus round (kept out of MVP).

---

## 1. The mode, in one paragraph

**Transfer Trail** is a daily "put the career in order" puzzle. Each day everyone gets the same mystery footballer, their clubs revealed but **scrambled**; you drag/tap them into chronological order in as few attempts as possible. It's a *logic* game, not a quiz — no multiple choice, no recall wall, because you already know the clubs; the puzzle is the *sequence* (deduce it from eras, loan logic, and directional feedback). It gets shared for two reasons: (1) the spoiler-free convergence grid (mostly ⬛ → all 🟩) tells the "I cracked it in 3" story and drops straight into the existing `shareCard` pipeline; (2) a solved career reads as *"wait, he played for all those?"* — the single most reliable did-you-know format the @shithouseryhq feed already posts. It pairs with Footle as a second daily habit without cannibalising it (order-deduction vs spelling are different itches), and its lower skill floor is aimed squarely at the activation collapse.

## 2. How it plays (turn by turn, concrete)

1. **Open.** "Transfer Trail #128. Put this career in order." A board of N empty rungs (default 5–6, top = first senior club, bottom = current/last) and a **bench** of the same N clubs, shuffled. Years hidden by default. Neutral club chips (club name on a pill — flags-not-logos rule; crests are trademarked).
2. **Arrange.** **Tap-two-to-swap** (tap club A, tap club B → they swap). No drag library, mobile-first. Fill all rungs.
3. **Submit.** Each rung is graded by a pure label-based permutation function:
   - 🟩 club is in its exact chronological rung
   - 🟨 club is within one rung of its true spot
   - ⬛ club is two or more rungs off
   - In-game only, each non-green rung also shows **⬆️/⬇️** ("belongs earlier / later") — same truth, stronger UX than colour alone.
4. **Rearrange & resubmit.** Up to **5 attempts**. Win = all 🟩.
5. **Reveal.** Confetti (reuse `<Confetti/>`), full-name card (reuse the `WORDLE_FULL_NAMES` `[prefix, surname]` convention at App.jsx:7122), the solved ladder with years now shown, `+XP`, streak increment, **Share**.
6. **Assist (v1 fast-follow, off by default):** reveal first+last club, or reveal years — the difficulty dial for casual vs hardcore.

**Recognition-collapse fix (the graft that matters):** curate for **non-obvious order**, not just well-travelled — careers with return spells (two Villa stints), same-era sideways moves, and tangled loans. Keeping years hidden by default means even a recognised player (Ashley Young: Watford → Villa → Man Utd → Inter → Villa → Everton) is a genuine ordering puzzle. Grader is **label-based**, so duplicate-club careers "just work" (both Villa tiles are interchangeable; the difficulty lives in the *other* rungs).

## 3. The share card (spoiler-free)

Auto-copied text + a PNG via a new `"trail"` branch in `generateShareCard` (App.jsx:3426). Convergence grid, N columns = club count, one row per attempt — shows closeness, never *which* club:

```
⚽ Ball IQ · Transfer Trail #128 — 3/5
🟩🟩🟨⬛🟨🟩
🟩🟩🟩🟨🟨🟩
🟩🟩🟩🟩🟩🟩
🔥 7-day streak
balliq.app/trail
```

`#128` from `getTrailNumber()` (a data-free sibling of `getFootleNumber()` at src/lib/footleNumber.js:14) makes strangers' grids comparable in a feed. The row-by-row march to all-green *is* the "figured it out in 3" narrative.

**Second artifact (v1 fast-follow, this is the socials' native format):** the **blind career ladder** — clubs shown in solved order, name hidden — as a "guess whose career this is" challenge post. Zero new data (reuses the same dataset). It's a *separate content product* from the spoiler-free personal grid, so it never spoils a player's own daily. This is the CHAIN "content faucet" graft, cleaned of CHAIN's spoiler problem.

## 4. Data plan (precise, honest)

**Answer/display layer — free, already in the repo.** Names, diacritics, compound-surname handling, and the reveal-card `[prefix, surname]` tuples all come from `WORDLE_FULL_NAMES` in src/lib/wordle.js (518 lines already written). The Footle pool doubles as the recognisability filter — start with players already in `WORDLE_PLAYERS`.

**Career-order layer — genuinely NEW, cannot be auto-derived.** src/questions.js has ~514 transfer MCQs but they are unstructured prose; there is **zero** ordered `{player → clubs}` data anywhere. `getWordleAnswerForDayIndex` proves the frozen-log pattern to clone. New file `src/lib/trail.js`, one row per player:

```js
{ key: "YOUNG_A", display: ["Ashley","Young"],
  clubs: ["Watford","Aston Villa","Man Utd","Inter","Aston Villa","Everton"], // chronological
  years: ["2003–07","2007–11","2011–20","2020–21","2021–23","2023–"],          // assist-only, optional
  nat: "England" }                                                             // blind-ladder header / assist
```

- **Volume:** MVP **60–80 players** (~2 months of dailies); extend to ~150 (~5 months) in waves, exactly like the club-quiz program. ~80 × ~6 clubs ≈ 8–12 KB, lazy-loaded.
- **Sourcing at the zero-error bar:** career order is unambiguous public record (the Wikipedia "Senior career" infobox is a single canonical column). Repurpose the existing **generate→examiner→skeptic forge** — but the skeptic's job here is narrow and mechanical: re-derive the club *set* and *order* from an independent source and assert equality. At 60–80 entries, **Alex spot-checks 100%** — it's small enough. A wrong order is *unfalsifiable to the player* and screenshot-worthy in the bad way (same trust class as a wrong question key, and the club-pack ~17% leak lesson), so this pass is non-negotiable.
- **Honesty on the club-visual claim:** the Transfer Trail brief asserted "~41 club registry blocks with color+emoji" exist to reuse — **they don't.** questions.js carries `club:` *tags* and MarketingHome has 3-letter *badges* (no colours). MVP uses **neutral text chips**; a small `{club → color, abbrev}` map is a v1 polish item, not a blocker.
- **Editorial rules to lock before batch generation (30 min, Alex-only):** include loans? (recommend yes — mark them; they add ordering difficulty) · youth/academy? (recommend no, senior only) · return spells as separate rungs? (recommend yes — they're the fun) · max rungs? (recommend cap at 6; only pick 5–6-club careers for MVP, skip 10-club journeymen where sources disagree).

## 5. MVP scope (smallest shippable) + cuts

**In MVP (client-only, ships web first):**
- `src/lib/trail.js` — dataset (60–80), frozen `TRAIL_ANSWER_LOG`, `getTrailNumber()`, pure `gradeTrail(guess, answer)`, `computeTrailStreak(today)` (clone of `computeFootleStreak`, walks `biq_trail_<ymd>`).
- `TransferTrail.jsx` — board + bench, tap-to-swap, 5-attempt loop, ⬆️/⬇️ + colour grading, reveal card, `biq_trail_<ymd>` localStorage. Clone `FootballWordle` (App.jsx:6805).
- New `"trail"` branch in `generateShareCard` + spoiler-free text builder (mirror App.jsx:7043–7076).
- Home entry card beside the Footle hero; `/trail` route + `?game=trail` boot alias.

**Cut to v1 fast-follow:**
- Cross-device sync — `trail_state jsonb` column on `user_game_state` + `upsert_trail_state(p_ymd, p_state)` RPC (exact clone of `upsert_wordle_state`, functions.sql:1078) + login-merge in useAuth.jsx. **MVP is client-only** (Footle shipped this way; the streak walker reads localStorage regardless). *Migration must end with explicit GRANT + `revoke execute … from public`, and any new column/table gets explicit REVOKE — per your standing rules.*
- Blind career-ladder share artifact (socials content faucet).
- Archive / past-puzzles screen (clone `PuzzleReviewScreen`, App.jsx:4682) — activation aid.
- Club colour chips; assist mode toggle.

**Cut to v1.1:** "name the player" bonus round after ordering (Trail/Footprint's pure-IQ flex); shared-attribute hints.

## 6. Build sequence (ordered checklist)

1. **Lock editorial rules with Alex** (loans / youth / return spells / max rungs). This is the gate — everything downstream depends on it. ~30 min.
2. **Kick off dataset drafting** via the forge (60–80 players, 5–6 clubs), skeptic re-derives order from an independent source, **Alex spot-checks 100%.** Runs in parallel with steps 3–6.
3. **`src/lib/trail.js`:** dataset stub + `getTrailNumber()` + `gradeTrail()` + frozen schedule + `computeTrailStreak()`. **Unit-test `gradeTrail`** first: all-green win, off-by-one → yellow, duplicate-club career, direction arrows. (This is the one piece of genuinely new logic; pin it with tests like `tests/unit/wordle-schedule.test.js` does for Footle.)
4. **`TransferTrail.jsx`:** board UI with tap-two-to-swap, attempt loop, reveal, share button. Copy-adapt `FootballWordle`.
5. **Share:** add `"trail"` to `generateShareCard`; add the spoiler-free text `useMemo`.
6. **Wire Home + routing** (`/trail`, `?game=trail`), entry card in the daily zone.
7. **Device-test tap-swap at 375px**, then run a **clean cap-sync build** (`rm -rf dist && npx vite build && npx cap sync ios`) — this crosses the web/native boundary (touches `dist/`), per the native-build skill and the stale-dist memory note.
8. **Ship web first.** Fast-follow: sync RPC + migration, blind-ladder artifact, archive screen.

## 7. The one biggest risk + how to de-risk

**Data accuracy — a wrong or ambiguous career order.** It's unfalsifiable to the player, screenshot-worthy in the *bad* way, and it directly poisons the share loop (a viral wrong-answer post is worse than no post). This is the same failure class as a wrong question key and the club-pack answer-leak lesson.

De-risk, in order:
1. **Lock editorial rules before any batch** (step 1) — most "errors" are actually undefined loan/return-spell conventions, not facts.
2. **Skeptic pass re-derives order from a second independent source** and asserts the club set *and* sequence — not a proofread, a re-derivation.
3. **100% human spot-check at MVP volume** — 60–80 is small enough to eyeball every one; don't scale past that until the pipeline has a clean track record.
4. **Ship the in-app "report" path from day one** (reuse src/lib/userReports.js) as the safety net.
5. **Start narrow:** well-known 5–6-club careers where the order is unambiguous; avoid deep lower-league journeymen where sources disagree. Breadth comes in later waves, once trust is established.

*Secondary (fun, not trust):* recognition-collapse. Mitigated in the design itself — curate for tangled/return-spell careers and keep years hidden by default, so recognising the player ≠ solving the order.

**Key files to clone:** src/lib/wordle.js (schedule + streak + `WORDLE_FULL_NAMES`), src/lib/footleNumber.js (`getTrailNumber`), App.jsx:6805 (`FootballWordle` screen), App.jsx:3426 (`generateShareCard`), App.jsx:4682 (`PuzzleReviewScreen`, fast-follow), supabase/prod-snapshot/functions.sql:1078 (`upsert_wordle_state`, fast-follow).
