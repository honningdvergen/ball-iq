# X extended study, SMALL and MID accounts: what makes an unknown account's football-humour post go massive (2026-09-29)

Builds on `research/x_viral_formula_2026_09.md`, `research/x_own_top_2026.md`, `audit_2026-09-29/x_winners_study.md`, `A_GRADE_PLAN.md`. Corpus: `social/state/research/x_extended_small_corpus.json` (467 posts, 428 accounts; 129 football posts from 113 accounts; each record has id, url, account, followers, date, text, media, likes, shape, context, joke target, reply bait, image description).
Tags: [DATA] = read from X's per-tweet syndication JSON or a source page, [INFERRED] = my reading of the evidence, [GUESS] = plausible, untested.

## 0. TL;DR (10 lines)

1. **The unknown-account winner is a reaction clip or a film still mapped onto a same-day story, with a 3 to 12 word label.** The clip or still is the setup; the caption is only a name tag ("Arteta in the courtroom", 53.8K likes from a 10K-follower account). [DATA + INFERRED]
2. **The window is the biggest football story of the day, 20 to 120 minutes after it lands, not the first 5.** On 25 Sep (City found guilty), posts 0 to 15 min after the scoop had median 15.9K likes; posts 46 to 120 min after had median 31.6K. [DATA]
3. **28 of 84 non-large football hits were posted on one day (25 Sep) and 46 of 84 fall on 4 event days.** A small account does not go massive on a quiet day; it goes massive on a mega-story day by out-executing the crowd. [DATA]
4. **Piggybacking a mega post is a real mechanic.** 6 of the hits are native quote-tweets of one Ornstein scoop (359K likes): 7ahul 59.7K, DrAashish_ 70.2K (zero-word caption), Rio Ferdinand 51K, etc. [DATA; mechanism INFERRED]
5. **Small accounts routinely exceed their follower count 3 to 5x** (10K followers, 53.8K likes; 18K, 55K; 16K, 45K; 5.5K, 17K). Non-football text jokes reach 20 to 50x, but that list is a BuzzFeed-curated selection. [DATA]
6. **65% of small-account football winners are VIDEO (reposted TikToks, film clips, streamer faces).** Only 18% are images and 17% are text-only. That is the biggest mismatch with our image-led plan. Video is also where copyright takedowns hit (3 of 129 show "removed at request of copyright holder"). [DATA]
7. **Ragebait here is rival-bait, not hate-bait.** The replies come from the target fanbase correcting, defending or counting trophies. The darkest big hit (a skinhead film still captioned about Enzo Fernandez and Semenyo, 60K) rides a real racism controversy: do not copy. [INFERRED]
8. **Emoji/hashtag hygiene matches the 09-24 study:** 0 hashtags on 72 of 73 humour posts, 0 of 73 humour posts use 🚨 (10 of the 26 news cards do), 😭 on only 6 of 73.
9. **What does not transfer:** brand-account reach (Paddy Power, Domino's), Spanish/Portuguese clip memes (25 of 129), broadcast clips, news-card aggregators.
10. Section 10 has 25 ready templates with worked examples on the current stories. Every number in them must be re-checked at posting.

## 1. Data and method (and where it is weak)

- **Discovery.** X cannot be searched by script, so I found tweet IDs through pages that embed tweets: Balls.ie "best memes" roundups, Thick Accent, SI "Soccer world reacts", Fan Banter, Spanish-language "mejores memes" pages (El Universal, Mediotiempo, Milenio, TyC, MDZ, ndmais), BuzzFeed weekly "hilarious tweets" lists, HuffPost roundups, Pulse Sports Nigeria. Helpers extracted status links from those pages (Firecrawl on non-x pages) and I checked each id with `cdn.syndication.twimg.com/tweet-result` (likes, text, media, date). 1,317 ids checked, 567 had 5,000+ likes in 15 Aug to 29 Sep 2026.
- **Followers** came from xbeast.io snapshots (third-party analytics page, not x.com). Found for about 26% of accounts (136 of 509). Where missing, `followers: null` and I tagged size `unknown` or `large` from prior knowledge [GUESS]. So "small/mid" = known under 200K (96 posts, 85 accounts, 21 of them football) plus unknown-size accounts not on a large list. Football non-large: **84 posts, 81 accounts.** Football all: 129 posts, 113 accounts.
- **Images:** I downloaded every football post's media (photo, or the video's first frame) and looked at contact sheets of all 129 plus 36 non-football ones. For videos I saw only the poster frame, so the motion joke is [GUESS].
- **Weaknesses.** (a) Selection bias: everything here is a winner; no losers, no view counts. (b) The corpus clusters on one mega-story day. (c) Followers are partial. (d) Non-football entries mostly come from BuzzFeed's curated weekly lists, so their follower ratios are inflated by curation. (e) Whether a post was reposted or quoted by a big account is not visible in syndication.
- **Rule note.** No Chrome, no scripting of x.com. Two things to disclose: one helper's Firecrawl search call used `scrapeOptions`, which made Firecrawl fetch x.com/NFLMemes and x.com/shamus_clancy (30 credits each; not ours to control, stopped immediately). Exa returned a few nitter-mirror search snippets; I did not fetch those pages.

