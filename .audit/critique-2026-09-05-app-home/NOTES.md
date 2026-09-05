# App home critique — 2026-09-05 (iOS simulator, iPhone 17 Pro 402×874)

Purpose: survive a usage-limit cut. Everything the two reviewers return is appended
below verbatim; the synthesis and Alex's decisions follow. Read this file first if
the session that started it is gone.

## State when the critique started
- Commits 539e912 (Today block = four equal rows, mode colours via --mode/--mode-rgb,
  DesktopFootleHero + FootleHero card removed from the home, Stadiums isNew dropped)
  and 7ece677 (tab-bar backdrop: 0.72 fill, blur 16, saturate 55%, no brightness)
  are committed locally, NOT pushed. Gate green: 562 tests. Simulator-verified.
- Screenshots in this folder: home-top.png (first paint, banner showing),
  home-scrolled.png (one screen down), home-no-banner.png (banner dismissed).
- Untracked scripts/qpr-*.json + scripts/wat-*.json = another session's forge run. Leave.

## Alex's inputs (verbatim where possible)
- "Today block = the web's four equal rows" (chosen from AskUserQuestion).
- "it is a bit sad we can not even see the online tab when entering the app" → fixed.
- "we still can not see the play with friends, i guess if we removed the welcome
  message we would see it more clearly though. can we have our design team get some
  context and critique it? what we should be doing to reach our goals without things
  looking horrible, because there is something about it now that just does not look right"
- "i am not sure if we should have the search for your club bar there or not either"
- "my gut feeling is telling me that the club horizontal scroller and find your club
  searchbar does not belong where they currently sit on the homepage."
- Standing: honest advice wanted; things should look orderly; no hero card, no lead
  card with a board, no editorial/condensed-caps styling; never print question counts.

## Reviewer reports (appended as they land)

### Assessment B — deterministic evidence (verbatim, landed 23:2x)

Live-server / overlay flow skipped: Capacitor app, no browser page to inject into.

**Detector** (`detect.mjs --json`): in-scope findings 3.
- broken-image HomeScreen.jsx:525 — FALSE POSITIVE (string "<img>" inside a JSX comment).
- design-system-color HomeScreen.jsx:373 — TRUE: `WebkitTextFillColor:"#0a1a00"` on the club-rail Play button; token is `--grn-ink #06230C`. Drift, not a contrast defect (~8:1 either way).
- side-tab App.jsx:12970 — TRUE as matched: `borderLeft:"3px solid var(--accent)"` on the welcome banner (rendered green bar x≈16–19pt, y 65–139pt).
- App.jsx whole file: 159 findings (design-system-color 146, radius 10, side-tab 1, bounce-easing 1, layout-transition 1) — out of scope except banner range (1) and tab-bar range (0).

**Vertical extents at first paint (pt, 402×874):**
| Block | Top→bottom | Height |
|---|---|---|
| Status bar / island | 0→62 | 62 |
| Welcome banner | 62→142 | 80 |
| Greeting row (gear → "Set your name") | 160→224 | 64 |
| Club search field | 234→282 | 48 |
| Club chips | 292→336 | 44 |
| TODAY block (outer) | 350→720 | 370 |
| — header | 356→376 | 20 |
| — Footle / Daily 7 / Trail / Mystery rows | 381→457 / 465→541 / 549→625 / 633→709 | 76 each |
| Play with Friends card | 730→~869 | ~139 |
| — CTAs (Invite / Same phone) | ≈799→845 | 46 |
| Tab bar | 792→852 | 60 (bottom 22pt) |

Play with Friends: 62pt visible above the bar (icon, title, subline). BOTH CTAs sit entirely behind the bar (792–852); bar backdrop still passes them as a greenish patch under Home/Online (fill sampled (39,49,44) vs (30,33,40) under Profile). 5pt sliver of the green Invite button shows below the bar (852–857).

**Contrast (tokens.css: --t1 #F0F1F5, --t2 #9BA0B8, --t3 #8A8E99, --s1 #13151C, --bg #0B0C10):**
- `.t7s-sub` is SPECIFIED `--t2` (≈6.4:1) but PAINTED `--t1` (15.4:1, sampled (240,241,245)) — `.todays-seven-secondary` (app.css ~2183) sets `-webkit-text-fill-color:var(--t1)` which inherits; `.t7s-sub` only sets `color`; no text-fill rule for `.t7s-sub` exists at any width. The `--t3` overrides at ~2919/3308 are inside `@media (min-width:1024px)`. ⇒ subline as bright as the title on mobile.
- `.t7s-no` (`--t3`, 11px/700): 5.3:1 vs Footle row bg. OK.
- Tab-bar inactive label: `--t3` 10px/600 with `.tab-item{opacity:0.6}` (app.css ~1092) ⇒ **2.72:1 computed, 2.68–2.73:1 sampled** — fails AA. Active label white 16.9:1.
- Banner subline `--t2` on `--s1` 7.05:1; "0/4 today" `--t3` 10.5px ≈5.8:1.

**Counts on the first screen (0–792pt):** 9 distinct accent colours (green, amber, blue, violet, ARS red, LIV red, FCB crimson, white, --red badge dot); 6 if reds folded. **17 tappable targets** above the fold (banner ✕, gear, Set your name, search input, 3 club chips, 0/4 status, 4 rows, mp-card, 4 tabs); the 2 mp-card CTAs unreachable at first paint. `.mp-card` div and `.mp-card-open` both carry the same onClick (nested target).

Files: HomeScreen.jsx; MultiplayerCard.jsx; App.jsx banner 12957–12981, tab bar 14003–14046; app.css tab bar 993–1073 + 1086–1205, TODAY rows 405–417 + 2183–2193; tokens.css:5; accents.js:33–51. Raw detector JSON in scratchpad detect-home.json / detect-app.json.
