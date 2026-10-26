# Declutter: Mystery Player and Transfer Trail (26 Oct 2026)

Alex, 23 Oct: "remove redundant stuff that just wants attention". Reduction and
hierarchy only: same tokens, same components, no new i18n keys, no schedule or
answer touched.

Shots are the static pages (`/mystery-player/`, `/transfer-trail/`) from the
built `dist/`, 375px wide, in Chromium and WebKit (Playwright), on 26 Oct
(Mystery No. 85, Trail #85). Same guesses before and after. Mid-game Mystery is
five guesses in; mid-game Trail is two misses and a skip.

| State | Before | After |
|---|---|---|
| Mystery, before the first guess | [Chromium](mystery-1-pre-guess-before-chromium.jpg) · [WebKit](mystery-1-pre-guess-before-webkit.jpg) | [Chromium](mystery-1-pre-guess-after-chromium.jpg) · [WebKit](mystery-1-pre-guess-after-webkit.jpg) |
| Mystery, mid-game | [Chromium](mystery-2-mid-game-before-chromium.jpg) · [WebKit](mystery-2-mid-game-before-webkit.jpg) | [Chromium](mystery-2-mid-game-after-chromium.jpg) · [WebKit](mystery-2-mid-game-after-webkit.jpg) |
| Mystery, finish | [Chromium](mystery-3-finish-before-chromium.jpg) · [WebKit](mystery-3-finish-before-webkit.jpg) | [Chromium](mystery-3-finish-after-chromium.jpg) · [WebKit](mystery-3-finish-after-webkit.jpg) |
| Trail, before the first guess | [Chromium](trail-1-pre-guess-before-chromium.jpg) · [WebKit](trail-1-pre-guess-before-webkit.jpg) | [Chromium](trail-1-pre-guess-after-chromium.jpg) · [WebKit](trail-1-pre-guess-after-webkit.jpg) |
| Trail, mid-game | [Chromium](trail-2-mid-game-before-chromium.jpg) · [WebKit](trail-2-mid-game-before-webkit.jpg) | [Chromium](trail-2-mid-game-after-chromium.jpg) · [WebKit](trail-2-mid-game-after-webkit.jpg) |
| Trail, finish | [Chromium](trail-3-finish-before-chromium.jpg) · [WebKit](trail-3-finish-before-webkit.jpg) | [Chromium](trail-3-finish-after-chromium.jpg) · [WebKit](trail-3-finish-after-webkit.jpg) |

## Mystery Player

- **The four-band legend is gone.** Before the first guess it explained ranks
  nobody had yet. It does not come back later either: every guess row already
  carries its own word (boiling / warm / cold) and its share ("top 3%"), so the
  key is said where it is needed.
- **The clue values are the focus.** "Forward", "1940s" went from 13.5px to 19px.
  The label above each one went from 10px tracked violet capitals (under the
  system's 12px floor, and louder than the value) to a quiet 12px sentence-case
  word in muted grey. A clue on show is now a plain card, not a violet-tinted
  one, so the only violet tile is the one that wants a tap ("Tap to reveal").
- **"Lower is closer: the secret player is rank 1."** stays (the legend's one
  essential fact) but is white semibold, no longer bold violet.
- **The `?` rules button** is a plain icon button, not a violet-outlined one.
- **No CLOSEST readout in the header.** The list is sorted closest first, so
  its top row is the closest guess. The header no longer has to shrink the
  title to make room for it.
- **On the static page the masthead is the number alone.** "unlimited guesses"
  repeated the page's lead ("unlimited tries") right above it.
- **On the static page the reveal card drops its streak line.** The finish
  panel directly below opens with the same Mystery streak. In the app the panel
  shows the cross-mode daily streak instead, so the per-game line stays there.

## Transfer Trail

Looked at with the same eye, the Trail was already lean (the 16 Oct tidy pass
did most of it). Two things were said twice:

- **On the static page the masthead is "Trail #85" alone before the finish.**
  "name the player from their career" was the page's H1 and lead, said a third
  time. After the finish it still reads "Trail #85 · Solved".
- **On the static page "Got it on N clubs" no longer appends the Trail streak**,
  for the same reason as Mystery: the panel below opens with it. The app keeps it.

## One loud button

Nothing new is green. Pre-guess, neither screen has a filled button; mid-game
the loudest thing on Mystery is the ready clue, and on the Trail the input.
At the finish the one solid button is still the shared panel's Share.

## Left alone, worth a look

- Trail's guesses-left shows **pips and "5 guesses left"**. That is the same
  fact twice, but both were added on purpose after Alex's 12 Oct recording and
  a test pins them. Drop one if you agree.
- Trail's **amber hint box** (after three misses) is the loudest element
  mid-game. It is the best clue on the screen, so it kept its weight.
- Mystery's guess rows say the band **four ways** (tint, bar, word, rank
  colour). Quiet enough to keep for now.
- On the static pages the **Next up card** in the shared finish panel renders
  its text underlined (seen in Chromium; an `<a>` picking up the page's link style).
  Shared component, outside this change.
