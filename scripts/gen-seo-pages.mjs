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

import { readFileSync, writeFileSync as fsWriteFileSync, mkdirSync, existsSync } from 'node:fs';

// ── strip CSS comments from the OUTPUT, keep every one of them in the SOURCE ──
//
// The inline <style> block is a raw template literal, so unlike the app's CSS
// (which vite minifies) it shipped verbatim — comments included. Measured on the
// live /quiz/arsenal/: 37 comment blocks, 8,812 bytes, **5.1% of the page**, and
// ~2.57 MB across 306 pages. It sits in <head>, so it is on the critical
// rendering path of every SEO page.
//
// ⚠️ STRIP AT WRITE TIME, NEVER IN THE SOURCE. Those comments are the "why"
// this repo runs on — "Flat per the 2026-07-21 Clubs Directory handoff — Alex:
// no 3D look", "a container-width probe is NOT valid here", the measured pixel
// heights behind the compact tiles. Deleting them from the source to save bytes
// would trade the expensive knowledge for the cheap win. The reader of the
// source keeps all of it; the browser is sent none of it.
//
// Only touches <style> blocks — <script> comments are left alone, since JS
// comments can carry meaning inside string literals and are not worth the risk
// for the bytes involved.
//
// Verified safe: no `content:"…/*…"` and no `url(…/*…)` anywhere in this file,
// which are the two ways a `/*` can appear in CSS WITHOUT opening a comment.
// Re-check that if either is ever added.
function stripCssComments(html) {
  return html.replace(
    /<style([^>]*)>([\s\S]*?)<\/style>/g,
    (_, attrs, css) => `<style${attrs}>${css.replace(/\/\*[\s\S]*?\*\//g, '')}</style>`,
  );
}

// Wraps every write in this generator — 23 page builders and counting — so a new
// page type cannot reintroduce the bloat by forgetting to opt in.
function writeFileSync(path, data, enc) {
  if (typeof data === 'string' && data.includes('<style')) data = stripCssComments(data);
  return fsWriteFileSync(path, data, enc);
}
import { NAV_GROUPS } from '../src/lib/nav.js';
import { XI_MARKUP, XI_CSS, XI_JS } from './seo/xiGame.mjs';
import { trailBoardHtml, TRAIL_BOARD_CSS, TRAIL_BOARD_JS } from './seo/trailBoard.mjs';
import { QUOTES } from './seo/quotes.mjs';
import { NICKNAMES, NICK_REGIONS } from './seo/nicknames.mjs';
import { pageNameFor } from './seo/club-alias.mjs';
import { mysteryBoardHtml, MYSTERY_BOARD_CSS, MYSTERY_BOARD_JS } from './seo/mysteryBoard.mjs';
import { gradeGuess } from '../src/marketing/footlePractice.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { QB } from '../src/questions.js';
// The web palette. Shared with the marketing homepage (via design/tokens.css)
// so the two surfaces cannot drift apart the way they already had -- the
// homepage was still painting #1A1D27, a colour app.css:57 records the product
// moving off. rootCss() emits the same bytes this file used to hardcode.
import { rootCss } from '../src/design/tokens.js';
import { shellHeader, shellFooter, SHELL_CSS } from './seo/shell.mjs';
import { SITE, HUB, CATEGORIES, LISTICLES, ABOUT, CONTACT, TERMS, FOOTLE_PAGE, MYSTERY_PAGE, TRAIL_PAGE, DAILY7_PAGE } from './seo/content.mjs';
import { recentFootleAnswers } from './seo/footle-answer-page.mjs';
import { recentDailyDays } from './seo/daily-answers-page.mjs';
import { CLUBS } from './seo/clubs.mjs';
import { CURATED_FACTS as FUN_FACTS } from './seo/funFactsCurated.js';
import { tiersFor, DEFAULT_TIERS } from './seo/clubTiers.mjs';
import { CLUBS_ES } from './seo/clubs-es.mjs';
import { CLUBS_PT } from './seo/clubs-pt.mjs';
import { CLUBS_TR } from './seo/clubs-tr.mjs';
import { CLUBS_ID } from './seo/clubs-id.mjs';
import { CLUBS_IT } from './seo/clubs-it.mjs';
import { CLUBS_DE } from './seo/clubs-de.mjs';
import { CLUBS_FR } from './seo/clubs-fr.mjs';
import { CLUBS_NL } from './seo/clubs-nl.mjs';
import { HUBS_INTL, TASTER_I18N, LANG_LABEL } from './seo/hubs-intl.mjs';
// One list, so another language is a file plus a spread rather than a rewrite.
// Two shapes live in here side by side and both are intentional:
//   - a DOMESTIC club in its own country's language (Boca/es, Flamengo/pt,
//     Galatasaray/tr)
//   - a GLOBAL club in the language of a large foreign fanbase (Manchester
//     United/id, and more to come) — the multi-language cluster, which holds
//     the club constant so differences between pages are attributable to the
//     MARKET rather than the badge.
const CLUBS_INTL = [...CLUBS_ES, ...CLUBS_PT, ...CLUBS_TR, ...CLUBS_ID, ...CLUBS_IT, ...CLUBS_DE, ...CLUBS_FR, ...CLUBS_NL];
import { PLAYERS } from './seo/players.mjs';
import { LISTS } from './seo/lists.mjs';
import { STUDY, studyStats } from './seo/study.mjs';
import { NATIONS } from './seo/nations.mjs';
import { LEAGUES } from './seo/leagues.mjs';
// Transfer Trail data for the playable practice board on /transfer-trail/.
// Same rule as the Footle board: import the GAME's own module so the practice
// puzzle cannot drift from the live one, and emit exactly ONE PAST trail.
import {
  TRAIL_PLAYERS,
  TRAIL_ANSWER_LOG,
  TRAIL_ANCHOR_DAY,
  getTrailDayIndex,
  getTrailAnswerForDayIndex,
  acceptedNamesFor,
} from '../src/lib/trail.js';
// Footle answer schedule + the real grading function, for the playable practice
// board on /football-wordle/. Importing the GAME's own module is deliberate:
// the grader is inlined from `gradeWordleGuess.toString()` rather than rewritten,
// so the practice board cannot drift from the live game's duplicate-letter rules.
// ⚠️ This pulls WORDLE_PLAYERS / WORDLE_ANSWER_LOG into the GENERATOR's memory.
// Exactly one past answer may ever reach the emitted HTML — see pickPracticePuzzle().
import {
  getWordleDayIndex,
  getWordleAnswerForDayIndex,
  gradeWordleGuess,
  WORDLE_ANCHOR_DAY,
  WORDLE_ANSWER_LOG,
  WORDLE_FULL_NAMES,
} from '../src/lib/wordle.js';

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

const PAGE_BG = '#0B0C10';
const PAGE_FG = '#F0F1F5';

