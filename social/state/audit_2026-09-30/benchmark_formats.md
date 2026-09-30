# BENCHMARK: FORMATS AND ENGAGEMENT (Instagram) — 2026-09-30, ~02:30 Oslo

Auditor angle: "formats and engagement". Read-only: nothing was posted, queued, edited or deleted. Written inside `audit_2026-09-30/` only.
Times: Oslo unless marked Z (UTC = Oslo - 2h). "Likes" are Instagram public like counts. "Ratio" = a post's likes divided by that account's own typical post (median of its mature posts posted 09-01 to 09-28 12:00Z), so account size drops out.

## 0. Bottom line (8 lines, every number is in the tables below)

1. **Format is not what separates us from the accounts we admire. Story fit, reach and (for reels) views per follower are.** Within the same account, carousel vs reel vs image medians go both ways (T6), and among the 8 posts that beat their own account's typical by 2x or more (T3) all 8 are carousels, but carousels are also 35 of the 41 posts in that comparison.
2. **We sit at about 3% of the peer median in raw likes and about 27% per follower.** Our carousels: median 337 likes (n=116, 09-01 to 09-28 = 10.3 likes per 1K followers). Ten peer accounts' carousel medians run 2.9K to 49.9K (median of medians 10.4K; 21.5 to 178 per 1K followers, median 38.8). Every one of the ten is at least 2.1x our per-follower level (lowest peer: @trollol_epl 21.5).
3. **Reels are our widest gap, and it is mostly reach.** Our reel median is 2,087 views (0.064x our followers, n=35) vs 0.36x to 0.74x for peers with 7+ reels (T7); our likes per 1K views is 27 vs 55 pooled for peers (n=159 reels). Reach explains about 5.6x to 11.6x of the gap, conversion about 2x.
4. **Slide count is a weak lever, not tonight's cause.** Peers split into a 10-13 slide style (six accounts) and a 3-5 slide style (@thatguysjokes, @simptv); beyond 10 there is no gradient (T5). Our 09-29 carousels had 5, 4 and 6 slides (previous 14 days: median 10; Alex's rule 09-24: 7-10), but our own carousels with 6 or fewer slides since 09-01 (n=10) have a median of 284 likes vs 341 for 7+ (n=106), a 17% gap, not the 3x-11x gap of tonight (0.36x, 0.09x, 0.20x of our median).
5. **The international break explains about 10 of our 23 points of dip, not all of it.** Peers' median likes in the break week (09-21 to 09-27) were 0.90x their pre-break level (11 accounts, range 0.50x to 2.30x). Ours were 0.77x overall, 0.69x carousels, 0.49x reels (T9). And we were already at 3% of peers before the break.
6. **The best thing we posted all day was a single image + one line** (09-29 12:52Z, 623 likes, 14.3K views, 397 shares = 19 likes per 1K followers, above @oddsbible's own single-image level of 13 per 1K). Images are the format where we are closest to peers per follower.
7. **We are not short of 2x posts, we are short of scale, and tonight was a miss.** 33 of our 116 carousels since 09-01 (28%) beat 2x our own carousel median vs 81 of 496 peer carousels (16%; 146 of 781 peer posts of any format = 19%); but a hit for us is now ~700-2,400 likes (our best carousel since 09-20 is 2,436; September peaked at 8-10K carousels and 17K images), for them 7K-98K (median 25K), and 0 of our 5 carousels in the last 30h reached 2x. On the City story our own carousels ran 0.2x to 4.6x our median (T11): the two 4x+ ones were 8-9 slides; tonight's was 6 slides at 00:27. Peers' first verdict-day posts are stamped 16:45Z (18:45); our log's "broke 19:30Z (21:30)" looks about 2h45 late (T11, evidence limits stated there).
8. **We post 9.4 IG posts per day; the 12 peers post 0.8 to 7.1 (median 2.7).** The two that post 6.5-7.1 per day are reel-and-carousel machines with a multi-million or 190K following. More posts per day have not bought us more likes per post (our per-post median fell from 222 to 140 over the four weeks to 09-27 while volume ran 5-15/day since 09-22).

## 1. Data, method, and what to distrust

Sources (all read-only):
- `competitor_sweep_2026-09-29.json`: 83 posts, 13 accounts, exported 2026-09-30T00:00:20Z. Used as given for T1-T3 and the verdict-day table.
- **Extra pull by me (same accounts, same Instagram Graph "Business Discovery" method as `social/insights.mjs`, GET only, token read from the Keychain inside a script and never printed):** the newest 73-125 posts per account (captions not fetched), 12 of 13 accounts (footy.rn is not a business account, "Invalid user id"), plus our own last 300 posts with `children` counts = **slide counts for our own carousels, which no existing file had**. 781 competitor posts (09-01 to 09-28 12:00Z, likes visible) feed T4-T9. First pass 00:03Z (02:03 Oslo), retries over the following ~20 min; saved in `benchmark_formats_data/`.
- Our own likes/views/reach: `quality_data/ig_threads_pull_17d_2026-09-30.json` (Graph API, 162 IG posts) joined by media id to the 300-post pull; `/private/tmp/tt/insights_0930.txt` (30h insights, agrees with it).
- Tools tried that returned nothing usable: Socialinsider (0 profiles tracked), Mysocial (only our own channel). vidIQ profile tools were not called (5 credits per call; Business Discovery answered). Firecrawl was used twice, only to time the verdict (section T11).

Things that would mislead you if you did not know them:
1. **Sweep likes of exactly 3 are hidden or placeholder counts, not real.** 7 rows (nonoffsideguy 1, hesaballer 1, thefootballfeeduk 2, footy.rn 3; e.g. 29 comments on "3 likes"). For the two of them the Graph pull also lists (nonoffsideguy, thefootballfeeduk) it returns null. Excluded everywhere.
2. **12 sweep rows are almost certainly pinned posts (dated 2024-12-31 to 2026-09-09, next to rows from the last 3 days).** They are survivor posts: hesaballer 803,882 (06-25), thefootballfeeduk 532,669 (2024-12-31), oddsbible 516,726 (06-19). Excluded from medians. The "5-row" accounts are mostly pinned posts: hesaballer, midnitefootball and anfieldcentral have only 2 recent rows each (one of hesaballer's is hidden-likes).
3. **Sweep counts for the freshest posts were captured well before the export stamp.** Graph values pulled 3-25 min after the stamp were 1.1x-7.5x higher for posts under 12h old (e.g. @thatguysjokes 21:07Z carousel 2,644 -> 19,754; simptv 20:10Z 3,526 -> 7,896) and agree within about 5% for posts older than ~35h. **Exception: @trollol_epl's sweep numbers run 15-28% above the Graph numbers on every one of 7 posts** (e.g. 2,730 vs 1,984), unexplained. Our own numbers are Graph numbers, so all "us vs them" comparisons use the Graph values.
4. **Hidden likes shrink some samples.** Visible likes / posts in window: hesaballer 41/89, thefootballfeeduk 14/25, anfieldcentral 79/91. If hiding is not random these medians are biased in an unknown direction.
5. **Age matters.** Posts under ~36h old are excluded from every median (likes keep growing for 1-2 days). Tonight's evening posts (all accounts, and ours) are immature; the 09-29 numbers for us are not a verdict on tonight, only a marker.
6. **One evening plus one month; per-account samples of 5-8 (sweep) or 14-118 (Graph) posts.** Slide-bucket cells of n<10 are called out. Account size only enters via Business Discovery follower counts (09-30 00:03Z).
7. Views: IG "views" for our posts (Insights) and `view_count` for theirs (Business Discovery) are the same family of counter but not guaranteed identical.

## 2. The sweep as given (83 posts)

Overall format mix: **62 carousels (75%), 12 reels (14%), 9 single images (11%)**. Carousels are 8 of 8 rows for itsfootybants, trollol_epl, ftblmemeshub, nonoffsideguy; 5 of 5 for simptv, hesaballer, footy.rn. Reels dominate only @midnitefootball (5 of 5); images only @anfieldcentral (5 of 5) and @oddsbible (4 of 5).

### T1. The sweep file (83 posts), per account

| account | followers (Business Discovery, 09-30) | rows | mix (car/reel/img) | slides (carousels) | flagged | likes med / Q3 / max (recent, likes visible) |
|---|---|---|---|---|---|---|
| @itsfootybants | 86,181 | 8 | 8/0/0 | 10-14 (med 11) | - | n=8: 7,318 / 11,194 / 16,115 |
| @trollol_epl | 135,527 | 8 | 8/0/0 | 10-20 (med 15.5) | 1 pinned/old (>10d) | n=7: 3,522 / 4,276 / 8,279 |
| @ftblmemeshub | 130,379 | 8 | 8/0/0 | 10-10 (med 10) | - | n=8: 4,724 / 6,132 / 12,843 |
| @rivalsbanter | 373,688 | 8 | 6/2/0 | 11-15 (med 12.5) | - | n=8: 16,704 / 21,837 / 48,140 |
| @nonoffsideguy | 50,467 | 8 | 8/0/0 | 10-15 (med 11.5) | 1 hidden-likes (=3) | n=7: 8,153 / 12,798 / 97,884 |
| @thatguysjokes | 2,166,545 | 8 | 4/4/0 | 2-4 (med 4) | - | n=8: 25,764 / 38,478 / 58,739 |
| @simptv | 229,675 | 5 | 5/0/0 | 3-7 (med 4) | - | n=5: 4,552 / 23,500 / 44,112 |
| @midnitefootball | 79,574 | 5 | 0/5/0 | - | 3 pinned/old (>10d) | n=2: 2,141 / 2,626 / 3,112 |
| @hesaballer | 193,076 | 5 | 5/0/0 | 5-20 (med 5) | 1 hidden-likes (=3); 3 pinned/old (>10d) | n=1: 22,926 / 22,926 / 22,926 |
| @oddsbible | 1,302,873 | 5 | 1/0/4 | 4-4 (med 4) | 1 pinned/old (>10d) | n=4: 17,590 / 23,354 / 25,728 |
| @thefootballfeeduk | 102,478 | 5 | 4/1/0 | 7-13 (med 10.5) | 2 hidden-likes (=3); 1 pinned/old (>10d) | n=2: 14,380 / 18,604 / 22,828 |
| @anfieldcentral | 74,300 | 5 | 0/0/5 | - | 3 pinned/old (>10d) | n=2: 295 / 412 / 530 |
| @footy.rn | n/a (not a business account) | 5 | 5/0/0 | 6-7 (med 6) | 3 hidden-likes (=3) | n=2: 5,618 / 5,890 / 6,163 |

### T2. Format, pooled

Recent posts with visible likes (n=64; pinned/old and hidden removed), raw and pooled across accounts of very different size, so read the direction, not the levels:

| format | n | median likes | Q3 | max |
|---|---|---|---|---|
| carousel | 51 | 6,891 | 14,531 | 97,884 |
| reel | 8 | 13,558 | 23,843 | 58,739 (thatguysjokes) |
| single image | 5 | 12,618 | 22,563 | 25,728 |
| all | 64 | 7,606 | 18,444 | 97,884 |

Pooled by format this mixes @thatguysjokes' 2.2M followers with @anfieldcentral's 74K, so it says nothing about which format wins (see T6 for the within-account read). Slide buckets in the sweep (carousels, recent, likes visible): 2-6 slides n=10 median 13,860 (mostly thatguysjokes and simptv, both large); 7-9 n=2 (too few); 10 n=16 median 5,725; 11-14 n=18 median 12,303; 15+ n=5 median 4,060. Again account mix, not slide effect.

### T3. Hits: top 10 by likes, and who beat their own typical by 2x+

Top 10 recent posts (Graph likes where matched; ratio = likes / account typical):

| # | account | posted (Oslo) | format | slides | likes (sweep -> Graph, ~00:15Z) | ratio | caption start |
|---|---|---|---|---|---|---|---|
| 1 | @nonoffsideguy | 09-24 07:15 | carousel | 11 | 97,884 -> 98,055 | 11.1x | Kylian Mbappé continues to prove why he is one of the most exciting... |
| 2 | @thatguysjokes | 09-29 19:29 | reel | - | 58,739 -> 73,702 (1.22M plays) | 1.5x | Even Klopp didn't press Man City this hard |
| 3 | @rivalsbanter | 09-26 14:02 | carousel | 15 | 48,140 -> 48,316 | 4.4x | Part 2 / According to @davidornstein, Manchester City have been found guilty... |
| 4 | @thatguysjokes | 09-29 19:09 | carousel | 4 | 43,071 -> 48,055 | 1.0x | They're finished, that whole Premier League statement is mental |
| 5 | @thatguysjokes | 09-29 19:51 | reel | - | 36,947 -> 44,998 | 0.9x | I need to see arrests made on top of the points deduction |
| 6 | @simptv | 09-28 10:57 | carousel | 4 | 44,112 -> 44,519 | 4.4x | They're both tryna make moves |
| 7 | @thatguysjokes | 09-29 21:23 | carousel | 4 | 31,237 -> 41,353 | 0.8x | I'm here to tell you right now, we don't care |
| 8 | @rivalsbanter | 09-26 09:23 | carousel | 13 | 26,590 -> 26,694 | 2.4x | Manchester City have been found guilty on almost all of the charges |
| 9 | @oddsbible | 09-28 13:48 | single image | - | 25,728 -> 25,975 | 1.0x | And also played for Barcelona... |
| 10 | @thatguysjokes | 09-29 20:35 | reel | - | 19,475 -> 23,964 | 0.5x | You're going prison and you're getting named and shamed |

Read: 6 carousels, 3 reels, 1 image. **At least 5 of the 10 are Man City story posts by caption** (rows 2, 3, 4, 5, 8); rows 7 and 10 are same-night @thatguysjokes posts whose topic the 100-character caption does not show. Carousel slide counts in the top 10: 4, 4, 4 (thatguysjokes x2, simptv) and 11, 13, 15 (nonoffsideguy, rivalsbanter x2); **no top-10 carousel has 5 to 10 slides**. The raw top 10 is dominated by @thatguysjokes (2.2M followers), so the ratio column is the fair one; its 09-29 evening posts are only 5-7h old and still climbing.

**Hits = at least 2x the account's own typical, posted 12h+ before the pull: 8 of 41 posts (20%). All 8 are carousels (8 of 35 carousels = 23%; 0 of 3 reels, 0 of 3 images).** Slides: 4, 4, 10, 11, 11, 13, 15, 20.

| account | posted (Oslo) | slides | Graph likes | ratio | what it was |
|---|---|---|---|---|---|
| @nonoffsideguy | 09-24 07:15 | 11 | 98,055 | 11.1x | one-player hero story (Mbappé) |
| @simptv | 09-28 10:57 | 4 | 44,519 | 4.4x | "They're both tryna make moves", caption opens "Earth-shattering news for English football" (topic not visible in 100 chars) |
| @rivalsbanter | 09-26 14:02 | 15 | 48,316 | 4.4x | City verdict "Part 2" (Ornstein) |
| @hesaballer | 09-28 17:54 | 10 | 23,872 | 4.1x | Yamal overtakes Kane, Ballon d'Or favourite |
| @trollol_epl | 09-22 11:23 | 20 | 7,430 | 2.5x | stat list (numbers only touchable in the big leagues) |
| @rivalsbanter | 09-26 09:23 | 13 | 26,694 | 2.4x | City verdict, first post |
| @simptv | 09-28 15:02 | 4 | 23,894 | 2.4x | Messi in tears (meme dump) |
| @thefootballfeeduk | 09-25 18:54 | 11 | 22,837 | 2.1x | City guilty on 114 of 115 |

What the hits have in common (8 posts, so a description, not a rule): each is **one topic told through screenshots in a carousel with a caption that carries the story**; 3 of 8 are the City verdict by caption (a 4th, simptv's 44.5K post, opens with the same "Earth-shattering news for English football" line simptv used on its City post that evening, so it is probably City too, unverified), 2 are single-player hero stories (Mbappé, Yamal), 1 is a stat list, 1 is a Messi meme dump; none is a clip plate or a generic "timeline" post. **@rivalsbanter ran the City story as a numbered series and every part beat its typical: Part 1 2.4x, Part 2 4.4x, Part 3 1.9x, Part 4 1.5x (12-15 slides each)**, and Part 1 went out about 17h after our own carousel on the first Ornstein report (09-25 14:25Z), so it did not need to be first. The 4-slide hits (simptv) and the 10-20 slide hits both exist; the 5-9 slide zone produced none of the 8 (n too small to say it is bad).


## 3. The bigger sample: 781 posts, 12 accounts, 09-01 to 09-28 (Graph pull)

The sweep is one evening and 5-8 posts per account. This pull covers up to 118 posts per account, so medians mean something.

### T4. Extended sample: last posts per account from Business Discovery (posted 09-01 to 09-28 12:00Z, likes visible)

| account | followers | posts/day (09-16..29) | n | mix car/reel/img | median slides | median likes | Q3 | max | likes per 1K followers (median) |
|---|---|---|---|---|---|---|---|---|---|
| @itsfootybants | 86,181 | 2.5 | 72 | 72/0/0 | 13.0 | 15,366 | 23,400 | 62,361 | 178.3 |
| @trollol_epl | 135,527 | 1.1 | 36 | 36/0/0 | 13.0 | 2,914 | 3,865 | 102,477 | 21.5 |
| @ftblmemeshub | 130,379 | 4.6 | 118 | 118/0/0 | 10.0 | 8,924 | 14,148 | 41,956 | 68.4 |
| @rivalsbanter | 373,688 | 2.1 | 65 | 38/27/0 | 11.0 | 10,919 | 14,115 | 82,289 | 29.2 |
| @nonoffsideguy | 50,467 | 1.2 | 36 | 36/0/0 | 10.5 | 8,848 | 30,231 | 168,204 | 175.3 |
| @thatguysjokes | 2,166,545 | 7.1 | 86 | 29/57/0 | 3 | 50,320 | 64,579 | 223,103 | 23.2 |
| @simptv | 229,675 | 2.6 | 80 | 78/2/0 | 5.0 | 10,014 | 17,086 | 58,309 | 43.6 |
| @midnitefootball | 79,574 | 2.8 | 65 | 1/64/0 | 5 | 2,296 | 6,729 | 51,273 | 28.9 |
| @hesaballer | 193,076 | 6.5 | 41 | 37/4/0 | 8 | 5,777 | 10,160 | 48,274 | 29.9 |
| @oddsbible | 1,302,873 | 2.9 | 89 | 38/7/44 | 6.0 | 25,298 | 35,776 | 174,852 | 19.4 |
| @thefootballfeeduk | 102,478 | 0.8 | 14 | 14/0/0 | 10.0 | 10,732 | 21,566 | 62,635 | 104.7 |
| @anfieldcentral | 74,300 | 5.3 | 79 | 3/0/76 | 6 | 262 | 665 | 4,892 | 3.5 |

Pooled format mix of all 553 peer posts (09-16 to 09-29, T4 accounts): **54% carousel, 28% reel, 18% single image**. Ours in the same 14 days (132 posts): **42% carousel, 27% image, 30% reel**. So our mix is not unusual; our volume is (T10).

Two style clusters among the carousel accounts:
- **Long text-screenshot stories, 10-13 slides, 0.8-4.6 posts a day:** itsfootybants (median 13 slides, 178 likes per 1K followers), trollol_epl (13, 21.5), ftblmemeshub (10 slides in 102 of 118 posts, at fixed daily slots, 68.4), nonoffsideguy (10.5, 175.3), thefootballfeeduk (10, 104.7, only 0.8 posts/day), rivalsbanter (11, 29.2).
- **Short carousels plus reels, 3-8 slides, high volume, huge or media-brand followings:** thatguysjokes (median 3 slides, 7.1 posts/day, 2.17M followers), simptv (5 slides), hesaballer (8 slides, 6.5/day), oddsbible (6, plus 44 single images).
The fan-page cluster gets more likes per follower than the media-brand cluster (median of its six accounts 49 per 1K vs 27 for the four; ranges overlap, 21-178 vs 19-44), which tracks follower base size more than slide count (a bigger base holds more non-engaging followers). Treat the per-1K column as a rank order, not a target.

### T5. Slide count (carousels only)

Pooled, each post divided by its own account's carousel median (accounts with 10+ carousels; n=496 posts):

| slides | n | accounts contributing | median ratio | Q1-Q3 | share at 2x+ |
|---|---|---|---|---|---|
| 2-4 | 76 | 5 | 1.00 | 0.66-1.26 | 8% |
| 5-6 | 44 | 5 | 0.83 | 0.51-1.27 | 14% |
| 7-9 | 54 | 9 | 0.89 | 0.67-1.26 | 9% |
| 10 | 149 | 8 | 1.11 | 0.70-1.79 | 23% |
| 11-13 | 111 | 9 | 1.00 | 0.73-1.60 | 16% |
| 14+ | 62 | 8 | 1.06 | 0.80-1.70 | 18% |

This pooled view is flat within about +/-15% and, because each account mostly contributes to its own modal bucket, it understates any real slide effect. The cleaner test is accounts that mix short and long carousels:

| account | <=6 slides: n, median likes | >=10 slides: n, median likes | short / long |
|---|---|---|---|
| @simptv | 57, 9,968 | 7, 17,917 | 0.56x |
| @hesaballer | 12, 3,670 | 12, 9,540 | 0.38x |
| @oddsbible | 21, 31,171 | 11, 41,479 | 0.75x |

Same direction in 3 of 3 (long carousels get 1.3x-2.6x the likes), but long ones may simply be the bigger stories, and each long cell is n=7-12. **Among accounts that always use 10+ slides, slide count does nothing:** Spearman rho between slides and likes: itsfootybants -0.04 (n=72, range 11-20), ftblmemeshub -0.05 (118), trollol_epl +0.13 (36), nonoffsideguy -0.43 (36), rivalsbanter +0.05 (38), thatguysjokes +0.06 (29, range 2-9); the mixed accounts hesaballer +0.48 (37), oddsbible +0.34 (38), simptv +0.16 (78). Read: **going from 6 to 10 slides probably helps a little; going from 10 to 15+ does not.**

Ours (our own carousels, slide counts from the Graph `children` field):
- 09-29 carousels: 11:12Z 5 slides, 120 likes, 7.2K views; 20:47Z 4 slides, 29 likes, 1.5K views; 22:27Z 6 slides, 69 likes, 1.2K views. Ratios to our carousel median (337): 0.36x, 0.09x, 0.20x.
- Previous 14 days (09-16 to 09-29): 56 carousels, median 10 slides, 30 of them exactly 10; only 4 had fewer than 7 slides: the three on 09-29 (4, 5, 6) and one 5-slide on 09-19.
- Since 09-01, likes by slide bucket (mature): <=6 slides n=10, median 284; 7-9 n=37, 388; 10 n=62, 325; 11+ n=7, 211. Since 09-13 (views exist): 2-6 slides n=5 median 105 likes and 3.6K views; 7-9 n=23, 388 likes and 10.8K views; 10 n=35, 235 and 6.8K. None of those 5 short ones reached our top-quartile likes (709); 7 of 23 seven-to-nine-slide and 10 of 38 ten-plus ones did (small cells).

### T6. Format within the same account (median likes, n in brackets; 09-01 to 09-28)

| account | carousel | reel | single image | read |
|---|---|---|---|---|
| @rivalsbanter | 12,658 (38) | 6,808 (27) | - | reel = 0.54x carousel |
| @thatguysjokes | 49,850 (29) | 50,616 (57) | - | tie (1.02x) |
| @oddsbible | 33,954 (38) | 29,463 (7) | 17,101 (44) | image = 0.50x, reel = 0.87x carousel |
| @hesaballer | 5,777 (37) | 11,465 (4) | - | reel = 2.0x but n=4 |
| @simptv | 10,014 (78) | 23,656 (2) | - | n=2, ignore |
| @anfieldcentral | 1,945 (3) | - | 256 (76) | all images, tiny |
| @midnitefootball | 2,002 (1) | 2,328 (64) | - | reel account |

**No consistent format winner inside an account**: carousel beats reel in 2 (rivalsbanter, oddsbible), ties in 1 (thatguysjokes), loses on n=4 in 1 (hesaballer). The only consistent within-account gap is single image below carousel at @oddsbible (0.50x) and, by level, at @anfieldcentral (3.5 likes per 1K followers, the lowest of the 12).

### T7. Reels: the part where our gap is largest (09-01 to 09-28 mature; views visible)

| account | n | median views | views / followers | median likes | likes per 1K views (median) |
|---|---|---|---|---|---|
| @thatguysjokes | 57 | 771,071 | 0.36x | 50,616 | 62.4 |
| @rivalsbanter | 27 | 149,138 | 0.40x | 6,808 | 48.3 |
| @midnitefootball | 64 | 44,693 | 0.56x | 2,328 | 51.6 |
| @oddsbible | 7 | 966,245 | 0.74x | 29,463 | 21.0 |
| @hesaballer | 4 | 288,520 | 1.49x | 11,465 | 21.7 |
| **peers pooled** | 159 | | | | **55.2** |
| **Shithousery HQ** (09-13 to 09-28) | 35 | **2,087** | **0.064x** | 54 | **27.3** |

Our best reel in the window reached 23,347 views (0.72x our followers); the peers' medians are 0.36x-0.74x. Split of the gap (inference from the two ratios): reach 5.6x-11.6x, conversion about 2x.

## 4. Where we sit, by format

### T8. Ours vs peers

| | Shithousery HQ (32,562 followers) | peers (12 accounts) | ours as share of peers |
|---|---|---|---|
| Carousel median likes | **337** (n=116, 09-01 to 09-28) | 2,914 to 49,850 (10 accounts); median of medians 10,373 | 3% of the median; 12% of the lowest (trollol_epl 2,914) |
| Carousel likes per 1K followers | **10.3** | 21.5 to 178.3; median 38.8 | 27% of the median; 48% of the lowest |
| Single-image median likes | **152** (n=104) = 4.7 per 1K | oddsbible 17,101 (13.1 per 1K, n=44); anfieldcentral 256 (3.4 per 1K, n=76) | between the two per follower |
| Reel median likes | **69** (n=47) = 2.1 per 1K | 2,328 to 50,616 (18.2 to 29.3 per 1K, n>=7); hesaballer 11,465 (59.4, n=4) | 7-12% of peers per follower |
| Reel median views | **2,087** (n=35) = 0.064x followers | 0.36x-0.74x followers | 9%-18% |
| Our best image on 09-29 | image 623 likes (09-29 12:52Z, 14.3K views, 397 shares) = 19 per 1K | oddsbible image median 13 per 1K | above the peer median rate, one post |
| Last 30h (posted since 09-28 20:00Z, immature) | carousels n=5: 29-261 likes (median 104); reels n=7: 5-39 (median 13); images n=2: 16 and 623 | | |

Where we did well against ourselves: our 8 biggest carousels since 09-13 had 10,271 (09-14), 8,359 (09-18), 2,990 (09-19), 2,436 and 2,211 (09-24, Xavi v Klopp and Tekkers Foot), 2,029 (09-18), 1,561 (09-25) and 1,350 (09-28) likes = 4.0x to 30.5x our carousel median, on 9, 10, 10, 9, 7, 10, 8 and 9 slides. Our biggest single posts of the month were images on 09-14 and 09-03 (16.9K and 16.6K likes). Hit rate in ratio terms: 33 of 116 carousels since 09-01 reached 2x our own median (28%) and 16 reached 4x (14%); 0 of the 5 in the last 30h did.

### T9. Was it the international break? Median likes per week, mature posts, n in brackets

| account | wk 08-31 | wk 09-07 | wk 09-14 | wk 09-21 (break) | break / pre-break |
|---|---|---|---|---|---|
| @itsfootybants | 16,941 (21) | 16,864 (19) | 11,668 (21) | 14,454 (15) | 0.89x |
| @trollol_epl | 3,299 (11) | 2,676 (11) | 3,058 (8) | 2,896 (8) | 0.90x |
| @ftblmemeshub | 10,342 (16) | 8,645 (37) | 7,762 (30) | 9,906 (34) | 1.14x |
| @rivalsbanter | 10,026 (18) | 11,044 (18) | 10,672 (16) | 12,878 (14) | 1.23x |
| @nonoffsideguy | 15,288 (12) | 6,480 (9) | 19,434 (8) | 5,607 (8) | 0.50x |
| @thatguysjokes | - | - | 53,048 (40) | 45,198 (45) | 0.86x |
| @simptv | 13,178 (21) | 8,334 (25) | 9,977 (20) | 12,586 (17) | 1.27x |
| @midnitefootball | 1,892 (9) | 2,359 (17) | 1,521 (24) | 4,468 (16) | 2.30x |
| @hesaballer | - | - | 7,229 (21) | 4,800 (20) | 0.66x |
| @oddsbible | 26,279 (23) | 23,173 (23) | 26,786 (27) | 13,436 (17) | 0.51x |
| @anfieldcentral | - | 433 (13) | 223 (33) | 330 (31) | 1.41x |
| **median of the 11 ratios** | | | | | **0.90x** |
| **Shithousery HQ, all posts** | 222 (79) | 170 (73) | 173 (64) | 140 (64) | **0.77x** (n 216/66) |
| Shithousery HQ, carousels | 331 (34) | 359 (31) | 460 (24) | 208 (32) | 0.69x (n 89/34) |
| Shithousery HQ, reels | 94 (9) | 130 (6) | 84 (14) | 43 (19) | 0.49x (n 29/19) |
| Shithousery HQ, images | 186 (36) | 113 (36) | 177 (26) | 191 (13) | 1.26x (n 98/13) |

("Break / pre-break" = median of mature posts 09-21 to 09-27 divided by median of 08-31 to 09-20; only 11 peers have enough posts. The week of 09-28 has almost no mature posts.) **Peers as a group fell about 10% (ten of eleven between 0.50x and 1.41x; midnitefootball rose to 2.30x); we fell 23% overall, 31% on carousels, 51% on reels.** If peers are the yardstick, the break is worth about 10 of our 23 points; the rest is ours, and it sits in reels and carousels (images did not fall). This is medians of small weekly cells, so 0.85x-0.95x is not distinguishable from noise.

### T10. Cadence and clock (09-16 to 09-29)

| | posts / day | share posted 00:00-06:00 Oslo | peers' likes ratio by post hour block (Oslo) |
|---|---|---|---|
| Shithousery HQ | **9.4** (132 posts: 56 carousels, 36 images, 40 reels) | 6% | - |
| 12 peers | 0.8 to 7.1, median 2.7 (thatguysjokes 7.1, hesaballer 6.5, anfieldcentral 5.3, ftblmemeshub 4.6) | 1% | 00-06: 1.05 (n=6); 06-12: 1.08 (157); 12-18: 0.94 (330); 18-24: 1.00 (288) |

For the peers, the hour a post goes up hardly moves its likes ratio (0.94-1.08). Likes accumulate over days, so this does not say the hour is irrelevant for reach; it says the fan pages get their likes from the story, not the slot.

### T11. Verdict day: what competitors posted, and when (09-29, times as Oslo/Z)

| account | posted | format | slides | likes at export -> Graph ~00:15Z | ratio to typical (Graph) |
|---|---|---|---|---|---|
| @thatguysjokes | 17:15 / 15:15Z | carousel | 2 | 20,292 -> 21,244 | 0.4x ("just a little transfer ban", pre-statement guess) |
| **@anfieldcentral** | **18:45 / 16:45Z** | image | - | 530 -> 562 | 2.1x ("BREAKING: An independent commission has found City guilty...") |
| @thatguysjokes | 19:09 / 17:09Z | carousel | 4 | 43,071 -> 48,055 | 1.0x ("that whole Premier League statement is mental") |
| @thatguysjokes | 19:29 / 17:29Z | reel | - | 58,739 -> 73,702 | 1.5x |
| @thatguysjokes | 19:51 / 17:51Z | reel | - | 36,947 -> 44,998 | 0.9x |
| @rivalsbanter "Part 4" | 20:04 / 18:04Z | carousel | 13 | 13,580 -> 16,872 | 1.5x |
| @footy.rn | 20:37 / 18:37Z | carousel | 7 | 6,163 (Graph n/a) | 1.1x (vs its own sweep median) |
| @midnitefootball | 21:12 / 19:12Z | reel | - | 1,170 -> 2,921 (56K plays) | 1.3x |
| Shithousery HQ Threads | 21:00 / 19:00Z | text | - | 28 likes, 2.5K views | - |
| **Shithousery HQ Instagram** | **00:27 / 22:27Z** | carousel | 6 | 66-69 likes, 1.2K views, 494 reach (only 2h old) | **0.2x** of our carousel median (a 3x rise would still be 0.6x) |

Timing evidence, and its limit. The brief and our posts_log both say the verdict "broke 21:30 Oslo (19:30Z)". Three signals say the Premier League statement was out about 2h45 earlier: (1) the sweep's earliest verdict-day post is 16:45Z (anfieldcentral; media-brand accounts had the "statement" carousel by 17:09Z); (2) a news search run at about 00:30Z returned the ESPN, Premier League and Goal items as "8 hours ago" (about 16:30Z, give or take the rounding of "hours ago"); (3) weakest: the Independent's article image sits in a 2026/09/29/17 folder (timezone of the folder unknown). I could not read a timestamp off premierleague.com itself, and "the verdict" was already reported by The Athletic on Fri 09-25, so treat the exact minute as unverified. If it holds, our IG carousel was 5h42m behind the first competitor post and about 3h behind the 19:30Z the log assumed. This belongs to the timing auditor; I flag it because it changes what "on time" meant tonight.

Our own City carousels, same format, ratio to our carousel median (337):

| posted | slides | likes | views | ratio |
|---|---|---|---|---|
| 09-25 14:25Z | 8 | 1,561 | 36,246 | 4.6x |
| 09-25 14:39Z | 7 | 802 | 17,129 | 2.4x |
| 09-26 12:10Z | 10 | 206 | 5,509 | 0.6x |
| 09-26 13:15Z | 10 | 142 | 4,342 | 0.4x |
| 09-27 12:15Z | 10 | 210 | 5,509 | 0.6x |
| 09-28 07:40Z | 9 | 1,350 | 25,155 | 4.0x |
| 09-29 22:27Z | 6 | 69 | 1,204 | 0.2x |

Same story, 0.2x to 4.6x. The three 2x+ ones were 7-9 slides; the 4.6x one went up with the first Ornstein report itself and the 4.0x one on Monday morning, day 4 (I could not identify a news beat for it). But three 10-slide City carousels on 09-26 and 09-27 got 0.4x-0.6x, so slide count is not the whole thing. Counter-example on speed: @rivalsbanter's Part 1 went up 09-26 09:23 Oslo, about 17h after our own 09-25 14:25Z carousel on the first Ornstein report, and still made 2.4x with 13 slides; Parts 2, 3 and 4 followed on 09-26, 09-27 and 09-29 and made 4.4x, 1.9x and 1.5x. **What the winning City posts share is a story told in depth (7-15 slides), a numbered or "what happens next" framing, and a real news beat; what tonight's lacked is depth (6), a beat (5.7h late) and the slot (00:27).**

## 5. What this supports doing (each tied to the number it rests on)

1. **Make 9-10 slides the hard floor for a news carousel, and gate it at build time.** Rests on: our <=6-slide carousels 284 vs 341 median likes (T5), peers' 3-of-3 mixed accounts 1.3x-2.6x, and Alex's own 7-10 rule (09-24). Three of tonight's carousels broke it and nothing stopped them. `social/preflight.mjs` runs before building; a grep of it finds checks for repeat slides and slide-listing captions but no minimum slide count. Confidence: medium (small cells), and note it is a floor, not a fix: 10-slide City carousels still got 0.4x-0.6x.
2. **Run big stories as numbered parts (Part 1 now, Part 2 when there is a new beat).** Rests on: @rivalsbanter Parts 1-4 = 2.4x, 4.4x, 1.9x, 1.5x of its typical, at 12-15 slides each. Confidence: medium-low (one account, one story), but it is the only repeatable format device in the hit list. We already have "Daily Number #N"; this is the same trick on carousels.
3. **Rate a post by ratio to our own median (2x = hit), read at 12h, and stop reading raw likes against the peers.** Rests on: our 2x rate (28% of carousels) is at or above the peers' (16% of carousels, 19% of all posts; per account 3%-43%), so the gap to them is the scale of a hit (ours ~700-2,400 likes since 09-20, theirs 7K-98K with a median of 25K), not how often we hit; raw likes against peers (3% of their median) hides that, and a ratio shows tonight's 0.2x at once. A one-column ratio in the morning dashboard is enough. Use Graph numbers for us-vs-them (the sweep's trollol_epl numbers are 15-28% off).
4. **Keep the single image + one line as the lowest-cost daily post.** Rests on: 623 likes / 14.3K views / 397 shares on 09-29 12:52Z, 19 per 1K followers vs oddsbible's 13. It is n=1 as a rate and our image median is 152, so this is "cheap to keep testing", not "proven".
5. **Reels are the format with the biggest fixable gap and the least payoff per post: 0.064x followers in views vs 0.36-0.74x.** Rests on T7 and T9 (reels fell to 0.49x in the break week). 40 reels in 14 days at a median 43-69 likes is the pipeline's largest volume for its smallest return. Inference, not proven: cut reel volume until a reel format clears 0.3x followers in views on 5 posts. (Other angles cover the reel content itself.)
6. **Post fewer, and put the saved effort into the depth of each one.** Rests on: 9.4 posts/day vs the peers' median 2.7, and 4 carousels/day vs a peer median of 1.2; our per-post median fell from 222 to 140 while volume stayed at 5-15/day (T9, T10). Inference: volume may dilute, but this data cannot prove causation (peers with 6.5-7.1/day exist).
7. **Do not chase 15+ slides.** Rests on: rho about 0 in the accounts that use 10-20 slides (T5).

## 6. What this does NOT show

- Slide-level content: I cannot tell from counts whether a 5-slide carousel was dull; that is the quality auditor's angle (its 09-30 quality.md).
- Causation for hits. Eight hits is a description.
- Peer impressions or reach for carousels/images (only likes, comments, and `view_count` for reels exist), so "we get few likes" is not the same as "we get few views" for feed posts. Our carousel median views 9,314 (09-13+) are the only reach number.
- Captions beyond 100 characters (the extended pull hit Meta's app request limit, see below), so caption length and the "long caption" effect at 4-slide accounts are untested.
- Hidden-like accounts (hesaballer 58 of 100, thefootballfeeduk 53 of 125, nonoffsideguy 11 of 125, anfieldcentral 13 of 100) may be biased.
- footy.rn: no follower count, 3 of 5 sweep likes hidden; excluded from every per-follower figure.

## 7. Side effect to know about

My Graph pulls (2 passes over 12 accounts plus our 300 posts, then a third pass for captions) hit **"(#4) Application request limit reached"** on the third pass; I killed that run and made no further Graph calls. Anything else that uses the same Meta app token (social/insights.mjs, the Metricool/Insights morning pull, any Business Discovery sweep) may return rate-limit errors from about 02:10 Oslo for a while (Meta app-level limits usually use a rolling one-hour window; that is my expectation, not something I verified); that is a wait, not a broken token. Nothing was written to Meta, Postiz, Metricool or any scheduler.

## 8. Files

- `benchmark_formats_data/graph_pull_competitors_and_own_2026-09-30.json`: all Graph rows (12 accounts, up to 125 posts each with type, slides, likes, comments, views; our 300 posts with slide counts). No tokens inside.
- `benchmark_formats_data/own_ig_300_posts_with_slides_2026-09-30.json`: our posts joined to views/reach/follows.
- `benchmark_formats_data/*.py, bd*.mjs`: the scripts behind every table (they expect the two JSONs renamed `bd_out.json` and `own_ig_slides.json` in the working folder). `bd.mjs`/`bd2.mjs` are GET-only Graph reads.
