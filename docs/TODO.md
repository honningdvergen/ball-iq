# Ball IQ — the list

**Last updated: 2026-08-06.** Single source of truth for what's in flight.
`[ ]` = open · **ALEX** = needs you · **CLAUDE** = I do it.

Claude: update this file whenever something lands, and re-read it when asked
"what's left". It exists because a chat scrollback is not a plan. Completed
items are deleted, not archived — git history is the archive.

---

## ⚡ THE BOARD — rebuilt 2026-08-09, after the 7-day GSC read

Ranked against the **measured** bottleneck. Two things are now measured rather
than assumed:

1. **Distribution is the constraint**, not activation (82%) or retention (72%
   return). 74% of signups happen inside the native app.
2. **Authority is the ceiling on every SEO page we own.** 7-day GSC: club pages
   sit at position 8.6, the 49 lists at 27.5. Lists that DO reach page one beat
   their position benchmark by 2.2x — the format works, the ranking does not.
   More pages do not fix this. See [[project_gsc_7day_2026_08_09]].

| # | Task | Owner | Why it ranks here |
|---|---|---|---|
| 1 | **Partnership outreach** | ALEX | Distribution is the measured bottleneck and nothing I ship moves it. Pitch material is built. |
| 2 | **Authority building** — directories, Discord, backlinks | ALEX | The single ceiling on ALL 284 pages. Club pages p8.6, lists p27.5. Raising authority lifts every page at once; another page lifts none. |
| 3 | **`/mystery-player/` sells a mode the app hides** | claude | ⚠️ LIVE DEFECT. Page is HTTP 200 with a full pitch while `MYSTERY_ENABLED=false`. Someone searches, installs, mode is absent. Cheap: de-index or de-link until the pool is rebuilt. |
| 4 | **Italian localisation on Serie A clubs** | claude | The ONLY lever measured to convert: localised pages 8.06% CTR vs 3.05% English, same position. ⚠️ Per-market — Turkish INVERTS it, so treat as a test. |
| 5 | **Re-read GSC ~30 Aug to judge the title test** | claude | 76 titles moved from "Trivia" to "Quiz with Answers" on measured CTR (1.4% vs 9.3%). It is a HYPOTHESIS until re-measured. Cheap, and it decides whether to repeat the pattern on player/league pages. |
| 6 | **Distractor sweep — the club-qualifier class** | claude | Alex found a "hard" question where no distractor had played for the club named in the stem. The plausibility gate checks name-twins and eras, NOT club membership. The moat is the bank. |
| 7 | **Top up 3 sub-floor packs** | claude | Hajduk 15, RB Leipzig 20, Bournemouth 24 — all under the 25 floor agreed 2026-08-09. 10-Q sessions on a 15-Q pack repeat almost immediately. |
| 8 | **Mystery Player pool rebuild, then flip the flag** | claude | A finished mode is dark. Needs a CURATED cross-era pool, not more squad fillers. Also the honest fix for #3. |
| 9 | **MP: verify "up to 8" + stats saving** | ALEX+claude | Home advertises "up to 8 players"; that has never been proven past the RPC layer. Needs a 2nd device. Marketing a number we cannot demonstrate. |
| 10 | **AdSense: switch on ad units when approved** | ALEX | `AD_CLIENT=''` and all four slots commented, so approval alone earns nothing. ads.txt is correct; the console is just queueing. |

**Deliberately NOT on the list:** more `/lists` (49 already compete for the same
authority), more English club pages (the tail converts at ~1-5 impressions a
quarter), and a broad bug sweep (playtesters ~100% precision vs 3-6% for
sweeping audits).

**Parked but real:** Capacitor 8 merge (branch `upgrade/capacitor-8`), homepage
v5 rebuild, club-page competitive rebuild, TikTok, Reddit karma drip.

⚠️ **Prod status is never knowable from this repo** — Android and iOS release
state must be read from the consoles, not inferred here.

## 🎨 APP ICON — flagged by Alex's friend as "AI sloppy", 2026-08-10. He is right.

Current `assets/icon.png` (1024²): a flaming football with a question mark cut
into it, orange fire and sparks on navy. Judged at 60/120/180px, not as a poster.

**Why it reads as generated art:**
1. **Three ideas in one square** — ball + fire + question mark. An icon carries one.
2. **Fire, embers and soft 3D shading are the tell**, and they are the first
   things to turn to mush at 60px.
3. **A "?" on a football is the most predictable trivia mark there is.** Nothing
   about it is ours.
4. **⚠️ The palette does not match the product.** Orange/navy, when the app and
   all 191 generated pages are `#58CC02` green on `#0A0A0A`. The icon does not
   belong to the app it opens.

**Three directions to draw, all legible at 20px:**
- **Monogram** — "IQ" in the app's weight, green on near-black, a ball-panel
  hexagon forming the counter of the Q. Ties the icon to the name.
- **One panel** — a single ball pentagon as a bold flat shape, cropped hard.
  Unmistakably football, no effects, scales to nothing.
- **Scout's mark** — only if the Scouting Report world wins the homepage; the
  icon should then come from that world.

Produce as real renders at 1024/180/60 and judge at size. Do not ship a concept
that was only ever seen large.

### 🌍 LEAGUE COVERAGE LADDER — Alex, 2026-08-10: "prioritise by biggest fanbases"

**Builder coverage ≠ quiz packs.** A builder club needs only a Wikipedia
article + the squad parser; no questions, no editorial. So league waves are
cheap and mechanical.

Measured gap (containment-match ESTIMATE — Man City/PSG/Lyon/Athletic are
false negatives, true tier-1 gap ≈ 45-50 clubs):

| Tier | Leagues | Have/Total |
|---|---|---|
| 1 — FULL coverage first | PL ✅20/20 · Bundesliga ~5/18 · La Liga ~7/20 · Serie A ~10/20 · Ligue 1 ~5/18 | ~47/96 |
| 2 | Eredivisie, Championship, Belgian Pro League, Süper Lig, Brasileirão, Argentine Primera, MLS (+Liga MX, not in leagues.mjs) | ~17/158 |
| 3 — due course | Primeira Liga, Scottish Prem, Eliteserien, Allsvenskan, Danish Superliga, HNL, Saudi | ~7/102 |

**Method per wave:** resolve the league's clubs from its Wikipedia SEASON
article (2026–27 …) — never by name search (trap fired 6×) — extend the club→
article map, run fetch-squads-wiki, fetch photos --core for new ids, faces,
rebuild. ⚠️ Atalanta + RB Leipzig have quiz PACKS but were never added to the
squad map — include in wave 1. Tier-1 wave slots after the builder is LIVE;
it widens a shipped product rather than delaying it.

### 📋 WEEK PLAN additions + builder-pool decision (Alex, 2026-08-10)

- **#16 STORE PAGE BEFORE THE SOCIAL PUSH** — Alex has social plans timed to
  the PL start (<2 weeks). The listing must convert FIRST: new screenshots
  (incl. lineup builder), trivia→quiz rename done, description current.
  Possibly the most time-critical item of the week.
- **#17 /get smart link + UTM per-post attribution** — measure which posts
  drive installs; the redirect already exists.
- **Norwegian listing?** — depends on the language of Alex's social audience;
  ask when his plans firm up.
