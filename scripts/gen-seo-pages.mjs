// ─────────────────────────────────────────────────────────────────────────────
// SEO STATIC PAGE GENERATOR
//
// Runs AFTER `vite build`, writing fully static, crawlable HTML into dist/.
// These files pre-empt the SPA catch-all rewrite in vercel.json (Vercel checks
// the filesystem before applying rewrites — proven by privacy.html), so a
// crawler hitting /quiz/world-cup/ gets real <h1> HTML, not the empty SPA shell.
//
// SOURCES OF TRUTH:
//   - Questions  → ../src/questions.js  (QB)         — only `hint`-bearing rows render
//   - Prose      → ./seo/content.mjs    (hand-written) — the original-content layer
//
// SAFETY INVARIANTS (the SAFE-IF conditions from the SEO design pass):
//   1. Only hint-bearing questions are rendered (every answer has an explanation).
//   2. Original hand-written prose dominates each page (intro + FAQ from content.mjs).
//   3. Sample sets are CURATED (difficulty-spread, capped), not dumped.
//   4. All content is in the initial HTML — no JS injection, no cloaking.
//   5. ≥15 hint-bearing questions per category asserted at build (fail loud).
//   6. No crests / kits / photos — text only; footer non-affiliation disclaimer.
//
// PRESENTATION: a PLAY-FIRST layout matching the Ball IQ marketing brand
// (src/marketing/MarketingHome.jsx) — sticky nav, left-aligned hero with the
// interactive taster front-and-centre, an orange app CTA band, a related-quiz
// tile grid, a collapsible FAQ, then the long-form prose + sample Q&A kept
// crawlable but below the play-first fold.
//
// Output is a BUILD ARTIFACT (not committed). The prose in content.mjs IS source.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { QB } from '../src/questions.js';
import { SITE, HUB, CATEGORIES, LISTICLES, ABOUT, CONTACT } from './seo/content.mjs';
import { CLUBS } from './seo/clubs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

const MIN_HINTS = 15; // fail the build if any category falls below this

// ── helpers ──────────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// JSON-LD must not allow a `</script>` breakout; escape `<`.
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

const catRows = (cat) => QB.filter((x) => x.cat === cat);
const hintRows = (cat) => catRows(cat).filter((x) => x.hint && x.type === 'mcq' && Array.isArray(x.o));
const clubRows = (club) => QB.filter((x) => x.club === club);
const clubHintRows = (club) => clubRows(club).filter((x) => x.hint && x.type === 'mcq' && Array.isArray(x.o));

// Deterministic, difficulty-spread sample: lead easy → end hard, stable by id.
function curate(rows, n) {
  const byDiff = { easy: [], medium: [], hard: [] };
  for (const r of rows) (byDiff[r.diff] || byDiff.medium).push(r);
  for (const k of Object.keys(byDiff)) byDiff[k].sort((a, b) => (a.id < b.id ? -1 : 1));
  const want = { easy: Math.round(n * 0.4), medium: Math.round(n * 0.35) };
  want.hard = n - want.easy - want.medium;
  const out = [];
  for (const k of ['easy', 'medium', 'hard']) out.push(...byDiff[k].slice(0, want[k]));
  // Top up from any remaining rows (preserving easy→hard order) if a bucket was short.
  if (out.length < n) {
    const used = new Set(out.map((r) => r.id));
    for (const k of ['easy', 'medium', 'hard']) {
      for (const r of byDiff[k]) {
        if (out.length >= n) break;
        if (!used.has(r.id)) { out.push(r); used.add(r.id); }
      }
    }
  }
  return out.slice(0, n);
}

// Split a paragraph list into a short hero lead (first sentence[s]) and the
// remaining long-form prose (kept crawlable in the "About" section below the
// fold). Grows the lead until it reaches a readable length so single short
// sentences don't produce a thin hero.
function splitLead(paras) {
  const first = paras[0] || '';
  const re = /[^.!?]+[.!?]+/g;
  const sentences = [];
  let m;
  while ((m = re.exec(first))) {
    sentences.push(m[0]);
    if (sentences.join('').trim().length >= 90) break;
  }
  const raw = sentences.join('');
  const lead = (raw || first).trim();
  const remainder = raw ? first.slice(raw.length).trim() : '';
  const rest = remainder ? [remainder, ...paras.slice(1)] : paras.slice(1);
  return { lead, rest };
}

const PAGE_BG = '#0A0A0A';
const PAGE_FG = '#F0F1F5';

// ── brand badges ──────────────────────────────────────────────────────────────
// Mirrors the homepage mesh (MarketingHome QUIZ_CLUBS / QUIZ_LEAGUES) so the
// landing pages read as one system with balliq.app/.
const CLUB_BADGE = {
  'manchester-united': 'MUN', arsenal: 'ARS', 'manchester-city': 'MCI', liverpool: 'LIV',
  chelsea: 'CHE', tottenham: 'TOT', newcastle: 'NEW', barcelona: 'BAR', 'real-madrid': 'RMA',
  'atletico-madrid': 'ATM', juventus: 'JUV', 'inter-milan': 'INT', 'ac-milan': 'MIL',
  'bayern-munich': 'BAY', 'borussia-dortmund': 'BVB', psg: 'PSG', ajax: 'AJA',
};
const CAT_EMOJI = {
  'world-cup': '🌍', 'premier-league': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'champions-league': '⭐',
  'la-liga': '🇪🇸', 'serie-a': '🇮🇹', bundesliga: '🇩🇪', euros: '🇪🇺',
  'football-records': '📊', legends: '🏆', managers: '🧠',
};
const CAT_KIND = {
  'world-cup': 'Tournament quiz', 'champions-league': 'Tournament quiz', euros: 'Tournament quiz',
  'premier-league': 'League quiz', 'la-liga': 'League quiz', 'serie-a': 'League quiz', bundesliga: 'League quiz',
  'football-records': 'Quiz', legends: 'Quiz', managers: 'Quiz',
};

const deriveBadge = (name) => name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'FB';

// Badge for a related-quiz tile, keyed by slug.
function badgeFor(slug, name) {
  if (slug === HUB.slug) return { text: '⚽', emoji: true };
  if (CLUB_BADGE[slug]) return { text: CLUB_BADGE[slug], emoji: false };
  if (CAT_EMOJI[slug]) return { text: CAT_EMOJI[slug], emoji: true };
  return { text: '❓', emoji: true }; // listicles / anything else
}

