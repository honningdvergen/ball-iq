# Ball IQ — Design Report

**Surface:** balliq.app marketing site and SEO pages. **Lead contexts:** iPhone Safari (WebKit 26.5) and desktop 1440/1920.
**Author's position:** I wrote this report from six lenses' measurements. I did not personally re-measure any of it. Every number below is attributed to the lens that produced it.

---

## Honesty note — read this before the grades

**26 of the findings behind this report come from three lenses whose adversarial skeptics never ran** (the fleet hit a session limit). Those are the SEO-surface lens (SEO-1…6), the mobile-design lens (DM-1…9), and the desktop lens (DD-1…11). They are single-pass measurements with no one having tried to break them. I mark them **[unverified]** throughout. The three newer lenses (Safari, strategy, copy) ran with per-finding confidence labels, but I did not independently re-measure those either — treat them as one careful pass, not as replication.

Two specific reasons to hold the unverified set loosely:

- **The homepage changed mid-audit.** The consent-banner deferral shipped live *during* the Safari lens's run. That partly invalidates DM-2 and DM-9, which measured the consent bar sitting over the homepage taster. The bar no longer mounts unscrolled on `/` (Safari lens traced it for 10s across 3 runs). The *other* half of DM-2 — that a 375-wide iPhone sees zero answer options above the fold with no bar involved — was re-measured after the deploy and stands (`safari-mobile/15-se375-fold-current.png`).
- **Screenshots `01`–`05` in `safari-mobile/` are pre-fix homepage state.** Do not read them as current. `13-home-fold-CURRENT.png` and `15-se375-fold-current.png` are.

I have not re-derived the ground-truth numbers (1,540 clicks/28d, /lists 47%/4%, 48% never play, 62 of 66 via Footle). Those are given.

---

## 1. Overall design grade: **C+**

The craft floor is genuinely high and I want that on record before the criticism: contrast passes everywhere measured (floor 5.15:1, ink-on-paper 14.71:1) [unverified]; touch targets are honest (44–52px on every primary control across every lens); 118 of 119 tabbed controls on desktop show a focus ring [unverified]; WebKit first contentful paint is 317ms with 17 requests, zero failed requests, zero console errors; and there is **no horizontal overflow anywhere** on mobile — the one defect the brief most expected. Someone who cares about the work built this.

What holds it to C+ is that the design's own measured law — *playable beats readable* — is broken on every surface that receives the traffic, and the failures are not craft failures. They are placement and hierarchy failures, which are cheaper to fix and more expensive to leave. On the pages carrying 100% of the ~1,540 Google clicks, a first-time visitor's opening screen either contains nothing to press (`/lists/`: 0 non-nav tappables in the first 664px [unverified]; `/football-quiz/`: 1 interactive element on a 6,811px page, and it is the hamburger) or contains four answers with three of them behind the consent bar (`/quiz/arsenal/`, because the deferral flag that fixed the homepage was never added to the static generator). The homepage never says the words "football quiz" in prose above the fold on any device — the sentence that would fix it is written, shipped, and pointed at Googlebot. And at the single highest-intent moment on the whole site, the primary button is an app-store install.

That is a C+ site: well-built components, arranged so that the first and last five seconds of every visit work against the product.

---

## 2. The single most expensive design problem

**Every high-traffic first screen is empty of football, and the site's own data says that is the one thing that must not be true.**

This is not one bug. It is the same decision made six times, and it is measurable on every surface:

