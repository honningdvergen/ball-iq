// build-mystery-pool-v2.mjs — assemble the Mystery Player pools.
//
//   node scripts/build-mystery-pool-v2.mjs
//
// ⚠️ TWO POOLS, NOT ONE. Conflating them is what made the shipped version
// unplayable: matchGuess() and the answer schedule both read the SAME array, so
// a squad filler could be the answer AND Ronaldo was rejected as a guess.
//
//   GUESS pool  — everyone a fan might plausibly type. Inclusive. Being in it
//                 costs nothing; "not found" on a real footballer is the single
//                 worst thing this game can do to a player.
//   ANSWER pool — only players a median fan can name, with a real career.
//                 Small, cross-era, high fame.
//
// ⚠️ THE ANSWER POOL FILTERS ON CAREER, NOT ON A NAME BLACKLIST. Fame is
// football-blind: Albert Camus (205 wikis), Niels Bohr (186) and Sean Connery
// (144) all carry P106 = association football player and outrank Pelé. Measured
// club counts: Messi 8, Modrić 10, Zidane 8, Pelé 4 — Camus 0, Connery 0,
// Bohr 1. Requiring a career separates them, and unlike a blacklist it also
// catches the famous non-footballers nobody thought to list.
import { writeFileSync, readFileSync, existsSync } from 'fs';

const EP = 'https://query.wikidata.org/sparql';
const UA = 'BallIQ/1.0 (https://balliq.app; football quiz pool build)';

