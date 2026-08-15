# Ball IQ 1.6.0 — store listing

iOS build **63**, Android **versionCode 18**, both `1.6.0`.
Screenshots: `screenshots-6.9/` — 8 framed PNGs at 1284×2778.

⚠️ **This is an EDIT of the live listing, not a replacement.** The first draft
of this file was written blind from a screenshot and would have thrown away the
full club list, the league list and the solo-dev-from-Norway close — all of
which are good and stay. Read the live text before rewriting store copy; it is
2,910 characters, not the ~1,090 visible in a screenshot.

---

## 1. App name  (30 char limit)

```
Ball IQ - Football Quiz
```
23 chars. Was "Ball IQ - Football Trivia".

## 2. Subtitle  (30 char limit) — MUST CHANGE

```
Daily puzzles & club trivia
```
27 chars.

⚠️ Not optional. Apple indexes name + subtitle + keywords, and a word repeated
across those fields is wasted — it does not rank twice. The current subtitle is
"The Ultimate Football Quiz", which after the rename repeats BOTH words in the
name. Every word above is new to the pair: daily · puzzles · club · trivia.

## 3. Promotional text  (170 chars, editable without review)

```
New: Mystery Player and Transfer Trail. Four daily puzzles, one football brain. Guess the secret player, name him from his career, and keep the streak alive.
```
156 chars.

---

## 4. Description — THREE SURGICAL EDITS

Keep the live description as it stands, and make these three changes.

### EDIT A — first line

Replace:
> `Ball IQ — The Ultimate Football Quiz`

with:
> `Ball IQ — Football Quiz`

### EDIT B — the Footle paragraph is FACTUALLY WRONG ⚠️

Live text says:
> "FOOTLE — THE DAILY FOOTBALL PUZZLE
> Guess the mystery player in six goes, with **hints on nationality, position,
> age, club and shirt number**."

**Footle does none of that.** It is a Wordle-style surname puzzle — you type a
surname and get per-letter colour feedback. Grepped the Footle screen, the hero
and lib/wordle.js: no nationality, position, age, club or shirt-number hint
exists anywhere. That paragraph describes a different game. Replace with:

```
FOOTLE — THE DAILY FOOTBALL WORD PUZZLE
One footballer's surname, six guesses, letter-by-letter colour feedback — green
for right letter right place, amber for right letter wrong place. Everyone in
the world gets the same player each day. There's a big archive to work through
and a streak to protect. It's the first thing most players open.
```

### EDIT C — add Mystery Player, after the Transfer Trail block

The newest mode is absent from the listing entirely. Insert:

```
MYSTERY PLAYER — EVERY GUESS GETS YOU CLOSER
Name any footballer and he comes back ranked against the secret player —
shared clubs, era, position, nationality and age all count. Rank 1 is the
answer and nothing else is. Unlimited guesses, a new player every day.
```

### EDIT D — one claim is false ⚠️

Live "BUILT DIFFERENTLY" says:
> "**Every answer** comes with a short explanation, so the quiz teaches as it tests"

Measured today: **5,475 of 6,694 questions carry an explanation — 81.8%**, not
all. (This was flagged once before and the fix never reached the store, so it
is still live and still wrong.) Replace with:

```
- Most answers come with a short explanation, so the quiz teaches as it tests
```

Everything else in the description stays exactly as it is.

---

## 5. What's New in This Version

```
Mystery Player and Transfer Trail are now part of your daily four.

• Start typing a name in either game and pick it from a ranked list. No more spelling a player perfectly just to make a guess.
• A sharper Mystery Player ranking. Era now counts, so a keeper from the answer's own generation reads as close as he should be.
• Thousands of players were listed with a club they had already left. Their current clubs are now correct.
• Fixed a bug that could leave the app stuck on the loading screen with no connection.
```

517 chars. Rewritten 2026-08-15 on Alex's note — the earlier draft ended the
club-data bullet with "Fixed — Bayern is Bayern again", which he called cringe.
Release notes get read by someone deciding whether to update; the joke was
costing the bullet its meaning. Say what was wrong and what is now right.

---

## 6. Screenshots

| file | status |
|---|---|
| 01-home | re-shot |
| 02-footle | **reused** — Alex: "looks alright as is" |
| 03-club-picker | re-shot |
| 04-transfer-trail | **NEW** — won on the last of five attempts |
| 05-quiz-explanation | re-shot |
| 06-profile | re-shot |
| 07-mystery-player | **NEW** — solved on the sixth guess |
| 08-daily-chips | **NEW** — the green/red chip run, 5 ✓ 7/7 |

⚠️ 08 stops ON the last question, not the results page. Finishing the daily as a
guest raises the "Save your progress" auth sheet, and it appears AFTER the
screen assertion runs — the check went green while the captured frame was the
sign-up sheet. Caught by opening the PNG, not by the test.

---

## 7. Status in App Store Connect

Applied and **saved** on the 1.6.0 version page on 2026-08-15:

- [x] Promo text (§3)
- [x] Description — edits A–D, plus a second "make it more flattering" pass (§8)
- [x] What's New (§5)

Still open — these are **not on the version page**:

- [ ] Distribute build 63 from Xcode Organizer *(Alex)*
- [ ] App name → `Ball IQ - Football Quiz` — **App Information page**
- [ ] Subtitle → `Daily puzzles & club trivia` — **App Information page**, required by the rename
- [ ] Replace the 6 live screenshots with the 8 in `screenshots-6.9/` — drag-and-drop,
      the file input is not reliably scriptable
- [ ] Android AAB at versionCode 18 — bumped in `build.gradle`, not built yet

⚠️ App name and subtitle live on **App Information**, a different page from the
version editor. Editing the version page does not touch them, and the rename is
worthless without the subtitle change — after renaming, the live subtitle "The
Ultimate Football Quiz" repeats *both* words in the new name, so Apple indexes
neither twice and two of thirty subtitle characters do real work.

App Review notes need no change; they are accurate and stay as they are.

---

## 8. The flattering pass — what changed and what it cost

Description went 2,910 → 3,733 chars. Two rules constrained it:

**No counts.** The first draft of the new opening ended "Four daily puzzles.
Seventy-odd club quizzes." That is a count, and the no-counts rule has already
come back disguised twice (per-club progress bar, screenshot copy). Rewritten to
"Four daily puzzles, a quiz for your own club". The digits that remain — 10
questions, 60 seconds, 60 to 160 — are game *rules*, not inventory, and don't rot.

**Nothing flattering that isn't true.** Every claim was checked before it went in:
- "never scraped, never auto-generated" — true, the bank is hand-written
- "Most answers come with a short explanation" — measured 5,475/6,694 = 81.8%
- "rewriting it every time a record falls" — the seasonal `/lists` refresh
- No FIFA, no World Cup wording (Guideline 5.2.1 rejected 1.3.3 for exactly that)

New close: *"No investors, no content farm, no filler — just a football fan
writing the quiz he wanted to play, and rewriting it every time a record falls."*
