// harvest-photo-candidates.mjs — Commons FULL-TEXT search candidates for every
// null-override (monogram) player. Search finds the uncategorized 2025/26
// match-series files that category enumeration (P373) structurally misses —
// measured: Lammens' category had a 127px thumb while search found a 2871px
// portrait.
//
// OUTPUT IS CANDIDATES, NOT DECISIONS. ~5% of Commons player-named files show
// a different human (the namesake trap: a country singer, a statue, a
// politician). Every candidate goes on a labelled contact sheet for HUMAN
// eyes; only approved picks become overrides.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';

const OVR = JSON.parse(readFileSync('src/data/photoOverrides.json', 'utf8'));
const L = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const byId = new Map(L.players.map((p) => [p.i, p]));
const targets = Object.entries(OVR).filter(([k, v]) => k !== '_README' && v === null)
  .map(([k]) => ({ qid: k, name: byId.get(k)?.n })).filter((t) => t.name);
const OUT = '/tmp/harvest';
mkdirSync(`${OUT}/thumbs`, { recursive: true });
const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; photo harvest)' };
const USABLE = /^(CC0|CC BY|Public domain|PD|No restrictions|Attribution)/i;
const REJECT = /\bNC\b|\bND\b|non-commercial|noderiv|fair use|non-free|GFDL/i;
const strip = (x) => String(x || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function api(url) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 20000 * a)); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { if (a === 3) return null; await new Promise((s) => setTimeout(s, 4000 * a)); }
  }
}

console.log(`${targets.length} monogram players to harvest`);
const results = [];
let done = 0;
for (const t of targets) {
  done++;
  const sr = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=12&srsearch=' + encodeURIComponent(t.name));
  const titles = (sr?.query?.search || []).map((x) => x.title).filter((x) => !/\.(webm|ogv|svg|pdf)$/i.test(x));
  if (!titles.length) { results.push({ ...t, candidates: [] }); continue; }
  const ii = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=330&titles=' + encodeURIComponent(titles.slice(0, 12).join('|')));
  const cands = [];
  for (const pg of Object.values(ii?.query?.pages || {})) {
    const info = pg.imageinfo?.[0];
    if (!info) continue;
    const em = info.extmetadata || {};
    const lic = strip(em.LicenseShortName?.value);
    const author = strip(em.Artist?.value).slice(0, 100);
    const when = strip(em.DateTimeOriginal?.value).slice(0, 10);
    const year = +when.slice(0, 4) || 0;
    if (!USABLE.test(lic) || REJECT.test(lic) || !author) continue;
    if (Math.min(info.width, info.height) < 300) continue;
    // Score: recency dominates (the bar is <=1yr), then resolution.
    const score = (year >= 2025 ? 3000 : year >= 2023 ? 1200 : year >= 2020 ? 300 : 0)
      + Math.min(1000, info.width / 4);
    cands.push({ file: pg.title.replace('File:', ''), w: info.width, h: info.height, lic, author, when, year, score, thumb: info.thumburl });
  }
  cands.sort((a, b) => b.score - a.score);
  const top = cands.slice(0, 3);
  for (let i = 0; i < top.length; i++) {
    const dst = `${OUT}/thumbs/${t.qid}_${i}.img`;
    if (!existsSync(dst) && top[i].thumb) {
      try {
        const r = await fetch(top[i].thumb, { headers: UA, signal: AbortSignal.timeout(30000) });
        if (r.ok) writeFileSync(dst, Buffer.from(await r.arrayBuffer()));
      } catch {}
      await new Promise((s) => setTimeout(s, 700));
    }
  }
  results.push({ ...t, candidates: top });
  writeFileSync(`${OUT}/candidates.json`, JSON.stringify(results, null, 1));
  process.stdout.write(`${done}/${targets.length}\r`);
  await new Promise((s) => setTimeout(s, 900));
}
const withC = results.filter((r) => r.candidates.length);
const recent = results.filter((r) => r.candidates.some((c) => c.year >= 2025));
console.log(`\n${withC.length}/${results.length} players have candidates · ${recent.length} have a 2025+ candidate`);
