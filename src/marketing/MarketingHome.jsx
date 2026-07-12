import React, { useState, useEffect, useRef } from 'react';
import { Phone } from './Phone.jsx';
// Tiny data-free module (NOT lib/wordle.js — that would drag the 400+-player
// answer list into this chunk). Powers the "Footle #N is live today" chip.
import { getFootleNumber } from '../lib/footleNumber.js';

// Ball IQ marketing homepage — the "Matchday" direction from the design
// handoff (design/website-handoff/). Recreated faithfully in React from
// "Ball IQ Website.dc.html" (the isA block). Standalone surface: dark,
// energetic, drives App Store installs + "Play free in browser" → /play.
//
// Scroll reveals use IntersectionObserver (the prototype's CSS scroll-timeline
// equivalent, per the README). All ambient motion respects prefers-reduced-motion.

// Country-coded canonical URL. The country-less /app/id… form deep-links fine on
// iOS but errors ("An Error Occurred") on desktop web, where there's no local
// store to resolve into. Apple redirects any storefront to the viewer's own.
const APP_STORE = 'https://apps.apple.com/us/app/ball-iq-football-trivia/id6775975961';
const PLAY = '/play';
// Build-time question-bank count (vite define, re-derived every deploy so it
// never drifts stale). Fallback keeps dev servers / edge cases safe.
const QB_COUNT = Number(import.meta.env.VITE_QB_COUNT || 4000);
const BALL = '/marketing/ball.png';
const SHOT = {
  home: '/marketing/balliq-screenshot-00-home.png',
  mpLive: '/marketing/balliq-screenshot-01-multiplayer-live.png',
  profile: '/marketing/balliq-screenshot-02-profile-card.png',
  podium: '/marketing/balliq-screenshot-03-multiplayer-podium.png',
  footle: '/marketing/balliq-screenshot-04-footle.png',
};

const STYLE = `
.mkt { background:#0A0A0A; color:#F0F1F5; font-family:'Inter',system-ui,sans-serif; overflow-x:hidden; }
.mkt a { text-decoration:none; }
.mkt-link { color:#9BA0B8; font-size:14px; font-weight:600; transition:color .15s; }
.mkt-link:hover { color:#fff; }
.mkt-nav { padding:15px 28px; }
.mkt-nav-links { gap:30px; }
/* Highlighted "Play free" — green-outline ghost button with a soft glow, sits
   next to the solid "Get the app" so the free web play is an obvious action. */
.mkt-nav-play { display:inline-flex; align-items:center; padding:9px 17px; border:1.5px solid rgba(88,204,2,0.65); border-radius:12px; background:rgba(88,204,2,0.08); color:#8AE042; font-weight:800; font-size:14px; box-shadow:0 0 20px -6px rgba(88,204,2,0.5); transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, background .18s, border-color .18s; }
.mkt-nav-play:hover { transform:translateY(-2px); background:rgba(88,204,2,0.15); border-color:#58CC02; box-shadow:0 0 26px -4px rgba(88,204,2,0.65); color:#AEEF6E; }
/* Nav collapse: on phones the full link row + CTA overflows the viewport, so
   drop the anchor-jump links (Features/Modes/FAQ) and keep the two real actions
   (Play + Get the app) in a tighter row that always fits. */
@media (max-width:640px) {
  .mkt-nav { padding:12px 15px; }
  .mkt-nav-links { gap:14px; }
  .mkt-nav-sec { display:none; }
  .mkt-nav-cta { padding:10px 15px !important; font-size:13px !important; }
}
.mkt-cta-green { transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, filter .15s; }
.mkt-cta-green:hover { transform:translateY(-2px); box-shadow:0 14px 30px -6px rgba(88,204,2,0.72), inset 0 1px 0 rgba(255,255,255,0.25); filter:brightness(1.04); }
.mkt-cta-app { transition:transform 80ms, border-color .15s; }
.mkt-cta-app:hover { transform:translateY(-2px); border-color:#3A3D4A; }
.mkt-cta-black { transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s; }
.mkt-cta-black:hover { transform:translateY(-2px); box-shadow:0 16px 34px -8px rgba(0,0,0,0.72); }
.mkt-mode { transition:transform .18s, border-color .18s; }
.mkt-mode:hover { transform:translateY(-4px); border-color:#3A3D4A; }
.mkt-opt { transition:transform .15s, border-color .15s, background .15s; }
.mkt-opt:hover { transform:translateY(-1px); border-color:#3A3D4A; background:#161922; }
.mkt-try-again:hover { border-color:#3A3D4A !important; color:#fff !important; }
.mkt-play-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; align-items:start; max-width:900px; margin:0 auto; }
.mkt-play-card { background:#0F1117; border:1px solid #242836; border-radius:22px; padding:20px; box-shadow:0 20px 44px -22px rgba(0,0,0,0.7); }
@media (max-width:760px) { .mkt-play-grid { grid-template-columns:1fr; } }
/* Wide-desktop scale: the page is authored in px around a ~1280–1440
   composition, so at 1920+ it floats in dark space and the nav/logo read
   small. zoom (not transform) keeps layout, sticky nav, and hit targets
   tracking the scale. Deliberately gentle — a nudge, not a redesign. */
@media (min-width:1600px) { .mkt { zoom:1.13; } }
@media (min-width:2400px) { .mkt { zoom:1.3; } }
.mkt-qgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(158px,1fr)); gap:10px; }
.mkt-qtile { display:flex; align-items:center; gap:11px; padding:14px; background:#14161E; border:1px solid #242836; border-radius:14px; transition:transform .16s, border-color .16s; }
.mkt-qtile:hover { transform:translateY(-3px); border-color:#3A3D4A; }
.mkt-qtile-all { justify-content:center; background:rgba(88,204,2,0.08); border-color:rgba(88,204,2,0.3); }
.mkt-qbadge { width:36px; height:36px; flex:0 0 auto; border-radius:10px; background:#1F2430; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; letter-spacing:0.03em; }
.mkt-foot-link { color:#9BA0B8; font-size:14px; transition:color .15s; }
.mkt-foot-link:hover { color:#fff; }
.mkt-reveal { opacity:0; transform:translateY(30px); transition:opacity .85s cubic-bezier(.16,1,.3,1), transform .85s cubic-bezier(.16,1,.3,1); }
.mkt-reveal.is-visible { opacity:1; transform:none; }
.mkt-float { animation-name:mktFloatY; animation-timing-function:ease-in-out; animation-iteration-count:infinite; will-change:transform; }
.mkt-glow { animation:mktGlowPulse 4.5s ease-in-out infinite; }
.mkt-marquee { animation:mktMarquee 34s linear infinite; }
@keyframes mktFloatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-13px)} }
@keyframes mktGlowPulse { 0%,100%{opacity:.62} 50%{opacity:1} }
@keyframes mktMarquee { to { transform:translateX(-50%) } }
@media (prefers-reduced-motion: reduce) {
  .mkt-float, .mkt-glow, .mkt-marquee { animation:none !important; }
  .mkt-reveal { opacity:1; transform:none; transition:none; }
}
`;

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, style }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`mkt-reveal${visible ? ' is-visible' : ''}`} style={style}>
      {children}
    </div>
  );
}

