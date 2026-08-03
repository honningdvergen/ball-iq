// The Scouting Report homepage — seed cf2f8891, ported from
// docs/mockups/scouting-d.html.
//
// ⚠️ THIS IS A PORT, NOT A PARAPHRASE — the distinction cost a production
// incident. The first implementation reproduced the mockup's *parts* (a
// sheet, a question, an index) while inventing its own composition, and Alex
// called it on the live page: "the implementation did not go right." The
// composition below follows values MEASURED from the rendered mockup at
// 1456px, not remembered from grepping it:
//   container 1000px · hero LEFT-aligned, padding 34/64 · h1 88px -0.02em
//   the file 1080px wide (overhanging the container), rotated -0.45deg,
//   with a letterhead ("Ball IQ — scouting report" / "Subject: you · …")
//   and an INK assessment band carrying "N of 5" · options in a 2-col grid
//   · 12 curated clubs shown, the rest one disclosure away · Footle as
//   board + 422px rail with the legend and the clock.
//
// Standing rules that look like bugs if you do not know them:
//   · No cards, no border-radius, no glow. Hairline rules do that work.
//   · Action on the paper is INK, not green (Alex). Green lives on the desk.
//   · No counted-up numbers, no bounce easing.
//   · The exact question count never appears. Binding product rule.
//   · No literal px sizes — every size is a --ty/--sp role from report.js.
//   · No backticks inside the CSS template literal (build fails silently).
//   · The JSON-LD block stringifies a STATIC const — no user input reaches it.

import '../design/fonts.css';
import '../design/report.css';
import React, { useState, useRef, useCallback } from 'react';
import { APP_STORE_URL as APP_STORE, PLAY_STORE_URL } from '../lib/links.js';
import { getFootleNumber } from '../lib/footleNumber.js';
// Generated (gen-club-index.mjs): 72 rows of {name, slug, competition}, 3.8KB.
// Never import scripts/seo/clubs.mjs here — it carries every club's SEO prose
// and would put ~200KB into this chunk to read three fields.
import { CLUB_HEADING, CLUB_INDEX } from './clubIndex.js';
import FootleBand from './FootleBand.jsx';

const GET_APP = '/get';
const PLAY = '/play';

// The five FAQs, copy identical to MarketingHome's CORRECTED set (Android
// live since 2026-07-30; no question counts). One array feeds both the
// rendered section and the FAQPage JSON-LD, so they cannot diverge.
const FAQS = [
  { q: 'Is Ball IQ free?', a: 'Yes — 100% free, and the app shows no ads. Guests can jump straight into solo and local games, no account needed.' },
  { q: 'Do I need an account?', a: 'No. Play as a guest, or sign up to play online with up to 8 friends, save your streak, and build your profile card and leaderboard rank.' },
  { q: "What's Footle?", a: "Our daily Wordle-style game: guess the footballer's surname in six tries. A fresh one drops every day." },
  { q: 'Can I play with friends?', a: 'Absolutely — race friends in real time online, or pass-and-play locally on a single device.' },
  { q: 'Where can I play?', a: 'On iPhone via the App Store, on Android via Google Play, or instantly in your browser at balliq.app — no install, no account. Your progress follows your account across all three.' },
];

