// apply-squad-moves.mjs — a squad refresh, applied to the Mystery pool.
//
//   node scripts/apply-squad-moves.mjs           report only
//   node scripts/apply-squad-moves.mjs --write   src/data/mysteryPool.json + mysteryCareers.json
//
// ⚠️ RUN ORDER. A SECOND PASS, like the four audit-mystery-pool.mjs already
// lists: a pool rebuild rewrites the careers from Wikidata and undoes it.
//   build-squads --write -> derive-squad-moves -> THIS -> fix-pool-names (last)
// audit-mystery-pool.mjs fails the build if it has not been run.
//
// Two jobs, for the players scripts/_squad-moves.json lists:
//   1. Careers. Close the open spell at a club the player has left, with the
//      year his Wikipedia infobox gives, and add the open spell at the club he
//      is at now. Club names are only ever APPENDED to the interned table.
//   2. The `club` label, by the pool builder's own rule: the squad he is in if
//      squads.json has him, otherwise his longest single spell. Every label
//      also goes through the builder's canonical-name step, so a club that has
//      just joined squads.json ("Valencia") is not left beside the long form
//      ("Valencia CF") that similarity() would read as a different club.
//
// ⚠️ THIS NEVER CHANGES WHO IS SCHEDULED. It reads no schedule and writes none.
// It does change RANKS: `club` and the careers both feed similarity(), so a
// corrected row moves on every day. Measure before shipping (the numbers for
// the 2026-10-08 refresh are in the commit that added this file).
import { readFileSync, writeFileSync } from 'fs';
import { CLUB_FIXES } from './_name-overrides.mjs';

const WRITE = process.argv.includes('--write');
const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const careers = JSON.parse(readFileSync('src/data/mysteryCareers.json', 'utf8'));
const SQUADS = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));
const { moves } = JSON.parse(readFileSync('scripts/_squad-moves.json', 'utf8'));

// ── the builder's rule, copied from build-mystery-pool-v2.mjs. KEEP IN SYNC:
//    a label this file writes must be the label a rebuild would write. ───────
const YEAR_NOW = 2026;
const okYear = (y) => Number.isFinite(y) && y >= 1850 && y <= YEAR_NOW + 1;
const tenure = (c) => {
  if (okYear(c.start) && okYear(c.end) && c.end >= c.start && c.end - c.start <= 30) return c.end - c.start;
  if (okYear(c.start) && !c.end) { const yrs = YEAR_NOW - c.start; return (yrs >= 0 && yrs <= 30) ? yrs : 0; }
  return 0;
};
const startOf = (c) => (okYear(c.start) ? c.start : 0);
const latestClub = (list) => [...list].sort((a, b) => (tenure(b) - tenure(a)) || (startOf(b) - startOf(a)))[0];
const clubKey = (n) => String(n || '').toLowerCase()
  .replace(/\b(f\.?c\.?|c\.?f\.?|s\.?l\.?|a\.?c\.?|s\.?c\.?|afc|club de futbol|club de fútbol|calcio)\b/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]/g, '');
const squadOf = new Map();
const canonByKey = new Map();
for (const [club, list] of Object.entries(SQUADS)) {
  canonByKey.set(clubKey(club), club);
  for (const p of list) squadOf.set(p.id, club);
}
const canonClub = (name) => canonByKey.get(clubKey(name)) || name;

// ── 1. careers ──────────────────────────────────────────────────────────────
const clubIndex = new Map(careers.c.map((n, i) => [n, i]));
const tableBefore = careers.c.length;
const idx = (name) => {
  if (!clubIndex.has(name)) { clubIndex.set(name, careers.c.length); careers.c.push(name); }
  return clubIndex.get(name);
};
const byId = new Map(pool.map((p) => [p.id, p]));
const t = { closed: 0, added: 0, reopened: 0, already: 0, stale: [], relabelled: [], canonical: 0 };
for (const [id, m] of Object.entries(moves)) {
  const p = byId.get(id);
  if (!p || CLUB_FIXES[id]) continue;        // a curated career is the last word
  const spells = (careers.p[id] || []).map(([i, a, b]) => [careers.c[i], a, b]);
  const find = (name, a, b) => spells.find((sp) => sp[0] === name && sp[1] === a && sp[2] === b);
  for (const [name, a, b] of m.close || []) {
    const open = find(name, a, null);
    if (open) { open[2] = b; t.closed++; } else if (find(name, a, b)) t.already++;
    else t.stale.push(`${p.name}: no open "${name}" spell from ${a} to close`);
  }
  for (const [name, a, b] of m.reopen || []) {
    const shut = find(name, a, b);
    if (shut) { shut[2] = null; t.reopened++; } else if (find(name, a, null)) t.already++;
    else t.stale.push(`${p.name}: no "${name}" ${a}-${b} spell to re-open`);
  }
  for (const [name, a] of m.add || []) {
    if (find(name, a, null)) { t.already++; continue; }
    spells.push([name, a, null]);
    t.added++;
  }
  careers.p[id] = spells.map(([name, a, b]) => [idx(name), a, b]);
  if (p.clubCount !== spells.length) p.clubCount = spells.length;
}

// ── 2. labels ───────────────────────────────────────────────────────────────
for (const p of pool) {
  if (CLUB_FIXES[p.id]) continue;
  const squad = squadOf.get(p.id);
  let club;
  if (squad) club = squad;
  else if (moves[p.id]) {
    const spells = (careers.p[p.id] || []).map(([i, a, b]) => ({ name: careers.c[i], start: a, end: b }));
    club = spells.length ? canonClub(latestClub(spells).name) : p.club;
  } else club = canonClub(p.club);
  if (club === p.club) continue;
  if (squad || moves[p.id]) t.relabelled.push(`${p.name}: ${p.club} → ${club}`); else t.canonical++;
  p.club = club;
}
// A curated row that the squads file now disagrees with needs a person.
const clash = Object.entries(CLUB_FIXES).filter(([id, fix]) => squadOf.has(id) && squadOf.get(id) !== fix.club && byId.has(id))
  .map(([id, fix]) => `${byId.get(id).name}: curated as ${fix.club}, in the ${squadOf.get(id)} squad`);

console.log(`careers: ${t.closed} spells closed · ${t.added} current spells added · ${t.reopened} re-opened · ${t.already} already in place`);
console.log(`         ${careers.c.length - tableBefore} club name(s) appended to the table (${tableBefore} → ${careers.c.length})`);
console.log(`labels:  ${t.relabelled.length} players relabelled · ${t.canonical} long-form names made canonical`);
if (t.stale.length) { console.log(`\n⚠️  ${t.stale.length} recorded correction(s) no longer match the careers:`); t.stale.slice(0, 20).forEach((m) => console.log('     ' + m)); }
if (clash.length) { console.log(`\n⚠️  ${clash.length} curated club fix(es) disagree with squads.json (left alone, see _name-overrides.mjs):`); clash.forEach((m) => console.log('     ' + m)); }
writeFileSync('/tmp/squad-moves-relabelled.txt', t.relabelled.join('\n'));
console.log('  → every relabel is listed in /tmp/squad-moves-relabelled.txt');

if (WRITE) {
  writeFileSync('src/data/mysteryPool.json', JSON.stringify(pool, null, 2));
  writeFileSync('src/data/mysteryCareers.json', JSON.stringify(careers));
  console.log('\nwrote src/data/mysteryPool.json and src/data/mysteryCareers.json');
} else console.log('\n(report only; --write applies it)');
