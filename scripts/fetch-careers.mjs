// Career histories for the Mystery Player pool -> src/data/mysteryCareers.json
//
// WHY. The game we are modelling ours on states its own algorithm: "attributes
// associated with the player such as nationality, TEAMS PLAYED FOR, age and
// position". Teams PLAYED FOR — plural, the whole career. Their worked example
// only makes sense with it: Rivaldo ranks 5 for Ronaldinho because both are
// Brazilian AND both played for Barcelona.
//
// Our similarity knew only the CURRENT club, so it would have scored that pair
// as strangers. A player who knows the genre would immediately feel ours was
// worse, which is exactly what Alex asked us to avoid.
//
// We already query P54 for the squads and discard everything historical. This
// keeps it: every club a pool player has ever been a member of.
import { writeFileSync } from 'fs';
const UA = 'BallIQ-squads/1.0 (https://balliq.app)';
const { default: pool } = await import('../src/data/mysteryPool.json', { with: { type: 'json' } });

const ids = pool.map((p) => p.id);
const BATCH = 120; // VALUES blocks much bigger than this start timing out
const careers = {};
let done = 0;

async function run(sparql, attempt = 1) {
  try {
    const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(sparql), {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
      signal: AbortSignal.timeout(60000),
    });
    if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status);
    if (!r.ok) return null;
    return (await r.json()).results.bindings;
  } catch (e) {
    if (attempt >= 4) return null;
    await new Promise((x) => setTimeout(x, attempt * 5000));
    return run(sparql, attempt + 1);
  }
}

for (let i = 0; i < ids.length; i += BATCH) {
  const slice = ids.slice(i, i + BATCH);
  const sparql = `
SELECT ?p ?teamLabel WHERE {
  VALUES ?p { ${slice.map((q) => 'wd:' + q).join(' ')} }
  ?p wdt:P54 ?team .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`;
  const rows = await run(sparql);
  if (!rows) { console.log(`  batch ${i / BATCH + 1}: FAILED`); continue; }
  for (const r of rows) {
    const id = r.p.value.split('/').pop();
    const team = r.teamLabel?.value;
    // Wikidata returns the bare Q-id when a team has no English label.
    if (!team || /^Q\d+$/.test(team)) continue;
    (careers[id] ||= new Set()).add(team);
  }
  done += slice.length;
  console.log(`  ${done}/${ids.length} players`);
  await new Promise((r) => setTimeout(r, 900));
}

const out = {};
for (const [id, set] of Object.entries(careers)) out[id] = [...set].sort();
writeFileSync('src/data/mysteryCareers.json', JSON.stringify(out));
const sizes = Object.values(out).map((v) => v.length);
console.log(`\nplayers with a career: ${Object.keys(out).length}/${ids.length}`);
console.log(`clubs per player: min ${Math.min(...sizes)} / median ${sizes.sort((a,b)=>a-b)[Math.floor(sizes.length/2)]} / max ${Math.max(...sizes)}`);