// Carried over verbatim from the approved mockup. `a` is an INDEX into `o`,
// never the answer string — the bank's oldest trap.
const QS = [
  {
    d: 'Premier League',
    q: 'Who managed Liverpool when they ended their 30-year wait for the league title in 2020?',
    o: ['Houllier', 'Benítez', 'Rodgers', 'Klopp'],
    a: 3,
    why: "Klopp's Liverpool won the 2019-20 title with seven games to spare, the club's first league championship since 1990.",
  },
  {
    d: 'Euros',
    q: 'Which two-nation pairing hosted Euro 2000, the first ever co-hosted European Championship?',
    o: ['Austria & Switzerland', 'Poland & Ukraine', 'Belgium & Netherlands', 'Spain & Portugal'],
    a: 2,
    why: 'Belgium and the Netherlands co-hosted Euro 2000, won by France in the Rotterdam final.',
  },
  {
    d: 'Transfers',
    q: "Atlético's record signing was a €127.2m teenager bought from Benfica in 2019. Who?",
    o: ['João Félix', 'Julián Álvarez', 'Rodri', 'Thomas Lemar'],
    a: 0,
    why: "The Portuguese wonderkid arrived to replace Griezmann's goals. Even Julián Álvarez's 2024 fee from Man City didn't top it.",
  },
  {
    d: 'Champions League',
    q: 'In which year did Ajax reach the semi-finals, eliminating both Real Madrid and Juventus?',
    o: ['2017', '2018', '2020', '2019'],
    a: 3,
    why: '2019. Young Ajax, led by De Jong, De Ligt and Ziyech, then lost late to Spurs on away goals in the semi-final.',
  },
  {
    d: 'Legends',
    q: "Tottenham's old stadium, demolished in 2017, went by what name?",
    o: ['The Cottage', 'White Hart Lane', 'The Dell', 'Maine Road'],
    a: 1,
    why: "White Hart Lane was Spurs' home for 118 years; the new stadium was built on the very same site.",
  },
];

// One band per possible score. Every verdict stop clears 4.5:1 as ink on
// newsprint (measured 7.08 / 5.38 / 4.66 / 4.81 / 4.75 / 5.23) — the Scout's
// Ramp amber (--attr-mid) is 2.13:1 there and must never be text.
const BANDS = [
  { t: 'Casual', s: 'You watch the finals. Nothing wrong with that.', v: 'var(--v0)' },
  { t: 'Passer-by', s: 'You know the names. The details are somebody else’s job.', v: 'var(--v1)' },
  { t: 'Matchday', s: 'You follow a team. You do not follow the archive.', v: 'var(--v2)' },
  { t: 'Regular', s: 'Solid. You have watched more football than most people you know.', v: 'var(--v3)' },
  { t: 'Anorak', s: 'You argue about football with people who lose those arguments.', v: 'var(--v4)' },
  { t: 'Scout', s: 'Five from five. The full test is the only thing left that will test you.', v: 'var(--v5)' },
];

// The mockup shows these twelve on the homepage; the other sixty stay one
// disclosure away — still real anchors in the DOM, so the 72-link crawl mesh
// survives while the reader gets the curated dozen.
const FEATURED_SLUGS = [
  'liverpool', 'arsenal', 'manchester-united', 'manchester-city', 'chelsea', 'tottenham',
  'barcelona', 'real-madrid', 'bayern-munich', 'borussia-dortmund', 'celtic', 'hajduk-split',
];

