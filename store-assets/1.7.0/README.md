# 1.7.0 — App Store Connect listing (English U.K.)

Applied to App Store Connect on 2026-08-24 and verified by full page reload.
Kept here because the console is not version control: the previous listing
carried a stale claim for months and nothing in the repo would have caught it.

| field | state |
|---|---|
| Version | renamed **1.6.1 → 1.7.0** (1.6.1 was never submitted, so nothing was lost) |
| Promotional Text | 166 / 170 chars — was EMPTY |
| What's New | 892 chars — was EMPTY |
| Description | 3690 chars — one line corrected, see below |
| Screenshots | all 8 replaced, order verified |
| Build | **not attached** — 1.7.0 is not uploaded. Alex's call. |
| Add for Review | **NOT clicked.** |

## ⚠️ The description said "surname"

> One footballer's **surname**, six guesses…

The tenth instance of the promise the mononym sweep removed from the code, and
the only one on a store page. Now "One footballer's **name**, six guesses".
The pool holds 33 mononyms; "surname" is why losing on WILLIAN felt unfair.

## ⚠️ Two of the eight live screenshots showed superseded UI

- `03-club-picker` grouped by **league** — "PREMIER LEAGUE 23 / LA LIGA 8" — the
  exact organisation Alex told us to replace. The store was advertising a bug we
  had already fixed. Now ENGLAND & WALES / SPAIN / ITALY, 86 clubs not 76.
- `02-footle` showed the app header reading **"Guess the surname"**.

## ⚠️ How to upload screenshots without breaking them

Two failure modes hit on the first attempt, both silent:

1. **The count lies until you reload.** After uploading, the page said "8 of 10"
   while nothing had committed; a reload showed **0 of 10**. Reloading too soon
   aborts the in-flight upload. Wait, THEN reload, THEN believe the count.
2. **Uploading all 8 at once scrambles the order** — they land in completion
   order, and Apple uses the first 3 on install sheets. Upload ONE AT A TIME
   with a pause between each.

## Copy as applied

### Promotional Text (166)
The football quiz for people who actually watch football. A new Footle, Transfer Trail and Mystery Player every day — written and fact-checked by fans, never scraped.

### What's New (892)
This one is polish rather than new modes — the rough edges you told us about.

• Transfer Trail and Mystery Player — the keyboard no longer sits on top of the list of names. Drag the list and it gets out of your way.
• Names are accepted the way you would actually type them, including names like Son Heung-min.
• Club Quiz is grouped by country now, so your club is where you would look for it.
• Reporting a question asks what was wrong with it — the answer, the wording, or that it gave itself away.
• The moment right after you answer looks like part of the game again, instead of a form error.
• Every button acknowledges your tap.
• A club appearing twice in a career is marked as a return, so it no longer reads as a mistake.
• Footle asks for "the name a footballer goes by", because sometimes it is Pelé.

Thank you to everyone who flagged a bad question. Every one of them was read.

### Screenshot order (first 3 are the install sheet)
1. 01-home — "How good is your Ball IQ, really?"
2. 02-footle — "A new Footle every day"
3. 03-club-picker — "Your club, your quiz"
4. 04-transfer-trail · 5. 05-quiz-explanation · 6. 06-profile
7. 07-mystery-player · 8. 08-daily-chips

## Still open on this listing
- **Play Store listing almost certainly carries the same "surname" line.** Not checked yet.
- 0 of 3 App Previews (video) — never made.
- Release type is **AFTER_APPROVAL** (auto-release once Apple approves).
  Consider MANUAL given the caution around this release.
- **Phased release is OFF.** For 500+ installs and a build carrying new native
  keyboard code, phasing over 7 days is a cheap safety net.

---

# Google Play — checked 2026-08-24

App: `Ball IQ: Football Quiz`, dev `5466165386978897518`, app `4976141665883518498`.

## ✅ Fixed and STAGED (not live yet)
The full description carried the **same** line as the App Store one:

> One footballer's **surname**, six guesses…

That is instance ELEVEN of the promise the mononym sweep removed. Corrected to
"One footballer's **name**". 2661 → 2658 chars, verified by reload.

⚠️ Play **stages** listing edits rather than publishing them: the page now says
*"Endringene kan sendes inn for gjennomgang"* (changes can be submitted for
review). **Alex still has to send it.** Saving is not publishing here — which is
the opposite of the assumption that would have made this risky.

