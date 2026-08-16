// curate-mystery-answers.mjs — rebuild the ANSWER pool so every daily puzzle
// is a player our audience can actually name.
//
//   node scripts/curate-mystery-answers.mjs [--write]
//
// ⚠️ THE GUESS POOL AND THE ANSWER POOL ARE DIFFERENT THINGS, and that split
// already existed (gen-mystery-schedule.mjs draws from mysteryAnswers.json).
// The guess pool stays at 8,491 on purpose — refusing a real footballer as a
// guess is the worst thing this game can do. This file only decides what may
// be the ANSWER.
//
// ── WHY THE OLD RULE (fame >= 55) WAS NOT ENOUGH ─────────────────────────────
// `fame` is Wikipedia-sitelink shaped, so it measures GLOBAL NOTABILITY, not
// football recognisability. Measured on the live pool:
//     Niels Bohr        rank 3   (a physicist, above Pelé and Maradona)
//     Tsukasa Shiotani  fame 58 > Peter Crouch fame 57
//     Kazuaki Nagasawa  4,500 places above Robbie Savage
// The bias is systematic, not random: Japanese Wikipedia coverage lifts
// J-League and Japan internationals over the fame bar, and 53 of the 660
// answers were career J-League players — unguessable for this audience, and
// they would have surfaced as daily puzzles.
//
// ── THE RULE ─────────────────────────────────────────────────────────────────
// An answer must clear the existing fame bar AND show up in one of two assets
// we curate ourselves:
//   1. named in the VERIFIED question bank (full name, surname or mononym), or
//   2. played for a club we thought worth its own quiz page.
// Two signals because either alone is wrong. Bank-only drops Vertonghen,
// Alderweireld, Sagna and Fernandinho — genuinely famous, our bank just does
// not happen to name them. Club-only keeps anyone who had one season anywhere.
//
// ⚠️ MATCHING TRAPS THIS SCRIPT ALREADY FELL INTO — do not reintroduce:
//   · SURNAME matching against the bank is confounded by CLUB names: it scored
//     "Taribo West" 5th (West Ham), and David Villa / Flavio Roma off Aston
//     Villa and AS Roma. Full name, then surname, then mononym — never a bare
//     common token.
//   · mysteryCareers.json maps id -> ARRAY OF STRINGS, not objects. Reading
//     `c.name` off a string yields undefined, which silently made the club
//     signal match NOTHING and produced an identical drop list — the giveaway
//     was the count not moving at all.
//   · Mononyms (Pelé, Ronaldo, Kaká, Zico, Raúl, Casemiro) fail any check that
//     requires a space in the name. An early pass reported 67% coverage purely
//     as an artifact of that.
import { readFileSync, writeFileSync } from 'fs';
import { CLUBS } from './seo/clubs.mjs';

const write = process.argv.includes('--write');
const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const answers = JSON.parse(readFileSync('src/data/mysteryAnswers.json', 'utf8'));
/* ⚠️ SHAPE CHANGED 2026-08-15: mysteryCareers.json is now
   { c: [clubName, ...], p: { id: [[clubIndex, start, end], ...] } } — club names
   are interned and the spells carry YEARS, which is what lets similarity() score
   teammate overlap. This file only needs the NAMES, so it rehydrates them once.
   The old note below (id -> array of strings) described the previous shape and
   is kept because the failure it describes is the one to watch for: read the
   wrong field and the club signal silently matches NOTHING, and the giveaway is
   a drop count that does not move. */
const careersRaw = JSON.parse(readFileSync('src/data/mysteryCareers.json', 'utf8'));
const careers = Object.fromEntries(
  Object.entries(careersRaw.p).map(([id, spells]) => [id, spells.map(([ci]) => careersRaw.c[ci])]),
);
if (!careersRaw.c || !careersRaw.p) {
  throw new Error('mysteryCareers.json is in the OLD names-only shape — rerun build-mystery-pool-v2.mjs');
}
const bank = readFileSync('src/questions.js', 'utf8');

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const NB = norm(bank);
const CLUB_KEYS = CLUBS.map((c) => norm(c.name)).filter((x) => x.length > 3);
const byId = new Map(pool.map((p) => [p.id, p]));

// People who are famous for NOT playing football. They clear any notability
// bar because the bar measures notability. Julio Iglesias really was a Real
// Madrid youth keeper; he is still not a football answer.
const NOT_FOOTBALLERS = new Set(['Niels Bohr', 'Julio Iglesias', 'Harald Bohr']);

const namedInBank = (name) => {
  const parts = String(name || '').split(' ');
  return [name, parts[parts.length - 1], parts[0]]
    .filter((x) => x && x.length > 3)
    .some((c) => NB.includes(norm(c)));
};
const playedForAMajorClub = (id) =>
  (careers[id] || []).some((cn) => { const s = norm(cn); return CLUB_KEYS.some((k) => s.includes(k)); });

const kept = [];
const dropped = [];
for (const id of answers) {
  const p = byId.get(id);
  if (!p) { dropped.push({ name: `(missing ${id})`, why: 'not in pool' }); continue; }
  if (NOT_FOOTBALLERS.has(p.name)) { dropped.push({ name: p.name, why: 'not a footballer' }); continue; }
  if (namedInBank(p.name) || playedForAMajorClub(id)) kept.push(id);
  else dropped.push({ name: p.name, why: `no bank mention, no major club (${p.club || '?'})` });
}

console.log(`answer pool: ${answers.length} -> ${kept.length}  (dropped ${dropped.length})`);
const reasons = {};
for (const d of dropped) { const k = d.why.startsWith('no bank') ? 'unguessable' : d.why; reasons[k] = (reasons[k] || 0) + 1; }
console.log('reasons:', JSON.stringify(reasons));
for (const d of dropped.slice(0, 60)) console.log(`   - ${d.name}  (${d.why})`);

if (write) {
  writeFileSync('src/data/mysteryAnswers.json', `${JSON.stringify(kept)}\n`);
  console.log(`\nwrote src/data/mysteryAnswers.json (${kept.length} answers)`);
  console.log('⚠️ NEXT: re-run scripts/gen-mystery-schedule.mjs — the frozen schedule');
  console.log('   still references dropped ids until it is regenerated.');
} else {
  console.log('\n(dry run — pass --write to apply)');
}
