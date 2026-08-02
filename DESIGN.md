---
name: Ball IQ — The Scouting Report
description: A dark desk carrying an oversized paper scouting report — near-monochrome ink and newsprint, with a single scout's attribute ramp as the only saturated colour.
colors:
  desk: "#0E1110"
  desk-shadow: "#161A17"
  desk-hairline: "#252B26"
  on-desk: "#C3CBC3"
  on-desk-hi: "#F2F5F1"
  on-desk-mute: "#98A199"
  newsprint: "#E7E9E4"
  newsprint-shade: "#DEE1DB"
  newsprint-track: "#D5D8D2"
  ink: "#14171A"
  ink-mute: "#4A524C"
  hairline-rule: "#B9BFB6"
  control-rule: "#7A8078"
  ramp-fail: "#8B2635"
  ramp-near: "#C9992B"
  ramp-pass: "#2F6B3A"
  verdict-0: "#8B2635"
  verdict-1: "#94472A"
  verdict-2: "#7E6318"
  verdict-3: "#5F6A22"
  verdict-4: "#46702E"
  verdict-5: "#2F6B3A"
typography:
  headline:
    fontFamily: "'Archivo Narrow', sans-serif"
    fontSize: "clamp(41px, 6.6vw, 88px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  section:
    fontFamily: "'Archivo Narrow', sans-serif"
    fontSize: "clamp(32px, 5.2vw, 60px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.018em"
  verdict-number:
    fontFamily: "'Archivo Narrow', sans-serif"
    fontSize: "clamp(102px, 13.4vw, 176px)"
    fontWeight: 700
    lineHeight: 0.74
    letterSpacing: "-0.035em"
  verdict-tier:
    fontFamily: "'Archivo Narrow', sans-serif"
    fontSize: "clamp(34px, 5.4vw, 66px)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.008em"
  lede:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.55
  sub:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.62
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  sec:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  meta:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.13em"
rounded:
  none: "0px"
spacing:
  s1: "8px"
  s2: "14px"
  s3: "22px"
  s4: "34px"
  s5: "52px"
  s6: "76px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.newsprint}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 26px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "#2B3136"
    textColor: "{colors.newsprint}"
  button-alt:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 26px"
    height: "52px"
  get-app-cta:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  answer-option:
    backgroundColor: "{colors.newsprint}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "14px"
    height: "52px"
  answer-option-hit:
    backgroundColor: "#E3EDE2"
    textColor: "{colors.ink}"
  answer-option-miss:
    backgroundColor: "#F1E3E4"
    textColor: "{colors.ink}"
  answer-option-dim:
    backgroundColor: "{colors.newsprint-shade}"
    textColor: "{colors.ink-mute}"
---

# Design System: Ball IQ — The Scouting Report

## Overview

**Creative North Star: "The Scouting Report"**

The page is not about a football test; the page IS the test, and it files a report on the person taking it. It rejects the category's stock furniture on sight — no dark hero with a phone mockup floating in it, no three-card feature triptych, no counted stat ("6,407 questions") printed as if size were the pitch. In its place: a near-black desk, grained like paper under raking light, with the scouting report itself lying on top of it as a physical, oversized sheet — wider than its own column, tilted a fraction of a degree, backed by a second sheet, casting a real double shadow. The report is not a card that happens to hold a quiz; the quiz is the report, and it fills itself in, in front of the reader, as they answer.

Everything that is not the report is desk: dark, quiet, near-monochrome, and flat. Everything that is the report is paper: ink on newsprint, ruled like a table, printed rather than glowing. The only place either surface is allowed a second colour is the one place a scout actually grades something — the pass/fail marks in the running ledger, the Footle board, and the verdict tier — and that colour is always the same scout's ramp, oxblood through amber to green, never a decorative accent borrowed for anything else. Action itself is never a fourth hue: a button is filled with whichever of ink or newsprint is NOT the ground it sits on, so the control is always the highest-contrast object available, not a brand-coloured one.

This was built by resonance-assignment (seed key `cf2f8891`, candidate 4 of 7), not by open-ended taste, and its own direction contract (top of `docs/mockups/scouting-d.html`) is the closest thing to a spec this world has. It was explicitly built against and rejected `home-final.html`, an earlier all-dark, no-paper direction kept in the same folder as an anti-reference.

