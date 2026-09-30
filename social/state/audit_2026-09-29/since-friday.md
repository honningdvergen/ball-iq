# SINCE FRIDAY — cross-cutting diagnosis (lead diagnostician), 2026-09-29 13:00–14:30 Oslo

Read-only. Nothing posted, scheduled, deleted or edited; no Chrome. Writes: this file only. Tags: **[DATA]** = number with its source · **[INFERRED]** = my reading of the data · **[GUESS]** = no instrument. Times Oslo unless marked UTC. "Friday" = 2026-09-25.

Sources pulled today: Metricool evolution series 09-12→09-29 (THEV/IGEV/TKEV/FBEV/BKEV, brand 7074932, 13:05) · Instagram Graph `reach,views` with `breakdown=follow_type` per day 09-12→09-28 (Page token, 13:20; this breakdown had never been pulled before) · `insights.mjs --hours 72` (13:10, exit 0) · `insights/*.md` 09-23→09-29 · `posts_log.jsonl` (156 rows) · `review/verdicts.jsonl` (111) · `postiz_calls.log` · git log for `social/` + `.claude/agents` · scoreboard, PM 09-27/28/29, floor 09-29, sweeps 09-25→09-29, RULES_REVIEW_2026-09-29, backtest RESULT, PLATFORM_PLANS, TEAM, memory playbooks. **Not available:** vidIQ (4 credits left, a 5-credit call refused, resets 10-15), Socialinsider (no project), Mysocial (Free tier), any X per-post or follower API, TikTok per-post follows. Previous international break: **no instrument** (our data starts 09-12; the last break was before the takeover and nobody logged it).

---

## 0. The verdict in ten lines

1. **"Incredibly bad since Friday" is true for Instagram, TikTok and X, false for Threads and Facebook, and unchanged for YouTube/Bluesky (they were dead before Friday).** [DATA] IG non-follower reach/day: 110.5K (09-24) → 52.9K (Fri) → 16.2K (Sat) → 23.0K (Sun) while follower reach stayed 5–8K every day. TikTok views/day: 10,759 (Fri) → 3,851 → 877 → 267 → 0. X: every post since the 684 (1.36M) sits at 479–1,744 views. Threads: +150/+213/+44/+102 followers Fri→Mon with 467K (Dembélé, Sun) and 142K (Cissé, Mon) hits. FB: +29/+38/+29 follows/day Sat→Mon, its best run since 09-19.
2. **It is not "just the international break."** [DATA] Break days 1–2 (Tue/Wed 09-22/23, no PL, no big story) did 79K non-follower IG reach and 37/38 IG follows each; break days 5–6 (Sat/Sun 09-26/27) did 16K/23K and 25/22. Same calendar condition, 3–5× worse. The break explains roughly the first −40% (PL week ≈129K/day → 79K), not the Friday cliff.
3. **Comparable banter accounts kept their reach during the same break.** [DATA insights 09-29 Business Discovery, 72h window] @thatguysjokes best reel 1.14M views/87K likes, @midnitefootball 1.06M views/48K likes, @rivalsbanter 47K likes, @ftblmemeshub 38.8K likes, @itsfootybants 23.8K likes. The audience did not go on holiday.
4. **The best-explained cause on IG is a loss of non-follower distribution that starts exactly after the 20-post City day (Fri) and coincides with three weeks of majority-repost output** (screenshot carousels, re-captioned clips, 17 of 22 reels hidden from feed). Whether IG has formally flagged the account is **one 2-minute check by Alex away** (§4 H3, action 1). Nobody has looked at Account Status since 09-22.
5. **Our own changes did real damage on top:** overnight reel drips (median ~800 vs 1.2–2.2K daytime), one template on every reel across 4 platforms ("… 😭" on 44% of all logged rows, 79% of TikTok captions since 09-20), a re-queued flopped premise (Salah/KDB 3.4K → "Chelsea sold De Bruyne, Salah and Lukaku" today), live text blocks (2 hits in ~27), a gate that blocked 9 of our 12 known hits in a blind backtest, and the bar changed twice in 24h.
6. **Attention split is measurable and it starved the platform that works.** [DATA] 54 of 105 critic verdicts on 09-28 were Snapchat; posts_log 09-29 = 87 rows from 15 unique assets (72 are mirrors); Threads (our only reliable hit engine) had **0 posts from 23:54 Sun to 13:30 Tue**; X had 0 from 23:00 Mon to 13:30 Tue; 0 replies logged today. The Editor session was idle 06:10→11:40 while three watchers wrote ~50 KB of reports about it.
7. **Structure: views convert at 1/10K on Threads, ~3/10K on IG (stable across periods), 4–7/10K on FB, ≲1/10K on X, ~0 elsewhere.** On IG the conversion RATE did not fall since Friday; the VIEWS did. The "reason to follow" lever matters most on Threads/X; on IG the lever is getting recommended again.
8. **Ranking by explanatory power for the Friday drop:** H3-IG (distribution demotion, content-class) ≈ H2 (our changes) > H4 (spread) > H1 (break) > H5 (structural, true but it did not change on Friday). For "why we are not growing at all", H5 and H4 lead.
9. **1M by 2027-01-01 is not reachable by any operating change** (needs ~9,200/day; real 5-day mean is ~+150/day; the best week ever was ~+500/day). Honest reachable range with the model below and the PL back on 10-10: **+400–800/day by late October → ~175–215K on 01-01.** Say it out loud and plan against it.
10. **Do in the next 72 h (full list §8):** Alex checks IG Account Status + the follower/non-follower split on the 09-28 City carousel; Threads back to 5–8 image-led originals a day through a fast lane; kill the overnight drip and the mirror sprawl; one hero story a day → 3 derivatives; critic becomes an advisor on X/Threads; add the non-follower reach column to the morning read (the curl already works).

---

## 1. Day-by-day reconstruction 09-12 → 09-29

### 1.1 The numbers (Metricool evolution + Graph breakdown; Meta daily rows can lag or shift by a day, so read trends, not single cells)

