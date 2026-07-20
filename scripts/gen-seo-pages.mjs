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
import { SITE, HUB, CATEGORIES, LISTICLES, ABOUT, CONTACT, FOOTLE_PAGE } from './seo/content.mjs';
import { CLUBS } from './seo/clubs.mjs';
import { PLAYERS } from './seo/players.mjs';
import { LISTS } from './seo/lists.mjs';
import { NATIONS } from './seo/nations.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

const MIN_HINTS = 15; // fail the build if any category falls below this

// AdSense publisher id. Mirrored in index.html (native-guarded there) and in
// public/ads.txt — all three must agree or AdSense stops serving.
const ADSENSE_CLIENT = 'ca-pub-7467890219483381';

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

// Education Q&A ("flashcard") Quiz node — the ONE quiz structured-data rich
// result Google still supports in 2026: Practice-problems Quiz died Jan 2026
// and FAQ rich results died May 2026 (both removed in f8dcb98), but the
// Education Q&A carousel (Quiz + flashcard Questions) remains live per
// developers.google.com/search/docs/appearance/structured-data/education-qa.
// Content-parity rule: only ever call this with rows the page VISIBLY renders
// (renderQA / the taster) — never with unrendered bank rows. Capped to keep
// <head> lean; a subset of visible content is fine, a superset is not.
const eduQuizLd = (name, rows) => ({
  '@type': 'Quiz',
  name: `${name} quiz`,
  about: { '@type': 'Thing', name },
  hasPart: rows.slice(0, 20).map((r) => ({
    '@type': 'Question',
    eduQuestionType: 'Flashcard',
    text: r.q,
    acceptedAnswer: { '@type': 'Answer', text: `${r.o[r.a]}${r.hint ? ` — ${r.hint}` : ''}` },
  })),
});

const catRows = (cat) => QB.filter((x) => x.cat === cat);
const hintRows = (cat) => catRows(cat).filter((x) => x.hint && x.type === 'mcq' && Array.isArray(x.o));
const clubRows = (club) => QB.filter((x) => x.club === club);
const clubHintRows = (club) => clubRows(club).filter((x) => x.hint && x.type === 'mcq' && Array.isArray(x.o));

// Deterministic medium→hard sample, stable by id. NO "easy": club/league pages
// land on invested fans, and an obvious sample question tells them the whole
// quiz is soft. Lead medium → end hard.
function curate(rows, n) {
  const byDiff = { easy: [], medium: [], hard: [] };
  for (const r of rows) (byDiff[r.diff] || byDiff.medium).push(r);
  for (const k of Object.keys(byDiff)) byDiff[k].sort((a, b) => (a.id < b.id ? -1 : 1));
  const want = { medium: Math.round(n * 0.55) };
  want.hard = n - want.medium;
  const out = [];
  for (const k of ['medium', 'hard']) out.push(...byDiff[k].slice(0, want[k]));
  // Top up from remaining medium→hard rows if a bucket was short (never easy).
  if (out.length < n) {
    const used = new Set(out.map((r) => r.id));
    for (const k of ['medium', 'hard']) {
      for (const r of byDiff[k]) {
        if (out.length >= n) break;
        if (!used.has(r.id)) { out.push(r); used.add(r.id); }
      }
    }
  }
  return out.slice(0, n);
}

