// scripts/find-vintage-candidates.mjs
//
// Phase 6c.2 prep: scan QB and TF_STATEMENTS for questions that look
// pre-2000 — heuristic year-text + name matching — and emit a review
// list grouped by category. Skips cat:"Legends" entries (already in
// the right bucket; the casual gate from Phase 6c.1 covers them).
//
// Usage:
//   npm run find-vintage
//
// Outputs:
//   scripts/.vintage-candidates.json  — programmatic, for the eventual
//                                        tagging script to consume
//   scripts/.vintage-candidates.md    — human-readable, for the review
//                                        session
//
// Both are gitignored as local artifacts; the canonical record of
// tagging decisions will live in src/questions.js as `era: "vintage"`
// fields after Phase 6c.2 ships.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QFILE = path.join(ROOT, 'src', 'questions.js');
const JSON_OUT = path.join(__dirname, '.vintage-candidates.json');
const MD_OUT = path.join(__dirname, '.vintage-candidates.md');

// ─── Detection rules ─────────────────────────────────────────────────────────
// Year text: any 4-digit 19XX in question/statement/hint. Captures
// "1970 World Cup", "Bosman ruling 1995", "Pelé's 1958 debut", etc.
const YEAR_RE = /\b(19[0-9]{2})\b/g;

// Pre-2000-anchored names. Substring match, case-insensitive. Start
// narrow — list is easier to extend than to narrow once tagging
// decisions are in flight. Names that span both eras (e.g., Maldini
// 1985-2009, Buffon active well into 2010s) are intentionally
// excluded so we don't false-positive their modern moments.
const VINTAGE_NAMES = [
  // Pre-1980 legends
  'pelé', 'pele',
  'cruyff',
  'beckenbauer',
  'eusébio', 'eusebio',
  'di stéfano', 'di stefano',
  'puskás', 'puskas',
  'yashin',
  'garrincha',
  'bobby moore',
  'george best',
  'bobby charlton', 'jack charlton',
  'gordon banks',
  'gerd müller', 'gerd muller',
  'kevin keegan',
  // 1970s-1990s managers and figures
  'shankly',
  'paisley',
  'busby',
  'jock stein',
  'brian clough',
  'bobby robson',
  'don revie',
  'cesar luis menotti',
  // Pre-2000 player icons
  'maradona',
  'platini',
  'rummenigge',
  'zico',
  'sócrates', 'socrates',
  'rivelino',
  'careca',
  'baggio',
  'van basten',
  'gullit',
  'rijkaard',
  'glenn hoddle',
  'gary lineker',
  'bryan robson',
  'peter shilton',
  'kenny dalglish',
  'ian rush',
  'paul gascoigne',
  'gianluca vialli',
  'roberto baggio',
];

// ─── Load questions.js ───────────────────────────────────────────────────────
console.log('# find-vintage-candidates');
console.log(`Source:        ${path.relative(ROOT, QFILE)}`);
console.log('');

const importUrl = pathToFileURL(QFILE).href + `?cache=${Date.now()}`;
const mod = await import(importUrl);
const QB = Array.isArray(mod.QB) ? mod.QB : [];
const TF = Array.isArray(mod.TF_STATEMENTS) ? mod.TF_STATEMENTS : [];
console.log(`Loaded:        QB=${QB.length}, TF_STATEMENTS=${TF.length}`);

// ─── Scan ────────────────────────────────────────────────────────────────────
const candidates = []; // flat list across QB + TF
let qbScanned = 0, qbSkippedLegends = 0, qbHit = 0;
let tfScanned = 0, tfHit = 0;

function scanText(text) {
  if (!text || typeof text !== 'string') return { years: [], names: [] };
  const years = [];
  const seenY = new Set();
  let m;
  YEAR_RE.lastIndex = 0;
  while ((m = YEAR_RE.exec(text)) !== null) {
    if (!seenY.has(m[1])) {
      years.push(m[1]);
      seenY.add(m[1]);
    }
  }
  const lower = text.toLowerCase();
  const names = VINTAGE_NAMES.filter(n => lower.includes(n));
  return { years, names };
}

for (const q of QB) {
  if (!q || typeof q !== 'object') continue;
  qbScanned++;
  if (q.cat === 'Legends') { qbSkippedLegends++; continue; }
  const text = [q.q, q.hint].filter(Boolean).join(' ¦ ');
  const { years, names } = scanText(text);
  if (years.length === 0 && names.length === 0) continue;
  qbHit++;
  candidates.push({
    source: 'qb',
    id: q.id,
    cat: q.cat || '(uncategorized)',
    q: q.q,
    matchedYears: years,
    matchedNames: names,
  });
}

