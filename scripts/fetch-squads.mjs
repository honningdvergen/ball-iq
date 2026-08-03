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

import { writeFileSync, mkdirSync } from 'fs';
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
function slotFor(pos) {
  if (!pos) return null;
  if (pos.includes('goalkeep')) return 'GK';
  if (/back|defender|sweeper/.test(pos)) return 'DF';
  if (/midfield/.test(pos)) return 'MF';
  if (/forward|striker|winger/.test(pos)) return 'FW';
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
SELECT ?player ?playerLabel ?positionLabel ?start WHERE {
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
    const cur = byPlayer.get(id);
    const rank = POSITION_RANK.indexOf(pos);
    const score = rank === -1 ? 999 : rank;
    if (!cur || score < cur.score) byPlayer.set(id, { id, name, pos, score });
  }
  return [...byPlayer.values()]
    .map(({ id, name, pos }) => ({ id, name, position: pos || null, slot: slotFor(pos) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// All 72 club packs, resolved to Wikidata QIDs by scripts/_qids.mjs. Resolving
// by exact label found only 13 of 72 (Wikidata says "Liverpool F.C.", we say
// "Liverpool"); the search API plus a "really is a football club" check found
// 70, and the last two — Barcelona and Valencia — lose to their own CITY on
// any name search and were confirmed by hand.
const { default: QIDS } = await import('./_club-qids.json', { with: { type: 'json' } });
const CLUBS = Object.entries(QIDS).map(([club, v]) => ({ club, qid: v.qid }));

const out = {};
const report = [];
for (const c of CLUBS) {
  const { rows, error } = await query(c.qid);
  if (error) { report.push(`  ✗ ${c.club}: ${error}`); continue; }
  const squad = collapse(rows);
  out[c.club] = squad;
  const withSlot = squad.filter((p) => p.slot).length;
  // A real squad is ~20-35. Anything far outside that means the filters let
  // history back in (or the club's data is too thin), and it must NOT be
  // silently shipped — a lineup builder showing a retired player is exactly
  // the error a user cannot detect.
  const sane = squad.length >= 14 && squad.length <= 45;
  out[c.club] = sane ? squad : undefined;
  if (!sane) delete out[c.club];
  report.push(`  ${sane ? '✓' : '⚠️ REJECTED'} ${c.club.padEnd(14)} ${String(squad.length).padStart(3)} players, ${withSlot} with a usable slot`);
  await new Promise((r) => setTimeout(r, 1200)); // be a good citizen
}

mkdirSync(resolve('src/data'), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(report.join('\n'));
console.log(`\nwrote ${OUT} — ${Object.keys(out).length} clubs`);