// Taster picker — the /quiz page lands on real fans, and a trivially easy
// question insults them. Difficulty labels were re-graded bank-wide (full-MCQ:
// fact obscurity + distractor strength + telegraphing), so "hard" now reliably
// separates a die-hard from a casual (a real fan aces it, a casual is
// challenged — never impossible, since it's their own club). The taster is
// HARD-FIRST, topping up with medium ONLY (never easy) when a club's hard pool
// is thin. Deterministic (stable by id).
function tasterPick(rows, n) {
  const byDiff = { easy: [], medium: [], hard: [] };
  for (const r of rows) (byDiff[r.diff] || byDiff.medium).push(r);
  for (const k of Object.keys(byDiff)) byDiff[k].sort((a, b) => (a.id < b.id ? -1 : 1));
  const out = [...byDiff.hard.slice(0, n)];
  if (out.length < n) {
    const used = new Set(out.map((r) => r.id));
    for (const k of ['medium']) {
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
  napoli: 'NAP', galatasaray: 'GAL', benfica: 'SLB',
  fenerbahce: 'FEN', porto: 'POR', roma: 'ROM', celtic: 'CEL', rangers: 'RAN', marseille: 'OM',
  feyenoord: 'FEY', psv: 'PSV', anderlecht: 'RSCA',
  besiktas: 'BJK', trabzonspor: 'TS', 'club-brugge': 'CLU',
  'red-star-belgrade': 'CZ', 'dinamo-zagreb': 'DIN', basel: 'BAS',
  'nottingham-forest': 'NFO', 'aston-villa': 'AVL', everton: 'EVE',
  'leeds-united': 'LEE', 'west-ham': 'WHU',
  'athletic-bilbao': 'ATH', sevilla: 'SEV', 'real-betis': 'BET',
  'schalke-04': 'S04', 'hamburger-sv': 'HSV',
  fiorentina: 'FIO', lazio: 'LAZ', torino: 'TOR',
  'sporting-cp': 'SCP', 'saint-etienne': 'ASSE',
};
const CAT_EMOJI = {
  'world-cup': '🌍', 'premier-league': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'champions-league': '⭐',
  'la-liga': '🇪🇸', 'serie-a': '🇮🇹', bundesliga: '🇩🇪', euros: '🇪🇺',
  'ligue-1': '🇫🇷', 'super-lig': '🇹🇷', 'primeira-liga': '🇵🇹',
  'football-records': '📊', legends: '🏆', managers: '🧠',
};
const CAT_KIND = {
  'world-cup': 'Tournament quiz', 'champions-league': 'Tournament quiz', euros: 'Tournament quiz',
  'premier-league': 'League quiz', 'la-liga': 'League quiz', 'serie-a': 'League quiz', bundesliga: 'League quiz',
  'ligue-1': 'League quiz', 'super-lig': 'League quiz', 'primeira-liga': 'League quiz',
  'football-records': 'Quiz', legends: 'Quiz', managers: 'Quiz',
};

const deriveBadge = (name) => name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'FB';

// Dynamic OG card for a landing page: unfurls as "How well do you know <name>?"
// in the club's colour (api/og.js ?t=club) instead of the static app image.
// This is the preview a link shows on Reddit/WhatsApp/iMessage — a club-branded
// card massively out-clicks a generic "Ultimate Football Quiz" ad. `color` may
// be undefined (card falls back to brand green); badge/kind mirror the hero.
const clubOgImage = ({ name, badge, color, kind }) => {
  const p = new URLSearchParams({ t: 'club', n: name, k: kind });
  if (badge) p.set('b', badge);
  if (color) p.set('c', color);
  return `${SITE.base}/api/og?${p.toString()}`;
};

// Club brand colours — mirror the app's CLUB_PACKS so the web badges read the
// same as the in-app club list. Light shirts (Real Madrid white, Dortmund
// yellow) get dark text via readableOn(); a hairline border keeps very dark
// badges (Juventus, Newcastle) legible on the near-black cards.
const CLUB_COLOR = {
  arsenal: '#EF0107', liverpool: '#C8102E', 'manchester-united': '#DA291C',
  barcelona: '#A50044', 'real-madrid': '#FFFFFF', 'manchester-city': '#6CABDD',
  chelsea: '#034694', 'bayern-munich': '#DC052D', juventus: '#000000',
  'ac-milan': '#FB090B', 'atletico-madrid': '#CB3524', 'borussia-dortmund': '#FDE100',
  psg: '#003170', 'inter-milan': '#010E80', ajax: '#CC0000', tottenham: '#132257',
  newcastle: '#241F20', napoli: '#12A0D7', galatasaray: '#A90432', benfica: '#E32221',
  fenerbahce: '#163962', porto: '#00428C', roma: '#8E1F2F',
  celtic: '#018749', rangers: '#1B458F', marseille: '#2FAEE0',
  feyenoord: '#DA020E', psv: '#ED1C24', anderlecht: '#52247F',
  besiktas: '#000000', trabzonspor: '#7B1E3C', 'club-brugge': '#0A4595',
  'red-star-belgrade': '#E4002B', 'dinamo-zagreb': '#1B458F', basel: '#002D62',
  'nottingham-forest': '#E53233', 'aston-villa': '#670E36', everton: '#003399',
  'leeds-united': '#1D428A', 'west-ham': '#7A263A',
  'athletic-bilbao': '#EE2523', sevilla: '#CB0007', 'real-betis': '#00954C',
  'schalke-04': '#004E9E', 'hamburger-sv': '#0A3A7A',
  fiorentina: '#592C82', lazio: '#87D8F7', torino: '#8A1E12',
  'sporting-cp': '#008056', 'saint-etienne': '#009E60',
};
const readableOn = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#0A0A0A' : '#fff';
};
const clubBadgeStyle = (slug) => {
  const c = CLUB_COLOR[slug];
  return c ? `background:${c};color:${readableOn(c)};border:1px solid rgba(255,255,255,.16)` : '';
};

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
<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702"/></svg>
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
// Compact App Store button for the two-column quiz hero (single-line "App Store").
function appStoreBadgeMini() {
  return `<a class="store-badge mini" href="${SITE.appStore}" rel="noopener" target="_blank">
<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702"/></svg>
<span class="mini-tx">App Store</span>
</a>`;
}

// Inner hero content (breadcrumb → stat), shared by the single-column heroSection
// (Footle landing, listicles) and the two-column quiz hero (heroTwoCol).
function heroInner({ crumbItems, badge, kind, name, h1, lead, statLine, playHref, playLabel, mini }) {
  const chip = !badge
    ? ''
    : badge.emoji
      ? `<span class="badge-chip emoji">${badge.text}</span>`
      : `<span class="badge-chip"${badge.color ? ` style="background:${badge.color};color:${readableOn(badge.color)};border:1px solid rgba(255,255,255,.16)"` : ''}>${esc(badge.text)}</span>`;
  const ctaRow = playHref
    ? `<div class="cta-row">
<a class="btn-green" href="${playHref}">${esc(playLabel || `Play the ${name} quiz`)} ↓</a>
${mini ? appStoreBadgeMini() : appStoreBadge()}
</div>`
    : '';
  const stat = statLine ? `<p class="hero-stat">${esc(statLine)}</p>` : '';
  return `${crumbs(crumbItems)}
<div class="kicker">${chip}<span class="eyebrow">${esc(kind)}</span></div>
<h1>${esc(h1)}</h1>
<p class="hero-lead">${esc(lead)}</p>
${ctaRow}
${stat}`;
}

// Single-column hero (Footle landing, listicles).
function heroSection(props) {
  return `<section class="hero">
<div class="hero-glow" aria-hidden="true"></div>
<div class="hero-in">
${heroInner(props)}
</div>
</section>`;
}

// Two-column quiz hero: intro/CTA on the left, playable taster (rightHtml) on
// the right (Claude Design "Quiz Landing" handoff). Stacks on narrow screens.
function heroTwoCol(props, rightHtml) {
  return `<section class="hero">
<div class="hero-glow" aria-hidden="true"></div>
<div class="hero-grid">
<div class="hero-left">${heroInner({ ...props, mini: true })}</div>
<div class="hero-right">${rightHtml}</div>
</div>
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

// ── AdSense display slots ────────────────────────────────────────────────────
// The loader lives in head(). These <ins> blocks are the actual inventory —
// without them the loader runs and renders nothing (which was the state until
// now: all cost, no revenue).
//
// PLACEMENT POLICY — slots go BELOW appCtaBand(), never above it, and never
// adjacent to the hero taster. Two independent reasons, both load-bearing:
//   1. Funnel. The taster + CTA band turn a searcher into a player and then an
//      install, which is worth far more than an impression. Anything competing
//      for attention above the CTA band trades a high-value conversion for a
//      low-value click. Below it, the reader has already declined to convert —
//      that attention is free to monetise.
//   2. AdSense policy. Ads adjacent to interactive elements attract accidental
//      clicks; Google classes that as invalid traffic and penalises at the
//      ACCOUNT level, not the page level. The taster is interactive. Keep away.
//
// SLOT IDS come from ad units created in the AdSense dashboard — they are not
// derivable from code. AD_SLOTS is empty until those exist; adSlot() renders
// nothing while a slot id is absent, so the generator stays safe to run.
const AD_SLOTS = {
  // afterQA: '1234567890',
  // afterFaq: '0987654321',
  // listInline: '1122334455',  // in-table slot on long /lists pages (every ~20 rows)
};

// The loader is only emitted when real slots exist AND the page type carries
// them (head({ ads: true })). This is the whole point: before this, every
// generated page — including Contact and About, which have no ad slots and
// never will — pulled Google's ad library on every visit. All cost, no revenue,
// on the fastest pages we own. With AD_SLOTS empty, NO page loads it.
const ADS_ENABLED = Object.keys(AD_SLOTS).length > 0;

function adSlot(key, label) {
  const id = AD_SLOTS[key];
  if (!id) return '';
  return `<aside class="ad-slot" aria-label="${esc(label || 'Advertisement')}">
<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${id}" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</aside>`;
}

// Responsive related-quiz tile grid. Every tile links to a LIVE /quiz/<slug>/.
function renderTiles(pages) {
  const items = pages
    .map((p) => {
      const href = `${SITE.base}/quiz/${p.slug === HUB.slug ? '' : p.slug + '/'}`;
      const b = badgeFor(p.slug, p.name);
      const chip = b.emoji
        ? `<span class="tbadge emoji">${b.text}</span>`
        : `<span class="tbadge" style="${clubBadgeStyle(p.slug)}">${esc(b.text)}</span>`;
      return `<a class="tile" href="${href}">${chip}<span class="tname">${esc(p.name)}</span></a>`;
    })
    .join('\n');
  return `<div class="tiles">\n${items}\n</div>`;
}

// ── Option shuffling for the STATIC pages ────────────────────────────────────
// The APP shuffles options at render time (App.jsx: `shuffle([0,1,2,3])` then
// remaps `a`), so the stored `a` index is only an authoring convention — most
// authors write the correct option first and it never shows in-product. The
// generator has no such shuffle, so that convention leaked straight onto the
// landing pages: 56% of club questions are stored at index 0, and 8 clubs
// (Chelsea, Atlético, PSG, Inter, AC Milan, Dortmund, Rangers, PSV) are 100%
// answer-first — i.e. the playable taster on our highest-intent SEO pages could
// be aced by tapping the first option every time. Fixed here, at the render
// boundary, NOT in the bank (the data is fine; only presentation was wrong).
//
// MUST be deterministic: a Math.random shuffle would reorder every page on
// every build, churning dist/ diffs forever. Seeded on the question's stable
// sha1 id, so a given question always shuffles the same way.
const seedFromId = (id) => {
  let h = 2166136261 >>> 0; // FNV-1a
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
};
function shuffleOptions(r) {
  if (!Array.isArray(r.o) || r.o.length < 2 || typeof r.a !== 'number') return r;
  const idx = r.o.map((_, i) => i);
  let h = seedFromId(r.id ?? r.q);
  // Fisher-Yates driven by a deterministic xorshift32 PRNG.
  for (let i = idx.length - 1; i > 0; i--) {
    h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { ...r, o: idx.map((i) => r.o[i]), a: idx.indexOf(r.a) };
}

// Difficulty-spread sample Q&A block (answers revealed on click; text stays in DOM).
function renderQA(rows) {
  const items = rows
    .map((row) => {
      const r = shuffleOptions(row);
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
const TASTER_CSS = `  .taster{text-align:left}
  .taster .eyebrow{display:block;margin-bottom:8px}
  .taster h2{margin:8px 0 16px;text-align:left;font-size:clamp(21px,2.4vw,28px)}
  .tcard{max-width:none;margin:0;text-align:left;background:#0F1117;border:1px solid #242836;border-radius:22px;padding:22px;box-shadow:0 30px 60px -30px rgba(0,0,0,.85)}
  .taster-note{margin:14px 0 0;font-size:13px;color:#6E7180}
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
  // shuffleOptions: without it the taster could be aced by tapping option 1
  // every time (the stored `a` is answer-first for 56% of club questions).
  const payload = rows.map(shuffleOptions).map((r) => ({ q: r.q, o: r.o, a: r.a, why: r.hint }));
  const data = JSON.stringify(payload).replace(/</g, '\\u003c');
  const play = playHref || `${SITE.base}/`;
  return `<section class="taster" id="taster" aria-labelledby="taster-h">
<div class="eyebrow">Free taster · No sign-up</div>
<h2 id="taster-h">How well do you know ${esc(name)}?</h2>
<div class="tcard" id="biq-taster" data-name="${esc(name)}" data-play="${play}" data-store="${SITE.appStore}">
<p class="tph">Five quick questions to rate your ${esc(name)} Ball IQ. <a href="${play}">Play now →</a></p>
</div>
<p class="taster-note">Sample questions shown — the full quiz has many more.</p>
<script type="application/json" id="biq-taster-data">${data}</script>
<script>${TASTER_JS}</script>
</section>`;
}

// ── "What the <topic> quiz covers" topic grid (Claude Design handoff) ─────────
// Six generic-but-on-topic cards. Reassures the searcher what's inside + adds
// crawlable keyword coverage (history, players, managers, trophies, records).
const CLUB_COVERS = (n) => [
  ['Club history', `Founding, golden eras and the moments that shaped ${n}.`],
  ['Players & legends', 'Cult heroes and record-breakers, past and present.'],
  ['Managers', 'The bosses in the dugout and the trophies they won.'],
  ['Trophies & honours', 'Every title, cup and big European night that counts.'],
  ['Records & stats', 'Appearances, goals, transfers and all-time bests.'],
  ['Iconic moments', 'Famous games, comebacks and unforgettable goals.'],
];
const LEAGUE_COVERS = (n) => [
  ['Champions & title races', 'Every winner and the races that went down to the wire.'],
  ['Players & legends', `The stars and record-breakers who defined the ${n}.`],
  ['Managers', 'The great bosses and the dynasties they built.'],
  ['Trophies & records', 'Top scorers, appearances, transfers and all-time bests.'],
  ['Famous matches', 'Iconic games, comebacks and unforgettable goals.'],
  ['History & eras', 'Founding stories, golden eras and how it all evolved.'],
];
const PLAYER_COVERS = (n) => [
  ['Career & clubs', `Every club ${n} played for and the moves in between.`],
  ['Trophies & honours', 'Leagues, cups and the biggest nights of the career.'],
  ['Goals & records', 'The milestones, the tallies and the records set.'],
  ['International', 'The national-team story — tournaments, caps and glory.'],
  ['Iconic moments', 'The goals and games fans will never forget.'],
  ['Awards', "Ballon d'Ors, Golden Boots and individual honours."],
];
function renderCovers(name, isLeague, isPlayer) {
  const set = isPlayer ? PLAYER_COVERS(name) : isLeague ? LEAGUE_COVERS(name) : CLUB_COVERS(name);
  const cards = set
    .map(([t, d]) => `<div class="cov"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`)
    .join('\n');
  return `<section class="sec">
<h2>What the ${esc(name)} quiz covers</h2>
<p class="sub">Every question is written and checked by football fans, across the topics that decide a real ${esc(name)} expert:</p>
<div class="covers">${cards}</div>
</section>`;
}

// ── shared <head> + inline CSS ────────────────────────────────────────────────
// Inter (UI) + JetBrains Mono (numbers/tags) loaded NON-render-blocking, same as
// the app's index.html.
// `ads` opts a page type INTO the AdSense loader. Only pages that actually
// render adSlot() calls should pass it — see the AD_SLOTS placement policy.
// The account meta below stays on every page unconditionally: it is inert
// (makes no request) and is Google's raw-HTML site-ownership signal.
function head({ title, description, canonical, ld, ads = false, ogImage = SITE.ogImage }) {
  return `<!DOCTYPE html>
<html lang="en" style="background-color:${PAGE_BG}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="${PAGE_BG}" />
<meta name="color-scheme" content="dark" />
<meta name="robots" content="max-image-preview:large" />
<meta name="google-adsense-account" content="${ADSENSE_CLIENT}" />${ads && ADS_ENABLED ? `
<script>
/* AdSense loader — WEB ONLY, injected behind a native guard mirroring index.html.
   These pages are authored for the web, but capacitor's webDir:"dist" copies the
   WHOLE build into the iOS/Android app bundle — they ship inside the native app
   whether or not anything links to them. A raw <script src> here would mean the
   native app fetches Google's ad/tracking script the moment any route reaches
   one, silently contradicting the App Store privacy declaration (no ads / no
   analytics). Today nothing reaches them — main.jsx gates marketing on !native
   and the AASA only claims /join/* and /c/* — but that is a property of the
   ROUTING, not of these pages, and routing changes. This guard makes it
   structural rather than a comment someone has to remember. */
(function(){try{
  var native = location.protocol === 'capacitor:' ||
    (window.Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) ||
    document.documentElement.classList.contains('native-app');
  if (native) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}catch(e){}})();
</script>` : ''}
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Ball IQ football quiz" />
<meta property="og:site_name" content="${SITE.name}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${ogImage}" />
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
  main{max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,44px)}
  /* readable inner width for long-form/list sections (handoff keeps prose + FAQ narrow inside the wide frame) */
  .narrow{max-width:760px;margin-left:auto;margin-right:auto}
  h2{font-size:clamp(22px,3.2vw,32px);font-weight:800;letter-spacing:-.02em;color:#fff;line-height:1.12;margin:0 0 16px}
  /* nav */
  .nav{position:sticky;top:0;z-index:100;background:rgba(10,10,10,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #16181F}
  .nav-in{max-width:none;margin:0 auto;padding:13px clamp(20px,4vw,48px);display:flex;align-items:center;justify-content:space-between;gap:12px}
  .brand{display:inline-flex;align-items:center;gap:10px;font-weight:900;font-size:20px;letter-spacing:-.02em;color:#fff}
  .brand:hover{text-decoration:none}
  .brand img{width:32px;height:32px;border-radius:8px}
  .brand b{color:var(--amber);font-weight:900}
  .nav-right{display:flex;align-items:center;gap:16px}
  .nav-link{color:var(--tx3);font-size:14px;font-weight:600}
  .nav-link:hover{color:#fff;text-decoration:none}
  .nav-cta{display:inline-flex;align-items:center;padding:9px 16px;background:var(--grn);color:var(--grn-ink);font-weight:800;font-size:13.5px;border-radius:12px;box-shadow:0 8px 22px -6px rgba(88,204,2,.5)}
  .nav-cta:hover{text-decoration:none;filter:brightness(1.04)}
  /* hero */
  .hero{padding:46px 0 40px;position:relative;overflow:hidden}
  .hero-in{position:relative;z-index:2}
  .hero-glow{position:absolute;top:16%;left:72%;width:min(560px,86vw);height:min(560px,86vw);background:radial-gradient(circle,rgba(88,204,2,.14) 0%,rgba(88,204,2,.04) 42%,transparent 66%);transform:translate(-50%,-50%);animation:glowPulse 5s ease-in-out infinite;pointer-events:none;z-index:0}
  @keyframes glowPulse{0%,100%{opacity:.4}50%{opacity:.72}}
  @media(prefers-reduced-motion:reduce){.hero-glow{animation:none}}
  /* two-column quiz hero: intro/CTA left, playable taster right */
  .hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,0.98fr);gap:clamp(28px,4vw,52px);align-items:center}
  .hero-left,.hero-right{min-width:0}
  @media(max-width:940px){.hero-grid{grid-template-columns:1fr;gap:30px}}
  /* "What the <club> quiz covers" topic grid */
  .covers{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:12px;margin-top:6px}
  .cov{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px 18px 16px}
  .cov h3{font-size:15.5px;font-weight:800;color:#fff;margin:0 0 6px;letter-spacing:-.01em}
  .cov p{font-size:13.5px;color:var(--tx3);line-height:1.5;margin:0}
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
  .store-badge.mini{padding:13px 20px}
  .store-badge.mini .mini-tx{font-size:15px;color:#fff;font-weight:700}
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
  /* ad slots — min-height reserves the box BEFORE the ad arrives, so filling it
     shifts nothing. Ads are the classic CLS offender and these pages live or die
     on Core Web Vitals; an unreserved slot would trade search rank for ad pennies.
     The label keeps us the right side of AdSense's "clearly labelled" rule and
     stops a unit reading as our own content. */
  .ad-slot{max-width:760px;margin:10px auto 26px;min-height:280px}
  .ad-slot::before{content:"Advertisement";display:block;margin-bottom:6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx4)}
  .ad-slot .adsbygoogle{display:block;min-height:250px}
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
  .foot-in{max-width:none;margin:0 auto;padding:40px clamp(20px,4vw,48px) 48px}
  .foot .brand img{width:28px;height:28px}
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
<a href="${SITE.base}/lists/">Football lists</a>
<a href="${SITE.base}/football-wordle/">Footle — football Wordle</a>
<a href="${SITE.base}/about/">About</a>
<a href="${SITE.base}/contact/">Contact</a>
<a href="${SITE.base}/privacy.html">Privacy</a>
</div>
<p class="foot-copy">Ball IQ is 100% free — no ads in the app.</p>
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
  'ligue-1', 'super-lig', 'primeira-liga',
]);

// League category → its clubs' page slugs, for topical cross-links (each league
// page links its own clubs; clubs without a league page ride the hub + club mesh).
const CAT_SLUG_TO_CLUB_SLUGS = {
  'premier-league': ['arsenal', 'liverpool', 'manchester-united', 'manchester-city', 'tottenham', 'chelsea', 'newcastle'],
  'la-liga': ['barcelona', 'real-madrid', 'atletico-madrid'],
  'serie-a': ['juventus', 'inter-milan', 'ac-milan', 'napoli', 'roma'],
  'bundesliga': ['bayern-munich', 'borussia-dortmund'],
  'ligue-1': ['psg'],
  'super-lig': ['galatasaray', 'fenerbahce'],
  'primeira-liga': ['benfica', 'porto'],
};

// Loud resolver: a mapped slug with no live club page is mesh drift — fail the
// build rather than silently dropping the link (a .filter(Boolean) here once
// hid orphaned club pages for weeks).
function resolveLeagueClubs(catSlug, clubPages) {
  return (CAT_SLUG_TO_CLUB_SLUGS[catSlug] || []).map((s) => {
    const page = clubPages.find((p) => p.slug === s);
    if (!page) {
      throw new Error(`[gen-seo] CAT_SLUG_TO_CLUB_SLUGS maps "${catSlug}" → "${s}", but no club page has that slug. Fix the map or scripts/seo/clubs.mjs.`);
    }
    return page;
  });
}

// ── per-category page ─────────────────────────────────────────────────────────
function buildCategoryPage(catCfg, livePages, clubPages = [], playerPages = []) {
  const all = catRows(catCfg.cat);
  const hints = hintRows(catCfg.cat);
  if (hints.length < MIN_HINTS) {
    throw new Error(
      `[gen-seo] "${catCfg.cat}" has only ${hints.length} hint-bearing MCQs (< ${MIN_HINTS}). Refusing to emit a thin page.`,
    );
  }
  const tasterRows = tasterPick(hints, 5);
  const tasterIds = new Set(tasterRows.map((r) => r.id));
  const sample = curate(hints.filter((r) => !tasterIds.has(r.id)), catCfg.sample);
  const canonical = `${SITE.base}/quiz/${catCfg.slug}/`;

  const ld = jsonLd({
    '@context': 'https://schema.org',
    // Structured-data policy (2026): Practice-problems Quiz + FAQPage rich
    // results are dead (dropped in f8dcb98 — they only produce "invalid
    // element" noise in Search Console). BreadcrumbList remains supported,
    // and the Education Q&A FLASHCARD Quiz variant is still live — emitted
    // here anchored to the same `sample` rows renderQA() prints below.
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE.base}/quiz/` },
          { '@type': 'ListItem', position: 3, name: catCfg.name, item: canonical },
        ],
      },
      eduQuizLd(catCfg.name, sample),
    ],
  });

  const { lead, rest } = splitLead(catCfg.intro);
  const restHtml = rest.map((p) => `<p>${esc(p)}</p>`).join('\n');

  const easy = all.filter((x) => x.diff === 'easy').length;
  const medium = all.filter((x) => x.diff === 'medium').length;
  const hard = all.filter((x) => x.diff === 'hard').length;

  const deepPlay = QUIZ_DEEPLINK_SLUGS.has(catCfg.slug) ? `${SITE.base}/play?quiz=${catCfg.slug}` : `${SITE.base}/`;
  const related = [
    ...resolveLeagueClubs(catCfg.slug, clubPages),
    ...livePages.filter((p) => p.slug !== catCfg.slug),
    ...playerPages,
  ];

  const catKind = CAT_KIND[catCfg.slug] || 'League quiz';
  const ogImage = clubOgImage({ name: catCfg.name, badge: '', color: CLUB_COLOR[catCfg.slug], kind: catKind });
  const html = `${head({ title: catCfg.title, description: catCfg.description, canonical, ld, ads: true, ogImage })}
<body>
${NAV}
<main>
${heroTwoCol({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: catCfg.name, url: canonical },
    ],
    badge: { text: CAT_EMOJI[catCfg.slug] || '⚽', emoji: true },
    kind: catKind,
    name: catCfg.name,
    h1: catCfg.h1,
    lead: catCfg.description,
    statLine: `Free · ${all.length}+ ${catCfg.name} questions · new ones added weekly`,
    playHref: '#taster',
  }, renderTaster(tasterRows, catCfg.name, deepPlay))}
${renderCovers(catCfg.name, true)}
${appCtaBand(catCfg.name)}
<section class="sec narrow">
<h2>${esc(catCfg.name)} sample questions &amp; answers</h2>
<p class="sub">Tap &ldquo;Show answer&rdquo; to reveal the answer and the story behind it.</p>
${renderQA(sample)}
</section>
${adSlot('afterQA')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
</section>
<section class="sec narrow">
<h2>${esc(catCfg.name)} quiz — FAQ</h2>
${renderFaq(catCfg.faq, { q: `About the ${catCfg.name} quiz`, html: `${catCfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n')}\n<p class="stats">Ball IQ has ${all.length} ${esc(catCfg.name)} questions — ${easy} easy, ${medium} medium and ${hard} hard.</p>` })}
</section>
${adSlot('afterFaq')}
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
function buildClubPage(cfg, clubPages, catPages, playerPages = []) {
  const all = clubRows(cfg.club);
  const hints = clubHintRows(cfg.club);
  if (hints.length < MIN_HINTS) {
    throw new Error(
      `[gen-seo] club "${cfg.club}" has only ${hints.length} hint-bearing MCQs (< ${MIN_HINTS}). Refusing to emit a thin page.`,
    );
  }
  const tasterRows = tasterPick(hints, 5);
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
      // Flashcard Quiz node anchored to the visible sample Q&A (see the
      // structured-data policy note in buildCategoryPage).
      eduQuizLd(cfg.name, sample),
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
    ...playerPages,
  ];

  const clubBadge = CLUB_BADGE[cfg.slug] || deriveBadge(cfg.name);
  const ogImage = clubOgImage({ name: cfg.name, badge: clubBadge, color: CLUB_COLOR[cfg.slug], kind: 'Club quiz' });
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true, ogImage })}
<body>
${NAV}
<main>
${heroTwoCol({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: cfg.name, url: canonical },
    ],
    badge: { text: clubBadge, emoji: false, color: CLUB_COLOR[cfg.slug] },
    kind: 'Club quiz',
    name: cfg.name,
    h1: cfg.h1,
    lead: cfg.description,
    statLine: `Free · ${all.length}+ ${cfg.name} questions · new ones added weekly`,
    playHref: '#taster',
  }, renderTaster(tasterRows, cfg.name, `${SITE.base}/play?club=${cfg.slug}`))}
${renderCovers(cfg.name, false)}
${appCtaBand(cfg.name)}
<section class="sec narrow">
<h2>${esc(cfg.name)} sample questions &amp; answers</h2>
<p class="sub">Tap &ldquo;Show answer&rdquo; to reveal the answer and the story behind it.</p>
${renderQA(sample)}
</section>
${adSlot('afterQA')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
</section>
<section class="sec narrow">
<h2>${esc(cfg.name)} quiz — FAQ</h2>
${renderFaq(cfg.faq, { q: `About the ${cfg.name} quiz`, html: `${cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n')}\n<p class="stats">Ball IQ has ${all.length} ${esc(cfg.name)} questions — ${easy} easy, ${medium} medium and ${hard} hard.</p>` })}
</section>
${adSlot('afterFaq')}
</main>
${footer()}`;

  const dir = resolve(DIST, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: `${cfg.name} quiz`, count: all.length, canonical };
}

// ── per-player page ───────────────────────────────────────────────────────────
// Mirrors buildClubPage, but the bank has no `player` field — a question is
// "about" a player if any `match` alternative appears in the stem or the
// correct answer. Prose comes from scripts/seo/players.mjs (fact-checked). No
// in-app "player quiz" mode, so the taster funnels to the game at /play.
function playerHintRows(match) {
  const re = new RegExp('(' + match.join('|') + ')', 'i');
  return QB.filter(
    (x) =>
      x.type === 'mcq' &&
      Array.isArray(x.o) &&
      x.hint &&
      (re.test(x.q) || (x.a != null && re.test(x.o[x.a] || ''))),
  );
}
function buildPlayerPage(cfg, clubPages, catPages) {
  const hints = playerHintRows(cfg.match);
  if (hints.length < MIN_HINTS) {
    throw new Error(`[gen-seo] player "${cfg.slug}" has only ${hints.length} hint MCQs (< ${MIN_HINTS}). Refusing a thin page.`);
  }
  const tasterRows = tasterPick(hints, 5);
  const tasterIds = new Set(tasterRows.map((r) => r.id));
  // Visible sample Q&A (same pattern as category/club pages) — also anchors
  // the flashcard Quiz node below. MIN_HINTS guard above guarantees ≥10 left.
  const sample = curate(hints.filter((r) => !tasterIds.has(r.id)), Math.min(10, hints.length - 5));
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
      eduQuizLd(cfg.name, sample),
    ],
  });
  const related = [...clubPages.slice(0, 8), ...catPages.filter((p) => p.slug !== HUB.slug).slice(0, 4)];
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true })}
<body>
${NAV}
<main>
${heroTwoCol({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: cfg.name, url: canonical },
    ],
    badge: { text: cfg.initials, emoji: false },
    kind: 'Player quiz',
    name: cfg.name,
    h1: cfg.h1,
    lead: cfg.description,
    statLine: `Free · ${hints.length}+ ${cfg.name} questions · new ones added weekly`,
    playHref: '#taster',
  }, renderTaster(tasterRows, cfg.name, `${SITE.base}/play`))}
${renderCovers(cfg.name, false, true)}
${appCtaBand(cfg.name)}
<section class="sec narrow">
<h2>${esc(cfg.name)} sample questions &amp; answers</h2>
<p class="sub">Tap &ldquo;Show answer&rdquo; to reveal the answer and the story behind it.</p>
${renderQA(sample)}
</section>
${adSlot('afterQA')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
</section>
<section class="sec narrow">
<h2>${esc(cfg.name)} quiz — FAQ</h2>
${renderFaq(cfg.faq, { q: `About the ${cfg.name} quiz`, html: `${cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n')}` })}
</section>
${adSlot('afterFaq')}
</main>
${footer()}`;
  const dir = resolve(DIST, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: `${cfg.name} quiz`, count: hints.length, canonical };
}

// ── reference-list page (/lists/<slug>/) ────────────────────────────────────────
// Settled-fact tables (Ballon d'Or winners, CL winners by year, PL top scorers…)
// as SEO / AI-answer pages that funnel into the quizzes. Data is forge-verified
// in scripts/seo/lists.mjs. Auto-interlinks into club + player /quiz/ pages by
// scanning the rows for known entities — feeding the internal-link mesh.
function listRelatedPages(rows, clubPages, playerPages) {
  const hay = rows.flat().join(' | ').toLowerCase();
  const out = [];
  const seen = new Set();
  const add = (p) => { if (!seen.has(p.slug)) { seen.add(p.slug); out.push(p); } };
  for (const p of playerPages) {
    const surname = p.name.replace(/ quiz$/i, '').split(' ').pop().toLowerCase();
    if (surname.length > 3 && hay.includes(surname)) add(p);
  }
  for (const c of clubPages) {
    const nm = c.name.replace(/ quiz$/i, '').toLowerCase();
    if (nm.length > 3 && hay.includes(nm)) add(c);
  }
  return out.slice(0, 12);
}
function buildListPage(cfg, clubPages, playerPages, catPages) {
  const canonical = `${SITE.base}/lists/${cfg.slug}/`;
  const cols = cfg.columns;
  const rows = cfg.rows;
  const related = listRelatedPages(rows, clubPages, playerPages);
  const tiles = related.length >= 4 ? related : [...related, ...catPages.filter((p) => p.slug !== HUB.slug).slice(0, 6 - related.length)];
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Football lists', item: `${SITE.base}/lists/` },
          { '@type': 'ListItem', position: 3, name: cfg.h1, item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: cfg.h1,
        numberOfItems: rows.length,
        itemListElement: rows.slice(0, 100).map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: r.filter(Boolean).slice(0, 2).join(' — '),
        })),
      },
    ],
  });
  const asOf = cfg.updated ? ` · verified ${cfg.updated}` : '';
  // Long lists intersperse an in-table ad every AD_EVERY rows (dormant until an
  // AD_SLOTS.listInline id exists — adSlot returns '' otherwise, so nothing ships
  // until AdSense is approved). Kept modest + never above the first screen of data.
  const AD_EVERY = 20;
  const bodyRows = rows
    .map((r, idx) => {
      const tr = `<tr>${r.map((cell, i) => `<td${i === 0 ? ' class="lt-first"' : ''}>${esc(cell)}</td>`).join('')}</tr>`;
      if ((idx + 1) % AD_EVERY === 0 && idx + 1 < rows.length) {
        const ad = adSlot('listInline', 'Advertisement');
        if (ad) return `${tr}\n<tr class="ltable-ad"><td colspan="${cols.length}">${ad}</td></tr>`;
      }
      return tr;
    })
    .join('\n');
  const table = `<div class="ltable-wrap"><table class="ltable">
<thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
<tbody>
${bodyRows}
</tbody></table></div>`;
  const style = `<style>
  .ltable-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--bd);border-radius:14px;background:var(--card)}
  .ltable{border-collapse:collapse;width:100%;font-size:15px;min-width:min(100%,520px)}
  .ltable th{text-align:left;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.04em;font-size:12px;padding:12px 14px;border-bottom:1px solid var(--bd2);white-space:nowrap;position:sticky;top:0;background:var(--card2)}
  .ltable td{padding:11px 14px;border-bottom:1px solid var(--bd);color:var(--tx2);vertical-align:top}
  .ltable tbody tr:last-child td{border-bottom:0}
  .ltable tbody tr:nth-child(even){background:rgba(255,255,255,.015)}
  .ltable .lt-first{font-weight:700;color:#fff;white-space:nowrap}
  .ltable-ad td{padding:12px 14px;background:rgba(255,255,255,.02)}
  .ltable-ad td .ad-slot{margin:0}
  </style>`;
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true })}
<body>
${NAV}
<main>
${style}
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <a href="${SITE.base}/lists/">Football lists</a> › <span>${esc(cfg.h1)}</span></nav>
<h1 style="font-size:clamp(26px,4.4vw,40px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 6px">${esc(cfg.h1)}</h1>
<p class="sub" style="color:var(--tx3);margin:0 0 18px">${rows.length} entries${asOf} · free · from the Ball IQ football team</p>
${cfg.intro.map((p) => `<p style="margin:0 0 14px;color:var(--tx2)">${esc(p)}</p>`).join('\n')}
</section>
<section class="sec narrow">
${table}
</section>
${adSlot('afterQA')}
${appCtaBand(cfg.ctaName || 'football')}
<section class="sec">
<h2>Quizzes to test yourself</h2>
${renderTiles(tiles)}
</section>
<section class="sec narrow">
<h2>${esc(cfg.h1)} — FAQ</h2>
${renderFaq(cfg.faq)}
</section>
${adSlot('afterFaq')}
</main>
${footer()}`;
  const dir = resolve(DIST, 'lists', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: cfg.h1, count: rows.length, canonical };
}

// ── /lists hub ──────────────────────────────────────────────────────────────────
// Index page for every reference list. Gives the (otherwise sitemap-only) list
// pages internal crawl paths + authority, and is itself an SEO page for
// "football lists / records / winners". Linked from the shared footer.
function buildListsHubPage(lists, clubPages, catPages) {
  if (!lists.length) return null;
  const canonical = `${SITE.base}/lists/`;
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Football lists', item: canonical },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Football reference lists',
        numberOfItems: lists.length,
        itemListElement: lists.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.h1, url: `${SITE.base}/lists/${l.slug}/` })),
      },
    ],
  });
  const cards = lists
    .map((l) => `<a class="lcard" href="${SITE.base}/lists/${l.slug}/">
<span class="lcard-t">${esc(l.h1)}</span>
<span class="lcard-d">${esc(l.description)}</span>
<span class="lcard-n">${l.rows.length} entries →</span></a>`)
    .join('\n');
  const style = `<style>
  .lcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:14px;margin-top:8px}
  .lcard{display:flex;flex-direction:column;gap:6px;padding:18px;border:1px solid var(--bd);border-radius:14px;background:var(--card);transition:border-color .15s,transform .15s}
  .lcard:hover{border-color:var(--bd3);transform:translateY(-2px);text-decoration:none}
  .lcard-t{font-weight:800;color:#fff;font-size:17px;line-height:1.2}
  .lcard-d{color:var(--tx3);font-size:14px;line-height:1.45}
  .lcard-n{color:var(--grn-soft);font-size:13px;font-weight:600;margin-top:auto}
  </style>`;
  const html = `${head({ title: 'Football Lists: Winners, Records & Top Scorers | Ball IQ', description: 'Complete, fact-checked football reference lists — every World Cup and Ballon d\'Or winner, league champions and top scorers, year by year. Free to browse.', canonical, ld, ads: true })}
<body>
${NAV}
<main>
${style}
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <span>Football lists</span></nav>
<h1 style="font-size:clamp(26px,4.4vw,40px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 10px">Football Lists, Records &amp; Winners</h1>
<p style="margin:0 0 12px;color:var(--tx2)">Fact-checked reference lists for football fans — every winner, champion and top scorer, laid out year by year and kept accurate. Each one is free to browse, and pairs with a quiz so you can test what you know.</p>
</section>
<section class="sec">
<div class="lcards">
${cards}
</div>
</section>
${appCtaBand('football')}
<section class="sec">
<h2>Or jump into a quiz</h2>
${renderTiles([...catPages.filter((p) => p.slug !== HUB.slug).slice(0, 4), ...clubPages.slice(0, 4)])}
</section>
</main>
${footer()}`;
  const dir = resolve(DIST, 'lists');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: 'lists', canonical };
}

