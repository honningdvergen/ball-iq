// Settings — extracted from App.jsx on 2026-09-06 (review E16, brick 6).
// Every knob arrives as a prop; the app-level helpers come along the seam the
// lazy screens already use.
import Login from "../Login.jsx";
import { InstallCard } from "../components/InstallCard.jsx";
import { APP_VERSION, REVIEWER_EMAIL, ABOUT_ACTION_STYLE } from "../lib/appMeta.js";
import { useInstallPrompt } from "../installPrompt.js";
import { openStoreRating, ratingStore } from "../lib/review.js";
import { APP_NAME } from "../lib/scoring.js";
import { supabase } from "../supabase.js";
import { clearAllUserLocalStorage, useAuth } from "../useAuth.jsx";
import { useModalA11y } from "../useModalA11y.js";
import { App as CapApp } from "@capacitor/app";
import { Haptics } from "@capacitor/haptics";
import { ArrowUpRight, Home, Mail, Settings, Share, Star, Timer } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { loopEvent } from "../App.jsx";
import { I18N_LIVE, LANGS, LANG_NAMES, setLang, useLang, useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { rich } from "../i18n/rich.jsx";

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

// The language row's two-option switch (i18n step 1). Same family as
// SettingsToggle: the selected side wears the toggle's "on" colour
// (--accent), the track is the "off" colour (--s3). Each option is named in
// its own language (LANG_NAMES) so the way back is readable from either side.
// Applies at once: setLang() re-renders every useT()/useLang() subscriber.
export function SettingsLangSwitch({ label }) {
  const lang = useLang();
  return (
    <div role="group" aria-label={label} style={{display:"inline-flex", gap:2, padding:2, borderRadius:999, background:"var(--s3)", flexShrink:0}}>
      {LANGS.map((l) => {
        const on = lang === l;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={on}
            onClick={() => { if (!on) setLang(l); }}
            style={{minHeight:32, padding:"6px 12px", border:"none", borderRadius:999, fontFamily:"inherit", fontSize:13, fontWeight:800, cursor:"pointer", background: on ? "var(--accent)" : "transparent", color: on ? "var(--grn-ink)" : "var(--t2)", WebkitTextFillColor: on ? "var(--grn-ink)" : "var(--t2)", transition:"background 0.2s", touchAction:"manipulation", WebkitTapHighlightColor:"transparent"}}
          >
            {LANG_NAMES[l]}
          </button>
        );
      })}
    </div>
  );
}

// Footle hard mode, the same key the board reads (games/FootballWordle.jsx).
// Its own component so its state does not shift SettingsScreenImpl's hooks.
function FootleHardRow({ t }) {
  const [on, setOn] = useState(() => { try { return localStorage.getItem("biq_footle_hard") === "1"; } catch { return false; } });
  const set = (v) => { setOn(v); try { localStorage.setItem("biq_footle_hard", v ? "1" : "0"); } catch { /* private mode */ } };
  return (
    <div className="settings-row">
      <div className="sr-left">
        <div className="sr-label">{t("st.hard")}</div>
        <div className="sr-desc">{t("st.hardSub")}</div>
      </div>
      <div className="sr-right">
        <SettingsToggle label={t("st.hard")} val={on} onChange={set} />
      </div>
    </div>
  );
}

