// test-site.mjs: a regression suite for the BUILT static site (dist/).
//
// ⚠️ WHY (26 Oct 2026). The Google drop of 20 Oct was traced to signals the
// generated pages carried, and the fixes of 21-26 Oct live in several places
// (nb-html, lastmod, prune, the club page builder, vercel.json). Unit tests pin
// the generator's source; this pins what actually ships, so none of the fixes
// can come back silently. Run AFTER `npm run build`:
//
//   npm run test:site                 # checks ./dist
//   node scripts/test-site.mjs --dist <dir> [--vercel <vercel.json>]
//
// Deliberately NOT part of the Vercel build or the vitest suite (vitest runs
// before `vite build`, so it never sees a fresh dist). Plain Node, no clock:
// nothing here depends on today's date.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, CATEGORIES } from './seo/content.mjs';
import { CLUBS } from './seo/clubs.mjs';
import { PLAYERS } from './seo/players.mjs';
import { NATIONS } from './seo/nations.mjs';
import { PRUNED } from './seo/prune.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? resolve(process.argv[i + 1]) : dflt;
};
const DIST = arg('--dist', resolve(ROOT, 'dist'));
const VERCEL = arg('--vercel', resolve(ROOT, 'vercel.json'));
const LASTMOD = arg('--lastmod', resolve(ROOT, 'scripts/seo/lastmod.json'));

// Mirrors scripts/gen-seo-pages.mjs: club pages print this byline, and the
// "More quizzes to try" section is related.slice(0, 12).
const BYLINE = 'researched against sources and verified by Alex';
const MAX_MORE_TILES = 12;
const WIDGET_CAP = 60; // gen-seo-pages.mjs WIDGET_CAP: category/league, player, nation pages

if (!existsSync(resolve(DIST, 'sitemap.xml'))) {
  console.error(`✗ ${DIST}/sitemap.xml not found. Run \`npm run build\` first.`);
  process.exit(2);
}

