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
//
// ⚡️ Every getItem used to cross the JS↔native bridge. A device log of ONE app
// open showed 33 `Preferences get` calls, ~30 of them returning the identical
// access token — because supabase-js reads the session store on essentially
// every getSession(), and getSession() runs on every query that attaches a JWT.
// Each call marshals a ~1KB JWT across WKWebView and, being async, yields the
// event loop, so they serialise into the startup critical path.
//
// `mirror` is a write-through in-memory cache. It is safe to treat as
// authoritative because this adapter is the ONLY writer of these keys — nothing
// on the native side mutates them out of band. Use `has()` rather than a null
// check so "loaded, and the value is null" (logged out) is distinguishable from
// "not yet loaded" and doesn't re-hit the bridge on every read.
const mirror = new Map()

// ⚠️ A TRANSIENT BRIDGE FAILURE MUST NEVER READ AS "LOGGED OUT".
// Diagnosed 2026-09-01 from a real player's device: after every app update he
// was greeted by the sign-in card — yet prod showed his June session ALIVE,
// refreshed that same morning, with no re-auth since Aug 3. The logout was an
// illusion the client painted for itself: a cold start after an update always
// needs this storage read, and if it comes back empty ONCE, supabase-js
// resolves getSession() as null, the app commits to guest, and 107 of his
// games forked into a guest bucket the server never saw. So: retry the bridge
// once, and distinguish "the bridge failed" (undefined — never cached, never
// trusted) from "the key is truly absent" (null — cacheable).
const prefGet = async (key) => {
  try { return (await Preferences.get({ key })).value }
  catch {
    try { return (await Preferences.get({ key })).value }
    catch { return undefined }
  }
}

const nativeStorage = {
  getItem: async (key) => {
    if (mirror.has(key)) return mirror.get(key)
    const v = await prefGet(key)
    if (v != null) { mirror.set(key, v); return v }
    // One-time migration from the old WKWebView localStorage location.
    // ⚠️ Deliberately OUTSIDE the Preferences try/catch: the old shape ran
    // this inside it, so the one boot where the bridge failed was also the
    // one boot that skipped the fallback that would have saved the session.
    let legacy = null
    try { legacy = (typeof localStorage !== 'undefined') ? localStorage.getItem(key) : null } catch {}
    if (legacy != null) {
      mirror.set(key, legacy)
      try { await Preferences.set({ key, value: legacy }) } catch { /* best-effort */ }
      return legacy
    }
    if (v === undefined) return null   // bridge failure: do NOT cache
    mirror.set(key, null)
    return null
  },
  setItem: async (key, value) => {
    mirror.set(key, value)
    try { await Preferences.set({ key, value }) } catch { /* best-effort */ }
  },
  removeItem: async (key) => {
    mirror.set(key, null)
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

// Read the persisted session blob WITHOUT going through supabase-js.
// useAuth's boot watchdog uses this to answer one question when getSession()
// is slow or offline: "does a session exist on disk?" If yes, the player is
// shown as themselves (a refresh in flight, writes queue via the score
// outbox) instead of being demoted to a guest with a sign-in card — the
// false logout that forked a real player's history in two. Returns the
// parsed blob when it has a user, else null. Never throws.
export async function readStoredSession() {
  try {
    const raw = isNative
      ? await nativeStorage.getItem(STORAGE_KEY)
      : (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
    if (!raw) return null
    const blob = JSON.parse(raw)
    return blob?.user?.id ? blob : null
  } catch { return null }
}