## 2. What the corpus looks like

| Cut | n | Note |
|---|---|---|
| Posts checked | 1,317 ids | 1,194 valid tweets in first pass, 103 more in round 2 |
| 5K+ likes | 567 | football-relevant 129 (my regex plus manual review), the rest general humour |
| Football, non-large | 84 posts / 81 accounts | 28 of them on 25 Sep |
| Football, video | 55 of 84 (65%) | text-only 14 (17%), image 15 (18%) |
| Football, non-English | 23 of 84 (27%) | Spanish and Portuguese clip memes |
| Quote-tweets among 129 football | 15 | 6 quote one Ornstein scoop |
| Known-follower small accounts with hits | 85 accounts | see ratios below |

Follower-vs-likes evidence for small accounts [DATA]:

| Account | Followers | Post | Likes | Ratio |
|---|---|---|---|---|
| ModernWrighty | 10K | "Arteta in the courtroom" + film still | 53.8K | 5.4x |
| PamelaNjoku2 | 18K | City fans "returning to their clubs" + Klopp run clip | 55.0K | 3.1x |
| _Mac_lfc | 21K | Enzo when Semenyo asks for the ball (dark) | 60.5K | 2.9x |
| ewan10i | 16K | "World Cup fans experiencing their first Haaland final" | 44.9K | 2.8x |
| esckla | 12K | "La profesora: entendieron chicos? / Yo leyendo el retiro de Messi" | 33.6K | 2.8x |
| graceyldn | 11K | "Fuck me, that was fast!" (self-callback) | 27.9K | 2.5x |
| 95KeepPounding | 8.3K | Caleb Williams / pit bull video | 21.4K | 2.6x |
| aroyagain | 5.5K | one-line observation quoting Sky on haircuts | 17.0K | 3.1x |
| futbismo | 11K | Spanish "parceros" line + player-hides-face clip | 17.5K | 1.6x |
| fcbharrison | 40K | "Mom: who sold the house? / Me at the Monumental" | 39.2K | 1.0x |

## 3. The repeatable shapes (129 football posts; counts, medians among non-large accounts)