| date | day / calendar | Threads posts · views · Δfollowers | IG posts · views · **non-follower reach** · gained/lost | TikTok videos · views · Δ | FB posts · media views · follows acquired | YT views | Bluesky |
|---|---|---|---|---|---|---|---|
| 09-12 | Sat, PL | 19 · 294K · — | 13 · 227K · **129K** · 59/28 | — | 14 · 15.1K · 1 | — | — |
| 09-13 | Sun, PL | 29 · 463K · — | 17 · 247K · **253K** · 53/30 | 1 · 843 | 18 · 34.7K · — | — | — |
| 09-14 | Mon | 11 · 136K · — | 6 · 413K · **175K** · 127/27 | — | 7 · 13.4K · — | — | — |
| 09-15 | Tue | 15 · 30K · — | 7 · 281K · **81K** · 120/30 | — | 9 · 13.5K · — | 3 | — |
| 09-16 | Wed | 28 · 129K · — | 13 · 146K · **76K** · 59/39 | — | 21 · 124.7K · 66 | 5 | — |
| 09-17 | Thu (no football) | 8 · 13.5K · — | 4 · 141K · **82K** · 56/25 | 1 · 2,067 | 9 · 32.1K · 33 | 10 | — |
| 09-18 | Fri (no football) | 6 · 2.6K · — | 7 · 195K · **118K** · 63/23 | — | 7 · 35.7K · 17 | 2 | — |
| 09-19 | Sat, PL | 27 · 183K · — | 17 · 245K · **119K** · 89/21 | 4 · 17.4K | 23 · 101.3K · 36 | 2 | — |
| 09-20 | Sun, PL · Claude takes FB/YT, Postiz volume starts | 15 · 28.6K · — | 10 · 177K · **84K** · 38/28 | 7 · 7,080 | 19 · 57.3K · 11 | 1,195 | — |
| 09-21 | Mon, PL (Brighton–Arsenal) · 33-wins 3.29M | 15 · 4.51M · — | 10 · 110K · **51K** · 50/21 | 6 · 4,658 | 15 · 24.6K · 6 | 1,705 | — |
| 09-22 | Tue · BREAK day 1 · queue reset 21:30 | 16 · 19.7K · — | 9 · 78K · **79K** · 37/23 | 5 · 5,185 | 20 · 10.9K · 3 | 37 | — |
| 09-23 | Wed · gate.mjs, insights.mjs, sweep task | 9 · 75.8K · — | 10 · 140K · **79K** · 38/26 | 7 · 5,599 | 6 · 20.2K · 6 | 53 | 1,330 |
| 09-24 | Thu · Sky/Saka 2.7M · X+Bluesky into Postiz · IG reel test d1 | 19 · 2.72M · +35 | 12 · 165K · **110K** · 26/24 | 6 · 3,388 · −2 | 5 · 14.1K · 5 | 124 | 1,327 |
| **09-25** | **Fri · CITY VERDICT · 684 on X 1.36M** | 24 · 1.83M · +150 | **20** · 244K · **53K** · 39/20 | 3 · 10,759 · 0 | 11 · 22.5K · 4 | 140 | 1,330 |
| 09-26 | Sat · ENG–ESP · fullcap/carousel reels shipped | 19 · 58.6K · +213 | 7 · 117K · **16K** · 25/25 | 5 · 3,851 · −3 | 10 · 65.7K · 29 | 139 | 1,332 |
| 09-27 | Sun · NOR–POR · 1M goal set · Dembélé 467K | 23 · 554K · +44 | 6 · 50K · **23K** · 22/21 | 3 · 877 · −1 | 9 · 51.7K · 38 | — | 1,329 |
| 09-28 | Mon · BEL–FRA · gate ≥8, critic, TEAM, 3 new platforms, Metricool reels · Cissé 142K | 11 · 167K · +102 | 7 · 70K · (5K, partial) · (blank, lag) | 1 · 267 | 6 · (8.8K partial; insights: 51.8K) · 29 | — | 1,327 |
| 09-29 | Tue · critic recalibrated, Daily Number #1 13:30 | 1 by 13:30 | 6 (overnight drip 221–989 views) | 0 · 0 | — | — | 1,327 |

[DATA] Metricool THEV02/06/03, IGEV37/05/43/44, TKEV01/02/08, FBEV33/49/47, BKEV01; Graph `follow_type` breakdown for the bold IG column; insights.mjs for FB 09-27/28. Threads Δfollowers before 09-24 is not in Metricool; followers.csv starts 09-23. X has no column: the profile rounds to 45.2K/45.3K.

### 1.2 What changed in the operation, in order (git + files)

| when | change | evidence |
|---|---|---|
| 09-20 | Claude takes FB + YT; Postiz queue replaces Alex's phone; 46 and 41 posts/day 09-21/22 | project_social_rootcause_2026_09_22 |
| 09-22 21:30 | Reset: stale carousels/projections deleted, "way better" bar | same |
| 09-23 | gate.mjs, insights.mjs, state in repo, sweep task 08:30/18:30; **80 Postiz create-calls** | git 9181e546; postiz_calls.log |
| 09-24 | Postiz → 10 channels: X + Bluesky added; Metricool connected; IG reel test starts; 61 calls | git ec4f4636/48b39c5b |
| **09-25 Fri** | City verdict; **20 IG posts in one day** (5 carousels, 3 reels, images); gate blocks same caption; 55 calls | IGEV37; git 723579d7 |
| 09-26 Sat | fullcap.mjs full-frame reels; carousel reels (carouselreel.mjs); 56 calls | git c3fb6345/5bfdfc0d |
| 09-27 Sun | 1M goal; live-match protocol (8-post Threads block on NOR–POR); prediction Short (deleted, 0 likes); scoreboard; 43 calls | project_goal_1m_followers; sweeps |
| **09-28 Mon** | 11:53 PLATFORM_PLANS v1 · 11:57 breaking watcher · **12:31 quality gate ≥8 + banger-critic** · 13:04 banger library · 16:34 shq-draft skill · 16:46 posts_log · 17:08 SOTW series · 18:05 Telegram · 18:16 WhatsApp/Telegram/Snapchat plans · 20:12 Snapchat sprint (OneUp) · 20:25 hourly Threads test · TEAM.md 8 roles · Metricool reels start (13 posts) · 28 calls · **105 critic verdicts, 54 on Snapchat** | git log 09-28; verdicts.jsonl |
| 09-29 00:30–01:20 | RULES_REVIEW; blind backtest → critic rewritten (uncommitted: PASS ≥7, X/Threads ACTION + P(50K+) ≥10%); Daily Number series; floor-manager hourly task | RULES_REVIEW; backtest RESULT; scheduled tasks |
| 09-29 06:10→11:40 | Editor idle; 87 posts_log rows from 15 assets (6 reels × IG/FB/TikTok/YT + Telegram + Snapchat); Threads/X silent; 0 replies | floor_2026-09-29; posts_log |

