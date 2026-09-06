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

### Assessment A — design-director review (verbatim, Operate mode)

**Design-specificity verdict: mixed — the content is authored, the frame is generic.** Identity carriers: the F tile + the four named mode hues (shared with the website); club abbreviation badges in real club colours; the voice ("Same phone", "Die on wrong", "No club called X on file yet"). Interchangeable: the welcome banner (surface card, left rule, icon well, circular ✕); greeting + gear header; search field + chip rail; the Play-with-Friends card (dark-green gradient, glow, one bright pill, one ghost pill); the two-column icon-tile grid. DESIGN.md's north star is "The Fixture List": one card anatomy, one accent, no gradients or glows. This screen has three container idioms, gradients on two, a glow on one, four colours of "Play". Assembled from good components, not composed.

**Reading order at first paint (banner up):** (1) "Welcome to Ball IQ!" (2) the red club badges at ~292–336pt — the most saturated pixels (3) the green F tile ~370pt (4) the search field. Footle is third/fourth, ~350pt down. Without banner: red badges → 48pt search field → F. In both states the first Play is below ~350pt and the first thing that outranks it is club colour data (DESIGN.md: club colour "appears as a 12px dot… never colours a button").

**IA:** banner → greeting → name link → search → chips → Today → PWF → More modes = a tip about a thing lower down; a greeting with no name; a settings task; a keyboard task; eight club decisions; then the four puzzles. Three asks and two catalogues before the first offer. The banner says "start with Footle" while the two blocks between it and Footle say "start with your club" — the screen argues with itself.

**Composition:** container treatments above the fold: banner (14px, green left rule, 9px well, 50% ✕) · search (14) · chips (pill, 8px badge) · Today box (18px, green→amber gradient) · rows inside (14px, per-mode wash, 13px well, 8px F tile, pill) · mp-card (20px, dark-green gradient, glow, 13px well, two pills) · play-card (14px, 11px well). DESIGN.md radius scale 8/10/12/14/pill — Today box (18) and mp-card (20) break it; wells at radius 9/11/13 and sizes 30/34/40/46. Today nesting four deep (box → row → well → F); More modes one deep. **Two left edges:** everything at x≈20pt except the Today rows inset to ≈31pt — a large part of why it isn't orderly.

**Colour:** 9–10 hues above the fold; green doing five jobs (banner rule, banner icon, F tile, Footle Play, active tab) + Invite fill + mp gradient. The four mode colours ARE a system; what breaks it is spending them on the Play pills — the website renders a GREEN Play on all four rows (`front.css .fd-play`, One Accent Rule) with mode colour on the well only. The app tints the pill per mode so the eye can't rank the four; then "Invite friends" is the only full-saturation green fill, so the seventh block out-shouts all four Plays.

**Typography:** peer titles in four settings (t7s-title 14/900, mp-card-title 16/800, play-card-name 15/700, home-section-title 15/800); website Title is one (15/700). Below DESIGN.md's 12px floor: eyebrow 10, counter 10.5, abbr 10.5, edition 11, sublines 11.5 — five violations in the first screen.

**Copy:** "Good evening" with no name; guest's next line "Set your name" — a settings task headlining the play screen. Sublines good. "Live rooms, up to 8 players." only subline with a full stop. Footle subline wraps to two lines → the four "equal" rows are not equal in height.

**States:** Done/Continue/Review correct and agrees with the Daily tab; but fixed row order puts a Review row above open puzzles. ✅/✗ emoji glyphs beside Lucide.

**Cognitive load: 6 of 8 fail** — no single primary action (four Play colours + a louder Invite); 7–8 blocks above the fold; two catalogues before Today; duplicated routes (Club Quiz tile + finder + "All clubs" chip; League Quiz tile + "By league →"; 0/4 › + Daily tab); colour carries >3 meanings; 17–18 tappable choices above the fold.

**Emotional journey.** First open: welcomed; asked to set a name before doing anything; asked to find a club; four puzzles in four colours with no visible "start here". Valley = between "Set your name" and the first Play: three asks before one offer — the activation leak (~44% never play) is decided here and it front-loads chores. 30th open: banner gone; "Good evening" still nameless for a guest; the unused club rail holds 100pt at the top identical every day; done rows above the open one; the one satisfying element is 0/4→4/4 turning green; no countdown to tomorrow (the website has one).

