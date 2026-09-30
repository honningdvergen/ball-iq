# AUDIT: small platforms (Bluesky, Telegram, WhatsApp Channel, Snapchat) — auditor "small-platforms", 2026-09-29 (read 11:57 CEST)

Tags: [DATA] = measured, with source. [INFERRED] = reasoned from data. [GUESS] = my estimate, no instrument. Read-only audit: nothing was posted, edited or scheduled. Live reads today: Bluesky public API (our account + 5 comparables), t.me/s/shithouseryhq, t.me/s/Troll_Football_Telegram, snapchat.com/@shithouseryhq (public page shows no follower or view count). Web: TechCrunch/Similarweb on Bluesky, Snap help + creators blog, OneUp pricing, WhatsApp channel guides.

## 0. THE VERDICT IN 12 LINES (read this if nothing else)

| rank (ROI, small four) | platform | verdict | daily effort | $ cost | P(monetization bar by 01-01) | P50 followers on 01-01 [GUESS] |
|---|---|---|---|---|---|---|
| 1 | **Snapchat** | KEEP as a measured mirror; go/no-go on OneUp 10-04 with a hard rule (§4) | ~15 min (fan-out of reels we already make) | $25/mo OneUp (trial ends ~10-05) | ~0% (bar 50K + 15K view-hours; P(50K) ≈ 3%; P(paid out) ≈ 0%) | 3K (P10 300 · P90 30K) |
| 2 | **Telegram** | KEEP as a zero-effort mirror + ONE daily CTA. Stop caring about volume | ~5 min | $0 | ~35% to reach 1K subs (ad share opens); ~$0–100 total earned by 01-01 | 1.2K (P10 200 · P90 4K) |
| 3 | **Bluesky** | PARK as an image-only mirror. Kill the 15 replies/day plan | 0–5 min (was 40+) | $0 | 0% (nothing to monetize) | 1.6K (P10 1.3K · P90 3K) |
| 4 | **WhatsApp Channel** | PARK. Stop Chrome-driven posting into Alex's personal WhatsApp | 0 | $0 | 0% | 50 (P10 0 · P90 500) |

Versus the big platforms (marginal ROI = expected followers or money per Claude-hour) [INFERRED from PM 09-29 pace table + this audit]: Threads (+90/day, 3.8 follows/10K views) and Facebook (+38/day, 7.3 follows/10K views) beat all four. X (Original Content Rewards, first payout 10-09) is the only near-term cash. **Snapchat is the only small platform that could plausibly beat Instagram (+2/day), TikTok (−1/day) or YouTube (0/day) on marginal ROI, and that is an option, not a fact: we have zero Snapchat measurements.** Telegram, Bluesky and WhatsApp do not beat any big platform on ROI and should never take live-session time from Threads/FB/X.

Total small-four upside to the 1M goal: ≈ +5K followers by 01-01 in the P50 case (0.5% of the goal). None of them close the gap. Their job is (a) option value on Snapchat's non-follower distribution, (b) an owned channel (Telegram) to push Ball IQ, (c) not costing us anything. Run them as mirrors.

---

## 1. BLUESKY — GRADE: F

Grade criteria: growth vs own target (+30/day) · engagement vs same-size comparables · cost per follower · cultural fit. All four fail.