- **BUILDER POOL DECIDED:** default = current squads + academy prospects with
  first-team squad numbers (exactly what the Wikipedia templates encode).
  **LEGENDS TOGGLE approved by Alex** ("toggle on and we include all the
  inactive retired players like Zidane and Beckham") — retired players leave
  the default pool and return via the toggle, replacing the born<1980 hard cut
  at integration time.

### 🅿️ PARKED — app icon (Alex, 2026-08-10: "park it for now")

Three in-house fire attempts all failed (petals / teardrop / drips) and the
traced-flame composite read WORSE than the current icon. Current icon stays.
What survives: the vector ball+? foundation and the flame tracer are committed
(`assets/icon-work/`, `scripts/flametrace/`), and
`assets/icon-work/GENERATION-BRIEF.md` is a paste-ready prompt with acceptance
tests (judge at 64px!) for whenever Alex runs an external image tool. The
in-session generation service is dead: 0.2 credits, 2/image, no trial.

### ALEX-OWNED — I cannot move these

| Task | Blocked on |
|---|---|
| **Authority push** — directories + backlink outreach | You. Kit is written (#51). This is THE lever on "football quiz" p41, which you called life-changing. Content volume is NOT the constraint; authority is (#51 vs #8). |
| **Partnership outreach** | You, deliberately holding. |
| **TikTok channel** | You. Biggest reach platform we are absent from. Promote it the moment 1–3 land. |
| **Reddit karma drip** | You. Link posts are spam-filtered at 14 link karma; genuine comments first. |
| **AdSense** | Google. Stuck in "Klargjøres" since 5 July. Nothing to do but wait. |
| **VAPID secrets** (Footle web push) | You. The native half shipped; the web half is inert without them. |
| **Clarity connector token** | You. |
| **Three editorial rulings** | `/study/` question-count exemption · emoji vs line icons on the Journey ladder (I say KEEP the emoji) · whether the League picker keeps its counts like the club picker lost its. |
| **Store name: "trivia" → "quiz"** — DECIDED yes by Alex 2026-08-10 ("quiz ranks higher on web, let us not overcomplicate") | Next store-console session: read live name/subtitle/keywords in BOTH consoles, propose exact swap. ⚠️ Never repeat a word across name+subtitle+keywords — a repeat wastes an indexed slot. Norwegian Play listing needs the same pass. Original caveat (App Store search ≠ Google) noted and accepted. WEB evidence is strong — "with answers" beat "trivia" 6.6× in GSC and we rewrote all 76 club titles off "trivia" as our worst-converting intent. But App Store search ≠ Google and I have NO store search-volume data, so the web finding is suggestive, not proof. ⚠️ Regardless of the rename: only name+subtitle+keywords are indexed, and a word repeated across them wastes a slot — if "trivia" sits in both the name and keywords that is already a bug. Renaming also costs brand recognition. Next step: I read the current name/subtitle/keywords in both consoles and propose an exact swap. |
| **Which visual world for /lineup** | You. `DESIGN.md` assigns "The Scouting Report"; the builder is in the current app world. Scope was "homepage first, then decide" — this is the decide. |
| **Play API-level warning (due 31 Aug 2026)** | Build 15 (targetSdk 36) SUBMITTED for review 2026-08-10. ⚠️ Verify the banner actually clears after rollout — the 'Ikke inkludert' table showed build 14 already at mål-SDK 36, so the notice may be about something we have not read. If it persists post-rollout, open the notice and read the full text. Previously: You — upload only. ⚠️ NOT a code fix: the repo already has `targetSdkVersion 36` and `versionCode 15`, while production is **14 (1.5.1)**. The warning describes the LIVE build. Cut build 15 and upload; nothing needs writing first. |

### DEFERRED — with the trigger that should wake them

| Task | Wake it when |
|---|---|
| Homepage rebuild (approved v5) · club-page competitive rebuild | After the store/ASO work — those move signups, these move an already-converting page. |
| Capacitor 8 branch (iOS side + AGP 9 retest) | Before the next OS-forced upgrade. No user-visible win today. |
| MP answer-key Phase 2 · CSP enforce · async challenges | When MP stops being a claim and becomes a used feature. |
| Notification centre + native push | With, not before, a reason to notify. |
| Pre-launch hardening: service_role rotation, load test, README, coverage, App.jsx refactor | Rotation before any contractor access; the rest at ~10× traffic. |
| v1.1 audit follow-ups: Preferences adapter, profiles-UPDATE hardening, SW offline gap, ~23 unverified QA questions | Opportunistically. |
| "Next →" under the Dynamic Island | Needs Alex's real iPhone — cannot reproduce on the simulator, so no fix will be written blind. |
| Monetization checkpoint (Mediavine) | ~10k sessions/month. |

### CLOSED — stop re-litigating these

- **Editorial answer-leak cleanup — DROPPED.** Justified as "widens the draw"; measured, it narrows nothing (100% of every pack still reachable). Sessions already leak-free 26.9% -> 0.0%.
- **Localisation / US-soccer layer — DEAD.** GSC says Egypt is 100% brand traffic and the US ranks 7.2 for our own name because "ball IQ" is US basketball jargon.
- **Halting the Play 1.5.0 rollout — NOT DONE, on purpose.** Halting the only production release pulls the listing; a superseding upload keeps us live.

---
---

- [ ] **🎯 ALEX'S FEATURE: show who picked what at the reveal** (avatars beside
  each option). **Verified 2026-08-03 that the data does not exist yet** —
  `room_players` holds room_id, user_id, name, avatar, score,
  answered_question, joined_at, disconnected_at, streak, best_streak,
  eliminated_at_q. `answered_question` is a yes/no; nothing records WHICH
  option a player chose.

  ⚠️ **Do not just add `last_answer_idx` to `room_players`.** That row is
  already streamed to every client in the room, and **RLS filters rows, not
  columns** — so the pick would be readable in the realtime payload the moment
  it is written, before anyone else has answered. Alex's own constraint
  ("post-reveal only, or it becomes answer-copying") would then be a
  client-side promise rather than a guarantee, and inspecting the payload to
  copy the strongest player's answer is trivial.

  **Design that actually holds:** store the pick server-side (columns
  `last_answer_idx` + `last_answer_q`, the second so a stale pick can never
  render against the wrong question), keep those columns OUT of the
  client-readable projection, and expose them through a SECURITY DEFINER RPC
  — `get_reveal_answers(p_code, p_question_idx)` — that returns picks ONLY
  when the question is closed (every player answered, or QUESTION_DURATION_MS
  elapsed). The client calls it once per question at reveal.

  Cost: one migration, one RPC (ending in `revoke execute ... from public`
  after explicit grants), submit_answer writing two columns, and the reveal
  UI. Wants a 2-device test — the same test [[project_mp_stats_realtime_gated]]
  is already waiting on.

## 💡 LINEUP BUILDER — BUILT 2026-08-10, deployed inert. Alex's idea, 2026-08-03.

**BAR SET BY ALEX 2026-08-10:** *"we will not make it available until it is at
the level of or BETTER than our competitors."* Not linked, not in the sitemap,
until it clears that. Do not link it early.

### ✅ Done

- `public/lineup/index.html` — one global pool of **3,656 players** (any club,
  any era), 14 formations (4-3-3 default), rows placed by real pitch depth,
  canvas image export at 1080×1350, share link in the address bar, accent-folded
  search ("sesko" → Šeško). Commits `47943ff` → `9ea65b8` → `053e837`.
- `squads.json` rebuilt (`17d6650`) — 65 clubs, 1,545 players, all 20 PL clubs,
  reserves and academy. Cross-club supersede pass with an abort guard.
- **3,759 licence-verified Commons photos** (`7884e92`) + **3,726 Vision face
  crops (99.1%)**. Crop is a RECTANGLE applied in CSS — no derivative images
  hosted, so nothing rides into the native binary.
- Attribution renders on the page AND is drawn into the exported PNG (licence
  condition — the PNG is what gets posted).

### 🔧 FIX — these read as "broken", not "missing"

1. **Drag-and-drop to reposition.** Every rival has it; its absence is the single
   thing that will make us feel like the lesser tool.
2. **Pre-fill a real club or national XI, then edit.** Fastest route to a
   finished team, and it makes the "who replaces him" case one tap. FotMob and
   MyLineups both have it.
3. **Photo RECENCY + quality.** P18 is often neither newest nor club kit — Ben
   White's is 2018, Saka/Rice/Raya are in national kit, Iniesta's has a trophy
   over his face. Fix: rank each player's Commons **category** by
   `DateTimeOriginal` instead of taking P18. Same job serves Alex's "new club
   kit" ask. ⚠️ Not automatable for kit detection; recency only.
4. **Mononym names.** "Marcelo Vieira" → "Vieira" is wrong. Needs a
   "commonly known as" field we do not have. Suffixes already fixed.

### ✅ RESOLVED 2026-08-10 — the builder no longer borrows Mystery's eligibility

Root cause of every "player X is missing" report: the builder consumed
mysteryPool.json, whose gates exist for a similarity game (career + position +
nat + born all required). Measured live:
- **Yoro & Andrey Santos: Wikidata has NO P54 club membership at all** → no
  career rows → Mystery gate rejects → builder inherited the rejection.
- **Heaven: has P54 + photo, missing only a position** → same gate.
- **Gittens & Quenda: ZERO freely-licensed Commons photos exist** — verified.

Fix (`build-lineup-data.mjs` rewritten): builder has its own rule — squads ∪
mysteryPool ∪ core (fame≥25), photoless players included as INITIALS CARDS,
sorted active → photographed → fame. All 12 spot-check names present, enforced
with exit(1) in the build. Pre-fill still requires photos (an XI of initials
reads as broken). Sub-25-fame youngsters (Quenda, Lacey) arrive via the SQUAD
REFRESH, not by fetching tens of thousands of fame-10 items.

### 🔧 FIX — found by Alex playtesting a Man United XI, 2026-08-10 (history)

**Two gates exclude exactly the players a fan wants, and a third makes club
lists read as historical.**

- **The 25-sitelink fame floor.** Shea Lacey is fame **10** on Wikidata, so he
  cannot enter the pool at all. Every academy prospect is in this position.
- **The photo requirement** (`build-lineup-data.mjs` skips anyone without a
  usable Commons photo). For a lineup builder this is the wrong trade: a fan
  typing a name wants the player, and initials are an acceptable card.
- **⚠️ WIKIDATA HAS NO OPEN CLUB SPELL FOR EITHER.** Measured: Andrey Santos
  (Q106171073, fame 32) and Shea Lacey (Q117207006, fame 10) both show **0 open
  club memberships**. So a squad-based fetch will not find them either — this is
  a source gap, not only a filter gap. Andrey Santos is ALSO a bug: fame 32 is
  above our floor, so he should already be in the pool and is not. Find out why
  before widening anything.
- **Club labels are "known for", not "current".** A Manchester United filter
  offers 51 players led by Rooney, Mata, Ashley Young, Hernández, Fellaini,
  Smalling and Rojo. Building a current United XI is therefore actively
  awkward — this is what pre-fill (item 2) has to solve.

**⚠️ ROOT CAUSE FOUND — the legends photo sweep was never run.** 5,298 of 8,491
pool players are excluded for having no usable photo, including **Pelé,
Maradona, Zidane, Beckham, Cruyff, Totti, Ronaldo and Luke Shaw** (187 of them
fame 60+). When Alex said "current players first, legends after", only the
active+recent tiers were fetched and the `--all` pass was never run. Luke Shaw
was caught by it too: Wikidata has no open club spell for him, so tier() filed
a fame-66 current Premier League player as a *legend*. **⚠️ tier() must not
decide who gets a photo — a missing open spell is a data gap, not a career
stage.** Sweep started 2026-08-10 (`fetch-mystery-photos.mjs --all`, 5,085
players); rebuild `lineup.json` after it, then re-run both verifiers.

**Multi-person photos.** Kobbie Mainoo's card shows a second player behind him.
The detector takes the largest face, but a tight crop is not enough when two
people are in frame. `playerFaces.json` already records a `faces` count per
photo — prefer `faces === 1` when choosing, and fall back to the largest.

Fix order: (a) finish the --all photo sweep (in progress), (b) find why Andrey Santos is missing despite clearing the floor,
(b) allow photoless players with an initials card, (c) drop the floor for the
BUILDER pool only — the Mystery Player answer pool must keep its fame floor or
the daily answer becomes an academy trialist.

### ➕ ADD

5. Bench (subs), captain armband, kit colour, manager name — cheap and expected.
6. **⭐ QUIZ THE XI.** Build a team, then get quizzed on those eleven players
   from the bank. No competitor can copy this; it is what makes the builder
   OURS rather than a commodity, and it feeds the activation bottleneck.

### ⛔ DELIBERATELY NOT BUILDING — decided 2026-08-10, do not re-propose

- **Player rating sliders** (MyLineups has them). They would be invented numbers,
  and principle 2 is never claim more than the bank can prove — "every answer
  explained" already shipped false once.
- **Season simulation / tactics-board drawing** (TeamBranch). Different product,
  and maintenance for one person.
- **Custom uploaded players.** Moderation and licence exposure.

### ❓ OPEN DECISION FOR ALEX

- **Which visual world does /lineup belong to?** `DESIGN.md` assigns "The
  Scouting Report" (newsprint, Archivo Narrow, near-monochrome). The builder is
  built in the CURRENT app world (#0A0A0A / #58CC02 / Inter), matching the app
  and the 191 generated pages. Scope was "homepage first, then decide" — this is
  the "then decide".

### 👁️ PHOTO SURVEY of the top-5 Google lineup builders — LOOKED AT, 2026-08-10

Playwright screenshots of all five, read by eye (not fetched-and-summarised):

| Site | Player representation, as actually rendered |
|---|---|
| lineup-builder.co.uk (#1 result) | **NO photos.** Icon / shirt / shield / number graphics; "18,000 players" is a NAMES database. Footer disclaims ownership of all logos. |
| fotmob.com/lineup-builder | **THE BAR.** Small circles, real headshot cutouts on clean light background, surname below, current squads (Lammens, Mbeumo, Dorgu). Licensed — they are a data company. |
| buildlineup.com | Jersey graphics + numbers. No photos. |
| createformation.com | Real headshot CUTOUTS, EA-game / PL-media style, floating on the pitch. "19,000 player images", free, ad-funded — near-certainly UNLICENSED hotlinking. Not our path. |
| chosen11.com | Coloured token discs. No photos. |

**Verdict: only 2 of 5 use real faces; one licenses them, one appears to steal
them. Three use graphics. We are already the second-best LEGAL face builder.**

The legal route to FotMob's look with our own licensed photos:
**person-segmentation cutouts.** macOS Vision (VNGeneratePersonSegmentationRequest,
local, free) strips the noisy match background from our Commons photos →
uniform FotMob-style cutout on a clean backdrop. Derivatives of CC BY / CC
BY-SA are permitted WITH attribution + a note of modification — standard
Commons practice ("cropped, background removed"). Needs hosting (~3-5k WebP
cutouts ≈ 50-100MB): Supabase Storage on the Pro plan is the natural home;
NOT the repo (bloat) and never the native binary. ⚠️ ALEX DECISION: approve
the bucket + pipeline before building.

**Squad data beyond Wikidata — CORRECTED after verification 2026-08-10:**
⚠️ football-data.org's FREE tier does NOT include squads (verified on their
pricing page — squad data starts at the €29/mo tier). The earlier board entry
recommended it unverified; that was wrong. Real options, in order:

1. **Wikipedia current-squad templates (lead candidate, free).** Every club
   article carries a fan-maintained "Current squad" section in structured
   {{football squad player}} templates — updated within hours of transfers,
   CC BY-SA with attribution, same ecosystem as our photos. Needs a template
   parser via the MediaWiki API. Fixes stale-United, adds Yoro/Heaven/Quenda
   via squad membership.
2. **API-Football free tier** (100 req/day — enough for a weekly refresh of
   ~70 clubs). ⚠️ Terms not yet read; verify commercial/ad-funded use first.
3. **football-data.org €29/mo** — the paid, zero-maintenance option if squad
   freshness ever justifies spend.

**Paid photo/data services — Alex green-lit spend 2026-08-10 ("as long as we
can legally use them, quality standard high"):** the free stack (Commons +
re-pick + cutouts) is competitive first; spend closes residual gaps only.
Candidates to evaluate WHEN a gap remains: Sportmonks (player images licensed
within subscription), football-data.org €29 squads, enterprise feeds
(StatsPerform — likely out of range). ⚠️ Any signup/payment is ALEX's action;
read the licence terms for redistribution/display rights before paying —
"API access" does not always mean "image display rights".

**Supabase Storage: `player-cutouts` bucket CREATED 2026-08-10** — public
read, 500KB/file, PNG+WebP only. ⚠️ NO write policy exists; open an INSERT
policy only for the upload run, then drop it (REVOKE discipline). Existing
`avatars` bucket untouched.

**Cutout prototype VERDICT (gallery sent to Alex):** 7 of 9 hit the FotMob
bar from our own licensed photos. The two misses (Ekitike blur, Frimpong
profile) are SOURCE-quality problems the running re-pick fixes — segmentation
cannot invent pixels. ⚠️ Mainoo showed that OVERLAPPING players merge into one
Vision instance, so the two-face fix is the re-pick preferring single-subject
photos, with the cutout as the finish. Correct order: re-pick first, cut
second. Cutout batch + Supabase Storage bucket (Alex approved) run AFTER the
pipeline completes, on the best photo per player.

### Competitive position (measured 2026-08-10)

| | Us | Best rival |
|---|---|---|
| Real photos **on web** | ✅ licence-cleared | only FotMob |
| Pool | 3,656 | MyLineups ~10k |
| Formations | 14 | FotMob 14 + free form |
| Export + share link | ✅ | all of them |
| Drag & drop | ❌ | all of them |
| Bench / captain / kit | ❌ | MyLineups |

**The thesis:** rivals compete on quantity of options. Fans pick the tool that
produces a picture worth posting, fastest. MyLineups has ~10,000 players and
shows none of their faces on web — that is the opening, and licence-cleared
photos are a moat because copying them means doing the same legal work.

### ⚠️ Traps banked from this build

- **Commons 429s a few-thousand-image sweep** and returns a 2,167-byte HTML
  page. Fetched blind it reaches a detector as "unreadable" and gets cached as a
  verdict. Detection read 62% → 51% and looked like a property of the photos;
  after magic-byte checks and backoff it came back **99.1%**. A transient
  failure must record NOTHING so the next run retries it.
- **The CDN only serves pre-rendered widths** — 120/250/330/500 always 200,
  800/1024 always 400. Asking for arbitrary widths 400'd on 100% of requests and
  succeeded via fallback, hiding a total failure behind a working page.
- **`Special:FilePath`'s 302 drops CORS**, so it cannot serve a crossOrigin image
  (breaks canvas export and the on-page fallback).
- **A `<button>` does not inherit body colour** — every player name rendered in
  the UA's default dark text on dark grass, invisible.
- **`overflow:hidden` on the photo disc clipped the position badges** to blobs.

### Data gaps

- 7 club packs absent from squads.json (failed the 14–45 sanity gate):
  Fenerbahçe, Torino, Parma, **Boca Juniors**, Basel, Schalke 04, Valencia.
- Going global fixed the keeper hole (108 → 349 GKs), so per-club XI shortfalls
  only matter if a club-scoped mode returns.

---

### Original reasoning (2026-08-03) — why it was worth building

**Why it is a better idea than it first sounds.** Our measured ceiling is
AUTHORITY, and the thing we lack is linkable assets — nobody links to a JS
quiz. A lineup builder is a TOOL, and tools are what people link to, embed and
share. It attacks the actual constraint rather than the symptom.

**The demand is documented, not assumed:**
- `lineup-builder.co.uk` already ranks in the "football quiz uk" SERP we are
  fighting in (found in the competitor scan).
- A public App Store review of **Sofascore** asks them to "add quizzes, score
  predictions, **lineup builders** like FotMob" — a user naming it unprompted.

⚠️ **What I could NOT verify: search volume.** We have no keyword tool, so
"people search for these things" is plausible but unmeasured. Do not size this
opportunity until we have real volume data — that is a one-month Ahrefs or
Semrush question, and it should come BEFORE the build.

**The blocker is a dataset, and we do not have it.** Measured today:
    player names (Footle)          406
    players with a club career      44
    players with a POSITION         44   <- the killer
A builder needs current squads: ~25 players x 72 clubs ≈ 1,800 rows, each with
a position, kept fresh through two transfer windows a year. That is an ongoing
data-maintenance commitment, not a build.

**⭐ THE REAL INSIGHT: one dataset unlocks TWO products.** The "Mystery Player"
mode already on this list is blocked on *exactly the same thing* — its note
reads "gated on a player dataset, not the algorithm". Build the squad dataset
once and both ship. That materially changes the cost/benefit and is the
strongest argument for doing it.

**✅ DATA SOURCE PROVEN 2026-08-03 — Wikidata, not a scraper.**
Alex suggested Firecrawl for continuous squad updates. We do not need it, and
should not want it: the good squad sources (Transfermarkt above all) forbid
scraping in their terms, so a core feature would rest on something that can be
pulled at any moment, and an HTML scraper breaks silently on any redesign —
this repo's signature failure.

Wikidata's public SPARQL endpoint was tested live and returns players WITH
positions for a club (`wdt:P54` = member of sports team, `wdt:P413` =
position). No auth, no key, no scraping, CC0 licensing, a real query API, and
it is edited by humans DURING transfer windows — which is exactly the
freshness problem Alex raised.

Two things learned from the live queries, both handled in one query:
- ⚠️ `wdt:P54` returns EVERY membership ever — the first Arsenal result gave
  Tony Adams and Alan Ball. For a current squad, query the statement node
  (`p:P54`/`ps:P54`) and `FILTER NOT EXISTS` on an end-date qualifier (`pq:P582`).
- ⚠️ Players return MULTIPLE position rows (Tony Adams as both "centre-back"
  and "defender"). Needs a dedup/priority map to one position per player.
- The endpoint 502s under load. Retry with backoff; never make a user-facing
  request depend on it — snapshot to our own JSON on a schedule instead.

**Open questions before any build:**
1. Real search volume for "lineup builder" / "football lineup creator"?
2. Crests and kits — the known licensing blocker. Does a text-and-shirt-colour
   builder work without them? (FotMob and lineup-builder use crests.)
3. Where does squad data come from, legally and sustainably? Manual for 72
   clubs is not maintainable by one person through a transfer window.

## ⭐ NEXT BUILD — the /questions Q&A layer (Alex approved 2026-08-03)

**Why this and not more questions.** The competitor read found our single
largest asymmetry: we hold ~6,400 verified questions and have **zero pages in
the text "questions and answers" format** that wins that SERP — a DIFFERENT
SERP from the head term, currently held by thin listicles with no schema
(quiztriviagames ranks with 90 questions and no structured data; kwizzbit uses
50 as a lead magnet). It is also the LINKABLE format: quizmasters cite
question lists, nobody cites a JS quiz. The raw material already exists and is
already verified — this is a script over data we own.

**Shape:** `/questions/<club>-quiz-questions-and-answers/`, 72 pages.
Questions grouped in rounds of 10, answers in a separate block after each
round (the pub-quiz convention — that is what makes it printable and
citable), table-of-contents anchors, print stylesheet, FAQ + Quiz schema
(NO competitor in the top set uses Quiz schema — free differentiation on an
already-clean on-page base).

**Wiring that must not be missed** — a new page type is more than a builder:
- register in `buildSitemap` (see gen-seo-pages.mjs:3641)
- **`vercel.json` rewrite for `/questions/(.*)`** — routes are whitelisted
  explicitly and a new one 404s in prod without it; a local dist fallback
  masks this, so verify LIVE by static `<title>`, never by HTTP 200
- inbound links from the matching club page, or it ships orphaned
- 3-level breadcrumbs + self-canonical, same as /lists
- ⚠️ `main` IS production and auto-deploys, so this lands as 72 pages at once.

## ✅ SETTLED 2026-08-03 — do NOT cap web questions to drive app installs

Alex proposed capping on-page questions and adding "get more Liverpool
questions in the Ball IQ app". **Measured first: the app has EXACTLY the same
questions as the web page for all 72 clubs** (Arsenal 67/67, Liverpool 42/42).
So the claim is not true today, and capping would make it true only by making
the free product worse first — while pointing the opposite way from the
competitor finding (our gap is too LITTLE indexable text) and cutting against
the settled "content stays free, Pro = features" decision.

**Kept:** the club-specific CTA, which is a real improvement over a generic
"Get the app" — but honest about what the app actually adds: multiplayer
against a mate, daily streaks, XP, Footle, Transfer Trail. Same lesson as the
"every answer is explained" store-copy fix: the CTA has to be true.

## 👁️ EYE-OPENER 2026-08-03 — the /lists pages are 52% of our impressions and 4% of our clicks

Totalled from the GSC per-page breakdown (90 days). This is the single most
striking number on the site and it was invisible until position was pulled
alongside CTR.

    /lists impressions : 10,494   ← 52% of ALL site impressions
    /lists clicks      :     11   ←  4% of ALL site clicks
    /lists CTR         :  0.10%
    33 of 43 list pages have ZERO clicks, holding 6,196 impressions
    impression-weighted average position: 27.1

Worst: `premier-league-champions` 873 impressions at position **49.5**, zero
clicks. `serie-a-top-scorers` 841 at 34.3, one click. `ballon-dor-winners`
696 at 26.1, zero.

**What it means.** The /lists bet is HALF-WORKING and the half that works is
the invisible half. Google clearly considers these pages relevant — it shows
them ten thousand times — but ranks them around 27, where nobody clicks. They
are not failing to be found; they are failing to be found *high enough*.

**What it does NOT mean.** Do not rewrite the list pages. Same trap as the
club-page CTR thesis: at position 27-50, 0.1% CTR is simply what is paid, and
no title fixes that. `most-ballon-dors` sits at 12.6 with 951 impressions and
2 clicks — the one page ranking respectably still converts at 0.2%, which
says the QUERIES are informational ("who has the most Ballon d'Ors") and get
answered in the SERP by a featured snippet. We would be fighting Google's own
answer box.

**The honest read: /lists is an authority play that has not been paid yet.**
It cost one day, it generates half our impressions, and it converts nothing
until the domain moves. That is an argument FOR the partnership, not against
the lists. Re-read this after the first backlinks land — if position moves
from 27 to 15, this becomes the biggest traffic source on the site overnight.

## ❌ FALSIFIED 2026-08-03 — the club-page "CTR fix" is not a real opportunity

I ranked this the #1 ROI task. It does not survive its own data, and the
correction matters because it would have been a day of pointless work.

**The claim:** Rangers converts 10.0% and Arsenal 2.5%, so Arsenal's titles
must be worse — rewrite them and quadruple the clicks from impressions we
already hold.

**Why it is wrong.** Every club title uses the SAME template —
`<Club> Quiz — <Nickname> Trivia & Answers | Ball IQ` — and the same
description pattern. Rangers and Galatasaray are structurally identical
listings with a 4x CTR difference. Wording is not the variable.

**What actually correlates: the page-one boundary.**
    Rangers 8.2 · Everton 9.0 · Tottenham 9.3   ->  4.7-10.0% CTR
    Arsenal 10.7 · Chelsea 13.3 · Real Madrid 14.8 · Man Utd 19.7  ->  0.6-2.5%
That is a cliff at ~position 10, not a slope, and it is exactly what CTR
curves look like. The query data agrees: **"arsenal quiz" gets 337
impressions and 4 clicks** — perfect intent, 1.2% CTR, because we sit at ~11.

**The one anomaly:** Galatasaray ranks 7.1 but converts 2.6%. Likely an
intent-mix problem — impressions from Turkish-language queries where a quiz
is not what the searcher wants. Not fixable by copy either.

**Conclusion: there is no cheap on-page CTR win.** The lever is POSITION,
which is authority, which is the partnership. This is the fourth independent
route to the same answer today. **Stop looking for on-page wins on club
pages.**

⚠️ Method note for next time: I compared CTR across pages WITHOUT normalising
for position, which is the first thing a CTR analysis must do. Pull position
in the same query, always.

## 🔑 GSC READ 2026-08-03 — "175 dead pages" WAS WRONG. Nothing is dead.

Alex opened GSC. It overturns the finding I recorded hours earlier, and the
error was in my METHOD: Clarity measures SESSIONS, and at a 1.6% CTR our
impressions convert to few enough visits that most pages cannot surface in a
top-25 session list. Absence from Clarity is not absence from Google.

**Indexing — healthy.** 151 indexed, 18 not. Of the 18: 2 alternates with a
valid canonical (correct, not a fault), 1 "crawled – not currently indexed",
15 "discovered – not currently indexed" (Google knows them, hasn't prioritised
crawling). **There is no indexation problem and nothing technical to fix** —
which the local audit predicted: 191/191 correct self-canonicals, zero
noindex, robots.txt clean, IndexNow key live at 200.

**Performance, 90 days — the real picture.**
    impressions   20,200          clicks   314
    CTR            1.6%           avg position   20.9
    **174 pages carry impressions**, not 19.
    Impressions climbing STEEPLY since ~22 July.

**We are not undiscovered. We are on page two.** 20k impressions at position
~21 is a site being seen constantly and clicked rarely, because page two pays
~1-2%. This is the authority ceiling stated in traffic terms, and it confirms
[[project_football_quiz_head_term]] and [[project_ranking_diagnosis_2026_07_28]].

**⭐ THE ACTIONABLE FINDING — club-page CTR varies 6x at similar positions:**
| page | clicks | impressions | CTR |
|---|---|---|---|
| / | 79 | 497 | **15.9%** |
| /quiz/rangers/ | 22 | 219 | **10.0%** |
| /quiz/everton/ | 15 | 165 | 9.1% |
| /quiz/tottenham/ | 22 | 469 | 4.7% |
| /quiz/liverpool/ | 15 | 400 | 3.8% |
| /quiz/newcastle/ | 7 | 234 | 3.0% |
| /quiz/galatasaray/ | 13 | 506 | 2.6% |
| /quiz/arsenal/ | 25 | **1,006** | 2.5% |
| /quiz/chelsea/ | 7 | 362 | 1.9% |
| /quiz/real-madrid/ | 6 | 373 | **1.6%** |

Arsenal holds the most impressions on the site (1,006) at 2.5%, while Rangers
converts 10%. **CTR at a fixed position is a TITLE/DESCRIPTION problem, and
that is ours to fix, not an authority wait.** Closing Arsenal's gap to
Rangers' rate alone would roughly quadruple its clicks from existing
impressions. Today's "& Answers" retitle targets exactly this — the fortnight
watch (~2026-08-17) now has a precise before-baseline to measure against.

## SEO REVIVAL ATTEMPT 2026-08-03 — four hypotheses, four falsified

**The scale of the problem: 175 of 194 pages get essentially no traffic** (90%).
Only ~19 pages cleared 4 sessions in 7 days. Worst category is the newest one:
**49 of 51 `/lists` pages are dead (96%)**.

Four on-page explanations were tested and every one failed:

1. **"/quiz/liverpool/ is broken"** — 2.2s/session looked fatal on a 3-day
   window. Over 7 days it is 20 sessions at **117s**. Noise from a 5-session
   sample. ⚠️ Do not act on Clarity samples under ~15 sessions.
2. **"the lists lack the playable taster"** — they have one (12 markers, 20
   buttons); it is smaller than a club page's, not absent.
3. **"serie-a-top-scorers 301s vs ballon-dor-winners 10s means the pages
   differ"** — 5 sessions vs 4. Noise again, from the same trap as #1, twice
   in one session.
4. **"internal link equity is starved"** — measured across all 191 built
   pages: **zero orphans, median 75 inbound links**, max 190. Traffic pages
   median 86 vs sitewide 75 — barely a difference. Linking is not the drag.

**Conclusion: on-page SEO is not the binding constraint.** This independently
re-derives [[project_ranking_diagnosis_2026_07_28]] by four different routes —
fundamentals are clean, the ceiling is AUTHORITY. Stop auditing on-page.

### ⛔ THE ONE THING BLOCKING A REAL ANSWER
We cannot tell whether the 175 dead pages are **(a) not indexed** — which is
mine to fix (crawl budget, sitemap, IndexNow) — or **(b) indexed but
outranked**, which is authority and Alex's outreach. Those need opposite work
and Clarity cannot distinguish them: it only sees sessions that already
happened. GSC can, in one query. **Connecting the GSC data connector is worth
more than any further on-page work.** The last GSC read (2026-07-20) covered
56 pages and found 55 indexed but stuck on page 2-4; the site is now 191
pages, so the ~135 added since have never been checked at all.

### Concrete finding worth a decision
**9 localised pages are near-orphans with 1 inbound link each** —
`/pt/quiz/{flamengo,palmeiras,corinthians}/`, `/id/quiz/{arsenal,manchester-united}/`,
`/es/quiz/{boca-juniors,river-plate}/`, `/tr/quiz/galatasaray/`. They were
built on the localisation thesis that [[project_us_egypt_gsc_2026_07_29]]
measured as **DEAD**. They duplicate their English originals' structure and
dilute rather than add. Alex's call: noindex, delete, or leave.

## FINDINGS 2026-08-03 (afternoon)

- [x] **✅ Trail spot-check DONE — all six careers pass** (van Dijk, Courtois,
  Griezmann, De Bruyne, Son, Lewandowski). Loans are correctly marked via the
  parallel `loans` array (Courtois→Atlético and De Bruyne→Bremen both `true`).
  Lewandowski's missing Znicz Pruszków is a *documented* editorial drop (third
  tier, Modrić precedent), not an omission. **They are already in
  TRAIL_ANSWER_LOG, 9× each** — the "INERT, NOT written into the log" comment
  above them is stale. Nothing has served yet only because the anchor is
  2026-09-01; today resolves to Trail #-28 and `getTrailAnswer()` returns null,
  which `HomeScreen.jsx:141` correctly gates on, so the card simply hides.
  ⚠️ **The one real tension:** De Bruyne's Chelsea return (Aug 2013 – Jan 2014,
  9 apps) is dropped to fit the 6-rung cap, which the locked rules forbid —
  "returns = rungs" and "truncating a career is not allowed" cannot both hold
  here. Alex's call: drop De Bruyne, or allow a 7th rung.

