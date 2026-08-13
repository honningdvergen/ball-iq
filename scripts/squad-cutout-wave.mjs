// squad-cutout-wave.mjs — take ONE club's current squad to full, high-standard
// cutout coverage.
//
//   node scripts/squad-cutout-wave.mjs "Manchester United" [--limit N]
//
// ⚠️ THIS EXISTS BECAUSE POOL-WIDE WORK WAS SOLVING THE WRONG PROBLEM. The
// builder had 57 Manchester United faces and not one of them was a player you
// would pick — Anderson and Macheda were covered, Shaw, Yoro, Heaven and Mbeumo
// were blank. Coverage of players nobody picks is not coverage. The unit of
// work is a SQUAD, finished, not a pool, enlarged.
//
// ⚠️ SQUAD COMES FROM WIKIPEDIA, NOT squads.json. The shipped file is stale —
// no Shaw, no Yoro, no Heaven, while still listing Tuanzebe and Josh Harrop,
// gone for years. scripts/_squads-wiki.json is refreshed from the club article's
// own first-team template and carries Wikidata q-ids, so players join by id and
// never by name (the short-name/long-name trap has fired five times in this
// repo).
//
// THE STANDARD, applied per player and enforced in code rather than hoped for:
//   licence   CC0 / CC BY / PD only — never NC, ND, GFDL-only or non-free
//   source    >= 700px wide, so a 640px cutout is not an upscale
//   subject   EXACTLY one face in the finished cutout (no stowaway team-mates)
//   crop      >= 320px of real pixels
//   framing   crown of the head clear of the top edge (alpha top > 2%)
//   recency   newest usable file wins; date is a tiebreak, not a gate, because
//             a sharp 2019 portrait beats a blurry 2026 one
// A player who fails every candidate gets NO cutout and keeps his monogram.
// That is Alex's rule — "excellent or initials" — and a blank is a correct
// outcome here, not a failure.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';

const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; squad cutout wave)' };
const CLUB = process.argv.find((a) => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || 'Manchester United';
const LIMIT = process.argv.includes('--limit') ? +process.argv[process.argv.indexOf('--limit') + 1] : Infinity;

const CACHE = '/tmp/cutout-orig';
const WORK = '/tmp/squad-wave';
mkdirSync(WORK, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const OUTDIR = 'public/lineup/cutouts';
const SQUADS = JSON.parse(readFileSync('scripts/_squads-wiki.json', 'utf8'));
const POOL = JSON.parse(readFileSync('public/data/lineup.json', 'utf8')).players;
const byId = new Map(POOL.map((p) => [p.i, p]));

const MIN_SRC_W = 700;
const MIN_CROP = 320;
const MIN_ALPHA_TOP = 0.02;
const USABLE = /^(CC0|CC BY|Public domain|PD|No restrictions|Attribution)/i;
const REJECT = /\bNC\b|\bND\b|non-commercial|noderiv|fair use|non-free|GFDL/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clean = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function api(url) {
  for (let a = 1; a <= 3; a += 1) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (r.status === 429) { await sleep(15000 * a); continue; }
      if (r.ok) return await r.json();
    } catch { /* retry */ }
    await sleep(1200 * a);
  }
  return null;
}

