// apply-squads-wiki.mjs — turn the Wikipedia staging file into src/data/squads.json.
//
//   node scripts/fetch-squads-wiki.mjs     # refresh scripts/_squads-wiki.json first
//   node scripts/apply-squads-wiki.mjs           # report only, writes nothing
//   node scripts/apply-squads-wiki.mjs --write   # replace src/data/squads.json
//
// THE WHOLE REFRESH, in order. Each later step reads what the one before wrote:
//   1. fetch-squads-wiki.mjs                  today's first teams from Wikipedia
//   2. apply-squads-wiki.mjs --write          squads.json + _squads-departed.json
//   3. fetch-mystery-photos.mjs               photos for the new squad players
//   4. build-player-faces.mjs                 face boxes for those photos
//   5. relabel-pool-from-squads.mjs --write   Mystery pool labels and careers
//   6. fix-pool-names.mjs                     the curated corrections, last
//   7. build-lineup-data.mjs                  the lineup builder's payload
// then `npm run build`, which runs the pool and schedule audits.
//
// ⚠️ WHY THIS EXISTS. fetch-squads-wiki.mjs was written on 2026-08-10 because
// Wikidata's club memberships cannot say who is in a squad TODAY, and it writes
// a staging file "to replace squads.json once the diff is reviewed". Nothing
// ever did the replacing. Measured 2026-10-08, two months on: 820 of the 1,541
// rows in squads.json were players who had left (652 of them on a Wikidata
// spell begun 2015-2021 that nobody ever closed: Tuanzebe, Borthwick-Jackson
// and Joe Riley at Manchester United), and 1,117 current first-team players
// were missing, Courtois and Neuer among them. This is the missing step.
//
// THE RULE, per club:
//   1. Wikipedia's first-team section decides the first team. Everyone in it
//      with a Wikidata id is in; players out on loan are not in it and so are
//      not in the squad.
//   2. A row from the OLD file that is not in that section survives only if
//      the player's own Wikipedia page still names this club, or its reserve
//      side, as his current club. That keeps the academy and reserve depth the
//      lineup builder wants without keeping anyone who has gone.
//   3. An old row with no Wikipedia page cannot be checked. It survives only if
//      the spell we hold began in the last two years (an academy registration),
//      never on an older open spell.
//   4. NOT_IN_SQUAD and NEVER_AT_CLUB (scripts/_name-overrides.mjs) still apply.
//
// ⚠️ LEAVING A SQUAD IS NOT LEAVING FOOTBALL. 545 of the players the first run
// dropped were in no other file we hold, so dropping the row would have taken
// them out of the lineup builder's search altogether, and "a silently missing
// player reads as a broken product" (build-lineup-data.mjs). Every dropped row
// therefore moves to scripts/_squads-departed.json with the club his page
// names now, and the builder keeps him searchable there, outside any squad.
//
// ⚠️ THE SAME CLUBS, NO MORE. Only clubs already in squads.json are written. A
// pack club the 14-45 gate once rejected may well pass now; adding a club
// changes what the lineup builder offers and is a decision, not a refresh.
//
// ⚠️ A CLUB WHOSE WIKIPEDIA SECTION CAME BACK EMPTY IS NOT EMPTIED. That is a
// parser miss (three clubs, until the heading rules were fixed), so the club
// falls back to rule 2 alone and the run says so.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { NOT_IN_SQUAD, NEVER_AT_CLUB } from './_name-overrides.mjs';

const WRITE = process.argv.includes('--write');
const OUT = 'src/data/squads.json';
const DEPARTED = 'scripts/_squads-departed.json';
const UA = { 'User-Agent': 'BallIQ/1.0 (https://balliq.app; squad refresh)' };
const TODAY = new Date().toISOString().slice(0, 10);
const RECENT = `${Number(TODAY.slice(0, 4)) - 2}${TODAY.slice(4)}`;   // rule 3

const WIKI = JSON.parse(readFileSync('scripts/_squads-wiki.json', 'utf8'));
const OLD = JSON.parse(readFileSync(OUT, 'utf8'));
const QIDS = JSON.parse(readFileSync('scripts/_club-qids.json', 'utf8'));
const POOL = new Map(JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8')).map((p) => [p.id, p]));
const coreRaw = JSON.parse(readFileSync('scripts/_mystery-core.json', 'utf8'));
const CORE = new Map((Array.isArray(coreRaw) ? coreRaw : coreRaw.players).map((p) => [p.id, p]));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const batches = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
async function getJSON(url, label, init = {}) {
  for (let a = 1; a <= 5; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000), ...init });
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

