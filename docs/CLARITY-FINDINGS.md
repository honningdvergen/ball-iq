# Clarity findings

## 📅 2026-09-28 — WEEKLY READ (7 days, 09-21→09-28, bot-excluded)

First weekly run since the 07-28 baseline. ⚠️ **Two caveats frame every number
below.** (1) Clarity has been **consent-gated in Europe since 08-21**. It sees
only non-EU visitors plus EU visitors who tapped Allow. Norway now shows **2
sessions**, so our own testing no longer inflates anything. The flip side is
that the sample leans non-EU. (2) Clarity **starts a new session on the club
page → /play hop** (TODO 08-14). "Sessions" are not journeys.

### The number that matters

| | This week | Last week (09-14→21) | Baseline 07-28 |
|---|---|---|---|
| Sessions | **406** | 553 | 111 (3 days) |
| Sessions with `Play` smart event | **54 → 13.3%** | 84 → 15.2% | 6 → 5.4% |
| Clarity `SignUp` event | **0** | 1 | 2 |
| **Real sign-ups (auth.users, non-anon)** | **~11** | ~13 | — |
| Login event | 4 | 2 | — |
| Pages / session | 1.68 | — | 1.05 |
| Returning | **6.9%** | — | 2.7% |
| Active time / scroll | 124s / 30.7% | — | 1.6 min / 50% |

- **Play rate is flat week on week.** 13.3% vs 15.2% is inside the noise at
  this n. It is still ~2.5× the 5.4% baseline. **Sign-ups are flat at ~11–13 a
  week** (Supabase, weeks of 09-07, 09-14 and 09-21).
- ⚠️ **Clarity's `SignUp` event is blind.** It saw 0 this week while the database
  took ~11. Never quote sign-up rate from Clarity. Read `auth.users` (or the
  funnel-analyst agent) instead.
- ⚠️ **The `Play` event does not measure club-page play.** 34 of the 54 Play
  sessions entered on `/`, and 8 more on `/play`. Recordings show Google
  visitors on club pages playing full 10-question rounds through to "See your
  result →" with no Play event. The club taster is the real play for most
  visitors (07-28 finding), and this metric cannot see it. Treat 13.3% as the
  **homepage/app play rate**, not a site play rate.
- Returning users rose from 2.7% to 6.9%. That is small but real, and the first
  retention signal Clarity has shown.

### What's broken — nothing new. The top dead clicks are all ARTEFACTS (tested)

Dead-click sessions fell from **25.2% to 10.3%** (42 of 406). Rage clicks:
**0.7%** (3 sessions). The top dead-clicked texts were each tested on prod at
**390×844** (viewport verified), using **coordinate clicks with a capture-phase
listener**. The listener confirmed each tap hit the real element:

| Dead-clicked text | Page | Tested | Verdict |
|---|---|---|---|
| `Next question →` / `Siguiente →` | /quiz/real-madrid/, /eintracht-frankfurt/, /es/quiz/independiente/ | tap hit `BUTTON`, Q1→Q2 | ✅ **works.** Recordings list it as a plain *Click*, not a *Dead click* |
| `⌫`, `A`, `O`, `R` (keyboard) | /football-wordle/ | A, R typed, ⌫ deleted | ✅ **works.** The tile row changes far from the key, so Clarity sees "no response" |
| `" "` (empty text) | /mystery-player/, /play | tap focused the search input, typing showed suggestions | ✅ **works.** Taps into an empty input have no text and no DOM change |

⚠️ The "Top dead-clicked text" query returns **inflated totals** (500 on Real
Madrid). The per-page cut gives **17 dead clicks in 5 sessions** on the same
page. The first query multiplies clicks by dead-flags. Use per-page session
counts.

