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
 */
import { readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const SCHEDULE = read('../src/data/mysterySchedule.json');
const POOL = read('../src/data/mysteryPool.json');
const EX = read('../src/data/mysteryExclusions.json');

const RATION_MAX = 0.05;
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
  console.error('    Fix: node scripts/gen-mystery-schedule.mjs');
  process.exit(1);
}

console.log(
  `✅ Mystery schedule: ${SCHEDULE.length} days, 0 banned, ` +
  `managers ${rationCount} (${(rationPct * 100).toFixed(1)}% of ${RATION_MAX * 100}% cap)`,
);
