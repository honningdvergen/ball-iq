# Banger library: Facebook Pages (studied 28 Sep 2026, 16:00–17:05 Oslo)

**What this is:** how the big football humour and fan-media Pages on Facebook post right now, and the 12 best posts of their last ~14 days. It is written for our Page (Shithousery HQ, **530 followers**, our fastest grower). Our own FB reel numbers (40–80K hits against a ~30-view floor) live in `LIBRARY_video.md`, FB-01…07. This file adds the view from outside.

**How it was built:**
- The data comes from Alex's logged-in Chrome, strictly read-only. I captured each Page's feed from Facebook's own GraphQL responses, so creation time, reactions, comments, shares and video views are the real counts, not estimates. Reels come from each Page's `/reels/` tab: tile view counts, plus captions and dates from the reel pages.
- FB shows no views on photo posts, so photos are ranked by **reactions + 2×shares**. Reels are ranked by views.
- **No images were saved.** `save_to_disk` on the zoom action produced no file, so every entry below describes the image precisely instead. I looked at every image.
- Times are Oslo. **The week's story** was City found guilty on the 115 charges (Ornstein, ~15:41 Thu 25 Sep).
- Scope was humour and fan media. Betting brands (ODDSbible, Paddy Power) were skipped, as the brief said.

## The Pages

| Page | Followers | Posts/day (feed) | Mix | Median reactions | Reels | Status |
|---|---|---|---|---|---|---|
| **Football Funnys** `/FootballFunnys` | 858K | **4.5** | 100% single photo (43/43), some AI-labelled ("KI-innhold") | 423 (shares 15) | none (the reels tab is empty) | ACTIVE, humour-native |
| **Football Planet** `/footballlplanet` | 1.9M | **16.5** | 100% single photo in the feed | 753 (shares 11) | ~30 since May (≈0.25/day), median ~140K, top 1.2M | ACTIVE, humour-native |
| **SPORTbible** `/SPORTbible` | 14M | **19** | 96% branded news cards, 4% reels | 345 (shares 4) | 30K median; one 993K was a Domino's AD | ACTIVE, publisher |
| **433** `/official433` | 7.2M | **13** | 79% photo, 7% albums, 14% reels | 14,177 (shares 80) | last 10: 96K–555K, median ~440K | ACTIVE, fan media |
| **Oh My Goal** `/OhMyGoal.KeliNetwork` | 21M | **12** photos + reels on a separate tab | photo feed + fan-cam reels | 3,374 | last 40: median ~48K, top 473K, floor 8K | ACTIVE, fan media |
| **SPORF** `/sporf` | 1.2M | **7.8** | 87% photo, 9% reels | **137** | 4–9K floor, one at 639K | ACTIVE, weak |
| **Sunday League Football** `/slfooty` | 164K | 0.4 humour posts/day (+ shop) | reels + the odd photo | 153 | 660K / 82K / 75K against a 5K floor | ACTIVE, amateur-clip humour |
| **Soccer Memes** `/SoccerMemez` (ClutchPoints) | 121K | 1.1 | all photo | **32** | – | ACTIVE, weak |
| The Footy Feed | 1.3M | 1.1 | photos + shared betting slips | 257 | – | decaying |
| Troll Football (verified) | 269K | 0 | – | – | – | **DEAD since 16 Jul** |
| Troll Football EU | 535K | 0.5 | photo | ~300 | – | near-dead |
| Football Memes `/TheFootballMemez` · Premier League Memes | 285K · 237K | 0 | – | – | – | **DEAD since late Jul / 26 Aug** |
| Soccer AM · Footy Humour · "Football Jokes" (183K) | 2.6M · 75K · 183K | 0 | – | – | – | DEAD (May 2026 · 2014 · 5 Sep, 6-view videos) |

**Read of the table:**
- Half the famous football-meme Pages on FB are **dead**, some with 250–500K followers. Their follower counts earn them nothing: SPORF has 1.2M followers and a median of 137 reactions, Soccer Memes has 121K and a median of 32.
- **On FB, every post earns its own distribution.** A follower base carries no reach on its own.

---

## THE CRAFT for FB pages (from looking)

A reviewer can check each rule. The numbers in brackets are the entries below that show it.

