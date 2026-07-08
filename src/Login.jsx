import React, { useState, useEffect } from 'react'
import { useAuth } from './useAuth.jsx'
import { isProfaneUsername } from './lib/profanity.js'

// ── Brand-moment login (Claude Design "Ball IQ Sign In" handoff) ──────────────
// A RE-STYLE of the auth screen: progressive disclosure (choices first, email
// form on demand), an immersive flaming-ball brand moment, and one-tap social.
// Every auth handler below (Apple / Google / email / reset / guest, gated-prompt
// variants, session-expired, profanity + duplicate-username handling) is
// UNCHANGED — only the presentation is new. Dark-only by design: the ambient
// flame glow IS the brand moment, so the screen ignores the light theme.

// KNOWN-GOOD Apple glyph (HIG, viewBox 0 0 384 512). Reused verbatim — the
// broken Apple logos elsewhere all came from hand-rolled paths, so we never
// author a new one. Inline SVG renders identically on iOS/Android/web.
const APPLE_GLYPH = (
  <svg width="17" height="17" viewBox="0 0 384 512" fill="#000" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
)
const GOOGLE_GLYPH = (
  <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
)
const MAIL_GLYPH = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA0B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
)

const LOGIN_CSS = `
.biql input::placeholder { color:#5A5F70; }
.biql input:focus { outline:none; border-color:rgba(88,204,2,0.55); box-shadow:0 0 0 3px rgba(88,204,2,0.16); }
@keyframes biqGlow { 0%,100%{ opacity:.72; transform:translateX(-50%) scale(1); } 50%{ opacity:1; transform:translateX(-50%) scale(1.06); } }
@keyframes biqFloat { 0%,100%{ transform:translateY(0) rotate(-3deg); } 50%{ transform:translateY(-9px) rotate(3deg); } }
.biql-glow { animation:biqGlow 6s ease-in-out infinite; }
.biql-ball { animation:biqFloat 7s ease-in-out infinite; }
.biql-google:hover, .biql-email:hover { background:#1A1D27 !important; }
.biql-guest:hover { background:#101219 !important; border-color:#2A2D3A !important; color:#E8EAF0 !important; }
.biql-icobtn:hover { border-color:#3A3D4A !important; }
.biql-login-top:hover { color:#fff !important; }
@media (prefers-reduced-motion: reduce) { .biql-glow, .biql-ball { animation:none !important; } }
`

function readLastEmail() {
  try { return localStorage.getItem('biq_last_email') || '' } catch { return '' }
}

// Sprint #100 guest-first: reward-framed hero copy shown when the Login overlay
// is opened from a specific gated feature. Keeps the "what's in it for me" front
// and centre instead of a bare wall.
const PROMPT_COPY = {
  online:      { title: 'Sign up to play online', sub: 'Create a free account to challenge friends in real-time 1v1 — and keep your stats and streak.' },
  friends:     { title: 'Sign up to add friends', sub: 'Create a free account to add friends, compare scores, and challenge them.' },
  leaderboard: { title: 'Sign up for leaderboards', sub: 'Create a free account to climb the leaderboard and save your progress across devices.' },
  save:        { title: 'Save your progress', sub: 'Create a free account so your XP, stats, and streak follow you to any device.' },
}

const C = {
  canvas: '#0A0A0A', card: '#14161E', border: '#242836', borderHi: '#2A2D3A',
  green: '#58CC02', greenOn: '#06230C', greenSoft: '#8AE042',
  t1: '#F0F1F5', t1b: '#E8EAF0', t2: '#9BA0B8', t3: '#6E7180', legal: '#5A5F70',
}

