// fetch-pool-nations.mjs — every SENIOR national team each Mystery pool player
// was a member of, with the years, straight from Wikidata P54.
//
//   node scripts/fetch-pool-nations.mjs            # resumes from the checkpoint
//   node scripts/fetch-pool-nations.mjs --refresh  # start again
//
// Output: scripts/_mystery-nations-raw.json
//   { teams: { teamQid: label }, p: { playerId: [[teamQid, from, to], …] } }
// A player with no senior national team is stored as [] so a re-run does not
// ask again; a batch that fails is NOT stored, so the next run retries it.
//
// ⚠️ WHY THIS AND NOT scripts/_mystery-careers.json. The careers file does hold
// national-team spells, but not all of them: Marta, Megan Rapinoe and Mia Hamm
// have none there, though `nat` (derive-pool-nationality.mjs, from the same P54
// statements) knows them. That script's cache (.cache/wikidata-careers-raw.json)
// is a gitignored local file and holds no years. This is the same property,
// P54 "member of sports team", restricted to the classes Wikidata uses for a
// national side:
//   Q135408445  men's national association football team
//   Q23905105   women's national association football team
//   Q6979593    national association football team (generic; see below)
// B, "A2", amateur, military and regional sides have other classes
// (Q45053817 secondary …); youth and Olympic sides that slip in on the generic
// class are dropped by their label. Same User-Agent and pauses as
// scripts/fetch-careers.mjs.
//
// ⚠️ A P54 MEMBERSHIP IS NOT PROOF OF A CAP. Wikidata files squad call-ups the
// same way as appearances, and holds no cap counts. The data cannot tell the
// two apart; the report says so.
import { writeFileSync, readFileSync, existsSync } from 'fs';

const UA = 'BallIQ-squads/1.0 (https://balliq.app)';
const OUT = 'scripts/_mystery-nations-raw.json';
const REFRESH = process.argv.includes('--refresh');
const BATCH = 100;
// Q6979593 "national association football team" is the generic class: some
// senior sides carry only it (Brazil women's, Marta's team), but so do many
// under-21 sides, so it is fetched and the LABEL decides in
// build-mystery-nations.mjs ("<Nation> … national football team" with no
// under-, youth or Olympic word).
const SENIOR_CLASSES = ['Q135408445', 'Q23905105', 'Q6979593'];

const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const store = !REFRESH && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { teams: {}, p: {} };

async function run(sparql, attempt = 1) {
  try {
    const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(sparql), {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
      signal: AbortSignal.timeout(60000),
    });
    // 429 is a request to slow down: back off as build-player-faces.mjs does
    // (15 s, 30 s, 45 s, 60 s) and stop the run if it keeps coming. 403 is a
    // block: stop at once. Either way the checkpoint keeps what is done.
    if (r.status === 403 || (r.status === 429 && attempt >= 4)) throw new Error(`blocked (HTTP ${r.status})`);
    if (r.status === 429) { await new Promise((x) => setTimeout(x, 15000 * attempt)); return run(sparql, attempt + 1); }
    const text = await r.text();
    // A timed-out query can answer 200 with a half-written body.
    if (!text.trimStart().startsWith('{') || !text.trimEnd().endsWith('}')) throw new Error('non-JSON or truncated (HTTP ' + r.status + ')');
    return JSON.parse(text).results.bindings;
  } catch (e) {
    if (/blocked/.test(e.message)) { console.log(`  ✗ ${e.message} — stopping; the checkpoint keeps what is done`); process.exit(2); }
    if (attempt >= 5) { console.log(`    ✗ ${e.message}`); return null; }
    await new Promise((x) => setTimeout(x, attempt * 5000));
    return run(sparql, attempt + 1);
  }
}

const year = (v) => (v ? Number(String(v).slice(0, 4)) : null);
const todo = pool.map((p) => p.id).filter((id) => !(id in store.p));
console.log(`${pool.length - todo.length} already fetched · ${todo.length} to fetch`);
let failed = 0;
for (let i = 0; i < todo.length; i += BATCH) {
  const slice = todo.slice(i, i + BATCH);
  const rows = await run(`
SELECT ?p ?team ?teamLabel ?start ?end WHERE {
  VALUES ?p { ${slice.map((q) => 'wd:' + q).join(' ')} }
  VALUES ?cls { ${SENIOR_CLASSES.map((c) => 'wd:' + c).join(' ')} }
  ?p p:P54 ?st .
  ?st ps:P54 ?team .
  ?team wdt:P31 ?cls .
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?st pq:P582 ?end }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`);
  if (!rows) { failed += slice.length; console.log(`  batch at ${i}: FAILED (will retry next run)`); continue; }
  const got = {};
  for (const r of rows) {
    const pid = r.p.value.split('/').pop();
    const tid = r.team.value.split('/').pop();
    store.teams[tid] = r.teamLabel?.value || tid;
    const spell = [tid, year(r.start?.value), year(r.end?.value)];
    const list = (got[pid] ||= []);
    if (!list.some((s) => s[0] === spell[0] && s[1] === spell[1] && s[2] === spell[2])) list.push(spell);
  }
  for (const id of slice) store.p[id] = got[id] || [];
  writeFileSync(OUT, JSON.stringify(store));
  console.log(`  ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
  await new Promise((r) => setTimeout(r, 900));
}
const withTeam = Object.values(store.p).filter((s) => s.length).length;
console.log(`players with a senior national team: ${withTeam} of ${Object.keys(store.p).length}; failed this run: ${failed}`);
