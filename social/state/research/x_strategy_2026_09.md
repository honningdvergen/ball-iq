# X (Twitter) strategy for @ShithouseryHQ — research, 2026-09-24

Scope: how X ranks posts, how X pays (after the September 2026 change), what football banter accounts are doing, our own history, timing, Premium, a playbook, and a note on Bluesky.
Evidence labels: **[2 src]** means two or more independent sources agree. **[1 src]** means only one source says it. **[primary]** means X's own code or post. **[ours]** means our own data. **[est]** means an estimate, not a measurement. Stats in sample posts marked **[VERIFY]** must go through the social-fact-checker before posting.

---

## TL;DR (read this first)

1. **Revenue Sharing is gone.** It closed on 2026-09-07. The last payout was 09-11. The replacement is **Original Content Rewards (OCR)**. Existing members have to apply, and approved members get their first payout on **2026-09-25**. OCR pays only on *original* posts. Reposted clips, re-uploads, "basic text overlays", compilations of other people's posts, engagement bait and Community-Noted posts earn nothing **[primary + 2 src]**. A lot of what SHQ posted in 2024–25 (other people's clips, screenshot memes, gain trains, "No X fan will scroll without liking") would not qualify now.
2. **The X money at our size is small.** X publishes no rate. Third-party estimates are about **$8–12 per 1M impressions from Premium viewers** **[est, 1–2 src]**. At our ~3.5M views/28d (Alex, 09-23), that works out to tens of dollars a month, not hundreds **[est]**. The real money is **brand deals**, where the 45K following is the asset, and possibly **Subscriptions** (2,000 verified followers needed **[1 src]**).
3. **The ranking weights are public, and the code is synced to 2026-09-23 [primary].** The positive signal with the biggest weight is **share via copy link (20)**, followed by **reply (5), quote (5), share via DM (5)** and **follow author (4)**. A like is only 0.5. The negative weights are much bigger: **report −234, mute −58.8, not interested −43.2, block −31.2**.
4. **What that means for rage takes:** a take that makes fans *argue* is rewarded. A take that makes them *mute or block* costs far more than the replies earn. Aim for "I have to reply to this", not "get this off my timeline".
5. **Our best-ever formats [ours]:** a one-line caption on a meme image (Antony 🐐 111K likes), a jab using a rival club's own words (Sunderland's corner joke 64.7K), a fake-praise list (Wirtz 16.9K likes / 448 replies) and Guess the Player (306–463 replies). The text is the joke. Keep that. Drop the stolen clips and the like-bait.
6. **Cadence:** 4–6 original posts a day, plus 20–30 replies under big accounts. Post within minutes of full time at weekends. On weekdays, post at 08–10 and 12–13 UK time.
7. **Premium ($8/mo US; UK price conflicting, see §6) is required for OCR and strongly correlated with reach.** Basic ($3) does not qualify.
8. **Bluesky:** its app has lost about half its monthly users since late 2024 **[2 src]**. Cross-posting the clean X text posts (questions, maths cards) through Postiz costs almost nothing, so do that. Skip the crude or rage posts, and don't make anything bespoke for it.

---

## 1. How X ranks posts in 2026

| What | Detail | Source |
|---|---|---|
| Engine | "Phoenix", a Grok-derived transformer, predicts the probability of each action for each viewer. Final score = Σ (weight × predicted probability). Candidates come from people you follow ("Thunder") plus out-of-network retrieval (Phoenix plus SimClusters). | github.com/xai-org/x-algorithm README, updated 2026-08-14 **[primary]** |
| Code is live | The repo gets near-daily commits (latest 2026-09-24). `param.rs` header reads "last sync 2026-09-23". | GitHub API, fetched 2026-09-24 **[primary]** |
| Following tab | Also ranked by Grok since late Nov 2025. "Latest" (chronological) is an opt-in toggle. | Social Media Today, Nov 2025; TheTechPortal 2025-11-28 **[2 src]** |
| Candidate age | Posts older than **48h** are filtered out of retrieval. A post's life is about two days. | `age_filter`, `SimclustersMaxCandidateAgeHours=48` **[primary]** |
| Replies | A reply only reaches a viewer who follows the account being replied to (`self_reply_chain_filter`). Replying under @brfootball puts us in front of *their* followers. | code **[primary]** |