⚠️ **Method trap, new this run.** The browser pane's screenshot frame briefly
reported 800×600 while emulating 390×844. Coordinates were stretched
non-uniformly, and the first "Next" click landed at (73,461) on a streak
counter, not the button. It looked exactly like a dead button. **Log `e.target`
with a capture-phase listener before you believe any "it didn't respond".**

The only JS error was 1 session of `ResizeObserver loop limit exceeded`
(/quiz/celtic/), which is benign. Perf score 88. p75 **LCP 1.28s, INP 160ms
(was 220), CLS 0.019**: all green.

### What's leaking

| Page | Entries | Exits | Active | Scroll |
|---|---|---|---|---|
| `/` | 86 | **71** | **7.2s** (page-level) | 43% |
| `/mystery-player/` | 17 | **28** | 184s | 35% |
| `/quiz/real-madrid/` | 24 | 26 | 103s | **12%** |
| `/play` | 25 | 24 | 108s | 94% |
| `/quiz/` hub | 13 | 11 | **4.8s** | 27% |
| `/quiz/barcelona/`, `/quiz/manchester-city/` | 17 / 9 | 17 / 9 | 64s / 71s | **12% / 10%** |

- **Mystery Player exits more than it enters (28 vs 17).** It is the last stop
  for people arriving from elsewhere on the site. Its 184s active time says
  that is satisfaction, not rejection. There is no next step after the daily
  guess.
- **Club pages: 10–20% scroll with 60–160s active.** People play the taster
  and never see what sits below it. This is the 07-28 "bimodal" pattern and
  is unchanged.
- **`/quiz/` hub: 4.8s active.** Thirteen people entered on the index and left
  almost at once. Small n, but it is the worst page by far.
- **Homepage by source:** Google-mobile entries play (7 of 13) and browse (3.3
  pages). The 7.2s figure is page-level: it averages every return-to-home, so
  it is not a bounce time.

### Audience and sources

- Devices: ~61% mobile/tablet, 39% PC. In-app webviews (GoogleApp 15) ≈ 4%
  (was ~10%).
- Top countries: UK mobile 55 (153s), UK PC 40, US mobile 37 (**120s**, was
  12.7s), Argentina 29, Italy, India, Egypt 9 (**91s**, was 5.7s). **The US and
  Egypt "leave in 5–13 seconds" finding from July no longer holds.**
- Sources: Google dominates. Italy's Google traffic reads 148s. **ChatGPT
  referrals are steady**: 11 homepage entries, 105s on mobile. Bing,
  DuckDuckGo and Ecosia are small. `utm_source=listdle` averages 8.5s. One
  recording shows it landing on `/play` (Footle) with **LCP 5.6s**, then an
  immediate "←".

### What to ignore

- The dead-click texts above: tested and working (see table).
- The 500 / 297 / 277 "dead clicks" in the top-text query: a join artefact.
- CLS 0.64 on one /quiz/bundesliga/ recording and 0.12 on one Liverpool
  recording: single sessions. p75 CLS is 0.019.
- Two back-to-back 24–27 min, **zero-click** sessions on /lists/serie-a-champions/
  (same user id `s3iwdl`): abandoned tabs, per the 07-28 caveat.
- "Mohamed Salah · Trabzonspor" in the Mystery Player search looks wrong but
  is **correct**: he signed a two-year deal on 2026-08-06 (ESPN, Guardian).

### The opportunity — one change

**Give Mystery Player (and Footle) an "after you've solved it" next step.**
Evidence: Mystery Player is the #2 exit page (28), exits exceed entries by
65%, and people spend 184s there, so they finish and then have nowhere to go.
Daily games are also the only surface with a built-in reason to come back
tomorrow, and returning users just moved (2.7% → 6.9%). The ask should be a
**tomorrow hook** ("New player at midnight — get a reminder" / sign in to keep
your streak), not a link to another page. That targets sign-ups and retention
at the moment of proven engagement. ⚠️ This needs checking against what the
Mystery Player end state already shows (orientation skill) before building.