| Shape | All 129 | Non-large n / median likes | Best small example [DATA] |
|---|---|---|---|
| RX: reaction clip "X when Y" (streamer, film, TikTok mapped to a football moment) | 20 | 16 / 24.9K | yoboimuna 155K; ewan10i 44.9K (IShowSpeed face); PamelaNjoku2 55K |
| FS: film-still or celebrity substitution, often 2 to 8 words | 7 | 6 / 45.2K (highest median) | ModernWrighty 53.8K; 7ahul 59.7K; LyesBouzidi10 36.5K ("Pep Guardiola" + Better Call Saul still) |
| TX: one-line text roast, stat pun, ledger | 15 | 11 / 17.0K | xGPhilosophy 118.7K ("Man City generated 114 charges from 115 (xG)"); ftfc 84.8K; XolidCity 75.1K |
| CL: clip plus literal/absurd or number caption | 8 | 6 / 16.9K | 1Walid1 136.6K ("28 lawyers to win 1 out of 115 charges"); The_Forty_Four 21.5K |
| RC: receipt / callback / silent quote | 6 | 6 / 18.4K | DrAashish_ 70.2K (no words); graceyldn 27.9K; MW_AFCB 17.8K ("QPR 90+5247 days...") |
| TL: club tally / whataboutism (Barca did not post a Messi tribute) | 3 | 2 / 56.8K | Bonmatimessi 88K; WinnaFC 19.2K |
| TR: tribute or emotion (Messi retirement) | 4 | 1 / 43.3K | consiglioris 43.3K (lowercase run-on, no punctuation) |
| POV: fan POV two-liner | 1 | 1 / 39.2K | fcbharrison 39.2K |
| TP: image template reused across fanbases (three-headed dragon "Messi at 19/29/39") | 1 | 1 / 91K | ludgardwontmix 91K ("Accurate 🐐") |
| BR: brand-voice deadpan / fake breaking | 5 | 0 (all large) | Paddy Power 23.2K, Domino's 24.2K and 15.8K |
| CB: cameo by a huge account | 3 | 0 | De Gea 373K, Mamdani "114" 270K |
| SPX: Spanish/Portuguese clip meme | 25 | 23 / 9.8K | notsantibjs 13.3K; Expefutbol 38.4K; pdroperico_69 40.8K |
| NW: news or quote card (control group, not humour) | 26 | 11 / 9.5K | UTD_Seth001 26K (small, 22K followers) |
| ST: stats card | 2 | 0 | MadridXtra 21.9K |

Read: humour shapes beat news cards about 1.7x among non-large accounts (median 15.9K, n=73, vs 9.5K, n=11). FS, TL and TP have the highest medians but small n. [DATA]

## 4. Caption mechanics

- **Length (English humour posts, non-large, n=50).** 0 to 3 words: 5 posts, median about 37K. 4 to 8 words: 9 posts, median 27.9K. 9 to 15 words: 15 posts, median 33.6K. 16+ words: 21 posts, median 17.0K. So 3 to 15 words is the sweet spot, and the very long ones underperform unless they are a quoted claim. (Across all humour shapes including Spanish: 4 to 8 words 19K, 9 to 15 words 15.5K, 16+ words 15.7K.) [DATA]
- **Two "no caption" winners.** DrAashish_ (quote of the scoop with a clip, no words, 70K) and a caption that is just a row of 😭 (LyesBouzidi10, 9.3K, 21 min after the scoop; his own 2-word "Pep Guardiola" one minute later got 36.5K). Zero-word works only when the surrounding post supplies the setup. [DATA]
- **Structures that recur:** (a) "[Person] in the [scene]" + still; (b) "X when Y:" + clip; (c) "[Number] to win [number]"; (d) "[Club] after [absurd event]" (Spurs after finishing 18th but staying up because City get a 93-point deduction, 32.5K); (e) deadpan fact against a big club ("Town have gone further in this year's League Cup than Manchester United", 84.8K); (f) callback with a counter ("QPR 90+5247 days 22 hours 29 minutes and 56 seconds", 17.8K).
- **Target of the joke.** In the 84 non-large football hits, the butt is a rival fanbase or club in most (City 30+ posts, United, Tottenham, Barcelona, Chelsea, Everton), or a manager/player known for a known failing (Arteta, Pep, Enzo, Carrick). Self-deprecation appears when the fanbase is already the joke (Spurs-after-18th).
- **Reply-bait triggers** [INFERRED from the shape, likes from DATA]: (1) a "greatest player never to win a prem title" style false-ish claim that invites correction (afcdxniel_, 76.8K); (2) a trophy or points ledger where other fans list their own (De Gea, "give them their titles", inheritance graphics); (3) "club X did/did not post" tallies (Barca v Bayern, 88K); (4) "I won't speak" conspiracy reads (XolidCity, 75K); (5) numbers with nothing to explain them ("114").
- **Punctuation and emoji.** 1 hashtag in 73 humour posts; 😭 in 6 of 73; no 🚨 on humour (10 of the 26 news cards use it); lowercase casual for tribute/relatable, official-voice full sentences for brand jokes.
- **Ragebait we should not copy.** The Enzo/Semenyo skinhead still (60K) and the Enzo dressing-room call clip (155K) draw on a racism controversy [INFERRED]. Your never-list (no discrimination) excludes them. Fake quotes are Community-Note bait (see 09-24 study).

