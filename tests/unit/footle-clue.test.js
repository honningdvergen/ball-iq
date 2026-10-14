import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  WORDLE_ANSWER_POOL, WORDLE_ANSWER_LOG, WORDLE_FULL_NAMES,
  footleClue, footleShareHead, FOOTLE_CLUE_AFTER,
} from '../../src/lib/wordle.js';

const src = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');

/**
 * THE FOOTLE CLUE. Footle lost 30% of plays (230/764) in the 30 days to
 * 2026-10-04, so after three misses a player may take one clue built only
 * from WORDLE_FULL_NAMES. These pins keep it honest: it exists for every
 * answer that can be drawn, it never prints the surname, and every share
 * builder marks a clued result the same way.
 */
describe('footle clue', () => {
  const answers = [...new Set([...WORDLE_ANSWER_POOL, ...WORDLE_ANSWER_LOG])];

  it('has a clue for every answer that can be drawn, and never spells the answer', () => {
    for (const a of answers) {
      const c = footleClue(a);
      expect(c, a).toMatch(/^(First name starts with [A-Z]|Goes by a single name)$/);
      const [, surname] = WORDLE_FULL_NAMES[a] || ['', a];
      expect(c.toUpperCase().includes(a), a).toBe(false);
      expect(c.includes(surname), a).toBe(false);
    }
  });

  it('reads the first name, not a middle one', () => {
    expect(footleClue('WILKINS')).toBe('First name starts with R');
    expect(footleClue('NEYMAR')).toBe('Goes by a single name');
  });

  it('is offered only after three misses', () => {
    expect(FOOTLE_CLUE_AFTER).toBe(3);
  });

  it('marks a clued share, and leaves a clean one exactly as before', () => {
    expect(footleShareHead('Ball IQ', 154, true, 3, false)).toBe('⚽ Ball IQ Footle #154 3/6');
    expect(footleShareHead('Ball IQ', 154, true, 4, true)).toBe('⚽ Ball IQ Footle #154 4/6 💡');
    expect(footleShareHead('Ball IQ', 154, false, 6, true)).toBe('⚽ Ball IQ Footle #154 X/6 💡');
  });

  it('is the one head every share builder prints', () => {
    for (const f of ['games/FootballWordle.jsx', 'components/FootleHero.jsx', 'screens/ReviewScreens.jsx']) {
      const s = src(f);
      expect(s, f).toMatch(/footleShareHead\(/);
      expect(s, f).not.toMatch(/Footle\$\{tag\}/);
    }
  });

  it('keeps the clue in the saved record when a guess lands', () => {
    // submitGuess used to write a fresh { guesses, status } object, which
    // would silently drop `clue` on the next guess after taking it.
    expect(src('games/FootballWordle.jsx')).toMatch(/setState\(\{ \.\.\.state, guesses: newGuesses, status: newStatus[ ,]/);
  });
});

// Hard mode (14 Oct 2026): opt-in, real names only. The list must hold every
// answer Footle can ever ask for, or a hard-mode player could be refused the
// right answer; the generator refuses to write a list that misses one.
describe('footle hard mode', () => {
  it('accepts every Footle answer and real names, and refuses made-up letters', async () => {
    const { WORDLE_PLAYERS } = await import('../../src/lib/wordle.js');
    const names = new Set((await import('../../src/data/footleNames.json')).default);
    for (const w of WORDLE_PLAYERS) if (w.length >= 4 && w.length <= 9) expect(names.has(w), w).toBe(true);
    for (const w of ['VANDIJK', 'DEBRUYNE', 'VINICIUS', 'HAALAND']) expect(names.has(w), w).toBe(true);
    for (const w of ['AEIOUSTL', 'QWERTY', 'ZZZZZ']) expect(names.has(w), w).toBe(false);
  });

  it('a hard game says so on the share', async () => {
    const { footleShareHead } = await import('../../src/lib/wordle.js');
    expect(footleShareHead('Ball IQ', 164, true, 4, false, true)).toContain('4/6 Hard');
    expect(footleShareHead('Ball IQ', 164, true, 4, false)).not.toContain('Hard');
  });
});