1. **Volume is the base rate: at least 4 posts a day, every day, and never go dark.** Every humour Page that is alive posts 4.5–19 times a day (Football Funnys 4.5, Oh My Goal 12, 433 13, Football Planet 16.5, SPORTbible 19). Every Page that slowed or stopped is dead at any follower count: Troll Football at 269K, TFEU at 535K, Football Memes at 285K. **Check:** did the Page post at least 4 times today?

2. **The format mix is photo-first, with reels as the lottery ticket. Aim for about 4 photo-memes to 1 reel.** The two pure humour winners are 100% single photos in the feed (FBP-01…05). Football Planet adds only ~0.25 reels a day. Photos give a steady floor every time (a 423–753 median on the meme Pages). Reels are **binary** on every Page, just like on ours: SPORF 639K against a 4–9K floor (FBP-07), Sunday League 660K against 5K (FBP-11), Oh My Goal 473K against 8K. **Check:** is today's slate mostly single images, with 1–2 reels on top?

3. **A photo-meme is ONE 4:5 image with the joke IN the image, and the caption only frames it.** The winners are 1024×1280 or 1080×1296 portrait images. The image does the work: an AI-edited scene (FBP-02, 03), a tweet-reply overlay on a stadium photo (FBP-01), a fake TV lower-third (FBP-04, 05), or a 2×2 grid (FBP-08). The caption is ≤10 words and ends in 🤣/😭/🚨/"…". Examples: "That response 🤣🤣🤣", "Life before cheating...", "Manchester City have announced their new sponsor. 🚨". **Check:** cover the caption. Is the image still the joke?

4. **After a result, the caption is just the scoreline and the image is the joke.** "FULL TIME: BRIGHTON 3-0 ARSENAL" over an AI Arteta drenched in seagull droppings got 3,064 reactions and 519 shares (FBP-03). This is library rule 0 again, the literal nickname vessel (seagulls = Brighton, bees = Brentford in our FB-02). **Check:** would someone who didn't watch the match get it from the picture?

5. **Share-bait means a receipt or a fake-news post about this week's villain, out within ~1 hour.** The most-shared posts of the week all hit City's 115: the Cheetos sponsor, **720 shares**, posted 75 min after the story broke (FBP-02); the tweet-reply overlay, 455 (FBP-01); "Life before cheating…" plus Boro 8-1 City 2008, 125 (FBP-05); Pep's 2020 "if you lie to me" quote, 158 (FBP-12); SPORF's list of "champions if City are stripped", 193. Rival fans forward these to City fans, and that forwarding is the share. **Check:** is it about the week's villain, would a rival fan send it to a victim, and is it out the same day?

6. **Comment-bait means a question whose answer is a NAME (or a vote), asked over an image that shows the options.** Examples:
   - 433's Ballon d'Or case, "WHO'S YOUR WINNER?": **4,902 comments**, 5× their next best (FBP-09).
   - SPORTbible's 4 free-kick takers, "only one man can take it": **1,705** (FBP-08).
   - Sunday League's "IF YOU KNOW THIS PAIN, YOU KNOW!" ankle: **800 comments** on 1,862 reactions.
   - "You're the Ref… should this goal have been disallowed?": **209 comments on 49 reactions**.
   - Football Funnys' "most overrated player in the PL right now": 149 comments on 259 reactions.

   A megastar failing also pulls comments: Ronaldo's six-yard miss drew 1,327 (Oh My Goal). **Check:** can a reader answer in one word or one name?

7. **A reel is 7–21 s: phone, fan-cam or presser footage with ONE burned-in caption box, and the hit needs zero football knowledge.** 433's reels run 7–29 s (median ~12 s). The viral reels elsewhere are 15 s (FBP-11), 20 s (FBP-07) and 20–21 s (Football Planet's 1.2M and 836K). The caption box is either a yellow box ("GORDON: 'I WATCH ALL OF JUDE'S GAMES AND HOPE HE LOSES' 😂", "2000 AND WHAT?!") or a white sticker ("Have another go son😳", "Especially when your team is losing 👎"). The post caption is one line in CAPS + emoji + a 🎥 credit. The hits:
   - a grown man failing a free kick (660K)
   - a keeper pelted with debris (639K)
   - Ronaldo driving a golf buggy (468K)

   **Check:** does it read with the sound off, does it make sense to a non-fan, and is it ≤21 s?

