// Stage 1 multiplayer RPC wrapper layer with retry-on-transient-network.
//
// All seven multiplayer RPCs (create_room, join_room, start_game,
// submit_answer, advance_question, end_game, leave_room) flow through
// here. Each wrapper retries automatically on network-class failures
// (Safari "Load failed", Chrome "Failed to fetch", 5xx, 408, 429) but
// NOT on application-level errors (Postgres errcodes — host-only,
// room-full, no-such-room, etc., which retry can't fix).
//
// Retry policy is per-RPC. submit_answer has tight backoff because it's
// timer-pressured (must land within QUESTION_DURATION_MS); advance_question
// is patient because game progression depends on it; create_room is
// SINGLE-ATTEMPT because it's not idempotent (each call creates a new
// room with a new code — retry could orphan rooms).
//
// UI feedback: useMpRetryStatus() returns a reactive boolean any component
// can subscribe to render a "Reconnecting…" indicator during retries.
// First attempt is always silent; the indicator only fires once a retry
// is in flight (a brief blip that succeeds first try shouldn't alarm).

import { useState, useEffect } from 'react'
import * as Sentry from '@sentry/react'
import { supabase } from './supabase.js'

// ─── Retry config per RPC ────────────────────────────────────────────
// Tuned to RPC's user-perceived urgency vs cost of failure.

