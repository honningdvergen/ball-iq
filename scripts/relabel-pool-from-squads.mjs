// relabel-pool-from-squads.mjs — carry a squads.json refresh into the Mystery pool.
//
//   node scripts/relabel-pool-from-squads.mjs           # report only
//   node scripts/relabel-pool-from-squads.mjs --write   # edit the pool and careers
//   node scripts/fix-pool-names.mjs                     # ALWAYS after it (last pass)
//
// ⚠️ WHY NOT JUST REBUILD THE POOL. build-mystery-pool-v2.mjs reads squads.json
// for the current-club label, so a rebuild would pick the new squads up. It
// would also wipe the four second passes audit-mystery-pool.mjs guards
// (nationality, dob, verified roles, curated corrections) and re-derive every
// row from a Wikidata harvest that has drifted since August. This touches only
// the rows a squad change actually concerns, and only two things on them.
//
// WHAT IT CHANGES, for players in the pool:
//   1. IN A SQUAD NOW. `club` becomes the squad's name, exactly as the builder
//      labels a current squad member. If the career holds no open spell at
//      that club, one is added, with the start year from the player's
//      Wikipedia infobox when it gives one.
//   2. NOT IN A SQUAD, BUT THE CAREER SAYS HE IS. An open-ended spell at one of
//      the squad clubs, for a player who is not in that squad, is the Wikidata
//      membership nobody closed (Tuanzebe at Manchester United since 2015). It
//      is what made him score as a current team-mate. If his infobox gives the
//      year he left, the spell is closed with it; if the infobox names the
//      club he is at now and we know that club, the spell is added.
//   3. A label that came from a squad he has left is then re-derived by the
//      builder's own rule, the longest single senior spell, but only when the
//      spell there was closed in step 2. Out on loan, or no year found: kept.
// Nothing is guessed: a spell is only closed with a year Wikipedia states, and
// a row whose infobox cannot be read is left as it was and counted.
//
// ⚠️ CLUBS ARE MATCHED BY WIKIDATA ID, NEVER BY NAME. Matching the career
// table's names to squad names by spelling missed 25 of the 65 clubs ("SSC
// Napoli", "PSV Eindhoven", "West Ham United F.C.") and matched Barcelona to
// Barcelona S.C. of Guayaquil. scripts/_mystery-careers.json holds the id
// behind every name in the shipped table.
//
// ⚠️ CLUB_FIXES ROWS ARE LEFT ALONE. Those careers were corrected by hand and
// fix-pool-names.mjs re-applies them last.
import { readFileSync, writeFileSync } from 'fs';
import { CLUB_FIXES } from './_name-overrides.mjs';

