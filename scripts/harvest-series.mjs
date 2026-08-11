// harvest-series.mjs — enumerate PHOTOGRAPHER MATCH SERIES on Commons and map
// per-player files to our pool by FILENAME, the systematic version of the
// per-player search that found Lammens and Burn.
//
// WHY BY MATCH: uploaders like Bryan Berlin shoot entire 2025/26 internationals
// and name every crop "<Player Name> <Match> <date>-NNN.jpg". One series holds
// dozens of our players at 3000px+; per-player search only surfaces them if
// you already know to look. Search by match prefix -> group files by the player
// name embedded in the filename -> join to the pool BY NAME MATCH against
// lineup.json (exact folded name), never fuzzy.
//
// OUTPUT: /tmp/series/upgrades.json — {qid, name, file, when, w, h, lic, author}
// for every pool player whose CURRENT photo is older than the series photo.
// Candidates only; the labelled-sheet eyeball decides, as always.
import { readFileSync, writeFileSync } from 'fs';

const SERIES = [
  'England v Ghana 23 June 2026', 'England v Panama 27 June 26',
  'USMNT v Belgium Mar 28 2026', 'USMNT v Portugal Mar 31 2026',
  'Brazil V Morocco 13 June 2026', 'Argentina v Egypt 7 July 2026',
];
const L = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const byName = new Map();
for (const p of L.players) {
  const k = fold(p.n);
  if (!byName.has(k)) byName.set(k, p);   // fame order: first (most famous) wins
}
const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; series harvest)' };
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
    } catch { if (a === 3) return null; await new Promise((s) => setTimeout(s, 4000 * a)); }
  }
}

const upgrades = new Map();
for (const series of SERIES) {
  // srsearch with the series phrase; page through up to 500 files
  let sroffset = 0, got = 0;
  while (sroffset !== null && got < 500) {
    const j = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=50'
      + `&sroffset=${sroffset}&srsearch=` + encodeURIComponent('"' + series + '"'));
    const hits = j?.query?.search || [];
    got += hits.length;
    sroffset = j?.continue?.sroffset ?? null;
    for (const h of hits) {
      const file = h.title.replace('File:', '');
      // player name = everything before the series phrase in the filename
      const i = file.indexOf(series);
      if (i <= 1) continue;
      const rawName = file.slice(0, i).trim().replace(/,$/, '');
      // skip multi-player files ("A and B ...") — the wrong-face trap
      if (/\band\b/i.test(rawName)) continue;
      const p = byName.get(fold(rawName));
      if (!p) continue;
      // prefer "(cropped)" variants, then lower shot numbers arbitrarily —
      // real pick happens on the eyeball sheet, keep up to 3 per player
      const cur = upgrades.get(p.i) || { qid: p.i, name: p.n, curFile: p.f, files: [] };
      if (cur.files.length < 6) cur.files.push(file);
      upgrades.set(p.i, cur);
    }
    await new Promise((s) => setTimeout(s, 800));
  }
  console.log(`${series}: cumulative players matched ${upgrades.size}`);
}

// imageinfo pass for the shortlist (cropped-first, cap 3/player)
const out = [];
for (const u of upgrades.values()) {
  u.files.sort((a, b) => (b.includes('(cropped') ? 1 : 0) - (a.includes('(cropped') ? 1 : 0));
  const pick = u.files.slice(0, 3);
  const j = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=330&titles='
    + encodeURIComponent(pick.map((f) => 'File:' + f).join('|')));
  const cands = [];
  for (const pg of Object.values(j?.query?.pages || {})) {
    const ii = pg.imageinfo?.[0]; if (!ii) continue;
    const em = ii.extmetadata || {};
    const lic = strip(em.LicenseShortName?.value), author = strip(em.Artist?.value).slice(0, 100);
    if (!USABLE.test(lic) || REJECT.test(lic) || !author) continue;
    cands.push({ file: pg.title.replace('File:', ''), w: ii.width, h: ii.height, lic, author,
      when: strip(em.DateTimeOriginal?.value).slice(0, 10), thumb: ii.thumburl });
  }
  if (cands.length) out.push({ qid: u.qid, name: u.name, curFile: u.curFile, candidates: cands });
  writeFileSync('/tmp/series-upgrades.json', JSON.stringify(out, null, 1));
  await new Promise((s) => setTimeout(s, 700));
}
console.log(`\n${out.length} pool players matched in the six series`);
