// audit-prep-round2.mjs — build inputs for the round-2 audit.
//
//   node scripts/audit-prep-round2.mjs
//
// TWO INPUT SETS, for two different jobs:
//
// A) .audit/cbatch/  — the DANGEROUS "cosmetic" flags.
//    The round-1 screener rated 500 flags cosmetic, but 23 of them are typed
//    `wrong_answer` and 53 `stale`. A wrong answer is never cosmetic, and a
//    stale fact is one season away from being wrong. The severity rating and
//    the defect type contradict each other on these, so they get the same
//    web-verification the serious pile got.
//
// B) .audit/sbatch/  — a FULL-BANK re-screen, targeted.
//    Round 1 died to the usage limit at 5,360 of 5,834, and the journal keys
//    are opaque hashes so coverage cannot be reconstructed. Rather than guess
//    which ~470 were missed, re-screen everything — but only for the two
//    defect classes the completed audit proved the forge does not catch:
//    false premises in the stem, and self-answering questions. Those were
//    66/89 and 89/211 of the findings respectively, and the round-1 screener
//    was not looking for either explicitly.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { QB } = await import(path.join(ROOT, 'src/questions.js'));

const byId = new Map(QB.map(q => [q.id, q]));
const cosmetic = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit/findings-cosmetic.json'), 'utf8'));

// Anything already settled in round 1 must not be re-litigated.
const applied = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit/applied.json'), 'utf8'));
const held = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit/held-substitutions.json'), 'utf8'));
const settled = new Set([
  ...applied.applied.map(a => a.id),
  ...applied.skipped.map(s => s.id),
  ...held.map(h => h.id),
]);

// ── A) dangerous cosmetic flags ─────────────────────────────────────────────
const DANGEROUS = new Set(['wrong_answer', 'stale', 'multiple_correct']);
const danger = cosmetic
  .filter(f => DANGEROUS.has(f.kind) && !settled.has(f.id) && byId.has(f.id))
  .map(f => {
    const q = byId.get(f.id);
    return {
      id: q.id, kind: f.kind, claim: f.claim, q: q.q, o: q.o,
      answer: Array.isArray(q.o) ? q.o[q.a] : String(q.a),
      cat: q.cat, diff: q.diff,
    };
  });

const cdir = path.join(ROOT, '.audit/cbatch');
fs.rmSync(cdir, { recursive: true, force: true });
fs.mkdirSync(cdir, { recursive: true });
const CB = 6;
let cn = 0;
for (let i = 0; i < danger.length; i += CB) {
  fs.writeFileSync(path.join(cdir, `c-${++cn}.json`), JSON.stringify(danger.slice(i, i + CB), null, 1));
}

// ── B) full-bank targeted re-screen ─────────────────────────────────────────
// Only MCQs — true/false rows have no options array and a different shape.
const screenable = QB
  .filter(q => q.type !== 'tf' && Array.isArray(q.o) && !settled.has(q.id))
  .map(q => ({ id: q.id, q: q.q, o: q.o, answer: q.o[q.a], cat: q.cat, diff: q.diff }));

const sdir = path.join(ROOT, '.audit/sbatch');
fs.rmSync(sdir, { recursive: true, force: true });
fs.mkdirSync(sdir, { recursive: true });
const SB = 150;
let sn = 0;
for (let i = 0; i < screenable.length; i += SB) {
  fs.writeFileSync(path.join(sdir, `s-${++sn}.json`), JSON.stringify(screenable.slice(i, i + SB), null, 1));
}

console.log(`Already settled in round 1: ${settled.size}`);
console.log(`A) dangerous cosmetic flags: ${danger.length} -> ${cn} batches of ${CB}`);
console.log(`   by kind: ${JSON.stringify(danger.reduce((m, d) => { m[d.kind] = (m[d.kind] || 0) + 1; return m; }, {}))}`);
console.log(`B) full-bank re-screen:      ${screenable.length} -> ${sn} batches of ${SB}`);
