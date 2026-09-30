# The X viral formula for @ShithouseryHQ, Sep 2026

Written 2026-09-24. This follows `x_strategy_2026_09.md` (how X ranks and pays) and `x_own_top_2026.md` (our own 2026 hits), and doesn't repeat them. This file covers **what makes a football tweet bang**, why our drafts didn't, and what to post from 24 to 26 Sep.

---

## TL;DR: the formula in one screen

> **The picture (or the quoted post) is the setup. The caption is the punchline. The punchline is short, and it never explains itself.**

- **Length.** Our own 2026 hits run 2 to 6 words. In the 180 viral slides, 32% of captions are 6 words or fewer, 71% are 12 or fewer, and the median is 9. Every caption over 12 words is still **one sentence with the punchline in the last three words**.
- **Hygiene.** 0 of 180 use a hashtag. 0 use 🚨. 11% use an emoji, and 14 of those 20 are 😭.
- **Timing.** 86% (155 of 180) react to something from the last 48 hours. The rest are nostalgia or "relatable" posts.
- **The rare big text-only hits** are a single deadpan sentence that roasts someone:
  - "The last time Tchouameni won a duel was against Fede Valverde": **137K likes**
  - "kylian mbappe wins you the games you would win without him.": **53K**
  - Our "Florian Wirtz is the Garnacho of Jesse Lingards": 365K views
- **Why our drafts were bland:** each one did the reader's work for them. There was a setup sentence, then the joke, then a line explaining the joke ("Someone let George Weah know…"). They were also either evergreen (the VAR "Dave" joke) or late and derivative (the Weah angle was already posted by others on 22 Sep).

**The 8 formulas, one line each:**

1. **VERDICT.** A picture does the talking and we add a 1–3 word verdict ("FACTS.", "Fairs.", "Read it slowly.").
2. **CONSPIRACY.** "They're doing it on purpose" about something real ("It's so OBVIOUS.", Haaland waiting for five wins before the haircut).
3. **ROAST-BY-FACT.** One deadpan sentence whose last words are the knife (Tchouaméni and the duel).
4. **QUOTE vs PICTURE.** Put a real quote under a photo that contradicts it (Moriyasu, 123K).
5. **LITERAL READING.** Take the news absurdly literally ("New position of Endrick", Endrick holding a printer, 74K).
6. **NICKNAME.** Coin a label the timeline adopts ("El Clownico", "The Bermuda Triangle", "Cardio Man").
7. **CALLBACK / RECEIPT.** Drag up the famous moment or the old prediction that makes today funnier.
8. **TIME-JUMP / SHARED FEELING.** "I am from the future", "Leaked image of…", "this can't be the same year we watched the World Cup".

---

## 1. Data and method

| Source | What | n | Likes known? |
|---|---|---|---|
| IG meme carousels from itsfootybants, trollol_epl, ftblmemeshub, rivalsbanter-style club-troll pages, thefootballfeed and sccrmemes (`/private/tmp/tt/igsweep_0924`, `igsweep_pm`, `igsweep`). Each slide was read with macOS Vision OCR, and contact sheets were viewed. | Screenshots of viral X posts | **180 unique usable slides** (CTA slides, Kalshi/Polymarket/Stake slides and pure news cards excluded; duplicates merged) | 36 of 180, matched to cached syndication JSON |
| Cached syndication JSON for every tweet we pulled this month (`/private/tmp/tt/pool*/*.json`, `vid/`) | Full text, media type, likes, date | **238 football tweets, 18–24 Sep 2026** | All |
| Our carousel builds (`car_*/slides.json`, `takes.txt`) | Tweet URLs and likes | Covered by the pool above | All |
| Our own X hits (`x_own_top_2026.md`, the brief, `x_strategy_2026_09.md` §4) | Caption, views, likes | 20 + 7 | All |

**Caveats**
1. **Selection bias.** Every slide was *chosen because it went viral*, so this data shows what winners look like, not what separates winners from losers. Our own flops, plus our own 2026 hits, are the only control group.
2. **Likes, not views.** The syndication endpoint gives no view count.
3. **Enrichment was limited.** I web-searched the exact text of 3 small-account slides to find the original tweet IDs, and all 3 failed: posts 1–3 days old from small accounts aren't indexed yet. I stopped there. The 238-tweet pool already has likes for the same week, and 36 of the slides are in it.
4. **Mechanism labels are my judgement**, one primary label per slide.

**IG slide anatomy (n=180)**

| Visual type | n | Share |
|---|---|---|
| **Quote-post**: a short line on top of someone else's news or photo post (the screenshot-in-screenshot) | 77 | **43%** |
| Match or news photo | 30 | 17% |
| Video still / GIF | 22 | 12% |
| Stat graphic, table or fixture list | 21 | 12% |
| Reaction meme or edited image | 18 | 10% |
| Text only | 7 | 4% |
| Lineup graphic | 5 | 3% |

**So what for X:** the single biggest format is **the quote-post**: one line of ours on top of a news post. On X that is a native quote-post, which is allowed and counts as commentary for Original Content Rewards (OCR). It is *not* a screenshot of someone's tweet.

**Caption length (n=180)**

| Words | 0 | 1–3 | 4–6 | 7–12 | 13–20 | 21+ |
|---|---|---|---|---|---|---|
| Slides | 3 | 18 | 36 | 71 | 40 | 12 |

- Where likes are known (n=36), captions of **6 words or fewer have a median of 23.5K likes, and captions over 6 words have 24.2K**. Among winners, length doesn't separate them.
- What *does* separate them is structure. None of the long captions is setup + joke + explanation. Every one is a single statement, and the joke lands on the final words.

**Who carries the joke?** This is my estimate from the slide labels, not an exact count. The test for each slide: could you delete the image or the quoted post and still get the joke? 173 of 180 slides have an image or quote, but only about 15% of captions stand alone:

| Who carries the joke | Share |
|---|---|
| The image or quoted post carries the setup, and the caption is only the punchline | **~75%** |
| The caption carries it alone | ~15% (text-only and self-contained sentences) |
| Both are needed equally | ~10% (fake dialogue over a photo) |

- **Our own 2026 top 20: 19 of 20 are image posts with 1–6 word captions.** The only text-only hit is the Wirtz comparison.

**Mechanism counts (primary label, n=180)**

| Mechanism | n |
|---|---|
| Irony / understatement | 35 |
| Rivalry jab (usually a quote-post) | 22 |
| Literal / absurd reading | 19 |
| One-line reaction or verdict | 16 |
| Fan POV ("when you…") | 11 |
| Conspiracy | 9 |
| Nostalgia | 9 |
| Label | 8 |
| Callback | 8 |
| X-vs-Y | 7 |
| Deadpan fact | 7 |
| Take | 5 |
| Nickname | 4 |
| Lookalike | 3 |
| Fake quote / dialogue | 4 |
| Other | 9 |

---

## 2. The 8 formulas: 3 real examples each, and why they work

Likes are from syndication where known. "Ours" means @ShithouseryHQ.

### F1 · VERDICT: the picture talks, we add 1–3 words
| Example | Image | Likes |
|---|---|---|
| @DebsSZN "Read it slowly. 😂😂" | Scoreline Brighton 3-0 Arsenal, with the team names circled | 46,236 |
| Ours: "FACTS" / "FACTS." (x3, Jul) | Meme or photo | 59.5K / 37.3K / 18.6K |
| @StokeyyG2 "Fairs." | FotMob card: Haaland 6.3 v Brobbey 9.6 | 11,215 |
| Also: "Wow." (Utd pressing chart), "tears", "If if if if if", "Honor." | quote-posts | — |

**Why it works:** the reader does the last step themselves. That "click" is what makes people share and quote. A verdict is also *arguable*, so the replies ("no it isn't") come for free. Replies are weighted 5, likes 0.5.

