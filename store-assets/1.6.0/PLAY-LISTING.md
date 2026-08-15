# Ball IQ 1.6.0 — Google Play listing

Applied to the **en-US default listing** 2026-08-15 and verified by reloading the
console and reading the values back. Saved as a draft — Play stages store-listing
changes and ships them with the next review.

⚠️ **Ball IQ is app `4976141665883518498`.** The other app in this Play account is
**Tide: Breathwork and Sleep** (`4975703992215596770`). The tab that was open when
this work started was Tide's, and "go to the upload page" on that tab would have
pointed at the wrong app's release. Check the app name in the console header before
touching anything.

---

## Play indexes differently from Apple — this matters

| | Apple | Google Play |
|---|---|---|
| Indexed fields | name + subtitle + **keywords** | title + short description + **full description** |
| Description indexed? | **No** — conversion only | **Yes** — it is a ranking surface |
| Keyword field | 100 chars, separate | none |

So on Apple the description is pure conversion and repeating a word is waste; on
Play the description **is** the keyword field, and naturally recurring terms
("football quiz", "soccer trivia", league names) do work. The two listings are
deliberately NOT the same text.

---

## Applied

**Title** (30 max) — was `Ball IQ: Football Trivia`
```
Ball IQ: Football Quiz
```
22 chars. Same quiz-over-trivia call as iOS: "with answers" beat "trivia" 6.6× in
GSC and all 76 club titles were rewritten off "trivia" as our worst-converting
intent.

**Short description** (80 max) — was `Soccer & football trivia quizzes, Footle & live multiplayer. Test your Ball IQ!`
```
Football quiz and soccer trivia. Daily puzzles, club quizzes, multiplayer.
```
74 chars. Carries football + soccer + quiz + trivia, the four terms worth ranking on.

**Full description** — 2,661 chars (was 2,100). Full text is in the console; the
structure is: hook → Footle → Transfer Trail → Mystery Player → Daily 7 → club quiz
→ leagues → multiplayer → progress → football-or-soccer → why it's different →
solo-dev close → CTA.

---

## What was actually wrong with the old one

1. **"World Cup" appeared TWICE.** That is the exact wording that got iOS 1.3.3
   rejected under Guideline 5.2.1. It was stripped from Apple and left live on Play
   for months. Now gone from both.
2. **"more than 50 clubs"** — a count, and stale (we are past 70). Removed; the
   binding no-counts rule applies here too.
3. **The call to action sat in the MIDDLE.** "Think you know football? Download Ball
   IQ and prove it." was followed by three more sections, and there were two separate
   club sections. It read like two drafts stapled together. Single arc now, CTA last.
4. **Transfer Trail and Mystery Player were absent entirely** — the same gap the
   Apple listing had. Both are now full sections.
5. Kept and reworded the honest explanation claim — "Most answers come with a short
   explanation", against the measured 5,475 / 6,694 = 81.8%. Never "every answer".

## Still open on Play

- [ ] Screenshots — Play has its own set; the 8 framed 1284×2778 PNGs in
      `screenshots-6.9/` work but Play wants its own upload and a feature graphic.
- [ ] Localised listings — Play supports per-language listings exactly like Apple,
      and `localisations.json` already holds copy for 15 locales. Nothing done here yet.
- [ ] Release notes for vc18 — Play caps them at 500 chars and needs `<en-US>` tags.
