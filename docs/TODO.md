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

### 1. CLAUDE · Split the question bank
2.0MB raw / 622KB gzipped, parsed in ONE ~700ms main-thread task at t≈2s —
exactly when a visitor decides to tap. It is the entire "INP needs improvement"
in Clarity; LCP and CLS already pass.

**JSON.parse was tried 2026-07-29 and FAILED** (779ms vs 651ms baseline, and
+286kB). Do not retry it. The problem is volume, not encoding: we ship 6,394
questions so someone can answer ten.

Design that survives the Daily-7 constraint — selection must stay
date-deterministic across devices (it feeds `/c/` links and the "you beat X"
modal), so ship a lightweight **index** (`id + cat + club + diff`, no text) that
every selector reads, then fetch only the chosen rows' text.

⚠️ Cost grows with every wave. The bank went 6,010 → 6,394 today alone.

### 2. CLAUDE · Next club wave — SPANISH-FIRST
Wave L put five South American clubs live. **Their fans search in Spanish.** A
Boca fan types "quiz de Boca Juniors" and finds nothing of ours. We just built
inventory for a market we cannot be found in — the strongest localisation case
we have, and the exact opposite of the dead US one, because here the search
language genuinely differs.

Prove ONE page converts before scaling: `/es/quiz/boca-juniors/` with `hreflang`
back to the English page, then measure. Do not build 70 on a hunch.

Further clubs: `scripts/seo/leagues.mjs` maps 356, we have 71. **Saturation
finding from the tier-1 top-up: 75% of rejections were duplicates.** Chelsea and
Man Utd are full; Dortmund had room. Check saturation before commissioning.

### 3. CLAUDE · MP results screen
A playtester called it dull. It is shown immediately after playing a friend —
the exact share-and-return moment, and one of the few places the 2.8% can move.
Small surface, high leverage.

### 4. ALEX · Transfer Trail — spot-check 30 careers, then it launches
38 players ready (8 yours from July, 30 forged 2026-07-29). Routing is LIVE and
inert; it lights up the moment the answer log is frozen.

Spec §7.3 requires your 100% spot-check — a wrong career order is unfalsifiable
to the player and poisons the share loop.

**Rule learned, keep it:** nearly every source conflict was one pattern — a
player signs, then is immediately loaned out before playing for the parent.
Wikipedia lists the parent first; BeSoccer orders by season played. Treat
"signed then immediately loaned" as an automatic reject, never adjudicate.

After your check: I freeze `TRAIL_ANSWER_LOG`, set `TRAIL_ANCHOR_DAY` (it can
never move once live), and Trail #1 ships.

### 5. ALEX · 2-device MP test
Unblocks the last of the MP work. The stall watchdog is committed — it is a
real-network failure mode, and a green build proves compilation, not behaviour.

---

## 🟡 QUEUED

- **CLAUDE** · New game modes. Trail is next and nearly out. Judge later
  candidates on what actually mattered in the Trail decision: can it ship with a
  FROZEN zero-maintenance schedule (Footle's real advantage), and is its share
  card spoiler-free? A mode needing per-puzzle curation forever is a liability.
  `docs/transfer-trail-spec.md` §7 has the scoring that killed CHAIN despite it
  winning on cleverness.
- **CLAUDE** · Push US quiz-intent queries page 2 → 1: `arsenal quiz` 14.9,
  `arsenal quizzes` 19.3, `premier league quizzes` 26.7. These are the only US
  queries where a click is possible at all — the Gold Cup cluster ranks 8-10
  with ZERO clicks because Google answers those in the SERP itself.
- **CLAUDE** · Club-page reflow. 12,200px ≈ 14.5 phone screens. Do NOT treat
  "scroll stops at 21-25%" as fact — it is a bimodal mean.
- **ALEX** · Submit 1.4.0. iOS build 50 + Android AAB (versionCode 8) are built
  and verified, but ⚠️ they predate today's commits — re-sync first:
  `rm -rf dist && npm run build && npx cap sync ios && node scripts/prune-native-web-assets.mjs`
- **ALEX** · App Store screenshots. Method agreed: seed REAL state in the
  simulator (set a name, play a Footle and a Daily 7 so streak and rating are
  genuine). Never composite — both stores treat a fabricated screenshot as
  misrepresentation.
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

## HEALTH — verified 2026-07-29

- **Indexing is healthy.** 151 indexed / 18 not (queued + intentional
  canonicals); 56 known nine days ago. Sitemap 184 URLs, regenerating correctly,
  IndexNow pinging on prod deploys.
- **Nothing is broken.** Clean tree, tests green, zero build errors. The
  `webkit.messageHandlers` console error is NOT ours — proven in a clean room;
  it is injected by an extension or a social in-app webview.
- Bank 6,394 · 71 club pages · 25 player pages · 50 reference lists.

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
