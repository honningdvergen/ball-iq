# SNAPCHAT WINNERS STUDY (outside-in) — researcher "snap", 2026-09-29 (Oslo ~14:00)

Tags: [DATA] = read on a named page today (URL given). [INFERRED] = reasoned from data. [GUESS] = my estimate, no instrument.
Method: web only (WebSearch, WebFetch on public snapchat.com pages and help/policy pages; no login, no posting). Caveat that applies to every "[DATA] snapchat.com" number below: the pages were read through a summarising fetcher, and Snap's public pages carry a "last updated" date that is often weeks or months old. Treat view counts as order-of-magnitude, not audited.
Read first: small-platforms.md §4, telegram_snapchat_playbook_2026-09-28.md, snapchat_evergreen_2026-09-29.md, A_GRADE_PLAN.md, memory project_snapchat_whatsapp_2026_09_28.md.

## 0. THE VERDICT IN 12 LINES
1. Nobody can publish a "how football meme accounts grow on Snapchat" case study; none exists in public. What exists is ~25 public creator pages. From them: **small football accounts (6.7K–20K followers) routinely have single Spotlights at 100K–4.7M views, but their typical post is 10–40K.** A 0-follower account is not structurally capped (Snap ranks on performance, not follower count). [DATA §2, §3]
2. **Spotlight is the growth surface; Public Story is retention; Saved Story is a shelf.** Snap's own number: daily Spotlight posters grow followers ">10x faster" than non-posters; 3+/week = "40% faster". [DATA newsroom.snap.com/still-spotlight-but-still-real; the 40% figure is from a search summary, 1 source]
3. **What wins on the football-memes hub is NOT "the meme vessel + a line".** It is (a) quizzes / "name the club" / "goodnight to everyone except" prompts, (b) player or club comparisons and stats ("Premier League table if it was 45 years long" 338K), (c) reaction-surprise interview clips (a Man Utd fan's Spanish "thank you" 1.4M), (d) relatable "POV / PE teacher picks teams" memes (266K), (e) compilation clips of famous players. Formats (a)+(b) are exactly what Ball IQ and our maths cards already are. [DATA §3]
4. **Enforcement of "originality" looks loose in practice** (many top football accounts are other-people's-clip compilations and still get 100K+), but the **official rules are strict on the two things we can trip by accident: letterboxed/blur-reformatted video, and a burned-in username paired with another app's name or logo.** [DATA values.snap.com quality page] Our own evergreen list already flags blur-fill layouts and "instant fail" plates. Fix that before adding volume. [INFERRED]
5. **Monetization is unreachable in 14 days and irrelevant to the decision.** Bar: 50K followers, 15,000 view-hours/28d (3,000 from Spotlight), verified Snap Star, 18+, eligible country, Spotlight videos ≥30 s. [DATA help.snapchat.com 14669003687444, fetched today] Snapchat is a reach/follower bet only until at least 2027.
6. **Our last 2 days ran blind AND in bursts:** 16 Snapchat rows in posts_log, 8 of them scheduled inside 5 minutes (22:55–23:00 on 09-28). Same-minute bursts give the algorithm no per-post read window and no time-of-day test. [DATA posts_log.jsonl]
7. **Snap Insights DOES have the metric we need: per-Spotlight "Followers" gained, plus Views, Viewers, Shares, Average View Rate.** So Alex's screenshots can give a true follow-conversion number per post. [DATA help.snapchat.com 7012336424980]
8. **Recommendation for the next 14 days:** cut from ~10 posts/day to **4 Spotlights/day spread over 12:00–23:00 Oslo + 1–2 Public Stories** (not a mirror of every Spotlight), 4 distinct formats/day, with quiz + comparison formats added. Details §5.
9. **OneUp kill/keep 10-04:** keep the existing A_GRADE_PLAN rule but **fix one number**: "≥100 follows per 10K Spotlight views" is a 1% conversion, 10x our best measured platform (FB 7.3 per 10K). Use ≥10 per 10K. Full rule §6.
10. Realistic expectation by 10-04 [GUESS]: 200–1,500 followers; P(any Spotlight ≥50K) ~35%; P(≥2 Spotlights ≥50K) ~15%; P(≥1,000 followers) ~20%.
11. Alex's screenshot list is §7 (10 items, ~5 min, 3 times: 10-01 PM, 10-03 PM, 10-04 AM).
12. No source shows whether scheduling via OneUp changes reach. Untested; §6 includes a cheap A/B (phone vs OneUp).

## 1. HOW GROWTH WORKS ON SNAPCHAT IN 2026: SPOTLIGHT vs STORY vs PROFILE

| surface | job | how it grows | what counts toward the Snap Star/monetization bar |
|---|---|---|---|
| **Spotlight** | discovery; each Snap judged alone, tested on a small cohort then widened | performance, not follower count [DATA creators.snapchat.com/blog/snapchat-spotlight-new-creator-growth] | 3,000 of the 15,000 view-hours must come from here; ≥100 Spotlight view-hours/28d to keep max rewards (from 2026-05-07) [DATA help 14669003687444] |
| **Public Story** | the follower relationship; shown to followers/subscribers and some discovery | needs followers first | monetizable mid-roll later; counts in view-hours |
| **Saved Story** | profile shelf ("Shithouse of the Week") | none by itself | posts count toward the older 25-posts habit only [DATA telegram_snapchat_playbook] |
| **Public Profile** | the account; shows "Creator", bio, Spotlights, Stories | Snapcode/bio links from other platforms | Snap Star verification form appears only when eligible [playbook, blogs, not official] |

- Signals Snap discloses for ranking: viewer's country, language, age, gender; whether they viewed similar content, favorited, subscribed, shared, commented; content metadata (category, view duration, creator info, location, language, hashtags); negatives (hide, report). **Diversity rule: Snap deliberately avoids repeating similar content.** [DATA help.snapchat.com 8961653169940 "How We Rank Content on Spotlight"]
- Signals agencies claim (NOT from Snap, weights unpublished): completion rate strongest, replays/loop, shares, 2-second hook, save/favorite. [1–3 blogs: searchlightsocial.com, mysnapchatplanets.co.uk, watsspace.com; agency-observed, treat as [GUESS]-grade]
- Follower thresholds that matter for us: **200 followers unlocks age/gender/location in Insights** [DATA help 7012406662804]; 50K = monetization; nothing else. Old 1K-follower Spotlight Rewards ended 2025-01-31. [playbook]
- Scale and competition: Snap Q2 2026 = 493M DAU, 971M MAU; **US Spotlight posters up >115% YoY, daily viewers up >20%** (more supply than demand growth: harder each quarter). [DATA Motley Fool/Globe and Mail Q2 2026 call transcript, CNBC 2026-08-03 headline numbers]
- Snap says creators posting to Spotlight daily in the US grew >70% YoY (Q1 2026). [DATA newsroom]

## 2. WHO IS WINNING IN FOOTBALL HUMOUR ON SNAPCHAT (public pages, read 09-29)

Cadence is **not observable** from public pages (no timestamps per Spotlight), so it is marked unknown. Follower counts shown only where the page displayed them.

| account | followers | best Spotlights seen | typical | format | source/date shown |
|---|---|---|---|---|---|
| @footballersshow | 1.4M | n/a | n/a | big football aggregator | snapchat.com/explore/football/profiles |
| @chelseafc (official) | 922K | n/a | n/a | club | same |
| @don.rabbi "Football Daily" | 441K | n/a | n/a | daily football | same |
| @football_foru | 266K | n/a | n/a | football | same |
| @footballfanspv / @football1daily | 215K / 226K | n/a | n/a | fan/daily | same |
| @goalglobal2 (GOAL's Front Three) | **101K** | 221K "name 15 clubs" quiz | 20K–40K | 3-fan panel quizzes, debates, meme recreations | profile page, updated 09-28 |
| @footydailyvids | **20K** | **4.7M** (IShowSpeed x Busquets), 783K, 250K | 146K for a 60-s missed-chances compilation | player clips/compilations | profile, updated 03-2025 (stale) |
| @footyplus | **17K** | 331K, 315K, 315K | 30K+ floor | Ronaldo/Messi content, FIFA comparison, memes | profile, updated 04-2024 (stale) |
| @footballgossips | **14K** | 134K transfer, 113K "kid, failed shirt swap", 107K/101K comparisons | 3K–34K | memes, comparisons, "Liverpool v Arsenal loyalty quiz" 94K with **1.9K shares** | profile, updated 08-2026 |
| @soccer.memez | **6.7K** | 271K, 266K (PE teacher picks teams), 238K (cat scores goal) | 35K–40K | meme clips, text overlays | profile, updated 01-2025 |
| @snoozfootball | not shown | 42K, 34K, 33K | 10K–15K | guess-the-club quizzes on laptop screen, "Goodnight to EVERYONE except" | profile, updated 04-2026 |
| @ftblmemeshub | not shown | 97K (on a music track) | 2K–39K | player highlight/meme edits | updated 04-2026 |
| @spotlightsoccer "Best Football Snaps" | not shown (a search snippet said 120K, unverified) | 41K likes on a Nov-2025 compilation | **1.5K–24K** | compilations | updated 09-28 |
| @football.benj "Funny football clips" | **568** | ~11K | 4 to 11K views (a Spotlight at 4 views exists) | surreal edits (seagull pecking players, steam trains in stadiums), satirical captions | updated 09-29 |
| @thenearlymen, @dorennail | small | 1.2K | ~1K | reaction/mashups | football-memes hub |

Hub-page view counts on the day (snapchat.com/entertainment/funny/football-memes, /topic/premier-league-football) [DATA]:
- 1.4M @footydailyvids (Man Utd fan "Thank you in Spanish"), 571K @jenniklimov (Messi v Ronaldo toilet paper), 550K @dali_collinsp, 430K @footballgossips ("Newcastle 8-0 humiliation" memes), 338K @football_com24 (**"PL table if it was 45 years long"**), 302K @trend_global (British fans' rants ranked), 266K @soccer.memez, 195K @memes5302, 128K @hasanfootball1, 77K @dominic2032, 67K @zubz_9.
- Publishers: @premierleague Spotlights 13K–2.8M (139K–468K is its "high" band); @mancityofficial 171K–315K; @formzofficial (rap) 129K.
- Sample of the hub's lower half: 1.2K–33K.

What this tells us:
- [INFERRED] The football-memes hub is a wide distribution: a few 300K–1.4M, a big middle at 10K–130K, a tail at 1–10K. **A 568-follower account gets 4–11K.** That is the realistic first-week zone for us, not 100K.
- [INFERRED] The accounts with the most 100K+ posts are **small-to-mid accounts (6.7K–20K followers) that post recognizable-player clips/compilations and prompts**, not polished brand accounts. Big official accounts sit at 13K–470K per post. Follower count does not gate reach.
- [INFERRED] **Shares matter more than likes** in the stuck-in-group-chat culture: 1.9K shares on 94K views (@footballgossips), 13K shares on 238K views (@soccer.memez cat clip), versus 20 likes/23 shares on 10K views for @spotlightsoccer. The hub's own tagline: "made for the group chat".
- [GUESS] Cadence of these accounts: 30+ Spotlights visible on @footydailyvids, 20+ on @soccer.memez, 16+ on @football.benj. Nothing suggests >5/day is needed; I found no source for 10/day.
- Not found: any named "football HUMOUR only, satire/banter" Snapchat account with a documented growth story (same conclusion as the 09-28 playbook). Bing-style searches returned only generic "how to grow" blogs. [DATA]

## 3. WHAT THE SPOTLIGHT ALGORITHM REWARDS (official vs claimed)

| claim | status |
|---|---|
| Ranks on performance, not follower count; tests on small cohorts | [DATA Snap creators blog + Snap newsroom "rapid discovery... rather than just follower counts"] |
| Personalisation by viewer demographics, viewing history, favorites/shares/comments/subscribes; negatives = hide/report | [DATA help 8961653169940] |
| Watch time/completion and replay are the strongest signals | [CLAIMED by 3 blogs; Snap does not publish weights; Snap only says "view duration"] |
| 2-second hook decides the swipe | [CLAIMED blogs; common sense, low cost to comply] |
| Original, camera-native content is prioritised; wholly AI-generated video is NOT recommended (since 2026-07-31); "widely syndicated" posts deprioritised | [DATA newsroom "Still Spotlight… But Still Real" + TechCrunch/MediaPost via playbook] |
| Unoriginal ineligible: "content you did not create and have not transformed (commentary, reactions)"; "low-effort reaction that is a pretext to repost"; repetitive posting with minimal variation | [DATA values.snap.com/policy/.../quality] |
| **Also ineligible per Snap's quality page: blurry/low-res, wrong orientation, "poorly reformatted", LETTERBOXED video, MISSING AUDIO, and a username paired with the name or logo of another social/messaging app, plus links off-platform** | [DATA same page] |
| Watermarks of other platforms suppress reach | [CLAIMED by blogs; the official policy does not mention watermarks]. Practical rule: never ship one |
| Captions on-screen matter ("85% watched without sound") | [1 marketing blog, opus.pro, UNVERIFIED]. Do not cite the 85%. Snap requires audio present, so ship sound AND text |
| Length: upload spec 5–60 s (some 2026 blogs say 3 min); 10–30 s for reach; ≥30 s to be monetizable | [DATA help says ≥30 s for monetization; the Feb-2025 launch said >60 s; conflict still open] |
| Hashtags: 1–3 specific | [blogs] |

## 4. DO RECYCLED TIKTOK/IG REELS WORK ON SPOTLIGHT?
- **Official:** unaltered reposts of others' posts are not monetizable and not recommendable; compilations need "creative editorial judgement"; licensed/third-party clips are acceptable when there is original commentary and attribution. [DATA values.snap.com creator-monetization-policy + quality]
- **Blogs:** "TikTok watermark suppresses reach" (searchlightsocial). I found **no controlled test** of watermarked vs clean reposts. [DATA: search returned only how-to-remove-watermark pages]
- **In the wild:** the hubs are full of clip compilations and other-people's-footage accounts with 100K+ views (@footydailyvids, @footyplus, @spotlightsoccer). So reach is not zero for clip-based content. [INFERRED] The risk is takedown/monetization/"Not eligible for recommendation" quietly capping distribution, not an automatic block.
- **For us:** our reels are our own renders (clean MP4, our text) and are the assets that are OK. What we should NOT do: re-download a TikTok/IG export (watermark), or post raw broadcast footage. Also check the three format flags above (letterbox/blur-fill, silent, burned-in handle+other-app logo). [INFERRED from official page + evergreen list]
- Aspect/length: 1080x1920, H.264 MP4, 9–30 s. All 10 files in snapchat_evergreen are already 1080x1920 (5–43 s). [DATA evergreen doc] Audio is present in all; good.

## 5. AUDIENCE: UK / EU / US, 13–34
- UK: Snapchat reaches ~**75% of 13–34-year-olds in Britain**; **23.67M UK users**. Norway ~72.7% adult reach. Germany 23.0M, France 29.8M users (late-2025 ad audience). [DATA charle.co.uk, worldpopulationreview via search; 1–2 sources each, directionally right]
- Global: 18–24 = 38% of users. North America DAU flat at 92M, growth only in 35+; Rest of World DAU 303M (3x North America, +12% YoY). [DATA Snap Q2 2026 via Globe and Mail/Yahoo]. [INFERRED] **The Spotlight audience you get is far more Rest-of-World than UK/US**: the hub is full of Arabic-language, Nigerian, Ghanaian, Indian-adjacent creators. English football banter aimed at UK/US will be shown first to viewers whose country/language/age match (Snap's disclosed signal), so set expectations that views will be global; Insights "top locations" (needs 200 followers) will tell us.
- Football watching (Gen Z): 49% of Gen Z fans use YouTube several times a week for sports content; Instagram, TikTok, Snapchat follow; only **31% of sports fans aged 18–24 watch full live matches vs 75% of 55+**; they follow players more than teams. [1 aggregated search summary; source article not opened; UNVERIFIED but consistent]
- What they watch on Snapchat (from §2 hubs): compilations of famous players, player comparisons, quizzes, fan-reaction/POV memes, transfer gossip, Ronaldo/Messi/Haaland/Palmer/De Bruyne/Ronaldo-Messi content. Club-specific content works when the club is huge (Man Utd, City, Liverpool, Arsenal). [DATA §2]
- [INFERRED] Our stronger-in-UK banter formats depend on club-fanbase in-jokes that a global Snap audience may miss. Cheaper test: mix "universal" (player comparison, quiz, maths) with "UK banter" and read the per-Spotlight country split.

## 6. THE NEXT 14 DAYS (09-30 → 10-13): WHAT TO DO DIFFERENTLY

### Volume and timing
- **Spotlights: 4/day (matchdays 5), not ~8–10.** Spaced ≥2.5 h: 12:00, 17:30, 20:30, 22:45 Oslo (UK 19:30–22:00 evening slot is the only time-of-day claim I found: "7–10 PM local", 1 blog; treat as [GUESS], and use the first week to test 2 slots). Never post more than 2 within an hour. [DATA posts_log 8 posts in 5 min on 09-28]
- **Public Story: 1–2/day, only the best still or one clip, NOT a mirror of every Spotlight.** Snap's diversity rule and the "repeated content" rule apply per account. The 09-28 log shows every Spotlight also went to Story. [INFERRED]
- Why 4 not 10: Snap's numbers reward "daily" and "3+/week"; no source says >4/day helps; agency claim is 2–4/day. Ten reels/day also drains the good-format pool: our evergreen shortlist has only 1 proven hit. [DATA searchlightsocial (agency), snapchat_evergreen doc]

### Content mix (each day: max 1 per template)
1. **1 "universal" hook:** player/club comparison, stat or maths reveal, or a **Ball IQ quiz/guess-the-club reel** ("name the club", "goodnight to everyone except"). Evidence: quiz/comparison formats at 94K–221K on small accounts. Ball IQ quiz reels also have a CTA path. NOTE: memory says quiz reels are quiet and got deleted on TikTok; Snap flags "missing audio" as ineligible, so add a music bed. [DATA §2, §3; memory feedback_quiz_reels_not_for_tiktok]
2. **1 fanbase/club banter** (our current strength, keep, but rotate clubs; big clubs only in week 1).
3. **1 reaction/"surprise clip" with our text** (the Lee Kang-in class; the Spanish-thank-you clip did 1.4M for a Man Utd fan, the same trick).
4. **1 wild card / relatable POV** (the "PE teacher picks teams" register: universally understood, 266K).
- **Fix before posting:** no blur-fill or letterboxing (rebuild as full-bleed 9:16); no burned-in "@handle" next to an X/IG logo; audio on; remove "#fyp" (TikTok idiom) and the "🎵 Kevin MacLeod" credit lines from the visible caption (keep credit in the description only if required); 1–3 specific tags (#club #footballmemes). [DATA values.snap.com quality; log shows #fyp and music credit in captions]
- **Templates:** posts_log shows "fanbase-when", "two-panel", "clown-makeup vessel" repeated within one night. Snap's repetitiveness rule and diversity rule punish same-template repeats. Max 1 use of each template per day. [INFERRED]
- Each Spotlight should ask for one action Snap counts: a **share** ("send this to the X fan in your group chat") or a **replay** (loop, twist at the end). Text CTA is cheap. Snap's own hub language is "made for the group chat". [DATA snapchat hub copy; INFERRED]
- "Series" hook: "part 2 tomorrow" or "Fanbase of the day" (Snap-native; unmeasured for us).

### Stop doing
- Same-minute batches; posting every Spotlight also as a Story; "Snapchat has 0 followers" self-promo on X/Threads (972 X views, 368 Threads views, PM 09-29); claims about 50K. [DATA small-platforms.md]

### Kill/keep rule for OneUp, decide Sun 10-04 (before the ~10-05 charge)
Numbers come from Alex's Insights screenshots (§7). Denominator = Spotlights **posted 09-28 → 10-02**, read at ≥48 h old.
- **KEEP OneUp if ANY:** followers ≥ 1,000 · ≥ 2 Spotlights ≥ 50K views · median Spotlight ≥ 3K views over ≥ 15 posts **and** average view rate ≥ 40% (that pair would be top-half of the small football accounts above [GUESS]) · **≥ 10 follows per 10K views on the best 3 Spotlights** (using Insights per-Spotlight "Followers"; replaces the ≥100-per-10K in A_GRADE_PLAN/small-platforms, which is a 1% conversion, unreachable: our FB is 0.07%, Threads 0.04% [DATA small-platforms §0]).
- **DROP if ALL:** followers < 300 · median Spotlight < 1,000 views · no Spotlight > 10K. (Comparable: 568-follower account gets 4–11K, so a fully dead result means our content/format is failing, not the platform.)
- **In between:** keep one more month at 4/day only if follower growth is positive and the best format is identified; re-read 11-04 against ≥2,500 followers.
- Break-even math: $25 vs a follower costing kr2–5 (~$0.2–0.5) on FB ads = 50–125 followers/month. [DATA small-platforms §4]
- **Zero-cost alternative if DROP:** Alex posts the best 1–2 reels/day natively from his phone (the Ronaldo post worked). No source says native beats OneUp-API in reach; I found none either way. [DATA: no evidence]
- **Cheap A/B (optional, low power):** from 10-05, post ~1 matched-quality reel/day natively from the phone and the rest via OneUp; compare median views. [GUESS on value]

### Expectations by 10-04 [GUESS, wide]
| metric | P10 | P50 | P90 |
|---|---|---|---|
| followers | 60 | 500 | 3,000 |
| best single Spotlight | 3K | 25K | 400K |
| median Spotlight | 300 | 2K | 15K |

## 7. WHAT ALEX SENDS (Snapchat app: profile > Public Profile > Insights; each screenshot with the date/time bar visible)
When: **Thu 10-01 evening, Sat 10-03 evening, Sun 10-04 morning** (mature Spotlights need ≥48 h; the 09-28/29 posts are ready 10-01). If it is easier, one set on 10-01 and one on 10-04 is enough.
Send them in chat as images (per feedback: files in the chat). Numbers below are what Snap's glossary says exists. [DATA help 7012336424980, 7012363805332, 7012406662804]
1. **Profile page**: top of your own public profile showing follower count, then scroll: the Spotlights grid showing **the view count under every thumbnail** (2–3 screens, all Spotlights since 09-28).
2. **Insights > Overview** at 7-day and 28-day: followers total, follower change graph, total views.
3. **Insights > Audience**: followers over time; age, gender, top locations, top interests. Need ≥200 followers; if not enough, send the screenshot of the "not enough followers" message.
4. **Insights > Spotlight (summary)**: views, viewers, favorites, reposts, comments, shares, average view time, **average view rate** at 7- and 28-day.
5. **Insights > Spotlight > per-post list sorted by Views**: top 10, then the **bottom 5**. Every row should show Views, Viewers, **Followers** (new followers gained from that Spotlight), Shares, Favorites, Comments, average view rate, total view time. If the app shows only some columns, tap into the top 5 and screenshot each detail page.
6. **Insights > Stories**: per Story: Snap Views, Viewers, Average View Time, Total View Time; plus the "Engaged Story audience": age group, top locations, top interests (28-day).
7. **Any Spotlight tile showing "limited", "not recommended", removed or under review**, and any Snap notification/email about content. Screenshot it with the post visible. (Tells us if originality/format rules bit.)
8. **Settings/Creator hub**: any "Snap Star", "Monetization", or eligibility progress screen (even "not eligible yet"). Screenshot as-is.
9. **Which posts are Spotlight-only vs Story too**: a screenshot of the Stories tab and the Spotlights tab, so we can match posts to logId in posts_log (we match by caption text and posted time).
10. **Optional, 3 min:** open the Spotlight feed, search "football memes"; screenshot 10 football Spotlights with creator name + views (this refreshes the §2 table with in-app numbers).
- "Reach %" and "top snaps by views": **Snap has no follower/non-follower reach split for Spotlight in its glossary and no "top snaps" screen**; the per-Spotlight list in item 5 (sorted by Views) is the equivalent. If Alex sees a reach or non-follower percentage anywhere, screenshot it; do not expect one. [DATA glossary lists none]
- What we do with them: add a `snapchat` line to scoreboard.md (followers, best/median views, follows per 10K on best 3, avg view rate), tag each Spotlight in posts_log.metrics (views, followers gained, avg view rate), then run the §6 rule.

## 8. UNVERIFIED / CONFLICTING / GAPS
- Monetizable Spotlight length: official help says ≥30 s (fetched today); the 2025 launch and many blogs say >60 s. Use ≥61 s for any Spotlight we want to earn on later. [conflict]
- Max Spotlight length 60 s vs 3 min: sources conflict; web uploader spec unread. Stay ≤60 s.
- Payout $0.10–0.30 per 1K views: secondary blogs (fluxnote, one example of $126 for one Crystals video), no Snap figure. Total unverified.
- "Best time 19:00 local", "2–4/day", "85% muted": single agency/marketing blogs.
- Follower counts on public pages: some pages were last updated 2024–2025 (@footyplus 04-2024, @soccer.memez 01-2025, @footydailyvids 03-2025). Numbers may have moved a lot.
- The public page for @shithouseryhq shows the "Creator" badge and bio but **no Spotlights, no counts** to a fetcher (09-29). Our results are visible only inside the app. [DATA]
- UK/Norway reach figures are 1–2 secondary sources; Europe-specific DAU not found.
- Not found: any test of third-party-scheduled vs native reach; any named football-humour Snapchat growth story with dated numbers.
- Public-page views are a summarising fetcher's reading. A raw scrape (Firecrawl) was rate-limited today; re-run for exact numbers if the §2 table drives a decision.

## SOURCES
- Snap official: https://help.snapchat.com/hc/en-us/articles/14669003687444-About-Snapchat-s-Monetization-Program · https://help.snapchat.com/hc/en-us/articles/8961653169940-How-We-Rank-Content-on-Spotlight · https://help.snapchat.com/hc/en-us/articles/7012336424980-Insights-Glossary-for-Snapchat-Creators · https://help.snapchat.com/hc/en-us/articles/7012363805332-How-do-I-view-Content-Insights-for-my-Public-Profile · https://help.snapchat.com/hc/en-us/articles/7012406662804-How-do-I-view-Audience-Insights-for-my-Public-Profile · https://values.snap.com/policy/content-guidelines-recommendation-eligibility/recommendation-eligibility/quality · https://values.snap.com/policy/creator-monetization-policy · https://newsroom.snap.com/still-spotlight-but-still-real · https://creators.snapchat.com/blog/snapchat-spotlight-new-creator-growth
- Snap Q2 2026: https://www.theglobeandmail.com/investing/markets/markets-news/motley/3782247/snap-snap-q2-2026-earnings-call-transcript/ · https://www.cnbc.com/2026/08/03/snap-q2-earnings-report-2026.html
- Public pages (read 09-29): https://www.snapchat.com/entertainment/funny/football-memes · https://www.snapchat.com/topic/premier-league-football · https://www.snapchat.com/explore/football/profiles · https://www.snapchat.com/@footydailyvids · @soccer.memez · @footballgossips · @snoozfootball · @ftblmemeshub · @goalglobal2 · @footyplus · @football.benj · @spotlightsoccer · @premierleague · @shithouseryhq
- Blogs/secondary (weak): https://searchlightsocial.com/snapchat-spotlight-algorithm/ · https://fluxnote.io/guides/how-much-snapchat-spotlight-pays-per-view · https://www.shortsync.app/guides/schedule-snapchat-spotlight · https://www.oneupapp.io/snapchat-features · https://www.charle.co.uk/articles/snapchat-statistics/ · https://worldpopulationreview.com/country-rankings/snapchat-users-by-country · https://www.opus.pro/blog/snapchat-spotlight-caption · https://mysnapchatplanets.co.uk/snapchat-spotlight-viral-tips-2026-how-to-get-millions-of-views-fast/
- Internal: social/state/audit_2026-09-29/small-platforms.md · social/state/research/telegram_snapchat_playbook_2026-09-28.md · social/state/snapchat_evergreen_2026-09-29.md · social/state/A_GRADE_PLAN.md · social/state/posts_log.jsonl
