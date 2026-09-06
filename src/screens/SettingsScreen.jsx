// Settings — extracted from App.jsx on 2026-09-06 (review E16, brick 6).
// Every knob arrives as a prop; the app-level helpers come along the seam the
// lazy screens already use.
import Login from "../Login.jsx";
import { useInstallPrompt } from "../installPrompt.js";
import { appStoreUrl, PLAY_STORE_URL, APP_STORE_ID } from "../lib/links.js";
import { APP_NAME } from "../lib/scoring.js";
import { supabase } from "../supabase.js";
import { clearAllUserLocalStorage, useAuth } from "../useAuth.jsx";
import { useModalA11y } from "../useModalA11y.js";
import { App as CapApp } from "@capacitor/app";
import { Haptics } from "@capacitor/haptics";
import { ArrowUpRight, Home, Mail, Settings, Share, Star, Timer } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { loopEvent } from "../App.jsx";

// APP_STORE_ID / APP_STORE_URL / PLAY_STORE_URL moved to ./lib/links.js
// (single source of truth for every store CTA in src/ — imported above).
// Shared style for the three About-card actions (Rate / Share / Feedback).
export const ABOUT_ACTION_STYLE = {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  padding: "12px 6px", background: "transparent", color: "var(--accent)",
  border: "1.5px solid var(--accent-b)", borderRadius: 12, fontFamily: "inherit",
  fontSize: 12.5, fontWeight: 800, cursor: "pointer", WebkitAppearance: "none",
  appearance: "none", textDecoration: "none",
};

// Centralised durations so we can tune motion/UX feel from one place.
// ─── APP META ─────────────────────────────────────────────────────────────────
// Single source of truth for the version string — surfaced in Settings → About.
// Bump on every shipping release.
// Web fallback only — on native the About card shows the REAL installed build
// version via CapApp.getInfo(), so this no longer drifts on each release (the
// bug that left it stuck at "1.0.0-beta" through 1.0.1/1.0.2). Keep it roughly
// current for the web build.
// Injected from package.json at build time (vite.config.js); never hand-edited here.
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.7.3";
// Gated reviewer email — only this account sees the Settings → Review entry
// and can reach the review screen. Server-side RLS on question_review is the
// real security; this is just UI hiding.
export const REVIEWER_EMAIL = "alexbo99@hotmail.no";

// (The old async storage shim on window is gone — reads go straight to
// localStorage; writes go through safeSetItem so QuotaExceededError is
// surfaced via the biq:storage-quota-exceeded toast instead of vanishing.)

// The visible label lives in a sibling .sr-label div, so to a screen reader
// this button was an unnamed control with no state — five of them in a row,
// all announced as just "button" (WCAG 4.1.2). role=switch + aria-checked
// makes the on/off state readable, and `label` names it.
export function SettingsToggle({ val, onChange, label, disabled }) {
  return (
    <button
      className={`toggle ${val ? "on" : "off"}`}
      role="switch"
      aria-checked={val}
      aria-label={label}
      disabled={disabled}
      style={disabled ? { opacity: 0.4, cursor: "default" } : undefined}
      onClick={() => { if (!disabled) onChange(!val); }}
    >
      <div className="toggle-knob" />
    </button>
  );
}

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

