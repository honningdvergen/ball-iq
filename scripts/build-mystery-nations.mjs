// build-mystery-nations.mjs — every senior national team a pool player was a
// member of, primary first, as src/data/mysteryNations.json.
//
//   node scripts/fetch-pool-nations.mjs     # Wikidata P54, senior classes only
//   node scripts/build-mystery-nations.mjs  # this
//
// OUTPUT (compact, loaded lazily with the pool by Job B, never on Home):
//   { n: [nation, …], p: { playerId: [nationIndex, …] } }
// Primary first. A player with no senior national team is absent from `p`,
// and the game shows no nation for them: a nation is a fact or it is left out.
//
// WHICH IS PRIMARY. The team he spent the most years with (sum of his dated
// spells there, a running spell counted to NOW_YEAR); on a tie the one whose
// last spell ended later, which is where an allegiance switch landed. That puts
// Zaha's Ivory Coast (2017–) ahead of England (2012, two friendlies), Puskás's
// Hungary (1945–56) ahead of Spain (1961–62), and Di Stéfano's Spain (1957–61)
// ahead of Argentina (1947). Wikidata holds no cap counts, so years stand in.
//
// ⚠️ ONLY NATIONAL SIDES OF A FIFA MEMBER, PAST OR PRESENT. The senior class
// also holds sides that are not a football nation: Catalonia, Galicia,
// Brittany and Corsica (regional selections inside Spain and France), the
// "United Kingdom" amateur/one-off side, and Guadeloupe, Martinique and French
// Guiana (CONCACAF members, not FIFA members, with no flag of their own beside
// France's). They are dropped and counted below; HAND_DROP lists them.
import { readFileSync, writeFileSync } from 'fs';

const NOW_YEAR = 2026;
const raw = JSON.parse(readFileSync('scripts/_mystery-nations-raw.json', 'utf8'));
const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));

// Team label -> nation. The label is "<Nation> men's national (association)
// football team", "<Nation> women's national …", "<Nation> national football
// team" or "… soccer team".
const LABEL = /^(.+?) (?:men['’]s |women['’]s )?national (?:association )?(?:football|soccer) team$/i;
// Labels whose nation word is not the name a fan uses.
const RENAME = {
  Canadian: 'Canada',
  Emirates: 'United Arab Emirates',
  Czechia: 'Czech Republic',
  'The Gambia': 'Gambia',
  "People's Republic of China": 'China',
  'China PR': 'China',
  'Korea Republic': 'South Korea',
  'Korea DPR': 'North Korea',
  "Côte d'Ivoire": 'Ivory Coast',
  'Republic of the Congo': 'Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Macedonia': 'North Macedonia',
  'FR Yugoslavia': 'Yugoslavia',
  'Turkiye': 'Turkey',
  'Türkiye': 'Turkey',
};
const HAND_DROP = new Set([
  'Catalonia', 'Galicia', 'Brittany', 'Corsica', 'Basque Country', 'Andalusia',
  'United Kingdom', 'Great Britain',
  'Guadeloupe', 'Martinique', 'French Guiana',
]);

// ⚠️ HAND EDITS, each because the source is plainly wrong, each listed in the
// Job A report. Only ever a REMOVAL: this file never adds a nation by hand.
const HAND_DROP_SPELL = {
  // Tim Cahill: Wikidata files his 1994 Samoa spell under the senior side. It
  // was Samoa's under-20 team, at fourteen; FIFA's 2004 eligibility ruling
  // that let him play for Australia turned on exactly that.
  Q187238: ['Samoa'],
  // Edgar Davids: a 2009–10 "Suriname" membership. Suriname did not field
  // players holding another nationality until its 2019 sports-nationality law,
  // and his caps are all for the Netherlands (1994–2005).
  Q185115: ['Suriname'],
};

export function nationFromLabel(label) {
  const m = String(label || '').match(LABEL);
  if (!m) return null;
  let n = m[1].trim();
  n = RENAME[n] || n;
  // A second side of a nation ("Spain B", "Turkey A2", "Russia-2", "Algeria
  // A'") sits in another class and should never reach here; guard anyway.
  if (/\s(B|A2|A'|XI)$|-2$|military|League/i.test(n)) return null;
  return n;
}

const dropped = {};
const unlabelled = new Set();
const byNation = new Map();
const out = { n: [], p: {} };
const idx = (n) => { if (!byNation.has(n)) { byNation.set(n, out.n.length); out.n.push(n); } return byNation.get(n); };

let multi = 0, handDropped = 0;
for (const p of pool) {
  const spells = raw.p[p.id] || [];
  const per = new Map(); // nation -> { years, last }
  for (const [tid, from, to] of spells) {
    const label = raw.teams[tid];
    const nation = nationFromLabel(label);
    if (!nation) { unlabelled.add(`${tid} ${label}`); continue; }
    if (HAND_DROP.has(nation)) { dropped[nation] = (dropped[nation] || 0) + 1; continue; }
    if ((HAND_DROP_SPELL[p.id] || []).includes(nation)) { handDropped++; continue; }
    const cur = per.get(nation) || { years: 0, last: -Infinity };
    if (from != null) cur.years += Math.max(0, (to ?? NOW_YEAR) - from);
    cur.last = Math.max(cur.last, to ?? (from != null ? NOW_YEAR : -Infinity));
    per.set(nation, cur);
  }
  if (!per.size) continue;
  const list = [...per.entries()].sort((a, b) => b[1].years - a[1].years || b[1].last - a[1].last
    // Undated on both sides: keep the nation today's `nat` already names, then by name.
    || (b[0] === p.nat) - (a[0] === p.nat) || a[0].localeCompare(b[0]));
  if (list.length > 1) multi++;
  out.p[p.id] = list.map(([n]) => idx(n));
}

writeFileSync('src/data/mysteryNations.json', JSON.stringify(out));
console.log(`nations: ${out.n.length}`);
console.log(`players with a senior national team: ${Object.keys(out.p).length} of ${pool.length}`);
console.log(`players with two or more: ${multi}`);
console.log(`spells dropped as not a FIFA nation: ${JSON.stringify(dropped)}`);
console.log(`spells dropped by hand (HAND_DROP_SPELL): ${handDropped}`);
// Youth, Olympic and regional sides arrive on the generic class and are meant
// to be dropped; anything else not read as a nation is printed for a person.
const odd = [...unlabelled].filter((l) => !/under-|olympic|youth|regional|autonomous|amateur|junior|representative/i.test(l));
console.log(`labels not read as a nation: ${unlabelled.size} (youth/Olympic/regional), other: ${odd.join(' | ') || 'none'}`);
