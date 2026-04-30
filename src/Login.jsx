import React, { useState } from 'react'
import { useAuth } from './useAuth.jsx'

function readTheme() {
  try {
    const raw = localStorage.getItem('biq_settings')
    if (!raw) return 'dark'
    const s = JSON.parse(raw)
    return s.theme === 'light' ? 'light' : 'dark'
  } catch { return 'dark' }
}

export default function Login() {
  const { signUp, signIn, continueAsGuest } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const isLight = readTheme() === 'light'

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
        // Diagnostic — surface what the auth call actually returned. If
        // login regresses again, the next reproduction will have visible
        // state in the console (Mac Safari → Develop → iPhone for mobile).
        console.log('[login] signUp returned', {
          hasError: !!error,
          errorMessage: error?.message,
          hasUser: !!data?.user,
          hasSession: !!data?.session,
        })
        if (error) setError(error.message || 'Sign-up failed — please try again.')
        else setMessage('Check your email to confirm your account, then log in.')
      } else {
        const { data, error } = await signIn(email, password)
        console.log('[login] signIn returned', {
          hasError: !!error,
          errorMessage: error?.message,
          hasUser: !!data?.user,
          hasSession: !!data?.session,
        })
        if (error) {
          setError(error.message || 'Login failed — please try again.')
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
      console.error('[login] handleSubmit exception', e)
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
        muted: '#666',
        divider: '#555',
        border: '#2a2a2a',
        inputBg: '#141414',
        accent: '#22c55e',
        accentText: '#000',
      }

  const styles = {
    container: {
      minHeight: '100dvh',
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
  }

  return (
    <div style={styles.container}>
      <div style={styles.logo}>⚽</div>
      <div style={styles.title}>Ball IQ</div>
      <div style={styles.subtitle}>
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </div>

      <div style={styles.form}>
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            autoCapitalize="none"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoCapitalize="none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{
            ...styles.button,
            ...(loading || !email || !password ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

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
            {mode === 'login' ? 'Sign up' : 'Log in'}
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
