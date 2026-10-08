import { describe, it, expect } from 'vitest';
import { clubAbbr } from '../../src/lib/clubColour.js';
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
});