// ── brand badges ──────────────────────────────────────────────────────────────
// Mirrors the homepage mesh (MarketingHome QUIZ_CLUBS / QUIZ_LEAGUES) so the
// landing pages read as one system with balliq.app/.
const CLUB_BADGE = {
  'leicester-city': 'LEI',
  'olympiacos': 'OLY',
  'panathinaikos': 'PAO',
  'derby-county': 'DER', 'swansea-city': 'SWA',
  'cardiff-city': 'CAR', 'stoke-city': 'STK',
  wrexham: 'WRX', 'norwich-city': 'NOR', middlesbrough: 'MID', 'west-brom': 'WBA', 'sheffield-united': 'SHU', 'blackburn-rovers': 'BLA',
  'birmingham-city': 'BIR', 'sheffield-wednesday': 'SHW',
  portsmouth: 'POR',
  southampton: 'SOU',
  'rb-leipzig': 'RBL', 'atalanta': 'ATA',
  'hajduk-split': 'HAJ',
  'boca-juniors': 'BOC', 'river-plate': 'RIV', 'flamengo': 'FLA', 'palmeiras': 'PAL', 'corinthians': 'COR',
  'santos': 'SAN', 'real-sociedad': 'RSO',
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
  'leicester-city': '#003090',
  'olympiacos': '#DA020E',
  'panathinaikos': '#00614E',
  'derby-county': '#FFFFFF', 'swansea-city': '#FFFFFF',
  'cardiff-city': '#0070B5', 'stoke-city': '#E03A3E',
  wrexham: '#DC241F', 'norwich-city': '#FFF200', middlesbrough: '#DC143C', 'west-brom': '#122F67', 'sheffield-united': '#EE2737', 'blackburn-rovers': '#009EE0',
  'birmingham-city': '#1B4AA0', 'sheffield-wednesday': '#0066B3',
  portsmouth: '#001489',
  southampton: '#D71920',
  'rb-leipzig': '#DD0741', 'atalanta': '#1D71B8',
  'hajduk-split': '#0E4C92',
  'boca-juniors': '#0A2B72', 'river-plate': '#E1122E', 'flamengo': '#C52613', 'palmeiras': '#006437', 'corinthians': '#111111',
  'santos': '#0B0B0B', 'real-sociedad': '#0067B1',
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
// Point every App Store link at the visitor's OWN storefront.
//
// ⚠️ WHY THIS EXISTS. Apple shows each country its own ratings, and measured
// 2026-08-23 we hold 5.0 from 3 in GB, 5.0 from 2 in NO, 5.0 from 1 in FR —
// and ZERO in the US. Every static page shipped a hardcoded /us/ link, so the
// British and Norwegian readers most likely to install were handed the one
// shelf that says "hasn't received enough ratings or reviews to display a
// summary". These ~180 pages have no JS at render time, so the href itself
// stays the country-less form (verified to 301 cleanly, so no-JS readers are
// never worse off than before) and this upgrades it in place when JS runs.
//
// Mirrors appStoreUrl() in src/lib/links.js — an inline script cannot import,
// the same constraint api/get.js has. Keep the storefront list in step.
function storefrontScript() {
  return `<script>(function(){try{
var S=['us','gb','no','de','es','fr','it','br','tr','id','nl','se','dk','fi','ie','pt','pl','ca','au','mx','ar','in','za','be','at','ch','cz','gr','hu','ro','sa','ae'];
var r=((new Intl.Locale(navigator.language).region)||'').toLowerCase();
if(S.indexOf(r)<0)return;
var a=document.querySelectorAll('a[href*="apps.apple.com"]');
for(var i=0;i<a.length;i++){a[i].href=a[i].href.replace(/^https:\\/\\/apps\\.apple\\.com\\/(?:[a-z]{2}\\/)?app\\//,'https://apps.apple.com/'+r+'/app/');}
}catch(e){}})();</script>`;
}

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
// ⚠️ MOBILE HAD NO NAVIGATION AT ALL until 2026-08-12. The rule
// `@media(max-width:560px){ .nav-link{display:none} }` hid every section link
// on 66% of our traffic, with no hamburger replacing them: a phone visitor
// landing on a club page could reach nothing but /play and the App Store.
const navGroupHtml = (g, active) => `<div class="nav-grp">
<button type="button" class="nav-top${active === g.key ? ' active' : ''}" aria-expanded="false" aria-controls="nd-${g.key}">${g.label}<svg class="nav-caret" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg></button>
<div class="nav-drop" id="nd-${g.key}">${g.items.map(([label, href]) => `<a href="${SITE.base}${href}">${label}</a>`).join('')}</div>
</div>`;

// Toggle + outside-click + Escape. Deliberately tiny and inline: these are
// static pages with no bundle, and navigation must work on the first paint.
const NAV_JS = `(function(){var h=document.querySelector('.nav');if(!h)return;
var b=h.querySelector('.nav-burger');
b&&b.addEventListener('click',function(){var o=h.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});
h.querySelectorAll('.nav-top').forEach(function(t){t.addEventListener('click',function(e){
  e.preventDefault();var g=t.parentNode,o=g.classList.contains('open');
  h.querySelectorAll('.nav-grp.open').forEach(function(x){x.classList.remove('open');x.querySelector('.nav-top').setAttribute('aria-expanded','false');});
  if(!o){g.classList.add('open');t.setAttribute('aria-expanded','true');}});});
document.addEventListener('click',function(e){if(!h.contains(e.target)){h.classList.remove('open');
  h.querySelectorAll('.nav-grp.open').forEach(function(x){x.classList.remove('open');x.querySelector('.nav-top').setAttribute('aria-expanded','false');});
  b&&b.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){h.classList.remove('open');
  h.querySelectorAll('.nav-grp.open').forEach(function(x){x.classList.remove('open');x.querySelector('.nav-top').setAttribute('aria-expanded','false');});}});
})();`;

// ONE SHELL (2026-09-03). The header is scripts/seo/shell.mjs — the same
// one-row header the front door renders in React: wordmark, section links, the
// club/league finder, Sign in. No marketing button, no dropdown groups. The
// older markup above (navGroupHtml, NAV_JS) is kept only for reference.
const navHtml = (active = '') => shellHeader(SITE, active);
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
function heroInner({ crumbItems, badge, kind, name, h1, lead, statLine, chips, playHref, playLabel, mini, noStores }) {
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
  // ⚠️ THE STORE BADGES USED TO RIDE INSIDE THIS CONDITION AND VANISH WITH IT.
  // ctaRow only renders when playHref is a REAL href — on every club and quiz
  // page it is the in-page anchor '#taster', so the entire row was skipped and
  // the App Store / Play links survived only in the orange band at the very
  // bottom of a ~14-screen page. Alex: "i would love to see the links to our
  // app store and play store at the top of the pages somewhere instead of all
  // the way at the bottom in the orange square."
  // The badges now render above the fold on EVERY page type; the green button
  // keeps its original condition.
  // noStores: the 404 page — the critique found two store badges ABOVE the
  // way home there. Recovery first; the footer still carries the app.
  const badgeRow = noStores ? '' : mini ? storeBadgesMini() : storeBadges();
  const ctaRow = (playHref && !playHref.startsWith('#'))
    ? `<div class="cta-row">
<a class="btn-green" href="${playHref}"${playHref.startsWith('#') ? ' data-scrollto="1"' : ''}>${esc(playLabel || `Play the ${name} quiz`)} ↓</a>
${badgeRow}
</div>`
    : badgeRow ? `<div class="cta-row cta-row--stores">${badgeRow}</div>` : '';
  // Chips beat a sentence: a searcher scans them, and every value is computed
  // from the bank at build time so none of it can drift or overstate. This is
  // the honest version of the "75 verified questions" badge competitors assert.
  // Stat strip, not chips: mono numerals in a ruled row, the way a programme or
  // a scoreboard sets figures. Every value is computed from the bank. "Free" is
  // deliberately NOT in the row — it is not a number, and mixing it in broke the
  // one rule the row is built on (and made a fourth cell wrap to its own line).
  const stat = Array.isArray(chips) && chips.length
    ? `<div class="hero-facts">${chips.map((c) => `<div class="hf"><b>${esc(String(c.n))}</b><span>${esc(c.label)}</span></div>`).join('')}</div>
<p class="hero-free">Free to play &middot; no sign-up &middot; plays in your browser</p>`
    : statLine ? `<p class="hero-stat">${esc(statLine)}</p>` : '';
  // Split into head (what page am I on) and body (the pitch). The wrappers are
  // inert on desktop and in the single-column hero — no padding or border, so
  // the h1's bottom margin still collapses exactly as it did unwrapped. They
  // exist so the two-column hero can order them INDEPENDENTLY on a phone: see
  // the display:contents rule under .hero-grid.
  return `<div class="hero-head">${crumbs(crumbItems)}
<div class="kicker">${chip}<span class="eyebrow">${esc(kind)}</span></div>
<h1>${esc(h1)}</h1></div>
<div class="hero-body"><p class="hero-lead">${esc(lead)}</p>
${ctaRow}
${stat}</div>`;
}

// Single-column hero (Footle landing, listicles).
function heroSection(props) {
  return `<section class="hero">
<div class="hero-in">
${heroInner(props)}
</div>
</section>`;
}

// Two-column quiz hero: intro/CTA on the left, playable taster (rightHtml) on
// the right (Claude Design "Quiz Landing" handoff). Stacks on narrow screens.
function heroTwoCol(props, rightHtml) {
  return `<section class="hero">
<div class="hero-grid">
<div class="hero-left">${heroInner({ ...props, mini: true })}</div>
<div class="hero-right">${rightHtml}</div>
</div>
</section>`;
}

// The app band: one module, after value, on every generated page.
// History, because each version was measured: it began as store badges alone
// (a /lists reader with 40 seconds invested was asked to install something);
// then gained a green "Play free in your browser" whose bare /play served the
// Messi warm-up to an Arsenal searcher (the CTA-parity bug, fixed 2026-09-02
// with a per-club playHref). On 2026-09-05 the critique measured the result —
// six store badges on a club page, and a "play in your browser" button on a
// page the reader was already playing in — and Alex decided to retire the web
// /play game routes altogether. So the button is gone: this page IS the quiz,
// and the band's only job is to say what the app adds, once, quietly. `name`
// rides along as data for the store-out instrument (shell.mjs), so a click can
// be read per band.
function appCtaBand(name) {
  return `<section class="sec" data-band="${esc(name)}"><div class="appband">
<div class="appband-in">
<h2>Also on your phone.</h2>
<p>Streaks, reminders and live 1v1 against a mate — every quiz here, in the app. Free, like here.</p>
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
// ⚠️ THE SWITCH LIVES IN TWO PLACES BECAUSE THE ADS DO. index.html gates the
// SPA shell; this gates the ~288 generated pages, which inject the CMP from
// their own block. Turning it off in index.html alone left every club page
// still loading Funding Choices — caught by re-running Lighthouse after the
// "fix" and seeing Best Practices still at 77 while the homepage hit 100.
// Keep the two in step: both must be true for ads to run.
const ADS_ACTIVE = false;

function adSlot(key, label) {
  const id = AD_SLOTS[key];
  if (!id) return '';
  return `<aside class="ad-slot" aria-label="${esc(label || 'Advertisement')}">
<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" data-ad-slot="${id}" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</aside>`;
}

// Responsive related-quiz tile grid. Every tile links to a LIVE /quiz/<slug>/.
// ⚠️ THE MESH IS 116 TILES AND A PHONE SEES ABOUT NINE OF THEM.
// Measured on /quiz/liverpool/ at 390×664: the tile grid is 3 columns, so 116
// tiles is 39 rows — 2,028px, and the whole "More quizzes" section ran 1521 →
// 5382, i.e. 49% of the entire page. Scroll on these pages dies around 25%
// (y≈1985), so ~107 of those tiles were never seen by a human while pushing
// the club's OWN content — what the quiz covers, how it's checked, the FAQ —
// thousands of pixels further down.
//
// The tail is collapsed, NOT cut. Every link stays in the DOM inside the
// <details>, so crawlers still walk the full mesh (they render the whole
// document; that is the same reasoning the ordering comment above relies on).
// This deliberately does NOT reorder the section: the mesh sits high on
// purpose, because it is the internal-link engine and it has to land above the
// scroll cliff. The defect was its SIZE, not its position.
function renderTiles(pages, { collapseAfter = 24 } = {}) {
  const tile = (p) => {
    const href = `${SITE.base}/quiz/${p.slug === HUB.slug ? '' : p.slug + '/'}`;
    const b = badgeFor(p.slug, p.name);
    const chip = b.emoji
      ? `<span class="tbadge emoji">${b.text}</span>`
      : `<span class="tbadge" style="${clubBadgeStyle(p.slug)}">${esc(b.text)}</span>`;
    return `<a class="tile" href="${href}">${chip}<span class="tname">${esc(p.name)}</span></a>`;
  };

  if (pages.length <= collapseAfter + 6) {
    // Not worth a disclosure control for a handful of extra rows.
    return `<div class="tiles">\n${pages.map(tile).join('\n')}\n</div>`;
  }
  const head = pages.slice(0, collapseAfter);
  const tail = pages.slice(collapseAfter);
  return `<div class="tiles">\n${head.map(tile).join('\n')}\n</div>
<details class="tiles-more">
<summary>Show all ${pages.length} quizzes<span class="ind" aria-hidden="true">+</span></summary>
<div class="tiles">\n${tail.map(tile).join('\n')}\n</div>
</details>`;
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
  return `<ol class="qa-list">\n${items}\n</ol>\n<script>${QA_TRACK_JS}</script>\n<script>${QA_JS}</script>`;
}

// Wires every .qa card independently: first tap locks the card, marks the picked
// option right/wrong, reveals the correct one + the explanation. No deps.
// ⚠️ MUST STAY ABOVE QA_TRACK_JS AND TASTER_JS. These are `const`, so a
// consumer declared earlier in the file throws "Cannot access before
// initialization" at module load — the temporal dead zone, which ESLint
// does not catch and which has now bitten this repo three times.
// Supabase endpoint + PUBLISHABLE key, shared by the two independent inline
// scripts these pages ship: the club-quiz engine and the taster.
//
// ⚠️ Hoisted 2026-08-23. They were literals inside the engine block only, so
// the taster — which runs on all 42 localised pages and all 51 /lists/ pages —
// had no way to report anything without a second copy. A second copy is the
// drift shape this repo keeps losing to (four storefront lists, two privacy
// policies, QUESTION_DURATION_MS), so there is one definition and both blocks
// interpolate it.
//
// The key is publishable and already public in the app bundle; it carries no
// privilege beyond calling the two SECURITY DEFINER functions, both of which
// throttle internally.
const BQ_SUPABASE_URL = 'https://blcisypmngimqkwxrrdm.supabase.co';
const BQ_PUBLISHABLE_KEY = 'sb_publishable_FluGERu-3n3KSIlgM37Jbg_P0KhDsiR';

/* ⚠️ /lists/ IS 47% OF ALL IMPRESSIONS AND REPORTED TO NOTHING.
   These 51 pages are the biggest single surface we own by impressions, and
   they were the only interactive thing on the site with no sink at all — not
   funnel_events, not a named Clarity event. So the page type memory records as
   "51% of impressions, 5% of clicks" could be argued about but never measured.
   The reveal below already knows when someone answers; it just never said so.
   One event on the first answer, gesture-gated so crawlers cannot inflate it. */
/* ONE definition of "which surface is this page", interpolated into every
   tracking block below. It used to exist twice — derived from the path in the
   taster, hardcoded to 'list-page' in the list tracker — so 111 pages reported
   as list pages when only 37 were. Keep it single-sourced. */
const SURFACE_FN_JS = `function biqSurface(){try{
var seg=location.pathname.split('/').filter(Boolean);
if(seg[0]==='lists')return 'list-page';
if(seg[0]&&seg[0].length===2&&seg[1])return 'localised';
if(seg[0]==='questions')return 'questions-page';
return 'taster';
}catch(e){return 'taster'}}`;

/* ⚠️ DECLARED AFTER SURFACE_FN_JS ON PURPOSE — it interpolates it, and a
   template literal is evaluated where it is written, so defining this above
   SURFACE_FN_JS is a temporal-dead-zone crash at module load. `node --check`
   passes it happily; only running the generator catches it. It did. */
/* ⚠️ THREE PLAYABLE BOARDS THAT REPORTED NOTHING.
   /football-wordle/, /transfer-trail/ and /mystery-player/ each ship a real,
   finishable game in the page — and emitted ZERO events, verified by grepping
   the built HTML for record_funnel_event and finding none. So the single
   question those boards exist to answer ("does a playable landing page turn a
   searcher into a player?") could not be answered for the very pages that are
   supposed to answer it.

   Same sink, same biq_vid, same synthetic gate and the same surface function
   as the taster and list trackers. A second measurement system would be a
   second thing to keep in sync, and this file has already lost that bet.

   ⚠️ START FIRES ON INPUT, NEVER ON RENDER. The club engine calls start()
   unconditionally at the end of its script, which is why clubq-start counts
   Googlebot's renderer and every PageSpeed run — 30.5 fires per visitor. A
   render event measures traffic; only an input event measures play.

   ⚠️ GUARDS ARE PER PAGE, NOT PER BOARD. /transfer-trail/ ships two trail
   boards (hero + #practice), so a guard local to a board would post two starts
   for one visitor playing one game. */
const GAME_TRACK_JS = `(function(){
if(window.__biqGameTrack)return;window.__biqGameTrack=1;
${SURFACE_FN_JS}
function gSyn(){try{
if(navigator.webdriver===true)return true;
var h=location.hostname;return h==='localhost'||h==='127.0.0.1'||h==='[::1]';
}catch(e){return false}}
function gVid(){try{
var v=localStorage.getItem('biq_vid');
if(!v){v=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():null;
if(!v)return null;localStorage.setItem('biq_vid',v)}
return (v&&v.length===36)?v:null;
}catch(e){return null}}
function gev(n,x){
if(gSyn())return;
try{if(window.clarity)window.clarity('event',n)}catch(e){}
var meta={surface:biqSurface()};
if(x)for(var xk in x){if(Object.prototype.hasOwnProperty.call(x,xk))meta[xk]=x[xk]}
try{
var lg=document.documentElement.getAttribute('lang');if(lg)meta.lang=lg;
}catch(e){}
try{fetch('${BQ_SUPABASE_URL}/rest/v1/rpc/record_funnel_event',{method:'POST',keepalive:true,
headers:{'content-type':'application/json','apikey':'${BQ_PUBLISHABLE_KEY}','authorization':'Bearer ${BQ_PUBLISHABLE_KEY}'},
body:JSON.stringify({p_event:n,p_meta:meta,p_visitor:gVid()})}).catch(function(){})}catch(e){}}
var gOn={},gFin={};
window.__biqGameStart=function(g){if(gOn[g])return;gOn[g]=1;gev('game-start',{game:g})};
window.__biqGameFinish=function(g,won,x){
if(gFin[g])return;gFin[g]=1;
var m={game:g,won:!!won};
if(x)for(var k in x){if(Object.prototype.hasOwnProperty.call(x,k))m[k]=x[k]}
gev('game-finish',m)};
/* The exit into the product is what these pages exist to produce. Test the
   RESOLVED hostname for stores, never an href substring: "play.google.com"
   contains "/play" at index 7, which would score every Play badge as a web-app
   click. */
document.addEventListener('click',function(e){
var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
if(!a)return;var h=a.getAttribute('href')||'';var gh=(a.hostname||'');
if(gh==='play.google.com'||gh==='apps.apple.com'){gev('game-out-store');return}
if(h.indexOf('/get')>-1){gev('game-out-get');return}
if(h.indexOf('/play')>-1||h.indexOf('/footle')>-1)gev('game-out-play');
},true);
})();`;


const QA_TRACK_JS = `(function(){
/* ⚠️ IDEMPOTENT ON PURPOSE — this block registers a document-level click
   listener, and it is now emitted from two places: renderQA() (wherever a
   taster exists) and the list-page template (so the 13 list pages with no
   taster can still measure their CTA). Without this guard those two would both
   fire on the same page and every outbound click would count twice. A gate
   firing 30.5x per visitor has already happened here once; do not remove it. */
if(window.__biqQaTrack)return;window.__biqQaTrack=1;
${SURFACE_FN_JS}
function qSyn(){try{
if(navigator.webdriver===true)return true;
var h=location.hostname;return h==='localhost'||h==='127.0.0.1'||h==='[::1]';
}catch(e){return false}}
function qVid(){try{
var v=localStorage.getItem('biq_vid');
if(!v){v=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():null;
if(!v)return null;localStorage.setItem('biq_vid',v)}
return (v&&v.length===36)?v:null;
}catch(e){return null}}
function qev(n,x){
if(qSyn())return;
try{if(window.clarity)window.clarity('event',n)}catch(e){}
var meta={surface:biqSurface()};
if(x)for(var xk in x){if(Object.prototype.hasOwnProperty.call(x,xk))meta[xk]=x[xk]}
try{
var seg=location.pathname.split('/').filter(Boolean);
if(seg[1])meta.slug=seg[1];
var lg=document.documentElement.getAttribute('lang');if(lg)meta.lang=lg;
}catch(e){}
try{fetch('${BQ_SUPABASE_URL}/rest/v1/rpc/record_funnel_event',{method:'POST',keepalive:true,
headers:{'content-type':'application/json','apikey':'${BQ_PUBLISHABLE_KEY}','authorization':'Bearer ${BQ_PUBLISHABLE_KEY}'},
body:JSON.stringify({p_event:n,p_meta:meta,p_visitor:qVid()})}).catch(function(){})}catch(e){}}
var qSeen=false;
window.__biqListAnswered=function(){if(qSeen)return;qSeen=true;qev('list-answered')};
/* Answering ONE question and answering ALL FIVE are different levels of
   intent, and only the first was ever recorded — so "they engaged but did not
   convert" and "they tried one and left" were the same row. */
var qFin=false;
window.__biqListFinished=function(s,t){if(qFin)return;qFin=true;qev('list-finished',{score:s,total:t})};
/* A tap through to the product from a list page — the step the whole surface
   exists to produce, and the one nobody could count. */
document.addEventListener('click',function(e){
var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
if(!a)return;var h=a.getAttribute('href')||'';
/* Match on the RESOLVED hostname, never a substring of the href: the string
   "https://play.google.com/..." contains "/play" at index 7, so an href-first
   test scored every Play Store badge as a web-app click. Store branch first,
   exact host, so a substring can never win again. /get redirects to /play, so
   it belongs with the web app. */
var qh=(a.hostname||'');
if(qh==='play.google.com'||qh==='apps.apple.com')qev('list-out-store');
/* /get gets its OWN event and is deliberately not folded into either side.
   api/get.js is platform-aware: iPhone -> App Store, Android -> Play, desktop
   -> /play. So the same href is a store hop for most of our traffic and a
   web-app click for the rest, and calling it either one would be a number that
   looks precise and is wrong. Counted separately; resolve it against the
   platform breakdown when reading. */
else if(h.indexOf('/get')>-1)qev('list-out-get');
else if(h.indexOf('/play')>-1)qev('list-out-play');
},true);
})();`;

/* ⚠️ THIS WIDGET USED TO END IN NOTHING, on the surface that carries 47% of
   impressions and returns 4% of clicks.

   renderTaster()/TASTER_JS — the club-page widget — has had a finish state all
   along (see `.tdone` below: score, a /play link, a store link). renderQA() is
   a different widget used by the /lists pages, and it just marked the last
   answer and stopped. The next DOM siblings after `.qa-list` were two <script>
   tags. So a reader answered five questions correctly and was offered nothing.

   Worse, `appCtaBand` — the only other exit on a list page — ships STORE
   BADGES ONLY and sits below a table that runs to 70+ rows. The free,
   instant, no-install version of the product was never offered at all.

   Ordering copies the club engine, which was tuned against the 94.6%
   single-page measurement: play here first, install second. */
const QA_JS = `(function(){
var cs=document.querySelectorAll('.qa[data-a]');
if(!cs.length)return;
var list=cs[0].closest('.qa-list'),total=cs.length,answered=0,score=0;
function finish(){
if(!list||document.getElementById('qa-done'))return;
var d=document.createElement('div');
d.id='qa-done';d.className='qa-done';
d.innerHTML='<div class="qa-done-h">'+score+' of '+total+'</div>'
+'<p class="qa-done-s">There are thousands more, and a new one every day.</p>'
+'<a class="qa-done-go" href="${SITE.base}/play">Keep playing — free in your browser \\u2192</a>'
+'<a class="qa-done-alt" href="${SITE.getApp}" rel="noopener">Get the app</a>';
list.parentNode.insertBefore(d,list.nextSibling);
try{window.__biqListFinished&&window.__biqListFinished(score,total)}catch(e){}}
for(var c=0;c<cs.length;c++){(function(card){
var a=+card.getAttribute('data-a'),bs=card.querySelectorAll('.to'),w=card.querySelector('.qa-why'),done=false;
if(w)w.hidden=true;
function pick(ev){
if(done)return;done=true;
var k=+ev.currentTarget.getAttribute('data-i');
for(var b=0;b<bs.length;b++){bs[b].disabled=true;
if(b===a){bs[b].className='to correct';bs[b].insertAdjacentHTML('beforeend','<span class="tm">\\u2713</span>')}
else if(b===k){bs[b].className='to wrong';bs[b].insertAdjacentHTML('beforeend','<span class="tm">\\u2717</span>')}
else{bs[b].className='to dim'}}
if(w)w.hidden=false;
answered++;if(k===a)score++;
try{window.__biqListAnswered&&window.__biqListAnswered()}catch(e){}
if(answered===total)finish();}
for(var b=0;b<bs.length;b++)bs[b].addEventListener('click',pick)})(cs[c])}
})();`;

// ── Interactive quiz taster (Claude Design website handoff) ───────────────────
// A playable 5-question widget injected into every club/league landing page:
// tap an answer → instant right/wrong → "Your Ball IQ" score. Progressive
// enhancement — the crawlable SEO copy (intro, stats, the static Q&A block, FAQ)
// stays server-rendered; only this widget hydrates. Questions come from the real
// bank and are EXCLUDED from the static Q&A block so playing isn't spoiled.
// Self-contained per page (inline JS, no shared bundle) so each page is robust
// on a cold load. IQ map + fan tiers per the handoff spec.
/* Answer-option rules, emitted under whatever selector the caller needs.
   The taster card uses a bare `.to`; the static Q&A blocks on list pages use
   `.qa-opts .to`. Those were separate declarations and list pages only ever
   got the padding override — so their `.tl` letter badge rendered with NO
   layout at all and read as "AEintracht Frankfurt". One source, two scopes. */
const OPTION_CSS = (s) => `  ${s}{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:13px 14px;border-radius:13px;border:1.5px solid #242730;background:#0B0D13;color:#E8EAF0;font:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:border-color .15s,background .15s}
  ${s}:hover:not(:disabled){border-color:#3E4150;background:#1B1E27}
  ${s}:disabled{cursor:default}
  ${s}.correct{border-color:rgba(88,204,2,.55);background:rgba(88,204,2,.12);color:#8AE042}
  ${s}.wrong{border-color:rgba(255,71,71,.5);background:rgba(255,71,71,.1);color:#FF8A82}
  ${s}.dim{opacity:.5}
  ${s} .tl{flex:0 0 auto;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:800;font-size:12px;background:#1F2430;color:#9BA0B8}
  ${s}.correct .tl{background:#58CC02;color:#06230C}
  ${s}.wrong .tl{background:#FF4747;color:#fff}
  ${s} .tt{flex:1}
  ${s} .tm{font-size:16px}`;

const TASTER_CSS = `  .taster{text-align:left}
  .taster .eyebrow{display:block;margin-bottom:8px}
  .taster h2{margin:8px 0 16px;text-align:left;font-size:clamp(21px,2.4vw,28px)}
  .tcard{max-width:none;margin:0;text-align:left;background:#13151C;border:1px solid #242730;border-radius:22px;padding:22px;box-shadow:0 30px 60px -30px rgba(0,0,0,.85)}
  .taster-note{margin:14px 0 0;font-size:13px;color:var(--tx4)}
  .tph{font-size:15px;font-weight:600;color:#9BA0B8;margin:0;line-height:1.5}
  .th{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .th .tq{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx4)}
  .th .ts{font-family:var(--mono);font-size:12px;font-weight:700;color:#8AE042;background:rgba(88,204,2,.1);border-radius:999px;padding:4px 11px}
  .tbar{height:6px;border-radius:999px;background:#08090E;overflow:hidden;margin-bottom:18px}
  .tbf{height:100%;background:#58CC02;border-radius:999px;transition:width .3s ease}
  .tqx{font-size:18px;font-weight:800;color:#fff;line-height:1.32;margin-bottom:16px}
  .tos{display:flex;flex-direction:column;gap:9px}
${OPTION_CSS('.to')}
  .tw{margin-top:12px;font-size:13.5px;color:#9BA0B8;line-height:1.55}
  .tn{margin-top:16px;width:100%;padding:13px;border:none;border-radius:13px;background:#58CC02;color:#06230C;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
  .tn:hover{filter:brightness(1.05)}
  .tn.again{margin-top:12px;background:transparent;border:1px solid #2F3240;color:#9BA0B8}
  .tdone{text-align:center;padding:8px 4px}
  .tdone .tdl{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#9BA0B8}
  .tiq{font-family:var(--mono);font-size:64px;font-weight:800;line-height:1;letter-spacing:-.03em;color:#FFC107;margin:8px 0 2px}
  .ttier{font-size:18px;font-weight:800;color:#fff}
  .tscore{font-size:14px;color:#9BA0B8;margin-top:6px}
  .tcta{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:18px}
  .tcta .btn{display:inline-flex;align-items:center;padding:12px 20px;background:#58CC02;color:#06230C;font-weight:800;font-size:14px;border-radius:12px}
  .tcta .btn:hover{text-decoration:none;filter:brightness(1.05)}
  .tcta .btn.store{background:#000;color:#fff;border:1px solid #2F3240}
  .tcta .btn.store:hover{border-color:#3E4150;filter:none}`;

const TASTER_JS = `(function(){
var box=document.getElementById('biq-taster'),d=document.getElementById('biq-taster-data');
if(!box||!d)return;
/* ⚠️ THE TASTER REPORTED TO NOTHING, ON 58% OF THE SEO SURFACE.
   Measured 2026-08-23 against the built output: of 328 pages, /quiz/ had 136
   of 140 instrumented and /questions/ 0 of 76, /lists/ 0 of 51 and the
   localised layer 0 of 42. So the two surfaces we have the strongest evidence
   about were the two we could not measure: memory records /lists/ at 47% of
   all impressions, and /es/ River Plate at 134 clicks against 8 for its
   English twin. Every recommendation about either was reasoning, not
   measurement — and a dead loop and an unmeasured loop look identical.
   Same sink and same synthetic gate as the club engine, kept deliberately
   small: an impression, a first answer, and a tap through to the product. */
function tSyn(){try{
if(navigator.webdriver===true)return true;
var h=location.hostname;return h==='localhost'||h==='127.0.0.1'||h==='[::1]';
}catch(e){return false}}
function tVid(){try{
var v=localStorage.getItem('biq_vid');
if(!v){v=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID():null;
if(!v)return null;localStorage.setItem('biq_vid',v)}
return (v&&v.length===36)?v:null;
}catch(e){return null}}
/* Surface comes from the path, so one taster serves every page type and the
   rows stay separable: list pages, the localised layer, and everything else.
   Single-sourced in SURFACE_FN_JS — do not re-declare it here. */
${SURFACE_FN_JS}
function tev(n){
if(tSyn())return;
try{if(window.clarity)window.clarity('event',n)}catch(e){}
var meta={surface:biqSurface()};
try{
var seg=location.pathname.split('/').filter(Boolean);
var sl=seg[seg.length-1];if(sl)meta.slug=sl;
var lg=document.documentElement.getAttribute('lang');if(lg)meta.lang=lg;
}catch(e){}
try{fetch('${BQ_SUPABASE_URL}/rest/v1/rpc/record_funnel_event',{method:'POST',keepalive:true,
headers:{'content-type':'application/json','apikey':'${BQ_PUBLISHABLE_KEY}','authorization':'Bearer ${BQ_PUBLISHABLE_KEY}'},
body:JSON.stringify({p_event:n,p_meta:meta,p_visitor:tVid()})}).catch(function(){})}catch(e){}}
/* ⚠️ Impression fires on FIRST HUMAN INPUT, never on load. The club engine
   calls start() unconditionally at the end of its script, so clubq-start
   counts every JS-executing render — including Googlebot's renderer and two
   PageSpeed runs that landed in the table on 2026-08-23. A user-agent
   blocklist cannot fix that; requiring a gesture makes it robot-proof by
   construction. */
var tSeen=false;
function tFirst(){if(tSeen)return;tSeen=true;tev('taster-start')}
box.addEventListener('click',tFirst,{once:false});
/* A tap through to the product is the whole point of these pages. */
box.addEventListener('click',function(e){
var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
if(!a)return;
var h=a.getAttribute('href')||'';
if(h.indexOf('/play')>-1)tev('taster-out-play');
else if(h.indexOf('apps.apple.com')>-1||h.indexOf('play.google.com')>-1||h.indexOf('/get')>-1)tev('taster-out-store');
},true);
var QS;try{QS=JSON.parse(d.textContent)}catch(e){return}
if(!QS||!QS.length)return;
var nm=box.getAttribute('data-name')||'this team',play=box.getAttribute('data-play')||'/',store=box.getAttribute('data-store')||'#';
/* ⚠️ THE TASTER CHROME USED TO BE ENGLISH ON EVERY LOCALISED PAGE.
   Sixteen translated club pages rendered hand-written Spanish, Portuguese and
   Turkish questions wrapped in "Question 1 / 6", "correct", "Your Ball IQ" and
   "Play again". The QUESTIONS were localised and the GAME around them was not,
   which is the tell that a translation was bolted on rather than finished.
   Labels now come off the card as JSON; English pages pass nothing and get the
   defaults, so this is additive. */
var L={};try{L=JSON.parse(box.getAttribute('data-i18n')||'{}')}catch(e){L={}}
function T(k,f){return L[k]||f}
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
var nx=(p!==null)?'<button class="tn" data-next="1">'+(i+1>=n?T('seeScore','See your score →'):T('next','Next →'))+'</button>':'';
box.innerHTML='<div class="th"><span class="tq">'+T('question','Question')+' '+(i+1)+' / '+n+'</span><span class="ts">'+sc+' '+(sc===1?T('correct1',T('correct','correct')):T('correct','correct'))+'</span></div><div class="tbar"><div class="tbf" style="width:'+pct+'%"></div></div><div class="tqx">'+e(q.q)+'</div><div class="tos">'+os+'</div>'+why+nx;
var bs=box.querySelectorAll('.to');for(var b=0;b<bs.length;b++){bs[b].addEventListener('click',pick)}
var nb=box.querySelector('.tn');if(nb){nb.addEventListener('click',next)}
}
function pick(ev){if(p!==null)return;var k=+ev.currentTarget.getAttribute('data-i');p=k;if(k===QS[i].a)sc++;draw()}
function next(){i++;p=null;draw()}
function done(){
var G=grade(sc,QS.length),iq=G.iq,ti=G.tier;
box.innerHTML='<div class="tdone"><div class="tdl">'+T('yourIq','Your Ball IQ')+'</div><div class="tiq">'+iq+'</div><div class="ttier">'+e(ti)+'</div><div class="tscore">'+T('scored','You scored')+' '+sc+' / '+QS.length+'</div><div class="tcta"><a class="btn" href="'+play+'">'+T('playFull','Play the full quiz')+' →</a><a class="btn store" href="'+store+'" rel="noopener">'+T('getApp','Get the app')+'</a></div><button class="tn again">'+T('again','Play again')+'</button></div>';
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
<p class="tph">Rate your ${esc(name)} Ball IQ — hand-written questions, answers explained. <a href="${play}">Play now →</a></p>
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
<p class="trust-note">Every ${esc(name)} question here was checked twice before publication — once against the claim the question makes, and once against the wrong answers offered beside it. A question whose wrong options can be dismissed without knowing any football is not really a question, so those get rewritten or dropped rather than padded out. Anything that could not be confirmed was removed rather than guessed, which is why some sets are smaller than others. ${pct100(rows)} Spot something wrong and <a href="${SITE.base}/contact/">tell us</a> — corrections from players are how the bank stays accurate.</p>
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
  /* overflow:clip, not hidden. position:sticky sticks to the nearest ancestor
     that scrolls, and overflow:hidden MAKES the card that ancestor — the Next
     button would stick to the card instead of the viewport, i.e. not at all.
     clip clips the 2px top strip to the radius exactly as hidden did, without
     creating a scroll container. */
  .bq-card{background:linear-gradient(var(--card2),var(--card));border:1px solid var(--bd2);border-radius:20px;padding:20px;position:relative;overflow:clip}
  .bq-card::before{content:"";position:absolute;inset:0 0 auto;height:2px;background:linear-gradient(90deg,var(--club,var(--grn)),var(--club-soft,var(--grn-soft)) 60%,transparent)}
  .bq-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;min-height:24px}
  .bq-meter{display:flex;gap:4px;flex-wrap:wrap}
  .bq-meter i{width:15px;height:4px;border-radius:2px;background:var(--bd);transition:background .2s}
  .bq-meter i.ok{background:var(--grn)}
  .bq-meter i.no{background:#FF4747}
  .bq-streak{font-family:var(--mono);font-size:11.5px;font-weight:700;color:var(--grn-ink);background:var(--amber);border-radius:6px;padding:3px 8px}
  .bq-list{list-style:none;margin:0;padding:0}
  /* ⚠️ EVERY QUESTION IS IN THE HTML AND MUST STAY THERE — it is the crawlable
     "with answers" text these pages rank on, and it is what a reader with JS
     off gets. But the browser was laying out all of it before the engine ran:
     /quiz/arsenal/ ships 66 questions / 264 option buttons, 1,379 of the
     page's 2,085 tags. Measured on the live page, five runs each: laying the
     full list out costs 44.5ms median unthrottled, 1.4ms with this rule —
     and PSI throttles the CPU 4x on top. content-visibility skips the
     RENDERING work for anything off-screen without touching the DOM, the
     accessibility tree, find-in-page, or what a crawler reads; it is not
     display:none. contain-intrinsic-size keeps the scroll height honest so
     CLS stays at 0. */
  .bq-q{content-visibility:auto;contain-intrinsic-size:auto 420px}
  .bq-q + .bq-q{margin-top:26px;padding-top:26px;border-top:1px solid var(--bd)}
  .bq-qn{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4);margin-bottom:7px}
  .bq-qx{font-size:19px;font-weight:700;color:var(--tx);line-height:1.3;letter-spacing:-.015em;margin:0 0 15px;text-wrap:balance}
  .bq-os{display:grid;gap:8px}
  .bq-o{display:flex;align-items:center;gap:11px;width:100%;min-height:44px;text-align:left;padding:12px 13px;border-radius:11px;border:1px solid var(--bd);background:var(--bg2);color:var(--tx2);font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s;-webkit-user-select:none;user-select:none;touch-action:manipulation}
  .bq-o:active{border-color:var(--tx2)}
  .bq-o:hover:not(:disabled){border-color:var(--bd3);background:var(--card2)}
  .bq-o:disabled{cursor:default}
  .bq-o .k{flex:0 0 auto;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:11px;font-weight:700;background:#1B2029;color:var(--tx4)}
  .bq-o .tt{flex:1}
  .bq-o.ok{border-color:var(--grn);background:rgba(88,204,2,.10);color:#B6F27E}
  .bq-o.ok .k{background:var(--grn);color:var(--grn-ink)}
  .bq-o.no{border-color:var(--wrong);background:rgba(255,71,71,.09);color:#FF8A82}
  .bq-o.no .k{background:var(--wrong);color:#fff}
  .bq-o.dim{opacity:.45}
  /* Screen-reader-only announcement of the outcome. Not display:none and not
     hidden — both remove it from the accessibility tree, which is exactly the
     bug this fixes. */
  .bq-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
  .bq-why{margin-top:13px;border-left:2px solid var(--club,var(--grn));padding:2px 0 2px 14px;font-size:13.5px;color:var(--tx3);line-height:1.55;scroll-margin-bottom:76px}
  .bq-why b{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--club-soft,var(--grn));margin-bottom:5px;font-weight:700}
  /* Sticky: after an answer the button used to land 212px below the fold at
     375x812 (measured live 2026-09-05), so every question cost a scroll-hunt on
     the page that holds visitors longest. Pinned to the viewport's foot while
     the card overflows it; in normal flow the moment the card fits. */
  .bq-next{position:sticky;bottom:10px;z-index:2;box-shadow:0 8px 24px rgba(0,0,0,.35);margin-top:14px;width:100%;padding:13px;border:none;border-radius:12px;background:var(--grn);color:var(--grn-ink);font:inherit;font-weight:800;font-size:15px;cursor:pointer}
  .bq-next:hover{filter:brightness(1.05)}
  .bq-res{text-align:center;padding:6px 2px;position:relative;overflow:hidden}
  .bq-res::before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,transparent,var(--club,var(--grn)),transparent)}
  .bq-crest{width:30px;height:30px;margin:6px auto 10px;border-radius:8px;background:var(--club,var(--grn));color:#fff;font-family:var(--mono);font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
  .bq-rank{font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--tx4)}
  .bq-big{font-family:var(--mono);font-size:clamp(50px,11vw,62px);font-weight:800;line-height:1;letter-spacing:-.04em;color:#fff;margin:6px 0 6px}
  .bq-tier{display:inline-block;font-size:15px;font-weight:800;color:var(--club-ink,var(--grn-ink));background:var(--club,var(--grn));padding:5px 13px;border-radius:999px}
  .bq-sub{font-size:13.5px;color:var(--tx4);margin-top:11px}
  .bq-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}
  .bq-row a,.bq-row button{flex:1 1 140px;text-align:center;padding:12px;border-radius:11px;background:var(--grn);color:var(--grn-ink);font:inherit;font-weight:800;font-size:14px;border:none;cursor:pointer}
  .bq-row a:hover{text-decoration:none;filter:brightness(1.05)}
  .bq-row .ghost{background:transparent;border:1px solid var(--bd2);color:var(--tx3)}
  /* One primary on the results card since 2026-09-05. The club-coloured
     "Play the full quiz" crossing (.bq-cross) went with the web /play game
     routes; green has exactly one job here — continue where you already are —
     and the app is a quiet line at the foot (.bq-app), a destination rather
     than a competitor. */
  /* Full-width primary: the action that keeps the reader where they already
     are. It is first in the DOM and now first in the eye. */
  .bq-row .bq-wide{flex:1 1 100%}
  .bq-app{display:flex;align-items:center;justify-content:center;min-height:44px;margin-top:10px;font-size:13px;color:var(--tx3);text-decoration:none}
  .bq-app:hover{color:var(--tx);text-decoration:none}
  /* The daily door as a card (fourth treatment — see finish() in the engine):
     a board picture, a name, one line, a green "Play". Outside .bq-row on
     purpose, so none of the row's button paint reaches it. */
  .bq-footle{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--card2);border:1px solid var(--bd);color:var(--tx);text-align:left}
  .bq-footle:hover{text-decoration:none;border-color:var(--bd2)}
  .bq-fb{display:grid;grid-template-columns:repeat(7,14px);gap:3px}
  .bq-fb i{display:block;width:14px;height:14px;border-radius:4px;background:var(--bd);border:1px solid rgba(255,255,255,.07)}
  .bq-fb i.cur{border-color:rgba(88,204,2,.7);box-shadow:inset 0 0 0 1px rgba(88,204,2,.35)}
  .bq-ft{display:flex;flex-direction:column;gap:2px;min-width:0}
  .bq-ft b{font-size:15px;font-weight:700;color:var(--tx)}
  .bq-ft span{font-size:12.5px;line-height:1.4;color:var(--tx3)}
  .bq-fgo{font-size:13.5px;font-weight:800;color:var(--grn);white-space:nowrap}
  .bq-footle:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  .bq-note{margin:12px 0 0;font-size:12.5px;color:var(--tx4)}
  .bq-o:focus-visible,.bq-len button:focus-visible,.bq-next:focus-visible,.bq-row a:focus-visible,.bq-row button:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  .bq-days{display:inline-block;margin-top:9px;padding:4px 11px;border-radius:999px;
    background:rgba(240,169,59,.14);border:1px solid rgba(240,169,59,.4);
    color:#F0A93B;font-size:12.5px;font-weight:700}
  .bq-share{display:block;width:100%;margin-top:13px;padding:13px;border-radius:11px;
    border:1px solid var(--club,var(--grn));background:transparent;color:var(--club-tx,var(--grn));
    font:inherit;font-weight:800;font-size:14.5px;cursor:pointer;min-height:44px}
  .bq-share:hover{background:rgba(255,255,255,.04)}
  .bq-share:focus-visible{outline:3px solid var(--grn-soft);outline-offset:2px}
  .bq-lenwrap{margin-top:14px}
  .bq-daily{display:flex;align-items:center;gap:9px;margin:0 0 13px;padding:9px 12px;border-radius:11px;
    background:linear-gradient(90deg,rgba(240,169,59,.10),transparent);border:1px solid rgba(240,169,59,.28)}
  .bq-dot{width:7px;height:7px;border-radius:50%;background:#F0A93B;flex:none;box-shadow:0 0 8px rgba(240,169,59,.7)}
  .bq-dtx{font-size:13px;color:var(--tx3);line-height:1.35}
  .bq-dtx b{color:#F0A93B;font-weight:700}
  @media (prefers-reduced-motion:reduce){.bq-meter i,.bq-o{transition:none}}`;

// Progressive enhancement only. Everything it touches is already in the DOM.
// ⚠️ THE ENGINE NOW LIVES IN scripts/seo/club-quiz-engine.js, so that ESLint
// parses it. Inside this template literal it was a STRING to every tool we
// run — no no-undef, no no-redeclare, no shadowing check — and on 2026-08-23
// that let a variable named "off" collide with the module-level pagination
// offset, breaking both the clubq-start count (30.5 events per visitor against
// 1.1) and "Keep going", which silently restarted from question zero.
//
// Read rather than inlined, with the two build-time values substituted. Edit
// the engine in its own file; this line only wires it in.
const BQ_JS = (() => {
  const file = readFileSync(new URL('./seo/club-quiz-engine.js', import.meta.url), 'utf8');
  // ⚠️ Ship the ENGINE, not the file's documentation. The first version of this
  // inlined the whole file, which put a 20-line header on ~140 pages — and
  // substituted the real Supabase URL and key into the very comment that names
  // the placeholders. Slice from the marker instead.
  const MARK = '/* ---- ENGINE START';
  const i = file.indexOf(MARK);
  if (i < 0) throw new Error('[gen-seo] club-quiz-engine.js is missing its ENGINE START marker');
  const nl = file.indexOf('\n', i);
  return file
    .slice(nl + 1)
    .replaceAll('__BQ_SUPABASE_URL__', BQ_SUPABASE_URL)
    .replaceAll('__BQ_PUBLISHABLE_KEY__', BQ_PUBLISHABLE_KEY);
})();

// rows = every question the page ships. `more` = how many further questions the
// full pack holds beyond these, used for the honest app line at the end.
// ⚠️ `play` — the link INTO the product from the result screen.
// Measured 2026-08-05: this widget runs on 124 English club pages (the ones
// carrying essentially all the search traffic) and, before this parameter
// existed, offered NO path into the app at all. Round 1 sent you to '#quiz' —
// replay the same page — and round 2 sent you to the store, which on mobile
// leaves the web funnel entirely. The word "account" appeared on a club page
// only inside a meta tag.
//
// The other taster (renderTaster, used on just 10 pages, eight of them
// localised near-orphans) already had "Play the full X quiz →". The good
// done-state existed; it simply ran on the pages nobody visits.
//
// Deep link verified, not assumed: App.jsx:9136 reads ?club= / ?quiz=, and
// :9166 calls launchClubQuiz/launchLeagueQuiz. The searchParams.delete() at
// :9142 only tidies the DISPLAYED url via replaceState AFTER the value is
// consumed — it does not discard it. UTM params are deliberately preserved.
function renderQuizSet(rows, { name, tiers, store, more = 0, badge = '', slug = '', color = '', play = `${SITE.base}/play` }) {
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
<p class="bq-sr" role="status" aria-live="polite"></p>
<div class="bq-why"><b>Why</b>${esc(r.hint)}</div>
<button class="bq-next" type="button" hidden>Next question →</button>
</li>`;
    })
    .join('\n');
  const lens = [10, 20, rows.length].filter((n, i, a) => n <= rows.length && a.indexOf(n) === i);
  const picker = lens.length > 1
    ? `<div class="bq-lenl">Change the length</div><div class="bq-len">${lens
        // ⚠️ "Full set" CARRIES NO NUMBER — it used to read "42 Full set".
        // That is the pack size, i.e. exactly the "N questions in this pack"
        // badge the no-counts rule names as the disguise it keeps coming back
        // wearing. It was live on 124 pages with values from 15 to 609, so
        // /quiz/hajduk-split/ told a searcher there were 15 questions and
        // /quiz/beckham/ told them 16 — advertising the thinnest packs, and
        // showing two wildly different figures one click apart.
        //
        // "10 Quick" and "20 Standard" KEEP their numbers on purpose: those are
        // how many questions the player is choosing to answer, not a claim
        // about how much content exists. The rule is about the size of the
        // bank, not about counting things.
        .map((n, i) => `<button type="button" data-n="${n}" aria-pressed="${i === 0 ? 'true' : 'false'}">${n === rows.length ? 'Full set' : n === 10 ? '10 Quick' : `${n} Standard`}</button>`)
        .join('')}</div>`
    : '';
  return `<section class="bq" id="quiz" data-total="${rows.length}" data-name="${esc(name)}" data-tiers="${esc(tiers.join('|'))}" data-store="${SITE.getApp}" data-play="${play}" data-more="${more}" data-badge="${esc(badge)}" data-slug="${esc(slug)}" data-color="${esc(color)}">
<div class="bq-head"><p class="bq-daily" hidden><span class="bq-dot" aria-hidden="true"></span><span class="bq-dtx"></span></p>
<div class="bq-card">
<div class="bq-top"><div class="bq-meter" aria-hidden="true"></div><span class="bq-streak" hidden></span></div>
<ol class="bq-list">
${items}
</ol>
</div></div>
<div class="bq-res bq-card" hidden></div>
<div class="bq-lenwrap" hidden>${picker}</div>
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
// ⚠️ THESE ARE DESCRIPTIONS, NOT DOORS — and `href` is now ignored on purpose.
// Six tiles labelled Club history / Players & legends / Managers / Trophies &
// honours / Records & stats / Iconic moments each linked to the IDENTICAL pool.
// A reader who tapped "Managers" and got a random Henry question learned the
// labels were decoration, which is precisely the impression the hand-checked
// voice exists to avoid. That is the CTA-parity bug class: a control whose
// label does not match what pressing it does.
//
// ⚠️ AND A REAL TOPIC FILTER IS NOT POSSIBLE ON THIS BANK. Both audit reports
// offered "wire them to a topic filter" as the better fix. Measured 2026-09-02
// against the four tiles that map onto a real `cat` (History, Legends,
// Managers, Records), across all 89 clubs carrying club-tagged questions:
//   • only 4 clubs support 4 topics at >=5 questions — Dortmund, Athletic
//     Bilbao, Fiorentina, Sunderland. Not the clubs anyone searches for.
//   • Arsenal, the biggest club page, has TWO History questions.
//   • 26-32 clubs have ZERO questions in each given topic.
// Wiring the filter would ship six doors into two-question or empty rooms —
// worse than one honest door. So they become plain, non-clickable descriptions
// of what the quiz covers, which is true today and reads as useful copy.
// Revisit only if a wave ever gives the big clubs real per-topic depth.
function renderCovers(name, isLeague, isPlayer, _href) {
  const set = isPlayer ? PLAYER_COVERS(name) : isLeague ? LEAGUE_COVERS(name) : CLUB_COVERS(name);
  const cards = set
    .map(([t, d]) => `<div class="cov"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`)
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
${/* ⚠️ NEVER PRINT THE EXACT QUESTION COUNT — binding product rule.
      This line used to interpolate QB.length and shipped "a bank of 6,405
      questions" onto every club page, while the hand-written homepage block
      said 6,409. An editor auditing the site found both within one click.
      "Thousands" says the same thing, cannot go stale, and cannot disagree
      with another page. */ ''}
<p class="editorial">This is one set from a bank of thousands of questions spanning 72 clubs, every major league and eight decades of football.</p>
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
// Ink for text sitting ON the club colour. Without this the tier pill fell back
// to --grn-ink (near-black) on every club, which is fine on Dortmund yellow and
// unreadable on Juventus black or Tottenham navy. Pick whichever of white/near-
// black actually contrasts better, the same rule the club badges already use.
// "200, 16, 46" -- so a club colour can be used inside rgba() for atmosphere.
function rgbTriplet(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16)).join(', ');
}

// Guarantee the (--club background, --club-ink text) pair clears WCAG AA 4.5:1.
//
// inkOn picks the BETTER of white and near-black, which is right until both
// lose. Measured across all 86 club pages 2026-08-14: Arsenal #EF0107 gives
// white 4.49 and dark 4.41, Sunderland #EB172B gives 4.48 / 4.42 — mid-tone
// reds where neither ink reaches the bar, so the "better" one still fails.
// Hairline misses, but the pair paints the tier pill and now the app-crossing
// button, and 14px/800 is not large text, so 4.5 is the real threshold.
//
// Rather than abandon the club colour, darken it in 2% steps until the best
// ink clears. Arsenal red stays unmistakably Arsenal red; it just goes a shade
// deeper. Anything that cannot be rescued in 12 steps keeps its original colour
// and the build shouts, because silently shipping a colour nobody chose is
// worse than a visible complaint.
function accentPair(hex) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const parts = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const toHex = (rgb) => '#' + rgb.map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
  let bg = hex;
  for (let i = 0; i < 12; i++) {
    const ink = inkOn(bg);
    if (contrastRatio(ink, bg) >= 4.5) return { bg, ink };
    bg = toHex(parts(bg).map((v) => v * 0.98));
  }
  console.warn(`[gen-seo] ⚠️ accent ${hex} cannot reach 4.5:1 with either ink — shipping as-is`);
  return { bg: hex, ink: inkOn(hex) };
}