// ── per-nation page ────────────────────────────────────────────────────────────
// Same shape as buildPlayerPage: the bank has no `nation` field, so a question is
// "about" a nation if any `match` alternative appears in the stem or the correct
// answer. Prose (fact-checked, web-verified) comes from scripts/seo/nations.mjs.
// World-Cup-timed: nation/host search peaks every 4 years. Nation pages interlink
// with each other + the tournament category pages (World Cup, Euros).
function nationHintRows(match) {
  const re = new RegExp('(' + match.join('|') + ')', 'i');
  return QB.filter(
    (x) =>
      x.type === 'mcq' &&
      Array.isArray(x.o) &&
      x.hint &&
      (re.test(x.q) || (x.a != null && re.test(x.o[x.a] || ''))),
  );
}
function buildNationPage(cfg, catPages, nationPages) {
  const hints = nationHintRows(cfg.match);
  if (hints.length < MIN_HINTS) {
    throw new Error(`[gen-seo] nation "${cfg.slug}" has only ${hints.length} hint MCQs (< ${MIN_HINTS}). Refusing a thin page.`);
  }
  const tasterRows = tasterPick(hints, 5);
  const tasterIds = new Set(tasterRows.map((r) => r.id));
  const sample = curate(hints.filter((r) => !tasterIds.has(r.id)), Math.min(10, hints.length - 5));
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
      eduQuizLd(cfg.name, sample),
    ],
  });
  // Nation-to-nation mesh + the tournament categories (World Cup / Euros).
  const related = [
    ...nationPages.filter((p) => p.slug !== cfg.slug).slice(0, 8),
    ...catPages.filter((p) => p.slug !== HUB.slug).slice(0, 4),
  ];
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true })}
<body>
${NAV}
<main>
${heroTwoCol({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: cfg.name, url: canonical },
    ],
    badge: { text: cfg.initials, emoji: false },
    kind: 'National team quiz',
    name: cfg.name,
    h1: cfg.h1,
    lead: cfg.description,
    statLine: `Free · ${hints.length}+ ${cfg.name} questions · new ones added weekly`,
    playHref: '#taster',
  }, renderTaster(tasterRows, cfg.name, `${SITE.base}/play`))}