const clubs = Object.keys(OLD);
const clubQid = Object.fromEntries(clubs.map((c) => [c, QIDS[c]?.qid || null]));
const oldRow = new Map();           // id -> { row, club }
for (const [club, squad] of Object.entries(OLD)) for (const p of squad) oldRow.set(p.id, { row: p, club });
const falseRow = (id, club) => NOT_IN_SQUAD[id] || NEVER_AT_CLUB[id]?.squad === club;

// ── 1. first team, from the staging file ────────────────────────────────────
const first = new Map(clubs.map((c) => [c, (WIKI[c] || []).filter((p) => p.qid && !falseRow(p.qid, c))]));
const unlinked = clubs.flatMap((c) => (WIKI[c] || []).filter((p) => !p.qid).map((p) => `${c}: ${p.display}`));
const empty = clubs.filter((c) => !(WIKI[c] || []).length);

// ── 2. what each doubtful player's own page says ────────────────────────────
// Doubtful = an old row not in its club's first team, or a player Wikipedia
// lists in two clubs' first teams at once.
const inFirst = new Map();          // id -> [clubs]
for (const [c, ps] of first) for (const p of ps) inFirst.set(p.qid, [...(inFirst.get(p.qid) || []), c]);
const twice = [...inFirst].filter(([, cs]) => new Set(cs).size > 1);
const leftover = clubs.flatMap((c) => OLD[c].filter((p) => !(inFirst.get(p.id) || []).includes(c) && !falseRow(p.id, c)).map((p) => ({ ...p, club: c })));
const doubtful = [...new Set([...leftover.map((p) => p.id), ...twice.map(([id]) => id)])];