8. **There are two caption families, and neither asks for a follow.**
   - (a) **Meme Pages:** one line of ≤10 words.
   - (b) **Publishers:** headline + a 2–3 sentence explainer with a twist emoji. The long caption wins only when the story itself is absurd-but-true: SPORF's "Pep seriously considered playing Neuer in MIDFIELD" got **30,352 reactions, 220× their median** (FBP-06).

   **None of the ~40 top captions I read asks for a follow.** The only CTAs are community ones: "Send us your clips to get featured ✅" (Sunday League) and "WHO'S YOUR WINNER?". Hashtags appear only on Sunday League. **Check:** no "follow for more"; use a question or a clip request if you need a CTA.

9. **AI-edited photos are allowed and they win, even with the AI label.** Football Funnys carries Meta's AI label ("KI-innhold") on some posts, and its AI-edited images are its #2 and #3 by reactions and its #1 by shares: Arteta + seagulls (3,064 reactions, 519 shares) and Haaland in a Cheetos kit (2,258 reactions, **720 shares**). A fake sponsor, fake crest or fake scene is an *original* image, which gets past FB's originality gate, whereas a reposted clip does not. **Check:** if it's a fake, is it obviously a joke and not passable as real news? The Cheetos kit works because "Cheetos" = "cheaters".

10. **Where the follows come from is an inference; I can't see their follow data.** Follows come after a breakout, and on FB a breakout comes either from a reel that escapes or from a share-heavy photo. Football Funnys grew to 858K with zero reels, on consistency alone. This matches our own data: all our FB follows came with the 40–80K reel escapes. **Check:** measure follows per post in Metricool before deciding a format "doesn't convert".

---

## The 12 best posts (last ~14 days)

