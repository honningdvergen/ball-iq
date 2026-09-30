# Benchmark: CAPTIONS AND HOOKS (audit 2026-09-30, written ~03:00 Oslo)

Angle: what the top posts of 13 reference accounts do in their captions (first 10 words, length, tone, emoji, hashtags, CTAs, disclosure lines, topical hinge) compared with ours.
Tags: [DATA] = counted from a file (source named), [INFERRED] = reasoning from data, [GUESS] = no instrument.
Small samples are called small. This is 71 recent posts from 13 accounts on one evening, so it describes a pattern, not a law.

## 0. Bottom line

1. [DATA] On the night of the verdict, the winning first line on the biggest reference account was a short verdict spoken in a mate's voice, about the consequence of the news, not the news. thatguysjokes posted 7 City reactions between 15:15Z and 20:30Z. Together they have 218,775 likes and ~1.78M reel plays on a ~2.17M account (rows Dd4DudkjAeg, Dd4QzWaDH-_, Dd4SqLgMJeF, Dd4VdT5sNVJ, Dd4an5BMeF7, Dd4gJ5OjAc8, Dd4nrUsMOcU). Our City carousel opened with the news sentence itself, then a follow CTA: 66 likes, 1,204 views.
2. [DATA] The hook is not the whole difference. 9 of the 12 accounts with readable captions put a body of 250+ characters under a short first line (median 440 chars across 71 recent posts). Ours since 09-28 12:00Z: 15 IG captions, median 75 characters, 0 with a body of 250+ chars. IG shows about the first 125 characters, so the body is for the algorithm, not the reader [INFERRED, the 125 is general knowledge, not measured here].
3. [DATA] Our own 17-day history has the same shape. IG feed posts with 50+ word captions: n=25, median 17.1K views, 11 of 25 at 20K+ views. Under 50 words: n=82, median ~6.7K, 5 of 82 at 20K+. For carousels it holds inside both halves of the window (09-13..09-20: 50+ words n=5 median 69.9K vs n=22 at 8.7K; 09-21..09-26: n=16 at 16.5K vs n=14 at 4.4K). Confounded by story heat and format. It is the strongest caption signal we have, and the pipeline moved the opposite way after 09-26 (captions cut to a line).
4. [DATA] Competitors almost never ask. 2 of 71 recent posts end on a real question; 7% carry hashtags (5 posts, all one account). Ours since 09-22: 15 of 71 (21%) carry a CTA question, 37% hashtags, 52% put 😭/😂 in the first line (reels 86%) vs 15% for competitors. "Which slide/one got you?" ran 5 times in 4 days; the 15 CTA posts drew 50 comments on 290K views.
5. [DATA] Our best caption of the day was already in the winning voice: "Ronaldo and Messi fans will never stop arguing man" (IG 14,285 views, 397 shares, 42 comments; Threads 32,217 views). It is a fanbase accusation, 9 words, no full stop, no emoji. Our worst were neutral recaps (480 and 1,471 views).
6. [DATA] Timing. Sources put the Premier League statement at about 16:00Z (RTÉ published 15:59:53Z), not 19:30Z. Our first verdict post was Threads at 19:00Z (~3h later) and the IG carousel at 22:27Z (~6.5h later). See section 2.
7. [DATA] Reuse. Since 09-28 12:00Z, posts_log shows 130 platform-posts but only 45 distinct captions. 112 of the 130 (86%) share a caption with another platform, and 😭 is in 49 of 130 (38%).
8. [INFERRED] We do not lack a caption rulebook, we have four that disagree (section 8). The pipeline obeys the strictest one (one line), which is the one our own data argues against.

## 1. Method, sources, limits

