// The Scouting Report homepage — seed cf2f8891, ported from
// docs/mockups/scouting-d.html.
//
// Lives at /home-preview. `/` still renders MarketingHome, untouched, so the
// page that is currently converting carries none of this risk while it is
// judged on a real phone.
//
// THE THESIS, from the direction contract, because every decision below is
// downstream of it: the page is not ABOUT a football test. The page IS the
// test, and it files a report on you. It refuses the category's dark hero,
// phone mockup and feature-card triptych.
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

const GET_APP = '/get';
const PLAY = '/play';

// The five questions, carried over verbatim from the approved mockup so the
// port is a port and not a rewrite. `a` is an INDEX into `o`, never the answer
// string — the bank's oldest trap, and the reason `why` is checked against
// o[a] below rather than against a remembered string.
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
// exactly what the six-step --v ramp is for. The wording grades honestly:
// the direction's whole promise is a verdict you can trust, so 0/5 does not
// get a consolation prize.
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

/* ── The desk: chrome. Green survives HERE and only here. ───────────── */
.sr-mast{display:flex;align-items:center;justify-content:space-between;gap:var(--sp2);
         padding:var(--sp2) var(--sp3);border-bottom:1px solid var(--bd)}
.sr-mark{font-family:'Archivo Narrow',sans-serif;font-weight:700;font-size:21px;
         letter-spacing:.02em;color:var(--tx);text-transform:uppercase}
.sr-mark em{font-style:normal;color:var(--grn)}
.sr-play{display:inline-flex;align-items:center;min-height:44px;padding:0 var(--sp3);
         background:var(--grn);color:var(--grn-ink);font-weight:700;font-size:15px;
         border:1px solid var(--grn);transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-play:hover{opacity:.88}}

/* ── The lede sits on the desk, not on the paper. ───────────────────── */
.sr-open{padding:var(--sp5) var(--sp2) var(--sp4);max-width:760px;margin:0 auto;text-align:center}
@media (min-width:520px){.sr-open{padding-left:var(--sp3);padding-right:var(--sp3)}}
/* The contract specifies a TWO-line headline. At 375px it was rendering three:
   "ONE HONEST VERDICT." wrapped. Measured in the browser rather than guessed —
   34px was the largest size holding two lines inside the old 331px of content
   width, so the mobile gutter drops to --sp2 to buy back 16px and the clamp is
   set just under what that width supports. Re-measure if the copy changes. */
.sr-h1{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;
       color:var(--tx);line-height:.94;letter-spacing:.005em;text-wrap:balance;
       font-size:clamp(30px,9.3vw,74px)}
.sr-h1 span{display:block}
.sr-lede{margin-top:var(--sp2);font-size:17px;line-height:1.5;color:var(--tx4);
         max-width:46ch;margin-left:auto;margin-right:auto}

/* ── The paper. A lit document lying on the desk. ───────────────────── */
/* The sheet needs DESK VISIBLE AROUND IT or the concept collapses: full-bleed
   paper reads as "a section with a light background", not as a document lying
   on a surface. It was bleeding edge-to-edge at 375px — i.e. on 66% of the
   traffic, the one idea the direction is built on was invisible. */
.sr-sheet{max-width:660px;margin:0 var(--sp2) var(--sp6);background:var(--pa);color:var(--ink);
          padding:var(--sp4) var(--sp3);box-shadow:0 18px 50px rgba(0,0,0,.55)}
@media (min-width:700px){.sr-sheet{margin:0 auto var(--sp6);padding:var(--sp5)}}
@media (min-width:520px) and (max-width:699px){.sr-sheet{margin:0 var(--sp3) var(--sp6)}}

.sr-head{display:flex;align-items:baseline;justify-content:space-between;gap:var(--sp2);
         padding-bottom:var(--sp1);border-bottom:2px solid var(--ink)}
.sr-title{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;
          font-size:19px;letter-spacing:.03em}
.sr-no{font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:var(--mut)}

.sr-prog{display:flex;gap:6px;margin:var(--sp2) 0 var(--sp3)}
.sr-pip{height:3px;flex:1;background:var(--rule)}
.sr-pip[data-on="1"]{background:var(--ink)}

.sr-dept{font-size:11.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--mut);
         font-weight:700}
.sr-q{margin-top:var(--sp1);font-size:21px;line-height:1.3;font-weight:600;text-wrap:balance}
@media (min-width:700px){.sr-q{font-size:24px}}

.sr-opts{margin-top:var(--sp3);display:flex;flex-direction:column}
.sr-opt{display:flex;align-items:center;gap:var(--sp2);width:100%;text-align:left;
        min-height:52px;padding:var(--sp1) var(--sp1) var(--sp1) 0;background:none;
        border:0;border-top:1px solid var(--rule);color:var(--ink);font:inherit;
        font-size:16.5px;cursor:pointer;transition:background-color .12s var(--ease)}
.sr-opt:last-child{border-bottom:1px solid var(--rule)}
.sr-opt:disabled{cursor:default}
@media (hover:hover){.sr-opt:not(:disabled):hover{background:var(--pa2)}}
.sr-key{flex:0 0 auto;width:26px;height:26px;display:grid;place-items:center;
        border:1px solid var(--rule2);font-size:12px;font-weight:700;color:var(--mut)}
