# Stage 1 multiplayer — engineering reference

Captured 2026-05-02 immediately after Stage 1F launch (`0eadba6`) while the architecture is fresh. This is dry reference, not narrative — the goal is making "where is X handled?" a fast answer for someone (us in 6 weeks, or anyone else) who needs to touch this code.

Line numbers reference `src/App.jsx` and `src/useMultiplayerRoom.js` at the time of writing (commit `46e6990` or later). They rot fast — use them as starting points, not addresses. The commit hashes anchored to bug fixes don't rot.

---

## File map — where things live

| Concern | Location |
|---|---|
| **Hook** — single source of truth for one room | `src/useMultiplayerRoom.js` |
| Question pool selector for multiplayer games | `src/App.jsx` `pickMultiplayerQuestions` (~L3454) |
| Per-question timer constant (must match server) | `src/App.jsx` `QUESTION_DURATION_MS` (~L3476) |
| Reveal pause between answer-locked and next-question | `src/App.jsx` `REVEAL_PAUSE_MS` (search constant) |
| Entry screen — Create Room / Join with Code | `src/App.jsx` `OnlineEntry` (~L3482) |
| Lobby orchestrator + render-branch dispatcher | `src/App.jsx` `MultiplayerLobby` (~L3661) |
| Lobby UI (the actual rendered lobby JSX) | `src/App.jsx` `LobbyView` (~L3769) |
| Lobby loading / error / ended sub-views | `src/App.jsx` `LobbyLoading`, `LobbyError`, `LobbyEnded` |
| Gameplay screen — phase machine + answer flow | `src/App.jsx` `MultiplayerGameplay` (~L3988) |
| Per-question 20s countdown bar | `src/App.jsx` `QuestionTimer` (~L4392) |
| Question + 4 option buttons + reveal coloring | `src/App.jsx` `QuestionView` (~L4479) |
| Compact horizontal player score strip | `src/App.jsx` `ScoreBar` (~L4629) |
| Host-only Next/Skip/End controls | `src/App.jsx` `HostAdvanceControls` |
| Routing — `screen === "online-stage1*"` mounts | `src/App.jsx` `AppInner` (~L11540 area) |
| Auto-join from `?join=CODE` deep links | `src/App.jsx` `AppInner.autoJoinRoutedRef` effect (~L10250) + `OnlineEntry`'s `autoJoinCode`-prop effect |
| FAQ / Help screen multiplayer copy | `src/App.jsx` `FAQ_ENTRIES` (~L7208) |
| SQL contract regression suite | `scripts/spike-1-realtime.mjs`, `scripts/spike-2-advance-race.mjs`, `scripts/lib/spike-utils.mjs` |
| CI workflow for the spike suite | `.github/workflows/spike-nightly.yml` |
| Spike suite docs | `scripts/README.md` |

---

## SQL schema (reconstructed from client usage)

The SQL itself lives in the Supabase project (not in this repo). The client treats both tables as opaque — the only writes happen through the SECURITY DEFINER RPCs. SELECT is allowed for room members via the `is_room_member` helper.

### `game_rooms`

| Column | Notes |
|---|---|
| `id` (uuid PK) | Server-generated. The hook subscribes by `id`, not `code`. |
| `code` (varchar 6) | Human-friendly room code (e.g., `ABC123`). Set by `create_room`. Unique while room is active (state ≠ ended). |
| `state` ('lobby' / 'playing' / 'ended') | Drives the lobby render branch. Lobby fetch filters out `state='ended'` (`useMultiplayerRoom.js` L97). |
| `current_question` (int) | 0-indexed. Bumped by `advance_question`. Each client's gameplay screen re-renders the current question on `useEffect([room.current_question])`. |
| `questions` (jsonb array) | Frozen at `start_game` — array of `{q, o, a, cat, diff, _histKey}` shapes from `pickMultiplayerQuestions`. Length is the game length (5 for Sprint, 10 for Classic). |
| `capacity` (int) | Set by `create_room`. Range `{2, 3, 4}` per the 1F.2 picker. `join_room` enforces this; over-capacity attempts hit errcode `53300`. |
| `host_id` (uuid FK auth.users) | Whoever created the room. `advance_question` and `end_game` reject non-host callers with errcode `42501`. |
| Timestamps | `created_at`, `started_at`, `ended_at` (existence inferred; not directly read by client). |

### `room_players`

