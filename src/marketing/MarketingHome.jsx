// The Scouting Report layer (paper, ink, the verdict ramp, --sp* spacing).
// Imported HERE rather than in main.jsx on purpose: this is the only surface
// that uses it, and the 191 generated pages must not carry its bytes. Vite
// emits it as a dependency of this chunk and injects the <link> before the
// module evaluates, so there is no unstyled frame. The shared dark palette
// (--bg/--card/--bd/--tx/--grn) still comes from the entry's tokens.css.
import '../design/fonts.css';
import '../design/report.css';
import {
  Target, Menu, X,
  Brain, Smartphone, Star, Globe, ClipboardList, Timer, Flame, Zap, Trophy,
  Users, Search, Swords,
} from 'lucide-react';
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

// Country-coded canonical URL — single source of truth in lib/links.js.
import { APP_STORE_URL as APP_STORE, PLAY_STORE_URL } from '../lib/links.js';
// Single-button 'Get the app' CTAs must NOT hardcode one store — /get (api/get.js)
// redirects iOS->App Store, Android->Play, desktop->the web app. The App Store and
// Play BADGES below stay as direct links, because there the platform is the label.
const GET_APP = '/get';
const PLAY = '/play';
// QB_COUNT / QB_ROUND (the build-time bank size) used to feed six strings on
// this page. They are gone deliberately, not by accident: the exact question
// count never appears in copy again. A visitor cannot tell 6,407 from 600 or
// 60,000, so the figure persuades nobody, while handing a competitor a number
// to beat with a scraped 20,000. Scale is shown by breadth (72 clubs, Real
// Madrid to Hajduk Split), never counted. The measured figures still live in
// PRODUCT.md, where they belong — they are an honesty check, not a headline.
const BALL = '/marketing/ball.png';
const SHOT = {
  home: '/marketing/balliq-screenshot-00-home.png',
  mpLive: '/marketing/balliq-screenshot-01-multiplayer-live.png',
  profile: '/marketing/balliq-screenshot-02-profile-card.png',
  podium: '/marketing/balliq-screenshot-03-multiplayer-podium.png',
  footle: '/marketing/balliq-screenshot-04-footle.png',
};