[INFERRED] Between Friday and Monday the operation changed platform count (+3), schedulers (+Metricool reels, +OneUp), the gate (new), the critic (new, then rewritten), the team model (8 roles), and started at least 9 experiments at once (IG 72h surgery, Threads hourly, Daily Number, SOTW, FB single images, FB ad, YT club series, Snapchat sprint, Bluesky replies-only). No single change can be read. That is itself a finding (§9).

### 1.3 "Since Friday" per platform, one line each

- **Instagram** [DATA]: posts published/day 12, **20**, 7, 6, 7 (09-24→28); views of those posts 188K, 196K, **31K, 14K, 42K**; views per post 15.6K, 9.8K, 4.4K, 2.3K, 5.9K. Non-follower reach 110K, 53K, **16K, 23K**. Follower reach 8.0K, 6.5K, 5.3K, 6.7K (flat). Follows gained 26, 39, 25, 22. Unfollows 20–25 (flat). Post-match carousels: Xavi–Klopp 83.5K (09-24, +18 min) → England–Spain 10.4K (09-26, +23 min) → Gyökeres 5.4K (09-28, +60 min).
- **TikTok** [DATA]: videos 6, 3, 5, 3, 1, 0; views/day 3.4K, 10.8K, 3.9K, 877, 267, 0; followers 16,211 → 16,207. Nothing since 09-20 above 5.4K; 27 of 43 under 1K (RULES_REVIEW).
- **X** [DATA library + PM]: 684 post 1.36M (Fri 16:32, +51 min after Ornstein). Every post since: 479–1,744 views (Ben Davies 1,258; bench photo 1,744; four maths posts Mon 972–1.3K; Mancini quote 1.3K). 7-day Postiz analytics: 1,995,054 impressions, 1.3M of it the one post. Followers 45.2K → 45.3K (rounded). Replies made: 2 (Sun), 11 (Mon), 0 (Tue so far).
- **Threads** [DATA]: views 1.83M (Fri), 59K (Sat, no hit), 554K (Sun), 167K (Mon); followers +150, +213, +44, +102. Hits: Dembélé/Jude 467K, Cissé 142K, Oliver 73K, Croatia/Nike 57K. Median post ~1.2K (unchanged since 09-23). Sat was the only bad Threads day: 19 posts, best 20.6K.
- **Facebook** [DATA]: follows acquired 4 (Fri), 29, 38, 29; media views 22.5K, 65.7K, 51.7K, 51.8K. Improving since Friday, before the ad (ad from 09-28). Per 10K views: 4.4 (Sun), 7.3 (Mon).
- **YouTube** [DATA]: 30 subs, 0 gained since at least 09-17; views 140, 139 (Fri/Sat) then the lag. The only seeded Shorts were 09-20/21 (1,180 / 1,397).
- **Bluesky** [DATA]: 1,330 → 1,327 in 6 days; 16 posts → 8 likes (Sun); 0 replies before 09-28.
- **Telegram / WhatsApp / Snapchat** [DATA 09-28 21:30]: 2 / 0 / 0. No read since (no instrument).

---

## 2. What "bad since Friday" is made of (decomposition)

[INFERRED from §1] Three different things happened and are being read as one:

1. **A comedown from a once-a-month peak.** Friday held the two biggest posts of the fortnight (684 on X 1.36M; Threads 1.83M day) on the biggest story of the season. The next four days were always going to look like a cliff against that. But that is only X and Threads views; it is NOT the IG/TikTok story.
2. **A genuine loss of distribution on the two reel/repost platforms (IG, TikTok)**, measurable as non-follower reach falling 5–7× with follower reach flat. This is not a comedown; 09-22/23 (equally quiet days) were 3–5× better.
3. **A self-inflicted output collapse on the two platforms that still work (Threads, X)** on Monday afternoon → Tuesday: gate + team + mirrors + three new channels absorbed the Editor; Threads went from 19–24 posts/day to 11 (Mon) to 1 (Tue by 13:30).

So the honest sentence is: *IG and TikTok lost reach on Friday–Saturday; X and Threads did not lose anything except the peak and then, from Monday, the posting; FB got better; the rest were dead already.*

---

## 3. The zero-like posts vs the hits (the suppression test, H3 on Threads)

Same account, same 30 hours, same platform [DATA insights 09-29, Threads table, UTC]:

| when (UTC) | post | views | likes |
|---|---|---|---|
| 09-27 11:34 | "Dortmund sold Ousmane Dembélé for €140m. Dortmund sold Jude…" (image receipt) | **467,402** | 1,605 (294 replies) |
| 09-27 12:09 | "Michale Oliver needs investigating now it's official City cheated" (quoted fan take) | 73,192 | 1,413 |
| 09-27 18:28 | "Ben Davies scored in Denmark tonight. For Denmark. Spurs fans…" (text) | 1,343 | 1 |
| 09-27 19:26 | "Norway fans 1-0 down to Portugal: 'If Odin had wanted us to…'" (text) | 967 | 0 |
| 09-27 20:15 | "Norway's keeper after gifting Portugal two goals: 'If Odin h…'" (text) | 1,363 | 0 |
| 09-27 20:46 | "Germany lost 1-0 at home to Greece and somewhere Otto Rehhag…" (text) | 1,415 | 0 |
| 09-27 21:02 | "Norway's keeper tonight. Rate him out of 10 👇" (text) | 409 | 0 |
| 09-28 07:52 | "Djibril Cissé played for QPR that day and still celebrated…" (image) | **142,183** | 1,281 |
| 09-28 12:37 | "Croatia in the three stripes. Nike really let Modrić walk" (image) | 56,713 | 1,048 |
| 09-28 18:18 | "Our new Snapchat has 0 followers. Same as Tottenham's league…" (text, self-promo) | 368 | 0 |
| 09-28 21:55 | "Belgium playing France since 2015 😭 🎵 Heartbreaking – Kevin MacLeod…" (video cross-post with a music credit line) | 343 | 0 |

