# Telegram + Snapchat playbook — 2026-09-28

Research agent, read-only, ~35 min. Times in Oslo (UTC+2 until 25 Oct, then UTC+1).
Rule used: post-cutoff (2025–26) facts need 2 sources. **[1src]** = single source, **[obs]** = my own reading of a public page today (one observation, not a trend), **[official]** = Telegram/Snap's own page. Everything shaky is repeated under UNVERIFIED at the bottom.

Starting point: t.me/shithouseryhq (0 subs, Postiz integration `cmulfu6480bvirt0ytmwmg3j7` already wired, see PLATFORM_PLANS.md), Snapchat public profile `shithouseryhq` (0 followers).

**Bottom line**
- **Telegram** is a *distribution + direct-deal* platform, not an algorithm platform. Nothing recommends a new channel to strangers until it has a few thousand subscribers. Growth has to be imported from X (45.2K) and IG, and then compounded through forwards and Similar Channels. Telegram's ad revenue share is real (50%, ≥1,000 subs) but thin for an entertainment channel. The money is in sponsored posts and Telegram's "Suggested Posts" (brands pay in Stars/TON), and both need view counts, not subscriber counts.
- **Snapchat** is an *algorithm platform* (Spotlight works like TikTok) with a very high pay bar: 50K followers, 15,000 view-hours in 28 days and Snap Star status. It is strict on originality (no reposts, no watermarks, no fully AI-generated video). The sweep-and-repost part of our IG/X machine **does not transfer**. Only own-made reels (meme vessels + our text, maths cards, quiz reels) should go there.

---

## TELEGRAM

