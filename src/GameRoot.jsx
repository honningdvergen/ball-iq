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
import App from './App.jsx'

export default function GameRoot() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}