function contrastRatio(a, b) {
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => lin(parseInt(h.substr(i, 2), 16) / 255));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function inkOn(hex) {
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => lin(parseInt(h.substr(i, 2), 16) / 255));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const cr = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  return cr(hex, '#ffffff') >= cr(hex, '#0B0C10') ? '#ffffff' : '#0B0C10';
}

function softenAccent(hex) {
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (h) => (lum(h) + 0.05) / (0.0111 + 0.05); // vs #13151C
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16));
  for (let n = 0; n < 24 && ratio(`#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`) < 4.5; n++) {
    r = Math.min(255, Math.round(r + (255 - r) * 0.16));
    g = Math.min(255, Math.round(g + (255 - g) * 0.16));
    b = Math.min(255, Math.round(b + (255 - b) * 0.16));
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function head({ title, description, canonical, ld, ads = false, ogImage = SITE.ogImage, lang = 'en', alternates = [], accent = null, taster = false, extraHead = '' }) {
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
   the AdSense loader below (these pages ship inside the native bundle too).

   ⚠️ CONSENT-GATED IN EUROPE. This must stay byte-for-byte equivalent to the
   gate in index.html: these static club pages carry ~39% of all play and are
   where most European search traffic actually lands, so gating only the SPA
   would leave the larger half unconsented. See public/consent.js. */
(function(){try{
  var native = location.protocol === 'capacitor:' ||
    (window.Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) ||
    document.documentElement.classList.contains('native-app');
  if (native) return;
  window.clarity = window.clarity || function(){(window.clarity.q = window.clarity.q || []).push(arguments);};
  var needsConsent = true;
  /* 'UTC'/'' count as in-scope — fingerprint-hardened browsers report UTC
     wherever they are, and reading that as non-European would silently track
     exactly the visitors most likely to object. See index.html. */
  try { var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        needsConsent = tz.indexOf('Europe/') === 0 || tz === 'UTC' || tz === ''; }
  catch (e) { needsConsent = true; }
  var choice = null;
  try { choice = localStorage.getItem('biq_consent_analytics'); } catch (e) {}
  if (!needsConsent || choice === 'granted') {
    var c = document.createElement('script');
    c.async = true;
    c.src = 'https://www.clarity.ms/tag/xqwevk9brq';
    document.head.appendChild(c);
  } else if (choice !== 'denied') {
    /* ⚠️ DEFER THE BAR ON PAGES WHOSE POINT IS A PLAYABLE QUESTION.
       index.html sets this flag for deep links and the homepage; the static
       generator injected the SAME consent.js and never set it, so every club
       and list page got the bar on load. Measured in WebKit (Safari's engine)
       on an iPhone 13 at 390x664, 2026-09-02: on /quiz/arsenal/ the four
       answer options sit at y=467/524/581/638 and the bar's top edge is at
       y=492 — so options B, C and D are covered and option A is clipped
       mid-word, on the best-converting arrival on the site.
       The bar gates CLARITY, not gameplay, and Clarity stays off until
       consent, so nothing is collected while we wait. consent.js triggers on
       a scroll past ~90% of a viewport or a 60s dwell — never on tap, so
       answering the taster cannot summon it over the next question. */
    window.__biqConsentDefer = true;
    var b = document.createElement('script');
    b.src = '/consent.js';
    b.defer = true;
    document.head.appendChild(b);
  }
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
${ADS_ACTIVE ? `<script>
/* GOOGLE CMP (Funding Choices) — deliberately NOT inside the ads &&
   ADS_ENABLED block above.

   That distinction is the whole point. AD_SLOTS is currently empty, so
   ADS_ENABLED is false and NO generated page loads the ad library today.
   Consent, however, is a property of the SITE, not of whether a given page
   happens to carry a slot: an EEA visitor landing on /quiz/arsenal/ needs the
   same consent surface as one landing on the homepage, and an AdSense
   reviewer checks the site rather than one template. Piggybacking on the ads
   conditional is also the exact mistake that silently dropped Clarity from
   every club page once — so this gets its own block.

   Still native-guarded: capacitor's webDir:"dist" ships every one of these
   pages inside the iOS/Android bundle, and the native app declares no ads and
   no analytics.

   INERT until a GDPR message is created and published in the AdSense console
   under Privacy & messaging. Until then the script loads and does nothing. */
(function(){try{
  var native = location.protocol === 'capacitor:' ||
    (window.Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) ||
    document.documentElement.classList.contains('native-app');
  if (native) return;
  var fc = document.createElement('script');
  fc.async = true;
  fc.src = 'https://fundingchoicesmessages.google.com/i/${ADSENSE_CLIENT.replace('ca-', '')}?ers=1';
  document.head.appendChild(fc);
  (function sig(){
    if (window.frames['googlefcPresent']) return;
    if (!document.body) return setTimeout(sig, 0);
    var i = document.createElement('iframe');
    i.style.cssText = 'width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;display:none';
    i.name = 'googlefcPresent';
    document.body.appendChild(i);
  })();
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
<!-- ⚠️ SPLIT BY ROLE, mirroring index.html:66-77. These pages carried ONE
     combined link on display=swap, so Inter — the body face — swapped in late
     and reflowed every block of text on the page. MEASURED on /quiz/liverpool/
     2026-08-21: a real interactive session logged CLS 0.111 with the largest
     single shift (0.0738) attributed to .hero-body and .hero-glow, while the
     Lighthouse LAB run reported 0.004 and saw nothing. The lab misses it
     because it never plays the quiz and warms the font cache; Clarity's field
     numbers (0.198 on /quiz/premier-league/) are the honest ones.
     Anton is the display face — one headline, a late swap is better than
     losing the hero's identity — so it keeps swap. Inter and JetBrains Mono
     are TEXT, where a mid-visit metric change is the shift itself. The app
     made exactly this split months ago; the SEO generator never got it. -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&display=swap" media="print" onload="this.media='all'" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=optional" media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&display=swap" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=optional" /></noscript>
<style>
  ${accent ? (() => { const p = accentPair(accent); return `:root{--club:${p.bg};--club-soft:${softenAccent(accent)};--club-ink:${p.ink};--club-glow:${rgbTriplet(softenAccent(accent))}}`; })() : ''}
  ${rootCss()}
  *{box-sizing:border-box;margin:0;padding:0}
  html{background:var(--bg);-webkit-text-size-adjust:100%;scroll-behavior:smooth}
  body{font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:${PAGE_FG};line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  img{max-width:100%;display:block}
  a{color:var(--grn-soft);text-decoration:none}
  /* ⚠️ WCAG 1.4.1 — LINKS IN RUNNING TEXT MUST NOT RELY ON COLOUR ALONE.
     Flagged by Lighthouse (link-in-text-block, score 0) on the live club page:
     a green link inside a grey paragraph is indistinguishable to anyone who
     cannot separate those hues, and green-on-grey is one of the commonest
     forms of that. Navigation, buttons, cards and tiles are exempt — they are
     their own blocks with their own affordances; this targets links sitting
     INSIDE a sentence, which is exactly what the audit measures. */
  .prose a, .ff p a, .sub a, .foot-copy a, p.lede a, .fw-lede a, .taster-note a,
  .sec > p a, .crumbs a[href]:not(:last-child) {
    text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px;
    text-decoration-color:rgba(136,224,64,.55);
  }
  .prose a:hover, .ff p a:hover, .sub a:hover, .sec > p a:hover {
    text-decoration-color:currentColor;
  }
  a:hover{text-decoration:underline}
  main{max-width:1200px;margin:0 auto;padding:0 clamp(20px,4vw,44px)}
  /* readable inner width for long-form/list sections (handoff keeps prose + FAQ narrow inside the wide frame) */
  /* Left-aligned, not centred (Alex, 2026-09-03, on /football-quiz/: "look at
     the placement of football quiz"). A centred 760px heading above a
     full-width card grid put the h1 180px to the right of the cards' edge;
     the same wrapper carries prose and FAQ blocks on every page type, so every
     page had two left edges. One edge now, like the front door. */
  .narrow{max-width:760px}
  h2{font-size:clamp(22px,3.2vw,32px);font-weight:800;letter-spacing:-.02em;color:#fff;line-height:1.12;margin:0 0 16px}
${SHELL_CSS}
  /* hero */
  /* overflow:clip, not hidden — the club quiz renders INSIDE this section, and
     hidden would make the hero the sticky container for .bq-next (measured
     2026-09-05: sticky computed, button still 162px below the fold). clip keeps
     the glow clipped without creating a scroll container. */
  .hero{padding:46px 0 40px;position:relative;overflow:clip}
  .hero-in{position:relative;z-index:2}
  .hero-glow{position:absolute;top:16%;left:72%;width:min(560px,86vw);height:min(560px,86vw);background:radial-gradient(circle,rgba(var(--club-glow, 88, 204, 2),.16) 0%,rgba(var(--club-glow, 88, 204, 2),.05) 42%,transparent 66%);transform:translate(-50%,-50%);animation:glowPulse 5s ease-in-out infinite;pointer-events:none;z-index:0}
  @keyframes glowPulse{0%,100%{opacity:.4}50%{opacity:.72}}
  @media(prefers-reduced-motion:reduce){.hero-glow{animation:none}}
  /* two-column quiz hero: intro/CTA left, playable taster right */
  .hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,0.98fr);gap:clamp(28px,4vw,52px);align-items:center}
  .hero-left,.hero-right{min-width:0}
  /* Playable board sitting in the hero's right column (daily-game pages). */
  .hero-play .eyebrow{display:block;margin-bottom:8px}
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
  /* ⚠️ THE HEADING MUST NOT LEAVE THE FOLD TO MAKE ROOM FOR THE GAME.
     Ordering the whole left column below the playable card did put the quiz on
     screen — and pushed the h1 to y=796 on a club page, y=724 on the Trail. A
     phone then opened on an unlabelled board with nothing naming the page or
     the site. display:contents dissolves .hero-left so its two children become
     grid items in their own right, and the heading can be ordered ABOVE the
     card while the pitch stays below it. Desktop is untouched: the rule is
     inside the narrow breakpoint, so .hero-left remains an ordinary block and
     the two-column composition is byte-for-byte what it was. */
  @media(max-width:940px){
    .hero-grid{grid-template-columns:1fr;gap:22px}
    .hero-left{display:contents}
    .hero-head{order:1}
    .hero-right{order:2}
    .hero-body{order:3}
  }
  /* The head now sits between the top of the page and the playable card, so
     every pixel it spends is one the game loses. On the Transfer Trail the
     board is 466px tall on its own: with a 224px head above it the guess input
     landed at y=711 — the career ladder was visible but the box you type the
     answer into was not, which is the same defect as an unreachable question.
     Trimmed to the chrome only; the h1 keeps its full text and the badge
     keeps its club colour, because both carry identity. */
  @media(max-width:560px){
    .hero{padding-top:28px}   /* 46px of decorative top padding on a 664px screen */
    .hero-grid{gap:14px}
    .hero-head .crumbs{margin-bottom:8px}
    .hero-head .kicker{margin-bottom:10px}
    .hero .hero-head h1{font-size:34px;line-height:.95}  /* .hero h1 is defined LATER at equal specificity — this must out-specify it, not just follow it */
  }
  /* "What the <club> quiz covers" topic grid */
  .covers{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:12px;margin-top:6px}
  /* .cov is now an <a> (people were tapping these as divs). display:block +
     colour reset stop it rendering as an underlined default-blue link; the
     hover/focus state gives it the affordance it always lacked. */
  .cov{display:block;color:inherit;text-decoration:none;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:18px 18px 16px;transition:border-color .15s,background .15s,transform .15s}
  a.cov:hover{border-color:var(--grn);background:var(--card2);transform:translateY(-2px)}
  a.cov:focus-visible{outline:2px solid var(--grn);outline-offset:2px}
  .cov h3{font-size:15.5px;font-weight:800;color:#fff;margin:0 0 6px;letter-spacing:-.01em}
  .cov p{font-size:13.5px;color:var(--tx3);line-height:1.5;margin:0}
  .crumbs{font-size:13px;color:var(--tx4);margin-bottom:22px}
  /* 12px type gave a 16px-tall tap target. Padding lifts it over WCAG 2.2
     2.5.8's 24px floor without changing how the trail looks — the box grows,
     the text does not. Breadcrumbs are exempt from the 44px guideline (they
     are a dense inline trail, not a primary control) but not from 24px. */
  /* 4px padding on 13px type gave 27px-tall crumbs — under WCAG 2.5.8's 24px
     floor once you account for the separator, and the first thing a phone user
     reaches for to go back. Same 44px treatment the footer links already have
     (experience audit, 2026-08-23). inline-flex so the height actually applies. */
  .crumbs a{color:var(--tx3);display:inline-flex;align-items:center;min-height:44px;padding:0}
  .crumbs .sep{padding:0 1px}
  .crumbs a:hover{color:#fff;text-decoration:none}
  .crumbs .sep{color:var(--tx4);margin:0 7px}
  /* clubs/players/nations -> /lists/. See listsMentioning(): every list page
     had exactly ONE inbound internal link before this, against 163 for a club
     page, so we were signalling the whole reference surface as unimportant. */
  .editorial{margin:18px 0 0;padding:14px 16px;background:var(--card);border:1px solid var(--bd);border-left:3px solid var(--club,var(--grn));border-radius:0 12px 12px 0;font-size:13.5px;line-height:1.6;color:var(--tx3)}
  .editorial a{color:var(--grn-soft)}
  .llinks{list-style:none;padding:0;margin:0;display:grid;gap:8px}
  .llinks li{background:var(--card);border:1px solid var(--bd);border-radius:12px}
  .llinks a{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 15px;color:var(--tx);text-decoration:none;font-weight:700;font-size:15px}
  .llinks li:hover{border-color:var(--grn);background:var(--card2)}
  .llinks a:focus-visible{outline:2px solid var(--grn);outline-offset:2px}
  .llink-t{min-width:0}
  .llink-n{flex:0 0 auto;font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--tx4);white-space:nowrap}
  .skip{position:absolute;left:-9999px;top:0;z-index:200;padding:12px 20px;background:var(--grn);color:var(--grn-ink);font-weight:800;border-radius:0 0 12px 0}
  .skip:focus{left:0}
  .kicker{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .badge-chip{display:inline-flex;align-items:center;justify-content:center;min-width:46px;height:32px;padding:0 10px;border-radius:10px;background:#1F2430;font-family:var(--mono);font-weight:800;font-size:13px;letter-spacing:.03em;color:#fff}
  .badge-chip.emoji{background:rgba(255,255,255,.04);font-size:22px;padding:0 8px}
  .eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--tx3)}
  .hero h1{font-weight:800;font-size:clamp(30px,4.4vw,46px);line-height:1.05;letter-spacing:-.02em;color:#fff;margin-bottom:14px}
  .hero-lead{font-size:clamp(16px,2vw,19px);line-height:1.55;color:var(--tx3);max-width:52ch;margin-bottom:26px}
  .cta-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:22px}
  .btn-green{display:inline-flex;align-items:center;min-height:44px;gap:8px;padding:12px 22px;background:var(--grn);color:var(--grn-ink);font-weight:800;font-size:15px;border-radius:999px}
  .btn-green:hover{text-decoration:none;filter:brightness(1.05)}
  .hero-stat{font-size:13px;color:var(--tx4)}
  /* App Store badge */
  .store-badge{display:inline-flex;align-items:center;min-height:44px;gap:10px;padding:11px 18px;background:#000;border:1px solid var(--bd2);border-radius:13px}
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
  .appband{position:relative;overflow:hidden;border-radius:12px;padding:clamp(24px,4vw,36px);background:var(--card);border:1px solid var(--bd)}
  .appband-flame{display:none}
  .appband-in{position:relative;max-width:34ch}
  .appband h2{color:#fff;font-size:clamp(22px,3vw,30px);font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-bottom:10px}
  .appband p{color:var(--tx3);font-size:15px;font-weight:500;line-height:1.5;margin-bottom:18px}
  .appband .store-badge{border-color:var(--bd2)}
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
  .tiles-more{margin-top:10px}
  .tiles-more>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:10px 14px;background:var(--card2);border:1px solid var(--bd);border-radius:11px;cursor:pointer;font-size:14.5px;font-weight:700;color:var(--tx2)}
  .tiles-more>summary::-webkit-details-marker{display:none}
  .tiles-more[open]>summary{margin-bottom:10px}
  .tiles-more[open]>summary .ind{transform:rotate(45deg)}
  .tiles-more>summary .ind{display:inline-block;transition:transform .18s;font-size:17px;color:var(--tx4)}
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
  .stats{display:inline-block;font-size:13px;font-variant-numeric:tabular-nums;color:var(--tx3);background:var(--card2);border:1px solid var(--bd);border-radius:10px;padding:10px 14px;margin-top:6px}
  /* sample Q&A */
  .qa-list{list-style:none;counter-reset:qa;padding:0;margin:0}
  .qa{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:16px 16px 14px;margin-bottom:12px}
  .qa .q{font-weight:700;color:#fff;font-size:16px;margin-bottom:12px;line-height:1.4}
  .qa .q::before{counter-increment:qa;content:counter(qa) ". ";color:var(--grn-soft);font-family:var(--mono)}
  .qa-opts{display:flex;flex-direction:column;gap:8px}
${OPTION_CSS('.qa-opts .to')}
  /* tighter than the taster card — must stay AFTER OPTION_CSS to win */
  .qa-opts .to{padding:11px 13px;font-size:14px}
  /* Finish state for the static Q&A widget. Lives in the BASE stylesheet, not
     in TASTER_CSS: list pages never include the taster, which is exactly how
     they ended up with a widget that had no ending. */
  .qa-done{margin-top:16px;padding:20px 18px;border-radius:16px;text-align:center;
    border:1px solid rgba(88,204,2,.32);background:linear-gradient(160deg,rgba(88,204,2,.10) 0%,rgba(88,204,2,.02) 100%)}
  .qa-done-h{font-family:var(--mono);font-size:30px;font-weight:800;color:var(--grn-soft);line-height:1}
  .qa-done-s{margin:8px 0 16px;font-size:14.5px;color:var(--tx2)}
  .qa-done-go{display:block;padding:14px 18px;border-radius:999px;background:var(--grn,#58CC02);color:#06230C;
    font-weight:800;font-size:15.5px;text-decoration:none}
  .qa-done-go:hover{filter:brightness(1.06)}
  .qa-done-alt{display:inline-block;margin-top:12px;font-size:14px;font-weight:700;color:var(--tx3);text-decoration:underline}
  .qa-why{border-top:1px dashed var(--bd);padding-top:12px;margin-top:12px;color:var(--tx3);font-size:14px;line-height:1.55}
  .qa-why::before{content:"✓ ";color:var(--grn-soft);font-weight:800}
  .cta-row--stores{margin-top:14px}
${taster ? TASTER_CSS : ''}
${BQ_CSS}
  /* Fixed columns, never flex-wrap: a fourth item in a narrow column dropped
     onto its own full-width row and read as a layout bug. */
  .hero-facts{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);margin:16px 0 0}
  .hero-facts .hf{padding:12px 0;border-right:1px solid var(--bd);min-width:0}
  .hero-facts .hf:last-child{border-right:0}
  .hero-facts .hf b{display:block;font-size:19px;font-weight:800;letter-spacing:-.01em;font-variant-numeric:tabular-nums;color:#fff;line-height:1}
  .hero-facts .hf span{display:block;font-size:11.5px;color:var(--tx4);margin-top:5px}
  .hero-free{margin:14px 0 0;font-size:13px;color:var(--tx4)}
  .trust-note{font-size:14.5px;color:var(--tx3);line-height:1.65;border-left:2px solid var(--bd2);padding-left:14px}
</style>
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">${ld}</script>
${extraHead}
</head>`;
}

// Guarantees the hero CTA produces a visible response. See the dead-click note
// on ctaRow: anchoring to an element already in view is a no-op, so we scroll
// it in AND focus its first option. Lives in the footer so every page gets it.
const CTA_JS = `(function(){var a=document.querySelector('a[data-scrollto]');if(!a)return;a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});var o=t.querySelector('.to');if(o)setTimeout(function(){o.focus({preventScroll:true})},420)})})();`;

function footer() {
  return `<script>${CTA_JS}</script>
${shellFooter(SITE)}
${storefrontScript()}
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
  // ⚠️ 22 was never a designed number — it is the OLD two-widget layout's
  // 10-question taster plus its 12-question Q&A block, added together and
  // carried through the single-pool merge above unchanged. Measured
  // 2026-08-03: it hid 1,331 verified questions, 46% of the club bank, from
  // the pages that carry our SEO. 71 of 72 clubs were capped — Arsenal had 67
  // and showed 22.
  //
  // Raised to 40. Page LENGTH is not what limits engagement here, which was
  // the obvious objection and it is measurably wrong: /lists/serie-a-top-scorers/
  // is 14.6 screens and holds 94% scroll depth and ~5 minutes, while a 9.6-screen
  // club page holds ~20% and 2 minutes. An earlier 16.5 -> 14.2 screen cut moved
  // scroll not at all. Depth is set by intent, not by length.
  // Cap removed entirely (was 22, then 40). Measured cost of uncapping: +26KB
  // on the single heaviest page (Arsenal, 67 questions -> 140KB) and ~2KB on a
  // typical one. Zero layout cost at any size because the quiz paces in place,
  // so every question rides in crawlable server-rendered HTML without moving
  // the fold. There is no longer a number here to be wrong.
  const quizRows = arcPick(hints, hints.length);
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
      // ⚠️ NO COUNTS. See the note on the stat strip in audit-no-question-count.mjs
      // — this row printed "556 questions / 151 hard ones" live.
      { n: 'Free', label: 'always' },
      ...(pct100(all) ? [{ n: '100%', label: 'explained' }] : []),
      { n: 'Daily', label: 'fresh set' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: catCfg.name, tiers: DEFAULT_TIERS, more: Math.max(0, all.length - quizRows.length), slug: catCfg.slug, play: `${SITE.base}/play?quiz=${catCfg.slug}` }))}
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
${renderFaq(catCfg.faq, { q: `About the ${catCfg.name} quiz`, html: `${catCfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n')}\n<p class="stats">The ${esc(catCfg.name)} set runs the full range — easy starters, a medium core, and hard questions a devoted fan has to think about.</p>` })}
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
<div class="tcard" id="biq-taster" data-name="${esc(cfg.name)}" data-play="${SITE.base}/play?club=${cfg.slug}" data-store="${SITE.getApp}" data-i18n="${esc(JSON.stringify(TASTER_I18N[cfg.lang] || {}))}">
<p class="tph">${esc(c.tasterPh)} <a href="${SITE.base}/play?club=${cfg.slug}">${esc(cfg.playLabel)} →</a></p>
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
    // ⚠️ BREADCRUMB TO THE LOCALISED HUB, NOT THE ENGLISH ONE.
    // Until the hubs existed this had no choice and pointed at /quiz/ — so an
    // Italian reader who clicked the second crumb landed on an English page
    // mid-journey, and the localised cluster handed its breadcrumb authority to
    // the English hub instead of consolidating on its own. Falls back to the
    // English hub for any language that has clubs but no hub yet, which is the
    // only correct behaviour there.
    crumbItems: (() => {
      const hub = HUBS_INTL.find((h) => h.lang === cfg.lang);
      return [
        { name: 'Ball IQ', url: `${SITE.base}/` },
        hub
          ? { name: hub.h1, url: `${SITE.base}/${cfg.lang}/quiz/` }
          : { name: 'Quizzes', url: `${SITE.base}/quiz/` },
        { name: cfg.h1, url: canonical },
      ];
    })(),
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
${/* ⚠️ statsLine USED TO TAKE (n, easy, medium, hard) AND PRINT THEM.
      That made every localised page render "Ball IQ has N questions about X —
      E easy, M medium, H hard", which is the banned exact question count, in a
      language the audit gate could not read. It is the fifth way that rule has
      shipped and the first that was COMPUTED rather than typed, so no grep for
      a digit-next-to-a-noun could ever have found it in source.
      It is now a plain string. A function taking a count invites printing it. */
  ''}${renderFaq(cfg.faq, { q: c.aboutQ, html: `${introHtml}${c.statsLine ? `\n<p class="stats">${esc(c.statsLine)}</p>` : ''}` })}
</section>
${adSlot('afterFaq')}
</main>
${footer()}`;

  const dir = resolve(DIST, cfg.lang, 'quiz', cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, lang: cfg.lang, canonical, count: rows.length };
}

// ── /<lang>/quiz/ — the localised HUB ───────────────────────────────────────
// The head term in each language, and the thing sixteen localised club pages
// were pointing at nothing. Measured: `quiz de river plate` sits at 8.6 and
// `quiz del barcelona` at 6.6, while "quiz de fútbol" — which those same people
// also type — had no page whatsoever.
//
// ⚠️ ONLY BUILT FOR A LANGUAGE THAT HAS CLUBS UNDER IT. A head-term page with an
// empty grid beneath it is a thin page chasing a hard term, which is exactly how
// /lists ended up at 47% of impressions and 4% of clicks. Italian, German and
// French hubs ship WITH their club waves.
//
// The taster reuses questions already translated in clubs-<lang>.mjs — they are
// resolved against the bank by buildClubPageIntl, so a bank edit that orphans
// one still breaks the build rather than leaving the hub quoting a ghost.
function buildLangHub(cfg, clubsInLang, hubLangs) {
  if (!clubsInLang.length) {
    throw new Error(`[gen-seo] /${cfg.lang}/quiz/: refusing to build a hub with no clubs beneath it.`);
  }
  const canonical = `${SITE.base}/${cfg.lang}/quiz/`;
  const enHref = `${SITE.base}/quiz/`;
  // Self-referencing hreflang included, same as the club pages — Google wants
  // every URL in a cluster to name the whole cluster including itself.
  const alternates = [
    { hreflang: 'en', href: enHref },
    ...hubLangs.map((l) => ({ hreflang: l, href: `${SITE.base}/${l}/quiz/` })),
    { hreflang: 'x-default', href: enHref },
  ];

  // Two per club, best-effort, capped — enough to feel like a game, short
  // enough that the club grid stays above the fold on a phone.
  const taster = [];
  for (const club of clubsInLang) {
    for (const r of club.taster.slice(0, 2)) {
      if (taster.length < 6) taster.push({ q: r.q, o: r.o, a: r.a, why: r.hint });
    }
  }

  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ball IQ', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: cfg.h1, item: canonical },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: cfg.h1,
        description: cfg.description,
        url: canonical,
        inLanguage: cfg.lang,
      },
    ],
  });

  const clubCards = clubsInLang.map((c) =>
    `<li><a href="${SITE.base}/${cfg.lang}/quiz/${c.slug}/">${esc(c.name)}</a></li>`).join('\n');

  /* ⚠️ THE TASTER GOES IN THE HERO'S RIGHT COLUMN, as the second argument to
     heroTwoCol — NOT as a section below it. Getting this wrong is how the first
     render of this page shipped the literal word "undefined" twice: once where
     `lead` should have been (I passed `intro`, which heroInner does not accept)
     and once in the right column I never filled. The build was green and the
     SERP audit passed; only opening the page showed it. */
  const tasterHtml = `<section class="taster" id="taster" aria-labelledby="taster-h">
<div class="eyebrow">${esc(cfg.tasterEyebrow)}</div>
<h2 id="taster-h">${esc(cfg.tasterH)}</h2>
<div class="tcard" id="biq-taster" data-name="${esc(cfg.h1)}" data-play="${SITE.base}/play" data-store="${SITE.getApp}" data-i18n="${esc(JSON.stringify(TASTER_I18N[cfg.lang] || {}))}">
<p class="tph">${esc(cfg.tasterPh)} <a href="${SITE.base}/play">${esc(cfg.playLabel)} →</a></p>
</div>
<p class="taster-note">${esc(cfg.tasterNote)}</p>
<script type="application/json" id="biq-taster-data">${JSON.stringify(taster).replace(/</g, '\\u003c')}</script>
<script>${TASTER_JS}</script>
</section>`;

  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, ads: true, lang: cfg.lang, alternates, taster: true })}
<body>
${NAV}
<main id="main">
${heroTwoCol({
    crumbItems: [
      { name: 'Ball IQ', url: `${SITE.base}/` },
      { name: cfg.h1, url: canonical },
    ],
    // ⚠️ NO CHIP HERE. On a club page the chip is the club abbreviation ("GAL")
    // and the eyebrow is the type ("Kulüp quizi") — two different facts. A hub
    // has no abbreviation, so passing cfg.kind to both printed "Quiz de fútbol"
    // as chip AND eyebrow directly above an identical H1: the same three words
    // three times. heroInner renders no chip for a null badge.
    badge: null,
    kind: cfg.kind,
    name: cfg.h1,
    h1: cfg.h1,
    lead: cfg.intro[0],
    playHref: '#clubs',
    playLabel: cfg.playLabel,
  }, tasterHtml)}
<section class="sec narrow" id="clubs">
<h2>${esc(cfg.clubsH)}</h2>
<p class="sub">${esc(cfg.clubsSub)}</p>
<ul class="linklist">
${clubCards}
</ul>
</section>
${adSlot('afterTaster')}
<section class="sec narrow">
${cfg.intro.slice(1).map((para) => `<p class="sub">${esc(para)}</p>`).join('\n')}
</section>
<section class="sec"><div class="appband">
<div class="appband-in">
<h2>${esc(cfg.bandH)}</h2>
<p>${esc(cfg.bandP)}</p>
${storeBadges()}
</div>
</div></section>
<section class="sec narrow">
<h2>${esc(cfg.alsoH)}</h2>
<p class="sub"><a href="${enHref}" hreflang="en">${esc(cfg.h1)} — English</a></p>
</section>
</main>
${footer()}`;

  const dir = resolve(DIST, cfg.lang, 'quiz');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { lang: cfg.lang, canonical, clubs: clubsInLang.length };
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
  // ⚠️ 22 was never a designed number — it is the OLD two-widget layout's
  // 10-question taster plus its 12-question Q&A block, added together and
  // carried through the single-pool merge above unchanged. Measured
  // 2026-08-03: it hid 1,331 verified questions, 46% of the club bank, from
  // the pages that carry our SEO. 71 of 72 clubs were capped — Arsenal had 67
  // and showed 22.
  //
  // Raised to 40. Page LENGTH is not what limits engagement here, which was
  // the obvious objection and it is measurably wrong: /lists/serie-a-top-scorers/
  // is 14.6 screens and holds 94% scroll depth and ~5 minutes, while a 9.6-screen
  // club page holds ~20% and 2 minutes. An earlier 16.5 -> 14.2 screen cut moved
  // scroll not at all. Depth is set by intent, not by length.
  // Cap removed entirely (was 22, then 40). Measured cost of uncapping: +26KB
  // on the single heaviest page (Arsenal, 67 questions -> 140KB) and ~2KB on a
  // typical one. Zero layout cost at any size because the quiz paces in place,
  // so every question rides in crawlable server-rendered HTML without moving
  // the fold. There is no longer a number here to be wrong.
  const quizRows = arcPick(hints, hints.length);
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
      // ⚠️ NO COUNTS. See the note on the stat strip in audit-no-question-count.mjs
      // — this row printed "556 questions / 151 hard ones" live.
      { n: 'Free', label: 'always' },
      ...(pct100(all) ? [{ n: '100%', label: 'explained' }] : []),
      { n: 'Daily', label: 'fresh set' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: cfg.name, tiers: tiersFor(cfg.slug), more: Math.max(0, all.length - quizRows.length), badge: clubBadge, slug: cfg.slug, color: CLUB_COLOR[cfg.slug] || '', play: `${SITE.base}/play?club=${cfg.slug}` }))}
${adSlot('afterQA')}
${/* ACTION BEFORE PROSE — measured, not preference. Clarity (7 days) puts every
     club page at 13-29% scroll depth while /play reaches 95% and the /lists
     pages 94%. Engagement is fine (~2 min a session); people simply never go
     below the top fifth. Measured on /quiz/liverpool/ at 375x812 the page is
     7,804px, so 20% is 1,561px — under two screens of nine and a half.

     The old order was taster -> covers -> app CTA -> link mesh, which put
     ~1,000px of explanatory prose ABOVE the cliff and both action blocks
     below it: the CTA at 27% and the mesh at 32%. Nobody reached either.
     Swapping them lands the CTA at ~14% and the mesh at ~19%, both inside
     the fifth of the page people actually read, and demotes the prose —
     which is reference material a reader seeks out, not something they need
     first. Crawlers are unaffected either way; they render the whole DOM,
     so this is an engagement fix, not a crawl-authority one.

     ⚠️ Do NOT move adSlot('afterQA') below this — the placement policy at
     the top of this file requires ad slots to sit below appCtaBand(). */''}
${appCtaBand(cfg.name)}
<section class="sec">
<h2>More quizzes to try</h2>
${renderTiles(related)}
${/* Link to this club's TEXT Q&A page. Without this the /questions layer
     ships ORPHANED — 71 pages in the sitemap with zero inbound internal
     links, which is precisely the defect the 2026-07-28 ranking diagnosis
     found on /lists and had to go back and fix. Placed inside the mesh
     section because that sits at ~19% scroll, above the measured cliff. */''}
${clubHintRows(cfg.club).length >= 20 ? `<p style="margin:14px 2px 0;color:var(--tx2);font-size:14.5px">Want them as a printable list instead? <a href="${SITE.base}/questions/${cfg.slug}-quiz-questions-and-answers/" style="color:var(--grn);font-weight:700">${esc(cfg.name)} quiz questions and answers →</a></p>` : ''}
${/* ⚠️ THE LOCALISED LAYER WAS ORPHANED — the SAME defect as the note directly
     above, found again on 2026-08-16. All 20 localised pages had ZERO inbound
     internal links from any English page; they were sitemap-only, so they were
     discoverable but received no internal authority at all. hreflang is NOT a
     substitute: it tells Google which page serves which language, it does not
     pass weight, and Google's own guidance is that alternates should also be
     reachable by ordinary links.
     This is the cheapest link in the whole mesh — it comes off an ESTABLISHED
     English page onto a topically identical target. Galatasaray's English page
     alone drew 776 impressions in 90 days while /tr/ drew 11. */''}
${twins.length ? `<p style="margin:10px 2px 0;color:var(--tx2);font-size:14.5px">Prefer another language? ${twins.map((t) => `<a href="${SITE.base}/${t.lang}/quiz/${cfg.slug}/" hreflang="${t.lang}" style="color:var(--grn);font-weight:700">${esc(t.h1)} — ${esc(LANG_LABEL[t.lang] || t.lang)}</a>`).join(' · ')}</p>` : ''}
${renderListLinks(cfg.name)}
</section>
${renderCovers(cfg.name, false, false, `${SITE.base}/play?club=${cfg.slug}`)}
<section class="sec narrow">
${trustSection(cfg.name, all)}
<h2 id="faq">${esc(cfg.name)} quiz — FAQ</h2>
${renderFaq(cfg.faq, { q: `About the ${cfg.name} quiz`, html: `${cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n')}\n<p class="stats">The ${esc(cfg.name)} set runs the full range — easy starters, a medium core, and hard questions a devoted fan has to think about.</p>` })}
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
  // ⚠️ 22 was never a designed number — it is the OLD two-widget layout's
  // 10-question taster plus its 12-question Q&A block, added together and
  // carried through the single-pool merge above unchanged. Measured
  // 2026-08-03: it hid 1,331 verified questions, 46% of the club bank, from
  // the pages that carry our SEO. 71 of 72 clubs were capped — Arsenal had 67
  // and showed 22.
  //
  // Raised to 40. Page LENGTH is not what limits engagement here, which was
  // the obvious objection and it is measurably wrong: /lists/serie-a-top-scorers/
  // is 14.6 screens and holds 94% scroll depth and ~5 minutes, while a 9.6-screen
  // club page holds ~20% and 2 minutes. An earlier 16.5 -> 14.2 screen cut moved
  // scroll not at all. Depth is set by intent, not by length.
  // Cap removed entirely (was 22, then 40). Measured cost of uncapping: +26KB
  // on the single heaviest page (Arsenal, 67 questions -> 140KB) and ~2KB on a
  // typical one. Zero layout cost at any size because the quiz paces in place,
  // so every question rides in crawlable server-rendered HTML without moving
  // the fold. There is no longer a number here to be wrong.
  const quizRows = arcPick(hints, hints.length);
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
      { n: 'Daily', label: 'fresh set' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: cfg.name, tiers: DEFAULT_TIERS, more: Math.max(0, hints.length - quizRows.length), slug: cfg.slug }))}
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
  // Topicality, tightened twice on 2026-08-29. Round one matched entities
  // anywhere in question + OPTIONS, so a Ronaldo-as-distractor smuggled an
  // Al-Mutawa caps question onto the Ballon d'Or page. Round two proved
  // stem-matching is also insufficient: "Ronaldinho was imprisoned in 2020"
  // mentions a winner without being about the award. What survives both
  // failure modes: the stem names the list's SUBJECT (h1 minus qualifier and
  // category words), or the CORRECT ANSWER is a table entity — a question a
  // reader of this table could answer from it.
  const subject = cfg.h1.toLowerCase()
    .replace(/^(most|every|all[- ]time|the|top)\s+/g, '')
    .replace(/\s+(winners?|champions?|titles?|records?|holders?|scorers?|list)$/g, '')
    .trim();
  const stemOnSubject = (r) => subject.length >= 4 && r.q.toLowerCase().includes(subject);
  // Answer-matching uses only the SUBJECT column (first mostly-proper-name
  // column), not the whole table: club/nation side-columns let "John Charles
  // joined Juventus" onto the Ballon d'Or page because Juventus appears in
  // the winners' club column. The subject column is who the list is ABOUT.
  const colLooksProper = (ci) => {
    const cells = cfg.rows.map((row) => String(row[ci] ?? '').trim());
    const proper = cells.filter((v) => v.length >= 5 && !/^\d/.test(v) && /^[A-ZÀ-Þ]/.test(v));
    return proper.length >= cells.length * 0.6;
  };
  const subjectCol = cfg.columns.findIndex((_, ci) => colLooksProper(ci));
  const subjEnts = subjectCol < 0 ? uniq : [...new Set(cfg.rows
    .map((row) => String(row[subjectCol] ?? '').trim().toLowerCase())
    .filter((v) => v.length >= 4 && !LIST_STOP.has(v)))];
  const answerIsEntity = (r) => {
    const ans = String(r.o[r.a] ?? '').toLowerCase().trim();
    if (ans.length < 4) return false;
    return subjEnts.some((e) => e === ans || e.includes(ans) || ans.includes(e));
  };

  // No generic fallback: a page with an off-topic quiz is worse than a page
  // with none, so fewer than 5 genuinely on-topic questions means no taster.
  const onTopic = pool.filter((r) => stemOnSubject(r) || answerIsEntity(r));
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


// ── /lists PLAY MODE (scan bet #2, 2026-08-11) ─────────────────────────────
// "Name every one before you peek": the static table ships fully VISIBLE
// (crawlers and peek-first readers lose nothing); pressing Play hides the
// answer column via JS and turns the page into a Sporcle-class type-in.
// Matching is deliberately GENEROUS: a guess hits on the full value or any
// distinctive word (>=4 chars), and reveals every row it identifies —
// typing "madrid" earning both Madrids rewards knowledge, it does not cheat.
// Zero sign-up, zero bundle: this block is the whole engine.
const LIST_PLAY_JS = `(function(){
var data=document.getElementById('lp-data');if(!data)return;
var D=JSON.parse(data.textContent);
var bar=document.getElementById('lp-bar'),btn=document.getElementById('lp-start');
var wrap=document.getElementById('lp-live'),inp=document.getElementById('lp-input');
var score=document.getElementById('lp-score'),give=document.getElementById('lp-give');
var shareB=document.getElementById('lp-share');
if(!btn)return;
var playing=false,found={},total=Object.keys(D.groups).length,t0=0;
function fold(x){return x.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\\s+/g,' ').trim()}
function rows(){return Array.prototype.slice.call(document.querySelectorAll('.ltable tbody tr')).filter(function(r){return !r.classList.contains('ltable-ad')})}
function setHidden(on){rows().forEach(function(r,i){var td=r.children[D.col];if(!td)return;
  if(on&&!(found[D.rowGroup[i]])){td.classList.add('lp-hid')}else{td.classList.remove('lp-hid')}})}
function refresh(){var n=Object.keys(found).length;score.textContent=n+' / '+total+' found';
  if(n===total)finish(true)}
function reveal(g){if(found[g])return false;found[g]=1;
  rows().forEach(function(r,i){if(D.rowGroup[i]===g){r.children[D.col].classList.remove('lp-hid');r.classList.add('lp-got');
    if(!reveal._s){reveal._s=1;r.scrollIntoView({block:'center',behavior:'smooth'});setTimeout(function(){reveal._s=0},350)}}});
  return true}
function guess(v){var f=fold(v);if(!f)return;var hit=false;
  Object.keys(D.groups).forEach(function(g){if(found[g])return;
    var ks=D.groups[g];for(var k=0;k<ks.length;k++){if(ks[k]===f){hit=reveal(g)||hit;break}}});
  if(hit){inp.value='';refresh();try{if(navigator.vibrate)navigator.vibrate(8)}catch(e){}}
  else{inp.classList.add('lp-shake');setTimeout(function(){inp.classList.remove('lp-shake')},260)}}
function finish(win){playing=false;setHidden(false);inp.disabled=true;give.hidden=true;shareB.hidden=false;
  var n=Object.keys(found).length,mins=Math.round((Date.now()-t0)/6000)/10;
  score.textContent=(win?'All '+total+' named in '+mins+' min 🏆':n+' / '+total+' before peeking');
  shareB.dataset.text=(win?'I named all '+total+' — '+D.title+' in '+mins+' min 🏆':'I named '+n+' of '+total+' — '+D.title+' 👀')+'\\nTry it: '+location.origin+location.pathname}
btn.addEventListener('click',function(){playing=true;t0=Date.now();bar.hidden=true;wrap.hidden=false;
  setHidden(true);inp.focus();
  try{if(window.clarity)window.clarity('event','list-play-start')}catch(e){}});
give.addEventListener('click',function(){finish(false);
  try{if(window.clarity)window.clarity('event','list-play-giveup')}catch(e){}});
inp.addEventListener('keydown',function(e){if(e.key==='Enter')guess(inp.value)});
inp.addEventListener('input',function(){if(inp.value.length>=3)guess(inp.value)});
shareB.addEventListener('click',function(){var t=shareB.dataset.text||'';
  try{if(navigator.share){navigator.share({text:t});return}}catch(e){}
  try{navigator.clipboard.writeText(t);shareB.textContent='Copied 📋'}catch(e){}});
})();`;

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
  // Play-mode answer key. The ANSWER column is the first column that is not
  // year-shaped (on "winners by year" lists column 0 is the season). Guesses
  // match the folded full value or any distinctive word of it; rows sharing a
  // value (Real Madrid's fifteen European Cups) form one group so one guess
  // reveals them all and the score counts UNIQUE answers.
  const yearish = (v) => /^\d{4}([–-]\d{2,4})?$/.test(String(v).trim());
  const playCol = cfg.playCol ?? cols.findIndex((_, ci) => rows.filter((r) => yearish(r[ci])).length < rows.length * 0.5);
  const foldJs = (x) => String(x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const STOP = new Set(['real', 'club', 'united', 'city', 'town', 'athletic', 'atletico', 'sporting', 'inter', 'saint', 'santos', 'deportivo', 'racing', 'union', 'west', 'east', 'north', 'south']);
  const groups = {}; const rowGroup = [];
  for (const r of rows) {
    const v = foldJs(r[playCol] ?? '');
    rowGroup.push(v);
    if (!groups[v]) {
      const words = v.split(' ').filter((w) => w.length >= 4 && !STOP.has(w));
      groups[v] = [...new Set([v, ...words])];
    }
  }
  const playData = { col: playCol, title: cfg.h1, groups, rowGroup };
  const playable = playCol >= 0 && Object.keys(groups).length >= 8;

  // ⚠️ id + scroll-margin so the jump lands BELOW the sticky name-game bar
  // rather than under it. The sentence above the taster used to read "The full
  // list is right below"; measured 2026-09-02 in WebKit at 390x664 that
  // sentence sat at y=704 and the first table row at y=2,874 — 2,170px, 3.3
  // screens. It was the only navigational promise on the page and the page had
  // no in-page anchor at all except "#main".
  const table = `<div class="ltable-wrap" id="full-list"><table class="ltable">
<thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
<tbody>
${bodyRows}
</tbody></table></div>`;
  const style = `<style>
  .ltable-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--bd);border-radius:14px;background:var(--card);
    scroll-margin-top:76px;
    /* ⚠️ CSS-ONLY SCROLL SHADOW — and no backticks in here, they would close
       the template literal this CSS lives inside.
       background-attachment:local pins the two card-coloured covers to the
       CONTENT; scroll pins the two shadows to the BOX. So each shadow hides at
       its own end of the scroll and shows only when there is genuinely more
       table off-screen. Needed because the wrapper had overflow-x:auto with NO
       fade, shadow or hint on any of four pages measured: the table simply
       looked complete. */
    background-image:
      linear-gradient(to right, var(--card) 30%, rgba(0,0,0,0)),
      linear-gradient(to left,  var(--card) 30%, rgba(0,0,0,0)),
      linear-gradient(to right, rgba(0,0,0,.45), rgba(0,0,0,0) 22px),
      linear-gradient(to left,  rgba(0,0,0,.45), rgba(0,0,0,0) 22px);
    background-position:left center, right center, left center, right center;
    background-repeat:no-repeat;
    background-size:44px 100%, 44px 100%, 20px 100%, 20px 100%;
    background-attachment:local, local, scroll, scroll}
  .lt-jump{color:var(--accent,#58CC02);font-weight:700;text-decoration:underline;text-underline-offset:3px}
  .ltable{border-collapse:collapse;width:100%;font-size:15px;min-width:min(100%,520px)}
  .ltable th{text-align:left;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.04em;font-size:12px;padding:12px 14px;border-bottom:1px solid var(--bd2);white-space:nowrap;position:sticky;top:0;background:var(--card2)}
  .ltable td{padding:11px 14px;border-bottom:1px solid var(--bd);color:var(--tx2);vertical-align:top}
  .ltable tbody tr:last-child td{border-bottom:0}
  /* ⚠️ THE KEY COLUMN WAS OFF-SCREEN. Measured at 390x664: the wrapper is
     350px but the tables render 416-489px, so on /lists/premier-league-top-
     scorers/ 66 of the GOALS column's 72px sat outside the viewport, and on
     ballon-dor NATIONALITY (x 371-510) was entirely invisible — the column the
     searcher came for, on the page type that is 47% of all impressions.
     Cause was horizontal DEMAND, not min-width: 14px cell padding on four
     columns plus nowrap headers. Trimming padding and letting headers wrap
     costs vertical space, which this page has, and buys back the column. */
  @media (max-width:520px){
    .ltable{font-size:13.5px}
    .ltable th{white-space:normal;padding:10px 7px;font-size:10.5px;letter-spacing:.03em}
    .ltable td{padding:9px 7px}
  }
  /* ⚠️ min-width forces 520px of demand into a 350px wrapper on a phone. The
     media query above only wins if the override also releases this. */
  @media (max-width:520px){ .ltable{min-width:0} }
  /* A second tier for the narrowest phones and the widest tables. Ballon d'Or
     carries Year + Winner + Club(s) + Nationality, and nationalities are single
     unwrappable words ("Netherlands"), so it still ran 45px over after the
     520px tier. Any residual overflow is now at least VISIBLE — the scroll
     shadow above appears only when there is genuinely more table off-screen. */
  @media (max-width:430px){
    .ltable{font-size:12.5px}
    .ltable th{padding:9px 5px;font-size:10px}
    .ltable td{padding:8px 5px}
  }
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
<p class="sub" style="color:var(--tx3);margin:0 0 18px">${rows.length} entries${asOf} · free · hand-checked by Ball IQ</p>
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
${/* Outbound tracking rides renderQA(), so the 13 list pages with no taster —
      7 name-game-only and 6 with no widget at all — had a /play CTA nobody
      could count. Emitted here for every list page; QA_TRACK_JS guards itself
      against the double registration this creates on the other 37. */ ''}
<script>${QA_TRACK_JS}</script>
${taster.length ? `<section class="sec narrow">
<h2>Think you know this? Five questions</h2>
<p class="sub" style="color:var(--tx3);margin:-6px 0 16px">Tap to answer — no sign-up. <a href="#full-list" class="lt-jump" onclick="try{qev('list-jump')}catch(e){}">Or jump to the full list &darr;</a></p>
${renderQA(taster)}
</section>` : ''}
<section class="sec narrow">
${playable ? `<div id="lp-bar" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 12px;padding:13px 16px;border:1px solid var(--accent-b, rgba(88,204,2,.28));border-radius:13px;background:rgba(88,204,2,.06)">
<span style="font-weight:800;color:#fff">Reckon you can name them all?</span>
<button id="lp-start" type="button" style="margin-left:auto;background:var(--accent,#58CC02);color:#06230C;border:0;border-radius:999px;padding:9px 20px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit">Play — hide the answers</button>
</div>
<div id="lp-live" hidden style="position:sticky;top:0;z-index:5;display:flex;gap:8px;align-items:center;margin:0 0 12px;padding:10px 12px;border:1px solid var(--bd2);border-radius:13px;background:var(--card2,#1B1E27)">
<input id="lp-input" type="search" placeholder="Type a name…" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your guess" style="flex:1;min-width:0;background:var(--card,#13151C);border:1px solid var(--bd2);border-radius:10px;padding:10px 13px;color:#fff;font-size:16px;font-family:inherit;outline:none">
<span id="lp-score" style="font-weight:800;color:var(--accent,#58CC02);white-space:nowrap;font-size:13px">0 found</span>
<button id="lp-give" type="button" style="background:none;border:1px solid var(--bd2);border-radius:10px;padding:9px 12px;color:var(--tx3);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Give up</button>
<button id="lp-share" type="button" hidden style="background:var(--accent,#58CC02);color:#06230C;border:0;border-radius:10px;padding:9px 14px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit">Share score</button>
</div>
<style>.lp-hid{color:transparent!important;text-shadow:0 0 14px rgba(255,255,255,.45);user-select:none}.lp-got .lt-first{color:var(--accent,#58CC02)!important}.lp-shake{animation:lpsh .25s}@keyframes lpsh{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}</style>
<script type="application/json" id="lp-data">${jsonLd ? JSON.stringify(playData).replace(/</g, '\\u003c') : JSON.stringify(playData)}</script>` : ''}
${table}
${playable ? `<script>${LIST_PLAY_JS}</script>` : ''}
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
// ── /questions/<club>-quiz-questions-and-answers/ — the TEXT Q&A layer ───────
//
// WHY THIS EXISTS, and why it is not just another club page.
//
// The competitor read found our single largest asymmetry: we hold thousands of
// checked questions and had ZERO pages in the text "questions and answers"
// format. That is a DIFFERENT SERP from the club-quiz one — currently held by
// thin listicles with no schema (one ranks with 90 questions and no structured
// data at all) — so this ADDS impressions rather than fighting for position on
// terms where we are already stuck on page two.
//
// It is also the LINKABLE format. Measured 2026-08-03: our club pages sit at
// position 10-20 and convert 0.6-2.5% because of the page-one cliff, and the
// only lever on position is authority. Nobody links to a JS quiz; quizmasters
// and pub-quiz organisers cite and copy question LISTS. This is the asset that
// can earn links on its own.
//
// FORMAT — deliberate, and copied from what already ranks:
//   - questions grouped in ROUNDS of 10 (the pub-quiz convention)
//   - answers in a SEPARATE block after each round, never inline. This is the
//     whole point: a quizmaster reads the questions aloud and needs the
//     answers apart from them. Inline answers make the page useless for its
//     actual job, which is why our existing playable format does not serve it.
//   - a table of contents with in-page anchors, so a long page is navigable
//   - print styles, because these get printed for actual pub quizzes
function buildClubQuestionsPage(cfg, rows) {
  if (rows.length < 20) return null;   // too thin to be worth a page
  // ⚠️ CANONICAL POINTS AT THE /quiz/ TWIN, not self (AdSense scan 2026-08-11):
  // 75 of 282 sitemap URLs were /questions/ near-duplicates of /quiz/ pages —
  // the doorway pattern the "low value content" verdict names. The page stays
  // live for humans and print; it just stops competing with its twin in the
  // index. REVERSIBLE after approval if "with answers" rankings need it back.
  const canonical = `${SITE.base}/quiz/${cfg.slug}/`;
  const rounds = [];
  for (let i = 0; i < rows.length; i += 10) rounds.push(rows.slice(i, i + 10));

  const toc = rounds.map((_, i) => `<a href="#round-${i + 1}">Round ${i + 1}</a>`).join('\n');
  const body = rounds.map((round, ri) => {
    const qs = round.map((q, qi) => `<li id="q-${ri + 1}-${qi + 1}">${esc(q.q)}</li>`).join('\n');
    const as = round.map((q, qi) => `<li>${esc(q.o[q.a])}${q.hint ? ` <span class="qa-why">— ${esc(q.hint)}</span>` : ''}</li>`).join('\n');
    return `<section class="sec qa-round" id="round-${ri + 1}">
<h2>Round ${ri + 1}</h2>
<ol class="qa-qs">
${qs}
</ol>
<details class="qa-ans"${ri === 0 ? ' open' : ''}>
<summary>Answers — round ${ri + 1}</summary>
<ol class="qa-as">
${as}
</ol>
</details>
</section>`;
  }).join('\n');

  // FAQPage schema. No competitor in the top set for this SERP uses structured
  // data at all, so this is free differentiation on an already-clean base.
  const faqLd = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: rows.slice(0, 20).map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.hint ? `${q.o[q.a]}. ${q.hint}` : q.o[q.a] },
    })),
  });

  const html = `${head({
    title: `${cfg.name} Quiz Questions and Answers (Free, Printable)`.slice(0, 60),
    // ⚠️ "PDF" IS EARNED HERE, NOT CLAIMED. Harvested demand (2,582 real Google
    // completions, 2026-08-13) shows people search "football quiz with answers
    // pdf" and we had the word on ZERO titles despite 68 pages that do the job.
    // But a searcher typing "pdf" wants a FILE, and we generate none — so the
    // wording is "save as PDF", which is exactly what the browser's print
    // dialog does with this page. The page carries a real @media print rule
    // that drops the nav, footer and TOC, forces black-on-white and keeps a
    // round from splitting across pages, so the output is a clean document
    // rather than a screenshot of a website.
    // Saying "Printable PDF" would have been the same false promise as the
    // "nothing to install" line Alex caught under the app-store buttons.
    description: `${rows.length} ${cfg.name} quiz questions with answers, grouped in rounds. Free to read aloud, print, or save as a PDF. Written and checked by Ball IQ.`.slice(0, 155),
    canonical, ld: faqLd,
  })}
<style>
  .qa-toc{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 8px}
  .qa-toc a{border:1px solid var(--bd);border-radius:999px;padding:6px 14px;font-size:13px;font-weight:700;color:var(--tx2);text-decoration:none;background:var(--card)}
  .qa-round{border-top:1px solid var(--bd);padding-top:18px}
  .qa-qs li,.qa-as li{margin:0 0 10px;line-height:1.55;color:var(--tx2)}
  .qa-as li{color:var(--tx)}
  .qa-why{color:var(--tx3);font-weight:400}
  .qa-ans{margin:14px 0 0;border:1px solid var(--bd);border-radius:12px;background:var(--card);padding:12px 16px}
  .qa-ans summary{cursor:pointer;font-weight:800;color:var(--grn);font-size:14px}
  /* These pages get PRINTED for real pub quizzes — strip the chrome. */
  @media print{
    header,footer,.qa-toc,.bq,nav{display:none!important}
    body{background:#fff!important;color:#000!important}
    .qa-qs li,.qa-as li,.qa-why{color:#000!important}
    .qa-round{page-break-inside:avoid}
  }
</style>
${/* ⚠️ THESE PAGES HAD NO SITE NAV — the only page type on the domain without
      one. They are out of the sitemap and canonicalised to their /quiz/ twin,
      but they are still LIVE and still linked from that twin ("Want them as a
      printable list instead?"), so a real person does land here — and then had
      nowhere to go but back. The print stylesheet above already hides nav,
      header and footer, so adding it costs the printed sheet nothing. */ ''}
${NAV}
<main id="main">
<section class="sec">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <a href="${SITE.base}/quiz/${cfg.slug}/">${esc(cfg.name)} quiz</a> › <span>Questions and answers</span></nav>
<h1 style="font-size:clamp(26px,4.4vw,40px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 10px">${esc(cfg.name)} Quiz Questions and Answers</h1>
<p style="margin:0 0 6px;color:var(--tx2);max-width:64ch">${esc(cfg.name)} questions in rounds of ten, with the answers kept separate so you can read them out. Free to use for a pub quiz, a matchday WhatsApp group or your own revision — no sign-up, and the page prints cleanly.</p>
<div class="qa-toc">
${toc}
</div>
<p style="margin:10px 0 0;color:var(--tx3);font-size:13.5px">Prefer to play instead of read? <a href="${SITE.base}/quiz/${cfg.slug}/" style="color:var(--grn);font-weight:700">Take the ${esc(cfg.name)} quiz →</a></p>
</section>
${body}
<section class="sec narrow">
<h2>About these questions</h2>
<p style="margin:0 0 12px;color:var(--tx2)">Every question here is checked before it ships, and most carry a short explanation so you learn something when you get one wrong. They come from the same bank as the Ball IQ app.</p>
<p style="margin:0 0 12px;color:var(--tx2)"><a href="${SITE.base}/quiz/${cfg.slug}/" style="color:var(--grn);font-weight:700">Play the ${esc(cfg.name)} quiz →</a></p>
</section>
</main>
${footer()}`;

  const dir = resolve(DIST, 'questions', `${cfg.slug}-quiz-questions-and-answers`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: `${cfg.slug}-quiz-questions-and-answers`, name: `${cfg.name} quiz questions and answers`, count: rows.length };
}

// ── /embed/quiz/ — the iframe a partner drops into their own CMS ─────────────
//
// This is what makes the offer real. "Delivered as an embed" is the line in
// the pitch, and until now there was no embed — a publisher who said yes would
// have got HTML to paste, which most CMSes mangle.
//
// It is also the aggregator play: playfootball.games gets mirrored across five
// or more Wordle-clone sites purely because it exposes an embeddable URL. An
// embed is a link-acquisition surface that runs while you sleep.
//
// Deliberately chrome-free: no site nav, no footer, no breadcrumb. It is meant
// to sit inside someone else's page and look like part of it. The only Ball IQ
// mark is one small attribution link, which IS the point — that link is the
// entire price of the arrangement.
//
// ⚠️ noindex: this is the same questions as a real page, so letting Google
// index it would be self-inflicted duplicate content. The iframe host page
// gets the ranking; we get the link.
function buildEmbedQuizPage(hints) {
  const rows = arcPick(hints.filter((q) => q.diff !== 'easy' && q.hint), 10);
  const html = `${head({
    title: 'Ball IQ weekly football quiz',
    description: 'A ten-question football quiz.',
    canonical: `${SITE.base}/embed/quiz/`,
    ld: '', taster: true,
  }).replace('</head>', '<meta name="robots" content="noindex,follow" />\n</head>')}
<main style="padding:12px 12px 16px;max-width:760px;margin:0 auto">
${renderQuizSet(rows, { name: 'this week', tiers: DEFAULT_TIERS, more: 0, badge: '' })}
<p style="margin:14px 2px 0;font-size:12px;color:var(--tx3);text-align:center">
Quiz by <a href="${SITE.base}/?utm_source=embed" target="_blank" rel="noopener" style="color:var(--grn);font-weight:700">Ball IQ</a>
</p>
</main>`;
  const dir = resolve(DIST, 'embed', 'quiz');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: 'embed/quiz' };
}

// ── /partners/ — the page a publisher lands on from the pitch ────────────────
//
// WHY THIS EXISTS. The one lever that lifts the whole domain rather than one
// page at a time is a recurring media partnership: fcquiz.app outranks us on
// our North Star term because FotMob publishes their quiz every Friday with
// two dofollow links, syndicated across ~12 locale URLs. See
// docs/PARTNERSHIP-PITCH.md for the full mechanic and target tiers.
//
// The first reply to any such pitch is "sounds interesting, send an example".
// This is the example. It has to exist BEFORE the first email goes out, or the
// pitch points at nothing.
//
// ⚠️ DELIBERATELY UNBRANDED. It would be easy to mock this up carrying a
// target's name and logo to make the pitch concrete — do NOT. Publishing a
// page dressed as another company's before any agreement exists is passing
// off, and it is exactly the kind of thing a publisher's legal team notices
// instead of the offer. Per-partner hubs at /partners/<outlet>/ get built when
// an outlet says yes, not before.
// DELIBERATELY NOT IN THE FOOTER OR THE SITEMAP. The footer has exactly three
// site-wide link slots and they were re-pointed at pages we are trying to
// RANK (see the note in footer()); spending one on a B2B page would trade away
// real equity for nothing. This page's job is to be the destination of a link
// in an outreach email, and that works whether or not Google indexes it. If a
// partnership lands, /partners/<outlet>/ hubs DO belong in the sitemap — a
// partner's inbound link should point at an indexable page.
function buildPartnersPage(hints) {
  const canonical = `${SITE.base}/partners/`;
  // A real, playable sample — a publisher should be able to try the thing they
  // are being offered, not read a description of it. Ten questions is the
  // weekly format the pitch actually promises.
  //
  // ⚠️ NO EASY QUESTIONS HERE. arcPick front-loads two easy ones, which is
  // right for a player landing cold and wrong for a sales sample: the first
  // one shipped was "Hamburger SV compete in the top division of which
  // country?", which tells an editor our questions are trivial. A publisher is
  // judging quality, not being onboarded, so the sample opens on medium and
  // hard and every question carries an explanation.
  const showcase = hints.filter((q) => q.diff !== 'easy' && q.hint);
  const sample = arcPick(showcase.length >= 10 ? showcase : hints, 10);
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: 'Partners', item: canonical },
        ],
      },
    ],
  });
  const html = `${head({
    title: 'Free Weekly Football Quiz for Publishers | Ball IQ',
    description: 'We build a branded football quiz for your site every week, ready to publish. Free, no work at your end. See a live sample.',
    canonical, ld, taster: true,
  })}
<main>
<section class="sec">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <span>Partners</span></nav>
<div style="max-width:760px">
<div style="display:inline-flex;align-items:center;gap:8px;border:1px solid var(--bd);border-radius:999px;padding:5px 12px;margin:14px 0 14px;background:var(--card)">
<img src="/marketing/ball.png" alt="" width="18" height="18" style="display:block" />
<span style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--tx3)">Ball IQ for publishers</span>
</div>
<h1 style="font-size:clamp(28px,4.4vw,44px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.08;margin:0 0 14px">A free weekly football quiz for your readers</h1>
<p style="margin:0 0 18px;color:var(--tx2);font-size:17px;line-height:1.6;max-width:62ch">Football quizzes are some of the most-read content a football site publishes, and the most tedious to produce. We already have the questions, and we check them before they ship — so we will build yours and you can simply publish it.</p>
</div>
<div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 26px">
<div style="border:1px solid var(--bd);border-radius:10px;padding:10px 16px;background:var(--card)"><div style="font-size:22px;font-weight:900;color:#fff;line-height:1">Checked</div><div style="font-size:12px;color:var(--tx3);margin-top:2px">every question, before it ships</div></div>
<div style="border:1px solid var(--bd);border-radius:10px;padding:10px 16px;background:var(--card)"><div style="font-size:22px;font-weight:900;color:#fff;line-height:1">72</div><div style="font-size:12px;color:var(--tx3);margin-top:2px">club quizzes</div></div>
<div style="border:1px solid var(--bd);border-radius:10px;padding:10px 16px;background:var(--card)"><div style="font-size:22px;font-weight:900;color:#fff;line-height:1">Daily</div><div style="font-size:12px;color:var(--tx3);margin-top:2px">games, live now</div></div>
<div style="border:1px solid var(--bd);border-radius:10px;padding:10px 16px;background:var(--card)"><div style="font-size:22px;font-weight:900;color:var(--grn);line-height:1">Free</div><div style="font-size:12px;color:var(--tx3);margin-top:2px">and stays free</div></div>
</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:0 0 6px">
<div style="border:1px solid var(--bd);border-left:3px solid var(--grn);border-radius:12px;padding:16px 18px;background:var(--card)">
<div style="font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--grn);margin-bottom:8px">What you get</div>
<div style="color:var(--tx2);line-height:1.55;font-size:14.5px">Ten questions on the week&#39;s football, branded to your site, every Thursday — as an embed or plain HTML, whichever your CMS prefers. Any club or competition angle you want.</div>
</div>
<div style="border:1px solid var(--bd);border-left:3px solid var(--grn);border-radius:12px;padding:16px 18px;background:var(--card)">
<div style="font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--grn);margin-bottom:8px">What we ask</div>
<div style="color:var(--tx2);line-height:1.55;font-size:14.5px">A credit line and a link back. That is the whole arrangement — no contract, no exclusivity, no catch.</div>
</div>
<div style="border:1px solid var(--bd);border-left:3px solid var(--grn);border-radius:12px;padding:16px 18px;background:var(--card)">
<div style="font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--grn);margin-bottom:8px">What it costs you</div>
<div style="color:var(--tx2);line-height:1.55;font-size:14.5px">Nothing, and no ongoing work. We write it, check it and hand it over ready to publish.</div>
</div>
</div>
</section>
<section class="sec">
<h2>Try this week's sample</h2>
<p style="margin:0 0 14px;color:var(--tx2)">This is the real format, playable right here — exactly what your readers would get.</p>
${renderQuizSet(sample, { name: 'this week', tiers: DEFAULT_TIERS, more: 0, badge: '' })}
</section>
<section class="sec">
<h2>We can do daily games too</h2>
<p style="margin:0 0 12px;color:var(--tx2)">A weekly quiz is the easy start, but the same deal works for a daily game — the format that keeps readers coming back to the same page every morning rather than once a week.</p>
<p style="margin:0 0 12px;color:var(--tx2)">Here is ours, playable below — a finished puzzle from the archive, so nothing here spoils today&#39;s.</p>
</section>
${/* The real board, reused wholesale from /football-wordle/ rather than
      mocked up. footlePracticeSection() ships its own JS and a noscript
      fallback, and serves a PAST puzzle, so embedding it here cannot spoil
      today's Footle. A publisher deciding whether to run our game should be
      able to play it on the page where we ask them to. */''}
<style>
${FW_CSS}
/* Scoped to THIS page. footlePracticeSection() is shared with
   /football-wordle/, where its eyebrow ("Practice puzzle · Footle #61 ·
   originally 3 July 2026"), its own <h2> and its "nothing here spoils today's
   Footle" lede are all correct. Dropped into a sales page they read as
   duplicated and self-referential — TWO STACKED H2s and archive metadata a
   publisher has no use for. Hidden here rather than edited there, so the
   component keeps working on the page it was written for. */
#partner-footle .fw-eyebrow,
#partner-footle h2,
#partner-footle .fw-lede{display:none}
#partner-footle .fw-wrap{margin-top:0}
/* The board was hugging the left of a full-width section with a large dead
   void beside it, and its legend stranded underneath — the layout read as
   unfinished even once the borrowed chrome was hidden. Two columns on desktop
   (board left, legend right) fills the void and mirrors how the homepage
   presents Footle. Collapses to one column under 900px. */
#partner-footle .fw-wrap{display:grid;grid-template-columns:minmax(0,520px) minmax(0,1fr);gap:34px;align-items:start}
#partner-footle .fw-card{border:1px solid var(--bd);border-radius:14px;background:var(--card);padding:22px;margin:0}
#partner-footle .fw-foot{align-self:center;color:var(--tx2);font-size:14.5px;line-height:1.6;margin:0}
#partner-footle .fw-msg,#partner-footle .fw-done,#partner-footle .fw-again{grid-column:1}
@media (max-width:900px){
  #partner-footle .fw-wrap{grid-template-columns:1fr;gap:18px}
  #partner-footle .fw-foot{align-self:start}
}
</style>
<div id="partner-footle">
${footlePracticeSection()}
</div>
</section>
<section class="sec">
<h2>Drop it straight into your CMS</h2>
<p style="margin:0 0 14px;color:var(--tx2);max-width:62ch">One line of HTML. It resizes to its container, needs no script on your side, and works in any CMS that allows an iframe. Prefer plain HTML instead? We will send that.</p>
<pre style="margin:0;padding:16px 18px;border:1px solid var(--bd);border-radius:12px;background:var(--card);overflow-x:auto;color:var(--tx2);font-size:13px;line-height:1.6"><code>&lt;iframe src="${SITE.base}/embed/quiz/"
        width="100%" height="620" style="border:0"
        title="Football quiz by Ball IQ"
        loading="lazy"&gt;&lt;/iframe&gt;</code></pre>
<section class="sec">
<h2>Who is behind it</h2>
<p style="margin:0 0 12px;color:var(--tx2)">Ball IQ is a football quiz app on iOS and Android with ${'72'} club quizzes, plus two daily games — Footle, a football word game, and the Daily 7, a seven-question run that resets every morning. Most questions carry a short explanation, so readers learn something when they get one wrong.</p>
<p style="margin:0 0 12px;color:var(--tx2)">Interested, or want a sample built for your audience before you decide? Email <a href="mailto:hello@balliq.app" style="color:var(--grn)">hello@balliq.app</a> and we will send the first one with no commitment.</p>
</section>
</main>
${footer()}`;
  const dir = resolve(DIST, 'partners');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: 'partners', canonical };
}

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
  .lcard-n{color:var(--tx3);font-size:13px;font-weight:600;margin-top:auto}
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
  // ⚠️ 22 was never a designed number — it is the OLD two-widget layout's
  // 10-question taster plus its 12-question Q&A block, added together and
  // carried through the single-pool merge above unchanged. Measured
  // 2026-08-03: it hid 1,331 verified questions, 46% of the club bank, from
  // the pages that carry our SEO. 71 of 72 clubs were capped — Arsenal had 67
  // and showed 22.
  //
  // Raised to 40. Page LENGTH is not what limits engagement here, which was
  // the obvious objection and it is measurably wrong: /lists/serie-a-top-scorers/
  // is 14.6 screens and holds 94% scroll depth and ~5 minutes, while a 9.6-screen
  // club page holds ~20% and 2 minutes. An earlier 16.5 -> 14.2 screen cut moved
  // scroll not at all. Depth is set by intent, not by length.
  // Cap removed entirely (was 22, then 40). Measured cost of uncapping: +26KB
  // on the single heaviest page (Arsenal, 67 questions -> 140KB) and ~2KB on a
  // typical one. Zero layout cost at any size because the quiz paces in place,
  // so every question rides in crawlable server-rendered HTML without moving
  // the fold. There is no longer a number here to be wrong.
  const quizRows = arcPick(hints, hints.length);
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
      { n: 'Daily', label: 'fresh set' },
    ],
    playHref: '#quiz',
  }, renderQuizSet(quizRows, { name: cfg.name, tiers: DEFAULT_TIERS, more: Math.max(0, hints.length - quizRows.length), badge: deriveBadge(cfg.name), slug: cfg.slug }))}
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

  /* ⚠️ THE OTHER HALF OF THE CLUSTER. Google discards an hreflang set whose
     links are not reciprocal, so the English hub has to point back at every
     localised hub — exactly as the English club pages already point back at
     their translated twins. Without this the /<lang>/quiz/ pages would declare
     a relationship English never confirms, and the whole cluster is ignored. */
  const hubAlternates = (() => {
    const langs = HUBS_INTL.map((h) => h.lang).filter((l) => CLUBS_INTL.some((c) => c.lang === l));
    return langs.length
      ? [
        { hreflang: 'en', href: canonical },
        ...langs.map((l) => ({ hreflang: l, href: `${SITE.base}/${l}/quiz/` })),
        { hreflang: 'x-default', href: canonical },
      ]
      : [];
  })();

  const html = `${head({ title: HUB.title, description: HUB.description, canonical, ld, alternates: hubAlternates })}
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
${/* The four localised hubs had ZERO inbound internal links — not one, from any
     page on the site. hreflang alone made them sitemap-only. This row is the
     English hub's half of the pair and the only crawlable path into the
     localised layer from the English site. */''}
${(() => {
    const langs = HUBS_INTL.filter((h) => CLUBS_INTL.some((c) => c.lang === h.lang));
    return langs.length ? `<section class="sec narrow">
<h2>In your language</h2>
<p class="sub">The same quizzes, written by fans in each language — not machine-translated.</p>
<p>${langs.map((h) => `<a href="${SITE.base}/${h.lang}/quiz/" hreflang="${h.lang}" style="color:var(--grn);font-weight:700">${esc(h.h1)} — ${esc(LANG_LABEL[h.lang] || h.lang)}</a>`).join(' · ')}</p>
</section>` : '';
  })()}
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
  const pageType = cfg.slug === 'contact' ? 'ContactPage' : cfg.slug === 'terms' ? 'WebPage' : 'AboutPage';
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

// ── /404.html ──────────────────────────────────────────────────────────────
// Generated, not hand-written, so it wears the same shell as every other page.
// It used to be a static file in public/ with its own header and its own
// palette — the one page on the site that never got any redesign, and the
// 2026-09-03 production sweep found it looking like the previous site. Vercel
// serves dist/404.html for unknown routes; vite copies public/ first, so this
// overwrites that copy. noindex is the point: a mistyped URL must not become
// an indexed page (see the AdSense low-value-content history in git).
function build404Page() {
  const canonical = `${SITE.base}/404.html`;
  const cards = [
    ['All quizzes', 'Clubs, leagues and tournaments', `${SITE.base}/quiz/`],
    ['Lists and records', 'Winners, top scorers, checked and dated', `${SITE.base}/lists/`],
    ['Footle', 'The daily football word game', `${SITE.base}/football-wordle/`],
    ['Every game', 'Daily puzzles and every quiz mode', `${SITE.base}/#games`],
  ];
  const html = `${head({ title: 'Page not found — Ball IQ', description: 'That page does not exist. Everything else does.', canonical, ld: '' })
    .replace('</head>', '<meta name="robots" content="noindex,follow" />\n</head>')}
<body>
${NAV}
<main id="main">
${heroSection({
    crumbItems: [{ name: 'Home', url: `${SITE.base}/` }, { name: 'Page not found', url: canonical }],
    badge: null,
    kind: 'Error 404',
    name: 'Ball IQ',
    h1: 'That page doesn’t exist.',
    lead: 'The link may be out of date, or the address mistyped. Everything below does work, and every quiz is free to play without an account.',
    playHref: null,
    noStores: true,
  })}
<section class="sec"><div class="covers">
${cards.map(([t, d, h]) => `<a class="cov" href="${h}"><h3>${esc(t)}</h3><p>${esc(d)}</p></a>`).join('\n')}
</div>
<p class="sub" style="margin-top:18px">Something broken? <a href="${SITE.base}/contact/">Tell us</a>.</p>
</section>
</main>
${footer()}`;
  writeFileSync(resolve(DIST, '404.html'), html, 'utf8');
  console.log('  ✓ /404.html  (not-found page, shared shell)');
}

// ── The Footle island ────────────────────────────────────────────────────────
// vite build runs BEFORE this script (package.json) and writes
// dist/.vite/manifest.json; the entry src/islands/footle.jsx (vite.config.js)
// lands there with its hashed script, stylesheet and shared chunks. The page
// links the stylesheet in <head> (the board must not paint unstyled), preloads
// the shared chunks, and loads the entry as a module at the mount point. A
// missing entry fails the build: a Footle page without the game is the one
// regression this page must never ship silently.
function footleIsland() {
  const manifestPath = resolve(DIST, '.vite/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const entry = manifest['src/islands/footle.jsx'];
  if (!entry || !entry.file) throw new Error('[gen-seo] Footle island missing from dist/.vite/manifest.json — is src/islands/footle.jsx a vite input?');
  const seen = new Set();
  const chunks = [];
  const walk = (key) => {
    const e = manifest[key];
    if (!e || seen.has(key)) return;
    seen.add(key);
    (e.imports || []).forEach(walk);
    if (key !== 'src/islands/footle.jsx') chunks.push(e.file);
  };
  walk('src/islands/footle.jsx');
  const css = [...(entry.css || []), ...[...seen].flatMap((k) => manifest[k].css || [])];
  const head = [
    ...[...new Set(css)].map((f) => `<link rel="stylesheet" href="/${f}">`),
    ...chunks.map((f) => `<link rel="modulepreload" href="/${f}">`),
  ].join('\n');
  return { head, script: `<script type="module" src="/${entry.file}"></script>` };
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
// ── /fun-facts/ ──────────────────────────────────────────────────────────────
// A browse-and-share page for the "Discover" intent, and the natural landing
// spot for "football fun facts" search — a head term we had no page for.
//
// ⚠️ SELECTION IS THE HARD PART, NOT ACCURACY. v1 mined the corpus from bank
// `hint` fields — every fact true, every fact dull, because a hint exists to
// EXPLAIN an answer, not to surprise anyone. Alex, on the live page: "those
// fun facts are not fun at all, they are just facts." v2 (funFactsCurated.js)
// selects for surprise FIRST and verifies second, which is the only order that
// produces a page worth reading. Published lists were leads only; every entry
// was re-confirmed and rewritten, and each carries its confirming source.
// Several popular "facts" died in that check — see the file header.
// Local: anchor ids from theme names ("European nights" -> "european-nights").
const ffSlug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');


// ── /xi/ ─────────────────────────────────────────────────────────────────────
// ⚠️ WAS A STANDALONE FILE IN public/xi/, which meant it skipped this generator
// entirely: no site header, no breadcrumbs, no footer. Arriving from any other
// page it read as a different website — "this looks like a completely different
// page, where are the tabs on the top". The game itself now lives in
// scripts/seo/xiGame.mjs as MARKUP/CSS/JS so it can be wrapped in the same
// head(), NAV and footer as everything else, and the nav keeps one definition.
function buildXiPage() {
  const canonical = `${SITE.base}/xi/`;
  const title = 'Guess the XI — Name the Starting Eleven | Ball IQ';
  const description = 'One famous starting XI a day. Positions and shirt numbers are on the pitch — you name the players. Six misses, free, no sign-up.';
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
        { '@type': 'ListItem', position: 2, name: 'Guess the XI', item: canonical },
      ] },
      { '@type': 'Game', name: 'Guess the XI', url: canonical,
        description, genre: 'Sports trivia', inLanguage: 'en',
        publisher: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` } },
    ],
  });
  const html = `${head({ title, description, canonical, ld, ads: true })}
<body>
${NAV}
<main id="main">
<style>${XI_CSS}</style>
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <span>Guess the XI</span></nav>
${XI_MARKUP}
</section>
${appCtaBand('football')}
</main>
${footer()}
<script>${XI_JS}</script>`;
  const dir = resolve(DIST, 'xi');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
  console.log('  \u2713 /xi/  (Guess the XI, shared nav + footer)');
}


// ⚠️ A FACTS PAGE WITH NOWHERE TO GO IS A BOUNCE. The measured lesson from
// Clarity: reference pages WITHOUT something to do got ~2.3s of attention,
// while playable ones held people. Every fact that names a club or player we
// have a quiz for now carries a link to it, which does three things at once —
// gives the reader a next step, turns 42 dead-end paragraphs into a hub that
// passes authority to the money pages, and makes the page genuinely useful.
//
// Longest name first, so "Manchester United" is never matched as "Manchester
// City" would be by a shorter, earlier entry. Word-boundary anchored, and ONE
// link per fact — a paragraph wearing four links reads as spam and dilutes
// every one of them.
function factQuizLink(text) {
  const cands = [
    ...PLAYERS.map((x) => ({ name: x.name, href: `${SITE.base}/quiz/${x.slug}/`, kind: 'player' })),
    ...CLUBS.map((x) => ({ name: x.name, href: `${SITE.base}/quiz/${x.slug}/`, kind: 'club' })),
  ].sort((a, b) => b.name.length - a.name.length);
  for (const c of cands) {
    const re = new RegExp(`\\b${c.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
    if (re.test(text)) return `<a class="ff-quiz" href="${c.href}">${esc(c.name)} quiz</a>`;
  }
  return '';
}


// ── /football-quotes/ ────────────────────────────────────────────────────────
// ⚠️ NOT ANOTHER LISTICLE. The differentiator is in the data file: every entry
// carries who said it, when, and what the popular version gets WRONG. Two of
// the most repeated lines in football are misquotes, and no other page says so.
// The rejected list is published too — showing the working is the point.
function buildQuotesPage() {
  const canonical = `${SITE.base}/football-quotes/`;
  const total = QUOTES.reduce((n, t) => n + t.items.length, 0);
  const title = `${total} Football Quotes, With The Record Straight | Ball IQ`;
  // The SERP gate caught this at 172. The Shankly hook earns its place — it is
  // the whole reason to click — so the trim came out of the tail.
  const description = `Shankly never said football was more important than life and death. ${total} quotes checked against a source, with what the famous version gets wrong.`;

  let pos = 0;
  const ldItems = QUOTES.flatMap((t) => t.items.map((i) => {
    pos += 1;
    return { '@type': 'ListItem', position: pos, name: `${i.who}: ${i.q.slice(0, 90)}` };
  }));
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
        { '@type': 'ListItem', position: 2, name: 'Football quotes', item: canonical },
      ] },
      { '@type': 'ItemList', name: `${total} football quotes, checked`, url: canonical,
        numberOfItems: ldItems.length, itemListOrder: 'Unordered', itemListElement: ldItems },
      { '@type': 'Article', headline: title, description, inLanguage: 'en',
        publisher: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` } },
    ],
  });

  const toc = QUOTES.map((t) => `<a href="#${ffSlug(t.theme)}">${esc(t.theme)}</a>`).join('');
  const sections = QUOTES.map((t) => `<section class="sec narrow" id="${ffSlug(t.theme)}">
<h2>${esc(t.theme)}</h2>
<div class="qt-list">
${t.items.map((i) => `<figure class="qt">
<blockquote>${esc(i.q)}</blockquote>
<figcaption><b>${esc(i.who)}</b>${i.when ? ` <span class="qt-when">· ${esc(i.when)}</span>` : ''}</figcaption>
<p class="qt-note">${esc(i.note)} <a class="qt-src" href="${esc(i.src)}" rel="nofollow noopener" target="_blank">source</a></p>
</figure>`).join('\n')}
</div>
</section>`).join('\n');

  const style = `<style>
  .qt-toc{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}
  .qt-toc a{padding:8px 13px;border:1px solid var(--bd2);border-radius:999px;color:var(--tx2);font-size:13.5px;font-weight:700}
  .qt-toc a:hover{border-color:var(--grn);color:#fff;text-decoration:none}
  .qt-list{display:flex;flex-direction:column;gap:14px}
  .qt{margin:0;padding:18px 20px;background:var(--card);border:1px solid var(--bd);border-radius:14px}
  .qt blockquote{margin:0 0 10px;font-size:19px;line-height:1.45;color:#fff;font-weight:600;letter-spacing:-.01em}
  /* \u26A0\uFE0F NO DECORATIVE QUOTE MARKS. Several entries carry their OWN quotation
     marks \u2014 Shankly's is a reported reply and ends on one \u2014 so wrapping the
     blockquote in another pair rendered a doubled ." at the end of the card.
     The card is unmistakably a quotation from its shape; it does not need the
     ornament, and the ornament actively breaks the entries that matter most. */
  .qt figcaption{font-size:14px;color:var(--tx2);margin-bottom:9px}
  .qt figcaption b{color:var(--grn-soft)}
  .qt-when{color:var(--tx3)}
  .qt-note{margin:0;font-size:14.5px;line-height:1.6;color:var(--tx2)}
  .qt-src{font-size:12px;font-weight:600;color:var(--tx3);white-space:nowrap}
  .qt-src:hover{color:var(--grn)}
  .qt-rej{margin-top:10px;padding:14px 16px;border:1px dashed var(--bd2);border-radius:12px;color:var(--tx2);font-size:14.5px}
  .qt-rej li{margin:6px 0 0 18px;list-style:disc}
  </style>`;

  const html = `${head({ title, description, canonical, ld, ads: true })}
<body>
${NAV}
<main id="main">
${style}
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <span>Football quotes</span></nav>
<h1 style="font-size:clamp(26px,4.4vw,40px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 8px">${total} football quotes, with the record straight</h1>
<p class="sub" style="color:var(--tx3);margin:0 0 18px">Checked against a source · free · no sign-up</p>
<p style="margin:0 0 14px;color:var(--tx2)">Most football quote pages copy each other, which is how one wrong wording ends up on forty sites. The most famous line in the sport is a case in point: Bill Shankly never said football was “much more important than life and death.” Every quote below carries who said it, when, and — where it matters — what the version you know gets wrong.</p>
<div class="qt-toc">${toc}</div>
</section>
${sections}
${appCtaBand('football')}
<section class="sec narrow">
<h2>What we left out</h2>
<p style="margin:0 0 10px;color:var(--tx2)">A quotes page is only worth reading if it refuses things. These circulate constantly and none of them survived a check, so they are not above:</p>
<div class="qt-rej">
<ul>
<li>“I once cried because I had no shoes to play football, until I met a man who had no feet.” Attributed to Zidane everywhere — an older proverb with no connection to him.</li>
<li>“Then I went left again, and he went to buy a hot dog.” Attributed to Ibrahimović, and to half a dozen others, with no primary source for any version.</li>
<li>“Winning isn’t everything, it’s the only thing.” American football, and Red Sanders said it before Vince Lombardi got the credit.</li>
</ul>
</div>
</section>
</main>
${footer()}`;
  const dir = resolve(DIST, 'football-quotes');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
  console.log(`  \u2713 /football-quotes/  (${total} checked quotes, ${QUOTES.length} themes)`);
}

// ── /club-nicknames/ ─────────────────────────────────────────────────────────
// ⚠️ THE ORIGIN IS THE PRODUCT, NOT THE NICKNAME. "Arsenal are the Gunners" is
// on the badge; it earns no link and answers nothing. The searched question is
// WHY, and almost every page that ranks for it either repeats folklore or
// stops at one sentence. Any club whose origin could not be stated with
// confidence was left out of the data file rather than padded.
// Chosen as the first Discover expansion for two reasons: it is text, so it
// carries none of the licensing exposure that rules out kit history, and
// nicknames do not rot — unlike squads, records and transfer trails, this page
// needs no maintenance schedule.
// ── /football-quiz/ ──────────────────────────────────────────────────────────
// ⚠️ THE HEAD TERM HAD NO PAGE. "football quiz" is the north-star query and the
// thing competing for it was the HOMEPAGE — brand H1 ("How good is your
// football knowledge, really?"), 16 internal links, and the phrase absent from
// its heading entirely. Meanwhile every site outranking us (PlanetFootball,
// FourFourTwo, JetPunk, Sporcle) answers that query with an INDEX: here are the
// quizzes, pick one. We were entering a product homepage into an index
// competition.
//
// That is an intent mismatch, not an authority ceiling — which matters, because
// authority takes years and this does not. The same move on /lists/ took it to
// 51% of site impressions.
//
// This page exists to do the three things the homepage structurally cannot:
// carry the phrase in URL, H1 and body; index every quiz we have so the intent
// is actually served; and concentrate the internal-link signal currently
// diffused across a homepage that is also trying to sell an app.
// ⚠️ UPDATE 2026-08-16 — THE THESIS ABOVE WAS RIGHT AND THE PAGE STILL LOST.
// Measured, exact query "football quiz", 90 days, broken down BY PAGE:
//     /quiz/           2 clicks · 87 impressions · position 39.0
//     /football-quiz/  0 clicks ·  2 impressions · position  9.0
// Across all queries this page drew 5 impressions and 0 clicks in 90 days, and
// all three of its queries were "football quiz" variants /quiz/ also targets.
// Both pages led their <title> with "Football Quiz" and both were
// self-canonical: textbook cannibalisation on the north-star term.
//
// The premise that slipped is in the comment above — "the thing competing for it
// was the HOMEPAGE". By the time this page shipped that was already false:
// /quiz/ had been retitled to "Football Quiz — Free Soccer Trivia" on
// 2026-07-30 and was itself an index. So this page was built to solve a problem
// another page had already been fixed to solve, and the two then split the
// signal.
//
// AND /quiz/ WON ON THE MERITS, not just on authority: it links 127 club pages
// to this page's 91, and carries player quizzes and the localised hubs on top.
// The founding goal here — "index every quiz we have" — is better met by /quiz/
// today, because /quiz/ kept growing and this page did not.
//
// So: canonical to /quiz/, and OUT of the sitemap (a sitemap entry is a canonical
// hint, so leaving it in would contradict the tag). The page stays reachable —
// it is linked in the nav and serves direct visitors fine.
//
// ⚠️ REVERSIBLE, and worth revisiting only WITH DATA. If the exact-match URL is
// ever to be the vehicle, the correct move is to merge /quiz/'s superset of
// links into this page first and flip the canonical the other way — not to
// un-canonical it and go back to two pages competing.
// ⚠️ /daily-football-quiz/ was checked at the same time and is NOT the same
// problem: it targets "daily football quiz", a distinct query with its own
// intent and its own feature behind it. Left alone.
function buildFootballQuizPage() {
  const canonical = `${SITE.base}/quiz/`;
  const paged = new Set(CLUBS.map((c) => c.club));
  const bySlug = new Map(CLUBS.map((c) => [c.club, c.slug]));

  // Group our club pages under the league they actually play in, using the
  // hand-checked alias table — a fuzzy join here produced Angers -> Rangers.
  const groups = [];
  for (const lg of LEAGUES) {
    const rows = lg.clubs
      .map((c) => pageNameFor(c.name, paged))
      .filter(Boolean)
      .map((club) => ({ club, slug: bySlug.get(club) }))
      .filter((r) => r.slug);
    if (rows.length) groups.push({ league: lg.league, flag: lg.flag || '', rows });
  }
  // Clubs whose league we could not resolve still deserve a link — losing a
  // page from its own index is worse than an untidy heading.
  const listed = new Set(groups.flatMap((g) => g.rows.map((r) => r.club)));
  const rest = CLUBS.filter((c) => !listed.has(c.club)).map((c) => ({ club: c.club, slug: c.slug }));
  if (rest.length) groups.push({ league: 'More clubs', flag: '', rows: rest });

  // ⚠️ THE HEAD-TERM PAGE HAD NOTHING TO PLAY. Measured in WebKit (Safari's
  // real engine) on prod, 2026-09-02, iPhone 13 at 390x664: /football-quiz/
  // rendered a 6,983px document — 10.5 folds — containing exactly TWO tappable
  // buttons, and both were the consent bar's "Decline" and "Allow". Zero
  // playable elements, on the one page the whole authority strategy is aimed
  // at. /quiz/arsenal/ meanwhile puts four real answer buttons at y=467, inside
  // the first fold.
  //
  // That contradicts the site's own strongest measured finding — playable beats
  // readable; taster-less list pages hold attention for 2.3s. The component
  // already existed and shipped on club pages, leaf list pages and the
  // homepage. It was simply never placed here.
  //
  // ⚠️ DISJOINT FROM THE DAILY PAGE'S TASTER. tasterPick is deterministic (it
  // sorts by id), so reusing the same pool would serve /football-quiz/ the
  // IDENTICAL five questions as /daily-football-quiz/. Excluding the daily's
  // five by id keeps that page byte-identical and guarantees a different set
  // here, rather than relying on slice arithmetic that a future pool change
  // could silently break.
  const generalPool = QB.filter((r) => r.hint && r.type === 'mcq' && Array.isArray(r.o));
  const dailyTasterIds = new Set(tasterPick(generalPool, 5).map((r) => r.id));
  const tasterRows = tasterPick(generalPool.filter((r) => !dailyTasterIds.has(r.id)), 5);
  const hasTaster = tasterRows.length === 5;

  const clubCount = CLUBS.length;
  const title = `Football Quiz — Free Club Quizzes With Answers | Ball IQ`;
  const description = `Play a free football quiz on any of ${clubCount} clubs, plus daily games. Every question has an answer and an explanation. No sign-up.`;

  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Football Quiz',
    description,
    url: canonical,
    hasPart: groups.flatMap((g) => g.rows.slice(0, 40).map((r) => ({
      '@type': 'Quiz', name: `${r.club} Quiz`, url: `${SITE.base}/quiz/${r.slug}/`,
    }))),
  });

  // ⚠️ THE CLUB IS THE VISUAL, NOT THE TEXT. The first version rendered 76
  // identical grey pills — structurally correct and impossible to scan, because
  // a fan looks for a COLOUR before he reads a word. CLUB_BADGE and CLUB_COLOR
  // already exist for the club pages, so the index gets the same identity
  // rather than inventing a second visual language for the same clubs.
  const style = `<style>
  .fq-hero{position:relative;padding-bottom:6px}
  .fq-hero::after{content:"";display:block;width:64px;height:3px;border-radius:2px;margin-top:16px;
    background:linear-gradient(90deg,var(--grn),transparent)}
  .fq-trust{display:flex;flex-wrap:wrap;gap:7px;margin:16px 0 0;padding:0;list-style:none}
  .fq-trust li{font:700 11px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.06em;
    color:var(--tx3);background:var(--card);border:1px solid var(--bd);border-radius:999px;padding:7px 11px}
  .fq-lg{margin:0 0 30px}
  .fq-lg h3{font-size:13px;margin:0 0 12px;color:var(--tx3);letter-spacing:.08em;text-transform:uppercase;
    font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;display:flex;align-items:center;gap:9px}
  .fq-lg h3::after{content:"";flex:1;height:1px;background:var(--bd)}
  /* Auto-fill so the index uses the full width of a desktop instead of
     stranding it in a 760px column with half the screen empty. */
  .fq-grid{display:grid;gap:9px;grid-template-columns:repeat(auto-fill,minmax(168px,1fr))}
  .fq-club{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--bd);
    border-radius:12px;background:var(--card);min-height:46px;transition:border-color .15s,background .15s,transform .15s}
  .fq-club:hover{border-color:var(--club,var(--grn));background:var(--card2);text-decoration:none;transform:translateY(-1px)}
  .fq-badge{flex:0 0 auto;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;
    font:800 10.5px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.02em;
    background:var(--club,#2A2F3A);color:var(--club-ink,#fff);box-shadow:inset 0 0 0 1px rgba(255,255,255,.10)}
  .fq-club span{color:var(--tx2);font-size:13.5px;font-weight:700;line-height:1.2}
  .fq-club:hover span{color:#fff}
  .fq-modes{display:grid;gap:11px;grid-template-columns:1fr}
  @media(min-width:700px){.fq-modes{grid-template-columns:1fr 1fr}}
  .fq-mode{display:block;padding:17px 18px;border:1px solid var(--bd2);border-radius:15px;
    background:linear-gradient(var(--card2),var(--card));position:relative;overflow:hidden;transition:border-color .15s,transform .15s}
  .fq-mode::before{content:"";position:absolute;inset:0 0 auto;height:2px;background:var(--accent,var(--grn));opacity:.85}
  .fq-mode:hover{border-color:var(--accent,var(--grn));text-decoration:none;transform:translateY(-2px)}
  .fq-mode em{font-style:normal;font:700 10px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;
    text-transform:uppercase;color:var(--accent,var(--grn));display:block;margin-bottom:7px}
  .fq-mode b{display:block;color:#fff;font-size:16.5px;margin-bottom:4px;letter-spacing:-.01em}
  .fq-mode span{color:var(--tx3);font-size:13.5px;line-height:1.5}
  </style>`;

  // Club colours run from #FFFFFF (Real Madrid) to #000000 (Juventus), so the
  // badge text colour is computed rather than assumed — a white-on-white or
  // black-on-black badge is invisible, and both exist in the map.
  const inkFor = (hex) => {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return '#fff';
    const [r, g2, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (0.2126 * r + 0.7152 * g2 + 0.0722 * b) > 150 ? '#0B0C0F' : '#fff';
  };
  const groupHtml = groups.map((g) => `<div class="fq-lg"><h3>${g.flag ? g.flag + ' ' : ''}${esc(g.league)}</h3><div class="fq-grid">${
    g.rows.map((r) => {
      const col = CLUB_COLOR[r.slug] || '';
      const badge = CLUB_BADGE[r.slug] || r.club.slice(0, 3).toUpperCase();
      const vars = col ? ` style="--club:${col};--club-ink:${inkFor(col)}"` : '';
      return `<a class="fq-club" href="${SITE.base}/quiz/${r.slug}/"${vars}><i class="fq-badge">${esc(badge)}</i><span>${esc(r.club)}</span></a>`;
    }).join('')
  }</div></div>`).join('');

  const html = `${head({ title, description, canonical, ld, taster: hasTaster })}
<body>
${NAV}
<main id="main">
${style}
<section class="sec narrow fq-hero">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <span>Football quiz</span></nav>
<h1 style="font-size:clamp(30px,5.2vw,46px);font-weight:900;letter-spacing:-.03em;color:#fff;line-height:1.05;margin:10px 0 10px">Football quiz</h1>
</section>

${hasTaster ? renderTaster(tasterRows, 'football', `${SITE.base}/play`) : ''}

<section class="sec narrow">
<p style="margin:0;color:var(--tx2);font-size:16.5px;max-width:62ch">Pick a club and play, or take one of the daily games. Every question is written and fact-checked by hand rather than scraped, and every answer comes with the reason it is the answer — the part most football quizzes leave out.</p>
<ul class="fq-trust"><li>FREE</li><li>NO SIGN-UP</li><li>ANSWERS EXPLAINED</li><li>${clubCount} CLUBS</li></ul>
</section>

<section class="sec narrow">
<h2 style="font-size:19px;margin:0 0 12px">Daily games</h2>
<div class="fq-modes">
<a class="fq-mode" href="${SITE.base}/football-wordle/" style="--accent:#58CC02"><em>DAILY</em><b>Footle</b><span>The football Wordle — guess the player's surname in six.</span></a>
<a class="fq-mode" href="${SITE.base}/mystery-player/" style="--accent:#FFC53D"><em>DAILY</em><b>Mystery Player</b><span>Guess the footballer; every guess is ranked by how close it is.</span></a>
<a class="fq-mode" href="${SITE.base}/transfer-trail/" style="--accent:#4EA8FF"><em>DAILY</em><b>Transfer Trail</b><span>Name the player from his club-by-club career path.</span></a>
<a class="fq-mode" href="${SITE.base}/daily-football-quiz/" style="--accent:#FF6B9D"><em>EVERY DAY</em><b>Daily 7</b><span>Seven fresh questions every day, same seven for everyone.</span></a>
</div>
</section>

<section class="sec">
<h2 style="font-size:19px;margin:0 0 4px">Club quizzes</h2>
<p style="margin:0 0 16px;color:var(--tx3);font-size:14px">Every club we cover, by league. Each one is a full quiz with answers and explanations.</p>
${groupHtml}
</section>

${appCtaBand('football')}

<section class="sec narrow">
<h2>Also worth a look</h2>
<div class="fq-modes">
<a class="fq-mode" href="${SITE.base}/lists/"><b>Records &amp; lists</b><span>Winners, top scorers and record books, settled and sourced.</span></a>
<a class="fq-mode" href="${SITE.base}/club-nicknames/"><b>Club nicknames</b><span>Why the Gunners, the Toffees and the Culés are called that.</span></a>
<a class="fq-mode" href="${SITE.base}/fun-facts/"><b>Football fun facts</b><span>The genuinely surprising ones, each checked against a source.</span></a>
<a class="fq-mode" href="${SITE.base}/football-quotes/"><b>Football quotes</b><span>With the record straight on the ones everybody misquotes.</span></a>
</div>
</section>
</main>
${footer()}`;
  const dir = resolve(DIST, 'football-quiz');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
  console.log(`  ✓ /football-quiz/  (${clubCount} clubs across ${groups.length} groups)`);
}

function buildNicknamesPage() {
  const canonical = `${SITE.base}/club-nicknames/`;
  const bySlug = new Map(NICKNAMES.map((n) => [n.slug, n]));
  const clubSlugs = new Set(CLUBS.map((c) => c.slug));
  const title = 'Football Club Nicknames And Where They Come From | Ball IQ';
  const description = 'Why Arsenal are the Gunners, Everton the Toffees and Barcelona the Culés. The real origin behind each nickname, not the folklore.';

  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: NICKNAMES.map((n) => ({
      '@type': 'Question',
      name: `Why are ${n.club} called ${n.nick.split(' / ')[0]}?`,
      acceptedAnswer: { '@type': 'Answer', text: n.origin },
    })),
  });

  const style = `<style>
  .nk-list{display:flex;flex-direction:column;gap:12px}
  .nk-row{padding:16px 18px;background:var(--card);border:1px solid var(--bd);border-radius:14px}
  .nk-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:7px}
  .nk-head b{font-size:17px;color:#fff;font-weight:800;letter-spacing:-.01em}
  .nk-head b a{color:#fff}
  .nk-head span{font:700 12px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.06em;
    color:var(--grn-soft);background:rgba(88,204,2,.12);padding:5px 8px;border-radius:6px}
  .nk-row p{margin:0;color:var(--tx2);font-size:14.5px;line-height:1.6}
  </style>`;

  const rows = NICK_REGIONS.map(([region, slugs]) => {
    const items = slugs.map((sl) => bySlug.get(sl)).filter(Boolean).map((n) => {
      // Only link when the club actually has a quiz page — a dead link on a
      // reference page is worse than no link.
      const name = clubSlugs.has(n.slug)
        ? `<a href="${SITE.base}/quiz/${n.slug}/">${esc(n.club)}</a>`
        : esc(n.club);
      return `<div class="nk-row"><div class="nk-head"><b>${name}</b><span>${esc(n.nick)}</span></div><p>${esc(n.origin)}</p></div>`;
    }).join('');
    return items ? `<section class="sec narrow"><h2>${esc(region)}</h2><div class="nk-list">${items}</div></section>` : '';
  }).join('');

  const html = `${head({ title, description, canonical, ld })}
<body>
${NAV}
<main id="main">
${style}
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <span>Club nicknames</span></nav>
<h1 style="font-size:clamp(26px,4.4vw,40px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 8px">Football club nicknames, and where they actually come from</h1>
<p class="sub" style="color:var(--tx3);margin:0 0 18px">Sourced origins · free · no sign-up</p>
<p style="margin:0 0 14px;color:var(--tx2)">The Gunners were an armaments factory. The Toffees were a sweet shop. The Culés were a row of backsides on a wall. Most nickname pages stop at the name; the interesting part is the why, so that is what each entry gives — with a quiz on every club we cover.</p>
</section>
${rows}
<section class="sec narrow">
<h2>Why some clubs are missing</h2>
<p style="margin:0;color:var(--tx2)">A nickname is easy to list and hard to source. Where the origin is genuinely disputed — or where the only explanation available is a story with no foundation — the club is left off this page rather than given a confident-sounding guess. Bournemouth are here with both of their competing explanations precisely because neither is settled.</p>
</section>
</main>
${footer()}`;
  const dir = resolve(DIST, 'club-nicknames');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
  console.log(`  \u2713 /club-nicknames/  (${NICKNAMES.length} clubs, ${NICK_REGIONS.length} regions)`);
}

function buildFunFactsPage() {
  const canonical = `${SITE.base}/fun-facts/`;
  const total = FUN_FACTS.reduce((n, t) => n + t.facts.length, 0);
  const title = `${total} Football Facts That Sound Made Up (But Aren't) | Ball IQ`;
  // <=160 chars: the SERP audit fails the build above that, and a truncated
  // description is a wasted snippet on the one page built to be browsed.
  const description = `A 149-0 protest, a space-travel contract clause, a fake international. ${total} football facts that sound invented — every one checked, with the source.`;

  // ⚠️ ItemList, NOT just Article. This page is a numbered list of N facts and
  // Google treats ItemList as a distinct, richer entity for exactly this shape.
  // Emitting only Article described the wrapper and left the actual content —
  // the thing people search for — structurally invisible.
  let ldPos = 0;
  const ldItems = FUN_FACTS.flatMap((t) => t.facts.map((f) => {
    ldPos += 1;
    return { '@type': 'ListItem', position: ldPos, name: f.t.slice(0, 110), description: f.t };
  }));
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
        { '@type': 'ListItem', position: 2, name: 'Football fun facts', item: canonical },
      ] },
      { '@type': 'ItemList', name: `${total} football facts that sound made up`,
        url: canonical, numberOfItems: ldItems.length, itemListOrder: 'Unordered',
        itemListElement: ldItems },
      { '@type': 'Article', headline: `${total} football fun facts`, description,
        author: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` },
        publisher: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` },
        mainEntityOfPage: canonical, isAccessibleForFree: true },
    ],
  });

  const toc = FUN_FACTS.map((t) => `<a href="#${ffSlug(t.theme)}">${esc(t.theme)}</a>`).join('');
  let n = 0;
  const sections = FUN_FACTS.map((t) => `<section class="sec narrow" id="${ffSlug(t.theme)}">
<h2>${esc(t.theme)}</h2>
<ol class="ff-list" start="${n + 1}">
${t.facts.map((f) => { n += 1; const q = factQuizLink(f.t); return `<li class="ff"><span class="ff-n">${n}</span><p>${esc(f.t)}${f.src ? ` <a class="ff-src" href="${esc(f.src)}" rel="nofollow noopener" target="_blank">source</a>` : ''}${q ? ` ${q}` : ''}</p></li>`; }).join('\n')}
</ol>
</section>`).join('\n');

  const style = `<style>
  .ff-src{font-size:12px;font-weight:600;color:var(--tx3);white-space:nowrap}
  .ff-quiz{display:inline-block;margin-left:6px;font-size:12px;font-weight:700;color:var(--grn-soft);
    border:1px solid rgba(88,204,2,.28);border-radius:999px;padding:2px 9px;white-space:nowrap}
  .ff-quiz:hover{background:rgba(88,204,2,.10);color:#fff;text-decoration:none}
  .ff-src:hover{color:var(--grn)}
  .ff-toc{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}
  .ff-toc a{padding:8px 13px;border:1px solid var(--bd2);border-radius:999px;color:var(--tx2);font-size:13.5px;font-weight:700}
  .ff-toc a:hover{border-color:var(--grn);color:#fff;text-decoration:none}
  .ff-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
  .ff{display:flex;gap:14px;align-items:flex-start;padding:15px 17px;background:var(--card);
    border:1px solid var(--bd);border-radius:14px}
  .ff-n{flex:0 0 auto;min-width:26px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:13px;font-weight:700;color:var(--grn);padding-top:2px}
  .ff p{margin:0;color:var(--tx1);font-size:15.5px;line-height:1.55}
  @media(max-width:560px){ .ff{padding:13px 14px;gap:11px} .ff p{font-size:15px} }
  </style>`;

  const html = `${head({ title, description, canonical, ld, ads: true })}
<body>
${NAV}
<main id="main">
${style}
<section class="sec narrow">
<nav class="crumbs" aria-label="Breadcrumb"><a href="${SITE.base}/">Home</a> › <span>Football fun facts</span></nav>
<h1 style="font-size:clamp(26px,4.4vw,40px);font-weight:900;letter-spacing:-.02em;color:#fff;line-height:1.1;margin:10px 0 8px">${total} football fun facts</h1>
<p class="sub" style="color:var(--tx3);margin:0 0 18px">Checked before they shipped · free · no sign-up</p>
<p style="margin:0 0 14px;color:var(--tx2)">Most football fact lists are scraped from each other, which is how the same wrong claim ends up on forty sites — and how “San Marino have only ever won once” is still being republished two years after they won again. Every line below was checked against a reliable source before it shipped, and carries a link to that source so you can check us. Several famous “facts” did not survive and are simply not here.</p>
<div class="ff-toc">${toc}</div>
</section>
${sections}
${adSlot('afterQA')}
${appCtaBand('football')}
<section class="sec narrow">
<h2>Where these come from</h2>
<p style="margin:0 0 14px;color:var(--tx2)">Ball IQ is a football quiz built on a hand-written question bank. Most answers carry a short explanation — the season it happened, who else was involved, what made it matter — and those explanations are where these facts come from. They go through a generation pass, an examiner pass and an adversarial fact-check before they ship, and anything contested gets dropped rather than guessed.</p>
<p style="margin:0;color:var(--tx2)">Think you knew them? <a href="${SITE.base}/quiz/">Pick a quiz</a> and find out — or try the <a href="${SITE.base}/football-wordle/">daily football word game</a>, <a href="${SITE.base}/transfer-trail/">Transfer Trail</a> and <a href="${SITE.base}/mystery-player/">Mystery Player</a>.</p>
</section>
<section class="sec narrow">
<h2>Football fun facts — FAQ</h2>
${renderFaq([
  { q: 'Are these football facts actually true?', a: 'Every fact on this page is an explanation written for a Ball IQ quiz answer, and the bank goes through a generation pass, an examiner pass and an adversarial fact-check before anything ships. Where a claim is contested or cannot be verified, we drop it instead of guessing — which is why this list is shorter than it could be.' },
  { q: 'Can I use these facts in a pub quiz?', a: 'Yes, they are free to use. If you want a ready-made round with the answers kept separate, the club quiz pages have printable question-and-answer sets for dozens of clubs.' },
  { q: 'How often is the list updated?', a: 'It is regenerated from the question bank on every deploy, so as the bank grows and gets corrected, this page follows automatically rather than going stale on its own.' },
  { q: 'Where can I test myself on these?', a: 'Every fact has a quiz behind it. Start with the free quiz hub, or play the Daily 7 for seven fresh questions everyone in the world gets on the same day.' },
])}
</section>
${adSlot('afterFaq')}
</main>
${footer()}`;
  const dir = resolve(DIST, 'fun-facts');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
  console.log(`  \u2713 /fun-facts/  (${total} verified facts, ${FUN_FACTS.length} themes)`);
}

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
  .method{margin-top:22px;padding:14px 16px;background:var(--card);border:1px solid var(--bd);border-left:3px solid var(--club,var(--grn));border-radius:0 12px 12px 0;font-size:13.5px;line-height:1.6;color:var(--tx3)}
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

// ── Playable Footle practice board (/football-wordle/) ───────────────────────
// WHY THIS EXISTS. /football-wordle/ was the only page targeting "footle" and it
// registered ZERO impressions over 28 days — not ranked badly, NOT INDEXED. It
// was technically spotless (self-canonical, in the sitemap, linked from 191
// pages) and shipped 0 <button> and 0 <input>: prose ABOUT a game, competing
// against sites that ARE the game. Club pages already proved the fix in this
// repo — the playable taster put 115 buttons on /quiz/liverpool/.
//
// ⚠️ THE STALENESS TRAP, which is the whole design constraint. This page is
// generated at BUILD time; the Footle answer changes DAILY. A board baked with
// today's answer is wrong by tomorrow morning and stays wrong until the next
// deploy. So the board is seeded from a PAST puzzle, which is fixed forever:
//   - It can never go stale — a past answer does not change.
//   - It can never leak a future answer — we only ever look backwards.
//   - It is not a spoiler — api/footle.js already publishes a rolling archive
//     of past answers openly.
// Today's real puzzle lives at /footle and is linked prominently instead.
const PRACTICE_LOOKBACK_DAYS = 30;

// Deterministic at build time, and deliberately conservative:
//   - starts 30 days back, so the puzzle is long finished and well inside the
//     90-day archive api/footle.js already serves;
//   - REQUIRES the day to sit inside WORDLE_ANSWER_LOG. Days past the log fall
//     through to the stride formula, whose modulo base is WORDLE_PLAYERS.length
//     — that answer silently rewrites itself the day anyone appends a player.
//     Only the frozen log is safe to bake into a static file;
//   - skips 4-letter answers to honour the shipped 5-8 rule (Alex, 2026-07-29:
//     a 4-wide grid "looks uglier"). Early log entries predate that rule.
// The walk is bounded by `number < 1` (Footle #1), NOT by a fixed number of
// steps. An earlier 400-step cap looked harmless and was a time bomb: once
// today's puzzle number passes WORDLE_ANSWER_LOG.length + 400, every candidate
// day is outside the frozen log, the walk runs out of steps and the BUILD dies.
// Simulating a build on each of the next 1,095 days caught it — 387 of them
// failed. Walking all the way back to #1 means the page degrades to pinning an
// older logged puzzle instead of breaking the deploy.
function pickPracticePuzzle() {
  const today = getWordleDayIndex();
  for (let back = PRACTICE_LOOKBACK_DAYS; ; back++) {
    const dayIndex = today - back;
    const number = dayIndex - WORDLE_ANCHOR_DAY + 1;
    if (number < 1) break;
    if (number > WORDLE_ANSWER_LOG.length) continue;
    const answer = getWordleAnswerForDayIndex(dayIndex);
    if (answer.length < 5 || answer.length > 8) continue;
    return { dayIndex, number, answer };
  }
  throw new Error(
    '[footle] no past puzzle found in WORDLE_ANSWER_LOG for the practice board. ' +
    'Refusing to bake today\'s (or a formula-derived) answer into a static page.',
  );
}

// Deterrence, not security. Keeps the answer out of plain view-source so a
// curious reader does not spoil their own practice game by accident. Anyone who
// wants it can still read it off /football-wordle/answer/ — that is fine, it is
// a finished puzzle. encodeURIComponent first so diacritics in the full name
// (Mbappé, Šuker) survive the byte-oriented atob() on the client.
const fwCloak = (s) =>
  Buffer.from(encodeURIComponent(String(s).split('').reverse().join('')), 'utf8').toString('base64');

const FW_KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

// Every control is a REAL <button> in the emitted HTML, not a <b> with a click
// handler (that shipped once: unfocusable, invisible to screen readers) and not
// JS-injected (a crawler — and `grep '<button'` on dist/ — would see nothing).
// JS only attaches behaviour to markup that is already there.
function fwKeyboardHtml() {
  const key = (k, label, text, wide) =>
    `<button type="button" class="fw-k${wide ? ' fw-wide' : ''}" data-k="${k}"${wide ? ' data-w="1"' : ''} aria-label="${label}">${text}</button>`;
  const rows = FW_KEY_ROWS.map((row, i) => {
    let inner = row.map((k) => key(k, `Letter ${k}`, k)).join('');
    if (i === 2) {
      inner = key('ENTER', 'Submit guess', 'Enter', true) + inner + key('DEL', 'Delete last letter', '⌫', true);
    }
    return `<div class="fw-kr">${inner}</div>`;
  }).join('\n');
  return `<div class="fw-kb" role="group" aria-label="Footle keyboard">\n${rows}\n</div>`;
}

function fwBoardHtml(n) {
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const tiles = [];
    for (let c = 0; c < n; c++) {
      tiles.push(`<div class="fw-t" role="gridcell" aria-label="Row ${r + 1}, letter ${c + 1}, empty"></div>`);
    }
    rows.push(`<div class="fw-row" role="row">${tiles.join('')}</div>`);
  }
  return `<div class="fw-board" role="grid" aria-label="Footle practice board, six guesses of ${n} letters">\n${rows.join('\n')}\n</div>`;
}


// ⚠️ THE RULES WERE NEVER EXPLAINED HERE. This page dropped a visitor at an
// empty grid: no worked example, no colour legend. The homepage's FootleBand
// shows both, which is why Alex read the homepage treatment as the better one
// ("the design of footle looks better on the homepage than this. the grid and
// explanation etc"). Ported rather than reinvented, so the two surfaces teach
// the game the same way. Static markup — no JS, no layout shift, and it is
// crawlable text explaining what a "football Wordle" actually is, which the
// page previously only asserted.
// ⚠️ COMPUTED, NEVER HAND-WRITTEN. The first version hardcoded the marks and
// got them WRONG in a panel whose entire job is teaching the rules: LAPORTE vs
// HAALAND has the L in the word but misplaced (yellow) and the second A exact
// (green) — the hardcoded array had those inverted and also painted the T
// yellow when HAALAND contains no T. The homepage never had this bug because
// FootleBand calls gradeGuess(). So does this now: the same function that
// grades a real guess grades the example, and the illustration cannot disagree
// with the game.
const FW_EG_WORD = 'LAPORTE';
const FW_EG_ANSWER = 'HAALAND';
function fwExampleHtml() {
  const marks = gradeGuess(FW_EG_WORD, FW_EG_ANSWER);
  const tiles = FW_EG_WORD.split('')
    .map((ch, i) => `<span class="fw-eg-t" data-m="${marks[i]}">${ch}</span>`).join('');
  return `<div class="fw-eg">
<div class="fw-eg-lab">If you guessed <b>Laporte</b> and the answer was <b>Haaland</b>:</div>
<div class="fw-eg-grid" aria-hidden="true">${tiles}</div>
<ul class="fw-legend">
<li><span class="fw-sw" data-k="green"></span>Right letter, right place</li>
<li><span class="fw-sw" data-k="yellow"></span>In the surname, wrong place</li>
<li><span class="fw-sw" data-k="grey"></span>Not in it</li>
</ul>
</div>`;
}

// Today's board on this page. The component's stylesheet (src/games/footle.css)
// speaks the app's token names; until the shared tokens.css lands they are
// defined here on the host, with the same values app.css gives them. The
// 20px side padding is load-bearing: .wd-grid and .wd-keyboard escape their
// screen's padding with margin-inline:-20px, so the host must supply exactly
// that much or the keyboard overflows the card on a phone.
const FW_TODAY_CSS = `
  /* This page's hero is a masthead, not a pitch: the game is the pitch. On a
     375px phone the shared hero put the board 429px down (measured on the
     first build) — two-line h1, a lead AND a stat line saying the same thing,
     46px of top padding. Tightened here only; every other page keeps the
     shared hero as it is. */
  .hero{padding:20px 0 12px}
  .hero h1{font-size:clamp(28px,7.4vw,40px);margin-bottom:10px}
  .hero-lead{font-size:15px;margin:0}
  /* No negative margin here: the first cut kept one from the practice
     section's trick and the masthead overprinted the lead's second line. */
  .fw-today{padding:0 0 8px;margin-top:0}
  .fw-mast{margin:0 0 10px;font-size:13.5px;color:var(--tx3);font-variant-numeric:tabular-nums}
  .fw-mast b{color:var(--tx);font-weight:800}
  .fw-host{max-width:520px;margin:0 auto;padding:0 20px;
    --s1:#13151C;--s2:#1B1E27;--s3:#232631;--border:#242730;--border2:#2F3240;
    --text:#FFFFFF;--t1:#FFFFFF;--t2:#9BA0B8;--t3:#7E828C;--accent:#58CC02;
    --btn-shine:inset 0 1.5px 0 rgba(255,255,255,0.30), inset 0 -2px 0 rgba(0,0,0,0.12);
    --btn-glow:0 8px 22px -8px rgba(88,204,2,0.55);--wd-edge:#5A5E6E;--biq-consent-h:0px}
  .fw-host .wd-screen{min-height:0}
  .fw-toast{max-width:520px;margin:6px auto 0;text-align:center;font-size:13px;color:var(--tx3)}
  .fw-fold{border-top:1px solid var(--bd);margin-top:6px}
  .fw-fold>summary{cursor:pointer;list-style:none;padding:16px 0;font-size:15px;font-weight:700;color:var(--tx2)}
  .fw-fold>summary::-webkit-details-marker{display:none}
  .fw-fold>summary::before{content:"+ ";color:var(--grn-soft)}
  .fw-fold[open]>summary::before{content:"− "}
  .fw-fold .fw-wrap{margin-top:0;padding-top:0}
`;
const FW_CSS = `
  /* ⚠️ THE BOARD SHOULD BE THE NEXT THING YOU SEE. hero padding-bottom 40px +
     .sec padding-top 30px + the wrap's own margin stacked into a dead band
     between "free · no sign-up · new footballer every day" and the puzzle —
     reported from the live page. On a page whose entire job is "play a Footle
     right here", pushing the board below the fold is the one layout mistake
     that costs the most. Negative top margin cancels the doubled padding
     without touching .sec, which every other page relies on. */
  .fw-wrap.sec{padding-top:0;margin-top:-26px}
  @media (max-width:700px){ .fw-wrap.sec{margin-top:-18px} }
  .fw-eg{margin:0 0 20px;padding:15px 17px;background:#181A22;border:1px solid #222634;border-radius:14px}
  .fw-eg-lab{font-size:14px;color:#9BA0B8;margin-bottom:10px}
  .fw-eg-lab b{color:#fff}
  .fw-eg-grid{display:grid;grid-template-columns:repeat(7,min(40px,8.5vw));gap:5px;margin-bottom:12px}
  .fw-eg-t{display:flex;align-items:center;justify-content:center;aspect-ratio:1;border-radius:7px;
    font-weight:800;font-size:15px;color:#fff;background:#2F3240}
  .fw-eg-t[data-m="green"]{background:#58CC02;color:#06230C}
  .fw-eg-t[data-m="yellow"]{background:#FFC53D;color:#2A1F00}
  .fw-legend{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;color:#9BA0B8}
  .fw-legend li{display:flex;align-items:center;gap:7px}
  .fw-sw{width:13px;height:13px;border-radius:4px;background:#2F3240;flex:0 0 auto}
  .fw-sw[data-k="green"]{background:#58CC02}
  .fw-sw[data-k="yellow"]{background:#FFC53D}
  .fw-wrap{margin-top:8px;scroll-margin-top:72px}
  .fw-eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9BA0B8;margin-bottom:8px}
  .fw-lede{font-size:15.5px;line-height:1.6;color:#9BA0B8;max-width:62ch;margin:0 0 18px}
  .fw-card{background:var(--card);border:1px solid #6A6E80;border-radius:20px;padding:20px 16px 22px;max-width:560px}
  .fw-board{display:grid;gap:6px;margin:0 auto;max-width:min(100%,calc(var(--fw-n) * 60px))}
  .fw-row{display:grid;grid-template-columns:repeat(var(--fw-n),1fr);gap:6px}
  .fw-t{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:2px solid #6A6E80;border-radius:8px;background:#0F1116;color:#F0F1F5;font-family:var(--mono);font-weight:700;font-size:clamp(17px,6vw,28px);line-height:1;text-transform:uppercase;user-select:none}
  .fw-t.fw-fill{border-color:#8E92A0;background:#1B1E27}
  /* Colour is set by the CLASS, never by an animation keyframe — so the
     reduced-motion rule below can switch the flip off and still land on the
     correct end state. */
  .fw-t.fw-green{background:#58CC02;border-color:#58CC02;color:#06230C;animation:fwflip .45s ease both}
  .fw-t.fw-yellow{background:#FFC107;border-color:#FFC107;color:#2A1B00;animation:fwflip .45s ease both}
  .fw-t.fw-grey{background:#3E4150;border-color:#6A6E80;color:#E8EAF0;animation:fwflip .45s ease both}
  @keyframes fwflip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}
  @keyframes fwshake{10%,90%{transform:translateX(-2px)}30%,70%{transform:translateX(4px)}50%{transform:translateX(-4px)}}
  .fw-row.fw-shake{animation:fwshake .42s ease}
  .fw-kb{display:grid;gap:7px;margin-top:20px}
  .fw-kr{display:flex;gap:5px;justify-content:center}
  .fw-k{flex:1 1 0;min-width:0;min-height:48px;padding:0 2px;border:1px solid #6A6E80;border-radius:8px;background:#343846;color:#F0F1F5;font:inherit;font-weight:700;font-size:14px;cursor:pointer;transition:background .12s,border-color .12s}
  .fw-k:hover{background:#3E4250}
  .fw-k.fw-wide{flex:1.7 1 0;font-size:11.5px;letter-spacing:.04em}
  .fw-k.fw-green{background:#58CC02;border-color:#58CC02;color:#06230C}
  .fw-k.fw-yellow{background:#FFC107;border-color:#FFC107;color:#2A1B00}
  .fw-k.fw-grey{background:#1A1D24;border-color:#6A6E80;color:#8E92A0}
  .fw-k:focus-visible,.fw-again:focus-visible,.fw-cta:focus-visible{outline:3px solid #FFC107;outline-offset:2px}
  .fw-msg{min-height:22px;margin:14px 0 0;text-align:center;font-size:14px;font-weight:600;color:#E8EAF0}
  .fw-done{margin-top:14px;text-align:center;border-top:1px solid #6A6E80;padding-top:14px}
  .fw-dh{font-size:15px;font-weight:700;color:#F0F1F5;margin:0}
  .fw-dn{font-family:var(--mono);font-size:20px;font-weight:700;color:#FFC107;margin:6px 0 0;letter-spacing:.02em}
  .fw-dc{margin:14px 0 0}
  .fw-cta{display:inline-flex;align-items:center;min-height:48px;padding:0 20px;background:#58CC02;color:#06230C;font-weight:800;font-size:15px;border-radius:12px}
  .fw-cta:hover{text-decoration:none;filter:brightness(1.05)}
  .fw-again{display:block;width:100%;min-height:48px;margin-top:12px;border:1px solid #6A6E80;border-radius:12px;background:transparent;color:#E8EAF0;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
  /* An author \`display:block\` beats the UA stylesheet's [hidden]{display:none}
     no matter the specificity, so the reset button rendered from first paint —
     mid-game and before a game had even started. Any class that sets display on
     a [hidden] element has to re-assert this. */
  .fw-again[hidden]{display:none}
  .fw-again:hover{background:#1A1D24}
  .fw-foot{margin:16px 0 0;font-size:13.5px;line-height:1.6;color:#9BA0B8}
  .fw-ns{margin:14px 0 0;font-size:14px;color:#E8EAF0}
  @media (max-width:420px){
    .fw-card{padding:14px 10px 18px}
    .fw-kr{gap:4px}
    .fw-k{font-size:13px}
  }
  /* Reduced motion: no flip, no shake — but the tiles still arrive fully
     coloured, because the colour lives on the class, not in a keyframe. */
  @media (prefers-reduced-motion:reduce){
    .fw-t.fw-green,.fw-t.fw-yellow,.fw-t.fw-grey,.fw-row.fw-shake{animation:none!important}
    .fw-t{transition:none!important}
  }`;

// The grader is INLINED FROM THE GAME'S OWN FUNCTION via toString(), not
// rewritten here. Wordle duplicate-letter scoring is graded per LETTER, not per
// tile (guess BANANAS against BANDANA), and a second hand-rolled copy is exactly
// the kind of thing that drifts. Build-time guards below assert the source is
// self-contained before it is shipped.
//
// All result markup is built with createElement + textContent rather than
// innerHTML — nothing here is user-supplied, but a DOM-built panel cannot become
// an injection sink later either.
const FOOTLE_PRACTICE_JS = `(function(){
var box=document.getElementById('fw-game');if(!box)return;
function dec(s){try{return decodeURIComponent(atob(s)).split('').reverse().join('')}catch(e){return ''}}
var A=dec(box.getAttribute('data-p')||''),FULL=dec(box.getAttribute('data-f')||'')||A;
if(!A)return;
var N=A.length,MAX=6;
var GRADE=(${gradeWordleGuess.toString()});
var rows=box.querySelectorAll('.fw-row'),kbs=box.querySelectorAll('.fw-k');
var msg=document.getElementById('fw-msg'),done=document.getElementById('fw-done'),again=document.getElementById('fw-again');
var keys={};for(var q=0;q<kbs.length;q++){keys[kbs[q].getAttribute('data-k')]=kbs[q]}
var guesses=[],cur='',status='playing';
var LBL={green:'correct',yellow:'in the name but the wrong place',grey:'not in the name'};
function tiles(r){return rows[r].querySelectorAll('.fw-t')}
function say(t){if(msg)msg.textContent=t||''}
function clear(el){while(el.firstChild)el.removeChild(el.firstChild)}
function paint(){var ts=tiles(guesses.length);for(var i=0;i<N;i++){var ch=cur.charAt(i)||'';ts[i].textContent=ch;ts[i].className='fw-t'+(ch?' fw-fill':'');ts[i].setAttribute('aria-label','Row '+(guesses.length+1)+', letter '+(i+1)+(ch?', '+ch:', empty'))}}
function rank(s){return s==='green'?3:(s==='yellow'?2:1)}
function shake(){var r=rows[guesses.length];if(!r)return;r.classList.add('fw-shake');setTimeout(function(){r.classList.remove('fw-shake')},450)}
function finish(won){
/* Guarded: the partners page ships this board without the tracker. */
if(window.__biqGameFinish)window.__biqGameFinish('footle',won,{guesses:guesses.length});
var head=won?('Solved it in '+guesses.length+' of '+MAX+'.'):'Out of guesses.';
say(head+' The answer was '+FULL+'.');
if(done){
clear(done);
var h=document.createElement('p');h.className='fw-dh';h.textContent=head;
var n=document.createElement('p');n.className='fw-dn';n.textContent=FULL;
var w=document.createElement('p');w.className='fw-dc';
var a=document.createElement('a');a.className='fw-cta';a.setAttribute('href','/footle');a.textContent='Play the real Footle for today \\u2192';
w.appendChild(a);done.appendChild(h);done.appendChild(n);done.appendChild(w);
done.hidden=false;
}
if(again)again.hidden=false;
}
function submit(){
if(status!=='playing')return;
if(cur.length!==N){shake();say('Needs '+N+' letters.');return}
var g=GRADE(cur,A),ts=tiles(guesses.length);
for(var i=0;i<N;i++){
ts[i].className='fw-t fw-'+g[i];
ts[i].style.animationDelay=(i*90)+'ms';
ts[i].setAttribute('aria-label','Row '+(guesses.length+1)+', letter '+(i+1)+', '+cur.charAt(i)+', '+LBL[g[i]]);
var k=keys[cur.charAt(i)];
if(k){var pv=k.getAttribute('data-s')||'';if(!pv||rank(g[i])>rank(pv)){k.setAttribute('data-s',g[i]);k.className='fw-k fw-'+g[i]}}
}
/* ⚠️ START ON A SUBMITTED GUESS, never on render — a render event counts
   Googlebot and every PageSpeed run (clubq-start once fired 30.5x per
   visitor). Only an input event measures play. */
if(window.__biqGameStart)window.__biqGameStart('footle');
guesses.push(cur);
var won=cur===A;cur='';
if(won){status='won';finish(true)}
else if(guesses.length>=MAX){status='lost';finish(false)}
else{say('Guess '+guesses.length+' of '+MAX+' used.')}
}
function press(k){
if(status!=='playing')return;
if(k==='ENTER')return submit();
if(k==='DEL'){cur=cur.slice(0,-1);paint();say('');return}
if(cur.length<N){cur+=k;paint()}
}
function reset(){
guesses=[];cur='';status='playing';
for(var r=0;r<MAX;r++){var ts=tiles(r);for(var i=0;i<N;i++){ts[i].textContent='';ts[i].className='fw-t';ts[i].style.animationDelay='';ts[i].setAttribute('aria-label','Row '+(r+1)+', letter '+(i+1)+', empty')}}
for(var j=0;j<kbs.length;j++){kbs[j].removeAttribute('data-s');kbs[j].className='fw-k'+(kbs[j].getAttribute('data-w')?' fw-wide':'')}
if(done){clear(done);done.hidden=true}
if(again)again.hidden=true;
say('Board cleared \\u2014 six fresh guesses.');
}
for(var m=0;m<kbs.length;m++){kbs[m].addEventListener('click',function(){press(this.getAttribute('data-k'))})}
if(again)again.addEventListener('click',reset);
document.addEventListener('keydown',function(e){
/* Cmd+R / Ctrl+R must reload, not type an R. */
if(e.ctrlKey||e.metaKey||e.altKey)return;
var t=e.target,tn=t&&t.tagName;
if(tn==='INPUT'||tn==='TEXTAREA'||tn==='SELECT'||(t&&t.isContentEditable))return;
var k=e.key;
/* When a key button has focus, Enter/Space already fire its click — do not
   also handle it here or one press would count twice. */
if(tn==='BUTTON'&&(k==='Enter'||k===' '))return;
if(k==='Enter'){e.preventDefault();press('ENTER');return}
if(k==='Backspace'){e.preventDefault();press('DEL');return}
if(k&&k.length===1&&/[a-zA-Z]/.test(k)){e.preventDefault();press(k.toUpperCase())}
});
})();`;

// Build-time guards. The inlined grader must be self-contained (it must not
// close over anything from src/lib/wordle.js), and it must actually score
// duplicate letters the way the live game does.
(function assertPracticeGrader() {
  const src = gradeWordleGuess.toString();
  if (!/^function gradeWordleGuess\s*\(/.test(src)) {
    throw new Error('[footle] gradeWordleGuess is no longer a plain function declaration — the inlined practice grader would break.');
  }
  if (/WORDLE_|import |require\(/.test(src)) {
    throw new Error('[footle] gradeWordleGuess now references module scope — it can no longer be inlined into a static page.');
  }
  // BANANAS vs BANDANA: three greens, then three yellows that must consume the
  // remaining A/N/A exactly once each, then a grey. Per-tile grading gets this
  // wrong; per-letter grading gets it right.
  const got = gradeWordleGuess('BANANAS', 'BANDANA').join(',');
  const want = 'green,green,green,yellow,yellow,yellow,grey';
  if (got !== want) throw new Error(`[footle] duplicate-letter grading changed: ${got}`);
})();

// Renders the whole playable section. Everything is server-rendered HTML —
// board, keyboard, prose — so the page is a game in the file, not a game the
// browser has to assemble before a crawler can see one.
function footlePracticeSection() {
  const P = pickPracticePuzzle();
  const full = (WORDLE_FULL_NAMES[P.answer] || ['', P.answer]).filter(Boolean).join(' ');
  const when = new Date(P.dayIndex * 86400000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  return `<section class="sec fw-wrap" id="practice" aria-labelledby="fw-h">
<div class="fw-eyebrow">Practice puzzle · Footle #${P.number} · originally ${esc(when)}</div>
<h2 id="fw-h">Play a Footle right here</h2>
<p class="fw-lede">A real Footle from ${esc(when)}, replayable as often as you like — guess the ${P.answer.length}-letter surname in six. It is a finished puzzle, so nothing here spoils <a href="${SITE.base}/footle">today&#39;s Footle</a>, which everyone gets at midnight.</p>
${fwExampleHtml()}
<div class="fw-card">
<div id="fw-game" style="--fw-n:${P.answer.length}" data-p="${fwCloak(P.answer)}" data-f="${fwCloak(full)}">
${fwBoardHtml(P.answer.length)}
${fwKeyboardHtml()}
</div>
<p class="fw-msg" id="fw-msg" role="status" aria-live="polite"></p>
<div class="fw-done" id="fw-done" hidden></div>
<button type="button" class="fw-again" id="fw-again" hidden>Play this puzzle again</button>
<noscript><p class="fw-ns">This practice board needs JavaScript. <a href="${SITE.base}/football-wordle/answer/">Read today&#39;s hints</a> instead.</p></noscript>
</div>
<p class="fw-foot">Green means right letter, right place. Yellow means the letter is in the surname somewhere else. Grey means it is not in there at all. Any surname of the right length is accepted as a guess, exactly as in the real game — and when you want the one that counts, <a href="${SITE.base}/footle">today&#39;s Footle</a> is waiting.</p>
</section>
<script>${GAME_TRACK_JS}</script>
<script>${FOOTLE_PRACTICE_JS}</script>`;
}

// The last 30 finished puzzles / days, linked from the landing page so the
// served answer pages (api/footle.js, api/daily-answers.js) have an inbound
// link from an ESTABLISHED page — the condition the orphan gate's note asks
// for — and a person who has just finished today's has somewhere to go.
const ANS_DAYS_CSS = `<style>.ans-days{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:4px 14px}.ans-days a{display:block;min-height:36px;line-height:36px;font-size:14px;color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ans-days a:hover{color:var(--tx)}.ans-days b{color:var(--tx);font-weight:600}</style>`;
function recentFootleSection() {
  const rows = recentFootleAnswers(30);
  if (!rows.length) return '';
  return `<section class="sec"><h2>Recent Footle answers</h2>
<p>Each finished puzzle has its own page — the answer, how the letters fell, and the puzzles either side. <a href="${SITE.base}/football-wordle/answer/">Today's hints</a> stay spoiler-free until you tap.</p>
<ul class="ans-days">${rows.map((a) => `<li><a href="${a.url}"><b>No. ${a.n}</b> · ${esc(a.date)} — ${esc(a.full)}</a></li>`).join('')}</ul>
${ANS_DAYS_CSS}</section>`;
}
function recentDailySection() {
  const days = recentDailyDays(30);
  if (!days.length) return '';
  return `<section class="sec"><h2>Past Daily 7 answers</h2>
<p>Every day since the Daily 7 was first written down has its own page: the seven questions, the answers, and why each is right. <a href="${SITE.base}/daily-football-quiz/answers/">Today's</a> stay hidden until you tap.</p>
<ul class="ans-days">${days.map((d) => `<li><a href="${d.url}"><b>${esc(d.wd)}</b> ${esc(d.long)}</a></li>`).join('')}</ul>
${ANS_DAYS_CSS}</section>`;
}

function buildFootlePage(cfg) {
  const canonical = `${SITE.base}/${cfg.slug}/`;
  // Today's puzzle plays HERE since 2026-09-05 — the app's own component as an
  // island (see footleIsland). The hero therefore has no "Play" button that
  // leaves the page and no store badges above the board; the app band below
  // the game carries the app.
  const island = footleIsland();
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
        '@type': 'FAQPage',
        mainEntity: cfg.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
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
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, taster: true, extraHead: island.head })}
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
    statLine: null,
    playHref: null,
    noStores: true,
  })}
<style>
${FW_CSS}
${FW_TODAY_CSS}
</style>
<section class="sec fw-today" aria-label="Today's Footle">
<p class="fw-mast" id="footle-masthead" hidden></p>
<div class="fw-host" id="footle-today"><noscript><p class="fw-ns">Today's Footle needs JavaScript. <a href="${SITE.base}/football-wordle/answer/">Read today's hints</a> instead.</p></noscript></div>
<p class="fw-toast" id="footle-toast" role="status" aria-live="polite" hidden></p>
</section>
${island.script}
<details class="fw-fold" id="practice-fold">
<summary>Practise on a past puzzle — nothing about today's is given away</summary>
${footlePracticeSection()}
</details>
<section class="sec" id="how"><h2>How to play</h2>
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
${recentFootleSection()}
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
  'Sheffield Utd': 'Sheffield United',
  'Blackburn': 'Blackburn Rovers',
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
  // ⚠️ Sheffield Wednesday are NOT in leagues.mjs at all. The 2026-27 roster
  // lists "Sheffield Utd" in the Championship and no Wednesday anywhere, so the
  // directory could not reach the page and the build correctly refused to ship
  // an orphan. They belong here rather than in DIR_ALIAS: an alias maps a
  // league's short name onto our page name, and there is no league entry to map
  // FROM. Aliasing them to "Sheffield Utd" would have satisfied the build by
  // pointing one Sheffield club's row at the other's quiz.
  'sheffield-wednesday': { code: 'SHW', color: '#0066B3', name: 'Sheffield Wednesday' },
  // ⚠️ Same case as Sheffield Wednesday, one division lower. Leicester are in
  // League One for 2026-27 (confirmed by Alex — it is past my training cutoff,
  // so it is his fact, not a recalled one), and the clubs directory covers the
  // Premier League and Championship only. There is no league row to alias FROM,
  // so DIR_ALIAS cannot reach them and the build was right to refuse an orphan.
  'leicester-city': { code: 'LEI', color: '#003090', name: 'Leicester City' },
  'olympiacos': { code: 'OLY', color: '#DA020E', name: 'Olympiacos' },
  'panathinaikos': { code: 'PAO', color: '#00614E', name: 'Panathinaikos' },
};
// League → existing league-quiz page slug (only rendered when that page is live).
const LEAGUE_PAGE_SLUGS = {
  'Premier League': 'premier-league', 'La Liga': 'la-liga', 'Serie A': 'serie-a',
  'Bundesliga': 'bundesliga', 'Ligue 1': 'ligue-1', 'Süper Lig': 'super-lig',
  'Primeira Liga': 'primeira-liga',
};
const DIR_POPULAR = ['Arsenal', 'Liverpool', 'Man United', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'Man City', 'Chelsea', 'Juventus', 'PSG', 'Inter Milan', 'AC Milan'];

const TRAIL_PRACTICE_CSS = `<style>
  .tr-card{border:1px solid var(--bd);border-radius:16px;background:var(--card);padding:16px 18px;margin:6px 0 4px}
  .tr-list{list-style:none;margin:0 0 14px;padding:0;counter-reset:rung}
  .tr-list li{position:relative;padding:9px 12px 9px 34px;margin:0 0 6px;border-radius:10px;font-weight:700;font-size:15px}
  .tr-list li::before{counter-increment:rung;content:counter(rung);position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;font-weight:800;color:var(--tx3)}
  .tr-on{background:rgba(88,204,2,.10);border:1px solid rgba(88,204,2,.35);color:var(--tx)}
  .tr-off{background:var(--bg2,#12141c);border:1px dashed var(--bd);color:var(--tx3)}
  .tr-loan{font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.06em;margin-left:6px}
  .tr-form{display:flex;gap:8px;margin:0 0 10px}
  /* 16px is a HARD FLOOR — iOS auto-zooms on focusing any smaller input and
     WKWebView never restores the scale on blur. */
  .tr-in{flex:1;min-width:0;border:1px solid var(--bd);border-radius:12px;background:var(--bg2,#12141c);color:var(--tx);padding:12px 14px;font-size:16px;font-family:inherit}
  .tr-go{border:none;border-radius:12px;background:var(--grn);color:#06230C;font-weight:800;padding:12px 18px;font-size:15px;cursor:pointer;font-family:inherit}
  .tr-more{width:100%;min-height:44px;border:1px solid var(--bd);border-radius:12px;background:none;color:var(--tx2);padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
  .tr-msg{margin:8px 0 0;color:var(--tx3);font-size:13.5px;min-height:1.2em}
  /* Six rungs at 50px each is 300px of ladder above the guess box. Tightened
     on phones only, where that 30px decides whether you can answer without
     scrolling. The rungs are <li>, not controls, so the 44px tap floor does
     not apply to them. */
  @media(max-width:560px){
    .tr-list{margin-bottom:10px}
    .tr-list li{padding:7px 12px 7px 34px;margin-bottom:5px}
  }
  .tr-note{margin:8px 0 0;color:var(--tx3);font-size:13px}
  .tr-done{text-align:center}
  .tr-name{font-size:20px;font-weight:900;color:var(--grn);margin:4px 0 2px}
  .tr-sub{color:var(--tx2);font-size:14.5px;margin:0 0 12px}
  .tr-cta .btn{display:inline-block;background:var(--grn);color:#06230C;border-radius:12px;padding:12px 20px;font-weight:800;text-decoration:none}
</style>`;

// ── Playable Transfer Trail practice board (/transfer-trail/) ───────────────
//
// WHY. Measured 2026-07-28: pages with something to play hold 109-145s; list
// pages without a taster got 2.3s. /transfer-trail/ shipped without one, which
// put a brand-new page straight into the losing bucket. Mystery Player cannot
// have the same treatment cheaply (its pool plus ranking model is ~400 kB); a
// trail is just an array of club names, so this one is nearly free.
//
// ⚠️ NEVER TODAY'S TRAIL. Emitting the live answer spoils the real game for
// anyone who lands here first.
//
// ⚠️ AND THE WALK MUST BE BOUNDED AT TRAIL #1 — this is the trap the Footle
// board's header describes, and it bites HARDER here. Footle has run for
// months; the Trail launched 2026-08-03, so at time of writing only THREE past
// puzzles exist. A naive "walk back 30 days" runs off the start of the log and
// either throws or wraps to a future answer. So: clamp, and if no past trail
// exists yet, emit NOTHING rather than something wrong.
function pickPracticeTrail() {
  const today = getTrailDayIndex();
  const firstDay = TRAIL_ANCHOR_DAY;
  // Prefer something a few weeks old so the board is not last night's puzzle,
  // but clamp into the range that actually exists.
  const wanted = today - 21;
  const dayIndex = Math.max(firstDay, Math.min(wanted, today - 1));
  if (dayIndex < firstDay || dayIndex >= today) return null;   // nothing past yet
  const player = getTrailAnswerForDayIndex(dayIndex, TRAIL_ANSWER_LOG, TRAIL_PLAYERS);
  if (!player || !Array.isArray(player.clubs) || player.clubs.length < 2) return null;
  return { player, number: dayIndex - TRAIL_ANCHOR_DAY + 1 };
}

const TRAIL_PRACTICE_JS = `(function(){
var root=document.getElementById('biq-trail');if(!root)return;
var d=JSON.parse(document.getElementById('biq-trail-data').textContent);
var shown=1,done=false;
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]/g,'')};
var accepted=d.accept.map(norm);
function draw(){
  var rungs=d.clubs.map(function(c,i){
    if(i<shown) return '<li class="tr-on">'+c+(d.loans[i]?' <span class="tr-loan">loan</span>':'')+'</li>';
    return '<li class="tr-off">?</li>';
  }).join('');
  var left=d.clubs.length-shown;
  root.innerHTML='<ol class="tr-list">'+rungs+'</ol>'+(done?'':
    '<form class="tr-form"><input class="tr-in" type="text" placeholder="Name the player" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Name the player"><button class="tr-go" type="submit">Guess</button></form>'+
    (left>0?'<button class="tr-more" type="button">Reveal next club ('+left+' left)</button>':'<p class="tr-note">That is the whole career — last guess.</p>')+
    '<p class="tr-msg" role="status"></p>');
  if(done) return;
  var f=root.querySelector('.tr-form'),m=root.querySelector('.tr-more');
  f.addEventListener('submit',function(e){e.preventDefault();
    var v=norm(root.querySelector('.tr-in').value);
    if(!v)return;
    if(accepted.indexOf(v)>-1){finish(true);return}
    root.querySelector('.tr-msg').textContent='Not him — reveal another club, or try again.';
  });
  if(m)m.addEventListener('click',function(){shown++;draw()});
}
function finish(won){
  done=true;
  var used=shown;
  root.innerHTML='<ol class="tr-list">'+d.clubs.map(function(c,i){return '<li class="tr-on">'+c+(d.loans[i]?' <span class="tr-loan">loan</span>':'')+'</li>'}).join('')+'</ol>'+
   '<div class="tr-done"><div class="tr-name">'+(won?'Got it — ':'It was ')+d.name+'</div>'+
   (won?'<div class="tr-sub">From '+used+' club'+(used===1?'':'s')+'. Fewer clubs, more points.</div>':'')+
   '<div class="tr-cta"><a class="btn" href="'+d.play+'">Play the live Transfer Trail →</a></div>'+
   '<p class="tr-note">That was Trail #'+d.number+' — a past puzzle. The live one is a different career.</p></div>';
}
draw();
})();`;

// `inHero` returns the board WITHOUT its own <section> wrapper, for use as the
// right column of heroTwoCol.
//
// ⚠️ WHY THE BOARD MOVED INTO THE HERO. Shipped as a standalone section it sat
// at y=601 on a 664px phone — measured, not guessed. The hero above it is 537px
// tall, so the one thing on the page a visitor can actually DO started 63px from
// the bottom edge, under a call-to-action that sends them off-site to the app.
// heroTwoCol already solves this for club pages: `.hero-right` takes `order:1`
// under 940px, so the playable thing renders ABOVE the prose on a phone while
// the DOM (and therefore the heading order crawlers read) is unchanged.
function trailPracticeSection(playHref, { inHero = false } = {}) {
  const picked = pickPracticeTrail();
  // No past trail yet (the first day the game is live) — emit nothing rather
  // than spoil today's. The page still has its hero, how-to-play and FAQ.
  if (!picked) return '';
  const { player, number } = picked;
  const data = JSON.stringify({
    clubs: player.clubs,
    loans: player.loans || player.clubs.map(() => false),
    accept: acceptedNamesFor(player),
    name: (player.display || []).join(' ').trim(),
    number,
    play: playHref,
  }).replace(/</g, '\\u003c');
  const board = `<div class="tr-card" id="biq-trail"></div>
<script type="application/json" id="biq-trail-data">${data}</script>
<script>${TRAIL_PRACTICE_JS}</script>`;

  if (inHero) {
    return `${TRAIL_PRACTICE_CSS}<div class="hero-play">
<div class="eyebrow">Past puzzle · Trail #${number} · no sign-up</div>
${board}
</div>`;
  }

  return `<section class="sec" id="try">
${TRAIL_PRACTICE_CSS}<div class="eyebrow">Past puzzle · Trail #${number} · no sign-up</div>
<h2>Try one</h2>
<p style="margin:0 0 12px;color:var(--tx2)">A career from an earlier Trail. Name him from as few clubs as you can.</p>
${board}
</section>`;
}

// ── Daily-game landing pages (/mystery-player/, /transfer-trail/) ────────────
//
// Generalised from buildFootlePage, which is the proven shape for this page
// type — it is what put Ball IQ on the "football wordle" SERP. Kept SEPARATE
// from that function rather than refactoring it, because the Footle page also
// carries a playable practice board, a hints/answer sibling page and its own
// CSS; folding four pages into one builder to save duplication would make the
// one that earns the most traffic harder to reason about.
//
// ⚠️ NO PLAYABLE TASTER HERE YET, AND THAT IS THE KNOWN WEAKNESS.
// Measured 2026-07-28: pages with something to play hold 109-145s; list pages
// without a taster got 2.3s. Footle's landing page has a real board. These two
// do not, because the cheap version does not exist yet:
//   - Mystery Player would need the 1,537-player pool + the ranking model,
//     which is ~400 kB — far too heavy for a landing page.
//   - Transfer Trail COULD have one cheaply: a past trail is just an array of
//     club names plus an answer, the same "past puzzle, never today's" trick
//     footlePracticeSection() already uses. That is the obvious next increment.
// Shipping the readable version first is deliberate: right now these games have
// NO search surface at all, and a page that exists beats a page that is perfect.
function buildDailyGamePage(cfg) {
  const canonical = `${SITE.base}/${cfg.slug}/`;
  const playHref = `${SITE.base}/play?game=${cfg.gameParam}`;

  // Same reasoning as the Footle page: a Google rich result needs an
  // aggregateRating or offers we have not earned, so this is not for stars in
  // the SERP. It is for machine comprehension by AI answer engines, a channel
  // with actual evidence behind it (chatgpt.com referred a real session on
  // 2026-07-28). A named Game entity with genre, free-to-play and a publisher
  // is what those read.
  const ld = jsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.base}/` },
          { '@type': 'ListItem', position: 2, name: cfg.game, item: canonical },
        ],
      },
      {
        '@type': 'Game',
        name: cfg.game,
        alternateName: cfg.alternateName,
        url: canonical,
        description: cfg.description,
        genre: ['Puzzle', 'Sports trivia', 'Guessing game'],
        gamePlatform: ['Web browser', 'iOS', 'Android'],
        numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
        isAccessibleForFree: true,
        inLanguage: 'en',
        playMode: 'SinglePlayer',
        publisher: { '@type': 'Organization', name: 'Ball IQ', url: `${SITE.base}/` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: cfg.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'WebApplication',
        name: `${cfg.game} — ${cfg.lede}`,
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
  const bodyHtml = cfg.body.map((pp) => `<p>${esc(pp)}</p>`).join('\n');

  // Cross-links between the daily games. These are the ONLY internal links each
  // new page would otherwise have beyond the nav, and an orphan page is exactly
  // how the Transfer Trail stayed dark — so this is load-bearing, not garnish.
  const siblings = [
    { slug: 'football-wordle', name: 'Footle', blurb: "the daily football Wordle — guess the footballer's surname in six." },
    { slug: 'mystery-player', name: 'Mystery Player', blurb: 'one secret footballer, unlimited guesses, every guess ranked by closeness.' },
    { slug: 'transfer-trail', name: 'Transfer Trail', blurb: 'name the player from his career path, one club at a time.' },
  ].filter((x) => x.slug !== cfg.slug);

  // A playable board, when the game has one, becomes the hero's right column so
  // a phone meets it first (see trailPracticeSection). Without one, the hero
  // stays single-column — there is nothing to put beside the copy.
  const board = cfg.slug === 'transfer-trail' ? trailPracticeSection(playHref, { inHero: true }) : '';
  const heroProps = {
    crumbItems: [
      { name: 'Home', url: `${SITE.base}/` },
      { name: cfg.game, url: canonical },
    ],
    badge: { text: cfg.emoji, emoji: true },
    kind: 'Daily game',
    name: cfg.game,
    h1: cfg.h1,
    lead: cfg.lede,
    statLine: cfg.statLine,
    playHref,
    playLabel: `Play today's ${esc(cfg.game)} →`,
  };

  // ⚠️ A GAME PAGE THAT CANNOT BE PLAYED IS A BROCHURE. Read on the live site:
  // "there is no actual game to play here either" — the green button scrolled
  // down to more prose. Footle's page holds a real board and /xi/ is the game
  // itself; the Daily 7 had nothing, which is the wrong way round given it is
  // the mode the whole app is built on. Clarity measured the cost of this
  // exact shape: reference pages with nothing to DO held ~2.3 seconds.
  //
  // The Daily 7 IS a quiz, so it gets the same playable taster the club pages
  // use — real bank questions, tap to answer, explanation on a miss. Trail and
  // Mystery Player are not quizzes and a quiz taster there would be a
  // non-sequitur; they need their own small widgets, which is the next brick.
  const dailyTaster = cfg.gameParam === 'daily'
    ? tasterPick(QB.filter((r) => r.hint && r.type === 'mcq' && Array.isArray(r.o)), 5)
    : [];
  const hasDailyTaster = dailyTaster.length === 5;
  if (cfg.gameParam === 'daily') {
    heroProps.playHref = hasDailyTaster ? '#taster' : playHref;
    heroProps.playLabel = hasDailyTaster ? 'Play seven questions now →' : heroProps.playLabel;
  }
  if (cfg.gameParam === 'trail') {
    heroProps.playHref = '#practice';
    heroProps.playLabel = 'Play a trail now →';
  }
  if (cfg.gameParam === 'mystery') {
    heroProps.playHref = '#practice';
    heroProps.playLabel = 'Play a puzzle now →';
  }

  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld, taster: hasDailyTaster })}
