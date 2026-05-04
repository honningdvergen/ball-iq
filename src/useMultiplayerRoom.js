// Stage 1 multiplayer hook. Single source of truth for one room's state.
// Owns the realtime channel subscription, exposes derived state, provides
// RPC action callbacks for the lobby + gameplay UI to consume.
//
// Stage 1B status: contract complete; initial fetch + channel subscription
// + reconnect catch-up implemented; all RPC actions wired (submitAnswer
// stays a stub-call for Stage 1C consumption — RPC works, no consumer yet).
//
// Returns:
//   {
//     room,           // game_rooms row | null
//     players,        // room_players[] sorted by joined_at asc
//     myPlayer,       // shortcut: row for current auth user, or null
//     isHost,         // boolean: room.host_id === auth.uid()
//     loading,        // true during initial fetch (and on code transitions)
//     error,          // string | null
//     channelStatus,  // 'idle' | 'connecting' | 'subscribed' | 'closed' | 'error'
//     actions: {
//       startGame(questions, capacity),  // host-only
//       submitAnswer(questionIdx, answerIdx, lockTimeMs),
//       advance(),                        // host-only; auto-passes current_question
//       leave(),
//       end(),                            // host-only
//     },
//   }

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase.js'
import { useAuth } from './useAuth.jsx'
import {
  mpStartGame, mpSubmitAnswer, mpAdvanceQuestion,
  mpLeaveRoom, mpEndGame,
} from './multiplayerRpc.js'

// Module-level helper: stable sort key for the players array.
function byJoinedAt(a, b) {
  const ta = a.joined_at || ''
  const tb = b.joined_at || ''
  return ta < tb ? -1 : ta > tb ? 1 : 0
}