for (const s of TF) {
  if (!s || typeof s !== 'object') continue;
  tfScanned++;
  // TF entries don't have cat:"Legends" today; scan all.
  const text = s.s || '';
  const { years, names } = scanText(text);
  if (years.length === 0 && names.length === 0) continue;
  tfHit++;
  candidates.push({
    source: 'tf',
    id: s.id,
    cat: s.cat || '(no cat)',
    q: s.s,
    matchedYears: years,
    matchedNames: names,
  });
}

// ─── Group by category ───────────────────────────────────────────────────────
const byCategory = {};
for (const c of candidates) {
  if (!byCategory[c.cat]) byCategory[c.cat] = [];
  byCategory[c.cat].push(c);
}
const sortedCatNames = Object.keys(byCategory).sort();

// ─── Console summary ─────────────────────────────────────────────────────────
console.log('');
console.log(`QB scanned:    ${qbScanned} (skipped ${qbSkippedLegends} cat:Legends)`);
console.log(`TF scanned:    ${tfScanned}`);
console.log(`Candidates:    ${candidates.length}  (QB ${qbHit} + TF ${tfHit})`);
console.log('');
console.log('## By category');
for (const cat of sortedCatNames) {
  console.log(`  ${cat.padEnd(20)} ${byCategory[cat].length}`);
}

// ─── JSON output ─────────────────────────────────────────────────────────────
const jsonPayload = {
  generatedAt: new Date().toISOString(),
  totalCandidates: candidates.length,
  qbScanned,
  qbSkippedLegends,
  tfScanned,
  byCategory: Object.fromEntries(
    sortedCatNames.map(cat => [cat, byCategory[cat]])
  ),
};
fs.writeFileSync(JSON_OUT, JSON.stringify(jsonPayload, null, 2));

// ─── Markdown output ─────────────────────────────────────────────────────────
const mdLines = [];
mdLines.push(`# Vintage candidates — Phase 6c.2 review list`);
mdLines.push('');
mdLines.push(`Generated: ${new Date().toISOString()}`);
mdLines.push(`QB scanned: ${qbScanned} (skipped ${qbSkippedLegends} cat:Legends)`);
mdLines.push(`TF scanned: ${tfScanned}`);
mdLines.push(`Candidates: **${candidates.length}** (QB ${qbHit} + TF ${tfHit})`);
mdLines.push('');
mdLines.push(`## Detection rules`);
mdLines.push('');
mdLines.push(`Heuristic — at least one match in question/statement/hint text:`);
mdLines.push(`- 4-digit year matching \`19[0-9]{2}\``);
mdLines.push(`- Name substring (case-insensitive): ${VINTAGE_NAMES.length} names — ${VINTAGE_NAMES.slice(0, 8).join(', ')}, etc.`);
mdLines.push('');
mdLines.push(`False positives expected — e.g. "active until 1979 but signed in 2010" gets flagged. Manual review needed for each entry.`);
mdLines.push('');
mdLines.push(`---`);
mdLines.push('');
for (const cat of sortedCatNames) {
  const items = byCategory[cat];
  mdLines.push(`## ${cat} — ${items.length} candidate${items.length === 1 ? '' : 's'}`);
  mdLines.push('');
  for (const c of items) {
    const tags = [
      c.matchedYears.length ? `years: ${c.matchedYears.join(', ')}` : null,
      c.matchedNames.length ? `names: ${c.matchedNames.join(', ')}` : null,
    ].filter(Boolean).join(' · ');
    mdLines.push(`- \`${c.id}\` (${c.source}) — ${tags}`);
    mdLines.push(`  > ${c.q.replace(/\n/g, ' ')}`);
  }
  mdLines.push('');
}
fs.writeFileSync(MD_OUT, mdLines.join('\n'));

console.log('');
console.log(`Wrote ${path.relative(ROOT, JSON_OUT)}`);
console.log(`Wrote ${path.relative(ROOT, MD_OUT)}`);
console.log('');
console.log('Next:');
console.log('  1. Open the .md file for the review session.');
console.log('  2. Mark each candidate with era:"vintage" or skip.');
console.log('  3. Phase 6c.2 will ship the tagging script that bakes');
console.log('     decisions into src/questions.js.');
