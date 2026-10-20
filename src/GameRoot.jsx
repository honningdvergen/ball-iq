// The full game tree — auth context + the App shell — isolated into its own
// lazy chunk. This is the perf-inversion boundary: main.jsx used to import App
// STATICALLY, which pulled the entire ~200KB-gz game bundle (App.jsx, the
// question bank, useAuth, the Supabase client, …) into the entry chunk that
// EVERY visitor downloads — including the marketing front door at `/`, the
// SEO- and LCP-critical path we most want fast. Marketing was lazy; the game
// was eager. Splitting the game behind React.lazy(() => import('./GameRoot'))
// means marketing visitors never fetch the game code at all, and game visitors
// get an early module-eval warm-up (see main.jsx) so the fetch overlaps mount.
import { AuthProvider } from './useAuth.jsx'
import App, { ErrorBoundary } from './App.jsx'
import { initI18n } from './i18n/index.js'

// i18n boot: choose the language (biq_lang, else the device) and, for a
// Spanish player, start fetching the lazy es table. main.jsx's loadGameRoot
// waits on this before the first render so a Spanish player does not see an
// English flash; it always resolves (English at once, otherwise when the table
// lands or after a 2 s cap). See src/i18n/index.js.
export const i18nReady = initI18n()

export default function GameRoot() {
  // ErrorBoundary ABOVE AuthProvider: the root boundary inside App can't catch
  // a throw in the provider itself (session hydration, storage access). This
  // outer wrap turns an auth-init crash into the styled fallback + Sentry
  // capture instead of a white screen. (medical error-observability.)
  return (
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  )
}
