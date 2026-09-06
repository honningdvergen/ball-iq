// Install / get-the-app card. Split out of the Settings screen (lazy now).
import { useInstallPrompt } from "../installPrompt.js";
import { Home, Share } from "lucide-react";

// Sprint #34 BB2: PWA install affordance. Renders nothing when the app is
// already installed, the user has dismissed (within the 30-day TTL window),
// or the platform has no install path (iOS Chrome/Firefox/Edge, etc).
// Android/Chrome shows a single Install button driven by the pre-React
// stashed `beforeinstallprompt` event; iOS Safari shows a Share → Add to
// Home Screen → Add visual sequence since there's no install API on iOS.
// Sprint #64 FF1: install banner shown inside the Footle won-result block
// on solve. Discoverability companion to InstallCard — fresh users who
// never visit Settings still see an install nudge at a moment they've
// just succeeded. Hidden when already installed (incl. "installed ever"
// to catch the EE3 iOS Safari reopen case), when display-mode is
// standalone, and for 30 days after dismiss.
export function InstallCard() {
  const { canPromptNative, platform, showCard, promptInstall, dismiss } = useInstallPrompt();
  if (!showCard) return null;
  return (
    <div className="settings-section">
      <div className="ds-eyebrow settings-section-title">Install</div>
      <div className="settings-card install-card">
        <div className="install-card-header">
          <div className="install-card-icon" aria-hidden="true">⚽</div>
          <div className="install-card-body">
            <div className="install-card-title">Install Ball IQ</div>
            <div className="install-card-desc">Full-screen, offline-ready, one tap from your home screen.</div>
          </div>
          <button
            type="button"
            className="install-card-dismiss"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >×</button>
        </div>
        <div className="install-card-action">
          {canPromptNative ? (
            <button
              type="button"
              className="install-card-btn"
              onClick={promptInstall}
            >Install</button>
          ) : platform.isIOSSafari ? (
            <div className="install-card-ios" aria-label="iOS install instructions">
              <span className="install-card-step">
                <span className="install-card-step-icon" aria-hidden="true">⤴</span>
                <span className="install-card-step-label">Share</span>
              </span>
              <span className="install-card-pair">
                <span className="install-card-arrow" aria-hidden="true">→</span>
                <span className="install-card-step">
                  <span className="install-card-step-label">Add to Home Screen</span>
                </span>
              </span>
              <span className="install-card-pair">
                <span className="install-card-arrow" aria-hidden="true">→</span>
                <span className="install-card-step">
                  <span className="install-card-step-label">Add</span>
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default InstallCard;
