// fetch-nation-flags.mjs — one small flag picture per nation in
// src/data/mysteryNations.json, from Wikimedia Commons, as static files.
//
//   node scripts/fetch-nation-flags.mjs
//
// Writes public/flags/<slug>.png (80 px wide, Commons' own PNG rendering of the
// flag's SVG), src/data/nationFlags.json ({ nation: "flags/<slug>.png" }) and
// public/flags/LICENCES.md (file, page, licence, author for every flag).
//
// ⚠️ WHY COMMONS AND NOT AN npm FLAG SET. The brief suggested the MIT
// `flag-icons` package; it is not installed here and this job may read only
// Wikidata and Commons. National flags on Commons are, almost all, in the
// public domain (government insignia, or too simple for copyright), and the
// licence of every file is read from Commons and written beside it, not
// assumed. A flag whose licence is not free is not written.
//
// ⚠️ PNG, NOT SVG. A rendered PNG is 1–3 KB, needs no sanitising and cannot
// carry script; the app fetches it one by one when a tile shows it. Nothing
// here is imported by JS: the files live in public/ and are never bundled.
//
// ⚠️ A FILE NAME IS A CLAIM. "Flag of X.svg" is Commons' own naming for a
// country's current flag; every pick that is not that plain pattern is in
// FILE below with the reason, so a reader can check it.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const UA = 'BallIQ/1.0 (https://balliq.app; player photo fetch)';
const WIDTH = 80;
const N = JSON.parse(readFileSync('src/data/mysteryNations.json', 'utf8')).n;

// Nation -> Commons file, where it is not "Flag of <nation>.svg".
const FILE = {
  'Netherlands': 'Flag of the Netherlands.svg',
  'Philippines': 'Flag of the Philippines.svg',
  'Faroe Islands': 'Flag of the Faroe Islands.svg',
  'Central African Republic': 'Flag of the Central African Republic.svg',
  'Dominican Republic': 'Flag of the Dominican Republic.svg',
  'United States': 'Flag of the United States.svg',
  'United Arab Emirates': 'Flag of the United Arab Emirates.svg',
  'Czech Republic': 'Flag of the Czech Republic.svg',
  'Gambia': 'Flag of The Gambia.svg',
  'Bahamas': 'Flag of the Bahamas.svg',
  'Comoros': 'Flag of the Comoros.svg',
  'Maldives': 'Flag of Maldives.svg',
  'Solomon Islands': 'Flag of the Solomon Islands.svg',
  'Cayman Islands': 'Flag of the Cayman Islands.svg',
  'Ivory Coast': "Flag of Côte d'Ivoire.svg",
  'DR Congo': 'Flag of the Democratic Republic of the Congo.svg',
  'Congo': 'Flag of the Republic of the Congo.svg',
  'Republic of Ireland': 'Flag of Ireland.svg',
  'China': "Flag of the People's Republic of China.svg",
  'Timor-Leste': 'Flag of East Timor.svg',
  // The Tahiti team plays under French Polynesia's flag.
  'Tahiti': 'Flag of French Polynesia.svg',
  // Northern Ireland's football team (IFA) plays under the Ulster Banner; the
  // region has no official flag of its own.
  'Northern Ireland': 'Flag of Northern Ireland (1953–1972).svg',
  // Historical sides: the flag of the state they represented.
  'Soviet Union': 'Flag of the Soviet Union.svg',
  // ⚠️ Yugoslavia's team spans the Kingdom (to 1941), SFR (1945–91) and FR
  // Yugoslavia (1992–2003). The SFR flag is the one most of its players wore.
  'Yugoslavia': 'Flag of Yugoslavia (1946-1992).svg',
  'Czechoslovakia': 'Flag of Czechoslovakia.svg',
  'East Germany': 'Flag of East Germany.svg',
  'Serbia and Montenegro': 'Flag of Serbia and Montenegro.svg',
  'Netherlands Antilles': 'Flag of the Netherlands Antilles (1986–2010).svg',
};
// Nations with no flag we can name honestly; they get none (and are reported).
const NO_FLAG = new Set([
  // The CIS side of 1992 played under no state's flag.
  'CIS',
]);