Runner-up: an instrument fix. A Clarity smart-event definition for the
club-page result screen, **or** read `clubq-finish` from our own store. Until
then the headline "play rate" misses the surface where most play happens.

---

## 📊 2026-07-28 (dashboard API, 3-day window) — THE PAGE-TYPE READ

Pulled by entry URL, channel/source, and country/device. Four cuts, ~130
sessions. **Read the abandoned-tab caveat below before quoting any absolute
number from this section.**

### The finding: engagement tracks whether a page is PLAYABLE

| Entry | Active | Scroll | Playable? |
|---|---|---|---|
| `/quiz/everton/` | 144.8s | 45.9% | ✅ taster |
| `/quiz/manchester-united/` | 139.6s | 21.1% | ✅ |
| `/play` (the app) | 121.9s | 96% | ✅ |
| `/quiz/rangers/` | 109.2s | 23.5% | ✅ |
| `/` homepage | 51.9s | 55.8% | ✅ |
| `/lists/ballon-dor-winners/` | **2.3s** | 14% | ❌ **none** |

The absolute values are soft (see caveat), but a ~60× gap is not an artefact,
and the list pages were the only type with nothing to do. **Fixed same day**
(c58d82d): 37 of 50 lists now carry the 5-question taster; 13 are deliberately
left blank rather than given off-topic filler.

### ⚠️ This also corrects "94.6% of visitors never press play"

That counts **app** plays. Club-page visitors ARE playing — the on-page taster
is the play for them. A club page holds a stranger from Google longer than the
app holds a user. This is not a bounce problem.

### Structural findings

- **Pages/session = 1.0 on EVERY entry URL.** Not 1.2 — exactly 1.0. The
  10,486-link internal mesh gets zero human traversal.
- **Why: club pages are 12,200px — 14.5 phone screens.** Average scroll is
  21–25%, so nobody reaches screen 4. The related-quiz tiles and the app CTA
  both sit *below* that line: not ignored, never rendered into view. Moving
  them above the 25% mark is one fix for both link traversal and app install.
- **Zero rage clicks, zero quick-backs, zero excessive scrolls, every URL.**
  Nothing is broken. We are fighting attention, not defects.
- **INP 220ms** is the only non-green vital (LCP 2.2s, CLS 0.02 both good).

### Audience

| Country / device | Sessions | Active |
|---|---|---|
| UK Mobile | 50 | 61.7s |
| Norway PC | 33 | 155.5s ← **Alex + testers, exclude from averages** |
| US Mobile | 10 | **12.7s** |
| US PC | 7 | **3.6s** |
| Egypt Mobile | 6 | **5.7s** |
| Portugal Mobile | 4 | 101.6s |