// ── shared chrome ─────────────────────────────────────────────────────────────
// Reusable black App Store badge — the KNOWN-GOOD inline Apple glyph. Never
// links to Google Play (Android isn't shipped).
function appStoreBadge() {
  return `<a class="store-badge" href="${SITE.appStore}" rel="noopener" target="_blank">
<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M16.365 1.43c0 1.14-.42 2.2-1.26 2.99-.84.79-1.85 1.25-2.95 1.16-.13-1.06.4-2.18 1.18-2.95.83-.82 2.06-1.41 3.03-1.4.01.07.01.13 0 .2zm3.66 16.06c-.6 1.38-.88 1.99-1.65 3.2-1.08 1.69-2.6 3.79-4.48 3.81-1.67.02-2.1-1.09-4.37-1.07-2.27.01-2.74 1.09-4.41 1.07-1.88-.02-3.32-1.92-4.4-3.6-3.02-4.74-3.34-10.29-1.47-13.24 1.33-2.09 3.43-3.32 5.4-3.32 2.01 0 3.27 1.1 4.93 1.1 1.61 0 2.59-1.1 4.91-1.1 1.76 0 3.62.96 4.95 2.61-4.35 2.38-3.64 8.59.96 10.54z"/></svg>
<span class="store-badge-tx"><small>Download on the</small><strong>App Store</strong></span>
</a>`;
}

const NAV = `<header class="nav"><div class="nav-in">
<a class="brand" href="${SITE.base}/"><img src="/marketing/ball.png" alt="Ball IQ" width="28" height="28" />Ball&nbsp;<b>IQ</b></a>
<div class="nav-right"><a class="nav-link" href="${SITE.base}/quiz/">All quizzes</a><a class="nav-cta" href="${SITE.appStore}" rel="noopener" target="_blank">Get the app</a></div>
</div></header>`;

function crumbs(items) {
  const trail = items
    .map((c, i) =>
      i === items.length - 1
        ? `<span>${esc(c.name)}</span>`
        : `<a href="${c.url}">${esc(c.name)}</a><span class="sep">›</span>`,
    )
    .join('');
  return `<nav class="crumbs" aria-label="Breadcrumb">${trail}</nav>`;
}

// The play-first hero. `badge` = { text, emoji } or null (listicle/simple pages).
// `playHref` is the green CTA target ("#taster" on quiz pages).
function heroSection({ crumbItems, badge, kind, name, h1, lead, statLine, playHref, playLabel }) {
  const chip = !badge
    ? ''
    : badge.emoji
      ? `<span class="badge-chip emoji">${badge.text}</span>`
      : `<span class="badge-chip">${esc(badge.text)}</span>`;
  const ctaRow = playHref
    ? `<div class="cta-row">
<a class="btn-green" href="${playHref}">${esc(playLabel || `Play the ${name} quiz`)} ↓</a>
${appStoreBadge()}
</div>`
    : '';
  const stat = statLine ? `<p class="hero-stat">${esc(statLine)}</p>` : '';
  return `<section class="hero">
${crumbs(crumbItems)}
<div class="kicker">${chip}<span class="eyebrow">${esc(kind)}</span></div>
<h1>${esc(h1)}</h1>
<p class="hero-lead">${esc(lead)}</p>
${ctaRow}
${stat}
</section>`;
}

// Orange app CTA band (matches the homepage Daily band). Black App Store badge.
function appCtaBand(name) {
  return `<section class="sec"><div class="appband">
<div class="appband-flame" aria-hidden="true">🔥</div>
<div class="appband-in">
<h2>Think you know ${esc(name)}? Prove it in the app.</h2>
<p>Streaks, live 1v1, a rating out of 99 — and every quiz in one app.</p>
${appStoreBadge()}
</div>
</div></section>`;
}

// Collapsible, JS-free FAQ. Answers stay in the DOM (crawlable) when collapsed.
// `extra` (optional) appends one more <details> whose answer is RAW HTML — used
// to tuck the long-form "About the <team>" prose into a collapsed FAQ item:
// crawlable SEO depth that stays out of the play-first flow (a wall of prose up
// top reads like a Wikipedia page; here it's one tap away for anyone who wants it).
function renderFaq(faq, extra) {
  const items = faq.map(
    (f) =>
      `<details><summary>${esc(f.q)}<span class="ind" aria-hidden="true">+</span></summary><div class="ans">${esc(f.a)}</div></details>`,
  );
  if (extra && extra.q && extra.html) {
    items.push(
      `<details><summary>${esc(extra.q)}<span class="ind" aria-hidden="true">+</span></summary><div class="ans prose">${extra.html}</div></details>`,
    );
  }
  return `<div class="faq">\n${items.join('\n')}\n</div>`;
}

// Responsive related-quiz tile grid. Every tile links to a LIVE /quiz/<slug>/.
function renderTiles(pages) {
  const items = pages
    .map((p) => {
      const href = `${SITE.base}/quiz/${p.slug === HUB.slug ? '' : p.slug + '/'}`;
      const b = badgeFor(p.slug, p.name);
      const chip = b.emoji
        ? `<span class="tbadge emoji">${b.text}</span>`
        : `<span class="tbadge">${esc(b.text)}</span>`;
      return `<a class="tile" href="${href}">${chip}<span class="tname">${esc(p.name)}</span></a>`;
    })
    .join('\n');
  return `<div class="tiles">\n${items}\n</div>`;
}

// Difficulty-spread sample Q&A block (answers revealed on click; text stays in DOM).
function renderQA(rows) {
  const items = rows
    .map((r) => {
      const answer = r.o[r.a];
      const opts = r.o.map((o) => `<li>${esc(o)}</li>`).join('');
      return `<li class="qa">
<p class="q">${esc(r.q)}</p>
<ul class="opts">${opts}</ul>
<details class="ans"><summary>Show answer</summary>
<p class="a">Answer: ${esc(answer)}</p>
<p class="why">${esc(r.hint)}</p>
</details>
</li>`;
    })
    .join('\n');
  return `<ol class="qa-list">\n${items}\n</ol>`;
}