| Surface | First screen (first 664px, iPhone Safari) | First playable thing |
|---|---|---|
| `/lists/*` (4 sampled) | **0** non-nav tappables; consent bar covers y=492–664, leaving 425px of prose [unverified] | option A at y=810–909 (1.2–1.4 folds) [unverified] |
| `/lists/` hub | **1** button (the hamburger) | first play link at **y=10,834** of a 12,241px page |
| `/football-quiz/` (the North Star head term) | **1** button (the hamburger) | first play link at **y=5,117** of 6,811px — **7.7 folds** |
| `/daily-football-quiz/` | 2 app-store badges; **0** option buttons | `/play` link at y=2,849 (fold 4.3); no `?game=daily` anchor anywhere |
| `/quiz/<club>/` | 4 options at y=467/524/581/638 — **but** consent bar at y=492 hides B, C, D | option A, partially clipped mid-word (`safari-mobile/06-arsenal-fold-firstvisit.png`) |
| `/` at 375 wide | **0 of 4** options — option A starts 22px below the fold | scroll required |

Against this: `/lists` is 47% of impressions and 4% of clicks; taster-less list pages measured 2.3s of dwell; 48% of new accounts never play anything. The pages are fast (FCP 317ms) and structurally clean, so nothing here is a rendering problem. The visitor arrives, the page paints correctly and quickly, and there is nothing to do.

The cheapest single lever inside this problem is one line of code. `index.html` sets `window.__biqConsentDefer = true` so the banner waits for a scroll; `scripts/gen-seo-pages.mjs` injects the same `/consent.js` and **never sets that flag** (grep: `__biqConsentDefer` appears only in `index.html`). The comment at `index.html:227-230` already states the rule this violates: keep the two in step, the club pages are the larger half by traffic. Adding that flag to the generator restores three of four answers on ~143 quiz pages and every list page, for every EU first-time visitor, today.

The expensive half is the layout decision underneath it: on `/lists/` the table the searcher came for sits at y=2,750–2,874 — **4.1 to 4.3 folds down, behind a 1,972px quiz block** [unverified] — and on `/football-quiz/` the taster component that already ships on club pages simply isn't there. Both are placement changes to components that already exist.

---

## 3. Per-area grades

| Area | Grade | One-line justification |
|---|---|---|
| Craft floor (contrast, targets, focus, overflow, perf) | **A−** | 5.15:1 floor, 44–52px targets, 118/119 focus rings, 317ms FCP, zero mobile overflow |
| Club quiz pages `/quiz/*` | **B** | Best arrival on the site — crest, H1, freshness line, live question in the fold — undone by the consent flag and a store-before-play CTA order |
| Desktop web (1440/1920) | **B−** | Real two-column compositions on home/club/clubs-index; one functional bug (sticky-under-sticky) and three stranded mobile components [unverified] |
| SEO structure (static HTML, schema, hreflang, speed) | **B−** | Everything a crawler needs is right; nothing a reader needs is near the top |
| iPhone Safari cold arrival | **C+** | Clean and fast, but two of the three worst defects land here and one is Safari-only |
| Copy craft (sentence level) | **B+** | Verdict bands, meta descriptions and the Footle explainer are better than funded competitors' |
| Copy placement & truth | **D+** | Best sentence invisible to humans; three CTAs do not do what they say |
| Homepage / Scouting Report | **C** | Strong finish, empty opening, no category noun, no images |
| Footle surfaces | **C+** | `/footle` is an excellent deep link that nothing links to; `/football-wordle/` is a 560px phone card in a 1112px column [unverified] |
| List pages `/lists/*` | **D+** | 47% of impressions; table 4+ folds down, key column cut off, zero localised versions [unverified] |
| Head-term pages (`/football-quiz/`, `/daily-football-quiz/`) | **D** | The pages aimed at the biggest terms are the least playable pages on the site |
| Conversion path / CTA hierarchy | **D+** | Install outranks play at peak intent; 14 taps from landing to Footle |
| Cross-surface consistency | **D** | Two headers, two logos, four h1 typefaces, three dark greys, three focus-ring styles |

---

## 4. Findings ranked by user cost

