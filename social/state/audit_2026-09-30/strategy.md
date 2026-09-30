# STRATEGY, TARGETS AND ACCOUNT HEALTH AUDIT — 2026-09-30 (auditor "strategy", read-only, ~01:50–02:30 Oslo)

Nothing was posted, queued, scheduled, deleted or edited. No pz/postiz/tg/enforce/review/verify-cancel, no Metricool tools (none available in this session), no browser automation. Only: file reads, read-only Graph/Threads GETs (tokens read from Keychain inside a script, never printed), public web reads, arithmetic.
Tags: [MEASURED] read by me today from a named source. [PRIOR] measured by another audit/log, re-used. [INFERRED] my reasoning. [UNVERIFIED] could not check.
Day windows: IG Graph daily = UTC days (I passed since/until); FB/Threads daily rows are labelled by END time (07:00Z = midnight PDT), so row "D" is mostly D-1 and the last two rows are partial/late-attributed.

## 0. Answer in twelve lines
1. Real net growth is about +170/day (Threads +132, FB +26, IG +5, X ~+10, TikTok −2, YT 0, Bluesky ~0), 77% of it from Threads and 92% from Threads+FB [MEASURED/PRIOR, §2]. The A_GRADE_PLAN targets sum to ~+470/day (Threads 250 + IG 100 + FB 50 + X 60 + TikTok ~9): 2.7× the run-rate, in 14 days, inside an international break.
2. The IG target (+100/day) is internally inconsistent: follows/day = 16 + 0.415 per 1K non-follower reach (r=0.83, n=29 days). The plan's own inputs (60K non-follower reach, 3 follows/10K) give ~+17/day. +100/day needs ~250–263K non-follower reach/day; the best day in 29 was 261K (09-09) and the best 7-day mean net was +72 (09-04→09-10) [MEASURED].
3. IG's problem is distribution, not conversion: follows per 10K views stayed 2.1–3.6 across four periods while views/day fell 386K → 74K and non-follower reach 152K → 30K. Net/day stepped from +55 (08-31→09-19) to +9 (09-20→09-28) [MEASURED]. The step lands on 09-20 = Alex's phone → pipeline handover AND the last PL day; the break starts 09-21. Those cannot be separated with existing data. PL returns 10-10 [web, verified]; that is the only clean test.
4. The plan's 14-day window is the break (PL MW5 ended 09-20, MW6 is 10-10). The 10-06 and 10-13 kill/re-scope reads therefore grade the plan on a calendar with no club-drama fuel; hits on IG/FB are club-drama days (2 IG posts = 40% of a week's follows; FB 10 of 28 days ≥40K views = 78% of follows).
5. The plan's instruments mis-measure: FB dashboard shows 32.9 follows/10K vs 3.2 measured over 28 days (stale denominator); IG per-post follows now capture 28% of account follows (was 63%); Threads daily follows do not track views on hit days (+105 on 2.7M, +209 on ~213K). The KPI "follows/10K views ≥3" is not controllable on Threads and is under-counted on IG.
6. Effort vs yield is inverted: 92 of 130 critic verdicts (71%) went to Snapchat/X/Telegram/TikTok/WhatsApp (≈+8/day net combined); Threads got 6 (4.6%) and produces 77% of net.
7. "A on every platform" is the wrong objective for ten platforms; three (Threads, FB, IG) hold ~100% of measurable growth.
8. IG against same-format comps: our carousels earn 0.6–1.4% of followers as likes vs 2.6–14.9% for the five reference carousel accounts (same window, same break). It is not "we use others' tweets" (they do too); it is engagement per follower, fixed rhythm (itsfootybants 3/day at 14:30/16:30/18:30 Oslo), single format, 10–14 slides.
9. Aggregator suppression is unproven: Alex's Account Status showed recommendable on 09-22 and 09-29 [PRIOR], the best follow weeks (09-07, 09-14) were tweet-on-photo carousels, and comps run the same format. But our carousels are ~all third-party slides, several lifted from the same comps' carousels; the policy risk is real and untestable from the API.
10. Audience is not the briefed audience: IG UK 23.3% / US 10.9% / Kenya 9.9% / Nigeria 9.4% / India 6.6%; Threads India 12.0% / UK 10.6% / US 10.2%; Threads had 1 link click in 17.3M views. The plan has no Ball IQ or revenue KPI.
11. Three target sets are live at once (PLATFORM_PLANS v1: IG +300, X +300, Threads +400, 1M binding in scheduled prompts; TEAM/RULES: 500–900/day; A_GRADE: ~470/day). Alex's own words 09-29: "a few hundred/day is success".
12. Right-sized 14-day targets from measured slopes are in §7 (inferred): total +200–260/day, not +470.