### What the data says
1. **Flat and dead.** 1,327 followers on 09-29 (API), was 1,328 on 09-28; 6 days flat in the scoreboard; target was +30/day. [DATA scoreboard + bsky API]
2. **Our posts get almost no likes.** Last 95 originals since 2024-11-14: median 1 like, 36 of 95 at zero. Last 40 (09-25→09-28): median 0. Examples: Italy maths card 1 like; Belgium/France maths card 0; Sweden 0; "Norway 1-2 Portugal | Highlights" 0; "Our new Snapchat has 0 followers" 0; Klopp/Rehhagel 0; Chelsea sold Salah+KDB 0; "Man City's lawyer who saved them from 1 of the 115 charges" 3; Alexis Sanchez 5 (best of the week). [DATA bsky API 09-29]
3. **Same-size accounts do 10–40× better with the same kind of content.** Median likes over their last ~30 posts: Memecastle United (2,475 followers) 18.5, hit 618 on "Erling Haaland next season:"; utdheisenberg (1,214) 7.5, hits 417 and 218 on City-verdict posts; PL News (36K) 18. Ours at 1,327: 0–1. [DATA bsky API 09-29]
4. **The follower base is mostly dead.** 29% of an 80-sample had posted in 2026; ~300 of 1,330 live (09-24 sample). They followed a first-person "Alex, Man Utd fan" account in the Nov-2024 X exodus. [DATA research/bluesky_strategy_2026_09.md, dated 09-24]
5. **Replies are not paying.** The last 7 replies we posted (09-28, all between 08:38 and 08:41, i.e. one batch) got 1 like total. [DATA bsky API] Plan promised 15/day; actual 7 in the day (PM 09-29). [DATA pm/2026-09-29.md]

### Is football culture on Bluesky at all?
Yes, but it is not our register and the platform is shrinking. [DATA] Bluesky mobile MAU 10.4M in June 2026, −27% YoY; mobile DAU ~3M in July, −26% YoY, ~52% below Q4-2024 peak (Similarweb via TechCrunch 2026-08-11). Threads DAU 147M (July 2026). So Bluesky is about 2% of Threads by daily users. Football top posts 09-10→09-24 (our own research): a third are owner/political (Ratcliffe), one is anti-betting-ads (1,930 likes), Spurs dunks (6 in the top 15), stat jokes 250–640. Trending was 19/25 politics, 1 sports. The big football accounts are journalists (Ornstein 132K, Athletic 85K, OptaJoe 75K) and a few fan/meme accounts (Out of Context Football 54K); there is **no active English football banter brand with reach**. [DATA research/bluesky_strategy 09-24]. That gap is real, but the accounts filling it (Memecastle 2.5K, utdheisenberg 1.2K) show what "winning" is worth: a few hundred likes on a hit and ~+10–40 followers, on a platform with ~3M daily mobile users.

### Root causes, ranked
1. **Dead graph + no distribution seed.** 300 live followers cannot carry a post into Discover; likes signal comes from them. [INFERRED]
2. **Cross-posted copy, not native.** Text and music-credit lines lifted from Threads/reels ("🎵 Heartbreaking – Kevin MacLeod… CC BY 4.0" went to Bluesky on 09-28 21:55). Bluesky culture punishes bait and copy-paste (Bluesky 2025-10-31 reply-ranking post; multiple guides). [DATA/INFERRED]
3. **Batched 3-minute reply bursts**, not conversation. [DATA]
4. **Low-volume, wrong-tone content mix** (maths cards, a "0 followers" self-promo). Their winners are image one-liners tied to a fanbase moment, posted on the news day. [INFERRED]
5. **Bio was not fixed** ("OG ticket", "DM for Promos" flagged as anti-culture in the 09-24 research; I did not re-check whether it was changed). [INFERRED]

### What top comparables do that we don't
Memecastle: one image, one line, posted on the moment ("Erling Haaland next season:" 618 likes, 09-27). utdheisenberg: hits appear only on the news day (City verdict 09-25/26: 218 and 417). Both post ~1–5/day, median 7–18, and are followers-of-the-fandom accounts (club-flavoured), not "football in general". We are neither.

### STOP / KEEP / DOUBLE
- STOP: the 15 replies/day Chrome plan (≈40 min of live-session time for ~0–1 like/day observed). STOP text-only cross-posts and video captions (music credits, "🚨" maths). STOP self-promo posts. STOP Bluesky in the "hit-shot" and PM checklist accounting.
- KEEP: image-only cross-post of items that already passed the X/Threads gate, ≤2/day, native copy (no music line, no emoji ladder), alt text.
- DOUBLE: nothing.

