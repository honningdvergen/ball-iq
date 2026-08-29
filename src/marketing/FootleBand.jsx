// The Footle band — item 2 of swap-ready. "The page ends on tomorrow rather
// than on a footer": this band closes the page, and the LAST thing in it is
// the countdown to the next puzzle. That ordering is the direction contract's,
// not a layout preference.
//
// THE BOARD IS A PAST PUZZLE, NEVER TODAY'S. footlePractice.js is generated
// at build time from the frozen answer log (~30 days back), so nothing about
// tonight's game is given away and the mockup's hardcoded ANSWER='ALISSON'
// bug cannot recur. The grader is the app's own gradeWordleGuess, emitted via
// toString() with a build-time round-trip check — do not reimplement scoring
// here; duplicate letters WILL drift.
//
// DESIGN.md rules encoded below, so they read as intent rather than accident:
//   · Tile/key states share the Scout's Ramp exactly: --v5 = right place,
//     --attr-mid = in the word (with --attr-mid-ink text — the amber is never
//     ink itself), and "not in it" is a SOLID near-black distinct from an
//     unplayed tile, which was found to read as the same "nothing happened".
//   · A used key recedes by solid colour, not opacity.
//   · An invalid submit shakes and SAYS so — never silently does nothing.
//   · The clock has no label. Every state of the note line continues from a
//     number ("23:41:08 / until ..."), so each branch below starts mid-
//     sentence on purpose.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FP_ANSWER, FP_FULL, FP_NUMBER, gradeGuess } from './footlePractice.js';

const ROWS = 6;
const LEN = FP_ANSWER.length;
const KB = ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'];

const CSS = `
.fb{background:var(--card2);background-image:var(--grain);border-top:1px solid var(--bd)}
.fb-in{max-width:1000px;margin:0 auto;padding:var(--sp5) 28px}
/* The mockup's band is a 470px board column and a 422px rail (legend, status,
   clock) — the first port stacked everything into one long column and left
   half the width empty. */
.fb-cols{display:grid;grid-template-columns:1fr;gap:var(--sp4)}
@media (min-width:1000px){.fb-cols{grid-template-columns:470px 1fr;align-items:start}}
.fb-legend{display:flex;flex-direction:column;gap:8px;margin-top:var(--sp3)}
@media (min-width:1000px){.fb-legend{margin-top:0}}
.fb-li{display:flex;align-items:center;gap:10px;font:var(--ty-sec);color:var(--on-desk)}
.fb-sw{flex:0 0 auto;width:18px;height:18px;border:1px solid var(--bd3)}
.fb-sw[data-k="green"]{background:var(--v5);border-color:var(--v5)}
.fb-sw[data-k="yellow"]{background:var(--attr-mid);border-color:var(--attr-mid)}
.fb-sw[data-k="grey"]{background:var(--bd);border-color:var(--bd)}
.fb-six{margin-top:var(--sp1);font:var(--ty-sec);font-weight:700;color:var(--tx)}
.fb-h2{font:var(--ty-section);letter-spacing:var(--ty-section-ls);
       text-transform:uppercase;color:var(--tx);text-wrap:balance}
.fb-sub{margin-top:var(--sp2);font:var(--ty-sub);color:var(--on-desk);max-width:58ch}

.fb-eg{margin-top:var(--sp3)}
.fb-eglab{font:var(--ty-sec);color:var(--on-desk-mut)}
.fb-eglab b{color:var(--on-desk);font-weight:700}

.fb-note{margin-top:var(--sp3);font:var(--ty-meta);color:var(--on-desk-mut);max-width:52ch}

.fb-grid{margin-top:var(--sp1);display:grid;gap:6px;justify-content:start}
.fb-tile{width:52px;height:52px;display:grid;place-items:center;
         font:700 22px/1 'Archivo Narrow',sans-serif;text-transform:uppercase;
         border:1px solid var(--bd3);color:var(--tx)}
/* Small screens: the TRACK owns the size (9.5vw), the tile fills it — a
   fixed 44px here overlapped neighbouring tracks by ~8px once the answer
   length hit 7. aspect-ratio keeps them square at any track width. */
@media (max-width:520px){.fb-tile{width:auto;height:auto;aspect-ratio:1;font-size:17px}}
.fb-tile[data-m="green"]{background:var(--v5);border-color:var(--v5);color:var(--tx)}
.fb-tile[data-m="yellow"]{background:var(--attr-mid);border-color:var(--attr-mid);
                          color:var(--attr-mid-ink)}
.fb-tile[data-m="grey"]{background:var(--bd);border-color:var(--bd);color:var(--tx3)}
.fb-tile[data-cur="1"]{border-color:var(--on-desk-mut)}
.fb-grid[data-shake="1"]{animation:fb-shake .28s var(--ease)}
@keyframes fb-shake{20%{transform:translateX(-6px)}45%{transform:translateX(5px)}
                    70%{transform:translateX(-3px)}100%{transform:none}}
@media (prefers-reduced-motion:reduce){.fb-grid[data-shake="1"]{animation:none}}

.fb-say{margin-top:var(--sp2);min-height:22px;font:var(--ty-sec);color:var(--on-desk);max-width:52ch}
.fb-say b{color:var(--tx)}

.fb-kb{margin-top:var(--sp2);display:flex;flex-direction:column;gap:6px;max-width:520px}
.fb-kr{display:flex;gap:5px}
.fb-k{flex:1;min-height:48px;padding:10px 0;background:var(--card);color:var(--tx);
      border:1px solid var(--bd3);font:700 14px/1 Archivo,system-ui,sans-serif;
      cursor:pointer;transition:background-color .1s var(--ease)}
.fb-k[data-wide="1"]{flex:1.6;font-size:12px;letter-spacing:.06em}
.fb-k[data-m="green"]{background:var(--v5);border-color:var(--v5);color:var(--tx)}
.fb-k[data-m="yellow"]{background:var(--attr-mid);border-color:var(--attr-mid);
                       color:var(--attr-mid-ink)}
.fb-k[data-m="grey"]{background:var(--bg);border-color:var(--bd);color:var(--tx4)}
@media (hover:hover){.fb-k:not([data-m]):hover{background:var(--bd2)}}

.fb-real{display:inline-flex;align-items:center;min-height:48px;margin-top:var(--sp3);
         padding:12px var(--sp3);border:1px solid var(--bd3);border-radius:var(--rc);color:var(--tx);
         font:var(--ty-sec);font-weight:700;
         transition:background-color .15s var(--ease)}
.fb-real.fb-primary{background:#58CC02;border-color:#58CC02;color:#06230C}
@media (hover:hover){.fb-real.fb-primary:hover{background:#4CB102}}
@media (hover:hover){.fb-real:hover{background:var(--card)}}

.fb-clock{margin-top:var(--sp4);padding-top:var(--sp3);border-top:1px solid var(--bd)}
.fb-time{font:700 clamp(44px,9vw,72px)/1 'Archivo Narrow',sans-serif;color:var(--tx);
         font-variant-numeric:tabular-nums;letter-spacing:.01em}
.fb-cnote{margin-top:6px;font:var(--ty-sec);color:var(--on-desk-mut);max-width:52ch}
`;

