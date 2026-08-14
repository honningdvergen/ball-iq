#!/usr/bin/env node
/**
 * Verify every Mystery Player answer is KNOWN FIRST AS A FOOTBALLER.
 *
 * WHY THIS EXISTS
 * Alex, 2026-08-14, after playing a real puzzle whose answer was Rafa Benitez:
 *   "it is important that the mystery player is always an actual footballer past
 *    or present. Some players go into management yes, but it is a bit misleading
 *    if some players had a way bigger career as a manager than as a player. Xavi,
 *    Xabi Alonso are examples of good mystery players — they are managers
 *    nowadays but known as great footballers. Alex Ferguson also played at a high
 *    level but everyone knows him as a manager, so he would not fit."
 * Then: "we can not have any bad outliers. we have to be bulletproof."
 *
 * WHY A HAND LIST WAS NOT ENOUGH
 * The first fix was a curated exclusion list built by grepping ~32 names I
 * happened to think of. That is not a method — it finds only what you already
 * suspect. Two non-footballers were sitting in the curated answer set the whole
 * time and both were caught by ACCIDENT: O. J. Simpson (American football) and
 * Julio Iglesias (the singer, a Real Madrid youth keeper before a car crash).
 * Iglesias surfaced only because the repair pass scheduled him — the fix
 * reproduced the bug it was fixing.
 *
 * WHY THESE SIGNALS
 * Three cheaper signals were tried and all fail:
 *   - fame: Ferguson scores 113, ABOVE Platini. Any threshold keeping Pele keeps him.
 *   - birth year: would delete Pele, Cruyff, Bobby Moore, van Basten.
 *   - P106 occupation alone: Benitez and Xavi BOTH carry player + manager.
 * The discriminator has to be career SCALE, which is exactly what Alex described.
 * So this reads Wikidata directly:
 *   P106  occupation      — must include association football player (Q937857)
 *   P54   member of team  — playing spells, with start/end qualifiers
 *   P6087 coach of team   — managing spells, same
 * and rejects anyone whose managing years exceed their playing years.
 *
 * WARNING. Wikidata caveats that have bitten this repo before: `wdt:` is
 * truthy-rank, not recency, and vandalism ships into our binaries. This uses the
 * entity API and reads qualifier dates directly rather than trusting a shortcut.
 *
 *   node scripts/verify-mystery-answers.mjs          # report only
 *   node scripts/verify-mystery-answers.mjs --write  # update mysteryExclusions.json
 */
import { readFileSync, writeFileSync } from 'fs';

const FOOTBALLER = 'Q937857';   // association football player
const MANAGER    = 'Q628099';   // association football manager
const API = 'https://www.wikidata.org/w/api.php';

const pool = JSON.parse(readFileSync(new URL('../src/data/mysteryPool.json', import.meta.url), 'utf8'));
const arr  = Array.isArray(pool) ? pool : Object.values(pool).flat();
const byId = new Map(arr.map((p) => [p.id, p]));
const answers = JSON.parse(readFileSync(new URL('../src/data/mysteryAnswers.json', import.meta.url), 'utf8'));
const ids = Array.isArray(answers) ? answers : Object.keys(answers);

const yearOf = (snak) => {
  const t = snak?.datavalue?.value?.time;
  if (!t) return null;
  const m = /^[+-](\d{4})/.exec(t);
  return m ? Number(m[1]) : null;
};

/** Distinct years covered by a set of spells — a set, not a sum, so overlapping
 *  loan spells cannot inflate a career length. */
function spanYears(claims, prop) {
  const years = new Set();
  for (const c of claims?.[prop] || []) {
    const q = c.qualifiers || {};
    const from = yearOf(q.P580?.[0]);
    if (from == null) continue;
    const to = yearOf(q.P582?.[0]) ?? from;
    for (let y = from; y <= to; y++) years.add(y);
  }
  return years.size;
}

const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const results = [];

for (const batch of chunk(ids, 50)) {
  const url = `${API}?action=wbgetentities&ids=${batch.join('|')}&props=claims&format=json`;
  // Wikidata rate-limits anonymous bursts: the first run took a 429 at 500/606.
  // Back off and retry rather than shipping a partial verdict — a half-checked
  // answer set is exactly the "bad outlier" this script exists to prevent.
  let res, attempt = 0;
  for (;;) {
    res = await fetch(url, { headers: { 'User-Agent': 'BallIQ-answer-verify/1.0 (contact: balliq.app)' } });
    if (res.ok) break;
    if (res.status !== 429 || attempt >= 5) {
      console.error(`\n  FAILED: Wikidata returned ${res.status} after ${attempt} retries — aborting rather than guessing`);
      process.exit(1);
    }
    attempt++;
    const wait = 2000 * attempt;
    process.stdout.write(`\r  rate-limited, waiting ${wait / 1000}s (retry ${attempt}/5)   `);
    await new Promise((r) => setTimeout(r, wait));
  }
  const { entities } = await res.json();
  await new Promise((r) => setTimeout(r, 400)); // be a good citizen between batches
  for (const id of batch) {
    const e = entities?.[id];
    const p = byId.get(id);
    if (!e || !p) continue;
    const occ = (e.claims?.P106 || []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
    results.push({
      id, name: p.name, fame: p.fame,
      isFootballer: occ.includes(FOOTBALLER),
      isManager: occ.includes(MANAGER),
      playedYears: spanYears(e.claims, 'P54'),
      coachedYears: spanYears(e.claims, 'P6087'),
    });
  }
  process.stdout.write(`\r  fetched ${results.length}/${ids.length}`);
}
process.stdout.write('\n\n');

const notFootballer = results.filter((r) => !r.isFootballer);
const managerFirst  = results.filter((r) => r.isFootballer && r.coachedYears > r.playedYears);
const undated       = results.filter((r) => r.isFootballer && r.playedYears === 0 && r.coachedYears === 0);

const line = (r) => `    fame ${String(r.fame).padStart(3)}  ${r.name.padEnd(26)} played ${String(r.playedYears).padStart(2)}y  coached ${String(r.coachedYears).padStart(2)}y`;

console.log(`  verified ${results.length} curated answers against Wikidata`);
console.log(`\n  NOT A FOOTBALLER (${notFootballer.length}):`);
notFootballer.forEach((r) => console.log(line(r)));
console.log(`\n  MANAGER FIRST — coached longer than they played (${managerFirst.length}):`);
managerFirst.sort((a, b) => b.fame - a.fame).forEach((r) => console.log(line(r)));
if (undated.length) {
  console.log(`\n  UNDATED — no spells either way, review by hand (${undated.length}):`);
  undated.sort((a, b) => b.fame - a.fame).slice(0, 25).forEach((r) => console.log(line(r)));
}

if (process.argv.includes('--write')) {
  const path = new URL('../src/data/mysteryExclusions.json', import.meta.url);
  const ex = JSON.parse(readFileSync(path, 'utf8'));
  const add = (list, names) => {
    for (const n of names) if (!list.includes(n)) list.push(n);
    list.sort();
  };
  add(ex.managers, managerFirst.map((r) => r.name));
  add(ex.notFootballers, notFootballer.map((r) => r.name));
  ex._verified = `Regenerated from Wikidata by scripts/verify-mystery-answers.mjs — ${results.length} answers checked, ${managerFirst.length} manager-first, ${notFootballer.length} not footballers.`;
  writeFileSync(path, JSON.stringify(ex, null, 2) + '\n');
  console.log(`\n  wrote ${managerFirst.length + notFootballer.length} exclusions to mysteryExclusions.json`);
} else {
  console.log('\n  (report only — pass --write to update mysteryExclusions.json)');
}