### Big bets (honest EV)
| # | bet | cost | EV |
|---|---|---|---|
| B1 | **Park as a mirror** (the recommendation): 1–2 gated image one-liners/day from the X/Threads pool, zero Chrome time | 0–5 min | ~+1 follower/day → 1.4–1.7K by 01-01. Frees ~40 min/day for Threads/FB |
| B2 | **One-week native test 10-01→10-07**: 10 image one-liners aimed at the two topics Bluesky rewards (City verdict aftermath, Spurs), no cross-posted video, posted 10:00–14:00 UK. Measure median likes vs Memecastle's 18.5 | 30 min total | P(any post ≥100 likes) ≈ 25% [GUESS]; if yes +30–80 followers and we learn the register works |
| B3 | Kill the account | 0 | Lose 1.3K mostly-dead followers and a 2nd reply venue; no real loss. Only reason not to: it costs nothing as a mirror |

### 14-day plan (daily spec)
- 09-30→10-06: mirror 1–2 image posts/day (same asset as X, own one-line, no hashtags, no music credit). No replies. No Chrome.
- 10-01→10-07: B2 test, in place of the mirror slot.
- HOW WE'LL KNOW: `bsky.mjs` or the public API read of followers + likes per post each morning (I did it in one curl). Threshold: median likes ≥5 over the B2 10 posts **or** one post ≥100 likes **or** followers ≥1,360 on 10-13. Miss all three → cut to fully automatic mirror with zero review time (skip the critic for Bluesky-only re-posts of already-passed items). Kill rule: no post ≥25 likes by 11-15 → stop posting, leave the account up.

### Monetization path
None. Bluesky has no creator payments. Follower value = a 1.3K–2K audience with an anti-betting, left-leaning skew; small Ball IQ funnel. [INFERRED]

### Would I keep investing? NO (mirror only). It is 2% of Threads' daily audience, our graph is dead, and same-size accounts prove the format can work but not that it is worth Claude's time.

---

## 2. TELEGRAM — GRADE: D (growth F, cost A)

### What the data says
1. **2 subscribers.** t.me/s/shithouseryhq 09-29 11:57: 2 subscribers, 5 photos, 8 videos, 4 links; every recent post shows 1–2 views. 25 posts logged for it 09-28→09-30 (posts_log.jsonl). [DATA]
2. **The X and Threads bio links did not move it.** 2 subs at 21:30 on 09-28 (PLATFORM_PLANS), 2 now; X bio got the t.me link 09-28 21:50 (Alex OK). ~14 hours of exposure to 45K/42K followers → ≈0 joins. [DATA]
3. **We post 10–15/day into an empty room.** Every gated Postiz post plus Threads screenshot singles. With 2 subs the bottleneck is inflow, not post count. [INFERRED]
4. **Comparable, live read 09-29:** Troll Football (145K subs): last 15 posts 18.2K–32.7K views (≈13–23% view rate), ~15 posts/day, mostly meme images + polls, banter positioning ("don't join if you can't take banter"), monetized with a prediction-market promo ("Outcome.xyz") in posts. [DATA t.me/s/Troll_Football_Telegram, WebFetch summary]. Football memes (34K): ~7% view rate, ~15–20 posts/day (09-28 playbook read). Sports Hub (1.35M subs): ~0.2% view rate. [DATA playbook, one read each, 09-28] Banter channels hold the best view rate; the huge "football" channels are inflated.
5. **Monetization is tiny.** 50% ad share needs ≥1,000 subs and a public channel [official per playbook]; entertainment CPM ≈ $1 (one blog: ~$15/mo at 10K subs) [1src]. Suggested Posts / sponsored posts pay $5–30 per 1K subs per post [1 blog cluster]. Norway eligibility for the ad share is not confirmed; Alex must own a TON/Gram wallet. [DATA playbook UNVERIFIED list]

