import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

// Per-user localStorage keys cleared on sign-out and account delete to
// prevent User A's data from leaking into User B's session on shared
// devices via hydrate's max/union merges. Device-scoped keys (UX
// preferences and dismiss-flags) are intentionally preserved:
//   - biq_settings, biq_first_tip_shown, biq_rate_shown, biq-splash
//   - ballIQ_guestMode (handled separately by signOut)
const USER_SCOPED_STATIC_KEYS = [
  'biq_xp',
  'biq_stats',
  'biq_login_streak',
  'biq_iq_history',
  'biq_hotstreak_best',
  'biq_skill_level',
  'biq_profile',
  'biq_review_idx',
  'biq_seen_history_v2',
  'biq_pending_join',
  'biq_onboarded',
]
const USER_SCOPED_PREFIXES = ['biq_daily_', 'biq_wordle_']

export function clearAllUserLocalStorage() {
  try {
    for (const k of USER_SCOPED_STATIC_KEYS) localStorage.removeItem(k)
    const matches = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && USER_SCOPED_PREFIXES.some(p => k.startsWith(p))) matches.push(k)
    }
    for (const k of matches) localStorage.removeItem(k)
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  // Tracks the currently-authenticated userId for hydrate-race protection.
  // hydrateLocalFromRemote captures userId at start; if this ref no longer
  // matches when hydrate runs, the user has signed out or switched accounts
  // mid-flight and hydrate aborts to avoid leaking the previous user's
  // data into the new session. signOut() invalidates this synchronously
  // BEFORE its supabase.auth.signOut() await so any in-flight hydrate
  // resolved during that await window sees the change and bails.
  const activeUserIdRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id, user)
    } else {
      setProfile(null)
    }
  }, [user?.id])

  useEffect(() => {
    const guestMode = localStorage.getItem('ballIQ_guestMode')
    if (guestMode === 'true') {
      setIsGuest(true)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      activeUserIdRef.current = session?.user?.id ?? null
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        activeUserIdRef.current = session?.user?.id ?? null
        setUser(session?.user ?? null)
        if (session?.user) {
          setIsGuest(false)
          localStorage.removeItem('ballIQ_guestMode')
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId, userObj) {
    const metaUsername = userObj?.user_metadata?.username
    const fallbackProfile = {
      id: userId,
      username: metaUsername || 'Player',
      avatar_id: '⚽',
      total_score: 0,
      games_played: 0,
      correct_answers: 0,
    }
    setProfile(fallbackProfile)

    try {
      // Phase I cutover: profile metadata + aggregate stats live on `profiles`;
      // game state (daily_*, wordle_state, login_streak) lives on
      // `user_game_state`. Fetch both in parallel and merge so the rest of
      // the app continues to see a unified `profile.*` shape.
      const [profileResult, gameStateResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_game_state').select('*').eq('user_id', userId).maybeSingle(),
      ])

      const { data: profileData, error: profileError, status: profileStatus } = profileResult
      const { data: gameStateData, error: gameStateError, status: gameStateStatus } = gameStateResult

      if (profileError) {
        console.error('[loadProfile] profiles error', { userId, status: profileStatus, code: profileError.code, message: profileError.message, details: profileError.details, hint: profileError.hint })
        return
      }
      if (!profileData) {
        console.warn('[loadProfile] no profile row found for user — keeping metadata fallback', { userId, username: metaUsername })
        return
      }

      // user_game_state failure is non-fatal: keep going with profile-only
      // data. UI shows fallback/empty for daily/wordle/streak; hydrate falls
      // back to local biq_* cache if present.
      let gameState = null
      if (gameStateError) {
        console.error('[loadProfile] user_game_state error (non-fatal)', { userId, status: gameStateStatus, code: gameStateError.code, message: gameStateError.message })
      } else if (!gameStateData) {
        console.warn('[loadProfile] no user_game_state row for user — trigger should have created one', { userId })
      } else {
        gameState = gameStateData
      }

      // Merge: profile fields, then explicitly source the 5 game-state columns
      // from gameState (or undefined if its fetch failed). We don't fall back
      // to profileData's stale copies — during the C2-to-C4 window those
      // columns exist on profiles but are no longer written, so reading them
      // risks showing yesterday's score as today's. "Show no data" beats
      // "show stale data"; hydrate's local cache will fill in.
      const merged = {
        ...profileData,
        daily_scores:        gameState?.daily_scores,
        daily_wrong_answers: gameState?.daily_wrong_answers,
        daily_all_answers:   gameState?.daily_all_answers,
        wordle_state:        gameState?.wordle_state,
        login_streak:        gameState?.login_streak,
        username: profileData.username || metaUsername || 'Player',
      }
      setProfile(merged)
      // Cross-device sync: max-merge local <-> remote so signing in on a fresh
      // device (or PWA install) restores progress, while never losing newer
      // local progress that hasn't synced yet.
      hydrateLocalFromRemote(userId, merged).catch(e => {
        console.error('[hydrate] failed', e?.message || e)
      })
    } catch (e) {
      console.error('[loadProfile] exception', { userId, error: e })
    }
  }

  // Cross-device sync: takes max(local, remote) for each tracked field and
  // writes the result to localStorage. Read-only with respect to Supabase —
  // saveStats (App.jsx) is the canonical writer via atomic delta RPCs. After
  // resolving, dispatches a custom 'biq:hydrated' event so AppInner can
  // refresh its in-memory xp/stats state (its useState initializers ran once
  // at mount with whatever was in localStorage at the time, so we need to
  // push the new values back through).
  //
  // Why no back-sync to Supabase: previously this function did
  // `update(profiles) SET total_score = finalTotalCorrect` etc. when local
  // was higher than remote. That created a race: if the user reset Supabase
  // to zero (or another device wrote fresh values) while localStorage still
  // held an old higher value, hydration would silently restore the old
  // values, undoing the reset/write. Local-only merge is safe because
  // genuinely-ahead local values get pushed up by the next saveStats RPC.
  //
  // Failure modes:
  //   - Network error reading remote: hydration is a no-op, local values stay
  //     intact. App continues to work offline.
  //   - Empty remote stats column (existing pre-migration users): treated as
  //     {} so local values dominate locally; remote catches up via saveStats.
  async function hydrateLocalFromRemote(userId, remoteProfile) {
    if (!remoteProfile) return
    // Hydrate-race guard: if the active userId no longer matches the one
    // this hydrate was started for, bail without writing. Prevents an
    // in-flight hydrate (started after sign-in's profiles SELECT) from
    // repopulating biq_* keys after a fast sign-out has already wiped
    // them. Diagnostic warning kept enabled in production — if this
    // ever fires we want visibility.
    if (activeUserIdRef.current !== userId) {
      console.warn('[hydrate] aborted — userId changed mid-flight', {
        capturedUserId: userId,
        currentUserId: activeUserIdRef.current,
      })
      return
    }

    let localXp = 0
    try { localXp = parseInt(localStorage.getItem('biq_xp') || '0', 10) || 0 } catch {}
    let localStats = {}
    try { localStats = JSON.parse(localStorage.getItem('biq_stats') || '{}') || {} } catch {}

    const remoteXp = remoteProfile.xp || 0
    const remoteTotalScore = remoteProfile.total_score || 0
    const remoteGamesPlayed = remoteProfile.games_played || 0
    const remoteCorrectAnswers = remoteProfile.correct_answers || 0
    const remoteStats = (remoteProfile.stats && typeof remoteProfile.stats === 'object') ? remoteProfile.stats : {}

    // Per-field max
    const finalXp = Math.max(localXp, remoteXp)
    const finalGamesPlayed = Math.max(localStats.gamesPlayed || 0, remoteGamesPlayed)
    // totalCorrect tracked locally is the canonical "running correct-answers" count;
    // remote stores the same number under both total_score (delta-incremented) and
    // correct_answers (snapshot). Pull max of all three.
    const finalTotalCorrect = Math.max(
      localStats.totalCorrect || 0,
      remoteTotalScore,
      remoteCorrectAnswers
    )
    const bestKeys = ['bestScore', 'bestStreak', 'bestIQ', 'bestHotStreak', 'bestTrueFalse', 'totalAnswered']
    const finalStats = { ...localStats, gamesPlayed: finalGamesPlayed, totalCorrect: finalTotalCorrect }
    for (const k of bestKeys) {
      finalStats[k] = Math.max(localStats[k] || 0, remoteStats[k] || 0)
    }

    // Write to localStorage. Hydration is intentionally read-only with respect
    // to Supabase: saveStats (App.jsx) is the canonical writer for aggregate
    // stats via atomic delta RPCs. Letting hydration also write back creates
    // a race where stale localStorage values can overwrite freshly-zeroed or
    // freshly-incremented Supabase values.
    try { localStorage.setItem('biq_xp', String(finalXp)) } catch {}
    try { localStorage.setItem('biq_stats', JSON.stringify(finalStats)) } catch {}

    // ── Phase 5v: cross-device sync for daily/wordle ──
    // (login_streak removed from hydrate in Phase G — handled by the
    //  tick_login_streak RPC instead.) These two remaining categories are
    // per-day-keyed, so union-merge is safe — there's no "delete a day"
    // operation that a stale local value could undo. Local-only days
    // back-sync up.

    // Daily scores (score per YMD) AND daily wrongAnswers (array per YMD).
    // Phase 5w followup added the wrongAnswers sync; folded into the same
    // merge pass so each per-day localStorage write happens once with
    // both fields. The two remote columns are independent; the local
    // representation keeps both in the same biq_daily_<ymd> record.
    const remoteDailyScores = (remoteProfile.daily_scores && typeof remoteProfile.daily_scores === 'object')
      ? remoteProfile.daily_scores : {}
    const localDailyScores = readLocalMap(/^biq_daily_(\d{4}-\d{2}-\d{2})$/, p => (typeof p?.score === 'number' ? p.score : null))
    const mergedDailyScores = { ...localDailyScores, ...remoteDailyScores }

    const remoteDailyWA = (remoteProfile.daily_wrong_answers && typeof remoteProfile.daily_wrong_answers === 'object')
      ? remoteProfile.daily_wrong_answers : {}
    const localDailyWA = readLocalMap(
      /^biq_daily_(\d{4}-\d{2}-\d{2})$/,
      p => (Array.isArray(p?.wrongAnswers) && p.wrongAnswers.length > 0 ? p.wrongAnswers : null)
    )
    const mergedDailyWA = { ...localDailyWA, ...remoteDailyWA }

    // Phase 5x: full per-question review. allAnswers is the source of
    // truth for the Daily review screen; wrongAnswers is now derivable
    // (filter !isCorrect) but kept in parallel for legacy paths.
    const remoteDailyAA = (remoteProfile.daily_all_answers && typeof remoteProfile.daily_all_answers === 'object')
      ? remoteProfile.daily_all_answers : {}
    const localDailyAA = readLocalMap(
      /^biq_daily_(\d{4}-\d{2}-\d{2})$/,
      p => (Array.isArray(p?.allAnswers) && p.allAnswers.length > 0 ? p.allAnswers : null)
    )
    const mergedDailyAA = { ...localDailyAA, ...remoteDailyAA }

    // One write per day with all three fields. Skip orphan WA/AA entries
    // that somehow lack a score (shouldn't happen, defensive).
    const allDailyDays = new Set([
      ...Object.keys(mergedDailyScores),
      ...Object.keys(mergedDailyWA),
      ...Object.keys(mergedDailyAA),
    ])
    for (const ymd of allDailyDays) {
      const score = mergedDailyScores[ymd]
      if (typeof score !== 'number') continue
      const wrongs = mergedDailyWA[ymd]
      const all = mergedDailyAA[ymd]
      const record = { score }
      if (wrongs) record.wrongAnswers = wrongs
      if (all) record.allAnswers = all
      try { localStorage.setItem(`biq_daily_${ymd}`, JSON.stringify(record)) } catch {}
    }

    // Back-sync: one-time per device per user. Pre-launch, no need to
    // batch — at worst a few dozen rows. Flag for batching (chunks of
    // 50 with a delay) if/when this becomes load-bearing.
    const localOnlyDailyDays = Object.keys(localDailyScores).filter(d => !(d in remoteDailyScores))
    if (localOnlyDailyDays.length > 0) {
      Promise.all(localOnlyDailyDays.map(d =>
        supabase.rpc('upsert_daily_score', { p_ymd: d, p_score: localDailyScores[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync daily]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync daily]', e?.message || e))
    }
    const localOnlyDailyWADays = Object.keys(localDailyWA).filter(d => !(d in remoteDailyWA))
    if (localOnlyDailyWADays.length > 0) {
      Promise.all(localOnlyDailyWADays.map(d =>
        supabase.rpc('upsert_daily_wrong_answers', { p_ymd: d, p_wrongs: localDailyWA[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync daily wa]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync daily wa]', e?.message || e))
    }
    const localOnlyDailyAADays = Object.keys(localDailyAA).filter(d => !(d in remoteDailyAA))
    if (localOnlyDailyAADays.length > 0) {
      Promise.all(localOnlyDailyAADays.map(d =>
        supabase.rpc('upsert_daily_all_answers', { p_ymd: d, p_answers: localDailyAA[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync daily aa]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync daily aa]', e?.message || e))
    }

    // Wordle state (full {guesses, status} per YMD).
    const remoteWordleState = (remoteProfile.wordle_state && typeof remoteProfile.wordle_state === 'object')
      ? remoteProfile.wordle_state : {}
    const localWordleState = readLocalMap(/^biq_wordle_(\d{4}-\d{2}-\d{2})$/, p => (
      p && Array.isArray(p.guesses) && typeof p.status === 'string' ? p : null
    ))
    const mergedWordleState = { ...localWordleState, ...remoteWordleState }
    for (const [ymd, st] of Object.entries(mergedWordleState)) {
      try { localStorage.setItem(`biq_wordle_${ymd}`, JSON.stringify(st)) } catch {}
    }
    const localOnlyWordleDays = Object.keys(localWordleState).filter(d => !(d in remoteWordleState))
    if (localOnlyWordleDays.length > 0) {
      Promise.all(localOnlyWordleDays.map(d =>
        supabase.rpc('upsert_wordle_state', { p_ymd: d, p_state: localWordleState[d] })
          .then(({ error }) => { if (error) console.warn('[hydrate back-sync wordle]', d, error.message) })
      )).catch(e => console.warn('[hydrate back-sync wordle]', e?.message || e))
    }

    // Login streak removed from hydrate in Phase G (audit finding 2.1) —
    // tick_login_streak RPC is now the single source of truth for the
    // login_streak jsonb column. AppInner's tickLoginStreak useEffect
    // calls the RPC after auth settles; hydrate no longer reads, merges,
    // or writes login_streak.

    // Notify AppInner — its xp/stats/dailyHistory useState initializers
    // already ran with the pre-hydration localStorage values, so they need
    // a kick to pick up the freshly-merged numbers.
    try {
      window.dispatchEvent(new CustomEvent('biq:hydrated', {
        detail: {
          xp: finalXp,
          stats: finalStats,
          dailyScores: mergedDailyScores,
          wordleState: mergedWordleState,
        },
      }))
    } catch {}
  }

  // Scan localStorage for keys matching `pattern`. For each match, parse
  // the stored JSON and run `extract` to either pluck a value or reject
  // (return null). Returns a {ymd: value} map. Used by hydrate for
  // daily_scores / wordle_state local-side reads.
  function readLocalMap(pattern, extract) {
    const out = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        const m = k && k.match(pattern)
        if (!m) continue
        try {
          const p = JSON.parse(localStorage.getItem(k))
          const v = extract(p)
          if (v !== null && v !== undefined) out[m[1]] = v
        } catch {}
      }
    } catch {}
    return out
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username }
      }
    })
    if (error) return { error }
    return { data }
  }

  async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    // Order matters:
    // 1. Invalidate the userId ref synchronously so any in-flight hydrate
    //    (resolved during the supabase.auth.signOut await window below)
    //    sees the mismatch and bails before writing.
    // 2. Wipe user-scoped localStorage keys synchronously so the next
    //    user's hydrate doesn't max/union-merge stale data on shared
    //    devices. Device-scoped keys (settings, UX dismiss-flags) are
    //    preserved by the helper.
    // 3. End the auth session.
    // 4. Clear ballIQ_guestMode + isGuest state.
    activeUserIdRef.current = null
    clearAllUserLocalStorage()
    await supabase.auth.signOut()
    localStorage.removeItem('ballIQ_guestMode')
    setIsGuest(false)
  }

  function continueAsGuest() {
    localStorage.setItem('ballIQ_guestMode', 'true')
    setIsGuest(true)
  }

  function exitGuestMode() {
    localStorage.removeItem('ballIQ_guestMode')
    setIsGuest(false)
  }

  // Crops centered to a square and resizes to targetW × targetH, then encodes JPEG.
  async function resizeImageToBlob(file, targetW, targetH) {
    let dataURL
    try {
      dataURL = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = () => reject(new Error('FileReader error: ' + (r.error?.message || 'unknown')))
        r.readAsDataURL(file)
      })
    } catch (e) {
      console.error('[uploadAvatar] resize: FileReader failed', e)
      throw e
    }
    let img
    try {
      img = await new Promise((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = () => reject(new Error('Image decode failed (format may be unsupported — e.g. HEIC)'))
        i.src = dataURL
      })
    } catch (e) {
      console.error('[uploadAvatar] resize: image decode failed', e)
      throw e
    }
    const side = Math.min(img.width, img.height)
    if (!side) {
      console.error('[uploadAvatar] resize: image has zero dimensions')
      throw new Error('Image has no dimensions')
    }
    const sx = (img.width - side) / 2
    const sy = (img.height - side) / 2
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('[uploadAvatar] resize: could not get canvas 2d context')
      throw new Error('Canvas 2d unavailable')
    }
    ctx.drawImage(img, sx, sy, side, side, 0, 0, targetW, targetH)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))), 'image/jpeg', 0.85)
    })
    return blob
  }

  // Dumps EVERY property of an error-like object — Supabase's storage errors
  // are plain objects (not Error instances), so JSON.stringify can collapse
  // them to "{}" unless we pull props out by name.
  function dumpErr(e) {
    if (!e) return null
    const out = {}
    const keys = [
      'message', 'statusCode', 'status', 'error', 'cause', 'name', 'code',
      'details', 'hint', 'stack', 'originalError', 'body',
    ]
    for (const k of keys) {
      try { if (e[k] !== undefined) out[k] = e[k] } catch {}
    }
    try {
      for (const k of Object.getOwnPropertyNames(e)) {
        if (out[k] === undefined) out[k] = e[k]
      }
    } catch {}
    return out
  }

  // Direct REST-API upload path. Bypasses the supabase-js storage client
  // entirely and POSTs the blob straight to the Supabase Storage endpoint
  // with the current session's Bearer token, so we can see the raw HTTP
  // status + body if anything fails.
  async function uploadAvatar(file) {
    if (!file) {
      console.error('[uploadAvatar] aborted: no file')
      return { error: 'No file provided' }
    }
    // Defensive guard. The primary gate is in App.jsx handleFileChosen
    // (rejects before CropModal opens, where the actual decode/canvas
    // crash happens on low-RAM devices). This catches any future caller
    // that uploads a blob without going through the cropper path.
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'Photo is too large — please pick one under 10MB' }
    }

    // 1. Pull the live session — need the access_token for the Bearer header
    //    and user.id for the object path.
    const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
    if (sessErr) console.error('[uploadAvatar] getSession error', dumpErr(sessErr))
    const token = sessionData?.session?.access_token
    const userId = sessionData?.session?.user?.id
    if (!token || !userId) {
      console.error('[uploadAvatar] aborted: no session token / user id')
      return { error: 'No session' }
    }

    // 2. Resize/crop to a 400×400 JPEG blob
    let blob
    try {
      blob = await resizeImageToBlob(file, 400, 400)
      if (!blob || blob.size === 0) return { error: 'Empty blob after resize' }
    } catch (e) {
      console.error('[uploadAvatar] resize threw', dumpErr(e))
      return { error: e?.message || 'Resize failed' }
    }

    // 3. Upload via REST — POST /storage/v1/object/avatars/{path}
    const path = `${userId}.jpg`
    const url = `https://blcisypmngimqkwxrrdm.supabase.co/storage/v1/object/avatars/${path}`
    let response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: blob,
      })
    } catch (fetchEx) {
      console.error('[uploadAvatar] fetch threw (network-level failure)', dumpErr(fetchEx))
      return { error: fetchEx?.message || 'Network error' }
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '<unreadable body>')
      console.error('[uploadAvatar] Storage upload failed:', response.status, bodyText)
      console.error('[uploadAvatar] response details', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        contentType: response.headers.get('content-type'),
      })
      return { error: bodyText }
    }

    // 4. Build a public URL with a cache-busting query string
    const publicUrl = `https://blcisypmngimqkwxrrdm.supabase.co/storage/v1/object/public/avatars/${path}?t=${Date.now()}`

    // 5. Persist onto the profile row
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
      if (updErr) {
        console.error('[uploadAvatar] profile update failed', dumpErr(updErr))
      }
    } catch (updEx) {
      console.error('[uploadAvatar] profile update threw', dumpErr(updEx))
    }

    // Update in-memory profile so the avatar swaps immediately
    setProfile(prev => (prev ? { ...prev, avatar_url: publicUrl } : prev))
    return { url: publicUrl }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isGuest,
      signUp,
      signIn,
      signOut,
      continueAsGuest,
      exitGuestMode,
      uploadAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