// ── Interactive quiz taster (Claude Design website handoff) ───────────────────
// A playable 5-question widget injected into every club/league landing page:
// tap an answer → instant right/wrong → "Your Ball IQ" score. Progressive
// enhancement — the crawlable SEO copy (intro, stats, the static Q&A block, FAQ)
// stays server-rendered; only this widget hydrates. Questions come from the real
// bank and are EXCLUDED from the static Q&A block so playing isn't spoiled.
// Self-contained per page (inline JS, no shared bundle) so each page is robust
// on a cold load. IQ map + fan tiers per the handoff spec.
const TASTER_CSS = `  .taster{padding:22px 0 40px;text-align:center}
  .taster .eyebrow{display:block;margin-bottom:10px}
  .taster h2{margin:0 auto 22px;max-width:20ch;text-align:center}
  .tcard{max-width:560px;margin:0 auto;text-align:left;background:#0F1117;border:1px solid #242836;border-radius:22px;padding:22px;box-shadow:0 30px 60px -30px rgba(0,0,0,.85)}
  .taster-note{margin:16px auto 0;font-size:13px;color:#6E7180;max-width:560px}
  .tph{font-size:15px;font-weight:600;color:#9BA0B8;margin:0;line-height:1.5}
  .th{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .th .tq{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6E7180}
  .th .ts{font-family:var(--mono);font-size:12px;font-weight:700;color:#8AE042;background:rgba(88,204,2,.1);border-radius:999px;padding:4px 11px}
  .tbar{height:6px;border-radius:999px;background:#08090E;overflow:hidden;margin-bottom:18px}
  .tbf{height:100%;background:#58CC02;border-radius:999px;transition:width .3s ease}
  .tqx{font-size:18px;font-weight:800;color:#fff;line-height:1.32;margin-bottom:16px}
  .tos{display:flex;flex-direction:column;gap:9px}
  .to{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:13px 14px;border-radius:13px;border:1.5px solid #242836;background:#0B0D13;color:#E8EAF0;font:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:border-color .15s,background .15s}
  .to:hover:not(:disabled){border-color:#3A3D4A;background:#14161E}
  .to:disabled{cursor:default}
  .to.correct{border-color:rgba(88,204,2,.55);background:rgba(88,204,2,.12);color:#8AE042}
  .to.wrong{border-color:rgba(255,71,71,.5);background:rgba(255,71,71,.1);color:#FF8A82}
  .to.dim{opacity:.5}
  .to .tl{flex:0 0 auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:800;font-size:12px;background:#1F2430;color:#9BA0B8}
  .to.correct .tl{background:#58CC02;color:#06230C}
  .to.wrong .tl{background:#FF4747;color:#fff}
  .to .tt{flex:1}
  .to .tm{font-size:16px}
  .tw{margin-top:12px;font-size:13.5px;color:#9BA0B8;line-height:1.55}
  .tn{margin-top:16px;width:100%;padding:13px;border:none;border-radius:13px;background:#58CC02;color:#06230C;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
  .tn:hover{filter:brightness(1.05)}
  .tn.again{margin-top:12px;background:transparent;border:1px solid #2A2D3A;color:#9BA0B8}
  .tdone{text-align:center;padding:8px 4px}
  .tdone .tdl{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#9BA0B8}
  .tiq{font-family:var(--mono);font-size:64px;font-weight:800;line-height:1;letter-spacing:-.03em;color:#FFC107;margin:8px 0 2px}
  .ttier{font-size:18px;font-weight:800;color:#fff}
  .tscore{font-size:14px;color:#9BA0B8;margin-top:6px}
  .tcta{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:18px}
  .tcta .btn{display:inline-flex;align-items:center;padding:12px 20px;background:#58CC02;color:#06230C;font-weight:800;font-size:14px;border-radius:12px}
  .tcta .btn:hover{text-decoration:none;filter:brightness(1.05)}
  .tcta .btn.store{background:#000;color:#fff;border:1px solid #2A2D3A}
  .tcta .btn.store:hover{border-color:#3A3D4A;filter:none}`;

const TASTER_JS = `(function(){
var box=document.getElementById('biq-taster'),d=document.getElementById('biq-taster-data');
if(!box||!d)return;
var QS;try{QS=JSON.parse(d.textContent)}catch(e){return}
if(!QS||!QS.length)return;
var nm=box.getAttribute('data-name')||'this team',play=box.getAttribute('data-play')||'/',store=box.getAttribute('data-store')||'#';
var IQ=[46,54,63,74,88,99],T=['Casual fan','Casual fan','Solid','Big fan','Superfan','Club legend'];
var i=0,sc=0,p=null;
function e(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function draw(){
if(i>=QS.length){return done()}
var q=QS[i],n=QS.length,pct=Math.round(((i+(p!==null?1:0))/n)*100),os='';
for(var k=0;k<q.o.length;k++){
var cl='to',mk='';
if(p!==null){if(k===q.a){cl+=' correct';mk='<span class="tm">✓</span>'}else if(k===p){cl+=' wrong';mk='<span class="tm">✗</span>'}else{cl+=' dim'}}
os+='<button class="'+cl+'" data-i="'+k+'"'+(p!==null?' disabled':'')+'><span class="tl">'+('ABCD'[k]||'')+'</span><span class="tt">'+e(q.o[k])+'</span>'+mk+'</button>'}
var why=(p!==null&&q.why)?'<p class="tw">'+e(q.why)+'</p>':'';
var nx=(p!==null)?'<button class="tn" data-next="1">'+(i+1>=n?'See your score →':'Next →')+'</button>':'';
box.innerHTML='<div class="th"><span class="tq">Question '+(i+1)+' / '+n+'</span><span class="ts">'+sc+' correct</span></div><div class="tbar"><div class="tbf" style="width:'+pct+'%"></div></div><div class="tqx">'+e(q.q)+'</div><div class="tos">'+os+'</div>'+why+nx;
var bs=box.querySelectorAll('.to');for(var b=0;b<bs.length;b++){bs[b].addEventListener('click',pick)}
var nb=box.querySelector('.tn');if(nb){nb.addEventListener('click',next)}
}
function pick(ev){if(p!==null)return;var k=+ev.currentTarget.getAttribute('data-i');p=k;if(k===QS[i].a)sc++;draw()}
function next(){i++;p=null;draw()}
function done(){
var iq=IQ[sc]!=null?IQ[sc]:IQ[IQ.length-1],ti=T[sc]!=null?T[sc]:T[T.length-1];
box.innerHTML='<div class="tdone"><div class="tdl">Your Ball IQ</div><div class="tiq">'+iq+'</div><div class="ttier">'+e(ti)+'</div><div class="tscore">You scored '+sc+' / '+QS.length+' on the '+e(nm)+' taster</div><div class="tcta"><a class="btn" href="'+play+'">Play the full '+e(nm)+' quiz →</a><a class="btn store" href="'+store+'" rel="noopener">Get the app</a></div><button class="tn again">Play again</button></div>';
var ag=box.querySelector('.again');if(ag){ag.addEventListener('click',function(){i=0;sc=0;p=null;draw()})}
}
draw();
})();`;