**Nielsen: 23/40.** 1 Visibility 3 (Daily-tab red dot unexplained) · 2 Real world 3 ("Die on wrong" telegraphic) · 3 Control 2 ("Set your name" leaves Home; Invite opens an auth prompt for guests unannounced) · 4 Consistency 1 (radii, wells, title styles, section idioms vary; Play pills contradict the website; emoji next to Lucide) · 5 Error prevention 3 · 6 Recognition 3 (two routes to Daily; "No. 34" twice reads like a paste error) · 7 Flexibility 2 (fixed order ignores done state; no recent club) · 8 Aesthetic/minimal 1 (nine hues, three idioms, a banner explaining a row on the same screen) · 9 Recovery 3 (search empty state names the query, offers "See every club") · 10 Help 2 (the banner IS the help and points past two blocks that say otherwise).

**(a) Banner: No, not in this form/position.** First block, no action (a tip with only a ✕), sits above two blocks contradicting it, ~80pt, fifth container style. Replace with state ON the Footle row for the first session: subline "Start here — everyone gets the same player" and make that row the one green Play; optionally greeting reads "Welcome to Ball IQ" on first session. Zero new containers; tip and target = same tap.

**(b) Club search + chips: keep the finder, MOVE IT BELOW TODAY** as the head of the catalogue: "Find a quiz" → search → chips → More modes. Argument from the app's job: the 763 club plays/30d and Arsenal 113 in the source comment are WEB, anonymous, Google-driven; in-app club demand is unmeasured (club quiz was a fourth-screen tile until this week). What IS measured for the app: Footle is the most-played mode and the return reason; the bottleneck is coming back tomorrow. A search field is a keyboard task; Today rows are one tap — on the return trip, tap beats type. Consequences: the "Club Quiz — Pick your club" tile duplicates the finder and goes; "League Quiz" duplicates "By league →" and one goes. Chips lose full club colour at rest (grey abbr on s2; colour on the result row and club page) so club data stops outranking the product's hierarchy.