| Column | Notes |
|---|---|
| `id` (uuid PK) | Server-generated. |
| `room_id` (uuid FK game_rooms) | Cascade DELETE on room end. |
| `user_id` (uuid FK auth.users) | Real auth user — guests can't join (UI guards in `FriendsPicker` + `startMode("online")`). |
| `name` (varchar) | Display name. Captured at `join_room` time from the user's `auth_profile.username` or local profile name. |
| `avatar` (varchar) | Emoji string. Currently always `"⚽"` from `OnlineEntry` (no avatar picker yet). |
| `score` (int) | Bumped by `submit_answer` when the answer matches the question's correct index. |
| `answered_question` (int) | The HIGHEST question index this player has answered. Drives the "all answered" check on the client. |
| `joined_at` (timestamptz) | Hook sorts players by this for stable display order. |

### `REPLICA IDENTITY FULL`

Both `game_rooms` and `room_players` need `REPLICA IDENTITY FULL` set on the SQL side. Without it, DELETE events arrive in the realtime payload with only the primary key; the client can't tell which player left. The `room_players` DELETE handler at `useMultiplayerRoom.js:165` does:

```js
} else if (payload.eventType === 'DELETE' && payload.old) {
  setPlayers(prev => prev.filter(p =>
    !(p.room_id === payload.old.room_id && p.user_id === payload.old.user_id)
  ));
}
```

This requires `payload.old` to have `room_id` and `user_id`. With default REPLICA IDENTITY (which is the primary key only), `payload.old` would only have `id`. The handler wouldn't be able to identify the row.

Validated by `scripts/spike-1-realtime.mjs` — the cascade-DELETE test fires a DELETE on `_spike_room` and asserts BOTH the explicit room delete AND the cascaded player delete arrive with their full payloads.

**Memory note:** `~/.claude/projects/-Users-alexanderbrynolsen-ball-iq/memory/project_stage_1_spike_findings.md`.

### `is_room_member` SECURITY DEFINER helper

RLS on `game_rooms` and `room_players` allows `SELECT` only when the caller is a member of the room. The naive policy — "EXISTS (SELECT 1 FROM room_players WHERE user_id = auth.uid() AND room_id = ...)" — would recurse: evaluating the RLS on `room_players` requires another SELECT against `room_players`, which evaluates RLS again, etc.

`is_room_member(p_room_id uuid)` is a SECURITY DEFINER function that runs with elevated privileges, bypassing RLS, returning a boolean. The RLS policy calls this helper instead of inlining the EXISTS. Because SECURITY DEFINER bypasses RLS for the helper's own queries, no recursion.

The hook's initial fetch (`useMultiplayerRoom.js:91-117`) trusts that this helper is in place — if RLS recursion broke, every `select * from game_rooms` would hang.

---

## The 7 RPCs

All SECURITY DEFINER. All take a `p_code` arg (the human room code) except `submit_answer` and `advance_question` which take `p_code` plus an expected-state param. All return a JSONB object.

Source of truth is the SQL function bodies in Supabase. The shapes documented here come from `useMultiplayerRoom.js` action callbacks and the consumer code that handles the return values.

### `create_room(p_capacity int, p_name text, p_avatar text) → { code, room_id }`

Creates a `game_rooms` row in `state='lobby'` with caller as host, plus the host's `room_players` row. Generates a unique 6-char code.

**Caller:** `OnlineEntry.handleCreate` (~L3491).

**Failure modes:** generic RPC error → message surfaces inline.

### `join_room(p_code text, p_name text, p_avatar text) → { room_id }`

Inserts a `room_players` row for the caller into the room with the given code.

**Caller:** `OnlineEntry.handleJoin` (~L3540) and `OnlineEntry`'s `autoJoinCode` effect.

**Errcodes** (from `OnlineEntry.handleJoin` switch):
- `53300` — room is full (capacity reached)
- `P0002` — no row found (invalid code OR room ended)
- `42P01` — room isn't accepting joins (state ≠ 'lobby')
- generic — falls through to `error.message`

### `start_game(p_code text, p_questions jsonb, p_capacity int) → { started: bool, reason?, current_count? }`

Host-only. Validates roster size hasn't changed since start was tapped, freezes the questions array onto the room, flips state to 'playing', sets `current_question = 0`.

**Caller:** `MultiplayerLobby.handleStart` (~L3700). Passes `pickMultiplayerQuestions(mode === "sprint" ? 5 : 10)` and current `players.length` as the expected capacity.

**Return shape:**
- `{ started: true }` — success. Realtime UPDATE on `game_rooms.state` triggers all clients to switch to gameplay.
- `{ started: false, reason: 'roster_changed', current_count: N }` — someone joined or left between the host's tap and the RPC. Host re-confirms.
- `{ started: false, reason: <other> }` — generic block (e.g., not host, room state wrong).

### `submit_answer(p_code text, p_question_idx int, p_answer_idx int, p_lock_time int) → { accepted: bool, reason?, error? }`

