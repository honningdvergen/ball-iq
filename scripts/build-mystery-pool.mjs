// Flatten src/data/squads.json into ONE player pool for Mystery Player.
//
// The squad snapshot is keyed by club, and a player can legitimately appear
// under two clubs there: Wikidata often records the new membership before an
// editor closes the old one. Measured on the first run: 52 players, including
// Marcus Rashford at BOTH Manchester United and Barcelona.
//
// For a guessing game that is not cosmetic. The answer would be ambiguous, and
// every similarity score involving that player would be computed against the
// wrong club. So the pool resolves each player to exactly one club: the
// membership with the LATEST start date, which is the transfer that actually
// happened.
import { writeFileSync } from 'fs';
const { default: SQUADS } = await import('../src/data/squads.json', { with: { type: 'json' } });
// club-competition.mjs only covers 18 clubs — it was built for one wave, not
// as a general map. The club's COUNTRY is the signal that actually matters for
// similarity anyway (a Premier League player should score close to another
// Premier League player), and one Wikidata query gave all 72.
const { default: CLUB_COUNTRY } = await import('./_club-country.json', { with: { type: 'json' } });

const byId = new Map();
for (const [club, players] of Object.entries(SQUADS)) {
  for (const p of players) {
    const prev = byId.get(p.id);
    // Later start wins. A missing start date loses to any real one.
    if (!prev || (p.started || '') > (prev.started || '')) byId.set(p.id, { ...p, club });
  }
}

// A guessable player needs every attribute the game compares on, or the
// feedback for that row would be blank and the rank meaningless.
const pool = [...byId.values()]
  .filter((p) => p.name && p.club && p.slot && p.nat && p.born)
  .map((p) => ({
    id: p.id, name: p.name, club: p.club, slot: p.slot,
    position: p.position, nat: p.nat, born: p.born, dob: p.dob || null,
    country: CLUB_COUNTRY?.[p.club] || null,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const dupes = pool.length - new Set(pool.map((p) => p.name)).size;

// ⚠️ A SCHEDULED ANSWER MAY NEVER FALL OUT OF THE POOL. Mystery's answer log is
// frozen the moment a puzzle is played — the number is load-bearing and the
// answers behind it cannot move. But this script derives the pool from
// squads.json, so ANY edit to that file silently re-decides who exists.
//
// Measured 2026-08-13, and this is not hypothetical: refreshing squads.json
// from Wikipedia's CURRENT first-team lists would have removed 246 of the 310
// scheduled answers — Messi, Pelé, Roberto Carlos, Simeone, Hazard — because a
// current squad by definition contains no retired players. Nothing would have
// errored. The pool would simply have shrunk and 246 future puzzles would have
// resolved to nothing.
//
// It survived only because this script is not in `npm run build`. That is luck,
// not protection, so the guarantee is asserted here instead: the write is
// refused outright if a single scheduled answer is missing. Growing the pool is
// always fine; shrinking it under a live schedule is not.
try {
  const { default: SCHED } = await import('../src/data/mysterySchedule.json', { with: { type: 'json' } });
  const days = Array.isArray(SCHED) ? SCHED : (SCHED.days || Object.values(SCHED)[0]);
  const scheduled = [...new Set((days || []).map((d) => (typeof d === 'string' ? d : d?.id || d?.answerId)).filter(Boolean))];
  const have = new Set(pool.map((x) => x.id));
  const lost = scheduled.filter((id) => !have.has(id));
  if (lost.length) {
    const { default: OLD } = await import('../src/data/mysteryPool.json', { with: { type: 'json' } });
    const nameOf = new Map(OLD.map((x) => [x.id, x.name]));
    console.error(`\n✗ REFUSING TO WRITE — ${lost.length} of ${scheduled.length} scheduled answers are missing from the new pool:`);
    console.error('   ' + lost.slice(0, 12).map((id) => nameOf.get(id) || id).join(', ') + (lost.length > 12 ? ` …and ${lost.length - 12} more` : ''));
    console.error('  Those puzzles are already scheduled and would resolve to nothing.');
    console.error('  The pool may GROW freely; it may not shrink under a live schedule.');
    process.exit(1);
  }
  console.log(`scheduled-answer check: all ${scheduled.length} still present ✓`);
} catch (e) {
  console.error('✗ could not verify the schedule — refusing to write:', e.message);
  process.exit(1);
}

writeFileSync('src/data/mysteryPool.json', JSON.stringify(pool, null, 0));
console.log(`pool: ${pool.length} players, ${new Set(pool.map(p => p.club)).size} clubs`);
console.log(`club country resolved: ${pool.filter(p => p.country).length}/${pool.length}`);
console.log(`remaining duplicate NAMES (different people): ${dupes}`);
const r = pool.find((p) => p.name === 'Marcus Rashford');
if (r) console.log(`Rashford resolved to: ${r.club}`);
