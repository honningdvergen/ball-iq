// ── THE FOOTLE ISLAND — today's puzzle on the static /football-wordle/ page ──
// A second Vite entry (vite.config.js `footle`), mounted by gen-seo-pages.mjs
// into #footle-today. It renders the app's own FootballWordle component with
// light stand-ins for what the app shell normally supplies — no Supabase, no
// Sentry, no confetti canvas, no install banner — so the chunk stays small and
// the page needs no session. Same storage key as the app: a guest who plays
// here and installs later finds today already done.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FootballWordle } from '../games/FootballWordle.jsx';
import { getFootleNumber } from '../lib/wordle.js';
import { marketingEvent } from '../lib/marketingEvent.js';
import { makeGetAppCTA } from './dailyIsland.jsx';

// Events go through the homepage's sink: a literal project URL (an env read
// here returned undefined at build and the minifier deleted the whole request
// path — measured on the first deploy of this page, 2026-09-05), the app's
// visitor id, and the robot guard. Never a second copy of that contract.
const funnel = (event, meta) => marketingEvent(event, { surface: 'footle-page', ...(meta || {}) });

// The result CTA is the visitor's own store badge — shared with the Trail and
// Mystery islands (dailyIsland.jsx) so all three pages draw the same one.
const GetAppCTA = makeGetAppCTA(funnel, 'footle-result');

const SERVICES = {
  haptic: (type) => { try { navigator.vibrate?.(type === 'correct' ? [20, 40, 20] : type === 'wrong' ? 60 : 10); } catch {} },
  GetAppCTA,
  isNative: false,
};

// Status line for share/copy feedback (the app has a toast host; this page
// has one quiet line under the board).
window.addEventListener('biq:show-toast', (e) => {
  const t = document.getElementById('footle-toast');
  if (!t) return;
  t.textContent = String(e.detail || '');
  t.hidden = false;
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.hidden = true; }, 2500);
});

// The one number this page did not have: does anyone finish Footle on the web.
window.addEventListener('biq:daily-completed', (e) => {
  const d = e?.detail || {};
  if (d.game !== 'footle') return;
  funnel('footle-web-finish', { won: d.won === true, guesses: d.guesses || null });
});

// The masthead is written here, not at build time: a generated page can sit
// unbuilt for days and a stale "No. 125" on the day of No. 127 is worse than
// no number. Same source the share text uses.
try {
  const m = document.getElementById('footle-masthead');
  const n = getFootleNumber();
  if (m && n > 0) {
    const day = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    m.innerHTML = `<b>Footle No. ${n}</b> · ${day} · a new name at midnight, the same for everyone`;
    m.hidden = false;
  }
} catch {}

const host = document.getElementById('footle-today');
if (host) {
  funnel('footle-web-view', {});
  createRoot(host).render(
    <React.StrictMode>
      <FootballWordle
        onHowToPlay={() => { try { document.getElementById('how')?.scrollIntoView({ block: 'start' }); } catch {} }}
        services={SERVICES}
      />
    </React.StrictMode>,
  );
}
