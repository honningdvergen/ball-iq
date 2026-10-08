// derive-squad-moves.mjs — what a squad refresh means for the Mystery pool.
//
//   node scripts/derive-squad-moves.mjs [--before <old squads.json>]
//
// Run after build-squads.mjs --write and before apply-squad-moves.mjs. Writes
// scripts/_squad-moves.json and changes nothing else.
//
// ⚠️ WHY A SQUAD REFRESH TOUCHES THE POOL AT ALL. build-mystery-pool-v2.mjs
// labels anyone in squads.json with that squad as his club, so a stale squad
// row is a false label under a name: on 2026-10-08 Marcus Rashford read
// Barcelona and Rodri read Manchester City. The label is the smaller half.
// The row got into the squad because Wikidata holds an open spell for him
// there, and that same open spell sits in src/data/mysteryCareers.json, where
// similarity() reads "still there" off it and pays the current-club and the
// years-as-team-mates terms.
//
// So for every pool player whose squad changed (left one, joined one, or moved
// between two) this reads the senior career in his own Wikipedia infobox and
// records two kinds of correction:
//   close   an open spell at a club the infobox says he has left, with the
//           infobox's end year. Never a guessed year: a spell the infobox does
//           not date stays as it is and is listed under `unresolved`.
//   add     the open spell at the club he is at now, when the career has none,
//           with the infobox's start year.
//   reopen  the same, where the career already holds that spell with an end
//           date the infobox does not have.
// A loan leaves the parent club's spell open, because the infobox does.
//
// ⚠️ CLUBS ARE MATCHED BY WIKIDATA ID. The infobox links an article, the
// article resolves to an id, and the id is looked up in the careers the pool
// was built from. The career table's own spelling of a club is then reused, so
// a team-mate stays a team-mate ("Manchester United F.C.", never a second
// spelling that similarity() would read as a different club).
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { CLUB_FIXES } from './_name-overrides.mjs';

const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; squad refresh)' };
const OUT = 'scripts/_squad-moves.json';
const arg = (f) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : null);