const CSS = `
.sr{background:var(--bg);background-image:var(--grain);color:var(--on-desk);
    font-family:'Archivo',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    font-variant-numeric:tabular-nums;min-height:100vh;overflow-x:hidden}
.sr *{box-sizing:border-box;margin:0;padding:0}
.sr a{color:inherit;text-decoration:none}
.sr :focus-visible{outline:3px solid var(--grn);outline-offset:3px}
.sr-w{max-width:1000px;margin:0 auto;padding-left:28px;padding-right:28px}

.sr a.sr-skip{position:absolute;left:-9999px;top:0;z-index:50;min-height:44px;
         display:inline-flex;align-items:center;padding:10px var(--sp3);
         background:var(--grn);color:var(--grn-ink);font:var(--ty-sec);font-weight:700}
.sr a.sr-skip:focus{left:0}

.sr-mast{display:flex;align-items:center;justify-content:space-between;gap:var(--sp2);
         flex-wrap:wrap;padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--bd)}
.sr-mark{font:700 21px/1 'Archivo Narrow',sans-serif;letter-spacing:.02em;
         color:var(--tx);text-transform:uppercase}
.sr-mark em{font-style:normal;color:var(--grn)}
.sr-nav{display:flex;gap:2px;flex-wrap:wrap}
.sr-nav a{display:inline-flex;align-items:center;min-height:44px;padding:10px 12px;
          font:var(--ty-sec);color:var(--on-desk-mut);transition:color .12s var(--ease)}
@media (hover:hover){.sr-nav a:hover{color:var(--tx)}}
@media (max-width:699px){.sr-nav{order:3;width:100%;margin-top:2px}}
.sr a.sr-play{display:inline-flex;align-items:center;min-height:44px;padding:10px var(--sp3);
         background:var(--grn);color:var(--grn-ink);font:var(--ty-sec);font-weight:700;
         border:1px solid var(--grn);transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-play:hover{opacity:.88}}

/* The opening. LEFT-aligned and tight — measured from the mockup (34px over,
   64px under, 1000px container). Centring this was half of "does not look
   right": the same 88px headline reads calmer ranged left in a dense block. */
.sr-open{padding-top:var(--sp4);padding-bottom:var(--sp5)}
.sr-h1{font:var(--ty-headline);letter-spacing:var(--ty-headline-ls);
       text-transform:uppercase;color:var(--tx);text-wrap:balance}
.sr-lede{margin-top:var(--sp2);font:var(--ty-lede);color:var(--tx4);max-width:60ch}

/* The file: wider than the container, lying on the desk, with the stacked
   second sheet behind it — a sheet, not a glow. */
.sr-filewrap{position:relative;max-width:1080px;margin:0 auto var(--sp6);padding:0 var(--sp1)}
.sr-file{position:relative;background:var(--pa);background-image:var(--paper-tex);
         color:var(--ink);box-shadow:var(--sheet-shadow)}
@media (min-width:1140px){.sr-file{transform:rotate(-.45deg)}}
.sr-file::before{content:'';position:absolute;inset:-7px -6px 9px 10px;
                 background:var(--pa3);transform:rotate(.5deg);z-index:-1;
                 box-shadow:var(--sheet-shadow)}
@media (max-width:699px){.sr-file::before{display:none}
  .sr-filewrap{margin-left:var(--sp2);margin-right:var(--sp2);padding:0}}

.sr-lh{padding:var(--sp2) var(--sp3);border-bottom:2px solid var(--ink);background:var(--pa2)}
@media (min-width:700px){.sr-lh{padding:var(--sp2) var(--sp4)}}
.sr-who{font:var(--ty-label);letter-spacing:var(--ty-label-ls);
        text-transform:uppercase;font-weight:700}
.sr-subject{margin-top:3px;font:var(--ty-meta);color:var(--mut)}

.sr-assess{margin:var(--sp3) var(--sp3) 0;border:1px solid var(--ink)}
@media (min-width:700px){.sr-assess{margin:var(--sp4) var(--sp4) 0}}
.sr-ab{display:flex;align-items:center;justify-content:space-between;
       padding:9px var(--sp2);background:var(--ink);color:var(--pa)}
.sr-abt{font:var(--ty-label);letter-spacing:var(--ty-label-ls);text-transform:uppercase}
.sr-abn{font:var(--ty-meta);color:var(--pa3)}
.sr-abody{padding:var(--sp3) var(--sp2)}
@media (min-width:700px){.sr-abody{padding:var(--sp3)}}
/* Sentence-case caption, deliberately NOT the tracked-uppercase eyebrow the
   craft floor bans and the detector flagged once already. */
.sr-dept{font:var(--ty-sec);color:var(--mut)}
.sr-q{margin-top:6px;font:var(--ty-sub);font-weight:600;text-wrap:balance}
@media (min-width:700px){.sr-q{font:var(--ty-lede);font-weight:600}}

/* Options: the mockup's two-column boxed grid. --rule2 (3.31:1) because a
   rule doing a CONTROL's job must clear WCAG 1.4.11's 3:1 floor. */
.sr-opts{margin-top:var(--sp2);display:grid;grid-template-columns:1fr;gap:9px}
@media (min-width:700px){.sr-opts{grid-template-columns:1fr 1fr}}
.sr-opt{display:flex;align-items:center;gap:var(--sp2);width:100%;text-align:left;
        min-height:52px;padding:var(--sp1) var(--sp2);background:var(--pa);
        border:1px solid var(--rule2);color:var(--ink);
        font:var(--ty-body);cursor:pointer;transition:background-color .12s var(--ease)}
.sr-opt:disabled{cursor:default}
@media (hover:hover){.sr-opt:not(:disabled):hover{background:var(--pa2)}}
.sr-key{flex:0 0 auto;width:26px;height:26px;display:grid;place-items:center;
        border:1px solid var(--rule2);font:var(--ty-label);color:var(--mut)}
.sr-opt[data-mark="hit"]{border-color:var(--v5);font-weight:700}
.sr-opt[data-mark="hit"] .sr-key{background:var(--v5);border-color:var(--v5);color:var(--tx)}
.sr-opt[data-mark="miss"]{color:var(--mut);background:var(--pa2);border-color:var(--v0)}
.sr-opt[data-mark="miss"] .sr-key{background:var(--v0);border-color:var(--v0);color:var(--tx)}

.sr-whywrap{margin-top:var(--sp2);padding:var(--sp2);background:var(--pa2)}
.sr-whylab{font:var(--ty-label);letter-spacing:var(--ty-label-ls);text-transform:uppercase;
           color:var(--mut);margin-bottom:6px}
.sr-why{font:var(--ty-sec);color:var(--ink)}
.sr-next{margin-top:var(--sp2);min-height:52px;width:100%;background:var(--ink);color:var(--pa);
         border:1px solid var(--ink);font:var(--ty-body);font-weight:700;cursor:pointer;
         transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-next:hover{opacity:.86}}

.sr-stubwrap{padding:var(--sp3);border-top:1px solid var(--rule);margin-top:var(--sp3)}
@media (min-width:700px){.sr-stubwrap{padding:var(--sp3) var(--sp4) var(--sp4)}}
.sr-stub{width:100%;border-collapse:collapse}
.sr-stub tr:nth-child(even){background:var(--pa2)}
.sr-stub th{font:var(--ty-label);letter-spacing:var(--ty-label-ls);
            text-transform:uppercase;color:var(--mut);text-align:left;
            padding:7px var(--sp1) 7px 0;font-weight:700;white-space:nowrap}
.sr-stub td{padding:7px 0}
.sr-bar{display:block;width:100%;max-width:180px;height:5px;background:var(--pa3)}
.sr-bar i{display:block;height:100%;background:var(--v5);transform:scaleX(0);
          transform-origin:left;transition:transform .5s var(--ease)}
.sr-bar i[data-on="1"]{transform:scaleX(1)}
@media (prefers-reduced-motion:reduce){.sr-bar i{transition:none}}
.sr-out{font:var(--ty-meta);text-align:right;white-space:nowrap;padding-left:var(--sp1)}
.sr-out[data-r="yes"]{color:var(--v5);font-weight:700}
.sr-out[data-r="no"]{color:var(--v0);font-weight:700}
.sr-out[data-r="pend"]{color:var(--mut)}
.sr-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

.sr-verd{padding:var(--sp3);animation:sr-land .5s var(--ease) both}
@media (min-width:700px){.sr-verd{padding:var(--sp4)}}
@keyframes sr-land{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.sr-verd{animation:none}}
.sr-score{font:var(--ty-verdict-num);letter-spacing:var(--ty-verdict-num-ls)}
.sr-band{margin-top:var(--sp1);font:var(--ty-verdict-tier);
         letter-spacing:var(--ty-verdict-tier-ls);text-transform:uppercase}
.sr-bsub{margin-top:var(--sp1);font:var(--ty-body);color:var(--mut);max-width:44ch}
.sr-keep{margin-top:var(--sp3);padding-top:var(--sp3);border-top:2px solid var(--ink)}
.sr-keept{font:var(--ty-label);letter-spacing:var(--ty-label-ls);text-transform:uppercase}
.sr-keepp{margin-top:6px;font:var(--ty-sec);color:var(--mut);max-width:46ch}
.sr-links{margin-top:var(--sp2);display:flex;gap:var(--sp1);flex-wrap:wrap}
.sr-a{display:inline-flex;align-items:center;gap:8px;min-height:52px;padding:12px var(--sp3);
      border:1px solid var(--ink);font:var(--ty-sec);font-weight:700;
      transition:background-color .15s var(--ease),color .15s var(--ease)}
.sr-a span{font:var(--ty-meta);color:var(--mut)}
@media (hover:hover){.sr-a:hover{background:var(--ink);color:var(--pa)}
                     .sr-a:hover span{color:var(--pa3)}}
@media (max-width:520px){.sr-a{width:100%;justify-content:space-between}}
.sr-web{margin-top:var(--sp2);font:var(--ty-sec);color:var(--mut)}
.sr-web a{text-decoration:underline;text-underline-offset:3px;font-weight:700;color:var(--ink)}

.sr-clubs{padding:var(--sp5) 0 var(--sp4);border-top:1px solid var(--bd)}
.sr-h2{font:var(--ty-section);letter-spacing:var(--ty-section-ls);
       text-transform:uppercase;color:var(--tx);text-wrap:balance}
.sr-clsub{margin-top:var(--sp2);font:var(--ty-sub);color:var(--on-desk);max-width:58ch}
.sr-idx{margin-top:var(--sp3);column-count:1;column-gap:var(--sp5)}
@media (min-width:760px){.sr-idx{column-count:2}}
.sr-row{display:flex;align-items:baseline;gap:10px;min-height:36px;
        break-inside:avoid;padding:6px 0;color:var(--on-desk);font:var(--ty-sec)}
@media (pointer:coarse){.sr-row{min-height:44px;padding:10px 0}}
.sr-cn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}
.sr-ld{flex:1;min-width:16px;border-bottom:1px dotted var(--bd3);transform:translateY(-4px)}
.sr-cc{white-space:nowrap;font:var(--ty-meta);color:var(--on-desk-mut)}
@media (hover:hover){.sr-row:hover{color:var(--tx)}
  .sr-row:hover .sr-ld{border-bottom-color:var(--on-desk-mut)}}
.sr-allclubs{margin-top:var(--sp1)}
.sr-allclubs summary{display:inline-flex;align-items:center;min-height:48px;
        padding:12px var(--sp3);border:1px solid var(--bd3);color:var(--tx);
        font:var(--ty-sec);font-weight:700;cursor:pointer;list-style:none;
        transition:background-color .15s var(--ease)}
.sr-allclubs summary::-webkit-details-marker{display:none}
@media (hover:hover){.sr-allclubs summary:hover{background:var(--card)}}
.sr-allclubs[open] summary{margin-bottom:var(--sp2)}

.sr-faq{padding:var(--sp5) 0 var(--sp4);border-top:1px solid var(--bd)}
.sr-faq details{border-bottom:1px solid var(--bd)}
.sr-faq summary{display:flex;align-items:center;justify-content:space-between;
        gap:var(--sp2);min-height:52px;padding:var(--sp2) 0;cursor:pointer;
        font:var(--ty-body);font-weight:600;color:var(--on-desk);list-style:none}
.sr-faq summary::-webkit-details-marker{display:none}
.sr-faq summary::after{content:'+';font:700 20px/1 'Archivo Narrow',sans-serif;
        color:var(--on-desk-mut);flex:0 0 auto}
.sr-faq details[open] summary::after{content:'−'}
.sr-faq details[open] summary{color:var(--tx)}
.sr-faq .sr-fa{padding:0 0 var(--sp2);font:var(--ty-sec);color:var(--on-desk-mut);
        max-width:60ch;line-height:1.55}
@media (hover:hover){.sr-faq summary:hover{color:var(--tx)}}

.sr-foot{padding:var(--sp4) var(--sp3) var(--sp5);text-align:center;font:var(--ty-meta);
         color:var(--tx4);border-top:1px solid var(--bd)}
.sr-foot p{max-width:52ch;margin:0 auto}
.sr-dist{margin-top:var(--sp2);display:flex;gap:var(--sp2);justify-content:center;flex-wrap:wrap}
.sr-dist a,.sr-legal a{display:inline-flex;align-items:center;min-height:44px;
        padding:10px 12px;font:var(--ty-sec);color:var(--on-desk-mut);
        text-decoration:underline;text-underline-offset:3px}
@media (hover:hover){.sr-dist a:hover,.sr-legal a:hover{color:var(--tx)}}
.sr-legal{margin-top:2px;display:flex;gap:var(--sp1);justify-content:center;flex-wrap:wrap}
`;

