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
    const dataURL = await new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result)
      r.onerror = () => reject(new Error('Could not read file'))
      r.readAsDataURL(file)
    })
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Could not decode image'))
      i.src = dataURL
    })
    const side = Math.min(img.width, img.height)
    if (!side) throw new Error('Image has no dimensions')
    const sx = (img.width - side) / 2
    const sy = (img.height - side) / 2
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, sx, sy, side, side, 0, 0, targetW, targetH)
    return new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas encode failed'))), 'image/jpeg', 0.85)
    })
  }

  // Uploads an avatar image for the current user to the "avatars" Storage bucket
  // at "{userId}/avatar.jpg" (upsert), updates profiles.avatar_url, and refreshes
  // the in-memory profile so the UI shows it immediately.
  async function uploadAvatar(file) {
    if (!user?.id) return { error: new Error('Not signed in') }
    if (!file) return { error: new Error('No file provided') }
    try {
      const blob = await resizeImageToBlob(file, 400, 400)
      const path = `${user.id}/avatar.jpg`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
      if (upErr) {
        console.error('[uploadAvatar] storage upload failed', upErr)
        return { error: upErr }
      }
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = pub?.publicUrl
      if (!publicUrl) return { error: new Error('No public URL returned') }
      // Cache-bust so the freshly uploaded image replaces any cached copy
      const cachedUrl = `${publicUrl}?t=${Date.now()}`
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
      if (updErr) {
        console.error('[uploadAvatar] profile update failed', updErr)
        return { error: updErr }
      }
      setProfile(prev => (prev ? { ...prev, avatar_url: cachedUrl } : prev))
      return { url: cachedUrl }
    } catch (e) {
      console.error('[uploadAvatar] exception', e)
      return { error: e }
    }
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
