// ── THE FRONT DOOR — balliq.app/ ──────────────────────────────────────────────
// A WEBSITE, not an app screen (Alex, 2026-09-03, on seeing the app shell at
// "/": "it looks like a copy of the app itself… designed for an app"). Built
// from a field study of 13 quiz and sports-puzzle sites (memory:
// project_quiz_sites_field_study). The three things that separated a website
// from an app screen in that study, and the blocks that carry them here:
//   1. It says what day it is            → the date line, edition numbers, a
//                                          countdown, "N of 4 played today".
//   2. Everything is on the page, linked → today's four as cards, every mode
//                                          as a card, every club and league
//                                          and list as a link, a sitemap footer.
//   3. (Other people — PARKED by Alex until the user base is bigger. No fake
//       counts, no "trending".)
// Rules from the same study: one-row header with search and NO marketing
// button (none of the 13 has one); 0–2 sentences above the fold; app badges in
// the footer only; the browser owns the scroll; one accent (the brand green)
// spent on Play and on "correct", nothing else.
//
// Nothing here imports the game bundle. Clubs come from the generated
// clubIndex.js, lists from the generated listsIndex.js, edition numbers from
// the tiny pure-math libs. Every daily Play is a URL into the app at /play, which
// App.jsx's boot handles (?game=… / ?club=… / ?quiz=…) and which bypasses
// onboarding for a visitor who has already chosen a game.
// Clubs are the exception since 2026-09-05: a club tile goes to the club's own
// page, /quiz/<slug>/, because that page IS the club quiz on the web. The
// critique of that day found the same club reachable as two products — tile →
// app, every other link → page — and Alex decided to retire the web /play game
// routes rather than keep both.
import '../design/report.css';
import '../design/front.css';
import React, { useState, useEffect, useMemo } from 'react';
import { SiteHeader } from './SiteHeader.jsx';
import { DISCOVER, MORE } from './siteNav.js';
import { CLUB_INDEX } from './clubIndex.js';
import { LISTS_INDEX } from './listsIndex.js';
import { getFootleNumber } from '../lib/footleNumber.js';
import { getTrailNumber, loadTrailDay } from '../lib/trail.js';
import { mysteryNumber, MYSTERY_ENABLED, loadMysteryResult } from '../lib/mysteryPlayer.js';
import { readWordleTodayStatus, getWordleDateKey } from '../lib/wordleStatus.js';
import { getWordleAnswer, gradeWordleGuess, getWordleDayIndex } from '../lib/wordle.js';
// The app's teaser picker, reused rather than re-invented: it is exported so
// the no-spoiler property can be tested against the real schedule.
import { pickTeaserPair } from '../components/FootleHero.jsx';
import { MODE_ACCENT } from '../lib/accents.js';
import { FP_NUMBER } from './footlePractice.js';
import { keyForDate, msToNextLocalMidnight, formatCountdown } from '../lib/date.js';
import { PLAY_STORE_URL, appStoreUrl } from '../lib/links.js';
import { marketingEvent } from '../lib/marketingEvent.js';
import FootleBand from './FootleBand.jsx';

const PLAY = '/play';
const door = (game) => `${PLAY}?game=${game}`;

// Leagues with a static page each (scripts/seo/leagues.mjs slugs).
export const LEAGUES = [
  { s: 'premier-league', n: 'Premier League' }, { s: 'la-liga', n: 'La Liga' },
  { s: 'serie-a', n: 'Serie A' }, { s: 'bundesliga', n: 'Bundesliga' },
  { s: 'ligue-1', n: 'Ligue 1' }, { s: 'super-lig', n: 'Süper Lig' },
  { s: 'primeira-liga', n: 'Primeira Liga' }, { s: 'champions-league', n: 'Champions League' },
  { s: 'world-cup', n: 'World Cup' }, { s: 'euros', n: 'Euros' },
];

// The clubs people actually play, in 30-day order (club_quiz_results,
// 2026-09-03: Arsenal 113 … PSG 11). The rest are one tap away.
const MOST_PLAYED = ['arsenal', 'liverpool', 'barcelona', 'chelsea', 'manchester-city', 'real-madrid', 'everton',
  'tottenham', 'celtic', 'leeds-united', 'rangers', 'besiktas', 'newcastle', 'manchester-united', 'psg', 'bayern-munich'];

