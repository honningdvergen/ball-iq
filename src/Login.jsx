import React, { useState, useEffect } from 'react'
import { useAuth } from './useAuth.jsx'
import { isProfaneUsername } from './lib/profanity.js'

// Sprint #94 III3: Apple HIG-compliant Sign in with Apple button. Apple's
// guidelines (https://developer.apple.com/design/human-interface-guidelines/
// sign-in-with-apple#Button-design) require the official wordmark + Apple
// logo, 44pt min height, 5-12pt corner radius, and forbid custom text. On
// dark backgrounds: white button + black Apple logo + black text. On light
// backgrounds: black button + white Apple logo + white text. Inline SVG so
// the logo renders identically across iOS, Android, and desktop browsers.
const APPLE_LOGO_SVG = (color) => (
  <svg width="14" height="17" viewBox="0 0 170 200" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path fill={color} d="M139.3 105.7c-.3-29.3 23.9-43.4 25-44.1-13.6-19.9-34.8-22.6-42.4-22.9-18.1-1.8-35.3 10.7-44.5 10.7-9.2 0-23.4-10.5-38.5-10.2C20 39.5 2.4 50.7-7.2 67.9c-22.7 39.5-5.8 97.8 16.2 129.8 10.7 15.7 23.5 33.3 40.3 32.7 16.2-.7 22.4-10.5 41.9-10.5 19.6 0 25 10.5 42.1 10.2 17.4-.3 28.4-15.9 39-31.8 12.4-18.2 17.5-35.9 17.7-36.8-.4-.2-33.9-13-34.2-51.8zM110.4 21c8.9-10.8 14.9-25.8 13.3-40.7-12.8.5-28.2 8.5-37.4 19.3-8.3 9.5-15.5 24.7-13.5 39.3 14.3 1.1 28.7-7.2 37.6-17.9z" transform="translate(0 -39)"/>
  </svg>
)
// Sprint #94 III3: Google brand-mark SVG. Google's "G" logomark in 4-color
// brand palette. Per Google's branding guidelines, on the white-button
// variant this exact logo + black text + neutral border is the canonical
// rendering across the web.
const GOOGLE_LOGO_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
)

function readTheme() {
  try {
    const raw = localStorage.getItem('biq_settings')
    if (!raw) return 'dark'
    const s = JSON.parse(raw)
    return s.theme === 'light' ? 'light' : 'dark'
  } catch { return 'dark' }
}

function readLastEmail() {
  try { return localStorage.getItem('biq_last_email') || '' } catch { return '' }
}

