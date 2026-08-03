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
writeFileSync('src/data/mysteryPool.json', JSON.stringify(pool, null, 0));
console.log(`pool: ${pool.length} players, ${new Set(pool.map(p => p.club)).size} clubs`);
console.log(`club country resolved: ${pool.filter(p => p.country).length}/${pool.length}`);
console.log(`remaining duplicate NAMES (different people): ${dupes}`);
const r = pool.find((p) => p.name === 'Marcus Rashford');
if (r) console.log(`Rashford resolved to: ${r.club}`);
