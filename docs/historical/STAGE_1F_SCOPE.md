# Stage 1F — production rollout scope

Drafted 2026-05-02 after Phase 5 cleanup pass closed the audit backlog. Reviews tomorrow, then implement.

## Goals

1. Promote the Stage 1 multiplayer flow from gated early access (`?stage1=1`) to the default Online Multiplayer experience for everyone.
2. Strip the V1 deprecated stub + its supporting dead code.
3. Add the player-facing UX gaps that were intentionally deferred during 1A-1E (Start gate, mode picker, capacity picker).
4. Close out the residual animation roughness from 1C.7.6.
5. Update FAQ + onboarding copy to reflect the new flow.

## Scope (in)

- `?stage1=1` URL gate removal
- Min-2-player Start gate with disabled-button reason copy
- Mode picker on lobby (Classic 10Q vs Sprint 5Q)
- Capacity picker (2 / 3 / 4 / 6 — currently hardcoded to 4)
- Animation polish for question transitions (visual iteration, not blind tweaks)
- FAQ + Help screen multiplayer section update
- Delete `OnlineGame` stub + `MultiplayerComingSoon` component
- Delete unused `ONLINE_MODES` constant + `pickOnlineQuestions(mode)` helper
- Smoke test on production deploy across 2 browsers (Safari host + Chrome joiner)

## Scope (out — explicit defer)

- Native invite-link flow (currently `?join=CODE` deep link works; no app/iOS Universal Link integration)
- In-room chat
- Spectator mode
- Rematch flow (currently each game is one-shot; user re-enters lobby for next round)
- Cross-room presence ("3 friends online now")
- Difficulty picker (Stage 1 hardcodes medium-difficulty pool)
- Ranked / leaderboard tiers for multiplayer
- Push notifications for incoming invites

These are V1.1 / V2 scope. Not blocking Stage 1F.

---

## Sub-commit breakdown

Eight commits, ordered for incremental ship-ability. Each lands independently and the build stays green between them. Estimated hours assume normal iteration cadence (writeup → code → build → smoke-test); real time tracks roughly 1.5× the est for cold starts on a chunk.

### 1F.1 — V1 leftover cleanup (no behavior change yet) — **est 0.5h**

**Files:** `src/App.jsx`

Remove dead code surfaced by 1C.7.3's diagnostic phase + Phase 2 audit:
- `ONLINE_MODES` constant (App.jsx:3429) — array of `{id, name, desc, qCount}` mode descriptors used by V1's mode-pick step. No callers anymore.
- `pickOnlineQuestions(mode)` (App.jsx:3435) — V1's mode→question-pool router. Replaced by `pickMultiplayerQuestions` in Stage 1E.

**Verify before deletion:** `grep -n "ONLINE_MODES\|pickOnlineQuestions" src/App.jsx` returns only the definition lines + zero usage sites.

**Why ship first:** zero-risk dead-code removal. Reduces App.jsx by ~50 lines so subsequent diffs read cleaner.

---

### 1F.2 — Capacity picker on OnlineEntry — **est 1.5h**

**Files:** `src/App.jsx` (`OnlineEntry` at L3569)

**Current:** `handleCreate` calls `supabase.rpc("create_room", { p_capacity: 4, ... })` — capacity is hardcoded.

**Change:**
- Add capacity state: `const [capacity, setCapacity] = useState(4)`
- Add picker UI between the page header and Create Room button: 4 buttons (2 / 3 / 4 / 6), `.size-btn` style matching the existing Settings theme picker
- Pass `p_capacity: capacity` through to the RPC

**Visual:** Inline pill row, copy: "Room size" eyebrow above. Tap to select; no modal.

**Server side:** Already supports configurable capacity via `p_capacity` param. No SQL changes.

**Risks:**
- Capacity 6 with the current single-row ScoreBar might horizontally overflow on small screens. Verify ScoreBar handles overflow gracefully (it uses `overflow-x: auto` per L4622, so probably fine; sanity-check on a 360px viewport).

---

### 1F.3 — Min-2-player Start gate — **est 1h**

**Files:** `src/App.jsx` (`MultiplayerLobby` at L3702, host start button at L3870)

**Current:** Start button disabled only when `starting || players.length === 0`. So host alone can start a "solo multiplayer" game — wastes the room and the game-end screen looks odd.

