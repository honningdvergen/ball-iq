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
// ⚠️ THE NULL-OVERRIDES ARE THE SMALL HALF. This targeted only players we had
// LOOKED AT and rejected — 155 of them. Measured 2026-08-13, the pool holds 939
// players with no photo, so 784 were never searched at all: no override entry,
// no candidate, no monogram decision, just absent. They are invisible to a
// filter keyed on the overrides file, which is why the blanks never went down
// no matter how often this was run. 87 of them are at big clubs; Man Utd alone
// was missing Shaw, Mbeumo and Mount from the builder.
//
// Both groups now harvest, and `--only` picks one:
//   (default)   both — every player the pool cannot draw a face for
//   --only rejected   the 155 we looked at and turned down
//   --only unseen     the 784 nobody ever searched
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > -1 ? process.argv[i + 1] : 'both'; })();
const HLIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? +process.argv[i + 1] : Infinity; })();

const rejected = Object.entries(OVR).filter(([k, v]) => k !== '_README' && v === null)
  .map(([k]) => ({ qid: k, name: byId.get(k)?.n, group: 'rejected' }));
const unseen = L.players.filter((p) => !p.f && !(p.i in OVR))
  .map((p) => ({ qid: p.i, name: p.n, group: 'unseen' }));

// Fame order: lineup.json is emitted most-famous-first, so harvesting in pool
// order puts Shaw and Mbeumo ahead of a reserve nobody will ever pick.
const rank = new Map(L.players.map((p, i) => [p.i, i]));
const targets = (ONLY === 'rejected' ? rejected : ONLY === 'unseen' ? unseen : [...rejected, ...unseen])
  .filter((t) => t.name)
  .sort((a, b) => (rank.get(a.qid) ?? 1e9) - (rank.get(b.qid) ?? 1e9))
  .slice(0, HLIMIT);
console.log(`harvest targets: ${targets.length} (${ONLY}) — rejected ${rejected.length}, never-searched ${unseen.length}`);
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