- [x] **✅ "Report a problem" on iPhone — DIAGNOSED, and the fix is real.**
  **iOS build 51 was cut 2026-07-29. The report-loop fixes (`ac0f869`,
  `845b186`) landed 2026-07-30 — one day later.** Alex's installed binary
  simply does not contain them. Prod confirms both halves: `question_reports`
  now holds 4 rows, newest today 09:17 UTC — all from **web**, where the fix
  deployed immediately. **Action: the fix reaches phones only via a new iOS
  build (52).** Nothing to debug in the code.

- [ ] **🔴 THE CLUB-PAGE SCROLL CLIFF — the real SEO finding.** Clarity, 7 days:
  every club page sits at **13–29% scroll depth** (Arsenal 19.0, Liverpool 19.2,
  Chelsea 19.6, Real Madrid 13.8, Champions League 8.7) while `/play` gets
  **95.3%**, `/lists/serie-a-top-scorers/` **93.8%** and the homepage **58%**.
  Engagement is healthy (~2 min/session) — people just never go below the top
  fifth. Measured on `/quiz/liverpool/` at 375×812: the page is **7,804px (9.6
  screens)** and 20% is **1,561px — under 2 screens**. So everything from
  "More quizzes to try" (32%) down is effectively unpublished: the record-book
  section (74%), the trust/how-it's-checked section (81%), the FAQ (88%) and
  the whole footer link mesh (94%). **That link mesh is what carries internal
  authority, and no human ever reaches it.** Options: hoist the mesh above the
  cliff, or cut the page length. Not a title/meta problem — those were
  diagnosed clean on 2026-07-28.
  ⚠️ A 3-day window made `/quiz/liverpool/` look dead (2.2s/session over 5
  sessions). Over 7 days it is 20 sessions at **117s**. Do not act on Clarity
  samples under ~15 sessions.

## TODAY — 2026-08-03

- [ ] **ALEX 2026-08-03: native push for REMATCH invites** — a rematch/challenge
  invite should fire an APNs/FCM banner on the phone, not just in-app realtime
  (extends #21's fix + the notification-center backlog; web half still gated
  on VAPID secrets, task #17).
- [ ] **ALEX 2026-08-03: friends' avatars beside their answers in MP** — show
  each friend's profile picture next to the option they picked (post-reveal
  only, or it becomes answer-copying).
