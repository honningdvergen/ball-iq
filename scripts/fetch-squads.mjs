// Snapshot current club squads from Wikidata -> src/data/squads.json
//
// This is the foundation for BOTH "Mystery Player" and the lineup builder.
// Neither is blocked on an algorithm; both were blocked on this data.
//
// WHY WIKIDATA AND NOT A SCRAPER
// The obvious sources (Transfermarkt above all) forbid scraping in their
// terms, so a core product feature would rest on something revocable, and an
// HTML scraper breaks silently whenever the source redesigns — which is this
// repo's signature failure mode. Wikidata is CC0, has a real query API, and
// is edited by humans DURING transfer windows, which is exactly the freshness
// property we need.
//
// ⚠️ TWO TRAPS, both found by running the queries rather than reading docs:
//
// 1. `wdt:P54` (member of sports team) returns EVERY membership a player has
//    ever had. A naive Arsenal query returns Tony Adams and Alan Ball. To get
//    a CURRENT squad you must query the statement node (p:P54 / ps:P54) and
//    exclude any membership carrying an end-date qualifier (pq:P582).
//
// 2. Players carry MULTIPLE position values — Tony Adams is both "centre-back"
//    and "defender". Un-deduplicated, one player becomes several rows and a
//    lineup builder would place him twice. POSITION_RANK below collapses them
//    to the most specific one.
//
// ⚠️⚠️ THIRD TRAP, found by RUNNING this and reading the output: the
// end-date filter alone is NOT enough. First run returned Arsenal 175,
// Liverpool 364, Real Madrid 303 — squads are ~25. The reason is that many
// historical memberships on Wikidata simply have no end date recorded, so
// "no end date" does not mean "still at the club"; it often means "nobody
// filled it in". A retired player looks current.
//
// This is NOT SHIP-READY until that is solved. Options, cheapest first:
//   a) require a start date (pq:P580) within the last ~12 years,
//   b) exclude anyone with a date of death (wdt:P570),
//   c) cross-check against squad size and drop clubs that come back absurd,
//   d) prefer the club's "current squad" statement where it exists.
// (a)+(b) will get most of the way; (c) is the guard that must exist
// regardless, because a lineup builder showing a retired player is exactly
// the unfalsifiable-to-the-user error the Trail spec warns about.
//
// ⚠️ The endpoint 502s under load. This snapshots to disk on purpose: nothing
// user-facing may ever depend on a live Wikidata request.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'BallIQ-squads/1.0 (https://balliq.app)';
const OUT = 'src/data/squads.json';

// Most specific wins. Anything unlisted keeps its raw label and sorts last —
// better an odd label than a silently dropped player.
const POSITION_RANK = [
  'goalkeeper',
  'centre-back', 'full-back', 'left-back', 'right-back', 'sweeper', 'wing-back',
  'defensive midfielder', 'central midfielder', 'attacking midfielder',
  'wide midfielder', 'left midfielder', 'right midfielder',
  'winger', 'left winger', 'right winger',
  'forward', 'centre-forward', 'striker', 'second striker',
  'midfielder', 'defender', // deliberately last: the vague catch-alls
];

const SLOT = { goalkeeper: 'GK', defender: 'DF', midfielder: 'MF', forward: 'FW' };
// ⚠️ THE VOCABULARY IS WIDER THAN THE OBVIOUS FOUR WORDS. Measured across 1,545
// squad players, 153 (10%) came back with no slot — and most were not missing a
// position, they had one this function did not recognise: 69 "wing half"
// (an old term for a midfielder), 6 "stopper", 3 "attacker", 2 "playmaker",
// 1 "centerhalf". An unslotted player is invisible to a lineup builder, so a
// vocabulary gap reads as a squad gap.
//
// ⚠️ ORDER MATTERS: "wing half" must be tested before /winger/ or a midfielder
// becomes a forward, and "half" before "back" for the same reason. Forward is
// tested before midfield because Wikidata gives some players the unordered pair
// ["midfielder","forward"] and testing midfield first mis-slots Messi and Pelé.
function slotFor(pos) {
  if (!pos) return null;
  const s = String(pos).toLowerCase();
  // 'shooting guard' is basketball — a real Wikidata error on a footballer's
  // item. Rejecting it beats putting a shooting guard at right-back.
  if (/shooting guard|point guard|pitcher|quarterback/.test(s)) return null;
  if (/goalkeep|keeper/.test(s)) return 'GK';
  if (/wing.?half|half.?back|midfield|playmaker|regista/.test(s)) return 'MF';
  if (/\bback\b|defend|sweeper|stopper|centre.?half|center.?half|libero/.test(s)) return 'DF';
  if (/forward|striker|winger|attacker/.test(s)) return 'FW';
  return null;
}

