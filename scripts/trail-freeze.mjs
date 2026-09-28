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
 * THE HORIZON. After guard 2 lapsed at midnight and blocked a build three
 * times (days 24, 25, 26), this script now freezes HORIZON_DAYS ahead of
 * today, not just through today. That is safe because the answers for future
 * days are not invented here — they already sit in TRAIL_ANSWER_LOG, committed
 * source that every native bundle compiles in. A day inside the horizon is
 * already published to installed apps in every way that matters; freezing it
 * early only converts "mutable future" to "immutable history" a little sooner.
 * Consequence, on purpose: a frozen-but-unserved day may no longer be
 * reshuffled. To reshuffle unserved days, do it BEYOND the frozen horizon.
 *
 * Usage:
 *   node scripts/trail-freeze.mjs                 # report only
 *   node scripts/trail-freeze.mjs --apply         # append through today+14
 *   node scripts/trail-freeze.mjs --horizon=30    # widen the horizon
 *   node scripts/trail-freeze.mjs --min-margin=7  # alarm: exit 1 if <7 days frozen ahead
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

const HORIZON_DAYS = 14;
const horizonArg = process.argv.find((a) => a.startsWith('--horizon='));
const horizon = horizonArg ? Number(horizonArg.split('=')[1]) : HORIZON_DAYS;
if (!Number.isInteger(horizon) || horizon < 0) {
  console.error(`✗ --horizon must be a non-negative integer, got ${horizonArg}`);
  process.exit(2);
}

const servedSoFar = Math.floor(Date.now() / 86400000) - TRAIL_ANCHOR_DAY + 1;
const target = Math.min(servedSoFar + horizon, TRAIL_ANSWER_LOG.length);

console.log(
  `PUBLISHED holds ${published.length} day(s); ${Math.min(servedSoFar, TRAIL_ANSWER_LOG.length)} served, freezing through today+${horizon}.`,
);

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

// ── --min-margin=N: the early-warning alarm (.github/workflows/trail-horizon.yml).
//    The build gate fails the MOMENT an unfrozen day is served — at midnight,
//    when nobody is watching — and the in-test console.warn is read by nobody.
//    It lapsed that way on 2026-09-27 and blocked every prod deploy. This mode
//    changes nothing; it only fails while fewer than N future days are frozen,
//    from a daily scheduled run that is NOT part of the build, so the alarm
//    goes red a week early without ever making a deploy depend on today.
const minMarginArg = process.argv.find((a) => a.startsWith('--min-margin='));
if (minMarginArg) {
  const minMargin = Number(minMarginArg.split('=')[1]);
  if (!Number.isInteger(minMargin) || minMargin < 0) {
    console.error(`✗ --min-margin must be a non-negative integer, got ${minMarginArg}`);
    process.exit(2);
  }
  const margin = published.length - Math.min(servedSoFar, TRAIL_ANSWER_LOG.length);
  if (published.length < TRAIL_ANSWER_LOG.length && margin < minMargin) {
    const lapse = new Date((TRAIL_ANCHOR_DAY + published.length) * 86400000).toISOString().slice(0, 10);
    console.error(
      `::error title=Trail freeze horizon low::${Math.max(margin, 0)} future day(s) frozen ` +
      `(alarm below ${minMargin}). Every build fails from ${lapse} (UTC). ` +
      `Fix: npm run trail:freeze -- --horizon=30, verify the new days' careers, commit.`,
    );
    process.exit(1);
  }
  console.log(`✓ ${margin} future day(s) frozen — at or above the ${minMargin}-day alarm.`);
  process.exit(0);
}

if (published.length >= target) {
  const margin = published.length - Math.min(servedSoFar, TRAIL_ANSWER_LOG.length);
  console.log(`✅ nothing to freeze — ${margin} future day(s) already frozen.`);
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
  rows.push({ n, key, date, ahead: n > servedSoFar });
}

console.log('\nto freeze:');
rows.forEach((r) => console.log(`  #${r.n} · ${r.date} · ${r.key}${r.ahead ? ' (ahead)' : ''}`));

if (!process.argv.includes('--apply')) {
  console.log('\n(dry run — re-run with --apply to write)');
  process.exit(0);
}

const pad = (k) => `"${k}",`.padEnd(22);
const added = rows
  .map((r) => {
    const note = r.ahead
      ? 'pre-frozen ahead of serving, verified against getTrailAnswerForDayIndex'
      : 'verified against getTrailAnswerForDayIndex';
    return `    ${pad(r.key)}// #${r.n} · ${r.date} — ${note}`;
  })
  .join('\n');

const updated = src.replace(
  /(const PUBLISHED = \[[\s\S]*?)(\n {2}\];)/,
  (_, body, tail) => `${body}\n${added}${tail}`,
);
writeFileSync(TEST, updated);
console.log(`\n✅ appended ${rows.length} day(s) to PUBLISHED.`);