${renderCovers(cfg.name, false, true)}
${appCtaBand(cfg.name)}
<section class="sec narrow">
<h2>${esc(cfg.name)} sample questions &amp; answers</h2>
<p class="sub">Tap &ldquo;Show answer&rdquo; to reveal the answer and the story behind it.</p>
${renderQA(sample)}
</section>
${adSlot('afterQA')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
</section>
<section class="sec narrow">
<h2>${esc(cfg.name)} quiz — FAQ</h2>
${renderFaq(cfg.faq, { q: `About the ${cfg.name} quiz`, html: `${cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n')}` })}
</section>
${adSlot('afterFaq')}
</main>
${footer()}`;
  const dir = resolve(DIST, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: `${cfg.name} quiz`, count: hints.length, canonical };
}

// ── listicle page (cross-cutting "questions and answers" article) ─────────────
function buildListiclePage(cfg, livePages) {
  const rows = cfg.questionIds.map((id) => QB.find((r) => r.id === id)).filter(Boolean);
  if (rows.length < 12) {
    throw new Error(`[gen-seo] listicle "${cfg.slug}" resolved only ${rows.length} questions (< 12). Check questionIds.`);
  }
  // Interactive taster (same as club/category pages): 5 tappable questions,
  // excluded from the static Q&A list below so nothing is spoiled.
  const tasterRows = tasterPick(rows.filter((r) => r.hint && r.type === 'mcq' && Array.isArray(r.o)), 5);
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
      // Flashcard Quiz node anchored to the listicle's fully-visible Q&A list.
      eduQuizLd(cfg.h1, listRows),
    ],
  });
  const introHtml = cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true })}
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
${adSlot('afterFaq')}
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
${adSlot('afterQA')}
</main>
${footer()}`;
  const dir = resolve(DIST, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: cfg.h1, count: rows.length, canonical };
}