### Root causes, ranked
1. **No inflow path.** Telegram has no algorithm; every sub is imported by a link. A static bio link converts ≈0 (measured, n=1 day).
2. **Nobody is asked, in the moment.** The only real lever is a reply CTA under a hit post, and it hasn't been used (the daily-CTA plan in the playbook, "one X reply-CTA per day under a hit", is not in the PM log). [INFERRED from PM 09-29, no mention]
3. **No hook for why to join.** The playbook's angle is "the ones X won't push / full-res"; the actual channel content is identical to X/Threads. [INFERRED]
4. **Similar Channels and cross-promo do not exist yet**: SFS needs ≥1K subs; Similar Channels needs a few thousand. [1src tguard.pro]

### What top comparables do that we don't
Troll Football: ~15/day, image-first banter, polls, one clear identity line, big-brand monetization. It is 145K because it is old (organic + years of cross-promo), not because of a trick we can copy in 90 days. The transferable part: image posts + polls, unfussy captions, no video-heavy production.

### STOP / KEEP / DOUBLE
- STOP: sending the raw gated queue with music-credit captions to Telegram; reading its view counts before 100 subs; any post/day cap talk (irrelevant until subs > ~300).
- KEEP: Postiz fan-out of gated items (zero marginal cost); public channel; the discussion group not yet (no audience).
- DOUBLE: exactly one thing — **the reply CTA**: once a day, under the day's best X/Threads hit within 1h: "the full-res + the ones too spicy for here → t.me/shithouseryhq" (X 45K + hit views 5–100× normal). Threads bio links already carry it.

### Big bets
| # | bet | cost | EV |
|---|---|---|---|
| T1 | **Hit-post CTA reply** every day (X and Threads) with a Telegram-only exclusive line ("we post the ones X buries here first") | 2 min/day | If a 5×-median hit does ≥100K views and CTA conversion is 0.01–0.05% → 10–50 subs per hit [GUESS]. ~8–15 subs/day average → **1K by ~mid-Dec (P50)**, P10 300, P90 4K |
| T2 | **Shared folder + S4S at ≥1K subs** with 5–10 banter channels of 5K–50K (cost: barter, $0.05–0.20/sub equivalent, one blog cluster) | 1–2 hrs once | +200–600 subs per round, 40–60% 30-day retention [1src]; only unlocks after 1K |
| T3 | **Merge the three one-way channels into one.** IG Broadcast "Shithousery Fam" + Telegram + WhatsApp Channel all do the same job for the same fan. Make Telegram the only owned channel; drop the others | saves effort | Concentrates the CTA slots (X bio, Threads links, IG links). Right now three bio links dilute the Ball IQ link |
| T4 | Paid subs ($0.30–1/sub via ad marketplace) | $300–1,000 per 1K | **NO.** Money pressure; fake/paid subs poison the view rate advertisers price on |

### 14-day plan (daily spec)
- Every day: Postiz fan-out as now (no Chrome, no extra work). Post spec: images and 1–2 polls/day; silent send for filler; drop music-credit lines. 10–15/day is fine only if it stays fully automatic.
- 1 CTA reply/day under the top hit (X, Threads).
- Matchdays: no special Telegram effort.
- Instrument (free, works today): `curl -s https://t.me/s/shithouseryhq` → subscribers + views per post; add to the PM morning read.
- HOW WE'LL KNOW: subs ≥60 on 10-06, ≥250 on 10-20, ≥1,000 on 12-01. Kill/merge rule: <40 subs on 10-13 → stop the CTA, keep fan-out only, stop counting it in any daily scorecard.

### Monetization path
≥1K subs → ad share (50%, ~$1 CPM entertainment [1src]). At 1.5K subs × ~25% view rate × 12 posts/day ≈ 4.5K views/day ≈ $2–4/day gross → **≤$100 by 01-01, ~$50–150/month in Q1**. Real money = sponsored posts at 5K+ subs ($5–30 per 1K subs [1src cluster]), not before Q2. Betting/prediction-market promos are the niche's buyer (Troll Football and Fabrizio both run them); default no until Alex decides. Value beyond cash: an owned channel with 100% delivery to push Ball IQ daily-game links. [INFERRED]