### 1. Static SEO pages never got the consent deferral the homepage got — CRITICAL
**What happens:** WebKit 26.5, iPhone 13 390×664, Europe/Oslo, fresh context, no scroll: `#biq-consent` present on `/quiz/arsenal/`, `/lists/` and `/footle/`; absent on `/`. On `/quiz/arsenal/` the bar top is 492 with options at 467/524/581/638 — B, C and D are behind it, and A is clipped mid-word.
**Cost:** 100% of the ~1,540 Google clicks/28d land on these pages. The best-converting surface on the site is 75% covered at first contact for every new EU visitor.
**Fix:** `window.__biqConsentDefer = true` in the inline gate in `scripts/gen-seo-pages.mjs`, mirroring `index.html:356/373`. The scroll trigger and 60s backstop in `consent.js` already handle the rest.
**Evidence:** `safari-mobile/06-arsenal-fold-firstvisit.png`; grep confirming the flag exists only in `index.html`.

### 2. The homepage never tells a stranger what Ball IQ is — CRITICAL
**What happens:** Rendered homepage is 399 words. "football" first appears in prose at character 544 (below the fold at both 390×660 and 1440×900); "quiz" appears twice in the entire rendered page (nav item, footer line); "soccer" zero times. The static block in `index.html` — which Google gets — carries 669 words opening *"Ball IQ is a free football quiz game. There is no sign-up and nothing to install — open it in a browser and you are playing in about ten seconds."* After hydration, `document.body.innerText` does not contain that sentence.
**Cost:** Cold arrivals must infer the category from a scouting-report metaphor with no referent. Compounded by there being **zero images on the page** (`document.images.length === 0` in both engines) — no crest, no pitch, nothing that reads as football before you read words.
**Fix:** One plain sentence between the h1 and the paper. Keep "Five questions. One honest verdict." as the headline — it is good. The replacement lede already exists and has already passed your taste.
**Evidence:** `copy-voice/02-home-fold-consent.png`, `copy-voice/08-desktop-fold.png`, `safari-mobile/13-home-fold-CURRENT.png`.

### 3. At peak intent, the primary CTA is an install — and Footle is not offered at all — CRITICAL
**What happens:** After five answered questions, the verdict's only two CTAs on iPhone are, in DOM order: "App Store" → `apps.apple.com` (y=772, 52px) and "Keep going in the browser — free" → `/play` (y=834, 52px). Both are 303×52 outline buttons, same weight, same border — **no filled button, no hierarchy** [unverified: DM-6]. The one filled-ink button in the system ("Next question") is gone. Footle appears nowhere. The same inversion runs on club pages: on `/quiz/arsenal/` the store badges sit at y=848, directly under a sentence ending "Play in your browser", and the green browser CTA is 421px below them at y=1,269.
**Cost:** The visitor is warm, engaged and inside a working session, and is pointed at a download. It also routes away from the mode that produced 62 of 66 three-day-active players.
**Fix:** Make the primary verdict CTA a filled-ink "Play today's Footle →" pointing at `/footle` (which already loads straight into a playable board in 4.2s). Demote the stores to a secondary row. Swap the same order on the club template.
**Evidence:** `strategy-conversion/a3-taster-verdict-next.png`, `strategy-conversion/d2-arsenal-store-before-play.png`, `strategy-conversion/e1-footle-direct.png`.
**Caveat, stated plainly:** no install-attribution data exists to prove the swap wins. The design fact (no hierarchy between two identical buttons) is certain; the conversion claim is inferred.

