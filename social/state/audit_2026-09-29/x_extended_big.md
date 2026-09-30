# X extended study, LARGE accounts: what goes massive and why (2026-09-29)

Researcher: x-big. Builds on `research/x_viral_formula_2026_09.md`, `x_hatercentral_growth_2026_09.md`, `x_strategy_2026_09.md`, `x_own_top_2026.md`, `audit_2026-09-29/x_winners_study.md` and `A_GRADE_PLAN.md`. It does not repeat them; where it confirms or contradicts them it says so.
Companion data: `social/state/research/x_extended_big_corpus.json` (200 posts; 188 from 31 accounts with >=150K followers, all with likes >=10K, dated 15 Aug to 29 Sep 2026; every image opened and described).
Evidence tags: **[DATA]** counted or read from the corpus. **[INFERRED]** my reading of the data. **[GUESS]** plausible, not testable here.

---

## 0. Method, and what this can and cannot tell us

**How the posts were found (no x.com scraping, no logged-in session, nothing posted).**
1. `playersells.com/insights/<handle>` (a public third-party tracker, CC-BY stats) lists each account's best recent tweets with tweet URL, date, text, likes, reposts, views, follower count, median likes/views and the number of original posts in 30 days. I tried about 150 football, meme and sport handles; 76 have data.
2. Every tweet ID was re-read through X's public per-tweet syndication JSON for exact text, media type, `created_at` and image URL. The images were downloaded and I looked at all of them as contact sheets (about 30 sheets). The `image_description` field in the corpus is what I saw.
3. For the 25 Sep Man City verdict day I also harvested reaction tweets from news round-ups (Balls.ie, SI, Complex, BBC). Those are small accounts, flagged `in_scope_large_account=false`, used only to study the context effect.

