// fetch-mystery-photos.mjs — freely-licensed player photos from Wikimedia Commons.
//
//   node scripts/fetch-mystery-photos.mjs            # active + recent (tier 1)
//   node scripts/fetch-mystery-photos.mjs --all      # everyone, legends included
//
// ⚠️ NOT A COPYRIGHT WORKAROUND. Commons only accepts freely-licensed files, so
// P18 images are licensed FOR reuse. Press-agency photos (Getty, Reuters, AP)
// are a different thing entirely and stay off-limits.
//
// ⚠️ COVERAGE IS NOT PERMISSION. Measured 24/24 on the top Ballon d'Or winners
// and ~100% across the top 600 — but a handful of Commons files carry wrong or
// restrictive tags, so this reads the ACTUAL licence per file and drops anything
// that is not clearly reusable. "It is on Commons" is an assumption until the
// licence field says otherwise.
//
// ⚠️ ATTRIBUTION IS THE CONDITION, not a nicety. CC BY and CC BY-SA both require
// crediting the photographer, so `author` and `licence` are stored next to every
// URL. A photo without them is unusable and is therefore not written.
import { writeFileSync, readFileSync, existsSync } from 'fs';

const ALL = process.argv.includes('--all');
const FROM_CORE = process.argv.includes('--core');
const OUT = 'src/data/mysteryPhotos.json';
const UA = 'BallIQ/1.0 (https://balliq.app; player photo fetch)';
const EP = 'https://query.wikidata.org/sparql';

// ⚠️ --core widens the fetch to scripts/_mystery-core.json — every fame>=25
// footballer, INCLUDING those the Mystery pipeline rejects. Leny Yoro has no
// P54 on Wikidata, so he is not in mysteryPool.json, so his photo was never
// fetched even though Commons holds four files of him. The lineup builder's
// pool is wider than Mystery's; its photo fetch must be too.
const POOL = JSON.parse(readFileSync(FROM_CORE ? 'scripts/_mystery-core.json' : 'src/data/mysteryPool.json', 'utf8'));
const CAREERS = JSON.parse(readFileSync('scripts/_mystery-careers.json', 'utf8'));

// Active = an open club spell (no end date) that started recently. Derived from
// data we already hold — no extra query, and it is the same signal a fan uses.
const okYear = (y) => Number.isFinite(y) && y >= 1850 && y <= 2027;
const tier = (p) => {
  const cs = CAREERS[p.id] || [];
  if (cs.some((c) => okYear(c.start) && c.start >= 2015 && !c.end)) return 'active';
  if (cs.some((c) => okYear(c.end) && c.end >= 2020)) return 'recent';
  return 'legend';
};

// ⚠️ SQUAD PLAYERS ARE A DIFFERENT POPULATION, not a subset of the fame pool.
// The fame pool starts at 25 Wikipedia languages, which is the right floor for
// a guessing game and the wrong one for a lineup builder: an academy keeper
// with 3 wikis is someone a fan wants to pick, and he is nowhere in POOL.
// squads.json holds 1,776 players across 68 clubs WITH squad depth, so it is
// the correct source here — the same file that was rightly rejected for
// Mystery Player, where a current-squad snapshot structurally cannot contain
// a retired legend. Right data, wrong mode; the reverse is true now.
const SQUADS = existsSync('src/data/squads.json')
  ? JSON.parse(readFileSync('src/data/squads.json', 'utf8')) : {};
const squadIds = new Set();
const squadPlayers = [];
for (const [club, list] of Object.entries(SQUADS))
  for (const p of list || []) {
    if (squadIds.has(p.id)) continue;      // loanees appear under two clubs
    squadIds.add(p.id);
    squadPlayers.push({ id: p.id, name: p.name, fame: 0, club });
  }

const poolTargets = POOL.filter((p) => ALL || tier(p) !== 'legend');
const seen = new Set(poolTargets.map((p) => p.id));
const targets = [...poolTargets, ...squadPlayers.filter((p) => !seen.has(p.id))];
console.log(`${targets.length} players in scope${ALL ? ' (everyone)' : ' (active + recent)'}`
  + ` — ${poolTargets.length} from the fame pool, ${targets.length - poolTargets.length} squad-only`);

// A widened licence rule only helps if previously-rejected files are re-checked.
// Rejections are stored as null, and the "already fetched" test is `id in
// photos`, so without this the 20 Attribution photos stay dropped forever and
// the re-run reports a clean pass. Clearing nulls costs ~41 lookups.
let cleared = 0;

// ⚠️ REJECT LIST, APPLIED TO THE LICENCE STRING ITSELF.
//  - NC / ND  : non-commercial or no-derivatives, not usable in a product
//  - fair use / non-free : not free at all, should never be on Commons but is
//  - GFDL-only: technically free, but requires shipping the full licence text.
//    Commons stopped accepting GFDL-only uploads for that reason. There is
//    almost always another photo of the same player, so skip rather than
//    inherit the obligation.
// ⚠️ "Attribution" IS A FREE LICENCE and this pattern originally rejected it.
// The first run threw away 20 usable photos because the rule was written as
// "starts with CC0/CC BY/Public domain" — a Commons file tagged plain
// `Attribution` (attribution-only, no share-alike) matched none of them. An
// over-strict allowlist fails silently: it reports a clean run and a slightly
// smaller number, which looks like coverage rather than a bug.
const USABLE = /^(CC0|CC BY|Public domain|PD|No restrictions|Attribution)/i;
const REJECT = /\bNC\b|\bND\b|non-commercial|noderiv|fair use|non-free|GFDL/i;
const reusable = (lic) => !!lic && USABLE.test(lic) && !REJECT.test(lic);