### F2 · CONSPIRACY: "they're doing it on purpose"
| Example | Image | Likes / views |
|---|---|---|
| Ours: "It's so OBVIOUS." | France in the sun v Argentina at night collage + quoted fan tweet | 167K / 3.9M |
| @XolidCity "Haaland must be a troll 😭 waited for five straight wins in a row before cutting the hair. We all know exactly what he's doing, but I won't speak." | Quote of Haaland's haircut post | 59,103 |
| @AnabellaMarvy "Yea they lost because the referee liked raphinha's moustache" | Quote of the ref/Raphinha clip | 18,504 |
| Ours: "They're making it too obvious now" · "They ain't even hiding it anymore 😭" | photo | 1.6M / 379K views |

**Why it works:** fans love grievance. The post hands one fanbase ammunition and another something to deny, so you get both kinds of reply. "I won't speak" and "OBVIOUS" read as knowing, not as explaining.

### F3 · ROAST-BY-FACT: one deadpan sentence, the knife in the last words
| Example | Image | Likes |
|---|---|---|
| @eyesovastats "The last time Tchouameni won a duel was against Fede Valverde" (a callback to their dressing-room fight) | none | **137,380** |
| @vinigham "kylian mbappe wins you the games you would win without him." | none | 52,963 |
| @Super6 "Since November 2024... Beyonce shows at the Tottenham Hotspur Stadium: 6 · Spurs Premier League wins at the Tottenham Hotspur Stadium: 5" | 2 photos | 8,024 (reposted by Tottenham Trolls and others) |
| Ours: "Florian Wirtz is the Garnacho of Jesse Lingards" | text only | 15.8K / 365K views |

**Why it works:** it sounds unarguable and it's quotable. It is the only formula that works **text-only**. Word order matters: the setup is neutral ("The last time Tchouameni won a duel was…") and the surprise comes last.

### F4 · QUOTE vs PICTURE: a real quote under a photo that contradicts it
| Example | Image | Likes / views |
|---|---|---|
| Ours: "“We lost on the pitch today but we won the hearts of millions of fans”" | Moriyasu | 123K / 992K |
| @UTDTrey "“Maresca we will never forgive you” 😭😭😭" | League table | 16,802 |
| @_Mac_lfc "“tottenham can't be worse than last season” / de zerbi:" | Reaction still | 12,931 |
| @Momelezi13_ 4 panels: "Give me the ballon dore" / "I deserve the Ballon dOr" / "I won" / "I scored" | Mbappé v the others | — |

**Why it works:** the quote is the setup and the picture is the punchline. That takes zero explaining, and people who miss the reference ask in the replies. **Use real quotes only.** @MadribCentral's *fake* Mbappé quote ("Anyone who doesn't vote for me WILL have CONSEQUENCES", 24.5K) is exactly what gets a Community Note, and a Note voids OCR.

