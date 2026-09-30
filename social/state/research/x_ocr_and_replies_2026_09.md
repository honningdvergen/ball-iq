# X follow-up: maximising OCR, and whether assistant replies are safe (2026-09-24)

This follows `x_strategy_2026_09.md` and doesn't repeat it. Evidence labels are the same as before: **[primary]** means X's own page, post or code. **[2 src]** means two or more independent sources agree. **[1 src]** means only one source says it. **[inference]** is my reading of the evidence, not something a source states. Every number either has a source or is marked **[est]**.

---

## TL;DR

1. **The only reliable OCR rate will be our own.** X publishes no rate. Third-party guesses run from **$8–12 per 1M** verified impressions (GreyJournal) to **$200–1,200 per 1M** qualified impressions (OpenTweet's modelled scenarios). That is a 100× spread. Our first payout lands **09-25**. Read it in Creator Studio and work out our real $ per 1K qualified impressions. No football account has published an OCR payout; I found none.
2. **Three findings the first report missed, all [primary]:**
   - (a) Content "created or posted using **automated means**" is ineligible. That could include Postiz posts.
   - (b) X's Creator Monetization Standards list **strong language, meaning profanity and vulgar expressions**, as "restricted monetization".
   - (c) **Premium *Basic* viewers do count** as qualified impressions. Only the creator needs full Premium.
3. **Replies earn nothing from OCR.** Reply impressions are excluded from eligibility, and payouts count only Home Timeline impressions **[primary]**. Replies are a growth tool, not a money tool.
4. **Reply safety verdict:**
   - **AI-drafted, human-posted in the app: allowed.** Keep it conservative: 10–15 a day at first, rising to 20–30 over two weeks.
   - **Browser automation: a red line.** X's own rules name "scripting the X website" as grounds for permanent suspension. X's published anti-spam code has a reply-spam **hard-suspend** path that only fires when the replies come through X's own web or mobile clients, which is exactly where browser automation posts from.
   - **API / Postiz replies: blocked outright** since 2026-02-23 unless the author @mentioned or quoted us.

---

## Q1. Maximising Original Content Rewards

### What X actually says (help page archived 2026-09-16; terms effective 2026-08-07) [primary]

| Topic | Rule |
|---|---|
| Unit of pay | "Qualified impressions": unique impressions on the **Home Timeline** from **Premium Basic, Premium, Premium+ or Premium Business** users, with at least 50% of the post visible. Repeat views from the same account don't count again, and neither do paid, promoted, boosted or fraudulent views. |
| Formula | Not published. The terms say payment is "based on impressions from Premium users" and that X can change the calculation at any time. **No source says engagement, dwell, watch time, video, Articles or long posts pay more per impression** (TechCrunch 08-08 notes no format differentiation) **[2 src]**. |
| Original | Content "you have personally created – written, filmed, designed, or produced". Commentary counts: "Commentary is at the heart of X." |
| Not original | Copied content (including anything downloaded and re-uploaded); **minimally modified** content (a word or two changed, a filter, a speed change, "placing a text overlay"); **aggregated** content; cross-platform reposts by a non-author. |
| Ineligible posts | Posts that are copied or re-uploaded; inappropriate or sexually explicit; about monetisation coaching; **"created or posted using automated means"**; disinformation; carrying a **helpful Community Note**; or otherwise breaking the rules. |
| Staying in | Keep Premium. Don't use tools to inflate likes, follows or views. **Don't solicit engagement** ("repeatedly instructing users to… like, reply, bookmark, follow, or repost"). Breaking these can mean temporary or permanent removal. |
| Payout | Every 2 weeks, **$30 minimum**, Stripe outside the US. Earnings below $30 roll over. |
| Rejection | One appeal. After that you can reapply after **42 days** (Tech2Geek 09-23 agrees) **[2 src]**. |
| Strong language | The Creator Monetization Standards list **"Profanity, Vulgar expressions, Offensive remarks, Crude gestures"** and "overly suggestive" content under **Restricted Content**, which "may face restricted monetization". Gambling and betting content is **not eligible** at all. The page doesn't say how much is withheld. **[primary, 1 src]** |

**Enforcement history (from Nikita Bier's posts while he was head of product; he stepped down in Aug 2026 and is now an advisor [2 src: Wikipedia; Techweez 09-03]):**
- 2026-04-11: aggregators' payouts were cut to 60%, with another 20% cut the next cycle **[primary]**.
- 2026-07-16: soliciting engagement **3 or more times means removal plus referral for suspension**, and "Grok now catches all of these" **[primary + SMT 07-16]**. The upgraded duplicate model finds copies at 3× the old rate and **gives the monetised impressions to the original uploader, even if watermarks or intros were added**. It flagged 1.5M stolen posts in one cycle **[SMT 07-16, consistent with Bier]**.
- 2026-04-12: "People should make more talking videos like this on X" **[1 src: PiunikaWeb]**.

### Early payout reports
- **None found** for football or sports accounts. None of the searches turned up a creator publishing OCR $ against Premium impressions. The first general payout went out 2026-08-28, and ex-RevShare members get theirs on 09-25 **[primary: @XCreators 09-08]**.
- Premium's size: about 2M subscribers in early 2025 (Appfigures) **[1 src, stale]**. Nobody has published what share of any account's views come from Premium users. OpenTweet's calculator assumes 20% and says that's an assumption **[est]**.

### The 10 highest-leverage actions, ranked

| # | Action | Why / expected impact |
|---|---|---|
| 1 | **Read the 09-25 payout, then track $ per 1K qualified impressions every cycle.** While there, note our verified-follower count. | The only way to get a real number. Every other rate is a guess spanning 100×. Decide how much to invest in X *after* this. |
| 2 | **Post OCR-bearing originals natively from the X app, or from X's own web scheduler, not through Postiz.** | "Created or posted using automated means" makes a post ineligible **[primary]**. Whether a scheduler counts as automated isn't spelled out **[inference]**. Posting natively removes the doubt at almost no cost. At stake: the earnings on every Postiz-posted X post. |
| 3 | **100% own-made posts: our words, our graphics (maths cards, Guess the Player, quiz cards), our quote-post commentary.** No re-uploaded clips, no other people's memes with a caption laid over them, no screenshot carousels. | Excluded content earns **0**, and the duplicate model now hands those impressions to the original creator **[primary + SMT]**. |
| 4 | **Zero engagement solicitation.** Retire "No X fan will scroll without liking", gain trains, "follow everyone who likes". | 3 strikes means removal from the programme and referral for suspension **[primary: Bier 07-16 + help page]**. The downside is the whole programme, not one post. |
| 5 | **Keep monetisable posts free of explicit sexual wording and slurs.** Swearing for the joke is our register, but the pinned "loyal whores" post is the sort of thing the standards list. | "Strong language" and "overly suggestive" content "may face restricted monetization" **[primary, 1 src]**. The size of the effect is unknown. **Test it:** compare cycles with clean and crude pinned or top posts. |
| 6 | **Community-Note-proof every post.** Numbers go through the social-fact-checker. Parody must be absurd enough that nobody could take it as news. No fake quotes. | A post with a helpful Community Note is ineligible, and "misleading content" is excluded too **[primary + Tech2Geek]**. |
| 7 | **Put the effort into originals, not reply volume.** Replies bring followers, and originals are what pay. | Reply impressions don't count **[primary]**. Only Home Timeline impressions pay. |
| 8 | **Make posts that fill the screen: image or video plus one line. Avoid very long text walls.** | Pay needs "≥50% of the post visible". A post taller than a phone screen may rarely reach 50% visible **[inference, untested]**. There's no evidence Articles or long posts pay more per impression. |
| 9 | **Try Alex-voiced "talking" takes, 30–60 s to camera or with a voice-over, on big matchdays.** | Bier said talking videos reach "millions of impressions with basically no followers" **[1 src]**. X counts fully original video as the most clearly original format **[primary]**. |
| 10 | **Protect good standing.** No Boost (boosted views are excluded), no betting brands (not eligible), no follow or like tools. Check Subscriptions eligibility: 2,000 Premium followers plus 5M organic impressions in 3 months. | A monetisation pause blocks re-enrolment **[primary]**. The Subscriptions criteria are now confirmed on X's own page **[primary + Taisly = 2 src]**. |

**Not worth chasing:** the $1M Article prize (US creators only) **[1 src]**. The $1M livestream allocation was for a single cycle, announced 07-01 **[primary, stale]**. The claim that "video gets 1.3× and US audiences 3.5×" comes from a blog summary with no X source **[1 src, unverified — don't use]**.

---

## Q2. Is it safe for an assistant to post 20–30 replies a day under big accounts?

### Rules in force, September 2026

- **Automation rules** (help page, "Updated April 2026") **[primary]**:
  - "Don't… use non-API-based forms of automation, such as scripting the X website. The use of these techniques may result in the permanent suspension of your account."
  - Automated replies "to reach many users on an unsolicited basis" aren't allowed. Neither are replies "based on keyword searches alone".
  - **AI reply bots need "prior written and explicit approval from X."**
- **The API blocks unsolicited replies.** Since **2026-02-23**, programmatic replies via `POST /2/tweets` only work "if the original author @ mentions you or quotes your post". This covers the Free, Basic, Pro and Pay-Per-Use tiers **[primary: @XDevelopers 02-23 + PiunikaWeb 02-24]**. **Postiz can't reply under @brfootball at all.**
- **Authenticity / spam policy** **[primary]**: it bans "bulk, aggressive, high-volume unsolicited replies" and "replying with content that is irrelevant", and it names "downranking the post in replies" as an enforcement option.
- **AI replies:** Bier, 2026-07-24: "42,000 accounts automating replies using chatbots" were removed, because engaging "without a human in the loop runs counter to our mission" **[primary + StartupFortune 07-25]**. PiunikaWeb (05-28) says AI-assisted writing is fine and autonomous agents posing as humans are not **[2 src on the human-in-the-loop line]**.
- **Limits:** unverified accounts get 50 posts and 200 replies a day, split into half-hourly sub-limits. **No limit is published for verified accounts** **[primary: X limits page, archived 09-14]**.

### What X's published code does with replies (xai-org/x-algorithm, commit 2026-09-24) [primary]

- **LLM reply scoring above 250K followers.** Any reply where the post being replied to, or the thread's root post, belongs to an account with **more than 250K followers** is scored by a language model on a 0–3 scale (`grox/flows/reply_spam`). A score of 0 applies a `RiskyHighVizReply` safety label. The enforcement code handles a 7-day user-level `LowQualityReply` label too. @brfootball (7.78M) and every big club account fall in this lane. The scoring prompts are withheld "to reduce gameability".
- **A behavioural bot model (`bdsm`, policy dated 2026-08-14).** It reads each account's recent actions with "time-aware" embeddings built to catch **"burstiness, mechanical cadence"**. It has a **ReplySpamBot** head with the labels `REPLY_SPAM_NO_CONSUMPTION`, `REPLY_SPAM_BOT` and `CONVERSATION_SPAMMER`, and it flags `FOLLOW_THEN_REPLY` / `REPLY_THEN_FOLLOW` pipelines.
- **A reply-spam hard-suspend path.** It fires when the ReplySpamBot score clears a threshold **and ≥90% of the replies come from one *official* client (web, iPhone, Android, iPad)**. A code comment says legitimate API services "never pass this gate". Lower-scoring accounts get a captcha or liveness "bounce" instead. The thresholds are redacted.
- **Other reply signals:** a private reply **dislike** button went into testing in March 2026 **[2 src: SMT; PiunikaWeb 03-18]**. A mutuals boost in replies arrived 07-13, and it favours people the replier knows, not us **[primary]**. One report says Paul Graham had 34 of 59 replies hidden as probable spam, most of them LLM bots **[1 src: Techweez 09-03]**. Polished, AI-sounding text is exactly what gets filtered.
- **Collateral damage happens.** A buggy filter wrongly suspended accounts for about 12h in March, and 99% were reinstated **[2 src: PiunikaWeb 03-14; Roboin 04-05]**.

### The three modes, compared

| Mode | Allowed? | Risk | Verdict |
|---|---|---|---|
| **(a) Assistant drafts, Alex posts in the X app** | Yes. A human in the loop is the line X draws **[2 src]**. | Low if replies read naturally, spacing is human and Alex actually reads the post. The main risk is being ranked down or hidden, not suspension. | **Do this.** |
| **(b) Browser automation (Claude in Chrome or scripts clicking Reply on x.com)** | **No.** "Scripting the X website" means permanent suspension **[primary]**. OCR also bans "automated tools" and automated posting. | **Highest.** Replies come through the web client, which is the lane with the hard-suspend path. Automated cadence plus replies without reading look like `REPLY_SPAM_NO_CONSUMPTION` **[inference from code]**. | **Never.** |
| **(c) API / Postiz** | **Blocked** for unsolicited replies since 02-23. AI reply bots need written approval. | Requests are rejected. Getting round the block is itself a violation. | **Impossible, and not allowed.** |

### Conservative protocol for (a)

- **Volume:** 10–15 a day in weeks 1–2, then 20–30 a day **only if** spot checks show our replies aren't sitting under "Show probable spam". Check from a logged-out browser or a second account **[est: well below every published limit]**.
- **Spacing:** at most about 5 an hour, in 2–3 sessions a day around real moments. No bursts, and no fixed intervals.
- **Spread:** at most 2 replies per target account a day and 1 per thread. Rotate through about 10–15 targets.
- **Behaviour:** open the post, read it, and scroll a bit, both before and between replies. Never follow the account you've just replied to as part of the routine. Never use a second account in the same thread (the coordinated-spam classifier covers threads under accounts with 100K+ followers).
- **What a reply must look like:** a specific joke about *that* post, in our voice, written for football fans; lowercase and fragments are fine. Alex edits every draft. The assistant gives 2–3 options per target, and Alex rewrites or picks one.

**Red lines:**
- No links, no @mentions, no hashtags, no "follow us" or Ball IQ plugs in replies.
- No identical or templated text.
- No replies to tragedy or injury posts.
- No slurs.
- No "AI essay" tone: no em-dash-heavy polish, no "Great point!", no summaries.
- The assistant never touches the Reply button.

---

## Sources (all fetched 2026-09-24 unless noted)

**X primary**
- OCR help page (Wayback 2026-09-16): https://web.archive.org/web/20260916150107/https://help.x.com/en/using-x/original-content-rewards
- OCR Terms (effective 2026-08-07): https://legal.x.com/en/original-content-rewards-terms.html
- Creator Monetization Standards (Wayback 2026-08-24): https://web.archive.org/web/20260824022134/https://help.x.com/en/rules-and-policies/content-monetization-standards
- Automation rules, "Updated April 2026" (Wayback 2026-08-03): https://web.archive.org/web/20260803124103/https://help.x.com/en/rules-and-policies/x-automation
- Authenticity policy (Wayback 2026-09-16): https://web.archive.org/web/20260916105017/https://help.x.com/en/rules-and-policies/authenticity
- X limits (Wayback 2026-09-14): https://web.archive.org/web/20260914203700/https://help.x.com/en/rules-and-policies/x-limits
- @XCreators 2026-09-08: https://x.com/XCreators/status/2097371482804363669
- @XDevelopers 2026-02-23, API reply restriction: https://x.com/XDevelopers/status/2026084506822730185
- Nikita Bier posts:
  - 04-11: https://x.com/nikitabier/status/2043045929750794399
  - 07-16: https://x.com/nikitabier/status/2077774853650944028
  - 07-24: https://x.com/nikitabier/status/2080747924380856519
  - 07-25: https://x.com/nikitabier/status/2081111047340167485
  - 07-13 (mutuals): https://x.com/nikitabier/status/2076747704248758617
  - 03-18 (reply algorithm): https://x.com/nikitabier/status/2034293888350114233
  - 07-01 (livestream): https://x.com/nikitabier/status/2072434659024347440
- X algorithm code, commit 44d37eb (2026-09-24): https://github.com/xai-org/x-algorithm. Files:
  - `grox/flows/reply_spam/` (task_filter.py, task_write.py, constants.py)
  - `bdsm/README.md`
  - `bdsm/runtime/heads.py`
  - `bdsm/runtime/sink_policy.yaml`
  - `bdsm/runtime/score_results_sink_focal.py`
  - `abuse-enforcement-service/service-lib/src/service.rs`

**Secondary**
- TechCrunch 2026-08-08: https://techcrunch.com/2026/08/08/x-replaces-misaligned-revenue-sharing-program-with-original-content-rewards/
- TECHi 2026-08-09: https://www.techi.com/x-original-content-rewards-premium-impressions/
- Tech2Geek 2026-09-23: https://www.tech2geek.net/x-original-content-rewards-program-eligibility-payouts-and-rules/
- Social Media Today 2026-07-16: https://www.socialmediatoday.com/news/x-updates-its-engagement-bait-detection/825495/
- PiunikaWeb:
  - 2026-04-13 (talking videos): https://piunikaweb.com/2026/04/13/x-twitter-original-talking-videos-nikita-bier/
  - 2026-02-24 (API replies): https://piunikaweb.com/2026/02/24/x-api-blocks-automated-spam-replies/
  - 2026-05-28 (AI replies): https://piunikaweb.com/2026/05/28/x-suspend-accounts-ai-replies/
  - 2026-03-14 (ban wave): https://piunikaweb.com/2026/03/14/x-users-report-wave-of-bans-for-inauthentic-behaviors/
  - 2026-03-18 (dislike): https://piunikaweb.com/2026/03/18/x-rolling-out-dislike-button-for-replies/
- StartupFortune 2026-07-25: https://startupfortune.com/x-removes-42000-ai-reply-bot-accounts-and-the-warning-to-growth-marketers-is-impossible-to-ignore/
- Techweez 2026-09-03: https://techweez.com/2026/09/03/x-ai-generated-bot-replies/
- Roboin 2026-04-05: https://roboin.io/article/en/2026/04/05/mass-account-suspensions-on-x-in-april-2026-timeline-and-root-causes-explained/
- Social Media Today (reply downvotes, Mar 2026): https://www.socialmediatoday.com/news/x-formerly-twitter-adds-comment-downvotes-train-algorithm-tanking/815272/
- Nikita Bier, Wikipedia (role change Aug 2026): https://en.wikipedia.org/wiki/Nikita_Bier

**Rate estimates [est]**
- OpenTweet calculator (updated 2026-08-31): https://opentweet.io/tools/x-earnings-calculator
- GreyJournal 2026-07-09: https://greyjournal.net/hustle/how-much-does-x-pay-creators-2026/
- Appfigures via Social Samosa: https://www.socialsamosa.com/news-2/x-premium-sees-growth-subscriber-numbers-8599505
