// Rewrite `nat` in src/data/mysteryPool.json from NATIONAL-TEAM MEMBERSHIP
// rather than legal citizenship.
//
// ⚠️ RUN ORDER — this is a SECOND pass and the dependency is circular by
// nature:  fetch-squads -> build-mystery-pool -> fetch-careers -> THIS.
// fetch-careers reads the pool, and this reads fetch-careers' cache. Running
// it before the cache exists is a no-op that exits non-zero rather than
// silently leaving citizenship in place.
//
// WHY NOT P27 (citizenship), which is what fetch-squads used.
// A guessing game's "nationality" is who a player REPRESENTS, which is what a
// fan has in their head. Citizenship gets that wrong in three separate ways,
// all of them visible in the shipped pool:
//
//   1. There is no British football team, so every English, Scottish, Welsh
//      and Northern Irish player carried nat "United Kingdom" — 265 of them.
//      Two England internationals matched each other, but so did an England
//      and a Scotland player, which is not a signal a fan would accept.
//   2. Dual nationals got an ARBITRARY one of their P27 values. Achraf Hakimi
//      came back "Spain" and Ademola Lookman "United Kingdom"; they play for
//      Morocco and Nigeria. Rodrygo and Vinícius Júnior both came back
//      "Spain" — the single defect that started this investigation.
//   3. Wikidata's citizenship items carry legal names, so the win card read
//      "Kingdom of the Netherlands" and "Kingdom of Denmark".
//
// Senior caps win; youth caps are the fallback (a player in England's U21 is
// English for our purposes). Together that covers 74% of the pool.
//
// ⚠️ KNOWN RESIDUAL, stated rather than papered over: the ~400 uncapped
// players keep normalised citizenship, so an uncapped Englishman stays
// "United Kingdom" while a capped one becomes "England", and the two will not
// match each other on nationality. Splitting them needs place-of-birth (P19),
// which is another pass. It is tolerable because the schedule is fame-weighted
// and uncapped players are never the answer — they are only ever guesses.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const CACHE = '.cache/wikidata-careers-raw.json';
if (!existsSync(CACHE)) {
  console.error(`[nationality] ${CACHE} is missing — run scripts/fetch-careers.mjs first.`);
  process.exit(1);
}

const cache = JSON.parse(readFileSync(CACHE, 'utf8'));
const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));

const SENIOR = /^(.+?) (?:men's )?national (?:association )?football team$/i;
const YOUTH = /^(.+?) national under-\d+ (?:association )?football team$/i;

// Only for the uncapped fallback group. Legal names -> the name a fan uses.
const NORMALISE = {
  'Kingdom of the Netherlands': 'Netherlands',
  'Kingdom of Denmark': 'Denmark',
  'Democratic Republic of the Congo': 'DR Congo',
  'Republic of Ireland': 'Ireland',
};

function derive(id) {
  const teams = (cache.raw[id] || []).map((t) => cache.teamLabel[t]).filter(Boolean);

  const senior = teams.map((t) => t.match(SENIOR)).filter(Boolean).map((m) => m[1]);
  // A player can appear under more than one senior side after a switch of
  // allegiance. Prefer the shortest label, which is the plain country name
  // rather than a qualified variant.
  if (senior.length) return senior.sort((a, b) => a.length - b.length)[0];

  const youth = teams.map((t) => t.match(YOUTH)).filter(Boolean).map((m) => m[1]);
  if (youth.length) {
    // Most-capped youth nation wins — a player with one U17 cap for one
    // country and four for another belongs to the four.
    const count = {};
    youth.forEach((y) => { count[y] = (count[y] || 0) + 1; });
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  }
  return null;
}

let fromCaps = 0, normalised = 0, changed = 0, untouched = 0;
for (const p of pool) {
  const capped = derive(p.id);
  const next = capped || NORMALISE[p.nat] || p.nat;
  if (capped) fromCaps++;
  else if (NORMALISE[p.nat]) normalised++;
  else untouched++;
  if (next !== p.nat) changed++;
  p.nat = next;
}

writeFileSync('src/data/mysteryPool.json', JSON.stringify(pool, null, 2));

console.log(`from national-team caps: ${fromCaps}`);
console.log(`normalised citizenship:  ${normalised}`);
console.log(`left as-is:              ${untouched}`);
console.log(`values changed:          ${changed} of ${pool.length}`);
const suspect = [...new Set(pool.map((p) => p.nat))].filter((n) => n && /Kingdom|Republic of|Democratic/.test(n));
console.log(`suspect labels remaining: ${suspect.length ? suspect.join(', ') : 'none'}`);
