# AUDIT: text-platforms (X + Threads), 2026-09-29 12:30 Oslo
Auditor: text-platforms. READ-ONLY (only GETs on the Threads API via the insights Keychain token, plus web reads; nothing posted, edited or deleted).
Tags: [DATA] = measured, source given · [INFERRED] = my reasoning from data · [GUESS] = unverified. All times Oslo (UTC+2) unless "UTC". "Hit" = >=10K views (Threads median is 1.2K, so >=8x median); "mega" = >=50K.

## 0. What I actually measured (method, so you can rerun it)
- [DATA] Threads API, every post 09-13 -> 09-28 (16 days): **270 posts, 11.0M post-views**, per-post views/likes/replies/reposts/shares. Raw: scratchpad `threads14.json` (script `th.mjs`). This window covers what posts_log.jsonl cannot (posts_log only starts 09-28).
- [DATA] I downloaded and looked at 210 of the 213 image/carousel posts on contact sheets (`thsheet*.jpg`, `rsheet*.jpg`) and hand-classified them: tweet screenshot vs photo+caption vs our own card vs graphic. Hand-classified, so +-5%.
- [DATA] Threads `follower_demographics` (country/age/gender) and account-level daily `views` for 15 days, plus `/me/replies` (our own replies) and bio.
- [DATA] X: NO per-post instrument exists. Everything on X is from posts_log metrics (11 rows), PM report 09-29 (Postiz X analytics 7d), Creator Studio read (memory) and the 09-24/09-28 research files. Say so wherever it matters.
- Comparable Threads accounts: could NOT get metrics (Threads profile pages block scrapers; only follower counts and post text came through). No instrument for Threads comps. X comps come from the 09-24 research files (dated).

---
# 1. THREADS (41.9K followers)

## 1.1 GRADE: **C-** overall (Reach A- · Follower conversion F · Process C · Instrument B)
Criteria: reach vs followers, follows per 10K views, repeatability of hits, whether we can measure what we do.

## 1.2 What the data says (5 bullets)
1. [DATA] **Reach is enormous and converts to nothing.** 16.3M views/30d (media kit, 09-23) and 10.6M account views in the 15 days to 09-29, but followers 41,264 (09-23) -> 41,932 (09-29) = **+111/day**. On the two biggest days, 09-24 (2.72M post-views) the follow delta was **+105**; 09-25 (1.83M) **+113**; on a quiet day 09-28 (230K) **+79**. Follows per 10K views: 0.4 on mega days vs 3.4 on quiet days. Daily follows are roughly independent of views between 60K and 2.7M views/day (n=5 days, so directional). The +105 on a 2.7M day equals the +79 on a 230K day: **mega-hits are not moving follows at all.**
2. [DATA] **Jul->Sep growth has halved.** Threads was 25.3K on 07-15 (ball-iq-social skill) and 41.26K on 09-23 = ~+228/day over 70 days (World Cup tailwind included). Now ~+100/day. So it is not "just the international break": 09-21->28 Threads views were ~1.25M/day vs ~80K/day on 09-15->20 (API `views`), i.e. the break + City-verdict week gave us 15x the reach and follows did not respond.
3. [DATA] **Power law, no floor lift.** Top 3 posts = 65% of the 11.0M views, top 10 = 89%, top 30 = 96.5%. The other ~240 posts share 3.5%. Median post = **1,192 views = 2.8% of followers**, identical across the 16 days (daily medians 419-2,216, no trend) and identical whether the post had 0 likes or 20. Nothing here looks like a throttle; it looks like a first-wave floor (Threads shows a post to ~2-5% of followers first [1 src, low-quality SEO blogs: postory/momentumhive, treat as a hypothesis]).
4. [DATA] **The 0-like posts are not suppressed, they are duds.** 34 of 270 posts have <=2 likes; their median views (~1.1K) equal the account median. Nobody reacted to a post that was shown normally. Zero-like posts: 7 of 23 text posts, 4 of 37 videos, only 1 of 190 image posts.
5. [DATA] **Follower base is not the audience we brief for.** Countries (34.7K attributed followers, 09-29): India 12.0% · UK 10.5% · US 10.2% · Nigeria 6.9% · Kenya 6.9% · South Africa 4.9% · Turkey 4.4% · Ghana 2.9% · Indonesia 2.4% · Bangladesh 2.1%. Sum: UK+IE 11.8%, US+CA 11.7%, all of Europe combined ~8%, Africa ~36%, South Asia ~16%. Age: 25-34 38%, 18-24 34%, 13-17 10%. 73% male. Alex's "UK+EU first" mental model describes ~20% of our Threads followers. Global-superstar / mega-club topics are the ones this audience shares; Norway/Nordic in-jokes are not.