// Every mode as a card. `line` is one line, never a sentence about us.
const GAMES = [
  { k: 'footle', n: 'Footle', line: 'Guess the surname in six', href: door('footle'), daily: true },
  { k: 'daily', n: 'Daily 7', line: 'Seven questions, the same for everyone', href: door('daily'), daily: true },
  { k: 'trail', n: 'Transfer Trail', line: 'Follow the moves, name the player', href: door('trail'), daily: true },
  { k: 'mystery', n: 'Mystery Player', line: 'Guess who from career clues', href: door('mystery'), daily: true },
  { k: 'clubquiz', n: 'Club Quiz', line: 'Pick your club, ten on them', href: door('clubquiz') },
  { k: 'leaguequiz', n: 'League Quiz', line: 'One competition, its history', href: door('leaguequiz') },
  { k: 'classic', n: 'Classic', line: 'Ten questions, twenty seconds each', href: door('classic') },
  { k: 'survival', n: 'Survival', line: 'One wrong answer and it ends', href: door('survival') },
  { k: 'hotstreak', n: 'Hot Streak', line: 'Sixty seconds, as many as you can', href: door('hotstreak') },
  { k: 'stadiums', n: 'Stadiums', line: 'Name every ground in the league', href: door('stadiums') },
  { k: 'lineup', n: 'Guess the XI', line: 'Name the line-up from a famous match', href: '/xi/' },
  { k: 'legends', n: 'Legends', line: 'Pre-2000 greats only', href: door('legends') },
  { k: 'chaos', n: 'Chaos', line: 'Quotes, nicknames and the rest', href: door('chaos') },
  { k: 'online', n: 'Play a friend', line: 'Live rooms, up to eight of you', href: door('online') },
];

