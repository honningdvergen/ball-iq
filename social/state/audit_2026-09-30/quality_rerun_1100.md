# QUALITY + CRITIC CALIBRATION — RE-RUN 2026-09-30 10:55–11:15 Oslo (read-only)

Why a second file: `quality.md` (01:59 Oslo, same dimension) already exists and the brief forbids overwriting. This file (a) re-measures everything on MATURED numbers (the 01:40 pull was 9 h younger; Threads posts from 09-29 were 4–37 h old), (b) verifies the 01:59 claims against primary files and corrects the ones that moved, (c) adds new measurements. Where nothing changed I say "confirmed" and point to quality.md rather than repeat it.
Nothing was posted, queued, scheduled, deleted or edited. Only GETs (Threads + Instagram Graph via Keychain tokens, never printed), Metricool READ analytics (FBRE02/05/08/10, TKPO02/05/07/08), file reads, session-transcript greps. No pz/postiz/tg/enforce/verify-cancel/review-verdict, no browser automation.
Times Oslo (UTC+2) unless "Z". Data as of 2026-09-30 ~10:58 Oslo.
Data written next to this file: `quality_data/ig_threads_pull_2026-09-30_1058_matured.json` (162 IG media, 283 Threads posts, 09-13→09-30), `gate_era_rows_joined_verdicts_1058.json`, `assets_14d_best_platform_1058.json`, `quality_data/rerun_1058_scripts/`.

