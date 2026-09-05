// ── THE SITE HEADER — one header for the whole website ───────────────────────
// Rendered by React on the front door and inside the app for browser
// visitors; scripts/seo/shell.mjs renders the same markup as static HTML on
// every generated page. Wordmark · section links · the club/league finder ·
// Sign in · a burger below 720px. No marketing button (none of the 13 sites
// in the 2026-09-03 field study has one). ⚠️ KEEP IN STEP with shell.mjs.
import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import '../design/front.css';
import { CLUB_INDEX } from './clubIndex.js';
import { marketingEvent } from '../lib/marketingEvent.js';

const PLAY = '/play';
export const LEAGUES = [
  { s: 'premier-league', n: 'Premier League' }, { s: 'la-liga', n: 'La Liga' },
  { s: 'serie-a', n: 'Serie A' }, { s: 'bundesliga', n: 'Bundesliga' },
  { s: 'ligue-1', n: 'Ligue 1' }, { s: 'super-lig', n: 'Süper Lig' },
  { s: 'primeira-liga', n: 'Primeira Liga' }, { s: 'champions-league', n: 'Champions League' },
  { s: 'world-cup', n: 'World Cup' }, { s: 'euros', n: 'Euros' },
];

const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;

// Header search: clubs by name, leagues by name; Enter takes the first hit.
function useFinder(q) {
  return useMemo(() => {
    const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const nq = norm(q.trim());
    if (!nq) return [];
    const clubs = CLUB_INDEX.map((c) => {
      const n = norm(c.n);
      const rank = n.startsWith(nq) ? 0 : n.includes(nq) ? 1 : -1;
      // The club's own page, not the app — same rule as the homepage tiles (2026-09-05).
      return rank < 0 ? null : { rank, kind: 'club', n: c.n, sub: c.c, href: `/quiz/${c.s}/` };
    }).filter(Boolean);
    const leagues = LEAGUES.map((l) => {
      const n = norm(l.n);
      const rank = n.startsWith(nq) ? 0 : n.includes(nq) ? 1 : -1;
      return rank < 0 ? null : { rank, kind: 'league', n: l.n, sub: 'League quiz', href: `/quiz/${l.s}/` };
    }).filter(Boolean);
    return [...clubs, ...leagues].sort((a, b) => a.rank - b.rank || a.n.localeCompare(b.n)).slice(0, 8);
  }, [q]);
}


/**
 * @param {{ active?: 'clubs'|'quizzes'|'lists'|'', signedIn?: boolean, onProfile?: () => void }} props
 * signedIn/onProfile: inside the app the right-hand link becomes "Profile".
 */
export function SiteHeader({ active = '', signedIn = false, onProfile } = {}) {
  // The build injects a static copy of this header into index.html so it
  // paints before any JavaScript (see vite.config.js, preload-gameroot). Take
  // it down in a LAYOUT effect — before this render is painted — so the page
  // never shows two headers for a frame.
  useLayoutEffect(() => {
    try { document.getElementById('biq-static-head')?.remove(); document.getElementById('biq-static-head-css')?.remove(); } catch {}
  }, []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const hits = useFinder(q);
  const searchRef = useRef(null);
  const go = (name, href) => { try { marketingEvent(name, { href }); } catch {} };
  const a = (k) => (active === k ? 'is-active' : undefined);
  return (
    <header className="fd-head">
      <div className="fd-w fd-head-in">
        <a className="fd-mark" href="/" aria-label="Ball IQ home"><img src="/marketing/ball.png" alt="" width="26" height="26" /><span>Ball IQ</span></a>
        <nav className={`fd-nav${menu ? ' is-open' : ''}`} aria-label="Sections">
          <a href="/#today">Today</a><a href="/#games">Games</a><a className={a('clubs')} href="/#clubs">Clubs</a><a className={a('quizzes')} href="/football-quiz/">Quizzes</a><a className={a('lists')} href="/lists/">Lists</a>{!signedIn && <a className="fd-nav-signin" href={PLAY}>Sign in</a>}
        </nav>
        <div className="fd-find" role="search">
          <span className="fd-find-ic"><SearchIcon /></span>
          <input ref={searchRef} type="search" className="fd-find-in" value={q} placeholder="Find your club or league"
            aria-label="Find your club or league" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="search"
            onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) { go('fd-find', hits[0].href); window.location.href = hits[0].href; } if (e.key === 'Escape') { setQ(''); setOpen(false); } }} />
          {open && q.trim() && (
            <div className="fd-find-res" role="listbox">
              {hits.length === 0 && <div className="fd-find-empty">Nothing on file called “{q.trim()}” yet. <a href="/#clubs">See every club</a></div>}
              {hits.map((h) => (
                <a key={h.href} role="option" className="fd-find-row" href={h.href} onMouseDown={(e) => e.preventDefault()} onClick={() => go('fd-find', h.href)}>
                  <span className="fd-find-n">{h.n}</span><span className="fd-find-sub">{h.sub}</span><span className="fd-find-go">Play</span>
                </a>
              ))}
            </div>
          )}
        </div>
        {signedIn ? <button type="button" className="fd-signin" onClick={onProfile}>Profile</button> : <a className="fd-signin" href={PLAY}>Sign in</a>}
        <button type="button" className="fd-burger" aria-label={menu ? 'Close menu' : 'Menu'} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{menu ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
        </button>
      </div>
    </header>
  );
}
