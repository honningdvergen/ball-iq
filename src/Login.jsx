import React, { useState } from 'react'
import { useAuth } from './useAuth.js'

export default function Login() {
  const { signUp, signIn, continueAsGuest } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setError('')
    setMessage('')
    setLoading(true)

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
      const { error } = await signUp(email, password, username.trim())
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account, then log in.')
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
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
      color: '#888',
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
      border: '1px solid #2a2a2a',
      backgroundColor: '#141414',
      color: '#fff',
      outline: 'none',
      fontFamily: 'inherit',
    },
    button: {
      padding: '14px 16px',
      fontSize: '16px',
      fontWeight: 600,
      borderRadius: '12px',
      border: 'none',
      backgroundColor: '#22c55e',
      color: '#000',
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
      color: '#888',
      textAlign: 'center',
      marginTop: '16px',
    },
    toggleLink: {
      color: '#22c55e',
      cursor: 'pointer',
      fontWeight: 600,
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
      color: '#555',
      fontSize: '13px',
      gap: '12px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#2a2a2a',
    },
    guestButton: {
      padding: '14px 16px',
      fontSize: '15px',
      fontWeight: 500,
      borderRadius: '12px',
      border: '1px solid #2a2a2a',
      backgroundColor: 'transparent',
      color: '#ccc',
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
      color: '#22c55e',
      fontSize: '14px',
      textAlign: 'center',
      marginTop: '8px',
    },
    guestNote: {
      fontSize: '12px',
      color: '#666',
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