- **`IsReturningUser: 0` on all ten rows.** Retention is not weak, it is absent.
- **The US soccer-term gap, quantified: 3.6–12.7s.** They leave before reading a
  sentence. Egypt (our #1 GSC clicks country) is 5.7s. Both are traffic we rank
  for and instantly lose — a content/localisation problem, not a traffic one.
- Norway PC at 155s is **us**; it inflates every site-wide average.

### Channels

| Channel | Sessions | Active |
|---|---|---|
| Organic / google | 72 | 96.0s |
| Direct | 58 | 76.1s |
| balliq.app (self-ref) | 20 | 134.0s |
| **Social / ig** | **3** | **17.6s** |
| **chatgpt.com** | 1 | 14.5s |
| reddit.com | 1 | 9.1s |

- **Instagram returns 3 sessions at 17.6s.** The daily card is near-worthless as
  traffic. Worth reconsidering the cost of posting it daily.
- **ChatGPT referred a real session.** The llms.txt / `/lists` AI-answer bet is
  starting to register. First evidence it works.

### ⚠️ Carry-forward caveat

The entry below (session recordings, same day) found **3 of the 8 longest
sessions had ZERO clicks** — abandoned tabs inflate active time and scroll
depth. So treat the absolute seconds above as directional. **Ratios between
page types are the trustworthy signal; the raw numbers are not.**

---

## 🔬 2026-07-28 (session recordings) — CORRECTING THE PREVIOUS ENTRY

Read 8 real session recordings. Two of the earlier conclusions do not survive.

### ❌ CORRECTION: "six minutes of undivided attention" was OVERSTATED

**Three of the eight longest sessions had ZERO clicks:**

| Duration | Pages | Clicks | Entry |
|---|---|---|---|
| 1390s (23 min) | 2 | **0** | balliq.app/ |
| 1085s (18 min) | 1 | **0** | /quiz/everton/ |
| 899s (15 min) | 1 | **0** | /play# |

Those are **abandoned tabs, not engagement.** Clarity's "active time" and scroll
depth are inflated by them, so the earlier read — "people are devouring the
content, the site is not unappealing" — is **not supported at the strength it
was stated.** Some of that cohort simply left the tab open.

⚠️ **Never conclude engagement from duration alone on this site. Require clicks.**

### ✅ CONFIRMED: the full funnel WORKS when someone takes it

The 5-page session, end to end:

```
/quiz/tottenham/      66s, 11 clicks  (played the taster: answers + "Next →")
   ↓  clicked through
/play?club=tottenham   1s              (deep link fires correctly)
   ↓
/play                101s, 22 clicks  (played the REAL quiz in the app)
```

SEO page → taster → club deep link → real gameplay. **Every link in that chain
works.** The machinery is not broken; it is simply rarely traversed.

Compare the Newcastle session: 2135s, **1 page, 15 clicks**, entry from Google,
last click an answer option. Same content, same page type — played and then
stopped dead. Whatever separates that from the Tottenham journey is the actual
conversion question.

### 🚨 NEW LEAD — possible post-Google-login dead end

One session: entry `**/play#**`, referrer `**accounts.google.com**`, duration
**899s, ZERO clicks.** Someone completed Google sign-in, landed on `/play#`, and
did nothing for 15 minutes.

Either they abandoned, or **the post-OAuth landing is broken** — note the bare
`#` fragment. This is adjacent to the "Google login lands on the marketing
homepage" bug fixed in 38542a4, so a residual redirect fault is plausible.

**Test next: complete a real Google sign-in on balliq.app and watch where it
lands and whether the app is interactive afterwards.** Highest-value open lead.

---


## ⚡ 2026-07-28 (later) — THE DIAGNOSIS WAS WRONG. It is not bounce, it is bimodal.

Per-page scroll depth and active time overturn the earlier read on this page:

| Page | Avg scroll | Avg active time |
|---|---|---|
| /quiz/hull-city/ | **96%** | **368s (6+ min)** |
| /play | 95% | 103s |
| /lists/serie-a-top-scorers/ | 93% | 72s |
| /lists/serie-a-champions/ | 84% | 42s |
| /quiz/sporting-cp/ | 81.5% | 80s |

**The "50% average scroll depth" was a bimodal average** — instant bouncers plus a
real cohort reading nearly the whole page. The mean described nobody.

**People do NOT find the site unappealing.** Six minutes and 96% scroll on a Hull
City quiz page is devouring, not tolerating.

### The actual problem

**Deep engagement converts to nothing.** The six-minute Hull City reader still
left without a second pageview (entry 16 = exit 16). We take someone's total
attention for minutes and ask them for nothing at the end.

### What this KILLS (do not spend time here)

- ❌ **"Add cross-links so people can browse on."** The Everton page already has
  **114 internal links to 98 unique pages.** The mesh is built. Nobody uses it.
- ❌ **"The site looks bad / needs a premium facelift to stop bounces."** The
  engaged cohort scrolls 80-96%. Aesthetics are not what is stopping them.
- ❌ **"Nobody scrolls, so move everything above the fold."** True for the
  bouncers, false for the cohort that actually matters.

### What this POINTS AT

1. **A single, well-timed ask at the point of peak engagement** — end of the
   quiz/list, where attention is proven — beats any amount of passive linking.
2. **The two populations need different treatment.** Bouncers need a reason to
   stay in the first 3 seconds; the engaged cohort needs a next step at minute
   five. One design cannot serve both, and today neither is served.
3. Segment every future metric by these two groups. Site-wide averages here are
   actively misleading — this is the second time an average sent us the wrong way
   (see the CLS/interaction-shift note below).

⚠️ **METHOD NOTE.** Three consecutive theories died to one query each: dead
buttons (synthetic-click artefact), missing cross-links (98 already exist), ugly
design (96% scroll). Query before building. Every one of those would have been
days of wasted work.

---

## 2026-07-28 (earlier) — first read

Live behavioural data from Microsoft Clarity (project `xqwevk9brq`), read via
the MCP connector. **This is the first time real user behaviour has been read
end-to-end.** Alex's brief: retention, sign-ups, time-on-site; "let no stone go
unturned".

---

## 1. THE HEADLINE — it is a conversion problem, not a bug list

**111 sessions (last 3 days) → 6 triggered "Play" → 2 signed up.**

That is a **5.4% play rate**. Everything else below is subordinate to this.

| Metric | Value | Read |
|---|---|---|
| Sessions | 111 | (11,872 **bot** sessions excluded — bots are ~99% of hits) |
| Pages / session | **1.05** | Almost nobody navigates. Land → leave. |
| Scroll depth | 50.01% | Half the page unseen |
| Active time | 1.6 min of 2.6 min | |
| New vs returning | **97.3% / 2.7%** (3 sessions) | **No retention loop is firing** |
| Smart events | Play 6 · Outbound 5 · Sign up 2 · Submit form 1 · Login 1 | |

**Nothing is technically broken:**
- **0 JavaScript errors**
- Performance **83/100**; LCP 2.2s ✅ · INP 200ms ✅ · CLS 0.017 ✅
- Rage clicks **0%** · excessive scrolling **0%** · quick backs **0%**

So the app is fast, stable and error-free — and 94.6% of visitors still never
press play. **Do not go looking for a crash. There isn't one.**

## 2. Traffic shape

- **Referrers:** google.com **60**, balliq.app 9, accounts.google.com 4,
  instagram 1, threads 1, reddit 1 → **SEO carries essentially all traffic.**
- **Browsers:** MobileSafari 35% · ChromeMobile 31.5% · Chrome 10.8% ·
  **FacebookApp 9%** · GoogleApp 4.5% · Firefox 4.5% · Edge 3.6% ·
  **InstagramApp 0.9%** → **~66% mobile, ~10% in-app webviews.**
- **Top pages:** /play 18 · / 17 · /quiz/rangers 11 · /quiz/everton 8 ·
  /quiz/newcastle 7 · /invite/… 5

⚠️ **Test everything at mobile viewport.** Desktop is a minority case.

## 3. Dead clicks — 25.23% of sessions (28/111)

Highest-signal defect. Rage clicks are 0%, so users are not *angry* — they tap
something, get nothing, and quietly leave.

**By text:**

| Clicked text | Dead clicks | What it is |
|---|---|---|
| `Next →` | **176** | quiz advance button |
| `Pep Guardiola, Barcelona'` | 36 | an answer option |
| `التالي →` | 30 | `Next →` in Arabic |
| `••••• •••• ••••` | 28 | Clarity-masked text |
| `▫▫` | 26 | glyph |
| `The name 'Camp Nou' liter…` | 24 | an **explanation** |
| `The Brazilian Ronaldo sco…` | 24 | an **explanation** |
| `Which Brazilian, playing…` | 24 | the **question text** |
| `A` | 15 | option letter badge |

**`Next →` by URL:** `/play` **149** · /invite/… 8 · / 4 · /quiz/tottenham 4 ·
/quiz/sporting-cp 4 · /quiz/psg 4 · /quiz/hull-city 2 · /quiz/la-liga 1

→ **85% of the Next-dead-clicks are in the real app, not the SEO taster.**

### Hypotheses RULED OUT (tested live, do not re-investigate)

- ❌ *"The Classic mode card is dead"* — it works; my first click simply missed.
- ❌ *"The timer keeps running during reveal and auto-advances, yanking the
  question away"* — **the timer FREEZES on answer.** No auto-advance.
- ❌ *"The SEO taster options are dead"* — they work (tap → ✓/✗ + explanation
  + Next). A `ref`-based click failed to dispatch; a coordinate click worked.
  **Beware: a failed synthetic click looks exactly like a dead button.**
- ❌ *Code fault in the advance path* — `doAdvance` is synchronous and correct;
  `advance` fires in the same React batch as the answer, so there is no window
  where the button is missing. `App.jsx` ~2190.

### Leading hypothesis — LAYOUT SHIFT ON ANSWER (untested)

Answering **expands the card**: the explanation and the Next button appear, and
everything below moves down (measured **~115px** on the Barcelona hero taster at
desktop width; proportionally worse on a 390px viewport).

So the sequence is: user taps an option → content jumps → the user's next tap
lands where the old layout was → **dead click**.

This also explains the *explanation* and *question text* dead clicks: those
elements have just moved into the space where the option the user tapped used
to be.

⚠️ **CLS 0.017 does NOT contradict this** — Core Web Vitals CLS measures
*load* shift, not *interaction* shift. This shift is invisible to that metric.

**NEXT TEST (highest value, not yet done):**
1. Reproduce at a **390×844 viewport** (`resize_window` did not visibly apply
   in my run — verify the viewport actually changed before trusting a result).
2. Double-tap `Next →` and check whether the second tap lands on the **next
   question's option D**. If it does, that is a **scoring bug**, not cosmetic —
   it would silently answer the following question wrong.
3. Watch 2–3 Clarity recordings filtered on `deadClickPresent`. Thirty seconds
   of video settles what code reading cannot.

## 4. Design reads (not bugs — signals)

- Users tap **explanations and question text** → they expect the explanation to
  expand, or the whole card to advance. Consider: make the whole card tappable
  to advance once answered.
- Users tap **already-answered / disabled options** → after answering, the
  options go `disabled` (`gen-seo-pages.mjs`, the `p!==null?' disabled':''`
  branch). A disabled button is a guaranteed dead click. Consider making the
  answered card advance on tap anywhere instead.
- **1.05 pages/session + 50% scroll depth** → the club pages are not pulling
  people deeper. The taster is *above* the long-form content; most visitors
  likely never reach the second quiz block.

## 5. What this means for the week

Ranked by expected value:

1. **The 5.4% play rate.** 60 Google visitors/day arriving and leaving is the
   whole ballgame. Everything else is a rounding error next to this.
2. **Dead clicks (25% of sessions)** — likely one layout-shift fix.
3. **Retention: 2.7% returning.** No loop is firing. Web push is still blocked
   on `VAPID_KEYS`.
4. **In-app webviews ~10%** — Facebook/Instagram browsers, where install and
   share behave badly.

---

⚠️ **Nothing in this file is a fix. It is evidence.** Fixes must be verified by
exercising the app at a mobile viewport, not by reading the diff.

---

## 🇺🇸 2026-07-28 (US session recordings) — WHY US TRAFFIC CONVERTS AT ZERO

12 US sessions, longest-first. **Every Google-referred one had ZERO clicks:**

| Page | Referrer | Duration | Clicks | Load |
|---|---|---|---|---|
| `/quiz/psg/` | Google | 48s | **0** | 1,639ms |
| `/quiz/psg/` | Google | 4s | **0** | 1,951ms |
| `/quiz/champions-league/` | Google | 7s | **0** | 2,393ms |
| `/quiz/champions-league/` | — | 2s | **0** | 1,473ms |
| `/lists/ballon-dor-winners/` | — | 8s | **0** | 562ms |
| `/` homepage | — | 14s | **0** | **4,538ms, LCP 7.1s** |

One visitor spent **48 seconds on the PSG page and never tapped anything**, with
the first taster option at y=349 — well above the fold.

### Ruled out (do not redo)

- **Page weight.** Club pages are 68KB raw HTML (14KB inline CSS, 11KB JS,
  12 Q&A cards). `/lists` 45KB, homepage 36KB. Not a payload problem.
- **"The answers are already visible so there's nothing to tap."** Checked in a
  real browser: `.qa-why` computes to `display:none` before interaction. A grep
  of the inline `<style>` suggested otherwise — the rule lives elsewhere. The
  taster genuinely requires a tap.

### Still open

US visitors see a working, above-the-fold, interactive taster and don't touch
it. That points at intent or content fit (British-English framing, club choice),
not mechanics. See TODO 2c / task #60.

### Two side findings

- **The homepage is the slow entry**: LCP 7.1s / 4,538ms in one session, versus
  1.5-2.4s for the static club pages. It is the SPA; the club pages are static
  HTML. Worst-engaging entry (51.9s) AND slowest.
- **Footle is what actually holds people.** The one high-engagement US session
  was 86s with **18 clicks** — someone typing C-O-L-E, ENTER, C-E-N-A, ENTER.
  Every other engaged session was onboarding or an abandoned tab.

### Section positions on a club page (390×844, /quiz/psg/)

Page 12,418px = 14.7 screens. Taster 10.4%→46.8% · **app CTA 54.1%** ·
**tiles 57.2%** · FAQ 92.5%. **Clarity scroll stops at 21-25%** — the CTA and
tiles are at more than double the read depth. And since the 10-question taster
alone spans a third of the page, users are abandoning the taster around Q3-4,
not scrolling past it. Moving the CTA up alone will not fix this. See task #59.

---

## 🔁 RECONCILIATION — the 21-25% scroll figure is a MEAN, and the mean describes nobody

Two entries above conflict, and the older one is right. Correcting mine.

**What I wrote:** club-page scroll "stops at 21-25%", so the app CTA (54.1%) and
the related-quiz tiles (57.2%) are "never rendered into view."

**Why that is overstated:** the "bimodal" entry already established that scroll
depth on this site is two populations, not one — and it measured
`/quiz/hull-city/` at **96% scroll, 368s active** and `/quiz/sporting-cp/` at
81.5%. My 21-25% came from rangers/man-utd **means**. The same entry warns in
its own words that the mean "described nobody." I quoted a mean and drew a
population-wide conclusion from it. That is the exact error it was written to
prevent.

**What survives:**
- The *bouncer* half never reaches the CTA or tiles. True.
- The *engaged* cohort does reach them — **and still converts to nothing.**
  That is the older, harder finding and it is unaffected by anything I measured.
- Section positions are facts, not means: CTA 54.1%, tiles 57.2%, taster
  10.4-46.8%, page 12,418px. Those stand.

**What this does to task #59:** "move the CTA above the 25% line" targets the
bouncers — who by definition are not engaged enough to act on a CTA. The older
entry explicitly kills "nobody scrolls, so move everything above the fold" as a
half-truth for exactly this reason. The live question is still its point 3:
**two populations need two different treatments**, and today neither gets one.
Do not treat #59 as a settled reflow. It is a design decision, and the bouncer
fix and the engaged-cohort fix are not the same change.

⚠️ **Standing rule for this file: never quote a Clarity mean as a population
fact.** Scroll depth and active time are both bimodal here. Split the cohorts or
say nothing.
