// gen-guess-extra.mjs — the players we hold but the guess box could not find.
//
//   node scripts/gen-guess-extra.mjs           # report only
//   node scripts/gen-guess-extra.mjs --write   # emit src/data/guessExtra.json
//
// The guess box searches mysteryPool.json, which is Mystery Player's ranked
// pool. The Draft squads (draftSquads.json) and today's squads (squads.json)
// hold some 2,600 players it does not: John Barnes, Henrikh Mkhitaryan (Alex,
// 23 Oct: "be lenient with the search"). A player who types one of them in
// Transfer Trail or a Top 10 got nothing, which reads as "the game doesn't know
// him" when the game was never asked.
//
// ⚠️ A SEPARATE FILE, NOT ROWS IN mysteryPool.json. That pool is also the input
// the answer pickers and the grid/trail builders read; a name added there could
// become a daily answer on the next regeneration, with no career behind it.
// Here it can only ever be typed.
//
// ⚠️ NOT FOR MYSTERY PLAYER. Mystery ranks every guess by its career against
// the answer; a name with no career has no rank, so usePlayerPool merges these
// only when a screen asks for { extras: true } (Trail, Top 10), which judge a
// guess by its name.
//
// Nothing is invented: the name and id come from the squads, `club` is the club
// he played the most Draft league games for (else his squads.json club), and
// `born` only where squads.json holds it. A field we lack is left out.
//
// Output: { add: [{ id, name, club?, born?, aka? }], aka: { <pool id>: [name] } }.
// `add` are new records; `aka` are the names people type for players the pool
// already holds under a longer name, applied by usePlayerPool's withExtras.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normaliseName } from '../src/lib/mysteryPlayer.js';

const read = (p) => JSON.parse(readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8'));
const OUT = fileURLToPath(new URL('../src/data/guessExtra.json', import.meta.url));

const pool = read('src/data/mysteryPool.json');
const have = new Set(pool.map((p) => p.id));
const haveName = new Set(pool.map((p) => normaliseName(p.name)));

const extra = new Map();
// A player the pool holds under another name ("Nicolás González" for the Nico
// González the squads list): the name people type becomes a second spelling of
// the SAME record, never a second record, so picking either is one player.
const byId = new Map(pool.map((p) => [p.id, p]));
const aka = {};
const add = (id, name, fields) => {
  if (!name || haveName.has(normaliseName(name))) return;
  if (have.has(id)) {
    const own = normaliseName(byId.get(id).name);
    if (own !== normaliseName(name) && !(aka[id] || []).some((n) => normaliseName(n) === normaliseName(name))) (aka[id] ||= []).push(name);
    return;
  }
  const row = extra.get(id) || { id, name };
  // the same man under two spellings across the two files ("Dan" / "Daniel Ballard")
  if (normaliseName(row.name) !== normaliseName(name) && !(row.aka || []).some((n) => normaliseName(n) === normaliseName(name))) (row.aka ||= []).push(name);
  for (const [k, v] of Object.entries(fields)) if (v != null && row[k] == null) row[k] = v;
  extra.set(id, row);
};

// The Draft seasons: the club with the most league games across every season
// we hold. Settled history, so it comes first; a squads.json club is a current
// claim that goes stale when he moves.
const draft = read('src/data/draftSquads.json');
const games = new Map();
for (const [, clubIdx, , , , , , , , , rows] of draft.squads) {
  for (const [num, name, , starts, subs] of rows) {
    const id = `Q${num}`;
    const g = games.get(id) || { name, by: new Map() };
    const club = draft.clubs[clubIdx];
    g.by.set(club, (g.by.get(club) || 0) + (starts || 0) + (subs || 0));
    games.set(id, g);
  }
}
for (const [id, { name, by }] of games) {
  const club = [...by].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  add(id, name, { club });
}

// Today's squads: the birth year (what tells namesakes apart), and the club for
// anyone the Draft seasons do not hold.
for (const [club, men] of Object.entries(read('src/data/squads.json'))) {
  for (const m of men) add(m.id, m.name, { born: m.born, club });
}

const rows = [...extra.values()].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
console.log(`pool ${pool.length} · extra ${rows.length} (with born ${rows.filter((r) => r.born).length}) · second spellings ${Object.keys(aka).length}`);
for (const n of ['Henrikh Mkhitaryan', 'John Barnes']) console.log(` ${n}:`, JSON.stringify(rows.find((r) => r.name === n) || null));
if (process.argv.includes('--write')) {
  writeFileSync(OUT, JSON.stringify({ add: rows, aka }) + '\n');
  console.log('wrote', OUT);
}
