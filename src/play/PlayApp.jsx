import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getWordleAnswer, gradeWordleGuess, WORDLE_PLAYERS, getFootleNumber } from '../lib/wordle.js';

// Ball IQ "Play" web experience — the design handoff's Play.dc.html, recreated
// in React. State machine: home → footle → (quiz → results, later slices) + an
// ad overlay. Reuses the app's REAL Footle word + evaluation (lib/wordle.js).
// Mounted at /play-preview for now; flips to /play when complete.

const APP_STORE = 'https://apps.apple.com/app/id6775975961';
const BALL = '/marketing/ball.png';

const STYLE = `
.ply { position:relative; min-height:100vh; background:#0A0A0A; color:#F0F1F5; font-family:'Inter',system-ui,sans-serif; overflow-x:hidden; }
.ply a { text-decoration:none; }
.ply-signin { transition:border-color .15s, background .15s, color .15s; }
.ply-signin:hover { border-color:#3A3D4A; background:#14161E; color:#fff; }
.ply-back:hover { color:#fff; }
.ply-green { transition:transform .18s cubic-bezier(.34,1.56,.64,1), filter .15s; }
.ply-green:hover { transform:translateY(-2px); filter:brightness(1.04); }
.ply-dark { transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
.ply-dark:hover { transform:translateY(-2px); }
.ply-mode { transition:transform .16s, border-color .16s; }
.ply-mode:hover { transform:translateY(-4px); border-color:#3A3D4A; }
.ply-mode-online:hover { border-color:rgba(88,204,2,0.5) !important; }
.ply-key { transition:transform .08s, filter .12s; }
.ply-key:active { transform:translateY(1px); filter:brightness(1.1); }
.ply-iconbtn { transition:border-color .15s, background .15s; }
.ply-iconbtn:hover { border-color:#3A3D4A; background:#14161E; }
@keyframes plyPop { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:none} }
@media (prefers-reduced-motion: reduce){ .ply-green,.ply-dark,.ply-mode,.ply-key{transition:none} }
`;