### 4. "KEEP THIS REPORT" keeps nothing, then asks a sixth question — HIGH
**What happens:** The verdict panel is headed "KEEP THIS REPORT" and says "The full test scores you 60 to 160 and remembers it." Pressing its browser CTA lands on `/play` with `.sr-verd` null — the report is discarded — and the screen that replaces it reads "Quick one — give it a go ⚽ / Who has scored the most goals in men's international football?" Answering that and pressing Start playing produces the app home, instantly covered by a full-screen EXAMPLE scouting-card modal stacked over the "Start with today's Footle" banner it obscures. Measured path: **14 taps from landing to a playable Footle.**
**Cost:** The one moment the visitor is warmest, they are (a) told something is kept that isn't, (b) restarted at lower difficulty in a chummier voice than the dossier that just told them "You do not follow the archive", and (c) shown someone else's 85 OVERALL card before touching the product. `ScoutingReport.jsx`'s own comment says a taster promising an honest verdict cannot open with a free point; the app it hands to opens with exactly that.
**Fix:** Pass a flag (`/play?from=report`) that skips the warm-up question and the example modal. And either make the report travel or stop saying it does. Also: "60 to 160" and "your card" are undefined nouns in the single paragraph whose job is to convert — the crawler-only block explains both in one sentence you already wrote.
**Evidence:** `copy-voice/05-after-keep-report.png`, `strategy-conversion/c1-play-firstscreen.png`, `strategy-conversion/c3-after-startplaying.png`.

### 5. "Next question" lands above the viewport, four times per session — HIGH [unverified]
**What happens:** Answer Q1, tap Next (at y=951 on a 635px viewport, so scrollY≈660). Q2 mounts, the Why panel + Next block (~194px) unmount, the document shortens, scrollY stays at 660: `.sr-q` spans viewport top −187 to −99 and option A sits at −85. The user is looking at options C and D with no question visible. Re-measured at 300ms / 1s / 3s: identical — settled layout, not animation. Reproduces on all four transitions. Grep found no `scrollIntoView` in the file.
**Related, Safari-only:** on `/quiz/arsenal/` the WHY explanation wraps to 4 lines in WebKit vs 3 in Chromium for identical text at an identical viewport, pushing "Next question" to top 627 / bottom 679 on a 664px viewport — clipped — where Chromium renders it whole at 609–661.
**Cost:** 100% of visitors who play past Q1 hit the homepage version four times. On a page whose promise is "the report writes itself while you answer", the answering step is where it breaks. The Safari variant means the continue button is whole in your Chrome tab and cut off on your users' phones.
**Fix:** `scrollIntoView({block:'start'})` on `.sr-ab` after the index changes (or reserve `.sr-abody` min-height); same treatment for the club-page reveal, verified in WebKit not Chrome.
**Evidence:** `design-mobile/375x812-15-viewport-after-next-q1.png`, `design-mobile/375x812-17-after-next-q1-settled.png`, `safari-mobile/08-webkit-after-tap.png` vs `safari-mobile/08-chromium-after-tap.png`.

### 6. Safari-only: the sticky nav's backdrop blur does not paint — HIGH
**What happens:** `.nav` computes identically in both engines (sticky, `rgba(10,10,10,0.82)`, `backdrop-filter: blur(14px)`, z-index 100) but WebKit does not apply the blur. At 0.82 alpha over near-black, page content scrolls through the logo letter-for-letter. Chromium blurs it to near-invisibility. The nav's scrolling ancestor computes `overflow: hidden auto` — the known WebKit condition for dropping backdrop-filter on a clipped backdrop root.
**Cost:** On every static page — every Google landing — the brand bar looks broken the moment the user scrolls. It reads as a rendering glitch, and it is invisible in your own testing browser.
**Fix:** Raise `.nav` background to near-opaque (`rgba(10,10,10,0.97)`) and treat the blur as pure enhancement. `@supports not (backdrop-filter:…)` will *not* catch this — WebKit claims support in `getComputedStyle` while not painting it.
**Evidence:** `safari-mobile/09-webkit-header-over-h1.png` vs `safari-mobile/09-chromium-header-over-h1.png` (matched crops, scrollY 240, both 390×664).

