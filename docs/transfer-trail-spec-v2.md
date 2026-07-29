# Transfer Trail v2 — guess the player

**Status: proposed, awaiting Alex's go.** Supersedes §2 (mechanic), §3 (share
card) and §5 (results) of `transfer-trail-spec.md`. Everything else in v1 —
editorial rules, the dataset, the frozen-schedule approach, the streak walker —
stands unchanged and is already built.

## Why the mechanic changes

v1 shipped to spec on 2026-07-29 and was pulled the same hour. Alex, opening it
cold: *"i do not even know what player this is about… is it not meant to be a
presentation of clubs in chronological order then people type the player they
think it is?"*

He was right, and the spec had a hole worth naming precisely, because it is the
kind of reasoning that sounds airtight until someone plays it.

v1 chose **sort-the-career** over guess-the-player on this argument: naming a
player "raises the recall wall", while sorting "lowers it — the clubs are handed
to you". The hole: **sorting six clubs is only deduction if you already know
whose career it is.** If you don't recognise the player, there is nothing to
deduce from — you are permuting six labels blind. So v1 carried the full recall
wall *and* paid out nothing for clearing it.

v1 half-saw this. It names "recognition collapse" as the mode's one weakness —
but only worried about it being *too easy* once you recognise the player, and
never tested the failure that actually bites. It also listed a *"name the
player" bonus round* as a v1.1 graft and a *blind career ladder — guess whose
career this is* as the socials-native artifact. **It knew which version was
compelling and put it second.**

Two further points in favour:

- **Genre convention.** Career-path → guess-the-player is the established format
  (Who Are Ya? and its many clones). Meeting a convention is not unoriginality;
  it means a first-time player understands the screen without a tutorial. v1
  required explanation, which is fatal against a measured activation problem.
- **"Guess the Player" was already on this roadmap once** — listed on Home's
  coming-soon shelf and removed 2026-07-15 for having no implementation. The
  appetite predates this document.

## The mode, in one paragraph

Each day everyone gets the same mystery footballer. Their career is revealed as
a ladder of clubs in chronological order — **two clubs to start**. Name the
player. A wrong guess or a pass reveals the next club and costs an attempt. Five
attempts, so the ladder can open at two and grow to six: the guess gets easier
every step, and the score is how few clubs you needed. Solving on two clubs is a
flex; solving on six is still a solve.

## How it plays, turn by turn

1. **Open.** "Transfer Trail #12. Name the player." Two club chips, stacked
   chronologically, first club at the top. Years hidden. Neutral chips, club
   name as text — the flags-not-logos rule holds, crests are trademarked.
2. **Guess.** A text field. Type a surname and submit. Matching reuses Footle's
   normalisation (case, accents, `WORDLE_FULL_NAMES` prefix/surname handling) so
   "mbappe" matches "Mbappé" and both "Ronaldo" spellings behave.
3. **Wrong, or Skip.** The next club drops in with a small animation, the
   attempt counter decrements. Wrong guesses stay listed, struck through, so
   nobody repeats one.
4. **Solve.** Confetti, the full name, the completed ladder with years now
   shown, `+XP`, streak, Share.
5. **Fail.** After five, reveal the player and the full ladder. Still writes the
   day (a played-and-lost day keeps a streak honest) and still offers Share.

**Attempts map to the data by construction.** Careers are 3–6 rungs (v1
editorial rule, already enforced). Opening at two and revealing one per miss
means a 6-club career runs out of clubs exactly as it runs out of attempts.
No tuning constant to drift.

## Why two clubs, not one

One club is not a puzzle — thousands of players have played for Ajax. Two clubs
is a *transfer*, and a transfer is a fingerprint: "Sporting CP → Man Utd" is one
person. It also sets the difficulty honestly, because the pairing is what
carries the information, not the count. (Alex proposed exactly this: *"maybe
reveal 2 clubs first? not just one."*)

## Share card — spoiler-free by construction

This version is *more* spoiler-safe than v1, not less: the grid never names a
club or the player, only how many rungs it took.

```
⚽ Ball IQ · Transfer Trail #12
Got it on 3 clubs ⚽⚽⚽
🔥 7-day streak
balliq.app/trail
```

A miss posts `X/5` with no ladder. `#12` comes from `getTrailNumber()`, so
strangers' results stay comparable in a feed — the same property that makes
Footle's grid work.

## What is already built and stays

- `TRAIL_PLAYERS` — 38 verified careers, chronological, loans marked
- `TRAIL_ANSWER_LOG` — 380 days frozen, every career used exactly 10 times,
  no career on consecutive days
- `TRAIL_ANCHOR_DAY` — currently PROVISIONAL and in the future, so the mode is
  dark. Set it in the commit that declares the screen ready. It has moved once,
  legitimately, on a day with zero recorded plays; after one shared grid it can
  never move again.
- the completion event → `scores` row + XP + reminder-cancel wiring
- `computeTrailStreak`, the daily-zone row (gated on the mode being live)
- the `?game=trail` route and its null-guard

## What is new

- **The screen.** Ladder + guess field + attempts, replacing the swap board.
- **The grader.** `gradeTrail`'s permutation logic no longer applies. New shape:
  normalise the guess, compare against the answer's accepted names, return
  hit/miss. Much simpler than what it replaces.
- **`buildTrailShareText`** — rewritten for the new payload.
- **Accepted-names data.** Each career needs the surnames that count as correct.
  Mostly `display[1]`, but brand names need aliases (Ronaldinho, Kaká) and
  compound surnames need both forms ("van Persie" / "persie"). ~38 rows of
  editorial work, and it is the one genuinely new data requirement.

## Open questions for Alex

1. **Typed or multiple choice?** Typing is the genre norm and more satisfying.
   Multiple choice would lower the recall wall further against the activation
   problem, but makes the share card weaker ("got it in 3" means less when you
   were shown four names). Recommendation: typed, with a **Skip** always
   available so nobody is stuck.
2. **Any assist?** Nationality or position could unlock after three misses. It
   rescues a hard day without changing the scoring. Recommendation: yes, after
   the third miss.
3. **Keep the sort-the-career mode at all?** It could return later as a harder
   variant on the same dataset. Recommendation: no — one clear mode beats two
   half-modes, and v1's screen is what confused the owner of the product.