const article = {};                 // player id -> enwiki title
for (const b of batches(doubtful, 50)) {
  const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&props=sitelinks&sitefilter=enwiki&format=json&ids=' + b.join('|'), 'sitelinks');
  for (const [id, e] of Object.entries(j.entities || {})) article[id] = e?.sitelinks?.enwiki?.title || null;
  await sleep(250);
}
const current = {};                 // enwiki title -> raw `currentclub` value, '' when blank
for (const b of batches([...new Set(Object.values(article).filter(Boolean))], 40)) {
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&rvsection=0&format=json&formatversion=2&titles=' + encodeURIComponent(b.join('|')), 'infobox');
  const requested = {};
  for (const n of j.query?.normalized || []) requested[n.to] = n.from;
  for (const pg of j.query?.pages || []) {
    const wt = pg.revisions?.[0]?.slots?.main?.content || '';
    const m = wt.match(/\|[^\S\n]*currentclub[^\S\n]*=[^\S\n]*([^\n]*)/i);
    current[requested[pg.title] || pg.title] = m ? m[1].trim() : '';
  }
  await sleep(350);
}
const linkOf = (v) => (v || '').match(/\[\[([^\]|]+)/)?.[1]?.trim() || null;
const linked = {};                  // linked club article -> { qid, title after redirects }
for (const b of batches([...new Set(Object.values(current).map(linkOf).filter(Boolean))], 50)) {
  const j = await getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&format=json&formatversion=2&redirects=1&titles=' + encodeURIComponent(b.join('|')), 'club links');
  const red = {}, nrm = {}, by = {};
  for (const r of j.query?.redirects || []) red[r.from] = r.to;
  for (const n of j.query?.normalized || []) nrm[n.from] = n.to;
  for (const pg of j.query?.pages || []) by[pg.title] = pg.pageprops?.wikibase_item || null;
  for (const t of b) { let k = nrm[t] || t; k = red[k] || k; linked[t] = { qid: by[k] || null, title: k }; }
  await sleep(300);
}
const clubTitle = {};               // our club -> its enwiki title, for the reserve-side test
for (const b of batches(Object.values(clubQid).filter(Boolean), 50)) {
  const j = await getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&props=sitelinks&sitefilter=enwiki&format=json&ids=' + b.join('|'), 'club titles');
  for (const c of clubs) { const t = j.entities?.[clubQid[c]]?.sitelinks?.enwiki?.title; if (t) clubTitle[c] = t; }
}
// "Real Madrid Castilla", "Jong Ajax", "FC Bayern Munich II", "Arsenal F.C.
// Under-21s and Academy": a reserve side carries every distinctive word of the
// senior club's title. Legal-form tokens and short words are not distinctive.
const distinctive = (t) => t.replace(/\b(F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?|S\.?C\.?|A\.?C\.?|S\.?S\.?C?\.?|A\.?S\.?|R\.?S\.?C\.?|S\.?L\.?|J\.?K\.?|S\.?K\.?|K\.?V\.?|\d{4})\b/g, ' ')
  .replace(/[^\p{L} ]/gu, ' ').split(/\s+/).filter((w) => w.length > 3).map((w) => w.toLowerCase());
const stillAt = (id, club) => {
  const t = article[id];
  if (!t) return 'no-page';
  const v = current[t];
  const link = linkOf(v);
  if (!link) return 'no-club';                      // retired, released, or the field is blank
  const L = linked[link] || { qid: null, title: link };
  if (L.qid && L.qid === clubQid[club]) return 'here';
  const words = distinctive(clubTitle[club] || club);
  if (words.length && words.every((w) => L.title.toLowerCase().includes(w))) return 'reserves';
  return 'elsewhere';
};

// ── 3. assemble ─────────────────────────────────────────────────────────────
const WORD = { GK: 'goalkeeper', DF: 'defender', MF: 'midfielder', FW: 'forward' };
const tidyName = (s) => String(s || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
const fresh = [];                   // ids with no local record at all
const rowFor = (p, club) => {
  const had = oldRow.get(p.qid);
  const pool = POOL.get(p.qid);
  const core = CORE.get(p.qid);
  const slot = WORD[p.pos] ? p.pos : (had?.row.slot || pool?.slot || null);
  if (had) return { ...had.row, slot, started: had.club === club ? had.row.started : null };
  if (pool) return { id: p.qid, name: pool.name, position: pool.position || WORD[slot] || null, slot, nat: pool.nat || null, born: pool.born || null, dob: pool.dob || null, started: null };
  if (core) return { id: p.qid, name: core.name, position: (core.poss || [])[0] || WORD[slot] || null, slot, nat: (core.nats || [])[0] || null, born: core.born || null, dob: null, started: null };
  fresh.push(p.qid);
  return { id: p.qid, name: tidyName(p.display || p.article), position: WORD[slot] || null, slot, nat: null, born: null, dob: null, started: null };
};

const out = {};
const report = [];
const counts = { first: 0, keptHere: 0, keptReserves: 0, keptRecent: 0, droppedElsewhere: 0, droppedNoClub: 0, droppedOldNoPage: 0, twiceResolved: 0, twiceDropped: 0 };
const dropped = [];
const gone = [];                    // rows leaving the file, kept for the lineup builder
const nowAt = (id) => { const t = article[id]; const l = t ? linkOf(current[t]) : null; return l ? (linked[l]?.title || l) : null; };
for (const club of clubs) {
  const rows = new Map();
  for (const p of first.get(club)) {
    const also = (inFirst.get(p.qid) || []).filter((c) => c !== club);
    if (also.length) {
      // Listed in two first teams: his own page settles it, or he is in neither.
      const here = stillAt(p.qid, club);
      if (here !== 'here' && here !== 'reserves') { counts.twiceDropped++; dropped.push(`${club}: ${p.display} (also listed at ${also.join(', ')}; his page says ${here})`); continue; }
      counts.twiceResolved++;
    }
    rows.set(p.qid, rowFor(p, club)); counts.first++;
  }
  for (const p of OLD[club]) {
    if (rows.has(p.id) || falseRow(p.id, club)) continue;
    const at = stillAt(p.id, club);
    if (at === 'here') { rows.set(p.id, p); counts.keptHere++; }
    else if (at === 'reserves') { rows.set(p.id, p); counts.keptReserves++; }
    else if (at === 'no-page' && p.started && p.started >= RECENT) { rows.set(p.id, p); counts.keptRecent++; }
    else {
      counts[at === 'elsewhere' ? 'droppedElsewhere' : at === 'no-club' ? 'droppedNoClub' : 'droppedOldNoPage']++;
      dropped.push(`${club}: ${p.name} (${at === 'elsewhere' ? 'now ' + (nowAt(p.id) || '?') : at})`);
      gone.push({ ...p, started: null, was: club, now: at === 'elsewhere' ? nowAt(p.id) : null });
    }
  }
  const squad = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
  const sane = squad.length >= 14 && squad.length <= 45;
  const was = OLD[club].length, stay = squad.filter((p) => oldRow.get(p.id)?.club === club).length;
  report.push(`  ${sane ? '✓' : '✗ OUTSIDE 14-45'} ${club.padEnd(20)} ${String(was).padStart(2)} -> ${String(squad.length).padStart(2)}   stayed ${String(stay).padStart(2)} · joined ${String(squad.length - stay).padStart(2)} · left ${String(was - stay).padStart(2)}${empty.includes(club) ? '   ⚠️ no Wikipedia first team parsed: old rows only' : ''}`);
  if (!sane) { console.log(report.join('\n')); console.error(`\n✗ ${club} would have ${squad.length} players. Nothing written.`); process.exit(1); }
  out[club] = squad;
}

// ── 4. birth date and nationality wherever a row lacks one ──────────────────
// Wikidata is good at these two; it is only current membership it cannot tell.
// Citizenship first, as the rest of the file has it, then "country for sport".
const thin = [...new Set(Object.values(out).flat().filter((p) => !p.dob || !p.nat).map((p) => p.id))];
if (thin.length) {
  const facts = {};
  for (const b of batches(thin, 200)) {
    const q = `SELECT ?p ?dob ?natLabel ?sportLabel WHERE { VALUES ?p { ${b.map((id) => 'wd:' + id).join(' ')} }
      OPTIONAL { ?p wdt:P569 ?dob } OPTIONAL { ?p wdt:P27 ?nat } OPTIONAL { ?p wdt:P1532 ?sport }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". } }`;
    const j = await getJSON('https://query.wikidata.org/sparql', 'birth dates', { method: 'POST', body: new URLSearchParams({ query: q }),
      headers: { ...UA, Accept: 'application/sparql-results+json' } });
    const label = (x) => (x?.value && !/^Q\d+$/.test(x.value) ? x.value : null);
    for (const x of j.results.bindings) {
      const f = (facts[x.p.value.split('/').pop()] ??= {});
      if (x.dob?.value && /^\d{4}-\d\d-\d\d/.test(x.dob.value) && !f.dob) f.dob = x.dob.value.slice(0, 10);
      f.nat ??= label(x.natLabel);
      f.sport ??= label(x.sportLabel);
    }
    await sleep(600);
  }
  for (const squad of Object.values(out)) for (const p of squad) {
    const f = facts[p.id];
    if (!f) continue;
    if (!p.dob && f.dob && (!p.born || p.born === Number(f.dob.slice(0, 4)))) { p.dob = f.dob; p.born = Number(f.dob.slice(0, 4)); }
    if (!p.nat) p.nat = f.nat || f.sport || null;
  }
}

// ── 5. report, then write ───────────────────────────────────────────────────
const before = Object.values(OLD).flat().length, after = Object.values(out).flat().length;
console.log(report.join('\n'));
console.log(`\n${before} -> ${after} players across ${clubs.length} clubs`);
console.log(`  in a Wikipedia first team: ${counts.first}   (${fresh.length} of them new to every file we hold)`);
console.log(`  kept from the old file: ${counts.keptHere} whose page names the club, ${counts.keptReserves} its reserve side, ${counts.keptRecent} with no page but a spell begun since ${RECENT}`);
console.log(`  dropped from the old file: ${counts.droppedElsewhere} now elsewhere, ${counts.droppedNoClub} with no current club, ${counts.droppedOldNoPage} with no page and an old spell`);
console.log(`  listed in two first teams: ${counts.twiceResolved} settled by the player's page, ${counts.twiceDropped} left out of the club his page does not name`);
if (unlinked.length) console.log(`  first-team players with no Wikipedia page, so no id (not written): ${unlinked.length}`);
const twoClubs = Object.values(out).flat().map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i);
if (twoClubs.length) { console.error(`\n✗ ${twoClubs.length} player(s) ended up in two squads: ${twoClubs.join(', ')}. Nothing written.`); process.exit(1); }

mkdirSync('.cache', { recursive: true });
writeFileSync('.cache/squads-refresh-dropped.txt', dropped.join('\n') + '\n');
writeFileSync('.cache/squads-refresh-unlinked.txt', unlinked.join('\n') + '\n');
console.log('  → every dropped row, with where he is now: .cache/squads-refresh-dropped.txt');
// Departed players accumulate across refreshes; anyone back in a squad leaves the list.
const inSquadNow = new Set(Object.values(out).flat().map((p) => p.id));
const departed = new Map((existsSync(DEPARTED) ? JSON.parse(readFileSync(DEPARTED, 'utf8')) : []).map((p) => [p.id, p]));
for (const p of gone) departed.set(p.id, p);
for (const id of [...departed.keys()]) if (inSquadNow.has(id) || NOT_IN_SQUAD[id]) departed.delete(id);
console.log(`  departed players kept for the lineup builder: ${departed.size} (${gone.length} from this run)`);
if (!WRITE) { console.log('\n(report only: pass --write to replace src/data/squads.json)'); process.exit(0); }
writeFileSync(OUT, JSON.stringify(out, null, 2));
writeFileSync(DEPARTED, JSON.stringify([...departed.values()].sort((a, b) => a.name.localeCompare(b.name)), null, 1) + '\n');
console.log(`\nwrote ${OUT} and ${DEPARTED}`);