function SettingsScreenImpl({ settings, onUpdate, onClearStats, onClearSeen, onBack, onShowPrivacy, onShowHelp, onShowKnownIssues, onAccountDeleted, onOpenReview, onShowBlocked, notifEnabled, onToggleNotif, notifSupported, notifBlocked, webPushOn, onToggleWebPush, webPushAvailable, webPushBlocked }) {
  const { user, profile, isGuest, signOut, exitGuestMode, openAuthPrompt } = useAuth();
  const t = useT();
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
    const text = t("share.app");
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(text); window.dispatchEvent(new CustomEvent('biq:show-toast', { detail: t('st.copied') })); } catch {}
  };
  // Rating is inherently store-specific — openStoreRating sends each platform
  // to its OWN store's review flow (Android used to be sent to the App Store,
  // where it could not leave a review at all).
  const rateApp = () => {
    const store = openStoreRating();
    loopEvent("rate-link-tap", { surface: "settings", store });
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
        <button className="back-btn" onClick={onBack} aria-label={t("game.goBack")}>←</button>
        <div className="page-title">{t("nav.settings")}</div>
      </div>

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">{t("st.account")}</div>
        <div className="settings-card">
          {user && profile ? (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">{t("st.signedInAs")}</div>
                  <div className="sr-desc">{profile.username}</div>
                  {/* 1.1: show the account email so users recognise which
                      account they're on. Apple's Hide-My-Email gives a cryptic
                      @privaterelay.appleid.com address — show a friendly label
                      instead of the raw relay. */}
                  {user.email && (
                    <div className="sr-desc" style={{marginTop:2,opacity:0.7}}>
                      {/@privaterelay\.appleid\.com$/i.test(user.email) ? t("st.hideEmail") : user.email}
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
                  <div className="sr-label">{t("st.signOut")}</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          ) : user ? (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">{t("st.signedIn")}</div>
                  <div className="sr-desc">{rich(t("st.loading"), { e: user.email })}</div>
                </div>
              </div>
              <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmSignOut(true)}>
                <div className="sr-left">
                  <div className="sr-label">{t("st.signOut")}</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          ) : (
            <>
              <div className="settings-row" style={{cursor:"default"}}>
                <div className="sr-left">
                  <div className="sr-label">{t("st.guest")}</div>
                  <div className="sr-desc">{t("st.guestSub")}</div>
                </div>
              </div>
              <button className="settings-row" onClick={() => openAuthPrompt?.('save')} style={{cursor:"pointer",width:"100%",background:"none",border:"none",textAlign:"left",padding:"14px 16px"}}>
                <div className="sr-left">
                  <div className="sr-label" style={{color:"var(--accent)"}}>{t("st.signIn")}</div>
                </div>
                <div className="sr-right"><div className="sr-arrow">›</div></div>
              </button>
            </>
          )}
        </div>
      </div>

      <InstallCard />
      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">{t("st.gameplay")}</div>
        <div className="settings-card">
          {/* "Show Hints" (first-letter hints on typed questions) left 2026-09-06: the bank has had no typed questions since df54c40 (2026-05-07). settings.hints is kept for storage compatibility. */}
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">{t("st.timer")}</div>
              <div className="sr-desc">{t("st.timerSub")}</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label={t("st.timer")} val={settings.timer} onChange={v => onUpdate({timer:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">{t("st.sound")}</div>
              <div className="sr-desc">{t("st.soundSub")}</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label={t("st.sound")} val={settings.sound} onChange={v => onUpdate({sound:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">{t("st.haptics")}</div>
              <div className="sr-desc">{t("st.hapticsSub")}</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label={t("st.haptics")} val={settings.haptics !== false} onChange={v => onUpdate({haptics:v})} />
            </div>
          </div>
          <div className="settings-row">
            <div className="sr-left">
              <div className="sr-label">{t("st.cb")}</div>
              <div className="sr-desc">{t("st.cbSub")}</div>
            </div>
            <div className="sr-right">
              <SettingsToggle label={t("st.cb")} val={settings.colorBlind === true} onChange={v => onUpdate({colorBlind:v})} />
            </div>
          </div>
          {/* Footle's hard mode lives on the board, as a small pill shown only
              before the first guess, and Alex could not find it (27 Oct). The
              same switch here: the board reads biq_footle_hard when it opens. */}
          <FootleHardRow t={t} />
          {I18N_LIVE && (
          <div className="settings-row" style={{cursor:"default"}}>
            <div className="sr-left">
              <div className="sr-label">{t("settings.language")}</div>
            </div>
            <div className="sr-right">
              <SettingsLangSwitch label={t("settings.language")} />
            </div>
          </div>
          )}
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
          <div className="ds-eyebrow settings-section-title">{t("nav.notifications")}</div>
          <div className="settings-card">
            <div className="settings-row">
              <div className="sr-left">
                <div className="sr-label">{t("st.remind")}</div>
                <div className="sr-desc">
                  {t(notifSupported
                    ? (notifBlocked ? "st.remindBlockedIos" : "st.remindSub")
                    : (webPushBlocked ? "st.remindBlockedWeb" : "st.remindSub"))}
                </div>
              </div>
              <div className="sr-right">
                {notifSupported
                  ? <SettingsToggle label={t("st.remind")} val={notifEnabled} onChange={onToggleNotif} disabled={notifBlocked} />
                  : <SettingsToggle label={t("st.remind")} val={webPushOn} onChange={onToggleWebPush} disabled={webPushBlocked} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {(onShowHelp || onShowPrivacy || onShowKnownIssues) && (
        <div className="settings-section">
          <div className="ds-eyebrow settings-section-title">{t("st.help")}</div>
          <div className="settings-card">
            {onShowHelp && (
              <button
                type="button"
                className="settings-row"
                style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
                onClick={onShowHelp}
              >
                <div className="sr-left">
                  <div className="sr-label">{t("st.faq")}</div>
                  <div className="sr-desc">{t("st.faqSub")}</div>
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
                  <div className="sr-label">{t("st.issues")}</div>
                  <div className="sr-desc">{t("st.issuesSub")}</div>
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
                  <div className="sr-label">{t("st.privacy")}</div>
                  <div className="sr-desc">{t("st.privacySub")}</div>
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
          <div className="ds-eyebrow settings-section-title">{t("st.reviewer")}</div>
          <div className="settings-card">
            <button
              type="button"
              className="settings-row"
              style={{width:"100%",background:"none",border:"none",textAlign:"left"}}
              onClick={onOpenReview}
            >
              <div className="sr-left">
                <div className="sr-label">{t("st.review")}</div>
                <div className="sr-desc">{t("st.reviewSub")}</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">{t("st.about")}</div>
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
              <div style={{fontSize:13,color:"var(--t2)",marginTop:4}}>{t("st.tagline")}</div>
              {/* 1.1: real installed build version (no more stale "1.0.0 BETA"). */}
              <div style={{fontSize:12,color:"var(--t3)",marginTop:3}}>v{appVer}</div>
            </div>
          </div>
          {/* 1.1: three high-value actions — Rate (reviews drive ranking),
              Share (referral growth), Feedback. Equal ghost buttons. */}
          <div style={{display:"flex",gap:8,marginTop:18}}>
            <button onClick={rateApp} style={ABOUT_ACTION_STYLE} aria-label={t(ratingStore() === "play" ? "st.rateGp" : "st.rateAs")}>
              <Star size={17} strokeWidth={2.25} aria-hidden="true" />
              <span>{t("st.rate")}</span>
            </button>
            <button onClick={shareApp} style={ABOUT_ACTION_STYLE} aria-label={t("st.shareAria")}>
              <ArrowUpRight size={17} strokeWidth={2.25} aria-hidden="true" />
              <span>{t("rs.share")}</span>
            </button>
            <a href="mailto:hello@balliq.app" style={ABOUT_ACTION_STYLE} aria-label={t("st.feedbackAria")}>
              <Mail size={17} strokeWidth={2.25} aria-hidden="true" />
              <span>{t("st.feedback")}</span>
            </a>
          </div>
          <div style={{fontSize:12,color:"var(--t3)",marginTop:14}}>{t("st.built")}</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="ds-eyebrow settings-section-title">{t("st.data")}</div>
        <div className="settings-card">
          <button className="settings-row danger" style={{width:"100%",background:"none",border:"none",textAlign:"left"}} onClick={() => setConfirmClearStats(true)}>
            <div className="sr-left">
              <div className="sr-label">{t("st.clear")}</div>
              <div className="sr-desc">{t("st.clearSub")}</div>
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
                <div className="sr-label">{t("st.clearSeen")}</div>
                <div className="sr-desc">{t("st.clearSeenSub")}</div>
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
                <div className="sr-label">{t("st.blocked")}</div>
                <div className="sr-desc">{t("st.blockedSub")}</div>
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
                <div className="sr-label" style={{color:"var(--red, #FF5A5A)"}}>{t("st.delete")}</div>
                <div className="sr-desc">{t("st.deleteSub")}</div>
              </div>
              <div className="sr-right"><div className="sr-arrow">›</div></div>
            </button>
          ) : (
            <div className="settings-row" style={{cursor:"default",opacity:0.5}}>
              <div className="sr-left">
                <div className="sr-label">{t("st.delete")}</div>
                <div className="sr-desc">{t("st.deleteGuest")}</div>
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
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>{t("st.resetQ")}</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:10}}>{t("st.resetWill")}</div>
            <ul style={{paddingLeft:20,marginBottom:14,fontSize:14,color:"var(--t2)",lineHeight:1.6}}>
              {[1, 2, 3, 4, 5, 6].map((i) => <li key={i}>{t(`st.r${i}`)}</li>)}
            </ul>
            <div style={{fontSize:13,color:"var(--t3)",marginBottom:18}}>{t("st.resetKept")}</div>
            <button
              onClick={() => { setConfirmClearStats(false); onClearStats?.(); }}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
            >
              {t("st.reset")}
            </button>
            <button
              onClick={() => setConfirmClearStats(false)}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
            >
              {t("st.cancel")}
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
            aria-label={t("st.signOutAria")}
          >
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>{t("st.signOutQ")}</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>{rich(t("st.signOutBody"), { app: APP_NAME })}</div>
            <button
              onClick={async () => { setConfirmSignOut(false); await signOut(); }}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:8,WebkitTextFillColor:"#fff"}}
            >
              {t("st.signOut")}
            </button>
            <button
              onClick={() => setConfirmSignOut(false)}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:"pointer"}}
            >
              {t("st.cancel")}
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
            <div style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:8}}>{t("st.deleteTitle")}</div>
            <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.5,marginBottom:18}}>
              {t("st.deleteBody")}
            </div>
            <button
              onClick={performDelete}
              disabled={deleting}
              style={{width:"100%",padding:14,background:"var(--red)",color:"#fff",border:"none",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:deleting?"default":"pointer",marginBottom:8,opacity:deleting?0.7:1,WebkitTextFillColor:"#fff"}}
            >
              {t(deleting ? "st.deleting" : "st.deleteForever")}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              style={{width:"100%",padding:14,background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:12,fontFamily:"inherit",fontSize:15,fontWeight:700,cursor:deleting?"default":"pointer"}}
            >
              {t("st.cancel")}
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