- [x] **✅ MP PLAYTEST BUGS (Alex vs Johannes, 2026-08-03) — ALL FOUR CLOSED.** Playtesters scored ~100% again; every one was real, and three of the four had a cause different from the one filed.
  1. **H2H "3–0 vs myself" — FIXED.** The filed hypothesis (the tally attributes all rooms to one player) was WRONG, and prod data said so: the 3 was correct, the **0** was the bug. The ledger counted the current room in its own history and never counted the opponent's wins. Fixed in `OnlineMultiplayer.jsx` — exclude `room.id`, count W/D/L by actual board result, and require 2+ prior meetings before the banner shows at all. The name-in-both-slots half was the same root cause.
  2. **XP inflation — FIXED.** `getMpXP` was `score*10 + 50`, so one match paid 52,790. Now `max(15, round(score/40) + 50 if won)` — a strong win pays ~180, in line with solo. **The two inflated profiles were also deflated in prod** by reconstructing true XP from the `scores` table (Alex 2,006 · Johannes 2,446), cross-checked by an independent subtraction that agreed within 35 XP.
  3. **Duplicate questions — FIXED, and the filed diagnosis was wrong twice over.** It was never a *rematch* problem and they were never on *Mixed*: both repeats are `cat:"LaLiga"`, so it was a topic pack, where the pool is 270 rather than 6,400. Measured back-to-back repeat rates — Mixed 2%, LaLiga 34% (7% for two), Ligue 1 72%, chaos 97% (82% for two). A biased-shuffle theory was measured and ruled out first (worth ~0.3 points). The note that MP "must NOT consume applySeenFilter" was also wrong: only the HOST picks, so the filter changes which questions the room gets, never who sees what. Now both players record the round (hosting alternates on a rematch). Simulated over a 6-game session, repeats go 6.0→0 on LaLiga, 15.2→0 on Ligue 1, and 27.8→22.5 on chaos against an arithmetic floor of 21.
  4. **Verified against prod, not code** — `game_rooms` / `room_players` / `scores` queried directly for this pair. That is what overturned bugs 1 and 3.
- [ ] **134 same-answer question pairs need an editorial call** (`.audit/same-answer-pairs.json`, found while fixing bug 3). Each pair shares a resolved answer and 50%+ of its stem tokens; **79 cross category boundaries, so they can collide inside one Mixed game.** The 2 verbatim duplicates were already removed (`6e244df`). The rest are rewordings — picking which twin dies is a football judgment, not a script's.
- [x] **✅ League ladder extended upward** (`6663f6e`) — a perfect game pays 200 XP, so the old Legend ceiling at 3,000 was ~15 games: every engaged player finished the whole progression in a fortnight. **Stretching the thresholds was measured and rejected** — it demoted 9 of 9 active users, including one losing a Legend badge they earned. The six existing rungs are frozen; **Icon (8,000)** and **Immortal (20,000)** sit above them. Nobody moved; the leader now has 1,582 XP of visible headroom instead of a full bar.

- [ ] **WAVE N — RESCUED, NOT SHIPPED** (`b115646`). Run 1 died at the usage
  wall: 19 of 196 agents done, 177 errored. Six clubs returned EMPTY with
  `belowGate: true` — the pipeline correctly refusing to ship unverified work.
  **175 generated questions are saved** in `.audit/wave-n-run1/generated.json`
  (+ journal + the exact script). ⚠️ **GENERATED ≠ VERIFIED — none may enter
  src/questions.js until each clears examiner AND skeptic.**
  Resume (completed agents replay free):
  `Workflow({scriptPath: '<workflows dir>/wave-n-forge-wf_092cf5c7-559.js', resumeFromRunId: 'wf_092cf5c7-559', args: {fenerStems:[...]}})`
  **LESSON: 196 agents in one bite was too big — split future waves into 2–3
  clubs per workflow so a limit costs one club, not a wave.**
  Then: curate → insert → wire (App.jsx ×5, gen-seo ×2+DIR_ALIAS, clubs.mjs
  prose w/ array-hole assert, NEW `club-competition.mjs` entries or the build
  fails, clubIndex self-regenerates). Titles need "& Answers" ≤60 chars.
  Indexing is automatic: prod deploy regenerates sitemap + pings IndexNow.

- [ ] **FORTNIGHT WATCH (started 2026-08-03)** — the homepage swapped and the
  "& Answers" retitle both went live today. Read GSC + Clarity around
  2026-08-17 BEFORE any further homepage surgery: homepage CTR/bounce vs the
  old page, and the 45 retitled clubs vs the 27 unchanged. Tottenham +
  Newcastle are the natural experiment (they were LOSING those queries).
- [ ] **POST-SWAP CLEANUP (after the fortnight verdict)** — delete
  MarketingHome.jsx + the `/home-old` route + its vercel.json rewrites. That
  also retires the pixel-debt list (8 stray surface shades, the two text
  ramps, the orange Trail ramp) — it all lives in the page being deleted.

- [ ] **CLAUDE: GSC via the data plugin** (Alex, 2026-08-03) — run a proper
  data-tool analysis over Search Console instead of screenshots + the flaky
  in-console filters (the `?query=*term*` trap). ⚠️ The data connectors
  (BigQuery / Hex / Definite) all sit unauthorized — Alex must connect one in
  claude.ai settings first, OR we pull GSC's API directly (the property is
  URL-prefix `https://balliq.app/`, never sc-domain). First questions to ask
  the data: did the "& Answers" retitle move CTR on the 45 changed pages vs
  the 27 unchanged; post-swap homepage CTR; Türkiye cluster demand curve.

### 🎨 THE SCOUTING REPORT — LIVE AT https://balliq.app/home-preview/

`/` is untouched and still serves MarketingHome. The preview is a separate lazy
chunk on a route that already existed, so the converting homepage carries zero
risk. **Judge it on a phone** — 66% of traffic.

**Alex, 2026-08-03: "no need for us to rush, we will get this PERFECT."**

#### The 9 to swap-ready — BLOCKING (1-6)

- [x] **1. Club wall** — DONE (`bf537e5` + data `885e865`). 0 → **72 club links + hub**, generated from the hand-verified competition map; heading count generated so it can’t go stale; build FAILS if a club lacks a competition. Detector clean (2 pre-existing shell findings only).
- [x] **2. Footle section** — DONE. Playable PAST puzzle (build-time gen, grader emitted from wordle.js with round-trip guard), teaching strip, keyboard, countdown ends the page. Verified by playing; detector clean.
- [x] **3. Daily 7 door** — DONE. `?game=daily` rides the existing `?game=footle` branch; door beside Footle’s in the band. Verified by booting into "1/7". Note: fresh devices see onboarding first (pre-existing, same as footle).
- [x] **4. Nav** — DONE. Mockup masthead ported (Clubs/Records/Daily/About, no drawer — wraps under 700px, 44px targets), skip link → #report, footer with store + legal links. ⚠️ skip-link :focus reveal unverifiable in the pane (window unfocused) — check by real keyboard in item 6.
- [x] **5. FAQ** — DONE. 5 corrected FAQs, native details/summary, FAQPage JSON-LD fed from the same array (schema⇄DOM match verified). NB: the old homepage never had FAQPage schema — this is its first appearance, the TODO’s "loses eligibility" claim was wrong.
- [x] **6. Accessibility pass** — programmatic portion DONE: 229 text nodes swept, **0 contrast failures**; heading order H1→H2×6 no skips; 0 unnamed controls; `lang=en`; **320px reflow: no horizontal overflow** (WCAG 1.4.10); all 3 animations reduce-guarded; 44-54px targets verified per component. **ALEX, 2 minutes on your Mac:** (1) load /home-preview, press Tab once — a green "Skip to the assessment" chip must appear top-left (the pane cannot test :focus); (2) optional: VoiceOver one pass through the report.

#### SHOULD-DO (7-9)

- [x] **7. The accumulating report** — DONE. Mockup stub table ported with its honesty rules (only correct fills a bar; unasked rows carry no bar; "1 of 1" not fake ratings); verdict lands beneath the completed table. Pips deleted — they were an invention. Verified by playing a 4/5.
- [x] **8.** DONE — MP clause ("friends to race online, up to eight") + app line rewritten to the TRUE exclusive (push reminders). The audit's "web has ads" premise is false while AdSense sits unapproved with slots commented.
- [x] **9.** DONE by construction — Clarity loads from the shared index.html shell (native-guarded, route-agnostic), and MarketingHome fires zero component-level events, so both homepages carry identical instrumentation already. Nothing to port.

**SWAPPED (Alex: "swap it", 2026-08-03).** `/` = Scouting Report; old page at `/home-old`; rollback = revert the swap commit. Watch GSC + Clarity for a fortnight.

#### Foundation already landed + verified

| commit | what |
|---|---|
| `4b11152` | Shared palette token layer — 191 pages **byte-identical**, 312b |
| `6103775` | Homepage tokenised — 121 literals → 16 tokens |
| `34aea2b` | Scouting Report layer, chunk-scoped, 0 bytes to the 191 |
| `763e6dc` | Archivo + Archivo Narrow self-hosted, **proved loading** (`document.fonts.check()` returns `true` for a font that cannot exist) |
| `2aae197` | The composition at `/home-preview` |
| `680133f` | impeccable detector run — found a **1.3:1 CTA** I'd eyeballed twice, a banned kicker, a side-tab, 10 off-ramp type sizes |
| `672a33f` | Desktop fold — I'd only ever designed at 375 |

**Standing rules for this work:** no literal px in the component (add a role to
`design/report.js`); action on the paper is INK not green; `--attr-mid` is
2.13:1 on newsprint and must NEVER be text; spacing is `--sp*` never `--s*`;
no backticks inside the CSS template literal (it fails the build silently —
grep the whole build tail, not `^error`).

### 🎨 Redesign groundwork — SHIPPED, pushed 2026-08-03

**Decision (Alex, 2026-08-03): homepage first, HOLD the 191 pages.** They're the
part that's growing — every rising page in today's GSC read was a club page.
Reskinning a working surface and a broken one together makes neither
attributable.

| commit | what |
|---|---|
| `4b11152` | **One source of truth for the web palette** — `src/design/tokens.js` → `tokens.css`, consumed by BOTH the app entry and the 191-page generator. Provably inert: dist/ diffed before/after, **all 191 pages byte-identical**. Cost 312 bytes (250 gz). |
| `6103775` | **Homepage tokenised** — 121 literals → 16 tokens. Verified in-browser at 375×812, not on paper. |

**Why this was needed:** three surfaces each carried their own copy of the same
palette. The homepage still painted `#1A1D27` ten times — a navy
[app.css:57](src/app.css:57) records the product moving *off*. Nobody decided to
keep it; nothing could notice.

**Still open, all pixel-moving so all separate decisions:**
- 8 stray surface shades, 23 uses (`#1A1D27`×10, `#16181F`×5, `#181B24`×3, …) — the drift itself
- **Two text ramps**: `#FFF` (24 uses) vs `--tx` `#F0F1F5` (11). Only one can be the ramp.
- Orange accent ramp with no token (`#FF6A00`×3, `#FF9245`, `#EE8707`, `#FFD24A`, `#241B00`)
- Green CTAs disagree on their ink: `--grn-ink` vs `--bg`. Both pass contrast; it's consistency, not a11y.
- ⚠️ **`--s1/--s2/--s3` collision**: app.css uses them for SURFACES, the Scouting Report mockup for SPACING. Spacing tokens must be `--sp1..--sp6`.

**Next:** map the Scouting Report vocabulary (`--desk/--paper/--ink/--verd`) onto these tokens, then port the composition.

### 🟢 Shipped — pushed 2026-08-03, deploy verified live

| commit | what |
|---|---|
| `b5d6d5e` | **All 72 club titles now say "Answers".** GSC's 28 days: `<club> quiz with answers` converts 3–5× the bare club term — Rangers **30.8% vs 5.6%**, Tottenham **15.0% vs 3.1%**. Same page, same position; the whole gap is whether the title answers the query. 47 titles didn't say it. The claim is true everywhere it's now written: worst explanation coverage among all 72 is **100%**, because club packs clear the ≥15-hint gate. Verified in the *built* HTML, not the source. |
| `d94a9fc` | **`/football-wordle/` is playable** — was 0 buttons, now 29, server-rendered so crawlers see the game. Seeded from a 31-day-old past puzzle inside the frozen answer log; a 1,095-day build simulation proved no future answer can ever leak, and caught a time bomb that would have hard-failed the build in mid-2027. |

### Shipped since the last entry — all pushed to main, all live

| commit | what |
|---|---|
| `db73078` | **Homepage stopped contradicting itself.** FAQ said "a native Android app is on the way" beside a live Google Play button. The hero number counted up through 1,689 and 2,996 — two figures that were never true — before settling. 6,407 and 6,000+ sat 200px apart. Footle's spent keys were 2.89:1, every one of the detector's WCAG failures. |
| `83394db` | **"Rated out of 99" was false AND undersold the product.** `calcBallIQ` maps 15 questions onto **60–160**; 99 is the MIDPOINT. The marketing page capped its own scale 61 points below a perfect score, and disagreed with the in-app FAQ, which had said 60–160 all along. |
| `d38b447` | **/footle was donating every backlink it earned to the homepage.** See below — this is the big one. |
| `819f047` `34281b5` `de08a5c` | Homepage redesign preserved in `docs/mockups/`, `DESIGN.md` + sidecar written from the built world. |
| `a30904e` … `3f01e84` | The redesign's own fix chain — font dedup (−43% file size), a Footle duplicate-letter scoring bug, the verdict CTAs rendering with zero padding, the example row stealing a guess. |

### 🔴 /footle was donating every backlink it earned — REAL, verified, fixed

**⚠️ CORRECTION.** An earlier version of this entry claimed the Footle vertical
had *zero impressions* on Google, "measured" via GSC URL parameters like
`?query=*footle*`. **That syntax does not filter** — it silently returns an
empty result for everything. Caught by running a control: `?query=*ball*`
also returned zero, while "ball iq" is the single top query with 55 clicks.
Every zero in that entry was an artifact of the method, not a finding. The
footle-specific impression count is **still unverified**.

The rule this broke is already in memory: 0% and 98% are both signals to
check the instrument. It returned zero four times before the control ran.

**What IS verified, by `curl` rather than by GSC:** `/footle` served
`<title>Ball IQ — The Ultimate Football Quiz</title>` with
`canonical → https://balliq.app/`, hardcoded in `index.html:30-31` and never
updated client-side. Every Footle link in existence points there — the in-app
share text (`App.jsx:3954`, `:5031`, `:7546`), the `/t` `/ig` `/tt` `/x`
social redirects, every authority-kit template, the AlternativeTo listing.
A page that canonicals to `/` is dropped as a duplicate, which is consistent
with Alex's URL Inspection returning *does not exist*.

Fixed in `d38b447` with an edge function (`api/footle-boot.js`): same app
shell, Footle title, `canonical → /football-wordle/`. The share flow still
boots straight into the puzzle. **Expect `/footle` to report "Duplicate,
Google chose different canonical" — that is the SUCCESS state.**

**The premise was also wrong.** "Footle" is not coined. It is an 1891 English
verb (OED) and the name of two established competitors — `footle.club` holds
four of the top ten, `foot-le.com` owns the exact-match domain in EN and FR.
Winnable targets are "ball iq footle", "football wordle", and the answer
long-tails.

`[ ]` **CLAUDE — /football-wordle/ is prose-only.** Zero `<button>`, zero
`<input>`, against competitors that ARE the game. The playable-taster pattern
from `78170c6` reached ~120 club pages and never reached this one.
`buildFootlePage()`, `scripts/gen-seo-pages.mjs:2731`.

