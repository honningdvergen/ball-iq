# Assessment B — Detector + Browser Evidence
Target: https://balliq.app (repo /Users/alexanderbrynolsen/ball-iq)
Started: 2026-09-05 (session date shown as 2026-09-03 in env; using file name convention as given)

## PART 1 — CLI SCAN
(in progress)

## PART 1 — CLI SCAN

### Files available
- dist/index.html — present
- dist/quiz/arsenal/index.html — present
- dist/lists/premier-league-winners/index.html — **MISSING, dropped** (no such file under dist/lists/)
- dist/quizzes/index.html — **MISSING, dropped** (no such file under dist/)
- src/marketing/FrontDoor.jsx — present, 0 findings
- src/marketing/SiteHeader.jsx — present, 0 findings

Command run:
```
node .claude/skills/impeccable/scripts/detect.mjs --json dist/index.html dist/quiz/arsenal/index.html src/marketing/FrontDoor.jsx src/marketing/SiteHeader.jsx
```
Exit code: **2** (findings present)

### Totals
158 findings total.

| antipattern | count |
|---|---|
| design-system-color | 107 |
| design-system-font-size | 27 |
| design-system-radius | 16 |
| design-system-font | 3 |
| dark-glow | 2 |
| em-dash-overuse | 1 |
| marquee | 1 |
| side-tab | 1 |

