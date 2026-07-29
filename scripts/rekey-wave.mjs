// rekey-wave.mjs — even out answer positions across a forged pack.
//
//   node scripts/rekey-wave.mjs <dir> [--write]
//
// WHY: Wave I's Foden pack was keyed AAAAAAAAAAAAAAAAAAAAAAAA — all 24 answers
// on option A — and Saka had 23 of 28 on A. Not one question is wrong, which is
// exactly why six independent forge agents each verified their own output and
// none of them saw it: the defect only exists at PACK level. A player who spots
// it scores 100% by always tapping the first option.
//
// Assigns target slots round-robin (0,1,2,3,0,1,2,3…) so the spread is uniform
// by construction rather than by luck, then SWAPS the correct answer into its
// slot. Swapping preserves the option set exactly — no text is rewritten, so a
// hint that refers to a distractor still refers to the same distractor.
//
// The order is shuffled with a stem-seeded PRNG: deterministic (same input ->
// same output, so a re-run is a no-op and the diff is reviewable) but not a
// fixed repeating pattern that would itself become guessable.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] || '.');
const WRITE = process.argv.includes('--write');

// xmur3 + mulberry32 — integer bitwise only. The bank skill bans Math.sin-style
// seeding because JavaScriptCore and V8 disagree on it; this is spec-exact.
const seed = (str) => {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

for (const file of readdirSync(dir).filter((f) => /^p-.*\.json$/.test(f)).sort()) {
  const path = join(dir, file);
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const key = Object.keys(raw).find((k) => Array.isArray(raw[k]) && raw[k].length && raw[k][0] && raw[k][0].q);
  const qs = raw[key];

  const before = [0, 0, 0, 0];
  qs.forEach((r) => { if (typeof r.a === 'number') before[r.a]++; });

  // round-robin slots, order shuffled deterministically per pack
  const rnd = seed(qs.map((r) => r.q).join('|'));
  const slots = qs.map((_, i) => i % 4);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  let moved = 0;
  qs.forEach((r, i) => {
    if (!Array.isArray(r.o) || r.o.length !== 4 || typeof r.a !== 'number') return;
    const correct = r.o[r.a];             // resolve BEFORE touching anything
    const want = slots[i];
    if (want === r.a) return;
    [r.o[r.a], r.o[want]] = [r.o[want], r.o[r.a]];
    r.a = want;
    moved++;
    if (r.o[r.a] !== correct) throw new Error(`${file} #${i + 1}: swap lost the answer`);
  });

  const after = [0, 0, 0, 0];
  qs.forEach((r) => { if (typeof r.a === 'number') after[r.a]++; });
  console.log(`${file.padEnd(20)} ${before.join('/')}  ->  ${after.join('/')}   (${moved} moved)`);

  if (WRITE) writeFileSync(path, JSON.stringify(raw, null, 2) + '\n');
}
console.log(WRITE ? '\nwritten.' : '\ndry run — pass --write to apply.');
