// ── THE SHARED SHELL for every generated page ────────────────────────────────
// Header, footer and their CSS, matching src/marketing/FrontDoor.jsx byte for
// concept: the same one-row header (wordmark · sections · club search · sign
// in, no marketing button), the same sitemap footer, the same tokens. Alex,
// 2026-09-03: "when I navigate to clubs or lists or search for something, I do
// not feel the visual consistency from the home page… it feels like a
// different website". This file is the fix: one shell, rendered by React on
// the front door and as static HTML here.
//
// ⚠️ KEEP IN STEP WITH src/design/front.css. The selectors and values below
// are the header/footer subset of that file, un-scoped (static pages have no
// .fd root). When one changes, change the other.
import { CLUB_INDEX } from '../../src/marketing/clubIndex.js';
import { LISTS_INDEX } from '../../src/marketing/listsIndex.js';
import { DISCOVER, MORE } from '../../src/marketing/siteNav.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LEAGUES = [
  ['premier-league', 'Premier League'], ['la-liga', 'La Liga'], ['serie-a', 'Serie A'], ['bundesliga', 'Bundesliga'],
  ['ligue-1', 'Ligue 1'], ['super-lig', 'Süper Lig'], ['primeira-liga', 'Primeira Liga'], ['champions-league', 'Champions League'],
  ['world-cup', 'World Cup'], ['euros', 'Euros'],
];

// Footer "Games" column: the static landing page where one exists (crawlable,
// and the page a searcher expects), the app door otherwise.
const GAMES = [
  ['Footle', '/football-wordle/'], ['Daily 7', '/daily-football-quiz/'], ['Transfer Trail', '/transfer-trail/'],
  ['Mystery Player', '/mystery-player/'], ['Guess the XI', '/xi/'], ['Club Quiz', '/quiz/clubs/'], ['League Quiz', '/quiz/'],
  ['Classic', '/play?game=classic'], ['Survival', '/play?game=survival'], ['Hot Streak', '/play?game=hotstreak'],
  ['Stadiums', '/play?game=stadiums'], ['Legends', '/quiz/legends/'], ['Chaos', '/play?game=chaos'], ['Play a friend', '/play?game=online'],
];
// DISCOVER and MORE live in src/marketing/siteNav.js — one list for this
// footer, the front door's and the served answer pages'.

const SEARCH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
const BURGER_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

// The club/league finder, inline: 89 names and slugs (~3.5KB) and a few lines
// of script. Static pages have no bundle, and search must work on first paint.
const finderScript = (base) => {
  const data = JSON.stringify([
    ...CLUB_INDEX.map((c) => [c.n, c.c, `${base}/play?club=${c.s}`]),
    ...LEAGUES.map(([s, n]) => [n, 'League quiz', `${base}/quiz/${s}/`]),
  ]);
  return `<script>(function(){var D=${data};var i=document.getElementById('fd-find'),r=document.getElementById('fd-find-res'),n=document.getElementById('fd-nav'),b=document.querySelector('.fd-burger');if(!i||!r)return;
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}
function hits(q){q=norm(q.trim());if(!q)return[];var o=[];for(var k=0;k<D.length;k++){var m=norm(D[k][0]);var rk=m.indexOf(q)===0?0:m.indexOf(q)>=0?1:-1;if(rk>=0)o.push([rk,D[k]]);}o.sort(function(a,c){return a[0]-c[0]||a[1][0].localeCompare(c[1][0]);});return o.slice(0,8).map(function(x){return x[1];});}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function render(){var h=hits(i.value);if(!i.value.trim()){r.hidden=true;r.innerHTML='';return;}r.hidden=false;r.innerHTML=h.length?h.map(function(x){return'<a role="option" class="fd-find-row" href="'+esc(x[2])+'"><span class="fd-find-n">'+esc(x[0])+'</span><span class="fd-find-sub">'+esc(x[1])+'</span><span class="fd-find-go">Play</span></a>';}).join(''):'<div class="fd-find-empty">Nothing on file called \\u201c'+esc(i.value.trim())+'\\u201d yet. <a href="${base}/#clubs">See every club</a></div>';}
i.addEventListener('input',render);i.addEventListener('focus',render);i.addEventListener('blur',function(){setTimeout(function(){r.hidden=true;},150);});
i.addEventListener('keydown',function(e){if(e.key==='Enter'){var h=hits(i.value);if(h[0])location.href=h[0][2];}if(e.key==='Escape'){i.value='';r.hidden=true;}});
if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('is-open');b.setAttribute('aria-expanded',o?'true':'false');});}
})();</script>`;
};