Records the caller's answer for the given question. `p_answer_idx` is `0-3` for a real pick or `-1` for a timeout.

**Caller:** `MultiplayerGameplay.handleAnswerPick` (~L4053) and `handleTimeoutAutoSubmit` (~L4081).

**Server validation:**
- Caller is in the room
- `p_question_idx === room.current_question` (else `accepted: false, reason: 'question_idx_mismatch'`)
- Caller hasn't already answered this question (else `accepted: false, reason: 'already_answered'` — the client treats this as silent because the optimistic state is already correct)
- `p_lock_time` is within the per-question budget (server-side cap is the same `QUESTION_DURATION_MS` as the client constant — keep them in sync, see "Memory note" below)

**Side effects:** bumps `score` if correct; sets `answered_question = p_question_idx`. Both visible to other clients via the `room_players` UPDATE realtime stream.

**Memory note:** `feedback_question_duration_constant.md`. Client `QUESTION_DURATION_MS` (`App.jsx:~3476`) and server-side cap MUST match. Drift = unfair scoring. Touch both in the same change set.

### `advance_question(p_code text, p_expected_question int) → { advanced: bool, reason?, current_question?, error? }`

Host-only. Moves the room from question N to N+1, OR transitions to `state='ended'` if N was the last question. The `p_expected_question` arg is the **expected current state** — server uses `FOR UPDATE` to lock the row, then verifies `current_question === p_expected_question` before mutating.

**Caller:** `MultiplayerGameplay`'s advance fire effect (~L4158). Joiners do NOT call this — see the Stage 1C.6.2 fix below.