const STYLE = `
.mkt { background:var(--bg); color:var(--tx); font-family:'Inter',system-ui,sans-serif; overflow-x:hidden; }
.mkt a { text-decoration:none; }
.mkt-link { color:var(--tx3); font-size:14px; font-weight:600; transition:color .15s; }
.mkt-link:hover { color:#fff; }
.mkt-nav { padding:15px 28px; }
.mkt-nav-links { gap:30px; }
/* Highlighted "Play free" — green-outline ghost button with a soft glow, sits
   next to the solid "Get the app" so the free web play is an obvious action. */
.mkt-nav-play { display:inline-flex; align-items:center; padding:9px 17px; border:1.5px solid rgba(88,204,2,0.65); border-radius:12px; background:rgba(88,204,2,0.08); color:var(--grn-soft); font-weight:800; font-size:14px; box-shadow:0 0 20px -6px rgba(88,204,2,0.5); transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, background .18s, border-color .18s; }
.mkt-nav-play:hover { transform:translateY(-2px); background:rgba(88,204,2,0.15); border-color:var(--grn); box-shadow:0 0 26px -4px rgba(88,204,2,0.65); color:#AEEF6E; }
/* Nav collapse: on phones the full link row overflows, so the anchor-jump links
   move into a drawer rather than simply vanishing.

   They used to just vanish. At 390px the header rendered the logo and two CTAs
   and silently dropped Quizzes / Records / Modes / FAQ with no hamburger and no
   menu of any kind -- on a homepage that is ~10,900px tall. A phone visitor who
   wanted the quiz index had to scroll twenty-five screens or guess a URL, which
   quietly capped pages-per-session, and pages-per-session is the number ad
   revenue is a function of.

   Also drops to ONE header CTA on mobile: "Play free" is the primary action and
   "Get the app" moves into the drawer. Two competing CTAs plus a menu button is
   three controls fighting over ~200px of header. */
.mkt-burger { display:none; }
@media (max-width:640px) {
  .mkt-nav { padding:12px 15px; }
  .mkt-nav-links { gap:10px; }
  .mkt-nav-sec { display:none; }
  .mkt-nav-play { display:none; }               /* "Get the app" lives in the drawer */
  .mkt-nav-cta { padding:10px 15px !important; font-size:13px !important; }
  .mkt-burger {
    display:inline-flex; align-items:center; justify-content:center;
    width:44px; height:44px; flex:0 0 44px;      /* WCAG 2.5.5 touch target */
    background:transparent; border:1px solid var(--bd2); border-radius:12px;
    color:var(--tx); cursor:pointer; padding:0;
  }
  .mkt-burger:hover { border-color:var(--bd3); }
}
.mkt-drawer-scrim {
  position:fixed; inset:0; z-index:200; background:rgba(4,5,7,0.72);
  backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
  opacity:0; transition:opacity .22s ease;
}
.mkt-drawer-scrim[data-open="1"] { opacity:1; }
.mkt-drawer {
  position:fixed; top:0; right:0; bottom:0; z-index:201; width:min(84vw,320px);
  background:#101219; border-left:1px solid var(--bd);
  display:flex; flex-direction:column; padding:14px 16px 24px;
  transform:translateX(100%); transition:transform .26s cubic-bezier(.22,.8,.3,1);
  overflow-y:auto; overscroll-behavior:contain;
}
.mkt-drawer[data-open="1"] { transform:translateX(0); }
.mkt-drawer-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.mkt-drawer-close {
  width:44px; height:44px; display:inline-flex; align-items:center; justify-content:center;
  background:transparent; border:1px solid var(--bd2); border-radius:12px; color:var(--tx);
  cursor:pointer; padding:0;
}
.mkt-drawer a {
  display:flex; align-items:center; min-height:52px; padding:0 14px;
  border-radius:12px; color:var(--tx); font-size:17px; font-weight:700;
  border:1px solid transparent;
}
.mkt-drawer a:hover, .mkt-drawer a:focus-visible { background:#181B24; border-color:var(--bd); }
.mkt-drawer .mkt-drawer-cta {
  justify-content:center; background:var(--grn); color:var(--grn-ink); margin-top:14px;
  font-weight:800; border-color:var(--grn);
}
.mkt-drawer .mkt-drawer-app {
  justify-content:center; margin-top:9px; border-color:rgba(88,204,2,0.5); color:var(--grn-soft);
}
.mkt-drawer-sep { height:1px; background:var(--bd); margin:12px 4px; }
.mkt-drawer :focus-visible, .mkt-burger:focus-visible { outline:3px solid var(--grn); outline-offset:2px; }
@media (prefers-reduced-motion:reduce) {
  .mkt-drawer, .mkt-drawer-scrim { transition:none; }
}
.mkt-cta-green { transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, filter .15s; }
.mkt-cta-green:hover { transform:translateY(-2px); box-shadow:0 14px 30px -6px rgba(88,204,2,0.72), inset 0 1px 0 rgba(255,255,255,0.25); filter:brightness(1.04); }
.mkt-cta-app { transition:transform 80ms, border-color .15s; }
.mkt-cta-app:hover { transform:translateY(-2px); border-color:var(--bd3); }
.mkt-cta-black { transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s; }
.mkt-cta-black:hover { transform:translateY(-2px); box-shadow:0 16px 34px -8px rgba(0,0,0,0.72); }
.mkt-skip { position:absolute; left:-9999px; top:0; z-index:200; padding:12px 20px; background:var(--grn); color:var(--grn-ink); font-weight:800; border-radius:0 0 12px 0; }
.mkt-skip:focus { left:0; }
/* Without this the anchor inherits the UA's default link blue, so any child
   without an explicit colour renders bright blue on a dark card. */
.mkt-mode { color:inherit; transition:transform .18s, border-color .18s; }
.mkt-mode:hover { transform:translateY(-4px); border-color:var(--bd3); }
.mkt-opt { transition:transform .15s, border-color .15s, background .15s; }
.mkt-opt:hover { transform:translateY(-1px); border-color:var(--bd3); background:#161922; }
.mkt-try-again:hover { border-color:var(--bd3) !important; color:#fff !important; }
.mkt-play-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; align-items:start; max-width:900px; margin:0 auto; }
/* box-sizing is NOT optional here. Without it the 20px padding + 1px border are
   ADDED to the grid column's width, so on a 375px phone the card measured 376px
   inside a 335px column — 21px off-screen, which clipped the "0 correct" pill at
   the card's right edge. Measured with Playwright; invisible at desktop width,
   where the column is wide enough to absorb the overflow. */
/* min-width:0 is the ACTUAL fix. Grid items default to min-width:auto, which
   lets an item exceed its track — the card measured 376px inside a 335px
   column on a 375px phone, hanging 21px off-screen and clipping the
   "0 correct" pill. box-sizing alone did not solve it (verified: computed
   box-sizing was already border-box while the card was still 376px). */
.mkt-play-card { min-width:0; box-sizing:border-box; background:var(--card); border:1px solid var(--bd); border-radius:22px; padding:20px; box-shadow:0 20px 44px -22px rgba(0,0,0,0.7); }
/* MOBILE: stack to one column AND put the quiz taster FIRST.
   Measured 2026-07-28 against a ~100% homepage bounce: the MiniFootle card is
   ~636px tall, so stacked after ~200px of badge + headline + subtitle it fills
   an entire 844px iPhone screen on its own — and the first thing a visitor
   meets is an EMPTY 7x6 letter grid with its keyboard and instructions below
   the fold. The QuizTaster then starts ~1074px down and is never seen on a
   first screen.
   The taster is both shorter and the hook the H1 actually promises ("How good
   is your football knowledge?"), so on phones it leads. Order is swapped in
   CSS only — the DOM keeps Footle first, so desktop's left-to-right reading
   order (Footle | Taster) is untouched and no markup moves. */
@media (max-width:760px) {
  .mkt-play-grid { grid-template-columns:1fr; }
  .mkt-play-card:nth-child(1) { order:2; }  /* MiniFootle  -> second */
  .mkt-play-card:nth-child(2) { order:1; }  /* QuizTaster  -> first  */
}
/* Wide-desktop scale: the page is authored in px around a ~1280–1440
   composition, so at 1920+ it floats in dark space and the nav/logo read
   small. zoom (not transform) keeps layout, sticky nav, and hit targets
   tracking the scale. Deliberately gentle — a nudge, not a redesign. */
@media (min-width:1600px) { .mkt { zoom:1.13; } }
@media (min-width:2400px) { .mkt { zoom:1.3; } }
.mkt-qgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(158px,1fr)); gap:10px; }
.mkt-qtile { display:flex; align-items:center; gap:11px; padding:14px; background:var(--card2); border:1px solid var(--bd); border-radius:14px; transition:transform .16s, border-color .16s; }
.mkt-qtile:hover { transform:translateY(-3px); border-color:var(--bd3); }
.mkt-qtile-all { justify-content:center; background:rgba(88,204,2,0.08); border-color:rgba(88,204,2,0.3); }
.mkt-qbadge { width:36px; height:36px; flex:0 0 auto; border-radius:10px; background:#1F2430; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; letter-spacing:0.03em; }
.mkt-foot-link { color:var(--tx3); font-size:14px; transition:color .15s; }
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

// Stays a DIRECT App Store link — on a badge showing the Apple logo the
// platform IS the label, so routing it through /get would be wrong.
// Only the unlabelled "Get the app" buttons are platform-aware.
const AppStoreBadge = ({ small }) => (
  <a href={APP_STORE} target="_blank" rel="noopener" className="mkt-cta-app"
     style={{ display: 'inline-flex', alignItems: 'center', gap: small ? 10 : 11, padding: small ? '11px 18px' : '14px 22px', background: '#000', border: '1px solid var(--bd2)', borderRadius: small ? 12 : 14 }}>
    <AppleGlyph size={small ? 18 : 22} />
    {small ? (
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>App Store</span>
    ) : (
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
        <span style={{ fontSize: 10, color: 'var(--tx3)', letterSpacing: '0.02em' }}>Download on the</span>
        <span style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>App Store</span>
      </span>
    )}
  </a>
);

// Canonical single-colour Google Play glyph (simple-icons outline). Tinted to
// full white since the listing went live — it was muted grey while unshipped.
const GooglePlayGlyph = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
  </svg>
);

// Google Play badge — a REAL link since the listing went live 2026-07-27.
// Was deliberately a non-link <div> with a "Coming soon to" eyebrow while
// Android was unshipped; now mirrors the App Store badge exactly so Android
// visitors get the same first-class path iOS visitors have always had.
const PlayStoreBadge = ({ small }) => (
  <a className="mkt-cta-play" href={PLAY_STORE_URL} target="_blank" rel="noopener"
     aria-label="Get Ball IQ on Google Play"
     style={{ display: 'inline-flex', alignItems: 'center', gap: small ? 10 : 11, padding: small ? '11px 18px' : '14px 22px', background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: small ? 12 : 14 }}>
    <GooglePlayGlyph size={small ? 18 : 22} />
    {small ? (
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>Google Play</span>
    ) : (
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: 'left' }}>
        <span style={{ fontSize: 10, color: 'var(--tx3)', letterSpacing: '0.02em' }}>Get it on</span>
        <span style={{ fontSize: 16, color: '#fff', fontWeight: 700 }}>Google Play</span>
      </span>
    )}
  </a>
);

const GreenCTA = ({ href, children, big, target, className }) => (
  <a href={href} target={target} rel={target ? 'noopener' : undefined} className={`mkt-cta-green${className ? ' ' + className : ''}`}
     style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: big ? '15px 26px' : '11px 20px', background: 'var(--grn)', color: 'var(--bg)', fontWeight: 800, fontSize: big ? 16 : 14, borderRadius: 12, boxShadow: '0 8px 22px -6px rgba(88,204,2,0.6), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
    {children}
  </a>
);

const eyebrow = (color) => ({ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color });
const h2Style = { margin: '14px 0 0', fontSize: 'clamp(30px,4vw,42px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.025em', color: '#fff' };
const bodyStyle = { margin: '18px 0 0', fontSize: 17, lineHeight: 1.6, color: 'var(--tx3)', maxWidth: '46ch' };
const chip = (extra) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, ...extra });

// Inline "taste of the game" — a real, tappable question right on the landing
// page so a visitor is PLAYING before they've decided to click through. Famous,
// satisfying questions only (no obscure trivia that makes people feel dumb on
// first contact); correct-answer index is varied so it isn't guessable as
// "always the first option". Hardcoded (5 rows, ~tiny) rather than importing the
// question bank — keeps the freshly-slimmed marketing chunk lean.
// Taster questions. Every row is a VERBATIM copy of a real bank question —
// `id` is the src/questions.js id, and `why` is that question's own `hint`.
// This matters twice over:
//  1. "Every answer tells you why" is the differentiator GSC says converts
//     ("<club> quiz with answers" out-converts "<club> quiz" ~4x at equal
//     position), so the taster has to actually DEMONSTRATE it, not claim it.
//  2. The bank's explanations are fact-checked; hand-written marketing copy
//     is not. Sourcing from the bank keeps the zero-error bar on the most-read
//     page on the site.
// Options are ROTATED from the bank order so the answer is not at index 2 four
// times running (it was) — a five-question taster where the answer is always
// "C" teaches the wrong lesson. Rotation moves `a` with the answer string;
// regenerate rather than hand-editing, and re-check `opts[a]` if you touch it.
const TASTE_QS = [
  { id: 'q_1d0d44', q: 'Which country won the 2022 World Cup?', opts: ['Argentina', 'France', 'Brazil', 'Croatia'], a: 0, why: 'The final went to penalties in Qatar after a 3-3 draw; Mbappé scored a hat-trick in defeat.' },
  { id: 'q_04e822', q: 'Who is Barcelona\'s all-time top scorer in La Liga?', opts: ['Ronaldo', 'Fàbregas', 'Romário', 'Messi'], a: 3, why: 'Messi scored 474 La Liga goals for Barcelona between 2004 and 2021, also the all-time record for the competition.' },
  { id: 'q_a10f9b', q: 'Who scored 36 Premier League goals in 2022-23 to set a new single-season record?', opts: ['Kane', 'Haaland', 'Mohamed Salah', 'Ivan Toney'], a: 1, why: 'Haaland\'s 36 goals in 2022-23 broke the 38-game PL season record (previously 32 by Salah in 2017-18).' },
  { id: 'q_663a6e', q: 'Which Italian manager won the Champions League with both AC Milan and Real Madrid?', opts: ['Lippi', 'Capello', 'Ancelotti', 'Conte'], a: 2, why: 'Ancelotti won UCL with AC Milan (2003, 2007) and Real Madrid (2014, 2022, 2024) — five in total, more than any other manager.' },
  { id: 'q_0b5ee8', q: 'Who won the 2024 Men\'s Ballon d\'Or?', opts: ['Vinicius Jr', 'Jude Bellingham', 'Yamal', 'Rodri'], a: 3, why: 'Rodri became the first Manchester City player to win the Ballon d\'Or, edging Vinicius Junior months after winning Euro 2024 with Spain (where he was named player of the tournament).' },
];

// ── Playable Footle (marketing taste) ────────────────────────────────────────
// A lightweight, self-contained Wordle-for-footballers: 7-letter surname, six
// guesses, two-pass colouring. Deliberately SEPARATE from the app's real Footle
// (lib/wordle.js) — footballers-only per the handoff, and kept out of the
// marketing chunk's weight. Client-side date-seeded daily word (a taste; the
// competitive daily lives in the app — server-side word is a Phase 3 follow-up).
const FOOTLE_WORDS = ['HAALAND', 'RONALDO', 'MALDINI', 'LAMPARD', 'GERRARD', 'CANTONA', 'SHEARER', 'SEEDORF', 'RIVALDO', 'ROBINHO', 'BALLACK', 'LINEKER'];
const FOOTLE_TARGET = FOOTLE_WORDS[Math.floor(Date.now() / 86400000) % FOOTLE_WORDS.length];

// SEEDED OPENING GUESS. The card used to render 42 empty squares plus a
// keyboard, which made the largest object on the homepage look like a broken
// grid rather than a game. A visitor decides what this site is in about half a
// second, and an empty 7x6 grid says "unfinished".
//
// Two rules, both learned the hard way:
//  1. It must be a REAL seven-letter surname. A previous attempt at seeding
//     used "ALISTER", which is not a name, and "ALONSO", which is six letters
//     in a seven-wide grid. A football audience spots a fake board instantly.
//  2. Its colours are NOT hardcoded. scoreGuess() runs against the live daily
//     target at render, so the greens and ambers are always genuinely correct
//     for today's word -- there is no day on which this board lies.
//
// INIESTA must never appear in FOOTLE_WORDS: if the opener were the answer the
// card would render as already won. The assertion below enforces that rather
// than trusting whoever edits the word list next.
const FOOTLE_OPENER = 'INIESTA';
if (FOOTLE_WORDS.includes(FOOTLE_OPENER) ||
    FOOTLE_WORDS.some((w) => w.length !== FOOTLE_OPENER.length)) {
  throw new Error(
    `MiniFootle seed is invalid: "${FOOTLE_OPENER}" must not be an answer and ` +
    'must match the answer length. Fix FOOTLE_OPENER or FOOTLE_WORDS.',
  );
}

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
  if (mark === 'correct') return { ...base, background: 'var(--grn)', borderColor: 'var(--grn)', color: 'var(--grn-ink)' };
  if (mark === 'present') return { ...base, background: 'var(--amber)', borderColor: 'var(--amber)', color: '#241B00' };
  if (mark === 'absent') return { ...base, background: '#181B24', borderColor: '#181B24', color: '#8E93A6' };
  return { ...base, background: 'var(--card)', borderColor: filled ? 'var(--bd3)' : (active ? '#46516A' : '#232733') };
};
const footleKeyStyle = (state, wide) => {
  const base = { height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, border: 'none', fontWeight: 700, fontSize: wide ? 11.5 : 14, cursor: 'pointer', flex: wide ? '1.6 1 0' : '1 1 0', fontFamily: 'inherit', textTransform: 'uppercase' };
  if (state === 'correct') return { ...base, background: 'var(--grn)', color: 'var(--grn-ink)' };
  if (state === 'present') return { ...base, background: 'var(--amber)', color: '#241B00' };
  // A spent key still has to be READ — it is how you remember what you have
  // already tried. #5B6070 on this background measured 2.89:1, the worst text
  // on the site and the only WCAG failure the deterministic scan found (x4).
  // var(--tx4) is an existing token here and clears at 4.70:1.
  if (state === 'absent') return { ...base, background: '#14161C', color: 'var(--tx4)' };
  return { ...base, background: 'var(--bd2)', color: 'var(--tx2)' };
};
const RESET_BTN = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', background: 'transparent', color: 'var(--tx3)', fontWeight: 700, fontSize: 14, border: '1px solid var(--bd2)', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s, color .15s' };

function MiniFootle() {
  const target = FOOTLE_TARGET;
  const L = target.length;
  const MAX = 6;
  // Starts on the seeded opener, so the board is a game IN PROGRESS on first
  // paint rather than 42 empty squares. Costs the visitor one of six rows,
  // which is the right trade for a taster: it demonstrates the mechanic
  // instantly instead of asking them to imagine it.
  const [guesses, setGuesses] = useState([FOOTLE_OPENER]);
  const [cur, setCur] = useState('');
  const won = guesses.length > 0 && guesses[guesses.length - 1] === target;
  const status = won ? 'won' : guesses.length >= MAX ? 'lost' : 'playing';

  const type = (ch) => { if (status !== 'playing') return; setCur((c) => (c.length < L ? c + ch : c)); };
  const del = () => setCur((c) => c.slice(0, -1));
  const submit = () => { if (status !== 'playing' || cur.length !== L) return; setGuesses((g) => [...g, cur]); setCur(''); };
  // Reset returns to the SEED, not to empty — otherwise "play again" drops the
  // visitor back onto the blank board this change exists to remove.
  const reset = () => { setGuesses([FOOTLE_OPENER]); setCur(''); };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><BallIcon size={21} strokeWidth={1.8} /><span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Daily Footle</span></div>
      <div style={{ fontSize: 13.5, color: 'var(--tx3)', marginTop: 4 }}>Guess the mystery footballer in six.</div>
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
        <div style={{ marginTop: 14, padding: 14, background: 'var(--card2)', border: '1px solid var(--bd)', borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{msg}</div>
          <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 5 }}>A fresh Footle drops every day in the app.</div>
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
// 5 famous questions → instant feedback → a Ball IQ. Homepage uses
// skill tiers (per handoff); the /quiz/* landing pages use fan tiers.
function QuizTaster() {
  const [idx, setIdx] = useState(0);
  // Per-question OUTCOMES, not just a tally. The card used to keep a bare
  // count, which a progress bar can render but a scoreboard cannot: a bar says
  // "60% through", pips say "you got 1, 2 and 4 and missed 3". Score is derived
  // from this rather than kept alongside it, so the two cannot drift.
  const [results, setResults] = useState([]);
  const score = results.filter(Boolean).length;
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

  const pick = (i) => { if (answered) return; setPicked(i); setResults((r) => [...r, i === cur.a]); };
  const next = () => { if (idx + 1 >= total) setDone(true); else { setIdx(idx + 1); setPicked(null); setHoverArmed(false); } };
  const reset = () => { setIdx(0); setResults([]); setPicked(null); setDone(false); setHoverArmed(false); };

  const optStyle = (i) => {
    // Longhand border props ONLY — mixing the `border` shorthand with a
    // `borderColor` override made React clear borderColor on the next
    // question while skipping the (string-identical) shorthand, leaving the
    // picked+correct buttons with UA-default BLACK rings that moved around
    // every round (Alex report, computed-style probe confirmed).
    const base = { display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, borderWidth: 1.5, borderStyle: 'solid', borderColor: 'var(--bd)', background: 'var(--card)', color: 'var(--tx2)', fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: answered ? 'default' : 'pointer' };
    if (!answered) return base;
    if (i === cur.a) return { ...base, borderColor: 'rgba(88,204,2,0.55)', background: 'rgba(88,204,2,0.12)', color: '#9BE25C' };
    if (i === picked) return { ...base, borderColor: 'rgba(255,71,71,0.5)', background: 'rgba(255,71,71,0.1)', color: '#FF8A82' };
    return { ...base, opacity: 0.5 };
  };

  const head = (
    <>
      {/* The one palette literal left in this file, on purpose: lucide forwards
          `color` to the SVG as a `stroke` PRESENTATION ATTRIBUTE, and those do
          not support var() — stroke="var(--grn-soft)" resolves to nothing and
          the icon falls back to currentColor. Keep in step with --grn-soft. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Target size={19} strokeWidth={2.4} color="#8AE042" aria-hidden="true" /><span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>What&apos;s your Ball IQ?</span></div>
      <div style={{ fontSize: 13.5, color: 'var(--tx3)', marginTop: 4 }}>Five questions. Then your Ball IQ.</div>
    </>
  );

  if (done) {
    return (
      <div>
        {head}
        <div style={{ textAlign: 'center', padding: '18px 4px 4px' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--amber)' }}>{IQ[score]}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 4 }}>{TIERS[score]}</div>
          <div style={{ fontSize: 13.5, color: 'var(--tx3)', marginTop: 5 }}>You scored {score} / {total}</div>
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
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--tx4)', whiteSpace: 'nowrap' }}>Q {idx + 1} / {total}</span>
        {/* nowrap + flex-shrink:0 — the pill was being squeezed and CLIPPED at
            the card's right edge on a 375px phone (caught in a Playwright
            screenshot of the live site, invisible at desktop width). */}
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: 'var(--grn-soft)', background: 'rgba(88,204,2,0.1)', borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap', flex: '0 0 auto' }}>{score} correct</span>
      </div>
      {/* PIPS, not a bar. Same width, twice the information: position AND the
          outcome of every question so far. Capped deliberately -- see PIP_MAX
          on the generator side; five is well inside it. */}
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }} role="img"
           aria-label={`Question ${idx + 1} of ${total}, ${score} correct so far`}>
        {Array.from({ length: total }, (_, i) => {
          const r = results[i];
          const isNow = i === idx;
          return (
            <span key={i} style={{
              flex: 1, height: 5, borderRadius: 999,
              background: r === true ? 'var(--grn)' : r === false ? 'var(--wrong)' : '#1A1D27',
              boxShadow: isNow && r === undefined ? 'inset 0 0 0 1.5px var(--bd3)' : 'none',
              transition: 'background-color .25s ease',
            }} />
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 17, fontWeight: 800, lineHeight: 1.3, color: '#fff' }}>{cur.q}</div>
      <div style={{ display: 'grid', gap: 9, marginTop: 14 }} onMouseMove={hoverArmed ? undefined : () => setHoverArmed(true)}>
        {cur.opts.map((o, i) => (
          <button key={i} disabled={answered} onClick={() => pick(i)} className={[!answered && hoverArmed ? 'mkt-opt' : '', !answered && i === 0 ? 'mkt-live-hint' : ''].filter(Boolean).join(' ') || undefined} style={optStyle(i)}>
            {/* A/B/C/D badge. The club pages have carried these since launch;
                the homepage taster never did, so four identical grey slabs read
                as a disabled LIST rather than four buttons — at the exact
                moment we are asking a first-time visitor to tap something.
                The badge is the affordance: it says "these are choices". */}
            <span aria-hidden style={{
              flex: '0 0 auto', width: 24, height: 24, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: answered && i === cur.a ? 'rgba(88,204,2,0.9)'
                : answered && i === picked ? 'rgba(255,71,71,0.85)' : '#1A1D27',
              color: answered && (i === cur.a || i === picked) ? 'var(--grn-ink)' : '#8B90A6',
              fontSize: 11.5, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace",
            }}>{'ABCD'[i]}</span>
            <span style={{ flex: 1, minWidth: 0 }}>{o}</span>
            {answered && i === cur.a && <span aria-hidden>✓</span>}
            {answered && i === picked && i !== cur.a && <span aria-hidden>✕</span>}
          </button>
        ))}
      </div>
      {/* THE EXPLANATION. This is the differentiator and until now the homepage
          claimed it nowhere — the taster coloured the options and moved on.
          GSC says the intent that converts is exactly this: "<club> quiz with
          answers" out-converts "<club> quiz" roughly 4x at the SAME position
          (Arsenal 5.3% at 11.1 vs 1.4% at 10.6). So show the reason at the
          moment of maximum attention, right after the tap, rather than
          asserting it in a feature list further down.
          Text is the bank question's own fact-checked `hint` — see TASTE_QS. */}
      {answered && cur.why && (
        <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(88,204,2,0.09)', borderLeft: '3px solid var(--grn)', borderRadius: '0 10px 10px 0' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--grn-soft)', marginBottom: 5 }}>Why</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: '#D6DBE4' }}>{cur.why}</p>
        </div>
      )}
      {answered && <button onClick={next} style={{ width: '100%', marginTop: 14, padding: 13, background: 'var(--grn)', color: 'var(--grn-ink)', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{idx + 1 >= total ? 'See your Ball IQ →' : 'Next →'}</button>}
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
      {/* VERTICAL BUDGET IS THE CONSTRAINT, not the copy length.
          66% of traffic is phones. `.mkt-play-grid` stacks to one column below
          760px, and the MiniFootle card alone is ~636px tall — so on an 844px
          iPhone screen every pixel spent here pushes the playable card further
          out of view, and the QuizTaster (~1074px down) is never seen at all.
          Measured 2026-07-28 against a 100% homepage bounce rate.
          Keep this block TIGHT. Margins here cost conversions. */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginBottom: 20 }}>
        {/* PROOF TICKER. Replaces the "⚽ Free · no sign-up · no download" pill
            rather than sitting beside it, so it costs no vertical space — the
            block comment above is right that margins here cost conversions,
            and the first tappable answer only has ~69px of clearance to the
            812px fold.
            The figures are the SAME real ones the chip row below already used
            (QB_COUNT is build-time injected, the Footle number is computed per
            local day) — they simply weren't visible before a scroll. Numbers a
            competitor cannot fake, delivered before a line of marketing copy.
            Mono + tabular-nums so the digits read as data, not decoration. */}
        {/* THREE cells, not four. Four wrapped at 375px and orphaned the last
            one onto its own centred row — ugly, and the wrap cost ~30px of the
            fold clearance this block has almost none of. "50 clubs" was the
            weakest of the four (the question count already implies breadth). */}
        <div className="mkt-rise mkt-rise-1" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'nowrap', marginBottom: 2 }}>
          {[
            ['FREE', 'no sign-up'],
            // Was the question count, animated up from 0 by useCountUp. Two
            // problems: a visitor cannot tell 6,407 from 600 or 60,000, so the
            // number persuades nobody while handing a competitor a target to
            // beat with a scraped 20,000 -- and the odometer displayed 1,689
            // and 2,996 as fact for ~800ms each on the way. Club count says
            // the same thing (breadth) in a unit a football person feels.
            ['72', 'clubs'],
            [`#${getFootleNumber()}`, 'today'],
          ].map(([v, l], i) => (
            <span key={l} style={{
              display: 'inline-flex', alignItems: 'baseline', gap: 4,
              padding: 'clamp(5px,0.5vw,8px) clamp(11px,1.1vw,18px)', fontSize: 'clamp(11px,1.05vw,14.5px)', whiteSpace: 'nowrap',
              borderLeft: i === 0 ? 'none' : '1px solid var(--bd)',
            }}>
              <b style={{ fontFamily: "'JetBrains Mono','SF Mono',ui-monospace,monospace", fontWeight: 700, color: 'var(--grn-soft)', fontVariantNumeric: 'tabular-nums' }}>{v}</b>
              <span style={{ color: 'var(--tx4)', letterSpacing: '0.03em' }}>{l}</span>
            </span>
          ))}
        </div>
        {/* "Pick your challenge." named no sport, no stake and no reward — on a
            page whose visitors overwhelmingly leave without clicking, the H1 is
            the highest-leverage string on the site. Lead with the question the
            visitor already wants answered about themselves. */}
        {/* Anton, not Inter 900. Inter is the default face of modern software
            and says nothing; Anton is condensed and reads as matchday
            programme / broadcast — instant category recognition. Because it is
            condensed the same words set LARGER in the same space, so the
            clamp ceiling goes 60 -> 68 without costing a pixel of fold.
            Anton is uppercase-native and ships one weight; keep it to display
            only, never body. Loaded on the Google Fonts request already in the
            page, so no new host and no extra round-trip. */}
        <h1 className="mkt-rise mkt-rise-2" style={{ margin: '12px auto 0', maxWidth: 'min(94vw,880px)', fontFamily: "'Anton',Inter,sans-serif", fontSize: 'clamp(38px,6.6vw,68px)', fontWeight: 400, lineHeight: 0.94, letterSpacing: '-0.005em', textTransform: 'uppercase', color: '#fff', textWrap: 'balance' }}>How good is your football knowledge, really?</h1>
        <p className="mkt-rise mkt-rise-3" style={{ margin: '12px auto 0', maxWidth: '42ch', fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.5, color: 'var(--tx3)' }}>Find out in 60 seconds. Play below — nothing to install.</p>
      </div>
      <div className="mkt-play-grid mkt-rise mkt-rise-4" style={{ position: 'relative', zIndex: 2 }}>
        <div className="mkt-play-card"><MiniFootle /></div>
        <div className="mkt-play-card"><QuizTaster /></div>
      </div>
      {/* Social-proof strip — REAL, non-drifting numbers only: QB_COUNT is
          build-time injected, Footle # is computed client-side per local day.
          The middle chip references the app's competitive DAILY, deliberately
          not captioning the MiniFootle taste above (separate 12-word game). */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 26 }}>
        {/* The count said how MANY; this says why they are worth answering,
            which is the thing a scraped competitor cannot copy. "Most" is
            deliberate and measured: 80.9% carry an explanation, so "every"
            would be the false claim we already had to retract once. */}
        <span style={chip({ background: '#1A1D27', border: '1px solid var(--bd2)', color: 'var(--tx)' })}><Brain size={15} strokeWidth={2} /> Fact-checked — and most tell you why</span>
        {/* Links to the page that targets "footle", not to /footle -- that URL
            canonicals to the Footle landing page now, and this chip is the
            homepage's only outbound signal for the term. */}
        <a href="/football-wordle/" style={chip({ background: 'rgba(88,204,2,0.1)', border: '1px solid rgba(88,204,2,0.28)', color: 'var(--grn-soft)', fontWeight: 700 })}><BallIcon size={15} strokeWidth={2} /> Footle #{getFootleNumber()} is live today</a>
        <span style={chip({ background: '#1A1D27', border: '1px solid var(--bd2)', color: 'var(--tx)' })}><Smartphone size={15} strokeWidth={2} /> Free on iPhone + any browser</span>
      </div>
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: 26 }}>
        {/* Was "Get 6,000+ questions in the app". Two faults: it printed the
            count (and a DIFFERENT rounding of it to the 6,407 chip 200px away,
            which reads as two products), and it asked for an install on a page
            whose own hero promises "nothing to install". */}
        <GreenCTA href={GET_APP}>Get the app — free →</GreenCTA>
        {/* "100% free" is accurate today; when Ball IQ Pro ships (2.0 roadmap:
            content stays free, Pro = features/cosmetics), soften to "Free to
            play". "In the app" scoping is mandatory — this page runs AdSense. */}
        <p style={{ margin: '14px auto 0', fontSize: 13, color: 'var(--tx4)' }}>100% free · no ads in the app · iOS &amp; Android</p>
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
  { slug: 'rb-leipzig', label: 'RB Leipzig', badge: 'RBL' },
  { slug: 'atalanta', label: 'Atalanta', badge: 'ATA' },
  { slug: 'hajduk-split', label: 'Hajduk Split', badge: 'HAJ' },
  { slug: 'boca-juniors', label: 'Boca Juniors', badge: 'BOC' },
  { slug: 'river-plate', label: 'River Plate', badge: 'RIV' },
  { slug: 'flamengo', label: 'Flamengo', badge: 'FLA' },
  { slug: 'palmeiras', label: 'Palmeiras', badge: 'PAL' },
  { slug: 'corinthians', label: 'Corinthians', badge: 'COR' },
  { slug: 'santos', label: 'Santos', badge: 'SAN' },
  { slug: 'real-sociedad', label: 'Real Sociedad', badge: 'RSO' },
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
  { slug: 'fenerbahce', label: 'Fenerbahçe', badge: 'FEN' },
  { slug: 'porto', label: 'Porto', badge: 'POR' },
  { slug: 'roma', label: 'Roma', badge: 'ROM' },
  { slug: 'celtic', label: 'Celtic', badge: 'CEL' },
  { slug: 'rangers', label: 'Rangers', badge: 'RAN' },
  { slug: 'marseille', label: 'Marseille', badge: 'OM' },
  { slug: 'feyenoord', label: 'Feyenoord', badge: 'FEY' },
  { slug: 'psv', label: 'PSV', badge: 'PSV' },
  { slug: 'anderlecht', label: 'Anderlecht', badge: 'RSCA' },
  { slug: 'besiktas', label: 'Beşiktaş', badge: 'BJK' },
  { slug: 'trabzonspor', label: 'Trabzonspor', badge: 'TS' },
  { slug: 'club-brugge', label: 'Club Brugge', badge: 'CLU' },
  { slug: 'red-star-belgrade', label: 'Red Star Belgrade', badge: 'CZ' },
  { slug: 'dinamo-zagreb', label: 'Dinamo Zagreb', badge: 'DIN' },
  { slug: 'basel', label: 'FC Basel', badge: 'BAS' },
  { slug: 'nottingham-forest', label: 'Nottingham Forest', badge: 'NFO' },
  { slug: 'aston-villa', label: 'Aston Villa', badge: 'AVL' },
  { slug: 'everton', label: 'Everton', badge: 'EVE' },
  { slug: 'leeds-united', label: 'Leeds United', badge: 'LEE' },
  { slug: 'west-ham', label: 'West Ham', badge: 'WHU' },
  { slug: 'sunderland', label: 'Sunderland', badge: 'SUN' },
  { slug: 'bournemouth', label: 'Bournemouth', badge: 'BOU' },
  { slug: 'brentford', label: 'Brentford', badge: 'BRE' },
  { slug: 'burnley', label: 'Burnley', badge: 'BUR' },
  { slug: 'wolves', label: 'Wolves', badge: 'WOL' },
  { slug: 'coventry', label: 'Coventry City', badge: 'COV' },
  { slug: 'hull-city', label: 'Hull City', badge: 'HUL' },
  { slug: 'ipswich', label: 'Ipswich Town', badge: 'IPS' },
  { slug: 'crystal-palace', label: 'Crystal Palace', badge: 'CRY' },
  { slug: 'fulham', label: 'Fulham', badge: 'FUL' },
  { slug: 'brighton', label: 'Brighton', badge: 'BHA' },
  { slug: 'athletic-bilbao', label: 'Athletic Bilbao', badge: 'ATH' },
  { slug: 'sevilla', label: 'Sevilla', badge: 'SEV' },
  { slug: 'real-betis', label: 'Real Betis', badge: 'BET' },
  { slug: 'schalke-04', label: 'Schalke 04', badge: 'S04' },
  { slug: 'hamburger-sv', label: 'Hamburger SV', badge: 'HSV' },
  { slug: 'fiorentina', label: 'Fiorentina', badge: 'FIO' },
  { slug: 'lazio', label: 'Lazio', badge: 'LAZ' },
  { slug: 'torino', label: 'Torino', badge: 'TOR' },
  { slug: 'sporting-cp', label: 'Sporting CP', badge: 'SCP' },
  { slug: 'saint-etienne', label: 'Saint-Étienne', badge: 'ASSE' },
  { slug: 'valencia', label: 'Valencia', badge: 'VAL' },
  { slug: 'bayer-leverkusen', label: 'Bayer Leverkusen', badge: 'B04' },
  { slug: 'lyon', label: 'Lyon', badge: 'OL' },
  { slug: 'parma', label: 'Parma', badge: 'PAR' },
  { slug: 'monaco', label: 'AS Monaco', badge: 'ASM' },
];
// Leagues get the SAME coloured-badge treatment as clubs, not flag emoji.
// Flags rendered differently on every OS, and they were the wrong metaphor
// anyway -- the Champions League and the Euros are not countries. Codes read
// at a glance and the badge inherits the contrast-safe ink from badgeColors().
const QUIZ_LEAGUES = [
  { slug: 'premier-league', label: 'Premier League', badge: 'EPL', color: '#3D195B' },
  { slug: 'la-liga', label: 'La Liga', badge: 'LAL', color: '#EE8707' },
  { slug: 'serie-a', label: 'Serie A', badge: 'SEA', color: '#0B5CAB' },
  { slug: 'bundesliga', label: 'Bundesliga', badge: 'BUN', color: '#D20515' },
  { slug: 'ligue-1', label: 'Ligue 1', badge: 'LI1', color: '#DAE025' },
  { slug: 'super-lig', label: 'Süper Lig', badge: 'SUP', color: '#E30613' },
  { slug: 'primeira-liga', label: 'Primeira Liga', badge: 'PRI', color: '#036D3A' },
  { slug: 'champions-league', label: 'Champions League', badge: 'UCL', color: '#0E1E5B' },
  { slug: 'euros', label: 'Euros', badge: 'EUR', color: '#00B2A9' },
  { slug: 'world-cup', label: 'World Cup', badge: 'WC', color: '#7A263A' },
];

