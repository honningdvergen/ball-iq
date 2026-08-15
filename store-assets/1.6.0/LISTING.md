# Ball IQ 1.6.0 — store listing (paste-ready)

Built 2026-08-15. iOS build **63**, Android **versionCode 18**, both `1.6.0`.
Screenshots: `screenshots-6.9/` — 8 framed PNGs at 1284×2778 (6.9" / 6.5" slot).

⚠️ THREE RULES THIS COPY OBEYS, all learned the hard way:
1. **No question counts, no mode counts.** Binding rule, gated by
   `scripts/audit-no-question-count.mjs`. The live listing still says "4,000+
   questions across 10 game modes" — both numbers are now wrong, and a number in
   a screenshot or description cannot be edited without a new upload, so it rots
   in public. Sell breadth instead ("Real Madrid to Hajduk Split").
2. **No FIFA, no World Cup.** 1.3.3 was rejected under Guideline 5.2.1 for
   exactly this. Web SEO keeps the phrase; the app listing must not.
3. **Never claim every answer is explained.** Measured coverage is ~78%, not
   100%. "Most answers explained" is the honest form and is what ships.

---

## App name  (30 char limit)

```
Ball IQ - Football Quiz
```
23 chars. Was "Ball IQ - Football Trivia".

⚠️ **This forces a subtitle change.** Apple indexes name + subtitle + keywords
and a word repeated across fields is wasted — it does not rank you twice. The
current subtitle is "The Ultimate Football Quiz", which would now repeat BOTH
"Football" and "Quiz". Every word in the subtitle below is new to the pair.

## Subtitle  (30 char limit)

```
Daily puzzles & club trivia
```
27 chars. Adds four fresh terms: daily · puzzles · club · trivia.

## Promotional text  (170 char limit — editable without review)

```
New: Mystery Player and Transfer Trail. Four daily puzzles, one football brain. Guess the secret player, name him from his career, and keep the streak alive.
```
156 chars.

## Description

```
Ball IQ — Football Quiz

Every football question here is written and checked by football fans, never auto-generated. From the Premier League to the Eredivisie, from the Lisbon Lions to last night — Ball IQ has the depth real fans demand.

FOUR DAILY PUZZLES
• Footle — the daily football word game. One surname, six guesses, everyone gets the same player.
• Daily 7 — seven fresh questions, marked instantly. Green right, red wrong.
• Transfer Trail — name the player from his career, one club at a time. Fewer clubs, more credit.
• Mystery Player — every guess is ranked against the secret player. Rank 1 is the answer, nothing else is.

PLAY YOUR CLUB
Pick your team and face questions written about them, from Real Madrid to Hajduk Split. Or take a whole league — Premier League, La Liga, Serie A, Bundesliga, Ligue 1.

PLAY YOUR MATES
• Live rooms for up to eight players
• Pass-and-play on a single phone
• Share any result as a spoiler-free grid

BUILT FOR PEOPLE WHO ACTUALLY WATCH
• Most answers come with the story behind them, not just a tick
• A streak worth defending, and a rating that moves with your form
• Free to play, no sign-up needed to start
```

## What's New in This Version

```
Mystery Player and Transfer Trail are now part of your daily four.

• Mystery Player: type two letters and pick from a ranked list — no more spelling a name perfectly to make a guess.
• Transfer Trail: the same instant name search, so a guess is never lost to a typo.
• A much sharper ranking. Guess a keeper from the same era as the answer and it now reads warm, as it should.
• Thousands of players had an old club against their name. Fixed — Bayern is Bayern again.
• Fixed a bug where the app could hang on the loading screen with no connection.
```

---

## Reused vs new screenshots

| file | status |
|---|---|
| 01-home | re-shot (current Home) |
| 02-footle | **reused** — Alex: "looks alright as is" |
| 03-club-picker | re-shot |
| 04-transfer-trail | **NEW** — played to a win on the last of five attempts |
| 05-quiz-explanation | re-shot |
| 06-profile | re-shot |
| 07-mystery-player | **NEW** — solved on the sixth guess, rank ladder visible |
| 08-daily-chips | **NEW** — Alex's ask: the green/red chip run, 5 ✓ 7/7 |

⚠️ 08 stops ON the last question rather than the results page. Finishing the
daily as a guest raises the "Save your progress" auth sheet, and it appears
AFTER the screen assertion runs — the check went green while the captured frame
was the sign-up sheet. The question frame is also the better advert: it carries
the chip run, a live question and "✓ Correct!" in one view.

## Still to do (Alex)

- Upload build 63 from Xcode Organizer.
- Paste the name/subtitle/promo/description above into App Store Connect.
- Replace the six current screenshots with the eight here.
- Android: `versionCode 18` AAB is not yet built — say the word.