### 7. Club pages: the CTA drops the club, and six labelled doors go to one room — HIGH
**What happens:** On `/quiz/arsenal/` the main conversion button reads "Play free in your browser →" under "Think you know Arsenal? Prove it." It points at bare `/play` and delivers the Messi warm-up. The correctly-scoped URL `/play?club=arsenal` is already used elsewhere **on the same page** and serves real Arsenal questions. Separately, the six cards under "What the Arsenal quiz covers" — Club history, Players & legends, Managers, Trophies & honours, Records & stats, Iconic moments — all href to the identical `/play?club=arsenal` and all serve the same undifferentiated pool.
**Cost:** Club terms are the best-ranked queries on the site. Someone who searched for an Arsenal quiz and pressed a button promising more gets asked about Messi. And a reader who taps "Managers" and gets a random Henry question learns the labels are decoration — which is exactly the impression the hand-checked voice is trying to avoid. This is the CTA-parity bug class, twice, on ~124 generated pages.
**Fix:** Point the hero CTA at `/play?club=<slug>`. Either wire the six tiles to a topic filter or make them non-clickable descriptive copy — as static text they are honest and useful.
**Evidence:** `copy-voice/09-club-cta-dest.png`, `copy-voice/10-club-six-doors.png`.

### 8. `/lists/`: the answer is four folds down, the key column is off-screen, and the copy lies about it — HIGH [unverified for the geometry]
**What happens:** Three compounding measurements on the page type that is 47% of impressions. (a) H1 at y=182, then a 1,972px five-question taster block, then the table at y=2,750–2,874 — **4.1–4.3 folds** — with no jump anchor on the page. (b) The table wrapper is 350px on a 390px viewport but the tables measure 416–489px: on `/lists/premier-league-top-scorers/` the GOALS column spans x=365–437, so **67 of its 72px are off-screen**; on ballon-dor, NATIONALITY (371–510) is entirely hidden. `overflow-x: auto` with **no fade, no shadow, no hint** on any of four pages — the table looks complete. (c) The taster copy says "The full list is right below." Measured: that sentence is at y=726, the first table row at y=2,872 — **2,103px, 3.19 folds** — and the only in-page anchor is "Skip to content."
**Cost:** A searcher for "ballon d'or winners" scrolls once on the promise of "right below", finds no table, and leaves. A searcher for the Golden Boot cannot see the goals tally at all.
**Fix:** Render the table first (target y<700), or add a real "Jump to the full list" anchor and make the sentence a link to it. Drop to 3 columns under 480px, or add an edge fade plus a swipe hint. On the top-scorers page, move GOALS to column 2.
**Evidence:** `seo-surface/lists_ballon-dor-winners__full_consent.png`, `seo-surface/lists_ballon-dor-winners__table_region_y2600.png`, `copy-voice/06-lists-fold.png`.
**Also, unverified and cheap to check:** the sitemap carries 51 `/lists/` URLs and **0** localised ones, against 46 localised `/quiz/` URLs; `/es/lists/`, `/es/lists/ballon-dor-winners/` and `/tr/lists/super-lig-champions/` all 404.

### 9. Two design systems on one domain — MEDIUM
**What happens:** Homepage: text wordmark in Archivo Narrow 21px, `position: static`, transparent, one CTA, two-row 133px mast, no hamburger, no breadcrumbs. SEO pages: crest + "Ball IQ" in Inter 20px, `position: sticky`, `rgba(10,10,10,.82)`, two CTAs, 67px, breadcrumbs. Four h1 treatments across five pages (Archivo Narrow 64px / Anton 64px / Inter 40px / Inter 28px). Three dark greys on the homepage alone (10,10,10 page / 18,20,27 dropdown / 20,22,30 Footle band). Three focus-ring styles (solid green / UA default grey / 3px yellow). Footers 5 links vs 21.
**Cost:** The Google arrival path is `/quiz/<club>/` → Home. That transition currently reads as leaving the site. On desktop, where both chromes are fully visible, it reads as two products.
**Compounding:** the homepage header is `position: static` — at scrollY 2000 the "Play free" anchor's rect top is −1986 — on a 4,318px page. Club pages keep a 67px sticky nav for the whole scroll. So the homepage loses its only CTA after fold one.
**Fix:** Ship the SEO header (sticky, crest, hamburger) on both halves; pick one display face — Anton is already on 143 pages; set one `:focus-visible` token. Do **not** add a sticky bottom bar: the consent bar is bottom-fixed at 171.6px on a 664px viewport, and that collision is the Footle-ENTER bug class again.
**Evidence:** `design-desktop/home@1440-fold-consent.png` vs `design-desktop/clubquiz-arsenal@1920-fold-consent.png`; `safari-mobile/13-home-fold-CURRENT.png` vs `safari-mobile/06-arsenal-fold-firstvisit.png`.

