// Side-effect import: registers `beforeinstallprompt` + `appinstalled`
// listeners at module-load (pre-React) so we capture Chrome's early-firing
// install event before the React tree mounts. Missing this event leaves the
// install button inert for the rest of the session.
import './installPrompt.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import { AuthProvider } from './useAuth.jsx'

// Sentry initialization — runs before app mount so render errors land in
// Sentry from the very first paint. DSN is environment-gated: prod builds
// ship with VITE_SENTRY_DSN set (Vercel env var); dev/preview builds run
// without it and Sentry no-ops silently.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_GIT_SHA,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1,
    // PII scrub: strip user email + Supabase tokens from breadcrumbs and
    // event metadata. defaultPII is false; this hardens further.
    beforeSend(event) {
      if (event.user) {
        delete event.user.email
        delete event.user.username
      }
      if (event.breadcrumbs) {
        for (const bc of event.breadcrumbs) {
          if (bc.data?.headers) {
            delete bc.data.headers.Authorization
            delete bc.data.headers.apikey
          }
        }
      }
      return event
    },
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