// ── hub page ──────────────────────────────────────────────────────────────────
function buildHubPage(livePages, clubPages, playerPages = []) {
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
<h2>Player quizzes</h2>
<p class="sub">One-player deep dives — careers, records and the moments that made them.</p>
${renderTiles(playerPages)}
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

// ── Footle landing page (/football-wordle/) ──────────────────────────────────
// Game-name SEO: "football wordle" / "footle" — Ball IQ was absent from that
// SERP even though Footle IS the product. Shared chrome; the green CTA
// deep-links into the playable no-login game (src/App.jsx's deep-link handler
// reads ?game=footle at /play).
function buildFootlePage(cfg) {
  const canonical = `${SITE.base}/${cfg.slug}/`;
  const playHref = `${SITE.base}/play?game=footle`;
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: cfg.h1, item: canonical },
        ],
      },
    ],
  });
  const howHtml = cfg.how
    .map(([t, d], i) => `<p><strong>${i + 1}. ${esc(t)}.</strong> ${esc(d)}</p>`)
    .join('\n');
  const bodyHtml = cfg.body.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld })}
<body>
${NAV}
<main>
${heroSection({
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: 'Footle', url: canonical },
    ],
    badge: { text: '⚽', emoji: true },
    kind: 'Daily game',
    name: 'Footle',
    h1: cfg.h1,
    lead: cfg.lede,
    statLine: 'Free · no sign-up · new footballer every day',
    playHref,
    playLabel: "Play today's Footle →",
  })}