### 10. Desktop: one functional bug and three stranded mobile components — MEDIUM [unverified]
- **`/lists/*` sticky name-bar disappears under the sticky header.** The "Type a name…" input is `sticky; top:0; z-index:5`; the header is `sticky; 71px; z-index:100`. Once scrolled, the input sits at viewport y=11–53 and `elementFromPoint` at its centre returns `BUTTON.nav-top`. **The only playable thing on the page is unclickable for the entire 3,333px table scroll.** Fix: `top: var(--biq-header-h, 71px)`. Evidence: `design-desktop/lists@1440-sticky-under-header.png`.
- **29 of 134 club chips truncated** in 116×65px tiles inside a 1112px container: "Manch… United quiz", "Barcelo… quiz", "Borussia Dortmu…". Fix: `repeat(auto-fill, minmax(200px, 1fr))` at ≥1024px and drop the redundant " quiz" suffix. Evidence: `design-desktop/arsenal@1440-chips.png`.
- **`/football-wordle/` is a 560px phone card with a 552px void beside it**, left-aligned in a 1112px column, while the hint block directly above spans the full width — a 552px right-edge jump between adjacent blocks. The homepage already solves this with a 2-col grid. Evidence: `design-desktop/footle@1440-card.png`.
- **`/lists/*` is a 760px single column at both widths** (1,160px empty at 1920), with prose at 87–96 characters per line, and full-width 726×52 answer rows holding one-word answers. Evidence: `design-desktop/lists-ballondor@1920-fold-consent.png`.
- **Primary CTAs have no hover state.** Computed style is byte-identical before and after hover on "Play free", "Play today's Footle", "Play the Daily 7", and the club-page banner CTA — while nav buttons and answer options *do* respond. The pattern exists; it wasn't applied to the buttons that matter.

### 11. Footle — the retention engine — is not the destination of any primary CTA — MEDIUM
**What happens:** The nav's Footle entry points at `/football-wordle/`, a 4,931px marketing page. `/footle` loads straight into a playable board in 4.2s and is linked from nothing in the nav; the only homepage link to it sits at y=2,065 of 4,318px (fold 3.1) and is a **180px-wide** button in a 334px column, beside a 154px "Play the Daily 7" — the two most important conversion buttons on the page are the narrowest targets on it, in a layout where every other element is full-bleed.
**Cost:** A returning player — the cohort that produced 62 of 66 three-day-active users — needs three taps and a marketing-page interstitial to reach today's puzzle. Habit products are decided by the friction of the daily return.
**Fix:** Point the nav at `/footle`; add a persistent "Today's Footle" entry to the shared header; make both homepage CTAs full column width under 600px and express hierarchy through fill, not width.
**Evidence:** `strategy-conversion/e1-footle-direct.png`, `safari-mobile/11-home-scroll2000.png`.

