# Tool stack review: Google's "essential viral tools" list vs Shithousery HQ (2026-09-28)

What I checked: each item against the vendor's own page or GitHub (WebSearch + WebFetch), the MCP registry (`search_mcp_registry`), the official plugin marketplace (`~/.claude/plugins/marketplaces/claude-plugins-official`, 311 plugins), `claude mcp list`, and our own code (`social/gate.mjs`, `review.mjs`, `matchwatch.mjs`, `breaking.mjs`, `.claude/agents/banger-critic.md`). This was read-only: nothing was installed, connected or bought.

**Headline:** the list is roughly 70% real and 30% wrong. Two names are wrong ("Blotado" is **Blotato**, "Dscript" is **Descript**). One item has no real product behind it ("Ecosystem Skills Pack"). Most of the real tools duplicate things we already run (Postiz, Metricool, vidIQ, ESPN, Exa, HyperFrames). The biggest gains are three small things we build ourselves, not new subscriptions.

Fit scores run from 1 (useless for us) to 5 (fills a real gap). The **Account / login risk** column asks whether the tool touches our own logged-in accounts.

| # | Item | Real? | What it actually is | Cost | Account / login risk | Fit | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Sandcastles.ai `/analyze` | **Yes.** It is an MCP connector (`https://mcp.sandcastles.ai/`), installed as a Claude **desktop** plugin from Sandcastles settings. Commands: `/analyze`, `/hooks-watchlist`, `/formats-watchlist`, `/topic`, `/video-suggest`, `/channels-*`. | Short-form research on IG, TikTok and YT Shorts: transcript plus hook/structure breakdown of any video, outliers per niche. Does **not** cover X, Threads or Bluesky. | MCP only on Pro **$39/mo** (500 credits), Visionary $79, Titan $399. 7-day free trial, no card. | Reads public data. Needs a Sandcastles login. | 2 | **SKIP.** vidIQ, which we already have, does the same job: `vidiq_instagram_tiktok_outlier_search`, `vidiq_ig_profile_reels`, `vidiq_video_transcript`, `vidiq_watch_shortform_content`. Our lane is X/Threads text plus meme vessels, where Sandcastles has no data. Only revisit if vidIQ's IG/TikTok coverage proves thin. |
| 2 | "Viral Hook Creator" skill | **Yes.** `ognjengt/founder-skills`, `skills/viral-hook-creator` (258★, last updated May 2026, about 4K tokens). | 18 hook patterns (Authority, Contrarian, Data-Driven …) plus trigger-word lists. Built for **founder/B2B** posts on X, LinkedIn, IG and TikTok. | Free. | None. | 1 | **SKIP.** Its patterns are LinkedIn-style ("Here's what nobody tells you…"). That breaks our X voice rule (2–8 words, never explain) and the critic's "explaining the joke = 2". Our banger library is a better, football-specific version of the same idea. |
| 3 | Composio MCP gateway | **Gateway: yes.** One MCP server with meta-tools over 1,500+ apps. **Bluesky/Threads toolkits: not verified** (`composio.dev/toolkits/bluesky` returns 404, and no Threads toolkit was found). | Hosted OAuth plus tool router. | Free tier: 100K tool calls/mo (per their pricing page). | Would hold OAuth tokens for our accounts, i.e. a third place with posting rights. | 1 | **SKIP.** Postiz already posts to all 7 platforms including Threads and Bluesky. We also have `social/bsky.mjs` and our own Meta Threads token in Keychain. A gateway would only add a second set of stored posting rights. |
| 4 | "Blotado" → **Blotato** | **Yes, under the name Blotato.** MCP at `https://mcp.blotato.com/mcp`. Not in the Claude registry. | Scheduler/publisher for 9 networks, plus AI video, images, voice and "viral templates". | Starter $29/mo, Creator $97, Agency $499. 7-day trial (no API on the trial). | Would hold posting rights to all our accounts. | 1 | **SKIP.** Duplicates Postiz and Metricool. Its AI video/templates are the generic look the critic fails. $29/mo works against the money goal. |
| 5 | Zapier MCP | **Yes.** In the official plugin marketplace (`zapier`) and the MCP registry (`https://mcp.zapier.com/api/v1/connect`). Not connected. | Runs actions in 8,000+ apps. | **2 tasks per successful call.** Free plan is 100 tasks/mo (about 50 calls). Pro is $19.99/mo for 750 tasks. | Would hold account tokens. | 1 | **SKIP.** We have no gap it fills: posting is Postiz/Metricool, triggers are our own `.mjs` watchers, analytics is `insights.mjs`. 50 calls/mo would not last one matchday. |
| 6a | Hyperframes | **Yes, already installed** (HeyGen, Apache-2.0, plugin v0.8.61; trialled 09-24, see `reference_tooling_catalogue_review_2026_09_24`). | HTML → deterministic MP4 with captions and voiceover. | Free. | None. | 3 | **KEEP AS IS.** The trial verdict stands: not for the single-question Shorts (slower, larger files, −24 LUFS vs our −17), but it is the tool for long-form YT quizzes and captioned formats. Nothing new to adopt. |
| 6b | "Dscript" → **Descript** | **Yes, under the name Descript.** It is an official directory connector plus a hosted MCP (`api.descript.com/v2/mcp`, OAuth), not a "skill". | Import media, "Underlord" AI edits, compositions, exports. | **Early access, paid plans only.** Uses Descript AI credits. | Needs a Descript login. | 1 | **SKIP.** Descript's strength is talking-head and podcast editing. We don't film anyone. Our reels come from ffmpeg (`recaption.mjs`, `build-reel.mjs`, `carouselreel.mjs`) with originality edits already built in. |
| 7 | "Ecosystem Skills Pack" | **Could not verify; probably doesn't exist.** No product by this name. Search only turns up generic "Claude skills ecosystem" articles and an unrelated academic-paper bundle. | The closest real things are `socai-io/skills` (106 generic social skills) and `sergebulaev/x-skills` (9 X skills: tweets in your voice, extracting hooks from viral tweets). | Free (MIT). | None. | 1 | **SKIP.** Most likely a made-up label. The real neighbours are generic marketing voice. One idea worth taking is x-skills' "extract hooks from viral tweets", and our banger library already does that by hand, with the pictures. |
| 8 | SportScore MCP (`sportscore-mcp`) | **Yes.** `Backspace-me/sportscore-mcp`, MIT, only **12★**, `npx -y sportscore-mcp`. Not in the registry. | 8 tools: `get_matches`, `get_match_detail` (timeline with goals, cards, VAR, subs; lineups), `get_standings`, `get_top_scorers`, `get_player`, `get_tracker` … | Free, no key. About 1,000 requests per 24h per IP, 60 s edge cache. **Free-tier terms require visible SportScore attribution in outputs.** | None. | 2 | **SKIP.** `social/matchwatch.mjs` already reads ESPN's `keyEvents` (goals, reds, pens, VAR, disallowed) every 20 s for free, without attribution. The 60 s cache is slower than our poll. A 12★ repo is also a reliability risk on matchday. Keep it in mind only as a fallback if ESPN ever blocks us. |
| 9 | API-Football / API-Sports MCP | **API: yes. MCPs: third-party only** (Pipeworx, AnythingMCP, `obinopaul/soccer-mcp-server`, `MarvDann/api-football-mcp`, PL only). None of them is from api-sports itself. | Fixtures, H2H, standings, player stats, injuries, odds. | **Free: 100 requests/day, 10/min, all endpoints**, but "limits historical seasons". **Exact season window NOT verified** (api-football.com returned 403). Pro $19/mo gives 7,500/day. | None (API key). | 2 | **TRIAL LATER, and only if needed.** Our absurd-maths cards ("114 charges × 6 pts = 684") come from news facts and Wikipedia/Transfermarkt-type records, not match APIs. ESPN plus Exa plus the `social-fact-checker` agent already cover them. Get a free key (no MCP; call the REST API from a script) the first time a maths idea dies for lack of H2H or season data. Every number still goes through the fact-checker. |
| 10 | Apify MCP (`mcp.apify.com`) | **Yes.** Official server `apify/apify-mcp-server`, OAuth, `apify mcp install claude-code`. Not in the Claude registry. | Runs any Apify Store actor, including X/Twitter scrapers (search, profiles, replies). | Connecting is free. **Free plan gives $5 of usage per month.** X scrapers cost **$0.15–0.40 per 1,000 tweets** by actor, so $5 buys roughly 12K–30K tweets a month. | **Never touches our X account**: the actors log in with their own sessions or proxies. | 3 | **TRIAL (free credit only).** It is the one legal-grey item. X's ToS bans scraping "in any form, for any purpose" without consent. The new terms from **9 Oct 2026** add liquidated damages of **€15,000 per 1M posts** above 1M posts/24h. We'd use about 1–2K/day, far below that threshold, but it is still a ToS breach, carried by Apify and whoever runs it. Why it still beats the alternative: our current method (`min_faves:` searches in the **logged-in** Chrome tab) automates **@ShithouseryHQ itself**, which puts the 45K account at risk. Apify keeps the brand account out of it. Use it only for the "already-out check" in BUILD #1. Never scrape replies or private people, and never republish scraped posts. |
| 11 | Firecrawl + Exa as "pre-gen trend scraper" | **Both real, both already here.** Exa MCP is connected. Firecrawl is in `claude mcp list` as ✓ Connected, but this session reported it as "needs auth", so re-check in `/mcp`. | Exa does semantic web/news search. Firecrawl scrapes pages to markdown. | Exa: $7 per 1K searches (10 results each; more results cost extra). Firecrawl: 1,000 free credits/mo, Hobby $19. | None. | 3 (Exa) / 2 (Firecrawl) | **USE WHAT WE HAVE; don't buy more.** Neither can read X: X blocks crawlers, and `breaking.mjs` already notes that syndication returns 429s. Exa is good for "has this angle already been written up by Planet Football, SPORTbible or Reddit" and for receipts for maths cards. Firecrawl is only needed for pages Exa can't fetch (Transfermarkt tables). The trend signal itself already comes from `breaking.mjs` (Google News, Romano/Ornstein, BBC/Sky/Guardian/ESPN). |
| 12 | HOOK ideas (pre-gen "already out?" check, post-gen "platform mutator", pre-publish "banter/compliance filter") | These are ideas, not products. | See BUILD OURSELVES below. | £0 | n/a | 4 | **BUILD two of the three.** The platform mutator is not worth building. |
| 13 | SKILL ideas (football-satire-generator, ragebait-optimizer, match-day-live-commentator) | These are ideas, not products. | See BUILD OURSELVES below. | £0 | n/a | 4 | **BUILD one skill (`shq-draft`) with three modes**, not three skills. |