// Canonical Apple-logo glyph path (the widely-used simple-icons outline) — the
// previous hand-rolled path rendered with off proportions (squashed leaf/body).
const AppleGlyph = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702" />
  </svg>
);

const AppStoreBadge = ({ small }) => (
  <a href={APP_STORE} target="_blank" rel="noopener" className="mkt-cta-app"
     style={{ display: 'inline-flex', alignItems: 'center', gap: small ? 10 : 11, padding: small ? '11px 18px' : '14px 22px', background: '#000', border: '1px solid #2A2D3A', borderRadius: small ? 12 : 14 }}>
    <AppleGlyph size={small ? 18 : 22} />
    {small ? (
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>App Store</span>
    ) : (
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
        <span style={{ fontSize: 10, color: '#9BA0B8', letterSpacing: '0.02em' }}>Download on the</span>
        <span style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>App Store</span>
      </span>
    )}
  </a>
);

// Canonical single-colour Google Play glyph (simple-icons outline), tinted
// muted grey to read as "not yet live".
const GooglePlayGlyph = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#9BA0B8" aria-hidden="true">
    <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
  </svg>
);

// Google Play badge — intentionally NOT a link. Android isn't shipped yet, and a
// dead store link is worse than none. Muted styling + "Coming soon" eyebrow
// signals the platform is on the way; the hero's green "Play free in browser"
// CTA is what gives Android visitors an immediate action TODAY (the web app runs
// fine on Android Chrome and installs as a PWA).
const PlayStoreBadge = ({ small }) => (
  <div className="mkt-cta-play" aria-label="Google Play — coming soon"
       style={{ display: 'inline-flex', alignItems: 'center', gap: small ? 10 : 11, padding: small ? '11px 18px' : '14px 22px', background: '#0A0A0A', border: '1px solid #242836', borderRadius: small ? 12 : 14, opacity: 0.72 }}>
    <GooglePlayGlyph size={small ? 18 : 22} />
    {small ? (
      <span style={{ fontSize: 13, color: '#9BA0B8', fontWeight: 700 }}>Android soon</span>
    ) : (
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
        <span style={{ fontSize: 10, color: '#6E7180', letterSpacing: '0.02em' }}>Coming soon to</span>
        <span style={{ fontSize: 16, color: '#9BA0B8', fontWeight: 700 }}>Google Play</span>
      </span>
    )}
  </div>
);

const GreenCTA = ({ href, children, big, target, className }) => (
  <a href={href} target={target} rel={target ? 'noopener' : undefined} className={`mkt-cta-green${className ? ' ' + className : ''}`}
     style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: big ? '15px 26px' : '11px 20px', background: '#58CC02', color: '#0A0A0A', fontWeight: 800, fontSize: big ? 16 : 14, borderRadius: 12, boxShadow: '0 8px 22px -6px rgba(88,204,2,0.6), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
    {children}
  </a>
);

const eyebrow = (color) => ({ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color });
const h2Style = { margin: '14px 0 0', fontSize: 'clamp(30px,4vw,42px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.025em', color: '#fff' };
const bodyStyle = { margin: '18px 0 0', fontSize: 17, lineHeight: 1.6, color: '#9BA0B8', maxWidth: '46ch' };
const chip = (extra) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, ...extra });

// Inline "taste of the game" — a real, tappable question right on the landing
// page so a visitor is PLAYING before they've decided to click through. Famous,
// satisfying questions only (no obscure trivia that makes people feel dumb on
// first contact); correct-answer index is varied so it isn't guessable as
// "always the first option". Hardcoded (5 rows, ~tiny) rather than importing the
// question bank — keeps the freshly-slimmed marketing chunk lean.
const TASTE_QS = [
  { q: 'Who has won the most Ballon d’Or awards?', opts: ['Cristiano Ronaldo', 'Lionel Messi', 'Michel Platini', 'Johan Cruyff'], a: 1 },
  { q: 'Which nation has won the most World Cups?', opts: ['Brazil', 'Germany', 'Italy', 'Argentina'], a: 0 },
  { q: 'Who is the Premier League’s all-time top scorer?', opts: ['Harry Kane', 'Alan Shearer', 'Wayne Rooney', 'Sergio Agüero'], a: 1 },
  { q: 'Which club has won the most Champions League titles?', opts: ['AC Milan', 'Bayern Munich', 'Liverpool', 'Real Madrid'], a: 3 },
  { q: 'Who won the 2022 World Cup?', opts: ['France', 'Argentina', 'Brazil', 'Croatia'], a: 1 },
];

