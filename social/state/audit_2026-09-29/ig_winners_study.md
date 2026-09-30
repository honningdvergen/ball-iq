# Instagram winners study — 2026-09-29 (Claude; data = Instagram Graph API on our own account, feed posts since 2026-08-17; reels have no `follows` metric)
Method: pulled 600 media (back to 07-20) + per-post insights (reach, follows, shares, profile visits). Feed posts (images + carousels) since 08-17: 432 posts, 1,846 follows attributed. Everything below is [DATA] unless tagged.

## 1. The shape of it
- **Follows are concentrated in a few hits.** Top 5 posts = 36% of follows, top 10 = 54%, top 20 = 70%, top 40 = 82%. **245 of 432 posts (57%) gained ZERO follows.** Volume is not the engine; a few posts are.
- **Weekly follow yield (follows per 10K reach, carousels/images):** July ≈ 0.9–1.3 → wk 08-17: 2.2/3.8 → 08-31: 3.4/1.8 → **09-07: 4.8/1.0 → 09-14: 4.6/4.6 (371 follows in the week)** → **09-21: 1.8/1.3 (65 follows)**. Posting volume did not fall (4–12 feed posts/day throughout). So the drop since ~09-21 is a **quality/fit drop, not a volume drop**.
- Meta's earlier "carousels convert 0.92/10K" was July-era data; since 08-17 it's ≈3/10K (peaking 4.8). The "aggregator throttle" story is weak: yield rose to its best weeks while posting mostly screenshot carousels, and Account Status (screenshot 09-29) says Recommendation eligibility ✓.

## 2. What the winners have in common (top 10 by follows)
| date (UTC) | format | follows / reach | caption (start) |
|---|---|---|---|
| 08-19 | image | 200 / 435K | "🚨 DRAMA IN EGYPT: Egypt coach… two wives" (non-club shock story) |
| 09-14 | image | 152 / 241K | "Manchester United fans will feel aggrieved after losing the derby…" (day after the derby) |
| 08-17 | image | 133 / 131K (10.2 per 10K!) | "This Chelsea team looks so good on paper" (one-liner + joke image) |
| 08-25 | carousel | 100 / 184K | "First round of the PL… Arsenal and Chelsea look strong, Tottenham and Man United like SHITE" |
| 09-14 | carousel | 88 / 145K | "Refs can ruin your season and all they have to say is sorry" (post-derby refs row) |
| 09-03 | image | 71 / 669K | "What's going on at Liverpool football club man" |
| 09-08 | carousel | 70 / 93K | "Devastating news for Garnacho… not in the 30-man Ballon d'Or list" |
| 09-18 | carousel | 69 / 83K | "Gavi went 30 whole minutes without a foul…" |
| 09-08 | carousel | 66 / 151K | "Every Man United fan will agree… funny seeing an EVERTON fan doing the dissing" |
| 09-04 | carousel | 49 / 13K (37 per 10K) | "Liverpool win 2-0 vs Ipswich… Isak" |
Patterns:
1. **Fanbase-addressed, plain-spoken captions** ("X fans will…", "Every X fan will agree…") — captions containing "fans": 3.2 follows/10K vs question captions 1.3 and "😭" captions 1.9.
2. **Club matters more than reach.** Since 08-17: Man United 54 posts → 380 follows (4.3/10K); Chelsea 4.3; Spurs 2.7; Man City 1.8; Arsenal 1.7; Liverpool 1.7 (1.16M reach!); Real/Barca 1.5; Ronaldo/Messi 1.2. Big reach ≠ follows. The fanbases that are *being hurt or teased* follow (United, Chelsea).
3. **Timing to the story:** most winners land within ~24 h of a drama (United's derby loss, Ballon d'Or list, PL week 1). The non-club shock story (Egypt) also won: a picture + a story that stops the scroll.
4. **A single strong image with one line beats a big carousel per view** (Chelsea one-liner 10.2/10K).
5. **None of the top-10 captions contains a follow CTA** [DATA]. Slide-level CTAs can't be read from the API [unknown]; our one CTA-slide carousel (City, 09-28) got 2.0/10K — no better than average. So the follow comes from the post's identity match, not the ask.
6. Best follow-yield hours (UTC, 08-17→): 06–10: 4.3 · 14–18: 3.6 · 10–14: 2.4 · 18–24: 2.5 (small samples, [INFERRED]).

## 3. What changed after ~09-19
Sep 19–28 feed posts were mostly generic 'timeline' filler ("Day four of the international break…", "No Premier League until October, so the timeline has…", "City day two…😭") and international-break memes with no club to address; 57% of them got 0 follows; even the 56K-reach Xavi–Klopp carousel got 8 follows and the 41K Ronaldo one 3. Winners in that window were club-specific: Spurs bottom of the table (12 follows/6.8K), Arsenal fans think Arteta has three titles (12/14K), Spurs maths image (9/33K). [INFERRED] The break removed the club-drama fuel AND we filled the gap with unaddressed filler — both, not just the break.

## 4. What to do (feeds A_GRADE_PLAN.md, Instagram row)
1. **Fanbase-first posts, ≤4 feed posts/day.** Aim at United and Chelsea first, Spurs/Arsenal when there is drama. Caption voice: plain-spoken, addresses the fanbase, takes a side ("X fans will…"). Stop 'timeline' filler, question captions and the 😭 template.
2. **Test single-image one-liners against carousels** for United/Chelsea (paired posts, judge follows/10K). The 10.2/10K one-liner is the outlier to replicate.
3. **Post within ~24 h of a real club drama;** on quiet days post less, not filler.
4. **Add feed `follows` + reach per post to the morning dashboard** (this pull works; reels have no follows metric).
5. **CTA slide A/B:** run 4 paired carousels (with/without) before deciding; do not assume it helps.
6. Ask Alex for slide-level evidence occasionally (which slide people stop on) — not available via API.
