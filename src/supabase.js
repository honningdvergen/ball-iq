import { createClient } from '@supabase/supabase-js'

// Trim both values defensively. Trailing whitespace / newlines slip in
// through env-var managers (Vercel dashboard paste, .env files saved by
// editors that auto-append a final newline, copy-paste from the Supabase
// dashboard) and get URL-encoded into %0A in WebSocket connection URLs —
// which silently breaks realtime subscriptions with a recurring 1006
// close error in the console. The .trim() keeps the client resilient
// regardless of where the value originated.
const supabaseUrl = 'https://blcisypmngimqkwxrrdm.supabase.co'.trim()
const supabaseKey = (import.meta.env.VITE_SUPABASE_KEY || '').trim()

export const supabase = createClient(supabaseUrl, supabaseKey)
