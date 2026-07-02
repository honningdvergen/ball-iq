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

const PAGE_BG = '#09131C';
const PAGE_FG = '#EAF0F6';

// Shared <head> + inline CSS. System fonts only — no Google Fonts fetch.
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
<style>
  html{background:${PAGE_BG};-webkit-text-size-adjust:100%}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:${PAGE_BG};color:${PAGE_FG};line-height:1.65;-webkit-font-smoothing:antialiased}
  .wrap{max-width:740px;margin:0 auto;padding:28px 20px 72px}
  a{color:#43d17a;text-decoration:none}
  a:hover{text-decoration:underline}
  .brand{display:inline-flex;align-items:baseline;gap:.12em;font-weight:800;font-size:20px;letter-spacing:-.01em;color:#fff}
  .brand em{font-style:normal;color:#43d17a}
  nav.crumbs{font-size:13px;color:#8aa0b4;margin:18px 0 10px}
  nav.crumbs a{color:#8aa0b4}
  h1{font-size:30px;line-height:1.2;font-weight:800;letter-spacing:-.02em;color:#fff;margin:6px 0 4px}
  .lede{color:#aebccb;font-size:15px;margin-bottom:18px}
  h2{font-size:21px;font-weight:800;color:#fff;letter-spacing:-.01em;margin:34px 0 12px}
  h3{font-size:16px;font-weight:700;color:#fff;margin:18px 0 6px}
  p{margin:0 0 13px}
  .intro p{color:#cdd8e3;font-size:16px}
  .stats{display:inline-block;font-size:13px;color:#9fb0c0;background:#0f1d29;border:1px solid #1d2e3d;border-radius:8px;padding:8px 12px;margin:4px 0 8px}
  .qa-list{list-style:none;counter-reset:qa}
  .qa{background:#0e1a25;border:1px solid #1b2a38;border-radius:12px;padding:16px 16px 12px;margin:0 0 12px}
  .qa .q{font-weight:700;color:#fff;font-size:16px;margin-bottom:10px}
  .qa .q::before{counter-increment:qa;content:counter(qa) ". ";color:#43d17a}
  .opts{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
  .opts li{font-size:14px;color:#c4d0db;background:#0b151e;border:1px solid #18242f;border-radius:7px;padding:7px 10px}
  details.ans{border-top:1px dashed #21323f;padding-top:9px;margin-top:4px}
  details.ans summary{cursor:pointer;color:#43d17a;font-size:13px;font-weight:600;list-style:none}
  details.ans summary::-webkit-details-marker{display:none}
  details.ans summary::before{content:"▸ ";}
  details.ans[open] summary::before{content:"▾ ";}
  details.ans .a{color:#fff;font-weight:700;font-size:14px;margin:8px 0 4px}
  details.ans .why{color:#aebccb;font-size:14px;margin:0}
  @media(max-width:480px){.opts{grid-template-columns:1fr}h1{font-size:25px}}
  .faq dt{font-weight:700;color:#fff;margin-top:14px}
  .faq dd{color:#bcc9d6;margin:4px 0 0}
  .mesh{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}
  @media(max-width:480px){.mesh{grid-template-columns:1fr}}
  .mesh a{display:block;background:#0e1a25;border:1px solid #1b2a38;border-radius:10px;padding:11px 13px;color:#dbe6f0;font-weight:600;font-size:14px}
  .mesh a span{display:block;color:#7e93a6;font-weight:500;font-size:12px;margin-top:2px}
  .cta{background:linear-gradient(135deg,#123a24,#0e2a1c);border:1px solid #1d5236;border-radius:14px;padding:20px;margin:26px 0;text-align:center}
  .cta p{color:#cfe5d8;font-size:15px;margin-bottom:12px}
  .btn{display:inline-block;background:#43d17a;color:#06210f;font-weight:800;font-size:15px;padding:12px 22px;border-radius:10px}
  .btn:hover{text-decoration:none;filter:brightness(1.06)}
  .btn.store{background:#0b151e;color:#fff;border:1px solid #293a49;margin-left:8px}
  footer{margin-top:40px;padding-top:20px;border-top:1px solid #1b2a38;color:#738799;font-size:12.5px}
  footer a{color:#8aa0b4}
  footer .disc{margin-top:10px;color:#5f7387;font-size:11.5px;line-height:1.6}
</style>
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">${ld}</script>
</head>`;
}

function header(crumbs) {
  const trail = crumbs
    .map((c, i) =>
      i === crumbs.length - 1
        ? `<span>${esc(c.name)}</span>`
        : `<a href="${c.url}">${esc(c.name)}</a> / `,
    )
    .join('');
  return `<body><div class="wrap">
<a class="brand" href="${SITE.base}/">Ball <em>IQ</em></a>
<nav class="crumbs">${trail}</nav>`;
}

function footer() {
  const year = 2026;
  return `<footer>
<p><a href="${SITE.base}/quiz/">All football quizzes</a> · <a href="${SITE.base}/">Play Ball IQ</a> · <a href="${SITE.base}/about/">About</a> · <a href="${SITE.base}/contact/">Contact</a> · <a href="${SITE.base}/privacy.html">Privacy</a></p>
<p>© ${year} ${esc(SITE.name)} — ${esc(SITE.tagline)}.</p>
<p class="disc">Ball IQ is an independent football trivia game and is not affiliated with, endorsed by, or associated with FIFA, UEFA, the Premier League, La Liga, Serie A, the Bundesliga, or any club or competition. All team and competition names are used for identification and editorial reference only.</p>
</footer>
</div></body></html>`;
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

// Full-mesh internal links to every OTHER live page + the hub.
function renderMesh(currentSlug, livePages) {
  const links = livePages
    .filter((p) => p.slug !== currentSlug)
    .map(
      (p) =>
        `<a href="${SITE.base}/quiz/${p.slug === HUB.slug ? '' : p.slug + '/'}">${esc(p.name)}<span>${p.count != null ? p.count + ' questions' : 'Browse all topics'}</span></a>`,
    )
    .join('\n');
  return `<div class="mesh">\n${links}\n</div>`;
}

function ctaBlock(label) {
  return `<div class="cta">
<p>${esc(label)}</p>
<a class="btn" href="${SITE.base}/">Play free in your browser</a>
<a class="btn store" href="${SITE.appStore}" rel="noopener">Get the app</a>
</div>`;
}

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
  const sample = curate(hints, catCfg.sample);
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

  const introHtml = catCfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const faqHtml = catCfg.faq
    .map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`)
    .join('\n');

  const easy = all.filter((x) => x.diff === 'easy').length;
  const medium = all.filter((x) => x.diff === 'medium').length;
  const hard = all.filter((x) => x.diff === 'hard').length;

  const html = `${head({ title: catCfg.title, description: catCfg.description, canonical, ld })}
${header([
    { name: 'Home', url: `${SITE.base}/` },
    { name: 'Quizzes', url: `${SITE.base}/quiz/` },
    { name: catCfg.name, url: canonical },
  ])}
<h1>${esc(catCfg.h1)}</h1>
<p class="lede">Free ${esc(catCfg.name)} trivia questions with explained answers.</p>
<div class="intro">
${introHtml}
</div>
<p class="stats">Ball IQ has ${all.length} ${esc(catCfg.name)} questions — ${easy} easy, ${medium} medium and ${hard} hard.</p>
${ctaBlock(`Like these? Play the full ${catCfg.name} quiz — it's free.`)}
<h2>${esc(catCfg.name)} quiz questions &amp; answers</h2>
<p class="lede">${sample.length} sample questions. Tap “Show answer” to reveal the answer and the story behind it.</p>
${renderQA(sample)}
${ctaBlock(`Hundreds more ${catCfg.name} questions in the Ball IQ app.`)}
<h2>${esc(catCfg.name)} quiz — FAQ</h2>
<dl class="faq">
${faqHtml}
</dl>
${(() => {
    const rel = (CAT_SLUG_TO_CLUB_SLUGS[catCfg.slug] || [])
      .map((s) => clubPages.find((p) => p.slug === s))
      .filter(Boolean);
    return rel.length
      ? `<h2>${esc(catCfg.name)} club quizzes</h2>\n${renderMesh(catCfg.slug, rel)}\n`
      : '';
  })()}<h2>More football quizzes</h2>
${renderMesh(catCfg.slug, livePages)}
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
  const sample = curate(hints, Math.min(15, hints.length));
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

  const introHtml = cfg.intro.map((p) => `<p>${esc(p)}</p>`).join('\n');
  const faqHtml = cfg.faq
    .map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`)
    .join('\n');

  const easy = all.filter((x) => x.diff === 'easy').length;
  const medium = all.filter((x) => x.diff === 'medium').length;
  const hard = all.filter((x) => x.diff === 'hard').length;

  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld })}
${header([
    { name: 'Home', url: `${SITE.base}/` },
    { name: 'Quizzes', url: `${SITE.base}/quiz/` },
    { name: cfg.name, url: canonical },
  ])}
<h1>${esc(cfg.h1)}</h1>
<p class="lede">Free ${esc(cfg.name)} trivia questions with explained answers.</p>
<div class="intro">
${introHtml}
</div>
<p class="stats">Ball IQ has ${all.length} ${esc(cfg.name)} questions — ${easy} easy, ${medium} medium and ${hard} hard.</p>
${ctaBlock(`Like these? Play the full ${cfg.name} quiz — it's free.`)}
<h2>${esc(cfg.name)} quiz questions &amp; answers</h2>
<p class="lede">${sample.length} sample questions. Tap “Show answer” to reveal the answer and the story behind it.</p>
${renderQA(sample)}
${ctaBlock(`The full ${cfg.name} question bank is in the Ball IQ app.`)}
<h2>${esc(cfg.name)} quiz — FAQ</h2>
<dl class="faq">
${faqHtml}
</dl>
<h2>More club quizzes</h2>
${renderMesh(cfg.slug, clubPages)}
<h2>League &amp; tournament quizzes</h2>
${renderMesh(cfg.slug, catPages)}
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
  const faqHtml = cfg.faq.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('\n');
  const html = `${head({ title: cfg.title, description: cfg.description, canonical, ld })}
${header([
    { name: 'Home', url: `${SITE.base}/` },
    { name: 'Quizzes', url: `${SITE.base}/quiz/` },
    { name: cfg.h1, url: canonical },
  ])}
<h1>${esc(cfg.h1)}</h1>
<p class="lede">${esc(cfg.lede)}</p>
<div class="intro">
${introHtml}
</div>
${ctaBlock(`Want to play properly? The full Ball IQ game is free.`)}
<h2>${rows.length} football trivia questions &amp; answers</h2>
<p class="lede">Tap “Show answer” to reveal the answer and the story behind it.</p>
${renderQA(rows)}
${ctaBlock(`Thousands more questions, a daily challenge and live multiplayer — free in the Ball IQ app.`)}
<h2>FAQ</h2>
<dl class="faq">
${faqHtml}
</dl>
<h2>More football quizzes</h2>
${renderMesh(cfg.slug, livePages)}
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

  const introHtml = HUB.intro.map((p) => `<p>${esc(p)}</p>`).join('\n');

  const html = `${head({ title: HUB.title, description: HUB.description, canonical, ld })}
${header([
    { name: 'Home', url: `${SITE.base}/` },
    { name: 'Quizzes', url: canonical },
  ])}
<h1>${esc(HUB.h1)}</h1>
<p class="lede">Free football trivia with explained answers — no sign-up needed.</p>
<div class="intro">
${introHtml}
</div>
${ctaBlock('Want the daily challenge, streaks and multiplayer? Play the full game free.')}
<h2>Pick a quiz</h2>
${renderMesh(HUB.slug, livePages)}
<h2>Club quizzes</h2>
<p class="lede">Deep-dive quizzes on Europe's biggest clubs — history, legends and iconic moments.</p>
${renderMesh(HUB.slug, clubPages)}
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
${header([
    { name: 'Home', url: `${SITE.base}/` },
    { name: crumb, url: canonical },
  ])}
<h1>${esc(cfg.h1)}</h1>
<p class="lede">${esc(cfg.lede)}</p>
<div class="intro">
${bodyHtml}
</div>
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

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(DIST)) {
    throw new Error(`[gen-seo] dist/ not found at ${DIST}. Run "vite build" first.`);
  }

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
