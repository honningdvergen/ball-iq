# Ball IQ website — strategy report

**Verification status, read this first.** 26 of the findings below (the three lenses marked "completed earlier": SEO-1..6, DM-1..9, DD-1..11) are **UNVERIFIED** — their skeptic passes never ran. They are one pass of one agent with no adversarial check. The four newer lenses (SAF, STR, CV) are also single-pass. I independently re-verified exactly two claims by reading source, and I flag them where I use them. Everything else in this report inherits its confidence from an unchecked measurement. Weight accordingly: the *pattern* across lenses is strong because independent lenses converged on it; any single number could be wrong.

What I verified myself:
- **SAF-1 confirmed at source.** `window.__biqConsentDefer` is set only in `index.html` (lines 356, 373) and read in `public/consent.js:282`. It appears **nowhere** in `scripts/gen-seo-pages.mjs`, which injects `/consent.js` at line 1653. The static pages genuinely do not have the deferral the homepage has.
- **CV-3 confirmed at source.** `scripts/gen-seo-pages.mjs:629` is `<a class="appband-play" href="${SITE.base}/play">Play free in your browser →</a>` — bare `/play`, no club. The scoped URL `/play?club=${cfg.slug}` is already built on the same page at lines 2445, 2446, 2781 and 2823.

---

## 1. Overall strategy grade as a growth asset: **C−**

Split, because the two halves are not the same grade:

| | Grade | Why |
|---|---|---|
| Acquisition | **B** | 255 URLs, static HTML, real schema, hreflang, FCP 317ms in WebKit, ~1,540 clicks/28d from a solo dev. This works. |
| Conversion | **D−** | The surfaces carrying the traffic have nothing to press, and every CTA that does exist points away from the one product measured to create habit. |

C− and not D, because the fix in nearly every case is **re-pointing an existing component**, not building one. The taster exists. `/footle` exists and loads playable in 4.2s. `/play?club=arsenal` exists and serves real Arsenal questions. The parts are built and wired to the wrong terminals.

The grade is not lower than the craft grades from the individual lenses by accident. The lenses graded B−, C+, B−, C+, C on *craft*. Craft is not the constraint. A site can be well-built, well-written, fast and accessible and still be a growth asset that grows the wrong number — which is precisely the measured situation: traffic up, DAU flat.

---

## 2. What this site is actually FOR

**Judged by what it does: it is a football reference library with an app-store storefront attached, and a quiz demo parked between them.**

That is not the stated intent. The stated intent — in the homepage's own crawler-only copy — is "open it in a browser and you are playing in about ten seconds." But intent is not what a layout expresses. Layout is a budget, and here is where the pixels went:

- `/lists/` hub: **12,241px tall, 1 element matching `button` with height > 28px** (the nav hamburger). First link to anything playable at **y=10,834** — fold 16.3.
- `/football-quiz/` — the page aimed at the North Star head term: **1 interactive element** (the hamburger), first play link at **y=5,117 of 6,811** — fold 7.7.
- `/lists/*` leaf pages: the table the searcher came for sits **2,750–2,874px down**, behind a 1,972px quiz block; the answer column is **66–139px off-screen** with no scroll affordance.
- `/quiz/arsenal/`: first store button at **y=848**, first play button at **y=1,269**. The store CTA sits directly under a sentence ending "Play in your browser."
- The verdict, after five answered questions — the single highest-intent moment on the site: CTA order is **App Store (y=772), then "Keep going in the browser" (y=834)**, both identical outline buttons, no filled primary.
- Footle — the retention engine, 62 of 66 three-day-active players — is the destination of **zero** primary CTAs. The nav points at `/football-wordle/`, a 4,931px marketing page.

**Does the layout agree with what the site is for?** It agrees perfectly with "collect impressions and hand off to a store." It disagrees flatly with the site's own two measured laws — *playable beats readable*, and *Footle is where habit forms*. The homepage does not contain the word "quiz" in prose above the fold, contains **zero images**, and its first prose "football" is at character 544, below the fold on both 390 and 375-wide phones.

---

## 3. The biggest leak