## 1.3 What separates the 100K+ posts from the 0-like posts
Tables from the 270-post pull (n per row; med = median views).

| Format | n | median | hits >=10K | >=50K | <=5 likes | note |
|---|---|---|---|---|---|---|
| IMAGE | 190 | 1,192 | 30 (16%) | 15 | 25 (13%) | carries ~all hits |
| CAROUSEL | 20 | 1,383 | 2 (10%) | 0 | 4 | best 34.7K (Enzo "least likable") |
| TEXT_POST | 23 | 1,363 | 1 (4%) | 0 | 16 (70%) | median likes **3**; best = Romano "here we go" 15.6K |
| VIDEO | 37 | 478 | 1 (3%) | 0 | 16 (43%) | best = Goldbridge Brighton chant 28.4K |

Natural experiments (same idea, different format):
- Spurs maths: image card "if Tottenham win all 33..." 09-21 **3.29M views / 4,945 likes**. Text-only maths versions: 09-24 "score in each of next four games" **131 views / 0 likes**, "on course for 15 points" 2.36K / 4 likes. [DATA]
- Loaded question: image "Was Hazard as good as Chelsea fans say?" 09-23 **28.7K / 218 likes / 73 replies** vs text "Was Ozil as good as Arsenal fans say?" 09-24 **1.4K / 1 like**, text "Is Haaland better than prime R9?" 1.5K / 2 likes. [DATA, confounded by player and day]
- [INFERRED] Text is not throttled (it gets the same 1.2-1.4K first wave); it has no thumb-stop, so the first wave never converts to likes and the post dies. **Image is the ticket; text and video are not.**

Originality / screenshot question (hand-classified, n=210 image+carousel posts):
| class | n | hit >=10K | share |
|---|---|---|---|
| Screenshot of someone else's tweet/comment (incl. tweet-over-photo) | ~50 | 7 (14%) | 24% of image posts |
| Photo/frame + our one-line | ~85 | ~13 | |
| Own-watermarked fake-quote card (Haaland "1000 career goals", Carrick, Foden, Richarlison, Yamal) | ~9 | 3 (Haaland 37K, Carrick 19K, Foden 17K) | small n |
| Own tweet-styled card ("SHQ @ShithouseryHQ" mock tweets) | ~10 | 0 (all <=3K) | |
| Graphics/collages/lineups/scores | ~35 | ~5 | |
- [DATA] Tweet screenshots hit at 14% vs 16% for all images: **neutral, not a magic format.** 3 of the 16 mega posts are tweet screenshots (Cisse 142K, Croatia/Nike 58K, Yamal-vs-Nazario overlay 295K). No evidence in our own data that screenshots are demoted on Threads; also no evidence they are better. Meta's stated policy on "mostly others' content -> not recommended to non-followers" is documented for Instagram [own research ig_follow_conversion, 09-24; web 09-29 sociallyin/creatorflow, 1 src each] and I found NO Threads-specific confirmation. [GUESS] the risk exists on Threads too; it is not visible in our medians (flat 1.2K).
- [DATA] We have **never used a native Threads quote or repost** (0 of 270 posts `is_quote_post`), which is the attribution-safe way to use someone else's tweet.

What the 10 posts >=100K share (all Oslo time): Spurs maths card (09-21 13:07), Saka/Sky Sports (09-24 16:25), Jude to Romero (09-21 22:48), 3 scary hairstyles (09-25 15:50), Dembele/Jude/Sancho (09-27 13:34), "I'm crying" 4-panel (09-25 20:12), Yamal best teenager Q (09-25 14:01), 684 receipt (09-25 16:35), "10 men red card" (09-13 21:08), Cisse (09-28 09:52).
- [INFERRED] (a) IMAGE (10/10). (b) tied to a story that was **the** story that day (City verdict, Spurs bottom, Saka/Foden, Bellingham) and posted inside the first ~3h. (c) a **fanbase-level claim anyone can react to in 2 seconds** (rival-club pain, a mocked quote, a comparison) and needs no Norwegian/Spurs-insider context. (d) a global superstar or mega-club in the frame (Haaland, Yamal, Saka, Bellingham, City). 6 of the top 10 sit 13:00-16:35 Oslo (UK afternoon, US morning).
- Zero-like / floor posts (examples, all 09-2x): "Ben Davies scored in Denmark. For Denmark." 1.3K / 1 like · Norway "Odin" live block x5 (09-27 22:04-23:02, 281-1,363 views, 0-2 likes) · "Belgium playing France since 2015 [music credit]" 343 / 0 · "Our new Snapchat has 0 followers" 368 / 0 · "Can you guess the missing player?" 1.1K / 4 · "Who gets sacked first" 332 / 5 · "Foden sent off, agree?" 960 / 3 · Jason Derulo vs Elche stat sheet 194 / 1 · Harvey Elliott fitness news 172 / 1 · "Only proper football fans will recognise the two stadiums" 443 / 1. Pattern: niche (Norway/Denmark/Spurs-insider), dated stat blocks, quizzes, self-promo, news-style with no joke, live-match text blocks (2 of ~27 hit, 7%). [DATA, n=~60 floor posts]
- Tragedy/brand safety: 09-16 "Ronald Koeman's wife has passed away" got 3.9K views/311 likes: violates the no-tragedy rule; keep it out of the pipeline.