async function sparql(query, label) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(`${EP}?query=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
        signal: AbortSignal.timeout(180000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const t = await r.text();
      if (t.includes('SPARQL-QUERY: queryStr=') || !t.trimEnd().endsWith('}')) throw Object.assign(new Error('TRUNCATED'), { truncated: true });
      return JSON.parse(t).results.bindings;
    } catch (e) {
      console.error(`  ! ${label} attempt ${a}: ${e.message}`);
      if (a === 3) throw e;
      await new Promise((s) => setTimeout(s, 4000 * a));
    }
  }
}

const CORE = JSON.parse(readFileSync('scripts/_mystery-core.json', 'utf8'));
const CAREERS = JSON.parse(readFileSync('scripts/_mystery-careers.json', 'utf8'));

// P413 labels are granular ("centre-back", "attacking midfielder", "sweeper").
// The game compares BOTH: `slot` sets the band, `position` refines within it.
const SLOT = (poss) => {
  const s = poss.join(' ').toLowerCase();
  if (/goalkeep/.test(s)) return 'GK';
  if (/\bback\b|defend|sweeper/.test(s)) return 'DF';
  // ⚠️ FORWARD IS TESTED BEFORE MIDFIELD, and matches \bforward\b rather than
  // "attack". Wikidata gives Messi, Pelé, Maradona and Totti the unordered pair
  // ["midfielder","forward"] with no preferred rank, so testing midfield first
  // filed all four as midfielders. Matching "attack" instead would then have
  // dragged Zidane ("attacking midfielder") into FW. Strict word boundary,
  // forward first, is the only ordering that gets all five right.
  if (/\bforward\b|striker|winger/.test(s)) return 'FW';
  /* ⚠️ "wing half" IS NOT MATCHED BY /winger/ — and it cost us Neymar.
     Measured 2026-08-15: 702 of 9,384 core entries resolved to a null slot and
     were dropped by the `p.slot` filter below. 526 of them were this one term,
     and the casualty list is essentially every famous winger in the game:
     Neymar (fame 155), Gareth Bale, Ribéry, George Best, Di María, Figo,
     Mahrez, Robinho, Götze, David Silva, Nani, Alexis Sánchez.

     FW, because in practice these are WINGERS. The term is a Wikidata relic —
     the real wing-half was a half-back — but of the 525 players carrying it
     alone, 385 were born 1980 or later and only 49 predate 1950. The famous
     ones are Neymar, Bale, Ribéry, Di María, Figo, Mahrez: wingers to a man.

     Consistency decides it as much as the era split. SLOT already sends
     "winger" to FW on the line above, so filing these as MF would put half the
     game's wingers in one slot and half in another, and they would stop
     matching EACH OTHER on the slot term — the same unfairness that made
     citizenship unusable for nationality (see derive-pool-nationality.mjs,
     where an England and a Scotland player matched as "United Kingdom").

     The 145 who also carry an explicit "forward" already resolve above, so
     this catches the 525 with no other position at all.

     "stopper" and "centerhalf" are centre-backs; "playmaker" is a midfielder.
     Everything still unmatched (linebacker, quarterback, defensive tackle,
     stage race, Home Office) SHOULD stay null — that is the anti-Camus filter
     doing its job, and it is why Albert Camus, Elie Wiesel, Jason Statham and
     Javier Milei are correctly absent from a football pool. */
  if (/wing half/.test(s)) return 'FW';
  if (/stopper|centerhalf/.test(s)) return 'DF';
  if (/playmaker/.test(s)) return 'MF';
  if (/midfield/.test(s)) return 'MF';
  if (/attack/.test(s)) return 'FW';
  return null;
};

// ⚠️ LONGEST TENURE, NOT LATEST TRANSFER. Latest-by-start-date is factually
// correct and badly wrong for this game: it made Roberto Carlos an Odisha FC
// player, Eusébio a New Jersey American and Fernando Torres a Sagan Tosu man.
// The `club` term is worth 1000 — the strongest signal in the whole ranking —
// so guessing a Real Madrid player would have scored ZERO against Roberto
// Carlos. The club a fan associates with someone is the one they spent longest
// at. Falls back to latest start when a spell has no dates to measure.
// ⚠️ SANITY-BOUND THE DATES BEFORE TRUSTING THEM. Roberto Carlos's Anzhi spell
// is recorded as starting in year 1, which made its "tenure" 2,011 years and
// beat Real Madrid's eleven — so he came out as an Anzhi Makhachkala player.
// The date is structurally valid and semantically nonsense, the same shape as
// every other bug in this build. Club football starts around 1850 and nobody
// serves 30 years at one club, so anything outside that is discarded rather
// than believed.
const YEAR_NOW = 2026;
const okYear = (y) => Number.isFinite(y) && y >= 1850 && y <= YEAR_NOW + 1;
const tenure = (c) => {
  if (okYear(c.start) && okYear(c.end) && c.end >= c.start && c.end - c.start <= 30) return c.end - c.start;
  /* ⚠️ AN OPEN-ENDED SPELL IS THE CURRENT CLUB, AND IT IS USUALLY THE ONE A FAN
     NAMES. This returned a flat 3 — "meaningful, not dominant" — which meant a
     current club lost to almost any completed spell, so EVERY current player
     was labelled with an old one. Found by Alex, 2026-08-15, reading a store
     screenshot: "oblak plays for atletico madrid, neuer plays or played for
     bayern munich, courtouis plays for real madrid, what is going on here".

         Neuer     Bayern 2011-now  3  vs Schalke 2006-2011 5  -> Schalke
         Courtois  Real M 2018-now  3  vs Chelsea 2011-2018 7  -> Chelsea
         Oblak     Atleti 2014-now  3  vs Benfica 2010-2014 4  -> Benfica

     Scoring it by elapsed years is what "longest tenure" meant all along. The
     same 30-year sanity cap applies, so a spell with a nonsense start date
     still cannot dominate. This is not cosmetic: `club` is the 1000-point term
     in similarity(), so the ranks were wrong wherever the label was. */
  if (okYear(c.start) && !c.end) {
    const yrs = YEAR_NOW - c.start;
    return (yrs >= 0 && yrs <= 30) ? yrs : 0;
  }
  return 0;                                   // unusable dates score nothing
};
const startOf = (c) => (okYear(c.start) ? c.start : 0);
const latestClub = (list) => [...list].sort((a, b) =>
  (tenure(b) - tenure(a)) || (startOf(b) - startOf(a)))[0];

// ⚠️ THE NATIONAL-TEAM CLASS I HARDCODED WAS STALE. Argentina, Brazil and Italy
// are Q135408445 ("men's national association football team"), a newer class
// than the Q6979593 I guessed — so they survived the careers filter and Totti's
// "current club" came out as the Italy national team. Fetching every national
// team ONCE beats re-classifying 6,015 clubs, and beats hardcoding a class list
// that silently ages.
// ⚠️ CLASSES DISCOVERED FROM OUR OWN DATA, not guessed. Two earlier attempts
// hardcoded Q-ids from memory and both were wrong: Q6979593 was stale (the live
// class is Q135408445) and a "national under-23" guess turned out to be Q5,
// human. These came from aggregating P31 over the 367 national-ish teams
// actually present in the careers.
// ⚠️ Q476028 (association football club) is deliberately ABSENT — 22 of those
// 367 are real clubs with "National" in the name. Filtering on the label would
// have deleted them, which is why the rule is class-based.
const NAT_CLASSES = [
  'Q135408445', // men's national association football team
  'Q23905105',  // women's national association football team
  'Q45053817',  // secondary national association football team
  'Q23759293',  // national Olympic football team
  'Q21945604',  // national youth football team
  'Q6979740',   // under-21
  'Q23901137',  // under-19
  'Q23904671',  // under-18
  'Q23901123',  // under-17
  'Q23904672',  // under-16
  'Q23904673',  // under-15
  'Q94696559',  // national futsal team
  'Q6979593', 'Q1194951', 'Q22297308', 'Q19541015', 'Q1478437',
];
const NT = 'scripts/_national-teams.json';
let national;
if (existsSync(NT)) national = new Set(JSON.parse(readFileSync(NT, 'utf8')));
else {
  const rows = await sparql(`SELECT DISTINCT ?t WHERE {
    VALUES ?cls { ${NAT_CLASSES.map((c) => 'wd:' + c).join(' ')} }
    ?t wdt:P31 ?cls . }`, 'national teams');
  national = new Set(rows.map((b) => b.t.value.split('/').pop()));
  writeFileSync(NT, JSON.stringify([...national]));
}
console.log(`national teams to exclude: ${national.size}`);

for (const [pid, list] of Object.entries(CAREERS)) {
  const clubs = list.filter((c) => !national.has(c.id));
  if (clubs.length) CAREERS[pid] = clubs; else delete CAREERS[pid];
}

// ⚠️ FAIL LOUD ON DRIFT. Wikidata reclassifies; the list above will age. Anything
// that still LOOKS like a national side after class filtering is reported, so the
// next refresh surfaces a new class instead of silently letting Italy back in.
const leaked = new Map();
for (const list of Object.values(CAREERS)) for (const c of list)
  if (/\bnational\b|under-\d\d|\bU-?\d\d\b|olympic/i.test(c.name)) leaked.set(c.id, c.name);
if (leaked.size) {
  console.log(`⚠️  ${leaked.size} national-looking team(s) survived the class filter — check for a new P31 class:`);
  [...leaked.entries()].slice(0, 6).forEach(([id, n]) => console.log(`     ${id}  ${n}`));
} else console.log('no national-looking teams survived the class filter');

// SELF-HEAL, THE SIMPLE WAY. The first attempt round-tripped the leaked ids to
// fetch their P31 classes and expand from there — and that query truncated
// every time. It was also unnecessary: the leaked ENTITIES are already known
// from our own data, so excluding them directly converges immediately and
// cannot fail. The class list above still does the bulk (7,496 teams); this
// just sweeps the tail (U23, U20, amateur, beach soccer, club academies).
// The alarm still runs afterwards, so drift stays visible rather than absorbed.
if (leaked.size) {
  for (const id of leaked.keys()) national.add(id);
  writeFileSync(NT, JSON.stringify([...national]));
  console.log(`   swept ${leaked.size} leaked team(s) directly`);
  for (const [pid, list] of Object.entries(CAREERS)) {
    const clubs = list.filter((c) => !national.has(c.id));
    if (clubs.length) CAREERS[pid] = clubs; else delete CAREERS[pid];
  }
  const still = new Map();
  for (const list of Object.values(CAREERS)) for (const c of list)
    if (/\bnational\b|under-\d\d|\bU-?\d\d\b|olympic/i.test(c.name)) still.set(c.id, c.name);
  console.log(`   after sweep: ${still.size} national-looking team(s) remain`);
}

const withCareer = CORE.filter((p) => (CAREERS[p.id] || []).length > 0);
const clubsNeeded = [...new Set(withCareer.map((p) => latestClub(CAREERS[p.id]).id))];
console.log(`players with a career: ${withCareer.length} · distinct latest clubs: ${clubsNeeded.length}`);

// Club country drives the `country: 300` similarity term (a Premier League
// player should rank near another Premier League player).
const CC = 'scripts/_mystery-clubcountry.json';
let country = existsSync(CC) ? JSON.parse(readFileSync(CC, 'utf8')) : {};
const missing = clubsNeeded.filter((c) => !(c in country));
if (missing.length) {
  console.log(`── club countries: ${missing.length} to fetch ──`);
  for (let i = 0; i < missing.length; i += 300) {
    const chunk = missing.slice(i, i + 300).map((c) => `wd:${c}`).join(' ');
    const rows = await sparql(
      `SELECT ?c ?cLabel WHERE { VALUES ?x { ${chunk} } ?x wdt:P17 ?c .
        BIND(?x AS ?club) SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". } }`
        .replace('?c ?cLabel', '?club ?cLabel').replace('?x wdt:P17 ?c', '?x wdt:P17 ?c'),
      `cc ${i}`);
    for (const b of rows) country[b.club.value.split('/').pop()] = b.cLabel?.value || null;
    for (const c of missing.slice(i, i + 300)) if (!(c in country)) country[c] = null;
    writeFileSync(CC, JSON.stringify(country));
    process.stdout.write(`  ${Math.min(i + 300, missing.length)}/${missing.length}\r`);
  }
  console.log('');
}

