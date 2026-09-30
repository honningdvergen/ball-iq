# AUDIT: video-platforms (TikTok + YouTube) · 2026-09-29 · read-only

Tags: [DATA] measured (source named) · [INFERRED] reasoned from data · [GUESS] no evidence, my estimate. Times Oslo.
Sources: Metricool TikTok analytics (brand 7074932, 91 posts 08-24→09-28, pulled today), social/state/insights/2026-09-29.md (YouTube Analytics API), bangers/LIBRARY_youtube.md, bangers/LIBRARY_video.md, pm/2026-09-27..29, posts_log.jsonl, memory (playbook, diagnosis 09-25, ypp_speedrun, tiktok_ineligible), vidIQ (5 calls used, then the account ran out of credits: 5 of my 15), WebSearch (vendor benchmarks, weak).
No instrument, stated up front: TikTok reach/For-You/search traffic split, completion rate and per-video follows are `null` in Metricool (TKPO11/13/16/21 all null); TikTok followers only exist for 5 days (09-23→27); Ball IQ visits from TikTok/YouTube (Clarity source query returned empty).

---

# 1. TIKTOK · @shithouseryhq · 16.2K

## GRADE: D
Criteria: growth (F: 16,213 on 09-23 → 16,207 on 09-27, daily net −3/0/−2/−1 [DATA Metricool TKEV07/08]) · reach per post (D: median 794 since 09-20) · tail/hit rate (F: 0 posts >10K in 43) · format-fit (C) · instrumentation (F) · brand upside (C: 16K UK/EU-skewed followers, no payout, Norway).

## What the data says (5 bullets)
1. **The tail disappeared on ~09-20, not the median.** [DATA, 91 posts, Metricool]

| window | posts | median views | mean | >5K views | best |
|---|---|---|---|---|---|
| 08-24 → 09-19 (raw clip reposts in Alex/Postiz voice) | 48 | ~1,050 | ~10,000 | **6 (12.5%)** | 220K, 104K, 73K, 20K, 13.7K, 7.8K |
| 09-20 → 09-28 (templates, own cards, MacLeod-music reels, 4.8 posts/day) | 43 | 794 | 969 | **2 (4.7%)** | 5,401, 5,077 |

   6 posts = 80% of all 522K views in the sample. The six: "Nah if only Goldbridge knew" 220K (08-31), "Jamie Carragher flexing cash after the bankruptcy news" 104K (08-27), "Sky sports completely lost the plot on transfer deadline day" 73K (09-01), "Mark Goldbridge reacts as Man United concede… Everton" 19.9K (09-06), "Yeah Tottenham manager De Zerbi will be getting a nice payout" 13.7K (09-19), "Curtis Jones in Italy just feels wrong" 7.8K (08-26). All are other people's clips with a plain one-line caption, no hashtags, no music credit. Shares/1K views fell 18.3 → 6.2.
2. **Every one of them was later branded "Unoriginal, low-quality" on TikTok's own screen (Alex screenshots 09-23, memory feedback_tiktok_ineligible_reposts).** So the account's only proven growth engine is exactly what TikTok now blocks from For You. [DATA + memory] The two best post-09-20 posts (5.4K Andros Townsend pitch-roller 09-25 10:00; 5.1K "Man City got found guilty of 114/115 charges, that is madness" 09-25 15:08) are the same shape: a real clip at news speed. [DATA]
3. **Our "clean" formats have a ceiling of ~1K.** Own-card video (Brobbey 1,365; Ben Davies/lawyers cards), template + text (Messi/Yamal 937, "every fan in the int'l break vs first game back" 936), MacLeod-bed reels (Tottenham title race 580, Haaland 880). Max of 25 clean posts 09-22→09-28 = 1,693. [DATA]
4. **Followers do not move with views.** 09-23→09-27 the posts made ~24K views (sum of the 22 posts dated 09-23..27) for net −6 followers ≈ 0 follows/10K views (compare Threads 3.8, FB 7.3, IG 1.4 [pm/2026-09-29]). Even the 400K views in late Aug left the account at ~16–17K (16.2K on 09-20 per baseline memo). [DATA, weak: no earlier follower series]
5. **Posting time is not a lever and volume is not either.** Median views by Oslo hour band since 09-20: 08-11 540 · 12-15 923 · 16-19 937 · 20-23 722 (n=8–13 each) [DATA]. 4.8 posts/day made ~3.8K views/day. [DATA] The overnight-drip theory from IG (median 800 vs 1.5K) does not replicate on TikTok.