**Why the gate exists:** Multiple sources can want to advance the same question (host's manual "Next" button, an auto-advance triggered by all-answered, an auto-advance triggered by the timer). Without the gate, two RPCs racing on the same room would both succeed → `current_question` jumps from 0 to 2, skipping 1.

**Why `FOR UPDATE` and not application-level locking:** Postgres row locking is the only correct level for this. Application-level locks can't survive a process restart and don't compose with cascading event handlers. The `FOR UPDATE` ensures only one transaction at a time can be inside the gate's check-then-mutate window.

**Validated by `scripts/spike-2-advance-race.mjs`:** 70 iterations across 2/3/4-way concurrency. Asserts exactly one winner, all losers see `advanced: false, reason: 'expected_mismatch', current_question: 1`.

**Return shape:**
- `{ advanced: true }` — gate passed, room mutated.
- `{ advanced: false, reason: 'expected_mismatch', current_question: <new value> }` — another caller already advanced. Idempotent no-op for this caller.
- `{ advanced: false, error: ... }` — only host can call (errcode 42501) or some other server-side rejection.

### `leave_room(p_code text) → { left: bool }`

Removes the caller's `room_players` row. Other clients see the DELETE event via realtime (which is why REPLICA IDENTITY FULL matters — see above).

**Caller:** `useMultiplayerRoom.actions.leave` (called by `MultiplayerLobby.handleLeave` and `MultiplayerGameplay.handleLeave`), plus the wordmark Home click handler (`App.jsx:handleHomeClick`) when leaving mid-room.

If the host leaves, the room enters a "host disconnected" state visible to remaining players (see `MultiplayerGameplay.hostStillPresent` at ~L4076).

### `end_game(p_code text) → { ended: bool }`

Host-only. Flips state to 'ended'. Other clients see the UPDATE → `MultiplayerLobby` switches to `LobbyEnded` view.

**Caller:** referenced in `useMultiplayerRoom.actions.end`. No production caller currently — `advance_question` handles end-of-game when called past the last question. The RPC is preserved for future use cases (e.g., a "End game now" host control mid-game).

---

## Client architecture — `useMultiplayerRoom.js`

Single hook, single source of truth for one room. Returns:

```js
{
  room,           // game_rooms row | null
  players,        // room_players[] sorted by joined_at asc
  myPlayer,       // shortcut: row for current auth user, or null
  isHost,         // boolean: room.host_id === auth.uid()
  loading,        // true during initial fetch (and on code transitions)
  error,          // string | null — INITIAL FETCH errors only, never RPC errors
  channelStatus,  // 'idle' | 'connecting' | 'subscribed' | 'closed' | 'error'
  actions: { startGame, submitAnswer, advance, leave, end },
}
```

### Lifecycle

1. **Mount with code** → `setLoading(true)`, fetch `game_rooms` by code, then `room_players` by `room_id`, set state, subscribe to realtime channel.
2. **Subscribe** → ONE channel (`room:${roomData.id}`), TWO `postgres_changes` filters (one per table). Spike 1 validated this pattern.
3. **Subscribe success** → `channelStatus = 'subscribed'`, ready.
4. **Realtime events** → handlers update `room` / `players` state directly.
5. **Subscribe drops** (`'CLOSED'` / `'CHANNEL_ERROR'`) → `channelStatus` flips. After re-subscribe (`'SUBSCRIBED'` again), the post-subscribe handler triggers `refetchInitialState(roomId)` to catch up on any events missed during the dropout.
6. **Code change or unmount** → set `cancelled = true`, `supabase.removeChannel(channel)`.

### Why hook `error` is initial-fetch only

Originally (Stage 1B/1C), the action callbacks called `setError(error.message)` on RPC failure. **This was a bug** because joiners ALSO call some actions that legitimately fail server-side:

- Joiners' `advance_question` calls return errcode 42501 ("only host can advance")
- Post-kick callers' `submit_answer` calls return "caller not in this room"

Under the old design, `setError` set the hook's error → `MultiplayerLobby`'s render dispatcher saw `error` truthy → rendered `LobbyError` → the joiner's gameplay UI was replaced with an error screen.

**Fix (Stage 1C.6.1, commit `31b5de4`):** stripped `setError` from all 5 action callbacks. Each action returns the raw RPC payload to the caller. Consumers handle errors locally via the returned object (`{accepted: false, error: ...}`, `{advanced: false, error: ...}`, etc.). The hook's `error` state is reserved for fatal lobby-level concerns: initial fetch failure, room not found.

This is documented in the comment block at `useMultiplayerRoom.js:218-231`. **Don't re-introduce `setError` calls inside the action callbacks** — it'll resurface this exact bug class.

### The DELETE handler quirk

`useMultiplayerRoom.js:165-170` reads `payload.old` (not `payload.new`) for DELETE events. This requires `REPLICA IDENTITY FULL` on `room_players` (see SQL section). If `payload.old` ever returns just `{id: ...}` and nothing else, the REPLICA IDENTITY was changed.

### Reconnect catch-up

`useMultiplayerRoom.js:175-192` — on re-subscribe after a dropped connection:

```js
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    setChannelStatus(prev => {
      if (prev === 'closed' || prev === 'error') {
        refetchInitialState(roomData.id);  // catch up on missed events
      }
      return 'subscribed';
    });
  }
  // ...
});
```

Events fired during the dropout are LOST — Supabase Realtime doesn't replay. The catch-up re-fetches the full `game_rooms` row + `room_players` array. If `room.current_question` advanced during the dropout, the client picks it up here.

This is what makes mid-game refresh / brief network flap survivable.

---

## Component architecture

### `MultiplayerLobby` — render branch ordering matters

`MultiplayerLobby` (~L3661) is the dispatcher. It consumes the hook then renders one of five sub-views:

```js
if (error)               return <LobbyError ... />;     // 1
if (loading || !room)    return <LobbyLoading />;        // 2
if (room.state === "ended")    return <LobbyEnded ... />;  // 3
if (room.state === "playing")  return <MultiplayerGameplay ... />;  // 4
return <LobbyView ... />;  // default — state === 'lobby'
```

**The order is load-bearing.** In Stage 1C.1.1, the order was reversed (`if (loading || !room)` BEFORE `if (error)`). On Safari first paint after navigation from `OnlineEntry`, the initial state was `loading=false, room=null, error=null` (the useEffect that flips `loading=true` hadn't fired yet). The reverse order routed through the `error || !room` branch with `error=null` → briefly rendered `LobbyError` with no error text (yellow triangle flash) → next paint rendered `LobbyLoading`.

**Fix (Stage 1C.1.1):** explicit `if (error)` first. Initial state has `error=null`, so the first branch falls through; `if (loading || !room)` catches the truthy `!room`; `LobbyLoading` renders. No flash.

**Memory note:** `feedback_render_order_trap.md`. The principle generalizes: components with multiple `if (X) return Y` branches should put explicit-state checks (error, ended) BEFORE fallback checks (loading, missing data). Initial state should hit the loading branch, not the error branch.

### `MultiplayerGameplay` — `revealPhase` state machine

Phase machine (`MultiplayerGameplay` at ~L3988):

```
answering → revealing → advancing → (back to answering on next Q)
                                  → (stuck on advance error)
```

| Phase | Meaning | Transitions out |
|---|---|---|
| `answering` | Players can tap an option. Timer counts down. | `→ revealing` when all answered OR timer expires OR host taps "Next Question". |
| `revealing` | Correct answer is colored green; wrong picks red. ~2s pause (`REVEAL_PAUSE_MS`). | `→ advancing` after `REVEAL_PAUSE_MS` OR host taps "Skip ahead". |
| `advancing` | Waiting for `advance_question` RPC to complete. UI dimmed. | `→ answering` when realtime UPDATE on `room.current_question` arrives (the question-advance useEffect resets phase). `→ stuck` if host's RPC errors. |
| `stuck` | Host's `advance_question` failed (network, server). UI shows an actionable indicator. | Host can manually retry via the advance button (effect re-fires when phase changes back). |

Each client runs its OWN phase machine. The SQL `expected_question` gate (validated by Spike 2) handles the case where multiple clients race to advance — first wins, others get `expected_mismatch` no-op.

### Only the host fires `advance_question`

The advance fire effect at `~L4158` has `if (!isHost) return;` early. Joiners stay in `'advancing'` phase silently and wait for the realtime UPDATE on `game_rooms.current_question` to ripple in (which their question-advance useEffect at ~L4030 reacts to by resetting phase to `'answering'`).

**Why (Stage 1C.6.2, commit `bf73740`):** before this guard, every client fired `advance_question`. Joiners' calls always failed with errcode 42501 ("only the host can advance"). The error path used to flash a red banner every transition.

The post-1C.6.2 flow: host fires the RPC, server mutates, realtime broadcasts the UPDATE, all clients (host included) see the change, phase resets.

### Single-fire guard on the advance fire effect

`MultiplayerGameplay` uses `advanceInFlightRef` (~L4010) to gate `actions.advance()` to ONCE per `'advancing'` phase transition. Without it, the effect re-ran on every render where its dependencies changed — and the `actions` object is recreated by `useMultiplayerRoom` on every render (because the inner `advance` callback's `useCallback` deps include `room`, which updates on every realtime event).

The stale closure had `revealPhase='advancing'` for several renders between the realtime UPDATE arriving and the question-advance useEffect resetting phase to `'answering'`. Each stale-closure run of the advance effect called `actions.advance()` again, cascading through ALL remaining questions in <1 second. User-visible symptom: "Q2/Q3/Q5/Q6 each mounted ~500ms — questions rocketing through."

**Fix (Stage 1C.7.4, commit `590d1a6`):**
1. `advanceInFlightRef.current = true` after first call; check at top of effect; reset on phase transition out of `'advancing'` (the early return at ~L4159).
2. Removed `actions` from the effect's dep array (`eslint-disable-next-line react-hooks/exhaustive-deps`). The closure's actions reference is stale-but-fine: server's `expected_question` check tolerates one-step-stale current_question (returns `expected_mismatch`, silent no-op).

**Why both fixes:** the ref guard alone wouldn't help if the effect itself genuinely needed to re-run with fresh deps. Excluding `actions` from deps stops the wasteful re-runs in the first place; the ref guard catches anything that slips through.

The rationale lives in the long comment block at `MultiplayerGameplay:4122-4157`. Read it before changing the advance fire effect.

### `QuestionView` — three rendering states

`QuestionView` (~L4479) renders the same 4 option buttons in three different visual states:

| State | When | Visual |
|---|---|---|
| **Answering** | `revealing=false, lockedAnswerIdx=null` | All options at default colors. Tappable. |
| **Locked** | `revealing=false, lockedAnswerIdx=N` | Player's pick gets neutral slate border (`MP_LOCK_COLOR`). Other options dim to 0.5 opacity. Not tappable. Slate (not green) so the pre-reveal state doesn't suggest correctness. |
| **Revealing** | `revealing=true` | Correct option gets green border + green letter pill + ✓ marker. Player's wrong pick (if any) gets red border + red letter pill + ✗ marker. Untouched + correct-not-picked options stay default. |

The `revealing` prop is derived in `MultiplayerGameplay` (~L4214) from `revealPhase !== 'answering'` PLUS guards against stale closure (see the comment at ~L4214 — "Stage 1C.7.1" notes a derived form to handle a one-frame intermediate state).

### Single source of motion (Stage 1C.7.6)

After multiple stutter-bug iterations through 1C.7.x, the principle landed at **only one element animates during a phase change**: the option button color (border + background, 0.1s ease).

Everything else snaps:
- Question prompt opacity transition: removed
- Dim wrapper around timer area: opacity transition removed
- Score chips, banners, host control labels: no transitions, conditional render only
- The `transitionsEnabled` first-frame gate in `QuestionView` (~L4482) suppresses option button transitions on the first paint after question advance, so the new question doesn't briefly inherit prior reveal coloring as its "from" state

**Don't add transitions to other elements during phase changes** without testing for animation pile-up. The history (1C.7.5 → 1C.7.6) shows that overlapping animations during phase changes feel chaotic even when each individual transition is short.

---

## Bug class catalog (anchored to fix commits)

These are the patterns that bit Stage 1 and how to recognize them in future work.

### Class 1 — render-order trap

**Symptom:** First-paint flash of an error/empty state branch on Safari (Chrome often masks via paint timing).

**Cause:** Component uses multiple `if (X) return Y` branches with `useState` initial values. Initial state happens to satisfy a fallback branch that's checked before the actual loading branch.

**Pattern:**
```js
// WRONG
if (loading || !data) return <Loading />;
if (error) return <Error />;
// Initial state: loading=false, data=null, error=null → !data is truthy → renders Loading
// (or worse: if order reversed and error is checked first with loading=false, renders Error briefly)
```

**Fix:** Order branches so the explicit-state check comes BEFORE the fallback, OR use a single state variable with sentinel values (like `FriendProfileScreenImpl`'s `null=loading / false=error / object=data`).

**Reference:** Stage 1C.1.1 in `MultiplayerLobby`. Memory note `feedback_render_order_trap.md`.

### Class 2 — cascade re-fire (effect with unstable object dep)

**Symptom:** Effect runs many more times than expected. Often manifests as "rapid-fire RPC calls" or "questions rocketing through" or "channel re-subscribes per render."

**Cause:** Effect dep includes an object that's recreated on every parent render. React's identity comparison flags it as changed, fires the effect again.

**Recognition:**
- Object dep where you expected primitive ("user" instead of "user?.id")
- Callback dep that's recreated each render (no `useCallback`)
- Computed array/object that's a fresh reference each render

**Fix patterns:**
- Narrow to primitive dep (`user` → `user?.id`) — see Phase 5 H2 fix.
- Wrap callback in `useCallback` with stable deps.
- Ref-stabilize the callback if you don't want the effect to re-fire on identity changes — see Phase 5 F1 fix (CropModal `onLoadError`) + C3 fix (Wordle keydown handler).
- Single-fire guard via ref (`advanceInFlightRef`) when the effect MUST run but only once per logical transition — see Stage 1C.7.4 in `MultiplayerGameplay`.

**Reference:** Stage 1C.7.4 (commit `590d1a6`) for the multiplayer cascade. Phase 5 batch (commit `70d145a`) for the dep-narrowing variants.

### Class 3 — stale closure

**Symptom:** Callback uses an old value of state/props. "I just updated X but the callback still sees the old value."

**Cause:** `useCallback` with incomplete deps captures stale values. OR a long-lived effect's setup function captured render-time values that changed without re-firing the effect.

**Fix patterns:**
- Add the missing dep (let the callback / effect refresh).
- If re-fire is undesirable, use a ref to read the latest value at call time (the `handleKeyRef` pattern in Wordle's keydown effect, see Phase 5 C3 fix).
- For terminal-only data (captured for end-of-flow emit, never read in render), use `useRef` instead of `useState` — `wrongAnswersRef` / `allAnswersRef` in `QuizEngine` (memory note `feedback_terminal_data_via_ref.md`).

**Reference:** Stage 1C.7.4 had a stale-closure aspect in addition to the cascade. The advance effect captured `revealPhase='advancing'` from an earlier render and kept firing as if the phase hadn't moved.

### Class 4/5 — missing cleanup / state-after-unmount

**Symptom:** React 18 warning ("Can't perform a React state update on an unmounted component"). No actual crash but log noise.

**Cause:** Async operation (setTimeout, Promise, fetch, requestAnimationFrame chain) completes after the component unmounts and tries to call its setState.

**Fix patterns:**
- For setTimeouts: track id in a ref, `clearTimeout` in the effect cleanup. `timeoutsRef.current.push(setTimeout(...))` array pattern when there are multiple.
- For requestAnimationFrame chains: `let cancelled = false` flag in the effect, check at top of each `tick`, set to `true` in cleanup. Matches `Confetti` / `HardRightBurst` patterns.
- For async setState in `try`/`finally`: `mountedRef.current` check before calling setState in the catch / finally branch. Matches Phase 5 batch (B3, F2, G1, K2).

**Reference:** Phase 5 batch commit `b3d71a3` cleared 6 instances across `SettingsScreenImpl.performDelete`, `FootballWordle.submitGuess`, `BallIQResults` rAF chain, `CropModal.handleUse`, `ReviewScreen.decide`, and `AppInner.handleComplete`'s 10 celebration setTimeouts.

### Class 6 — hook error pollution from action callbacks

**Symptom:** UI renders an error screen for a state that should be local to one action.

**Cause:** Hook's `setError` is called from inside an action callback for what should be a per-action error.

**Fix:** Strip `setError` from action callbacks. Return the raw error in the action's return value. Consumers handle locally.

**Reference:** Stage 1C.6.1 (commit `31b5de4`). See the "Why hook `error` is initial-fetch only" section above.

### Class 7 — silent error swallowing

**Symptom:** Failure mode that nobody can diagnose because nothing logs.

**Cause:** `try { ... } catch {}` with no logging, no toast, no surface.

**Fix:** At minimum add `console.warn('[label]', e?.message || e)` so debugging future production reports has a starting point. Reserve toast surfacing for failures the user needs to act on.

**Reference:** Phase 5 batch commit `a9d9be7` added a `console.warn` to `SettingsScreenImpl.performDelete`'s signOut catch.

---

## Testing infrastructure

Two SQL-contract regression tests exist as Node scripts in `scripts/`. Both run against staging Supabase via CI nightly + manually.

| Spike | Asserts |
|---|---|
| `spike-1-realtime.mjs` | One channel, two `postgres_changes` filters delivers both event streams. INSERT / UPDATE / DELETE all observed. Cascade DELETE carries `payload.old` data (REPLICA IDENTITY FULL). |
| `spike-2-advance-race.mjs` | `FOR UPDATE + expected_question` gate serializes concurrent `advance_question` calls. Exactly one winner across 70 iterations spanning 2/3/4-way concurrency. |

### Run locally

```bash
npm run test:spike-1
npm run test:spike-2
npm run test:spikes  # both, sequentially
```

Local runs read `.env.local`; default to the production Supabase project (existing dev pattern preserved).

### CI

`.github/workflows/spike-nightly.yml` runs nightly at 09:00 UTC + on `workflow_dispatch` + on push to `staging`/`staging-*` branches. Required GitHub repo secrets: `SPIKE_SUPABASE_URL`, `SPIKE_SUPABASE_ANON_KEY`, `SPIKE_SUPABASE_SERVICE_ROLE_KEY`, `SPIKE_TEST_USER_EMAIL`. Full setup in `scripts/README.md`.

### When to add a new spike

For ANY SQL contract change that:

- Introduces a new SECURITY DEFINER RPC called from realtime / multiplayer paths
- Modifies a row-locking pattern (`FOR UPDATE`, `FOR NO KEY UPDATE`, advisory locks)
- Adds or modifies a realtime publication / `postgres_changes` filter
- Changes the cascade-DELETE or REPLICA IDENTITY behavior on `game_rooms` / `room_players`

A spike should set up a controlled scenario, fire concurrent / event-driven calls, assert specific contract guarantees, repeat enough iterations to catch flakes (50× for tight races, 10× for slow ones), exit 0 on pass / non-zero on fail. Use `scripts/lib/spike-utils.mjs` for env / auth / assertion helpers.

### Scoped but not implemented: spike-3 — `join_room` capacity race

Would test: N > capacity concurrent join attempts → exactly capacity succeed, rest fail with errcode `53300`.

Blocked on: needs N concurrent users with distinct `auth.uid()` values. Three implementation paths documented in `scripts/README.md` ("Future: spike-3" section). Recommended: pre-allocated test-user pool. Deferred to keep initial CI rollout simple.

---

## Future considerations (parking lot)

Items deliberately deferred during Stage 1. None are blocking V1; each documents what we'd do if a real need materialized.

### `last_answer_idx` for reload-resilience

**What:** A column on `room_players` storing the player's last answer (idx 0-3 or -1 for timeout) for the current question. On client reconnect, hook would surface the previous pick so the option button could re-render in locked state.

**Why deferred:** Current behavior — page refresh mid-game wipes local `myAnswer` state but `serverConfirmedAnswered` (derived from `myPlayer.answered_question`) still gates re-submission. Player sees default option colors but can't re-answer (silent UX glitch). Acceptable for V1.

**Cost to implement:** schema migration + `submit_answer` to write the column + hook to expose it + `MultiplayerGameplay.handleAnswerPick` to seed myAnswer from it on first render after reconnect. ~60 LoC + SQL migration.

### Host transfer

**What:** When the host disconnects, automatically promote a remaining player to host so the game can advance.

**Why deferred:** Current behavior — joiners see the "host disconnected" banner and the game stalls. Either the host returns or everyone leaves. Acceptable for friend-group play; would matter for stranger-matchmaking.

**Cost to implement:** SQL function `promote_host(p_code, p_new_host_id)` callable by any player when current host hasn't been seen in N seconds. Client tracks last-seen timestamps via realtime presence (separate API). ~120 LoC + SQL.

### Server-authoritative timer

**What:** Currently each client runs its own 20s countdown. Their local timers can drift if one client's tab was background-throttled. The server sees `submit_answer`'s `p_lock_time` arg and validates it's <= 20s, but doesn't enforce per-question wall-clock.

**Why deferred:** Drift hasn't been observed as a real problem. The score implications are small (lock time is a minor scoring factor in Sprint mode; non-existent in Classic).

**Cost to implement:** add `current_question_started_at` (timestamptz) to `game_rooms`. `advance_question` sets it to `now()`. Each client computes elapsed = `now() - current_question_started_at`. Submit deadline = `started_at + QUESTION_DURATION_MS`. Server-side `submit_answer` validates against this column rather than client-supplied `p_lock_time`. ~40 LoC + SQL.

### Bundle splitting

**What:** Lazy-load `questions.js` (~4k lines, ~50% of bundle by line count), `ReviewScreen.jsx`, `FootballWordle`. First-paint bundle could drop ~300-500 kB.

**Why deferred:** Not measured; warrants a planned V1.1 effort. Touch surface is small but discipline-heavy (Suspense boundaries + loading states).

### Tests for the hook + components

**What:** vitest + react-testing-library unit tests for `useMultiplayerRoom`'s reducer logic and `MultiplayerGameplay`'s phase machine. Documented as a three-tier recommendation in `SELF_REVIEW_FINDINGS.md` (tier A = SQL spikes, shipped tonight; tier B = hook tests; tier C = component tests).

**Why deferred:** Smoke testing has caught real bugs; SQL spikes are the highest-value test layer for the most-bug-prone area (concurrency / contract). Hook + component tests are V1.1 if regressions justify the framework setup.

### Native invite link / Universal Links

**What:** When wrapping the PWA in a native iOS/Android shell, configure Universal Links / App Links so `balliq.app/?join=CODE` opens the installed app directly with the join code intact.

**Why deferred:** Web flow already reads the URL parameter and routes correctly (auto-join via `OnlineEntry.autoJoinCode` prop). Native side just needs the link configuration to dispatch the URL to the WKWebView / Android WebView. Note exists in `App.jsx:~3475` near `INVITE_BASE_URL`.

### In-room chat / spectator mode / rematch flow

V2 territory. Each is its own significant scope. Mentioned in `STAGE_1F_SCOPE.md` "Scope (out — explicit defer)" section.

---

## Quick navigation aid — "where do I look if X breaks?"

| Symptom | First place to look |
|---|---|
| First-paint flash of error/loading on lobby entry | `MultiplayerLobby` render-branch order (~L3661) — ensure `if (error)` is before `if (loading || !room)`. See Class 1. |
| Players list out of sync after someone leaves | `useMultiplayerRoom.js:165-170` DELETE handler. Verify REPLICA IDENTITY FULL on `room_players`. |
| Joiners see error screen during normal play | Hook `error` is being set from an action callback — verify all 5 actions return errors instead of calling `setError`. See Class 6. |
| Questions rocket through faster than they should | Advance fire effect cascade — check `advanceInFlightRef` guard at `MultiplayerGameplay:~L4158`. See Class 2. |
| Joiner gets red "Couldn't advance" flash | Advance effect missing `if (!isHost) return;`. See Stage 1C.6.2. |
| Mid-game refresh shows wrong question | `useMultiplayerRoom`'s reconnect catch-up didn't fire. Check the post-subscribe handler at `useMultiplayerRoom.js:175-192`. |
| Rapid taps on answer get hijacked by iOS double-tap-zoom | `touch-action: manipulation` missing on the option button inline style (`QuestionView` ~L4581). |
| "Stage 1B early access" copy still showing somewhere | Stale post-1F.6 cleanup — `git grep "Stage 1B"`. |
| Realtime channel never subscribes (`channelStatus = 'connecting'` forever) | RLS recursion — verify `is_room_member` SECURITY DEFINER helper exists. |
| Score sync says "advanced=true" but `current_question` doesn't move | `expected_question` arg mismatch — caller is passing a stale value. Check `actions.advance` payload. |

---

## Reading order for someone new to this code

1. This document (you're already here).
2. `useMultiplayerRoom.js` end-to-end (~290 lines, well-commented).
3. `MultiplayerGameplay` (~L3988-4380) — the phase machine + advance fire effect comments are the densest concentration of "why we did this" in the codebase.
4. `scripts/spike-1-realtime.mjs` and `scripts/spike-2-advance-race.mjs` — they document the SQL contract by exercising it.
5. `scripts/README.md` — operational overview of the test suite.
6. The Stage 1C / 1F commit history (`git log --oneline | grep -E "Stage 1[CF]"`) — each commit message is a self-contained explanation of one design decision or bug fix.
