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
import { GRID_CLUB_COLOURS } from './grid-club-colours.mjs';
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

// ⚠️ A KEY THAT MATCHES NOTHING IS A SILENT TYPO. Seven of the 28 missed on
// the first build because the map was keyed on the name the page DISPLAYS
// ("Villarreal", "Reading") while colourFor is handed the career-dictionary
// name ("Villarreal CF", "Reading F.C."). Coverage went to 97% and looked like
// success. Every key is now recorded when it fires, and gen-seo-pages fails the
// build on any that never did — so the next stale or misspelled key is a red
// build, not a quietly uncoloured club.
const usedColourKeys = new Set();
export const unusedColourKeys = () =>
  Object.keys(GRID_CLUB_COLOURS).filter((k) => !usedColourKeys.has(k));

function colourFor(careerName) {
  // ⚠️ FIRST, AND BY EXACT NAME — tried against the raw career name AND the
  // shortened display form, because the map is written the way a person says
  // the club. Each of these 28 was verified against a fetched source, so a hit
  // here is the most certain answer available.
  const direct = GRID_CLUB_COLOURS[careerName] ? careerName
    : (GRID_CLUB_COLOURS[short(careerName)] ? short(careerName) : null);
  if (direct) { usedColourKeys.add(direct); return GRID_CLUB_COLOURS[direct]; }
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
    /**
     * @param dayOffset days since GRID day 0 for the grid rendered into the HTML
     * @returns {{html:string, json:string, headers:string[]}|null}
     */
    sectionFor(pageClub, slug, dayOffset, absDay) {
      const career = careerNameFor(pageClub, P.clubs);
      if (!career) return null;

      // ⚠️ SEVEN DAYS, NOT ONE — because the day index used to be baked in at
      // BUILD time and there is no daily rebuild, so the "daily" grid only
      // changed when we deployed. Every other daily on this site (Footle,
      // Trail, Mystery) resolves its day in the BROWSER against a frozen
      // schedule, and this now does the same.
      //
      // Seven is measured, not guessed: over the last 90 days the longest gap
      // between commit days was 3, median 1, so a week is more than double the
      // worst observed case. It costs about 33KB more on a file that is fetched
      // ONLY when somebody taps a cell — never on page load.
      const days = [];
      for (let k = 0; k < 7; k++) {
        const g = pickClubGrid(career, dayOffset + k);
        if (!g) break;                       // a club that cannot fill a day stops here
        days.push([...g.rows, ...g.cols]);
      }
      if (!days.length) return null;

      // One club table shared by every day, so the players below can be stored
      // once with indices rather than repeated per day.
      const clubs = [...new Set(days.flat())];
      const setOf = (n) => P.clubPlayers.get(idx.get(n)) || new Set();
      const players = {};
      for (let ci = 0; ci < clubs.length; ci++) {
        for (const pid of setOf(clubs[ci])) (players[pid] ||= { n: nameOf.get(pid), c: [] }).c.push(ci);
      }
      const list = Object.values(players).filter((p) => p.n);

      const six = days[0];
      const rows = six.slice(0, 3), cols = six.slice(3);
      const hd = (n, isRow) => {
        const c = edgeColour(colourFor(n));
        return `<div class="fg-hd${isRow ? ' fg-row' : ''}"${c ? ` style="--fgc:${c}"` : ''}>${esc(short(n))}</div>`;
      };

      // ⚠️ The board is built row by row so the six club names sit in the markup
      // in reading order — this is the indexable content, not decoration.
      let board = `<div class="fg-hd fg-corner"></div>${cols.map((n) => hd(n, false)).join('')}`;
      rows.forEach((r, ri) => {
        board += hd(r, true);
        cols.forEach((_, ci) => {
          board += `<button class="fg-cell" type="button" data-r="${ri}" data-c="${ci}" aria-label="Name a player for ${esc(short(r))} and ${esc(short(cols[ci]))}"></button>`;
        });
      });

      const html = `<section class="sec narrow fg-sec" id="grid" aria-labelledby="fg-h">
<h2 id="fg-h">Football Grid</h2>
<p class="fg-sub">Name a player who turned out for both clubs. Nine guesses.</p>
<div class="fg-board" id="fg-board" data-src="/quiz/${slug}/grid.json" data-slug="${esc(slug)}">${board}</div>
<div class="fg-bar">Guesses left <b id="fg-left">9</b> · filled <b id="fg-got">0</b>/9</div>
<div class="fg-ask" id="fg-ask" hidden>
  <div class="fg-q" id="fg-q"></div>
  <input id="fg-i" placeholder="Start typing a name…" autocomplete="off" autocapitalize="off" spellcheck="false">
  <div class="fg-list" id="fg-list"></div>
  <div class="fg-msg" id="fg-msg"></div>
</div>
<div class="fg-done" id="fg-done" hidden></div>
<script>${FG_JS}</script>
</section>`;

      return {
        html,
        headers: six,
        // `a` is the absolute day number (days since epoch for a calendar date)
        // that days[0] belongs to, so the browser can subtract its OWN local day
        // index and land on the right entry. Same shape of anchor Footle, Trail
        // and Mystery all use.
        json: JSON.stringify({
          a: absDay,
          clubs,
          // Edge colours ride along, one per club in the table above, so a day
          // swap in the browser can repaint the headers instead of leaving
          // yesterday's colours beside today's clubs.
          colours: clubs.map((n) => edgeColour(colourFor(n))),
          days: days.map((d) => d.map((n) => clubs.indexOf(n))),
          players: list,
        }),
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
  /* The ending. Deliberately the same anatomy as the club quiz's own finish
     panel — score, a thing to do, one line about coming back — so a player who
     has met one recognises the other. */
  .fg-done{margin-top:16px;padding:16px;border:1px solid var(--bd);border-radius:12px;
    background:var(--card);text-align:center}
  .fg-done-h{font-family:var(--mono);font-size:30px;font-weight:800;color:var(--grn-soft);line-height:1}
  .fg-done-s{margin:6px 0 12px;font-size:14px;color:var(--tx3)}
  .fg-sq{margin:0 0 14px;font-size:19px;line-height:1.18;letter-spacing:2px;
    font-family:var(--mono);color:var(--tx)}
  .fg-done-go{display:block;width:100%;padding:13px 18px;border:none;border-radius:999px;
    background:var(--grn);color:var(--grn-ink);font:inherit;font-weight:800;font-size:15px;cursor:pointer}
  .fg-done-go:hover{filter:brightness(1.06)}
  .fg-next{margin-top:11px;font-size:13px;color:var(--tx3)}
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
  /* ⚠️ BORROWED, NOT REBUILT. club-quiz-engine.js exposes its guarded writer as
     window.__bqev, and every one of the 76 grid pages carries that engine, so
     this inherits its synthetic-traffic gate, its visitor id and its
     slug/lang/surface meta. Writing our own would mean a second gate to keep in
     step with the first — the exact drift the instrument register exists to
     catch, and how club_quiz_results wrote ungated for three weeks. If the
     engine is ever absent the grid goes unmeasured rather than throwing. */
  function gev(n,x){try{if(window.__bqev)window.__bqev(n,x)}catch(e){}}
  var gOpened=false, gAnswered=false, gDone=false;
  var $=function(id){return document.getElementById(id)};
  function sixName(i){return D.clubs[D.today[i]]}
  function strip(s){return String(s).replace(/\\s*(F\\.?C\\.?|A\\.?F\\.?C\\.?|C\\.?F\\.?|Club de F\\u00fatbol)\\s*$/i,'').trim()}
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z ]/g,' ').replace(/\\s+/g,' ').trim()}
  /* ⚠️ THE USER'S LOCAL CALENDAR DATE, NEVER Date.now()/DAY_MS. Taking the UTC
     day index rolls the puzzle at UTC midnight while every stored key on this
     site uses the local date; wordle.js documents the two real bugs that came
     of the mismatch (Tokyo got the same player twice, New York got tomorrow's
     under today's key). Same expression the other three dailies use. */
  var DAY_MS=86400000;
  function localDay(){var d=new Date();return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/DAY_MS)}
  function fmtDay(){var d=new Date();return d.toLocaleDateString(undefined,{day:'numeric',month:'long'})}

  /* The board is server-rendered for day 0 so a crawler and a JS-less visitor
     both see a real grid. If the browser's day is further along, swap the six
     headers to today's before anybody can tap one. Falls back to what was
     rendered if today is outside the shipped window. */
  function applyDay(){
    var k=localDay()-D.a;
    if(!(k>0 && k<D.days.length)) { D.today=D.days[0]; return; }
    D.today=D.days[k];
    var names=D.today.map(function(i){return D.clubs[i]});
    var hds=board.querySelectorAll('.fg-hd:not(.fg-corner)');
    /* markup order is cols first, then rows — see how the board is built */
    var order=[names[3],names[4],names[5],names[0],names[1],names[2]];
    for(var i=0;i<hds.length&&i<6;i++){
      hds[i].textContent=strip(order[i]);
      var c=D.colours&&D.colours[D.today[i<3?i+3:i-3]];  /* cols first in markup */
      if(c)hds[i].style.setProperty('--fgc',c); else hds[i].style.removeProperty('--fgc');
    }
    var cells=board.querySelectorAll('.fg-cell');
    for(var j=0;j<cells.length;j++){
      var r=+cells[j].getAttribute('data-r'), cc=+cells[j].getAttribute('data-c');
      cells[j].setAttribute('aria-label','Name a player for '+strip(names[r])+' and '+strip(names[3+cc]));
    }
  }
  function load(cb){
    if(D) return cb();
    if(loading) return; loading=true;
    fetch(board.getAttribute('data-src')).then(function(r){return r.json()}).then(function(j){
      D=j; D.index=j.players.map(function(p){return {p:p,w:norm(p.n).split(' ')}});
      applyDay(); loading=false; cb();
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
    if(!gOpened){gOpened=true;gev('grid-open')}
    load(function(){
      active=[r,c];
      $('fg-ask').hidden=false;
      $('fg-q').innerHTML='Played for <b>'+strip(sixName(r))+'</b> and <b>'+strip(sixName(3+c))+'</b>';
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
    /* club indices come straight from today's row — no name round-trip, so a
       renamed or duplicated club cannot shift which cell an answer satisfies. */
    var a=D.today[r], b=D.today[3+c];
    if(p.c.indexOf(a)>=0 && p.c.indexOf(b)>=0){
      state[r+','+c]=p.n; got++;
      m.className='fg-msg ok'; m.textContent=p.n+' \\u2014 both. \\u2713';
      $('fg-ask').hidden=true; active=null;
      if(!gAnswered){gAnswered=true;gev('grid-answer')}
    } else {
      /* ⚠️ NEVER "wrong". Our records are a subset of football; a name we cannot
         place at both clubs may still be right, and saying otherwise is how this
         mode starts telling people they are wrong. */
      m.className='fg-msg maybe';
      m.textContent="We can't confirm "+p.n+' for both '+strip(sixName(r))+' and '+strip(sixName(3+c))+'.';
      $('fg-i').value=''; $('fg-list').innerHTML=''; $('fg-i').focus();
    }
    /* One finish row whichever way the round ends, so "solved it" and "ran out
       of guesses" are the same question answered by the got count, rather than
       two events that have to be reconciled later. */
    if(!gDone && (got>=9 || left<=0)){gDone=true;gev('grid-finish',{got:got,solved:got>=9});finish()}
    paint();
  }

  /* ⚠️ THE ROUND USED TO END IN NOTHING. You spent your ninth guess and the bar
     read "Guesses left 0" and the page just stopped — no score, no date, no
     reason to come back. A daily with no tomorrow in it is a toy. */
  function shareGrid(){
    var out=[];
    for(var r=0;r<3;r++){ var row='';
      for(var c=0;c<3;c++) row += state[r+','+c] ? '\\u{1F7E9}' : '\\u2B1C';
      out.push(row); }
    return out.join('\\n');
  }
  function finish(){
    var el=$('fg-done'); if(!el) return;
    var club=strip(sixName(0));
    var line=club+' · '+fmtDay()+' · '+got+'/9';
    /* A share that BRAGS rather than sells: a score and a picture of it, with a
       plain URL. Nothing to detect, nothing that reads as an advert. */
    var text='Ball IQ \\u2014 Football Grid\\n'+line+'\\n\\n'+shareGrid()+'\\n\\nballiq.app/quiz/'+(board.getAttribute('data-slug')||'')+'/';
    el.innerHTML='<div class="fg-done-h">'+got+' / 9</div>'
      +'<div class="fg-done-s">'+esc(club)+' · '+esc(fmtDay())+'</div>'
      +'<pre class="fg-sq">'+shareGrid()+'</pre>'
      +'<button class="fg-done-go" type="button" id="fg-share">Share your grid</button>'
      +'<div class="fg-next">A new grid here every day.</div>';
    el.hidden=false;
    $('fg-share').onclick=function(){
      gev('grid-share');
      if(navigator.share){navigator.share({text:text}).catch(function(){});return}
      try{navigator.clipboard.writeText(text).then(function(){
        var b=$('fg-share'); b.textContent='Copied'; setTimeout(function(){b.textContent='Share your grid'},1600);
      })}catch(e){}
    };
    try{el.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}
  }
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
})();`;
