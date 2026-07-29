# Ball IQ — the list

**Last updated: 2026-07-29.** Single source of truth for what's in flight.
`[ ]` = open · **ALEX** = needs you · **CLAUDE** = I do it.

Claude: update this file whenever something lands, and re-read it when asked
"what's left". It exists because a chat scrollback is not a plan. Completed
items are deleted, not archived — git history is the archive.

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
