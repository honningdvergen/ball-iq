# Threads winners study — 2026-09-29 (Claude; Threads API on our own account, 900 posts 08-18 → 09-29, per-post views/likes/replies/reposts/quotes)
Limits: the Threads API has NO per-post follows metric, so follower conversion is only readable at day/week level (net +111/day; 0.4–4 follows per 10K views per the audits). Everything below is [DATA] unless tagged.

## 1. Shape of it
- We posted ~15–29 Threads posts a day for six weeks. Weekly median views stayed 0.9–1.8K regardless of volume. Weekly hit rate (posts ≥10K views): 21% → 23% → 26% → 16% → **8%** (wk 09-14, 15.7 posts/day) → 12% → …
- **Views are dominated by a handful of mega-hits:** 5.64M (Mourinho reaction to Trent's long ball, 08-22), 3.29M (Spurs "if they win all 33" maths, 09-21), 2.70M (Sky Sports did Saka dirty, 09-24), 1.43M (Ramos VAR, 08-31), 1.21M (Bellingham to Romero quote, 09-21). **Top 5 posts ≈ half of all ~28.7M views.** The median post is ~1.2K (≈2.8% of followers).
- So the "0 likes with 40K followers" posts are duds inside a normal distribution, not suppression: since 08-31 only **13 of 545 posts got 0 likes (2.4%)** — 7 of 28 text-only posts (25%), 4 of 55 videos (7%), 2 images; 8 of the 13 were posted 20:00–21:59 UTC (22:00–23:59 Oslo).

## 2. What works / what doesn't (since 08-31)
| type | n | median views | hit ≥10K | zero-like |
|---|---|---|---|---|
| Carousel | 69 | 1,969 | 25% | 0% |
| Image | 393 | 1,275 | 18% | 1% |
| Video | 55 | 586 | 5% | 7% |
| Text-only | 28 | 1,207 | 4% | 25% |
- **"🚨" news/quote-card style: median 2.2K, 33% hit (48 posts)** — best-performing caption style. Own maths/number cards: 10% hit but they produced two of the five mega-hits (spiky).
- **Density hurts:** ≥4 of our posts in the prior hour → median 743 (vs ~1.3K) and 9% hit; ≤3/hour is normal. Gaps >90 min: 23% hit vs 14–17% for tighter gaps.
- **Time of day (UTC):** 06–09 → median 2.1K; 10–17 → 1.2–1.3K; 18–23 → 1.0K and most of the zero-like posts. Mornings (08–11 Oslo) are the best slot.
- Club mentions barely matter on Threads (United 8% hit, City 19%, Liverpool 18%): the audience is global (India 12%, UK 10.5%, US 10.2%, Nigeria 6.9%, Kenya 6.9%) → mega-club/global moments win, unlike IG where a hurting fanbase converts.
- Caption length ≤60 vs >160 chars: same hit rate (17% vs 18%). 😭/😅 captions: no lift (16%).

## 3. What the mega-hits share
All five are single images, all tied to a moment from the last ~24 h, all mega-global subjects (Real Madrid/Mourinho, Spurs, Arsenal/Saka, Bellingham): (a) a reaction image to a viral moment with a one-line caption; (b) our own numbers card ("Mathematically if Tottenham win all 33…"); (c) a quote card in the "🚨" news style; (d) fee/ranking tallies ("Dortmund sold Dembélé for €140m, Bellingham for €133m…", "three most terrifying hairstyles in football" 840K).

## 4. Plan for an A on Threads (feeds A_GRADE_PLAN.md)
1. **7–9 image/carousel posts a day, no text-only, no video cross-posts** (both underperform; 25% of text posts get 0 likes). Mix: 2 "🚨" quote/news cards, 2 own-number/maths or fee-tally cards, 2 reaction-to-moment images, 1 ranking/list image.
2. **≤2 posts per hour, ≥60 min apart; window 06:00–17:00 UTC (08:00–19:00 Oslo);** nothing after 20:00 UTC unless a match is live.
3. **Stop treating volume as the goal:** 15–29 posts/day did not raise the median; density ≥4/hour cut it.
4. **Conversion desk (still nothing exists):** for any post ≥5× the median: pin it, self-reply with the follow line, reply to top commenters within 60 min, keep the bio line matched. 10 outbound replies/day under big accounts.
5. **Instrument gap:** log the Threads follower count daily (API gives only current) and tag every post with format + subject in posts_log so weekly follows per 10K views by format can be computed; ask Alex for Threads Insights "followers" screenshots when needed.
6. Test (7 days): mornings-only 5 image posts vs current spread; judge on median views, hit rate and net followers/day. Kill/keep on 10-06.
