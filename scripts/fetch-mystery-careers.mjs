// fetch-mystery-careers.mjs — every club membership for the fame-ranked pool.
//
//   node scripts/fetch-mystery-careers.mjs      (needs _mystery-core.json first)
//
// Careers do two jobs, and the second is the one that saves the game:
//
//  1. SIMILARITY. "Clubs both players have EVER been at" is the term that makes
//     a Contexto-style ranking feel fair. Without it the ordering is four
//     booleans and hundreds of players tie.
//  2. FILTERING OUT NON-FOOTBALLERS. Fame is football-blind: Albert Camus (205
//     wikis), Niels Bohr (186) and Sean Connery (144) all carry
//     `P106 = association football player` and outrank Pelé. Ranked by raw
//     fame, Camus becomes a daily football answer. A real answer-pool player
//     has a CAREER; Camus has one amateur club. Career length is the honest
//     discriminator — no name blacklist required, which matters because a
//     blacklist only ever catches the examples you already thought of.
//
// ⚠️ EVERY SPELL, NOT ONE PER CLUB (16 Oct 2026). The sink kept the first
// statement per club and dropped the rest, so a second stint never reached the
// game: Buffon without Juventus 2001-18, Henry without Arsenal 1999-2007,
// Cristiano Ronaldo without Manchester United 2021-22. Statements are now
// collected by statement id and turned into spells by spellsFromStatements()
// (scripts/lib/mystery-spells.mjs), which also pairs the two stints some
// editors put on ONE statement — the cause of spells that ended before they
// started. The resumable partial file was renamed for the same reason: the old
// one holds one-spell-per-club careers and must not be resumed.
//
//   node scripts/fetch-mystery-careers.mjs --ids=Q68060,Q45901
//       fetch only these players and write scripts/_mystery-careers.sample.json
//       (or --out=FILE); the full run's files are not touched.
//
// ⚠️ AFTER A FULL RUN, DO NOT REBUILD THE POOL TO SHIP THE NEW SPELLS.
// build-mystery-pool-v2.mjs also rewrites mysteryPool.json and
// mysteryAnswers.json, and the careers file has been edited since it was built.
// Lay the new stints over the shipped careers with
//   node scripts/merge-mystery-spells.mjs scripts/_mystery-careers.json
//
// ⚠️ USES p:P54 / ps:P54, NOT wdt:P54. `wdt:` is the TRUTHY prefix — preferred
// rank only — which for a career means roughly the current club and nothing
// else. The qualifiers (start/end) only exist on the statement node anyway.
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { statementCollector, spellsFromStatements } from './lib/mystery-spells.mjs';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const ONLY = arg('ids') ? arg('ids').split(',').map((x) => x.trim()).filter(Boolean) : null;
const OUT = arg('out') || (ONLY ? 'scripts/_mystery-careers.sample.json' : 'scripts/_mystery-careers.json');

const EP = 'https://query.wikidata.org/sparql';
const UA = 'BallIQ/1.0 (https://balliq.app; football quiz pool build)';

