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
import { tiersFor, DEFAULT_TIERS } from './seo/clubTiers.mjs';
import { CLUBS_ES } from './seo/clubs-es.mjs';
import { CLUBS_PT } from './seo/clubs-pt.mjs';
import { CLUBS_TR } from './seo/clubs-tr.mjs';
import { CLUBS_ID } from './seo/clubs-id.mjs';
// One list, so another language is a file plus a spread rather than a rewrite.
// Two shapes live in here side by side and both are intentional:
//   - a DOMESTIC club in its own country's language (Boca/es, Flamengo/pt,
//     Galatasaray/tr)
//   - a GLOBAL club in the language of a large foreign fanbase (Manchester
//     United/id, and more to come) — the multi-language cluster, which holds
//     the club constant so differences between pages are attributable to the
//     MARKET rather than the badge.
const CLUBS_INTL = [...CLUBS_ES, ...CLUBS_PT, ...CLUBS_TR, ...CLUBS_ID];
import { PLAYERS } from './seo/players.mjs';
import { LISTS } from './seo/lists.mjs';
import { STUDY, studyStats } from './seo/study.mjs';
import { NATIONS } from './seo/nations.mjs';
import { LEAGUES } from './seo/leagues.mjs';

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
  // US visitors convert at ~0 (Clarity 2026-07-28: US Mobile 12.7s, US PC 3.6s
  // active, and every Google-referred US session recorded ZERO clicks, against
  // 61.7s for UK Mobile). Part of that is vocabulary: "soccer" appeared 13
  // times on the hub after #46 and ZERO times on any of the ~120 club pages,
  // so a search for "arsenal soccer quiz" had nothing to match and the page
  // read entirely British on arrival. alternateName carries the US term without
  // touching the visible British copy the UK majority reads.
  alternateName: [`${name} soccer quiz`, `${name} trivia`],
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
  'hajduk-split': 'HAJ',
  'boca-juniors': 'BOC', 'river-plate': 'RIV', 'flamengo': 'FLA', 'palmeiras': 'PAL', 'corinthians': 'COR',
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
  sunderland: 'SUN', ipswich: 'IPS', 'crystal-palace': 'CRY', fulham: 'FUL', brighton: 'BHA',
  bournemouth: 'BOU', brentford: 'BRE', burnley: 'BUR', wolves: 'WOL',
  coventry: 'COV', 'hull-city': 'HUL',
  'athletic-bilbao': 'ATH', sevilla: 'SEV', 'real-betis': 'BET',
  'schalke-04': 'S04', 'hamburger-sv': 'HSV',
  fiorentina: 'FIO', lazio: 'LAZ', torino: 'TOR',
  'sporting-cp': 'SCP', 'saint-etienne': 'ASSE',
  valencia: 'VAL', 'bayer-leverkusen': 'B04', lyon: 'OL', parma: 'PAR', monaco: 'ASM',
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
// yellow) get dark text via badgeColors(); a hairline border keeps very dark
// badges (Juventus, Newcastle) legible on the near-black cards.
const CLUB_COLOR = {
  'hajduk-split': '#0E4C92',
  'boca-juniors': '#0A2B72', 'river-plate': '#E1122E', 'flamengo': '#C52613', 'palmeiras': '#006437', 'corinthians': '#111111',
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
  sunderland: '#EB172B', ipswich: '#3A64A3', 'crystal-palace': '#1B458F', fulham: '#E6E6E6', brighton: '#0057B8',
  bournemouth: '#DA291C', brentford: '#E30613', burnley: '#6C1D45', wolves: '#FDB913',
  coventry: '#059DD9', 'hull-city': '#F18A01',
  'athletic-bilbao': '#EE2523', sevilla: '#CB0007', 'real-betis': '#00954C',
  'schalke-04': '#004E9E', 'hamburger-sv': '#0A3A7A',
  fiorentina: '#592C82', lazio: '#87D8F7', torino: '#8A1E12',
  'sporting-cp': '#008056', 'saint-etienne': '#009E60',
  valencia: '#F18E00', 'bayer-leverkusen': '#E32221', lyon: '#3D74C4',
  parma: '#F5D800', monaco: '#DA291C',
};
// ── badge legibility (WCAG 1.4.3) ────────────────────────────────────────────
// This used to pick white/black by YIQ brightness with a 0.6 threshold, which
// is NOT perceptual contrast and got 11 of 61 clubs wrong. Saturated mid-blues
// were the worst: Napoli #12A0D7 took white at 2.98:1 when black gives 6.63:1.
// The badge text is 12px, so it needs the full 4.5:1.
const srgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const relLum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const toHex = (rgb) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');

const WHITE = [255, 255, 255], INK = [10, 10, 10];

// Returns [background, foreground] that clears 4.5:1. Club colours are brand
// data, so we keep the hue and move only lightness — and only for the handful
// (Arsenal #EF0107, Sunderland #EB172B) whose mid-luminance red clears neither
// white nor black at any text colour.
function badgeColors(hex) {
  let bg = srgb(hex);
  const fg = contrast(bg, WHITE) >= contrast(bg, INK) ? WHITE : INK;
  const target = fg === WHITE ? 0 : 255;   // push bg away from the text colour
  for (let i = 0; i < 40 && contrast(bg, fg) < 4.5; i++) {
    bg = bg.map((v) => v + (target - v) * 0.04);
  }
  return [toHex(bg), toHex(fg)];
}

const clubBadgeStyle = (slug) => {
  const c = CLUB_COLOR[slug];
  if (!c) return '';
  const [bg, fg] = badgeColors(c);
  return `background:${bg};color:${fg};border:1px solid rgba(255,255,255,.16)`;
};

// Badge for a related-quiz tile, keyed by slug.
function badgeFor(slug, name) {
  if (slug === HUB.slug) return { text: '⚽', emoji: true };
  if (CLUB_BADGE[slug]) return { text: CLUB_BADGE[slug], emoji: false };
  if (CAT_EMOJI[slug]) return { text: CAT_EMOJI[slug], emoji: true };
  return { text: '❓', emoji: true }; // listicles / anything else
}

// ── shared chrome ─────────────────────────────────────────────────────────────
// Reusable black App Store badge — the KNOWN-GOOD inline Apple glyph.
function appStoreBadge() {
  return `<a class="store-badge" href="${SITE.appStore}" rel="noopener" target="_blank">
<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702"/></svg>
<span class="store-badge-tx"><small>Download on the</small><strong>App Store</strong></span>
</a>`;
}

// Google Play badge — LIVE since 2026-07-27. Shown beside the App Store badge
// so an Android visitor sees a first-class path, not an iOS-only page.
function playStoreBadge() {
  return `<a class="store-badge" href="${SITE.playStore}" rel="noopener" target="_blank">
<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/></svg>
<span class="store-badge-tx"><small>Get it on</small><strong>Google Play</strong></span>
</a>`;
}

// Both badges, for anywhere with room for a pair.
function storeBadges() {
  return `${appStoreBadge()}\n${playStoreBadge()}`;
}

// `active` marks the current section with the design's green underline
// ('quizzes' | 'clubs' | 'records' | ''). NAV keeps every existing call site
// working unchanged; the Clubs Directory passes 'clubs'.
// The skip link is WCAG 2.4.1 (Level A): four nav links plus a breadcrumb trail
// sit before the content on every one of these ~180 pages. Visible on focus only.
const navHtml = (active = '') => `<a class="skip" href="#main">Skip to content</a>
<header class="nav"><div class="nav-in">
<a class="brand" href="${SITE.base}/"><img src="/marketing/ball.png" alt="Ball IQ" width="28" height="28" />Ball&nbsp;<b>IQ</b></a>
<div class="nav-right"><a class="nav-link${active === 'quizzes' ? ' active' : ''}" href="${SITE.base}/quiz/">All quizzes</a><a class="nav-link${active === 'clubs' ? ' active' : ''}" href="${SITE.base}/quiz/clubs/">Clubs</a><a class="nav-link${active === 'records' ? ' active' : ''}" href="${SITE.base}/lists/">Records</a><a class="nav-cta" href="${SITE.getApp}" rel="noopener">Get the app</a></div>
</div></header>`;
const NAV = navHtml();

