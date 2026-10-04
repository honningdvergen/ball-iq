// Supabase (PostgREST / supabase-js) returns errors as PLAIN OBJECTS
// ({ message, code, details, hint }), not Error instances. Passing one to
// Sentry.captureException produced a synthetic "Object captured as exception
// with keys: code, details, hint, message" with no useful title, and every
// call site grouped into one issue (BALL-IQ-1Y). Rather than patch each of the
// dozen capture sites (and every future one), main.jsx's beforeSend runs this.

const NETWORK_FAILURE = /Load failed|Failed to fetch|NetworkError|network connection was lost|Internet connection appears to be offline/i

export function isSupabaseErrorObject(e) {
  return !!e && typeof e === 'object' && !(e instanceof Error) &&
    typeof e.message === 'string' && ('code' in e || 'details' in e || 'hint' in e)
}

// Returns the event to send, or null to drop it.
export function normalizeSupabaseError(event, hint) {
  const oe = hint?.originalException
  if (!isSupabaseErrorObject(oe)) return event
  // supabase-js wraps a fetch that never reached the server in the same
  // shape ({ message: 'TypeError: Load failed', code: '' }). That is the
  // player being offline, not a bug — and the writes that hit it are re-sent
  // by useAuth's hydrate back-sync on the next session.
  if (NETWORK_FAILURE.test(oe.message)) return null
  const ex = event.exception?.values?.[0]
  if (ex) {
    ex.type = 'SupabaseError'
    ex.value = oe.code ? `${oe.code}: ${oe.message}` : oe.message
  }
  event.extra = { ...event.extra, supabase: { code: oe.code, details: oe.details, hint: oe.hint } }
  // One issue per call site and error code, not one for the whole app.
  event.fingerprint = ['supabase-error', String(event.tags?.area || '{{ default }}'), String(oe.code || oe.message)]
  return event
}
