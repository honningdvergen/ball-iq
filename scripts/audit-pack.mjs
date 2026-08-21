#!/usr/bin/env node
/**
 * Pack validator — run against ONE tag before it joins the bank.
 *
 * The build-wide audits are excellent at what they cover, but they run over
 * 6,700 questions and are tuned for bulk precision. A brand-new pack deserves
 * a stricter, noisier pass while it is still small enough to fix by hand.
 *
 * Every check here corresponds to a defect class that has actually shipped in
 * this bank, not a hypothetical:
 *
 *   - SELF-ANSWERING stems were 42% of all serious flags in the 2026-07 audit
 *     (89 of 211) and are the most expensive class, because they cannot be
 *     corrected — only replaced.
 *   - HINTS THAT NAME THE ANSWER turn a hint into a giveaway.
 *   - `a` IS AN INDEX, NOT THE ANSWER. q_0b5f8f has o:["1","2","3","0"], a:3 —
 *     the answer is "0" while o[2] is the string "3". An off-by-one here
 *     produces a fluent, confident, wrong answer.
 *   - UNDATED CLAIMS ROT. "Who is the most expensive signing?" is true until
 *     it isn't; "Who was the most expensive signing of the summer 2026 window?"
 *     is true forever. This matters far more than usual for a pack that is,
 *     by construction, about the last few weeks.
 *
 * Usage: node scripts/audit-pack.mjs summer2026
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { QB } = await import(join(ROOT, 'src/questions.js'));

const tag = process.argv[2];
if (!tag) {
  console.error('usage: node scripts/audit-pack.mjs <tag>');
  process.exit(2);
}

const pack = QB.filter((q) => q.tag === tag);
if (!pack.length) {
  console.error(`no questions found with tag "${tag}"`);
  process.exit(2);
}

const problems = [];
const warn = [];
const seenIds = new Map();
const seenStems = new Map();

/** Loose containment: case/diacritic/punctuation-insensitive. */
const norm = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Tokens worth matching on — drops stopwords that collide by accident. */
const STOP = new Set([
  'the', 'a', 'an', 'of', 'in', 'at', 'to', 'from', 'for', 'and', 'or', 'is',
  'was', 'were', 'which', 'who', 'what', 'city', 'united', 'fc', 'club',
  'real', 'athletic', 'atletico', 'sporting', 'st', 'de', 'la', 'le',
]);
const contentTokens = (s) => norm(s).split(' ').filter((t) => t.length > 3 && !STOP.has(t));

for (const q of pack) {
  const where = `${q.id}`;

  // ── identity ───────────────────────────────────────────────────────────
  if (seenIds.has(q.id)) problems.push(`${where}: duplicate id (also ${seenIds.get(q.id)})`);
  seenIds.set(q.id, where);

  const stemKey = norm(q.q);
  if (seenStems.has(stemKey)) problems.push(`${where}: duplicate stem of ${seenStems.get(stemKey)}`);
  seenStems.set(stemKey, q.id);

  // ── shape ──────────────────────────────────────────────────────────────
  if (!Array.isArray(q.o) || q.o.length !== 4) {
    problems.push(`${where}: expected 4 options, got ${q.o ? q.o.length : 0}`);
    continue;
  }
  if (new Set(q.o.map(norm)).size !== 4) problems.push(`${where}: duplicate options: ${q.o.join(' | ')}`);
  if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.o.length) {
    problems.push(`${where}: answer index ${q.a} out of range`);
    continue;
  }

  const answer = q.o[q.a];
  if (!answer || !String(answer).trim()) problems.push(`${where}: answer resolves to an empty string`);

  // ── the expensive classes ──────────────────────────────────────────────
  // Self-answering: the stem contains the answer outright.
  const stemN = norm(q.q);
  const ansN = norm(answer);
  if (ansN && stemN.includes(ansN)) {
    problems.push(`${where}: SELF-ANSWERING — stem contains the answer "${answer}"`);
  } else {
    // Softer form: every content token of the answer appears in the stem.
    const at = contentTokens(answer);
    if (at.length && at.every((t) => stemN.includes(t))) {
      warn.push(`${where}: stem may give away "${answer}" (tokens: ${at.join(', ')})`);
    }
  }

  // Hint must not name the answer.
  if (q.hint) {
    const hintN = norm(q.hint);
    if (ansN && hintN.includes(ansN)) {
      problems.push(`${where}: HINT NAMES THE ANSWER "${answer}" — ${q.hint}`);
    }
  } else {
    warn.push(`${where}: no hint (hints gate SEO club pages via MIN_HINTS)`);
  }

  // ── rot ────────────────────────────────────────────────────────────────
  // A claim about the recent past must be pinned to a date, or it silently
  // becomes false. Superlatives are the usual offenders.
  const SUPERLATIVE = /\b(most expensive|record|first|only|biggest|highest|latest|current|newest|record-breaking)\b/i;
  const DATED = /\b(19|20)\d{2}\b|\b\d{4}[–-]\d{2}\b/;
  if (SUPERLATIVE.test(q.q) && !DATED.test(q.q)) {
    problems.push(`${where}: UNDATED SUPERLATIVE — "${q.q}"`);
  }

  // ── metadata ───────────────────────────────────────────────────────────
  if (!q.cat) problems.push(`${where}: missing cat`);
  if (!['easy', 'medium', 'hard'].includes(q.diff)) problems.push(`${where}: bad diff "${q.diff}"`);
  if (q.type !== 'mcq') problems.push(`${where}: unexpected type "${q.type}"`);
}

// ── report ───────────────────────────────────────────────────────────────
console.log(`\nPack "${tag}": ${pack.length} questions`);
const byCat = {};
const byDiff = {};
pack.forEach((q) => { byCat[q.cat] = (byCat[q.cat] || 0) + 1; byDiff[q.diff] = (byDiff[q.diff] || 0) + 1; });
console.log('  categories:', Object.entries(byCat).map(([k, v]) => `${k}:${v}`).join('  '));
console.log('  difficulty:', Object.entries(byDiff).map(([k, v]) => `${k}:${v}`).join('  '));

if (warn.length) {
  console.log(`\n⚠️  ${warn.length} warning(s) — review, do not necessarily block:`);
  warn.forEach((w) => console.log('   ' + w));
}

if (problems.length) {
  console.error(`\n❌ ${problems.length} problem(s):`);
  problems.forEach((p) => console.error('   ' + p));
  process.exit(1);
}

console.log(`\n✅ pack "${tag}" passes structural validation`);
