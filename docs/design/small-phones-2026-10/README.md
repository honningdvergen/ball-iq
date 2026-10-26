# Daily game pages on small phones — 26 Oct 2026

/football-wordle/ (Footle), /transfer-trail/, /mystery-player/ and each game's finish
panel, measured at **320x568** and **360x740** in **WebKit and Chromium** (Playwright
1.59, `isMobile`, DPR 2, reduced motion, consent pre-answered, all off-origin requests
blocked so fonts fall back). Built `dist/` served by a static server that maps `dir/` to
`dir/index.html`. Base: origin/main ac7913bd.

Finish states were reached by playing: Footle six wrong rows, Trail five skips,
Mystery five guesses then Give up (twice). "two-guesses"/"two-misses" are mid-game;
Footle "typing" is three letters in the first row, no ENTER.

Screenshots: `<page>-<state>-<w>x<h>-<engine>.jpg` (viewport) and `…-full.jpg` (the whole game host, sticky header made static for the
shot). `before/` holds the Footle shots that the fix changed.

The finish-state screenshots were measured but **not committed**: they show the day's answers
(Footle, Trail #85, Mystery #85) and this repo is public. Their numbers are in the table below;
re-shoot them after the day has passed if images are wanted.

## Finding fixed: a lettered Footle tile was not square (src/games/footle.css)

`.wd-tile` had no line-height, so on the static page it inherited the body's 1.6: a
23.4px letter needed a 37px line inside a 25px box, and `aspect-ratio` yields to content.
A tile went **29.8×29.8 → 29.8×43.1 on the first letter typed** (360x740), every played
row grew ~12px, and ENTER slid off the bottom of the screen mid-game. Fix:
`line-height:1` on `.wd-tile` (centring is flex; the app inherits `normal` and gains the
same guarantee at its 26px tile floor).

| 360x740, both engines | ENTER before | ENTER after |
|---|---|---|
| load | y677–729, visible | y677–729, visible |
| 3 letters typed | y690–742, **12px below fold** | y677–729, visible |
| two guesses | y703–755, **15px below fold** | y677–729, visible |

At 320x568 the same fix stops ENTER moving (y616–662 at every state, was down to 680).

## Found, not fixed (outside the pages' own CSS)

1. **Footle ENTER at 320x568 is below the fold at load: bottom 662 on a 568 screen
   (94px), both engines.** The hero takes 57–161 (the 22px h1 wraps to two lines at
   320, plus a two-line lead) and the board's tile floor is 28px. Both are set in
   `FW_TODAY_CSS` in `scripts/gen-seo-pages.mjs` (off-limits here). The keyboard alone
   can't buy back 94px without going under 44px keys; it needs a short-screen rule in
   that block (e.g. at `max-height:600px` hide `.hero-lead`, let the tile floor drop).
2. **Footer sitemap links are cut mid-word by `text-overflow:ellipsis`** (shared footer
   template, `.fd-foot-col a`). 320px (127px column): "Today's Footle answer" 143px,
   "Trivia memory study" 130px, "Bundesliga Top Scorers by Season (1963-64 to 2025-26)"
   366px, "Champions League Top Scorer Every Season (…)" 431px, "Clubs With the Most
   Coupe de France Titles" 281px, "Copa del Rey Winners (1902–2026)" 225px. 360px (147px
   column): the last four. Same on every page.
3. **Next-up card on all three finish panels at 320px:** the text column is 90px wide,
   so "Today's Footle"/"Today's Daily 7" takes 2 lines and the hook 4 (at 360: 130px,
   1 and 2 lines). Nothing clips or overlaps, so left as a design call for
   `components/dailyDone.css` (e.g. drop the 44px well under ~340px).

No horizontal overflow anywhere (scrollWidth − clientWidth = 0 in all 48 cases), no
element wider than the viewport (the off-screen `a.fd-skip` skip link excluded), no
clipped text inside the games, and no overlapping boxes among 105–184 text and
interactive elements checked per case.

## Measurement table

Overflow = `document.scrollingElement.scrollWidth − clientWidth`. ENTER box is the
`.wd-key-enter` rect at scrollY 0 against the viewport (568 or 740 tall). Clipped =
elements with `overflow-x` hidden/clip or `text-overflow:ellipsis` whose scrollWidth
exceeds clientWidth (footer links counted apart). Overlaps = pairs of visible buttons,
links, inputs, headings and text leaves (not tiles; not ancestor/descendant) whose
boxes intersect by more than 1px each way.