<section class="sec"><h2>How to play</h2>
<div class="prose">
${howHtml}
</div></section>
<section class="sec"><h2>Wordle, but make it football</h2>
<div class="prose">
${bodyHtml}
</div></section>
<section class="sec"><h2>Stuck on today's Footle?</h2>
<div class="prose">
<p>Need a nudge before you burn a guess? The <a href="${SITE.base}/football-wordle/answer/">Footle hints &amp; answer page</a> gives progressive clues for today's puzzle — the answer stays hidden until you tap to reveal it — plus a running archive of every past Football Wordle solution. Best used after you've had a proper go yourself.</p>
</div></section>
${appCtaBand('football')}
<section class="sec"><h2>Footle FAQ</h2>
${renderFaq(cfg.faq)}
</section>
</main>
${footer()}`;
  const dir = resolve(DIST, cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
}

// ── sitemap ───────────────────────────────────────────────────────────────────
function buildSitemap(livePages, listPages = []) {
  // Build date as <lastmod> — Google honors lastmod but ignores changefreq/
  // priority, so without it the sitemap gives the crawler no freshness signal.
  // Pages are regenerated every deploy, so the build date is an honest hint.
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE.base}/`, freq: 'daily', pri: '1.0' },
    { loc: `${SITE.base}/quiz/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/football-wordle/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/football-wordle/answer/`, freq: 'daily', pri: '0.7' },
    ...livePages
      .filter((p) => p.slug !== HUB.slug)
      .map((p) => ({ loc: `${SITE.base}/quiz/${p.slug}/`, freq: 'weekly', pri: '0.7' })),
    ...(listPages.length ? [{ loc: `${SITE.base}/lists/`, freq: 'weekly', pri: '0.7' }] : []),
    ...listPages.map((p) => ({ loc: `${SITE.base}/lists/${p.slug}/`, freq: 'monthly', pri: '0.6' })),
    { loc: `${SITE.base}/about/`, freq: 'monthly', pri: '0.4' },
    { loc: `${SITE.base}/contact/`, freq: 'monthly', pri: '0.4' },
    { loc: `${SITE.base}/privacy.html`, freq: 'monthly', pri: '0.3' },
  ];
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  writeFileSync(resolve(DIST, 'sitemap.xml'), xml, 'utf8');
  return urls.map((u) => u.loc);
}