const WRITE = process.argv.includes('--write');
const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; squad refresh)' };
const YEAR_NOW = new Date().getFullYear();
const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const careers = JSON.parse(readFileSync('src/data/mysteryCareers.json', 'utf8'));
const SQUADS = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));
const QIDS = JSON.parse(readFileSync('scripts/_club-qids.json', 'utf8'));
const RAW = JSON.parse(readFileSync('scripts/_mystery-careers.json', 'utf8'));
const COUNTRY = JSON.parse(readFileSync('scripts/_mystery-clubcountry.json', 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const batches = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
async function getJSON(url, label) {
  for (let a = 1; a <= 5; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
      if (r.status === 429) { await sleep(10000 * a); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (a === 5) { console.error(`  ! ${label}: ${e.message}`); process.exit(1); }   // never write on a partial fetch
      await sleep(3000 * a);
    }
  }
  console.error(`  ! ${label}: rate-limited five times`); process.exit(1);
}

// ── club ids behind the names in the shipped career table ───────────────────
const idsOfName = new Map();        // career-table name -> Set of Wikidata ids
const namesOfId = new Map();        // Wikidata id -> Map(name -> uses)
for (const list of Object.values(RAW)) for (const c of list) {
  if (!idsOfName.has(c.name)) idsOfName.set(c.name, new Set());
  idsOfName.get(c.name).add(c.id);
  if (!namesOfId.has(c.id)) namesOfId.set(c.id, new Map());
  namesOfId.get(c.id).set(c.name, (namesOfId.get(c.id).get(c.name) || 0) + 1);
}
const tableIndex = new Map(careers.c.map((n, i) => [n, i]));
// The name to WRITE for a club id: its most-used name that is already in the table.
const nameFor = (qid) => [...(namesOfId.get(qid) || new Map())].filter(([n]) => tableIndex.has(n)).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
const spellIsAt = (idx, qid) => idsOfName.get(careers.c[idx])?.has(qid) || false;

const squadOf = new Map();          // player id -> squad name
for (const [club, squad] of Object.entries(SQUADS)) for (const p of squad) squadOf.set(p.id, club);
const squadQid = Object.fromEntries(Object.keys(SQUADS).map((c) => [c, QIDS[c]?.qid || null]));
const squadByQid = new Map(Object.entries(squadQid).filter(([, q]) => q).map(([c, q]) => [q, c]));

// ── who is concerned ────────────────────────────────────────────────────────
const openSquadSpells = (id) => (careers.p[id] || []).map((sp, i) => ({ sp, i }))
  .filter(({ sp }) => sp[2] == null && [...(idsOfName.get(careers.c[sp[0]]) || [])].some((q) => squadByQid.has(q)));
const concerned = pool.filter((p) => !CLUB_FIXES[p.id] && (squadOf.has(p.id)
  || openSquadSpells(p.id).some(({ sp }) => ![...(idsOfName.get(careers.c[sp[0]]) || [])].some((q) => squadByQid.get(q) === squadOf.get(p.id)))));
console.log(`${pool.length} pool rows · ${concerned.length} concerned by the squads (${concerned.filter((p) => squadOf.has(p.id)).length} in a squad now)`);

// ── their Wikipedia infobox careers ─────────────────────────────────────────
const article = {};
for (const b of batches(concerned.map((p) => p.id), 50)) {
  const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&props=sitelinks&sitefilter=enwiki&format=json&ids=' + b.join('|'), 'sitelinks');
  for (const [id, e] of Object.entries(j.entities || {})) article[id] = e?.sitelinks?.enwiki?.title || null;
  await sleep(250);
}
const yearsOf = (v) => {            // "2019–2025" | "2025–" | "2023" -> [start, end|null] ; unreadable -> null
  const m = String(v || '').replace(/<[^>]*>|\{\{[^}]*\}\}|&nbsp;/g, '').match(/(\d{4})\s*(?:[–—-]\s*(\d{4}|\d{2})?)?/);
  if (!m) return null;
  const start = Number(m[1]);
  const dash = /[–—-]/.test(String(v).slice(String(v).indexOf(m[1]) + 4));
  if (!dash) return [start, start];
  if (!m[2]) return [start, null];
  const end = m[2].length === 2 ? Number(String(start).slice(0, 2) + m[2]) : Number(m[2]);
  return end >= start ? [start, end] : null;
};
const infobox = {};                 // enwiki title -> [{ link, start, end, loan }]
for (const b of batches([...new Set(Object.values(article).filter(Boolean))], 40)) {
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&rvsection=0&format=json&formatversion=2&titles=' + encodeURIComponent(b.join('|')), 'infobox');
  const requested = {};
  for (const n of j.query?.normalized || []) requested[n.to] = n.from;
  for (const pg of j.query?.pages || []) {
    const wt = pg.revisions?.[0]?.slots?.main?.content || '';
    const field = (k) => wt.match(new RegExp(`\\|[^\\S\\n]*${k}[^\\S\\n]*=[^\\S\\n]*([^\\n]*)`, 'i'))?.[1]?.trim() || '';
    const spells = [];
    // Youth spells are read too, but only ever to CLOSE one of ours: Wikidata
    // files an academy under the senior club, so "Genk 2011-" is his boyhood.
    for (const [ck, yk, youth] of [['clubs', 'years', false], ['youthclubs', 'youthyears', true]])
      for (let i = 1; i <= 40; i++) {
        const club = field(`${ck}${i}`), yrs = yearsOf(field(`${yk}${i}`));
        if (!club) { if (i > 3 && !field(`${ck}${i + 1}`)) break; continue; }
        const link = club.match(/\[\[([^\]|]+)/)?.[1]?.trim();
        if (link && yrs) spells.push({ link, start: yrs[0], end: yrs[1], loan: /loan|→/i.test(club), youth });
      }
    infobox[requested[pg.title] || pg.title] = spells;
  }
  await sleep(350);
}
const linkQid = {};
for (const b of batches([...new Set(Object.values(infobox).flat().map((s) => s.link))], 50)) {
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(b.join('|')), 'club links');
  const red = {}, nrm = {}, by = {};
  for (const r of j.query?.redirects || []) red[r.from] = r.to;
  for (const n of j.query?.normalized || []) nrm[n.from] = n.to;
  for (const pg of j.query?.pages || []) by[pg.title] = pg.pageprops?.wikibase_item || null;
  for (const t of b) { let k = nrm[t] || t; k = red[k] || k; linkQid[t] = by[k] || null; }
  await sleep(300);
}
const wikiCareer = (id) => (infobox[article[id]] || []).map((s) => ({ ...s, qid: linkQid[s.link] || null })).filter((s) => s.qid);

// ── the builder's label rule, copied from build-mystery-pool-v2.mjs ─────────
const okYear = (y) => Number.isFinite(y) && y >= 1850 && y <= YEAR_NOW + 1;
const tenure = ([, s, e]) => {
  if (okYear(s) && okYear(e) && e >= s && e - s <= 30) return e - s;
  if (okYear(s) && e == null) { const y = YEAR_NOW - s; return y >= 0 && y <= 30 ? y : 0; }
  return 0;
};
const longest = (spells) => [...spells].sort((a, b) => (tenure(b) - tenure(a)) || ((okYear(b[1]) ? b[1] : 0) - (okYear(a[1]) ? a[1] : 0)))[0];
const clubKey = (n) => String(n || '').toLowerCase()
  .replace(/\b(f\.?c\.?|c\.?f\.?|s\.?l\.?|a\.?c\.?|s\.?c\.?|afc|club de futbol|club de fútbol|calcio)\b/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const canonByKey = new Map(Object.keys(SQUADS).map((c) => [clubKey(c), c]));
const canonClub = (name) => canonByKey.get(clubKey(name)) || name;

// ── apply ───────────────────────────────────────────────────────────────────
const n = { relabelSquad: 0, addOpen: 0, addOpenNoYear: 0, closed: 0, leftOpen: 0, addCurrent: 0, relabelTenure: 0, noInfobox: 0, rows: 0 };
const log = [];
for (const p of concerned) {
  const before = JSON.stringify([p.club, careers.p[p.id]]);
  const spells = (careers.p[p.id] || []).map((sp) => [...sp]);
  const wiki = wikiCareer(p.id);
  if (!wiki.length) n.noInfobox++;
  const squad = squadOf.get(p.id) || null;
  const here = squad ? squadQid[squad] : null;
  // His label is a squad he is not in. It is re-derived only if the spell there
  // really ended: a player out on loan is still that club's player (Hwang
  // Hee-chan, at Schalke on loan from Wolves, is not best described as a Red
  // Bull Salzburg player), and a spell with no end year found proves nothing.
  const labelQid = Object.hasOwn(SQUADS, p.club) && p.club !== squad ? squadQid[p.club] : null;

  // close open spells at clubs he is not at, with the year Wikipedia gives.
  // The LATEST spell Wikipedia has at that club decides: if that one is still
  // open he is there, whatever the squad list says, and ours stays open too.
  for (const sp of spells) {
    if (sp[2] != null) continue;
    const ids = [...(idsOfName.get(careers.c[sp[0]]) || [])];
    if (here && ids.includes(here)) continue;                       // his current squad: stays open
    const w = wiki.filter((s) => ids.includes(s.qid)).sort((a, b) => b.start - a.start)[0];
    // Our start year is Wikidata's and can be nonsense (Willy Caballero's first
    // Boca Juniors spell "began" in 2017 and ended in 2004). When it cannot be
    // squared with Wikipedia's end year, Wikipedia's start replaces it.
    if (w && w.end != null) { sp[2] = w.end; if (!okYear(sp[1]) || sp[1] > w.end) sp[1] = w.start; n.closed++; }
    else if (ids.some((q) => squadByQid.has(q))) n.leftOpen++;
  }
  // an open spell where he is now
  const addOpen = (qid, start) => {
    const name = nameFor(qid);
    if (!name || spells.some((sp) => sp[2] == null && spellIsAt(sp[0], qid))) return false;
    // A loan renewed for a second season is ONE spell on Wikipedia ("2025-")
    // and a closed one in our data ("2025-2026"): reopen it, do not add a twin.
    const same = okYear(start) && spells.find((sp) => sp[1] === start && spellIsAt(sp[0], qid));
    if (same) same[2] = null;
    else spells.push([tableIndex.get(name), okYear(start) ? start : null, null]);
    return true;
  };
  if (here) {
    const w = wiki.filter((s) => !s.youth && s.qid === here && s.end == null).sort((a, b) => b.start - a.start)[0];
    if (addOpen(here, w?.start)) { n.addOpen++; if (!w) n.addOpenNoYear++; }
  } else {
    const w = wiki.filter((s) => !s.youth && s.end == null && !s.loan).sort((a, b) => b.start - a.start)[0];
    if (w && !squadByQid.has(w.qid) && addOpen(w.qid, w.start)) n.addCurrent++;
  }

  let club = p.club;
  if (squad) club = squad;
  else if (labelQid && spells.length && !spells.some((sp) => sp[2] == null && spellIsAt(sp[0], labelQid))
    && (careers.p[p.id] || []).some((sp) => sp[2] == null && spellIsAt(sp[0], labelQid))) club = canonClub(careers.c[longest(spells)[0]]);
  if (squad && club !== p.club) n.relabelSquad++;
  if (!squad && club !== p.club) n.relabelTenure++;

  if (JSON.stringify([club, spells]) === before) continue;
  n.rows++;
  log.push(`${p.name} (${p.id}): ${p.club} -> ${club} | ${spells.map(([i, a, b]) => `${careers.c[i]} ${a ?? '?'}-${b ?? ''}`).join(' · ')}`);
  if (club !== p.club) {
    const qid = squad ? here : [...(idsOfName.get(careers.c[longest(spells)[0]]) || [])][0];
    p.club = club;
    if (qid) { p.clubId = qid; p.country = COUNTRY[qid] ?? p.country; }
  }
  careers.p[p.id] = spells;
  p.clubCount = spells.length;
}

console.log(`rows changed: ${n.rows}`);
console.log(`  label set to the current squad: ${n.relabelSquad}   · re-derived by longest spell after leaving a squad: ${n.relabelTenure}`);
console.log(`  open spell added at the current squad club: ${n.addOpen} (${n.addOpenNoYear} with no start year on Wikipedia)`);
console.log(`  stale open spells closed with Wikipedia's year: ${n.closed}   · left open, no year found: ${n.leftOpen}`);
console.log(`  current club added for players outside the squads: ${n.addCurrent}`);
console.log(`  concerned rows with no readable infobox career: ${n.noInfobox}`);
writeFileSync('.cache/pool-relabel.txt', log.join('\n') + '\n');
console.log('  → every changed row: .cache/pool-relabel.txt');
if (!WRITE) { console.log('\n(report only: pass --write)'); process.exit(0); }
writeFileSync('src/data/mysteryCareers.json', JSON.stringify(careers));
writeFileSync('src/data/mysteryPool.json', JSON.stringify(pool, null, 2));
console.log('\nwrote src/data/mysteryPool.json and src/data/mysteryCareers.json — now run scripts/fix-pool-names.mjs');