// ⚠️ SEARCH, NOT THE CATEGORY. Measured previously in this repo: category
// enumeration missed the uncategorised 2025/26 match-series files entirely —
// Lammens' category offered a 127px thumbnail while search found a 2871px
// portrait. Search is how the good recent photos are actually reachable.
async function candidatesFor(name, loose = false) {
  const q = encodeURIComponent(loose ? name : `${name} football`);
  const j = await api(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=40&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=320`);
  const pages = Object.values(j?.query?.pages || {});
  const surname = name.split(' ').pop().toLowerCase();
  if (!pages.length) return [];
  return pages.map((p) => {
    const ii = p.imageinfo?.[0]; if (!ii) return null;
    const md = ii.extmetadata || {};
    const lic = clean(md.LicenseShortName?.value);
    const date = clean(md.DateTimeOriginal?.value || md.DateTime?.value).slice(0, 10);
    const year = +(date.match(/(\d{4})/)?.[1] || 0);
    return {
      title: p.title, url: ii.url, w: ii.width, h: ii.height, lic, year,
      // ⚠️ THE NAMESAKE TRAP. ~5% of Commons files under a player's name show a
      // different human entirely — a politician, a statue, a country singer.
      // Requiring the SURNAME in the filename is a cheap, strong filter; the
      // single-face check downstream catches the rest.
      named: p.title.toLowerCase().includes(surname),
    };
  }).filter(Boolean)
    .filter((c) => c.named && c.w >= MIN_SRC_W && USABLE.test(c.lic) && !REJECT.test(c.lic))
    // Portrait-ish and recent first: a tall frame crops to a head far better
    // than a wide action shot, and newer kit reads as "current squad".
    .sort((a, b) => (b.year - a.year) || (b.h / b.w - a.h / a.w) || (b.w - a.w))
    .slice(0, 6);
}

function alphaTopOf(png) {
  // Reuse the same measurement the renderer relies on, via python+PIL, so the
  // gate and the page agree on what "head is cut off" means.
  const py = `
from PIL import Image
im = Image.open(${JSON.stringify(png)}).convert('RGBA')
bb = im.split()[3].getbbox()
print(0 if not bb else bb[1]/im.size[1])
`;
  try { return parseFloat(execFileSync('python3', ['-c', py], { encoding: 'utf8' }).trim()); }
  catch { return 0; }
}

// ⚠️ EVERY NETWORK CALL HERE IS CAUGHT, because one was not and it cost the
// whole run: an AbortSignal timeout on Patrick Dorgu's download threw out of
// the loop, killed the process at player 14 of 28, and took the results file
// with it. A single slow file must cost that player, never the wave.
async function download(url, dest) {
  if (existsSync(dest)) return true;
  // ⚠️ THE WHOLE BODY, NOT JUST THE fetch(). The first attempt at this guard
  // wrapped only the fetch call and the run died in exactly the same place a
  // second time — because an AbortSignal timeout fires while the RESPONSE BODY
  // is streaming, so it is `r.arrayBuffer()` that throws, not `fetch`. A
  // half-guarded network call reads as guarded and is not.
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45000) });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    const ok = (buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50);
    if (!ok) return false;
    writeFileSync(dest, buf);
    await sleep(1200);
    return true;
  } catch { return false; }
}

const squad = (SQUADS[CLUB] || []).filter((r) => r.qid && !/^\[\[/.test(r.display)).slice(0, LIMIT);
if (!squad.length) { console.error(`no squad for "${CLUB}" in _squads-wiki.json`); process.exit(1); }
console.log(`${CLUB} — ${squad.length} current squad players\n`);

const results = [];
for (const row of squad) {
  const name = row.display;
  const pooled = byId.get(row.qid);
  // ⚠️ TWO PASSES. The strict query ("<name> football", surname must appear in
  // the filename) is the right default — it kills the namesake trap where ~5%
  // of Commons files under a player's name show a politician or a statue. But
  // it returned ZERO for Zirkzee and Dorgu, whose files are named for the match
  // rather than the player. Falling back to the bare name, still surname-gated
  // and still licence-gated, recovers them without lowering the bar.
  let cands = [];
  // ⚠️ NOTHING IN A PLAYER'S PROCESSING MAY ABORT THE WAVE. Two runs were lost
  // to a single slow file; the cost of one bad player must be that player.
  try {
    cands = await candidatesFor(name);
    if (!cands.length) cands = await candidatesFor(name, true);
  } catch { cands = []; }
  let winner = null;
  const tried = [];

  for (const c of cands) {
    const src = `${WORK}/src_${row.qid}_${createHash('md5').update(c.title).digest('hex').slice(0, 8)}`;
    if (!(await download(c.url, src))) { tried.push(`${c.title}: download failed`); continue; }
    const out = `${WORK}/cut_${row.qid}.png`;
    let log;
    try { log = execFileSync('/tmp/facecut', [src, out, '640'], { encoding: 'utf8', timeout: 120000 }).trim(); }
    catch (e) { tried.push(`${c.title}: facecut failed`); continue; }
    const faces = +(log.match(/faces in cutout: (\d+)/)?.[1] ?? 99);
    const crop = +(log.match(/ok (\d+)px crop/)?.[1] ?? 0);
    const top = alphaTopOf(out);
    const why = faces !== 1 ? `${faces} faces` : crop < MIN_CROP ? `crop ${crop}px` : top <= MIN_ALPHA_TOP ? `head on the edge (${top.toFixed(3)})` : null;
    tried.push(`${c.title.replace(/^File:/, '')} [${c.year || '?'} ${c.w}px] -> ${why || 'PASS'}`);
    if (!why) { winner = { ...c, crop, top, out, src }; break; }
  }

  results.push({ qid: row.qid, name, pos: row.pos, winner, tried, hadPhoto: !!pooled?.f });
  writeFileSync(`${WORK}/wave.json`, JSON.stringify(results, null, 1));
  const mark = winner ? '✓' : '✗';
  console.log(`${mark} ${name.padEnd(24)} ${winner ? `${winner.year || '?'} · ${winner.crop}px crop · top ${winner.top.toFixed(3)}` : `no candidate passed (${cands.length} tried)`}`);
}

const pass = results.filter((r) => r.winner);
console.log(`\n${pass.length}/${results.length} players reached the standard`);
writeFileSync(`${WORK}/wave.json`, JSON.stringify(results, null, 1));
console.log(`detail: ${WORK}/wave.json  ·  cutouts: ${WORK}/cut_<qid>.png`);
console.log('\n⚠️ NOTHING IS PUBLISHED YET. Cutouts stage in /tmp/squad-wave for an');
console.log(`   eyeball pass; only approved ones are copied into ${OUTDIR}.`);
