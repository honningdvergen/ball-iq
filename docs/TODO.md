# Ball IQ — the list

**Last updated: 2026-07-27.** Single source of truth for what's in flight.
`[ ]` = open · `[x]` = done · **ALEX** = needs you · **CLAUDE** = I do it.

Claude: update this file whenever something lands, and re-read it when asked
"what's left". It exists because a chat scrollback is not a plan.

---

## 🔴🔴 THE WEEK'S WORK — CONVERSION (from real Clarity data, 2026-07-28)

**Full evidence: [CLARITY-FINDINGS.md](CLARITY-FINDINGS.md). Read it first.**

**111 sessions → 6 played → 2 signed up. A 5.4% play rate.**
1.05 pages/session. 97.3% new / 2.7% returning. And **0 JavaScript errors**,
performance 83/100, every Core Web Vital green.

**Nothing is broken. 94.6% of visitors just never press play.** That reframes
the whole backlog: this is conversion, not defects.

- [ ] **1. Fix the 5.4% play rate.** 60 Google visitors/day land and leave.
      Worth more than everything else on this list combined.
- [ ] **2. Dead clicks — 25% of sessions.** `Next →` = 176 (149 in /play).
      Leading hypothesis: **answering expands the card ~115px**, so the next
      tap lands where the old layout was. CLS 0.017 does NOT disprove this —
      that metric only measures LOAD shift, not interaction shift.
      ⚠️ **Untested and important:** at mobile width, does a double-tap on
      `Next →` land on the NEXT question's option D? If yes that is a
      **scoring bug**, not cosmetic.
      Already ruled out (don't redo): timer auto-advance (timer freezes),
      dead Classic card, dead taster options, fault in `doAdvance`.
- [ ] **3. Retention: 2.7% returning.** No loop fires. Web push still blocked
      on `VAPID_KEYS`.
- [ ] **4. ~10% of sessions are in-app webviews** (FacebookApp 9%,
      InstagramApp 0.9%) where install/share misbehave.
- [ ] **5. Design signals:** users tap explanations, question text and
      already-answered (disabled) options. They expect the card to advance on
      tap. A `disabled` button is a guaranteed dead click.

⚠️ **~66% of traffic is mobile** (MobileSafari 35% + ChromeMobile 31.5%).
Test at 390×844, not desktop — and VERIFY the viewport actually changed before
trusting a result; `resize_window` silently no-opped once in this session.

⚠️ **A failed synthetic click looks exactly like a dead button.** A `ref`-based
click reported success but did not dispatch; the coordinate click worked. Two
false "dead button" findings came from this. Always confirm with a second
method before declaring something broken.

---

## ⏸️ WAITING ON ALEX

1. **89 held substitutions** — the one real editorial call. Self-answering
   questions can only be REPLACED, so applying them means an agent authoring
   ~1.5% of the bank. `.audit/held-substitutions.json`.
2. **19 medium-confidence + 3 no-clean-fix verdicts** — `.audit/needs-alex.json`.
3. `VAPID_KEYS` still holds the truncated value — web push stays blocked.
4. **App Store screenshots** — predate the current home grid.
5. **Android emulator**: SDK tools exist but there is NO AVD and no system
   image (~1–2 GB download), and `bundletool` is absent so an AAB can't be
   installed directly. Claude's simulator panel is iOS-only. Best signal is
   installing from Play on a real Android device.

ℹ️ **AdSense "ads.txt: Ikke funnet" is a FALSE ALARM** (checked 2026-07-28):
`/ads.txt` returns 200 `text/plain` with the correct `pub-7467890219483381`,
5/5 fetches, matching index.html. It's Google's crawl status lagging while the
site sits in "Klargjøres". Only worth chasing if it persists past ~48h.

---

## 🔴 NOW — Google Play launch (time-critical, 14-day test is finished)

- [x] Production-access form **step 1 filled by Claude** 2026-07-25 (all four
      answers; note every field caps at 300 chars). Alex reviews + clicks Neste.
- [x] **APPLICATION SUBMITTED 2026-07-25 21:33.** All 3 steps drafted by
      Claude, reviewed and sent by Alex. Google: decision by e-mail to the
      account owner, "typically max 7 days, sometimes longer".
- [x] ✅ **PRODUCTION ACCESS GRANTED** 2026-07-27 (email, 20:24). Name
      collision never materialised — Google granted it as
      "Ball IQ: Football Trivia (app.balliq)".
- [x] 🚀 **PRODUCTION RELEASE SUBMITTED 2026-07-27** by Claude, on Alex's
      explicit go-ahead. Build 6 (1.3.3, targetSdk 36, 5.65 MB install).
      **177 countries + "rest of world"**, full rollout (100%).
      Release notes written as a first-launch pitch, not a changelog.
      ⚠️ **Managed publishing is OFF** → it goes LIVE automatically the
      moment review passes. No second gate. Google says usually ≤7 days.
      Undo while it lasts: Publiseringsoversikt → "Opphev endringene".
      Only warning was the missing R8 mapping file (crash-report
      readability, not a blocker).
- [x] **Android build 6 cut** (`c8bac47`, 2026-07-25) — versionCode 6,
      versionName 1.3.3, targetSdk 36, 7.5 MB. Content verified inside the
      bundle (Wave J + K clubs, MP podium). Ready at
      `~/Downloads/balliq-1.3.3-build6-api36.aab`.
- [x] **Build 6 uploaded + submitted 2026-07-26.** Alex dragged the AAB in;
      Claude wrote the release notes, saved and sent it to Google. Console
      shows "Endringer under gjennomgang". Verified in-console as version
      6 (1.3.3), target SDK 36. Only warning was a missing R8 mapping file
      (crash-report readability only, not a blocker).
- [ ] ⚠️ **Build 6 does NOT contain the 89 bank corrections** (cut 25 July,
      fixes landed 27 July). Claude flagged this twice and recommended
      cutting build 7 first; Alex chose to ship for the platform launch.
      **So 1.3.4 / 1.4.0 must carry the corrections to BOTH stores** — iOS
      1.3.3 is live without them too.
- [x] ✅ **LIVE ON GOOGLE PLAY 2026-07-27** — review took ~15 minutes, not the
      7 days Google quotes. Production track "Aktiv", 177 countries.
      https://play.google.com/store/apps/details?id=app.balliq
- [x] **Play link wired across every surface** (`b4db171`) — BiqNav, marketing
      home, in-app banner, ~161 SEO pages, index.html + schema.org. Verified
      164/164 generated pages have an Android path, 0 say "coming soon".
      **NEW: `/get`** (api/get.js) redirects by platform — iOS→App Store,
      Android→Play, desktop→web app. Static pages can't sniff the platform, so
      any single "Get the app" CTA used to dead-end half its visitors.
      **Use `balliq.app/get` for bios, Reddit and socials.**
      Biggest fix: `FootleGetAppCTA` was gated on `IS_IOS_WEB`, so Android
      users finishing Footle on web — the exact social-funnel moment — saw
      NOTHING. Now platform-aware.
- [ ] **The Reddit club-sub push is now UNBLOCKED** (it was gated on Play
      being clickable). Both stores are live.

## 🔴 NOW — App Store

- [x] 1.3.3 (48) submitted — FIFA/World Cup IP stripped, metadata scrubbed,
      reply sent to App Review.
- [x] **1.3.3 APPROVED AND LIVE** (Alex confirmed 2026-07-27). The 5.2.1 /
      FIFA saga is closed. Next version → call it **1.4.0**, not 1.3.4.
- [ ] **ALEX** — Refresh screenshots once it clears (old ones predate the
      current home grid).

## 🔴 NOW — Web bugs

- [x] Invites + Google login landed on the marketing homepage — one root
      cause, fixed and live (`38542a4`). Also fixes Snapchat invites.
- [x] Supabase redirect allow-list already contains `https://balliq.app/play`
      (Alex confirmed 2026-07-25) → web Google login should now work.
- [ ] **ALEX** — Sanity-test Google sign-in on balliq.app to confirm.
- [ ] **ALEX** — Re-test "challenge a friend" now that /join is fixed. Its
      redirect target was already correct, so a failure there is a new cause.

## 🟡 NEXT — Activation (the measured bottleneck: 38% → 15%)

From the PrimeTestLab QA report #4470 — every one of these is an activation leak:
- [x] **S-01** Skip tap target fixed (`93509a8`) — handlers were already
      identical; the control was ~41x62px (under 44pt/48dp) and unstyled, so
      near-misses read as dead. Now 48x88 with a pressed state.
- [x] **S-02** Empty Footle grid made legible to first-timers (`f681a1f`).
- [x] **S-03** Scroll now resets on every screen change (`93509a8`) — there
      was no scrollTo anywhere in App.jsx, so returning from a quiz kept the
      old scroll and pushed the daily cards below the fold.
- [x] **S-04 CLOSED — no wall exists.** Verified end to end: Home's "Tap to
      set your name" → Profile + nonce → the inline editor opens with no auth
      check, and `saveName` handles guests explicitly ("Guests stay
      local-only"). The only guest-specific UI is a *Save your progress*
      promo card — a suggestion, not a gate. The tester read the promo as a
      wall. Real signal about PERCEPTION, but nothing to fix in code.
- [ ] **CLAUDE** — Watch real Clarity sessions and locate the actual drop-off.
## 🟡 NEXT — Multiplayer

- [x] **Scoreboard frozen until reveal** (`8af449a`) — scores no longer tick
      up mid-question and spoil the tension.
- [x] **Show what each opponent answered at reveal** (`af7b7fc`) — BUILT,
      LANDS INERT. Opponent avatars appear on the option they picked.
- [ ] ⚠️ **Migration written but NOT YET APPLIED:**
      `supabase/migrations/v1_3_mp_reveal_picks.sql`. Until it runs, the RPC
      returns no `picks` and the UI renders exactly as before — no half-state.
      (An apply attempt on 2026-07-27 failed on a transient tool error, not a
      SQL problem. Prod function bodies were byte-verified against the
      snapshot first — 3588/3588 and 2314/2314 — so the verbatim copies in the
      migration are safe to re-run.)
      **This was never a UI job** — room_players stores score/streak/
      answered_question (an INDEX), never the choice, so the data did not
      exist. Picks go in a grant-less `room_answers` table disclosed by the
      already-gated `reveal_question` RPC, because a column on room_players
      would let a modified client poll opponents' picks BEFORE answering.
      Also fixed en route: `reveal_question` was skipped whenever
      `question.correct` was embedded — i.e. in every room today — so that
      RPC never actually fired in prod.
- [ ] Rematch / Challenge buttons currently notify nobody.
- [ ] MP stats robustness — needs a 2-device test first.
- [x] Game-over payoff: podium, count-up, entrance choreography, 1v1 crown.

## 🟡 NEXT — Retention

- [x] Native Footle reminders (7pm streak-saver + win-back tail) — riding
      the 1.3.3 review.
- [x] `VAPID_SUBJECT` saved correctly.
- [ ] ⚠️ **ALEX** — `VAPID_KEYS` currently holds the WRONG value. Saved digest
      is `f02568a4…` = the 158-char partial paste; the full 392-char key is
      `1bcd0f4dee11eac3…`. Re-save under the same name to replace. ALWAYS
      verify a secret by digest, never by eye — a truncated signing key fails
      silently at SEND time, weeks later, as an opaque signature error.
      (Claude cannot type secrets into fields; clipboard-arming is the assist.)
- [ ] **CLAUDE** — Build web push once unlocked (table, edge function,
      client opt-in, sw handlers). Plan: `docs/growth/web-push-plan.md`.
- [ ] **CLAUDE** — Transfer Trail screen. Logic + 8 verified careers are
      done and unit-tested; only the screen is missing.

## 🔵 BIG BETS — need Alex's decision before work starts

- [ ] **Custom avatars** replacing profile emoji, shown in multiplayer.
      Recommended phasing: **Phase 1** outfits unlocked by achievements (no
      money, ships fast, proves demand) → **Phase 2** paid outfits (~6 NOK),
      which needs StoreKit + Play Billing + tax setup = weeks, not days.
      Fits the standing rule: content free, cosmetics/features paid.
- [ ] **Spanish**. Recommended phasing: **Phase 1** `/es/` SEO pages +
      hreflang + sitemap (big search volume, Spanish clubs already covered,
      zero app changes) → **Phase 2** in-app i18n (large: App.jsx has
      hardcoded English throughout).

## 🔬 BANK AUDIT — VERIFY COMPLETE, 89 corrections applied

**FINAL 2026-07-27: 36/36 batches, 0 errors, all 211 serious flags verified.**
**89 corrections applied (`6689f00`) · 89 substitutions HELD for Alex ·
19 medium-confidence + 3 no-clean-fix parked · 11 flags rejected as fine.**

⚠️ **Screener false-positive rate: 5%.** 200 of 211 flags were real defects.
I predicted the opposite — that the screener was over-flagging. It was not.

**Two forge-level lessons — worth more than the 89 fixes themselves:**

1. **The dominant defect is a FALSE PREMISE IN THE STEM, not a wrong key.**
   66 of 89 had the right answer attached to an over-claiming stem ("the only
   side to…", "the first German since…", "before joining PSG that year" when
   he'd already joined). These never fail a key-check, so no amount of
   answer-verification catches them. The forge must *verify the stem's
   assertions, not just the key*.
2. **42% of serious flags (89/211) are SELF-ANSWERING questions** — the stem
   gives the answer away ("Italy's last appearance was 2014 — how many years
   before 2026?"). Not wrong, just pointless: free points that make the app
   feel easy. The forge needs a self-answering check before a question ships.

**Applying:** `node scripts/audit-apply.mjs <journal.jsonl> [--write]`.
Dry-run by default. Applies ONLY confirmed+high verdicts that carry a complete
replacement AND whose live bank text still matches the snapshot they were
judged from. Everything it refuses is printed with a reason.

**Harvesting:** `node scripts/audit-harvest.mjs <journal.jsonl>` reconstructs
findings from any run at any moment, so a limit kill can never waste the spend.

⚠️ **The freeze was unnecessary** — verify agents read `.audit/vbatch/*.json`
snapshots, never `src/questions.js`. The bank can be edited while the audit
runs. (Cost us a day of not applying fixes.)

**Structural lesson:** screen+verify were stages of ONE pipeline, so every
resume spent the budget finishing the screen and the verify agents at the tail
died to the usage limit — three runs, zero verdicts. Fixed by splitting them.

- [ ] ⚠️ **ALEX — the one real decision: 89 held substitutions.**
      These questions contain their own answer, so they can't be corrected,
      only REPLACED with a different question. The replacements are written
      and web-sourced (84 high-confidence), but applying them means an agent
      authoring ~1.5% of your bank. Review `.audit/held-substitutions.json`,
      then `node scripts/audit-apply.mjs <journal> --write
      --include-substitutions`. My call: read a sample first — if they're
      good, take them; leaving 89 pointless questions live is its own cost.
- [ ] **ALEX** — 19 medium-confidence + 3 no-clean-fix verdicts need
      editorial calls. See `.audit/needs-alex.json`.
- [x] Re-forge the 9 hints dropped because the answer genuinely changed
      (`9a526f2`) — rewritten from the verifiers' own sourced findings.
- [ ] **Screen the remaining ~470 questions** never reached by the screener.
- [ ] **Verify the 500 cosmetic flags** — untouched so far.
- [ ] Build the two forge lessons above into the question pipeline.

⚠️ **No question gets edited on screener output alone.** The screener has been
caught inventing a defect (claimed Gerd Müller scored in a 1973 European Cup
final Bayern never played in). Only `confirmed_high` verdicts are safe to
apply; everything else is Alex's call. The worst outcome is "fixing" a correct
question into a wrong one.

Alex's standing bar: question quality is EVERYTHING, target is a definitive
ZERO wrong answers, resources authorised.

## ⚪ CONTENT & BACKLOG

- [ ] **Footle 5-8 letter preference** — RESOLVED how, needs Alex's nod.
      The frozen log stores NAME STRINGS (not indices), so days #1-400 can
      never move. Past #400 a stride formula runs over the pool, and the pool
      length is the modulo base with a gcd(stride, length)==1 requirement —
      so DELETING 73 names is the risky path (breaks the coprime rule, and
      would drop KANE/PELE/BEST from the game entirely).
      **Better: extend WORDLE_ANSWER_LOG past #400 with hand-picked 5-8
      letter names** — exactly what the file's own comment prescribes. No
      pool change, no gcd risk, full control. #400 lands ~2027-06-07, so
      there is ~10 months of runway; cheap to do any time.
- [ ] Next club wave (Championship / Spain / Germany / niche gold).
- [ ] Young-stars question wave (Bellingham, Vinícius, Saka, Foden, Yamal).
- [ ] Plausibility + difficulty-honesty sweep of "hard"-graded questions.
- [ ] Seasonal refresh of /lists (every May–June + after tournaments).
- [ ] Authority kit: directory submissions + outreach (Alex-executable).
- [ ] TikTok channel — the biggest platform Ball IQ is absent from.
- [ ] Reddit karma drip, then the club-subreddit push.

## ✅ RECENTLY LANDED

- 20/20 Premier League complete — every current PL club has a verified quiz
  and SEO page (61 live club pages, bank 5,834 questions).
- Waves J + K: Bournemouth, Brentford, Burnley, Wolves, Coventry, Hull City.
- `ball-iq-seo-wave` skill — the content pipeline no longer lives in chat.
- Microsoft Clarity live on the web (native-guarded).
- Android targets API 36 — Google's Aug 31 requirement met.
- App Store 5.2.1 rejection resolved: World Cup mode + metadata stripped.
