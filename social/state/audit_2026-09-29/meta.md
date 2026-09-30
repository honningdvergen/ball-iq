# META AUDIT (Instagram + Facebook Page), 2026-09-29, auditor "meta"

Scope: IG @shithouseryhq (32,573) and FB Page Shithousery HQ (571). Read-only. Only write = this file.
Tags: [DATA] = number with source, [INFERRED] = reasoned from data, [GUESS] = no evidence, "no instrument" = we cannot measure it.
Sources: `node social/insights.mjs --hours 168` (run 09-29 09:56 UTC; also the 09-23..09-29 insights JSONs, merged to 65 IG posts), social/state/scoreboard.md, pm/2026-09-29.md, pm/format_portfolio.md, bangers/LIBRARY_video.md + LIBRARY_fbpages.md, research/ig_follow_conversion_2026_09.md, mysocial_2026-09-28.md, socialinsider_2026-09-28.md, memory files, posts_log.jsonl (156 rows; its `metrics` column is empty, so it gives no per-post results).
**Tool limits I hit:** vidIQ balance is 4 credits (a call costs 5; it resets 10-15), so I ran NO fresh vidIQ pulls. Competitor numbers are the 09-28 vidIQ/Mysocial pulls already in the repo plus WebSearch snippets. Socialinsider has no tracked profiles. No per-post FB data exists anywhere (only page-level daily). IG/FB `Account Status`, follower vs non-follower split, follows-by-content-type, Stories and broadcast-channel numbers: **no instrument** (in-app only; Alex would have to screenshot).

---

## 0. Answers to your five questions, up front

1. **Why did IG follows halve in a week?** Three things stacked, and only one is a "platform" thing. (a) Reach fell ~by half or more: about 275K views/day over the 30 days to 09-28 (8.25M, Mysocial) vs ~100K/day of views on posts published 09-22..09-28 (my sum of the 65 posts: 698K in 7 days) [DATA]. (b) Conversion per view fell too: ~4.4 follows/10K views in the 09-15..22 window (1.10M views, ~60 follows/day) vs ~2.5 in the last 7 days [DATA, rough]. The mix moved from own-image hits (33-wins, Haaland) to tweet-screenshot recap carousels, which convert 0.09 f/1k vs 0.49 for our one own-first carousel [DATA]. (c) Calendar: the 09-15..19 window had PL and CL matches; 09-22 on is the international break [DATA: scoreboard]. Volume did NOT protect us: 09-25 had 15 posts and 206K views, 09-26/27 had 6 and 3 posts and 31K/17K views.
2. **Reel vs carousel truth:** carousels are the only feed format that has produced follows (46 in 31 carousels, 13 in 13 images, 0 measurable in 21 reels because Meta does not report follows per reel) [DATA]. But that is 53 of the 237 account follows for 09-21..09-27 = **22%** [DATA/INFERRED]. ~75% of our follows come from somewhere we cannot see. Reels: 21 reels, median 1.4K views (4% of followers), 0 hits [DATA]. The reels fail on **watch time**, not on a flag: avg watch is 4.4-6.8 s on every reel except the one hit (16.6 s) [DATA].
3. **Is IG throttling us?** No account-wide throttle is evidenced. Carousel reach went 17K median (09-25) to 4.5K (09-26) and then back to 20K and 14K on 09-28 (City day 4, Klopp/Greece) [DATA], and Alex saw "Account Status = recommendable" on 09-22 [DATA: memory rootcause]. What IS true: nobody has re-read that screen since 09-22, and the aggregator test is a rolling 30-day majority (09-25 alone was ~9 tweet-screenshot carousels). So: **[GUESS] 25% chance of a soft per-post recommendation penalty on screenshot carousels and third-party-clip reels; ~75% it is story heat + weak reels.** One 60-second in-app check settles it (section 4).
4. **A 5x design** is section 5: the same ~8M views/month converting at FB's 7/10K instead of 1.4 is +190 follows/day (vs ~40 gross now). It needs three things at once: own-first carousels, reels that hold >50% of the clip, and collab posts (the only lever that imports non-follower audiences on demand).
5. **FB as primary?** No. Yes as the conversion lab and cheapest follows. FB earns ~$0.7/day (0.0085-0.0137 $/1k) and 570 followers is 0.4% of the goal even if it grows 10x. But FB already gets ~30-38K unique viewers/day and converts 4.4-7.3/10K (5x IG). Treat it as the place where formats are proven, then export to IG/TikTok/Snap. Section 6.

---

## 1. INSTAGRAM

### GRADE: D
Criteria (each 0-4): net follows/day vs target +300 (actual +2 to +19/day: 0), views (~100K/day, healthy: 3), follows per 10K views vs target 3 (1.4: 1), reel engine (0 hits in 21: 0), CTA/profile funnel (no series live, collabs 0, Stories none logged, broadcast 1 post: 1) = 5/20. Views are fine; the account is not converting or building a reason to follow.