Time of day (Oslo, hits >=10K / posts): 09-11h 2/19 (11%) · 12-16h 13/81 (**16%**) · 17-19h 7/59 (12%) · 20-22h 10/69 (14%) · 23-00h **2/42 (5%)**. Day of week medians 673 (Wed) to 1,390 (Fri), no signal beyond noise. [DATA] Late-night posts (23-00) and live text blocks are the weakest slots.

## 1.4 Is there posting-volume / repetition throttling? (Alex's specific question)
- [DATA] Volume was **~17 posts/day** (270/16d), 3x the plan's 5/day. Medians: posts with 0 posts in the prior hour 960 · 1 prior 1,133 · 2 prior 1,401 · 3 prior 1,180 · >=5 prior **875**. Posts <10 min after the previous one: median 924, 14/74 hits; 10-30 min gap median 1,418. [INFERRED] No throttle from volume up to ~2/hour; clustering >=5 an hour and back-to-back (<10 min) trims the median ~25-35%, small next to the 16% image hit rate. More image posts = more lottery tickets at no measurable penalty.
- [DATA] Flat daily medians 09-13->28 => no decay from "posting a lot".
- [GUESS] originality demotion exists but is invisible at first-wave level; it would show as falling medians on non-follower reach. Watch `median of ALL posts` during the screenshot test (kill trigger in 1.9).

## 1.5 The hourly screenshot-singles test (Alex's idea 09-28)
- Status [DATA]: NOT RUNNING. Threads API shows no post after 09-28 21:55 UTC (23:55 Oslo); floor manager and PM 09-29 both say "not running, 10:00 and 11:00 slots lost". No batch was scheduled by anyone.
- Evidence for/against: screenshot hit rate 14% (n~50) ~= image base rate 16% [DATA]. So 14 screenshot singles/day would produce ~2 hits >=10K/day (vs ~1/day now) IF the pool quality holds, at no measured penalty. That is the honest upside: **more shots, not a better shot**. Follows will not move from hits (1.2). The test's stated kill rule ("median views < 50% of baseline" = <600) is far too easy to pass; screenshots get the ~1.2K floor regardless.
- "Screenshots can never be repeated" [INFERRED reading of Alex]: each source tweet is one-shot (dedupe gate + USED_SLIDES), so a flop burns the slot and the source. Fix = spend the shot only on tweets that pass a hit-shape check, not more volume: (a) tweet <=24h old and >=10K likes, (b) global superstar/mega club, (c) our added take is a claim about a fanbase, not a description, (d) one native Threads quote-post version is allowed as the SECOND use of a source (it credits the author and is not a screenshot). Also never re-use "the same tweet in two formats" the same day.

## 1.6 Root causes, ranked
1. **No conversion mechanism.** Hits are seen by strangers who consume and leave (0.4 follows/10K on mega days). No pinned post, no series people return for, no reply engagement. [DATA] We made **11 replies on Threads in 16 days** (`/me/replies` 09-13->09-28: 1-4 on some days, 0 on most), including self-replies. Yet Threads' documented top signal is replies, and 15 of our posts got >=50 replies (best 354) that nobody answered. [INFERRED: unanswered threads waste the strongest follow trigger.]
2. **Wrong audience assumption.** 80% of followers are outside UK/US/EU; posting slots, topics and jokes are tuned for Oslo/UK. Hits ride global mega-stories anyway; misses ride Nordic/insider ones. [DATA + INFERRED]
3. **Text and video on a platform that only rewards images.** 60 of 270 posts (22%) were text/video and produced 2 hits, 32 posts at <=5 likes. [DATA]
4. **Live-match text blocks**: 8 NOR-POR posts in 3h, 162-1,263 views, 0-12 likes (PM 09-28). [DATA]
5. **Topic tags unused** (1 of 270 posts has a `topic_tag`) and communities unused. [DATA] Discovery lever untested; effect unknown [GUESS].
6. **Bio** [DATA]: "Football memes & banter, daily / Follow, your club's next / Know ball? Prove it / Snapchat: shithouseryhq". The "Know ball? Prove it" line sells a quiz to a meme audience and the Snapchat handle is a new 0-follower exit. `clicks` on all 5 profile links over 14 days: **0** (API `clicks`). The bio has no reason-to-follow line.

