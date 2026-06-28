// Apply verified hints into the hand-curated question bank (src/questions.js).
//
//   node scripts/apply-hints.mjs path/to/hints.json [--dry]
//
// hints.json = [{ "id": "q_xxxxxx", "hint": "…" }, …]
//
// Each entry in questions.js is one line:
//   { id:"q_xxx", q:"…", o:[…], a:N, cat:"…", type:"mcq", diff:"…", v:1 },
// We insert  hint:"…",  immediately before the trailing `v:N` (matching the
// existing house format), double-quote-escaping the text. Idempotent: any
// entry that already has a hint is skipped, and ids not found are reported —
// nothing else in the file is touched.

import { readFileSync, writeFileSync } from 'node:fs';

const QPATH = 'src/questions.js';
const hintsPath = process.argv[2];
const dry = process.argv.includes('--dry');
if (!hintsPath) { console.error('usage: node scripts/apply-hints.mjs <hints.json> [--dry]'); process.exit(1); }

const hints = JSON.parse(readFileSync(hintsPath, 'utf8'));
const map = new Map(hints.map((h) => [h.id, h.hint]));

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const lines = readFileSync(QPATH, 'utf8').split('\n');
let applied = 0, already = 0, noVfield = 0;
const seen = new Set();

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^\s*\{ id:"([a-z0-9_]+)",/);
  if (!m) continue;
  const id = m[1];
  if (!map.has(id)) continue;
  seen.add(id);
  if (/\bhint:/.test(lines[i])) { already++; continue; }
  const inject = `, hint:"${esc(map.get(id))}",`;
  let next = lines[i].replace(/, (v:\d+)/, `${inject} $1`);
  if (next === lines[i]) {
    // no v:N field — insert before the closing ` }`
    next = lines[i].replace(/ \},?\s*$/, (mm) => `${inject}${mm}`);
  }
  if (next === lines[i]) { noVfield++; continue; }
  lines[i] = next;
  applied++;
}

const missing = [...map.keys()].filter((id) => !seen.has(id));
console.log(`apply-hints: ${applied} applied, ${already} already had a hint, ${noVfield} no insertion point, ${missing.length} id(s) not found`);
if (missing.length) console.log('  missing ids:', missing.join(', '));
if (dry) { console.log('(dry run — not written)'); process.exit(0); }
if (applied > 0) { writeFileSync(QPATH, lines.join('\n')); console.log(`wrote ${QPATH}`); }