// Stroke icons, one style, 20px grid. Never emoji.
const Icon = ({ k }) => {
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  switch (k) {
    case 'footle': return <svg {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
    case 'daily': return <svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></svg>;
    case 'trail': return <svg {...p}><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h6a4 4 0 0 1 0 8h-2a4 4 0 0 0 0 8h6" /></svg>;
    case 'mystery': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /><path d="M17 3l1.5 1.5" /></svg>;
    case 'clubquiz': return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>;
    case 'leaguequiz': return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /></svg>;
    case 'classic': return <svg {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></svg>;
    case 'survival': return <svg {...p}><path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" /></svg>;
    case 'hotstreak': return <svg {...p}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4 1-6 1-9z" /></svg>;
    case 'stadiums': return <svg {...p}><ellipse cx="12" cy="12" rx="9" ry="5" /><path d="M3 12v3c0 2.8 4 5 9 5s9-2.2 9-5v-3" /></svg>;
    case 'lineup': return <svg {...p}><rect x="3" y="3" width="18" height="18" /><path d="M3 12h18M12 3v18" /><circle cx="12" cy="12" r="2.5" /></svg>;
    case 'legends': return <svg {...p}><path d="M6 3h12v6a6 6 0 0 1-12 0z" /><path d="M9 21h6M12 15v6" /></svg>;
    case 'chaos': return <svg {...p}><path d="M12 3l2 5 5 1-4 3.5 1.5 5.5L12 15l-4.5 3 1.5-5.5L5 9l5-1z" /></svg>;
    case 'online': return <svg {...p}><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 8 0" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
    case 'list': return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    default: return null;
  }
};

const fmtDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtVerified = (ymd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || '');
  if (!m) return '';
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
};

// Today's four, read from the same localStorage the app writes. Guests
// included — every daily persists locally before any account exists.
function readToday() {
  const out = { footle: 'new', daily: 'new', trail: 'new', mystery: 'new', dailyScore: null };
  try {
    const ws = readWordleTodayStatus();
    out.footle = ws.kind === 'won' ? 'done' : ws.kind === 'lost' ? 'done' : ws.kind === 'in-progress' ? 'open' : 'new';
    out.footleWon = ws.kind === 'won';
  } catch {}
  try {
    const raw = localStorage.getItem(keyForDate(new Date()));
    if (raw) { const p = JSON.parse(raw); if (p && typeof p.score === 'number') { out.daily = 'done'; out.dailyScore = p.score; } }
  } catch {}
  try { const t = loadTrailDay?.(); if (t && ['won', 'lost'].includes(t.status)) out.trail = 'done'; else if (t && t.status) out.trail = 'open'; } catch {}
  try { if (loadMysteryResult?.(new Date())?.won) out.mystery = 'done'; } catch {}
  return out;
}

// The lead card's board is the player's REAL board — the same guesses the game
// stores under biq_wordle_<date>, graded the same way. A newcomer sees six
// empty rows and a ringed first tile; a returning player sees their colours.
// It is a picture of today, which is why Footle leads the block: a quiz card
// cannot be a picture, a board can (2026-09-04, Today A/B — Alex chose B).
const BOARD_ROWS = 6;
function readFootleBoard(today) {
  let answer = '';
  try { answer = getWordleAnswer(today) || ''; } catch {}
  let guesses = [];
  try {
    const raw = localStorage.getItem(`biq_wordle_${getWordleDateKey(today)}`);
    const p = raw ? JSON.parse(raw) : null;
    if (p && Array.isArray(p.guesses)) guesses = p.guesses.filter((g) => typeof g === 'string');
  } catch {}
  // ⚠️ A NEWCOMER SAW FORTY-TWO EMPTY OUTLINES. Alex, 2026-09-04, on the live
  // homepage: the lead card "looks assembled and not designed… it does not have
  // the green and yellow explainer", and hitting Play revealed a Footle screen
  // "way superior to that one on the website homepage itself". He is right: with
  // no guesses stored, every cell here resolved to '' and the card led with a
  // blank wireframe — on the one surface that has to explain the game to someone
  // who has never played it.
  //
  // The app already solved this and the website ignored it. FootleHero shows a
  // worked example: a guess and the answer, graded green/amber/grey by the REAL
  // engine so the demonstrated rules cannot drift from the game's, rotated daily
  // and checked against today's answer so it can never spoil. pickTeaserPair is
  // exported precisely so that no-spoiler property is testable rather than
  // asserted. Same function, same day index — the two surfaces now teach the
  // same lesson with the same colours instead of disagreeing about what Footle
  // looks like.
  if (!guesses.length) {
    const [g, a] = pickTeaserPair(getWordleDayIndex(today), answer);
    // ⚠️ WITH MARKS BUT NO LETTERS this is abstract colour swatches, which reads
    // as a loading state rather than a word game — arguably worse than the blank
    // grid it replaced. The letters are the whole point: they show a guess being
    // scored against an answer, which is the rule the card has to teach.
    return {
      rows: [g, a].map((word) => Array.from(gradeWordleGuess(word, a)).map((m, i) => ({ m, ch: word[i] }))),
      len: a.length,
      teaser: true,
    };
  }
  const len = answer.length || 6;
  const rows = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    const g = guesses[r];
    if (g && answer) {
      const up = g.toUpperCase();
      const marks = gradeWordleGuess(up, answer);
      rows.push(Array.from({ length: len }, (_, i) => ({ m: marks[i] || 'grey', ch: up[i] || '' })));
    } else {
      rows.push(Array.from({ length: len }, (_, i) => ({ m: r === guesses.length && i === 0 ? 'cur' : '', ch: '' })));
    }
  }
  return { rows, len };
}

function useCountdown() {
  const [ms, setMs] = useState(() => msToNextLocalMidnight());
  useEffect(() => { const t = setInterval(() => setMs(msToNextLocalMidnight()), 1000); return () => clearInterval(t); }, []);
  return formatCountdown(ms);
}

