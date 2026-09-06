## 2026-09-06 (12:30) — ✅ BALL MARK IN THE HEADER, CLUB COLOURS BACK, ONLINE GUEST PITCH (30d06bb, bd59231) — simulator-verified, pushed

Alex: "the F … is the footle logo and ball iq for what exactly?" → the header wears the app's ball (same as the website header).
"should we not add color to the clubs?" → club colour back on the finder chips (below Today they no longer fight the first Play).
"the online tab should tempt players more to sign up and test their football knowledge against their friends" → a guest opens on the
pitch: "Who knows more — you or your mates?" · ten questions live, the podium settles it · Create room / Share link / Answer live ·
one green **Challenge your friends** (= sign-up) · then Join-by-code and Local play (quiet). Screenshots home-ball-mark.png,
online-guest-pitch.png.

## 2026-09-06 (12:20) — ✅ HEADER ANCHOR (6674f92) + CRAFT PASS (5a0d40b) — simulator-verified, pushed

Home opens on the F mark + "Ball IQ" wordmark with the date beneath (or "Good ebening, Alex" for a named player); "Set your name" and
the nudge subtext left Home (Profile owns the name); History drops its greeting. Craft: streak flames, the challenge trophy and the
recent-days miss are Lucide; no ✅/✗/⚽ text glyphs in row sublines or the Footle result title; the countdown pill reads "New puzzles in"
in sentence case. Screenshots home-header-anchor.png, history-tab-craft.png. **Left on the list:** onboarding = today's Footle (item 6);
the mobile rating card's fabricated "64 · Silver" after one Footle (needs answered questions, like the desktop rail).

## 2026-09-06 (12:10) — ✅ GUEST-FIRST ONLINE + PROFILE (6d95792, e71cb4c) + STREAK-AT-RISK NUDGE (d55941b) — simulator-verified, pushed

Online for a guest: Join-by-code → Local pass & play (the one green control) → "Play online with friends · create a room and share a
link · needs a free account · Sign up" as a quiet row; the "You vs ?" scoreboard is signed-in only; Create Room stays green for accounts.
Profile: the ask sits BELOW the player's own card ("Saved on this phone only · Sign in"), row anatomy; anonymous players keep the
"attach an email" wording. Reminders: one extra local notification today only when a streak ≥2 is live and today is unplayed, 20:30,
after the player's own hour, names the streak ("Your 3-day daily streak ends at midnight"). Screenshots online-guest-after.png,
profile-guest-after.png. ⚠️ Seen, not fixed: the Profile card shows "64 · SILVER" after ONE Footle solve (0.4 default accuracy) — the
fabricated-rating bug the desktop rail fixed on 08-28 is still live on the mobile card. **Next:** header anchor → onboarding = Footle
→ craft P3s → the rating-card honesty fix.

## 2026-09-06 (12:00) — ✅ DAILY TAB → HISTORY (126e446) — simulator-verified, pushed

Alex chose "History tab: streak + recent days, no rows". Both Daily layouts drop the four rows (Home owns them); the tab keeps the
countdown pill, the 14-day streak strip, recent days, archive, day-complete + streak-repair. Label History, no red dot. Home's counter
link copy says History. Screenshot `.audit/critique-2026-09-05-app-home/history-tab.png`. **Next:** streak-at-risk evening nudge
(local, today only, streak≥2, names the streak) → guest-first Online/Profile → header anchor → craft P3s.

## 2026-09-06 (11:00) — ✅ DAILY TAB ROWS ALIGNED TO HOME (d712bb7) — simulator-verified; results panel LIVE on prod

Both the mobile and desktop Daily rows now draw `.todays-seven-secondary` with `--mode` on the well only, one green Play, quiet
Review / score pill, `.daily-zone-head` ("Today · Sun, Sep 6" · "1 of 4 played"); ✓/✗ glyphs dropped from result strings. Gate in
`daily-done.test.js`. Screenshot: `.audit/critique-2026-09-05-app-home/daily-tab-after.png`. **Next (WHAT-NEXT.md):** merge decision
Home vs Daily → reminder engine (habitual hour is in; streak-at-risk + rollover push next) → guest-first Online/Profile → header
anchor → craft P3s (⚽ in "Brilliant!", 🔥 streak pill, uppercase "NEW PUZZLES IN" pill).

## 2026-09-06 (10:55) — ✅ RESULTS PANEL (DailyDone) SHIPPED: one return loop under all four dailies — simulator + local-web verified; live check pending

Alex: "let us build the results component first, then align the daily tab… let us do this RIGHT." Brief + decisions in
`.audit/critique-2026-09-05-app-home/NOTES.md`. `components/DailyDone.jsx` under the board on Footle/Trail/Mystery (app AND islands)
and as the Daily 7 results footer: streak line → countdown + **Remind me** (iOS prompt on THAT tap, scheduled at the player's own hour —
`lib/playHour.js` median of the last 7 completions) → **Share result** (the one green primary) → **How everyone did** (REAL:
`daily_results` + `record_daily_result`/`get_daily_distribution`, applied to prod, shown only at n≥20) → **Still open today** (the
other unplayed dailies, real navigation) → Save it (guest, streak≥2) → store badge (islands). Retired: TomorrowTeaser, the 7-second
notification sheet (bails kept measured), the deferred guest save prompt, four per-game share buttons, the Trail→Mystery chain, the
Home row's Footle status screen (a fifth finish surface). Native records with NO identifier (store-listing promise; RPC accepts null).
Verified: app Footle solve → panel → Allow → ✓ 10:00; native row in `daily_results`; `/mystery-player/` give-up → panel with icons +
Google Play badge. Commits d7b9507 e8ae466 e57d58c 07de48e. Gate: `daily-done.test.js`. ⚠️ Lessons: `vite build` alone leaves island
HTML on the OLD chunk (full gate to verify); `capacitor://localhost` reads as a dev box to a hostname guard. **Next:** align the Daily
tab rows to the new row CSS (it still wears per-mode Play pills + washes), then WHAT-NEXT.md items 3→8. Read `daily_results` in a week.

## 2026-09-06 (01:40) — ✅ APP HOME REBUILT FROM THE CRITIQUE (539e912 → 34f3d38, pushed f6083af) — simulator-verified; LIVE-VERIFIED on prod at 375 (Continue / Review states, Find a quiz, Invite row)

Alex, in the simulator: "Today block = the web's four equal rows" → shipped; then "we can not even see the online tab" / "we still can not
see the play with friends" / "something about it just does not look right" / "the club scroller and the search bar do not belong where
they sit". Two isolated reviews (design director + detector) scored the home **23/40** — `.audit/critique-2026-09-05-app-home/NOTES.md`
holds both verbatim, the screenshots, and Alex's decisions (P0+P1+P2 in one increment; drop the Club Quiz tile; Play with Friends as a
row with one quiet Invite). **Shipped:** banner out (Footle row says "Start here" on a first session); finder BELOW Today as "Find a
quiz", Club Quiz tile + "By league" chip gone, chips grey at rest; Today = head row like "More modes" + rows on the page edge, GREEN Play
on all four (mode colour on the well only), Review = quiet pill; subline text-fill bug fixed (was painted white); Play with Friends = row
+ Invite, "Same phone" lives on the Online tab; tab bar: desaturated backdrop, no item opacity (labels 2.7:1 → ~7:1). First Play at
~170pt (was ~380). **Deferred P3s:** header anchor (greeting / Set your name / gear), emoji glyphs 🔥✅✗🏆 → Lucide, done rows above
open ones, duplicate "No. 34", Footle subline wraps, chip mask. **Next:** live-verify `/play?tab=home` renders on prod; re-run the
critique after the P3s. ⚠️ e2e `all-modes-smoke` Local entry now goes via the Online tab.

## 2026-09-06 (00:40) — ✅ B2 COMPLETE: ONE question widget on the whole static site (cf382f9) — LIVE-VERIFIED (fr page: widget, "Suivant →", no taster, no errors)

Alex approved the remaining six languages ("or what do you think?" → my call: ship; the taster's old strings had no native pass either).
`BQ_I18N_REVIEWED` = all 8 → both localised builders render `renderQuizSet({lang})`; **TASTER_CSS / TASTER_JS / TASTER_I18N and the
`taster` head flag are DELETED.** Verified locally: fr "Question 1 sur 10 · Suivant → · Faux. La réponse est Monaco."; tr full finish
card. The 09-05 critique's "four multiple-choice widgets" is now ONE on the static site (club, league, category, listicle, /football-quiz/,
served Daily 7, 46 localised pages). Native-speaker pass welcome any time: `docs/i18n/bq-strings.md` → `bq-i18n.mjs`. Two stale test
assertions (playLabel link, bare `.to` CSS) rewritten to the invariants they protect. **Funnel:** `taster-*` events end today; localised
pages post `clubq-*`.

## 2026-09-05 (23:55) — ✅ B2: es + de LIVE on the .bq widget (08736ab) — verified on prod: "Pregunta 1 de 10 · Siguiente →", "Frage 1 von 10 · Weiter →", Spanish finish card end to end; fr/it/pt/nl/tr/id still on the taster pending review

`BQ_I18N_REVIEWED = {es, de}` → 11 Spanish + 4 German club pages and the /es/ + /de/ hubs render `renderQuizSet({lang})`; fr/it/pt/nl/tr/id
keep the old taster until their columns are approved (`docs/i18n/bq-strings.md`). Plumbing (414af8d + 4a691fc) LIVE-VERIFIED on prod:
English club page plays, labels right, no uncaught. **Next:** approve more languages → add to `BQ_I18N_REVIEWED`; when all 8 are in,
delete TASTER_CSS/TASTER_JS/TASTER_I18N and drop `one-question-widget.test.js`'s count to 0. Funnel: es/de pages now post `clubq-*`
not `taster-*`.
## 2026-09-05 (23:20) — ✅ B2 PLUMBING LIVE (414af8d + 4a691fc) — the .bq widget speaks 8 languages; localised pages NOT switched yet

Engine: `data-i18n` read once, every label through `T(key, english)` + `fmt()` — English inline as the default, so a missing key
falls back to English. `renderQuizSet({lang})` emits `data-lang` + `data-i18n` and localises its server-rendered labels; a language's
six generic tiers replace the club's English ones. `scripts/seo/bq-i18n.mjs`: 8 langs × 41 keys, DRAFTED by Claude.
**⏳ ALEX: review `docs/i18n/bq-strings.md` (es/de/nl/pt first).** Approve a language → add it to `BQ_I18N_REVIEWED`; the switch of that
language's club pages (buildClubPageIntl + the intl hub builder → renderQuizSet with lang) is the follow-up commit, then TASTER_* dies
(`one-question-widget.test.js` count 2 → 0). ⚠️ Funnel note: those pages will post `clubq-*` events instead of `taster-*` (taster-start
143 web visitors/30d) — the series changes name on switch day. Gate `bq-i18n.test.js`. ⚠️ **Caught before push:** the first cut declared `I18N` below the `tiers` line that reads it → the engine died at boot on EVERY club page in the local build (vitest + the build gate were green). Fixed + an ordering assertion; the real fix is a boot test — **add `happy-dom` as a devDependency and boot BQ_JS in vitest** (decision: new devDep).

## 2026-09-05 (22:10) — ✅ P2 QUICK WINS LIVE (b85119c) — verified on prod at 1440: 44px links, 4-col footer + badges, filter 93→1, --tx4 #8A8E99

All five P2 items of the 09-05 critique, measured on the local build at 1440: header links + Sign in **44px** (were 37) in both
stylesheets; both footers **4 columns** (Games · Quizzes · Discover · Ball IQ; were 8) and the STATIC footer's "Also on iOS and Android"
prose is now two badges (I had only fixed the React footer earlier); `/lists` **table before** the five-question taster (the table is
what "with answers" searchers came for); `/football-quiz/` has a **club filter + league jump chips** (93→1 on "arsen", emptied leagues
and chips hide, a no-match line points at /quiz/clubs/); caption grey `--tx4` **#7E828C → #8A8E99** (5.97/5.57/5.08 on bg/card/card2;
the old value was 4.33 on card2). App `--t3` lifts with it (alias). Gate `p2-quick-wins.test.js` incl. the contrast maths.
**09-03 leftovers re-inspected on prod (22:15):** Games dropdown at 390 — GONE with the header redesign; the burger menu opens under the
header with six 44px rows, no horizontal overflow → closed. 1911px void — a centred 1200px column on club pages (356px each side) and
1120 on `/` (396 each side): a conventional cap, recorded as ACCEPTED unless Alex wants ≥1600 layouts wider. Report sheet — needs a
finished game; inspect next session with a played Footle. **Still open from the critique:** B2 (46 localised pages onto .bq — needs the
strings table + Alex's eye on es/de/nl/pt), the 7 shell modes (page or app-only, per mode — Alex's call), the report sheet.

## 2026-09-05 (21:25) — ✅ C3-B + F MARK + THE PROD REGRESSION FIXED (810dcd9, ddc13e3, 29605e6, 4a49967) — LIVE-VERIFIED on prod: .fd tokens resolve, F on green, Play pills green, hairlines back, quiz 0 transparent

- **C3-B:** ~250 literal palette hexes in JSX inline styles, CSS-in-JS strings and the generator's CSS templates → var(). Left literal
  BY RULE: canvas fillStyle/strokeStyle (share cards), SVG attrs, JS comparisons (clubReadableText/inkOn/softenAccent), confetti arrays,
  Lucide color= props, PAGE_BG/PAGE_FG (theme-color), comments. Verified on the local build: 0 unresolved/transparent colours on /play
  home + a quiz; on-green ink rgb(6,35,12). Script: scratchpad map-hex-jsx.py (quote-boundary matching). `design-tier2` now expects
  var(--grn-ink). **C3 remaining:** front.css `.fd` token block (the --grn-soft tint-vs-green collision), xiGame.mjs + public/lineup
  scoped palettes (different values — a deliberate skin? ask), the `renderQA` option CSS harmonised to .bq.
- **⚠️ REGRESSION I SHIPPED IN C3-A (2e58d2d, live ~1h40):** the hex→token pass also rewrote front.css's SCOPED DEFINITIONS
  `.fd{--bg:#0B0C10;--grn:#58CC02…}` → five became self-references (`--grn: var(--grn)`) = a CSS cycle = guaranteed-invalid = EMPTY
  inside `.fd`. On the live homepage the green Play pills went to white text, "Played" lost its green, card hairlines vanished. Found
  because the new F mark painted transparent. Fix (4a49967): the `.fd` palette block is DELETED (tokens.css defines every name at
  :root, same values); the gate `one-tokens-css.test.js` now fails on any self-referencing custom property. Memory:
  `feedback_hex_mapping_must_skip_definitions`. Lesson: verify getPropertyValue on the SCOPED element, not :root.
- **F MARK (Alex, on his phone: the mini KROOS/RAMOS chip "looks a bit bad — an F with green background"):** the Today card's Footle chip
  is the app's own mark (F on the green tile). The teaser computation (readFootleBoard/pickTeaserPair) and mini-grid CSS are gone from
  the front door. ⚠️ First cut painted white on transparent: `.fd-daily .fd-card-ic` (per-mode tint) TIED the two-class selector and
  came later — fixed with a three-class selector (29605e6). Memory `feedback_today_block_is_four_rows` corrected.

## 2026-09-05 (19:40) — 💡 TO DISCUSS: an "ideas" subagent (Alex) — a daily scout that reads GSC / Clarity / funnel deltas and the competitor set and brings THREE ideas with evidence, not a wishlist. Shape exists: `.claude/agents/funnel-analyst`. Decide cadence + inputs together.

## 2026-09-05 (19:15) — 🎯 QUEUED, PRIORITY: RANK TOP 5 FOR "football quiz" AND "football games" (Alex: "not something we park, we queue it")

**✅ FIRST BRICK LIVE (b6e1101, 20:10):** `/football-games/` — title "Football Games — Daily Puzzles, Quizzes and Wordle" (60), today's
Footle as the island at the top, the four dailies as cards with played-state + countdown, 8 mode cards, doors to /quiz/clubs/, /quiz/ and
/football-quiz/, FAQ, ItemList(14 Game) + FAQPage schema. Games nav → the hub on every page (static shell + SiteHeader), footer renders
the same `GAMES_NAV` list (src/marketing/siteNav.js — ONE list), /football-quiz/ links "daily games" → hub. Sitemap daily/0.9. IndexNow
pings on deploy. **Alex: in GSC, "Request indexing" for https://balliq.app/football-games/ speeds the first crawl.** Gate
`games-hub.test.js`. **Next bricks:** (2) read GSC for both terms weekly (via Chrome); (3) authority — the Reddit/community plan needs
Alex's hand; (4) pages for the 7 modes still in the shell (also lifts the hub's outbound quality); (5) revisit /football-quiz/ copy depth
against the BBC / FourFourTwo / Planet Football hubs once the hub has two weeks of data.

Baseline (memory): "football quiz" ~position 41 on `/football-quiz/`; ranking diagnosis says fundamentals are clean and the ceiling is
AUTHORITY. "football games" has NO target page yet — the header's Games link is `/#games` (a homepage anchor). Footle has started
climbing in GSC since the answer page (09-04). Plan to brief next: (1) read GSC for both terms + SERP composition (who holds page 1,
what shape of page), (2) a real `/football-games/` hub (the four dailies + every mode, playable, linked from every page's Games nav),
(3) `/football-quiz/` as the canonical "football quiz" page — content depth, internal links from all ~250 pages, title/H1,
(4) authority: the Reddit/community plan (memory: reddit account state), answer pages, llms.txt, (5) measure weekly in GSC.

## 2026-09-05 (19:00) — ✅ P0 UNIFICATION, FIRST PASS LIVE: A · B1 · C1/C2 · C3-A · D (fbaee2e) — all live-verified at 375

Order Alex confirmed 17:00: A ghost landing → B one question widget → C tokens → D header. Each its own commit + gate + live check.
- **A ✅ LIVE (c49b358):** `index.html` −15 KB (22%) — the original marketing landing (`.landing-top/-bottom`, ad-slot asides, their
  CSS, the `html.full-bleed` head branch) was hidden on EVERY route by five mechanisms and still parsed by every visitor. Kept: pre-boot
  onboarding shell (owns /play LCP), the crawler copy inside #root, the desktop gradient. Gate `index-html-no-ghost-landing.test.js`.
- **B1 ✅ LIVE (ace2618 + 24a1efb):** listicles + `/football-quiz/` render `renderQuizSet` (.bq) — `renderTaster()` deleted. ⚠️ Found
  and fixed a miss from the Daily 7 slice: the `.bq-daily[hidden]` override had been pasted INSIDE the multi-line rule = CSS nesting =
  never matched; the empty amber bar was live on every listicle/football-quiz page. `bq-css.test.js` now checks brace DEPTH.
  **B2 (open):** the old taster (TASTER_JS/TASTER_I18N) survives on 46 localised club pages (de 4, es 11, fr 5, id 3, it 9, nl 4, pt 8,
  tr 2) — the .bq engine's 17 UI strings are English-only; give it a strings table, then delete TASTER_*. `one-question-widget.test.js`
  pins the count at 2 builders. ⚠️ `renderQA()` (the tap-to-check Q&A LIST on /lists, category, player, nation pages) is NOT a card
  quiz and must stay a readable list — the "quiz with answers" content those pages rank on; harmonise its look to .bq, don't replace.
- **C1/C2 ✅ LIVE (8b556d9):** tokens.js carries the APP's names as aliases onto the web palette (`s1: var(--card)`, `accent:
  var(--grn)`, `t2: var(--tx3)`…) + one `--font`. app.css's :root, the ≥1024 re-pin and 23 `inherit` lines gone; `.fw-host` no longer
  hand-copies the palette; every body/component font reads var(--font). Two values moved to the web palette: text #FFFFFF→#F0F1F5,
  red #FF4B4B→#FF4747. Gate `one-tokens-css.test.js`. ⚠️ front.css keeps a scoped `.fd` token block: its `--grn-soft` is a TINT
  (rgba .14) while tokens' --grn-soft is a lighter GREEN (#8AE042) — a naming collision to resolve before that block can go.
- **C3-A ✅ LIVE (2e58d2d):** 152 literal hexes in app.css/footle.css/front.css/index.html `<style>` → var(). Left
  literal: comments, url() data URIs, theme-color, the pre-boot shell's inline styles. Gate `no-inlined-palette-hex.test.js`.
  **C3-B (open):** JSX inline styles (App.jsx 15 css-ish, screens ~12) and gen-seo's CSS strings (18). Never: canvas, SVG attrs, OG.
- **D — RESHAPED by Alex (17:45): "why should we have another one that just copies the app?"** → not "a header with a /play mode"
  but RETIRE the /play home for browser visitors. ✅ LIVE (fbaee2e), verified on prod: bare `/play` → `/` in a browser (main.jsx `_barePlay`); `?tab=` door
  (home|daily|online|profile); both headers' Sign in → `/play?tab=profile`; `/trail`,`/mystery` → the pages; e2e 27× → `/play?tab=home`.
  PWA/native unchanged. Gate `play-home-retired.test.js`. **Open after D:** the 7 modes without a page (classic, survival, hotstreak,
  legends, chaos, stadiums, online) still run in the shell under the site header — each needs a page or an app-only decision; the
  `?game=` runner still shows the app tab bar (observe, then decide).
- **Retire `/play?game=footle|daily|trail|mystery` after the 09-12 reads** (`*-web-view/finish`).

## 2026-09-05 (16:30) — ✅ TRAIL + MYSTERY PLAY ON THEIR PAGES — all four dailies now have a web home

**Live-verified on prod (92c42d6) at 375×812:** `/transfer-trail/` and `/mystery-player/` mount the app's own
`TransferTrail.jsx` / `MysteryPlayer.jsx` as Vite islands (`src/islands/trail.jsx`, `mystery.jsx`, shared plumbing in
`dailyIsland.jsx`). Played both through on the local build: Trail lost 5/5 → `biq_trail_<date>` = lost, `biq:daily-completed`
fired, full ladder in club colours, loss chains to `/mystery-player/`; Mystery guess → rank 1226 of 9,032, `biq_mystery_<date>`
written in the app's shape; homepage Today card read the Trail as "Played · Review" straight after.
**The seam:** both screens imported `{Confetti, haptic, playSound, CLUB_ABBR, CLUB_PACKS}` from App.jsx — they now take
`services` (`src/games/dailyServices.js`; App passes `DAILY_SERVICES`). Club colours/codes come from
`src/data/clubPackColours.js`, GENERATED by `gen-club-index.mjs` out of App.jsx on every build (CLUB_PACKS stays in App.jsx:
legacy inline questions + `club-sections.test.js` parses it there). **The weight:** pool (356 KB gz) + careers (289 KB gz)
load on FIRST FOCUS of the guess box (`src/lib/usePlayerPool.js`) — measured zero data requests before focus on both pages.
⚠️ Lazy data means memo deps: `suggestions` had `[text, guesses]` and showed nothing for the first word until a retype —
fixed (92c42d6), lesson in the code. Gate: `tests/unit/daily-islands.test.js` (no App.jsx import in any daily screen, pool
on demand, islands registered + mounted, generated colours == App.jsx). Events: `trail-web-view/finish`,
`mystery-web-view/finish`, `store-out` where=trail-result|mystery-result. Practice boards folded under `<details>`; the hero
practice card + six trail.js generator imports removed. Homepage tiles/Today card → the pages; zero `/play?game=trail|mystery`
links left outside App.jsx.
**Alex (16:15):** Mystery header "a bit hectic" (yes — the H1 named the game and the screen's title row named it again,
five things in one row wrapping to three lines) and the funnel should show store BADGES not "iOS / Android" text.
→ Shipped as b20dafb (embedded masthead via `embedded` prop; `StoreBadge.jsx` + `storeGlyphs.js` shared with the generator;
result CTAs = the visitor's own badge; homepage row + footer = both badges). **b20dafb LIVE-VERIFIED on prod at 375: Mystery masthead one 54px row (No. · ? · Closest), no icon well; both badges on the / row and footer; zero bare iOS/Android words; console clean.**
**Next:** retire `/play?game=footle|daily|trail|mystery` once each `*-web-*` has a week of numbers (read ~09-12); then the P0
unification (tokens.css / header / .bq-card / ghost landing / 19-file green); then the P2s; then the 09-03 leftovers.

## 2026-09-05 (11:10) — ✅ WEBSITE CRITIQUE COMPLETE — 24/40 (was 22/40 on 09-03)

Report: `.impeccable/critique/2026-09-05T09-09-37Z__balliq-app.md` (commit 6150ea5). Inputs kept beside it:
`_assessment-A-2026-09-05.md` (design review, club quiz played to the finish), `_assessment-B-2026-09-05.md`
(detector + DOM measurements, the app-funnel and header-consistency tables), `_fragmentation-map-2026-09-04.md`.
Two P0s, both Goal 1 (one site): **one domain, three products** (two headers, four stylesheets, three body
font-family strings, type ramp 13–21 vs 29–36, /play stacks the site header on the app tab bar, the ghost
landing = 32% of index.html) and **four multiple-choice widgets**. Four P1s: Next button **212px below the
fold** after answering on club pages (was 18px on 09-03 — worse); one club → two destinations; the funnel is
everywhere (6 badges on a club page, 0 visible on /play mobile, two 17px footer words on /); the finish
screen sells instead of settling.
**Alex's answers (09-05):** retire the web `/play` game routes (`/play` keeps account, profile, live rooms) ·
P1 quick wins before the P0 unification · club colour on the site, subtle (4px rule, no crests).
**✅ P1 QUICK WINS SHIPPED + LIVE-VERIFIED by DOM at 375×812 (91a0096, 459b04c):** sticky `.bq-next` pins at
752–802 in an 812 viewport the instant an answer lands (was 974–1024); `.bq-why` scrolls into view only when
below the fold; `.hero` and `.bq-card` use `overflow:clip` (hidden made them the sticky container — first build
failed on exactly that); finish card = one primary (Keep going / Play again), the `/play?club` crossing is gone,
one quiet `.bq-app` → `/get?src=clubq-finish`, score captioned with %, today's result remembered on the ribbon
after a reload; app band lost its "Play free in your browser" button; 404 hero has no badges; homepage club
tiles → `/quiz/<slug>/` with a 4px club-colour rule, one `.fd-app` row after Today (44px links).
**Also shipped 09-05:** reveal-scroll honours reduced motion with `instant` (be6…); BOTH header finders (static shell +
React SiteHeader) send a club hit to `/quiz/<slug>/`, not `/play?club=` — live-verified ("ars" → /quiz/arsenal/).
**✅ FOOTLE PAGE SHIPPED 09-05 (7ab9edb → 9c…): `/football-wordle/` plays today's Footle — the app's own
`FootballWordle` component as a Vite island (`src/games/FootballWordle.jsx` + `footle.css` moved out of App.jsx/app.css
with a `services` seam; `src/islands/footle.jsx`; gen-seo reads `dist/.vite/manifest.json` — build FAILS if the island
is missing). Page: compact hero (no Play-to-app button, no badges) → runtime masthead "Footle No. N · date" → board →
folded practice puzzle → How to play (#how) → hints → recent → app band → FAQ. Today card on `/`, club-finish door,
answer page and practice band all → the page. Events: `footle-web-view`, `footle-web-finish`, `store-out`
(where=footle-result). Verified on the local build at 375/1440: mounts, tokens resolve, a guess grades and persists
under `biq_wordle_<date>`, result card renders (share / WhatsApp / Get the app / countdown). ⚠️ In the Browser pane
animations and smooth scroll are FROZEN (visibilityState hidden, rAF 1 frame/400ms) — mid-flip tiles are a tool
artifact; verify motion on a device. Known follow-up: ENTER ~1027px at 375×812 (tile cap uses the app's chrome
budget) — size tiles to this page's chrome. **Next dailies:** Daily 7 → Trail → Mystery, same island pattern; then
retire `/play?game=footle` once `footle-web-*` has a week of numbers (read 09-12).
**Alex (09-05, 4th answer): build static playable daily pages FIRST — `/football-wordle/` playable Footle, then
Daily 7, Trail, Mystery — and only then retire `/play?game=…`.** **Next (in order):** (1) the Footle page; (2) P0 unification: one tokens.css, one header component with a /play mode, one
`.bq-card` for lists + football-quiz pages, delete the ghost landing in index.html (32% of the file), map the
19-file green; (3) P2s: table-first on /lists, directory filter + jump chips, footer to 4 columns, 37px header
links → 44, caption grey 3.9:1 → AA; (4) re-inspect the 09-03 items not covered: report sheet, 1911 void, Games
dropdown at 390. **Reads 09-11 now also include** `clubq-out-store` (replaces out-play), `fd-app-ios/android`,
`store-out` per `data-band`.

**Also parked, verified on disk, resumable:** Watford 40 (wat-final.json, 11 leaks to resolve) and QPR 40
(qpr-verdict*.json, 2 fixes both the Loftus Road "since 1917" false premise) — curate, prose, wire, ship.

## 2026-09-04 (17:00) — ⏳ WAVE Q IN FLIGHT: Middlesbrough (one club, forge only)

**Run ID `wf_5da68475-9b0`** · script `scripts/wave-q-forge.workflow.js` · ~70 agents (2 gen lenses ×20,
then examiner + skeptic per question, then prose). One club on purpose: wave P put three through at
~180 agents, burned 7.4M subagent tokens and died at the session limit.

**⚠️ IF THIS SESSION ENDED MID-RUN — DO NOT START A NEW FORGE.** Every finished agent has already
written its result to disk and `resumeFromRunId` is SAME-SESSION ONLY. From a fresh session, harvest:
```
node scripts/forge-harvest.mjs \
  /Users/alexanderbrynolsen/.claude/projects/-Users-alexanderbrynolsen-ball-iq/7c79f3a1-9008-4410-9f7a-2a99269af58f/subagents/workflows/wf_5da68475-9b0 \
  wave-q.json
```
Same session? `Workflow({scriptPath: 'scripts/wave-q-forge.workflow.js', resumeFromRunId: 'wf_5da68475-9b0'})`
— finished agents replay from cache for free. ⚠️ forge-rescue.mjs has failed at this job before; the
harvester is the route.

**⚠️ COST, MEASURED MID-RUN (Alex spotted the ~100k-per-agent figure).** Per examiner agent: cache
read 86,535 · cache write 13,669 · genuinely new input **2** · output 870 (323 thinking). The
headline number is the subagent's fixed context re-paid per agent, mostly as cache READS — real cost
is ~an order of magnitude below what it looks like. **But 74 agents each writing their own cache to
do 870 tokens of work is real waste.** Alex's call: **Q finishes on the proven pipeline as the
control; batch 5 questions per verifier from West Brom onward** and compare survival rates. ⚠️ That
change also breaks `forge-harvest.mjs`, which keys on the literal "You are the EXAMINER" /
"You are the SKEPTIC" strings — update it in the same commit.

**Still to do after the forge (each its own slice, not one sitting):**
1. `node scripts/forge-curate.mjs wave-q.json .` — ⚠️ its CLUB_FIELD map currently holds Alex's
   uncommitted 8-club edit; Middlesbrough must be added and his edit left intact. Required: catches
   HTML entities, semantic dupes, mutual-leak pairs and within-club answer leaks.
2. `node scripts/add-questions.mjs` then the wiring: App.jsx ×6 (incl. CLUB_ORDER), MarketingHome ×2,
   gen-seo ×2, club-competition.mjs, clubs.mjs prose. **`clubs.mjs` `club` must equal the bank's
   `club` value — "Middlesbrough".** In-app league bucket "pl" (no Championship section; West Ham
   precedent); `club-competition` "Championship" per leagues.mjs, which is data not a guess.
3. Build (expect several named failures — each one is the gate doing its job), commit, push, then
   verify live by static `<title>`, never HTTP 200.

**Why Middlesbrough opens the frontier:** mid-size clubs out-pull giants in our own GSC (Everton ~335
impressions, Celtic 232, Leeds ~190 vs Bayern ~167, PSG 51) because a fanatical mid-size club's SERP
is not owned by big publishers. Next in the queue: West Brom, QPR, Watford, Sheffield Utd, Blackburn,
Millwall, Preston.

## 2026-09-04 (16:30) — BREADTH OVER DEPTH (Alex's call), AND WHAT GSC CAN AND CANNOT ANSWER

**Alex: add club packs before topping up thin ones. Agreed — his argument is better than mine.** 95% of
sessions view exactly one page and the 14d return read was 1,713 once / 22 on 2-3 days, so pack depth
serves a cohort that barely exists while breadth buys new query surfaces. PRODUCT.md already says it:
*the obscure club is the moat*. Constraint to plan around: the build gate needs **≥15
explanation-bearing questions per club page**, so each new club is a 15-20 question wave.

**Coverage today: 89 pages against 356 league clubs.** Biggest gaps: Championship 12/24, Serie A 10/20,
La Liga 8/20, Bundesliga 6/18, Ligue 1 4/18, Brasileirão 4/20, Eredivisie 3/18, Süper Lig 4/18,
Primeira Liga 3/18, Pro League 2/18, Scotland 2/12 — and **zero** in Eliteserien, Allsvenskan,
Superliga, MLS and the Saudi Pro League.

**⛔ GSC CANNOT CHOOSE THE CLUBS.** Scanned all 1,000 queries (3 months, 83.5k impressions) against the
274 league clubs with no page: **zero matches.** The only "hit" was Angers inside "rangers quiz" — the
exact fuzzy-match trap club-alias.mjs documents. We never appear for a club we have no page for, so
our own data holds no signal about them. Any ordering is a bet on external volume, not on evidence.

**What the scan DID show — mid-size beats giant.** Impressions by club: Everton ~335, Beşiktaş 280,
Feyenoord ~263, Celtic 232, Galatasaray ~207, Rangers ~194, Leeds ~190 — all ahead of Bayern ~167,
Juventus ~219 across three spellings, Inter ~113, PSG 51, Dortmund 52. Giants sit in a SERP owned by
big publishers; fanatical mid-size clubs do not. **That is the selection principle**: Championship,
Scottish Premiership, Eredivisie, Süper Lig, Belgian Pro League and the Nordic leagues over one more
giant.

**✅ Shipped from the same scan: the one club title missing its abbreviation.** "bjk quiz" 200
impressions at position 6.8 and "bjkquiz" 80 at 6.6 — **280 impressions, ZERO clicks in 3 months**.
Every comparable title already carries the abbreviation (— LFC, — BVB, — Barça, — Man Utd) and those
convert; Beşiktaş's said "Black Eagles". Title now takes BJK. Baseline for the next read: 280i / 0c.
Six titles still carry no alias (santos, real-sociedad, atalanta, leicester-city, olympiacos,
panathinaikos) — no abbreviation queries in GSC yet, so they wait for evidence.

## 2026-09-04 (15:45) — THE GUEST FUNNEL, FOLLOWED TO ITS END

**The "58% of accounts never play" number is two populations.** 30 days, split by `auth.users.is_anonymous`:
**real signups 114, of which 92 played — 81%.** Anonymous guests 49, of which 16 played — 33%. Activation
on real accounts is healthy; the leak is entirely in the guest population, and counting guest sessions as
"accounts" hid that. Median time from signup to first play is 176 seconds.

**Following the 33 guests who never played:** 18 of them reached a room, and **12 of those were in a room
that never started** (6 more were in a room that DID start and still recorded nothing — that is the
counter bug fixed in f42498f, since MP is usually a guest's only mode). So the invite → dead room path is
the guest funnel's biggest single loss.

**✅ Shipped: a dead invite link is a door, not a wall (bcd2bd9).** The initial room select filters
`state='ended'`, so a guest tapping an invite after the host left got "⚠️ Couldn't load room" and a
**Try again that can never succeed**. The hook now says which failure it is (`errorKind` 'gone' vs
'fetch'); the gone branch is no longer an error screen — a wave not a warning triangle, plain words,
no retry, and the same door LobbyEnded already gives the guest who was in the room when it died:
today's Daily 7 as the primary button. `mp-join-dead` counts how often an invite outlives its room.
⚠️ **NOT seen rendering** — reaching LobbyError needs a signed-in client opening a link to a dead room.
Alex's device test: create a room, leave it, then open the invite link you shared. Strings verified in
the built bundle; the branch is pinned by tests/unit/mp-dead-invite.test.js.

## 2026-09-04 (15:20) — ✅ 2. THE LOBBY: the number was wrong, and the instrument was missing

**"27 of 68 lobbies never start, 19 with the host alone" does not survive a proper read.** All 27 are
`state='ended'` — none is a room still sitting there waiting. Breakdown: **13 hold ZERO room_players
rows** (create_room inserts the host's row in the same transaction, so these are hosts who opened a
lobby and left before anyone arrived — 48% of the failures); 6 one player, ended; 8 two players,
ended — **of which 4 are a "Host Bot 7 + Golden Maestro 53" harness pair**, and 3 of the solo rooms
are one guest opening rooms three times in eleven minutes. **Genuine two-player rooms that never
started, in a week: four.** Not a number to build a feature on — and "19 hosts waiting alone"
conflated an empty room with a host who waited.

**Shipped instead (1b698cb): the lobby now reports its own funnel.** It fired no events at all except
the rival prompt. `mp-lobby-open {host, mode}` · `mp-invite-shared {via}` on the tap, share sheet AND
code copy · `mp-lobby-left {host, players, invited, secs}` emitted BEFORE leave() ends the room (the
test pins that order). That answers the only question the rows can't: did the thirteen try to invite
anyone, or never find the control? **Read 2026-09-11 with the rest.**

⚠️ Lesson for every MP query: harness traffic sits in `room_players` under "Host Bot", "Headless Bot"
and `player_<hex>`; real guests get the app's own "Adjective Noun NN" names, which look identical to
bots at a glance. Exclude by name before counting anything.

## 2026-09-04 (15:00) — TWO OF THE THREE, AND A NUMBER THAT MEANT SOMETHING ELSE

**✅ 1. The club-quiz page laid out 66 questions to show one (a303605).** /quiz/arsenal/ ships 66
questions and 264 option buttons — 1,379 of the page's 2,085 tags — because the whole set must be in
the HTML (it is the "with answers" text the page ranks on, and what a JS-off reader gets). The engine
then hides all but one. `content-visibility:auto` + `contain-intrinsic-size` on `.bq-q` lets the
browser skip the RENDERING work for anything off-screen: no change to the DOM, the a11y tree,
find-in-page or what a crawler reads — it is not display:none. **Deterministic local measure, five
runs each, same tab: laying the full list out 44.5ms → 1.4ms.** PSI mobile is too noisy to confirm a
delta at n=3 (pre: TBT 410ms / Style&Layout 1,254ms; post: 34ms/420ms, 140ms/655ms, 1,050ms/1,057ms).
⚠️ **Watch CLS on the next read** — it was exactly 0 before, and post-deploy runs show 0 / 0.005 /
0.029. Well inside "good", but it was perfect; if it holds above 0, tighten the intrinsic size.

**✅ 3a. Online was the one mode that still didn't count as a game played (f42498f).** Six accounts
whose only `scores` rows are mp:race / mp:survival read games_played = 0, latest play 1 September —
so a player whose whole experience is rooms with friends sees "0 games" on their own profile, and
those are the invited players the room funnel converts. `recordDailyPlay` → `recordPlay`, accepting
null for a mode with no per-player correct count. Guard now pins five branches, not four.
⚠️ 13 historical accounts still read 0 with rows in `scores` — **a backfill is Alex's call**, not a
silent prod write.

**⛔ 3b. THE NOTIFICATION NUMBER MEANS SOMETHING ELSE — nothing to fix.** "43 shown, 4 yes, 33 no"
is **native anonymous rows**: 7d gives 38 shown / 28 no / 5 yes / 4 dismissed with `visitor_id` NULL
on every one, because `loopEvent` sends native events as name-only by Alex's 2026-08-23 decision,
which the privacy policy, the App Store label and the Play Data form all state. So it is EVENTS, not
people, and it can never be split by copy. The **web** ask has been shown **once ever** (2026-09-03):
17 people hit the deliberate `guest` bail (web push upserts by user id) and 6 the `unsupported` bail.
The ask already fires post-solve with the streak-stake copy. There was no conversion problem — the
ask barely runs on web, and native gives a ratio of events at best (5/38 ≈ 13% yes).

**Next:** 2. lobbies that never start (27/68 in 7d — 19 host alone, 8 with two waiting).

## 2026-09-04 (14:00) — 1.7.3 SUBMISSIONS PREPARED (both consoles, nothing pressed)

**Play (Ball IQ, production track):** the release draft is built — **App bundle 48 (1.7.3)** attached
and the 11-locale release notes saved (4,432 chars, `<locale>` blocks, verified after a reload).
Alex presses **Neste → Start utrulling**. I do not.
**App Store Connect (1.7.3, Prepare for Submission):** What's New + Promotional Text written for
**all 15 locales**. ⚠️ The UI verification pass LIED — switching locale repaints the form slower than
a script reads it, so three locales looked like they held another language's text. Ground truth came
from ASC's own API (`/iris/v1/appStoreVersions/<id>/appStoreVersionLocalizations`): all 15 match
`store-assets/1.7.3/whatsnew.json` byte for byte (sha-256 prefix per locale). Waiting on Alex: the
Xcode archive + upload of build 112, then I attach it. "Add for Review" is his.
**⚠️ Do NOT drive a native file picker with osascript** — the keystrokes go to whatever is focused.
The AAB path was typed into Alex's chat box, twice. `file_upload` works under 10 MB and the fresh AAB
is 7.6 MB (the 24 MB one predated the cutout move).
**Re-cut before either upload** — two things Alex saw on his phone, fixed and rebuilt (ea6e524 +
the test gate): Transfer Trail was listed twice on Home (daily row AND a More-modes tile, same
destination — tile gone, invariant gated in design-tier2), and the quit dialog's two saturated
slabs became one accent + one tonal destructive (red on red-tint, 5.9:1) on a blurred scrim.

## 2026-09-04 (day 3, 10:00) — THE GROUND LIFTS: C with B inside

Alex on his phone: "does not hit me as modern… not sure if it is the background colour or what; the
Footle grid looks outdated". A/B page (https://claude.ai/code/artifact/ec2e8dc1-e29c-4b47-b19f-29f9ed56c048):
A as shipped · B filled tiles/keys in the game's colours · C = B + lifted surfaces. Alex: C.
**Shipped (deca1fc + the escape fix):** bg #0A0A0A→#0B0C10 · bg2→#0F1116 · card #0F1117→#13151C ·
card2 #14161E→#1B1E27 · pressed→#232631 · bd #242836→#242730 · bd2→#2F3240 · bd3→#3E4150 · hover→#181A22
· ruled-out tile→#2E323E · rgba(10,10,10)→(11,12,16). The values were INLINED in 32 files / 310 sites
(app.css, App.jsx, index.html, manifest + theme-color, OG images, sign-in sheet, generator, sidecar,
tests) so the mapping was applied everywhere in one commit. Band tiles/keys filled, game's green/amber,
8/10px corners; the game's own tiles filled (--s2, 8px). Sweep: 11 screen types × 390/1440 on the local
build — clean except the Footle board at 390 (7px overflow: fixed -20px escape vs the web shell's
clamp padding — yesterday's shell, fixed). Lesson: when tokens exist but values are inlined, a "token
change" is a MAPPING across the repo, not an edit to tokens.js. Prod sweep (8 shots, 0 errors, bg live) found a
SECOND, older 3px jiggle on the Footle screen: the keys' ::after touch-slop poked past the viewport on the
outermost keys — fixed (first/last key slop stops at the edge).
**✅ Brick 2 (same morning): Today gets a front foot.** A/B (https://claude.ai/code/artifact/5a99198c-7b15-496b-acb0-7cadd06b2f03):
A four equal cards · B Footle leads with a live board · C one list card with a ring. Alex: B. Shipped: .fd-lead
(20px name, one line, 44px Play, the player's REAL board graded from biq_wordle_<date> — empty + ringed for a
newcomer), three compact rows beside it (under it on phones); the practice band is no longer its own section —
it opens from a text link under the lead (one Footle door, not two). DESIGN.md Components + the sidecar
refreshed (generatedAt bumped, "Lead card" entry). **Opens the next thesis brick:** make the lead board playable
IN PLACE — today's Footle on the website itself, the practice engine pointed at today's puzzle with the state the
app reads.
## 2026-09-04 (13:00) — THE AUDIT: weaknesses, upgrades, cleanup → the next five

**Found and fixed on the spot:** CI had been RED on main since f043131 (the share-stub in
ghost-name-capture.spec.js read only `text`; the link now travels as `url`) — fixed 9c1ff33. Two stale
git worktrees (285 MB, detached at 28 Aug, no changes) sat INSIDE src/ — removed + pruned.
**Codebase:** npm audit clean (0). No unimported src modules. Bundle: GameRoot 182 KB gz + index 46 +
CSS 27; front door 9 KB. App.jsx 14,623 lines, OnlineMultiplayer 3,148 — the long-term debt.
**Perf (PSI mobile, lab / field):** /quiz/arsenal/ 82 (TBT 700ms — the engine pre-renders all 26 questions'
260 buttons) · / 74 (LCP 4.5s) · /play?game=footle 65 (LCP 6.2s, 638 KB, 125 KB unused JS). Field is
FAST at the origin level; the lab number matters because the game door is where 1,045 first games/month
land and 5% finish.
**Product signals:** 94 question reports / 70 questions in 30d — 58 reports on 39 questions with NO review
row, 17 of them Footle answers · 49 of the 125 "zero-game" accounts DID play Footle/Daily 7 —
profiles.games_played ignores those modes · 27 of 68 lobbies (7d) never started · notif prompt: shown
43, yes 4, no 33 · native 1.7.2 cut 09-01, 84 commits since (palette, nudge, guest sheet all web-only
for native users).
**Ask Alex:** `_tmp-results.mjs`, `assets/social/*.png` (untracked, his), and the pre-session edits to
`.audit/critique-2026-09-02/watcher.log` + `scripts/forge-curate.mjs` — keep, commit or drop?

**✅ 1 SHIPPED (bc5df66):** /play?game=footle PageSpeed mobile **65 → 90, LCP 6.0s → 2.9s, TBT 300 → 70ms.**
Two causes, two fixes: the LCP element was the header's search field and the header was React (nothing above
the fold painted before the 183 KB game chunk ran) → the build injects the shell's static header into
index.html outside #root, SiteHeader removes it in a layout effect; and the boot warmed the question index +
Profile + Online chunks (84 KB gz) on the same 1.6 Mbps pipe → a door arrival defers them 20s, 2G/3G/Save-Data
skips them. Verified locally (blocked chunk → one static header; full boot → one header) and on prod.
**2 in progress:** all 102 Trail careers match Wikipedia today (verify-trail-careers, 0 editorial fixes);
Werner→San Jose (Jan 2026) and Benzema→Al-Hilal (Feb 2026, left 31 Aug — still the last club) confirmed by
two sources each; Cazorla retired at Oviedo July 2026 confirmed. The 39 unreviewed reports are DIFFICULTY,
not error: 11 trails, 14 Footle "I lost" answers, 13 classics of which most were reported with picked ==
correct. Disposition: mark reviewed/approved with the verification note; keep the Footle obscurity signal
(BELOTTI, ELLIOTT, VALVERDE, WILLIAN) for pool curation.
**✅ 2 DONE:** 39 review rows written (source qb, status approved, edits {triage, verdict: difficulty, kind}); the
notes carry the verification. Footle obscurity signal kept: BELOTTI, ELLIOTT, VALVERDE, WILLIAN.
**3 READY FOR ALEX — 1.7.3 cut (9eaa802 + 45f239f):** AAB built (24.2 MB, jarsigner verified) at
android/app/build/outputs/bundle/release/app-release.aab; iOS synced (ios/App/App/public matches source, 28
chunks); preflight ✓ on every artefact check — its only ✗ is "working tree dirty", which is the six
pre-session files (.audit/watcher.log, scripts/forge-curate.mjs, _tmp-results.mjs, assets/social/,
.impeccable/config.json + critique) awaiting Alex's keep/commit/drop. ⚠️ Two traps found and fixed on the way:
CocoaPods needs LANG=en_US.UTF-8 here, and public/lineup/cutouts (4,342 gitignored PNGs, 1.7 GB) rode into
dist and both native bundles — Gradle spent 30 min signing 1.9 GB; moved to assets/lineup-cutouts/, dist is
now tens of MB. Both in memory (reference_android_signing_build).
**(was) 3 IN PROGRESS — 1.7.3 cut (9eaa802):** iOS 1.7.3 (112) / Android 1.7.3 (vc48); What's New in 15 ASC locales +
11 Play blocks (store-assets/1.7.3/). cap sync both platforms ✓ (⚠️ CocoaPods needs LANG=en_US.UTF-8 in this
shell — first run died; now in memory). AAB + preflight running. **Alex's steps:** Xcode → Product → Archive →
Distribute (automatic signing; no distribution identity lives on this Mac) · ASC: What's New in ALL 15 locales
(paste from whatsnew.json; the guarded-JS method, never cursor keys) · Play: upload the AAB, notes from
play-whatsnew.txt (11 blocks in one textarea) · device test on TestFlight before submit.

**THE NEXT FIVE:**
1. The game door's boot — LCP 6.2s lab on the destination of 1,045 first games/month (5% finish): split
   what a single game needs from GameRoot, preload by door, a first-paint skeleton. Target lab LCP <3s.
   Pair with the 09-11 read of first-game-started by entry.
2. Question-report triage — 39 reported questions with no review row (players ≈100% precise), and what the
   17 Footle-answer reports say about the pool.
3. Native 1.7.3 cut (Alex uploads): vc48 / build 112, cap sync from a clean dist, device test.
4. Lobbies that never start (27/68 in 7d): 19 had the host ALONE, 8 had two people waiting and still
   never started — so both halves: nobody came (the invite), and two came and nobody pressed start (the
   lobby). Fix the wait in both.
5. Two small honest ones: games_played counts Footle + Daily 7 (Profile shows the wrong number); the
   notification ask fires after a solved Footle with a Footle-specific line (4/43 today).
**Rolling:** App.jsx modularisation, one screen per day, e2e as the net.

## 2026-09-04 (day 3, 11:30) — THE AGENDA, FROM THE NUMBERS (Alex: "do these five, in order")

**The read that reframed the day:** the front door had **8 visitors** in its first 36h (fd-view; GSC agrees:
126 clicks/28d ≈ 5/day). The club pages are the product: **637 visitors started a club quiz in 30d, 262
finished, ~40 went on into the app, 10 came back on another day.** Sharing: 102 people shared a Daily 7
result, 2 arrived via share. Accounts: 250 ever, 125 with zero games. Habit core: 9 signed-in users on 8+
of 14 days (43 games avg), 11 on 4–7. Rooms: 68/7d, 41 started. Two lying instruments: first-game-started
fires on club pages too (finished only in-app); Derby 223 starts from 4 visitors.
**Verdict on the playable lead board on `/`:** not with 5 visitors/day — the same engine belongs at the
END of a club quiz, where 500 people a month finish and see nothing.

**The five, in order:**
1. ✅ Club-quiz finish → the product. The Footle door on the finish screen was a grey text link: **0
   clubq-out-daily clicks against 262 finishers in 30d** (its third camouflaged treatment). Now a card —
   board picture, name, one line, green Play — outside .bq-row. **Baseline 0/262; read clubq-out-daily
   per clubq-finish on 2026-09-11.** If it draws, next: the board playable in place on the club page.
2. ✅ Share loop (f043131 + 65ed9e3): navigator.share gets {title, text, url}; a cancelled sheet is
   share-daily-cancel, a completed one share-daily-done {via}; /c/ hits land in funnel_events as
   'loop-hit' {loop, bot, country}. ⚠️ First deploy wrote nothing: VITE_SUPABASE_URL is NOT set on
   Vercel's functions — api/p.js already falls back to the project URL, c.js now does too.
   ⚠️ And fire-and-forget behind ctx.waitUntil landed 1 probe in 4 — the write is now AWAITED with an
   800ms ceiling (f0c292b); 3/3 probes landed after that. Probe rows deleted; the read starts clean.
   **Correction:** the "every share was a clipboard copy" reading was wrong — native=false means the
   WEB platform (loopEvent strips meta on native). 153 web share taps, landings unknown → now measurable.
3. ✅ Instruments (a980972): first-game-started carries {mode, entry ∈ door|challenge|club-door|quiz-door|
   invite|link|app} — on the web 1,045 first games started vs 53 finished (5%) against 57% signed-in,
   and next week's read can say WHICH door bleeds. clubq-start guarded to once per page load (the
   Derby 220 was one visitor in 4 minutes on 08-23, a cached pre-fix page).
4. ✅ Netherlands — nothing to build: a /nl/ layer already exists (hub + ajax/feyenoord/psv, reciprocal
   hreflang, visible cross-links). NL 28d: 1.71k impr / 25 clicks; "feyenoord quiz" 84 impr goes to the
   EN page (150 impr), /nl/quiz/feyenoord/ gets 36 and 0 clicks. Young + thin; read with the lists test.
5. ✅ Design → the game screen: in a browser Footle carried three rows of chrome (~180px of 844) before
   the board; the app bar now steps out during focused play and returns on results.
**Reads due:** clubq-out-daily/clubq-finish (baseline 0/262) and loop-hit bot/human and
first-game-started by entry — 2026-09-11.

**Next (design):** composition, not colour — the Today cards all weigh the same (nothing says "this one
first"); the band has no air above the grid; generic outline icons. One a day.

## 2026-09-04 — BRICK BY BRICK (Alex: "improve the state of this project every single day")

Alex's phone read of the front door: "good start, can be better but good". Standing order: find where
we are weak, add to Discover, keep SEO honest, and the four points from 09-03 (his eyes · close the
results wall · the return trip · then wait for data).

**The 14-day read that sets the agenda (prod, funnel_events, 2026-08-21→09-03):** ~60–75 actors/day,
of whom **0–7 signed in**. Distinct active days per actor in 14d: **1,713 once · 22 on 2–3 days · 2
on 4–7 · 0 on 8+.** Caveat: Footle writes wordle_state, not funnel_events, so signed-in daily players
are under-counted here — but the anonymous web visitor, who is now the product's main customer,
comes once and does not come back. That is the weakness. Club quiz 7d = 332 vs 767/30d (≈47/day vs
26/day) — the finder may already be pulling; too early to call. Signups w/c 08-31: 7 (partial week).

**Laid today (main):** 1) crawler-facing homepage was still the taster — `index.html` title /
description / OG / schema / the whole `#biq-prerender` block rewritten to describe the front door
(no counts); FrontDoor gets its one `h1` (sr-only; it had only h2s) · 2) the consent bar now hides
under the sign-in sheet (`.biql`) like it does under onboarding — "Continue as guest" was behind it
on a first EU visit · 3) "Continue as guest" is a real button (card fill, primary text, 700) ·
4) front.css drift snapped to the system (date → Title 15px, tag → Label 12px, icon radius 10, amber
→ #FFC107, dot ring → border token) and a **Wordmark** step declared in DESIGN.md.
**All four verified on prod (26a2cad, 2026-09-04 ~01:00):** crawler sees the new title/h1/description;
sheet hides the banner and shows it again on guest close; guest is a real button; front-door h1 present.
**GSC 28d (read via Chrome; memory project_gsc_28d_2026_09_04):** 1,650 clicks / 55.1k impr / pos
10.4. Club + league quiz pages are the entire top 10. Discover content is DEAD: /fun-facts/ 0 clicks
on 69 impr, /football-quotes/ 0/18, /club-nicknames/ 0/17 — don't add more of that type. /lists/
30/14.9k. **/football-wordle/answer/ 6 clicks on 30 impr = 20% CTR** — the Wordle-answer pattern
works and is barely built. Discover verdict: re-point the column at what pulls (club quizzes by
league, "with answers", Footle + its answer page, lists) and build the answer surface, not new
facts pages.
**✅ BRICK 2 (79f2f00, live ~02:30): the answer surface + Discover.** Alex: "is this an either-or? it is up
to you" → both. One page per finished Footle puzzle (/football-wordle/answer/N/) and per Daily 7 day
(/daily-football-quiz/answers/YYYY-MM-DD/), served (edge / Node) in the site shell, tested
(tests/unit/answer-pages.test.js), last 30 in the sitemap and linked from both landing pages (orphan
gate holds). Future → noindex 404; Daily 7 before the 08-19 log → 404. Discover re-pointed on all three
footers from src/marketing/siteNav.js; facts/quotes/nicknames under Ball IQ. Prod-verified all seven
route classes. ⚠️ I first read "No. 123 at 00:44 Oslo" as a stale cache and shipped SWR=60 for it — WRONG diagnosis: it
was 22:44 UTC, the server was correctly on the 3rd. The real defect: the app keys a puzzle to the
LOCAL date, the server to UTC, so every European between local midnight and 02:00 (peak "footle
answer today" time) is on N+1 in the app and N on the hub. Fixed: from 10:00 UTC (the date has begun
at UTC+14) /answer/N+1/ renders with the answer behind the reveal and the hub links to it. Daily 7
answers have the same UTC/local gap — not yet fixed (its hub is the only "today" URL).
**Read:** GSC page filters ~/football-wordle/answer/ and ~/daily-football-quiz/answers/ from ~09-18.
Memory: project_answer_pages.
**Next bricks, in order:** a) the return trip — bring Alex two concrete options with the data above
(the site has no reason to come back tomorrow: web push 1 subscriber, device tokens 48, in-app
daily_reminder rows 117, email activate 72 / day2 8 / winback 44) · b) Discover: what to add — needs
GSC per-page (connector down 09-04, use Alex's Chrome) · c) 09-10 and 09-17 reads.

## ✅ 2026-09-03 late — POLISH + WEB SHELL: the app sits under the site header on the web

Polish (main 6beafb9): generated /404.html with the shell; /home-preview + /home-old retired (files
deleted, vercel redirects → /); mono chrome → Inter on generated pages. Web shell (branch web-shell
f7a1994, merging): SiteHeader.jsx + AppBar.jsx replace the 248px sidebar / floating tab bar for
browser visitors (native + PWA untouched); wordmark → `/` in a browser. **Done:** 1) ✅ prod verified
after merge (/play, a game, wordmark, /home-preview → /) · 2) ✅ DESIGN.md re-documented (c47ff31,
"The Fixture List") · 3) ✅ results nudge fires on leaving results — PROVEN ON PROD 2026-09-03 late
(guest Daily 7 → results clean at +3s → Home → save sheet) · 3b) ✅ cold /play in a browser skips the
warm-up; preboot shell PWA-only · 4) ✅ the 7-URL lists title test (below) · 5) ✅ e2e specs rewritten
for the web shell (.fd-appbar-tab first in every nav locator; sprint26 asserts the /play bypass; one
PRE-EXISTING red fixed — sprint14's phone branch asserted "Guess the player", the product has said
"Surname of a footballer" since d58982a) · 6) ✅ phone app bar: Settings was scrolled off with no
affordance ≤720px (overflow:auto, hidden scrollbar) — now icon-only, five controls on one row.
**Open:** the exit save sheet's "Continue as guest" sits BEHIND the consent banner at 1440×900 for a
first-time EU visitor (both fire on visit one; seen in the prod play-through) — same class as
feedback_verify_ui_two_blockers; fold into "style Continue as guest as a real button".

### Lists title test — shipped 2026-09-03 late · READ ON 2026-09-17
Thesis: the seven page-one lists pages lose the click to Google's answer box, which already gives the
headline fact; each snippet now sells what the box lacks (per-season club + goals, beaten finalist +
score, years won, host). **Baseline (GSC 28d to 2026-09-03: clicks / impressions / position):**
la-liga-top-scorers 6 / 2,242 / 9.9 · eredivisie-top-scorers 2 / 361 / 10.2 · super-lig-top-scorers
2 / 309 / 9.9 · efl-cup-winners 2 / 187 / 9.7 · coupe-de-france-winners 0 / 751 / 9.4 ·
most-ballon-dors 0 / 446 / 9.1 · concacaf-gold-cup-winners 1 / 777 / 10.6. Read: the same 7 URLs,
14d vs the prior 14d (sc_compare_periods, or GSC in Alex's Chrome); a title change re-crawls within
about a week, so judge CTR, not clicks. Success = CTR up on ≥4 of 7 with position flat → roll the
pattern to the other 43 lists pages. Titles live in scripts/seo/lists.mjs (title/description only;
h1 and body untouched so the test isolates the snippet).

## ✅ 2026-09-03 — FRONT DOOR MERGED TO MAIN (69aeac2) — verify prod, then DESIGN.md

Merged on Alex's word ("this is good progress for us"). Live on balliq.app once Vercel finishes:
`/` = FrontDoor.jsx (website, not app shell); every generated page carries scripts/seo/shell.mjs
(one header + search + sitemap footer); one left edge on every page. **Next, in order:**
1) re-document DESIGN.md from the app system (the design hook still compares against the retired
Scouting Report) · 2) content-level pass on generated pages (mono breadcrumbs/eyebrows, stat strip)
· 3) results nudge off the +2s timer · 4) the 7-URL lists title test · 5) e2e specs that assumed
`/` = marketing. Memory: project_app_home_as_front_door, project_quiz_sites_field_study.
**Prod sweep 2026-09-03 (23 URLs, every page type, 1440 + WebKit 390):** all carry the shell +
search + footer, one left edge, no old nav / glow / flame / gradient band, no mobile overflow, no
console errors. Found: **public/404.html has no shell** (static, not generated) — give it the
header/footer; retire /home-preview + /home-old (the two rejected homepages, still served);
content-level leftovers: mono breadcrumbs + eyebrows + the Free/100%/Daily stat strip + green
"N entries →" links on the lists hub; /play still shows the warm-up for cold arrivals.

## 2026-09-03 — EYES-ON CRITIQUE DONE (history)

Report (screenshot-backed, grades per page): https://claude.ai/code/artifact/6ef2ec9e-6503-499d-bb85-4608b8d6abdb
Canvas (Direction A + two bolder takes, page "Bolder takes"): https://claude.ai/code/artifact/f72358fc-7ea7-459c-a75c-006af31283f8
Snapshot: .impeccable/critique/2026-09-03T12-29-08Z__balliq-app.md — 22/40, site grade C+.

**Alex, same day:** the website is THE PRODUCT (fully playable, A+), not an app funnel; nothing in the
current design is protected; the Scouting Report sheet "doesn't look right at all" (confirmed: it reads
DISABLED — grey-on-grey form). My recommendation moved from A to **B "The Back Page"** (light
newsprint page, quiz as a ruled column) after seeing both rendered. Awaiting Alex's pick.

**Shipped today:** 1e6d218 (.sr-what + verdict CTA were invisible: ink on desk / ink on ink),
a5c457e (mobile Games menu spilled over the h1). Both verified on prod.

**⚠️ BIGGEST FINDING (Assessment C, full guest play-through):** after ANY scored game the once-ever
'save' auth nudge covers the results at +2s; "Continue as guest" fired biq:go-home and DISCARDED the
results/review. First Classic is always a PB vs 0 → every new guest's first results screen is covered.
Sits on the day-1→2 finish leak below. Fix in progress: guest on 'save' now closes in place
(src/Login.jsx); STILL TO DECIDE: move the ask off the +2s timer to results-exit or an inline card.

**⚠️ SUPERSEDED same evening:** Alex rejected ALL THREE directions as "AI slop" and reframed: the site
is a finder — people want their club/league/mode fast; the 5-question taster is "meaningless";
Footle + Transfer Trail are the modes that matter. Mode data (30d, signed-in): Footle 86 · Daily 7
75 · Trail 44 · club quizzes 763 anonymous plays. **New thesis, awaiting Alex's yes:** make the APP
HOME (/play) the front door at `/`, retire the taster, first-class club finder + Today row (Footle,
Daily 7, Trail), pull SEO pages into the app shell. Next artefact = the real `/` on a preview URL,
not a mockup. See memory project_app_home_as_front_door.

**✅ APPROVED + BUILT (increment 1, branch `front-door`, 80820b4 + 7ad7d24, not merged):** `/` renders
the app home; root arrivals skip the warm-up; club finder at the top of Home (search → that club's
quiz, 8 most-played chips, All clubs / By league); Transfer Trail as a third Daily row; example-card
popup waits for the Profile tab; desktop rail no longer shows a fabricated 64 before the first
answer. Verified on dev (Chromium 1440, WebKit 390); vitest 495/495. Alex to review the Vercel
preview, then merge. Increment 2: SEO pages adopt the app shell, club-page Play → that club's quiz.
⚠️ e2e specs that assumed `/` = marketing may need updating (consent-banner, viewport-audit).
**⚠️ Alex on the preview: "looks like a copy of the app instead of an app… designed for an app."
DO NOT MERGE as-is.** Next: competitive study of ~12 successful quiz/sports-puzzle sites (Sporcle,
JetPunk, playfootball.games, NYT Games, Immaculate Grid, Poeltl, Weddle, Missing11, Crossover Grid,
The Athletic games, Footdle, Planet Football) → a website-shaped IA for `/`, keeping the finder idea.
**✅ STUDY DONE:** https://claude.ai/code/artifact/23bb9004-a669-49a6-99c0-8c43e9332507 — 10-block IA
(header w/ search, date line, Today strip w/ progress, one game in place, club/league finder, all-games
grid w/ Archive, timestamped lists, real numbers, how-to, sitemap footer). Awaiting Alex: light vs
dark; finder at block 3 or 5. Memory: project_quiz_sites_field_study.
**✅ DECIDED + BUILT (Alex: dark, search in the header, Today first, park "other people"):**
`src/marketing/FrontDoor.jsx` — a website at `/` (see memory project_app_home_as_front_door, third
pass). On branch `front-door`; preview URL below once Vercel builds. ⚠️ DESIGN.md is stale (Scouting
Report); re-document from the app system after merge. **✅ Increment 2 BUILT (same evening):** `scripts/seo/shell.mjs` — the front door's header (section
links + club/league finder + Sign in, no CTA) and sitemap footer as static HTML on all 254 generated
pages; SHELL_CSS replaces the old nav/footer CSS; hero h1 in Inter (Anton gone), no hero glow, the
orange "Prove it" band is a card, buttons are pills without glow. Front door tokens aligned to the
app's (bg #0A0A0A / card / bd / tx). ⚠️ keep front.css and shell.mjs in step. Still on the branch.

**Previous next (superseded):** 1) Alex picks A / A+ / B → build the chosen world as the SHARED question-sheet
component in gen-seo-pages + homepage + app shell. 2) P1s: "Next question" clipped 18px on club
pages at 390 (both engines); consent bar over play controls (inline it); 1911 void; 10px text
(222 nodes on /quiz/arsenal/). 3) /lists/: rewrite title+meta of the 7 page-1 pages to sell what
Google's answer box lacks (2-week test; GSC 28d: 30 clicks / 14.9k impr / pos 17.3 — position +8
since Aug, clicks flat). No new list pages until that moves; never another head term.
Still open from 09-02: relay guard in send-campaign-email + 20 burned email_events rows; commit
footlePractice.js drift (still dirty).

# Ball IQ — the board

## 🎯 2026-09-02 — THE REAL LEAK IS DAY 1→2, AND IT HANGS ON FINISHING (baseline frozen)

⚠️ **First: "DAU flat at 13-17" was measured from `scores`, and `scores` does
not record Footle.** True DAU, counting Footle plays with `guesses > 0`, is
**~20 and drifting down** (28 on 08-20 → 12 on 09-02). Not flat. Worse.

### Why DAU does not move — the frequency distribution, 107 players / 30 days
| days played in 30 | players |
|---|---|
| **1 day** | **45 (42%)** |
| 2-3 | 24 |
| 4-7 | 14 |
| 8-14 | 11 |
| 15+ | **13 ← the entire habit core** |

**71 of the 107 are NEW this month.** So each month ~70 new people play, ~42%
play once and leave, a handful join the core, and DAU stands still. The bucket
is being refilled at exactly the rate it leaks. A one-day player contributes
one day.

⚠️ This CORRECTS the August reading of "retention is fine, activation is the
problem", which came from `scores` averages. Activation puts water in; **day 1→2
is the hole**.

### The finish/return baseline — measured 2026-09-02, window 2026-08-27..09-02
Both `first-game-started` and `first-game-finished` are once-per-device
localStorage-gated, so they are directly comparable — but ⚠️ `first-game-finished`
only exists from **2026-08-26**, so any window before that reports a fake
collapse (a naive 30-day read showed 1,021 started vs 45 finished; it is an
artefact, not a finding).

Counting only visitors who started **and had at least 2 days to come back**:

| | n |
|---|---|
| started a first game | **62** |
| finished it | 29 (47%) |
| came back on a later day | **4 (6.5%)** |
| of those returners, had finished | **4 — all of them** |

⚠️ **Zero of the 33 non-finishers ever returned.** n=4 is far too small to call
a law, but it points the fix one step earlier than expected: not the finish
SCREEN, but reaching one — **~half never do**.

⚠️ Caveats, stated before anyone quotes these: n is tiny; the window is 7 days;
`visitor_id` is per-device localStorage, so cleared storage or a second device
reads as a new visitor and true return is somewhat higher than 6.5%.

### NEW INSTRUMENT shipped today: `game-abandon`
Fires when a game screen is left without finishing, carrying `{mode, secs}`.
Finished-vs-gave-up is read from signals that already existed — a completed quiz
ends on screen "results"; the dailies dispatch `biq:daily-completed` /
`biq:stadiums-completed`, latched so a completed Footle is never miscounted as
an abandonment. Duration rather than question index on purpose: `idx` lives
inside the quiz components and threading it up would touch every engine to
answer what "how long did they last" already answers. Bounces under 3s are
ignored so mis-taps do not swamp the signal.

**Read at 7 days.** The question it answers: WHICH mode loses people, and HOW
FAR IN. Nothing recorded a departure before, so there is no baseline — week one
establishes one.
⚠️ **Honest null:** if abandons spread evenly across modes and durations, there
is no single bad screen and the problem is the offer itself, not a fixable
moment. That would point at content, not UX.


## 🔔 2026-09-02 — WHY WEB PUSH HAS ONE SUBSCRIBER (diagnosed, not guessed)

Web push is **fully built and live**: `src/lib/webpush.js`, a Settings toggle, a
soft-prompt sheet at the post-solve moment, sw.js handlers, a send-web-push edge
function and an hourly `web-daily-reminder` pg_cron. Yet
`web_push_subscriptions` holds **1 row** against 247 accounts and 94 monthly
players. It is not a build problem. The funnel says where it stops.

### The measured funnel (funnel_events, 90 days)

| step | n |
|---|---|
| notif-prompt-skipped | **275** |
| notif-prompt-shown | 32 |
| notif-prompt-no | **24** |
| notif-prompt-yes | **3** |
| notif-permission-granted | 2 |
| live subscriptions | **1** |

### Two separate problems, and only one is about reach

**1. The ask is skipped ~9x more often than it is shown.**
Skip reasons split cleanly once native is separated — verified, all 216
unattributed rows carry `{anon:true, native:true}`, i.e. stripped by the privacy
contract, not missing:
  · 216 native (meta stripped by design — cannot be attributed further)
  · **40 web: `guest`** ← 68% of all attributable web skips
  · 11 web: unsupported · 7 web: asks-exhausted · 1 web: too-early

⚠️ **`guest` is the binding constraint on web, and it is architectural.** The
prompt refuses guests because `persist()` upserts by user id, so a guest's
subscription cannot stick. But most web players ARE guests. Web push currently
requires an account, and the people it most needs to reach do not have one.

**2. Of those actually asked, 75% say no.** 24 no against 3 yes, plus 14
permission-denied against 2 granted. So even solving reach does not solve this —
the ask itself is not persuading people. More asking would burn the 2-lifetime
cap faster, not produce subscribers.

### What this implies (not yet decided)
- ⚠️ **Do not "prompt harder".** The cap and 24h gap exist because the sheet
  once fired twice in three minutes, the second time over a LOSS screen.
- The honest options are (a) make guest subscriptions persist by visitor id
  rather than user id, (b) make the ask worth a yes, or (c) accept web push is
  structurally small here and lean on EMAIL — which became viable today when
  the Apple Private Relay registration unblocked **33 of the 94 active players**.
- Native is the working channel: 48 device tokens vs 1 web subscription.

**Reachability of the 94 players who played in the last 30 days:** 27 by push,
53 by deliverable email, 33 on Apple relay (unreachable until today), and **67
with no push at all**.


## 📏 MEASUREMENT PLAN — read 2026-09-09 and 2026-09-16 (baseline frozen 2026-09-02)

⚠️ **The null result is written here BEFORE the read.** Thirteen items closed in
48 hours once moved zero numbers; the rule from the strategy report is that a
change with no metric is not shipped, it is just deployed.

### Baseline, funnel_events, captured 2026-09-02 (7d column = the week BEFORE today's fixes)

| event | 14d | 7d | distinct visitors 14d |
|---|---|---|---|
| first-game-started | 1,126 | 188 | 1,021 |
| clubq-start | 1,048 | 373 | 581 |
| clubq-play | 652 | 411 | 370 |
| clubq-finish | 465 | 318 | 235 |
| taster-start | 92 | 68 | 77 |
| taster-out-play | 26 | 24 | 17 |
| list-out-play | 21 | 16 | 18 |
| list-answered | 17 | 11 | 16 |

### What each change should move, and what it means if it doesn't

| Shipped 2026-09-02 | Watch | Honest null |
|---|---|---|
| Consent deferral on ~143 SEO pages (options were covered) | **clubq-start**, list-answered | If arrivals skew non-EU most never saw the bar. Taps up + signups flat is EXPECTED — taps are not the bottleneck. |
| `/football-quiz/` taster (page had 0 playable elements) | **taster-start** on that URL | Page is position ~41; if nobody lands there the fix is correct and invisible. |
| Club CTA scoped to `?club=` (was serving Messi) | **clubq-play** → then whether those sessions record a game | Destination quality, not click count. clubq-play may not move at all; what changes is what happens AFTER. |
| Verdict CTA → Footle (was App Store) | **sr-verdict-footle** vs sr-verdict-store, and D3 return of the Footle cohort | ⚠️ WATCH D3 RETURN, NOT INSTALLS. Installs will probably fall — that is the trade Alex chose 2026-09-02. Unknown what share of visitors finish all five questions; if tiny, this touches few people. |
| Homepage: consent + category sentence | **sr-taster-1** (NEW — homepage had zero instrumentation) | No prior number exists, so week one only establishes the baseline. |
| `/lists` jump anchor + tables that fit | **list-jump** (NEW), list-answered | /lists is 47% impressions / 4% clicks and that ratio is mostly RANK, not layout. Fixing the page does not fix the ratio; it fixes what a click is worth. |
| Next-question scroll, Safari nav | — | Not directly measurable. Correctness fixes; judge by absence of complaints. |

### New events added 2026-09-02
`sr-taster-1` (first homepage answer — counts PEOPLE not answers), `sr-taster-done`,
`sr-verdict-footle`, `sr-verdict-store`, `sr-verdict-play`, `list-jump`.

⚠️ All robot-guarded (`navigator.webdriver` + localhost). On 2026-08-21 the e2e
suite put 867 fake rows into funnel_events against a real DAU of 13-17.


## 🔴 2026-09-02 — APPLE PRIVATE RELAY BOUNCES EVERY EMAIL WE SEND (Alex must fix in the Apple Developer Portal)

**Found by opening Resend, not by a query.** Every message to
`@privaterelay.appleid.com` bounces with:
> *"Unauthorized Sender to Apple Private Relay: The email couldn't be delivered
> because of a misconfiguration within your Apple Developer Portal."*

**Blast radius: 80 of 246 email accounts (33%) are relay addresses.** Today's
first real campaign send (10:00 winback + 10:30 activate, 40 each) burned
**20 of them** — 9 activate + 11 winback. The send loop is RECORD-FIRST, so
each of those 20 has an at-most-once `email_events` row saying "contacted"
while having received nothing, and would never be retried. Plus 4 of 7 `day2`
emails had already bounced this way.

### ✅ FIXED 2026-09-02 ~16:20 — registered in the Apple Developer Portal
Alex opened the portal and handed over the driving. Registered under
Certificates, Identifiers & Profiles → Services → **Sign in with Apple for
Email Communication** (NOT on the App ID's Capabilities tab, which is where it
looks like it should live). Email Sources was **completely empty** before —
"No result found" — which is exactly why every relay message bounced.

Now registered, and Apple validated SPF on all three immediately:
| Source | Type | Status |
|---|---|---|
| `balliq.app` | Domain | ✅ SPF |
| `send.balliq.app` | Domain | ✅ SPF |
| `nudge@balliq.app` | Email address | ✅ SPF |

`send` confirmed as the real return-path by reading Resend → Domains → balliq.app
(MX + SPF both on `send`, Verified) rather than trusting the documented default.

### ⏭️ NEXT: prove it, then remove the stopgap
1. Test a send to ONE relay address before trusting it (Alex can make a Hide My
   Email address, or use the function's `{"test_to":"..."}` path which touches
   no ledger).
2. Once a relay message DELIVERS, delete the guard in
   `supabase/functions/send-campaign-email/index.ts` (marked "DELETE THIS GUARD")
   and redeploy.
3. Then clear the 20 burned rows (SQL below) so they get their email.

### (superseded) WHAT ALEX MUST DO — I cannot; it is Apple Developer Portal account config
Per Resend's own docs (via context7, `/websites/resend`
→ *knowledge-base/sending-apple-private-relay*), register ALL THREE under
**Certificates, Identifiers & Profiles → Sign in with Apple → Email Communication**:
1. the sending domain **`balliq.app`**
2. the **return-path subdomain** Resend uses — check Resend → Domains for the
   exact value (Resend's default `custom_return_path` is `send`, so most likely
   **`send.balliq.app`**). Apple requires the return-path domain listed too.
3. the From address **`nudge@balliq.app`**

SPF/DKIM are already correct (`v=spf1 include:_spf.mx.cloudflare.net ~all`,
`resend._domainkey` present) — Resend mandates them, so once Apple has the
sources registered, authentication passes automatically.

### ✅ SHIPPED — stopgap guard (send-campaign-email v4, ACTIVE)
Skips `@privaterelay.appleid.com` BEFORE the ledger insert, so those users keep
their one shot instead of spending it on a guaranteed bounce. Returns
`skippedRelay` in the response. **⚠️ DELETE THE GUARD once the portal is fixed.**

### ⏳ OPEN — the 20 already-burned rows
Once the portal is fixed, clear today's relay rows so those people get their
email. NOT done yet — it is a prod delete and needs Alex's go-ahead:
```sql
delete from public.email_events e using auth.users u
 where u.id = e.user_id and e.created_at >= '2026-09-02'
   and u.email ilike '%privaterelay.appleid.com';
```


## 🎨 QUEUED — FULL WEBSITE CRITIQUE: design + strategy, with gradings (Alex, 2026-09-01)

### 🛟 RECOVERY — if the session dies before the critique returns (Alex, 2026-09-02: "make sure nothing gets lost")
- ⚠️ 2026-09-02: the 8-lens fleet HIT THE SESSION LIMIT after 3 lenses (1.36M
  subagent tokens for 3 results). 26 findings salvaged to
  `.audit/critique-2026-09-02/PARTIAL-FINDINGS.md` — **UNVERIFIED**, every
  skeptic died, so the run's `refuted: 0` means nobody checked. A LEAN follow-up
  (3 missing lenses + 2 reports, 5 agents) runs as **wf_085d47d7-0db**,
  journal `…/subagents/workflows/wf_085d47d7-0db/journal.jsonl`, script
  `…/workflows/scripts/balliq-critique-lean.js`. Reports land in
  `.audit/critique-2026-09-02/{design,strategy}.md`.
- Original run id: **wf_4d9cb37e-1be** · task wgxpquug2 · launched 2026-09-02 ~09:10 UTC (resume of a run killed with the process overnight; 0 agents had completed).
- Live journal (one `{"type":"result",...}` line per finished agent, written by the harness as it goes — survives my session dying):
  `~/.claude/projects/-Users-alexanderbrynolsen-ball-iq-src/c6c4d416-cca9-4515-bc5c-315a9e6d20f0/subagents/workflows/wf_4d9cb37e-1be/journal.jsonl`
- Script: `~/.claude/projects/-Users-alexanderbrynolsen-ball-iq-src/c6c4d416-cca9-4515-bc5c-315a9e6d20f0/workflows/scripts/balliq-website-critique-wf_48e20ed5-e50.js`
- Final reports auto-copy to **`.audit/critique-2026-09-02/`** (design.md, strategy.md, raw.json) by a watcher; if that dir is empty, harvest the journal: `node scripts/forge-harvest.mjs <journal path>` — or read the `result` lines directly; labels are `look:*`, `refute:*`, `gaps:completeness`, `report:design`, `report:strategy`.
- Resume (same-session only per memory) — a fresh session must relaunch: `Workflow({scriptPath, resumeFromRunId:"wf_4d9cb37e-1be"})` replays cached agents.


Alex opened balliq.app from **TikTok's in-app browser** and hit the Scouting
Report assessment block. His words: *"i do not really love this at all"*. He
wants a **design AND strategy critique, phone-sim and web, full report with
gradings**, once the running first-session/Footle audit lands.

**Evidence already captured from his screenshot — start here, don't re-derive:**

- ⚠️ **The page opens by telling the visitor they are nothing.** "Subject: you ·
  nothing filed yet", then FIVE consecutive rows of *not assessed*. This is the
  same failure mode Alex rejected in the email creative the same morning —
  leading with the reader's failure. He called those drafts "passive
  aggressive". The scouting-report conceit is structurally doing it too.
- **The TikTok in-app browser eats ~200px of chrome** (nav bar + title + URL).
  Nothing on the page accounts for it. TikTok is a live acquisition channel and
  this constrained viewport has never been designed for or tested.
- **The marketing taster does not shuffle its options.** `MarketingHome.jsx` has
  no shuffle — verified. So `q_cad396` renders **£80m, £90m, £115m, £100m**
  every time, answer permanently in slot D, and the numbers are non-ascending.
  Not a wrong answer (key checked: `a:3` → £100m ✅) but it reads careless to
  the exact audience we're courting.
- **Light-on-dark slab.** The report card is a large pale-grey panel inside an
  otherwise dark page; in the in-app browser it reads washed out.
- **He landed mid-page**, not at the top — the page itself has no auto-scroll
  (`scrollIntoView`/`scrollTo` absent from MarketingHome), so this came from
  in-app-browser scroll restoration. **Reproduce it before theorising.**

**Scope when it runs — CORRECTED 2026-09-01 late:** Alex: *"do not base
everything off the tiktok screenshot either, it was just an example. i think the
website itself from safari too needs massive work."* So **ordinary iPhone Safari
and desktop are the main event**; the TikTok/Instagram in-app browser is ONE
secondary arrival context. The fleet was relaunched with WebKit (Safari's real
engine, installed 2026-09-02) as the primary lens for exactly this reason. Design critique AND
strategy (what is this page FOR, does it convert, does it match the "Both hero"
ruling). Graded report, per-area plus overall.

⚠️ **"Scouting Report" names TWO different things — do not conflate them.**
Asked how attached he was, Alex said it *"gave us structure previously on where
to go and what to do"*. That is the **internal audit method** (reports #1-#4,
116 findings, the graded work lists) — a working process that is genuinely
valuable and which this critique must not touch. The **homepage design
conceit** is a separate artefact aimed at strangers, and it can be replaced
outright without losing any of the method. The dice assigned a visual
direction, not a permanent commitment. Say plainly in the report whether it
earns its place; replacing it is on the table.

Alex's frame for all of it, in his words: *"keep things moving onwards and
upwards and make our product, app and website better every single day, brick by
brick."*

Related: [[project_homepage_scouting_report]] (dice-assigned direction, 14
commands applied, 5 owed), [[feedback_homepage_both_hero]],
[[project_playable_page_finding]] (playable beats readable — the taster is the
most valuable thing on the page and it's buried below a "not assessed" table).

## 📅 2026-08-29 — critique day (all shipped, prod-verified)

Three critique agents + a design critique ran; every surviving finding was
fixed same-day. Web is live; native waits on Alex uploading **1.7.1 (105) /
vc44** (in Xcode Organizer + android bundle path — 103/104 are superseded).

- [x] Retention wave: results-screen countdown + streak stake + Remind-me;
      notif sheet v2 (asks re-keyed, `copy:v2-stake` tagged); challenge loop
      closed (v1_9 + v1_9b; `?f=` links; e2e-verified push copy)
- [x] Website wave: mobile header fix, taster touch CSS, lists taster
      topicality (34/50 keep tasters), honest copy, invite-code expiry
- [x] Design-critique wave: hero "No account, no waiting", truthful FAQ ×57,
      verdict-card OS badges + browser button, header CTA graduation, footer
      reason, Footle primary, green-IQ lockup on SEO pages
- [x] MP: ready-up NEVER worked (3 RPCs missing retry config) — fixed + gate;
      game-over redesign (actions first, review collapsed, joiner refetch);
      lobby facelift (open-seat invite, HOST chip)
- [x] Monetization phase 1: local usage counters accruing (4 signals)
- [x] Bank: Club Brugge self-answering q deleted; era sweep done yesterday
- [x] MP 2-device test PASSED on device: native mp:race row (first ever),
      ready-up persisted, 10/10 clean advances
- [x] Long-answer tell: 42.4% measured, 21 drastic giveaways rebalanced,
      build gate added (Alex caught it live mid-game)
- [ ] Alex: upload 1.7.1 — iOS build 106 / Android vc45 (NOT 103/104/105)
- [ ] Alex: Bulgarian editorial call (q_b312e9)
- [ ] Next builds: guest reachability design, FAQ store-first copy pass
      (drafts/nations prose), entitlements migration (needs "apply it"),
      /nl/ GSC read ~Sept 11, sheet-v2 conversion read ~Sept 5

## 📅 2026-09-01 — partnership targets: 13 qualified, and the pitch's proof point is DEAD
- [x] **The audit's last unstarted item is delivered**: `docs/PARTNERSHIP-TARGETS.md`
      — 66 agents, 81 candidates found, 61 adversarially qualified, 29 killed,
      then a LINK-OUT test on the survivors. 13 targets, every one with a
      verified public role-based contact route. No name was invented.
- [x] 🛑 **`docs/PARTNERSHIP-PITCH.md` now carries a STOP banner.** The kit told
      Alex to cite FotMob × fcQuiz as a live weekly mechanic. It is dead: 33
      FotMob sitemaps hold 32 quiz URLs, newest **2024-04-27**, sitemaps current
      to 2026-08-30 — five quizzes in three weeks of April 2024, then nothing
      for 28 months. A recipient finds the dead hub in 90 seconds, and it now
      reads as a counter-example. Rewritten as "the slot is open".
- [x] **The finding that reshaped the list:** big score-aggregators emit NO
      external editorial links. Flashscore (6 articles/3 domains: zero),
      BeSoccer (won't link Romano while quoting him), Bola.net (links Romano to
      its own tag page), Sofascore (2 articles: zero). Every one passed "alive /
      no quiz / contactable / audience fit" and failed the only test that pays.
- [ ] ⚠️ **Check your inbox for a submission confirmation FIRST** — Alex thinks
      the directories are done; BACKLINK-SUBMISSIONS.md still lists likewordle
      as an open gap and never mentions PWA Directory. Live probe found no
      Footle/Ball IQ on likewordle, pwa.directory or listdle (curl + sitemap +
      browser), but those sites are partly JS-rendered so absence is not proof.
      Do NOT re-submit blind — the doc warns it looks like spam.
- [x] **PWA Directory: SUBMITTED 2026-09-01** (free Standard tier; "Submission
      received"; review up to 4 weeks to hello@balliq.app). ⚠️ Their $49 Pro
      tier is pre-selected on the form — always deselect.
- [ ] **Alex: LikeWordle needs 30 seconds** — the form is filled and verified in
      the browser but has a reCAPTCHA, which I will not solve. Tick it, press
      Submit. Footle / Puzzle / Web / balliq.app/football-wordle.
- [ ] ~~DO FIRST — two ~10-minute wins~~ (superseded by the two lines above):
      PWA Directory (`/submit`, free Standard queue — do NOT buy the $49 Pro
      tier) and LikeWordle (`/submit-app`). Footle is exactly LikeWordle's
      category.
- [ ] **Alex: send the licensing feeler** (email 6 in OUTREACH-EMAILS.md) to
      pub-quiz/quiz-night operators, and to any of the five publishers who
      replies warmly. ⚠️ Never as first contact, and never name a price first.
      This is the only revenue route that does NOT multiply by our 272 accounts.
- [ ] ⚠️ **DIRECTORIES ARE NOT DONE — verified 2026-09-01 by sitemap, which is
      definitive.** pwa.directory, likewordle.com (100 app URLs) and
      listdle.com (556 URLs) contain no Footle/Ball IQ entry. Worse:
      `listdle.com/games/football-wordle/` is a COMPETITOR's football wordle
      holding the obvious slug on the most on-target directory we have.
- [ ] **Alex: send the five emails** — written and ready to paste in
      `docs/OUTREACH-EMAILS.md` (ranks 1-5). ⚠️ Send from YOUR OWN inbox, not
      balliq.app: cold outreach draws spam complaints and that domain sends the
      win-back/activate/day-2 product mail. A solo dev writing personally also
      gets replies where a brand address does not. ⚠️ Every email must specify **a
      dofollow text credit in the body, not an iframe embed** — three of the
      five have prior quiz precedent that was an embed passing zero equity.
- [ ] **Alex's judgment call:** The Blizzard (rank 12) has two contradictory
      verdicts on file. Both are factually right — they DO pay a dofollow credit
      to an external quiz partner, and that partner is **fcQuiz, our direct
      competitor**. Ship or skip is a positioning call, not a fact question.
- [ ] ⚠️ **No authority metric exists for any of the 13.** Ahrefs/Similarweb/Moz
      were unauthenticated every pass — no DR, no traffic, no referring domains.
      The ranking is by observed linking behaviour, NOT measured link value.
      Per [[feedback_shipping_isnt_delivering]]: instrument before scaling.

## 📅 2026-09-01 — the Johannes wave: 1.7.2 (111) SUBMITTED same day
- [x] **"Logged out every update" was a client-side illusion** — server showed
      his June session alive, refreshed the morning he reported it. Fixed both
      causes (Preferences bridge retry+legacy fallback; watchdog optimistic
      restore), unit-gated (falsified vs old adapter), device-tested via a
      credential-free anon room-join on the simulator (kill+relaunch → signed in).
- [x] **Card parity** — 66 vs 70 / 10,961 vs 4,591 XP was a forked ledger from
      false-guest play. Delta reconcile in hydrate; snapshots self-heal.
- [x] **"175 games played" stuck toast** — one-shot per milestone, live-verified
      both directions.
- [x] **Ratings** — decay (~34-answer half-life), difficulty-as-evidence
      (hard-wrong 0.85 verified live), prior clamp (2 answers ≠ 99 GOLD).
- [x] **1.7.2 submitted**: build 111 attached, 15×What's New + 15×promo text in
      ASC, Alex pressed Submit ~13:15. Android vc47 bumped, NOT yet built.
- [x] **Android 1.7.2 (vc47) SUBMITTED to Play review** 2026-09-01 ~17:25 —
      full production rollout, 11/11 locale notes, 0 warnings, 13,816 phones
      supported / 0 lost. iOS 1.7.2 (111) APPROVED the same afternoon.
      ⚠️ Play's "target API 36 / sanksjonert" card is STALE — targetSdk 36
      landed 2026-07-22, and Play accepted vc47 reporting mål-SDK 36. Do not
      click "Be om mer tid".
- [x] **Android developer verification: ALREADY DONE** (checked 2026-09-01).
      Play: "Alle appene dine er registrert og oppfyller kravene". Package
      names registered (app.balliq since 9 July), identity populated. The
      30 Sept date is the global deadline, not an outstanding task.
- [ ] ⚠️ MinimumOSVersion must reach 15.0 by Spring 2027 (Apple upload warning).
- [ ] Verify Johannes's card converges after he updates (server XP → 10,961).
- [x] **Email answer links now answer something** (`/play?eq=&ea=`). The emails'
      tappable options previously went nowhere — the app ignored the param, so
      the email promised a verdict and delivered silence. Now: resolves the
      question, shows the verdict, then opens the Daily 7 on a timer.
      ⚠️ Ordering is load-bearing — the quiz screen has NO `.toast` node, so
      firing both in one tick shows nothing. Gated + falsified.
      ✅ Visually confirmed both paths (✓ correct / ✗ wrong). The commit's
      "not visually confirmed" caveat is WITHDRAWN — two verification
      artefacts had hidden it: a content-hashed chunk served from cache after
      patching dist, and the Clarity consent banner covering `bottom:28px`.

## 📅 2026-09-01 — headline truth pass

- [x] **/lists headlines were a season behind the data.** 17 of 50 pages
      advertised "(1992-93 to 2024-25)" above a table whose last row is
      2025-26. The DATA was current the whole time; only the prose was stale.
      41 fields fixed across h1/title/description — no football fact added or
      changed. New gate `tests/unit/lists-headline-truth.test.js` fails the
      build if a headline ever claims an older terminus than the rows hold;
      falsified by reinstating one old headline.
      ⚠️ **Do not oversell this as the /lists CTR fix.** C2 (2026-08-15) already
      measured that head-term list pages lose the click to Google's own answer
      box regardless of rank — `premier-league-champions` sits at 1,671
      impressions and 0 clicks at position 50.8. This is a correctness fix that
      removes an "out of date" signal; it should matter most on the 6 NICHE
      pages that actually reach page 1. Treat any CTR movement as a hypothesis
      to measure, not a predicted win.
      ⚠️ `lists-staleness.mjs` never missed this — it checks cadence lag and
      cross-list disagreement in the ROWS, and was correctly reporting the data
      as current. Nothing read the prose. Two invariants, one gate.


## ⭐ SCOUTING REPORT #4 — THE PLAN (opened 2026-08-24)

Overall **5.8/10**, up 0.3. 116 findings, 11 critical.
Report: `docs/scouting-report-4.html` · data: `docs/scout-4-{areas,critic,synthesis}.json`
Alex, 2026-08-24: *"Can we start going through every single item on the plan?"*

**The five-star blocker:** a sign-up dead end in the STORE build. Apple/Google
sign-in pre-fills the real name (space and all) into a non-dismissible username
step that rejects spaces. 84% of accounts are social sign-ins; 47% of accounts
have never finished a game. Fixed in repo, reaches nobody until 1.7.0 uploads.

### 1 · Make build 76 safe to ship, then upload iOS — CODE EDITS ALL DONE
**All four edits landed in build 77 / vc32.** Only Alex's device evening and the
upload itself remain.
- [x] **Keyboard covers the suggestion list on native** (`f87a57c`).
      `keyboardDismissMode` only watches the WKWebView's own scrollView; Trail's
      list is `overflow-y:auto` and WebKit scrolls it internally, so no pan ever
      reaches the watched view. JS now handles inner scrollers, native keeps the
      page, gate is exclusive so they cannot both fire. Verified against the
      real DOM: list fits → false, list bounded 315/182 → true, page → false.
- [x] **Report button lied** (`3e484bd`). Flipped to "✓ Reported — thanks" on
      the tap, while the reason sheet was still open and unanswered. Four call
      sites had four copies; fixed by deleting the duplication into
      `components/ReportButton.jsx` — idle → sending → done, success only from
      the settled RPC. Verified end-to-end in a browser.
- [x] **Rate prompt could land mid-game** (`1f4e1e5`). All four scheduled asks
      now read the screen at FIRE time. ⚠️ NOT via the panel's fix — see the
      do-not-do list below.
- [x] **`.opt` press state** (`92d420e`). Scale, not translate, so it cannot
      fight the hover rule on hybrid devices.
- [x] **The wrong-answer tray was switched off** (`92d420e`). Two `!important`s
      beat the higher-specificity `.feedback.wrong`. Fixed WITH shape (radius +
      padding), not by deleting the two words, and the duplicate `.feedback`
      rule 950 lines below was removed.
- [ ] **Alex's device evening** (8 tests, in the report). #1 is the on-screen
      keyboard in Trail — unrun for three consecutive reports, and build 77
      changes it again.
- [x] **Upload iOS — DONE 2026-08-26.** 1.7.0 (101) submitted, Waiting for
      Review. Add for Review first failed on **14 locales** missing What's New;
      ASC requires it in every localization and says so only when you press the
      button. All 15 now carry translated notes.
- [ ] ⚠️ **The two stores now carry DIFFERENT card curation.** Alex, on the App
      Store: *"removed one of the scorecard screenshots, it is enough with one"* —
      so Apple shows **06-profile** (the card in context) and not 10-iq-card,
      9 panels total. Play still shows BOTH, because it was curated an hour
      earlier and is now mid-review. Not worth revoking the Play release over;
      Play listing edits ship independently, so swap it after approval — and
      note that dropping iq-card frees a slot for daily-chips or
      quiz-explanation, which were cut for Play's 8-slot cap.
      ⚠️ `frame-store-screens.mjs` still emits all 10; the curation lives only
      in the consoles, so a future re-upload will bring 10-iq-card back.
- [x] **Store galleries re-done 2026-08-26.** App Store: 10 screenshots
      (home · footle · profile lead the install sheet), description gained a
      YOUR BALL IQ section. Play: description gained 📊 YOUR BALL IQ CARD, and
      all three screenshot slots (phone / 7in / 10in) replaced — the old set was
      from 18 Aug and predated the card entirely.
- [x] **Play submitted 2026-08-26.** 5 changes under review: production
      release **41 (1.7.0), full rollout**, plus the description and all three
      screenshot slots. Notes in all 11 Play locales (500-char cap each, a third
      of Apple's). ⚠️ **Managed publishing is OFF**, so this goes live to 177
      countries the moment Google approves — no second gate. Revocable from the
      publishing overview until then.
      ⚠️ Play was in PRODUCTION at 1.6.2/vc20, not the closed test the memory
      file claimed for over a month.
- [ ] Attach **build 102** (Stadiums "Hint" label) on the next iOS submission,
      or on a resubmit if 101 is rejected. Archived and preflighted already.

### 2 · One sitting on the question bank — SELF-ANSWERS DONE (`9ac6dc6`)
- [x] **Stems that state their own answer.** Reported 26; **actual 3.** My own
      first detector said 18 and hand-checking killed 15 — all the same failure,
      the stop-list reducing a club name to one token that matched a *different*
      club ("Man City"→"man" vs "Man United"). q_74322a DELETED (unfixable, the
      RB Leipzig ruling), q_e9269e + q_fd0299 rewritten to drop the give-away
      clause, answers and hints intact.
- [x] **Answer is the pack you picked.** Reported 15; **actual 33.** Fixed by
      RE-HOMING (drop `club`), not deleting — the questions are fine anywhere
      else. Bank 6782 → 6781: one deletion, 33 re-homes.
      ⚠️ Checked THREE consumers: pack headroom (18 ≥ 16 ✓), SEO MIN_HINTS
      (28 ≥ 15 ✓), and — caught by the build, not by me — **localised club
      pages**, 10 translated copies across 7 locales carrying the same defect.
- [x] **Gated:** `tests/unit/bank-self-answers.test.js`, zero-tolerance, small
      reasoned allowlist. Falsified by seeding both classes back.
- [x] ⚠️ **SUMMER 2026 RETIRED ENTIRELY** (`45be7bd`) — Alex, after playing it:
      *"such a bad mode… like 40% of the questions there have really
      disappointed me."* A pack about the last few weeks tests whether you read
      the news, not football. Tile nulled AND the 89 questions withheld from all
      FIVE draw paths (they carry real cats, so the tile alone fixed nothing).
      Withheld not deleted — none are in the frozen Daily 7 log, so it is
      reversible by one string. **This supersedes the leak work below**, which
      is now moot for this pack but still correct for any future one.
- [x] **Topical pack shipped outside every leak guard** (`2ab0f68`). The
      generator grouped by `cat` and `club`; topical draws by `tag`, so its pool
      was never grouped and never guarded — and the audit enumerated the same
      two keys, making its "0 unguarded" a self-confirming zero. Fixed in BOTH
      halves (generator + the draw actually consulting the map), audit taught
      the third key, and gated `--strict` in the build.
      ⚠️ **Corrected the report's number:** 38.4% assumes a plain random draw.
      The app's diversity filter (2/cat, 1/club) already suppresses many pairs —
      the real rate was **14.8%**, now 0.0%, with no shortened sessions.
      Falsified: strip the tag pass and the audit reports 79 unguarded (32 in
      summer2026).
- [x] **Giveaway distractors — reported 26, detector found 20, TWELVE were real**
      (`scripts/audit-giveaway-distractors.mjs`, in the build gate).
      The class: a distinctive word sits in the stem AND the correct option and
      in none of the wrong ones, so a player who has never watched a match can
      score by matching. "Which club is Feyenoord's local rival in the ROTTERDAM
      derby?" with "Sparta ROTTERDAM" on the list.
      Twelve fixed by deleting the TELL, never the question — the "King Arturo"
      nickname left the Vidal stem, the "Batman and Robben" pun left the Robben
      question, the Superga crash stopped naming Superga. Answers unchanged in
      all twelve. Eight are INHERENT and reasoned onto an allowlist: a Cruyff
      quote that repeats "simple" because he did, the Mazzola father-and-son
      question, a Steel City derby where both clubs are called Sheffield.
      ⚠️ Third bank claim in a row where the report's count was a hypothesis
      (26 stem leaks → 3 · 15 club self-answers → 33 · 26 giveaways → 12).
- [x] **The difficulty disagreement was a SYMPTOM — they were duplicates**
      (`scripts/audit-duplicate-questions.mjs`, in the build gate).
      Reported as "29 near-duplicate pairs disagree about difficulty". Measured:
      33 disagreeing, and the reason they disagree is that they are the same
      question entered twice by different hands. Two were verbatim; the 2000
      UEFA Cup final existed THREE times. Fixing the GRADES would have hidden
      the duplicates and left a player able to meet both halves in one session.
      11 redundant copies deleted, bank 6749 → 6738.
      ⚠️ Survivor selection has two hard rules, both nearly missed:
      **(1)** keep whichever copy the frozen Daily 7 log references — 7 of the
      13 ids were in it; **(2)** keep whichever copy carries a TRANSLATION —
      the SEO build hard-failed on `/tr/quiz/galatasaray` because I deleted the
      English source of a Turkish question. The build caught it, I had not.
- [🅰️] **Residual: 21 pairs at 0.6–0.8 similarity still disagree on difficulty.**
      These are genuinely DIFFERENT questions about the same fact, so aligning
      them is an editorial call, not a mechanical one — and the two directions
      are both wrong in real cases (Götze in the 2014 final graded medium is too
      hard; Béla Guttmann graded easy is too easy). Needs Alex, or a separate
      pass with a real rule. NOT mass-edited.
- [x] **"Hard means 19%–79%" — MEASURED, and it is mostly NOISE.**
      ⚠️ I first wrote here that this "needs an instrument before it needs a
      fix" because we do not record per-question correctness. That was WRONG and
      I checked it before believing myself: `club_quiz_results` has carried
      `easy_c/easy_t · med_c/med_t · hard_c/hard_t` all along. It is almost
      certainly where the report's 19–79% came from.
      The global curve is HEALTHY and monotonic: **easy 83.2%** (647 attempts) ·
      **medium 64.2%** (1,957) · **hard 48.1%** (790). The three tiers are
      correctly ordered and well separated.
      The per-pack spread is small samples. Average **15.8 hard attempts per
      club**; 39 of 50 clubs are under 30; the raw range is 0–100%, i.e. WIDER
      than the 19–79% the report quoted. Of the 11 clubs with n≥30, **9 sit
      inside the 95% binomial band** around the global rate. Re-grading on this
      would have been fitting noise.
- [🅰️] **TWO REAL OUTLIERS, and they need Alex.**
      **Feyenoord 18.9% on 74 attempts** — below the 25% you get by guessing at
      random on four options, which is not "hard", it is unknowable. All 14 hard
      Feyenoord questions are deep Dutch history (1908 founding name, the 1937
      opening fixture at De Kuip, the 1970 midfield trio, van Hanegem's
      nickname); 12 of 14 are pre-1990, against the standing 1990–2020 targeting
      rule. They are correctly LABELLED — the problem is the audience.
      **Everton 68.8% on 32** — hard questions that are not hard.
      Not touched: re-grading or replacing these is an editorial call.

### 3 · The wrong-answer moment + press state — ✅ DONE (`92d420e`)
Folded into item 1. Verified live in a browser by computed style, not source:
correct tray `rgba(88,204,2,.12)` / border `.55`, wrong tray
`rgba(248,113,113,.11)` / border `.38`, both 12px radius, 11/13 padding,
13.5px — previously all transparent / 0px / 0 / 2px.

### 4 · Stop the app contradicting itself on the front door — MOSTLY DONE
- [x] Footle "surname" copy — the 6th call site and then the other 8 (28c95e4).
- [x] **The mobile Footle hero rendered a fake solved board** (`d5a1f1d`) — an
      all-green winning row beside "Continue · 1/6 used". In-progress players now
      see their OWN last two rows; the sample survives only for someone who has
      not started.
      ⚠️ **And it was going to spell out the answer.** The teaser rotation and the
      answer schedule both key off `getWordleDayIndex()`, so collisions are dated:
      **2027-01-04 the card would have rendered KANTE all-green — that day's real
      answer.** (Also 2026-10-03, teaser guess PEDRI.) `pickTeaserPair` now skips
      colliding pairs; guarded by a 420-day walk through the real schedule.
- [x] Streak label mismatch — **EIGHT sites, not the three the report counted.**
      There are two kinds of streak and they answer different questions:
      `loginStreak` (cross-mode "days you showed up", server-authoritative,
      shown on Home/Daily/Profile) and the per-mode `computeFootleStreak` /
      `computeMysteryStreak` / `computeTrailStreak` ("days you SOLVED this
      one", local). Every one of them rendered the identical `🔥 N-day streak`
      under the identical flame, so a player could read 12 on Home and 3 on the
      Footle card the same day with no way to tell which was lying. Neither
      was. Fixed by NAMING, not reconciling — making the cards render
      loginStreak would delete a real, different fact.
      ⚠️ And I did the half-fix first: renamed the 3 visible cards and left the
      5 SHARE builders emitting the bare string (2 Footle builders in App.jsx
      that "MUST stay in sync", FootleHero's fallback, lib/trail.js,
      lib/mysteryPlayer.js). The test caught it on its own baseline run, which
      is the only reason this line says 8. The guard now sweeps every .js/.jsx
      in src/ rather than the three files I happened to think of.
- [ ] ⚠️ Do NOT add a first-session branch to the daily draw — it would desync
      the frozen daily. Park the ramp as a design decision.

### 5 · Instrument the rating funnel — DONE (`93718fd`)
- [x] **Seven funnel events**, mirroring notif-prompt-* verbatim: shown
      (engine+trigger) · skipped (reason) · loving · not-really · store-tap
      (split by store) · store-unreachable · dismissed (view + how).
      A desktop tap-through is counted separately — it reaches a toast, not a
      store, and merging them would inflate the only conversion number we have.
- [x] ⚠️ **The budget was spent 3.5s before the sheet rendered.** Three asks in
      a LIFETIME, 60 days apart, and one could burn with nothing shown. My own
      screen gate had made it worse. Now spent at render.
- [x] **A white screen now suppresses the ask** — the ROOT ErrorBoundary never
      marked a bad moment, only the tab one did.
- [x] **"Too easy" no longer mutes our best players** (16 of 30 reports with a
      pick came from someone who answered CORRECTLY). ⚠️ Done by clearing the
      mark, NOT by the panel's gate-on-reason version the critic killed.
- [x] Remaining sentiment gaps — ALL FOUR CLOSED. Footle loss + rage-quit
      (`74f9775`); timeout + wrong-answer streak (`c5fb843`).
      ⚠️ The last two are ONE signal, and taken literally they were a trap: a
      single timeout is ordinary play, so marking every one would have
      suppressed the ask broadly enough to undo the funnel it protects.
      Thresholds measured against prod first — Daily 7 ends ≤2/7 on 20.5% of
      plays (70/341), 10-Q ends ≤3/10 on 8.3% (25/301), and ~48% of Survival
      runs end on question one, hence Survival is excluded (dying is the
      design). Rule: 4 misses in a row, or 3 timeouts, or ≤30%.
- [x] ⚠️ **THE FUNNEL WAS COUNTING ASKS THAT NEVER HAPPENED** (`c5fb843`) —
      found while wiring the above. `maybeRequestReview()` returns false in
      SILENCE on a bad moment / cooldown / lifetime cap, and both native sites
      logged `rate-prompt-shown` BEFORE calling it. Every suppressed ask was
      recorded as shown — and the suppression levers added all week are exactly
      what inflates it, so the number would have looked healthiest precisely
      where it was most wrong. I built this instrument the same morning.
      `nativeAskBlockedReason()` now answers "why not" without spending
      anything; `maybeRequestReview` delegates to it so the policy has ONE
      implementation instead of two that drift.
- [🅰️] The ask is storefront-blind while ratings are per-storefront (8 across 5).
      **NEEDS ALEX'S CALL — deliberately not built.** Checked first whether we
      can already answer it: `funnel_events` has no region column and its
      `meta` carries no country on any rate-prompt row (in fact ZERO
      rate-prompt rows exist — the funnel is in the unpushed set). So
      attributing asks to storefronts means COLLECTING a country/locale on
      native, and that is a change to what the native app gathers on a surface
      where privacy §4 says it does not measure usage and where Alex made an
      explicit recorded decision (2026-08-23: counted, never identified).
      A country code is coarse and not identifying, but it is his decision and
      it touches the App Store privacy label and the Play Data safety form.
      ⚠️ Also worth saying plainly: with 8 ratings total, the binding
      constraint is ASK VOLUME, not targeting. Recommend shipping the funnel
      first, reading a month of real `rate-prompt-shown` data, and only then
      deciding whether storefront targeting is worth a declaration change.

### 6 · Deepen the six club packs people actually pick
- [x] **Measured, and the report's numbers were exact.** Man United 24 eligible
      against a 10-question round = 2.4 rounds; 81 of 86 packs under four
      rounds, 43 under three, 14 under two (thinnest: Sheffield Wednesday and
      Norwich at 11). Deepest is Arsenal at 55 eligible / 65 total.
- [x] **Honest exhaustion message shipped** (`countFreshQuestions` +
      `shouldWarnPackThin`). `applySeenFilter` already degrades WELL — it tops
      up with the least-recently-seen so repeats are spaced as far apart as the
      pool allows — it just said nothing, so a fan's third United round met
      last week's questions in silence and read as "this app is empty". It is
      thin, but "you've played most of these" and "this app has no questions"
      are different reactions to the same fact and only one is true.
      Once per club per DAY, not per session: a thin pack repeats every session
      from the third onward, and a toast each time would be the annoyance this
      release is removing. No count in the copy (standing rule).
      ⚠️ I could NOT find the "web club page already has one" message the report
      refers to — searched a dozen phrasings across scripts/seo and public/.
      Either it does not exist or it is worded unrecognisably. Wrote fresh copy.
- [🅰️] **Deepening the six packs is still open** — this closes the honesty gap,
      not the depth gap. Six packs, one per session, is still the plan and
      still needs Alex's pick of which six.
- [x] ⚠️ **FOUND WHILE MEASURING: three indexed pages made a FALSE promise.**
      Juventus (×2) and Ajax club pages told readers the app holds "hundreds
      more questions" for that club. Not one of the 86 packs has 100 — Arsenal
      is the biggest at 65, median 40 — so it was false for EVERY club, on the
      pages that carry our biggest traffic, and it is the promise made BEFORE
      the install. Dropped the magnitude rather than stating the real one (a
      printed count is separately forbidden, and a number in prose rots).
      The identical sentence about the World Cup set is TRUE (657) and stays —
      guarded both ways, so "fixing" it by banning the phrase also fails.

### 7 · Fix the retention instrument before steering by it
- [x] `scores` under-records ~20% of daily completions (`969cecc`). Reproduced
      against prod, today-only: 137 games finished last week vs 110 rows;
      08-19 was 18 vs 12. Not a crash — an ASYMMETRY. `wordle_state` is
      eventually consistent (skipped when signed out, back-synced by `hydrate`
      at sign-in); `scores` was five separate fire-and-forget inserts behind
      `if (user?.id)` with no retry. Five call sites is why nobody could see it.
      Now one door (`saveScore`) + a durable outbox drained once auth settles,
      idempotent on a client uuid used as the PK so retries hit 23505 instead
      of inflating the number this exists to make honest. Backfilled rows carry
      the PLAY time, clamped to now — `created_at` defaults to now(), so a
      Monday game flushed Thursday would land on Thursday and the per-day
      counts would still be wrong, just somewhere new.
      Test falsified with five seeded defects.

### ⚠️ Do NOT do these (the critic killed them)
- Clearing `celebrationTimeoutsRef` on a screen-keyed effect — `setScreen("results")`
  is the LAST line of the same synchronous callback, so it would delete the
  entire celebration layer.
- A first-session branch in `pickDailyFresh` — desyncs the frozen daily.
- Moving `markBadReviewMoment()` into `sendQuestionReport` gated on reason —
  reason is null on skip/dismiss, so it would disable sentiment suppression.
- Widening `onboardingUp()` — `loopEvent` has no consent gate, so it would
  extend tracking-without-consent across the whole first session.
- Deleting only the two `!important`s at app.css:656 — under-specified, ships
  something uglier.

## 🧹 HOUSE SWEEP — Supabase advisors + dependency audit (2026-08-24)

Ran the purpose-built tools rather than hand-rolling. **Zero ERROR-level
security lints.** Most of the 56 are architectural noise — 31 say "your RPCs
are callable by signed-in users", which is the design.

- [x] **Checked the two that could have been real, and neither was.**
      `increment_score` / `increment_xp` both take a `user_id` PARAMETER, so a
      caller could in principle inflate someone else's totals — both guard with
      `if user_id is distinct from auth.uid() then raise exception`. And the
      anon-callable analytics RPCs (`log_club_quiz`, `record_challenge_event`,
      `record_funnel_event`) all validate inputs AND rate-limit, so the
      club-quiz calibration data used for the Feyenoord/Everton finding is not
      trivially poisonable.
- [x] **3 missing foreign-key indexes added** (`v1_7_index_foreign_keys.sql`):
      scores.user_id, funnel_events.user_id, room_answers.user_id.
      ⚠️ Preventative, NOT a fix for a felt slowdown — at 1.6-2.2k rows these
      cost microseconds. Worth it because all three are queried by user_id on
      paths that grow per user, and the new acct-* funnel joins on exactly
      `funnel_events.user_id`. Deliberately skipped `notifications.actor_id`
      (12 rows, queried by user_id not actor_id) — it would land straight on
      the advisor's *unused_index* list.
- [x] **`@capacitor/cli` moved to devDependencies.** It was a RUNTIME
      dependency despite being a build-only tool used by `sync:ios`/
      `sync:android` and never by `build`. Production audit went 4 vulns
      (3 high, 1 critical) → 2 high.
      ⚠️ `npm audit fix --force` would have installed @capacitor/cli@8 against
      @capacitor/core@6 — a version mismatch that breaks `cap sync`. The
      suggested fix was the wrong fix.
      ⚠️ Verified node-tar does NOT ship: 0 matches for TAR_ENTRY_ERROR /
      minipass / Unpack.prototype / tar-stream in either native bundle. (A
      naive `grep tar` DID match — "star", "start", "target".)

- [x] ⚠️ **`@vercel/og` 0.11.1 → 1.0.1 — DONE, and proved regression-free.**
      Clears four high libvips CVEs (GHSA-f88m-g3jw-g9cj) via sharp 0.35.3.
      **Production audit: 0 vulnerabilities.**
      Alex: *"all upgrades that are actual upgrades and do not introduce
      regression are welcome"* — so it was verified, not assumed. Rendered all
      SIX card types on 0.11.1, upgraded, rendered again: **byte-for-byte
      identical**, same SHA and byte count on every one. That is the strongest
      form of no-regression available for a renderer.
      ⚠️ The reachability was real before the fix: any signed-in user (incl.
      anonymous, who hold `authenticated`) can upload arbitrary bytes as
      `<uid>.jpg` to the public avatars bucket, and /api/og renders it through
      sharp. Blast radius was small (SSRF guard already present, uploads scoped
      to own uid, crashed ephemeral function = attacker breaks own card).
      ⚠️ **My first regression check was nearly worthless and the falsification
      caught it.** I passed `?o=78` to the rating card — a parameter it does
      not read — so before/after were a mostly-default card compared against
      itself. It matched perfectly and proved almost nothing. Redone with each
      card's real params read from the handler.
      ⚠️ Also: I read `node_modules/sharp` as 0.32.6 post-upgrade and briefly
      thought the fix had failed. That was a HOISTED dev copy; the one
      @vercel/og resolves is 0.35.3. Checking the wrong artifact, again.
- [x] **`api/og.js` now has a test** (`tests/unit/og-cards-render.test.js`) —
      the file's own comment said "No test covers this file", on the entire
      share surface, which has already failed silently and totally once
      (robots.txt blanked every card). Asserts a real PNG at 1200×630 per card,
      that the six differ FROM EACH OTHER (the assertion that catches a
      mis-parameterised test), that content changes change the image, and that
      the SSRF guard refuses a foreign img host. Deliberately does not pin
      hashes — that would break on any legitimate copy change and be deleted
      within a month. Falsified three ways.
- [🅰️] **Leaked-password protection is OFF** (HaveIBeenPwned check). One
      dashboard toggle, real security value, Alex's to flip.

## ⭐ ACTIVATION IS THE PROBLEM, NOT RETENTION (measured 2026-08-24)

⚠️ **THIS INVERTS THE STANDING THESIS.** [[project_first_real_numbers]] said
"leaky bucket, retention first". Measured against the COMPLETE dataset
(user_game_state, not the 20%-lossy scores table):

| | |
|---|---|
| accounts | 218 |
| **never played a single game** | **79 (36.2%)** |
| ...and not improving | 33.9% of the last 30 days' signups |
| of the 131 who DID play, one-and-done | 20 (15.3%) |
| average plays per player | **9.7** (max 77) |

**Retention is good. 85% of people who play come back.** A third of the water
never reaches the bucket. Every person converted past their first game is worth
~9.7 plays at 85% return odds — no other lever measured has that multiplier.

- [x] **Funnel instrumented** (`src/lib/acctFunnel.js` + `scripts/acct-funnel.sql`).
      Five steps, all fired SIGNED IN: acct-session → acct-username → acct-home
      → acct-first-play → acct-first-finish.
      ⚠️ Why signed-in matters: `record_funnel_event` records `auth.uid()`, and
      **907 of 908 existing `first-game-started` rows have a NULL user_id**
      because they fire while signed out. The old funnel cannot be joined to an
      account at all, which is exactly why the 79 are invisible.
      ⚠️ Scope kept narrow on purpose: counts, provider splits and retention are
      all derivable from SQL TODAY (this table proves it). Re-instrumenting them
      would create a second, weaker source of truth. The only thing added is
      WHICH SCREEN someone was on when they stopped.
      Query verified by seeding a walk that stops at Home and confirming it
      reports `lost_here: 1` at first-play; probe rows deleted.
- [🅰️] ⚠️ **GOOGLE CONVERTS 2.3× WORSE THAN APPLE — UNEXPLAINED.**
      53.2% of Google accounts never play (42 of 79) vs 23.1% for Apple (24 of
      104). Email sits between at 37.1%.
      The obvious theory — the username wall rejecting spaced provider names —
      **does NOT hold**: only 6 of the 42 have a space, and 8 Apple users WITH
      spaces played fine. Suggestive but confounded: every account with an iOS
      device token has played (25/25 Apple, 3/3 email), but holding a token
      means you granted notifications, which correlates with already being
      engaged. Needs a real investigation, not a guessed fix.
- [ ] Read `scripts/acct-funnel.sql` one week after 1.7.0 reaches players.
      Section 4 (instrument health) FIRST — a funnel that stopped recording
      looks identical to one where everybody succeeded, and
      `record_funnel_event` silently drops everything once the table exceeds
      3000 rows in an hour.

## ✅ SUMMER 2026 — ALEX'S RULING APPLIED (2026-08-24)

He reviewed all 89 individually: **55 approve · 31 reject · 3 hold.**

- [x] 55 untagged and back in Classic, league and club draws.
- [x] 31 deleted. Bank 6780 → 6749.
- [x] 3 still withheld pending his call: `q_s26s06` (Emery's Europa League
      count), `q_s26x04` (how long Tottenham's record stood), `q_s26w13`
      (third-place play-off scoreline).
- [x] The MODE stays retired — TOPICAL_PACK is still null. His objection was to
      a pack about the last few weeks, not to these facts appearing among
      ordinary questions.
- ⚠️ **Verified before deleting**: none of the 89 appear in `src/data/dailyLog.js`,
      so no rejection could rewrite a day someone had already played.
      `questions-index.js` and `questionConflicts.js` both reference the deleted
      ids and are BOTH generated by the build — regenerated clean.
- ⚠️ **Withholding rather than deleting turned out to be the right call.** A
      blanket delete on 2026-08-24 morning would have binned 55 questions he
      then kept.
- ⚠️ **`topical-headline-difficulty.test.js` was rescoped from tag to id
      prefix.** Scoped by tag it would now inspect three questions, pass, and
      guard nothing — at the exact moment the other 55 became reachable again
      through the general Managers/League draws, which is the route by which
      two of these reached him on 2026-08-23 in the first place. (He rejected
      both of those two himself.)

## 🤚 FEEL WORK FOR 1.7.0 — Alex: "no annoyances", device test today

- [x] **Hot Streak's reveal was a wall you could not skip** (`c42010f`) — 1,820ms
      of a 60-second clock, ~45%, in the mode whose identity is speed. Now a
      CEILING: tap or Enter/Space skips it, with a visible "tap to skip →".
      Measured live: tap 26ms · Enter 27ms · untouched 1,823ms.
      ⚠️ True/False had the same defect with a LONGER hold (2,400ms) and the
      report never looked at it. Fixed in the same change.
- [x] **Trail, Mystery and Stadiums were completely silent** (`f36fc37`) — zero
      playSound between them against App.jsx's 19, and sound defaults ON for
      native in 1.7.0, so this is the release where the silence gets heard.
- [x] **The settings defaults merge was thrown away on mount** (`4cd0e34`) —
      graded LOW, actually the thing that would have made the sound default land
      for NEW INSTALLS ONLY, because playSound reads storage not state.
- [x] ~~Tab bar fires no haptic~~ **FALSE POSITIVE, verified.** The finding
      grepped BiqNav.jsx, which is the DESKTOP RAIL. The real bottom tab bar
      already calls haptic("soft"); the reviewer's live check found nothing
      because off-native it falls through to navigator.vibrate, unsupported on
      desktop. On a phone it routes to Capacitor ImpactStyle.Light. No change.
- [~] **~1.0s of pure BLACK on native cold launch** (`e92978c`) — fix LANDED,
      awaiting Alex's device test. The Splash image is now inserted as a
      backdrop at subview index 0, BEHIND the bridge, so it fills the gap
      between the launch storyboard and the web splash and can never cover UI.
      ⚠️ Simulator-reproduced only; this is a cold-launch timing bug, so the
      device test is the one that counts.
- [x] **The web pre-boot shell ate the first tap** (`280c1c0`) — a 2.3s window
      (paints 0.6s, dead until 2.9s). VERIFIED AGAINST THE LIVE DOCUMENT, not
      inferred: balliq.app/play served SIX buttons, the only buttons in the
      whole document, with zero onclick and zero addEventListener anywhere near
      them. A brand-new player's first ever interaction with Ball IQ was a tap
      that did nothing — no press state, no answer, no error. The better the
      shell got at looking instant, the longer it lied.
      The shell now grades the question inline and hands the pick to
      OnboardingScreen, which mounts already-answered so the swap stays
      invisible; Skip/Start playing are honoured too.
      ⚠️ Shipped a bug inside this fix and caught it only by driving a real
      browser: deleting the pick on read ("adopt it once") loses it under
      StrictMode, because mount #1 eats it and mount #2 is the one the player
      sees. Every unit assertion passed — both halves were correct and only
      their ORDER was wrong. Read is non-destructive now; the side-effecting
      skip/start replay carries the latch.
      Also gates the "KEEP IN SYNC with ONBOARD_SAMPLE" comment, which had
      nothing enforcing it and drives an INDEX-based replay.

## 🤚 FEEL & NAVIGATION — opened 2026-08-23 on Alex's build-75 report

Alex: *"it is very laggy, and not responsive. it is like it thinks i stop
dragging it even though i have not let my finger off the screen... we need to do
some smoothness of navigation and feel around the app. we have to really make a
huge leap there."* Corroborated independently: scouting report #4 graded **Feel
6.5, DOWN from 7** (`docs/scout-4-partial-raw.json`).

### Landed — build 76 / vc31 (commit 182d64c)

- [x] **A slow drag selected TEXT instead of scrolling.** Reproduced on a booted
      simulator, twice, on two screens — the Copy / Look Up / Translate callout
      came up and the page never moved. Once WebKit's selection gesture claims
      the touch the scroll never starts, and the finger is still down: exactly
      the sentence Alex wrote. **Fast flicks always worked**, which is why three
      previous passes missed it — synthetic swipes and desktop testing both
      flick. `user-select:none` under `pointer: coarse`; inputs and `.selectable`
      exempt; desktop web untouched.
- [x] **`keepInputVisible` was unmemoized and passed into its own dep array**
      (Trail *and* Mystery), which exhaustive-deps asks for. Fresh identity every
      render → array inert → effect ran on EVERY render, firing a smooth
      programmatic `scrollIntoView` each time. With the keyboard up it was
      animating the page while the player dragged it.
- [x] **Two dismiss mechanisms on one gesture.** AppDelegate already dismissed
      natively; the JS blur-on-drag ran on native too. Now web/PWA/Android only.
- [x] **`.interactive` → `.onDrag`.** `.interactive` springs back on a short
      drag; each spring-back fired a full hide+show pair at the bridge (nine
      cycles in Alex's log), each rewriting `kbInset` and re-bounding the list
      under his thumb.
- [x] **Guard test falsified before being trusted** — green clean, red on all
      six defects seeded back one at a time. Its first version failed on
      *correct* code (anchored to a byte window my own comment pushed past).

### Next on feel — not yet started

- [ ] **Cold start.** Alex's device log: WebContent process 3.77s, GPU 3.76s,
      Networking 5.02s, then `WebProcessProxy::didBecomeUnresponsive`. Memory
      already had cold LCP at 4,014ms on `DIV.onboard-body`. Nothing the app
      does can feel smooth behind a 4-second open. ⚠️ Do NOT extract AppInner —
      see the superseded note in memory; it adds a round trip.
- [ ] **Audit the rest of the app for the same gesture-ownership class**: any
      programmatic scroll, focus, or layout change that can fire while a finger
      is down. Trail and Mystery are fixed; Footle, Stadiums, quiz screens,
      Friends and the club picker are unaudited.
- [ ] **Tap-to-visible-response latency** per mode — the thing that actually
      reads as "responsive" — measured on device, not in a browser.

## 🔧 SCOUTING REPORT #3 — the work list

Alex, 2026-08-23: *"we should do the majority of the work on the list before
submitting new builds, i am sure we will uncover more that will need to be in
the new builds along the way anyway."* So the upload moved to LAST, not fourth.
Full report: the panel artifact (16 areas, each with its path to 8+).

### Landed 2026-08-23 — web-deployable, not yet pushed

- [x] **Transfer Trail rejected its own correct answer.** `SON` was stored
      `["Heung-min","Son"]` while `mysteryPool` (which feeds the autocomplete)
      offers `"Son Heung-min"`, so tapping the app's own first suggestion spent
      an attempt. Fixed the order + aliased both name parts. ⚠️ Did NOT take
      the panel's headline fix (delete `HEUNGMIN`): the answer log is frozen at
      exactly 4 days per key, so deleting it would have orphaned 4 dailies.
- [x] **The guard test for that class was a tautology** — it built its expected
      strings from `p.display`, the field that was wrong, so it was green over
      a live bug. Rewritten against `mysteryPool.json` (independent source),
      plus a name-order test and a duplicate-human test. **Falsification-run:
      seeded the original bug, watched it go red, restored.**
- [x] **League Quiz shipped the answer-leak defect** the club draw was fixed
      for. Measured over 3,000 sessions/competition on the real pools: Primeira
      21.5%, Ligue1 9.5%, SuperLig 7.7%, SerieA 2.2% → **all 0.0%**.
- [x] **60 dead links across 10 club pages.** Birmingham, Cardiff, Derby,
      Norwich, Portsmouth, Sheffield Wednesday, Southampton, Stoke, Swansea,
      Wrexham had live `/quiz/<slug>/` pages and 15–20 verified questions each
      but no entry in any of the four routing maps. Wired all ten.
- [x] **3 more dead links: `/quiz/legends/`, `/quiz/managers/`,
      `/quiz/football-records/`.** Pools of 575/425/519 medium+hard questions
      reachable from nowhere in the picker. Added a "Themes" section.
      **All 675 deep links in the built output now resolve.**
- [x] **No-silent-dead-end guard** on the deep-link router: the if/else had no
      final branch, so any future map drift dumps the reader on Home with
      `?club=` already stripped. Now starts a general quiz and says why.
- [x] **Header buttons were 36×36 on every tab except Home** — `.hdr .icon-btn`
      at (0,2,0) beat `.hdr-ic`'s 44px at (0,1,0). The 08-22 pass reported
      "9 findings to 0" because it only sampled Home.
- [x] **Hard difficulty promised "some typed answers"** for 3½ months after
      `df54c40` removed every typed question. Copy fixed + guarded by
      `tests/unit/difficulty-copy.test.js` (also falsification-run).
- [x] **Chaos draw now shuffles options** like every other mode. ⚠️ Deliberately
      did NOT add leak-avoidance there: the 59-row pool has ZERO conflicting
      pairs, so it would have been a no-op that looked like coverage.

- [x] **THE RATINGS FIX — every store link pointed at the empty shelf.**
      Alex: *"it says there are only 2 reviews but I know at least 4 people gave
      it 5 stars."* There are **6**, on four storefronts — GB 3, NO 2, FR 1,
      **US 0** — and every default link went to `/us/`. The 08-22 fix reached
      2 of 8 call sites because the US-pinned `APP_STORE_URL` const was still
      imported by BiqNav, HomeScreen, the post-Footle CTA and both marketing
      pages. All 8 now call `appStoreUrl()`. `api/get.js` (the single CTA behind
      ~180 SEO pages) is region-aware; static pages get a country-less href plus
      an inline rewrite, so no-JS readers are never worse off. Stale
      two-names-old slug deleted. Guarded by `storefront-sync.test.js` across
      all four copies — falsification-run. **Verified live from Norway: /get
      now lands on the 5.0★ Norwegian shelf.**

### Next up — still web-only, no upload needed
- [x] Re-shoot `01-home.png` — **already fixed, by something else.** The glyph
      bleed and "🔥aily" were the translucent `.tab-bar` compositing over the
      cards behind it, not an animation frame; `forceOpaqueMaterials()` in the
      shot harness closed it. Verified on the 2026-08-26 re-shoot: tab bar is
      opaque, "Daily" reads clean, no bleed. No `animations:'disabled'` needed.
      Whole set re-shot and re-framed the same day (`660dd14`) for the new
      Ball IQ card, so both stores' galleries are current.
- [x] **Privacy §4 vs the native funnel — UPLOAD BLOCKER CLEARED.** Alex chose
      *anonymous counts*: native sends the event name and nothing else. ⚠️ The
      client half alone was NOT enough — `record_funnel_event` also inserts
      `auth.uid()`, so nulling the visitor id would still have named every
      signed-in native player by their account id while the code read as
      anonymous. `p_anon` now nulls both keys **in the function**, verified
      against prod. Same migration adds the hourly rate cap it never had (its
      three siblings all had one, and it is the one already poisoned). Also
      fixed: the website funnel + `biq_vid` were disclosed nowhere while live
      for 124 real visitors; the in-app screen claimed the site "shows ads via
      Google" 26 lines above "we do not display ads anywhere"; and it claimed
      "no consent prompt is shown" a week after we shipped one. Guarded by
      `privacy-policy-sync.test.js` — the comment-based sync rule had failed
      three times. **Verified live on balliq.app/privacy.html.**
- [x] **`npm run ratings`** — one command for every storefront's ratings.
      Immediately corrected the panel: **8 ratings across 5 markets**, not 6
      across 3 (India and South Africa were never checked; SA is our first
      non-5-star). No Apple surface aggregates them, which is the whole reason
      the store looked like it had 2.
- [x] **Lazy game screens had no error boundary** — a chunk failure took down
      the whole app, not the screen. Boundaries 4 → 12; screens get a "Back to
      Home" exit that tabs don't need. Every `fallback={null}` replaced with a
      real spinner (the empty frame was report #2's misdiagnosed "feels slow").
      Guarded + falsification-run. Verified by loading Mystery and Trail.
- [x] ~~Reminder reach 1 → 36 via `device_tokens` UNION~~ — **THE PANEL WAS
      WRONG, do not do this.** (a) `device_tokens` has no timezone column and
      the function pivots on local 7pm, so it is not a SELECT-only change.
      (b) Those 36 users are **already covered**: `lib/notifications.js`
      schedules an on-device 7pm local notification plus a win-back tail. The
      cron exists for WEB push, which has no on-device scheduler. Shipping it
      would have **double-notified every native user at 7pm**.
      Instead: `notif-prompt-skipped` now records WHICH of the five web gates
      bailed. ⚠️ Also learned — `.env.local` has no `VITE_VAPID_PUBLIC_KEY`,
      which reads as "web push is impossible", but the **live bundle has
      Vercel's copy and works**. Local builds cannot test web push; check the
      deployed bundle, never the local one.

### Waiting on data, not on work

- [ ] Read `notif-prompt-skipped` after ~a day and fix the gate that actually
      bites. If it is `guest`, the question becomes whether a web guest saying
      "remind me" should trigger an anonymous sign-in — a product call, since
      `persist()` upserts by user id and a guest's subscription cannot stick.
- [x] **Username wall** — the mandatory signup step rejected the name it
      pre-filled, for eight weeks. ⚠️ Which side was wrong was settled by DATA:
      `deriveUsernameFromIdentity` writes spaces into `profiles.username` and
      its collision suffix adds another, and **17 of 215 prod profiles already
      have a space**. The modal was the only component that disagreed. Now
      instrumented (shown/saved/rejected-with-reason) — it was the only
      mandatory first-run screen emitting nothing, which is why it hid.
- [x] **58% of the SEO surface reported to nothing → 220 of 328 instrumented.**
      localised 0→42/42, lists 0→37/51, and every club row now carries `slug`
      and `lang` (all 258 previous rows said `{"surface":"club-page"}` and
      nothing else). Impressions fire on first human input, not on load, so
      crawlers can't inflate them. ⚠️ The report was **wrong** that localised
      pages have no deep links — 35 of 42 already had one; the 7 without are
      hubs, which correctly link onward. The real gap was measurability.
      **Verified end-to-end on prod**: a live `/lists/` page emitted
      `{"lang":"en","slug":"most-premier-league-titles","surface":"list-page"}`.
      ⚠️ Still uninstrumented: `/questions/` 0 of 76, and 14 `/lists/` pages
      with no `.qa` block.
- [x] ~~`useDialog` for 20 dialogs that never focus~~ — **THE REPORT WAS WRONG.**
      `useModalA11y` already does focus/Escape/trap/restore/back-gesture, and
      **19 of 20 dialogs already called it**. The claimed "three `.focus()`
      calls, none on a dialog ref" is actually **ten, seven inside the hook**.
      Real gaps were 2: the marketing drawer (no Tab trap) and one Profile
      modal. Both wired.
- [x] **`document.title` + screen announcer + a real `<h1>`.** This part was
      right: zero title assignments and one `<h1>` app-wide. Deferred 120ms via
      `setTimeout` — ⚠️ **not rAF**, which doesn't fire in hidden tabs.
      Verified live: title tracks tabs, announcer updates at ~150ms.
- [x] **Hot Streak ✓/✗ glyph.** Was colour-only at 1.06 deuteranope contrast.
      Verified in the built app: wrong pick → ✗, answer → ✓, others keep letters.

### Follow-ups created today

- [ ] Convert the visible screen titles from styled `<div>` to real `<h1>` (the
      hidden h1 covers the accessibility tree; this is the tidier end state).
- [ ] `/questions/` pages: 0 of 76 instrumented (no taster, no `.qa` block),
      plus 14 `/lists/` pages with no `.qa` block.
- [ ] Trail roster: a 102nd verified player to replace the duplicate Son entry;
      Joaquín Sánchez missing from `mysteryPool` (days 89/177/249/363).

### Roster follow-up (needs verified data, not a code change)

- [ ] **Son Heung-min is in `TRAIL_PLAYERS` twice** (`HEUNGMIN` + `SON`). Left
      deliberately: the log gives all 102 keys exactly 4 days each, so merging
      hands him 8 of 408 — twice inside a fortnight at days 145/160 and
      284/303. Correct fix is a **102nd distinct player** in HEUNGMIN's slot
      with forge-verified career data. Allowlisted in the duplicate test, which
      must SHRINK to zero.
- [x] ~~**Joaquín Sánchez is not in `mysteryPool`** — days 89/177/249/363~~
      **STALE — verified fixed 2026-08-24.** Checked all 400 scheduled days
      against the pool: **0 unresolved**, and no Joaquín is scheduled at ALL.
      The listed days were wrong too — day 89 is Henrik Larsson (Q179334). The
      08-15 pool/search rebuild closed this and the board was never ticked.
      Guarded against regression: `audit-mystery-schedule.mjs` rule 3 ("every
      scheduled id must resolve to a pool entry") runs in the build gate.
      ⚠️ Joaquín Sánchez is still absent from the pool, but that is now a
      COMPLETENESS gap, not a bug — nothing schedules him.

## 📱 SIMULATOR TESTING — what it verified, and the one thing it cannot

Alex, 2026-08-23: *"i guess a sim would be more telling than a desktop
browser."* Correct, and it was. Built Debug for iPhone 17 (iOS 26.5) and drove
the real WKWebView.

**Verified on real iOS:** app launches and renders correctly; Home, More-modes
grid, League Quiz, Mystery Player all navigate; tab bar labels are perfectly
legible (confirming the contrast findings from experience-audit.mjs were MY
bug, not the app's); text input focuses and accepts typing; the Summer 2026
tile renders with its NEW badge.

⚠️ **THE ON-SCREEN KEYBOARD COULD NOT BE TESTED, and it is the one thing that
matters most.** The Simulator defaults to a connected hardware keyboard, so the
software keyboard never renders and `visualViewport` never shrinks — which
means the keyboard fixes (Trail, Mystery, Stadiums) still have NOT been
exercised even here.

Attempts made:
  · `defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool
    false` + full Simulator restart — pref reads back `false`, keyboard still
    does not appear on newer Xcode.
  · AppleScript ⌘K — refused: "osascript is not allowed to send keystrokes"
    (needs Accessibility permission, which is Alex's to grant, not mine).

**To unblock:** with the Simulator focused, press **⌘K** (I/O → Keyboard →
Connect Hardware Keyboard, toggled OFF). Then the software keyboard appears and
the keyboard fixes can finally be verified. ⚠️ I left the defaults key set to
`false`; say the word and I will restore it.

## 🔴 2026-08-22 — PLAYTEST REPORT (Alex + friend, 2 devices). OPEN.

Player-reported, therefore near-certainly real. Ordered by severity, not by
ease. Alex: *"especially all the online buttons have to work, we have to really
fix this."*

✅ **FIXED f51b6cc — P1 · Online rematch splits the two players into separate rooms.**
`claim_rematch()` makes the finished room the rendezvous; first tap creates,
later taps join, serialised by SELECT..FOR UPDATE. Exercised in prod with two
real user ids; a non-player is refused. The SHARE button had the same bug and
would have kept it alive — fixed too. **Needs a 2-device test before it counts.**

~~ORIGINAL REPORT~~ · Online rematch splits the two players into separate rooms. Both hit
Rematch after an online game and each ended up in a NEW room, alone. The whole
point of rematch is that neither leaves. Needs a room-level rematch handshake,
not two independent creates. Alex wants a native banner/notification keeping
both in the room they were already in.

✅ **FIXED 2a947ee — P1 · "Open the game" from a push notification does nothing.**
Payload was always correct; the TIMING was not. The OS listener lived inside
registerPush (needs sign-in), so a cold-launch tap fired before it existed and
Capacitor dropped it. Now attached at module scope + buffered. 5 tests, proven
by removing the buffer. **Needs a device test — cannot be exercised in a browser.**

~~ORIGINAL~~ · "Open the game" from a game push notification does nothing. Deep link
from the notification tap is dead. Online is unusable if invites cannot be
opened from the notification that announces them.

✅ **FIXED f51b6cc — P2 · Transfer Trail rejects a surname-only answer.**
The report did not reproduce on today's Alonso, but the SHAPE was real and
worse: De Bruyne/van Dijk/de Jong/de Gea/ter Stegen all rejected a form a human
would type, because `display` splits names inconsistently. Accepted forms now
derive from the whole name. 102 players verified, guarded by a test.

~~ORIGINAL REPORT~~ · Transfer Trail rejects a surname-only answer. "alonso" marked wrong,
"xabi alonso" marked right — obviously the same player, and the player knew the
answer. Answer matching must accept the surname alone.

✅ **FIXED f683fd9 — P2 · Stuck keyboard in every typing mode.** Alex was right:
Mystery had NO handling at all, Stadiums had only half. Now one shared hook
(lib/useKeyboardAwareInput.js) across all three. **Device test owed — a desktop
browser has no on-screen keyboard so the path never runs.**

~~ORIGINAL~~ · The stuck-keyboard bug is in EVERY typing mode.
Fixed in Trail 2026-08-21; Alex reports it in Mystery Player and suspects
Stadiums. Third instance from the same root — see
`feedback_trail_keyboard_reveal_scroll`. Fix the SHAPE, once, everywhere.

✅ **FIXED f497278 — P2 · Mystery Player: no way to get unstuck.** Three opt-in
hints (position / era / club count) unlocking after 3 guesses. Deliberately
avoids nationality and club — both Wikidata-broken.

~~ORIGINAL~~ · Mystery Player: no way to get unstuck. Friend guessed Cahill (ranked
#5), then could not get any closer and had no further help available. Needs
progressive hints the player can choose to reveal.

✅ **ALREADY DONE (not rebuilt) — P2 · No REVEAL on give-up.** Mystery has had
"Give up and reveal" since 24f4b48 (2026-08-17); Trail prints "It was <name>" on
any finish. Both landed after build 63 — the friend on 1.6.0 has neither. This
was a DELIVERY gap, not a development one.

~~ORIGINAL~~ · No REVEAL on give-up. Mystery Player (and probably Trail) end a lost
run without ever telling the player the answer. A quiz that will not tell you
what it was is the worst possible ending.

**P3 · Tab switching feels less responsive than it should** on the newest
build. Unmeasured — needs a real measurement before any fix, not a guess.

## ⚠️ 2026-08-22 — SUMMER-2026 PACK RE-CUT (playtest-driven)

Alex played the Summer 2026 tile within an hour of it shipping: *"terrible…
one question was who won the world cup just a month ago, come on. I think we
have to scrap this entire mode."*

He scored **7/10 and the three he missed were ALL `hard`** — he cleared every
easy and medium. The three misses were a Championship winner, an exact
appearance count and an exact goal total. Everything he breezed was a headline
outcome.

**The lesson, which generalises:** a topical pack is made of things the engaged
audience WATCHED HAPPEN. The headline is a memory, not a question. Quiz the
detail. See `feedback_topical_packs_quiz_the_detail` in memory.

Not scrapped, because scrapping the tile would NOT have fixed it — 56 soft
topical questions were sitting inside Transfers/WorldCup/Managers, softening
every one of those rounds. Instead: 5 telegraphed questions deleted, 14
headline ones re-labelled easy, 10 detail ones re-labelled hard, and the tile
now serves **hard only** via a new `onlyDiff` option (`diff` is a ceiling, not
a floor). Pack 94 → 89; tile pool 48.

✅ **RE-CUT 2026-08-22 00:30.** Both binaries rebuilt at the SAME version
(1.6.3 / iOS 66 / vc21) because nothing was ever uploaded — no version burned.
The stale archive was deleted from Xcode's Organizer folder first, so only one
"Ball IQ 1.6.3 (66)" exists and there is nothing to pick wrong.

Verified INSIDE the artifacts, not in the source tree: hard-only tile present,
re-cut detail questions present, the five deleted questions gone, consent gate
present, zero unguarded third-party scripts. The AAB was extracted and grepped
directly because gradle reported "302 up-to-date" in 3 seconds, which is
exactly the shape of a stale build.

⚠️ Note "Which country won the 2026 World Cup?" IS still in the bundle, and
should be — it stays in the bank as an honest `easy` question for casual
players in a World Cup category quiz. The fix was that the TILE (hard-only)
can never serve it. Do not "fix" this again by deleting it.

## ⚠️ 2026-08-21 — THE FUNNEL WAS MEASURING ROBOTS (fixed, live)

Went to read the funnel shipped that morning and found the instrument already
giving false readings. Three hours in: **1,021 rows, 867 of them
`first-game-started`**, ~250/hour, one per visitor, in exactly the hours the
Playwright suite ran — against a real DAU of **13-17**. One row was named
`probe-e2e`.

Cause: e2e runs on localhost, localhost reads `.env.local`, `.env.local` points
at **production** Supabase (no staging project exists). Every local and CI run
wrote test events into the table the product's decisions come from, ~50
synthetic rows per real one. Worse than no data, because it looks like data.

**Fixed in both emitters** — `loopEvent()` (app) and `bqev()` (club pages) now
refuse `navigator.webdriver` and localhost. Guarded by
`tests/e2e/funnel-synthetic-gate.spec.js`, which was itself verified by
disabling the gate and watching it fail. Its FIRST version passed with the gate
off and proved nothing.

**Second finding, with teeth:** the club pages reported only into Clarity. They
carry ~39% of all play, and Clarity was consent-gated that same morning — so
the busiest surface in the product had just gone dark for every European
visitor who declines. `bqev()` now also writes to `funnel_events`, which is
first-party and consent-exempt. Shared `biq_vid` means club-page → app is now
ONE journey, a crossing nobody could measure before.

⚠️ **`docs/FUNNEL.md` is the reference. Every query must filter
`created_at > '2026-08-21 22:10:00+00'`.** The 1,021 contaminated rows were
deliberately NOT deleted — irreversible, production data, and a documented
cutoff does the same job at zero risk.

⚠️ **Do not "verify the funnel" by driving a browser** — automation is now
correctly invisible to it. Zero rows is the gate working, not a bug.

**Still unanswered, now answerable:** nothing has yet been read from clean
data. First real question worth asking once traffic accrues — what fraction of
club-page players ever reach the app.

## 🧾 PARKED — commerce on the website (Alex, 2026-08-21)

Alex wants to explore selling physical goods on balliq.app — jerseys,
sportswear, supplements. **Explicitly not urgent**; noted for later.

Two things established already so the exploration starts from facts:

1. **Being external to the apps does not avoid the trader obligation — the
   website is the SOURCE of it.** The app-store trader declaration is a DSA
   rule aimed at store platforms. Selling physical goods to EU/UK consumers
   from your own site triggers consumer law (Consumer Rights Directive and the
   UK equivalent), which requires trader identity and a geographic address to
   be given BEFORE the customer is bound.
2. **It does not have to be his home address.** A registered company address,
   virtual office or accountant's address satisfies it. Alex has plans for a
   business address and phone number and will sort them when he's ready — also
   parked, also not urgent.

⚠️ The three product categories he named are NOT equivalent in risk, and that
distinction is the whole substance of the exploration: club replica jerseys are
LICENSED goods (selling them without authorisation is counterfeiting), while
supplements are a regulated category with health-claim and food-safety rules
that vary by country. Own-brand print-on-demand merch carries neither problem.
Full write-up owed.

## 🔨 1.6.3 CUT 2026-08-21 — BUILT, NOT UPLOADED (Alex's call)

**iOS build 66 · Android versionCode 21 · marketing 1.6.3.** Archive in
`~/Library/Developer/Xcode/Archives/2026-08-21/`, AAB at
`android/app/build/outputs/bundle/release/app-release.aab` (7.3 MB).
Nothing uploaded — Alex said explicitly not live for people today.

Carries 21 src/ commits that were web-only, including the 94-question
summer-2026 pack + its Home tile, the Europe consent gate, and three
player-reported fixes plus a keyed answer that marked the correct choice wrong.

⚠️ **DEVICE TEST OWED before any upload.** New Home tile, new quiz path and a
consent banner that has never run on a phone. A green archive proves
compilation, not behaviour.

⚠️ CocoaPods failed the first `cap sync ios` and the sync still printed
"finished". `export LANG/LC_ALL=en_US.UTF-8` and re-run. Both slots at the
stores were free as of today.

## ✅ 2026-08-21 — CONSENT GATE + SUMMER-2026 PACK (both live on web)

**Clarity is now consent-gated in Europe.** Yesterday's commit made the privacy
POLICY honest and said outright that it did not make the PRODUCT compliant.
This closed that gap. Clarity is not injected at all for European visitors
until they choose; the gate is inline in BOTH halves (`index.html` and
`gen-seo-pages.mjs`), because the static club pages carry ~39% of all play and
are where most European search traffic lands. Banner in `public/consent.js`,
loaded lazily so decided and non-European visitors never fetch it.

Verified on PROD, not on a green build: banner renders on balliq.app, **zero
requests to clarity.ms**, choice persists across reload, `/play` renders with
no console errors. Decline and Allow are deliberately equal in weight — a
quieter "reject" invalidates the consent it collects.

⚠️ Two things worth knowing:
  - Region is decided by TIME ZONE and is over-inclusive on purpose (all
    `Europe/*`, plus `UTC`/empty, because fingerprint-hardened browsers report
    UTC wherever they are).
  - `playwright.config.js` now PINS `timezoneId` and pre-answers the prompt for
    the other 40 specs. Without the pin, CI (UTC) and a Mac (Europe/Oslo) would
    exercise different app behaviour. 129/129 green across the three CI projects.

**Summer-2026 pack: 6 → 94 questions.** Covers the 2026 World Cup, the whole
2025-26 season, the manager merry-go-round, the transfer window and the
retirements. Bank is now 6,788.

⚠️ **Every fact required TWO independent sources before it became a question**,
because almost all of it postdates the model's knowledge cutoff and therefore
could not be written from memory without inventing it. The six questions that
were already in the bank were re-verified rather than assumed — they passed.

Deliberately NOT written, each a question that would have read perfectly and
been wrong: Martínez's save count (11 vs 12), the Enzo Fernández red-card
timing, Messi's all-time tally (20 vs 21), the youngest scorer, Ronaldo
"retiring" (he said last World Cup, which is not the same), Messi retiring (a
live story), a Wikipedia claim that Southampton were expelled from the play-offs
for spying (uncorroborated, and exactly the shape of the vandalism already on
file), and fees on seven deals where reputable outlets disagree.

New gate: `scripts/audit-pack.mjs <tag>` — per-pack validator for
self-answering stems, answer-naming hints, bad answer indices, duplicate
options and undated superlatives. Proven by seeding five defects and confirming
it caught all five. It then caught a real undated superlative in my own writing.

**Still open from this thread:** the pack is web-live but native users get none
of it until a fresh build is cut — see the 1.6.1 section below, and note it now
predates even more work.

## 📦 1.6.1 CUT 2026-08-17 — BUILT, NOT UPLOADED (Alex's call)

**iOS build 64 · Android versionCode 19 · marketing 1.6.1.** Signed AAB built
(7.2 MB, `BUILD SUCCESSFUL`); iOS synced. **Nothing uploaded — that is Alex's.**

Why it exists: five `src/` commits landed AFTER build 63 was cut, so every one
of them was live on web only while native users had none of it —

    22e7ed5  A3 DayComplete — the retention fix
    ce2d7af  Survival results — was "Round complete / 0-of-1" on sudden death
    24f4b48  Mystery give-up — the mode had NO way to end a losing board
    86c3bf8  Mystery reveal no longer asserts a club/nationality we can't trust
             ← a FACTUAL ERROR live for native users until this ships
    47c8948  Mystery ranks on teammate overlap — the player-reported bug

⚠️ **BEFORE UPLOADING: check whether 1.6.0/63 is still in App Store review.**
Standing rule is one version through review at a time. Play has no such
constraint — vc19 over vc18 is fine whenever.

⚠️ **Device test still owed.** A green build proves compilation, not behaviour.

Verified on this cut (not "the sync said OK"): `rm -rf dist` first, then the
strings "Run over", "Today's done", "in a row" and "Best ever" all resolve
INSIDE both native bundles — the check that catches the stale-dist trap.
`marketing/ball.png` survived the prune (deleting `marketing/` 404s the native
nav logo). No unguarded third-party `<script src>` in the native HTML, so the
no-ads/no-analytics privacy declaration still holds. Both bundles 6.5 MB.

---

## 🎟️ GUEST ENTRY FOR INVITE LINKS — code landed 2026-08-20, needs Alex to activate

Alex approved (2026-08-20): a friend tapping balliq.app/join/CODE can now play
as a guest via Supabase anonymous sign-in — full option: generated editable
lobby name, upgrade-to-account path, anon cleanup cron, friend-search filter.
All code is on the branch and inert-safe until activation (the guest button
falls back to the sign-in prompt while the provider is off).

**Activation (Alex, ~5 min, do both together):**
- [x] ~~Supabase dashboard → enable **Anonymous sign-ins**~~ — **ALREADY ON,
      verified 2026-08-24** by POSTing to /auth/v1/signup with the publishable
      key: it returned a real access token. Alex must have enabled it.
- [x] ~~Apply `v1_6_anon_guest_entry.sql`~~ — **ALREADY APPLIED, verified
      2026-08-24**: `profiles.is_anon` exists, `set_player_name` exists, and
      the `cleanup-stale-anon-users` cron is scheduled (04:37 daily).
      ✅ **RESOLVED 2026-08-28: the client half IS reachable and guests ARE
      using it.** The "zero anonymous users" read was stale within days: prod
      now holds 12 anon users (Aug 24 ×4, 26 ×1, 27 ×6, plus one test), all
      with is_anon profiles from the trigger. 8 of them reached rooms — all 9
      such rooms ended — and one played the Daily 7. Verified end-to-end by
      playing it signed-out: /join/CODE renders the gate with "Play as guest"
      as the PRIMARY CTA, anonymous sign-in succeeds, auto-join fires, and a
      bad code errors correctly ("No room with that code").
      ⚠️ One anon user (`f2541858…`) exists from my enablement probe. I could
      not delete it — removing auth.users rows is blocked here — and the
      cleanup cron only reaps anon users older than **30 days** with no recent
      session, so it will linger until then. Delete it from the dashboard if
      you would rather not wait.
      Still to do: refresh `supabase/prod-snapshot/`.
- [ ] 2-device test, NARROWED 2026-08-28 — entry/join/room-end are proven by
      prod data above, so what actually remains: device B renames itself in
      the lobby, sees the "save your stats" CTA on game over, upgrades with
      email+password, stats survive.
      ⚠️ MEASURED while verifying: MP writes NO scores rows for ANYONE —
      zero race/mp rows in scores across the whole last 7 days despite ended
      rooms daily. The "MP stats never saved (realtime-gated)" backlog item
      is now a quantified product gap, not a hypothesis — and it hollows the
      guest upgrade pitch, since a guest who only played MP has no stats to
      save.

Notes: anonymous users hold the `authenticated` role, so no RPC/RLS changes
were needed. Social (Apple/Google) upgrade is deliberately NOT offered to
guests — it would replace the session and orphan their stats; email+password
upgrades in place (same uid). Identity linking for social is a follow-up.

---

## ✅ ALL FOUR DAILY MODES ARE SCHEDULE-IMMUNE — audit closed 2026-08-19

| mode | answer source | immune to bank/pool growth |
|---|---|---|
| Footle | frozen `WORDLE_ANSWER_LOG` | ✅ guarded by test |
| Transfer Trail | frozen `TRAIL_ANSWER_LOG` | ✅ `PUBLISHED` prefix frozen (`85a9485`) |
| Daily 7 | frozen `dailyLog.js` | ✅ `99e2169` |
| Mystery Player | frozen `mysterySchedule` | ✅ already `log[i]` by day offset, id-stable |

Also measured and CLEAN, so nobody re-checks: **0 of 400 logged Daily 7 days
contain a leaked pair** (one question giving away another's answer). The
834-entry conflict map is club-pack derived and the daily draws from 4,270
eligible questions, so collisions are vanishingly unlikely. ⚠️ My first
measurement said "0 conflict entries" — a FALSE NEGATIVE from importing
`CONFLICTS` instead of `QUESTION_CONFLICTS`. A zero on something that should
exist is the tell, every time.

End-to-end verified on prod after the freeze: full Daily 7 played to
completion — 3/7, +30 XP, review count reconciles with the score, CTA correctly
points at Footle.

---

## ✅ THE DAILY 7 IS NOW FROZEN — found AND fixed 2026-08-19 (99e2169)

**Every question added to the bank silently rewrites every past and future
Daily 7.** Measured, not inferred:

    pickDailyQuestions = seededShuffle(mcqOnly, dayIndex * MULT).slice(0, 7)
    mcqOnly is derived from the LIVE bank.

    adding ONE question  -> today's Daily 7: all 7 questions change
    removing ONE         -> all 7 change
    a daily from 7 days ago, after adding one -> ALSO rewritten

So a forge wave, a triage deletion, even a re-tag reshuffles the flagship mode's
entire history. Consequences, in order of damage:

- **`/c/` challenge links rot.** A link shared before any bank change resolves
  to different questions, so "beat my 5/7" compares two different quizzes.
- **"Shared by everyone today" is false across a deploy.** Two players either
  side of a push get different questions on the same date.
- **The OG card** for a past daily shows questions that player never saw.
- **Native vs web disagree continuously**, since native ships a frozen bank.

⚠️ This is the SAME class as the Trail bug fixed in `85a9485` and the Footle
trap fixed long ago — and `quiz.js` even documents the rule it is breaking:
*"Its selection must depend on the date and nothing else."* It depends on the
date AND the current size of the bank.

**FIXED (`99e2169`).** Logs the ANSWERS per day (`src/data/dailyLog.js`, 400
days, 31 KB) rather than freezing the pool — freezing a pool is not enough,
since appending to it still changes the shuffle permutation. A logged day never
consults the bank to decide WHICH questions, only to resolve them.

Generated FROM the current bank on purpose, so **today was byte-identical to
what players already had** and the freeze landed with zero disruption. Verified
live on prod: the Daily 7 opens with `q_2959f4`, the first id in today's logged
entry.

Deleting a question no longer shortens a day (deterministic top-up, touching
only days that referenced it); beyond the 400-day horizon it falls back to the
live shuffle, same as Footle. `gen-daily-log.mjs` is deliberately NOT in the
build chain and only ever appends. Six regression tests in
`tests/unit/daily-log.test.js`.

Past days deliberately not reconstructed — unrecoverable, and a fabricated
history would be worse than an honest start date.

---

## 📋 PLAYER REPORT 2026-08-19 — the Kane question is a free point

`q_1f2b59` "Harry Kane joined Bayern Munich in 2023 — from which Premier League
club?" (answer Tottenham) drew a "way too easy, really obvious" from a player,
in the DAILY 7 — the most-shared, most-compared screen we have. It is labelled
`easy` and it is correct; the problem is that it is a free point for anyone who
follows football at all, which is the whole audience.

✅ **No longer blocked** — with the log frozen (`99e2169`), editing or removing
a question touches only days that referenced it, not all of history. The Kane
question can now be dealt with on its own merits. Still open: it is correct and
correctly labelled `easy`; the judgement call is whether a free point belongs in
the daily at all, which is an editorial call for Alex.

---

## ✅ CLASSIC DESIGN PASS — DONE 2026-08-19

Audited by PLAYING it, states not screens: difficulty picker → in-game →
timeout reveal → results → missed-answers review. The picker and the in-game
layout came back clean. Two real defects, both the same shape — **the score
and the screen disagreed**:

1. **`a4f78df` — a timeout said "✓ Correct!"** in green. On expiry the timer
   sets `selected` to the CORRECT index so the right option lights up in the
   reveal (good), but the verdict pill decided its text from `selected === q.a`
   — one variable carrying two meanings. Scoring was already right
   (isCorrect:false, timedOut:true, red pip, streak reset); only the message
   lied, which is the worst kind. Now "⏱ Time's up". A `timedOut` flag wins
   over the index comparison and clears with the other per-question resets.
2. **`f0b278b` — timed-out questions were missing from the missed-answers
   review**, excluded by the `correct !== "timeout"` guard on the wrongAnswers
   push. Red pip, counted against the score, no answer and no explanation
   shown — for the one case where the player has NO idea what the answer was.
   Explanations are the differentiator; this screen already learned the lesson
   once when the review was wrong-answers-only.

⚠️ **Verification caveat worth remembering:** Chrome throttles setTimeout in a
HIDDEN tab (~1/min), so timing-dependent behaviour cannot be counted in the
preview pane — only 3 of 8 timeouts fired in 185s. The timeout REVEAL also
lasts 800ms, too short to screenshot; catching it needed a DOM poller.

⚠️ **Not a bug, checked:** the review looks duplicated in the DOM. Mobile and
desktop layouts both mount `WrongAnswersReview`, one `display:none`. 3 entries
render as 6 rows — count entries, not rows.

**Remaining for Classic:** nothing found. Survival's half was done 2026-08-17
(`ce2d7af`).

---

## 🎯 THE PERFECTION PUSH (2026-08-17 → authority kit) — MEASURED, not guessed

Alex: "making everything we have 10/10 … what areas are 6/10." Everything below
was measured this afternoon by running something. **Four things scored badly.
Five things I expected to score badly came back clean and are recorded here so
nobody re-audits them.**

### ⭐ P1 — HALF THE CLUB PACKS ARE ONE PLAY DEEP  (the biggest gap on the board)

Club quizzes serve **10 medium+hard** (easy is dropped for invested fans), with a
14-day seen filter. So fresh plays = `floor(noEasy / 10)`.

    CRITICAL  <20 med+hard (ONE fresh play, ever)   14 clubs
    THIN     20-29         (two)                    29 clubs
    OK       30-49         (three-four)             42 clubs
    GOOD      50+          (five+)                   1 club

**43 of 86 packs give a fan two fresh quizzes or fewer.** Thinnest: Sheffield
Wednesday 11, Norwich 11, Birmingham 12, Wrexham 12, Cardiff 12, Swansea 12,
RB Leipzig 13, Derby 13, Hajduk 14, Portsmouth 14, Stoke 14.

Why it is the top item: club pages are the SEO engine AND the measured finding is
"PLAYABLE beats readable" — the club page is where a search visitor actually
plays. Half of them are exhausted after one round.

⚠️ The CODE is not at fault and must not be "fixed": `applySeenFilter` already
tops up with the LEAST-RECENTLY-SEEN rather than at random, so unavoidable
repeats are spaced as far apart as the pool allows. That is correct. With an
11-question pool and a 10-question quiz, no algorithm can save the second play.
**This is a data gap, not a logic gap** — the classic between-code-and-data bug.

    COST:  229 Qs lifts the 14 CRITICAL clubs to 30 (three fresh plays)
           355 Qs lifts EVERY pack to 30
         1,040 Qs lifts EVERY pack to 40 (four fresh plays)

Recommend the 355 — every pack to three fresh plays — via the forge pipeline
(generate → examiner → skeptic), in club waves as usual.

### P2 — 1,219 QUESTIONS HAVE NO EXPLANATION (81.8% coverage)

    History     97.2%   PL       99.6%   Transfers 100%   ChampionsLeague 100%
    Legends     84.1%   Records  81.9%   Managers  79.6%   LaLiga  76.0%
    UCL         74.9% <   SerieA  68.4% <  Bundesliga 63.7% <
    Euros       56.3% <   WorldCup 53.2% <  ...  TOTAL 81.8%

WorldCup is the 4th-largest category (635) and barely half of it explains itself.
This is the exact claim the store copy already had to be walked back on, and it
is the difference between a learning product and a guessing game. Worst five
categories carry ~900 of the 1,219.

### P3 — WEB LOCALISATION IS 38 PAGES AGAINST 140 ENGLISH

    /es/ 11   /it/ 9   /fr/ 5   /de/ 4   /pt/ 4   /id/ 3   /tr/ 2

Measured previously: localised pages convert **2.6×**, and /es/ River Plate drew
134 impressions against 8 for the English equivalent. The pipeline, the gates,
the hreflang mesh and the orphan check all already exist — this is pure content
throughput on rails we have already built. Cheapest measured growth lever we own.

### P4 — ARABIC IS THE WEAKEST OF 15 STORE LOCALES

    ar   subtitle 18/30   keywords 69/100   promo 112/170   desc 1751

Every other locale is 88-99 on keywords. Arabic is one of football's biggest
markets and we are leaving a third of the indexable fields empty. Cheap: it is
copy, not code, and `check-localisations.mjs` gates it.

### ✅ MEASURED CLEAN — do NOT spend the next few days here

- **Web technical quality is already 10/10.** Lighthouse mobile, live prod:
  `/quiz/liverpool/` **100 / 100 / 100 / 100**, 52 passed 0 failed; and the
  newest, fastest-shipped page `/tr/quiz/galatasaray/` scores **identically**.
  The localisation wave did not cost us any technical quality.
- **Answer-position bias is a NON-ISSUE.** The stored bank is skewed A 37.3% /
  B 26.8% / C 21.2% / D 14.7% — a 12.3pp deviation that looks alarming. Every
  draw path shuffles options at draw time: `getQs`, `getDailyQsForDate`, club,
  league, couch, MP, and even the SEO tasters (deterministically by sha1 so pages
  stay stable). **No player is affected.** ⚠️ I nearly filed this as a critical
  fairness bug because I grepped for the variable name `idx` and the two main
  paths use `shuffled`/`sh`. Grep the BEHAVIOUR, not a variable name.
- **Era targeting is fine.** 247 rows mention a pre-1950 year, but they are
  overwhelmingly founding dates, first-title and origin facts; of the 141 that
  are not, nearly all are canon (1930 World Cup, Maracanazo, Superga, Austria's
  1938 withdrawal) and 72 are correctly graded hard. `getQs` already gates
  `cat:"Legends"` out of casual modes. Nothing to do.
- **Bank hygiene is spotless:** 0 exact duplicate stems, 0 duplicate options
  within a question, 0 blank options, 6,687 of 6,694 with exactly four options
  (the other 7 are legitimately `type:"tf"`).
- **Difficulty mix is sane:** easy 25.1 / medium 48.2 / hard 26.7.

### ⚠️ BLOCKED — cannot measure today

**The GSC connector lost its entitlement** (`sc_top_pages`, `sc_top_queries` both
return `entitlement_required` for the AdvisorPPC account). All ranking numbers in
this doc are the dated readings from 08-09 and 08-15, NOT fresh. Re-auth the
connector, or read GSC in Alex's paired Chrome, before any ranking decision.

---

## ☀️ TODAY'S AGENDA (2026-08-17) — re-measured this morning, not assumed

**Verified before writing this:** on `main`, clean, everything pushed. iOS 1.6.0
build 63 and Android 1.6.0 vc18 are CUT (live status is Alex's/the consoles' to
confirm). 324 pages, 8 languages, all gates green.

**The number that sets the agenda.** Weekly distinct players: 28 → 35 → 38 → 35
over four weeks. **FLAT.** New signups 35/22/34/21. Plays per player ~7/week,
steady. The 2026-08-14 diagnosis stands unchanged: leaky bucket, **retention is
the binding constraint**, and more pages pour faster into it.
⚠️ I first read the DAILY series (Sun 20→15→10) as a 33% decline and was wrong —
n=10-19 per day is too noisy to trend. The weekly aggregate is the honest view.

**30-day play by mode — where the product actually is:**

    footle    52 players · 4.9 plays each      classic   37 · 4.9
    daily     48 players · 5.0 plays each      survival  29 · 4.8
    trail     15 · 2.5    legends 12 · 1.8     chaos 11 · 2.3
    ALL 72 CLUB QUIZZES: ~50 plays across 13 clubs
    mystery:  1 play, ever (2026-08-15)

### The ten, in priority order

1. ~~**A3 — somewhere to go after a finished day.**~~ **DONE 2026-08-17** — the
   plug-the-bucket set is now closed. `DayComplete` panel; details and the
   deferred deep-archive warning are in the A-series section below.
2. **Classic + Survival design pass.** 66 players between them — a third of all
   play — and they have NEVER had one. Highest players-per-unit-of-attention on
   the whole board, and they cost nothing to feed.
3. **B gate: every mode awards XP and writes a scores row.** Mystery shipped
   without both. Gates here have a perfect record — none has ever recurred.
4. **Mystery — DIAGNOSED 2026-08-17. It is neither broken nor unloved; we are
   BLIND to it, and it is the only daily mode that punishes not-solving.**
   Ruled out by execution, in order: `MYSTERY_ENABLED` is true; today's puzzle
   resolves (`dayIndex 20682 → Q482955`, and the next three days resolve too);
   it renders as a Home tile and a Daily card. So it is reachable and visible.
   **The actual finding:** `MysteryPlayer.jsx` dispatches `biq:daily-completed`
   only inside `if (isWin)`. Footle fires on won OR lost; Trail fires on `done`
   either way. So a Mystery scores row means SOLVED — **"1 play ever" is "1
   SOLVE ever"**, and we have no measurement at all of how many people open it,
   guess, and stop. App.jsx documents the reason ("no lose state — unlimited
   guesses"), so this is deliberate, not an oversight.
   ⚠️ **But it silently breaks the A0 rule we adopted for retention.** A0 says
   the streak "ticks on ANY completion, win or loss", chosen precisely because
   we cannot administer win-only fairly across an uneven bank. Mystery is the
   ONE mode where failing to solve costs the streak — and it is the hardest of
   the four (Contexto-style ranking over ~9,000 players). That is backwards.
   **NEEDS ALEX'S CALL, because it changes streak semantics:**
   (a) give Mystery a terminal state — a give-up/reveal — then fire on `done`
       like Trail. Cleanest, matches the other modes, ~half a day.
   (b) tick on genuine engagement (N guesses) without a reveal. Cheaper, but
       "played" becomes fuzzier than in the other three modes.
   (c) leave it win-only and accept both the blindness and the asymmetry.
   Either (a) or (b) also ends the blindness. I did not change it unilaterally:
   the streak is the retention mechanic we just rebuilt and A0 has explicit
   reasoning behind it.
5. **A5 — audit STATES, not screens.** Guest/signed-in, empty/full, mid-game,
   offline, PWA-standalone. Three of the last four bugs were state bugs. ~2 days.
6. **B gate: cross-screen counter agreement.** Home said 0/2 while Daily said 0/4.
7. **Confirm store status + finish the Play listing.** Feature graphic 1024×500,
   the 8 Android screenshots, vc18 release notes (500-char cap, `<en-US>` tags),
   15 localised Play listings. ⚠️ ALEX confirms what is actually live.
8. **Capacitor 8 branch — iOS side + AGP 9 retest, then merge** (#74). Clears two
   of Play's four warnings.
9. **Splash PNG → WebP.** 3.40 MB of a 7.3 MB AAB, for no user-visible change.
10. **Then, and only then, the taps:** RB Leipzig forge top-up (20 questions vs
    the 22 a page needs), L2 waves (Turkish +3, Portuguese +4), and L5 per-locale
    measurement of the eight languages just shipped.

### 🟡 MYSTERY REVEAL — FALSEHOOD REMOVED 2026-08-17, DATA STILL WANTS A RE-PULL
Testing the give-up surfaced the reveal printing **"Edwin van der Sar ·
Barcelona"** — he never played in Spain, and he was that day's answer.

**Shipped:** the reveal no longer prints `club` or `nat`. It now reads
`position · N clubs · born YYYY` — every field survives checking (the club COUNT
is unaffected by the label bug). Thin and true beats rich and wrong.

**What the data actually shows** (⚠️ my first write-up of this over-claimed two
of three rows; corrected here):

    Q7156   "Barcelona"  120  FC Barcelona                       ✅ correct
    Q1492   "Barcelona"    2  the CITY — van der Sar, Zahavi     ❌ wrong entity
    Q172803 "Barcelona"   23  country=CROATIA — Dinamo Zagreb    ❌ wrong label
    Q248782 "Barcelona"    2  Barcelona S.C. (Ecuador)           ⚠️ real club,
                                                                   ambiguous label

⚠️ I first said Q172803's 23 were "Dinamo Zagreb players shown as Barcelona"
reasoning from three names — but Dani Olmo genuinely IS at Barcelona now, so that
reasoning was luck. `country=Croatia` is what actually proves it. And I called
Q248782 wrong; it is a real club with a legitimately short name.

⚠️ **THE CAREER DATA IS NOT AN ESCAPE HATCH.** It shares the same dictionary and
the same defect — van der Sar's career literally reads "Barcelona 1990-1999"
where Ajax belongs. Anything rendered from it inherits the bug.

⚠️ **`latestClub` STACKS WITH THIS.** It picks the LONGEST spell, not the most
recent (deliberate — it fixed Neuer reading as Schalke). So Dani Olmo's clubId is
his 5-year Dinamo spell, not his current Barcelona one, and THEN that id renders
under a wrong label. Two independent faults on one field.

- [ ] **Re-pull the club field with a P31 class filter** ([[reference_wikidata_traps]]),
      then restore `club` to the reveal. The guess subtitle still shows `club`
      and still carries the defect — a lesser harm (a hint beside a name you
      chose, not the app asserting a fact) but the same data.

### 🔍 PLUGIN AUDIT SWEEP 2026-08-17 (Alex asked; chrome-devtools MCP)
Ran the tools rather than hand-rolling — [[feedback_check_tools_first]].

**Lighthouse, mobile, PRODUCTION:**

    /quiz/arsenal/   A11y 100 · BestPractices 100 · SEO 100 · Agentic 100   52 passed, 0 failed
    /play            A11y 100 · BestPractices 100 · SEO  92 · Agentic 100   38 passed, 1 failed

⚠️ **The single failure is a DELIBERATE choice, not a defect.** `canonical` scores
0 because `/play` canonicals to `https://balliq.app/` and Lighthouse's heuristic
is "points to the domain root instead of an equivalent page". That canonical is
what stops **86 distinct `/play?club=<slug>` URLs** — club pages emit 7 each —
being indexed as duplicates of the app shell. Leave it. Do not "fix" this.

**Performance trace, /play (Lighthouse excludes perf):**

    unthrottled, warm   LCP   401 ms · TTFB 135 ms · render delay   266 ms · CLS 0.00
    4x/Slow4G,   warm   LCP   840 ms · TTFB  56 ms · render delay   784 ms · CLS 0.00
    4x/Slow4G,   COLD   LCP 4,014 ms · TTFB 135 ms · render delay 3,879 ms · CLS 0.00

🔴 **COLD START IS 4.8× THE WARM NUMBER AND SITS ON GOOGLE'S "POOR" BOUNDARY
(4,000 ms).** Measured in an isolated browser context — no service worker, no
HTTP cache, no storage — i.e. an actual first-time visitor on a mid-range phone.

⚠️ **The LCP element is `DIV.onboard-body` — the ONBOARDING screen.** The first
thing a new user ever sees is the slowest thing in the app, and it is plain text
that fetches nothing. **96.6% of the 4 seconds is render delay**: JS parse and
execute before onboarding can paint. TTFB is 135 ms, so the server is blameless.

This lands squarely on ACTIVATION — the 51%-ever-played number — and therefore
on the one metric this release is judged by.

⚠️ **I GOT THIS WRONG FIRST.** From the warm trace I wrote that the case for
[[post_launch_appinner_extraction]] was "weaker than the memory implies". The
opposite is true: the memory's ~1100 ms estimate was for cold Login starts, and
cold is exactly the case I had not measured. **A warm trace cannot answer a
cold-start question**, and every trace taken in a browser you have already been
using is warm unless you force otherwise.

- [x] Cold-start perf measurement — DONE 2026-08-17, and it inverted the answer.
- [x] ~~Extract AppInner + React.lazy()~~ — **INVESTIGATED AND REJECTED
      2026-08-17. Do not do this.** The split it proposed already shipped, done
      another way: `main.jsx` lazy-loads GameRoot and eagerly warms it, and
      App.jsx already lazy-loads seven screens. And it would make the measured
      problem WORSE — onboarding renders INSIDE AppInner (App.jsx:10601), so
      moving AppInner to its own chunk adds a round trip in front of the very
      element being measured. Sizes settle it (gzip): GameRoot, the WHOLE game
      tree, is **144k**; questions is 664k, playerSearch 361k, MysteryPlayer
      255k — all already separate on-demand chunks. There is no monolith left to
      peel. Memory superseded so it cannot mislead again.
- [x] **The cold-start thread — INVESTIGATED AND CLOSED 2026-08-17. It is not
      the activation win it looked like.** Three things, each checked:
      1. ⚠️ **The user does NOT see a blank screen for 4 seconds.** `.biq-splash`
         markup AND its CSS are inline in the served HTML (verified on prod), so
         it paints at HTML-parse time — roughly TTFB + parse. The 4,014 ms LCP
         measures when the largest TEXT block (onboarding) arrives, not when the
         screen stops being blank. Real, but far less severe than "4s of white".
      2. ⚠️ **Rendering onboarding statically has a UX trap.** It would paint in
         ~300 ms — but its buttons would be dead until React boots. Interactive-
         looking UI that ignores taps is worse than a splash that plainly says
         loading. Do not do this without solving the dead-tap window.
      3. ⚠️ **Deferring supabase (55k, genuinely on the cold path via
         `useAuth.jsx` → GameRoot) COLLIDES WITH AN EXISTING FIX.** AppGate holds
         the splash until `authProfile` loads on purpose — Sprint #62 fix 3 —
         because otherwise signing in flashes OnboardingScreen at an existing
         user. Some of the splash duration is deliberate. Making auth RESOLVE
         faster is fair game; deferring it reintroduces a fixed bug.
      **Verdict: the remaining levers are small and each has a guard-rail reason
      behind it. Activation effort is better spent on A3 and on Classic +
      Survival than on shaving this.** Revisit only if cold LCP crosses 4,000 ms
      or CrUX field data (currently none for this page) says real users suffer.

**Verified in passing:** the only third parties on /play are Clarity (1.7 kB,
17 ms) and Sentry (20 B). **No AdSense** — task #73's parking is real, which
matters because the native privacy declaration asserts no ads.

**Could NOT run today:**
- **Semgrep** — needs an interactive login this session cannot perform, AND the
  MCP only FETCHES findings from previous platform scans; Ball IQ has never been
  scanned, so there is nothing to fetch. Set up a scan first.
- Most other plugin MCPs need OAuth (github, datadog, ahrefs, nimble, amplitude,
  linear, notion, slack, figma, intercom…). The GSC connector also lost
  entitlement — see [[reference_gsc_property]].

- [ ] **Cold-start perf measurement** with cache disabled — the only performance
      number that bears on activation, and the only one not yet taken.

### ⚠️ Where the untapped potential actually is
- **Classic and Survival.** Third of all play, zero design investment. Item 2.
- **The bank is our biggest asset and our least-used one.** 6,694 verified
  questions; all 72 club quizzes drew ~50 plays in 30 days. The club *pages* work
  as an SEO asset — the in-app club picker is not where players go. Don't confuse
  the two, and don't answer this by writing more questions.
- **Eight languages of pages shipped in two days are unmeasured.** They are a
  tap, not a bucket fix. L5 tells us if they pay.

### ⚠️ Honest note on the last two days
I spent them on the localisation layer — which is the SIGNUP tap — while the
agreed plan says retention is the constraint. The work is good and the pages are
live, but it was not what the one number called for. Today's list corrects that.

### ✅ Corrections made this morning
- `v1_5_streak_grace_shield.sql` is marked "NOT YET APPLIED" further down. **It IS
  applied** — 19 users carry `graceGrantedAt`. ⚠️ 13 users are now streak-3+ and
  ungranted, and that is CORRECT: they earned those streaks under the new
  completion-based rule and need no soft landing. **Re-running it today would be
  actively wrong.**
- My first probe for that migration looked for a `shield` COLUMN and returned
  false. Shields live in `user_game_state.login_streak` JSONB. Wrong probe, right
  answer only after checking a second way.

## ▶ THE UPGRADE (agreed 2026-08-14) — judged on ONE number

Full write-up: https://claude.ai/code/artifact/c3d0ebd5-12e2-4016-9510-39cd976029eb

**Measured tonight, prod Postgres.** 169 users, 111 of them new in the last 30
days. Daily players: 13-17, flat for three weeks. Each new cohort is replacing
the one that churned. 45-day cohort n=142: 51% ever played, 31% played 2+ days,
22% played in the last 7. So the release is judged on **D7 return**, not on
contents — and more pages/packs pour faster into a bucket leaking at the same
rate.

**Play by mode, 30d** (scores.game_mode): footle 228/49 · daily 222/45 ·
**classic 182/39** · **survival 137/29** · trail 31/12 · chaos 25 · wc2026 23 ·
legends 21 · hotstreak 20 · league:PL 12 · **all 72 club quizzes 46 across 13
clubs** · mystery 0 (nothing was listening — fixed).
Alex's ranking put Trail 3rd; the data puts it 5th, 7x below Daily 7. Classic and
Survival carry a third of all play, cost nothing to feed, and have never had a
design pass.

### A — plug the bucket (this release)
- [x] **A0. One streak, and it counts PLAYING.** DONE (66c9a9e). The machinery
      was already good; only the trigger was wrong. `tickLoginStreak` now fires
      from `biq:daily-completed` (all four modes dispatch it) instead of on
      AppInner mount + day rollover. Daily renders the same server-side
      loginStreak Home does. Ticks on ANY completion, win or loss — Wordle
      breaks on a loss and NYT lost 5.6M streaks to one hard word; we can't
      administer that fairly across an uneven bank. Removed the pendingTick
      deferred-credit machinery and its 3 global listeners with it.
      Verified on device: both flames read 1.
      ✅ **`supabase/migrations/v1_5_streak_grace_shield.sql` IS APPLIED** (verified 2026-08-17: 19 users carry `graceGrantedAt`; do NOT re-run — see today's agenda). Original note kept below for context:
      ⚠️ was: NOT YET APPLIED —
      apply it the same day this ships. Grants 1 shield to the 31 users on a
      streak of 3+ (longest 50) so the first open-but-don't-play day is absorbed.
      Alex chose this over recomputing, which would have cut streaks overnight.
- [x] **A1. The reminder — DONE for web** (b6a79a7, 145298d, e922764).
      ⚠️ CORRECTION to the premise: the NATIVE reminder already existed and is
      good (7pm local, only if unplayed, cancelled on play, rolling 7-day
      window, weekday-rotating copy, win-back tail at +8/11/15/22/30). The gap
      was WEB only. Now closed: subscriptions table + RLS, send-web-push edge
      function, SW push/notificationclick/pushsubscriptionchange handlers
      (CACHE_VERSION v10), Settings opt-in, and an hourly cron that fires at
      7pm in each subscriber's OWN timezone. Verified on prod.
      ⚠️ NOT LIVE UNTIL `main` IS PUSHED — Vercel picks up VITE_VAPID_PUBLIC_KEY
      on the next deploy only.
      REMAINING (separate): Android REMOTE push (friend requests / MP invites)
      is still dead — that is social, not the daily loop.
- [x] **A2. One-day archive** — DONE (66f5634, 9a7f4dc). Yesterday's unplayed
      cells in Recent Days are replay controls. VERIFIED end-to-end: tapping
      Trail opened #11 (Ajax→Tottenham = Eriksen, yesterday) not #12 (Valverde,
      today); solving it fired NO completion event, left the streak at 1, and
      saved under yesterday's key.
      ⚠️ ARCHIVE PLAYS MUST NEVER TICK THE STREAK. The Trail already took a date
      but announced completion whichever day it was — replaying would have
      ticked today's streak and made it farmable, undoing A0. Guarded in all
      three modes.

### ⚠️ POST-DEPLOY: "VERIFIED" MEANS THE PAGE RENDERED
2026-08-14: balliq.app/play served the error boundary to every visitor for ~40
minutes (commit e922764). A `const` referenced above its declaration in a
useCallback dep array = TDZ, so AppInner threw on every render.
Build green. ESLint green. 131 tests green. Deploy "verified" — right sha, right
sw version, env var in the bundle, data fix confirmed. ALL of those inspected
ARTEFACTS; none rendered the app.
- [x] `scripts/smoke-prod.mjs` — checks sha/chunk/sw AND prints, in caps, that it
      does not prove the app renders.
- [x] **Standing step (now habitual): after every push to main, OPEN
      https://balliq.app/play and read the text.** A question = fine. "Something
      went wrong" = broken, however many ticks the tooling printed. Done for
      1c13048 — rendered Home + Daily row before calling it verified.
- [x] **A3. Somewhere to go after a finished day — DONE 2026-08-17.** A
      `DayComplete` panel renders on the Daily tab the moment every live mode is
      played, at both breakpoints, from one component. Two states, both of which
      launch real playable content rather than describing it:
      - **Yesterday still open** → one tinted replay button per unplayed mode.
        Derived by `yesterdayOpen()` from the SAME predicates the Recent-days
        table uses to turn a cell into a control, *including* the
        `playArchive`/`playDailyForDate` presence checks — so the panel can never
        offer a launch the row right below it renders as an inert score cell.
      - **Yesterday also done** → Survival. Picked because it needs no difficulty
        picker (Classic's lives inside HomeScreen), no account, and never runs
        out.
      Verified by exercising, not by reading the diff: seeded a complete day in
      localStorage, confirmed the panel's four buttons match the Yesterday row's
      four ↺ cells exactly, then clicked through — Survival opened a live quiz,
      and "yesterday's Trail" opened Trail #14 unsolved with 5 left while today's
      seeded Trail was won in 2, which proves it opened the ARCHIVE board and not
      today's. Desktop confirmed as exactly one visible instance at 1280.
      ⚠️ **Found while building, NOT fixed — the deep archive is one gate away
      but must not be opened yet.** `playArchive(mode, date)` already accepts an
      arbitrary date and all three puzzle screens honour it, so a 30-day
      back-catalogue is a one-line change to the `m.isYesterday` condition. Do
      not make it: `form14` and the local streak walk both derive "played" from
      history with no live-vs-archive distinction, so back-filling an older day
      would silently repaint the form strip green and extend a guest's streak.
      Signed-in users would see it worse, not better — `tickLoginStreak` is
      already gated to non-archive plays, so the server flame would stay put
      while the strip beneath it filled in, and the two would visibly disagree.
      Fix is to record the distinction at write time (an `archive: true` flag on
      the saved record) before any date older than yesterday becomes reachable.
- [x] **A4. Guest dead-ends — ALREADY FIXED, premise was stale (2026-08-14).**
      Walked it as a wiped first-time visitor rather than reading the board.
      Online shows a "You vs ?" empty-state hero, "No matches yet — win one and
      your record starts here", a signup CTA, join-by-code AND local pass-and-play.
      Daily shows all four Play buttons. Profile shows the sign-in CTA + sample
      card. No dead end anywhere; the activation wave had already closed it.
      Residual (cosmetic only, NOT a dead end): ~200px of empty space below
      "Local pass & play" on Online at 375pt.
      ⚠️ ALSO STALE: `/play?club=` was listed as unbuilt in
      project_elevation_roadmap. It WORKS — /play?club=arsenal lands directly on
      Arsenal Q1 of 10, no picker. Club pages already emit that link 6x per page.
      So the "club picker placement" experiment I proposed is ALSO already done.
- [ ] **A5. Second audit pass on STATES, not screens** — guest/signed-in, empty/
      full, mid-game, offline, error, PWA-standalone mirror. Three of today's four
      bugs were state bugs. ~2 days.

### ✅ RESOLVED — iOS push WAS dead. Four stacked faults, all fixed 2026-08-14
`send-push` went **500 → 200**; Apple went **403 InvalidProviderToken → 200**.
1. `service_role` had no SELECT on `device_tokens` — every lookup failed.
2. The `notifications` type CHECK rejected `daily_reminder` — this would ALSO
   have killed the new web-reminder cron, silently, every hour.
3. `APNS_KEY_P8` held **28 characters** instead of a 257-char private key.
4. All five APNs secrets carried trailing `\n` → Apple rejected the JWT `kid`/`iss`.
Fix any three and you still get nothing, which is why it survived months of
"push is dead, must be Android".
⚠️ Alex's remaining token (registered 20 Jul) is from an older install: Apple
returns 200 but no banner. Self-resolves on the next fresh install — no code
change. `send-push` correctly auto-pruned his other dead token.
⚠️ `diag-service-role` is a 410 tombstone — DELETE it from the dashboard.
LESSON: `send-push` already documented the trailing-newline hazard and guarded
ONE variable against it. Write a hazard down, then apply it to every instance of
the class, not the one that bit you.

### (superseded) SUSPECTED LIVE DEFECT — iOS push may be dead too
`has_table_privilege('service_role','public.device_tokens','SELECT')` returns
**false**, and send-push reads that table as service_role. 31 device tokens are
registered and the trigger is enabled. If it reads the way it looks, every APNs
push has been failing at the lookup step — not just Android. Only 6 notifications
exist in 30 days, so there was almost nothing to notice.
NOT yet changed: confirm against a real send first, in case the model of how
PostgREST resolves the service key is wrong. Same class as the bug found in our
OWN new table, which is what surfaced it.

### B — gates, not fixes (the flawless-feel work)
Today's four defects were one shape: two places holding one truth, nothing
checking. The gates that exist (distractor, open-claims, SERP, bundle ceiling)
have never had a recurrence. Extend the pattern:
- [x] Mystery schedule gate — banned names, 5% manager ration, id resolution,
      back-to-back. `scripts/audit-mystery-schedule.mjs`, in the build chain.
- [x] ~~Every mode awards XP and writes a scores row (Mystery shipped without both).~~
      **STALE — verified 2026-08-24.** Mystery does both: `awardXp(tries <= 5 ?
      50 : ...)` and a `game_mode: 'mystery'` row via saveScore. Closed by
      `de1a475` and never ticked.
- [x] ~~Cross-screen counter agreement (Home said 0/2 while Daily said 0/4).~~
      **STALE — verified fixed 2026-08-24.** Driven live: Home reads "1/4
      today", the Daily screen reads "1 of 4 played". They agree.
- [x] **Standalone CSS mirror parity — SOLVED STRUCTURALLY 2026-08-15 (dcdc781).**
      Not a parity checker: the mirror is now width-gated to `(min-width:1024px)`,
      which is the only width it was ever for. Below 1024 a phone PWA inherits
      mobile web, so the two cannot drift. Found via A5: `.t7s-icon` had been
      frozen at the pre-2026-07-07 32px for five weeks on every installed PWA.
      Phone-needed rules (.tab-bar, Android floor, tuck, .tab-pill, .tab-content
      safe-area) deliberately stay outside the gate.

### C — taps back on, AFTER A holds
- [ ] **C1. Execute the authority kit** — written, untouched. "football quiz" at
      position 41; ceiling is authority, fundamentals diagnosed clean 3x. STOP
      re-auditing. ⚠️ ALEX-ONLY.
- [x] **C2. DONE 2026-08-15: /lists diagnosed — and the 08-03 read CORRECTED.**
      28-day GSC: 47.1% of impressions, 4.0% of clicks, CTR 0.15%, avg pos 25.8.
      ⚠️ **Position is NOT the explanation.** At matched rank bands /lists still
      loses 18× — p2 (11-20) converts at **0.12%** across 17 pages and 7,297
      impressions, vs 2.16% for /quiz/ in the same band. So the 08-03 prediction
      ("if position moves 27→15 this becomes the biggest traffic source
      overnight") is falsified by our own data: the pages already AT 11-20
      convert at 0.12%. **/lists is not a traffic asset waiting on authority.**
      The 6 pages that DO reach page 1 are all second-tier — Süper Lig top
      scorers, Copa Libertadores, EFL Cup, Eredivisie, Primeira Liga — exactly
      the "Brentford not Man Utd" thesis. The head-term pages the strategy said
      to avoid got shipped anyway: `premier-league-champions` (pos 50.8, 1,671
      impr, **0 clicks**), `serie-a-top-scorers` (35.9), `ballon-dor-winners`
      (21.1) — **4,682 impressions → 4 clicks.**
      Ruled out on the way: the taster is NOT the cause. /lists pages do carry a
      playable taster (5 questions vs 42-67 on club pages), but taster depth
      moves dwell AFTER the click, never CTR from the SERP. ⚠️ The first three
      grep markers I tried (`seo-q`, `taster`, `biq-taster`) returned 0 on a
      known-playable club page too — the real marker is `data-a=`.
      ✅ **CONFIRMED same day by reading the actual SERP** (google.com/search,
      gl=gb, "premier league champions"): featured snippet **+** carousel **+**
      People Also Ask, and the first organic result begins **492px down a 992px
      viewport** — half the screen is Google's own answer. The #1 organic is
      Wikipedia, already summarised in the snippet ("Current champions Arsenal").
      So the residual same-rank gap is real and structural: on head reference
      terms the click is gone before rank matters. Ranking 5th would not fix it.
      **Decision this forces:** no more head-term lists. Niche-only, or stop.
      The niche winners work precisely because Google has no answer box for
      "Primeira Liga top scorers" — check the SERP before commissioning a list.
- [x] **C3. DONE 2026-08-14: 1.6.0 cut on both platforms.** iOS 1.6.0 (62)
      uploaded to TestFlight by Alex. Android 1.6.0 / vc17 AAB built, NOT
      uploaded — Alex's call. ⚠️ Build 61 was archived 2 min BEFORE the offline
      auth fix landed and is poisoned; do not promote it.

## 🌍 LOCALISATION LAYER — the tracked list (opened 2026-08-15)

Alex: *"I really want to squeeze out ALL the untapped potential on this
localisation thing... let us not do it half-assed."* This is that list. Tick as
they land.

### What is TRUE today — measured, not assumed
- **16 localised pages exist**, all club pages: **es 10 · pt 3 · id 2 · tr 1**.
- **hreflang IS already wired** (`en` / `es` / `x-default`). The hard part is done.
- **There is NO localised hub in any language.** Nothing targets the head term
  "quiz de fútbol", "futbol quiz", "quiz di calcio", "fußball quiz".
- **86 English club packs** exist to translate from.

### The demand, from GSC (28 days)
- **"soccer": 17 impressions, 0 clicks** across 1,000 queries — and every one is a
  `/lists/` reference query. **We are invisible on "soccer quiz".**
- Where we HAVE built: `quiz de river plate` **pos 8.6**, `quiz del barcelona` **6.6**.
- Demand in languages with **NO pages at all**: `quiz calcio serie a` **22.8**,
  `fußball quiz bundesliga` **49** — English pages limping into foreign SERPs.

### ⚠️ THE RULE THAT SIZES EVERYTHING
A localised club page is **NOT a template fill**. It carries ~10 HAND-TRANSLATED
taster questions, each referencing the English question id it came from, and
`gen-seo-pages.mjs` throws if an id stops resolving. So:

- **Translating an existing pack** = cheap, do lots.
- **A market with no English pack** = forge the pack FIRST (see the SEO-wave
  skill), then translate. Roughly 5× the work.

---

### L0 · FOUNDATION — do first, it unblocks the head terms
- [x] **Localised hub per language** — SHIPPED 5379f9f: `/es/quiz/`, `/pt/quiz/`,
      `/tr/quiz/`, `/id/quiz/`. Playable taster, fully localised chrome.
      ⚠️ `/it/`, `/de/`, `/fr/` are NOT missed — a hub ships WITH its club wave in
      L1. A head-term page with nothing beneath it is the `/lists` mistake.
- [x] Extend `hreflang` to every new locale + keep `x-default` on English —
      reciprocal in BOTH directions (Google discards non-reciprocal clusters).
- [x] New locales into `buildSitemap` (priority 0.8) + auto-IndexNow —
      `pingIndexNow(sitemapUrls)` covers them on the next Vercel prod build.
- [ ] Footer/lang switcher so the locales are crawlable from each other.
      ⚠️ NOT DONE. Today the only visible cross-language link is localised→English
      ("La misma página en inglés"); English→localised is hreflang only. Do this
      when there are enough locales for a switcher to be worth the footer space.

### L1 · NEW LANGUAGES — packs already exist, demand already proven
- [x] **Italian `/it/` — WAVE 1 SHIPPED 2026-08-16 (ba09dfe)**: `/it/quiz/` hub +
      **juventus, inter-milan, ac-milan** (66 hand-translated questions). Juve/
      Inter/Milan chosen together because they carry both defining derbies, so
      the cluster is coherent from day one.
- [x] **Italian wave 2 SHIPPED 2026-08-16 (27396cd)** — napoli + roma. `/it/` is
      now 5 clubs + hub, 110 translated questions.
- [x] **Italian wave 3 SHIPPED 2026-08-16 (f4c4568)** — lazio, fiorentina,
      atalanta. **ITALIAN IS COMPLETE**: 8 clubs, 176 questions, + hub.
      ⚠️ TRANSLATION TRAPS, both now pre-flighted by the scan:
      · PRESERVE OPTION ORDER — the build checks the answer INDEX, not the text.
      · Any translated proper noun in the ANSWER slot needs an `en` field
        (Barcellona→Barcelona, Coppa UEFA→UEFA Cup, Quattro→Four). Wave 1 hit
        six of these; wave 2 hit zero because they were applied up front.
- [x] **German `/de/` SHIPPED 2026-08-16 (b086888)** — hub + bayern-munich,
      borussia-dortmund, bayer-leverkusen. 66 questions.
      ⚠️ **RB LEIPZIG HELD** — only 20 verified questions vs the 22 a full page
      needs. Forge a top-up first; do not pad or ship thin.
      ⚠️ German needed **11** `en` tripwires to Italian's 8 — it translates proper
      nouns English leaves alone (Bayern München, Juventus Turin, Atalanta
      Bergamo, Berbatow). And German compounds blow the 160-char meta limit.
- [x] **French `/fr/` SHIPPED 2026-08-16 (9505d0f)** — hub + psg, marseille,
      lyon, monaco. 88 questions, all four clubs.
      ⚠️ The bank keys these as **"Olympique Lyonnais"** and **"AS Monaco"**,
      while the page slugs are `lyon` and `monaco`. A short-name inventory query
      returns ZERO for both. Sixth firing of the long-name trap.

### L2 · DEEPEN THE LANGUAGES WE ALREADY HAVE
- [ ] **Turkish +3** — fenerbahce, besiktas, trabzonspor. Galatasaray alone is
      absurd; Süper Lig top-scorers is one of only six `/lists/` pages on page 1.
- [ ] **Portuguese +4** — benfica, porto, sporting-cp (Portugal, currently zero)
      and santos (Brazil).
- [ ] **Spanish** — 10 live; audit which are missing vs the La Liga packs.

### L3 · MARKETS THAT NEED A PACK FORGED FIRST (~5× the work)
- [ ] **Liga MX** — Alex asked for this explicitly. **Zero packs exist**:
      club-america, chivas, cruz-azul, pumas, monterrey, tigres. Forge → verify →
      translate. Biggest Spanish-speaking football market we do not serve.
- [ ] **More Brasileirão** — sao-paulo, gremio, internacional, cruzeiro,
      atletico-mineiro, vasco-da-gama, botafogo, fluminense. All packless.
- [ ] **Arabic `/ar/`** — al-hilal, al-nassr, al-ahly, zamalek. All packless.
      Huge market; also the App Store locale flagged lowest-confidence, so get a
      native read on the copy either way.

### L4 · BEYOND CLUB PAGES
- [ ] Localised Footle / Transfer Trail / Mystery Player landing pages —
      currently English-only, and they are the modes that hold attention.
- [ ] Decide `/es/` vs `/es-mx/` split. One `/es/` serving Spain AND Mexico is the
      cheap start; hreflang supports region targeting if the data justifies it.

### ⭐ ALEX'S TARGET: page 1 for every big club in the world, biggest first
*"I would really love to rank on the first page for clubs like real madrid and
barcelona with enormous fanbases."* … *"it would be amazing if we started
ranking top 5 for liverpool and manchester united for example, that would be a
gamechanger."* … *"we should probably start from the top, the clubs with the
biggest fanbases."* (2026-08-16)

⚠️ **THIS IS NOT A COVERAGE PROBLEM — DO NOT ANSWER IT BY BUILDING PAGES.**
Checked 2026-08-16: **all 27 mega-clubs already have an English page** (Real
Madrid, Barcelona, Man Utd, Liverpool, Bayern, PSG, Man City, Chelsea, Arsenal,
Juventus, both Milans, Dortmund, Atlético, Spurs, Flamengo, Corinthians, Boca,
River, Galatasaray, Fenerbahçe, Beşiktaş, Benfica, Porto, Ajax, Celtic,
Rangers). 86 club pages exist. Every one of these targets is a page we ALREADY
HAVE that does not rank well enough.

So the lever is **authority and competition**, which is exactly what
[[project_football_quiz_head_term]] and the 2026-07-28 ranking diagnosis both
concluded: *fundamentals are clean, stop re-auditing them, the ceiling is
authority.* Writing another club page does nothing for this goal.

The three levers that actually apply, in order of how much is already built:
1. **Localisation** — a different, far less contested SERP for the same club.
   Proven: `quiz del barcelona` 6.6 vs English fighting Sporcle/Quizlet.
2. **The authority kit** (task #51, Alex-executable) — directory submissions and
   outreach. Untouched, and it is the named lever for page-2 pages.
3. **Internal link weight** — orphan gate landed 2026-08-16; big-club pages
   should be the ones the mesh points AT, not just from.

#### 🔬 PAGE-LEVEL DIAGNOSIS 2026-08-17 — Alex asked whether the PAGES are the problem
They are not. Our own club pages, question depth vs measured position:

    rangers            48 Qs → 5.7        real madrid  42 → 10.5
    everton            45    → 6.7        juventus     42 → 10.7
    celtic             49    → 6.7        newcastle    39 → 14.5
    bayern munich      43    → 7.7        barcelona    42 → 14.9
    arsenal            67    → 7.9        man utd      42 → 24.4
    chelsea            42    → 9.5        liverpool    42 → 27.7

**Depth is FLAT (39-49) while position spans 5.7 to 27.7.** Rangers and Liverpool
carry the same content and sit 22 places apart. Arsenal has the MOST questions of
any club (67) and still ranks below Rangers. Position tracks club FAME, inversely
and almost perfectly. So writing more questions for Real Madrid will not move
Real Madrid, and neither will another page rewrite — the Arsenal page already
carries the modifier, the alias, a freshness signal, 100%-explained and a
playable taster, and its CTR is normal for its slot.

⚠️ **But this is NOT "nothing to do", and it is not only the authority kit.**
The bare head terms are lost; the QUALIFIED ones are already won or nearly:

    liverpool quiz               27.7   ·  liverpool quiz with answers      6.5
    manchester united quiz       24.4   ·  man utd quiz with answers       10.4

- [ ] **Target the qualified terms deliberately for the mega-clubs.** That is a
      page-level lever that does NOT need authority, and it is where the big
      clubs are actually winnable. Titles already say "with Answers"; the work is
      making the qualified variants (hard/easy/questions-and-answers/2026) first-
      class rather than incidental. Measure per-term before and after.
⚠️ Do not read this as licence to write more questions. Depth is not the variable.

#### ⚠️ MEASURED 2026-08-16 (GSC, 90 days, web) — WE ARE MUCH CLOSER THAN ASSUMED
Read in the browser because the connector lost entitlement. Site totals: **809
clicks, 42k impressions, avg position 17.4**.

**Already page 1 on club terms** — this is the surprise:

| query | pos | impr |
|---|---|---|
| tottenham quiz with answers | **5.0** | 38 |
| rangers quiz with answers | **5.1** | 20 |
| chelsea quiz with answers | **5.3** | 58 |
| rangers quiz | **5.7** | 103 |
| newcastle united quiz with answers | **5.9** | 20 |
| man city quiz with answers | **6.3** | 35 |
| **liverpool quiz with answers** | **6.5** | 90 |
| liverpool fc quiz with answers | **6.5** | 39 |
| quiz del barcelona | **6.6** | 7 |
| everton quiz | **6.7** | 157 |
| bayern munich quiz | **7.7** | 50 |
| **arsenal quiz** | **7.9** | **1,081** |

**⚠️ THE PATTERN: we win on "with answers", we lose on the bare head term.**
- `liverpool quiz with answers` **6.5** vs `liverpool quiz` **27.7**
- `manchester united quiz with answers` **10.4** vs `manchester united quiz` **24.4**

That is the same modifier finding as [[project_gsc_7day_2026_08_09]] ("with
answers" beats "trivia" 6.6×), now confirmed at club level. **Alex's Liverpool
top-5 goal is ALREADY 6.5 on the modifier term** — the gap is the bare term.

**The highest-value moves, by impressions actually available:**
- [ ] **`arsenal quiz` — 1,081 impressions at 7.9.** Ten times the impression
      pool of anything else on the list. Moving 7.9 → top 3 is the single
      biggest click win available anywhere on the site.
      **INVESTIGATED 2026-08-16 — the page is NOT the problem.** SERP check
      (via Bing; Google CAPTCHA-gates automated queries): competitors are
      Sporcle, arsenal.com ×2, FourFourTwo, PlanetFootball, JetPunk,
      footballtrivia.co.uk, ultimatequizquestions.com. **No answer box** — so
      unlike the `/lists` head terms, position gains here DO pay.
      Our page already has: "with Answers" + the Gunners alias in the title, a
      2025-26 freshness signal in the meta, 100%-explained, a playable taster
      above the fold, daily question rotation. CTR 2.6% at position 7.9 is
      normal for that slot, so there is no CTR anomaly to fix either.
      ⚠️ **Do not invent a page-level fix for a page that is already good.** The
      remaining gap against Sporcle and the club's own site is domain authority
      — which points at task #51, the AUTHORITY KIT, still untouched and
      Alex-executable. That is the honest answer, and it is the same conclusion
      as [[project_ranking_diagnosis_2026_07_28]].
      Shipped anyway from this investigation: 8.8 KB of CSS comments removed
      from `<head>` on every page (7f3fbfa) — a real page-speed win, not a
      claimed ranking fix.
- [ ] **`real madrid quiz` — 192 impr at 10.5.** Literally one position off page
      one. Same for `man city quiz` (147 @ 9.9) and `chelsea quiz` (143 @ 9.5).
      Three pages sitting at the page-1 boundary.
- [ ] `barcelona quiz` 14.9 (87 impr) and `barca quiz` 15.3 — Barça is the
      weakest of the mega-clubs in English, while `quiz del barcelona` is 6.6 in
      Spanish. Strongest evidence for the localisation thesis on this page.
- [ ] `football quiz` **38.4** — the north star ([[project_football_quiz_head_term]]),
      still page 4. Unchanged conclusion: authority, not pages.
      ⚠️ **CANNIBALISATION FOUND AND FIXED 2026-08-16.** Two self-canonical
      pages both led their <title> with "Football Quiz". Measured, exact query,
      90 days: `/quiz/` 87 impressions @ **39.0**; `/football-quiz/` **2
      impressions @ 9.0** (5 impressions and 0 clicks across ALL its queries).
      `/football-quiz/` now canonicals to `/quiz/` and is out of the sitemap —
      it still builds, is still in the nav, still serves visitors.
      `/daily-football-quiz/` checked and left alone: distinct query, distinct
      intent, its own feature.
      ⚠️ **The 7-day "position 9" was an artifact** — a different page's entire
      90-day history landing inside the window. Real position is 39. When
      impressions and position disagree, trust the impression count.

⚠️ **I told Alex earlier that the English mega-terms were "the hardest thing on
this list". That was wrong and the data corrected it** — we are top-10 on
several already. The honest version: the *bare* head terms are hard; the
qualified ones are nearly won. Target the boundary pages, not the impossible ones.

⚠️ **The shortest path is SPANISH, not English, and it is already most of the
way there.** As of the 2026-08-08 read (8 days old — re-measure): `quiz del
barcelona` sat at **position 6.6**, i.e. already page 1, while the English
`/quiz/barcelona/` page competes with Sporcle, Quizlet and the club's own site
for `barcelona quiz`. Same club, same content, wildly different competition.

- [ ] **Re-measure first** — the GSC connector lost entitlement 2026-08-16
      (`sc_query_performance`, `sc_top_pages`, `sc_inspect_url` all refuse). Read
      it in the browser, or restore the connector. Do not plan off the 08-08 read.
- [ ] `/es/` pages for the big three ALREADY EXIST (real-madrid, barcelona,
      atletico-madrid) and got their first English inbound link on 2026-08-16.
      The next lever for them is **LaLiga depth** — more Spanish club pages make
      the `/es/` cluster heavier, which is what lifts the big three.
- [ ] ⚠️ **Do not read this as "English is hopeless".** It is a competition
      argument, not a language one. Check the actual SERP per term before
      committing — the `/lists` lesson.

### L5 · MEASURE — do not skip, this is how we avoid a second /lists
- [x] **Orphan check is now a BUILD GATE** (`scripts/audit-orphan-pages.mjs`,
      48a567c) — every sitemap page must have an inbound internal link. Caught
      that all 20 localised pages had none. Third time this defect shipped.
- [ ] Per-locale GSC read 3–4 weeks after each wave: impressions, clicks, **and
      position**, split by locale.
- [ ] ⚠️ Apply the `/lists` lesson: **check the SERP before committing to a term.**
      If Google answers it above the fold, the page cannot pay at any rank.

### ⚠️ Two traps carried over
- **Localisation is NOT automatic per market.** Our US read killed the soccer
  layer thesis once already (`project_us_egypt_gsc_2026_07_29`) — "ball IQ" is
  basketball jargon there. Egypt was 100% brand. Build where DEMAND is measured,
  not where a language is spoken.
- **`clubs.mjs` long names vs `leagues.mjs` short names** — join via
  `club-alias.mjs`. That has fired five times, once writing an entire pack for
  clubs already published.

### ⏰ EXPIRES MON 18 AUG — two free store levers, no binary needed
- [ ] **Play promotional content — Transfer Deadline Day (1 Sep).** Play needs
      14 days lead when "request featuring" is ticked. Console → Grow users →
      Store presence → Promotional content. Games qualify with no threshold.
- [ ] **Apple featuring nomination + In-App Event — UCL MD1 (8-10 Sep).** Apple's
      stated minimum lead is 3 weeks. ASC → app → Featuring → Nominations.
      IAE limits: 10 published at once, badges Competition / Challenge / New Season.
- ⚠️ **NAME THEM GENERICALLY.** We were already rejected under 5.2.1 for World Cup
      IP and event metadata goes through the same review. "Deadline Day Special",
      "Europe's Big Night" — NEVER "Champions League Week".

### ⚠️ FootyIQ ships a mode called "Footle" — ALEX'S CALL
App Store id6770499911, v1.4.0 (28 Jul 2026), dev Sina Zand, verbatim: *"Footle —
A word game for footballer surnames. Six guesses, colour clues after each one."*
Modes overlap almost completely; brand is confusable with Ball IQ. **We were first
and it is documented: commit 30590ba, 9 May 2026 — 80 days earlier.** Not yet
ranked, too few ratings to display. Decision needed on the mark and on how loudly
we claim the word in ASO. Verified directly from the listing, not from notes.

### CUT — declined on purpose
- ~~**Club pack waves.**~~ **STRUCK 2026-08-14 — Alex overruled with evidence.**
  Average GSC position has moved from the 20s to **10.6** and club pages are the
  signup funnel. Packs are ACQUISITION and were being judged by in-app plays,
  which is the wrong end of them. **Packs continue.** What the 46 plays/30d
  actually indicts is the in-app club PICKER — a placement problem: someone who
  installs off the Arsenal page should land on the Arsenal quiz, not a picker.
  Worth one experiment (~1 day).
- **Lineup Builder.** Needs drag-drop, real XI pre-fill, photo ranking, bench/kit
  before it earns a link — that is a product, not a task. Commit a fortnight or
  drop the entry point until after the release.
- **More SEO pages of any kind.** 302 indexed; another 100 does not change 41.
- **Desktop refresh remainder.** Friends has no CSS or JSX at all — ship a hidden
  state, not a half-built screen. Users are on phones.
- **Re-auditing SEO fundamentals.** Clean three times.

### Shipped 2026-08-14
- Daily tab carries all four daily puzzles + 4-column recent days (3772211)
- Home/Daily counters reconciled; counter routes to the Daily tab (9b701a2)
- `/lineup/` prose leak closed — it was linked from fun-facts despite the bar (c07d519)
- Mystery: banned-manager answer replaced + build gate; XP and scores wired (de1a475)
- iOS build 60 on the simulator, verified end-to-end

---

## ▶ WHERE WE ARE (2026-08-14)

⚠️ **THE 94.6% IS SUBSTANTIALLY AN INSTRUMENTATION ARTIFACT.** Re-measured today
against the same Clarity project, and the number that reprioritised everything
does not mean what the board says it means.

| measure (3 days, 2026-08-12→14) | reading |
|---|---|
| single-page sessions | 195 of 203 — 96.1%, i.e. *unchanged* |
| ...with an EXTERNAL referrer | **142** — genuine one-and-done arrivals |
| ...with an INTERNAL balliq.app referrer | **60 (30%)** — NOT arrivals. Continuations. |

**Clarity starts a NEW session on the club-page → /play navigation.** Two of five
sampled recordings are `/play` with `referrerUrl` of `/quiz/cruyff/` and
`/quiz/atletico-madrid/`, each recorded as `pagesCount: 1`. So a visitor who
reads a club page and then opens the app is counted as **two one-page sessions**,
and shows up twice in the "94.6% never go anywhere" figure.

Re-framed per *journey* rather than per Clarity session: ~142 externally-started
journeys produced ~60 internal continuations + 8 multi-page sessions. Onward
navigation is therefore roughly **40%, not 5.4%**.

⚠️ Caveat, stated rather than buried: some internal referrals will be returning
visitors on a later day, so 40% is an upper estimate as 5.4% was a lower one. The
honest claim is only that **the true rate sits far above 5.4%** and the premise
"they never see a second page" is not supported.

**What this does NOT overturn.** The club-page levers were still right, for a
reason the recordings show directly rather than infer:

- `/quiz/cruyff/` from Google — **6m40s, 94 clicks**: full round, "See your
  result →", then "Full set", then a SECOND round.
- `/quiz/cruyff/` from Google — **13m18s, 57 clicks**: read the explanations,
  used the length picker, kept going.

People are not bouncing off club pages. They are staying for six to thirteen
minutes and playing multiple rounds — which is what levers 1-3 were built to
reward. The rebuild is validated; the *justification* on the board was not.

**Consequence for prioritisation:** "optimising for onward navigation is
optimising for 5% of people" is retired. Both loops are real — staying on the
page AND crossing to the app — and `clubq-out-play` is now the number to watch
rather than a guardrail against a thing we assumed nobody did.

⚠️ **clubq-* still returns EMPTY via the Clarity API, one day on.** Verified live
that this is NOT our bug: the loader is present on club pages (tag
`xqwevk9brq`), the emit code is correct (`window.clarity('event',n)`), 12
`clubq-` occurrences are in the shipped HTML, and 9 distinct custom events is
well under Clarity's 20 cap. Custom API events appear to aggregate into the
"Other" bucket (75 over 7 days) rather than surfacing by name. **Lever 4 stays
gated, but on a reporting limitation, not on missing data.** Next step is to own
the measurement rather than fight Clarity's model.

---

## ▶ PREVIOUS (2026-08-13)

**THE FINDING THAT REPRIORITISES EVERYTHING.** Microsoft Clarity has been
connected for weeks and unused. Five queries answered the funnel question:

| measure | reading |
|---|---|
| organic search | **60%** of sessions (318 of 531) — SEO *is* the business |
| landing pages | club pages are **7 of the top 10** |
| **pages per session** | **488 of 516 sessions view exactly ONE page (94.6%)** |
| club page entry vs exit | identical: Liverpool 25/25, Arsenal 23/23, Chelsea 17/17 |
| referral traffic | **11 sessions in seven days** — the authority gap, quantified |

⚠️ **The club page IS the product for 95% of visitors.** They never see /play,
never see the app, never see a second page. Optimising for onward navigation is
optimising for 5% of people. **The club-page rebuild is now the highest-value
design work, ahead of the homepage.**

Acted on already: the result screen led with "Play the full quiz" (navigates
away) and capped "Keep going" at two rounds. Inverted — staying is now primary
and uncapped.

⚠️ **Treat 94.6% as a BEFORE reading.** "Next question →" was the most
dead-clicked element on those same pages until 2026-08-13; a progression control
that feels broken two questions in produces exactly this data. Re-read in a week.

**CLUB-PAGE REBUILD — STARTED. Lever 1 is LIVE.** The rebuild was chosen over
the 87th club page because more pages feed a funnel that ends on arrival.

⚠️ **First, the club quiz emitted NOTHING.** Clarity had been loaded on all 302
pages since the wave began and the quiz fired zero events — so "does anyone
finish a quiz" had no answer, and this morning's result-screen inversion
shipped with no way to tell if it worked. **Eleven signals now ship**
(`clubq-start/play/finish/rounds/score/more/again/share/out-play/out-store/len`),
verified by driving a real Chromium through a full round. `clubq-out-*` is the
guardrail: optimising for staying cannot quietly kill the app funnel unnoticed.

**Lever 1 (ca24f50): the order is re-derived per day.** 86 static URLs became 86
recurring ones. Server-rendered arc untouched (crawlable text, JS-off readers);
only the human's order changes, reshuffled per (club, day) with the arc
re-applied so it still opens easy. xorshift32, integer-only — same reason as
the Daily 7. Ribbon gated at 24+ questions, because below that a ten-question
round repeats most of itself and the claim would be false.

⚠️ **Defect found on the way:** "Keep going — 30 more" called `start(20)` and
`start` always filled from `qs[0]` — a reader who had just answered ten
questions **got those same ten again**. Fixed with an offset. Zero repeats now.

**Lever 2 — THE AUTHORITY LEVER (336bfbb): a score now shares as a score.**
The share control was a grey ghost button between two greens, and it shared
`location.href` — which unfurled the club's generic card, identical whether you
scored 2 or 10. Nothing in the preview was worth sending.
`/iq/<slug>.<iq>.<score>.<total>` is an edge-rendered card in the club's colour
carrying the number and the club's own word for it ("Kop Regular", not
"Level 3"). ⚠️ Humans who tap it land on the **club page, not /play** — every
other share loop opens the app, this one deliberately does not, because the club
page is the product for 94.6% of visitors and it can produce another share.
Verified live: valid token, malformed token degrading to the hub, and a crafted
colour param rejected at both hops.

**Lever 3 (336bfbb): the length picker no longer precedes the quiz.** It moved
to the result as "Change the length", and continues with NEW questions rather
than restarting.

**Lever 4 — DATA-GATED, and its content prerequisite is already met.** Measured
2026-08-13: the club-page mix is 24.2% easy / 48.4% medium / 27.3% hard against
an arc that wants ~20/53/27, and **zero clubs are skewed soft**. So no content
work is needed. What remains is purely behavioural — are the questions labelled
"hard" actually hard — and that needs `clubq-score`, which returned empty an
hour after shipping. ⚠️ **Re-query Clarity for clubq-* in ~2 weeks.** If most
finishes land in the top band, the fix is ordering, not new questions.

⚠️ **We cannot A/B test this.** At ~516 sessions/week any lift worth caring
about is inside the noise. Small numbers show gross failure only. The powered
measurement is GSC impressions + position across 302 pages, read monthly.

Design memo + playable prototype: claude.ai/code/artifact/c938b70a-d613-4ca2-89c1-1014145d38a1

---

**THE HEAD TERM FINALLY HAS A PAGE.** "football quiz" sits at position 39 with
~87 impressions, unchanged for weeks — and the thing competing for it was the
*homepage*: brand H1, phrase absent from the heading, 16 internal links. Every
site outranking us (PlanetFootball, FourFourTwo, BBC, JetPunk, Sporcle — read
off a live SERP) answers that query with an INDEX. `/football-quiz/` now exists:
phrase in URL/title/H1/body, 161 club links, **286 pages linking in**. Intent
mismatch, not an authority ceiling. Same move that took /lists/ to 51% of
impressions.

**TEN CLUB PAGES SHIPPED** — Southampton, Portsmouth, Birmingham City, Sheffield
Wednesday, Wrexham, Norwich City, Cardiff City, Stoke City, Derby County,
Swansea City. Picked by measured search demand (Google suggest harvest, 2,582
completions), written single-threaded so every fact was checked as it was set
down. **86 club pages, bank 6,687, 302 pages SERP-clean, all indexed + linked.**

**Also shipped:** `/club-nicknames/` (first Discover expansion — text-only, no
licensing exposure, no staleness); per-question **pips in the app**; the lineup
**dead-click fix**; three lineup geometry fixes (crop edge, crown clip 34%→0%,
body off-centre 24%→2%); "save as PDF" on 75 printable pages.

**GUARDS ADDED, each after a near-miss:**
- `build-mystery-pool.mjs` refused to write if a scheduled answer would vanish —
  ⚠️ **running it today, unchanged, would have deleted 253 of 310 scheduled
  Mystery puzzles.** It survived only by not being in `npm run build`.
- `scripts/verify-trail-careers.mjs` — run at **every transfer window**.
- `tests/unit/lineup-page.test.js` — the inline game scripts had no gate and had
  shipped two runtime faults through green builds.
- `scripts/seo/club-alias.mjs` — hand-checked short→long names. Fuzzy joining
  gave Angers→Rangers and Paris FC→PSG; a careless alias invented a Premier
  League gap that did not exist.

**LINEUP BUILDER — the honest state.** Geometry fixed and measured. 8 faces
approved by Alex and live. But identity cannot be automated: Alex rejected 13 of
21, and **every available signal lies** — filename (Rashford's file held
Bellingham), description (Bruno's held Ronaldo), single-face check (confirms the
cut, not the man), and Wikidata's own curated portrait (Rashford's P18 IS
Lisandro Martinez). ⚠️ Alex later clarified some rejections were CROPPING, not
identity — only 3 are confirmed wrong-person, so the split is unresolved.
**Next: classify those 10.** Recommended scope change — a small excellent set
(~300 hand-approved faces) rather than a comprehensive mediocre one.

**Ahrefs: DROPPED.** Alex has no paid subscription and it connects to his
account. GSC covers our own queries free; a GSC export is the cheap way to rank
the demand map.

---

## ▶ PREVIOUS (2026-08-12, late)

**Shipped today:** **Guess the XI** LIVE at `/xi/` (now a generated page with
the shared nav — it was a standalone file pretending to be a website);
**Daily 7 landing page** at `/daily-football-quiz/` (the last game with no
search surface); **/fun-facts/ rebuilt** for surprise — 42 checked, sourced
facts replacing 100 dull mined ones, plus ItemList schema and per-fact quiz
links; **ghost-name capture** so challenge links are signed; **one nav
everywhere**, centred, with the 8px hover gap that ate the menu now bridged;
**store badges above the fold** on every page (they were bottom-only);
**active-tab pill** + scroll-away gated to long pages; intent nav; playable
/lists; iOS **1.5.1 build 57**.

**Link-mesh fix:** `/fun-facts/`, `/xi/` and `/daily-football-quiz/` had ~2
inbound internal links each — the same orphan condition that left `/study/`
at zero in July, recreated by shipping new pages without adding them to the
footer. All three now at **283**.

**Partnerships: PARKED at Alex's call** — "if they go to investigate our half
finished website that will not be good". The pitch is ready and stays ready.
That makes "make the site read as finished" the actual partnership work.

**Cutouts: 4,340 of 6,431 (67.5%), 4,339 with a face box.** The ~1,600 rejects
were triaged 2026-08-12: **1,558 of 1,683 had failed on ONE number**, a 320px
minimum crop, not on quality. Lewandowski was being binned at 262px. Floor
lowered to 240px on eyeball evidence, **531 recovered**, contact sheet sent for
Alex's pass. Residual: ~1,000 genuinely need better photo sources.
⚠️ Also repaired a same-day regression — `build-cutout-meta.mjs` had nulled 974
good face boxes because `/tmp/facebox` was gone; it now refuses to run without
the binary rather than silently emitting nulls.

**Trail careers: verified 2026-08-12, and now verifiable on demand.**
`node scripts/verify-trail-careers.mjs` — run it at **every transfer window**
(Alex's standing instruction). First run caught Griezmann→Orlando City with
Trail #14 four days out, Lewandowski→Chicago Fire, and a corrupted club string
that would have rendered as "PSV Eindhoven |caps1 = 159" on #29.

**⚠️ NEXT SESSION, FIRST THING — upload 3,365 cutouts.** The bucket holds 975
of 4,340; the upload run only ever completed 975 and nobody had measured it.
The PNGs are cut and on disk. `scripts/upload-cutouts.mjs` runs ONLY while a
temporary INSERT policy is open on `player-cutouts` — that is a production
storage change and it needs Alex in the room. Until then the page falls back to
the Commons photo per player, so nothing is broken, just softer.

**In flight, unattended:** the Mystery Player birth-date backfill.

### 🔴 ALEX-OWNED (highest leverage first)
1. **Send the partnership pitch** — kit + live /partners/ page ready. PL
   kickoff is ~9 days out; this is the only lever that MULTIPLIES signups.
2. **Device-test build 57** — floating bar, scroll-away, glass, monochrome.
3. **Lineup builder go-live call** — live at /lineup/ but unlinked.
4. **VAPID secrets** — unlocks the entire web push / streak-saver system.
5. **AdSense resubmit — ONCE**, ~3 weeks after the 2026-08-11 recrawl.
6. **Store rename trivia → quiz** (both consoles; no word repeats across
   name/subtitle/keywords).
7. **PL-kickoff social assets** + your posting plan.

### ✅ CLOSED THIS EVENING
- **Guess the XI** — LIVE at `/xi/`. Pitch shape derives from each teamsheet's
  own position codes, so formations fall out of the data. Accent- and
  particle-aware matching ("kaka" → Kaká, "van der Sar"); a name you already
  found never costs a life. Anchored schedule — appending XIs can only add
  future days.
- **Growth-loop plumbing** — sender identity turned out to be ALREADY wired on
  both link builders; the leak was that nothing ever ASKED. Now it asks once
  and every later share and invite is signed. Skipping still shares.
  Also fixed a third collision with the +2s guest auth nudge (its own comment
  already documented two).
- **Season 2026/27 refresh** — NOTHING TO DO, checked rather than assumed. All
  50 /lists tables already carry 2025-26; prose and bank clean. A first pass
  read 48 tables as stale purely because a year regex pulls "2025" out of
  "2025-26". `scripts/audit-season-rot.mjs` records the baseline for next May.

### 🟠 MINE — committed, not started
- **Emoji mode** ("guess the club by emojis") — Alex approved, unbuilt
- **Web/app seam** — the "why download if web IS the app" strategy question
- **Daily 7 landing page** — the only game without one
- **XI parser** — 1999 UCL + 2014 WC still dropped on different markup (20 → 22)

### 🟡 CAUGHT WHILE WORKING TODAY (all real, none blocking)
- ⚠️ **UIScene lifecycle**: iOS warns "will result in an assert in the future".
  Our Capacitor 6 shell does not adopt it → concrete reason to finish the
  **Capacitor 8 branch** (already in flight, #74).
- ⚠️ **Android glass UNVERIFIED**: reasoned from spec + `@supports` fallback
  added, but never run on the emulator. Do before the Play build.
- **Xcode asset warning**: "image set 'Splash' has 3 unassigned children".
- **Build hygiene**: '[CP] Embed Pods Frameworks' has no outputs → runs every
  build.
- **Cold-start perf**: WebContent 6.3s / Networking 7.5s on a DEBUG launch.
  Measure in Release before drawing any conclusion.
- **Daily 7 has no landing page** — the only game without one (found while
  building the nav; every other game got a menu entry with a real URL).
- **Photo fame-tail never eyeballed** (sheets 3-6) + the mechanical quality
  gate (face px / age / framability) is still unbuilt.
- **CI**: e2e console-noise residue (35 on the runner), then flip strict.
- **XI parser**: Dutch surnames FIXED (particle-aware). 1999 UCL + 2014 WC
  still dropped (different markup).
- **Trail variety**: 45 careers over a 397-day schedule = fortnightly repeats.
- **This board is ~1,950 lines** and needs a prune of pre-August sections.

---


**Last updated: 2026-08-06.** Single source of truth for what's in flight.
`[ ]` = open · **ALEX** = needs you · **CLAUDE** = I do it.

Claude: update this file whenever something lands, and re-read it when asked
"what's left". It exists because a chat scrollback is not a plan. Completed
items are deleted, not archived — git history is the archive.

---

## ⚡ THE BOARD — rebuilt 2026-08-09, after the 7-day GSC read

Ranked against the **measured** bottleneck. Two things are now measured rather
than assumed:

1. **Distribution is the constraint**, not activation (82%) or retention (72%
   return). 74% of signups happen inside the native app.
2. **Authority is the ceiling on every SEO page we own.** 7-day GSC: club pages
   sit at position 8.6, the 49 lists at 27.5. Lists that DO reach page one beat
   their position benchmark by 2.2x — the format works, the ranking does not.
   More pages do not fix this. See [[project_gsc_7day_2026_08_09]].

| # | Task | Owner | Why it ranks here |
|---|---|---|---|
| 1 | **Partnership outreach** | ALEX | Distribution is the measured bottleneck and nothing I ship moves it. Pitch material is built. |
| 2 | **Authority building** — directories, Discord, backlinks | ALEX | The single ceiling on ALL 284 pages. Club pages p8.6, lists p27.5. Raising authority lifts every page at once; another page lifts none. |
| 3 | **`/mystery-player/` sells a mode the app hides** | claude | ⚠️ LIVE DEFECT. Page is HTTP 200 with a full pitch while `MYSTERY_ENABLED=false`. Someone searches, installs, mode is absent. Cheap: de-index or de-link until the pool is rebuilt. |
| 4 | **Italian localisation on Serie A clubs** | claude | The ONLY lever measured to convert: localised pages 8.06% CTR vs 3.05% English, same position. ⚠️ Per-market — Turkish INVERTS it, so treat as a test. |
| 5 | **Re-read GSC ~30 Aug to judge the title test** | claude | 76 titles moved from "Trivia" to "Quiz with Answers" on measured CTR (1.4% vs 9.3%). It is a HYPOTHESIS until re-measured. Cheap, and it decides whether to repeat the pattern on player/league pages. |
| 6 | **Distractor sweep — the club-qualifier class** | claude | Alex found a "hard" question where no distractor had played for the club named in the stem. The plausibility gate checks name-twins and eras, NOT club membership. The moat is the bank. |
| 7 | **Top up 3 sub-floor packs** | claude | Hajduk 15, RB Leipzig 20, Bournemouth 24 — all under the 25 floor agreed 2026-08-09. 10-Q sessions on a 15-Q pack repeat almost immediately. |
| 8 | **Mystery Player pool rebuild, then flip the flag** | claude | A finished mode is dark. Needs a CURATED cross-era pool, not more squad fillers. Also the honest fix for #3. |
| 9 | **MP: verify "up to 8" + stats saving** | ALEX+claude | Home advertises "up to 8 players"; that has never been proven past the RPC layer. Needs a 2nd device. Marketing a number we cannot demonstrate. |
| 10 | **AdSense: switch on ad units when approved** | ALEX | `AD_CLIENT=''` and all four slots commented, so approval alone earns nothing. ads.txt is correct; the console is just queueing. |

**Deliberately NOT on the list:** more `/lists` (49 already compete for the same
authority), more English club pages (the tail converts at ~1-5 impressions a
quarter), and a broad bug sweep (playtesters ~100% precision vs 3-6% for
sweeping audits).

**Parked but real:** Capacitor 8 merge (branch `upgrade/capacitor-8`), homepage
v5 rebuild, club-page competitive rebuild, TikTok, Reddit karma drip.

⚠️ **Prod status is never knowable from this repo** — Android and iOS release
state must be read from the consoles, not inferred here.

## 🎨 APP ICON — flagged by Alex's friend as "AI sloppy", 2026-08-10. He is right.

Current `assets/icon.png` (1024²): a flaming football with a question mark cut
into it, orange fire and sparks on navy. Judged at 60/120/180px, not as a poster.

**Why it reads as generated art:**
1. **Three ideas in one square** — ball + fire + question mark. An icon carries one.
2. **Fire, embers and soft 3D shading are the tell**, and they are the first
   things to turn to mush at 60px.
3. **A "?" on a football is the most predictable trivia mark there is.** Nothing
   about it is ours.
4. **⚠️ The palette does not match the product.** Orange/navy, when the app and
   all 191 generated pages are `#58CC02` green on `#0A0A0A`. The icon does not
   belong to the app it opens.

**Three directions to draw, all legible at 20px:**
- **Monogram** — "IQ" in the app's weight, green on near-black, a ball-panel
  hexagon forming the counter of the Q. Ties the icon to the name.
- **One panel** — a single ball pentagon as a bold flat shape, cropped hard.
  Unmistakably football, no effects, scales to nothing.
- **Scout's mark** — only if the Scouting Report world wins the homepage; the
  icon should then come from that world.

Produce as real renders at 1024/180/60 and judge at size. Do not ship a concept
that was only ever seen large.

### 🌍 LEAGUE COVERAGE LADDER — Alex, 2026-08-10: "prioritise by biggest fanbases"

**Builder coverage ≠ quiz packs.** A builder club needs only a Wikipedia
article + the squad parser; no questions, no editorial. So league waves are
cheap and mechanical.

Measured gap (containment-match ESTIMATE — Man City/PSG/Lyon/Athletic are
false negatives, true tier-1 gap ≈ 45-50 clubs):

| Tier | Leagues | Have/Total |
|---|---|---|
| 1 — FULL coverage first | PL ✅20/20 · Bundesliga ~5/18 · La Liga ~7/20 · Serie A ~10/20 · Ligue 1 ~5/18 | ~47/96 |
| 2 | Eredivisie, Championship, Belgian Pro League, Süper Lig, Brasileirão, Argentine Primera, MLS (+Liga MX, not in leagues.mjs) | ~17/158 |
| 3 — due course | Primeira Liga, Scottish Prem, Eliteserien, Allsvenskan, Danish Superliga, HNL, Saudi | ~7/102 |

**Method per wave:** resolve the league's clubs from its Wikipedia SEASON
article (2026–27 …) — never by name search (trap fired 6×) — extend the club→
article map, run fetch-squads-wiki, fetch photos --core for new ids, faces,
rebuild. ⚠️ Atalanta + RB Leipzig have quiz PACKS but were never added to the
squad map — include in wave 1. Tier-1 wave slots after the builder is LIVE;
it widens a shipped product rather than delaying it.

### 📋 WEEK PLAN additions + builder-pool decision (Alex, 2026-08-10)

- **#16 STORE PAGE BEFORE THE SOCIAL PUSH** — Alex has social plans timed to
  the PL start (<2 weeks). The listing must convert FIRST: new screenshots
  (incl. lineup builder), trivia→quiz rename done, description current.
  Possibly the most time-critical item of the week.
- **#17 /get smart link + UTM per-post attribution** — measure which posts
  drive installs; the redirect already exists.
- **Norwegian listing?** — depends on the language of Alex's social audience;
  ask when his plans firm up.
- **BUILDER POOL DECIDED:** default = current squads + academy prospects with
  first-team squad numbers (exactly what the Wikipedia templates encode).
  **LEGENDS TOGGLE approved by Alex** ("toggle on and we include all the
  inactive retired players like Zidane and Beckham") — retired players leave
  the default pool and return via the toggle, replacing the born<1980 hard cut
  at integration time.

### 🅿️ PARKED — app icon (Alex, 2026-08-10: "park it for now")

Three in-house fire attempts all failed (petals / teardrop / drips) and the
traced-flame composite read WORSE than the current icon. Current icon stays.
What survives: the vector ball+? foundation and the flame tracer are committed
(`assets/icon-work/`, `scripts/flametrace/`), and
`assets/icon-work/GENERATION-BRIEF.md` is a paste-ready prompt with acceptance
tests (judge at 64px!) for whenever Alex runs an external image tool. The
in-session generation service is dead: 0.2 credits, 2/image, no trial.

### ALEX-OWNED — I cannot move these

| Task | Blocked on |
|---|---|
| **Authority push** — directories + backlink outreach | You. Kit is written (#51). This is THE lever on "football quiz" p41, which you called life-changing. Content volume is NOT the constraint; authority is (#51 vs #8). |
| **Partnership outreach** | You, deliberately holding. |
| **TikTok channel** | You. Biggest reach platform we are absent from. Promote it the moment 1–3 land. |
| **Reddit karma drip** | You. Link posts are spam-filtered at 14 link karma; genuine comments first. |
| **AdSense** | Google. Stuck in "Klargjøres" since 5 July. Nothing to do but wait. |
| **VAPID secrets** (Footle web push) | You. The native half shipped; the web half is inert without them. |
| **Clarity connector token** | You. |
| **Three editorial rulings** | `/study/` question-count exemption · emoji vs line icons on the Journey ladder (I say KEEP the emoji) · whether the League picker keeps its counts like the club picker lost its. |
| **Store name: "trivia" → "quiz"** — DECIDED yes by Alex 2026-08-10 ("quiz ranks higher on web, let us not overcomplicate") | Next store-console session: read live name/subtitle/keywords in BOTH consoles, propose exact swap. ⚠️ Never repeat a word across name+subtitle+keywords — a repeat wastes an indexed slot. Norwegian Play listing needs the same pass. Original caveat (App Store search ≠ Google) noted and accepted. WEB evidence is strong — "with answers" beat "trivia" 6.6× in GSC and we rewrote all 76 club titles off "trivia" as our worst-converting intent. But App Store search ≠ Google and I have NO store search-volume data, so the web finding is suggestive, not proof. ⚠️ Regardless of the rename: only name+subtitle+keywords are indexed, and a word repeated across them wastes a slot — if "trivia" sits in both the name and keywords that is already a bug. Renaming also costs brand recognition. Next step: I read the current name/subtitle/keywords in both consoles and propose an exact swap. |
| **Which visual world for /lineup** | You. `DESIGN.md` assigns "The Scouting Report"; the builder is in the current app world. Scope was "homepage first, then decide" — this is the decide. |
| **Play API-level warning (due 31 Aug 2026)** | Build 15 (targetSdk 36) SUBMITTED for review 2026-08-10. ⚠️ Verify the banner actually clears after rollout — the 'Ikke inkludert' table showed build 14 already at mål-SDK 36, so the notice may be about something we have not read. If it persists post-rollout, open the notice and read the full text. Previously: You — upload only. ⚠️ NOT a code fix: the repo already has `targetSdkVersion 36` and `versionCode 15`, while production is **14 (1.5.1)**. The warning describes the LIVE build. Cut build 15 and upload; nothing needs writing first. |

### DEFERRED — with the trigger that should wake them

| Task | Wake it when |
|---|---|
| Homepage rebuild (approved v5) · club-page competitive rebuild | After the store/ASO work — those move signups, these move an already-converting page. |
| Capacitor 8 branch (iOS side + AGP 9 retest) | Before the next OS-forced upgrade. No user-visible win today. |
| MP answer-key Phase 2 · CSP enforce · async challenges | When MP stops being a claim and becomes a used feature. |
| Notification centre + native push | With, not before, a reason to notify. |
| Pre-launch hardening: service_role rotation, load test, README, coverage, App.jsx refactor | Rotation before any contractor access; the rest at ~10× traffic. |
| v1.1 audit follow-ups: Preferences adapter, profiles-UPDATE hardening, SW offline gap, ~23 unverified QA questions | Opportunistically. |
| "Next →" under the Dynamic Island | Needs Alex's real iPhone — cannot reproduce on the simulator, so no fix will be written blind. |
| Monetization checkpoint (Mediavine) | ~10k sessions/month. |

### CLOSED — stop re-litigating these

- **Editorial answer-leak cleanup — DROPPED.** Justified as "widens the draw"; measured, it narrows nothing (100% of every pack still reachable). Sessions already leak-free 26.9% -> 0.0%.
- **Localisation / US-soccer layer — DEAD.** GSC says Egypt is 100% brand traffic and the US ranks 7.2 for our own name because "ball IQ" is US basketball jargon.
- **Halting the Play 1.5.0 rollout — NOT DONE, on purpose.** Halting the only production release pulls the listing; a superseding upload keeps us live.

---
---

- [x] ~~**🎯 ALEX'S FEATURE: show who picked what at the reveal**~~ — **SHIPPED
  AND LIVE, verified 2026-08-24.** `reveal_question` in PROD returns `picks`
  and reads `room_answers` (migration applied), the client sets `revealPicks`
  from the same gated RPC as the answer key, and `QuestionView` renders the
  avatars beside each option — capped at 4 with a `+N` overflow and an
  aria-label listing who picked it. Own pick excluded (already highlighted),
  and a player who left mid-question is skipped.
  ⚠️ The note below was true WHEN WRITTEN and is now the stale half:
  **Verified 2026-08-03 that the data does not exist yet** —
  `room_players` holds room_id, user_id, name, avatar, score,
  answered_question, joined_at, disconnected_at, streak, best_streak,
  eliminated_at_q. `answered_question` is a yes/no; nothing records WHICH
  option a player chose.

  ⚠️ **Do not just add `last_answer_idx` to `room_players`.** That row is
  already streamed to every client in the room, and **RLS filters rows, not
  columns** — so the pick would be readable in the realtime payload the moment
  it is written, before anyone else has answered. Alex's own constraint
  ("post-reveal only, or it becomes answer-copying") would then be a
  client-side promise rather than a guarantee, and inspecting the payload to
  copy the strongest player's answer is trivial.

  **Design that actually holds:** store the pick server-side (columns
  `last_answer_idx` + `last_answer_q`, the second so a stale pick can never
  render against the wrong question), keep those columns OUT of the
  client-readable projection, and expose them through a SECURITY DEFINER RPC
  — `get_reveal_answers(p_code, p_question_idx)` — that returns picks ONLY
  when the question is closed (every player answered, or QUESTION_DURATION_MS
  elapsed). The client calls it once per question at reveal.

  Cost: one migration, one RPC (ending in `revoke execute ... from public`
  after explicit grants), submit_answer writing two columns, and the reveal
  UI. Wants a 2-device test — the same test [[project_mp_stats_realtime_gated]]
  is already waiting on.

## 💡 LINEUP BUILDER — BUILT 2026-08-10, deployed inert. Alex's idea, 2026-08-03.

**BAR SET BY ALEX 2026-08-10:** *"we will not make it available until it is at
the level of or BETTER than our competitors."* Not linked, not in the sitemap,
until it clears that. Do not link it early.

### ✅ Done

- `public/lineup/index.html` — one global pool of **3,656 players** (any club,
  any era), 14 formations (4-3-3 default), rows placed by real pitch depth,
  canvas image export at 1080×1350, share link in the address bar, accent-folded
  search ("sesko" → Šeško). Commits `47943ff` → `9ea65b8` → `053e837`.
- `squads.json` rebuilt (`17d6650`) — 65 clubs, 1,545 players, all 20 PL clubs,
  reserves and academy. Cross-club supersede pass with an abort guard.
- **3,759 licence-verified Commons photos** (`7884e92`) + **3,726 Vision face
  crops (99.1%)**. Crop is a RECTANGLE applied in CSS — no derivative images
  hosted, so nothing rides into the native binary.
- Attribution renders on the page AND is drawn into the exported PNG (licence
  condition — the PNG is what gets posted).

### 🔧 FIX — these read as "broken", not "missing"

1. **Drag-and-drop to reposition.** Every rival has it; its absence is the single
   thing that will make us feel like the lesser tool.
2. **Pre-fill a real club or national XI, then edit.** Fastest route to a
   finished team, and it makes the "who replaces him" case one tap. FotMob and
   MyLineups both have it.
3. **Photo RECENCY + quality.** P18 is often neither newest nor club kit — Ben
   White's is 2018, Saka/Rice/Raya are in national kit, Iniesta's has a trophy
   over his face. Fix: rank each player's Commons **category** by
   `DateTimeOriginal` instead of taking P18. Same job serves Alex's "new club
   kit" ask. ⚠️ Not automatable for kit detection; recency only.
4. **Mononym names.** "Marcelo Vieira" → "Vieira" is wrong. Needs a
   "commonly known as" field we do not have. Suffixes already fixed.

### ✅ RESOLVED 2026-08-10 — the builder no longer borrows Mystery's eligibility

Root cause of every "player X is missing" report: the builder consumed
mysteryPool.json, whose gates exist for a similarity game (career + position +
nat + born all required). Measured live:
- **Yoro & Andrey Santos: Wikidata has NO P54 club membership at all** → no
  career rows → Mystery gate rejects → builder inherited the rejection.
- **Heaven: has P54 + photo, missing only a position** → same gate.
- **Gittens & Quenda: ZERO freely-licensed Commons photos exist** — verified.

Fix (`build-lineup-data.mjs` rewritten): builder has its own rule — squads ∪
mysteryPool ∪ core (fame≥25), photoless players included as INITIALS CARDS,
sorted active → photographed → fame. All 12 spot-check names present, enforced
with exit(1) in the build. Pre-fill still requires photos (an XI of initials
reads as broken). Sub-25-fame youngsters (Quenda, Lacey) arrive via the SQUAD
REFRESH, not by fetching tens of thousands of fame-10 items.

### 🔧 FIX — found by Alex playtesting a Man United XI, 2026-08-10 (history)

**Two gates exclude exactly the players a fan wants, and a third makes club
lists read as historical.**

- **The 25-sitelink fame floor.** Shea Lacey is fame **10** on Wikidata, so he
  cannot enter the pool at all. Every academy prospect is in this position.
- **The photo requirement** (`build-lineup-data.mjs` skips anyone without a
  usable Commons photo). For a lineup builder this is the wrong trade: a fan
  typing a name wants the player, and initials are an acceptable card.
- **⚠️ WIKIDATA HAS NO OPEN CLUB SPELL FOR EITHER.** Measured: Andrey Santos
  (Q106171073, fame 32) and Shea Lacey (Q117207006, fame 10) both show **0 open
  club memberships**. So a squad-based fetch will not find them either — this is
  a source gap, not only a filter gap. Andrey Santos is ALSO a bug: fame 32 is
  above our floor, so he should already be in the pool and is not. Find out why
  before widening anything.
- **Club labels are "known for", not "current".** A Manchester United filter
  offers 51 players led by Rooney, Mata, Ashley Young, Hernández, Fellaini,
  Smalling and Rojo. Building a current United XI is therefore actively
  awkward — this is what pre-fill (item 2) has to solve.

**⚠️ ROOT CAUSE FOUND — the legends photo sweep was never run.** 5,298 of 8,491
pool players are excluded for having no usable photo, including **Pelé,
Maradona, Zidane, Beckham, Cruyff, Totti, Ronaldo and Luke Shaw** (187 of them
fame 60+). When Alex said "current players first, legends after", only the
active+recent tiers were fetched and the `--all` pass was never run. Luke Shaw
was caught by it too: Wikidata has no open club spell for him, so tier() filed
a fame-66 current Premier League player as a *legend*. **⚠️ tier() must not
decide who gets a photo — a missing open spell is a data gap, not a career
stage.** Sweep started 2026-08-10 (`fetch-mystery-photos.mjs --all`, 5,085
players); rebuild `lineup.json` after it, then re-run both verifiers.

**Multi-person photos.** Kobbie Mainoo's card shows a second player behind him.
The detector takes the largest face, but a tight crop is not enough when two
people are in frame. `playerFaces.json` already records a `faces` count per
photo — prefer `faces === 1` when choosing, and fall back to the largest.

Fix order: (a) finish the --all photo sweep (in progress), (b) find why Andrey Santos is missing despite clearing the floor,
(b) allow photoless players with an initials card, (c) drop the floor for the
BUILDER pool only — the Mystery Player answer pool must keep its fame floor or
the daily answer becomes an academy trialist.

### ➕ ADD

5. Bench (subs), captain armband, kit colour, manager name — cheap and expected.
6. **⭐ QUIZ THE XI.** Build a team, then get quizzed on those eleven players
   from the bank. No competitor can copy this; it is what makes the builder
   OURS rather than a commodity, and it feeds the activation bottleneck.

### ⛔ DELIBERATELY NOT BUILDING — decided 2026-08-10, do not re-propose

- **Player rating sliders** (MyLineups has them). They would be invented numbers,
  and principle 2 is never claim more than the bank can prove — "every answer
  explained" already shipped false once.
- **Season simulation / tactics-board drawing** (TeamBranch). Different product,
  and maintenance for one person.
- **Custom uploaded players.** Moderation and licence exposure.

### ❓ OPEN DECISION FOR ALEX

- **Which visual world does /lineup belong to?** `DESIGN.md` assigns "The
  Scouting Report" (newsprint, Archivo Narrow, near-monochrome). The builder is
  built in the CURRENT app world (#0A0A0A / #58CC02 / Inter), matching the app
  and the 191 generated pages. Scope was "homepage first, then decide" — this is
  the "then decide".

### 👁️ PHOTO SURVEY of the top-5 Google lineup builders — LOOKED AT, 2026-08-10

Playwright screenshots of all five, read by eye (not fetched-and-summarised):

| Site | Player representation, as actually rendered |
|---|---|
| lineup-builder.co.uk (#1 result) | **NO photos.** Icon / shirt / shield / number graphics; "18,000 players" is a NAMES database. Footer disclaims ownership of all logos. |
| fotmob.com/lineup-builder | **THE BAR.** Small circles, real headshot cutouts on clean light background, surname below, current squads (Lammens, Mbeumo, Dorgu). Licensed — they are a data company. |
| buildlineup.com | Jersey graphics + numbers. No photos. |
| createformation.com | Real headshot CUTOUTS, EA-game / PL-media style, floating on the pitch. "19,000 player images", free, ad-funded — near-certainly UNLICENSED hotlinking. Not our path. |
| chosen11.com | Coloured token discs. No photos. |

**Verdict: only 2 of 5 use real faces; one licenses them, one appears to steal
them. Three use graphics. We are already the second-best LEGAL face builder.**

The legal route to FotMob's look with our own licensed photos:
**person-segmentation cutouts.** macOS Vision (VNGeneratePersonSegmentationRequest,
local, free) strips the noisy match background from our Commons photos →
uniform FotMob-style cutout on a clean backdrop. Derivatives of CC BY / CC
BY-SA are permitted WITH attribution + a note of modification — standard
Commons practice ("cropped, background removed"). Needs hosting (~3-5k WebP
cutouts ≈ 50-100MB): Supabase Storage on the Pro plan is the natural home;
NOT the repo (bloat) and never the native binary. ⚠️ ALEX DECISION: approve
the bucket + pipeline before building.

**Squad data beyond Wikidata — CORRECTED after verification 2026-08-10:**
⚠️ football-data.org's FREE tier does NOT include squads (verified on their
pricing page — squad data starts at the €29/mo tier). The earlier board entry
recommended it unverified; that was wrong. Real options, in order:

1. **Wikipedia current-squad templates (lead candidate, free).** Every club
   article carries a fan-maintained "Current squad" section in structured
   {{football squad player}} templates — updated within hours of transfers,
   CC BY-SA with attribution, same ecosystem as our photos. Needs a template
   parser via the MediaWiki API. Fixes stale-United, adds Yoro/Heaven/Quenda
   via squad membership.
2. **API-Football free tier** (100 req/day — enough for a weekly refresh of
   ~70 clubs). ⚠️ Terms not yet read; verify commercial/ad-funded use first.
3. **football-data.org €29/mo** — the paid, zero-maintenance option if squad
   freshness ever justifies spend.

**Paid photo/data services — Alex green-lit spend 2026-08-10 ("as long as we
can legally use them, quality standard high"):** the free stack (Commons +
re-pick + cutouts) is competitive first; spend closes residual gaps only.
Candidates to evaluate WHEN a gap remains: Sportmonks (player images licensed
within subscription), football-data.org €29 squads, enterprise feeds
(StatsPerform — likely out of range). ⚠️ Any signup/payment is ALEX's action;
read the licence terms for redistribution/display rights before paying —
"API access" does not always mean "image display rights".

**Supabase Storage: `player-cutouts` bucket CREATED 2026-08-10** — public
read, 500KB/file, PNG+WebP only. ⚠️ NO write policy exists; open an INSERT
policy only for the upload run, then drop it (REVOKE discipline). Existing
`avatars` bucket untouched.

**Cutout prototype VERDICT (gallery sent to Alex):** 7 of 9 hit the FotMob
bar from our own licensed photos. The two misses (Ekitike blur, Frimpong
profile) are SOURCE-quality problems the running re-pick fixes — segmentation
cannot invent pixels. ⚠️ Mainoo showed that OVERLAPPING players merge into one
Vision instance, so the two-face fix is the re-pick preferring single-subject
photos, with the cutout as the finish. Correct order: re-pick first, cut
second. Cutout batch + Supabase Storage bucket (Alex approved) run AFTER the
pipeline completes, on the best photo per player.

### Competitive position (measured 2026-08-10)

| | Us | Best rival |
|---|---|---|
| Real photos **on web** | ✅ licence-cleared | only FotMob |
| Pool | 3,656 | MyLineups ~10k |
| Formations | 14 | FotMob 14 + free form |
| Export + share link | ✅ | all of them |
| Drag & drop | ❌ | all of them |
| Bench / captain / kit | ❌ | MyLineups |

**The thesis:** rivals compete on quantity of options. Fans pick the tool that
produces a picture worth posting, fastest. MyLineups has ~10,000 players and
shows none of their faces on web — that is the opening, and licence-cleared
photos are a moat because copying them means doing the same legal work.

### ⚠️ Traps banked from this build

- **Commons 429s a few-thousand-image sweep** and returns a 2,167-byte HTML
  page. Fetched blind it reaches a detector as "unreadable" and gets cached as a
  verdict. Detection read 62% → 51% and looked like a property of the photos;
  after magic-byte checks and backoff it came back **99.1%**. A transient
  failure must record NOTHING so the next run retries it.
- **The CDN only serves pre-rendered widths** — 120/250/330/500 always 200,
  800/1024 always 400. Asking for arbitrary widths 400'd on 100% of requests and
  succeeded via fallback, hiding a total failure behind a working page.
- **`Special:FilePath`'s 302 drops CORS**, so it cannot serve a crossOrigin image
  (breaks canvas export and the on-page fallback).
- **A `<button>` does not inherit body colour** — every player name rendered in
  the UA's default dark text on dark grass, invisible.
- **`overflow:hidden` on the photo disc clipped the position badges** to blobs.

### Data gaps

- 7 club packs absent from squads.json (failed the 14–45 sanity gate):
  Fenerbahçe, Torino, Parma, **Boca Juniors**, Basel, Schalke 04, Valencia.
- Going global fixed the keeper hole (108 → 349 GKs), so per-club XI shortfalls
  only matter if a club-scoped mode returns.

---

### Original reasoning (2026-08-03) — why it was worth building

**Why it is a better idea than it first sounds.** Our measured ceiling is
AUTHORITY, and the thing we lack is linkable assets — nobody links to a JS
quiz. A lineup builder is a TOOL, and tools are what people link to, embed and
share. It attacks the actual constraint rather than the symptom.

**The demand is documented, not assumed:**
- `lineup-builder.co.uk` already ranks in the "football quiz uk" SERP we are
  fighting in (found in the competitor scan).
- A public App Store review of **Sofascore** asks them to "add quizzes, score
  predictions, **lineup builders** like FotMob" — a user naming it unprompted.

⚠️ **What I could NOT verify: search volume.** We have no keyword tool, so
"people search for these things" is plausible but unmeasured. Do not size this
opportunity until we have real volume data — that is a one-month Ahrefs or
Semrush question, and it should come BEFORE the build.

**The blocker is a dataset, and we do not have it.** Measured today:
    player names (Footle)          406
    players with a club career      44
    players with a POSITION         44   <- the killer
A builder needs current squads: ~25 players x 72 clubs ≈ 1,800 rows, each with
a position, kept fresh through two transfer windows a year. That is an ongoing
data-maintenance commitment, not a build.

**⭐ THE REAL INSIGHT: one dataset unlocks TWO products.** The "Mystery Player"
mode already on this list is blocked on *exactly the same thing* — its note
reads "gated on a player dataset, not the algorithm". Build the squad dataset
once and both ship. That materially changes the cost/benefit and is the
strongest argument for doing it.

**✅ DATA SOURCE PROVEN 2026-08-03 — Wikidata, not a scraper.**
Alex suggested Firecrawl for continuous squad updates. We do not need it, and
should not want it: the good squad sources (Transfermarkt above all) forbid
scraping in their terms, so a core feature would rest on something that can be
pulled at any moment, and an HTML scraper breaks silently on any redesign —
this repo's signature failure.

Wikidata's public SPARQL endpoint was tested live and returns players WITH
positions for a club (`wdt:P54` = member of sports team, `wdt:P413` =
position). No auth, no key, no scraping, CC0 licensing, a real query API, and
it is edited by humans DURING transfer windows — which is exactly the
freshness problem Alex raised.

Two things learned from the live queries, both handled in one query:
- ⚠️ `wdt:P54` returns EVERY membership ever — the first Arsenal result gave
  Tony Adams and Alan Ball. For a current squad, query the statement node
  (`p:P54`/`ps:P54`) and `FILTER NOT EXISTS` on an end-date qualifier (`pq:P582`).
- ⚠️ Players return MULTIPLE position rows (Tony Adams as both "centre-back"
  and "defender"). Needs a dedup/priority map to one position per player.
- The endpoint 502s under load. Retry with backoff; never make a user-facing
  request depend on it — snapshot to our own JSON on a schedule instead.

**Open questions before any build:**
1. Real search volume for "lineup builder" / "football lineup creator"?
2. Crests and kits — the known licensing blocker. Does a text-and-shirt-colour
   builder work without them? (FotMob and lineup-builder use crests.)
3. Where does squad data come from, legally and sustainably? Manual for 72
   clubs is not maintainable by one person through a transfer window.

## ⭐ NEXT BUILD — the /questions Q&A layer (Alex approved 2026-08-03)

**Why this and not more questions.** The competitor read found our single
largest asymmetry: we hold ~6,400 verified questions and have **zero pages in
the text "questions and answers" format** that wins that SERP — a DIFFERENT
SERP from the head term, currently held by thin listicles with no schema
(quiztriviagames ranks with 90 questions and no structured data; kwizzbit uses
50 as a lead magnet). It is also the LINKABLE format: quizmasters cite
question lists, nobody cites a JS quiz. The raw material already exists and is
already verified — this is a script over data we own.

**Shape:** `/questions/<club>-quiz-questions-and-answers/`, 72 pages.
Questions grouped in rounds of 10, answers in a separate block after each
round (the pub-quiz convention — that is what makes it printable and
citable), table-of-contents anchors, print stylesheet, FAQ + Quiz schema
(NO competitor in the top set uses Quiz schema — free differentiation on an
already-clean on-page base).

**Wiring that must not be missed** — a new page type is more than a builder:
- register in `buildSitemap` (see gen-seo-pages.mjs:3641)
- **`vercel.json` rewrite for `/questions/(.*)`** — routes are whitelisted
  explicitly and a new one 404s in prod without it; a local dist fallback
  masks this, so verify LIVE by static `<title>`, never by HTTP 200
- inbound links from the matching club page, or it ships orphaned
- 3-level breadcrumbs + self-canonical, same as /lists
- ⚠️ `main` IS production and auto-deploys, so this lands as 72 pages at once.

## ✅ SETTLED 2026-08-03 — do NOT cap web questions to drive app installs

Alex proposed capping on-page questions and adding "get more Liverpool
questions in the Ball IQ app". **Measured first: the app has EXACTLY the same
questions as the web page for all 72 clubs** (Arsenal 67/67, Liverpool 42/42).
So the claim is not true today, and capping would make it true only by making
the free product worse first — while pointing the opposite way from the
competitor finding (our gap is too LITTLE indexable text) and cutting against
the settled "content stays free, Pro = features" decision.

**Kept:** the club-specific CTA, which is a real improvement over a generic
"Get the app" — but honest about what the app actually adds: multiplayer
against a mate, daily streaks, XP, Footle, Transfer Trail. Same lesson as the
"every answer is explained" store-copy fix: the CTA has to be true.

## 👁️ EYE-OPENER 2026-08-03 — the /lists pages are 52% of our impressions and 4% of our clicks

Totalled from the GSC per-page breakdown (90 days). This is the single most
striking number on the site and it was invisible until position was pulled
alongside CTR.

    /lists impressions : 10,494   ← 52% of ALL site impressions
    /lists clicks      :     11   ←  4% of ALL site clicks
    /lists CTR         :  0.10%
    33 of 43 list pages have ZERO clicks, holding 6,196 impressions
    impression-weighted average position: 27.1

Worst: `premier-league-champions` 873 impressions at position **49.5**, zero
clicks. `serie-a-top-scorers` 841 at 34.3, one click. `ballon-dor-winners`
696 at 26.1, zero.

**What it means.** The /lists bet is HALF-WORKING and the half that works is
the invisible half. Google clearly considers these pages relevant — it shows
them ten thousand times — but ranks them around 27, where nobody clicks. They
are not failing to be found; they are failing to be found *high enough*.

**What it does NOT mean.** Do not rewrite the list pages. Same trap as the
club-page CTR thesis: at position 27-50, 0.1% CTR is simply what is paid, and
no title fixes that. `most-ballon-dors` sits at 12.6 with 951 impressions and
2 clicks — the one page ranking respectably still converts at 0.2%, which
says the QUERIES are informational ("who has the most Ballon d'Ors") and get
answered in the SERP by a featured snippet. We would be fighting Google's own
answer box.

**The honest read: /lists is an authority play that has not been paid yet.**
It cost one day, it generates half our impressions, and it converts nothing
until the domain moves. That is an argument FOR the partnership, not against
the lists. Re-read this after the first backlinks land — if position moves
from 27 to 15, this becomes the biggest traffic source on the site overnight.

## ❌ FALSIFIED 2026-08-03 — the club-page "CTR fix" is not a real opportunity

I ranked this the #1 ROI task. It does not survive its own data, and the
correction matters because it would have been a day of pointless work.

**The claim:** Rangers converts 10.0% and Arsenal 2.5%, so Arsenal's titles
must be worse — rewrite them and quadruple the clicks from impressions we
already hold.

**Why it is wrong.** Every club title uses the SAME template —
`<Club> Quiz — <Nickname> Trivia & Answers | Ball IQ` — and the same
description pattern. Rangers and Galatasaray are structurally identical
listings with a 4x CTR difference. Wording is not the variable.

**What actually correlates: the page-one boundary.**
    Rangers 8.2 · Everton 9.0 · Tottenham 9.3   ->  4.7-10.0% CTR
    Arsenal 10.7 · Chelsea 13.3 · Real Madrid 14.8 · Man Utd 19.7  ->  0.6-2.5%
That is a cliff at ~position 10, not a slope, and it is exactly what CTR
curves look like. The query data agrees: **"arsenal quiz" gets 337
impressions and 4 clicks** — perfect intent, 1.2% CTR, because we sit at ~11.

**The one anomaly:** Galatasaray ranks 7.1 but converts 2.6%. Likely an
intent-mix problem — impressions from Turkish-language queries where a quiz
is not what the searcher wants. Not fixable by copy either.

**Conclusion: there is no cheap on-page CTR win.** The lever is POSITION,
which is authority, which is the partnership. This is the fourth independent
route to the same answer today. **Stop looking for on-page wins on club
pages.**

⚠️ Method note for next time: I compared CTR across pages WITHOUT normalising
for position, which is the first thing a CTR analysis must do. Pull position
in the same query, always.

## 🔑 GSC READ 2026-08-03 — "175 dead pages" WAS WRONG. Nothing is dead.

Alex opened GSC. It overturns the finding I recorded hours earlier, and the
error was in my METHOD: Clarity measures SESSIONS, and at a 1.6% CTR our
impressions convert to few enough visits that most pages cannot surface in a
top-25 session list. Absence from Clarity is not absence from Google.

**Indexing — healthy.** 151 indexed, 18 not. Of the 18: 2 alternates with a
valid canonical (correct, not a fault), 1 "crawled – not currently indexed",
15 "discovered – not currently indexed" (Google knows them, hasn't prioritised
crawling). **There is no indexation problem and nothing technical to fix** —
which the local audit predicted: 191/191 correct self-canonicals, zero
noindex, robots.txt clean, IndexNow key live at 200.

**Performance, 90 days — the real picture.**
    impressions   20,200          clicks   314
    CTR            1.6%           avg position   20.9
    **174 pages carry impressions**, not 19.
    Impressions climbing STEEPLY since ~22 July.

**We are not undiscovered. We are on page two.** 20k impressions at position
~21 is a site being seen constantly and clicked rarely, because page two pays
~1-2%. This is the authority ceiling stated in traffic terms, and it confirms
[[project_football_quiz_head_term]] and [[project_ranking_diagnosis_2026_07_28]].

**⭐ THE ACTIONABLE FINDING — club-page CTR varies 6x at similar positions:**
| page | clicks | impressions | CTR |
|---|---|---|---|
| / | 79 | 497 | **15.9%** |
| /quiz/rangers/ | 22 | 219 | **10.0%** |
| /quiz/everton/ | 15 | 165 | 9.1% |
| /quiz/tottenham/ | 22 | 469 | 4.7% |
| /quiz/liverpool/ | 15 | 400 | 3.8% |
| /quiz/newcastle/ | 7 | 234 | 3.0% |
| /quiz/galatasaray/ | 13 | 506 | 2.6% |
| /quiz/arsenal/ | 25 | **1,006** | 2.5% |
| /quiz/chelsea/ | 7 | 362 | 1.9% |
| /quiz/real-madrid/ | 6 | 373 | **1.6%** |

Arsenal holds the most impressions on the site (1,006) at 2.5%, while Rangers
converts 10%. **CTR at a fixed position is a TITLE/DESCRIPTION problem, and
that is ours to fix, not an authority wait.** Closing Arsenal's gap to
Rangers' rate alone would roughly quadruple its clicks from existing
impressions. Today's "& Answers" retitle targets exactly this — the fortnight
watch (~2026-08-17) now has a precise before-baseline to measure against.

## SEO REVIVAL ATTEMPT 2026-08-03 — four hypotheses, four falsified

**The scale of the problem: 175 of 194 pages get essentially no traffic** (90%).
Only ~19 pages cleared 4 sessions in 7 days. Worst category is the newest one:
**49 of 51 `/lists` pages are dead (96%)**.

Four on-page explanations were tested and every one failed:

1. **"/quiz/liverpool/ is broken"** — 2.2s/session looked fatal on a 3-day
   window. Over 7 days it is 20 sessions at **117s**. Noise from a 5-session
   sample. ⚠️ Do not act on Clarity samples under ~15 sessions.
2. **"the lists lack the playable taster"** — they have one (12 markers, 20
   buttons); it is smaller than a club page's, not absent.
3. **"serie-a-top-scorers 301s vs ballon-dor-winners 10s means the pages
   differ"** — 5 sessions vs 4. Noise again, from the same trap as #1, twice
   in one session.
4. **"internal link equity is starved"** — measured across all 191 built
   pages: **zero orphans, median 75 inbound links**, max 190. Traffic pages
   median 86 vs sitewide 75 — barely a difference. Linking is not the drag.

**Conclusion: on-page SEO is not the binding constraint.** This independently
re-derives [[project_ranking_diagnosis_2026_07_28]] by four different routes —
fundamentals are clean, the ceiling is AUTHORITY. Stop auditing on-page.

### ⛔ THE ONE THING BLOCKING A REAL ANSWER
We cannot tell whether the 175 dead pages are **(a) not indexed** — which is
mine to fix (crawl budget, sitemap, IndexNow) — or **(b) indexed but
outranked**, which is authority and Alex's outreach. Those need opposite work
and Clarity cannot distinguish them: it only sees sessions that already
happened. GSC can, in one query. **Connecting the GSC data connector is worth
more than any further on-page work.** The last GSC read (2026-07-20) covered
56 pages and found 55 indexed but stuck on page 2-4; the site is now 191
pages, so the ~135 added since have never been checked at all.

### Concrete finding worth a decision
**9 localised pages are near-orphans with 1 inbound link each** —
`/pt/quiz/{flamengo,palmeiras,corinthians}/`, `/id/quiz/{arsenal,manchester-united}/`,
`/es/quiz/{boca-juniors,river-plate}/`, `/tr/quiz/galatasaray/`. They were
built on the localisation thesis that [[project_us_egypt_gsc_2026_07_29]]
measured as **DEAD**. They duplicate their English originals' structure and
dilute rather than add. Alex's call: noindex, delete, or leave.

## FINDINGS 2026-08-03 (afternoon)

- [x] **✅ Trail spot-check DONE — all six careers pass** (van Dijk, Courtois,
  Griezmann, De Bruyne, Son, Lewandowski). Loans are correctly marked via the
  parallel `loans` array (Courtois→Atlético and De Bruyne→Bremen both `true`).
  Lewandowski's missing Znicz Pruszków is a *documented* editorial drop (third
  tier, Modrić precedent), not an omission. **They are already in
  TRAIL_ANSWER_LOG, 9× each** — the "INERT, NOT written into the log" comment
  above them is stale. Nothing has served yet only because the anchor is
  2026-09-01; today resolves to Trail #-28 and `getTrailAnswer()` returns null,
  which `HomeScreen.jsx:141` correctly gates on, so the card simply hides.
  ⚠️ **The one real tension:** De Bruyne's Chelsea return (Aug 2013 – Jan 2014,
  9 apps) is dropped to fit the 6-rung cap, which the locked rules forbid —
  "returns = rungs" and "truncating a career is not allowed" cannot both hold
  here. Alex's call: drop De Bruyne, or allow a 7th rung.

- [x] **✅ "Report a problem" on iPhone — DIAGNOSED, and the fix is real.**
  **iOS build 51 was cut 2026-07-29. The report-loop fixes (`ac0f869`,
  `845b186`) landed 2026-07-30 — one day later.** Alex's installed binary
  simply does not contain them. Prod confirms both halves: `question_reports`
  now holds 4 rows, newest today 09:17 UTC — all from **web**, where the fix
  deployed immediately. **Action: the fix reaches phones only via a new iOS
  build (52).** Nothing to debug in the code.

- [ ] **🔴 THE CLUB-PAGE SCROLL CLIFF — the real SEO finding.** Clarity, 7 days:
  every club page sits at **13–29% scroll depth** (Arsenal 19.0, Liverpool 19.2,
  Chelsea 19.6, Real Madrid 13.8, Champions League 8.7) while `/play` gets
  **95.3%**, `/lists/serie-a-top-scorers/` **93.8%** and the homepage **58%**.
  Engagement is healthy (~2 min/session) — people just never go below the top
  fifth. Measured on `/quiz/liverpool/` at 375×812: the page is **7,804px (9.6
  screens)** and 20% is **1,561px — under 2 screens**. So everything from
  "More quizzes to try" (32%) down is effectively unpublished: the record-book
  section (74%), the trust/how-it's-checked section (81%), the FAQ (88%) and
  the whole footer link mesh (94%). **That link mesh is what carries internal
  authority, and no human ever reaches it.** Options: hoist the mesh above the
  cliff, or cut the page length. Not a title/meta problem — those were
  diagnosed clean on 2026-07-28.
  ⚠️ A 3-day window made `/quiz/liverpool/` look dead (2.2s/session over 5
  sessions). Over 7 days it is 20 sessions at **117s**. Do not act on Clarity
  samples under ~15 sessions.

## TODAY — 2026-08-03

- [x] ~~**ALEX 2026-08-03: native push for REMATCH invites**~~ — **DONE,
  verified 2026-08-24.** `handleRematch` collects the opponent ids and the
  parent calls `sendPlayInvite(id, code)` per player, then reports the real
  count ("Rematch sent — 2 players notified") or tells you honestly to share
  the link when nobody could be reached. Only the room CREATOR invites, so the
  first tapper is not pulled toward the room they are standing in.
- [x] ~~**ALEX 2026-08-03: friends' avatars beside their answers in MP**~~ —
  **DONE, verified 2026-08-24.** Same feature as the reveal-picks item above;
  it was on the board twice. Post-reveal only by construction — the picks come
  from the gated `reveal_question` RPC, so a pick cannot be learned any earlier
  than the correct answer can.
- [x] **✅ MP PLAYTEST BUGS (Alex vs Johannes, 2026-08-03) — ALL FOUR CLOSED.** Playtesters scored ~100% again; every one was real, and three of the four had a cause different from the one filed.
  1. **H2H "3–0 vs myself" — FIXED.** The filed hypothesis (the tally attributes all rooms to one player) was WRONG, and prod data said so: the 3 was correct, the **0** was the bug. The ledger counted the current room in its own history and never counted the opponent's wins. Fixed in `OnlineMultiplayer.jsx` — exclude `room.id`, count W/D/L by actual board result, and require 2+ prior meetings before the banner shows at all. The name-in-both-slots half was the same root cause.
  2. **XP inflation — FIXED.** `getMpXP` was `score*10 + 50`, so one match paid 52,790. Now `max(15, round(score/40) + 50 if won)` — a strong win pays ~180, in line with solo. **The two inflated profiles were also deflated in prod** by reconstructing true XP from the `scores` table (Alex 2,006 · Johannes 2,446), cross-checked by an independent subtraction that agreed within 35 XP.
  3. **Duplicate questions — FIXED, and the filed diagnosis was wrong twice over.** It was never a *rematch* problem and they were never on *Mixed*: both repeats are `cat:"LaLiga"`, so it was a topic pack, where the pool is 270 rather than 6,400. Measured back-to-back repeat rates — Mixed 2%, LaLiga 34% (7% for two), Ligue 1 72%, chaos 97% (82% for two). A biased-shuffle theory was measured and ruled out first (worth ~0.3 points). The note that MP "must NOT consume applySeenFilter" was also wrong: only the HOST picks, so the filter changes which questions the room gets, never who sees what. Now both players record the round (hosting alternates on a rematch). Simulated over a 6-game session, repeats go 6.0→0 on LaLiga, 15.2→0 on Ligue 1, and 27.8→22.5 on chaos against an arithmetic floor of 21.
  4. **Verified against prod, not code** — `game_rooms` / `room_players` / `scores` queried directly for this pair. That is what overturned bugs 1 and 3.
- [ ] **134 same-answer question pairs need an editorial call** (`.audit/same-answer-pairs.json`, found while fixing bug 3). Each pair shares a resolved answer and 50%+ of its stem tokens; **79 cross category boundaries, so they can collide inside one Mixed game.** The 2 verbatim duplicates were already removed (`6e244df`). The rest are rewordings — picking which twin dies is a football judgment, not a script's.
- [x] **✅ League ladder extended upward** (`6663f6e`) — a perfect game pays 200 XP, so the old Legend ceiling at 3,000 was ~15 games: every engaged player finished the whole progression in a fortnight. **Stretching the thresholds was measured and rejected** — it demoted 9 of 9 active users, including one losing a Legend badge they earned. The six existing rungs are frozen; **Icon (8,000)** and **Immortal (20,000)** sit above them. Nobody moved; the leader now has 1,582 XP of visible headroom instead of a full bar.

- [ ] **WAVE N — RESCUED, NOT SHIPPED** (`b115646`). Run 1 died at the usage
  wall: 19 of 196 agents done, 177 errored. Six clubs returned EMPTY with
  `belowGate: true` — the pipeline correctly refusing to ship unverified work.
  **175 generated questions are saved** in `.audit/wave-n-run1/generated.json`
  (+ journal + the exact script). ⚠️ **GENERATED ≠ VERIFIED — none may enter
  src/questions.js until each clears examiner AND skeptic.**
  Resume (completed agents replay free):
  `Workflow({scriptPath: '<workflows dir>/wave-n-forge-wf_092cf5c7-559.js', resumeFromRunId: 'wf_092cf5c7-559', args: {fenerStems:[...]}})`
  **LESSON: 196 agents in one bite was too big — split future waves into 2–3
  clubs per workflow so a limit costs one club, not a wave.**
  Then: curate → insert → wire (App.jsx ×5, gen-seo ×2+DIR_ALIAS, clubs.mjs
  prose w/ array-hole assert, NEW `club-competition.mjs` entries or the build
  fails, clubIndex self-regenerates). Titles need "& Answers" ≤60 chars.
  Indexing is automatic: prod deploy regenerates sitemap + pings IndexNow.

- [ ] **FORTNIGHT WATCH (started 2026-08-03)** — the homepage swapped and the
  "& Answers" retitle both went live today. Read GSC + Clarity around
  2026-08-17 BEFORE any further homepage surgery: homepage CTR/bounce vs the
  old page, and the 45 retitled clubs vs the 27 unchanged. Tottenham +
  Newcastle are the natural experiment (they were LOSING those queries).
- [ ] **POST-SWAP CLEANUP (after the fortnight verdict)** — delete
  MarketingHome.jsx + the `/home-old` route + its vercel.json rewrites. That
  also retires the pixel-debt list (8 stray surface shades, the two text
  ramps, the orange Trail ramp) — it all lives in the page being deleted.

- [ ] **CLAUDE: GSC via the data plugin** (Alex, 2026-08-03) — run a proper
  data-tool analysis over Search Console instead of screenshots + the flaky
  in-console filters (the `?query=*term*` trap). ⚠️ The data connectors
  (BigQuery / Hex / Definite) all sit unauthorized — Alex must connect one in
  claude.ai settings first, OR we pull GSC's API directly (the property is
  URL-prefix `https://balliq.app/`, never sc-domain). First questions to ask
  the data: did the "& Answers" retitle move CTR on the 45 changed pages vs
  the 27 unchanged; post-swap homepage CTR; Türkiye cluster demand curve.

### 🎨 THE SCOUTING REPORT — LIVE AT https://balliq.app/home-preview/

`/` is untouched and still serves MarketingHome. The preview is a separate lazy
chunk on a route that already existed, so the converting homepage carries zero
risk. **Judge it on a phone** — 66% of traffic.

**Alex, 2026-08-03: "no need for us to rush, we will get this PERFECT."**

#### The 9 to swap-ready — BLOCKING (1-6)

- [x] **1. Club wall** — DONE (`bf537e5` + data `885e865`). 0 → **72 club links + hub**, generated from the hand-verified competition map; heading count generated so it can’t go stale; build FAILS if a club lacks a competition. Detector clean (2 pre-existing shell findings only).
- [x] **2. Footle section** — DONE. Playable PAST puzzle (build-time gen, grader emitted from wordle.js with round-trip guard), teaching strip, keyboard, countdown ends the page. Verified by playing; detector clean.
- [x] **3. Daily 7 door** — DONE. `?game=daily` rides the existing `?game=footle` branch; door beside Footle’s in the band. Verified by booting into "1/7". Note: fresh devices see onboarding first (pre-existing, same as footle).
- [x] **4. Nav** — DONE. Mockup masthead ported (Clubs/Records/Daily/About, no drawer — wraps under 700px, 44px targets), skip link → #report, footer with store + legal links. ⚠️ skip-link :focus reveal unverifiable in the pane (window unfocused) — check by real keyboard in item 6.
- [x] **5. FAQ** — DONE. 5 corrected FAQs, native details/summary, FAQPage JSON-LD fed from the same array (schema⇄DOM match verified). NB: the old homepage never had FAQPage schema — this is its first appearance, the TODO’s "loses eligibility" claim was wrong.
- [x] **6. Accessibility pass** — programmatic portion DONE: 229 text nodes swept, **0 contrast failures**; heading order H1→H2×6 no skips; 0 unnamed controls; `lang=en`; **320px reflow: no horizontal overflow** (WCAG 1.4.10); all 3 animations reduce-guarded; 44-54px targets verified per component. **ALEX, 2 minutes on your Mac:** (1) load /home-preview, press Tab once — a green "Skip to the assessment" chip must appear top-left (the pane cannot test :focus); (2) optional: VoiceOver one pass through the report.

#### SHOULD-DO (7-9)

- [x] **7. The accumulating report** — DONE. Mockup stub table ported with its honesty rules (only correct fills a bar; unasked rows carry no bar; "1 of 1" not fake ratings); verdict lands beneath the completed table. Pips deleted — they were an invention. Verified by playing a 4/5.
- [x] **8.** DONE — MP clause ("friends to race online, up to eight") + app line rewritten to the TRUE exclusive (push reminders). The audit's "web has ads" premise is false while AdSense sits unapproved with slots commented.
- [x] **9.** DONE by construction — Clarity loads from the shared index.html shell (native-guarded, route-agnostic), and MarketingHome fires zero component-level events, so both homepages carry identical instrumentation already. Nothing to port.

**SWAPPED (Alex: "swap it", 2026-08-03).** `/` = Scouting Report; old page at `/home-old`; rollback = revert the swap commit. Watch GSC + Clarity for a fortnight.

#### Foundation already landed + verified

| commit | what |
|---|---|
| `4b11152` | Shared palette token layer — 191 pages **byte-identical**, 312b |
| `6103775` | Homepage tokenised — 121 literals → 16 tokens |
| `34aea2b` | Scouting Report layer, chunk-scoped, 0 bytes to the 191 |
| `763e6dc` | Archivo + Archivo Narrow self-hosted, **proved loading** (`document.fonts.check()` returns `true` for a font that cannot exist) |
| `2aae197` | The composition at `/home-preview` |
| `680133f` | impeccable detector run — found a **1.3:1 CTA** I'd eyeballed twice, a banned kicker, a side-tab, 10 off-ramp type sizes |
| `672a33f` | Desktop fold — I'd only ever designed at 375 |

**Standing rules for this work:** no literal px in the component (add a role to
`design/report.js`); action on the paper is INK not green; `--attr-mid` is
2.13:1 on newsprint and must NEVER be text; spacing is `--sp*` never `--s*`;
no backticks inside the CSS template literal (it fails the build silently —
grep the whole build tail, not `^error`).

### 🎨 Redesign groundwork — SHIPPED, pushed 2026-08-03

**Decision (Alex, 2026-08-03): homepage first, HOLD the 191 pages.** They're the
part that's growing — every rising page in today's GSC read was a club page.
Reskinning a working surface and a broken one together makes neither
attributable.

| commit | what |
|---|---|
| `4b11152` | **One source of truth for the web palette** — `src/design/tokens.js` → `tokens.css`, consumed by BOTH the app entry and the 191-page generator. Provably inert: dist/ diffed before/after, **all 191 pages byte-identical**. Cost 312 bytes (250 gz). |
| `6103775` | **Homepage tokenised** — 121 literals → 16 tokens. Verified in-browser at 375×812, not on paper. |

**Why this was needed:** three surfaces each carried their own copy of the same
palette. The homepage still painted `#1A1D27` ten times — a navy
[app.css:57](src/app.css:57) records the product moving *off*. Nobody decided to
keep it; nothing could notice.

**Still open, all pixel-moving so all separate decisions:**
- 8 stray surface shades, 23 uses (`#1A1D27`×10, `#16181F`×5, `#181B24`×3, …) — the drift itself
- **Two text ramps**: `#FFF` (24 uses) vs `--tx` `#F0F1F5` (11). Only one can be the ramp.
- Orange accent ramp with no token (`#FF6A00`×3, `#FF9245`, `#EE8707`, `#FFD24A`, `#241B00`)
- Green CTAs disagree on their ink: `--grn-ink` vs `--bg`. Both pass contrast; it's consistency, not a11y.
- ⚠️ **`--s1/--s2/--s3` collision**: app.css uses them for SURFACES, the Scouting Report mockup for SPACING. Spacing tokens must be `--sp1..--sp6`.

**Next:** map the Scouting Report vocabulary (`--desk/--paper/--ink/--verd`) onto these tokens, then port the composition.

### 🟢 Shipped — pushed 2026-08-03, deploy verified live

| commit | what |
|---|---|
| `b5d6d5e` | **All 72 club titles now say "Answers".** GSC's 28 days: `<club> quiz with answers` converts 3–5× the bare club term — Rangers **30.8% vs 5.6%**, Tottenham **15.0% vs 3.1%**. Same page, same position; the whole gap is whether the title answers the query. 47 titles didn't say it. The claim is true everywhere it's now written: worst explanation coverage among all 72 is **100%**, because club packs clear the ≥15-hint gate. Verified in the *built* HTML, not the source. |
| `d94a9fc` | **`/football-wordle/` is playable** — was 0 buttons, now 29, server-rendered so crawlers see the game. Seeded from a 31-day-old past puzzle inside the frozen answer log; a 1,095-day build simulation proved no future answer can ever leak, and caught a time bomb that would have hard-failed the build in mid-2027. |

### Shipped since the last entry — all pushed to main, all live

| commit | what |
|---|---|
| `db73078` | **Homepage stopped contradicting itself.** FAQ said "a native Android app is on the way" beside a live Google Play button. The hero number counted up through 1,689 and 2,996 — two figures that were never true — before settling. 6,407 and 6,000+ sat 200px apart. Footle's spent keys were 2.89:1, every one of the detector's WCAG failures. |
| `83394db` | **"Rated out of 99" was false AND undersold the product.** `calcBallIQ` maps 15 questions onto **60–160**; 99 is the MIDPOINT. The marketing page capped its own scale 61 points below a perfect score, and disagreed with the in-app FAQ, which had said 60–160 all along. |
| `d38b447` | **/footle was donating every backlink it earned to the homepage.** See below — this is the big one. |
| `819f047` `34281b5` `de08a5c` | Homepage redesign preserved in `docs/mockups/`, `DESIGN.md` + sidecar written from the built world. |
| `a30904e` … `3f01e84` | The redesign's own fix chain — font dedup (−43% file size), a Footle duplicate-letter scoring bug, the verdict CTAs rendering with zero padding, the example row stealing a guess. |

### 🔴 /footle was donating every backlink it earned — REAL, verified, fixed

**⚠️ CORRECTION.** An earlier version of this entry claimed the Footle vertical
had *zero impressions* on Google, "measured" via GSC URL parameters like
`?query=*footle*`. **That syntax does not filter** — it silently returns an
empty result for everything. Caught by running a control: `?query=*ball*`
also returned zero, while "ball iq" is the single top query with 55 clicks.
Every zero in that entry was an artifact of the method, not a finding. The
footle-specific impression count is **still unverified**.

The rule this broke is already in memory: 0% and 98% are both signals to
check the instrument. It returned zero four times before the control ran.

**What IS verified, by `curl` rather than by GSC:** `/footle` served
`<title>Ball IQ — The Ultimate Football Quiz</title>` with
`canonical → https://balliq.app/`, hardcoded in `index.html:30-31` and never
updated client-side. Every Footle link in existence points there — the in-app
share text (`App.jsx:3954`, `:5031`, `:7546`), the `/t` `/ig` `/tt` `/x`
social redirects, every authority-kit template, the AlternativeTo listing.
A page that canonicals to `/` is dropped as a duplicate, which is consistent
with Alex's URL Inspection returning *does not exist*.

Fixed in `d38b447` with an edge function (`api/footle-boot.js`): same app
shell, Footle title, `canonical → /football-wordle/`. The share flow still
boots straight into the puzzle. **Expect `/footle` to report "Duplicate,
Google chose different canonical" — that is the SUCCESS state.**

**The premise was also wrong.** "Footle" is not coined. It is an 1891 English
verb (OED) and the name of two established competitors — `footle.club` holds
four of the top ten, `foot-le.com` owns the exact-match domain in EN and FR.
Winnable targets are "ball iq footle", "football wordle", and the answer
long-tails.

`[ ]` **CLAUDE — /football-wordle/ is prose-only.** Zero `<button>`, zero
`<input>`, against competitors that ARE the game. The playable-taster pattern
from `78170c6` reached ~120 club pages and never reached this one.
`buildFootlePage()`, `scripts/gen-seo-pages.mjs:2731`.

`[ ]` **ALEX — the GSC numbers I could not get.** The URL-param filters do not
work and the in-table filter would not apply for me either. Needed from the UI:
Performance → Queries → filter *contains* "footle", and URL Inspection on
`/footle` and `/football-wordle/`. Zero impressions and position-90 look
identical from outside; only that report tells them apart.

### 🟡 What the GSC query table actually says

Verified 28-day totals (5 Jul – 1 Aug): **311 clicks, 20k impressions,
1.6% CTR, position 20.9, 1,000 distinct queries.** Clicks and impressions both
climb sharply from ~23 July.

| query | clicks | impressions | CTR |
|---|---|---|---|
| ball iq | 55 | 205 | 26.8% |
| everton quiz | 7 | 48 | **14.6%** |
| arsenal quiz | 4 | **335** | **1.2%** |
| rangers quiz **with answers** | 4 | 13 | **30.8%** |
| rangers quiz | 3 | 54 | 5.6% |
| liverpool quiz **with answers** | 3 | 42 | 7.1% |
| tottenham quiz **with answers** | 3 | 20 | **15.0%** |
| tottenham quiz | 2 | 65 | 3.1% |
| real madrid quiz | 2 | 101 | 2.0% |
| football quiz | 2 | 86 | 2.3% |

**"with answers" converts 3–5× better than the bare club term** — Rangers
30.8% vs 5.6%, Tottenham 15.0% vs 3.1%. That is people explicitly searching
for the thing this product is built on, and we rank far better for it. It is
the strongest unexploited signal in the whole account.

Arsenal draws 7.5× Everton's impressions and 40% fewer clicks — a 12× CTR gap
on the same template. That is position, not titles. **The big-club terms inflate
impressions and crush average CTR while delivering almost nothing; the smaller
clubs are where the winnable traffic is** — which is exactly the moat the
product already has. Overall: 11.4k impressions, 161 clicks, position 20.5.

### 🟡 Homepage redesign — "The Scouting Report"

Direction assigned by dice (`concept-seed`, seed `cf2f8891`, candidate 4 of 7).
Files in `docs/mockups/`; `scouting-d.html` is current and reproducible from
`scouting-c.html` via the patch chain. All 19 impeccable commands have run;
detector exit 0. **Not yet ported to `MarketingHome.jsx`.**

`[ ]` **CLAUDE — the club band should carry the link mesh it dropped.**
114 of 126 live `/quiz/` pages are unlinked from the new page (the old one
linked 82). Same twelve rows, better contents: smaller clubs + competitions +
players, per the CTR data above.

`[ ]` **CLAUDE — multiplayer appears nowhere on the new page.** Up to 8 online,
live scores, podium, rematch — verified in `MultiplayerCard.jsx:54`. One clause
at the verdict, not a band.

`[ ]` **CLAUDE — the Daily 7 has no door.** Named in prose beside the countdown,
linked nowhere, and no `?game=daily` deep link exists (`App.jsx:9085` handles
only `footle`/`trail`).

`[ ]` **CLAUDE — `ANSWER = 'ALISSON'` is hardcoded** under a clock promising a
new surname at midnight. Ships as a lie on day 2.

`[ ]` **CLAUDE — the strongest unclaimed line on the page.** Two app-exclusive
truths, both verified: the web carries AdSense and the app declares none, and
`lib/notifications.js` nudges at 7pm with a 30-day win-back tail, native-only.
Current download argument ("a report nobody keeps") is not app-exclusive —
`/play` remembers you too.

### ⛔ DO NOT put Transfer Trail on the homepage
`TRAIL_ANCHOR_DAY = 20697` = **2026-09-01**. `getTrailAnswerForDayIndex`
returns `null` for every date until then. It shipped `b23b489`, was reverted
the same hour, rebuilt still dark. Advertising it would be a false claim.

---

## 2026-07-30 (evening state)

Per this file's own rule, completed detail is deleted rather than archived —
git history is the archive. What follows is only what is still true or still open.

### Shipped this session — all pushed to main, all live

| commit | what |
|---|---|
| `5cb8655` | **Hajduk Split** — 15 verified questions, 72nd club page. Croatia now has its own league section. |
| `03f469f` | **Hub title stopped splitting "football quiz."** It read `Football (Soccer) Quiz` — the parenthetical broke the exact phrase on the ONE page targeting our best term, and it was there for the US-localisation thesis we later disproved. Description 187 → 153 (it was truncating). |
| `68ec74c` | **Android R8 on.** AAB 7.63 → 6.50 MB (−14.8%). Capacitor registers all 17 plugins by reflection, so this needed full keep rules; verified by DEX-diffing both bundles — 15 plugin classes before, 15 after, empty difference. |
| `ccdb960` | **Site-wide SERP sweep.** 31 truncated titles → 0, 46 truncated descriptions → 0, across 190 pages. Almost all of it was `/lists`, which shipped after the last truncation pass and never inherited the rule. |
| `1e531b3` | **Build gate** (`scripts/audit-serp-meta.mjs`) so truncation cannot return a third time. Proved by reinjecting the original bug. |
| `4d7c25a` | **Trail wave M.** 38 → 44 careers. Found a real bug: the old schedule's minimum recurrence gap was **1** — the same answer could land two days running. Now 14 days minimum. |
| `53891cb` | Backlink submission pack + session handoff docs. |

Earlier the same day: the question-report loop (which had **never** delivered a
single report in the app's entire life), the MP card dead click, the persistent
iOS zoom, club picker search over 72 packs, PRL → EPL.

### 🔴 ALEX — blocking, in priority order

1. ✅ **DONE — R8 + edge-to-edge VERIFIED on an emulator (2026-07-30).**
   Built an Android emulator on this Mac (AVD `balliq_r8`, Pixel 7, API 36) and
   ran the minified build on it. Capacitor bridge starts, onboarding→Home works,
   storage persists, splash dismisses, status bar correct, **zero**
   FATAL/ClassNotFound/NoClassDefFound. Edge-to-edge verified on **3-button nav**
   — the exact risky config — tab bar sits clear of the nav buttons.
   ⚠️ One false alarm: the first run ANR'd under `-gpu swiftshader_indirect`.
   That was the emulator (system-server disk I/O, load 4.23), not the app —
   `-gpu host` reproduced the identical tap with no ANR. Always A/B the GPU flag.
   **→ `~/Downloads/balliq-1.4.1-vc10-r8.aab` IS SAFE TO UPLOAD.**
2. **Spot-check the 6 new Trail careers** before 2026-09-01 — van Dijk,
   Courtois, Griezmann, De Bruyne, Son, Lewandowski. The spec requires 100%
   human review; a wrong club order is unfalsifiable to the player.
3. **Tap "⚑ Report a problem" once on a device.** The loop is fixed everywhere
   but has still never delivered one real report end to end.
4. **Directory submissions** — `docs/BACKLINK-SUBMISSIONS.md`. Four are
   genuinely open (verified by fetching each site, see below).
5. **Say yes/no to a ~1.5 GB Android SDK download** so an emulator exists. No
   AVDs and no `sdkmanager` are installed, so there is currently no way to test
   Android locally.

### Directory status — CHECKED, not assumed (2026-07-30)

Alex thought these were already done. Fetched each site and searched it:

| directory | listed? |
|---|---|
| adoryvo daily-games list | ✅ **already there** — Sports section, marked 🆕, good description |
| listdle.com | ❌ not listed (and it *does* carry football games — we are absent from an on-target directory) |
| dailydle.org | ❌ not listed |
| likewordle.com | ❌ not listed |
| wordly.org | ❌ not listed |

Already done and NOT to be repeated: Product Hunt (~2026-07-09), AlternativeTo
(2026-07-13). `playfootball.games` stays dropped — verified as a direct
competitor with no submission path.

⚠️ **Small finding:** the adoryvo listing points at `balliq.app/footle`, which
is the SPA boot alias and serves the generic `<title>`, not the `/football-wordle`
landing page. Left alone deliberately — `/footle` is the short share URL in every
share text and all four social redirects, and it drops users straight into the
puzzle, which the "playable beats readable" finding says converts better. If we
ever want the link equity on the landing page instead, ask the maintainer to
switch the URL; do **not** redirect `/footle`.

## 🚀 1.4.0 IS IN FLIGHT ON BOTH STORES (2026-07-30, ~01:00)

- **Android:** versionCode 9 / 1.4.0 — **SUBMITTED, under review, 100% rollout,
  all targeted countries.** Previous live build was 6 (1.3.3), 11 active
  installs. Publishing this also clears Play's Android-16/API-36 warning (the
  bump was already in the bundle; the flag was against 1.3.3).
- **iOS:** build 51 / 1.4.0 — submitted for review.
- Store copy updated on both: question/club COUNTS REMOVED from the App Store
  promo text and description (Alex: a raw count is a codebase stat, not a reason
  to download — and both were stale anyway, saying 5,800/50+ when the real
  figures were 6,394/71). Keywords taken to exactly 100/100 by adding `quiz` and
  `daily`, with zero overlap against the app name.
- ⚠️ **The release notes nearly shipped a false claim.** The existing draft said
  "Rematch now invites your opponent instead of leaving you alone" — written
  before we knew `send_play_invite` raises `not friends`. For a link-joined
  opponent it notifies nobody. Replaced with "Rematch tells you whether your
  opponent was notified." Check release notes against what the code ACTUALLY
  does, not against what the last sprint intended.
- ⚠️ **Play Console UI trap:** after clicking "Send N endringer til gjennomgang",
  the button at that exact position becomes **"Opphev endringene"** (revoke), and
  a confirm dialog opened over the fresh submission. Answer "Ikke fjern". Do not
  click twice in that spot.
- Screenshots deliberately NOT refreshed. Alex: shipping the better build now
  beats holding it days for cosmetics. Friend is doing them separately.

### ❌ RETRACTED — this section was WRONG (corrected 2026-07-30 evening)

It used to read: *"Play's warning is generic advice, not a symptom. No Android
layout bug."* **There was an Android layout bug**, and this note would have told
the next session not to look for it.

What the reasoning got right: `viewport-fit=cover` is present and 16
`safe-area-inset` usages exist. What it got wrong: it inferred from *some*
surfaces handling insets that *all* did. `.quiz-wrap` had a flat
`padding-bottom:16px`, so on Android three-button nav the last element of a quiz
— the report chip — rendered under the system bar. Fixed in `93f4edb`.

**The lesson: a survey of the code is not a test of the screen.** The bug was
found by running the app on a device and looking, in about two minutes, after
reading the CSS had produced a confident all-clear. Never write "do not
re-audit" on the strength of a read-through alone.

---

## Branch `upgrade/capacitor-8` — unblocked, NOT merged

Capacitor 6.2.1 → 8, AGP 8.2.1 → 8.13.2, Gradle 8.14.3, minSdk 22 → 23.
Builds, runs, 15/15 plugin classes survive R8, 92 tests pass.

**The one regression is fixed** (`4f8aa7f`). Under Capacitor 8 the status and
navigation bars rendered WHITE, framing the app in a border. Cause: the theme
inherited `Theme.AppCompat.DayNight`, which was always wrong — Ball IQ has zero
`prefers-color-scheme` rules — but Capacitor 6 called
`StatusBar.setBackgroundColor("#0A0A0A")` on every launch and painted over it.
Capacitor 8 removes that path (`Window.setStatusBarColor` is deprecated in
Android 15 — the very API Play flagged), so the light variant surfaced.

Fixed in `styles.xml` at the cause: dark parent, transparent bars,
`windowLight*=false`, and the window background pinned to `@color/biqBackground`
(#0A0A0A). That last piece came from **measuring pixels**, not reasoning — with
the bars transparent they sampled #303030, exactly AppCompat dark's
`colorBackground` showing through. An `enforce*Contrast` opt-out was tried first,
measured as a no-op, and left out.

Verified on the `balliq_r8` emulator (`-gpu host`, API 36), release APK with R8
on, in **both** system light and dark mode: bars sample #0A0A0A, pixel-identical
to Capacitor 6 on main. ⚠️ This regression passed every automated check. It was
only ever visible in a screenshot — same lesson as the retracted section above.

**Still to do before merge:** the iOS side is untouched and needs its own build
and review; retest AGP 9 once this lands (it was blocked by Capacitor 6's own
`build.gradle`). Main is unaffected and still on Capacitor 6.2.1.

## ❌ `@vercel/og` → 1.0.0: DO NOT. 1.0.0 is OLDER than 0.11.1

Recommended in error and reverted the same evening. **`1.0.0` was published
2023-01-09; `0.11.1` was published 2026-03-05.** The npm `latest` tag is
**0.11.1** — we are already on the newest release. 1.0.0 is a stray old version
that sorts highest under semver, and installing it broke all five OG cards
(`ERR_MODULE_NOT_FOUND: wbg`, from a 2022-era `satori 0.0.46` tree).

The advisory that prompted it — sharp/libvips CVEs — **cannot be upgraded away
and does not apply to us.** `api/og.js` is `runtime: 'edge'`, and sharp has
**0 references in `dist/index.edge.js`** (8 in the node build we never deploy).

Rule this establishes: **a higher version number is not proof of a newer
release.** Check `npm view <pkg> dist-tags` and the publish date before treating
a bump as an upgrade. Harness for re-testing the cards lives in the session
scratchpad as `og-render.mjs` — it renders all five variants and asserts the PNG
magic bytes; byte sizes on 0.11.1 are 99908 / 75623 / 60902 / 58125 / 58736.

---

## THE NUMBER THAT MATTERS

**97.2% new users · 2.8% returning · four people came back.** (Clarity, 3 days.)

Everything divides on that line. Content waves grow the 141 arriving; only the
daily loop grows the 4 returning. Given two tasks, prefer the one that moves the
second number — we are already good at the first.

Second fact, GSC 2026-07-29: **the US and Egypt are NOT a localisation gap.**
Egypt's 22 clicks are 22 brand searches for "ball iq"; the US searches in plain
English. That thesis is dead — see `project_us_egypt_gsc_2026_07_29` in memory.
Do not rebuild the "soccer layer".

---

## 🔴 NOW — in priority order

### 📱 ANDROID: 1.4.1 IS LIVE. The four Play flags, and what each actually needs

**1.4.1 / vc10 published 2026-07-30** — 177 regions, 11 installs. ⚡ Google
reviewed it in MINUTES; a revoke attempted minutes later failed with "already
reviewed". **Plan Android releases as if there is no take-back window.**

Play's release analysis raises 4 items against 10 (1.4.1). Read at source:

| # | Play says | What it actually is | Cost |
|---|---|---|---|
| 1 | Edge-to-edge may not work for all users | **Our bug.** The report chip rendered under the nav bar. Found independently on the emulator. | ✅ **FIXED** in vc12 |
| 2 | Deprecated fullscreen APIs | `Window.get/setStatusBarColor`, called from `com.capacitorjs.plugins.statusbar.StatusBar`. **Not our code.** `@capacitor/status-bar` 6.0.3 IS the newest 6.x — no patch exists. | **Capacitor 7 migration** (core + android + ios + cli + 13 plugins) |
| 3 | Optimise bitmap images | 50 PNGs, 6.0 MB in `android/app/src/main/res`. Convert to WebP. | Low risk, do with #2 |
| 4 | R8 config → higher memory | ⚠️ NOT "enable R8" — **our R8 registered fine.** It wants **AGP ≥ 9.0**; we are on **8.2.1**. **TESTED 2026-07-31: AGP 9 is BLOCKED BY CAPACITOR 6** — see below. | gated behind #2 |

#### ✅ TESTED, not assumed: AGP 9 cannot be taken on its own

Tried it rather than guessing (git was clean, reverted after). Two builds, two
answers:

1. AGP 9.3.1 + Gradle 9.1.0 → *"Minimum supported Gradle version is 9.5.0"*. Fixable.
2. AGP 9.3.1 + Gradle 9.5.0 → fails in
   **`node_modules/@capacitor/android/capacitor/build.gradle` line 57**:
   *"`getDefaultProguardFile('proguard-android.txt')` is no longer supported since
   it includes `-dontoptimize`"*.

**The blocker is inside Capacitor 6's own build file, not ours.** (Our
`app/build.gradle` already uses `proguard-android-optimize.txt` — that changed
when R8 went on in 68ec74c.) It cannot be fixed without editing `node_modules`,
which any `npm install` wipes.

So the dependency chain is now **proven, not assumed**:
**AGP 9 ← requires Capacitor 7 ← which also fixes the deprecated StatusBar APIs.**
Flags #2 and #4 are therefore ONE job, and Capacitor 7 is the entry point. Do not
attempt AGP separately; it will fail the same way.

Toolchain facts for whoever picks this up: JDK 21 is already available (Android
Studio's bundled JBR), AGP 9.x latest is 9.3.1, and AGP 9.3.1 requires Gradle ≥ 9.5.0.

**None of 2–4 is a defect.** They are deprecation and toolchain recommendations;
the app works. Only #1 was a real user-facing bug, and it is fixed.

### THE PLAN (agreed shape — ship the fix, then upgrade deliberately)

**1.4.2 / vc12 — NOW.** Carries only the nav-bar inset fix. Built and staged at
`~/Downloads/balliq-1.4.2-vc12.aab`. Resolves flag #1, the only one users feel.

**1.5.0 — a dedicated platform-upgrade release.** Capacitor 6 → 7, AGP 8.2.1 → 9.x,
Gradle to match, PNG → WebP. Clears flags #2, #3, #4 together. This is a real
migration touching every native plugin and both platform projects.
⚠️ Do NOT bundle it into a same-day patch — and now that we know Play publishes
in minutes, there is no window to catch a regression after the fact. Test it on
the `balliq_r8` emulator first (see [[reference_android_emulator]]).


### ⚠️ NEW 2026-07-30 — ALEX: AdSense is DORMANT on ~175 pages (one line)

Found by a real Chrome performance trace on `/quiz/`: AdSense never appeared in
the third-party list. It isn't a bug — `AD_SLOTS` in `gen-seo-pages.mjs` has zero
active entries, the slot ids are commented out, so `ADS_ENABLED = false` and the
gate emits neither units nor loader on ANY generated page.

    // afterQA: '4505987680', afterFaq: '4505987680', listInline: '4505987680',

**10 `ads: true` call sites cover ~175 live pages** — club, player, category,
nation, lists, study. Our highest-traffic pages, the ones GSC shows converting.
Earning zero. (Only `dist/index.html` loads the ad library, and it is correctly
native-guarded.)

The disable was deliberate and the reasoning was right: *"DORMANT until AdSense is
confirmed SERVING, so no empty ad boxes render before ads fill."*

**ALEX — this is one check:** open AdSense → Nettsteder. Does balliq.app show
approved / "Klar"? If yes, uncomment that line, rebuild, ship. If no, leave it —
the current state is correct. This is the open half of the AdSense task and has
been waiting since 2026-07-20.

### ✅ 2026-07-30 — performance audit: NOTHING TO FIX

Real Chrome trace + Lighthouse on `/quiz/`, mobile, **Slow 4G + 4× CPU throttle**:

| metric | result | threshold |
|---|---|---|
| LCP | **1,330 ms** | good ≤ 2,500 |
| CLS | **0.00** | good ≤ 0.1 |
| TTFB | 36 ms | — |
| Lighthouse a11y / best-practices / SEO / agentic | **100 / 100 / 100 / 100** | 49 passed, 0 failed |
| DOM | 420 elements, depth 8 | small |
| 3rd parties | Clarity only, 1.4 kB / 143 ms | — |

Largest single cost is style recalc (409 ms) — but that is at 4× throttle, so
~100 ms real. **No optimisation work is warranted.** Recording this so nobody
re-runs it: the pages are fast, and the audit's value was finding the AdSense
gap, not a perf problem.

⚠️ Correction for the record: I briefly claimed the generated pages were
render-blocked by Google Fonts. They are not — a truncated grep hid
`media="print" onload="this.media='all'"`. Both `index.html` and the generator
use the non-blocking pattern.


### 1. ~~CLAUDE · Localised club pages~~ — **TWO PILOTS LIVE 2026-07-29**
- `/es/quiz/boca-juniors/` (7e4b584) — Spanish
- `/pt/quiz/flamengo/` (5a58437) — Brazilian Portuguese

Both **verified live by static `<title>`**, reciprocal hreflang on both halves,
per-slug clusters (Boca advertises `es` only, Flamengo `pt` only), both in the
sitemap. 22 questions each, translated from our own verified sets and keyed by
the English question `id`, so neither page asserts a new fact and two build
guards fail loudly if an original moves. Both guards proven by breaking them.

⚠️ **Wave L is mostly BRAZILIAN, which the Spanish page alone missed.** Boca and
River are Argentine; Corinthians, Flamengo and Palmeiras are Brazilian. That is
why there are two pilots and not one — separate languages, separate search
markets, separate competition.

**MEASURE BEFORE SCALING.** Still unbuilt on purpose: River Plate (es),
Corinthians + Palmeiras (pt), and the other 69 clubs. Check GSC for both URLs
in ~2-3 weeks — impressions AND whether they convert. A third language is now a
data file plus a spread (`scripts/seo/clubs-<lang>.mjs`), so scaling is cheap
once the answer is in.

⚠️ **What a reader actually gets today:** the PAGE is fully playable in their
language (taster + Q&A + explanations, 22 questions). The APP is still English,
and both FAQs say so. If the bounce lands on that FAQ, the answer to "should we
localise?" is "not before the app is".

Further clubs: `scripts/seo/leagues.mjs` maps 356, we have 71. **Saturation
finding from the tier-1 top-up: 75% of rejections were duplicates.** Chelsea and
Man Utd are full; Dortmund had room. Check saturation before commissioning.

### 2. ~~CLAUDE · MP results screen~~ — **the visual half was already done**
This item was STALE: `a74fe9d` (podium, count-up, entrance choreography) and
`f1da201` (1v1 winner crown) had already shipped the VS board, margin line and
head-to-head chip. Classic orientation trap — checked before building.

The real gap was underneath it: **online multiplayer awarded no XP at all**,
the only mode outside the level economy, so the ending looked good and meant
nothing. Fixed in `2938c5c` — `getMpXP(won, score) = max(15, score*10 + 50 if
won)`, paid from the once-per-room ended effect, shown as "+N XP earned ⚡" like
every other result screen. **Not device-verified** — needs two live clients.

### 3. ALEX · 2-device MP test
Now unblocks three things, not one: the stall watchdog, the MP stats write, and
the new MP XP award. A green build proves compilation, not behaviour.

---

## 🟡 QUEUED

### NEW 2026-07-30 — website facelift: tooling + the traps

**What we already have** (no install needed, all connected):
- `ui-ux-pro-max` — LOCAL skill, verified working. 84 styles, 192 palettes, 74
  font pairings, **16 GSAP motion presets** with framework notes, do/don't and
  performance caveats. Run it as
  `python .claude/skills/ui-ux-pro-max/scripts/search.py "<q>" --domain gsap`.
  Also `--design-system --persist` writes a MASTER.md the whole facelift works from.
- `frontend-design` + `artifact-design` skills — art direction, anti-AI-slop rules.
- `design-critique` + `accessibility-review` skills — structured review passes.
- **Magic Patterns** (AI UI generation) and **Canva** MCPs — both connected.
- claude.ai **design-system** tools (`create_design_system`, `create_inspiration_document`).
- **Chrome ×2** for pulling reference sites, **iOS Simulator** for visual checks.

**ADDED 2026-07-30 — both verified by probing their tool lists, not by "Connected"**
- `magicui` — `npx -y @magicuidesign/mcp` · 3 tools (listRegistryItems,
  getRegistryItem, searchRegistryItems). Animated React components.
- `shadcn` — `npx -y shadcn@latest mcp` · 7 tools (search/view/examples/add-command
  /audit-checklist across registries).

**Figma Dev Mode MCP: BLOCKED — and on reflection, SKIP IT FOR NOW.**

Pricing checked at source 2026-07-30: Professional **Full seat $16/mo**, Dev seat
$12/mo. A Dev seat gets Dev Mode and the MCP but can only *view/comment* in
Design, so a solo dev who both designs and codes needs **Full**. Starter is free
but has no Dev Mode.

The money is trivial. The reason to skip is **sequencing**: the MCP reads an
*existing* design file, and there are zero Ball IQ designs in Figma. So the real
cost is learning Figma and designing every screen first — and the generated code
would still need heavy rework against plain CSS plus the standalone mirror.
**Zero-cost test:** design one screen on the free tier and see whether
designing-before-coding suits how Alex actually works. If it does, $16 is an easy
yes.

Mechanically it is also blocked right now: the server runs
locally out of the Figma desktop app — `Figma.app is NOT installed` and
`127.0.0.1:3845/mcp` answers nothing. Needs Alex to install Figma desktop, enable
the Dev Mode MCP server, and hold a Professional+ plan. Skipped TouchDesigner,
Framer, Webflow, Penpot, MasterGo — none match this stack.

### ⚠️ THE FINDING THAT MATTERS MORE THAN THE SERVERS

Ball IQ is **plain CSS** — `src/app.css`. Checked package.json: no Tailwind, no
shadcn, no Radix, no styled-components, no Framer Motion, **no GSAP**.

The entire modern design-tooling ecosystem assumes Tailwind:
- **6 of shadcn MCP's 7 tools refuse to run without `components.json`.** We have
  none. As things stand that server is inert here.
- **Magic UI ships React + Tailwind components.** Its three tools still work as a
  reference/inspiration source, but nothing can be pasted in as-is.
- **The 16 GSAP motion presets in `ui-ux-pro-max` are GSAP snippets** — using them
  means taking on GSAP as a dependency, and SplitText is a paid Club plugin.

So the facelift's real first decision is not which MCP to install, it is:
**adopt Tailwind (+ maybe GSAP), or stay on hand-written CSS and use these servers
purely as inspiration?** Adopting Tailwind on an 11.5k-line App.jsx with a
155-rule `!important` standalone mirror is a big, risky migration — and the mirror
is exactly the thing that has already broken installed PWAs once. Decide this
BEFORE any component work, not during.

**⚠️ THE TRAPS — a facelift here is not just CSS**
1. **The standalone CSS mirror.** `app.css` carries a
   `@media (display-mode: standalone)` block of ~155 `!important` rules that
   re-styles what the ≥1024px desktop reflow changes. **Any token or class the
   facelift touches must be checked against the mirror AND against `index.html`'s
   `html.native-app` killswitch.** Miss it and installed PWAs plus the native app
   keep the old styling — this has already happened once.
2. **A single element commonly has hooks in FOUR places:** the component, the base
   rule, the desktop reflow, and the mirror.
3. **`webDir: "dist"` means everything built for web ships inside the native app.**
   Any new font, script or asset is bundled whether it renders there or not, and a
   raw third-party `<script src>` silently falsifies the store privacy declaration.
   Native-guard it in code, not in a comment.
4. **Don't break `/footle`.** It is the short share alias in every share text and
   all four social redirects.
5. Marketing `/` keeps the "Both" hero (Footle + quiz) — Alex's standing call.


### NEW 2026-07-30 — raise explanation coverage (77.6% → higher)
Measured: 4,970 of 6,402 MCQs carry an explanation. All 72 **club** packs are at
100% (the generator's MIN_HINTS gate has been quietly enforcing it) — the gap is
entirely in the older category banks that predate the gate:

    WorldCup 54% (631) · Euros 56% (192) · PL 61% (558) · Bundesliga 64% (281)
    SerieA 68% (320) · LaLiga 74% (365) · UCL 74% (593) · Managers 80%
    Records 82% · Legends 84% · Ligue1 95% · History 96%
    100%: Transfers, chaos, SuperLig, Primeira, ChampionsLeague

Copy has been made honest in the meantime ("most answers explained"). **The prize
is earning the sentence back**: at 100% we can truthfully say "every answer
explained" everywhere, which is the product's whole pitch. Club pages already do.

Additive work — the answers are verified, only the explanation is missing — so
much cheaper and lower-risk than forging new questions. World Cup first (~290
missing, biggest category and a top-traffic page).

⚠️ Do NOT chase 100% mechanically. "Which club plays at Anfield?" needs no
explanation, and forcing one produces filler, which is where fabrication starts.
Target is "every question that benefits from one".

### NEW 2026-07-30 — performance + bug audit (Alex asked; overdue)
Genuinely overdue. But run it as **measurement, not reading**: a real Lighthouse
pass, actual bundle numbers, live Sentry, prod queries. Today's evidence is
blunt — every real defect came from executing something (calling
`report_question()` against prod, diffing the DEX, decoding HTML entities before
measuring), while broad read-everything sweeps produced noise. And convert each
finding into a **gate**, like the SERP one; gates have a far better track record
here than repeat sweeps.

### NEW 2026-07-30 — more clubs? Top up the thin ones first
72 packs live. Breadth is not the constraint — **repetition is.** A ~40-question
pack with 10-question sessions and a 14-day seen-filter gives a club fan roughly
4 fresh plays before repeats start. Fixing the five thin packs beats adding
club 73.


- **CLAUDE** · New game modes. Trail is OUT (live 2026-07-29). Judge later
  candidates on what actually mattered in the Trail decision: can it ship with a
  FROZEN zero-maintenance schedule (Footle's real advantage), and is its share
  card spoiler-free? A mode needing per-puzzle curation forever is a liability.
  `docs/transfer-trail-spec.md` §7 has the scoring that killed CHAIN despite it
  winning on cleverness.
- **CLAUDE** · Push US quiz-intent queries page 2 → 1: `arsenal quiz` 14.9,
  `arsenal quizzes` 19.3, `premier league quizzes` 26.7. These are the only US
  queries where a click is possible at all — the Gold Cup cluster ranks 8-10
  with ZERO clicks because Google answers those in the SERP itself.
- **ALEX** · Submit 1.4.0. iOS build 51 + Android versionCode 9 passed preflight
  earlier today, but ⚠️ they now predate a lot: one-screen onboarding, the
  rating-prompt fixes, the Footle explainer removal, the invite feedback and MP
  XP all landed after. Re-sync before archiving:
  `rm -rf dist && npm run build && npx cap sync ios && node scripts/prune-native-web-assets.mjs`
  then `node scripts/preflight-release.mjs` (it checks the native bundle really
  matches source — the thing that nearly shipped Trail early).
  ⚠️ `npx cap sync ios` currently fails at the **pod install** step on this Mac
  (a Ruby/CocoaPods problem, not ours). `cap copy` still succeeds, so the web
  bundle syncs correctly and builds are fine — but a NEW native plugin would not
  install until that is fixed.
- **CLAUDE/ALEX** · App Store screenshots. `screenshots/apple/` and
  `screenshots/android/` exist. Method agreed: seed REAL state in the simulator
  (set a name, play a Footle and a Daily 7 so streak and rating are genuine).
  Never composite — both stores treat a fabricated screenshot as
  misrepresentation. iPhone 17 Pro Max shoots at 1320×2868, exactly the 6.9"
  requirement.
  - **Footle frame: shoot on or after 2026-07-30.** Footle #87 (today) is RICE,
    four letters, and a 4-wide grid is the thing Alex specifically does not want
    in the listing. #88 onward are all 5-8.
  - ⚠️ **Android is BLOCKED**: no AVD and no system image on this Mac. Either
    download a system image (~1.5GB) and create an AVD, or shoot on Alex's
    physical Android. Do NOT put iOS shots in the Play listing.
- **ALEX** · Clarity AI-bot tracking (2 clicks) + Bing Webmaster Tools (needs
  your sign-in). Bot tracking tells us whether AI crawlers actually reach the
  `/lists` pages we built as an AI-answer surface — currently unknowable.
- **CLAUDE** · CSP: flip Report-Only → enforce, but only after a clean window.
  The policy was corrected 2026-07-29; as written before, enforcing would have
  killed Apple Sign-In, every webfont, Clarity's beacon and the avatar cropper.

---

## ⚪ ALEX-GATED — no Claude action possible

- Authority/backlinks: directory sweep, Discord, Launchpadly. **The measured
  ceiling is authority, not on-page.** No duplicates — some is already done.
- Reddit: link posts are filtered (14 link karma). Comment first, 1-2 weeks.
- TikTok: the largest platform Ball IQ is absent from.
- Footle web push: blocked on your VAPID secrets. Native half already shipped.
- Android R8 + edge-to-edge: needs a real device. Do NOT enable R8 blind —
  `proguard-rules.pro` is empty and Capacitor relies on reflection.
- Monetization checkpoint at ~10k sessions/mo. Nowhere near it.

---

## 🔬 CLUB-PER-MARKET RESEARCH — first real data, 2026-07-29

Alex, correctly: *"i actually do not know what clubs people from indonesia
actually support, this is research we have to do."* Right, and my prior was
WRONG. Google Trends, Indonesia, past 12 months, average search interest:

| Club | Interest |
|---|---|
| **Arsenal** | **24** |
| Liverpool | 18 |
| Chelsea | 17 |
| Manchester United | **9** |

**United came LAST, by 2.7×** — and United is the club I had just built the
Indonesian page for. Assumption beaten by ten minutes of Trends.

⚠️ **Read the caveat before acting on it.** These are raw search TERMS and three
of the four are homonyms in Indonesia: "arsenal" is a common noun, "Liverpool" a
city, and **"Chelsea" is a very common Indonesian given name** (Chelsea Islan,
Chelsea Olivia). Only "Manchester United" is unambiguous — so United's 9 is
clean while the other three are inflated by non-football searches.

Two follow-ups, and the second one matters more:
- Re-running with unambiguous forms ("Man United", "Arsenal FC", "Liverpool FC")
  returned **too little volume to chart**. That is itself a finding: Indonesian
  searchers use the PLAIN club name, so the raw comparison is closer to the real
  query set than the confound suggests — but it also means ranking for
  "arsenal" in Indonesia means competing with every non-football meaning.
- **The query that actually matters is quiz-intent, not club-name**: "kuis
  Arsenal", "kuis Liverpool". Low individual volume, but it is what we would
  actually rank for. Check those before picking the next club.

**Practical call:** keep `/id/quiz/manchester-united/` — it is live, cost nothing
and is a clean control. Add Arsenal or Liverpool as the second Indonesian page,
because that is where the demand is.

### Method to reuse for every other market
`trends.google.com/trends/explore?date=today%2012-m&geo=<CC>&q=<club>,<club>,…`
Compare 4 clubs at a time, note homonyms in the local language, then sanity-check
with a quiz-intent query. **Do this BEFORE writing 22 questions**, not after.

### Priors still UNTESTED — do not build on these until Trends confirms
The selection logic for Asia is NOT "biggest global brand", which is why the
Indonesia result was a surprise. Per-market hooks worth testing:
- **Korea → Tottenham** (Son Heung-min). In bank, 42 Qs.
- **Thailand → Leicester** (King Power is Thai-owned). ⚠️ **NOT IN THE BANK** —
  needs a pack forged before a Thai page is even possible.
- **Japan → clubs with Japanese-player history**: United (Kagawa), Celtic
  (Nakamura), Brighton (Mitoma), Arsenal, Liverpool. All in bank.
- **Vietnam / HK / Taiwan → Premier League giants**, club TBC by Trends.
- **India → SKIP.** Fans are real but search in ENGLISH; the existing English
  pages already serve them. Same shape as the dead US thesis.
- **Mainland China → SKIP.** Baidu rules and an ICP licence effectively gates
  ranking; the app CTA also dead-ends (no Google Play). The reachable Chinese
  opportunity is **zh-Hant for HK/TW/SG/MY**, which are Google markets.

---

## 🌍 LOCALISATION STRATEGY (Alex's call, 2026-07-29) — both languages, always

**The model: a localised page is ADDITIVE, never a replacement.** Every club
keeps its English page at `/quiz/<slug>/`; the twin lives at
`/<lang>/quiz/<slug>/` and they point at each other via hreflang. Real Madrid
gets English AND Spanish, because both audiences are real and
"real madrid quiz" and "quiz del Real Madrid" are different queries with
different competition. Alex is right about this and the generator already does it.

**32 clubs are localisable TODAY** with questions already verified in the bank:

| Lang | Clubs we already have |
|---|---|
| es | Real Madrid 42 · Barcelona 42 · Atlético 49 · Sevilla 42 · Valencia 35 · Betis 39 · Boca 36 ✅ · River 38 ✅ |
| pt | Flamengo 36 ✅ · Corinthians 36 ✅ · Palmeiras 36 ✅ · Benfica 50 · Porto 38 |
| de | Bayern 43 · Dortmund 42 · Leverkusen 36 · Schalke 42 |
| it | Juventus 42 · Milan 44 · Napoli 42 · Roma 37 · Lazio 47 · Fiorentina 47 |
| tr | Galatasaray 45 · Fenerbahçe 38 · Beşiktaş 39 · Trabzonspor 45 |
| fr | Marseille 44 · Monaco 33 |
| nl | Ajax 43 · PSV 46 · Feyenoord 49 |

### ⚠️ Sequence by ENGLISH PROFICIENCY and SERP thinness — NOT fanbase size

This is the counter-intuitive part and it should drive the order. A localised
page only pays where the audience would otherwise **fail to find us**, or search
in a **thinner SERP**:

1. **Turkish (4 clubs) — likely the best opportunity in the whole table**, and
   the one nobody would guess. Fanatical audiences, lower English proficiency,
   and Turkish football-quiz SERPs are almost certainly thin. We already have all
   four Süper Lig clubs with 38-45 questions each.
2. **Portuguese + Spanish** — enormous volume, moderate competition.
3. **Italian** — decent volume, moderate proficiency.
4. **German / Dutch — LOWEST priority despite the big clubs.** Very high English
   proficiency means the incremental reach is small; those fans already find and
   read the English page. Bayern's fanbase size is a trap here.

### ⚠️ REGISTER, not just language — the trap to catch before scaling

`clubs-pt.mjs` is written in **Brazilian** Portuguese on purpose (goleiro,
técnico, zagueiro). **Benfica and Porto are European Portuguese** — writing them
in Brazilian would read as foreign to the exact Lisbon fan the page is courting.
Same split in Spanish: Boca and River are **Rioplatense** (sabés, arquero),
while Real Madrid and Barcelona need **Peninsular** (sabes, portero).

So the authoring rule is: pick the register from the CLUB's audience, not from
the language name. (hreflang stays plain `es`/`pt` per club — region codes only
become necessary if we ever localise the SAME club into two registers.)

### The gate before volume

Five pages is a clean experiment; forty is a systemic bet. And every localised
page currently dead-ends at an **English app** — which is fine as a measured
funnel leak at 5 pages and a real conversion problem at 40. The US localisation
thesis was already killed by data once (`project_us_egypt_gsc_2026_07_29`), so
the lesson is not "localisation is wrong" but "check before scaling".

**Recommended next step: ONE Turkish probe (Galatasaray), because it tests the
surprising hypothesis rather than the comfortable one.** Then read GSC on all
six and open the taps on whichever language actually converts.

---

## 🔴 FOUND 2026-07-29 LATE — Transfer Trail has NO web page

Footle has `/football-wordle/` plus `/football-wordle/answer` (the daily
traffic spigot). **Trail has nothing** — zero references in
`gen-seo-pages.mjs`, zero in the sitemap. A whole game mode with no search
surface, while its nearest sibling has two pages and a recurring one.

⚠️ **This needs a decision from Alex before it can be built, because the mode is
dark until 2026-09-01 and the anchor is still marked PROVISIONAL.** A page that
says "play today's Transfer Trail" would promise something that does not exist.

The argument for building it NOW anyway: a new URL on this domain takes weeks to
index and rank, so publishing ~5 weeks ahead means it is aged and indexed the
day Trail launches. The cost: publishing a date makes the anchor a public
commitment and it stops being provisional.

So: **Alex picks.** (a) publish now with an honest "starts 1 September" framing
and freeze the anchor for good, or (b) hold the page until launch and accept
starting from zero crawl age. Do not publish a launch date unilaterally.

---

## ⚠️ ONE DECISION WAITING ON ALEX

**Should `send_play_invite` accept "we were in the same room" as grounds to
notify?** Right now it raises `not friends` unless the two accounts are accepted
friends. That gate is correct as anti-spam — otherwise anyone could ping a
stranger by joining their room — but an online opponent normally arrives via a
shared LINK, so **the usual Rematch notifies nobody.** The client no longer
pretends otherwise (`d5e0026`: it now says "share the link to bring them back"),
but the loop still leaks at the last step. Widening it is a prod migration
touching a spam boundary, so it is Alex's call, not one to make unattended.

---

## HEALTH — verified 2026-07-29

- **Indexing is healthy.** 151 indexed / 18 not (queued + intentional
  canonicals); 56 known nine days ago. Sitemap 184 URLs, regenerating correctly,
  IndexNow pinging on prod deploys.
- **Nothing is broken.** Clean tree, tests green, zero build errors. The
  `webkit.messageHandlers` console error is NOT ours — proven in a clean room;
  it is injected by an extension or a social in-app webview.
- Bank 6,394 · 71 club pages · 25 player pages · 50 reference lists.
- ⚠️ **Transfer Trail is NOT live — this file said it was, and that was wrong.**
  Verified 2026-07-29 23:00: `TRAIL_ANCHOR_DAY = 20697` (2026-09-01) against
  today's day index 20663, so `getTrailNumber()` returns **-33**,
  `getTrailAnswer()` returns null, and the app correctly sends you home rather
  than render an empty board. The mode is DARK, exactly as the comment in
  `src/lib/trail.js` says. Built and verified, not launched.
  - Playthrough confirmed working (dev server, anchor temporarily patched then
    reverted): ladder reveals on each miss, wrong guesses strike through, club
    colours + real 3-letter codes, loans marked amber, unknown clubs fall back
    to a neutral chip, full reveal + "Got it on 3 clubs" + share.
  - 38 careers, schedule frozen 380 days. ⚠️ `TRAIL_ANCHOR_DAY` must NEVER move
    once a grid has been shared — it renumbers every share. **Repeats every 38
    days**, so forge a second roster wave before the anchor date.
  - ⚠️ **NEVER preview Trail by patching the anchor in a build that gets
    `cap sync`'d.** That is what nearly shipped Trail early this morning. Use
    the dev server + browser; the native bundle then cannot be contaminated.
    `node scripts/preflight-release.mjs` is the backstop, not the plan.
- **Profile picture is one thing now (7490c76):** upload a photo, or the Ball IQ
  ball. Emoji set removed — 6 of 108 profiles had ever used it, 10 had found the
  photo upload.
- **Onboarding is ONE screen (b4e095d).** The skill-level step wrote exactly one
  thing — `biq_settings.defaultDiff`, already in Settings, Classic-only — and
  asked people to self-assess before playing anything. Everyone starts on
  medium now, which is what skippers already got. The taster survives: it is the
  only screen between "opened the app" and "played something".
- **The rating prompt was quietly self-limiting (b4e095d).** `MAX_LIFETIME` was
  4, and `requestReview()` resolves identically whether iOS rendered the sheet
  or silently declined — so four invisible no-ops retired a user permanently,
  and the most engaged players were likeliest to burn all four on nothing. Now
  24; Apple's 3-per-365 is the real ceiling. It also used to stack the iOS
  rating card on top of our own notification sheet on a first-ever Footle solve;
  it now waits, and requires a solve on an earlier day.
  ⚠️ **Wiring is proven, DELIVERY is not.** In the Simulator and in any build
  not installed from the App Store or TestFlight, that sheet is a preview —
  tapping a star submits nothing. Only App Store Connect's ratings count can
  confirm. And it produces star RATINGS, not written reviews.
- **Footle's first-run explainer is gone (f684972).** Two of its five lines
  repeated the card you tapped to get there, two were Wordle's colour
  convention, and the fifth — "guesses must be a real footballer's surname" —
  was FALSE: `submitGuess` checks length and nothing else. Replaced with a
  legend strip above the grid that retires itself after the first guess.
- **Footle answers are 5-8 letters from #88 onward, mechanically.** All 16
  non-conforming answers are in the published past; #87 (RICE, today) is the
  last. The guard in `tests/unit/wordle-schedule.test.js` was verified by
  injecting a 4-letter future answer and watching it fail.
- **Club-page reflow DONE (94cda78).** Measured 13,953px (16.5 screens), not the
  12,200 this file claimed. "More quizzes to try" was 5,734px — 41% of the page
  and the single biggest block, for a LINK LIST. Compacted the tiles: 11,953px
  (14.2 screens), mesh -35%, all 115 links kept, 0 labels clipped. The biggest
  block on a club page is now the playable taster (39%), which is correct.
  Residual: 3 columns would save ~1,500px more but truncates club names —
  not worth degrading the anchor text.
- **Bank split SHIPPED (aca556f).** Browsing no longer loads the bank: the club
  and league pickers read a 46kB text-free index instead of 621kB, ~4× cheaper
  to parse, and the full parse now happens on real play intent rather than at
  t≈2s on Home. Watch Clarity's INP over the next few days — the fix is
  measured in V8 and reasoned about in the browser, not yet observed live.

---

## STANDING TRAPS — read before the obvious move

- **Verify by static `<title>`, never HTTP 200.** The SPA catch-all answers 200
  for any path, so 200 proves nothing about a generated page.
- **`rm -rf dist` before every `cap sync`** — sync serves a stale `dist/`
  otherwise and you debug a fix that never reached the binary.
- **A detector's first run is a hypothesis.** Three separate checks produced
  false positives on 2026-07-29 alone; 98% and 0% are both signals to check the
  method, not the code.
- **Search by content, not by planned name.** "Tottenham" found nothing because
  the bank says "Tottenham Hotspur"; three clubs were nearly re-built as missing.
- **`src/questions-index.js` is generated — never hand-edit, never reorder, never
  add question text to it.** Row order is load-bearing (the Daily 7 shuffles by
  array position, and `/c/` links assume every device agrees). It exists so
  browsing doesn't pay for playing; putting `q`/`o`/`hint` in it defeats the file.
  `npm run gen:index` regenerates; dev and build do it automatically.
- **JSON.parse on the bank makes things WORSE** — tried 2026-07-29, 779ms vs
  651ms and +286kB. The problem is volume, not encoding. Don't retry it.

---

## ⚠️ Mystery Player — data defects found on the simulator (2026-08-04, 00:35)

The mode is LIVE and the wordmark bug is fixed (`"mystery"` added to the
own-header exclusion list in App.jsx). The ALGORITHM is sound. The DATASET is
not — found by playing it, not by reading code. All unit tests pass.

Today's top 10 (answer = Kylian Mbappé, Real Madrid):

    1 Mbappé  2 Vinícius  3 Konaté  4 Mendy  5 Alan Pulido
    6 Mastantuono  7 Rodrygo  8 Alberto Abalde  9 Lunin  10 Alexander-Arnold

**Three defects, all in `scripts/fetch-squads.mjs` output:**

1. **Non-football sections are in the squads.** Alberto Abalde plays for Real
   Madrid *Baloncesto*. Same trap as Arsenal Women — Wikidata files a club's
   other sections under the same entity, and the `P21` men's filter does not
   exclude a men's basketball player. Alan Pulido has never been at Real Madrid.
   → Need a "is a association football player" constraint (P106 / sport P641),
   not just gender.

2. **`nat` is unreliable.** Rodrygo and Vinícius both come back **Spain**;
   Jobe Bellingham comes back **Ireland**. Players with multiple `P27` values
   get an arbitrary one. The `nat` scoring term is feeding on bad data.
   → Prefer national-team membership (P54 on a national side) over raw P27,
   or take the P27 with the preferred rank.

3. **Jude Bellingham is missing from the pool entirely** — a Real Madrid player
   who is one of the most guessable names in the game. Cause unknown; likely
   the `P580 >= 2015` + no-end-date filter combination. Diagnose before
   loosening anything, or the 175-player Arsenal comes back.

**Separately — a DESIGN weakness, not a bug (Alex spotted it):**

    players matching >=1 non-age attribute:  621 of 1539
    ranks 622-1539 are ordered by AGE ALONE = 918 players = 60% of the pool

With five booleans most pairs of footballers share nothing, so the bottom 60%
of the ranking is a birth-date sort. Alisson vs Mbappé scores 28.9 — pure age.
The grey "cold" band communicates it honestly, but a player comparing 900 to
1326 reads a difference that isn't there.

Proposal for Alex (do NOT ship unilaterally — item 2 is a football judgment):
  a. Partial credit, not exact-match-only: same confederation when not the same
     country; same big-five league when not the same league. Pulls most of the
     918 into a zone where the number carries signal.
  b. ⚠️ ALEX'S CALL: swap nationality above league country. Currently league
     (300) outranks nationality (220). "He's French too" is arguably a stronger
     read for a fan than "he also plays in Spain".
  c. Club stays dominant — the top 10 behaves correctly and that is where a
     real player spends their last guesses.

Bring (a)/(b) as before/after rankings, not as a shipped change.

### ✅ RESOLVED 2026-08-05 — and the real defect was worse than filed

All five items above are fixed and pushed. Two of the diagnoses in the section
above were WRONG, and the corrections matter more than the fixes:

**1. "Jude Bellingham missing" — he was never missing.** He is in the pool as
`Q66241169` under the label **"Jude Belligoal"**, which is the LIVE Wikidata
value, not a stale snapshot (alias vandalised to match). Searching our own data
for "Bellingham" found nothing, which is exactly why it read as absent.

⚠️ **The structural finding: Mystery Player renders text from a wiki anyone can
edit, with no review step, and the same strings ship inside the iOS and Android
binaries.** A football pun is the benign version of that. Footle and the Trail
both use curated name data; this mode skipped it. Now guarded by
`scripts/_name-overrides.mjs` + `scripts/fix-pool-names.mjs`, and by a unit test
that asserts a roster of household names is guessable.

**2. The career data was the big one, not the squads.** `fetch-careers.mjs` used
`wdt:P54` — the TRUTHY prefix, which returns only preferred-rank statements.
Rabiot came back as one club. 90% of scheduled answers had no career history, so
the 420-point shared-club term was dead; on the other 11% it was *corrupted*,
scoring national teams as clubs (Ben Old ranked 35, HOT GREEN, on a Chris Wood
puzzle for sharing New Zealand caps).

  national teams scored as clubs   1,894 -> 0
  answers with real career history    44 -> 384 of 400
  nationality values corrected                   404

⚠️ `fetch-squads.mjs` documents the OPPOSITE symptom of the same prefix (175
"current" Arsenal players). The rule is **rank, not recency, decides what truthy
means** — the old comment stated the half-truth and that is what made it
trustworthy-looking here.

**Label rules were tried and rejected three times, each caught by checking the
actual matches first:** `/national/` deletes Atlético Nacional, `/\bII\b/`
deletes Willem II, `/Academy/` deletes Ferenc Puskás Football Academy. All real
clubs. Exclusion is on the team's P31 CLASS, and the script prints every
excluded and kept class as an audit — which caught four classes my hand-written
pattern had missed.

**Found in passing, both fixed:**
- `gen-footle-practice.mjs` joined `["", "Volkan"]` to `" Volkan"`. 33 of the
  Footle pool are stored with an empty first-name slot (PELE, NEYMAR, RAUL,
  XAVI, CASEMIRO, VINICIUS…), so ~1 rotation in 12 shipped a leading space.
- `matchGuess` compared only the LAST name part, so every multi-word surname
  failed: "de Ligt", "van Dijk", "De Bruyne", "Di María" all matched nothing.
- `tests/unit/scoring.test.js` had been RED since the ladder extension (asserted
  "Legend" at 9999 XP). Nobody saw it because **`npm run build` runs eslint and
  the content audits but NOT vitest.** Now pinned to `LEVELS` itself.
  ⚠️ Consider adding vitest to the build chain — that is the actual gap.

**STILL OPEN — Alex's call, unchanged:** the weighting proposal (nationality 220
vs league country 300, plus partial credit for confederation). Now worth
re-measuring on the repaired data before deciding; the old numbers were taken
over corrupt inputs.

**Residual, documented not hidden:** ~370 uncapped players keep citizenship, so
an uncapped Englishman is "United Kingdom" and will not match a capped
"England". Needs place-of-birth (P19). Tolerable — the schedule is fame-weighted
and uncapped players are never the answer.

---

## 🔴 THE BOTTLENECK HAS MOVED — funnel re-measured against prod 2026-08-05

⚠️ **Supersedes "the bottleneck is activation, not distribution."** That was
true at 15%. It is not true now. Measured directly against prod.

### Activation by signup-week cohort

    Jul 06   16 signups   43.8%
    Jul 13   21 signups   33.3%   <- trough
    Jul 20   35 signups   74.3%
    Jul 27   22 signups   81.8%
    Aug 03   12 signups   66.7%   (partial week)

**The activation fix wave WORKED: 33% -> 82%.** Nobody had re-queried after
shipping it, so a successful fix went unrecognised for weeks. Re-measure after
shipping a fix; "we shipped it" is not "it worked".

### Retention is healthy too (81 players ever)

    returned on 2+ days     58 of 81   71.6%
    played on 7+ days       15
    active in last 7 days   41 of 81
    active in last 30 days  70 of 81
    average active days     4.1

### => THE CONSTRAINT IS NOW RAW SIGNUP VOLUME

~135 accounts, 20-35 signups a week. At ~80% activation and ~72% return, every
extra signup converts almost linearly. **Distribution is the lever, and it is
the one we have invested least in.**

⚠️ **MEASUREMENT TRAP — it changes the answer.** `scores` records only
survival/daily/classic/wc2026/chaos/legends. Footle, Club Quiz and League Quiz
write NOTHING to it, and Footle is the most-played mode (it lives in
`user_game_state.wordle_state`). Measuring activation from `scores` alone
undercounts by 5-11 points per cohort — it reports the latest cohort as 72.7%
when it is 81.8%. Always UNION `scores` with `user_game_state`
(wordle_state + daily_scores). The thing we measure least is what people do most.

### Priority order that follows from this (2026-08-05)

1. **Partnership pitch** — the only lever that MULTIPLIES signups rather than
   adding a page at a time, and it targets the real ceiling (authority, #51 vs
   #8). Blocked on: verifying the OneFootball + Flashscore quiz claims, and on
   Alex choosing to send. Sofascore is verified; the other two are NOT.
2. **Ship Android 1.5.0** — a whole store surface still on 1.4.1, with Mystery
   Player and Transfer Trail undelivered. iOS 1.5.0 is synced and staged behind
   1.4.0 (see the store section — do NOT withdraw 1.4.0; build 53 was never
   uploaded, so withdrawing buys nothing and costs the queue slot).
3. **Web pages for Mystery Player + Transfer Trail** — two finished games with
   no search surface. Same gap that left the Trail dark for days.
4. **Design audit across the screens** (Alex's ask). ⚠️ Refinement: activation
   is solved, so the leverage is no longer the in-app drop-off screens — it is
   the PRE-SIGNUP surface (marketing home, club pages, the path to account
   creation), because that is where the constraint now sits.
5. **Club-pack answer leaks (~17%)** — protects the 72% return rate rather than
   growing the top. Chunked verifiers structurally cannot see pair-leaks.

### ALEX WANTS (queued, not yet done)
A deeper read of these numbers and a plan to improve them further — e.g. where
the 20-35 weekly signups actually come from, and which surface converts best.
Needs a source/attribution query; `scores` will not answer it.

## Photo excellence pipeline (2026-08-10, evening — BINDING bar from Alex)
"One bad-resolution photo and nobody uses the builder twice." Rules: recent
(≤ ~1 yr), head-on, sharp, uniform face share (42%); anything less renders the
two-letter initials card, never a bad photo.
- [x] Centring bug fixed (clamped crops kept origin, drifted left/low — page + export)
- [x] `src/data/photoOverrides.json` — hand-curated last word; null = initials card
      (Lammens→Mar 2026 portrait, Cunha→Jun 2026; Mount/Heaven/Yoro→cards)
- [x] Two-letter monograms (MM/AH/LY) on page + export
- [x] Commons FULL-TEXT SEARCH harvest — DONE 2026-08-11/12: per-player search (130 monograms) + by-match series harvest; 167 summer-2026 portraits applied, 166 cut + uploaded to the bucket
- [ ] Mechanical quality gate in build-lineup-data: face px in source < threshold
      OR photo > ~1 yr old OR face unframeable at 42% → initials card
- [x] Contact-sheet eyeball pass — DONE: 894 cutouts + 353 squad crops + 312 top-fame active crops all eyeballed; 156 curated nulls total. Remaining: the fame TAIL (sheets 3-6) never reviewed
- [x] Mbeumo — RESOLVED as monogram: the occluded video frame is his ONLY recent Commons file; a bust-crop rescue clipped his head. Harvest re-checks weekly
- [x] P0-1 split-brain homepage — VERIFIED SMALLER than scanned: prerender h1/structure
      already matched; topped up the missing Scouting-Report promise (4b40a31)
- [x] P0-2 loop instrumentation — loop-hit logs in api/c|q|join|p + Clarity loopEvent()
      at 7 share/conversion sites (276e95c). Grep Vercel logs t:"loop-hit"
- [→] P0-3 partnership pitch — kit already existed (docs/PARTNERSHIP-PITCH.md); ALEX SENDS
- [x] P1 pack-size counts scrubbed from taster hero + bq-note + print page (e840042)
- [x] P1 terrace-verdict ladder on results/share card/share text (36e1017)
- [x] P2 "a 8-letter surname" grammar (0e7af15)
- [x] (same evening, pre-scan) Ball IQ Test mode killed (e19214f)
- next: send-it-back name capture · SEO beat-my-score share · streak unification (M)
- Alex decisions pending: guess-the-XI daily (vs builder bar) · Trail in daily loop ·
  mode-sprawl measurement before thinning

## 🎯 ALEX 2026-08-11: "Guess the club by emojis" mode — approved idea, build when time allows
Emoji rebus → name the club (e.g. 🔴👹 → Man United, ⚪👑 → Real Madrid).
Natural share artifact (the rebus IS the share); pairs with the daily-hub
packaging idea from the scan. Data: hand-curated emoji strings per club —
editorial fun, zero API risk, no licence exposure. Start with the 72 packs.

- [ ] TRAIL WAVE N (careers): 45 unique careers over a 397-day schedule = each
      returns ~fortnightly for daily players. Runway fine (into late 2027);
      VARIETY is the real gap. Forge +40 careers post-kickoff, same locked
      editorial rules, extend the frozen log deliberately.

## Guess the XI — pipeline state (2026-08-11 evening)
- [x] build-xi-pool.mjs: 10 verified XIs (5 UCL finals × both teams) — PLAYERS
      verified correct (Dida/Cafu Milan, Dudek/Carragher Liverpool, etc.)
- [x] XI club labels — FIXED 2026-08-12: derived from match infobox team1/team2; all 10 matches verified
- [x] WC/Euro parser — FIXED 2026-08-12: they write 'Substitutions:' not 'Substitutes:'. Pool now 20 XIs (5 UCL finals + 4 WC finals + Euro 2016)
- [ ] surname field breaks on Dutch names ("van der Sar" → "Sar") — match via
      the Footle normalizer against full display instead
- [x] XI spot-checks — FIXED: both Istanbul and Lusail now exit(1) when absent instead of skipping
- [ ] CI: flip e2e continue-on-error -> strict after two green runs on main
      (the 131-failure era ended 2026-08-11: env var + 12 stale specs + the
      zombie Test tile — see 832ee3c). Also: Alex may set VITE_SUPABASE_KEY
      as a repo secret and delete the in-repo fallback if preferred.

- [ ] CI e2e residue (post-831ee3c): runner subset shows 35/86 failing on
      expectNoCrash "console errors" — CI-environment console noise (likely
      network-dependent services on the runner), NOT the env-var class. Widen
      the console-error filter for CI or stub network calls; then the strict
      flip. Local full run remains 405/407.

## Senior-debugger pass (2026-08-25) — moderates
- [x] M1 Mystery rolled over at UTC midnight while its save key used the local
      date. FIXED a84d4c0. Every zone diverged (not just the Americas as the
      report said); UTC+12 and up were served YESTERDAY's puzzle all day, 189
      of 400 days sampled. Midday elsewhere unchanged — the archive does not
      move, only the rollover moment.
- [x] M2 Daily-only players were invisible: 8 prod accounts with 20+ solved
      puzzles read games_played = 0, which hid the friend stat grid, pinned
      them last on the leaderboard, and made the notification ask unreachable.
      FIXED a84d4c0 — all four daily modes now count.
- [x] M3 respondFriendRequest bare-awaited a query builder (resolves on error),
      so a failed accept showed "✓ Friend added" and dropped the request.
      FIXED a84d4c0.
- [ ] M2 residue — ALEX'S CALL: the 8 existing accounts start counting from
      their next daily; their historical 20+ needs a one-time prod write
      (games_played / correct_answers backfilled from `scores`). Not done —
      prod writes are yours to approve.
- [ ] M2 residue — PRODUCT CALL: the friends leaderboard sorts on total_score,
      which dailies deliberately do not feed (their `score` is attempts-used,
      lower-is-better — adding it would rank the worst players top). Sorting
      by XP instead would include daily players honestly.
- [x] m5 sign-out deleted push tokens for EVERY device on the platform —
      FIXED 0239565, scoped to this device's token. Safe because sign-in
      re-homes a token (verified against the deployed register_device_token).
- [x] m6 blind `onboarded_at` writes — FIXED 0239565. It was TWO sites, both
      using `.then(() => {})`.
- [x] MP add-friend failed silently to the player (found by the twin sweep, not
      on the original list) — FIXED 0239565. Highest-intent add-friend moment in
      the app and the friend loop is the weak number.
- [ ] Remaining minors: m7 greeting/countdown drift; m8 dead CSS; m9 "Report a
      problem" clipped by the sticky Next button. Plus unconfirmed U1-U5.

## Twin sweep (2026-08-25) — second implementations
Method: enumerate every Supabase call site, group by table+operation, inspect
the ones living in more than one file. 100 sites, 10 cross-file twins.
- [x] Guard landed: tests/unit/supabase-errors-checked.test.js — every write
      must open {data, error}; includes a floor assertion so a broken scanner
      fails loudly instead of reporting zero.
- [x] Verified CLEAN (recorded so nobody re-audits them): the four
      upsert_daily_* RPCs (App.jsx vs useAuth.jsx back-sync) both check error;
      notifications read-flag writes are deliberately best-effort.
- [ ] `.biq-nav` active state hardcodes #58CC02 twice instead of var(--accent).
      Same colour today, so it is drift not a bug — fold into the next CSS pass.
- [ ] `.home-stat-chip-desktop-only` has NO renderer: three rules across base,
      desktop reflow and the standalone mirror for an element no JSX produces.
      Concrete instance of m8.
- [ ] The two `notifications.update({read:true})` catches cannot fire (a query
      builder resolves on error). Behaviour is correct either way — the comment
      claims a mechanism that does not exist. Tidy, do not change behaviour.
- [ ] NEXT AXIS: the twins that hurt today were component-level, not table-level
      (App.jsx vs ProfileScreen, component vs pre-boot shell, mobile vs desktop
      results). Sweep duplicated USER-FACING COPY and duplicated localStorage
      key writers the same way.

## 2026-08-26 — morning session

### Landed
- [x] Trail schedule lapsed at midnight (day #24) and took the whole Vercel
      deploy down with it, so the previous night's four commits never reached
      players. Frozen via `npm run trail:freeze` (WERNER); deploy verified
      rendering, not just green. df258dc.
- [x] SEO outbound attribution was inverted: `h.indexOf('/play')` matched
      "https://play.google.com/..." at index 7, so every Play Store badge
      counted as a web-app conversion on 111 pages. Now decided on the resolved
      hostname, store branch first. a5bafbe.
- [x] `surface` was hardcoded to 'list-page' on all 111 pages while a correct
      path-derived version sat in another script block. Single-sourced.
- [x] 35 localised club pages printed "undefined →" as their app CTA
      (`c.playLabel` vs `cfg.playLabel`). Verified live: now "Jugar el quiz →".
- [x] List-page answer options rendered with no layout — they emit `.tl` letter
      badges but only the taster's bare `.to` had rules, so it read
      "AEintracht Frankfurt". OPTION_CSS(selector) now serves both.
- [x] Guard: tests/unit/seo-funnel-attribution.test.js, proven by breaking all
      three structural fixes in turn and watching it go red for each.
- [x] Corrected the activation figure everywhere (memory + question-bank skill).

### Open — measurement gaps, ranked
- [ ] **No `first-game-finished` event exists.** 60% of first sessions end at
      `first-game-started` and the data stops. Until this lands, no activation
      change can be evaluated. Smallest, highest-value item on this list.
- [ ] 94% of question reports (63 of 67) carry a NULL reason, and 41 point at
      questions never triaged. Highest-precision feedback channel in the
      product, discarding its payload. Capture a reason at report time.
- [ ] `challenge_events` has never recorded a row though its RPC is deployed —
      the /c/ Daily-7 measurement layer is inert.
- [ ] Web push cron has run 278 successful cycles against ZERO subscribers
      (`web_push_subscriptions` is empty). Either wire the subscribe path or
      stop the job.
- [ ] `club_quiz_results` has no `user_id` column, so the SEO surface — which
      out-plays the app roughly 2:1 — can never be joined to a signup.

### Open — needs Alex's call (migrations / product)
- [ ] MP history is deleted on a rolling 7 days by `reap_stale_rooms`, and
      `room_players` cascades. Roll up to an `mp_pairings` aggregate BEFORE the
      delete or the friend loop can never be measured. Do not just disable the
      job — it also force-ends abandoned lobbies.
- [ ] /lists pages have no visible route into the product at all: 0 of 50 carry
      a `/play` link, and both playable widgets end in nothing. The club engine
      already has the CTA ladder to copy. This is the 47%-of-impressions
      surface.
- [ ] 6 list pages have no playable element whatsoever (gated at groups >= 8).
- [ ] 76 `/questions/` pages are internally linked, live, and have zero
      playable content.
- [ ] Home says "up to 8 players"; the observed maximum in any room is 4.
      Capacity is designed, never demonstrated — 3+ device smoke test.