## 1.7 What comparable accounts do (Threads) [DATA thin; no metrics obtainable]
- @footballjoe 352K followers (Threads page 10-26-25 snapshot): 1-3 sentence news-with-a-stat posts, video link. @footyemporium 316K: news + emotional stories, 11.6K likes on a farewell post (2024). @soccergenic 58.5K: long emoji-heavy news paragraphs. @sccrmemes: 3-sentence text captions with a Kalshi sponsor tag, likes **18-49 per post**. @instatroll_football: ~1 video-repost/hour with 1-line caption. @thefootballtroll: dormant on Threads since 11-2023. @shopfootballcentrall 24.9K: last posts 2024.
- [INFERRED] The football-humour lane on Threads is thin and low-quality: our median 15 likes and hits at 1-8K likes are far above the meme accounts I could read. **We are not losing on content; we are losing on conversion.** I could not find any football account documented to gain 1K+/day on Threads. Generic "Threads growth" pages (teract, posteverywhere, momentumhive, all SEO, 2026) claim engagement velocity in the first 30 min, replies weigh most, images beat text 60%: consistent with our data but they are marketing blogs [1 src each].
- Meta: Threads football community reached ~15.5M people/day during the 2026 World Cup and Threads passed 500M MAU (June 2026) [about.fb.com 07-2026, sproutsocial]. The pool is big; it is a conversion problem.

## 1.8 STOP / KEEP / DOUBLE
STOP: text-only posts (unless mega-story + tension, max 1/day) · video cross-posts and reels with music credits on Threads · self-promo ("Snapchat 0 followers") · Nordic/insider in-jokes ("Odin") · 5-8-post live match blocks (max 2 per match, top fixture only) · quizzes/"guess the missing player" · plain news cards with no joke · projections without an image · death/tragedy posts · posts at 23:00-01:00 · back-to-back posts <10 min apart.
KEEP: image + one-clause claim about a fanbase · own fake-quote cards (3/6 >=10K) · receipt/list images (Dembele/Jude/Sancho 472K) · tweet screenshot WITH our take when the source is fresh and >=10K likes.
DOUBLE: image posts in the 12:00-19:00 Oslo window on the day's mega-story (16% hit rate) · replies to commenters in the first hour · secondary-fanbase angles on mega stories (City-verdict hits mocked Arsenal/Chelsea/Agüero, not City).

## 1.9 Big bets (Threads)
**BET T1: "Conversion desk" on every hit (cost: 20 min/hit, no money).** Within 30 min of any post crossing 5K views: pin it (Threads supports pin in-app; Alex or Claude via UI), post a self-reply "New shithousery every day 09:30 / 13:15 / 18:30. Follow so it finds you." (reply, not a post-body CTA, so the classifier sees nothing), and reply to its top 10 commenters (each reply unique). Rewrite bio to: "Football shithousery, daily. Rival fans get roasted, yours included. Follow before your club's next one." Drop the quiz line; move Snapchat/Telegram/WA to links only. EV [GUESS]: raise mega-day yield from 0.4 to 2 follows/10K views = +100-400 extra follows on a 1M-view day, +60-150/day averaged. HOW WE'LL KNOW: follows per 10K views on days with a >=100K post, logged in the scoreboard (baseline 0.4-0.6). Kill/keep on 10-08: <1.0 -> conclude Threads hits do not convert for this audience and treat Threads as reach + brand-deal asset (rates already proposed $75/post) rather than a follower engine.
**BET T2: "Global-audience rewrite" (cost: 0).** Brief every draft against the real audience: 36% Africa, 16% South Asia, 12% UK+IE, 12% US+CA. Only mega-club/superstar frames (City, United, Arsenal, Chelsea, Real, Barca, Ronaldo, Messi, Haaland, Yamal); every post needs a 1-second read for a fan in Lagos/Delhi. Post windows 12:00-19:00 Oslo (UK afternoon = US morning = India evening = East Africa evening). EV: hit rate 16% -> 20% on images [GUESS]. KNOW: 10K+ hit share of image posts >=20% over 14 days (baseline 16%).
**BET T3: "Appointment series" (cost: ~20 min/day).** The Daily Number (started 09-28) is the right idea but has no result yet: judge it on FOLLOWS, not views. Add a second appointment: "Shithouse of the Week" (exists, series_shithouse_of_the_week.md) Fridays 18:00 with a pinned recap. KNOW: net follows on days with the series post vs baseline ~+100/day; kill after 5 numbers if 0 measurable difference (kill rule already exists; keep it, add the follows metric).
**BET T4: "Topic tag + community A/B" (cost: 0).** Alternate `topic_tag` (Football/Soccer or the equivalent tag) on every other post for 3 days (n>=40). KNOW: median views and >=10K hit rate tagged vs untagged; keep only if median +20%. Also join and post one image/day to the Football community.
**BET T5 (option, do NOT do before 10-06): merge the hourly test into the normal cadence.** Cap screenshot singles at 8/day, spaced >=60 min, all through a batch critic.