const POOL = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const SQUADS = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));
// "Before" is the squads file as last committed, unless a path is given.
const BEFORE = JSON.parse(arg('--before')
  ? readFileSync(arg('--before'), 'utf8')
  : execFileSync('git', ['show', 'HEAD:src/data/squads.json'], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const CAREERS = JSON.parse(readFileSync('src/data/mysteryCareers.json', 'utf8'));
const RAW = JSON.parse(readFileSync('scripts/_mystery-careers.json', 'utf8'));
const QIDS = JSON.parse(readFileSync('scripts/_club-qids.json', 'utf8'));
const EV = JSON.parse(readFileSync('scripts/_squads-evidence.json', 'utf8'));
const PRIOR = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { moves: {} };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(url, label) {
  for (let a = 1; a <= 5; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (a === 5) throw new Error(`${label}: ${e.message}`);
      await sleep(4000 * a);
    }
  }
}
const chunks = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// ── who moved ───────────────────────────────────────────────────────────────
const squadOf = (squads) => {
  const m = new Map();
  for (const [club, list] of Object.entries(squads)) for (const p of list) m.set(p.id, club);
  return m;
};
const was = squadOf(BEFORE), now = squadOf(SQUADS);
const moved = POOL.filter((p) => was.get(p.id) !== now.get(p.id) && !CLUB_FIXES[p.id]);
console.log(`pool players whose squad changed: ${moved.length}`
  + `  (left ${moved.filter((p) => was.get(p.id) && !now.get(p.id)).length}`
  + ` · joined ${moved.filter((p) => !was.get(p.id) && now.get(p.id)).length}`
  + ` · moved ${moved.filter((p) => was.get(p.id) && now.get(p.id)).length})`);

// ── the club vocabulary of the careers file, by Wikidata id ─────────────────
const tableHas = new Set(CAREERS.c);
const nameOfQid = new Map();               // club qid -> the career table's spelling
const qidOfName = new Map();               // spelling -> Set(qid)
for (const list of Object.values(RAW)) for (const c of list) {
  if (tableHas.has(c.name) && !nameOfQid.has(c.id)) nameOfQid.set(c.id, c.name);
  if (!qidOfName.has(c.name)) qidOfName.set(c.name, new Set());
  qidOfName.get(c.name).add(c.id);
}
/** The Wikidata id behind one of a player's shipped spells. */
function spellQid(playerId, name) {
  const own = (RAW[playerId] || []).filter((c) => c.name === name).map((c) => c.id);
  if (own.length) return own[0];
  const any = qidOfName.get(name);
  return any && any.size === 1 ? [...any][0] : null;   // an ambiguous spelling is not guessed
}

// ── each moved player's infobox ─────────────────────────────────────────────
const titleOf = new Map();
{
  const missing = moved.filter((p) => !EV.players[p.id]?.title).map((p) => p.id);
  for (const p of moved) if (EV.players[p.id]?.title) titleOf.set(p.id, EV.players[p.id].title);
  for (const batch of chunks(missing, 50)) {
    const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks'
      + '&sitefilter=enwiki&ids=' + batch.join('|'), 'sitelinks');
    for (const id of batch) if (j.entities?.[id]?.sitelinks?.enwiki?.title) titleOf.set(id, j.entities[id].sitelinks.enwiki.title);
    await sleep(200);
  }
}
const infobox = new Map();                 // player id -> section 0 wikitext
{
  const byTitle = new Map([...titleOf].map(([id, t]) => [t, id]));
  for (const batch of chunks([...byTitle.keys()], 25)) {
    let cont = '';
    do {
      const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2'
        + '&prop=revisions&rvprop=content&rvslots=main&rvsection=0&redirects=1&titles='
        + encodeURIComponent(batch.join('|')) + cont, 'infobox');
      const back = {};
      for (const n of j.query?.normalized || []) back[n.to] = n.from;
      for (const r of j.query?.redirects || []) back[r.to] = back[r.from] || r.from;
      for (const pg of j.query?.pages || []) {
        const text = pg.revisions?.[0]?.slots?.main?.content;
        if (text != null) infobox.set(byTitle.get(back[pg.title] || pg.title), text);
      }
      cont = j.continue ? '&' + new URLSearchParams(j.continue).toString() : '';
    } while (cont);
    await sleep(200);
  }
}
console.log(`infoboxes read: ${infobox.size} of ${moved.length}`);

// Depth-aware, for the reason fetch-squads-wiki.mjs gives: a "|" inside a link
// or a nested template is not a field separator.
function fieldsOf(text) {
  const at = text.search(/\{\{\s*infobox football biography/i);
  if (at < 0) return null;
  let depth = 0, i = at;
  for (; i < text.length; i++) {
    if (text.startsWith('{{', i)) { depth++; i++; } else if (text.startsWith('}}', i)) { depth--; i++; if (!depth) break; }
  }
  const body = text.slice(at + 2, i - 1);
  const out = {};
  let cur = '', curly = 0, square = 0;
  const flush = () => {
    const eq = cur.indexOf('=');
    if (eq > -1) out[cur.slice(0, eq).trim().toLowerCase()] = cur.slice(eq + 1).trim();
    cur = '';
  };
  for (let k = 0; k < body.length; k++) {
    const two = body.slice(k, k + 2);
    if (two === '{{') { curly++; cur += two; k++; continue; }
    if (two === '}}') { curly--; cur += two; k++; continue; }
    if (two === '[[') { square++; cur += two; k++; continue; }
    if (two === ']]') { square--; cur += two; k++; continue; }
    if (body[k] === '|' && !curly && !square) { flush(); continue; }
    cur += body[k];
  }
  flush();
  return out;
}
const clean = (v) => String(v || '').replace(/<ref[^>]*>[\s\S]*?<\/ref>|<ref[^>]*\/>|<!--[\s\S]*?-->/g, '').trim();
function seniorCareer(fields) {
  const rows = [];
  for (let n = 1; n <= 60; n++) {
    const club = clean(fields['clubs' + n]), years = clean(fields['years' + n]);
    if (!club) continue;
    const link = club.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/);
    const y = years.replace(/&ndash;|—|-/g, '–').match(/\b((?:18|19|20)\d{2})\s*(–)?\s*((?:18|19|20)\d{2})?/);
    rows.push({
      title: link ? link[1].replace(/_/g, ' ').trim() : null,
      text: club.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/→|\(loan\)/gi, '').trim(),
      loan: /→|\bloan\b/i.test(club),
      start: y ? Number(y[1]) : null,
      // "2021" alone is a one-year spell; "2021–" is still running.
      end: y ? (y[3] ? Number(y[3]) : (y[2] ? null : Number(y[1]))) : undefined,
    });
  }
  return rows;
}

