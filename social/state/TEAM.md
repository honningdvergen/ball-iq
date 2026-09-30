# THE TEAM — how we get to 1,000,000 followers by 2027-01-01 (v1, 2026-09-28 late, Alex + Claude)

## 0. The honest maths (CORRECTED 09-29 01:20 after RULES_REVIEW_2026-09-29.md — the first version of this section was wrong)
| | |
|---|---|
| Followers today (all platforms) | ~138K (X 45.3K · Threads 41.9K · IG 32.6K · TikTok ~16K · Bluesky 1.3K · FB 0.55K · YT 30 · Telegram/WhatsApp/Snapchat ~0) |
| Needed for 1M by 01-01 | ~9,200 net/day |
| Real net growth (5-day mean 09-23→09-28) | **~+170/day** (Threads +610, FB +105, IG +23, X ~+100, TikTok −6, YT 0, Bluesky ~0 = ~+830). "~490/day" was one day (09-27). |
| The trap | **Views do not convert.** Follows per 10K views = 0.4–4 on every platform. A 2.72M-view Threads day netted +105; X's 1.36M-view post moved the count ~+100. At that rate 9,200/day needs 25–90M views/day; we make ~1M. So "more hits" and "more posts" alone can NOT close the gap (my earlier "1–5K follows per hit" claim was false on our own data). |
| What moves follows | A **reason to follow** attached to reach: a recurring named series people wait for, a fixed hit-conversion routine (pin + follow line + bio within 60 min of any post >5× median), FB (converts best: 2–11 follows/10K), IG feed posts/carousels that end on a CTA. Metric to judge everything: **follows per 10K views**. |
| Testable target | Keep 1M as the stretch; the target we test is **3–5× today = 500–900 net/day**, judged every Friday on follows/10K views. |
| Volume | Since 09-20 volume rose ~60% while IG-reel/TikTok medians FELL (IG 2.8K→1.5K, TikTok 1.1K→0.8K; confounded by the international break). Volume is not the lever; caption sameness ("X fans … 😭" on 79% of TikTok captions) and no reason-to-follow are the suspects. |

## 1. Why one worker failed (2026-09-28 post-mortem)
One editor covered 8 platforms + 4 live games + 3 new channels. Nothing watched the moments the funny accounts were posting (missed Zidane's sprint 25 min), nothing woke us when Facebook went 7 h silent (paid ads running), the critic was mis-calibrated, and match kits were stat lines written in the afternoon. **Fix = specialised workers that check each other, running on a shared board, with the PM auditing all of them during the day.**

## 2. The core team (2–3 always-on during the day, +2 on match nights)
| # | Role | Job | Runs as | Model | Accountable for |
|---|---|---|---|---|---|
| 1 | **Editor** (this session) | Picks the moment + the line, makes the final call, posts, replies to Alex | Main session | Sonnet 5.5 (trial 09-29→10-01, compare) | Taste. Every post passes the critic's FIRST QUESTION: what will people DO with it? |
| 2 | **Radar** | Every 15 min (match days) / 60 min (other days): what the funny + big accounts and fan accounts post, which moment is spiking, with the image/clip link; writes `board.md` "MOMENTS" | Scheduled task / background subagent | Sonnet | Missed moments. Logs "Radar saw it at HH:MM, we posted at HH:MM". |
| 3 | **Producer** | Turns an approved moment into every format: X label, IG/FB tweet-on-photo or reel (white plate), TikTok/Snapchat version, Telegram/WhatsApp copy, YT Short; posts via pz/Metricool/OneUp/Chrome; logs to posts_log | Background subagent per moment | Sonnet | Coverage: every platform gets its version within 30 min of approval. |
| 4 | **Critic** | Scores drafts vs Alex's taste log + banger library; names the ACTION + WHO in every verdict | On-demand subagent (`banger-critic`) | Strongest available | Consistency. Recalibrated daily from `taste.jsonl`. Alex reacts to 3–5 drafts/day. |
| 5 | **Fact-checker** | Every claim/number before it posts (`social-fact-checker`) | On-demand subagent | Sonnet | Zero errors. |
| 6 | **PM (floor manager)** | **Watches during the day (every 60–90 min 09:00–24:00 Oslo):** reads `coverage.mjs`, posts_log, board.md, insights; grades each platform vs PLATFORM_PLANS; calls out "lazy or dumb" (a platform silent > plan, a post that skipped the critic, a missed moment, a repeated format, hashtags/quotas creeping back); writes `pm/<date>.md` and pings the Editor with a fix list | Scheduled task (hourly, daytime only) | Sonnet | The scorecard. If Editor/Radar/Producer slip, the PM's report says which and why — no softening. |
| 7 | **Coverage watcher** | Wakes the session when a platform is over its max gap | Script `social/coverage.mjs` (no tokens) | — | Built 09-28, running. |
| 8 | **Growth analyst** | Daily 08:30: what worked yesterday (insights + postlog metrics), 3 formats to double, 3 to kill | Scheduled task (existing trend-sweep + PM merge) | Sonnet | Learning applied the same day. |

**Accountability loop:** Radar → Editor → Critic → Producer → postlog → PM audit → next morning's Growth analyst. Each hands off through `social/state/board.md`; the PM reads the board and the log, not anyone's self-report.

## 3. Daily rhythm (Oslo)
- **08:30** Growth analyst + PM morning grade → the day's targets and 3 "shots at a hit".
- **09:00–24:00** Radar runs; Editor/Producer act on spikes; PM audits every 60–90 min; coverage watcher pings gaps.
- **Match windows:** +2 Producers, Radar every 15 min, kit is a checklist only — the moment decides.
- **23:00** PM end-of-day: scorecard + "what would have made today a hit" → tomorrow's plan.
- Mac must be awake for Chrome-driven platforms (WhatsApp, OneUp/Snapchat, X quote-posts, Threads bio). API platforms (Postiz, Metricool) can be scheduled while it sleeps.

## 4. Rules every worker follows (short list)
1. Nothing posts without a critic PASS on its exact caption (owner override = Alex's `review.mjs taste <id> yes`, logged).
2. "Interesting" is not content. It must make someone **send / comment / laugh** (name which).
3. No hashtags on IG/FB/X/Threads; music credit line on any post using a CC track.
4. Facebook ≥ 1 post per 4 h in waking hours; each platform's max gap is in `coverage.mjs`.
5. During live sessions the sweep does no Chrome work (shared tab group).
6. Every failure goes into memory the same night.

## 5. Build order
1. **Tomorrow 09:00:** PM daytime schedule (hourly), `board.md`, Radar (reuse `breaking.mjs` + X search recipes).
2. **Tomorrow:** Producer = `social/produce.mjs` (one command: moment → all platform files + posts).
3. **Tue–Wed:** run the full team on the next real match window; read tokens/cost per night from session stats; decide Sonnet-only vs mixed.
4. **Friday:** first weekly team review — hits/week, net followers/day, misses (Radar vs Editor lag), PM's list.

## 6. Token/cost sizing (to be measured, not guessed)
Measure on the first team match night: tokens per role, per posted item, per follower gained. Decide then: which roles drop to Haiku-class (Radar reads), which stay strongest (Critic, Editor). Cap parallel agents at 5.