// Renders the interactive taster section. `rows` = exactly 5 curated questions
// (excluded from the static Q&A block). `playHref` sends "Play the full quiz"
// straight into that topic in the app.
function renderTaster(rows, name, playHref) {
  const payload = rows.map((r) => ({ q: r.q, o: r.o, a: r.a, why: r.hint }));
  const data = JSON.stringify(payload).replace(/</g, '\\u003c');
  const play = playHref || `${SITE.base}/`;
  return `<section class="taster" id="taster" aria-labelledby="taster-h">
<div class="eyebrow">Free taster</div>
<h2 id="taster-h">How well do you know ${esc(name)}?</h2>
<div class="tcard" id="biq-taster" data-name="${esc(name)}" data-play="${play}" data-store="${SITE.appStore}">
<p class="tph">Five quick questions to rate your ${esc(name)} Ball IQ. <a href="${play}">Play now →</a></p>
</div>
<p class="taster-note">Sample questions shown — the full quiz has many more.</p>
<script type="application/json" id="biq-taster-data">${data}</script>
<script>${TASTER_JS}</script>
</section>`;
}

// ── shared <head> + inline CSS ────────────────────────────────────────────────
// Inter (UI) + JetBrains Mono (numbers/tags) loaded NON-render-blocking, same as
// the app's index.html.
function head({ title, description, canonical, ld }) {
  return `<!DOCTYPE html>
<html lang="en" style="background-color:${PAGE_BG}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="${PAGE_BG}" />
<meta name="color-scheme" content="dark" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE.ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Ball IQ football quiz" />
<meta property="og:site_name" content="${SITE.name}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${SITE.ogImage}" />
<link rel="icon" type="image/png" href="/icon-192.png" sizes="192x192" />
<meta name="apple-itunes-app" content="app-id=6775975961" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" /></noscript>
<style>
  :root{--bg:#0A0A0A;--bg2:#0C0E13;--card:#0F1117;--card2:#14161E;--bd:#242836;--bd2:#2A2D3A;--bd3:#3A3D4A;--grn:#58CC02;--grn-ink:#06230C;--grn-soft:#8AE042;--amber:#FFC107;--wrong:#FF4747;--tx:#F0F1F5;--tx2:#E8EAF0;--tx3:#9BA0B8;--tx4:#6E7180;--mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
  *{box-sizing:border-box;margin:0;padding:0}
  html{background:var(--bg);-webkit-text-size-adjust:100%;scroll-behavior:smooth}
  body{font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:${PAGE_FG};line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  img{max-width:100%;display:block}
  a{color:var(--grn-soft);text-decoration:none}
  a:hover{text-decoration:underline}
  main{max-width:900px;margin:0 auto;padding:0 20px}
  h2{font-size:clamp(22px,3.2vw,32px);font-weight:800;letter-spacing:-.02em;color:#fff;line-height:1.12;margin:0 0 16px}
  /* nav */
  .nav{position:sticky;top:0;z-index:100;background:rgba(10,10,10,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #16181F}
  .nav-in{max-width:900px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
  .brand{display:inline-flex;align-items:center;gap:9px;font-weight:900;font-size:19px;letter-spacing:-.02em;color:#fff}
  .brand:hover{text-decoration:none}
  .brand img{width:28px;height:28px;border-radius:7px}
  .brand b{color:var(--amber);font-weight:900}
  .nav-right{display:flex;align-items:center;gap:16px}
  .nav-link{color:var(--tx3);font-size:14px;font-weight:600}
  .nav-link:hover{color:#fff;text-decoration:none}
  .nav-cta{display:inline-flex;align-items:center;padding:9px 16px;background:var(--grn);color:var(--grn-ink);font-weight:800;font-size:13.5px;border-radius:12px;box-shadow:0 8px 22px -6px rgba(88,204,2,.5)}
  .nav-cta:hover{text-decoration:none;filter:brightness(1.04)}
  /* hero */
  .hero{padding:46px 0 40px}
  .crumbs{font-family:var(--mono);font-size:12px;color:var(--tx4);margin-bottom:22px}
  .crumbs a{color:var(--tx3)}
  .crumbs a:hover{color:#fff;text-decoration:none}
  .crumbs .sep{color:var(--bd3);margin:0 7px}
  .kicker{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .badge-chip{display:inline-flex;align-items:center;justify-content:center;min-width:46px;height:32px;padding:0 10px;border-radius:10px;background:#1F2430;font-family:var(--mono);font-weight:800;font-size:13px;letter-spacing:.03em;color:#fff}
  .badge-chip.emoji{background:rgba(255,255,255,.04);font-size:22px;padding:0 8px}
  .eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--grn)}
  .hero h1{font-size:clamp(36px,5.4vw,60px);font-weight:900;line-height:1.02;letter-spacing:-.03em;color:#fff;margin-bottom:18px}
  .hero-lead{font-size:clamp(16px,2vw,19px);line-height:1.55;color:var(--tx3);max-width:52ch;margin-bottom:26px}
  .cta-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:22px}
  .btn-green{display:inline-flex;align-items:center;gap:8px;padding:14px 24px;background:var(--grn);color:var(--grn-ink);font-weight:800;font-size:15px;border-radius:13px;box-shadow:0 10px 26px -8px rgba(88,204,2,.55)}
  .btn-green:hover{text-decoration:none;filter:brightness(1.05)}
  .hero-stat{font-family:var(--mono);font-size:13px;color:var(--tx4)}
  /* App Store badge */
  .store-badge{display:inline-flex;align-items:center;gap:10px;padding:11px 18px;background:#000;border:1px solid var(--bd2);border-radius:13px}
  .store-badge:hover{text-decoration:none;border-color:var(--bd3)}
  .store-badge svg{flex:0 0 auto}
  .store-badge-tx{display:flex;flex-direction:column;line-height:1.1;text-align:left}
  .store-badge-tx small{font-size:10px;color:var(--tx3);letter-spacing:.02em}
  .store-badge-tx strong{font-size:16px;color:#fff;font-weight:700}
  /* sections */
  .sec{padding:30px 0}
  .sub{color:var(--tx3);font-size:15px;margin:-6px 0 16px;max-width:60ch}
  /* app cta band */
  .appband{position:relative;overflow:hidden;border-radius:24px;padding:clamp(28px,5vw,44px);background:linear-gradient(120deg,#FF6A00,#FFC107)}
  .appband-flame{position:absolute;right:-16px;bottom:-40px;font-size:180px;opacity:.16;pointer-events:none;line-height:1}
  .appband-in{position:relative;max-width:34ch}
  .appband h2{color:#0A0A0A;font-size:clamp(23px,3.4vw,34px);font-weight:900;letter-spacing:-.02em;line-height:1.1;margin-bottom:12px}
  .appband p{color:rgba(10,10,10,.72);font-size:16px;font-weight:600;line-height:1.5;margin-bottom:22px}
  .appband .store-badge{border-color:rgba(10,10,10,.25)}
  /* related tiles */
  .tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
  .tile{display:flex;align-items:center;gap:11px;padding:14px;background:var(--card2);border:1px solid var(--bd);border-radius:14px;transition:border-color .16s,transform .16s}
  .tile:hover{text-decoration:none;border-color:var(--bd3);transform:translateY(-2px)}
  .tbadge{width:36px;height:36px;flex:0 0 auto;border-radius:10px;background:#1F2430;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:12px;font-weight:800;color:#fff;letter-spacing:.02em}
  .tbadge.emoji{background:rgba(255,255,255,.04);font-size:20px}
  .tname{font-size:14.5px;font-weight:700;color:var(--tx)}
  /* faq */
  .faq{border-top:1px solid #1A1D27}
  .faq details{border-bottom:1px solid #1A1D27}
  .faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 2px;cursor:pointer;list-style:none;color:#fff;font-size:17px;font-weight:700}
  .faq summary::-webkit-details-marker{display:none}
  .faq summary .ind{flex:0 0 auto;font-size:24px;line-height:1;color:var(--tx3);transition:transform .2s,color .2s}
  .faq details[open] summary .ind{color:var(--grn);transform:rotate(45deg)}
  .faq .ans{padding:0 2px 22px;color:var(--tx3);font-size:15.5px;line-height:1.65}
  /* prose */
  .prose p{color:#CDD3DE;font-size:16px;line-height:1.7;margin-bottom:14px;max-width:68ch}
  .prose p a{color:var(--grn-soft)}
  .stats{display:inline-block;font-family:var(--mono);font-size:13px;color:var(--tx3);background:var(--card2);border:1px solid var(--bd);border-radius:10px;padding:10px 14px;margin-top:6px}
  /* sample Q&A */
  .qa-list{list-style:none;counter-reset:qa}
  .qa{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:16px 16px 12px;margin-bottom:12px}
  .qa .q{font-weight:700;color:#fff;font-size:16px;margin-bottom:10px}
  .qa .q::before{counter-increment:qa;content:counter(qa) ". ";color:var(--grn-soft);font-family:var(--mono)}
  .opts{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}
  .opts li{font-size:14px;color:var(--tx2);background:#0B0D13;border:1px solid var(--bd);border-radius:8px;padding:8px 11px}
  details.ans{border-top:1px dashed var(--bd);padding-top:10px;margin-top:4px}
  details.ans summary{cursor:pointer;color:var(--grn-soft);font-size:13px;font-weight:700;list-style:none}
  details.ans summary::-webkit-details-marker{display:none}
  details.ans summary::before{content:"▸ "}
  details.ans[open] summary::before{content:"▾ "}
  details.ans .a{color:#fff;font-weight:700;font-size:14px;margin:10px 0 4px}
  details.ans .why{color:var(--tx3);font-size:14px;line-height:1.55}
  /* footer */
  .foot{border-top:1px solid #16181F;background:var(--bg2);margin-top:36px}
  .foot-in{max-width:900px;margin:0 auto;padding:40px 20px 48px}
  .foot-links{display:flex;flex-wrap:wrap;gap:10px 20px;margin:18px 0}
  .foot-links a{color:var(--tx3);font-size:14px}
  .foot-links a:hover{color:#fff;text-decoration:none}
  .foot-copy{color:var(--tx4);font-size:13px;margin-top:4px}
  .foot-disc{color:#5f6478;font-size:11.5px;line-height:1.6;margin-top:14px;max-width:80ch}
  @media(max-width:480px){.opts{grid-template-columns:1fr}}
  @media(max-width:420px){.nav-in{padding:10px 14px}.nav-right{gap:10px}.nav-link{font-size:13px}.nav-cta{padding:8px 13px;font-size:12.5px}.brand{font-size:16px}.brand img{width:24px;height:24px}}
${TASTER_CSS}
</style>
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">${ld}</script>
</head>`;
}