**The searcher who arrives never gets to play. Arrival and play are not connected on the surfaces that receive the traffic.**

Two independent mechanisms, both measured, both landing on the same visitor:

**(a) On first contact, the playable thing is covered.** 100% of the ~1,540 Google clicks/28d land on static generated pages. Every one of those pages mounts `#biq-consent` immediately, because the deferral flag exists only in `index.html` — **I verified this in source** (`__biqConsentDefer` present at index.html:356/373, read at consent.js:282, absent from gen-seo-pages.mjs, which injects consent.js at line 1653). The bar is 172px tall on a 664px viewport, occupying y=492–664. Club-page answer options sit at y=467/524/581/638. **Three of four answers are behind the bar at the moment of arrival**, and option A is cut mid-word. The site's one measured competitive advantage is switched off at first paint. *Inferred, not measured:* the blast radius is region-gated, so US arrivals may be unaffected — but the GSC country read puts Netherlands at 2,038 impressions and the Nordics at 1,762, so a large share of arrivals are in the gate.

**(b) Where nothing is covered, there is nothing to cover.** The head-term page and the `/lists` hub each contain exactly one interactive element, and it is the hamburger. That is not a consent problem; it is a composition decision.

**The number that proves it:** `/lists` is 47% of impressions and 4% of clicks — and ~48% of new accounts never play anything. Those two facts are usually read as two separate problems. They are the same problem measured at two points on one funnel: the site is very good at getting people to a page and very bad at getting them to a first tap. Note the honest half of this: the 47%/4% ratio is mostly **rank**, not layout (position 25.8, head terms Google answers in a featured snippet). Fixing the page does not fix the ratio. It fixes what a click is *worth* — which is the half you control.

---

## 4. The three changes with the best effort-to-effect ratio

### #1 — Ship the consent deferral into the static generator
**Effort: one line + a regen of 255 pages.** Add `window.__biqConsentDefer = true;` to the same inline gate in `scripts/gen-seo-pages.mjs` that injects `/consent.js` (~line 1653), mirroring `index.html:356/373`. The scroll trigger and 60s backstop already in consent.js carry the rest. The comment at index.html:227-230 already states the rule this violates.