// Club brand colours (mirror the app CLUB_PACKS + the /quiz SEO badges) for
// badge tinting. Light shirts (Real Madrid white, Dortmund yellow) get dark
// text via readableOn(); a hairline border keeps dark badges legible.
const CLUB_COLOR = {
  'rb-leipzig': '#DD0741', 'atalanta': '#1D71B8',
  'hajduk-split': '#0E4C92',
  'boca-juniors': '#0A2B72', 'river-plate': '#E1122E', 'flamengo': '#C52613', 'palmeiras': '#006437', 'corinthians': '#111111',
  'santos': '#0B0B0B', 'real-sociedad': '#0067B1',
  'manchester-united': '#DA291C', arsenal: '#EF0107', 'manchester-city': '#6CABDD',
  liverpool: '#C8102E', chelsea: '#034694', tottenham: '#132257', newcastle: '#241F20',
  barcelona: '#A50044', 'real-madrid': '#FFFFFF', 'atletico-madrid': '#CB3524',
  juventus: '#000000', 'inter-milan': '#010E80', 'ac-milan': '#FB090B',
  'bayern-munich': '#DC052D', 'borussia-dortmund': '#FDE100', psg: '#003170', ajax: '#CC0000',
  napoli: '#12A0D7', galatasaray: '#A90432', benfica: '#E32221',
  fenerbahce: '#163962', porto: '#00428C', roma: '#8E1F2F',
  celtic: '#018749', rangers: '#1B458F', marseille: '#2FAEE0',
  feyenoord: '#DA020E', psv: '#ED1C24', anderlecht: '#52247F',
  besiktas: '#000000', trabzonspor: '#7B1E3C', 'club-brugge': '#0A4595',
  'red-star-belgrade': '#E4002B', 'dinamo-zagreb': '#1B458F', basel: '#002D62',
  'nottingham-forest': '#E53233', 'aston-villa': '#670E36', everton: '#003399',
  'leeds-united': '#1D428A', 'west-ham': '#7A263A',
  sunderland: '#EB172B', ipswich: '#3A64A3', 'crystal-palace': '#1B458F', fulham: '#E6E6E6', brighton: '#0057B8',
  bournemouth: '#DA291C', brentford: '#E30613', burnley: '#6C1D45', wolves: '#FDB913',
  coventry: '#059DD9', 'hull-city': '#F18A01',
  'athletic-bilbao': '#EE2523', sevilla: '#CB0007', 'real-betis': '#00954C',
  'schalke-04': '#004E9E', 'hamburger-sv': '#0A3A7A',
  fiorentina: '#592C82', lazio: '#87D8F7', torino: '#8A1E12',
  'sporting-cp': '#008056', 'saint-etienne': '#009E60',
  valencia: '#F18E00', 'bayer-leverkusen': '#E32221', lyon: '#3D74C4',
  parma: '#F5D800', monaco: '#DA291C',
};
// Mirrors badgeColors() in scripts/gen-seo-pages.mjs — keep the two in step.
// A YIQ brightness test used to pick the text colour here and got 11 of 61
// clubs wrong (Napoli's blue took white at 2.98:1). The badge text is 12px, so
// WCAG 1.4.3 wants 4.5:1; club colours are brand data, so only lightness moves.
const srgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const relLum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrastRatio = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const WHITE = [255, 255, 255], INK = [10, 10, 10];
const toHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

