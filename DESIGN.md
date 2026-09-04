---
name: Ball IQ — The Fixture List
description: A dark, calm football site where every page is a list of things to play — one header, one frame, one accent spent only on Play.
colors:
  bg: "#0B0C10"
  bg-raised: "#0F1116"
  card: "#13151C"
  card-inset: "#1B1E27"
  border: "#242730"
  border-strong: "#2F3240"
  border-loud: "#3E4150"
  text: "#F0F1F5"
  text-secondary: "#9BA0B8"
  text-muted: "#7E828C"
  green: "#58CC02"
  green-ink: "#06230C"
  green-soft: "#8AE042"
  amber: "#FFC107"
  wrong: "#FF4747"
  hairline: "rgba(255,255,255,.07)"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(30px, 4.4vw, 46px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.4
  meta:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
  input:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
  wordmark:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    letterSpacing: "0.06em"
  counter:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1
rounded:
  tile: "5px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "36px"
  xxl: "48px"
components:
  button-play:
    backgroundColor: "{colors.green}"
    textColor: "{colors.green-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  button-play-large:
    backgroundColor: "{colors.green}"
    textColor: "{colors.green-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 22px"
  button-quiet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  card-hover:
    backgroundColor: "{colors.card-inset}"
    textColor: "{colors.text}"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 13px"
  input-search:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px 0 38px"
  answer-option:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    typography: "{typography.title}"
    rounded: "{rounded.xl}"
    padding: "14px"
  header:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    height: "60px"
  app-bar:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.title}"
    height: "46px"
---

# Design System: Ball IQ — The Fixture List

## Overview

**Creative North Star: "The Fixture List."** Ball IQ is a football quiz website that is the product, not a pitch for one. Every page is a list of things to play, arranged the way a fixture list is: what is on today first, then everything else you can find. A visitor from Google lands on a club quiz and sees the same header, the same search box and the same footer as the homepage; a returning player sees today's four puzzles with their state. Nothing shouts. There is one accent, and it is spent on exactly two things: the Play button and a correct answer.

This system replaced the "Scouting Report" world on 2026-09-03 after the owner rejected it and its three proposed successors as generated-looking. It was rebuilt from a field study of thirteen quiz and sports-puzzle sites (memory: `project_quiz_sites_field_study`), whose findings are the rules below: a website prints the date, puts its whole catalogue on the page as links, keeps the browser's own scroll, has no marketing button in its header, and keeps prose above the fold to a line or two.

**Key characteristics**
- Dark throughout, on the app's own tokens. No lifted blacks, no gradients, no glows, no grain.
- One header for the website, the generated pages and the app in a browser: wordmark, five section links, the club-and-league finder, Sign in or Profile. No call to action lives in the header.
- One card anatomy, used for today's puzzles, every game, clubs and lists alike: an icon or dot, a name, one line, a state or an arrow.
- Inter for everything a person reads. JetBrains Mono only for counters inside a game.
- The browser owns the scroll. Nothing is an inner-scrolling app shell on the web.

## Colors

The palette is the app's, defined once in `src/design/tokens.js` and emitted into every generated page by `rootCss()`; `src/design/front.css` and `scripts/seo/shell.mjs` name the same values locally.

### Surfaces, darkest to lightest
- **bg** `#0B0C10` — the page.
- **bg-raised** `#0F1116` — the footer and alternating bands.
- **card** `#13151C` — every card, chip, input and dropdown.
- **card-inset** `#1B1E27` — a card's hover state, and surfaces inside a card.

Lifted one step on 2026-09-04. The previous ground (`#0A0A0A` / `#0F1117` / `#14161E`) put the page and its cards five points apart, so on an OLED they were one black and every edge had to be drawn as a border — a page made of outlines, which Alex read on his phone as "not modern". The three surfaces are now three visible steps and the borders are hairlines one step above the surface they sit on. Chosen from an A/B of the Footle band (as shipped · filled tiles · filled tiles + this ground); the game's tiles and the practice board are filled `card-inset` with 8px corners for the same reason.