// ── IndexNow ──────────────────────────────────────────────────────────────────
// One POST per production deploy tells Bing / DuckDuckGo / Yandex (and through
// Bing's index, ChatGPT search + Copilot citations) about every URL — no quota,
// unlike GSC. The key file lives in public/<key>.txt (a REAL static file:
// the SPA rewrite answers 200 for any path, so IndexNow validation would pass
// HTML otherwise — it must serve the bare key). Re-submitting the same URLs on
// every deploy is allowed and idempotent per the protocol.
const INDEXNOW_KEY = '967335a8eed02e9f0e588f735a8e002a';
async function pingIndexNow(urlList) {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('[gen-seo] IndexNow: skipped (not a Vercel production build)');
    return;
  }
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'balliq.app',
        key: INDEXNOW_KEY,
        keyLocation: `https://balliq.app/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(10000),
    });
    console.log(`[gen-seo] IndexNow: submitted ${urlList.length} URLs → HTTP ${res.status}`);
  } catch (e) {
    // Never fail the build over a ping.
    console.log(`[gen-seo] IndexNow: ping failed (${e?.message || e}) — build continues`);
  }
}

// ── llms.txt (AI / answer-engine discoverability — llmstxt.org convention) ─────
// A concise, link-rich markdown summary LLM crawlers (ChatGPT, Perplexity, Gemini,
// Claude, Google AI Overviews) can use to understand + cite the site. Generated
// from livePages so it auto-grows as new quiz categories ship.
function buildLlmsTxt(livePages, clubPages, playerPages = [], listPages = []) {
  const cats = livePages.filter((p) => p.slug !== HUB.slug);
  const quizLinks = [
    `- [Football quizzes hub](${SITE.base}/quiz/): Every free football trivia category, each answer explained.`,
    ...cats.map((p) => `- [${p.name}](${SITE.base}/quiz/${p.slug}/): ${p.name} questions and answers, each with a fact-checked explanation.`),
  ].join('\n');
  const clubLinks = clubPages
    .map((p) => `- [${p.name}](${SITE.base}/quiz/${p.slug}/): ${p.name} questions and answers on the club's history, legends and trophies.`)
    .join('\n');
  const playerLinks = playerPages
    .map((p) => `- [${p.name}](${SITE.base}/quiz/${p.slug}/): ${p.name} questions and answers on the player's career, clubs, transfers and records.`)
    .join('\n');
  const listLinks = listPages
    .map((p) => `- [${p.name}](${SITE.base}/lists/${p.slug}/): ${p.name} — a complete, fact-checked reference table (${p.count} entries).`)
    .join('\n');
  const txt = `# Ball IQ

> Ball IQ is a free football (soccer) trivia game with thousands of fact-checked questions across 10 game modes, plus fact-checked football reference lists. Play free in any browser at ${SITE.base} or on iPhone.

Every question is human-curated and every answer carries an explained, fact-checked hint. Topics span the World Cup, Premier League, Champions League, La Liga, Serie A, Bundesliga, club legends, managers and records. Game modes include the Daily 7, Footle (a Wordle-style daily footballer guess), live multiplayer for up to 8 players, Survival, Hot Streak and Legends.

## Quizzes
${quizLinks}

## Club quizzes
${clubLinks}
${playerPages.length ? `\n## Player quizzes\n${playerLinks}\n` : ''}${listPages.length ? `\n## Football reference lists (fact-checked data tables)\n${listLinks}\n` : ''}
## About
- [About Ball IQ](${SITE.base}/about/): What Ball IQ is, who it is for, and how it works.
- [Contact](${SITE.base}/contact/): How to get in touch.