function badgeColors(hex) {
  let bg = srgb(hex);
  const fg = contrastRatio(bg, WHITE) >= contrastRatio(bg, INK) ? WHITE : INK;
  const target = fg === WHITE ? 0 : 255;
  for (let i = 0; i < 40 && contrastRatio(bg, fg) < 4.5; i++) {
    bg = bg.map((v) => v + (target - v) * 0.04);
  }
  return { background: toHex(bg), color: toHex(fg) };
}

function QuizTile({ href, badge, emoji, label, color }) {
  const badgeStyle = emoji
    ? { background: 'transparent', fontSize: 22 }
    : color
      ? { ...badgeColors(color), border: '1px solid rgba(255,255,255,0.16)' }
      : undefined;
  return (
    <a href={href} className="mkt-qtile">
      <span className="mkt-qbadge" style={badgeStyle}>{emoji || badge}</span>
      <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--tx)' }}>{label}</span>
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
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tx4)', margin: '0 2px 12px' }}>Clubs</div>
      <div className="mkt-qgrid">
        {QUIZ_CLUBS.map((c) => <QuizTile key={c.slug} href={`/quiz/${c.slug}/`} badge={c.badge} label={c.label} color={CLUB_COLOR[c.slug]} />)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tx4)', margin: '26px 2px 12px' }}>Leagues &amp; cups</div>
      <div className="mkt-qgrid">
        {QUIZ_LEAGUES.map((l) => <QuizTile key={l.slug} href={`/quiz/${l.slug}/`} badge={l.badge} color={l.color} label={l.label} />)}
        <a href="/quiz/" className="mkt-qtile mkt-qtile-all"><span style={{ fontSize: 14, fontWeight: 800, color: 'var(--grn-soft)' }}>All quizzes →</span></a>
      </div>
    </section>
  );
}

