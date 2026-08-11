// build-xi-pool.mjs — verified famous XIs for Guess the XI (spec:
// docs/GUESS-THE-XI-SPEC.md). ZERO ERROR rules apply: this is bank-grade.
//
// Source: the match article's structured lineup table —
//   |POS ||'''NO'''||{{flagicon|XX}} [[Article|Display]]
// Starters are the 11 rows before '''Substitutes:'''. Each player resolves to
// a Q-id via pageprops (never by name). A team's XI is DROPPED, loudly, if it
// does not have exactly 11 starters or any starter fails Q-id resolution —
// omission beats a guessed lineup.
import { readFileSync, writeFileSync } from 'fs';

const MATCHES = [
  { article: '2005 UEFA Champions League final', label: 'Champions League final, Istanbul 2005' },
  { article: '1999 UEFA Champions League final', label: 'Champions League final, Camp Nou 1999' },
  { article: '2011 UEFA Champions League final', label: 'Champions League final, Wembley 2011' },
  { article: '2013 UEFA Champions League final', label: 'Champions League final, Wembley 2013' },
  { article: '2012 UEFA Champions League final', label: 'Champions League final, Munich 2012' },
  { article: '2018 UEFA Champions League final', label: 'Champions League final, Kyiv 2018' },
  { article: '1998 FIFA World Cup final', label: 'World Cup final, Paris 1998' },
  { article: '2006 FIFA World Cup final', label: 'World Cup final, Berlin 2006' },
  { article: '2010 FIFA World Cup final', label: 'World Cup final, Johannesburg 2010' },
  { article: '2014 FIFA World Cup final', label: 'World Cup final, Maracanã 2014' },
  { article: '2022 FIFA World Cup final', label: 'World Cup final, Lusail 2022' },
  { article: 'UEFA Euro 2016 final', label: 'Euro 2016 final, Saint-Denis' },
];
const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; XI pool)' };

async function api(url) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { if (a === 3) throw e; await new Promise((s) => setTimeout(s, 3000 * a)); }
  }
}

// Parse both teams' starter blocks. Team names come from the kit-block titles
// ("| title = Liverpool<ref.../>"), in document order matching the two tables.
function parseLineups(wikitext) {
  const titles = [...wikitext.matchAll(/\|\s*title\s*=\s*([^<\n|]+)/g)]
    .map((m) => m[1].trim()).filter((t) => t && !/kit|colours/i.test(t));
  const teams = [];
  // Starter tables: rows of |POS ||'''NO'''|| ... [[link]] up to '''Substitutes:'''
  const blocks = wikitext.split(/'''Substitutes:'''/);
  for (let b = 0; b < blocks.length - 1 && teams.length < 2; b++) {
    const seg = blocks[b];
    const rows = [...seg.matchAll(/^\|\s*([A-Z]{2})\s*\|\|\s*'''(\d+)'''\s*\|\|.*?\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/gm)];
    const eleven = rows.slice(-11); // the 11 rows immediately before Substitutes
    if (eleven.length === 11) {
      teams.push({ players: eleven.map((m) => ({
        pos: m[1], no: +m[2], article: m[3].trim(), display: (m[4] || m[3]).trim().replace(/\s*\([^)]*\)$/, ''),
      })) });
    }
  }
  return { titles, teams };
}

const pool = [];
const failures = [];
for (const match of MATCHES) {
  const j = await api('https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext&format=json&formatversion=2&redirects=1&page=' + encodeURIComponent(match.article));
  const text = j?.parse?.wikitext;
  if (!text) { failures.push(`${match.article}: no wikitext`); continue; }
  const { titles, teams } = parseLineups(text);
  if (teams.length !== 2) { failures.push(`${match.article}: found ${teams.length} XI tables`); continue; }
  // date from the article's infobox
  const dm = text.match(/\|\s*date\s*=\s*(?:\{\{[^}]*\}\}\s*)?\[?\[?([^\n|\]]+)/);
  for (let t = 0; t < 2; t++) {
    const club = titles[t] || `Team ${t + 1}`;
    // Q-id resolution, one batch per XI
    const names = teams[t].players.map((p) => p.article);
    const r = await api('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(names.join('|')));
    const redirect = {}; for (const x of r?.query?.redirects || []) redirect[x.from] = x.to;
    const norm = {}; for (const x of r?.query?.normalized || []) norm[x.from] = x.to;
    const byTitle = {}; for (const pg of r?.query?.pages || []) byTitle[pg.title] = pg.pageprops?.wikibase_item;
    let ok = true;
    for (const p of teams[t].players) {
      let k = norm[p.article] || p.article; k = redirect[k] || k;
      p.qid = byTitle[k] || null;
      if (!p.qid) ok = false;
    }
    if (!ok) { failures.push(`${match.article} / ${club}: unresolved Q-id`); continue; }
    pool.push({
      id: `${match.article.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${t}`,
      match: match.label, club, date: (dm ? dm[1].trim() : ''),
      players: teams[t].players.map((p) => ({ qid: p.qid, name: p.display,
        surname: p.display.split(' ').pop(), no: p.no, pos: p.pos })),
    });
    await new Promise((s) => setTimeout(s, 400));
  }
  await new Promise((s) => setTimeout(s, 400));
}
writeFileSync('src/data/xiPool.json', JSON.stringify(pool, null, 1));
console.log(`xiPool.json: ${pool.length} verified XIs from ${MATCHES.length} matches`);
if (failures.length) { console.log('DROPPED (loud, per the rules):'); failures.forEach((f) => console.log('  ✗ ' + f)); }
// spot-check: Istanbul Liverpool XI must contain Gerrard and Dudek
const ist = pool.find((x) => x.id.includes('2005') && x.club === 'Liverpool');
if (ist) {
  const names = ist.players.map((p) => p.name).join(', ');
  console.log(`\nIstanbul spot-check (${ist.players.length}): ${names}`);
  if (!/Gerrard/.test(names) || !/Dudek/.test(names)) { console.error('✗ SPOT-CHECK FAILED'); process.exit(1); }
  console.log('✓ spot-check passed');
}