`[ ]` **ALEX — the GSC numbers I could not get.** The URL-param filters do not
work and the in-table filter would not apply for me either. Needed from the UI:
Performance → Queries → filter *contains* "footle", and URL Inspection on
`/footle` and `/football-wordle/`. Zero impressions and position-90 look
identical from outside; only that report tells them apart.

### 🟡 What the GSC query table actually says

Verified 28-day totals (5 Jul – 1 Aug): **311 clicks, 20k impressions,
1.6% CTR, position 20.9, 1,000 distinct queries.** Clicks and impressions both
climb sharply from ~23 July.

| query | clicks | impressions | CTR |
|---|---|---|---|
| ball iq | 55 | 205 | 26.8% |
| everton quiz | 7 | 48 | **14.6%** |
| arsenal quiz | 4 | **335** | **1.2%** |
| rangers quiz **with answers** | 4 | 13 | **30.8%** |
| rangers quiz | 3 | 54 | 5.6% |
| liverpool quiz **with answers** | 3 | 42 | 7.1% |
| tottenham quiz **with answers** | 3 | 20 | **15.0%** |
| tottenham quiz | 2 | 65 | 3.1% |
| real madrid quiz | 2 | 101 | 2.0% |
| football quiz | 2 | 86 | 2.3% |

**"with answers" converts 3–5× better than the bare club term** — Rangers
30.8% vs 5.6%, Tottenham 15.0% vs 3.1%. That is people explicitly searching
for the thing this product is built on, and we rank far better for it. It is
the strongest unexploited signal in the whole account.

Arsenal draws 7.5× Everton's impressions and 40% fewer clicks — a 12× CTR gap
on the same template. That is position, not titles. **The big-club terms inflate
impressions and crush average CTR while delivering almost nothing; the smaller
clubs are where the winnable traffic is** — which is exactly the moat the
product already has. Overall: 11.4k impressions, 161 clicks, position 20.5.

### 🟡 Homepage redesign — "The Scouting Report"

Direction assigned by dice (`concept-seed`, seed `cf2f8891`, candidate 4 of 7).
Files in `docs/mockups/`; `scouting-d.html` is current and reproducible from
`scouting-c.html` via the patch chain. All 19 impeccable commands have run;
detector exit 0. **Not yet ported to `MarketingHome.jsx`.**

`[ ]` **CLAUDE — the club band should carry the link mesh it dropped.**
114 of 126 live `/quiz/` pages are unlinked from the new page (the old one
linked 82). Same twelve rows, better contents: smaller clubs + competitions +
players, per the CTR data above.

`[ ]` **CLAUDE — multiplayer appears nowhere on the new page.** Up to 8 online,
live scores, podium, rematch — verified in `MultiplayerCard.jsx:54`. One clause
at the verdict, not a band.

`[ ]` **CLAUDE — the Daily 7 has no door.** Named in prose beside the countdown,
linked nowhere, and no `?game=daily` deep link exists (`App.jsx:9085` handles
only `footle`/`trail`).

`[ ]` **CLAUDE — `ANSWER = 'ALISSON'` is hardcoded** under a clock promising a
new surname at midnight. Ships as a lie on day 2.

`[ ]` **CLAUDE — the strongest unclaimed line on the page.** Two app-exclusive
truths, both verified: the web carries AdSense and the app declares none, and
`lib/notifications.js` nudges at 7pm with a 30-day win-back tail, native-only.
Current download argument ("a report nobody keeps") is not app-exclusive —
`/play` remembers you too.

### ⛔ DO NOT put Transfer Trail on the homepage
`TRAIL_ANCHOR_DAY = 20697` = **2026-09-01**. `getTrailAnswerForDayIndex`
returns `null` for every date until then. It shipped `b23b489`, was reverted
the same hour, rebuilt still dark. Advertising it would be a false claim.

---

## 2026-07-30 (evening state)

Per this file's own rule, completed detail is deleted rather than archived —
git history is the archive. What follows is only what is still true or still open.

### Shipped this session — all pushed to main, all live

| commit | what |
|---|---|
| `5cb8655` | **Hajduk Split** — 15 verified questions, 72nd club page. Croatia now has its own league section. |
| `03f469f` | **Hub title stopped splitting "football quiz."** It read `Football (Soccer) Quiz` — the parenthetical broke the exact phrase on the ONE page targeting our best term, and it was there for the US-localisation thesis we later disproved. Description 187 → 153 (it was truncating). |
| `68ec74c` | **Android R8 on.** AAB 7.63 → 6.50 MB (−14.8%). Capacitor registers all 17 plugins by reflection, so this needed full keep rules; verified by DEX-diffing both bundles — 15 plugin classes before, 15 after, empty difference. |
| `ccdb960` | **Site-wide SERP sweep.** 31 truncated titles → 0, 46 truncated descriptions → 0, across 190 pages. Almost all of it was `/lists`, which shipped after the last truncation pass and never inherited the rule. |
| `1e531b3` | **Build gate** (`scripts/audit-serp-meta.mjs`) so truncation cannot return a third time. Proved by reinjecting the original bug. |
| `4d7c25a` | **Trail wave M.** 38 → 44 careers. Found a real bug: the old schedule's minimum recurrence gap was **1** — the same answer could land two days running. Now 14 days minimum. |
| `53891cb` | Backlink submission pack + session handoff docs. |

Earlier the same day: the question-report loop (which had **never** delivered a
single report in the app's entire life), the MP card dead click, the persistent
iOS zoom, club picker search over 72 packs, PRL → EPL.

### 🔴 ALEX — blocking, in priority order

1. ✅ **DONE — R8 + edge-to-edge VERIFIED on an emulator (2026-07-30).**
   Built an Android emulator on this Mac (AVD `balliq_r8`, Pixel 7, API 36) and
   ran the minified build on it. Capacitor bridge starts, onboarding→Home works,
   storage persists, splash dismisses, status bar correct, **zero**
   FATAL/ClassNotFound/NoClassDefFound. Edge-to-edge verified on **3-button nav**
   — the exact risky config — tab bar sits clear of the nav buttons.
   ⚠️ One false alarm: the first run ANR'd under `-gpu swiftshader_indirect`.
   That was the emulator (system-server disk I/O, load 4.23), not the app —
   `-gpu host` reproduced the identical tap with no ANR. Always A/B the GPU flag.
   **→ `~/Downloads/balliq-1.4.1-vc10-r8.aab` IS SAFE TO UPLOAD.**
2. **Spot-check the 6 new Trail careers** before 2026-09-01 — van Dijk,
   Courtois, Griezmann, De Bruyne, Son, Lewandowski. The spec requires 100%
   human review; a wrong club order is unfalsifiable to the player.
3. **Tap "⚑ Report a problem" once on a device.** The loop is fixed everywhere
   but has still never delivered one real report end to end.
4. **Directory submissions** — `docs/BACKLINK-SUBMISSIONS.md`. Four are
   genuinely open (verified by fetching each site, see below).
5. **Say yes/no to a ~1.5 GB Android SDK download** so an emulator exists. No
   AVDs and no `sdkmanager` are installed, so there is currently no way to test
   Android locally.

### Directory status — CHECKED, not assumed (2026-07-30)

Alex thought these were already done. Fetched each site and searched it:

| directory | listed? |
|---|---|
| adoryvo daily-games list | ✅ **already there** — Sports section, marked 🆕, good description |
| listdle.com | ❌ not listed (and it *does* carry football games — we are absent from an on-target directory) |
| dailydle.org | ❌ not listed |
| likewordle.com | ❌ not listed |
| wordly.org | ❌ not listed |

Already done and NOT to be repeated: Product Hunt (~2026-07-09), AlternativeTo
(2026-07-13). `playfootball.games` stays dropped — verified as a direct
competitor with no submission path.

⚠️ **Small finding:** the adoryvo listing points at `balliq.app/footle`, which
is the SPA boot alias and serves the generic `<title>`, not the `/football-wordle`
landing page. Left alone deliberately — `/footle` is the short share URL in every
share text and all four social redirects, and it drops users straight into the
puzzle, which the "playable beats readable" finding says converts better. If we
ever want the link equity on the landing page instead, ask the maintainer to
switch the URL; do **not** redirect `/footle`.

## 🚀 1.4.0 IS IN FLIGHT ON BOTH STORES (2026-07-30, ~01:00)

- **Android:** versionCode 9 / 1.4.0 — **SUBMITTED, under review, 100% rollout,
  all targeted countries.** Previous live build was 6 (1.3.3), 11 active
  installs. Publishing this also clears Play's Android-16/API-36 warning (the
  bump was already in the bundle; the flag was against 1.3.3).
- **iOS:** build 51 / 1.4.0 — submitted for review.
- Store copy updated on both: question/club COUNTS REMOVED from the App Store
  promo text and description (Alex: a raw count is a codebase stat, not a reason
  to download — and both were stale anyway, saying 5,800/50+ when the real
  figures were 6,394/71). Keywords taken to exactly 100/100 by adding `quiz` and
  `daily`, with zero overlap against the app name.
- ⚠️ **The release notes nearly shipped a false claim.** The existing draft said
  "Rematch now invites your opponent instead of leaving you alone" — written
  before we knew `send_play_invite` raises `not friends`. For a link-joined
  opponent it notifies nobody. Replaced with "Rematch tells you whether your
  opponent was notified." Check release notes against what the code ACTUALLY
  does, not against what the last sprint intended.
- ⚠️ **Play Console UI trap:** after clicking "Send N endringer til gjennomgang",
  the button at that exact position becomes **"Opphev endringene"** (revoke), and
  a confirm dialog opened over the fresh submission. Answer "Ikke fjern". Do not
  click twice in that spot.
- Screenshots deliberately NOT refreshed. Alex: shipping the better build now
  beats holding it days for cosmetics. Friend is doing them separately.

### ❌ RETRACTED — this section was WRONG (corrected 2026-07-30 evening)

It used to read: *"Play's warning is generic advice, not a symptom. No Android
layout bug."* **There was an Android layout bug**, and this note would have told
the next session not to look for it.

What the reasoning got right: `viewport-fit=cover` is present and 16
`safe-area-inset` usages exist. What it got wrong: it inferred from *some*
surfaces handling insets that *all* did. `.quiz-wrap` had a flat
`padding-bottom:16px`, so on Android three-button nav the last element of a quiz
— the report chip — rendered under the system bar. Fixed in `93f4edb`.

**The lesson: a survey of the code is not a test of the screen.** The bug was
found by running the app on a device and looking, in about two minutes, after
reading the CSS had produced a confident all-clear. Never write "do not
re-audit" on the strength of a read-through alone.

---

## Branch `upgrade/capacitor-8` — unblocked, NOT merged

Capacitor 6.2.1 → 8, AGP 8.2.1 → 8.13.2, Gradle 8.14.3, minSdk 22 → 23.
Builds, runs, 15/15 plugin classes survive R8, 92 tests pass.

**The one regression is fixed** (`4f8aa7f`). Under Capacitor 8 the status and
navigation bars rendered WHITE, framing the app in a border. Cause: the theme
inherited `Theme.AppCompat.DayNight`, which was always wrong — Ball IQ has zero
`prefers-color-scheme` rules — but Capacitor 6 called
`StatusBar.setBackgroundColor("#0A0A0A")` on every launch and painted over it.
Capacitor 8 removes that path (`Window.setStatusBarColor` is deprecated in
Android 15 — the very API Play flagged), so the light variant surfaced.

Fixed in `styles.xml` at the cause: dark parent, transparent bars,
`windowLight*=false`, and the window background pinned to `@color/biqBackground`
(#0A0A0A). That last piece came from **measuring pixels**, not reasoning — with
the bars transparent they sampled #303030, exactly AppCompat dark's
`colorBackground` showing through. An `enforce*Contrast` opt-out was tried first,
measured as a no-op, and left out.

Verified on the `balliq_r8` emulator (`-gpu host`, API 36), release APK with R8
on, in **both** system light and dark mode: bars sample #0A0A0A, pixel-identical
to Capacitor 6 on main. ⚠️ This regression passed every automated check. It was
only ever visible in a screenshot — same lesson as the retracted section above.

**Still to do before merge:** the iOS side is untouched and needs its own build
and review; retest AGP 9 once this lands (it was blocked by Capacitor 6's own
`build.gradle`). Main is unaffected and still on Capacitor 6.2.1.

## ❌ `@vercel/og` → 1.0.0: DO NOT. 1.0.0 is OLDER than 0.11.1

Recommended in error and reverted the same evening. **`1.0.0` was published
2023-01-09; `0.11.1` was published 2026-03-05.** The npm `latest` tag is
**0.11.1** — we are already on the newest release. 1.0.0 is a stray old version
that sorts highest under semver, and installing it broke all five OG cards
(`ERR_MODULE_NOT_FOUND: wbg`, from a 2022-era `satori 0.0.46` tree).

The advisory that prompted it — sharp/libvips CVEs — **cannot be upgraded away
and does not apply to us.** `api/og.js` is `runtime: 'edge'`, and sharp has
**0 references in `dist/index.edge.js`** (8 in the node build we never deploy).

Rule this establishes: **a higher version number is not proof of a newer
release.** Check `npm view <pkg> dist-tags` and the publish date before treating
a bump as an upgrade. Harness for re-testing the cards lives in the session
scratchpad as `og-render.mjs` — it renders all five variants and asserts the PNG
magic bytes; byte sizes on 0.11.1 are 99908 / 75623 / 60902 / 58125 / 58736.

---

## THE NUMBER THAT MATTERS

**97.2% new users · 2.8% returning · four people came back.** (Clarity, 3 days.)

Everything divides on that line. Content waves grow the 141 arriving; only the
daily loop grows the 4 returning. Given two tasks, prefer the one that moves the
second number — we are already good at the first.

Second fact, GSC 2026-07-29: **the US and Egypt are NOT a localisation gap.**
Egypt's 22 clicks are 22 brand searches for "ball iq"; the US searches in plain
English. That thesis is dead — see `project_us_egypt_gsc_2026_07_29` in memory.
Do not rebuild the "soccer layer".

---

## 🔴 NOW — in priority order

### 📱 ANDROID: 1.4.1 IS LIVE. The four Play flags, and what each actually needs

**1.4.1 / vc10 published 2026-07-30** — 177 regions, 11 installs. ⚡ Google
reviewed it in MINUTES; a revoke attempted minutes later failed with "already
reviewed". **Plan Android releases as if there is no take-back window.**

Play's release analysis raises 4 items against 10 (1.4.1). Read at source:

| # | Play says | What it actually is | Cost |
|---|---|---|---|
| 1 | Edge-to-edge may not work for all users | **Our bug.** The report chip rendered under the nav bar. Found independently on the emulator. | ✅ **FIXED** in vc12 |
| 2 | Deprecated fullscreen APIs | `Window.get/setStatusBarColor`, called from `com.capacitorjs.plugins.statusbar.StatusBar`. **Not our code.** `@capacitor/status-bar` 6.0.3 IS the newest 6.x — no patch exists. | **Capacitor 7 migration** (core + android + ios + cli + 13 plugins) |
| 3 | Optimise bitmap images | 50 PNGs, 6.0 MB in `android/app/src/main/res`. Convert to WebP. | Low risk, do with #2 |
| 4 | R8 config → higher memory | ⚠️ NOT "enable R8" — **our R8 registered fine.** It wants **AGP ≥ 9.0**; we are on **8.2.1**. **TESTED 2026-07-31: AGP 9 is BLOCKED BY CAPACITOR 6** — see below. | gated behind #2 |

#### ✅ TESTED, not assumed: AGP 9 cannot be taken on its own

Tried it rather than guessing (git was clean, reverted after). Two builds, two
answers:

1. AGP 9.3.1 + Gradle 9.1.0 → *"Minimum supported Gradle version is 9.5.0"*. Fixable.
2. AGP 9.3.1 + Gradle 9.5.0 → fails in
   **`node_modules/@capacitor/android/capacitor/build.gradle` line 57**:
   *"`getDefaultProguardFile('proguard-android.txt')` is no longer supported since
   it includes `-dontoptimize`"*.

**The blocker is inside Capacitor 6's own build file, not ours.** (Our
`app/build.gradle` already uses `proguard-android-optimize.txt` — that changed
when R8 went on in 68ec74c.) It cannot be fixed without editing `node_modules`,
which any `npm install` wipes.