function footer() {
  return `<footer class="foot"><div class="foot-in">
<a class="brand" href="${SITE.base}/"><img src="/marketing/ball.png" alt="Ball IQ" width="26" height="26" />Ball&nbsp;<b>IQ</b></a>
<div class="foot-links">
<a href="${SITE.base}/quiz/premier-league/">Premier League quiz</a>
<a href="${SITE.base}/quiz/manchester-united/">Man United quiz</a>
<a href="${SITE.base}/quiz/champions-league/">Champions League quiz</a>
<a href="${SITE.base}/quiz/">All quizzes</a>
<a href="${SITE.base}/about/">About</a>
<a href="${SITE.base}/contact/">Contact</a>
<a href="${SITE.base}/privacy.html">Privacy</a>
</div>
<p class="foot-copy">© 2026 ${esc(SITE.name)} — ${esc(SITE.tagline)}.</p>
<p class="foot-disc">Ball IQ is an independent football trivia game and is not affiliated with, endorsed by, or associated with FIFA, UEFA, the Premier League, La Liga, Serie A, the Bundesliga, or any club or competition. All team and competition names are used for identification and editorial reference only.</p>
</div></footer>
</body></html>`;
}

// Category slugs whose in-app League Quiz can be deep-launched via
// /play?quiz=<slug> (must stay in sync with QUIZ_SLUG_TO_CAT in src/App.jsx).
const QUIZ_DEEPLINK_SLUGS = new Set([
  'world-cup', 'premier-league', 'champions-league',
  'la-liga', 'serie-a', 'bundesliga', 'euros',
]);

