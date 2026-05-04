# Self-review findings — 2026-05-02 (post Stage 1F.1/.3/.8)

Secondary review pass per tonight's brief. Six items investigated; below is what I found, what I shipped, and what's queued for review.

## Tonight's commit log (chronological)

| # | Commit | Description |
|---|---|---|
| 1 | `060a983` | Stage 1F.1 — V1 dead-code cleanup (ONLINE_MODES + pickOnlineQuestions) |
| 2 | `9114b16` | Stage 1F.3 — min-2-player Start gate |
| 3 | `3544eb3` | Stage 1F.8 — FAQ multiplayer copy (3 entries replacing the "coming soon" stub) |
| 4 | `1b3dc29` | Self-review — ProfileScreen a11y (K1: 2 div→button) + unmount guard (K2: mountedRef) |

**Deferred to tomorrow with 1F.6:** 1F.7 (OnlineGame + MultiplayerComingSoon deletion). Discovered during inventory that OnlineGame has 6 live references — deleting it means flipping the gate, which is the launch moment. Coupled to 1F.6.

---

## 1. Component scan — 4 untouched components

Picked by user-flow criticality + auth-boundary exposure. Results:

### QuizEngine (App.jsx:3026, ~220 lines)
Used by 8 game modes (classic / daily / balliq / survival / speed / legends / wc2026 / chaos). Highest user reach.

| Class | Result |
|---|---|
| 1 | Clean — single-render path with sentinel guards |
| 2 | Clean — onCompleteRef stable callback pattern |
| 3 | **Excellent.** wrongAnswersRef + allAnswersRef explicitly used to AVOID stale closure (prior bug per the comment at L3052-3056) |
| 4/5 | **I1 (Low):** L3091 `setTimeout(() => doAdvance(...), 800)` for timeout-correct case is not tracked. If user navigates within 800ms of timer expiry, doAdvance fires on unmounted (Class 5 React 18 warning, no leak). |
| 6 | Clean |
| 7 | Clean — only `try{haptic("select")}catch{}` which is acceptable |
| 8 | Clean — no localStorage |
| 9 | Clean |
| 10 | Clean |

