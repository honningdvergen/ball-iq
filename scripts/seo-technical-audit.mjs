// seo-technical-audit.mjs — what is the SITE doing that suppresses rankings?
//
//   node scripts/seo-technical-audit.mjs
//
// Backlinks are the known gap. This looks for the OTHER kind of problem: the
// on-site signals that hold a templated site down regardless of authority.
// Everything here is measured from the built dist/, not asserted.
//
// The headline risk for ~180 generated pages is BOILERPLATE RATIO. If two club
// pages are 90% identical text, Google treats them as near-duplicates and picks
// one to rank, suppressing the rest — the exact symptom of "lots of indexed
// pages all stuck on page 2-4".

import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

const pages = globSync('**/index.html', { cwd: DIST })
  .map((p) => path.join(DIST, p))
  .filter((p) => !p.includes('/assets/'));

const textOf = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const meta = (html, re) => (html.match(re) || [])[1] || '';

const docs = pages.map((f) => {
  const html = readFileSync(f, 'utf8');
  const rel = '/' + path.relative(DIST, f).replace(/index\.html$/, '');
  return {
    rel,
    kind: rel.startsWith('/quiz/') ? 'quiz' : rel.startsWith('/lists/') ? 'list' : 'other',
    title: meta(html, /<title>([^<]*)<\/title>/).replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&mdash;/g,'—'),
    desc: meta(html, /name="description" content="([^"]*)"/),
    canonical: meta(html, /rel="canonical" href="([^"]*)"/),
    words: textOf(html).split(' '),
    bytes: html.length,
    noindex: /noindex/.test(html),
  };
});

console.log(`pages built: ${docs.length}\n`);

// ── 1. BOILERPLATE RATIO ─────────────────────────────────────────────────────
// Shingle each page's text and measure how much of it also appears on other
// pages of the SAME KIND. High shared ratio = near-duplicate cluster.
const shingles = (words, n = 6) => {
  const s = new Set();
  for (let i = 0; i + n <= words.length; i++) s.add(words.slice(i, i + n).join(' ').toLowerCase());
  return s;
};

for (const kind of ['quiz', 'list']) {
  const group = docs.filter((d) => d.kind === kind);
  if (group.length < 3) continue;
  const sh = group.map((d) => ({ rel: d.rel, s: shingles(d.words) }));
  // frequency of each shingle across the group
  const freq = new Map();
  for (const g of sh) for (const x of g.s) freq.set(x, (freq.get(x) || 0) + 1);
  const rows = sh.map((g) => {
    let shared = 0;
    for (const x of g.s) if (freq.get(x) > 1) shared++;
    return { rel: g.rel, total: g.s.size, shared, pct: g.s.size ? (shared / g.s.size) * 100 : 0 };
  }).sort((a, b) => b.pct - a.pct);
  const avg = rows.reduce((s, r) => s + r.pct, 0) / rows.length;
  console.log(`── boilerplate ratio, ${kind} pages (${group.length})`);
  console.log(`   average text shared with a sibling page: ${avg.toFixed(1)}%`);
  console.log(`   worst 5:`);
  rows.slice(0, 5).forEach((r) => console.log(`     ${r.pct.toFixed(1).padStart(5)}%  ${r.rel}  (${r.total} shingles, ${r.total - r.shared} unique)`));
  const uniqueWords = rows.map((r) => r.total - r.shared);
  const thin = rows.filter((r) => r.total - r.shared < 150);
  if (thin.length) console.log(`   ⚠ ${thin.length} page(s) with under 150 unique 6-word phrases`);
  console.log();
}

// ── 2. TITLE / DESCRIPTION UNIQUENESS ────────────────────────────────────────
const dupe = (field) => {
  const m = new Map();
  docs.forEach((d) => { const v = d[field]; if (v) m.set(v, [...(m.get(v) || []), d.rel]); });
  return [...m.entries()].filter(([, v]) => v.length > 1);
};
const dupT = dupe('title'), dupD = dupe('desc');
console.log(`── duplicate <title>: ${dupT.length}`);
dupT.slice(0, 3).forEach(([t, v]) => console.log(`     "${t.slice(0, 60)}" ×${v.length}`));
console.log(`── duplicate meta description: ${dupD.length}`);
dupD.slice(0, 3).forEach(([t, v]) => console.log(`     "${t.slice(0, 60)}" ×${v.length}`));

// ── 3. TITLE LENGTH (SERP truncation ~60 chars) ──────────────────────────────
const longT = docs.filter((d) => d.title.length > 60);
console.log(`── titles over 60 chars (truncated in SERP): ${longT.length}/${docs.length}`);
longT.slice(0, 3).forEach((d) => console.log(`     ${d.title.length}  ${d.title.slice(0, 72)}…`));

// ── 4. CANONICAL SANITY ──────────────────────────────────────────────────────
const badCanon = docs.filter((d) => d.canonical && !d.canonical.endsWith(d.rel) && !d.canonical.endsWith(d.rel.replace(/\/$/, '')));
console.log(`── canonical mismatches: ${badCanon.length}`);
badCanon.slice(0, 3).forEach((d) => console.log(`     ${d.rel} -> ${d.canonical}`));

// ── 5. SITEMAP COVERAGE ──────────────────────────────────────────────────────
const smPath = path.join(DIST, 'sitemap.xml');
if (existsSync(smPath)) {
  const sm = readFileSync(smPath, 'utf8');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));
  const inSm = new Set(urls);
  const missing = docs.filter((d) => !d.noindex && !inSm.has(d.rel) && !inSm.has(d.rel.replace(/\/$/, '')));
  console.log(`── sitemap: ${urls.length} URLs; built pages NOT in it: ${missing.length}`);
  missing.slice(0, 6).forEach((d) => console.log(`     ${d.rel}`));
  const orphanSm = urls.filter((u) => !docs.some((d) => d.rel === u || d.rel.replace(/\/$/, '') === u));
  console.log(`   sitemap URLs with no built page: ${orphanSm.length}`);
  orphanSm.slice(0, 4).forEach((u) => console.log(`     ${u}`));
}

// ── 6. PAGE WEIGHT ───────────────────────────────────────────────────────────
const heavy = [...docs].sort((a, b) => b.bytes - a.bytes).slice(0, 3);
console.log(`── heaviest HTML:`);
heavy.forEach((d) => console.log(`     ${(d.bytes / 1024).toFixed(0)}KB  ${d.rel}`));
