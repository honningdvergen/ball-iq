# Ball IQ 1.6.0 — store listing

iOS build **63**, Android **versionCode 18**, both `1.6.0`.
Screenshots: `screenshots-6.9/` — 8 framed PNGs at 1284×2778.

⚠️ **This is an EDIT of the live listing, not a replacement.** The first draft
of this file was written blind from a screenshot and would have thrown away the
full club list, the league list and the solo-dev-from-Norway close — all of
which are good and stay. Read the live text before rewriting store copy; it is
2,910 characters, not the ~1,090 visible in a screenshot.

---

## 1–2. Name + subtitle — ✅ DONE 2026-08-15 (App Information page)

```
Ball IQ - Football Quiz        23/30   was: Ball IQ - Football Trivia
Daily Puzzles & Club Trivia    27/30   was: Daily Quiz & Puzzle Game
```

⚠️ My earlier note here said the live subtitle was "The Ultimate Football Quiz".
**It was not** — that was stale; the live value was "Daily Quiz & Puzzle Game".
Read the console before writing about it.

The subtitle still had to change, for the documented reason: Apple indexes only
name + subtitle + keywords, and a word repeated across them is counted once and
wasted. Renaming to *Football **Quiz*** would have collided with the old
subtitle's *Quiz*. The new pair shares no word — and it **rehomes `trivia`**, so
the rename does not silently lose that term, and pulls in `club`, our strongest
intent on the web.

## 2b. Keywords — ✅ FIXED, and they were quietly broken

```
before  soccer,player,guess,club,team,legends,league,premier,euro,liga,footle,fan,champions,match,quiz,daily   100/100
after   soccer,player,guess,team,legends,league,premier,euro,liga,footle,champions,career,transfer,mystery      98/100
```

The 5.2.1 FIFA rejection stripped `world,cup` and the freed space was backfilled
with **`quiz,daily` — both already in the subtitle**. Two of sixteen slots have
been dead since roughly July. Nothing flagged it because the field still read
100/100: **a full keyword field is not a working one.**

Out: `quiz,daily` (duplicates), `club` (duplicate once the new subtitle landed),
`fan,match` (weakest by intent). In: `career,transfer,mystery` — all three are
real modes, so Guideline 2.3.7 holds.

Dropping a duplicate costs nothing, because Apple builds phrases ACROSS fields:
`soccer`(kw) + `quiz`(name) still makes *soccer quiz*; `club`(subtitle) +
`quiz`(name) still makes *club quiz*. That is exactly why duplication is waste
rather than reinforcement.

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
| 02-footle | **RE-SHOT 2026-08-15** — see the note below |
| 03-club-picker | re-shot |
| 04-transfer-trail | **NEW** — won on the last of five attempts |
| 05-quiz-explanation | re-shot |
| 06-profile | re-shot |
| 07-mystery-player | **NEW** — solved on the sixth guess |
| 08-daily-chips | **NEW** — the green/red chip run, 5 ✓ 7/7 |

⚠️ **02 was a staged-looking board and shipped that way once.** The generator
built each row as "keep the answer's first r+1 letters in place, pad with junk",
so against ALONSO it produced `AOSNAO · ALBIRL · ALOTME · ALONOS · ALONSO` —
three greens on guess one, "ALO" spelled out by guess three, and not one row a
real word. Alex: *"really dumb and easy… you almost wrote the right name in the
first couple then got dumber."* It passed both the screen check and the
≥15-filled-tiles board check; nothing mechanical detects "this looks fake".

Now built by `footleLadder()` from the 9k mystery pool, fame-sorted, with **no
greens allowed in the first two rows**. Today: `NEYMAR · YASHIN · ROONEY ·
GROSSO · ALONSO`, solved on the fifth. Verified across 12 future daily answers —
all four rows real surnames, first two rows green-free, every day.

Both scripts now take `ONLY=02-footle` so one bad shot can be redone without
re-rolling the other seven (every shot is non-deterministic — daily answers
rotate and quiz options shuffle).

### Order — and why it needs fixing every upload

App Store Connect keeps screenshots in **upload order**, not filename order.
The 8 landed as `01·05·02·08·07·06·03·04` and had to be dragged back.

Reordering is scriptable: the tiles are `react-beautiful-dnd` handles with a
**keyboard** path — focus the tile, `Space` to lift, `←`/`→` to move, `Space` to
drop. ⚠️ **One arrow per second.** Sending the arrows back-to-back — or with the
`repeat` parameter — registers exactly ONE move, because each step animates and
the library drops keys during the transition. That failure is silent: the keys
all report "pressed" and the order is simply wrong.

Order is saved **on drop**, by the media API — the version **Save** button stays
disabled the whole time and is NOT the confirmation. Verified by reloading the
page and re-reading the order, which is the only check that means anything.

📌 **Apple only uses the first 3** on the app installation sheet (stated on the
page itself). Ours are Home · Footle · Club picker — the hook, the daily habit,
and the differentiator. Trail and Mystery sit at 4 and 7; they carry the 1.6.0
story through What's New rather than the install sheet.

📌 The folder name `screenshots-6.9` is a misnomer — 1284×2778 is filed by Apple
under **6.5" Display**, which is what the console shows. It is accepted and
scaled to the other sizes; no action needed, just don't go hunting for a 6.9"
slot that isn't there.

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
- [x] App name → `Ball IQ - Football Quiz` — DONE (App Information)
- [x] Subtitle → `Daily Puzzles & Club Trivia` — DONE (App Information)
- [x] Screenshots — all 8 uploaded by Alex 2026-08-15, **order fixed and verified**
      (they land in upload order, which was scrambled: 01·05·02·08·07·06·03·04)
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

---

## 9. ⚠️ THE SUBMISSION BLOCKER THE LOCALISATIONS CREATED

Adding the 14 locales produced *"Unable to Add for Review — You must enter a
Privacy Policy URL in App Privacy."* **Every localisation carries its own Privacy
Policy URL**, and a new locale arrives with that field EMPTY. English (U.K.)
already had `https://balliq.app/privacy.html`; the other fourteen did not.

Fixed 2026-08-15 — all 15 set and each verified. **Add for Review is now enabled.**

Set them under **App Privacy → Privacy Policy → Edit**, using the locale switcher
inside that section. Two traps:

1. **The field pre-fills from the primary**, so typing the same URL leaves Save
   greyed — React sees no change. **Clear it first** (⌘A, Delete), then type.
2. **Programmatic value-setting does not enable Save**, even though the character
   counter updates. Real keystrokes into a JS-focused field are required.

⚠️ And a tooling trap worth remembering: this page runs at 2400×1240 CSS pixels
while screenshots come back 1543×797 (devicePixelRatio 1.6). Clicking at screenshot
coordinates missed the input by ~380px and failed *silently* — the value simply
never changed. Locate elements with `getBoundingClientRect()` and focus via JS.

**The general rule:** anything that is per-localisation is now 15× the work, and
Apple will only tell you about the missing ones at submit time. Next time a locale
is added, set its privacy URL in the same pass.
