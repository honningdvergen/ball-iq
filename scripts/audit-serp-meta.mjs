#!/usr/bin/env node
// Fail the build when a generated page would be truncated in search results.
//
// WHY THIS EXISTS. Over-length titles have now been fixed TWICE. The first pass
// cleared 87 of them; then the /lists content type shipped 50 new pages that
// never inherited the rule, and 25 of them ran long — one at 75 characters. The
// pattern is not carelessness, it is that a NEW CONTENT TYPE cannot inherit a
// convention that lives only in a commit message. So it lives here instead.
//
// ⚠️ MEASURE DECODED TEXT, NOT RAW HTML. The first run of this audit reported 13
// failures that did not exist, because `&#39;` is five characters in the source
// and one on screen. Any check that reads dist/ HTML must decode entities first
// or it will invent work.
//
// Limits are the practical truncation points Google uses (~600px), expressed in
// characters. They are deliberately advisory-shaped: exceeding them does not
// break a page, it silently swaps your keywords for an ellipsis.

import fs from 'node:fs';
import path from 'node:path';

const TITLE_MAX = 60;
const DESC_MAX = 160;
const DIST = 'dist';

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
   .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') {
      const html = fs.readFileSync(p, 'utf8');
      pages.push({
        url: '/' + path.relative(DIST, dir).replace(/\\/g, '/'),
        title: decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''),
        desc: decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || ''),
      });
    }
  }
})(DIST);

const problems = [];
const seen = new Map();
for (const p of pages) {
  if (!p.title) problems.push(`${p.url} — no <title>`);
  else if (p.title.length > TITLE_MAX)
    problems.push(`${p.url} — title ${p.title.length} > ${TITLE_MAX}\n      ${p.title}`);
  if (!p.desc) problems.push(`${p.url} — no meta description`);
  else if (p.desc.length > DESC_MAX)
    problems.push(`${p.url} — description ${p.desc.length} > ${DESC_MAX}`);
  // Duplicate titles make Google pick one page and drop the rest.
  if (p.title) {
    if (seen.has(p.title)) problems.push(`${p.url} — title duplicates ${seen.get(p.title)}`);
    else seen.set(p.title, p.url);
  }
}

if (problems.length) {
  console.error(`\n✗ SERP metadata: ${problems.length} problem(s) across ${pages.length} pages\n`);
  for (const p of problems) console.error('   ' + p);
  console.error(
    '\n  Shorten the offender at its source (scripts/seo/*.mjs), do not truncate it.\n' +
    '  Lead with the entity; cut filler like "Full List of" / "Complete List".\n'
  );
  process.exit(1);
}
console.log(`✅ SERP metadata: ${pages.length} pages, no truncation or duplicates`);
