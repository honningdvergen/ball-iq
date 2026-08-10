// repick-player-photos.mjs — find a BETTER photo than P18 for the players whose
// current one is unusable.
//
//   swiftc -O -o /tmp/facebox scripts/facebox/main.swift
//   node scripts/repick-player-photos.mjs [--limit N]
//
// ⚠️ THIS IS THE FIX NO CROP CAN DELIVER. Measured across the 5,064 players the
// builder offers: 409 photos contain more than one face, 1,552 have a face too
// small to crop sharply, 36 have no detectable face. Those are wide action shots
// — a man at the far end of a pitch, a celebration with three team-mates in
// frame. Cropping harder just yields a blurry fragment. The only real fix is a
// different photograph.
//
// P18 is Wikidata's ONE nominated image and is often neither the best nor the
// newest. A player's Commons CATEGORY usually holds a dozen more. This walks the
// category, scores each candidate, and keeps the winner.
//
// SCORING, in the order that matters for a lineup card:
//   1. exactly one face          — a card with a team-mate's head in it is wrong
//   2. face large in the frame   — drives sharpness after the crop
//   3. portrait-ish aspect       — landscape match shots crop badly
//   4. recent                    — Alex: "the more recent the better", and a
//                                  recent photo is likelier to show the current club
//
// ⚠️ NEVER LOWERS QUALITY. A candidate must beat the incumbent on score before
// it replaces it, so a player with a good P18 keeps it.
//
// ⚠️ Licence is re-checked on the winner. A better-framed photo is worthless if
// it is not freely licensed, and the category contains files P18 never vouched for.
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';

const UA = 'BallIQ/1.0 (https://balliq.app; portrait re-pick)';
const TMP = '/tmp/repick-work';
const OUT = 'src/data/photoRepick.json';
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? +process.argv[i + 1] : Infinity; })();

const PHOTOS = JSON.parse(readFileSync('src/data/mysteryPhotos.json', 'utf8'));
const FACES = JSON.parse(readFileSync('src/data/playerFaces.json', 'utf8'));
const POOL = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const LINEUP = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));

if (!existsSync('/tmp/facebox')) {
  console.error('build the detector first:\n  swiftc -O -o /tmp/facebox scripts/facebox/main.swift');
  process.exit(1);
}

// Only players the builder actually offers, worst first: a two-face photo on a
// famous player is the most visible defect on the pitch.
const nameOf = new Map(LINEUP.players.map((p) => [p.i, p.n]));
const fameOf = new Map(POOL.map((p) => [p.id, p.fame || 0]));
const badness = (f) => (!f ? 3 : f.faces > 1 ? 2 : f.s > 0.85 ? 1 : 0);
// ⚠️ FIX THE PLAYERS PEOPLE SEE. A first pass sorted by defect severity then
// fame and spent its budget on Tshabalala, Mokoena and Kenwyne Jones — retired
// and obscure. What Alex looks at is a pre-filled XI: CURRENT squad players,
// then everyone else by fame.
const todo = LINEUP.players
  .map((p) => ({ id: p.i, name: p.n, bad: badness(FACES[p.i]),
    squad: p.q ? 1 : 0, active: p.v ? 1 : 0, fame: fameOf.get(p.i) || 0 }))
  .filter((p) => p.bad > 0)
  .sort((a, b) => (b.squad - a.squad) || (b.active - a.active)
    || (b.fame - a.fame) || (b.bad - a.bad))
  .slice(0, LIMIT);

console.log(`${todo.length} players with an unusable photo (worst and most famous first)`);

const done = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};

// ⚠️ CATEGORIES COME FROM WIKIDATA P373, IN BULK, NOT FROM A TEXT SEARCH. The
// trial resolved categories by searching Commons for the player's name and
// missed 6 of 10 — "no usable category" was mostly "search failed to find it".
// P373 is the authoritative link; the text search remains only as a fallback
// for items where the property is absent.
const P373 = {};
{
  const ids = todo.map((t) => t.id);
  for (let k = 0; k < ids.length; k += 250) {
    const chunk = ids.slice(k, k + 250).map((id) => 'wd:' + id).join(' ');
    const q = `SELECT ?p ?cat WHERE { VALUES ?p { ${chunk} } ?p wdt:P373 ?cat }`;
    for (let a = 1; a <= 4; a++) {
      try {
        const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(q),
          { headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA }, signal: AbortSignal.timeout(120000) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const t = await r.text();
        // A timed-out query returns 200 with a half-written body. 200 is not success.
        if (t.includes('SPARQL-QUERY: queryStr=') || !t.trimEnd().endsWith('}')) throw new Error('TRUNCATED');
        for (const b of JSON.parse(t).results.bindings) P373[b.p.value.split('/').pop()] = b.cat.value;
        break;
      } catch (e) {
        if (a === 4) console.error(`  ! P373 chunk ${k}: ${e.message}`);
        else await new Promise((s2) => setTimeout(s2, 4000 * a));
      }
    }
  }
  console.log(`Commons category known via P373: ${Object.keys(P373).length} of ${ids.length}`);
}

async function api(url, label) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 15000 * a)); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (a === 4) { console.error(`  ! ${label}: ${e.message}`); return null; }
      await new Promise((s) => setTimeout(s, 4000 * a));
    }
  }
  return null;
}

const USABLE = /^(CC0|CC BY|Public domain|PD|No restrictions|Attribution)/i;
const REJECT = /\bNC\b|\bND\b|non-commercial|noderiv|fair use|non-free|GFDL/i;
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