export default function FrontDoor() {
  const today = useMemo(() => new Date(), []);
  const [state, setState] = useState(() => readToday());
  const [board, setBoard] = useState(() => readFootleBoard(today));
  useEffect(() => { setState(readToday()); setBoard(readFootleBoard(today)); }, [today]);
  // The practice board (an archive puzzle, nothing about today's given away)
  // used to be its own section under Today — a second Footle door on one
  // page. It now opens from the lead card, on request.
  const [practice, setPractice] = useState(false);
  const togglePractice = () => { setPractice((p) => !p); go(practice ? 'fd-practice-close' : 'fd-practice-open'); };
  const countdown = useCountdown();
  const [allClubs, setAllClubs] = useState(false);

  useEffect(() => { marketingEvent('fd-view'); }, []);
  const go = (name, href) => { try { marketingEvent(name, { href }); } catch {} };

  const dailies = [
    { k: 'footle', n: 'Footle', no: getFootleNumber(today), line: 'Guess the surname in six', st: state.footle, done: state.footle === 'done', doneText: state.footleWon ? 'Solved' : 'Played', href: door('footle') },
    { k: 'daily', n: 'Daily 7', no: null, line: 'Seven questions, the same for everyone', st: state.daily, done: state.daily === 'done', doneText: state.dailyScore != null ? `${state.dailyScore} of 7` : 'Played', href: door('daily') },
    { k: 'trail', n: 'Transfer Trail', no: getTrailNumber(today), line: 'Follow the moves, name the player', st: state.trail, done: state.trail === 'done', doneText: 'Played', href: door('trail') },
    ...(MYSTERY_ENABLED ? [{ k: 'mystery', n: 'Mystery Player', no: mysteryNumber(today), line: 'Guess who from career clues', st: state.mystery, done: state.mystery === 'done', doneText: 'Solved', href: door('mystery') }] : []),
  ];
  const playedCount = dailies.filter((d) => d.done).length;

  const byLeague = useMemo(() => {
    const m = new Map();
    for (const c of CLUB_INDEX) { if (!m.has(c.c)) m.set(c.c, []); m.get(c.c).push(c); }
    const order = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Championship'];
    const rank = (k) => { const i = order.indexOf(k); return i < 0 ? 99 : i; };
    return [...m.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1].length - a[1].length);
  }, []);
  const clubBySlug = useMemo(() => Object.fromEntries(CLUB_INDEX.map((c) => [c.s, c])), []);
  const featured = MOST_PLAYED.map((s) => clubBySlug[s]).filter(Boolean);
  const latestLists = LISTS_INDEX.slice(0, 8);

  return (
    <div className="fd">
      <a className="fd-skip" href="#today">Skip to today's games</a>
      <SiteHeader />

      <main className="fd-w">
        {/* 1 · the date line: the page proves it changes every day */}
        <div className="fd-date" id="today">
          <span className="fd-date-d">{fmtDate(today)}</span>
          <span className="fd-date-eds">Footle No. {getFootleNumber(today)} · Transfer Trail No. {getTrailNumber(today)}{MYSTERY_ENABLED ? ` · Mystery Player No. ${mysteryNumber(today)}` : ''}</span>
        </div>

        {/* 2 · today's four, as a strip with progress */}
        {/* The page's one h1. Visually the masthead is the date line and the
            Today strip; the h1 is for the crawler and the screen reader, and
            it says what the site is in the words people search for. */}
        <h1 className="fd-sr">Ball IQ — football quizzes, Footle and today's puzzles</h1>
        <section className="fd-sec" aria-labelledby="fd-today-h">
          <div className="fd-sec-head">
            <h2 id="fd-today-h">Today</h2>
            <span className="fd-progress"><b>{playedCount} of {dailies.length}</b> played · new ones in <span className="fd-tnum">{countdown}</span></span>
          </div>
          <div className="fd-today">
            {/* ⚠️ FOUR EQUAL ROWS, BY DECISION. This morning's A/B chose B — Footle
                as a lead card with a live board. By evening Alex had seen it on
                his phone: "assembled and not designed", and the board it led
                with was forty-two empty outlines. He went back to A: "the
                simpler design… we can spice it up a bit though." So: A's shape,
                with two things it lacked. Each row's icon chip carries its
                mode's colour from the app's own MODE_ACCENT set, and Footle's
                chip is the game itself — a two-row worked example graded by
                the real engine, letters and all, the same teaser the app's
                hero shows. The explainer he asked for, at 38px instead of as
                the hero. */}
            {dailies.map((d) => (
              <a key={d.k} className={`fd-card fd-daily${d.done ? ' is-done' : ''}`} href={d.href} onClick={() => go(`fd-today-${d.k}`, d.href)} style={{ '--mode': MODE_ACCENT[d.k === 'daily' ? 'daily7' : d.k] }}>
                {d.k === 'footle' && board.teaser ? (
                  <span className="fd-card-ic fd-mini" aria-hidden="true" style={{ '--len': board.len }}>
                    {board.rows.map((row, r) => row.map((cell, c) => <i key={`${r}-${c}`} data-m={cell.m || undefined}>{cell.ch}</i>))}
                  </span>
                ) : (
                  <span className="fd-card-ic"><Icon k={d.k} /></span>
                )}
                <span className="fd-card-body">
                  <span className="fd-card-n">{d.n}{d.no ? <span className="fd-card-no"> No. {d.no}</span> : null}</span>
                  <span className="fd-card-line">{d.line}</span>
                </span>
                <span className={`fd-state${d.done ? ' is-done' : d.st === 'open' ? ' is-open' : ''}`}>{d.done ? d.doneText : d.st === 'open' ? 'In progress' : 'Not played'}</span>
                <span className="fd-play">{d.done ? 'Review' : d.st === 'open' ? 'Continue' : 'Play'}</span>
              </a>
            ))}
          </div>
          <button type="button" className="fd-lead-alt" aria-expanded={practice} aria-controls="fd-practice" onClick={togglePractice}>
            {practice ? 'Hide the practice board' : `Or practise on No. ${FP_NUMBER} from the archive — nothing about today's is given away`}
          </button>
        </section>

        {/* 2b · the app, once, after value. The 2026-09-05 critique measured the
            homepage's entire app funnel as two 17px footer words six screens
            down (the real badges in index.html's hidden landing render 0×0).
            A hero badge is still out — none of the 13 sites in the field study
            has one — so this is one quiet row between today's games and the
            finder: what the app adds, two links, nothing sold. */}
        <aside className="fd-app" aria-label="Ball IQ app">
          <span className="fd-app-tx"><b>Also on your phone.</b> Streaks, reminders and live 1v1 against a mate — the same games, in the app.</span>
          <span className="fd-app-links">
            <a href={appStoreUrl()} rel="noopener" onClick={() => go('fd-app-ios')}>iOS</a>
            <a href={PLAY_STORE_URL} rel="noopener" onClick={() => go('fd-app-android')}>Android</a>
          </span>
        </aside>

        {/* 3 · the practice board, on request from the lead card */}
        {practice && (
          <section className="fd-sec fd-practice" id="fd-practice" aria-label="Practice Footle">
            <FootleBand />
          </section>
        )}

        {/* 4 · find your club, find your league */}
        <section className="fd-sec" id="clubs" aria-labelledby="fd-clubs-h">
          <div className="fd-sec-head"><h2 id="fd-clubs-h">Your club</h2><span className="fd-sec-sub">{CLUB_INDEX.length} clubs on file, each with its own quiz</span></div>
          <div className="fd-leagues" aria-label="Leagues">
            {LEAGUES.map((l) => <a key={l.s} className="fd-chip" href={`/quiz/${l.s}/`} onClick={() => go('fd-league', l.s)}>{l.n}</a>)}
          </div>
          <div className="fd-clubs">
            {(allClubs ? CLUB_INDEX : featured).map((c) => (
              <a key={c.s} className="fd-club" href={`/quiz/${c.s}/`} onClick={() => go('fd-club', c.s)} style={c.h ? { '--club': c.h } : undefined}>
                <span className="fd-club-body"><span className="fd-club-n">{c.n}</span><span className="fd-club-c">{c.c}</span></span>
              </a>
            ))}
          </div>
          <div className="fd-more">
            {!allClubs ? (
              <button type="button" className="fd-btn" onClick={() => { setAllClubs(true); go('fd-all-clubs'); }}>Every club on file</button>
            ) : (
              <a className="fd-btn" href="/quiz/clubs/">Club pages, by league</a>
            )}
            <button type="button" className="fd-btn fd-btn-q" onClick={() => document.querySelector('.fd-find-in')?.focus()}>Search for one</button>
          </div>
        </section>

        {/* 5 · every game, on the page */}
        <section className="fd-sec" id="games" aria-labelledby="fd-games-h">
          <div className="fd-sec-head"><h2 id="fd-games-h">Every game</h2><span className="fd-sec-sub">Free, in the browser, no account needed</span></div>
          <div className="fd-games">
            {GAMES.map((g) => (
              <a key={g.k} className="fd-card fd-game" href={g.href} onClick={() => go(`fd-game-${g.k}`, g.href)}>
                <span className="fd-card-ic"><Icon k={g.k} /></span>
                <span className="fd-card-body"><span className="fd-card-n">{g.n}{g.daily ? <span className="fd-tag">Daily</span> : null}</span><span className="fd-card-line">{g.line}</span></span>
                <span className="fd-play" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>

        {/* 6 · latest lists, with their verified dates */}
        <section className="fd-sec" aria-labelledby="fd-lists-h">
          <div className="fd-sec-head"><h2 id="fd-lists-h">Lists and records</h2><a className="fd-sec-link" href="/lists/">All {LISTS_INDEX.length} lists</a></div>
          <div className="fd-lists">
            {latestLists.map((l) => (
              <a key={l.s} className="fd-list" href={`/lists/${l.s}/`} onClick={() => go('fd-list', l.s)}>
                <span className="fd-list-ic"><Icon k="list" /></span>
                <span className="fd-list-body"><span className="fd-list-n">{l.h}</span><span className="fd-list-meta">{l.n} entries{l.u ? ` · checked ${fmtVerified(l.u)}` : ''} · with a quiz</span></span>
              </a>
            ))}
          </div>
        </section>

        {/* 7 · how it works — below the catalogue, where playfootball.games puts it */}
        <section className="fd-sec fd-how" aria-labelledby="fd-how-h">
          <h2 id="fd-how-h">How it works</h2>
          <dl className="fd-faq">
            <div><dt>Is it free?</dt><dd>Yes. Every game and every quiz plays in the browser with no account. An account keeps your streaks and rating across devices.</dd></div>
            <div><dt>What resets each day?</dt><dd>Footle, the Daily 7, Transfer Trail and Mystery Player. Everyone in the world gets the same ones, at local midnight.</dd></div>
            <div><dt>Where do the questions come from?</dt><dd>Written and fact-checked by hand, not scraped. Most answers come with the reason they are the answer.</dd></div>
            <div><dt>Can I play with friends?</dt><dd>Yes. Live rooms for up to eight online, or pass one phone around.</dd></div>
          </dl>
        </section>
      </main>

      {/* 8 · the footer is a sitemap */}
      <footer className="fd-foot">
        <div className="fd-w fd-foot-in">
          <div className="fd-foot-col">
            <h3>Games</h3>
            {GAMES.map((g) => <a key={g.k} href={g.href}>{g.n}</a>)}
          </div>
          {byLeague.slice(0, 4).map(([comp, clubs]) => (
            <div className="fd-foot-col" key={comp}>
              <h3>{comp}</h3>
              {clubs.slice(0, 8).map((c) => <a key={c.s} href={`/quiz/${c.s}/`}>{c.n}</a>)}
              {clubs.length > 8 && <a href="/quiz/clubs/">All {comp} clubs</a>}
            </div>
          ))}
          <div className="fd-foot-col">
            <h3>Lists</h3>
            {LISTS_INDEX.slice(0, 8).map((l) => <a key={l.s} href={`/lists/${l.s}/`}>{l.h.replace(/^Every /, '')}</a>)}
            <a href="/lists/">All lists</a>
          </div>
          <div className="fd-foot-col">
            <h3>Discover</h3>
            {DISCOVER.map(([n, h]) => <a key={h} href={h}>{n}</a>)}
          </div>
          <div className="fd-foot-col">
            <h3>Ball IQ</h3>
            <a href="/about/">About</a><a href="/contact/">Contact</a>{MORE.map(([n, h]) => <a key={h} href={h}>{n}</a>)}<a href="/privacy">Privacy</a><a href="/terms/">Terms</a>
            <span className="fd-foot-app">Also on <a href={appStoreUrl()} rel="noopener">iOS</a> and <a href={PLAY_STORE_URL} rel="noopener">Android</a></span>
          </div>
        </div>
        <div className="fd-w fd-foot-line">An independent football quiz, made by one person.</div>
      </footer>
    </div>
  );
}