## Play
- [Play Ball IQ free in your browser](${SITE.base}/): The daily challenge, streaks, a Ball IQ player rating and multiplayer.
- [Ball IQ on the App Store](https://apps.apple.com/us/app/ball-iq-football-trivia/id6775975961): Free iPhone app.
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
async function main() {
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
  // Player pages: /quiz/<player-slug>/ — same namespace; text-matched question sets.
  const playerPages = PLAYERS.map((p) => ({ slug: p.slug, name: `${p.name} quiz`, count: playerHintRows(p.match).length }));
  // Nation pages: /quiz/<nation-slug>/ — same namespace; text-matched question sets.
  const nationPages = NATIONS.map((n) => ({ slug: n.slug, name: `${n.name} quiz`, count: nationHintRows(n.match).length }));
  // Reference-list pages: /lists/<slug>/ — settled-fact tables, own namespace.
  const listPages = LISTS.map((l) => ({ slug: l.slug, name: l.h1, count: l.rows.length }));

  const built = [];
  for (const c of CATEGORIES) built.push(buildCategoryPage(c, livePages, clubPages, playerPages));
  const builtListicles = LISTICLES.map((l) => buildListiclePage(l, livePages));
  const builtClubs = CLUBS.map((c) => buildClubPage(c, clubPages, livePages, playerPages));
  const builtPlayers = PLAYERS.map((p) => buildPlayerPage(p, clubPages, livePages));
  const builtNations = NATIONS.map((n) => buildNationPage(n, livePages, nationPages));
  const builtLists = LISTS.map((l) => buildListPage(l, clubPages, playerPages, livePages));
  buildListsHubPage(LISTS, clubPages, livePages);
  buildHubPage(livePages, clubPages, playerPages);
  buildFootlePage(FOOTLE_PAGE);
  buildSimplePage(ABOUT);
  buildSimplePage(CONTACT);
  const sitemapUrls = buildSitemap([...livePages, ...clubPages, ...playerPages, ...nationPages], listPages);
  buildLlmsTxt(livePages, clubPages, playerPages, listPages);
  await pingIndexNow(sitemapUrls);

  console.log(`[gen-seo] wrote ${built.length} category + ${builtListicles.length} listicle + ${builtClubs.length} club pages + hub + about + contact + sitemap + llms.txt into dist/`);
  for (const b of built) console.log(`  ✓ /quiz/${b.slug}/  (${b.count} Qs in bank)`);
  for (const b of builtListicles) console.log(`  ✓ /quiz/${b.slug}/  (${b.count} featured Qs)`);
  for (const b of builtClubs) console.log(`  ✓ /quiz/${b.slug}/  (club, ${b.count} Qs in bank)`);
  for (const b of builtPlayers) console.log(`  ✓ /quiz/${b.slug}/  (player, ${b.count} Qs in bank)`);
  for (const b of builtNations) console.log(`  ✓ /quiz/${b.slug}/  (nation, ${b.count} Qs in bank)`);
  for (const b of builtLists) console.log(`  ✓ /lists/${b.slug}/  (reference list, ${b.count} rows)`);
  console.log(`  ✓ /quiz/  (hub)`);
  console.log(`  ✓ /football-wordle/  (Footle landing)`);
  console.log(`  ✓ /about/  ✓ /contact/`);
  console.log(`  ✓ /sitemap.xml  ✓ /llms.txt`);
}

await main();