### 12. Craft residue — MEDIUM/LOW [mostly unverified]
- **Games dropdown overflows its own panel.** 105px wide, `white-space: nowrap`, `overflow: visible`: "Footle — football Wordle" has scrollWidth 174px in an 89px box and runs across the h1. The first thing a curious visitor taps renders as a broken overlay, and the worst-clipped label names the retention engine. `design-mobile/375x812-08-nav-games-open.png`.
- **Headline scale is flat.** h1 35px vs three h2s at 32px — 91% — same weight, face, case and tracking. The page reads as four equal headline moments. 14 distinct type sizes, seven of them between 12 and 18px.
- **Footle band is 1,430px (2.25 folds) and puts the colour legend 182px *after* its own primary CTA** — the rules arrive after the button.
- **Name-game chrome is shown before anyone presses Play:** a sticky "0 found / Give up" bar above a table whose answers are all still visible, following the reader down 5,000px of table.
- **Lists credibility strip reads `verified 2026-07-20`** — a raw ISO date, 44 days stale today and getting worse on its own — and spends a quarter of the site's only trust line on the word "free", which no reader of a Ballon d'Or list was worried about.
- **16% of the served homepage (10,829 of 67,423 bytes, 23 blocks) is developer commentary**, including a candid note quoting the banned question count and "measured 77.6%". Not user-facing, not a rule violation — but it is on the wire, and it is a free quote for anyone who views source. Strip comments at build; keep every word in the source.

---

## 5. What genuinely works

Not padding — these are things I would tell you to protect while fixing the above.

- **The craft floor is real and measured.** No text node under 4.5:1 anywhere in `.sr`; floor 5.15:1, ink-on-paper 14.71:1. Every primary target 44–52px; the only sub-44 controls on the page are keyboard keys (a convention) and the consent bar's own privacy link. 118 of 119 desktop tab stops show a focus ring. Zero horizontal overflow on mobile at 390, 375, 320 and landscape 750. [contrast/targets/focus unverified]
- **Speed.** WebKit FCP 317ms, DOMContentLoaded 357ms, load 416ms, 17 requests, zero failures, zero console errors. Every SEO page is static HTML carrying its real `<title>` and `<h1>` in the raw response — nothing depends on the SPA booting.
- **The club-quiz arrival is the best screen on the site.** Crest chip, "ARSENAL QUIZ", a "Today's Arsenal set — September 2" freshness line, and the full question above the fold with no scrolling. A fan landing from Google knows immediately what this is. `safari-mobile/06-arsenal-fold-firstvisit.png`.
- **The answer reveal is excellent.** Red ✕ / green ✓ using the same ink-red and ink-green as the ledger, and a WHY panel with real detail. That is a reason to answer a second question. `safari-mobile/08-webkit-after-tap.png`.
- **`/get` platform routing is genuinely well-engineered** — 302s to App Store on iOS UA, Play on Android UA, and `https://balliq.app/play` on desktop macOS Safari. The desktop case is the one most sites get wrong.
- **The verdict bands are the best writing on the site.** *"Anorak — You argue about football with people who lose those arguments."* / *"Matchday — You follow a team. You do not follow the archive."* Dry, specific, unfakeable. Nothing here is filler.
- **Desktop is composed, not stretched.** Homepage `docH` identical at 1440 and 1920 (3,271px); `/quiz/clubs/` is a true 238px sidebar + 874px five-column grid with 65 tappables above the fold; physical-keyboard typing drives Footle on both `/` and `/football-wordle/`. [unverified]
- **The question-count rule is being held.** Ten URLs scanned across five languages: every numeric hit was a rules-of-the-game count ("1 of 5", "QUESTION 1 OF 10"). The only `6,409` on the wire is inside a comment quoting the rule.
- **The "100% explained" chip is computed, not asserted** — it renders only when the pool really is fully explained. I checked because it looked like an overclaim against the measured 77.6%. It isn't one.

---

## 6. Verdict on the Scouting Report conceit

**Keep it. Execute it better. And move it — it is a payoff, not a premise.**

You asked whether you are attached to something that doesn't work. You are attached to the right half and defending the wrong half.

