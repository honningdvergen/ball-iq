// One-shot migration script for the question-bank review tool (Phase 1).
//
// What this does:
//   1. Slices the CHAOS_QB, QB, and TF_STATEMENTS array literals out of
//      src/App.jsx via regex (each block is `const NAME = [` ... `\n];`).
//   2. Dynamically imports those arrays so we don't need a JS parser dependency.
//   3. Computes a stable 6-char SHA-1 id for every entry. CHAOS_QB items become
//      part of QB at runtime via spread, so they get the same q_ prefix and
//      will hash to the same id whether reviewed via the chaos array or QB.
//   4. Detects collisions and bumps the colliding ids to 8 chars.
//   5. Re-serialises the three arrays into src/questions.js as one entry per
//      line, with a canonical field order, and exports them.
//   6. Patches src/App.jsx:
//        - Removes the three array literal blocks.
//        - Adds an `import { CHAOS_QB, QB, TF_STATEMENTS } from './questions.js'`.
//        - Removes the now-unused QB_INDEX_BY_REF map.
//        - Rewrites qbHistKey to use q.id, and the TF keying spots to use s.id.
//        - Bumps the localStorage seen-history key from biq_seen_history to
//          biq_seen_history_v2 so dev-user histories silently expire.
//        - Updates the doc comment for the seen-history section.
//
// Idempotent guard: the script aborts cleanly if src/questions.js already
// exists (so re-running it doesn't overwrite work).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'src', 'App.jsx');
const QFILE = path.join(ROOT, 'src', 'questions.js');
const TMP = path.join(__dirname, '.tmp-questions-eval.mjs');

if (fs.existsSync(QFILE)) {
  console.error(`ABORT: ${QFILE} already exists. Refusing to overwrite.`);
  process.exit(1);
}

const src = fs.readFileSync(APP, 'utf8');

function sliceConst(name) {
  const re = new RegExp(`(?:^|\\n)(const ${name} = \\[[\\s\\S]*?\\n\\];)`, 'm');
  const m = src.match(re);
  if (!m) throw new Error(`Could not locate \`const ${name} = [...]\` in App.jsx`);
  return m[1];
}

const chaosBlock = sliceConst('CHAOS_QB');
const qbBlock = sliceConst('QB');
const tfBlock = sliceConst('TF_STATEMENTS');

// Eval the three blocks via a temp ESM module
fs.writeFileSync(
  TMP,
  [chaosBlock, qbBlock, tfBlock]
    .map(b => b.replace(/^const /, 'export const '))
    .join('\n\n')
);

const mod = await import(pathToFileURL(TMP).href);
const { CHAOS_QB, QB, TF_STATEMENTS } = mod;

if (!Array.isArray(QB) || QB.length < 3000) {
  throw new Error(`Sanity check failed: QB length is ${QB?.length}`);
}
if (!Array.isArray(TF_STATEMENTS) || TF_STATEMENTS.length < 100) {
  throw new Error(`Sanity check failed: TF_STATEMENTS length is ${TF_STATEMENTS?.length}`);
}
if (!Array.isArray(CHAOS_QB) || CHAOS_QB.length < 10) {
  throw new Error(`Sanity check failed: CHAOS_QB length is ${CHAOS_QB?.length}`);
}

function makeIds(items, prefix, textKey) {
  // First pass at 6 chars to find collision groups
  const groups = new Map();
  for (const item of items) {
    const text = item[textKey] ?? '';
    const h = crypto.createHash('sha1').update(text).digest('hex').slice(0, 6);
    if (!groups.has(h)) groups.set(h, []);
    groups.get(h).push(text);
  }
  // Identify hashes where the *texts* differ (true collisions)
  const collide = new Set();
  for (const [h, texts] of groups) {
    const distinct = new Set(texts);
    if (distinct.size > 1) collide.add(h);
  }
  // Second pass: assign ids, bumping colliders to 8 chars
  let bumped = 0;
  const result = items.map(item => {
    const text = item[textKey] ?? '';
    const h6 = crypto.createHash('sha1').update(text).digest('hex').slice(0, 6);
    if (collide.has(h6)) {
      bumped++;
      const h8 = crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
      return { ...item, id: `${prefix}_${h8}` };
    }
    return { ...item, id: `${prefix}_${h6}` };
  });
  return { items: result, collisionsBumped: bumped };
}

