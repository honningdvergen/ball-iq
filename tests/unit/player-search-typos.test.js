// The forgiving pass in rankPlayerSuggestions (lib/playerSearch.js): a guess
// box finds the player when the name is typed nearly right, not only exactly.
// Alex, 23 Oct 2026: "Mikita" and other honest attempts at hard names found
// nobody. The cases are real misspellings of real pool players.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { rankPlayerSuggestions } from '../../src/lib/playerSearch.js';

const raw = JSON.parse(readFileSync(new URL('../../src/data/mysteryPool.json', import.meta.url), 'utf8'));
const POOL = Array.isArray(raw) ? raw : raw.players;
const first = (q) => rankPlayerSuggestions(POOL, q, { limit: 5 })[0]?.name;

describe('a near miss still finds the player', () => {
  it.each([
    ['Lewandoski', 'Robert Lewandowski'],
    ['Szesny', 'Wojciech Szczęsny'],
    ['Odegard', 'Martin Ødegaard'],
    ['Mbape', 'Kylian Mbappé'],
    ['Kvaratskelia', 'Khvicha Kvaratskhelia'],
    ['Halland', 'Erling Haaland'],
    ['Gvardol', 'Joško Gvardiol'],
    ['Ibrahimovich', 'Zlatan Ibrahimović'],
  ])('%s → %s', (q, name) => { expect(first(q)).toBe(name); });

  it('an exact match still leads, ahead of any near one', () => {
    expect(first('Saka')).toBe('Bukayo Saka');
    expect(first('Ronaldo')).toBe('Cristiano Ronaldo');
  });

  it('short queries are not fuzzed (three letters would match half the pool)', () => {
    const r = rankPlayerSuggestions(POOL, 'xqz', { limit: 5 });
    expect(r).toEqual([]);
  });

  it('is quick enough to run on every keystroke', () => {
    const t0 = performance.now();
    for (const q of ['Mikita', 'Lewandoski', 'Kvaratskelia', 'Gvardol']) rankPlayerSuggestions(POOL, q, { limit: 30 });
    expect(performance.now() - t0).toBeLessThan(400);
  });
});
