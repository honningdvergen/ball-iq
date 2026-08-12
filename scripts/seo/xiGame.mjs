// The Guess the XI game, as parts the page generator composes.
//
// ⚠️ THIS USED TO BE A STANDALONE FILE IN public/xi/. That meant it never went
// through gen-seo-pages, so it had no site header, no breadcrumbs and no
// footer — a visitor arriving from anywhere else hit what looked like a
// different website. Reported directly: "this looks like a completely
// different page, where are the tabs on the top".
//
// Splitting it into MARKUP / CSS / JS lets buildXiPage() wrap it in the same
// head(), nav and footer as every other page, so the shared nav has exactly
// one definition and this page cannot drift away from it again.
export const XI_MARKUP = `<div class="xi-app"><div class="xi-num" id="num"></div>
<h1 id="title">Guess the XI</h1>
<p class="sub" id="sub">Loading today's lineup…</p>

<div class="pitch">
  <svg class="markings" viewBox="0 0 100 139" preserveAspectRatio="none" aria-hidden="true">
    <rect x="2" y="2" width="96" height="135"/>
    <line x1="2" y1="69.5" x2="98" y2="69.5"/>
    <rect x="24" y="2" width="52" height="17"/>
    <rect x="24" y="120" width="52" height="17"/>
    <rect x="38" y="2" width="24" height="7"/>
    <rect x="38" y="130" width="24" height="7"/>
  </svg>
  <div class="centre"></div>
  <div class="rows" id="rows"></div>
</div>

<div class="bar">
  <input id="guess" type="text" placeholder="Name a player…" autocomplete="off"
         autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="go"
         aria-label="Name a player in this XI">
  <button class="btn" id="go" type="button">Guess</button>
</div>
<div class="meta">
  <span id="score">0 of 11 named</span>
  <span class="lives" id="lives" aria-label="Guesses remaining"></span>
</div>
<div class="misses" id="misses"></div>
<div id="done"></div>


</div>

</div>`;

