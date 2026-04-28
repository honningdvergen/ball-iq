import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

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
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('[loadProfile] supabase error', { userId, status, code: error.code, message: error.message, details: error.details, hint: error.hint })
        return
      }
      if (!data) {
        console.warn('[loadProfile] no profile row found for user — keeping metadata fallback', { userId, username: metaUsername })
        return
      }
      // Merge: if DB row is missing username, prefer user_metadata.username over blank
      const merged = { ...data, username: data.username || metaUsername || 'Player' }
      setProfile(merged)
    } catch (e) {
      console.error('[loadProfile] exception', { userId, error: e })
    }
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
    console.log('[uploadAvatar] resize: starting', { fileName: file?.name, fileType: file?.type, fileSize: file?.size })
    let dataURL
    try {
      dataURL = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = () => reject(new Error('FileReader error: ' + (r.error?.message || 'unknown')))
        r.readAsDataURL(file)
      })
      console.log('[uploadAvatar] resize: file read', { dataURLBytes: dataURL?.length })
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
      console.log('[uploadAvatar] resize: image decoded', { w: img.width, h: img.height })
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
    console.log('[uploadAvatar] resize: blob ready', { blobSize: blob.size, blobType: blob.type })
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
    console.log('[uploadAvatar] called', { hasFile: !!file, userId: user?.id, isGuest })
    if (!file) {
      console.error('[uploadAvatar] aborted: no file')
      return { error: 'No file provided' }
    }

    // 1. Pull the live session — need the access_token for the Bearer header
    //    and user.id for the object path.
    const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
    if (sessErr) console.error('[uploadAvatar] getSession error', dumpErr(sessErr))
    const token = sessionData?.session?.access_token
    const userId = sessionData?.session?.user?.id
    console.log('[uploadAvatar] session', {
      hasToken: !!token,
      tokenPrefix: token ? token.slice(0, 20) + '…' : null,
      userId,
      userMatches: userId === user?.id,
      expiresAt: sessionData?.session?.expires_at,
    })
    if (!token || !userId) {
      console.error('[uploadAvatar] aborted: no session token / user id')
      return { error: 'No session' }
    }

    // 2. Resize/crop to a 400×400 JPEG blob
    let blob
    try {
      blob = await resizeImageToBlob(file, 400, 400)
      if (!blob || blob.size === 0) return { error: 'Empty blob after resize' }
      console.log('[uploadAvatar] blob ready', { size: blob.size, type: blob.type })
    } catch (e) {
      console.error('[uploadAvatar] resize threw', dumpErr(e))
      return { error: e?.message || 'Resize failed' }
    }

    // 3. Upload via REST — POST /storage/v1/object/avatars/{path}
    const path = `${userId}.jpg`
    const url = `https://blcisypmngimqkwxrrdm.supabase.co/storage/v1/object/avatars/${path}`
    console.log('[uploadAvatar] POST', url)
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

    console.log('[uploadAvatar] upload OK', response.status)

    // 4. Build a public URL with a cache-busting query string
    const publicUrl = `https://blcisypmngimqkwxrrdm.supabase.co/storage/v1/object/public/avatars/${path}?t=${Date.now()}`
    console.log('[uploadAvatar] public URL', publicUrl)

    // 5. Persist onto the profile row
    try {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
      if (updErr) {
        console.error('[uploadAvatar] profile update failed', dumpErr(updErr))
      } else {
        console.log('[uploadAvatar] profile row updated')
      }
    } catch (updEx) {
      console.error('[uploadAvatar] profile update threw', dumpErr(updEx))
    }

    // Update in-memory profile so the avatar swaps immediately
    setProfile(prev => (prev ? { ...prev, avatar_url: publicUrl } : prev))
    console.log('[uploadAvatar] complete', { publicUrl })
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
