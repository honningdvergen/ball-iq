// The Scouting Report homepage — seed cf2f8891, ported from
// docs/mockups/scouting-d.html.
//
// Lives at /home-preview. `/` still renders MarketingHome, untouched, so the
// page that is currently converting carries none of the risk while this is
// judged on a real phone.
//
// THE THESIS, from the direction contract, because every decision below is
// downstream of it: the page is not ABOUT a football test. The page IS the
// test, and it files a report on you. It refuses the category's dark hero,
// phone mockup and feature-card triptych.
//
// EVERY SIZE, COLOUR AND SPACE HERE COMES FROM DESIGN.md. That file already
// documents this exact direction — it was written from the built mockup — and
// an earlier pass of this component invented its own type sizes instead. The
// impeccable detector flagged all ten. Do not add a literal px value here:
// add a role to design/report.js and use it.
//
// Consequences that look like bugs if you do not know the contract:
//   · No cards, no border-radius, no glow. Hairline rules do that work.
//   · Action on the paper is INK, not green (Alex, 2026-08-03). Green lives on
//     the dark desk chrome only. Do not "restore" the green button.
//   · No counted-up numbers, no bounce easing. A bounce on the verdict landing
//     was the exact tell this direction was built to avoid.
//   · The question count never appears. Binding product rule.

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

// The five FAQs, copy identical to MarketingHome's CORRECTED set (Android
// live since 2026-07-30; no question counts). One array feeds both the
// rendered section and the FAQPage JSON-LD below, so they cannot diverge —
// a schema answering differently from the visible page is a rich-result
// penalty waiting to happen. Note: the old homepage never actually emitted
// FAQPage schema; this is its first appearance, not a port.
const FAQS = [
  { q: 'Is Ball IQ free?', a: 'Yes — 100% free, and the app shows no ads. Guests can jump straight into solo and local games, no account needed.' },
  { q: 'Do I need an account?', a: 'No. Play as a guest, or sign up to play online with up to 8 friends, save your streak, and build your profile card and leaderboard rank.' },
  { q: "What's Footle?", a: "Our daily Wordle-style game: guess the footballer's surname in six tries. A fresh one drops every day." },
  { q: 'Can I play with friends?', a: 'Absolutely — race friends in real time online, or pass-and-play locally on a single device.' },
  { q: 'Where can I play?', a: 'On iPhone via the App Store, on Android via Google Play, or instantly in your browser at balliq.app — no install, no account. Your progress follows your account across all three.' },
];
const PLAY = '/play';

// Carried over verbatim from the approved mockup so this is a port, not a
// rewrite. `a` is an INDEX into `o`, never the answer string — the bank's
// oldest trap.
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

// One band per possible score — six outcomes over five questions, which is
// exactly what the six-step verdict ramp is for. Every stop clears 4.5:1 as
// ink on newsprint (measured: 7.08 / 5.38 / 4.66 / 4.81 / 4.75 / 5.23), which
// is why the VERDICT ramp is used here and not the Scout's Ramp — --attr-mid
// reads 2.13:1 on paper and must never be text.
const BANDS = [
  { t: 'Casual', s: 'You watch the finals. Nothing wrong with that.', v: 'var(--v0)' },
  { t: 'Passer-by', s: 'You know the names. The details are somebody else’s job.', v: 'var(--v1)' },
  { t: 'Matchday', s: 'You follow a team. You do not follow the archive.', v: 'var(--v2)' },
  { t: 'Regular', s: 'Solid. You have watched more football than most people you know.', v: 'var(--v3)' },
  { t: 'Anorak', s: 'You argue about football with people who lose those arguments.', v: 'var(--v4)' },
  { t: 'Scout', s: 'Five from five. The full test is the only thing left that will test you.', v: 'var(--v5)' },
];

