// fetch-mystery-dob.mjs — add full birth DATES to the Mystery pool.
//
//   node scripts/fetch-mystery-dob.mjs [--write]
//
// ⚠️ THE RANKING WAS COARSE BECAUSE OF A MISSING FIELD, NOT A BAD FORMULA.
// similarity() contains a continuous age term keyed on `p.dob`, added
// specifically so that two team-mates in the same position never score
// identically. It has never once executed: the pool carries `born` (a year)
// and NOT ONE of its 8,491 entries has `dob`, so every comparison falls to the
// year-only fallback the same comment warns about —
//     "a year-only gap gives about 13 distinct levels"
// Measured consequence, from the suspended unit suites:
//     · two team-mates in the same slot score IDENTICALLY (1450 vs 1450)
//     · only 1.6% of scores across the pool are distinct (target: >80%)
// A Contexto-style game lives entirely on the rank being meaningful. At 1.6%
// distinct, "rank 5406" is shared by hundreds of players and the number is
// close to noise.
//
// This is the classic gap between code and data: the formula is right, the
// field it needs was never populated, and nothing failed loudly because the
// fallback silently produced a plausible-looking number.
//
// P569 is the Wikidata birth-date property. Batched 50 ids per call, serial,
// polite delay — the same shape as fetch-source-dims.mjs.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const UA = 'BallIQ/1.0 (https://balliq.app; hello@balliq.app) mystery-dob';
const CACHE = 'scripts/_mystery-dob.json';
const write = process.argv.includes('--write');

const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const dobs = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const todo = pool.filter((p) => /^Q\d+$/.test(p.id) && !(p.id in dobs));
console.log(`${pool.length} players · ${Object.keys(dobs).length} cached · ${todo.length} to fetch`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

let done = 0;
for (const batch of chunk(todo, 50)) {
  const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims'
    + `&ids=${batch.map((p) => p.id).join('|')}`;
  let json;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const body = await res.text();
    if (!body.startsWith('{')) { console.log(`  throttled (HTTP ${res.status}) — waiting 20s`); await sleep(20000); continue; }
    json = JSON.parse(body);
  } catch (e) { console.log(`  fetch failed: ${e.message}`); await sleep(10000); continue; }

  for (const [id, ent] of Object.entries(json.entities || {})) {
    const claim = ent?.claims?.P569?.[0]?.mainsnak?.datavalue?.value;
    // ⚠️ PRECISION MATTERS. Wikidata records precision 9 = year only, 10 =
    // month, 11 = day. Storing a year-precision value as "1987-01-01" would
    // invent a birthday and cluster everyone born that year onto one date —
    // recreating the exact tie problem this script exists to fix. Only
    // day-precision dates are kept; the rest stay null and fall back to `born`.
    const ok = claim && claim.precision >= 11 && typeof claim.time === 'string';
    dobs[id] = ok ? claim.time.replace(/^\+/, '').slice(0, 10) : null;
  }
  done += batch.length;
  if (done % 1000 < 50) { writeFileSync(CACHE, JSON.stringify(dobs)); console.log(`  ${done}/${todo.length}`); }
  await sleep(300);
}
writeFileSync(CACHE, JSON.stringify(dobs));

const have = Object.values(dobs).filter(Boolean).length;
console.log(`day-precision birth dates: ${have} of ${pool.length} (${((100 * have) / pool.length).toFixed(1)}%)`);

if (write) {
  let added = 0;
  for (const p of pool) if (dobs[p.id]) { p.dob = dobs[p.id]; added += 1; }
  writeFileSync('src/data/mysteryPool.json', `${JSON.stringify(pool)}\n`);
  console.log(`wrote src/data/mysteryPool.json — dob on ${added} players`);
} else {
  console.log('(dry run — pass --write to apply)');
}
