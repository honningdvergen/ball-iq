# AUDIT 2026-09-30 (RE-RUN, 10:55-11:20 Oslo) — X, TikTok, Snapchat, Telegram, WhatsApp

Auditor "x_tt_snap_tg", READ-ONLY. This file EXTENDS and CORRECTS the earlier 01:55 draft `x_tt_snap_tg.md` (not overwritten, per the no-overwrite rule). Where the two disagree, this file wins; section 7 lists every correction.
Tags: [MEASURED] read by me today from a named source. [PRIOR] measured by an earlier audit/log and re-used. [INFERRED] reasoned from measured inputs. [GUESS] no instrument.
Nothing posted, queued, scheduled, deleted or edited anywhere. No pz/postiz/tg.mjs/enforce/review verdict/verify cancel/Metricool writes. No browser automation; no logged-in account touched. I had NO Metricool tools in this session (only Read/Bash/Web*), so no Metricool analytics.

## 0. VERDICT (read this)
1. None of the five earns money now. Only X moves followers (~+10/day, exact count today 45,311). TikTok is flat (16,207, +1 in 3 days; the earlier "-6" was a rounding artefact). Telegram 3 subscribers. Snapchat and WhatsApp counts are unreadable.
2. They still absorbed 42% of posts_log rows and 45% of unique captions (60 of 133) since 09-28, for roughly 6% of net follower growth (X ~+10 of ~+170/day, strategy.md).
3. X is a human-judgement hit lottery: 7 posts >=100K impressions in the 4 weeks to 09-29 (4 of 4 weeks had one), 4.744M of 5.3M impressions (89.5%) from 11 posts, every one of them human-posted. The Postiz X lane has 13 logged posts and none above ~1.3K (4 measured, 7 unmeasured, 2 Chrome). Lane and content are confounded; nobody can say the lane is the cause.
4. X follower yield is the worst of any engine: the 1.4M-impression day of 09-25 netted +35 followers (+47/-12) = 0.25 per 10K impressions. X is for reach, brand and (maybe) money, not followers.
5. X money is small: old revenue share $1,311.08 over 28 weeks ($46.8/wk), then three periods "below minimum" while X was doing ~3.5M views/28d. OCR shows $0.00, first payout 10-09, X publishes no rate.
6. TikTok, measured today on 45 public videos (09-20 23:21 to 09-29 09:32, 8.4 days): 40,951 views total (4.9K/day), median 591, 2 videos >5K, ~0 net followers. The two >5K were same-day news-moment clips; our own template never exceeded 1,700. Median of the first 22 posts 929, of the last 23 427; the six posts of 09-29 (00:09-09:32 overnight drip) 276-503, median 298.
7. The TikTok native test is untested, not failed: day 1 never happened; 4 auto videos are queued for 09-30 (plan: 1 control), 3 of 4 carry Kevin MacLeod credit lines, and the pass bar (>=2 of 7 >5K AND +60 followers) has ~3.6% probability at the observed base rate.
8. Snapchat is unknowable from our instruments (OneUp queue unreadable; ledger 0/0 is an artefact). Public profile last updated 09-29 17:00:46 Oslo (18 h ago), which fits the 8-row batch draining into OneUp's 10 daily slots. OneUp $25/mo from ~10-05; monetisation needs 50K followers (Snap newsroom 2024-12-16).
9. Telegram: 3 subs, all 14 posts show 2 views, last post 09-29 13:33 Oslo (21.5 h ago), i.e. nothing went out after the local-runner migration at 19:35. Revenue share needs 1,000 subscribers (Telegram blog 2024-03-31). WhatsApp: no public count, 0 posts since 09-28 23:59, parked.
10. Smallest set worth keeping: X (Alex ~5 min/day batch, hit-day speed lane by whichever hands are free, Postiz mirror capped), TikTok (1/day mirror at a daytime slot + native test re-scoped to 4 posts), Snapchat (decision moved to 10-03, default drop), Telegram (bio-link target, no scheduled volume, kill 10-13), WhatsApp (park).

