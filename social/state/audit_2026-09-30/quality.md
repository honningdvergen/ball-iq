# QUALITY + CRITIC CALIBRATION AUDIT — 2026-09-30 01:50–02:20 Oslo (read-only)

Auditor: "Content quality and critic calibration". Nothing was posted, queued, scheduled, deleted or edited. No Postiz/pz/tg/enforce/verify-cancel/review-verdict/Metricool-write calls. No browser automation. Only GETs (Threads + Instagram Graph via the Keychain tokens, never printed), Metricool READ analytics, file reads.
Times: Oslo unless marked Z (UTC = Oslo − 2h). Graph API "views" are as of 2026-09-30 01:40 Oslo; posts from 09-29 evening are immature (≤4h old), posts before 09-29 12:00Z are ≥30h old.

Data files written next to this note (`quality_data/`):
- `ig_threads_pull_17d_2026-09-30.json` — every Instagram media (162) and Threads post (282, reposts excluded) 09-13→09-29 with views/likes/replies/reposts/shares/reach/saved/follows (own read-only script, GET only, same fields as social/insights.mjs; I did NOT run insights.mjs because it refreshes the Threads token and writes into state/insights).
- `fb_reels_metricool_2026-09-13_to_29.json` / `tiktok_metricool_2026-09-13_to_29.json` — Metricool `getAnalyticsDataByMetrics` FBRE10 (video views) / TKPO07 (views) rows, hand-condensed (descriptions shortened, emojis dropped). 85 FB reels, 56 TikToks. YouTube per-video views came back null from Metricool (YTVP06), so YouTube is NOT covered here.
- `posts_log_rows_matched_to_outcomes.json` — posts_log rows joined to the API rows by normalised caption prefix (join is by text: posts_log has no post ids for Threads/IG). 98 IG/Threads/FB/TikTok rows, 39 unique posts matched, 38 rows unmatched (scheduled-not-yet-published or FB/YouTube rows that the API list did not match).

