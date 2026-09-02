# Ball IQ website critique — INTERIM (2026-09-02)

> **This is not the report.** It is the raw output of the lenses that have
> finished, assembled so it can be read. The iPhone Safari lens is still
> running and neither graded report has been written yet.
>
> ⚠️ **Nothing here has been adversarially verified** — the skeptic agents died
> with the first fleet's session limit. Two findings I re-measured myself in
> WebKit on prod are marked ✅ VERIFIED BY CLAUDE. Everything else is a
> hypothesis until reproduced.

## Lens grades

| Lens | Grade | Findings |
|---|---|---|
| Copy and voice — what the words actually do | **C+** | 9 |
| Desktop design critique (1440x900 and 1920x1080) | **B-** | 11 |
| Mobile design critique — and the Scouting Report conceit | **C+** | 9 |
| SEO surfaces as landing pages (/lists/* and /quiz/*) | **B-** | 6 |
| Strategy — what is this page FOR, and does it convert? | **C** | 8 |

**43 findings total** — 3 critical, 12 high, 16 medium, 12 low.

---

# 🔴 CRITICAL (3)

## The homepage never tells a stranger what Ball IQ is — the sentence that does exists, but only for the crawler
*Copy and voice — what the words actually do*

**What happens.** The rendered homepage is 399 words. Above the fold on iPhone Safari a first-time visitor reads, in order: 'Play free', 'FIVE QUESTIONS. / ONE HONEST VERDICT.', 'No account, no waiting. The report writes itself while you answer.', 'BALL IQ — SCOUTING REPORT', 'Subject: you · nothing filed yet', 'ASSESSMENT / 1 of 5', 'Premier League'. The word 'football' does not appear in prose until character 544 of body text, inside 'FOOTLE. FOOTBALL WORDLE.', which is below the fold on both 390x660 and 1440x900. The word 'quiz' appears exactly twice in the whole rendered page: once as the nav item 'Quizzes', once in the footer line 'Ball IQ — an independent football quiz. Made by one person.' 'soccer' appears zero times. Meanwhile the static block in index.html, which Google gets, carries 669 words opening 'How good is your football knowledge, really? Ball IQ is a free football quiz game. There is no sign-up and nothing to install — open it in a browser and you are playing in about ten seconds… Whether you call it football or soccer, the questions are the same.' After hydration that text is gone: I evaluated document.body.innerText for 'Ball IQ is a free football quiz game' and got false.

**Why it costs.** ~1,540 Google clicks/28d arrive cold, and 48% of new accounts never play anything. The visitor has to infer the category from a scouting-report metaphor with no referent. The one paragraph that would close that gap in eight words is already written, already approved, already shipped — and pointed at a crawler instead of a person.

**Fix.** Put one plain sentence between the h1 and the paper, replacing or joining the lede: 'Ball IQ is a free football quiz — five questions now, no account, no install.' Keep 'Five questions. One honest verdict.' as the headline; it is good. The static block already proves the sentence exists and passes the owner's taste; it just needs to be visible to humans.

<sub>Evidence: run2/run6 measurements: title 'Ball IQ — The Ultimate Football Quiz', rendered body 399 words, hasStatic=false, hasSoccer=false; 'football' first at char 544; 'quiz' 2 occurrences (nav + footer). Screenshots 02-home-fold-consent.png (iPhone, consent up) and 08-desktop-fold.png (1440x900). · confidence: measured</sub>

## The page for the North Star head term is 100% readable — zero playable elements, first play link 7.7 folds down  ✅ **VERIFIED BY CLAUDE**
*Strategy — what is this page FOR, and does it convert?*

**What happens.** /football-quiz/ — the page carrying the "football quiz" head term — renders, on a first visit in WebKit at 390x664, a breadcrumb, an H1, a five-line paragraph of prose, four static badge chips (FREE / NO SIGN-UP / ANSWERS EXPLAINED / 89 CLUBS), and then the consent bar. There is no header "Play free" button on this page (unlike the homepage) — only a hamburger. The page has exactly ONE element matching button with height>28px, and it is the nav toggle. The first link to anything playable sits at y=5117 on a 6811px document: 7.7 viewport-heights down. By contrast /quiz/arsenal/ carries a live taster (5 option buttons: "A Ian Wright", "B Thierry Henry"…) and its first play link is at y=1269.

**Why it costs.** Someone who googled "football quiz" and is comparing three tabs is handed a paragraph explaining that the answers are fact-checked. The established finding is that playable beats readable and that taster-less lists got 2.3s of attention. This page asks for a scroll of nearly eight screens before it offers a single thing to do, on the one term the whole authority strategy is aimed at.

**Fix.** Lift the taster component that already ships on /quiz/<club>/ and on leaf /lists/ pages and place it directly under the H1 on /football-quiz/, above the prose. Add the header "Play free" CTA that the homepage has. Zero new components — this is a placement change.

<sub>Evidence: d1-footballquiz-fold-firstvisit.png (WebKit, first visit, consent up). Measured: docH 6811, vh 664, first /play href at top=5117, first store href at top=5238, interactive buttons with height>28px = 1 (empty innerText, the hamburger). H2 outline: "Daily games @495", "Club quizzes @1159", "Think you know football? Prove it. @4970". · confidence: measured</sub>

## At the site's peak-intent moment, the primary CTA is an app-store install — and Footle is not offered at all  ✅ **VERIFIED BY CLAUDE**
*Strategy — what is this page FOR, and does it convert?*

**What happens.** A stranger who completes all five homepage taster questions reaches the verdict card. Its only two CTAs on iPhone, in DOM order, are: (1) "App Store" → apps.apple.com/gb/app/id6775975961, at y=772 h=52; (2) "Keep going in the browser — free" → /play, at y=834 h=52. The install button is first and visually primary. The browser option is generic /play, not /footle and not /play?game=footle. Footle — the mode 62 of 66 three-day-active players arrived through — appears nowhere in this block. The supporting copy sells the store ("The app is also the only version that can nudge you when tomorrow's puzzle drops").

**Why it costs.** The visitor is warm, engaged, in a working session, and about to be sent to a store listing to download, install, reopen and re-onboard. That is the classic install-interstitial leak, and it is being applied to a PWA that already works in the tab they are in. It also routes away from the one product measured to produce habit.

**Fix.** Make the primary verdict CTA "Play today's Footle →" pointing at /footle (which already loads straight into a playable board — see e1). Demote the store buttons to a secondary line below it. Keep the store copy; just stop making it the first thing.

<sub>Evidence: a3-taster-verdict-next.png (WebKit iPhone 13, consent declined, after answering all 5). Measured verdict CTA list: [{"t":"App Store","href":"https://apps.apple.com/gb/app/id6775975961","top":772},{"t":"Keep going in the browser — free","href":"/play","top":834}]. Verdict text captured in full. · confidence: measured</sub>

---

# 🟠 HIGH (12)

## On /lists/ the thing the searcher came for is 4.1-4.3 folds down, behind a 1,972px quiz block
*SEO surfaces as landing pages (/lists/* and /quiz/*)*

**What happens.** Measured on four /lists/ pages at 390x664: H1 at y=182, then the 'Think you know this? Five questions' taster section starts at y=560-637 and is 1,972-2,040px tall (five stacked questions, 23 option buttons), then a 'Reckon you can name them all?' game header, and only then the winners table at y=2,750-2,874 (ballon-dor 2,829; world-cup 2,750; PL top scorers 2,874; UCL 2,826). That is 4.1-4.3 viewports of scrolling. The taster copy literally says 'The full list is right below' but the only in-page anchor on the page is 'Skip to content -> #main'; there is no jump link to the table. Desktop 1440x900 WebKit: table at y=2,378 (2.6 folds). Document heights 7,420-11,231px (11-17 mobile folds) for a list of 23-71 rows.

**Why it costs.** Ground truth says text-only list pages average 2.3s dwell. A searcher for 'ballon d'or winners' who does not see a single winner within 2,750px of scrolling has no reason to stay; the page answers a different question (a quiz) before the one they typed. This is the on-page half of the 47%-impressions / 4%-clicks problem: it does not raise CTR, but it caps what any click is worth.

**Fix.** In scripts/seo/gen-seo-pages.mjs buildListPage(): render the table FIRST (directly under the intro, target y<700), then the 5-question taster, or at minimum add a real anchor ('Jump to the full list' -> #list) next to the H1 and make the 'The full list is right below' sentence a link to that anchor. Consider collapsing questions 2-5 of the taster behind the first answer so the block is ~450px not 1,972px.

<sub>Evidence: lists_ballon-dor-winners__full_consent.png (full page), lists_ballon-dor-winners__table_region_y2600.png, overflow.mjs output: tasterTop 637 / tasterH 1972 / tableTop 2829; sections.log MAIN CHILDREN y=637 h=1972 then y=2609. · confidence: measured</sub>

## List tables are 66-139px wider than the phone; the answer column is cut off with no scroll hint
*SEO surfaces as landing pages (/lists/* and /quiz/*)*

**What happens.** Table wrapper is 350px wide (left 20 to right 370) on the 390px viewport, but the tables measure 489px (ballon-dor), 477px (world-cup), 456px (UCL) and 416px (PL top scorers). Column boxes measured: on /lists/premier-league-top-scorers/ the GOALS column spans x=365-437, so 67 of its 72px are off-screen — the one number a 'golden boot winners' searcher wants. On /lists/world-cup-winners/ SCORE spans 317-390 (20px hidden) and HOST 390-498 is entirely hidden; on ballon-dor NATIONALITY (371-510) is entirely hidden. The wrapper is overflow-x:auto but there is no visual affordance (no fade, no 'swipe' text, no shadow) — scrollHint=false on all four. Rows are 71px tall on three of the four pages, so 70 rows = ~5,000px of table.

**Why it costs.** The table looks complete (it ends cleanly at the card edge in lists_ballon-dor-winners__table_region_y2600.png) so a reader has no cue that a fourth column exists; on the Golden Boot page the goals tally is effectively invisible on an iPhone.

**Fix.** In the /lists/ table CSS: at max-width 480px either drop to a 3-column layout (year / winner / one context column) and put the remaining fields on a second line inside the winner cell, or add a right-edge gradient fade plus a one-line 'swipe for more' hint on the wrapper. For PL top scorers specifically, move GOALS to column 2.

<sub>Evidence: overflow.mjs output: wrapW 350, tableW 489/477/456/416, hiddenPx 139/127/106/66, ths left/right coordinates, scrollHint false x4; lists_ballon-dor-winners__table_region_y2600.png shows YEAR/WINNER/CLUB(S) only. · confidence: measured</sub>

## Every 'Next question' tap lands with the new question above the viewport
*Mobile design critique — and the Scouting Report conceit*

**What happens.** Consent dismissed. Answer Q1, tap Next question (which sits at y=951 in a 635px viewport, so the user has scrolled to it, scrollY≈660). Question 2 mounts, the Why panel + Next block (~194px) unmount, the document shortens, scrollY stays at 660: .sr-q now spans viewport top −187 to −99 and option A is at −85 to −33. The user is looking at options C 'Inter' and D 'Napoli' and the not-assessed ledger with no question visible. Re-measured at 300ms, 1s and 3s after the tap: identical, so this is settled layout, not animation. Same at 390x664 (q top −173, option A −71). Reproduces on all four transitions (flow log: qTop −162 to −187 each time).

**Why it costs.** 100% of visitors who play past Q1 get this four times; the first thing they see after committing is a set of answers with no question. On a page whose whole promise is 'the report writes itself while you answer', the answering step itself breaks. Ground truth: ~48% of new accounts never play anything — this is friction inside the one taster that is supposed to convert them.

**Fix.** In src/marketing/ScoutingReport.jsx, in the `next` handler (there is no scrollIntoView anywhere in the file — grep confirmed), after setting the new index call `document.querySelector('.sr-ab')?.scrollIntoView({block:'start', behavior:'smooth'})` on the next frame; or reserve the height so the layout never collapses: give .sr-abody a min-height equal to its answered state (question + 4 options + why + next). Either change fixes all four transitions.

<sub>Evidence: 375x812-15-viewport-after-next-q1.png, 375x812-17-after-next-q1-settled.png (both show 'Inter / Napoli' at the top with no question), m2-flow.json (qTop −187/−162/−162/−162), audit4 output (t+300/1000/3000 all scrollY 660, qTop −187). · confidence: measured</sub>

## First-time visitor sees zero answer options: 133px mast + 172px consent bar squeeze the question out of the fold
*Mobile design critique — and the Scouting Report conceit*

**What happens.** First visit, consent up, 375x635: mast occupies 0–133 (21% of the fold), h1 155–221, lede 235–297, letterhead 319–380, Assessment band 395–432, 'Premier League' 446–467, then the consent bar covers 463–635. The question text (.sr-q, 473–560) is 100% under the bar; option A is at 574. At 390x664 the bar starts at 492 so 19px of the question's first line peeks out; options are still fully covered. What is visible is the frame of a quiz — headline, letterhead, 'ASSESSMENT 1 of 5', a department name — and no quiz.

**Why it costs.** Every new EU visitor's first paint has nothing to tap that plays football. 'Playable beats readable' is the site's own measured law and the homepage fails it on first paint at both sizes. The known 'consent covers Next' class is confirmed here with numbers — but the mast is the half the owner controls: 60px of it is a second nav row.

**Fix.** Two independent levers, both in src/marketing/ScoutingReport.jsx CSS: (1) collapse .sr-mast to one row under 700px — put Games/Quizzes/Discover in the same row as the mark with Play free, or drop the nav row into a single 'Menu' button; that alone returns ~60px and brings option A to y≈514, above a 492px bar at 390 and 51px under it at 375. (2) Reduce .sr-open padding (22px 28px) and the 14px lede top margin on mobile, or set the letterhead to a single line ('Scouting report · Subject: you'), to recover another ~40px. Together the first option clears the bar on both devices.

<sub>Evidence: 375x812-01-fold-firstvisit.png, 390x844-01-fold-firstvisit.png (only 'Premier League' visible above the bar), measure-375x812-firstvisit.json (consent y=463.4 h=171.6; .sr-q y=473.1 h=87.5; .sr-opt y=574.5; .sr-mast h=133), measure-390x844-firstvisit.json (consent y=492.4). · confidence: measured</sub>

## Lists page: the sticky 'Type a name…' bar scrolls under the sticky header and becomes unclickable
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** On /lists/ballon-dor-winners/ the 'Reckon you can name them all?' input sits in a div with position:sticky; top:0; z-index:5. The site header is position:sticky, 71px tall, z-index:100. Once the 70-row table is scrolled, the input is at viewport y=11-53, entirely inside the header's 0-71 band; document.elementFromPoint at the input's centre returns BUTTON.nav-top (the header's Games button), i.e. the input is painted behind the header and cannot be clicked. The '0 found' / 'Give up' controls are hidden the same way.

**Why it costs.** /lists is 47% of Google impressions and averages 2.3s dwell; the name-them-all game is the one playable thing on the page, and it vanishes for the entire 3,333px table scroll (6.3 folds at 900px) on desktop.

**Fix.** In the lists page CSS give the sticky wrapper `top: var(--biq-header-h, 71px)` (or raise it above the header with `z-index: 101` and a solid background). Verify by scrolling to row 1990 and clicking the input.

<sub>Evidence: lists@1440-sticky-under-header.png (input ghosted behind Games/Quizzes/Discover); measured: input top 11 bottom 53, sticky top 0px z 5, header sticky 0-71 z 100, hitAtInputCentre=BUTTON.nav-top · confidence: measured</sub>

## Club quiz 'More quizzes to try' truncates 29 of 134 club names in 116px tiles at 1440
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** The related-quiz grid renders 116x65px tiles in a 9-column grid inside a 1112px container with line-clamp on the name. 29 of 134 tiles overflow (scrollWidth > clientWidth) and show ellipses: 'Manch… United quiz', 'Manch… City quiz', 'Tottenh… Hotspur', 'Newca… United', 'Barcelo… quiz', 'Galatas… quiz', 'Fenerb… quiz', 'Borussia Dortmu…'. Identical at 1920 because the container is capped at 1200px.

**Why it costs.** This is the internal-link block on the pages that already rank top-10 for 'X quiz with answers'; on a 1440px screen with 1112px available, Manchester United and Barcelona are unreadable as names.

**Fix.** In the club-quiz page stylesheet change the related grid to `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` at >=1024px and drop the ' quiz' suffix from the tile label (it is the same on all 134), which also removes the line-clamp need.

<sub>Evidence: arsenal@1440-chips.png; measured tile 116x65, 134 tiles, 29 truncated (scrollWidth > clientWidth), all tiles carry text-overflow:ellipsis/line-clamp · confidence: measured</sub>

## 'KEEP THIS REPORT' keeps nothing, and hands the reader to the opposite voice
*Copy and voice — what the words actually do*

**What happens.** After answering five questions you get a verdict panel headed 'KEEP THIS REPORT' with the copy 'The full test scores you 60 to 160 and remembers it.' The panel's browser CTA reads 'Keep going in the browser — free' and points to /play. I pressed it on iPhone WebKit: the destination is https://balliq.app/play, document.querySelector('.sr-verd') is null — the report is discarded — and the screen that replaces it says 'Quick one — give it a go ⚽' followed by 'Who has scored the most goals in men's international football? / Lionel Messi / Cristiano Ronaldo / Pelé / Neymar'. Two failures in one tap. The verb is false: 'keep' keeps nothing, and 'remembers it' is contradicted three seconds later. And the register inverts — a clinical, cold-eyed dossier that just delivered 'You do not follow the archive' hands off to a chummy emoji greeting and a gimme. ScoutingReport.jsx's own comment says a taster promising an honest verdict 'cannot open with a free point'; the app it hands you to opens with exactly that.

**Why it costs.** The taster is the site's strongest asset and its whole job is to make the next tap feel continuous. Instead the tap erases the thing the reader just earned and restarts them at a lower difficulty in a different voice — the classic point where a warm visitor decides this is not for them. Footle is the retention engine (62 of 66 players reaching 3+ active days came via it), so squandering the one moment the visitor is warmest is expensive.

**Fix.** Two separable fixes. (a) Copy: if the report cannot travel, stop saying it can — 'Take the full test' / 'The full test scores you 60 to 160 and keeps it from here on'. (b) Better: pass the taster score through to /play and open with 'Two of five. Let's do this properly.' instead of the Messi question. At minimum, suppress the 'Quick one — give it a go ⚽' warm-up for anyone arriving from the taster; they have already warmed up.

<sub>Evidence: run4.mjs: after clicking a.sr-webbtn — URL https://balliq.app/play, report still present? false, body text 'Quick one — give it a go ⚽ Who has scored the most goals in men's international football?'. Screenshot 05-after-keep-report.png. Verdict panel text captured in run3.mjs. · confidence: measured</sub>

## Club pages: the primary CTA drops the club, and the right URL is on the same page
*Copy and voice — what the words actually do*

**What happens.** On /quiz/arsenal/ the main conversion button reads 'Play free in your browser →' under the heading 'Think you know Arsenal? Prove it.' It points at bare /play. I pressed it: the destination is the generic warm-up, 'Quick one — give it a go ⚽ / Who has scored the most goals in men's international football?' — no Arsenal. The correctly-scoped URL is already used elsewhere on the very same page: /play?club=arsenal, which I loaded twice and which serves a real Arsenal set ('On his 2012 loan return to Arsenal, Thierry Henry marked his second debut with a winning goal against which club in the FA Cup?', 'Who assisted Olivier Giroud's scorpion kick for Arsenal vs Crystal Palace on New Year's Day 2017?').

**Why it costs.** Club terms are the site's best-ranked queries ('arsenal quiz' at position 7.9 on 1,081 impressions). Someone who searched for an Arsenal quiz, played the taster, and pressed a button promising more is asked about Messi. The copy said 'Prove it' about Arsenal and the product changed the subject. This is a one-character href fix on ~124 generated pages.

**Fix.** Point the hero/taster CTA at /play?club=<slug> — the same href the topic tiles already use. If a generic warm-up must remain, at least make it a question about the club the reader came for.

<sub>Evidence: run7.mjs: 'Play free in your browser → -> https://balliq.app/play'; after click URL https://balliq.app/play with the Messi warm-up. run8.mjs: /play?club=arsenal returns Arsenal questions. Screenshot 09-club-cta-dest.png. · confidence: measured</sub>

## Six labelled 'ways in' on every club page are six different promises pointing at one identical destination
*Copy and voice — what the words actually do*

**What happens.** Under 'What the Arsenal quiz covers' the page presents six tappable cards, each with its own promise: 'Club history — Founding, golden eras and the moments that shaped Arsenal.' / 'Players & legends — Cult heroes and record-breakers, past and present.' / 'Managers — The bosses in the dugout and the trophies they won.' / 'Trophies & honours — Every title, cup and big European night that counts.' / 'Records & stats — Appearances, goals, transfers and all-time bests.' / 'Iconic moments — Famous games, comebacks and unforgettable goals.' All six href to the identical URL, /play?club=arsenal, and all six therefore serve the same undifferentiated club pool — I loaded it twice and got a Henry FA Cup question and a Giroud assist question, neither of which is 'Managers'.

**Why it costs.** This is the copy bug class that has shipped twice already: a verb (or here, a category label) that does not match what pressing it does. A reader who taps 'Managers' expecting a manager round and gets a random Henry question learns the labels are decoration. It also makes the section read as filled-in SEO scaffolding rather than a real table of contents, which is the impression the whole 'hand-checked' voice is trying to avoid.

**Fix.** Either wire the tiles to a real topic filter (/play?club=arsenal&topic=managers) or stop making them links. As static, non-clickable descriptive copy under 'What the Arsenal quiz covers' the same six lines are honest and useful — the failure is entirely in making them promise navigation.

<sub>Evidence: run8.mjs DOORS output: all six anchors resolve to https://balliq.app/play?club=arsenal. Screenshot 10-club-six-doors.png shows the section heading and the first two cards. · confidence: measured</sub>

## A visitor who says yes to playing is asked a SIXTH taster question, then a full-screen modal, then a banner — 14 taps from landing to Footle
*Strategy — what is this page FOR, and does it convert?*

**What happens.** Walking the continuous path in one WebKit session: 10 taps to complete the homepage taster (5 answers + 5 "Next question"), 1 tap on "Keep going in the browser — free". This lands on /play — which immediately presents ANOTHER single-question taster, "Quick one — give it a go ⚽ / Who has scored the most goals in men's international football?" with Skip and Start playing. Answering it and tapping Start playing (2 more taps) produces the app home, which is instantly covered by a full-screen EXAMPLE scouting-card modal ("85 OVERALL GOLD… Start building mine") stacked on top of a "Welcome to Ball IQ! Start with today's Footle" banner. The Footle card the banner points at is completely obscured by the modal. Dismissing that and tapping Footle's Play is tap 14.

**Why it costs.** The visitor has just proved intent by answering five questions and explicitly choosing "keep going". They are then asked to prove it again, then shown an aspirational example of someone else's score before being allowed to touch the product. With 48% of new accounts never playing anything, this stack sits exactly where that leak would occur. (This is NOT the already-fixed profile example-card CTA bug — that was about where the button went; this is about the interstitial existing at this moment at all.)

**Fix.** Pass a flag when arriving at /play from the homepage taster (e.g. /play?from=report) and skip the /play onboarding question and the example-card modal for that visitor. They have already seen a taster and already seen a scorecard. Land them on the app home with the Footle card unobstructed.

<sub>Evidence: c1-play-firstscreen.png (the sixth taster question), c3-after-startplaying.png (EXAMPLE modal over the welcome banner and over the Footle card). Measured tap count 14, WebKit iPhone 13, consent declined, single continuous session. · confidence: measured</sub>

## Club pages put the store buttons above the play button — directly under a sentence that says "Play in your browser"
*Strategy — what is this page FOR, and does it convert?*

**What happens.** On /quiz/arsenal/, the intro paragraph ends "...Play in your browser." Immediately beneath it, at y=848, sit two large black App Store and Google Play buttons. The actual green "Play free in your browser →" CTA is 421px further down at y=1269. Measured across the club template: firstStoreTop 848 < firstPlayTop 1269.

**Why it costs.** These are the pages already ranking top-10 on "<club> quiz with answers" — the strongest organic asset. The first button an arriving fan meets is one that ejects them to an app store, contradicting the sentence directly above it. The visitor who takes it leaves a working session for a 100MB download.

**Fix.** Swap the order in the club template: green "Play free in your browser →" first, store buttons as a quieter secondary row beneath. Same components, reversed.

<sub>Evidence: d2-arsenal-store-before-play.png (WebKit iPhone 13, consent declined, scrolled to y=700). Measured on /quiz/arsenal/: firstStoreTop=848, firstPlayTop=1269, docH=5782. · confidence: measured</sub>

## The Daily 7 landing page never deep-links the Daily 7 — its only above-fold CTAs are the two app stores
*Strategy — what is this page FOR, and does it convert?*

**What happens.** On /daily-football-quiz/ the above-the-fold CTAs are, apart from the header, "Download on the App Store" and "Get it on Google Play" (store link at y=377). The page has 13 links total and no taster (no interactive option buttons). Its rendered play links are: header "Play free" → /play (y=0), and "Play free in your browser →" → /play at y=2849 (fold 4.3). No rendered anchor points at /play?game=daily — the page describing the Daily 7 never sends anyone into the Daily 7.

**Why it costs.** The Daily 7 is one half of the habit loop (it resets at midnight alongside Footle). Its dedicated SEO page sells an app-store download before it offers the game, and when it finally does offer the game 4+ folds down it dumps the visitor at the generic app home rather than at the daily they came for.

**Fix.** Add "Play today's Daily 7 →" pointing at /play?game=daily directly under the H1, above the store buttons — mirroring what /football-wordle/ already does correctly with "Play today's Footle → ↓" at fold 1.

<sub>Evidence: Measured on /daily-football-quiz/ (WebKit iPhone 13, consent declined): vh 664, docH 4382, rendered play links = ["Play free"→/play @0, "Get it on Google Play" @377, "Play free in your browser →"→/play @2849, store @3023]. Total anchors in main = 13; interactive option buttons = 0. Compare /football-wordle/, same run: above-fold CTAs include "Play today's Footle → ↓" → /play?game=footle. · confidence: measured</sub>

---

# 🟡 MEDIUM (16)

## Zero localised /lists/ pages exist, while 46 localised /quiz/ pages do
*SEO surfaces as landing pages (/lists/* and /quiz/*)*

**What happens.** sitemap.xml (255 URLs) contains 51 /lists/ URLs and 0 under any /xx/lists/ prefix, versus 46 localised /xx/quiz/ URLs (es 11, it 9, pt 8, fr 5, nl 4, de 4, id 3, tr 2). Confirmed by a second route: GET /es/lists/, /es/lists/ballon-dor-winners/ and /tr/lists/super-lig-champions/ all return HTTP 404 'Page not found — Ball IQ'. The English /lists/ pages also carry 0 hreflang links (curl grep), whereas /quiz/arsenal/ carries en/id/x-default.

**Why it costs.** Memory notes (prior measurement, not re-measured this session) say localised club pages convert 2.6x and that the Netherlands and Nordics show thousands of impressions with no locale; lists like Eredivisie champions, Süper Lig top scorers and Primeira Liga top scorers are exactly the second-tier competitions that reach page 1, yet they are English-only.

**Fix.** Extend buildListPage() to accept a locale and generate /nl/lists/eredivisie-champions/, /tr/lists/super-lig-champions/, /pt/lists/primeira-liga-champions/ (start with the 6 lists already on page 1), with reciprocal hreflang on the English page.

<sub>Evidence: urls.txt from sitemap.xml (grep counts 51 / 0 / 46); curl status lines in the localised-lists check (404 x3). · confidence: measured</sub>

## First-visit fold on /lists/ contains no tappable football at all; the consent bar covers y=492-664 on top of that
*SEO surfaces as landing pages (/lists/* and /quiz/*)*

**What happens.** On all four /lists/ pages the count of non-navigation tappables in the first 664px is 0 (the only tappables are Skip, logo, menu, Home, Football lists). First-visit fold = breadcrumb, H1, '70 entries · verified 2026-07-20' meta line and the opening paragraph; the #biq-consent bar (position:fixed, 172px tall, z-index 2147483000) then covers the bottom 26% of the viewport (y=492-664) so the visible page is 425px of prose. The first football tappable is option A of question 1 at y=810-909 (1.2-1.4 folds). Club pages by comparison have 3-4 answer buttons in the same 664px (arsenal 4, liverpool 4, premier-league 3, river-plate 3, galatasaray 3), though options B-D on club pages sit under the consent bar (already known). This confirms and quantifies the already-known 'no tappable football above the fold' item; the new number is that it is exactly 0 on every list page sampled.

**Why it costs.** Nothing to do in the first screen on a 2.3s-dwell page type.

**Fix.** Move the first taster question (or the table's first 5 rows) above the intro paragraph so at least one football tappable lands under y=490 (above the consent bar) on a 664px viewport.

<sub>Evidence: lists_ballon-dor-winners__fold_consent.png, lists_world-cup-winners__fold_consent.png; results.json taps (first non-nav tappable y=909/835/886/810); consent rect top 492 h 172. · confidence: measured</sub>

## Games dropdown is 105px wide and its labels spill over the headline
*Mobile design critique — and the Scouting Report conceit*

**What happens.** Tap Games: .sr-drop renders at 22,118 size 105x221 with 7px padding. Anchors are white-space:nowrap in a container with overflow:visible; 'Footle — football Wordle' has scrollWidth 174px in an 89px box, 'Mystery Player' 110px, 'Transfer Trail' and 'Guess the XI' 97px. The text runs outside the dark panel across 'FIVE QUESTIONS.' in the h1. Same at 390 (94px box). Row height 41px (<44).

**Why it costs.** The first thing a curious visitor taps in the nav renders as a broken overlay: four of five labels overflow, and the one that names Footle — the retention engine — is the worst clipped. It reads as a bug within one tap of arrival.

**Fix.** In the .sr-drop rule (ScoutingReport.jsx CSS): `min-width:max-content` (or width:auto) and on ≤700px make it `left:22px; right:22px; width:auto` so it spans the mast; set anchor padding to 12px 14px to reach 44px rows. Screenshot 375x812-08-nav-games-open.png shows the overflow.

<sub>Evidence: 375x812-08-nav-games-open.png; audit3 output: drop items [label, clientWidth, scrollWidth] = ['Footle — football Wordle',89,174], ['Mystery Player',89,110], ['Transfer Trail',89,97], ['Guess the XI',89,97], nowrap, overflow visible; m2-navopen.json (.sr-drop w=105.2, item h=41). · confidence: measured</sub>

## The Scouting Report conceit: keep the letterhead, drop the five-row 'not assessed' ledger before play
*Mobile design critique — and the Scouting Report conceit*

**What happens.** Pre-answer, .sr-file is 736.5px tall. The letterhead ('BALL IQ — SCOUTING REPORT' 12px/1.56px tracking + 'Subject: you · nothing filed yet' 13.5px at 6.11:1) is 61px. The stub (.sr-stubwrap) is 209.5px — 28.4% of the slab — holding five 32.9px rows that all read 'not assessed' in the muted rgb(74,82,76) at 13.5px. It sits at y=846–1056, i.e. it is the entire second screen on a 635px device (375x812-03-fold1-firstvisit.png shows it as the only content under the consent bar), and it pushes the Footle band start to y=1132 (1.78 viewports down). After one answer it shows '0 of 1' + four 'not assessed'. At the verdict the same table leads the slab and the 102px score comes second (375x812-11-verdict-slab.png), and the post-answer scroll lands at 466 with the letterhead off-screen.

**Why it costs.** Straight answer requested: the letterhead earns its 61px — it is the framing device, it updates ('1 of 5 filed', 'verdict filed — passer-by'), and it costs one line. The pre-play ledger does not. It is 210px and a full mobile screen of five negatives shown to someone who has done nothing yet — 'not assessed' x5 plus 'nothing filed yet' is six null statements before the first tap. The pale slab does not 'fight' the dark page: it is the only light surface on the page and it is where the question lives, so the 16.2:1 step is doing correct work — the sheet-shadow (0 18px 50px rgba(0,0,0,.55)) is invisible on rgb(10,10,10) but nothing is lost. The cost is pixels and mood, not the paper.

**Fix.** (1) Do not render .sr-stubwrap until `filed >= 1`; instead render one caption line under the assessment ('Filed so far: 0 of 5 · Premier League, Euros, Transfers, Champions League, Legends') so the promise of the ledger is kept in 21px instead of 210px. (2) From the first answer, grow the table one row at a time (only the filed disciplines), which turns it into the 'report writing itself' the lede promises. (3) In the verdict, move .sr-score/.sr-band above the table so the payoff leads, and scroll to the letterhead (block:'start') when the verdict mounts.

<sub>Evidence: 375x812-05-report-slab.png, 375x812-03-fold1-firstvisit.png, 375x812-11-verdict-slab.png; measure-375x812-firstvisit.json (.sr-file h=736.5, .sr-stubwrap y=846.5 h=209.5, .sr-stub h=164.5, rows 32.9px, .sr-out 13.5px 6.6:1, .sr-lh h=60.7); m2-base.json (.fb y=1132); m2-verdict.json (scrollY 466, .sr-score y=402 h=75.5 after the table). · confidence: measured</sub>

## Headline scale is flat: h1 35px vs three h2s at 32px, all uppercase Archivo Narrow
*Mobile design critique — and the Scouting Report conceit*

**What happens.** --ty-headline resolves to 35px on mobile (clamp min) and --ty-section to 32px: the h1 'FIVE QUESTIONS. ONE HONEST VERDICT.' is 35px/33px lh, while 'FOOTLE. FOOTBALL WORDLE.', 'EIGHTY-NINE CLUBS ON FILE' and 'COMMON QUESTIONS' are 32px/31px — 91% of the h1, same weight (700), same face, same uppercase, same −0.02em tracking. On the full-page capture the page reads as four equal headline moments (375x812-02-full-firstvisit.png). Type census: 14 distinct sizes in use, seven of them between 12 and 18px (12, 12.5, 13.5, 14, 15, 16, 17, 18) with 15px/400 used 106 times and 13.5px/400 98 times.

**Why it costs.** The hero does not announce itself as the hero on the device where 100% of the fold is vertical; the reader scanning down meets three more 'headlines' of the same voltage and the page loses the dossier's single-subject feel. The 12–18px wobble means labels, metas and body sit at half-steps that read as inconsistency rather than a scale.

**Fix.** In src/design/report.css: raise the mobile floor of --ty-headline to clamp(44px,5vw,64px) (at 375 wide the two-line h1 still fits: 'ONE HONEST VERDICT.' is ~319px at 35px, ~400px at 44px — so break to three lines or let it wrap; alternatively 42px), and drop --ty-section's floor to 28px. Collapse 12.5→12 and 13.5/14→13 or 15 so the small end has three sizes (12 label, 15 secondary, 17 body).

<sub>Evidence: measure-375x812-firstvisit.json (.sr-h1 35px/33.25px; .sr-h2 32px/31.36px), m2-base.json (.fb-h2 32px; typeCensus 17 size/weight combos), report.css line 5 (--ty-headline clamp(35px…), --ty-section clamp(32px…)), 375x812-02-full-firstvisit.png. · confidence: measured</sub>

## Verdict has no primary action: two identical outline buttons at the payoff
*Mobile design critique — and the Scouting Report conceit*

**What happens.** After the fifth answer the slab ends with .sr-a 'App Store' (303x52, ink outline, transparent) and .sr-webbtn 'Keep going in the browser — free' (303x52, ink outline, transparent) — same size, same weight (15px/700), same border, stacked 10px apart. The only filled-ink button in the system, 'Next question', is gone. No green appears anywhere on the paper (standing rule: action on paper is ink).

**Why it costs.** At the one moment the page has earned a decision, it presents two equals and lets the user choose neither. Given 62 of 66 retained players arrived via Footle and the Footle door is 1,100px further down, the verdict's CTAs also point away from the retention engine — that is a funnel observation, labelled inference; the design fact is the absence of hierarchy.

**Fix.** Make the intended primary a filled-ink button (reuse the .sr-next style: bg var(--ink), color var(--pa)) and leave the other as outline. If the goal is retention rather than install, the filled one should be 'Play today's Footle' (href /footle) with the store link secondary; if the goal is install, keep App Store filled. Either way one of them must be filled.

<sub>Evidence: 375x812-11-verdict-slab.png, 375x812-12-verdict-fold-top.png; m2-verdict.json (.sr-a and .sr-webbtn both 303x52, color rgb(20,23,26), transparent bg; allCtas shows only two green buttons on the whole page at y=14 and y=2054.7). · confidence: measured</sub>

## Primary CTAs have no hover state on desktop
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** Computed style (color, background, transform, box-shadow, filter, text-decoration) is byte-identical before and after mouse hover on: header 'Play free' (home, both viewports), 'Play today's Footle', 'Play the Daily 7', the orange banner's 'Play free in your browser →' and its App Store / Google Play badges (arsenal + footle pages). By contrast nav buttons (Games: text #98A199 → #F0F1F5) and answer options (#E7E9E4 → #DEE1DB) do respond, so the pattern exists but was not applied to the buttons that matter.

**Why it costs.** On a pointer device the only buttons that give no feedback are the ones that start a game or install the app; 48% of new accounts never play, and the desktop CTA reads as a static badge.

**Fix.** Add one rule to the shared button styles, e.g. `.btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px)} .btn-primary:active{transform:none}` covering the home 'Play free'/'Play today's Footle'/'Play the Daily 7' classes and the .sec CTA banner button + badges.

<sub>Evidence: results.json hovers: home 'Play free' b4==af (rgb(6,35,12)|rgb(88,204,2)…) at 1440 and 1920; 'Play today' b4==af; arsenal 'Play free in your browser →' and orange-banner badges in the unchanged list; nav Games changed · confidence: measured</sub>

## /football-wordle/ game card is a 560px mobile card stranded in a 1112px column (552px dead void)
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** .fw-card has max-width:560px, left-aligned at x=164 inside a 1112px section; the right 552px is empty at both 1440 and 1920 (void identical because the container caps at 1200). The hint block directly above ('If you guessed Laporte…') is the full 1112px, so the right edge jumps by 552px between adjacent blocks. The board tiles are 55px, keys 48x48 — phone sizes. The homepage already solves this with a 2-col grid (board left, legend + countdown right).

**Why it costs.** Footle is the retention engine (62 of 66 players with 3+ active days came through it) and this is its SEO landing page; on a laptop the playable part occupies 39% of the content width beside a hole.

**Fix.** Reuse the homepage's fb-cols pattern on /football-wordle/: at >=1024px make .fw-wrap a 2-col grid (`grid-template-columns: 560px 1fr; gap: 48px`) and move the legend, 'How to play' steps and the 'today's Footle' link into the right column; cap the hint block to the same 560px or span both columns deliberately.

<sub>Evidence: footle@1440-card.png, footle@1920-fold-consent.png; measured card left 164 width 560 max-width 560px, wrap width 1112, voidRight 552, hint width 1112, tile 55px, key 48x48 · confidence: measured</sub>

## Two design systems ship side by side: homepage vs every SEO page
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** Homepage header: text wordmark 'Ball IQ' in Archivo Narrow 21px, no icon, position:static, transparent background, one CTA ('Play free'), 73px tall. SEO pages (/quiz/*, /lists/*, /football-wordle/): icon + 'Ball IQ' in Inter 20px, position:sticky, rgba(10,10,10,.82), two CTAs ('Play free' + 'Get the app'), 71px. Display face for h1 is Archivo Narrow 64px (home), Anton 64px (arsenal, footle), Inter 40px (lists), Inter 28px (clubs index) — four h1 treatments across five pages. Footers: home 5 links/231px vs SEO 21 links/412px. Focus rings: solid 3px #58CC02 (home), UA-default 'auto' grey (SEO nav), 3px #FFC107 yellow (Footle keys).

**Why it costs.** A visitor who lands on /quiz/arsenal/ from Google and clicks the logo arrives on a page with a different header, logo, typeface and footer; on desktop, where both are fully visible, this reads as two sites.

**Fix.** Make the SEO header (sticky, icon, both CTAs) the single header component and mount it on the homepage; pick one display face (Anton is on 143 quiz pages — adopt it on home, or vice-versa) and set one `:focus-visible` token (`outline: 3px solid #58CC02; outline-offset: 2px`) in the shared stylesheet.

<sub>Evidence: home@1440-fold-consent.png vs clubquiz-arsenal@1920-fold-consent.png; hdr_home/hdr_seo JSON (logoFont Archivo Narrow vs Inter, position static vs sticky, bg transparent vs rgba(10,10,10,.82), links 5 vs 6); h1 fonts from results.json; focus outline colours from results.json focus arrays · confidence: measured</sub>

## /lists pages are a single 760px mobile column at desktop: 87-96 characters per line, 60% of a 1920 screen empty, 8.8 folds tall
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** On /lists/ballon-dor-winners/ the content column is 760px at both widths (left 340 at 1440, left 580 at 1920 → 1160px of the 1920 viewport is empty). Three intro/outro paragraphs at 16px/25.6px Inter measure 96, 90 and 87 characters per line (ceiling for comfortable reading ~75). The 70-row table is 758px wide and 3,333px tall; the page is 7,886px = 8.8 viewport-heights at 900px, with the table ending at fold 6.3. Answer buttons in the 5-question taster are 726x52px full-width rows holding one-word answers (Kopa, Puskas, Gento), 4 stacked, whereas the homepage renders the same component as a 2x2 grid.

**Why it costs.** This is the content type with 47% of impressions and 4% of clicks and 2.3s dwell; on a laptop it presents as a phone page pasted in the middle of the screen, with over-long lines on the only prose.

**Fix.** For .sec.narrow prose set `max-width: 65ch` (≈680px at 16px) or raise body copy to 17-18px; at >=1280px lay out the taster as a 2-col answer grid (`.qa .to{grid-template-columns:1fr 1fr}`) and consider a 2-col layout with the table left and the taster/related lists in a sticky right rail so the table does not run 6 folds alone.

<sub>Evidence: lists-ballondor@1920-fold-consent.png, lists@1440-table.png, lists-ballondor@1440-full-clean.png; measured col left 340/580 width 760, cpl samples 96/90/87 at 16px, table 758x3333 rows 70, docH 7886, foldsToTableEnd 6.3, taster buttons 726x52 · confidence: measured</sub>

## 'The full list is right below' is false by 2,103px — on the page type that is 47% of impressions and 4% of clicks
*Copy and voice — what the words actually do*

**What happens.** On /lists/ballon-dor-winners/ the taster is introduced with 'Think you know this? Five questions' and 'Tap to answer — no sign-up. The full list is right below.' I measured document coordinates on iPhone: that sentence sits at y=726; the <table> starts at y=2829 and its first data row at y=2872. That is 2,103px, or 3.19 viewport-heights, of scrolling between the promise and the thing promised. The visitor arrived from a query like 'ballon d'or winners list' — they came for the list, and the one sentence that addresses where it is misdirects them.

**Why it costs.** /lists carries 47% of impressions and converts 4% of clicks. A reader who takes 'right below' literally scrolls once, sees no table, and leaves — which is exactly the shape of that click-through gap. The sentence is actively worse than saying nothing, because it makes the reader trust a scroll that will not pay off.

**Fix.** Make the words true or make them do work. Either 'The full list is further down — or jump to it.' with an in-page anchor to the table, or move the taster below the table entirely (playable beats readable, but not when the reader came for the list and was told it was one scroll away).

<sub>Evidence: run7.mjs geometry: claimY=726, tableY=2829, firstRowY=2872, viewport 660px, document 10,311px. Screenshot 06-lists-fold.png. · confidence: measured</sub>

## Unexplained jargon at the exact moment of the ask: 'the full test' and 'scores you 60 to 160'
*Copy and voice — what the words actually do*

**What happens.** The verdict panel's persuasion paragraph reads: 'The full test scores you 60 to 160 and remembers it. Your streak, your clubs, your card — and friends to race online, up to eight of you.' Three undefined terms in one sentence. 'The full test' has no antecedent — the reader has only ever seen 'the assessment'. '60 to 160' has no referent at all; nothing on the visible page explains the scale, what a good number is, or that it is a Ball-IQ-style rating. 'your card' is likewise unexplained. The explanation exists — in the crawler-only block: 'Every answer you give feeds a player card — one rating on a 60-to-160 scale, broken down league by league and era by era. Read your scouting report, find your specialism, and share the card with the group chat.' Same problem as CV-1: the clarifying copy is written and shipped to Google, not to the reader.

**Why it costs.** This is the single paragraph whose job is to convert a warm taster-finisher into an install or a signup. It spends its three sentences on terms the reader cannot decode, at the one moment their attention is guaranteed.

**Fix.** Borrow the crawler block's own words: 'The full quiz keeps score — one rating from 60 to 160, like a football IQ, broken down by league and era. Plus your streak, your clubs, and friends to race online.' Same length, zero undefined nouns.

<sub>Evidence: run3.mjs verdict capture; static-block extraction in run5/curl. Screenshot 04-verdict-zero.png. · confidence: measured</sub>

## Straight verdict on 'Subject: you · nothing filed yet' — not passive-aggressive, but it spends the best line on an empty state
*Copy and voice — what the words actually do*

**What happens.** You asked for a straight call on this block, so here it is on both counts. (1) Register: it is NOT the register you rejected in that email draft. The rejected move accuses the reader of an omission — it makes their inaction the subject. 'Subject: you · nothing filed yet' says nothing has been filed BY US, yet; 'not assessed' is the pending cell of a table, not a judgement. The dossier conceit is legitimate and the tension it creates ('there is a file on me, and it is blank') is the actual hook. I would not change the tone. (2) Economy: the problem is what it costs. On iPhone the line directly under the h1 — the second-most-read line on the site — is used to narrate the UI's own empty state, in a page where the words 'football' and 'quiz' never appear in prose above the fold (CV-1). And on desktop 1440x900 the first paint puts five identical grey 'not assessed' strings at y=746-878, which is the standard visual signature of a table that failed to load. On the phone the same rows sit just below the fold, so the first scroll reveals a column of NULLs.

**Why it costs.** No tonal damage. But the letterhead line is prime real estate spent on metadata, and the five-NULL stub reads on first paint as 'no data' rather than 'your file, waiting'. Both are cheap to redirect toward the sentence the page is missing.

**Fix.** Keep the conceit; change what it says before anything is filed. 'Subject: you · football knowledge, unassessed' does the same job and smuggles in the category noun. For the stub, consider rendering the five discipline rows with an em-dash or a hairline rather than five repetitions of 'not assessed' — the repetition is what makes it read as an error state rather than a form waiting to be filled.

<sub>Evidence: Above-fold enumerations in run1/run6; screenshots 02-home-fold-consent.png (iPhone, first visit, consent up — the letterhead line is one of only five readable lines) and 08-desktop-fold.png (three 'not assessed' rows visible at 1440x900 before the consent bar). · confidence: measured</sub>

## The nav routes Footle — the retention engine — to a 4,931px marketing page, while the playable /footle is unlinked from the nav
*Strategy — what is this page FOR, and does it convert?*

**What happens.** The site nav's Footle entry is "Footle — football Wordle" → /football-wordle/, a 4,931px marketing page. Meanwhile /footle loads directly into a playable Footle board — keyboard, tiles, no onboarding question, no account — in 4.2s. Nothing in the nav points at it. The only /footle link found anywhere on the marketing homepage is "Play today's Footle" at y=2065 on a 4,318px page (fold 3.1). To be fair, /football-wordle/ does carry a fold-1 play CTA, so the marketing page is not a dead end — but a returning player who just wants today's puzzle is routed through a landing page they have already read.

**Why it costs.** A returning player — the cohort that produced 62 of 66 three-day-active users — needs 3 taps and a marketing page interstitial to reach a puzzle that is one URL away. Habit products live or die on the friction of the daily return.

**Fix.** Point the nav's Footle entry at /footle for repeat visitors (or simply always — the SEO page earns its traffic from search, not from the nav). Add a persistent "Today's Footle" entry to the marketing header.

<sub>Evidence: Nav dump (WebKit iPhone 13): {"t":"Footle — football Wordle","href":"/football-wordle/"}. /footle measured: final URL https://balliq.app/play, 4215ms, body text "Footle | ← | Footle | Surname of a footballer | ? | right spot | wrong spot | Q W E R T Y…" — e1-footle-direct.png. Homepage /footle link measured at top=2065 of docH 4318. · confidence: measured</sub>

## The marketing header is position:static — the primary CTA exists only in the first 664px of pages up to 12,241px tall
*Strategy — what is this page FOR, and does it convert?*

**What happens.** Measured getComputedStyle on the marketing header: position is "static". At scrollY=2000 on the homepage, the "Play free" anchor's bounding rect top is -1986 and it is not visible. There is no sticky header, no sticky bottom bar, and no repeated CTA on the way down. Page heights measured this session: homepage 4318, /quiz/arsenal/ 5782, /football-quiz/ 6811, /lists/ 12241.

**Why it costs.** A visitor who scrolls to read — which is exactly what the readable pages ask of them — passes the point of no return. Intent that builds during the scroll has nowhere to go until they reach a CTA that may be 5-16 folds away, or scroll all the way back up.

**Fix.** position:sticky; top:0 on the marketing header. Do NOT use a sticky bottom bar: the consent bar is bottom-fixed at 171.6px on a 664px viewport for first-time visitors and would collide with it — the same class of bug already fixed for Footle's ENTER key.

<sub>Evidence: Measured, WebKit iPhone 13, homepage, consent declined, scrollTo(0,2000): {"topInViewport":-1986,"visible":false,"headerPos":"static"}. Consent rect measured on first visit: {x:0,y:492.4,width:390,height:171.6}. · confidence: measured</sub>

## The /lists hub — 47% of impressions — is the longest page on the site with the fewest things to do
*Strategy — what is this page FOR, and does it convert?*

**What happens.** /lists/ is 12,241px tall on a 664px viewport (~18.4 folds) and contains exactly ONE element matching button with height>28px — the nav hamburger. Its first link to anything playable is at y=10,834: fold 16.3. Its own leaf pages do better: /lists/most-premier-league-titles/ carries 21 interactive option buttons (a live taster: "A Arsenal", "B Liverpool", "C Man City"…) with its first play link at y=3,701. The hub that captures the impressions has no taster; the children that get less traffic do.

**Why it costs.** This is the surface with 47% of impressions and 4% of clicks. Someone who does click arrives at 18 folds of table with nothing to press for 16 of them. It reads as a reference document, and reference documents get bounced. (This extends the already-reported "/lists content 4+ folds down" with the specific fact that the taster component the hub needs already ships on its own children.)

**Fix.** Put a three-question taster from the lists' own subject matter directly under the H1 on /lists/ — reusing the component from /lists/most-premier-league-titles/. Then push the play CTA up alongside it rather than leaving it at y=10,834.

<sub>Evidence: Measured, WebKit iPhone 13, consent declined. /lists/: vh 664, docH 12241, buttons with height>28px = 1 (empty text), firstPlayTop 10834, firstStoreTop 10955. /lists/most-premier-league-titles/: docH 5769, buttons = 21, sample ["A Arsenal","B Liverpool","C Man City","D Chelsea","A Nottingham Forest"], firstPlayTop 3701. · confidence: measured</sub>

---

# ⚪ LOW (12)

## Name-game chrome ('Type a name… · 0 found · Give up') is shown before anyone presses Play
*SEO surfaces as landing pages (/lists/* and /quiz/*)*

**What happens.** On page load, before 'Play — hide the answers' is tapped, the sticky #lp-live bar is already visible with a search input, '0 found' and a 'Give up' button, directly above a table whose answers are all still visible (liveBarBeforePlay.visible=true on all four pages). The bar is position:sticky (z-index 5) so it follows the reader down the entire 5,000px table.

**Why it costs.** A reader who only wants the list sees a scoreboard for a game they did not start and a 'Give up' button with nothing to give up on; on a 664px viewport with the 67px nav and 64px sticky bar, 131px (20%) of every table screen is chrome.

**Fix.** Render #lp-live hidden until the Play button is pressed; keep only the 'Play — hide the answers' pill as the pre-game affordance.

<sub>Evidence: lists_ballon-dor-winners__table_region_y2600.png (pre-Play: input + '0 found' + 'Give up' shown, names visible) vs lists_ballon-dor-winners__after_play.png; overflow.mjs liveBarBeforePlay. · confidence: measured</sub>

## The 47% / 4% ratio is mostly SERP-side (rank and head terms), and the page only decides what a click is worth
*SEO surfaces as landing pages (/lists/* and /quiz/*)*

**What happens.** I could not query Search Console this session (connector returned entitlement_required; see couldNotTest), so the ratio explanation combines prior measured data with this session's page measurements. Prior GSC read (memory, 2026-08-15, 28 days): /lists 18,161 impressions, 28 clicks, CTR 0.15%, avg position 25.8; /quiz 19,145 impressions, 544 clicks, CTR 2.84%, position 9.8; only 6 of 51 lists on page 1, and the three biggest-impression lists are head terms at positions 21-51 with 4 clicks on 4,682 impressions. Measured this session: the pages themselves are fast and static (FCP 0.4-1.9s), so the low CTR is not a rendering or indexing failure — it is impressions accruing at positions 20-50 on queries Google answers in a featured snippet. What the page controls is what happens after a click, and there SEO-1/2/4 apply: table 4.1-4.3 folds down, key column hidden, zero tappables in fold.

**Why it costs.** Treating /lists as a landing-page-design problem alone will not move the click count; treating it as a rank problem alone will not move dwell. Both halves need the specific fixes above.

**Fix.** Keep the head-term lists (premier-league-champions, serie-a-top-scorers, ballon-dor-winners) but stop scaling that pattern; apply SEO-1/2/4 to the 6 page-1 lists first (Süper Lig top scorers, Copa Libertadores, EFL Cup, Eredivisie top scorers, Primeira Liga top scorers, the hub) where a click actually arrives.

<sub>Evidence: results.json paints/timings for 10 pages; prior GSC figures from memory file project_lists_content_type.md (labelled as prior, not re-measured). · confidence: inferred</sub>

## Two-row mast eats 21% of the fold
*Mobile design critique — and the Scouting Report conceit*

**What happens.** .sr-mast is 133px tall at both widths: row 1 mark + Play free (y 14–58), row 2 Games/Quizzes/Discover (y 74–118), 1px border at 132. The h1 begins at y=155. On a 635px viewport that is 20.9% of the first screen spent on chrome before the page says anything.

**Why it costs.** Directly feeds DM-2: the 60px second row is the difference between the first answer option clearing the consent bar or not at 390 wide. Also unusual for mobile — a single 56–64px bar is the norm and the dropdowns already exist to hold the groups.

**Fix.** Under 700px, lay the mast in one row: mark left, a single 'Menu' (or the three group buttons at 13.5px) centre, Play free right; target height 60–64px. This is the same change as DM-2 lever (1).

<sub>Evidence: measure-375x812-firstvisit.json (.sr-mast h=133; .sr-nav y=74 h=44; .sr-h1 y=155), 375x812-04-fold-dismissed.png. · confidence: measured</sub>

## Footle band is 1,430px tall and explains the game after asking you to play it
*Mobile design critique — and the Scouting Report conceit*

**What happens.** .fb spans y=1132–2562 (1,429.7px = 2.25 viewports) on a distinct navy surface rgb(20,22,30) (the page is neutral rgb(10,10,10); the nav dropdown is a third navy, rgb(18,20,27)). Order inside it: h2, 146px sub paragraph, worked example (Laporte/Haaland), note, 6x7 archive board (36px tiles), keyboard (27.4x48 keys, 5px gaps), 'Play today's Footle' (green, y=2054), 'Play the Daily 7' (outline, y=2132), then the colour legend (y=2236, 273px block) and 'Six guesses.' (y=2331), then a 44px countdown clock. The legend that explains the tile colours comes 182px after the primary CTA.

**Why it costs.** A taster that is meant to be tried in seconds spends more than two screens before its own CTA and puts the rules after the button. The blue-cast surfaces on a neutral page are a small but measurable palette inconsistency (three dark greys: 10/10/10, 18/20/27, 20/22/30).

**Fix.** In src/marketing/FootleBand.jsx: move .fb-legend + .fb-six up beside the worked example (they are the same idea — what the colours mean) and drop the 146px sub to two lines; cut the archive board to 3 visible rows on mobile (the 6-row empty grid is 300px of empty boxes). Pick one dark: either give .fb the page's rgb(10,10,10) with a hairline rule, or adopt rgb(20,22,30) as the page's card surface and use it for the dropdown too.

<sub>Evidence: 375x812-07-footle-band.png, 375x812-03-fold2-firstvisit.png, 375x812-03-fold3-firstvisit.png; m2-base.json (.fb y=1132 h=1429.7 bg rgb(20,22,30); .fb-real.fb-primary y=2054.7; .fb-legend y=2236.7 h=273; .fb-six y=2331.7; .fb-time 44px; sectionBgs; .sr-drop bg rgb(18,20,27)); audit4 output (keys 27.4x48, gap 5px, tiles 36px). · confidence: measured</sub>

## Answering with the consent bar up hides the explanation and Next (confirms the known class on the homepage)
*Mobile design critique — and the Scouting Report conceit*

**What happens.** First visit, bar up, scroll to option A and tap it: the Why panel + Next question render at viewport y=667–719 while the bar covers 463–635 and the viewport ends at 635. The user sees the red mark on A and options B/C, nothing else (375x812-16-consent-up-after-answer.png).

**Why it costs.** The known 'consent covers Next question' item applies to the homepage taster too, not only club quizzes; here it also hides the Why panel, which is the feature the clubs section brags about ('most of them tell you why').

**Fix.** Same root as the fixed Footle ENTER item: honour --biq-consent-h as bottom padding on .sr-file while the bar is mounted, or scroll .sr-whywrap into view (block:'end' minus the bar height) when it mounts.

<sub>Evidence: 375x812-16-consent-up-after-answer.png; audit3 output: next top 667 bottom 719, consentTop 463, vh 635, scrollY 284. · confidence: measured</sub>

## Footle hero subtitle orphans 'up.' on its own line at both 1440 and 1920
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** 'Guess the footballer in 6 tries. New player every day — free, no sign-up.' is 19px in a p with max-width 623px; it wraps to 2 lines with the last line 28px wide ('up.'). Because the max-width is fixed, the orphan appears identically at 1440 and 1920. The board caption '.fw-foot' runs 286 characters at 13.5px across the full 1112px, i.e. 143 characters per line.

**Why it costs.** Cosmetic, but it is the first sentence on the Footle landing page and the hyphen split 'sign-\nup.' reads like a typo on a large screen.

**Fix.** On /football-wordle/ set the hero p to `max-width: 640px; text-wrap: balance` (or shorten to 'free, no account') and give .fw-foot `max-width: 60ch`.

<sub>Evidence: footle@1920-fold-consent.png, footle@1440-full-clean.png; measured p width 623 max-width 623.29px fontSize 19px lines 2 lastLineW 28; .fw-foot width 1112 chars 286 lines 2 cpl 143 fontSize 13.5px · confidence: measured</sub>

## Clubs-index filter input has no visible keyboard focus indicator
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** On /quiz/clubs/ the 'Type to filter 350+ clubs' input, when focused via Tab, matches :focus-visible but computed outline is none, box-shadow none, and border-color is unchanged (rgb(255,255,255) before and after); nothing on screen changes. It is the only control in 119 tab stops across all runs without an indicator.

**Why it costs.** A keyboard user tabbing into the page (first stop after the nav) cannot tell that the filter is focused before they start typing.

**Fix.** Add `.cd-filter input:focus-visible{outline:3px solid #58CC02;outline-offset:2px}` (same token as the consent buttons and homepage).

<sub>Evidence: clubs@1440-input-focus.png (no ring); measured afterKb fv=true, outline none 3px rgb(255,255,255), boxShadow none, border unchanged · confidence: measured</sub>

## Orange 'Prove it' banner uses a 343px text column inside a 1112x432 banner
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** On /quiz/arsenal/ and /football-wordle/ the CTA banner is 1112px wide and 432px tall, but its heading, sub-copy and 'Free either way — in your browser right / now, or on your phone:' are constrained to 343px (each wraps to 2 lines); the remaining ~770px is gradient plus a flame emoji. At 1440 with the consent bar up, the banner's 'Play free in your browser →' button (y=882-933) sits under the bar (top 823).

**Why it costs.** The strongest conversion block on the club pages reads as a phone card blown up; the copy wraps where it has 3x the room.

**Fix.** At >=1024px make the banner a 2-col grid: copy + browser CTA left (max-width 520px), store badges right where the flame is; or simply raise the inner max-width to 560px.

<sub>Evidence: arsenal@1440-cta.png; measured banner 1112x432, innerW 343, three text nodes width 343 each at 2 lines; consent overlap from results.json coveredByConsent ['Play free in your browser →@882-933'] vs consent top 823 · confidence: measured</sub>

## 1920 gets the 1440 layout centred: no fluid type or wider container
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** h1 is 64px at both widths on home, arsenal and footle; the homepage column is 944px (488px void each side, 49% of the width), the hero text block is 576px wide leaving 856px to its right; SEO pages cap at 1200px (404px each side), lists at 760px (580px each side). Nothing scales between 1440 and 1920 — the only change is margin.

**Why it costs.** On a 1920 monitor the page is legible but small; the dark background hides the void, so this is the least costly of the width issues.

**Fix.** Use `clamp()` for display type (e.g. h1 `clamp(56px, 4vw, 84px)`, hero sub `clamp(18px, 1.2vw, 22px)`) and let the SEO container grow to 1320px at >=1600px.

<sub>Evidence: home@1920-fold-consent.png; measured h1 64px at both, home column 944 left 248/488, heroVoidR 856 at 1920, arsenal container 1112 left 404, lists column 760 left 580 · confidence: measured</sub>

## Known consent-bar coverage, confirmed at desktop widths (not a new finding)
*Desktop design critique (1440x900 and 1920x1080)*

**What happens.** First-visit consent bar is 77px tall on desktop (top 823 at 900px, top 1003 at 1080px) — smaller than the 172px mobile figure. At 1440 it covers: arsenal 'Play free in your browser →' (882-933), lists answer D 'Di Stéfano' (801-853), and 8 tappables on /quiz/clubs/ (Süper Lig, Premiership, Southampton, Wrexham, Birmingham, West Ham, Burnley, Wolves). At 1920: 2-5 tappables per page. Homepage and Footle page: 0 covered at either width.

**Why it costs.** Adds depth to the already-open item; desktop cost is bounded to the last 77px of the fold.

**Fix.** Already tracked; on desktop the bar could be a 56px single-row variant (text 13px + two 36px buttons) to reclaim 21px.

<sub>Evidence: *-fold-consent.png for all 10 runs; results.json consentUp.consent and coveredByConsent per run · confidence: measured</sub>

## Lists pages open with a machine date and a dead word: '70 entries · verified 2026-07-20 · free · hand-checked by Ball IQ'
*Copy and voice — what the words actually do*

**What happens.** The credibility strip directly under the h1 on /lists/ballon-dor-winners/ reads '70 entries · verified 2026-07-20 · free · hand-checked by Ball IQ'. Three observations. The date is in raw ISO format, which reads as a database field rather than an editorial signal. It is 44 days old as of 2026-09-02, so it currently advertises staleness rather than freshness — and it will keep getting worse on its own. And 'free' is a dead word here: no reader of a list of Ballon d'Or winners was wondering whether they would be charged. It occupies a quarter of the site's only trust line on its highest-impression page type.

**Why it costs.** Small per visit, but this strip is the first non-title thing a search visitor reads on the page type carrying 47% of impressions, and it is the only place the page argues for its own trustworthiness.

**Fix.** '70 entries · checked July 2026 · hand-verified by Ball IQ' — human date, drop 'free', keep the count and the provenance, which are the two parts doing real work.

<sub>Evidence: run5.mjs above-fold capture at y=245; screenshot 06-lists-fold.png. · confidence: measured</sub>

## 16% of the served homepage is developer commentary, including a cautionary quote of the banned question count
*Copy and voice — what the words actually do*

**What happens.** The HTML served at https://balliq.app/ is 67,423 bytes, of which 10,829 bytes across 23 HTML comment blocks are engineering notes. They ship verbatim to every visitor's browser and include the project's internal self-criticism and a measured stat: 'NEVER PRINT THE EXACT QUESTION COUNT. Binding product rule. It shipped here anyway as "6,409 hand-curated questions" and… the live site showed 6,409 on / and 6,405 one click away on /quiz/liverpool/', and 'Claims here must match MarketingHome and the store listings — "most answers explained", never "every answer" (measured 77.6%)'. To be explicit: this is inside comments, so it is not user-facing copy and does not violate the question-count rule. But the banned number is on the wire on the homepage, and anyone who views source reads a candid internal note about the site's own past overclaims.

**Why it costs.** No visitor-facing harm and negligible bytes. The exposure is reputational and only to someone reading source — but 'most answers explained (measured 77.6%)' is a competitor's or a journalist's free quote.

**Fix.** Strip HTML comments from index.html at build time (most bundlers do it with one flag). Keep every word of them in the source, where they are genuinely valuable — the CV-3 and CV-4 findings above are both things these comments would have caught if the notes and the wiring had stayed in sync.

<sub>Evidence: python3 measurement over the curled homepage: 23 comment blocks, 10,829 of 67,423 bytes; contexts printed around both occurrences of '6,409'. · confidence: measured</sub>
