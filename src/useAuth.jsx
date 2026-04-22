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
      avatar_id: 'ball',
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

  // TEMP DEBUG BUILD — simplified to isolate where the upload is failing.
  // Step 1: upload a 1×1 white PNG test blob with NO resize step.
  // Step 2: if the test upload succeeds, also run the real image upload.
  // All error objects are fully expanded. Also logs a prefix of the session
  // access token so we can confirm auth is reaching the storage request.
  async function uploadAvatar(file) {
    console.log('[uploadAvatar] called', { hasFile: !!file, userId: user?.id, isGuest })
    if (!user?.id) {
      console.error('[uploadAvatar] aborted: no signed-in user')
      return { error: new Error('Not signed in') }
    }

    // ── Session + token snapshot ──────────────────────────────────────────────
    let accessToken = null
    try {
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
      if (sessErr) console.error('[uploadAvatar] session fetch error', dumpErr(sessErr))
      const session = sessionData?.session
      accessToken = session?.access_token || null
      console.log('[uploadAvatar] session check', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionUserMatches: session?.user?.id === user.id,
        accessTokenPresent: !!accessToken,
        accessTokenPrefix: accessToken ? accessToken.slice(0, 20) + '…' : null,
        expiresAt: session?.expires_at,
        expiresInSec: session?.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : null,
      })
      if (!session) {
        console.error('[uploadAvatar] no active session — cannot upload under RLS')
        return { error: new Error('No active auth session — please sign in again') }
      }
    } catch (sessEx) {
      console.error('[uploadAvatar] session check threw', dumpErr(sessEx))
    }

    // ── STEP 1: tiny 1×1 PNG probe, no resize ────────────────────────────────
    // A 1×1 white PNG (base64). Smallest valid PNG we can throw at the bucket.
    const WHITE_1x1_PNG_B64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
    let probeBlob = null
    try {
      const bin = atob(WHITE_1x1_PNG_B64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      probeBlob = new Blob([bytes], { type: 'image/png' })
      console.log('[uploadAvatar] probe blob ready', { size: probeBlob.size, type: probeBlob.type })
    } catch (probeEx) {
      console.error('[uploadAvatar] could not build probe blob', dumpErr(probeEx))
    }

    const probePath = `${user.id}-probe.png`
    console.log('[uploadAvatar] probe upload begin', { bucket: 'avatars', path: probePath })
    let probeResult
    try {
      probeResult = await supabase.storage
        .from('avatars')
        .upload(probePath, probeBlob, { contentType: 'image/png', upsert: true })
    } catch (probeThrow) {
      console.error('[uploadAvatar] PROBE threw — storage connection itself failed', dumpErr(probeThrow))
      return { error: probeThrow }
    }
    if (probeResult?.error) {
      console.error('[uploadAvatar] PROBE rejected by Supabase', dumpErr(probeResult.error))
      console.error('[uploadAvatar] PROBE full result object', probeResult)
      console.error(
        '[uploadAvatar] PROBE hint: to inspect your storage policies run this in the Supabase SQL Editor:\n' +
        "SELECT policyname, cmd, qual, with_check\n" +
        "FROM pg_policies\n" +
        "WHERE tablename = 'objects' AND schemaname = 'storage';\n" +
        'Expected "avatars" bucket INSERT/UPDATE policies to allow:\n' +
        "  bucket_id = 'avatars' AND auth.role() = 'authenticated' AND name = auth.uid()::text || '.png'  -- (for flat path)\n" +
        'OR for a folder path:\n' +
        "  bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text"
      )
      return { error: probeResult.error }
    }
    console.log('[uploadAvatar] PROBE succeeded', probeResult?.data)

    // ── STEP 2: proceed with the real photo upload ───────────────────────────
    if (!file) {
      console.warn('[uploadAvatar] probe succeeded but no file provided — done')
      return { url: null, probeOnly: true }
    }

    let blob
    try {
      blob = await resizeImageToBlob(file, 400, 400)
      if (!blob || blob.size === 0) {
        console.error('[uploadAvatar] blob generation yielded empty result')
        return { error: new Error('Failed to generate image') }
      }
    } catch (e) {
      console.error('[uploadAvatar] resize step threw', dumpErr(e))
      return { error: e }
    }

    const path = `${user.id}.jpg`
    console.log('[uploadAvatar] real upload begin', { bucket: 'avatars', path, size: blob.size })
    let upResult
    try {
      upResult = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
    } catch (uploadEx) {
      console.error('[uploadAvatar] real upload threw', dumpErr(uploadEx))
      return { error: uploadEx }
    }
    if (upResult?.error) {
      console.error('[uploadAvatar] real upload rejected', dumpErr(upResult.error))
      console.error('[uploadAvatar] real upload full result object', upResult)
      return { error: upResult.error }
    }
    console.log('[uploadAvatar] real upload succeeded', upResult?.data)

    let publicUrl
    try {
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      publicUrl = pub?.publicUrl
      console.log('[uploadAvatar] public URL resolved', { publicUrl })
    } catch (urlEx) {
      console.error('[uploadAvatar] getPublicUrl threw', dumpErr(urlEx))
      return { error: urlEx }
    }
    if (!publicUrl) {
      console.error('[uploadAvatar] getPublicUrl returned no URL')
      return { error: new Error('No public URL returned') }
    }

    // Cache-bust so the freshly uploaded image replaces any cached copy
    const cachedUrl = `${publicUrl}?t=${Date.now()}`

    let updResult
    try {
      updResult = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
    } catch (updEx) {
      console.error('[uploadAvatar] profiles.update threw', dumpErr(updEx))
      return { error: updEx }
    }
    if (updResult?.error) {
      console.error('[uploadAvatar] profile update failed', dumpErr(updResult.error))
      return { error: updResult.error }
    }
    console.log('[uploadAvatar] profile row updated')

    setProfile(prev => (prev ? { ...prev, avatar_url: cachedUrl } : prev))
    console.log('[uploadAvatar] complete', { cachedUrl })
    return { url: cachedUrl }
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