mkdirSync(TMP, { recursive: true });
let improved = 0, kept = 0, noCat = 0, i = 0;

for (const p of todo) {
  i++;
  if (p.id in done) continue;

  let cat = P373[p.id] ? 'Category:' + P373[p.id] : null;
  if (!cat) {
    // Fallback only: items with no P373 sometimes still have a findable category.
    const search = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search'
      + '&srnamespace=14&srlimit=1&srsearch=' + encodeURIComponent(p.name), `cat ${p.name}`);
    cat = search?.query?.search?.[0]?.title || null;
  }
  if (!cat) { done[p.id] = null; noCat++; continue; }

  const members = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json'
    + '&list=categorymembers&cmtype=file&cmlimit=25&cmtitle=' + encodeURIComponent(cat), `files ${p.name}`);
  const files = (members?.query?.categorymembers || []).map((m) => m.title);
  if (!files.length) { done[p.id] = null; noCat++; continue; }

  const meta = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
    + '&iiprop=url|extmetadata|size&titles=' + encodeURIComponent(files.slice(0, 25).join('|')), `meta ${p.name}`);

  const cands = [];
  for (const pg of Object.values(meta?.query?.pages || {})) {
    const ii = pg.imageinfo?.[0]; if (!ii) continue;
    const em = ii.extmetadata || {};
    const lic = strip(em.LicenseShortName?.value), author = strip(em.Artist?.value).slice(0, 120);
    if (!lic || !USABLE.test(lic) || REJECT.test(lic) || !author) continue;
    if (!/\.(jpe?g|png)$/i.test(pg.title)) continue;
    const when = strip(em.DateTimeOriginal?.value).slice(0, 10);
    cands.push({ file: pg.title.replace(/^File:/, ''), lic, author, when,
      page: ii.descriptionurl, w: ii.width, h: ii.height });
  }
  if (!cands.length) { done[p.id] = null; noCat++; continue; }

  // Detect faces on every candidate at once — one detector call per player.
  const paths = new Map();
  for (const c of cands.slice(0, 12)) {
    try {
      const r = await fetch('https://commons.wikimedia.org/wiki/Special:FilePath/'
        + encodeURIComponent(c.file.replace(/ /g, '_')) + '?width=600',
        { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (!(buf[0] === 0xFF && buf[1] === 0xD8) && !(buf[0] === 0x89 && buf[1] === 0x50)) continue;
      const fp = `${TMP}/${c.file.replace(/[^a-z0-9]/gi, '_').slice(0, 60)}.jpg`;
      writeFileSync(fp, buf); paths.set(fp, c);
    } catch {}
    await new Promise((s) => setTimeout(s, 250));
  }
  if (!paths.size) { done[p.id] = null; noCat++; continue; }

  let out = '';
  try { out = execFileSync('/tmp/facebox', [...paths.keys()], { encoding: 'utf8', maxBuffer: 64 << 20 }); } catch {}

  let best = null;
  for (const line of out.split('\n').filter(Boolean)) {
    let r; try { r = JSON.parse(line); } catch { continue; }
    const c = paths.get(r.file); if (!c || !r.ok) continue;
    // One face is worth more than anything else; then face size; then a
    // portrait shape; then recency as the tie-break.
    // ⚠️ FACE SIZE DOMINATES, and a tiny face is REJECTED outright. The first
    // scorer gave +1000 for a single face and about +30 for face size, so a
    // lone 3%-wide head beat a large one — it "improved" Hanae Shibata to a
    // face 3% of the frame. A face under 8% cannot make a sharp card at any
    // source width, so it is not a candidate at all.
    if (r.w < 0.08) continue;
    const year = +String(c.when).slice(0, 4) || 0;
    const score = Math.min(1200, r.w * 4000)          // size first, by a distance
      + (r.faces === 1 ? 500 : 0)                     // then a clean single subject
      + (c.h >= c.w ? 120 : 0)                        // then a portrait shape
      + Math.max(0, Math.min(90, (year - 2010) * 6)); // recency as tie-break
    if (!best || score > best.score) best = { score, c, r };
  }
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });

  const cur = FACES[p.id];
  // The incumbent is scored on the SAME scale, so a player with a good photo
  // keeps it. cur.s is the crop side; face width is 0.42 x that by construction.
  const curW = cur ? 0.42 * cur.s : 0;
  const curScore = Math.min(1200, curW * 4000) + (cur && cur.faces === 1 ? 500 : 0);
  if (best && best.score > curScore + 50) {
    done[p.id] = { file: best.c.file, licence: best.c.lic, author: best.c.author,
      page: best.c.page, when: best.c.when, faces: best.r.faces,
      // h is REQUIRED downstream: the crop centre uses y + h*0.42, and the first
      // trial forgot it — a box without h cannot be framed and gets discarded.
      box: { x: +best.r.x.toFixed(4), y: +best.r.y.toFixed(4),
             w: +best.r.w.toFixed(4), h: +best.r.h.toFixed(4) } };
    improved++;
  } else { done[p.id] = null; kept++; }

  if (i % 10 === 0) {
    writeFileSync(OUT, JSON.stringify(done));
    process.stdout.write(`  ${i}/${todo.length} · improved ${improved} · kept ${kept} · no usable category ${noCat}\r`);
  }
}
writeFileSync(OUT, JSON.stringify(done));
rmSync(TMP, { recursive: true, force: true });
console.log(`\n\nbetter photo found: ${improved}\nincumbent kept: ${kept}\nno usable category: ${noCat}`);
