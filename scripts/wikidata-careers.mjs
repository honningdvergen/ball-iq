#!/usr/bin/env node
// wikidata-careers.mjs: a TRIAL. Reads a footballer's club career from
// Wikidata and prints the senior clubs in order. Nothing in the app reads it.
//
// WHY (8 Nov 2026). Transfer Trail careers in src/lib/trail.js are typed by
// hand and checked by agents against the web, one player at a time. This
// asks whether Wikidata's "member of sports team" (P54) with its start and
// end qualifiers (P580/P582) is good enough to draft or check them.
//
//   node scripts/wikidata-careers.mjs Q11571            # one player, printed
//   node scripts/wikidata-careers.mjs Q11571 Q1835 ...  # several
//   node scripts/wikidata-careers.mjs --json Q11571     # machine-readable
//
// Politeness: one request per second, and a User-Agent naming the project, as
// the Wikidata Query Service asks (https://meta.wikimedia.org/wiki/User-Agent_policy).
//
// What "senior" means here: national teams (by Wikidata class) and B / C /
// reserve / youth / U-xx sides (by name) are dropped, because Trail lists
// senior clubs only. Amateur boyhood clubs are not detectable and stay in.
// Loans are not marked in P54 consistently, so they come back as plain spells.

const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'BallIQ-wikidata-careers-trial/0.1 (https://balliq.app; Transfer Trail data check)';
const GAP_MS = 1000;

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const ids = args.filter((a) => /^Q\d+$/.test(a));
if (!ids.length) {
  console.error('usage: node scripts/wikidata-careers.mjs [--json] Q123 [Q456 ...]');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function query(qid) {
  return `
SELECT ?team ?teamLabel ?start ?end ?isNational WHERE {
  wd:${qid} p:P54 ?st .
  ?st ps:P54 ?team .
  OPTIONAL { ?st pq:P580 ?start }
  OPTIONAL { ?st pq:P582 ?end }
  BIND(EXISTS { ?team wdt:P31/wdt:P279* wd:Q6979593 } AS ?isNational)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

// Reserve, B/C and age-group sides, by name. Wikidata's classes cannot do this:
// a "youth" class filter tried first also matched FC Barcelona's first team.
// B / C / II only as a whole word, so "F.C." and "C.D." are not caught.
const NOT_SENIOR = /(^|\s)(B|C|II)(\s|$)|\b(U-?\d{2}|under-\d{2}|youth|academy|reserves?|juvenil|primavera|jong|castilla|amateurs?)\b|\bAtl[eè]tic$/i;

const year = (iso) => (iso ? Number(String(iso).slice(0, 4)) : null);

export async function careerOf(qid) {
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(query(qid))}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
  if (!res.ok) throw new Error(`${qid}: HTTP ${res.status}`);
  const rows = (await res.json()).results.bindings.map((b) => ({
    club: b.teamLabel?.value,
    from: year(b.start?.value),
    to: year(b.end?.value),
    national: b.isNational?.value === 'true',
  }));
  const senior = rows
    .filter((r) => !r.national && r.club && !NOT_SENIOR.test(r.club))
    // Undated spells sort last; ties keep the earlier end first.
    .sort((a, b) => (a.from ?? 9999) - (b.from ?? 9999) || (a.to ?? 9999) - (b.to ?? 9999));
  // One row per spell: the same club twice in a row (data split across two
  // statements) is merged.
  const spells = [];
  for (const r of senior) {
    const last = spells[spells.length - 1];
    if (last && last.club === r.club && (r.from == null || last.to == null || r.from <= last.to + 1)) {
      last.to = r.to ?? last.to;
    } else spells.push({ club: r.club, from: r.from, to: r.to });
  }
  return spells;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = {};
  for (const [i, qid] of ids.entries()) {
    if (i) await sleep(GAP_MS);
    try {
      out[qid] = await careerOf(qid);
    } catch (e) {
      out[qid] = { error: e.message };
    }
    if (!asJson) {
      const c = out[qid];
      console.log(`\n${qid}`);
      if (c.error) console.log(`  ✗ ${c.error}`);
      else for (const s of c) console.log(`  ${s.from ?? '?'}-${s.to ?? ''}  ${s.club}`);
    }
  }
  if (asJson) console.log(JSON.stringify(out, null, 2));
}