// ── Playable Footle (marketing taste) ────────────────────────────────────────
// A lightweight, self-contained Wordle-for-footballers: 7-letter surname, six
// guesses, two-pass colouring. Deliberately SEPARATE from the app's real Footle
// (lib/wordle.js) — footballers-only per the handoff, and kept out of the
// marketing chunk's weight. Client-side date-seeded daily word (a taste; the
// competitive daily lives in the app — server-side word is a Phase 3 follow-up).
const FOOTLE_WORDS = ['HAALAND', 'RONALDO', 'MALDINI', 'LAMPARD', 'GERRARD', 'CANTONA', 'SHEARER', 'SEEDORF', 'RIVALDO', 'ROBINHO', 'BALLACK', 'LINEKER'];
const FOOTLE_TARGET = FOOTLE_WORDS[Math.floor(Date.now() / 86400000) % FOOTLE_WORDS.length];

// Two-pass Wordle scoring: greens claimed first, then presents (duplicate-safe).
function scoreGuess(guess, target) {
  const res = new Array(guess.length).fill('absent');
  const used = new Array(target.length).fill(false);
  for (let i = 0; i < guess.length; i++) if (guess[i] === target[i]) { res[i] = 'correct'; used[i] = true; }
  for (let i = 0; i < guess.length; i++) {
    if (res[i] === 'correct') continue;
    for (let j = 0; j < target.length; j++) { if (!used[j] && guess[i] === target[j]) { res[i] = 'present'; used[j] = true; break; } }
  }
  return res;
}

const footleTileStyle = (mark, filled, active) => {
  const base = { width: 'clamp(30px,10.5vw,42px)', height: 'clamp(30px,10.5vw,42px)', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '2px solid', fontWeight: 800, fontSize: 'clamp(15px,5vw,20px)', textTransform: 'uppercase', lineHeight: 1, color: '#fff' };
  if (mark === 'correct') return { ...base, background: '#58CC02', borderColor: '#58CC02', color: '#06230C' };
  if (mark === 'present') return { ...base, background: '#FFC107', borderColor: '#FFC107', color: '#241B00' };
  if (mark === 'absent') return { ...base, background: '#181B24', borderColor: '#181B24', color: '#8E93A6' };
  return { ...base, background: '#0F1117', borderColor: filled ? '#3A3D4A' : (active ? '#46516A' : '#232733') };
};
const footleKeyStyle = (state, wide) => {
  const base = { height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: 'none', fontWeight: 700, fontSize: wide ? 11.5 : 14, cursor: 'pointer', flex: wide ? '1.6 1 0' : '1 1 0', fontFamily: 'inherit', textTransform: 'uppercase' };
  if (state === 'correct') return { ...base, background: '#58CC02', color: '#06230C' };
  if (state === 'present') return { ...base, background: '#FFC107', color: '#241B00' };
  if (state === 'absent') return { ...base, background: '#14161C', color: '#5B6070' };
  return { ...base, background: '#2A2D3A', color: '#E8EAF0' };
};
const RESET_BTN = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', background: 'transparent', color: '#9BA0B8', fontWeight: 700, fontSize: 14, border: '1px solid #2A2D3A', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s, color .15s' };

