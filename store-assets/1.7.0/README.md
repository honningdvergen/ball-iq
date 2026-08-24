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