---

## TOP 3 TO ADOPT

All three are small builds on tools we already have. None needs a new subscription.

### 1. `shq-draft` skill: put the library in front of the writer, not only after it (BUILD #3)
The critic already reads `LIBRARY_x_threads.md` and `LIBRARY_video.md`, but only **after** a draft exists, so most drafts FAIL and get rewritten. A drafting skill that loads the same craft rules first should cut that loop.
**Next steps:**
1. Create `.claude/skills/shq-draft/SKILL.md` from the outline below. Keep it about 150 lines and **link** to the library files rather than copying them, so the critic and the drafter always read the same source.
2. In `.claude/agents/banger-critic.md`, add one line: "If the draft didn't come through shq-draft mode X, check it against that mode's checklist first."
3. Measure it: compare the PASS rate in `social/state/review/verdicts.jsonl` for the 3 days before and after. Keep the skill only if first-attempt PASSes go up.

### 2. `social/alreadyout.mjs`: the "is this joke already out?" check (BUILD #1)
Criterion 6 (Originality) is currently the critic's gut call.
**Next steps:**
1. Script input: `--story "Carrick sacked" --angle "keywords of our joke" [--since 3h]`.
2. Sources, in this order:
   - (a) Exa search over the last few hours on SPORTbible, Planet Football, GiveMeSport, Reddit r/soccer and r/PremierLeague, using the tool we already have;
   - (b) optionally an Apify X-search actor: 50 top tweets for `"<story>" min_faves:500 -filter:replies`, about $0.02 per run;
   - (c) our own `USED_SLIDES.md`, `replies.md` and `verdicts.jsonl`.
