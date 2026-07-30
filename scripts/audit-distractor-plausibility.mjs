#!/usr/bin/env node
// Distractor plausibility audit — the defect class a per-question verifier
// structurally CANNOT see, because every option is individually a real
// footballer and the answer key is correct.
//
// Origin: q_1d9b9c offered "Ronaldo R9" as an option on the 2016 Champions
// League final shootout. R9 retired in 2011. A playtester's friend spotted it
// instantly.
//
// WHAT THE FIRST RUN TAUGHT ME (kept here so nobody re-derives it):
// Neither half of that defect is a defect on its own.
//
//   * Surname collision alone is often GOOD question design. q_d2fc88 offers
//     "Thomas Müller" vs "Gerd Müller" for the all-time Bundesliga scorer —
//     both plausible, and telling them apart IS the question.
//   * Era mismatch alone is usually unavoidable. "Which German forward scored
//     in the 2002, 2006, 2010 AND 2014 World Cups?" cannot have a distractor
//     who could plausibly have done that — any wrong answer is era-bounded by
//     construction. Flagging those is noise.
//
// The defect is the INTERSECTION: a near-name twin of the correct answer who
// ALSO could not possibly have been there. That pair is what makes the question
// feel like a trick and simultaneously gives the answer away.
//
// So: TIER 1 (intersection) is the finding list. TIER 2/3 are each half on its
// own, printed as counts + samples only, because their precision is too low to
// act on in bulk — per feedback_verify_detector_output, a detector's first run
// is a hypothesis, and this one's first run was 345 hits of mostly "Celtic
// Park" vs "Hampden Park" (shared token: "park").

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { QB } = await import(join(ROOT, 'src/questions.js'));

// ── Retirement table ─────────────────────────────────────────────────────────
// Year of last professional appearance. Hand-curated and deliberately
// conservative: only uncontested retirement years, and only players who
// plausibly appear as a distractor. A wrong entry here produces a false
// accusation against a CORRECT question, so messy career ends (comebacks,
// farewell spells in India/Australia) are LEFT OUT rather than guessed at.
const LAST_SEASON = {
  'Garrincha': 1972, 'Bobby Charlton': 1976, 'Pelé': 1977, 'Pele': 1977,
  'Eusébio': 1979, 'Eusebio': 1979, 'Rivelino': 1981, 'Beckenbauer': 1983,
  'Cruyff': 1984, 'Platini': 1987, 'Sócrates': 1989, 'Socrates': 1989,
  'Rummenigge': 1989, 'Zico': 1994, 'Van Basten': 1995, 'Rijkaard': 1995,
  'Völler': 1996, 'Voller': 1996, 'Maradona': 1997, 'Cantona': 1997,
  'Gullit': 1998, 'Klinsmann': 1998, 'Matthäus': 2000, 'Matthaus': 2000,
  'Hagi': 2001, 'Bebeto': 2002, 'Adams': 2002, 'Stoichkov': 2003,
  'Roberto Baggio': 2004, 'Batistuta': 2005, 'Zola': 2005, 'Bergkamp': 2006,
  'Zidane': 2006, 'Shearer': 2006, 'Keane': 2006, 'Rui Costa': 2008,
  'Kahn': 2008, 'Cafu': 2008, 'Thuram': 2008, 'Kluivert': 2008,
  'Maldini': 2009, 'Figo': 2009, 'Nedvěd': 2009, 'Nedved': 2009,
  'Romário': 2009, 'Romario': 2009, 'Vieri': 2009, 'Ronaldo R9': 2011,
  'Cannavaro': 2011, 'Vieira': 2011, 'Pires': 2011, 'Roberto Carlos': 2012,
  'R. Carlos': 2012, 'Crespo': 2012, 'Ballack': 2012, 'Shevchenko': 2012,
  'Scholes': 2013, 'Beckham': 2013, 'Davids': 2013, 'Owen': 2013, 'Deco': 2013,
  'Giggs': 2014, 'Puyol': 2014, 'Nesta': 2014, 'Zanetti': 2014,
  'Seedorf': 2014, 'Del Piero': 2014, 'Henry': 2014, 'Raúl': 2015,
  'Raul': 2015, 'Ferdinand': 2015, 'Ronaldinho': 2015, 'Trezeguet': 2015,
  'Gerrard': 2016, 'Lampard': 2016, 'Vidić': 2016, 'Vidic': 2016,
  'Klose': 2016, 'Totti': 2017, 'Pirlo': 2017, 'Kaká': 2017, 'Kaka': 2017,
  'Drogba': 2018, 'Terry': 2018, 'Xavi': 2019, 'Torres': 2019,
  'Van Persie': 2019, 'Schweinsteiger': 2019, 'Casillas': 2020, 'Rooney': 2021,
  'Buffon': 2023, 'Ibrahimović': 2023, 'Ibrahimovic': 2023, 'Iniesta': 2024,
};