const career = new Map();                  // player id -> [{title, loan, start, end}]
for (const [id, text] of infobox) {
  const f = fieldsOf(text);
  if (f) career.set(id, seniorCareer(f));
}

// ⚠️ ONE STAY CAN BE TWO ROWS. A loan made permanent is written as two lines in
// the infobox: Willian José's Real Betis reads "2021–2022 (loan)" and then
// "2022–2024". Matching a spell to the first line alone ended his Betis career
// two years early, and the independent check of this file's first output
// caught it. Rows at the same club that touch are one stay, from the first
// start to the last end, and still running if the last row is.
function stays(rows) {
  const out = [];
  for (const r of rows.filter((x) => x.qid && x.start != null && x.end !== undefined).sort((a, b) => a.start - b.start)) {
    const prev = out.filter((o) => o.qid === r.qid).pop();
    if (prev && prev.end != null && r.start <= prev.end) prev.end = r.end == null ? null : Math.max(prev.end, r.end);
    else if (!(prev && prev.end == null)) out.push({ ...r });
  }
  return out;
}

// Resolve every club article the infoboxes link to a Wikidata id.
const teamQid = new Map();
{
  const titles = [...new Set([...career.values()].flat().map((r) => r.title).filter(Boolean))];
  for (const batch of chunks(titles, 50)) {
    const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item'
      + '&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(batch.join('|')), 'club ids');
    const fwd = {};
    for (const n of j.query?.normalized || []) fwd[n.from] = n.to;
    const red = {};
    for (const r of j.query?.redirects || []) red[r.from] = r.to;
    const item = {};
    for (const pg of j.query?.pages || []) item[pg.title] = pg.pageprops?.wikibase_item || null;
    for (const t of batch) { const n = fwd[t] || t; teamQid.set(t, item[red[n] || n] || null); }
    await sleep(200);
  }
}
for (const rows of career.values()) for (const r of rows) r.qid = r.title ? teamQid.get(r.title) || null : null;
for (const [id, rows] of career) career.set(id, stays(rows));

// A club the careers file has never seen needs a name. The builder uses the
// Wikidata label, so that is what a new table entry gets.
const labelOf = new Map();
{
  const need = new Set();
  for (const p of moved) {
    const rows = career.get(p.id) || [];
    for (const r of rows) if (r.qid && r.end === null && !nameOfQid.has(r.qid)) need.add(r.qid);
    const sq = now.get(p.id);
    if (sq && !nameOfQid.has(QIDS[sq].qid)) need.add(QIDS[sq].qid);
  }
  for (const batch of chunks([...need], 50)) {
    const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels&languages=en&ids='
      + batch.join('|'), 'club labels');
    for (const id of batch) if (j.entities?.[id]?.labels?.en?.value) labelOf.set(id, j.entities[id].labels.en.value);
    await sleep(200);
  }
}
const spelling = (qid) => nameOfQid.get(qid) || labelOf.get(qid) || null;