**(c) What is "not right", in fix order:** 1 No anchor at the top — 13.5px grey "Good evening", underlined 12px link, 44pt gear; the heaviest object in the header is Settings; the website starts with a wordmark + date line, the app with a caption. 2 Three section idioms (boxed zone with label inside / standalone hero card with no label / bare title above a grid). 3 Two left edges. 4 Radii and wells off the scale (18/20 next to 14; wells 9/11/13, 30/34/40/46). 5 Four colours of Play. 6 Today box gradient runs green→amber — a two-mode-era wash under a four-mode block. 7 Loudness and position disagree — PWF has the brightest control and the seventh position; its buttons under the tab bar with the banner up. 8 Off-token colour in the block that looks wrong — `.mp-card` is literal hexes (#14301C, #122318, #24462C, #3A5C43, #DCE7DE), stragglers from the 09-04 palette lift.

**Strengths:** 1 The Today row is a real component (one shape, --mode/--mode-rgb, edition number, state in subline, counter agrees with Daily) — build outward from it. 2 The finder's behaviour is right (16px input, prefix-before-substring, Enter first match, Escape clears, empty state offers an exit) — only its position and colour are wrong. 3 More modes shows the discipline the top lacks (neutral icons, no colour, two lines, no duplicated dailies) — the calmest part of the screen.

**Priority issues:**
- **P0 The top third is not the product.** banner + greeting + name link + search + chips = ~275pt before the first Play. Fix: delete the banner block (App.jsx ~12960–12983); move ClubFinder below the Today zone as the head of the catalogue; header row = greeting/name + gear only. Footle lands at ~120pt.
- **P1 "Play" is four colours.** `.t7s-cta` tints from --mode. Fix: `.t7s-cta` = var(--accent) fill + var(--grn-ink) on all four; Review = s2 fill + border (as `.fd-daily.is-done .fd-play`); mode colour stays on the well + ring only; drop the per-row gradient wash (background var(--s1)).
- **P1 Three idioms, two edges, off-scale radii.** Fix: remove the `.daily-zone` container styling on mobile (rows on the page edge under a "Today" head row styled exactly like "More modes", with "0/4 today ›" as the head's right-aligned meta); mp-card radius 14; every well 40×40 r10; every card 14; one section-head style for Today / Play with Friends / More modes.
- **P2 Play with Friends styled as the hero, placed seventh** (11 plays/30d). Fix: rebuild in the Today-row anatomy: well · title · "Live rooms, up to 8 players" · one quiet pill "Invite" (s2 fill, border-strong); "Same phone" as a second row or on the Online tab. Do not move it above Today.
- **P2 Club chips wear full club colour on the home.** Fix: `.cf-chip .cf-abbr` = s2 fill, t2 text at rest; colour on results and the club screen; or an 8px dot per DESIGN.md.
- **P3 Emoji as icons** (✅ ✗ in sub, 🔥 .hst-flame, 🏆 challenge card) → Lucide Check/X/Flame/Trophy.
- **P3 Done rows hold position** → sort open above done, or dim done to t2; keep parity with the website.

**Personas.** Returning daily player: top 300pt never changes and isn't theirs; "Set your name" persists forever for a guest; done rows above the open one; no countdown; Home offers nothing Daily can't. First-timer from "Liverpool quiz": Liverpool chip visible and launches the club quiz — good; but the banner says Footle first: two first steps; after the club quiz no memory of their club; four mode colours + three club colours give nothing to rank.

**Minor:** `.daily-zone-status` 10.5px / eyebrow 10px / t7s-no 11 / t7s-sub 11.5 below the 12px floor · Trail + Mystery both "No. 34" looks like a paste error · Footle subline wraps · chip mask cuts "Barcelona" and is the third thing the eye hits · `.hg-block` has no CSS rule, greeting is inline styles → ungovernable by the native override block · placeholder says "club" but the rail offers "By league →" · gear is a 44pt target for the least-used action; "Set your name" hit44 but 12px visually · website Today row has a state column, app folds it into the subline — correct, state it in DESIGN.md.

**Questions:** 1 Why does a returning player have to TYPE before they can TAP? Order Home strictly by cost-to-act: tap, then scroll, then type. 2 PWF has 11 plays/30d and the loudest button — if visual weight were set by 30-day plays, what would be green? 3 Home's Today block and the Daily tab list the same four puzzles — what does Home do that Daily cannot, and if the answer is "the catalogue", should Home BE the catalogue and Daily the front tab?

**Could not verify:** in-app club-quiz volume (web numbers only); screenshots are the guest state — a signed-in user gets a 24px/800 name under the greeting, which changes the header's anchor problem; the guest state is the one the activation cohort sees.

## Synthesis + Alex's decisions (23:30)
Score 23/40; P0 1, P1 2. Snapshot: .impeccable/critique/2026-09-05T21-29-23Z__src-screens-homescreen-jsx.md
Alex chose (AskUserQuestion): **P0 + P1 + P2 in one increment**; **drop the Club Quiz tile** (finder is the club entry); **Play with Friends rebuilt in the Today-row anatomy with one quiet Invite pill, "Same phone" moves to the Online tab**.
Build list: 1 banner block out (first-session state on the Footle row instead) · 2 ClubFinder below Today as head of the catalogue, "Find a quiz"; Club Quiz tile out; chips grey at rest · 3 rows: green Play on all four, Review quiet grey, mode colour on the well only, no wash, subline --t2 (text-fill), rows on the page edge under a "Today" head styled like "More modes" with 0/4 as right meta · 4 PWF as a row-style card after Today · 5 inactive tab label contrast to AA · 6 P3s deferred (emoji glyphs, row ordering, No. duplicates, <12px sizes).

## After (commit 34f3d38, simulator-verified 23:40) — home-after-top.png
Greeting → **Today** head (0/4 meta) → 4 rows on the page edge, green Play on all, mode colour on the well only, grey sublines → **Play with Friends** row with a quiet Invite pill, fully visible above the bar → **Find a quiz** (search + grey chips) → More modes. Online tab legible. First Play at ~170pt (was ~380). Deferred P3s: header anchor (greeting/name/gear), emoji glyphs (🔥 ✅ ✗ 🏆), done-row ordering, duplicate "No. 34", Footle subline wraps to two lines (rows unequal), chip mask cuts "Barcelona". Re-run the critique after these to move the 23/40.

## Results component — decisions (2026-09-06 ~01:55, AskUserQuestion)
Alex: "let us build the results component first, then align the daily tab. after that we attack all the other components from the list… let us do this RIGHT".
1. **Distribution: build now, gated n≥20** — one Supabase table + RPC (anon insert puzzle/outcome/guess-count; read aggregate). Nothing fabricated below 20 results (App Store 2.3 honesty; the old fake percentile was removed).
2. **Reminder: in-panel "Remind me tomorrow", permission asked on that tap, scheduled at the player's own play hour.** The 7-second bottom sheet (v2-stake, 0/10 converted) and its timer go.
3. **Scope: one `DailyDone` panel** — outcome · share (primary) · streak · countdown · remind me · other unplayed dailies as next steps · report link — under the board on Footle/Trail/Mystery and as the footer of the Daily 7 Results screen. Replaces the guest save-nudge OVERLAY with a quiet in-panel "Save your streak" row (guest, streak≥2). Web keeps Get-the-app badges inside the panel.
Then: align the Daily tab rows to the new row CSS; then the rest of WHAT-NEXT.md in order.

## DailyDone — brief (shape, 02:10)
**Job:** the moment after a daily is decided, for a player who is engaged and finished for the day. Success = they come back tomorrow (and tell someone today).
**Panel order (mobile, one card idiom = the Today rows):** streak line (Flame well, "3-day streak · tomorrow makes 4" / "Start a streak") → countdown + Remind-me in one row ("New puzzles in 13h 12m" · quiet pill) → **Share result** (green pill, the one primary) [+ WhatsApp text link on web] → **How everyone did** (n≥20 only: bars per bucket, yours green; "62% solved · you beat 71%") → **Still open today** (the other unplayed dailies as mini rows with mode-colour wells) → guest+streak≥2: "Your streak lives on this phone · Save it" → Get-the-app badges (web islands only).
**Not in the panel (stays in hosts):** outcome/answer reveal, XP line, report button, Back.
**Data:** `daily_results(game, edition, bucket, won, visitor_id, user_id)` via `record_daily_result` / `get_daily_distribution` (security definer, anon+authenticated, revoke public). bucket = guesses/clubs when won, 0 = X; Daily 7 bucket = score. Dedupe per visitor per edition (unique index + localStorage flag). Archive plays never record.
**Reminder:** `getReminderHour()` = median of the last 7 completion hours (clamped 8–22, default 19); native local window uses it; the web-push cron stays at 19:00 (server column later). The 7s sheet is retired (arming removed, bails kept so `notif-prompt-skipped` ×3 stays for the test).
**Streak:** the app's ONE streak (loginStreak) everywhere in the app; islands pass the per-game streak with its label.
**Anti-goals:** no emoji glyphs, no eyebrow labels, no nested cards, no fabricated numbers below n=20, no modal.

## DailyDone — BUILT (2026-09-06 10:50), simulator + local-web verified, not yet pushed
Commits d7b9507 (panel + hosts + migration), e8ae466 (island default icons; native records anonymously — capacitor://localhost was read as a dev box, so no phone result ever recorded; store-listing promise = no identifier from native, RPC accepts null visitor), e57d58c (play hour noted on first completion regardless of network — the first device build fell back to 19:00), 07de48e (Home's finished Footle row reopens the Footle screen — the old status screen was a FIFTH finish surface with no panel).
Verified: app Footle solve → panel (streak line, Remind me → iOS prompt on the tap → ✓ pill), Share, Still open today with icons; web /mystery-player/ give-up → panel with page links + Google Play badge. Distribution hidden (n<20) as designed.
⚠️ `vite build` alone does NOT regenerate the island HTML (hashed chunk refs) — the full `npm run build` gate is required to verify islands locally.
Remaining before push: full gate → cap sync → native rebuild → confirm a native row lands in daily_results → island icons on local static → push → live verify → Daily tab alignment (next increment).

## 2026-09-06 12:25 — the list, worked through
Shipped today (all pushed, simulator-verified): DailyDone results panel (+ daily_results aggregate, remind-at-your-hour) · Daily tab rows aligned → then Daily tab → **History** (rows on Home only) · streak-at-risk nudge (today only, streak≥2, 20:30, named) · guest-first Online (join + local first, quiet named sign-up row, no empty scoreboard) + Profile (ask below the card) · header anchor (F mark + wordmark + date; greeting only with a real name) · craft pass (Lucide flames/trophy/miss, no text ticks, sentence-case countdown) · honest rating (answered questions required).
**Deliberately not done:** onboarding = Footle. The sample question already hands into Footle when answered and is instrumented (onboard-done-answered); replacing it is a bet to make with data.
**Re-critique next** to move the 23/40. Read `daily_results` in a week; the distribution appears at n≥20 per puzzle.
