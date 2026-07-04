// BiqNav — desktop-web-refresh left rail. Replaces DesktopNav at >= 1024px
// with the marketing-site aesthetic (dark-only chrome, Inter + the marketing
// palette). Same call-site contract as DesktopNav (tab/setTab/setScreen/
// dailyDone/showToast/onHomeClick) — showToast is no longer consumed because
// the App Store CTA is a real link now, so it's intentionally left off the
// destructure.
//
// CSS-gated to desktop via the `.biq-nav` root class (base display:none;
// display:flex only inside @media(min-width:1024px)). The rail is reset to
// display:none in @media(display-mode:standalone) (installed PWA) and under
// html.native-app (Capacitor) so the iOS app / installed PWAs never render it.
//
// Colours are literal marketing hex (not app.css vars) on purpose — this is
// dark-only chrome and must read correctly regardless of the runtime theme.
// The visible display gating + hover/active states live in app.css (.biq-nav
// *), so this file is pure structure.

// Shared attrs for the 20px 2px-stroke line icons.
const ICON = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function BiqNav({ tab, setTab, setScreen, dailyDone, onHomeClick }) {
  const goTab = (id) => () => setTab(id);

  return (
    <aside className="biq-nav" aria-label="Primary">
      {/* Logo → Home (SPA, same handler the mobile wordmark uses). */}
      <button className="bn-brand" onClick={onHomeClick} aria-label="Home">
        <img src="/marketing/ball.png" alt="" width={32} height={32} />
        <span>Ball&nbsp;<em>IQ</em></span>
      </button>

      <nav className="bn-list">
        <button className="bn-item" data-active={tab === 'home'} onClick={goTab('home')}>
          <svg {...ICON}>
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
          </svg>
          <span>Home</span>
        </button>

        <button className="bn-item" data-active={tab === 'daily'} onClick={goTab('daily')}>
          <svg {...ICON}>
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
          <span>Daily</span>
          {!dailyDone && <span className="bn-dot" aria-label="new" />}
        </button>

        <button className="bn-item" data-active={tab === 'profile'} onClick={goTab('profile')}>
          <svg {...ICON}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-3.8 4.5-5.5 8-5.5s6.5 1.7 8 5.5" />
          </svg>
          <span>Profile</span>
        </button>

        {/* Redesign's "Friends" == the existing Online tab (OnlineHubTab). */}
        <button className="bn-item" data-active={tab === 'online'} onClick={goTab('online')}>
          <svg {...ICON}>
            <circle cx="9" cy="8" r="3.4" />
            <path d="M2.5 20c1-3 3.5-4.4 6.5-4.4s5.5 1.4 6.5 4.4" />
            <path d="M16 5.2a3.4 3.4 0 0 1 0 6.4M18 20c-.3-1.6-1-2.9-2-3.8" />
          </svg>
          <span>Friends</span>
        </button>
      </nav>

      <div className="bn-spacer" />
      <div className="bn-divider" />

      <nav className="bn-list">
        <button className="bn-item" onClick={() => setScreen('settings')}>
          <svg {...ICON}>
            <circle cx="12" cy="12" r="3.2" />
            <path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.2-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V2a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
          </svg>
          <span>Settings</span>
        </button>
      </nav>

      <div className="bn-cta">
        <div className="bn-cta-eyebrow">Get the app</div>
        {/* App Store — live listing, real link (no coming-soon toast). */}
        <a
          className="bn-store"
          href="https://apps.apple.com/app/id6775975961"
          target="_blank"
          rel="noopener"
        >
          <svg width="16" height="16" viewBox="0 0 384 512" fill="#E8EAF0" aria-hidden="true">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          <span>App Store</span>
        </a>
        {/* Google Play — not shipped on Android yet, so a disabled placeholder. */}
        <div className="bn-store is-disabled" title="Coming soon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#9BA0B8" aria-hidden="true">
            <path d="M4 3.5 20 12 4 20.5z" />
          </svg>
          <span>Google Play</span>
          <span className="bn-store-soon">Soon</span>
        </div>
      </div>
    </aside>
  );
}