/* THE BALL. Lucide 0.383 has no football, and the substitutes are all wrong:
   Dribbble is a brand logo, CircleDot is a target, Goal is a signpost. On a
   football product the ball is the one icon that must not be an approximation,
   so it is drawn here on Lucide's own 24x24 grid, inheriting currentColor and
   the same stroke weight, and therefore sits in the set rather than beside it. */
const BallIcon = ({ size = 24, strokeWidth = 1.6, ...rest }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}
  >
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 6.6 15.9 9.4 14.4 14h-4.8L8.1 9.4z" />
    <path d="M12 6.6V2.9M15.9 9.4l3.5-1.2M14.4 14l2.2 3M9.6 14l-2.2 3M8.1 9.4 4.6 8.2" />
  </svg>
);

/* Emoji are gone from the UI. They rendered as a different illustration on
   every OS -- so the brand literally looked different on macOS, Windows and
   Android -- could not inherit the accent, could not be sized to the grid, and
   carried the visual register of a Slack message. After the hero itself this
   was the loudest "built fast" signal on the page and much the cheapest to fix.
   One stroked set, 1.5-1.6px, sized on the 4px grid, all currentColor. */
const MODES = [
  { Icon: ClipboardList, tint: 'rgba(255,193,7,0.12)', name: 'Daily 7', sub: 'Seven questions, ~3 min.' },
  { Icon: BallIcon,      tint: 'rgba(88,204,2,0.12)',  name: 'Footle', sub: 'Guess the surname in six.' },
  { Icon: Swords,        tint: 'rgba(88,204,2,0.12)',  name: 'Online', sub: 'Up to 8 players, live.' },
  { Icon: Timer,         tint: 'rgba(88,204,2,0.12)',  name: 'Classic', sub: '10 questions, 20s each.' },
  { Icon: Flame,         tint: 'rgba(255,106,0,0.12)', name: 'Survival', sub: 'One wrong answer ends it.' },
  { Icon: Zap,           tint: 'rgba(255,193,7,0.12)', name: 'Hot Streak', sub: '60-second sprint.' },
  { Icon: Trophy,        tint: 'rgba(88,204,2,0.12)',  name: 'Legends', sub: 'Pre-2000 greats.' },
  { Icon: Users,         tint: 'rgba(88,204,2,0.12)',  name: 'Local', sub: 'Pass & play on one device.' },
];

