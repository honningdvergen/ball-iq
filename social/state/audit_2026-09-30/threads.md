# Threads truth audit — 2026-09-30 01:50 Oslo (READ-ONLY; Claude "Threads truth" agent)

Scope: @shithouseryhq on Threads, 2026-06-01 → 2026-09-29 (posts), account-level series back to 2026-04-30.
Nothing was posted, queued, scheduled, deleted or edited. Threads Graph API was used with GET only.
One process slip to disclose: an early account-insights probe printed a raw paging URL (`paging.previous`, which carries `access_token=`) into MY tool output. No file contains it (grep-checked the CSV in this folder), it was not repeated, but the token existed in this agent's transcript: consider rotating `shq-threads-token`.

## 0. Data pulled (all GET)
| dataset | source | coverage |
|---|---|---|
| per-post views/likes/replies/reposts/quotes/shares | `GET /me/threads` + `/{id}/insights` | 1,837 posts 2026-06-01 → 09-29 (this folder: `threads_posts_export.csv`) |
| account daily views | `GET /me/threads_insights?metric=views&since=…` | 153 daily values 04-30 → 09-29 (label = window END 07:00 UTC, i.e. PT-day D-1) |
| account totals 07-31 → 09-30 | same, likes/replies/reposts/quotes/clicks | views 30,522,842; likes 207,996; replies 10,019; reposts 2,606; quotes 181; link clicks 2 |
| followers now | `followers_count` | 42,083 at 2026-09-30 01:42 Oslo |
| follower demographics | `follower_demographics` | IN 12.0%, GB 10.6%, US 10.2%, NG 7.0%, KE 6.9%; 73% male (30,600 of 42,063), 18-34 = 60%, 13-17 = 3,459 (8%) |
| own replies | `GET /me/replies` | 47 replies since 08-23 |
| media (for visual sampling) | `media_url` | 524 images since 08-31; 90 viewed in contact sheets (top/mid/bottom 30) + last 48 h |
Reconciliation: sum of post-level views 07-31→09-29 = 30,400,196 vs account-level 30,522,842 (99.6%); likes 206,539 vs 207,996. Deleted-post survivorship bias is negligible (1 of 144 posts in the 09-23→09-29 insight snapshots is gone; it had 346 views).
Maturity: from the 6 older insight snapshots (social/state/insights/2026-09-2x.json) vs today's API values: median post at age 12-24 h has 1.05x still to come, 0% grow >1.5x; at age 3-6 h the median is 1.36x but the p90 is 693x (tail posts take off late). Mature = older than 48 h (conservative). n small (20-28 per bucket).

Calendar context (verified by web search 2026-09-30, Wikipedia '2026 FIFA World Cup'): the World Cup ran 2026-06-11 → 2026-07-19, so the 06-23→07-18 regime below is a World Cup regime. Regimes are therefore confounded with football-calendar attention.