## 1. COMMANDS / SOURCES (all read-only)
- Files: A_GRADE_PLAN.md, PLATFORM_PLANS.md, TEAM.md, HANDOFF.md, manual_metrics.json, scheduler_status.json, tg_queue.jsonl, deleted.md, replies.md, reply_protocol.md, matchnight_2026-09-29_x_lines.md, tiktok_native_test_brief.md, pm/{DASHBOARD,POSTING_LEDGER,ACCOUNTABILITY,board,format_portfolio,grades_2026-09-29}.md, pm/ENFORCEMENT_LOG.md (tail), posts_log.jsonl (189 rows), review/verdicts.jsonl (130), insights/followers.csv, audit_2026-09-29/{x_winners_study,x_study_interim,tiktok_winners_study,snapchat_study,small-platforms,since-friday}.md, research/{x_own_top_2026,x_ocr_and_replies_2026_09}.md, other 09-30 audits (business, quality, speed, saydo, ops, strategy, threads) for cross-checks, memory files (goal_reframe, x_and_bluesky, tiktok_*, snapchat_whatsapp, oneup_recipes, x_original_content_rewards), scheduled-tasks/*/SKILL.md (grep for "binding" and PLATFORM_PLANS).
- Session transcript 71fad5c5...jsonl: Alex's messages 09-28 -> 09-30 10:53 (UTC+2 conversion), specific greps for "Everton were deducted", "win all 33", x.com Chrome navigations, "583".
- `curl https://t.me/s/shithouseryhq` (subscriber counter, per-post views, timestamps) 10:55.
- `curl https://www.tiktok.com/@shithouseryhq` and parse __UNIVERSAL_DATA_FOR_REHYDRATION__ (stats vs statsV2, bio, commerceUser).
- `yt-dlp --flat-playlist --playlist-end 45 -J https://www.tiktok.com/@shithouseryhq` (public per-video views/likes/reposts) 10:58. Table: x_tt_snap_tg_rerun_tiktok45.tsv.
- `curl https://www.snapchat.com/@shithouseryhq` (__NEXT_DATA__: subscriberCount, hasStory, timestamps, 9 Spotlight stubs).
- `curl https://cdn.syndication.twimg.com/tweet-result?id=<id>` for 9 of our tweet IDs (likes/replies only) and `syndication.twitter.com/srv/timeline-profile/screen-name/ShithouseryHQ` (user object: followers_count 45,311, bio, is_blue_verified).
- WebFetch: whatsapp.com channel page (no count), newsroom.snap.com (monetisation bar), telegram.org/blog/monetization-for-channels. WebSearch: X OCR rate, Snap requirements, WhatsApp monetisation.
- ffmpeg cropdetect on the 4 queued TikTok videos (picture area vs white plate).
- ps/uptime/pmset: tg.mjs runner pid 17054 alive since 19:35; enforce.mjs restarted 10:56; Mac up 3 days, no sleep.

## 2. X

### 2.1 Measured
| item | value | source |
|---|---|---|
| followers | 45,311 (exact); 45.2K on 09-23; 45.3K on 09-29 | syndication user object 09-30 ~11:05 (cache freshness unknown); memory 09-23; manual_metrics 09-29 |
| 4-week impressions to 09-29 | 5.3M; engagements 228K; ER 4.2%; profile visits 2.8K (0.05%) | manual_metrics / x_study_interim (Alex's screenshots) [PRIOR] |
| top 11 posts | 1.4M+781K+733K+545K+380K+365K+345K+83K+55K+40K+17K = 4.744M = 89.5% of 5.3M | x_winners_study (re-added by me) |
| posts >=100K impressions | 7 in 4 weeks; one in each of the 4 weeks (09-02 545K, 09-04 365K, 09-12 781K+733K, 09-16 345K, 09-24 380K, 09-25 1.4M). None since 09-25 (5 days) | x_winners_study |
| follow spikes | 09-25: +47 gross / -12 unfollows on 1.4M impressions = +35 net = 0.25 per 10K impressions; 09-02 ~+75 gross; ~09-14 ~+65; unfollows 10-15/day | x_study_interim (Alex's follows chart) |
| Ball IQ effect of the 09-25 hit | 69 web visitors and 2 signups that day | business.md 1.3 [PRIOR] |
| Postiz X lane | 11 rows via postiz + 2 via chrome in posts_log; measured: Snapchat-promo 972 (Chrome), Italy 1,300, Belgium 1,000, Sweden 1,000 (manual reads 09-29 11:36); X median 900-1,000 | posts_log metrics, quality.md 3.4 |
| same lines on Threads | Italy 16,574, Belgium 11,457, Sweden 1,344 | quality.md [PRIOR] |
| latency of those lines | +4 / +5 / +20 min after the event | posts_log broke->at |
| Yamal repost (published 09-30 00:06 Oslo) | 36 likes, 1 reply ~11 h later; first (deleted) version 19 likes | syndication tweet-result 09-30 |
| 684 post (Alex-posted 09-25 16:32:47 Oslo, 51 min after the Ornstein scoop) | 77,810 likes, 5,560 RT, 203 replies; the tweet 26 min earlier ("Pep knew City were doomed the cheaters") got 28 likes | syndication tweet-result; transcript 09-25 16:28-16:35 ("Your X post: ..."), 18:28 Alex "i added the photo on x" |
| Spurs-33 card (380K impressions) | first seen pinned, created 2026-09-24 09:01:37Z (11:01 Oslo), BEFORE the first Postiz X slot that day (11:30Z) -> appears hand-posted [INFERRED] | transcript 09-24 12:56-13:36 |
| bio | "Football News, Commentary & Banter / Snapchat: shithouseryhq / Telegram: t.me/shithouseryhq / WhatsApp: balliq.app/wa / Test your Ball IQ"; profile URL field = balliq.app; is_blue_verified true | syndication user object |
| revenue | old revenue share 2026 itemised: 44.97+151.07+118.65+128.43+81.25+413.17+84.95+33.57+138.63+116.39 = $1,311.08 (Jan 17 -> Aug 1, 28 wks = $46.8/wk); Jul 31 -> Sep 11 three periods "below minimum"; the Jul 4-18 fortnight, which held four posts of 3.9M+4.5M+1.7M+1.6M impressions (x_own_top_2026), paid $138.63 | memory reference_x_original_content_rewards; business.md; x_own_top_2026 |
| OCR | active, $0.00, next payout 10-09; X publishes no per-impression rate; only Home-Timeline impressions from Premium viewers count; content "posted using automated means" ineligible; Whether a scheduler/API counts is not stated | memory 09-29; research/x_ocr_and_replies; WebSearch 09-30 |

### 2.2 The plan vs what happened
- A_GRADE §1/§2.6/§9: "Alex hand-posts 4-6/day, ZERO Chrome/script/Postiz activity on x.com for earning posts". Alex 09-29 12:38: "I won't always be able to ... flights ... a lecture". Alex 09-29 16:23: "you should be able to post to x also, it uses x api surely it is no concern?". Alex 09-29 22:20: "i suggest you post on x, i can not be asked posting, we have several schedulers, i do not care about the risk." Result: 11 of 13 X rows Postiz. POSTING_LEDGER.md (10:56 today) still prints "x | 4-6 by Alex". Alex's own phone posts are not logged (postlog), so the KPI cannot be measured either way.
- 11 match-night lines were sent to Alex 20:49-22:28 on 09-29; the transcript shows no reply before 22:20 and then the instruction above; the only in-game X post was the Yamal line via Postiz 22:40 (+32 min after the goal), and it carried our own tweet card.
- A_GRADE §10 (image must be bare photo) was written AFTER the Yamal defect; the underlying rule (no tweet screenshots on X) was stored 09-24 (memory feedback_x_no_tweet_screenshots).
- Daily Number #1: X copy deleted by Alex ~14:30 on 09-29 (deleted.md: stale-news premise, Threads copy 1,483 views/3 likes at +1 h). The Threads copy now stands at 170,167 views (DASHBOARD.md 10:54 today). The X outcome is unknowable. The "STALE-NEWS TEST" in the critic was created from this one deletion.
- Replies: PLATFORM_PLANS says 25/day, A_GRADE says Alex hand-replies 20/day. replies.md holds 18 X replies on 09-27/28 (typed by JavaScript into x.com in Claude-in-Chrome per HANDOFF.md line 8), none since 09-28 13:40. No measured effect.
- Chrome on x.com after the rule: memory project_goal_reframe (written 09-29 12:39) says "NO Claude-in-Chrome posting/replying/scraping on x.com". Claude-in-Chrome `navigate` to x.com/search (min_faves) happened at 09-29 12:24 (15 min BEFORE the rule) and again at 09-29 23:16 (AFTER it; speed.md flagged the same). Read-only scraping through the logged-in account, but scraping is what the memory rule names.

### 2.3 Inference (labelled)
- [INFERRED] The Postiz lane is not suppressed: its four measured posts land at 0.97-1.4x the account median. It is a median-level lane. What it lacks is hits, and hits have been human-picked moments plus a mega story.
- [INFERRED] Hand vs API cannot be separated: 7 human-posted hits vs 0 of 13 API posts, but the API posts were 3-line maths and label posts on ordinary nights, the hits were image jokes or mega-story cards. Only a like-for-like comparison would tell, and none has been logged.
- [INFERRED] Realistic X value at this size: reach and brand plus 0-$100/month. If OCR paid the creator-reported old-program rate ($8-12 per 1M impressions, creator-reported, not official) on 5.3M impressions it would be ~$42-64 per 4 weeks, and only Premium-viewer impressions count, so lower.

## 3. TIKTOK (measured today)
### 3.1 Account
followerCount 16,200 in stats (rounded) and 16,207 in statsV2 (exact); hearts 257,462; videoCount 338; following 44; commerceUser false; bio "Follow us on Instagram @ShothouseryHQ" (misspelt handle, should be Shithousery); bioLink balliq.app. Followers: 16,213 (~09-24, since-friday) -> 16,208 (09-28 Metricool, HANDOFF) -> 16,206 (09-27 Alex screenshot) -> 16,207 (09-30). Flat within +-7 for a week.
### 3.2 The 45 public videos (full table in x_tt_snap_tg_rerun_tiktok45.tsv)
- n=45, span 09-20 23:21 -> 09-29 09:32 (8.4 days, 5.3 posts/day). Views: total 40,951 (4.9K/day), median 591, mean 910, max 5,537. >5K: 2 (5,537 "Andros Townsend ... pitch roller", 5,128 "Man City found guilty of 114/115", both 09-25, 44 and 62 reposts). >2K: 2. >1K: 11 (24%). Top 2 = 26% of all views. Third best 1,700 (09-22 "sunderland fans singing ... at haaland").
- Likes 2,260 (5.5% of views), reposts (shares) 249 = 61 per 10K views. The four videos with >=20 reposts are the four best-shared (1,028 / 5,128 / 5,537 / 1,496 views).
- By era: first 22 posts (09-20 -> 09-23) median 929; last 23 (09-24 -> 09-29) median 427. Daily medians: 09-21 795, 09-22 925, 09-23 937, 09-24 544, 09-25 2,860 (the two hits), 09-26 809, 09-27 344, 09-28 395, 09-29 298 (n=6).
- The 09-29 overnight drip: 00:09 302, 03:31 276, 05:02 316, 06:32 294, 08:03 293, 09:32 503. Metricool's own read (quality.md) agrees (273-393).
- By Oslo hour band: 00-09 n=8 median 309; 10-15 n=15 809; 16-19 n=10 713; 20-23 n=12 765. CONFOUNDED with age (the 10 posts <=72 h old have median 318, older 882) and with the era shift; the two older overnight posts (09-21 00:40 = 933, 09-25 00:15 = 591) sit at the era median, so I cannot separate an overnight effect from the era/age effect.
- Posts with a MacLeod credit line n=4 median 402; without n=41 median 715. Posts with hashtags n=9 median 1,027; without n=36 median 545. Tiny samples; the hashtag ones are the older posts (era confound). Do not act on either.
- Sound: 41 of 45 videos carry "original sound" credited to Shithousery HQ (our royalty-free music baked into the file); 4 used another creator's audio: 09-25 17:08 "City found guilty" (FIFA SONGS original sound) 5,128 views; 09-25 17:04 ("som original") 281; 09-26 23:55 ("biting bullets", a library sound) 427; 09-28 11:01 (FIFA SONGS) 320. So the trending-sound premise of the native test has exactly one library-sound observation in our own history (427, below the 591 median; n=1), and the auto lane never uses trending sound.
### 3.3 The 09-30 queue and the test
- 4 videos queued in Postiz for 09-30: whistle 12:30, typing 17:30, wifi 19:00, inevitable 21:30 Oslo (posts_log rows created 01:36 and 02:35). tg_queue holds the same four for Telegram. Enforcer log: "tiktok: 4 posts today (plan: 1 native + 1 auto; soft ceiling 3)".
- Captions: 3 of 4 carry "Kevin MacLeod (incompetech.com), CC BY 4.0" credit lines, 2 of 4 end in the 😭. The brief (tiktok_native_test_brief.md) says control = plain caption, no music-credit line. Note: CC BY 4.0 requires attribution, so the plain-caption rule conflicts with the music license unless the track is swapped [INFERRED from the license name].
- Picture area vs the 1080x1920 frame at t=4 s (ffmpeg negate+cropdetect, limit 40): whistle 740x680 = 24%; wifi 1080x1072 = 56%; typing 1080x1920 = 100% (full-bleed card); inevitable 880x600 = 25%. The 01:55 draft reported 32/46/100/25 with a different threshold; the conclusion (3 of 4 are mostly white plate) holds either way.
- 17:30 auto slot ("typing") collides with the brief's native slot (17:30). Native day 1 (09-29 17:30) never happened (assistant 21:58: "It didn't go out, so day 1 of the test is unrecorded"). The scoreboard in the brief is empty.
- Rule conflict: playbook 09-25 ("TikTok posts go to Alex's drafts inbox, UPLOAD, never DIRECT_POST") vs the Metricool lane, which posted six videos directly 09-29 00:09-09:32 (public list).
- Bar: A_GRADE says A on 10-06 = >=2 of 7 native posts >5K AND >=+60 followers. Base rate 2 of 45 (4.4%) gives P(>=2 of 7) = 3.6% (strategy.md computed 3.9% on 2 of 43). Followers gained in the last 8 days with 45 posts: ~0. So the +60 half of the bar is the binding one.
- Money: TikTok rewards N/A (Norway, memory captain mandate 09-29). Alex 09-23: TikTok is "an imperative platform for growth and overall brand building" (memory feedback_tiktok_ineligible_reposts).

## 4. SNAPCHAT
- posts_log: 16 rows (14 OneUp, 1 Chrome, 1 Alex phone), all logged 09-28 17:35 -> 09-29 01:00 Oslo; 8 of them within 5 minutes (00:55-01:00).
- Public profile 09-30 ~11:00: created 09-28 17:24 Oslo; lastUpdateTimestamp 09-29 17:00:46 Oslo; hasStory false; hasSpotlightHighlights true with 9 stubs, all empty (snapList [], no views); subscriberCount "0" which is a placeholder (a known 568-follower account also shows 0 and known bigger accounts show real numbers in the same JSON, per the 01:55 read).
- OneUp: 10 daily slots for Snapchat (08:00 09:30 11:00 12:30 14:00 15:30 17:00 18:30 20:00 21:30, memory), queue unreadable (no API), posts_log has no scheduledFor for OneUp rows, so the ledger prints "snapchat 0 posted / 0 queued" whether or not anything is queued.
- [INFERRED, medium] 8 rows at ~01:00 = 1 posted now + 7 queued into 08:00-17:00; the last slot is 17:00 which equals the public lastUpdate 17:00:46. So the queue drained yesterday at 17:00 and nothing has been added since (no posts_log row after 01:00). It would have been 18 h idle at 11:05 today.
- Plan bars: A_GRADE 4 Spotlights/day (12:00, 17:30, 20:30, 22:45) + 1-2 Stories; PLATFORM_PLANS sprint 5-8/day, "OneUp full-use week" (7 days), "50K in a week, life or death" (Alex 09-28 20:12). Snap's own bar: 50K followers, 25 posts/month, 10 of 28 days, plus one of 10M Snap views / 1M Spotlight views / 12,000 view-hours (Snap newsroom 2024-12-16; a search summary of Snap support says 15,000 hours with 3,000 from Spotlight and >=100 Spotlight hours from 2026-05-07: single source, unverified).
- Cost: OneUp $25/mo from ~10-05 (trial), decision 10-04 (memory). Effort: 54 critic verdicts primary-labelled Snapchat (26 PASS / 28 FAIL), but 40 of them were shared reel-factory drafts also aimed at IG/FB/TikTok/YT/Telegram, 14 snapchat-only; Chrome recipe ~3 tool calls per reel.
- Data needed to decide: per-Spotlight views/followers from Snap Insights, which only Alex can screenshot (owed 10-01 per manual_metrics, snapchat_study §7).

## 5. TELEGRAM and WHATSAPP
- t.me/s/shithouseryhq 10:55: 3 subscribers; media counters 6 photos, 8 videos, 4 links; 14 posts each showing 2 views; last post 2026-09-29T11:33Z (13:33 Oslo), 21.5 h ago. Subscribers: 2 at 09-28 21:30 and 09-29 11:57/14:42, 3 now = +1 in ~28 h with 45K X and 42K Threads bios linking (X profile visits ~100/day).
- Postiz Telegram integration deleted 09-29 19:35; local runner `node social/tg.mjs run --every 30` (pid 17054, since 19:35) is alive; tg_queue.jsonl holds 5 unsent items for 09-30 (12:40, 13:30, 17:40, 19:10, 21:40 Oslo). Runner depends on Alex's Mac being awake (uptime 3 days, no sleeps). verify.mjs does not read Telegram.
- Migration cost: ~11 Alex messages between 16:27 and 16:46 on 09-29 (BotFather steps, token pasted into a Terminal tab where the assistant could read it, "did not work", "just keep the token"); ops.md logs ~20 min plus ~30 min to build tg.mjs. Alex declined to revoke the exposed token.
- Bar: 1,000 subscribers for the 50% ad-revenue share (Telegram blog 2024-03-31); entertainment ~$1 per 1K views (secondary web summary, unverified). At 2 views/post that is nothing.
- Comparable: Troll Football 145K subs, last 15 posts 18.2K-32.7K views (small-platforms.md 09-29 read) — the channel we were told to copy ("10 a day like Troll Football") has 48,000x our subscribers.
- WhatsApp: whatsapp.com/channel page shows no follower count (WebFetch 09-30). 2 logged posts (09-28, Chrome hack in Alex's personal WhatsApp Web), none since 09-28 23:59. PLATFORM_PLANS still says 3/day. Public monetisation: paid channel subscriptions in a few countries, promoted channels; no eligibility I could verify (WebSearch 09-30).

## 6. EFFORT vs OUTCOME vs ALEX'S HANDS
| platform | posts_log rows / unique captions (09-28 -> 09-30) | net followers/day now | money | Alex's hands asked by the plan | verdict |
|---|---|---|---|---|---|
| X | 13 / 11 | ~+10 | $0 OCR so far; old $47/wk | 4-6 posts/day + 20 replies/day + Analytics screenshots | keep, re-scope |
| TikTok | 23 / 13 (posts_log double-logs Metricool mirrors; 8 actually published 09-28/29 + 4 queued) | ~0 | none (Norway) | native video/day + analytics screenshots | keep as mirror + shrunk test |
| Snapchat | 16 / 15 | unreadable | none (bar 50K) | Insights screenshots x3; phone posts earlier | decide 10-03, default drop |
| Telegram | 25 / 19 | +1 in 28 h | none (bar 1,000) | token/BotFather loop once | bio-link target only |
| WhatsApp | 2 / 2 | unreadable | none verifiable | QR scan once | park |
| my five total | 79 / 60 of 189 / 133 (42% / 45%) | ~+10 of ~+170 total | ~$0 | X + TikTok + screenshots | |
Critic effort: 92 of 130 verdicts (71%) are primary-labelled to my five, but 40 of the 54 Snapchat-primary drafts were shared with IG/FB/TikTok/YT/Telegram, and only 34 verdicts (26%) list ONLY my five platforms. strategy.md's 71% therefore over-attributes; the honest range is 26-71%. What is measured either way: verdicts on 09-28 were Snapchat 54 / X 14 / Threads 3 while Threads produced ~77% of net follows.

## 7. CORRECTIONS TO THE 01:55 DRAFT AND TO OTHER AUDITS
1. TikTok "-6 in 3 days (16,206 -> 16,200)" is wrong: 16,200 is the rounded `stats.followerCount`; exact `statsV2` is 16,207 (+1). strategy.md lines 38 and 88 quote the -6; correct them.
2. TikTok since-09-20 count: the 09-29 study says "three passed 5K" (it counted De Zerbi 13.7K from 09-19, outside the window). In-window there are two (5,537 and 5,128).
3. Snapchat: the ledger's "0 posted / 0 queued" is an artefact of unlogged OneUp times, not a fact. The public profile timestamp suggests idle since 09-29 17:00.
4. business.md 1.4 says X has no documented Ball IQ link: the X profile URL field is balliq.app and the bio ends "Test your Ball IQ" (syndication payload 09-30). The three cross-promo lines above it are the diluted part.
5. strategy.md "71% of critic effort" over-attributes (see section 6).
6. 01:55 draft said "0 X rows from Alex's phone": that is a logging gap, not evidence Alex posted nothing.
7. 01:55 draft "Daily Number #1 Threads 68,637": now 170,167 (dashboard 10:54).

## 8. DECISION RULES (dates; every rule has a named reader)
- Today 12:35 / 12:45: read the TikTok public list (yt-dlp, free) and t.me/s to see whether "whistle" (12:30) and the Telegram 12:40 item actually published. Reader: Editor. This is the missing publish check for two platforms.
- 10-01 (Alex, one 10-minute session): X Analytics Content top 10 for 7 d + Followers; TikTok analytics 7 d (followers gained, traffic source); Snapchat Spotlight list with views and follower count. Nothing else asked.
- 10-02 Friday weekly review: apply rules below; remove X "+300/day" and TikTok "+200/day" from PLATFORM_PLANS and the three "1,000,000 binding" lines from the scheduled prompts.
- 10-03: Snapchat go/no-go (moved up from 10-04 so cancelling lands before the ~10-05 charge). Keep only if the plan's own bars are met on Alex's screenshots (>=1,000 followers, or 2 Spotlights >=50K, or >=10 follows per 10K Spotlight views). Otherwise cancel OneUp. Default = drop.
- 10-06 or 8 days after the first real native post: TikTok native test on the first 4 native posts: keep if >=1 of 4 >=5K OR median >=1.2K (2x the auto median 591); else mirror-only and stop asking Alex. [judgement, not from a source]
- 10-09: X payout read. <$30 (rolls over): X is a reach channel, stop all OCR-driven behaviour. >=$100 for the fortnight: run one 7-day hand-vs-API comparison on the top post/day.
- 10-13: Telegram <40 subs -> stop the CTA and remove the link; keep nothing scheduled. X: replace "+60/day" with ">=1 post >=100K per fortnight" (the 4-week record shows it is hittable).

## 9. DATA GAPS
X impressions per post since 09-26 (no API; Alex only) and Alex's hand-post count/times (unlogged); TikTok per-post follows, watch time, traffic source (Metricool tools unavailable to me; public list has none); Snapchat views/followers (Insights only; OneUp queue unreadable); WhatsApp followers; Telegram joins/leaves and who the 3 subscribers are; TikTok Business vs Personal (public JSON commerceUser:false is unverified as a proxy); OCR rate and whether X counts scheduler/API posts as automated; Metricool plan/price and Postiz renewal (still owed by Alex); whether the 09-30 12:30+ Postiz TikTok slots publish (Postiz billing/quota state unknown).
