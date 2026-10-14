#!/usr/bin/env node
// The names Footle's hard mode accepts: every surname (and every other part of
// a name) of every footballer we know, plus every Footle answer.
//
//   node scripts/gen-footle-names.mjs      (runs in `npm run build`)
//
// Hard mode is opt-in (Alex, 14 Oct 2026): the default Footle accepts any
// letters on purpose, because a strict Footle was too hard for most players.
// Hard mode turns that into a badge: only a real footballer's name counts.
//
// Forgiving by design: ANY part of a name of four letters or more is a name
// ("Vinicius", "Junior", "Silva"), particles are joined to what follows
// ("van Dijk" -> VANDIJK, "De Bruyne" -> DEBRUYNE), and hyphenated names count
// joined and apart. A strict list that refused a real footballer would be the
// worst possible bug in a mode about knowing footballers.
import { readFileSync, writeFileSync } from 'node:fs';
import { WORDLE_PLAYERS, WORDLE_MANAGERS } from '../src/lib/wordle.js';
import { foldDigraphs } from '../src/lib/letterFold.js';

const OUT = 'src/data/footleNames.json';
const MIN = 4, MAX = 9;
const PARTICLES = new Set(['van', 'von', 'de', 'der', 'den', 'di', 'da', 'del', 'della', 'dos', 'das', 'do', 'du', 'la', 'le', 'el', 'al', 'ten', 'ter', 'mac', 'mc', 'st', 'lo']);
const clean = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/gi, 'o').replace(/æ/gi, 'ae').replace(/ß/g, 'ss').replace(/ł/gi, 'l').replace(/đ/gi, 'd');
const letters = (s) => clean(s).toUpperCase().replace(/[^A-Z]/g, '');

const raw = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const pool = Array.isArray(raw) ? raw : (raw.players || raw.pool || Object.values(raw)[0]);
const names = new Set();
const add = (w) => { const x = letters(w); if (x.length >= MIN && x.length <= MAX) names.add(x); };

for (const p of pool) {
  // Both plain spellings of an umlaut: Muller and Mueller, Ozil and Oezil.
  for (const part of String(p.name || '').split(/\s+/)) if (/[üöäøå]/i.test(part)) add(foldDigraphs(part));
  const parts = clean(String(p.name || '')).split(/\s+/).filter(Boolean);
  parts.forEach((part, i) => {
    add(part);
    if (part.includes('-')) part.split('-').forEach(add);
    if (PARTICLES.has(part.toLowerCase()) && parts[i + 1]) {
      add(part + parts[i + 1]);
      if (parts[i + 2] && PARTICLES.has(parts[i + 1].toLowerCase())) add(part + parts[i + 1] + parts[i + 2]);
    }
  });
}
for (const w of [...WORDLE_PLAYERS, ...WORDLE_MANAGERS]) add(w);

const list = [...names].sort();
const missing = WORDLE_PLAYERS.filter((w) => w.length >= MIN && w.length <= MAX && !names.has(w));
if (missing.length) { console.error(`[footle-names] answers missing from the list: ${missing.join(', ')}`); process.exit(1); }
writeFileSync(OUT, JSON.stringify(list) + '\n');
console.log(`[footle-names] wrote ${OUT}: ${list.length} names, ${MIN} to ${MAX} letters, every Footle answer included`);
