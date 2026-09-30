# COMBINED PLAN — Shithousery HQ fat audit (2026-09-29, captain Claude; five auditors: meta, text-platforms, video-platforms, small-platforms, since-friday)
Sources: the five reports in this folder (each claim tagged DATA/INFERRED/GUESS there). This file resolves their conflicts.

## 1. Verdict in one paragraph
Not "just the break". Since Friday IG non-follower reach fell 110K→16K/day, TikTok views/day 10.8K→0, X sits at 479–1,744 views/post after the 684 hit; Threads still hits (Dembélé 467K, Cissé 142K) and FB grows. Causes ranked (since-friday): IG/TikTok originality throttling ~30% · our own changes (overnight drip, identical captions, 😭 on 44%/79% TikTok, latency, critic flip-flopping) ~30% · the break ~25% · spread across 10 platforms ~15% (all of Tuesday) · structure is the ceiling (views ≠ follows: Threads 0.4–4, IG 1.4–3, FB 4–7, X ≲1 per 10K). Threads' 0-like posts are duds (median 1,192 views, 2.8% of followers), NOT throttling.

## 2. Grades
| Platform | Grade | One-line verdict |
|---|---|---|
| Threads | C- (reach A-, conversion F) | Only image posts hit (16% ≥10K views vs 4% text, 3% video). No conversion mechanism at all. |
| Instagram | D | Lost non-follower recommendation (aggregator signature). Carousels own-first ≈5× the rest; reels die at ~5.5 s watch. |
| Facebook | C+ | Best converter (4–7 follows/10K), tiny base, ~$0.7/day. Conversion lab, not the primary. |
| X | D | Flat 45.3K; 1.36M-view post ≈ 0 net follows; NO per-post instrument. Automation risk to OCR payout (see §5). |
| TikTok | D | Old engine (others' clips) is flagged unoriginal; ours cap ~1K. Missing native sounds. |
| YouTube | F | 0 subs from ~100 Shorts; even the model channel converts 3–4/10K. Mirror-only. |
| Bluesky | F | Median 1 like; 10–40× worse than same-size peers; platform shrinking. Image-only mirror. |
| Snapchat | D (prov.) | No measurement yet; 50K bar ≈3% by 01-01; OneUp go/no-go 10-04. |
| Telegram | D | 2 subscribers after 25 posts. Mirror + 1 CTA reply/day. |
| WhatsApp | F | Park (0 instrument, Chrome hack in Alex's personal WhatsApp). |

## 3. Operating model (replaces "post everywhere")
- 80% of effort: Threads + Instagram + X. Facebook = the converter (IG-app shares + 2 Goldbridge/day + fixed-slot Daily Number). Telegram/WhatsApp/Snapchat = zero-minute mirrors of what already exists (Snapchat capped; OneUp decision 10-04). YouTube, TikTok, Bluesky = parked/mirror (TikTok: 7-day native-sound test by Alex, YouTube: 1/day auto-mirror + kill 10-13).
- ONE hero story a day → derivative pipeline: Threads image-led one-clause post; X 2–8-word label + replies; IG plate+film-clip reel (feed-shared) + post-match carousel ≤25 min after FT with follow slide. 8–12 unique assets/day, mirrors uncounted.
- Series (reasons to follow): THE DAILY NUMBER 13:30 and Shithouse of the Week only. Hit-conversion routine within 60 min of any 5× post (pin, self-reply follow line, matching bio).
- Volume: IG ~8→4/day; Threads 7 image originals 09:30–20:30 Oslo + 10 outbound replies/day; X 4–6 originals (8–10 match nights) + replies.
- Critic: ONE bar, ≥7 (Alex 09-29). Advisor-only lane on X/Threads for speed; hard gate on video/carousels; one review per asset.
- Team: one Editor session, script Radar (breaking/matchwatch/coverage), one PM report 23:00 + 08:00 dashboard, floor manager every 3 h/≤10 lines, Alex ≤2 asks/day.

## 4. Conflicts between reports → resolutions
1. Bluesky: PM said replies-only 15/day; small-platforms + since-friday say park. → PARK: cancel the 15-replies plan; ≤2 gated image posts/day, native copy (no music credit), test 10-01→10-07.
2. Threads hourly screenshot test: not running; kill rule (median <600) too easy. → Replace with the 7-image-originals plan + conversion desk; judge on follows/10K, target +180/day by 10-06, +250 by 10-13.
3. FB ad: switch objective to Page likes now (not Wed), drop IG placement, target UK+IE 25–54; scale only if < kr 2.5/follow.
4. Instagram "throttle": meta says ~25% chance, since-friday says best explanation. → Alex's 2-minute Account Status + follower/non-follower split check TODAY decides.

## 5. DECISIONS ONLY ALEX CAN MAKE
1. **X automation risk (text-platforms, from our own 09-24 research):** X's Original Content Rewards rules say automated means make a post ineligible and scripting the website is suspension grounds. We post X via Postiz and Chrome. Options: (a) originals by hand from his phone (best for OCR), (b) keep automation and accept risk. Recommend (a) for anything meant to earn, at least until the first payout on 10-09.
2. **Threads audience is NOT mostly UK/EU:** India 12%, UK 10.5%, US 10.2%, Nigeria 6.9%, Kenya 6.9%, Turkey 4.4% — ~80% outside UK/US/EU. Global mega-club stories hit; Nordic in-jokes and live-match text blocks flop. Confirms writing for a global football audience.
3. 1M by 01-01 is unreachable (54× off); realistic with this plan: +400–800/day by late Oct → ~175–215K on 2027-01-01. Accept a reset target?

## 6. First 72 hours
Today: Alex IG check 14:30 · move reels off overnight (done: 07:30→19:00 tomorrow) · Threads image originals from 15:00 · ENG–CZE tonight in the moment lane logging saw→post minutes · purge 8 remaining unreviewed Postiz items (deleting, quota-limited).
Wed: 08:00 dashboard (followers, Δ24h, follows/10K, IG non-follower reach, experiments vs kill dates) · one critic bar · Alex pastes FB ad/TikTok/X numbers 18:00.
Fri 10-02: first weekly read with kill rules enforced. Kill dates: TikTok test 10-06, IG originality 10-06, Snapchat/OneUp 10-04, YouTube 10-13, X <+60/day 10-13.

## 7. Missing instruments (build first)
IG follower vs non-follower reach (Graph curl works; add to insights.mjs), X Analytics daily screenshot, TikTok Metricool reads, +24h outcome fill in posts_log (metrics null on 143/156 rows), Telegram Bot API count, unique-assets vs mirrors count, saw→post minutes, money.md.
