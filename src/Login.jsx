import React, { useState, useEffect } from 'react'
import { useAuth } from './useAuth.jsx'

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
  const { signUp, signIn, continueAsGuest } = useAuth()
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
      position: 'fixed',
      inset: 0,
      overflowY: 'auto',
      backgroundColor: palette.bg,
      color: palette.text,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
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
          <span
            style={styles.toggleLink}
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
              setMessage('')
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>

        {/* APPLE/GOOGLE SLOT — uncomment when OAuth is set up
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span>or</span>
          <div style={styles.dividerLine} />
        </div>
        <button style={styles.guestButton}> Continue with Apple</button>
        <button style={styles.guestButton}>G Continue with Google</button>
        */}

        <div style={styles.divider}>
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