- Competitor rows: competitor_sweep_2026-09-29.json (83 posts, 13 accounts). It only stores a ~110-char caption start.
- Full captions: I read them from the public embed endpoint instagram.com/p/<code>/embed/captioned/ (plain GET, no login, no Chrome, nothing posted). 77 of 83 came back full. midnitefootball (5 rows) returns a blank embed, so its captions are the 110-char start only and its length stats undercount. Derived features (not full text) are saved to benchmark_captions_features.json in this folder.
- Excluded from "recent" stats: 12 rows dated before 09-22 (hesaballer 06-25 803K likes, oddsbible 06-19 517K, thefootballfeeduk 2024-12-31 533K, etc). They look like pinned/back-catalogue grid picks, not this week [INFERRED]. 7 rows show exactly 3 likes (footy.rn x3, thefootballfeeduk x2, hesaballer, nonoffsideguy): treated as hidden or unreadable, excluded from like maths, kept for caption stats.
- Ages at export (2026-09-30T00:00Z) run 3h to 183h, so likes are not comparable within one account across ages. thatguysjokes' newest three posts were 3-5h old.
- Followers (dated): thatguysjokes ~2.17M, rivalsbanter ~378K, simptv ~229K (09-20), hesaballer ~193K, trollol_epl 136K, ftblmemeshub 130K, thefootballfeeduk 102K, itsfootybants 86K, midnitefootball 79K, nonoffsideguy 50K (research/socialinsider_2026-09-28.md, audit_2026-09-29/meta.md). oddsbible, anfieldcentral, footy.rn unknown (vidIQ has 4 credits, a profile call costs 5).
- Ours: quality_data/ig_threads_pull_17d_2026-09-30.json (162 IG, 282 Threads posts with text + views), /private/tmp/tt/insights_0930.txt, posts_log.jsonl.
- Tools used: python over the JSON, curl on the public embed pages, Firecrawl + WebSearch for the news timestamps. Not used: Playwright/Chrome (the embed endpoint gave the full text without a login, and the shared Chrome tab group is off limits), vidIQ (no credits), Socialinsider (no per-post captions needed). The IG images themselves were not viewed: this is caption-only.
- Copyright: competitor captions are paraphrased with post codes; look them up in the sweep JSON. Only one is quoted.

## 2. Timing flag (affects how bad our lag was)

The brief says the verdict broke ~19:30Z / 21:30 Oslo. Sources say earlier:
- RTÉ: published 2026-09-29T16:59:53+01:00 = 15:59:53Z; its "19:48" stamp is the last-modified time (18:48Z), an easy misread. https://www.rte.ie/sport/soccer/2026/0929/1593401-man-city-found-guilty-of-all-premier-league-charges/
- Al Jazeera 16:30:50 (timezone not stated, probably GMT); CNN metadata 16:53Z (a second field says 12:53 -05:00, which would be 17:53Z).
- In the sweep: anfieldcentral posted the news at 16:45Z (Dd4ODvliJ8-), thatguysjokes reacted to "that whole PL statement" at 17:09Z, rivalsbanter Part 4 at 18:04Z, footy.rn 18:37Z. thatguysjokes' 15:15Z post predicted a small punishment, so it may pre-date the statement or come off a leak.
- If ~16:00Z is right: Threads "BREAKING" (19:00Z) was ~3h late, the IG carousel (22:27Z) ~6.5h late, and the 58.7K-like reel came ~1.5h after the news. Between 16:00Z and 19:00Z our IG posted nothing and Threads posted only the Forest European Cups line (17:30Z, 957 views, 3 likes). The person who set "19:30Z" should re-check.

## 3. Account by account (recent posts only, 09-22 onward, likes > 3)

Like rate = median likes / followers, only where followers are known and dated. Small accounts' rates are inflated by non-follower reach.