### Would I keep investing? YES, at zero marginal effort plus 2 min/day of CTA. It is the one small platform with a real owned-audience payoff and no downside.

---

## 3. WHATSAPP CHANNEL — GRADE: F (untested)

### What the data says
1. **0 followers at launch, no live count.** Channel `0029Vb91qGBFnSzGtD2ziB0q` created 09-28; PLATFORM_PLANS shows 0 at 21:30; there is no API or scraper for the follower count (only visible in-app). "No instrument." [DATA]
2. **Two posts logged** (Belgium video, absurd-maths intro), both via the Chrome recipe. [DATA posts_log.jsonl]
3. **The posting method is fragile and risky.** Text works; photos/videos need a patched `HTMLInputElement.prototype.click` and a hidden file-input trick in Alex's **personal** WhatsApp Web session, with a CSP that blocks fetch. [DATA memory project_snapchat_whatsapp_2026_09_28.md] Automating a personal number carries account-restriction risk [INFERRED, not tested]. A ban would cost Alex his real WhatsApp, the worst downside of anything on this list.
4. **Discovery is link-only for us.** Directory ranks reportedly on first-7-day follower velocity, reaction rate and post frequency [1 guide cluster, unverified]; we spent that window at 0 and a 2-post record. [INFERRED]
5. **Football dominates the platform, but by officials.** Top channels: Real Madrid 68M, Barcelona 51.2M, Man City 23.2M, UEFA CL 22.4M, Liverpool 18.4M, Premier League 18.2M, Man Utd 16M (whatsscale.com). I found **no** UK/EU football banter WhatsApp channel comparable and no growth case. [DATA/no data]

### Root causes, ranked
1. No import path except bio slots; bio slots are scarce and each one dilutes the Ball IQ link on X. [INFERRED]
2. No scheduler; manual Chrome posting each time.
3. Same audience and content as Telegram and IG Broadcast; a third copy of the same job.

### What comparables do
Official clubs get 18–68M from club-app promotion and match-day push; small brands "1–3 posts/day, polls, cross-promo" and see "50–200 new followers per week from cross-promotion alone" [1 blog]. We have nothing comparable to promote from.

### STOP / KEEP / DOUBLE
- STOP: all Chrome posting to WhatsApp. STOP the balliq.app/wa link in the X bio (saves a slot for Ball IQ or the Telegram link).
- KEEP: the channel and its link (free).
- DOUBLE: nothing.

### Big bets
| # | bet | cost | EV |
|---|---|---|---|
| W1 | **Park** | 0 | Lose nothing measurable; regain Chrome time and bio slot |
| W2 | **The "send it to the group chat" bet**: WhatsApp is where the "forward to a Spurs fan" behaviour happens. Test by adding a one-line WhatsApp share button in our own Ball IQ daily-result screen instead of a channel | dev time | Higher EV than the channel; not a social task, flag to product [GUESS] |

### 14-day plan
Nothing. If Alex wants to test: he posts 1 item/day manually from his phone for 14 days, we read the count on 10-13 (needs him). Threshold to resume: ≥100 followers with zero promotion beyond one bio link, else stay parked.

### Monetization path
WhatsApp is rolling out paid channel subscriptions (10% cut) and promoted channels [1 guide, unverified]; needs scale we won't have. None by 01-01.

### Would I keep investing? NO. Park; the downside risk (personal account) outweighs a channel that has no measured audience.

---

## 4. SNAPCHAT — GRADE: D (provisional; no instrument)