// ── shared chrome ─────────────────────────────────────────────────────────────
function Glows() {
  return (
    <>
      <div style={{ position: 'fixed', top: '-10%', left: '50%', width: 'min(900px,120vw)', height: 600, transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(255,106,0,0.10), transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '50%', width: 'min(900px,120vw)', height: 600, transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(88,204,2,0.08), transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
    </>
  );
}

function Nav({ onSignIn }) {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 32px', background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #16181F' }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <img src={BALL} alt="Ball IQ" width={30} height={30} style={{ width: 30, height: 30, borderRadius: 8 }} />
        <span style={{ fontWeight: 900, fontSize: 19, color: '#fff' }}>Ball&nbsp;<span style={{ color: '#FFC107' }}>IQ</span></span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <button onClick={onSignIn} className="ply-signin" style={{ padding: '9px 17px', background: 'transparent', color: '#F0F1F5', fontSize: 13, fontWeight: 700, border: '1px solid #2A2D3A', borderRadius: 10, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
        <a href="/" style={{ fontSize: 13, fontWeight: 600, color: '#9BA0B8', transition: 'color .15s' }} className="ply-back">← Back to site</a>
      </div>
    </nav>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
const MODES = [
  { icon: '⏱️', tint: 'rgba(88,204,2,0.1)', name: 'Classic', sub: '10 questions, 20s each.' },
  { icon: '🔥', tint: 'rgba(255,106,0,0.1)', name: 'Survival', sub: 'One wrong answer ends it.' },
  { icon: '⚡', tint: 'rgba(255,193,7,0.1)', name: 'Hot Streak', sub: '60-second sprint.' },
  { icon: '🏆', tint: 'rgba(88,204,2,0.1)', name: 'Legends', sub: 'Pre-2000 greats.' },
  { icon: '🌐', tint: 'rgba(88,204,2,0.12)', name: 'Online', sub: 'Up to 8 players, live.', online: true },
  { icon: '👥', tint: 'rgba(88,204,2,0.1)', name: 'Local', sub: 'Pass & play on one device.' },
];
const footleTiles = [
  { c: 'F', bg: '#58CC02', fg: '#0A0A0A' }, { c: 'O', bg: '#242836', fg: '#6E7180' },
  { c: 'O', bg: '#FFC107', fg: '#0A0A0A' }, { c: 'T', bg: '#242836', fg: '#6E7180' },
  { c: 'L', bg: '#58CC02', fg: '#0A0A0A' }, { c: 'E', bg: '#FFC107', fg: '#0A0A0A' },
];

function Home({ onFootle, onMode }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '34px 32px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Good evening,</span>
        <span style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#9BA0B8' }}>Guest</span>
      </div>
      <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, padding: 24, borderRadius: 18, background: 'linear-gradient(100deg, rgba(255,106,0,0.10), rgba(88,204,2,0.06))', border: '1px solid #242836' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FF9245' }}>🔒 Guest mode</div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: '#fff' }}>Your stats aren't being saved</div>
          <div style={{ marginTop: 5, fontSize: 14, lineHeight: 1.55, color: '#9BA0B8', maxWidth: '52ch' }}>IQ rating, day streak and global rank live in your account. Get the app to track your progress and climb the leaderboard.</div>
        </div>
        <a href={APP_STORE} target="_blank" rel="noopener" className="ply-green" style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 22px', background: '#58CC02', color: '#0A0A0A', fontWeight: 800, fontSize: 15, borderRadius: 12, boxShadow: '0 8px 22px -6px rgba(88,204,2,0.5), inset 0 1px 0 rgba(255,255,255,0.25)' }}>Get the app →</a>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 18 }}>
        <div style={{ flex: '1.5 1 380px', position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 30, background: '#101218', border: '1px solid #242836' }}>
          <div style={{ position: 'absolute', top: -80, right: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(88,204,2,0.16), transparent 64%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#58CC02' }}>⚽ Daily · Footle</div>
            <div style={{ marginTop: 12, fontSize: 'clamp(30px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1 }}>Today's Footle</div>
            <div style={{ marginTop: 10, fontSize: 15, color: '#9BA0B8', maxWidth: '42ch' }}>Guess the footballer or manager's surname in six tries. A fresh one drops every day.</div>
            <div style={{ display: 'flex', gap: 7, marginTop: 22 }}>
              {footleTiles.map((t, i) => (
                <div key={i} style={{ width: 42, height: 42, borderRadius: 9, background: t.bg, color: t.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>{t.c}</div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              <button onClick={onFootle} className="ply-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 26px', background: '#58CC02', color: '#0A0A0A', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, border: 'none', borderRadius: 13, cursor: 'pointer', boxShadow: '0 8px 22px -6px rgba(88,204,2,0.55), inset 0 1px 0 rgba(255,255,255,0.25)' }}>Play Footle →</button>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6E7180' }}>New word every day</span>
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 300px', position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 30, background: 'linear-gradient(135deg,#FF6A00 0%,#FFC107 100%)' }}>
          <div style={{ position: 'absolute', right: -26, bottom: -40, fontSize: 170, opacity: 0.16, pointerEvents: 'none', lineHeight: 1 }} aria-hidden="true">🔥</div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.55)' }}>Daily 7</div>
            <div style={{ marginTop: 12, fontSize: 'clamp(26px,3.2vw,36px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#0A0A0A', lineHeight: 1 }}>Today's seven</div>
            <div style={{ marginTop: 10, fontSize: 14, color: 'rgba(10,10,10,0.7)' }}>Seven questions, the same for everyone. ~3 min.</div>
            <button onClick={() => onMode('daily')} className="ply-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '14px 24px', background: '#0A0A0A', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.5)' }}>Play the seven →</button>
          </div>
        </div>
      </div>
      <div style={{ margin: '38px 2px 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Game modes</h2>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6E7180', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Solo &amp; multiplayer</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        {MODES.map((m) => (
          <button key={m.name} onClick={() => onMode(m.name)} className={`ply-mode${m.online ? ' ply-mode-online' : ''}`} style={{ textAlign: 'left', padding: 22, background: '#14161E', border: `1px solid ${m.online ? 'rgba(88,204,2,0.25)' : '#242836'}`, borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: m.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{m.icon}</div>
            <div style={{ marginTop: 14, fontSize: 18, fontWeight: 800, color: '#fff' }}>{m.name}</div>
            <div style={{ marginTop: 3, fontSize: 13.5, color: '#9BA0B8' }}>{m.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── FOOTLE ────────────────────────────────────────────────────────────────────
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const TILE = { green: { bg: '#58CC02', bd: '#58CC02', fg: '#0A0A0A' }, yellow: { bg: '#FFC107', bd: '#FFC107', fg: '#0A0A0A' }, grey: { bg: '#242836', bd: '#242836', fg: '#8A8F9E' } };

function Footle({ onBack, onRequestHint, hint }) {
  const answer = useMemo(() => (getWordleAnswer() || '').toUpperCase(), []);
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState('');
  const [status, setStatus] = useState('playing');
  const [copied, setCopied] = useState(false);
  const N = answer.length;

  const grades = useMemo(() => guesses.map((g) => gradeWordleGuess(g, answer)), [guesses, answer]);

  // Same share format as the app's Footle (one puzzle, one format): the
  // "#N n/6" line is the comparability token. navigator.share where available,
  // clipboard fallback with a "Copied!" flash otherwise.
  const shareResult = useCallback(async () => {
    const grid = grades.map((row) => row.map((c) => (c === 'green' ? '🟩' : c === 'yellow' ? '🟨' : '⬛')).join('')).join('\n');
    const num = getFootleNumber();
    const tag = num > 0 ? ` #${num}` : '';
    const text = `⚽ Ball IQ Footle${tag} ${status === 'won' ? guesses.length : 'X'}/6\n\n${grid}\n\nballiq.app`;
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { return; } // cancel = done
    }
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [grades, guesses.length, status]);

  const submit = useCallback(() => {
    if (current.length !== N || status !== 'playing') return;
    const guess = current.toUpperCase();
    const next = [...guesses, guess];
    setGuesses(next); setCurrent('');
    if (guess === answer) setStatus('won');
    else if (next.length >= 6) setStatus('lost');
  }, [current, N, status, guesses, answer]);

  const onKey = useCallback((k) => {
    if (status !== 'playing') return;
    if (k === 'ENTER') return submit();
    if (k === 'BACK') return setCurrent((c) => c.slice(0, -1));
    if (/^[A-Z]$/.test(k)) setCurrent((c) => (c.length < N ? c + k : c));
  }, [status, submit, N]);

  useEffect(() => {
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'Enter') { e.preventDefault(); onKey('ENTER'); }
      else if (k === 'Backspace') { e.preventDefault(); onKey('BACK'); }
      else if (/^[a-zA-Z]$/.test(k)) onKey(k.toUpperCase());
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onKey]);

  // best-known state per key for keyboard colouring
  const keyState = useMemo(() => {
    const rank = { green: 3, yellow: 2, grey: 1 };
    const m = {};
    guesses.forEach((g, gi) => g.split('').forEach((ch, ci) => {
      const s = grades[gi][ci];
      if (!m[ch] || rank[s] > rank[m[ch]]) m[ch] = s;
    }));
    return m;
  }, [guesses, grades]);

  const cellSize = `clamp(38px, ${Math.floor(320 / N)}px, 52px)`;
  const cell = (content, st, filled) => (
    <div style={{
      width: cellSize, height: cellSize, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 'clamp(18px,4vw,24px)', textTransform: 'uppercase',
      background: st ? TILE[st].bg : filled ? '#14161E' : '#101218',
      border: `2px solid ${st ? TILE[st].bd : filled ? '#4A4D5A' : '#242836'}`,
      color: st ? TILE[st].fg : '#fff',
    }}>{content}</div>
  );

  const rows = [];
  for (let r = 0; r < 6; r++) {
    const cells = [];
    for (let c = 0; c < N; c++) {
      if (r < guesses.length) cells.push(<React.Fragment key={c}>{cell(guesses[r][c], grades[r][c], true)}</React.Fragment>);
      else if (r === guesses.length) cells.push(<React.Fragment key={c}>{cell(current[c] || '', null, !!current[c])}</React.Fragment>);
      else cells.push(<React.Fragment key={c}>{cell('', null, false)}</React.Fragment>);
    }
    rows.push(<div key={r} style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>{cells}</div>);
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '22px 20px 130px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} className="ply-iconbtn" aria-label="Back" style={{ width: 42, height: 42, borderRadius: 12, background: 'transparent', border: '1px solid #2A2D3A', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>⚽ Footle</div>
          <div style={{ fontSize: 12.5, color: '#9BA0B8' }}>Player or manager — guess the surname</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: '#58CC02', textTransform: 'uppercase' }}>Next</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#9BA0B8' }}>tomorrow</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={onRequestHint} disabled={status !== 'playing'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#14161E', border: '1px solid #242836', borderRadius: 12, color: '#FFD24A', fontWeight: 700, fontSize: 13, cursor: status === 'playing' ? 'pointer' : 'default', opacity: status === 'playing' ? 1 : 0.5, fontFamily: 'inherit' }}>
          💡 Reveal a letter <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 800, color: '#6E7180', border: '1px solid #2A2D3A', borderRadius: 5, padding: '2px 6px' }}>▶ AD</span>
        </button>
        {hint && <span style={{ padding: '7px 12px', background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.3)', borderRadius: 999, color: '#FFD24A', fontSize: 13, fontWeight: 700 }}>Letter {hint.pos} is {hint.letter}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 22 }}>{rows}</div>

      {status !== 'playing' && (
        <div style={{ marginTop: 22, textAlign: 'center', background: '#101218', border: '1px solid #242836', borderRadius: 16, padding: 20, animation: 'plyPop .3s ease' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: status === 'won' ? '#58CC02' : '#fff' }}>{status === 'won' ? '⚽ Brilliant!' : 'Out of guesses'}</div>
          <div style={{ marginTop: 6, fontSize: 14, color: '#9BA0B8' }}>The answer was <strong style={{ color: '#fff' }}>{answer}</strong></div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={shareResult} style={{ padding: '12px 22px', background: '#14161E', color: '#fff', fontWeight: 800, fontSize: 15, border: '1px solid #2A2D3A', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? '✓ Copied!' : '📋 Share result'}</button>
            <button onClick={onBack} className="ply-green" style={{ padding: '12px 22px', background: '#58CC02', color: '#0A0A0A', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 22px -6px rgba(88,204,2,0.5)' }}>Back to play →</button>
          </div>
        </div>
      )}

      {/* on-screen keyboard */}
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {KEY_ROWS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {ri === 2 && <KeyBtn label="ENTER" wide onClick={() => onKey('ENTER')} />}
            {row.split('').map((ch) => <KeyBtn key={ch} label={ch} state={keyState[ch]} onClick={() => onKey(ch)} />)}
            {ri === 2 && <KeyBtn label="⌫" wide onClick={() => onKey('BACK')} />}
          </div>
        ))}
      </div>

      {/* anchor ad mockup */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '10px 16px', background: '#0C0E13', borderTop: '1px solid #16181F', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
        <div style={{ width: '100%', maxWidth: 728, height: 64, border: '1px dashed #2A2D3A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#3C3F4C', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Advertisement · 728×90 anchor
        </div>
      </div>
    </div>
  );
}

function KeyBtn({ label, state, wide, onClick }) {
  const st = state ? TILE[state] : null;
  return (
    <button onClick={onClick} className="ply-key" style={{
      minWidth: wide ? 58 : 'clamp(26px,8vw,42px)', height: 52, padding: wide ? '0 10px' : 0, borderRadius: 8, border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontWeight: 700, fontSize: wide ? 12 : 15,
      background: st ? st.bg : '#2A2D3A', color: st ? st.fg : '#F0F1F5',
    }}>{label}</button>
  );
}

// ── AD OVERLAY (mockup) ───────────────────────────────────────────────────────
function AdOverlay({ ad, onClose, onClaim }) {
  const [secs, setSecs] = useState(5);
  useEffect(() => {
    setSecs(5);
    const t = setInterval(() => setSecs((s) => (s <= 1 ? (clearInterval(t), 0) : s - 1)), 1000);
    return () => clearInterval(t);
  }, [ad]);
  const done = secs === 0;
  const rewarded = ad.kind === 'rewarded';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#101218', border: '1px solid #242836', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.85)' }}>
        <div style={{ position: 'relative', aspectRatio: '16/10', background: 'linear-gradient(135deg,#14161E,#0C0E13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#3C3F4C', border: '1px solid #2A2D3A', borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase' }}>Ad</span>
          <button onClick={onClose} aria-label="Close ad" style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid #2A2D3A', color: '#9BA0B8', cursor: 'pointer', fontSize: 14 }}>✕</button>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6E7180' }}>Your ad plays here</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: '#9BA0B8' }}>{done ? 'Ready' : `${secs}s`}</div>
        </div>
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{rewarded ? 'Watch to earn your hint' : 'Quick ad break'}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#9BA0B8' }}>{rewarded ? 'Finish the ad to claim your reward.' : 'Your game continues right after.'}</div>
          <button onClick={done ? onClaim : undefined} disabled={!done} className={done ? 'ply-green' : undefined} style={{ marginTop: 16, width: '100%', padding: '13px', background: done ? '#58CC02' : '#1B1E27', color: done ? '#0A0A0A' : '#6E7180', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 12, cursor: done ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            {rewarded ? (done ? 'Claim reward' : `Reward in ${secs}s`) : (done ? 'Continue →' : `Continue in ${secs}s`)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QUIZ ──────────────────────────────────────────────────────────────────────
const MODE_LABEL = { daily: 'Daily 7', classic: 'Classic', legends: 'Legends' };

function QuizScreen({ quiz, onPick, onNext, onClose }) {
  const q = quiz.questions[quiz.qIndex];
  const total = quiz.questions.length;
  const danger = quiz.timeLeft <= 5;
  const wasCorrect = quiz.picked === q.a;
  const timedOut = quiz.picked === null;
  const last = quiz.qIndex + 1 >= total;
  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '22px 20px 70px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onClose} className="ply-iconbtn" aria-label="Close" style={{ width: 38, height: 38, borderRadius: 11, background: 'transparent', border: '1px solid #2A2D3A', color: '#9BA0B8', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        <div style={{ flex: 1, height: 8, background: '#1A1D27', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(quiz.qIndex / total) * 100}%`, background: '#58CC02', borderRadius: 999, transition: 'width .3s' }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: danger ? '#FF3B30' : '#FFC107', minWidth: 42, textAlign: 'right' }}>{quiz.timeLeft}s</div>
      </div>
      <div style={{ marginTop: 18, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6E7180', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Q {String(quiz.qIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · {MODE_LABEL[quiz.mode] || quiz.mode}</div>
      <div style={{ marginTop: 10, fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>{q.q}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 24 }}>
        {q.o.map((opt, i) => {
          const isCorrect = i === q.a, isPicked = i === quiz.picked;
          let bg = '#14161E', bd = '#242836';
          if (quiz.answered) {
            if (isCorrect) { bg = 'rgba(88,204,2,0.12)'; bd = '#58CC02'; }
            else if (isPicked) { bg = 'rgba(255,59,48,0.10)'; bd = '#FF3B30'; }
          }
          return (
            <button key={i} onClick={() => onPick(i)} disabled={quiz.answered} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: 16, background: bg, border: `1.5px solid ${bd}`, borderRadius: 14, cursor: quiz.answered ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#0F1117', border: '1px solid #2A2D3A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#9BA0B8', flexShrink: 0 }}>{'ABCD'[i]}</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#F0F1F5' }}>{opt}</span>
              {quiz.answered && isCorrect && <span style={{ color: '#58CC02', fontWeight: 800 }}>✓</span>}
              {quiz.answered && isPicked && !isCorrect && <span style={{ color: '#FF3B30', fontWeight: 800 }}>✗</span>}
            </button>
          );
        })}
      </div>
      {quiz.answered && (
        <div style={{ marginTop: 22, background: '#101218', border: '1px solid #242836', borderRadius: 14, padding: '16px 18px', animation: 'plyPop .25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: wasCorrect ? '#58CC02' : '#FF8A82' }}>
              {wasCorrect ? `✓ Correct  +${quiz.lastGain}` : timedOut ? "⏱ Time's up" : '✗ Not quite'}
            </span>
            <button onClick={onNext} className="ply-green" style={{ padding: '11px 20px', background: '#58CC02', color: '#0A0A0A', fontWeight: 800, fontSize: 14, border: 'none', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 20px -8px rgba(88,204,2,0.5)' }}>{last ? 'See results →' : 'Next question →'}</button>
          </div>
          {q.hint && <div style={{ marginTop: 10, fontSize: 13.5, color: '#9BA0B8', lineHeight: 1.5 }}>{q.hint}</div>}
        </div>
      )}
    </div>
  );
}

// ── RESULTS ───────────────────────────────────────────────────────────────────
function ResultsScreen({ quiz, onPlayAgain, onHome }) {
  const total = quiz.questions.length;
  const acc = Math.round((100 * quiz.correct) / total);
  const grade = acc === 100 ? { e: '🏆', t: 'Class of the season' } : acc >= 70 ? { e: '🥇', t: 'Top of the table' } : acc >= 40 ? { e: '⚽', t: 'Mid-table' } : { e: '🎓', t: 'Back to training' };
  const stat = (val, label, color) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: color || '#fff' }}>{val}</div>
      <div style={{ marginTop: 3, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6E7180' }}>{label}</div>
    </div>
  );
  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto', padding: '34px 20px 80px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6E7180' }}>{MODE_LABEL[quiz.mode] || quiz.mode} · Complete</div>
      <div style={{ fontSize: 56, marginTop: 14 }}>{grade.e}</div>
      <div style={{ marginTop: 6, fontSize: 'clamp(26px,4vw,34px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>{grade.t}</div>
      <div style={{ marginTop: 24, background: '#101218', border: '1px solid #242836', borderRadius: 18, padding: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(40px,9vw,56px)', fontWeight: 700, color: '#58CC02', lineHeight: 1 }}>{quiz.score}</div>
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7180' }}>Final score</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 22, paddingTop: 18, borderTop: '1px solid #1A1D27' }}>
          {stat(`${acc}%`, 'Accuracy')}
          {stat(`${quiz.correct}/${total}`, 'Correct')}
          {stat(quiz.bestStreak, 'Best run', '#FF8A3D')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
        <button onClick={onPlayAgain} className="ply-green" style={{ flex: 1, minWidth: 160, padding: 14, background: '#58CC02', color: '#0A0A0A', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 22px -6px rgba(88,204,2,0.5)' }}>Play again</button>
        <button onClick={onHome} className="ply-signin" style={{ flex: 1, minWidth: 160, padding: 14, background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 15, border: '1px solid #2A2D3A', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Back to home</button>
      </div>
      <a href={APP_STORE} target="_blank" rel="noopener" style={{ display: 'block', marginTop: 16, background: 'linear-gradient(100deg, rgba(255,106,0,0.10), rgba(88,204,2,0.06))', border: '1px solid #242836', borderRadius: 16, padding: 18, textAlign: 'left' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Save this score → Get the app</div>
        <div style={{ marginTop: 4, fontSize: 13, color: '#9BA0B8' }}>Track your IQ, streak and rank across every game.</div>
      </a>
      <div style={{ marginTop: 16, border: '1px dashed #2A2D3A', borderRadius: 12, padding: '18px', color: '#3C3F4C', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Advertisement · Responsive banner</div>
    </div>
  );
}

// ── CONTAINER ─────────────────────────────────────────────────────────────────
export default function PlayApp() {
  // /play?game=footle deep-links straight into the game — the /football-wordle
  // landing page and every directory listing use it ("lands directly on
  // playable Footle" is the qualifying bar for most daily-game directories).
  const [screen, setScreen] = useState(() => { // home | footle | quiz | results
    try { return new URLSearchParams(window.location.search).get('game') === 'footle' ? 'footle' : 'home'; }
    catch { return 'home'; }
  });
  const [ad, setAd] = useState(null);
  const [hint, setHint] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const goGame = () => { window.location.href = '/play'; };

  const startQuiz = useCallback(async (mode) => {
    const n = mode === 'daily' ? 7 : mode === 'classic' ? 10 : 8;
    let pool;
    try {
      const mod = await import('../questions.js');
      pool = (mod.QB || []).filter((x) => x.type === 'mcq' && Array.isArray(x.o) && x.o.length >= 2);
    } catch { goGame(); return; }
    if (mode === 'legends') pool = pool.filter((x) => x.cat === 'Legends');
    const arr = pool.slice();
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    const questions = arr.slice(0, n);
    if (questions.length === 0) { goGame(); return; }
    setQuiz({ mode, questions, qIndex: 0, picked: null, answered: false, score: 0, streak: 0, bestStreak: 0, correct: 0, timeLeft: 20, lastGain: 0 });
    setScreen('quiz');
  }, []);

  const startMode = useCallback((name) => {
    const m = String(name).toLowerCase();
    if (m === 'daily' || m === 'classic' || m === 'legends') startQuiz(m);
    else goGame(); // survival / hot streak / online / local → existing engine for now
  }, [startQuiz]);

  // per-question countdown
  useEffect(() => {
    if (screen !== 'quiz' || !quiz || quiz.answered) return;
    if (quiz.timeLeft <= 0) { setQuiz((q) => (q && !q.answered ? { ...q, picked: null, answered: true, streak: 0, lastGain: 0 } : q)); return; }
    const t = setTimeout(() => setQuiz((q) => (q && !q.answered ? { ...q, timeLeft: q.timeLeft - 1 } : q)), 1000);
    return () => clearTimeout(t);
  }, [screen, quiz?.timeLeft, quiz?.answered]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (idx) => setQuiz((q) => {
    if (!q || q.answered) return q;
    const correct = idx === q.questions[q.qIndex].a;
    const gain = correct ? 10 + q.timeLeft : 0;
    const streak = correct ? q.streak + 1 : 0;
    return { ...q, picked: idx, answered: true, score: q.score + gain, correct: q.correct + (correct ? 1 : 0), streak, bestStreak: Math.max(q.bestStreak, streak), lastGain: gain };
  });

  const next = () => {
    if (!quiz) return;
    if (quiz.qIndex + 1 >= quiz.questions.length) { setScreen('results'); return; }
    setQuiz((q) => ({ ...q, qIndex: q.qIndex + 1, picked: null, answered: false, timeLeft: 20, lastGain: 0 }));
  };

  const claimHint = () => {
    const ans = (getWordleAnswer() || '').toUpperCase();
    const i = Math.min(Math.floor(ans.length / 2), ans.length - 1);
    setHint({ pos: i + 1, letter: ans[i] });
    setAd(null);
  };

  return (
    <div className="ply">
      <style>{STYLE}</style>
      <Glows />
      <Nav onSignIn={goGame} />
      {screen === 'home' && <Home onFootle={() => { setHint(null); setScreen('footle'); }} onMode={startMode} />}
      {screen === 'footle' && <Footle onBack={() => setScreen('home')} onRequestHint={() => setAd({ kind: 'rewarded', onConfirm: claimHint })} hint={hint} />}
      {screen === 'quiz' && quiz && <QuizScreen quiz={quiz} onPick={pick} onNext={next} onClose={() => setScreen('home')} />}
      {screen === 'results' && quiz && (
        <ResultsScreen
          quiz={quiz}
          onHome={() => setScreen('home')}
          onPlayAgain={() => setAd({ kind: 'interstitial', onConfirm: () => { setAd(null); startQuiz(quiz.mode); } })}
        />
      )}
      {ad && <AdOverlay ad={ad} onClose={() => setAd(null)} onClaim={() => ad.onConfirm && ad.onConfirm()} />}
    </div>
  );
}
