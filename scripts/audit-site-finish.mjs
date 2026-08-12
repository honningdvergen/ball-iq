// audit-site-finish.mjs — what on the site is not finished?
//
//   node scripts/audit-site-finish.mjs
//
// Answers "what is not 100% yet" from the BUILT OUTPUT rather than from
// memory. Every check below is something a visitor or a crawler would meet.
//
// ⚠️ Reads dist/, so run it after a build. It cannot see runtime behaviour —
// a page can pass every check here and still be broken when JS runs.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const DIST = 'dist';
const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e === 'index.html') pages.push(p);
  }
})(DIST);

// ⚠️ DECODE ENTITIES BEFORE MEASURING. A first run reported 12 over-length
// titles and they were all FALSE POSITIVES: the raw HTML holds "&amp;" and
// "&#39;", so "… Trivia & Answers | Ball IQ" measures 64 escaped and 59 as a
// human or Google sees it. Measuring the escaped string punishes any title
// containing an ampersand or an apostrophe — exactly the ones written well.
const decode = (s) => String(s)
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&mdash;/g, '—').replace(/&middot;/g, '·');
const grab = (s, re) => { const m = s.match(re); return m ? decode(m[1].trim()) : ''; };
const findings = { noTitle: [], longTitle: [], noDesc: [], longDesc: [], noCanonical: [], noH1: [], multiH1: [], thin: [], placeholder: [], noNav: [], noFooter: [] };
const internal = new Map();   // href -> pages linking to it
// ⚠️ NOT a bare /TODO/i. That matched the Spanish word "todo" ("all") in
// "casi todo el" on 14 /es/ pages — every one a false positive. Placeholders
// in our copy appear as standalone markers, so anchor on word boundaries and
// keep TODO/FIXME case-sensitive: the shout is the signal.
const PLACEHOLDER = /lorem ipsum|\bTODO\b|\bFIXME\b|coming soon|\bplaceholder\b|\bTBD\b|\bXXX\b/;

for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  const url = `/${relative(DIST, f).replace(/index\.html$/, '')}`;
  const title = grab(html, /<title>([^<]*)<\/title>/);
  const desc = grab(html, /name="description" content="([^"]*)"/);
  const canon = grab(html, /rel="canonical" href="([^"]*)"/);
  const h1s = html.match(/<h1[\s>]/g) || [];
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  if (!title) findings.noTitle.push(url); else if (title.length > 60) findings.longTitle.push(`${url} (${title.length})`);
  if (!desc) findings.noDesc.push(url); else if (desc.length > 160) findings.longDesc.push(`${url} (${desc.length})`);
  if (!canon) findings.noCanonical.push(url);
  if (h1s.length === 0) findings.noH1.push(url); else if (h1s.length > 1) findings.multiH1.push(`${url} (${h1s.length})`);
  if (text.length < 1200) findings.thin.push(`${url} (${text.length} chars)`);
  if (PLACEHOLDER.test(text)) findings.placeholder.push(`${url} — ${(text.match(PLACEHOLDER) || [])[0]}`);
  // ⚠️ CLIENT-RENDERED PAGES ARE NOT NAV-LESS. "/" and "/lineup/" ship an app
  // shell and build their header in JS, so reading static HTML reported them
  // as missing a nav they very much have. Embeds are headless on purpose.
  const clientRendered = /id="root"/.test(html) || url === '/lineup/' || url.startsWith('/embed/');
  if (!clientRendered && !/class="nav"/.test(html) && !/sr-mast/.test(html)) findings.noNav.push(url);
  if (!/class="foot"/.test(html) && !/<footer/.test(html)) findings.noFooter.push(url);

  for (const m of html.matchAll(/href="https:\/\/balliq\.app([^"#?]*)"/g)) {
    const t = m[1] || '/';
    if (!internal.has(t)) internal.set(t, new Set());
    internal.get(t).add(url);
  }
}

// A link that points at a path we never built is a 404 for a real visitor.
const built = new Set(pages.map((f) => `/${relative(DIST, f).replace(/index\.html$/, '')}`));
// ⚠️ SPA ROUTES ARE NOT DEAD LINKS. /play, /get and /footle have no file in
// dist — they are served by rewrites in vercel.json. Reported as 404s on the
// first run; read the rewrite table instead of guessing.
let REWRITES = '';
try { REWRITES = readFileSync('vercel.json', 'utf8'); } catch {}
const rewritten = (t) => REWRITES.includes(`"${t}"`) || REWRITES.includes(`"${t}/"`) || REWRITES.includes(`"${t.replace(/\/$/, '')}"`);
const dead = [...internal.keys()].filter((t) => {
  if (rewritten(t)) return false;
  if (!t.endsWith('/')) return !existsSync(join(DIST, t)) && !existsSync(join(DIST, `${t}.html`));
  return !built.has(t);
});
// Orphans: built, in the sitemap, but nothing links to them.
const orphans = [...built].filter((u) => u !== '/' && !(internal.get(u)?.size));

console.log(`pages built: ${pages.length}\n`);
const report = (label, arr, cap = 8) => {
  if (!arr.length) { console.log(`  ✅ ${label}: none`); return; }
  console.log(`  ⚠️  ${label}: ${arr.length}`);
  arr.slice(0, cap).forEach((x) => console.log(`        ${x}`));
  if (arr.length > cap) console.log(`        …and ${arr.length - cap} more`);
};
report('missing <title>', findings.noTitle);
report('title over 60 chars (truncates in SERP)', findings.longTitle);
report('missing meta description', findings.noDesc);
report('description over 160 chars', findings.longDesc);
report('missing canonical', findings.noCanonical);
report('no <h1>', findings.noH1);
report('multiple <h1>', findings.multiH1);
report('thin content (<1200 chars of text)', findings.thin);
report('placeholder text left in', findings.placeholder);
report('no site nav', findings.noNav);
report('no footer', findings.noFooter);
report('internal links to pages that do not exist', dead);
report('orphans — built but nothing links to them', orphans);