<body>
${NAV}
<main id="main">
${board ? heroTwoCol(heroProps, board) : heroSection(heroProps)}
${hasDailyTaster ? renderTaster(dailyTaster, 'the Daily 7', playHref) : ''}
<script>${GAME_TRACK_JS}</script>
${cfg.gameParam === 'trail' ? `<style>${TRAIL_BOARD_CSS}</style>${trailBoardHtml()}<script>${TRAIL_BOARD_JS}</script>` : ''}
${cfg.gameParam === 'mystery' ? `<style>${MYSTERY_BOARD_CSS}</style>${mysteryBoardHtml()}<script>${MYSTERY_BOARD_JS}</script>` : ''}
<section class="sec"><h2>How to play</h2>
<div class="prose">
${howHtml}
</div></section>
<section class="sec"><h2>What makes it different</h2>
<div class="prose">
${bodyHtml}
</div></section>
<section class="sec"><h2>The other daily games</h2>
<div class="prose">
${siblings.map((x) => `<p><a href="${SITE.base}/${x.slug}/"><strong>${esc(x.name)}</strong></a> — ${esc(x.blurb)}</p>`).join('\n')}
</div></section>
${cfg.slug === DAILY7_PAGE.slug ? recentDailySection() : ''}
${appCtaBand('football')}
<section class="sec"><h2>${esc(cfg.game)} FAQ</h2>
${renderFaq(cfg.faq)}
</section>
</main>
${footer()}`;

  const dir = resolve(DIST, cfg.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf8');
  return { slug: cfg.slug, name: cfg.game };
}

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
  // card #1A1D27 / border #2F3240 / text #F0F1F5 / muted #9BA0B8 / deep-muted
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
  .cd-search{display:flex;align-items:center;gap:10px;padding:13px 16px;background:#12141b;border:1px solid #2F3240;border-radius:14px;margin:0 0 16px}
  .cd-search svg{flex:0 0 auto;color:var(--tx4)}
  .cd-search input{flex:1;min-width:0;background:transparent;border:none;outline:none;font:500 14px Inter,sans-serif;color:#fff}
  .cd-search input::placeholder{color:var(--tx4)}
  .cd-pop{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 22px}
  .cd-pop-t{font:700 11px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#9ba0b8;margin-right:2px}
  .cd-pill{display:flex;align-items:center;gap:6px;padding:7px 11px;background:#1a1d27;border:1px solid #2F3240;border-radius:999px;text-decoration:none;font:600 12px Inter,sans-serif;color:#f0f1f5;white-space:nowrap}
  .cd-pill:hover{border-color:#3a3f52;text-decoration:none}
  .cd-sec{margin:0 0 26px}
  .cd-lh{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 10px}
  .cd-lt{display:flex;align-items:baseline;gap:8px;font-size:16px;font-weight:800;letter-spacing:-.01em;color:#fff;margin:0}
  .cd-flag{font-size:15px}
  .cd-cnt{font:500 11px 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--tx4);margin-left:2px}
  .cd-lp{font:700 12px Inter,sans-serif;color:var(--grn);white-space:nowrap;text-decoration:none}
  .cd-lp:hover{text-decoration:underline}
  .cd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px}
  .cd-card{display:flex;align-items:center;min-width:0;gap:8px;padding:10px 11px;background:#1a1d27;border:1px solid #2F3240;border-radius:12px;text-decoration:none}
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

function buildSitemap(livePages, listPages = [], esPages = [], questionPages = [], hubPages = []) {
  // Build date as <lastmod> — Google honors lastmod but ignores changefreq/
  // priority, so without it the sitemap gives the crawler no freshness signal.
  // Pages are regenerated every deploy, so the build date is an honest hint.
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE.base}/`, freq: 'daily', pri: '1.0' },
    { loc: `${SITE.base}/quiz/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/quiz/clubs/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/football-wordle/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/fun-facts/`, freq: 'weekly', pri: '0.7' },
    { loc: `${SITE.base}/football-quotes/`, freq: 'weekly', pri: '0.7' },
    // ⚠️ /football-quiz/ IS DELIBERATELY NOT LISTED (2026-08-16). It canonicals
    // to /quiz/ after measured cannibalisation on the north-star term — see the
    // long note above buildFootballQuizPage(). A sitemap entry is itself a
    // canonical hint, so listing a canonicalised-away URL sends Google two
    // contradictory signals. The page is still built, still linked in the nav,
    // and still serves visitors; it is simply no longer submitted as its own
    // indexable entity. Re-add ONLY if the canonical is ever flipped back.
    { loc: `${SITE.base}/club-nicknames/`, freq: 'monthly', pri: '0.7' },
    { loc: `${SITE.base}/xi/`, freq: 'daily', pri: '0.8' },
    { loc: `${SITE.base}/football-wordle/answer/`, freq: 'daily', pri: '0.7' },
    // One page per finished puzzle / day, served by api/footle.js and
    // api/daily-answers.js. Only the last 30 are submitted, because only the
    // last 30 are linked from the landing pages below — the orphan gate is
    // right that a sitemap entry nobody links to is a liability, not an asset.
    ...recentFootleAnswers(30).map((a) => ({ loc: a.url, freq: 'yearly', pri: '0.5' })),
    { loc: `${SITE.base}/daily-football-quiz/answers/`, freq: 'daily', pri: '0.7' },
    ...recentDailyDays(30).map((d) => ({ loc: d.url, freq: 'yearly', pri: '0.5' })),
    { loc: `${SITE.base}/${MYSTERY_PAGE.slug}/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/${TRAIL_PAGE.slug}/`, freq: 'weekly', pri: '0.8' },
    { loc: `${SITE.base}/${DAILY7_PAGE.slug}/`, freq: 'daily', pri: '0.9' },
    /* Localised hubs. They carry the head term in each language and are the
       entry point the localised club pages hang off, so they get a higher
       priority than the club pages themselves — omitting them would leave the
       whole cluster reachable only via hreflang. */
    ...hubPages.map((h) => ({ loc: h.canonical, freq: 'weekly', pri: '0.8' })),
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
    ...questionPages.map((p) => ({ loc: `${SITE.base}/questions/${p.slug}/`, freq: 'monthly', pri: '0.7' })),
    { loc: `${SITE.base}/study/${STUDY.slug}/`, freq: 'monthly', pri: '0.6' },
    { loc: `${SITE.base}/about/`, freq: 'monthly', pri: '0.4' },
    { loc: `${SITE.base}/contact/`, freq: 'monthly', pri: '0.4' },
    { loc: `${SITE.base}/terms/`, freq: 'yearly', pri: '0.2' },
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
    `- [Guess the XI](${SITE.base}/xi/): daily game — name all eleven players from a famous starting lineup; positions and shirt numbers given.`,
    `- [Transfer Trail](${SITE.base}/transfer-trail/): daily game — name the player from their transfer history, one club revealed per miss.`,
    `- [Mystery Player](${SITE.base}/mystery-player/): daily guessing game — find the footballer, every guess tells you warmer or colder.`,
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
- [Terms of Service](${SITE.base}/terms/): The terms that apply when using Ball IQ.

