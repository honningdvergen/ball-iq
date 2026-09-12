// The daily Football Grid section on a club page, and the JSON it lazy-loads.
//
// ⚠️ THE HEADERS ARE IN THE HTML; THE PLAYERS ARE NOT. A grid's six club names
// are CONTENT and belong in the markup where Google can read them. The answer
// data is ~34 KB per club — inlining it would grow a club page's HTML by about
// a fifth for something only a reader who actually plays will ever need. So the
// section renders server-side and fetches /quiz/<slug>/grid.json on first
// interaction. Same split the answer pages already use.
//
// ⚠️ RETURNS null RATHER THAN A DEGRADED GRID. A club with no fair puzzle gets
// no section at all — 76 of 96 pages qualify. A page with a thin or wrong grid
// is worse than a page with none, because it tells people they are wrong.
import { buildPool } from '../build-grid-pool.mjs';
import { pickClubGrid } from '../pick-club-grid.mjs';
import { careerNameFor } from './grid-club-alias.mjs';
import { CLUB_PACK_COLOURS } from '../../src/data/clubPackColours.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ⚠️ THE SPACE BEFORE THE AFFIX IS NOT OPTIONAL. With \s* here, "S.?C.?$"
// matched the tail of "Hertha BSC" and "F.?C.?$" the tail of "Genoa CFC", so
// the grid printed "Hertha B" and "Genoa C" at players — a club-type
// abbreviation is only an abbreviation when it is its own word.
const STRIP = /\s+(F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?|S\.?C\.?|Club de Fútbol|\(Football\))\s*$/ig;
const short = (s) => String(s).replace(STRIP, '').trim();
const norm = (s) => short(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// ⚠️ Our colour map speaks the app's short names ("Man United"), the harvest
// speaks official ones ("Manchester United F.C."). Same trap as club-alias.mjs.
const COLOUR_ALIAS = {
  'manchester united': 'Man United', 'manchester city': 'Man City',
  'newcastle united': 'Newcastle', 'tottenham hotspur': 'Tottenham',
  'wolverhampton wanderers': 'Wolves', 'brighton hove albion': 'Brighton',
  'west ham united': 'West Ham', 'west bromwich albion': 'West Brom',
};
const colourKeys = Object.keys(CLUB_PACK_COLOURS);

// ⚠️ NAME MATCHING ON THE NORMALISED STRING ALONE COVERED 70% OF HEADERS AND
// LOOKED FINE, because it covered ENGLISH clubs. English clubs write the type
// last ("Arsenal F.C.") and STRIP removes it; continental clubs write it FIRST
// ("FC Barcelona", "AS Roma", "SSC Napoli", "SV Werder Bremen") or use an affix
// STRIP never listed ("Atalanta BC", "Bayer 04 Leverkusen"). 136 of 456 headers
// on the live site had no colour at all — Barcelona, Roma, Bayern and Napoli
// among them — and the page still looked deliberate, because a missing colour
// is indistinguishable from a club we simply have no colour for.
//
// So the last resort compares CONTENT tokens: the words left after dropping
// club-type abbreviations and bare numbers from anywhere in the name.
const TYPE_TOKEN = new Set(['fc','afc','ac','as','ss','ssc','sl','sv','sc','cf','cd','ca','rc','uc',
  'us','bc','ec','kv','sk','jk','gnk','hnk','fk','cr','se','fbpa','vfb','vfl','bsc','tsg','tsv',
  'club','clube','calcio','balompie','regatas','sociedade','esportiva','de','do','da','del','e']);
const coreTokens = (s) => new Set(String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
  .filter((t) => t && !TYPE_TOKEN.has(t) && !/^\d+$/.test(t)));
const KEY_TOKENS = colourKeys.map((k) => [k, coreTokens(k)]);
const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

function colourFor(careerName) {
  const k = COLOUR_ALIAS[norm(careerName)] || colourKeys.find((x) => norm(x) === norm(careerName));
  if (k) return CLUB_PACK_COLOURS[k];

  const t = coreTokens(careerName);
  if (!t.size) return null;
  // ⚠️ EXACTLY ONE, OR NOTHING. A subset match is how "Inter Milan" could take
  // "AC Milan"'s colour — {milan} is a subset of {inter, milan}. Two candidates
  // means we cannot tell which club this is, and the wrong club's colour is
  // worse than none: the neutral edge reads as "no colour on file", a wrong one
  // reads as a fact. Same rule careerNameFor() uses for the answer key.
  const exact = KEY_TOKENS.filter(([, kt]) => sameSet(kt, t));
  const hit = exact.length === 1 ? exact
    : KEY_TOKENS.filter(([, kt]) => kt.size && [...kt].every((x) => t.has(x)));
  return hit.length === 1 ? CLUB_PACK_COLOURS[hit[0][0]] : null;
}

// ⚠️ A CLUB COLOUR THAT LOSES TO THE GROUND IS NOT A COLOUR. Our card is
// #13151C and 14 of the 109 club colours sit within 1.4:1 of it — Juventus and
// Beşiktaş are literally #000000, Newcastle #241F20, and Newcastle heads the
// very first Arsenal grid. Painting the edge with the raw value makes those
// clubs look like they have no colour at all, which is worse than the grey
// default because it reads as a bug on exactly the biggest names, and nothing
// would ever report it. So the edge is the club's colour LIFTED until it
// clears the ground: the identity survives, the invisibility does not.
const GROUND = [0x13, 0x15, 0x1c];
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
const MIN_EDGE_CONTRAST = 2.6;

/** The club's colour, raised just far enough to be seen on our card. */
function edgeColour(hex) {
  if (!hex) return null;
  let rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  // ⚠️ SMALL STEPS, NOT A JUMP. Snapping a dark navy straight to the threshold
  // washes it into a pastel; Tottenham has to still read as Tottenham. Each
  // step adds 4 to every channel, so the hue relationships survive the lift
  // even though saturation drops a little.
  for (let k = 0; k < 64 && ratio(rgb, GROUND) < MIN_EDGE_CONTRAST; k++) {
    rgb = rgb.map((c) => Math.min(255, c + 4));
  }
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Build the pool ONCE; the caller reuses this across every page. */
export function makeGridBuilder() {
  const P = buildPool();
  const idx = new Map(P.clubs.map((n, i) => [n, i]));
  // Names live in mysteryPool, not in the curated pool — load once, here, so a
  // caller cannot pass a different lookup and silently change what a grid says.
  const pool = JSON.parse(readFileSync(fileURLToPath(new URL('../../src/data/mysteryPool.json', import.meta.url)), 'utf8'));
  const nameOf = new Map(pool.map((p) => [p.id, p.name]));

  return {
    /**
     * @returns {{html:string, json:string, headers:string[]}|null}
     */
    sectionFor(pageClub, slug, dayIndex) {
      const career = careerNameFor(pageClub, P.clubs);
      if (!career) return null;
      const g = pickClubGrid(career, dayIndex);
      if (!g) return null;

      const six = [...g.rows, ...g.cols];
      const setOf = (n) => P.clubPlayers.get(idx.get(n)) || new Set();
      const players = {};
      for (const h of six) for (const pid of setOf(h)) {
        (players[pid] ||= { n: nameOf.get(pid), c: [] }).c.push(six.indexOf(h));
      }
      const list = Object.values(players).filter((p) => p.n);

      const hd = (n) => {
        const c = edgeColour(colourFor(n));
        return `<div class="fg-hd"${c ? ` style="--fgc:${c}"` : ''}>${esc(short(n))}</div>`;
      };
      const rowHd = (n) => {
        const c = edgeColour(colourFor(n));
        return `<div class="fg-hd fg-row"${c ? ` style="--fgc:${c}"` : ''}>${esc(short(n))}</div>`;
      };

      // ⚠️ The board is built row by row so the six club names sit in the markup
      // in reading order — this is the indexable content, not decoration.
      let board = `<div class="fg-hd fg-corner"></div>${g.cols.map(hd).join('')}`;
      g.rows.forEach((r, ri) => {
        board += rowHd(r);
        g.cols.forEach((_, ci) => {
          board += `<button class="fg-cell" type="button" data-r="${ri}" data-c="${ci}" aria-label="Name a player for ${esc(short(r))} and ${esc(short(g.cols[ci]))}"></button>`;
        });
      });

      const html = `<section class="sec narrow fg-sec" id="grid" aria-labelledby="fg-h">
<h2 id="fg-h">Football Grid</h2>
<p class="fg-sub">Name a player who turned out for both clubs. Nine guesses.</p>
<div class="fg-board" id="fg-board" data-src="/quiz/${slug}/grid.json">${board}</div>
<div class="fg-bar">Guesses left <b id="fg-left">9</b> · filled <b id="fg-got">0</b>/9</div>
<div class="fg-ask" id="fg-ask" hidden>
  <div class="fg-q" id="fg-q"></div>
  <input id="fg-i" placeholder="Start typing a name…" autocomplete="off" autocapitalize="off" spellcheck="false">
  <div class="fg-list" id="fg-list"></div>
  <div class="fg-msg" id="fg-msg"></div>
</div>
<script>${FG_JS}</script>
</section>`;

      return {
        html,
        headers: six,
        json: JSON.stringify({ rows: g.rows, cols: g.cols, six, players: list }),
      };
    },
  };
}

/** Styles for the grid section. Injected once into the club page's <style>. */
export const FG_CSS = `
  .fg-sec{margin-top:26px}
  .fg-sub{margin:2px 0 14px;font-size:13.5px;color:var(--tx3)}
  .fg-board{display:grid;grid-template-columns:74px repeat(3,1fr);gap:5px}
  /* ⚠️ CLUB COLOUR AS AN EDGE, NOT A FILL. Competitors use crests; crests are
     trademarked and we hold no artwork, but we already ship club colours. An
     edge tints a header without fighting the green solved state, and stays
     readable on a near-black club like Newcastle. */
  .fg-hd{display:flex;align-items:center;justify-content:center;text-align:center;
    font-size:11px;font-weight:700;line-height:1.18;color:var(--tx);padding:7px 4px;
    min-height:52px;background:var(--card);border-radius:8px;border-top:3px solid var(--fgc,var(--bd2))}
  .fg-hd.fg-row{justify-content:flex-start;text-align:left;font-size:11.5px;padding-left:9px;
    border-top:1px solid var(--bd);border-left:3px solid var(--fgc,var(--bd2))}
  .fg-hd.fg-corner{background:none;border:none;min-height:0}
  .fg-cell{aspect-ratio:1;background:var(--card);border:1px solid var(--bd);border-radius:10px;
    display:flex;align-items:center;justify-content:center;text-align:center;font:inherit;
    color:var(--tx4);font-size:11px;padding:5px;cursor:pointer;line-height:1.2}
  .fg-cell:hover{border-color:var(--bd2)}
  .fg-cell:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  .fg-cell.on{background:rgba(88,204,2,.13);border-color:var(--grn);color:var(--tx);
    font-weight:700;font-size:11.5px}
  .fg-cell .fg-tick{display:block;color:var(--grn);font-size:14px;font-weight:800}
  .fg-bar{margin-top:10px;font-size:13px;color:var(--tx3)}
  .fg-bar b{color:var(--tx);font-variant-numeric:tabular-nums}
  .fg-ask{margin-top:12px;background:var(--card2);border:1px solid var(--bd);border-radius:12px;
    padding:13px;display:flex;flex-direction:column;gap:9px}
  .fg-ask[hidden]{display:none}
  .fg-q{font-size:13.5px;color:var(--tx3)} .fg-q b{color:var(--tx)}
  .fg-ask input{width:100%;background:var(--bg);border:1px solid var(--bd2);border-radius:10px;
    padding:12px 14px;color:var(--tx);font:inherit;font-size:16px}
  .fg-ask input:focus{outline:none;border-color:var(--grn)}
  .fg-list{display:flex;flex-direction:column;gap:4px;max-height:198px;overflow-y:auto}
  .fg-opt{background:var(--bg);border:1px solid var(--bd);border-radius:9px;padding:11px 13px;
    font:inherit;font-size:15px;color:var(--tx);text-align:left;cursor:pointer;width:100%}
  .fg-opt:hover,.fg-opt:focus-visible{border-color:var(--grn);outline:none}
  .fg-msg{font-size:13.5px;min-height:19px}
  .fg-msg.ok{color:var(--grn)} .fg-msg.maybe{color:var(--amber)} .fg-msg.no{color:var(--tx3)}`;

/**
 * The grid's inline script.
 *
 * ⚠️ NO BACKTICKS IN HERE. This string is interpolated into the generator's own
 * template literals, and a backtick would end them — the same failure that broke
 * quiz-widget.mjs when a comment contained one.
 *
 * ⚠️ PICK, DON'T SPELL. Alex typed "peter schmechel" into the mockup and it was
 * rejected: Peter Schmeichel played for BOTH Manchester clubs, so a correct
 * answer was lost to one letter. Surname matching cannot save it either, since
 * Kasper is in the same pool. Prefix search over every word surfaces both and
 * the reader chooses, so spelling stops being a way to be wrong.
 */
export const FG_JS = `
(function(){
  var board=document.getElementById('fg-board'); if(!board) return;
  var D=null, state={}, left=9, got=0, active=null, loading=false;
  var $=function(id){return document.getElementById(id)};
  function strip(s){return String(s).replace(/\\s*(F\\.?C\\.?|A\\.?F\\.?C\\.?|C\\.?F\\.?|Club de F\\u00fatbol)\\s*$/i,'').trim()}
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z ]/g,' ').replace(/\\s+/g,' ').trim()}
  function load(cb){
    if(D) return cb();
    if(loading) return; loading=true;
    fetch(board.getAttribute('data-src')).then(function(r){return r.json()}).then(function(j){
      D=j; D.index=j.players.map(function(p){return {p:p,w:norm(p.n).split(' ')}}); loading=false; cb();
    }).catch(function(){ loading=false; var m=$('fg-msg'); if(m){m.className='fg-msg no';m.textContent='Could not load the grid. Reload the page?'} });
  }
  /* ⚠️ PREFIX MATCHING ALONE REJECTS A TYPO, AND A TYPO IS THE NORMAL CASE.
     "schmechel" for Schmeichel matched NOTHING, which reads as "we don't have
     him" rather than "you dropped a letter" — the player blames the grid. So a
     bounded edit-distance pass runs ONLY when the strict pass finds nobody:
     exact typing stays fast and precise, a near miss still finds its player,
     and the scan is 1,086 surnames, not the whole 7,959-player pool. */
  function ed(a,b,max){
    if(Math.abs(a.length-b.length)>max) return max+1;
    var p2=null,p1=[],cur,i,j;
    for(j=0;j<=b.length;j++) p1[j]=j;
    for(i=1;i<=a.length;i++){
      cur=[i]; var best=i;
      for(j=1;j<=b.length;j++){
        var v=Math.min(p1[j]+1,cur[j-1]+1,p1[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));
        /* transposition: "schmiechel" is one slip, not two */
        if(p2&&i>1&&j>1&&a.charAt(i-1)===b.charAt(j-2)&&a.charAt(i-2)===b.charAt(j-1)) v=Math.min(v,p2[j-2]+1);
        cur[j]=v; if(v<best) best=v;
      }
      if(best>max) return max+1;   /* whole row already too far — stop */
      p2=p1; p1=cur;
    }
    return p1[b.length];
  }
  function suggest(q){
    var n=norm(q); if(n.length<2) return [];
    var parts=n.split(' ');
    var hit=D.index.filter(function(e){return parts.every(function(part){return e.w.some(function(w){return w.indexOf(part)===0})})});
    if(hit.length) return hit.sort(function(a,b){return a.p.n.length-b.p.n.length}).slice(0,6).map(function(e){return e.p});
    var last=parts[parts.length-1];
    if(last.length<4) return [];
    var max=last.length>=7?2:1, near=[];
    for(var i=0;i<D.index.length;i++){
      var e=D.index[i], bd=max+1;
      for(var k=0;k<e.w.length;k++){ var d=ed(last,e.w[k],max); if(d<bd) bd=d; }
      if(bd<=max) near.push({e:e,d:bd});
    }
    return near.sort(function(a,b){return a.d-b.d||a.e.p.n.length-b.e.p.n.length})
      .slice(0,6).map(function(x){return x.e.p});
  }
  function paint(){
    var cells=board.querySelectorAll('.fg-cell');
    for(var i=0;i<cells.length;i++){
      var el=cells[i], v=state[el.getAttribute('data-r')+','+el.getAttribute('data-c')];
      el.className='fg-cell'+(v?' on':'');
      el.innerHTML=v?'<span><span class="fg-tick">\\u2713</span>'+v+'</span>':'';
    }
    $('fg-left').textContent=left; $('fg-got').textContent=got;
  }
  board.addEventListener('click',function(e){
    var el=e.target.closest('.fg-cell'); if(!el) return;
    var r=+el.getAttribute('data-r'), c=+el.getAttribute('data-c');
    if(state[r+','+c]||left<=0) return;
    load(function(){
      active=[r,c];
      $('fg-ask').hidden=false;
      $('fg-q').innerHTML='Played for <b>'+strip(D.rows[r])+'</b> and <b>'+strip(D.cols[c])+'</b>';
      $('fg-msg').textContent=''; $('fg-msg').className='fg-msg';
      $('fg-list').innerHTML=''; $('fg-i').value=''; $('fg-i').focus();
    });
  });
  document.addEventListener('input',function(e){
    if(e.target.id!=='fg-i'||!D) return;
    var list=$('fg-list'); list.innerHTML='';
    suggest(e.target.value).forEach(function(p){
      var b=document.createElement('button');
      b.className='fg-opt'; b.type='button'; b.textContent=p.n;
      b.onclick=function(){judge(p)};
      list.appendChild(b);
    });
  });
  function judge(p){
    if(!active) return;
    var r=active[0], c=active[1], m=$('fg-msg');
    left--;
    var a=D.six.indexOf(D.rows[r]), b=D.six.indexOf(D.cols[c]);
    if(p.c.indexOf(a)>=0 && p.c.indexOf(b)>=0){
      state[r+','+c]=p.n; got++;
      m.className='fg-msg ok'; m.textContent=p.n+' \\u2014 both. \\u2713';
      $('fg-ask').hidden=true; active=null;
    } else {
      /* ⚠️ NEVER "wrong". Our records are a subset of football; a name we cannot
         place at both clubs may still be right, and saying otherwise is how this
         mode starts telling people they are wrong. */
      m.className='fg-msg maybe';
      m.textContent="We can't confirm "+p.n+' for both '+strip(D.rows[r])+' and '+strip(D.cols[c])+'.';
      $('fg-i').value=''; $('fg-list').innerHTML=''; $('fg-i').focus();
    }
    paint();
  }
})();`;
