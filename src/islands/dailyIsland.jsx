// Shared plumbing for the Trail and Mystery islands — the parts footle.jsx
// carries inline. Events, the phone-only app link, a vibrate-only haptic, the
// toast line and the mount itself. Each island stays a few lines of wiring.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { marketingEvent } from '../lib/marketingEvent.js';
import { PlatformStoreBadge, isAndroidUA, isIOSUA } from '../components/StoreBadge.jsx';

// Events go through the homepage's sink (literal project URL, the app's
// visitor id, the robot guard) — see src/islands/footle.jsx for why an env
// read here silently deleted the whole request on the first Footle deploy.
export const makeFunnel = (surface) => (event, meta) => marketingEvent(event, { surface, ...(meta || {}) });

export const isAndroid = isAndroidUA();
export const isIOS = isIOSUA();

// Vibrate where the browser allows it; the app's richer patterns need the
// native bridge. Cold guesses ('select') get the lightest tap.
export const haptic = (type) => {
  try {
    navigator.vibrate?.(type === 'hardCorrect' || type === 'correct' ? [20, 40, 20] : type === 'wrong' ? 60 : 10);
  } catch {}
};

// The app's post-game nudge under a result: the visitor's own store badge —
// the same badge the pages and the homepage draw — plus one line, phone-only
// (nothing on desktop, where there is no store). No counts: the binding rule.
export function makeGetAppCTA(funnel, where) {
  return function GetAppCTA() {
    return (
      <PlatformStoreBadge
        onClick={(store) => funnel('store-out', { store, where })}
        caption="Streaks, daily reminders and every quiz in one app"
      />
    );
  };
}

// Status line for share/copy feedback (the app has a toast host; these pages
// have one quiet line under the board).
export function toastHost(id) {
  window.addEventListener('biq:show-toast', (e) => {
    const t = document.getElementById(id);
    if (!t) return;
    t.textContent = String(e.detail || '');
    t.hidden = false;
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.hidden = true; }, 2500);
  });
}

// Mounts the screen and answers the one question these pages did not have:
// does anyone FINISH the daily on the web.
export function mountDaily({ hostId, game, funnel, element }) {
  window.addEventListener('biq:daily-completed', (e) => {
    const d = e?.detail || {};
    if (d.game !== game) return;
    funnel(`${game}-web-finish`, { won: d.won === true, attempts: d.attempts || null });
  });
  const host = document.getElementById(hostId);
  if (!host) return;
  funnel(`${game}-web-view`, {});
  createRoot(host).render(<React.StrictMode>{element}</React.StrictMode>);
}