## 5. Visual mechanics

What the images actually were (from the contact sheets):
- **Film/TV stills as stand-ins:** Oppenheimer hearing table (RDJ) for Arteta, Better Call Saul's Gene in an ice-cream uniform for Pep, Homelander turning to a rally crowd (x2: _billyreid 14.5K, Madridista_Me07 96.5K), Reacher under a gun, SpongeBob in a dark corridor, Thanos bowing at sunrise. Public-culture stills, cropped to fill the frame, no text on the image. [DATA: visual read]
- **Reaction clips:** IShowSpeed in the gaming chair; the Klopp run; Neymar shouting in a dressing room; a crying fan with a compact camera; a streamer screaming in a United shirt. Mostly reposted TikToks (TikTok UI or username visible on several frames). [INFERRED: the joke was tested on TikTok/IG first]
- **Screenshots-of-screenshots:** Instagram post of Bayern's Messi tribute (Kane hugging Messi) with 152K IG likes visible; the BBC BREAKING banner screenshot under a quote-tweet of her own earlier joke; a Facebook letter from Enzo (2016); Sky Fan Debate split-screen.
- **Graphics:** club badge on a dark background with a text list (centregoals, centredevils), tick/cross badge tally on a Messi photo (WinnaFC), Premier League purple crest (TouchlineX), xG scoreline as plain text.
- **Faces:** the strongest small posts have a recognisable face in the frame (Arteta as RDJ, Pep as Saul, Klopp mid-run). Pure logos and badges are the weak group (median 13 to 21K, all large accounts).
- **Edits:** almost none are AI edits; the trick is selection and captioning, not editing. Two exceptions are an animal photo styled as a football gag and a template with labels added (Messi dragon). [DATA: no obvious AI-edited images among the 129]
- **Copyright:** 3 of 129 posts show a takedown frame (NoodleHairCR7, idoxvi, Watch_LFC). Broadcast clips carry risk that stills and templates do not.

## 6. Context: breaking vs match vs evergreen

Among 84 non-large football hits: **MATCH/clip within 24h 30 (median 9.4K), BRK same-day mega story 25 (median 19.0K), SAGA multi-day story 19 (11.2K), CAL calendar moment (Messi retirement) 8 (36.4K), EVER 2.** (45 further football posts are large accounts, not counted here.) [DATA + my classification]

