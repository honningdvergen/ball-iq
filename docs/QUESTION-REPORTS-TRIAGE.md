# Question reports — full triage (2026-08-23) — ⚑ ALL RESOLVED

> **Status: closed.** Every one of the 55 reports now has an applied verdict.
> The two post-cutoff facts were WEB-VERIFIED rather than guessed, one question
> was deleted, one prompt was rewritten, and one UI cause was fixed. Details
> inline below; resolutions summarised here.
>
> | item | verdict |
> |---|---|
> | Arsenal 2025/26 title premise (q_d32828) | ✅ **TRUE** — Arsenal won it, 85 pts. Question correct, kept |
> | 106-goal record (q_1d936f) | ✅ **STILL STANDS** as of Aug 2026. Question correct, kept |
> | q_70e531 RB Leipzig / Red Bull | 🗑 **DELETED** — the club's name contains the answer |
> | q_d9f278 McKennie | ✅ kept — honestly graded easy, needs real knowledge |
> | q_eae9ea Vidić | ✏️ stem + hint rewritten to defuse the PFA/Terry collision |
> | Footle: WILLIAN and 32 other mononyms | ✏️ **THE PROMPT WAS WRONG, not the pool** — "surname" → "the name a footballer goes by" |
> | Trail: Alonso, Flamini, + 5 more | ✅ careers verified correct; "↩ return" chip added so repeats stop reading as errors |
> | Trail: SON | ✅ fixed and deployed 2026-08-23 |


Every report ever filed: **55 rows, 44 distinct items, 25 in the last 7 days.**
We always knew *which* — the id and text were stored from day one; only the
*why* was blank (fixed tonight: the button now asks). This is the complete
list, triaged. **Verdicts marked ALEX need your football judgment; everything
else is fixed or verified.**

## The headline: reports cluster, and the clusters have causes

| cluster | reports | diagnosis |
|---|---|---|
| Transfer Trail careers | 14 across 7 puzzles | ALL Wikipedia-verified correct. Two causes below, both addressed |
| Footle losses | 11 (`footle-lost`) | losers flagging the answer as unfair/obscure — editorial review list below |
| Bank questions | 30 across 27 questions | 1 clarified, 1 deletion candidate, 2 post-cutoff checks for you, rest reviewed |

## Fixed or verified tonight

- **trail:SON (2 reports, today)** — the autocomplete-rejection bug. Fixed this
  morning, deployed, played through on prod.
- **trail:ALONSO (3) + trail:FLAMINI (3)** — the two most-reported items, and
  both careers are **verified correct** (`verify-trail-careers.mjs` checks all
  102 against Wikipedia; Alonso's Eibar loan-return is a documented accepted
  divergence, Flamini's second Arsenal spell + Getafe match his infobox).
  Pattern found: **both careers show the same club twice.** A player who
  doesn't know the loan sees a duplicate and reports the data as wrong. Fix
  shipped: a small **"↩ return" chip** on any rung whose club appeared above
  it. Backwards-looking only, so it can never spoil an unrevealed comeback.
- **q_eae9ea "first defender to win PL Player of the Season" (2 reports, one
  from a player who picked our key and STILL reported)** — I suspected our
  answer was wrong (John Terry 2004-05); web-verified it is **not**: Terry's
  04-05 win was the **PFA** award, and Vidić is confirmed first for the
  league's own award. The reports come from that exact collision, so the stem
  now says "the Premier League's **own** Player of the Season award" and the
  hint names the Terry/PFA distinction outright. Correct question, now also a
  teaching moment.
- **trail:VAN_PERSIE, LEWANDOWSKI, COURTOIS, GRIEZMANN** — careers verified;
  Lewandowski's trimmed Polish openers and Courtois's loan-order are
  documented editorial choices. No action.

## ALEX — deletion candidate (the intellect-insult class)

- **q_70e531** *"RB Leipzig were founded with investment from which energy
  drinks company?"* → Red Bull. Reported **today** by a player who answered
  correctly. The club's name contains the answer — this is answerable with
  zero football knowledge, which is the July rule's definition of
  self-answering: **cannot be corrected, only replaced.** My verdict: delete.
  Your call.
- **q_d9f278** *(McKennie / "which Serie A club")* — borderline: he only ever
  played for one Serie A club, so the qualifier does the work. Reported today
  despite a correct answer. Keep-or-delete is taste; flagging, not pushing.

## ALEX — post-cutoff facts only you can check (both reported this week)

- **q_d32828** — stem asserts Gabriel was a cornerstone of *"Arsenal's 2025/26
  title-winning side."* **Did Arsenal win the 2025-26 Premier League?** If not,
  this is a false premise in the stem — the worst class we know. Reported by a
  player who answered correctly, which historically is the smart-fan-flags-
  wrong-fact signal.
- **q_1d936f** — *"As of 2026, record for most goals by one team in a PL
  season"* → keyed 106 (City 2017-18). **Did anyone break 106 in 2025-26?**

## ALEX — Footle answer pool, editorial review (losers' reports)

Two-report answers first: **ELLIOTT, WILLIAN**; then ALONSO, BUSQUETS,
CASILLAS, ALVES, MENDY, ASPAS, LINEKER, ALLEN. These are "this answer felt
unfair" votes. WILLIAN is a mononym oddity; ALLEN/ASPAS/MENDY may be too
obscure for the demographic. ⚠️ Any pool change must respect the frozen
`WORDLE_ANSWER_LOG` — future days only. From tonight, these reports carry
reasons, so the too-hard-vs-wrong split will answer itself.

## Reviewed, no action

q_ffc8b6 (Cerámica→Villarreal ✓), q_769de3 (Simeone Argentine ✓), q_fad6e8
(Tractor Boys ✓, distractors are rival nicknames — plausible by design),
q_a18164 (France–Senegal 2002 ✓), q_ad54df (6-1 v Southampton, 7 May 2003 ✓),
q_53ba11 (Germany 2014 ✓), q_93d9d4 (Immobile 36 ✓), q_6a1939 (Arsenal FA Cups
✓), q_75b637 (Zoff ✓), q_bd5431 (Henry v Leeds ✓), q_81d6c2 (Lippi ✓),
q_0e9c13 (Ajax ✓), q_a168d0 (Chelsea CL+EL 2013 ✓), q_d3e977 (Torres £50m ✓),
q_2f3c0e (Nico Williams ✓), q_c7f2db (5-1 Maine Road ✓), q_527c56 (Mexico City
✓), q_24a353 (Villa Park ✓), q_437af4 (Celtic ✓), q_5ab4aa (Liverpool 6th ✓ —
easy, but honestly graded), q_470825 (The Dragons ✓), q_760004 (Socceroos ✓,
qualification is pre-cutoff fact per its tag).

Single-report items from players who answered correctly and flagged anyway
(q_5ab4aa, q_0e9c13, q_527c56, q_24a353, q_437af4…) skew "too easy" — from
tonight the reason picker will say so explicitly instead of us inferring.