## 1.10 14-day plan (09-30 -> 10-13) and daily spec (Oslo)
Daily spec (weekday): **7 image posts** at 09:30, 11:30, 13:15, 15:00, 16:45, 18:30, 20:30; gaps >=60 min except FT windows. Mix: 3 fanbase-claim photo posts (own line), 2 tweet-screenshot-plus-take (fresh, >=10K likes), 1 own fake-quote or receipt card, 1 own maths/number card (Daily Number 13:30 stays). Matchday: +1 FT post <=10 min after the whistle for the top fixture, +1 HT max, no live text blocks except the top fixture. Hit conversion per T1. **10 replies under big football accounts** (footballjoe, footyemporium, soccergenic and the City/United/Arsenal fan accounts) in the first 10 min of their posts; **reply to commenters** on own posts within 60 min. No text-only, no video, no promos. Topic tag per T4.
Metrics (scoreboard adds): posts/day, image share (target 100%), hit rate (>=10K/posts, baseline 12.6% all posts / 16% images), median views (baseline 1.2K), follows per 10K views on hit days, net follows/day (baseline +100), replies made/day (baseline 0.7).
Targets by 10-06: net >=+180/day; hit rate >=15%; replies >=15/day. By 10-13: >=+250/day or downgrade Threads goal to "reach asset" (keep 5 images/day, drop conversion work).
Hourly test disposition: if run, use the corrected kill rule: after 40 posts, hit rate >=10% AND net follows >= baseline AND median of non-test posts >=900. Otherwise cut to 5-8/day.

## 1.11 Monetization (Threads)
No creator-payout programme found for us (no evidence either way; Threads has an invite-only bonus programme in some markets [GUESS, unverified]). Money path = brand deals and affiliates: 41.9K followers, 16.3M views/30d. Caution: 80% of followers are outside UK/US/EU, so CPM-sensitive brands will discount; stats to quote to brands are views/30d and top-post proof, not follower geography.

## 1.12 Would I keep investing? **YES.** Highest-ceiling text platform we own (16.3M views/30d, 16% image hit rate, weak competition), but stop measuring success in views; the goal is +250/day and it needs the conversion work in T1-T3.

---
# 2. X (@ShithouseryHQ, 45.3K, Following 935)

## 2.1 GRADE: **D** (Growth F: flat 45.2K->45.3K over 6 days · Reach C · Instrument F · Process D · Monetization D)
Criteria: net followers vs +300/day target, reach per post vs followers, existence of an instrument, policy risk.

## 2.2 What the data says (5 bullets)
1. [DATA] **Flat.** 45,200 (09-23, Alex) -> 45,280 (09-24 syndication) -> 45.3K (09-29 profile). The single 1.36M-view "684 points" post (09-25) left follows within the profile's rounding (+-50). **X follows per 10K views on the best post in months = <1.** July skill note also says 45K: flat since at least 07-15 through the World Cup, including 4.5M-view (07-13 "I am from the future") and 3.9M-view posts. [DATA x_own_top_2026.md]
2. [DATA] **The median X post reaches ~1K (2% of followers).** 09-28: Snapchat 972 · Italy maths 1.3K · Belgium 1.0K · Sweden 1.0K · "two contracts" quote 1.3K; Ben Davies 1.26K; Ronaldo bench 1.24K. Postiz X analytics 7d: 1.995M impressions, **1.3M from one post**, the other ~50 posts ~0.7M. [DATA pm/2026-09-29]
3. [DATA] **Same joke, two platforms:** Italy maths X 1.3K vs Threads 12.1K (9x); Snapchat post X 972 vs Threads 368. Our images do 10x better on Threads than X at the same size; X is the harder, lower-yield platform for us. n=2.
4. [DATA] **Attention was neglected until 09-24** (Alex: X "neglected for months"; first Claude X posts 09-24; 8 posts on 09-27/28, 2 replies all day 09-27/28 vs a 25/day plan, 0 quote-posts). Posts since: ~10 in the whole week; all maths/receipt family on 09-28 (4 of 5).
5. [DATA] **Money is small and unproven.** Creator Studio 09-29: Original Content Rewards ACTIVE, $0.00 paid, next payout 10-09; old Revenue Sharing lifetime **$3,250.61** (Jan-Jul, best fortnight $413, then "below minimum" for 6 weeks). X views 3.5M/28d (Alex, 09-23). [INFERRED anchor] a fortnight of 3.5M views paid ~$80-140 under RevShare in July; OCR pays only on Premium-viewer home-timeline impressions and excludes replies, so expect <=$100/fortnight, possibly under the $30 minimum. [GUESS] Read the 10-09 number before deciding anything.

