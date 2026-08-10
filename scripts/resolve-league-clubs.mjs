// resolve-league-clubs.mjs — the club list for a league, from its Wikipedia
// SEASON article, verified by Wikidata class. Zero name matching.
//
//   node scripts/resolve-league-clubs.mjs
//
// WHY SEASON ARTICLES. "Which clubs are in the Bundesliga" changes every May.
// The season article ("2026–27 Bundesliga") is the one page whose entire job
// is that answer, and its Teams section links every club. Wikidata's P118 is
// truthy-rank and returned Coventry as a Premier League club; name search
// returned a rock formation once. Season article + class check does neither.
//
// ⚠️ LINKS ARE VERIFIED BY P31 CLASS, NOT BY LOOKING CLUB-SHAPED. The Teams
// section links cities, stadiums and regions too. Every candidate link is
// resolved to its Wikidata item, and only items whose P31 is one of the
// classes OUR OWN 72 known clubs use survive — the same derived-class trick
// that caught the national-team trap. A hardcoded class list went stale once.
//
// ⚠️ "Team changes" sections are EXCLUDED — they link relegated and promoted
// clubs from other divisions, which is how a naive parse puts a 2. Bundesliga
// side in the Bundesliga.
import { readFileSync, writeFileSync } from 'fs';

const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; league coverage)' };
const QIDS = JSON.parse(readFileSync('scripts/_club-qids.json', 'utf8'));
const OUT = 'scripts/_league-clubs.json';

// Tier 1 minus the Premier League, which is already complete in the pack map.
const SEASONS = [
  { league: 'Bundesliga', article: '2026–27 Bundesliga', expect: 18 },
  { league: 'La Liga', article: '2026–27 La Liga', expect: 20 },
  { league: 'Serie A', article: '2026–27 Serie A', expect: 20 },
  { league: 'Ligue 1', article: '2026–27 Ligue 1', expect: 18 },
];

async function getJSON(url, label) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45000) });
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 8000 * a)); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (a === 4) { console.error(`  ! ${label}: ${e.message}`); return null; }
      await new Promise((s) => setTimeout(s, 3000 * a));
    }
  }
  return null;
}
// ⚠️ NO SPARQL IN THIS SCRIPT. Measured 2026-08-10: a VALUES-constrained P31
// query for TWO ids returned 95MB of unrelated entities — the query service
// was ignoring the VALUES clause and scanning every P31 object in Wikidata.
// The same shape had worked hours earlier; endpoint-side fault. wbgetentities
// reads claims directly, batched, with no query planner to misbehave.
async function p31Of(ids) {
  const map = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = [...new Set(ids.slice(i, i + 50))];
    const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities'
      + '&props=claims&format=json&ids=' + batch.join('|'), `p31 ${i}`);
    for (const [id, ent] of Object.entries(j?.entities || {})) {
      const set = new Set();
      for (const c of ent?.claims?.P31 || []) {
        const v = c?.mainsnak?.datavalue?.value?.id;
        if (v) set.add(v);
      }
      map.set(id, set);
    }
    await new Promise((s2) => setTimeout(s2, 250));
  }
  return map;
}

// 1. What does a football club look like? Ask our own 72, not a hardcoded list.
const known = Object.values(QIDS).map((v) => v.qid);
const CLUB_CLASSES = new Set();
for (const set of (await p31Of(known)).values()) for (const t of set) CLUB_CLASSES.add(t);
console.log(`club classes derived from our own packs: ${CLUB_CLASSES.size}`);

const out = {};
for (const season of SEASONS) {
  // 2. The season article's Teams section, links only.
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext'
    + '&format=json&formatversion=2&redirects=1&page=' + encodeURIComponent(season.article), season.article);
  const text = j?.parse?.wikitext;
  if (!text) { console.log(`✗ ${season.league}: no wikitext`); continue; }
  const heads = [...text.matchAll(/^(={2,4})\s*(.+?)\s*\1\s*$/gm)]
    .map((m) => ({ at: m.index, title: m[2] }));
  let section = '';
  for (let i = 0; i < heads.length; i++) {
    const t = heads[i].title;
    if (/^(teams|clubs|stadia|stadiums? and locations)$/i.test(t.trim()))
      section += text.slice(heads[i].at, heads[i + 1] ? heads[i + 1].at : undefined);
  }
  if (!section) { console.log(`✗ ${season.league}: no Teams section found`); continue; }
  // ⚠️ LINKS COME FROM THE SECTION'S TABLES, not its prose. The prose says
  // "Venezia and Frosinone were relegated…" — real clubs, so a class filter
  // rightly keeps them, and Serie A came back 23/20. The participant list
  // lives in the wikitable rows; prose is context. Fall back to the whole
  // section only when a season page carries no table at all.
  const tables = [...section.matchAll(/\{\|[\s\S]*?\|\}/g)].map((m) => m[0]).join('\n');
  const linkSource = tables.length > 200 ? tables : section;
  const titles = [...new Set([...linkSource.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)]
    .map((m) => m[1].trim())
    .filter((t) => !/^(File|Image|Category):/i.test(t)))];

  // 3. Titles -> Q-ids, batched.
  const qidOf = {};
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const r = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops'
      + '&ppprop=wikibase_item&format=json&formatversion=2&redirects=1&titles='
      + encodeURIComponent(batch.join('|')), `qids ${season.league}`);
    const redirect = {}; for (const x of r?.query?.redirects || []) redirect[x.from] = x.to;
    const norm = {}; for (const x of r?.query?.normalized || []) norm[x.from] = x.to;
    const byTitle = {}; for (const pg of r?.query?.pages || []) byTitle[pg.title] = { qid: pg.pageprops?.wikibase_item, title: pg.title };
    for (const t of batch) {
      let k = norm[t] || t; k = redirect[k] || k;
      if (byTitle[k]?.qid) qidOf[t] = { qid: byTitle[k].qid, article: byTitle[k].title };
    }
    await new Promise((s) => setTimeout(s, 250));
  }

  // 4. Class filter: keep only items that are football clubs by our own classes.
  const cands = Object.values(qidOf);
  const candClasses = await p31Of(cands.map((c) => c.qid));
  const isClub = new Set();
  for (const [id, set] of candClasses)
    if ([...set].some((t) => CLUB_CLASSES.has(t))) isClub.add(id);
  const clubs = [];
  const seen = new Set();
  for (const c of cands) {
    if (!isClub.has(c.qid) || seen.has(c.qid)) continue;
    seen.add(c.qid);
    clubs.push({ qid: c.qid, article: c.article });
  }

  const mark = clubs.length === season.expect ? '✓' : '⚠️';
  console.log(`${mark} ${season.league.padEnd(12)} ${clubs.length}/${season.expect} clubs from "${season.article}"`);
  if (clubs.length !== season.expect)
    console.log('   ' + clubs.map((c) => c.article).join(' | '));
  out[season.league] = clubs;
  await new Promise((s) => setTimeout(s, 400));
}

writeFileSync(OUT, JSON.stringify(out, null, 1));
const total = Object.values(out).flat().length;
const packQids = new Set(known);
const newClubs = Object.values(out).flat().filter((c) => !packQids.has(c.qid));
console.log(`\nwrote ${OUT} — ${total} tier-1 clubs, ${newClubs.length} NEW vs the pack map`);