**It earns its place at the end.** The verdict screen is measurably the best thing on the homepage: a 102px score in a tier-coded colour, a 34px tier name, five disciplines resolved to 0-of-1 / 1-of-1 in red and green, and copy that is dry and specific enough that no competitor could have written it. That screen is the reason the taster is five questions long instead of one — the dossier gives a repetitive interaction a narrative shape, so "answer another" feels like a file filling in rather than a quiz repeating. The letterhead costs 61px, updates state ("1 of 5 filed", "verdict filed — passer-by"), and pays for itself. The paper is the only light surface on a 4,137px page, so the 16.2:1 luminance step is doing correct work, not fighting the design. `design-mobile/375x812-11-verdict-slab.png`.

**It does not earn its place at the start, and that is where it currently is.** Pre-answer, `.sr-file` is 736.5px tall, of which `.sr-stubwrap` is **209.5px (28.4%) holding five identical "not assessed" rows**. Add "Subject: you · nothing filed yet" and that is **six null statements before the first tap**. At 375×635 it is the entire second screen; at 1440×900 those five grey repetitions land at y=746–878 on first paint, which is the visual signature of a table that failed to load. And the frame is arriving *instead of* the content: the homepage's second-most-read line, directly under the h1, narrates the UI's own empty state on a page where the words "football" and "quiz" never appear in prose above the fold, with zero images to carry the category. The conceit is being asked to do a job it cannot do — tell a stranger what this is — while the sentence that does that job is shipped to Googlebot.

Two of the lenses split on the tone, and I side with the copy lens: **this is not the passive-aggressive register you rejected before.** That move makes the reader's inaction the subject. "Nothing filed yet" says nothing has been filed *by us*, and "not assessed" is a pending table cell, not a judgement. The tension it creates — *there is a file on me and it's blank* — is the actual hook. Don't change the voice.

**Execute it better, concretely:**

1. **Don't render the five-row stub until `filed >= 1`.** Replace it with one caption line — "Filed so far: 0 of 5 · Premier League, Euros, Transfers, Champions League, Legends" — keeping the promise in 21px instead of 210px. Then grow the table one row per answer, which turns it into the report writing itself that your own lede promises.
2. **Spend the reclaimed ~190px on the missing sentence and one football object.** "Ball IQ is a free football quiz — five questions now, no account, no install", plus a crest beside the taster question so the card announces its subject before it is read.
3. **Change the letterhead's pre-play line.** "Subject: you · football knowledge, unassessed" does the same job and smuggles in the category noun.
4. **At the verdict, put the score above the table** — right now the five-row table leads and the 102px number comes second — and give it one filled-ink primary CTA instead of two identical outlines.
5. **Collapse the two-row 133px mast to one row under 700px.** That 60px is the difference between option A clearing the consent bar at 390 wide or not, and it buys the fold back for the conceit rather than for chrome.

**Replacing it would be a mistake.** Nothing measured is wrong with the metaphor. The homepage's C comes from things adjacent to it — mast height, no images, no category noun, no CTA hierarchy at the payoff, and answers that land off-screen — every one of which is fixable without touching the conceit, and none of which a new concept would fix for free. The dossier is skin over a five-question quiz, which is fine; skin is allowed to be skin as long as it doesn't eat the first screen. Right now it eats the first screen and then does its best work on a screen most visitors never reach.

---

### What could not be tested
Real-device safe-area insets (Playwright reports 0, so the bottom-anchored consent bar may sit ~34px lower on a notched iPhone than measured); Safari's address-bar collapse and the dvh/vh transition; installed-PWA standalone chrome; momentum scrolling and the slow-drag-selects-text problem; VoiceOver and Dynamic Type above default; Search Console this session (connector returned `entitlement_required`, so all GSC figures quoted are prior measurements, not fresh); Clarity session replays (API token outstanding), which would say where visitors actually stop scrolling rather than where the CTA sits; what fraction of homepage visitors finish all five taster questions — if it is small, finding #3 is the cheapest fix but touches few people; and how many WHY explanations sit near the WebKit wrap boundary that clips the Next button (reproduced on one question only).