- **Four event days produced 46 of 84:** 25 Sep City verdict (28), 1 Sep Enzo to City (7), 27 Sep Boca/Anguilla/others (6), 20 Sep Chivas-America clasico (5). Then 31 Aug Messi retirement (3), 21 Sep Haaland haircut (4). [DATA]
- **Timing on 25 Sep** (minutes after Ornstein's scoop; n=48 football hits): 0 to 15 min median 15.9K (max 51K), 16 to 45 min median 19.6K, **46 to 120 min median 31.6K (max 136.6K)**, 121+ min median 15.5K (max 373K, De Gea, large). [DATA] Early posts were news lines (Paddy Power, City_Xtra, Rio); the memes landed later. So "fast" means "inside two hours with a finished edit", not "first".
- **Duplicated jokes:** the "lawyer who won 1 of 115" joke appeared three times: _billyreid at 27 min 14.5K, thatguysjokes at 45 min 271K, 1Walid1 at 82 min 136.6K. First mover got the least. Audience size and a better visual mattered more. [DATA]
- **Evergreen wins are rare here** (the three-head Messi dragon, the Haaland final reaction). The 09-24 study's "86% react to something from the last 48 hours" holds.

## 7. Why a small account still went massive (mechanisms, with confidence)

1. **Mega-story adjacency [DATA].** Over half the small hits share four days. The story pulled hundreds of millions of impressions; every account that posted a good on-topic joke inside two hours drew from that pool.
2. **A native quote of the mega post [DATA + INFERRED].** 6 hits quote the Ornstein scoop (359K likes, so a very large audience sat under it): 7ahul 59.7K, DrAashish_ 70.2K, Rio Ferdinand 51K, Domino's 24.2K, StretfordPaddck 19K, MW_AFCB 17.8K. On X the quote sits in the scoop's quote feed and gets shown to its audience.
3. **A recognisable template with the caption as a label [DATA].** 22 of 84 non-large posts are RX or FS; the caption is 2 to 15 words.
4. **Rival-fan argument [INFERRED].** The KDB claim, the trophy ledgers, Barca-not-posting all ask the target fans to reply.
5. **Proven elsewhere first [INFERRED].** Many clips are TikTok reposts (watermarks), i.e. the format was already validated.
6. **Not observed:** who reposted these posts. Syndication has no repost counts. Views are not available.
7. **Not the cause:** the paid blue check (52 of 84 non-large hits have it, 32 do not, so it is neither needed nor sufficient), hashtags, 🚨, or being first.

## 8. What transfers to a 45K humour brand, and what does not

| Transfers | Why |
|---|---|
| Film-still/celebrity substitution with a 2 to 8 word label | Highest median of any shape (45K), works as a still, fits Alex's hand-post workflow and our 3 to 8 word image rule |
| Native quote-tweet of the biggest news post within 20 to 120 min, with a still or a clip and a 3 to 12 word line | Piggyback mechanics; quote tweets count as commentary for OCR and are allowed |
| Deadpan one-line facts against a big club (ftfc-style, Milner parody) and the "X is the Y of Z" roast | Text-only can work on X (three non-large text-only posts over 40K: ftfc 84.8K, XolidCity 75.1K, consiglioris 43.3K); we already have Wirtz/Garnacho 365K |
| Count-contrast and stat-pun lines (28 lawyers v 1, 114 from 115 xG) | Unarguable, quotable, cheap to produce |
| Callbacks with real receipts (elapsed-time counter, own earlier joke) | Memory reward, no explanation needed |
| Tick/cross club tally and inheritance ledgers | Rival-bait; can be done as a single graphic |
| Reaction faces and cartoon characters as labels | Fully image-based |

| Does not transfer | Why |
|---|---|
| Brand-account cameos (Paddy Power, Domino's, De Gea, Mamdani) | Their reach is the brand, not the joke; medians are 15K to 370K because of the account |
| Reposted TikTok/broadcast clips | Copyright takedowns; originality risk for OCR; we post images |
| Spanish/Portuguese clip memes | Audience mismatch (English UK/EU/US) unless a separate account is built [GUESS] |
| News-card aggregators (TouchlineX, City_Xtra) | Not humour; medians lowest |
| Racism-adjacent film-still gags | Never-list; also a reputational risk |
| Long lowercase tribute posts (Messi retirement) | Emotion play; we are satire |

Where this changes earlier advice: the 09-29 winners study says image jokes beat everything for us. Small accounts win with **video** 65% of the time. Our images are still fine (our own top 20 are 19 of 20 images), but if Alex has 15-second film/TikTok-derived videos he can post them natively, test one or two and read the result. Do not use broadcast footage.

## 9. Rules of thumb for the daily desk (evidence-backed)

1. On a mega-story day, ship one finished still-plus-label within 20 to 120 min and quote the biggest scoop if there is one.
2. If three other accounts already posted your joke, do not post it; post the visual variant nobody has.
3. A template used by a small account and copied by a large one dies in a day; one use per template per week, as before.
4. Every post gets one target fanbase that will reply. If no one will argue, do not post.
5. No 🚨, no hashtags, ≤1 emoji, no explaining.

## 10. 25 ready templates (our voice), with worked examples on current stories

Facts used: City found guilty of 114 of 115 charges on 25 Sep, sanctions pending, appeal expected; Tottenham 2 points from 5 games and bottom, De Zerbi, Richarlison exiled; Man United knocked out of the Carabao Cup by Brighton, sitting 13th, Carrick, supporters' "statement of no confidence"; Arsenal 0-3 Brighton (chant "Are you Tottenham in disguise?"); Haaland's haircut after 7 City wins; Pastor Jerry Eze's prayer conference at Old Trafford; Klopp's Germany one draw one defeat (loss to Greece); Messi's Argentina farewell; Enzo Fernandez's move to City. **Re-verify every number and quote before posting.**

1. **Courtroom still.** "[Person] in the [scene]" + film still. Example: "Guardiola at the sanctions hearing" over a still of Saul Goodman on the stand. Why: 53.8K likes from a 10K account, 3 words, the still does the work.
2. **Lifeboat still, names only.** Name(s) as caption over a fugitive/escape film still. Example: "Pep, Rodri and Bernardo Silva" over the Titanic lifeboat still. Why: AndyHa_ 34.7K and LyesBouzidi10 36.5K used the "left before the verdict" idea; a name is the smallest possible caption.
3. **Count contrast.** "[Big input] for [tiny output]". Example: "£300m. 2 points. 5 games." over a photo of De Zerbi looking at the ceiling. Why: "28 lawyers to win 1 out of 115" made 136.6K.
4. **Stat-pun sentence.** "[Club] generated N [thing] from M (xG)". Example: "Tottenham generated 2 points from 15 (xPts 5.0)" [compute real xPts]. Why: xGPhilosophy's 114-from-115 made 118.7K, text only.
5. **Silent receipt quote.** Quote the scoop with the old clip/screenshot and no words. Example: quote the next City sanctions scoop with the 2023 "Everton deducted 10 points" headline. Why: DrAashish_ 70.2K, zero words.
6. **Elapsed-time counter.** "[Club] since [event]: N days N hours N minutes N seconds". Example: "Tottenham since a Premier League goal at home: [compute]" or "Frank Ilett's hair: day [compute]". Why: MW_AFCB 17.8K under the scoop with the QPR counter.
7. **Self-callback prophecy.** Quote our own earlier joke the minute it comes true. Example: when Spurs win, quote our 24 Sep Tottenham maths post: "That was fast." Why: graceyldn 27.9K from 11K followers. Rule: only if we genuinely posted it.
8. **Fake-breaking deadpan.** Brand-voice news line, absurd enough that no Note is needed. Example: "BREAKING: Man United have asked the Premier League if the trophies could be delivered before the Spurs game." Why: Paddy Power 23.2K; note that it works for a brand with a following, so use one per week.
9. **Inheritance ledger.** "If City lose their titles..." with a twist for a rival. Example: "If City lose the titles: Man United +2, Liverpool +1, Tottenham +0 (still 17th)" [verify title years]. Why: centredevils and centregoals 21K and 14K; ragebait for both fanbases.
10. **Self-deprecating rival.** "[Club] after [absurd event]" with a reaction still. Example: "Man United after finishing 13th and being handed two titles" over a stunned-child still. Why: nocontextfm1 32.5K for the Spurs version.
11. **X is the Y of Z.** Example: "Michael Carrick is the Solskjaer of Solskjaer." Why: our own Garnacho/Lingard line reached 365K views; two nouns, one verb, no explanation.
12. **Reminder-of-comparison fact.** "Just a reminder: [small club] have gone further than [big club]." Example: "Just a reminder: Brighton have knocked United out of two cups in two seasons." Why: Fleetwood's account 84.8K with 14 words.
13. **Conspiracy read.** Show an ordinary act as a plot, end on "I won't speak". Example: "Arteta stayed one yard outside the technical area at the Amex again. We all know why, but I won't speak." Why: XolidCity 75.1K (quote of the Haaland selfie).
14. **Absurd literal caption on a real screenshot.** Example: "Richarlison has now trained faster than Tottenham have played" over his "35.4km/h, I broke my record" post. Why: the Anguilla "found a cheat code" and Norwich "81 countries have VAR" clips got 21K by reading a real clip literally.
15. **Cartoon watcher.** "[Person] watching [thing]" + SpongeBob/Muppet in a dark corridor. Example: "De Zerbi watching the ball hit the post for the fifth game" over SpongeBob in the corridor. Why: Elah_Moo 15.8K and abril_hl 8.4K used the same frame for goalkeepers (Spanish accounts).
16. **Streamer reaction face.** "[Fanbase] when [event]" over a streamer's shocked face. Example: "Spurs fans when the international break ends" over IShowSpeed. Why: ewan10i 44.9K, 16K followers.
17. **Three-head dragon.** Left and right heads are the mild versions, the middle is the monster. Example: left "Spurs finishing 17th", right "Spurs finishing 17th", middle "Spurs 2026/27". Why: the Messi version made 91K; template fatigue: one per week only.
18. **Tick/cross tally.** Club badges with ticks and one cross. Example: "Clubs who have commented on City's 114 charges: Domino's ✓ Paddy Power ✓ Ryanair ✓ Man United ✗" [verify each]. Why: WinnaFC 19.2K, Bonmatimessi 88K for the Barca cross.
19. **Quote the scoop with a still.** 3 to 8 word caption plus a film still, 20 to 120 minutes after the news. Example: quote the next Ornstein City-sanctions scoop with "Rodri checking whether he can come back" over a Home Alone still. Why: 6 of the hits are quotes of the same scoop.
20. **Non-football event beats the club.** Example: "Pastor Jerry has sold out Old Trafford. Carrick will need a miracle to do the same." [verify attendance claim]. Why: UTDKarra 23K (104K followers), churchtalkative and instablog9ja 8K each on the same event.
21. **Animal as athlete.** Photo of an animal mapped to a player or a defence. Example: cat sliding under a wet-floor sign captioned "Tottenham's back line at a corner". Why: 95KeepPounding's Caleb Williams / pit bull 21.4K at 8.3K followers.
22. **Single number.** One number over one face. Example: "2/15" over De Zerbi. Why: Mamdani's "114" made 270K (large account, so the transfer is uncertain [GUESS]).
23. **Lookalike split.** "Same energy" over two stacked photos. Example: Arteta on the bench at 0-3 beside a Sunday-league sub, caption "Are you Tottenham in disguise?" Why: TrollFootball's Pep and Lance Armstrong got 13K; the chant made 38.7K as news.
24. **Fan POV two-liner.** "Mom: [question] / Me: [absurd answer]" over a crying-fan photo. Example: "Mom: Why is the season ticket a shed? / Me: Tottenham." Why: fcbharrison 39.2K.
25. **xG scoreline as text.** Example: "Tottenham (0.71) 2-3 (2.94) Aston Villa" [use real xG]. Why: xGPhilosophy's "Chelsea (0.83) 2-2 (1.38) Hull" made 12.3K with no image.

## 11. Corrections and open items

- The 09-24 study said 71% of viral captions are 12 words or fewer; here English humour posts ≤15 words are 32 of 50, and the ≥16-word group has the lowest median. Consistent.
- Open: view counts, who reposted, and follower coverage (26%). A cheap next step is to get Alex's X Content tab top 10 each week and add it here.
- Corpus caveat: shape/target/visual labels are my judgement (see `label_confidence` in each record).