// ── helpers ──────────────────────────────────────────────────────────────────
const rel = (f) => relative(DIST, f) || '.';
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const cache = new Map();
const read = (f) => {
  if (!cache.has(f)) cache.set(f, readFileSync(f, 'utf8'));
  return cache.get(f);
};
/** Site path ("/quiz/arsenal/", "/privacy.html") -> file in dist. */
const fileOf = (path) => resolve(DIST, `.${path}`, path.endsWith('/') ? 'index.html' : '');
const pathOfLoc = (loc) => (loc.startsWith(SITE.base) ? loc.slice(SITE.base.length) || '/' : null);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'))?.[1];
const canonicalOf = (html) => {
  const tags = html.match(/<link\b[^>]*\brel\s*=\s*"canonical"[^>]*>/gi) || [];
  return tags.map((t) => attr(t, 'href'));
};
const robotsOf = (html) => (html.match(/<meta\b[^>]*\bname\s*=\s*"robots"[^>]*>/gi) || []).map((t) => attr(t, 'content') || '');
const hreflangHrefs = (html) =>
  (html.match(/<link\b[^>]*\bhreflang\s*=\s*"[^"]*"[^>]*>/gi) || [])
    .filter((t) => /\brel\s*=\s*"alternate"/i.test(t))
    .map((t) => attr(t, 'href'));

const results = [];
function check(name, fn) {
  const fails = [];
  try {
    fn((msg) => fails.push(msg));
  } catch (e) {
    fails.push(`check crashed: ${e.stack || e}`);
  }
  results.push({ name, fails });
}

const vercel = JSON.parse(readFileSync(VERCEL, 'utf8'));
const notes = [];
/** api/<fn>.js that an exact-source vercel.json rewrite sends this path to, if any. */
function servedBy(path) {
  const r = (vercel.rewrites || []).find((x) => x.source === path && /^\/api\/[\w-]+(\?|$)/.test(x.destination));
  if (!r) return null;
  const fn = `api/${r.destination.slice(5).split('?')[0]}.js`;
  return existsSync(resolve(ROOT, fn)) ? fn : null;
}

// ── sitemap ──────────────────────────────────────────────────────────────────
const sitemapXml = read(resolve(DIST, 'sitemap.xml'));
const urlBlocks = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
const sitemapEntries = urlBlocks.map((b) => ({
  block: b,
  loc: b.match(/<loc>\s*([^<]*?)\s*<\/loc>/)?.[1],
  lastmods: [...b.matchAll(/<lastmod>\s*([^<]*?)\s*<\/lastmod>/g)].map((m) => m[1]),
}));
const sitemapPaths = new Set(sitemapEntries.map((e) => e.loc && pathOfLoc(e.loc)).filter(Boolean));

// ── 1. invisible characters ──────────────────────────────────────────────────
// tests/unit/no-break-score.test.js pins the SOURCE (nb-html, no noBreakScores
// in the generators); this pins the shipped HTML, which vitest never sees.
check('No U+2011 / U+2060 in dist/**/*.html', (fail) => {
  for (const f of htmlFiles) {
    const html = read(f);
    const n2011 = (html.match(/‑/g) || []).length;
    const n2060 = (html.match(/⁠/g) || []).length;
    if (n2011 || n2060) fail(`${rel(f)}: ${n2011} × U+2011 NON-BREAKING HYPHEN, ${n2060} × U+2060 WORD JOINER (use nbHtml from scripts/seo/nb-html.mjs)`);
  }
});

// ── 2. no Quiz / FAQPage structured data ────────────────────────────────────
check('No Quiz or FAQPage JSON-LD', (fail) => {
  const banned = new Set(['Quiz', 'FAQPage']);
  const typesIn = (node, out) => {
    if (Array.isArray(node)) node.forEach((n) => typesIn(n, out));
    else if (node && typeof node === 'object') {
      const t = node['@type'];
      for (const v of Array.isArray(t) ? t : [t]) {
        if (typeof v === 'string') out.add(v.replace(/^(https?:\/\/)?schema\.org\//, ''));
      }
      Object.values(node).forEach((v) => typesIn(v, out));
    }
    return out;
  };
  for (const f of htmlFiles) {
    const blocks = [...read(f).matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    blocks.forEach((m, i) => {
      let data;
      try {
        data = JSON.parse(m[1]);
      } catch (e) {
        fail(`${rel(f)}: ld+json block #${i + 1} is not valid JSON (${e.message})`);
        return;
      }
      const hits = [...typesIn(data, new Set())].filter((t) => banned.has(t));
      if (hits.length) fail(`${rel(f)}: ld+json block #${i + 1} has @type ${hits.join(', ')}`);
    });
  }
});

// ── 3. every sitemap URL is a built, self-canonical page ─────────────────────
check('Sitemap URLs exist in dist and are self-canonical', (fail) => {
  if (!sitemapEntries.length) fail('sitemap.xml: no <url> entries');
  for (const e of sitemapEntries) {
    if (!e.loc) { fail(`sitemap.xml: <url> without <loc>`); continue; }
    const path = pathOfLoc(e.loc);
    if (!path) { fail(`sitemap.xml: ${e.loc} is not on ${SITE.base}`); continue; }
    const file = fileOf(path);
    if (!existsSync(file)) {
      // A few pages are SERVED, not built (a daily page would be stale by the
      // next morning): an exact rewrite to an api/ function that exists is the 200.
      const fn = servedBy(path);
      if (fn) { notes.push(`${e.loc} is served by ${fn} (canonical not checked statically)`); continue; }
      fail(`sitemap.xml: ${e.loc} -> ${rel(file)} does not exist in dist, and no vercel.json rewrite serves it (would not be a 200)`);
      continue;
    }
    const canon = canonicalOf(read(file));
    if (canon.length !== 1) fail(`${rel(file)}: ${canon.length} <link rel="canonical"> tags (want exactly 1, pointing at ${e.loc})`);
    else if (canon[0] !== e.loc) fail(`${rel(file)}: canonical is ${canon[0]}, but the sitemap lists ${e.loc}`);
  }
});

// ── 4. per-page lastmod, from the store; no changefreq / priority ────────────
check('Sitemap lastmod matches scripts/seo/lastmod.json; no changefreq/priority', (fail) => {
  const store = JSON.parse(readFileSync(LASTMOD, 'utf8'));
  for (const tag of ['changefreq', 'priority']) {
    const n = (sitemapXml.match(new RegExp(`<${tag}>`, 'g')) || []).length;
    if (n) fail(`sitemap.xml: ${n} <${tag}> element(s); Google ignores them and they were removed on 26 Oct`);
  }
  for (const e of sitemapEntries) {
    if (!e.loc) continue;
    const path = pathOfLoc(e.loc);
    if (e.lastmods.length !== 1) { fail(`sitemap.xml: ${e.loc} has ${e.lastmods.length} <lastmod> (want 1)`); continue; }
    const got = e.lastmods[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(got)) fail(`sitemap.xml: ${e.loc} <lastmod>${got}</lastmod> is not YYYY-MM-DD`);
    const want = store[path]?.d;
    if (!want && servedBy(path)) fail(`sitemap.xml: ${e.loc} is served by ${servedBy(path)}, not built, so it has no entry in ${relative(ROOT, LASTMOD)}; buildSitemap's fallback stamps it with the build date (${got}), which moves every deploy`);
    else if (!want) fail(`sitemap.xml: ${e.loc} has no entry in ${relative(ROOT, LASTMOD)} (run a local build and commit the store)`);
    else if (got !== want) fail(`sitemap.xml: ${e.loc} <lastmod>${got}</lastmod> but ${relative(ROOT, LASTMOD)} says ${want}`);
  }
});

// ── 5. pruned pages: noindex, out of the sitemap, out of hreflang ────────────
check('Pruned pages are noindex, absent from sitemap and hreflang', (fail) => {
  for (const path of PRUNED) {
    const file = fileOf(path);
    if (!existsSync(file)) { fail(`${path}: pruned (scripts/seo/prune.mjs) but ${rel(file)} was not built`); continue; }
    const robots = robotsOf(read(file));
    if (!robots.some((c) => /\bnoindex\b/i.test(c))) fail(`${rel(file)}: pruned page has no robots noindex (robots: ${robots.join(' | ') || 'none'})`);
    if (sitemapPaths.has(path)) fail(`sitemap.xml: lists pruned page ${SITE.base}${path}`);
  }
  for (const f of htmlFiles) {
    for (const href of hreflangHrefs(read(f))) {
      const path = href && pathOfLoc(href);
      if (path && PRUNED.has(path)) fail(`${rel(f)}: hreflang alternate points at pruned page ${href}`);
    }
  }
});

// ── 6. /questions/ pages: redirected, not built ─────────────────────────────
check('/questions/* redirects exist in vercel.json and no /questions/ page is built', (fail) => {
  const redirects = vercel.redirects || [];
  for (const trail of ['/', '']) {
    const source = `/questions/:slug([a-z0-9-]+)-quiz-questions-and-answers${trail}`;
    const r = redirects.find((x) => x.source === source);
    if (!r) fail(`${relative(ROOT, VERCEL)}: no redirect with source "${source}"`);
    else {
      if (r.destination !== '/quiz/:slug/') fail(`${relative(ROOT, VERCEL)}: "${source}" goes to "${r.destination}", want "/quiz/:slug/"`);
      if (r.permanent !== true) fail(`${relative(ROOT, VERCEL)}: "${source}" is not permanent (want a 308)`);
    }
  }
  const qdir = resolve(DIST, 'questions');
  if (existsSync(qdir)) {
    const built = walk(qdir).filter((f) => f.endsWith('.html'));
    fail(`dist/questions/ exists with ${built.length} HTML file(s), e.g. ${built.slice(0, 3).map(rel).join(', ')}; Vercel serves files before redirects, so they would shadow the 308s`);
  }
});

// ── 7. club pages: byline, at most 12 "More quizzes" tiles ───────────────────
check('Club pages carry the byline and ≤12 "More quizzes" tiles', (fail) => {
  for (const c of CLUBS) {
    const file = fileOf(`/quiz/${c.slug}/`);
    if (!existsSync(file)) { fail(`${rel(file)}: club page for ${c.slug} was not built`); continue; }
    const html = read(file);
    const byline = html.match(/<p\b[^>]*\bclass\s*=\s*"byline"[^>]*>([\s\S]*?)<\/p>/i);
    if (!byline) fail(`${rel(file)}: no <p class="byline">`);
    else if (!byline[1].includes(BYLINE)) fail(`${rel(file)}: byline does not say "${BYLINE}"`);
    const sec = html.match(/<h2>More quizzes to try<\/h2>([\s\S]*?)<\/section>/);
    if (!sec) { fail(`${rel(file)}: no "More quizzes to try" section`); continue; }
    const tiles = (sec[1].match(/<a\b[^>]*\bclass\s*=\s*"tile"/g) || []).length;
    if (tiles > MAX_MORE_TILES) fail(`${rel(file)}: ${tiles} "More quizzes" tiles (max ${MAX_MORE_TILES})`);
    if (tiles === 0) fail(`${rel(file)}: "More quizzes" section has no tiles`);
  }
});

// ── 8. league/category, player and nation pages: widget ≤ 60 questions ──────
check(`Category, player and nation quiz widgets carry ≤${WIDGET_CAP} questions`, (fail) => {
  for (const p of [...CATEGORIES, ...PLAYERS, ...NATIONS]) {
    const file = fileOf(`/quiz/${p.slug}/`);
    if (!existsSync(file)) { fail(`${rel(file)}: page for ${p.slug} was not built`); continue; }
    const n = (read(file).match(/<li\b[^>]*\bclass\s*=\s*"bq-q"/g) || []).length;
    if (n > WIDGET_CAP) fail(`${rel(file)}: quiz widget carries ${n} questions (max ${WIDGET_CAP})`);
  }
});

// ── report ───────────────────────────────────────────────────────────────────
let failed = 0;
console.log(`test:site — ${htmlFiles.length} HTML files, ${sitemapEntries.length} sitemap URLs, in ${DIST}`);
for (const r of results) {
  if (!r.fails.length) { console.log(`  ✓ ${r.name}`); continue; }
  failed++;
  console.log(`  ✗ ${r.name} — ${r.fails.length} problem(s)`);
  for (const m of r.fails.slice(0, 25)) console.log(`      · ${m}`);
  if (r.fails.length > 25) console.log(`      · … and ${r.fails.length - 25} more`);
}
for (const n of notes) console.log(`  · note: ${n}`);
console.log(failed ? `\n✗ ${failed} of ${results.length} checks failed` : `\n✓ all ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