**Key Characteristics:**
- Two grounds, not one: a dark desk (the world) and a lit paper sheet (the report), and every token belongs to exactly one of them.
- One saturated family in the whole system — the scout's ramp — appearing only where something is actually being graded.
- Zero border-radius anywhere in the file. Every edge is a hard corner; the only curves are the paper's own slight rotation.
- Motion exists only as feedback tied to the reader's own action (a bar filling, a verdict landing, a wrong Footle guess shaking) — never ambient, never on load, never decorative.
- Contrast is measured, not assumed: several rules in the CSS carry the exact ratio a prior attempt failed and the ratio the shipped version clears.

## Colors

The palette is built from two near-achromatic grounds plus a single accent family that is never used decoratively — it exists only to grade something.

### Primary
- **Scout's Ramp — Fail** (`#8B2635`, oxblood): the "wrong" mark across the whole system — running-report `0 of 1` text, the empty/red progress bar, Footle's "not in it" key state is a separate near-black tone, but a wrong quiz answer and a wrong verdict-0 score both use this exact red.
- **Scout's Ramp — Near** (`#C9992B`, amber): the middle mark — Footle's "right letter, wrong place" tile and key. This is the *screen* amber, and it reads only 2.13:1 against newsprint. That is not a defect, because it is never ink: `--r3` appears exclusively as a `background` and `border-color` on the dark Footle board, with its own dark text (`#1A1200`) sitting on top of it.
- **Scout's Ramp — Pass** (`#2F6B3A`, green): the "correct" mark — running-report `1 of 1` text, the filled progress bar, Footle's "right letter, right place" tile and key, and the verdict's best tier.
- **Verdict Ramp** (`--verdict-0` through `--verdict-5`): the same oxblood→amber→green family, rendered at **ink strength** for the one place the ramp is used as text on paper — the verdict number and the tier headline's rule, one step per score. It is not a second, unrelated scale. Measured in Lab, its hue sweeps monotonically through the same arc as the three-step ramp (20.1° → 46.7° → **85.9°** → 111.8° → 131.0° → 145.1°), and its amber stop `verdict-2` sits at hue 85.9° against `ramp-near`'s 82.6° — the same colour, three degrees apart. What differs is lightness, and only because it has to: `ramp-near` at L\*66.0 reads 2.13:1 on newsprint, while `verdict-2` at L\*43.4 reads 4.66:1. Every verdict stop clears 4.5:1 on paper (7.08 / 5.38 / 4.66 / 4.81 / 4.75 / 5.23).

### Neutral — Desk (the world)
- **Desk** (`#0E1110`): the page's base background, carrying a fine authored SVG grain. This is the ground for the masthead, hero, section bands, club index, Footle, and footer — everything that is not the report itself.
- **Desk Shadow** (`#161A17`): the one deliberately lighter band on the desk, used for the "Tomorrow" (Footle) section to give the eye a quiet, wide object to land on after a dense ruled passage.
- **Desk Hairline** (`#252B26`): every divider rule on the desk ground (masthead border, section rules, footer rule, Footle board dividers).
- **Desk Text — High** (`#F2F5F1`): headline, section headings (`h2`), and other peak text on the desk.
- **Desk Text — Body** (`#C3CBC3`): running prose on the desk (lede, sub-paragraphs).
- **Desk Text — Mute** (`#98A199`): secondary/supporting text on the desk (nav links, captions, club-index era text, Footle labels).

