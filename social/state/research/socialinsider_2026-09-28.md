# Socialinsider benchmark — 2026-09-28 (read-only run, scheduled task)

## ⛔ Status: Socialinsider could NOT produce a benchmark on the account as it stands
- `socialinsider_list_profiles` → `[]`. The account has **no project and no tracked profiles**.
- All analytics calls (`get_posts_summary`, `get_top_posts`, `get_profile_data`) need a **project + tracked profile**. Test call on @itsfootybants → `invalid_project`.
- Tracking needs **write** calls: `create_project_with_brands` or `add_profile`. Each added profile **counts against the subscription's profile limit**, and the server requires explicit confirmation. This task was read-only, so **nothing was added**.
- What works read-only: `profile_search` resolves handles. Confirmed: `instagram.com/itsfootybants` ("Football Memes Daily 🔌"), `instagram.com/shithouseryhq` ("Shithousery HQ | Football Memes"), `instagram.com/thatguysjokes`. Search returns **no metrics**.

**Alex must decide:** how many profiles the plan allows, and approve one `create_project_with_brands` call. Proposed call below; it needs ~7–9 slots.

```
project "SHQ benchmark"
  brand "Us":        instagram.com/shithouseryhq, x.com/ShithouseryHQ, tiktok.com/@shithouseryhq, facebook page, youtube channel (as *_own if connecting)
  brand "Reference": instagram.com/thatguysjokes, instagram.com/rivalsbanter, instagram.com/itsfootybants, instagram.com/ftblmemeshub, instagram.com/midnitefootball
```
If the plan only allows ~5: our IG + thatguysjokes + rivalsbanter + roastedballers (see below) + ftblmemeshub. Profiles added now only have history from the add date onward (up to 12 months back is requested via `history_refresh_months`; competitor history depth depends on the plan).

## Fallback benchmark (vidIQ, read-only, 20 credits spent → 65 left, resets 15 Oct)
vidIQ `ig_profile_reels` (the latest 12 reels per account) + one outlier search. Our own IG numbers come from the Mysocial free tier, 30 days.

| Account | Reels last ~10 days | Views/reel (range · median) | Like rate (likes/plays) | Format | Caption shape |
|---|---|---|---|---|---|
| **@thatguysjokes** | 12 in 09-25→09-27 (**~4/day**, 7 on 09-25 alone) | 405K–2.64M · **~620K** | **~8.5%** | 6–31s reel, white top bar with 1-line caption + film/TV clip (Suits, Zootopia, apes, Peter Kay) | Line on the plate. Caption = 2–8 words + a *long filler paragraph* ("Instagram flags unoriginal…") |
| **@rivalsbanter** | 12 in 09-15→09-28 (**~1/day**) | 64K–291K · **~160K** | ~6% | Tweet-screenshot-on-clip reels, 5–55s | 1–2 words ("Versatile", "Disrespectful", "😭😭😭") |
| **@itsfootybants** | last reel 07-19 (reels tab dormant; 2023 back catalogue) | 563K–1.33M in July | 0.2–2% | Tweet-on-clip, 1–5s | 4–6 words |
| **@shithouseryhq (us)** IG 30d | reels: 11K best in last 7d | avg **10.4K** views/post; 30d best **363K** (image, 09-14) | ER 5.75%, **follow rate 0.01%** | Carousels dominate our top 20 (12/20); images 7/20; reels 0/20 | Long descriptive captions |
| @ftblmemeshub, @midnitefootball, @sccrmemes, @hesaballer | not pulled (credit budget) | — | — | — | — |

**Our top 5, last 7 days (IG, Mysocial):** carousel Xavi v Klopp 87.8K (1,622 shares) · carousel Tekkers Foot/Ronaldo 980 64.7K · image "Spurs fans, the maths is on your side" 48.3K (1,041 shares) · carousel 16-yo Chelsea fan 40.6K · carousel Zidane's France 39.5K. **Best reel in 7d: 11K** ("He's South Korean. Wait till he starts talking").

**Outlier search (IG + TikTok, "fanbase-mocking meme", since 09-18):** 8 of the 16 outliers were about **City's 114/115 verdict** (09-25), 3 were **Brighton 3-0 Arsenal**, 1 was Spurs bottom. **@roastedballers** (18K followers) got **1.9M views at 101× their median** with a "Sing if you become PL champion when City get stripped" collage reel on Dua Lipa audio. Small accounts (441–5.4K followers) hit 1.3–1.5M on the same story. The story, not the account size, carried it.