const slug = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const FREE = /^(CC0|CC BY|Public domain|PD|No restrictions|Attribution)/i;
const NOTFREE = /\bNC\b|\bND\b|non-commercial|noderiv|fair use|non-free|GFDL/i;

async function get(url, label, binary = false) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 15000 * a)); continue; }
      if (r.status === 403) { console.error(`blocked at ${label} (HTTP 403) — stopping`); process.exit(2); }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return binary ? Buffer.from(await r.arrayBuffer()) : await r.json();
    } catch (e) {
      if (a === 4) { console.error(`  ! ${label}: ${e.message}`); return null; }
      await new Promise((s) => setTimeout(s, 3000 * a));
    }
  }
  return null;
}

mkdirSync('public/flags', { recursive: true });
const want = N.filter((n) => !NO_FLAG.has(n)).map((n) => ({ n, file: FILE[n] || `Flag of ${n}.svg` }));
const map = {}, rows = [], missing = [...NO_FLAG].filter((n) => N.includes(n)).map((n) => `${n}: no flag (see NO_FLAG)`);
for (let i = 0; i < want.length; i += 40) {
  const batch = want.slice(i, i + 40);
  const j = await get('https://commons.wikimedia.org/w/api.php?action=query&format=json&redirects=1&prop=imageinfo'
    + `&iiprop=url|extmetadata&iiurlwidth=${WIDTH}&titles=` + encodeURIComponent(batch.map((b) => 'File:' + b.file).join('|')), `meta ${i}`);
  const norm = new Map((j?.query?.normalized || []).map((x) => [x.from, x.to]));
  const redir = new Map((j?.query?.redirects || []).map((x) => [x.from, x.to]));
  const pages = new Map(Object.values(j?.query?.pages || {}).map((p) => [p.title, p]));
  for (const b of batch) {
    let t = 'File:' + b.file; t = norm.get(t) || t; t = redir.get(t) || t;
    const pg = pages.get(t);
    const ii = pg?.imageinfo?.[0];
    if (!ii) { missing.push(`${b.n}: ${b.file} not on Commons`); continue; }
    const em = ii.extmetadata || {};
    const licence = strip(em.LicenseShortName?.value) || 'unknown';
    const author = strip(em.Artist?.value).slice(0, 160) || '';
    if (!FREE.test(licence) || NOTFREE.test(licence)) { missing.push(`${b.n}: ${t} licence "${licence}" not free`); continue; }
    const out = `public/flags/${slug(b.n)}.png`;
    if (!existsSync(out)) {
      const buf = await get(ii.thumburl, `png ${b.n}`, true);
      if (!buf || !(buf[0] === 0x89 && buf[1] === 0x50)) { missing.push(`${b.n}: thumbnail not a PNG`); continue; }
      writeFileSync(out, buf);
      await new Promise((s) => setTimeout(s, 400));
    }
    map[b.n] = `flags/${slug(b.n)}.png`;
    rows.push(`| ${b.n} | flags/${slug(b.n)}.png | [${t.replace(/^File:/, '')}](${ii.descriptionurl}) | ${licence} | ${author.replace(/\|/g, '/') || '—'} |`);
  }
  await new Promise((s) => setTimeout(s, 900));
}

writeFileSync('src/data/nationFlags.json', JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 1));
writeFileSync('public/flags/LICENCES.md', `# Flags

Every file in this folder is Wikimedia Commons' own ${WIDTH}-pixel PNG rendering of the flag file named
beside it, fetched by scripts/fetch-nation-flags.mjs. The licence and author are as Commons states
them for that file. National flags are, with few exceptions, in the public domain; where a licence
asks for attribution, the author column carries it.

| Nation | File here | Commons source | Licence | Author |
|---|---|---|---|---|
${rows.sort().join('\n')}
`);
console.log(`flags written: ${Object.keys(map).length} of ${N.length} nations`);
if (missing.length) console.log('NO FLAG:\n  ' + missing.join('\n  '));
