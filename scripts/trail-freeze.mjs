#!/usr/bin/env node
/**
 * Freeze the Transfer Trail days that have now been published.
 *
 * WHY THIS EXISTS. `tests/unit/trail-schedule.test.js` holds a PUBLISHED array
 * — a frozen record of every Trail answer that has actually been served to a
 * human. Two tests use it:
 *
 *   1. "no already-published day ever moves"  ← the real guard
 *   2. "PUBLISHED covers every day served"    ← forces the guard to keep up
 *
 * Guard 1 is what caught a genuine incident: commit 9115c63 replaced
 * TRAIL_ANSWER_LOG wholesale (66 entries out, 408 in) and retroactively
 * rewrote every past and future answer. A player saw van Persie twice in a
 * week and was right. History does not move.
 *
 * Guard 2, though, fails EVERY DAY at midnight — `servedSoFar` increments and
 * nothing has appended the new key. That is ~388 more red builds between now
 * and the end of the log, each one blocking a deploy until somebody hand-types
 * a name into a test file. That friction protects nothing: guard 1 is what
 * detects tampering, and it does so whether the key was typed by a human or
 * appended by this script.
 *
 * So this automates the TYPING, not the JUDGEMENT. Every key it appends is
 * read back out of `getTrailAnswerForDayIndex()` — the same function the app
 * calls — so it freezes what players actually saw, not what a list claims.
 * If the log has been tampered with, guard 1 still fails and this script
 * cannot paper over it: it refuses to touch any day already frozen.
 *
 * Usage:
 *   node scripts/trail-freeze.mjs           # report only
 *   node scripts/trail-freeze.mjs --apply   # append missing days
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEST = join(ROOT, 'tests/unit/trail-schedule.test.js');

const { TRAIL_ANCHOR_DAY, TRAIL_ANSWER_LOG, getTrailAnswerForDayIndex } =
  await import(join(ROOT, 'src/lib/trail.js'));

const src = readFileSync(TEST, 'utf8');

// Parse the existing PUBLISHED array — strings only, comments ignored.
const block = src.match(/const PUBLISHED = \[([\s\S]*?)\n {2}\];/);
if (!block) {
  console.error('✗ could not locate the PUBLISHED array in', TEST);
  process.exit(2);
}
const published = [...block[1].matchAll(/"([A-Z0-9_]+)"/g)].map((m) => m[1]);

const servedSoFar = Math.floor(Date.now() / 86400000) - TRAIL_ANCHOR_DAY + 1;
const target = Math.min(servedSoFar, TRAIL_ANSWER_LOG.length);

console.log(`PUBLISHED holds ${published.length} day(s); ${target} have been served.`);

// ── Verify history FIRST, always — before deciding whether there is anything
//    to append. The integrity check used to sit after the "nothing to freeze"
//    early return, which meant a tampered log plus an up-to-date record
//    printed a green tick over a corrupted history. Caught by seeding a
//    tampered entry and watching this script congratulate itself.
//    The script may only ever APPEND, and only when the frozen prefix still
//    matches the live log exactly.
for (let i = 0; i < published.length; i++) {
  if (TRAIL_ANSWER_LOG[i] !== published[i]) {
    console.error(
      `\n✗ REFUSING TO WRITE — day #${i + 1} has changed.\n` +
      `    frozen: ${published[i]}\n` +
      `    live:   ${TRAIL_ANSWER_LOG[i]}\n\n` +
      `  A day that has been served to a human is history. Do not "fix" this by\n` +
      `  editing PUBLISHED — find out why TRAIL_ANSWER_LOG moved.`,
    );
    process.exit(1);
  }
}
console.log(`✓ the ${published.length} frozen day(s) still match the live log.`);

if (published.length >= target) {
  console.log('✅ nothing to freeze — the record is current.');
  process.exit(0);
}

// ── Build the new rows, each verified through the app's own accessor.
const rows = [];
for (let n = published.length + 1; n <= target; n++) {
  const dayIndex = TRAIL_ANCHOR_DAY + n - 1;
  const served = getTrailAnswerForDayIndex(dayIndex);
  const key = typeof served === 'string' ? served : served?.key;
  if (!key) {
    console.error(`✗ day #${n} (index ${dayIndex}) resolved to no answer — aborting.`);
    process.exit(1);
  }
  if (key !== TRAIL_ANSWER_LOG[n - 1]) {
    console.error(
      `✗ day #${n}: the log says ${TRAIL_ANSWER_LOG[n - 1]} but the app serves ${key}. Aborting.`,
    );
    process.exit(1);
  }
  const date = new Date((dayIndex) * 86400000).toISOString().slice(0, 10);
  rows.push({ n, key, date });
}

console.log('\nto freeze:');
rows.forEach((r) => console.log(`  #${r.n} · ${r.date} · ${r.key}`));

if (!process.argv.includes('--apply')) {
  console.log('\n(dry run — re-run with --apply to write)');
  process.exit(0);
}

const pad = (k) => `"${k}",`.padEnd(22);
const added = rows
  .map((r) => `    ${pad(r.key)}// #${r.n} · ${r.date} — verified against getTrailAnswerForDayIndex`)
  .join('\n');

const updated = src.replace(
  /(const PUBLISHED = \[[\s\S]*?)(\n {2}\];)/,
  (_, body, tail) => `${body}\n${added}${tail}`,
);
writeFileSync(TEST, updated);
console.log(`\n✅ appended ${rows.length} day(s) to PUBLISHED.`);
