// audit-apply.mjs — apply VERIFIED question fixes to src/questions.js.
//
//   node scripts/audit-apply.mjs <journal.jsonl> [--write]
//
// Dry-run by default. Nothing is written without --write.
//
// WHY THIS IS A SCRIPT AND NOT AN AGENT EDIT
// The bar Alex set is a definitive ZERO wrong answers, and the worst possible
// outcome is "fixing" a correct question into a wrong one. An agent editing
// 50+ scattered lines by hand will eventually fat-finger one. A script applies
// exactly what a web-researched verifier confirmed, refuses anything it cannot
// prove safe, and prints its refusals — so the failure mode is "skipped and
// reported", never "silently corrupted".
//
// SAFETY GATES — a verdict is applied only if ALL hold:
//   1. confirmed === true AND confidence === "high".
//      Medium/low go to Alex. Honest uncertainty is cheap; a false "high" is not.
//   2. It carries a complete replacement: fix_q, fix_o (exactly 4), fix_a (0-3).
//      A confirmed defect with no proposed fix is a human editorial call.
//   3. The question's CURRENT text still matches the snapshot it was flagged
//      from. The verifier judged a frozen copy in .audit/vbatch/; if the live
//      bank has since moved, that verdict describes text that no longer exists
//      and applying it would be acting on a stale premise.
//   4. The new options contain no exact duplicates, and fix_a indexes a real
//      option. A fix that introduces two identical options is a new defect.
//
// HINTS
// A hint is written for a specific correct answer. If the fix changes which
// answer is correct, the old hint is now actively misleading — worse than no
// hint, because players trust it. Those hints are DROPPED and listed for
// re-forging. If the correct answer text is unchanged, the hint survives.

import fs from 'node:fs';
import path from 'node:path';

// A `self_answering` question cannot be corrected — only REPLACED with a
// different question. That is authorship, not fact-checking, so it is held by
// default: Alex stays the editor of his own bank. Pass --include-substitutions
// to apply them too, once that call has actually been made.
const HELD_KINDS = new Set(['self_answering']);

const [, , journalPath, ...flags] = process.argv;
const WRITE = flags.includes('--write');
const INCLUDE_SUBS = flags.includes('--include-substitutions');
if (!journalPath) {
  console.error('usage: node scripts/audit-apply.mjs <journal.jsonl> [--write]');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const QFILE = path.join(ROOT, 'src/questions.js');

const BARE_KEY = /^([A-Za-z_$][\w$]*)\s*:/;

// Parse one `{ id:"x", q:"y", o:[...], a:0 }` line into a real object.
//
// Deliberately NOT eval, and deliberately not a regex key-quoter: question
// prose contains commas and colons (`q:"Spain won, but: who scored?"`), so a
// naive /([{,]\s*)(\w+):/ rewrite matches INSIDE string literals and silently
// mangles the text. This walks the line tracking string state, so bare keys are
// only quoted when we are genuinely outside a string.
function parseEntry(line) {
  const src = line.trim().replace(/,\s*$/, '');
  let out = '', i = 0, inStr = false;
  while (i < src.length) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (c === '\\') { out += src[++i] ?? ''; i++; continue; }
      if (c === '"') inStr = false;
      i++; continue;
    }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    const key = src.slice(i).match(BARE_KEY);
    if (key) { out += `"${key[1]}":`; i += key[0].length; continue; }
    out += c; i++;
  }
  return JSON.parse(out);
}

// ── collect verdicts ────────────────────────────────────────────────────────
const verdicts = [];
for (const line of fs.readFileSync(journalPath, 'utf8').trim().split('\n')) {
  let j;
  try { j = JSON.parse(line); } catch { continue; }
  if (j.type !== 'result') continue;
  let r = j.result;
  if (typeof r === 'string') { try { r = JSON.parse(r); } catch { continue; } }
  if (r && Array.isArray(r.verdicts)) verdicts.push(...r.verdicts);
  else if (r && typeof r.confirmed === 'boolean' && r.id) verdicts.push(r);
}

// ── snapshots: what the verifier actually judged ────────────────────────────
const snapDir = path.join(ROOT, '.audit/vbatch');
const snapshots = new Map();
for (const f of fs.readdirSync(snapDir)) {
  if (!f.endsWith('.json')) continue;
  for (const e of JSON.parse(fs.readFileSync(path.join(snapDir, f), 'utf8'))) {
    snapshots.set(e.id, e);
  }
}

// ── read the bank line-wise ─────────────────────────────────────────────────
// One object literal per line, so a line swap keeps the diff readable and
// leaves all 5,800 untouched questions byte-identical. Reserializing the whole
// file would reformat everything and bury the real change.
const lines = fs.readFileSync(QFILE, 'utf8').split('\n');
const lineOf = new Map();
lines.forEach((l, i) => {
  const m = l.match(/^\s*\{\s*id:"([^"]+)"/);
  if (m) lineOf.set(m[1], i);
});

// Is the corrected answer the SAME fact, just written differently?
// Substring containment after normalising accents and punctuation catches the
// two real patterns: surname -> full name ("Lewandowski" / "Robert
// Lewandowski") and bare -> qualified ("2002" / "2002 Japan/Korea").
// Deliberately conservative — anything that is not clearly the same answer is
// treated as a change, so a genuinely stale hint is still dropped.
const normAnswer = (s) => String(s).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ').trim();
const sameAnswer = (a, b) => {
  const [x, y] = [normAnswer(a), normAnswer(b)];
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
};

