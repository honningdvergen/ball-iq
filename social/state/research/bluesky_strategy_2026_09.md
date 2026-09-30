# Bluesky playbook for @shithouseryhq.bsky.social, 2026-09-24

**Labels:** **[2 src]** means two independent dated sources agree. **[1 src]** means one source only. **[primary]** means Bluesky's own blog, docs or API. **[ours]** means pulled from the public AppView on 2026-09-24. **[opinion]** means our judgement. Stats marked **[VERIFY]** go through the social-fact-checker before posting.

---

## TL;DR

1. **Bluesky is small and shrinking, but people there still like things.** It has 46.7M registered accounts, but only about 985K accounts like something on a given day and 572K post (09-23) **[primary: firehose counter; registered count also in TechCrunch 08-11 = 2 src]**. App MAU was 10.4M in June 2026, down 27% YoY and down about 52% from Q4 2024 **[1 underlying src: Similarweb, via TechCrunch; Slashdot only repeats it]**.
2. **Our account is effectively new.** It has 29 original posts, all between 14 Nov 2024 and 18 Mar 2025, written in the first person as a Man Utd fan called "Alex". They got a median of 25 likes (best: 121). **In a random sample of 80 followers, 23 (29%) have posted at all in 2026 and 19 (24%) in the last 30 days [ours]**, so about 300 of the 1,330 followers are live **[est]**.
3. **The best-matched account for us is @utdheisenberg, a 1,188-follower satire account.** It got **1,939 / 1,450 / 1,133 / 1,011 likes** on four posts in the last fortnight [ours]. Those numbers are well above its follower count, which suggests Discover reached non-followers. Discover's logic isn't public, so that's our inference **[opinion]**. Small meme accounts can break out here. Most of its posts still land at a median of 7.
4. **What wins in football right now:** jokes about clubs (Spurs above all), owner stories that turn political (Ratcliffe), clips, and one-line stat jokes. Straight news does less. Ornstein's Arteta-contract scoop got 191 likes from 132K followers [ours].
5. **Links aren't penalised.** A BBC link post about Ratcliffe did 2,653 likes [ours; plus Hootsuite and PostEverywhere, 2 src]. Hashtags barely matter. Plain keywords are what put posts into the football feeds.
6. **Postiz video to Bluesky may be broken.** Postiz issue #1589 ("missing jobId") was opened 2026-06-10 and is still open **[1 src, primary GitHub]**. Test one video before planning around it.

---

## 1. How distribution works in 2026