3. Output: the top 5 near-matches with like counts, plus a verdict line `FRESH` / `DONE-BY-OTHERS (N× ≥10K likes)` / `WE-DID-IT`. Write it into the draft JSON as `alreadyOut`.
4. `review.mjs draft` calls it automatically when `--story` is given. The critic reads `alreadyOut` when scoring Originality, and a `DONE-BY-OTHERS` result caps Originality at 5 unless our angle is clearly different.
5. **Before step 2(b), Alex decides on Apify** (a free account uses no card; it is his signup, not mine). Until then, run (a) and (c) only.

### 3. Deterministic "banter filter" lexicon in `social/gate.mjs` (BUILD #2)
The critic's hard fails (tragedy, serious injury, children, private people, betting brands, sanctions stated as fact) are judgment calls today. Only Kalshi/Stake/Polymarket is enforced in code. A regex layer catches the obvious cases on the path to posting, even when the critic has a bad day.
**Next steps:**
1. Add `HARD` and `SOFT` lists next to `BANNED` in `gate.mjs`.
   - **HARD BLOCK:** a caption-text list of slurs and protected-class insults, plus `died|death|funeral|cancer|tragedy|disaster|stadium crush|minute'?s silence|suicide|overdose`.
   - **SOFT (needs `--ack "<reason>"`):**
     - Injury: `ACL|broken leg|stretchered|hospital|seriously injured|career-ending`.
     - Minors: `\b1[0-7]-year-old\b|academy|u1[0-8]`.
     - Legal: `rape|assault|court|charged with|arrested|police`. These are real legal cases, not football "charges".
     - Sanctions stated as fact: `guilty|found guilty|stripped` without a PASS from `social-fact-checker`.
