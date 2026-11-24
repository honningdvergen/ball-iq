// Credentials never ride into a crash report.
//
// Supabase hands the session back in a URL: `#access_token=…&refresh_token=…`
// after OAuth or a magic link, `?code=…` with PKCE. main.jsx used to scrub
// three named fields of a breadcrumb (url, to, from) in beforeSend, which
// missed everything else a breadcrumb can hold. The one that mattered: the
// console breadcrumb keeps the ARGUMENTS of every console.log, and the native
// sign-in listener logged the whole callback URL (24 Nov 2026 review).
//
// Three places call this:
//   beforeBreadcrumb       the breadcrumb is cleaned before it is stored. That
//                          also covers a native shell, where stored breadcrumbs
//                          are copied to the Android/iOS SDK and a native crash
//                          is sent without ever passing beforeSend.
//   beforeSend             the same pass again over the finished event, plus
//                          the parts that are not breadcrumbs.
//   beforeSendTransaction  the same for the sampled page-load measurements.
//
// Two rules. Nothing here mutates what it is given: a console breadcrumb holds
// the very objects the app logged, and rewriting those would change the app.
// And it fails CLOSED: whatever it cannot read into (an Error, a URL object,
// something nested too deep) is replaced by cleaned text or a placeholder,
// never passed on as it came, because on native there is no second pass.

// name=value in a URL or a query string, at the start of the text or after ? & #.
const TOKEN_PARAM = /(^|[?&#])(access_token|refresh_token|provider_token|provider_refresh_token|id_token|token_hash|code_verifier|token|code|apikey)=[^&#\s"'<>]+/gi
// The same names as JSON or log text: "refresh_token":"…", refresh_token: …
const TOKEN_FIELD = /("?(?:access_token|refresh_token|provider_token|provider_refresh_token|id_token|token_hash|code_verifier)"?\s*:\s*"?)[^"&#\s,}]+/gi
// A JWT wherever it turns up (a Supabase access token, the anon key, Apple's identity token).
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/g
const SECRET_KEY = /^(authorization|apikey|password|secret|email|access_?token|refresh_?token|provider_?token|provider_?refresh_?token|id_?token|identity_?token|authorization_?code|token_hash|code_verifier)$/i
const MAX_DEPTH = 6
const MAX_BREADTH = 100

export function scrubText(s) {
  if (typeof s !== 'string') return s
  return s.replace(TOKEN_PARAM, '$1$2=REDACTED').replace(TOKEN_FIELD, '$1REDACTED').replace(JWT, 'REDACTED_JWT')
}

// A URL loses its fragment whole (nothing after # helps a bug report) and has
// its token parameters redacted.
export function scrubUrl(u) {
  if (typeof u !== 'string') return u
  return scrubText(u.split('#')[0])
}

const isPlain = (v) => {
  if (v === null || typeof v !== 'object') return false
  const p = Object.getPrototypeOf(v)
  return p === Object.prototype || p === null
}

const asText = (v) => {
  try { return scrubText(String(v)) } catch { return '[unreadable]' }
}

// Strings are cleaned; arrays and plain objects are copied and walked; any
// other object (an Error, a URL, a DOM node, a class instance) becomes its
// cleaned text. `seen` maps an object to its copy, so a repeated reference or
// a cycle gets the cleaned copy too, never the original.
export function scrubDeep(v, depth = 0, seen = new WeakMap()) {
  if (typeof v === 'string') return scrubText(v)
  if (v === null || typeof v !== 'object') return v
  if (seen.has(v)) return seen.get(v)
  if (depth >= MAX_DEPTH) return '[deep]'
  if (Array.isArray(v)) {
    const out = []
    seen.set(v, out)
    const n = Math.min(v.length, MAX_BREADTH)
    for (let i = 0; i < n; i++) out.push(scrubDeep(v[i], depth + 1, seen))
    if (v.length > n) out.push(`[${v.length - n} more]`)
    return out
  }
  if (!isPlain(v)) return asText(v)
  const out = {}
  seen.set(v, out)
  const keys = Object.keys(v)
  const n = Math.min(keys.length, MAX_BREADTH)
  for (let i = 0; i < n; i++) {
    const k = keys[i]
    out[k] = SECRET_KEY.test(k) ? 'REDACTED' : scrubDeep(v[k], depth + 1, seen)
  }
  if (keys.length > n) out['[more]'] = keys.length - n
  return out
}

export function scrubBreadcrumb(bc) {
  if (!bc || typeof bc !== 'object') return bc
  const out = { ...bc }
  if (typeof out.message === 'string') out.message = scrubText(out.message)
  if (out.data && typeof out.data === 'object') {
    const data = scrubDeep(out.data)
    if (isPlain(data)) {
      for (const k of ['url', 'to', 'from']) {
        if (typeof out.data[k] === 'string') data[k] = scrubUrl(out.data[k])
      }
    }
    out.data = data
  }
  return out
}

// The finished event or transaction, in place (it is Sentry's own object by
// now). Each part is cleaned on its own: a part that cannot be cleaned is
// REMOVED, and the report still goes out with its exception and stack. A
// scrub bug must not be able to silence crash reporting.
export function scrubEvent(event) {
  if (!event || typeof event !== 'object') return event
  const part = (key, fn) => {
    if (event[key] == null) return
    try { event[key] = fn(event[key]) } catch { delete event[key] }
  }
  part('request', (r) => {
    const out = { ...r }
    if (typeof out.url === 'string') out.url = scrubUrl(out.url)
    if (out.headers) out.headers = scrubDeep(out.headers)
    if (typeof out.query_string === 'string') out.query_string = scrubText(out.query_string)
    return out
  })
  part('breadcrumbs', (b) => (Array.isArray(b) ? b.map(scrubBreadcrumb) : b))
  part('message', (m) => (typeof m === 'string' ? scrubText(m) : scrubDeep(m)))
  part('extra', (x) => scrubDeep(x))
  // The exception is never removed: it is the report.
  try {
    for (const ex of event.exception?.values || []) {
      if (typeof ex.value === 'string') ex.value = scrubText(ex.value)
    }
  } catch { /* keep it as it is */ }
  // A transaction's spans name the requests the page made.
  part('spans', (spans) => {
    if (!Array.isArray(spans)) return spans
    for (const sp of spans) {
      if (typeof sp.description === 'string') sp.description = scrubText(sp.description)
      if (sp.data) sp.data = scrubDeep(sp.data)
    }
    return spans
  })
  return event
}