## 1. Account facts (measured)
- Followers: 09-21 40,722 (Alex's Insights screenshot per memory) → 41,264 (09-23 19:58 Oslo) → 41,369 (09-24) → 41,482 (09-25) → 41,795 (09-27 23:44) → 41,874 (09-28 21:32) → 41,991 (09-29 18:33) → 42,083 (09-30 01:42). Net/day: +105, +113, +145, +87, +134, ~+92 (partial). Last 6.2 days: +819 = +131/day.
- Brief said Threads ~25K. Wrong: 42,083 today (PLATFORM_PLANS says 41.8K).
- Views/day (label-day, Oslo 09:00→09:00): median 221,518 for 09-01→09-27; mean 501,279; only 15% of days >= 600K, 15% >= 1.4M.
- Post counts (Oslo day): 09-28 = 10, 09-29 = 10 (3 text posts on 09-28; 0 on 09-29; 2 posts after 22:00 on 09-29 (22:03, 22:42)).
- Distribution since 08-31 (mature, n=532): p10 311, p25 614, p50 1,242, p75 3,539, p90 21,953, p95 65,478, p99 508,504; mean 28.8K; SD of log10 views 0.75 (5.6x). One post's view count is a very noisy signal.
- Top 5 posts since 08-15 = 48.5% of 29.4M views; top 45 posts (4.8% of posts) = 82.6%.

## 2. Followers vs posts/day (the question Alex cares about)
| regime | days | posts | posts/day | account views | net followers | net/day | followers per post | follows per 10K views |
|---|---|---|---|---|---|---|---|---|
| 06-23→07-18 (anchor 26.7K on 07-18 from memory feedback_daily_social_posting.md; 13.2K on 06-23 derived from Alex's 90d "+27.5K") | 26 | 522 | 20.1 | 17.7M | ~+13,500 | ~519 | 25.9 | 7.6 |
| 07-19→09-20 | 64 | 942 | 14.7 | 26.6M | ~+14,000 | ~219 | 14.9 | 5.3 |
| 09-21→09-29 (40,722 → 42,026 at 09-29 20:28) | 9 | 145 | 16.1 | 8.77M | +1,304 | 145 | 9.0 | 1.5 (1.1-1.2 for 09-23→09-29) |
- Volume was flat (20 → 15 → 16/day) while net followers/day fell 72% and follows per 10K views fell ~5x. Posts/day does not explain follower gain.
- Alex's Insights 90d (to 09-21): 44.3M views, +27.5K followers = 6.2 per 10K. The API series over 06-22→09-20 sums to 45.3M (2% off), so the series is valid.
- 09-23→09-28: daily net +79…+145 regardless of daily views (76K on one label day, 2.27M and 2.08M on two others). Mega-hit days add tens of followers, not hundreds (matches memory project_social_rootcause: 2.26M-view post = +330-430).
- Hourly follower log 09-29 (social/state/dashboard_history.jsonl): overnight 09-28 19:32Z→09-29 12:00Z +73 in 16.5 h (4.4/h); 12:00Z→23:42Z +136 in 11.7 h (11.6/h). Daytime follows run ~2.6x the overnight rate; no visible spike after the 102K post (inferred: diurnal + viral mix, cannot separate).
- Weekly (17 weeks, 06-01→09-27): Spearman(posts/day, weekly account views) = +0.71; (posts/day, views per post) = +0.04; (posts/day, median) = -0.25. Day-level (115 days): more posts/day → more total views (median day total 106K at 6-10 posts, 315K at 16-20, 652K at 31+) but flat median per post (1.8K, 1.9K, 1.5K, 1.7K, 1.5K across buckets from 6-10 up to 31+). Only days with 1-5 posts show a high median (17.9K, n=17 days; selection: hand-picked posts + World Cup lull).
- So: volume is a lottery-ticket multiplier of VIEWS (~proportional), not of followers. Confounded by news cycle; n=3 regimes for followers; anchors approximate.

## 3. Weekly table (Oslo-week from Monday)
| week | posts/day | median | mean | hit>=10K | n>=50K | n>=100K | account views/wk |
|---|---|---|---|---|---|---|---|
| 06-01 | 11.4 | 801 | 15.4K | 15.0% | 6 | 4 | 1.03M |
| 06-08 | 9.1 | 1,064 | 6.3K | 15.6% | 2 | 0 | 0.43M |
| 06-15 | 9.9 | 1,661 | 41.4K | 31.9% | 14 | 10 | 3.28M |
| 06-22 | 20.6 | 3,128 | 33.1K | 35.4% | 25 | 12 | 5.16M |
| 06-29 | 28.3 | 2,142 | 19.8K | 25.3% | 24 | 11 | 3.56M |
| 07-06 | 19.4 | 2,080 | 51.0K | 29.4% | 20 | 11 | 6.98M |
| 07-13 | 12.6 | 2,634 | 53.9K | 34.1% | 18 | 11 | 4.70M |
| 07-20 | 6.9 | 4,608 | 51.3K | 45.8% | 11 | 4 | 2.54M |
| 07-27 | 2.3 | 19,807 | 59.8K | 56.2% | 5 | 4 | 0.82M |
| 08-03 | 3.6 | 1,627 | 16.1K | 20.0% | 2 | 1 | 0.53M |
| 08-10 | 7.9 | 5,340 | 13.3K | 34.5% | 4 | 0 | 0.63M |
| 08-17 | 23.1 | 1,558 | 50.6K | 22.8% | 10 | 5 | 8.39M |
| 08-24 | 28.7 | 1,575 | 25.8K | 23.4% | 17 | 11 | 5.55M |
| 08-31 | 22.3 | 1,768 | 22.8K | 26.3% | 10 | 7 | 3.05M |
| 09-07 | 20.3 | 1,164 | 9.5K | 16.2% | 8 | 3 | 1.29M |
| 09-14 | 15.7 | 858 | 4.8K | 8.2% | 3 | 0 | 2.09M |
| 09-21 | 17.7 | 1,130 | 79.7K | 12.1% | 9 | 8 | 8.45M |
| 09-28 (2 days) | 2.7/wk-avg (10/day actual) | 2,545 | 24.7K | 36.8% | 4 | 2 | partial |
- Every week since 06-01 had >= 2 posts >= 50K: the plan KPI ">=1 post >=50K/week" has been met in 18 of 18 weeks, so it carries no signal. >=100K/week is the discriminating one (0 in 06-08, 08-10, 09-14).
- Per-post reach eroded: share of mature posts >=50K: 14.0% (06-01→07-19), 12.7% (07-20→08-19), 8.0% (08-20→08-30), 6.0% (08-31→09-13), 5.1% (09-14→09-27); >=10K: 27.6%, 35.9%, 22.7%, 21.5%, 10.3%; median 2,141 / 2,894 / 1,522 / 1,478 / 1,005.

## 4. Format comparison (mature posts since 08-31 unless stated; permutation tests on log10 views)
| type | n | median | hit>=10K | >=50K | zero-like | likes/1K views (median post) | share of posts | share of views |
|---|---|---|---|---|---|---|---|---|
| IMAGE | 385 | 1,276 | 17.4% | 27 | 2 | 15.5 | 72% | 94.8% |
| CAROUSEL | 69 | 1,969 | 24.6% | 3 | 0 | 11.4 | 13% | 4.1% |
| VIDEO | 54 | 623 | 5.6% | 0 | 3 | 12.0 | 10% | 0.8% |
| TEXT | 24 | 1,182 | 4.2% | 0 | 6 | 3.3 | 4.5% | 0.3% |
- Video vs image: 0.49x, p=0.0003. Text vs image: 0.93x, p=0.74 (no median difference; but engagement per view is 5x lower and 25% get zero likes). Carousel vs image: 1.54x overall (p=0.016), but 2.61x in 08-31→09-13 (n=51, p=0.002) and 1.17x in 09-14→09-27 (n=18, p=0.61): the carousel edge is not stable.
- Visual sampling (90 images, by eye + a white-pixel proxy on 385 images): raw light-mode tweet screenshots (>=45% white pixels, n=21) median 1,464 ≈ baseline; a light card panel at the bottom of a photo (quote cards / tweet-on-photo, n=65) 2,560 median, 32% hit overall but 41.9% (n=43) in 08-31→09-13 vs 13.6% (n=22) in 09-14→09-27 (no better than plain photo/dark at 13.0%). Dark cards evade the proxy. Raw screenshots can hit (UtdChulo QPR/City 144K on 09-28, Tempy Pusha Croatia 69.6K): the story hook matters more than the frame.
- Own-format micro-sample 09-28/29 (posts_log format tags): "absurd-but-true maths" 16.6K, 11.5K, 1.3K, 68.6K (Daily Number #1); "receipt (own graphic)" Chelsea-sold-£62m 2.2K, Forest cups 957; 4-panel Torres world cups 4.2K; ragebait ranking card 933 (1 like); hero-own-line (our line as tweet card on photo) Croatia 1.1K, Yamal 1.3K at only ~3 h old (median growth still 1.4x). n too small for any format verdict.
- Text-caption features: 🚨-start since 08-31: n=44, median 2,208, 34% hit (1.87x, p=0.005) but in 06-01→08-30 n=153 median 1,206 vs 2,100 baseline (sign flips). Ends-with-"?": since 08-31 n=31, 1.53x (p=0.10); 06-01→08-30 n=84, median 9,059, 47.6% hit. "[fans] fans" wording: 11.8% hit since 08-31 (below 16.5% baseline). Caption <=60 vs >160 chars: 16.0% vs 17.7% (no difference). 😭/😅/😂 present: 16.9% vs 16.5%. No big-name/storyline mention: 12.4% hit (n=193) vs Chelsea 28.0%, 'Enzo' (Fernandez/Maresca storyline) 41.7% (n=24), Man United 8.1% (n=62).
- Maths posts (7 since 06-01): the 3 IMAGE versions = 991K, 3.29M, 68.6K; the 3 TEXT versions (09-22/23/24) = 2.4K, 0.8K, 0.1K. Format and "projection vs hypothetical" are confounded.
- Third-party graphics: at least 4 top/mid posts carry another account's logo in the corner (Plaantik-style quote cards: Deco 199K verified at full resolution; Enzo Fernandez, Enzo Maresca, Ferland Mendy by eye at thumbnail size). Reach is fine today; originality risk unmeasured (inferred).

## 5. Time of day and density (since 08-31 mature, n=532; "day-adjusted" = log views minus same-Oslo-day median)
| Oslo hour | n | median | hit>=10K | zero-like | day-adjusted |
|---|---|---|---|---|---|
| 00-05 | 24 | 1,538 | 12.5% | 0 | 1.1x |
| 08-10 | 20 | 4,206 | 30.0% | 0 | 2.9x (p=0.01) |
| 11-13 | 93 | 1,353 | 15.1% | 1 | 1.1x |
| 14-16 | 95 | 1,158 | 17.9% | 3 | 1.0x |
| 17-19 | 120 | 1,309 | 18.3% | 1 | 1.0x |
| 20-21 | 75 | 1,218 | 18.7% | 1 | 0.93x |
| 22-23 | 105 | 869 | 11.4% | 5 | 0.85x (p=0.08; raw 0.68x p=0.005) |
- The 08-10 premium is n=20 and only exists since 08-31: in 06-01→08-30 (n=78) it was 0.96x (p=0.68); best summer hours were 11-16 (33-37% hit).
- Density (our own posts in the prior 60 min): 0 → 1.12x, 1 → 1.03x, 2 → 1.01x, 3 → 1.00x, >=4 → 0.75x same-day median (n=77; 0.73x p=0.026); >=3 vs <3 0.84x (p=0.049). Gap to previous post: <15 min 0.96x … 60-179 min 1.0x, 180+ 1.34x (n=37). In summer, prev60 gave no within-day effect (1.00x each). About 15 tests were run in this audit: expect ~1 false positive at p<0.05.
- Zero-like posts since 08-31: 11 of 551 (2.0%): 6 text, 3 video, 2 image; 5 of 11 at 22:00-23:59 Oslo.
- 09-29 intraday: 12:44 (102K), 13:42 (68.6K), 14:53 (33K) vs evening 17:33/19:30/21:00/22:03/22:42 all 0.9-2.5K (evening ones only 1-5 h old, median 1.4x still to come). The same Etihad aerial photo: satirical "Proper punishment" 12:44 = 102K; factual "🚨 BREAKING … found GUILTY" 21:00 = 2.5K.

## 6. A_GRADE_PLAN Threads rules: evidence vs superstition
| rule | verdict | evidence |
|---|---|---|
| no video cross-posts | EVIDENCE (strong) | 0.49x, p=0.0003, 0 of 54 >=50K |
| no text-only | WEAK / harmless | median equal (0.93x, p=0.74); 3.3 vs 15.5 likes/1K, 25% zero-like; only 0.3% of views |
| image-or-carousel, carousel not preferred | carousel edge = SUPERSTITION for now | vanished 09-14+ |
| <=2 posts/hour | stricter than the data | only >=4/hour hurts (0.75x, p~0.03); >=3 marginal |
| window 08:00-22:00 Oslo | WEAK | 22-23h 0.85x day-adjusted (p=0.08), zero-likes cluster; 08-10 premium n=20 unstable; match-night exception right (09-28 Belgium-France maths 22:44 = 11.5K, ~9x median, flagged as a violation) |
| >=7 originals/day | UNSUPPORTED both ways | views ∝ volume; per-post median flat; followers not tied to volume |
| median >=3K target | ambitious | met in 4 of 17 weeks since 06-01 (06-22, 07-20, 07-27, 08-10), 3 of them at <9 posts/day; none since 08-17; every 15+/day week since 08-17 was 0.86-1.8K |
| >=1 post >=50K/week | NO SIGNAL | met 18/18 weeks |
| follows/10K >=3 AND net +180/day | INCONSISTENT with achieved views | +180/day needs 600K views/day at 3/10K (15% of Sept days) or 1.4M/day at today's 1.3/10K (15% of days) |
| 10 outbound replies/day | NOT BEING DONE | 3 outbound replies in 37 days (see 8) |
| pin + self-reply follow line within 60 min | UNTESTED | 0 CTA replies ever (0 of 47 contain follow/CTA words); API cannot pin |

## 7. threads_winners_study.md (09-29): claim-by-claim
- REPLICATES: hit-rate series 21→23→26→16→8→12% (mine 22.8, 23.4, 26.3, 16.2, 8.2, 12.1); top-5 ≈ half of views (48.5%); type table (carousel n=69 med 1,969 hit 25%; image 1,290/18.5%; video 623/5.6%; text 1,242/3.7%); 0-like 11 vs 13 posts; 🚨 style 34% hit (n=44); caption length no effect; club mentions weak; density penalty (0.75x vs -43%).
- DOES NOT REPLICATE / OVERSTATED: (a) carousel advantage is a 2-week artifact (see 4); (b) "all five mega-hits tied to a moment from the last ~24h": Ramos "Never forget" (08-31), the Spurs win-all-33 hypothetical and the hairstyles list are not; (c) "🚨 best style" flips sign in summer; (d) "8 of 13 zero-likes at 20:00-21:59 UTC" = 5 of 11 in my pull (45%); (e) "audience is global" cites follower demographics (IN 12.0, GB 10.6, US 10.2, NG 7.0, KE 6.9 — matches), not viewers; (f) "volume did not raise the median" is true but irrelevant: total views scale with volume (rho +0.71); (g) morning 06-09 UTC premium = 20 posts, absent in summer; (h) "all five images" says nothing: 72% of all posts are images.
- MISSING from it: follows per 10K views trend (7.6 → 5.3 → 1.1-1.5), per-post reach erosion since June, link clicks (2), outbound replies (~0).

## 8. Conversion desk and replies (measured)
- `GET /me/replies`: 47 replies since 08-23 (~1.3/day); 44 are self-continuations under our own posts, 3 outbound (08-25, 08-31, 09-23); 0 replies on 09-29 (day of 102K and 68.6K posts); 0 contain follow/CTA/quiz/telegram words. Received 10,019 replies in 61 days → we answered <0.5%. Coverage caveat: endpoint completeness not independently verified.
- Link clicks: 2 total (both App Store) across 30.5M views 07-31→09-30; 0 from 09-15→09-30. Threads is not a Ball IQ funnel at all (bio has 5 links).
- topic_tag used on 1 of 1,837 posts; link_attachment_url on 0. Untested levers named in reference_platform_settings_levers_2026_09_22.

## 9. Pair test (social/state/threads_pair_test.md) status
- Not started: log rows empty; scheduled for Wed 09-30 08:30/09:45, 11:00/12:15, Thu 10-01 08:30/09:45. posts_log shows only one Threads post queued for 09-30 (Daily Number #2, 13:30 Oslo); Metricool blocked since 2026-09-29 21:27Z (scheduler_status.json), Postiz quota contended.
- Power: SD of log10 views 0.75; assumed within-pair difference SD ~0.82 (inferred) → n=3 pairs has SE 0.47 log10 (3x); detecting a 2x effect needs ~58 pairs. Success rule (designed wins 2 of 3 AND beats 2x median): P(>=2 of 3) = 0.5 by luck; P(a post >= 2.4K) = 30% → roughly 15% false-positive even with zero true difference. Same caption twice within 75 min may dampen the second post (unmeasured). +24h read itself is fine (maturity above).
- The comparison "hero vs designed" is also mis-specified: the archive shows the top formats are photo + caption joke or tweet-on-photo; designed cards exist only from 09-29 (n=4).

## 10. Contradictory plans / instrument problems (measured)
- PLATFORM_PLANS.md line 33 (hourly tweet-screenshot singles, ~14/day 10:00-23:00, 09-29→10-01) vs A_GRADE_PLAN (>=7 images, <=2/hr, 08-22) vs pair test. Actual 09-29: 10 posts, not 14. No doc cancels the hourly test.
- enforce.mjs flags posts outside 08-22 even when they were the best of the day (09-28 22:44 = 11.5K) and counts >2/hour where the evidence starts at >=4.
- Dashboard "median 3,474" on 09-29 is n≈10 posts in a moving 24h window; it moved 1,259 → 5,132 → 3,474 within a day (SE of a 10-post median here ≈ 2x). Not a KPI.
- deleted.md 09-29: X copy of Daily Number #1 deleted by Alex as stale news; note says Threads copy "flop at +1h (1,483 views / 3 likes)". Today: 68,637 views / 96 likes / 34 replies. The stale-news test (from n=1 X deletion) is contradicted by n=1 on Threads. +1h reads are meaningless (p90 late-take-off 693x).
- Critic calibration (review/backtest_2026-09-29/RESULT.md): gate >=8 passed 3 of 12 known hits, blocked the 3.29M and 1.43M Threads posts; ranking by P(50K+) AUC 0.88 (n=24, extremes only).

## 11. What is NOT the problem
- Threads reliability: all 20 posts on 09-28/29 published; post-level sums reconcile with account totals to 99.6%.
- "Suppression": 0-like posts are 2.0% of posts (mostly text/video); 11.1M views 09-15→09-29; three posts >1M in 09-14→09-27.
- Caption length, 😭 emoji, 'fans' wording: no lift; club identity: weak; hour 11-21 Oslo: indistinguishable.
- Survivorship bias from deleted flops: 1 of 144.
