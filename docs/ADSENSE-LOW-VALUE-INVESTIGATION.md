# AdSense "Low value content" — investigation synthesis (2026-08-11)

Three research passes: Google's own policy docs, documented approval case studies, and a
live fetch-and-measure of balliq.app itself. Cross-checked against docs/TODO.md.

## 1. Verdict

1. **CONFIRMED, biggest on-site trigger:** the 75 `/questions/<club>-quiz-questions-and-answers/` pages near-duplicate their `/quiz/<club>/` twins (Liverpool pair: 58% 8-word-shingle overlap, both self-canonical, both in the sitemap, ~zero inbound links) — two indexable keyword-variant pages per club is the textbook doorway/scaled-content pattern, and it is 27% of all indexable URLs.
2. **CONFIRMED, external and dominant:** site maturity + traffic. ~80 active users, "football quiz" at p41, and the URL count exploded (waves H–N + 50 lists) during the exact window the application sat in review — case studies show this trajectory alone earns "low value" with zero content faults, and one documented approval came from changing nothing and waiting.
3. **CONFIRMED, reviewer-first-impression:** the homepage is the thinnest page on the site (~560 visible words), structured as an app-install funnel; plus reviewer-visible contradictions — every page's footer says "no ads in the app" while applying for AdSense, and /about says "one developer" while lists credit "the Ball IQ football team".
4. **LIKELY:** anonymous E-E-A-T — the forge/verification machinery is real but invisible on-page; /mystery-player/ sells a disabled mode (board task #3).
5. **RULED OUT** (do not spend here): text volume (40–61KB/page), navigation/404s, live-ad-unit hygiene (prod verified clean — no `<ins>`/data-ad-slot anywhere, the "stale build with live units" premise was false), localised pages (hreflang clean, 1,100+ words), and the / vs /play duplicate (byte-identical, but /play already canonicals to / and is out of the sitemap — the fix in flight covers what remains).

## 2. Remediation checklist — by impact per effort

| # | Action | Effort | Status |
|---|---|---|---|
| 1 | **/questions/ pages: rel=canonical to the /quiz/ twin, drop all 75 from sitemap.xml** (keep them live as the print/pub-quiz surface). Removes the single strongest doorway signal. | Small (generator + sitemap) | NEW — not on the board |
| 2 | **Fix the footer contradiction**: "Ball IQ is 100% free — no ads in the app." → "The iOS and Android apps carry no ads." One string in the page generator, ~285 pages. | Trivial | NEW |
| 3 | **Noindex/de-link /mystery-player/** while MYSTERY_ENABLED=false. | Trivial | ALREADY ON BOARD — task #3, flagged as live defect |
| 4 | **One identity story**: Alex's name (or consistent pen name) on /about; lists byline "the Ball IQ football team" → match /about. Generator string change. | Trivial | NEW |
| 5 | **Surface the verification machinery**: "How we verify every question" methodology page + "facts verified as of <date>" on quiz pages (lists already show verified-dates — extend the pattern). /about, /contact, privacy, terms already exist and are linked. | Small | Partially done (lists dates, contact via Cloudflare routing) |
| 6 | **Freeze new page waves 3–4 weeks pre-resubmission** so the URL-growth curve looks organic at review time. | Zero (restraint) | Aligns with board stance — "more pages do not fix this" |
| 7 | **Homepage content-forward band**: prose + playable taster module + quiz/lists hub links visible in the first screens; keep the "Both" hero (binding). | Medium | ON BOARD — homepage v5 rebuild, currently parked/deferred |
| 8 | **Scope the 120-link footer club index** per page (league-mates + flagships + hub) instead of the full directory on all ~285 pages. | Small | NEW |
| 9 | **Thin-club floor**: Hajduk (15), Leipzig (20), Bournemouth (24) under the 25-Q floor; their pages have the worst boilerplate ratio. | Medium | ALREADY ON BOARD — task #7 |
| 10 | **Localised near-orphans** (9 pages, 1 inbound link each, thesis measured dead): noindex or delete. | Small | ON BOARD — awaiting Alex's editorial call (TODO ~line 670) |
| 11 | Optional: 3–5 genuinely authored editorial pieces (the Kobadoo fix). Lower priority — the raw-text gap Kobadoo had is already closed here. | Medium | NEW, optional |

Already done, no action: /play canonical + sitemap exclusion, proper 404s, ads.txt,
playable tasters on every page class, hreflang pairs, dormant ad slots (keep them dormant).

## 3. Resubmission protocol

**Before requesting re-review, all of this must be LIVE and re-crawled:**
1. Deploy items 1–4 (and 5 if quick) in one release; verify on prod by fetching the built HTML, not by HTTP 200.
2. Request indexing on the changed URL classes in GSC (sitemap resubmit + spot "request indexing" on /, /quiz/liverpool/, one /questions/ page).
3. **Wait ~3 weeks** for recrawl — a review of the un-recrawled site scores the old site.
4. Run the wave freeze (item 6) concurrently with the wait; ship no new URL batches until after the verdict.
5. **Resubmit ONCE.** Each review cycle runs ~2–4 weeks; realistic rejection-to-approval loops run 6–10 weeks total.

**Cadence limits (documented):** Google tracks application history; rapid cheap resubmits
push you down the queue, and repeated rejections can trigger an enforced ~3-month lockout
(one documented case: 6 rejections → lockout → approved on attempt 7). Do not burn attempts.

**Expectation setting:** with ~80 users and p41 authority, traffic maturity may force one
more cycle even with every on-site fix landed. AdSense approval is downstream of the same
authority/distribution work that is already board tasks #1–2 — a resubmission after a
visible traffic uptick (store push, PL-start social plans) materially improves odds.

## 4. What NOT to do (superstition list — asserted in listicles, never shown causal)

- **No word-count padding** (1,000–1,500-word floors) and **no bulk rewrites** of the 285 pages — one case measured a deep rewrite landing at exactly site-average; volume is affirmatively NOT the failing dimension, and adding scale without trust signals moves the site TOWARD the scaled-content pattern.
- **No "25–30 articles minimum"** — 3–5 real pieces sufficed in the closest documented case.
- **No more pages or lists as a response** — 49 lists already compete for the same authority.
- Linking Google Analytics, ads.txt tweaks (post-approval plumbing), image alt-text passes: no documented effect on approval.
- The "approve a blog, then pivot to the tool" workaround: TOS-risky, skip it.
- Do not touch the ad-unit code before approval — prod is verified clean and slots stay dormant (board task #10 flips them on after approval).

Sources: Google spam-policies / helpful-content / AdSense answers 9724, 81904, 12176698,
48182; case studies: blog.arturocalvo.com (Kobadoo), promoteproject.com/article/221121,
checkadsense.com, blog.lans.cloud, captainrandom.co.uk, dev.to/tamethebot,
lazyjobseeker.github.io; live measurements: balliq.app fetches 2026-08-11.
