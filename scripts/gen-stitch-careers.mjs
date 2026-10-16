#!/usr/bin/env node
// Writes src/data/stitchCareers.json: the scheduled Mystery Player answers'
// careers, corrections applied, for Stitch-up (src/lib/stitch.js). See
// src/lib/stitchCareerRows.js for what is in it and why only these.
//
//   node scripts/gen-stitch-careers.mjs          write the file
//   node scripts/gen-stitch-careers.mjs --check  exit 1 if it is out of date
//
// tests/unit/stitch.test.js fails when the committed file has drifted.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildMysteryStitchRows } from '../src/lib/stitchCareerRows.js';

const at = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const json = (p) => JSON.parse(readFileSync(at(p), 'utf8'));
const OUT = 'src/data/stitchCareers.json';

const rows = buildMysteryStitchRows({
  schedule: json('src/data/mysterySchedule.json'),
  pool: json('src/data/mysteryPool.json'),
  careers: json('src/data/mysteryCareers.json'),
  fixes: json('src/data/mysteryCareerFixes.json'),
});
const text = JSON.stringify(rows) + '\n';

if (process.argv.includes('--check')) {
  let cur = '';
  try { cur = readFileSync(at(OUT), 'utf8'); } catch { /* missing */ }
  if (cur !== text) { console.error(`✗ ${OUT} is out of date: run node scripts/gen-stitch-careers.mjs`); process.exit(1); }
  console.log(`✓ ${OUT} up to date (${rows.length} careers)`);
} else {
  writeFileSync(at(OUT), text);
  console.log(`✓ wrote ${OUT}: ${rows.length} careers`);
}
