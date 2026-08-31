// A playable Mystery Player for the /mystery-player/ landing page.
//
// ⚠️ THE ONLY GAME HERE THAT NEEDS A SERVER. Footle and Transfer Trail ship
// one cloaked answer string to the browser. Mystery Player has no such string:
// a guess is ranked against ALL 8,489 players, so ranking client-side means
// shipping the ranked list — and the ranked list IS the answer, at position 1.
// Every guess therefore goes to /api/mystery-rank, which returns a rank and
// nothing else. The ordering never leaves the server.
//
// ⚠️ A FIXED ARCHIVED PUZZLE, NEVER TODAY'S. Same rule as the Trail board, with
// teeth here: the endpoint itself refuses any puzzle number that is not already
// past, so even a crafted request cannot turn this page into an oracle for
// today's answer. Puzzle 5 (Fernando Torres) is used because it is a name any
// football fan can reach, which is what a practice puzzle is for.
export const MYSTERY_PRACTICE_NO = 5;

export function mysteryBoardHtml() {
  return `<section class="sec mb-wrap" id="practice" aria-labelledby="mb-h">
<div class="mb-eyebrow">Practice puzzle · from the archive</div>
<h2 id="mb-h">Play a Mystery Player right here</h2>
<p class="mb-lede">A finished puzzle you can replay as often as you like. Name any footballer and you get back how close they are to the secret player — closest is 1. Unlimited guesses, and nothing here spoils <a href="https://balliq.app/play?game=mystery">today's Mystery Player</a>.</p>
<div class="mb-card" id="mb-game" data-n="${MYSTERY_PRACTICE_NO}">
<div class="mb-bar">
<input id="mb-guess" type="text" placeholder="Name any footballer…" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="go" aria-label="Name any footballer">
<button type="button" class="mb-go" id="mb-go">Guess</button>
</div>
<p class="mb-msg" id="mb-msg" role="status" aria-live="polite"></p>
<ol class="mb-list" id="mb-list"></ol>
</div>
<noscript><p class="mb-ns">This practice puzzle needs JavaScript. <a href="https://balliq.app/play?game=mystery">Play today's Mystery Player</a> instead.</p></noscript>
</section>`;
}

export const MYSTERY_BOARD_CSS = `  .mb-wrap.sec{padding-top:0;margin-top:-26px}
  @media (max-width:700px){ .mb-wrap.sec{margin-top:-18px} }
  .mb-eyebrow{font:700 11px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--tx3);margin-bottom:10px}
  .mb-lede{font-size:15.5px;line-height:1.6;color:#9BA0B8;max-width:62ch;margin:0 0 18px}
  .mb-card{background:#101219;border:1px solid #222634;border-radius:16px;padding:18px;max-width:560px}
  .mb-bar{display:flex;gap:8px}
  #mb-guess{flex:1;min-width:0;background:#14161E;border:1px solid #2A2D3A;border-radius:12px;padding:12px 14px;
    color:#fff;font-size:16px;font-family:inherit;outline:none}
  #mb-guess:focus{border-color:var(--grn)}
  .mb-go{flex:0 0 auto;padding:0 18px;min-height:44px;border:0;border-radius:12px;background:var(--grn);
    color:var(--grn-ink);font-weight:800;font-size:14px;font-family:inherit;cursor:pointer}
  .mb-go[disabled]{background:#14161E;color:var(--tx3);cursor:default}
  .mb-msg{margin:11px 0 0;font-size:14.5px;color:var(--tx2);min-height:20px}
  .mb-msg.win{color:var(--grn-soft);font-weight:700}
  .mb-list{list-style:none;margin:13px 0 0;padding:0;display:flex;flex-direction:column;gap:7px}
  .mb-g{position:relative;display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;
    background:#0D0F15;border:1px solid #1E2230;overflow:hidden}
  .mb-fill{position:absolute;top:0;bottom:0;left:0;opacity:.16;border-radius:10px}
  .mb-nm{position:relative;font-weight:700;font-size:15px;color:#fff}
  .mb-rk{position:relative;margin-left:auto;font-family:'JetBrains Mono',ui-monospace,monospace;
    font-variant-numeric:tabular-nums;font-weight:700;font-size:14px}
  .mb-g.hot .mb-fill{background:#58CC02} .mb-g.hot .mb-rk{color:#88E040}
  .mb-g.warm .mb-fill{background:#FFC53D} .mb-g.warm .mb-rk{color:#FFC53D}
  .mb-g.cold .mb-fill{background:#3A3F52} .mb-g.cold .mb-rk{color:var(--tx3)}
  .mb-g.win{border-color:var(--grn);background:rgba(88,204,2,.10)}
  .mb-g.win .mb-rk{color:#88E040}
  .mb-ns{color:var(--tx3);font-size:14px}
`;