// League category → its clubs' page slugs, for topical cross-links (each league
// page links its own clubs; clubs without a league page ride the hub + club mesh).
const CAT_SLUG_TO_CLUB_SLUGS = {
  'premier-league': ['arsenal', 'liverpool', 'manchester-united', 'manchester-city', 'tottenham', 'chelsea', 'newcastle'],
  'la-liga': ['barcelona', 'real-madrid', 'atletico-madrid'],
  'serie-a': ['juventus', 'inter-milan', 'ac-milan'],
  'bundesliga': ['bayern-munich', 'borussia-dortmund'],
};

// ── per-category page ─────────────────────────────────────────────────────────
function buildCategoryPage(catCfg, livePages, clubPages = []) {
  const all = catRows(catCfg.cat);
  const hints = hintRows(catCfg.cat);
  if (hints.length < MIN_HINTS) {
    throw new Error(
      `[gen-seo] "${catCfg.cat}" has only ${hints.length} hint-bearing MCQs (< ${MIN_HINTS}). Refusing to emit a thin page.`,
    );
  }
  const tasterRows = curate(hints, 5);
  const tasterIds = new Set(tasterRows.map((r) => r.id));
  const sample = curate(hints.filter((r) => !tasterIds.has(r.id)), catCfg.sample);
  const canonical = `${SITE.base}/quiz/${catCfg.slug}/`;

  const ld = jsonLd({
    '@context': 'https://schema.org',
    // Google removed the "Practice problems" (Quiz) rich result in Jan 2026 and
    // the FAQ rich result in 2026 — both now just report an "invalid element" in
    // Search Console without producing any rich result. We keep only the still-
    // supported BreadcrumbList; the visible Q&A + FAQ HTML below is unchanged, so
    // there's no content/SEO loss — just no obsolete structured data.
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE.base}/quiz/` },
          { '@type': 'ListItem', position: 3, name: catCfg.name, item: canonical },
        ],
      },
    ],
  });

  const { lead, rest } = splitLead(catCfg.intro);
  const restHtml = rest.map((p) => `<p>${esc(p)}</p>`).join('\n');

  const easy = all.filter((x) => x.diff === 'easy').length;
  const medium = all.filter((x) => x.diff === 'medium').length;
  const hard = all.filter((x) => x.diff === 'hard').length;

  const deepPlay = QUIZ_DEEPLINK_SLUGS.has(catCfg.slug) ? `${SITE.base}/play?quiz=${catCfg.slug}` : `${SITE.base}/`;
  const related = [
    ...(CAT_SLUG_TO_CLUB_SLUGS[catCfg.slug] || []).map((s) => clubPages.find((p) => p.slug === s)).filter(Boolean),
    ...livePages.filter((p) => p.slug !== catCfg.slug),
  ];

  const html = `${head({ title: catCfg.title, description: catCfg.description, canonical, ld })}
<body>
${NAV}
<main>
${heroSection({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: catCfg.name, url: canonical },
    ],
    badge: { text: CAT_EMOJI[catCfg.slug] || '⚽', emoji: true },
    kind: CAT_KIND[catCfg.slug] || 'League quiz',
    name: catCfg.name,
    h1: catCfg.h1,
    lead,
    statLine: `${all.length}+ ${catCfg.name} questions · new ones added weekly`,
    playHref: '#taster',
  })}
${renderTaster(tasterRows, catCfg.name, deepPlay)}
${appCtaBand(catCfg.name)}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
</section>
<section class="sec">
<h2>${esc(catCfg.name)} quiz — FAQ</h2>
${renderFaq(catCfg.faq, { q: `More about ${catCfg.name}`, html: `${restHtml}\n<p class="stats">Ball IQ has ${all.length} ${esc(catCfg.name)} questions — ${easy} easy, ${medium} medium and ${hard} hard.</p>` })}
</section>
<section class="sec">
<h2>Sample ${esc(catCfg.name)} questions &amp; answers</h2>
<p class="sub">${sample.length} sample questions. Tap “Show answer” to reveal the answer and the story behind it.</p>
${renderQA(sample)}
</section>
</main>
${footer()}`;

  const dir = resolve(DIST, 'quiz', catCfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: catCfg.slug, name: `${catCfg.name} quiz`, count: all.length, canonical };
}

// ── per-club page ─────────────────────────────────────────────────────────────
// Mirrors buildCategoryPage but filters the bank by `club` instead of `cat`.
// Prose comes from scripts/seo/clubs.mjs (fact-checked, currency-verified).
function buildClubPage(cfg, clubPages, catPages) {
  const all = clubRows(cfg.club);
  const hints = clubHintRows(cfg.club);
  if (hints.length < MIN_HINTS) {
    throw new Error(
      `[gen-seo] club "${cfg.club}" has only ${hints.length} hint-bearing MCQs (< ${MIN_HINTS}). Refusing to emit a thin page.`,
    );
  }
  const tasterRows = curate(hints, 5);
  const tasterIds = new Set(tasterRows.map((r) => r.id));
  const sample = curate(hints.filter((r) => !tasterIds.has(r.id)), Math.min(12, hints.length - 5));
  const canonical = `${SITE.base}/quiz/${cfg.slug}/`;

  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE.base}/quiz/` },
          { '@type': 'ListItem', position: 3, name: cfg.name, item: canonical },
        ],
      },
    ],
  });

  const { lead, rest } = splitLead(cfg.intro);
  const restHtml = rest.map((p) => `<p>${esc(p)}</p>`).join('\n');

  const easy = all.filter((x) => x.diff === 'easy').length;
  const medium = all.filter((x) => x.diff === 'medium').length;
  const hard = all.filter((x) => x.diff === 'hard').length;

  const related = [
    ...clubPages.filter((p) => p.slug !== cfg.slug),
    ...catPages,
  ];

  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld })}
<body>
${NAV}
<main>
${heroSection({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: cfg.name, url: canonical },
    ],
    badge: { text: CLUB_BADGE[cfg.slug] || deriveBadge(cfg.name), emoji: false },
    kind: 'Club quiz',
    name: cfg.name,
    h1: cfg.h1,
    lead,
    statLine: `${all.length}+ ${cfg.name} questions · new ones added weekly`,
    playHref: '#taster',
  })}
