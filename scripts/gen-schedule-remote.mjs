#!/usr/bin/env node
// Writes public/data/trail.json and public/data/mystery.json (and the served
// horizon in src/data/scheduleServed.json) from the logs the build bundles.
//
// The generators already do this in their own runs (gen-mystery-schedule.mjs,
// rekey-mystery-repeats.mjs, trail-freeze.mjs --apply). Run this one after
// editing TRAIL_ANSWER_LOG in src/lib/trail.js by hand, which is how the Trail
// log is re-planned: tests/unit/schedule-remote.test.js fails until you do.
// It refuses, and writes nothing, when a day recorded as served has moved.
//
// Usage: node scripts/gen-schedule-remote.mjs [trail|mystery]   (both by default)
import { readFileSync } from 'node:fs';
import { planScheduleRemote, trailPublishedLength } from './lib/schedule-remote.mjs';

const only = process.argv[2];
const plans = [];
if (!only || only === 'trail') {
  const { TRAIL_ANSWER_LOG, TRAIL_ANCHOR_DAY } = await import('../src/lib/trail.js');
  plans.push(planScheduleRemote('trail', { anchor: TRAIL_ANCHOR_DAY, days: TRAIL_ANSWER_LOG, minServed: trailPublishedLength() }));
}
if (!only || only === 'mystery') {
  const { MYSTERY_ANCHOR_DAY } = await import('../src/lib/mysteryPlayer.js');
  const days = JSON.parse(readFileSync(new URL('../src/data/mysterySchedule.json', import.meta.url), 'utf8'));
  plans.push(planScheduleRemote('mystery', { anchor: MYSTERY_ANCHOR_DAY, days }));
}
if (!plans.length) { console.error(`unknown log "${only}" (trail | mystery)`); process.exit(2); }
for (const p of plans) p.write();
