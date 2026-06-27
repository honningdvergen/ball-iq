import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// Trim both values defensively. Trailing whitespace / newlines slip in
// through env-var managers (Vercel dashboard paste, .env files saved by
// editors that auto-append a final newline, copy-paste from the Supabase
// dashboard) and get URL-encoded into %0A in WebSocket connection URLs —
// which silently breaks realtime subscriptions with a recurring 1006
// close error in the console. The .trim() keeps the client resilient
// regardless of where the value originated.
const supabaseUrl = 'https://blcisypmngimqkwxrrdm.supabase.co'.trim()
const supabaseKey = (import.meta.env.VITE_SUPABASE_KEY || '').trim()

// Supabase's default session store key for this project ref. Set explicitly so
// the value matches what web clients already use (no web re-login) and so the
// native migration below targets the right key.
const STORAGE_KEY = 'sb-blcisypmngimqkwxrrdm-auth-token'

const isNative = (() => { try { return Capacitor.isNativePlatform() } catch { return false } })()

// On native iOS/Android the default Supabase session store is WKWebView
// localStorage, which iOS evicts after ~7 days of inactivity / under storage
// pressure — the root cause of the periodic forced re-login. Persist the
// session in durable Capacitor Preferences (native key-value store, not subject
// to WebView eviction) instead. `getItem` transparently migrates an existing
// localStorage session into Preferences on first read, so shipping this switch
// does NOT log current native users out. Web keeps the default localStorage
// store untouched. (Does not address the separate rotating-refresh-token cause
// of cross-device logout — see the session-persistence backlog note.)
const nativeStorage = {
  getItem: async (key) => {
    try {
      const { value } = await Preferences.get({ key })
      if (value != null) return value
      // One-time migration from the old WKWebView localStorage location.
      const legacy = (typeof localStorage !== 'undefined') ? localStorage.getItem(key) : null
      if (legacy != null) {
        await Preferences.set({ key, value: legacy })
        return legacy
      }
    } catch { /* fall through to null */ }
    return null
  },
  setItem: async (key, value) => {
    try { await Preferences.set({ key, value }) } catch { /* best-effort */ }
  },
  removeItem: async (key) => {
    try { await Preferences.remove({ key }) } catch { /* best-effort */ }
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key) } catch {}
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: STORAGE_KEY,
    ...(isNative ? { storage: nativeStorage } : {}),
  },
})
