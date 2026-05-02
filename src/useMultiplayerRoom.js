// Stage 1 multiplayer hook. Single source of truth for one room's state.
// Owns the realtime channel subscription (Stage 1B), exposes derived state,
// provides RPC action callbacks for the gameplay UI to consume.
//
// Stage 1A status: contract is complete; initial fetch implemented; RPC
// actions implemented; channel subscription stubbed (TODO marked for
// Stage 1B). Hook is importable but not yet consumed by any UI in Stage 1A
// — placeholder screens call RPCs directly to validate plumbing in
// isolation. Stage 1B's lobby is the first real consumer.
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
//       submitAnswer(questionIdx, answerIdx, lockTimeMs),
//       advance(),                  // host-only; auto-passes current_question
//       leave(),
//       end(),                      // host-only
//     },
//   }

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase.js'
import { useAuth } from './useAuth.jsx'

export function useMultiplayerRoom(code) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [channelStatus, setChannelStatus] = useState('idle')

  // Stage 1B: holds the live Supabase channel instance so the cleanup
  // path can supabase.removeChannel(channelRef.current).
  const channelRef = useRef(null)

  // Code transition handler. When `code` changes (mount, room switch, or
  // unmount-style null transition), reset state and re-fetch. Loading is
  // flipped true on every non-null code mount — including the A → B
  // transition — so consumers don't briefly see stale room A data while
  // room B's fetch is in flight. (Decided 2026-05-04 during Stage 1A
  // scoping: stale data on a new room is misleading; brief loading
  // spinner is the lesser evil.)
  useEffect(() => {
    let cancelled = false

    if (!code) {
      // Idle: no active room. Reset to baseline.
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

    ;(async () => {
      try {
        // Two-step fetch: game_rooms by code first to get room.id, then
        // room_players by room_id. RLS allows SELECT for room members
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
          // players array; Stage 1B's realtime sync will populate when
          // events fire.
          setError(playersErr.message)
        }
        setPlayers(playersData || [])

        setLoading(false)

        // TODO Stage 1B: subscribe to channel `room:${roomData.id}` with
        // two postgres_changes filters (game_rooms id-eq, room_players
        // room_id-eq). Wire event handlers per the Stage 1A scope writeup
        // §1. Set channelStatus 'subscribed' on subscribe success; on
        // close/error transitions, re-fetch initial state when reconnect
        // succeeds (events during dropout would have been missed).
        setChannelStatus('idle')
      } catch (e) {
        if (cancelled) return
        setError(e?.message || String(e))
        setLoading(false)
        setChannelStatus('error')
      }
    })()

    return () => {
      cancelled = true
      // TODO Stage 1B: supabase.removeChannel(channelRef.current) here
      // to tear down the realtime subscription on unmount or code change.
      channelRef.current = null
    }
  }, [code])

  // Derived shortcuts — recomputed each render, no useMemo (cheap).
  const myPlayer = userId
    ? players.find(p => p.user_id === userId) ?? null
    : null
  const isHost = !!(room && userId && room.host_id === userId)

  // Action callbacks. Wired to SECURITY DEFINER RPCs; no realtime
  // dependency, so these work in Stage 1A even before channel.subscribe
  // wiring lands in 1B. Each surfaces error.message via setError so
  // consumers can render a unified error toast/banner if they want.
  const submitAnswer = useCallback(async (questionIdx, answerIdx, lockTimeMs) => {
    if (!code) return { accepted: false, error: 'No active room' }
    const { data, error } = await supabase.rpc('submit_answer', {
      p_code: code,
      p_question_idx: questionIdx,
      p_answer_idx: answerIdx,
      p_lock_time: lockTimeMs,
    })
    if (error) {
      setError(error.message)
      return { accepted: false, error: error.message }
    }
    return data
  }, [code])

  const advance = useCallback(async () => {
    if (!code || !room) return { advanced: false, error: 'No room loaded' }
    const { data, error } = await supabase.rpc('advance_question', {
      p_code: code,
      p_expected_question: room.current_question,
    })
    if (error) {
      setError(error.message)
      return { advanced: false, error: error.message }
    }
    return data
  }, [code, room])

  const leave = useCallback(async () => {
    if (!code) return { left: false, error: 'No active room' }
    const { data, error } = await supabase.rpc('leave_room', { p_code: code })
    if (error) {
      setError(error.message)
      return { left: false, error: error.message }
    }
    return data
  }, [code])

  const end = useCallback(async () => {
    if (!code) return { ended: false, error: 'No active room' }
    const { data, error } = await supabase.rpc('end_game', { p_code: code })
    if (error) {
      setError(error.message)
      return { ended: false, error: error.message }
    }
    return data
  }, [code])

  return {
    room,
    players,
    myPlayer,
    isHost,
    loading,
    error,
    channelStatus,
    actions: { submitAnswer, advance, leave, end },
  }
}