Reading [INFERRED]: the 0-like posts got 1.0–1.4K views, which is the account's follower-feed baseline (≈3% of 41.9K), i.e. Threads showed them to followers and nobody reacted, so nothing went to non-followers. A throttled 40K account would show a falling baseline and no hits; instead the baseline is flat since 09-23 (median ~1.2K over 400 posts) and hits happened on three consecutive days. **Threads is not suppressing the account. The 0-like posts are the content:** text-only (all four text-only posts in the backtest were flops), a mid-interest fixture for a UK audience, a Norway-insider running joke, the "X fans at HT / X fans at FT" template, self-promo, and a video cross-post carrying a CC credit line. What separates the winners: an image that carries it, a big fanbase argued about (Dortmund/Barça/Real, City/Oliver, Modrić/Nike), daytime 09:30–15:40, one clause, and a claim people dispute (294 replies). PLATFORM_PLANS' Threads rule already says this; the live-match block ignored it 8 times on Sunday.

**Delete rule note:** deleting 0-like posts does not change the median (RULES_REVIEW §2.3); the cost of a Threads flop is ~0. The cost of a text block is the Editor's evening.

---

## 4. Hypotheses, with the evidence for and against

Explanatory power = how much of the Friday→Tuesday deterioration each one accounts for, judged on the numbers above.

### H1 — The international break lowered reach. **Partly true, ~25% of the story.**
For: [DATA] IG non-follower reach in the PL week (09-12→19) averaged ~129K/day; the first two break days (09-22/23) ~79K: a −40% step that lines up with the break. YT's only seeded Shorts were PL-weekend match memes (09-20/21). Live Threads blocks on NOR–POR died where England–Spain (09-26 carousel 10.4K) at least breathed. Hater Central's engine is PL matchday volume (x_hatercentral research).
Against: [DATA] break days 5–6 were 3–5× worse than break days 1–2 on IG with the same calendar; comparable accounts posted 1M+-view reels and 24–87K-like posts in the same 72h (insights 09-29 reference table); our own biggest posts of the month had no news peg and no fixture (33-wins on a break Monday 3.29M; Sky/Saka on a Wednesday 2.7M; Dembélé on a break Sunday 467K). FB improved during the break. Previous-break comparison: **no instrument.**
Verdict: the break removed the PL-moment supply and cost ~40% of IG discovery, which we survived on 09-22→25. It does not explain Friday's cliff, TikTok's fall to 267 views, or Tuesday's silence.

### H2 — Our own changes hurt (volume, sameness, quality, gate flipping). **True, ~30%.**
For: [DATA] (a) **Sameness:** 68 of 156 posts_log rows end/contain "😭" (44%); 79% of TikTok captions since 09-20 vs ~8% before (RULES_REVIEW hand count); today's six reels carry the identical caption on IG, FB, TikTok and YT each, and the four worst IG carousels of 09-26/27 all end "Which slide got you?" (mysocial re-run); the 09-22 audit's STOP list ("same caption on five platforms", "flat X fans when Y") is back in force by 09-29. (b) **Repeats:** "Chelsea sold Mo Salah for €15m and KDB for £18m" 3,411 views / 13 likes on Mon → re-queued today at 12:30 as "Chelsea sold De Bruyne, Salah and Lukaku…" on X/Threads/Bluesky; Rehhagel joke flopped twice, was still scheduled a third time (PM cancelled it); "here we go" Romano joke posted 2 days late after Alex called it late. (c) **Timing:** six reels dripped 03:30–11:05 Tue (831/304/815/566/988/221 views) vs 1.2–2.2K for day/evening reels; the 09-28 FT carousel at +60 min (5.4K) vs +18/+23 min on 09-24 (61.7K/31.6K); Zidane sprint missed by 25 min; Pochettino story reached the critic 3h10m after the source and was dropped. (d) **Gate flipping:** gate ≥8 installed 09-28 12:31; blind backtest 09-29 passed 3/12 known hits, blocked the 3.29M, 1.43M and 840K posts; rubric rewritten 09-29 (uncommitted), so two bars are in force in two files; first-pass PASS rate 36%, 26 of 27 PASSes exactly "8", 11 of 27 self-approved fixes; verdict latency put the Zidane reel at 00:08 for a 21:00 moment. (e) **Volume where it does not pay:** 20 IG posts on Friday (the day before the cliff); 15 Threads posts in 4 hours on Sunday night; 43 TikTok posts since 09-20 with 0 above 10K (4 above 10K in the 13 days before).
Against: [DATA] Postiz create-calls fell 80→28/day from 09-23 to 09-28, so gross volume was already dropping before the gate; Threads posts/day vs views correlate at 0.10; the critic did stop real filler (Goldbridge/Gerrard 4/10, legends pint 3/10). The gate is 30 hours old and has no outcome data, so "the gate killed reach" is **not** provable; "the gate consumed the Editor and blocked hit-shaped drafts" is.
Verdict: sameness + overnight drip + latency + repeats are the demonstrable damage; the gate's damage is capacity and false FAILs, not reach.