export function useMultiplayerRoom(code) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [channelStatus, setChannelStatus] = useState('idle')

  // Holds the live Supabase channel instance so the cleanup path can
  // tear it down via supabase.removeChannel.
  const channelRef = useRef(null)

  // Code transition handler. When `code` changes (mount, room switch,
  // unmount-style null transition), reset state and re-fetch. Loading is
  // flipped true on every non-null code mount — including the A → B
  // transition — so consumers don't briefly see stale room A data while
  // room B's fetch is in flight.
  useEffect(() => {
    let cancelled = false

    if (!code) {
      setRoom(null)
      setPlayers([])
      setLoading(false)
      setError(null)
      setChannelStatus('idle')
      return
    }

    setLoading(true)
    setError(null)
    setChannelStatus('connecting')

    // Re-fetch initial state after a reconnect catch-up. Doesn't toggle
    // loading=true (that would cause UI flicker on every reconnect).
    // Debounced: if the channel flaps CLOSED↔SUBSCRIBED rapidly under
    // poor connectivity, calling refetch on each transition would
    // hammer the project with redundant SELECTs. 2s debounce catches
    // the storm without delaying the first legitimate refetch.
    let lastRefetchAt = 0
    async function refetchInitialState(roomId) {
      const now = Date.now()
      if (now - lastRefetchAt < 2000) return
      lastRefetchAt = now
      try {
        const [roomRes, playersRes] = await Promise.all([
          supabase.from('game_rooms').select('*').eq('id', roomId).maybeSingle(),
          supabase.from('room_players').select('*').eq('room_id', roomId).order('joined_at', { ascending: true }),
        ])
        if (cancelled) return
        if (roomRes.data) setRoom(roomRes.data)
        if (playersRes.data) setPlayers(playersRes.data)
      } catch {}
    }

    ;(async () => {
      try {
        // Two-step initial fetch: game_rooms by code first to get room.id,
        // then room_players by room_id. RLS allows SELECT for room members
        // (is_room_member SECURITY DEFINER helper on the SQL side).
        const { data: roomData, error: roomErr } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('code', code)
          .neq('state', 'ended')
          .maybeSingle()
        if (cancelled) return
        if (roomErr) {
          setError(roomErr.message)
          setLoading(false)
          setChannelStatus('error')
          return
        }
        if (!roomData) {
          setError('Room not found')
          setLoading(false)
          setChannelStatus('error')
          return
        }
        setRoom(roomData)

        const { data: playersData, error: playersErr } = await supabase
          .from('room_players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('joined_at', { ascending: true })
        if (cancelled) return
        if (playersErr) {
          // Non-fatal: room state is at least known. Continue with empty
          // players array; realtime sync below will populate as events fire.
          setError(playersErr.message)
        }
        setPlayers(playersData || [])

        setLoading(false)

        // Channel subscription: one channel per room, two postgres_changes
        // filters (Spike 1 validated this fan-out pattern). REPLICA IDENTITY
        // FULL on both tables (Stage 1 SQL) ensures DELETE payloads carry
        // full row data so handlers can identify which player left.
        const channel = supabase
          .channel(`room:${roomData.id}`)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomData.id}` },
            (payload) => {
              if (cancelled) return
              if (payload.eventType === 'UPDATE' && payload.new) {
                setRoom(payload.new)
              }
              // INSERT/DELETE shouldn't fire for an existing-and-known
              // room.id (no cascade — Stage 1 SQL uses state='ended').
            }
          )
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomData.id}` },
            (payload) => {
              if (cancelled) return
              if (payload.eventType === 'INSERT' && payload.new) {
                setPlayers(prev => {
                  // Idempotency: if a player row already exists (e.g., from
                  // initial fetch), replace; else append. Realtime can deliver
                  // an INSERT we already have via SELECT when timing aligns.
                  const without = prev.filter(p =>
                    !(p.room_id === payload.new.room_id && p.user_id === payload.new.user_id)
                  )
                  return [...without, payload.new].sort(byJoinedAt)
                })
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                setPlayers(prev => prev.map(p =>
                  (p.room_id === payload.new.room_id && p.user_id === payload.new.user_id)
                    ? payload.new
                    : p
                ))
              } else if (payload.eventType === 'DELETE' && payload.old) {
                setPlayers(prev => prev.filter(p =>
                  !(p.room_id === payload.old.room_id && p.user_id === payload.old.user_id)
                ))
              }
            }
          )

        channelRef.current = channel

        channel.subscribe((status) => {
          if (cancelled) return
          if (status === 'SUBSCRIBED') {
            // First subscribe → mark ready. Re-subscribe after a 'closed'/
            // 'error' → re-fetch initial state to catch up on missed events
            // (events during dropout would have been lost).
            setChannelStatus(prev => {
              if (prev === 'closed' || prev === 'error') {
                refetchInitialState(roomData.id)
              }
              return 'subscribed'
            })
          } else if (status === 'CLOSED') {
            setChannelStatus('closed')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setChannelStatus('error')
          }
        })
      } catch (e) {
        if (cancelled) return
        setError(e?.message || String(e))
        setLoading(false)
        setChannelStatus('error')
      }
    })()

    return () => {
      cancelled = true
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current) } catch {}
        channelRef.current = null
      }
    }
  }, [code])

  // Derived shortcuts — recomputed each render, no useMemo (cheap).
  const myPlayer = userId
    ? players.find(p => p.user_id === userId) ?? null
    : null
  const isHost = !!(room && userId && room.host_id === userId)

  // Action callbacks. Each returns the raw RPC payload for caller-specific
  // handling. They do NOT setError on RPC failure — the hook's `error` state
  // is reserved for lobby-level fatal concerns (initial fetch failure, room
  // not found). Per-action errors are local to the caller and should not
  // pollute the lobby dispatch.
  //
  // Why this matters: the original 1B/1C design had setError calls inside
  // each action. Stage 1C.6 surfaced a real bug from this — joiner clients
  // also fire advance() in the per-client trigger model. The server returns
  // "only the host can advance" (errcode 42501); under the old design,
  // setError set the hook error → MultiplayerLobby's dispatch saw error
  // truthy → rendered LobbyError → gameplay UI replaced with an error
  // screen. The same latent bug applied to all actions: submit_answer
  // failing with "caller not in this room" (post-kick scenario), etc.
  // Stage 1C.6.1 strips setError from all five actions; consumers handle
  // errors locally via the returned result object.
  // RPC actions delegate to the multiplayerRpc.js wrappers, which add
  // retry-on-transient-network with per-RPC backoff config. Application-
  // level errors (Postgres errcodes, RLS denials) still surface through
  // unchanged — retry is for fetch failures and 5xx, not 4xx semantics.
  const startGame = useCallback(async (questions, capacity) => {
    if (!code) return { started: false, error: 'No active room' }
    return mpStartGame({ p_code: code, p_questions: questions, p_capacity: capacity })
  }, [code])

  const submitAnswer = useCallback(async (questionIdx, answerIdx, lockTimeMs) => {
    if (!code) return { accepted: false, error: 'No active room' }
    return mpSubmitAnswer({
      p_code: code,
      p_question_idx: questionIdx,
      p_answer_idx: answerIdx,
      p_lock_time: lockTimeMs,
    })
  }, [code])

  const advance = useCallback(async () => {
    if (!code || !room) return { advanced: false, error: 'No room loaded' }
    return mpAdvanceQuestion({ p_code: code, p_expected_question: room.current_question })
  }, [code, room])

  const leave = useCallback(async () => {
    if (!code) return { left: false, error: 'No active room' }
    return mpLeaveRoom({ p_code: code })
  }, [code])

  const end = useCallback(async () => {
    if (!code) return { ended: false, error: 'No active room' }
    return mpEndGame({ p_code: code })
  }, [code])

  return {
    room,
    players,
    myPlayer,
    isHost,
    loading,
    error,
    channelStatus,
    actions: { startGame, submitAnswer, advance, leave, end },
  }
}