function MiniFootle() {
  const target = FOOTLE_TARGET;
  const L = target.length;
  const MAX = 6;
  const [guesses, setGuesses] = useState([]);
  const [cur, setCur] = useState('');
  const won = guesses.length > 0 && guesses[guesses.length - 1] === target;
  const status = won ? 'won' : guesses.length >= MAX ? 'lost' : 'playing';

  const type = (ch) => { if (status !== 'playing') return; setCur((c) => (c.length < L ? c + ch : c)); };
  const del = () => setCur((c) => c.slice(0, -1));
  const submit = () => { if (status !== 'playing' || cur.length !== L) return; setGuesses((g) => [...g, cur]); setCur(''); };
  const reset = () => { setGuesses([]); setCur(''); };

  useEffect(() => {
    const onKey = (e) => {
      if (status !== 'playing' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') submit();
      else if (e.key === 'Backspace') del();
      else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // rebinds each render so the handlers see fresh cur/guesses

  const keyState = {};
  const rank = { absent: 1, present: 2, correct: 3 };
  for (const g of guesses) {
    const sc = scoreGuess(g, target);
    for (let i = 0; i < g.length; i++) { const ch = g[i], st = sc[i]; if (!keyState[ch] || rank[st] > rank[keyState[ch]]) keyState[ch] = st; }
  }

  const rows = [];
  for (let r = 0; r < MAX; r++) {
    if (r < guesses.length) rows.push({ letters: guesses[r].split(''), marks: scoreGuess(guesses[r], target), isCur: false });
    else if (r === guesses.length && status === 'playing') { const a = []; for (let i = 0; i < L; i++) a.push(cur[i] || ''); rows.push({ letters: a, marks: null, isCur: true }); }
    else rows.push({ letters: new Array(L).fill(''), marks: null, isCur: false });
  }
  const cap = target.charAt(0) + target.slice(1).toLowerCase();
  const msg = status === 'won' ? `Nice — got it in ${guesses.length}. It was ${cap}.` : `Out of guesses — it was ${cap}.`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ fontSize: 20 }}>⚽</span><span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Daily Footle</span></div>
      <div style={{ fontSize: 13.5, color: '#9BA0B8', marginTop: 4 }}>Guess the mystery footballer in six.</div>
      <div style={{ margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
        {rows.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
            {row.letters.map((ch, i) => (
              <div key={i} style={footleTileStyle(row.marks ? row.marks[i] : null, !!ch, row.isCur && i === cur.length)}>{ch}</div>
            ))}
          </div>
        ))}
      </div>
      {status !== 'playing' ? (
        <div style={{ marginTop: 14, padding: 14, background: '#14161E', border: '1px solid #242836', borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{msg}</div>
          <div style={{ fontSize: 13, color: '#9BA0B8', marginTop: 5 }}>A fresh Footle drops every day in the app.</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
            {/* Deep link straight into the app's real daily Footle — plain
                /play would strand them on the home dashboard, one game away. */}
            <GreenCTA href="/play?game=footle">Play the daily free →</GreenCTA>
            <button onClick={reset} className="mkt-try-again" style={RESET_BTN}>Try again</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>{'QWERTYUIOP'.split('').map((k) => <button key={k} onClick={() => type(k)} style={footleKeyStyle(keyState[k])}>{k}</button>)}</div>
          <div style={{ display: 'flex', gap: 4, padding: '0 14px' }}>{'ASDFGHJKL'.split('').map((k) => <button key={k} onClick={() => type(k)} style={footleKeyStyle(keyState[k])}>{k}</button>)}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={submit} style={footleKeyStyle(null, true)}>Enter</button>
            {'ZXCVBNM'.split('').map((k) => <button key={k} onClick={() => type(k)} style={footleKeyStyle(keyState[k])}>{k}</button>)}
            <button onClick={del} aria-label="Delete" style={footleKeyStyle(null, true)}>⌫</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Playable quiz taster (marketing) — "What's your Ball IQ?" ────────────────
// 5 famous questions → instant feedback → an IQ score out of 99. Homepage uses
// skill tiers (per handoff); the /quiz/* landing pages use fan tiers.
function QuizTaster() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  // Parked-pointer hover artifact (Alex report, browser-repro verified): after
  // clicking Next, the cursor sits on top of one option of the NEXT question,
  // so :hover lights a seemingly random option each round. Hover styling only
  // arms once the pointer actually MOVES on the current question.
  const [hoverArmed, setHoverArmed] = useState(false);
  const total = TASTE_QS.length;
  const cur = TASTE_QS[idx];
  const answered = picked !== null;
  const IQ = [46, 54, 63, 74, 88, 99];
  const TIERS = ['Rising talent', 'Rising talent', 'Solid', 'Pro', 'Elite', 'World class'];

  const pick = (i) => { if (answered) return; setPicked(i); if (i === cur.a) setScore((s) => s + 1); };
  const next = () => { if (idx + 1 >= total) setDone(true); else { setIdx(idx + 1); setPicked(null); setHoverArmed(false); } };
  const reset = () => { setIdx(0); setScore(0); setPicked(null); setDone(false); setHoverArmed(false); };

  const optStyle = (i) => {
    // Longhand border props ONLY — mixing the `border` shorthand with a
    // `borderColor` override made React clear borderColor on the next
    // question while skipping the (string-identical) shorthand, leaving the
    // picked+correct buttons with UA-default BLACK rings that moved around
    // every round (Alex report, computed-style probe confirmed).
    const base = { display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, borderWidth: 1.5, borderStyle: 'solid', borderColor: '#242836', background: '#0F1117', color: '#E8EAF0', fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: answered ? 'default' : 'pointer' };
    if (!answered) return base;
    if (i === cur.a) return { ...base, borderColor: 'rgba(88,204,2,0.55)', background: 'rgba(88,204,2,0.12)', color: '#9BE25C' };
    if (i === picked) return { ...base, borderColor: 'rgba(255,71,71,0.5)', background: 'rgba(255,71,71,0.1)', color: '#FF8A82' };
    return { ...base, opacity: 0.5 };
  };

  const head = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ fontSize: 20 }}>🎯</span><span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>What&apos;s your Ball IQ?</span></div>
      <div style={{ fontSize: 13.5, color: '#9BA0B8', marginTop: 4 }}>Five questions. Rated out of 99.</div>
    </>
  );

  if (done) {
    return (
      <div>
        {head}
        <div style={{ textAlign: 'center', padding: '18px 4px 4px' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: '#FFC107' }}>{IQ[score]}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 4 }}>{TIERS[score]}</div>
          <div style={{ fontSize: 13.5, color: '#9BA0B8', marginTop: 5 }}>You scored {score} / {total}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
            <GreenCTA href={PLAY}>Beat your score →</GreenCTA>
            <button onClick={reset} className="mkt-try-again" style={RESET_BTN}>Play again</button>
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.round(((idx + (answered ? 1 : 0)) / total) * 100);
  return (
    <div>
      {head}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E7180' }}>Q {idx + 1} / {total}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#8AE042', background: 'rgba(88,204,2,0.1)', borderRadius: 999, padding: '4px 10px' }}>{score} correct</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: '#1A1D27', marginTop: 10, overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', background: '#58CC02', borderRadius: 999, transition: 'width .3s ease' }} /></div>
      <div style={{ marginTop: 12, fontSize: 17, fontWeight: 800, lineHeight: 1.3, color: '#fff' }}>{cur.q}</div>
      <div style={{ display: 'grid', gap: 9, marginTop: 14 }} onMouseMove={hoverArmed ? undefined : () => setHoverArmed(true)}>
        {cur.opts.map((o, i) => (
          <button key={i} disabled={answered} onClick={() => pick(i)} className={!answered && hoverArmed ? 'mkt-opt' : undefined} style={optStyle(i)}>
            <span style={{ flex: 1 }}>{o}</span>
            {answered && i === cur.a && <span aria-hidden>✓</span>}
            {answered && i === picked && i !== cur.a && <span aria-hidden>✕</span>}
          </button>
        ))}
      </div>
      {answered && <button onClick={next} style={{ width: '100%', marginTop: 14, padding: 13, background: '#58CC02', color: '#06230C', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{idx + 1 >= total ? 'See your Ball IQ →' : 'Next →'}</button>}
    </div>
  );
}

// "Both" hero-adjacent play block: Footle + quiz taster, side-by-side on desktop,
// stacked Footle-first on mobile. Turns the front door from a brochure into a game.
// THE HERO. The games are the front door — a visitor is playing before they've
// decided anything. No marketing headline above this; per the design, "Pick your
// challenge" + the two playable cards IS the top of the page.
function PlayNow() {
  return (
    <section style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: 'clamp(30px,5vw,56px) 20px 22px', overflow: 'hidden' }}>
      <div className="mkt-glow" style={{ position: 'absolute', top: '20%', left: '50%', width: 'min(760px,120vw)', height: 'min(760px,120vw)', background: 'radial-gradient(circle, rgba(88,204,2,0.16) 0%, rgba(88,204,2,0.05) 38%, transparent 64%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: 30 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 15px', border: '1px solid #2A2D3A', borderRadius: 999, background: 'rgba(26,29,39,0.6)', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em', color: '#9BA0B8' }}>
          <span>⚽</span> Play free — no download needed
        </div>
        <h1 style={{ margin: '18px auto 0', maxWidth: '16ch', fontSize: 'clamp(34px,6vw,60px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.035em', color: '#fff' }}>Pick your challenge.</h1>
        <p style={{ margin: '16px auto 0', maxWidth: '46ch', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.55, color: '#9BA0B8' }}>Crack today&apos;s Footle, or rate your Ball IQ in five questions. Both free, right here.</p>
      </div>
      <div className="mkt-play-grid" style={{ position: 'relative', zIndex: 2 }}>
        <div className="mkt-play-card"><MiniFootle /></div>
        <div className="mkt-play-card"><QuizTaster /></div>
      </div>
      {/* Social-proof strip — REAL, non-drifting numbers only: QB_COUNT is
          build-time injected, Footle # is computed client-side per local day.
          The middle chip references the app's competitive DAILY, deliberately
          not captioning the MiniFootle taste above (separate 12-word game). */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 26 }}>
        <span style={chip({ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F0F1F5' })}>🧠 {QB_COUNT.toLocaleString('en-US')} fact-checked questions</span>
        <span style={chip({ background: 'rgba(88,204,2,0.1)', border: '1px solid rgba(88,204,2,0.28)', color: '#8AE042', fontWeight: 700 })}>⚽ Footle #{getFootleNumber()} is live today</span>
        <span style={chip({ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F0F1F5' })}>📱 Free on iPhone + any browser</span>
      </div>
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: 26 }}>
        <GreenCTA href={APP_STORE} target="_blank">Get 4,000+ more in the app →</GreenCTA>
        {/* "100% free" is accurate today; when Ball IQ Pro ships (2.0 roadmap:
            content stays free, Pro = features/cosmetics), soften to "Free to
            play". "In the app" scoping is mandatory — this page runs AdSense. */}
        <p style={{ margin: '14px auto 0', fontSize: 13, color: '#6E7180' }}>100% free · no ads in the app · Android coming soon</p>
      </div>
    </section>
  );
}

// Club + league quiz grid — the SEO internal-linking mesh, on the homepage.
// Every tile links to that topic's /quiz/<slug>/ LANDING page (never /play):
// spreads link equity to the pages we want to rank, and matches the funnel
// (land on the topic page → play the taster → deep-link into the app). Every
// slug here MUST be a live generated page (scripts/gen-seo-pages.mjs) — a tile
// pointing at a non-existent page is a 404: wasted crawl budget + dead UX.
const QUIZ_CLUBS = [
  { slug: 'manchester-united', label: 'Man United', badge: 'MUN' },
  { slug: 'arsenal', label: 'Arsenal', badge: 'ARS' },
  { slug: 'manchester-city', label: 'Man City', badge: 'MCI' },
  { slug: 'liverpool', label: 'Liverpool', badge: 'LIV' },
  { slug: 'chelsea', label: 'Chelsea', badge: 'CHE' },
  { slug: 'tottenham', label: 'Tottenham', badge: 'TOT' },
  { slug: 'newcastle', label: 'Newcastle', badge: 'NEW' },
  { slug: 'barcelona', label: 'Barcelona', badge: 'BAR' },
  { slug: 'real-madrid', label: 'Real Madrid', badge: 'RMA' },
  { slug: 'atletico-madrid', label: 'Atlético', badge: 'ATM' },
  { slug: 'juventus', label: 'Juventus', badge: 'JUV' },
  { slug: 'inter-milan', label: 'Inter Milan', badge: 'INT' },
  { slug: 'ac-milan', label: 'AC Milan', badge: 'MIL' },
  { slug: 'bayern-munich', label: 'Bayern', badge: 'BAY' },
  { slug: 'borussia-dortmund', label: 'Dortmund', badge: 'BVB' },
  { slug: 'psg', label: 'PSG', badge: 'PSG' },
  { slug: 'ajax', label: 'Ajax', badge: 'AJA' },
  { slug: 'napoli', label: 'Napoli', badge: 'NAP' },
  { slug: 'galatasaray', label: 'Galatasaray', badge: 'GAL' },
  { slug: 'benfica', label: 'Benfica', badge: 'SLB' },
];
const QUIZ_LEAGUES = [
  { slug: 'premier-league', label: 'Premier League', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'la-liga', label: 'La Liga', emoji: '🇪🇸' },
  { slug: 'serie-a', label: 'Serie A', emoji: '🇮🇹' },
  { slug: 'bundesliga', label: 'Bundesliga', emoji: '🇩🇪' },
  { slug: 'champions-league', label: 'Champions League', emoji: '⭐' },
  { slug: 'euros', label: 'Euros', emoji: '🇪🇺' },
  { slug: 'world-cup', label: 'World Cup', emoji: '🌍' },
];

// Club brand colours (mirror the app CLUB_PACKS + the /quiz SEO badges) for
// badge tinting. Light shirts (Real Madrid white, Dortmund yellow) get dark
// text via readableOn(); a hairline border keeps dark badges legible.
const CLUB_COLOR = {
  'manchester-united': '#DA291C', arsenal: '#EF0107', 'manchester-city': '#6CABDD',
  liverpool: '#C8102E', chelsea: '#034694', tottenham: '#132257', newcastle: '#241F20',
  barcelona: '#A50044', 'real-madrid': '#FFFFFF', 'atletico-madrid': '#CB3524',
  juventus: '#000000', 'inter-milan': '#010E80', 'ac-milan': '#FB090B',
  'bayern-munich': '#DC052D', 'borussia-dortmund': '#FDE100', psg: '#003170', ajax: '#CC0000',
  napoli: '#12A0D7', galatasaray: '#A90432', benfica: '#E32221',
};
const readableOn = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0A0A0A' : '#fff';
};

function QuizTile({ href, badge, emoji, label, color }) {
  const badgeStyle = emoji
    ? { background: 'transparent', fontSize: 22 }
    : color
      ? { background: color, color: readableOn(color), border: '1px solid rgba(255,255,255,0.16)' }
      : undefined;
  return (
    <a href={href} className="mkt-qtile">
      <span className="mkt-qbadge" style={badgeStyle}>{emoji || badge}</span>
      <span style={{ fontSize: 14.5, fontWeight: 700, color: '#F0F1F5' }}>{label}</span>
    </a>
  );
}

function QuizGrid() {
  return (
    <section id="quizzes" style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(46px,6vw,72px) 24px 12px' }}>
      <div style={{ textAlign: 'center', marginBottom: 34 }}>
        <div style={eyebrow('#43d17a')}>Browse quizzes</div>
        <h2 style={{ ...h2Style, textAlign: 'center' }}>A quiz for every team and league.</h2>
        <p style={{ ...bodyStyle, maxWidth: '52ch', margin: '12px auto 0', textAlign: 'center' }}>Pick your club or competition and test your knowledge — from the Premier League to the World Cup. New quizzes added every week.</p>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7180', margin: '0 2px 12px' }}>Clubs</div>
      <div className="mkt-qgrid">
        {QUIZ_CLUBS.map((c) => <QuizTile key={c.slug} href={`/quiz/${c.slug}/`} badge={c.badge} label={c.label} color={CLUB_COLOR[c.slug]} />)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7180', margin: '26px 2px 12px' }}>Leagues &amp; cups</div>
      <div className="mkt-qgrid">
        {QUIZ_LEAGUES.map((l) => <QuizTile key={l.slug} href={`/quiz/${l.slug}/`} emoji={l.emoji} label={l.label} />)}
        <a href="/quiz/" className="mkt-qtile mkt-qtile-all"><span style={{ fontSize: 14, fontWeight: 800, color: '#8AE042' }}>All quizzes →</span></a>
      </div>
    </section>
  );
}

const MODES = [
  { icon: '📋', tint: 'rgba(255,193,7,0.12)', name: 'Daily 7', sub: 'Seven questions, ~3 min.' },
  { icon: '⚽', tint: 'rgba(88,204,2,0.12)', name: 'Footle', sub: 'Guess the surname in six.' },
  { icon: '🌐', tint: 'rgba(88,204,2,0.12)', name: 'Online', sub: 'Up to 8 players, live.' },
  { icon: '⏱️', tint: 'rgba(88,204,2,0.12)', name: 'Classic', sub: '10 questions, 20s each.' },
  { icon: '🔥', tint: 'rgba(255,106,0,0.12)', name: 'Survival', sub: 'One wrong answer ends it.' },
  { icon: '⚡', tint: 'rgba(255,193,7,0.12)', name: 'Hot Streak', sub: '60-second sprint.' },
  { icon: '🏆', tint: 'rgba(88,204,2,0.12)', name: 'Legends', sub: 'Pre-2000 greats.' },
  { icon: '👥', tint: 'rgba(88,204,2,0.12)', name: 'Local', sub: 'Pass & play on one device.' },
];

const FAQS = [
  { q: 'Is Ball IQ free?', a: 'Yes — 100% free, and the app shows no ads. Guests can jump straight into solo and local games, no account needed.' },
  { q: 'Do I need an account?', a: 'No. Play as a guest, or sign up to play online with up to 8 friends, save your streak, and build your profile card and leaderboard rank.' },
  { q: "What's Footle?", a: "Our daily Wordle-style game: guess the footballer or manager's surname in six tries. A fresh one drops every day." },
  { q: 'Can I play with friends?', a: 'Absolutely — race friends in real time online, or pass-and-play locally on a single device.' },
  { q: 'Where can I play?', a: 'On iPhone via the App Store, or instantly in your browser — on Android, desktop, anywhere — at balliq.app. A native Android app is on the way; your progress follows your account across all of them.' },
];

function Brand({ size = 20, imgSize = 32 }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={BALL} alt="Ball IQ" width={imgSize} height={imgSize} style={{ width: imgSize, height: imgSize, borderRadius: 8 }} />
      <span style={{ fontWeight: 900, fontSize: size, letterSpacing: '-0.02em', color: '#fff' }}>Ball&nbsp;<span style={{ color: '#FFC107' }}>IQ</span></span>
    </span>
  );
}

export default function MarketingHome() {
  const [openFaq, setOpenFaq] = useState(null);
  // Returning players (any prior Ball IQ localStorage) get a fast-path CTA
  // instead of the new-visitor pitch. No redirect — / stays the indexable
  // homepage for everyone; only the hero CTA label changes.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'smooth';
    return () => { html.style.scrollBehavior = prev; };
  }, []);

  return (
    <div className="mkt">
      <style>{STYLE}</style>

      {/* ── NAV ── */}
      <nav className="mkt-nav" style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #16181F' }}>
        <a href="/"><Brand /></a>
        <div className="mkt-nav-links" style={{ display: 'flex', alignItems: 'center' }}>
          <a href="#quizzes" className="mkt-link mkt-nav-sec">Quizzes</a>
          <a href="#modes" className="mkt-link mkt-nav-sec">Modes</a>
          <a href="#faq" className="mkt-link mkt-nav-sec">FAQ</a>
          <a href={PLAY} className="mkt-nav-play mkt-nav-cta">Play free</a>
          <GreenCTA href={APP_STORE} target="_blank" className="mkt-nav-cta">Get the app</GreenCTA>
        </div>
      </nav>

      {/* ── HERO — the playable Footle + quiz taster ARE the front door ── */}
      <PlayNow />

      {/* ── BROWSE QUIZZES — club/league landing-page mesh (SEO + funnel) ── */}
      <QuizGrid />

      {/* ── TICKER ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid #16181F', borderBottom: '1px solid #16181F', background: '#0C0E13', padding: '16px 0' }}>
        <div className="mkt-marquee" style={{ display: 'flex', width: 'max-content', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6E7180', whiteSpace: 'nowrap' }}>
          {[0, 1].map((i) => (
            <span key={i}>
              {['4,000+ Questions', '10 Game modes', 'Daily 7', 'Footle', 'Up to 8 online', 'Survival', 'Hot Streak', 'Legends'].map((t, j) => (
                <React.Fragment key={j}>{'  '}{t}{'  '}<span style={{ color: '#FF6A00' }}>✦</span></React.Fragment>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1140, margin: '0 auto', padding: '90px 24px 20px' }}>
        {/* F1 — Footle */}
        <Reveal style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48, marginBottom: 96 }}>
          <div style={{ flex: '1 1 320px', minWidth: 300 }}>
            <div style={eyebrow('#FF6A00')}>A new fix, daily</div>
            <h2 style={h2Style}>A new challenge,<br />every single day.</h2>
            <p style={bodyStyle}>Footle — our Wordle for footballers — drops every morning. Pair it with the Daily 7, build a streak, and see how you stack up against everyone else.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <span style={chip({ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F0F1F5' })}>⚽ Footle</span>
              <span style={chip({ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F0F1F5' })}>📋 Daily 7</span>
              <span style={chip({ background: 'rgba(255,106,0,0.12)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF9245', fontWeight: 700 })}>🔥 Streaks</span>
            </div>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', width: 380, height: 380, background: 'radial-gradient(circle, rgba(88,204,2,0.12), transparent 62%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ width: 'clamp(220px,30vw,260px)', position: 'relative', zIndex: 2 }}>
              <Phone src={SHOT.footle} alt="Footle daily word game" floatDur="6.8s" />
            </div>
          </div>
        </Reveal>

        {/* F2 — Multiplayer (reversed) */}
        <Reveal style={{ display: 'flex', flexWrap: 'wrap-reverse', alignItems: 'center', gap: 48, marginBottom: 96 }}>
          <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', width: 380, height: 380, background: 'radial-gradient(circle, rgba(88,204,2,0.14), transparent 62%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ width: 'clamp(180px,23vw,210px)', position: 'relative', zIndex: 2, transform: 'rotate(-5deg) translateY(10px)', marginRight: -26 }}>
              <Phone src={SHOT.mpLive} alt="Live multiplayer quiz" floatDur="6.4s" floatDelay="-1.6s" />
            </div>
            <div style={{ width: 'clamp(180px,23vw,210px)', position: 'relative', zIndex: 3, transform: 'rotate(5deg) translateY(-6px)', marginLeft: -26 }}>
              <Phone src={SHOT.podium} alt="Multiplayer podium" floatDur="7.2s" floatDelay="-3.1s" />
            </div>
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 300 }}>
            <div style={eyebrow('#58CC02')}>Multiplayer</div>
            <h2 style={h2Style}>Race real players,<br />in real time.</h2>
            <p style={bodyStyle}>Match up with up to eight players online, or pass and play locally — same questions, live scores, and a podium at the final whistle.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <span style={chip({ background: 'rgba(88,204,2,0.1)', border: '1px solid rgba(88,204,2,0.28)', color: '#8AE042', fontWeight: 700 })}>🌐 Online · up to 8</span>
              <span style={chip({ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F0F1F5' })}>👥 Local · up to 6</span>
            </div>
          </div>
        </Reveal>

        {/* F3 — Profile */}
        <Reveal style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48 }}>
          <div style={{ flex: '1 1 320px', minWidth: 300 }}>
            <div style={eyebrow('#FFC107')}>Your profile</div>
            <h2 style={h2Style}>Your football brain,<br />rated out of 99.</h2>
            <p style={bodyStyle}>Every answer feeds your player card — an OVERALL rating broken down league by league. Read your scouting report, find your specialism, and share the card.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <span style={chip({ background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.3)', color: '#FFD24A', fontWeight: 700 })}>⭐ OVERALL rating</span>
              <span style={chip({ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F0F1F5' })}>🔍 Scouting report</span>
            </div>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,193,7,0.13), transparent 60%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
            <div style={{ width: 'clamp(220px,30vw,260px)', position: 'relative', zIndex: 2 }}>
              <Phone src={SHOT.profile} alt="Player rating card" floatDur="6.6s" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── MODES ── */}
      <section id="modes" style={{ maxWidth: 1140, margin: '0 auto', padding: '80px 24px' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={eyebrow('#9BA0B8')}>10 game modes</div>
          <h2 style={{ margin: '12px 0 0', fontSize: 'clamp(30px,4.4vw,46px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Pick your battle.</h2>
        </Reveal>
        <Reveal style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
          {MODES.map((m) => (
            <a key={m.name} href={PLAY} className="mkt-mode" style={{ padding: 22, background: '#14161E', border: '1px solid #242836', borderRadius: 18, display: 'block' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: m.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{m.icon}</div>
              <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800, color: '#fff' }}>{m.name}</div>
              <div style={{ marginTop: 4, fontSize: 14, color: '#9BA0B8' }}>{m.sub}</div>
            </a>
          ))}
        </Reveal>
      </section>

      {/* ── DAILY BAND ── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px 90px' }}>
        <Reveal style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(32px,5vw,56px)', background: 'linear-gradient(120deg,#FF6A00 0%,#FFC107 100%)' }}>
          <div style={{ position: 'absolute', right: -30, bottom: -50, fontSize: 240, opacity: 0.18, pointerEvents: 'none' }} aria-hidden="true">🔥</div>
          <div style={{ position: 'relative', maxWidth: '30ch' }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.6)' }}>Daily 7</div>
            <div style={{ marginTop: 12, fontSize: 'clamp(26px,3.4vw,38px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', color: '#0A0A0A' }}>Seven questions. Three minutes. Everyone plays the same set.</div>
            <a href={PLAY} className="mkt-cta-black" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '14px 26px', background: '#0A0A0A', color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 12, boxShadow: '0 10px 26px -8px rgba(0,0,0,0.6)' }}>Play today's set →</a>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ maxWidth: 760, margin: '0 auto', padding: '20px 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={eyebrow('#9BA0B8')}>FAQ</div>
          <h2 style={{ margin: '12px 0 0', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Good to know.</h2>
        </div>
        <div>
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} style={{ borderTop: '1px solid #1A1D27', ...(i === FAQS.length - 1 ? { borderBottom: '1px solid #1A1D27' } : {}) }}>
                <button onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', padding: '22px 2px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#fff', fontFamily: 'inherit', fontSize: 18, fontWeight: 700 }}>
                  <span>{f.q}</span>
                  <span style={{ flexShrink: 0, fontSize: 22, lineHeight: 1, color: open ? '#58CC02' : '#9BA0B8', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .25s cubic-bezier(.34,1.56,.64,1), color .2s' }}>+</span>
                </button>
                <div style={{ maxHeight: open ? 200 : 0, opacity: open ? 1 : 0, overflow: 'hidden', transition: 'max-height .3s ease, opacity .3s ease' }}>
                  <p style={{ margin: '0 2px', paddingBottom: 22, color: '#9BA0B8', fontSize: 15.5, lineHeight: 1.65 }}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #16181F', background: '#0C0E13' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '56px 24px 40px', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 320 }}>
            <Brand size={19} imgSize={30} />
            <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6, color: '#6E7180' }}>The ultimate football quiz. 4,000+ questions across 10 game modes — test your knowledge solo, with friends, or against up to 8 players online. Free to play — no ads in the app.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}><AppStoreBadge small /><PlayStoreBadge small /></div>
          </div>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7180', marginBottom: 16 }}>Quizzes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <a href="/quiz/" className="mkt-foot-link">Football quizzes</a>
                <a href="/quiz/world-cup/" className="mkt-foot-link">World Cup quiz</a>
                <a href="/quiz/premier-league/" className="mkt-foot-link">Premier League quiz</a>
                <a href="/quiz/champions-league/" className="mkt-foot-link">Champions League quiz</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7180', marginBottom: 16 }}>Club quizzes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <a href="/quiz/arsenal/" className="mkt-foot-link">Arsenal quiz</a>
                <a href="/quiz/liverpool/" className="mkt-foot-link">Liverpool quiz</a>
                <a href="/quiz/manchester-united/" className="mkt-foot-link">Man United quiz</a>
                <a href="/quiz/real-madrid/" className="mkt-foot-link">Real Madrid quiz</a>
                <a href="/quiz/barcelona/" className="mkt-foot-link">Barcelona quiz</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7180', marginBottom: 16 }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <a href="/about/" className="mkt-foot-link">About</a>
                <a href="/contact/" className="mkt-foot-link">Contact</a>
                <a href="/privacy.html" className="mkt-foot-link">Privacy</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 24px 36px', borderTop: '1px solid #16181F', fontSize: 13, color: '#6E7180' }}>© 2026 Ball IQ. The ultimate football quiz.</div>
      </footer>
    </div>
  );
}
