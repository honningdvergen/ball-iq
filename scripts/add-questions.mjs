// add-questions.mjs — append forge-generated questions into src/questions.js.
//
// Usage:  node scripts/add-questions.mjs <input.json> [--cat Ligue1] [--type mcq] [--dry]
//
// input.json is an array of { q, o:[4], a, diff, hint? [, cat, type] }.
// Each entry gets a stable id = "q_" + sha1(q).slice(0,6) (same scheme the bank
// already uses). Entries whose id OR normalized question text already exist are
// skipped (idempotent). New entries are inserted at the end of the QB array,
// formatted to match the surrounding one-object-per-line style.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const inputPath = args.find(a => !a.startsWith('--'));
const flag = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const dry = args.includes('--dry');
const defCat = flag('cat', 'Ligue1');
const defType = flag('type', 'mcq');

if (!inputPath) { console.error('usage: node scripts/add-questions.mjs <input.json> [--cat X] [--type mcq] [--dry]'); process.exit(1); }

const QFILE = path.join(process.cwd(), 'src/questions.js');
const src = fs.readFileSync(QFILE, 'utf8');
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const items = Array.isArray(input) ? input : (input.kept || input.questions || []);

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const existingIds = new Set([...src.matchAll(/id:"(q_[0-9a-f]{6})"/g)].map(m => m[1]));
// Normalized existing question texts (best-effort; catches near-dup reuse).
const existingQ = new Set([...src.matchAll(/\bq:"((?:[^"\\]|\\.)*)"/g)].map(m => norm(m[1].replace(/\\"/g, '"'))));

const id6 = t => 'q_' + crypto.createHash('sha1').update(t).digest('hex').slice(0, 6);
const entries = [];
let skipped = 0;
const batchIds = new Set();
for (const it of items) {
  if (!it || typeof it.q !== 'string' || !Array.isArray(it.o) || it.o.length !== 4 || typeof it.a !== 'number') {
    console.warn('skip malformed:', JSON.stringify(it)?.slice(0, 80)); skipped++; continue;
  }
  const id = id6(it.q);
  const nq = norm(it.q);
  if (existingIds.has(id) || batchIds.has(id) || existingQ.has(nq)) { console.log('skip dup:', it.q.slice(0, 60)); skipped++; continue; }
  batchIds.add(id);
  const parts = [
    `id:${JSON.stringify(id)}`,
    `q:${JSON.stringify(it.q)}`,
    `o:${JSON.stringify(it.o)}`,
    `a:${it.a}`,
    `cat:${JSON.stringify(it.cat || defCat)}`,
    `type:${JSON.stringify(it.type || defType)}`,
    `diff:${JSON.stringify(it.diff || 'medium')}`,
  ];
  if (it.hint) parts.push(`hint:${JSON.stringify(it.hint)}`);
  if (it.club) parts.push(`club:${JSON.stringify(it.club)}`);
  parts.push('v:1');
  entries.push('  { ' + parts.join(', ') + ' },');
}

if (!entries.length) { console.log(`Nothing to add (${skipped} skipped).`); process.exit(0); }

// Insert at the end of the QB array (before its closing "];", which sits just
// before "export const TF_STATEMENTS").
const marker = 'export const TF_STATEMENTS';
const mIdx = src.indexOf(marker);
if (mIdx < 0) { console.error('could not find TF_STATEMENTS marker to anchor QB end'); process.exit(1); }
const before = src.slice(0, mIdx);
const after = src.slice(mIdx);
const closeIdx = before.lastIndexOf('];');
if (closeIdx < 0) { console.error('could not find QB closing "];"'); process.exit(1); }
const qbBody = before.slice(0, closeIdx);
const tail = before.slice(closeIdx);
const newSrc = qbBody + entries.join('\n') + '\n' + tail + after;

console.log(`Adding ${entries.length} question(s) to cat=${defCat} (${skipped} skipped).`);
if (dry) { console.log('\n--- DRY RUN, preview ---\n' + entries.join('\n')); process.exit(0); }
fs.writeFileSync(QFILE, newSrc);
console.log('Written. Run the build (eslint gate) to confirm the file still parses.');
