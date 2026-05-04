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
  // NOT IDEMPOTENT — each successful call creates a new room with new
  // code. Retry after server-success would orphan the first room. V1
  // accepts the rare manual re-tap; V1.1 can add a server-side
  // idempotency key.
  create_room:      { attempts: 1, backoffMs: [] },
  // Idempotent — second call after state='ended' no-ops.
  end_game:         { attempts: 3, backoffMs: [500, 1500, 3000] },
  // Idempotent — second call after row removal is a no-op.
  leave_room:       { attempts: 3, backoffMs: [500, 1500, 3000] },
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
  const config = RETRY_CONFIG[rpcName]
  if (!config) {
    // Defensive — should never hit production. Throw at call time.
    throw new Error(`[multiplayerRpc] no retry config for RPC ${rpcName}`)
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
    // Exhausted attempts. Return the last error.
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

export async function mpJoinRoom({ p_code, p_name, p_avatar }) {
  const { data, error } = await withRetry('join_room', { p_code, p_name, p_avatar })
  // Preserve PostgrestError.code so callers can switch on SQLSTATE
  // (53300 = room full, P0002 = no such code, 42P01 = wrong state).
  if (error) return { room_id: null, error: error.message, code: error.code }
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