2. Run the same lexicon over any whisper transcript of the clip audio. There is no OCR on this Mac (no tesseract), so text inside images stays the critic's job: it reads the rendered mock-up. `gate.mjs` already notes this limit for betting logos.
3. Add a test in `.claude/hooks/hooks.test.mjs` (a probe must fail first, per `feedback_eslint_flat_config_hole_reports_zero`).

**External tool that makes the cut:** Apify, and only as the optional source 2(b) in #2, on the free $5/mo credit.

---

## SKIP (and why)

- **Sandcastles:** duplicates vidIQ for IG/TikTok/YT research. No X/Threads coverage, where our bangers live. $39/mo minimum.
- **Viral Hook Creator:** a founder/LinkedIn hook voice that contradicts our "2–8 words, never explain" rule.
- **Composio:** Postiz already posts everywhere, and its Bluesky/Threads toolkits could not be verified. It would add another holder of our posting rights.
- **Blotato:** a Postiz/Metricool duplicate at $29–97/mo, with generic AI-video templates.
- **Zapier MCP:** no gap to fill. The free tier is about 50 calls a month.
- **Descript:** built for talking-head editing. Paid, early-access MCP. Our ffmpeg pipeline already handles originality edits.
- **"Ecosystem Skills Pack":** no such product found. Treat it as invented.
- **SportScore MCP:** ESPN `keyEvents` already gives us VAR, cards and pens, faster (20 s poll vs 60 s cache) and without attribution terms. 12★ repo.
- **API-Football MCP:** there's no official MCP, and the data isn't where our maths jokes come from. Get a free REST key later if a specific card needs H2H or season data (season window unverified).
- **Buying Firecrawl/Exa tiers:** the free and already-connected tiers are enough, and neither can read X.
- **Post-gen "platform mutator":** skip it as a separate tool. Platform rewrites are the drafter's job (shq-draft covers the formats per platform). A mechanical rewrite is exactly what fails the critic ("same caption pasted to 7 platforms"). Per-platform constraints (IG ≤10 slides, no FB via Postiz, audio present) are already enforced in `gate.mjs`.

---

## BUILD OURSELVES

### Hooks

