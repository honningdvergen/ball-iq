// shorten-titles.mjs — get every <title> under the ~60-char SERP cut.
//
//   node scripts/shorten-titles.mjs           # dry run, shows every change
//   node scripts/shorten-titles.mjs --apply   # writes scripts/seo/*.mjs
//
// 87 of 164 titles were being truncated by Google, which drops the tail — and
// the tail is where "| Ball IQ" lives, so more than half our results were
// showing without the brand. The shared suffix
//   " Trivia Questions & Answers | Ball IQ"
// is 36 characters of near-boilerplate carrying one useful keyword ("Trivia"),
// and "Questions & Answers" already appears in every H1, description and body.
//
// Only touches titles that ACTUALLY exceed the limit. A 59-char title is fine
// and gets left alone — the goal is fitting the SERP, not uniformity.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const FILES = ['scripts/seo/clubs.mjs', 'scripts/seo/players.mjs', 'scripts/seo/content.mjs', 'scripts/seo/lists.mjs', 'scripts/seo/nations.mjs', 'scripts/seo/leagues.mjs'];
const LIMIT = 60;

// Ordered least-destructive first. Stop at the first that fits.
const STEPS = [
  [' Questions & Answers | Ball IQ', ' | Ball IQ'],
  [' Trivia | Ball IQ', ' | Ball IQ'],
  [' Quiz — ', ' — '],
];

// A title as the SERP measures it, not as it sits in source.
const rendered = (t) => t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

let changed = 0, kept = 0, stubborn = [];

for (const rel of FILES) {
  const abs = path.resolve(rel);
  let src;
  try { src = readFileSync(abs, 'utf8'); } catch { continue; }

  const out = src.replace(/("title"\s*:\s*|title:\s*)(['"])((?:\\.|(?!\2).)*)\2/g, (m, key, q, val) => {
    if (rendered(val).length <= LIMIT) { kept++; return m; }
    let t = val;
    for (const [from, to] of STEPS) {
      if (rendered(t).length <= LIMIT) break;
      if (t.includes(from)) t = t.replace(from, to);
    }
    if (rendered(t).length > LIMIT) { stubborn.push(t); return m; }
    changed++;
    console.log(`  ${String(rendered(val).length).padStart(3)} → ${String(rendered(t).length).padStart(2)}  ${rendered(t)}`);
    return `${key}${q}${t}${q}`;
  });

  if (APPLY && out !== src) writeFileSync(abs, out, 'utf8');
}

console.log(`\n${changed} shortened · ${kept} already fitted · ${stubborn.length} still over ${LIMIT}`);
stubborn.slice(0, 8).forEach((t) => console.log(`  ⚠ ${rendered(t).length}  ${rendered(t)}`));
if (!APPLY) console.log('\n(dry run — re-run with --apply to write)');