## 2.3 Root causes, ranked
1. **We post an anonymous image and give strangers no reason to follow; the follow signal (weight 4.0) never fires.** Same conversion failure as Threads, worse: 1.36M views -> ~0 net follows. Comparable growers have an identity people return for (Hater Central: persona + #BallonDont event; UTDTrey: one-club persona; NBACentel: parody news). [DATA x_hatercentral_growth 09-24]
2. **Speed and presence, not wit.** Our only 1M+ post came 51 min after Ornstein (684). Match posts 479-1,744 views. Reply presence: 2-11 replies/day vs 25 plan. The ranking code gives reply/quote 5.0, link-copy share 20, like 0.5; replies only reach the replied-to account's followers (the reply filter). [DATA x_strategy 09-24 via public code synced 09-23]
3. **Postiz + Chrome posting vs OCR / suspension policy.** [DATA] x_ocr_and_replies_2026_09.md: content "created or posted using automated means" is ineligible; "scripting the X website" is grounds for permanent suspension; API replies blocked since 02-23. [DATA] reply_protocol.md #8 and replies.md log ~20 replies and posts made by Claude in Chrome 09-27/28; 4 of the last 8 X posts (09-28 19:17, 20:43, 20:58, 22:57/59) went through Postiz. The 09-24 policy was "Claude drafts, Alex posts by hand". **This is the biggest downside risk on the board: a 45K asset and the OCR payout.** [INFERRED] Not proven to trip anything; also not proven safe.
4. **Zero instrument.** No follower series (profile rounds to 0.1K), no per-post views except in Postiz for Postiz posts. Every X verdict above is coarse. Fix: Alex pastes the Creator Studio/Analytics screenshot (followers, follows/unfollows/day, impressions) daily at 12:00 (30 s).
5. **Format dilution.** 4 of 5 originals on 09-28 were the maths family; nothing on X since 09-27 in fake-official, stat-sheet roast (Hater Central's staple), label-the-frame, receipts-by-quote. [DATA pm/floor]
6. **Bio/profile.** X bio was changed 09-28 to a link list (Snapchat + t.me + balliq.app/wa) [DATA scoreboard/PLATFORM_PLANS]: a bio full of exits and no follow hook. Pin = the 684 receipt: good. Following 935: fine.

## 2.4 What top comparable accounts do that we do not (dated)
- @TheHateCentral2 (161.8K on 09-24; ~4.9K/day since 08-22 re-launch, but it inherits fame from a 650K main suspended 07-15): ~11 posts/day, 15 posts/matchday >=10K likes; stat-sheet roasts ("[Nickname] vs [Team]: 0 Goals/Assists / 6 Tantrums", Saka 59.5K likes / 2.56M views), receipts quote-posts of old confident takes (70.4K / 1.42M), #BallonDont nominee-drip event (one post per nominee, 2,533-reply voting post, ceremony date), quote-posts of the biggest news post within 0-3h (his Mbappe/Africa quote 2.5h after Romano, 1.2M views). 56% video (re-uploads, the suspension risk, and 0 OCR). [DATA x_hatercentral_growth_2026_09.md, primary reads 09-24]
- @TrollFootball (4.98M): image + 0-6 word caption, ~1/day? hits: "The new generation is taking over." 194.6K likes (06-25); quote of a viral celeb tweet 141.7K (07-09). @FootyHumour (1.25M): 2025 posts 50-165K likes, 2026 samples 0.9-4.1K, e.g. 3.7K on 09-23 => meme-aggregator collapse after X's April 2026 aggregator cut and OCR. [DATA x_strategy 09-24]
- @UTDTrey ~950K (01-2024) -> 1.8M (09-2026): ~900/day over 32 months with one-club persona daily takes. @NBACentel 154K (10-2024) -> 357K (02-2025) -> 800K+ (08-2026): parody news, 4 months at ~1.7K/day. [DATA hatercentral file; growth dates approximate, 1 src Wikipedia]
- [INFERRED] **Nobody with <100K followers is documented at +1K/day on X in our research**; the accounts that did have a pre-existing audience or a persona/parody identity plus 10+ posts/day. Realistic for us: +100-300/day at best, and only via identity + reply presence.

## 2.5 Questions asked in the brief
- **who_can_reply setting** [DATA]: Postiz requires `who_can_reply_post`; we send "everyone" (gotchas file). Keep it: replies weigh 5.0 and Premium replies are prioritised. No data suggests restricting helps.
- **Replies:** the only proven lever (684 came from speed under Ornstein). Rate now 2-11/day vs 25.
- **Quote-posts:** 1 in the log ("two contracts", 1.3K); Postiz dropped the quoted link, so quote-posts must be native in Chrome/app. Under-used: quoting the day's biggest news post within 0-3h is Hater Central's staple (1.2M on a 2.5h-late quote).
- **Threads (X-style text on Threads):** the Hater Central quote-post "receipt" has no direct Threads analogue except native quote posts, which we have never used.
- **Video:** [DATA] X video for us = other people's clips (excluded from OCR, copyright/suspension risk). No original video has been posted. Bier's "talking videos" note is [1 src]. Not a lever now.
- **Premium reach:** we have Premium (Alex 09-24). Buffer 2025: median ~600 impressions Premium vs <100 free is correlation; the 2026 code shows no explicit Premium multiplier [DATA x_strategy]. Our ~1K median at 45K followers is Premium-level reach already.

## 2.6 STOP / KEEP / DOUBLE
STOP: browser-driven posting/replies until a decision is made on the risk (2.3 #3) · 4 maths cards in 3 hours (four posts, all ~1K) · self-promo (Snapchat post) · Postiz posts for anything meant to earn OCR · "🚨" prefix habit outside the maths/receipt family · reflexive "No X fan will scroll without liking" (banned, 3 strikes) · text explaining the joke ("not the language of football X" per Alex 09-27).
KEEP: 2-8 word captions on a photo that carries the joke · the 684 pin · receipts · fake-official announcements · Alex's ragebait posts (bench-photo, Ben Davies: 1.2K, the daily median).
DOUBLE: speed replies/quote-posts under Ornstein/Romano/TouchlineX/brfootball in the first 5-15 min (hand-posted, 20/day) · stat-sheet roast within 10 min of FT on the match villain · secondary-fanbase angles on mega stories.

## 2.7 Big bets (X)
**BET X1: "Golden Towel" event (Hater Central's #BallonDont mechanic, our shithousery version).** Weekly award for the best shithouse: nominee drip Sun/Mon (4 own cards, tag the CLUB only), native 24h poll Tue, winner card Wed; monthly crowning Ballon d'Or night. Proposed 09-24, not started, awaiting Alex's go. Cost: 1 own graphic/day + 1 poll, ~30 min/day; own graphics count for OCR. EV [GUESS]: this is the only tested-in-the-wild engine for X follows in our research; even at 10% of Hater Central's per-post pull it is +100-300/day. KNOW: (a) a Towel post with >=5K views and >=50 replies by 10-06; (b) net followers +50/day above the 09-29 baseline by 10-13. Kill: neither -> stop the event, keep replies only.
**BET X2: "Reply desk + quote desk" (cost: ~40 min/day, and the risk decision in 2.3 #3).** 20 replies/day in two bursts (13:30-14:15 and 21:30-22:15) under 1K+-like threads <30 min old, plus 2 native quote-posts of the day's biggest news post within 15 min. EV: follows come from profile clicks on replies; expect +30-80/day [GUESS]. KNOW: follows/day on days with >=20 replies vs days with <5, over 10 days; keep if >=+40/day difference.
**BET X3 (choose one of X1/X3, not both): parody-news persona (NBACentel model), our "🚨 absurd fake-news" family run at 8-12/day with a clear parody label.** EV: highest ceiling in the research (+1.7K/day at 154K->357K) but hardest (shadowban risk 24h in 02-2025 for missing parody label; Community Notes void OCR; X cut payments to "🚨" aggregators 04-2026). KNOW: 5 days x 8 posts, median views >=2.5K (2.5x now). Kill if <1.5K.
**BET X4: "maintenance mode" (option value).** If by 10-13 net followers < +60/day, cut X to 3 originals + 10 replies/day (~20 min) and reallocate to Threads. Cost of being wrong: low; benefit: ~1.5 h/day.

## 2.8 14-day plan and daily spec (09-30 -> 10-13)
Daily spec: **4-6 own originals** on normal days (2 image-carried jokes, 1 stat-sheet/receipt, 1 quote-post, 0-2 maths), **8-10 on big match nights** (one per key moment <=5 min; FT stat-sheet <=10 min); **20 replies/day** hand-posted (see 2.3 #3) in the 13:30 and 21:30 bursts; Golden Towel per X1. Mornings 09:00-10:00 and 12:30-13:30 UK-time slots; irregular minutes. Do not post more than 2 maths cards/day.
Own graphics posted natively (X app or X web scheduler) for OCR; Postiz reserved for non-OCR cross-posts.
Instrument: daily Creator Studio screenshot from Alex at 12:00 (followers, follows, impressions). Weekly: OCR payout on 10-09 and the fortnight after, recorded in the scoreboard.
Targets: by 10-06 net followers >=+100/day (from ~0-20); by 10-13 >=+150/day; median views >=1.5K. Kill/downgrade per X4.

## 2.9 Monetization path (X)
1. OCR: read the 10-09 payout; record $ per 1K home-timeline impressions on the next two payouts. Expect small (2.2 #5). 2. Brand deals: X 45K + 3.5M views/28d is a stronger pitch than the follower count; re-pin a clean top post before any pitch (the "loyal whores" pin was replaced by the 684 receipt: good). 3. Subscriptions need 2,000 verified followers + 5M organic impressions/90d [1-2 src]; not close; check our verified-follower count on 10-09.

## 2.10 Would I keep investing? **YES, but cheaply and conditionally**: ~45 min/day, no new tooling, the Golden Towel test to 10-13, a decision on the automation risk this week. X is our second-best reach platform (3.5M views/28d) but converts ~0; without an identity/event it is a brand-deal asset, not a follower engine.

---
# 3. Cross-cutting notes (text platforms)
- **The pattern to keep** (both platforms): IMAGE + one-clause claim about a fanbase + the mega-story + first 1-3h. Everything else is a floor post.
- **The pattern to add**: a reason to follow. Every hit we ever had lets a stranger enjoy the joke and leave. Series, event (Golden Towel), pinned hit, bio hook, and replies to commenters are the only conversion levers with evidence in the wild (Hater Central, UTDTrey) and in our own data (IG "Day five" carousel).
- **Scoreboard hygiene:** add follows per 10K views to X and Threads rows; X follower count needs the Alex screenshot; log posts/day, replies/day, image share, hit rate.
- **Instrument gaps:** X per-post history (none), Threads comparables (none), Threads follower series before 09-23 (none), X audience geography (none).

# SUMMARY (10 lines)
1. Threads reach is huge (16.3M views/30d, 16% of image posts hit >=10K) but growth is flat at ~+100/day whether the day has 230K or 2.7M views: hits do not convert (0.4 follows/10K on mega days).
2. Zero-like posts are duds, not throttled: same 1.2K first-wave as every post; text (1 hit in 23) and video (1 in 37) have no thumb-stop; images carry all hits.
3. No posting-volume throttle at ~17 posts/day; only back-to-back (<10 min) or >=5/hour trims medians ~25-35%.
4. Tweet screenshots hit at 14% vs 16% for all images: neutral, not magic; we have never used native Threads quotes; the hourly screenshot test is not running and its kill rule is too easy.
5. Followers: India 12%, UK 10.5%, US 10.2%, Nigeria 6.9%, Kenya 6.9%: 80% outside UK/US/EU, so global mega-club stories only.
6. We made 11 Threads replies in 16 days while 15 posts got >=50 replies each; bio sells a quiz, links got 0 clicks.
7. X: flat 45.3K, median ~1K views, the 1.36M post gave ~0 follows, no instrument, and Chrome/Postiz posting conflicts with our own OCR-policy research (flagged as top downside risk).
8. Stop: text-only, video cross-posts, live text blocks, Nordic in-jokes, self-promo, 23:00-01:00, tragedy posts. Double: 7 images/day 12:00-19:00 on the mega-story, replies to commenters.
9. Big bets: Threads conversion desk (pin + reply + bio), global-audience rewrite, appointment series, topic-tag A/B; X Golden Towel event, reply/quote desk, or parody-news persona; X to maintenance mode if <+60/day by 10-13.
10. Keep investing in both (Threads yes; X yes, cheaply): targets Threads +180/day by 10-06 and +250 by 10-13, X +100/+150; if not met, Threads becomes a reach asset and X goes to maintenance.
