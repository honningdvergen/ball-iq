// build-crop-sheets.mjs — contact sheets of PHOTO-CROP players, rendered with
// the page's own crop model, for the human eyeball gate the cutouts got.
//   node scripts/build-crop-sheets.mjs squad   # squad players w/o cutouts
//   node scripts/build-crop-sheets.mjs active  # top-1500 fame actives w/o cutouts
// Cells are labelled with the player name; output sheets + index into
// /tmp/crop-sheets-<mode>/. Downloads use the 250px bucket via md5 CDN path,
// throttled; cached cutout originals are reused when present.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';

const MODE = process.argv[2] || 'squad';
const L = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const M = new Set(JSON.parse(readFileSync('public/lineup/cutouts/manifest.json', 'utf8')));
const crops = L.players.filter((p) => p.f && !M.has(p.i));
const targets = MODE === 'squad'
  ? crops.filter((p) => p.q === 1)
  : crops.filter((p) => p.q !== 1 && p.v === 1).slice(0, 1500);
const OUT = `/tmp/crop-sheets-${MODE}`;
mkdirSync(OUT, { recursive: true });
mkdirSync(`${OUT}/cells`, { recursive: true });

function bucketUrl(file) {
  const f = file.replace(/ /g, '_');
  const h = createHash('md5').update(f).digest('hex');
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${h[0]}/${h.slice(0, 2)}/${encodeURIComponent(f)}/250px-${encodeURIComponent(f)}`;
}

let have = 0, fetched = 0, fail = 0;
const rows = [];
for (const p of targets) {
  const cell = `${OUT}/cells/${p.i}`;
  if (!existsSync(cell)) {
    const cache = `/tmp/cutout-orig/${p.i}`;
    if (existsSync(cache)) { execFileSync('cp', [cache, cell]); }
    else {
      try {
        const r = await fetch(bucketUrl(p.f), { headers: { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; crop sheets)' }, signal: AbortSignal.timeout(30000) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        if (!((buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50))) throw new Error('not image');
        writeFileSync(cell, buf);
        fetched++;
        await new Promise((s) => setTimeout(s, 1200));
      } catch { fail++; continue; }
    }
  }
  have++;
  rows.push({ i: p.i, n: p.n, x: p.x });
}
writeFileSync(`${OUT}/targets.json`, JSON.stringify(rows));
console.log(`${MODE}: ${have} cells ready (${fetched} fetched, ${fail} failed) -> ${OUT}`);
