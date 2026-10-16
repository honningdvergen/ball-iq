// Teach on a wrong guess (design review, 15 Oct 2026, section 2).
//
// Transfer Trail: Radamel Falcao, guessed against Atlético Madrid then Man
// Utd, was struck through without a word although he played for both. Mystery
// Player: seven megastar openers came back cold with "Born 6 years apart" or
// "Different era", which never said whether to think older or younger.
// These tests hold both lines to the real data, and hold them to saying only
// what that data says.
import { describe, it, expect } from 'vitest';
import {
  TRAIL_PLAYERS, trailClubKey, guessCareers, playedForAll, wrongPathNote,
} from '../../src/lib/trail.js';
import { careerOf, withCareerFixes } from '../../src/lib/mysteryCareer.js';
import { explainGuess, reasonLine } from '../../src/lib/mysteryPlayer.js';
import { suggestionSubtitle } from '../../src/lib/playerSearch.js';
import pool from '../../src/data/mysteryPool.json';
import rawCareers from '../../src/data/mysteryCareers.json';
import fixes from '../../src/data/mysteryCareerFixes.json';

const careers = withCareerFixes(rawCareers, fixes);
const known = (name) => guessCareers(name, { pool, careers, careerOf });
const byName = (n) => pool.find((p) => p.name === n);

describe('Transfer Trail: a wrong guess that fits the board says so', () => {
  const opening = ['Atlético Madrid', 'Man Utd'];          // Trail No. 74, David de Gea
  const third = ['Atlético Madrid', 'Man Utd', 'Fiorentina'];

  it('spells a Trail club and a careers club the same way', () => {
    expect(trailClubKey('Man Utd')).toBe(trailClubKey('Manchester United'));
    expect(trailClubKey('PSG')).toBe(trailClubKey('Paris Saint-Germain'));
    expect(trailClubKey('Atlético Madrid')).toBe(trailClubKey('Atletico Madrid'));
    expect(trailClubKey('Leverkusen')).toBe(trailClubKey('Bayer Leverkusen'));
    // Different clubs stay different.
    expect(trailClubKey('Man Utd')).not.toBe(trailClubKey('Man City'));
    expect(trailClubKey('Inter')).not.toBe(trailClubKey('Inter Miami'));
  });

  it('names Falcao on the board the review played', () => {
    expect(known('Radamel Falcao')).toHaveLength(1);
    expect(wrongPathNote('Radamel Falcao', known('Radamel Falcao'), opening))
      .toBe('Radamel Falcao played for both, wrong path');
  });

  it('stays true after the next club appears', () => {
    // Guessed against two clubs; Fiorentina, which he never joined, came next.
    expect(wrongPathNote('Radamel Falcao', known('Radamel Falcao'), third, opening))
      .toBe('Radamel Falcao played for the first two, wrong path');
    // Judged against three from the start, he does not fit and nothing is said.
    expect(wrongPathNote('Radamel Falcao', known('Radamel Falcao'), third)).toBeNull();
  });

  it('says nothing for a guess that misses a club', () => {
    expect(wrongPathNote('Wayne Rooney', known('Wayne Rooney'), opening)).toBeNull();
    expect(wrongPathNote('Lionel Messi', known('Lionel Messi'), opening)).toBeNull();
  });

  it('says nothing when nothing is known about the name', () => {
    expect(guessCareers('Nobody Atall', { pool, careers, careerOf })).toEqual([]);
    expect(wrongPathNote('Nobody Atall', [], opening)).toBeNull();
    // Before the careers file has loaded, only Trail careers are known.
    expect(guessCareers('Radamel Falcao', { pool })).toEqual([]);
  });

  it('prefers the checked Trail career to the generated one', () => {
    // Piqué's careers-file record has lost Barcelona; his Trail career has it.
    const pique = guessCareers('Gerard Piqué', { pool, careers, careerOf });
    expect(pique).toEqual([TRAIL_PLAYERS.find((p) => p.key === 'PIQUE').clubs]);
    expect(wrongPathNote('Gerard Piqué', pique, ['Man Utd', 'Barcelona'])).toBe('Gerard Piqué played for both, wrong path');
  });

  it('counts a club once, and counts past two in words', () => {
    const hummels = [TRAIL_PLAYERS.find((p) => p.key === 'HUMMELS').clubs];
    expect(wrongPathNote('Mats Hummels', hummels, ['Bayern Munich', 'Borussia Dortmund', 'Bayern Munich']))
      .toBe('Mats Hummels played for both, wrong path');
    expect(wrongPathNote('Mats Hummels', hummels, ['Bayern Munich', 'Borussia Dortmund', 'Roma']))
      .toBe('Mats Hummels played for all three, wrong path');
  });

  it('needs every player a shared name could mean to fit', () => {
    const fits = ['Atlético Madrid', 'Manchester United'];
    const misses = ['Atlético Madrid', 'Porto'];
    expect(wrongPathNote('A. Namesake', [fits, fits], opening)).toBe('A. Namesake played for both, wrong path');
    expect(wrongPathNote('A. Namesake', [fits, misses], opening)).toBeNull();
    expect(playedForAll(fits, [])).toBe(false);
  });

  it('reads the careers file in Trail spellings: most Trail answers fit their own board', () => {
    // A Trail club the alias table cannot match is silence, never a wrong
    // claim. This holds the table to covering nearly every board: each Trail
    // answer found in the pool, read through the careers file, against his own
    // opening two clubs. The misses are holes in the careers file (Piqué's
    // Barcelona, Torres's Atlético), not spellings.
    let tried = 0, fit = 0;
    const misses = [];
    for (const t of TRAIL_PLAYERS) {
      const recs = pool.filter((p) => p.name === t.display.filter(Boolean).join(' '));
      if (recs.length !== 1) continue;
      tried++;
      if (playedForAll(careerOf(recs[0], careers).map((s) => s.club), t.clubs.slice(0, 2))) fit++;
      else misses.push(t.key);
    }
    expect(tried).toBeGreaterThan(150);
    expect(fit / tried, misses.join(' ')).toBeGreaterThan(0.85);
  });
});

