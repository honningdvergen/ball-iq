// Notability score for each pool player -> merged into mysteryPool.json
//
// WHY. A daily puzzle whose answer nobody can name is not hard, it is broken.
// The pool holds 1,539 current players and most are squad filler.
//
// ⚠️ The first attempt matched pool names against our question bank and
// "found" 616 notable players — including Aaron Collins and Adam Lewis, whose
// SURNAMES merely collide with other footballers in the text. Loose matching
// again produced a confident wrong answer.
//
// Wikipedia sitelink count is the objective version: the number of language
// editions with an article about this person. It is the standard notability
// proxy, it is language-neutral, and nobody games it.
import { writeFileSync } from 'fs';
const UA = 'BallIQ-squads/1.0 (https://balliq.app)';
const { default: pool } = await import('../src/data/mysteryPool.json', { with: { type: 'json' } });

const BATCH = 150;
const fame = {};
async function run(sparql, n = 1) {
  try {
    const r = await fetch('https://query.wikidata.org/sparql?query=' + encodeURIComponent(sparql), {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
      signal: AbortSignal.timeout(60000),
    });
    if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status);
    if (!r.ok) return null;
    return (await r.json()).results.bindings;
  } catch (e) {
    if (n >= 4) return null;
    await new Promise((x) => setTimeout(x, n * 5000));
    return run(sparql, n + 1);
  }
}
for (let i = 0; i < pool.length; i += BATCH) {
  const slice = pool.slice(i, i + BATCH);
  const sparql = `
SELECT ?p (COUNT(DISTINCT ?site) AS ?n) WHERE {
  VALUES ?p { ${slice.map((x) => 'wd:' + x.id).join(' ')} }
  ?site schema:about ?p .
} GROUP BY ?p`;
  const rows = await run(sparql);
  if (!rows) { console.log(`  batch ${i / BATCH + 1} FAILED`); continue; }
  for (const r of rows) fame[r.p.value.split('/').pop()] = Number(r.n.value);
  console.log(`  ${Math.min(i + BATCH, pool.length)}/${pool.length}`);
  await new Promise((r) => setTimeout(r, 900));
}
const merged = pool.map((p) => ({ ...p, fame: fame[p.id] || 0 }));
writeFileSync('src/data/mysteryPool.json', JSON.stringify(merged));
const f = merged.map((p) => p.fame).sort((a, b) => b - a);
console.log(`\nfame scored: ${merged.filter((p) => p.fame > 0).length}/${merged.length}`);
console.log(`max ${f[0]} / p90 ${f[Math.floor(f.length * 0.1)]} / median ${f[Math.floor(f.length / 2)]} / min ${f[f.length - 1]}`);
console.log('\nmost famous:');
for (const p of [...merged].sort((a, b) => b.fame - a.fame).slice(0, 10)) console.log(`  ${String(p.fame).padStart(3)}  ${p.name} (${p.club})`);
