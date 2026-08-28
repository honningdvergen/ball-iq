// BUILD GATE — no page in the sitemap may be an ORPHAN.
//
// An orphan is a page listed in sitemap.xml that no other page links to with an
// ordinary <a href>. Google will usually still index it, so it looks fine in a
// coverage report — but it receives no internal authority, which is why orphans
// rank badly rather than not at all. That failure mode is invisible to every
// other gate we have: the page builds, renders, has a canonical, has metadata,
// and passes the SERP audit.
//
// ⚠️ THIS HAS SHIPPED THREE TIMES, AND THE LESSON WAS ALREADY WRITTEN DOWN.
//   1. /lists — 50 pages, found by the 2026-07-28 ranking diagnosis.
//   2. /questions — 71 pages. gen-seo-pages.mjs still carries the comment added
//      at the time: "without this the /questions layer ships ORPHANED".
//   3. /es/ /pt/ /tr/ /id/ — all 20 localised pages, found 2026-08-16, with
//      that comment sitting a few lines above the club-page link mesh.
//
// So a written lesson did not prevent the third one. The pattern is that a new
// page TYPE gets a builder, a sitemap entry and hreflang, and nobody adds the
// inbound link — because nothing fails when they don't. Hence a gate.
//
// ⚠️ hreflang <link> tags in <head> DO NOT COUNT and this script strips <head>
// before looking. An alternate declares which page serves which language; it
// does not pass weight. The localised layer had a complete, reciprocal hreflang
// cluster and was still orphaned.
//
// ⚠️ WHAT THIS GATE DOES NOT CATCH. It asks "is there at least one inbound
// link", not "is that link worth anything". A cluster that only links to itself
// passes: the 16 localised club pages each have one inbound link from their own
// language hub, so they clear this gate even though every link into the cluster
// comes from inside it. That is a real gap and measuring it properly means
// approximating PageRank, which is not worth building here. Verified behaviour,
// not an oversight — when adding a page type, ask separately whether an
// ESTABLISHED page links to it, not merely whether something does.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = 'dist';

// The homepage is linked from every page's nav/logo but is itself the root of
// the graph; it needs no inbound link to be reachable.
const EXEMPT = new Set(['/']);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (String(entry.name ?? entry).startsWith('.')) continue; // skip src/.claude worktrees
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (/\.html$/i.test(entry)) yield p;
  }
}

const toUrl = (f) => f.replace(/^dist/, '').replace(/index\.html$/, '');

// Only pages we ASK Google to index need inbound links. A page absent from the
// sitemap is deliberately not part of the crawl surface.
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const indexed = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://balliq.app', '')),
);

const pages = [...walk(ROOT)];
const inbound = new Map();
for (const u of pages.map(toUrl)) if (indexed.has(u)) inbound.set(u, new Set());

for (const f of pages) {
  const from = toUrl(f);
  // Strip <head> so hreflang alternates and canonicals are not mistaken for
  // crawlable links — see the note at the top of this file.
  const body = readFileSync(f, 'utf8').replace(/<head[\s\S]*?<\/head>/i, '');
  for (const m of body.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
    let h = m[1].split('#')[0].split('?')[0];
    if (!h.startsWith('/')) {
      if (!h.startsWith('https://balliq.app')) continue;
      h = h.replace('https://balliq.app', '');
    }
    if (!h.endsWith('/') && !/\.[a-z0-9]+$/i.test(h)) h += '/';
    // A page linking to itself (breadcrumb tail, canonical CTA) is not inbound.
    if (inbound.has(h) && h !== from) inbound.get(h).add(from);
  }
}

const orphans = [...inbound].filter(([u, s]) => s.size === 0 && !EXEMPT.has(u)).map(([u]) => u);

if (orphans.length) {
  console.error(`\n✗ ORPHANED PAGES — ${orphans.length} page(s) in the sitemap with no inbound internal link\n`);
  // Group by first path segment: orphans arrive a whole page-type at a time,
  // never one at a time, so the segment names the builder that needs the link.
  const byType = {};
  for (const u of orphans) (byType[u.split('/')[1] || '(root)'] ||= []).push(u);
  for (const [type, us] of Object.entries(byType)) {
    console.error(`  /${type}/ — ${us.length} page(s)`);
    console.error(`    ${us.slice(0, 5).join('\n    ')}${us.length > 5 ? `\n    …+${us.length - 5} more` : ''}`);
  }
  console.error('\n  These are indexable but receive NO internal authority, so they rank badly');
  console.error('  rather than not at all — invisible to every other gate.');
  console.error('  Add a real <a href> from an established page. hreflang does NOT count.');
  console.error('  See the header of this file for the three times this has shipped.\n');
  process.exit(1);
}

console.log(`✅ No orphaned pages (${inbound.size} sitemap pages, all internally linked)`);