async function get(url, label) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const t = await r.text();
      if (!t.trimEnd().endsWith('}')) throw new Error('TRUNCATED');
      return JSON.parse(t);
    } catch (e) {
      console.error(`  ! ${label} attempt ${a}: ${e.message}`);
      if (a === 3) return null;
      await new Promise((s) => setTimeout(s, 3000 * a));
    }
  }
}

// ── 1. P18 file name per player ────────────────────────────────────────────
const CACHE = 'scripts/_mystery-p18.json';
let p18 = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const needP18 = targets.filter((p) => !(p.id in p18));
console.log(`P18 lookup: ${needP18.length} to fetch`);
for (let i = 0; i < needP18.length; i += 200) {
  const ids = needP18.slice(i, i + 200).map((p) => 'wd:' + p.id).join(' ');
  const j = await get(EP + '?query=' + encodeURIComponent(`SELECT ?p ?img WHERE { VALUES ?p { ${ids} } ?p wdt:P18 ?img . }`), `p18 ${i}`);
  if (j) for (const b of j.results.bindings) p18[b.p.value.split('/').pop()] = decodeURIComponent(b.img.value.split('/').pop());
  // Record the misses too, so a re-run does not ask again for players who
  // genuinely have no image.
  for (const p of needP18.slice(i, i + 200)) if (!(p.id in p18)) p18[p.id] = null;
  writeFileSync(CACHE, JSON.stringify(p18));
  process.stdout.write(`  ${Math.min(i + 200, needP18.length)}/${needP18.length}\r`);
}
console.log('');

const withFile = targets.filter((p) => p18[p.id]);
console.log(`have a Commons file: ${withFile.length}/${targets.length}`);

// ── 2. Licence + author per file, from Commons ─────────────────────────────
let photos = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
for (const [id, v] of Object.entries(photos)) if (v === null) { delete photos[id]; cleared++; }
if (cleared) console.log(`re-checking ${cleared} previously-rejected files under the widened licence rule`);
const need = withFile.filter((p) => !(p.id in photos));
console.log(`licence lookup: ${need.length} to fetch`);
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
let kept = 0, rejected = 0; const licCount = {};

for (let i = 0; i < need.length; i += 40) {
  const batch = need.slice(i, i + 40);
  const titles = batch.map((p) => 'File:' + p18[p.id]).join('|');
  const j = await get('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
    + '&iiprop=url|extmetadata&iiurlwidth=320&titles=' + encodeURIComponent(titles), `lic ${i}`);
  const pages = Object.values(j?.query?.pages || {});
  const byTitle = new Map(pages.map((pg) => [pg.title.replace(/^File:/, ''), pg]));
  for (const p of batch) {
    const pg = byTitle.get(p18[p.id]);
    const ii = pg?.imageinfo?.[0];
    const em = ii?.extmetadata || {};
    const licence = strip(em.LicenseShortName?.value);
    const author = strip(em.Artist?.value).slice(0, 120);
    licCount[licence || 'none'] = (licCount[licence || 'none'] || 0) + 1;
    // Attribution is a condition of CC BY / BY-SA, so a photo we cannot credit
    // is a photo we cannot use — no author means no entry.
    if (ii && reusable(licence) && author) {
      photos[p.id] = { thumb: ii.thumburl, full: ii.url, page: ii.descriptionurl, licence, author };
      kept++;
    } else { photos[p.id] = null; rejected++; }
  }
  writeFileSync(OUT, JSON.stringify(photos));
  process.stdout.write(`  ${Math.min(i + 40, need.length)}/${need.length} · kept ${kept} · rejected ${rejected}\r`);
}
console.log('');

const usable = Object.values(photos).filter(Boolean).length;
console.log(`\nUSABLE PHOTOS: ${usable}`);
console.log(`rejected this run: ${rejected} (no licence, unusable licence, or no creditable author)`);
console.log('\nlicence mix:');
Object.entries(licCount).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([k, v]) => console.log(`  ${String(v).padStart(5)}  ${k}${reusable(k) ? '' : '   ← rejected'}`));

const byTier = { active: 0, recent: 0, legend: 0 };
for (const p of POOL) if (photos[p.id]) byTier[tier(p)]++;
console.log('\nusable by tier:', JSON.stringify(byTier));

// Squad coverage is reported per club because that is how the lineup builder
// consumes it: one club with 40% coverage is a broken picker, even if the
// overall average looks healthy.
const thin = [];
let sq = 0, sqHave = 0;
for (const [club, list] of Object.entries(SQUADS)) {
  const ids = [...new Set((list || []).map((p) => p.id))];
  const got = ids.filter((id) => photos[id]).length;
  sq += ids.length; sqHave += got;
  if (ids.length && got / ids.length < 0.8) thin.push([club, got, ids.length]);
}
console.log(`squad coverage: ${sqHave}/${sq} (${(100 * sqHave / sq).toFixed(1)}%)`);
if (thin.length) {
  console.log(`\nclubs under 80% — a picker here would show blanks:`);
  thin.sort((a, b) => a[1] / a[2] - b[1] / b[2])
    .forEach(([c, g, n]) => console.log(`  ${String(Math.round(100 * g / n)).padStart(3)}%  ${String(g).padStart(2)}/${String(n).padEnd(2)}  ${c}`));
}