## 0. Bottom line in eight lines
1. **On live data the critic score cannot be validated, and what little can be measured says it does not predict outcomes.** 100% of published posts carry PASS 7 or 8 (181 of 181 scored log rows: 136×8, 45×7). Spearman(score, views ÷ platform median) on the 24 published Threads/IG items with a verdict = **−0.03** (first verdict) / **+0.16** (final verdict). FAILs are never published, so there is no counterfactual.
2. **The gate is not on the causal path of the hits.** Of the four Threads posts ≥30K views published after the gate started (09-28 10:31Z), one had a critic PASS (Daily Number #1, 66.7K); the other three were a 09-27 Postiz queue item (Modrić/Croatia 69.6K), an un-logged post (City "proper punishment" list 101K, no row in posts_log or verdicts), and Alex's own hero post (Ronaldo/Messi 32K). 9 of our 10 best posts of the last 14 days pre-date the gate; the 10th (the 101K list) post-dates it and has no verdict.
3. **The content that is measurably bad is the scheduler video lane** (plate + royalty-free music + "[fanbase] when… 😭" reels to IG/FB/TikTok/YT). Volume moved into it while per-post reach fell 2–5×, and the critic PASSed all of it at 8.
4. **Threads image content is not bad; it is the one lane where the floor rose** (median 696 → 1,376 → 2,523; zero posts under 300 views since 09-28 vs 12–23% before).
5. **"Quality first" was said, "coverage" was built.** The critic file was rewritten ≥7 times in 36h, the pass line moved 8→7 and 7 of 9 same-asset FAIL-7s flipped to PASS 6 minutes later; `coverage.mjs` hard-codes a max-gap floor per platform; A_GRADE_PLAN §2 grades counts. What was actually optimised: platform coverage + gate throughput, not per-post outcome.
6. **The learning loop is open.** 13 of 187 posts_log rows have any metric; taste.jsonl has 8 rows, all "yes", 0 "no"; the "flop" call on Daily Number #1 was made at +1h (1,483 views, 3 likes) and the post is now at 66,661 views.
7. What separates winners from losers is **target + hook**, not polish: big-fanbase contested claim or absurd image on the day's mega-story vs neutral photo/plate on a low-stakes fixture. The critic's own WHO-CARES test would have failed the four match-night "hero-own-line" posts that it PASSed at 7 (all landed 480–1,471 views).
8. Small samples everywhere (n=7 to 24). Treat every number below as directional; the direction of #3, #5, #6 is not in doubt, #1 is "unmeasurable", #7 is inference from ~20 eyeballed images.

## 1. What data exists and what it can prove
| source | what it has | limit |
|---|---|---|
| posts_log.jsonl | 187 rows 09-28 14:46Z → 09-29 23:36Z, 46 distinct draft ids, 6 rows without draft, 52 duplicate (draft,platform) rows (re-logs after reschedules). critic = 7 or 8 or null(6). alex="yes" on 13 rows. metrics on 13 rows only (all filled 09-29 09:36Z: views, some likes). | range-restricted (only PASSes are ever posted), no post ids for Threads/IG, Chrome X rows carry the profile URL |
| review/verdicts.jsonl | 130 verdicts, 129 draft ids, 09-28 10:32Z → 09-29 21:27Z. 64 PASS (38×8, 25×7, 1×9), 66 FAIL (2..7). | only 30 of them match a published IG/Threads post by text |
| review/taste.jsonl | 8 rows, all alex="yes", 0 "no" | one-sided; Alex's known "no"s (Sweden stat, Daily #1 stale, Yamal own-tweet-card) are not in it |
| backtest_2026-09-29/RESULT.md | blind test, 12 hits + 12 flops (extremes of our own lists) | n=24, no middle, blind imperfect, hits = 8 of 12 posted 09-21→25 |
| shadow forecasts (bracket + P(50K+)) | 29 verdict rows since the 09-29 rewrite carry a bracket/P(50K+); 7 posted items have outcomes | n=7 |
| Graph/Threads/Metricool | matured per-post views for IG, Threads, FB reels, TikTok (not X, YouTube, Bluesky, Snapchat, Telegram) | X is manual only |

## 2. The critic: what the record shows

### 2.1 The score has no dynamic range and the line is policy
- PASS scores in verdicts.jsonl: 8×38, 7×25, 9×1. Every published post is a 7 or 8. Correlation is therefore "7 vs 8", a coin-flip category, not a 0–10 scale.
- The 8→7 line move: at **09-28 22:36Z** nine drafts were recorded FAIL at score 7 (Snapchat batch: Arsenal/Spurs Risitas, Spurs choke, Homer hedge, career mode, club group chat, star called up, 110%, iceberg, Thanos). At **22:42Z** the same assets (suffixes 317d3, 793fd, 69ce0, e0823, 39164, eb72c, plus 3be27 at 8) were recorded PASS 7/8 with the note "[scored 7 by banger-critic 03:00 run; recorded by Editor after the gate threshold moved 8→7]". 6 minutes, same score, opposite verdict. 15 of the 66 FAILs (23%) are FAIL-at-7 = threshold artefacts.
- Score inflation to clear the tool gate: verdicts.jsonl contains "MARGINAL PASS (honest 6, recorded 7 because the tool gate needs 7 …)" (FB Man United reel), Forest "2-0" ("honest score 6, gate floor 7"), Big Six ranking card ("honest 6-7"). Outcomes: Forest 957 views (0.9× Threads median), Big Six 933 (0.9×), Man United IG carousel 7,172 (1.05× IG feed median).
- Critic prompt churn (git diff on .claude/agents/banger-critic.md vs HEAD +57/−7 lines, uncommitted; sections added in this order by their own dates): ≥8 gate + "most drafts should FAIL" (09-28) → VETO TEST 09-28 23:07 → FIRST QUESTION 23:24 → ALEX LIKES anchors → RISK APPETITE 09-29 01:45 → backtest rewrite (PASS = ACTION + P(50K+)≥10, threshold 7, "no target pass rate") → STALE-NEWS TEST (after Alex 13:49) → BOLDNESS ON X 14:00 → INJURIES 14:40. The current file has rules that contradict each other in practice: RISK APPETITE "reward posts that make a fanbase angry" vs STALE-NEWS "🚨 only same-day"; WHO-CARES test ("mid-nation result → ≤6") vs PASS 7 on Croatia/Scotland reaction lines; "PASS valid 36h keyed on exact words" (RULES_REVIEW) means a verdict issued under old rules survives new ones: **Daily Number #2** ("🚨 THE DAILY NUMBER #2 / Tottenham spent £300m+ … That's over £150m per point") was PASSed 7 at 09-28 22:56Z (before the 🚨-is-news complaint and before "Spurs-points ≤1 per 24h", series rule 4 "max 1 Spurs post per 3 days") and is queued on X/Threads/Bluesky/IG for 09-30 13:30.

### 2.2 Backtest (existing, not re-run) — what to keep
- Old rubric A (≥8, no criterion <6): passed **3/12 hits**, 2/12 flops; Spearman vs views +0.27 (X+Threads only +0.48), AUC 0.69 (X+Threads 0.81). Blocked 9 of 12 hits incl. the 3.29M Threads post; two of its three hit-passes were the 684 card that its own text quotes (not blind).
- Rubric B ("first question" = action + bracket + P(50K+)): Spearman +0.77/+0.80, **AUC 0.88** (X+Threads 0.93), never forecast 50K+ (0/12), exact bracket 6/24. "Within one bracket 87.5%" is not evidence of skill because a constant "5–50K" guess scores 62.5% on that bimodal set (RESULT.md verdict 4). Agree.
- Not tested by the backtest: whether either rubric separates the MIDDLE (the real daily stream: 1K–5K), and FB (binary outcomes, "neither rubric separated the reels").

### 2.3 Shadow forecasts since the rewrite vs outcomes (n=7, all published)
Views = Threads unless stated; X copies unread (no API).
| asset | forecast (verdict) | actual | result |
|---|---|---|---|
| Daily Number #1 | 5–50K, P(50K+) 30% | 66,661 (T) | under by one bracket; only 50K+ in the set; highest forecast = only hit (n=1) |
| Chelsea sold KDB/Salah/Lukaku, then Mudryk | 5–50K, 15% | 2,205 | over |
| Ferran Torres World Cups | 5–50K, 12% | 4,119 | over |
| Forest more European Cups (honest 6) | 1–5K, 10% | 957 | over |
| Big Six wedding ranking (honest 6-7) | 1–5K, 10% | 933 | over |
| Croatia's equaliser lasted three minutes | 1–5K, 10% | 1,142 | exact |
| Yamal two goals / Ballon d'Or race | 5–50K, 12% | 1,290 (T), 480 (IG), 518 at +46min (X, manual) | over by 1–2 |
Exact bracket **1/7**; a constant "1–5K" guess would score **4/7**. Mean forecast P(50K+) 14% vs realised 1/7 = 14% (calibrated in aggregate, no discrimination beyond n=1). Base rate of ≥50K on Threads 09-13→29 = 18/282 = 6.4%.

### 2.4 Spearman on published items (my join)
24 published Threads/IG posts after the gate with a verdict (Threads 10, IG 14), outcome = views ÷ platform 14-day median (Threads 1,054; IG feed 6,858; IG reel 1,795):
- pooled first-verdict score vs multiple: ρ = −0.03; final verdict: ρ = +0.16.
- Threads only (n=10): the five final-8s (Italy 15.7×, Belgium 10.9×, Daily #1 63×, Chelsea 2.1×, Sweden 1.3×) median 10.9× vs the five 7s median 1.1×. Confounded: all 8s were absurd-maths cards on the 09-28 match night / 09-29 City-verdict day; the 7s were 09-29 afternoon/night posts on non-event topics. Cannot separate score from story-day.
- IG only (n=14): 8s are six overnight reels at 0.30–0.74×, Zidane reel 1.25×, Olise carousel 0.50×; 7s: Man Utd 1.05×, Scotland 0.21×, Yamal 0.07×. No relation.

### 2.5 Alex vs the critic (chat record, n≈6, direction only)
| item | critic | Alex | outcome |
|---|---|---|---|
| Sweden "beat them again" stat | PASS 8 | "not funny, not sharable" | Threads 1,344, X ~1,000 → Alex right |
| Gyökeres/Zidane tweet-on-photo carousel | FAIL 5 | "really like it", posted by hand | IG 6,996 views, 261 likes, 34 shares, 1 follow (1.02× IG feed median; best gate-era IG carousel after Ronaldo/Messi and Man Utd) → Alex right on reach |
| Italy 1-goal-in-120 | PASS 8 | "really like it" | Threads 16,574 / X ~1,300 → Alex right on Threads |
| Daily Number #1 | PASS 8 | "came across odd, stale", deleted the X copy | X unread; Threads 66,661 → Alex's premise (behind the news) not visible in Threads reach; X outcome unknown |
| Ronaldo/Messi hero photo (Alex's own, not gated) | none | "that exact format is winning" | IG 14,303 views/397 shares (2.8% of views)/0 follows; Threads 32,217/1,344 likes → Alex right |
| Ronaldo-on-bench "explaining" reel | PASS 8, Alex "yes" | liked | IG 1,296 (0.72×), FB 253 (3.8× FB median), TikTok 466 (0.65×) → neither predicted a reel |
| 6 overnight reels, PASS 8 | PASS 8 | Alex hides most royalty-free-music reels from the grid ("embarrassing", 09-29 13:14Z) | 0.3–0.74× IG reel median → Alex's behaviour is the better signal |

## 3. Is the content actually bad? By lane, measured

### 3.1 Threads (image-first): improving, floor raised
| period | posts | median views | ≥10K | ≥50K | <300 views |
|---|---|---|---|---|---|
| 09-13→19 | 124 | 1,043 | 16 (12.9%) | 5 | 15 (12%) |
| 09-20→24 | 73 | 692 | 6 (8.2%) | 3 | 17 (23%) |
| 09-25→27 | 66 | 1,377 | 10 (15.2%) | 6 | 4 (6%) |
| 09-28→29 | 19 | 2,523 | 7 (36.8%) | 4 | 0 |
Types 09-13→29: IMAGE 202 (median 1,286, 35 ≥10K), CAROUSEL 21 (1,383), TEXT 22 (1,377, one 15.6K), VIDEO 37 (478). Posts/day fell from 17.5 (09-13→27) to 9.5 (09-28→29). Per-post median does not fall with volume (Spearman posts/day vs median/post +0.18, n=16 days); total views/day rises with volume (+0.52) because hits are a lottery on news days. Confound: 09-28/29 include the City-verdict story, and 09-29 posts are ≤12h old.

### 3.2 Instagram feed: falling since before the gate, and it does not convert
- Median views: carousels 12,196 (09-13→19) → 9,187 (09-20→25) → 5,509 (09-26→29); images 6,855 → 6,716 → 3,091.
- Follows per 10K views (feed posts, API): **2.92 → 1.01 → 0.66** (excluding the two 09-14 mega posts, 09-13→19 is 1.96). Gate-era feed posts (7): 1 follow total (3 are ≤4h old).
- The decline starts 09-20, 8 days before the gate; the international break (no PL until 10-10) and the 09-25 City-verdict spike are confounds I cannot remove.

### 3.3 Reels/video (IG, FB, TikTok, YT): weak, and volume went here
| lane | 09-13→19 | 09-20→27 | 09-28→29 |
|---|---|---|---|
| IG reels /day (median views) | 2.1 (2,591) | 2.5 (1,673) | 4.0 (1,140) |
| FB reels /day (median views) | 3.6 (102) | 6.1 (68) | 5.5 (38) |
| TikTok /day (median views) | 0.9 (1,586, n=6) | 5.2 (802) | 4.0 (303) |
| Threads posts /day (median) | 17.5 (whole 09-13→27) | | 9.5 (2,523) |
- The six overnight Metricool reels (one asset each, scheduled 03:30–11:00, PASS 8, cross-posted IG/FB/TikTok/YT): IG 534 / 999 / 1,022 / 1,068 / 1,211 / 1,336 (all below the IG reel 14-day median 1,795); FB 4 / 7 / 8(Zidane) / 12 / 47 / 146 (FB median 66; 1 of 6 above); TikTok 273 / 285 / 293 / 312 / 393 (all below TikTok median 715).
- FB is a lottery: 85 reels, median 68, 6 ≥10K, top 5 posts = 84% of all views. Clone of a winner fails: "every chelsea fan who called brentford away a free three points" 44,528 (09-20) vs "every real madrid fan who called the derby a free three points" 29 (09-23); "spurs fans … " clones 26–37.
- Within-era emoji test (IG reels since 09-20): with 😭 median 1,231 (n=19) vs without 1,576 (n=9); "fans" template 1,092 (n=9) vs other 1,445 (n=19). Weak (−22%/−25%), n small. The era shift (0 of 15 pre-09-20 reels had 😭, median 2,591; 19 of 28 since, median ~1,400) is real but not attributable to the emoji.
- Alex hides most of these from the grid himself (09-29 13:14Z: "they haven't really done well … embarrassing … royalty free music … haven't followed the format that makes reels succeed"). A_GRADE_PLAN says this is "NOT a violation" but enforce.mjs logged 10 open "IG reel must be shared to feed" violations at 13:09 and the floor manager led checks #1, #3, #4 and #5 (11:36–16:25) with it before the rows were dropped at 16:45.

### 3.4 X: unmeasurable except by hand
Gate-era X originals with numbers (posts_log.metrics, Chrome/screenshot reads): "Snapchat 0 followers" 972, Italy 1,300, Belgium 1,000, Sweden 1,000 (X median ≈900–1,000 → 0.97–1.4×), Yamal 518 at +46 min. The same three maths cards on Threads did 16,574 / 11,457 / 1,344 (Italy 12.7× and Belgium 11.5× more than on X). Critic verdict 8 on all four. X-side critic accuracy cannot be computed (no API, Chrome rows have no post id).

## 4. What separates the best from the worst (14 days, 09-16 → 09-29)
Platform 14-day medians: Threads 1,054; IG feed 6,858; IG reel 1,795; FB reel 66; TikTok 715; X ≈900–1,000 (manual).

### 10 best (one row per asset, best platform; ×= multiple of that platform's median)
| # | when | platform | post | views | ×med | notes |
|---|---|---|---|---|---|---|
| 1 | 09-21 | Threads | 🚨 "Mathematically, if Tottenham win all 33 … 101 points" card | 3,287,396 | 3,119× | 4,945 likes, 148 replies; same card X 380K (manual), IG image 49,285 (09-23); Spurs bottom of the table, break day |
| 2 | 09-24 | Threads | "Sky Sports have done Saka dirty here 😭😭" (broadcaster lower-thirds) | 2,700,491 | 2,562× | 5,839 likes, 226 shares; evergreen, Wed afternoon |
| 3 | 09-25 | X | 684-points card (Everton 6 pts v City 114) | ~1,360,000 (manual) | ~1,400× | 77.7K likes, +51 min after Ornstein; same card Threads 259,935 (8,279 likes, 244 reposts), FB reel 42,431 (499 likes, +30 min) |
| 4 | 09-21 | Threads | Jude Bellingham → Romero quote card | 1,213,855 | 1,152× | 154 replies; derby night |
| 5 | 09-25 | Threads | "three most terrifying hairstyles" hairline crops | 840,379 | 797× | "what am I looking at?" image, 962 likes |
| 6 | 09-27 | Threads | Dortmund sold Dembélé/Jude/… receipt, knife last | 508,504 | 482× | 1,696 likes, 309 replies, Saturday no story |
| 7 | 09-25 | Threads | "I'm crying 😭😭😭" four-player pointing grid | 372,716 | 354× | 1,915 likes; not decodable in the library |
| 8 | 09-25 | Threads | "Lamine Yamal … best teenage winger ever?" vs Ronaldo Nazario stat card | 295,019 | 280× | 356 replies, 3,928 likes: ragebait comparison |
| 9 | 09-28 | Threads | Cissé/QPR celebrating with City 2012 (screenshot of a third-party tweet + our line) | 144,421 | 137× | 1,288 likes; Postiz queue item from 09-27, no verdict |
| 10 | 09-29 | Threads | 🚨 "Proper punishment for Manchester City:" 6-line ragebait list on a plain stadium photo | 101,042 | 96× | 662 likes, 181 replies; NO posts_log row, NO verdict; the caption is the content |
Best elsewhere: FB reel 09-18 "Tottenham vs Aston Villa will be absolute cinema" 78,651 (1,192× FB median; slapstick, 3-word plate); IG carousel 09-18 Gavi 30-minutes-no-foul tweet stack 118,667 views, 8,359 likes, 4,160 shares, **69 follows** (best follow-converter in the window); IG carousel 09-24 Xavi v Klopp 88,271 (8 follows); TikTok 09-19 De Zerbi payout 13,779 (19×); FB 09-20 Chelsea "free three points" 44,528; FB 09-26 Goldbridge donation clip 42,481.
Nine of these ten pre-date the critic gate (started 09-28 10:31Z); #10 post-dates it but has no verdict. Backtest: the old rubric would have blocked 9 of 12 of this class.

### 10 worst (≥30h old; effort was spent; ×= multiple of platform median)
| # | when | platform | post | views | ×med | critic |
|---|---|---|---|---|---|---|
| 1 | 09-29 03:02 | FB reel | "The one you sold scores 14 the next day. It's in the rules." | 4 | 0.06× | PASS 8 |
| 2 | 09-21 | IG reel | "every other fanbase the second brighton's third goal went in…" | 3 | 0.002× | none (pre-gate) |
| 3 | 09-29 04:30 | FB reel | "Same fans. Same ref. 😭" | 7 | 0.11× | PASS 8 |
| 4 | 09-28 22:08 | FB reel | "Most Zidane has run since 2006 😭" (the moment the 25-min-late Zidane fix chased) | 8 (IG 2,237) | 0.12× | PASS 8 |
| 5 | 09-29 06:01 | FB reel | "The pack animation was gold. The player was 71." | 12 | 0.18× | PASS 8 |
| 6 | 09-21 | IG reel | "Brian Brobbey has more goals at the Etihad than Foden 😭" | 13 | 0.007× | none |
| 7 | 09-21 | IG reel | "chelsea fans telling everyone they're enjoying the season…" | 15 | 0.008× | none |
| 8 | 09-24 | Threads | text-only 🚨 "Mathematically, if Tottenham score in each of their next four games …" (same template as #1 above, no image) | 131 | 0.12× | none |
| 9 | 09-18 | Threads | 🚨 "CRAZY STAT: Emiliano Martínez has conceded 10 goals in 4 games" | 128 | 0.12× | none |
| 10 | 09-16 | Threads | "“The best attacking duo in the world right now”" (bare photo) | 82 | 0.08× | none |
Pattern that separates the two lists (inference from my own read of 24 top and 24 bottom Threads images plus the reel data, not a controlled test):
1. **Target.** Winners hit a fanbase millions argue about (Spurs, City, Arsenal, United, Chelsea, Ronaldo/Messi, Yamal) on the day's mega-story or an evergreen argument. Losers are low-stakes (mid-nation fixtures, a Valencia sub, Neymar, Barça beating Racing), Nations-League filler or day-3 follow-ups.
2. **Hook is in the frame or the claim.** Winners: the image IS the joke (lower-thirds, hairline crops, stat card with a contested claim, absurd-maths card) or the caption is a contested ragebait list. Losers: neutral photo + neutral caption (Mbappé stare, Elliott, Mourinho press-conference frames), stat tables, or the same maths template with no image.
3. **Route/format.** Winners on Threads are image singles; 2 of the top 10 are third-party tweet screenshots with a one-line take (Cissé, and Modrić/Lijnders in the top 24), 1 is a caption-only ragebait list. Losers are dominated by scheduler video (IG/FB reels with a royalty-free-music credit) and text-only Threads.
4. **Clones die.** The 3.29M Spurs card, cloned as text on 09-24: 131 views. The FB "Chelsea free three points" clone: 29 views. A proven template only works with its image and on its own story.

## 5. What was actually optimised (quality-first vs volume)
Sources, in time order:
- Alex 09-28 12:19 Oslo (10:19Z): "it looks so sloppy and low effort … we're posting because we need to meet a quota"; 09-28 12:47: "I think a lot of the reason … was because of this quota"; 09-28 16:21: "Quality before quantity, but high quality quantity would also be nice"; 09-29 14:35: "we have to keep our quality 10 out of 10 … eight Instagram posts … not blast out a lot of quantity". Same days, opposite direction: 09-28 23:19 "i can not see any post on facebook for 7 hours"; 09-29 00:11: "post tens of quality snapchats, more if you want, queue loads of quality content"; 09-29 21:40: "we are doing the same mistake as yesterday of being completely quiet on facebook … we have to post now right?"; 09-29 21:56: "i guess we need more on threads"; 09-29 22:20: "i suggest you post on x, i can not be asked posting … i do not care about the risk".
- banger-critic.md original: "Most drafts should FAIL. A quiet day with 2 great posts beats 10 filler posts." → after backtest: "there is NO target pass rate … a false PASS costs almost nothing".
- PLATFORM_PLANS line 2: "Targets are ceilings … never quotas" — same file: hourly Threads screenshot singles ~14/day, Telegram 10–15/day, Snapchat 5–8 Spotlights/day, "≥6 hit-shots a day … each brings 1–5K followers" (RULES_REVIEW §2 already scrapped the 1–5K claim).
- RULES_REVIEW 09-29 00:30: "SCRAP count-grading". A_GRADE_PLAN 09-29 (written after) §2: 11 daily commitments graded ✅/❌ hourly: #3 "≥7 image-led originals" on Threads, #5 "Facebook ≥3 posts", #6 X count vs 4–6, §4 enforcer "≥5 image posts by 18:00"; §6 "counts are SOFT ceilings/floors … every post must be 10/10".
- `social/coverage.mjs` `MAX_GAP_H = { x: 3, threads: 2, telegram: 2, instagram: 5, facebook: 4, bluesky: 4, snapchat: 6, whatsapp: 6, youtube: 12, tiktok: 12 }` — a posting FLOOR on 10 platforms that wakes the Editor; header cites Alex's FB-quiet complaint. That is a quota with a different name.
- Floor manager 09-29 (pm/floor_2026-09-29.md, 10 checks 11:36 → 21:45): "Editor idle / afternoon empty" (#1, #2), "no afternoon reels" (#3), "evening dead zone" (#4, #5, #6), "no post within 30 min of any key moment" (#10); the gaps it graded were about presence, not outcome.
Measured outputs vs those statements:
- Volume shifted from the lane that works (feed: Threads 17.5→9.5/day, IG feed 7.3→4.5/day) to the lane that doesn't (reels: IG 2.3→4.0, TikTok 0.9→5.2→4.0, FB 3.6→6.1→5.5 per day), while per-post medians in the reel lane fell 2–5×.
- posts_log 09-29 (Oslo, deduped by platform+draft): IG 10, FB 11, TikTok 7, YouTube 6, Snapchat 8, Telegram 7, Threads 7, Bluesky 5, X 4. YouTube 6/day at 30 subscribers.
- 46 distinct assets → 187 log rows (avg 4.1 destinations per asset); 52 duplicate (draft,platform) rows.
- 54 of 130 verdicts (42%) were spent on Snapchat, a platform with no follower readout (Insights screenshots owed 10-01); 42 verdicts fell in one hour (00:00–01:00 09-29).
Conclusion: quality-first was the stated rule and the FAIL rate (51%) shows it in the queue, but every operational control that runs by itself (coverage.mjs, enforce.mjs, floor manager, hourly Threads test, mirror rules) rewards presence, and every Alex complaint of the moment added a new binding rule to the critic instead of reconciling the old ones.

## 6. Cost of FAILs / pulls / deletes
- 66 FAILs of 130 verdicts (first-verdict FAIL 66/129 = 51%). By platform: Snapchat 28/54, X 12/25, IG 7/17, FB 5/10, Threads 4/6, Bluesky 3/3, TikTok 3/5, Telegram 2/6.
- FAIL reasons, keyword count over the 66 whys (a why can hit several): timing/staleness/lateness ≈36, repeat/duplicate ≈15, generic/no hinge ≈15, technical (audio/render) ≈13, no target/who-cares ≈12, text-only/no image ≈8, fact/quote risk ≈7. Half of FAILs are about being late or repeated = production latency, not taste.
- deleted.md: 7 rows. 5 pulled BEFORE publish (all 09-28 15:45–16:00, pre-gate queue), 2 deleted AFTER publish, both X (Daily Number #1 by Alex 09-29 ~14:30; Yamal own-tweet-card 09-30 00:10, reposted with bare photo). deleted.md calls Daily #1 a "flop" on a +1h Threads read (1,483 views, 3 likes); the Threads copy is now 66,661 views, 96 likes, 34 replies. Threads accrues views for 24–48h (the City "punishment" post read 16.9K at 18:20, 29.9K 19:35, 44.7K 20:30, 62.5K 21:45, 101K at 01:40); the floor manager and sweep judged at +3–5h.
- Time cost measured: City verdict story → carousel: story ~21:30 Oslo, verdict PASS 23:26, Metricool schedule 23:38, cap failure, Postiz re-route posted 00:27 (≈3h; ~1h56 to verdict, ~1h to post after PASS). The critic step itself is minutes (FAIL→PASS same id median 7 min, n=1); the lag is build time.
- Overnight batch: 6 reels × 4 platforms scheduled 03:30–11:00 (no one awake) at PASS 8 → the best of them 1,336 IG views.

## 7. What is NOT the problem
- Threads image posts: floor raised, median 2× since 09-25, 7 of 19 ≥10K since 09-28 (caveats in 3.1).
- The 51% FAIL rate as such: on Threads the gate era has zero posts <300 views vs 12–23% before; FAILed X drafts on 09-29 (5/10 typical) had specific defects (fifth Spurs-points post in 24h, AI-generated anonymous man, blank template).
- Critic hard-fail categories (betting, tragedy, minors, fabricated quotes): no evidence of a false block; 7 FAILs cite factual/quote risk.
- Critic latency: FAIL→PASS loops are minutes; the delay is Editor build time.
- The emoji: within-era effect is small and noisy.
- Daily Number #1's Threads reach: 66,661 views is a top-3 gate-era post (like rate 0.14%, normal for mega posts: 3.29M at 0.15%, 2.7M at 0.22%).

## 8. Commands run / method (reproducible)
- `node /…/scratchpad/quality/pull.mjs 17` equivalent (GET-only Graph fields `views,reach,saved,shares,likes,comments,total_interactions,follows,profile_visits` for IG feed; `ig_reels_avg_watch_time` for reels; `views,likes,replies,reposts,quotes,shares` for Threads) → `quality_data/ig_threads_pull_17d_2026-09-30.json`.
- Metricool MCP `getAnalyticsDataByMetrics` brand 7074932, 2026-09-13 → 2026-09-30: FBRE02/05/06/10/11/08 (FB reels), TKPO02/05/07/08/10/16/13 (TikTok), YTVP02/17/06/08 (YouTube: views null).
- Joins: posts_log ↔ Threads/IG/FB/TikTok by normalised caption prefix (hashtags and music credit stripped); verdicts ↔ posts by same key; Spearman with average ranks (own code); multiples use 14-day medians (09-16→09-29).
- Read: A_GRADE_PLAN, RULES_REVIEW_2026-09-29 (all), TEAM, PLATFORM_PLANS, backtest RESULT.md, banger-critic.md + `git diff`, verdicts/taste/posts_log/deleted, pm/floor_2026-09-29.md, pm/grades_2026-09-29.md, pm/ENFORCEMENT_LOG, coverage.mjs, threads_pair_test.md, series_daily_number.md, Alex's messages extracted from the session JSONL (all sessions; 09-28→09-30).
- Images: viewed 24 top and 24 bottom Threads post images (own downloads of our own posts from the Threads media_url) as contact sheets.

## 9. Data gaps
- X per-post data (no API). Every X claim is a manual number.
- YouTube per-video views (Metricool returned null); Bluesky, Snapchat, Telegram, WhatsApp outcomes.
- Origin of the 101K "proper punishment" Threads post (not in posts_log, verdicts, Postiz log window, IG). Candidates: Alex's phone, a sweep/pre-queue task, IG→Threads cross-post. Ronaldo/Messi is Alex's IG post (Threads copy via cross-post).
- Follows per Threads/X post (not exposed); IG reel follows (not exposed).
- FAILed drafts' counterfactual outcomes (never posted) — the critic's false-FAIL rate is unmeasurable without shadow-posting or scoring already-published posts blind.
- Confounds I could not remove: international break (no PL until 10-10), City verdict story cycle 09-25→09-29, 09-28/29 posts still maturing, backtest hits clustered 09-21→25.