## Root causes, ranked
1. **We moved off the only thing TikTok rewarded (real clip + news speed + clip's own audio) onto the thing TikTok gives a ~1K seed and no expansion (our template/our music).** ~85% confidence [INFERRED from the table above; confounded with TikTok's 09-24 guideline change, which we cannot separate].
2. **No trending/native sound.** The account is a Business account (Commercial Music Library only; DIRECT_POST cannot choose a sound) [memory reference_platform_algorithms + project_money_goal]. Winning TikToks this week either keep the clip's own audio (@croatball "Mine! Mine!" Nemo 1.6M on 48K followers; @awayendlaugh commentary 1.4M on 34K) or ride a hit track (@afcleonidas Arsenal seagulls, unidentified rap, 1.3M on 2.5K followers) [DATA vidIQ 09-29]. Our posts carry "🎵 Sneaky Snitch/Local Forecast – Kevin MacLeod" novelty beds, credited in the caption. ~65% [INFERRED].
3. **Story dependence in an international break.** 12/12 outliers this week ride City-115, Brighton-Arsenal or a same-day moment (vidIQ, mysocial 09-28). No hit story exists Sat 26→Tue 29 for humour except Haaland/Norway 09-27. ~40% [INFERRED].
4. **The account learns nothing from the pipeline.** Metricool/Postiz post 5–7/day, no read since 09-27, no completion data, five killed-format posts (quiz "Only real United fans get this 🧠") re-queued after the veto [pm/2026-09-29 §C]. ~30%.
5. **Bio/CTA absent** [GUESS]: no evidence a single TikTok viewer is asked to follow. Winner accounts don't ask either, so weak.

## What top comparables do that we don't (vidIQ 09-29, TikTok, ≤60K followers, ≥300K views, since 09-14; all [DATA])
| account (followers) | post | views | what it is |
|---|---|---|---|
| @kaelo.04 (4.2K) | "Me after marrying her when she's in her final year so my surname is on her degree" over Ancelotti | 2.3M (1,367× median) | non-football-specific relatable line on a football-face reaction, native music |
| @relicryy (9K) | "the entirety of the UK this month" over a Resident Evil ringing-phone clip | 1.8M | UK-relatable gloom on a game clip; ambient audio |
| @croatball (48K) | score bar + Nemo seagulls with crests on the birds | 1.6M | the format our hlcard copies; clip's own audio |
| @afcleonidas (2.5K) | "Arsenal today 😂✌️" beach seagull swarm | 1.3M | text 3 words + trending track |
| @awayendlaugh (34K) | "Man City's lawyer winning 1 out of 115 charges" over Brazil's consolation goal in the 7-1 | 1.4M | raw commentary audio, zero edit |
| @swift.editz15 (756) | "Barcola's reaction to Szoboszlai's banger" clip → reaction meme | 1.2M | cut from goal to reaction meme |
| @ticketstock.uk (7.2K) | cutout of a Sky presenter on a pool background, "When your mate brings some bird back…" | 822K | **green-screen cutout, no face needed**, remix audio |
| @bhafcmagic (1.6K) | Brighton fans chant "Are you Tottenham in Disguise" | 932K | raw phone fan footage, ambient audio |
Pattern [INFERRED]: (a) 6–17 s; (b) one line of static white/black text, ≤15 words, "[Fanbase/Person] when…" or "[event]:" colon; (c) audio is the clip's own or a hit track, never a stock bed; (d) posted ≤24 h from the story; (e) follower count irrelevant (756–48K). TikTok is a lottery per post, which is why it does not compound on a "brand" the way Threads does. [INFERRED]

## STOP / KEEP / DOUBLE
- STOP: MacLeod/royalty-free beds on jokes (unless the bed IS the joke); quiz reels (already banned, re-queued anyway); any static card video; the 03:30–09:00 overnight drip (no signal it helps: 540 median 08-11 since 09-20); cross-posting the identical file + credit-line caption to TikTok and YT at the same minute (posts_log shows 8 identical TikTok/YT pairs at 22:41 AND again 22:55 on 09-28; verify that is a log duplicate, not a double publish).
- KEEP: own-graphic and meme-template videos as the safe floor (eligible, ~1K); 1 post/day minimum so the account stays alive; the "[Fanbase] when" caption shape.
- DOUBLE: story-speed (≤3 h) + clip's own audio + native app posting; the "cutout on a background" green-screen template (the only face-free skit shape in the outliers).