Best posting hours: **not measurable** without Socialinsider tracking (vidIQ only gives dates). What the dates do show: thatguysjokes posted **7 reels within ~24h of the 09-25 Ornstein City story**.

## 5 changes for us (each tied to a number)
1. **Put a reel on every big story within 24h, several if it's big.** thatguysjokes posted 7 City reels in ~24h after 09-25; the median was ~620K views and the top one 2.64M. We posted 3 City *carousels* (0 follows) and our best reel in 7 days is 11K. Target: when a story is trending now, 3 stacked reels (plate line + film/TV clip) in the first 24h, not 1 carousel.
2. **Lift the IG "City vetoed" rule for REELS only.** It was set on 3 carousels / 0 follows. City reels on other accounts did 405K–2.64M from 09-25 to 09-27, including 1.9M on an 18K account. The veto measured the format, not the topic. Keep the veto for carousels.
3. **Plate line = "[Fanbase/Person] when [consequence]", with a film/TV clip, not match footage.** 12/12 of the thatguysjokes reels sampled use a film/TV/comedy clip under a one-line plate (like-rate ~8.5% vs our ER 5.75%). This also sidesteps the "unoriginal" flag and TikTok's ineligible-repost rule (feedback_tiktok_ineligible_reposts).
4. **Caption: 2–8 word line + ~60–80 words of RELEVANT context. Never boilerplate.** thatguysjokes pads every caption because "Instagram flags unoriginal". Our memory already says long captions must be relevant (feedback_long_captions_must_be_relevant_not_boilerplate), so write the paragraph about the story. Cost: ~2 min per post.
5. **Stop judging IG on carousel views. Measure follows per 10K views.** Our 30d follow rate is **0.01%** (32,577 followers, 8.25M views, ≈0 net growth): big carousels (363K, 230K) bring views but no follows. Add a "follows/10K views" column to the scoreboard. Carousels that stay under 1/10K after 72h get cut to 1/day, and the slots go to reels (this is the 10-01 IG surgery read).

## HOW THE PM SHOULD USE SOCIALINSIDER + MYSOCIAL
- **Socialinsider (after Alex approves the project; blocked until then):**
  - Daily, 1 call per account: `get_top_posts` (last_7_days, metric=`video_views` for IG/TikTok, `engagement` for X) on 2–3 reference accounts. It feeds the carousel sweep and the reel-idea list.
  - Weekly (Mon): `get_posts_summary` (last_30_days) for us plus each reference account → posts/day by type and ER, then update the table above. `get_profile_data` (last_30_days) → follower growth.
  - Always `get_date_context` first. Read calls are free. Only `add_profile`/`create_*` use plan slots, and every write needs Alex's explicit OK.
- **Mysocial (Free plan; only our own IG is readable):**
  - Daily: `search_content rankBy=top since=<7d ago> include=[metrics]` → our real top posts with shares and reach (better than the Postiz views). Weekly: `rankBy=share_rate` → which of our *small* posts converted (the Liverpool fullbacks image: 29.7% share rate).
  - `get_channel_analytics days=28` from ~10-05. History started 09-27, so growth numbers only mean something after ~7 days.
  - Everything else (universe, trends, creator search, TikTok/YT search, hit DNA) is **locked on Free**. Upgrade = "Creator Memory" $49/mo.
- **Until either is unlocked:** vidIQ `ig_profile_reels` (5 cr) on thatguysjokes/rivalsbanter twice a week, plus 1 `instagram_tiktok_outlier_search` (5 cr) per big story. That's ~20 cr/week, within the 150/mo budget.

## Re-run 2026-09-28 afternoon (scheduled task, second pass)
- `socialinsider_list_profiles` → still `[]`. No project exists and no profiles are tracked, so nothing new could be benchmarked. No write calls were made; the server requires Alex's explicit confirmation for each `create_*`/`add_profile`.
- **The blocker has not changed:** Alex must approve the `create_project_with_brands` call proposed above (7–9 profile slots, or the 5-slot version) and confirm the plan's profile limit. After that, the first PM session with the project runs `get_profile_data` (last_30_days) + `get_posts_summary` + `get_top_posts` (last_7_days) per profile and fills in the table.