/* ── CURRENT CLUB BEATS LONGEST TENURE, FOR ACTIVE PLAYERS ─────────────────
   Longest-tenure exists to stop a retired legend being labelled by an obscure
   last move (Roberto Carlos -> Odisha FC). For an ACTIVE player it is simply
   wrong, and measurably so: of 795 pool players who also appear in a current
   squad, 439 carried a PREVIOUS club.

       Declan Rice   West Ham 2017-2023 (6y)  beat  Arsenal 2023-now (3y)
       Kai Havertz   Leverkusen               beat  Arsenal
       Odegaard      Real Madrid              beat  Arsenal

   Every fan says Arsenal. Alex, 2026-08-15: "should the algo not be based on
   their current club?" — yes, when there IS a current club. squads.json is the
   maintained current-squad source (65 clubs, 1,545 players), so it wins for
   anyone in it and tenure still handles everyone retired.

   ⚠️ LABELS MUST BE CANONICAL, NOT MERELY CORRECT. similarity() compares club
   STRINGS exactly (`p.club === answer.club`, the 1000-point term), so leaving
   squads' "Arsenal" beside Wikidata's "Arsenal F.C." would stop two Arsenal
   players matching each other — a silent scoring bug worse than the wrong
   label it fixed. Every club therefore resolves to ONE display name, and the
   squad short-form wins because it is what a fan writes. */