const CSS = `
.sr{background:var(--bg);color:var(--on-desk);
    font-family:'Archivo',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    font-variant-numeric:tabular-nums;min-height:100vh;overflow-x:hidden}
.sr *{box-sizing:border-box;margin:0;padding:0}
.sr a{color:inherit;text-decoration:none}
.sr :focus-visible{outline:3px solid var(--grn);outline-offset:3px}

/* Skip link: visually hidden until focused — first tabbable thing on the
   page, jumps past the hero straight to the report. */
/* "sr a.sr-skip" for the same reason as the Play button below: the ".sr a"
   reset is class+element (0,1,1) and beats a bare class, so a plain .sr-skip
   silently inherited --on-desk on green — 1.3:1, the EXACT bug fixed on
   .sr-play yesterday, reintroduced on a new element while its warning comment
   sat thirty lines away. Every green control that is an anchor needs this. */
.sr a.sr-skip{position:absolute;left:-9999px;top:0;z-index:50;min-height:44px;
         display:inline-flex;align-items:center;padding:10px var(--sp3);
         background:var(--grn);color:var(--grn-ink);font:var(--ty-sec);font-weight:700}
.sr a.sr-skip:focus{left:0}

/* ── The desk: chrome. Green survives HERE and only here. ───────────── */
.sr-mast{display:flex;align-items:center;justify-content:space-between;gap:var(--sp2);
         flex-wrap:wrap;padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--bd)}
/* Four links that name themselves — the mockup's masthead nav, no drawer.
   Inline between wordmark and CTA on desktop; wraps to its own full-width row
   under 700px, which keeps every target 44px without hiding anything. */
.sr-nav{display:flex;gap:2px;flex-wrap:wrap}
.sr-nav a{display:inline-flex;align-items:center;min-height:44px;padding:10px 12px;
          font:var(--ty-sec);color:var(--on-desk-mut);
          transition:color .12s var(--ease)}
@media (hover:hover){.sr-nav a:hover{color:var(--tx)}}
@media (max-width:699px){.sr-nav{order:3;width:100%;margin-top:2px}}
.sr-mark{font:700 21px/1 'Archivo Narrow',sans-serif;letter-spacing:.02em;
         color:var(--tx);text-transform:uppercase}
.sr-mark em{font-style:normal;color:var(--grn)}
/* ⚠️ Written as "sr a.sr-play", not a bare ".sr-play". The reset above is
   ".sr a" — class + ELEMENT, specificity (0,1,1) — which outranks a bare
   class (0,1,0). So color:var(--grn-ink) silently lost to color:inherit and
   the button painted --on-desk #C3CBC3 on #58CC02: 1.3:1, under the 4.5:1
   floor. (No backticks in this comment: it lives inside a template literal,
   and a stray one terminates the string and fails the build.)
   It looked like plausible light-on-green in a screenshot; only the rendered
   detector pass caught it. */
.sr a.sr-play{display:inline-flex;align-items:center;min-height:44px;padding:10px var(--sp3);
         background:var(--grn);color:var(--grn-ink);font:var(--ty-sec);font-weight:700;
         border:1px solid var(--grn);transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-play:hover{opacity:.88}}

/* ── The lede sits on the desk, not on the paper. ───────────────────── */
/* --sp3 (22px), not --sp2 (14px): body text was rendering 14px from the
   viewport edge, under the 16px floor. The narrower gutter had existed only
   to buy width for the headline; the headline floor now handles that. */
/* 860px, not 760px. At 1280 the headline renders at 84.48px and its longest
   line needs 793px, so a 760px container (716px of content) wrapped it to a
   THIRD line on desktop — the same two-line rule broken again, in the other
   direction. Measured, not guessed. The lede keeps its own 46ch measure, so
   the wider container only ever affects the headline. */
.sr-open{padding:var(--sp5) var(--sp3) var(--sp4);max-width:860px;margin:0 auto;text-align:center}
/* Desktop was spending 594px of an 800px fold before reaching question one,
   leaving 2 of 4 options below it, against a contract whose first viewport is
   headline, lede, question. The hero band tightens once there is height to
   trade. */
@media (min-width:700px) and (max-height:900px){
  .sr-open{padding-top:var(--sp4);padding-bottom:var(--sp3)}
}
/* Size and tracking both come from report.js, which documents why the mobile
   floor is 35px rather than DESIGN.md's 41px: measured, "ONE HONEST VERDICT."
   needs 385px at 41px against 331px available. Tracking is worth ~6px of that,
   not 54px — an earlier comment here claimed otherwise without measuring. */
.sr-h1{font:var(--ty-headline);letter-spacing:var(--ty-headline-ls);
       text-transform:uppercase;color:var(--tx);text-wrap:balance}
.sr-h1 span{display:block}
.sr-lede{margin-top:var(--sp2);font:var(--ty-lede);color:var(--tx4);
         max-width:46ch;margin-left:auto;margin-right:auto}

/* ── The paper. A lit document lying on the desk. ───────────────────── */
/* The sheet needs DESK VISIBLE AROUND IT or the concept collapses: full-bleed
   paper reads as "a section with a light background", not a document on a
   surface. It was bleeding edge-to-edge at 375px — i.e. on 66% of traffic. */
.sr-sheet{max-width:660px;margin:0 var(--sp2) var(--sp6);background:var(--pa);color:var(--ink);
          padding:var(--sp4) var(--sp3);box-shadow:var(--sheet-shadow)}
@media (min-width:520px) and (max-width:699px){.sr-sheet{margin:0 var(--sp3) var(--sp6)}}
@media (min-width:700px){.sr-sheet{margin:0 auto var(--sp6);padding:var(--sp5)}}

/* Moving the subject into this row made BOTH halves wrap to two lines at
   375px. A masthead that wraps stops reading as a masthead, so it stacks
   below 460px instead — each line whole, the document's own header. */
.sr-head{display:flex;align-items:baseline;justify-content:space-between;gap:var(--sp2);
         padding-bottom:var(--sp1);border-bottom:2px solid var(--ink)}
.sr-title,.sr-no{font:var(--ty-label);letter-spacing:var(--ty-label-ls);
                 text-transform:uppercase;white-space:nowrap}
.sr-no{color:var(--mut)}
@media (max-width:459px){
  .sr-head{flex-direction:column;align-items:flex-start;gap:4px}
}

/* The running report — the sheet filling itself in, one row per discipline.
   Ported from the mockup's drawStub with its decisions intact: only a CORRECT
   answer fills the bar (a full bar in a different colour still reads as a
   full bar); an unasked row gets NO bar at all (an empty outline drew the
   same mark for "wrong" and "not asked yet"); and the outcome column says
   what HAPPENED — 1 of 1 / 0 of 1 / not assessed — because one binary answer
   cannot produce a two-digit score and a football person spots a fake
   instantly. */
.sr-stub{width:100%;border-collapse:collapse;margin:var(--sp2) 0 var(--sp3)}
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

.sr-q{margin-top:var(--sp1);font:var(--ty-sub);font-weight:600;text-wrap:balance}
@media (min-width:700px){.sr-q{font:var(--ty-lede);font-weight:600}}

/* --rule2 (3.31:1), NOT --rule (1.53:1). DESIGN.md is explicit: a rule doing
   a CONTROL's job must clear WCAG 1.4.11's 3:1 floor; --rule is for separating
   rows of data only. */
.sr-opts{margin-top:var(--sp3);display:flex;flex-direction:column}
.sr-opt{display:flex;align-items:center;gap:var(--sp2);width:100%;text-align:left;
        min-height:52px;padding:var(--sp1) var(--sp1) var(--sp1) 0;background:none;
        border:0;border-top:1px solid var(--rule2);color:var(--ink);
        font:var(--ty-body);cursor:pointer;transition:background-color .12s var(--ease)}
.sr-opt:last-child{border-bottom:1px solid var(--rule2)}
.sr-opt:disabled{cursor:default}
@media (hover:hover){.sr-opt:not(:disabled):hover{background:var(--pa2)}}
.sr-key{flex:0 0 auto;width:26px;height:26px;display:grid;place-items:center;
        border:1px solid var(--rule2);font:var(--ty-label);color:var(--mut)}
.sr-opt[data-mark="hit"] .sr-key{background:var(--v5);border-color:var(--v5);color:var(--tx)}
.sr-opt[data-mark="miss"] .sr-key{background:var(--v0);border-color:var(--v0);color:var(--tx)}
.sr-opt[data-mark="hit"]{font-weight:700}
.sr-opt[data-mark="miss"]{color:var(--mut);background:var(--pa2)}

/* The explanation is an annotation in the document, not an accented card.
   A 3px coloured bar down one side is the single most recognisable tell of
   AI-generated UI and the detector flags it by name. It reads as a shaded
   note with its own label instead — --pa2 is exactly what DESIGN.md
   documents shaded secondary matter to sit on. */
.sr-whywrap{margin-top:var(--sp2);padding:var(--sp2);background:var(--pa2)}
.sr-whylab{font:var(--ty-label);letter-spacing:var(--ty-label-ls);text-transform:uppercase;
           color:var(--mut);margin-bottom:6px}
.sr-why{font:var(--ty-sec);color:var(--ink)}
.sr-next{margin-top:var(--sp3);min-height:52px;width:100%;background:var(--ink);color:var(--pa);
         border:1px solid var(--ink);font:var(--ty-body);font-weight:700;cursor:pointer;
         transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-next:hover{opacity:.86}}

/* ── The verdict. Lands, does not bounce. ───────────────────────────── */
.sr-verd{animation:sr-land .5s var(--ease) both}
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

/* ── FAQ. Native details/summary — keyboard and screen-reader behaviour
   for free, no state. Hairline rules, no cards, per the world. ────────── */
.sr-faq{max-width:860px;margin:0 auto;padding:var(--sp5) var(--sp3) var(--sp4);
        border-top:1px solid var(--bd)}
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

/* ── The Club Index. Desk ground, between the report and the footer. ──
   DESIGN.md spec: club name, DOTTED LEADER, competition; two columns above
   760px; hover highlight on non-touch only. Three earlier variants were
   killed by the finish review and stay dead: no question count (contradicts
   "same depth for Hajduk Split as for Real Madrid"), no colour swatches
   (a second palette in a world whose only saturation is the ramp), no era
   range (its years were mostly distractors). The competition column is the
   checkable replacement — hand-verified in club-competition.mjs. */
.sr-clubs{max-width:860px;margin:0 auto;padding:var(--sp5) var(--sp3);
          border-top:1px solid var(--bd)}
.sr-h2{font:var(--ty-section);letter-spacing:var(--ty-section-ls);
       text-transform:uppercase;color:var(--tx);text-wrap:balance}
.sr-clsub{margin-top:var(--sp2);font:var(--ty-sub);color:var(--on-desk);max-width:58ch}
.sr-idx{margin-top:var(--sp3);column-count:1;column-gap:var(--sp5)}
@media (min-width:760px){.sr-idx{column-count:2}}
/* Anchors in a multicol container: block + break-inside, or a row can split
   across columns mid-leader. */
.sr-row{display:flex;align-items:baseline;gap:10px;min-height:36px;
        break-inside:avoid;padding:6px 0;color:var(--on-desk);
        font:var(--ty-sec)}
@media (pointer:coarse){.sr-row{min-height:44px;padding:10px 0}}
.sr-cn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}
.sr-ld{flex:1;min-width:16px;border-bottom:1px dotted var(--bd3);
       transform:translateY(-4px)}
.sr-cc{white-space:nowrap;font:var(--ty-meta);color:var(--on-desk-mut)}
@media (hover:hover){
  .sr-row:hover{color:var(--tx)}
  .sr-row:hover .sr-ld{border-bottom-color:var(--on-desk-mut)}
}
.sr-more{display:inline-flex;align-items:center;min-height:48px;margin-top:var(--sp3);
         padding:12px var(--sp3);border:1px solid var(--bd3);color:var(--tx);
         font:var(--ty-sec);font-weight:700;
         transition:background-color .15s var(--ease)}
@media (hover:hover){.sr-more:hover{background:var(--card)}}

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

export default function ScoutingReport() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  // One slot per question: true/false once answered, null = not assessed.
  // This IS "the report writes itself" — the lede's promise, previously
  // unkept: the page replaced each question and only the tally survived.
  const [results, setResults] = useState(() => QS.map(() => null));
  // Terminal data via ref: the final answer is read in the same tick it is
  // written, and a state read there would see the previous render's value.
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QS[i];
  const answered = picked !== null;

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

      {/* The promise retires once it has been kept. Leaving "Five questions.
          One honest verdict." standing above a FILED verdict sells the reader
          something they have already done, and pushes the actual result down
          the page on a phone. */}
      {!done && (
        <div className="sr-open">
          <h1 className="sr-h1"><span>Five questions.</span><span>One honest verdict.</span></h1>
          <p className="sr-lede">
            No account, nothing to install. The report writes itself while you answer.
          </p>
        </div>
      )}

      <main className="sr-sheet" id="report">
        {/* The subject sits in the document HEADER, not above the question.
            A tracked uppercase label as its own block directly above a
            heading is a kicker, which craft-floor bans outright — and the
            detector caught it at 1280 even though 375 happened not to trip
            it. Moving it here is also truer to the form: a real scouting
            report names its subject in the header, not over every line. */}
        <div className="sr-head">
          <div className="sr-title">Scouting Report</div>
          <div className="sr-no">{!done && <>{q.d} · </>}No. {getFootleNumber()}</div>
        </div>

        {!done ? (
          <>
            <table className="sr-stub">
              <caption className="sr-vh">The report so far, by discipline</caption>
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

            <h2 className="sr-q">{q.q}</h2>

            <div className="sr-opts">
              {q.o.map((opt, k) => {
                const mark = !answered ? null : k === q.a ? 'hit' : k === picked ? 'miss' : null;
                return (
                  <button
                    key={k}
                    className="sr-opt"
                    data-mark={mark || undefined}
                    disabled={answered}
                    onClick={() => choose(k)}
                  >
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
          </>
        ) : (
          <div className="sr-verd">
            <table className="sr-stub">
              <caption className="sr-vh">The completed report, by discipline</caption>
              <tbody>
                {QS.map((qq, k) => (
                  <tr key={k}>
                    <th scope="row">{qq.d}</th>
                    <td>{results[k] !== null && (
                      <span className="sr-bar"><i data-on={results[k] === true ? 1 : 0} /></span>
                    )}</td>
                    <td className="sr-out" data-r={results[k] === true ? 'yes' : 'no'}>
                      {results[k] === true ? '1 of 1' : '0 of 1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sr-score" style={{ color: band.v, marginTop: 'var(--sp3)' }}>{score} / {QS.length}</div>
            <div className="sr-band" style={{ color: band.v }}>{band.t}</div>
            <p className="sr-bsub">{band.s}</p>

            <div className="sr-keep">
              <div className="sr-keept">Keep this report</div>
              {/* The audit's draft line was "web has ads, the app doesn't" —
                  currently FALSE: AdSense is unapproved and every slot is
                  commented out. The claim that IS true: native push. Reminders
                  shipped in 1.3.3 and are live. Multiplayer capacity is the
                  resolved figure — online up to 8. */}
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
              {/* "nothing to install" rather than "no install." avoided an
                  orphaned full stop on its own line at 375px. */}
              <p className="sr-web">
                Or <a href={GET_APP}>keep going in the browser</a> — same test, nothing to install
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 72 real links to the pages carrying the site's growth — this section
          took the component from 0 internal club links to 72. The copy is the
          approved mockup's, not new writing; the heading count is generated
          so it cannot silently go stale when a wave lands. */}
      <section className="sr-clubs" aria-labelledby="srClubsT">
        <h2 className="sr-h2" id="srClubsT">{CLUB_HEADING}</h2>
        <p className="sr-clsub">
          Hajduk Split get the same treatment as Real Madrid. Every question in both files went
          through the same checks before it was let in, and most of them tell you why the answer
          is the answer.
        </p>
        <div className="sr-idx">
          {CLUB_INDEX.map((r) => (
            <a key={r.s} className="sr-row" href={`/quiz/${r.s}/`}>
              <span className="sr-cn">{r.n}</span>
              <span className="sr-ld" aria-hidden="true" />
              <span className="sr-cc">{r.c}</span>
            </a>
          ))}
        </div>
        <a className="sr-more" href="/quiz/">Open the full club index</a>
      </section>

      <section className="sr-faq" aria-labelledby="srFaqT">
        <h2 className="sr-h2" id="srFaqT">Common questions</h2>
        <div style={{ marginTop: 'var(--sp2)' }}>
          {FAQS.map((f, i) => (
            <details key={i}>
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
      </section>

      {/* The page ends on tomorrow: the Footle band closes it, and the last
          thing inside is the countdown. Order is the direction contract's. */}
      <FootleBand />

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