.sr-opt[data-mark="hit"] .sr-key{background:var(--v5);border-color:var(--v5);color:var(--pa)}
.sr-opt[data-mark="miss"] .sr-key{background:var(--v0);border-color:var(--v0);color:var(--pa)}
.sr-opt[data-mark="hit"]{font-weight:700}
.sr-opt[data-mark="miss"]{color:var(--mut)}

.sr-why{margin-top:var(--sp2);padding:var(--sp2);background:var(--pa2);
        border-left:3px solid var(--ink);font-size:15px;line-height:1.5;color:var(--ink)}
.sr-next{margin-top:var(--sp3);min-height:50px;width:100%;background:var(--ink);color:var(--pa);
         border:1px solid var(--ink);font:inherit;font-weight:700;font-size:16px;cursor:pointer;
         transition:opacity .15s var(--ease)}
@media (hover:hover){.sr-next:hover{opacity:.86}}

/* ── The verdict. Lands, does not bounce. ───────────────────────────── */
.sr-verd{animation:sr-land .5s var(--ease) both}
@keyframes sr-land{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.sr-verd{animation:none}}
.sr-score{font-family:'Archivo Narrow',sans-serif;font-weight:700;font-size:64px;line-height:1;
          text-transform:uppercase}
.sr-band{margin-top:var(--sp1);font-family:'Archivo Narrow',sans-serif;font-weight:700;
         text-transform:uppercase;font-size:30px;line-height:1.05}
.sr-bsub{margin-top:6px;font-size:16px;line-height:1.5;color:var(--mut);max-width:44ch}
.sr-keep{margin-top:var(--sp3);padding-top:var(--sp3);border-top:2px solid var(--ink)}
.sr-keept{font-family:'Archivo Narrow',sans-serif;font-weight:700;text-transform:uppercase;
          font-size:19px;letter-spacing:.03em}
.sr-keepp{margin-top:6px;font-size:15px;line-height:1.5;color:var(--mut);max-width:46ch}
.sr-links{margin-top:var(--sp2);display:flex;gap:var(--sp1);flex-wrap:wrap}
.sr-a{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 var(--sp3);
      border:1px solid var(--ink);font-weight:700;font-size:15.5px;
      transition:background-color .15s var(--ease),color .15s var(--ease)}
.sr-a span{font-weight:400;font-size:13px;color:var(--mut)}
@media (hover:hover){.sr-a:hover{background:var(--ink);color:var(--pa)}
                     .sr-a:hover span{color:var(--pa3)}}
@media (max-width:520px){.sr-a{width:100%;justify-content:space-between}}
.sr-web{margin-top:var(--sp2);font-size:14.5px;color:var(--mut)}
.sr-web a{text-decoration:underline;text-underline-offset:3px;font-weight:700;color:var(--ink)}

.sr-foot{padding:var(--sp4) var(--sp3) var(--sp5);text-align:center;font-size:13.5px;
         color:var(--tx4);border-top:1px solid var(--bd)}
`;

/** One question, or the verdict once all five are answered. */
export default function ScoutingReport() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
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
    if (k === QS[i].a) { scoreRef.current += 1; setScore(scoreRef.current); }
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

      <header className="sr-mast">
        <a className="sr-mark" href="/" aria-label="Ball IQ home">Ball <em>IQ</em></a>
        <a className="sr-play" href={PLAY}>Play free</a>
      </header>

      {/* The promise retires once it has been kept. Leaving "Five questions.
          One honest verdict." standing above a FILED verdict is a stale
          headline selling something the reader has already done — and it
          pushes the actual result down the page on a phone. */}
      {!done && (
        <div className="sr-open">
          <h1 className="sr-h1"><span>Five questions.</span><span>One honest verdict.</span></h1>
          <p className="sr-lede">
            No account, nothing to install. The report writes itself while you answer.
          </p>
        </div>
      )}

      <main className="sr-sheet">
        <div className="sr-head">
          <div className="sr-title">Scouting Report</div>
          <div className="sr-no">No. {getFootleNumber()}</div>
        </div>

        {!done ? (
          <>
            <div className="sr-prog" role="group" aria-label={`Question ${i + 1} of ${QS.length}`}>
              {QS.map((_, k) => <span key={k} className="sr-pip" data-on={k <= i ? 1 : 0} />)}
            </div>

            <div className="sr-dept">{q.d}</div>
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
                <p className="sr-why" role="status">{q.why}</p>
                <button className="sr-next" onClick={next}>
                  {i + 1 >= QS.length ? 'See the verdict' : 'Next question'}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="sr-verd">
            <div className="sr-score" style={{ color: band.v }}>{score} / {QS.length}</div>
            <div className="sr-band" style={{ color: band.v }}>{band.t}</div>
            <p className="sr-bsub">{band.s}</p>

            <div className="sr-keep">
              <div className="sr-keept">Keep this report</div>
              <p className="sr-keepp">
                The full test scores you 60 to 160 and remembers it. Your streak, your clubs,
                your card.
              </p>
              <div className="sr-links">
                <a className="sr-a" href={APP_STORE}>iPhone<span>App Store</span></a>
                <a className="sr-a" href={PLAY_STORE_URL}>Android<span>Google Play</span></a>
              </div>
              {/* "no install" rather than "no install." avoided an orphaned
                  full stop on its own line at 375px. */}
              <p className="sr-web">
                Or <a href={GET_APP}>keep going in the browser</a> — same test, nothing to install
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="sr-foot">Ball IQ — free football trivia, every day.</footer>
    </div>
  );
}
