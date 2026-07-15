import React from "react";
import * as Sentry from "@sentry/react";

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
// Lives outside App.jsx so main.jsx can ALSO wrap the marketing / play-preview
// trees with it — before this extraction those rendered under bare Suspense,
// so any render throw white-screened them with zero Sentry capture.
// Exported so GameRoot can ALSO wrap AuthProvider with it — a render/init throw
// inside useAuth used to escape every boundary (the root boundary rendered
// inside App, a child of the provider) and white-screen the app.
// (medical error-observability, medium.)
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[boundary]", error?.message || "Unknown error");
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
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight:"100dvh", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"32px 24px",
          background:"#0A0A0A", fontFamily:"Inter,sans-serif", textAlign:"center"
        }}>
          <div style={{fontSize:48, marginBottom:16}}>⚽</div>
          <div style={{fontSize:20, fontWeight:800, color:"#F0F1F5", marginBottom:8, letterSpacing:"-0.3px"}}>
            Something went wrong
          </div>
          <div style={{fontSize:14, color:"#9BA0B8", lineHeight:1.7, marginBottom:28}}>
            Even the best teams have bad days. Tap below to restart.
          </div>
          <button
            onClick={() => { this.setState({ hasError:false, error:null }); window.location.reload(); }}
            style={{
              padding:"13px 28px", background:"#58CC02", border:"none",
              borderRadius:11, fontFamily:"Inter,sans-serif", fontSize:14,
              fontWeight:700, color:"#0a1a00", cursor:"pointer"
            }}
          >
            Restart App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
