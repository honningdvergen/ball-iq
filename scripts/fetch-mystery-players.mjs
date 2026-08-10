// fetch-mystery-players.mjs — build the Mystery Player population from
// Wikidata, by FAME rather than by current club membership.
//
//   node scripts/fetch-mystery-players.mjs
//
// ⚠️ WHY THE OLD POOL WAS UNPLAYABLE. It came from squads.json — a snapshot of
// the CURRENT squads of 68 clubs. That structurally excludes every retired
// player, so the game refused Ronaldo, Messi, Zidane, Modrić and Salah as
// guesses while happily choosing Aaron Collins of Wolves as an answer. Right
// scoring metric, wrong population.
//
// FAME = number of Wikipedia language editions. It is boring, robust and
// already used by the schedule generator: Mbappé 133, Aaron Collins 5.
//
// ⚠️ TWO WIKIDATA TRAPS THIS FILE IS BUILT AROUND (both have bitten before):
//  1. `wdt:` is the TRUTHY prefix — it returns preferred-rank statements, not
//     all of them. For CAREER CLUBS we want every membership a player ever
//     had, so careers use the full `p:P54 / ps:P54` path. Using wdt: here
//     would silently drop most of a career.
//  2. Labels are user-editable and get vandalised (Bellingham once shipped to
//     our store binary as "Belligoal"). Names are sanity-checked below.
//  3. ⚠️ MANY PLAYERS HAVE NO ENGLISH LABEL. Wikidata is migrating personal
//     names — identical across Latin-script languages — to the `mul`
//     (multilingual) language code. Luka Modrić has 112 sitelinks, 59 label
//     languages, and NO `en` label. Asking the label service for "en" alone
//     returns the bare Q-id, so a reasonable-looking "drop anything that is
//     still a Q-id" rule silently deleted him. Request "en,mul".
//     The failure mode is the dangerous part: it looks like the player does
//     not exist, not like the label is stored elsewhere.
import { writeFileSync, readFileSync, existsSync } from 'fs';

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
      // ⚠️ A TIMED-OUT QUERY RETURNS HTTP 200 WITH A TRUNCATED BODY, then the
      // endpoint appends its own query echo ("SPARQL-QUERY: queryStr=") to the
      // half-written JSON. So a 200 does NOT mean success and JSON.parse
      // failing does NOT mean the network broke — it means the band was too
      // big. Distinguish the two, because the fix is different: retry vs split.
      if (text.includes('SPARQL-QUERY: queryStr=') || !text.trimEnd().endsWith('}')) {
        const e = new Error('TRUNCATED'); e.truncated = true; throw e;
      }
      return JSON.parse(text).results.bindings;
    } catch (e) {
      if (e.truncated) throw e;                      // splitting is the cure, not retrying
      console.error(`  ! ${label} attempt ${attempt}: ${e.message}`);
      if (attempt === 3) throw e;
      await new Promise((res) => setTimeout(res, 4000 * attempt));
    }
  }
}

// Fetch a sitelink band, halving it whenever the endpoint truncates. Recursion
// bottoms out at a single sitelink value, which is then paged with LIMIT/OFFSET.
async function fetchBand(lo, hi, sink, depth = 0) {
  const pad = '  '.repeat(depth + 1);
  try {
    const rows = await sparql(core(lo, hi), `${lo}-${hi}`);
    rows.forEach(sink);
    console.log(`${pad}band ${lo}-${hi} → ${rows.length} rows`);
    return;
  } catch (e) {
    if (!e.truncated) throw e;
  }
  if (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    console.log(`${pad}band ${lo}-${hi} truncated → splitting`);
    await fetchBand(mid + 1, hi, sink, depth + 1);
    await fetchBand(lo, mid, sink, depth + 1);
    return;
  }
  // Single value, still too big: page it.
  for (let off = 0; ; off += 2000) {
    const rows = await sparql(core(lo, hi) + ` LIMIT 2000 OFFSET ${off}`, `${lo} @${off}`);
    rows.forEach(sink);
    console.log(`${pad}band ${lo} offset ${off} → ${rows.length} rows`);
    if (rows.length < 2000) break;
  }
}

// ⚠️ BAND BY SITELINKS, DO NOT ASK FOR ALL 9,385 AT ONCE. The endpoint has a
// 60s budget; one unbanded query with three OPTIONAL joins times out and
// returns NOTHING, which looks identical to "no such players".
const BANDS = [[200, 9999], [120, 199], [90, 119], [70, 89], [55, 69], [45, 54], [38, 44], [33, 37], [29, 32], [25, 28]];

const core = (lo, hi) => `
SELECT ?p ?pLabel ?fame ?born ?natLabel ?posLabel WHERE {
  ?p wdt:P106 wd:Q937857 ; wikibase:sitelinks ?fame .
  FILTER(?fame >= ${lo} && ?fame <= ${hi})
  OPTIONAL { ?p wdt:P569 ?dob . BIND(YEAR(?dob) AS ?born) }
  OPTIONAL { ?p wdt:P27 ?nat }
  OPTIONAL { ?p wdt:P413 ?pos }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }
}`;

const players = new Map();
const sink = (b) => {
  const id = b.p.value.split('/').pop();
  const nat = b.natLabel?.value, pos = b.posLabel?.value;
  const prev = players.get(id);
  if (prev) { // multiple citizenships / positions arrive as extra rows
    if (nat && !prev.nats.includes(nat)) prev.nats.push(nat);
    if (pos && !prev.poss.includes(pos)) prev.poss.push(pos);
    return;
  }
  players.set(id, {
    id, name: b.pLabel?.value || '', fame: +b.fame.value,
    born: b.born ? +b.born.value : null,
    nats: nat ? [nat] : [], poss: pos ? [pos] : [],
  });
};

for (const [lo, hi] of BANDS) {
  await fetchBand(lo, hi, sink);
  console.log(`  running total ${players.size}`);
}

// ⚠️ A LABEL THAT IS STILL A Q-ID MEANS NO ENGLISH LABEL EXISTS — dropping
// those beats shipping "Q1234567" as a guessable name.
let dropped = 0;
for (const [id, p] of players) {
  if (!p.name || /^Q\d+$/.test(p.name)) { players.delete(id); dropped++; }
}

const out = [...players.values()].sort((a, b) => b.fame - a.fame);
writeFileSync('scripts/_mystery-core.json', JSON.stringify(out));
console.log(`\ncore players: ${out.length}  (dropped ${dropped} with no English label)`);
console.log(`with birth year: ${out.filter((p) => p.born).length}`);
console.log(`with nationality: ${out.filter((p) => p.nats.length).length}`);
console.log(`with position:    ${out.filter((p) => p.poss.length).length}`);
console.log('\ntop 12 by fame:');
out.slice(0, 12).forEach((p) => console.log(`  ${String(p.fame).padStart(4)}  ${p.name}`));

// The names Alex could not guess. If any are still missing the pool is wrong.
const CHECK = ['Cristiano Ronaldo', 'Lionel Messi', 'Zinedine Zidane', 'Ronaldinho',
  'Luka Modrić', 'Mohamed Salah', 'Kylian Mbappé', 'Thierry Henry', 'Vinícius Júnior', 'Ronaldo'];
const have = new Set(out.map((p) => p.name));
console.log('\nsanity — the players the old pool refused:');
for (const n of CHECK) console.log(`  ${have.has(n) ? '✓' : '✗ MISSING'}  ${n}`);
