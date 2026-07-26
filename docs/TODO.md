# Ball IQ — the list

**Last updated: 2026-07-25.** Single source of truth for what's in flight.
`[ ]` = open · `[x]` = done · **ALEX** = needs you · **CLAUDE** = I do it.

Claude: update this file whenever something lands, and re-read it when asked
"what's left". It exists because a chat scrollback is not a plan.

---

## 🔴 NOW — Google Play launch (time-critical, 14-day test is finished)

- [x] Production-access form **step 1 filled by Claude** 2026-07-25 (all four
      answers; note every field caps at 300 chars). Alex reviews + clicks Neste.
- [ ] **ALEX** — Read step 1, then continue through the form.
- [ ] **BOTH** — Form steps 2 ("Om spillet ditt") + 3 ("Forberedelse til
      produksjon"): Alex pastes the questions, Claude drafts the answers.
- [ ] **ALEX** — ⚠️ Settle the **Play name collision** before applying. Most
      likely thing to force a re-do.
- [ ] **CLAUDE** — Cut Android **versionCode 6** (versionName stays 1.3.3).
      The AAB on disk is from Jul 22 14:20 and is 7 commits stale — missing
      Wave J + Wave K (6 clubs, 160 questions), the MP podium, the 1v1 crown.
      Testers' QA report was against 1.3.1 / code 4.
- [ ] **ALEX** — Upload build 6 to the closed track so testers hold current code.
- [ ] **ALEX** — Apply for production access → then promote to production.
- ℹ️ **Timeline:** ~1–2 weeks from applying (access review, then release review).

## 🔴 NOW — App Store

- [x] 1.3.3 (48) submitted — FIFA/World Cup IP stripped, metadata scrubbed,
      reply sent to App Review.
- [ ] Awaiting Apple's verdict.
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
- [ ] **S-01** Skip on the knowledge screen is less reliable than Finish.
      In onboarding → treat as a bug, not a suggestion.
- [ ] **S-02** Stronger empty-grid preview before the first Footle guess.
- [ ] **S-03** Keep the Daily 7 / Footle card above the fold after quitting a
      quiz, so the daily habit is one tap.
- [ ] **S-04** Guest "Set your name" inline instead of a full account wall —
      removes friction exactly at share time.
- [ ] **CLAUDE** — Watch real Clarity sessions and locate the actual drop-off.

## 🟡 NEXT — Multiplayer

- [ ] **The reveal moment** (Alex's two notes are one job):
      show what each opponent answered at reveal, and hold the score display
      until reveal instead of ticking up instantly (it spoils the tension —
      reuse the podium count-up).
- [ ] Rematch / Challenge buttons currently notify nobody.
- [ ] MP stats robustness — needs a 2-device test first.
- [x] Game-over payoff: podium, count-up, entrance choreography, 1v1 crown.

## 🟡 NEXT — Retention

- [x] Native Footle reminders (7pm streak-saver + win-back tail) — riding
      the 1.3.3 review.
- [ ] **ALEX** — Set `VAPID_KEYS` + `VAPID_SUBJECT` in Supabase → Edge
      Functions → Secrets. Values are in `~/Desktop/vapid-setup.txt`.
      Public key already known: `BE4CsPRg…FpY`. Unlocks web push.
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

## ⚪ CONTENT & BACKLOG

- [ ] **Footle 4-letter names** — Alex wants a 5–8 letter range. 73 of 406
      players are ≤4 letters. ⚠️ **BLOCKED** until Claude confirms the frozen
      400-day answer log stores *names* and not *indices* — if indices,
      deleting players silently rewrites 400 days of already-published
      answers and the indexed /footle/answer archive.
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
