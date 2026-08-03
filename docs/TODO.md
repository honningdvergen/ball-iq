# Ball IQ — the list

**Last updated: 2026-08-03.** Single source of truth for what's in flight.
`[ ]` = open · **ALEX** = needs you · **CLAUDE** = I do it.

Claude: update this file whenever something lands, and re-read it when asked
"what's left". It exists because a chat scrollback is not a plan. Completed
items are deleted, not archived — git history is the archive.

---

## TODAY — 2026-08-03

### 🎨 THE SCOUTING REPORT — LIVE AT https://balliq.app/home-preview/

`/` is untouched and still serves MarketingHome. The preview is a separate lazy
chunk on a route that already existed, so the converting homepage carries zero
risk. **Judge it on a phone** — 66% of traffic.

**Alex, 2026-08-03: "no need for us to rush, we will get this PERFECT."**

#### The 9 to swap-ready — BLOCKING (1-6)

- [ ] **1. Club wall** — ⚠️ HIGHEST VALUE. ScoutingReport has **0** links to `/quiz/`; MarketingHome has 15; there are **126 club pages**. Every rising page in the 2026-08-03 GSC read was a club page. The homepage is our strongest linking surface and it currently points at almost none of them.
- [ ] **2. Footle section** — most-played mode per `project_first_real_numbers`
- [ ] **3. Daily 7 door** + `?game=daily` deep link
- [ ] **4. Nav / drawer** — there is currently NO way off the page except "Play free" (MarketingHome: 40 refs, ScoutingReport: 0)
- [ ] **5. FAQ** — carries FAQ schema; dropping it loses rich-result eligibility (12 refs → 0)
- [ ] **6. Accessibility pass** — detector ≠ WCAG. 25% of sessions produce a dead click on the current site; do not carry that in.

#### SHOULD-DO (7-9)

- [ ] **7. The accumulating report** — the lede promises "the report writes itself while you answer" and the build does NOT do that; it replaces each question. Accumulation is the thesis, not a refinement. Do not soften the copy to match a weaker build.
- [ ] **8.** Multiplayer clause at the verdict + app-exclusive line ("web has ads, the app doesn't")
- [ ] **9.** Analytics / Clarity instrumentation parity

**Then:** swap `/`, watch GSC a fortnight, keep `/home-preview` as rollback.

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

### 🎨 Redesign groundwork — committed, NOT pushed

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

### 🟢 Committed, NOT yet pushed — waiting on Alex

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
