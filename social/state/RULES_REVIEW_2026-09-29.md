# SHQ RULES REVIEW — 2026-09-29 (written 00:30–01:15 Oslo, for Alex's "know by tomorrow" ask)

Auditor: read-only. Nothing was posted, scheduled, deleted or edited. One new file (this one). Times are Oslo unless marked UTC (the Threads/IG Graph tables in `insights/*.md` are UTC = Oslo minus 2h).
Evidence tags: **[file]** = read in the repo/memory, **[api]** = read-only pull today (Metricool MCP analytics, Instagram Graph GET), **[calc]** = my arithmetic on those, **[unverified]** = could not check.

---

## HEADLINE VERDICT

1. **Hits are not what we lack; follows per view is.** Threads did 16.3M post-views in 30 days and had 6 posts over 250K in the last 8 days, yet a 2.72M-view day (09-24) netted +105 followers and a 1.83M day (09-25) +113. X's 1.36M-view post left the count at 45.2K to 45.3K. That is 0.4 to 4 follows per 10K views on every platform. At that rate 9,200/day needs 25M to 90M views a day; we make about 1M. "More hits" (TEAM.md §0) cannot close the gap; TEAM.md's "1 to 5K follows per hit" is false on our own data.
2. **Real net growth 09-23 to 09-28 is about +170/day** (Threads +610, FB +105, IG +23, X about +100 rounded, TikTok −6, YT 0, Bluesky about 0 = about +830 in 5 days), not the "~490/day" in TEAM.md (that was one day, 09-27). 1M by 01-01 is about 54× short and no rule change below reaches it; re-baseline to a target we can test (3 to 5× today, about 500 to 900/day) and judge every Friday on follows per 10K views.
3. **One concrete defect found tonight: 17 of the 22 Instagram reels published since 09-20 went out with `is_shared_to_feed=false`** (Reels tab only, not the grid or followers' feed; 19 of 29 since 09-18). Median 1.2K views (n=19) vs 2.9K (n=9) for reels shared to feed [Graph API + Metricool, calc]. Fix it before testing any format (change list #1).
4. **The 09-28 critic gate has no outcome data yet (12 hours old, nothing has 24h of results).** What we can prove: it added latency to live moments (Zidane), spent 34% of its verdicts on zero-follower channels, gave 26 of 27 PASSes exactly "8" (no resolution), and 11 of 27 PASSes were the critic approving its own fix. Keep it as a craft/safety gate, add a fast lane, stop treating 8/10 as a forecast, and run the blind backtest (Experiment 3) before trusting it further.
5. **Since 09-20 output volume went up and reach went down**: IG reel median 2.8K to 1.5K (28 to 20 reels), TikTok median 1.1K to 0.8K with 4 posts over 10K before and 0 after (38 to 43 posts), while on Threads posts/day and views/day correlate at 0.10 [calc]. Volume is not the lever; the caption template ("X fans … 😭" in about 79% of TikTok captions since 09-20 vs about 8% before, hand count) and the missing "reason to follow" are the suspects. Confounded by the international break, so treat as strong smell, not proof.

**Do today (in order):** IG feed flag fix, hit-conversion package + one numbered daily series (Exp 1), fast lane for live moments (Exp 2), critic backtest (Exp 3), cap the three zero-follower channels at "free mirror only".

### Evidence gaps (say it out loud)
- X has no API/analytics access from here: our X per-post data is manual (library entries) and follower count is rounded to 0.1K (±50). Every X follow claim below is an upper bound.
- No post published after the 09-28 12:31 gate has 24h of data; the critic's accuracy vs outcomes is **unmeasurable today** (section 3 says what can be said).
- `posts_log.jsonl` has 47 rows, all from 09-28 14:46 onward, `metrics` is null on every row, Chrome X posts are logged with the profile URL (no post id), and Threads/Bluesky/Telegram rows share one Postiz id. No join from verdict to outcome exists.
- `node social/insights.mjs --hours 720` times out (mine ran 7 min and returned nothing; the Snapchat shortlist file records the same timeout at 150 s). I used Metricool's analytics and the saved insights files instead.
- No per-post follows on X, TikTok, YT, Threads, IG reels, Bluesky, Telegram, WhatsApp, Snapchat. Only IG feed posts and FB reels have per-post follows.
- Calendar confound: 09-21 to 10-10 is the international break (no Premier League). Pre-09-20 data includes PL weekends and transfer deadline day. Retest on 10-10 (El Clownico).

---

## 1. WHAT ACTUALLY PRODUCED VIEWS AND FOLLOWS (30 days)

### 1.1 Platform-by-platform scoreboard (numbers)

| Platform | 30-day reach | Best posts (views, follows where known) | Bottom / median | Follows per 10K views | What a "hit" is |
|---|---|---|---|---|---|
| **Threads** [api Metricool + insights] | 16.28M post-views over 30 days, 20 posts/day avg; median day 183K; **top 3 days = 56% of all views** (09-21 4.51M, 09-24 2.72M, 08-31 1.85M) | T-01 Spurs 33-wins maths 3.29M (09-21 13:07, 4,945 likes); T-02 Sky/Saka lower-thirds 2.70M (09-24 16:25); T-03 Ramos VAR receipt 1.43M (08-31); T-04 Jude/Romero quote 1.21M (09-21 22:48); T-05 "three most terrifying hairstyles" 840K; T-06 "I'm crying 😭😭😭" 373K; T-07 Yamal question+card 295K/351 replies; T-08 Dortmund receipt 261K/200 replies (Sat 09-27 13:34, no news peg); T-09 684 maths 260K/8,279 likes/244 reposts [bangers/LIBRARY_x_threads.md] | Median post about 1.2K views (400 posts/30d, memory 09-23). Live NOR-POR block 09-27: 8 posts, 162 to 1,263 views, 0 to 12 likes. Snapchat joke 346 views | **0.4 to 0.6** (09-24: +105 on 2.72M; 09-25: +113 on 1.83M [followers.csv + Metricool]); 5-day +610 | ≥250K views (about 200× median), ≥100 replies. Yields about +100 to 150 followers that day |
| **X** [file only] | 3.5M views/28d (Alex's read 09-23, unverified) | 684 maths 1.36M views/77.7K likes (09-25 16:32, +51 min after Ornstein); Baguette Adama Traore 781K (09-12); Cardio Man 732K (09-12); "loyal whores" 544K (09-02); Spurs 33 maths 380K (09-24) | Since 09-25 every X post of ours 479 to 1,744 views; flops X-50 to X-54: 498 to 1,400 views, 5 to 40 likes | **≲1** (45.2K on 09-23 to 45.3K on 09-28 with a 1.36M-view post inside the window; rounding ±50) | ≥300K views or ≥15K likes (our median is about 900 views, so a hit is about 1,000×) |
| **Instagram feed** [file + insights] | 8.25M views/30d, follow rate 0.01%, net about 0 | Xavi v Klopp carousel 83.5K views/1,621 shares/8 follows (0.10/1k); Tekkers 52K/2 follows; own-fake-official-first carousel CAR-02 24.4K views/596 shares/**12 follows (0.49/1k = 4.9 per 10K, our best)**; Arsenal "3 titles" carousel 24K/12 follows | City day-2 to day-4 carousels 2.4K to 5.1K, 0 follows (3 in a row); IG net follows/day: 09-15 to 09-19 avg 77 (120,59,56,63,89), 09-20 to 09-26 avg 36 (38,50,37,38,26,39,25); unfollows steady 20 to 30/day | 1 typical, 4.9 best | ≥40K views AND ≥5 follows |
| **Instagram reels** [api Metricool + Graph] | 48 reels in the window | Pre-09-20: 30.6K (Goldbridge/Everton), 27.9K (Emery), 23.3K (Emery), 7.4K, 5.9K. Since: Lee Kang-in 11.2K, plate reels 6,153 (statues), 4,225 (Onana) | Since 09-20 median **1,545 (n=20)** vs **2,811 pre (n=28)**; three reels at 3, 13, 14 views (09-21 evening); IG never reports follows per reel | unknown (no per-reel follows) | ≥10K views (median 1.5K) |
| **TikTok** [api Metricool] | Pre-09-20: 38 posts/13 days, 362K views, median 1,089; since: 43 posts/9 days, 41.7K views, median 794 | 220,427 (08-31 "Nah if only Goldbridge knew 😂😂"), 73,033 (09-01 "Sky sports … lost the plot"), 19,945 (Goldbridge/Everton), 13,738 (De Zerbi payout). Since 09-20 best: 5,401 (Townsend), 5,077 (City guilty) | 43 posts since 09-20, **0 above 10K**, 27 under 1K | followers 16,213 (09-23) to 16,207 (09-27) = **−6 in 4 days** | ≥10K (4 in 30 days, all before 09-20) |
| **Facebook** [file + insights] | 44.6K (09-26) and 65.7K (09-27) views/day | Reels: 78.6K (Spurs v Villa 3-word plate), 44.5K (Not the bees), 42.3K (684 card ≈30 min after the story), 42.2K (Goldbridge "Icewallowcom"). IG-app cross-posts early Sept: 113K/65 follows, 103K/39, 56K/17, 33K/37 | Floor 26 to 60 views (the "therapists", "hurdles", "cricket fan" flops) | **2 to 11** (113K:65 = 5.8; 33K:37 = 11.2; 09-27 65.7K:+29 = 4.4; 09-26 44.6K:+9 = 2.0). Best converter we have | ≥40K plays; binary (escapes or dies at about 30) |
| **YouTube** [insights 09-28] | 30 subs, 0 gained in 28 days, 13 days flat | Brighton v Arsenal "highlights" 1,397 (129% watched), Spurs three-down 1,180 (132%) | everything else 17 to 109 | 0 | ≥1K with ≥120% watched (2 in 28 days, both same-night) |
| **Bluesky** [api Metricool + file] | 1,327 to 1,332 all week | n/a | 13 to 16 posts/day, 8 likes total, 12 of 16 on zero; 0 replies made before 09-28 | 0 | none yet |
| **Telegram / WhatsApp / Snapchat** | 2 / 0 / 0 at 09-28 21:30 | none | 21 of the critic's 62 verdicts were spent here | n/a | n/a |

### 1.2 What the hits have in common (from our own hits, not anyone else's)

1. **Image or clip first, always.** Every hit above has a picture that carries it; text-only X/Threads posts are our flop list (X-50 9 likes, X-51 30, T-20 257 views, T-21 355). [library]
2. **Two separate lanes, and we have been treating them as one:**
   - **Evergreen absurd lane (no speed needed):** Spurs 33-wins maths (3.29M Threads, posted on an international-break day, no match on), Sky/Saka lower-thirds (2.70M, Wednesday afternoon), hairstyles list (840K), Ramos "never forget when…" receipt (1.43M, 08-31), Dortmund receipt (261K on a Saturday with no story), Yamal question + comparison card (295K/351 replies). Posted 13:00 to 17:00 Oslo. None needed to be first.
   - **Moment lane (speed matters):** 684 at +51 min (1.36M X), FB 684 card at +30 min (42K), Jude/Romero on derby night (1.21M), post-match carousels at +18 to 23 min after FT (61.7K/31.6K/83.5K) vs 3 to 9K for daytime carousels. Late clones die (Mowler's identical clip 31K vs the original 2.64M; our Pep reel two days late 1.1K).
   - The plan's blanket "everything ≤3h or dead" rule is right only for lane 2. It got the 09-28 08:45 X post skipped ("13h old") while the biggest Threads/X posts of the month had no news peg at all.
3. **The target is a big fanbase, argued about.** Spurs, City (via Everton's 6 points), Arsenal (Saka/Arteta), Chelsea (bees), United (Goldbridge). High-reply posts leave a claim to dispute (Threads 100 to 351 replies). Mid-nation fixtures die: NOR-POR block averaged about 800 views and about 4 likes; IG NOR-POR carousel 1.7K; Highlights reel 665 to 1,545 views, 0 shares.
4. **On FB the escape rule is "funny with zero football knowledge" plus an audio punchline or first-out receipt**: Cage bees, Icewallowcom, slapstick blokes, 684 reveal. Literal vessels beat metaphors (bees 44.5K vs hurdler 34).
5. **Route matters less than content.** Early on all FB follows came from Alex's IG-app cross-posts (113K/103K/56K/33K). Since 09-25 three of the four FB hits went out through the schedulers (684 card, Goldbridge, Not the bees on 09-20). The gate's premise "FB reach only comes from Alex's IG app" is out of date.
6. **Pre-09-20 posting looked different from post-09-20 posting.** Pre: short captions ("Mark Goldbridge is so unhinged man 😂", "Unreal technique from Emery"), no hashtags, raw clips, 😭 in about 8% of TikTok captions. Since: plates + hashtag strings + "X fans … 😭" in about 79% of TikTok captions (hand count of 43 captions). Fixed cause unproven (confounds above), but it is the biggest visible change on the two platforms where reach dropped.
7. **What converts (few data points, but the only ones):** an own fake-official slide first + fanbase-mock frame + joke CTA (CAR-02: 4.9 follows/10K, 5 to 25× our recap carousels); FB reels that escape (3 to 11/10K); the "Day five of the international break" numbered carousel (best for follows per the 09-24 read). Recap carousels and neutral news convert at about 0 to 1 per 10K.

### 1.3 Bottom of the pile (what to stop)
- IG daytime carousels on a day 2 to 4 story: 2.4K to 5.1K views, 0 follows (3 City carousels in a row). IG singles: 0 follows on all of them (Ronaldo "speaks" 1.4K to 2.2K).
- Live text blocks on mid fixtures (NOR-POR: 16 Threads posts, 13 to 16 Bluesky posts that night, 12 of 13 Bluesky on 0 likes).
- Recaption reels of the reel-shape we now mandate: 09-21/22 Postiz reels 3, 13, 14, 151, 261 views; FB flops 26 to 34 views.
- Quiz/static-card/prediction video (0 likes, deleted), maths cards as YT Shorts (17 to 35 views).
- YouTube as a whole: 0 subs in 28 days.

---

## 2. RULE AUDIT (KEEP / TWEAK / SCRAP / NEW)

Volume before/after the 09-28 gate: Postiz create-calls per day 09-23 to 09-28 were 80, 61, 55, 56, 43, 28 [postiz_calls.log]. The decline started five days before the gate (the 09-22 reset), so the gate did not cause it. On 09-28 the recorded posts were 13 before 12:31 and 22 after (7 of those Telegram mirrors). Views per post after the gate: unmeasurable (12 hours). The only two PASS-8 items with any data: IG "Bench GOAT" reel 1,096 views (below the 1,545 post-09-20 reel median; also `is_shared_to_feed=false`) and Threads "Snapchat 0 followers" 346 views at 3h (Threads median 1.2K). n=2, meaningless statistically. Honest answer to "did the gate reduce volume without raising hit rate?": **volume: not much; hit rate: unknown; latency and critic capacity: yes, measurably.**

### 2.1 Mechanical rules (gate.mjs, review.mjs, review-guard hook)

| Rule | Verdict | Evidence | Reason |
|---|---|---|---|
| Critic PASS ≥8 on exact caption, every platform, every post | **TWEAK** | 62 verdicts/12h; first-pass PASS 20 of 55 distinct drafts (36%); 26 of 27 PASSes are exactly 8; 11 of 27 PASSes came after applying the critic's own fix; 21 of 62 on Snapchat/Telegram/WhatsApp | Keep as craft+safety gate for X, Threads, IG, TikTok. Add fast lane for live moments; review an asset once with `--platforms` instead of once per mirror; separate bar per platform (see 3.5) |
| Live-moment posts pass the same critic queue | **TWEAK (fast lane)** | Zidane sprint: X drafts FAILed 21:11, IG reel PASS 21:52, scheduled 00:08; TEAM.md says we were 25 min late. Rival template on the same clip did 54K | Editor self-check + post, critic audits within 2h (Exp 2) |
| PASS valid 36h, keyed on exact words | KEEP | works (review.mjs) | fine |
| Gate exists only for Postiz + Metricool; Chrome X posts are honour-system (`review.mjs check` by hand) | **TWEAK** | posts_log has 2 Chrome X rows, no post ids; 2 X posts on 09-28 ran before the gate | Wrap X compose in a script that checks + logs the post URL, or accept X is un-gated and audit it |
| Repeat block (dHash + same-text) | KEEP | prevented Endrick/Bluesky doubles | cheap and proven |
| FB via Postiz: reels only, pictures blocked, "max 4/day" warn | **TWEAK** | 3 of 4 FB hits since 09-20 were scheduler-routed; block text still says "FB reach only from Alex's IG app… 0 to 33 views" | Update the message; lift the 4/day cap to 8 for Exp 5; pictures allowed via Metricool test already planned |
| Silent video blocked on TikTok/IG/YT | KEEP | Alex deleted the quiet quiz reel | allow a "sound-to-add" flag for Alex-inbox TikTok drafts |
| Double-audio block, IG >10 slides block, Kalshi/Stake block, empty caption block | KEEP | each is an API/legal/brand fact | none |
| Tragedy regex hard-blocks `dead`, `death`, `killed` | **TWEAK** | 0 of 127 recorded captions hit it, but "the title race is dead", "dead rubber", "I'm dead 😭", "killed the game" are everyday banter | hard-block died/funeral/cancer/suicide/murder/stabbed; make dead/death/killed a warn |
| Sensitive words need `PZ_SENSITIVE_OK=1` | KEEP (as warn) | 4 of 127 captions (3%), all City sanctions posts, our biggest story | one flag, low cost |
| **Hashtag ban (IG/FB/X/Threads)** | **TWEAK, enforce or drop** | Not in the gate. Critic PASSed hashtagged IG captions 4 times on 09-28. TikTok/Snap posts all carry tags; LIBRARY_video says TikTok wants 4 to 6. IG's best reel since 09-20 (Lee, 11.2K) had 5 tags. Pre-09-20 hits had none | No evidence either way, so it is a distraction. Rule: none on X/Threads, up to 3 topical on IG/TikTok/YT/Snap; put the check in the gate or delete the rule |
| **Metricool IG reels must pass `showReelOnFeed:true`** | **NEW (P0)** | 19 of 29 reels since 09-18 `is_shared_to_feed=false`: every reel since 09-20 except Lee, the three City-day-1 reels and the 09-28 Zidane reel; median 1.2K vs 2.9K | Reels-tab-only means no grid, no feed to followers, no profile conversion; add to review-guard and to the Postiz IG settings |
| Metricool plan limit | **NEW check** | HANDOFF says free plan 20 posts/month; posts_log shows 13 Metricool posts on 09-28 alone [unverified] | verify today; if true, the "3 reels/day via Metricool" plan is impossible past day 2 |

### 2.2 Critic tests and shq-draft rules

| Rule | Verdict | Evidence | Reason |
|---|---|---|---|
| FIRST QUESTION: what will people DO (send / comment / laugh), name who | **KEEP** | Matches our hits: Threads hits carry 100 to 351 replies, FB hits are tag-a-mate | best rule in the system |
| "Interesting" caps at 6; body test; who-cares test | **KEEP, backtest** | Alex vetoed a PASS-8 Sweden stat post; same rubric FAILed the Gyökeres carousel Alex loved | see section 3: rubric is right on flat facts, wrong on hype-reaction formats |
| "Most drafts should FAIL; a quiet day with 2 great posts beats 10 filler" | **SCRAP the prior** | FAIL rate 64% (first pass); 0 of 3 Threads drafts passed, and Threads is where 6 posts >250K came from. Threads posts vs views correlate 0.10, so more posts alone doesn't help, but a flop costs about nothing there | a prior that says "fail" biases every score down; set the bar by cost of a flop per platform |
| Score 0 to 10, PASS ≥8 | **TWEAK** | 26 of 27 passes = 8 | scores are a threshold, not a forecast; require a predicted view bracket (<1K / 1 to 5K / 5 to 50K / 50K+) so outcomes can be compared |
| Critic writes a --fix, then re-scores the fixed version | **TWEAK** | 11 of 27 passes were "fix applied" (18:15 FAIL 6 to 18:16 PASS 8 on X) | second reader (fresh instance) for fixed drafts, or accept as "Editor decision" not "critic PASS" |
| One verdict per platform per mirror (Snapchat, Telegram, WhatsApp) | **SCRAP for mirrors** | 21 of 62 verdicts; the review supports `--platforms` | one review per asset |
| Never post "a stock template on a clip everyone posted 25 min ago" (critic rule 6, orig) | **TWEAK** | It FAILed "nobody told zidane it's only the nations league" (UTDTrey 54K, the same template) and the fix line was posted hours later | in moment lane, derivative-but-fast with our own frame is fine; originality bar applies to evergreen |
| shq-draft: pick format family, 3 candidates, write why a stranger reposts | KEEP, time-box | good discipline | max 5 min in live mode |
| X 2 to 8 words, image carries the joke, never explain | KEEP | x_own_top: all 20 top posts 2 to 6 words; flops X-50 to 54 explain or lack an image; maths cards exempt | as is |
| Caption = one line + max 1 to 2 sentences, never a slide list; never repeat a CTA within 7 days | KEEP | Alex cut the numbered caption; four repeated "Which slide got you?" IG posts | as is |
| Ragebait floor (no tragedy/minors/slurs/betting) | KEEP | brand safety | as is |
| Live mode: search X for the same joke in the last hour, change angle if out | **TWEAK** | slows the fast lane | keep for evergreen lane only |

### 2.3 Playbook / PLATFORM_PLANS / TEAM rules

| Rule | Verdict | Evidence | Reason |
|---|---|---|---|
| **"Targets are ceilings, never quotas" vs PM grades adherence to counts** (09-27 checklist scored 6 of 21; "X 10 posts + 25 replies") | **SCRAP count-grading** | Contradiction: critic says no quota, PM says 6/21 | grade the PM on hits, follows per 10K views and time-to-post, not a checklist |
| Hit conversion: within 1h of any 5× post, pin + follow reply + follow-up | **KEEP, make it the #1 rule; verify it runs** | Conversion is the bottleneck (1.1); [unverified] whether the 684 post is pinned (X pin was "loyal whores" on 09-24) | Exp 1 |
| "Each hit brings 1 to 5K follows" (PLATFORM_PLANS, TEAM §0) | **SCRAP the claim** | 2.72M views day +105; 1.36M X post about +≤150; 33-wins 2.26M = +330 to 430 (memory 09-22) | plan maths built on a false number |
| TEAM "Doing today 100 to 200 net/day … ~490/day" | **CORRECT** | 5-day mean +170/day [calc] | use 5-day means |
| "Speed: ≤5 min per moment, ≤15 min quote-posts, next morning only with a new angle" | **TWEAK** to two lanes | evergreen hits in 1.2 | moment lane = speed; evergreen lane = anytime 13:00 to 17:00 Oslo daytime slot, no "13h old" veto |
| X: 25 replies/day under Ornstein/Romano/TouchlineX/brfootball | **TWEAK** | 11 to 13/day done 09-28; no measure of return (no X reply analytics) | keep at 10/day until an instrument exists (Alex's X Analytics weekly) |
| X: kill <300 views @6h, Threads <100 @12h; daily delete duty | **SCRAP as daily duty** | deleted.md has 5 rows, 3 are pre-publish pulls; PM item never done | opportunistic only; deleting doesn't change the median |
| IG: 3 reels/day + ≤2 carousels + 1 story; no singles | **TWEAK** | reels median 1.5K and 17 of 22 hidden from feed; carousels: post-match 31 to 83K, daytime 2 to 5K; singles 0 follows but our best share seam is small blunt fanbase images (Liverpool full-backs 20 to 30% share rate) | after fixing the flag: 1 to 2 reels/day, post-match carousel only (≤25 min after FT), no daytime recap carousels |
| IG: 5 to 6 carousels/day (09-24 playbook line) and carousels "schedule themselves ≥3h ahead" | **SCRAP** | superseded; contradicts ≤25 min post-match rule and IG surgery | delete from playbook |
| City vetoed for carousels, allowed for reels; day 1 or nothing | KEEP | day 1 24 to 36K, day 4 2.3K/0 shares | as is |
| Own fake-official slide first (was "never own first") | **TWEAK, test** | CAR-02: 12 follows on 24K views | Exp 1 |
| TikTok: only own graphics/meme templates, never creator clips | **TWEAK** | TikTok confirmed "unoriginal, low-quality, QR" on 2 re-uploads. But since 09-20 all 43 posts were eligible-style and none passed 5.4K; vidIQ outliers (1.3 to 2.1M) reuse film clips | keep it for football footage; allow film/TV vessel + our plate as a controlled daily test; flag Alex's "Ineligible?" screenshot per post |
| TikTok 3 posts/day | **TWEAK** | +60% volume, −27% median, hits 4 to 0 | 1 to 2 best per day |
| Alex-dependent steps (TikTok sound, IG reels, numbers in chat: 5 asks/day) | **TWEAK** | PM 09-27: 6 of 21; "be independent" | cut Alex's tasks to ≤2/day, everything else runs without him |
| YT: formats A/B only, max 2/day | KEEP | kill rule fired (5 of 5 Shorts <300 @48h) | YT is the lowest-value platform; by-product only |
| YT "club series" Mon to Sun from 09-29 | **SCRAP or reconcile** | contradicts A/B-only kill rule, series read 13 Oct with 30 subs | drop unless it's a by-product of moment posts |
| Threads: 2 receipts/day + 3 takes; text posts need a take | KEEP | receipt/argument posts are the top of the Threads list | as is |
| **Threads hourly X-screenshot singles (09-29 to 10-01)** | **KEEP, add measures** | ~14 posts/day; Threads posts/day vs views r=0.10; median 1.2K/post | pre-registered kill exists; add daily follows (THEV03) and "do our other posts lose reach" |
| Bluesky: 3 originals + 15 replies/day; mirror Threads live block | **SCRAP the mirroring, keep 5 replies/day** | 16 posts to 8 likes, 0 replies, 1,327 to 1,332 all week; Bluesky MAU −27% (single-sourced) | 20 min/day; if <1,340 on 10-06 then replies only |
| Facebook ≥1 post per 4h in waking hours (TEAM §4 #4, coverage.mjs) | **SCRAP hard rule** | FB critic FAIL 5 of 7; coverage pings = quota pressure | soft floor 3/day; FB is a lottery (7% escape rate) so tickets matter more than critic fear (Exp 5) |
| FB follow ad kr 50/day, judge 09-30, pause if >kr 3/follow | KEEP | ad is confounded with FB follow numbers from 09-28 | read Wed as planned |
| FB single-image test via Metricool 3/day (09-29 to 10-02) | KEEP | Postiz FB photos 0 to 17 reach (different route) | judge on per-post `post_video_followers`-equivalent reach |
| Telegram 10 to 15/day; WhatsApp 3/day; Snapchat 5 to 8 Spotlights/day, "50K in a week" | **TWEAK: cap** | 2 / 0 / 0 followers; Snap needs 50K + 15K view-hours; WhatsApp has no discovery; 34% of critic runs | free mirrors of already-PASSed assets only; no Chrome time, no separate reviews; Snap sprint as a 7-day measurement (OneUp ends about 10-05), read Spotlight views/day |
| 8-role team + PM hourly + Radar 15 min + 36KB PM report | **TWEAK** | one editor still does everything; PM report file is 36KB | PM report ≤1 page, PM grades outputs; measure tokens per follow before adding roles |
| Correction: "Alex approves every X post" (09-24) | SCRAP | superseded by standing OK (09-27) | delete |
| Money: `social/state/money.md` cost table | **NEW** | file does not exist; Alex 09-28: costs rising | one table: tool, monthly cost, follows attributed |

---

## 3. CRITIC ACCURACY

**Can we compute "does the score predict views/follows"? No, and here is why.** All 62 verdicts are from 09-28 10:32 to 21:53. The only items that have run 12h or more and have outcome data are two PASS-8s (above). `posts_log.metrics` is null on every row.

What the record does show:
- **Score resolution is nil.** PASS scores: 26 at exactly 8, 1 at 9 (a calibration on the 684 post, whose outcome the critic already knew: it is not blind). FAIL scores 2 to 7. There is nothing to rank views by.
- **Self-approval loop:** 11 of 27 PASSes were "fix applied verbatim" re-reviews (X Snapchat joke FAIL 6 at 18:15 then PASS 8 at 18:16; Belgium maths PASS 8 at 20:39 and again at 20:40).
- **Alex overruled it in both directions on 09-28:** Gyökeres/Zidane carousel critic 5 to Alex "that's great" (critic re-scored 8 after his call); Goldbridge Snapchat reel critic 6 to Alex yes; Sweden stat post critic 8 to Alex "not funny, not sharable" (critic then re-passed a rewrite at 8). taste.jsonl has only 3 rows. Pattern: **too harsh on fan-hyperbole/reaction formats, too generous on true-fact-plus-contrast**.
- **Rubric fit vs our own hits (my reading, not a critic run):** by the current rubric, "The three most terrifying hairstyles" (840K), "I'm crying 😭😭😭" (373K, the library itself says it couldn't decode the link), and "Baguette Adama Traore" (781K views, 0.2% like rate) would likely score ≤6 (no explicit joke / no clarity). That is 1.99M of the views in our top-10 Threads/X list from posts a strict rubric may block. Hypothesis, needs the backtest.
- **Critic also killed the fastest format the day's winners used** (stock "nobody told Zidane it's the Nations League" template = UTDTrey 54K).

**Calibration changes (in order of value):**
1. Run the blind backtest (Exp 3) before trusting the gate any further.
2. Replace the single 8/10 with the action label (SEND / ARGUE / LAUGH / NEWS) + a predicted view bracket. Log both to posts_log at post time; fill actuals at +24h automatically.
3. Per-platform bar: X feed and IG feed ≥8; Threads and FB reels ≥7 (a flop costs about nothing; on FB a 7% escape rate means tickets are cheap); Snapchat/Telegram/WhatsApp inherit the parent asset's verdict.
4. Add the hyperbole/disbelief format as an explicit PASS anchor (already noted after Alex's overrule) and add the evergreen-absurd hits (Sky/Saka, hairstyles, Dortmund, Yamal card) as anchors so it stops reading them as "no joke".
5. Fresh-instance rule for fixed drafts; critic must not be shown its own earlier verdict.
6. Drop the "most drafts should FAIL" instruction; state the cost of a false FAIL (a missed hit) next to the cost of a false PASS.
7. Every Alex "yes" on a FAIL or "no" on a PASS goes to taste.jsonl the same hour (3 rows in 12h is too few to calibrate anything).

---

## 4. WHY WE'RE STAGNANT: top 5 structural causes (ranked by expected impact)

**1. Views do not convert, and the plan is built as if they do.** 0.4 to 4 follows per 10K views everywhere; 8.25M IG views, about 0 net; 2.7M Threads views, +105. IG follow rate is 0.01%; profile visits are 0.23% of views; 15 to 20% of visits follow (normal). The leak is before the profile.
Smallest 72h test: "Hit-conversion package" on the next post that passes 5× platform median: pinned self-reply follow line within 60 min, bio line matched to the post, and on IG a joke CTA + own slide. Record follows per 10K views vs the baseline above (Exp 1).

**2. No reason to follow: no recurring identity, and the caption template is homogenised.** Sameness ("X fans … 😭") in about 79% of TikTok captions since 09-20 vs 8% before; only recurring things that worked for follows were numbered/fixed-form (the "Day five" carousel, the own fake-official slide). References convert through recurring form (thatguysjokes plate, Troll Football, Hater Central's stat-sheets).
Smallest 72h test: one named, numbered daily series at a fixed slot (Exp 1) and a ban on the 😭 suffix on 2 of every 3 posts.

**3. Latency: process is slower than the windows we say we're chasing.** Rule says X ≤5 min per moment; the loop is draft, mock-up, critic (FAIL), fix, re-review (each 1 to 40 min), schedule (Zidane reel scheduled 00:08 for a ~21:00 moment). PM found 6 of 21 items done on 09-27; 09-28 PM sweep lost 4h to stalled calls, and every draft then scored timing 3/10. 
Smallest 72h test: fast lane, measured by "Radar saw it HH:MM, posted HH:MM" (Exp 2).

**4. Reach regression on the reel platforms since 09-20, with one hard defect and several unproven suspects.** IG reel median 2.8K to 1.5K; TikTok 1.1K to 0.8K; hits 3 (IG) and 4 (TikTok) to 1 and 0. Hard defect: 17 of 22 IG reels since 09-20 hidden from the feed. Suspects: plate template, hashtags, 😭 sameness, reposting others' clips (IG's 30 Apr 2026 originality rule), the international break. IG reach was already falling before 09-20 (261K on 09-14 to 57 to 60K on 09-22/26 per the IG diagnosis; follows/day 77 to 36).
Smallest 72h test: fix the flag today and read the next 6 reels (expect median ≥2.5K); then A/B raw-clip short-caption vs plate (Exp 4).

**5. Attention is spread over 11 channels while three proven ones are under-served, and instruments are blind where decisions are made.** 34% of critic verdicts and most Chrome time went to Snapchat/Telegram/WhatsApp (2, 0, 0 followers); TikTok, X, YT, Bluesky have no per-post follows; the 09-28 pace number in TEAM.md is a one-day peak. Threads (16.3M views, top 3 days 56%), FB (only platform converting 2 to 11/10K) and X (45K base, 1,000× hits) get less craft than mirrors.
Smallest 72h test: cap the three new channels at free mirrors; put the freed critic + Chrome time into Threads daytime receipts, FB tickets (Exp 5), and X replies with a weekly X-Analytics read.

(Also true but lower: the Alex bottleneck (5 asks/day), and the 1M target maths itself. Not a cause of last week's flatness but it makes every plan look failed.)

---

## 5. FIVE EXPERIMENTS FOR THE NEXT 7 DAYS (09-29 to 10-06)

Pre-condition for all IG tests: `showReelOnFeed:true` on every reel; verify with the Graph call in `reference_metricool_connector.md` after each publish.

### Exp 1. Series + hit-conversion package (Owner: Editor executes, Producer builds card, PM measures)
- **Hypothesis:** a named, numbered daily series plus a fixed conversion routine lifts follows per 10K views at least 2×, because today follows come from posts that give a reason to follow.
- **Rule/format change:** (a) One series, one template, numbered, same slot daily 13:30 Oslo on Threads + X + IG feed: "🚨 THE DAILY NUMBER #N" (the 684/33-wins family; deadpan, image that proves it, our own fake-official first slide on IG, CTA line on last slide: "Following us takes one second."). (b) Any post >5× its platform median gets, within 60 min, a pinned/self-reply follow line and a matching bio line. (c) Ban the 😭 suffix on 2 of every 3 posts.
- **Success metric:** Threads net follows on series days ≥ +200/day (5-day baseline mean +122/day, THEV01/followers.csv); IG series carousel ≥3 follows per 10K views (median about 1, best 4.9); X follows ≥ +40/day (baseline about +20/day, rounded).
- **Kill:** after 5 series posts, if Threads follows/10K <1.0 AND IG <1.5, drop the series (keep the pin/reply routine if it costs <5 min).
- **Owner:** Editor (posts), Producer (card), PM (reads followers.csv + Metricool THEV03 each morning).

### Exp 2. Fast lane for live moments (Owner: Editor; critic audits)
- **Hypothesis:** the moment lane is lost to latency, not taste; posting on a self-check and auditing after recovers windows without lowering quality.
- **Rule change:** for X/Threads posts triggered by a matchwatch event or a "Trending now" card (age ≤30 min), Editor posts after a 4-line self-check (image carries it with caption covered; ≤8 words or maths shape; fact-checker if a number/quote; no hard-fail category). Critic audits the batch within 2h; audit FAIL = delete + taste row. Everything else keeps the gate. Radar logs "saw HH:MM" in board.md; Editor logs "posted HH:MM".
- **Success:** median saw-to-post ≤10 min over 10 moments; ≥1 X post per big moment; X median views ≥1,500 (09-26 to 09-28 range 479 to 1,744, median about 900).
- **Kill:** after 10 fast-lane posts, median views <700, or ≥2 audit FAILs for a factual/sensitive reason.
- **Owner:** Editor; Radar (timestamps); critic (audit); PM (report).

### Exp 3. Critic blind backtest + shadow forecast (Owner: critic, PM)
- **Hypothesis:** the current rubric passes fewer than 2/3 of our known hits (a gate that blocks hits is worse than none on that platform).
- **Design:** 24 posts with known outcomes, shuffled, numbers hidden: 12 hits (T-01, T-02, T-03, T-05, T-06, T-07, T-08, T-09, X-40, X-41, X-43, FB-01) and 12 flops (X-50 to X-54, T-20 to T-22, FB-05 to FB-07). Fresh critic instance, current rubric, then a "First Question only" variant. Then, for 7 days, the critic writes a predicted bracket + action label per draft; PM compares at +24h.
- **Success:** current critic passes ≥8/12 hits and ≤4/12 flops; shadow forecast within one bracket ≥60% of drafts (n≥40), Spearman ≥0.3.
- **Kill / decision:** if it passes <6/12 hits, downgrade the critic from gate to advisor on X and Threads (hard-fail categories stay hard); if forecasts land ≤40% within a bracket, drop the score and keep the action label only.
- **Owner:** critic runs; PM writes the table into social/state/review/.

### Exp 4. Reel style A/B on IG and TikTok (Owner: Producer; PM reads)
- **Hypothesis:** the post-09-20 look (white plate, 7 to 16 words, hashtags, 😭) underperforms the pre-09-20 look (raw or lightly edited clip, 3 to 8 word caption, no hashtags, no 😭) by at least 2×.
- **Change:** alternate A/B on the same story day, 6 pairs each on IG and TikTok, `showReelOnFeed:true`, caption style is the only variable; TikTok B uses film/TV vessel or our own graphic, never football broadcast footage.
- **Success:** B median ≥2× A, or either median ≥3K (post-09-20 median 1.5K) with one reel >10K.
- **Kill:** after 6 pairs, both medians <2K: the format premise is wrong; move Producer time to Exp 5 and Exp 1.
- **Owner:** Producer; PM (Metricool IGRE/TKPO reads).

### Exp 5. FB ticket volume (Owner: Producer; PM)
- **Hypothesis:** FB is binary (escape or 26 to 60 views) with about a 7% escape rate (2 hits in about 28 scheduled reels 09-25 to 09-28); more qualified tickets means more escapes, and FB converts best (2 to 11 follows per 10K).
- **Change:** FB reels only, critic bar 7 for FB, target 6/day (cap raised from 4), every reel must be funny with zero football knowledge or have an audio punchline or be first-out on a receipt. Log route (scheduler/native) and read `post_video_followers` per reel.
- **Success:** ≥2 reels ≥30K views in 7 days AND FB net follows ≥ +250 in the 7 days (baseline +21/day; the kr 50/day ad from 09-28 is a confound: read it separately from the Wednesday cost/follow figure).
- **Kill:** <1 escape in the first 25 reels, or per-reel follows <2 per 10K on escapes.
- **Owner:** Producer; PM.

---

## 6. MISSING INSTRUMENTS (and the cheapest way to get each)

| We can't measure | Why it matters | Cheapest fix |
|---|---|---|
| **X followers and per-post views/follows** | biggest "1,000× hit" platform, follower count rounded to 0.1K | Alex exports X Analytics (followers + top posts) weekly (2 min), pasted or dropped in social/state/x/; log Chrome post URLs at post time |
| **TikTok per-post follows, FYP share** | TKEV08 (new followers) and TKPO16 (For You share) come back null; only followers-per-day works (TKEV07) | daily follower delta vs views from TKEV02; Alex screenshots Studio for any post >5K |
| **IG per-reel follows** | Meta doesn't expose them | daily IG follows vs reels views; plus reel-level shares (Graph) |
| **Threads per-post follows** | not exposed | daily THEV03 delta vs THEV06 views into scoreboard as follows/10K |
| **Feed-share flag on reels** | just found it by accident | one line in the daily insights run: list reels with `is_shared_to_feed=false` |
| **Outcome join for the critic** | posts_log metrics null, Chrome rows no id, mirrors share ids | a `postlog fill` cron at +24h using Threads API / IG Graph / Metricool reads; log post id at the moment of posting; one row per platform post |
| **30-day insights** | script times out | cache prior days, only pull the last 72h + Metricool rollups |
| **Telegram joins/leaves** | volume rule says "judge by leaves > joins" but nothing reads it | Bot API `getChatMemberCount` daily (the bot is admin) |
| **WhatsApp channel followers, Snapchat followers and Spotlight views** | Snap sprint has no daily number; WhatsApp has no API | public page scrape via Firecrawl for follower count; Spotlight views by hand from profile.snapchat.com once a day (PM) |
| **X and Bluesky reply return** | 11 to 25 replies/day with no return number | Bluesky: public API on our reply posts; X: Analytics profile-visit/follow deltas on reply-heavy days |
| **Money in vs out** | "every paid tool needs an ROI case", money.md missing | 1 table: Metricool, OneUp, Higgsfield, vidIQ, Postiz, X Premium vs FB $ (0.56/day at 65K views), X OCR, IG bonus |
| **Metricool plan limit** | 13 Metricool posts on 09-28; HANDOFF says 20/month | ask Metricool `getBrandSettings`/plan page today |

---

## CHANGE LIST (one page)

| # | Rule | Action | Why (evidence) | Owner |
|---|---|---|---|---|
| 1 | IG reels via API | **NEW:** always `showReelOnFeed:true`; verify after publish; add to review-guard | 19 of 29 reels feed-hidden; median 1.2K vs 2.9K | Producer |
| 2 | Growth model in TEAM/PLATFORM_PLANS | **SCRAP** "1 to 5K follows per hit" and "~490/day"; use 5-day means and follows per 10K views | +170/day real; 0.4 to 4 follows/10K | PM |
| 3 | Target 1M by 01-01 | **TWEAK:** keep as stretch, add a testable target (3 to 5× = 500 to 900/day) | 54× gap | Alex + PM |
| 4 | Hit conversion (pin + follow reply + bio, ≤60 min) | **KEEP, enforce, log** | conversion is the bottleneck | Editor |
| 5 | Daily numbered series | **NEW** (Exp 1) | only recurring/own-first forms converted (4.9/10K) | Editor + Producer |
| 6 | Critic gate | **TWEAK:** fast lane for live moments; one review per asset; per-platform bar (X/IG feed 8, Threads/FB 7) | Zidane latency; 21/62 verdicts on 0-follower channels | Editor, critic |
| 7 | Critic scoring | **TWEAK:** action label + predicted bracket, no auto-8 after own fix, fresh instance for fixes, drop "most drafts should FAIL" | 26/27 = 8; 11/27 self-approved; Alex overruled 3× | critic |
| 8 | Critic backtest | **NEW** (Exp 3) | no outcome data exists | critic + PM |
| 9 | Speed rule | **TWEAK:** two lanes (moment = speed; evergreen absurd = daytime 13 to 17h, no age veto) | biggest Threads/X hits had no news peg | Editor |
| 10 | Live coverage on mid fixtures | **KEEP** max 3 posts, big fixtures only | NOR-POR block about 800 views/post | Editor |
| 11 | IG daytime carousels, singles, City day 2+ | **SCRAP**; keep post-match carousel ≤25 min after FT | 2 to 5K/0 follows vs 31 to 83K | Producer |
| 12 | IG reel format | **TEST** raw+short vs plate (Exp 4) | median 2.8K to 1.5K | Producer |
| 13 | TikTok cadence / eligibility | **TWEAK:** 1 to 2/day; allow film/TV vessel + our plate as a daily test; football footage still banned | 0 of 43 >10K since 09-20 | Producer |
| 14 | Hashtag ban | **TWEAK:** none on X/Threads; up to 3 on IG/TikTok/YT/Snap; enforce in gate or delete | unenforced, no measured effect | Editor |
| 15 | Caption sameness | **NEW:** no 😭 on 2 of 3 posts; vary the "X fans …" template | 79% vs 8% of TikTok captions | Editor |
| 16 | Tragedy regex | **TWEAK:** hard-block only died/funeral/cancer/suicide/murder/stabbed; dead/death/killed = warn | everyday banter words | Editor |
| 17 | FB routing/cap | **TWEAK:** update gate text; reels 6/day, bar 7 (Exp 5); keep pictures via Metricool test | 3 of 4 FB hits scheduler-routed | Producer |
| 18 | FB "≥1 post/4h" coverage rule | **SCRAP** hard rule; soft floor 3/day | quota pressure vs critic | PM |
| 19 | PM grading by checklist counts | **SCRAP**; grade on hits, follows per 10K, saw-to-post minutes; report ≤1 page | 6/21 checklist vs zero outcome grading | PM |
| 20 | Telegram/WhatsApp/Snapchat | **TWEAK:** free mirrors of already-passed assets; no separate reviews; no Chrome time; Snap sprint = 7-day measurement with a daily number | 2/0/0 followers, 34% of critic runs | PM |
| 21 | Bluesky | **SCRAP** mirroring; 5 replies/day; replies-only if <1,340 on 10-06 | 16 posts to 8 likes | Editor |
| 22 | YouTube club series, Goldbridge Shorts | **SCRAP** unless by-product of a moment post | 0 subs/28d, kill rule fired | Producer |
| 23 | Delete-flops daily duty | **SCRAP** as duty; delete only embarrassing/wrong | 5 rows in deleted.md, 3 pre-publish | Editor |
| 24 | Alex dependence | **TWEAK:** ≤2 asks/day, everything else autonomous | 6 of 21 done | Editor |
| 25 | Metricool plan | **VERIFY TODAY** (20 posts/month?) | 13 posts on 09-28 | PM |
| 26 | Instruments | **NEW:** X Analytics weekly, TikTok/Threads/IG daily follower deltas into scoreboard, `postlog fill` at +24h, feed-flag check, Telegram count via Bot API | section 6 | PM |
| 27 | Threads hourly screenshot test | **KEEP** to 10-01 with daily follows + "other posts lose reach" check | r(posts, views)=0.10 | PM |
| 28 | Money table | **NEW** `social/state/money.md` | costs rising, no ROI view | PM |

Read the results of Exp 1 to 5 on **Mon 10-05** with PM's table; retest reel formats again on **10-10** when the Premier League returns.