export default function Login() {
  const { signUp, signIn, signInWithGoogle, signInWithApple, continueAsGuest } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState(readLastEmail)
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const isLight = readTheme() === 'light'

  // Listen for session-expired events dispatched by useAuth.jsx's
  // onAuthStateChange handler (fires when SIGNED_OUT happens without
  // the intentional sentinel — i.e., refresh token expired, rotated
  // invalid, or server-side revoked). One-shot per Login mount: state
  // is set once and stays until successful sign-in unmounts Login.
  useEffect(() => {
    const onSessionExpired = () => setSessionExpired(true)
    window.addEventListener('biq:session-expired', onSessionExpired)
    return () => window.removeEventListener('biq:session-expired', onSessionExpired)
  }, [])

  async function handleSubmit() {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!username.trim() || username.length < 3) {
          setError('Username must be at least 3 characters')
          setLoading(false)
          return
        }
        if (isProfaneUsername(username.trim())) {
          // Sprint #84 AAA2: client-side gate before hitting Supabase. The
          // SQL trigger profiles_profanity_check is the bypass-proof backstop;
          // this just gives a faster error without a round-trip.
          setError("This username isn't allowed. Please choose another.")
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        const { data, error } = await signUp(email, password, username.trim())
        if (error) {
          // Sprint #75 QQ2: handle_new_user trigger fails the whole signup
          // when username collides with profiles.username UNIQUE constraint.
          // Supabase surfaces the raw Postgres error ("duplicate key value
          // violates unique constraint 'profiles_username_key'") or the
          // gotrue wrapper ("Database error saving new user"). Map both
          // back to a sentence the user can act on.
          const raw = error.message || ''
          const isDupUsername = /profiles_username_key|duplicate key|already (?:registered|taken)|database error saving new user/i.test(raw)
          setError(isDupUsername
            ? `Username "${username.trim()}" is already taken — try another.`
            : (raw || 'Sign-up failed — please try again.'))
        } else if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
          // Sprint #76 RR2: Supabase's enumeration-protection returns success
          // with data.user.identities=[] when the email is already registered
          // (no confirmation email sent). Without this branch the user would
          // see "Check your email" and wait forever for a message that never
          // arrives. Now they get an actionable nudge instead.
          setMessage('Looks like you already have an account. Try signing in instead.')
        } else {
          setMessage('Check your email to confirm your account, then sign in.')
        }
      } else {
        const { data, error } = await signIn(email, password)
        if (error) {
          setError(error.message || 'Sign-in failed — please try again.')
        } else if (!data?.session) {
          // Auth API returned no error but no session either — defensive
          // path so the user sees something instead of a silent button reset.
          setError('Sign-in succeeded but no session was returned. Please try again.')
        }
        // On true success, onAuthStateChange in useAuth.jsx will fire and
        // AppGate will swap to AppInner, unmounting this component.
      }
    } catch (e) {
      // Surface any thrown exception (network failure, Supabase client
      // misconfiguration, etc.) instead of letting the button silently reset.
      // Log only name + message explicitly — never the full error object —
      // so a future code change that throws with password content can't
      // leak it through this path.
      console.error('[login] handleSubmit exception', e?.name, e?.message)
      setError(`Unexpected error: ${e?.message || String(e)}`)
    }
    setLoading(false)
  }

  const palette = isLight
    ? {
        bg: '#F2F2F7',
        text: '#1C1C1E',
        subtle: '#48484A',
        muted: '#6E6E73',
        divider: '#8E8E93',
        border: '#E5E5EA',
        inputBg: '#FFFFFF',
        accent: '#34A853',
        accentText: '#FFFFFF',
      }
    : {
        bg: '#0a0a0a',
        text: '#fff',
        subtle: '#888',
        muted: '#999',
        divider: '#555',
        border: '#2a2a2a',
        inputBg: '#141414',
        accent: '#22c55e',
        accentText: '#000',
      }

  const styles = {
    container: {
      // position:fixed + inset:0 escapes #root's desktop padding-left:220px
      // (which otherwise shifts the login content right of viewport-center).
      // overflowY:auto keeps the form scrollable on small viewports / when
      // the iOS keyboard pushes content above the fold.
      //
      // Sprint #91 followup #2: justifyContent flex-start (was 'center'). The
      // centered layout combined with iOS WKWebView's input-focus auto-scroll
      // caused the whole form to jolt upward when the keyboard rose, because
      // the centering math used the full viewport height (including the
      // keyboard-occluded region). Top-anchored layout puts the form's email
      // field naturally above where the keyboard appears (no auto-scroll
      // needed). paddingTop = safe area + comfortable visual breathing room.
      position: 'fixed',
      inset: 0,
      overflowY: 'auto',
      backgroundColor: palette.bg,
      color: palette.text,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 'max(env(safe-area-inset-top,0px),24px) 24px 24px',
      paddingTop: 'calc(max(env(safe-area-inset-top,0px),24px) + 60px)',
      fontFamily: 'Inter, -apple-system, sans-serif',
    },
    logo: {
      fontSize: '64px',
      marginBottom: '8px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 800,
      marginBottom: '8px',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      fontSize: '15px',
      color: palette.subtle,
      marginBottom: '40px',
      textAlign: 'center',
    },
    form: {
      width: '100%',
      maxWidth: '360px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    input: {
      padding: '14px 16px',
      fontSize: '16px',
      borderRadius: '12px',
      border: `1px solid ${palette.border}`,
      backgroundColor: palette.inputBg,
      color: palette.text,
      outline: 'none',
      fontFamily: 'inherit',
    },
    button: {
      padding: '14px 16px',
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '12px',
      border: 'none',
      backgroundColor: palette.accent,
      color: palette.accentText,
      cursor: 'pointer',
      fontFamily: 'inherit',
      marginTop: '8px',
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    toggleText: {
      fontSize: '14px',
      color: palette.subtle,
      textAlign: 'center',
      marginTop: '16px',
    },
    toggleLink: {
      color: palette.accent,
      cursor: 'pointer',
      fontWeight: 600,
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
      color: palette.divider,
      fontSize: '13px',
      gap: '12px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: palette.border,
    },
    guestButton: {
      padding: '14px 16px',
      fontSize: '15px',
      fontWeight: 500,
      borderRadius: '12px',
      border: `1px solid ${palette.border}`,
      backgroundColor: 'transparent',
      color: palette.text,
      cursor: 'pointer',
      fontFamily: 'inherit',
      width: '100%',
    },
    error: {
      color: '#ef4444',
      fontSize: '14px',
      textAlign: 'center',
      marginTop: '8px',
    },
    message: {
      color: palette.accent,
      fontSize: '14px',
      textAlign: 'center',
      marginTop: '8px',
    },
    guestNote: {
      fontSize: '12px',
      color: palette.muted,
      textAlign: 'center',
      marginTop: '8px',
      maxWidth: '280px',
      lineHeight: 1.5,
    },
    expiredBanner: {
      padding: '10px 14px',
      borderRadius: '10px',
      backgroundColor: palette.inputBg,
      border: `1px solid ${palette.border}`,
      color: palette.text,
      fontSize: '13px',
      textAlign: 'center',
      marginBottom: '16px',
      width: '100%',
      maxWidth: '360px',
    },
  }

  return (
    <div style={styles.container}>
      <div style={styles.logo}>⚽</div>
      <div style={styles.title}>Ball <em style={{ color: palette.accent, fontStyle: 'normal' }}>IQ</em></div>
      <div style={styles.subtitle}>
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </div>

      {sessionExpired && (
        <div style={styles.expiredBanner}>
          Session expired — please sign in again
        </div>
      )}

      {/* Real <form> wrapping so password managers (1Password, iCloud
          Keychain, Chrome autofill) can detect the field grouping. The
          submit handler is the same handleSubmit used previously by the
          button click — the form-submit path lets Enter in any input
          submit naturally, matching standard web UX. */}
      <form
        style={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (loading || !email || !password) return;
          handleSubmit();
        }}
      >
        {mode === 'signup' && (
          <input
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            autoCapitalize="none"
            /* Sprint #77 SS1: usernames are handles, not dictionary
               words. iOS autocorrect on "MessiFan99" → "Massive" is a
               real footgun on the signup flow. */
            autoCorrect="off"
            spellCheck={false}
          />
        )}
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <input
          type="password"
          name="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{
            ...styles.button,
            ...(loading || !email || !password ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      {/* Post-form chrome — kept in its own width-matched column so it
          aligns visually with the form above. Was previously a child of
          the same .form div; now a sibling so we can host a real <form>. */}
      <div style={styles.form}>
        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.message}>{message}</div>}

        <div style={styles.toggleText}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          {/* Sprint #90 EEE2: button instead of span so it is keyboard-reachable
              (Tab focus + Enter activate). Sprint #91 follow-up: negative-margin
              trick enlarges the tap target to ~74×34 without shifting the visual
              text — Alex reported the previous padding:0 sizing felt laggy on
              iPhone because the hit area matched the glyph bounds. touchAction +
              webkitTapHighlightColor kill the iOS 300ms tap recognition delay
              and the gray flash respectively. Inherits styles.toggleLink color
              + weight to keep the link appearance identical. */}
          <button
            type="button"
            style={{
              ...styles.toggleLink,
              background: 'transparent',
              border: 'none',
              padding: '8px 12px',
              margin: '-8px -12px',
              cursor: 'pointer',
              font: 'inherit',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setMessage('')
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        {/* Sprint #94 III3 — Social sign-in. Both buttons live above the
            "Continue as guest" path. Apple appears first per Apple HIG
            guideline 4.8 (must be at least as prominent as competing
            providers). On native, taps open @capacitor/browser; the OAuth
            callback hits app.balliq://auth/callback (registered in
            ios/App/App/Info.plist) → appUrlOpen handler exchanges code
            for session. On web, signInWithOAuth full-page redirects to
            Supabase + back. Errors render in the same setError slot the
            email/password flow uses. */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span>or</span>
          <div style={styles.dividerLine} />
        </div>

        <button
          type="button"
          onClick={async () => {
            setError('')
            setMessage('')
            setLoading(true)
            const { error } = await signInWithApple()
            if (error) setError(error.message || 'Apple sign-in failed')
            setLoading(false)
          }}
          disabled={loading}
          aria-label="Sign in with Apple"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '14px 16px',
            minHeight: 44,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            borderRadius: 12,
            border: 'none',
            background: isLight ? '#000' : '#fff',
            color: isLight ? '#fff' : '#000',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {APPLE_LOGO_SVG(isLight ? '#fff' : '#000')}
          <span>Sign in with Apple</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            setError('')
            setMessage('')
            setLoading(true)
            const { error } = await signInWithGoogle()
            if (error) setError(error.message || 'Google sign-in failed')
            setLoading(false)
          }}
          disabled={loading}
          aria-label="Continue with Google"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '13px 16px',
            minHeight: 44,
            fontSize: 15,
            fontWeight: 500,
            fontFamily: 'inherit',
            borderRadius: 12,
            border: `1px solid ${isLight ? '#dadce0' : '#3c4043'}`,
            background: isLight ? '#fff' : '#1f1f1f',
            color: isLight ? '#1f1f1f' : '#e8eaed',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {GOOGLE_LOGO_SVG}
          <span>Continue with Google</span>
        </button>

        <div style={{...styles.divider, marginTop: 16}}>
          <div style={styles.dividerLine} />
          <span>or</span>
          <div style={styles.dividerLine} />
        </div>

        <button onClick={continueAsGuest} style={styles.guestButton}>
          Continue as guest
        </button>
        <div style={styles.guestNote}>
          Guests can play solo & local multiplayer. Sign up for online 1v1 and leaderboards.
        </div>
      </div>
    </div>
  )
}