### Neutral — Paper (the report)
- **Newsprint** (`#E7E9E4`): the report sheet's own background — cool, not warm, and named "newsprint" rather than "cream" or "off-white" because the direction contract is explicit that this is cool paper, not warm parchment.
- **Newsprint Shade** (`#DEE1DB`): the zebra-stripe on alternating running-report rows, and the background a dimmed wrong-answer option recedes into.
- **Newsprint Track** (`#D5D8D2`): the empty track behind a progress bar.
- **Ink** (`#14171A`): the report's primary text colour, and — inverted — the fill colour for the assessment header band and every button that lives on paper.
- **Ink Mute** (`#4A524C`): secondary text on paper (subject-line captions, disqualified answer text, Footle-clock labels' desk equivalent is a different token — this one is paper-only).
- **Hairline Rule** (`#B9BFB6`): the *decorative* table rule — 1.53:1 against newsprint. Used only where a rule is separating rows of data, never where it is standing in for a control boundary.
- **Control Rule** (`#7A8078`): the *functional* rule — 3.31:1 against newsprint, meeting WCAG 1.4.11's 3:1 floor for a non-text control boundary. Used for answer-option borders and anywhere a rule is doing a button's job, not a table's.

### Named Rules
**The One Ramp Rule.** The only saturated colours anywhere in the system are the scout's ramp and its verdict variant. Nothing else — not a link, not a CTA, not a decorative flourish — is allowed a hue that isn't ink, paper, or desk.

**The Two Strengths Rule.** There is one ramp and two renderings of it, and which one you reach for is decided by the *ground and the job*, never by the component:

| | as a **fill** on the dark desk | as **ink** on newsprint |
|---|---|---|
| tokens | `--r1` `--r3` `--r5` | `--v0` … `--v5` |
| used by | Footle tiles and keys, chip fills, answer-option borders | the verdict number, the tier rule |
| contrast floor | text sits *on* the colour, so the fill is free | every stop must clear 4.5:1 on paper |

This is why `ramp-near` never needed an ink version of its own: it is the one stop that is never text on paper. `--r1` and `--r5` appear in both columns because they happen to clear 4.5:1 on newsprint unaided (7.08:1 and 5.23:1), so the fill value doubles as the ink value.

**The Same-Weight Rule Rule.** `hairline-rule` and `control-rule` are the same *visual* weight (both thin, both grey-green) but different jobs: one is furniture (a table row separator), the other is a control's boundary and is held to a harder contrast floor because a reader has to be able to find it to use it.

## Typography

**Display Font:** Archivo Narrow (bold, uppercase, tracked tight) — every headline, section heading, verdict number/tier, masthead wordmark, and countdown clock.
**Body Font:** Archivo (regular/medium) — every paragraph, question, answer option, table cell, and caption.

**Character:** A narrow, heavy display face doing all the shouting (headlines, the verdict, the clock) against a plain grotesque doing all the reading. The pairing reads like a back page and a team-sheet: bold masthead type over plain report type, never a third voice.

**Delivery:** both faces are embedded as base64 woff2 so the file renders identically with no network. Archivo is a **variable** font declared once across `font-weight:100 900`; Archivo Narrow is a single static 700, which is the only weight it is ever asked for. Archivo was previously declared three times — at 400, 600 and 800 — each carrying a byte-identical copy of the same variable payload (34,940 B, md5 `92895aba…`). Collapsing them to one declaration reproduced 400/600/800 to the pixel and cut the file 214,713 → 121,269 bytes (gzip −49.3%). It also *fixed* two weights: with only three pinned faces, CSS font-matching snapped `font-weight:500` down to the 400 face and `700` up to the 800 face, so the answer options and every uppercase micro-label were rendering at a weight nobody wrote. They now render at the weights this document specifies.

### Hierarchy
- **Headline** (700, `clamp(41px, 6.6vw, 88px)`, line-height .95): the page's own `h1` only — two lines, then straight into the question.
- **Verdict Number** (700, `clamp(102px, 13.4vw, 176px)`, line-height .74): the single largest object on the page. It only exists after the last question is answered, and it is coloured by the six-step verdict ramp.
- **Verdict Tier** (700, `clamp(34px, 5.4vw, 66px)`, line-height .94, 6px bottom rule in the verdict colour): the tier word ("Cone" through "Ballon d'Or") — sized to out-rank every section heading below it, which an earlier pass had gotten backwards.
- **Section** (700, `clamp(32px, 5.2vw, 60px)`, line-height .98): every `h2` — "Footle. Football Wordle.", "Seventy-two clubs on file". Deliberately kept under the verdict tier's size so the page's one true peak stays the peak.
- **Lede** (400, 20px, line-height 1.55): the one line under the headline.
- **Sub** (400, 18px, line-height 1.62): the paragraph under a section heading.
- **Body** (400, 17px, line-height 1.55): prose, answer options, and table data — the page's base size.
- **Sec** (400, 15px): supporting text — keys, the colophon-style footer, Footle labels.
- **Meta** (400, 13.5px): subject lines, counters ("1 of 5"), captions.
- **Label** (700, 12px, tracking .13em, uppercase): the single uppercase micro-label rule (`.dl`, `.adlab`, `.clab`, `.vlab`, `.why b`) — one rule shared by five different call-sites rather than five near-identical ones.

### Named Rules
**The Five-Plus-One Rule.** Five body-scale sizes (lede/sub/body/sec/meta) carry every prose job on the page; a sixth would be a size looking for a role. The uppercase micro-label is the deliberate exception because it is a distinct *treatment* (case + tracking), not a seventh size.

**The Tabular Figures Rule.** Any number a reader might compare against another number (`.stub .out`, the verdict number, the countdown clock, era ranges, Footle's `.depth`) is set with `font-variant-numeric: tabular-nums`. A date or a score wobbling against neighbouring rows on a proportional grid was the bug this closed.

**The Light-on-Dark Compensation Rule.** Text on the desk (light on near-black) gets a touch more letter-spacing (`.006em`) than the equivalent prose on paper. Dark-on-light does not get the same bump — it doesn't need it, and adding it would just loosen type that was already reading fine.

## Layout

The page is a single centred column (`.w`, `max-width: 1000px`, `28px` side padding, `16px` under 640px) for everything *except* the report sheet, which is the one element deliberately allowed to run wider than the column — by a `66px` bleed on each side at desktop width, tapering to `26px` between 641–1180px and `11px` under 640px, so the sheet still overhangs its column without eating into the viewport's own edge margin on narrow screens.

Spacing runs on a six-step scale (`--s1` 8px, `s2` 14px, `s3` 22px, `s4` 34px, `s5` 52px, `s6` 76px), each step roughly 1.4–1.6× the last. Section bands (`.sec`) use the top of that scale (`s5`/`s6`) for their own vertical padding, with a hairline rule between adjacent sections (`.sec + .sec`) rather than a background change — rhythm is carried by air and a rule, not by alternating tone.

Responsive behaviour has three real breakpoints (900px, 640px, 360px), not a single mobile cutoff:
- **900px**: the Footle board and countdown clock stack instead of sitting side by side; the clock's left border becomes a top border.
- **640px**: the masthead's centre nav disappears entirely (kept only as a `Get the app` CTA), the answer grid drops to one column, and most of the display-scale type steps down a notch.
- **360px**: a floor pass — board and keyboard gaps tighten further so the on-screen keyboard keeps its width rather than the page losing its margin.

## Elevation & Depth

This is a hybrid system, and deliberately so: the desk and everything on it is flat — no shadow on the masthead, section bands, club rows, or Footle board. Depth is reserved for the one place the metaphor calls for a physical object: the report sheet and the verdict slip.

The report (`.file`) sits on a second, slightly rotated backing sheet (`.file::after`, offset and independently shadowed) so the desk reads as a stack, not a single card. Both the report and the verdict use a two-layer shadow — a large, soft, dark blur plus a tighter, closer, darker one — rather than a single flat drop, because a zero-blur block shadow was rejected in the source comments as "a neobrutalist costume" that doesn't belong in a paper-on-desk world. The verdict additionally *lands*: a half-second `land` keyframe (rotate + scale + fade, eased with `cubic-bezier(.16,1,.3,1)`) plays once, when the score is revealed, and is fully suppressed under `prefers-reduced-motion`.

### Shadow Vocabulary
- **Report sheet** (`26px 44px 84px -28px rgba(0,0,0,.92), 4px 8px 22px -10px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.9)`): the primary paper object's shadow, plus an inset highlight simulating a sheet edge catching light.
- **Backing sheet** (`14px 26px 46px -22px rgba(0,0,0,.8)`): the second sheet under the report, visible only at its rotated edges.
- **Verdict slip** (`9px 15px 30px -12px rgba(20,23,26,.34), 2px 4px 9px -4px rgba(20,23,26,.24)`): lighter and tighter than the report's own shadow, since the verdict is a smaller object landing on top of an already-shadowed stack.

### Named Rules
**The Object Shadow Rule.** A shadow only appears where something is meant to read as a physical sheet resting on the desk. It is never used for hover feedback, never for a card, and never as ambient page atmosphere.

## Shapes

Zero border-radius exists anywhere in the file — every rule, button, tile, chip, and panel is a hard rectangle. The only non-rectilinear gestures in the entire system are the report's own slight physical rotations: `-0.45deg` at desktop (`-0.3deg` under 640px) for the report sheet, `+1.1deg` for its backing sheet, and `+0.7deg` for the verdict slip (arriving from `+2.6deg` mid-animation). Borders are uniformly hairline (1px, using `hairline-rule`, `control-rule`, or `desk-hairline` depending on ground and job) except for two intentionally heavier 2px ink rules: the letterhead's bottom border and the assessment/verdict panel borders, which are the two places the paper world draws its own frame.

## Components

### Masthead (`.mast`)
A flat, dark-ground bar: the wordmark, a centred section nav (hidden entirely under 640px), and a single `Get the app` CTA. The CTA is the one masthead element that borrows paper — newsprint background, ink text — so it reads as the highest-contrast object in the bar; on hover it brightens further to pure white. This is the *only* store-distribution affordance in the masthead; there is no icon row here (see Footer, below, and **Do's and Don'ts**).

### The Paper Sheet (`.file`) — signature component
The report itself: an oversized newsprint rectangle, wider than its own column, rotated a fraction of a degree, sitting on a second rotated sheet, with the two-layer directional shadow described in Elevation. It is the one element in the whole page allowed to break the grid, and it is the literal subject of the page's own thesis — the report you are being handed as you play.

### Letterhead (`.head`)
The band at the top of the paper sheet: a bold uppercase "Ball IQ — scouting report" line and a live "Subject:" caption underneath it, separated from the report body by a 2px ink rule. The subject line is not static copy — it updates in place as the reader answers ("not yet assessed" → "under assessment · 2 of 5 filed" → "Cone · Filed 14:32"), so the letterhead is describing the actual reader, not a placeholder. It carries no distribution links; those live in the Masthead and the Footer, not here.

### Running Report / Ledger (`.stub`)
A hairline table that appears the moment the first question is answered, one row per discipline, zebra-striped on alternating rows. Each row shows a progress bar (filled only on a *correct* answer — a wrong answer leaves the bar visibly empty rather than filled in the "wrong" colour, since a full bar reads as full regardless of hue) and a `1 of 1` / `0 of 1` / `not assessed` outcome cell in tabular figures. An unasked row gets no bar at all — an empty outline was found to draw the same mark for "wrong" and "not yet asked," which this corrects.

### Assessment Card (`.asmt`)
A bordered ink-framed panel holding one question: a dark ink header band (discipline label + "N of 5" counter) inverted against the paper body beneath it, then the question, a two-column answer grid (one column under 640px), and a "Why" panel that only appears after answering.

### Answer Option (`.opt`)
A bordered newsprint button with a boxed letter chip (A–D). Four states: default (paper, `control-rule` border), hover (white, ink border, non-touch only), **hit** (`#E3EDE2` background, `ramp-pass` border, white-on-green chip), **miss** (`#F1E3E4` background, `ramp-fail` border, white-on-red chip), and **dim** (the three unchosen options, which recede via a solid darker ink-on-newsprint-shade combination rather than opacity — see Accessibility).

### Verdict Stamp (`.verdict`) — signature component
A second paper slip laid on the report, appearing only once all five questions are answered, animated in with the `land` keyframe. It states the grade three redundant ways at once — a giant number, a tier word, and a colour — all driven by the same six-step verdict ramp, so no single one of the three is load-bearing for a reader who can't see colour or doesn't read past the headline. A "Scout's note," a short generated line naming the reader's best and worst discipline, sits alongside in its own rail. Two CTAs close it out (`Take the full test` / `Just my club instead`).

### Club Index (`.clubs`)
A two-column (one column under 760px) list of 72 club rows, each a colour swatch, club name, and an "era covered" range — deliberately a *date range*, not a question count, so the list can claim equal depth for Hajduk Split and Real Madrid without a number contradicting the sentence above it (see PRODUCT.md's binding rule against printing the bank size). Rows highlight on hover (non-touch only).

### Footle Board + Keyboard (`.ftl`)
A dark-ground word-game board: a 7-wide tile grid (one row per guess, 6 rows) and a 3-row on-screen keyboard with wide `ENTER`/`DEL` keys. Tile and key states share the Scout's Ramp exactly (`ramp-pass` = right letter/right place, `ramp-near` = in the word/wrong place, a near-black grey = not in it — deliberately *not* the same colour as an unplayed tile, which was found to read as the same "nothing happened" state). An invalid submit (wrong letter count) triggers a short horizontal shake and a status message rather than doing nothing. A "used" keyboard key recedes the same way a dimmed answer option does — solid darkened colour, not opacity (see Accessibility).

### Countdown Clock (`.clock`)
Display-scale, tabular-figure countdown to the next midnight reset, self-correcting: if the page is left open across midnight, it detects the date rollover and swaps its own copy to "reload for today's board" rather than silently counting from a stale target.

### Footer Distribution Line (`.dist`)
"Also on" plus inline SVG store-badge icons, on the dark ground. This is the *only* icon-based distribution row in the file — a related but distinct affordance from the Masthead's single CTA button.

It is a **single-ground component with exactly one call-site**, and it is defined once. It used to carry a second, paper-ground skin (`--rule` borders, `--mut` label, white hover) left over from an earlier placement inside the Letterhead; when that placement was removed the paper styling stayed behind, and every one of its declarations was being overridden by a `.footin .dist` block further down. Both halves are now collapsed into one dark-ground definition, and the icons inherit their fill from `.mk-i` rather than re-specifying it. If a second, light-ground placement is ever wanted, add a modifier deliberately — do not reintroduce a default skin for a ground the component does not appear on.

### Ad Slot (`.adslot`)
A quiet, bordered, centred band with a single "Advertisement" label — no framing copy, no explanation of ad policy on the page itself. The source comments are explicit that an ad slot which explains itself is addressed to a reviewer, not to the person who arrived from a club search.

## Do's and Don'ts

### Do:
- **Do** keep the scout's ramp (oxblood → amber → green) as the only saturated colour family anywhere in the system; it exists to grade something, not to decorate.
- **Do** fill a button with whichever of ink or newsprint is *not* the ground it sits on — that is the whole action-colour rule, and it is why the masthead CTA is paper-coloured while the verdict CTAs are ink-coloured.
- **Do** recede a de-emphasized state (a wrong answer's unchosen options, a spent Footle key) with a darker solid colour, never with opacity — opacity was measured to fail contrast in three separate cases (3.0:1, 4.13:1, 2.61:1) before this rule was adopted.
- **Do** reserve shadow for the two paper objects (the report, the verdict); everything else on the desk stays flat.
- **Do** guard every hover-only affordance with `@media (hover:hover)` — this is a 66%-mobile product and sticky hover states are a real cost, not a nicety.
- **Do** move focus explicitly whenever a click removes the element that held it (to the next question button, to the newly-revealed verdict panel) — the alternative is focus silently landing on `<body>`.

### Don't:
- **Don't** introduce a fourth colour family for any reason — a new accent, a decorative tint, a brand colour borrowed from elsewhere in the product. The direction contract is explicit that action is ink or paper, never a fourth colour.
- **Don't** add border-radius anywhere. This build has none, on any element, and it is a stated rejection ("no radius") in the direction contract, not an oversight.
- **Don't** treat the three-step Scout's Ramp and the six-step Verdict Ramp as two unrelated scales — they are one hue family at two rendering strengths (see **The Two Strengths Rule**). If you add a stop to either, put it on the same hue arc and hold it to that column's contrast floor.
- **Don't** use `--r3` as text on newsprint. It is a fill, it reads 2.13:1 on paper, and the ink-strength stop for that hue already exists as `--v2`.
- **Don't** add motion that isn't a direct response to the reader's own action. Nothing on this page moves on load, on scroll, or ambiently — a bar fills because an answer was correct, the verdict lands because the last question was answered, a Footle row shakes because a guess was invalid.
- **Don't** collapse the Masthead CTA, the Letterhead, and the Footer distribution line into one component. They look related (all "get the app / find us elsewhere") but are three different patterns living in three different places, and only the footer carries the icon row.