export const XI_CSS = `.xi-app{
  --bg:#0A0A0A; --s1:#0F1117; --s2:#14161E; --s3:#1C1F28;
  --border:#242836; --border2:#2A2D3A;
  --text:#fff; --t2:#A6ADBB; --t3:#6F7787;
  --accent:#58CC02; --gold:#FFC53D;
  --line:rgba(255,255,255,.26);
}
.xi-app .wrap{max-width:640px;margin:0 auto;padding:16px 14px 44px}
.xi-app a{color:var(--accent)}
.xi-app header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.xi-app .logo{font-weight:900;font-size:15px;letter-spacing:-.02em;text-decoration:none;color:var(--text)}
.xi-app .logo span{color:var(--accent)}
.xi-app .num{margin-left:auto;font:700 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;
  text-transform:uppercase;color:var(--t3)}
.xi-app h1{font-size:clamp(21px,5.2vw,28px);line-height:1.12;margin:0 0 4px;letter-spacing:-.025em;font-weight:900}
.xi-app .sub{margin:0 0 14px;color:var(--t2);font-size:14px}
.xi-app .sub b{color:var(--gold)}
.xi-app /* pitch */
.pitch{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:.72;
  background:linear-gradient(170deg,#17371c 0%,#123016 45%,#0d2611 100%);
  border:1px solid var(--border2)}
.xi-app .pitch::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(180deg,rgba(255,255,255,.045) 0 8.33%,transparent 8.33% 16.66%)}
.xi-app .markings{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.xi-app .markings *{stroke:var(--line);fill:none;stroke-width:1.5;vector-effect:non-scaling-stroke}
.xi-app .centre{position:absolute;left:50%;top:50%;width:19%;aspect-ratio:1;transform:translate(-50%,-50%);
  border:1.5px solid var(--line);border-radius:50%;pointer-events:none}
.xi-app .rows{position:absolute;inset:0;z-index:1}
.xi-app .row{position:absolute;left:0;right:0;display:flex;justify-content:center;gap:2%;padding:0 3%;
  transform:translateY(-50%)}
.xi-app .slot{flex:1 1 0;max-width:112px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px}
.xi-app .disc{position:relative;width:100%;aspect-ratio:1;max-width:62px;border-radius:50%;overflow:hidden;
  background:rgba(6,10,7,.55);border:2px solid rgba(255,255,255,.45);
  display:flex;align-items:center;justify-content:center;
  transition:border-color .2s,transform .2s,background .2s}
.xi-app .disc .shirt{font:800 17px/1 ui-monospace,Menlo,monospace;color:rgba(255,255,255,.72)}
.xi-app .slot.got .disc{border-color:var(--accent);background:radial-gradient(circle at 50% 28%,#22452a,#0c1a0f);
  transform:scale(1.04)}
.xi-app .slot.shown .disc{border-color:var(--gold)}
.xi-app .plate{font-size:10.5px;font-weight:700;text-align:center;line-height:1.15;
  color:rgba(255,255,255,.92);background:rgba(6,10,7,.80);border-radius:6px;padding:2px 5px;
  overflow-wrap:break-word;max-width:100%;min-height:14px}
.xi-app .plate:empty{background:none;padding:0;min-height:6px}
.xi-app .pos{font:700 9px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;color:rgba(255,255,255,.5)}
.xi-app /* controls */
.bar{display:flex;gap:8px;margin-top:14px}
.xi-app #guess{flex:1;min-width:0;background:var(--s2);border:1px solid var(--border2);border-radius:12px;
  padding:13px 15px;color:var(--text);font-size:16px;font-family:inherit;outline:none}
.xi-app #guess:focus{border-color:var(--accent)}
.xi-app .btn{flex:0 0 auto;padding:0 20px;border:0;border-radius:12px;background:var(--accent);color:#06230C;
  font-weight:800;font-size:14px;font-family:inherit;cursor:pointer;min-height:44px}
.xi-app .btn[disabled]{background:var(--s2);color:var(--t3);cursor:default}
.xi-app .meta{display:flex;align-items:center;gap:10px;margin-top:10px;font-size:13px;color:var(--t2)}
.xi-app .lives{display:flex;gap:4px;margin-left:auto}
.xi-app .life{width:9px;height:9px;border-radius:50%;background:var(--accent)}
.xi-app .life.gone{background:var(--s3)}
.xi-app .misses{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.xi-app .miss{font-size:12.5px;color:var(--t3);text-decoration:line-through;background:var(--s2);
  border-radius:7px;padding:3px 8px}
.xi-app .done{margin-top:16px;padding:16px;border-radius:14px;background:var(--s1);
  border:1px solid var(--border);text-align:center}
.xi-app .done h2{margin:0 0 4px;font-size:19px}
.xi-app .done p{margin:0 0 12px;color:var(--t2);font-size:14px}
.xi-app .shakeit{animation:sk .26s}
.xi-app 25%{transform:translateX(-5px)}
.xi-app 75%{transform:translateX(5px)}
.xi-app .foot{margin-top:26px;padding-top:16px;border-top:1px solid var(--border);color:var(--t3);font-size:13px}
.xi-app .foot a{color:var(--t2)}
@keyframes sk{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}`;
export const XI_JS = `// ── Guess the XI ────────────────────────────────────────────────────────────
// Data: /data/xi.json (scripts/build-xi-pool.mjs — every lineup parsed from the
// match's own teamsheet, every player resolved to a Wikidata id, two spot-checks
// that exit(1) rather than skip).
//
// ⚠️ THE SCHEDULE IS ANCHORED, NOT MODULO OVER A GROWING LIST. anchorDay is
// frozen in the data file, so appending XIs only ever adds future days and can
// never rewrite a past one. Footle learned that the hard way when an append
// silently rewrote its published archive.
//
// ⚠️ NO innerHTML ANYWHERE IN THIS FILE. Player and match strings come from
// Wikipedia-derived data; every insertion goes through textContent or
// createElement so a stray character in a teamsheet can never become markup.
var MAX_MISS = 6;
var norm = function (s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\\s+/g, ' ').trim();
};
// Row buckets read the teamsheet's OWN position codes, so the pitch shape
// falls out of the data instead of being guessed per formation.
var ROWS = [
  { test: /^(GK)$/, depth: 0.90 },
  { test: /^(RB|LB|CB|RWB|LWB|SW|DF)$/, depth: 0.70 },
  { test: /^(DM|CM|RM|LM|MF)$/, depth: 0.47 },
  { test: /^(AM|SS|RW|LW)$/, depth: 0.28 },
  { test: /^(CF|ST|FW|RF|LF)$/, depth: 0.12 }
];
var state = { xi: null, found: {}, misses: [], over: false, num: 0 };
function el(id) { return document.getElementById(id); }

function layout() {
  var rows = el('rows');
  rows.textContent = '';
  var buckets = ROWS.map(function () { return []; });
  state.xi.players.forEach(function (p, i) {
    var b = -1;
    ROWS.forEach(function (r, ri) { if (b === -1 && r.test.test(p.pos)) b = ri; });
    buckets[b === -1 ? 2 : b].push({ p: p, i: i });
  });
  buckets.forEach(function (items, bi) {
    if (!items.length) return;
    var row = document.createElement('div');
    row.className = 'row';
    row.style.top = (ROWS[bi].depth * 100) + '%';
    items.forEach(function (it) {
      var slot = document.createElement('div');
      slot.className = 'slot';
      slot.id = 'slot' + it.i;
      var disc = document.createElement('div');
      disc.className = 'disc';
      var sh = document.createElement('span');
      sh.className = 'shirt';
      sh.textContent = it.p.no || '';
      disc.appendChild(sh);
      var plate = document.createElement('div');
      plate.className = 'plate';
      var pos = document.createElement('div');
      pos.className = 'pos';
      pos.textContent = it.p.pos;
      slot.appendChild(disc);
      slot.appendChild(plate);
      slot.appendChild(pos);
      row.appendChild(slot);
    });
    rows.appendChild(row);
  });
}

function reveal(i, how) {
  var slot = el('slot' + i);
  if (!slot) return;
  slot.classList.add(how === 'got' ? 'got' : 'shown');
  slot.querySelector('.plate').textContent = state.xi.players[i].name;
}

function paint() {
  var n = Object.keys(state.found).length;
  el('score').textContent = n + ' of 11 named';
  var lives = el('lives');
  lives.textContent = '';
  for (var k = 0; k < MAX_MISS; k++) {
    var d = document.createElement('span');
    d.className = 'life' + (k < state.misses.length ? ' gone' : '');
    lives.appendChild(d);
  }
  var m = el('misses');
  m.textContent = '';
  state.misses.forEach(function (t) {
    var s = document.createElement('span');
    s.className = 'miss';
    s.textContent = t;
    m.appendChild(s);
  });
}

function finish(won) {
  state.over = true;
  el('guess').disabled = true;
  el('go').disabled = true;
  state.xi.players.forEach(function (p, i) { if (!state.found[i]) reveal(i, 'shown'); });
  var n = Object.keys(state.found).length;
  var box = el('done');
  box.textContent = '';
  var d = document.createElement('div');
  d.className = 'done';
  var h = document.createElement('h2');
  h.textContent = won ? 'All eleven — ' + state.xi.club + ' named.' : n + ' of 11';
  var p = document.createElement('p');
  p.textContent = state.xi.match + (won ? '' : ' — the rest are shown above.');
  var b = document.createElement('button');
  b.className = 'btn';
  b.type = 'button';
  b.textContent = 'Share result';
  b.addEventListener('click', function () {
    var grid = state.xi.players.map(function (_, i) { return state.found[i] ? '🟩' : '⬜'; }).join('');
    var txt = '⚽ Guess the XI #' + state.num + ' — ' + n + '/11\\n' + grid
      + '\\n' + state.xi.match + '\\nballiq.app/xi';
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(function () { b.textContent = 'Copied 📋'; },
        function () {});
    }
  });
  d.appendChild(h);
  d.appendChild(p);
  d.appendChild(b);
  box.appendChild(d);
  try { if (window.clarity) window.clarity('event', won ? 'xi-won' : 'xi-lost'); } catch (e) {}
}

function submit() {
  if (state.over) return;
  var raw = el('guess').value.trim();
  if (!raw) return;
  var q = norm(raw);
  var hit = -1;
  state.xi.players.forEach(function (p, i) {
    if (hit === -1 && !state.found[i] && p.accept.indexOf(q) !== -1) hit = i;
  });
  if (hit !== -1) {
    state.found[hit] = 1;
    reveal(hit, 'got');
    el('guess').value = '';
    paint();
    if (Object.keys(state.found).length === 11) finish(true);
    return;
  }
  // A name already found is a memory slip, not a wrong answer — never punished.
  var dup = state.xi.players.some(function (p, i) {
    return state.found[i] && p.accept.indexOf(q) !== -1;
  });
  if (dup) { el('guess').value = ''; return; }
  state.misses.push(raw);
  el('guess').value = '';
  el('guess').classList.add('shakeit');
  setTimeout(function () { el('guess').classList.remove('shakeit'); }, 280);
  paint();
  if (state.misses.length >= MAX_MISS) finish(false);
}

fetch('/data/xi.json', { cache: 'no-cache' })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    var now = new Date();
    var day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    state.num = Math.max(1, day - data.anchorDay + 1);
    state.xi = data.xis[(state.num - 1) % data.xis.length];
    el('num').textContent = 'XI #' + state.num;
    el('title').textContent = 'Name the ' + state.xi.club + ' XI';
    var sub = el('sub');
    sub.textContent = '';
    var strong = document.createElement('b');
    strong.textContent = state.xi.match;
    sub.appendChild(strong);
    sub.appendChild(document.createTextNode(' · positions and shirt numbers given · six misses'));
    layout();
    paint();
    el('go').addEventListener('click', submit);
    el('guess').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
  })
  .catch(function () {
    el('sub').textContent = 'Could not load today’s lineup. Please refresh.';
  });`;