function crumbs(items) {
  const trail = items
    .map((c, i) =>
      i === items.length - 1
        ? `<span>${esc(c.name)}</span>`
        : `<a href="${c.url}">${esc(c.name)}</a><span class="sep" aria-hidden="true">›</span>`,
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

function playStoreBadgeMini() {
  return `<a class="store-badge mini" href="${SITE.playStore}" rel="noopener" target="_blank">
<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/></svg>
<span class="mini-tx">Google Play</span>
</a>`;
}

function storeBadgesMini() {
  return `${appStoreBadgeMini()}\n${playStoreBadgeMini()}`;
}

// Inner hero content (breadcrumb → stat), shared by the single-column heroSection
// (Footle landing, listicles) and the two-column quiz hero (heroTwoCol).
function heroInner({ crumbItems, badge, kind, name, h1, lead, statLine, chips, playHref, playLabel, mini }) {
  let chipStyle = '';
  if (badge && !badge.emoji && badge.color) {
    const [bg, fg] = badgeColors(badge.color);
    chipStyle = ` style="background:${bg};color:${fg};border:1px solid rgba(255,255,255,.16)"`;
  }
  const chip = !badge
    ? ''
    : badge.emoji
      ? `<span class="badge-chip emoji">${badge.text}</span>`
      : `<span class="badge-chip"${chipStyle}>${esc(badge.text)}</span>`;
  // The green CTA is the single most-clicked thing on a club page and Clarity
  // recorded it as a DEAD CLICK in 12 of 15 engaged sessions (Sporting CP,
  // Bayern ×3, Everton ×2, Liverpool, Beşiktaş, Rangers ×2, Chelsea, West Ham,
  // Arsenal). Cause: it anchors to #taster, which on a phone is ALREADY on
  // screen, so the browser scrolls nowhere and nothing visibly happens. People
  // tap it first, get no feedback, and some tap it again.
  //
  // Fix: when the target is an in-page anchor, scroll it into view AND focus
  // its first option, so there is always a visible response. Plain-anchor
  // behaviour is preserved if JS is off, and real hrefs are untouched.
  const ctaRow = (playHref && !playHref.startsWith('#'))
    ? `<div class="cta-row">
<a class="btn-green" href="${playHref}"${playHref.startsWith('#') ? ' data-scrollto="1"' : ''}>${esc(playLabel || `Play the ${name} quiz`)} ↓</a>
${mini ? storeBadgesMini() : storeBadges()}
</div>`
    : '';
  // Chips beat a sentence: a searcher scans them, and every value is computed
  // from the bank at build time so none of it can drift or overstate. This is
  // the honest version of the "75 verified questions" badge competitors assert.
  // Stat strip, not chips: mono numerals in a ruled row, the way a programme or
  // a scoreboard sets figures. Every value is computed from the bank. "Free" is
  // deliberately NOT in the row — it is not a number, and mixing it in broke the
  // one rule the row is built on (and made a fourth cell wrap to its own line).
  const stat = Array.isArray(chips) && chips.length
    ? `<div class="hero-facts">${chips.map((c) => `<div class="hf"><b>${esc(String(c.n))}</b><span>${esc(c.label)}</span></div>`).join('')}</div>
<p class="hero-free">Free to play &middot; no sign-up &middot; nothing to install</p>`
    : statLine ? `<p class="hero-stat">${esc(statLine)}</p>` : '';
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
${storeBadges()}
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
  // Live 2026-07-20: one banner unit ("OLSEN", slot 4505987680) reused across all
  // three placements to go live fast. Reporting lumps them together — split into
  // named units (afterQA/afterFaq/listInline) later if per-placement data is wanted.
  // DORMANT until AdSense is confirmed SERVING (site status "Klar"), so no empty
  // ad boxes render before ads fill. Re-add the slot id to activate:
  // afterQA: '4505987680', afterFaq: '4505987680', listInline: '4505987680',
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
// Playable sample Q&A: tap an option → instant ✓/✗ + the explanation, mirroring
// the taster (reuses its .to button styles). Progressive enhancement — options
// render as real buttons; QA_JS wires tap-to-check. Falls back to plain buttons
// if JS is off (the answer/hint still ship in the DOM for crawlers).
function renderQA(rows) {
  const items = rows
    .map((row) => {
      const r = shuffleOptions(row);
      const opts = r.o
        .map((o, k) => `<button class="to" type="button" data-i="${k}"><span class="tl">${'ABCD'[k] || ''}</span><span class="tt">${esc(o)}</span></button>`)
        .join('');
      return `<li class="qa" data-a="${r.a}">
<p class="q">${esc(r.q)}</p>
<div class="qa-opts">${opts}</div>
<p class="qa-why">${esc(r.hint)}</p>
</li>`;
    })
    .join('\n');
  return `<ol class="qa-list">\n${items}\n</ol>\n<script>${QA_JS}</script>`;
}

// Wires every .qa card independently: first tap locks the card, marks the picked
// option right/wrong, reveals the correct one + the explanation. No deps.
const QA_JS = `(function(){var cs=document.querySelectorAll('.qa[data-a]');for(var c=0;c<cs.length;c++){(function(card){var a=+card.getAttribute('data-a'),bs=card.querySelectorAll('.to'),w=card.querySelector('.qa-why'),done=false;if(w)w.hidden=true;function pick(ev){if(done)return;done=true;var k=+ev.currentTarget.getAttribute('data-i');for(var b=0;b<bs.length;b++){bs[b].disabled=true;if(b===a){bs[b].className='to correct';bs[b].insertAdjacentHTML('beforeend','<span class="tm">\\u2713</span>')}else if(b===k){bs[b].className='to wrong';bs[b].insertAdjacentHTML('beforeend','<span class="tm">\\u2717</span>')}else{bs[b].className='to dim'}}if(w)w.hidden=false}for(var b=0;b<bs.length;b++)bs[b].addEventListener('click',pick)})(cs[c])}})();`;

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
  .taster-note{margin:14px 0 0;font-size:13px;color:var(--tx4)}
  .tph{font-size:15px;font-weight:600;color:#9BA0B8;margin:0;line-height:1.5}
  .th{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .th .tq{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx4)}
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
/* ⚠️ SCORE-INDEXED LADDERS BREAK WHEN THE TASTER LENGTH CHANGES.
   This was IQ=[46,54,63,74,88,99] indexed by raw score — six entries, written
   when the taster was 5 questions. The taster went to 10 and the ladder did
   not, so every score from 5 upward fell through to the last entry: 5/10 and
   10/10 both showed "Ball IQ 99 — Club legend", and 4/10 read "Superfan".
   Half marks presented as a perfect score on 126 pages.
   Banding on PERCENTAGE instead is length-independent, so it stays correct
   for a 10-, 20- or full-length run. Do not reintroduce an index-by-score. */
var BANDS=[[0,46,'Casual fan'],[25,54,'Getting there'],[45,63,'Solid'],[65,74,'Big fan'],[85,88,'Superfan'],[100,99,'Club legend']];
function grade(sc,n){var pct=n?Math.round((sc/n)*100):0,b=BANDS[0];
for(var g=0;g<BANDS.length;g++){if(pct>=BANDS[g][0])b=BANDS[g]}
if(pct>=100)b=BANDS[BANDS.length-1];
return{iq:b[1],tier:b[2],pct:pct}}
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
var G=grade(sc,QS.length),iq=G.iq,ti=G.tier;
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
<div class="tcard" id="biq-taster" data-name="${esc(name)}" data-play="${play}" data-store="${SITE.getApp}">
<p class="tph">${rows.length} questions to rate your ${esc(name)} Ball IQ. <a href="${play}">Play now →</a></p>
</div>
<p class="taster-note">Sample questions shown — the full quiz has many more.</p>
<script type="application/json" id="biq-taster-data">${data}</script>
<script>${TASTER_JS}</script>
</section>`;
}

// Explanation coverage as a sentence, or nothing when it is not 100%. Club packs
// all measure 100% today, but this must never assert it blind — categories run
// as low as 53% and the same trust block will be reused there.
function pct100(rows) {
  const n = rows.length, e = rows.filter((r) => r.hint && String(r.hint).trim()).length;
  if (!n || e < n) return '';
  return 'Every one of them carries a written explanation.';
}

// The verification section. Competitors publish theirs and we run a stricter
// process, so this is pure upside — but the coverage sentence comes from pct100()
// so it stays silent wherever coverage is not actually 100%.
function trustSection(name, rows) {
  return `<section class="sec narrow" id="how">
<h2>How the ${esc(name)} quiz is checked</h2>
<p class="sub">Every question above was written by hand and verified before it went live.</p>
<p class="trust-note">All ${rows.length} ${esc(name)} questions were checked twice before publication — once against the claim the question makes, and once against the wrong answers offered beside it. A question whose wrong options can be dismissed without knowing any football is not really a question, so those get rewritten or dropped rather than padded out. Anything that could not be confirmed was removed rather than guessed, which is why some sets are smaller than others. ${pct100(rows)} Spot something wrong and <a href="${SITE.base}/contact/">tell us</a> — corrections from players are how the bank stays accurate.</p>
</section>`;
}

// Difficulty arc for the on-page quiz set.
//
// curate() and tasterPick() both exclude `easy` by construction ("never easy"),
// so a club page rendered 12 medium then 10 hard — a flat plateau followed by a
// cliff, opening on a question you have to think about. Game-design guidance on
// quiz completion is blunt about this: a first question the player must think
// about is the most expensive mistake in the flow. Confidence first, peak in the
// middle, never a wall at the start.
//
// The length picker takes a PREFIX of this array (10 / 20 / all), so the arc has
// to hold for any prefix — an arc spread across 22 would give a 10-question run
// no peak at all. Hence: two easy openers, then a repeating medium/medium/hard
// cycle, which makes every prefix of 5+ a sane shape.
function arcPick(rows, n) {
  const by = { easy: [], medium: [], hard: [] };
  for (const r of rows) (by[r.diff] || by.medium).push(r);
  for (const k of Object.keys(by)) by[k].sort((a, b) => (a.id < b.id ? -1 : 1));
  const want = (i) => (i < 2 ? 'easy' : ['medium', 'medium', 'hard'][(i - 2) % 3]);
  const out = [], used = new Set();
  const take = (k) => {
    const r = by[k].find((x) => !used.has(x.id));
    if (r) used.add(r.id);
    return r;
  };
  for (let i = 0; i < n; i++) {
    // Fall back through the other buckets so a club with no easy questions still
    // fills the slot rather than emitting a short set.
    const order = { easy: ['easy', 'medium', 'hard'], medium: ['medium', 'easy', 'hard'], hard: ['hard', 'medium', 'easy'] }[want(i)];
    let r;
    for (const k of order) { r = take(k); if (r) break; }
    if (!r) break;
    out.push(r);
  }
  return out;
}

// ── Unified quiz set (2026-07-31 rebuild) ────────────────────────────────────
// Replaces the taster+Q&A split. WHY:
//   1. The page carried a 10-question scored taster AND a separate 12-question
//      Q&A block from a disjoint pool. From a visitor's seat that is two
//      quizzes; one recorded session spent 2,135s and never crossed over.
//   2. The taster shipped its questions as a JSON payload inside a <script>,
//      which is worth ZERO crawlable text. The Q&A block was visible HTML and a
//      large share of each club page's ~1,825 words. So the merge had to run
//      taster -> HTML, never HTML -> widget: AdSense refused the site for
//      "low value content" on 2026-07-31 and thinning these pages would have
//      been an own goal.
// Every question is therefore server-rendered, including its explanation. JS
// only PACES what is already in the DOM. With JS off you get the full set as a
// readable Q&A — which is exactly what a crawler should see.
const BQ_CSS = `  .bq{scroll-margin-top:72px}
  .bq-lenl{font-family:var(--mono);font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4);margin-bottom:7px}
  .bq-len{display:flex;gap:7px;margin-bottom:12px}
  .bq-len button{flex:1;min-height:44px;padding:9px 6px;border-radius:10px;border:1px solid var(--bd);background:var(--card);color:var(--tx3);font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s,border-color .15s,color .15s}
  .bq-len button:hover{border-color:var(--bd3)}
  .bq-len button[aria-pressed="true"]{background:var(--grn);border-color:var(--grn);color:var(--grn-ink)}
  .bq-card{background:linear-gradient(var(--card2),var(--card));border:1px solid var(--bd2);border-radius:20px;padding:20px;position:relative;overflow:hidden}
  .bq-card::before{content:"";position:absolute;inset:0 0 auto;height:2px;background:linear-gradient(90deg,var(--grn),var(--grn-soft) 60%,transparent)}
  .bq-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;min-height:24px}
  .bq-meter{display:flex;gap:4px;flex-wrap:wrap}
  .bq-meter i{width:15px;height:4px;border-radius:2px;background:var(--bd);transition:background .2s}
  .bq-meter i.ok{background:var(--grn)}
  .bq-meter i.no{background:#4A2426}
  .bq-streak{font-family:var(--mono);font-size:11.5px;font-weight:700;color:var(--grn-ink);background:var(--amber);border-radius:6px;padding:3px 8px}
  .bq-list{list-style:none;margin:0;padding:0}
  .bq-q + .bq-q{margin-top:26px;padding-top:26px;border-top:1px solid var(--bd)}
  .bq-qn{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4);margin-bottom:7px}
  .bq-qx{font-size:19px;font-weight:700;color:var(--tx);line-height:1.3;letter-spacing:-.015em;margin:0 0 15px;text-wrap:balance}
  .bq-os{display:grid;gap:8px}
  .bq-o{display:flex;align-items:center;gap:11px;width:100%;min-height:44px;text-align:left;padding:12px 13px;border-radius:11px;border:1px solid var(--bd);background:var(--bg2);color:var(--tx2);font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s}
  .bq-o:hover:not(:disabled){border-color:var(--bd3);background:var(--card2)}
  .bq-o:disabled{cursor:default}
  .bq-o .k{flex:0 0 auto;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;font-weight:700;background:#1B2029;color:var(--tx4)}
  .bq-o .tt{flex:1}
  .bq-o.ok{border-color:var(--grn);background:rgba(88,204,2,.10);color:#B6F27E}
  .bq-o.ok .k{background:var(--grn);color:var(--grn-ink)}
  .bq-o.no{border-color:var(--wrong);background:rgba(255,71,71,.09);color:#FF8A82}
  .bq-o.no .k{background:var(--wrong);color:#fff}
  .bq-o.dim{opacity:.45}
  .bq-why{margin-top:13px;border-left:2px solid var(--club,var(--grn));padding:2px 0 2px 14px;font-size:13.5px;color:var(--tx3);line-height:1.55}
  .bq-why b{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--club-soft,var(--grn));margin-bottom:5px;font-weight:700}
  .bq-next{margin-top:14px;width:100%;padding:13px;border:none;border-radius:12px;background:var(--grn);color:var(--grn-ink);font:inherit;font-weight:800;font-size:15px;cursor:pointer}
  .bq-next:hover{filter:brightness(1.05)}
  .bq-res{text-align:center;padding:6px 2px;position:relative;overflow:hidden}
  .bq-res::before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,transparent,var(--club,var(--grn)),transparent)}
  .bq-crest{width:30px;height:30px;margin:6px auto 10px;border-radius:8px;background:var(--club,var(--grn));color:#fff;font-family:var(--mono);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .bq-rank{font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4)}
  .bq-big{font-family:var(--mono);font-size:clamp(50px,11vw,62px);font-weight:800;line-height:1;letter-spacing:-.04em;color:#fff;margin:6px 0 6px}
  .bq-tier{display:inline-block;font-size:15px;font-weight:800;color:var(--grn-ink);background:var(--grn);padding:5px 13px;border-radius:999px}
  .bq-sub{font-size:13.5px;color:var(--tx4);margin-top:11px}
  .bq-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}
  .bq-row a,.bq-row button{flex:1 1 140px;text-align:center;padding:12px;border-radius:11px;background:var(--grn);color:var(--grn-ink);font:inherit;font-weight:800;font-size:14px;border:none;cursor:pointer}
  .bq-row a:hover{text-decoration:none;filter:brightness(1.05)}
  .bq-row .ghost{background:transparent;border:1px solid var(--bd2);color:var(--tx3)}
  .bq-note{margin:12px 0 0;font-size:12.5px;color:var(--tx4)}
  .bq-o:focus-visible,.bq-len button:focus-visible,.bq-next:focus-visible,.bq-row a:focus-visible,.bq-row button:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  @media (prefers-reduced-motion:reduce){.bq-meter i,.bq-o{transition:none}}`;

// Progressive enhancement only. Everything it touches is already in the DOM.
const BQ_JS = `(function(){
var root=document.querySelector('.bq[data-total]');if(!root)return;
var list=root.querySelector('.bq-list');if(!list)return;
var qs=[].slice.call(list.querySelectorAll('.bq-q'));if(!qs.length)return;
var total=qs.length,name=root.getAttribute('data-name')||'this club';
var tiers=(root.getAttribute('data-tiers')||'').split('|');
var store=root.getAttribute('data-store')||'#',more=+(root.getAttribute('data-more')||0),badge=root.getAttribute('data-badge')||'';
var BANDS=[0,25,45,65,85,100];
function grade(sc,n){var pct=n?Math.round(sc/n*100):0,i=0;for(var g=0;g<BANDS.length;g++){if(pct>=BANDS[g])i=g}
if(pct>=100)i=BANDS.length-1;var iq=[46,54,63,74,88,99][i];return{iq:iq,tier:tiers[i]||'Fan',pct:pct}}
var run=[],at=0,sc=0,streak=0,best=0,rounds=0,len=Math.min(10,total);
var head=root.querySelector('.bq-head'),meter=root.querySelector('.bq-meter'),sbadge=root.querySelector('.bq-streak');
var res=root.querySelector('.bq-res');
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function paintMeter(){if(!meter)return;var h='';for(var i=0;i<run.length;i++){var st=run[i].got;h+='<i class="'+(st===1?'ok':st===0?'no':'')+'"></i>'}meter.innerHTML=h}
function show(){
for(var i=0;i<qs.length;i++)qs[i].hidden=true;
if(at>=run.length){return finish()}
var q=run[at].el;q.hidden=false;
var n=q.querySelector('.bq-qn');if(n)n.textContent='Question '+(at+1)+' of '+run.length+(q.getAttribute('data-diff')?' · '+q.getAttribute('data-diff'):'');
if(sbadge)sbadge.hidden=streak<2,sbadge.textContent='▲ '+streak+' streak';
paintMeter()}
function answer(q,rec,k){
var a=+q.getAttribute('data-a'),os=q.querySelectorAll('.bq-o');
for(var b=0;b<os.length;b++){os[b].disabled=true;
if(b===a)os[b].className='bq-o ok';else if(b===k)os[b].className='bq-o no';else os[b].className='bq-o dim'}
var w=q.querySelector('.bq-why');if(w)w.hidden=false;
if(k===a){sc++;streak++;if(streak>best)best=streak;rec.got=1}else{streak=0;rec.got=0}
if(sbadge)sbadge.hidden=streak<2,sbadge.textContent='▲ '+streak+' streak';
paintMeter();
var nx=q.querySelector('.bq-next');if(nx){nx.hidden=false;nx.textContent=(at+1>=run.length)?'See your result →':'Next question →'}}
function finish(){
rounds++;var G=grade(sc,run.length),left=total-run.length+more;
var cont=(rounds<2&&total>run.length)
?'<a href="#quiz" data-more="1">Keep going — '+(total-run.length)+' more →</a>'
:'<a href="'+store+'" rel="noopener">Get the app — a new one daily →</a>';
res.innerHTML=(badge?'<div class="bq-crest">'+esc(badge)+'</div>':'')+'<div class="bq-rank">Your '+esc(name)+' IQ</div><div class="bq-big">'+G.iq+'</div>'
+'<span class="bq-tier">'+esc(G.tier)+'</span>'
+'<div class="bq-sub">'+sc+' of '+run.length+' · best streak '+best+'</div>'
+'<div class="bq-row">'+cont+'<button class="ghost" data-share="1">Share</button><button class="ghost" data-again="1">Play again</button></div>'
+(rounds>=2?'<p class="bq-note">'+left+' more '+esc(name)+' questions in the app, plus a new daily game and your streak.</p>':'');
res.hidden=false;if(head)head.hidden=true;
var m=res.querySelector('[data-more]');if(m)m.addEventListener('click',function(e){e.preventDefault();start(Math.min(20,total))});
var ag=res.querySelector('[data-again]');if(ag)ag.addEventListener('click',function(){start(len)});
var sh=res.querySelector('[data-share]');if(sh)sh.addEventListener('click',function(){
var txt='I scored '+sc+'/'+run.length+' on the '+name+' quiz — '+G.tier+'. Beat that.',u=location.href.split('#')[0];
if(navigator.share){navigator.share({title:name+' quiz',text:txt,url:u})['catch'](function(){})}
else if(navigator.clipboard){navigator.clipboard.writeText(txt+' '+u).then(function(){sh.textContent='Copied ✓'})}
else{window.prompt('Copy your score',txt+' '+u)}})}
function start(n){
len=n;res.hidden=true;if(head)head.hidden=false;
run=[];sc=0;at=0;streak=0;best=0;
for(var i=0;i<qs.length&&run.length<n;i++){
var q=qs[i];run.push({el:q,got:-1});
var os=q.querySelectorAll('.bq-o');
for(var b=0;b<os.length;b++){os[b].disabled=false;os[b].className='bq-o'}
var w=q.querySelector('.bq-why');if(w)w.hidden=true;
var nx=q.querySelector('.bq-next');if(nx)nx.hidden=true}
show()}
list.addEventListener('click',function(ev){
var o=ev.target.closest?ev.target.closest('.bq-o'):null;
if(o&&!o.disabled){var q=o.closest('.bq-q');answer(q,run[at],+o.getAttribute('data-i'));return}
var nx=ev.target.closest?ev.target.closest('.bq-next'):null;
if(nx){at++;show();var c=root.querySelector('.bq-card');if(c&&c.getBoundingClientRect().top<0)c.scrollIntoView({block:'start'})}});
var lens=root.querySelectorAll('.bq-len button');
for(var i=0;i<lens.length;i++)lens[i].addEventListener('click',function(e){
var v=+e.currentTarget.getAttribute('data-n');
for(var j=0;j<lens.length;j++)lens[j].setAttribute('aria-pressed',lens[j]===e.currentTarget?'true':'false');
rounds=0;start(v)});
root.classList.add('bq-live');start(Math.min(10,total));
})();`;

// rows = every question the page ships. `more` = how many further questions the
// full pack holds beyond these, used for the honest app line at the end.
function renderQuizSet(rows, { name, tiers, store, more = 0, badge = '' }) {
  const items = rows
    .map(shuffleOptions)
    .map((r) => {
      const opts = r.o
        .map((o, k) => `<button class="bq-o" type="button" data-i="${k}"><span class="k">${'ABCD'[k] || ''}</span><span class="tt">${esc(o)}</span></button>`)
        .join('');
      return `<li class="bq-q" data-a="${r.a}"${r.diff ? ` data-diff="${esc(r.diff)}"` : ''}>
<p class="bq-qn">${esc(r.diff || 'Question')}</p>
<p class="bq-qx">${esc(r.q)}</p>
<div class="bq-os">${opts}</div>
<div class="bq-why"><b>Why</b>${esc(r.hint)}</div>
<button class="bq-next" type="button" hidden>Next question →</button>
</li>`;
    })
    .join('\n');
  const lens = [10, 20, rows.length].filter((n, i, a) => n <= rows.length && a.indexOf(n) === i);
  const picker = lens.length > 1
    ? `<div class="bq-lenl">How many questions?</div><div class="bq-len">${lens
        .map((n, i) => `<button type="button" data-n="${n}" aria-pressed="${i === 0 ? 'true' : 'false'}">${n === rows.length ? `${n} Full set` : n === 10 ? '10 Quick' : `${n} Standard`}</button>`)
        .join('')}</div>`
    : '';
  return `<section class="bq" id="quiz" data-total="${rows.length}" data-name="${esc(name)}" data-tiers="${esc(tiers.join('|'))}" data-store="${SITE.getApp}" data-more="${more}" data-badge="${esc(badge)}">
<div class="bq-head">${picker}
<div class="bq-card">
<div class="bq-top"><div class="bq-meter" aria-hidden="true"></div><span class="bq-streak" hidden></span></div>
<ol class="bq-list">
${items}
</ol>
</div></div>
<div class="bq-res bq-card" hidden></div>
<script>${BQ_JS}</script>
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
// These were plain <div>s, and Clarity session recordings show people TAPPING
// them — one visitor answered correctly for six minutes, then hit
// "Players & legends" twice, "Iconic moments" and "Records & stats" in four
// seconds and left. That is the engaged cohort asking "what else have you got?"
// and finding a wall, at the precise moment of peak intent. They are now links
// to the full quiz: same reassurance for a scanner, a real destination for
// anyone who taps.
function renderCovers(name, isLeague, isPlayer, href) {
  const set = isPlayer ? PLAYER_COVERS(name) : isLeague ? LEAGUE_COVERS(name) : CLUB_COVERS(name);
  const cards = set
    .map(([t, d]) => (href
      ? `<a class="cov" href="${href}"><h3>${esc(t)}</h3><p>${esc(d)}</p></a>`
      : `<div class="cov"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`))
    .join('\n');
  return `<section class="sec">
<h2 id="covers">What the ${esc(name)} quiz covers</h2>
${/* One visible use of "soccer" per page, in the shared covers subtitle so a
      single edit reaches all ~120 club/league/player pages. Kept as an aside
      rather than a rewrite: "football" stays the primary term for the UK
      majority (50 sessions vs 17 US), and rewriting ~180 pages into US English
      would trade a converting audience for a non-converting one. */ ''}
<p class="sub">Every question is written and checked by football fans — soccer, if you're reading this in the US — across the topics that decide a real ${esc(name)} expert:</p>
<div class="covers">${cards}</div>
${/* E-E-A-T. We do the work — a three-stage forge for new questions, a
      distractor audit, 329 corrections applied in a single day — and none of
      it was visible anywhere on the site. For a facts-based publisher that is
      the cheapest trust signal there is, and we had simply never claimed it.

      Every number here is MEASURED and must stay that way:
        5,834  questions in the bank
        4,394  carry a written explanation (75.3%) — deliberately NOT all of
               them; some answers need none, which is why this says "where
               there is more to say" and not "every answer". The store copy
               currently overclaims exactly this and is logged as task #63.
      Regenerate from src/questions.js before editing these figures. */ ''}
<p class="editorial">This is one set from a bank of ${QB.length.toLocaleString('en-GB')} questions spanning 72 clubs, every major league and eight decades of football.</p>
</section>`;
}

// ── shared <head> + inline CSS ────────────────────────────────────────────────
// Inter (UI) + JetBrains Mono (numbers/tags) loaded NON-render-blocking, same as
// the app's index.html.
// `ads` opts a page type INTO the AdSense loader. Only pages that actually
// render adSlot() calls should pass it — see the AD_SLOTS placement policy.
// The account meta below stays on every page unconditionally: it is inert
// (makes no request) and is Google's raw-HTML site-ownership signal.
// `lang` + `alternates` exist for the Spanish pilot (/es/quiz/boca-juniors/).
// Both default to today's behaviour, so every existing page renders byte-identical.
//
// hreflang has to be RECIPROCAL or Google ignores the whole cluster — the
// English page must point at the Spanish one as well as the other way round —
// and the set must include an x-default. That is why `alternates` is a list
// passed in by the caller rather than something derived here: only the caller
// knows both halves of the pair exist.
// Lighten a club hex enough to clear 4.5:1 on our near-black ground. Club
// crests are chosen for shirts, not dark UI — Juventus black and Porto navy are
// unreadable as text — so the *text* tint is derived, while the solid crest
// keeps the true colour. Measured, not eyeballed: the loop stops at the first
// step that passes.
function softenAccent(hex) {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (h) => (lum(h) + 0.05) / (0.0111 + 0.05); // vs #0F1117
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
  for (let n = 0; n < 24 && ratio(`#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`) < 4.5; n++) {
    r = Math.min(255, Math.round(r + (255 - r) * 0.16));
    g = Math.min(255, Math.round(g + (255 - g) * 0.16));
    b = Math.min(255, Math.round(b + (255 - b) * 0.16));
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function head({ title, description, canonical, ld, ads = false, ogImage = SITE.ogImage, lang = 'en', alternates = [], accent = null, taster = false }) {
  return `<!DOCTYPE html>
<html lang="${lang}" style="background-color:${PAGE_BG}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="${PAGE_BG}" />
<meta name="color-scheme" content="dark" />
<meta name="robots" content="max-image-preview:large" />
<meta name="google-adsense-account" content="${ADSENSE_CLIENT}" />
<script>
/* Microsoft Clarity — ALL web pages, WEB ONLY behind the same native guard as
   the AdSense loader below (these pages ship inside the native bundle too). */
(function(){try{
  var native = location.protocol === 'capacitor:' ||
    (window.Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) ||
    document.documentElement.classList.contains('native-app');
  if (native) return;
  window.clarity = window.clarity || function(){(window.clarity.q = window.clarity.q || []).push(arguments);};
  var c = document.createElement('script');
  c.async = true;
  c.src = 'https://www.clarity.ms/tag/xqwevk9brq';
  document.head.appendChild(c);
}catch(e){}})();
</script>${ads && ADS_ENABLED ? `
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
<link rel="canonical" href="${canonical}" />${alternates.map((a) => `
<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`).join('')}
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" /></noscript>
<style>
  ${accent ? `:root{--club:${accent};--club-soft:${softenAccent(accent)}}` : ''}
  :root{--bg:#0A0A0A;--bg2:#0C0E13;--card:#0F1117;--card2:#14161E;--bd:#242836;--bd2:#2A2D3A;--bd3:#3A3D4A;--grn:#58CC02;--grn-ink:#06230C;--grn-soft:#8AE042;--amber:#FFC107;--wrong:#FF4747;--tx:#F0F1F5;--tx2:#E8EAF0;--tx3:#9BA0B8;--tx4:#7E828C;--mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
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
  .nav-link.active{color:#fff;border-bottom:2px solid var(--grn);padding-bottom:2px}
  /* Flat per the 2026-07-21 Clubs Directory handoff — Alex: no 3D look. */
  .nav-cta{display:inline-flex;align-items:center;padding:9px 16px;background:var(--grn);color:var(--grn-ink);font-weight:800;font-size:13.5px;border-radius:12px}
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
  /* MOBILE: stack to one column AND lift the playable taster ABOVE the
     marketing column.
     Measured on a real 375x812 viewport, 2026-07-28 (a container-width probe
     is NOT valid here — @media keys off the VIEWPORT, so a narrow wrapper
     still renders desktop styles):
        h1 212 · lead 304 · [CTA buttons ~403-729] · taster 729
        first tappable option 926  ->  114px BELOW the 812px fold
     hero-left carries the headline, the prose AND three stacked download
     buttons (Play the quiz / App Store / Google Play) — roughly 326px of
     column that a phone must scroll past before reaching a single question.
     So a Google visitor was asked to install an app before answering anything.
     Order is swapped in CSS only: the DOM keeps hero-left first, so desktop's
     left-to-right layout and the heading order for crawlers are untouched. */
  @media(max-width:940px){
    .hero-grid{grid-template-columns:1fr;gap:30px}
    .hero-left{order:2}
    .hero-right{order:1}
  }
  /* "What the <club> quiz covers" topic grid */
  .covers{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:12px;margin-top:6px}
  /* .cov is now an <a> (people were tapping these as divs). display:block +
     colour reset stop it rendering as an underlined default-blue link; the
     hover/focus state gives it the affordance it always lacked. */
  .cov{display:block;color:inherit;text-decoration:none;background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px 18px 16px;transition:border-color .15s,background .15s,transform .15s}
  a.cov:hover{border-color:var(--grn);background:var(--card2);transform:translateY(-2px)}
  a.cov:focus-visible{outline:2px solid var(--grn);outline-offset:2px}
  .cov h3{font-size:15.5px;font-weight:800;color:#fff;margin:0 0 6px;letter-spacing:-.01em}
  .cov p{font-size:13.5px;color:var(--tx3);line-height:1.5;margin:0}
  .crumbs{font-family:var(--mono);font-size:12px;color:var(--tx4);margin-bottom:22px}
  .crumbs a{color:var(--tx3)}
  .crumbs a:hover{color:#fff;text-decoration:none}
  .crumbs .sep{color:var(--tx4);margin:0 7px}
  /* clubs/players/nations -> /lists/. See listsMentioning(): every list page
     had exactly ONE inbound internal link before this, against 163 for a club
     page, so we were signalling the whole reference surface as unimportant. */
  .editorial{margin:18px 0 0;padding:14px 16px;background:var(--card);border:1px solid var(--bd);border-left:3px solid var(--grn);border-radius:0 12px 12px 0;font-size:13.5px;line-height:1.6;color:var(--tx3)}
  .editorial a{color:var(--grn-soft)}
  .llinks{list-style:none;padding:0;margin:0;display:grid;gap:8px}
  .llinks li{background:var(--card);border:1px solid var(--bd);border-radius:12px}
  .llinks a{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 15px;color:var(--tx);text-decoration:none;font-weight:700;font-size:15px}
  .llinks li:hover{border-color:var(--grn);background:var(--card2)}
  .llinks a:focus-visible{outline:2px solid var(--grn);outline-offset:2px}
  .llink-t{min-width:0}
  .llink-n{flex:0 0 auto;font-family:var(--mono);font-size:11.5px;font-weight:600;color:var(--tx4);white-space:nowrap}
  .skip{position:absolute;left:-9999px;top:0;z-index:200;padding:12px 20px;background:var(--grn);color:var(--grn-ink);font-weight:800;border-radius:0 0 12px 0}
  .skip:focus{left:0}
  .kicker{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .badge-chip{display:inline-flex;align-items:center;justify-content:center;min-width:46px;height:32px;padding:0 10px;border-radius:10px;background:#1F2430;font-family:var(--mono);font-weight:800;font-size:13px;letter-spacing:.03em;color:#fff}
  .badge-chip.emoji{background:rgba(255,255,255,.04);font-size:22px;padding:0 8px}
  .eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--club-soft,var(--grn))}
  .hero h1{font-family:'Anton',Inter,sans-serif;font-weight:400;font-size:clamp(40px,5.6vw,64px);line-height:.92;letter-spacing:.004em;text-transform:uppercase;color:#fff;margin-bottom:16px}
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
  .ad-slot{max-width:760px;margin:0 auto;text-align:center}
  .ad-slot .adsbygoogle{display:block}
  .ad-slot:has(.adsbygoogle[data-ad-status="filled"]){margin:10px auto 26px}
  .ad-slot:has(.adsbygoogle[data-ad-status="filled"])::before{content:"Advertisement";display:block;margin-bottom:6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx4)}
  /* related tiles */
  /* Compact tiles (2026-07-29). MEASURED on the live Arsenal page: "More
     quizzes to try" was 5,734px — 41% of a 13,953px page, the single largest
     block on it, and it is a LINK LIST. 115 links at minmax(160px) rendered two
     per row as 76px cards, so 58 rows of navigation sat between the reader and
     the FAQ / record-book content beneath.
     Every link is kept — the internal mesh is doing real crawl work. Only the
     box around each one shrinks: 3 columns on a 390px phone instead of 2, and
     ~44px tall instead of 76px (still at the 44px touch-target norm). */
  .tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
  .tile{display:flex;align-items:center;gap:8px;padding:8px 10px;min-height:44px;background:var(--card2);border:1px solid var(--bd);border-radius:11px;transition:border-color .16s,transform .16s}
  .tile:hover{text-decoration:none;border-color:var(--bd3);transform:translateY(-2px)}
  .tbadge{width:26px;height:26px;flex:0 0 auto;border-radius:8px;background:#1F2430;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:800;color:#fff;letter-spacing:.02em}
  .tbadge.emoji{background:rgba(255,255,255,.04);font-size:15px}
  .tname{font-size:12.5px;font-weight:700;color:var(--tx);line-height:1.25;min-width:0;overflow:hidden;text-overflow:ellipsis}
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
  .qa-list{list-style:none;counter-reset:qa;padding:0;margin:0}
  .qa{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:16px 16px 14px;margin-bottom:12px}
  .qa .q{font-weight:700;color:#fff;font-size:16px;margin-bottom:12px;line-height:1.4}
  .qa .q::before{counter-increment:qa;content:counter(qa) ". ";color:var(--grn-soft);font-family:var(--mono)}
  .qa-opts{display:flex;flex-direction:column;gap:8px}
  .qa-opts .to{padding:11px 13px;font-size:14px}
  .qa-why{border-top:1px dashed var(--bd);padding-top:12px;margin-top:12px;color:var(--tx3);font-size:14px;line-height:1.55}
  .qa-why::before{content:"✓ ";color:var(--grn-soft);font-weight:800}
  /* footer */
  .foot{border-top:1px solid #16181F;background:var(--bg2);margin-top:36px}
  .foot-in{max-width:none;margin:0 auto;padding:40px clamp(20px,4vw,48px) 48px}
  .foot .brand img{width:28px;height:28px}
  .foot-links{display:flex;flex-wrap:wrap;gap:10px 20px;margin:18px 0}
  .foot-links a{color:var(--tx3);font-size:14px}
  .foot-links a:hover{color:#fff;text-decoration:none}
  .foot-copy{color:var(--tx4);font-size:13px;margin-top:4px}
  .foot-disc{color:var(--tx4);font-size:11.5px;line-height:1.6;margin-top:14px;max-width:80ch}
  /* PHONE NAV. At 375px the old rule only shrank type, so five items still
     fought over ~347px of usable width: the brand collided with "All quizzes"
     and BOTH the link and the CTA wrapped onto two lines. It was the first
     thing a visitor saw and it looked broken.
     Below 560px the three text links are hidden — they are duplicated in the
     footer of every page and remain in the DOM, so internal linking and
     crawlability are unaffected — leaving a clean brand + one green CTA.
     nowrap on both is the actual guard against the two-line wrap. */
  .nav-cta{white-space:nowrap}
  .brand{white-space:nowrap;flex:0 0 auto}
  @media(max-width:560px){
    .nav-link{display:none}
    .nav-in{padding:11px 14px}
    .nav-right{gap:10px}
    .nav-cta{padding:9px 15px;font-size:13.5px}
    .brand{font-size:17px}
    .brand img{width:25px;height:25px}
  }
${taster ? TASTER_CSS : ''}
${BQ_CSS}
  /* Fixed columns, never flex-wrap: a fourth item in a narrow column dropped
     onto its own full-width row and read as a layout bug. */
  .hero-facts{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);margin:16px 0 0}
  .hero-facts .hf{padding:12px 0;border-right:1px solid var(--bd);min-width:0}
  .hero-facts .hf:last-child{border-right:0}
  .hero-facts .hf b{display:block;font-family:var(--mono);font-size:19px;font-weight:700;color:#fff;line-height:1}
  .hero-facts .hf span{display:block;font-size:11.5px;color:var(--tx4);margin-top:5px}
  .hero-free{margin:14px 0 0;font-size:13px;color:var(--tx4)}
  .trust-note{font-size:14.5px;color:var(--tx3);line-height:1.65;border-left:2px solid var(--bd2);padding-left:14px}
</style>
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">${ld}</script>
</head>`;
}

// Guarantees the hero CTA produces a visible response. See the dead-click note
// on ctaRow: anchoring to an element already in view is a no-op, so we scroll
// it in AND focus its first option. Lives in the footer so every page gets it.
const CTA_JS = `(function(){var a=document.querySelector('a[data-scrollto]');if(!a)return;a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});var o=t.querySelector('.to');if(o)setTimeout(function(){o.focus({preventScroll:true})},420)})})();`;

function footer() {
  return `<script>${CTA_JS}</script>
<footer class="foot"><div class="foot-in">
<a class="brand" href="${SITE.base}/"><img src="/marketing/ball.png" alt="Ball IQ" width="26" height="26" />Ball&nbsp;<b>IQ</b></a>
${/* THESE THREE SLOTS ARE THE ONLY SITE-WIDE INTERNAL LINKS WE CONTROL, and
      they were picked once and never revisited. Measured 2026-07-29:

        manchester-united  183 inbound internal links  (footer -> every page)
        premier-league     183                          (footer -> every page)
        arsenal            109                          (tile mesh only)
        chelsea            110
        liverpool          114

      So ~40% of the site's internal link equity was pointed at Man United,
      which is not a page we are trying to move — while Arsenal, which GSC has
      at position 14.9 for "arsenal quiz" and 19.3 for "arsenal quizzes", the
      two US queries where a click is actually possible, sat in the tile mesh
      with a third fewer links.

      Arsenal is added rather than swapped in: Man United's own rankings are
      not a problem to create. Four slots still keeps the footer a signal
      rather than a link farm. This is a hypothesis — the measured ceiling is
      authority, not on-page — but it is free, it is directionally right, and
      pointing site-wide equity at the page closest to breaking page 1 costs
      nothing if it fails. */ ''}
<div class="foot-links">
<a href="${SITE.base}/quiz/premier-league/">Premier League quiz</a>
<a href="${SITE.base}/quiz/arsenal/">Arsenal quiz</a>
<a href="${SITE.base}/quiz/manchester-united/">Man United quiz</a>
<a href="${SITE.base}/quiz/champions-league/">Champions League quiz</a>
<a href="${SITE.base}/quiz/">All quizzes</a>
<a href="${SITE.base}/lists/">Football lists</a>
${/* /study/ measured ZERO inbound internal links on 2026-07-30 — a TRUE orphan,
      reachable only via sitemap.xml. It is the one page built specifically to
      EARN links, so leaving it unlinked from our own site was self-defeating. */ ''}
<a href="${SITE.base}/study/football-trivia-memory/">Trivia memory study</a>
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
  // TASTER LENGTH — 10, not 5.
  // The page carried TWO quiz widgets: a 5-question scored taster in the hero
  // and a separate unscored Q&A block below, drawn from disjoint pools. Neither
  // continued into the other, so a visitor who finished the taster was invited
  // to "play the full quiz" — which, from their seat, is the same thing again.
  // Session recordings back this: one visitor spent 2,135 SECONDS and 15 clicks
  // on a club page and never crossed over.
  // A longer single run means more investment before the ask, and one
  // continuous experience instead of two half-ones.
  // One pool — see renderQuizSet(). Was a 10-q JSON taster + a disjoint HTML block.
  const quizRows = arcPick(hints, Math.min(22, hints.length));
  const sample = quizRows;
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
  const html = `${head({ title: catCfg.title, description: catCfg.description, canonical, ld, ads: true, ogImage, accent: CLUB_COLOR[catCfg.slug] })}
<body>
${NAV}
<main id="main">
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
    chips: [
      { n: all.length, label: 'questions' },
      ...(pct100(all) ? [{ n: '100%', label: 'explained' }] : []),
      { n: hard, label: 'hard ones' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: catCfg.name, tiers: DEFAULT_TIERS, more: Math.max(0, all.length - quizRows.length) }))}
${renderCovers(catCfg.name, true, false, deepPlay)}
${appCtaBand(catCfg.name)}
${adSlot('afterQA')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
${renderListLinks(catCfg.name)}
</section>
<section class="sec narrow">
${trustSection(catCfg.name, all)}
<h2 id="faq">${esc(catCfg.name)} quiz — FAQ</h2>
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
// ── Localised club page (pilots) ─────────────────────────────────────────────
// Emits /<lang>/quiz/<slug>/. Deliberately its own builder rather than a flag on
// buildClubPage: almost every string on a club page is English prose baked into
// the shared renderers (taster eyebrow, covers grid, CTA band), and threading a
// translation table through all of them to serve two pages would be the tail
// wagging the dog. This renders the localised content directly and reuses only
// the renderers that take pure data.
//
// ONE PAGE PER LANGUAGE, not one page total. Wave L shipped five South American
// clubs and they do NOT share a language: Boca and River are Argentine, while
// Corinthians, Flamengo and Palmeiras are Brazilian — so a Spanish page leaves
// the majority of that wave unserved. Spanish and Portuguese are separate
// search markets with separate competition, so each needs its own pilot before
// anything scales. Two experiments, not seventy pages on a hunch.
//
// The questions come from clubs-<lang>.mjs, which stores a translation per
// English question id. We resolve every id against the bank and throw if one is
// missing — a question deleted or re-idded later must break the build, not
// leave this page quoting something that no longer exists.
function buildClubPageIntl(cfg, siblings = []) {
  const byId = new Map(QB.filter((q) => q.club === cfg.club).map((q) => [q.id, q]));
  const rows = [...cfg.taster, ...cfg.sample];
  const orphans = rows.filter((r) => !byId.has(r.id)).map((r) => r.id);
  if (orphans.length) {
    throw new Error(
      `[gen-seo] /${cfg.lang}/quiz/${cfg.slug}: ${orphans.length} translated question(s) no longer resolve in the bank: ${orphans.join(', ')}. ` +
      `Either the English question was deleted/re-idded, or its \`club\` changed. Fix scripts/seo/clubs-es.mjs in the same change as the bank edit.`,
    );
  }
  // Answer-key agreement.
  //
  // Worth stating what is actually guarded, because the first version of this
  // check guarded the wrong thing and failed the build on a CORRECT translation
  // ("Azul con banda amarilla" shares no letters with "Blue with a yellow
  // band"). No code can judge whether Spanish prose is a good translation. What
  // it can do is notice when the English original moves underneath a
  // translation that was checked by hand — a corrected answer key in
  // src/questions.js silently leaving this page wrong, in a language nobody
  // reviewing that correction reads.
  //
  // Two shapes, because two kinds of answer exist:
  //
  //   Proper nouns ("River Plate", "Carlos Bianchi", "40") survive translation
  //   unchanged, so the resolved strings are compared directly — loosely, since
  //   accents and casing legitimately shift (Grêmio/Gremio), and by digits when
  //   the answer is numeric ("Los años 2000" vs "The 2000s").
  //
  //   Translated prose shares no letters with its original, so those entries
  //   carry `en`: the exact English answer they were translated FROM, compared
  //   to the bank verbatim. It reads as redundant and is not — it is the
  //   tripwire. Change that English answer and this throws, naming the id.
  const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const mismatched = rows.filter((r) => {
    const en = byId.get(r.id);
    const enAns = en.o[en.a];
    if (r.en != null) return fold(r.en) !== fold(enAns);
    const a = fold(enAns);
    const b = fold(r.o[r.a]);
    const aD = a.replace(/[^0-9]/g, '');
    const bD = b.replace(/[^0-9]/g, '');
    if (aD && aD === bD) return false;
    return !(a.includes(b) || b.includes(a));
  });
  if (mismatched.length) {
    throw new Error(
      `[gen-seo] /${cfg.lang}/quiz/${cfg.slug}: translated answer key no longer agrees with the English original for ` +
      mismatched.map((r) => `${r.id} (es="${r.o[r.a]}"${r.en ? `, declared en="${r.en}"` : ''} vs bank="${byId.get(r.id).o[byId.get(r.id).a]}")`).join('; ') +
      `. If the English answer was corrected, correct the translation too. If the Spanish answer is translated prose rather than a proper noun, give the entry an \`en\` field naming the exact English answer it came from.`,
    );
  }

  const all = clubRows(cfg.club);
  const easy = all.filter((x) => x.diff === 'easy').length;
  const medium = all.filter((x) => x.diff === 'medium').length;
  const hard = all.filter((x) => x.diff === 'hard').length;

  const canonical = `${SITE.base}/${cfg.lang}/quiz/${cfg.slug}/`;
  const enHref = `${SITE.base}/quiz/${cfg.slug}/`;
  // The cluster names EVERY language this slug exists in, not just this page's
  // own — a two-language cluster where each page only knows about English is
  // not a cluster. x-default points at English: it is the fallback for a reader
  // whose language we do not publish.
  const alternates = [
    { hreflang: 'en', href: enHref },
    ...siblings.map((s) => ({ hreflang: s.lang, href: `${SITE.base}/${s.lang}/quiz/${s.slug}/` })),
    { hreflang: 'x-default', href: enHref },
  ];
  const c = cfg.copy;

  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ball IQ', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE.base}/quiz/` },
          { '@type': 'ListItem', position: 3, name: cfg.h1, item: canonical },
        ],
      },
      eduQuizLd(cfg.h1, cfg.sample),
    ],
  });

  const clubBadge = CLUB_BADGE[cfg.slug] || deriveBadge(cfg.name);
  const ogImage = clubOgImage({ name: cfg.name, badge: clubBadge, color: CLUB_COLOR[cfg.slug], kind: 'Quiz de club' });
  const introHtml = cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n');

  // Spanish taster markup. Same widget + same TASTER_JS as the English pages
  // (the script reads its questions from the JSON block, so it is language
  // agnostic); only the surrounding copy differs.
  const payload = cfg.taster.map((r) => ({ q: r.q, o: r.o, a: r.a, why: r.hint }));
  const tasterHtml = `<section class="taster" id="taster" aria-labelledby="taster-h">
<div class="eyebrow">${esc(c.tasterEyebrow)}</div>
<h2 id="taster-h">${esc(c.tasterH)}</h2>
<div class="tcard" id="biq-taster" data-name="${esc(cfg.name)}" data-play="${SITE.base}/play?club=${cfg.slug}" data-store="${SITE.getApp}">
<p class="tph">${esc(c.tasterPh)} <a href="${SITE.base}/play?club=${cfg.slug}">${esc(c.playLabel)} →</a></p>
</div>
<p class="taster-note">${esc(c.tasterNote)}</p>
<script type="application/json" id="biq-taster-data">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>
<script>${TASTER_JS}</script>
</section>`;

  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true, ogImage, lang: cfg.lang, alternates , taster: true})}
<body>
${NAV}
<main id="main">
${heroTwoCol({
    crumbItems: [
      { name: 'Ball IQ', url: `${SITE.base}/` },
      { name: 'Quizzes', url: `${SITE.base}/quiz/` },
      { name: cfg.h1, url: canonical },
    ],
    badge: { text: clubBadge, emoji: false, color: CLUB_COLOR[cfg.slug] },
    kind: cfg.kind,
    name: cfg.name,
    h1: cfg.h1,
    lead: cfg.description,
    statLine: cfg.statLine,
    playHref: '#play',
    playLabel: cfg.playLabel,
  }, tasterHtml)}
<section class="sec narrow" id="play">
<h2>${esc(c.playSection)}</h2>
<p class="sub">${esc(c.playSub)}</p>
${renderQA(cfg.sample)}
</section>
${adSlot('afterQA')}
<section class="sec"><div class="appband">
<div class="appband-flame" aria-hidden="true">🔥</div>
<div class="appband-in">
<h2>${esc(c.bandH)}</h2>
<p>${esc(c.bandP)}</p>
${storeBadges()}
</div>
</div></section>
<section class="sec narrow">
<h2>${esc(c.alsoH)}</h2>
<p class="sub">${esc(c.alsoP)} <a href="${enHref}" hreflang="en">${esc(c.alsoLink)}</a></p>
</section>
<section class="sec narrow">
<h2>${esc(c.faqH)}</h2>
${renderFaq(cfg.faq, { q: c.aboutQ, html: `${introHtml}\n<p class="stats">${esc(c.statsLine(all.length, easy, medium, hard))}</p>` })}
</section>
${adSlot('afterFaq')}
</main>
${footer()}`;

  const dir = resolve(DIST, cfg.lang, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, lang: cfg.lang, canonical, count: rows.length };
}

function buildClubPage(cfg, clubPages, catPages, playerPages = [], nationPages = []) {
  const all = clubRows(cfg.club);
  const hints = clubHintRows(cfg.club);
  if (hints.length < MIN_HINTS) {
    throw new Error(
      `[gen-seo] club "${cfg.club}" has only ${hints.length} hint-bearing MCQs (< ${MIN_HINTS}). Refusing to emit a thin page.`,
    );
  }
  // TASTER LENGTH — 10, not 5.
  // The page carried TWO quiz widgets: a 5-question scored taster in the hero
  // and a separate unscored Q&A block below, drawn from disjoint pools. Neither
  // continued into the other, so a visitor who finished the taster was invited
  // to "play the full quiz" — which, from their seat, is the same thing again.
  // Session recordings back this: one visitor spent 2,135 SECONDS and 15 clicks
  // on a club page and never crossed over.
  // A longer single run means more investment before the ask, and one
  // continuous experience instead of two half-ones.
  // ONE pool, not two. The page used to render a 10-question taster from a JSON
  // payload plus a disjoint 12-question Q&A block in HTML — two quizzes from the
  // visitor's seat, and only the second one was crawlable. Now every question is
  // server-rendered in a single set and JS paces it.
  const quizRows = arcPick(hints, Math.min(22, hints.length));
  const sample = quizRows; // the eduQuiz flashcard nodes anchor to what is rendered
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

  // ⚠️ Nation pages were a SEALED ISLAND. Measured 2026-07-30: each of the nine
  // received exactly 8 inbound internal links — from the other eight nations and
  // nowhere else. Neither the hub nor any of the 117 club pages linked one, so
  // the class got zero equity from the bulk of the site, against an 80-link
  // average for clubs. Same defect class as the 50 orphaned /lists pages, and
  // worse here because GSC has nation pages as our BEST converters:
  // /quiz/argentina/ runs 7.5% CTR, ahead of Liverpool (3.8%), Newcastle (2.8%)
  // and Arsenal (2.0%).
  //
  // Rotate rather than slice — `slice(0, N)` would point all 117 club pages at
  // the same first nations and leave the tail orphaned, which is exactly the bug
  // the nation-to-nation mesh above already had to fix once.
  const nStart = clubPages.findIndex((p) => p.slug === cfg.slug);
  const nationSlice = nationPages.length
    ? Array.from({ length: Math.min(2, nationPages.length) },
      (_, i) => nationPages[(Math.max(0, nStart) + i) % nationPages.length])
    : [];

  const related = [
    ...clubPages.filter((p) => p.slug !== cfg.slug),
    ...catPages,
    ...playerPages,
    ...nationSlice,
  ];

  const clubBadge = CLUB_BADGE[cfg.slug] || deriveBadge(cfg.name);
  const ogImage = clubOgImage({ name: cfg.name, badge: clubBadge, color: CLUB_COLOR[cfg.slug], kind: 'Club quiz' });
  // The other half of the hreflang pair. Google discards a cluster whose links
  // are not reciprocal, so the English page has to point back at the Spanish
  // one — and it only does so for slugs that actually have a Spanish page.
  const twins = CLUBS_INTL.filter((e) => e.slug === cfg.slug);
  const alternates = twins.length
    ? [
      { hreflang: 'en', href: canonical },
      ...twins.map((t) => ({ hreflang: t.lang, href: `${SITE.base}/${t.lang}/quiz/${cfg.slug}/` })),
      { hreflang: 'x-default', href: canonical },
    ]
    : [];
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true, ogImage, alternates, accent: CLUB_COLOR[cfg.slug] })}
<body>
${NAV}
<main id="main">
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
    chips: [
      { n: all.length, label: 'questions' },
      ...(pct100(all) ? [{ n: '100%', label: 'explained' }] : []),
      { n: hard, label: 'hard ones' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: cfg.name, tiers: tiersFor(cfg.slug), more: Math.max(0, all.length - quizRows.length), badge: clubBadge }))}
${adSlot('afterQA')}
${renderCovers(cfg.name, false, false, `${SITE.base}/play?club=${cfg.slug}`)}
${appCtaBand(cfg.name)}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
${renderListLinks(cfg.name)}
</section>
<section class="sec narrow">
${trustSection(cfg.name, all)}
<h2 id="faq">${esc(cfg.name)} quiz — FAQ</h2>
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
function playerAllRows(match) {
  const re = new RegExp('(' + match.join('|') + ')', 'i');
  return QB.filter(
    (x) => x.type === 'mcq' && Array.isArray(x.o) && (re.test(x.q) || (x.a != null && re.test(x.o[x.a] || ''))),
  );
}

function playerHintRows(match) {
  return playerAllRows(match).filter((x) => x.hint);
}
function buildPlayerPage(cfg, clubPages, catPages) {
  const poolAll = playerAllRows(cfg.match);
  const hints = playerHintRows(cfg.match);
  if (hints.length < MIN_HINTS) {
    throw new Error(`[gen-seo] player "${cfg.slug}" has only ${hints.length} hint MCQs (< ${MIN_HINTS}). Refusing a thin page.`);
  }
  // TASTER LENGTH — 10, not 5.
  // The page carried TWO quiz widgets: a 5-question scored taster in the hero
  // and a separate unscored Q&A block below, drawn from disjoint pools. Neither
  // continued into the other, so a visitor who finished the taster was invited
  // to "play the full quiz" — which, from their seat, is the same thing again.
  // Session recordings back this: one visitor spent 2,135 SECONDS and 15 clicks
  // on a club page and never crossed over.
  // A longer single run means more investment before the ask, and one
  // continuous experience instead of two half-ones.
  // One pool — see renderQuizSet(). Also anchors the flashcard Quiz node below.
  const quizRows = arcPick(hints, Math.min(22, hints.length));
  const sample = quizRows;
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
<main id="main">
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
    chips: [
      { n: hints.length, label: 'questions' },
      // pct100(hints) would be a tautology — `hints` IS the explained rows.
      // Measure the unfiltered pool or the claim means nothing.
      ...(pct100(poolAll) ? [{ n: '100%', label: 'explained' }] : []),
      { n: hints.filter((r) => r.diff === 'hard').length, label: 'hard ones' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: cfg.name, tiers: DEFAULT_TIERS, more: Math.max(0, hints.length - quizRows.length) }))}
${renderCovers(cfg.name, false, true, `${SITE.base}/play`)}
${appCtaBand(cfg.name)}
<section class="sec narrow">
<h2>${esc(cfg.name)} sample questions &amp; answers</h2>
<p class="sub">Tap an answer to check it — instant right/wrong and the story behind it.</p>
${renderQA(sample)}
</section>
${adSlot('afterQA')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
${renderListLinks(cfg.name)}
</section>
<section class="sec narrow">
${trustSection(cfg.name, poolAll)}
<h2 id="faq">${esc(cfg.name)} quiz — FAQ</h2>
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
// Questions to make a reference list PLAYABLE.
//
// Clarity, 2026-07-28: club pages (which carry a taster) hold 109-145s of
// ACTIVE time — more than the app itself. These list pages, which carry none,
// hold 2.3s at 14% scroll depth. Same traffic source, same layout language;
// the only structural difference is that there is nothing here to DO. So give
// them something.
//
// Topicality is enforced twice, because a generic question on a Ballon d'Or
// page is worse than no question: the candidate pool is restricted to the list's own
// category, AND the question must mention an entity that actually appears in
// the table. Falls back to category-only, then to no taster at all — a page
// with an off-topic quiz is the one outcome we don't ship.
const LIST_CATS = [
  [/ballon-dor|golden-boot|greatest/, ['Legends', 'Records']],
  [/champions-league|european-cup/, ['UCL', 'ChampionsLeague']],
  [/premier-league|most-fa-cups|fa-cup/, ['PL']],
  [/world-cup/, ['WorldCup']],
  [/euro|european-championship/, ['Euros']],
  [/la-liga|copa-del-rey/, ['LaLiga']],
  [/serie-a|coppa-italia/, ['SerieA']],
  [/bundesliga|dfb/, ['Bundesliga']],
  [/ligue-1|coupe-de-france/, ['Ligue1']],
  [/primeira|liga-portugal/, ['Primeira']],
  [/super-lig/, ['SuperLig']],
  [/transfer|expensive/, ['Transfers']],
  [/manager|coach/, ['Managers']],
];
// Generic football vocabulary. A first cut split cells into words and kept any
// capitalised 5+ token, so "League", "United" and "Cup" became "entities" and
// matched most of the bank — the World Cup list got a CONCACAF question and the
// Asian Cup list got Copa Libertadores. Entities must be whole names.
const LIST_STOP = new Set(['league', 'cup', 'united', 'city', 'club', 'final', 'finals',
  'winner', 'winners', 'season', 'total', 'goals', 'first', 'record', 'champions',
  'football', 'national', 'team', 'player', 'players', 'title', 'titles', 'year']);

function listTasterRows(cfg, usedIds) {
  const hit = LIST_CATS.find(([re]) => re.test(cfg.slug));
  if (!hit) return [];                 // unmapped list → no taster, never a generic one
  const cats = hit[1];
  const pool = QB.filter((r) => cats.includes(r.cat) && r.type === 'mcq'
    && r.hint && Array.isArray(r.o) && r.o.length === 4 && !usedIds.has(r.id));

  // Whole cell values that read as proper names: "Lionel Messi", "Real Madrid".
  // Numbers, years and bare generic words are excluded.
  const ents = [];
  for (const cell of cfg.rows.flat()) {
    const v = String(cell).trim();
    if (v.length < 5 || /^\d/.test(v) || !/^[A-ZÀ-Þ]/.test(v)) continue;
    if (LIST_STOP.has(v.toLowerCase())) continue;
    ents.push(v.toLowerCase());
  }
  const uniq = [...new Set(ents)];
  const mentions = (r) => {
    const hay = (r.q + ' ' + r.o.join(' ')).toLowerCase();
    return uniq.some((e) => hay.includes(e));
  };

  // No generic fallback: a page with an off-topic quiz is worse than a page
  // with none, so fewer than 5 genuinely on-topic questions means no taster.
  const onTopic = pool.filter(mentions);
  if (onTopic.length < 5) return [];
  const rows = tasterPick(onTopic, 5);
  rows.forEach((r) => usedIds.add(r.id));   // no two lists share a question set
  return rows.length === 5 ? rows : [];
}

// ── clubs/players/categories → LISTS (the missing half of the mesh) ──────────
// Measured 2026-07-28: every one of the 50 /lists/ pages had exactly ONE
// inbound internal link — the /lists hub — while /quiz/manchester-united/ and
// even /contact/ had 163. The lists link OUT generously (18-25 each via
// listRelatedPages) and got nothing back, so we were signalling to Google that
// our entire reference-list surface is unimportant. Median inbound across the
// site was 64; these sat at 1.
//
// This is the reverse edge. Given an entity name, find the lists whose own
// rows mention it — the same containment test listRelatedPages uses, run the
// other way, so the two directions stay consistent by construction.
function listsMentioning(name, limit = 4) {
  const needle = String(name).replace(/ (quiz|fc)$/i, '').toLowerCase();
  if (needle.length < 4) return [];
  const hits = [];
  for (const l of LISTS) {
    const hay = l.rows.flat().join(' | ').toLowerCase();
    if (hay.includes(needle)) hits.push({ slug: l.slug, h1: l.h1, n: l.rows.length });
  }
  // Prefer the meatier tables — a 100-row list is a better destination than a
  // 16-row one, and passes more of its own equity onward.
  return hits.sort((a, b) => b.n - a.n).slice(0, limit);
}

function renderListLinks(name) {
  const hits = listsMentioning(name);
  if (!hits.length) return '';
  return `<section class="sec narrow">
<h2 id="records">${esc(name)} in the record books</h2>
<p class="sub" style="color:var(--tx3);margin:-6px 0 14px">Free reference tables — every winner, every top scorer, checked and dated.</p>
<ul class="llinks">${hits.map((h) => `<li><a href="${SITE.base}/lists/${h.slug}/"><span class="llink-t">${esc(h.h1)}</span><span class="llink-n">${h.n} entries</span></a></li>`).join('')}</ul>
</section>`;
}

// LIST -> SIBLING LISTS. listsMentioning() only reaches lists whose rows name a
// club or player, which left 11 stranded on a single inbound link: the
// aggregates ("most-* titles") and the national-team competitions (AFCON,
// Asian Cup, Copa América, Club World Cup) contain neither. They are also the
// pages a reader most wants paired — if you are looking at winners by season,
// the all-time count is the obvious next question, and vice versa.
const LIST_FAMILY = [
  [/premier-league/, 'the Premier League'], [/champions-league|european-cup/, 'the Champions League'],
  [/la-liga/, 'La Liga'], [/serie-a/, 'Serie A'], [/bundesliga/, 'the Bundesliga'],
  [/ligue-1|coupe-de-france/, 'French football'], [/world-cup/, 'the World Cup'],
  [/\beuro/, 'the Euros'], [/copa-america/, 'the Copa América'], [/afcon|african/, 'AFCON'],
  [/asian-cup/, 'the Asian Cup'], [/libertadores/, 'the Copa Libertadores'],
  [/ballon-dor/, "the Ballon d'Or"], [/fa-cup/, 'the FA Cup'],
  [/eredivisie/, 'the Eredivisie'], [/primeira|liga-portugal/, 'Primeira Liga'],
  [/super-lig/, 'the Süper Lig'], [/scottish/, 'Scottish football'],
];
function siblingLists(slug, limit = 4) {
  const fam = LIST_FAMILY.find(([re]) => re.test(slug));
  if (!fam) return null;
  const [re, label] = fam;
  const sibs = LISTS.filter((l) => l.slug !== slug && re.test(l.slug))
    .sort((a, b) => b.rows.length - a.rows.length).slice(0, limit);
  return sibs.length ? { label, sibs } : null;
}
function renderSiblingLists(slug) {
  const r = siblingLists(slug);
  if (!r) return '';
  return `<section class="sec narrow">
<h2>More on ${esc(r.label)}</h2>
<ul class="llinks">${r.sibs.map((s) => `<li><a href="${SITE.base}/lists/${s.slug}/">${esc(s.h1)}</a> <span class="llink-n">${s.rows.length} entries</span></li>`).join('')}</ul>
</section>`;
}

function buildListPage(cfg, clubPages, playerPages, catPages, usedIds) {
  const canonical = `${SITE.base}/lists/${cfg.slug}/`;
  const cols = cfg.columns;
  const rows = cfg.rows;
  const related = listRelatedPages(rows, clubPages, playerPages);
  const taster = listTasterRows(cfg, usedIds);
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
  .ltable-ad td{padding:0;border:0}
  .ltable-ad td:has(.adsbygoogle[data-ad-status="filled"]){padding:12px 14px;background:rgba(255,255,255,.02)}
  .ltable-ad td .ad-slot{margin:0}
  </style>`;
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true })}
<body>
${NAV}
<main id="main">
${style}
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <a href="${SITE.base}/lists/">Football lists</a> › <span>${esc(cfg.h1)}</span></nav>
<h1 style="font-size:clamp(26px,4.4vw,40px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 6px">${esc(cfg.h1)}</h1>
<p class="sub" style="color:var(--tx3);margin:0 0 18px">${rows.length} entries${asOf} · free · from the Ball IQ football team</p>
${/* Only the FIRST intro paragraph sits above the taster. The full intro ran
      ~990px, which pushed the taster to 15.1% of the page against a ~14%
      average scroll — technically reachable, practically not. The remaining
      paragraphs move below the table (see introRest), so no SEO prose is lost
      and the reader still gets oriented before the quiz. */ ''}