| Page | State | Size | Engine | Overflow px (scrollW−clientW) | Elements wider than viewport | Footle ENTER fully visible (before → after) | Worst tile w×h (before → after) | Clipped text in game (+footer) | Overlaps | Next-up body width · name/hook lines |
|---|---|---|---|---|---|---|---|---|---|---|
| footle | load | 320x568 | chromium | 0 → 0 | 0 → 0 | **no** y615.9–661.9 x6–314 → **no** y615.9–661.9 x6–314 | 28×28 → 28×28 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| footle | typing | 320x568 | chromium | 0 → 0 | 0 → 0 | **no** y625.1–671.1 x6–314 → **no** y615.9–661.9 x6–314 | 29.1×38.8 → 29.1×29.1 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| footle | two-guesses | 320x568 | chromium | 0 → 0 | 0 → 0 | **no** y634.4–680.4 x6–314 → **no** y615.9–661.9 x6–314 | 28×37.3 → 28×28 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| footle | finish-lost | 320x568 | chromium | 0 → 0 | 0 → 0 | — | 36.6×36.6 → 36.6×36.6 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | 90px · 2/4 |
| trail | load | 320x568 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| trail | two-misses | 320x568 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| trail | finish-lost | 320x568 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | 90px · 2/4 |
| mystery | load | 320x568 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| mystery | two-guesses | 320x568 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| mystery | finish | 320x568 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | 90px · 2/4 |
| footle | load | 360x740 | chromium | 0 → 0 | 0 → 0 | yes y677.4–729.4 x6–354 → yes y677.4–729.4 x6–354 | 28.7×28.7 → 28.7×28.7 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| footle | typing | 360x740 | chromium | 0 → 0 | 0 → 0 | **no** y690.2–742.2 x6–354 → yes y677.4–729.4 x6–354 | 29.8×43.1 → 29.8×29.8 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| footle | two-guesses | 360x740 | chromium | 0 → 0 | 0 → 0 | **no** y703–755 x6–354 → yes y677.4–729.4 x6–354 | 28.7×41.4 → 28.7×28.7 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| footle | finish-lost | 360x740 | chromium | 0 → 0 | 0 → 0 | — | 38×38 → 38×38 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | 130px · 1/2 |
| trail | load | 360x740 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| trail | two-misses | 360x740 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| trail | finish-lost | 360x740 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | 130px · 1/2 |
| mystery | load | 360x740 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| mystery | two-guesses | 360x740 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| mystery | finish | 360x740 | chromium | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | 130px · 1/2 |
| footle | load | 320x568 | webkit | 0 → 0 | 0 → 0 | **no** y615.9–661.9 x6–314 → **no** y615.9–661.9 x6–314 | 28×28 → 28×28 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| footle | typing | 320x568 | webkit | 0 → 0 | 0 → 0 | **no** y625.1–671.1 x6–314 → **no** y615.9–661.9 x6–314 | 29.1×38.8 → 29.1×29.1 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| footle | two-guesses | 320x568 | webkit | 0 → 0 | 0 → 0 | **no** y634.4–680.4 x6–314 → **no** y615.9–661.9 x6–314 | 28×37.3 → 28×28 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| footle | finish-lost | 320x568 | webkit | 0 → 0 | 0 → 0 | — | 36.6×36.6 → 36.6×36.6 | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | 90px · 2/4 |
| trail | load | 320x568 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| trail | two-misses | 320x568 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| trail | finish-lost | 320x568 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | 90px · 2/4 |
| mystery | load | 320x568 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| mystery | two-guesses | 320x568 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | — |
| mystery | finish | 320x568 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+6 footer) → 0 (+6 footer) | 0 → 0 | 90px · 2/4 |
| footle | load | 360x740 | webkit | 0 → 0 | 0 → 0 | yes y677.4–729.4 x6–354 → yes y677.4–729.4 x6–354 | 28.7×28.7 → 28.7×28.7 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| footle | typing | 360x740 | webkit | 0 → 0 | 0 → 0 | **no** y690.2–742.2 x6–354 → yes y677.4–729.4 x6–354 | 29.8×43.1 → 29.8×29.8 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| footle | two-guesses | 360x740 | webkit | 0 → 0 | 0 → 0 | **no** y702.9–754.9 x6–354 → yes y677.4–729.4 x6–354 | 28.7×41.4 → 28.7×28.7 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| footle | finish-lost | 360x740 | webkit | 0 → 0 | 0 → 0 | — | 38×38 → 38×38 | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | 130px · 1/2 |
| trail | load | 360x740 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| trail | two-misses | 360x740 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| trail | finish-lost | 360x740 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | 130px · 1/2 |
| mystery | load | 360x740 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| mystery | two-guesses | 360x740 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | — |
| mystery | finish | 360x740 | webkit | 0 → 0 | 0 → 0 | — | — | 0 (+4 footer) → 0 (+4 footer) | 0 → 0 | 130px · 1/2 |