const chaosOut = makeIds(CHAOS_QB, 'q', 'q');
const qbOut = makeIds(QB, 'q', 'q');
const tfOut = makeIds(TF_STATEMENTS, 'tf', 's');

// Canonical serialisation: one entry per line, fixed field order, JSON-style
// values, single space after `{`, single space before `}`, no space after `:`,
// single space after `,`. Matches the existing in-source style.
const QB_FIELD_ORDER = ['id', 'q', 'o', 'a', 'cat', 'tag', 'type', 'diff', 'hint', 'v', 'flag'];
const TF_FIELD_ORDER = ['id', 's', 'a', 'cat', 'tag', 'flag'];

function serializeEntry(o, order) {
  const parts = [];
  for (const k of order) {
    if (o[k] === undefined) continue;
    parts.push(`${k}:${JSON.stringify(o[k])}`);
  }
  for (const k of Object.keys(o)) {
    if (order.includes(k) || k === '_tfIdx') continue;
    parts.push(`${k}:${JSON.stringify(o[k])}`);
  }
  return `  { ${parts.join(', ')} },`;
}

function serializeArray(items, order) {
  return items.map(o => serializeEntry(o, order)).join('\n');
}

const questionsFile = `// AUTO-GENERATED FORMAT — content is hand-curated.
//
// All entries carry a stable \`id\` derived from the question text (SHA-1, 6
// hex chars, prefixed q_ or tf_). Edits to the question text intentionally
// do NOT change the id — review decisions are keyed by the original id and
// remain attached to the entry across edits. Do not edit ids by hand.
//
// CHAOS_QB items are spread into QB at app startup (see src/App.jsx) so the
// runtime question pool stays the same as before this extraction.

// ─── CHAOS QUESTIONS ──────────────────────────────────────────────────────────
// Quotes, weird moments, cult-football trivia. Every item carries
// cat:"chaos" + tag:"chaos" so Chaos mode's filter picks them up.
export const CHAOS_QB = [
${serializeArray(chaosOut.items, QB_FIELD_ORDER)}
];

// ─── QUESTION BANK ────────────────────────────────────────────────────────────
export const QB = [
${serializeArray(qbOut.items, QB_FIELD_ORDER)}
];

// ─── TRUE / FALSE STATEMENTS ──────────────────────────────────────────────────
export const TF_STATEMENTS = [
${serializeArray(tfOut.items, TF_FIELD_ORDER)}
];
`;

// Now patch App.jsx
let app = src;

// 1) Remove the three array blocks (and any trailing blank line)
for (const block of [chaosBlock, qbBlock, tfBlock]) {
  if (!app.includes(block)) throw new Error('Block not found during removal');
  app = app.replace(block + '\n', '');
}

// 2) Remove the now-orphaned section header comments above each removed block.
//    (The comments above CHAOS_QB and QB are multi-line.)
const chaosHeaderComment =
`// ─── CHAOS QUESTIONS ──────────────────────────────────────────────────────────
// Placeholder for Chaos mode content — quotes, weird moments, cult-football trivia.
// Every item should carry cat:"chaos" (and optionally tag:"chaos") so the mode's
// filter picks them up. Difficulty is stored as "mixed" because the Chaos pool
// is ramp-free.
`;
if (app.includes(chaosHeaderComment)) {
  app = app.replace(chaosHeaderComment, '');
}

const qbHeaderComment = `// ─── QUESTION BANK ────────────────────────────────────────────────────────────\n`;
if (app.includes(qbHeaderComment)) {
  app = app.replace(qbHeaderComment, '');
}

const tfHeaderComment = `// ── TRUE / FALSE STATEMENTS ────────────────────────────────────────────────────\n`;
if (app.includes(tfHeaderComment)) {
  app = app.replace(tfHeaderComment, '');
}

// 3) Add the import for the extracted arrays. Insert after the last existing
//    import at the top of the file.
const importLine = `import { CHAOS_QB, QB, TF_STATEMENTS } from './questions.js';\n`;
if (!app.includes(importLine)) {
  app = app.replace(
    /^((?:import [^\n]*\n)+)/m,
    (m) => m + importLine
  );
  if (!app.includes(importLine)) throw new Error('Failed to insert import line');
}