// Three filters, each earned by a wrong result rather than guessed:
//   1. no end-date qualifier  — excludes memberships explicitly finished
//   2. a start date, and recent — because MANY historical memberships simply
//      have no end date recorded, so filter 1 alone returned 175 Arsenal
//      "current" players including Tony Adams
//   3. not dead — a blunt but effective catch for the oldest rows
const SINCE = 2015;
const sparql = (qid) => `
SELECT ?player ?playerLabel ?positionLabel ?start ?natLabel ?dob WHERE {
  ?player p:P54 ?ms .
  ?ms ps:P54 wd:${qid} .
  FILTER NOT EXISTS { ?ms pq:P582 ?end }
  ?ms pq:P580 ?start .
  FILTER( YEAR(?start) >= ${SINCE} )
  FILTER NOT EXISTS { ?player wdt:P570 ?death }
  # SCOPE, not a value judgement: Wikidata files a club's men's and women's
  # teams under the SAME entity, so an unscoped Arsenal query returned
  # Josephine Henning and Melisa Filis (both Arsenal Women) alongside Saka and
  # Odegaard. Our club packs and quizzes are the men's first teams, so the
  # query has to say so. A women's product would want its own scoped query,
  # not this one loosened.
  ?player wdt:P21 wd:Q6581097 .
  OPTIONAL { ?player wdt:P413 ?position }
  # A guessing game needs ATTRIBUTES to compare. Club and position alone give
  # a player two bits of feedback per guess, which is not a game. Nationality
  # and age are the other two the "Who Are Ya?" format leans on, and both are
  # well populated on Wikidata for professional footballers.
  OPTIONAL { ?player wdt:P27 ?nat }
  OPTIONAL { ?player wdt:P569 ?dob }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`;