| Idea from the list | What our gate already does | What's missing | Build |
|---|---|---|---|
| Pre-gen fan-sentiment / "already out" check | The critic scores Originality against our own `USED_SLIDES.md`, `replies.md` and verdicts, plus its own judgment. `breaking.mjs` finds the story, but not who has already joked about it. | Any look at **other people's** jokes on the same story in the last few hours. | `social/alreadyout.mjs` (TOP 3 #2), called from `review.mjs draft --story`. |
| Pre-publish banter/compliance filter | `gate.mjs` blocks betting brands, repeats (dHash), double audio, silent video, empty captions, FB via Postiz, IG >10 slides. `review-guard.mjs` blocks Metricool posts without a PASS. The critic hard-fails tragedy, injury, minors, private people and unverified sanctions **by judgment**. | Deterministic enforcement of the hard fails, and a check that a legal case isn't being joked about as a football "charge". | Lexicon layer in `gate.mjs` (TOP 3 #3), with an `--ack` override for soft hits so a joke about a hamstring doesn't get blocked forever. |
| Post-gen platform mutator | `gate.mjs` enforces platform limits. Captions are written per platform. | Nothing that needs a tool. | **Don't build.** |
| (extra) Live-match pre-kit | `matchwatch.mjs` exits on goal/red/pen/HT/FT. `matchkit_*.md` files are written by hand. | Nothing, beyond pairing each event with pre-written joke slots (see the skill's live mode). | Handled inside `shq-draft` live mode. |

### Skills: one `shq-draft` skill with three modes (outline only)

Why one skill and not three: the three ideas share 80% of their rules (voice, instant fails, library, gate). Three separate skills would drift apart the way `ball-iq-social` (funnel) and the library already have.

```
.claude/skills/shq-draft/SKILL.md
---
name: shq-draft
description: Draft Shithousery HQ posts (X, Threads, Bluesky, IG, TikTok, YT Shorts, FB). Use BEFORE writing any
  caption, carousel line, reel plate, maths card or live reaction, so the draft is built to the banger
  library, not checked against it afterwards. Modes: satire (default), ragebait, live.
---
0. Pre-flight (every mode, about 2 min)
   - Check the football calendar: the premise has a date (feedback_check_the_football_calendar).
   - Run node social/alreadyout.mjs --story "…" and drop the idea if it's DONE-BY-OTHERS with nothing new.
   - Read the 5 library entries closest to the platform and format (LIBRARY_x_threads.md / LIBRARY_video.md)
     by looking at their images, not just their stats.
1. Voice rules (a link to the X voice memory, plus the 6 lines that matter)
   - X: 2–8 words + the clip/image. Never explain. Football-X shorthand.
   - Threads: needs a TAKE, never restates a result. Captions accuse, they don't describe.
   - Reels: the absurd register; the plate line must work as standalone text.
2. FORMAT PORTFOLIO: a pointer to the library section, plus a one-line "when to use" for each format
   (receipt list, fake-official, maths card, "[Fanbase] fans will…", quote-post dunk, meme vessel …)
3. Mode: satire (default)
   - Formula slots: TARGET (fanbase or club behaviour) × VEHICLE (today's story) × DEVICE (maths / fake-official / receipt).
   - Write 5 variants and keep 2. Each must pass the "tag a mate" test.
4. Mode: ragebait (guardrails are non-negotiable)
   - Allowed: club, fanbase and pundit behaviour; transfer fees; trophy counts; "bottle" narratives; rival comparisons.
   - Never: tragedy or death, serious injury, race/religion/sexuality/nationality as the joke, children or academy
     players, private individuals (never screenshot a random fan's post with the handle visible), legal cases
     (assault/court), betting brands.
   - Aim: the argument is about FOOTBALL. A reply fight about the joke's target, not about us.
   - A ragebait draft must state its "rage axis" in one line (e.g. "Arsenal fans vs the 2004 unbeaten
     comparison"). If that axis touches the Never list, drop the draft.
5. Mode: live (matchday)
   - Before kick-off: write a matchkit file of 3 pre-written slots per team (goal, red, pen, VAR, collapse)
     tied to each fanbase's running joke.
   - When matchwatch.mjs fires: pick a slot, attach the moment (a screenshot or clip within ≤15 min on X),
     draft, send to review.mjs, and get the critic's verdict. Speed target: event → queued in ≤10 min.
   - No scores or facts from memory: take them from the matchwatch output only.
6. Hand-off: always node social/review.mjs draft …, then the banger-critic, then social/pz (gate).
   Maths cards and factual lines also go through social-fact-checker.
7. Instant fails: link to the library's INSTANT FAILS section. Do not copy it.
```

---

## Couldn't verify (treat as possibly wrong)
- **"Ecosystem Skills Pack":** no product found under that name.
- **Composio Bluesky/Threads toolkits:** toolkit page returns 404; nothing found for Threads.
- **API-Football free-plan season window:** api-football.com returned 403. Third-party pages say only "recent seasons".
- **Sandcastles platform list:** the MCP page doesn't name the platforms. Reviews say IG, TikTok and YouTube.
- **Firecrawl auth state:** the CLI says Connected, but this session said it needs auth. Check in `/mcp`.

## Sources
- Sandcastles MCP: https://sandcastles.ai/mcp · pricing via https://coldiq.com/tools/sandcastles
- Viral Hook Creator: https://github.com/ognjengt/founder-skills/tree/main/skills/viral-hook-creator · https://atskills.one/ognjengt/viral-hook-creator
- Composio pricing: https://composio.dev/pricing
- Blotato: https://www.blotato.com/mcp · https://www.blotato.com/pricing
- Zapier MCP billing: https://docs.zapier.com/mcp/overview/usage
- Descript MCP: https://help.descript.com/hc/en-us/articles/46056322186509-Descript-MCP-overview
- SportScore MCP: https://github.com/Backspace-me/sportscore-mcp
- API-Football: https://www.api-football.com/news/post/how-to-get-started-with-api-football-the-complete-beginners-guide · https://www.pulsemcp.com/servers/pipeworx-api-football
- Apify MCP: https://github.com/apify/apify-mcp-server · X actor prices e.g. https://use-apify.com/docs/best-apify-actors/best-twitter-scrapers
- X ToS (scraping ban, liquidated damages): https://x.com/en/tos
- Firecrawl / Exa pricing: https://use-apify.com/blog/firecrawl-review-2026 · https://exa.ai/pricing
- Skill bundles (the closest real "packs"): https://github.com/socai-io/skills · https://github.com/sergebulaev/x-skills
