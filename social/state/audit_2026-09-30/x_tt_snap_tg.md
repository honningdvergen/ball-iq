# AUDIT 2026-09-30 — X, TikTok, Snapchat, Telegram, WhatsApp (auditor "x_tt_snap_tg", read-only, 09-30 ~01:50-02:15 Oslo)

Tags: [MEASURED] read by me today from a named source. [PRIOR] measured by an earlier audit/log, I re-used it. [INFERRED] reasoned. [GUESS] no instrument.
Rules kept: nothing posted/queued/deleted/edited on any platform or scheduler; no pz/postiz/tg.mjs/enforce/review/verify-cancel/Metricool writes; no browser automation; only public web reads, read-only Threads Graph GET (token read from Keychain inside a script, never printed), local file reads, ffmpeg frame grabs. I had no Metricool MCP tools in this session, so no Metricool analytics.

## 0. VERDICT (12 lines)
1. None of the five platforms earns money now, and only X moves followers (about +10/day, manual 09-29). TikTok is -6 in 3 days (16,207 -> 16,200), Telegram is 3 subscribers, Snapchat and WhatsApp have no readable count.
2. They still consume most of the pipeline: on 09-28, 80 of 104 critic verdicts were for X (14), Snapchat-primary (54, of which 40 were 6-platform reel drafts), TikTok (5), Telegram (5), WhatsApp (2). Threads (the only reliable hit engine, +121/day 09-23->29) got 3.
3. X plan says "Alex hand-posts 4-6/day, zero Postiz". Reality since 09-29 22:20 Oslo (Alex: "i can not be asked posting ... i do not care about the risk"): 11 of 13 X rows in posts_log are Postiz API posts, 0 are from Alex's phone, and 11 match-night lines sent for Alex to quote produced 0 confirmed posts.
4. X is a hit lottery: 11 posts = 4.74M of 5.3M 4-week impressions (89%). Speed on ordinary stories is not the lever: three lines posted 4/5/20 min after the event got 1.3K/1.0K/1.0K on X vs 15.4K/9.8K/1.3K on Threads.
5. X money is small: old program 2026 payouts total $1,311.08 in 28 weeks; OCR $0 so far. Not worth Alex's hands for eligibility.
6. Telegram: 3 subs, every post 2 views, after 25 logged posts. Bio links live ~28 h -> +1 sub. Its "zero effort" mirror is now a local Node runner on Alex's Mac.
7. TikTok test is mis-specified: 4 auto videos queued for 09-30 (plan says 1 control), 3 of 4 use a white plate where the picture is 25-46% of the frame, day 1 never happened, auto slot 17:30 collides with Alex's native slot.
8. Snapchat: plan says 4 Spotlights/day; ledger shows 0 posted and 0 queued today; last batch was 8 rows in 5 minutes at 09-29 00:55-01:00 Oslo. The 10-04 OneUp decision would rest on <=9 visible Spotlights.
9. Scheduled PM/floor/sweep prompts still say "1,000,000 by 2027-01-01 (binding)" and the PM still grades every platform against PLATFORM_PLANS.md (X +300/day, TikTok 3/day +200, Telegram 10-15/day) - two contradictory bars.
10. Smallest set worth keeping: X (hit days by Alex + zero-effort API cross-post of Threads-passed receipts), TikTok (1 auto/day + restarted native test, honest kill), Snapchat (decide by 10-03 on one screenshot, default drop), Telegram (CTA-only test, no scheduled volume, kill 10-13), WhatsApp (park).
11. Cheapest fix to blindness: free public reads exist for TikTok, Telegram, X per-tweet, Snapchat (partly). The dashboard says "manual/stale" for all of them.
12. Do not cancel Postiz ~10-03 before Metricool is proven after its quota reset and an X API lane is decided: Postiz is the only X and TikTok posting path right now.