${cfg.intro.slice(0, 1).map((p) => `<p style="margin:0 0 14px;color:var(--tx2)">${esc(p)}</p>`).join('\n')}
</section>
${/* The taster sits ABOVE the table. It was below it first, and the viewport
      harness caught that on /lists/ballon-dor-winners/ (70+ rows) it landed
      5,088px past the fold — unreachable on a page whose average scroll is 14%.
      A taster nobody can see is not a fix.

      The trade-off is real: someone searching "Ballon d'Or winners" wants the
      table. So this stays deliberately small — one line and five questions —
      and the full table follows immediately below, still the first <h2>-level
      block of substance. ctaName is not used in the heading: it is phrased for
      "…quizzes about the Bundesliga" and carries its own article, which read as
      "Know your the Bundesliga". */ ''}
${taster.length ? `<section class="sec narrow">
<h2>Think you know this? Five questions</h2>
<p class="sub" style="color:var(--tx3);margin:-6px 0 16px">Tap to answer — no sign-up. The full list is right below.</p>
${renderQA(taster)}
</section>` : ''}
<section class="sec narrow">
${table}
</section>
${cfg.intro.length > 1 ? `<section class="sec narrow">
${cfg.intro.slice(1).map((p) => `<p style="margin:0 0 14px;color:var(--tx2)">${esc(p)}</p>`).join('\n')}
</section>` : ''}
${adSlot('afterQA')}
${appCtaBand(cfg.ctaName || 'football')}
${renderSiblingLists(cfg.slug)}
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
<main id="main">
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
function nationAllRows(match) {
  const re = new RegExp('(' + match.join('|') + ')', 'i');
  return QB.filter(
    (x) => x.type === 'mcq' && Array.isArray(x.o) && (re.test(x.q) || (x.a != null && re.test(x.o[x.a] || ''))),
  );
}