### What the data says
1. **No Snapchat metric exists anywhere.** 16 Snapchat rows in posts_log 09-28→09-29 all have `metrics: None`; snapchat.com/@shithouseryhq shows the profile ("Creator", bio "Football banter, shithousery and the maths nobody asked for 🏆") but no counts; the PM says "no instrument in my tools". [DATA] We have run a 2-day, 16-post sprint blind.
2. **OneUp costs $25/mo after the 7-day trial (~10-05).** All plans include Snapchat; pricing is per connected account band (Basic $25, 5 accounts). [DATA OneUp pricing 2026, Capterra/saasworthy] The web uploader is blocked because the Business org is US-locked ("Organization not spend ready"). [DATA memory 09-28]
3. **The bar is far.** 50K followers, 15,000 view-hours in 28 days of which ≥3,000 from Spotlight, Snap Star, 18+, eligible country (Norway is on the payout list), plus ≥100 Spotlight hours/28d to keep max rewards (since 05-2026). [DATA help.snapchat.com 14669003687444 + playbook]
4. **What the bar means in views [INFERRED math].** 15,000 h = 54M seconds. At ~11 s average watch that is ~4.9M views/28d ≈ **175K views/day, every day.** 3,000 Spotlight-hours ≈ 1.1M Spotlight views/28d ≈ 39K/day. For scale, our whole Instagram does ~8.25M views/30d (≈275K/day) [DATA PLATFORM_PLANS] and our single biggest IG reel is 9.6K views (best in 30 days) [DATA snapchat_evergreen doc]; the FB bees reel is 44K. Payout at the bar ≈ $0.10–0.30 per 1K Spotlight views [secondary blogs, UNVERIFIED], i.e. **≈$135–405/mo** on 1.1M Spotlight views. Even a success pays under $1K/month.
5. **The upside is real distribution, not payout.** Snapchat has 493M daily users (Q2 2026), ~23M UK users, 18–24 = 38% of the audience, Spotlight has ~550M monthly viewers, and Spotlight ranks on watch time, completion, shares and originality, not follower count, so a 0-follower account can get millions of views. [DATA searches + playbook] Snap says creators who post to Spotlight daily grow followers ">10×" faster than those who don't [Snap claim via search summary, 1 source].