${renderTaster(tasterRows, cfg.name, `${SITE.base}/play?club=${cfg.slug}`)}
${appCtaBand(cfg.name)}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
</section>
<section class="sec">
<h2>${esc(cfg.name)} quiz — FAQ</h2>
${renderFaq(cfg.faq, { q: `More about ${cfg.name}`, html: `${restHtml}\n<p class="stats">Ball IQ has ${all.length} ${esc(cfg.name)} questions — ${easy} easy, ${medium} medium and ${hard} hard.</p>` })}
</section>
<section class="sec">
<h2>Sample ${esc(cfg.name)} questions &amp; answers</h2>
<p class="sub">${sample.length} sample questions. Tap “Show answer” to reveal the answer and the story behind it.</p>
${renderQA(sample)}
</section>
</main>
${footer()}`;

  const dir = resolve(DIST, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: `${cfg.name} quiz`, count: all.length, canonical };
}

// ── listicle page (cross-cutting "questions and answers" article) ─────────────
function buildListiclePage(cfg, livePages) {
  const rows = cfg.questionIds.map((id) => QB.find((r) => r.id === id)).filter(Boolean);
  if (rows.length < 12) {
    throw new Error(`[gen-seo] listicle "${cfg.slug}" resolved only ${rows.length} questions (< 12). Check questionIds.`);
  }
  // Interactive taster (same as club/category pages): 5 tappable questions,
  // excluded from the static Q&A list below so nothing is spoiled.
  const tasterRows = curate(rows.filter((r) => r.hint && r.type === 'mcq' && Array.isArray(r.o)), 5);
  const hasTaster = tasterRows.length === 5;
  const tasterIds = new Set(tasterRows.map((r) => r.id));
  const listRows = hasTaster ? rows.filter((r) => !tasterIds.has(r.id)) : rows;
  const canonical = `${SITE.base}/quiz/${cfg.slug}/`;
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE.base}/quiz/` },
          { '@type': 'ListItem', position: 3, name: cfg.h1, item: canonical },
        ],
      },
    ],
  });
  const introHtml = cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld })}
<body>
${NAV}
<main>
${heroSection({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: cfg.h1, url: canonical },
    ],
    badge: null,
    kind: 'Quiz',
    name: 'football',
    h1: cfg.h1,
    lead: cfg.lede,
    statLine: `${rows.length} hand-picked football questions · every answer explained`,
    playHref: hasTaster ? '#taster' : `${SITE.base}/`,
    playLabel: hasTaster ? 'Play the taster' : 'Play Ball IQ free',
  })}
${hasTaster ? renderTaster(tasterRows, 'football', `${SITE.base}/`) : ''}
${appCtaBand('football')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(livePages.filter((p) => p.slug !== cfg.slug))}
</section>
<section class="sec">
<h2>FAQ</h2>
${renderFaq(cfg.faq)}
</section>
<section class="sec">
<h2>About this quiz</h2>
<div class="prose">
${introHtml}
</div>
</section>
<section class="sec">
<h2>${listRows.length} football trivia questions &amp; answers</h2>
<p class="sub">Tap “Show answer” to reveal the answer and the story behind it.</p>
${renderQA(listRows)}
</section>
</main>
${footer()}`;
  const dir = resolve(DIST, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: cfg.h1, count: rows.length, canonical };
}

// ── hub page ──────────────────────────────────────────────────────────────────
function buildHubPage(livePages, clubPages) {
  const canonical = `${SITE.base}/quiz/`;
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#hub`,
        name: HUB.title,
        description: HUB.description,
        url: canonical,
        about: { '@type': 'Thing', name: 'Association football trivia' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Quizzes', item: canonical },
        ],
      },
    ],
  });

  const { lead, rest } = splitLead(HUB.intro);
  const restHtml = rest.map((p) => `<p>${esc(p)}</p>`).join('\n');

  const html = `${head({ title: HUB.title, description: HUB.description, canonical, ld })}
<body>
${NAV}
<main>
${heroSection({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: canonical },
    ],
    badge: { text: '⚽', emoji: true },
    kind: 'Football quizzes',
    name: 'football',
    h1: HUB.h1,
    lead,
    statLine: 'Free · no sign-up · every answer explained',
    playHref: null,
  })}
${appCtaBand('football')}
<section class="sec">
<h2>Pick a quiz</h2>
${renderTiles(livePages.filter((p) => p.slug !== HUB.slug))}
</section>
<section class="sec">
<h2>Club quizzes</h2>
<p class="sub">Deep-dive quizzes on Europe's biggest clubs — history, legends and iconic moments.</p>
${renderTiles(clubPages)}
</section>
<section class="sec">
<h2>About Ball IQ quizzes</h2>
<div class="prose">
${restHtml}
</div>
</section>
</main>
${footer()}`;

  const dir = resolve(DIST, 'quiz');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
}

// ── simple content page (About / Contact) ─────────────────────────────────────
// `cfg.body` paragraphs may contain trusted inline HTML (e.g. a mailto link),
// so they're rendered raw — these are hand-authored, never user input.
function buildSimplePage(cfg) {
  const canonical = `${SITE.base}/${cfg.slug}/`;
  const crumb = cfg.slug.charAt(0).toUpperCase() + cfg.slug.slice(1);
  const pageType = cfg.slug === 'contact' ? 'ContactPage' : 'AboutPage';
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': pageType,
        '@id': `${canonical}#page`,
        name: cfg.title,
        description: cfg.description,
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: SITE.name, url: `${SITE.base}/` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: crumb, item: canonical },
        ],
      },
    ],
  });

  const bodyHtml = cfg.body.map((p) => `<p>${p}</p>`).join('\n');

  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld })}
<body>
${NAV}
<main>
${heroSection({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: crumb, url: canonical },
    ],
    badge: null,
    kind: crumb,
    name: 'Ball IQ',
    h1: cfg.h1,
    lead: cfg.lede,
    playHref: null,
  })}