| Account (followers) | n | Top post (likes, age): what its first line does | Bottom post (likes) | Median caption | Body type | 1st-line emoji | Hashtags | Real CTA | Extra lines |
|---|---|---|---|---|---|---|---|---|---|
| thatguysjokes (2.17M) | 8 | 58.7K, 7h (Dd4SqLgMJeF): reel, a comparison that says even Klopp's press was gentler than the PL statement | 2.6K, 3h (too young) | 546 ch | 8 of 8 carry one of 3 filler paragraphs | 0/8 | 5/8, 3 tags | 0 | Filler paragraph states IG flags short captions as unoriginal; source credit "(@handle)" |
| rivalsbanter (378K) | 8 | 48.1K, 84h (Ddv_RciHYIA): "Part 2", then verbatim news copy | 4.4K, 27h: a 3-word reel caption. Also a reel with an EMPTY caption: 18.1K likes, 374K plays (Dd0mOmWACGp) | 305 ch | Copied news text + "📝 @ornstein" credit | 0 | 0 | 0 | Serial: Part 2 48.1K > Part 3 20.3K > Part 4 13.6K (ages 84/61/6h). One retro-kit sales caption (12.8K) |
| itsfootybants (86K) | 8 | 16.1K, 32h (Dd1nHZligVp): a warm stance line on Messi's free kick | 3.2K (Dd1MJ7hiiKv): sad take on Ronaldo benched | 1,605 ch | 5-6 paragraph unique fan-essay | 0 | 0 | 0 | none. Spread top/bottom 5.1x |
| ftblmemeshub (130K) | 8 | 12.8K, 13h (Dd3kosoDt-5): 5-word label with 🐐 | 1.96K (Dd4KQs7DqS7): 3-word label | 439 ch | The SAME unrelated 1972 flight-attendant paragraph on all 8, flagged "(Ignore this)" | 1/8 | 0 | 0 | 6 of 8 first lines are just Morning / Afternoon / Evening |
| simptv (229K) | 5 | 44.1K, 39h (Dd0zs9kDfOY): a 6-word quip with three 😭 over a City-guilty news paragraph | 1.7K (Dd4UbVaDV7y): "💔💔" | 276 ch | Wiki-style paragraphs, reused verbatim across posts | 3/5 | 0 | 0 | The WWI-truce paragraph appears word for word on thefootballfeeduk too |
| nonoffsideguy (50K) | 7 | 97.9K, 139h (DdqHHtGkwz2): a generic praise paragraph on Mbappé, no hook at all | 2.0K: retro-kit ad | 354 ch | AI-style match summary | 1/8 | 0 | 0 | 4 of 8 end with a "team X has N% chance on @kalshi" sponsor line |
| hesaballer (~193K) | 2 | 22.9K, 32h (Dd1ja8IjFA_): caps + 🚨 Ballon d'Or news lead ending on a "do you think it's right?" question | n/a | 405 ch | Emoji-heavy AI paragraph | 4/5 | 0 | 1 | 833 comments = 3.6% of likes (median across the set 0.46%) |
| oddsbible (?) | 4 | 25.7K, 36h (Dd1HPPRldSP): 35 chars finishing the joke on the image + 👀😂 | 7.4K (Dd4JNF9lOSt) | 44 ch | none | 5/5 | 0 | 0 | The shortest captions in the set; still 7K-26K likes |
| thefootballfeeduk (102K) | 2 | 22.8K, 103h (Ddt75isiAP9): caps news lead + 😳 on the 09-25 leak | 5.9K: "random meme dump" | 777 ch | Kalshi line + the shared WWI paragraph | 5/5 | 0 | 0 | Sponsor lines |
| trollol_epl (136K) | 7 | 8.3K, 183h (DdlZ-IQjM7x): an argument that Haaland's numbers are La Liga numbers in a tougher league | 2.5K (DdqWkwsjPy5): a "who's that one player" question | 171 ch | Argument text or template joke | 2/8 | 0 | 1 (55 comments, 2.2%) | none |
| midnitefootball (79K) | 2 | 3.1K likes, 100K plays (Dd1MHWgoM6q): a sarcastic presumption-of-innocence line + 😂😂😂, then "-" + BREAKING text | 1.2K (Dd4eyEsx7ZI) | 110 (truncated) | Joke line, "-", news text | 2/5 | 0 | 0 | Same "-" separator as thatguysjokes and footy.rn |
| footy.rn (?) | 5 (2 usable likes) | 6.2K, 5h (Dd4a6FbCqJj): MAJOR BREAKING + a 106-word paragraph with a stance | 5.1K: 7-word taunt at Kane | 578 ch | Timeline recap | 5/5 | 0 | 0 | none |
| anfieldcentral (?) | 2 | 530, 7h (Dd4ODvliJ8-): 🚨 BREAKING news lead, 0 comments | 60 (Dd4qW-jiUnv): two-line result recap | 240 ch | Plain news | 2/2 | 0 | 0 | none |

Median likes per follower (known followers, recent): thatguysjokes 1.2%, simptv 2.0%, trollol 2.6%, midnite 2.7%, ftblmemeshub 3.6%, rivalsbanter 4.4%, itsfootybants 8.5%. Ours, IG feed since 09-22: median 194 likes on ~32.5K = 0.6% (n=50); the City carousel 66 likes = 0.2%.
Within-account top/bottom spread is 3x-48x (median ~6x) with 5-8 posts, so one post proves little.

