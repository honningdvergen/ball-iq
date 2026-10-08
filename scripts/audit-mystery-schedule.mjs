#!/usr/bin/env node
/**
 * Build gate: the SHIPPED Mystery schedule must obey the editorial ruling.
 *
 * Why this exists. The generator (gen-mystery-schedule.mjs) already filters
 * banned names — but the generator is not what ships. `mysterySchedule.json`
 * ships, and on 2026-08-14 the committed file was found serving Rafa Benítez
 * as THAT DAY'S answer, months after he went on the hard-ban list. The ban was
 * correct; the file was simply never regenerated after the list grew, and
 * nothing checked.
 *
 * That is the recurring shape of defects here: code correct, data stale, no
 * gate between them. So this audits the ARTEFACT, not the producer.
 *
 * Rules enforced (Alex, 2026-08-14):
 *   1. Nobody on `managers` or `notFootballers` may appear at all.
 *   2. `rationed` names — real footballers better known for coaching — may
 *      appear, but must stay at or under 5% of the schedule.
 *   3. Every scheduled id must resolve to a pool entry.
 *   4. No back-to-back repeats.
 *   5. From NO_REPEAT_FROM on, no day repeats an answer already in the log
 *      (Alex, 2026-10-05: a repeat a year on is harmless, one two months on is
 *      not). The 99 repeats the first log carried were replaced by
 *      scripts/rekey-mystery-repeats.mjs; this keeps them out. Earlier days
 *      are public record and keep whatever they served.
 *   6. Every scheduled answer has a position the clue may print (2026-10-08).
 *      The first clue is "The answer is a <position>." and the pool's own
 *      position text is a Wikidata ranking token, not a fact: 47 of these 400
 *      answers carried one that was false or meaningless (a right-back clued
 *      as a midfielder, wingers as "wing half", Stoichkov as "coach").
 *      hintPosition() refuses those; this fails the build if a day would then
 *      have no position clue at all, which is what happens the moment someone
 *      schedules a new answer without checking his position. The fix is a
 *      source-checked line in src/data/mysteryRoles.json, never a pool edit:
 *      `slot` and `position` feed the ranking. A null there is allowed and
 *      means the sources disagree, so that day runs without a position clue.
 */
import { readFileSync } from 'node:fs';
import { hintPosition } from '../src/lib/mysteryPlayer.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const SCHEDULE = read('../src/data/mysterySchedule.json');
const POOL = read('../src/data/mysteryPool.json');
const EX = read('../src/data/mysteryExclusions.json');
const ROLES = read('../src/data/mysteryRoles.json');

const RATION_MAX = 0.05;
const NO_REPEAT_FROM = 66; // Mystery Player No. 67, 8 Oct 2026: the first day the re-key could touch
const byId = new Map(POOL.map((p) => [p.id, p]));
const banned = new Set([...(EX.managers || []), ...(EX.notFootballers || [])]);
const rationed = new Set(EX.rationed || []);

const problems = [];
const unresolved = [];
let rationCount = 0;

SCHEDULE.forEach((id, day) => {
  const p = byId.get(id);
  if (!p) { unresolved.push(`day ${day}: ${id} is not in the pool`); return; }
  if (banned.has(p.name)) problems.push(`day ${day}: ${p.name} is on the hard-ban list`);
  if (rationed.has(p.name)) rationCount++;
  if (day > 0 && SCHEDULE[day - 1] === id) problems.push(`day ${day}: back-to-back repeat of ${p.name}`);
  if (day >= NO_REPEAT_FROM && SCHEDULE.indexOf(id) < day) problems.push(`day ${day}: ${p.name} repeats day ${SCHEDULE.indexOf(id)}`);
  if (!hintPosition(p, ROLES) && ROLES[id] !== null) problems.push(`day ${day}: ${p.name} has no verified position (pool says ${p.slot} / "${p.position}"): add one to src/data/mysteryRoles.json`);
});

const rationPct = SCHEDULE.length ? rationCount / SCHEDULE.length : 0;
if (rationPct > RATION_MAX) {
  problems.push(
    `manager ration is ${(rationPct * 100).toFixed(1)}% (${rationCount}/${SCHEDULE.length}) — cap is ${RATION_MAX * 100}%`,
  );
}

const all = [...problems, ...unresolved];
if (all.length) {
  console.error('❌ Mystery schedule violates the editorial ruling:');
  for (const p of all.slice(0, 20)) console.error(`    ${p}`);
  if (all.length > 20) console.error(`    …and ${all.length - 20} more`);
  console.error('    Fix a repeat with: node scripts/rekey-mystery-repeats.mjs   (never re-run the generator: it rewrites played days)');
  process.exit(1);
}

console.log(
  `✅ Mystery schedule: ${SCHEDULE.length} days, 0 banned, ` +
  `managers ${rationCount} (${(rationPct * 100).toFixed(1)}% of ${RATION_MAX * 100}% cap)`,
);