<section class="sec">
<div class="prose">
${bodyHtml}
</div>
</section>
</main>
${footer()}`;

  const dir = resolve(DIST, cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
}

// ── sitemap ───────────────────────────────────────────────────────────────────
function buildSitemap(livePages) {
  const urls = [
    { loc: `${SITE.base}/`, freq: 'daily', pri: '1.0' },
    { loc: `${SITE.base}/quiz/`, freq: 'weekly', pri: '0.8' },
    ...livePages
      .filter((p) => p.slug !== HUB.slug)
      .map((p) => ({ loc: `${SITE.base}/quiz/${p.slug}/`, freq: 'weekly', pri: '0.7' })),
    { loc: `${SITE.base}/about/`, freq: 'monthly', pri: '0.4' },
    { loc: `${SITE.base}/contact/`, freq: 'monthly', pri: '0.4' },
    { loc: `${SITE.base}/privacy.html`, freq: 'monthly', pri: '0.3' },
  ];
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFileSync(resolve(DIST, 'sitemap.xml'), xml, 'utf8');
}

// ── llms.txt (AI / answer-engine discoverability — llmstxt.org convention) ─────
// A concise, link-rich markdown summary LLM crawlers (ChatGPT, Perplexity, Gemini,
// Claude, Google AI Overviews) can use to understand + cite the site. Generated
// from livePages so it auto-grows as new quiz categories ship.
function buildLlmsTxt(livePages, clubPages) {
  const cats = livePages.filter((p) => p.slug !== HUB.slug);
  const quizLinks = [
    `- [Football quizzes hub](${SITE.base}/quiz/): Every free football trivia category, each answer explained.`,
    ...cats.map((p) => `- [${p.name}](${SITE.base}/quiz/${p.slug}/): ${p.name} questions and answers, each with a fact-checked explanation.`),
  ].join('\n');
  const clubLinks = clubPages
    .map((p) => `- [${p.name}](${SITE.base}/quiz/${p.slug}/): ${p.name} questions and answers on the club's history, legends and trophies.`)
    .join('\n');
  const txt = `# Ball IQ

> Ball IQ is a free football (soccer) trivia game with thousands of fact-checked questions across 10 game modes. Play free in any browser at ${SITE.base} or on iPhone.

Every question is human-curated and every answer carries an explained, fact-checked hint. Topics span the World Cup, Premier League, Champions League, La Liga, Serie A, Bundesliga, club legends, managers and records. Game modes include the Daily 7, Footle (a Wordle-style daily footballer guess), live multiplayer for up to 8 players, Survival, Hot Streak and Legends.

## Quizzes
${quizLinks}

## Club quizzes
${clubLinks}

## About
- [About Ball IQ](${SITE.base}/about/): What Ball IQ is, who it is for, and how it works.
- [Contact](${SITE.base}/contact/): How to get in touch.

## Play
- [Play Ball IQ free in your browser](${SITE.base}/): The daily challenge, streaks, a Ball IQ player rating and multiplayer.
- [Ball IQ on the App Store](https://apps.apple.com/app/id6775975961): Free iPhone app.
`;
  writeFileSync(resolve(DIST, 'llms.txt'), txt, 'utf8');
}

// ── QB schema gate ────────────────────────────────────────────────────────────
// Runs inside `npm run build`, so a malformed question row FAILS the deploy
// instead of crashing QuizEngine in production (7 TF-shaped rows without
// q/type shipped exactly that way in the WC2026 pool — never again). Every
// generation-pipeline batch lands through a build, so this gates those too.
function validateQB() {
  const errors = [];
  for (const r of QB) {
    if (!r || typeof r !== 'object') { errors.push('non-object row'); continue; }
    const id = r.id || '(no id)';
    if (!r.id) errors.push(`${id}: missing id — ${JSON.stringify(r).slice(0, 80)}`);
    if (typeof r.q !== 'string' || !r.q.trim()) errors.push(`${id}: missing q`);
    if (!r.type) errors.push(`${id}: missing type`);
    if (r.type === 'mcq') {
      if (!Array.isArray(r.o) || r.o.length < 2) errors.push(`${id}: mcq without a valid options array`);
      else if (typeof r.a !== 'number' || r.a < 0 || r.a >= r.o.length) errors.push(`${id}: mcq answer index out of range`);
    }
    if (r.type === 'tf' && typeof r.a !== 'boolean') errors.push(`${id}: tf without boolean a`);
  }
  if (errors.length) {
    throw new Error(`[gen-seo] QB schema gate FAILED — ${errors.length} malformed row(s):\n` + errors.slice(0, 20).join('\n'));
  }
  console.log(`[gen-seo] QB schema gate: ${QB.length} rows OK`);
}

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(DIST)) {
    throw new Error(`[gen-seo] dist/ not found at ${DIST}. Run "vite build" first.`);
  }
  validateQB();

  // livePages = hub + every category that has prose defined in content.mjs.
  const livePages = [
    { slug: HUB.slug, name: 'All football quizzes', count: null },
    ...CATEGORIES.map((c) => ({ slug: c.slug, name: `${c.name} quiz`, count: catRows(c.cat).length })),
    ...LISTICLES.map((l) => ({ slug: l.slug, name: l.h1, count: l.questionIds.length })),
  ];

  // Club pages: /quiz/<club-slug>/ — same URL namespace, own interlink mesh.
  const clubPages = CLUBS.map((c) => ({ slug: c.slug, name: `${c.name} quiz`, count: clubRows(c.club).length }));

  const built = [];
  for (const c of CATEGORIES) built.push(buildCategoryPage(c, livePages, clubPages));
  const builtListicles = LISTICLES.map((l) => buildListiclePage(l, livePages));
  const builtClubs = CLUBS.map((c) => buildClubPage(c, clubPages, livePages));
  buildHubPage(livePages, clubPages);
  buildSimplePage(ABOUT);
  buildSimplePage(CONTACT);
  buildSitemap([...livePages, ...clubPages]);
  buildLlmsTxt(livePages, clubPages);

  console.log(`[gen-seo] wrote ${built.length} category + ${builtListicles.length} listicle + ${builtClubs.length} club pages + hub + about + contact + sitemap + llms.txt into dist/`);
  for (const b of built) console.log(`  ✓ /quiz/${b.slug}/  (${b.count} Qs in bank)`);
  for (const b of builtListicles) console.log(`  ✓ /quiz/${b.slug}/  (${b.count} featured Qs)`);
  for (const b of builtClubs) console.log(`  ✓ /quiz/${b.slug}/  (club, ${b.count} Qs in bank)`);
  console.log(`  ✓ /quiz/  (hub)`);
  console.log(`  ✓ /about/  ✓ /contact/`);
  console.log(`  ✓ /sitemap.xml  ✓ /llms.txt`);
}

main();