async function query(qid, attempt = 1) {
  const url = `${ENDPOINT}?query=${encodeURIComponent(sparql(qid))}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
      signal: AbortSignal.timeout(45000),
    });
    if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { rows: (await res.json()).results.bindings };
  } catch (e) {
    if (attempt >= 4) return { error: e.message || String(e) };
    // The endpoint 502s under load; back off rather than hammer it.
    await new Promise((r) => setTimeout(r, attempt * 4000));
    return query(qid, attempt + 1);
  }
}

function collapse(rows) {
  const byPlayer = new Map();
  for (const r of rows) {
    const id = r.player.value.split('/').pop();
    const name = r.playerLabel?.value || '';
    // Wikidata returns the raw Q-id as the label when no English label exists.
    if (!name || /^Q\d+$/.test(name)) continue;
    const pos = (r.positionLabel?.value || '').toLowerCase();
    const nat = r.natLabel?.value || null;
    // Keep the FULL birth date, not just the year. Mystery Player's similarity
    // ranking uses age as its tie-breaker, and a year-only value gives just
    // ~13 distinct levels — which produced 118 distinct scores across 1,539
    // players and a largest tie group of 86. Day-level precision makes the
    // age term effectively continuous and the ranking explicable.
    const dobFull = r.dob?.value ? String(r.dob.value).slice(0, 10) : null;
    const dob = dobFull ? Number(dobFull.slice(0, 4)) : null;
    const cur = byPlayer.get(id);
    const rank = POSITION_RANK.indexOf(pos);
    const score = rank === -1 ? 999 : rank;
    // Keep the most specific POSITION, but never lose a nationality or birth
    // year just because it rode in on a lower-ranked row.
    const started = r.start?.value ? String(r.start.value).slice(0, 10) : null;
    if (!cur || score < cur.score) byPlayer.set(id, { id, name, pos, score, nat: nat || cur?.nat || null, born: dob || cur?.born || null, dob: dobFull || cur?.dob || null, started: started || cur?.started || null });
    else {
      if (!cur.nat && nat) cur.nat = nat;
      if (!cur.born && dob) cur.born = dob;
      if (!cur.dob && dobFull) cur.dob = dobFull;
      if (started && (!cur.started || started > cur.started)) cur.started = started;
    }
  }
  return [...byPlayer.values()]
    .map(({ id, name, pos, nat, born, dob, started }) => ({ id, name, position: pos || null, slot: slotFor(pos), nat: nat || null, born: born || null, dob: dob || null, started: started || null }))
    // ⚠️ AGE FLOOR. Wikidata leaves plenty of old memberships open, so the
    // squads came back containing Ze Roberto (b. 1974) at Palmeiras and Steve
    // Harper (b. 1975) at Sunderland. A 52-year-old is not in a current squad.
    // 1988 allows a 38-year-old, which is rare but real (Modric, Pepe).
    .filter((p) => !p.born || p.born >= 1988)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// All 72 club packs, resolved to Wikidata QIDs by scripts/_qids.mjs. Resolving
// by exact label found only 13 of 72 (Wikidata says "Liverpool F.C.", we say
// "Liverpool"); the search API plus a "really is a football club" check found
// 70, and the last two — Barcelona and Valencia — lose to their own CITY on
// any name search and were confirmed by hand.
const { default: QIDS } = await import('./_club-qids.json', { with: { type: 'json' } });
const CLUBS = Object.entries(QIDS).map(([club, v]) => ({ club, qid: v.qid }));

const raw = {};
const report = [];
for (const c of CLUBS) {
  const { rows, error } = await query(c.qid);
  if (error) { report.push(`  ✗ ${c.club}: ${error}`); continue; }
  raw[c.club] = collapse(rows);
  await new Promise((r) => setTimeout(r, 1200)); // be a good citizen
}

// ⚠️⚠️⚠️ FOURTH TRAP — the per-club query CANNOT see this one, by construction.
// Every filter above is evaluated against a single club's memberships, so a
// spell that is stale only RELATIVE to another club survives all of them. Two
// real defects in the shipped snapshot, same root cause:
//
//   Carles Gil    — Aston Villa, started 2015-01-01, no end date. He left in
//                   2017. Nobody recorded the end, so it reads as current.
//   Alejandro Garnacho — appeared at BOTH Chelsea (2025-08-30) and Aston Villa
//                   (2026-07-23). The Villa move is real and recent; the
//                   Chelsea spell is the one nobody closed.
//
// The honest test is not "does this spell have an end date" but "has this
// player started somewhere else SINCE". A membership is superseded by any
// later-starting membership, open or closed — closed ones matter just as much,
// because Gil's Deportivo and New England spells are exactly what proves the
// Villa row dead. That question needs every club at once, so it can only be
// asked here, after the per-club loop.
// ⚠️⚠️ AND THE TRAP INSIDE THE FIX: P54 IS NOT CLUBS-ONLY. National-team caps
// are recorded as P54 memberships too, so a naive "latest start wins" makes
// Saka's 2020 England call-up supersede his 2018 Arsenal spell. The first run
// of this pass deleted 537 rows, cut Arsenal to 18 and emptied Boca Juniors
// entirely — every Boca player is superseded by Argentina.
//
// So "club" has to be decided, and it is DERIVED rather than hardcoded: take
// the P31 classes of our own 72 known club QIDs and treat those classes as the
// definition. A hardcoded national-team class list has already gone stale here
// once (Q6979593 was silently replaced by Q135408445 and Argentina/Brazil/Italy
// sailed straight through the filter). Deriving from data cannot go stale that
// way, and misclassifying an unusual club merely leaves a player where he was —
// a conservative failure, not a destructive one.
async function runSparql(q, label) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(`${ENDPOINT}?query=${encodeURIComponent(q)}`, {
        headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
        signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const t = await r.text();
      if (t.includes('SPARQL-QUERY: queryStr=') || !t.trimEnd().endsWith('}')) throw new Error('TRUNCATED');
      return JSON.parse(t).results.bindings;
    } catch (e) {
      console.error(`  ! ${label} attempt ${a}: ${e.message}`);
      if (a === 4) throw e;
      await new Promise((r) => setTimeout(r, 4000 * a));
    }
  }
}

const CLUB_CLASSES = new Set();
for (const b of await runSparql(
  `SELECT ?t WHERE { VALUES ?c { ${CLUBS.map((c) => 'wd:' + c.qid).join(' ')} } ?c wdt:P31 ?t }`,
  'club classes')) CLUB_CLASSES.add(b.t.value.split('/').pop());
console.log(`\nclub classes derived from our own 72 QIDs: ${CLUB_CLASSES.size}`);

const ids = [...new Set(Object.values(raw).flat().map((p) => p.id))];
console.log(`cross-club supersede check over ${ids.length} players`);

// ⚠️ CACHE THE EXPENSIVE PASS. This query costs ~10 minutes; iterating on the
// supersede RULE must not cost ten minutes per attempt. Delete the file to refetch.
const MCACHE = '/tmp/squads-memberships-v2.json';
const teamIsClub = new Map();
const latest = new Map();                       // player -> {qid, start, open}
const mem = new Map();                          // player -> [{qid, start, open}], clubs only
const cached = existsSync(MCACHE) ? JSON.parse(readFileSync(MCACHE, 'utf8')) : null;
if (cached && cached.ids === ids.length) {
  for (const [k, v] of Object.entries(cached.teamIsClub)) teamIsClub.set(k, v);
  for (const [k, v] of Object.entries(cached.mem)) mem.set(k, v);
  console.log(`  (reused cached membership map from ${MCACHE})`);
}
for (let i = 0; cached?.ids !== ids.length && i < ids.length; i += 200) {
  const chunk = ids.slice(i, i + 200).map((id) => `wd:${id}`).join(' ');
  // VALUES pins the subject set first. Deriving the players inside the query
  // instead makes the planner start from P54 — millions of statements — and
  // it times out even on a handful of ids.
  // ?type rides along so a team is classified in the same pass, rather than in
  // a second query over an unbounded team set.
  const rows = await runSparql(`SELECT ?p ?c ?s ?e ?type WHERE { VALUES ?p { ${chunk} }
    ?p p:P54 ?st . ?st ps:P54 ?c .
    OPTIONAL { ?st pq:P580 ?s } OPTIONAL { ?st pq:P582 ?e }
    OPTIONAL { ?c wdt:P31 ?type } }`, `chunk ${i}`);

  for (const b of rows) {
    const c = b.c.value.split('/').pop();
    if (b.type && CLUB_CLASSES.has(b.type.value.split('/').pop())) teamIsClub.set(c, true);
    else if (!teamIsClub.has(c)) teamIsClub.set(c, false);
  }
  for (const b of rows) {
    if (!b.s) continue;                          // undated spells cannot be ranked
    const c = b.c.value.split('/').pop();
    if (!teamIsClub.get(c)) continue;            // national teams do not supersede a club
    const p = b.p.value.split('/').pop();
    if (!mem.has(p)) mem.set(p, []);
    mem.get(p).push({ qid: c, start: b.s.value.slice(0, 10), open: !b.e });
  }
  process.stdout.write(`  ${Math.min(i + 200, ids.length)}/${ids.length}\r`);
}
if (cached?.ids !== ids.length) writeFileSync(MCACHE, JSON.stringify({
  ids: ids.length, teamIsClub: Object.fromEntries(teamIsClub), mem: Object.fromEntries(mem) }));

// ⚠️⚠️ ONLY AN OPEN SPELL CAN SUPERSEDE — the loan trap. Ranking by start date
// across ALL spells dropped William Saliba from Arsenal, Harvey Elliott, Conor
// Bradley, Mamardashvili and Tsimikas from Liverpool: each has a LOAN that
// post-dates his signing, so the loan won. But a loan that has ENDED is proof
// he came back, not proof he left. Closed spells therefore rank nothing; they
// are ignored entirely, and a player with no open spell anywhere is left where
// he is (conservative — keeping a stale row beats deleting a real player).
// This still catches both cases the pass exists for: Carles Gil's New England
// spell is open and starts 2019, beating his unclosed 2015 Villa row, and
// Garnacho's open Villa spell (2026) beats his open Chelsea one (2025).
for (const [p, list] of mem) {
  const open = list.filter((m) => m.open);
  if (!open.length) continue;
  latest.set(p, open.reduce((a, b) => (b.start > a.start ? b : a)));
}
console.log(`\nteams seen: ${teamIsClub.size} · classified as clubs: ${[...teamIsClub.values()].filter(Boolean).length}`);

const rawBackup = JSON.parse(JSON.stringify(raw));
const rawCount = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.length]));
// A dropped ROW is not a dropped PLAYER. Most of what this pass removes is a
// player listed at two clubs at once, where deleting one row is the entire
// point. Counting rows alone cannot tell a healthy dedup from a destructive
// bug, so the two are counted separately and the guard reads the one that
// matters: players who end up at NO club.
const playersBefore = new Set(Object.values(raw).flat().map((p) => p.id));
const qidOf = new Map(CLUBS.map((c) => [c.club, c.qid]));
let superseded = 0, retired = 0;
for (const [club, squad] of Object.entries(raw)) {
  raw[club] = squad.filter((p) => {
    const L = latest.get(p.id);
    if (!L) return true;                         // no dated spell anywhere: leave alone
    // Their most recent move was somewhere else — this row is history.
    if (L.qid !== qidOf.get(club)) { superseded++; return false; }
    // Their most recent spell is at THIS club but has an end date: they left
    // and did not sign anywhere Wikidata knows about. Not a current squad member.
    if (!L.open) { retired++; return false; }   // unreachable: only open spells rank
    return true;
  });
}
console.log(`dropped ${superseded} superseded rows + ${retired} whose latest spell has ended`);

// ⚠️ ABORT GUARD. The first version of this pass silently removed 30% of every
// squad because national-team caps counted as transfers — and it reported a
// clean run while doing it. A pruning step must never be able to quietly gut
// the dataset: if it takes more than a fifth, that is a bug in the rule, not a
// discovery about football. Refusing to write beats writing something plausible.
const before = Object.values(rawCount).reduce((a, b) => a + b, 0);
const after = Object.values(raw).flat().length;
const playersAfter = new Set(Object.values(raw).flat().map((p) => p.id));
const lost = [...playersBefore].filter((id) => !playersAfter.has(id));
console.log(`prune: ${before} -> ${after} rows (${(100 * (1 - after / before)).toFixed(1)}%)`);
console.log(`  duplicate rows resolved: ${before - after - lost.length}`);
console.log(`  players now at NO club:  ${lost.length} (${(100 * lost.length / playersBefore.size).toFixed(1)}%)`);

// Dump the evidence rather than describing it. A pruning rule that removes
// players must be judged on WHERE they went, and that is a sample you read,
// not a rate you reason about.
const nameOf = new Map(Object.values(raw).flat().concat(
  Object.entries(rawCount).flatMap(() => [])).map((p) => [p.id, p.name]));
const lostRows = lost.map((id) => {
  const L = latest.get(id);
  const from = Object.entries(rawCount).find(([c]) => (rawBackup[c] || []).some((p) => p.id === id))?.[0];
  const src = (rawBackup[from] || []).find((p) => p.id === id);
  return { id, name: src?.name || nameOf.get(id) || id, wasAt: from,
    nowAt: L ? L.qid : null, start: L?.start || null, open: L?.open ?? null };
});
writeFileSync('/tmp/squads-lost.json', JSON.stringify(lostRows, null, 2));
console.log(`  → wrote /tmp/squads-lost.json for inspection`);

// The guard reads PLAYERS LOST, not rows removed — most removals are a player
// listed at two clubs at once, where deleting one row is the whole point. The
// ceiling is CALIBRATED against measured runs rather than guessed:
//   18.4%  national-team caps counted as transfers   (bug — emptied Boca)
//   18.1%  ended loans counted as transfers          (bug — dropped Saliba)
//    9.9%  open-spell-only, verified by reading the sample: Ashley Fletcher
//          left Man United in 2016, Patrick Roberts and Marlos Moreno left
//          City, Marcelo Flores left Arsenal — real departures the old
//          snapshot was wrongly keeping.             (correct)
// 15% sits between the two failures and the good run. The evidence file is
// written on EVERY run, pass or fail: the rate is the alarm, but only the
// sample can tell a legitimate cleanup from a rule that is eating the dataset.
const lossRate = lost.length / playersBefore.size;
if (lossRate > 0.15) {
  console.error(`\n✗ ABORTED — ${(100 * lossRate).toFixed(1)}% of players ended up at no club, over the 15% ceiling.`);
  console.error(`  squads.json left untouched. Check the supersede rule before re-running.`);
  process.exit(1);
}

// ⚠️ The sanity gate runs AFTER pruning, not before. Pruning shrinks squads,
// so a gate applied to the raw numbers would pass a club that ends up too thin
// to build a lineup from.
const out = {};
for (const c of CLUBS) {
  const squad = raw[c.club];
  if (!squad) continue;
  const withSlot = squad.filter((p) => p.slot).length;
  // A real squad is ~20-35. Anything far outside that means the filters let
  // history back in (or the club's data is too thin), and it must NOT be
  // silently shipped — a lineup builder showing a retired player is exactly
  // the error a user cannot detect.
  const sane = squad.length >= 14 && squad.length <= 45;
  if (sane) out[c.club] = squad;
  report.push(`  ${sane ? '✓' : '⚠️ REJECTED'} ${c.club.padEnd(14)} ${String(squad.length).padStart(3)} players, ${withSlot} with a usable slot`);
}

mkdirSync(resolve('src/data'), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(report.join('\n'));
console.log(`\nwrote ${OUT} — ${Object.keys(out).length} clubs, ${Object.values(out).flat().length} players`);