**Bundle into the same deploy (also one line, also Safari-only, also invisible in the owner's Chrome):** raise `.nav` background from `rgba(10,10,10,0.82)` to near-opaque. WebKit does not paint the `backdrop-filter: blur(14px)` — the nav's scrolling ancestor computes `overflow: hidden auto`, the known condition — so page text reads straight through the logo on every scroll, on every Google landing page. This will not move a number; ship it because it is the owner's stated brief and it costs nothing.

- **What I expect to move:** taster-tap rate on `/quiz/*` and `/lists/*` for consent-region traffic. Not signups.
- **How to tell:** one event, `taster_answer`, dimensioned by page type and consent-region. Read 7 days before / 7 days after. Gate it on `navigator.webdriver` — e2e already put 867 robot rows into prod analytics against a DAU of 13-17.
- **Honest null case:** if arrivals skew non-consent-region, most visitors never saw the bar and this moves nothing. And a tap is not a player — I expect taps up and signups flat, because taps are not the bottleneck. If taps *don't* move, the answer options were never what people wanted, and finding #2 becomes the whole story.

### #2 — Re-point every primary CTA at Footle, and demote the store
Four edits, one day:
- Verdict block: primary becomes **"Play today's Footle →" → `/footle`**, filled ink (currently there is no filled button at all — two identical outlines). Store links drop to a secondary line.
- `gen-seo-pages.mjs:629` — bare `/play` becomes `/play?club=<slug>`. **Verified in source:** the scoped URL is already generated four times on the same page. Today a fan who searched "arsenal quiz", played the taster, and pressed the button promising more is asked about Messi.
- Club pages: swap the store row (y=848) below the play CTA (y=1,269).
- Nav "Footle — football Wordle" → `/footle`, not the 4,931px marketing page.

- **What I expect to move:** the *destination* of everyone who converts, from an app-store listing to a playable daily. Ground truth says that is where the habit is (62 of 66).
- **How to tell:** first-session Footle plays per new anonymous visitor, and the D3 return rate of that cohort, against the 30 days prior. **Watch D3 return, not installs.** Installs will probably fall, and if you watch installs this will read as a regression.
- **Honest null case:** the strategy lens could not measure what fraction of homepage visitors finish all five taster questions. If that fraction is tiny, the verdict CTA is the cheapest fix on the site and touches almost nobody. The club-page CTA swap is the half that definitely sits in front of traffic; the verdict half is the speculative one. Second risk, stated plainly: I have no install-attribution data proving a play CTA beats a store CTA here. That is an argument from the retention data, not a measurement.

### #3 — Delete the interstitials between "yes" and the game
Measured path from landing to a Footle board: **14 taps.** Ten to finish the homepage taster, one on "Keep going in the browser — free", then `/play` asks a **sixth taster question** ("Quick one — give it a go ⚽"), then a full-screen **EXAMPLE scouting-card modal** ("85 OVERALL GOLD… Start building mine") lands **on top of** the welcome banner that says "Start with today's Footle" — covering the Footle card it points at. The visitor just proved intent by answering five questions and is asked to prove it again, then shown someone else's score.

Fix: pass a flag on arrival (`/play?from=report`) and skip both the warm-up question and the example modal for that visitor. Separately, "KEEP THIS REPORT" keeps nothing — `document.querySelector('.sr-verd')` is null on the destination. Either carry the score through or stop using the verb.

- **What I expect to move:** the ~48%-never-play number. This is the only one of the three that attacks it directly.
- **How to tell:** percentage of new anonymous sessions that record a game start, weekly cohort.
- **Honest null case:** if the never-play cohort bounces on the SEO page and never reaches `/play` at all, this removes friction nobody was standing in. That is genuinely possible, and it is why this is #3 despite being aimed at the biggest number. Microsoft Clarity replays would settle it — the connector still needs its API token.

---

## 5. What NOT to do

**Do not ship another content wave.** Not more clubs, not more lists, not the head term. There are already 255 URLs. Impressions are the number that is already growing while DAU is flat; more pages produce more of the number that is not the problem. The `/lists` pattern is measured at 0.15% CTR.

**Do not localise `/lists` (SEO-3).** It looks like the obvious next move — Netherlands has 2,038 impressions with no locale, and localised pages convert 2.6×. But localising `/lists` scales the *worst-converting pattern on the site* into new markets. If anything gets localised, it is `/quiz/*` (2.84% CTR, position 9.8), which already works.

**Do not chase "football quiz" at position 41.** The lever is authority and that is a long game — but more to the point, the page it would land on has **one interactive element and it is the hamburger**. Ranking a page that gives visitors nothing to do converts a rank win into a bounce. Fix the page first; then the rank is worth having.

**Do not do the visual-polish backlog.** All of it is real and none of it is the constraint: headline scale flat at 35 vs 32px (DM-5), fluid type at 1920 (DD-10), the orphaned "up." (DD-7), the ISO date in the trust strip (CV-8), the 210px pre-play "not assessed" ledger (DM-4), the 1,430px Footle band (DM-8). The two design-system findings (DD-5, SAF-6) are the strongest of this group — a Google visitor who taps Home lands on a different-looking site — but a trust wobble is still not why DAU is flat. These are B-grade problems on a C−-grade asset.

**Do not treat an app install as a win.** The verdict's store-first CTA is the most confidently-wrong component on the site: it takes a warm visitor out of a working session, into a store listing, for a download and a re-onboard, in a product that already works in the tab they are in.

**Do not run another audit.** Ranking fundamentals were declared clean on 2026-07-28 and this fleet found the same thing: static HTML, correct schema, no horizontal overflow anywhere, zero failed requests, zero console errors, 317ms FCP. Four more lenses would produce four more grades and zero more players.

**Do not ship any of the three above without its instrument.** Thirteen items closed in 48 hours moved zero numbers. Each change gets one named metric, read at day 7 and day 14, with the null result written down in advance. If the metric does not exist yet, building the metric is part of the change — and a change with no metric is not shipped, it is just deployed.