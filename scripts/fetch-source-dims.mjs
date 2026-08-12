// fetch-source-dims.mjs — how big is each source photo REALLY?
//
//   node scripts/fetch-source-dims.mjs   → scripts/_source-dims.json
//
// ⚠️ THE POINT. The pool's crop boxes store the width we ASK Commons for, not
// the width that EXISTS. Spot-checking six players showed we were asking for
// 400px of a 2812x4215 original — throwing away ~90% of the available detail
// and then recording the result as "low resolution". Until this ran, the
// "2,745 players are low-res" number conflated two completely different
// problems with completely different fixes:
//
//   SELF-INFLICTED — big original, small request. Costs a formula change.
//   GENUINELY SMALL — the original really is 455x569. Costs a new photo.
//
// Sourcing 2,745 replacement photos when most need no replacement would be
// weeks of wasted work, so this measures before anything is sourced.
//
// Batched 50 titles per call (the API maximum) with a serial loop and a polite
// delay — Commons 429s aggressively, and a 429 returns HTML that JSON.parse
// turns into a confusing crash rather than an obvious rate-limit message.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const UA = 'BallIQ/1.0 (https://balliq.app; hello@balliq.app) photo-quality-audit';
const OUT = 'scripts/_source-dims.json';

const pool = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const players = Array.isArray(pool) ? pool : (pool.players || Object.values(pool)[0]);

const dims = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const todo = players.filter((p) => p.f && !dims[p.i]);
console.log(`${players.length} players · ${Object.keys(dims).length} already measured · ${todo.length} to fetch`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

let done = 0;
for (const batch of chunk(todo, 50)) {
  // Title -> player can be many-to-one (two players sharing a file is a data
  // bug, but it must not silently drop one), so index by title.
  const byTitle = new Map();
  for (const p of batch) {
    const t = `File:${p.f}`;
    if (!byTitle.has(t)) byTitle.set(t, []);
    byTitle.get(t).push(p);
  }
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=size'
    + `&titles=${encodeURIComponent([...byTitle.keys()].join('|'))}`;
  let json;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const body = await res.text();
    if (!body.startsWith('{')) { console.log(`  rate-limited (HTTP ${res.status}) — backing off 20s`); await sleep(20000); continue; }
    json = JSON.parse(body);
  } catch (e) {
    console.log(`  fetch failed: ${e.message} — backing off 10s`); await sleep(10000); continue;
  }
  for (const pg of Object.values(json?.query?.pages || {})) {
    const ii = pg.imageinfo && pg.imageinfo[0];
    for (const p of byTitle.get(pg.title) || []) {
      // missing:"" pages (file deleted/renamed on Commons) record as 0 — a real
      // finding, not an error: we are serving a file that no longer exists.
      dims[p.i] = ii ? { w: ii.width, h: ii.height } : { w: 0, h: 0 };
    }
  }
  done += batch.length;
  if (done % 500 < 50) { writeFileSync(OUT, JSON.stringify(dims)); console.log(`  ${done}/${todo.length}`); }
  await sleep(350);
}

writeFileSync(OUT, JSON.stringify(dims));
console.log(`wrote ${OUT} — ${Object.keys(dims).length} entries`);