### Lines
- **border** `#242730` — every card, input and divider. One weight, 1px.
- **border-strong** `#2F3240` — a card's hover border, a focused input.
- **border-loud** `#3E4150` — reserved for the rare emphasised outline.
- **hairline** `rgba(255,255,255,.07)` — the edge of a filled tile on `card-inset` (the practice board, the lead card's miniature). Alpha rather than a hex so it reads the same on any of the three surfaces.

### Text
- **text** `#F0F1F5` — headings, names, the current tab.
- **text-secondary** `#9BA0B8` — one-line descriptions, section links, tabs at rest.
- **text-muted** `#7E828C` — captions, dates, edition numbers, placeholder text.

### The accent
- **green** `#58CC02` with **green-ink** `#06230C` on it — the Play button, a correct answer, the active tab's rule, a "done" state, a notification dot. Nothing else.
- **green-soft** `#8AE042` — the hover fill of a green link, and green as text on a dark surface where the full green would fail contrast.
- **amber** `#FFC107` — a streak, a "near" state, the Daily 7's tint. Never a call to action.
- **wrong** `#FF4747` — an incorrect answer.

### Club colours are data, not tokens
A club's colour comes from its pack (`CLUB_PACKS` in `src/App.jsx`, resolved through `src/lib/clubColour.js` and baked into `src/marketing/clubIndex.js` at build time). It appears as a 12px dot on a club card and as the badge on a club page. It never colours a button.

### Named rules
**The One Accent Rule.** Green means "press this to play" or "you got it right". A page with more than one green control per screen is a page that has stopped ranking its own actions. Every-game cards therefore carry a grey arrow, not a green pill; only today's four carry Play.

**Grey-on-grey has a floor.** Body copy is `text-secondary` on `card` (7.1:1); captions are `text-muted` on `bg` (4.6:1). Nothing readable goes below 4.5:1, and nothing under 12px is user-facing text.

## Typography

**Body and display face:** Inter, weights 400 / 600 / 700 / 800. One family for everything a person reads; personality comes from weight and size, not from a second face.
**Counter face:** JetBrains Mono, 700, only for numbers a player watches change inside a game: "Q 01 / 10", a timer, a streak. Never in chrome, breadcrumbs, eyebrows or stat strips.

### Hierarchy
- **Display** (800, `clamp(30px, 4.4vw, 46px)`, line-height 1.05, −0.02em): the page's `h1`, sentence case, left-aligned on the same edge as everything below it.
- **Section** (800, 22px, −0.02em): "Today", "Your club", "Every game", "Lists and records", and every `h2` on a generated page.
- **Title** (700, 15px, −0.01em): a card's name, an answer option, a tab.
- **Body** (400, 15px, line-height 1.5): running prose. Kept to 0–2 sentences above the fold on any page.
- **Caption** (400, 13.5px): the one line under a card's name; a section's subtitle.
- **Meta** (600, 12.5px): states ("Not played", "3 of 7"), edition numbers, "checked 20 July".
- **Label** (700, 12px, 0.06em, uppercase): footer column headings and the eyebrow above an `h1`. The only uppercase treatment in the system, and it is always a field label, never a slogan.
- **Input** (600, 16px): text a person types — the club finder and every field after it. Not a taste decision: iOS zooms the page on focus for anything under 16px, so this step exists to stop the viewport jumping, and it may not be tuned down to fit the ramp.
- **Lead** (700, 20px, −0.02em): the name on the homepage's one lead card. Bigger than a Title so the card leads, smaller than the Section above it so it does not compete with "Today".
- **Wordmark** (800, 18px, −0.01em): "Ball IQ" beside the crest in the site header, and nowhere else. The one size that is neither Title nor Section, because the mark must read at a glance next to a 28px crest without competing with an `h1`.

### Named rules
**Sentence case everywhere.** Uppercase exists only in the 12px label. Headlines are sentence case at 800 weight; the condensed, tracked, all-caps headline is the retired system's signature and must not return.

**Tabular numerals wherever numbers align**: countdowns, "N of 4", entry counts, stat strips.

## Layout

One frame: `max-width: 1200px`, padding `clamp(20px, 4vw, 44px)`. The site header, the app bar, every generated page's `main`, and the app's content column at desktop all use it, so the left edge is the same on every page and on every screen inside the app.

**One left edge.** Headings, prose, cards and tables share the frame's left edge. A narrow reading measure (`.narrow`, 760px) limits line length but is never centred inside the wide frame.

**Section rhythm:** 26px above a section, a 14px gap between its heading row and its content, 8–10px gaps between cards. Sections are separated by air, not by rules or background bands.

**Grids:** today's four as a lead card (Footle, with its live board) beside three compact rows; every game in three columns; clubs in four; lists in two. All collapse to one column under 720px, clubs to two; the lead stacks its board under its text.

**The browser owns the scroll.** No inner-scrolling shells, no fixed sidebars, no floating tab bars on the web. Native apps and installed PWAs keep their sidebar and tab bar; `body.biq-web` is the switch.

**Header:** one row, 60px (56px under 720px), sticky. Wordmark · Today · Games · Clubs · Quizzes · Lists · a 420px search field · Sign in. Under 720px the section links fold behind a menu and the search fills the row.

**App bar (browser only, inside the app):** one row, 46px, sticky under the header: Play · Daily · Online · Profile, then notifications and Settings on the right. The current tab carries a 2px green rule.

## Elevation & Depth

Flat. Depth is expressed by surface tone, not by shadow: `bg` → `card` → `card-inset`, and a 1px `border` around anything that can be pressed. The only shadows in the system are the search dropdown's (`0 18px 44px rgba(0,0,0,.55)`) and, inside the game, the app's own card shadow tokens. There are no glows behind heroes or buttons, no gradients on bands, no grain.

## Shapes

Miniature tiles (the lead card's 22px board, the legend swatches) use the `tile` radius, 5px — a quarter of their size, the same proportion 8px is on the game's larger tiles.

Radii come from a five-step scale and every element sits on one step: 8px for small controls and icon tiles, 10px for inputs and list rows, 12px for cards, 14px for the game's answer options and cards, and a pill for buttons, chips and tags. Nothing is square-cornered and nothing is rounder than 14px except a pill. Borders are 1px (1.5px on an answer option, 2px on a selected difficulty).

## Components

- **Play button** — green fill, green-ink text, pill, 36px in a card and 44px standalone, weight 700–800. One per card at most, and only on a card that starts a game.
- **Quiet button** — `card` fill, `border-strong` outline, pill, 40px: "Every club on file", "Search for one".
- **Today row** — the four daily games as four equal `card` rows: mode chip · name and edition number · one line · state · a green Play. Each chip carries its mode's colour from the app's `MODE_ACCENT` set (14% tint, 30% ring), and Footle's chip is the game itself: a two-row worked example graded by the real engine, letters and all, in the same 38px footprint. Chosen over a lead card with a live board on 2026-09-04 — the board led with forty-two empty outlines for a newcomer and read as assembled, not designed. The rows are what Alex liked; the chips and the miniature are the spice.
- **Card** — `card` fill, 1px `border`, 12px radius, 12–14px padding, grid of icon · body · action. Hover lifts the fill to `card-inset` and the border to `border-strong`. Used for today's puzzles, every game, clubs and lists.
- **Chip** — `card` fill, pill, 36px, caption-size text in `text-secondary`: leagues, "All 89 clubs".
- **Search field** — `card` fill, 10px radius, 40px, a 20px search icon at 12px, 16px input text (the iOS zoom floor). Results drop from the field in a `card` panel with 44px rows: name · context · a green "Play".
- **Answer option** — `card` fill, 1.5px border, 14px radius, 14px padding, a 22–28px letter key on the left; correct turns the key green, wrong turns it red.
- **Tab** — text-secondary at rest, text on hover, a 2px green rule when current.
- **Footer** — `bg-raised`, a seven-column sitemap under 12px labels, the app-store links as plain text at the end of the last column, one line of disclaimer.
- **State chip** — meta-size text: "Not played" in `text-muted`, "In progress" in amber, "Solved" or a score in green.

## Do's and Don'ts

**Do**
- Print the date and today's edition numbers on the homepage, and a checked date on every list.
- Put every game, club, league and list on the page as a real link; the footer is a sitemap.
- Keep the same header, frame and footer on the homepage, every generated page and the app in a browser. `src/marketing/SiteHeader.jsx` and `scripts/seo/shell.mjs` must stay in step by hand.
- Show a club's colour as a dot or badge, from data.
- Leave the rating empty until a player has answered something.

**Don't**
- Put a marketing button in the header, or store badges anywhere above the footer's last column.
- Use a second display face, uppercase headlines, or monospace outside a game counter.
- Add a glow, a gradient band, grain, or a tilted sheet.
- Spend green on anything that is not Play or correct.
- Print a question count, a fabricated rating, or a "people are playing" number that is not measured.
- Render an inner-scrolling shell, a sidebar or a floating tab bar on the web.