function nationHintRows(match) {
  return nationAllRows(match).filter((x) => x.hint);
}
function buildNationPage(cfg, catPages, nationPages) {
  const poolAll = nationAllRows(cfg.match);
  const hints = nationHintRows(cfg.match);
  if (hints.length < MIN_HINTS) {
    throw new Error(`[gen-seo] nation "${cfg.slug}" has only ${hints.length} hint MCQs (< ${MIN_HINTS}). Refusing a thin page.`);
  }
  // TASTER LENGTH — 10, not 5.
  // The page carried TWO quiz widgets: a 5-question scored taster in the hero
  // and a separate unscored Q&A block below, drawn from disjoint pools. Neither
  // continued into the other, so a visitor who finished the taster was invited
  // to "play the full quiz" — which, from their seat, is the same thing again.
  // Session recordings back this: one visitor spent 2,135 SECONDS and 15 clicks
  // on a club page and never crossed over.
  // A longer single run means more investment before the ask, and one
  // continuous experience instead of two half-ones.
  // One pool — see renderQuizSet().
  const quizRows = arcPick(hints, Math.min(22, hints.length));
  const sample = quizRows;
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
  //
  // ROTATE, don't slice from the front. `slice(0, 8)` always picked the FIRST
  // eight nations, so any nation past index 8 in NATIONS received no internal
  // link from anywhere — /quiz/mexico/, /quiz/uruguay/ and /quiz/usa/ were true
  // ORPHANS: present in sitemap.xml, linked from zero pages. Orphans are close
  // to invisible to crawlers, which is why Argentina and Brazil (early in the
  // array) had 12 incoming links each while those three had none.
  // Starting the window just after the current nation and wrapping means every
  // nation appears in some page's list, and the mesh stays evenly spread as
  // more nations are added.
  const others = nationPages.filter((p) => p.slug !== cfg.slug);
  const start = Math.max(0, nationPages.findIndex((p) => p.slug === cfg.slug));
  const rotated = others.length
    ? Array.from({ length: others.length }, (_, i) => others[(start + i) % others.length])
    : [];
  const related = [
    ...rotated.slice(0, 8),
    ...catPages.filter((p) => p.slug !== HUB.slug).slice(0, 4),
  ];
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true })}
<body>
${NAV}
<main id="main">
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
    chips: [
      { n: hints.length, label: 'questions' },
      // pct100(hints) would be a tautology — `hints` IS the explained rows.
      // Measure the unfiltered pool or the claim means nothing.
      ...(pct100(poolAll) ? [{ n: '100%', label: 'explained' }] : []),
      { n: hints.filter((r) => r.diff === 'hard').length, label: 'hard ones' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: cfg.name, tiers: DEFAULT_TIERS, more: Math.max(0, hints.length - quizRows.length) }))}
