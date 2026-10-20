// ── THE APP BAR — the app's own tabs, under the site header, on the web ───────
// Browser visitors used to get the app's 248px sidebar (wordmark, Home,
// Daily, Profile, Online, Settings, store badges) at desktop and a floating
// bottom tab bar on phones — an app port inside a website (Alex, 2026-09-03,
// on a club quiz screen: "this is an example of a page that does not look
// like website consistency"). On the web the SITE header carries the brand
// and the finder; this slim bar carries only what the app adds: its tabs.
// Native and installed PWAs keep the sidebar and the tab bar untouched.
import React from 'react';
import { CalendarDays, Globe, Home, User, Settings, Bell } from 'lucide-react';
import { useT } from '../i18n/index.js';

const TABS = [
  { id: 'home', Icon: Home, label: 'nav.play' },
  // Labels are i18n keys (src/i18n/en.js). Must match the mobile tab bar (App.jsx) and the desktop rail
  // (BiqNav.jsx). This said 'Daily' until 2026-09-06: the tab was renamed to
  // History that day in both of those files and missed here, so the web bar
  // sent people to a page whose own title disagreed with the button they
  // pressed. tests/unit/nav-label-parity.test.js now holds the three in step.
  { id: 'daily', Icon: CalendarDays, label: 'tab.daily' },
  { id: 'online', Icon: Globe, label: 'tab.online' },
  { id: 'profile', Icon: User, label: 'tab.profile' },
];

/**
 * @param {{ tab: string, active: string|null, setTab: (t: string) => void, setScreen: (s: string) => void,
 *           dailyDone: boolean, notifCount?: number, onOpenNotifs?: () => void }} props
 */
export function AppBar({ tab, active, setTab, setScreen, dailyDone, notifCount = 0, onOpenNotifs }) {
  const t = useT();
  const cur = active === undefined ? tab : active;
  const goTab = (id) => () => { setScreen('home'); setTab(id); };
  return (
    <nav className="fd-appbar" aria-label="App">
      <div className="fd-w fd-appbar-in">
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} type="button" className="fd-appbar-tab" aria-label={t(label)} aria-current={cur === id ? 'page' : undefined} onClick={goTab(id)}>
            <Icon size={16} strokeWidth={2.25} aria-hidden="true" />
            <span>{t(label)}</span>
            {id === 'daily' && !dailyDone && <i className="fd-appbar-dot" aria-hidden="true" />}
          </button>
        ))}
        <span className="fd-appbar-spacer" />
        {onOpenNotifs && (
          <button type="button" className="fd-appbar-tab" onClick={onOpenNotifs} aria-label={notifCount > 0 ? t('nav.notificationsNew', { count: notifCount }) : t('nav.notifications')}>
            <Bell size={16} strokeWidth={2.25} aria-hidden="true" />
            {notifCount > 0 && <i className="fd-appbar-dot" aria-hidden="true" />}
          </button>
        )}
        <button type="button" className="fd-appbar-tab fd-appbar-settings" aria-label={t('nav.settings')} aria-current={cur === 'settings' ? 'page' : undefined} onClick={() => setScreen('settings')}>
          <Settings size={16} strokeWidth={2.25} aria-hidden="true" />
          <span>{t('nav.settings')}</span>
        </button>
      </div>
    </nav>
  );
}
