import { describe, it, expect } from 'vitest';
import { clubAbbr, CLUB_COLOUR_ALIASES } from '../../src/lib/clubColour.js';
import { CLUB_PACK_ABBR } from '../../src/data/clubPackColours.js';
import { TRAIL_PLAYERS } from '../../src/lib/trail.js';

/**
 * The crest on a Transfer Trail rung is three letters. On 8 Oct 2026 the
 * simulator showed puzzle No. 67 with "Borussia M.gladbach" and "Borussia
 * Dortmund" one above the other, both as "BOR": two different clubs wearing the
 * same badge in one career, in a game that is about telling clubs apart.
 */
describe('Transfer Trail crest letters', () => {
  it('never gives two different clubs in one career the same letters', () => {
    const clashes = [];
    for (const p of TRAIL_PLAYERS) {
      const byLetters = new Map();
      for (const club of new Set(p.clubs)) {
        const a = clubAbbr(club, CLUB_PACK_ABBR);
        byLetters.set(a, [...(byLetters.get(a) || []), club]);
      }
      for (const [a, clubs] of byLetters) if (clubs.length > 1) clashes.push(`${p.key}: ${a} = ${clubs.join(' | ')}`);
    }
    expect(clashes).toEqual([]);
  });

  it('gives the two Borussias their own letters', () => {
    expect(clubAbbr('Borussia Dortmund', CLUB_PACK_ABBR)).toBe('BVB');
    expect(clubAbbr('Borussia M.gladbach', CLUB_PACK_ABBR)).toBe('BMG');
  });

  // 24 Nov 2026: a grade of the live app found "REA" on Real Betis, which reads
  // as Real Madrid. The check above only looks inside one career; these look at
  // every club the game names.
  const squash = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const allClubs = [...new Set(TRAIL_PLAYERS.flatMap((p) => p.clubs))].sort();

  // One club that careers spell two ways. Anything not listed is a different
  // club. (A hyphen or an accent is not a different spelling: "Al Ahli" and
  // "Al-Ahli" count as one name here, though one is in Doha and one in Jeddah.)
  const SAME_CLUB = [
    ['Bayer Leverkusen', 'Leverkusen'],
    ['Blackburn', 'Blackburn Rovers'],
    ['Borussia Dortmund', 'Dortmund'],
    ['Inter', 'Inter Milan'],
    ['Leicester', 'Leicester City'],
    ['Newcastle', 'Newcastle United'],
    ['PSV', 'PSV Eindhoven'],
    ['RB Salzburg', 'Red Bull Salzburg'],
    ['VfL Wolfsburg', 'Wolfsburg'],
  ];
  const clubId = (name) => squash((SAME_CLUB.find((g) => g.includes(name)) || [name])[0]);

  it('never gives two different clubs anywhere in the careers the same letters', () => {
    const byLetters = new Map();
    for (const club of allClubs) {
      const a = clubAbbr(club, CLUB_PACK_ABBR);
      byLetters.set(a, [...(byLetters.get(a) || []), club]);
    }
    const clashes = [];
    for (const [a, clubs] of byLetters) if (new Set(clubs.map(clubId)).size > 1) clashes.push(`${a} = ${clubs.join(' | ')}`);
    expect(clashes).toEqual([]);
  });

  // A quiz pack's letters are that club's everywhere in the app (Home, its own
  // page). A career club may wear them only if it IS that club: the same name,
  // an alias of it, or one of the fuller spellings listed here.
  const PACK_OF = {
    'Athletic Bilbao': 'Athletic', 'Blackburn Rovers': 'Blackburn', 'Boca Juniors': 'Boca', 'Bolton Wanderers': 'Bolton',
    'Borussia Mönchengladbach': 'Gladbach', 'Crystal Palace': 'Palace', 'Hajduk Split': 'Hajduk', 'Leicester City': 'Leicester',
    'Preston North End': 'Preston', 'RB Leipzig': 'Leipzig', 'Racing Club': 'Racing', 'River Plate': 'River', 'VfB Stuttgart': 'Stuttgart',
    'Real Betis': 'Betis', 'Celta Vigo': 'Celta', 'Eintracht Frankfurt': 'Frankfurt',
  };
  it('never gives a club the letters of a different club that has a quiz pack', () => {
    const owner = Object.fromEntries(Object.entries(CLUB_PACK_ABBR).map(([pack, a]) => [a, pack]));
    const aliasKey = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const isThatClub = (club, pack) => {
      const want = squash(club), p = squash(pack);
      if (want === p || PACK_OF[club] === pack) return true;
      if (squash(CLUB_COLOUR_ALIASES[aliasKey(club)]) === p) return true;
      return Object.entries(CLUB_COLOUR_ALIASES).some(([alias, formal]) => squash(formal) === want && squash(alias) === p);
    };
    const wrong = [];
    for (const club of allClubs) {
      const a = clubAbbr(club, CLUB_PACK_ABBR);
      if (owner[a] && !isThatClub(club, owner[a])) wrong.push(`${club} wears ${a}, which is ${owner[a]}'s`);
    }
    expect(wrong).toEqual([]);
  });

  it('a pack keeps its own letters, and the three packs with a shorter id lend them to the career spelling', () => {
    for (const [pack, a] of Object.entries(CLUB_PACK_ABBR)) expect(clubAbbr(pack, CLUB_PACK_ABBR), pack).toBe(a);
    expect(clubAbbr('Real Betis', CLUB_PACK_ABBR)).toBe(CLUB_PACK_ABBR.Betis);
    expect(clubAbbr('Celta Vigo', CLUB_PACK_ABBR)).toBe(CLUB_PACK_ABBR.Celta);
    expect(clubAbbr('Eintracht Frankfurt', CLUB_PACK_ABBR)).toBe(CLUB_PACK_ABBR.Frankfurt);
  });

  it('REA is nobody: not Real Betis, not Reading', () => {
    expect(clubAbbr('Real Betis', CLUB_PACK_ABBR)).toBe('BET');
    expect(clubAbbr('Reading', CLUB_PACK_ABBR)).toBe('RDG');
    expect(clubAbbr('Real Madrid', CLUB_PACK_ABBR)).toBe('RMA');
    expect(allClubs.filter((c) => clubAbbr(c, CLUB_PACK_ABBR) === 'REA')).toEqual([]);
  });
});
