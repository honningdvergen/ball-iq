import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Mystery Player's first moves (11 Nov 2026): three tappable guesses under the
 * free clues, so the start is not a search box over nine thousand names and an
 * empty screen. They must give away nothing the two free clues have not, and
 * they must be footballers: the first build offered a prime minister.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const SRC = read('../../src/screens/MysteryPlayer.jsx');
const POOL = JSON.parse(read('../../src/data/mysteryPool.json'));
const KNOWN = new Set(JSON.parse(read('../../src/data/mysteryAnswers.json')));

describe('Mystery Player first moves', () => {
  const block = SRC.match(/const starters = useMemo\(\(\) => \{[\s\S]*?\}, \[POOL, answer, dayIndex\]\);/)?.[0] || '';
  it('are drawn from the curated footballers, by the two free clues, never the answer', () => {
    expect(block).toContain('KNOWN_PLAYERS.has(p.id)');
    expect(block).toContain('p.id !== answer.id');
    expect(block).toContain('p.slot === answer.slot');
    expect(block).toContain('dec(p.born) === dec(answer.born)');
    expect(SRC).toContain('import ANSWER_IDS from "../data/mysteryAnswers.json";');
  });
  it('are not a fixed top three (the answer would be the famous name missing)', () => {
    expect(block).toContain('.slice(0, 8)');
    expect(block).toContain('dayIndex');
  });
  it('show only before the first guess, and a tap makes the guess', () => {
    expect(SRC).toContain('{!done && rows.length === 0 && starters.length > 0 && (');
    expect(SRC).toMatch(/className="mp-start-row" onClick=\{\(\) => submit\(p\)\}/);
  });
  it('the curated list does not hold the politician the open pool does', () => {
    const orban = POOL.find((p) => /Viktor Orb/.test(p.name));
    expect(orban, 'still in the guessable pool').toBeTruthy();
    expect(KNOWN.has(orban.id)).toBe(false);
  });
});