// A dated stem is only anachronism-testable when it names ONE specific match.
// "Whose 1972 record did Messi beat in 2012?" has two years and the event is
// 1972 — anchoring on the latest year flags every 1970s legend as impossible.
// Single-match stems ("the 2016 Champions League final shootout") have exactly
// one date, so the anchor is unambiguous.
const SINGLE_MATCH = /\b(final|shootout|semi[- ]?final|quarter[- ]?final|derby|replay)\b/i;

// On-pitch only. Awards, votes, inductions, records-held, adverts, punditry and
// management legitimately involve retired players — Lampard is an excellent
// distractor for "which manager joined Chelsea mid-season in 2020-21".
const PLAY_EVENT = /\b(scored|scoring|goal|assist|penalt|shootout|played|start(?:ed|ing)|line[- ]?up|captain(?:ed)?|substitut|hat[- ]?trick|appearance|wore the)\b/i;
const NON_PLAYING_ROLE = /\b(manager|managed|coach|boss|head coach|caretaker|pundit|president|voted|award|ballon d'or|inducted|hall of fame)\b/i;

// Tokens that are places, clubs, competitions or common nouns — never surnames.
// Without this, "Celtic Park"/"Hampden Park" and "Golden goal"/"Silver goal"
// dominate the output.
const NOT_A_SURNAME = new Set([
  'park','arena','stadium','ground','field','bridge','road','lane','court',
  'goal','goals','cup','league','trophy','ball','boot','glove','year','none',
  'hotel','manager','back','forward','keeper','midfield','defender','striker',
  'ireland','republic','northern','south','north','east','west','city','united',
  'milan','madrid','munich','münchen','bilbao','sociedad','vigo','palmas',
  'leverkusen','bremen','berlin','zagreb','belgrade','moscow','kiev','kyiv',
  'athens','lisbon','porto','roma','napoli','torino','genoa','juventus',
  'barcelona','sevilla','valencia','villarreal','betis','celta','bucharest',
  'liverpool','arsenal','chelsea','everton','fulham','sunderland','newcastle',
  'leeds','wednesday','forest','villa','albion','rovers','wanderers','county',
  'town','athletic','atletico','atlético','sporting','bayern','bayer','borussia',
  'schalke','hamburg','stuttgart','frankfurt','dortmund','leipzig','hoffenheim',
  'ajax','feyenoord','twente','anderlecht','brugge','benfica','guimarães',
  'galatasaray','fenerbahçe','beşiktaş','trabzonspor','olympiacos','celtic',
  'plate','juniors','paulo','janeiro','mineiro','paranaense','cruzeiro',
  'internacional','nacional','universidad','america','américa','guadalajara',
  'brazil','argentina','germany','france','italy','spain','england','portugal',
  'netherlands','belgium','croatia','uruguay','mexico','japan','korea','nigeria',
]);

const words = (s) => String(s).split(/[\s'’.-]+/).filter(Boolean);
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// A single person's name: 1-3 words, no conjunction, no list.
// Excludes "Scholes & Cole", "1958, 1962, 1970", "Two — Zagallo and Beckenbauer".
//
// ⚠️ Digits may NOT be blanket-rejected here. The very question that prompted
// this script has "Ronaldo R9" as its bad option, and an earlier `\d` guard
// (written to bin year-list options) silently excluded it — the detector
// reported 0 against the exact row it was built for. Reject only tokens that
// are ENTIRELY numeric, so "R9" survives and "1962" does not.
const isPersonName = (s) => {
  const t = String(s).trim();
  if (/[&,—]|\band\b/.test(t)) return false;
  const w = words(t);
  if (!w.length || w.length > 3) return false;
  if (w.some((x) => /^\d+$/.test(x))) return false;
  return w.every((x) => /^[A-ZÀ-Ý]/.test(x) || x.length <= 2);
};

const surnameClash = (a, b) => {
  if (!isPersonName(a) || !isPersonName(b)) return null;
  const wa = words(a).map(norm), wb = words(b).map(norm);
  const lastA = wa[wa.length - 1], lastB = wb[wb.length - 1];
  const shared = wa.filter((t) => wb.includes(t) && t.length >= 4 && !NOT_A_SURNAME.has(t));
  return shared.find((t) => t === lastA || t === lastB) ?? null;
};

// ⚠️ The surname fallback is ONLY safe for bare-surname options ("Ramos",
// "Bale"). Applying it to a full name matches anyone who merely SHARES a
// surname, and it produced two false accusations against correct questions on
// its first real run: "Abedi Pelé" (Ghana, retired ~2000) matched the Pelé
// entry, and "Ferran Torres" (still playing) matched Fernando Torres. A
// multi-word option must therefore match the table EXACTLY or not at all.
const retirementOf = (opt) => {
  if (!isPersonName(opt)) return null;                 // "Aston Villa" is a club
  const exact = LAST_SEASON[opt];
  if (exact != null) return exact;
  return words(opt).length === 1 ? (LAST_SEASON[opt] ?? null) : null;
};

const tier1 = [];   // surname clash WITH an impossible twin — act on these
const tier2 = [];   // surname clash only — advisory
const tier3 = [];   // anachronism on a single-match stem only — advisory

for (const q of QB) {
  if (!Array.isArray(q.o) || q.o.length < 2) continue;
  const stem = q.q || '';
  const answer = q.o[q.a];   // ALWAYS resolve o[a] — `a` is an index, not the answer
  if (answer == null) continue;

  const years = [...stem.matchAll(/\b(19[5-9]\d|20[0-2]\d)\b/g)].map((m) => +m[1]);
  const datedMatch =
    years.length === 1 && SINGLE_MATCH.test(stem) &&
    PLAY_EVENT.test(stem) && !NON_PLAYING_ROLE.test(stem);
  const eventYear = datedMatch ? years[0] : null;

  for (const opt of q.o) {
    if (opt === answer) continue;
    const clash = surnameClash(opt, answer);
    const retired = retirementOf(opt);
    const impossible = eventYear != null && retired != null && eventYear > retired;

    if (clash && impossible) {
      tier1.push({ id: q.id, cat: q.cat, opt, answer, clash, retired, eventYear, stem });
    } else if (clash) {
      tier2.push({ id: q.id, cat: q.cat, opt, answer, clash, stem });
    } else if (impossible) {
      tier3.push({ id: q.id, cat: q.cat, opt, answer, retired, eventYear, stem });
    }
  }
}

// --quiet is the build gate: fail loudly on Tier 1, stay silent otherwise.
// Tiers 2-3 are advisory and would just be noise in a deploy log.
if (process.argv.includes('--quiet')) {
  if (!tier1.length) {
    console.log(`✓ distractor plausibility: no near-name/anachronism pairs (${QB.length} MCQs)`);
    process.exit(0);
  }
  console.error(`\n✗ DISTRACTOR PLAUSIBILITY — ${tier1.length} deletion-grade option(s):\n`);
  for (const h of tier1) {
    console.error(`  ${h.id} [${h.cat}]  "${h.opt}" (retired ${h.retired}) shares "${h.clash}" with key "${h.answer}"`);
    console.error(`      ${h.stem}`);
    console.error(`      → replace the distractor with someone who was actually there in ${h.eventYear}.\n`);
  }
  console.error('Run `npm run audit:distractors` for the full advisory list.\n');
  process.exit(1);
}

console.log(`\n╔═══ TIER 1 — near-name twin who could not have been there (${tier1.length}) ═══╗`);
console.log('  Deletion-grade: gives the answer away AND is trivially eliminable.\n');
for (const h of tier1) {
  console.log(`  ${h.id} [${h.cat}]  "${h.opt}" (retired ${h.retired}) vs key "${h.answer}"`);
  console.log(`      shared surname: ${h.clash} · event year: ${h.eventYear}`);
  console.log(`      ${h.stem}\n`);
}

console.log(`── TIER 2 — near-name pair, both plausible (${tier2.length}) ─────────────`);
console.log('   ADVISORY ONLY. Often deliberate and good (Thomas vs Gerd Müller).');
console.log('   Review individually; do not bulk-edit.\n');
for (const h of tier2.slice(0, 12)) {
  console.log(`   ${h.id}  "${h.opt}" vs key "${h.answer}"  (${h.clash})`);
}
if (tier2.length > 12) console.log(`   … ${tier2.length - 12} more (pass --all to list)`);

console.log(`\n── TIER 3 — retired before a single-match dated event (${tier3.length}) ──`);
console.log('   ADVISORY ONLY. Weak distractor, but not answer-revealing.\n');
for (const h of tier3.slice(0, 12)) {
  console.log(`   ${h.id}  "${h.opt}" retired ${h.retired}, match ${h.eventYear} → key "${h.answer}"`);
  console.log(`      ${h.stem}`);
}
if (tier3.length > 12) console.log(`   … ${tier3.length - 12} more (pass --all to list)`);

if (process.argv.includes('--all')) {
  console.log('\n═══ FULL TIER 2 ═══');
  for (const h of tier2) console.log(`   ${h.id} [${h.cat}] "${h.opt}" vs "${h.answer}" (${h.clash})\n      ${h.stem}`);
  console.log('\n═══ FULL TIER 3 ═══');
  for (const h of tier3) console.log(`   ${h.id} [${h.cat}] "${h.opt}" retired ${h.retired} · match ${h.eventYear} → "${h.answer}"\n      ${h.stem}`);
}

console.log(`\nScanned ${QB.length} MCQs · retirement table covers ${Object.keys(LAST_SEASON).length} entries.`);
console.log('Tier 1 is actionable. Tiers 2-3 are candidates for a human editorial call.\n');
process.exit(tier1.length ? 1 : 0);
