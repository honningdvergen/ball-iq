// build-trail-candidates.mjs — propose new Transfer Trail careers from the
// source that actually carries the facts the editorial rules need.
//
//   node scripts/build-trail-candidates.mjs [limit]   → scripts/_trail-candidates.json
//
// ⚠️ WIKIDATA CANNOT DO THIS JOB, AND THAT IS THE WHOLE REASON THIS EXISTS.
// The locked Trail rules are: loans in and MARKED · youth out · a return to a
// former club is its own rung · max 6. Wikidata's P54 statements carry no loan
// qualifier — checked directly against Bacary Sagna, whose eight statements
// have none — so a trail generated from it would silently present loan spells
// as permanent transfers. Wikipedia's player infobox marks them ("→ AC Milan
// (loan)"), which is why the original 44 were verified against it.
//
// ⚠️ THIS EMITS PROPOSALS, NOT BANK ENTRIES. Output goes to a staging file for
// review, never straight into src/lib/trail.js. The ZERO ERROR bar applies:
// only what survives a human read gets committed.
import { readFileSync, writeFileSync } from 'fs';
import { TRAIL_PLAYERS } from '../src/lib/trail.js';
// ⚠️ THE PARSER LIVES IN ONE PLACE. It carries four fixes that each shipped a
// wrong trail before they were found; scripts/verify-trail-careers.mjs reads
// careers the same way, and a second copy would drift.
import { careerFor, sleep } from './lib/wiki-career.mjs';

const LIMIT = parseInt(process.argv[2] || '60', 10);
const MAX_RUNGS = 6;
const MIN_RUNGS = 3;

const pool = JSON.parse(readFileSync('public/data/lineup.json', 'utf8')).players;
const have = new Set(TRAIL_PLAYERS.map((p) => p.display.join(' ').toLowerCase()));

// ⚠️ FAME CUT. lineup.json is emitted in fame order, so an index cap is the
// cheapest honest filter. Without one the batch offered Joao Grimaldo — a trail
// nobody can solve is worse than no trail, and the whole point of expanding the
// pool is to stop regulars seeing repeats, not to make the game unwinnable.
const FAME_CUT = 400;
const targets = pool.slice(0, FAME_CUT)
  .filter((p) => p.n && p.n.includes(' ') && !have.has(p.n.toLowerCase()));
const out = [];
const skipped = [];

for (const p of targets) {
  if (out.length >= LIMIT) break;
  let career;
  try { career = await careerFor(p.n.replace(/ /g, '_')); } catch { career = null; }
  await sleep(220);
  if (!career) { skipped.push(`${p.n} — no infobox`); continue; }
  if (career.length < MIN_RUNGS) { skipped.push(`${p.n} — only ${career.length} club(s)`); continue; }
  // ⚠️ NOT TRUNCATED. The locked rule caps a trail at six rungs; a longer
  // career is REJECTED rather than cut, because a truncated trail is a wrong
  // trail — the answer's actual first club would be missing.
  if (career.length > MAX_RUNGS) { skipped.push(`${p.n} — ${career.length} clubs, over the cap`); continue; }
  const parts = p.n.split(' ');
  out.push({
    key: parts[parts.length - 1].toUpperCase().replace(/[^A-Z]/g, ''),
    display: [parts.slice(0, -1).join(' '), parts[parts.length - 1]],
    nat: p.t || '',
    clubs: career.map((c) => c.club),
    loans: career.map((c) => !!c.loan),
    _source: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.n.replace(/ /g, '_'))}`,
  });
}

writeFileSync('scripts/_trail-candidates.json', `${JSON.stringify(out, null, 1)}\n`);
console.log(`proposed ${out.length} careers -> scripts/_trail-candidates.json`);
console.log(`skipped ${skipped.length}`);
skipped.slice(0, 12).forEach((s) => console.log(`   ${s}`));
console.log('\n⚠️ PROPOSALS ONLY. Read every one before it goes into src/lib/trail.js.');