**Change:**
- Disabled when `players.length < 2`
- Reason caption beneath the button (or as a tooltip-style helper) when disabled-due-to-min-players: `"Need at least 1 friend to start — share your room code: ${room.code}"`
- Existing player-count display at L3843 (`Players (${players.length}/${room.capacity})`) stays as-is; the start-gate caption gives the actionable why-disabled framing

**Edge case:** When the host arrives at the lobby, `players.length === 1` (just them). Caption shows. As soon as a joiner enters, `players.length === 2`, caption hides, button enables. When the joiner leaves (DELETE event arrives), back to 1, button re-disables.

**Risks:** None substantial. Pure UX polish.

---

### 1F.4 — Mode picker on lobby — **est 2h**

**Files:** `src/App.jsx` (`MultiplayerLobby` at L3702, `pickMultiplayerQuestions` at L3541, `actions.startGame` call at L3739)

**Current:** Hardcoded `pickMultiplayerQuestions(10)` for a 10-question Classic game.

**Change:**
- Add mode state: `const [mode, setMode] = useState("classic")` — values `"classic"` (10Q) and `"sprint"` (5Q)
- Mode picker UI in the lobby (host-only — joiners see the host's pick passively)
- `pickMultiplayerQuestions` signature stays `(count)`; just pass `mode === "sprint" ? 5 : 10`
- The host's mode pick is the source of truth — for the joiner experience, it's fine that the mode is implicit (they see "5 questions" or "10 questions" once startGame fires; we don't need to broadcast mode pre-start)

**Visual:** Two large pill cards stacked or side-by-side — matches the existing local multiplayer / clubquiz mode-pick patterns.

**Risks:**
- Sprint games end fast (5Q × ~10s each = 50s + pauses). Make sure the "Game ended, host advance" screen doesn't feel rushed at the end. Likely fine but worth noting in the smoke test.
- Mode picker shouldn't change while game is in progress (it's lobby-only). State already auto-resets on lobby re-mount.

**Why split from 1F.3:** Two distinct pieces of UI even if they sit on the same screen. Splitting lets each ship + smoke-test cleanly.

---

### 1F.5 — Animation polish (visual iteration) — **est 3-4h**

**Files:** `src/App.jsx` (`MultiplayerGameplay` + `QuestionView` + `ScoreBar`)

This is the residual roughness from 1C.7.6 that the user described as "still feels laggy" after the snap-secondary-transitions pass. Since 1C.7.6's recommendation was to use visual iteration tools (screenshots/GIFs) rather than blind tweaks, this chunk is the most exploratory of the lot and the time est is widest.

**Candidates to investigate (pick what applies after looking at screencaps):**

1. **Question prompt mount-fade** — currently the prompt snaps in on every advance. The 1C.7.6 commit explicitly removed its opacity transition. Worth re-evaluating with visual capture: a 80-100ms ease-in might feel gentler without the "pile-up" 1C.7.5 was diagnosing.
2. **Stagger reveal-phase color across the 4 options** — 50ms delay between buttons creates a gentle wave instead of all 4 painting simultaneously. Tested in 1C.7.5 followup notes.
3. **Score-bar number-pop animation** — when a player's score updates after a correct answer, the new number could pop (scale 1.15 → 1, 200ms cubic-bezier). Currently it just changes value with no visual signal.
4. **Answer-locked indicator entrance** — the "Answer locked — waiting for others" banner currently appears via conditional render (snap). A 100ms slide-down-fade-in might soften it.
5. **Reveal banner entrance** — same pattern as #4 ("Next question in 2s").

**Methodology:**
- Capture 2-3 screencap GIFs of current state (post-tap to next-question mount cycle)
- Pick 1-2 candidates from the list above
- Implement, capture again, side-by-side compare
- Ship if improved; revert if no perceived change
- DO NOT ship blind tweaks — 1C.7.5 → 1C.7.6 → 1F.5 has been a slow-motion lesson in this

**Hard rules:**
- Stay within "single source of motion" principle — don't add overlapping animations to the same phase change
- Keep timer-bar countdown animation as-is (smooth countdown shouldn't tick in jumps)
- Total animation time on any single phase change ≤ 200ms cumulative (not 200ms per element × N elements)

**Risks:**
- Time est is wide because exploration is open-ended. If 2h in nothing feels meaningfully better, accept the current state and move on. Don't sink a full day chasing micro-polish.

---

### 1F.6 — `?stage1=1` gate removal — **est 1.5h**

**Files:** `src/App.jsx` (gate def L9598, branch sites L11171 + L11186)

**Current:** URL search param `stage1=1` flips `STAGE_1_ENABLED`. When true, "Online Multiplayer" tile routes to `OnlineEntry` (Stage 1). When false, routes to `OnlineGame` (V1 stub) which renders `MultiplayerComingSoon`.

**Change:**
- Delete `STAGE_1_ENABLED` useMemo
- Delete the `STAGE_1_ENABLED ? ... : ...` ternaries — always route to Stage 1 path
- Remove "Stage 1 early access" / "Coming soon" copy from the mode tile descriptor (L11186) — replace with permanent multiplayer copy
- Mode tile description: `"Play with friends in real-time"` or similar

**Why this lands AFTER the lobby UX (1F.2-1F.5):** flipping the gate exposes the new flow to all users. We want Capacity / Start gate / Mode picker / Animation polish landed first so the first-impression experience is the polished one, not the half-finished one.

**Risks:**
- This is the "reveal moment". Test the full create-join-play-end flow on production after deploy before considering Stage 1F shipped.

---

### 1F.7 — Delete `OnlineGame` stub + `MultiplayerComingSoon` — **est 0.5h**

**Files:** `src/App.jsx`

**Current:**
- `MultiplayerComingSoon` component (L3474) — full-screen placeholder shown when V1's online tile was tapped
- `OnlineGame` (L3521) — three-line wrapper: `function OnlineGame({ onBack }) { return <MultiplayerComingSoon onBack={onBack} />; }`
- AppInner mounts `OnlineGame` when `screen === "online"` (L11380)

**Change:**
- Delete `MultiplayerComingSoon` definition
- Delete `OnlineGame` definition
- Remove the `screen === "online"` mount in AppInner
- Verify no remaining `screen === "online"` references; routing now uses `screen === "online-stage1"` and `screen === "online-stage1-lobby"` exclusively

**Why this lands AFTER 1F.6:** The gate removal is what disconnects the routing path TO `OnlineGame`. Once nothing routes there, deletion is safe.

**Risks:**
- Deep-link `?join=CODE` flow currently routes through V1's `OnlineGame` via `pendingJoinCode` (`autoJoinRoutedRef` calls `startMode("online")` which sets `screen === "online"`). After 1F.6/1F.7 this path needs to route to Stage 1 instead. Verify before merging — the auto-join useEffect at L10129 may need a small change to set `screen === "online-stage1"` instead of going through `startMode("online")`.

---

### 1F.8 — FAQ + Help screen multiplayer copy — **est 1h**

**Files:** `src/App.jsx` (Help screen content — search for "How do I play with friends" or similar)

**Current:** FAQ copy was updated during the audit ("Help & FAQ + Privacy stale 'Online 1v1' copy" per memory) but probably still contains placeholder text or doesn't reflect the lobby + invite flow.

**Change:**
- Update the multiplayer FAQ section to describe the actual flow:
  - "How do I play with friends?" → describe Create Room → share 6-char code → friends join via the code → host taps Start
  - Add: "How do I share an invite link?" → describe `balliq.app/?join=CODE` deep link
  - Add: "What happens if my friend joins late?" → describe the late-joiner reveal-only experience
- Also re-check Privacy screen for any stale "online" references

**Risks:** None. Pure copy.

---

## Total estimate

| Chunk | Est hours |
|---|---|
| 1F.1 V1 dead-code removal | 0.5 |
| 1F.2 Capacity picker | 1.5 |
| 1F.3 Min-2-player Start gate | 1.0 |
| 1F.4 Mode picker | 2.0 |
| 1F.5 Animation polish (exploratory) | 3-4 |
| 1F.6 Gate removal | 1.5 |
| 1F.7 V1 stub deletion | 0.5 |
| 1F.8 FAQ + Help copy | 1.0 |
| **Total** | **11-12 hours** |

Realistic single-day target: 1F.1 through 1F.4 + 1F.7-1F.8 (skipping animation polish + gate removal). That's ~6h of focused work and gets the new lobby UX shippable.

Animation polish (1F.5) + gate removal (1F.6) deserve a separate session with fresh eyes — the polish work especially benefits from waiting a day so eye fatigue doesn't bias the comparison.

---

## Risks + open questions

1. **Auto-join re-routing.** The deep-link `?join=CODE` flow currently funnels through V1's `screen === "online"`. After 1F.6/1F.7 it needs to route directly to `screen === "online-stage1-lobby"` with the code pre-loaded. Need to verify `autoJoinRoutedRef`'s effect handles the Stage-1 code-mount sequence correctly — may need `setStage1RoomCode(pendingJoinCode); setScreen("online-stage1-lobby")` instead of `startMode("online")`.

2. **Capacity picker default.** Current hardcode is 4. Empirically: most invite-with-friends scenarios are 1v1 or 1v1v1. Defaulting to 2 (smallest meaningful multiplayer) might match user intent better than 4. Could also default to 4 as "headroom" in case more friends join. Recommend defaulting to **4** for headroom — a 2-capacity room locks out a 3rd friend with no warning and the host has to recreate.

3. **Mode picker default.** Recommend defaulting to **classic** (10Q) — matches the established Daily / Classic format expectation. Sprint is the variant.

4. **Animation polish budget.** 3-4h is a soft cap. If 2h in nothing feels meaningfully better via visual capture, ship the current state and note "Stage 1F animation polish marked acceptable pending v1.1 revisit." Don't sink another half-day.

5. **`?stage1=1` URL backward compat.** After 1F.6, `balliq.app/?stage1=1` is just `balliq.app` with an ignored query param. No breakage; documented users (if any) just see normal Online Multiplayer. Could log a one-time console message for any URL with `stage1=1` if we want to know whether anyone used the back-channel — probably overkill.

6. **First-game-in-production risk.** Stage 1 has been smoke-tested across 5+ multi-browser sessions during 1C iterations. Real users with real-world network conditions (poor wifi, mobile data, multi-tab Safari) may surface edge cases. Have a rollback plan: if blocking issues surface within 24h of 1F.6 deploy, revert to gated mode by re-introducing `STAGE_1_ENABLED` (5-line revert).

---

## Smoke test plan (post-1F.6/1F.7 deploy)

Two-browser session, both signed-in real accounts (not guest), both on production URL (no `?stage1=1`).

1. **Create Room flow**
   - Browser A taps Online Multiplayer tile → routes to OnlineEntry
   - Browser A picks capacity (try 3) → taps Create Room → routes to MultiplayerLobby
   - Verify: 6-char code visible, "1/3 players", Start button disabled with "Need at least 1 friend" caption

2. **Join Room flow**
   - Browser B taps Online Multiplayer tile → routes to OnlineEntry
   - Browser B taps "Join with Code" → enters code from Browser A → taps Join
   - Verify: Browser A's lobby updates to "2/3 players" via realtime, Start button enables
   - Verify: Browser B sees same lobby with both players

3. **Mode picker flow**
   - Browser A taps mode picker → switches to Sprint
   - Verify: Browser B doesn't see mode change (mode is implicit until Start)
   - Browser A taps Start
   - Verify: both browsers transition to gameplay with 5 questions

4. **Gameplay golden path**
   - 5 questions, both players answer (mix correct/wrong)
   - Verify: timer counts down smoothly, scores update on ScoreBar, reveal banners appear
   - Verify: animation transitions feel acceptable (the 1F.5 polish target)

5. **Game-end flow**
   - 5th question completes → "Game over" / final-score screen shown to both
   - Verify: scores match between browsers, host can return to home

6. **Edge cases (one each)**
   - Joiner refreshes mid-game → reconnect catch-up works (Stage 1B feature)
   - Host disconnects mid-game → host-disconnect banner appears for joiner
   - Solo "Start" attempt — Browser A creates room then immediately taps Start → button disabled → caption visible
   - Deep link `?join=CODE` from a fresh tab → routes through Login (if signed out) → into the lobby with code pre-loaded

7. **FAQ check**
   - Settings → Help & FAQ → scroll to multiplayer section → verify copy reads cleanly + matches the actual flow

If all 7 pass, Stage 1F shipped. If any fail, decide between fix-forward and rollback (1F.6 revert).