${renderCovers(cfg.name, false, true, `${SITE.base}/play`)}
${appCtaBand(cfg.name)}
<section class="sec narrow">
<h2>${esc(cfg.name)} sample questions &amp; answers</h2>
<p class="sub">Tap an answer to check it — instant right/wrong and the story behind it.</p>
${renderQA(sample)}
</section>
${adSlot('afterQA')}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
${renderListLinks(cfg.name)}
</section>
<section class="sec narrow">
${trustSection(cfg.name, poolAll)}
<h2 id="faq">${esc(cfg.name)} quiz — FAQ</h2>
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
<main id="main">
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
<p class="sub">Tap an answer to check it — instant right/wrong and the story behind it.</p>
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
<main id="main">
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
<main id="main">
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
// ── data study (/study/<slug>/) ──────────────────────────────────────────────
// A LINKABLE ASSET, not a quiz page. Our measured ceiling is authority — near
// zero external links — and football desks link to data, not to quizzes.
//
// Every figure is recomputed from QB here at build time and substituted into
// {{tokens}}. Nothing is transcribed. An earlier draft hardcoded the numbers
// and they were falsified within the hour when a club wave landed; for a page
// whose whole purpose is to be fact-checked, that is the one unacceptable
// failure. See the header of scripts/seo/study.mjs.
function buildStudyPage(cfg) {
  const s = studyStats(QB);
  const num = (v) => (typeof v === 'number' ? v.toLocaleString('en-GB') : v);
  const fill = (t) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => num(s[k]));

  const canonical = `${SITE.base}/study/${cfg.slug}/`;
  const max = Math.max(...s.decades.map(([, n]) => n));
  const chart = s.decades.map(([label, n]) => `<tr><th scope="row">${esc(label)}</th><td><span class="bar" style="width:${((n / max) * 100).toFixed(1)}%"></span></td><td class="n">${num(n)}</td></tr>`).join('');

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
      {
        '@type': 'Article',
        headline: cfg.h1,
        description: fill(cfg.description),
        author: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` },
        publisher: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` },
        mainEntityOfPage: canonical,
        isAccessibleForFree: true,
      },
    ],
  });

  const sections = cfg.body.map(([h, paras]) =>
    `<section class="sec narrow"><h2>${esc(h)}</h2>${paras.map((p) => `<p>${esc(fill(p))}</p>`).join('\n')}</section>`).join('\n');

  const style = `<style>
  .sbar{width:100%;border-collapse:collapse;margin:6px 0 4px}
  .sbar th[scope=row]{text-align:left;font-weight:700;color:var(--tx2);font-size:14px;padding:5px 12px 5px 0;white-space:nowrap;width:1%}
  .sbar td{padding:5px 0}
  .sbar .bar{display:block;height:15px;border-radius:3px;background:linear-gradient(90deg,var(--grn),var(--grn-soft))}
  .sbar .n{text-align:right;font-family:var(--mono);font-size:13px;color:var(--tx3);padding-left:12px;width:1%;white-space:nowrap}
  .standfirst{font-size:17px;line-height:1.6;color:var(--tx2)}
  .method{margin-top:22px;padding:14px 16px;background:var(--card);border:1px solid var(--bd);border-left:3px solid var(--grn);border-radius:0 12px 12px 0;font-size:13.5px;line-height:1.6;color:var(--tx3)}
  </style>`;

  const html = `${head({ title: cfg.title, description: fill(cfg.description), canonical, ld })}
<body>
${NAV}
<main id="main">
${style}
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> <span class="sep" aria-hidden="true">›</span> <span>${esc(cfg.h1)}</span></nav>
<h1 style="font-size:clamp(27px,4.6vw,42px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 12px">${esc(cfg.h1)}</h1>
<p class="standfirst">${esc(cfg.standfirst)}</p>
</section>
<section class="sec narrow">
<h2>Questions by the decade they reference</h2>
<table class="sbar">${chart}</table>
<p class="sub" style="color:var(--tx3)">Ball IQ question bank, ${num(s.bank)} questions. A question spanning two decades counts for both.</p>
</section>
${sections}
<section class="sec narrow"><p class="method">${esc(fill(cfg.method))}</p></section>
${appCtaBand('football')}
</main>
${footer()}`;

  const dir = resolve(DIST, 'study', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, canonical };
}