**Verdict:** This component is in great shape. The ref-pattern discipline around terminal-only data (wrongAnswersRef, allAnswersRef) shows mature thinking — the comment block at L3052-3056 documents a prior stale-closure bug and the fix-via-ref pattern. Worth memorializing as a memory note (see #3 below).

### LocalGameScreen (App.jsx:4822, ~370 lines)
Complex turn / chunk / elimination state across 3 modes (classic / sprint / survival).

| Class | Result |
|---|---|
| 1 | Clean — mutually exclusive phases (handoff / question / locked / playerSwap / reveal / summary / done) |
| 2 | Clean — phase-keyed effects |
| 3 | OK — eslint-disabled deps cover render-time-stable values (players from config, scores not used in disabled effect bodies) |
| 4/5 | **J1 (Low):** L4911 `setTimeout(() => {...}, 800)` in pick() is not tracked. Same Class 4/5 risk as I1. |
| 6 | Clean — no optimistic UI |
| 7 | Clean |
| 8 | Clean |
| 9 | Three eslint-disabled effects (L4884, L4997, L5015) — each suppresses props/derived deps that are render-time stable for the effect's window. Defensible but worth a flag. |
| 10 | Clean |

**Verdict:** Solid architecture; the multi-phase state machine is well-structured. Two minor items above — neither blocking.

### ProfileScreenImpl (App.jsx:8337, ~412 lines)
Auth boundary, file upload, friends integration.

| Class | Result |
|---|---|
| 1 | Clean — authLoading skeleton handles the user-but-no-profile gap |
| 2 | Clean |
| 3 | Clean |
| 4 | Clean |
| 5 | **K2 (shipped `1b3dc29`).** handleCropConfirm setUploading guarded by mountedRef. |
| 6 | Clean |
| 7 | Minor — handleCropConfirm catch could `console.warn` for debug trail. Defer to Class 7 batch. |
| 8 | Clean |
| 9 | Clean |
| 10 | Clean |

**A11y finding (shipped `1b3dc29`):** K1 — `.profile-avatar` and `.profile-avatar-edit` were divs with onClick. Converted to buttons matching Settings B1 pattern.

### FriendsSection (App.jsx:7874, ~333 lines)
Realtime channel + RPC + auth-scoped queries.

| Class | Result |
|---|---|
| 1 | Clean |
| 2 | Clean — channel re-subscribes only on userId change (toast and loadFriendships are reference-stable when parent's onToast is stable, which it is via showToast useCallback in AppInner) |
| 3 | Clean — `excludedIds` properly memoized to avoid stale-closure in search effect |
| 4 | Clean — channel cleanup, debounced-search timeout cleanup, cancelled flag |
| 5 | **L2 (Low, deferred).** Multiple post-await setState risks (loadFriendships finally, sendRequest setResults, search setSearching). Each is small; bundle for a future sweep. |
| 6 | N/A |
| 7 | Clean — most catches surface to console.error or toast |
| 8 | Clean — no localStorage |
| 9 | Clean |
| 10 | **L1 (Medium, draft-first below).** Diagnostic logging + DEV-vs-PROD result-filter divergence at L7954-7986. Flagged for review. |

---

## 2. Stage 1 multiplayer fresh-eyes review

Components revisited: OnlineEntry, MultiplayerLobby, LobbyView/Loading/Error/Ended, MultiplayerGameplay, QuestionTimer, QuestionView, ScoreBar, HostAdvanceControls, useMultiplayerRoom hook.

**Diagnostic markers:** Confirmed `[MP-DIAG]` already cleared (1C.7.5 commit verified). Zero stale debug logging in Stage 1 code.

**Stale comments:** Six "Stage 1F may add..." speculative comments scattered throughout (L3508, L3510, L3960, L4132, L4420, L9585, L9597). All are appropriate forward-looking placeholders pointing at the right Stage 1F chunks (mode picker, animation polish, gate removal). Will get updated naturally as those chunks ship.

**QUESTION_DURATION_MS sync:** Verified at L3534. Constant still 20000. Memory note rule (`feedback_question_duration_constant.md`) intact.

**Dead code in Stage 1:** None remaining after 1F.1's removal of ONLINE_MODES + pickOnlineQuestions. The deprecated `OnlineGame` + `MultiplayerComingSoon` are coupled to the gate (1F.6/1F.7).

**No fresh-eyes regressions found.** Stage 1 code is in good shape.

---

## 3. Memory note retroactive applicability

| Memory note | Retroactive opportunities? |
|---|---|
| `feedback_render_order_trap.md` | Phase 2 audited 9 components for this; none triggered. The pattern doesn't appear elsewhere in the codebase by my read. **No action.** |
| `feedback_question_duration_constant.md` | Verified current state matches (client + server: 20000ms). **No drift.** |
| `feedback_phase_b_clear_list_principle.md` | Cross-checked all USER_SCOPED_STATIC_KEYS and USER_SCOPED_PREFIXES during AppInner Class 8 audit. No misuse found. **No action.** |
| `feedback_rpc_grants.md` | Out of scope (SQL lives in Supabase, not in repo). |
| `feedback_supabase_admin_defaults.md` | Same — SQL-side. |

**Worth memorializing tonight:** QuizEngine's wrongAnswersRef/allAnswersRef pattern (terminal-only data via ref to avoid stale-closure-through-state). This is a real reusable principle. Drafted as a memory note candidate (see "Pending memory note" section below).

---

## 4. TODO/FIXME/HACK catalog

Grepped src/, index.html, public/, vite.config.js, vercel.json:

| Location | Marker | Description | Severity / when |
|---|---|---|---|
| index.html:329 | TODO | Replace text pills with official "Download on the App Store" badges | Post-launch (requires Apple/Google badge assets + brand approval) |
| src/DesktopNav.jsx:27 | TODO | Same — official store badge replacement | Post-launch |

**Verdict:** Two TODOs, both same item, both post-launch. Nothing blocking.

False positive: "TOSHACK" matched on grep (footballer surname in word list). Filtered out.

---

## 5. Tests for Stage 1 multiplayer — recommendation (no code tonight)

The smoke-testing-only approach has caught real bugs (1C.7.4 cascade, 1C.6.1 joiner error flash) but doesn't guard against regressions when we touch nearby code. A small focused test surface would be high-value.

**Existing infrastructure:** `scripts/spike-1-realtime.mjs` + `scripts/spike-2-advance-race.mjs` are basically integration tests against a real Supabase instance. They were one-shot validation scripts, not run in CI.

### Recommended additions (V1.1 backlog, not tonight)

| Layer | What | Tool | Est effort | Value |
|---|---|---|---|---|
| **A. SQL race regression suite** | Promote spike-1 + spike-2 to a CI-runnable test pair. Add 3-4 more for: kick-during-answer, late-joiner mid-game, host-disconnect mid-advance, rapid-rejoin. Run nightly against staging Supabase. | Existing `node scripts/*.mjs` pattern + GH Actions cron | 4-6h | **High.** Catches SQL-contract regressions; mirrors the actual race-condition class that's bitten us. |
| **B. Hook state-machine unit tests** | useMultiplayerRoom — mock supabase (subscribe + RPC + postgres_changes). Test: initial fetch shape, INSERT/UPDATE/DELETE handlers, reconnect catch-up trigger, action error handling (the "joiner sees error" class from 1C.6.1). | vitest + a small mock-supabase shim (~50 lines) | 6-8h | **High.** Catches reducer-logic regressions in the most important hook in the app. |
| **C. Component phase-machine tests** | MultiplayerGameplay revealPhase — render with mocked hook return values for each phase combination, assert UI snapshot. Test: timer-expiry → advance, all-answered → advance, host-only single-fire guard (the 1C.7.4 class). | vitest + react-testing-library | 4-6h | **Medium.** UI-layer bugs are the most catchable via smoke testing already. |

**Recommend starting with A** — lowest setup cost (no test framework needed, existing script pattern), highest ROI on the bug class that's hurt the most.

**Recommend deferring B + C** to after V1 launch unless a regression actually bites in the first two weeks.

---

## 6. Other improvements spotted

### Bundle splitting (deferred — V1.1)

Bundle is 1341.82 kB single chunk. Vite has been warning all session. Three natural lazy-load splits would cut first-paint:

- `questions.js` (~4k lines, ~50% of bundle by line count) — only needed at first quiz start. `dynamic import()` in `getQs`/`getDailyQs`/etc.
- `ReviewScreen.jsx` — only loaded when REVIEWER_EMAIL signs in. Single user; current eager load is wasted bandwidth for everyone else.
- `FootballWordle` — large self-contained component (~300 lines + canvas/animation logic). Lazy-load on Wordle navigation.

**Estimated impact:** First-paint bundle could drop ~300-500 kB (rough estimate). Not measured.

**Why deferred:** Code-splitting requires ESM dynamic imports + Suspense boundaries + loading states. Touch surface is small but discipline-heavy. Not a fit for a single-day chunk; warrants a planned V1.1 effort.

### Pending memory note (draft for review)

Drafted but NOT saved — would value your call on the framing. Topic: terminal-only-data refs to avoid stale-closure-through-state.

```
---
name: Terminal-only data: prefer ref over state
description: When data is captured purely to emit at end-of-flow (never displayed mid-flow), use useRef instead of useState to avoid stale-closure bugs in the emit path.
type: feedback
---

When a piece of data is captured incrementally during a flow but only consumed at the end (passed up via onComplete, written to localStorage on close, etc.), prefer useRef over useState.

**Why:** useState introduces a closure-capture window. If the emit happens via a callback that captured an earlier render's state, the most recent additions to the array/object can be silently dropped. QuizEngine's wrongAnswersRef + allAnswersRef pattern (App.jsx:3052-3062) explicitly documents this — the prior implementation used setState and lost the final-question wrong answer because doAdvance captured the array before the most recent setWrongAnswers had landed.

**How to apply:** If a piece of data is never read in render (only emitted at end-of-flow), it does not need to be state. useRef avoids the re-render cost AND the stale-closure trap. State is for things that drive UI; refs are for things that just need to be available at the right moment.
```

---

## Pending decisions

### L1 (FriendsSection diagnostic cleanup) — needs your call

**File:** App.jsx:7954-7986 (inside FriendsSection's debounced search effect)

**What's there:**
- 7 `import.meta.env.DEV` console.log calls dumping the search inputs, supabase response, and filter state
- A DEV-vs-PROD result-filter split: `setResults(import.meta.env.DEV ? rawRows : filteredRows)` — DEV mode shows EVERYONE who matches the query (including the user themselves and already-friended users); PROD mode applies the `excludedIds` filter

**Comment context (L7973-7976):**
> "DIAGNOSTIC: temporarily bypass the excludedIds filter so we can see every row Supabase returns (including the user themselves and already-friended users). Restore the filter once the empty-results bug is understood."

**Concern:** This was instrumentation for a specific past bug ("empty results bug" — context unclear, possibly resolved long ago). Current state means DEV behavior diverges from PROD behavior — confusing for future debugging if anyone touches FriendsSection.

**Three options:**

A. **Full cleanup (recommended).** Remove all 7 DEV console.logs + remove the DEV-vs-PROD split + always apply `filteredRows`. Restores symmetric behavior. Behavior-changing for DEV mode (devs no longer see self/friends in search results) but matches PROD intent.

B. **Keep logging, drop the filter split.** Remove the DEV-vs-PROD result split (always apply filter) but keep the diagnostic logs for future investigations. Half-measure.

C. **Defer.** Leave as-is. The original bug context might still matter and we just don't have it documented anywhere.

Recommend **A** — the comment said "Restore the filter once the empty-results bug is understood." Three-plus months of production use without recurrence implies "understood." If a future bug needs the diagnostic, easier to add fresh instrumentation than to leave a permanent DEV/PROD divergence.

Approve A / B / C, or ask me to dig for more context (commit history of FriendsSection might surface the original bug).

---

## Summary deliverables (per tonight's brief)

- **4 Stage 1F commits shipped:** 1F.1 (`060a983`), 1F.3 (`9114b16`), 1F.8 (`3544eb3`). 1F.7 deferred (couples to 1F.6 / launch — discovered during inventory).
- **Self-review fixes shipped:** ProfileScreen a11y + mountedRef (`1b3dc29`).
- **Self-review findings report:** this document.
- **Stage 1F.2, 1F.4, 1F.5, 1F.6, 1F.7 ready for tomorrow.** All scoped in `STAGE_1F_SCOPE.md`. 1F.7 should bundle with 1F.6 per discovered coupling.

## What I left undone (with reasoning)

- **L1 awaits your call** before shipping. Behavior change in DEV mode warrants explicit approval.
- **Memory note for terminal-only-data refs** drafted but not saved. Wanted your sign-off on the framing first — adding a note is a small commitment but the pattern is real and worth memorializing.
- **Tests for Stage 1** flagged as V1.1 backlog with three-tier recommendation. Not a tonight-shippable scope.
- **Bundle splitting** flagged as V1.1 backlog. Same reasoning — discipline-heavy refactor, not a single-night task.
- **Class 7 console.warn batch** (B2 from Phase 2 + ProfileScreen handleCropConfirm + a couple of others) — current count is 3-4 sites. Below the threshold I'd cluster into a focused commit. Hold for whenever the count crosses ~6.