const str = (s) => JSON.stringify(String(s));
const serialize = (o) => {
  const parts = [`id:${str(o.id)}`, `q:${str(o.q)}`, `o:[${o.o.map(str).join(',')}]`, `a:${o.a}`];
  for (const k of ['cat', 'tag', 'type', 'diff', 'hint']) {
    if (o[k] !== undefined && o[k] !== null && o[k] !== '') parts.push(`${k}:${str(o[k])}`);
  }
  parts.push(`v:${(Number(o.v) || 1) + 1}`);
  return `  { ${parts.join(', ')} },`;
};

const applied = [], skipped = [], hintsDropped = [], held = [];

for (const v of verdicts) {
  const why = (r) => skipped.push({ id: v.id, reason: r, kind: snapshots.get(v.id)?.kind });

  if (!v.confirmed) { why('verifier REJECTED the flag — question is fine'); continue; }
  if (!INCLUDE_SUBS && HELD_KINDS.has(snapshots.get(v.id)?.kind)) {
    held.push({ id: v.id, kind: snapshots.get(v.id)?.kind, oldQ: snapshots.get(v.id)?.q,
                newQ: v.fix_q, newCorrect: Array.isArray(v.fix_o) ? v.fix_o[v.fix_a] : null,
                truth: v.truth, confidence: v.confidence });
    continue;
  }
  if (v.confidence !== 'high') { why(`confirmed but confidence=${v.confidence} — Alex decides`); continue; }
  if (!v.fix_q || !Array.isArray(v.fix_o) || v.fix_o.length !== 4 || typeof v.fix_a !== 'number') {
    why('confirmed, no complete fix proposed — human editorial call'); continue;
  }
  if (v.fix_a < 0 || v.fix_a > 3) { why('fix_a out of range'); continue; }
  if (new Set(v.fix_o.map(s => s.trim().toLowerCase())).size !== 4) {
    why('proposed options contain duplicates — would introduce a new defect'); continue;
  }

  const idx = lineOf.get(v.id);
  if (idx === undefined) { why('id not found in questions.js'); continue; }

  let cur;
  try { cur = parseEntry(lines[idx]); }
  catch { why('could not parse the current line'); continue; }

  // Gate 3: the live bank must still match what the verifier judged.
  const snap = snapshots.get(v.id);
  if (snap && (snap.q !== cur.q || JSON.stringify(snap.o) !== JSON.stringify(cur.o))) {
    why('bank text CHANGED since it was flagged — verdict is stale, re-verify'); continue;
  }

  const oldCorrect = cur.o[cur.a];
  const newCorrect = v.fix_o[v.fix_a];
  const next = { ...cur, q: v.fix_q, o: v.fix_o, a: v.fix_a };

  // Only drop the hint when the answer REALLY changed. An exact string
  // compare treats "Lewandowski" -> "Robert Lewandowski" and "2002" ->
  // "2002 Japan/Korea" as changes and bins a hint that is still perfectly
  // accurate. That is not cosmetic: `playerHintRows` in gen-seo-pages.mjs
  // requires x.hint to exist, so a needlessly dropped hint removes the
  // question from an SEO page's pool and can push a page under MIN_HINTS —
  // which is exactly how this rule broke the Lewandowski page build.
  if (cur.hint && !sameAnswer(oldCorrect, newCorrect)) {
    delete next.hint;
    hintsDropped.push({ id: v.id, oldCorrect, newCorrect });
  }

  lines[idx] = serialize(next);
  applied.push({ id: v.id, kind: snap?.kind, oldQ: cur.q, newQ: v.fix_q, oldCorrect, newCorrect, truth: v.truth });
}

// ── report ──────────────────────────────────────────────────────────────────
console.log(`\nVerdicts read: ${verdicts.length}`);
console.log(`APPLIED: ${applied.length}   HELD (substitutions): ${held.length}   SKIPPED: ${skipped.length}   hints dropped: ${hintsDropped.length}`);
if (held.length) {
  console.log(`\nHELD — these questions contain their own answer and can only be REPLACED,`);
  console.log(`not corrected. That is an editorial call. Review .audit/held-substitutions.json,`);
  console.log(`then re-run with --include-substitutions to apply them.`);
}

const byReason = skipped.reduce((m, s) => { m[s.reason] = (m[s.reason] || 0) + 1; return m; }, {});
console.log('\nSkip reasons:');
for (const [r, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) console.log(`  ${n}  ${r}`);

console.log('\nApplied fixes:');
for (const a of applied) {
  console.log(`\n  ${a.id}  [${a.kind}]`);
  console.log(`    was: ${a.oldQ}`);
  console.log(`         correct = ${a.oldCorrect}`);
  console.log(`    now: ${a.newQ}`);
  console.log(`         correct = ${a.newCorrect}`);
  if (a.truth) console.log(`    why: ${a.truth}`);
}

if (hintsDropped.length) {
  console.log('\nHints dropped (answer changed, so the old hint was misleading) — re-forge these:');
  for (const h of hintsDropped) console.log(`  ${h.id}  ${h.oldCorrect} -> ${h.newCorrect}`);
}

if (WRITE && applied.length) {
  fs.writeFileSync(QFILE, lines.join('\n'));
  console.log(`\n✅ WROTE ${applied.length} fixes to src/questions.js`);
} else if (!WRITE) {
  console.log('\n(dry run — pass --write to apply)');
}

fs.writeFileSync(path.join(ROOT, '.audit/applied.json'),
  JSON.stringify({ applied, skipped, hintsDropped }, null, 1));
fs.writeFileSync(path.join(ROOT, '.audit/held-substitutions.json'), JSON.stringify(held, null, 1));
fs.writeFileSync(path.join(ROOT, '.audit/needs-alex.json'), JSON.stringify(
  skipped.filter(s => /confidence=/.test(s.reason) || /no complete fix/.test(s.reason)), null, 1));
