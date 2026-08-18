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

---

## Screenshots — DONE 2026-08-15

8 framed PNGs at **1080×1920**, in `screenshots/android/` and copied to
`~/Downloads/BallIQ-1.6.0-store-assets/screenshots-android/`.

```
PLATFORM=android node scripts/frame-store-screens.mjs
```

Three things that made this a real port rather than a resize:

1. **Play cannot reuse the Apple canvas.** 1284×2778 is a 0.462 ratio; Play wants
   16:9 or 9:16, and 9:16 is 0.5625. 1080×1920 is exactly 9:16 and inside Play's
   320–3840px bounds, so Android renders on its own canvas.
2. **The RAW captures are shared — and must stay uncropped.** The raws are shot
   once at the Apple image-area aspect (440×874). The Android phone is therefore
   SIZED so its own image area lands on that identical aspect; otherwise
   `object-fit:cover` eats the bottom of the app and slices the tab bar, the exact
   bug the geometry comments already exist to prevent. No re-shoot needed.
3. **The cutout is what says which platform this is.** An iPhone Dynamic Island on
   a Play listing reads as the wrong platform's screenshot — the one detail both a
   reviewer and a shopper clock instantly. Android gets a centred punch-hole, with
   the same rim-and-lens lighting, or it renders as a flat blob on a dark bar.

Phone width was tuned 560 → 640 after looking at the output: at 560 the device
filled only 52% of the width and the leftover copy-block height showed up as ~200px
of dead air between the subline and the phone. 9:16 is a wider canvas than Apple's,
so the phone has to grow to keep the composition tight.

⚠️ Apple output is untouched — verified in the same run: `phone 899x1845 ·
image 875x1739 · capture 440 x 874`, identical to before.

## Still open on Play

- [ ] **Feature graphic 1024×500** — required by Play, and we have none. Not a
      screenshot; it is the banner at the top of the listing.
- [ ] Upload the 8 screenshots to the Play listing.
- [ ] Release notes for vc18 — 500-char cap, needs `<en-US>` tags.
- [ ] The 15 localised Play listings (copy already exists in `localisations.json`).
