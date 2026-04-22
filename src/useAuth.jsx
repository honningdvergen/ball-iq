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

  // Uploads an avatar image for the current user to the "avatars" Storage bucket
  // at "{userId}.jpg" (upsert), updates profiles.avatar_url, and refreshes
  // the in-memory profile so the UI shows it immediately.
  async function uploadAvatar(file) {
    console.log('[uploadAvatar] called', { hasFile: !!file, userId: user?.id, isGuest })
    if (!user?.id) {
      console.error('[uploadAvatar] aborted: no signed-in user')
      return { error: new Error('Not signed in') }
    }
    if (!file) {
      console.error('[uploadAvatar] aborted: no file')
      return { error: new Error('No file provided') }
    }
    // Verify the Supabase client actually has an auth session — storage RLS relies on it.
    try {
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
      if (sessErr) console.error('[uploadAvatar] session fetch error', sessErr)
      const session = sessionData?.session
      console.log('[uploadAvatar] session check', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionUserMatches: session?.user?.id === user.id,
        accessTokenPresent: !!session?.access_token,
        expiresAt: session?.expires_at,
      })
      if (!session) {
        console.error('[uploadAvatar] no active session — cannot upload under RLS')
        return { error: new Error('No active auth session — please sign in again') }
      }
    } catch (sessEx) {
      console.error('[uploadAvatar] session check threw', sessEx)
    }

    let blob
    try {
      blob = await resizeImageToBlob(file, 400, 400)
      if (!blob || blob.size === 0) {
        console.error('[uploadAvatar] blob generation yielded empty result')
        return { error: new Error('Failed to generate image') }
      }
    } catch (e) {
      console.error('[uploadAvatar] resize step threw', e)
      return { error: e }
    }

    // Use a flat "{userId}.jpg" path (some folder-based RLS policies cause 403s
    // for the "{userId}/avatar.jpg" pattern; flat keeps RLS simpler).
    const path = `${user.id}.jpg`
    console.log('[uploadAvatar] uploading', { bucket: 'avatars', path, size: blob.size })
    let upResult
    try {
      upResult = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
    } catch (uploadEx) {
      console.error('[uploadAvatar] storage.upload threw', uploadEx)
      return { error: uploadEx }
    }
    if (upResult?.error) {
      console.error('[uploadAvatar] storage upload failed', {
        message: upResult.error.message,
        statusCode: upResult.error.statusCode,
        error: upResult.error.error,
        name: upResult.error.name,
        hint: 'If statusCode is 403 or 401 the RLS policy on storage.objects is rejecting the insert — verify the "avatars" bucket policy checks (auth.uid())::text = (storage.foldername(name))[1] for folder paths, or name = auth.uid() || \'.jpg\' for flat paths.',
      })
      return { error: upResult.error }
    }
    console.log('[uploadAvatar] storage upload succeeded', upResult?.data)

    let publicUrl
    try {
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      publicUrl = pub?.publicUrl
      console.log('[uploadAvatar] public URL resolved', { publicUrl })
    } catch (urlEx) {
      console.error('[uploadAvatar] getPublicUrl threw', urlEx)
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
      console.error('[uploadAvatar] profiles.update threw', updEx)
      return { error: updEx }
    }
    if (updResult?.error) {
      console.error('[uploadAvatar] profile update failed', {
        message: updResult.error.message,
        code: updResult.error.code,
        details: updResult.error.details,
        hint: updResult.error.hint,
      })
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
