// A playable Transfer Trail for the /transfer-trail/ landing page.
//
// ⚠️ WHY THIS EXISTS. The landing page described the game and gave you nothing
// to do — read on the live site as "there is no actual game to play here
// either", about the sibling page. Footle's landing page holds a real board
// and /xi/ IS the game; Trail was a brochure, on the URL that catches
// "guess the player by transfers". Clarity measured the cost of that shape:
// reference pages with nothing to do held ~2.3 seconds.
//
// ⚠️ A PAST TRAIL, NEVER TODAY'S. Same rule as the Footle practice board: the
// answer has to reach the browser to be graded, so putting today's puzzle here
// would hand the daily answer to anyone who opens the page source — including
// the players who came from the app. This uses a finished trail from the
// archive, and says so on the page.
//
// The answer is cloaked with the same reversible transform as the Footle board.
// That is obfuscation, not security, and deliberately so: it stops the answer
// being readable at a glance in devtools, and nothing more is warranted for a
// puzzle that is already public.
import { TRAIL_PLAYERS, TRAIL_MAX_ATTEMPTS, acceptedNamesFor } from '../../src/lib/trail.js';

const cloak = (s) =>
  Buffer.from(encodeURIComponent(String(s).split('').reverse().join('')), 'utf8').toString('base64');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ⚠️ FIXED INDEX, NOT A ROTATION. A trail that changed with the build date
// would make the page's own copy ("a finished trail from the archive") drift,
// and would silently invalidate anyone's shared result. Index 1 is Bale:
// six clubs including a loan and a return, so the board demonstrates both
// rules the game is built on.
const PRACTICE_INDEX = 1;

export function trailBoardHtml() {
  const p = TRAIL_PLAYERS[PRACTICE_INDEX];
  if (!p || !Array.isArray(p.clubs) || p.clubs.length < 3) return '';
  const names = acceptedNamesFor(p);
  const rungs = p.clubs.map((c, i) => ({ c, loan: !!(p.loans && p.loans[i]) }));

  const rungHtml = rungs.map((r, i) => `<li class="tb-rung${i === 0 ? ' shown' : ''}" data-i="${i}">
<span class="tb-dot" aria-hidden="true"></span>
<span class="tb-club">${esc(r.c)}</span>${r.loan ? '<span class="tb-loan">loan</span>' : ''}
</li>`).join('\n');

  return `<section class="sec tb-wrap" id="practice" aria-labelledby="tb-h">
<div class="tb-eyebrow">Practice trail · from the archive</div>
<h2 id="tb-h">Play a Transfer Trail right here</h2>
<p class="tb-lede">A finished trail you can replay as often as you like — name the player from his career path. Each club you reveal makes it easier. Nothing here spoils <a href="https://balliq.app/play?game=trail">today's trail</a>, which everyone gets at midnight.</p>
<div class="tb-card" id="tb-game" data-a="${cloak(names.join('|'))}" data-n="${rungs.length}">
<ol class="tb-list">
${rungHtml}
</ol>
<div class="tb-bar">
<input id="tb-guess" type="text" placeholder="Name the player…" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Name the player">
<button type="button" class="tb-go" id="tb-go">Guess</button>
</div>
<div class="tb-meta">
<button type="button" class="tb-reveal" id="tb-reveal">Reveal next club</button>
<span class="tb-left" id="tb-left">${TRAIL_MAX_ATTEMPTS} guesses left</span>
</div>
<p class="tb-msg" id="tb-msg" role="status" aria-live="polite"></p>
</div>
<noscript><p class="tb-ns">This practice trail needs JavaScript. <a href="https://balliq.app/play?game=trail">Play today's trail</a> instead.</p></noscript>
</section>`;
}

