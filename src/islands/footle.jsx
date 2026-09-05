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
import { PLAY_STORE_URL, appStoreUrl } from '../lib/links.js';
import { getFootleNumber } from '../lib/wordle.js';

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Robots must not vote — the same refusal the club engine and App.jsx make.
function synthetic() {
  try {
    if (navigator.webdriver === true) return true;
    const h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch { return false; }
}

// First-party, consent-exempt, keyed by the app's own visitor id so a web
// finish and a later app session are one journey rather than two strangers.
function funnel(event, meta) {
  if (synthetic() || !SB_URL || !SB_KEY) return;
  let vid = null;
  try {
    vid = localStorage.getItem('biq_vid');
    if (!vid && window.crypto?.randomUUID) { vid = window.crypto.randomUUID(); localStorage.setItem('biq_vid', vid); }
  } catch {}
  try {
    fetch(`${SB_URL}/rest/v1/rpc/record_funnel_event`, {
      method: 'POST', keepalive: true,
      headers: { 'content-type': 'application/json', apikey: SB_KEY, authorization: `Bearer ${SB_KEY}` },
      body: JSON.stringify({ p_event: event, p_visitor: vid, p_meta: { surface: 'footle-page', ...meta } }),
    }).catch(() => {});
  } catch {}
}

const isAndroid = /Android/i.test(navigator.userAgent || '') && !/Windows Phone/i.test(navigator.userAgent || '');
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') || ((navigator.userAgent || '').includes('Mac') && navigator.maxTouchPoints > 1);

// The app's post-game nudge, phone-only, one line — the same copy the app
// shows (no counts: the binding rule).
function GetAppCTA() {
  if (!isAndroid && !isIOS) return null;
  return (
    <>
      <a className="wd-share" href={isAndroid ? PLAY_STORE_URL : appStoreUrl()} target="_blank" rel="noopener noreferrer"
        onClick={() => funnel('store-out', { store: isAndroid ? 'android' : 'ios', where: 'footle-result' })}
        style={{ background: 'var(--accent)', color: '#0B0C10', fontWeight: 800, textDecoration: 'none' }}>
        📲 Get the free app
      </a>
      <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 2 }}>
        Streaks, daily reminders and every quiz in one app
      </div>
    </>
  );
}

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
