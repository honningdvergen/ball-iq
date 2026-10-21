// Install / get-the-app card. Split out of the Settings screen (lazy now).
import { useInstallPrompt } from "../installPrompt.js";
import { Home, Share } from "lucide-react";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path

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
  const t = useT();
  const { canPromptNative, platform, showCard, promptInstall, dismiss } = useInstallPrompt();
  if (!showCard) return null;
  return (
    <div className="settings-section">
      <div className="ds-eyebrow settings-section-title">{t("ic.install")}</div>
      <div className="settings-card install-card">
        <div className="install-card-header">
          <div className="install-card-icon" aria-hidden="true">⚽</div>
          <div className="install-card-body">
            <div className="install-card-title">{t("ic.title")}</div>
            <div className="install-card-desc">{t("ic.desc")}</div>
          </div>
          <button
            type="button"
            className="install-card-dismiss"
            onClick={dismiss}
            aria-label={t("ic.dismiss")}
          >×</button>
        </div>
        <div className="install-card-action">
          {canPromptNative ? (
            <button
              type="button"
              className="install-card-btn"
              onClick={promptInstall}
            >{t("ic.install")}</button>
          ) : platform.isIOSSafari ? (
            // The three steps name iOS's own Share sheet, in the phone's language.
            <div className="install-card-ios" aria-label={t("ic.iosAria")}>
              <span className="install-card-step">
                <span className="install-card-step-icon" aria-hidden="true">⤴</span>
                <span className="install-card-step-label">{t("ic.share")}</span>
              </span>
              <span className="install-card-pair">
                <span className="install-card-arrow" aria-hidden="true">→</span>
                <span className="install-card-step">
                  <span className="install-card-step-label">{t("ic.addHome")}</span>
                </span>
              </span>
              <span className="install-card-pair">
                <span className="install-card-arrow" aria-hidden="true">→</span>
                <span className="install-card-step">
                  <span className="install-card-step-label">{t("ic.add")}</span>
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