function SettingsScreenImpl({ settings, onUpdate, onClearStats, onClearSeen, onBack, onShowPrivacy, onShowHelp, onShowKnownIssues, onAccountDeleted, onOpenReview, onShowBlocked, notifEnabled, onToggleNotif, notifSupported, notifBlocked, webPushOn, onToggleWebPush, webPushAvailable, webPushBlocked }) {
  const { user, profile, isGuest, signOut, exitGuestMode, openAuthPrompt } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmClearStats, setConfirmClearStats] = useState(false);
  // 1.1: surface the REAL installed build version (native) instead of the
  // hardcoded constant that drifted. Falls back to APP_VERSION on web.
  const [appVer, setAppVer] = useState(APP_VERSION);
  useEffect(() => {
    let alive = true;
    try { CapApp.getInfo?.().then(i => { if (alive && i?.version) setAppVer(i.version); }).catch(() => {}); } catch {}
    return () => { alive = false; };
  }, []);
  // Share the PLATFORM-AWARE link, never a store-specific one. The recipient
  // is a different person on a different device than the sender — an Android
  // user was previously sharing an App Store URL with every friend, and half
  // of any sender's contacts are on the other platform regardless.
  // balliq.app/get (api/get.js) resolves per RECIPIENT: iOS -> App Store,
  // Android -> Play, desktop -> the web app.
  const shareApp = async () => {
    loopEvent("share-get");
    const text = `⚽ Ball IQ — the football quiz for real fans. https://balliq.app/get`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(text); window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: '📋 Link copied' })); } catch {}
  };
  // Rating is inherently store-specific — send each platform to its OWN store's
  // review flow. Android used to be sent to the App Store, where it could not
  // leave a review at all.
  const rateApp = () => {
    const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
    if (/Android/i.test(ua) && !/Windows Phone/i.test(ua)) {
      try { window.open(PLAY_STORE_URL, '_blank'); } catch {}
      return;
    }
    if (!APP_STORE_ID) { window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: 'Store rating opens once we’re live 🙌' })); return; }
    try { window.open(`${appStoreUrl()}?action=write-review`, '_blank'); } catch {}
  };
  // Sprint #71 MM1: replace native confirm() for Sign Out with an in-app
  // modal matching the existing Reset-stats / Delete-account design. Native
  // Apple-system dialog was off-brand.
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const clearStatsModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const signOutModalRef = useRef(null);
  useModalA11y({ isOpen: confirmClearStats, onClose: () => setConfirmClearStats(false), ref: clearStatsModalRef });
  useModalA11y({ isOpen: confirmDelete, onClose: () => !deleting && setConfirmDelete(false), ref: deleteModalRef });
  useModalA11y({ isOpen: confirmSignOut, onClose: () => setConfirmSignOut(false), ref: signOutModalRef });
  // Audit Phase 5 (B3): performDelete catch could fire setState on the
  // unmounted component if the RPC throws after signOut → AppGate route.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Permanent account deletion — required by App Store guideline 5.1.1(v)
  // for any app that supports account creation. Calls the server-side RPC
  // (which scopes deletes to auth.uid()), clears every biq_* key from
  // local storage, lets AppInner reset its in-memory state, and finally
  // signs the user out so AppGate routes back to the login screen.
  const performDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      // Set sentinel BEFORE the server-side delete RPC. delete_user_account
      // invalidates the auth.users row server-side; any background refresh
      // that fires between this RPC and the explicit signOut() below would
      // get 401 -> SIGNED_OUT fires -> without the sentinel, would surface
      // a "session expired" banner during account deletion (misleading).
      try { localStorage.setItem('biq_signout_intentional_at', String(Date.now())) } catch {}

      const { error } = await supabase.rpc("delete_user_account");
      if (error) {
        setDeleting(false);
        setConfirmDelete(false);
        if (typeof onAccountDeleted === "function") onAccountDeleted({ error });
        return;
      }
      clearAllUserLocalStorage();
      // biq_onboarded is device-scoped (preserved on signOut so same-device
      // re-sign-in doesn't replay onboarding), but account deletion is the
      // user nuking everything — clear it explicitly so a re-signup on this
      // device gets the onboarding flow again.
      try { localStorage.removeItem('biq_onboarded') } catch {}
      if (typeof onAccountDeleted === "function") onAccountDeleted({ error: null });
      // Audit Phase 5 (B2): surface signOut failures in the console.
      // Server-side delete already succeeded, so the user's data is
      // gone; signOut failure here means the local session lingers
      // until next auto-refresh. Visible debug trail beats silence.
      try { await signOut(); } catch (e) { console.warn('[performDelete signOut]', e?.message || e); }
    } catch (e) {
      if (mountedRef.current) {
        setDeleting(false);
        setConfirmDelete(false);
      }
      if (typeof onAccountDeleted === "function") onAccountDeleted({ error: e });
    }
  };

  return (
    <div className="screen settings-screen" style={{background:"var(--bg)"}}>
      <div className="page-hdr">
        <button className="back-btn" onClick={onBack} aria-label="Go back">←</button>
        <div className="page-title">Settings</div>
      </div>

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">Account</div>
        <div className="settings-card">
          {user && profile ? (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">Signed in as</div>
                  <div className="sr-desc">{profile.username}</div>
                  {/* 1.1: show the account email so users recognise which
                      account they're on. Apple's Hide-My-Email gives a cryptic
                      @privaterelay.appleid.com address — show a friendly label
                      instead of the raw relay. */}
                  {user.email && (
                    <div className="sr-desc" style={{marginTop:2,opacity:0.7}}>
                      {/@privaterelay\.appleid\.com$/i.test(user.email) ? "Apple · Hide My Email" : user.email}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="settings-row danger"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={() => setConfirmSignOut(true)}
              >
                <div className="sr-left">
                  <div className="sr-label">Sign out</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          ) : user ? (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">Signed in</div>
                  <div className="sr-desc">{user.email} — profile loading…</div>
                </div>
              </div>
              <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmSignOut(true)}>
                <div className="sr-left">
                  <div className="sr-label">Sign out</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          ) : (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">Playing as guest</div>
                  <div className="sr-desc">Sign up to play friends online and keep your progress across devices</div>
                </div>
              </div>
              <button className="settings-row" onClick={() => openAuthPrompt?.('save')} style={{cursor:"pointer",width:"100%",background:"none",border:"none",textAlign:"left",padding:"14px 16px"}}>
                <div className="sr-left">
                  <div className="sr-label" style={{color:"var(--accent)"}}>Sign in / Create account</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          )}
        </div>
      </div>

      <InstallCard />
      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">Gameplay</div>
        <div className="settings-card">
          {/* "Show Hints" (first-letter hints on typed questions) left 2026-09-06: the bank has had no typed questions since df54c40 (2026-05-07). settings.hints is kept for storage compatibility. */}
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Timer</div>
              <div className="sr-desc">Per-question clock in Classic and club and league quizzes</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label="Timer" val={settings.timer} onChange={v => onUpdate({timer:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Sound Effects</div>
              <div className="sr-desc">Audio feedback on correct and wrong answers</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label="Sound Effects" val={settings.sound} onChange={v => onUpdate({sound:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Haptics</div>
              <div className="sr-desc">Taps and vibrations on answers, streaks, and button presses</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label="Haptics" val={settings.haptics !== false} onChange={v => onUpdate({haptics:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">Colour-blind tiles</div>
              <div className="sr-desc">Orange and blue Footle tiles instead of green and yellow</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label="Colour-blind tiles" val={settings.colorBlind === true} onChange={v => onUpdate({colorBlind:v})} />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications. Two different engines behind one identical-looking row:
          NATIVE uses on-device local notifications (src/lib/notifications.js);
          WEB uses Web Push through the service worker (src/lib/webpush.js).
          Exactly one of them applies on any given device, so the user sees one
          toggle and never learns that distinction.

          The old comment here said a web reminder was "meaningless because web
          can't fire while closed". That was true of LOCAL notifications and is
          why the native engine no-ops on web — but Web Push is delivered by the
          browser's push service and fires with the tab shut, which is precisely
          the gap it exists to close.

          ⚠️ Both paths request permission from inside this tap. Safari rejects
          Notification.requestPermission() outside a user gesture, and Chrome
          penalises prompts that fire on load — so this must stay a toggle the
          user reaches for, never something triggered on mount. */}
      {(notifSupported || webPushAvailable) && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">Notifications</div>
          <div className="settings-card">
            <div className="settings-row">
              <div className="sr-left">
                <div className="sr-label">Daily reminders</div>
                <div className="sr-desc">
                  {notifSupported
                    ? (notifBlocked
                        ? "Blocked — open iOS Settings › Ball IQ › Notifications and allow them, then come back"
                        : "An evening nudge if you haven't played yet — keeps your streak alive")
                    : (webPushBlocked
                        ? "Blocked — allow notifications for balliq.app in your browser's site settings, then come back"
                        : "An evening nudge if you haven't played yet — keeps your streak alive")}
                </div>
              </div>
              <div className="sr-right">
                {notifSupported
                  ? <SettingsToggle label="Daily reminders" val={notifEnabled} onChange={onToggleNotif} disabled={notifBlocked} />
                  : <SettingsToggle label="Daily reminders" val={webPushOn} onChange={onToggleWebPush} disabled={webPushBlocked} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {(onShowHelp || onShowPrivacy || onShowKnownIssues) && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">Help</div>
          <div className="settings-card">
            {onShowHelp && (
              <button
                type="button"
                className="settings-row"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={onShowHelp}
              >
                <div className="sr-left">
                  <div className="sr-label">Help & FAQ</div>
                  <div className="sr-desc">Common questions and how to reach us</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            )}
            {onShowKnownIssues && (
              <button
                type="button"
                className="settings-row"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={onShowKnownIssues}
              >
                <div className="sr-left">
                  <div className="sr-label">Known issues</div>
                  <div className="sr-desc">Honest list of things to expect</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            )}
            {onShowPrivacy && (
              <button
                type="button"
                className="settings-row"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={onShowPrivacy}
              >
                <div className="sr-left">
                  <div className="sr-label">Privacy Policy</div>
                  <div className="sr-desc">How your data is handled</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden reviewer entry — only rendered for the gated email. The
          server-side RLS on question_review is the actual security; this
          UI gate just hides the link from non-reviewers. */}
      {onOpenReview && user?.email === REVIEWER_EMAIL && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">Reviewer</div>
          <div className="settings-card">
            <button
              type="button"
              className="settings-row"
              style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
              onClick={onOpenReview}
            >
              <div className="sr-left">
                <div className="sr-label">Review questions</div>
                <div className="sr-desc">Internal question-bank review</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">About</div>
        {/* Sprint #34 BB1 F-S3: about-card-card + about-card-brand wrappers
            let desktop CSS flip this to a horizontal "ball+name+version |
            feedback" row. At mobile (no desktop CSS rule), the wrappers are
            plain divs and the centered-vertical layout is preserved. */}
        <div className="settings-card about-card-card" style={{padding:"24px 18px 18px",textAlign:"center"}}>
          <div className="about-card-brand">
            {/* ⚠️ WAS A ⚽ EMOJI — on the card where the app introduces ITSELF.
                Ball IQ ships its own mark (icon-192.png; Login.jsx renders it
                at 104px, and the native prune allowlist already keeps it in
                both bundles), so the About block was showing a generic emoji
                football in the one place a real brand mark belongs. Rounded
                like an app icon, matching Login's treatment.
                `alt` deliberately empty: the product name is the very next
                element, so a screen reader announcing "Ball IQ" twice is worse
                than announcing it once. */}
            <img
              className="about-card-ball"
              src="/icon-192.png"
              alt=""
              width="56"
              height="56"
              style={{width:56,height:56,borderRadius:14,marginBottom:8,display:"block",marginLeft:"auto",marginRight:"auto"}}
            />
            <div className="about-card-meta-wrap">
              <div className="about-card-name" style={{fontSize:24,fontWeight:900,color:"var(--t1)",letterSpacing:"-0.4px"}}>Ball <em style={{color:"var(--accent)",fontStyle:"normal"}}>IQ</em></div>
              <div style={{fontSize:13,color:"var(--t2)",marginTop:4}}>The football quiz for real fans</div>
              {/* 1.1: real installed build version (no more stale "1.0.0 BETA"). */}
              <div style={{fontSize:12,color:"var(--t3)",marginTop:3}}>v{appVer}</div>
            </div>
          </div>
          {/* 1.1: three high-value actions — Rate (reviews drive ranking),
              Share (referral growth), Feedback. Equal ghost buttons. */}
          <div style={{display:"flex",gap:8,marginTop:18}}>
            <button onClick={rateApp} style={ABOUT_ACTION_STYLE} aria-label="Rate Ball IQ on the App Store">
              <Star size={17} strokeWidth={2.25} aria-hidden="true" />
              <span>Rate</span>
            </button>
            <button onClick={shareApp} style={ABOUT_ACTION_STYLE} aria-label="Share Ball IQ">
              <ArrowUpRight size={17} strokeWidth={2.25} aria-hidden="true" />
              <span>Share</span>
            </button>
            <a href="mailto:hello@balliq.app" style={ABOUT_ACTION_STYLE} aria-label="Send feedback">
              <Mail size={17} strokeWidth={2.25} aria-hidden="true" />
              <span>Feedback</span>
            </a>
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:14}}>Built solo in Norway 🇳🇴</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">Data</div>
        <div className="settings-card">
          <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmClearStats(true)}>
            <div className="sr-left">
              <div className="sr-label">Clear My Stats</div>
              <div className="sr-desc">Reset games played, best score and streak</div>
            </div>
            <div className="sr-right"><div className="sr-arrow">›</div></div>
          </button>
          {onClearSeen && (
            <button
              type="button"
              className="settings-row"
              style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
              onClick={onClearSeen}
            >
              <div className="sr-left">
                <div className="sr-label">Clear question history</div>
                <div className="sr-desc">Allow recently-seen questions to reappear now</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          )}
        </div>
      </div>

      {/* Sprint #84 AAA3 — Account moderation section. Signed-in only;
         hidden for guests since they have no friend graph. Sits above the
         danger zone so destructive Delete-account stays the visual floor. */}
      {user && onShowBlocked && (
        <div className="settings-section" style={{marginTop:24}}>
          <div className="settings-card">
            <button className="settings-row" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={onShowBlocked}>
              <div className="sr-left">
                <div className="sr-label">Blocked users</div>
                <div className="sr-desc">Manage who you've blocked from friend search</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          </div>
        </div>
      )}

      {/* Danger zone — bottom of the screen so destructive actions are
         clearly separated from everyday settings. The same row appears in
         three states (signed-in, mid-auth, guest) but always at this
         position so users know where to find it. */}
      <div className="settings-section" style={{marginTop:24}}>
        <div className="settings-card">
          {user ? (
            <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmDelete(true)}>
              <div className="sr-left">
                <div className="sr-label" style={{color:"var(--red, #FF5A5A)"}}>Delete account</div>
                <div className="sr-desc">Permanently remove your profile and data</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          ) : (
            <div className="settings-row" style={{cursor:"default",opacity:0.5}}>
              <div className="sr-left">
                <div className="sr-label">Delete account</div>
                <div className="sr-desc">Sign in to manage your account</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmClearStats && (
        <div
          style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => setConfirmClearStats(false)}
        >
          <div
            ref={clearStatsModalRef}
            tabIndex={-1}
            style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>Reset all stats?</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:10}}>This will reset:</div>
            <ul style={{paddingLeft:20,marginBottom:14,fontSize:14,color:"var(--t2)",lineHeight:1.6}}>
              <li>Games played, scores, streaks</li>
              <li>XP and level</li>
              <li>Login streak</li>
              <li>Daily challenge progress</li>
              <li>Ball IQ history</li>
              <li>Hot Streak best</li>
            </ul>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:18}}>Your username, avatar, and settings are kept. Stats are cleared on all your devices. This cannot be undone.</div>
            <button
              onClick={() => { setConfirmClearStats(false); onClearStats?.(); }}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
            >
              Reset stats
            </button>
            <button
              onClick={() => setConfirmClearStats(false)}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmSignOut && (
        <div
          style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => setConfirmSignOut(false)}
        >
          <div
            ref={signOutModalRef}
            tabIndex={-1}
            style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Sign out confirmation"
          >
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>Sign out?</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>Sign out of your {APP_NAME} account on this device? Your progress stays synced — sign back in any time to pick up where you left off.</div>
            <button
              onClick={async () => { setConfirmSignOut(false); await signOut(); }}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
            >
              Sign out
            </button>
            <button
              onClick={() => setConfirmSignOut(false)}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          style={{position:"fixed",top:0,right:0,bottom:0,left:0,inset:0,background:"rgba(0,0,0,0.78)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn 0.2s ease"}}
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            ref={deleteModalRef}
            tabIndex={-1}
            style={{width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)",borderTop:"1px solid var(--border)",borderRadius:"22px 22px 0 0",padding:"22px 22px 28px",animation:"slideUp 0.3s cubic-bezier(0.22,1,0.36,1)"}}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>Delete Account</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>
              This will permanently delete your profile, scores, friends and all game history. This cannot be undone.
            </div>
            <button
              onClick={performDelete}
              disabled={deleting}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:deleting?"default":"pointer",marginBottom:8,opacity:deleting?0.7:1,WebkitTextFillColor:"#fff"}}
            >
              {deleting ? "Deleting…" : "Delete Forever"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:deleting?"default":"pointer"}}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export const SettingsScreen = React.memo(SettingsScreenImpl);

// ── Notification bell + center (Phase 1: friend requests) ──────────────────
// A globally-placed bell (mobile header, Home header, desktop rail) with an
// unread badge = pending incoming friend-request count, opening a modal inbox.
// Data + accept/decline live in AppInner (reusing the friendships table); these
// are pure presentation. Play-invites + native push extend this later.