So the dependency chain is now **proven, not assumed**:
**AGP 9 ← requires Capacitor 7 ← which also fixes the deprecated StatusBar APIs.**
Flags #2 and #4 are therefore ONE job, and Capacitor 7 is the entry point. Do not
attempt AGP separately; it will fail the same way.

Toolchain facts for whoever picks this up: JDK 21 is already available (Android
Studio's bundled JBR), AGP 9.x latest is 9.3.1, and AGP 9.3.1 requires Gradle ≥ 9.5.0.

**None of 2–4 is a defect.** They are deprecation and toolchain recommendations;
the app works. Only #1 was a real user-facing bug, and it is fixed.

### THE PLAN (agreed shape — ship the fix, then upgrade deliberately)

**1.4.2 / vc12 — NOW.** Carries only the nav-bar inset fix. Built and staged at
`~/Downloads/balliq-1.4.2-vc12.aab`. Resolves flag #1, the only one users feel.

**1.5.0 — a dedicated platform-upgrade release.** Capacitor 6 → 7, AGP 8.2.1 → 9.x,
Gradle to match, PNG → WebP. Clears flags #2, #3, #4 together. This is a real
migration touching every native plugin and both platform projects.
⚠️ Do NOT bundle it into a same-day patch — and now that we know Play publishes
in minutes, there is no window to catch a regression after the fact. Test it on
the `balliq_r8` emulator first (see [[reference_android_emulator]]).


### ⚠️ NEW 2026-07-30 — ALEX: AdSense is DORMANT on ~175 pages (one line)

Found by a real Chrome performance trace on `/quiz/`: AdSense never appeared in
the third-party list. It isn't a bug — `AD_SLOTS` in `gen-seo-pages.mjs` has zero
active entries, the slot ids are commented out, so `ADS_ENABLED = false` and the
gate emits neither units nor loader on ANY generated page.

    // afterQA: '4505987680', afterFaq: '4505987680', listInline: '4505987680',

**10 `ads: true` call sites cover ~175 live pages** — club, player, category,
nation, lists, study. Our highest-traffic pages, the ones GSC shows converting.
Earning zero. (Only `dist/index.html` loads the ad library, and it is correctly
native-guarded.)

The disable was deliberate and the reasoning was right: *"DORMANT until AdSense is
confirmed SERVING, so no empty ad boxes render before ads fill."*

**ALEX — this is one check:** open AdSense → Nettsteder. Does balliq.app show
approved / "Klar"? If yes, uncomment that line, rebuild, ship. If no, leave it —
the current state is correct. This is the open half of the AdSense task and has
been waiting since 2026-07-20.

### ✅ 2026-07-30 — performance audit: NOTHING TO FIX

Real Chrome trace + Lighthouse on `/quiz/`, mobile, **Slow 4G + 4× CPU throttle**:

| metric | result | threshold |
|---|---|---|
| LCP | **1,330 ms** | good ≤ 2,500 |
| CLS | **0.00** | good ≤ 0.1 |
| TTFB | 36 ms | — |
| Lighthouse a11y / best-practices / SEO / agentic | **100 / 100 / 100 / 100** | 49 passed, 0 failed |
| DOM | 420 elements, depth 8 | small |
| 3rd parties | Clarity only, 1.4 kB / 143 ms | — |

Largest single cost is style recalc (409 ms) — but that is at 4× throttle, so
~100 ms real. **No optimisation work is warranted.** Recording this so nobody
re-runs it: the pages are fast, and the audit's value was finding the AdSense
gap, not a perf problem.

⚠️ Correction for the record: I briefly claimed the generated pages were
render-blocked by Google Fonts. They are not — a truncated grep hid
`media="print" onload="this.media='all'"`. Both `index.html` and the generator
use the non-blocking pattern.


### 1. ~~CLAUDE · Localised club pages~~ — **TWO PILOTS LIVE 2026-07-29**
- `/es/quiz/boca-juniors/` (7e4b584) — Spanish
- `/pt/quiz/flamengo/` (5a58437) — Brazilian Portuguese

Both **verified live by static `<title>`**, reciprocal hreflang on both halves,
per-slug clusters (Boca advertises `es` only, Flamengo `pt` only), both in the
sitemap. 22 questions each, translated from our own verified sets and keyed by
the English question `id`, so neither page asserts a new fact and two build
guards fail loudly if an original moves. Both guards proven by breaking them.

⚠️ **Wave L is mostly BRAZILIAN, which the Spanish page alone missed.** Boca and
River are Argentine; Corinthians, Flamengo and Palmeiras are Brazilian. That is
why there are two pilots and not one — separate languages, separate search
markets, separate competition.

**MEASURE BEFORE SCALING.** Still unbuilt on purpose: River Plate (es),
Corinthians + Palmeiras (pt), and the other 69 clubs. Check GSC for both URLs
in ~2-3 weeks — impressions AND whether they convert. A third language is now a
data file plus a spread (`scripts/seo/clubs-<lang>.mjs`), so scaling is cheap
once the answer is in.

⚠️ **What a reader actually gets today:** the PAGE is fully playable in their
language (taster + Q&A + explanations, 22 questions). The APP is still English,
and both FAQs say so. If the bounce lands on that FAQ, the answer to "should we
localise?" is "not before the app is".

Further clubs: `scripts/seo/leagues.mjs` maps 356, we have 71. **Saturation
finding from the tier-1 top-up: 75% of rejections were duplicates.** Chelsea and
Man Utd are full; Dortmund had room. Check saturation before commissioning.

### 2. ~~CLAUDE · MP results screen~~ — **the visual half was already done**
This item was STALE: `a74fe9d` (podium, count-up, entrance choreography) and
`f1da201` (1v1 winner crown) had already shipped the VS board, margin line and
head-to-head chip. Classic orientation trap — checked before building.

The real gap was underneath it: **online multiplayer awarded no XP at all**,
the only mode outside the level economy, so the ending looked good and meant
nothing. Fixed in `2938c5c` — `getMpXP(won, score) = max(15, score*10 + 50 if
won)`, paid from the once-per-room ended effect, shown as "+N XP earned ⚡" like
every other result screen. **Not device-verified** — needs two live clients.

### 3. ALEX · 2-device MP test
Now unblocks three things, not one: the stall watchdog, the MP stats write, and
the new MP XP award. A green build proves compilation, not behaviour.

---

## 🟡 QUEUED

### NEW 2026-07-30 — website facelift: tooling + the traps

**What we already have** (no install needed, all connected):
- `ui-ux-pro-max` — LOCAL skill, verified working. 84 styles, 192 palettes, 74
  font pairings, **16 GSAP motion presets** with framework notes, do/don't and
  performance caveats. Run it as
  `python .claude/skills/ui-ux-pro-max/scripts/search.py "<q>" --domain gsap`.
  Also `--design-system --persist` writes a MASTER.md the whole facelift works from.
- `frontend-design` + `artifact-design` skills — art direction, anti-AI-slop rules.
- `design-critique` + `accessibility-review` skills — structured review passes.
- **Magic Patterns** (AI UI generation) and **Canva** MCPs — both connected.
- claude.ai **design-system** tools (`create_design_system`, `create_inspiration_document`).
- **Chrome ×2** for pulling reference sites, **iOS Simulator** for visual checks.

**ADDED 2026-07-30 — both verified by probing their tool lists, not by "Connected"**
- `magicui` — `npx -y @magicuidesign/mcp` · 3 tools (listRegistryItems,
  getRegistryItem, searchRegistryItems). Animated React components.
- `shadcn` — `npx -y shadcn@latest mcp` · 7 tools (search/view/examples/add-command
  /audit-checklist across registries).

**Figma Dev Mode MCP: BLOCKED — and on reflection, SKIP IT FOR NOW.**

Pricing checked at source 2026-07-30: Professional **Full seat $16/mo**, Dev seat
$12/mo. A Dev seat gets Dev Mode and the MCP but can only *view/comment* in
Design, so a solo dev who both designs and codes needs **Full**. Starter is free
but has no Dev Mode.

The money is trivial. The reason to skip is **sequencing**: the MCP reads an
*existing* design file, and there are zero Ball IQ designs in Figma. So the real
cost is learning Figma and designing every screen first — and the generated code
would still need heavy rework against plain CSS plus the standalone mirror.
**Zero-cost test:** design one screen on the free tier and see whether
designing-before-coding suits how Alex actually works. If it does, $16 is an easy
yes.

Mechanically it is also blocked right now: the server runs
locally out of the Figma desktop app — `Figma.app is NOT installed` and
`127.0.0.1:3845/mcp` answers nothing. Needs Alex to install Figma desktop, enable
the Dev Mode MCP server, and hold a Professional+ plan. Skipped TouchDesigner,
Framer, Webflow, Penpot, MasterGo — none match this stack.

### ⚠️ THE FINDING THAT MATTERS MORE THAN THE SERVERS

Ball IQ is **plain CSS** — `src/app.css`. Checked package.json: no Tailwind, no
shadcn, no Radix, no styled-components, no Framer Motion, **no GSAP**.

The entire modern design-tooling ecosystem assumes Tailwind:
- **6 of shadcn MCP's 7 tools refuse to run without `components.json`.** We have
  none. As things stand that server is inert here.
- **Magic UI ships React + Tailwind components.** Its three tools still work as a
  reference/inspiration source, but nothing can be pasted in as-is.
- **The 16 GSAP motion presets in `ui-ux-pro-max` are GSAP snippets** — using them
  means taking on GSAP as a dependency, and SplitText is a paid Club plugin.

So the facelift's real first decision is not which MCP to install, it is:
**adopt Tailwind (+ maybe GSAP), or stay on hand-written CSS and use these servers
purely as inspiration?** Adopting Tailwind on an 11.5k-line App.jsx with a
155-rule `!important` standalone mirror is a big, risky migration — and the mirror
is exactly the thing that has already broken installed PWAs once. Decide this
BEFORE any component work, not during.

**⚠️ THE TRAPS — a facelift here is not just CSS**
1. **The standalone CSS mirror.** `app.css` carries a
   `@media (display-mode: standalone)` block of ~155 `!important` rules that
   re-styles what the ≥1024px desktop reflow changes. **Any token or class the
   facelift touches must be checked against the mirror AND against `index.html`'s
   `html.native-app` killswitch.** Miss it and installed PWAs plus the native app
   keep the old styling — this has already happened once.
2. **A single element commonly has hooks in FOUR places:** the component, the base
   rule, the desktop reflow, and the mirror.
3. **`webDir: "dist"` means everything built for web ships inside the native app.**
   Any new font, script or asset is bundled whether it renders there or not, and a
   raw third-party `<script src>` silently falsifies the store privacy declaration.
   Native-guard it in code, not in a comment.
4. **Don't break `/footle`.** It is the short share alias in every share text and
   all four social redirects.
5. Marketing `/` keeps the "Both" hero (Footle + quiz) — Alex's standing call.


### NEW 2026-07-30 — raise explanation coverage (77.6% → higher)
Measured: 4,970 of 6,402 MCQs carry an explanation. All 72 **club** packs are at
100% (the generator's MIN_HINTS gate has been quietly enforcing it) — the gap is
entirely in the older category banks that predate the gate:

    WorldCup 54% (631) · Euros 56% (192) · PL 61% (558) · Bundesliga 64% (281)
    SerieA 68% (320) · LaLiga 74% (365) · UCL 74% (593) · Managers 80%
    Records 82% · Legends 84% · Ligue1 95% · History 96%
    100%: Transfers, chaos, SuperLig, Primeira, ChampionsLeague

Copy has been made honest in the meantime ("most answers explained"). **The prize
is earning the sentence back**: at 100% we can truthfully say "every answer
explained" everywhere, which is the product's whole pitch. Club pages already do.

Additive work — the answers are verified, only the explanation is missing — so
much cheaper and lower-risk than forging new questions. World Cup first (~290
missing, biggest category and a top-traffic page).

⚠️ Do NOT chase 100% mechanically. "Which club plays at Anfield?" needs no
explanation, and forcing one produces filler, which is where fabrication starts.
Target is "every question that benefits from one".

### NEW 2026-07-30 — performance + bug audit (Alex asked; overdue)
Genuinely overdue. But run it as **measurement, not reading**: a real Lighthouse
pass, actual bundle numbers, live Sentry, prod queries. Today's evidence is
blunt — every real defect came from executing something (calling
`report_question()` against prod, diffing the DEX, decoding HTML entities before
measuring), while broad read-everything sweeps produced noise. And convert each
finding into a **gate**, like the SERP one; gates have a far better track record
here than repeat sweeps.

### NEW 2026-07-30 — more clubs? Top up the thin ones first
72 packs live. Breadth is not the constraint — **repetition is.** A ~40-question
pack with 10-question sessions and a 14-day seen-filter gives a club fan roughly
4 fresh plays before repeats start. Fixing the five thin packs beats adding
club 73.


- **CLAUDE** · New game modes. Trail is OUT (live 2026-07-29). Judge later
  candidates on what actually mattered in the Trail decision: can it ship with a
  FROZEN zero-maintenance schedule (Footle's real advantage), and is its share
  card spoiler-free? A mode needing per-puzzle curation forever is a liability.
  `docs/transfer-trail-spec.md` §7 has the scoring that killed CHAIN despite it
  winning on cleverness.
- **CLAUDE** · Push US quiz-intent queries page 2 → 1: `arsenal quiz` 14.9,
  `arsenal quizzes` 19.3, `premier league quizzes` 26.7. These are the only US
  queries where a click is possible at all — the Gold Cup cluster ranks 8-10
  with ZERO clicks because Google answers those in the SERP itself.
- **ALEX** · Submit 1.4.0. iOS build 51 + Android versionCode 9 passed preflight
  earlier today, but ⚠️ they now predate a lot: one-screen onboarding, the
  rating-prompt fixes, the Footle explainer removal, the invite feedback and MP
  XP all landed after. Re-sync before archiving:
  `rm -rf dist && npm run build && npx cap sync ios && node scripts/prune-native-web-assets.mjs`
  then `node scripts/preflight-release.mjs` (it checks the native bundle really
  matches source — the thing that nearly shipped Trail early).
  ⚠️ `npx cap sync ios` currently fails at the **pod install** step on this Mac
  (a Ruby/CocoaPods problem, not ours). `cap copy` still succeeds, so the web
  bundle syncs correctly and builds are fine — but a NEW native plugin would not
  install until that is fixed.
- **CLAUDE/ALEX** · App Store screenshots. `screenshots/apple/` and
  `screenshots/android/` exist. Method agreed: seed REAL state in the simulator
  (set a name, play a Footle and a Daily 7 so streak and rating are genuine).
  Never composite — both stores treat a fabricated screenshot as
  misrepresentation. iPhone 17 Pro Max shoots at 1320×2868, exactly the 6.9"
  requirement.
  - **Footle frame: shoot on or after 2026-07-30.** Footle #87 (today) is RICE,
    four letters, and a 4-wide grid is the thing Alex specifically does not want
    in the listing. #88 onward are all 5-8.
  - ⚠️ **Android is BLOCKED**: no AVD and no system image on this Mac. Either
    download a system image (~1.5GB) and create an AVD, or shoot on Alex's
    physical Android. Do NOT put iOS shots in the Play listing.
- **ALEX** · Clarity AI-bot tracking (2 clicks) + Bing Webmaster Tools (needs
  your sign-in). Bot tracking tells us whether AI crawlers actually reach the
  `/lists` pages we built as an AI-answer surface — currently unknowable.
- **CLAUDE** · CSP: flip Report-Only → enforce, but only after a clean window.
  The policy was corrected 2026-07-29; as written before, enforcing would have
  killed Apple Sign-In, every webfont, Clarity's beacon and the avatar cropper.

---

## ⚪ ALEX-GATED — no Claude action possible

- Authority/backlinks: directory sweep, Discord, Launchpadly. **The measured
  ceiling is authority, not on-page.** No duplicates — some is already done.
- Reddit: link posts are filtered (14 link karma). Comment first, 1-2 weeks.
- TikTok: the largest platform Ball IQ is absent from.
- Footle web push: blocked on your VAPID secrets. Native half already shipped.
- Android R8 + edge-to-edge: needs a real device. Do NOT enable R8 blind —
  `proguard-rules.pro` is empty and Capacitor relies on reflection.
- Monetization checkpoint at ~10k sessions/mo. Nowhere near it.

---

## 🔬 CLUB-PER-MARKET RESEARCH — first real data, 2026-07-29

Alex, correctly: *"i actually do not know what clubs people from indonesia
actually support, this is research we have to do."* Right, and my prior was
WRONG. Google Trends, Indonesia, past 12 months, average search interest:

| Club | Interest |
|---|---|
| **Arsenal** | **24** |
| Liverpool | 18 |
| Chelsea | 17 |
| Manchester United | **9** |

**United came LAST, by 2.7×** — and United is the club I had just built the
Indonesian page for. Assumption beaten by ten minutes of Trends.

⚠️ **Read the caveat before acting on it.** These are raw search TERMS and three
of the four are homonyms in Indonesia: "arsenal" is a common noun, "Liverpool" a
city, and **"Chelsea" is a very common Indonesian given name** (Chelsea Islan,
Chelsea Olivia). Only "Manchester United" is unambiguous — so United's 9 is
clean while the other three are inflated by non-football searches.

Two follow-ups, and the second one matters more:
- Re-running with unambiguous forms ("Man United", "Arsenal FC", "Liverpool FC")
  returned **too little volume to chart**. That is itself a finding: Indonesian
  searchers use the PLAIN club name, so the raw comparison is closer to the real
  query set than the confound suggests — but it also means ranking for
  "arsenal" in Indonesia means competing with every non-football meaning.
- **The query that actually matters is quiz-intent, not club-name**: "kuis
  Arsenal", "kuis Liverpool". Low individual volume, but it is what we would
  actually rank for. Check those before picking the next club.

**Practical call:** keep `/id/quiz/manchester-united/` — it is live, cost nothing
and is a clean control. Add Arsenal or Liverpool as the second Indonesian page,
because that is where the demand is.

### Method to reuse for every other market
`trends.google.com/trends/explore?date=today%2012-m&geo=<CC>&q=<club>,<club>,…`
Compare 4 clubs at a time, note homonyms in the local language, then sanity-check
with a quiz-intent query. **Do this BEFORE writing 22 questions**, not after.

### Priors still UNTESTED — do not build on these until Trends confirms
The selection logic for Asia is NOT "biggest global brand", which is why the
Indonesia result was a surprise. Per-market hooks worth testing:
- **Korea → Tottenham** (Son Heung-min). In bank, 42 Qs.
- **Thailand → Leicester** (King Power is Thai-owned). ⚠️ **NOT IN THE BANK** —
  needs a pack forged before a Thai page is even possible.
- **Japan → clubs with Japanese-player history**: United (Kagawa), Celtic
  (Nakamura), Brighton (Mitoma), Arsenal, Liverpool. All in bank.
- **Vietnam / HK / Taiwan → Premier League giants**, club TBC by Trends.
- **India → SKIP.** Fans are real but search in ENGLISH; the existing English
  pages already serve them. Same shape as the dead US thesis.
- **Mainland China → SKIP.** Baidu rules and an ICP licence effectively gates
  ranking; the app CTA also dead-ends (no Google Play). The reachable Chinese
  opportunity is **zh-Hant for HK/TW/SG/MY**, which are Google markets.

---

## 🌍 LOCALISATION STRATEGY (Alex's call, 2026-07-29) — both languages, always

**The model: a localised page is ADDITIVE, never a replacement.** Every club
keeps its English page at `/quiz/<slug>/`; the twin lives at
`/<lang>/quiz/<slug>/` and they point at each other via hreflang. Real Madrid
gets English AND Spanish, because both audiences are real and
"real madrid quiz" and "quiz del Real Madrid" are different queries with
different competition. Alex is right about this and the generator already does it.

**32 clubs are localisable TODAY** with questions already verified in the bank:

| Lang | Clubs we already have |
|---|---|
| es | Real Madrid 42 · Barcelona 42 · Atlético 49 · Sevilla 42 · Valencia 35 · Betis 39 · Boca 36 ✅ · River 38 ✅ |
| pt | Flamengo 36 ✅ · Corinthians 36 ✅ · Palmeiras 36 ✅ · Benfica 50 · Porto 38 |
| de | Bayern 43 · Dortmund 42 · Leverkusen 36 · Schalke 42 |
| it | Juventus 42 · Milan 44 · Napoli 42 · Roma 37 · Lazio 47 · Fiorentina 47 |
| tr | Galatasaray 45 · Fenerbahçe 38 · Beşiktaş 39 · Trabzonspor 45 |
| fr | Marseille 44 · Monaco 33 |
| nl | Ajax 43 · PSV 46 · Feyenoord 49 |

### ⚠️ Sequence by ENGLISH PROFICIENCY and SERP thinness — NOT fanbase size

This is the counter-intuitive part and it should drive the order. A localised
page only pays where the audience would otherwise **fail to find us**, or search
in a **thinner SERP**:

1. **Turkish (4 clubs) — likely the best opportunity in the whole table**, and
   the one nobody would guess. Fanatical audiences, lower English proficiency,
   and Turkish football-quiz SERPs are almost certainly thin. We already have all
   four Süper Lig clubs with 38-45 questions each.
2. **Portuguese + Spanish** — enormous volume, moderate competition.
3. **Italian** — decent volume, moderate proficiency.
4. **German / Dutch — LOWEST priority despite the big clubs.** Very high English
   proficiency means the incremental reach is small; those fans already find and
   read the English page. Bayern's fanbase size is a trap here.

### ⚠️ REGISTER, not just language — the trap to catch before scaling

`clubs-pt.mjs` is written in **Brazilian** Portuguese on purpose (goleiro,
técnico, zagueiro). **Benfica and Porto are European Portuguese** — writing them
in Brazilian would read as foreign to the exact Lisbon fan the page is courting.
Same split in Spanish: Boca and River are **Rioplatense** (sabés, arquero),
while Real Madrid and Barcelona need **Peninsular** (sabes, portero).

So the authoring rule is: pick the register from the CLUB's audience, not from
the language name. (hreflang stays plain `es`/`pt` per club — region codes only
become necessary if we ever localise the SAME club into two registers.)

### The gate before volume

Five pages is a clean experiment; forty is a systemic bet. And every localised
page currently dead-ends at an **English app** — which is fine as a measured
funnel leak at 5 pages and a real conversion problem at 40. The US localisation
thesis was already killed by data once (`project_us_egypt_gsc_2026_07_29`), so
the lesson is not "localisation is wrong" but "check before scaling".

**Recommended next step: ONE Turkish probe (Galatasaray), because it tests the
surprising hypothesis rather than the comfortable one.** Then read GSC on all
six and open the taps on whichever language actually converts.

---

## 🔴 FOUND 2026-07-29 LATE — Transfer Trail has NO web page

Footle has `/football-wordle/` plus `/football-wordle/answer` (the daily
traffic spigot). **Trail has nothing** — zero references in
`gen-seo-pages.mjs`, zero in the sitemap. A whole game mode with no search
surface, while its nearest sibling has two pages and a recurring one.

⚠️ **This needs a decision from Alex before it can be built, because the mode is
dark until 2026-09-01 and the anchor is still marked PROVISIONAL.** A page that
says "play today's Transfer Trail" would promise something that does not exist.

The argument for building it NOW anyway: a new URL on this domain takes weeks to
index and rank, so publishing ~5 weeks ahead means it is aged and indexed the
day Trail launches. The cost: publishing a date makes the anchor a public
commitment and it stops being provisional.

So: **Alex picks.** (a) publish now with an honest "starts 1 September" framing
and freeze the anchor for good, or (b) hold the page until launch and accept
starting from zero crawl age. Do not publish a launch date unilaterally.

---

## ⚠️ ONE DECISION WAITING ON ALEX

**Should `send_play_invite` accept "we were in the same room" as grounds to
notify?** Right now it raises `not friends` unless the two accounts are accepted
friends. That gate is correct as anti-spam — otherwise anyone could ping a
stranger by joining their room — but an online opponent normally arrives via a
shared LINK, so **the usual Rematch notifies nobody.** The client no longer
pretends otherwise (`d5e0026`: it now says "share the link to bring them back"),
but the loop still leaks at the last step. Widening it is a prod migration
touching a spam boundary, so it is Alex's call, not one to make unattended.

---

## HEALTH — verified 2026-07-29

- **Indexing is healthy.** 151 indexed / 18 not (queued + intentional
  canonicals); 56 known nine days ago. Sitemap 184 URLs, regenerating correctly,
  IndexNow pinging on prod deploys.
- **Nothing is broken.** Clean tree, tests green, zero build errors. The
  `webkit.messageHandlers` console error is NOT ours — proven in a clean room;
  it is injected by an extension or a social in-app webview.
- Bank 6,394 · 71 club pages · 25 player pages · 50 reference lists.
- ⚠️ **Transfer Trail is NOT live — this file said it was, and that was wrong.**
  Verified 2026-07-29 23:00: `TRAIL_ANCHOR_DAY = 20697` (2026-09-01) against
  today's day index 20663, so `getTrailNumber()` returns **-33**,
  `getTrailAnswer()` returns null, and the app correctly sends you home rather
  than render an empty board. The mode is DARK, exactly as the comment in
  `src/lib/trail.js` says. Built and verified, not launched.
  - Playthrough confirmed working (dev server, anchor temporarily patched then
    reverted): ladder reveals on each miss, wrong guesses strike through, club
    colours + real 3-letter codes, loans marked amber, unknown clubs fall back
    to a neutral chip, full reveal + "Got it on 3 clubs" + share.
  - 38 careers, schedule frozen 380 days. ⚠️ `TRAIL_ANCHOR_DAY` must NEVER move
    once a grid has been shared — it renumbers every share. **Repeats every 38
    days**, so forge a second roster wave before the anchor date.
  - ⚠️ **NEVER preview Trail by patching the anchor in a build that gets
    `cap sync`'d.** That is what nearly shipped Trail early this morning. Use
    the dev server + browser; the native bundle then cannot be contaminated.
    `node scripts/preflight-release.mjs` is the backstop, not the plan.
- **Profile picture is one thing now (7490c76):** upload a photo, or the Ball IQ
  ball. Emoji set removed — 6 of 108 profiles had ever used it, 10 had found the
  photo upload.
- **Onboarding is ONE screen (b4e095d).** The skill-level step wrote exactly one
  thing — `biq_settings.defaultDiff`, already in Settings, Classic-only — and
  asked people to self-assess before playing anything. Everyone starts on
  medium now, which is what skippers already got. The taster survives: it is the
  only screen between "opened the app" and "played something".
- **The rating prompt was quietly self-limiting (b4e095d).** `MAX_LIFETIME` was
  4, and `requestReview()` resolves identically whether iOS rendered the sheet
  or silently declined — so four invisible no-ops retired a user permanently,
  and the most engaged players were likeliest to burn all four on nothing. Now
  24; Apple's 3-per-365 is the real ceiling. It also used to stack the iOS
  rating card on top of our own notification sheet on a first-ever Footle solve;
  it now waits, and requires a solve on an earlier day.
  ⚠️ **Wiring is proven, DELIVERY is not.** In the Simulator and in any build
  not installed from the App Store or TestFlight, that sheet is a preview —
  tapping a star submits nothing. Only App Store Connect's ratings count can
  confirm. And it produces star RATINGS, not written reviews.
- **Footle's first-run explainer is gone (f684972).** Two of its five lines
  repeated the card you tapped to get there, two were Wordle's colour
  convention, and the fifth — "guesses must be a real footballer's surname" —
  was FALSE: `submitGuess` checks length and nothing else. Replaced with a
  legend strip above the grid that retires itself after the first guess.
- **Footle answers are 5-8 letters from #88 onward, mechanically.** All 16
  non-conforming answers are in the published past; #87 (RICE, today) is the
  last. The guard in `tests/unit/wordle-schedule.test.js` was verified by
  injecting a 4-letter future answer and watching it fail.
- **Club-page reflow DONE (94cda78).** Measured 13,953px (16.5 screens), not the
  12,200 this file claimed. "More quizzes to try" was 5,734px — 41% of the page
  and the single biggest block, for a LINK LIST. Compacted the tiles: 11,953px
  (14.2 screens), mesh -35%, all 115 links kept, 0 labels clipped. The biggest
  block on a club page is now the playable taster (39%), which is correct.
  Residual: 3 columns would save ~1,500px more but truncates club names —
  not worth degrading the anchor text.
- **Bank split SHIPPED (aca556f).** Browsing no longer loads the bank: the club
  and league pickers read a 46kB text-free index instead of 621kB, ~4× cheaper
  to parse, and the full parse now happens on real play intent rather than at
  t≈2s on Home. Watch Clarity's INP over the next few days — the fix is
  measured in V8 and reasoned about in the browser, not yet observed live.

---

## STANDING TRAPS — read before the obvious move

- **Verify by static `<title>`, never HTTP 200.** The SPA catch-all answers 200
  for any path, so 200 proves nothing about a generated page.
- **`rm -rf dist` before every `cap sync`** — sync serves a stale `dist/`
  otherwise and you debug a fix that never reached the binary.
- **A detector's first run is a hypothesis.** Three separate checks produced
  false positives on 2026-07-29 alone; 98% and 0% are both signals to check the
  method, not the code.
- **Search by content, not by planned name.** "Tottenham" found nothing because
  the bank says "Tottenham Hotspur"; three clubs were nearly re-built as missing.
- **`src/questions-index.js` is generated — never hand-edit, never reorder, never
  add question text to it.** Row order is load-bearing (the Daily 7 shuffles by
  array position, and `/c/` links assume every device agrees). It exists so
  browsing doesn't pay for playing; putting `q`/`o`/`hint` in it defeats the file.
  `npm run gen:index` regenerates; dev and build do it automatically.
- **JSON.parse on the bank makes things WORSE** — tried 2026-07-29, 779ms vs
  651ms and +286kB. The problem is volume, not encoding. Don't retry it.

---

## ⚠️ Mystery Player — data defects found on the simulator (2026-08-04, 00:35)

The mode is LIVE and the wordmark bug is fixed (`"mystery"` added to the
own-header exclusion list in App.jsx). The ALGORITHM is sound. The DATASET is
not — found by playing it, not by reading code. All unit tests pass.

Today's top 10 (answer = Kylian Mbappé, Real Madrid):

    1 Mbappé  2 Vinícius  3 Konaté  4 Mendy  5 Alan Pulido
    6 Mastantuono  7 Rodrygo  8 Alberto Abalde  9 Lunin  10 Alexander-Arnold

**Three defects, all in `scripts/fetch-squads.mjs` output:**

1. **Non-football sections are in the squads.** Alberto Abalde plays for Real
   Madrid *Baloncesto*. Same trap as Arsenal Women — Wikidata files a club's
   other sections under the same entity, and the `P21` men's filter does not
   exclude a men's basketball player. Alan Pulido has never been at Real Madrid.
   → Need a "is a association football player" constraint (P106 / sport P641),
   not just gender.

2. **`nat` is unreliable.** Rodrygo and Vinícius both come back **Spain**;
   Jobe Bellingham comes back **Ireland**. Players with multiple `P27` values
   get an arbitrary one. The `nat` scoring term is feeding on bad data.
   → Prefer national-team membership (P54 on a national side) over raw P27,
   or take the P27 with the preferred rank.

3. **Jude Bellingham is missing from the pool entirely** — a Real Madrid player
   who is one of the most guessable names in the game. Cause unknown; likely
   the `P580 >= 2015` + no-end-date filter combination. Diagnose before
   loosening anything, or the 175-player Arsenal comes back.

**Separately — a DESIGN weakness, not a bug (Alex spotted it):**

    players matching >=1 non-age attribute:  621 of 1539
    ranks 622-1539 are ordered by AGE ALONE = 918 players = 60% of the pool

With five booleans most pairs of footballers share nothing, so the bottom 60%
of the ranking is a birth-date sort. Alisson vs Mbappé scores 28.9 — pure age.
The grey "cold" band communicates it honestly, but a player comparing 900 to
1326 reads a difference that isn't there.

Proposal for Alex (do NOT ship unilaterally — item 2 is a football judgment):
  a. Partial credit, not exact-match-only: same confederation when not the same
     country; same big-five league when not the same league. Pulls most of the
     918 into a zone where the number carries signal.
  b. ⚠️ ALEX'S CALL: swap nationality above league country. Currently league
     (300) outranks nationality (220). "He's French too" is arguably a stronger
     read for a fan than "he also plays in Spain".
  c. Club stays dominant — the top 10 behaves correctly and that is where a
     real player spends their last guesses.

Bring (a)/(b) as before/after rankings, not as a shipped change.

### ✅ RESOLVED 2026-08-05 — and the real defect was worse than filed

All five items above are fixed and pushed. Two of the diagnoses in the section
above were WRONG, and the corrections matter more than the fixes:

**1. "Jude Bellingham missing" — he was never missing.** He is in the pool as
`Q66241169` under the label **"Jude Belligoal"**, which is the LIVE Wikidata
value, not a stale snapshot (alias vandalised to match). Searching our own data
for "Bellingham" found nothing, which is exactly why it read as absent.

⚠️ **The structural finding: Mystery Player renders text from a wiki anyone can
edit, with no review step, and the same strings ship inside the iOS and Android
binaries.** A football pun is the benign version of that. Footle and the Trail
both use curated name data; this mode skipped it. Now guarded by
`scripts/_name-overrides.mjs` + `scripts/fix-pool-names.mjs`, and by a unit test
that asserts a roster of household names is guessable.

**2. The career data was the big one, not the squads.** `fetch-careers.mjs` used
`wdt:P54` — the TRUTHY prefix, which returns only preferred-rank statements.
Rabiot came back as one club. 90% of scheduled answers had no career history, so
the 420-point shared-club term was dead; on the other 11% it was *corrupted*,
scoring national teams as clubs (Ben Old ranked 35, HOT GREEN, on a Chris Wood
puzzle for sharing New Zealand caps).

  national teams scored as clubs   1,894 -> 0
  answers with real career history    44 -> 384 of 400
  nationality values corrected                   404

⚠️ `fetch-squads.mjs` documents the OPPOSITE symptom of the same prefix (175
"current" Arsenal players). The rule is **rank, not recency, decides what truthy
means** — the old comment stated the half-truth and that is what made it
trustworthy-looking here.

**Label rules were tried and rejected three times, each caught by checking the
actual matches first:** `/national/` deletes Atlético Nacional, `/\bII\b/`
deletes Willem II, `/Academy/` deletes Ferenc Puskás Football Academy. All real
clubs. Exclusion is on the team's P31 CLASS, and the script prints every
excluded and kept class as an audit — which caught four classes my hand-written
pattern had missed.

**Found in passing, both fixed:**
- `gen-footle-practice.mjs` joined `["", "Volkan"]` to `" Volkan"`. 33 of the
  Footle pool are stored with an empty first-name slot (PELE, NEYMAR, RAUL,
  XAVI, CASEMIRO, VINICIUS…), so ~1 rotation in 12 shipped a leading space.
- `matchGuess` compared only the LAST name part, so every multi-word surname
  failed: "de Ligt", "van Dijk", "De Bruyne", "Di María" all matched nothing.
- `tests/unit/scoring.test.js` had been RED since the ladder extension (asserted
  "Legend" at 9999 XP). Nobody saw it because **`npm run build` runs eslint and
  the content audits but NOT vitest.** Now pinned to `LEVELS` itself.
  ⚠️ Consider adding vitest to the build chain — that is the actual gap.

**STILL OPEN — Alex's call, unchanged:** the weighting proposal (nationality 220
vs league country 300, plus partial credit for confederation). Now worth
re-measuring on the repaired data before deciding; the old numbers were taken
over corrupt inputs.

**Residual, documented not hidden:** ~370 uncapped players keep citizenship, so
an uncapped Englishman is "United Kingdom" and will not match a capped
"England". Needs place-of-birth (P19). Tolerable — the schedule is fame-weighted
and uncapped players are never the answer.

---

## 🔴 THE BOTTLENECK HAS MOVED — funnel re-measured against prod 2026-08-05

⚠️ **Supersedes "the bottleneck is activation, not distribution."** That was
true at 15%. It is not true now. Measured directly against prod.

### Activation by signup-week cohort

    Jul 06   16 signups   43.8%
    Jul 13   21 signups   33.3%   <- trough
    Jul 20   35 signups   74.3%
    Jul 27   22 signups   81.8%
    Aug 03   12 signups   66.7%   (partial week)

**The activation fix wave WORKED: 33% -> 82%.** Nobody had re-queried after
shipping it, so a successful fix went unrecognised for weeks. Re-measure after
shipping a fix; "we shipped it" is not "it worked".

### Retention is healthy too (81 players ever)

    returned on 2+ days     58 of 81   71.6%
    played on 7+ days       15
    active in last 7 days   41 of 81
    active in last 30 days  70 of 81
    average active days     4.1

### => THE CONSTRAINT IS NOW RAW SIGNUP VOLUME

~135 accounts, 20-35 signups a week. At ~80% activation and ~72% return, every
extra signup converts almost linearly. **Distribution is the lever, and it is
the one we have invested least in.**

⚠️ **MEASUREMENT TRAP — it changes the answer.** `scores` records only
survival/daily/classic/wc2026/chaos/legends. Footle, Club Quiz and League Quiz
write NOTHING to it, and Footle is the most-played mode (it lives in
`user_game_state.wordle_state`). Measuring activation from `scores` alone
undercounts by 5-11 points per cohort — it reports the latest cohort as 72.7%
when it is 81.8%. Always UNION `scores` with `user_game_state`
(wordle_state + daily_scores). The thing we measure least is what people do most.

### Priority order that follows from this (2026-08-05)

1. **Partnership pitch** — the only lever that MULTIPLIES signups rather than
   adding a page at a time, and it targets the real ceiling (authority, #51 vs
   #8). Blocked on: verifying the OneFootball + Flashscore quiz claims, and on
   Alex choosing to send. Sofascore is verified; the other two are NOT.
2. **Ship Android 1.5.0** — a whole store surface still on 1.4.1, with Mystery
   Player and Transfer Trail undelivered. iOS 1.5.0 is synced and staged behind
   1.4.0 (see the store section — do NOT withdraw 1.4.0; build 53 was never
   uploaded, so withdrawing buys nothing and costs the queue slot).
3. **Web pages for Mystery Player + Transfer Trail** — two finished games with
   no search surface. Same gap that left the Trail dark for days.
4. **Design audit across the screens** (Alex's ask). ⚠️ Refinement: activation
   is solved, so the leverage is no longer the in-app drop-off screens — it is
   the PRE-SIGNUP surface (marketing home, club pages, the path to account
   creation), because that is where the constraint now sits.
5. **Club-pack answer leaks (~17%)** — protects the 72% return rate rather than
   growing the top. Chunked verifiers structurally cannot see pair-leaks.

### ALEX WANTS (queued, not yet done)
A deeper read of these numbers and a plan to improve them further — e.g. where
the 20-35 weekly signups actually come from, and which surface converts best.
Needs a source/attribution query; `scores` will not answer it.

## Photo excellence pipeline (2026-08-10, evening — BINDING bar from Alex)
"One bad-resolution photo and nobody uses the builder twice." Rules: recent
(≤ ~1 yr), head-on, sharp, uniform face share (42%); anything less renders the
two-letter initials card, never a bad photo.
- [x] Centring bug fixed (clamped crops kept origin, drifted left/low — page + export)
- [x] `src/data/photoOverrides.json` — hand-curated last word; null = initials card
      (Lammens→Mar 2026 portrait, Cunha→Jun 2026; Mount/Heaven/Yoro→cards)
- [x] Two-letter monograms (MM/AH/LY) on page + export
- [ ] Commons FULL-TEXT SEARCH harvest — uncategorized 2025/26 match series
      (Bryan Berlin-class uploaders: per-player crops, 2800px+, CC BY-SA).
      Search by MATCH, not player: one series covers dozens of players.
- [ ] Mechanical quality gate in build-lineup-data: face px in source < threshold
      OR photo > ~1 yr old OR face unframeable at 42% → initials card
- [ ] Contact-sheet eyeball pass per club before Alex retests (judge at 64px)
- [ ] Mbeumo: occluded P18 (foreground blur) — cutout stage removes it; verify

## Scan execution log (2026-08-10, late evening — going item by item with Alex)
- [x] P0-1 split-brain homepage — VERIFIED SMALLER than scanned: prerender h1/structure
      already matched; topped up the missing Scouting-Report promise (4b40a31)
- [x] P0-2 loop instrumentation — loop-hit logs in api/c|q|join|p + Clarity loopEvent()
      at 7 share/conversion sites (276e95c). Grep Vercel logs t:"loop-hit"
- [→] P0-3 partnership pitch — kit already existed (docs/PARTNERSHIP-PITCH.md); ALEX SENDS
- [x] P1 pack-size counts scrubbed from taster hero + bq-note + print page (e840042)
- [x] P1 terrace-verdict ladder on results/share card/share text (36e1017)
- [x] P2 "a 8-letter surname" grammar (0e7af15)
- [x] (same evening, pre-scan) Ball IQ Test mode killed (e19214f)
- next: send-it-back name capture · SEO beat-my-score share · streak unification (M)
- Alex decisions pending: guess-the-XI daily (vs builder bar) · Trail in daily loop ·
  mode-sprawl measurement before thinning

## 🎯 ALEX 2026-08-11: "Guess the club by emojis" mode — approved idea, build when time allows
Emoji rebus → name the club (e.g. 🔴👹 → Man United, ⚪👑 → Real Madrid).
Natural share artifact (the rebus IS the share); pairs with the daily-hub
packaging idea from the scan. Data: hand-curated emoji strings per club —
editorial fun, zero API risk, no licence exposure. Start with the 72 packs.

- [ ] TRAIL WAVE N (careers): 45 unique careers over a 397-day schedule = each
      returns ~fortnightly for daily players. Runway fine (into late 2027);
      VARIETY is the real gap. Forge +40 careers post-kickoff, same locked
      editorial rules, extend the frozen log deliberately.

## Guess the XI — pipeline state (2026-08-11 evening)
- [x] build-xi-pool.mjs: 10 verified XIs (5 UCL finals × both teams) — PLAYERS
      verified correct (Dida/Cafu Milan, Dudek/Carragher Liverpool, etc.)
- [ ] ⚠️ club labels polluted by citation `| title =` matches — derive from the
      match infobox team1/team2 instead (table order = team order)
- [ ] WC finals + Euro use different lineup markup ("found 0 XI tables",
      dropped loudly) — needs a second parser variant
- [ ] surname field breaks on Dutch names ("van der Sar" → "Sar") — match via
      the Footle normalizer against full display instead
- [ ] my spot-check SILENTLY SKIPPED when club labels broke (if(ist) guard) —
      make it fail loud when the expected XI is absent

- [ ] CI: flip e2e continue-on-error -> strict after two green runs on main
      (the 131-failure era ended 2026-08-11: env var + 12 stale specs + the
      zombie Test tile — see 832ee3c). Also: Alex may set VITE_SUPABASE_KEY
      as a repo secret and delete the in-repo fallback if preferred.