export default function Login({ asOverlay = false, onClose, promptReason = null }) {
  const { signUp, signIn, resetPassword, signInWithGoogle, signInWithApple, continueAsGuest } = useAuth()
  // Progressive disclosure: 'choices' (brand + social + guest) → 'email' (form).
  const [view, setView] = useState('choices')
  // Internal auth mode stays 'login'/'signup' so handleSubmit is untouched.
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState(readLastEmail)
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sessionExpired, setSessionExpired] = useState(promptReason === 'expired')
  const prompt = promptReason && PROMPT_COPY[promptReason] ? PROMPT_COPY[promptReason] : null

  // "Forgot password?" — sends the Supabase recovery email; the link lands on
  // balliq.app/reset where the app mounts the new-password overlay.
  const handleForgot = async () => {
    if (loading) return
    setError(''); setMessage('')
    const target = (email || '').trim()
    if (!target) { setError('Type your email above first, then tap "Forgot?"'); return }
    setLoading(true)
    try {
      const { error } = await resetPassword(target)
      if (error) setError(error.message || 'Could not send the reset email — try again.')
      else setMessage(`Reset link sent to ${target} — check your inbox.`)
    } finally { setLoading(false) }
  }

  // Listen for session-expired events (useAuth dispatches on unexpected SIGNED_OUT).
  useEffect(() => {
    const onSessionExpired = () => setSessionExpired(true)
    window.addEventListener('biq:session-expired', onSessionExpired)
    return () => window.removeEventListener('biq:session-expired', onSessionExpired)
  }, [])

  async function handleSubmit() {
    setError(''); setMessage(''); setLoading(true)
    try {
      if (mode === 'signup') {
        if (username.trim().length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return }
        if (isProfaneUsername(username.trim())) {
          // Client-side gate before hitting Supabase. The SQL trigger
          // profiles_profanity_check is the bypass-proof backstop.
          setError("This username isn't allowed. Please choose another."); setLoading(false); return
        }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
        const { data, error } = await signUp(email, password, username.trim())
        if (error) {
          // handle_new_user trigger fails signup when username collides with the
          // profiles.username UNIQUE constraint; map both Postgres + gotrue forms.
          const raw = error.message || ''
          const isDupUsername = /profiles_username_key|duplicate key|already (?:registered|taken)|database error saving new user/i.test(raw)
          setError(isDupUsername ? `Username "${username.trim()}" is already taken — try another.` : (raw || 'Sign-up failed — please try again.'))
        } else if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
          // Supabase enumeration-protection returns success with identities=[]
          // when the email already exists (no confirmation email sent).
          setMessage('Looks like you already have an account. Try logging in instead.')
        } else {
          setMessage('Check your email to confirm your account — then come back and log in. Your email will be filled in for you.')
        }
      } else {
        const { data, error } = await signIn(email, password)
        if (error) setError(error.message || 'Log-in failed — please try again.')
        else if (!data?.session) setError('Log-in succeeded but no session was returned. Please try again.')
        // On success, onAuthStateChange swaps to AppInner, unmounting this.
      }
    } catch (e) {
      console.error('[login] handleSubmit exception', e?.name, e?.message)
      setError(`Unexpected error: ${e?.message || String(e)}`)
    }
    setLoading(false)
  }

  const socialSignIn = (fn, label) => async () => {
    setError(''); setMessage(''); setLoading(true)
    const { error } = await fn()
    if (error) setError(error.message || `${label} sign-in failed`)
    setLoading(false)
  }

  const openEmail  = () => { setError(''); setMessage(''); setMode('signup'); setView('email') }
  const openSignin = () => { setError(''); setMessage(''); setMode('login'); setView('email') }
  const backToChoices = () => { setError(''); setMessage(''); setView('choices') }
  const toggleMode = () => { setMode((m) => (m === 'signup' ? 'login' : 'signup')); setError(''); setMessage('') }
  // "Continue as guest": the front door creates a guest session; the on-demand
  // overlay (the user is ALREADY a guest) dismisses AND routes to Home. Landing
  // back on the screen the overlay was opened from (e.g. Settings' sign-in row)
  // surprised testers who expected "just let me play". AppInner listens for
  // biq:go-home (the overlay is its sibling in AppGate).
  const guestContinue = () => {
    if (asOverlay) {
      try { window.dispatchEvent(new CustomEvent('biq:go-home')) } catch {}
      onClose?.()
    } else {
      continueAsGuest()
    }
  }

  const isSignup = mode === 'signup'
  const heroTitle = prompt ? prompt.title : 'How good is your Ball IQ?'
  const heroSub = prompt ? prompt.sub : 'Save your streak, climb the leaderboards and take anyone on in online 1v1.'
  const emailBusy = loading || !email || !password

  const S = {
    root: {
      position: 'fixed', inset: 0, zIndex: 1000, overflowY: 'auto',
      background: C.canvas, color: C.t1,
      display: 'flex', justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, sans-serif',
    },
    glow: {
      position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
      width: 520, height: 460, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(circle at 50% 40%, rgba(255,140,0,0.30), rgba(255,106,0,0.10) 38%, rgba(88,204,2,0.05) 58%, transparent 72%)',
    },
    panel: {
      position: 'relative', zIndex: 2, width: '100%', maxWidth: 430, minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      padding: 'max(env(safe-area-inset-top,0px),18px) 26px calc(env(safe-area-inset-bottom,0px) + 26px)',
    },
    icoBtn: {
      width: 34, height: 34, borderRadius: 11, background: C.card, border: `1px solid ${C.border}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      flexShrink: 0, WebkitTapHighlightColor: 'transparent',
    },
    btnBase: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%',
      minHeight: 44, borderRadius: 15, fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit',
      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 6 },
    input: {
      width: '100%', padding: '14px 15px', borderRadius: 13, background: C.card,
      border: `1px solid ${C.border}`, color: '#fff', fontSize: 15, fontFamily: 'inherit',
    },
    banner: {
      padding: '10px 14px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`,
      color: C.t1b, fontSize: 13, textAlign: 'center', marginBottom: 12,
    },
    err: { color: '#ef4444', fontSize: 13.5, textAlign: 'center', lineHeight: 1.5 },
    msg: { color: C.greenSoft, fontSize: 13.5, textAlign: 'center', lineHeight: 1.5 },
  }

  const banner = sessionExpired ? <div style={S.banner}>Session expired — please log in again</div> : null

  return (
    <div className="biql" style={S.root}>
      <style>{LOGIN_CSS}</style>
      <div className="biql-glow" style={S.glow} aria-hidden="true" />
      <div style={S.panel}>

        {view === 'choices' ? (
          <>
            {/* top row: close (overlay only) + Log in */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: '0 0 auto' }}>
              {asOverlay ? (
                <button type="button" className="biql-icobtn" style={S.icoBtn} onClick={onClose} aria-label="Close">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                </button>
              ) : <span style={{ width: 34 }} />}
              <button type="button" className="biql-login-top" onClick={openSignin}
                style={{ border: 'none', background: 'none', fontSize: 14.5, fontWeight: 800, color: C.t1b, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                Log in
              </button>
            </div>

            {/* brand hero */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 0' }}>
              <img src="/icon-192.png" alt="Ball IQ" className="biql-ball" width="104" height="104" style={{ width: 104, height: 104, borderRadius: 26 }} />
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.025em', color: '#fff', marginTop: 22 }}>Ball&nbsp;<span style={{ color: C.green }}>IQ</span></div>
              <h1 style={{ margin: '14px 0 0', maxWidth: '15ch', fontSize: 26, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.02em', color: '#fff' }}>{heroTitle}</h1>
              <p style={{ margin: '12px 0 0', maxWidth: '30ch', fontSize: 14.5, lineHeight: 1.5, color: C.t2 }}>{heroSub}</p>
            </div>

            {/* alerts (social sign-in failures / expired) */}
            {(banner || error || message) && (
              <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {banner}
                {error && <div style={S.err}>{error}</div>}
                {message && <div style={S.msg}>{message}</div>}
              </div>
            )}

            {/* button stack (bottom-anchored) */}
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" onClick={socialSignIn(signInWithApple, 'Apple')} disabled={loading} aria-label="Continue with Apple"
                style={{ ...S.btnBase, padding: 16, border: 'none', background: '#fff', color: '#000', opacity: loading ? 0.6 : 1 }}>
                {APPLE_GLYPH}<span>Continue with Apple</span>
              </button>
              <button type="button" className="biql-google" onClick={socialSignIn(signInWithGoogle, 'Google')} disabled={loading} aria-label="Continue with Google"
                style={{ ...S.btnBase, padding: 16, border: `1px solid ${C.borderHi}`, background: C.card, color: C.t1, opacity: loading ? 0.6 : 1 }}>
                {GOOGLE_GLYPH}<span>Continue with Google</span>
              </button>
              <button type="button" className="biql-email" onClick={openEmail} aria-label="Continue with email"
                style={{ ...S.btnBase, padding: 16, border: `1px solid ${C.borderHi}`, background: C.card, color: C.t1 }}>
                {MAIL_GLYPH}<span>Continue with email</span>
              </button>
              <button type="button" className="biql-guest" onClick={guestContinue}
                style={{ ...S.btnBase, gap: 8, padding: 15, marginTop: 2, border: `1px solid ${C.border}`, background: 'transparent', color: C.t2, fontSize: 15 }}>
                Continue as guest
              </button>
              <div style={{ textAlign: 'center', fontSize: 11.5, lineHeight: 1.5, color: C.legal, marginTop: 4 }}>
                By continuing you agree to our <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: C.t2, textDecoration: 'none' }}>Terms</a> &amp; <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: C.t2, textDecoration: 'none' }}>Privacy Policy</a>.
              </div>
            </div>
          </>
        ) : (
          <>
            {/* back row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
              <button type="button" className="biql-icobtn" style={S.icoBtn} onClick={backToChoices} aria-label="Back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.t2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.t2 }}>Back</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>{isSignup ? 'Create your account' : 'Welcome back'}</div>
              <p style={{ margin: '8px 0 0', maxWidth: '36ch', fontSize: 14, lineHeight: 1.5, color: C.t2 }}>
                {isSignup ? 'Your XP, streak and stats will follow you to any device.' : 'Log in to pick up your streak and rating right where you left off.'}
              </p>
            </div>

            {banner && <div style={{ marginTop: 18 }}>{banner}</div>}

            <form style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22 }}
              onSubmit={(e) => { e.preventDefault(); if (emailBusy) return; handleSubmit() }}>
              {isSignup && (
                <label style={{ display: 'block' }}>
                  <span style={S.label}>Username</span>
                  <input type="text" name="username" autoComplete="username" placeholder="Your player name"
                    value={username} onChange={(e) => setUsername(e.target.value)} style={S.input}
                    autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                </label>
              )}
              <label style={{ display: 'block' }}>
                <span style={S.label}>Email</span>
                <input type="email" name="email" autoComplete="email" placeholder="you@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} style={S.input}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Password</span>
                  {!isSignup && (
                    <button type="button" onClick={handleForgot} disabled={loading}
                      style={{ border: 'none', background: 'none', padding: 0, fontSize: 12, fontWeight: 700, color: C.greenSoft, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>Forgot?</button>
                  )}
                </span>
                <span style={{ position: 'relative', display: 'block' }}>
                  <input type={showPw ? 'text' : 'password'} name="password"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    placeholder={isSignup ? 'Create a password' : 'Your password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ ...S.input, paddingRight: 46 }} />
                  <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: C.t3, WebkitTapHighlightColor: 'transparent' }}>
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 2l20 20" /><path d="M6.7 6.7A10.4 10.4 0 0 0 1 12s4 7 11 7a10 10 0 0 0 5.3-1.5M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </span>
              </label>

              {error && <div style={S.err}>{error}</div>}
              {message && <div style={S.msg}>{message}</div>}

              <button type="submit" disabled={emailBusy}
                style={{ width: '100%', marginTop: 6, padding: 16, minHeight: 52, border: 'none', borderRadius: 14, background: C.green, color: C.greenOn, fontSize: 16, fontWeight: 800, fontFamily: 'inherit', cursor: emailBusy ? 'not-allowed' : 'pointer', opacity: emailBusy ? 0.5 : 1, boxShadow: '0 10px 26px -8px rgba(88,204,2,0.6)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                {loading ? <span className="btn-spin" role="status" aria-label={isSignup ? 'Creating account' : 'Logging in'} /> : (isSignup ? 'Create account' : 'Log in')}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: C.t2 }}>
              {isSignup ? 'Already have an account? ' : 'New to Ball IQ? '}
              <button type="button" onClick={toggleMode}
                style={{ border: 'none', background: 'none', padding: 0, fontSize: 14, fontWeight: 800, color: C.green, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                {isSignup ? 'Log in' : 'Create account'}
              </button>
            </div>

            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #16181F', textAlign: 'center' }}>
              <button type="button" onClick={backToChoices}
                style={{ border: 'none', background: 'none', fontSize: 13.5, fontWeight: 700, color: C.t3, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>← All sign-in options</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
