// Desktop-only left sidebar navigation. Rendered alongside the existing
// mobile tab bar during Phase 2 (you'll see both at desktop) — Phase 3
// hides the tab bar at desktop, leaving only this. CSS-gated to mobile/
// PWA via `display: none` so it has zero visual footprint there.
//
// Reuses the same `tab` / `setTab` state the tab bar uses — no new
// routing or persistence. Friends button scrolls to the existing
// .friends-section inside the Profile tab. Settings opens the existing
// Settings screen.
export function DesktopNav({ tab, setTab, setScreen, dailyDone, showToast }) {
  const goTab = (id) => () => setTab(id);

  const goFriends = () => {
    setTab("profile");
    // Let the Profile tab render before scrolling to its friends block.
    setTimeout(() => {
      const el = document.querySelector('.friends-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const goSettings = () => setScreen("settings");

  // Both store CTAs are placeholders until App Store Connect listing is
  // approved AND Google Play Console listing is created. Swap href + drop
  // the toast handler when those land.
  // TODO: replace text pills with official "Download on the App Store"
  // and "Get it on Google Play" badge images post-launch.
  const onStoreClick = (e) => {
    e.preventDefault();
    showToast?.("Coming soon — TestFlight invite available, message me!");
  };

  return (
    <aside className="desktop-nav" aria-label="Primary">
      <div className="dn-brand">Ball <em>IQ</em></div>
      <nav className="dn-list">
        <button data-active={tab === 'home'}    onClick={goTab('home')}>Home</button>
        <button data-active={tab === 'league'}  onClick={goTab('league')}>League</button>
        <button data-active={tab === 'daily'}   onClick={goTab('daily')}>
          Daily
          {!dailyDone && <span className="dn-dot" aria-label="new" />}
        </button>
        <button data-active={tab === 'profile'} onClick={goTab('profile')}>Profile</button>
        <button onClick={goFriends}>Friends</button>
        <div className="dn-divider" />
        <button onClick={goSettings}>Settings</button>
      </nav>
      <div className="dn-cta">
        <div className="dn-cta-eyebrow">Coming soon</div>
        <a href="#" onClick={onStoreClick} className="dn-cta-badge">App Store →</a>
        <a href="#" onClick={onStoreClick} className="dn-cta-badge">Google Play →</a>
      </div>
    </aside>
  );
}