Short description ("Football quiz and soccer trivia…", 74/80) is clean.

## ⚠️ NOT done — screenshots, and why
All THREE Play sets are stale in the same way the Apple set was: `03-club-picker`
shows **PREMIER LEAGUE 23 / LA LIGA 8** and "Search 76 clubs". Sets are
phone · 7" tablet · 10" tablet, **8/8 each = 24 slots**.

Fresh 1080x1920 frames are built and committed at `screenshots/android/`
(regenerated from the same build-77 raws the Apple set used).

**They could not be uploaded programmatically.** Unlike App Store Connect, which
keeps a hidden `input[type=file]` in the DOM permanently, Play Console has NO
file input anywhere — not in the light DOM and not in any shadow root. It creates
one only in response to a real click on "Legg til elementer", which opens the
native OS file picker, and that dialog cannot be driven from the page.

So this one is a drag-and-drop job: open the listing, drop
`screenshots/android/01…08` onto each of the three sets. Order matters least on
Play, but keep 01-home first.

## 2026-08-26 — three corrections applied to the live 1.7.0 listing

Applied via App Store Connect and verified by full page reload. Build was
not attached and Add for Review was not clicked.

### ⚠️ The description advertised a mode that does not exist

> `- Ball IQ Test — 15 calibrated questions produce a score from 60 to 160.`

**Ball IQ Test was killed on 2026-08-11** (commit `04303db`, "kill Ball IQ
Test mode"). The App.jsx mode went then; the HomeScreen tile outlived it and
was removed later because it "silently started an unbranded generic quiz".
The store listing was never updated, so for fifteen days the product page
advertised a mode a new installer could not find.

Caught by accident: the zero-state work needed somewhere to send a new user,
the description named the Ball IQ Test as the mode that produces the rating,
and grepping for it found only a gravestone comment. Every other claimed mode
was then checked against the code — daily, classic, survival, hotstreak,
online, local, legends, chaos, stadiums are all live. One false claim, now
removed (3,784 → 3,684 chars).

This is the SECOND time this listing has carried a stale claim, and it is the
exact failure this file was created to prevent. **The console is not version
control, and nothing in the build gate reads it.** Worth a script that diffs
the GAME MODES block against the mode keys in HomeScreen.jsx.

### What's New claimed 1.7.0 had no new modes

> "This one is polish rather than new modes"

`StadiumGame.jsx` was added 2026-08-20, and 1.6.0 was approved on the 19th —
so Stadiums IS new in 1.7.0, and the app badges it NEW on the Home screen.
Opener is now "One new mode, and a long list of rough edges you told us
about.", with a Stadiums bullet added at the top of the list.

### Stadiums was missing from GAME MODES

Added: `- Stadiums — name every ground in five leagues, one at a time. A
completion run, not a timer.` (Premier League, La Liga, Serie A, Bundesliga,
Ligue 1 — 96 grounds.)

### Screenshot review (not yet applied)

- `04-transfer-trail` is the weakest of the eight: ~18% dead black space
  below the content, the in-app "Career looks wrong? Tell us" button visible
  in a marketing shot, and three red rows that read as failure on a screenshot
  headed "Solved".
- **No multiplayer screenshot exists**, though the promo text sells live 1v1
  and the description lists Online Multiplayer. Two slots are free (8 of 10).
- No Stadiums screenshot either, now that it is a shipped, advertised mode.

## 2026-08-26 — Google Play, main store listing

App `4976141665883518498` (Ball IQ: Football Quiz). Checked the header read
"Ball IQ", not Tide, before touching anything — per the warning at the top of
this file.

- **Play never carried the Ball IQ Test claim.** That stale mode was iOS-only;
  the Play description has no mention of it. Nothing to remove.
- **Stadiums was missing**, so a `📍 NAME THE STADIUM` section was added before
  the club section (🏟️ is already taken by "A QUIZ FOR YOUR CLUB"). 2,658 →
  2,902 chars of 4,000.
- This matters more on Play than on Apple: Play indexes the full description,
  so "stadium", "ground" and the five league names are a ranking surface here,
  where on Apple the description is conversion-only.
- **Saved as a draft** ("Lagre som utkast"), verified by full page reload.
  Nothing submitted for review.

⚠️ The console already showed "Ikke sendt til gjennomgang ennå" BEFORE this
change — there were pending listing edits from 24 Aug. Whatever ships next
will carry those too; check what they are before submitting.
