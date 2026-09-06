// Privacy policy screen. Extracted from App.jsx on 2026-09-06 (review E16).
import React from "react";
import { APP_NAME } from "../lib/scoring.js";
import { privacyH2, privacyP, privacyLi } from "./privacyStyles.js";

// ─── PRIVACY POLICY SCREEN ────────────────────────────────────────────────────
// Full-screen in-app overlay. Content is hardcoded (no network fetch, no
// CORS/asset-path pitfalls, no flash of a blank iframe). Rendered above the
// app when showPrivacy is true.
//
// IMPORTANT — KEEP IN SYNC WITH public/privacy.html. The standalone HTML is
// linked from index.html footer + sitemap.xml so external visitors must see
// the same policy as in-app users. Sprint #83 ZZ7 caught a drift; Sprint #84
// AAA1 re-synced them. Edit both files in the same commit and bump
// "Last updated" in both when the policy materially changes.
export const PrivacyScreen = React.memo(function PrivacyScreen({ onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, right: 0, bottom: 0, left: 0,
      inset: 0,
      background: "var(--bg)",
      color: "var(--text)",
      zIndex: 1000,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>
      <div style={{
        position: "sticky", top: 0,
        background: "rgba(11,12,16,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border2)",
        // Phase 6a Item 1: safe-area-inset-top so the back button isn't
        // hidden behind the iOS status bar / notch in PWA standalone mode.
        // The outer position:fixed inset:0 ignores safe area by design;
        // the sticky header has to push itself down explicitly.
        padding: "calc(14px + env(safe-area-inset-top, 0px)) 20px 14px",
        display: "flex", alignItems: "center", gap: 12,
        zIndex: 1,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close privacy policy"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--s2)", border: "1px solid var(--border2)",
            color: "var(--text)", fontSize: 18, lineHeight: 1,
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            WebkitTapHighlightColor: "transparent",
            outline: "none",
          }}
        >←</button>
        <div style={{fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px"}}>Privacy Policy</div>
      </div>
      <div style={{maxWidth: 680, margin: "0 auto", padding: "28px 20px 80px", lineHeight: 1.7}}>
        <div style={{fontSize: 22, fontWeight: 900, color: "var(--accent)", marginBottom: 8}}>⚽ {APP_NAME}</div>
        {/* Sprint #77 SS5: hard-coded revision date. Previously rendered
            `new Date().toLocaleDateString()` which falsely claimed the
            policy was updated every day the user viewed it. Bump this
            string whenever the policy content materially changes. */}
        <div style={{fontSize: 13, color: "var(--t2)", marginBottom: 28}}>Last updated: 23 August 2026</div>

        <div style={{
          background: "var(--s2)", borderRadius: 16,
          padding: "18px 20px", margin: "12px 0 24px",
          border: "1px solid var(--border2)",
        }}>
          <p style={{fontSize: 15, color: "var(--t2)", margin: 0}}>
            <span style={{color: "var(--accent)", fontWeight: 600}}>The short version:</span>{" "}
            Play as a guest and nothing is collected — your progress lives on your device only. Sign in and we store the minimum needed to sync your account across devices: email, username, scores, and game history. The app shows no ads, and counts how often features are used with no identifier of any kind attached. Our website (balliq.app) uses privacy-friendly cookieless analytics, records a few first-party product events, and uses Microsoft Clarity session analytics — which, in Europe, we load only if you say yes. We are not currently showing ads anywhere, and the app itself stays ad-free and cookie-free. We never sell your data.
          </p>
        </div>

        <h2 style={privacyH2}>1. Two ways to play</h2>
        <p style={privacyP}><strong>Guest mode</strong> — open {APP_NAME} without signing in. Your scores, streaks, settings and game history are stored only in your device's local storage. Nothing is sent to our servers. If you clear your browser data or uninstall the app, that progress is gone.</p>
        <p style={privacyP}><strong>Signed-in mode</strong> — sign in with email to back up your progress and play online multiplayer. We store the minimum needed to deliver those features (detail in §2 below). You can delete your account at any time from Settings → Account → Delete Account, which removes everything we hold about you.</p>

        <h2 style={privacyH2}>2. What we store when you sign in</h2>
        <p style={privacyP}>When you have an account, the following lives on our servers (hosted by Supabase, see §5):</p>
        <ul style={{paddingLeft: 20, marginBottom: 12}}>
          <li style={privacyLi}><strong>Email address</strong> — used only for sign-in (password authentication) and account-confirmation email at signup. Never used for marketing.</li>
          <li style={privacyLi}><strong>Username + avatar</strong> — visible to other signed-in players in friend search and friend profiles.</li>
          <li style={privacyLi}><strong>Game results</strong> — Daily 7 scores, Footle history, total games played, total XP, best streaks, and the questions you got wrong (for the review screen).</li>
          <li style={privacyLi}><strong>Friendships</strong> — friend requests sent + accepted, so your friends list works across devices.</li>
          <li style={privacyLi}><strong>Onboarded flag</strong> — a single timestamp so we don't replay onboarding on every device.</li>
        </ul>
        <p style={privacyP}>That's the full list. We do not collect your real name, location, device fingerprint, or any contact list. We never sell or share this data with third parties for marketing.</p>

        <h2 style={privacyH2}>3. Error monitoring</h2>
        <p style={privacyP}>We use Sentry to catch crashes and bugs. When something goes wrong in the app, Sentry receives a stack trace, the browser version, and a short trail of recent actions ("breadcrumbs") — no question text, no personal data. We strip your email and auth tokens from every event before it leaves your device. We use this only to fix bugs, never for tracking.</p>

        <h2 style={privacyH2}>4. Analytics &amp; ads</h2>
        <p style={privacyP}>The {APP_NAME} <strong>app</strong> uses no third-party analytics tools, tracking pixels, or advertising SDKs. It shows no ads and works with no ad networks. This is enforced in code: the ad and analytics scripts are blocked from ever loading inside the app.</p>
        <p style={privacyP}>The app does count, anonymously, <strong>how often its features are used</strong> — for example “a daily puzzle was finished” — so we can tell which parts are worth improving. These counts carry <strong>no identifier of any kind</strong>: no device id, no advertising id, and not your account either. Nothing links one count to another, so they cannot be assembled into a picture of you, and we have no way to look up what any individual person did. This is enforced on our server rather than only in the app, so it holds even for an older version still installed on a device.</p>
        <p style={privacyP}>Our <strong>website (balliq.app)</strong> uses Vercel Web Analytics — a privacy-friendly, cookieless analytics service — to understand aggregate traffic, such as how many people visit a page. It sets no cookies, does not track you across other websites, and does not identify you personally.</p>
        <p style={privacyP}>Our <strong>website</strong> also records a small number of <strong>first-party product events</strong> of our own — for example “a quiz was started” or “the app link was tapped” — so we can tell which parts of the site are working. Each event stores only its name, the surface it happened on, and a <strong>random identifier we generate on your device</strong> (stored in your browser as <code>biq_vid</code>) so a single visit hangs together. That identifier is a random value, not derived from anything about you or your device: it is not a fingerprint, it is never linked to your account or email, it is not shared with anyone, and clearing this site’s data removes it. No question text and no personal data is recorded. This runs on the website only.</p>
        <p style={privacyP}>Our <strong>website (balliq.app)</strong> also uses <strong>Microsoft Clarity</strong> to understand how visitors use the site. Clarity records anonymised interaction signals — clicks, scrolls, mouse movement — and session replays with typed text masked, which we use to find and fix confusing parts of the site. It may set cookies or similar identifiers. This runs on the website only, never inside the app — and for visitors in Europe it does not run there either unless they allow it, which we ask once on the first visit. See Microsoft's privacy statement at <a href="https://privacy.microsoft.com/privacystatement" style={{color:"var(--accent)",textDecoration:"none"}} target="_blank" rel="noopener noreferrer">privacy.microsoft.com</a>.</p>
        <p style={privacyP}>We <strong>do not currently display ads</strong> anywhere — not on the website and not in the app. If that changes we will update this page first. The paragraph below describes how <strong>Google AdSense</strong> would work on the <strong>website only</strong> if we enable it. To serve and measure ads, Google and its partners may set and read cookies or similar identifiers in your browser, and — where you agree — use them to show more relevant ads. This applies to the website only; the app remains ad-free and sets no advertising cookies. We are not currently serving ads, so no advertising cookies are set. Visitors in Europe, the UK and Switzerland are asked once, on their first visit to the website, before Microsoft Clarity loads — that prompt covers Clarity only, since no ads run. If we ever enable ads we will extend that prompt to cover them and ask again first. You can review how Google uses data from sites that use its services at <span style={{color:"var(--accent)"}}>policies.google.com/technologies/partner-sites</span>, and manage ad personalisation at <span style={{color:"var(--accent)"}}>adssettings.google.com</span>.</p>

        <h2 style={privacyH2}>5. Third-party services we use</h2>
        <ul style={{paddingLeft: 20, marginBottom: 12}}>
          <li style={privacyLi}><strong>Supabase (database, auth, storage):</strong> When you sign in, your email, username, profile data, game results and avatar image are stored on Supabase servers (EU region). Supabase is our data processor.</li>
          <li style={privacyLi}><strong>Sentry (error monitoring):</strong> Crash reports are sent to Sentry with email and tokens scrubbed before transmission.</li>
          <li style={privacyLi}><strong>Vercel (hosting + website analytics):</strong> Serves {APP_NAME} over HTTPS and may log standard request data (IP, timestamp, URL) for operational purposes. On our website (balliq.app) we also use Vercel Web Analytics for aggregate, cookieless usage metrics — no cookies, no cross-site tracking, no personal identification.</li>
          <li style={privacyLi}><strong>Google AdSense (not currently enabled):</strong> We do not serve ads today. If the website later displays ads through Google AdSense, Google and its ad partners may set cookies or similar identifiers to serve, measure, and (with consent) personalise ads. This runs on the website only — never in the app. See policies.google.com/technologies/ads.</li>
          <li style={privacyLi}><strong>Google Fonts:</strong> We load the Inter and JetBrains Mono fonts from fonts.googleapis.com. Google may log your IP address when fonts are fetched.</li>
          <li style={privacyLi}><strong>Cropper.js (CDN):</strong> When you upload a profile picture, we load an image-cropping library from cdnjs.cloudflare.com. The CDN provider may log your IP address.</li>
        </ul>

        <h2 style={privacyH2}>6. Children's Privacy</h2>
        <p style={privacyP}>{APP_NAME} is not directed at children under 13. Guest mode requires no account or personal data. To sign in you must provide an email address — please don't sign in if you are under 13. The app's content is suitable for all ages.</p>

        <h2 style={privacyH2}>7. Changes to This Policy</h2>
        <p style={privacyP}>If we make changes to this privacy policy, we will update the date at the top of this page. Continued use of the app after any changes constitutes acceptance of the new policy.</p>

        <h2 style={privacyH2}>8. Contact</h2>
        <p style={privacyP}>If you have any questions about this privacy policy, please contact us at: <a href="mailto:privacy@balliq.app" style={{color:"var(--accent)",textDecoration:"none"}}>privacy@balliq.app</a></p>

        <p style={{marginTop: 48, fontSize: 13, color: "var(--t2)"}}>© 2026 {APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  );
});