| Surface | How posts get in | What it means for us |
|---|---|---|
| **Following** | Strictly reverse-chronological, with no ranking **[1 src: PostEverywhere 2026-05-29, citing Bluesky]** | Timing matters. Only about 300 live followers see it |
| **Discover** (Bluesky's own algorithm) | A recommender built on the social graph, engagement from people like the viewer, and "show more/less" feedback. The 2026 roadmap adds topic tags and better interest signals **[2 src: TechCrunch 01-27, Dataconomy 01-28]**. Since 08-27, users can opt their own posts out of Discover **[2 src: iTechPost, TechJournal]** | This is where breakouts happen. Leave our account opted in |
| **Custom feeds** (third-party) | Most are **keyword** feeds (post text matched against a word list). Some are **curated lists** of accounts | Name the club or player in plain words |
| **Trending topics** | Bluesky runs one feed per topic. On 09-24, 19 of 25 trends were politics and **1 was sports: "Burnham signals lifting football alcohol ban" (430 posts)** [ours] | About 400 posts is enough to trend. Jump on football trends fast |
| **Starter packs** | Up to 150 accounts and 3 feeds, with a one-tap "Follow all" **[primary: Bluesky blog, 2024]** | **Every football pack we found showed 0 joins this week**. The largest ("Football Journalists and Media") has 31 all-time joins [ours]. It's a 2024 onboarding tool and now a weak lever |

**The football feeds that matter** [ours, likes on the feed card]:

- **Premier League Football** by @852dude, 864 likes. It matches 400+ keywords across all 20 clubs. It moves fast: 97 posts in about 70 minutes, median 0 likes. Getting in is easy, but the exposure is thin.
- **Live Football Chat** by @markposts, 186 likes. Live match posts, median 2 likes. Arsenal/Brighton posts from @arsenalvisionpodcast (151 likes / 72 replies) sat at the top of it.
- **FPL** (138), **Liverpool FC** (128), **Everton** (80). All three are keyword feeds.
- **Arsenal+** (71) and **Football Tactics** (540) are curated. You only get in if the curator adds you.
- **How to check you're in:** after posting, call `getFeed` on the feed URI and look for the post's `uri` in the results.

**Mechanics:**

- **Hashtags** are clickable and searchable. The accounts doing best in our sample barely use them: @utdheisenberg had tags on 4 of 75 posts, @plnews on 0, @OptaJoe on 0 [ours]. Use one at most, a club tag, on match days.
- **Links:** no suppression **[2 src: Hootsuite 2026, PostEverywhere 2026]**. The biggest football-adjacent posts of the fortnight included link cards [ours].
- **Video:** up to **10 min / 300 MB** since 2026-08-26 **[2 src: TechCrunch, Engadget]**.
- **Posts:** 300 characters and up to 4 images each. There are no public view counts. The API only exposes likes, reposts, replies and quotes [ours].
- **Replies:** since Oct 2025, replies are ranked by social proximity. Toxic, spammy or off-topic replies are down-ranked, and there's a private "dislike" signal **[primary: Bluesky blog 2025-10-31]**. Drive-by reply farming under big accounts will be buried.
- **Quote posts** are common and read as endorsement or argument. Owners can detach quotes, so a hostile quote can be cut off.

---

## 2. The football community (last 14 days)

**Big soccer accounts** [ours, followers]:

| Group | Accounts and followers |
|---|---|
| Journalists / media | David Ornstein 132.6K; The Athletic FC 85.6K; Adam Hurrey 78K; OptaJoe 75K; Miguel Delaney 39K; Oliver Kay 32K; Sid Lowe 31K; Men in Blazers 30.7K; Amy Lawrence 29.7K |
| Fan / meme | Out Of Context Football 54K; @arsenalfc.bsky.social 46.8K (a **fan** account, quiet since 09-03); PL News 36K; 90s Football 31.7K (dormant since 2025-10); Footy Scran 24.8K (dormant) |
| Clubs | FC St. Pauli 32.7K and Werder 14.9K are the most active official clubs, with a median 20–35 likes/post. Most PL clubs are absent or dead: Everton's official account last posted 2025-08, Man Utd's handle has 16 posts, and Sky Sports PL has 1 |

**Gap:** there's no active English football *banter* brand with reach. The meme space is small accounts: @utdheisenberg (1.2K), @memecastleunited (2.5K) and @orbinho.

**Top football posts, 2026-09-10 to 09-24** (likes / reposts / replies) [ours]:

| # | Post | L / R / C | Type |
|---|---|---|---|
| 1 | @dansinker: Ipswich (Ed Sheeran's club) "shellacked by Arsenal" | 3,533 / 672 / 214 | Humour (celebrity-politics quote) |
| 2 | @premnsikka: Ratcliffe "lost confidence in the UK", BBC link | 2,653 / 901 / 358 | News, political |
| 3 | @utdheisenberg: Spurs walkout joke (a disability punchline) | 1,939 / 221 / 71 | Humour, image |
| 4 | @demwar: "not a single football show… not drowning in betting ads" | 1,930 / 307 / 137 | Opinion, anti-betting |
| 5 | @utdheisenberg: Cantona slams Ratcliffe | 1,450 / 262 / 39 | News, political |
| 6 | @utdheisenberg: "Brighton vs Arsenal…" clip | 1,133 / 220 / 56 | Video (broadcast clip) |
| 7 | @utdheisenberg: "Arsenal getting pecked by the Seagulls!" | 1,011 / 213 / 68 | Video |
| 8 | @peterohanrahah: Liverpool sponsor "tricked" | 725 / 273 / 29 | Humour, image |
| 9 | @aliceolilly: Ratcliffe "retains confidence in Man United" | 681 / 91 / 42 | Humour one-liner, text |
| 10 | @plnews: Haaland has scored against all 25 PL teams he's faced | 638 / 55 / 8 | Stat |
| 11 | @mdonald: daughter's first Arsenal match | 475 / 25 / 26 | Personal |
| 12 | @amylawrence: "Such an engrossing game…" | 401 / 16 / 19 | Opinion |
| 13 | @arsenalvisionpodcast: every Spurs player has scored the same number of goals | 272 / 14 / 18 | Stat joke |
| 14 | @orbinho: Max Dowman has more PL goals than Spurs | 248 / 27 / 8 | Stat joke |
| 15 | @david-ornstein: Arteta agrees new contract | 191 / 23 / 3 | News |

**By type:**

- **Political or owner-politics:** about a third of the top 15, and most of the biggest numbers.
- **Humour:** image jokes and one-liners, the most reliable non-political winner.
- **Video:** other people's broadcast clips. These do well but carry copyright risk and are "unoriginal".
- **Stat jokes:** 250–640 likes.
- **Straight news:** under 200.
- **Spurs are the running joke** on Bluesky this month. At least 6 separate Spurs dunks made the top posts.

---

## 3. Our own account

- **Profile:** "Football Shithousery", bio "⚽ Football Fans HQ - Memes - News / 🐐 Follow to grab an OG ticket / 👇 Get our Ball IQ App below | DM for Promos". 1,330 followers / 712 following / 153 posts. Created 2024-11-14.
- **History:** 29 originals, the rest replies and reposts. Almost all went out in the Nov-2024 X exodus week. They were first-person Man Utd fan posts ("I'm Alex, I love footy and Manchester United"), Amorim news, and "Bluesky vs Twitter" meta.
- **Best posts:** the Chido Obi-Martin hype post (121 likes), "I'm Alex… how do I find friends?" (82), and the Cavani clip (67). The migration question got 36 replies.
- **Last post:** 2025-03-18, "I love Manchester United ❤️" (6 likes).
- **Pinned post:** the 2024-11-30 United v Everton "3-0" prediction (8 likes). It's stale and off-brand.
- **Reading:** the followers came for a friendly United fan during the migration wave, and most have since gone quiet. We are effectively starting from zero, with a small United-leaning core.

---

## 4. Audience culture: what gets rewarded and punished

- **Anti-betting.** One post attacking betting ads did 1,930 likes [ours], so our no-betting rule is an asset here. Say it in the bio.
- **Anti-engagement-bait.** Bluesky explicitly runs without "engagement-at-all-costs metrics" and down-ranks spammy replies **[primary 2025-10-31]**. Users call out bait **[1 src: growth blogs]**. Drop "follow for…", "OG ticket" and "DM for promos".
- **Crossposting:** identical copy-paste across networks looks amateur, and mass-posting identical content counts as spam under the ToS **[1 src: Agent Sky 2026]**. Adapt the text. Don't mirror X.
- **Alt text** is a strong norm and some users police it **[multiple undated guides; 1 src says only ~15% of images have it]**. It isn't needed for reach: OptaJoe tags 14/24 images, Men in Blazers 0/67, and both perform [ours]. We add it anyway, because it's cheap goodwill.
- **Politics:** the platform leans left and political posts dominate trending (19/25 on 09-24) [ours]. Owner-politics football content does the biggest numbers. Our rule is **no party politics and no tragedy**. Jokes about owners *as football owners* ("retains confidence in Man United") are a grey zone. The owner decides. **[opinion]**
- **Edge:** a disability joke did 1,939 likes, so edgy material isn't automatically punished. We can't see blocks or mutes, though, and it breaks our taste bar. Don't copy it.

---

## 5. Playbook

**Cadence:** 3–5 original posts a day plus about 10 genuine replies. Cluster posts around match windows, with live reactions during PL games so they land in Live Football Chat and Premier League Football. There's no evidence volume beats consistency **[1 src]**. @utdheisenberg posts about 5/day and most posts sit near 7 likes. A few hits carry the account.

**Content mix:**

| Share | Format | Notes |
|---|---|---|
| 35% | One-line jokes, text or a single image | Our strongest shape |
| 20% | Stats and absurd facts, **own maths cards** | Proven 250–640 like range |
| 20% | Threads-style questions and claims | Reply-driven, suits reply ranking |
| 15% | Live match reactions | Posted in real time |
| 10% | Own short video | Guess the XI, quiz reels. Only once Postiz video is proven |

Also: a link post at most once a day (balliq.app/bs), and alt text on every image.

**Reuse our formats:**

- **Yes:** the maths cards (Tottenham 101 points did 38K views on IG) and Threads-style questions ("Was Hazard as good as Chelsea fans say?" did 23K views / 63 replies on Threads). Each is posted once per platform.
- **Carousels:** trim to at most 4 images, since that's the Bluesky cap.
- **Own reels:** only once Postiz video is proven.
- **No:** re-uploaded broadcast clips. They're unoriginal and a copyright risk.

**Eight sample posts** (each ≤300 characters):

1. *Maths card image.* Caption: "Good news for Spurs fans: it's still mathematically possible to finish on 101 points." Alt: "Card: If Tottenham win all 33 remaining matches they finish on 101 points." **[VERIFY: Spurs on 2 pts after 5]**
2. "Was Eden Hazard as good as Chelsea fans say, or as good as Real Madrid fans say?"
3. "Andy Burnham wants to let fans drink in sight of the pitch again. Tottenham supporters have asked if it can be made compulsory." **[VERIFY: proposal wording and scope]**
4. "Brazil lost 7-1 to Germany at their own World Cup. Oscar scored the 1, in the 90th minute. Nobody threw him a parade." **[VERIFY via bank q_id]**
5. "Leicester won the league in 2016 and most people can name exactly three of that team."
6. *Live template:* "[Team] have had [X]% of the ball and [Y] shots on target. That isn't control, it's hoarding." **[VERIFY live figures from the broadcast]**
7. *Link post:* "Today's Footle took me four guesses. Someone in here is about to do it in two and become unbearable. balliq.app/bs"
8. *Own Guess-the-XI video:* "Guess the XI: Arsenal, [season]. The left back is the one that ends friendships." Alt describes the pitch graphic. **[VERIFY lineup]**

**Feeds and starter packs:**

- Write club and player names in plain text so posts land in Premier League Football, the club feeds and Live Football Chat.
- Ask to be added to the curated feeds (Arsenal+) and to the "Football People" pack (@hltco).
- Build our own **"Football banter & memes"** starter pack: @utdheisenberg, @memecastleunited, @orbinho, @nocontextfooty, @arsenalvisionpodcast and similar accounts. Listed accounts get notified, which invites reciprocity. **[opinion]** Don't expect joins from it.

**Profile:**

- **Display name:** `Shithousery HQ | Football Banter`. It puts searchable words in the name, matching IG's "Shithousery HQ | Football Memes".
- **Bio** (133 of 256 characters):
  ```
  ⚽ Football memes & banter, daily
  🚫 No betting ads. No engagement bait.
  🔔 Follow, your club's next
  👇 Know ball? Prove it
  balliq.app/bs
  ```
  `/bs` already 307s to `/footle?utm_source=bluesky` (checked 09-24).
- **Pin:** unpin the 2024 Everton preview. Pin a "new management" post that is itself a joke plus the Tottenham maths card, for example: "Under new management. Football memes, daft maths and questions that ruin group chats. No betting ads, ever. Daily game for people who think they know ball: balliq.app/bs". A pinned post isn't ranked, so the link costs nothing there. After 14 days, swap in the best performer.

**Read the results on 2026-10-08:**

- Net followers.
- Median likes per post against the 6–8 of our last posts and the 7 median at @utdheisenberg.
- The share of posts that reach 100+ likes.
- `utm_source=bluesky` visits in Vercel.

Pull the numbers with `getAuthorFeed`. Bluesky has no impressions metric.

---

## Sources (fetched 2026-09-24)

- Our data: public AppView `getAuthorFeed`, `getProfile`, `getFollowers`, `getFeed`, `getPopularFeedGenerators`, `searchStarterPacks`, `getTrends` (public.api.bsky.app), and `searchPosts` with since=2026-09-10 (api.bsky.app; public.api returned 403 and throttled after about 11 queries).
- Firehose stats, total users and daily likers/posters: https://bsky-search.jazco.io/stats (updated 2026-09-24)
- TechCrunch 2026-08-11, active users shrinking: https://techcrunch.com/2026/08/11/blueskys-active-user-base-is-shrinking-as-its-focus-expands-beyond-the-app/ · Slashdot 2026-08-16 (repeats it): https://tech.slashdot.org/story/26/08/16/0326249/
- TechCrunch 2026-08-26, 10-minute video: https://techcrunch.com/2026/08/26/bluesky-now-lets-you-upload-10-minute-long-videos/ · Engadget 2026-08-26: https://www.engadget.com/2244638/bluesky-now-supports-10-minute-videos-larger-file-sizes/
- TechCrunch 2026-01-27, roadmap: https://techcrunch.com/2026/01/27/bluesky-teases-2026-roadmap-a-better-discover-feed-real-time-features-and-more/ · Dataconomy 2026-01-28: https://dataconomy.com/2026/01/28/bluesky-reveals-2026-roadmap-prioritizing-discover-feed/
- Discover opt-out 2026-08-27: https://www.itechpost.com/articles/237160/20260827/bluesky-introduces-new-privacy-setting-hide-posts-algorithm-specific-feeds.htm · https://techjournal.org/bluesky-discover-feed-opt-out
- Bluesky blog 2025-10-31, reply ranking and dislikes: https://bsky.social/about/blog/10-31-2025-building-healthier-social-media-update · Starter packs 2024-06-26: https://bsky.social/about/blog/06-26-2024-starter-packs
- PostEverywhere 2026-05-29, algorithm guide: https://posteverywhere.ai/blog/how-the-bluesky-algorithm-works · Hootsuite 2026: https://blog.hootsuite.com/what-is-bluesky/
- Agent Sky 2026, automation rules: https://useagentsky.com/blog/are-bots-allowed-on-bluesky
- Alt-text culture: https://bsky.eustace.link/hi-bluesky-its-time-we-had-a-chat-about-alt-text/ · https://fedica.com/blog/require-alt-text-bluesky/
- Explosion 2026-06-19, World Cup and Bluesky: https://www.explosion.com/194457/world-cup-2026-has-no-sports-twitter-replacement-yet/
- Postiz Bluesky video bug #1589 (opened 2026-06-10, open): https://github.com/gitroomhq/postiz-app/issues/1589 · Postiz docs: https://docs.postiz.com/providers/bluesky