## 0. Bottom line (6 lines)
1. **The single biggest correction to quality.md: Threads maturation.** Daily Number #1 (critic PASS 8, P(50K+) 30%, deleted on X by Alex ~14:30 on 09-29 and logged as a "flop" at +1 h with 1,483 views) is now **170,167 Threads views** (66,661 at 01:40; 7,448 at 21:12 on 09-29). The "Proper punishment for Man City" list is 132,398 (101,042 at 01:40). Ronaldo/Messi 79,781 (32,217). Every read the floor manager, PM and deleted.md used (+1 h to +7 h) captured 1–10% of the eventual number. The STALE-NEWS rule that now caps timing at 3/10 and FAILs "🚨 premise older than 24 h" was written from a mis-read.
2. **The critic score cannot be validated overall, but on matured data it is not noise on Threads.** Pooled published items with a verdict (n=24): Spearman rho = -0.04 (first verdict) / 0.00 (final). Threads only (n=10): rho = +0.78 / +0.66 (one-sided permutation p = 0.026; +0.61 without DN#1). IG (n=14): +0.24 (ns). FB (n=12): the 7s beat the 8s (median 2.9x vs 0.8x). TikTok: all 8, all 0.32-0.55x. 183 of 183 scored posts_log rows are 7 or 8: outside Threads there is no dynamic range to correlate. quality.md's "-0.03 / +0.16, cannot validate" was right for the pooled figure and too pessimistic for Threads.
3. **The content that is measurably bad is still the scheduler reel lane** (IG/FB/TikTok reels over royalty-free music, PASS 8): 28 reel posts in the gate era produced 15.9K views in total (2.9% of measured views) against 89% from Threads.
4. **Quality-first was said; coverage/volume was built and graded.** Confirmed from primary files (coverage.mjs MAX_GAP_H, A_GRADE_PLAN commitments 3/5/6, Alex's opposing messages inside the same 24 h). 135 (platform, draft) units were logged in 44 h; Threads got 13 of them and produced ~89% of views.
5. **25% of gate-era Threads/IG posts (8 of 32) have no verdict and no posts_log row, including 3 of the 4 biggest Threads posts.** The "0 unreviewed" commitment is true only for the logged pipeline.
6. **The critic optimises P(50K+) views; the stated goal is follows.** IG feed follows/10K: 2.93 (09-13→19) → 0.99 → 0.90 → 0.94 (gate era, 8 follows on 85K views); IG followers 32,562 flat since 09-29. Nothing in the rubric scores "why would a stranger FOLLOW".

## 1. Corrections to quality.md (what moved, with numbers)
| quality.md said | matured data says | source |
|---|---|---|
| DN#1 Threads 66,661 views ("top-3 gate-era post") | 170,167 (#1 gate-era post, 161x the 14-day median). Trajectory: +1 h 1,483 (deleted.md) / +7.5 h 7,448 (transcript 19:12Z) / +12 h 66,661 / +18 h 122,040 / +21 h 170,167 | fresh Threads API; transcript 71fad5c5 / ff47e14e |
| Punishment list 101K at 01:40 | 132,398; curve +5.5 h 16,923 / +6.8 h 29,931 / +7.8 h 44,664 / +9 h 62,459 / +13 h 101,042 / +19 h 122,461 / +22 h 132,398 | insights transcripts + fresh pull |
| Threads pooled rho -0.03/+0.16, "no relation" | pooled -0.04/0.00 unchanged; Threads-only +0.78/+0.66 (n=10, p~0.03) | q2/load.py join |
| FB overnight reels 4/7/8/12/47/146 views ("FB is a lottery, 1 of 6 above median") | still growing 9 h later: 22/28/38/42/66/619 (Just one more summer 146→619 = 4.2x; Same script New wig 994). 7 of 8 gate-era FB reels posted 09-29 were read at +22 h or earlier, so the "flop" reads were premature. FB reels posted 07:30 and 09:03 did 619 and 994; those at 01:30–06:00 did 22–66. n=2 vs 5, directional only | Metricool FBRE10 09-28→09-30 |
| "Gate-era IG feed: 1 follow total" | 2 follows on 7 posts (85K views at 09-28/29 incl. 2 pre-gate) = 0.94 per 10K; still 3x below 09-13→19 (2.93) | IG Graph |
| "Winners hit a big fanbase (target) on the mega-story" | NOT supported by a text proxy: Threads posts mentioning a big club/star in text 13.2% >=10K (n=159) vs 14.6% without (n=123); IMAGE&big 18.4% vs IMAGE&not-big 16.2%. The image carries the target, so the proxy is weak; keep "target" as inference, not measured | fresh pull, regex proxy |
| "7 of 9 same-asset FAIL-7s flipped to PASS 6 minutes later" | By asset id: at 22:36Z 12 snapchat assets FAILed (scores 5,6,7); at 22:42Z 10 of them PASSed at 7 (6 with the same score 7→7, 4 with 5/6→7 after a re-render). 15 of 66 FAILs (23%) are FAIL@7 | verdicts.jsonl by id suffix |
| critic file "rewritten >=7 times" | file has 8 dated "binding" sections in ~36 h (VETO 09-28 23:07, FIRST QUESTION 23:24, ALEX LIKES late 09-28, RISK APPETITE 09-29 01:45, HOW TO DECIDE rewrite, STALE-NEWS ~13:50, BOLDNESS 14:00, INJURIES 14:40) + original write 09-28 10:30; +57/-7 lines uncommitted. The "N times" count from tool calls is not verifiable (regex matched reads), the dated sections are | banger-critic.md grep + git diff --stat |
Confirmed unchanged: 130 verdicts (64 PASS = 38x8, 25x7, 1x9; 66 FAIL), 189 posts_log rows now (136x8, 47x7, 6 null), metrics filled on 13 rows, taste.jsonl 8 rows all "yes" and unmodified since 09-29 00:41, deleted.md 7 rows, backtest numbers, MAX_GAP_H, A_GRADE_PLAN commitment text, Alex quotes (timestamps in alex_msgs.txt are Z; add 2 h).

## 2. Critic vs outcomes, matured (gate era = published on/after 09-28 10:31Z)
32 published Threads/IG items; 24 carry a verdict; 8 do not (section 3).
| subset | n | rho(final score, views / platform 14-day median) |
|---|---|---|
| pooled (Threads+IG) first verdict | 24 | -0.04 |
| pooled final verdict | 24 | 0.00 |
| Threads first / final | 10 | +0.78 / +0.66 (perm p one-sided 0.026, 20k shuffles); without DN#1 +0.61 (n=9) |
| IG (feed+reel) final | 14 | +0.24 (feed only n=6: +0.29) |
Threads final-8s (5): 1.3x, 2.1x, 11.1x, 16.8x, 161x (median 11.1x). Threads final-7s (5): 0.91x, 0.94x, 1.13x, 1.57x, 4.97x (median 1.13x). IG 8s (11): median 0.61x (0.32–1.27); IG 7s (3): 0.11x, 0.34x, 1.10x. Platform 14-day (09-16→29) medians: Threads 1,054; IG feed 6,861; IG reel 1,804; FB reel 68.5 (09-16→27); TikTok 848 (09-16→27).
Why not to over-read the Threads rho: all five 8s are the "absurd-maths / stat card + 🚨" template on 09-28 match night or the 09-29 City-verdict day; the 7s are afternoon/night 09-29 posts on smaller stories. Story-day and template are confounded with score. And the critic prompt was tuned on the hit list of the same template (backtest hits; the 684 card is quoted in the definition), so a positive Threads rho is partly by construction. Sweden (8) was Alex's "not funny" and did 1.3x; DN#1 (8) was Alex's "odd, stale" and did 161x on Threads: Alex's gut and the critic disagreed twice and each was right once.
FB reels with a critic score (n=12): 7s [0.82, 3.26, 3.08, 2.79]x vs 8s [14.5, 9.0, 3.9, 0.96, 0.61, 0.55, 0.41, 0.32]x of the FB median; median 2.9x vs 0.8x. The 8s are the overnight batch. FB reels are not gated on score since 09-29 (critic file).
TikTok (6 scored, all 8): 393, 285, 293, 312, 273, 466 views = 0.32–0.55x of 848. No range.
Shadow forecasts (bracket + P(50K+)) on published items with a Threads outcome, matured (n=7): DN#1 5–50K/30% → 170K (bracket too low, P highest and the only 50K+); Chelsea 5–50K/15% → 2,237; Ferran Torres 5–50K/12% → 5,235 (exact); Yamal 5–50K/12% → 1,657 (IG 721); Forest 1–5K/10% → 987; Big Six 1–5K/10% → 954; Croatia 1–5K/10% → 1,192 (exact). Exact bracket 2/7; a constant "1–5K" guess gets 3/7 (Chelsea 2,237, Croatia 1,192, Yamal 1,657). rho(P(50K+), multiple) = +0.90 (n=7, ties, one item drives it). Aggregate calibration: mean P 14% vs 1/7 realised. No claim beyond n=7.
Backtest (existing RESULT.md, not re-run; confirmed by reading): old rubric passed 3/12 hits, blocked 9/12 incl. the 3.29M post, AUC 0.69; rubric B AUC 0.88 but 0/12 forecasts of 50K+, exact bracket 6/24, tuned on extremes, hits clustered 09-21→25.

## 3. Gate coverage and the ungated hits
Gate-era Threads posts with NO verdict and NO posts_log row (7 of 22): Punishment list 132,398 (09-29 12:44); Ronaldo/Messi 79,781 (12:53; IG copy 20,363; Alex's own photo); Croatia/Modrić 69,703 (09-28 14:37, described in quality.md as a 09-27 Postiz queue item; not re-verified); BREAKING City "informed that they had…" 4,803 (09-29 21:00); Chelsea sold Salah/KDB 3,468 (09-28 13:07, origin not verified); Vozinha 1,230 (09-28 12:33); "Oh dear Manchester City are so heavily in the mud" 809 (09-30 02:13, outside the enforcer's Threads window). Together 292,192 of 505,355 gate-era Threads views (57.8%).
Origin of the punishment list is still unknown: no Postiz create in postiz_calls.log at 12:44 (calls at 11:49/12:30/12:48 are deletes and uploads for other assets), no log/verdict row, first mention in any transcript is the 18:18 insights read. Candidates: Alex's phone (no-space "🚨Proper" typography differs from Editor-built posts), a cross-post. Unresolved.
Consequence: commitment #1 ("0 unreviewed items in any queue") was graded K (kept) by the say-do audit; it holds for the queue the Editor builds, not for what is on the account.

## 4. Formats: over/under-performing their critic score (gate era, matured)
| format (critic score) | n | outcome vs platform median | note |
|---|---|---|---|
| Threads absurd-maths / stat card + 🚨 (8) | 3 (Italy, Belgium, DN#1) | 16.8x, 11.1x, 161x | over |
| Threads stat card (8, 7) | Sweden 8, Torres 7, Forest 7 | 1.3x, 5.0x, 0.94x | mixed; Alex's "no" (Sweden) matched |
| Threads list/ranking card (8,7) | Chelsea 8, Big Six 7 | 2.1x, 0.91x | roughly as scored |
| Threads match-night reaction line on photo (7) | Croatia, Yamal | 1.13x, 1.57x | as forecast (1–5K); WHO-CARES test would have failed them |
| Ungated Alex/queue images | Punishment, Ronaldo/Messi, Modrić | 126x, 76x, 66x | no score; the highest yield per unit of effort |
| IG overnight plate reels (8) | 6 | 0.32–0.77x | under |
| IG carousels (8/7; one FAIL 5 overridden by Alex) | Olise 8, City-verdict 8, Scotland 7, Utd 7, Yamal 7, Gyökeres/Zidane FAIL5→posted | 0.52x, 0.44x, 0.34x, 1.10x, 0.11x, 1.04x | 8s no better than 7s |
| IG hero photo (Alex, ungated) | Ronaldo/Messi | 2.97x; 516 shares, 1 follow | over, no follow yield |
| FB reels (8 overnight / 7 evening) | 12 | 0.3–14.5x of a 68-view median | absolute median of the 12 ≈ 130 views |
| TikTok reels (8) | 6 | 0.32–0.55x | under |
Lane totals, measured views 09-28 10:31Z→09-29 end: Threads 505,355 (89.3%), IG feed 44,598 (7.9%), IG reels 10,057 (1.8%), FB reels 3,245 (0.6%), TikTok 2,627 (0.5%). Logged units (unique platform+draft, posts_log since the gate): IG 21, Telegram 19, FB 18, Snapchat 15, TikTok 13, Threads 13, YouTube 12, Bluesky 11, X 11, WhatsApp 2 = 135. YouTube, X, Snapchat, Telegram, Bluesky views not measurable here.

## 5. Threads and IG level trends (matured)
Threads (all posts, views at read time): 09-13→19 n=124 median 1,043, >=10K 12.9%, <300 12.1%; 09-20→24 n=73, 692, 8.2%, 23.3%; 09-25→27 n=66, 1,378, 15.2%, 6.1%; 09-28→29 n=19, 3,468, 36.8%, 0%. The floor rose from 09-25, three days BEFORE the gate, so the gate cannot be credited with it. Threads posts/day: 17.7, 14.6, 22.0, 9.5.
Types 09-13→29 (n=282): IMAGE 202 (median 1,286; >=10K 17.3%), CAROUSEL 21 (1,383; 9.5%), TEXT 22 (1,378; 4.5%), VIDEO 37 (478; 2.7%; 32% <300). Markers: 🚨 in text n=35 median 2,905, >=10K 37.1% vs 1,054 and 10.5% without; "?" in text n=29, 24.1% >=10K; 😭 n=49 median 809. Bottom-30 Threads posts (pre-09-29): 18 image, 10 video, 1 text, 1 carousel; top-30: 27 image, 2 carousel, 1 video. Images alone do not save a post.
Zero-like Threads posts since 09-13: 10 (0 in 09-13→19, 4, 6, 0); 9 of 10 are text or video. Alex's 09-29 "several posts on 0 likes with 40K followers" was a real pattern in the text/video lane; the image lane fixed it.
IG feed hit rate: >=50K 5 → 2 → 0 → 0 per period; >=20K 6, 6, 4, 2; median 7,156 → 7,411 → 5,633 → 7,108 (median stable, viral ceiling gone). IG reels /day 2.1 → 3.0 → 1.7 → 4.0, median 2,591 → 1,237 → 2,243 → 1,190. IG followers: 32,570 (09-28), 32,562 (09-29), 32,562 (09-30).

## 6. Best and worst 14 days (09-16→09-29; best platform per asset; matured 10:58)
### Ten best (raw views)
| # | date | platform | post | views | x median |
|---|---|---|---|---|---|
| 1 | 09-21 | Threads | 🚨 "Mathematically, if Tottenham win all 33…" card | 3,287,468 | 3,119x |
| 2 | 09-24 | Threads | "Sky Sports have done Saka dirty here 😭😭" lower-thirds | 2,700,535 | 2,562x |
| 3 | 09-25 | X (manual, unverified today) | 684-points card Everton v City | ~1,360,000 | ~1,400x |
| 4 | 09-21 | Threads | Bellingham → Romero quote card | 1,213,866 | 1,152x |
| 5 | 09-25 | Threads | "three most terrifying hairstyles" hairline crops | 840,384 | 797x |
| 6 | 09-27 | Threads | Dortmund sold Dembélé/Jude… receipt | 509,266 | 483x |
| 7 | 09-25 | Threads | "I'm crying 😭😭😭" pointing grid | 372,726 | 354x |
| 8 | 09-25 | Threads | Yamal "best teenage winger ever?" v Ronaldo Nazario | 295,025 | 280x |
| 9 | 09-29 | Threads | 🚨 THE DAILY NUMBER #1 (critic PASS 8) | 170,167 | 161x |
| 10 | 09-28 | Threads | Cissé/QPR celebrating with City (Postiz queue, no verdict) | 144,735 | 137x |
Next: Punishment list 132,398 (126x; ungated); IG carousel 09-18 Gavi tweet stack 118,758 views / 69 follows; IG 09-14 Man United "aggrieved" 363,774 views / 152 follows; FB reel 09-18 Tottenham v Villa 78,651. Only #9 post-dates the gate and passed it. 8 of the top 10 pre-date the gate; #10 (pre-gate 07:52Z) and the ungated list confirm the hits are not gate products.
### Ten worst (effort spent; on the asset's best platform; posted <=09-28)
Threads 82 "The best attacking duo…" (bare photo); 128 🚨 "CRAZY STAT" Martínez; 131 text-only 🚨 Spurs maths clone; 134 🚨 Tottenham fan hair; 154 video "South Korean…"; 160 "He rejected Real Madrid 3 times" list; 164 video Onana; 172 Harvey Elliott 🚨; 172 Man United out-of-possession stats; 176 video Antony GTA. Worst raw on any platform: IG reels 3/13/15 views (09-21 brighton/Brobbey/chelsea-fans), FB reels 22/28/38/42 overnight 09-29 (PASS 8), 26–35 for 09-19→23 clones.
### What separates them (measured vs inferred)
Measured: format (image 17% >=10K, text 4.5%, video 2.7%), the 🚨 marker (37% vs 10.5%, confounded by mega-story days), a question mark (24%), clones (Spurs card as text: 131; FB "Chelsea free three points" 44,528 → Real Madrid clone 29), video on Threads (median 478).
Inferred (not confirmed by a text proxy; needs the image read): the hook is IN the frame or in a contested claim about a fanbase millions argue over; the losers are neutral photo + neutral caption, stat tables, bare quotes, video clips.

## 7. Cost of FAILs, pulls, deletes
- 66 FAILs of 130 verdicts (50.8%); by platform FAIL/total: Snapchat 28/54, X 12/25, IG 7/17, FB 5/10, Threads 4/6, TikTok 3/5, Bluesky 3/3, Telegram 2/6, WhatsApp 1/2, YouTube 1/2. FAIL scores: 6x18, 5x18, 7x15, 4x9, 3x5, 2x1.
- FAIL reasons (keyword tally, overlapping): stale/late/old 34, generic/no hinge 24, technical 19, fact/quote risk 14, repeat/duplicate 12, text-only 8, no target 6. Half are latency, not taste.
- 2 FAILs were published via Alex override (Gyökeres/Zidane FAIL 5 → IG 7,108 views 1.04x; Goldbridge Snapchat FAIL 6, no outcome data).
- deleted.md: 7 rows: 5 pulled before publish (09-28 15:45–16:00, pre-gate queue), 2 deleted after publish (both X: DN#1 by Alex ~14:30 on 09-29; Yamal own-tweet card 00:10 on 09-30).
- Postiz: 22 posts:delete + 56 posts:create + 87 uploads logged 09-28/29 (decoded from postiz_calls.log epochs, +2 h); quota is 25 calls/h.
- Time: the critic step is minutes: draft id → verdict median 1.9 min (p90 4.1, max 10, n=130). The cost is rebuild/latency: City verdict ~21:30 → Threads "BREAKING" 21:00 (ungated, 4.8K) and IG carousel 00:27 (PASS 23:26, 2,992 views, 0.44x, 0 follows; FB reel 56).
- One asset ("Inevitable 😭", eb72c) went FAIL 7 (22:36Z) → PASS 7 (22:42Z) → re-queued 09-30 19:30Z on IG/TikTok/YouTube tagged "FIX of 06 after FAIL 7" while the enforcer flags 😭 on 5 of the last 12 captions.

## 8. What was optimised
Sources verified against primary files (timestamps Oslo = Z+2):
- Alex 09-28 12:19 "we're posting because we need to meet a quota"; 16:21 "Quality before quantity, but high quality quantity would also be nice"; 23:19 "i can not see any post on facebook for 7 hours"; 09-29 00:11 "post tens of quality snapchats… queue loads of quality content"; 14:35 "keep our quality 10 out of 10… eight Instagram posts"; 21:40 "same mistake as yesterday of being completely quiet on facebook… we have to post now right?"; 21:56 "we need more on threads"; 22:20 "post on x… we have several schedulers, i do not care about the risk".
- critic file: "You are NOT the author's friend. Most drafts should FAIL" (09-28) → "no target pass rate" (backtest rewrite) and header still says "chasing 1,000,000 followers" (dropped as a target 09-29).
- coverage.mjs line 26: MAX_GAP_H = x 3, threads 2, telegram 2, instagram 5, facebook 4, bluesky 4, snapchat 6, whatsapp 6, youtube 12, tiktok 12 (hours) — a presence floor on 10 platforms.
- A_GRADE_PLAN §2: commitment 3 "Threads >=7 image-led originals", 5 "Facebook >=3 posts", 6 "X count vs 4–6"; the same file says quality-first and "counts are soft".
- posts_log: 135 (platform, draft) units in 44 h; 54 of 130 verdicts on Snapchat (no follower readout, screenshots owed 10-01).
Conclusion: quality-first is the stated rule and the 51% FAIL rate proves the gate rejects things; but every automated control (coverage, enforce, floor manager, hourly Threads test) grades presence, every complaint of the moment added a binding rule to the critic (8 in 36 h) instead of reconciling old ones, and the one lane with measurable payoff (Threads images) got 10% of logged units.

## 9. NOT the problem
- Threads image content (floor 2–3x up since 09-25; 0 posts <300 views and 0 zero-like posts in the gate era; caveats: n=19, story-day).
- Critic latency (median 2 min).
- The 51% FAIL rate as a fact (FAILs cite specific defects; 0 evidence of false blocks on hard-fail categories, but also 0 counterfactual).
- 😭 as a cause (within-era effect −22% on IG reels, n=19 vs 9; not attributable).
- DN#1's Threads reach and like rate (170K views, normal 0.1–0.2% like rate for mega posts).
- IG feed median (7,108 in the gate era vs 6,861 baseline): what disappeared is the viral tail and the follows.

## 10. Data gaps
X per-post (no API; every X number is a manual screenshot; DN#1's X result never read); YouTube per-video (Metricool YTVP06 null); Bluesky/Snapchat/Telegram/WhatsApp outcomes; Threads and X follows per post; FB reel maturity curve beyond +30 h; TikTok views flat between pulls (8 rows unchanged); counterfactual outcomes for the 66 FAILs; origin of the punishment list; Alex's "no" signals (not written to taste.jsonl); posts_log has no ids for Threads/IG (joins are by text); confounds: international break, City verdict cycle 09-25→09-29, backtest hits clustered 09-21→25, 09-29 evening posts still maturing (Threads 09-29 20:00+ items are <15 h old).

## 11. Commands (reproducible)
- `node quality_data/rerun_1058_scripts/pull.mjs 2026-09-13T00:00:00Z` — GET-only; IG fields views,reach,saved,shares,likes,comments,total_interactions,follows,profile_visits (reels: ig_reels_avg_watch_time); Threads views,likes,replies,reposts,quotes,shares.
- Metricool `getAnalyticsDataByMetrics` brand 7074932, 2026-09-28→2026-09-30T11:00: FBRE02,FBRE05,FBRE10,FBRE08; TKPO02,TKPO05,TKPO07,TKPO08.
- Joins: normalised 30-char caption prefix (hashtags, music credit, "follow us" tail stripped) to verdicts.jsonl and posts_log.jsonl; Spearman with average ranks; permutation test 20k shuffles (seed 1); multiples vs 14-day medians of the same pull.
- Read: quality.md, backtest RESULT.md, banger-critic.md (+git diff --stat), A_GRADE_PLAN.md, coverage.mjs, saydo.md, verdicts/taste/posts_log/deleted, dashboard, postiz_calls.log, session transcripts (Alex messages, insights reads at 16:18Z, 17:33Z, 18:29Z, 19:12Z, 19:42Z, 23:40Z, 05:57Z).