### Root causes for "no result yet"
1. No instrument and no per-format log (the playbook's "log each Spotlight's views at 48h" is not implemented).
2. Fan-out reels are the same assets that get 800–2K views on IG/TikTok/YT. Snapchat can't fix the underlying reel quality (all three big video platforms flat). Only the FB bees/Goldbridge/Lee Kang-in class is proven. [INFERRED PM 09-29]
3. Originality rules: no sweep content, no watermarked reposts, no fully-AI video (banned from recommendation since 2026-07-31 per TechCrunch via playbook). [DATA playbook] The overnight batch (meme vessels + our plate, Kevin MacLeod music) is compliant; the risk is "repeating the same content with minimal creative differences". [INFERRED]

### What top comparables do
I found **no documented football-meme Snapchat growth case** (playbook and my searches agree). Generic advice that recurs: 10–30 s for reach, hook in 2 s, 1–3 specific topics, "Add for part 2" / series cliffhangers, a consistent daily Spotlight cadence. [DATA guides, low quality] So there is no comparable to benchmark against; **our own measurement is the benchmark**.

### STOP / KEEP / DOUBLE
- STOP: posting the same asset to Story and Spotlight blindly; **STOP the Snapchat "0 followers" self-promo posts on X/Threads** (972 views on X, 368 views/0 likes on Threads, PM 09-29) and STOP claims like "50K in a week"; the honest range is 200–2,500 in 7 days, 50K needs one mega-viral Spotlight [GUESS, PM's own 2–10K].
- KEEP: 3 Spotlights/day of the clean, evergreen, own-made reels (the same ones for FB/IG/TikTok); a Public Story of the day's best image.
- DOUBLE: whichever 2 formats show Spotlight views ≥5× our own median after 48h.

### Big bets
| # | bet | cost | EV |
|---|---|---|---|
| S1 | **7-day measured Spotlight sprint** (already running): 5–8/day from the evergreen shortlist, per-post 48h view + follow count from Snap Insights, format-level kill | Alex screenshots Insights 1×/day (2 min) | P(at least one Spotlight >100K) ≈ 30% [GUESS]; followers by 10-05 P50 ~700, P90 5K |
| S2 | **Series with a Snap-native hook**: "Fanbase of the day — part 2 tomorrow" and Saved Story "Shithouse of the Week"; follows are the metric, not views | 0 extra (formats exist) | Snap's own advice; conversion unknown. Test only if S1 shows ≥5K-view Spotlights |
| S3 | **Promote Your Profile ad test, kr50/day × 3 days** to measure cost per follower | kr150 | Blocked while the Business org says "not spend ready" (US-locked address) [DATA memory]; fix first or skip |
| S4 | **Kill after 10-04 and keep a phone-only 1 post/day** | saves $25 | If S1 misses the rule below |

### THE GO/NO-GO RULE FOR ONEUP (decide Sun 10-04, before the 10-05 charge)
Measure (Alex sends the Snapchat Insights/profile screenshot 10-02, 10-03, 10-04):
- **KEEP OneUp ($25/mo) if ANY of:** followers ≥1,000 · ≥2 Spotlights with ≥50K views · ≥100 follows per 10K Spotlight views on the best 3 posts. Reason: $25/mo breaks even against the FB ad (kr2–5 per follow, PM 09-29, ≈$0.2–0.5) at ~50–125 Snapchat follows/month, so any real Spotlight traction pays for it.
- **DROP if ALL of:** followers <300 · median Spotlight <1,000 views · no Spotlight >10K. Then Alex posts the 1–2 best reels/day from his phone (works; the Ronaldo Bench-GOAT post did) or parks Snapchat.
- **In between (300–999 followers):** keep one more month at 3/day and re-read 11-04 against ≥2,500 followers, else drop.
- $25 is not the constraint. Claude time is (see §5).

### 14-day plan (daily spec)
- Spotlight 3/day (12:00, 17:00, 21:00 Oslo; matchdays 4–5): own-made evergreen reels only (bees, Goldbridge, maths reel, Lee Kang-in, Pep/Manuel per snapchat_evergreen list); 10–30 s; 1–3 specific topic tags (#premierleague #footballmemes #<club>); clean MP4s. Public Story 1–3/day with the best image. Test one 61–75 s Spotlight/day only if we later approach the bar.
- No "Snapchat 0 followers" posts on other platforms. One bio link (Snapcode in IG story or Threads bio text only, Threads rejects snapchat.com links).
- Instrument: Alex sends a daily screenshot (follower count + top 3 Spotlight views). We add a `snapchat` line to the scoreboard. There is no API for us. [DATA no instrument]

### Monetization path
None before 2027 in the P50 case: needs 50K + Snap Star + 15K view-hours; the payout at the bar is ≈$135–405/mo (Spotlight) plus Story mid-roll [secondary, unverified]. Creator Subscriptions (60% share) and Collab Studio need Snap Star. Real value = reach to UK/EU 18–24 for Ball IQ, if it converts (unmeasured).

### Would I keep investing? YES, at a measured, capped level (fan-out only, 15 min/day) until 10-04, then by the rule. It is the only small platform with non-follower distribution and a demographic we lack.

---

## 5. HARD ROI RANKING (vs each other and vs the big platforms)

Effort assumption: one operator (Claude live session + Alex's phone) with ~4–5 focused hours/day; money pressure binding. ROI = P50 net followers (or cash) by 01-01 per Claude-hour, discounted by option value. [GUESS unless tagged]

| rank | platform | P50 gain by 01-01 | Claude time/day | P50 followers/hr | note |
|---|---|---|---|---|---|
| 1 | Threads | +8.5K at +90/day [INFERRED from PM] | 60–90 min | 5–8/hr | converts 3.8/10K views; hits carry it |
| 2 | Facebook | +3.5K at +38/day (ad-assisted) [INFERRED] | 30–45 min | 6–9/hr | 7.3/10K views; ad kr50/day is separate money |
| 3 | X | ≈0 followers now; Rewards first payout 10-09 | 60+ min | cash, not followers | only near-term $ |
| **4** | **Snapchat** | **+3K (P10 300, P90 30K)** | **15 min** | **~30/hr on 15 min (option)** | best small; kill by rule 10-04 |
| 5 | Telegram | +1.2K | 5 min + 2 min CTA | ~20/hr | zero cost, owned |
| 6 | Instagram | +2/day → ~0 | 60+ min | ≈0 | not my scope; still flat |
| 7 | TikTok / YouTube | −1/day / 0 | | ≈0 | not my scope |
| 8 | Bluesky | +300 | 0–5 min (mirror) | ~10/hr (mirror) | cut all live time |
| 9 | WhatsApp Channel | ~0 | 0 (parked) | 0 | risk to Alex's personal account |

What to do with the freed time: ~40 min/day (Bluesky replies) + ~15 min/day (WhatsApp Chrome) → Threads hit-post follow-ups and the FB tweet-on-photo test.

---

## 6. SEQUENCED ACTIONS (owner / date)

1. **Today, Claude:** stop Bluesky reply rounds and WhatsApp Chrome posting; strip music-credit lines from Telegram and Bluesky text; add `curl t.me/s/shithouseryhq` subs + Bluesky API followers to the PM morning read. Threshold: subs and followers appear in scoreboard 09-30.
2. **Today, Claude:** add 1 Telegram CTA reply under the day's top hit (start with the Cissé 142K Threads post if still live).
3. **Alex, 10-02/03/04:** one Snapchat Insights screenshot per day. Rule in §4.
4. **Alex, when he chooses:** confirm no betting promos on Telegram (default no); own a TON/Gram wallet at 1K subs.
5. **10-06:** Bluesky check against ≥1,345 (already in the PM); if no post ≥25 likes and followers ≤1,350, drop to automatic mirror.
6. **10-13:** Telegram ≥250 subs? WhatsApp: only if Alex tested. Snapchat: re-read per rule.

---

## 7. TEN-LINE SUMMARY
1. Bluesky: F. 1,327 followers flat, median 1 like on 95 originals, 7 replies → 1 like; same-size Memecastle/utdheisenberg get median 7–18. Park as an image-only mirror; kill replies-only.
2. Telegram: D. 2 subscribers, 1–2 views/post after 25 posts and a bio link on 45K X; volume is not the constraint, inflow is. Keep as a mirror + one CTA reply/day; 1K subs P50 ≈ mid-Dec; ad share ≈ pocket money (≤$100 by 01-01).
3. WhatsApp Channel: F. 0 followers, no instrument, posting is a Chrome hack inside Alex's personal WhatsApp (ban risk). Park.
4. Snapchat: D provisional. Zero measurements after 16 posts; the bar (50K + 15K view-hours ≈ 175K views/day) is unreachable by 01-01 (P ≈ 3%); payout at the bar ≈ $135–405/mo.
5. But Snapchat is the only small platform with non-follower distribution (UK 23M users, 18–24 = 38%); keep 3 Spotlights/day as fan-out.
6. OneUp go/no-go 10-04: keep if followers ≥1,000, or 2 Spotlights ≥50K, or ≥100 follows/10K views; drop if <300 followers and no Spotlight >10K. $25 breaks even vs the FB ad at ~50–125 followers/month.
7. Small-four ROI rank: Snapchat > Telegram > Bluesky (mirror) > WhatsApp (park). Vs big platforms only Threads and Facebook (and X's payout) beat them.
8. Combined P50 upside of all four by 01-01 ≈ +5K followers (0.5% of the 1M goal); they cannot close the gap and must not take live time from Threads/FB/X.
9. Consolidate the three one-way channels (IG Broadcast, Telegram, WhatsApp) into Telegram; stop diluting the X bio with three non-Ball-IQ links.
10. Instruments to add: Telegram t.me/s counters + Bluesky API in the PM read (free, today); Snapchat needs Alex's daily screenshot; WhatsApp has none, another reason to park it.