export const TRAIL_BOARD_CSS = `  .tb-wrap.sec{padding-top:0;margin-top:-26px}
  @media (max-width:700px){ .tb-wrap.sec{margin-top:-18px} }
  .tb-eyebrow{font:700 11px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);margin-bottom:10px}
  .tb-lede{font-size:15.5px;line-height:1.6;color:#9BA0B8;max-width:62ch;margin:0 0 18px}
  .tb-card{background:#181A22;border:1px solid #222634;border-radius:16px;padding:18px 18px 16px;max-width:560px}
  .tb-list{list-style:none;margin:0 0 16px;padding:0;display:flex;flex-direction:column;gap:0}
  .tb-rung{display:flex;align-items:center;gap:12px;padding:11px 0;position:relative;opacity:.28;
    filter:blur(4px);transition:opacity .28s,filter .28s}
  .tb-rung.shown{opacity:1;filter:none}
  .tb-rung::before{content:"";position:absolute;left:5px;top:26px;bottom:-11px;width:2px;background:#242730}
  .tb-rung:last-child::before{display:none}
  .tb-dot{width:12px;height:12px;border-radius:50%;background:#2F3240;border:2px solid #3A3F52;flex:0 0 auto}
  .tb-rung.shown .tb-dot{background:var(--grn);border-color:var(--grn)}
  .tb-club{font-size:15.5px;font-weight:700;color:#fff}
  .tb-loan{font:700 10px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;
    color:var(--tx3);border:1px solid #2F3240;border-radius:999px;padding:3px 7px}
  .tb-bar{display:flex;gap:8px}
  #tb-guess{flex:1;min-width:0;background:#1B1E27;border:1px solid #2F3240;border-radius:12px;padding:12px 14px;
    color:#fff;font-size:16px;font-family:inherit;outline:none}
  #tb-guess:focus{border-color:var(--grn)}
  .tb-go{flex:0 0 auto;padding:0 18px;min-height:44px;border:0;border-radius:12px;background:var(--grn);
    color:var(--grn-ink);font-weight:800;font-size:14px;font-family:inherit;cursor:pointer}
  .tb-go[disabled],.tb-reveal[disabled]{background:#1B1E27;color:var(--tx3);cursor:default;border-color:#2F3240}
  .tb-meta{display:flex;align-items:center;gap:12px;margin-top:11px}
  .tb-reveal{background:none;border:1px solid #2F3240;border-radius:10px;min-height:40px;padding:0 13px;
    color:var(--tx2);font-weight:700;font-size:13px;font-family:inherit;cursor:pointer}
  .tb-reveal:hover{border-color:var(--grn);color:#fff}
  .tb-left{margin-left:auto;font-size:13px;color:var(--tx3)}
  .tb-msg{margin:12px 0 0;font-size:14.5px;color:var(--tx2);min-height:20px}
  .tb-msg.win{color:var(--grn-soft);font-weight:700}
  .tb-msg.lose{color:#FF8A8E;font-weight:700}
  .tb-ns{color:var(--tx3);font-size:14px}
`;

export const TRAIL_BOARD_JS = `(function(){
var g=document.getElementById('tb-game'); if(!g) return;
function unc(s){try{return decodeURIComponent(atob(s)).split('').reverse().join('');}catch(e){return '';}}
var names=unc(g.getAttribute('data-a')).split('|').filter(Boolean);
var total=parseInt(g.getAttribute('data-n'),10)||0;
var shown=1, left=${TRAIL_MAX_ATTEMPTS}, over=false;
var inp=document.getElementById('tb-guess'), go=document.getElementById('tb-go');
var rev=document.getElementById('tb-reveal'), msg=document.getElementById('tb-msg'), leftEl=document.getElementById('tb-left');
function norm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\\s+/g,' ').trim();}
var accept={}; for(var i=0;i<names.length;i++) accept[norm(names[i])]=1;
function reveal(){ if(shown>=total) return false;
  var el=g.querySelector('.tb-rung[data-i="'+shown+'"]'); if(el) el.classList.add('shown');
  shown++; if(shown>=total) rev.disabled=true; return true; }
function finish(won){ over=true; inp.disabled=true; go.disabled=true; rev.disabled=true;
  /* Read BEFORE the reveal-all below, while shown still says how many clubs
     the player actually needed rather than how many exist. (No backticks in
     this comment — it lives inside a template literal and one would end the
     string. That exact mistake was made here first.) */
  if(window.__biqGameFinish)window.__biqGameFinish('trail',won,{clubs:shown});
  while(shown<total) reveal();
  msg.className='tb-msg '+(won?'win':'lose');
  msg.textContent=won ? 'Correct — that is the trail.' : 'Out of guesses. The full career is above.'; }
function submit(){ if(over) return; var v=inp.value.trim(); if(!v) return;
  /* Start on a real guess, not on render — a render event counts crawlers. */
  if(window.__biqGameStart)window.__biqGameStart('trail');
  if(accept[norm(v)]){ finish(true); return; }
  left--; inp.value=''; leftEl.textContent=left+' guess'+(left===1?'':'es')+' left';
  if(left<=0){ finish(false); return; }
  msg.className='tb-msg'; msg.textContent='Not him — another club revealed.';
  if(!reveal()) { finish(false); } }
go.addEventListener('click',submit);
inp.addEventListener('keydown',function(e){ if(e.key==='Enter') submit(); });
rev.addEventListener('click',function(){ if(over) return; if(reveal()){ msg.className='tb-msg'; msg.textContent=''; } });
})();`;