## 1. COMMANDS RUN / SOURCES (all read-only)
- Files: A_GRADE_PLAN.md, PLATFORM_PLANS.md, manual_metrics.json, pm/{DASHBOARD,ACCOUNTABILITY,POSTING_LEDGER,board,format_portfolio}.md, pm/ENFORCEMENT_LOG.md (tail), pm/grades_2026-09-29.md, deleted.md, tg_queue.jsonl, scheduler_status.json, posts_log.jsonl (187 rows), review/verdicts.jsonl (130 rows), insights/2026-09-29.md + followers.csv, audit_2026-09-29/{x_winners_study,x_study_interim,tiktok_winners_study,snapchat_study,small-platforms,video-platforms,since-friday,x_extended_small}.md, research/{x_ocr_and_replies_2026_09,x_own_top_2026}.md, tiktok_native_test_brief.md, snap_overnight/{BRIEF,manifest_A,manifest_B}.md, memory (reference_x_original_content_rewards, project_goal_reframe, project_snapchat_whatsapp, project_tiktok_eligibility_test, feedback_tiktok_ineligible_reposts, feedback_x_*), scheduled-tasks/*/SKILL.md.
- Session transcript (71fad5c5...jsonl; its timestamps are UTC, I convert to Oslo everywhere below): extracted user messages and assistant text 09-29 16:00 -> 09-30 02:00 Oslo with python; searched tool calls 01:30-02:20 Oslo for the Metricool->Postiz move.
- curl https://t.me/s/shithouseryhq (parsed subscriber counter and per-post views), 2026-09-30 ~01:5x Oslo.
- curl https://www.tiktok.com/@shithouseryhq (parse __UNIVERSAL_DATA_FOR_REHYDRATION__: followerCount, videoCount, heart, bio, commerceUser); curl a video page for playCount.
- curl https://www.snapchat.com/@shithouseryhq, @goalglobal2, @footballgossips, @football.benj (parse __NEXT_DATA__).
- curl https://cdn.syndication.twimg.com/tweet-result?id=2105056631172342021 (public per-tweet JSON; likes/replies only, no impressions). syndication.twitter.com timeline returned "Rate limit exceeded" (not usable).
- Threads Graph API GET (read-only): me/threads + <id>/insights for the Daily Number #1 and City "Proper punishment" posts; me/threads_insights followers_count.
- WebSearch x2 on OCR "automated means" / payout rate; WebFetch on WhatsApp channel page (no count shown).
- ffmpeg frame grabs of 4 queued reels + a bounding-box measurement of the picture band.
- ps/pmset: is tg.mjs runner alive; what keeps the Mac awake.

## 2. MEASURED TABLES

### 2.1 Effort (critic verdicts by primary platform, review/verdicts.jsonl)
| day | bluesky | facebook | instagram | snapchat | telegram | threads | tiktok | whatsapp | x | youtube | total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 09-28 | 2 | 7 | 10 | 54 (26 PASS/28 FAIL) | 5 | 3 | 5 | 2 | 14 (9/5) | 2 | 104 |
| 09-29 | 1 | 3 | 7 | 0 | 1 | 3 | 0 | 0 | 11 (4 PASS/7 FAIL) | 0 | 26 |
Of the 54 Snapchat-primary 09-28 verdicts, 40 list platforms facebook,instagram,snapchat,telegram,tiktok,youtube (the overnight reel factory), 14 are snapchat-only; 37 distinct captions; 26 PASS drafts.
posts_log rows by platform since 09-28 (187): instagram 33, facebook 31, telegram 25, tiktok 22, youtube 21, snapchat 16, x 13, threads 13, bluesky 11, whatsapp 2. My five = 78 (42%). Pure mirrors (Telegram+Snapchat+WhatsApp) = 43 (23%).

### 2.2 Outcome (followers)
| platform | followers | trend | source |
|---|---|---|---|
| X | 45.3K | about +10/day; 09-27->29 about 0 | manual_metrics 09-29 (Alex screenshot); rounded |
| TikTok | 16,200 (statsV2 16,207) | 16,206 (09-27) -> 16,200 = -6 in 3 d | public page 09-30 ~01:55 [MEASURED] |
| Telegram | 3 | 2 at 09-28 21:30, 2 at 09-29 11:57 and 14:42, 3 now | t.me/s 09-30 [MEASURED] |
| Snapchat | unreadable | public field reads 0 but also reads 0 for a known-568-follower account | snapchat.com pages [MEASURED] |
| WhatsApp | unreadable | page shows no count; "0 at 09-28 21:30" | fetch |
| Threads (comparison) | 42,083 | 41,264 (09-23) -> 41,991 (09-29) = +727 in 6 d (about +121/day) | followers.csv, Graph API |
| Facebook (comparison) | 602 | 444 -> 586 = +142 in 6 d (about +24/day) | followers.csv |

### 2.3 X
- 4-week (to 09-29): 5.3M impressions, 228K engagements, 4.2% ER, profile visits 2.8K (0.05%), 34.6K "active" followers of 45.3K [PRIOR: x_study_interim].
- Top 11 posts by impressions (x_winners_study): 1.4M + 781K + 733K + 545K + 380K + 365K + 345K + 83K + 55K + 40K + 17K = 4.744M = 89.5% of 5.3M.
- Since the 09-25 post (1.4M): every post 479-1,744 views [PRIOR since-friday.md; X profile read 09-28, not re-verifiable by me].
- API lane posts (posts_log metrics, read 09-29 11:36 Oslo, rounded by the X analytics screen): Snapchat promo 972 (Chrome); Italy 1,300; Belgium 1,000; Sweden 1,000.
- Same lines on Threads (insights 09-29): Italy 15,386; Belgium 9,847; Sweden 1,308.
- Latency (posts_log broke -> at): Italy 21:13 -> 21:17 (+4 min); Belgium 22:38 -> 22:43 (+5); Sweden 22:38 -> 22:58 (+20).
- Yamal repost (published 09-30 00:06 Oslo): 22 likes, 1 reply at ~1h45 (syndication). Main-session grade file claims the deleted first version had 518 views / 12 likes at 46 min (not verifiable by me).
- Alex-hand-posted comparison (format_portfolio): bench-photo and Ben Davies ragebait 09-27, about 1.26K (n=2).
- Critic on X 09-29: 11 verdicts, 4 PASS 7 FAIL. Brackets predicted "1-5K, P(50K+) 5-14%". Realised on the 4 measured PASS posts (09-28): about 1K each (n=4, small).
- Match-night 09-29 X lines sent to Alex 20:49-22:28 Oslo: Yamal x1, Hendry, Rodriguez, Sulc, Beljo, Pubill, HT England, Gordon, Tartan Army, "Scotland. Ten men..." (about 11). Assistant asked repeatedly "which did you post?"; no reply in the transcript before Alex's 22:20 Oslo "i suggest you post on x".
- OCR/revenue: Creator Studio 09-29 - OCR active, $0.00, next payout 2026-10-09. Old Revenue Sharing lifetime $3,250.61; 2026 periods: 44.97 + 151.07 + 118.65 + 128.43 (10 weeks) + 81.25 + 413.17 + 84.95 + 33.57 + 138.63 + 116.39 = $1,311.08 over Jan 17 - Aug 1 (28 weeks, about $47/week); then Jul 31 - Sep 11 three periods "below minimum". The Jul 4-18 fortnight, which contained the 07-10 (3.9M), 07-13 (4.5M) and 07-05 (1.7M) posts (x_own_top_2026), paid $138.63.
- X says (help page via research/x_ocr...): content "created or posted using automated means" is ineligible; rate unpublished (WebSearch 09-30 agrees: "X does not publish a rate per impression"); pays Home Timeline impressions from Premium viewers only. Whether a scheduler/API counts is not stated anywhere I found.
- Daily Number #1: X copy (scheduled 13:30 Oslo 09-29) deleted by Alex about +1 h (deleted.md: stale-news premise; Threads copy then 1,483 views/3 likes). Threads Graph API now: 68,637 views, 96 likes, 34 replies (posted 13:42 Oslo). Critic's STALE-NEWS TEST was created from this deletion ("Lesson -> critic STALE-NEWS TEST").

### 2.4 TikTok
- Public page 09-30: followers 16,200, following 44, hearts 257,300, videos 339, commerceUser:false, bioLink balliq.app, bio "Follow us on Instagram @ShothouseryHQ" (misspelt handle).
- Post-level: Ronaldo/Portugal bench GOAT (Metricool, published 09-28 16:12 Oslo, critic 8, Alex "yes"): 470 plays, 14 likes, 0 shares, 1 comment, 7 s, "original sound" (video page, ~34 h old).
- Prior (Metricool, 91 videos): six clips = 80% of views, all later flagged unoriginal; since 09-20: 0 of 43 >10K, 2 >5K (5.4K, 5.1K), median 794; median by Oslo hour band 540-937; clean own formats cap about 1.7K [PRIOR video-platforms].
- 09-30 queue (Postiz, created 23:36-23:39 Oslo 09-29 after the Metricool cap): whistle 12:30, typing 17:30, wifi 19:00, inevitable 21:30 Oslo. posts_log shows 3 rows; ledger says 4 queued. Metricool copies switched to drafts. Enforcer: "tiktok: 4 posts today (plan: 1 native + 1 auto; soft ceiling 3)".
- Picture band as % of the 1080x1920 frame (t=4 s, threshold non-white): whistle 32%, inevitable 25% (also narrower than full width), wifi 46%, typing 100% (full-bleed card). Frames viewed by me.
- TikTok native day 1 (09-29 17:30): assistant 21:58 Oslo "It didn't go out, so day 1 of the test is unrecorded".

### 2.5 Snapchat
- Public profile 09-30 01:42 Oslo: created 09-28 17:24 Oslo, last update 09-29 17:00 Oslo, hasStory:false, 9 Spotlight highlight stubs with empty snapList/uploadDate/viewCount 0. For @goalglobal2 (100,600 subs) and @footballgossips (14,200) the same JSON carries real subscriberCount and per-Spotlight views; @football.benj (568 followers per snapchat_study) shows subscriberCount 0 and 0/-1 placeholders on the newest, so ours is unreadable, not proven zero.
- POSTING_LEDGER 09-30 01:38: snapchat posted 0, queued 0. posts_log Snapchat rows: 16, all 09-28; 8 of them at 00:55-01:00 Oslo on 09-29 (5 minutes).
- Plan bars: A_GRADE 4 Spotlights/day + 1-2 Stories; PLATFORM_PLANS sprint 5-8/day; OneUp trial ends ~10-05, decision 10-04; Insights screenshots owed 10-01.
- Reel factory brief specified "white plate, video centred" (recaption.mjs); snapchat_study lists letterboxed/poorly reformatted video as ineligible for recommendation.

### 2.6 Telegram / WhatsApp
- t.me/s/shithouseryhq: 3 subscribers; 16 items (2 service, 14 posts); every post 2 views; channel created 09-28 17:59 Oslo; last post 09-29 13:33 Oslo. No duplicates on the channel.
- Bio links (Telegram, WhatsApp, Snapchat) went live on X and Threads about 09-28 21:50 Oslo (transcript). X profile visits about 100/day (2.8K/28 d) is the ceiling of X-bio cross-promo.
- tg_queue.jsonl: 5 unsent items for 09-30 (12:40, 13:30, 17:40, 19:10, 21:40 Oslo). Runner: `node social/tg.mjs run --every 30` (pid 17054, started 19:35 Oslo). pmset: sleep prevented by powerd "Claude" assertion. verify.mjs does not read Telegram.
- Migration cost: transcript 09-29 16:21-16:44 Oslo, about 12 assistant messages plus Alex's copy/paste incident (token pasted into a Terminal tab, assistant: treat as exposed).
- WhatsApp: 2 logged posts (09-28, Chrome hack in Alex's personal WhatsApp), no count instrument; small-platforms audit says park.

## 3. WHERE PLANS CLAIM WHAT DATA DOES NOT SUPPORT
| claim | where | what data says |
|---|---|---|
| Alex hand-posts 4-6 X originals/day, ZERO Postiz for earning posts | A_GRADE §1, §9; POSTING_LEDGER "4-6 by Alex" | Alex 09-29 12:38 Oslo ("I won't always be able ... flights, vacation ... a lecture") and 22:20 Oslo ("i can not be asked posting") say he will not; 11/13 X rows API; hand posts not logged so the KPI cannot be measured |
| X lever = SPEED + 25 replies/day | PLATFORM_PLANS | 3 posts at +4/+5/+20 min = about 1K; replies 0 since 09-28 13:40 |
| X net >= +60/day by 10-13 | A_GRADE §1 | +10/day now; best single-day gross was about 75 on a 545K post (09-02) |
| profile visits >= 0.2% of impressions | A_GRADE §1 | no benchmark anywhere in the repo; unverified target |
| OCR first payout 10-09 as the money lever | A_GRADE, dashboard | old program paid $47/week avg, $0 in the last 6 weeks; rate unpublished |
| X kill "<300 views after 6h" | PLATFORM_PLANS | Daily #1 was deleted at +1 h; Threads copy later 68.6K |
| TikTok control = 1 auto/day | A_GRADE, brief, video-platforms "cut to 1/day" | 4 queued 09-30 (3 with MacLeod credit lines, 2 end in 😭) |
| TikTok A: >=2 of 7 >5K and +60 followers | A_GRADE | 0/43 >10K since 09-20; -6 in 3 days; day 1 not done |
| Snapchat 4-8 Spotlights/day | A_GRADE, PLATFORM_PLANS | 0 queued; last batch 09-29 01:00 |
| Telegram/WhatsApp/Snapchat = "zero-minute mirrors" | A_GRADE | Snapchat = Chrome-driven OneUp; Telegram = local runner + manual queue; WhatsApp = Chrome file-input hack |
| Telegram 10-15/day; 1K subs by mid-Dec (audit P50 GUESS) | PLATFORM_PLANS, small-platforms | 3 subs; +1 in 28 h with two 40K+ bios linking |
| Goal 1M binding | 3 scheduled-task prompts | Alex dropped it 09-29 (memory project_goal_reframe) |
| PM grades every platform vs PLATFORM_PLANS | shq-project-manager SKILL.md line 34 | A_GRADE_PLAN says it wins on conflict |

## 4. DECISION RULES I RECOMMEND (dates)
- 10-01: Metricool: post one test after the quota reset; do not cancel Postiz before this passes. Alex: ONE screenshot set (X Analytics 7 d + TikTok analytics + Snapchat Spotlight list with views).
- 10-03: Snapchat go/no-go moved up from 10-04: KEEP only if median of the >=48 h-old Spotlights >= 3K views or any >= 50K or followers >= 300 with a full-bleed batch; otherwise drop OneUp at trial end (avoid the ~10-05 charge).
- 10-08: TikTok read on the first 7 ACTUAL native posts (clock restarts at the first real post); pre-register: <2 of 7 >5K or net <= +20 -> mirror-only forever.
- 10-09: X payout read. <$30 (rolls over) -> X is a reach channel, stop all OCR-driven behaviour. >= $100 for the fortnight -> run one 7-day hand-vs-API comparison on the top post/day.
- 10-13: Telegram <40 subs -> stop the CTA, keep nothing scheduled. X: replace "+60/day" with ">=1 post >=100K per fortnight".

## 5. DATA GAPS
X impressions per post for 09-29/30 (no API; Alex Analytics only); Alex's X hand-post count/times (unlogged); TikTok per-post views after 09-28 (Metricool not available to me, public page has no list); Snapchat views/followers (Insights only); WhatsApp followers; Telegram joins/leaves; TikTok Business vs Personal (public JSON shows commerceUser:false, meaning unverified); Metricool plan/price, Postiz billing/renewal, OneUp card + trial end (all still owed by Alex); whether X counts API/scheduler posts as "automated means" (X does not say).