### What the data says (5 bullets)
- **Follows/day 09-15..27:** 120, 59, 56, 63, 89, 38, 50, 37, 38, 26, 39, 25, 22 (09-28 blank, Meta lag). Unfollows steady 20-26/day [DATA insights]. Net ≈ 0 to +19. Followers 32,547 (09-23) to 32,573 (09-29) = +26 in 6 days [DATA followers.csv].
- **Per-format follows:** carousels 46 follows / 499K views = 0.92 per 10K; images 13 / 154K = 0.85; reels unmeasurable [DATA merged insights]. Best: "Arsenal fans have decided Arteta has three Premier League titles" (own fake-official "Etihad best stadium in League 2" as slide 1, CTA on last slide): 12 follows, 0.49 f/1k, 24.8K views [DATA]. Worst big ones: Tekkers/Ronaldo 65.6K views/3 follows, Zidane France 40.3K/1, Ornstein 36K/4, Xavi-Klopp 88K/8 (but 1,622 shares).
- **The story-day cliff:** City carousels day 1 = 20-36K, day 2 = 4.3K and 5.4K, day 3 = 5.3K [DATA]. The only day-4 City carousel that did 19.8K went out 07:40 UTC on verdict day (4 follows).
- **Reels are not being served:** 21 reels 09-22..29: median 1,384 views, best 11,269 ("He's South Korean. Wait till he starts talking", 16.6 s avg watch, 108 shares); the 6-reel overnight Metricool drip 03:30-11:00 on 09-29 = 316 / 586 / 743 / 826 / 832 / 1,028 views [DATA]. Reach on those = 194-777 (0.6-2.4% of followers).
- **The reel that should have flown:** statues/City lawyers 09-25: 6.2K views but **475 sends on 4,969 reach = 9.6% sends per reach** (Instagram's top non-follower signal per Mosseri) and avg watch **6.3 s of a 36 s reel = 17% retention** [DATA]. Distribution stopped because retention was dead, not because it was flagged [INFERRED].

### Root causes, ranked (probability that it is THE cause of the follow halving)
1. **~40%, story-heat dependence with no repeatable engine.** All 6 IG posts above 40K views were posted on day 0-1 of a story or ≤25 min after a match (Xavi-Klopp 88K, Tekkers 65.6K, Spurs-33 image 48.9K, 16yo Chelsea fan 42K, Zidane 40K, Ornstein 36K). Once City hit day 2 and the break got quiet, the median fell to 4.5-5.4K. No format of ours produces reach without a fresh story.
2. **~25%, conversion mix shifted to non-converting posts.** Neutral recaps (no fanbase mocked) = 40-52K views and 1-3 follows; own-first + fanbase-mock = 0.49 f/1k [DATA: LIBRARY_video CAR-02, NL-3]. The 09-26..29 output was mostly tweet-screenshot/recap carousels plus reels.
3. **~15%, reels built to fail:** 6-8 reels/day in one template ("[Fans] when… 😭"), overnight drip (3 of 6 end in 😭 [DATA PM]), avg watch pinned at ~5.5 s, and **the royalty-free music credit pasted into the caption** ("🎵 Local Forecast - Elevator – Kevin MacLeod (incompetech.com), CC BY 4.0", in 6 of the last 6 reels' captions) [DATA posts_log, insights text]. That looks like a bot to viewers, it is caption text with no joke, and no royalty-free track can ride a trend.
4. **~10%, soft aggregator/unoriginal penalty** on screenshot carousels and third-party-clip reels [GUESS on size; the policy is real: IG 2026-04-30, see reference_platform_algorithms_2026_09.md, weak vendor stats say reposters lose 60-80% reach]. Not falsified: nobody re-read Account Status after 09-22.
5. **~10%, international break + follower fatigue** (posting 15 items on 09-25 vs 3 on 09-27). Real but the smallest cause, because 09-28 reach recovered on the right story.

### The unexplained 75% (biggest measurement gap)
- Feed-post-attributed follows (53) vs account follows (237) for 09-21..27 = 22%. Account profile visits were 2,511 in 8 days (314/day) but per-post profile visits are 5-44 each; posts explain well under half [DATA/INFERRED].
- 09-24 Threads post hit 2.7M views and IG follows that day were 26 (no lift) [DATA], so Threads is NOT the feeder.
- So the follows we get come from Reels-tab/Explore/search/profile discovery, Stories, or other sources we do not measure. **No instrument.** In-app, Instagram Insights shows "Follows" split by Posts/Reels/Stories/Profile and "Profile visits" by source. One screenshot from Alex tells us where the 75% comes from and whether "reels aren't the lever" is even true.

### What the comparables do that we don't
Verified comparability (banter/satire IG accounts, NOT news): 

| account | followers | fit | what the data shows |
|---|---|---|---|
| @thatguysjokes | ~2.0-2.17M | best comparable: white-plate meme reels | ~4 reels/day, 12 reels in 09-25..27, 405K-2.64M, median ~620K = 0.3x followers per reel; 8.5% like rate; 7 City reels in ~24 h [DATA 09-28 vidIQ]. Pads every caption with a filler paragraph because "IG flags unoriginal" [DATA] |
| @rivalsbanter | ~383K | tweet-on-clip reels | ~1/day, 64-291K, median ~160K = 0.42x followers; 1-2 word captions [DATA] |
| @roastedballers | ~18K | best size comparable | receipt-stack/collage reels; 1.9M at 101x median on the City story [DATA] |
| @hesaballer | ~193K | fan-reaction on skill clips | 797K on a 13 s clip using its OWN branded tweet header [DATA LIBRARY NL-1] |
| @ftblmemeshub / @itsfootybants / @trollol_epl / @midnitefootball | 130K / 86K / 136K / 79K | carousel and tweet-on-clip accounts | ftblmemeshub ends every carousel on a screenshot of its own profile with the follower count circled and a Follow to Following arrow; the other three use no CTA [DATA research 09-24]. itsfootybants' reels tab has been dormant since 07-19 [DATA] |
| @thehatecentral (Hater Central) | 611.6K on X, only **29K on IG** [WebSearch snippet] | NOT comparable on IG: X-native | worth noting: a famous X humour brand got 29K on IG, so IG follows do not come free from fame or from views |

What they do that we do not:
- **Their reels reach 0.3-0.4x their follower count; ours reach 0.04x.** A 32K account with a 0.3x reel median would get ~10K per reel; our 21-reel median is 1.4K [DATA/INFERRED]. That 7x gap is the whole reel problem.
- **One template, one hook in frame 0, 6-18 s, loopable, clip acts out the line** (LIBRARY_video IG REELS rules 1-8). Our reels are 11-36 s, retention ~40-17%.
- **Story timing:** first with a new consequence angle within hours. We ran 3 City lawyer angles in 10 minutes 2 days after and cannibalised ourselves (OURS-01/03).
- **Identity on the profile:** ftblmemeshub's profile-screenshot CTA shows the button; nonoffsideguy uses a "Reasons to follow" meme template. We use random achievement/celebrity photos + "tap follow" (retired 09-24).
- Nobody in the set reveals follows per 10K. **[no instrument] on competitors' conversion.** I cannot tell you a competitor converts better; I can only say their reels reach 8x more people per follower.

### STOP / KEEP / DOUBLE
- **STOP:** (1) the overnight reel drip 03:30-11:00 (median ~800 vs 1.2-2.2K daytime). (2) MacLeod/credit lines in captions on every platform. (3) Tweet-screenshot recap carousels with no fanbase mocked and no own first slide (NL-3: 40-52K views, 1-2 follows). (4) Day-3+ carousels on a story. (5) >20 s reels for one-beat jokes (OURS-01 36 s). (6) 6-8 reels/day.
- **KEEP:** post-match carousel ≤25 min after FT (09-24: 61.7K and 31.6K; 09-26: 10.4K) but only when there is a fanbase-mock frame; the 09-28 CTA A/B "Following us takes one second"; Daily Number series.
- **DOUBLE:** own fake-official first slide + fanbase-mock frame (CAR-02: 5-25x the follow rate of any recap); reels with the clip audio as second punchline and template A (white plate); hit-reaction routine (pin + reply within 60 min).

### BIG BETS
**Bet 1: Collab ladder (the only lever that brings non-follower audiences on demand).**
- WHAT: 1 co-authored post/reel per week with a Tier-A page (collab_plan.md: @nonoffsideguy 50K, @midnitefootball 79K, @itsfootybants 86K, @ftblmemeshub 130K, @trollol_epl 136K). The asset is a proven own format ("Daily Number" or fake-official first slide), not a screenshot. Mechanism: Metricool `instagramData.collaborators`; the post shows on both grids and in both audiences.
- WHO: Editor (warm-up comments, 3 DMs/day max, no templates); Claude builds the asset. WHEN: warm 09-30..10-02, first ask Fri 10-02, first live post by 10-06.
- EV [GUESS]: a collab reaching 10-20K of a 86K page's followers at 1-2% follow = 100-400 follows per post = 3-10 days of current IG growth. P(one accepted by 10-13) ~35%. Cost: ~20 min/day of warm-up + 1 asset/week.
- KNOW: accepted collabs ≥1 by 10-13; follows per 10K views on a collab ≥3x our carousel baseline (0.9). KILL: 0 accepted after 12 DMs by 10-16 -> switch to paid story-shoutout swaps (their story for ours, no money) or drop.
**Bet 2: Kill the feed-recap sweep, run an "own-first, one-story" carousel factory.**
- WHAT: max 2 carousels/day. Slide 1 = OUR fake-official/own card with a fanbase-mock frame (template: "🚨 OFFICIAL: [Stadium] voted best stadium in League 2" style, one per day, never reused); slides 2-8 = ONE story only; last slide = the strongest joke + the CTA in the same breath (the 12-follow CTA: "Man City's lawyers charge by the hour. Following takes one second"). Post day 0-1 of a story or ≤25 min after FT. Own slides only on days a strong one exists.
- WHO: Claude-sweep (assets) + critic. WHEN: 09:00 UK-morning slot and post-match. WHY: 0.49 f/1k vs 0.09 f/1k (5x) on n=1 [DATA], and it removes the aggregator risk. It cuts volume ~65% (from 4-9/day to 2/day), which is fine: views were not the problem.
- KNOW: follows per 10K views ≥3 (= 0.3 f/1k) pooled over the next 10 own-first carousels. KILL: <1.5 per 10K after 10 carousels (by 10-08).
**Bet 3: Reels rebuilt for retention, or stop making them.**
- WHAT: 1 reel/day (max 2 on a hot story day), ≤12 s, frame 0 carries the plate and a moving clip, clip audio kept when it is the punchline, native audio only via Alex's app (trending sound) when the sound is the joke. No credits in captions. Publish 12:30/19:00/FT+20 min. Skip any reel that fails "cover the text: does the clip act out the line?" (the 36 s Mourinho reel is the counterexample).
- WHY: 21-reel median 1.4K vs comps 0.3x followers; the 1 hit (Alex, audio-led, 16.6 s watch) proves the audience will watch when the clip is the joke. 9.6% sends/reach on the statues reel says the premise was right and execution killed it.
- KNOW: median avg-watch ≥8 s AND ≥1 reel >10K in 14 days. KILL by 10-13: if 14 reels give median <2.5K and 0 >10K, drop IG reels to 3/week and put the time into carousels + collabs.
**Bet 4 (diagnosis, 0 cost, do first):** Alex screenshots Account Status + Insights "Follows by content type" + "Followers vs non-followers %" of the last 5 carousels + Reels tab. If non-followers <30% of reach, Bet 2 is priority 1; if reels drive most follows, Bet 3 is.

### 14-day plan (IG), daily spec
| day | posts | notes |
|---|---|---|
| 09-30 | 1 own-first carousel 09:00 UK, 1 post-match carousel if a match, 1 reel 12:30, 1 Story with poll | Alex sends the 4 screenshots; stop the drip |
| 10-01 | same; read the 72h test: fails if <50 follows on 2 of 3 days (09-27 = 22: **call it FAIL now**, do not wait) | DM #1 to Tier A |
| 10-02 | Daily Number carousel with CTA; first collab ask | |
| 10-03..10-05 | 1-2 carousels + 1 reel/day, story daily, comment-reply first hour | broadcast: 1 post/day, only the best reel or a poll |
| 10-06..10-10 | first collab post live if accepted; El Clownico (Spurs v United 10-10) countdown series "Day N" carousels, pinned | PL returns 10-10: day-0 carousels ≤25 min after each FT |
| 10-11..10-13 | read: follows/10K per format, reel median, collab result | apply kill rules |
Daily total: 2 carousels + 1 reel + 1 Story + 1 broadcast post. **Posts/day falls from ~8 to 4.**

### Profile as landing page (cheap, no content needed)
- Bio line 1: the promise and the proof ("One football joke a day, ruined by a number. 8M views/mo" style, our voice); line 2: the series names ("Daily Number · Shithouse of the Week"); pinned posts (3): best own-first carousel (CAR-02), best reel, series-intro post; Highlights: "Daily Number" archive, "Club rota", "Best of". Alex adds the pending Telegram/WhatsApp extra links (still undone since 09-28 21:50 [DATA PM]).
- Profile-visit to follow is already 15-20% (normal) [DATA 09-24]; the leak is views to visits (0.04-0.1% per post). Pinned posts and a series promise raise visit-to-follow, but only a post that makes people tap the profile fixes the front of the funnel: end-frame/last-slide "We do this daily. Day 6 of 17 without the Prem" (numbered series was our second follow-earner: "Day five" 4 follows from 5 visits).

### Monetization path (IG)
Instagram pays nothing to us directly (no creator payouts assumed for Norway: [GUESS], I did not verify). Real path: affiliate/brand (outreach/brands_2026-09-23.md: Fantasy Football Hub £25 per subscriber, NordVPN 40%, OddBalls 15%): needs 8M views/month held, not follower count. Carousel slot rate card $150 is unproven.

### Would I keep investing in IG? YES, but cut the effort per post and change what earns it.
It has the audience (8M views/30d) and the second-biggest follower base. The fix is conversion and collabs, not volume. Give it 4 posts/day, not 8. If by 10-13 follows per 10K views is still <2 and net <+30/day with the new plan, demote IG to a Threads/FB re-post surface and move its hours to FB/TikTok.

---

## 2. FACEBOOK PAGE

### GRADE: C+
Criteria (0-4): net follows/day vs target +100 (actual +22 to +38: 2), follows per 10K views vs target (4.4-7.3: 4, best of all our platforms), distribution route (proved: scheduled reels reach non-followers: 3), repeatability (hits ~1 per 2-3 days, floor 25-60 views: 2), monetization/ROI (~$0.7/day; ad cost/follow unread: 1), instrumentation (page-level only: 1) = 13/20 rounded to C+.

### What the data says (5 bullets)
- **Page daily [DATA insights, Meta labels each row by its END time so 09-28's row is mostly 09-27]:** 09-27: 65.7K content views, 37.8K unique viewers, 29 follows, 1,335 engagements, $0.56. 09-28: 51.8K views, 30.8K uniques, 38 follows, 1,301 engagements, $0.71 = $0.0137 per 1K. 09-29 partial: +22 followers by 09:56 UTC (549 to 571).
- **Followers:** 444 (09-23), 450, 453, 518 (09-27), 549 (09-28), 571 (09-29). +127 in 6 days = 21/day, but 65 of that came on the two hit days 09-26/27.
- **Reach without followers:** 30-38K unique viewers/day on a 570-follower Page = ~98% non-followers. FB already reaches ~half of IG's daily audience with 1/57th the followers. Conversion is 0.12% of unique viewers (38/30.8K) [DATA/INFERRED].
- **Hit reels (Meta/Metricool, LIBRARY_video FB-01..07):** 78.6K (18/19 Sep, 21 s, "Tottenham vs Aston Villa" slapstick), 44.5K (Wicker Man bees), 42.3K (our Everton/City maths, two-beat reveal, ~30 min after story, 499 likes), 42.2K (Goldbridge donation audio), plus earlier 113K/65 follows, 103K/39, 56K/17, 33K/37 [DATA memory]. Follows per hit: 3.0-11 per 10K, median ~6. Flops: 26, 27, 34 views. FB is binary: hit or ~30 views.
- **The "only IG-app posts reach FB" rule is falsified as an absolute:** FB-03 (25 Sep) and FB-04 (26 Sep) are Metricool-scheduled and got 42K each; the 09-20 Postiz reel got 55.8K/17 follows [DATA LIBRARY header, memory diagnosis correction]. The route works; **content and timing decide**. Flops share a cause (vessel does not act out the line, near-static clip).

### Root causes of "FB converts 7/10K, IG 1.4/10K" [INFERRED, ranked]
1. **Audience state.** FB viewers are ~98% non-followers who found us in a recommendation feed with no prior relationship; a follow is the natural way to see more. IG carousel viewers are mostly existing followers (reach 1.1-1.7x followers on hits, tiny follower share unknown) who cannot follow again [DATA/INFERRED]. So IG's low rate may be a denominator problem, not a persuasion problem.
2. **Formats that need no football knowledge.** The 4 FB escapes are slapstick, audio punchlines and a maths reveal (LIBRARY FB rules), which reach a broad older UK audience (Page ~70% UK, ~70% aged 35+ [DATA brand figures 09-23]).
3. **Format = video that gets finished** (8-21 s) vs IG's screenshot carousels where viewers get the joke on slide 1 and leave.
4. **Thin competition + a follow button under the reel.** Half of famous football-meme Pages are dead (Troll Football 269K dead since 16 Jul; Football Memes 285K dead) [DATA LIBRARY_fbpages]. [GUESS on mechanism.]

### What comparable Pages do that we don't [DATA LIBRARY_fbpages, read 09-28, real GraphQL counts]
- Live humour Pages post **4.5-19 times/day** and are **photo-first**: Football Funnys (858K) 4.5 posts/day, 100% single 4:5 photos, median 423 reactions; Football Planet (1.9M) 16.5/day, tweet-on-photo, median 753; 433 (7.2M) 13/day, median 14,177; SPORF (1.2M) median 137 (weak); Soccer Memes (121K) median 32 (weak).
- Top posts: "FULL TIME: BRIGHTON 3-0 ARSENAL" over an AI Arteta drenched in seagull droppings: 3,064 reactions, 519 shares; Haaland in a Cheetos kit: 2,258 / 720 shares (75 min after the City story). Comment-bait = a NAME question (433 Ballon d'Or: 4,902 comments).
- None of ~40 top captions asks for a follow; they grow on consistency and share-bait.
- We post 3-4 reels/day, no photos, so we are testing the opposite of the two closest humour Pages (test row in PLATFORM_PLANS: FB single-image posts via Metricool 09-29..10-02, not started [DATA PM]).

### The kr 50/day ad: my read
- **Setup as logged [DATA HANDOFF/PM]:** kr 50/day × 12 days (kr 600), UK 18+, goal "Page visits and followers". PM notes it optimises visits: 21 visits at kr 0.65 in the first hours, followers flat at 530 after 11 h.
- **Cost per follow is NOT knowable from what we have.** PM's kr 2-5 is the excess over a 9-29/day organic baseline, but the baseline swings 3 to 65/day with hits (09-24 +6, 09-25 +3, 09-26/27 +65 combined, 09-28 +31, 09-29 partial +22) [DATA followers.csv]. The +38 labelled 09-28 is mostly 09-27 organic (Meta end-time labels), before the ad. If ALL 41 follows from 09-28 morning (530) to 09-29 09:56 (571) were the ad, cost = kr 1.2-1.5/follow (of kr ~65 spent); if 10-25 excess, kr 2-6. That is not a decision-grade read.
- **Recommendation: do not wait to Wed.** Change the objective to Engagement, conversion "Page likes/follows" now, because a visits-optimised ad buys visits by construction. Read cost per follow from Ads Manager "Results" for the follow action, not from the Page total.
- **Structure to test (kr 50/day is enough to learn; scale only on evidence):** 1 campaign, 1 ad set, UK + Ireland, ages 25-54 (the Page is 70% 35+; 18-24 is the wrong end of our audience [DATA]), Advantage+ audience with a football interest hint, placements = Facebook Reels + Facebook Feed only (**drop the Instagram placement**: it sends IG users to the FB Page and does not grow IG [DATA PM]); creative = the 3 best organic reels of the last 72h that already escaped (FB-01..04 type: no football knowledge needed), each as its own ad, boosted from post so social proof (likes/shares) rides along; swap creative every 3 days. Bid: lowest cost for 4 days, then cost cap at 1.5x the observed median.
- **Scale rule:** if cost/follow ≤ kr 2.5 after 5 days and hit-follows/10K stays ≥4, go kr 50 -> 150/day; each doubling waits 3 days. Kill: cost/follow >kr 3 for 3 straight days after the objective switch, then stop the ad and keep only free levers (below).
- **Honest ceiling [GUESS, UK Page-like cost is not in any source I found; a WebSearch found generic CPC only (£0.45-1.50)]:** at typical UK football-audience Page-like cost of ~$0.10-0.30, kr 50/day (~$4-5) = 15-45 follows/day. To hit +500/day would cost ~$50-150/day (kr 500-1,500), ~kr 15-45K/month, against ~$21/month of FB earnings. **Not affordable under the money-pressure rule, and the follower is not monetisable on FB (~98% of views are non-followers).** Ad money should be capped at the level where a follow costs less than ~kr 3 and only to feed the goal count.

### Free follow levers we are not using
- **Invite reactors:** the Page has ~1,300 engagements/day, mostly non-followers. Facebook's "Invite" button on posts lets a Page owner invite people who reacted to follow; nobody has done it for weeks (the 09-25 plan asked for 10 min/day; not logged as done) [DATA memory]. [GUESS] 5-10% acceptance = 65-130 follows/day if it worked on reels; **unverified that the button is available on reels.** Test 3 days, 10 min/day, count follows/day vs 21 baseline.
- **Hit conversion:** within 60 min of any reel >10K views: pin a comment "Daily football shithousery, Follow button is right there", reply to top 10 comments, post a follow-up on the same story.
- **Page name:** rename request "Shithousery HQ – Football Memes" pending [DATA HANDOFF]: search discoverability.
- **Groups:** shares to 3-5 groups as the Page (09-23 method): 3 of 4 went "submitted to admins for approval"; low priority.

### STOP / KEEP / DOUBLE (FB)
- **STOP:** flop patterns: plate that changes mid-reel, hurdler-for-bees vessels, near-static clips, 6-reel overnight drip (they share the IG drip's 3:30-11:00 slot; FB is UK/older, sleeping), Goldbridge clips the critic FAILED (Gerrard 4/10 still queued on YT/FB per PM), caption credits.
- **KEEP:** 3-4 reels/day where each obeys "clip is funny with no football knowledge, plate 3-10 words, ≤21 s, moves in second 1"; the maths reveal within 30 min of a story; the ad (objective changed).
- **DOUBLE:** FB-03-type own two-beat maths reveal within the hour; slapstick "[Fixture]" reels the night before a big match (FB-01 78.6K); FT scoreline over a villain image.

### BIG BETS (FB)
**Bet A: Photo-first Page (the lottery ticket is reels, the floor is photos).**
- WHAT: 4 single 4:5 photo memes/day (joke IN the image, caption ≤10 words, FT = "FULL TIME: X 3-0 Y" over the villain image) + 3 reels/day, one name-answer question/day. Route: Metricool (Postiz photo posts reached 0-17 on 09-22; Metricool photo route is untested [DATA]).
- WHO: Claude via Metricool + critic (FB reels not gated on score under the new critic rule). WHEN: test running 09-29..10-02 per plan; I recommend starting today.
- EV [GUESS]: if the Page earns a Football-Funnys-style floor (median ~400 reactions) it would gain reach per post independent of reel luck; if it earns the Postiz-photo floor (0-17) the test dies in 3 days. P(works) ~30%. Cost: assets Claude already makes (best IG slides, FT memes).
- KNOW: median photo reach ≥1K by post 12; follows/day ≥ baseline with photos on days. KILL: median <200 reach after 12 photos (10-02).
**Bet B: FB as R&D lab feeding IG/TikTok/Snap.**
- WHAT: every reel that escapes on FB (≥30K in 48h) is re-cut for IG (template A, ≤12 s, native audio if any) and TikTok (silent copy for Alex), same day. Reason: FB-01..04 are the only videos of ours that ever broke 40K, and 3 of 4 need no football knowledge, exactly the "any-fan" audience IG/TikTok reward. It costs nothing new.
- KNOW: ≥1 FB winner re-cut per week reaches >10K on IG (our best reel is 11K) by 10-13. KILL: 3 re-cuts under 3K.
**Bet C: A "Series" reel on FB (fixed slot, recurring name).** e.g. "THE DAILY NUMBER" as 8-s two-beat reveal reel at a fixed 13:30 UK slot. FB-03 (a maths reveal) got 42K; a named daily slot gives the "reason to follow" that FB pages without a series lack [DATA diagnosis 09-25]. EV: 1 hit/5 days at ~6 f/10K on 40K = 24 follows per hit. Cost: the asset already exists (Daily Number).

### Should FB be the primary conversion platform?
- **No.** Reasons: (1) $0.7/day earnings, 570 base, and even +100/day = +9K in 90 days = 1% of the 1M goal [DATA/INFERRED]. (2) Hit-driven and un-instrumented per post. (3) A FB follower has little downstream value (98% of views are non-followers; no link CTR: ~1.5% of views on link posts [DATA memory]).
- **Yes, as second-priority conversion lab**: its 4.4-7.3 f/10K rate is the best we have; if IG could match it, +190 follows/day. Give FB ~25% of content hours and the ad budget only while cost/follow <kr 3.
- FB effectively converts because its distribution is recommendation-only and the format is video; those two facts should shape IG/TikTok video, not the other way around.

### 14-day plan (FB), daily spec
| day | posts | notes |
|---|---|---|
| 09-30 | change ad objective; 3 reels (12:30, 19:00, FT+20) + 4 photos (start now) + 1 name-question | Alex/PM read ad results at 18:00 |
| 10-01..02 | same; invite-reactors test 10 min/day; pin+reply on any reel >10K | photo test read 10-02 |
| 10-03..05 | winners only: cut photos/reels that failed the rules | ad creative swap 10-03 |
| 10-06..10 | Daily Number reel at 13:30 daily; FT scoreline photo after each match | El Clownico countdown |
| 10-11..13 | scale/kill ad per rule; decide Page name outcome; read follows/10K | |
Target: follows/day ≥35 average (from 21) by 10-13; FB reach ≥50K views/day sustained.

### Monetization (FB)
Content Monetization already on: $16.41 on 1.14M views in 28 days (= $0.014/1k, read 09-21), 09-27/28 $0.56/$0.71 [DATA]. Norway eligible; Creator Fast Track not available (US/CA/UK/AU only, and no reel in 6 months) [DATA memory]. Photos/text often pay more per view than reels [DATA memory: creator dashboards, not Meta], so the photo test also tests revenue. Realistic: <$25/month at current 1.5M views/month; $100+ needs ~7M monthly views. FB pays rent only if it scales 5x. Brands: UK 35+ audience suits retro kits/grooming (OddBalls, Cult Kits, TOFFS per outreach file).

### Would I keep investing in FB? YES, at a fixed ~25% of content hours and kr 50/day until cost/follow is read properly.
It is the only place views convert and where competitors have died. Stop investing if by 10-13 follows/day ≤ baseline 21 with the ad off-objective corrected and photos flopped.

---

## 3. Cross-platform items that hit IG/FB

- **Overnight Metricool drip is a shared failure:** 6 reels 03:31-11:05 on IG/FB/TikTok/YT with the same template; IG median 800 vs 1.2-2.2K daytime [DATA PM]. Move to 12:30/19:00/FT+20 min.
- **Duplicate scheduling is logged:** 09-28 22:41 and 22:55 show the same 6 reel captions twice in posts_log on both IG and FB [DATA posts_log]. Verify IG/FB did not publish both (Meta demotes duplicate copies of the same reel [DATA memory]). No instrument to confirm from here.
- **Critic bar contradiction:** the gate is now ≥7, the PM prompt says ≥8 [DATA PM]; 16 logged rows have critic 7. Alex must pick one.
- **Pre-gate Postiz queue not purged:** 10 items with no verdict today, incl. FB Goldbridge reels [DATA PM].
- **Broadcast channel "Shithousery Fam":** first post 09-29 01:35 (Zidane reel). Members not readable from the web. WebSearch says a healthy channel sees 40-70% view rates vs 2-5% feed reach (generic vendor claim) and the first invite prompt drives most joins [WebSearch snippet, weak]. Use: 1 post/day = the best reel + a poll; promote via a Story with the channel-invite sticker and a pinned line in the bio. EV small (a retention/notification surface, not a growth engine).

---

## 4. Instruments to add this week (cheap, decides everything above)
1. Alex, 5 min, IG app: (a) Settings > Account status > Recommendations screenshot; (b) Insights > Followers > "Follows by content type" and "Profile visits by source" (last 7 days); (c) followers vs non-followers % on the last 5 carousels and 5 reels; (d) broadcast member count. Owner: PM asks; deadline 09-30 12:00.
2. Ads Manager "Results" for the follow/like action (not Page total) + spend, daily, into scoreboard (FB ad line is required from 09-29 by scoreboard header).
3. Per-post FB views/reach into posts_log `metrics` (Metricool FB post analytics or Business Suite Content), because none exist. Judge at 72h only.
4. Restore vidIQ credits (resets 10-15) or add Socialinsider IG tracking of 5 comps: the only external instrument on competitor follower growth.

---

## 5. What a 5x IG follow-rate design looks like (target: ~7 follows/10K views, +190/day at today's views; realistic 3x in 3 weeks, 5x needs collabs to land)

| layer | now | design |
|---|---|---|
| Front door (post) | tweet-recap carousels + generic reels | own-first carousel (fake-official slide 1), one story, fanbase-mock frame; reel ≤12 s acting out the line |
| Middle (post -> profile visit) | 0.04-0.1% visit/view | end-frame/last slide names the series and the day ("Daily Number #N, same slot tomorrow"), comment pinned with the promise, first-hour replies |
| Landing (profile) | random pinned, no series | bio = promise + proof, 3 pinned (best carousel, best reel, series intro), Highlights = series archives, broadcast + WhatsApp/Telegram links |
| Audience import | none | 1 collab/week with a 50-140K page; Metricool collaborators |
| Retention | ~24 unfollows/day | daily Story with poll + reshare of each hit; broadcast 1/day |
| Reason to follow | none | numbered series ("Day N"), club rota (Mon United...), El Clownico countdown to 10-10 |
Expected value [GUESS, each lever unproven at our size]: own-first carousels +2x conversion; series/pinned +1.3x; collabs +150-400 per accepted post; reel rebuild +? (unknown until 14 reels). Together ~3x in 3 weeks, 5x if a collab lands. Costs no money; costs less posting.

---

## 6. Summary (10 lines)
1. IG grade D, FB grade C+. IG has the audience (8M views/mo) and no conversion; FB has conversion and a 570 base.
2. IG follows halved because reach halved (~275K to ~100K views/day), conversion per view fell (recaps vs own-first), and the break arrived; volume did not help.
3. Only carousels produce measurable follows (0.92/10K) but they explain just 22% of follows; the other ~75% is unmeasured. One in-app screenshot from Alex fixes that.
4. Reels: 21 posted, median 1.4K, 0 hits; they die on watch time (avg 5.5 s), not on a flag; the 09-25 statues reel had 9.6% sends/reach and 17% retention.
5. No account-wide throttle evidenced (carousels recovered to 20K/14K on 09-28); 25% soft-penalty risk on screenshot carousels; nobody re-checked Account Status since 09-22.
6. Comparables reach 0.3-0.4x followers per reel vs our 0.04x; @thehatecentral has 611K on X but only 29K on IG, so IG follows don't come from fame or views.
7. IG plan: cut to 2 own-first carousels + 1 reel + Story + broadcast daily, stop overnight drip and music-credit captions, and run a weekly collab ladder (first ask 10-02, kill 10-16).
8. FB: not primary (earns ~$0.7/day, 98% non-follower reach), but the best conversion lab; switch the kr 50/day ad from Page-visits to Page-likes now, run photo-first test today, invite reactors 10 min/day.
9. FB ad cost/follow is unreadable from current data (kr 1.2-6 depending on the baseline); read it from Ads Manager, cap at kr 3, scale only with evidence.
10. Judgement calls due 10-13: IG follows/10K ≥2 and net ≥+30/day or demote; FB follows/day >21 or stop the spend.