### FBP-01 Football Funnys (858K) · Thu 25 Sep 21:49 · 3,412 reactions · 111 comments · **455 shares** · single photo 4:5
- **Image:** the Etihad bowl from high in the stand at dusk, floodlights on and the pitch green. Over the lower third, a dark translucent card holds two tweets. **Walid Arsenal** (blue tick), "What was the 1 charge they were found not guilty for 🤣". Reply from **Paddy @PaddyArsenal**: "Overcrowding". The empty-looking stadium photo *is* the punchline.
- **Why this image:** the photo proves the reply. City's half-empty ground is a running joke, and the stadium shot makes it visual.
- **Caption shape:** "That response 🤣🤣🤣" (2 words + emoji). It credits the tweet format without explaining the joke.
- **Needs football knowledge?** A little (the 115 charges, City's crowds). But "overcrowding" as the one charge they're innocent of lands for anyone who has heard the story.
- **Steal this:** screenshot a rival-fan tweet exchange (question + killer reply) onto a photo that proves the reply. 4:5, a dark translucent card, 2-word caption.

### FBP-02 Football Funnys · Thu 25 Sep 16:56 (≈75 min after the story) · 2,258 reactions · 150 comments · **720 shares (the page's #1)** · AI photo
- **Image:** Haaland standing on the Etihad pitch in a City home shirt (Puma), with the sponsor replaced by a big **CHEETOS** logo. It is photo-real and deadpan, and there is no text on the image.
- **Why this image:** "Cheetos" = "cheaters". It is a pun you *see*. A fake kit reveal copies how real sponsor announcements look.
- **Caption shape:** "Manchester City have announced their new sponsor. 🚨" A fake-news deadpan in club-statement voice.
- **Needs football knowledge?** No. City cheated, and Cheetos sounds like cheaters.
- **Steal this:** on villain day, make a fake official asset (sponsor, kit, crest, stadium sign) whose brand name is the insult. Write the caption as a straight announcement.

### FBP-03 Football Funnys · Fri 19 Sep 17:52 (full time) · 3,064 reactions · 253 comments · 519 shares · AI photo
- **Image:** Arteta on the touchline in a black training top, arms flung up and mouth open. Four seagulls hover above him and he is covered in white droppings (head, shoulders, chest). The background is blurred red stadium.
- **Why this image:** seagulls = Brighton. The result becomes a literal image of being "shat on by the Seagulls".
- **Caption shape:** "FULL TIME: BRIGHTON 3-0 ARSENAL". Just the score. The image is the joke.
- **Needs football knowledge?** Almost none: "the Seagulls" beat Arsenal, and a man is covered in bird mess.
- **Steal this:** at full time of a big upset, post the scoreline as the caption over the winner's nickname vessel doing violence to the loser's manager (bees, seagulls, foxes, magpies, hammers).

### FBP-04 Football Funnys · Wed 24 Sep 13:36 · 1,868 reactions · 189 comments · 40 shares · 2-panel photo (the same meme did 1,643 reactions on Football Planet, 26 Sep)
- **Image:** two Sky Sports F1-paddock interviews stacked, each with a Sky lower-third. The top one reads "**Phil Foden** · 6-Time Premier League Winner with Manchester City" (City crest). The bottom one reads "**Bukayo Saka** · Player for Arsenal" (Arsenal crest).
- **Why this image:** the joke lives in the broadcaster's own graphic. Six titles against "Player for Arsenal".
- **Caption shape:** "This is a rough look for Saka from Sky Sports 😭😭" (Football Planet used "Sky Sports did Foden so dirty here 😭😭". The same image with the opposite framing, and both worked.)
- **Needs football knowledge?** Minimal. You can read the two captions.
- **Steal this:** a TV lower-third comparison (or a fake one) where the titles under two names do the mocking. It travels between Pages, so be first.

### FBP-05 Football Planet (1.9M) · Fri 26 Sep 15:50 · 1,732 reactions · 61 comments · **125 shares (the page's #1 by shares)** · single archive photo
- **Image:** a dejected ginger City player in the old light-blue Thomas Cook-era kit, walking off in front of a crowd. At the bottom is a TV-style navy lower-third: "**MIDDLESBROUGH 8-1 MANCHESTER CITY** · MAY 11 2008".
- **Why this image:** a receipt from before the money. It reminds everyone what City were before the charges.
- **Caption shape:** "Life before cheating..." (3 words + ellipsis).
- **Needs football knowledge?** Low. "8-1" and "cheating" are enough.
- **Steal this:** our maths/receipt lane as a single image. An archival humiliation + a lower-third with the score and date + a 3-word caption. *Also worked:* "Manchester City away at Grimsby Town in the mud and rain next season..." (1,861 reactions), a real photo of a sky-blue amateur side on a waterlogged pitch.

### FBP-06 SPORF (1.2M) · Tue 23 Sep 17:30 · **30,352 reactions (220× page median)** · 82 comments · 40 shares · 2-panel photo
- **Image:** two training-ground photos. Pep squatting next to Neuer in goalkeeper kit on the pitch, and Pep coaching Neuer (Bayern red training top) with a hand on his arm. SPORF logo top right. No text on the image.
- **Why this image:** the photos show the absurd idea happening: the manager and his keeper deep in a tactical chat.
- **Caption shape:** long publisher style: "Back when Pep Guardiola was Bayern Munich manager, he seriously considered playing Manuel Neuer in MIDFIELD after Bayern had already won the Bundesliga. 😳 … Rummenigge revealed he had to talk Pep out of the idea… 😂 A box-to-box Neu[er]…". The CAPS word carries the absurdity.
- **Needs football knowledge?** No. "Goalkeeper in midfield" is funny to anyone.
- **Steal this:** absurd-but-true anecdotes about famous managers. The long caption is fine when the fact is the joke, and the CAPS word marks the absurd part.

### FBP-07 SPORF · Tue 23 Sep 13:47 · reel 20 s · **639,062 views** (other reels that week: 4–9K) · 1,349 reactions
- **Frame 1:** a high fan-cam from behind the goal. A keeper in yellow and a defender stand by the post, with debris and bottles scattered in the six-yard box. There is a "SPORF Reports" tag top left, word-by-word burned captions mid-frame ("threw a **long** object"), and a white sticker box: "Especially when your team is losing 👎".
- **Why this clip:** a crowd pelting a player is instantly readable spectacle. Ronaldo steps in, which adds a star.
- **Caption shape:** "Absolute scenes in Saudi as Edouard Mendy gets pelted with objects on the pitch. Disgraceful behaviour… Cristiano Ronaldo had to step in personally…" + credit.
- **Needs football knowledge?** No.
- **Steal this:** proof that FB reels are binary on big Pages too: one escape against a 4K floor on 1.2M followers. The escape is the zero-knowledge spectacle clip, never the promo.

### FBP-08 SPORTbible (14M) · Wed 24 Sep 21:31 · 3,996 reactions · **1,705 comments (4× the next best)** · 47 shares · 2×2 grid
- **Image:** four players mid free-kick strike: Beckham (United red), Messi (Miami pink), Ronaldo (Portugal red/green), Juninho (Lyon white). SPORTbible logo small in the centre. No text.
- **Why this image:** it shows the four options so the reader can answer at once.
- **Caption shape:** "One free-kick wins you £1million and only one man can take it... 🎯💰" A stakes question whose answer is a name.
- **Needs football knowledge?** Very little. Everyone knows at least two of those faces.
- **Steal this:** a 4-face grid + "only one can…" + stakes. It works for "which one would you trust with a penalty / with your wallet / with your lawyer". For us: 4 villains, "only one can go to prison".

### FBP-09 433 (7.2M) · Sun 28 Sep 00:41 · 98,896 reactions · **4,902 comments** · 479 shares · single illustration
- **Image:** ~20 stars (Yamal, Mbappé, Haaland, Kane, Bellingham, Dembélé, Raphinha…) crammed into a glass display cabinet, faces and palms pressed against the glass. A golden Ballon d'Or sits on a plinth in front. 433 logo top left.
- **Why this image:** a "who gets out of the box" composition. It sets up the vote without a single word.
- **Caption shape:** "🚨🏁 OFFICIAL: Voting for the Ballon d'Or is now closed. 🗳️🏆 WHO'S YOUR WINNER?❓👀"
- **Needs football knowledge?** Some, but naming a favourite is easy.
- **Steal this:** the biggest comment count of the study came from a one-name question asked on a calendar moment (voting closed, deadline day, final whistle).

### FBP-10 433 · Wed 24 Sep ~13:00 · reel 7 s · **434K views** · 12K reactions (433's reels: 243–726K)
- **Frame 1:** Anthony Gordon at an England presser (sponsor board behind), with a ginger mullet and a sheepish grin. A yellow caption box lower-middle: "GORDON: 'I WATCH ALL OF JUDE'S GAMES AND HOPE HE LOSES' 😂".
- **Why this clip:** a player saying the shithouse thing out loud about a teammate. The quote is the whole reel.
- **Caption shape:** "Anthony Gordon on a generational hatewatch 😂😭 🎥 BeanymanSports" (one line, emoji, credit).
- **Needs football knowledge?** No. Hate-watching your mate is universal.
- **Steal this:** a 7 s presser clip + one yellow quote box of the pettiest line. *Same template:* "Cristiano Ronaldo (born in 1985) CAN'T BELIEVE Renato Veiga is from 2003 😂🎞️" (9 s, **726K**, box: "2000 AND WHAT?!") and "CRISTIANO THE F1 DRIVER 🤣🛻" (12 s golf-buggy selfie clip, 468K).

### FBP-11 Sunday League Football (164K) · Mon 22 Sep 10:51 · reel 15 s · **659,673 views** (floor ~5K) · 5,070 reactions · 105 comments
- **Frame 1:** a Veo camera wide shot of a 3G pitch in a UK housing estate, a small figure lining up a free kick, and a white sticker box mid-frame: "Have another go son😳". Veo watermark bottom right.
- **Why this clip:** amateur failure filmed like a pro match. Our own FB-01 (78.6K, blokes colliding) is the same genre.
- **Caption shape:** "This is a lot harder to do than people realise 🤯👏 Send us your clips to get featured ✅ #sundayleague…" A mock-sympathetic line + a UGC ask.
- **Needs football knowledge?** Zero.
- **Steal this:** amateur-failure clips with a patronising 4-word sticker. Ask for clips in the caption and build a UGC pipeline. *Also here:* "IF YOU KNOW THIS PAIN, YOU KNOW! 😱⚽" (a bruised ankle on a bedsheet, **800 comments**) and "You're the Ref… Should this goal have been disallowed?" (209 comments on 49 reactions).

### FBP-12 Oh My Goal (21M) · Thu 25 Sep 21:13 · 7,581 reactions · 210 comments · 158 shares · 2-panel photo
- **Image:** two presser frames of Pep in front of the City sponsor wall, with yellow subtitles: "When City is accused of breaching Financial Fair Play, I ask the board" / "They explain it to me and I believe them, but I tell them: 'If you lie to me, I will leave and I will no longer be your friend'".
- **Why this image:** an old quote becomes a receipt the day the verdict lands. The subtitles make it read like a clip.
- **Caption shape:** "🔙 Pep Guardiola, back in 2020: '…if you lie to me, I will leave…' ❌ In May 2026, he announced his departure from City". Past quote → present fact, with the ❌ as the punchline.
- **Needs football knowledge?** Low. "He said he'd leave if they lied, and he left."
- **Steal this:** on villain day, dig up the villain's old promise and pair it with what happened next. Subtitled presser frames, 2 panels.

---

## WHAT WE'RE NOT DOING YET (concrete changes for our Page)

1. **We post almost no photo-memes to FB. Add 3–4 single-image posts a day** alongside the 1–2 reels. Use 4:5 (1080×1350), the joke in the image, and a caption of ≤10 words. The pure humour winners (Football Funnys, Football Planet) are 100% photos. Our reels already prove the escape can happen; photos build the daily floor.
   - Cheapest source: turn each IG carousel's best slide into a single FB image the same day.
   - This does NOT break the "zero duplicate slides" rule for IG, because it's a different platform.
2. **Full-time scoreline posts.** After every big upset, post "FULL TIME: X 3-0 Y" over the winner's nickname vessel doing something to the loser (FBP-03). That's one post per matchday at least. Our `hlcard.mjs` score card can be the fallback when no vessel fits.
3. **Fake official assets on villain day.** A fake sponsor/kit/crest whose brand name is the insult (FBP-02 Cheetos = cheaters, 720 shares; City crest with a sinking ship and "114", 204 shares), with a deadpan club-statement caption. Needs Alex's taste check, and it must be obviously a joke. AI generation is fine (rule 9).
4. **One comment-bait post a day,** a question answered with a name, shown as a 4-face grid:
   - "only one can…" (FBP-08)
   - "WHO'S YOUR…?" on a calendar moment (FBP-09)
   - "You're the ref"
   - "most overrated right now"

   Today we ask nothing, and comments feed FB distribution.
5. **Receipt images, not just maths cards.** An archival humiliation with a TV lower-third date (FBP-05 "Life before cheating…"), and an old quote vs what happened (FBP-12). This is our receipts lane in the format FB rewards. Post it within ~1 hour of the story (FBP-02 was 75 min).
6. **Rival-fan tweet exchanges on a proof photo** (FBP-01). A dark translucent card of 2 tweets over a stadium or player photo, captioned "That response 🤣". We already find these tweets for carousels, so we can post them singly on FB.
7. **Reels: keep them 7–21 s with ONE burned caption box** (yellow quote box or white sticker), a CAPS one-line caption + a 🎥 credit. Lean into zero-knowledge spectacle and amateur failure (FBP-07, FBP-11, our FB-01). Accept the binary and judge the batch, not each reel.
8. **Never go dark.** The dead Pages lost all reach despite 250–535K followers. Keep posting daily through international breaks and off days. On quiet days, run archive receipts and comment-bait.
9. **Test a UGC ask instead of "follow us".** No active Page asks for follows. Sunday League asks "Send us your clips to get featured ✅", which builds the clip supply we lack (we can't film). Put it on one reel caption a day for a week and count follows in Metricool before and after.

## GAPS
- **Frames/images not saved.** `save_to_disk` gave no file. Each entry is described instead, and `fbpages/` was not created. To add images, re-capture with a working saver.
- Photo posts have no public view counts, so photo rankings use reactions and shares, which isn't the same scale as reel views.
- Football Planet and Oh My Goal publish reels only on their Reels tab, so their feed "mix" understates reels. I corrected for this with the reel-tab counts above. The reel dates for Football Planet come from 3 sampled reels.
- Follows per post for other Pages are not visible. Rule 10 is inference plus our own Metricool data.
- Not studied: Football Post (180K, active today), The Anfield Beat, "Footy Frames" (a small Page that copied the Oscar 1-7 "one charge" joke two days after IG-01).