const RETRY_CONFIG = {
  // Idempotent via expected_question gate. Patient backoff.
  advance_question: { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Tight timer pressure — answer must land within question window.
  // Aggressive short retries; surface failure fast so user can re-tap.
  submit_answer:    { attempts: 2, backoffMs: [200, 500] },
  // User just tapped Start — patient retry to absorb a single blip.
  start_game:       { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Pre-game; joiner just submitted code. Patient retry.
  join_room:        { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Read-only pre-check of an invite code (signed-out too). One retry is plenty.
  room_lookup:      { attempts: 2, backoffMs: [300, 800] },
  // NOT IDEMPOTENT — each successful call creates a new room with new
  // code. Retry after server-success would orphan the first room. V1
  // accepts the rare manual re-tap; V1.1 can add a server-side
  // idempotency key.
  create_room:      { attempts: 1, backoffMs: [] },
  // Idempotent — second call after state='ended' no-ops.
  end_game:         { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Idempotent — second call after row removal is a no-op.
  leave_room:       { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Lobby-only host action (Race/Hot Streak). Idempotent — patient retry.
  set_room_mode:    { attempts: 3, backoffMs: [500, 1500, 3000] },
  // ⚠️ The three below were MISSING until 2026-08-29 — withRetry threw at
  // call time for every player, which the busy-flag in toggleReady then
  // turned into a permanently dead button (caught in Alex's live device
  // test: zero set_player_ready requests ever reached the server). A
  // wrapper without a config entry is a feature that has never worked.
  // Idempotent — sets an absolute value. Patient retry.
  set_player_ready: { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Effectively idempotent — a second call after reset returns
  // reason:'not_ended' and realtime carries the true state. Patient.
  start_next_round: { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Serialised server-side (FOR UPDATE + stamped code); every tap after the
  // first reads the stamp and joins, so retries are safe. Patient.
  claim_rematch:    { attempts: 3, backoffMs: [500, 1500, 3000] },
}

// ±20% jitter on each backoff to prevent thundering-herd when many
// clients hit the same transient.
function jittered(ms) {
  return Math.round(ms * (0.8 + Math.random() * 0.4))
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Error classification ────────────────────────────────────────────
// Network-layer fetch failures: retry. HTTP 5xx / 408 / 429: retry.
// 4xx (auth, RLS, application errors) and Postgres errcodes: don't
// retry — retry won't fix them.

function isRetryable(err) {
  if (!err) return false
  const msg = err.message || ''
  // Browser-specific fetch failures (network layer)
  if (msg.includes('Load failed')) return true       // Safari
  if (msg.includes('Failed to fetch')) return true   // Chrome
  if (msg.includes('NetworkError')) return true      // Firefox
  if (msg.includes('timeout') || msg.includes('aborted')) return true
  // HTTP status — server-side transient or capacity
  const status = typeof err.status === 'number' ? err.status : null
  if (status !== null) {
    if (status >= 500 && status < 600) return true
    if (status === 408) return true   // Request Timeout
    if (status === 429) return true   // Too Many Requests
  }
  // Postgres errcodes (PostgrestError.code is a SQLSTATE string) are
  // application-level — never retryable. e.g., '42501' = host-only,
  // '53300' = room full, 'P0002' = no row found.
  return false
}

// ─── Retry-status event bus ──────────────────────────────────────────
// Module-level counter of in-flight retries across all RPCs. Components
// subscribe via useMpRetryStatus() to render a "Reconnecting…" indicator
// when any RPC is in retry territory.

const listeners = new Set()
let inFlightRetries = 0

function publish() {
  for (const l of listeners) l(inFlightRetries)
}

export function useMpRetryStatus() {
  const [count, setCount] = useState(inFlightRetries)
  useEffect(() => {
    const l = (n) => setCount(n)
    listeners.add(l)
    // Snap to current value on mount in case retries were already
    // in flight when the component mounted.
    l(inFlightRetries)
    return () => { listeners.delete(l) }
  }, [])
  return { retrying: count > 0, count }
}

// ─── Core retry runner ───────────────────────────────────────────────

async function withRetry(rpcName, rpcArgs) {
  let config = RETRY_CONFIG[rpcName]
  if (!config) {
    // "Should never hit production" hit production: three wrappers shipped
    // without entries and this throw made each of them a button that does
    // nothing, forever, with no error UI. A missing entry is a POLICY gap,
    // not a reason to fail the player's tap — degrade to a single attempt,
    // and let Sentry + the unit gate flag the omission.
    Sentry.captureException(new Error(`[multiplayerRpc] no retry config for RPC ${rpcName}`), { tags: { rpc: rpcName } })
    config = { attempts: 1, backoffMs: [] }
  }

  let lastErr = null
  let inRetryWindow = false

  try {
    for (let attempt = 0; attempt < config.attempts; attempt++) {
      if (attempt > 0) {
        // Entering retry territory — bump global counter on the FIRST
        // retry only (so multiple retries within one call don't
        // double-count), then sleep with jitter.
        if (!inRetryWindow) {
          inRetryWindow = true
          inFlightRetries++
          publish()
        }
        await sleep(jittered(config.backoffMs[attempt - 1]))
      }
      const { data, error } = await supabase.rpc(rpcName, rpcArgs)
      if (!error) return { data, error: null }
      lastErr = error
      if (!isRetryable(error)) return { data: null, error }
      // Otherwise loop and retry.
    }
    // Exhausted attempts. Surface to Sentry as a retry-layer-exhausted
    // failure — these are network-class errors the retry policy couldn't
    // absorb (5xx storms, sustained network outage). Tagged by rpc so
    // Sentry alert rules can route critical RPCs to mobile push.
    Sentry.captureException(
      lastErr instanceof Error ? lastErr : new Error(lastErr?.message ?? String(lastErr)),
      {
        tags: { rpc: rpcName },
        extra: { retry_attempts: config.attempts },
      },
    )
    return { data: null, error: lastErr }
  } finally {
    if (inRetryWindow) {
      inFlightRetries--
      publish()
    }
  }
}

// ─── Public per-RPC wrappers ─────────────────────────────────────────
// Each preserves the exact return shape the existing callers expect, so
// integration is a search-and-replace at the callsites with no
// downstream error-handling changes.

export async function mpCreateRoom({ p_capacity, p_name, p_avatar }) {
  const { data, error } = await withRetry('create_room', { p_capacity, p_name, p_avatar })
  if (error) return { code: null, error: error.message ?? String(error) }
  return data
}

/**
 * Rematch is a HANDSHAKE, not a create.
 *
 * ⚠️ Player-reported 2026-08-22: both players tapped Rematch and each ended up
 * ALONE in a different room. handleRematch() called create_room()
 * unconditionally, so A made room X and invited B while B made room Y and
 * invited A, and the invitations crossed. The failure scaled with how much
 * both players wanted a rematch — the worst possible property for the feature
 * whose entire job is to keep two people playing.
 *
 * claim_rematch() makes the FINISHED room the rendezvous: the first tap
 * creates the new room and stamps its code on the old one, every later tap
 * reads the stamp and joins. Serialised server-side with SELECT ... FOR UPDATE,
 * so simultaneous taps cannot both win.
 *
 * Returns { code, room_id, created } — `created` is true for the player who
 * made the room and false for anyone who joined it, which is what the caller
 * needs to decide whether to send invites.
 */
export async function mpClaimRematch({ p_code, p_name, p_avatar }) {
  const { data, error } = await withRetry('claim_rematch', { p_code, p_name, p_avatar })
  if (error) return { code: null, error: error.message ?? String(error) }
  return data
}

/**
 * Does this invite code point at a joinable room? Callable signed-out. Returns
 * { found, joinable, state, players, capacity } — never throws; a network
 * failure reads as { found: null } so the caller can decide to be lenient.
 * See supabase/migrations/v1_9_room_lookup.sql.
 */
export async function mpLookupRoom(code) {
  const p_code = String(code || '').toUpperCase().trim()
  if (p_code.length < 4) return { found: false, joinable: false }
  const { data, error } = await withRetry('room_lookup', { p_code })
  if (error || !data || typeof data !== 'object') return { found: null, joinable: false, error: error?.message }
  const found = data.found === true
  const state = data.state || null
  const full = Number(data.players || 0) >= Number(data.capacity || 0) && Number(data.capacity || 0) > 0
  return { found, state, players: Number(data.players || 0), capacity: Number(data.capacity || 0), joinable: found && state !== 'ended' && !full }
}

export async function mpJoinRoom({ p_code, p_name, p_avatar }) {
  const { data, error } = await withRetry('join_room', { p_code, p_name, p_avatar })
  // Preserve PostgrestError.code so callers can switch on SQLSTATE
  // (53300 = room full, P0002 = no such code, 42P01 = wrong state).
  if (error) return { room_id: null, error: error.message, code: error.code }
  return data
}

/**
 * Post-match ready-up. See supabase/migrations/v1_7_mp_ready_up.sql.
 *
 * Returns { ready_count, total, all_ready, can_start }. The tally comes back
 * from the call itself so a client whose realtime subscription is asleep still
 * renders a truthful count from its own action — the board must never show
 * "1/3 ready" to someone who just tapped Ready.
 */
export async function mpSetPlayerReady({ p_code, p_ready }) {
  const { data, error } = await withRetry('set_player_ready', { p_code, p_ready })
  if (error) return { error: error.message ?? String(error) }
  return data
}

/**
 * Reset the SAME room for another round. Host-only while the host is present
 * (whoever supplies the questions knows the answers first), otherwise any
 * remaining player may start.
 *
 * Returns { started, reason?, players?, dropped?, already? }. `reason` is one
 * of not_host · not_ended · need_two_ready · starter_not_ready, and callers
 * should render it rather than a generic failure — "waiting for one more
 * player" and "only the host can start" are different problems to the player.
 */
export async function mpStartNextRound({ p_code, p_questions }) {
  const { data, error } = await withRetry('start_next_round', { p_code, p_questions })
  if (error) return { started: false, error: error.message ?? String(error) }
  return data
}

export async function mpStartGame({ p_code, p_questions, p_capacity }) {
  const { data, error } = await withRetry('start_game', { p_code, p_questions, p_capacity })
  if (error) return { started: false, error: error.message }
  return data
}

export async function mpSubmitAnswer({ p_code, p_question_idx, p_answer_idx, p_lock_time }) {
  const { data, error } = await withRetry('submit_answer', {
    p_code, p_question_idx, p_answer_idx, p_lock_time,
  })
  if (error) return { accepted: false, error: error.message }
  return data
}

export async function mpAdvanceQuestion({ p_code, p_expected_question }) {
  const { data, error } = await withRetry('advance_question', { p_code, p_expected_question })
  if (error) return { advanced: false, error: error.message }
  return data
}

export async function mpEndGame({ p_code }) {
  const { data, error } = await withRetry('end_game', { p_code })
  if (error) return { ended: false, error: error.message }
  return data
}

export async function mpLeaveRoom({ p_code }) {
  const { data, error } = await withRetry('leave_room', { p_code })
  if (error) return { left: false, error: error.message }
  return data
}

export async function mpSetRoomMode({ p_code, p_mode }) {
  const { data, error } = await withRetry('set_room_mode', { p_code, p_mode })
  if (error) return { ok: false, error: error.message }
  return data
}

// set_player_name — lobby-only self-rename (guest entry v1.6). Single shot,
// no retry: the input stays filled on failure so the user just re-taps Save.
export async function mpSetPlayerName({ p_code, p_name }) {
  const { data, error } = await supabase.rpc('set_player_name', { p_code, p_name })
  if (error) return { ok: false, error: error.message, code: error.code }
  return { ok: true, ...data }
}

// reveal_question — post-close disclosure of the correct answer index
// (answer-key hardening Phase 1). Best-effort single shot, deliberately
// outside the retry machinery: the caller falls back to the embedded key
// (pre-Phase-2 rooms) or simply skips the green highlight on failure —
// the reveal must never block on this.
export async function mpRevealQuestion({ p_code, p_question_idx }) {
  const { data, error } = await supabase.rpc('reveal_question', { p_code, p_question_idx })
  if (error) return { revealed: false, error: error.message }
  return data
}