function buildFootlePage(cfg) {
  const canonical = `${SITE.base}/${cfg.slug}/`;
  const playHref = `${SITE.base}/play?game=footle`;
  // Footle is our most-played mode and carried only a BreadcrumbList — the
  // thinnest markup of any page type, on the page most likely to be searched
  // for by name ("football wordle").
  //
  // Not expecting a Google rich result from this: SoftwareApplication results
  // need an aggregateRating or offers to render, and we will not invent a
  // rating we have not earned. The reason to ship it is machine comprehension
  // by AI answer engines, which is a channel we now have EVIDENCE for —
  // chatgpt.com referred a real session on 2026-07-28, the first return on the
  // llms.txt / lists bet. A named Game entity with a genre, a free-to-play
  // flag and a publisher is what those engines read.
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
      {
        '@type': 'Game',
        name: 'Footle',
        alternateName: ['Football Wordle', 'Soccer Wordle'],
        url: canonical,
        description: cfg.description,
        genre: ['Puzzle', 'Word game', 'Sports trivia'],
        gamePlatform: ['Web browser', 'iOS', 'Android'],
        numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
        isAccessibleForFree: true,
        inLanguage: 'en',
        playMode: 'SinglePlayer',
        publisher: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` },
      },
      {
        '@type': 'WebApplication',
        name: 'Footle — the daily football word game',
        url: canonical,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  });
  const howHtml = cfg.how
    .map(([t, d], i) => `<p><strong>${i + 1}. ${esc(t)}.</strong> ${esc(d)}</p>`)
    .join('\n');
  const bodyHtml = cfg.body.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld , taster: true})}
<body>
${NAV}
<main id="main">
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
// ── Clubs Directory (/quiz/clubs/) ────────────────────────────────────────────
// Implements the 2026-07-21 Claude Design handoff ("Clubs Directory.dc.html")
// token-for-token: league rail → filter → popular pills → per-league card
// grids → footer disclaimer. Rosters/codes/colours live in scripts/seo/
// leagues.mjs — forge-verified against the current season (the design's own
// draft was flagged "best guesses"). Clubs with a built quiz (a CLUBS entry)
// render as live links; the rest as muted "coming soon" cards (Alex's call:
// full rosters signal the roadmap). Colours are decorative identification
// only — no crests/kits per the licensing rule.
const cdSlug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
// Directory display name → CLUBS.name where they differ (design short forms).
const DIR_ALIAS = {
  'Coventry': 'Coventry City',
  'Man United': 'Manchester United',
  'Man City': 'Manchester City',
  "Nott'm Forest": 'Nottingham Forest',
  'Tottenham': 'Tottenham Hotspur',
  'Newcastle': 'Newcastle United',
  'Athletic Club': 'Athletic Bilbao',
  'Dortmund': 'Borussia Dortmund',
  'PSG': 'Paris Saint-Germain',
  'Ipswich': 'Ipswich Town',
  // Wave K — the directory carries the short broadcast names, the pages the
  // full club names.
  'Leverkusen': 'Bayer Leverkusen',
  'Lyon': 'Olympique Lyonnais',
  'Monaco': 'AS Monaco',
};
// Built clubs whose league isn't among the directory's leagues yet (lower
// tiers / countries pending). Rendered in a final "More clubs" section so no
// live quiz is unreachable. code+colour hand-set (decorative).
const MORE_META = {
  'red-star-belgrade': { code: 'RSB', color: '#d0021b', name: 'Red Star Belgrade' },
  'basel': { code: 'BSL', color: '#d0021b', name: 'Basel' },
  'schalke-04': { code: 'S04', color: '#2e7dd1', name: 'Schalke 04' },
  'saint-etienne': { code: 'STE', color: '#18a05a', name: 'Saint-Étienne' },
};
// League → existing league-quiz page slug (only rendered when that page is live).
const LEAGUE_PAGE_SLUGS = {
  'Premier League': 'premier-league', 'La Liga': 'la-liga', 'Serie A': 'serie-a',
  'Bundesliga': 'bundesliga', 'Ligue 1': 'ligue-1', 'Süper Lig': 'super-lig',
  'Primeira Liga': 'primeira-liga',
};
const DIR_POPULAR = ['Arsenal', 'Liverpool', 'Man United', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'Man City', 'Chelsea', 'Juventus', 'PSG', 'Inter Milan', 'AC Milan'];

function buildClubsDirectoryPage(catPages) {
  const canonical = `${SITE.base}/quiz/clubs/`;
  const clubByName = new Map(CLUBS.map((c) => [c.name, c]));
  const resolve0 = (name) => clubByName.get(DIR_ALIAS[name] || name) || null;

  // Guards — fail the build loud rather than ship a wrong directory.
  const matched = new Set();
  for (const L of LEAGUES) {
    const codes = new Set();
    for (const c of L.clubs) {
      if (codes.has(c.code)) throw new Error(`[clubs-directory] duplicate code ${c.code} in ${L.league}`);
      codes.add(c.code);
      const hit = resolve0(c.name);
      if (hit) matched.add(hit.slug);
    }
  }
  const orphans = CLUBS.filter((c) => !matched.has(c.slug) && !MORE_META[c.slug]);
  if (orphans.length) throw new Error(`[clubs-directory] built clubs unreachable (add DIR_ALIAS or MORE_META): ${orphans.map((c) => c.slug).join(', ')}`);
  const moreClubs = CLUBS.filter((c) => !matched.has(c.slug) && MORE_META[c.slug]);

  const total = LEAGUES.reduce((n, L) => n + L.clubs.length, 0);
  const totalLabel = `${Math.floor(total / 10) * 10}+`;
  const builtCount = matched.size + moreClubs.length;

  const card = (c) => {
    const hit = resolve0(c.name);
    const inner = `<span class="cd-dot" style="background:${esc(c.color)}"></span><span class="cd-code">${esc(c.code)}</span><span class="cd-name">${esc(c.name)}</span>`;
    const search = `${c.name} ${c.code}`.toLowerCase();
    return hit
      ? `<a class="cd-card" href="${SITE.base}/quiz/${hit.slug}/" data-s="${esc(search)}">${inner}</a>`
      : `<span class="cd-card cd-soon" title="Quiz coming soon" aria-disabled="true" data-s="${esc(search)}">${inner}</span>`;
  };

  const section = (L) => {
    const id = `lg-${cdSlug(L.league)}`;
    const lpSlug = LEAGUE_PAGE_SLUGS[L.league];
    const lpLive = lpSlug && catPages.some((p) => p.slug === lpSlug);
    const link = lpLive ? `<a class="cd-lp" href="${SITE.base}/quiz/${lpSlug}/">League page →</a>` : '';
    return `<section class="cd-sec" id="${id}" data-lg="${esc(L.league.toLowerCase())} ${esc(L.country.toLowerCase())}">
<div class="cd-lh"><h2 class="cd-lt"><span class="cd-flag">${L.flag}</span>${esc(L.league)}<span class="cd-cnt">${L.clubs.length} CLUBS</span></h2>${link}</div>
<div class="cd-grid">
${L.clubs.map(card).join('\n')}
</div>
</section>`;
  };

  // Sidebar rail — countries in order, England's two leagues grouped.
  const railGroups = [];
  for (const L of LEAGUES) {
    const last = railGroups[railGroups.length - 1];
    if (last && last.country === L.country) last.leagues.push(L);
    else railGroups.push({ country: L.country, flag: L.flag, leagues: [L] });
  }
  const rail = railGroups.map((g) => `<div class="cd-rg">
<div class="cd-rc">${g.flag} ${esc(g.country)}</div>
${g.leagues.map((L) => `<a class="cd-rl" href="#lg-${cdSlug(L.league)}"><span>${esc(L.league)}</span><span class="cd-rn">${L.clubs.length}</span></a>`).join('\n')}
</div>`).join('\n');

  const pills = DIR_POPULAR.map((name) => {
    const hit = resolve0(name);
    if (!hit) throw new Error(`[clubs-directory] popular pill has no built quiz: ${name}`);
    let color = '#58cc02';
    for (const L of LEAGUES) { const m = L.clubs.find((c) => c.name === name); if (m) { color = m.color; break; } }
    return `<a class="cd-pill" href="${SITE.base}/quiz/${hit.slug}/"><span class="cd-dot" style="width:7px;height:7px;background:${esc(color)}"></span><span>${esc(name)}</span></a>`;
  }).join('\n');

  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
        { '@type': 'ListItem', position: 2, name: 'Quizzes', item: `${SITE.base}/quiz/` },
        { '@type': 'ListItem', position: 3, name: 'Clubs', item: canonical },
      ] },
      { '@type': 'ItemList', name: 'Football club quizzes by league', numberOfItems: LEAGUES.length,
        itemListElement: LEAGUES.map((L, i) => ({ '@type': 'ListItem', position: i + 1, name: `${L.league} club quizzes`, url: `${canonical}#lg-${cdSlug(L.league)}` })) },
    ],
  });

  // Design tokens verbatim from the handoff (computed-style extraction):
  // card #1A1D27 / border #2A2D3A / text #F0F1F5 / muted #9BA0B8 / deep-muted
  // #6E7180 / radius 12 / dot 8 / code JetBrains Mono 700 10px +.04em.
  // NOTE: deep-muted ships as --tx4 #7E828C, not the handoff's #6E7180 — the
  // latter is 4.09:1 on this canvas and fails WCAG AA. Same lift the app made.
  const style = `<style>
  .cd-h1{font-size:28px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:10px 0 4px}
  .cd-sub{font-size:14px;font-weight:500;color:#9ba0b8;margin:0 0 22px}
  .cd-wrap{display:grid;grid-template-columns:212px 1fr;gap:26px;align-items:start}
  .cd-rail{position:sticky;top:76px}
  .cd-rail-t{font:700 11px Inter,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--tx4);margin:0 0 10px}
  .cd-rg{margin:0 0 14px}
  .cd-rc{font:700 11px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#9ba0b8;margin:0 0 6px}
  .cd-rl{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;color:#f0f1f5;font-size:13px;font-weight:600;text-decoration:none}
  .cd-rl:hover{color:var(--grn);text-decoration:none}
  .cd-rn{color:var(--tx4);font:500 11px 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
  .cd-note{font-size:11px;color:#3c3f4c;margin:6px 0 0;line-height:1.5}
  .cd-search{display:flex;align-items:center;gap:10px;padding:13px 16px;background:#12141b;border:1px solid #2a2d3a;border-radius:14px;margin:0 0 16px}
  .cd-search svg{flex:0 0 auto;color:var(--tx4)}
  .cd-search input{flex:1;min-width:0;background:transparent;border:none;outline:none;font:500 14px Inter,sans-serif;color:#fff}
  .cd-search input::placeholder{color:var(--tx4)}
  .cd-pop{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 22px}
  .cd-pop-t{font:700 11px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#9ba0b8;margin-right:2px}
  .cd-pill{display:flex;align-items:center;gap:6px;padding:7px 11px;background:#1a1d27;border:1px solid #2a2d3a;border-radius:999px;text-decoration:none;font:600 12px Inter,sans-serif;color:#f0f1f5;white-space:nowrap}
  .cd-pill:hover{border-color:#3a3f52;text-decoration:none}
  .cd-sec{margin:0 0 26px}
  .cd-lh{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 10px}
  .cd-lt{display:flex;align-items:baseline;gap:8px;font-size:16px;font-weight:800;letter-spacing:-.01em;color:#fff;margin:0}
  .cd-flag{font-size:15px}
  .cd-cnt{font:500 11px 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--tx4);margin-left:2px}
  .cd-lp{font:700 12px Inter,sans-serif;color:var(--grn);white-space:nowrap;text-decoration:none}
  .cd-lp:hover{text-decoration:underline}
  .cd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px}
  .cd-card{display:flex;align-items:center;min-width:0;gap:8px;padding:10px 11px;background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;text-decoration:none}
  a.cd-card:hover{border-color:#3a3f52;text-decoration:none}
  .cd-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex:0 0 auto}
  .cd-code{font:700 10px 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;color:#9ba0b8;letter-spacing:.04em;flex:0 0 auto}
  .cd-name{flex:1;min-width:0;font:600 12.5px Inter,sans-serif;color:#f0f1f5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cd-soon{opacity:.42;cursor:default}
  #cd-none{color:#9ba0b8;font-size:14px;padding:8px 0 18px;display:none}
  @media(max-width:960px){.cd-wrap{display:block}.cd-rail{display:none}}
  </style>`;

  const searchIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;

  const filterJs = `<script>(function(){
var q=document.getElementById('cdq');if(!q)return;
var cards=[].slice.call(document.querySelectorAll('.cd-card'));
var secs=[].slice.call(document.querySelectorAll('.cd-sec'));
var none=document.getElementById('cd-none');
q.addEventListener('input',function(){
  var v=q.value.trim().toLowerCase(),shown=0;
  secs.forEach(function(s){
    var lg=(s.getAttribute('data-lg')||'').indexOf(v)>-1;
    var vis=0;
    [].slice.call(s.querySelectorAll('.cd-card')).forEach(function(c){
      var hit=!v||lg||(c.getAttribute('data-s')||'').indexOf(v)>-1;
      c.style.display=hit?'':'none';if(hit)vis++;
    });
    s.style.display=vis?'':'none';shown+=vis;
  });
  none.style.display=(v&&!shown)?'block':'none';
});
})();</script>`;

  const html = `${head({
    title: `Club Quizzes by League — ${totalLabel} Football Clubs | Ball IQ`,
    // Was 192 chars and truncated. "every answer explained" STAYS — unlike the
    // league pages, all 72 club packs measure 100% hint coverage (the generator's
    // own MIN_HINTS gate enforces it), so here the strong claim is true.
    description: `Free football club quizzes by league — ${builtCount} clubs live, from the Premier League to the Brasileirão, every answer explained. New clubs added weekly.`,
    canonical, ld, ads: true,
  })}
<body>
${navHtml('clubs')}
<main id="main">
${style}
<section class="sec">
${crumbs([{ name: 'Home', url: `${SITE.base}/` }, { name: 'Quizzes', url: `${SITE.base}/quiz/` }, { name: 'Clubs' }])}
<h1 class="cd-h1">Club quizzes</h1>
<p class="cd-sub">${totalLabel} clubs across ${LEAGUES.length} leagues — every quiz free, every answer explained.</p>
<div class="cd-wrap">
<aside class="cd-rail">
<div class="cd-rail-t">Leagues</div>
${rail}
<p class="cd-note">Coming soon: Segunda, 2. Bundesliga, Serie B, Ligue 2…</p>
</aside>
<div class="cd-main">
<div class="cd-search">${searchIcon}<input id="cdq" type="search" placeholder="Type to filter ${totalLabel} clubs — name, code or league…" aria-label="Filter clubs" autocomplete="off" /></div>
<div class="cd-pop"><span class="cd-pop-t">🔥 Popular</span>
${pills}
</div>
<p id="cd-none">No clubs match that — try a club name, its 3-letter code, or a league.</p>
${LEAGUES.map(section).join('\n')}
${moreClubs.length ? `<section class="cd-sec" id="lg-more" data-lg="more clubs">
<div class="cd-lh"><h2 class="cd-lt"><span class="cd-flag">⚽</span>More clubs<span class="cd-cnt">${moreClubs.length} CLUBS</span></h2></div>
<div class="cd-grid">
${moreClubs.map((c) => { const m = MORE_META[c.slug]; return `<a class="cd-card" href="${SITE.base}/quiz/${c.slug}/" data-s="${esc(`${m.name} ${m.code}`.toLowerCase())}"><span class="cd-dot" style="background:${m.color}"></span><span class="cd-code">${m.code}</span><span class="cd-name">${esc(m.name)}</span></a>`; }).join('\n')}
</div>
</section>` : ''}
</div>
</div>
</section>
${filterJs}
</main>
${footer()}`;

  const dir = resolve(DIST, 'quiz', 'clubs');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  console.log(`  ✓ /quiz/clubs/ — ${total} clubs, ${LEAGUES.length} leagues (${builtCount} live, ${total + moreClubs.length - builtCount} coming soon)`);
  return { total, leagues: LEAGUES.length };
}

