# Ball IQ — the list

**Last updated: 2026-07-27.** Single source of truth for what's in flight.
`[ ]` = open · `[x]` = done · **ALEX** = needs you · **CLAUDE** = I do it.

Claude: update this file whenever something lands, and re-read it when asked
"what's left". It exists because a chat scrollback is not a plan.

---

## 🔴 NOW — Google Play launch (time-critical, 14-day test is finished)

- [x] Production-access form **step 1 filled by Claude** 2026-07-25 (all four
      answers; note every field caps at 300 chars). Alex reviews + clicks Neste.
- [x] **APPLICATION SUBMITTED 2026-07-25 21:33.** All 3 steps drafted by
      Claude, reviewed and sent by Alex. Google: decision by e-mail to the
      account owner, "typically max 7 days, sometimes longer".
- [ ] **ALEX** — ⚠️ Settle the **Play name collision** before applying. Most
      likely thing to force a re-do.
- [x] **Android build 6 cut** (`c8bac47`, 2026-07-25) — versionCode 6,
      versionName 1.3.3, targetSdk 36, 7.5 MB. Content verified inside the
      bundle (Wave J + K clubs, MP podium). Ready at
      `~/Downloads/balliq-1.3.3-build6-api36.aab`.
- [x] **Build 6 uploaded + submitted 2026-07-26.** Alex dragged the AAB in;
      Claude wrote the release notes, saved and sent it to Google. Console
      shows "Endringer under gjennomgang". Verified in-console as version
      6 (1.3.3), target SDK 36. Only warning was a missing R8 mapping file
      (crash-report readability only, not a blocker).
- [ ] **ALEX** — Apply for production access → then promote to production.
- ℹ️ **Timeline:** ~1–2 weeks from applying (access review, then release review).

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
- [ ] **Show what each opponent answered at reveal** — the other half of
      Alex's reveal note, still open. The freeze landed; the per-opponent
      answer display did not.
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

## 🔬 BANK AUDIT — VERIFYING, first 79 fixes SHIPPED

**State 2026-07-27 (live): ~18/36 batches · 108/211 verdicts · 89% of screener
flags CONFIRMED real · 79 fixes applied (`1ba5a07`) · 19 medium-confidence
awaiting Alex.**

⚠️ The screener **under**-flagged, not over-flagged. I predicted lots of false
positives; the real false-positive rate is ~8-11%. Nearly 9 in 10 flags are
genuine defects.

**The dominant defect is a FALSE PREMISE IN THE STEM, not a wrong key** — 55 of
79 had the right answer attached to an over-claiming stem ("the only side to…",
"the first German since…"). These never fail a key-check, so no amount of
answer-verification would have caught them. Worth building into the forge:
*verify the stem's claims, not just the key.*

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

- [ ] Re-run the applier as the remaining ~18 batches land.
- [ ] **ALEX** — 19 medium-confidence verdicts need editorial calls.
- [ ] Re-forge the 13 hints dropped because the answer changed.

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
