import React, { useState, useEffect, useRef } from 'react';
import { Phone } from './Phone.jsx';

// Ball IQ marketing homepage — the "Matchday" direction from the design
// handoff (design/website-handoff/). Recreated faithfully in React from
// "Ball IQ Website.dc.html" (the isA block). Standalone surface: dark,
// energetic, drives App Store installs + "Play free in browser" → /play.
//
// Scroll reveals use IntersectionObserver (the prototype's CSS scroll-timeline
// equivalent, per the README). All ambient motion respects prefers-reduced-motion.

const APP_STORE = 'https://apps.apple.com/app/id6775975961';
const PLAY = '/play';
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
.mkt-cta-green { transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, filter .15s; }
.mkt-cta-green:hover { transform:translateY(-2px); box-shadow:0 14px 30px -6px rgba(88,204,2,0.72), inset 0 1px 0 rgba(255,255,255,0.25); filter:brightness(1.04); }
.mkt-cta-app { transition:transform 80ms, border-color .15s; }
.mkt-cta-app:hover { transform:translateY(-2px); border-color:#3A3D4A; }
.mkt-cta-black { transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s; }
.mkt-cta-black:hover { transform:translateY(-2px); box-shadow:0 16px 34px -8px rgba(0,0,0,0.72); }
.mkt-mode { transition:transform .18s, border-color .18s; }
.mkt-mode:hover { transform:translateY(-4px); border-color:#3A3D4A; }
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

const AppleGlyph = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.42 2.2-1.26 2.99-.84.79-1.85 1.25-2.95 1.16-.13-1.06.4-2.18 1.18-2.95.83-.82 2.06-1.41 3.03-1.4.01.07.01.13 0 .2zm3.66 16.06c-.6 1.38-.88 1.99-1.65 3.2-1.08 1.69-2.6 3.79-4.48 3.81-1.67.02-2.1-1.09-4.37-1.07-2.27.01-2.74 1.09-4.41 1.07-1.88-.02-3.32-1.92-4.4-3.6-3.02-4.74-3.34-10.29-1.47-13.24 1.33-2.09 3.43-3.32 5.4-3.32 2.01 0 3.27 1.1 4.93 1.1 1.61 0 2.59-1.1 4.91-1.1 1.76 0 3.62.96 4.95 2.61-4.35 2.38-3.64 8.59.96 10.54z" />
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

const GreenCTA = ({ href, children, big, target }) => (
  <a href={href} target={target} rel={target ? 'noopener' : undefined} className="mkt-cta-green"
     style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: big ? '15px 26px' : '11px 20px', background: '#58CC02', color: '#0A0A0A', fontWeight: 800, fontSize: big ? 16 : 14, borderRadius: 12, boxShadow: '0 8px 22px -6px rgba(88,204,2,0.6), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
    {children}
  </a>
);

const eyebrow = (color) => ({ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color });
const h2Style = { margin: '14px 0 0', fontSize: 'clamp(30px,4vw,42px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.025em', color: '#fff' };
const bodyStyle = { margin: '18px 0 0', fontSize: 17, lineHeight: 1.6, color: '#9BA0B8', maxWidth: '46ch' };
const chip = (extra) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, ...extra });

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
  { q: 'Is Ball IQ free?', a: 'Yes. Download and play for free — guests can jump straight into solo and local games, no account needed.' },
  { q: 'Do I need an account?', a: 'No. Play as a guest, or sign up to play online 1v1, save your streak, and build your profile card and leaderboard rank.' },
  { q: "What's Footle?", a: "Our daily Wordle-style game: guess the footballer or manager's surname in six tries. A fresh one drops every day." },
  { q: 'Can I play with friends?', a: 'Absolutely — race friends in real time online, or pass-and-play locally on a single device.' },
  { q: 'Where can I play?', a: 'On iPhone via the App Store, or instantly in your browser at balliq.app — your progress follows your account.' },
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
  const [hasPlayed] = useState(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        if ((localStorage.key(i) || '').startsWith('biq_')) return true;
      }
    } catch {}
    return false;
  });

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
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 28px', background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #16181F' }}>
        <a href="/"><Brand /></a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <a href="#features" className="mkt-link">Features</a>
          <a href="#modes" className="mkt-link">Modes</a>
          <a href="#faq" className="mkt-link">FAQ</a>
          <a href={PLAY} className="mkt-link" style={{ fontWeight: 700 }}>Play</a>
          <GreenCTA href={APP_STORE} target="_blank">Get the app</GreenCTA>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: '96px 24px 40px', textAlign: 'center', overflow: 'hidden' }}>
        <div className="mkt-glow" style={{ position: 'absolute', top: '64%', left: '50%', width: 'min(820px,120vw)', height: 'min(820px,120vw)', background: 'radial-gradient(circle, rgba(255,106,0,0.26) 0%, rgba(255,106,0,0.10) 36%, transparent 64%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', border: '1px solid #2A2D3A', borderRadius: 999, background: 'rgba(26,29,39,0.6)', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9BA0B8' }}>
            <span>🔥</span> The ultimate football quiz
          </div>
          <h1 style={{ margin: '22px auto 0', maxWidth: '14ch', fontSize: 'clamp(44px,8vw,86px)', fontWeight: 900, lineHeight: 0.98, letterSpacing: '-0.035em', color: '#fff' }}>
            Prove you know <span style={{ color: '#FFC107', textShadow: '0 0 38px rgba(255,106,0,0.5)' }}>football.</span>
          </h1>
          <p style={{ margin: '24px auto 0', maxWidth: '52ch', fontSize: 'clamp(16px,2vw,19px)', lineHeight: 1.55, color: '#9BA0B8' }}>
            4,000+ questions across 10 game modes. Play the daily, climb the ranks, or take on up to 8 players — live.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 34 }}>
            <AppStoreBadge />
            <GreenCTA href={PLAY} big>{hasPlayed ? 'Continue playing →' : 'Play free in browser →'}</GreenCTA>
          </div>
        </div>

        {/* phone cluster */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 56, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'clamp(-30px,-2vw,0px)' }}>
          <div style={{ width: 'clamp(150px,20vw,210px)', transform: 'rotate(-7deg) translateY(8px)', marginRight: -18 }}>
            <Phone src={SHOT.footle} alt="Footle — Wordle for footballers" floatDur="6.5s" floatDelay="-1.2s" />
          </div>
          <div style={{ width: 'clamp(190px,26vw,268px)', position: 'relative', zIndex: 3 }}>
            <Phone src={SHOT.home} alt="Ball IQ home screen" floatDur="6s" />
          </div>
          <div style={{ width: 'clamp(150px,20vw,210px)', transform: 'rotate(7deg) translateY(8px)', marginLeft: -18 }}>
            <Phone src={SHOT.profile} alt="FIFA-style profile card" floatDur="7s" floatDelay="-2.4s" />
          </div>
        </div>
      </section>

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
              <span style={chip({ background: '#1A1D27', border: '1px solid #2A2D3A', color: '#F0F1F5' })}>👥 Local 1v1</span>
            </div>
          </div>
        </Reveal>

        {/* F3 — Profile */}
        <Reveal style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48 }}>
          <div style={{ flex: '1 1 320px', minWidth: 300 }}>
            <div style={eyebrow('#FFC107')}>Your profile</div>
            <h2 style={h2Style}>Your football brain,<br />rated out of 99.</h2>
            <p style={bodyStyle}>Every answer feeds a FIFA-style player card — an OVERALL rating broken down league by league. Read your scouting report, find your specialism, and share the card.</p>
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
            <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6, color: '#6E7180' }}>The ultimate football quiz. 4,000+ questions across 10 game modes — test your knowledge solo, with friends, or against up to 8 players online.</p>
            <div style={{ marginTop: 20 }}><AppStoreBadge small /></div>
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