function buildSitemap(livePages, listPages = [], esPages = []) {
  // Build date as <lastmod> — Google honors lastmod but ignores changefreq/
  // priority, so without it the sitemap gives the crawler no freshness signal.
  // Pages are regenerated every deploy, so the build date is an honest hint.
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE.base}/`, freq: 'daily', pri: '1.0' },
    { loc: `${SITE.base}/quiz/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/quiz/clubs/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/football-wordle/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/football-wordle/answer/`, freq: 'daily', pri: '0.7' },
    ...livePages
      .filter((p) => p.slug !== HUB.slug)
      .map((p) => ({ loc: `${SITE.base}/quiz/${p.slug}/`, freq: 'weekly', pri: '0.7' })),
    // Spanish pilot pages. Listed so Google discovers them without waiting to
    // follow the hreflang from the English twin — a new URL on a low-authority
    // site can sit undiscovered for weeks otherwise, and the whole point of a
    // pilot is to get an answer quickly.
    ...esPages.map((p) => ({ loc: `${SITE.base}/${p.lang}/quiz/${p.slug}/`, freq: 'weekly', pri: '0.7' })),
    ...(listPages.length ? [{ loc: `${SITE.base}/lists/`, freq: 'weekly', pri: '0.7' }] : []),
    ...listPages.map((p) => ({ loc: `${SITE.base}/lists/${p.slug}/`, freq: 'monthly', pri: '0.6' })),
    { loc: `${SITE.base}/study/${STUDY.slug}/`, freq: 'monthly', pri: '0.6' },
    { loc: `${SITE.base}/study/${STUDY.slug}/`, freq: 'monthly', pri: '0.6' },
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

> Ball IQ is a free football (soccer) trivia game with thousands of fact-checked questions across 10 game modes, plus fact-checked football reference lists. Play free in any browser at ${SITE.base}, or download the free app on iPhone and Android.

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
- [Ball IQ on Google Play](https://play.google.com/store/apps/details?id=app.balliq): Free Android app.
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
  const builtClubs = CLUBS.map((c) => buildClubPage(c, clubPages, livePages, playerPages, nationPages));
  // Siblings = every OTHER language this slug exists in, so each localised page
  // links the whole cluster rather than just itself and English.
  const builtEs = CLUBS_INTL.map((c) =>
    buildClubPageIntl(c, CLUBS_INTL.filter((s) => s.slug === c.slug)));
  const builtPlayers = PLAYERS.map((p) => buildPlayerPage(p, clubPages, livePages));
  const builtNations = NATIONS.map((n) => buildNationPage(n, livePages, nationPages));
  const listTasterIds = new Set();
  const builtLists = LISTS.map((l) => buildListPage(l, clubPages, playerPages, livePages, listTasterIds));
  buildListsHubPage(LISTS, clubPages, livePages);
  buildClubsDirectoryPage(livePages);
  buildHubPage(livePages, clubPages, playerPages);
  buildFootlePage(FOOTLE_PAGE);
  buildStudyPage(STUDY);
  buildSimplePage(ABOUT);
  buildSimplePage(CONTACT);
  const sitemapUrls = buildSitemap([...livePages, ...clubPages, ...playerPages, ...nationPages], listPages, builtEs);
  buildLlmsTxt(livePages, clubPages, playerPages, listPages);
  await pingIndexNow(sitemapUrls);

  console.log(`[gen-seo] wrote ${built.length} category + ${builtListicles.length} listicle + ${builtClubs.length} club pages + hub + about + contact + sitemap + llms.txt into dist/`);
  for (const b of built) console.log(`  ✓ /quiz/${b.slug}/  (${b.count} Qs in bank)`);
  for (const b of builtListicles) console.log(`  ✓ /quiz/${b.slug}/  (${b.count} featured Qs)`);
  for (const b of builtClubs) console.log(`  ✓ /quiz/${b.slug}/  (club, ${b.count} Qs in bank)`);
  for (const b of builtEs) console.log(`  ✓ /${b.lang}/quiz/${b.slug}/  (${b.lang}, ${b.count} translated Qs)`);
  for (const b of builtPlayers) console.log(`  ✓ /quiz/${b.slug}/  (player, ${b.count} Qs in bank)`);
  for (const b of builtNations) console.log(`  ✓ /quiz/${b.slug}/  (nation, ${b.count} Qs in bank)`);
  for (const b of builtLists) console.log(`  ✓ /lists/${b.slug}/  (reference list, ${b.count} rows)`);
  console.log(`  ✓ /quiz/  (hub)`);
  console.log(`  ✓ /football-wordle/  (Footle landing)`);
  console.log(`  ✓ /about/  ✓ /contact/`);
  console.log(`  ✓ /sitemap.xml  ✓ /llms.txt`);
}

await main();