/**
 * @param {{base:string}} site  SITE from gen-seo-pages
 * @param {string} active       'quizzes' | 'lists' | '' — which section link is current
 */
export function shellHeader(site, active = '') {
  const b = site.base;
  const a = (k) => (active === k ? ' class="is-active" aria-current="page"' : '');
  return `<a class="fd-skip" href="#main">Skip to content</a>
<header class="fd-head"><div class="fd-w fd-head-in">
<a class="fd-mark" href="${b}/" aria-label="Ball IQ home"><img src="/marketing/ball.png" alt="" width="26" height="26"><span>Ball IQ</span></a>
<nav class="fd-nav" id="fd-nav" aria-label="Sections"><a href="${b}/#today">Today</a><a href="${b}/#games">Games</a><a href="${b}/#clubs"${a('clubs')}>Clubs</a><a href="${b}/football-quiz/"${a('quizzes')}>Quizzes</a><a href="${b}/lists/"${a('lists')}>Lists</a></nav>
<div class="fd-find" role="search"><span class="fd-find-ic">${SEARCH_ICON}</span><input type="search" class="fd-find-in" id="fd-find" placeholder="Find your club or league" aria-label="Find your club or league" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="search" autocomplete="off"><div class="fd-find-res" id="fd-find-res" role="listbox" aria-label="Clubs and leagues" hidden></div></div>
<a class="fd-signin" href="${b}/play">Sign in</a>
<button type="button" class="fd-burger" aria-expanded="false" aria-controls="fd-nav" aria-label="Menu">${BURGER_ICON}</button>
</div></header>
${finderScript(b)}`;
}

/** The sitemap footer: games, four leagues of clubs, lists, discover, the company. */
export function shellFooter(site) {
  const b = site.base;
  const byLeague = new Map();
  for (const c of CLUB_INDEX) { if (!byLeague.has(c.c)) byLeague.set(c.c, []); byLeague.get(c.c).push(c); }
  const col = (title, links) => `<div class="fd-foot-col"><h3>${esc(title)}</h3>${links.map(([n, h]) => `<a href="${h}">${esc(n)}</a>`).join('')}</div>`;
  const leagueCols = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga']
    .filter((k) => byLeague.has(k))
    .map((k) => col(k, [...byLeague.get(k).slice(0, 8).map((c) => [c.n, `${b}/quiz/${c.s}/`]), [`All ${k} clubs`, `${b}/quiz/clubs/`]]))
    .join('');
  return `<footer class="fd-foot"><div class="fd-w fd-foot-in">
${col('Games', GAMES.map(([n, h]) => [n, b + h]))}
${leagueCols}
${col('Lists', [...LISTS_INDEX.slice(0, 8).map((l) => [l.h.replace(/^Every /, ''), `${b}/lists/${l.s}/`]), ['All lists', `${b}/lists/`]])}
${col('Discover', DISCOVER.map(([n, h]) => [n, b + h]))}
<div class="fd-foot-col"><h3>Ball IQ</h3><a href="${b}/about/">About</a><a href="${b}/contact/">Contact</a>${MORE.map(([n, h]) => `<a href="${b + h}">${esc(n)}</a>`).join('')}<a href="${b}/privacy.html">Privacy</a><a href="${b}/terms/">Terms</a><span class="fd-foot-app">Also on <a href="${site.appStore}" rel="noopener">iOS</a> and <a href="${site.playStore}" rel="noopener">Android</a></span></div>
</div>
<div class="fd-w fd-foot-line">An independent football quiz, made by one person. Not affiliated with, endorsed by, or associated with FIFA, UEFA, the Premier League, La Liga, Serie A, the Bundesliga, or any club; names are used to identify the subject of each quiz.</div>
</footer>`;
}