// ── the corrections ─────────────────────────────────────────────────────────
const moves = {};
const tally = { closed: 0, added: 0, reopened: 0, unresolved: 0, noInfobox: 0, untouched: 0 };
for (const p of moved) {
  const rows = career.get(p.id);
  const spells = (CAREERS.p[p.id] || []).map(([i, a, b]) => [CAREERS.c[i], a, b]);
  const m = { name: p.name, was: was.get(p.id) || null, now: now.get(p.id) || null,
    source: titleOf.get(p.id) || null, close: [], add: [], reopen: [], unresolved: [] };
  moves[p.id] = m;
  if (!rows || !rows.length) { m.unresolved.push('no senior career in an infobox'); tally.noInfobox++; continue; }

  // Clubs the infobox says he is at today. Usually one; two when on loan.
  const openNow = rows.filter((r) => r.end === null && r.qid);
  const squadQid = m.now ? QIDS[m.now].qid : null;

  for (const [name, start, end] of spells) {
    if (end != null) continue;
    const q = spellQid(p.id, name);
    if (!q) { m.unresolved.push(`open spell at "${name}": the name maps to no single club`); continue; }
    // The same club is the same Wikidata id, or the same spelling in the
    // career table: similarity() compares the strings, and Wikidata sometimes
    // links a spell to a second entity that carries the club's name.
    const same = (r) => r.qid === q || spelling(r.qid) === name;
    if (openNow.some(same) || q === squadQid) continue;          // still there
    const there = rows.filter((r) => same(r) && r.end != null);
    if (!there.length) { m.unresolved.push(`open spell at "${name}": not in the infobox's senior career`); continue; }
    // The stint this spell is: the one that starts nearest it. A player with
    // two stints at a club has two closed rows, and the later is not always it.
    const stint = start == null ? there[there.length - 1]
      : there.reduce((a, b) => (Math.abs((b.start ?? 0) - start) < Math.abs((a.start ?? 0) - start) ? b : a));
    if (start != null && stint.end < start) { m.unresolved.push(`open spell at "${name}" from ${start}: the infobox ends it in ${stint.end}`); continue; }
    m.close.push([name, start, stint.end]);
  }

  // The club he is at now: the squad if he is in one, else the infobox's open
  // row that is not a loan's parent (the last open row is the current one).
  const current = squadQid ? (openNow.find((r) => r.qid === squadQid) || { qid: squadQid, start: null, end: null })
    : openNow[openNow.length - 1] || null;
  for (const r of squadQid ? [current] : openNow) {
    const name = spelling(r.qid);
    if (!name) { m.unresolved.push(`current club ${r.title || r.qid}: no name for it`); continue; }
    const has = spells.some(([n, , e]) => e == null && (n === name || spellQid(p.id, n) === r.qid));
    if (has) continue;
    if (r.start == null) { m.unresolved.push(`at ${name} now, but the infobox gives no start year`); continue; }
    // A closed spell with the same start is this spell, wrongly ended. Adding a
    // second one would count the club twice, so the end date is what changes.
    const ended = spells.find(([n, a, e]) => e != null && a === r.start && (n === name || spellQid(p.id, n) === r.qid));
    if (ended) m.reopen.push([ended[0], ended[1], ended[2]]);
    else m.add.push([name, r.start, null]);
  }

  tally.closed += m.close.length; tally.added += m.add.length; tally.reopened += m.reopen.length; tally.unresolved += m.unresolved.length;
  if (!m.close.length && !m.add.length && !m.reopen.length) tally.untouched++;
}

// A correction recorded by an earlier refresh still holds for a player this
// refresh did not touch, and a pool rebuild would wipe it from the careers.
let carried = 0;
for (const [id, m] of Object.entries(PRIOR.moves || {})) if (!moves[id]) { moves[id] = m; carried++; }

writeFileSync(OUT, JSON.stringify({ checked: new Date().toISOString().slice(0, 10), moves }, null, 1));
console.log(`wrote ${OUT} — ${Object.keys(moves).length} players (${carried} carried over from the last refresh)`);
console.log(`  spells closed ${tally.closed} · current spells added ${tally.added} · re-opened ${tally.reopened} · players needing nothing ${tally.untouched}`);
console.log(`  left as they were, listed under "unresolved": ${tally.unresolved} · no infobox career: ${tally.noInfobox}`);