## Play
- [Play Ball IQ free in your browser](${SITE.base}/): The daily challenge, streaks, a Ball IQ player rating and multiplayer.
- [Ball IQ on the App Store](https://apps.apple.com/app/id6775975961): Free iPhone app.
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
  // The text Q&A layer — a DIFFERENT SERP from the club quiz, and the format
  // that earns links. Only clubs with enough questions get one.
  const questionPages = CLUBS.map((c) => buildClubQuestionsPage(c, clubHintRows(c.club))).filter(Boolean);
  // Siblings = every OTHER language this slug exists in, so each localised page
  // links the whole cluster rather than just itself and English.
  const builtEs = CLUBS_INTL.map((c) =>
    buildClubPageIntl(c, CLUBS_INTL.filter((s) => s.slug === c.slug)));
  // The localised HUBS. Only languages that actually have clubs beneath them —
  // a head-term page over an empty grid is the /lists mistake in a new language.
  const hubLangs = HUBS_INTL.map((h) => h.lang).filter((l) => CLUBS_INTL.some((c) => c.lang === l));
  const builtHubs = HUBS_INTL
    .filter((h) => hubLangs.includes(h.lang))
    .map((h) => buildLangHub(h, CLUBS_INTL.filter((c) => c.lang === h.lang), hubLangs));
  const builtPlayers = PLAYERS.map((p) => buildPlayerPage(p, clubPages, livePages));
  const builtNations = NATIONS.map((n) => buildNationPage(n, livePages, nationPages));
  const listTasterIds = new Set();
  const builtLists = LISTS.map((l) => buildListPage(l, clubPages, playerPages, livePages, listTasterIds));
  buildListsHubPage(LISTS, clubPages, livePages);
  buildPartnersPage(QB.filter((q) => q.type === 'mcq' && q.hint && Array.isArray(q.o) && q.o.length === 4));
  buildEmbedQuizPage(QB.filter((q) => q.type === 'mcq' && q.hint && Array.isArray(q.o) && q.o.length === 4));
  buildClubsDirectoryPage(livePages);
  buildHubPage(livePages, clubPages, playerPages);
  buildFootlePage(FOOTLE_PAGE);
  buildFunFactsPage();
  buildXiPage();
  buildQuotesPage();
  buildFootballQuizPage();
  buildNicknamesPage();
  const dailyGamePages = [MYSTERY_PAGE, TRAIL_PAGE, DAILY7_PAGE].map(buildDailyGamePage);
  buildStudyPage(STUDY);
  buildSimplePage(ABOUT);
  buildSimplePage(CONTACT);
  buildSimplePage(TERMS);
  build404Page();
  // /questions/ pages are canonicalized to their /quiz/ twins and OUT of the
  // sitemap while the AdSense doorway remediation stands (scan 2026-08-11).
  const sitemapUrls = buildSitemap([...livePages, ...clubPages, ...playerPages, ...nationPages], listPages, builtEs, [], builtHubs);
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
  console.log(`  ✓ /about/  ✓ /contact/  ✓ /terms/`);
  console.log(`  ✓ /sitemap.xml  ✓ /llms.txt`);
}

await main();