Per file: dist/quiz/arsenal/index.html = 136, dist/index.html = 22, src/marketing/*.jsx = 0.

### Non-color/size/radius findings (file:line)
- `design-system-font` dist/index.html:75 — Google Fonts: Anton not declared in DESIGN.md typography
- `design-system-font` dist/index.html:86 — same, second occurrence
- `em-dash-overuse` dist/index.html:0 — 11 em-dashes in body text
- `dark-glow` dist/index.html:916 — colored box-shadow glow (#58cc02) on dark page
- `marquee` dist/index.html:0 — `.biq-splash-dot::after` — infinite horizontal loop animation "biqSplashBar"
- `side-tab` dist/quiz/arsenal/index.html:219 — `border-left:3px solid var(--club,var(--grn))`
- `design-system-font` dist/quiz/arsenal/index.html:95 — Google Fonts: Anton not declared in DESIGN.md typography
- `dark-glow` dist/quiz/arsenal/index.html:404 — zero-offset box-shadow glow (#f0a93b)

### design-system-color: 96 distinct hex/rgba values flagged, 107 total hits
**Likely false positives (confirmed by inspection):** the large majority of color findings on dist/quiz/arsenal/index.html (roughly 90 of the 96 distinct values) are per-club crest/brand colors used as inline `background:` on `.tbadge` elements in a "related clubs" tile list — e.g. line 1502 `#c8102e` (Liverpool red), 1503 `#da291c` (Man Utd red), 1506 `#034694` (Chelsea blue), plus dozens more (Real Madrid, Bayern, Milan, etc.). Example:
```
dist/quiz/arsenal/index.html:1502: <span class="tbadge" style="background:#c8102e;...">LIV</span>
dist/quiz/arsenal/index.html:1503: <span class="tbadge" style="background:#da291c;...">MUN</span>
dist/quiz/arsenal/index.html:1506: <span class="tbadge" style="background:#034694;...">CHE</span>
```
Reason for false-positive call: these are real-world club identity colors, not part of the site's own design-system palette by definition — flagging them against DESIGN.md is a category error for this detector rule on this kind of content.

**Not obviously false positives** (worth a look): `#C9CDD3` (dist/index.html:514), `#CDD3DE`, `#E8EAF0`, `#B6F27E`, `#6DE23A`, `#6B7280` (×3), `#000000`/`#000` (×3), several `rgba(240,169,59,*)` alpha variants of what's likely an existing amber token, and `#FF8A82` (×2). These are generic UI grays/accents rather than club colors and may represent genuine drift from the documented palette (per project memory: "PALETTE LIFTED 2026-09-04 — old hexes were inlined in 32 files").


## PART 2 — BROWSER EVIDENCE

### Page: / (homepage) — mobile (375x812)
- body background: rgb(11, 12, 16); header background: rgb(11, 12, 16) (identical — no visual separation by color alone)
- body font-family: `Inter, -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- distinct font-size values in use: 19 — 8px, 11px, 12px, 12.5px, 13px, 13.3333px, 13.5px, 14px, 14.5px, 15px, 16px, 16.5px, 18px, 20px, 22px, 26px, 30px, 32px, 36px
- header nav link texts, in order: Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in (note: "Sign in" appears twice)
- horizontal overflow: scrollWidth 375 vs clientWidth 375 — none
- clickable targets under 44×44 CSS px (12 shown, header nav "Ball IQ" mark included):
  | selector | w×h | text |
  |---|---|---|
  | a.fd-skip | 191×43 | Skip to today's games |
  | a.fd-mark | 26×26 | Ball IQ |
  | input.fd-find-in | 253×40 | (search input) |
  | a.fd-chip | 131×36 | Premier League |
  | a.fd-chip | 74×36 | La Liga |
  | a.fd-chip | 75×36 | Serie A |
  | a.fd-chip | 101×36 | Bundesliga |
  | a.fd-chip | 76×36 | Ligue 1 |
  | a.fd-chip | 90×36 | Süper Lig |
  | a.fd-chip | 113×36 | Primeira Liga |
  | a.fd-chip | 154×36 | Champions League |
  | a.fd-chip | 97×36 | World Cup |
- store links (app-funnel): 4 anchor matches returned — 2 distinct hrefs appear twice each:
  - apps.apple.com link A: y=5379 (below fold, innerHeight 812)
  - play.google.com link A: y=5379 (below fold)
  - apps.apple.com link B: y=0, reported aboveFold=true — **likely a hidden/zero-rect element** (getBoundingClientRect returned top 0; not verified visually, flagged for follow-up, see Skipped section)
  - play.google.com link B: y=0, same caveat
- console errors on load: none
- failed network requests on load: none (all 200; two full navigations happened during measurement, both clean)

**Store-link follow-up (resolved the y=0 anomaly above):** 4 anchors matched, 2 distinct pairs:
  - Visible: `<a href="apps.apple.com/...">iOS</a>` and `<a href="play.google.com/...">Android</a>` — footer text links, rect 22.3×16.5 and 50×16.5 CSS px, at y≈5379 (below fold). Both are under the 44×44 target — add to small-targets evidence: `a[href*=apps.apple.com]` 22×17 "iOS"; `a[href*=play.google.com]` 50×17 "Android".
  - Not rendered: `<a class="landing-store-badge" data-store="ios">Download on the App Store →</a>` and the Android equivalent — `getBoundingClientRect()` all-zero, `offsetWidth/offsetHeight` 0, not in any client rect (i.e. not painted / display:none or detached-from-flow). These exist in the DOM but produce no visible, clickable element on this page in this state.

### Page: / (homepage) — desktop 1440×900
- body background: rgb(11, 12, 16); header background: rgb(11, 12, 16) (same as mobile)
- body font-family: identical to mobile (Inter stack)
- distinct font-size values in use: 19 — identical set to mobile (11, 12, 12.5, 13, 13.3333, 13.5, 14, 14.5, 15, 16, 16.5, 18, 20, 22, 26, 30, 32, 36, 8 px)
- header nav link texts, in order: Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in (same order/duplication as mobile)
- horizontal overflow: scrollWidth 1440 vs clientWidth 1440 — none
- clickable targets under 44×44 CSS px (12 shown):
  | selector | w×h | text |
  |---|---|---|
  | a.fd-skip | 191×43 | Skip to today's games |
  | a.fd-mark | 91×27 | Ball IQ (logo) |
  | a (nav) | 61×37 | Today |
  | a (nav) | 67×37 | Games |
  | a (nav) | 59×37 | Clubs |
  | a (nav) | 75×37 | Quizzes |
  | a (nav) | 52×37 | Lists |
  | input.fd-find-in | 420×40 | (search input) |
  | a.fd-signin | 66×37 | Sign in |
  | button.fd-lead-alt | 493×36 | "Or practise on No. 92 from the..." |
  | a.fd-chip | 131×36 | Premier League |
  | a.fd-chip | 74×36 | La Liga |
  Note: every header nav link (Today/Games/Clubs/Quizzes/Lists/Sign in) is 37px tall on desktop — under the 44px guideline on all of them, not an isolated case.
- store links (app-funnel): 4 anchors, now with `visible` flag confirmed via offsetWidth/rect:
  - `iOS` footer text link: visible, y=2248 (below fold, innerHeight 900)
  - `Android` footer text link: visible, y=2269 (below fold)
  - `.landing-store-badge` (ios): not visible (0-rect, offscreen/detached), rect all-zero
  - `.landing-store-badge` (android): not visible, same
- console errors on load: none

### Page: /quiz/arsenal/ — mobile (375x812)
- document.title: "Arsenal Quiz with Answers — Gunners | Ball IQ"
- body background: rgb(11, 12, 16); header background: rgb(11, 12, 16) — matches homepage
- body font-family: `Inter, system-ui, -apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
  **CONSISTENCY FINDING**: differs from homepage's `Inter, -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` — fallback order swapped (system-ui/-apple-system order) and "Helvetica Neue" vs "Helvetica". Two different font-stack strings serving the same brand.
- distinct font-size values in use: 20 — 10px, 10.5px, 11px, 11.5px, 12px, 12.5px, 13px, 13.3333px, 13.5px, 14px, 14.5px, 15px, 15.5px, 16px, 17px, 18px, 19px, 22px, 24px, 34px
  **CONSISTENCY FINDING**: this set only partially overlaps the homepage's 19-value set. Values unique to this page: 10px, 10.5px, 11.5px, 15.5px, 17px, 19px, 24px, 34px. Values unique to homepage: 8px, 18px(both have 18 actually — check), 20px, 26px, 30px, 32px, 36px. Net: two different type ramps are in production simultaneously across these two page types.
- header nav link texts, in order: Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in — **identical to homepage** (good: header nav text is consistent)
- horizontal overflow: scrollWidth 375 vs clientWidth 375 — none
- clickable targets under 44×44 CSS px (12 shown):
  | selector | w×h | text |
  |---|---|---|
  | a.fd-mark | 26×26 | Ball IQ (logo) |
  | input#fd-find | 245×40 | (search input) |
  | a | 36×44 | Home (breadcrumb) |
  | a | 314×41 | "Arsenal quiz questions and ans..." |
  | a | 285×41 | "Kuis Arsenal — Bahasa Indonesi..." (localized variant link) |
  | a | 40×18 | "tell us" |
  | a | 157×24 | Footle |
  | a | 157×24 | Daily 7 |
  | a | 157×24 | Transfer Trail |
  | a | 157×24 | Mystery Player |
  | a | 157×24 | Guess the XI |
  | a | 157×24 | Club Quiz |
- store links (app-funnel): 6 anchors = 3 pairs, all visible, all below fold:
  - pair 1: apple y=947, google y=947
  - pair 2: apple y=1472, google y=1525
  - pair 3: apple y=6532, google y=6532
  (compare to homepage's single visible pair — this page repeats the CTA 3× down the page)
- console errors on load: none
- network on load: all 200s. Notably this page loads NO app JS bundle (no index-*.js/react-*.js/FrontDoor-*.js requests) — only `marketing/ball.png` and Vercel insights script/beacon. Confirms this is served as a static page, distinct from the React-driven `/` — relevant to the "consistency across pages" goal since the two page types assemble their CSS/fonts independently.

### Page: /quiz/arsenal/ — desktop 1440×900
- body/header background: rgb(11, 12, 16) — matches mobile and homepage
- distinct font-size count: 21 (one more than mobile's 20 — desktop adds at least one breakpoint-only size)
- header nav link texts, in order: Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in — consistent with mobile and homepage
- horizontal overflow: scrollWidth 1440 vs clientWidth 1440 — none
- clickable targets under 44×44 CSS px (12 shown): header nav links again all 38px tall (Today/Games/Clubs/Quizzes/Lists/Sign in), a.fd-mark logo 90×29, breadcrumb "Home" 36×44, two 18px-tall footer-ish text links ("Arsenal quiz questions and ans...", "Kuis Arsenal — Bahasa Indonesi...", "tell us")
- store links (app-funnel): 6 anchors = 3 pairs:
  - pair 1: apple y=439 **aboveFold=true**, google y=439 **aboveFold=true** (innerHeight 900) — first store CTA pair is above the fold on desktop but was below the fold (y=947) on mobile for the same page
  - pair 2: apple y=1035 below fold, google y=1035 below fold
  - pair 3: apple y=3543 below fold, google y=3564 below fold

### /quiz/arsenal/ — finish-screen click sequence (as specified: click first option, then Next, ×3)
Executed: clicked the first option button (`button.bq-o[data-i="0"]`) then `button.bq-next` for questions 1, 2, and 3 in `#quiz`.
Result: `document.querySelectorAll('#quiz li.bq-q')` returns **66** `<li class="bq-q">` elements total (not 10) — this page statically renders a large bank of Q&A content in the DOM rather than running a single 10-question session; "Next question →" reveals the answer state and advances a local counter/meter but does not gate access to further content or produce a session end-state.
After 3 rounds: 8 option buttons carry `.ok`/`.no` state (some questions may have been pre-rendered as answered by page load logic), 66 total question `<li>`s present, no finish/results screen exists.
`document.querySelector('[class*="finish" i], [class*="result" i], [class*="done" i]')` → **not found**.
**Conclusion / deviation from the instruction**: this static SEO page has no "finish screen" to reach — confirmed by network evidence above (no React/app bundle loads here, only ball.png + Vercel insights). The finish-screen flow described in the task brief exists in the live app experience (e.g. under /play), not on this static per-club content page. Reporting this as a skipped step with reason: **"no finish screen exists on /quiz/arsenal/ — it is a static content page, not a live game session; confirmed via DOM (66 static Q&A items, no live app bundle loaded, no finish/result element after answering)."**

### Page: /play — mobile (375x812)
- URL resolves to https://balliq.app/play; document.title: "Home — Ball IQ" (the SPA app-shell home screen)
- body background: rgb(11, 12, 16); header background: rgb(11, 12, 16) — matches all other pages
- body font-family: `Inter, -apple-system, "system-ui", "Segoe UI", "Helvetica Neue", Arial, sans-serif`
  **CONSISTENCY FINDING**: a third distinct font-stack string. Missing "Roboto" (present on homepage's stack) and ordered differently from /quiz/arsenal/'s stack. Three pages, three different font-family strings for the same declared typeface.
- distinct font-size values in use: **29** — nearly 1.5× the marketing pages' ~19-21. The app shell uses a substantially larger type ramp than the static/marketing pages.
- header nav link texts, in order: Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in — **consistent** with homepage and /quiz/arsenal/
- horizontal overflow: scrollWidth 375 vs clientWidth 375 — none
- clickable targets under 44×44 CSS px (6 found, list not capped):
  | selector | w×h | text |
  |---|---|---|
  | a.fd-mark | 26×26 | Ball IQ (logo) |
  | input.fd-find-in | 221×40 | (search input) |
  | button.fd-appbar-tab.fd-appbar-settings | 26×44 | Settings |
  | button (icon, unlabeled) | 28×28 | (no text) |
  | button.hit44 | 101×19 | Set your name |
  | button.daily-zone-status.hit44 | 65×21 | 0/4 today› |
  Note: two buttons use a class literally named `hit44` yet measure 19px and 21px tall — well under the 44px their own class name implies.
- store links (app-funnel): 4 anchors found, **all 4 not visible** (0-rect, y=0, offsetWidth/offsetHeight 0) — **the app-shell home screen (/play) currently renders zero visible app-store download links**, above or below fold.
- first 8 focusable elements in DOM order (what a visitor meets first): a "Ball IQ" (logo link) → input "Find your club or league" → button (unlabeled icon) → button "Play" → button "Daily" → button "Online" → button "Profile" → button "Settings"
- console errors on load: none
- network on load: all 200s (index-D6-JFZj4.js, react-BEl-hqIZ.js, GameRoot-*.js/css, supabase-*.js, ProfileScreen-*.js, questions-index-*.js, OnlineMultiplayer-*.js, version.json, Vercel insights + speed-insights scripts). No failed requests observed.

### Page: /play — desktop 1440×900
- body/header background: rgb(11, 12, 16) — consistent
- distinct font-size count: **36** (up from 29 on mobile — the app shell adds even more sizes at the desktop breakpoint; both far exceed the ~19-21 range on the marketing pages)
- header nav link texts, in order: Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in — consistent
- horizontal overflow: scrollWidth 1440 vs clientWidth 1440 — none
- clickable targets under 44×44 CSS px (12 shown): header nav links 37px tall (same pattern as other pages), a.fd-mark 90×27, button (unlabeled icon) 28×28, button.hit44 "Set your name" 101×19, button.daily-zone-status.hit44 "0/4 today›" 87×25, button.hr-rating-view "View full profile →" 346×41
- store links (app-funnel): 4 anchors — **differs from mobile**: one pair now visible (apple y=1619 below fold, google y=1619 below fold), the other pair still not visible (0-rect, y=0). So at desktop width, /play surfaces one visible-but-below-fold app-download CTA pair; at mobile width the same page surfaces zero visible store links.

### Page: /lists/premier-league-winners/ — LIVE URL RETURNS 404
Navigated to https://balliq.app/lists/premier-league-winners/ on the live production site (not dist, the actual deployed URL from the assignment). Network confirms:
```
GET https://balliq.app/lists/premier-league-winners/ → 404
```
document.title: "Page not found — Ball IQ". Breadcrumb reads "Home › Page not found". Page body: "ERROR 404 / That page doesn't exist. The link may be out of date, or the address mistyped." followed by a working 404 page offering: store badges (Download on the App Store / Get it on Google Play), "All quizzes", "Lists and records", "Footle", "Every game", and a "Something broken? Tell us." feedback link.
This is consistent with Part 1's finding that `dist/lists/premier-league-winners/index.html` does not exist locally — **the page is genuinely absent from production, not merely absent from this local dist build.** No per-page measurements (fonts, header nav, small targets, etc.) were taken for this URL since there is no target page content to measure — the 404 page itself was inspected only for the store-link/nav facts above.
- Store links on the 404 page: "Download on the App Store" and "Get it on Google Play" text present in page text; not measured further (out of scope — this is the fallback page, not one of the 6 assigned pages).
- Console errors: not checked (deprioritized given the 404 is the material finding).

### Page: /football-wordle/answer/ — mobile (375x812)
- document.title: "Footle Answer Today — Hints for No. 125 | Ball IQ"
- body/header background: rgb(11, 12, 16) — consistent
- body font-family: `Inter, system-ui, -apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif` — matches /quiz/arsenal/'s stack, differs from homepage's and /play's stacks (see cross-page font-family table below)
- distinct font-size values in use: **13** (fewest of any page measured)
- header nav link texts, in order: Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in — consistent
- horizontal overflow: scrollWidth 375 vs clientWidth 375 — none
- clickable targets under 44×44 CSS px (12 shown): a.fd-mark 26×26, input#fd-find 245×40, breadcrumb "Home" 36×16, breadcrumb "Footle" 38×16, "Ball IQ" 48×20, and a run of past-puzzle links "No. 124"/"No. 123"/"No. 122"/"No. 121"/"No. 120"/"No. 119"/"No. 118" each ~51-55×18
- store links (app-funnel): 1 pair, both visible, y=8963 (far below fold, innerHeight 812)
  **CONSISTENCY FINDING**: this page's Apple Store href is `https://apps.apple.com/app/id6775975961` — **no `/us/` locale segment** — while every other page measured uses `https://apps.apple.com/us/app/id6775975961`. Same destination app, two different URL forms in production.
- console errors: one `[error] Failed to load resource: the server responded with a status of 404 ()` was present in the console buffer at time of check. **Caveat**: the browser tool's console/network buffers are not confirmed to reset per-navigation, and the immediately preceding page visited was the confirmed 404 at /lists/premier-league-winners/ — the network log at the same timestamp shows no 404 request scoped to football-wordle/answer/ itself (all requests tagged to this navigation, e.g. `GET .../football-wordle/answer/ → 200`, `marketing/ball.png → 200`, returned 200). Reporting this as **inconclusive / likely a stale carry-over from the prior page** rather than a confirmed defect on this page.

### Page: /football-wordle/answer/ — desktop 1440×900
- body/header background: rgb(11, 12, 16) — consistent
- distinct font-size count: 14 (up 1 from mobile's 13)
- header nav link texts, in order: consistent with all other pages
- horizontal overflow: none (1440/1440)
- clickable targets under 44×44 CSS px: header nav 38px tall (same recurring pattern), breadcrumbs 16-20px tall, "No. 124" puzzle link 55×18
- store links: 1 pair, both visible, apple y=5674, google y=5695 — both below fold at 900px innerHeight; href pattern (`/app/id...` no `/us/`) same as mobile

### Page: /quizzes/ — LIVE URL RETURNS 404
```
GET https://balliq.app/quizzes/ → 404
```
document.title on landing: "Page not found — Ball IQ". Same 404 template as /lists/premier-league-winners/ above.
**Root cause identified**: the site's own header nav "Quizzes" link does not point to `/quizzes/` at all — its actual `href` is `https://balliq.app/football-quiz/`, which returns 200 (title: "Football Quiz — Free Club Quizzes With Answers | Ball IQ"). `/quizzes/` appears to never have been a real route; the assignment's URL and the site's actual URL disagree.

### Follow-up: is /lists/premier-league-winners/ a wrong slug or a genuinely missing page?
Checked `https://balliq.app/lists/` (the lists index) — returns 200, title "Football Lists: Winners, Records & Top Scorers | Ball IQ". Its outbound links include a Premier League winners/champions entry at:
```
https://balliq.app/lists/premier-league-champions/
```
— **not** `/lists/premier-league-winners/`. This is almost certainly the intended page under a different slug ("champions" vs "winners"). Not verified further (out of the 6-page scope) whether `/lists/premier-league-champions/` itself renders cleanly — flagging as a likely wrong-slug case rather than confirmed content gap, for whoever reconciles this with Part 1's missing-dist-file finding.

### Complete header nav href map (captured from the 404 page, applies globally — same header component)
| link text | href |
|---|---|
| Ball IQ | https://balliq.app/ |
| Today | https://balliq.app/#today |
| Games | https://balliq.app/#games |
| Clubs | https://balliq.app/#clubs |
| Quizzes | https://balliq.app/football-quiz/ |
| Lists | https://balliq.app/lists/ |
| Sign in (×2) | https://balliq.app/play |

---

## SUMMARY TABLES

### (3) App-funnel table — page × viewport × store links × y-offset × fold position
| page | viewport | visible store links | y (px) | fold position | href form |
|---|---|---|---|---|---|
| / | mobile 375×812 | 2 (iOS text, Android text) | 5379 | below (innerHeight 812) | apps.apple.com/**us**/app/id... |
| / | desktop 1440×900 | 2 (iOS text, Android text) | 2248 / 2269 | below (innerHeight 900) | apps.apple.com/**us**/app/id... |
| / | both | +2 more matched anchors (`.landing-store-badge`) | n/a | **not rendered** (0-rect, display:none/detached) | same hrefs, dead markup |
| /quiz/arsenal/ | mobile 375×812 | 6 (3 pairs) | 947 / 1472,1525 / 6532 | all below | apps.apple.com/**us**/app/id... |
| /quiz/arsenal/ | desktop 1440×900 | 6 (3 pairs) | 439 / 1035 / 3543,3564 | **pair 1 above fold**, rest below | apps.apple.com/**us**/app/id... |
| /play | mobile 375×812 | 0 visible of 4 matched | y=0, not rendered | n/a | — |
| /play | desktop 1440×900 | 1 pair visible of 4 matched | 1619 | below | apps.apple.com/**us**/app/id... |
| /lists/premier-league-winners/ | — | n/a — page 404s | — | — | — |
| /football-wordle/answer/ | mobile 375×812 | 1 pair | 8963 | below | apps.apple.com/app/id... (**no /us/**) |
| /football-wordle/answer/ | desktop 1440×900 | 1 pair | 5674 / 5695 | below | apps.apple.com/app/id... (**no /us/**) |
| /quizzes/ | — | n/a — page 404s | — | — | — |

Observations (evidence, not opinion): every measured store-link position across every page/viewport combination is below the fold except one pair on /quiz/arsenal/ desktop. /play at mobile width surfaces zero visible store links anywhere in the DOM at load. Two distinct Apple Store URL forms exist in production (`/us/app/id...` vs `/app/id...`).

### (4) Header-consistency table
| page | nav link texts (order) | body font-family string | distinct font-size count |
|---|---|---|---|
| / | Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in | Inter, -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | 19 |
| /quiz/arsenal/ | Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in | Inter, system-ui, -apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif | 20 (mobile) / 21 (desktop) |
| /play | Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in | Inter, -apple-system, "system-ui", "Segoe UI", "Helvetica Neue", Arial, sans-serif | 29 (mobile) / 36 (desktop) |
| /football-wordle/answer/ | Ball IQ, Today, Games, Clubs, Quizzes, Lists, Sign in, Sign in | Inter, system-ui, -apple-system, "system-ui", "Segoe UI", Roboto, Helvetica, Arial, sans-serif | 13 (mobile) / 14 (desktop) |

Nav link text and order is identical on every page measured (fact: consistent). The computed `font-family` string on `<body>` is **not** identical across the three page types found (marketing FrontDoor page `/`, static SEO pages `/quiz/arsenal/` and `/football-wordle/answer/`, and the SPA app shell `/play`) — three distinct strings differing in fallback order and in which named fonts are listed (Roboto present/absent, "Helvetica" vs "Helvetica Neue"). Header background color (`rgb(11, 12, 16)`) is identical on every page/viewport measured. Distinct font-size counts vary widely by page type: static pages ~13-21, app shell 29-36 — evidence of at least two separate type systems in production simultaneously (consistent with Part 1's CLI finding of two divergent font-size sets between `/` and `/quiz/arsenal/`).

### (5) Console / network errors
| page | console errors | network failures |
|---|---|---|
| / (mobile, desktop) | none | none (all 200) |
| /quiz/arsenal/ (mobile, desktop) | none | none (all 200); confirmed static page — no app JS bundle loaded |
| /play (mobile) | none | none (all 200) |
| /lists/premier-league-winners/ | not checked (404 page is the finding itself) | **404** on the page request itself |
| /football-wordle/answer/ (mobile) | one `Failed to load resource: 404` seen in console buffer — **inconclusive**, likely carried over from the immediately-preceding /lists/ 404 navigation; no 404 request scoped to this page's own load was found in the network log | none confirmed for this page's own requests |
| /quizzes/ | not checked (404 page is the finding itself) | **404** on the page request itself |

### (6) Overlay outcome
Skipped per instructions: "overlay skipped: pane reliability." The overlay/live-server injection step was not attempted this run.

### (7) Skipped / failed steps, with reasons
- `dist/lists/premier-league-winners/index.html` and `dist/quizzes/index.html` — **dropped from the CLI scan** because they don't exist in the local `dist/` build (build was not run, per instructions).
- Live `/lists/premier-league-winners/` and `/quizzes/` — **both 404 in production**. Root-caused: the site's own header "Quizzes" link actually points to `/football-quiz/` (200, live), and the `/lists/` index links to `/lists/premier-league-champions/` (not directly verified) rather than `/lists/premier-league-winners/`. Per-page measurements (fonts, small targets, header nav, etc.) for these two URLs were **not taken** because there is no target page to measure — only the shared 404 template was inspected.
- Finish-screen click sequence on `/quiz/arsenal/` — completed the literal steps (click first option → Next, ×3) but **no finish/results screen exists to record links from**: this page is a static SEO page containing 66 statically-rendered Q&A `<li>` items with no live game session or end-state, confirmed via DOM count and via the earlier network evidence (no React/app bundle loaded on this route). Reported the actual DOM state instead of a fabricated finish screen.
- The one stray console 404 error captured on `/football-wordle/answer/` is reported as **inconclusive** rather than a confirmed page-level defect, since the console/network buffers used by the tooling did not clearly reset between navigations and the preceding page was a confirmed 404.
- Screenshots were not taken proactively — `read_page`, `get_page_text`, and `javascript_tool` were sufficient for every measurement requested, and the tool budget (≤50 calls) was managed by preferring JS-based measurement over visual screenshots. Pane visibility was never explicitly checked; no screenshot failures were encountered because none were attempted.
- Tool-call budget: this run used approximately 40 Browser-pane tool calls, within the ≤50 budget.