/** The running-report table — under the assessment while filing, above the
 *  verdict once filed. One component so the two can never disagree. */
function Stub({ results, caption }) {
  return (
    <table className="sr-stub">
      <caption className="sr-vh">{caption}</caption>
      <tbody>
        {QS.map((qq, k) => (
          <tr key={k}>
            <th scope="row">{qq.d}</th>
            <td>{results[k] !== null && (
              <span className="sr-bar"><i data-on={results[k] === true ? 1 : 0} /></span>
            )}</td>
            <td className="sr-out" data-r={results[k] === true ? 'yes' : results[k] === false ? 'no' : 'pend'}>
              {results[k] === true ? '1 of 1' : results[k] === false ? '0 of 1' : 'not assessed'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ScoutingReport() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState(() => QS.map(() => null));
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QS[i];
  const answered = picked !== null;
  const filed = results.filter((r) => r !== null).length;

  const choose = useCallback((k) => {
    if (picked !== null) return;
    setPicked(k);
    const right = k === QS[i].a;
    setResults((r) => r.map((v, j) => (j === i ? right : v)));
    if (right) { scoreRef.current += 1; setScore(scoreRef.current); }
  }, [picked, i]);

  const next = useCallback(() => {
    if (i + 1 >= QS.length) { setDone(true); return; }
    setI(i + 1);
    setPicked(null);
  }, [i]);

  const band = BANDS[Math.min(score, BANDS.length - 1)];
  const featured = FEATURED_SLUGS.map((s) => CLUB_INDEX.find((r) => r.s === s)).filter(Boolean);
  const rest = CLUB_INDEX.filter((r) => !FEATURED_SLUGS.includes(r.s));

  // The letterhead's subject line follows the file's state — every state is a
  // sentence, never a bare label.
  const subject = done
    ? 'Subject: you · verdict filed — ' + band.t.toLowerCase() + ', ' + score + ' of ' + QS.length
    : filed === 0
      ? 'Subject: you · nothing filed yet'
      : 'Subject: you · ' + filed + ' of ' + QS.length + ' filed';

  return (
    <div className="sr">
      <style>{CSS}</style>

      <a className="sr-skip" href="#report">Skip to the assessment</a>

      <header className="sr-mast">
        <a className="sr-mark" href="/" aria-label="Ball IQ home">Ball <em>IQ</em></a>
        <nav className="sr-nav" aria-label="Main">
          <a href="/quiz/">Clubs</a>
          <a href="/lists/">Records</a>
          <a href="/football-wordle/">Daily</a>
          <a href="/about/">About</a>
        </nav>
        <a className="sr-play" href={PLAY}>Play free</a>
      </header>

      {!done && (
        <div className="sr-w sr-open">
          <h1 className="sr-h1">Five questions.<br />One honest verdict.</h1>
          <p className="sr-lede">
            No account, nothing to install. The report writes itself while you answer.
          </p>
        </div>
      )}

      <div className="sr-filewrap">
        <main className="sr-file" id="report">
          <div className="sr-lh">
            <div className="sr-who">Ball IQ — scouting report</div>
            <div className="sr-subject">{subject}</div>
          </div>

          {!done ? (
            <>
              <div className="sr-assess">
                <div className="sr-ab">
                  <span className="sr-abt">Assessment</span>
                  <span className="sr-abn">{i + 1} of {QS.length}</span>
                </div>
                <div className="sr-abody">
                  <p className="sr-dept">{q.d}</p>
                  <h2 className="sr-q">{q.q}</h2>
                  <div className="sr-opts">
                    {q.o.map((opt, k) => {
                      const mark = !answered ? null : k === q.a ? 'hit' : k === picked ? 'miss' : null;
                      return (
                        <button key={k} className="sr-opt" data-mark={mark || undefined}
                          disabled={answered} onClick={() => choose(k)}>
                          <span className="sr-key" aria-hidden="true">{'ABCD'[k]}</span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <>
                      <div className="sr-whywrap" role="status">
                        <div className="sr-whylab">Why</div>
                        <p className="sr-why">{q.why}</p>
                      </div>
                      <button className="sr-next" onClick={next}>
                        {i + 1 >= QS.length ? 'See the verdict' : 'Next question'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="sr-stubwrap">
                <Stub results={results} caption="The report so far, by discipline" />
              </div>
            </>
          ) : (
            <div className="sr-verd">
              <Stub results={results} caption="The completed report, by discipline" />
              <div className="sr-score" style={{ color: band.v, marginTop: 'var(--sp3)' }}>{score} / {QS.length}</div>
              <div className="sr-band" style={{ color: band.v }}>{band.t}</div>
              <p className="sr-bsub">{band.s}</p>

              <div className="sr-keep">
                <div className="sr-keept">Keep this report</div>
                <p className="sr-keepp">
                  The full test scores you 60 to 160 and remembers it. Your streak, your clubs,
                  your card — and friends to race online, up to eight of you.
                </p>
                <p className="sr-keepp">
                  The app is also the only version that can nudge you when tomorrow&rsquo;s
                  puzzle drops.
                </p>
                <div className="sr-links">
                  <a className="sr-a" href={APP_STORE}>iPhone<span>App Store</span></a>
                  <a className="sr-a" href={PLAY_STORE_URL}>Android<span>Google Play</span></a>
                </div>
                <p className="sr-web">
                  Or <a href={GET_APP}>keep going in the browser</a> — same test, nothing to install
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <FootleBand />

      <section className="sr-clubs" aria-labelledby="srClubsT">
        <div className="sr-w">
          <h2 className="sr-h2" id="srClubsT">{CLUB_HEADING}</h2>
          <p className="sr-clsub">
            Hajduk Split get the same treatment as Real Madrid. Every question in both files went
            through the same checks before it was let in, and most of them tell you why the answer
            is the answer.
          </p>
          <div className="sr-idx">
            {featured.map((r) => (
              <a key={r.s} className="sr-row" href={'/quiz/' + r.s + '/'}>
                <span className="sr-cn">{r.n}</span>
                <span className="sr-ld" aria-hidden="true" />
                <span className="sr-cc">{r.c}</span>
              </a>
            ))}
          </div>
          <details className="sr-allclubs">
            <summary>Show every club on file</summary>
            <div className="sr-idx">
              {rest.map((r) => (
                <a key={r.s} className="sr-row" href={'/quiz/' + r.s + '/'}>
                  <span className="sr-cn">{r.n}</span>
                  <span className="sr-ld" aria-hidden="true" />
                  <span className="sr-cc">{r.c}</span>
                </a>
              ))}
            </div>
          </details>
        </div>
      </section>

      <section className="sr-faq" aria-labelledby="srFaqT">
        <div className="sr-w">
          <h2 className="sr-h2" id="srFaqT">Common questions</h2>
          <div style={{ marginTop: 'var(--sp2)' }}>
            {FAQS.map((f, k) => (
              <details key={k}>
                <summary>{f.q}</summary>
                <p className="sr-fa">{f.a}</p>
              </details>
            ))}
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question', name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }) }} />
        </div>
      </section>

      <footer className="sr-foot">
        <p>Ball IQ — an independent football quiz. Most answers tell you why. Made by one person.</p>
        <div className="sr-dist">
          <a href={APP_STORE}>App Store</a>
          <a href={PLAY_STORE_URL}>Google Play</a>
        </div>
        <div className="sr-legal">
          <a href="/about/">About</a>
          <a href="/contact/">Contact</a>
          <a href="/terms/">Terms</a>
        </div>
      </footer>
    </div>
  );
}
