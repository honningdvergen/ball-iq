# BENCHMARK 2026-09-30: what the accounts we admire do that we do not
(Synthesised by the benchmark workflow from the 83-post sweep of 13 IG accounts, exported 00:00Z 09-30, plus insights_0930.txt and benchmark_timing/formats/captions.md. One evening of data; small samples. Write tool was unavailable to the agent, saved from its returned text.)

## Checked against the data
- **The City verdict did NOT break at 19:30Z (21:30 Oslo). Release was about 16:05Z (~18:05 Oslo)** (analysts: Guardian 16:05:21Z, RTE 15:59:53Z; ESPN's own page timestamp 11:58 ET = 15:58Z). Sweep: anfieldcentral 16:45Z "BREAKING…" (530 likes), thatguysjokes 17:09Z 4 slides 43K likes. posts_log `broke: 21:30` is wrong.
- **Lag:** 5 of 13 accounts covered it, first posts +40, +64, +119, +152, +187 min (median +119). Ours: Threads +175, IG carousel ~+380 min (22:27Z, 1,204 views, 69 likes). Only two accounts landed inside 90 min.
- **Reels:** our reel median 2,087 views = 0.064x followers (n=37, 09-13..09-28). thatguysjokes 17:29Z reel 944,842 plays on ~2.17M followers = ~0.44x. Four peers with 7+ reels: 0.36-0.74x. We made ~40 reels in 14 days.
- **Slot:** our 11 IG posts on 09-29 ran 03:31-14:52 Oslo, then 22:41, 22:47, 00:27; nothing 14:52-22:41. 60% of peer posts that day sit 16:00-22:00 Oslo.

## The one biggest gap per dimension
- **Timing = detection, not production.** Floor check #7 (18:20 Oslo, 15 min after the statement) and #8 said "nothing live"; 22 enforcer ticks said "0 new". First draft came 5h19m after release. When a human was watching we were fastest (09-25: IG +25 min 36K views; Threads +35 min 260K views). Earlier does not clearly mean more likes (Spearman -0.38 n=9 statement story, +0.36 n=10 leak story, neither significant). Peer median lag is +119 min; being first is not required.
- **Format = reel reach, not format mix.** Peer mix 54/28/18% carousel/reel/image vs ours 42/30/27. Sweep: 62 of 83 are carousels, median 10 slides (fan pages 10-15, media brands 4-5). Our hits are an order of magnitude smaller (700-2,400 likes since 09-20 vs 7K-98K).
- **Caption = a body and a hook aimed at people.** Peer median 440 chars, 76% have a 250+ char body. Ours since 09-28: median 75 chars, 0 of 15 at 250+. Verdict-night winner opened with a short verdict on the consequence ("They're finished that whole Premier League statement is mental"); ours opened with the news sentence (the style that did worst among peers). 21% of our captions end in a CTA question vs 3% of theirs; 😭 in 52% of our first lines vs 15% of theirs.

## Not a gap
- Slide count 7-15 (peer buckets flat 0.83-1.11x); ours with ≤6 slides vs ≥7: median 284 vs 341 likes (n=10 vs 106) → set a 9-slide floor.
- Volume: we post 9.4/day vs peer median 2.7 (not a shortfall).
- Hour of day for likes (flat 0.94-1.08); hour matters for news relevance only.
- The international break as an alibi: peers held 0.90x of pre-break median, we held 0.77x (carousels 0.69x, reels 0.49x); the break explains about 10 of our 23 points.
- Not measurable: watermark, music, tweet-screenshot vs original share, peer follow rates.

## Three experiments 09-30 → 10-06 (existing tools only)
- **E1 Reference clock:** at every floor check open the 13 accounts; an event is live when ≥2 post on it within 2h; log lag from the 2nd reference post. Targets: Threads/X image ≤30 min, IG carousel ≤90 min. Pass ≥70% of ≥3 live events on target; fail any event >180 min or <50% on target. Likely catalysts: City appeal deadline Fri 10-02, league restart 10-10.
- **E2 One story, numbered parts, daytime:** first story ≥3 references cover → 3 numbered parts of 10-13 slides (real tweets + one own maths card), 15:00-24:00 Oslo ≥6h apart. Week rules: no carousel <9 slides, nothing 00:00-09:00, ≤1 reel/day in window. Pass: any part ≥650 likes at 12h (2x our ~330 Sept median) and 7-day carousel median ≥300; fail all parts <330 and week median <150. Reel check: pass median views ≥4,200 (2x 2,087); if ≤2,100 after 7 reels cut reels to 3/week (n=7 small).
- **E3 Caption arms (needs Alex's OK: overrides "one line + 1-2 sentences"):** two carousels/day on the same story, alternate order. Long arm: verdict ≤12 words aimed at a person/fanbase + 60-120 fresh words. Short arm ≤20 words. Both drop "Which one got you?", ≤1 😭. Pass long-arm median views ≥1.5x short after ≥8 pairs with follows/10K not lower; kill <1.1x.
