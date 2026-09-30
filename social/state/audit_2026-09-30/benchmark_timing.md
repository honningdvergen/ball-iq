# Timing benchmark, City verdict day (09-29) and the 09-25 leak night

Written 2026-09-30 ~02:30 Oslo. Read-only run. All clock times are UTC unless marked Oslo (Oslo = UTC+2). Samples are small (12 posts per account, 13 accounts, one evening), so read every number as "what happened in this sample", not as a law.

## 0. The five things that matter

1. **The story did not break at 19:30 UTC. The Premier League statement was out at about 16:05 UTC (18:05 Oslo).** Guardian first-published 16:05:21Z, BBC 16:07Z, Goal 16:22Z. Our IG carousel went live at 22:27:05Z, so the real lag was **6h22m**, not the ~3h the "broke: 21:30" field in posts_log implies. All nine competitor verdict posts I found were published before 19:30Z (the latest at 19:24Z), which is impossible if that were the break time.
2. **Four separate watchers were blind for the whole window and the draft did not start until 21:24Z (5h19m after the statement).** Floor check #7 (18:20 Oslo, 15 minutes after the statement) wrote "Nothing live that matters". The 18:31 Oslo trend sweep wrote "Nothing else fresh". The 10-minute enforcer logged "0 new" on every tick from 18:03 to 21:35 Oslo (22 ticks; it has no missed-story rule, so it could not see this). `breaking.mjs` was not running (its state file was last written 09-28 22:50Z).
3. **We are fast when the moment is on a schedule or a human is in the loop, and slow when it is not.** Full time of the 18:45Z games: our posts landed 3 to 13 minutes later (X, IG, Threads, FB). Leak night 09-25: our first posts were +24 and +25 minutes, faster than every competitor I can see (+61 minutes was the earliest). Statement: +175 (Threads, different angle) and +382 (IG).
4. **"Earlier gets more likes" is only weakly supported inside one story.** Across accounts the rank correlation of lag vs likes-relative-to-own-median is -0.38 (statement story, n=9) and +0.36 (leak story, n=10). The best posts of the leak story landed 3 to 45 hours in. Speed gets you into the story. Staying in it (Part 1 to Part 4 series, several posts over three days) is what the winners did.
5. **Volume and hour-of-day are not the problem. Where the volume sat on 09-29 is.** We posted 11 IG items on 09-29 (more than any competitor's 10), but 4 were before 09:00 Oslo and none between 14:52 and 22:41 Oslo, the window in which 27 of the 42 competitor posts of the day went out.

## 1. When did the verdict actually land? (premise check)

| Source | Time UTC | What it is |
|---|---|---|
| Guardian article metadata | 16:05:21 | first published (`article:published_time`), verdict article |
| BBC Sport | 16:07:15 | "Premier League confirms club guilty..." (Exa `Published`) |
| Goal.com | 16:22:00 | "Breaking: Premier League officially announces..." |
| footballtransfers.com | 16:44 (17:44 BST) | article timestamp |
| anfieldcentral IG | 16:46 | first competitor IG post found |

I use **16:05Z** as t0, error bar about plus or minus 5 minutes. The earlier event (The Athletic's Ornstein exclusive) was **about 14:00Z on Fri 09-25** (footballtransfers 14:02Z, CNN 14:08Z, CaughtOffside 14:09Z), so 09-29 was the *official confirmation* of something already known for four days ("the verdict was widely reported last Friday", Independent).

If you want the numbers against the assumed 19:30Z: our IG would be +177 min. Against the real 16:05Z it is +382 min.

## 2. Verdict day: lag of every post I can identify (t0 = 16:05Z)

Likes are from a fresh pull at about 00:10Z, the same snapshot for every account. "x median" is likes divided by that account's median over its last 12 non-pinned posts (hidden-likes rows excluded). Lag is minutes from 16:05Z to `taken_at`.

| Account | Posted UTC (Oslo) | Lag | Type | Likes | Plays | x own median |
|---|---|---|---|---|---|---|
| anfieldcentral | 16:46 (18:46) | +41m | image | 563 | n/a | 1.72 |
| thatguysjokes | 17:09 (19:09) | +64m | carousel, 4 sl | 48,197 | n/a | 1.11 |
| thatguysjokes | 17:29 (19:29) | +84m | reel | 74,096 | 1,223,641 | 1.71 |
| thatguysjokes | 17:52 (19:52) | +107m | reel | 45,216 | 568,233 | 1.04 |
| rivalsbanter ("Part 4") | 18:05 (20:05) | +120m | carousel, 13 sl | 16,958 | n/a | 1.18 |
| thatguysjokes | 18:36 (20:36) | +151m | reel | 24,076 | 326,954 | 0.55 |
| footy.rn | 18:38 (20:38) | +153m | carousel, 7 sl | 9,927 | n/a | 1.02 |
| midnitefootball | 19:13 (21:13) | +188m | reel | 3,019 | 57,876 | 2.19 |
| thatguysjokes | 19:24 (21:24) | +199m | carousel, 4 sl | 41,611 | n/a | 0.96 |
| **shithouseryhq Threads** | 19:00 (21:00) | +175m | image ("informed in July" angle) | 28 | 2,523 views | n/a |
| **shithouseryhq IG** | 22:27 (00:27) | **+382m** | carousel | 66 | 1,204 views | n/a |

Rows come from `timing_competitor_pull_2026-09-30.json` (this folder) plus `competitor_sweep_2026-09-29.json`; ours from `quality_data/ig_threads_pull_17d_2026-09-30.json`. Our likes and their likes are not on the same scale (our IG median is about 6.5K views on feed posts), so compare lags, not likes.

- **Only 5 of 13 accounts posted about the statement that I can identify** (thatguysjokes, anfieldcentral, rivalsbanter, footy.rn, midnitefootball). The other 8 had no post whose caption starts on the verdict. Limits: I only see the first 60 to 110 characters of each caption and did not read carousel slides; four posts are ambiguous (simptv 17:41 and 20:10, thatguysjokes 20:30 and 21:07) and are excluded.
- **First-post lag among the five: +41, +64, +120, +153, +188 min. Median +120 min.** Only 3 posts from 2 accounts landed inside 90 minutes (anfieldcentral, thatguysjokes x2).
- **We ranked last of the six accounts on IG** (+382 vs +188 for the next slowest).
- thatguysjokes was already in the story before the statement: City posts at 09-28 17:31 ("Sacrificed his life to expose Man City") and 20:07 ("2 year transfer ban"), 09-29 09:26, 13:28 and 15:15. Their statement-day posts were the fifth to ninth in a run, not a cold start.

## 3. Leak night (09-25, t0 about 14:00Z): we were the fastest account I can see

| Who | Posted UTC | Lag | Result |
|---|---|---|---|
| **shithouseryhq Threads** | 14:24 | +24m | 446 views |
| **shithouseryhq IG carousel** | 14:25 | +25m | 36,246 views, 1,561 likes, 4 follows |
| **shithouseryhq Threads** ("684 points" maths) | 14:35 | +35m | 259,935 views, 8,279 likes |
| **shithouseryhq IG carousel** | 14:39 | +39m | 17,129 views, 2 follows |
| **shithouseryhq IG carousel** | 16:25 | +145m | 25,075 views, **12 follows** |
| midnitefootball reel | 15:01 | +61m | 1,381 likes, 27,450 plays |
| oddsbible carousel | 15:03 | +63m | 28,407 likes (2.04x own median) |
| footy.rn carousel | 15:11 | +71m | likes hidden |
| thefootballfeeduk carousel | 16:54 | +174m | 22,837 likes (1.32x) |
| oddsbible carousel ("115 memes") | 17:45 | +225m | 73,837 likes (**5.29x**) |
| trollol_epl carousel | 21:34 | +454m | 4,503 likes (1.11x) |
| rivalsbanter Part 1 / 2 / 3 | 09-26 07:24 / 12:02, 09-27 09:03 | +1,044 / +1,322 / +2,583m | 26,695 / 48,320 / 20,381 likes (1.86x / 3.36x / 1.42x) |

Coverage limit: 8 of the 13 accounts have posts on 09-25 in the sample (simptv, midnitefootball, oddsbible, footy.rn, rivalsbanter, trollol_epl, thefootballfeeduk, nonoffsideguy). thatguysjokes, hesaballer, anfieldcentral, ftblmemeshub, itsfootybants do not. An earlier vidIQ note (`research/socialinsider_2026-09-28.md`) says thatguysjokes posted 7 City reels within about 24h of the leak; I have dates but not times, so I cannot rank them. nonoffsideguy had no City post at all.

Same account, same story, different day: the 09-25 IG carousel at +25 min got 36K views and 4 follows, the 09-29 IG carousel at +382 min got 1.2K and 0. Content and story novelty differ (first break vs confirmation of known news), so this is a contrast, not an isolated timing effect.

## 4. Where the 6h22m went (pipeline timeline, UTC)

| UTC (Oslo) | Event | Source |
|---|---|---|
| 09-28 22:50 | last write to `breaking_seen.json`, so `breaking.mjs` last polled here | file mtime, `state/breaking_seen.json` |
| 10:44 | our Threads "Proper punishment for Manchester City" posts (ends at 101,042 views) | `insights/2026-09-29.md` |
| **16:05** | **statement out** | Guardian, BBC, Goal |
| 16:20 (18:20) | floor check #7: "Nothing live that matters" | `pm/floor_2026-09-29.md` line 158 |
| 16:31 to 16:55 (18:31 to 18:55) | PM trend sweep: "Nothing else fresh"; calls the Pochettino/City item "dead unless a fresh beat lands"; WebSearch only; drafted nothing | `sweeps/2026-09-29-pm.md` section 2, 3 |
| 16:03 to 19:35 (18:03 to 21:35) | enforcer ticks every ~10 min: "15 open violation(s), 0 new" (22 consecutive ticks; no rule exists for a missed story) | `pm/ENFORCEMENT_LOG.md` lines 695 to 1046 |
| 17:35 (19:35) | floor check #8: "Nothing live that matters yet" | `pm/floor_2026-09-29.md` line 186 |
| 18:30, 19:45 (20:30, 21:45) | floor checks #9, #10: no mention of the statement (they chase the follow-line pin on the 10:44 post) | same file |
| 19:00 (21:00) | Threads "BREAKING: City were informed in July" posts, 2,523 views (not in posts_log; source unknown) | ig_threads pull |
| 15:00 to 18:57 | **zero drafts of any kind** in `review/drafts` (first draft of the evening is a 18:57 X "Yamal again" draft) | `ls review/drafts` |
| **21:24** | first verdict draft reaches the critic (FAIL 6), PASS 8 at 21:25, FB reel PASS 7 at 21:26 | `review/verdicts.jsonl` lines 128 to 130 |
| 21:27 | queued to Metricool for 23:38 Oslo (21:38Z); the same second, `scheduler_status.json` flips Metricool to "blocked, September quota" | `posts_log.jsonl`, `state/scheduler_status.json` |
| 22:26 to 22:27 | rerouted through Postiz, IG live at 22:27:05 | posts_log, IG API `at` |

Reading it: **detection to first draft = 5h19m; draft to live = 63 min** (of which about 49 minutes is the Metricool block against the planned 21:38Z). The critic was not the bottleneck on this post (FAIL then PASS in one minute). Also, `broke` in posts_log says "21:30" and the story text says "~21:30 Oslo", which is 19:30Z, 3h25m after the real 18:05 Oslo. So the number the team would read as lag was about 3 hours too small.

Suggestive but confounded: floor readings of our 10:44Z Threads City post were <=14.9K at 15:20Z (it was not the best post then), 16.9K at 16:20Z, 19.5K at 16:35Z, 29.9K at 17:35Z, 44.7K at 18:30Z, 62.5K at 19:45Z, and 101,042 at the end. About 84K of its views (83%) arrived after 16:20Z at roughly 10 to 16K views/hour. Evening UK traffic and the statement cannot be separated here, but the wave was there and a fresh post at 16:30 would have been sitting in it.

## 5. Cadence and hours of day

**Per account** (last 12 non-pinned posts; rate = (N-1)/days covered to 00:10Z 09-30; three accounts are cap-bound to about 1.3 days, so treat their rates as short-window):

| Account | Posts/day | Days covered | Posts on 09-29 (UTC day) | Oslo times on 09-29 |
|---|---|---|---|---|
| thatguysjokes | 8.6 | 1.28 | 10 | 11:26 15:28 17:15 19:09 19:29 19:52 20:36 21:24 22:30 23:08 |
| hesaballer | 5.9 | 1.34 | 7 | 10:33 13:27 15:07 16:57 19:27 19:39 22:38 |
| anfieldcentral | 5.5 | 1.46 | 6 | 09:00 11:10 13:06 15:47 18:46 22:53 |
| ftblmemeshub | 4.4 | 2.49 | 5 | 10:06 12:43 14:38 18:12 20:03 |
| itsfootybants | 3.3 | 3.31 | 3 | 14:30 16:33 18:29 |
| simptv | 2.4 | 4.64 | 2 | 19:41 22:11 |
| oddsbible | 2.3 | 4.38 | 3 | 11:18 13:56 18:03 |
| rivalsbanter | 1.8 | 6.21 | 2 | 12:15 20:05 |
| footy.rn | 1.5 | 7.26 | 2 | 16:28 20:38 |
| nonoffsideguy | 1.1 | 9.64 | 1 | 20:20 |
| trollol_epl | 1.0 | 9.67 | 0 | none |
| midnitefootball | 1.0 | 8.13 | 1 | 21:13 |
| thefootballfeeduk | 0.8 | 12.43 | 0 | none |
| **Median of 13** | **2.3** | | 2 | |
| **shithouseryhq IG (17 days)** | **9.5** (162 posts) | 17 | 11 | 03:31 05:02 06:31 08:03 09:32 11:05 13:12 14:52 22:41 22:47 00:27 |

Threads: we posted 282 in 17 days (16.6/day) and 10 on 09-29; competitors' Threads not measured.

**When the 13 accounts post, 09-29 (all 42 posts, complete for every account), Oslo hour:** 00 to 09: 0. 09 to 12: 6 (14%). 12 to 15: 7 (17%). 15 to 18: 7 (17%). 18 to 21: 15 (36%). 21 to 24: 7 (17%). Over 3 days (82 posts, partial coverage for the three fast accounts) the same shape holds: 1 post before 09:00 Oslo, 45% between 18:00 and 24:00 Oslo. UTC peaks are 17:00 (10 posts) and 20:00 (9).

**Our 09-29 IG:** 6 reels went out 03:31 to 11:05 Oslo (1,022 / 534 / 1,068 / 999 / 1,336 / 1,211 views; reels posted 00 to 09 UTC have median 1,022 views over 5 posts vs 1,880 for all reels over 43). Feed posts at 13:12 and 14:52 Oslo got 7.2K and 14.3K views. Then **nothing on IG from 14:52 to 22:41 Oslo (7h49m)**, while 27 of the 42 competitor posts (64%) went out in that gap. After it: 480, 1,471 and 1,204 views.

**Hour of day is not what killed the 22:27Z carousel.** In our 17-day IG pull, feed posts (images and carousels) published 21:00 to 24:00Z have median 10.2K views (n=20), against 6.7K for 15 to 21Z (n=54) and 8.9K for 09 to 15Z (n=38); our two biggest IG posts of 09-24 (65.8K and 88.3K views) went out at 21:03 and 21:08Z. Threads hour buckets show no stable effect (medians 0.7K to 1.4K in every bucket except 06 to 09Z at 4.2K, n=8).

## 6. Posts within 90 minutes of a big event

| Event | Window (UTC) | Competitors: event-related posts | Us: event-related posts |
|---|---|---|---|
| PL statement 16:05Z | 16:05 to 17:35 | **3** (anfieldcentral 16:46; thatguysjokes 17:09, 17:29). 6 posts of any topic from 5 accounts landed in the window | **0** (our two posts in the window, X 16:30 and Threads 17:30, are the Forest trophies receipt) |
| Statement, 180 min | 16:05 to 19:05 | 7 posts, 4 accounts (adds tgj 17:52, 18:36, rivalsbanter 18:05, footy.rn 18:38) | 1 (Threads 19:00, different angle) |
| FT of the 18:45Z games (Spain 4-1 Croatia FT 20:37:08Z; England 2-0 Czechia 20:36:53Z; Scotland 0-3 Switzerland 20:38:35Z) | 20:37 to 22:07 | **2** (hesaballer 20:38 Spain-Croatia, +1m; anfieldcentral 20:53 England-Czechia, +16m) | **5** (X scheduled 20:40 +3m, IG 20:41, Threads 20:42, IG 20:47, FB scheduled 20:50) |
| In-play moments (Yamal 63' at 20:07:40Z, Gordon 47' at 19:50:15Z, Kane 69' at 20:12:43Z) | +90 each | not measured | Threads 20:03 "Croatia's equaliser lasted three minutes" is +46 min after the goal it refers to (Pubill 31', 19:17:07Z); the Yamal post is +30 min after the brace goal; **no England-Czechia post from us at all** (draft "England scored every 22 minutes" FAILed 5) |

Event times come from the ESPN match summary wall-clock feed. Match FTs are where our system already works (matchwatch was running, hero pool and lines pre-built). The statement had no equivalent trigger.

## 7. Does being earlier correlate with more likes inside one story?

| Set | n | Spearman(lag, likes / own median) | Spearman(lag, raw likes) |
|---|---|---|---|
| Statement day, competitors | 9 | -0.38 | -0.20 |
| Leak night, competitors (footy.rn 15:11 excluded, hidden likes) | 10 | +0.36 | +0.33 |
| Our IG City feed posts 09-25 to 09-28 (lag vs views), n=8 | 8 | -0.43 (views) | n/a |
| thatguysjokes only, statement day | 5 | n/a | -0.80 |

At n of 5 to 10 none of this is significant. What holds up:

- **Within thatguysjokes' reel run, later meant smaller**: +84 min 74,096 likes, +107 min 45,216 (-39% for 23 more minutes), +151 min 24,076 (-47% for 44 more minutes). Three reels, different clips, snapshot ages differ (the later ones are younger), so the true decay is probably a bit smaller than shown. Their carousels did not decay the same way (+64 min 48.2K, +199 min 41.6K).
- **The biggest hits of the leak story were not the first posts.** oddsbible +225 min 5.29x its median; rivalsbanter Part 2 +1,322 min 3.36x; oddsbible +2,741 min 3.98x. These are multi-slide compilations of many real tweets, and they needed the meme supply that only exists a few hours after a break.
- **For us on Threads, content beat minutes.** 14:24Z (+24m) got 446 views, 14:35Z (+35m) got 259,935 for a different post. City posts on days 3 to 4 also reached 74.6K (09-27 12:09Z) and 144.4K (09-28 07:52Z).
- **Lateness plus a stale hook is what kills IG, not lateness alone.** Our day-4 carousel (09-28 07:40Z, "reportedly found guilty... nobody knows the punishment yet") got 25,155 views and 5 follows, at a good morning hour. The 09-29 22:27Z carousel repeated the "found guilty" hook 6 hours after every outlet had it.

## 8. What a realistic lag target is, and what it would take

Evidence-based targets (all measured from the source timestamp, not from a remembered time):

| Surface | Target | Evidence |
|---|---|---|
| Threads or X image | **<= 30 min** | we did +24 and +35 on 09-25 |
| IG feed carousel with real tweets | **<= 90 min** | thatguysjokes +64 (carousel); only 3 of 13 accounts posted inside 90 minutes on the statement |
| IG reel | **<= 3 h**, one clip pre-cut | thatguysjokes' two best reels were +84 and +107 min; playbook already says <= 3h |
| Story follow-ups | 3 to 4 more beats over 72 h | rivalsbanter Part 1 to 4, oddsbible x5, thatguysjokes x9+ |

What it would take, in order of effect per hour of work:

1. **Make `breaking.mjs` run persistently and check it is alive.** It already polls BBC, Guardian, Sky, ESPN and Google News every 10 minutes and exits with a report on a big story. The Guardian headline of the statement ("...£900m of 'sham' contracts") is not in `breaking_seen.json` (no entry contains "sham" or "900m"), consistent with the file not being written after 09-28 22:50Z. Add a check "seen file older than 30 min = violation" to the enforcer.
2. **Add a "big story, no post from us in 45 min" rule to the 10-minute enforcer.** It ran 22 ticks of "0 new" while the biggest story of the week was live. The trigger can be the same story-score used by `breaking.mjs`.
3. **Fix the clock.** `broke` must be the source pubDate, and every post logs `lag_min = live - broke`; grade lag on the dashboard against the four targets above. The 09-29 row would have read 382 minutes, not about 177.
4. **Pre-arm known catalysts** instead of waiting for them. City have until **Fri 2 Oct** to appeal (Independent, CBS); the sanction hearing "as soon as possible" is private and has no date; the PL restarts 10-10 and Liverpool v City is listed 11 Oct 11:30 on goal.com (time zone not stated there). Shells and a hero pool for those can be built in advance, the way the 09-29 match kit was.
5. **Keep both schedulers warm.** Metricool blocked at the same second the verdict carousel was queued and cost about 49 minutes; the Postiz path worked and should be the pre-checked fallback.
6. **Move IG volume to where the day is.** 0 of 42 competitor posts before 09:00 Oslo; ours had 4 of 11. Ours had 0 between 14:52 and 22:41 Oslo; theirs had 27 of 42.

## 9. Method, sources, limits

- **Competitor data:** `competitor_sweep_2026-09-29.json` (83 rows, snapshot before 00:00Z) plus a fresh pull of the first 12 grid items per account through the logged-in Chrome session (`/api/v1/media/<pk>/info/`, 156 rows, snapshot about 00:10Z, saved as `timing_competitor_pull_2026-09-30.json`). Likes moved between the two snapshots (thatguysjokes 17:29 reel: 58,739 then 74,096), so I use the fresh pull only. `likes = 3` in IG data is the hidden-likes placeholder; those rows are excluded from like comparisons (footy.rn 5, thefootballfeeduk 4, hesaballer 6, simptv 1, anfieldcentral 1, nonoffsideguy 1).
- **Pinned posts** (12 old rows, e.g. hesaballer 06-25, thefootballfeeduk 12-31) excluded from cadence.
- **Cadence limits:** thatguysjokes, hesaballer and anfieldcentral fill their 12 rows in about 1.3 to 1.5 days, so their per-day rates are for that short window (a match day). Posts deleted before the pull are invisible.
- **Topic tagging:** from the first 60 to 110 caption characters plus, for thatguysjokes 19:24, one slide read (a City fan's tweet). Carousel content was not read otherwise.
- **Event times:** web (Guardian/BBC/Goal/CNN/CaughtOffside timestamps) and ESPN match summary wall-clock; the true first tweet times of the PL and of Ornstein were not retrievable (X is not scrapable here), so t0 has a plus or minus 5 minute error.
- **Our numbers:** IG and Threads from the 17-day API pull (`quality_data/ig_threads_pull_17d_2026-09-30.json`), X and FB from `posts_log.jsonl` (no view counts). Metricool `scheduledFor` values without a "Z" are Oslo local time.
- **Not done:** X and TikTok timing (no instrument, per the PM notes); thatguysjokes 09-25 reel times (vidIQ gives dates only); a longer history per competitor (grid needs scrolling and the tab was hidden, so lazy load did not fire). Socialinsider is still empty (`list_profiles` returns `[]`), so no hour-of-day benchmark from it.