describe('Transfer Trail: the name list shows the birth year only', () => {
  it('drops the club under a name, which the board would be read against', () => {
    const deGea = byName('David de Gea');
    expect(suggestionSubtitle(deGea, { club: false })).toBe('1990');
    // Mystery Player keeps the club, which it uses to tell namesakes apart.
    expect(suggestionSubtitle(deGea)).toMatch(/^1990 · /);
  });
});

describe('Mystery Player: the era says which way', () => {
  // Salah's day, No. 74: the review's cold openers, born 1977 to 1998.
  const salah = byName('Mohamed Salah');
  const line = (n) => reasonLine(explainGuess(byName(n), salah, careers));

  it('tells an older guess from a younger one', () => {
    expect(line('Robert Lewandowski')).toBe('No shared club · Same position · Same era, born earlier');
    expect(line('Kylian Mbappé')).toBe('No shared club · Same position · Born 6 years later');
    expect(line('Wayne Rooney')).toBe('No shared club · Same position · Born 7 years earlier');
    expect(line('Thierry Henry')).toBe('No shared club · Same position · Earlier era');
    expect(line('Sergio Ramos')).toBe('No shared club, born 6 years earlier');
  });

  it('keeps the reason a club gives, and adds the direction after it', () => {
    expect(line('Kevin De Bruyne')).toBe('Shared Chelsea · Same era, born earlier');
  });

  it('never points the wrong way, for anyone in the pool', () => {
    const wrong = [];
    for (const p of pool) {
      if (p.id === salah.id) continue;
      const x = explainGuess(p, salah, null);
      if (!p.born || !salah.born || p.born === salah.born) { if (x.bornWhen !== null) wrong.push(p.name); continue; }
      if (x.bornWhen !== (p.born < salah.born ? 'earlier' : 'later')) wrong.push(p.name);
    }
    expect(wrong).toEqual([]);
  });
});