export const MYSTERY_BOARD_JS = `(function(){
var g=document.getElementById('mb-game'); if(!g) return;
var n=g.getAttribute('data-n');
var inp=document.getElementById('mb-guess'), go=document.getElementById('mb-go');
var msg=document.getElementById('mb-msg'), list=document.getElementById('mb-list');
var seen={}, over=false, busy=false;
function band(r){ return r<=25 ? 'hot' : (r<=500 ? 'warm' : 'cold'); }
function width(r){ /* log scale: rank 1 is full, 8000 is a sliver. A linear bar
                      would make everything past the top 200 look identical. */
  var w=Math.max(3, 100 - (Math.log(r)/Math.log(8500))*100); return w.toFixed(1)+'%'; }
function row(name, rank, solved){
  var li=document.createElement('li');
  li.className='mb-g '+(solved?'win':band(rank));
  var f=document.createElement('span'); f.className='mb-fill'; f.style.width=solved?'100%':width(rank);
  var nm=document.createElement('span'); nm.className='mb-nm'; nm.textContent=name;
  var rk=document.createElement('span'); rk.className='mb-rk'; rk.textContent=solved?'1 — got it':rank.toLocaleString();
  li.appendChild(f); li.appendChild(nm); li.appendChild(rk);
  list.insertBefore(li, list.firstChild);
}
function submit(){
  if(over||busy) return;
  var v=inp.value.trim(); if(!v) return;
  /* Start on a real guess, not on render — a render event counts crawlers. */
  if(window.__biqGameStart)window.__biqGameStart('mystery');
  busy=true; go.disabled=true; msg.className='mb-msg'; msg.textContent='Checking…';
  fetch('/api/mystery-rank?n='+encodeURIComponent(n)+'&g='+encodeURIComponent(v))
    .then(function(r){ return r.json(); })
    .then(function(d){
      busy=false; go.disabled=false;
      if(!d||!d.ok){
        // matchGuess refuses ambiguous surnames on purpose (the pool holds two
        // Haalands), so "not found" must suggest the full name rather than
        // claim the player does not exist.
        msg.textContent='No player matched that. Try the full name.';
        return;
      }
      if(seen[d.name]){ msg.textContent='Already guessed ' + d.name + '.'; inp.value=''; return; }
      seen[d.name]=1; inp.value=''; msg.textContent='';
      row(d.name, d.rank, d.solved);
      if(d.solved){ over=true; inp.disabled=true; go.disabled=true;
        /* Mystery has no losing state — you keep guessing until you get it —
           so a finish here is always a win, and the guess count is the score. */
        if(window.__biqGameFinish)window.__biqGameFinish('mystery',true,{guesses:Object.keys(seen).length});
        msg.className='mb-msg win'; msg.textContent='Got it — the secret player was ' + (d.answer||d.name) + '.'; }
    })
    .catch(function(){ busy=false; go.disabled=false; msg.textContent='Could not reach the ranker — try again.'; });
}
go.addEventListener('click',submit);
inp.addEventListener('keydown',function(e){ if(e.key==='Enter') submit(); });
})();`;
