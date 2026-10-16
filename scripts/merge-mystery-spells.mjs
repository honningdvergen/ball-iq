// merge-mystery-spells.mjs — put lost second stints back into the shipped
// Mystery Player careers WITHOUT rebuilding the pool.
//
//   node scripts/merge-mystery-spells.mjs [spells.json]
//       spells.json defaults to scripts/_mystery-careers.json, the output of
//       scripts/fetch-mystery-careers.mjs (full run) — or pass the
//       scripts/_mystery-careers.sample.json a `--ids=` run writes.
//
// Only src/data/mysteryCareers.json is written. mysteryPool.json,
// mysteryAnswers.json and mysterySchedule.json are not read for writing, so
// no answer or past day can move. The checked corrections in
// mysteryCareerFixes.json still win over whatever this adds: withCareerFixes()
// replaces a fixed player's whole career at load time.
//
// The rules (what is added, what is skipped, what is repaired) live in
// mergeSpells() in scripts/lib/mystery-spells.mjs and are unit-tested there.
import { readFileSync, writeFileSync } from 'fs';
import { mergeSpells } from './lib/mystery-spells.mjs';
import { clubName } from '../src/lib/mysteryCareer.js';

const SRC = process.argv[2] || 'scripts/_mystery-careers.json';
const CAREERS_FILE = 'src/data/mysteryCareers.json';

const fetched = JSON.parse(readFileSync(SRC, 'utf8'));
// A player with a checked correction is skipped: withCareerFixes() replaces his
// whole career at load time, so adding to the generated one changes nothing a
// player sees and only blurs which file is the truth.
const FIXED = Object.keys(JSON.parse(readFileSync('src/data/mysteryCareerFixes.json', 'utf8'))).filter((k) => !k.startsWith('_'));
for (const id of FIXED) delete fetched[id];
const careers = JSON.parse(readFileSync(CAREERS_FILE, 'utf8'));
const before = Object.values(careers.p).reduce((n, l) => n + l.length, 0);

// Same rule as build-mystery-pool-v2.mjs: club football starts around 1850.
const okYear = (y) => Number.isFinite(y) && y >= 1850 && y <= 2027;
// Labels in the shipped file have been relabelled since the fetch (squad
// short forms, merged duplicates), so clubs are compared by the fan name.
const sameClub = (a, b) => a === b || clubName(a) === clubName(b);

const stats = mergeSpells(careers, fetched, { sameClub, okYear });
writeFileSync(CAREERS_FILE, JSON.stringify(careers));
const after = Object.values(careers.p).reduce((n, l) => n + l.length, 0);

console.log(`from ${SRC}: ${Object.keys(fetched).length} players (${FIXED.length} with checked fixes left to mysteryCareerFixes.json)`);
console.log(`players changed: ${stats.players}`);
console.log(`spells added: ${stats.added} · backwards spells replaced: ${stats.repaired}`);
console.log(`skipped: ${stats.overlapsSkipped} overlapping a shipped spell · ${stats.newClubsSkipped} at a club not on the shipped career · ${stats.reversedDropped} backwards-dated and clashing with another club`);
console.log(`spells in ${CAREERS_FILE}: ${before} -> ${after}`);