// Header + footer CSS. Same values as src/design/front.css, un-scoped. The
// page tokens (--bg, --card, --card2, --bd, --bd2, --tx, --tx3, --tx4, --grn,
// --grn-ink) come from rootCss(), which every generated page already emits.
export const SHELL_CSS = `
  .fd-skip{position:absolute;left:-9999px;top:8px;z-index:200;padding:10px 14px;background:var(--grn);color:var(--grn-ink);font-weight:700;border-radius:8px}
  .fd-skip:focus{left:8px}
  .fd-w{max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,44px)}
  .fd-head{position:sticky;top:0;z-index:100;background:var(--bg);border-bottom:1px solid var(--bd)}
  .fd-head-in{display:flex;align-items:center;gap:22px;height:60px}
  .fd-mark{display:inline-flex;align-items:center;gap:9px;font-weight:800;font-size:18px;letter-spacing:-.01em;flex:0 0 auto;color:var(--tx)}
  .fd-mark:hover{text-decoration:none}
  .fd-mark img{display:block;width:26px;height:26px}
  .fd-nav{display:flex;gap:4px}
  .fd-nav a{padding:8px 10px;border-radius:8px;font-size:14px;font-weight:600;color:var(--tx3)}
  .fd-nav a:hover{color:var(--tx);background:var(--card);text-decoration:none}
  .fd-nav a.is-active{color:var(--tx)}
  .fd-find{position:relative;flex:1 1 auto;max-width:420px;margin-left:auto}
  .fd-find-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--tx4);pointer-events:none;display:flex}
  .fd-find-in{width:100%;height:40px;padding:0 12px 0 38px;border-radius:10px;background:var(--card);border:1px solid var(--bd);color:var(--tx);font:inherit;font-size:16px;outline:none;-webkit-appearance:none;appearance:none}
  .fd-find-in::placeholder{color:var(--tx4)}
  .fd-find-in:focus{border-color:var(--bd2);background:var(--card2)}
  .fd-find-in::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}
  .fd-find-res{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:120;padding:6px;background:var(--card);border:1px solid var(--bd);border-radius:12px;box-shadow:0 18px 44px rgba(0,0,0,.55)}
  .fd-find-res[hidden]{display:none}
  .fd-find-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:12px;min-height:44px;padding:8px 10px;border-radius:8px;font-size:15px;font-weight:600;color:var(--tx)}
  .fd-find-row:hover{background:var(--card2);text-decoration:none}
  .fd-find-sub{font-size:12.5px;font-weight:500;color:var(--tx4)}
  .fd-find-go{font-size:12.5px;font-weight:700;color:var(--grn)}
  .fd-find-empty{padding:10px;font-size:13.5px;color:var(--tx3)}
  .fd-find-empty a{color:var(--tx);text-decoration:underline;text-underline-offset:3px}
  .fd-signin{flex:0 0 auto;font-size:14px;font-weight:600;color:var(--tx3);padding:8px 10px}
  .fd-signin:hover{color:var(--tx);text-decoration:none}
  .fd-burger{display:none;flex:0 0 auto;width:44px;height:44px;border:0;background:none;color:var(--tx);cursor:pointer;border-radius:8px}
  .fd-foot{border-top:1px solid var(--bd);background:var(--bg2);padding:36px 0 28px;margin-top:36px}
  .fd-foot-in{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:22px}
  .fd-foot-col{display:flex;flex-direction:column;gap:5px;min-width:0}
  .fd-foot-col h3{margin:0 0 8px;font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--tx4)}
  .fd-foot-col a{font-size:13.5px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:24px}
  .fd-foot-col a:hover{color:var(--tx);text-decoration:none}
  .fd-foot-app{margin-top:10px;font-size:13px;color:var(--tx4)}
  .fd-foot-app a{color:var(--tx3);text-decoration:underline;text-underline-offset:3px}
  .fd-foot-line{margin-top:26px;font-size:12.5px;line-height:1.6;color:var(--tx4);max-width:90ch}
  @media(max-width:1000px){.fd-foot-in{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:720px){
    .fd-head-in{gap:10px;height:56px}
    .fd-mark span{display:none}
    .fd-nav{display:none}
    .fd-nav.is-open{display:flex;position:absolute;left:0;right:0;top:56px;flex-direction:column;gap:0;padding:8px;background:var(--card);border-bottom:1px solid var(--bd);z-index:110}
    .fd-nav.is-open a{min-height:44px;display:flex;align-items:center;font-size:16px}
    .fd-find{max-width:none;margin-left:0}
    .fd-signin{display:none}
    .fd-burger{display:grid;place-items:center}
    .fd-foot-in{grid-template-columns:repeat(2,minmax(0,1fr))}
  }
`;