## 4. What the top posts do in the first 10 words that ours do not

Patterns behind the best posts (post codes so you can read them in the sweep JSON):

P1. A verdict in a mate's voice, 8-12 words, no emoji, about what the news means. thatguysjokes: 4 of 8 speak to or as someone ("you", "I", "we"): Dd4an5BMeF7 (19.5K), Dd4gJ5OjAc8 (31.2K), Dd4VdT5sNVJ (36.9K), Dd4DudkjAeg (20.3K). The one quote I will allow: "Even Klopp didn't press Man City this hard" (Dd4SqLgMJeF, 58.7K likes, 945K plays).
P2. An escalated wish or absurd consequence instead of the fact: arrests on top of the points deduction (Dd4VdT5sNVJ), a knighthood for the hacker who exposed them (midnite Dd4eyEsx7ZI, 1.2K likes, 22K plays), a demand for the club's souls (simptv Dd4liZbjXVP, 3.5K).
P3. A label plus emoji stack when the picture is the joke (simptv 44.1K, ftblmemeshub 12.8K, rivalsbanter's two-word awkward-talk label 15.3K, Dd3hbU7HXtq): 1-5 words.
P4. Pointing at the image, then 👀😂 (oddsbible, 5 of 5, 35-57 chars).
P5. A stance on a mega name, then a long essay (itsfootybants, 8 of 8 open with an opinion, 1.3K-1.9K chars).
P6. The caps 🚨 news lead is the least reliable opener when the news is not fresh: anfieldcentral 530, footy.rn 6.2K (rivalsbanter's Part 4, 13.6K = 3.6% of followers, is the exception, carried by its serial format). It wins when first on a fresh scoop: thefootballfeeduk 22.8K on the 09-25 leak, rivalsbanter Part 2 (48.1K) and our own 09-25 Ornstein carousel (36.2K views, 1,012 shares, posted early on the leak day).

Differences to ours (like-for-like 09-22..09-29, 71 IG posts each):

| Feature | 13 accounts | Ours |
|---|---|---|
| First line <= 12 words | 61% | 46% (67% since 09-28 12Z) |
| Emoji in first line | 35% | 55% |
| 😭/😂/🤣/💀 in first line | 15% | 52% (reels 86%) |
| Hashtags | 7% | 37% |
| Body >= 250 chars | 76% | 28% (0% since 09-28 12Z) |
| Median caption chars | 440 | 116 (75 since 09-28 12Z) |
| Explicit CTA question | 3% (2 of 71) | 21% (15 of 71) |
| News-lead first line | 13% | count not run; 09-29's City carousel is one |

Hinge check [INFERRED]: every top competitor post ties to (a) an event under 48h old, (b) a mega name (City, Messi, Ronaldo, Mbappé, Klopp, Rodri) and (c) a stance. Our 09-29 flops fail (a) or (b): "Scotland's hope lasted twelve minutes." (IG 1,471), the Yamal recap (IG 480), "Croatia's equaliser lasted three minutes." (Threads 1,142), the Forest trophies line (Threads 957), the "Big Six wedding ranking" ending "Argue below." (Threads 933, 1 like). The City post had the event and the name but restated the event.

## 5. Same story, same night (the natural experiment)

City verdict posts, 09-29, likes at export, ordered by time (age differs, so treat as rough):

| UTC | Account | First line does | Likes | Format |
|---|---|---|---|---|
| 15:15 | thatguysjokes | cynical prediction of a small ban | 20.3K | 2-slide |
| 16:45 | anfieldcentral | 🚨 news lead | 530 | image |
| 17:09 | thatguysjokes | "they're finished" verdict on the statement | 43.1K | 4-slide |
| 17:29 | thatguysjokes | the Klopp press comparison | 58.7K | reel 945K plays |
| 17:51 | thatguysjokes | wish for arrests | 36.9K | reel 449K plays |
| 18:04 | rivalsbanter | "Part 4", news copy | 13.6K (378K followers = 3.6%) | 13-slide |
| 18:35 | thatguysjokes | "you're going to prison" address | 19.5K | reel 261K plays |
| 18:37 | footy.rn | MAJOR BREAKING paragraph | 6.2K | 7-slide |
| 19:00 | OURS Threads | 🚨 BREAKING claim City were told in July | 28 (2,523 views) | image |
| 19:12 | midnitefootball | knighthood for the hacker | 1.2K, 22K plays | reel |
| 19:23 | thatguysjokes | first-person "we don't care" in a City fan's voice | 31.2K | 4-slide |
| 20:10 | simptv | demand for the club's souls + news paragraph | 3.5K | 7-slide |
| 20:30 | thatguysjokes | joke about supporting other clubs to get on the Overlap | 9.0K | reel 125K plays |
| 22:27 | OURS IG | news sentence + "Which one got you? 👇" | 66 (1,204 views, 494 reach) | 5-slide |

Read: [DATA] on this story the caps news-lead captions from smaller accounts (anfieldcentral 530, footy.rn 6.2K) got the least, and the verdict voice got the most on the biggest account. [INFERRED] It is not a clean caption effect: rivalsbanter's news copy earned a better rate per follower (3.6%) than thatguysjokes' seven City posts (avg 31.3K likes = ~1.4%), because format (tweet-screenshot serial) and audience differ. Timing, format and voice move together.
Our own same-story pair, [DATA]: Threads 10:44Z "Proper punishment for Manchester City" list (an absurd-sanction list): 101,042 views, 662 likes, 181 replies. Threads 19:00Z news claim: 2,523 views, 28 likes. IG 09-25 14:25Z Ornstein carousel (early on the leak day): 36.2K views. IG 09-29 22:27Z verdict carousel: 1.2K views. Same account, same story family; the differences are lag, a participation list vs a news line, and the reused CTA.

## 6. Beyond the first line

- Bodies: 9 of 12 readable accounts run 250+ chars. Four run VERBATIM reused blocks that have nothing to do with the post (thatguysjokes, ftblmemeshub, simptv, thefootballfeeduk; the same WWI paragraph sits on two of them, so they probably share an operator or tool [INFERRED]). Two write unique essays (itsfootybants 1.6K chars, hesaballer). The rest copy news text. Only oddsbible, trollol_epl and (n=2) anfieldcentral stay short.
- Disclosure lines: thatguysjokes' filler says outright that IG flags short captions as unoriginal and that he pastes it to avoid deletion (it names two deleted posts). That is one operator's claim, unverified by Meta [GUESS]. ftblmemeshub's "(Ignore this)" is the same move. Sponsor lines appear on nonoffsideguy/thefootballfeeduk (@kalshi odds, retro-kit sale). Source credits appear as "(@handle)" or "📝 @ornstein". Nobody carries a music licence line (0 of 71); our reel captions carry "🎵 … CC BY 4.0" in posts_log (IG API shows it on 4 of 21 reels).
- Format habit: line, blank, "-", blank, body (thatguysjokes, midnitefootball, footy.rn). The dash keeps the joke visible above the fold.
- Emoji: when competitors use emoji it is 😭/😂 clusters on a label (3 in a row) or 👀😂 at the end, never appended to every line.
- Hashtags: 5 of 71, all thatguysjokes (3 tags). Ours: 37%. In our 17-day feed data hashtag posts show 8.2K median vs 7.0K without (n=18 vs 89), no reliable effect.
- CTAs: only hesaballer (833 comments, 3.6% of likes; Ballon d'Or is polarising) and trollol_epl (55 comments, 2.2%) ask a question. Two posts is anecdote, but the comment/like ratio is 5-8x the 0.46% median. Ours: the 15 CTA posts produced 50 comments on 290K views; 7 of them got 3 or fewer.

## 7. Our own history (caption effect inside our account, IG feed, posts before 09-27, n=107)

| Caption length | n | Median views | >=20K | Follows per 10K views |
|---|---|---|---|---|
| <= 20 words | 52 | 6.7K | 2 | 0.84 |
| 21-49 | 30 | 6.5K | 3 | 1.35 |
| 50-199 | 21 | 15.9K | 8 | 2.40 |
| 200+ (four essays, 09-14..09-19) | 4 | 94.3K | 3 of 4 (views 13.5K / 69.9K / 118.7K / 230.6K) | 3.95 |

- Carousels only: 50+ words n=21 median 17.1K vs <50 words n=36 median ~6.7K. Shares per 1K views do not rise with length (12.4 vs 17-19), so length buys distribution, not shareability.
- Confounds [INFERRED]: the long captions sat on the hottest days (09-14 derby, 09-18/19 Spurs and Chelsea), long ones were also the more carefully written carousels, and 09-14's 363K image is a 52-word fanbase accusation. Not causal. It still matches 9 of 12 competitors and thatguysjokes' own stated reason.
- Style shift [DATA]: 09-23/24 carousels ran 60-130 words (median 10.9K views); from 09-26 they became 19-30 words + 3-4 hashtags + "Which slide got you?" (3.3K-5.5K); 09-29 evening posts were 5-30 words (480-1,471 views). The break, the 20 IG posts on 09-25 and reel flags also moved in that window (audit_2026-09-29/since-friday.md), so I cannot pin this on captions alone.
- Top-12 IG feed openers (by views) vs bottom-12: top = a named fanbase or grievance with a verdict or absurd stat (United fans aggrieved 363K, refs 231K, Gavi's foul-free half-hour 119K, both fanbases think their man won 88K, Spurs maths 49K); bottom = neutral reports or praise (Carrick on United's form, Yamal "isn't he great", Kane-style recaps, "Hard to disagree").
- Threads (n=263 mature posts): plain factual sentence with a full stop and no emoji: 1 of 32 reached 20K vs 10% of the rest (small n). Question posts 21% vs 8%, but n=28. No caption feature separates hits cleanly; hits are semantic (target + absurd contrast + an image that proves it, e.g. 3.29M Spurs maths, 2.70M "Sky Sports have done Saka dirty", 260K "684 points").

## 8. Rules vs practice (why "nothing was followed")

Four sources give four caption lengths [DATA, files named]:
- playbook_winning_formulas.md (09-28, reels): caption = the line + 60-80 words of RELEVANT context. Practice: 8 of 8 IG reels 09-28 14:21Z to 09-29 09:05Z carried 2-13 words (plus hashtags or a music line). Broken 8 of 8.
- shq-draft SKILL.md (09-29): captions "one line + at most 1-2 short sentences". Practice: matches, and is the strictest.
- feedback_long_captions_must_be_relevant_not_boilerplate.md (09-21): 2-4 genuine sentences per carousel. Practice: 0 of 15 IG captions since 09-28 12Z reach 250 chars.
- X: 2-8 words (fine, X is a different platform).
Other caption rules in force [DATA]: never reuse a CTA within 7 days (09-28): "Which one got you?" on 09-29 followed "Which one of these got you?" on 09-28 09:45Z and "Which slide got you?" x3 on 09-26. Cap 😭 at 1 in 3 posts (enforce.mjs): 38% of platform-posts since 09-28. IG "NO single images" (playbook): two IG single images posted 09-29 (12:52Z, our best of the day; 20:41Z, our worst). Same caption on several platforms is on the STOP list (audit 09-29): still 86%.
[INFERRED] The critic scores 7 or 8 on every row (141 of 141 logged with a score) and checks the joke, not caption length, fold or reuse, so the strictest rule wins by default. posts_log "alex" says yes on 11 of 144 logged rows and is empty on 133.

## 9. What to do (caption layer only; each item = WHAT / WHO / WHEN / WHY / KNOW / KILL)

R1. One fold rule for every IG/FB/Threads caption.
- WHAT: the joke lives in the first 125 chars: a verdict in a mate's voice, <= 12 words, naming a person or fanbase, about the consequence not the news, 0-1 emoji, no "🚨 BREAKING" on humour posts. Pattern examples from the winners (do not copy their lines): "[Someone], you're going to [absurd consequence]"; "Even [icon] didn't [verb] [target] this hard"; "I need to see [escalation] on top of [the real sanction]"; "You just know all [club] are getting is [tiny punishment]"; "[Fanbase] fans will never stop [verb]ing man" (ours, 14.3K).
- WHO: the drafting step (shq-draft) and the critic gets a mechanical check. WHEN: from the next post.
- WHY: sections 4-5. KNOW: share of IG/Threads captions passing the fold check = 100%; median 24h views for verdict-voice posts vs restatement posts, weekly, from insights. KILL: if after 30 posts the verdict-voice median is not >= 1.3x the restatement median, drop it as a rule and keep it as a template.

R2. Body-length pilot on IG carousels and reels (needs Alex's OK because it overrides "one line + 1-2 sentences").
- WHAT: after the fold, 60-120 words written fresh for THAT post (real context, a second joke, the stat that makes it funnier), never a slide-by-slide list (keeps Alex's 09-28 rule), never a reusable block. No verbatim filler: it is what four competitors do, but we would be testing account-level reuse risk with our main account (our 09-21 note stands).
- WHO: drafter; fact-checker reads the long caption too (more claims to verify). WHEN: 09-30 to 10-06, alternate same-day carousels short (<= 20 words) and long (60-120), >= 8 pairs, similar hour and story tier.
- WHY: 25 vs 82 posts at 17.1K vs 6.7K median (section 7); 9 of 12 competitors.
- KNOW: 24h views, non-follower reach share and follows per 10K for each arm. Success = long-arm median >= 1.5x AND follows/10K not lower. KILL: ratio < 1.1x on 10-07 after >= 8 pairs, or one non-original flag notice.
- Cost: ~5 min/post plus fact-check. Risk: longer caption = more claims (the 09-28 "Messi" claim was unverified).

R3. Retire the CTA question family and the hashtag habit.
- WHAT: no "Which slide/one got you?" at all; a question only when the subject is polarised and the last line asks a side (Ballon d'Or, Messi v Ronaldo style), max 1 in 5 IG posts, never the same wording within 14 days. Hashtags: max 3 after the body or none (no measurable effect).
- WHY: 15 of 71 posts (21%) with a CTA drew 50 comments on 290K views; competitors 3%; hesaballer's question did 3.6% comments/likes on a polarising topic.
- KNOW: comments per 1K views on the polarised-question posts vs the rest, over 10 posts. KILL: no lift by 10-07, stop questions entirely.

R4. Cut the 😭 and platform sameness.
- WHAT: 😭/😂 in the first line on <= 1 of 4 IG posts (ours 52%, competitors 15%); a native caption per platform (86% of our platform-posts are copies).
- KNOW: enforce.mjs already counts 😭; add the identical-caption ratio; target <= 30% by 10-06.

R5. Match the caption to the hour, not the story.
- WHAT: for a verdict/verdict-day story, the caption needs an angle that is new since the news: the sanction, the appeal statement, the "£900m sham" details, who benefits. A repeat of the headline goes stale in ~3h. If the hour is > 3h after the moment and no new angle exists, no post (Alex's "1 day ago = dead" rule already says this).
- KNOW: for each verdict post log minutes after the first mainstream timestamp (RTÉ, PA, Sky) and the first competitor post; target <= 90 min or skip.

## 10. STOP list (captions)

- STOP: news-sentence openers ("An independent commission found…") on humour posts.
- STOP: "Which slide/one got you?" and any repeated CTA wording.
- STOP: 😭 as a reflex suffix; identical captions across platforms; "Argue below" on Threads.
- STOP: "[Fanbase] fans will see [invented scene]" with no live hinge (the 09-29 Old Trafford line: 7.2K views, 0 follows, a "5 points from 5" stat that was not a same-day event).
- KEEP: "[Fanbase] fans will never stop arguing man" style (our best of the day) and Threads participation lists (101K).
- DOUBLE: verdict-voice first lines on same-hour angles; pilot R2.

## 11. Not measured / caveats

- IG competitor data only; no competitor Threads, X, FB captions. 5-8 posts each (2-5 usable for 6 accounts), one evening, ages 3h-183h.
- I did not see the images. Caption effects are mixed with image, format (reel 945K plays vs 4-slide) and follower base.
- IG's "unoriginal" penalty is thatguysjokes' own claim [GUESS]; nobody here has Meta's ruleset. The 09-29 audit's demotion evidence (non-follower reach 110K -> 16-23K) is in audit_2026-09-29/since-friday.md and points the same way but is not proven.
- Follower counts are 09-20 to 09-28 and rounded; three accounts unknown.
- The 125-char fold is general knowledge, not measured on this account.
- The 17-day caption-length effect is observational (n=107).

Files: /Users/alexanderbrynolsen/ball-iq/social/state/audit_2026-09-30/benchmark_captions.md (this), benchmark_captions_features.json (derived features).