## Big bets (TikTok)
**BET T1: "Alex posts natively, we prepare everything" 7-day A/B (do this first).**
- WHAT: 1 video/day (the day's best story-riding gated reel) is delivered SILENT + a written sound name (mysocial 09-28 lists sounds seen on outliers: "You Are My Sunshine" sad cover, ELO "I'm Alive", Dua Lipa "Dance The Night", "O Fortuna", J. Cole "No Role Modelz"; check each is live) to Alex's TikTok inbox; he taps Add sound, publishes. In parallel the Metricool royalty-free drip is CUT to 1/day as the control.
- WHO: Claude prepares by 11:30 and 18:30; Alex 5 min per post, 1/day (09-30 → 10-06). WHEN: 12:30 or ≤3 h after a story/FT.
- WHY: sound is the single named gap vs every outlier; costs 35 Alex-minutes/week.
- EV: [GUESS] 20% chance one of 7 posts clears 100K; ~5% chance of 1M+. If the account is flagged (check Settings → Account status first), the whole test is confounded: ask Alex to screenshot it.
- KNOW: ≥2 of 7 posts >5K views AND net followers ≥ +60 over 7 days → keep at 1/day native + expand to 2. <2 of 7 >5K or net ≤ +20 → TikTok becomes mirror-only permanently (Bet T3). Decision Tue 10-06.
**BET T2: Switch @shithouseryhq from Business to Personal (Creator) account. [UNVERIFIED that it is Business: memory says so; confirm in Settings → Account → Switch account type]**
- WHY: Business accounts are limited to the Commercial Music Library, which is why "riding a sound" is structurally impossible for an API/scheduler post [memory]. Creator Rewards is N/A in Norway, so the only thing a Business account gives us is analytics/links, and Metricool has no TikTok data past 09-27 anyway. It costs nothing and is reversible.
- RISK: Metricool/Postiz connectors may drop the account (re-auth); analytics history may reset. Do it only after saving a screenshot of followers/analytics.
- WHO: Alex, 5 min, once. KNOW: the sound library shows trending audio in the in-app editor; nothing else to measure.
**BET T3 (fallback, decided by T1): mirror-only.** Every gated reel auto-mirrors at 1/day, zero PM/critic attention, no targets on the scorecard. Expected: 700–1,500 views/day, ~0 followers. Cost: near zero, since the file already exists.
**BET T4 (explore after T1): the face-free skit.** The "cutout on a background" template (@ticketstock.uk 822K on 7.2K followers; @relicryy 1.8M) with a green-screen cutout of a pundit/manager (not a footage re-upload) + a UK-relatable line. Render in hyperframes/ffmpeg, 1 per day for 5 days; sound added natively. [GUESS] hit rate 1 in 10. Comment-reply videos and Stitch/Duet: no evidence for our lane; both need Alex's phone; [GUESS] skip until T1 reads. TikTok search SEO: Metricool TKPO21 (search source) is null, so we cannot say how much of our 800 views is search. Put the club + player + event words in the on-screen text and caption's first 60 chars (cheap, [GUESS] impact).

## 14-day plan (TikTok), daily spec
| day | spec |
|---|---|
| 09-29 → 09-30 | Alex screenshot: TikTok Settings → Account status (violations, "ineligible" per video), follower count, Analytics → Traffic source for last 7 days (For You/Search/Profile split; the only way to fill the null TKPO16-21). Metricool queue for TikTok cut to 1/day (control); quiz posts deleted |
| 09-30 → 10-06 | T1 test: 1 native post/day with sound, ≤3 h from a story; log views at 24 h/72 h in posts_log `metrics` |
| 10-06 | read: decision rule above; apply Bet T2 in parallel on 09-30 if the account is Business |
| 10-07 → 10-13 | if kept: 2 native/day on matchdays (weekend of 10-10, Spurs–United 10-10 is the natural story), T4 skit 1/day; else mirror-only |
Weekend of 10-10/11: club football returns; the story pool refills. That, not any tweak, is the biggest determinant of TikTok's next week [INFERRED].

## Monetization path
- Creator Rewards: N/A (Norway; also needs Personal account, ≥1 min videos) [memory]. TikTok Shop/affiliate: none set up. Brand deals: 16K followers, ~800 views/post = nothing to sell. Ball IQ funnel: unmeasured (Clarity source query empty). Honest value today: ≈ $0 and 0 measured installs.

## Would I keep investing? **Conditionally yes, capped at ~35 Alex-min/week + zero PM attention until 10-06.** Why: it is the only platform where a 756-follower account gets 1.2M views for a joke we could make [DATA], and the 6 hits in 4 weeks prove this audience will engage. Why capped: 0 net followers for 5 days at ~5 posts/day and no instrument.

---

# 2. YOUTUBE · Football Shithousery · 30 subs

## GRADE: F (growth) / D (diagnosis quality) / B (recent cleanup of formats)
Criteria: subs +0 for 14+ days (F), seed rate (F: median 21 views baseline, typical Short 0–3 feed views [LIBRARY_youtube]), retention on the few seeded (B: 129–132% avg viewed), diagnosis and rules (B), instrumentation (B: API + Analytics work).

## What the data says (5 bullets)
1. **Zero subscribers from ~100 Shorts and 78.5K lifetime views; best days 09-20/21 = 1,195 and 1,705 views, then 37–140/day.** [DATA insights 09-29, ypp_speedrun]. Two Shorts made 2,577 of those views ("Brighton vs Arsenal highlights" 1,397, "Spurs fans after going three down" 1,180): 97% Shorts-feed, 0 subs, 2 shares. [DATA LIBRARY_youtube]
2. **Our historic conversion is ~1 sub per 10K views** ("Liverpool fans will…" 32K views → 3 subs; "Arsenal fans will…" 17K → 2 subs) [DATA ypp_speedrun, Nov 2025]. To earn the plan's +20 subs/day at that rate is **200K views/day = 2,000× today**; even at CROATBALL's rate, 40–60K/day = 400–600×. The +20/day target in PLATFORM_PLANS is not reachable by tweaks. [INFERRED arithmetic]
3. **Best-in-class football-humour Shorts channels convert only 3–4 subs/10K views.** CROATBALL (the 291K "Highlights" channel we copy): 05-01 → 09-29 +251.5K subs on +870.6M views = **2.9/10K**; September: +13K subs on +35.6M views = **3.7/10K** [DATA vidIQ channel_stats, 5 credits]. That channel's 251K-sub jump came in June–July, i.e. the World Cup (subs +5–8K/day in late June) and it has slowed to ~+500/day since. Vendor benchmarks claim 12–18/10K (0.12–0.18%) [WebSearch: fluxnote, humbleandbrag — vendor blogs, low trust]; we are 10× below the vendor number and ~3–4× below CROATBALL. Small football-meme channels in vidIQ search (lifetime, [DATA, noisy]): "Football Memes" 3,270 subs on 4.0M views = 8/10K; "Football memes" 457 on 362K = 12.6/10K; Kick Memes TV 89 on 255K = 3.5/10K.
4. **Small channels get huge Shorts hits regularly, so seed-and-hit is real.** vidIQ, Shorts ≥300K views, channel ≤30K subs, last 3 months: BLACK CARD (2.7K subs) 2.1M, @shorts_only (3.8K) 1.66M, JordaniaCountryballYT (6.7K) 2.1M, FootyCook (3.5K) 1.16M in hours (28K views/hour), L10Footy (2.4K) 982K, World Cup ball 26 (2.8K) 361K. Notice what is missing: those channels stay at 2–7K subs after 1–2M-view hits. Even a jackpot Short produces ~500–1,500 subs, not 100K. [DATA + INFERRED]
5. **The "Highlights" template is NOT a reliable engine even for us:** "Norway 1 2 Portugal | Highlights" posted at FT on 09-27 = **5 views** while Mr Cristiano's same title 36 min later got 73K (frame: card + crests-on-cartoon vs our dark frame + 30% clip) [DATA LIBRARY_youtube]. "Germany 0-1 Greece | Highlights" = 188 at ~16 h. The two seeded hits came 30 h and 41 h after the match, which contradicts "≤60 min" as our lever. [DATA] Reads still pending: BEL–FRA Highlights (09-28 23:00) Thu 10-01; Haaland Short 09-30 13:00.

## Root causes, ranked
1. **Structural: Shorts do not convert to subs at a rate that can matter for a channel of our size, and our seed rate is ~0.** Even at best-in-class 3–4/10K we'd need ≥2M views per 700 subs. ~90% [DATA].
2. **Not being served: 3 of ~35 Shorts 20–25 Sep got >250 feed views; typical 0–3.** Format soup (6 formats, 7–12/day) and non-loop retention (0.47–0.50 at end on flops) [DATA LIBRARY_youtube]. ~60%.
3. **Product/format mismatch with the seed:** the seed pool is global (NO/ZA/AU/IR), not UK fans [DATA OURS-YT1], so "[Club] fans" jokes land on people who don't care. ~50% [INFERRED].
4. **Process leaks:** pre-gate Postiz queue kept publishing killed formats (5 non-A/B YT posts queued 09-29: Goldbridge/Gerrard, Rooney 2006, quiz "How many can you get", "Being a Man United fan in 2026"; one published 11:07) [pm/2026-09-29 §5]; the same file/caption is cross-posted to TikTok with the "🎵 Kevin MacLeod…" credit as text, and YouTube's `text` in posts_log carries that credit and no keyword title [DATA posts_log; INFERRED that the YT title may equal that line: verify in Studio]. ~40%.
5. **Reused-content exposure:** Goldbridge/streamer clips and broadcast footage make YPP review fail and sit near the Jan-2026 mass-production sweep [memory reference_youtube_shorts_growth]. Not a subs driver; a channel-safety cost. Only 30 subs, low downside. ~20%.

## What comparable channels do that we don't
- CROATBALL: 14/14 uploads in 15 days are "[H] x y [A] | Highlights", one template, card + crests on cartoon vessel, ≤60 min after FT, ~0.7/day, median 183K → it earns ~4 subs/10K on 1M+ views/day [DATA LIBRARY_youtube + vidIQ]. That is a *result* of an audience of 290K that watch daily, not something a 30-sub channel can bootstrap by copying the format (a copy gets ~1–2% of the original: Mowler 31K vs 2.64M; GoalBiteX 37K vs 2.4M [DATA]).
- NAT_ (716 subs): a found clip of a boy saying the verdict ("None of them – they're all rubbish") under a score card = 2.5M; Sanex 30M game-UI absurd score [DATA].
- Face-skit and hashtag-only channels also win: the lane is wide, and the only common trait is a clip funny with zero football knowledge + 5–10 s loop. [DATA]
- None of them post at 7–12/day; medians of 23 outlier channels ≈1.4/day. [DATA]

## Can Shorts ever convert to subs for this kind of channel? (answer)
Yes but weakly, and only after volume of views that we do not have. Evidence: (i) our own 1/10K, (ii) CROATBALL 2.9–3.7/10K at 1M+ views/day, (iii) other small football-meme channels 3–13/10K lifetime. To reach 1,000 subs we need roughly 1–3M *cumulative* Shorts views. That is one jackpot Short (2M views is documented for 2.7K–7K-sub channels this quarter) or ~2–6 months at today's rate ×20. [INFERRED] Long-form converts higher per view (vendor claim: 8K long-form views → ~400 subs at 5%; treat as inflated; [WebSearch, low trust]) but we have zero long-form evidence of our own and Alex's gut on quiz formats is negative (Guess-the-XI Shorts did not survive; quiz Shorts 6–23 views).

## STOP / KEEP / DOUBLE
- STOP: any non-A/B Short (Goldbridge, quiz, "Man United 2026", Rooney 2006); volume >1/day; human/PM time on YT beyond a 2-min weekly check; the +20/day and "≥5 subs by 10-02" targets (unreachable); posting the video's music credit as the YT title/description line 1.
- KEEP: hlcard Format A only for the top fixture on matchdays (already built; frame rules from LIBRARY_youtube craft #1–4); the club-series cadence only as an automated mirror (no manual pinned comments).
- DOUBLE: nothing on Shorts. If anything gets attention it is the long-form test below.

## Big bets (YouTube)
**BET Y1: PARK as mirror-only for 14 days (recommended default).** WHAT: 1 Short/day, auto-mirrored from the day's best gated reel (already made for IG/FB/TikTok), YouTube title = "[Club] fans …" or "[H] x y [A] | Highlights" only, description line 1 = searchable result. WHO: Metricool automation; Claude checks once on Mon 10-06 via `node social/insights.mjs` (subscribersGained, feed views). WHY: marginal cost ≈ 0 (same file), and it keeps the jackpot lottery ticket alive: [GUESS] 1–2% per Short of a >100K hit; at 14 posts that is ~15–25% chance of one. EV [GUESS]: 0–3 subs in 14 days, tail chance of ~500–1,500 subs if a 1M+ Short lands. KILL: if 10-20 posts total < 300 views median AND 0 subs on 10-13 → leave it fully dormant (stop scheduling), keep the channel.
**BET Y2: ONE long-form pilot, "The REAL Gameweek [n] Highlights" (Format C in the 09-27 plan), 6–8 min, weekly, the first on Sun 10-11 after club football returns.** WHAT: original sketch/satire assembled from vessel clips + our jokes + voice/captions, ends with a subscribe line tied to next week's. WHO: Claude renders (hyperframes), Alex 10-min review, Sun evening. WHEN: 4 episodes 10-11 → 11-01. WHY: it is the only YouTube format where a viewer self-selects and the video can be found by search ("gameweek 8 highlights"), it feeds watch-hours (YPP needs 4,000 h; 4 episodes cannot reach it, so this is a subs/search test, not YPP), and Dove&Dan (+51%/30d, weekly "The REAL highlights" sketches) is the comparable [memory 09-27]. EV [GUESS]: 300–2,000 views/episode, 10–60 subs/episode at a long-form rate of 2–3%. Cost: 3–4 h/week of Claude time + 10 min Alex. KILL: after 4 episodes if median <1,000 views and <25 subs total → drop; if ≥50 subs total → 2 episodes/week + Shorts cut from them (Shorts linking to the episode).
**BET Y3 (not recommended, listed for completeness): full 3/day Shorts spam of Format A.** [GUESS] EV: 0 subs; risk: templated-content flag (the exact pattern Jan-2026 sweep targeted) [memory].

## 14-day plan (YouTube), daily spec
| when | spec |
|---|---|
| 09-29 | PM item already agreed: delete the 5 non-A/B queued Shorts; verify in Studio the YT titles (not "meme line + 🎵 credit") |
| 09-30 → 10-13 | 1 Short/day at 18:00 Oslo: matchday = Format A hlcard (top fixture only), otherwise Format B. No pinned-comment routine, no playlists. Weekly Monday read of insights.mjs YouTube section |
| 10-01 | read BEL–FRA Highlights (≥300 views @48h or the Highlights format is dead on this channel; you already set this rule); read Haaland Short 09-30 13:00 (≥500) |
| 10-06 | first 7-day read: feed views per Short, avg % viewed ≥110%, subs |
| 10-11 (Sun) | Bet Y2 pilot episode 1; publish and share once on IG story/X/Threads to seed watch-time (a 30-sub channel has no other audience) |
| 10-13 | Y1 kill/keep decision |

## Monetization path
- YPP: 1,000 subs + 4,000 h or 10M Shorts views/90d; from 2027-02-01 8,000 h or 20M [memory ypp_speedrun, verified 09-23]. Fan-funding tier 500 subs + 3M qualified Shorts views/90d or 3,000 long-form h: pays no ad revenue. Not reachable in 2026 (need ~1,000× today's Shorts views or 10K long-form views/day). Estimated YT revenue before 2027-01-01: **$0.** Search discovery for Ball IQ ("football quiz" long-form) is a product question, not a SHQ-channel question; Guess-the-XI Shorts 6–23 views suggest not now.

## Would I keep investing? **No (attention), yes (as a zero-marginal-cost mirror + one long-form pilot).** Why no: even best-in-class comparables convert 3–4 subs/10K and we get ~0 seed; the +20/day target is 100–2,000× the data. Why the mirror: files already exist; the tail chance is real (2M-view Shorts on 2.7K-sub channels this quarter).

---

# 3. Honest ROI: is time here better spent elsewhere? (answer: yes, for both, right now)
| platform | followers | net/day | follows per 10K views | share of 137.9K | share of 9.2K/day needed line |
|---|---|---|---|---|---|
| TikTok | 16.2K | −1 | ≈0 (−2.4, lagged) | 11.7% | 0% |
| YouTube | 30 | 0 | ≈0 (historic 1.1) | 0.02% | 0% |
| Threads (comparison) | 41.9K | +50–90 | ≈3.8 | | |
| FB (comparison) | 568 | +19–38 | 7.3 | | |
[DATA pm/2026-09-29, insights] The two platforms consume 2 of ~7 "surgery" sections in every PM report, two queues, critic passes, and Metricool/Postiz calls while producing ~0 net followers. Recommended reallocation: **redirect Claude/PM attention from TikTok/YT to Threads image-led fanbase/receipt singles (the only engine with 50K+ posts), the FB Page (7.3 follows/10K), and the IG carousel-within-25-min play**, keeping TikTok at ~35 Alex-min/week and YT at zero attention. The TikTok 7-day A/B and the YT 14-day mirror give a written answer by 10-06/10-13 for ≈1.5 hours of total effort.
Where this is wrong: TikTok is high-variance; a single 1M-view video for 756-follower accounts is common. If Bet T1 hits, revise upward. It is also the platform with the most UK-young-male reach for a future Ball IQ install push, unmeasured.

---

# 4. Process and instrumentation fixes (small, cross-cutting)
1. Metricool has no TikTok data after 09-27 and null reach/completion/traffic fields: one Alex screenshot pack (Account status, Analytics → Overview 7 d, Traffic source, Follower activity) fills it. Ask once, weekly.
2. YouTube Studio "Viewed vs swiped away" per Short is still a TODO from 09-28 (API doesn't expose it). Needs one manual Studio look; do not spend more time until Y1 is running.
3. The Postiz pre-gate queue still publishes killed formats on YT/TikTok (Goldbridge/quiz). Fix once: delete the queue, route everything through Metricool + review.mjs.
4. posts_log has no `metrics` for any TikTok/YT row (all null): write views@24h/72h for the 7 T1 posts and the 14 Y1 posts, otherwise this audit repeats in a month.
5. Check YT title vs description: `text` in posts_log for YT rows contains the MacLeod credit; a title like "Wrong lever 😭 🎵 Sneaky Snitch – Kevin MacLeod" wastes the one search surface.

---

# 5. Ten-line summary
1. TikTok D, YouTube F: TikTok flat at ~16.2K (−6 in 5 days); YT 30 subs, 0 in 14 days.
2. TikTok's tail vanished on 09-20: 6 of 48 posts >7K before (all raw creator-clip reposts, 80% of all views), 0 >10K in 43 since; clean-original posts cap at ~1K.
3. Those raw clips are now flagged "unoriginal" by TikTok, so the old engine is blocked and the new formats cap at ~800; posting time and volume show no effect.
4. Winners on TikTok this week (756–48K followers, 0.8–2.3M views) all use the clip's own audio or a hit sound; ours use royalty-free beds on a Business account that cannot pick sounds.
5. Shorts convert ~1 sub/10K for us and only 3–4/10K for CROATBALL (the 291K "Highlights" channel), so +20 subs/day needs 50–200K views/day (we do ~100): the plan target is unreachable.
6. Jackpot Shorts do happen for 2–7K-sub channels (1–2M views) but still yield only ~500–1,500 subs.
7. Big bets: TikTok = 7-day native-with-sound A/B (Alex 5 min/day), switch Business → Personal, fallback mirror-only; YouTube = park as 1/day auto-mirror + one weekly long-form pilot from 10-11, kill rules dated 10-06/10-13.
8. STOP: overnight drips, MacLeod beds on jokes, quiz reels, non-A/B YT Shorts, cross-posting the credit line as the YT title, targets +200/day (TT) and +20/day (YT).
9. Money: $0 from either before 2027; Creator Rewards N/A (Norway), YPP unreachable, no measured Ball IQ traffic.
10. Verdict: shift PM/Claude attention to Threads, FB and IG-carousel-at-FT; TikTok capped at ~35 Alex-min/week, YouTube at zero attention until 10-06/10-13 reads.