// 4) Replace the qbHistKey block with the id-based version.
const oldQbHistKey =
`const QB_INDEX_BY_REF = new Map();
QB.forEach((q, i) => { if (q && typeof q === "object") QB_INDEX_BY_REF.set(q, i); });
const qbHistKey = (origQ) => {
  const i = QB_INDEX_BY_REF.get(origQ);
  return typeof i === "number" ? \`q:\${i}\` : null;
};`;
const newQbHistKey = `const qbHistKey = (origQ) => (origQ && origQ.id ? \`q:\${origQ.id}\` : null);`;
if (!app.includes(oldQbHistKey)) throw new Error('qbHistKey block not found');
app = app.replace(oldQbHistKey, newQbHistKey);

// 5) Update the two TF keying spots to use s.id.
const oldTfKeyFn = `const keyFn = (s) => (typeof s._tfIdx === "number" ? \`tf:\${s._tfIdx}\` : null);`;
const newTfKeyFn = `const keyFn = (s) => (s && s.id ? \`tf:\${s.id}\` : null);`;
if (!app.includes(oldTfKeyFn)) throw new Error('TF keyFn line not found');
app = app.replace(oldTfKeyFn, newTfKeyFn);

const oldTfHistKey = `qs = shuffle(leagueTF).slice(0, 20).map(s => ({ ...s, _histKey: \`tf:\${s._tfIdx}\` }));`;
const newTfHistKey = `qs = shuffle(leagueTF).slice(0, 20).map(s => ({ ...s, _histKey: \`tf:\${s.id}\` }));`;
if (!app.includes(oldTfHistKey)) throw new Error('TF _histKey line not found');
app = app.replace(oldTfHistKey, newTfHistKey);

// 6) Bump localStorage key + update the doc comment block above it.
const oldSeenKey = `const SEEN_HISTORY_KEY = "biq_seen_history";`;
const newSeenKey = `const SEEN_HISTORY_KEY = "biq_seen_history_v2";`;
if (!app.includes(oldSeenKey)) throw new Error('SEEN_HISTORY_KEY not found');
app = app.replace(oldSeenKey, newSeenKey);

const oldSeenComment =
`// ─── SEEN QUESTION HISTORY ────────────────────────────────────────────────────
// Tracks questions already shown to the user with a timestamp, and filters
// them out of future selections for 14 days. Stored as { "<histKey>": ts }
// under localStorage key "biq_seen_history". Keys are namespaced by source:
//   - QB questions       → "q:<QB index>"
//   - TF_STATEMENTS items → "tf:<TF_STATEMENTS index>"`;
const newSeenComment =
`// ─── SEEN QUESTION HISTORY ────────────────────────────────────────────────────
// Tracks questions already shown to the user with a timestamp, and filters
// them out of future selections for 14 days. Stored as { "<histKey>": ts }
// under localStorage key "biq_seen_history_v2" (v1 was index-based, replaced
// when stable ids were added — old histories silently expire). Keys are
// namespaced by source:
//   - QB questions       → "q:<question id>"
//   - TF_STATEMENTS items → "tf:<question id>"`;
if (!app.includes(oldSeenComment)) throw new Error('Seen-history doc block not found');
app = app.replace(oldSeenComment, newSeenComment);

// Finally, write everything atomically
fs.writeFileSync(QFILE, questionsFile);
fs.writeFileSync(APP, app);
fs.unlinkSync(TMP);

console.log('Phase 1 migration complete.');
console.log(`  Wrote ${path.relative(ROOT, QFILE)}`);
console.log(`    CHAOS_QB:      ${chaosOut.items.length} entries  (collisions bumped: ${chaosOut.collisionsBumped})`);
console.log(`    QB:            ${qbOut.items.length} entries  (collisions bumped: ${qbOut.collisionsBumped})`);
console.log(`    TF_STATEMENTS: ${tfOut.items.length} entries  (collisions bumped: ${tfOut.collisionsBumped})`);
console.log(`  Patched ${path.relative(ROOT, APP)}`);