async function sparql(query, label) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(`${EP}?query=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
        signal: AbortSignal.timeout(180000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      // A timed-out query returns 200 with a truncated body plus a query echo.
      if (text.includes('SPARQL-QUERY: queryStr=') || !text.trimEnd().endsWith('}')) {
        const e = new Error('TRUNCATED'); e.truncated = true; throw e;
      }
      return JSON.parse(text).results.bindings;
    } catch (e) {
      if (e.truncated) throw e;
      console.error(`  ! ${label} attempt ${attempt}: ${e.message}`);
      if (attempt === 3) throw e;
      await new Promise((res) => setTimeout(res, 4000 * attempt));
    }
  }
}

async function fetchBand(lo, hi, q, sink, depth = 0) {
  const pad = '  '.repeat(depth + 1);
  try {
    const rows = await sparql(q(lo, hi), `${lo}-${hi}`);
    rows.forEach(sink);
    console.log(`${pad}${lo}-${hi} → ${rows.length} rows`);
    return;
  } catch (e) { if (!e.truncated) throw e; }
  if (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    console.log(`${pad}${lo}-${hi} truncated → splitting`);
    await fetchBand(mid + 1, hi, q, sink, depth + 1);
    await fetchBand(lo, mid, q, sink, depth + 1);
    return;
  }
  for (let off = 0; ; off += 3000) {
    const rows = await sparql(q(lo, hi) + ` LIMIT 3000 OFFSET ${off}`, `${lo} @${off}`);
    rows.forEach(sink);
    console.log(`${pad}${lo} offset ${off} → ${rows.length} rows`);
    if (rows.length < 3000) break;
  }
}

// ⚠️ BIND THE PLAYERS EXPLICITLY — do NOT re-derive them from the fame band.
// Written as `?p wdt:P106 … ; wikibase:sitelinks ?fame . FILTER(…) ?p p:P54 ?st`
// the planner starts from P54 — millions of statements — and 504s even on a
// band containing NINE players. VALUES pins the subject set first, which turns
// the same question into a bounded lookup.
const CORE = JSON.parse(readFileSync('scripts/_mystery-core.json', 'utf8'));
const careerQ = (ids) => `
SELECT ?p ?st ?club ?clubLabel ?start ?end WHERE {
  VALUES ?p { ${ids.map((i) => 'wd:' + i).join(' ')} }
  ?p p:P54 ?st . ?st ps:P54 ?club .
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?st pq:P582 ?end }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`;

// Rows are collected per STATEMENT and turned into spells once a player's
// rows are all in (spellsFromStatements). Keying on the club instead is what
// dropped every second stint.
const careers = new Map();
const clubIds = new Set();
const collector = statementCollector();
const sink = (b) => {
  const pid = b.p.value.split('/').pop();
  const cid = b.club.value.split('/').pop();
  clubIds.add(cid);
  collector.add(pid, { st: b.st?.value, club: cid, clubLabel: b.clubLabel?.value || cid,
    start: b.start?.value, end: b.end?.value });
};
const settle = (ids) => {
  for (const pid of ids) {
    const spells = spellsFromStatements(collector.statements(pid));
    if (spells.length) careers.set(pid, spells);
  }
};

// Recursive halving, same as the band fetcher: TRUNCATED means the request was
// too big, not that the network failed, so the cure is a smaller ask.
async function fetchChunk(ids, depth = 0) {
  try {
    (await sparql(careerQ(ids), `${ids.length} ids`)).forEach(sink);
    return;
  } catch (e) {
    if (!e.truncated || ids.length === 1) throw e;
  }
  const mid = Math.ceil(ids.length / 2);
  await fetchChunk(ids.slice(0, mid), depth + 1);
  await fetchChunk(ids.slice(mid), depth + 1);
}

// ⚠️ RESUMABLE. The first run died at 8,000 of 9,384 and threw all of it away.
// A partial file is written every chunk, so a re-run skips what is already
// fetched — this query costs ~40 minutes and must not be all-or-nothing.
const PART = 'scripts/_mystery-careers.v2.partial.json';
if (!ONLY && existsSync(PART)) {
  const prev = JSON.parse(readFileSync(PART, 'utf8'));
  for (const [pid, list] of Object.entries(prev)) {
    careers.set(pid, list);
    list.forEach((c) => clubIds.add(c.id));
  }
  console.log(`resuming — ${careers.size} players already fetched`);
}

const WANT = ONLY ? ONLY.map((id) => ({ id })) : CORE;
console.log(`── careers for ${WANT.length} players ──`);
const CHUNK = 200;
const todo = WANT.filter((p) => !careers.has(p.id));
console.log(`   ${todo.length} still to fetch`);
for (let i = 0; i < todo.length; i += CHUNK) {
  const ids = todo.slice(i, i + CHUNK).map((p) => p.id);
  await fetchChunk(ids);
  settle(ids);
  if (!ONLY) writeFileSync(PART, JSON.stringify(Object.fromEntries(careers)));
  process.stdout.write(`  ${Math.min(i + CHUNK, todo.length)}/${todo.length} · ${careers.size} with careers\r`);
}
console.log('');

// Classify each club ONCE rather than joining P31 into the career query, which
// multiplies every career row by the club's instance-of count.
// ⚠️ Filter on the CLASS, never on the label — "national team" appears in club
// names and label text is not a type system.
console.log(`\n── classifying ${clubIds.size} clubs ──`);
const ids = [...clubIds];
const clubType = new Map();
for (let i = 0; i < ids.length; i += 400) {
  const chunk = ids.slice(i, i + 400).map((id) => `wd:${id}`).join(' ');
  const rows = await sparql(`SELECT ?c ?t WHERE { VALUES ?c { ${chunk} } OPTIONAL { ?c wdt:P31 ?t } }`, `clubs ${i}`);
  for (const b of rows) {
    const c = b.c.value.split('/').pop();
    const t = b.t?.value.split('/').pop();
    const set = clubType.get(c) || new Set();
    if (t) set.add(t);
    clubType.set(c, set);
  }
  process.stdout.write(`  ${Math.min(i + 400, ids.length)}/${ids.length}\r`);
}

// Q6979593 national association football team · Q1194951 national under-21 ·
// Q22297308 women's national team · plus the youth/reserve classes.
const NATIONAL = new Set(['Q6979593', 'Q1194951', 'Q22297308', 'Q19541015', 'Q1478437', 'Q6979598']);
const isNational = (cid) => [...(clubType.get(cid) || [])].some((t) => NATIONAL.has(t));

const out = {};
let clubMemberships = 0, nationalDropped = 0;
for (const [pid, list] of careers) {
  const clubs = list.filter((c) => { if (isNational(c.id)) { nationalDropped++; return false; } return true; });
  if (clubs.length) { out[pid] = clubs; clubMemberships += clubs.length; }
}
writeFileSync(OUT, JSON.stringify(out));
console.log(`wrote ${OUT}`);

console.log(`\n\nplayers with a club career: ${Object.keys(out).length}`);
console.log(`club spells: ${clubMemberships}  ·  national-team rows dropped: ${nationalDropped}`);

// The discriminator, shown rather than asserted (distinct clubs, not spells).
if (!ONLY) {
const core = JSON.parse(readFileSync('scripts/_mystery-core.json', 'utf8'));
const byId = new Map(core.map((p) => [p.id, p]));
const n = (name) => { const p = core.find((x) => x.name === name); return p ? new Set((out[p.id] || []).map((c) => c.id)).size : '—'; };
console.log('\nclub count — the football/non-football split:');
for (const name of ['Lionel Messi', 'Cristiano Ronaldo', 'Pelé', 'Luka Modrić', 'Zinedine Zidane',
                    'Albert Camus', 'Niels Bohr', 'Sean Connery'])
  console.log(`  ${String(n(name)).padStart(2)} clubs   ${name}`);
}