### H3 — Algorithm/originality throttling on Threads/IG. **False on Threads; the leading single explanation on IG (~30%); confirmed on TikTok.**
Threads: rejected in §3 (baseline flat, hits daily, 0-like posts are content).
Instagram: For [DATA]: non-follower reach 110K → 53K → 16K → 23K with follower reach flat (a demotion signature, not an audience signature); reels: 17 of 22 since 09-20 published with `is_shared_to_feed=false` (Reels tab only; median 1.2K vs 2.9K for those shared to feed, RULES_REVIEW); City carousels 09-26 had a 7.1% share rate on 1,558 reach ("landed with those who saw it, IG did not push it"); output 09-20→28 was majority screenshots of other people's tweets + re-captioned creator clips, which is exactly what IG's 2026-04-30 aggregator rule (rolling 30-day majority) removes from recommendations; the account was recommendable on 09-22 and nobody has checked since. Against: 09-25 non-follower reach (53K) was already half of 09-24 on the biggest story day, and per-post views on the 09-28 City carousel (19.8K) show recommendations are not zero; the England–Spain post-match carousel (10.4K) may simply be a weaker fixture than Xavi–Klopp for the meme audience; the reels flag is a hard defect regardless of any flag. **Not proven; testable in 2 minutes** (§8 action 1: IG app → Professional dashboard → Account status → "Recommended content"; and Insights on the 09-28 City carousel → Accounts reached → followers vs non-followers %; on the 09-24 Xavi–Klopp carousel the same split for comparison).
TikTok: confirmed by TikTok itself 09-23 ("Unoriginal, low-quality, QR code content" on re-uploads); since 09-20 the account has been fed 43 templated re-captions; views/day fell to 267; a 16K account getting 267 views/day is a For-You exclusion, not a lull. [DATA feedback_tiktok_ineligible_reposts; TKEV02]
Verdict: on IG this is the hypothesis that fits the follower/non-follower split best, and it is cheap to confirm or kill today.