/** ms until the next local midnight. */
function msToMidnight(now) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export default function FootleBand() {
  const [guesses, setGuesses] = useState([]);
  const [cur, setCur] = useState('');
  const [say, setSay] = useState('');
  const [shake, setShake] = useState(false);
  const done = guesses.length > 0 && guesses[guesses.length - 1] === FP_ANSWER;
  const out = !done && guesses.length >= ROWS;
  const over = done || out;

  // Key colouring: green beats yellow beats grey, across all guesses.
  const keyMarks = {};
  for (const g of guesses) {
    const marks = gradeGuess(g, FP_ANSWER);
    for (let i = 0; i < LEN; i++) {
      const k = g[i]; const m = marks[i];
      const rank = { green: 3, yellow: 2, grey: 1 };
      if (!keyMarks[k] || rank[m] > rank[keyMarks[k]]) keyMarks[k] = m;
    }
  }

  const submit = useCallback(() => {
    if (over) return;
    if (cur.length !== LEN) {
      setShake(true);
      // Playing it surfaced the first draft of this line saying "4 letters —
      // this one is a 4-letter surname": the same fact twice. State the gap.
      setSay(cur.length === 0 ? `Needs ${LEN} letters.` : `That's ${cur.length} of ${LEN} letters.`);
      return;
    }
    const next = [...guesses, cur];
    setGuesses(next);
    setCur('');
    if (cur === FP_ANSWER) setSay(`Got it. ${FP_FULL}.`);
    else if (next.length >= ROWS) setSay(`It was ${FP_FULL}. Tomorrow's is a fresh one.`);
    else setSay('');
  }, [cur, guesses, over]);

  const type = useCallback((ch) => {
    if (over) return;
    if (ch === '⏎') return submit();
    if (ch === '⌫') return setCur((c) => c.slice(0, -1));
    setCur((c) => (c.length < LEN ? c + ch : c));
  }, [over, submit]);

  // Physical keyboard — but never while a modifier is held, or Cmd+R types an
  // R into the board on its way to reloading the page.
  useEffect(() => {
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') { submit(); return; }
      if (e.key === 'Backspace') { setCur((c) => c.slice(0, -1)); return; }
      if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toUpperCase());
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [submit, type]);

  // The countdown. Self-correcting: if the page lives across midnight, the
  // note swaps to "reload" rather than counting from a stale target.
  const mountDay = useRef(new Date().getDate());
  const [left, setLeft] = useState(() => msToMidnight(new Date()));
  const [rolled, setRolled] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== mountDay.current) { setRolled(true); return; }
      setLeft(msToMidnight(now));
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(Math.floor(left / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((left % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');

  // The teaching strip grades with the SAME function as the board.
  const egMarks = gradeGuess('LAPORTE', 'HAALAND');

  return (
    <section className="fb" aria-labelledby="fbT">
      <style>{CSS}</style>
      <div className="fb-in">
        <h2 className="fb-h2" id="fbT">Footle. Football Wordle.</h2>
        <p className="fb-sub">
          Guess the name a footballer goes by, in six. It resets at midnight, along with the
          Daily 7 — the same seven questions for everybody in the world, which is the
          only reason a score is worth arguing about.
        </p>

        <div className="fb-eg" aria-hidden="true">
          <div className="fb-eglab">If you guessed <b>Laporte</b> and the answer was <b>Haaland</b>:</div>
          <div className="fb-grid" style={{ gridTemplateColumns: 'repeat(7, min(44px, 9.5vw))' }}>
            {'LAPORTE'.split('').map((ch, i) => (
              <span key={i} className="fb-tile" data-m={egMarks[i]}
                style={{ width: 'auto', height: 'auto', aspectRatio: '1', fontSize: 15 }}>{ch}</span>
            ))}
          </div>
        </div>

        <div className="fb-cols">
        <div>
        <p className="fb-note">
          {/* "an 8-letter", "an 11-letter" — the article follows the SOUND of the
              number, so it cannot be hard-coded while LEN varies. */}
          Try No. {FP_NUMBER} from the archive — {/^(8|11|18)$/.test(String(LEN)) ? 'an' : 'a'} {LEN}-letter name, and nothing about
          tonight’s is given away.
        </p>

        <div className="fb-grid" style={{ gridTemplateColumns: 'repeat(' + LEN + ', min(52px, 9.5vw))' }}
             role="group" aria-label={`Practice Footle board, six guesses of ${LEN} letters`}
             data-shake={shake ? 1 : undefined}
             onAnimationEnd={() => setShake(false)}>
          {Array.from({ length: ROWS }).map((_, r) => {
            const g = guesses[r];
            const isCur = r === guesses.length && !over;
            const marks = g ? gradeGuess(g, FP_ANSWER) : null;
            return (
              <React.Fragment key={r}>
                {Array.from({ length: LEN }).map((_, c) => (
                  <span key={c}
                    className="fb-tile"
                    data-m={marks ? marks[c] : undefined}
                    data-cur={isCur && c === cur.length ? 1 : undefined}
                  >{g ? g[c] : isCur ? (cur[c] || '') : ''}</span>
                ))}
              </React.Fragment>
            );
          })}
        </div>

        <p className="fb-say" role="status">{say}</p>

        <div className="fb-kb" role="group" aria-label="On-screen keyboard">
          {KB.map((row, i) => (
            <div className="fb-kr" key={i}>
              {row.split('').map((k) => (
                <button key={k} type="button" className="fb-k"
                  data-wide={k === '⏎' || k === '⌫' ? 1 : undefined}
                  data-m={keyMarks[k]}
                  aria-label={k === '⏎' ? 'Enter' : k === '⌫' ? 'Delete' : k}
                  onClick={() => type(k)}
                >{k === '⏎' ? 'ENTER' : k === '⌫' ? 'DEL' : k}</button>
              ))}
            </div>
          ))}
        </div>

        {/* Two doors, one band: the sub already introduced the Daily 7, so
            its door lives beside Footle's rather than in a section of its own. */}
        <div style={{ display: 'flex', gap: 'var(--sp1)', flexWrap: 'wrap' }}>
          <a className="fb-real fb-primary" href="/footle">Play today’s Footle</a>
          <a className="fb-real" href="/play?game=daily">Play the Daily 7</a>
        </div>
        </div>

        <div className="fb-legend" aria-hidden="true">
          <div className="fb-li"><span className="fb-sw" data-k="green" />Right letter, right place</div>
          <div className="fb-li"><span className="fb-sw" data-k="yellow" />In the name, wrong place</div>
          <div className="fb-li"><span className="fb-sw" data-k="grey" />Not in it</div>
          <div className="fb-six">Six guesses.</div>
          <div className="fb-clock">
            <div className="fb-time" aria-hidden="true">{rolled ? '00:00:00' : hh + ':' + mm + ':' + ss}</div>
            <p className="fb-cnote">
              {rolled
                ? '0 seconds — the new board is up. Reload for today’s name and seven new questions.'
                : 'until a new name and seven new questions, the same for everybody.'}
            </p>
          </div>
        </div>
        </div>

      </div>
    </section>
  );
}