**Corpus [DATA].** 200 posts. 188 are from 31 large accounts (30 have >=200K followers; @TheHateCentral2 has 165K and is kept because it is the study's main comparator). 40 of the 188 come from six "humour" accounts (@TrollFootball, @nocontextfooty, @FootyHumour, @FootballFunnys, @TheHateCentral2, @UTDTrey); the rest are news-meme aggregators, club-fan pages, media brands, official accounts, one pundit and players. By media: 129 photo, 42 video, 16 text-only, 1 GIF.

**Limits.**
- **Selection bias [DATA].** Each account contributes its best posts (max 10). This shows what winners look like, not what separates winners from flops. Every hit rate below is a lower bound.
- **Likes are exact (syndication); views are PlayerSells' number.** n/a means the post has no view figure.
- **Only the humour and aggregator tiers are directly comparable to us.** Official clubs, ESPN FC and 433 win mostly on warmth, access and 5 to 45M followers. They are here to show what NOT to copy.
- **The two 09-24 studies read IG-screenshotted slides; this one reads the tweets themselves.** They agree on the main points (below).
- Player/person identifications inside memes are what I could see; where blurry I describe the picture instead of naming.

---

## 1. The 12 findings that matter (read this if nothing else)

1. **Same-day beats everything [DATA].** 87 of 188 posts (46%) are tied to a match that day or the day before; 19 (10%) to breaking news/scoops; 24 (13%) to a transfer or window moment; 26 (14%) to a scheduled event (draw, kit, award, anniversary); 18 (10%) to a player moment or trend. **Only 14 (7%) are evergreen.** In the 40 humour posts: 20 match-day, 7 transfer-aftermath, 5 trend/aftermath, 3 breaking, 3 calendar, 2 evergreen. The 09-24 IG study found 86% within 48h; this agrees.
2. **The humour tier's winning format is an image or clip where the media carries the joke and the caption is 0 to 9 words [DATA].** Of the 40 humour posts, 11 have NO caption and 29 have one with a median of 9 words. None is over 20 words. 18 of the 29 captions end with no punctuation, 8 of 40 carry any emoji, only 1 uses 😭, none has a hashtag.
3. **Seven of the ten biggest humour posts use one of four picture jobs [DATA/INFERRED]:** a comparison or pun the picture makes by itself (PSG-vs-Galatasaray lineup rows, scallion haircut), a famous reaction template pasted on a fresh event (Mr Bean, Disaster Girl, Tommy Shelby), a screenshot that IS the joke (a yellow-card graphic reading "BLACKMAN"), or a before/after edit (Atletico crest with a prisoner). The other three are caption-less match clips or a nostalgia photo.
4. **Video is 45% of humour-tier hits (18 of 40) but almost all of it is somebody else's clip [DATA/INFERRED].** TikTok watermarks, broadcast bugs, Apple TV frames. Hater Central's first account was suspended in July and the new one already has two copyright takedowns [x_hatercentral study]. **We cannot copy the video half. We can copy the picture half.**
5. **One-line text-only posts do work, but only for personalities [DATA].** @markgoldbridge has 9 text-only posts at 22K to 60K likes, median caption 28 words, all about a same-day story ("City Guilty! And that's the tweet" 37.5K is 5 words). Our own text-only "Wirtz is the Garnacho of Jesse Lingards" (15.8K) is the same object. A text-only post needs a named take and a very short punchline.
6. **The mega-story day is a lottery every format wins [DATA].** On 25 Sep (City guilty on 114 of 115, first reported ~13:30 UTC) I found 12+ posts of 22K to 77K likes within about 100 minutes: reaction videos, a court-room still, "Arteta in the courtroom" (53.8K), a COVID-negative test screenshot ("That 1/115 charge" 63.6K), a De Bruyne clip (76.8K from a small account). **Our own 🚨 fact + Mourinho/Pep photo (77.8K) went up at 14:32 UTC, the top of the photo posts.** On such a day speed and one clear idea beat format.
7. **Follower count hides the real skill [DATA].** Likes as % of followers: @TrollFootball 1.6 to 2.4%, @nocontextfooty 1.8 to 3.2%, @FootyHumour 1.4 to 6.5%, @FootballFunnys 1.0 to 6.1%, ESPN FC 0.5%, Man City official 0.3%, but **@TheHateCentral2 22 to 36%** (59.5K likes on 165K followers) and our own 09-25 post about **172%** (77.8K on ~45K). Hater Central's median original is 18K likes off 44 originals a month. That is not a follower-graph effect. [INFERRED: quote-posting the biggest post of the day, tagging @premierleague/@FIFA/@UEFA, and a high share of meme video make its posts travel to non-followers.]
8. **Most of the big accounts' hits are ordinary output times volume [DATA].** @TrollFootball posts ~9 originals a day, its median post is 15K likes, its 8 corpus hits are only 5 to 8x that median. @nocontextfooty posts ~12.7 a day, median 8K, top 143K (17.8x). Accounts with tiny medians (@FootyHumour median 1,030; @FootballFunnys median 87) produce the outliers: 78x and 800x the median. **Their hits are lottery wins from 130 to 225 tickets a month; ours are 4 to 16 a day.** So each of our tickets must be picture-first and same-day, not filler.
9. **Emotion beats humour in raw likes but is not our lane [DATA].** Big non-Erling posts are wholesome or tribute: Messi retires 144K (B/R illustration), Modric with his parents 109K, Salah holding hands with a young fan 47 to 59K, Pedri puts the armband on Raphinha 81K. Median of the 29 emotion/tribute posts is 64.5K likes vs 45.6K for the humour family. **A warm, specific visual moment can be the punchline of a joke** (Ferguson in a boot, the Mainoo chant), but the tribute format itself belongs to 5 to 45M-follower accounts.
10. **Templates are reused by the biggest accounts; the joke is not [INFERRED].** The Vince McMahon multi-panel ran on @TrollFootball (16 Aug, 78.8K) and @433 (22 Sep, 68.9K), five weeks apart across two accounts. What repeats is the visual grammar; what changes is the subject. Our own 09-29 finding (the torn-kit morph fell 83K to 17K next day) is about the same *joke* the next day. Keep "no same joke twice in 7 days"; drop "no template twice".
11. **What is mocked [INFERRED, the 40 humour posts]:** rival fanbases and clubs (City, Arsenal, United, Spurs, Atletico, Barcelona, 2 to 4 posts each), institutions (UEFA graphics, PGMOL, the international break), transfer sagas, a player's own hair or PR (Haaland scallion, Vidal, Saka). None makes race, religion or nationality the joke, except the "BLACKMAN" screenshot (95.6K), which is the one I would not touch.
12. **Politics/tragedy posts are among the largest news posts, but not for us [DATA].** @TouchlineX's "Republic of Ireland players lowered their heads during Israel's anthem": 80.9K likes, 4.2M views on 27 Sep, a plain photo with "🚨 BREAKING". High reach, high risk (reports and mutes carry the -234/-58.8 weights in the published ranking). Skip.

---

## 2. Taxonomy of formats that go massive (n=188, all large accounts)

Family labels are mine [INFERRED]. Medians are of likes.

| Family | n | Median likes | Median likes % of followers | Who does it | Best example in corpus |
|---|---|---|---|---|---|
| **A. Humour: meme / edit / reaction / deadpan** | 69 | 45.6K | 2.18% | 40 from @TrollFootball, @nocontextfooty, @FootyHumour, @FootballFunnys, @TheHateCentral2, @UTDTrey; 29 from media/club accounts with joke-shaped content | Caption-less lineup rows 143K (@nocontextfooty 30 Aug); haircut = scallion 118K (24 Aug); Mr Bean/UEFA/Fenerbahce 118K (@TrollFootball 27 Aug) |
| **B. Alert / quote / stat card on a portrait** (🚨, bold unicode, 🗣️ quote, STAT:) | 64 | 34.1K | 1.48% | @TouchlineX (16 of 20 use 🚨), @MadridXtra, @BarcaUniversal, Sky Sports PL, Goal, TNT, OneFootball | Ireland anthem 80.9K; Madrid "STAT: Ronaldo 22 goals away" 35K; Barca "Flick: RODRI WILL PLAY TOMORROW" 32.8K |
| **C. Emotion / tribute / hero photo / illustration** | 29 | 64.5K | 1.03% | @brfootball, @433, @ESPNFC, @ESPNUK, @MadridXtra | Messi retirement 144K; Modric with parents 109K; "Gracias, Leo" posters 64K to 84K |
| **D. Live goal / match-moment alert** | 7 | 21.1K | 4.33% | @tekkersfoot | "MAITLAND-NILES HAS EQUALIZED IN THE 96TH MINUTE" 39.5K |
| **E. Text-only take / receipt** | 8 | 34.7K | 2.94% | @markgoldbridge, @UtdFaithfuls | "City Guilty! And that's the tweet" 37.5K |
| **F. Club / league admin banter** | 6 | 89.2K | 0.26% | @premierleague, @ManCity, @ManUtd, @Arsenal, @ChelseaFC | "Don't mind us, @Erling 😂" 107K; "Five wins in a row ✂️👀" 126.7K |
| **G. Player's own account** | 5 | 81.4K | 0.39% | @Erling, @Benzema, @WayneRooney, @M10 | Erling "Short hair don't care" 493K |

### 2.1 The humour tier in detail (n=40)

| Sub-format | n | Examples | Median likes |
|---|---|---|---|
| **Caption-less image/clip: a visual pun or a perfectly framed moment** | 11 | scallion haircut; Vidal "Average haircut in Chile" map; Disaster Girl over a scoreline; PSG/Galatasaray lineup rows; Hater Central's fake "NOTHING x Manchester United x Prime" lockup | 82K |
| **Reaction template on fresh news** | 7 | Mr Bean (Fenerbahce), Vince McMahon (Barca fans), Cillian Murphy (next Argentine no.10), Suarez nail-biting (@UTDTrey) | 79K |
| **Screenshot that is the joke / lookalike / edit / two-panel** | 8 | "Arsenal are playing in the Championship?" (table), "two Mbeumos", Atletico crest, "Uber driver to Spurs", "Barca rebuilding 2018 Man City" | 82K |
| **Clip or observation with a verdict** | 7 | "Why is there an actual cable running across the pitch???", "This celebration is genuinely generational 😭😭", "I told my girl…(there's an international break)" | 22K |
| **Sarcasm / deadpan / pun / fake quote** | 7 | "What a tackle by Rice 👏🔥 POTM soon @premierleague 🤝", "The first CF to play all 90 on the wing ✨", "CITY RICO FINALLY HIT", "“Dad, AC Milan's number 8 told me I'm small.”" | 39K |

**All 40 humour posts, by likes (verbatim caption, what the picture is, context):**

| # | Account | Date | Likes | Views | Caption (verbatim, trimmed) | What the picture is | Context |
|---|---|---|---|---|---|---|---|
| 1 | @nocontextfooty | 08-30 | 143,270 | 3.5M | (none) | Two rows of official-style lineup cards: PSG front three (Kvaratskhelia, Dembele, Doue) above Galatasaray front three (L | TRANSFER_AFTERMATH |
| 2 | @TrollFootball | 08-27 | 118,488 | 3.3M | Fenerbahce qualifies for the Champions League after 18 years | Mr Bean airline scene: UEFA logo on the stewardess, Fenerbahce crest on Bean sneaking past (video meme) | CALENDAR_NEWS (Fenerbahce reach CL) |
| 3 | @nocontextfooty | 08-24 | 118,046 | 1.6M | (none) | Haaland photo pair (long hair / short hair) beside two spring onions (roots intact / roots trimmed): haircut = scallion  | PLAYER_MOMENT_TREND (Haaland haircut) |
| 4 | @nocontextfooty | 09-06 | 101,497 | 999K | (none) | Atletico player on TV with LaLiga scoreboard Athletic 3-0 Atletico stacked on the Disaster Girl smirking-at-fire meme | MATCH_SAME_DAY |
| 5 | @nocontextfooty | 08-17 | 96,651 | 2.2M | (none) | Old Monaco-era photo of Mbappe and Bernardo Silva posing together (both now Real Madrid), no text | TRANSFER_AFTERMATH |
| 6 | @TrollFootball | 09-12 | 95,570 | 1.6M | UEFA getting lazy, can’t even write his name 🤦🏾‍♂️ | Screenshot PSG 4-0 Slovan, yellow-card graphic reading "28 BLACKMAN"; the joke is the graphic reads like a placeholder n | MATCH_SAME_DAY |
| 7 | @nocontextfooty | 08-26 | 94,147 | 3.1M | (none) | Video still: Chelsea player face-down at corner flag while an opponent stands over him, no text | MATCH_SAME_DAY |
| 8 | @TrollFootball | 09-03 | 88,272 | 1.0M | Atletico Madrid's new logo | 2025 vs 2026 Atletico crest; 2026 version has Julian Alvarez behind the crest bars like a prisoner (wants to leave) | TRANSFER_SAGA |
| 9 | @TrollFootball | 09-01 | 84,699 | 1.1M | The next Argentine no. 10 realising who's he gonna get compared to | Cillian Murphy (Tommy Shelby) finger-gun to temple reaction still | NEWS_AFTERMATH (Messi retires 08-31) |
| 10 | @nocontextfooty | 09-10 | 84,179 | 1.6M | (none) | Video still: high tactical camera of a Barcelona attack in a Champions League game, no text | MATCH_SAME_DAY |
| 11 | @nocontextfooty | 09-25 | 83,644 | 678K | (none) | Arturo Vidal selfie with mohawk in Chile kit, text overlay "Average haircut in Chile" and a red arrow to a map of Chile  | TREND_RIDING (haircut wave) |
| 12 | @nocontextfooty | 08-27 | 82,325 | 1.7M | (none) | River Plate goalkeeper mid-stride with ball flying past, stadium banner behind, no text | MATCH_SAME_DAY |
| 13 | @TrollFootball | 08-22 | 81,843 | 1.2M | Man United are playing two Mbeumos and still can't score a goal. | Hull 2-0 Man United scoreboard, two near-identical bearded United players celebrating (Mbeumo lookalike) | MATCH_SAME_DAY |
| 14 | @TrollFootball | 08-23 | 81,784 | 1.4M | Arsenal are playing in the Championship? | Dark-mode league table screenshot: Arsenal, Brentford, Everton, Hull, Ipswich, Leeds top after MD1 | MATCH_SAME_DAY |
| 15 | @nocontextfooty | 09-09 | 81,104 | 2.2M | (none) | Video still: Real Madrid captain (armband) with hands on hips looking annoyed, no text | MATCH_SAME_DAY |
| 16 | @FootyHumour | 09-23 | 80,597 | 1.7M | I told my girl I'd rather spend the weekend with her than watch footba | Video: Argentine coach in suit gesturing on the touchline, ESPN scorebug NOB v RAC; caption is a first-person fan-life j | CALENDAR (international break starts) |
| 17 | @TrollFootball | 08-16 | 79,307 | 2.4M | Opening matchday of Turkish league | Video meme: two old blokes on a bench, one with a Trabzonspor badge, one with Galatasaray badge | CALENDAR (league opener) |
| 18 | @TrollFootball | 08-16 | 78,817 | 782K | Barcelona fans this weekend | 4-panel Vince McMahon shocked-face meme against headlines: Basel 2-5 Barca, Cancelo here we go, Ferran joins PSG, Rodri  | TRANSFER_WEEKEND |
| 19 | @UTDTrey | 09-25 | 73,944 | n/a | Manchester United, Arsenal &amp; Liverpool going to collect all their  | Video still: Luis Suarez biting his nails at a Ballon d'Or ceremony with Ronaldo behind; AI-looking clip | BREAKING_MEGA_STORY |
| 20 | @FootballFunnys | 08-27 | 69,640 | 1.4M | That reply! 🤣 | Rooney family birthday photo overlaid with two comment cards: Rooney "Happy 16th Birthday Kai" and a reply "At 16 you we | PLAYER_MOMENT |
| 21 | @TheHateCentral2 | 09-19 | 59,538 | 2.6M | Saka since turning 25 | TikTok-watermarked clip of a player running/tumbling in red kit; caption is a fake "before/after" claim | MATCH_SAME_DAY (Arsenal lost) |
| 22 | @TheHateCentral2 | 09-16 | 51,862 | 634K | 33 goals in 7 games | IShowSpeed stream reaction screen (Speed in Man Utd shirt) over a talking-head clip | EVERGREEN/STAT_ROAST |
| 23 | @FootyHumour | 09-01 | 47,806 | 743K | Little by little, Barça are rebuilding 2018 Man City 😳 | Barcelona bench photo: Gabriel Jesus, Rodri, Cancelo (all ex-Man City) in Barca kits | TRANSFER_AFTERMATH |
| 24 | @TheHateCentral2 | 09-20 | 47,804 | 3.8M | (none) | Dark tunnel video of Bellingham and teammates walking out; NO caption | MATCH_SAME_DAY (Madrid derby) |
| 25 | @TheHateCentral2 | 09-19 | 43,541 | 350K | Raya complaining about someone impeding him on that corner | Screenshot of a 13-year-old YouTube clip: Blaszczykowski in Dortmund beanie/headphones, title about pronouncing Aubameya | MATCH_SAME_DAY (Raya corner) |
| 26 | @TheHateCentral2 | 09-20 | 43,531 | 397K | The first CF to play all 90 on the wing ✨ | Neutral studio portrait of Mbappe in a suit (formal photo used deadpan) | MATCH_SAME_DAY (Madrid derby) |
| 27 | @TheHateCentral2 | 09-19 | 43,289 | 656K | What a tackle by Rice 👏🔥 /  / POTM soon @premierleague 🤝 | Overhead GIF: Rice jogs beside an opponent, nowhere near the ball; caption is sarcastic praise, tags @premierleague | MATCH_SAME_DAY (Arsenal 0-3) |
| 28 | @TheHateCentral2 | 09-16 | 40,746 | n/a | Drug test everyone @LaLiga @FIFA @ChampionsLeague @UEFA @10Ronaldinho  | Text only; tags @LaLiga @FIFA @UEFA @10Ronaldinho @FBI; conspiracy-mock about Barcelona players wearing bandages | TREND_RIDING (Cancelo bandage) |
| 29 | @FootyHumour | 09-26 | 39,762 | 1.3M | Zidane’s assistant somehow looks more like Zidane than Zidane himself. | Two bald men in a France dugout; caption claims the assistant looks more like Zidane than Zidane | MATCH_SAME_DAY (France-Turkey) |
| 30 | @TheHateCentral2 | 09-19 | 37,598 | 716K | Ngl it can’t even be drugs atp | Text only "Ngl it can't even be drugs atp" (reaction to a Barcelona/Atletico result) | MATCH_SAME_DAY |
| 31 | @TheHateCentral2 | 09-16 | 36,864 | 328K | (none) | Fake graphic: NOTHING x Manchester United x Prime lockup over a night aerial of Old Trafford; no caption | EVERGREEN_FAN_JOKE |
| 32 | @TheHateCentral2 | 09-25 | 29,338 | n/a | CITY RICO FINALLY HIT | Quote-post of Ornstein verdict; clip of a Spain-kit player being shoved by staff; "RICO" pun on the racketeering law | BREAKING_MEGA_STORY |
| 33 | @FootyHumour | 09-25 | 22,299 | 419K | Man City fans heading back to support the clubs they supported before  | Blurry TV clip of a black-coated man running past LED boards (Klopp-style) | BREAKING_MEGA_STORY |
| 34 | @FootyHumour | 09-27 | 21,707 | 5.2M | Why is there an actual cable running across the pitch??? | Apple TV frame: Messi in Inter Miami kit, scorebug NYC 2-1 MIA, spidercam cable across the pitch | MATCH_SAME_DAY |
| 35 | @FootballFunnys | 09-05 | 20,674 | 1.6M | From Uber driver to playing for Spurs... whata downgrade, feel sorry f | Two panels: Mudryk in a car with an Uber pickup card, and Mudryk being subbed on for Tottenham | TRANSFER_AFTERMATH |
| 36 | @FootyHumour | 08-30 | 19,033 | 320K | This celebration is genuinely generational 😭😭 | Two players in dark kits mid-celebration with raised hands, Knox sponsor | MATCH_SAME_DAY |
| 37 | @FootyHumour | 09-04 | 18,546 | 591K | When your scouting department actually knows what they’re doing: | Bundesliga-style graphics card of Alexander Isak in Dortmund shirt, name caption "Alexander Isak" | TRANSFER_AFTERMATH |
| 38 | @FootyHumour | 09-09 | 17,893 | 178K | “Dad, AC Milan’s number 8 told me I’m small.” | Juventus youth beside taller Milan #8 (Loftus-Cheek); caption is a fake child quote | MATCH_SAME_DAY |
| 39 | @FootballFunnys | 08-24 | 12,767 | 603K | “Josh King shoots from the edge of the box” /  / Robert Sanchez: | Wildlife video: crocodile in a drain, caption puts a goalkeeper name in the joke | MATCH_SAME_DAY |
| 40 | @FootballFunnys | 08-22 | 10,958 | 338K | INSANE we are treated to this on Gameweek 1 of the new season 🤣 | Phone-filmed TV screen: Tottenham player in kit during anthem (Gameweek 1) | MATCH_SAME_DAY |

### 2.2 Account table (30-day figures from PlayerSells)

| Account | Tier | Followers | Orig. posts /30d | Median likes | Corpus posts | Top likes | Top ÷ median |
|---|---|---|---|---|---|---|---|
| @TrollFootball | humour | 5.0M | 272 | 15,072 | 8 | 118,488 | 7.9x |
| @nocontextfooty | humour | 4.4M | 381 | 8,066 | 9 | 143,270 | 17.8x |
| @UTDTrey | humour | 1.8M | n/a | n/a | 1 | 73,944 | n/a |
| @FootyHumour | humour | 1.2M | 226 | 1,030 | 8 | 80,597 | 78.2x |
| @FootballFunnys | humour | 1.1M | 133 | 87 | 4 | 69,640 | 800.5x |
| @TheHateCentral2 | humour | 165K | 44 | 18,321 | 10 | 59,538 | 3.2x |
| @TouchlineX | news-meme aggregator | 1.8M | 955 | 1,274 | 10 | 80,900 | 63.5x |
| @tekkersfoot | news-meme aggregator | 488K | 123 | 3,177 | 10 | 39,525 | 12.4x |
| @MadridXtra | club fan/news | 2.2M | 1132 | 2,877 | 9 | 109,501 | 38.1x |
| @BarcaUniversal | club fan/news | 1.6M | 926 | 1,758 | 10 | 46,148 | 26.3x |
| @UtdDistrict | club fan/news | 1.0M | 795 | 211 | 4 | 15,192 | 72.0x |
| @UtdFaithfuls | club fan/news | 540K | 145 | 4,394 | 8 | 19,420 | 4.4x |
| @markgoldbridge | pundit/creator | 1.2M | 310 | 2,697 | 9 | 59,693 | 22.1x |
| @ESPNFC | media brand | 17.4M | 228 | 14,870 | 10 | 92,709 | 6.2x |
| @SkySportsPL | media brand | 13.2M | 482 | 2,198 | 8 | 73,172 | 33.3x |
| @goal | media brand | 10.4M | 408 | 1,259 | 9 | 33,874 | 26.9x |
| @brfootball | media brand | 7.8M | 452 | 12,016 | 10 | 144,368 | 12.0x |
| @433 | media brand | 6.3M | 501 | 9,020 | 10 | 109,906 | 12.2x |
| @footballontnt | media brand | 2.5M | 702 | 1,408 | 10 | 33,706 | 23.9x |
| @ESPNUK | media brand | 1.8M | 404 | 6,780 | 10 | 63,500 | 9.4x |
| @OptaJoe | media brand | 1.4M | 187 | 1,315 | 2 | 12,065 | 9.2x |
| @OneFootball | media brand | 448K | 155 | 1,452 | 5 | 20,261 | 14.0x |
| @premierleague | league official | 46.3M | 560 | 12,900 | 2 | 106,933 | 8.3x |
| @ManUtd | club official | 38.3M | 389 | 9,697 | 1 | 81,332 | 8.4x |
| @ChelseaFC | club official | 25.6M | 379 | 16,515 | 1 | 70,392 | 4.3x |
| @Arsenal | club official | 21.7M | 423 | 8,020 | 1 | 76,101 | 9.5x |
| @ManCity | club official | 17.9M | 442 | 7,188 | 1 | 97,078 | 13.5x |
| @M10 | player | 22.7M | 10 | 3,590 | 2 | 60,241 | 16.8x |
| @Benzema | player | 21.0M | 2 | 69,991 | 3 | 81,439 | 1.2x |
| @Erling | player | 16.6M | 19 | 81,556 | 2 | 493,094 | 6.0x |
| @WayneRooney | player | 14.3M | 2 | 25,324 | 1 | 55,571 | 2.2x |

Three patterns [INFERRED]:
- **Steady machines** (@TrollFootball, @nocontextfooty, @TheHateCentral2): high median, hits only 3 to 18x it. The algorithm already favours them; a post starts big.
- **Lottery accounts** (@FootyHumour, @FootballFunnys, @TouchlineX, @MadridXtra, @UtdDistrict): tiny median, top post 26x to 800x. This is our model: small median, rare huge outliers. Nothing about their median predicts the hit.
- **Warmth machines** (ESPN FC, B/R, 433, clubs): top posts 6 to 14x median, all emotion or access.

---

## 3. Caption mechanics [DATA unless tagged]

| Metric | Humour tier (29 captions of 40 posts) | Aggregators + club-fan pages (51) | Media brands (74) |
|---|---|---|---|
| Median words | **9** | 17 | 13 |
| <=8 words | 11 (38%) | 3 (6%) | 17 (23%) |
| Over 20 words | **0** | 21 (41%) | 16 (22%) |
| No caption at all | **11 of 40** | 0 | 1 |
| Any emoji | 8 of 40 (20%) | 49 of 51 (96%) | 70 of 74 (95%) |
| 🚨 | **0** | 35 of 51 | 4 |
| Hashtag | 0 | 1 | 1 |
| @-mention | 2 (Hater Central tags @premierleague, @FIFA, @UEFA, @LaLiga, @FBI) | 5 | 0 |
| Ends with no punctuation | 18 of 29 | 21 of 51 | 15 of 74 |
| Question mark | 2 ("Arsenal are playing in the Championship?", "…cable…???") | 1 | 5 |

**Mechanics that repeat in the humour tier:**
1. **Subject + deadpan predicate, no adjectives.** "Man United are playing two Mbeumos and still can't score a goal." "UEFA getting lazy, can't even write his name". The comedy is the noun phrase.
2. **The caption names a group, not a person: "Barcelona fans this weekend", "Man City fans heading back to support the clubs they supported before 2008".** Audience-as-subject (fanbase POV) is the top frame after the caption-less picture (at least 3 of 29).
3. **A colon that hands the picture the punchline:** "When your scouting department actually knows what they're doing:" [Isak graphic]; "“Josh King shoots from the edge of the box” Robert Sanchez:". The caption is the setup, the image the answer. 2 of 29.
4. **A fake quote in quotation marks over a real photo:** "“Dad, AC Milan's number 8 told me I'm small.”" (17.9K).
5. **A first-person confession with a parenthetical** ("I told my girl I'd rather spend the weekend with her than watch football (there's an international break)", 80.6K): the only long caption in the top 16. The parenthesis is the whole punchline.
6. **Sarcastic praise with an @ to the authority that would judge it:** "What a tackle by Rice 👏🔥 POTM soon @premierleague 🤝". The clap and flame are the sarcasm; the tag pulls in the target's fans.
7. **A milestone-shaped label:** "Saka since turning 25", "33 goals in 7 games", "The first CF to play all 90 on the wing ✨" (over a neutral Mbappé portrait).
8. **A pun, once:** "CITY RICO FINALLY HIT" (quote-post of the Ornstein report).
9. **Emoji, if any, is the reaction, not the joke:** 🤦🏾‍♂️, 😳, 🤣, 😭😭 once. Never a row of 🚨.
10. **Tone: never explains.** No caption in the 40 has a second sentence explaining the first, except the "Josh King" video, where the second line is the punchline.

**Where the aggregator/media tier differs:** bold-unicode 🚨 headlines (𝗕𝗥𝗘𝗔𝗞𝗜𝗡𝗚, 𝗡𝗘𝗪, 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋), a `🗣️` quote in quotation marks, 15 to 25 words, a portrait as the picture. That is what news looks like, the opposite of humour. **Our 09-25 🚨 post worked because it is a same-day mega-story fact tied to a fanbase punchline; it was already the exception in our own winner list.**

---

## 4. Visual mechanics (what I saw)

1. **One idea per image, understood in under a second.** The most-liked humour post (143K) is two rows of three headshots and no text. The third (118K) is a haircut beside a scallion. Neither needs a caption because the picture is a comparison.
2. **Split before/after is the top visual grammar.** Long hair vs short hair + scallion; 2025 vs 2026 crest; PSG trio above Galatasaray trio; Barca huddle above England huddle ("Déjà vu for Gordon" 68.9K). The reader finds the difference, which is the "click".
3. **A famous reaction template on a new event beats a new picture.** Vince McMahon multi-panel (2 posts), Mr Bean, Cillian Murphy, Disaster Girl, Brendan Fraser (ours). Zero decoding time.
4. **The screenshot is the joke.** League table, scoreboard, yellow-card graphic, a reply under a birthday photo (69.6K), a court-room photo. Real UI equals credibility and shareability.
5. **Neutral portrait + absurd claim.** Mbappé in a suit under "The first CF to play all 90 on the wing ✨".
6. **A small brand mark in a corner is normal** (Troll's two-line mark, 433 top-left, B/R shield). Nothing fancy.
7. **Vertical 4:5 posters** (433, OneFootball, Goal, B/R) are the news-brand look. The humour tier uses whatever shape the source is; presentation does not win the humour tier.
8. **Illustration works for feelings, not jokes.** B/R's cartoon Messi and goat (144K) and its France-in-a-wall cartoon (74K) are tribute or mild irony. Cartoons rarely appear in the humour tier.
9. **Text on top of the picture is rare in the humour tier.** Exceptions put the punchline inside the picture (Vidal "Average haircut in Chile", Rooney comment cards) and the caption is then short or empty.
10. **Video: the first frame is a face or a mid-action still** (a captain with hands on hips, a keeper mid-stride, Bellingham in a tunnel). The 5 caption-less videos have no visible text.

---

## 5. Context: what was happening

Calendar for the window [DATA from the tweets plus BBC/ESPN/Sky/FootballMoments round-ups]: **16 Aug** Community Shield (Arsenal 3-0 City), Rodri to Barcelona. **22 to 23 Aug** Haaland's haircut. **27 Aug** UCL draw, Fenerbahce back in the CL. **31 Aug** Messi retires from Argentina; Benzema leaves Al-Hilal. **1 Sep** window closes (Barcola to Liverpool, Baleba to United). **8 Sep** Ballon d'Or shortlist. **13 Sep** Manchester derby (Foden sent off, disputed Haaland goal). **19 to 20 Sep** Brighton 3-0 Arsenal, Madrid derby, City 5-3 Sunderland. **21 Sep** three-week international break starts. **25 Sep** City guilty 114/115. **26 Sep** Spain 3-2 England at Wembley (Kane misses a penalty). **27 Sep** Ireland v Israel. Ballon d'Or ceremony: 26 Oct, London (ESPN); Hater Central's campaign page says 30 Oct.

How the same story produced different winners:
- **Haaland haircut (22 Aug to 25 Sep):** Haaland himself 493K; @nocontextfooty scallion pair 118K (24 Aug); @tekkersfoot "Pep Guardiola's reaction…" 33K; @sportbible 30K; @premierleague "Enjoy your sleep, @Erling 😴" 105K (1 Sep, on Enzo's signing); @ManCity "Five wins in a row ✂️👀" 126.7K (13 Sep, the payoff); @nocontextfooty Vidal/Chile map 83.6K (25 Sep). **A trend that keeps being fed lives 3+ weeks on X.**
- **Messi retires (31 Aug):** @433 poster 66K at 15:10 UTC, @brfootball news 70K at 15:18 and tribute video 144K at 15:44, @TrollFootball's Cillian Murphy joke 84.7K about 19 hours later, about the successor rather than Messi.
- **City verdict (25 Sep, news ~13:30 UTC):** 13:45 @SxrgioSZN "Only found guilty of 114 charges instead of 115" 71.8K; 13:53 @TheHateCentral2 "CITY RICO FINALLY HIT" 29.3K; 14:03 @markgoldbridge 37.5K; 14:04 "Arteta in the courtroom" 53.8K; 14:32 **@ShithouseryHQ 77.8K**; 14:42 "That 1/115 charge" 63.6K; 15:09 @UTDTrey 73.9K; 15:23 De Bruyne "Greatest player to never win a prem title" 76.8K; 19:00 @FootyHumour 22.3K. **Ninety minutes to two hours after the news, one strong picture: most of the top posts were 15:30 or earlier. The 19:00 latecomer got 22K.**

**Evergreen exceptions [INFERRED]:** the 143K lineup rows (30 Aug) and 96.7K Mbappé + Bernardo Silva Monaco photo (17 Aug, both now Real Madrid) were not tied to that day's headline; they were "look at the current squad" frames on transfers that had already happened. Old photos of players who are now teammates work; old photos with no current link do not [GUESS].

---

## 6. Timing [DATA]

- Humour-tier hits by hour UTC (n=40): 07 to 10: 13; 12 to 15: 12; 16 to 18: 5; 19 to 21: 10. In Oslo (UTC+2): 09 to 12, 14 to 17, 18 to 20, 21 to 23.
- By weekday: Sat 9, Sun 9, Wed 7, Thu 5, Fri 5, Mon 3, Tue 2. **Weekends = 45% of hits** (match-day).
- **International-break week (21 to 27 Sep): 7 of the 40 humour hits, 24 of all 188.** The break itself produced content (FootyHumour 80.6K; B/R France cartoon 74K) and the City verdict took the rest.
- Time from event to hit: match moments in the 20 same-day humour posts were posted 30 to 120 minutes after the moment [INFERRED from timestamps and scorelines]; verdict reactions within 100 minutes.
- **Nothing supports post-midnight posting:** only 5 of 188 hits were created between 00:00 and 06:00 UTC.

---

## 7. What the huge accounts do that we don't [INFERRED from DATA]

1. **Volume as a portfolio [DATA].** @TrollFootball 272 originals/30d (9/day), @nocontextfooty 381 (12.7/day), @FootyHumour 226 (7.5/day), @FootballFunnys 133 (4.4/day), @TouchlineX 955 (32/day). We plan 4 to 6/day by hand. Low-median accounts hit >=10K on 3 to 4% of posts (lower bound). At 5/day that is one hit every 6 to 7 days if we matched them.
2. **They post the picture, not the caption (11 of 40 humour hits have none) [DATA].** We write a line for every post.
3. **Signature templates revisited** (Vince McMahon multi-panel, "🚨 STAT:" cards, table screenshots). They repeat the grammar and rotate the subject.
4. **Tagging the authority or the target** (@premierleague, @FIFA, @ballondor, @Erling) so that fanbase and account join the thread [DATA: 2 of 40 humour posts; official accounts do it in banter posts].
5. **Quote-posting the biggest post of the day** (Hater Central quoted Ornstein 20 minutes after the news, 29K; earlier study: Fabrizio's 7.5M-view post quoted 2.5h late, still 1.2M views).
6. **A bench of reaction images and screenshots** (30 to 60 stills; table/scoreline/IG-comment screenshots). We start each post from scratch.
7. **One story fed for weeks** (haircut: 6 to 8 posts across formats over 5 weeks).
8. **Official accounts run in-jokes with players** (@premierleague/@ManCity ↔ @Erling). We cannot copy the access.

## 8. What NOT to copy

1. **Pure clip reposting** (broadcast bugs, TikTok watermarks): it is the likely reason Hater Central's first account died; earns nothing under OCR; copyright takedowns are visible on the new one [x_hatercentral study].
2. **Caption-less posts as a policy.** @nocontextfooty's name is the caption; at 4.4M followers empty works. At 45K an empty caption reads as unfinished. Use it for one post a week, not a rule.
3. **Real-tragedy / geopolitical posts** (Ireland v Israel anthem 80.9K, Musiala collapse 62K): reach with reports/mutes attached.
4. **The "BLACKMAN" screenshot joke** and anything that points at a person's race or origin.
5. **Fake quotes** (a Community Note voids OCR). All quote templates below use real quotes.
6. **Bold-unicode 🚨 headlines on every post** (@TouchlineX needs 955 originals a month for 10 hits >=10K). We are not a wire and would lose every speed race.
7. **Warm tributes and club announcements.** They lead raw likes but their engine is followers (0.26 to 1.5% like rate).
8. **Hashtags** (only official accounts and B/R use them).
9. **A bare 🚨 with no picture.** Our own 🚨 hit had a photo and a same-day story.
10. **Quote cards** (already banned in A_GRADE_PLAN): the corpus's quote-on-portrait posts (Barca/United fan pages, TouchlineX) median ~34K but on 0.5 to 2.2M followers, and the quote is the news. For us a quote card is not news.

---

## 9. What already matches the data

- **Our 09-25 post is on trend [DATA]:** fact + photo on a mega story 77.8K; best reaction videos at the same hour 73K to 77K.
- **3 to 8 word captions on image jokes [DATA]:** 11 of 29 humour captions <=8 words, median 9.
- **One-line text comparisons [DATA]:** Goldbridge's 5-word verdicts and our Wirtz line are the same object.
- **Fanbase POV frame [DATA]:** at least 3 of the 29 humour captions.
- **No image-less filler.** 16 of 188 hits are text-only, and 9 of those are one personality.

---

## 10. 25 ready-to-use templates in our voice

Format: **name** (source proof) then template, worked example on a live story, why it works, needs. Every example that quotes a person or states a number carries [VERIFY] and goes through the social-fact-checker before posting. Live stories used: City verdict and appeal (Liverpool v City 11 Oct), Ballon d'Or campaign (26 Oct), the international break, Spain 3-2 England (Kane pen), Spurs' start, Man United under Carrick, Arsenal's first defeat, Haaland's haircut, Messi's retirement.

**T1. Before/after crest** (@TrollFootball "Atletico Madrid's new logo" 88K)
- Template: "[Club]'s new [logo/kit/badge]" + a two-panel old vs new with the joke edit.
- Example: image = Man City badge 2025 vs 2026, the 2026 one with an asterisk after the year. Caption: **"Man City's new badge"**.
- Why: the reader finds the difference; 4 words; the 114 charges are already in their head.
- Needs: a badge edit; nothing else.

**T2. "X are playing in the Championship?"** (@TrollFootball table screenshot 81.8K)
- Template: a real league-table screenshot + one question.
- Example: table screenshot with Spurs bottom on 2 points [VERIFY]. Caption: **"Spurs are playing in the Championship?"** Alt: table with City top: **"Man City are top of the Championship?"**
- Why: real UI is credible; the question forces a reply; the different-league framing is the whole joke.
- Needs: a fresh real screenshot on the day.

**T3. Vince McMahon multi-panel** (@TrollFootball "Barcelona fans this weekend" 78.8K; @433 68.9K)
- Template: 4 real headlines on the left, escalating shocked face on the right, caption "[Fanbase] this [weekend/month]".
- Example: panels "City appeal" / "Liverpool v City 11 Oct" / "PL back 10 Oct" / "Ballon d'Or 26 Oct" [VERIFY dates]. Caption: **"Football fans after the international break"**.
- Why: pre-decoded meme; the headline list does the work.
- Needs: 4 real headline crops.

**T4. Lookalike, "two of X"** (@TrollFootball two Mbeumos 81.8K; @FootyHumour Zidane's assistant 39.8K)
- Template: a screenshot with two similar-looking people + "[Team] are playing two X and still can't Y".
- Example: an England huddle photo with two fair-haired players. Caption: **"England are playing two Fodens and still can't score from the spot"** [pick the frame on the day; VERIFY that both are in shot].
- Why: reads as a real observation; the failing clause pins it to the current story.
- Needs: a genuine lookalike.

**T5. "[Fanbase] when [event]" + famous reaction still** (@TrollFootball Tommy Shelby 84.7K; ours Brendan Fraser 345K)
- Template: "[Fanbase] realising/opening/at" + one reaction still.
- Example: Cillian Murphy-style still: **"Man City fans opening the group chat"**.
- Why: the fanbase is the subject; the still is the reaction.
- Needs: one reaction still, ideally in the fanbase's kit.

**T6. Sarcastic praise + tag** (@TheHateCentral2 Rice 43K)
- Template: "What a [act] by [player] 👏 [reward] soon @[authority]".
- Example: GIF of Yamal posing: **"What a campaign by Yamal 👏🔥 Ballon d'Or soon @ballondor 🤝"** [the "deserve" quote is real per press; VERIFY].
- Why: the clap and flame are the sarcasm; the tag draws the authority's fans.
- Needs: a GIF/clip we may cut; no insults.

**T7. Deadpan portrait + false record** (@TheHateCentral2 "The first CF to play all 90 on the wing ✨" 43.5K)
- Template: a neutral headshot + "The first [role] to [absurd true-ish fact] ✨".
- Example: Maresca portrait: **"The first manager to win five in five and still be the second biggest story at his club ✨"** [VERIFY five in five].
- Why: a straight face reads as authority; the ✨ is the wink.
- Needs: a studio portrait.

**T8. "[Player] since [milestone]:"** (@TheHateCentral2 "Saka since turning 25" 59.5K)
- Template: one label + a still of the fall.
- Example: still of Kane at the spot: **"Kane since the Wembley penalty:"** [VERIFY what happened; press says he slipped and hit the bar].
- Why: two facts implied in five words; the picture is the punchline.
- Needs: a lawful still (agency photo, not a recorded broadcast).

**T9. Fake announcement lockup** (@TheHateCentral2 NOTHING x Manchester United x Prime 36.9K)
- Template: a stadium aerial + "[Brand] | [Club] | [Brand]" lockup, no caption.
- Example: Etihad aerial + **"PLAUSIBLE DENIABILITY | MANCHESTER CITY | LEGAL FEES"**.
- Why: reads as a real announcement for a second; the brands are the joke.
- Needs: invented brand names only; obviously parody.

**T10. Old confident statement + one word** (receipts formula, x_hatercentral)
- Template: quote-post the REAL old post + one word.
- Example: quote a real City statement or supporter claim from 2023/24 that they had "irrefutable evidence" [F365 recalls City's use of the phrase; find the exact post; VERIFY]. Caption: **"Irrefutable."**
- Why: the past does the work; one word is the verdict.
- Needs: a real, dated post; never an edited screenshot.

**T11. "X is the Y of Z"** (ours Wirtz 365K views)
- Template: a text-only comparison of two current things.
- Example: **"The Ballon d'Or campaign is Love Island for men who already own a trophy"**.
- Why: the reader completes the picture; short.
- Needs: a strong subject, not a stat.

**T12. Five-word text verdict** (@markgoldbridge "City Guilty! And that's the tweet" 37.5K)
- Template: 4 to 6 words, a pun or verdict.
- Example: **"Man City: 114 not out."**
- Why: a cricket pun as a verdict; compact and quotable.
- Needs: post within 2 hours; no image.

**T13. 🚨 fact + best photo on a mega story** (ours 09-25, 77.8K)
- Template: "🚨 [Fact about a small punishment]. [Fact about the accused]." + a period photo.
- Example (when the sanction lands): **"🚨 Nottingham Forest were deducted 4 points for one breach. Manchester City: guilty of 114."** [VERIFY the Forest figure; Everton's 6 was used on 09-25].
- Why: a small penalty next to a huge breach is a comparison; the photo carries the mood.
- Needs: only on a genuine same-day mega story (once a fortnight).

**T14. Relatable confession with the twist in brackets** (@FootyHumour 80.6K)
- Template: "I told my [person] I'd rather [good thing] than [watch team] ([reason that shows no sacrifice])".
- Example: **"I told my wife I'd rather spend the weekend with her than watch Spurs (Spurs are bottom)"** [VERIFY].
- Why: universal fan-life; the bracket is the joke.
- Needs: a photo or clip of any person reacting.

**T15. Real reply screenshot** (@FootballFunnys "That reply!" 69.6K)
- Template: photo of a real post with a real reply overlaid, caption "That reply!".
- Example: a player's own post plus its best real reply [must exist; pick on the day]. Caption: **"That reply!"**
- Why: the reply is the joke; 2 words.
- Needs: a real post and reply, `overlay.mjs` rules.

**T16. Two-panel hype vs reality** (@FootballFunnys "Uber driver to Spurs" 20.7K; @FootyHumour "Barça rebuilding 2018 City" 47.8K)
- Template: panel 1 claim, panel 2 reality, caption = the sad line.
- Example: panel 1 "£300m summer" [VERIFY], panel 2 the table. Caption: **"Spurs this month"**.
- Why: contrast without adjectives.
- Needs: two real images.

**T17. Stat collision** (@TouchlineX Foden/Bruno key passes 48.5K)
- Template: "[A] has [stat]. [A] has also [contradicting stat]."
- Example: **"Man City have won five in five. Man City have been found guilty on 114 of 115."** [VERIFY].
- Why: two numbers that look like a ruling.
- Needs: a verified pair.

**T18. Fake child/fan quote over a photo** (@FootyHumour 17.9K)
- Template: “[kid or fan says a line about what is in the picture]”.
- Example: photo of a very young academy player beside a huge defender: **“Dad, Man United's academy told me JJ Gabriel is too young.”** [VERIFY JJ Gabriel's age; clearly a made-up voice].
- Why: an invented voice is safe and clearly a joke; the child's voice adds pathos.
- Needs: a photo where the size gap is visible.

**T19. Observational question about a weird detail** (@FootyHumour "cable across the pitch???" 21.7K, 5.2M views)
- Template: "Why is there [odd thing] [location]???"
- Example: use only when a real oddity appears on screen; the 27 Sep spidercam cable is @FootyHumour's, so wait for the next real one.
- Why: the reader hunts for the oddity; the question marks are the scream.
- Needs: a genuine oddity, never an invented one.

**T20. Nickname the fixture** (Dominos "El Clownico" from x_viral_formula; ours Cardio Man)
- Template: "[Nickname]" over a fixture graphic.
- Example: fixture card Liverpool v City (11 Oct) [VERIFY]: **"The Guilty Trip"**.
- Why: a name is reusable and points back to the coiner.
- Needs: a fixture card and a name.

**T21. One-word smug caption + iconic photo** (@UtdDistrict Mourinho scarf on the verdict; @ManUtd "Aura." 81K)
- Template: a photo with a readable face + one word.
- Example: Mourinho (or Pep) photo: **"Guilty."**
- Why: a headline and a joke in one word.
- Needs: a photo with a face that reads.

**T22. ALL-CAPS sarcastic thanks** (@TouchlineX "WE SHOULD THANK ARBELOA AND XABI ALONSO…" 67.9K)
- Template: "WE SHOULD THANK [X] FOR [ironic benefit]" + a glum-face photo.
- Example: **"WE SHOULD THANK THE INTERNATIONAL BREAK FOR GIVING US THREE WEEKS TO READ ALL 114 CHARGES"**.
- Why: caps read as a stadium chant.
- Needs: one glum photo.

**T23. Trend-pun edit, no caption** (@nocontextfooty scallion 118K; Vidal/Chile 83.6K)
- Template: a visual pun on this week's trend, no text.
- Example: Mbappé's "the chosen one" [real quote per Goal] portrait beside Neo from The Matrix, no caption.
- Why: the trend is already in the audience's head; the pun is instant.
- Needs: an edit; do not label it.

**T24. Calendar cartoon** (B/R "First international break since the World Cup" 74K; @FootyHumour break joke 80.6K)
- Template: a graphic showing how fans feel about the calendar.
- Example: cartoon of twenty fans at a locked stadium door: **"First Saturday of the break"**.
- Why: every fanbase shares it; no team needed.
- Needs: an original graphic; use in dead weeks.

**T25. Live-moment 8-word line within minutes** (@tekkersfoot alerts; @markgoldbridge live lines)
- Template: "[fact of the moment] + tiny verdict" inside 60 to 120 minutes.
- Example (on the sanction announcement): **"Sanction announced. City's legal team not out."**
- Why: it matches the 30 to 120 minute window.
- Needs: Alex online; no image needed if the line is a verdict.

---

## 11. What to do with this

1. **Make three picture-first templates the default:** T1 before/after, T2 table screenshot, T3 multi-panel. All picture-carried, 2 to 8 words, no video.
2. **Always name the group or object in the caption** ("Barcelona fans", "UEFA"): the caption's job is to name the target; the picture does the rest.
3. **Run one story as a three-week series** (City verdict and appeal; Ballon d'Or campaign).
4. **Build the bench:** 30 reaction stills, 10 recurring screenshot types, 5 blank crest/badge templates.
5. **Test caption-less once a week only.**
6. **Keep the hit-conversion routine** (A_GRADE_PLAN) for anything at >=5x our median.

Files: corpus `/Users/alexanderbrynolsen/ball-iq/social/state/research/x_extended_big_corpus.json`. Raw pulls and contact sheets: `/private/tmp/xbig` (temporary).