const SQUADS = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));
const clubKey = (n) => String(n || '').toLowerCase()
  .replace(/\b(f\.?c\.?|c\.?f\.?|s\.?l\.?|a\.?c\.?|s\.?c\.?|afc|club de futbol|club de fútbol|calcio)\b/g, '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

const currentClubById = new Map();   // playerId -> squad club name
const canonByKey = new Map();        // clubKey  -> preferred display name
for (const [club, arr] of Object.entries(SQUADS)) {
  if (!Array.isArray(arr)) continue;
  canonByKey.set(clubKey(club), club);
  for (const pl of arr) if (pl?.id) currentClubById.set(pl.id, club);
}
const canonClub = (name) => canonByKey.get(clubKey(name)) || name;

const build = (p) => {
  const career = CAREERS[p.id];
  const lc = latestClub(career);
  // Active player -> the squad they are actually in; otherwise longest tenure.
  // Either way the label is canonicalised so club matching stays exact.
  const squadClub = currentClubById.get(p.id);
  const clubName = canonClub(squadClub || lc.name);
  return {
    id: p.id, name: p.name, fame: p.fame, born: p.born,
    nat: p.nats[0] || null,
    slot: SLOT(p.poss), position: p.poss[0] || null,
    club: clubName, clubId: lc.id, country: country[lc.id] || null,
    clubCount: career.length,
  };
};

// A guessable player needs every attribute the ranking compares on, or their
// row would score blank and the rank would be meaningless.
const guess = withCareer.map(build).filter((p) => p.name && p.club && p.slot && p.nat && p.born);

// ⚠️ TUNED, NOT GUESSED: fame >= 55 and >= 2 clubs. At fame 55 the pool is
// names a football fan recognises; the 2-club rule removes the Bohr case (one
// amateur side) without touching one-club legends, who are rarer than they
// feel — Totti and Maldini both register youth + senior sides.
const answer = guess.filter((p) => p.fame >= 55 && p.clubCount >= 2).sort((a, b) => b.fame - a.fame);

writeFileSync('src/data/mysteryPool.json', JSON.stringify(guess));
writeFileSync('src/data/mysteryAnswers.json', JSON.stringify(answer.map((p) => p.id)));
/* ⚠️ CAREER YEARS SHIP NOW — they used to be dropped here, and that single
   `.map(c => c.name)` was the cause of a real player complaint.
   Alex's friend, 2026-08-15, on a Jan Oblak puzzle: Fernando Torres ranked 137
   and Saúl Ñíguez 386, and that made no sense to him. It made no sense because:

     Saúl   Atlético 2012-2025  ->  11 years as Oblak's teammate
     Torres Atlético 1995-2001  ->  never overlapped him at all

   Without years, similarity() could only count DISTINCT CLUB NAMES, so both
   scored one shared club and exactly the same points. Torres then won the tie
   on `club` (+100) because latestClub() picks the LONGEST spell, not the most
   recent, and labelled a man who retired in 2019 an Atlético player.

   ⚠️ DICTIONARY-ENCODED, and this is why it is affordable. Club names repeat
   across 49,656 spells; interning them into `c` and storing indices costs less
   than the names did, so the file went 1032 KB -> 988 KB while GAINING both
   years. Adding years naively would have been ~1.6 MB, and this file ships
   inside the native binary.

   Shape: { c: [clubName, ...], p: { playerId: [[clubIndex, start, end], ...] } }
   `start`/`end` are years or null. end === null means an OPEN-ENDED spell, which
   is what marks a player as still active — see isActive() in mysteryPlayer.js. */
{
  const clubIndex = new Map();
  const clubNames = [];
  const idOf = (n) => {
    if (!clubIndex.has(n)) { clubIndex.set(n, clubNames.length); clubNames.push(n); }
    return clubIndex.get(n);
  };
  const yr = (v) => (okYear(v) ? v : null);
  const players = Object.fromEntries(guess.map((p) => [
    p.id,
    CAREERS[p.id].map((c) => [idOf(c.name), yr(c.start), yr(c.end)]),
  ]));
  writeFileSync('src/data/mysteryCareers.json', JSON.stringify({ c: clubNames, p: players }));
  const spells = Object.values(players).reduce((n, l) => n + l.length, 0);
  console.log(`careers: ${clubNames.length} clubs interned · ${spells} spells · years shipped`);
}

console.log(`\nGUESS  pool: ${guess.length}`);
console.log(`ANSWER pool: ${answer.length}  (fame >= 55, >= 2 clubs)`);
console.log(`countries resolved: ${guess.filter((p) => p.country).length}/${guess.length}`);
const bySlot = {}; guess.forEach((p) => { bySlot[p.slot] = (bySlot[p.slot] || 0) + 1; });
console.log('slots:', JSON.stringify(bySlot));
const eras = {}; answer.forEach((p) => { const d = Math.floor(p.born / 10) * 10; eras[d] = (eras[d] || 0) + 1; });
console.log('answer pool by birth decade:', JSON.stringify(eras));

console.log('\nanswer pool, top 15:');
answer.slice(0, 15).forEach((p) => console.log(`  ${String(p.fame).padStart(3)}  ${p.name.padEnd(22)} ${p.slot}  ${p.club}`));

const CHECK = ['Cristiano Ronaldo','Lionel Messi','Zinedine Zidane','Ronaldinho','Luka Modrić',
  'Mohamed Salah','Kylian Mbappé','Thierry Henry','Vinícius Júnior','Ronaldo','Pelé','Diego Maradona'];
const inGuess = new Set(guess.map((p) => p.name)), inAns = new Set(answer.map((p) => p.name));
console.log('\n            guessable / can be the answer');
for (const n of CHECK) console.log(`  ${inGuess.has(n) ? '✓' : '✗'} / ${inAns.has(n) ? '✓' : '✗'}   ${n}`);
const BAD = ['Albert Camus','Niels Bohr','Sean Connery'];
console.log('\nnon-footballers — must NOT be answerable:');
for (const n of BAD) console.log(`  ${inAns.has(n) ? '✗ STILL IN ANSWER POOL' : '✓ excluded'}   ${n}`);
