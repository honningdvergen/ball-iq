// trim-serp-copy.mjs — bring over-length titles and descriptions under the
// SERP limits, at the SOURCE, without mangling hand-written copy.
//
//   node scripts/trim-serp-copy.mjs            # propose
//   node scripts/trim-serp-copy.mjs --write    # apply
//
// ⚠️ WHY NOT JUST TRUNCATE. These strings are hand-written and every one ends
// in a deliberate clause. A blind cut at 60 or 160 leaves "…Spanish Football
// Trivia &" or a description that stops mid-word — worse in the SERP than the
// truncation Google would have applied itself, because it is now also wrong.
// So every proposal here cuts at a SEPARATOR (— · | , .) or a word boundary,
// never mid-word, and anything that cannot be cut cleanly is left alone and
// listed for a human.
//
// ⚠️ TITLES KEEP THE BRAND SUFFIX. " | Ball IQ" is 10 of the 60 characters and
// it is what makes the result recognisably ours in a list of ten. The trim
// comes out of the descriptive half, never the brand.
import { readFileSync, writeFileSync } from 'fs';

const write = process.argv.includes('--write');
const TITLE_MAX = 60;
const DESC_MAX = 160;
// ⚠️ EVERY SOURCE FILE, NOT A HAND-LISTED FEW. A first pass listed six files
// by name and found ZERO over-length strings — because the offenders live in
// drafts-p3.mjs, which was not on the list. A hardcoded file list silently
// under-reports the moment someone adds a file.
import { readdirSync } from 'fs';
const FILES = readdirSync('scripts/seo')
  .filter((f) => f.endsWith('.mjs') || f.endsWith('.js'))
  .map((f) => `scripts/seo/${f}`);

// Cut at the last separator or word boundary that fits. Never mid-word, never
// leaving dangling punctuation or a trailing conjunction.
function shorten(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  for (const sep of [' — ', ' · ', ' | ', ', ', '. ']) {
    const i = cut.lastIndexOf(sep);
    if (i > max * 0.55) return s.slice(0, i).replace(/[\s,;:—·|-]+$/, '');
  }
  const w = cut.lastIndexOf(' ');
  if (w > max * 0.55) {
    return s.slice(0, w).replace(/[\s,;:—·|-]+$/, '').replace(/\s+(and|or|the|a|an|with|for|of|in|to)$/i, '');
  }
  return null;                       // cannot cut cleanly — leave for a human
}

// Titles: shorten the descriptive half, keep " | Ball IQ".
function shortenTitle(t) {
  const m = t.match(/^(.*?)(\s*\|\s*Ball IQ)$/);
  if (!m) return shorten(t, TITLE_MAX);
  const head = shorten(m[1], TITLE_MAX - m[2].length);
  return head ? head + m[2] : null;
}

let proposed = 0; const manual = [];
for (const f of FILES) {
  let src;
  try { src = readFileSync(f, 'utf8'); } catch { continue; }
  let out = src;
  // Match the quoted value of a title:/description: field, single or double.
  for (const [field, max, fn] of [['title', TITLE_MAX, shortenTitle], ['description', DESC_MAX, (s) => shorten(s, DESC_MAX)]]) {
    const re = new RegExp(`(${field}:\\s*)(['"])((?:[^'"\\\\]|\\\\.)*?)\\2`, 'g');
    out = out.replace(re, (whole, lead, q, val) => {
      const plain = val.replace(/\\'/g, "'").replace(/\\"/g, '"');
      if (plain.length <= max) return whole;
      const next = fn(plain);
      if (!next || next.length > max) { manual.push(`${f} · ${field} (${plain.length}) — ${plain.slice(0, 70)}…`); return whole; }
      proposed += 1;
      console.log(`${f}  ${field}  ${plain.length} -> ${next.length}`);
      console.log(`   was: ${plain}`);
      console.log(`   now: ${next}\n`);
      const esc = q === "'" ? next.replace(/'/g, "\\'") : next.replace(/"/g, '\\"');
      return `${lead}${q}${esc}${q}`;
    });
  }
  if (write && out !== src) writeFileSync(f, out);
}

console.log(`proposed ${proposed} trim(s)${write ? ' — APPLIED' : ' (dry run; pass --write)'}`);
if (manual.length) {
  console.log(`\n${manual.length} could NOT be cut cleanly — these need a human:`);
  manual.forEach((m) => console.log(`   ${m}`));
}