## 1. Sources and commands (all read-only)
Files: A_GRADE_PLAN.md, PLATFORM_PLANS.md, TEAM.md, HANDOFF.md, RULES_REVIEW_2026-09-29.md, collab_plan.md, scoreboard.md, manual_metrics.json, dashboard_history.jsonl, pm/{DASHBOARD,ACCOUNTABILITY,POSTING_LEDGER,grades_2026-09-29,format_portfolio,board}.md, insights/{2026-09-29.md,followers.csv,2026-09-27.json}, audit_2026-09-29/{COMBINED_PLAN,ig_winners_study,ig_hero_format_study,text-platforms,meta}.md, audit_2026-09-30/{quality.md,saydo.md,x_tt_snap_tg.md,competitor_sweep_2026-09-29.json,quality_data/ig_threads_pull_17d_2026-09-30.json}, research/{socialinsider_2026-09-28,ig_follow_conversion_2026_09}.md, USED_SLIDES.md, review/verdicts.jsonl, posts_log.jsonl, scheduled-tasks/*/SKILL.md, memory files listed in the brief.
API GETs (Keychain tokens, python urllib, script in the session scratchpad, GET only):
- IG (17841445120874725): insights follower_count (day, 30d); follows_and_unfollows total_value breakdown follow_type, one call per UTC day 08-30→09-29; reach breakdown follow_type and views breakdown follow_type / media_product_type, one call per UTC day 08-31→09-29; follower_demographics country/city/age/gender.
- Threads: me/threads_insights views (daily, since 30d), followers_count, follower_demographics country/city/age/gender, clicks (30d), likes/replies/reposts/quotes totals.
- FB Page (543612208834002): insights page_media_view, page_total_media_view_unique, page_daily_follows_unique, page_daily_unfollows_unique, page_video_views, page_post_engagements (day, 30d); followers_count.
- IG business_discovery for 13 reference accounts: FAILED "(#4) Application request limit reached" (endpoint-level throttle, likely shared with the sibling audits' ~500 calls). Base IG calls worked again 02:16. No evidence the enforcer was blinded (grep "request limit" in ENFORCEMENT_LOG = 0). I stopped calling.
Public web: curl og:description of instagram.com/<handle> and threads.com/@<handle>; WebSearch (PL 2026-27 calendar; itsfootybants snippet); socialblade = HTTP 403; instagram.com via WebFetch = login wall.
Data copied to audit_2026-09-30/strategy_data/: ig_follows_30d.json, ig_reach_30d.json, fb_30d.json, threads_views_daily.json.

## 2. Net growth per platform (the baseline every target must be compared to)
| platform | followers 09-30 | net/day, window | source |
|---|---|---|---|
| Threads | 42,085 | +819 in ~6.2 d (41,264 09-23 → 42,083 09-30 01:41) = +132/day; daily increments +105, +113, ~+156 (2-day), +79, +209 | followers.csv, dashboard_history, Threads API [MEASURED] |
| Facebook | 602 | 444 → 602 = +158 in 6 d = +26/day; last rows +28 (09-27), +35 (09-28), +28 (09-29 row, views lagging), +45 (09-30 partial) with kr 50/day ad since 09-28 | FB API [MEASURED]; ad effect unisolated |
| Instagram | 32,562 | 09-23→09-28 +29 (F−NF), follower count +15 09-23→09-30; 08-31→09-19 +55/day; 09-20→09-28 +9.1/day; 09-26→09-28 about −1/day | IG API [MEASURED] |
| X | 45.3K | ≈+10/day (Alex screenshot, 0.1K rounding ±50) | manual_metrics [PRIOR] |
| TikTok | 16,200 | −6 in ~3 d | public page [PRIOR x_tt_snap_tg] |
| YouTube | 30 | 0 in 30 d | insights [MEASURED PRIOR] |
| Bluesky | ~1,327 | ~0 | scoreboard [PRIOR] |
Sum ≈ +171/day (Threads 132 + FB 26 + IG 5 + X 10 − TikTok 2). Matches RULES_REVIEW's +170/day 5-day mean.
Correction to team lore: "IG ≈0 net over 30 days / follow rate 0.01%" is wrong. IG netted +1,181 from 08-31 to 09-28 (gross 1,931, unfollows 750), implied ~31.4K followers on 08-31; but +1,099 of that came before 09-20. The "net follows/day 77 (09-15→19)" in RULES_REVIEW §1.1 are GROSS follows mislabelled net (real net +58/day then).

## 3. IG: follows, unfollows, reach (30 days, IG Graph, UTC days)
Follows/unfollows per day (F/NF): 08-31 47/33, 09-01 51/22, 09-02 66/39, 09-03 72/19, 09-04 95/18, 09-05 109/26, 09-06 90/37, 09-07 67/23, 09-08 89/25, 09-09 140/22, 09-10 96/28, 09-11 89/23, 09-12 59/28, 09-13 53/30, 09-14 127/27, 09-15 120/30, 09-16 59/39, 09-17 56/25, 09-18 63/23, 09-19 89/21, 09-20 38/28, 09-21 50/21, 09-22 37/23, 09-23 38/26, 09-24 26/24, 09-25 39/20, 09-26 25/25, 09-27 22/21, 09-28 19/24, 09-29 not yet attributed (Meta lag).
Cross-check: FOLLOWER series == follower_count metric; F−NF net over 09-23→09-28 (+29) ≈ follower delta (+15..23) so NON_FOLLOWER = unfollows.
| period | reach/day | non-follower reach/day | follower reach/day | views/day | views mix | gross follows/day | unf/day | net/day | follows per 10K views | follows per 10K NF reach |
|---|---|---|---|---|---|---|---|---|---|---|
| 08-31→09-13 | 161,183 | 152,537 | 8,028 | 385,957 | reel 49 / carousel 25 / post 25 | 80.2 | 26.6 | +53.6 | 2.08 | 5.3 |
| 09-14→09-19 | 139,220 | 130,998 | 7,987 | 236,669 | post 44 / carousel 43 / reel 12 | 85.7 | 27.5 | +58.2 | 3.62 | 6.5 |
| 09-20→09-25 | 94,954 | 87,188 | 7,515 | 152,287 | carousel 57 / post 27 / reel 16 | 38.0 | 23.7 | +14.3 | 2.50 | 4.4 |
| 09-26→09-29 | 35,340 | 29,635 | 5,872 | 74,224 | carousel 72 / post 17 / reel 9 | 22.0 | 23.3 | −1.3 | 2.78 | 7.4 |
NF reach last days: 09-24 79K, 09-25 111K, 09-26 53K, 09-27 16K, 09-28 23K, 09-29 26K. Follower reach fell only −27% (8.0K→5.9K) vs non-follower −81%.
Regression (n=29): follows/day = 16.0 + 0.415 per 1K NF reach; Pearson 0.83, Spearman 0.77; excluding the 3 biggest reach days r=0.76, slope 0.442; last 10 days slope 0.366. corr(follows, unfollows)=0.06; corr(unfollows, views)=−0.31. Unfollows 18–39/day, mean 25.9 = 0.08% of base/day.
Break-even: gross must exceed ~26/day = ~19–24K NF reach/day; now 16–26K = flat/negative.
What net +50 / +100 need: NF reach 142K / 263K per day (all 29 days: 6 days ≥142K, 0 days ≥263K; max 261K on 09-09).
Volume vs reach: feed posts/day vs NF reach r=+0.33 same day, +0.52 lag-1 (n=16 days); reels/day −0.28. No evidence that posting less lifts reach.
Post-attributed follows vs account gross: 09-13→09-20 379 of 605 (63%); 09-21→09-27 66 of 237 (28%). ~72% of last week's follows are not on any feed post's counter (reels/stories/profile-from-other-platform unknown).
Concentration: 2 posts on 09-14 (image 152 follows/240.7K reach; carousel 88/145K) = 240 follows = 40% of the 605 gross follows 09-13→09-20. Feed posts with reach ≥30K per 4-day block: 2, 3, 3, then 0 (09-25→09-28, max 26.5K).
Per-type, mature (≤09-27, n): carousel n=59 median views 9,187, reach 4,349, likes 296 (0.91% of followers), follows 2.15/10K views; image n=51 median 6,796, likes 176 (0.54%), 2.3/10K; reel n=35 median 2,087, likes 54 (0.17%).
Demographics: country GB 23.3, US 10.9, KE 9.9, NG 9.4, IN 6.6, TZ 4.1, ZA 3.6, GH 2.4, AU 2.4, IE 2.1 (n=29,313); age 25-34 34.7, 18-24 25.2, 35-44 19.4, 13-17 4.6; gender M 72.7 / F 4.9 / U 22.4.

## 4. Threads
Daily account views (API, buckets by end 07:00Z), 30 buckets 08-31→09-29: sum 16.06M, mean 535K, median 262K; days ≥250K 16, ≥833K 6, ≥1.79M 3 (09-21 1.60M, 09-22 2.45M, 09-25 2.27M, 09-26 2.08M sit in the tail). 32-bucket sum 17.30M.
17-day post pull (282 posts, 09-13→09-29, sibling data): median 1,128 views, mean 40,168; top 1% (2 posts) = 52.9% of views, top 3% (8) = 83.7%, top 5% (14) = 89.8%, top 10% = 95.4%. ≥50K: 18 posts in 17 days (~1/day); ≥10K: 39. Image n=202 median 1,286 (18 ≥50K); text n=22 median 1,377 (0 ≥50K); video n=37 median 478; carousel n=21 median 1,383. Posts/day mean 16.6 (range 6–29).
Format signal: 🚨-prefixed (fake-official/maths/receipt) posts n=35: median 2,523, 13 ≥10K (37%), 6 ≥50K (33% of all 50K+ hits); un-marked n=148 median 998, 16 ≥10K (11%). By UTC hour hits spread 08–21; posts after 20Z: 4 of 67 ≥10K (6%) vs 35 of 215 (16%) before (live-match text blocks confound).
Daily median: 09-13→20 1,005; 09-21→25 951; 09-26→29 1,401; 09-28 3,460 (9 posts), 09-29 2,364 (10 posts).
Follower yield: +819 followers on ~5.75M views (09-24→09-29) = 1.42 per 10K views. Daily pairs (posts-date views → follower increment): 2.72M → +105; 1.83M → +113; 59K+651K → ~+156/day; 251K → +79; ~213K (still climbing) → +209 (28 h window 09-28 21:32→09-30 01:41). The +209 day had no hit-conversion routine (floor manager, accountability board 21:45).
Requirements at 1.42/10K: +180 needs 1.27M views/day, +250 needs 1.76M/day (3 of 30 days). At the plan's 3/10K: 600K / 833K (6 of 30 days ≥833K).
Threads demographics (n=34,744 attributed): IN 12.0, GB 10.6, US 10.2, NG 7.0, KE 6.9, ZA 4.9, TR 4.4, GH 2.9, ID 2.4, BD 2.1; age 25-34 31.7, 18-24 27.7, 35-44 15.7, 13-17 8.2; M 72.7.
Link clicks 30d (API, 42 links): total 1 (App Store). Engagement 30d: likes 98,941, replies 5,355, reposts 1,376, quotes 96 on ~17.3M views.
Comps on Threads (public og, 09-30): rivalsbanter 51.5K followers / 65 threads; thatguysjokes 283.6K / 11; hesaballer 18.2K / 544. Threads:IG ratio: ours 1.29, rivalsbanter 0.14, thatguysjokes 0.14, hesaballer 0.09.

## 5. Facebook (Page API, 28 full rows 09-01→09-28)
1,248,410 media views, 400 follows, 32 unfollows = 3.2 follows/10K views; mean 44.6K views/day (median 34.0K), mean 14.3 follows/day (median 6). corr(follows, views)=0.72; slope 3.8 per 10K views. Days ≥40K views (10 of 28) averaged 31.1 follows = 78% of all follows; days <40K averaged 4.9. Days ≥100K: 4.
Dashboard line "32.9/10K" = 29 follows / 8,814 views: 09-29 row still 8,815 (stale/late-attributed), 09-28 row is 51,849 views/38 follows = 7.3. 09-27: 65,721/29 = 4.4.
Requirements: +50 gross needs ~152K views/day by regression (3.4× mean); with the ad supplying ~20/day, ~92K/day.
Earnings (RULES_REVIEW/insights): $0.56 (09-27), $0.71 (09-28) = $0.0085–0.0137 per 1K views.
Audience (09-20 baseline, PRIOR): UK 70.9%, IE 6.3%, ZA 4.4%, NG 4.2%, US 4.2%; 69.8% aged 35+.

## 6. Plan targets vs what they require
| platform | A_GRADE / PLATFORM_PLANS target | measured run-rate | what the target needs | verdict |
|---|---|---|---|---|
| Threads | net ≥+180/day by 10-06, +250 by 10-13; follows/10K ≥3; median image ≥3K; ≥1 post ≥50K/week; 7 image originals/day | +132/day; 1.42/10K; image median 1,286 (2.5K last day); 18 posts ≥50K in 17 d; 9–10 images/day now | +180: 1.27M views/day at 1.42/10K (600K at 3/10K); +250: 1.76M (833K) | +180 = +36% on run-rate, plausible only if follow yield doubles; +250 not evidenced. ≥50K/week is met 7× over and median-post criteria address <5% of views: non-discriminating |
| Instagram | net ≥+100/day; NF reach ≥60K on 3 of 5 days; carousel follows/10K ≥3; reels median ≥3K | +9/day (09-20→28), −1 (09-26→28); NF reach 16–26K; reel median 2.1K | +100: ~250–263K NF reach/day. At plan's 60K: +17/day | not achievable in 14 d; criteria contradict each other by ~6× |
| Facebook | net ≥+50/day; follows/10K ≥7; ≤kr 2.5 per follow | +26/day (6 d), +28…+45 last 3 rows with ad; 3.2/10K over 28 d | 152K views/day organic or ~92K with ad | ≥7/10K is 2.2× the 28-day rate; +50 only on hit + ad days |
| X | net ≥+60/day by 10-13; profile visits ≥0.2% (now 0.05%); median ≥3K; ≥1 post ≥100K/week | ≈+10/day; 11 posts = 89% of 5.3M impressions [PRIOR]; medians ~1K | 4× profile-visit rate; no per-post/follower instrument | untestable; kill date is right, target unmeasurable |
| TikTok | ≥2 of 7 native posts >5K AND ≥+60 followers by 10-06 | 2 of 43 posts ≥5K since 09-20 (4.7%), 0 ≥10K; −6 in 3 d | P(≥2 of 7 | p=4.7%) = 3.9% | near-impossible unless native beats auto by a wide margin (no native baseline) |
| YouTube | weekly long-form from 10-11: median ≥1K, ≥25 subs after 4 | 0 subs in 30 d, ~100 Shorts | 25 subs from 4 uploads | no baseline; correct to kill 10-13 |
| Total | ≈ +470/day | ≈ +171/day | 2.7× | see §7 |

## 7. Right-sized 14-day targets (INFERRED, arithmetic on measured slopes)
- Threads: hold the +132 run-rate, aim +150–180 (needs 1.42 → ~2/10K or 1.0–1.3M views/day). Measure daily follows vs views for 14 days before locking +250.
- Facebook: +30–45/day while the ad runs (28–45 observed; ad cost per follow unknown), ≥3/10K page-view yield; drop ≥7.
- Instagram: break-even (≥26 gross) first; +15–35/day needs NF reach 60–100K/day; treat 10-10→10-13 as the real test.
- X: +10–20/day, no target beyond it until Alex's daily Creator Studio screenshot exists.
- TikTok/YT/Bluesky/Snapchat/TG/WA: ≥0, zero marginal effort.
- Total +200–260/day. A grade = each platform's role at these levels; the plan's numbers are a 6-month trajectory, not a 14-day one.

## 8. Calendar (WebSearch 09-30, premierleague.com / thisisanfield / Yahoo Sports)
Sept+Oct international breaks merged: 21 Sep → 6 Oct. PL MW5 finished 20 Sep; MW6 restarts 10 Oct. So of the 14 days 09-30→10-13, 10 have no PL and only 4 (10-10→10-13) have club football. 10-06 reads (IG NF <30K → "originality rebuild continues"; TikTok; Threads test) and 10-13 reads (Threads <+100/day kill, X <+60 kill, YouTube kill) are break-dominated.
Comps are not collapsing in the same break (last-8-post like/follower: itsfootybants 8.5%, nonoffsideguy 14.9%, rivalsbanter 4.5%, ftblmemeshub 3.6%, trollol 2.6%), so the break alone does not explain our level; it can explain part of our decline.

## 9. Benchmarks (public, 09-30; sweep JSON exported 09-30 00:00Z, last 8 posts each)
| account | IG followers (og) | IG posts total | followers/post | last-8 cadence | format | slides median | median likes (% of followers) | notes |
|---|---|---|---|---|---|---|---|---|
| itsfootybants | 86K | 2,783 | 31 | 3.4/day, 14:30/16:30/18:30 Oslo daily | 8/8 carousels | 11 (10–14) | 7,318 (8.5%) | long news-style captions; no CTA (09-24 study) |
| nonoffsideguy | 50K | 411 | 122 | 1.1/day, 06–09 and 19–20 Oslo | 8/8 carousels | 11.5 (10–15) | 7,522 (14.9%); one 97.9K-like post 09-24 | fewest posts per follower |
| ftblmemeshub | 130K | 2,305 | 56 | 5.1/day (8 posts in 1.4 d) | 8/8 carousels, exactly 10 slides | 10 | 4,724 (3.6%) | "(Ignore this) In 1972…" filler paragraph on every caption; profile-screenshot follow CTA |
| rivalsbanter | 374K (Threads 51.5K, 65 threads) | 5,489 | 68 | 2.0/day | 6 carousels + 2 singles | 12.5 | 16,705 (4.5%) | 1–2 word captions |
| trollol_epl | 136K | 7,110 | 19 | 1.0/day | 8/8 carousels | 14 (10–20) | 3,522 (2.6%) | |
| thatguysjokes | 2M (Threads 283.6K, 11 threads) | 29K | 69 | 8 posts in ~6 h on 09-29 | reels + 2–4 slide carousels | 4 | 25,765 (1.2%) | reels ~4/day (vidIQ 09-28) |
| SHQ (us) | 32.6K (Threads 42.1K) | 2,332 | 14 | IG 9.5/day (17 d): carousel 66, image 53, reel 43 | mixed | 5–9 (USED_SLIDES; IG API cap 10) | carousel median 296 (0.91%); image 176 (0.54%); reel 54 (0.17%) | irregular slots |
Growth benchmark: NOT obtainable. Socialinsider has 0 tracked profiles (research/socialinsider_2026-09-28.md; add_profile needs Alex's approval; no Socialinsider tool in this session). 09-27 business_discovery snapshot equals today's rounded og counts (no visible movement in 3 days). A WebSearch snippet said itsfootybants 76K / 2,448 posts vs live 86K / 2,783 posts: snippet date unknown [UNVERIFIED]; if it is ~100 days old that is ~+100/day at ~3.4 posts/day, i.e. roughly the Threads run-rate, not 10x ours.

## 10. Aggregator / originality evidence
For suppression: IG rule (04-30-2026; screenshot with username is not original) [reference_platform_algorithms]; our carousels are built from third-party slides: USED_SLIDES.md 09-23→09-29 has ~122 references to other IG accounts' posts (itsfootybants, rivalsbanter, ftblmemeshub, nonoffsideguy, trollol, oddsbible, hesaballer, footy.rn: rough regex, undercounts multi-slide lines), ~50 X-tweet refs, ~25 "own" mentions; NF reach −81% vs follower reach −27%; two-step decline (09-16, 09-26/27).
Against: Alex's Account Status = recommendable 09-22 and 09-29 [PRIOR, screenshot not seen by me]; best follow weeks (09-07 4.8/10K, 09-14 4.6/10K) were tweet-on-photo carousels; comps run the identical format with 2.6–14.9% like-rate mid-break; conversion per NF reach flat.
Verdict: unresolved. Cheapest discriminating test: after 10-10, publish 3 own-first carousels + 3 sweep carousels on PL-day topics in alternating slots, compare per-post reach ÷ followers (reach >1× followers = recommended), and re-screenshot Account Status weekly.

## 11. Effort vs yield
review/verdicts.jsonl (130 verdicts, 09-28 10:32Z→09-29 21:27Z): snapchat 54, x 25, instagram 17, facebook 10, threads 6, telegram 6, tiktok 5, bluesky 3, whatsapp 2, youtube 2. Snapchat+X+Telegram+TikTok+WhatsApp = 92 (71%), net ≈ +8/day combined; Threads 6 (4.6%) → +132/day; Threads+FB 16 (12%) → 92% of net.
Scheduled prompts still carry old targets: shq-floor-manager/SKILL.md line 6 ("1,000,000… (binding)", testable 500–900/day); shq-project-manager/SKILL.md lines 11 and 34 (1M binding, "grade EVERY platform against PLATFORM_PLANS": IG +300, X +300, Threads +400, TikTok +200); shq-trend-sweep line 11 (1M binding). A_GRADE_PLAN §1: IG +100, X +60, Threads +180→250. Alex 09-29 (project_goal_reframe): a few hundred/day is success.
Day grade 09-29: Threads B+ while 2 of the 6 currently-due numeric A criteria are met (images/day, ≥50K/week); missed: median ≥3K (2.5K), follows/10K ≥3 (1.42), outbound replies (0), conversion routine (0).

## 12. Money and funnel
FB earnings $0.56–0.71/day (09-27/28) ≈ $0.61/day at 44.6K views/day × $0.0137/1K; X old revenue share $1,311.08 over 28 weeks (Jan 17–Aug 1) then "below minimum", OCR $0, first payout 10-09 [PRIOR x_tt_snap_tg]; TikTok rewards N/A (Norway). money.md absent [PRIOR saydo]. Threads clicks 30d = 1 across 42 links. A_GRADE_PLAN contains no revenue or Ball IQ KPI.

## 13. Not the problem (data says fine)
- Threads reach (no cliff: 17.3M views/32 d, median post flat ~1.1–1.3K; posts/day vs daily median r=−0.17).
- IG conversion per view / per NF reach (flat).
- IG unfollow rate (fixed ~26/day, r=0.06 with follows).
- IG posting volume as a reach cause (r=+0.33/+0.52).
- FB unfollows (32 in 28 d).
- "Third-party slides" as the sole explanation of our gap to comps.
- Posting hour on Threads (hits spread 08–21Z).

## 14. Data gaps
X (no instrument, rounded counts); TikTok/Snapchat/YT/Bluesky/TG/WA not re-measured by me; Threads follower series before 09-23 (none); IG Account Status/recommendation eligibility (screenshot cited, not seen; no API); IG non-feed follow sources (72% of the last week); comps' growth history (Socialinsider empty, business_discovery throttled, SocialBlade 403); comps' cadence from 8-post samples only; Ball IQ funnel from social (no Supabase tool here; only Threads clicks); money.md absent; FB last two rows late-attributed; slide counts of our carousels not in the API pull (USED_SLIDES only).