const FAQS = [
  { q: 'Is Ball IQ free?', a: 'Yes — 100% free, and the app shows no ads. Guests can jump straight into solo and local games, no account needed.' },
  { q: 'Do I need an account?', a: 'No. Play as a guest, or sign up to play online with up to 8 friends, save your streak, and build your profile card and leaderboard rank.' },
  { q: "What's Footle?", a: "Our daily Wordle-style game: guess the footballer's surname in six tries. A fresh one drops every day." },
  { q: 'Can I play with friends?', a: 'Absolutely — race friends in real time online, or pass-and-play locally on a single device.' },
  // Said "a native Android app is on the way" while a Google Play button sat
  // in the footer of the same page. Android went live 2026-07-30; the line
  // outlived the release. Stale copy contradicting a live link on the same
  // screen is the cheapest possible way to look unmaintained.
  { q: 'Where can I play?', a: 'On iPhone via the App Store, on Android via Google Play, or instantly in your browser at balliq.app — no install, no account. Your progress follows your account across all three.' },
];

function Brand({ size = 20, imgSize = 32 }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src={BALL} alt="Ball IQ" width={imgSize} height={imgSize} style={{ width: imgSize, height: imgSize, borderRadius: 8 }} />
      <span style={{ fontWeight: 900, fontSize: size, letterSpacing: '-0.02em', color: '#fff' }}>Ball&nbsp;<span style={{ color: 'var(--amber)' }}>IQ</span></span>
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

  // ── MOBILE NAV ───────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    // Escape closes, and focus returns to the button that opened it — without
    // that return, a keyboard user is dumped back at the top of the document.
    const onKey = (e) => { if (e.key === 'Escape') { setMenuOpen(false); burgerRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    // Lock the page behind the drawer. The homepage is ~10,900px tall, so
    // without this the body scrolls under the panel while the drawer is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  return (
    <div className="mkt">
      <style>{STYLE}</style>

      {/* WCAG 2.4.1 (Level A) — six nav controls sit before the content on every
          load; a keyboard user had no way past them. Visible only on focus. */}
      <a href="#mkt-main" className="mkt-skip">Skip to content</a>

      {/* ── NAV ── */}
      <nav className="mkt-nav" style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid #16181F' }}>
        <a href="/"><Brand /></a>
        <div className="mkt-nav-links" style={{ display: 'flex', alignItems: 'center' }}>
          <a href="#quizzes" className="mkt-link mkt-nav-sec">Quizzes</a>
          <a href="/lists/" className="mkt-link mkt-nav-sec">Records</a>
          <a href="#modes" className="mkt-link mkt-nav-sec">Modes</a>
          <a href="#faq" className="mkt-link mkt-nav-sec">FAQ</a>
          {/* PRIMARY is "Play free", not "Get the app". The page's whole
              proposition is "no sign-up, no download, play here" — making the
              dominant header click an off-site App Store trip contradicts it,
              and an install is a far bigger ask than a tap from someone who
              has not played yet. 2026 conversion research is explicit: short
              pages convert ~17% better with ONE above-fold primary plus a
              low-friction secondary, and "too many CTA types early confuse
              intent". The install ask survives lower down, at the moment it is
              earned ("Get 6,000+ questions in the app"). */}
          <GreenCTA href={PLAY} className="mkt-nav-cta">Play free</GreenCTA>
          <a href={GET_APP} className="mkt-nav-play mkt-nav-cta">Get the app</a>
          {/* Mobile only (CSS). Before this the four nav links simply vanished
              below 640px with nothing to reach them by. */}
          <button
            ref={burgerRef}
            type="button"
            className="mkt-burger"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mkt-drawer"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={22} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── rendered only when open so it never sits in the
          a11y tree or tab order on desktop. */}
      {menuOpen && (
        <>
          <div
            className="mkt-drawer-scrim"
            data-open="1"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mkt-drawer"
            className="mkt-drawer"
            data-open="1"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="mkt-drawer-top">
              <Brand size={18} imgSize={28} />
              <button
                type="button"
                className="mkt-drawer-close"
                aria-label="Close menu"
                onClick={() => { setMenuOpen(false); burgerRef.current?.focus(); }}
                autoFocus
              >
                <X size={22} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            <a href="#quizzes" onClick={() => setMenuOpen(false)}>Quizzes</a>
            <a href="/lists/">Record books</a>
            <a href="#modes" onClick={() => setMenuOpen(false)}>Game modes</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <div className="mkt-drawer-sep" />
            {/* Real destinations, not just in-page anchors — the drawer is the
                only route a phone user has to the rest of the site. */}
            <a href="/quiz/">All 72 club quizzes</a>
            <a href="/football-wordle/">Footle</a>
            <a href="/about/">About</a>
            <a href="/contact/">Contact</a>
            <a className="mkt-drawer-cta" href={PLAY}>Play free</a>
            <a className="mkt-drawer-app" href={GET_APP}>Get the app</a>
          </div>
        </>
      )}

      {/* WCAG 1.3.1 — the SEO pages all have <main>; this one never did. */}
      <main id="mkt-main">

      {/* ── HERO — the playable Footle + quiz taster ARE the front door ── */}
      <PlayNow />

      {/* ── BROWSE QUIZZES — club/league landing-page mesh (SEO + funnel) ── */}
      <QuizGrid />

      {/* ── TICKER ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid #16181F', borderBottom: '1px solid #16181F', background: 'var(--bg2)', padding: '16px 0' }}>
        <div className="mkt-marquee" style={{ display: 'flex', width: 'max-content', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--tx4)', whiteSpace: 'nowrap' }}>
          {[0, 1].map((i) => (
            <span key={i}>
              {['Every club, Real Madrid to Hajduk Split', '10 Game modes', 'Daily 7', 'Footle', 'Up to 8 online', 'Survival', 'Hot Streak', 'Legends'].map((t, j) => (
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
              <span style={chip({ background: '#1A1D27', border: '1px solid var(--bd2)', color: 'var(--tx)' })}><BallIcon size={15} strokeWidth={2} /> Footle</span>
              <span style={chip({ background: '#1A1D27', border: '1px solid var(--bd2)', color: 'var(--tx)' })}><ClipboardList size={15} strokeWidth={2} /> Daily 7</span>
              <span style={chip({ background: 'rgba(255,106,0,0.12)', border: '1px solid rgba(255,106,0,0.3)', color: '#FF9245', fontWeight: 700 })}><Flame size={15} strokeWidth={2} /> Streaks</span>
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
            <div style={eyebrow('var(--grn)')}>Multiplayer</div>
            <h2 style={h2Style}>Race real players,<br />in real time.</h2>
            <p style={bodyStyle}>Match up with up to eight players online, or pass and play locally — same questions, live scores, and a podium at the final whistle.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <span style={chip({ background: 'rgba(88,204,2,0.1)', border: '1px solid rgba(88,204,2,0.28)', color: 'var(--grn-soft)', fontWeight: 700 })}><Swords size={15} strokeWidth={2} /> Online · up to 8</span>
              <span style={chip({ background: '#1A1D27', border: '1px solid var(--bd2)', color: 'var(--tx)' })}><Users size={15} strokeWidth={2} /> Local · up to 6</span>
            </div>
          </div>
        </Reveal>

        {/* F3 — Profile */}
        <Reveal style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 48 }}>
          <div style={{ flex: '1 1 320px', minWidth: 300 }}>
            <div style={eyebrow('var(--amber)')}>Your profile</div>
            <h2 style={h2Style}>Your football brain,<br />scored like an IQ.</h2>
            <p style={bodyStyle}>Every answer feeds your player card — one rating on a 60 to 160 scale, broken down league by league. Read your scouting report, find your specialism, and share the card.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <span style={chip({ background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.3)', color: '#FFD24A', fontWeight: 700 })}><Star size={15} strokeWidth={2} /> OVERALL rating</span>
              <span style={chip({ background: '#1A1D27', border: '1px solid var(--bd2)', color: 'var(--tx)' })}><Search size={15} strokeWidth={2} /> Scouting report</span>
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
          {/* Was "10 game modes" above a grid of EIGHT cards. Either show ten
              or do not claim ten; a number a visitor can disprove by counting
              is worse than no number. Dropped rather than padded, because the
              eight shown are the eight worth showing. */}
          <div style={eyebrow('var(--tx3)')}>Game modes</div>
          <h2 style={{ margin: '12px 0 0', fontSize: 'clamp(30px,4.4vw,46px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>Pick your battle.</h2>
        </Reveal>
        <Reveal style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
          {MODES.map((m) => (
            <a key={m.name} href={PLAY} className="mkt-mode" style={{ padding: 22, background: 'var(--card2)', border: '1px solid var(--bd)', borderRadius: 18, display: 'block' }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: m.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C7F59B' }}><m.Icon size={23} strokeWidth={1.6} /></div>
              <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800, color: '#fff' }}>{m.name}</div>
              <div style={{ marginTop: 4, fontSize: 14, color: 'var(--tx3)' }}>{m.sub}</div>
            </a>
          ))}
        </Reveal>
      </section>

      {/* ── DAILY BAND ── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px 90px' }}>
        <Reveal style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(32px,5vw,56px)', background: 'linear-gradient(120deg,#FF6A00 0%,var(--amber) 100%)' }}>
          <div style={{ position: 'absolute', right: -30, bottom: -50, opacity: 0.16, pointerEvents: 'none', color: 'var(--bg)' }} aria-hidden="true"><Flame size={240} strokeWidth={1.1} /></div>
          <div style={{ position: 'relative', maxWidth: '30ch' }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.85)' }}>Daily 7</div>
            <div style={{ marginTop: 12, fontSize: 'clamp(26px,3.4vw,38px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', color: 'var(--bg)' }}>Seven questions. Three minutes. Everyone plays the same set.</div>
            <a href={PLAY} className="mkt-cta-black" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '14px 26px', background: 'var(--bg)', color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 12, boxShadow: '0 10px 26px -8px rgba(0,0,0,0.6)' }}>Play today's set →</a>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ maxWidth: 760, margin: '0 auto', padding: '20px 24px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={eyebrow('var(--tx3)')}>FAQ</div>
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
                  <span style={{ flexShrink: 0, fontSize: 22, lineHeight: 1, color: open ? 'var(--grn)' : 'var(--tx3)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .25s cubic-bezier(.34,1.56,.64,1), color .2s' }}>+</span>
                </button>
                <div style={{ maxHeight: open ? 200 : 0, opacity: open ? 1 : 0, overflow: 'hidden', transition: 'max-height .3s ease, opacity .3s ease' }}>
                  <p style={{ margin: '0 2px', paddingBottom: 22, color: 'var(--tx3)', fontSize: 15.5, lineHeight: 1.65 }}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid #16181F', background: 'var(--bg2)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '56px 24px 40px', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 320 }}>
            <Brand size={19} imgSize={30} />
            <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6, color: 'var(--tx4)' }}>{'The ultimate football quiz. Ten game modes, seventy-two clubs, and a new one every morning — solo, with friends, or against up to eight players online. Free to play, no ads in the app.'}</p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}><AppStoreBadge small /><PlayStoreBadge small /></div>
          </div>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tx4)', marginBottom: 16 }}>Quizzes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <a href="/quiz/" className="mkt-foot-link">Football quizzes</a>
                <a href="/quiz/world-cup/" className="mkt-foot-link">World Cup quiz</a>
                <a href="/quiz/premier-league/" className="mkt-foot-link">Premier League quiz</a>
                <a href="/quiz/champions-league/" className="mkt-foot-link">Champions League quiz</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tx4)', marginBottom: 16 }}>Club quizzes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <a href="/quiz/arsenal/" className="mkt-foot-link">Arsenal quiz</a>
                <a href="/quiz/liverpool/" className="mkt-foot-link">Liverpool quiz</a>
                <a href="/quiz/manchester-united/" className="mkt-foot-link">Man United quiz</a>
                <a href="/quiz/real-madrid/" className="mkt-foot-link">Real Madrid quiz</a>
                <a href="/quiz/barcelona/" className="mkt-foot-link">Barcelona quiz</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tx4)', marginBottom: 16 }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <a href="/about/" className="mkt-foot-link">About</a>
                <a href="/contact/" className="mkt-foot-link">Contact</a>
                <a href="/privacy.html" className="mkt-foot-link">Privacy</a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 24px 36px', borderTop: '1px solid #16181F', fontSize: 13, color: 'var(--tx4)' }}>© 2026 Ball IQ. The ultimate football quiz.</div>
      </footer>
    </div>
  );
}