### H4 — Ten platforms, one operator: the ones that matter starve. **True, ~15% of Friday, but the #1 cause of Tuesday.**
For [DATA]: verdicts 09-28: 54 Snapchat / 14 X / 3 Threads; TEAM.md lists 8 roles, the floor manager found "the whole day so far is one 06:10 batch"; posts_log 09-29: 87 rows, 15 unique assets, 13 Telegram + 8 Snapchat + 2 WhatsApp mirrors, 5 X, 5 Threads, 5 Bluesky; Threads 0 posts 23:54→13:30; X 0 posts 23:00→13:30; replies 0 (plan 25 + 15); the Threads hourly test (Alex's own idea, 14 slots) lost 3 slots before anyone noticed; Snapchat sprint asked for 5–8 Spotlights/day + back-catalogue re-edits (8 of 8 failed the critic) + a paid Promote test for a 0-follower profile; OneUp trial ends ~10-05 and needs Chrome minutes per post; the PM + floor manager wrote 36 KB + 8 KB of reports on 09-29 and the run sheet they graded against did not exist at 08:32 (sweep found no pm file). Three schedulers (Postiz 25 calls/h shared and 429-ing, Metricool free plan 20 posts/month per HANDOFF vs 13 used on 09-28 alone [unverified], OneUp manual) and four routing rules that contradict each other (FB: "Postiz dead" 09-23 → "3 of 4 hits via scheduler" 09-29).
Against: none of the new channels cost reach on IG/TikTok directly; they cost the Editor's afternoon and the critic's budget.
Verdict: spread did not cause Friday; it caused Monday-night-to-Tuesday, and it will cause every quiet day until it is capped.

### H5 — The strategy is structurally wrong: views ≠ follows, no reason to follow. **True, but it did not change on Friday (~0% of the delta, ~50% of "why not 1M").**
For [DATA]: follows per 10K views, 5-day: Threads 1.0 (5.33M views → +544), IG ~2.5–3.3 (stable across 09-12→19, 09-20→25, 09-26→27: 3.3 / 2.5 / 2.8), FB 4–7, X ≲1 (1.36M-view post moved a rounded 45.2K→45.3K), TikTok 0 (16,213→16,207), YT 0 (0 subs from 40+ Shorts). The only recurring forms that converted: own fake-official slide first (4.9/10K), the numbered "Day five" carousel, FB escape reels. The plan's "1–5K follows per hit" was false on our own data (RULES_REVIEW §1). 9,200/day at these rates needs 25–90M views/day; we make 0.2–3M on a good day.
Against: on IG the conversion rate held; the IG problem since Friday is reach. FB converts and grows without any series. So H5 is the ceiling, not the cliff.
Verdict: fix H3/H2/H4 to get back to ~+300–500/day; fix H5 (a reason to follow + hit-conversion routine) to get above it. Nothing gets to 9,200/day.

### Ranking (Friday→Tuesday deterioration)
1. **H3-IG + TikTok originality/distribution** (~30%) — confirmable today.
2. **H2 our changes** (~30%) — drip, sameness, repeats, latency, gate capacity.
3. **H1 break** (~25%) — the first step down, already absorbed by 09-23.
4. **H4 spread** (~15% of the delta; 100% of Tuesday's silence).
5. **H5 structure** — the ceiling; unchanged.
[INFERRED shares; the confounds are real: the City day, the break, the gate, the platforms and the team all landed inside 96 hours.]

---

## 5. Compact platform grades (cross-cutting view; the per-platform auditors go deeper)

| platform | grade | criterion | since Friday | keep investing? |
|---|---|---|---|---|
| Threads | **B** | hits 3 of 4 days, +509 followers Fri→Mon, 1.0/10K | fine until Monday, silent Tuesday | **yes, first** |
| Facebook | **B−** | +29–38/day organic before the ad, 4–7/10K, only paying platform | improving | yes, as the converter (IG-app shares + 2 Goldbridge/day) |
| X | **C** | 1,000× hits exist (684), median ~1K, no instrument, 0–11 replies/day | comedown + silence | yes, moment lane + replies + OCR payout 10-09 |
| Instagram | **D** | non-follower reach −85% in 3 days, follows 39→22, 17/22 reels feed-hidden | the real damage | yes, but as a repair project (§7) |
| TikTok | **F** | 267 views/day on 16K followers, ineligible re-uploads | dead | park (1 own-graphic/day with Alex's sound, or 0) |
| YouTube | **F** | 30 subs, 0 in 12+ days, 5 killed-format Shorts still queued today | unchanged | park (FT Highlights by-product only) |
| Bluesky | **F** | flat 6 days, 16 posts → 8 likes | unchanged | 5 replies/day or park |
| Telegram/WhatsApp/Snapchat | n/a | 2/0/0, no instrument, 34–51% of critic budget | new | mirrors only, zero minutes |

---

## 6. What is achievable (honest maths)

[DATA] Real 5-day net 09-24→29: Threads +544, FB +116, IG +13, TikTok −4, YT 0, Bluesky −3, X ≤+100 (rounded) → **≈+770 / 5 days ≈ +150/day** (PM's "+130/day" and RULES' "+170/day" bracket it). Best single day on record ≈ +500 (09-27).
[INFERRED] Levers and their realistic size, PL back on 10-10:
- IG recommendations restored + post-match carousels ≤25 min + 2 gated reels/day on feed: non-follower reach back to 80–130K/day → 40–90 follows/day (at the observed ~3/10K on 240K views that is ~70).
- Threads 5–8 image-led originals/day + hit-conversion routine: 1 hit/day of ≥100K → +150–300/day (Fri→Mon averaged +127/day with that pattern; conversion routine adds, at best, ×1.5–2).
- FB: 2 Goldbridge tickets + every IG reel auto-shared: +30–60/day (+ad while it stays under kr 3/follow).
- X: moment lane + 15 replies: +50–150/day on matchdays (one 1M post ≈ +100 on our data).
- TikTok/YT/Bluesky/new three: ~0 until an original format exists.
Sum on a good matchday: **+400–800/day**; quiet break days +150–300. From 10-10 to 01-01 (83 days) at an average +450/day → ≈ +37K → **~175–215K total on 2027-01-01.** 1M needs 9,200/day: 54× today, 12–20× the plan above. Keep 1M as the 2027 direction; test the plan against +500/day weekly (Friday reads), as RULES_REVIEW proposed.

---

## 7. CAPTAIN'S RECOMMENDATION — the operating model

### 7.1 Platform tiers (effort, not aspiration)
| tier | platforms | share of effort | what they get |
|---|---|---|---|
| **1 — the engine** | Threads, X, Instagram | ~80% (Threads 35 / IG 25 / X 20) | the hero story, all craft, the conversion routine, the series |
| **2 — the converter** | Facebook | ~10% | every IG reel via the IG app with Share to FB (Alex, ≤1/day) or Metricool cross-post; 2 Goldbridge/day via Postiz; FB single-image test as planned; ad judged Wed |
| **3 — free mirrors** | Telegram, WhatsApp, Snapchat (OneUp only while the trial lasts) | 0 minutes | Telegram integration on every gated Postiz post; WhatsApp 1 post/day at most (the best reel); Snapchat = OneUp batch of already-passed reels, never a separate review, never a back-catalogue re-edit; decide keep/drop on 10-04 on Spotlight views |
| **parked** | YouTube, TikTok, Bluesky | ~10% combined | YT: only the FT "[H] x–y [A] \| Highlights" Short as a by-product (delete the 5 queued Goldbridge/quiz Shorts; kill the club series); TikTok: 1 own-graphic/meme-vessel reel/day with Alex's sound or nothing; Bluesky: 5 hand replies/day, no originals until 10-06 |
STOP: overnight reel drips; identical captions across platforms; live text blocks on mid fixtures; Snapchat sprint volume; YT filler; self-promo posts; the 25-replies quota (10 good ones); grading the PM on checklist counts; hourly floor reports (3-hourly, 10 lines).

### 7.2 The daily content system: ONE HERO, THREE DERIVATIVES, ONE SERIES
- **08:30 Editor picks the hero** (the one story or moment of the day; on matchdays the fixture) from Radar = `breaking.mjs` + X Sports tab + the sweep accounts. If nothing qualifies, the hero is an evergreen absurd receipt (the Dembélé/Sky-Saka/hairstyles lane needs no news peg; 13:00–17:00 slot).
- **Derivative 1 — Threads (by 10:30):** image-led one-clause post (receipt / kit absurdity / quoted fan take), big fanbase, a claim to dispute. Then 4–7 more originals across the day in the same shape (Threads tolerated 19–24/day without losing reach; the cost of a flop is ~0). No text-only posts. No live blocks except the top fixture, max 3.
- **Derivative 2 — X (within 15 min of the moment):** 2–8 words on a face/photo; quote-post Ornstein/Romano inside 15 min; 10 real replies under ≥1K-like threads at HT/FT or 14:00/22:30; FT stat-sheet roast ≤10 min. Alex's own ragebait whenever he likes.
- **Derivative 3 — IG (12:30 / 19:00 / FT+25):** one plate+film-clip reel on the hero (feed-shared, `showReelOnFeed:true`), cross-posted to FB; one carousel only after a big moment (≤25 min after FT, own-first slide, ≤10 slides, own text on every slide) — no daytime recap carousels while the recommendation question is open.
- **The series (the reason to follow):** 🚨 THE DAILY NUMBER at 13:30 on X + Threads (+ IG 3-slide) as designed (kill after 5 if <1.0/10K Threads and <1.5/10K IG); SHITHOUSE OF THE WEEK Sat poll / Sun award (first 10-04). Nothing else new until one of these has 5 data points.
- **Hit-conversion routine** (within 60 min of any post >5× median): self-reply follow line, pin, matching bio line, next-day follow-up. Logged with the minute it fired.
- **Unique assets/day target: 8–12** (Threads 5–8, X 3–5 + replies, IG 2–3, FB 2). Mirrors are free and unlimited but are never counted as output.

### 7.3 Team, roles, cadence (collapse 8 roles into 3 running things + 2 on-call)
| role | what | cadence | cost |
|---|---|---|---|
| **Editor** (one session, Sonnet trial as agreed) | picks the hero, writes, posts, replies, runs the conversion routine, logs post ids | 08:30–23:30, always on | the only place tokens should go |
| **Radar** (scripts, no tokens) | `breaking.mjs` + `matchwatch.mjs` + `coverage.mjs` wake the Editor; on match nights the ESPN watcher | continuous | 0 |
| **PM** | ONE report at 23:00, ≤1 page: scoreboard row, follows/10K, non-follower reach, saw-to-post minutes, 3 more / 3 less, tomorrow's hero candidates; morning 08:00 = the dashboard (§9), not a 36 KB essay | daily | 1 run |
| Critic (on call) | **advisor** on X/Threads (ACTION + WHO + P(50K+) logged, never a block except hard-fail categories); **gate** only for IG carousels/reels and any video (≥7, no criterion <5); one review per asset, mirrors inherit; fast lane for moments (post on self-check, audit within 2h) | per asset | ≤20 verdicts/day |
| Fact-checker (on call) | every number/quote | per asset | as now |
Floor manager: every 3 hours, 10 lines, only "what is silent / what skipped the gate / what repeated". Growth analyst folds into the 08:00 dashboard.
Alex: ≤2 asks/day (today: the IG status check + TikTok/X numbers). Weekly Friday review with Alex on the §9 numbers.

### 7.4 Big swings (cross-cutting; the platform auditors own per-platform bets)
1. **IG collab series with 50–135K banter accounts** (collab_plan.md targets: @nonoffsideguy, @midnitefootball, @itsfootybants, @ftblmemeshub, @trollol_epl). WHAT: one co-authored carousel/reel per week, Daily Number or a proven hit shape; WHO: Editor DMs (≤3/day, hand-written) + Producer; WHEN: first accepted collab by 10-03; WHY: a collab post reaches both audiences natively, which is the only IG route that bypasses our recommendation problem; EV: one 80K-follower partner's post at their median (5–20K likes) ≈ 20–100 follows to us per collab [GUESS]; cost 30 min/day. Kill: 0 acceptances by 10-10.
2. **Originality rebuild of IG/TikTok output** (own text on every slide, own-first slide, film/TV vessels not match footage, our plate). WHY: the 04-30 aggregator rule + TikTok's own flag; EV: restore non-follower reach to ≥80K/day → +40–70 follows/day; cost: Producer time, nothing new. HOW WE'LL KNOW: Graph follow_type breakdown daily; ≥60K non-follower reach on 3 of 5 days by 10-06 or escalate to Alex's manual native posting for a week.
3. **Boost one proven hit on IG** (Alex approved to "talk tomorrow"): kr 200 over 48h on the best reel of the week with a follow objective; measure cost/follow against FB's kr 2–5; kill if > kr 5/follow.
4. **X as the money-and-hits lane:** Alex's voice 5/day + the Editor's 10 replies; OCR payout read 10-09 decides how much original X volume to push. EV: one 1M post/fortnight ≈ +100 followers and (old-program peak) ~$400/fortnight.
5. **STOP list is the biggest swing:** three new channels to zero minutes, YT/TikTok/Bluesky parked, drips off, mirrors uncounted. Frees ~50% of the Editor's day and ~50% of the critic's verdicts for Threads/X/IG.

---

## 8. First 72 hours (10 lines, owners, how we know)

1. **Tue 14:30, Alex (2 min):** IG app → Professional dashboard → Account status → recommendation eligibility; Insights on the 09-28 City carousel (Dd0q3HZGHli) and the 09-24 Xavi–Klopp carousel (Ddr0JqZH0Aq) → "Accounts reached: followers / non-followers %". Paste both. Decides H3-IG today.
2. **Tue 15:00, Editor:** Threads back on — 5 image-led one-clause originals before 20:00 (Croatia/Cissé shape; Croatia–Spain and England–Czechia are tonight's warm fanbases), fast lane, no text-only, no live block except ENG–CZE max 3. Hourly test: run from 15:00 or write "cancelled" in PLATFORM_PLANS.
3. **Tue 15:00, Producer:** cancel tomorrow's 03:30–11:00 Metricool drip; move the 4 reels to 12:30/19:00/22:55 with `showReelOnFeed:true`; strip 😭 from 2 of 4; give each platform its own caption line. Purge the 10 no-verdict Postiz items (5 YT, 3 FB, 1 TikTok, +1) as the PM listed.
4. **Tue 15:30, Captain:** freeze tiers 3 and parked: Snapchat/Telegram/WhatsApp = mirrors of already-passed assets only, 0 verdicts, 0 Chrome minutes; delete the 5 non-A/B YT Shorts; Bluesky replies-only; TikTok nothing today.
5. **Tue 20:45–23:10, Editor (moment lane):** ENG–CZE: X ≤5 min per moment, FT stat-sheet ≤10 min, IG carousel ≤25 min after FT with own-first slide, Highlights Short ≤23:00, 10 X replies at HT/FT; log "saw HH:MM / posted HH:MM" per item.
6. **Wed 08:00, PM:** the §9 dashboard as the morning file (≤40 lines), with the new IG non-follower column (the Graph call in this report, per day) and follows/10K per platform; posts_log metrics filled at +24h for every Mon/Tue row.
7. **Wed 09:00, Captain:** commit one critic bar (advisor on X/Threads, gate ≥7 on IG/video, one review per asset, mirrors inherit) so `banger-critic.md`, the sweep SKILL.md and the PM prompt say the same thing; delete "most drafts should FAIL" everywhere.
8. **Wed–Thu, Producer:** IG originality week — own text/re-set on every carousel slide, own-first slide, film/TV vessel reels only, ≤1 daytime carousel, post-match carousel ≤25 min; Alex posts the day's best reel from the IG app once (Share to FB on).
9. **Wed 18:00, Alex:** FB ad spend + follows (cost/follow rule); TikTok followers + last-5 views; X Analytics follower count screenshot. These three numbers have no other source.
10. **Fri 10-02, Captain + Alex (30 min):** first weekly read on §9 numbers only: IG non-follower reach trend, Threads hits/day and follows/10K, X moment latency, FB cost/follow, Daily Number #1–#4, collab replies. Kill/keep each experiment on its pre-registered rule; nothing new starts before something is killed.

---

## 9. Audit of the audit: why we were blind, and the morning dashboard

### 9.1 Instruments that were missing or unread (and the cheapest fix)
| gap | why it mattered this week | fix |
|---|---|---|
| **IG follower vs non-follower reach** | the only number that shows a distribution problem; never pulled until today | add `breakdown=follow_type` (reach, views) per day to insights.mjs (the curl in this report works with the Page token); scoreboard column "IG non-follower reach" |
| IG Account status / per-post follower split | decides H3 in 2 minutes; last checked 09-22 | Alex weekly (Mon) + after any reach drop >50% |
| **X followers + per-post views** | 45.3K rounded, no API; every X claim is an upper bound; OCR payout unread | Alex: X Analytics screenshot daily 12:00 (30 s); Creator Studio read 10-09; consider X API Basic only if OCR pays |
| TikTok anything | "no read since 09-27" three days running; Metricool TKEV02 works (used today) but nobody reads it; TKEV08 null | Metricool TKEV07/TKEV02/TKEV01 daily in insights.mjs; Alex pastes the eligibility badge on any post >2K |
| per-post outcomes joined to verdicts | posts_log `metrics` null on 143 of 156 rows; the critic's accuracy is unmeasurable | `postlog fill` at +24h (Threads API, IG Graph, Metricool) run by the 08:00 task; log post ids at post time (Chrome X posts have none) |
| unique assets vs mirrors | "87 posts today" hid "15 assets, 0 on Threads/X" | dashboard counts unique assets per platform tier; mirrors in a separate line |
| non-follower share on Threads | not exposed per post; THEV11 (profile views) unused | daily THEV03 ÷ THEV06 ×10K + THEV11 in the scoreboard |
| reference-account reach during the same days | vidIQ 4 credits left (PM spent 10 today on outliers); Socialinsider no project; Mysocial Free | keep the free Business Discovery table in insights.mjs (it worked today: 10 accounts, best post + views) and log it daily; Socialinsider `create_project_with_brands` needs Alex's one-line OK; stop spending vidIQ on outlier searches |
| Metricool plan limit | 13 reels/day planned on a 20/month plan [unverified] | `getBrandSettings` today |
| Telegram/WhatsApp/Snapchat counts | 2/0/0 and nothing since | Bot API `getChatMemberCount`; WhatsApp/Snapchat by hand once a day or accept "no instrument" and stop planning on them |
| saw-to-post latency | Zidane 25 min, Pochettino 3h10m, drafts FAILed on timing 3/10 | Radar writes "saw HH:MM", Editor "posted HH:MM" in board.md; PM reports the median |
| the run sheet itself | PM file did not exist at 08:32; sweep executed nothing | the 07:45 task must write the file or the sweep runs a default (Threads 3 + X 2 + reply pack) |
| money in/out | OneUp, Metricool, Postiz, vidIQ, ads vs FB $0.56–0.71/day, X OCR $0 | `money.md` one table, updated Fridays |

### 9.2 The morning dashboard (08:00, one file, ≤40 lines; the PM fills it, the Captain reads it first)
```
DATE · calendar (PL / break / fixtures tonight) · hero candidate(s)
platform | followers | Δ24h | 5-day mean/day | views 24h | follows/10K | unique assets 24h | best post (views/likes) | worst (views/likes) | flag
Threads  | THEV01 | THEV03 | csv | THEV06 | calc | posts_log | insights | insights | hit? (≥5× median)
IG       | IGEV01 | gained/lost | csv | IGEV05 | calc | posts_log | insights | insights | NON-FOLLOWER REACH (Graph) + feed-flag check on each reel
X        | Alex screenshot | Δ | — | Postiz 7d or Alex | ≲ | posts_log | library | library | replies made / saw-to-post median
FB       | FBEV17 | FBEV47/48 | csv | FBEV49 | calc | posts_log | insights | — | ad spend, cost/follow
TikTok   | TKEV07 | TKEV08 | — | TKEV02 | — | TKEV01 | Metricool posts | — | eligibility flags
YT/Bluesky/Telegram/WA/Snap: one line each: followers, Δ, "no instrument" where true
EXPERIMENTS: name · day N of M · pre-registered read date · current number vs kill line
INSTRUMENT HEALTH: which reads failed/lagged (insights.mjs exit code, Metricool null cells, Postiz 429s)
YESTERDAY'S SILENCES: platforms with 0 tier-1 originals for >6 waking hours
```
Rules for reading it: judge on follows/10K and non-follower reach, never on views or post counts; compare against the same calendar condition (break day vs break day); anything with a pre-registered kill rule is killed on the date, not carried over silently; a platform flat 2 days changes format, not volume (the playbook already says this and it was not applied to YT for 12 days).

---

## 10. Ten-line summary

1. Since Friday, IG and TikTok lost distribution (IG non-follower reach 110K→16–23K/day, follower reach flat; TikTok 10.8K→267 views/day), X came down from its 1.36M peak to a ~1K median, Threads kept hitting (467K, 142K) and growing (+509 Fri→Mon), FB improved (+29–38/day), YT/Bluesky were already dead.
2. It is not "just the break": break days 1–2 were 3–5× better than break days 5–6 on IG with the same calendar, and comparable banter accounts posted 1M+-view reels in the same 72 hours.
3. Best single explanation on IG: loss of non-follower recommendation after three weeks of majority-repost output (plus 17 of 22 reels hidden from feed); Alex can confirm or kill it in 2 minutes in the IG app today.
4. Our own changes added real damage: overnight drips, identical captions on 4 platforms, 😭 on 44% of rows, re-queued flops, 25-minute-to-3-hour latency, and a gate that blocked 9 of 12 known hits and changed bar twice in 24 h.
5. The spread to 10 platforms did not cause Friday; it caused Tuesday: 87 rows from 15 assets, 54 of 105 verdicts on Snapchat, Threads and X silent for 13–14 hours, 0 replies.
6. Structure is the ceiling: 1/10K on Threads, ~3/10K on IG (unchanged), 4–7 on FB, ≲1 on X. 1M by 01-01 is 54× off and unreachable; +400–800/day by late October is reachable → ~175–215K on 01-01.
7. Operating model: Threads/IG/X get 80% of effort; FB is the converter; Telegram/WhatsApp/Snapchat are zero-minute mirrors; YT/TikTok/Bluesky parked; one hero story a day → Threads image post, X label, IG reel/post-match carousel; the Daily Number and Shithouse of the Week are the only series; 8–12 unique assets a day, mirrors uncounted.
8. Team: one Editor, script Radar, one PM report a day, critic as advisor on X/Threads and gate on video/carousels with a fast lane; Alex ≤2 asks/day.
9. Instruments to add now: IG follower/non-follower reach per day (works today via Graph), X Analytics screenshot daily, TikTok Metricool reads, +24h outcome fill in posts_log, unique-assets count, saw-to-post minutes, a money table; stop spending vidIQ credits on outliers (4 left).
10. Next 72 hours: IG status check (Alex), Threads back to 5–8 image-led originals via a fast lane, drip and mirrors off, ENG–CZE in the moment lane tonight, one critic bar committed, IG originality week, and the first Friday read on the §9 dashboard with kill rules enforced.