### F5 · LITERAL / ABSURD READING of the news
| Example | Image | Likes |
|---|---|---|
| @MarockX "New position of Endrick" (Nueva posición de Endrick) | Endrick on the bench holding a printer (a callback to Mourinho's printouts) | **74,226** |
| @bobby_role "Throwback to when Mohamed Salah beat up an Everton fan and forced him to wear a Liverpool kit" | Salah with a kid in a Liverpool kit | 50,485 |
| @sbzcomps "Only way to beat the Bermuda Triangle is to employ the Bermuda Triangle" | GIF | 30,620 |
| Also: "the full colour printout 😭", "The largest concentration of recruitment consultants in the world" (on the Bermuda map) | quote-posts | — |

**Why it works:** it rewards people who know the story, the in-group. The absurd image is shareable on its own.

### F6 · NICKNAME that the timeline adopts
| Example | Image | Likes / views |
|---|---|---|
| @Dominos_UK "El Clownico" | Man Utd v Spurs fixture card | 37,531 (then re-used: "El Sackico", "L Clasico" 10.6K) |
| @DossenaLFC "The Bermuda Triangle 😭" | Map of Brentford, Brighton and Bournemouth | 59,800 (and 6+ slides built on it, plus Sky Sports' own post, 12K) |
| Ours: "Cardio Man highlights vs Fulham" | photo | 21.5K / 732K |

**Why it works:** a name is reusable. Every later post that uses it points back to the coiner, and it pulls copy-link shares (weight 20). Coin one, then use it for weeks.

### F7 · CALLBACK / RECEIPT
| Example | Image | Likes |
|---|---|---|
| @enfueradejuego (no caption) | Simpsons panels next to Mourinho holding printouts | 23,484 |
| @pfash3 "I'm shaking rn." | Quote of a June prediction: "Next season Barcelona will beg for a shot on target" + Real Madrid's new back four | — |
| @leegx82 "Europa league final a few years ago 💀" | Quote of "El Clownico" | — |
| Also: "Arteta has made the streets forget Eze" · "Remember when Ronald Araujo taken the corner quickly" · "happy anniversary to the funniest second yellow ever" | quote-posts | — |

**Why it works:** memory is an in-group reward, and a receipt proves the target's history. It needs a *famous* reference. If people have to be told what it is, it's dead.

### F8 · TIME-JUMP / SHARED FEELING
| Example | Image | Likes / views |
|---|---|---|
| Ours: "I am from the future" | image | 84.7K / **4.5M** |
| @thandomoeng "this can't be the same year we watched fifa world cup in." | none | **198,080** |
| @BlackYellow (BVB) "A three week international break and it's only September." | video | 179,389 |
| Ours: "Leaked image of Argentina vs England" | image | 16.5K / 230K |
| @FootyHumour "I told my girl I'd rather spend the weekend with her than watch football (there's an international break)" | video | 41,370 |

**Why it works:** every fanbase feels it, so it spreads beyond one club's followers. "I am from the future" and "Leaked image of…" are *frames*: the image does all the work.

**Delivery note:** 43% of viral slides are quote-posts. On X we should **quote-post** the news account (Fabrizio, Touchline, a club) with an F1–F7 line, instead of screenshotting it. Quote weight is 5, and it counts as commentary for OCR.

---

## 3. What viral football tweets never do

| Never | Evidence | Our drafts did it |
|---|---|---|
| **Explain the joke** ("Someone let X know…", "just saying", "imagine…") | 0 of 180 slides add an explainer after the punchline | Mbappé/Weah: "Someone let George Weah know he's got competition…" |
| **Write the setup in the text when a picture could hold it** | 75% put the setup in the image or quote | All three were text-only |
| **Announce the genre** ("Honestly think…", "Sources:", "Hot take:") | 0 of 180. Parody accounts imitate the news format fully (@FabrizioLaparto, 61K) instead of winking | "Honestly think…", "Sources:" |
| **Evergreen jokes with no news peg** | 155 of 180 react to something from the last 48h | VAR "Dave" |
| **Hashtags** | 0 of 180 | — |
| **🚨 on a joke** | 0 of 180 fan slides. 🚨 only appears on news or parody-news posts | — |
| **Emoji salad** | 11% use any emoji, mostly one 😭 | — |
| **Bullet lists as the joke** | 1 of 180 (and that one is a lineup argument) | Brobbey list (the Wirtz list worked in 2025. The template is now recognisable) |
| **Ask for engagement** ("thoughts?", "RT if") | 0 of 180 | — |
| **Invent quotes from real people** | Only parody or fake-news accounts do it, and they're the Community Note risk | — |
| **Arrive second** | The Weah angle was already on @_TrealFormula's slide on the 22nd | Weah |

---

## 4. What's hot right now (18–24 Sep 2026)

Ranked by slide mentions (approximate keyword count, n=180) plus the biggest pool tweets. Everything is **[VERIFY]** before we build on it.

| Storyline | Heat | The live jokes |
|---|---|---|
| **Real Madrid under Mourinho**: lost the derby 2-1 at Atlético (~20 Sep); **Mourinho brought printed photos of fouls to the presser**; Real Madrid TV blamed a ref "friend of Lamine"; Endrick benched (4 min under Mourinho); the Tchouaméni–Valverde fight; the Spanish refereeing committee admitted a "clear mistake" (Kang-In Lee not sent off) | ★★★★★ (27 slides) | printer / printouts / "full colour", Endrick's "new position", Tchouaméni duels |
| **Mbappé's Ballon d'Or campaign**: an interview every day; "dedicate it to Africa"; "I am NOT obsessed"; ceremony 26 Oct in London; Kane is favourite; Lamine: "if I win it I want FIVE more" | ★★★★★ (20) | "another interview", "African roots" + Weah, "wins you games you'd win anyway" |
| **Barça**: Raphinha hat-trick ("but I moved two defenders"); Rodri joined Barça over Mourinho's Madrid (09-24); Ferran Torres at PSG misses Pedri (109K); Lamine | ★★★★ (24) | Ballon d'Or "contenders" grid |
| **Man Utd**: 5 pts from 5, a joint-worst start; drew with Fulham; #BoycottUnited trending in a week with no games; record revenue but no Europe; a £125 Old Trafford turf cube; Utd (12th) v Spurs (20th) on 10/11 Oct = "El Clownico / L Clasico / El Sackico" | ★★★★ (20) | nicknames, "3 weeks without United" |
| **Man City**: 5 from 5; Brobbey hat-trick at the Etihad (9.6 v Haaland 6.3, City won 5-3); **Haaland's first haircut "since the haircut"** after 5 wins; Sunderland's admin jabbed EA over TOTW (23.6K) | ★★★ (16) | Haaland conspiracy, Brobbey |
| **Spurs**: 20th under De Zerbi; Beyoncé 6 shows v 5 home PL wins; sponsor Sidiz leaving early; the U21s beat City U21 | ★★★ (14) | Beyoncé stat, "de zerbi:" template |
| **Arsenal**: lost 3-0 at Brighton (19 Sep); Arteta reportedly agreed a new long-term deal; Brighton's coach "press tour"; KMI panel 5-0 that Sunderland's pen v Arsenal was wrong | ★★★ (11) | "3 coaches in 30 years", "hate-watch for 3 weeks" |
| **Bermuda Triangle** (Brentford, Brighton, Bournemouth, all near the top); Liverpool finish the season against all three; Iraola's Liverpool | ★★ | Already coined by @DossenaLFC. Don't chase it |
| **International break**: 3 weeks, in September | ★★★ (BVB 179K, thandomoeng 198K) | "Day N of the international break" |
| **Spain v England, Sat 26 Sep** (Kalshi slide: 2:45pm EDT = 19:45 UK). Spain are world champions (Ferran scored the winner in the final); England lost to Argentina in the semi; rematch of the Euro 2024 final; **Kane v Lamine = the two Ballon d'Or favourites** | coming | Nobody has the Kane-v-Lamine "play-off" angle yet |
| Also: Kane floats being an NFL kicker (The Athletic, 09-23); Ronaldo's "two missions: the Nations League and 1,000 goals"; Messi on 930 goals; a Messi/Piqué/Fàbregas 2002 pizzeria photo (26.8K); Klopp at Germany training; Zidane playing Olise on the right for France; Andy Burnham (PM) wants to lift the stadium beer ban (political, skip) | | |

---

## 5. Pre-post checklist (fail any bold line = don't post)

| # | Check | Pass |
|---|---|---|
| 1 | **Peg:** reacts to something from the last 48h or a fixed calendar moment | yes |
| 2 | **Length:** 8 words or fewer (6 or fewer ideal). If longer, one sentence with the punchline in the last 3 words | yes |
| 3 | **Delete test:** hide the image. The post should die, because the image carries the setup. *Or* it's a self-contained F3 roast sentence | yes |
| 4 | **No explainer:** no "someone tell/let", "imagine", "honestly", "just saying", "Sources:", "Hot take", no trailing "…" | none present |
| 5 | **Formula:** you can name which of F1–F8 it is | named |
| 6 | **Target:** a named club, player or fanbase who will reply "no because…" (argue, not mute) | yes |
| 7 | **First:** search X for the angle. If a 10K+ account already posted it, change the angle or skip | not done yet |
| 8 | **Meme-page test:** would itsfootybants screenshot it? It must make sense with no context outside the post | yes |
| 9 | **Facts:** every number, score and quote checked by the social-fact-checker (2 sources). No invented quote a real person could plausibly have said | clean |
| 10 | **Hygiene:** 0 hashtags, 0 🚨, at most one emoji (😭), no link, no engagement ask, no betting brand, no slur or sexual word | clean |
| 11 | **Original:** our words + a photo / our own graphic / a native quote-post. Never a screenshot of a tweet, never a re-uploaded clip | yes |
| 12 | Timing: matchday within 10 min of FT; break-week slots 08:30 / 12:30 / 17:30 UK | — |

---

## 6. Our 5 weak drafts, rewritten

The brief quoted three drafts. The other two are inferred from the images staged in `/private/tmp/tt/x_0924/` (`kane.jpg`, `rodri.jpg`). Their original wording wasn't available, so rewrites 4 and 5 start from the images.

| # | Old draft | What failed | **Rewrite (caption)** | Image | Formula |
|---|---|---|---|---|---|
| 1 | "Honestly think Brian Brobbey is a top, top striker. Just needs to work on: – First touch – Finishing – Getting Sunderland to play at the Etihad every week" (30 words) | Genre announced ("Honestly think…"); a list template people now recognise; the last item explains the joke; it knocks his touch and finishing after a 9.6 hat-trick, so the facts fight the joke | **"Wrong number 9 got the haircut"** | Haaland's new-haircut photo (his own post, 21 Sep) beside Brobbey celebrating at the Etihad. **Alt:** FotMob-style card, own-made, "Haaland 6.3 / Brobbey 9.6", caption **"Etihad's best number 9"** | F1 + F7 (the haircut) · [VERIFY ratings 6.3/9.6, City 5-3 Sunderland, date] |
| 2 | "Sources: the Premier League are replacing VAR with a man called Dave who 'just knows'" | Evergreen, no target, no image, "Sources:" signals the joke before it lands | **"The printer was right."** | Mourinho at the Real Madrid presser holding his printed foul photos (20 Sep) | F7 callback + F2. Pegged to the Spanish refereeing committee saying it was a "clear and obvious mistake" not to send off Kang-In Lee · [VERIFY the committee statement, ~22 Sep] |
| 3 | "Kylian Mbappé wants to dedicate the Ballon d'Or to Africa. Someone let George Weah know he's got competition…" | 13 words retelling the news, then an explainer; the Weah angle was already out on the 22nd | **"“I am NOT obsessed with the Ballon d'Or”"** | 2×2 grid of Mbappé in four different interview settings this month (The Athletic, L'Équipe/Clique, RFI, TV sit-down) | F4 quote-vs-picture (the Moriyasu shape) · [VERIFY the exact quote wording and that it's his; use agency photos, not tweet screenshots] |
| 4 | *(Kane / NFL kicker)* | — | **"Kane in 2031:"** | `kane.jpg` (Kane holding an American football) | F8 time-jump · peg: Kane told The Athletic he could kick in the NFL while finishing in MLS · [VERIFY 09-23 source]. **Don't** use "finally a trophy" jokes: Kane won the Bundesliga with Bayern |
| 5 | *(Rodri picks Barça)* | — | **"“Here I can grow way more”"** | `rodri.jpg` (Rodri in Barça colours) | F4 (a real quote as a jab at Madrid). **Alt (callback):** "Mourinho should've printed it in colour" · [VERIFY Rodri's 09-24 COPE quote and that the photo is real] |

---

## 7. Ten fresh ideas for 24–26 Sep (international break, Spain v England Sat 26 Sep)

Each one is our words + a photo, our own graphic, or a native quote-post. No tweet screenshots. Every factual claim goes to the social-fact-checker first.

| # | When (UK) | Caption | Image (what to source) | Formula | Target | Facts |
|---|---|---|---|---|---|---|
| 1 | Fri 25, 17:30 | **"Ballon d'Or play-off."** | Split photo: Kane in an England shirt, Lamine in a Spain shirt, both from recent internationals (agency/FA/RFEF photos) | F6 nickname | England + Spain + Ballon d'Or discourse | [VERIFY both in the squads and fit; Kane and Lamine as the top two favourites] |
| 2 | Sat 26, within 10 min of FT | **"Ballon d'Or play-off: settled."** (draw: **"Replay at the Ballon d'Or."**) | Winner's-side star celebrating (Kane or Lamine), a match photo from the game | F1 verdict, the payoff to #1 | whoever lost | Write *after* FT. Check the score and scorer |
| 3 | Thu 24, 17:30 | **"Samson made the same mistake"** | **Quote-post** of @Erling "Got my first haircut since the haircut!" (or his photo) | F2 conspiracy + F7 | City | [VERIFY the post, 21 Sep] |
| 4 | Thu 24, 12:30 | **"Tottenham Hotspur Stadium's most reliable performer"** | Beyoncé on stage at the Tottenham Hotspur Stadium (concert photo) | F3 roast-by-fact | Spurs | [VERIFY 6 Beyoncé shows v 5 Spurs PL home wins since Nov 2024] |
| 5 | Fri 25, 08:30 | **"The only part of Old Trafford that doesn't leak"** | Man Utd store product photo of the 7cm Old Trafford turf cube (£125) | F7 callback (the leaking roof) + F5 | Man Utd | [VERIFY the £125 product is live] |
| 6 | Fri 25, 12:30 | **"Manchester United: unbeaten since 20 September"** | Empty Old Trafford (wide photo) | F3 deadpan irony (they haven't played) | Man Utd | [VERIFY: the Fulham result on 20 Sep was a draw, and no Utd game until 10/11 Oct] |
| 7 | **Only once Arsenal confirm the new deal** | **"Earned it."** | Arteta, a club signing photo or a smiling touchline photo | F1 verdict | Arsenal (rivals reply "3-0 at Brighton") | [VERIFY the contract is *official*, not just EuroFoot "reports"] |
| 8 | Sat 26, 08:30 | **"Nations League final, 2031"** | Ronaldo mid-celebration in a Portugal shirt, a recent photo | F8 time-jump | Ronaldo fans/haters | Needs no fact (it's a future joke). Peg: his "two missions: the Nations League and 1,000 goals" · [VERIFY peg quote] |
| 9 | Thu 24, 20:00 | **"Leaked image of Barcelona's 2009 tactics meeting"** | `messi_pizza.jpg`: 14-year-old Messi, Piqué and Fàbregas at a pizzeria in 2002 | F8 "Leaked image of" frame (our 230K shape) | Barça / nostalgia | [VERIFY the photo's identification, year and source; credit if required] |
| 10 | Fri 25, 20:00 | **"“I don't like to speak about myself… 73 goals speak for themselves”"** | Kane at a press conference, mid-sentence, microphone in shot | F4 quote-vs-picture (a real quote that undercuts itself) | Kane / England v Bayern crowds | [VERIFY exact wording, source (Fabrizio relay) and the 73 figure] |

**Spares, if one fails its check**
- "“If I win the Ballon d'Or, I want to win FIVE more”" + a photo of Lamine next to a Ballon d'Or trophy [VERIFY quote, 09-23].
- "Day 7 of the international break" as a **quote-post** of a Mourinho presser photo post. Use it only if nobody has done "Day 7" by then.

**Sequencing:** #1 and #2 are a set. Post #1 Friday so that #2 has something to call back to. Keep #5 and #6 at least 6 hours apart (both are United). Space the Mbappé rewrite (#3 above) and #10 (Kane) a day apart.

---

## 8. Keep / stop

- **Keep:** image + 2–6 words; our own frames ("It's so OBVIOUS", "I am from the future", "Leaked image of", "FACTS"). Use each **at most once a week**, or they become a tic.
- **Start:** native quote-posts of the day's news accounts with an F1/F3/F5 line. This is the X-native version of 43% of the viral slides.
- **Stop:** the "Honestly think X is top, top… just needs to work on" list. "Sources:" parody. Any caption over 12 words that isn't a single roast sentence. Explainers after the punchline.

---

## Appendix A: every usable IG slide (n=180)

Visual: **Q** quote-post (screenshot-in-screenshot) · **P** match/news photo · **V** video still/GIF · **S** stat, table or fixture graphic · **M** reaction meme/edited image · **L** lineup · **N** text only. "≤48h" = reacting to something from the last 48 hours. Likes = syndication, where the tweet is in our pool.

| # | handle | caption (verbatim) | words | visual | mechanism | target | ≤48h | likes |
|---|---|---|---|---|---|---|---|---|
| 1 | @redhod99 | Garnacho's lost the plot | 4 | Q | lookalike | Garnacho | Y |  |
| 2 | @Yvssnuebe | The receptionist at my hotel, he was in vino prime. | 10 | P | pun/literal | Vinícius | N |  |
| 3 | @thatsamybad | Italy finally clocked they won't get anywhere without children of immigrants fairs | 12 | Q | irony | Italy | Y |  |
| 4 | @LibanLDN | We're two interviews away from Mbappé doing Breakfast Club with Charlamagne. | 11 | Q | escalation | Mbappé | Y |  |
| 5 | @Agallezacydl | The TV: GOOOOOAL / My mom: Has your team scored, son? / The face I make as I turn to look at her | 21 | V | fan-pov | — | N |  |
| 6 | @GolDeGodin_ | Serious contender for the funniest photo of the year | 9 | P | label | Atlético | Y |  |
| 7 | @NealGardner_ | Oh my.... | 2 | Q | one-line reaction | Real Madrid sponsors | N |  |
| 8 | @Owens_EFC | have you ever tried this one | 6 | Q | pun/literal | Everton | Y |  |
| 9 | @mcOOey | No mate, you won't need to bring the wide angle lens. | 11 | Q | irony | Everton | Y |  |
| 10 | @Varca_Owner | We got scammed by liverpool | 5 | P | irony | Liverpool/Barça | Y |  |
| 11 | @Ifcmike__ | They only gave us £10m for the pair and they still feel scammed | 13 | P | rivalry jab | Barça | Y |  |
| 12 | @pfash3 | I'm shaking rn. | 3 | Q | receipt/callback | Real Madrid | Y |  |
| 13 | @realjudedrid | the full colour printout 😭 | 4 | Q | literal detail | Mourinho | Y |  |
| 14 | @GxlDePaulinho | Day number 1 of international break | 6 | Q | irony | rumour mill | Y |  |
| 15 | @LFC_Tandy | You can get Frimpong for free too | 7 | Q | rivalry jab | Barça | Y |  |
| 16 | @AyushJ7972 | For that you need to reach a "WC FINAL" first!! | 10 | Q | rivalry jab | Ronaldo/Portugal | Y |  |
| 17 | @gerardromero | Ahora sí. | 2 | M | conspiracy | Real Madrid/Mourinho | Y |  |
| 18 | @Adikastakes | Worst guys to have beef with, they have zero shame | 10 | Q | rivalry jab | Atlético | Y |  |
| 19 | @RmaDonyFC | I now understand why Benzema was also keeping an eye on the Ballon d'or | 14 | P | irony | Benzema | Y |  |
| 20 | @FCBarcaEC | My girlfriend: today I want to try other positions / Me: | 10 | V | fan-pov | — | N |  |
| 21 | @trollol_epl | No way 😭 | 2 | S | vs | Madueke/Arsenal | Y |  |
| 22 | @Ringo8781 | Looks like David Moyes | 4 | Q | lookalike | Moyes | Y |  |
| 23 | @_DynamiteJeph | Mbappe: I deserve the balon d'or, I have African roots / Yamal in his next interview: My parents are from Morocco | 20 | P | fake dialogue | Mbappé/Lamine | Y |  |
| 24 | @rasheed233637 | Remember when Ronald Araujo taken the corner quickly | 8 | Q | callback | Araújo | N |  |
| 25 | @BMPCSAFC | I acc didn't notice this / Ruben Dias kept grabbing Brian Brobbey's sleeves, so he changed to short sleeves at half time | 21 | P | spotted detail | Brobbey/City | Y | 26968 |
| 26 | @nf1vdO | I'm f***ing scared 😭 | 4 | Q | one-line reaction | Raphinha | N |  |
| 27 | @atm_reyes | When you're chatting with your colleague and a beggar butts in to ask you for a 1€ | 17 | P | fan-pov | — | Y |  |
| 28 | @trollol_epl | Football peaked that night | 4 | L | nostalgia | PSG/Bayern | N |  |
| 29 | @dominicanacule | The managers and their secret weapons: | 6 | M | literal | managers | Y |  |
| 30 | @Deedawzz | Now he remembers he got African roots | 7 | Q | rivalry jab | Mbappé | Y |  |
| 31 | @UtdJBT | Replacing the 15 year old academy player before the LB that's been at the club for 12 years | 18 | Q | irony | Man Utd | Y |  |
| 32 | @MadribCentral | MBAPPE: "The votes are public. Anyone who doesn't vote for me (Ballon d'Or) WILL have CONSEQUENCES." | 16 | P | fake quote | Mbappé | Y | 24474 |
| 33 | @el_diablllo_ | When I'm in the middle of talking to a 10/10 nurse and the doctor interrupts to ask if I want to see my newborn son | 26 | V | fan-pov | — | N |  |
| 34 | @ImJoe_King | Still crazy that Arsenal will have had 3 coaches in 30 years | 12 | Q | deadpan fact | Arsenal | Y |  |
| 35 | @ElModelin | Vinicius's face when he discovers that you can insult a referee as a buddy. | 14 | Q | literal | Vinícius | Y |  |
| 36 | @MusialaEra | Smart manager. Finally ending the CAM gimmick | 7 | Q | take | Olise/France | Y |  |
| 37 | @SheHatesKunn | French footballers really have a deep sense of community | 9 | Q | irony | Barcola | Y |  |
| 38 | @ZeeBoogie_ | Ah yes but Maguire can get chance after chance after failing to impress for 8 years. Gotcha. | 17 | Q | rivalry jab | Man Utd | Y |  |
| 39 | @brfc_reece | Tiktok can be fucking sensational at times | 7 | Q | label | — | N |  |
| 40 | @eugeneh84 | The largest concentration of recruitment consultants in the world | 9 | Q | literal | Bermuda Triangle | Y |  |
| 41 | @11tial | Just heard Martial talk in my uni lecture, game might be back. | 12 | N | literal | Martial | N |  |
| 42 | @bernardooooV3 | Life is so private no one knows both Rodri and Bouaddi first ever Man city goal contribution came against Norwich. | 20 | P | deadpan fact | City | N |  |
| 43 | @sunnexxmcfc | Semenyo heard Doku was back from injury and he added goals to his game to no go far | 18 | P | irony | City | Y |  |
| 44 | @XolidCity | Haaland must be a troll 😭 waited for five straight wins in a row before cutting the hair. We all know exactly what he's doing, but I won't speak. | 28 | Q | conspiracy | Haaland | Y | 59103 |
| 45 | @NealGardner_ | What on earth??? | 3 | Q | one-line reaction | Raphinha | Y |  |
| 46 | @UTDMarcel | 3wks of no Barca football / 3wks of no man united football | 11 | M | vs | Barça/Utd | Y |  |
| 47 | @MattW36565526 | Spurs will sign this fella for £65 million and he will then go on to score 5 goals for them | 20 | Q | rivalry jab | Spurs | Y |  |
| 48 | @_mokaya | City fans falling for the early season Maresca title bait | 10 | P | rivalry jab | City | Y |  |
| 49 | @lfc_shan | just clocked our last three games of the season | 9 | S | fan-pov | Liverpool | Y | 24185 |
| 50 | @TJayyyy_1 | The PL is actually dark. Every game is a battle | 10 | Q | irony | Man Utd | Y |  |
| 51 | @UTDCJ_ | ten hag from amsterdam watching this brian brobbey masterclass | 9 | V | callback | Ten Hag/Brobbey | Y |  |
| 52 | @nottnog | little bro realized age is catching up and he's freaking out | 11 | Q | rivalry jab | Mbappé | Y |  |
| 53 | @SofianeArbeloa | Nobody will be up to your level. They'll understand in 20 years. | 12 | P | nostalgia | Ronaldo | Y |  |
| 54 | @pgrmq | I won't see Real Madrid for twenty days. | 8 | V | fan-pov | Real Madrid | Y |  |
| 55 | @leegx82 | Europa league final a few years ago 💀 | 7 | Q | callback | Utd/Spurs | Y |  |
| 56 | @_Mac_lfc | One of the hardest tweets of all time by a footballer | 11 | Q | nostalgia | Salah | N |  |
| 57 | @TheBenanya | The Prem legit the death of wingers with flair | 9 | Q | take | Barcola | Y |  |
| 58 | @elfayz_ | IS HE FU******* DOING ANOTHER INTERVIEW??? | 6 | Q | one-line reaction | Mbappé | Y |  |
| 59 | @DossenaLFC | They've genuinely turned a patch of grass into a tourist attraction because Salah sat there once. Absolute scenes. 😭 | 18 | Q | irony | Salah | Y |  |
| 60 | @ciszm | Ronaldo's obsession with records got em thinking Messi is tryna reach 1k goals too | 14 | Q | irony | Messi/Ronaldo | Y |  |
| 61 | @LyesBouzidi10 | Wow. | 1 | Q | one-line reaction | Man Utd | Y |  |
| 62 | @AnythingLFC_ | Andoni Iraola stops the UNBEATEN run he started 😏 | 8 | Q | irony | Iraola | Y |  |
| 63 | @cagiago_ | I bloody hate the international break man | 7 | Q | irony | — | Y |  |
| 64 | @utdbrxy | citypool ruined a good week for barclays | 7 | V | rivalry jab | City/Liverpool | Y |  |
| 65 | @RmaDonyFC | - Mbappe hates camping in the box / - Vinicius is our worst LW / - Diomande is our best RW / - Espi is our best 9 / This is the solution | 25 | L | literal | Real Madrid | Y |  |
| 66 | @elis_24_ | How didn't Swansea City get promoted with this team | 9 | L | nostalgia | Swansea | N |  |
| 67 | @Deezyagain_ | This is demonic | 3 | S | one-line reaction | — | N |  |
| 68 | @TheFootyFeed | Football's greatest comeback ever | 4 | P | label | — | Y |  |
| 69 | @onedarkhorse_ | had me fooled till i saw the fourth slide 😭 | 9 | Q | literal | — | Y |  |
| 70 | @Rafrigol | An image you'll never be able to look at the same way again | 13 | P | label | PSG | N |  |
| 71 | @DannCFC21 | Tried doing a Valencia rebuild on FC27 and conceded 16 goals in Preseason | 13 | P | irony | Valencia | Y |  |
| 72 | @Balatreado | When you pee / When you poop | 6 | M | vs | — | N |  |
| 73 | @lamoucheducOach | Mbappé tomorrow at 8:30 a.m. if he finds out that schoolkids are voting for the Ballon d'Or | 19 | M | escalation | Mbappé | Y |  |
| 74 | @_TrealFormula | George Weah already did it for Africa. You're not going to get that sympathy votes | 15 | Q | rivalry jab | Mbappé | Y |  |
| 75 | @Atleti_trolls | I think Cristiano Ronaldo is the only person who takes the Nations League seriously. | 14 | Q | irony | Ronaldo | Y |  |
| 76 | @thfcvictor | Might become a full time U-21 fan | 7 | S | irony | Spurs | Y |  |
| 77 | @_Mac_lfc | "tottenham can't be worse than last season" / de zerbi: | 9 | V | meme template | Spurs | Y | 12931 |
| 78 | @Super6 | Since November 2024... / Beyonce shows at the Tottenham Hotspur Stadium: 6 / Spurs Premier League wins at the Tottenham Hotspur Stadium: 5 | 21 | S | vs | Spurs | Y | 8024 |
| 79 | @ManUtd_trolls | New season, same sh!t | 5 | S | one-line reaction | Man Utd | Y |  |
| 80 | @RAEF1ELD | tchouameni done lost his damn mind | 6 | Q | callback | Tchouaméni | Y |  |
| 81 | @ChopperCuler | Day 3 of international break | 5 | Q | irony | — | Y |  |
| 82 | @Jay89R | Man City have gone a bit far with Yaya Toures birthday cake this year | 14 | Q | callback | Onana/Yaya | Y |  |
| 83 | @ErviRMA | If if if if if | 5 | Q | one-line reaction | Lamine | Y |  |
| 84 | @vvdijks | happy anniversary to the funniest second yellow ever | 8 | Q | nostalgia | Ekitike | Y |  |
| 85 | @JUGADORESCTM | He already has 11 free kick goals | 7 | Q | literal | — | Y |  |
| 86 | @tretrattini | Boxing Day in 1963 was CRAZY 😭 | 6 | S | irony | Serie A | N |  |
| 87 | @StokeyyG2 | The Amorim era was not real | 6 | P | nostalgia | Man Utd | N |  |
| 88 | @UTDTrey | Watch him turn into prime Sergio Ramos after playing like Phil Jones for us 😭 | 14 | Q | rivalry jab | Lisandro | Y | 5091 |
| 89 | @bobby_role | Throwback to when Mohamed Salah beat up an Everton fan and forced him to wear a Liverpool kit | 18 | P | literal | Salah/Everton | N | 50485 |
| 90 | @UTDTrey | Arteta has made the streets forget Eze | 7 | Q | callback | Eze/Arsenal | Y |  |
| 91 | @FCB_nenn | I told the girl I'd rather spend time with her this weekend than watch soccer (there's a break). | 18 | V | fan-pov | — | Y |  |
| 92 | @FootyHumour | I told my girl I'd rather spend the weekend with her than watch football (there's an international break) | 18 | V | fan-pov | — | Y | 41370 |
| 93 | @BodegaaCat | Press tour for beating Arsenal 🫩 | 5 | Q | irony | Brighton/Arsenal | Y | 7900 |
| 94 | @nirufella | Valverde not playing india vs uruguay? Faking an injury to dodge the Anirudh Thapa test | 15 | Q | conspiracy | Valverde | Y |  |
| 95 | @CourageFCB | This account is on a generational (and suspicious) run. | 9 | Q | conspiracy | Mbappé | Y |  |
| 96 | @vini_ball | CARLO ANCELOTTI complaining about Endrick not getting playing time I've seen it all 😭 | 13 | Q | irony | Ancelotti | Y |  |
| 97 | @BigFrman | *Community service has now been added to Ballon d'Or criteria* / Mbappe: | 11 | M | fake scenario | Mbappé | Y | 7225 |
| 98 | @wavygooner | United not in hell yet | 5 | S | rivalry jab | Arsenal | Y |  |
| 99 | @LilSunny_666 | Arteta conceded 3 and told Saliba to hurry up | 9 | Q | irony | Arsenal | Y | 5516 |
| 100 | @MCIKevn | They are about to witness one of the greatest rivalries in human history .. | 13 | Q | literal | — | Y |  |
| 101 | @neygoat34 | How tf do they communicate??? | 5 | L | literal | England | Y |  |
| 102 | @futbol_fantasy | The best marketing campaign in history and nobody noticed. | 9 | P | conspiracy | Real Madrid | N |  |
| 103 | @THEZONEEEEEE | It's still mental to me that this bloke wasn't Gareth bale | 11 | P | lookalike | Bale | N |  |
| 104 | @idris_lfc1 | COVID football was not real 😭 | 5 | S | nostalgia | — | N |  |
| 105 | @FootballFactly | The face of a man on the brink of a £52M payout 🤣 | 12 | V | label | — | Y |  |
| 106 | @DanikRM_ | Honor. | 1 | P | one-line reaction | Real Madrid | Y |  |
| 107 | @CFC_Janty | The World Cup was 64 days ago | 7 | P | deadpan fact | — | Y |  |
| 108 | @MarockX | New position of Endrick | 4 | M | literal/callback | Endrick/Mourinho | Y | 74226 |
| 109 | @vinigham | kylian mbappe wins you the games you would win without him. | 11 | N | irony | Mbappé | Y | 52963 |
| 110 | @eyesovastats | The last time Tchouameni won a duel was against Fede Valverde | 11 | N | deadpan fact/callback | Tchouaméni | Y | 137380 |
| 111 | @sbzcomps | Only way to beat the Bermuda Triangle is to employ the Bermuda Triangle | 13 | V | literal | Bermuda Triangle | Y | 30620 |
| 112 | @thandomoeng | this can't be the same year we watched fifa world cup in. | 12 | N | nostalgia/irony | — | Y | 198080 |
| 113 | @Olalekan_000 | João Pedro when he spots Cole Palmer at Cobham hospital after faking their injuries to get revenge on their international coaches | 21 | M | conspiracy | Chelsea | Y |  |
| 114 | @tedio74 | Always remember, it was this clown who got Nani sent off by rolling around on the floor in one of the worst decisions in CL history. | 26 | Q | callback | Arbeloa | Y |  |
| 115 | @trollol_epl | Marcus Rashford : The return | 4 | M | label | Rashford | Y |  |
| 116 | @Spurs_Yorugua | There is a Chinese proverb that says: An arrow, to fly strongly, must first be drawn back. | 17 | S | irony | Spurs | Y |  |
| 117 | @nadjib_ | The very funny statistic | 4 | S | vs | Real Madrid/Raphinha | Y |  |
| 118 | @vanemrys15 | Try and be watching Ligue 1. Don't let anybody lie to you that this guy deserves the Ballon d'Or. | 19 | V | take | PSG | Y |  |
| 119 | @prettyolise | Saw someone call this L Clasico 😭 | 6 | S | nickname | Utd/Spurs | Y |  |
| 120 | @CFC_Janty | Crazy how the best players in the world were once at Crystal Palace and Leeds United. | 16 | P | deadpan fact | Olise/Raphinha | Y |  |
| 121 | @ekitikEraa | First successful arsenal hate watch of the season and it's gonna last for 3 weeks | 15 | V | rivalry jab | Arsenal | Y | 20776 |
| 122 | @enfueradejuego | (no caption) | 0 | M | callback | Mourinho | Y | 23484 |
| 123 | @maldiidown | (no caption) | 0 | M | literal | Vinícius | Y | 34272 |
| 124 | @AnabellaMarvy | Yea they lost because the referee liked raphinha's moustache | 9 | Q | conspiracy | Real Madrid | Y | 18504 |
| 125 | @ErlingRole | He's everywhere | 2 | S | one-line reaction | Haaland | Y |  |
| 126 | @hdlfc_ | depressed gimmick when you had multiple chances to leave for other big clubs, no one feels bad for you lol | 20 | Q | rivalry jab | Endrick | Y |  |
| 127 | @Sxne19iv2 | He's acc a 99 rated player | 6 | Q | irony | Nuno Mendes | Y |  |
| 128 | @footy_road | Liverpool's next 5: Man City, Arsenal, Brighton, Brentford, Bournemouth. Two title rivals and the Bermuda Triangle | 16 | V | deadpan fact | Liverpool | Y |  |
| 129 | @BigFrman | Of course. | 2 | Q | one-line reaction | Olise | Y |  |
| 130 | @MC_frnk | We went from Marmoush to Ndiaye. Feels like a dream to me | 12 | P | irony | City | Y |  |
| 131 | @UtdJBT | 3 weeks without Manchester United ball | 6 | V | fan-pov | Man Utd | Y |  |
| 132 | @dharnyyoung | Okay, since no one is going to say it, WHEN DID CAMPAIGNING FOR THE BALLON D'OR BECOME NORMAL??? | 18 | Q | take | Kane/Mbappé | Y |  |
| 133 | @MCFC_Jayy | Nice. Now do one with Pascal Groß | 7 | Q | rivalry jab | City/Brobbey | Y |  |
| 134 | @AirNeuf_ | Photos that look like they're going to install fiber optic | 10 | Q | literal | Henry | Y |  |
| 135 | @waleedinhoafc | How does this fixture ALWAYS end up becoming the El Sackico? | 11 | S | nickname | Utd/Spurs | Y |  |
| 136 | @Aliotop_ott | Florentino Pérez killed this club in the summer of 2024 | 10 | Q | receipt/callback | Real Madrid | Y |  |
| 137 | @Crstnxscottt | These in the Premier were elite, eh | 7 | L | irony | Real Madrid ex-PL | Y |  |
| 138 | @EliLeezayy | Real Madrid subbing out Tchouameni for Camavinga. | 7 | V | literal | Real Madrid | Y |  |
| 139 | @gnf_ogo | tears | 1 | Q | one-line reaction | Arsenal | Y |  |
| 140 | @elsdawg | grass isn't green on this side either | 7 | Q | irony | Cucurella | Y |  |
| 141 | @sashedelic | TRUE LEADER → | 2 | S | irony | Spurs | Y |  |
| 142 | @yyusufadz | Wirtz plays like he's got a snus in | 8 | P | literal | Wirtz | Y |  |
| 143 | @cherkdiola | Savio really was the missing piece for a spurs relegation | 10 | P | rivalry jab | Spurs | Y |  |
| 144 | @olise_ig | I tried to play it cool by not running to catch the bus, I checked the next one, it comes in 1 hour. | 23 | V | fan-pov | — | N |  |
| 145 | @unknown | Robert Sánchez every time Chelsea concede since they loaned him out to | 12 | M | conspiracy | Chelsea | Y |  |
| 146 | @WindUpWounded | So crazy that you can literally make a triangle out of the distances between them as well, what are the chances of that | 23 | Q | irony | Bermuda Triangle | Y |  |
| 147 | @UtdJBT | even a furniture company can't stand to watch spurs | 9 | Q | rivalry jab | Spurs | Y |  |
| 148 | @Czooba | Lmao, every International break, there's a random post of an imaginary billionaire acquiring Man United | 15 | Q | irony | Man Utd | Y |  |
| 149 | @Pedri8Iniesta | Dark, dark times | 3 | Q | nostalgia | Barça | N |  |
| 150 | @LaPiochey | At this point Mbappe and Yamal might aswell go on Vlad TV | 12 | N | escalation | Mbappé/Lamine | Y |  |
| 151 | @VIVARONALDOOO__ | Every time I looked at a different corner of the team sheet I screamed louder | 15 | Q | irony | Man Utd | Y |  |
| 152 | @markmanderfield | The most embarrassing fixture in our history this evening. | 9 | M | irony | Leicester | Y |  |
| 153 | @unknown2 | Just downed a bottle of coke to contribute towards Man United's downfall | 12 | M | irony | Man Utd | Y |  |
| 154 | @unknown3 | Man United fans when the Glazers don't run on the pitch and score a 40 yard screamer every game | 19 | M | rivalry jab | Man Utd fans | Y |  |
| 155 | @pwdrianti | iniesta needs to sue | 4 | Q | one-line reaction | Ferran Torres | Y | 13663 |
| 156 | @wwfcbilly | Matheus Mane 'match worn shirt' yet he gave it to my mate??? | 12 | P | spotted detail | Wolves | Y | 13075 |
| 157 | @wosimoFC | Day 3 of the international break: | 6 | Q | irony | — | Y | 13338 |
| 158 | @eff_hey | every single Prem team has covered at least 5km more than Elche in first place lol | 16 | Q | deadpan fact | Elche | Y | 4953 |
| 159 | @usedtobeingme | what do u mean Krychowiak is baking off in Somalia | 10 | P | literal | Krychowiak | Y |  |
| 160 | @diasp8dri | Uncles at a party be like | 6 | V | fan-pov | — | N |  |
| 161 | @Boluwatiiffee | Deep down, we know Mbappé doesn't deserve the Ballon d'Or. We just don't want Yamal to win it. | 18 | N | take | Mbappé/Lamine | Y |  |
| 162 | @cubapau | nothing funnier than pedri on ref cam | 7 | V | label | Pedri | Y |  |
| 163 | @7sferran | We irritating | 2 | P | one-line reaction | Barça | Y |  |
| 164 | @NoodleHairCR7 | Ballon dor contenders last week: | 5 | M | fake dialogue | Raphinha/Ballon d'Or | Y | 75775 |
| 165 | @BlackYellow | A three week international break and it's only September. | 9 | V | irony | — | Y | 179389 |
| 166 | @Momelezi13_ | "Give me the ballon dore" / "I deserve the Ballon dOr" / "I won" / "I scored" | 14 | M | vs | Mbappé | Y |  |
| 167 | @zubigooner | Tottenham's signings this season | 4 | V | rivalry jab | Spurs | Y |  |
| 168 | @JeffFcb14 | This already looks like the Barça Femení 😭 | 7 | S | rivalry jab | La Liga | Y |  |
| 169 | @jdejuanfranco | What if the rumors about Bernardo, Dumfries, Diomande, and Cucurella were invented by Deco so that Real Madrid would sign them? | 21 | N | conspiracy | Real Madrid | Y |  |
| 170 | @SehLengeyThoda | Cubarsi when he sees Anthony Gordon running at him on Sunday | 11 | V | literal | Cubarsí/Gordon | Y |  |
| 171 | @JameswhufcJones | Geezer in white at the top of the stairs Scrolling on his phone, puts it away, top bins, straight out the door | 22 | Q | spotted detail | Villa | Y |  |
| 172 | @DebsSZN | Read it slowly. 😂😂 | 3 | S | one-line reaction | Arsenal | Y | 46236 |
| 173 | @DossenaLFC | The Bermuda Triangle 😭 | 3 | S | nickname | Brentford/Brighton/Bournemouth | Y | 59800 |
| 174 | @StokeyyG2 | Fairs. | 1 | S | one-line reaction | Haaland/Brobbey | Y | 11215 |
| 175 | @TheFootballFeed | Yours sincerely, all Football fans. | 5 | P | label | — | Y | 16574 |
| 176 | @Dominos_UK | El Clownico | 2 | S | nickname | Utd/Spurs | Y | 37531 |
| 177 | @SunderlandAFC | Think you've missed someone 🤷‍♂️ | 4 | Q | rivalry jab | EA/Brobbey | Y | 23622 |
| 178 | @nocontextspurs | (no caption) | 0 | M | literal | Solanke | Y | 20525 |
| 179 | @UTDTrey | "Maresca we will never forgive you" 😭😭😭 | 6 | S | fake quote | Chelsea/City | Y | 16802 |
| 180 | @TrollFootball | He wanted to be the next Ronaldo. He became the next Ibrahimovic. | 12 | Q | vs | Mbappé | Y | 13061 |

## Appendix B: fan/banter X posts with 9K+ likes, 18–24 Sep 2026 (news, club and non-football accounts excluded; n=73)

| likes | handle | date | media | caption (first 110 chars) |
|---|---|---|---|---|
| 198,080 | @thandomoeng | 09-20 | none | this can't be the same year we watched fifa world cup in. |
| 179,389 | @BlackYellow | 09-18 | video | A three week international break and it’s only September. |
| 137,380 | @eyesovastats | 09-20 | none | The last time Tchouameni won a duel was against Fede Valverde |
| 94,116 | @CFC_Janty | 09-19 | video | Arsenal losing to Brighton is the perfect time to use this video 😭😭😭 |
| 75,775 | @NoodleHairCR7 | 09-19 | photo | Ballon dor contenders this week: |
| 74,226 | @MarockX | 09-21 | photo | Nueva posicion de Endrick |
| 59,800 | @DossenaLFC | 09-20 | photo | The Bermuda Triangle 😭 |
| 59,103 | @XolidCity | 09-21 | quote | Haaland must be a troll 😭 waited for five straight wins in a row before cutting the hair. We all know exactly  |
| 52,963 | @vinigham | 09-20 | none | kylian mbappe wins you the games you would win without him. |
| 50,485 | @bobby_role | 09-22 | photo | Throwback to when Mohamed Salah beat up an Everton fan and forced him to wear a Liverpool kit |
| 48,342 | @_Hybreed_ | 09-19 | video | Arsenal finally joins the group 😭😭😭 |
| 46,236 | @DebsSZN | 09-20 | photo | Read it slowly. 😂😂 |
| 44,133 | @theberneese | 09-20 | photo | -He rejected Real Madrid 3 times in 7 years / - He used them to negotiate a better salary  / - He breaks the l |
| 43,015 | @GeronimoMorgans | 09-19 | video | Backed his shit. Packed Arteta and his Arsenal. Poetic justice. |
| 41,370 | @FootyHumour | 09-23 | video | I told my girl I'd rather spend the weekend with her than watch football (there's an international break) |
| 39,466 | @Mideola_Xx | 09-19 | video | In case you miss the Brighton vs Arsenal match,, This is the highlight 😂😂😂 |
| 37,531 | @Dominos_UK | 09-19 | photo | El Clownico |
| 36,949 | @lledrok | 09-22 | quote | football coming back has brought some of the most unthinkable sentences onto my tl |
| 34,272 | @maldiidown | 09-20 | photo | (no caption) |
| 30,620 | @sbzcomps | 09-20 | animated_gif | Only way to beat the Bermuda Triangle is to employ the Bermuda Triangle |
| 29,518 | @fedevalv_ | 09-19 | quote | They’re suffocating Arsenal 😭😭😂 |
| 28,008 | @maldiidown | 09-20 | photo | por cierto, honor a este tio eh /  / se olió la que se le venía y se piró  /  / visionario estratosférico |
| 27,928 | @maldiidown | 09-20 | photo | (no caption) |
| 26,968 | @BMPCSAFC | 09-22 | photo | I acc didn’t notice this /  / Ruben Dias kept grabbing Brian Brobbey’s sleeves, so he changed to short sleeves |
| 26,294 | @BlackYellow | 09-23 | photo | Cristiano Ronaldo and the GOAT. 🇵🇹🏹 |
| 25,785 | @Goldco69 | 09-22 | photo | I genuinely thought he’d have broken the record already |
| 25,528 | @YashRMFC | 09-20 | quote | He brought a photo as proof to the press conference, lol. /  / This is the Mourinho I knew |
| 24,185 | @lfc_shan | 09-20 | photo | just clocked our last three games of the season |
| 23,812 | @Deezyagain_ | 09-19 | photo | Where do Brighton get these coaches from lmao |
| 23,622 | @SunderlandAFC | 09-23 | photo | Think you’ve missed someone 🤷‍♂️ |
| 23,484 | @enfueradejuego | 09-20 | photo | (no caption) |
| 20,776 | @ekitikEraa | 09-19 | video | First successful arsenal hate watch of the season and it’s gonna last for 3 weeks 😭❤️ |
| 20,525 | @nocontextspurs | 09-19 | photo | (no caption) |
| 20,238 | @UTDCJ_ | 09-19 | video | ARSENAL HOLD IT |
| 19,541 | @TheHateCentral2 | 09-21 | photo | It’s time.  /  / Our first PL Team of the Weakened. 🌟 |
| 19,148 | @CFC_OBED | 09-19 | photo | Wait Brighton were  missing 8 players when they were   beating Arsenal today ? |
| 18,730 | @Cfc_Kemboi | 09-19 | video | Allow me drop this generational arsenal material |
| 18,504 | @AnabellaMarvy | 09-20 | quote | Yea they lost because the referee liked raphinha's moustache |
| 17,559 | @BaldeWaves | 09-20 | video | Vini ever since the chin surgery |
| 16,802 | @UTDTrey | 09-20 | photo | “Maresca we will never forgive you” 😭😭😭 |
| 16,574 | @TheFootballFeed | 09-22 | photo | Yours sincerely, all Football fans. |
| 16,128 | @TheHateCentral2 | 09-19 | video | Bricklayer G vs Brighton  /  / Pegged by the Seagulls. 💯 |
| 14,547 | @TrollFootball | 09-21 | video | Arsenal lost / Real Madrid lost / Chelsea lost / Spurs lost / Man Utd drew |
| 14,427 | @TrollFootball | 09-22 | video | Marcelo with one of the best assists ever 😳 |
| 14,218 | @UTDCJ_ | 09-21 | video | 13+ years bro |
| 13,663 | @pwdrianti | 09-22 | quote | iniesta needs to sue |
| 13,636 | @midopido21 | 09-19 | video | Nicolas Jackson - Cookin' Spurs |
| 13,338 | @wosimoFC | 09-22 | quote | Day 3 of the international break: |
| 13,256 | @ReshadRahman | 09-23 | none | 4:50am and I’m out here missing Messi play for Futbol Club Barcelona. |
| 13,075 | @wwfcbilly | 09-22 | photo | Matheus Mane ‘ match worn shirt’ yet he gave it to my mate??? 🤔🤔🤔 |
| 13,003 | @jmRMCF | 09-22 | photo | How do I explain to my kids that Mbappe played for both PSG and Real Madrid since 2022 |
| 12,931 | @_Mac_lfc | 09-19 | video | “tottenham can’t be worse than last season” /  /  de zerbi: |
| 12,441 | @ShimmyRmcf | 09-22 | video | Football before fabrizio |
| 12,058 | @granTurism01 | 09-21 | none | •Vincent Kompany went to the Bundesliga and held the league hostage. /  / •Hansi Flick went to La Liga and hel |
| 11,911 | @theberneese | 09-20 | photo | Mourinho will lose his job right after this day  /  / You saw it here first |
| 11,771 | @PolymarketSport | 09-21 | photo | 🚨FACT: Unai Emery has more wins at Tottenham’s stadium than the last 3 Spurs managers combined |
| 11,347 | @Footballtweet | 09-21 | photo | 😆 And Spurs did both. |
| 11,305 | @Mrbankstips | 09-22 | video | Football |
| 11,215 | @StokeyyG2 | 09-20 | photo | Fairs. |
| 11,096 | @theberneese | 09-20 | photo | LETS ALL LAUGH AT REAL MADRID😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂😂 |
| 10,617 | @UTDTrey | 09-22 | photo | Mfs calling this L Classico😭 |
| 10,587 | @joshhcelona | 09-23 | video | Flick in the streets of Catalonia when he finally wins the 6th for Barcelona |
| 10,552 | @KalLo_1000 | 09-23 | video | Where's Real Madrid heading 😂 |
| 10,541 | @Mide__M | 09-23 | animated_gif | God if you later add me for lineup make e no be against UCL RONALDO 😭😭 |
| 10,238 | @ReshadRahman | 09-23 | none | 🚨 “He used to complain that the club didn't care about him, but we haven't seen a player who got more opportun |
| 10,159 | @Glassinho | 09-23 | quote | This is pretty much a red flag for most bigger clubs. Do this at a club like Spurs or Manu and the players wou |
| 9,905 | @StokeyyG2 | 09-22 | photo | 10 years on from Leicester becoming Premier League Champions, they play Fulham’s U21’s in the EFL Trophy tonig |
| 9,713 | @Messsiesque | 09-22 | video | Ladies and Gentlemen, may I present you the Ballon d'or 2026 winner |
| 9,493 | @UtdJBT | 09-20 | photo | Luke Shaw and Rashford vs Fulham |
| 9,470 | @starryseblos | 09-20 | photo | every real madrid game |
| 9,398 | @UTDTrey | 09-23 | quote | Bro said “I leave you to God”😭😭😭 |
| 9,280 | @mrbayoa1 | 09-20 | photo | Dear Mikel Arteta and Arsenal fans, please hear me out. 😁😁 |
| 9,191 | @TrollFootball | 09-23 | video | She turned the kid into a Jordan logo. |

Raw data: OCR dumps and the scripts are in the session scratchpad; the tweet JSON is in `/private/tmp/tt/pool*/`.
