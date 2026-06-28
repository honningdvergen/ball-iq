import React from 'react';

// Ball IQ "Play" web dashboard — the guest-mode home from the design handoff
// (design/website-handoff/Play.dc.html, the `home` screen). First slice of the
// Play experience redesign. Recreated faithfully in React. CTAs route into the
// existing game at /play for now; the in-design Footle/quiz/results screens land
// in subsequent slices, when these wire to the real engine.

const APP_STORE = 'https://apps.apple.com/app/id6775975961';
const BALL = '/marketing/ball.png';
const goGame = () => { window.location.href = '/play'; };

const STYLE = `
.ply { position:relative; min-height:100vh; background:#0A0A0A; color:#F0F1F5; font-family:'Inter',system-ui,sans-serif; overflow-x:hidden; }
.ply a { text-decoration:none; }
.ply-signin { transition:border-color .15s, background .15s, color .15s; }
.ply-signin:hover { border-color:#3A3D4A; background:#14161E; color:#fff; }
.ply-back { color:#9BA0B8; transition:color .15s; }
.ply-back:hover { color:#fff; }
.ply-green { transition:transform .18s cubic-bezier(.34,1.56,.64,1), filter .15s; }
.ply-green:hover { transform:translateY(-2px); filter:brightness(1.04); }
.ply-dark { transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
.ply-dark:hover { transform:translateY(-2px); }
.ply-mode { transition:transform .16s, border-color .16s; }
.ply-mode:hover { transform:translateY(-4px); border-color:#3A3D4A; }
.ply-mode-online:hover { border-color:rgba(88,204,2,0.5) !important; }
@media (prefers-reduced-motion: reduce) { .ply-green, .ply-dark, .ply-mode { transition:none; } }
`;

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

export default function PlayDashboard() {
  return (
    <div className="ply">
      <style>{STYLE}</style>
      {/* ambient glows */}
      <div style={{ position: 'fixed', top: '-10%', left: '50%', width: 'min(900px,120vw)', height: 600, transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(255,106,0,0.10), transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '50%', width: 'min(900px,120vw)', height: 600, transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(88,204,2,0.08), transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 32px', background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #16181F' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src={BALL} alt="Ball IQ" width={30} height={30} style={{ width: 30, height: 30, borderRadius: 8 }} />
          <span style={{ fontWeight: 900, fontSize: 19, color: '#fff' }}>Ball&nbsp;<span style={{ color: '#FFC107' }}>IQ</span></span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button onClick={goGame} className="ply-signin" style={{ padding: '9px 17px', background: 'transparent', color: '#F0F1F5', fontSize: 13, fontWeight: 700, border: '1px solid #2A2D3A', borderRadius: 10, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
          <a href="/" className="ply-back" style={{ fontSize: 13, fontWeight: 600 }}>← Back to site</a>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1140, margin: '0 auto', padding: '34px 32px 80px' }}>
        {/* greeting */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Good evening,</span>
          <span style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#9BA0B8' }}>Guest</span>
        </div>

        {/* guest card */}
        <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, padding: 24, borderRadius: 18, background: 'linear-gradient(100deg, rgba(255,106,0,0.10), rgba(88,204,2,0.06))', border: '1px solid #242836' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FF9245' }}>🔒 Guest mode</div>
            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: '#fff' }}>Your stats aren't being saved</div>
            <div style={{ marginTop: 5, fontSize: 14, lineHeight: 1.55, color: '#9BA0B8', maxWidth: '52ch' }}>IQ rating, day streak and global rank live in your account. Get the app to track your progress and climb the leaderboard.</div>
          </div>
          <a href={APP_STORE} target="_blank" rel="noopener" className="ply-green" style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 22px', background: '#58CC02', color: '#0A0A0A', fontWeight: 800, fontSize: 15, borderRadius: 12, boxShadow: '0 8px 22px -6px rgba(88,204,2,0.5), inset 0 1px 0 rgba(255,255,255,0.25)' }}>Get the app →</a>
        </div>

        {/* hero row: Footle + Daily 7 */}
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
                <button onClick={goGame} className="ply-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 26px', background: '#58CC02', color: '#0A0A0A', fontFamily: 'inherit', fontWeight: 800, fontSize: 16, border: 'none', borderRadius: 13, cursor: 'pointer', boxShadow: '0 8px 22px -6px rgba(88,204,2,0.55), inset 0 1px 0 rgba(255,255,255,0.25)' }}>Play Footle →</button>
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
              <button onClick={goGame} className="ply-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '14px 24px', background: '#0A0A0A', color: '#fff', fontFamily: 'inherit', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.5)' }}>Play the seven →</button>
            </div>
          </div>
        </div>

        {/* modes */}
        <div style={{ margin: '38px 2px 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Game modes</h2>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#6E7180', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Solo &amp; multiplayer</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
          {MODES.map((m) => (
            <button key={m.name} onClick={goGame} className={`ply-mode${m.online ? ' ply-mode-online' : ''}`}
              style={{ textAlign: 'left', padding: 22, background: '#14161E', border: `1px solid ${m.online ? 'rgba(88,204,2,0.25)' : '#242836'}`, borderRadius: 18, cursor: 'pointer', fontFamily: 'inherit' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: m.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{m.icon}</div>
              <div style={{ marginTop: 14, fontSize: 18, fontWeight: 800, color: '#fff' }}>{m.name}</div>
              <div style={{ marginTop: 3, fontSize: 13.5, color: '#9BA0B8' }}>{m.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