**Published weights** (`home-mixer/params/param.rs`, synced 2026-09-23). These multiply *predicted probabilities*, not raw counts. The code comment warns that "one report cancels 468 likes" is a misreading.

| Positive | Weight | Negative | Weight |
|---|---|---|---|
| Share via copy link | **20.0** | Report | **−234** |
| Reply | **5.0** (a mutual-follow reply gets a 15× boost param) | Mute author | **−58.8** |
| Quote | **5.0** | Not interested | **−43.2** |
| Share via DM | **5.0** | Block author | **−31.2** |
| Follow author | **4.0** | Not dwelled | −0.02 |
| Share | 2.0 | | |
| Repost | 1.0 | | |
| Like | 0.5 | | |
| Click 0.4 · open link 0.2 · video open 0.07 · photo expand 0.05 · dwell 0.05 | | | |

**Penalties and myths:**
- **External links:** X's head of product Nikita Bier said in July 2026 that the link penalty was removed "over a year ago" **[2 src: FreePressJournal; X trending card]**. The weights agree, since `open_link` is +0.2 and not negative. Real data still looks bad, though. Buffer (Oct 2025) found link posts from non-Premium accounts at a median 0% engagement. Two SPORTbible link-only posts from March 2026 got **2 likes each** [ours, via syndication]. Rule: keep links out of the main post. Put them in the bio or a follow-up reply.
- **Hashtags:** the weights contain no hashtag term. Musk wrote "please stop using hashtags… they look ugly" (Dec 2024). The "−40%" figures that circulate are third-party guesses. Use none, or at most one on a live event.
- **Engagement bait:** since July 2026, Grok-based detection is in place. Soliciting engagement ("I'll follow everyone who replies") **3 or more times means removal from the program**. It also detects re-uploaded videos with added watermarks or intros, and copied viral text. Social Media Today, 2026-07-16 **[1 src + consistent with TechCrunch 04-12]**.
- **"🚨BREAKING" habit:** in April 2026 X announced a *permanent* payout deduction for habitual bait posters. All aggregators were "reduced to 60%" with another 20% to follow (Bier's post, 2026-04-11 **[primary]**; TechCrunch 2026-04-12 **[2 src]**).

---

## 2. Monetisation in 2026

| Item | Status | Source |
|---|---|---|
| Creator Revenue Sharing | **Sunset.** No new sign-ups from 2026-08-07. Earning stopped 09-07. Last payout Fri 09-11. | @XCreators 2026-09-08 **[primary]**; TechCrunch 2026-08-08; Tech2Geek 2026-09-23 **[2 src]** |
| Original Content Rewards | Applications open from 09-08 in Creator Studio. The first payout for ex-RevShare members who are approved is **09-25**. | @XCreators **[primary]**; AndroidHeadlines 2026-08-08 |
| Eligibility | Premium, Premium+ or Premium Business (Basic not listed). **500 verified followers.** **500,000 Home Timeline impressions from verified users in the previous 90 days, replies excluded.** Age 18+. Eligible country. | TechCrunch, AndroidHeadlines, Tech2Geek **[3 src]** |
| What pays | "Qualified impressions": unique impressions from **paid Premium subscribers** on the Home Timeline, with at least 50% of the post visible. Bots, paid or promoted views and repeat views don't count. | Tech2Geek; AndroidHeadlines **[2 src]** |
| What doesn't qualify | Reposts without meaningful commentary. "Minimally edited material with basic overlays". Compilations of other people's posts. Clips re-uploaded from other platforms. Community-Noted posts. Engagement bait. | TechCrunch; Tech2Geek **[2 src]** |
| Payout | Every 2 weeks. $30 minimum. Stripe outside the US. | Tech2Geek **[1 src]** |
| Rate | **No official RPM.** Estimates: "$8–12 per million verified impressions, ~$8.50 avg"; "$25–30/M for US video". The same article calls its own table an estimate. X said it would double the pool for 2026 (Jan 2026 @XCreators, as reported). | GreyJournal 2026-07-09 **[est]**; PostEverywhere 2026-03-21 **[est]** |
| Football-specific $ | **None found.** No published football account payout from 2026 turned up. Don't quote one. | — |
| Subscriptions | Needs **2,000 verified followers** plus 5M organic impressions in 3 months. The creator gets up to ~97% before app-store fees (a 30% Apple cut on iOS). | Taisly (as of 2026-08-11) **[1 src]**; InfluencerMarketingHub **[1 src]** |

**What this means for us [est]:** 3.5M views/28d is about 3.8M a month. Only the share of those views that comes from Premium subscribers pays. X publishes no split. Even if we assume every view were a paid-subscriber view, $8.50/M gives about $32 a month. So OCR is a nice-to-have. The money plan on X is:
1. **Brand deals and paid posts.** Pitch X alongside the ~135K cross-platform media kit.
2. **Subscriptions**, once we pass 2,000 verified followers. We need to check our current verified-follower count in Creator Studio.
3. **Traffic to Ball IQ**, sent from the bio and follow-up replies, never from rage posts (see §7 don'ts).

---

## 3. What football humour and aggregator accounts are doing now

Method: X's public syndication endpoints. The per-tweet `tweet-result` endpoint works but gives **no view counts**, only likes and replies. The `timeline-profile` endpoint served **stale "top" snapshots** for most handles. For example, it showed @TrollFootball's newest post as 2025-09-06, but `tweet-result` confirms TrollFootball posted in June and July 2026. The endpoint then rate-limited us (HTTP 429). Only @brfootball returned a genuinely current timeline. The 2026 samples below come from `tweet-result` on IDs found through web search. **Numbers are likes, not views.**

| Account (followers) | Frequency and formats seen | Best recent posts we could verify (likes / replies) |
|---|---|---|
| **@brfootball** (7.78M) | About 10 posts a day (20 posts, Sep 21–23). 4-image result and kit galleries; own-produced fan-vox videos ("Asking Man Utd fans…"); anniversaries; appointments. Few text-only posts, no memes. | "First international break since the World Cup 🤩" video 73.1K / 100 (09-22) · adidas' final Germany kit, 4 photos, 53.3K / 274 (09-23) · Thiago Silva's 42nd birthday 28.0K (09-22) · Aguirre to Valencia 24.2K (09-23) |
| **@TrollFootball** (4.98M) | Image memes with a 0–6 word caption; occasional quote-posts of viral non-football tweets | "The new generation is taking over." 194.6K / 780 (06-25) · quote-post of a viral celeb tweet 141.7K / 980 (07-09) · "Premier League in Champions League" video 29.6K (03-18) · "Championship players in Tottenham Stadium next season" 29.1K (04-12) |
| **@FootyHumour** (1.25M) | Meme photo or clip + emoji caption; comment-section screenshots | "All that scanning just to complete a one metre pass back…" video 3.7K / 83 (**09-23**) · "Photo of the week" 4.1K (03-20) · "PL teams in the Champions League" 4.0K (03-11). **Its 2025 posts ran 50K–165K.** |
| **@centregoals** | "🚨🚨\| OFFICIAL / RECORD" news cards, 1–2 images, Unicode bold | Messi "best dribbler" of the WC, 75.6K / 515 (07-21) · own-goal record 1.75K (07-03) · WC final result 435 (07-19) |
| **@utdreport** (club-news style) | "Official:" text lines, club news, occasional meme reaction | Uruguay greeted by sniffer dogs, video 51.7K / **1,734** (06-15) · meme "🤭🤣" 3.5K (04-19) · Bruno PFA POTY 3.1K (08-25) |
| **@ODDSbible** (LADbible Group; **betting brand, don't copy its promos**) | Emoji-bullet stat jokes | Henderson vs Mexico "🟨 / 🤕 / 0️⃣ minutes" 2.1K (07-06) · Griezmann children-birthday post 20 likes (04-08; that is also private-life territory, off-limits for us) |
| **@FootballFactly** | Meme photos, emoji captions | "🤔🤔🤔" 12.9K / 290 (07-02) · "Neymar & Haaland look realistic 🤭" **43** (09-07) |
| **@FootballFunnys** | Rhetorical-question meme images | "Does make you wonder… 🤔" 2.6K / 69 (08-11). (@FootballFunnnys with three n's has since become @TheClubPark.) |
| **@SPORTbible** | Link-only article posts | Two link-only posts from 03-01 and 03-02: **2 likes each** |
| @TheFootyFeed | Not accessible (endpoint rate-limited; nothing indexed) | — |

**Patterns:**
- **The winning post is an image plus one short line that is the joke.** TrollFootball's 2026 hits are single photos with a 0–6 word caption. FootyHumour and our own top posts follow the same shape.
- **Multi-image result or kit posts beat video for B/R.** Across Sep 21–23: 4-image posts median 17.2K likes (n=8); video median 2.1K (n=7).
- **Meme reposters have shrunk.** FootyHumour's 2025 top posts were 50K–165K likes. Its 2026 samples are 0.9K–4.1K. That is consistent with the April 2026 aggregator cut and OCR, but it is one account and could have other causes.
- **Siren-news accounts still get reach on big facts** (CentreGoals' Messi dribbler stat, 75.6K). They are, however, exactly the style X said it will deduct for.

---

## 4. @ShithouseryHQ — what the data shows

- Profile read: **45,280 followers** (syndication, 2026-09-24). Pinned post **2026-09-02**: "I've seen more loyal whores" + photo, **29.8K likes / 223 replies**.
- The endpoint returned 100 posts dated 2024-05 → 2025-11 plus the pin. Because the snapshot is stale (see §3), it **can't tell us what we posted in Sep 2026**. Alex's X analytics (3.5M views/28d) is the current number.
- **Top original posts in that sample** (likes / replies, UK time):

| Post | Format | Likes | Replies | When |
|---|---|---|---|---|
| "Antony 🐐" | meme photo, 2 words | 110,989 | 773 | Mon 14:51, deadline day 2025-09-01 |
| "🚨 Sunderland have commented on Arsenal's Instagram post! 'Not enough corners for you, huh?'" | rival-club screenshot jab | 64,656 | 623 | Sat 20:13, about 45 min after FT |
| "Oiiii😭" | meme photo | 61,537 | 371 | Mon 17:16 |
| "These two accounts have 1.7 million followers combined" | 2-photo joke | 38,332 | 121 | Fri 14:02 |
| "Florian Wirtz is honestly a really good player, he just need to improve his: – Dribbling – Passing…" | fake-praise list | 16,886 | **448** | Sun 19:00 |
| "GUESS THE PLAYER Level: Advanced" / "…Level: Hard" | quiz graphic | 10,293 / 1,609 | 306 / **463** | Sun 17:06 / Wed 12:06 |
| "🚨 Jadon Sancho is reportedly unpopular…" | report rewrite | 10,168 | **651** (889 quotes) | Sun 11:38 |

- **Median likes by format** (67 non-reply originals): photo 3.2K (n=46) · video 6.4K (n=12) · text quote-post 5.3K (n=3). Most of the videos were other people's match clips, which OCR no longer pays for.
- **Formats in our history that are now dangerous:** "No [X] FAN will scroll without LIKING!" (several posts); "MANCHESTER UNITED GAIN TRAIN — follow everyone that LIKES your comment"; "Reply under this tweet and follow everyone who likes your comment". Those are exactly the solicitation posts behind the 3-strike removal rule. The habitual "🚨|" prefix is also on X's deduction list.
- **Brand safety:** the pinned "loyal whores" post is fine for X culture. A brand-deal buyer will see it first, though. Consider re-pinning a clean top performer before any pitch.

---

## 5. Timing

| Evidence | Finding | Source |
|---|---|---|
| Generic X study (8.7M posts) | Best: Tue 9am, Wed 10am, Wed 9am (local time). Weekdays 9–11 best. Sat and Fri worst. Evenings weaker. | Buffer, 2026-03-13 **[1 src]** |
| UK-specific | Tue–Thu, 08–10 and 12–13 GMT. | OpenTweet UK page **[1 src, low quality]** |
| **Our own top 25** | Strong weekday late-morning cluster (10:00–11:10). **Saturday and Sunday 17:00–21:00 UK, near full time**, also produced the Sunderland jab (64.7K), Wirtz (16.9K) and the Cunha and Arteta reactions. | **[ours]** |
| Post lifetime | 48h candidate window. | **[primary]** |

**Rules:**
1. **Matchday: post fast at full time, not during the game.** Our matchday winners landed 0–60 min after FT. Have a template ready before kick-off (§7, format 8) and fire it within 10 min of the whistle.
2. **Weekday evergreen slots:** 08:30, 12:30 and 17:30 UK.
3. **Live-tweeting a whole match isn't worth it.** Those posts are low-effort and look the same as everyone else's. Post one or two moments with an original line.
4. **Breaking moments** (deadline day, sackings, a club admin meltdown): speed matters because of the 48h window. The line still has to be ours. Our biggest post ever was on deadline day.
5. **Note:** Sep 22 B/R called this "the first international break since the World Cup". This week is evergreen content (questions, maths, quizzes). **[VERIFY]** the next PL fixture dates before planning matchday templates.

---

## 6. Premium and verification

| Tier | US price | Relevance | Source |
|---|---|---|---|
| Basic | $3/mo ($32/yr) | Edit and longer posts. **Not enough for OCR.** | xautopilot 2026-05-27 **[1 src]** |
| **Premium** | **$8/mo ($84/yr)**, $11/mo on iOS | Blue check, reply prioritisation, **OCR eligibility** | xautopilot **[1 src]**; OpenTweet "$8/month" **[2 src]** |
| Premium+ | $40/mo ($395/yr) | Largest reply boost, ad-free | xautopilot; PriceTimeline 2026-01-06 ($395/yr) **[2 src]** |

- **UK prices conflict.** One source gives £9.60/mo for Premium. PriceTimeline gives £313/yr for Premium+. Check in the app before buying.
- **Reach:** Buffer (Oct 2025, 18.8M posts / 71K accounts) found a median of **~600 impressions per post for Premium vs <100 for free**. That is a correlation, not proof of a boost. The 2023 code had 4×/2× Premium multipliers, but **the 2026 published weights show no explicit Premium multiplier**, so don't quote "4×".
- **Unverified accounts** are capped at 50 posts and 200 replies a day (MediaNama 2026-05-18 **[1 src]**).
- **Verdict:** buy **Premium** (not Basic, not Premium+) if we don't have it already. It's needed to apply for OCR, and it gets our replies under big accounts ranked higher. [ASK ALEX] whether the account already has it.

---

## 7. Playbook

### Daily cadence
- **4–6 original posts a day.** The mix:
  - 2 text takes or questions
  - 1 own-made image (maths card, quiz or meme with our line)
  - 1 quote-post on the day's moment
  - 0–1 poll
  - 1 matchday FT post on match days
- **20–30 replies a day** under @brfootball, @centregoals, club accounts and pundits, each with an original joke. Replies don't count toward OCR impressions, but they put us in front of those accounts' followers (the reply filter), and follow-author is weighted 4.0.
- **Reply back in our own threads during the first hour.** Our replies turn a thread into a conversation (reply weight 5; mutual-follow boost).
- Never post the same thing twice. X also detects copied text.

### 10 formats, each with a sample in our voice

| # | Format | Why it works | Sample |
|---|---|---|---|
| 1 | **Loaded question** (Threads-proven: Hazard, 23K views / 63 replies) | reply 5.0, no facts to get wrong | "Be honest. Was Eden Hazard actually as good as Chelsea fans say, or has the nostalgia been doing overtime?" |
| 2 | **Maths card** (IG-proven, 38K) | our own graphic counts for OCR; copy-link share | Image: "Mathematically, if Tottenham win all their remaining [N] games…" Caption: "Nobody tell them." **[VERIFY N + table]** |
| 3 | **Fake-praise list** (our Wirtz format, 448 replies) | the list *is* the joke | "Honestly think [player] is a top, top striker. Just needs to work on: – Shooting – Heading – Being onside – Wanting it" (pick a player in current form; **don't reuse Wirtz**) |
| 4 | **Arguable hot take** (the "fanbase enrager", redesigned to start arguments rather than get us muted) | replies and quotes without blocks | "Set-piece goals are the most honest goals in football. Everyone who hates them supports a team that can't defend a corner." |
| 5 | **Admin jab quote-post** (Sunderland corner post, 64.7K) | quotes the original, so it's a commentary quote, not a stolen screenshot | Quote the club's own post: "Admin's been on the Lucozade again." / "Blink twice if the owner's standing behind you." |
| 6 | **Native poll, pick one** | cheap replies | "One must-win game, you get ONE: prime Rooney or prime Gerrard. Poll 👇" |
| 7 | **Guess the Player** (306–463 replies; from the Ball IQ bank) | original graphic; ties to Ball IQ without a link | Image: career path (club badges and years). "Guess the player. Level: Hard. Answer tomorrow 9am." **[VERIFY career path]** |
| 8 | **FT one-liner** (post within 10 min) | speed within the 48h window | "[Team] fans spent 90 minutes blaming the ref and 0 minutes blaming the back four." (write it after the match; check the score) |
| 9 | **Rank it** | long replies, dwell | "Rank the worst 'we go again' moments of your club's last 10 years. Top 3 only, no essays." |
| 10 | **Parody that's obviously a joke** | shareable (copy-link 20) | "Sources: Premier League to replace VAR with a man called Dave who 'just knows'." Only if it's absurd enough that nobody could take it as news. No fake quotes a real person might plausibly say, because Community Notes void OCR. |

### What to repurpose
- **Threads question posts: yes, verbatim.** X is text-native and these are 100% ours. Do it the day after Threads, and reword the opener.
- **Maths cards and quiz graphics: yes.** They're our own images, the best fit for OCR.
- **IG carousels: only our own slides.** Our carousels mix swept tweets and slides from other accounts. On X that counts as "compiling other people's posts", which earns nothing and trips duplicate detection. Quote the original tweet with our line instead.
- **Reels of match footage: no.** They're clips re-uploaded from other platforms, which is the explicitly excluded category.

### What NOT to do
1. No "No [X] fan will scroll without liking", gain trains or "follow everyone who likes your comment". Three strikes means removal from the program.
2. No reflexive "🚨|" prefix.
3. No re-uploaded match clips, TikToks, or other creators' memes with our caption on top ("basic overlay").
4. No betting brands (Kalshi, Stake, Polymarket). No tragedy or private life.
5. No takes designed to make a fanbase *mute or block* us. Mute is −58.8 against +5 for a reply.
6. **Never pair a rage take with Ball IQ or balliq.app.** Keep the app in the bio and in quiz posts only, so an angry fanbase has no target for review-bombing.
7. No links in the main post, and no hashtags.
8. No invented stats. Anything numeric goes through the social-fact-checker agent.

---

## 8. Bluesky (1.3K followers)

- **The platform is shrinking.** Mobile MAU was 10.4M in June 2026 (−27% YoY), DAU about 3M in July (−26% YoY), and Q2 2026 MAU is about 52% below the Q4 2024 peak (Similarweb via TechCrunch 2026-08-11; Slashdot and Brussels Signal Aug 2026 **[2 src]**). The ~29% DAU/MAU stickiness is similar to Threads.
- **What works there:** custom feeds and starter packs drive discovery (67+ football starter packs listed as of Jun 2026, blueskystarterpack.com **[1 src]**). Reply depth and early engagement matter (growth blogs **[est]**). There's no creator payout, so Bluesky is audience only.
- **Verdict:** cross-post the X **question, poll-style and maths-card** posts through Postiz, since the extra cost is close to zero. Don't cross-post the crude or rage posts. This last point is our read of the platform's tone, **[opinion]**, not a measured fact. Don't make anything bespoke for Bluesky. Also, the bio still says "Get our Ball IQ App below": fix it when the App Password connects.

---

## Sources (all fetched 2026-09-24)

- X algorithm repo, README (updated 2026-08-14) and `home-mixer/params/param.rs` (synced 2026-09-23): https://github.com/xai-org/x-algorithm · https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/params/param.rs
- @XCreators, OCR launch article 2026-08-07: https://x.com/XCreators/status/2085835082166653393 · RevShare sunset 2026-09-08: https://x.com/XCreators/status/2097371482804363669
- Nikita Bier on aggregators, 2026-04-11: https://x.com/nikitabier/status/2043045929750794399
- TechCrunch, 2026-08-08, OCR: https://techcrunch.com/2026/08/08/x-replaces-misaligned-revenue-sharing-program-with-original-content-rewards/
- TechCrunch, 2026-04-12, clickbait cuts: https://techcrunch.com/2026/04/12/x-says-its-reducing-payments-to-clickbait-accounts/
- Tech2Geek, 2026-09-23, OCR rules: https://www.tech2geek.net/x-original-content-rewards-program-eligibility-payouts-and-rules/
- AndroidHeadlines, 2026-08-08: https://www.androidheadlines.com/2026/08/x-launches-original-content-rewards-program-creator-payouts.html
- Social Media Today, 2026-07-16, engagement-bait detection: https://www.socialmediatoday.com/news/x-updates-its-engagement-bait-detection/825495/
- Social Media Today, Nov 2025, Following feed ranked by Grok: https://www.socialmediatoday.com/news/x-formerly-twitter-sorts-following-feed-algorithm-ai-grok/806617/ · TheTechPortal 2025-11-28: https://thetechportal.com/2025/11/28/x-hands-its-following-feed-to-grok-replacing-traditional-chronology-with-ai-powered-ranking/
- Link penalty removed (Bier, Jul 2026): https://www.freepressjournal.in/tech/x-product-head-nikita-bier-confirms-link-penalty-removed-over-a-year-ago-tells-mark-zuckerberg-he-can-post-them-directly
- GreyJournal, 2026-07-09, payout estimates: https://greyjournal.net/hustle/how-much-does-x-pay-creators-2026/ · PostEverywhere, 2026-03-21: https://posteverywhere.ai/blog/how-much-does-twitter-x-pay-creators
- Subscriptions: https://taisly.com/blog/x-creator-subscriptions-requirements · https://influencermarketinghub.com/x-twitter-subscriptions/
- Premium prices: https://xautopilot.app/blog/x-premium-subscription-price-2026-worth-it (2026-05-27) · https://pricetimeline.com/news/196 (2026-01-06)
- Buffer, Premium reach, 2025-10-02: https://buffer.com/resources/x-premium-review/ · Buffer, best times, 2026-03-13: https://buffer.com/resources/best-time-to-post-on-twitter-x/
- MediaNama, unverified limits, 2026-05-18: https://www.medianama.com/2026/05/223-x-imposes-daily-limits-unverified-users-what-changes/
- Bluesky decline: https://techcrunch.com/2026/08/11/blueskys-active-user-base-is-shrinking-as-its-focus-expands-beyond-the-app/ · https://tech.slashdot.org/story/26/08/16/0326249/blueskys-active-user-base-shrinks-52-over-18-months-but-its-protocol-is-spreading · starter packs: https://blueskystarterpack.com/football-fans
- Tweet-level data: https://cdn.syndication.twimg.com/tweet-result (per-ID) and https://syndication.twitter.com/srv/timeline-profile/screen-name/<handle>, pulled 2026-09-24 (stale for most handles, then HTTP 429).
