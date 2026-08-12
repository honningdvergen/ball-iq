// audit-season-rot.mjs — find claims that go WRONG at kickoff.
//
//   node scripts/audit-season-rot.mjs
//
// ⚠️ THE COUNT THAT MATTERS IS NOT "MENTIONS A SEASON". A grep for
// /reigning|champions/ over the prose returns ~220 hits and ~all of them are
// fine: "Manchester City won the 2023-24 title" is true forever. A dated claim
// cannot rot. What rots is the UNDATED PRESENT TENSE — "the reigning
// champions", "currently the top scorer" — which is true until a date nobody
// wrote down, and then quietly false on an indexed page.
//
// So this classifies rather than counts:
//   ANCHORED — the claim carries a season/year within the same sentence.
//   ROT      — present-tense superlative or holder-claim with no anchor.
//
// ⚠️ A DETECTOR'S FIRST RUN IS A HYPOTHESIS. Every ROT hit is printed with its
// full sentence so it can be read and judged, not just tallied. Do not act on
// the number; read the lines.
// ── BASELINE, 2026-08-12 (9 days before the 2026-27 PL kickoff) ────────────
// Prose: 10 anchored, 4 unanchored — all four "remains the only ..." durable
//        records, which do not flip at a kickoff. Nothing to fix.
// Bank:  53 pattern matches, 19 unanchored — every one a HISTORICAL narrative
//        use ("stunned the reigning European champions in Monaco", 2013).
//        Past-tense "reigning" is true forever; nothing to fix.
// Tables: all 50 /lists tables already carry the 2025-26 season. A first pass
//        read them as "48 stale" because /\b(20)\d{2}\b/ pulls "2025" out of
//        "2025-26" — the artifact, not the data. Read last rows, not year maxima.
//
// So: NOT gated in the build. Gating today would fail on the four durable
// records above. Run it each May-June and after a tournament; act only on
// hits you have read.
import { readFileSync } from 'fs';

const FILES = [
  'scripts/seo/clubs.mjs', 'scripts/seo/players.mjs', 'scripts/seo/lists.mjs',
  'scripts/seo/categories.mjs', 'scripts/seo/nations.mjs', 'scripts/seo/funFacts.js',
];

// Present-tense claims whose truth value flips when a season ends.
const PERISHABLE = new RegExp([
  'reigning',
  'defending (?:champions?|title)',
  'current(?:ly)? (?:champions?|holders?|leaders?|top|the (?:most|best|top))',
  '(?:are|is) the (?:current|reigning)',
  'this season',
  'so far this',
  'have (?:not )?(?:yet )?won it since',
  '(?:remains?|stands?) the (?:record|most|only)',
].join('|'), 'i');

// An anchor: an explicit season, year, or an "as of" stamp in the SAME sentence.
const ANCHOR = /\b(?:as of|by|in|since|until|through)\s+\w*\s*\d{4}\b|\b(?:19|20)\d{2}[–\-/](?:\d{2}|\d{4})\b|\b(?:19|20)\d{2}\b/i;

let anchored = 0;
const rot = [];

for (const f of FILES) {
  let src;
  try { src = readFileSync(f, 'utf8'); } catch { continue; }
  // Work on string literals only — code identifiers are not user-facing prose.
  for (const m of src.matchAll(/(['"`])((?:[^\\\n]|\\.){25,600}?)\1/g)) {
    const text = m[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
    // Split to sentences so an anchor in sentence 3 cannot vouch for sentence 1.
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      if (!PERISHABLE.test(sentence)) continue;
      if (ANCHOR.test(sentence)) { anchored += 1; continue; }
      const line = src.slice(0, m.index).split('\n').length;
      rot.push({ f, line, sentence: sentence.trim() });
    }
  }
}

console.log(`anchored (safe, cannot rot): ${anchored}`);
console.log(`ROT RISK — undated present-tense claims: ${rot.length}\n`);
const byFile = {};
for (const r of rot) (byFile[r.f] ||= []).push(r);
for (const [f, rs] of Object.entries(byFile)) {
  console.log(`── ${f} (${rs.length})`);
  for (const r of rs) console.log(`   ${String(r.line).padStart(5)}  ${r.sentence.slice(0, 150)}`);
  console.log();
}