### What the platform actually does (verified)
| Fact | Source |
|---|---|
| No feed algorithm: every post goes to every subscriber (muting is the only filter) | common across all guides; Telegram's design |
| **Similar Channels**: shown when a user joins a channel. Only public channels, picked "automatically based on similarities in their subscriber bases" | [official] telegram.org/blog/similar-channels (30 Nov 2023) + core.telegram.org/api/recommend |
| Similar Channels needs a public @username. Small or new channels usually have *no* list; "a solid few thousand subscribers almost always have a list" | tguard.pro [1src on the threshold, Telegram publishes none] |
| **Public post search** ("Posts" tab, full-text + hashtag across all public channels, including ones the user hasn't joined). **Premium-only** at launch | [official] telegram.org/blog/post-search-story-albums-and-more (v11.14, 31 Jul 2025) + AlternativeTo, TechNave |
| Global search already indexes channel **name + @username + description** | multiple guides |
| **Boosts**: Premium users boost channels; levels unlock Stories (L1 = 1 story/day, +1 per level), custom reactions, colours, wallpaper, and turning off ads at a minimum level. The boosts needed per level scale with subscriber count | [official] blog/similar-channels + core.telegram.org/api/revenue ("disable ads after minimum boost level") + such.chat, boostifyfox |
| **Suggested Posts** (1 Jul 2025): anyone can DM a proposed post to a channel with a Stars or TON offer. The admin can edit, schedule or reject it. The owner is paid **24 h after it goes live**, and the payment is refunded if the post is deleted early. Telegram recommends TON because Star purchases can be refunded by Apple within 21 days | [official] telegram.org/blog/checklists-suggested-posts + BusinessToday, Neowin |
| **Star reactions / paid media / Star subscriptions** (Aug 2024): the creator gets 100% of Stars. Paid-subscription invite links are billed monthly | [official] telegram.org/blog/superchannels-star-reactions-subscriptions |
| **Super channels**: admins can post as their own profile or as another channel | same [official] |
| Telegram Ads self-serve: minimum CPM **0.1 TON**. Ads target **specific public channels with ≥1,000 subs** (by link) | [official] ads.telegram.org/getting-started + propellerads/invitemember |

### Growth levers, ranked by expected impact for us
1. **Import from our own audiences (by far #1).** We have X @ShithouseryHQ at 45.2K, plus IG, Threads and FB. Telegram has no discovery engine at 0 subs, so every early subscriber comes from a link. Actions:
   - Add a `/tg` short link (same pattern as the `/wa` Vercel redirect in 7d15bf5f) → t.me/shithouseryhq, and put it in every bio.
   - Once a day on X, reply-chain it under a hit post ("full-res + the ones too spicy for here → balliq.app/tg"). Telegram's selling point is the **uncensored/early** angle: "the ones X won't push".
   - Pin a Telegram CTA in the IG and Threads highlight/link-in-bio.
   - Expected: 0.2–1% of an engaged X audience converts over a month. That gives roughly **100–400 subs from X alone in month 1** (my estimate, not sourced).
2. **Forward-worthiness.** Forwards are the only organic viral loop (widely stated; Telegram has no share algorithm). Content that gets forwarded into group chats is *ragebait aimed at one fanbase* ("Spurs fans, explain this") and *absurd-but-true maths cards*. Both are native to us. Put `@shithouseryhq` on every image (the watermark travels with the forward). Telegram shows "Forwarded from Shithousery HQ" with a tap-to-join link on forwards.
3. **Cross-promo / SFS with similar English football banter channels** once we have **≥1,000 subs** (below that nobody trades). Barter cross-promo is quoted at **$0.05–0.20 per subscriber**, against $0.30–1.00 for paid [1src, brandghost]. It also *builds the subscriber overlap that feeds Similar Channels*: two birds. Targets (see table below): Troll Football (145K), Football memes (34K), smaller banter channels. Shared folders (`t.me/addlist/…` links, a bundle of channels users add in one tap) are the standard format for multi-channel swaps. Use one with 5–10 football banter channels at ≥1K.
4. **Similar Channels.** This is automatic and gated by overlap, so it can't be applied for. It switches on after lever 1 plus lever 3 create overlap. Expect it to matter from **~2–5K subs** [1src threshold]. Keep the @username, name and description keyword-clean: `Shithousery HQ | Football Memes & Banter`. The description should contain "football memes", "banter", "Premier League", "transfer". Global search indexes these.
5. **Discussion group (comments).** Attach a linked discussion group. Comments are where banter channels keep people from muting, and the "N comments" counter is social proof. Moderation load is low at our size. Also post our match-night live lines there (a live-reaction thread per big match).
6. **Polls / quizzes.** These are native Telegram objects: one tap, no leaving the app. A quiz poll can also carry the Ball IQ angle ("Name the XI → balliq.app"). Good for keeping views per post high. They don't drive subscribers.
7. **Public post search / hashtags.** Premium-only search, so reach is small. Still add 1–2 hashtags per post (`#PremierLeague #Spurs`); it costs nothing.
8. **Stories / boosts.** Low priority. They need Premium boosters. Skip until ~5K. Don't buy boosts; they are sold by SMM shops, and fake boosts or subscribers poison view rate, which is what advertisers price on.
9. **Telegram Ads (paid, parked).** Only after ≥1K and only if Alex wants to spend. You can target individual football channels. Entertainment CPM is quoted at around $1 per 1K views, and cost per subscriber at $1.50–5.00 [single blog each, see UNVERIFIED]. Direct Ads accounts have a very high minimum deposit; most people go through resellers at €1–5K [propellerads, invitemember, conflicting]. **Not for now.**

### What football content wins on Telegram (vs X/IG)
Live reads of real channels today [obs, t.me/s previews, 2026-09-28]:

| Channel | Subs | Type | Posts/day | Views/post | View rate | Monetization seen |
|---|---|---|---|---|---|---|
| @Troll_Football_Telegram "Troll Football" | 145K | EN memes/banter + polls | ~8–12 | 18–32K | ~12–22% | betting-platform promo links, separate ads-manager contact |
| @soccer_memes "Football memes" | 34.4K | EN memes (images + some video) | ~15–20 | 2–2.8K | ~7% | none seen |
| @FabrizioRomanoTG | 401K | transfer news | ~15–20 | 18–25K | ~5% | Betway Scores promo |
| @Sport_HUB_football "Sports Hub" | 1.35M | EN news aggregator (links) | ~10–15 | 1.3–4.3K | **~0.2%** | gambling/casino promos |
| Also listed (TGStat/tgrate): Nigeria Football Hub 1.2M, Sports Direct 375–574K, Premier League News 245–260K, Sky Sports Football 259K, Just Football 102K, Transfer News Football 98K, SoccerVictor 131K (tips) | | | | | | |

What this tells us:
- **Banter channels hold the best view rate.** Troll Football gets roughly 5–100× the view rate of the giant news channels. The huge "football" channels are mostly dead or inflated subscriber piles (Sports Hub: 1.35M subs, ~3K views). Advertisers on Telegram price on views, so a real 20K channel with 20% view rate is worth more than a fake 1M.
- **Cadence ceiling:** memes channels sit at 8–20 posts/day without dying [obs]. The failure mode is **mute, not unsubscribe**. Muted users stop opening, so view rate falls. Use **silent send** (no notification) for filler posts and a normal ping only for the 2–4 best posts a day.
- **Monetization norm in the niche is betting promos.** Our memory says no Kalshi/Stake on carousels; decide with Alex whether that applies to Telegram too (see WHAT WE NEED FROM ALEX).
- **Goal clips:** the big meme channels mostly avoid raw broadcast goal clips and post memes, screenshots and short reaction edits. Rights holders (PL, LaLiga) do send takedowns to Telegram, and a public channel is an easy target. Rule: **no raw broadcast goal clips on Telegram**. Clips that are ours (meme vessels, overlays, reaction edits) are fine. [Takedown behaviour: UNVERIFIED in this pass]

**Content mix (per day, non-matchday):**
- 50% memes and sweep images (the same gated items as IG/X; Telegram has no originality penalty, so reposting our own cross-platform output is fine)
- 15% maths cards / absurd-but-true stats (the most forwardable)
- 15% ragebait one-liners aimed at one fanbase (text + image, one line)
- 10% polls / quiz polls (1–2/day)
- 10% our reels (upload the MP4 natively; Telegram autoplays)

**Matchday:** a live-reaction burst of 1 post per key moment (goal, red, VAR) as **text + screenshot/meme within 2 min**, and 1 "FT verdict" post. This is where Telegram beats IG: instant, unthrottled, chronological.

**Cadence:** 6–10/day baseline (the Postiz fan-out already delivers most of this), 12–20 on big matchdays. Only 2–4 with sound, the rest silent. Best times (UK/EU evenings + UK lunch, no Telegram-specific source): **12:30–13:30, 18:00–19:00, 21:00–23:30 Oslo**, plus live around kickoffs and full time.

### First 30 days (milestones)
| Day | Action | Milestone |
|---|---|---|
| 1–2 | Name `Shithousery HQ | Football Memes`, keyword description, avatar = IG avatar, pinned welcome post ("what this is + forward us to a mate who supports Spurs"), linked discussion group, reactions on. Add `/tg` redirect. Every Postiz gated post → Telegram (already wired). | Channel looks alive: ≥30 posts before the first promo |
| 3–7 | Put the `/tg` link in X, IG, Threads, Bluesky and FB bios. One X reply-CTA per day under a hit. One maths card per day with the `@shithouseryhq` stamp. | **100 subs** |
| 8–14 | Matchday live bursts (Sat/Sun). 1–2 polls/day. Start a DM list of 10–20 English football banter channels between 1K and 50K subs for SFS (message them only after we pass 1K; the list costs nothing). | **300 subs**, view rate ≥30% |
| 15–30 | Keep importing from X/IG. At 1,000: open ad revenue (Settings → Statistics → Monetization; needs Fragment + a TON wallet). Run the first 2–3 SFS swaps and one shared addlist folder with 5 banter channels. | **1,000 subs by ~day 30 (stretch)**, 600 realistic. View rate ≥25%. |
| 31–90 | SFS weekly; Similar Channels should start to show us. | **3–5K by day 90**, the point where Similar Channels and a sponsored-post rate card make sense |

Realistic curve [blog estimates, UNVERIFIED]: guides put a cold channel's first 1,000 at 2–4 months. We aren't cold: we have ~50K+ followers elsewhere, so 1K in 30–45 days is plausible. 10K is a 6–12-month number unless one post goes viral via forwards.

### Monetization path
1. **Ad revenue share, ≥1,000 subs, public channel: 50% of ad revenue from sponsored messages in the channel** [official, blog/monetization-for-channels + ToS + CoinTelegraph/Cryptopolitan].
   - Paid out via **Fragment**, no fees, withdrawable in TON (now renamed **Gram/GRAM** since 15 Jun 2026 per TON Foundation + BingX + AMBCrypto). Telegram's ToS now says rewards are paid as "Stars or Gram balance". Gram rewards are withdrawable after 2 days, Stars after 21 days.
   - The ToS says the program "may be partially or fully unavailable to certain channels … regions".
   - KYC: not stated in the ToS. In practice Fragment withdrawal needs a TON wallet, and **Alex has to own that wallet** (see below).
   - Premium users don't see ads.
   - Realistic: entertainment is around **$1 CPM gross**. One source claims ~$15/month for a 10K entertainment channel [1src, UNVERIFIED]. **Treat as pocket money.**
2. **Suggested Posts (paid posts in Stars/TON) and direct sponsored posts. The real money.** Market rates quoted at **$5–30 per 1,000 subscribers per post** [1src, brandghost/growity cluster], priced in practice on *average views*. At 10K subs and 25% views that is about $50–300 per post. Buyers in football Telegram are mostly betting, prediction markets, VPNs, fantasy apps and other channels. Set a rate card at 5K.
3. **Star reactions + paid media (Stars):** creator keeps 100%. Payout **$0.013 per Star** [official ToS + scrile/telestars]. Small but zero effort: enable paid reactions.
4. **Star subscription (paid private channel):** only makes sense later ("the ones too spicy for public"). Park until 10K+.
5. **Funnel value:** Telegram gives 100% delivery to subscribers, so it is the best owned channel for pushing Ball IQ and daily games (quiz polls → balliq.app). This is probably worth more than the ad share.

---

## SNAPCHAT

### Monetization, in full (verified where marked)
- **Unified Creator Monetization Program** (launched 1 Feb 2025; ads placed *between Snaps in Public Stories* and *inside Spotlight videos*). **Invite-only.**
  - **Current eligibility** [official help 14669003687444 + creatorsagency/syllaby/kompozy]:
    - ≥ **50,000 followers**
    - **15,000 hours of view time in the last 28 days, ≥3,000 of them from Spotlight**
    - **Snap Star** verification, 18+, eligible country (**Norway is on the payout list** [official help 7012298096788])
    - original, advertiser-friendly content
  - **Since 7 May 2026:** ≥ **100 hours of Spotlight view time per 28 days** to keep "maximum Creator Rewards" [official help + socialday.live].
  - **Launch rules (Feb 2025), superseded:** 25 posts/month to Saved Stories or Spotlight, active on 10 of the last 28 days, and one of 10M Snap views / 1M Spotlight views / 12K view-hours [official newsroom]. The 25 posts on 10 days is still the right operating habit.
  - **Spotlight length to earn:** the help page now says **≥30 s**. The Feb 2025 launch said **>60 s** [official newsroom], and many 2026 blogs still say 1 min. **Conflict: use ≥61 s for any Spotlight we want to earn on and 10–30 s for reach, until our in-app Creator Hub shows the rule.**
  - Cash-out: minimum $100, daily [official help].
- **Payout level:** Spotlight **~$0.10–0.30 per 1K views** is widely quoted. One UK creator reported £68 for 2.3M views [lilachbullock, fluxnote; secondary, UNVERIFIED]. Snap publishes no RPM [official creator blog says "vary widely"].
- **Spotlight Challenges (cash prizes):** **ended**. Search results say "ended 1 May 2024"; the help page now 404s. Treat as dead.
- **Old Spotlight Rewards (1K-follower bar):** ended 31 Jan 2025, replaced by the unified program [creatorsagency + newsroom].
- **Snap Star:** a badge plus analytics plus access to monetization, Collab Studio and Subscriptions. **There is no public threshold.** A "Snap Star Verification" form appears in Settings only when you're eligible. Blogs cite ~50K subscribers and 25 posts/month [2 blogs, not official]. **The badge is what unlocks first; everything else hangs off it.**
- **Snap Star Collab Studio:** brand-deal marketplace run through agencies (Whalar, Influencer, Billion Dollar Boy, The Goat Agency; plus Omnicom Creo) [The Drum + Digiday + PRNewswire]. Snap Stars only.
- **Creator Subscriptions:** alpha from 23 Feb 2026 in the US, expanding to Snap Stars in CA/UK/FR [TechCrunch 17 Feb 2026, 1src, UNVERIFIED re Norway].
- **Discover / Shows:** partner-only and curated: media companies, sports leagues, selected creators. The Content Partners page names no open application. **Not reachable for us.**
- **Lens Creator Rewards:** exists for AR lens builders (Lens Studio). Not our business. Skip.
- **Fully AI-generated video:** not eligible for Spotlight recommendation or monetization since **31 Jul 2026** [TechCrunch + Tubefilter + Ubergizmo]. AI-assisted is fine. Our meme-vessel reels with our text are human-made edits: OK. **Never** post a fully Higgsfield/AI-generated clip to Spotlight.

### Originality: the constraint that shapes everything
Snap's Recommendation Eligibility rules [official values.snap.com, quality section] make these **not eligible** for recommendation:
- content "you did not create, and that you have not transformed in a creative way (via commentary, reactions, etc.)"
- low-effort "reaction" content that is a pretext to repost
- "repeatedly posting the same content … with minimal creative differences"

Watermarks from other platforms get rejected (web uploader spec + multiple guides).

⇒ **Snapchat gets only: our meme-vessel reels (own caption plates), maths cards animated to video, quiz reels, name-a-player/Guess-the-XI videos, and Stories made from our own images.** No sweep carousels of other people's tweets, no raw broadcast clips, no TikTok/IG-watermarked exports. Export clean MP4s from the render pipeline, never re-downloaded ones. This matches our TikTok rule (feedback_tiktok_ineligible_reposts).

### Growth: how to grow a public profile + Spotlight in 2026
- **Spotlight algorithm:** ranks by performance, not follower count. It tests each Snap on small cohorts and expands if they react well. Signals: **watch time and completion (strongest), rewatches/loops, shares, follows**, then likes; skips, hides and reports count against [searchlightsocial, mysnapchatplanets, watsspace; consistent across guides, Snap doesn't publish weights]. The first 2 s decide it.
- **Length:** 10–30 s for reach (completion). ≥61 s only for deliberate earning attempts later (see conflict above). Web spec: vertical, ≥540×960, .mp4. The max length is quoted as 60 s (web uploader, older help) or 3 min (2026 blogs), so **UNVERIFIED**; check the uploader.
- **Topics / hashtags:** add 1–3 *specific* #topics at submission (#PremierLeague, #FootballMemes, #Arsenal). Stuffing unrelated tags makes rejection likely [multiple guides]. Caption limit reported as 160 chars.
- **Roles:**
  - *Spotlight* = discovery. Each Snap is judged alone. This is where followers come from.
  - *Public Story* = the follower relationship. Monetizable mid-roll later. Post 3–8 snaps/day: memes, polls-as-images, matchday reactions.
  - *Saved Stories* = evergreen series on the profile ("Shithouse of the Week", "Absurd maths"). They count toward the 25 posts/month.
- **Frequency:** guides say "3–5 Spotlight per week" as a floor. Our volume lets us do **2–4 Spotlight/day plus a daily Public Story**, as long as each is genuinely different (the repeat rule).
- **Best time:** one guide says 19:00 local for the under-25 audience [1src]. Our audience is UK/EU, so **19:00–22:00 Oslo** for Spotlight and matchday bursts for Stories.
- **Niche examples:** Snapchat surfaces "football memes" topic hubs (Ronaldo/Messi edits, PE-teacher chaos, fan-reaction edits) [snapchat.com/entertainment/funny/football-memes]. I **could not find a documented football meme account's growth story** on Snapchat. UNVERIFIED; worth a manual scroll of the topic hub in the app.

### Web uploader (profile.snapchat.com) + tools
- Web upload supports Spotlight, Public Story and Saved Story; drag-drop MP4 [official help 7012293789972 + business help].
- **Spotlight and Story can't be sent in one web upload.** Repeat the upload per destination [secondary; check].
- **Scheduling:** conflicting. Our own PLATFORM_PLANS note plus one secondary source say the uploader has "Schedule"; ShortSync says there's no native Spotlight scheduling. **Check in the UI on first use.**
- **Daily limits:** none documented.
- **API:** Snap's **Public Profile API** officially supports posting Stories, Saved Stories and Spotlight for partners [official developers.snap.com]. **OneUp** schedules Snapchat Stories and Spotlight to Public Profiles [official oneupapp.io]. Also ShortSync, bundle.social, CodivUpload. **Later** has a Snapchat help article (403 today). Vista Social: not confirmed.
- **Worth paying for?** **Not yet.** At 3–6 posts/day the web uploader (driven by us) is enough. Revisit if we want Metricool-style queueing. Metricool is our 2nd scheduler; check whether it lists Snapchat before buying anything (it didn't in reference_metricool_connector).

### Content mix + cadence (Snapchat)
- **Spotlight 2–4/day:** our best own-made reels only (meme vessels with SHQ plate, maths-card videos, quiz reels, name-a-player). No watermark, no sweep content, no raw footage, no fully-AI.
- **Public Story 3–8 snaps/day:** our own images (maths cards, ragebait one-liners, polls as stickers in-app are app-only), matchday reactions.
- **Saved Stories:** 2 evergreen series, refreshed weekly.
- **Every day at least 1 post** (the old 10-of-28-days habit and the new view-time model both reward consistency).

### First 30 days
| Day | Action | Milestone |
|---|---|---|
| 1–3 | Profile: name `Shithousery HQ`, category Entertainment/Sports, bio with the `/ig` or Ball IQ link, Snapcode in the other bios. Post 3 Spotlights/day from the gated reel pool (clean exports). | 10 Spotlights live |
| 4–14 | 2–4 Spotlight/day + a daily Public Story. Log each Spotlight's views at 48 h in `social/state/` (insights script later). Kill formats with <1K views after 5 tries. | first Spotlight >10K views; **500 followers** |
| 15–30 | Double down on the top 2 formats. Test one 61–75 s Spotlight per day (future earning-length). | **2–5K followers**; one Spotlight >100K (stretch) |
| 90 | | **10–20K**; watch Settings for the Snap Star form |
| 6–12 mo | | 50K + 15K view-hours/28d = monetization invite possible. Honest read: **Snapchat pays us nothing in 2026**; its value is reach plus a young UK audience for Ball IQ. |

---

## WHAT WE NEED FROM ALEX
Almost nothing. Three things only he can decide or own:
1. **Betting/prediction-market promos on Telegram: yes or no?** This is the niche's main buyer (Troll Football and Fabrizio both run them). Default until he says otherwise: **no**, same as carousels.
2. **At 1,000 Telegram subs (≈ weeks away): a TON/Gram wallet he owns** (Tonkeeper or Telegram Wallet) to link on Fragment for ad-revenue withdrawal. We can't create accounts or handle keys. Nothing needed before 1K.
3. **Snapchat login for the web uploader**, if we're to post it ourselves. It must come through his browser session (we never type the password). If he'd rather post from his phone, send files in chat per feedback_send_manual_posts_in_chat.

## UNVERIFIED / single-source / conflicting
- Similar Channels threshold ("a few thousand subs"): tguard.pro only. Telegram publishes none.
- Telegram ad-revenue earnings (~$1 CPM entertainment, "$15/mo for 10K entertainment"): single blogs. Treat as order-of-magnitude only.
- Telegram paid-post market rate "$5–30 per 1K subs" and barter SFS "$0.05–0.20/sub": 1–2 blogs of one cluster (brandghost/growity).
- Telegram Ads direct-account minimum (a quoted "€2,000,000" vs "no public minimum" on the official page vs reseller €1–5K): conflicting. The official page states only the 0.1 TON min CPM.
- Telegram "Gram" payout wording: in the official ToS, and the token rename is confirmed by 3 sources. The in-app monetization screen wording is not checked.
- Regional availability of Telegram ad revenue for a Norway-owned, UK-audience channel: the ToS reserves the right to exclude regions. Not confirmed either way.
- Copyright takedown behaviour for goal clips on Telegram: not researched this pass. Rule is conservative (no raw broadcast clips).
- Growth curves (0→1K in 2–4 months; 5K in 3 months case): blog anecdotes, no verifiable named channel history (TGStat growth charts need JS/login).
- Channel view counts in the table: my single read of t.me/s previews today, via a summarising fetch. Directionally right, not audited.
- Snapchat Spotlight monetizable length: official help says ≥30 s; official 2025 launch and many 2026 blogs say >60 s. **Conflict.**
- Snapchat Spotlight max length (60 s vs 3 min) and whether the web uploader can schedule: conflicting secondary sources.
- Snapchat RPM $0.10–0.30/1K and the £68/2.3M example: secondary blogs only.
- Snap Star thresholds (~50K, 25 posts/mo): blogs only. Snap publishes none.
- Snapchat Creator Subscriptions outside the US: TechCrunch only; Norway not mentioned.
- Spotlight Challenges end date (1 May 2024): search snippet only (the help page 404s).
- No documented football-meme Snapchat growth case found.

## Sources (main)
- telegram.org/blog/monetization-for-channels · telegram.org/tos/content-creator-rewards · telegram.org/blog/similar-channels · core.telegram.org/api/recommend · core.telegram.org/api/revenue · telegram.org/blog/post-search-story-albums-and-more · telegram.org/blog/checklists-suggested-posts · telegram.org/blog/superchannels-star-reactions-subscriptions · ads.telegram.org/getting-started
- cointelegraph.com/news/telegram-channels-50-ad-revenue · cryptopolitan (50% share) · tguard.pro/en/blog/telegram-similar-channels · bingx/ambcrypto/x.com/ton_blockchain (Gram rename) · such.chat, boostifyfox (boost levels) · brandghost, growity, richads, propellerads, invitemember (ads/pricing) · businesstoday, neowin (suggested posts)
- t.me/s/Troll_Football_Telegram · t.me/s/soccer_memes · t.me/s/FabrizioRomanoTG · t.me/s/Sport_HUB_football · en.tgstat.com/ratings/channels/sport · tgrate.com/channels/football
- help.snapchat.com/…/14669003687444 (Monetization Program) · newsroom.snap.com/snapchat-new-creator-monetization · techcrunch 2024-12-16 (unified program) · help.snapchat.com/…/7012298096788 (payout countries) · values.snap.com content-guidelines-recommendation-eligibility (quality) · techcrunch 2026-07-31 + tubefilter 2026-08-03 + ubergizmo (AI video) · socialday.live (100-hour rule) · techcrunch 2026-02-17 (Creator Subscriptions) · thedrum, digiday, prnewswire (Collab Studio) · developers.snap.com Public Profile API · oneupapp.io/snapchat-features · shortsync.app · lilachbullock, fluxnote (RPM) · creatorsagency, syllaby, kompozy (eligibility)
