# Facebook winners study — 2026-09-29 (Facebook Graph API on the Page, 800 posts 07-19 → 09-29; per-post `post_media_view`, page daily follows/unfollows/views). Page followers 127 (08-16) → 574 (09-30).
Limits: no per-post follows (only page-daily); the ad (kr 50/day) is not separated from organic. [INFERRED] tags mark matches by date.

## 1. The shape
- **97% of all post views come from VIDEO posts.** Since 08-15: 145 videos (median 90 views, p90 2.1K) = 97% of views; **375 photo posts (median 27 views) and 153 album/carousel posts (median 21) = 3% combined.** We posted ~530 photo/album posts that reached almost nobody. (Today's United carousel on the Page will land in that 21-view bucket.)
- **The winners are ~10 videos:** 113K "What is happening to spurs fans man 😂😂" (09-15), 104K "Tottenham vs Aston Villa will be absolute cinema" (09-18), 91K "After the first week of PL it's already over" (08-26), 71K Everton/City 114 (09-25), 71K "Nah if only Goldbridge knew" (08-31), 67K Goldbridge donation (09-26), 67K "How Arsenal sold Gabriel Jesus to Barcelona" (08-31), 66K "every Chelsea fan who called Brentford away a free three points" (09-20), 55K Goldbridge United equaliser (09-06), 35K "Not sure Manchester United agree with you Mark" (09-17). The rest of the 145 videos are mostly <3K.
- Winner types: (a) fanbase-mockery clip captions in plain language ("What is happening to Spurs fans man", "every Chelsea fan who called…", Spurs/Arsenal/United), (b) Goldbridge/pundit reaction clips (5 of the top 10 — re-uploads of someone else's footage, a Meta "unoriginal content" risk), (c) one own-numbers item (Everton/City).
- **Follows arrive in spikes on/after breakout-video days** [INFERRED]: 09-07 (71) ↔ 08-31/09-06 Goldbridge + Arsenal clips; ~09-15/16 → 09-17/18/19/20 (66, 33, 17, 36 follows) ↔ the 113K Spurs-fans and 104K Spurs–Villa videos; 09-27→29 (29, 38, 29) ↔ Goldbridge 67K + the ad. Quiet days: 0–6 follows.

## 2. Conversion
- Weekly follows per 10K page views: 2.8 → 3.0 → 1.3 → 4.2 → 4.3 → 2.9 → **12.8 (wk 09-28, 83 follows on 64.9K views, ad live)**. Unfollows are tiny (4–12/week): Facebook keeps the followers it gets (Instagram/X lose ~10–25/day).
- Growth: +447 followers in 6 weeks (127 → 574); week 09-14 +152, this week +83 in two days.
- Weekly post counts were 75–140 (mostly photos) while the follow yield never depended on count.

## 3. What to do (feeds A_GRADE_PLAN.md, Facebook row)
1. **Stop photo/album posts on Facebook** (median 21–27 views, ~3% of views). If a carousel runs elsewhere, make a 10–20 s slideshow VIDEO (soft transition sound) for FB instead of an album.
2. **Video only, 3–4 a day, aimed at one club's fans:** "Spurs fans / Chelsea fans / United fans …" plain captions; hit-rate on the 145 videos is ~7% ≥35K, so quality over count (quantity 6–8 videos a day produced 0–6 follows on quiet days).
3. **Reduce the pundit re-upload share** (Goldbridge etc.): 5 of the top 10 winners but 3+ videos ≤9K and a "unoriginal" risk; pair with our own fanbase clips/edits (Alex's Grok/ChatGPT edits as slideshow/video).
4. **First 60 min matters:** post at the time of the drama; the Spurs/Tottenham hits were posted the evening of the game/story.
5. **Ad:** the follow yield this week (12.8/10K) is the best of any platform; judge cost per follow on Wed 09-30 as planned (Alex pastes spend).
6. Instrument: add `page_daily_follows_unique`, `page_daily_unfollows_unique`, `page_media_view` and top-3 videos of the day to the morning dashboard (all readable with the Page token).
