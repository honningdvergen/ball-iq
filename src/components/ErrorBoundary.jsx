import React from "react";
import * as Sentry from "@sentry/react";
import { markBadReviewMoment } from "../lib/review.js";

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
// Lives outside App.jsx so main.jsx can ALSO wrap the marketing tree with it —
// before this extraction that rendered under a bare Suspense, so any render
// throw white-screened it with zero Sentry capture.
// Exported so GameRoot can ALSO wrap AuthProvider with it — a render/init throw
// inside useAuth used to escape every boundary (the root boundary rendered
// inside App, a child of the provider) and white-screen the app.
// (medical error-observability, medium.)
//
// ⚠️ ITS WORDS ARE INLINE, IN BOTH LANGUAGES (i18n step 7). main.jsx imports
// this file, so importing the i18n runtime here would put it (and Home's
// English table) in the bundle every marketing page loads. It reads the
// language <html lang> already carries (i18n/index.js keeps it in step); the
// lines are en.js / es.js's eb.* keys, and tests/unit/i18n-step7.test.js holds
// the two copies together.
export const CRASH_COPY = {
  en: { title: "Something went wrong", body: "Even the best teams have bad days. Tap below to restart.", restart: "Restart App" },
  es: { title: "Algo ha fallado", body: "Hasta los mejores equipos tienen un mal día. Toca abajo para reiniciar.", restart: "Reiniciar la app" },
};
const crashCopy = () => {
  try { return CRASH_COPY[/^es/i.test(document.documentElement.lang || "") ? "es" : "en"]; } catch { return CRASH_COPY.en; }
};
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // A stale chunk failed and main.jsx is already reloading the page: the
    // error is expected and the fallback would only flash before navigation.
    if (window.__biqReloading) return;
    console.error("[boundary]", error?.message || "Unknown error");
    // ⚠️ A WHITE SCREEN IS THE WORST MOMENT IN THE PRODUCT, and it was the one
    // moment the rating engine did not know about. TabErrorBoundary marked it;
    // THIS boundary — the one that white-screens the whole app with "Something
    // went wrong", and which also wraps the marketing tree and AuthProvider —
    // did not. So a player could crash the app, restart, finish a game and be
    // asked "Enjoying Ball IQ?" inside the suppression window that exists
    // precisely to stop that. Suppresses the ask for 24h.
    try { markBadReviewMoment(); } catch { /* storage unavailable; never block the fallback */ }
    // Native: launchAutoHide is false, so a crash BEFORE the app hides the
    // splash would leave this fallback rendering UNDER an unhideable splash —
    // "Restart App" unreachable. Hide it here (idempotent; no-op off-native).
    try {
      if (window.Capacitor?.isNativePlatform?.()) {
        import('@capacitor/splash-screen')
          .then(({ SplashScreen }) => SplashScreen.hide())
          .catch(() => {});
      }
    } catch { /* noop */ }
    // Sprint #75 QQ7: forward to Sentry so launch-day monitoring sees
    // render crashes. Without this, any crash that triggers the fallback
    // UI is invisible — users see "Something went wrong" but ops never
    // knows. info.componentStack pinpoints where in the React tree.
    try {
      Sentry.captureException(error, {
        tags: { boundary: 'app-root' },
        contexts: { react: { componentStack: info?.componentStack } },
      });
    } catch {}
  }
  render() {
    if (this.state.hasError && window.__biqReloading) return null;
    if (this.state.hasError) {
      const copy = crashCopy();
      return (
        <div style={{
          minHeight:"100dvh", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"32px 24px",
          background:"var(--bg)", fontFamily:"Inter,sans-serif", textAlign:"center"
        }}>
          <div style={{fontSize:48, marginBottom:16}}>⚽</div>
          <div style={{fontSize:20, fontWeight:800, color:"var(--text)", marginBottom:8, letterSpacing:"-0.3px"}}>
            {copy.title}
          </div>
          <div style={{fontSize:14, color:"var(--t2)", lineHeight:1.7, marginBottom:28}}>
            {copy.body}
          </div>
          <button
            onClick={() => { this.setState({ hasError:false, error:null }); window.location.reload(); }}
            style={{
              padding:"13px 28px", background:"var(--accent)", border:"none",
              borderRadius:999,boxShadow:"0 8px 22px -8px rgba(88,204,2,0.55)", fontFamily:"Inter,sans-serif", fontSize:14,
              fontWeight:700, color:"var(--grn-ink)", cursor:"pointer"
            }}
          >
            {copy.restart}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
