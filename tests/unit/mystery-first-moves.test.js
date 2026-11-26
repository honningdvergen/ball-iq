import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Mystery Player's first moves (11 Nov 2026): three tappable guesses, so the
 * start is not a search box over nine thousand names and an empty screen. They
 * must give nothing away, and they must be footballers: the first build
 * offered a prime minister.
 */
const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const SRC = read('../../src/screens/MysteryPlayer.jsx');
const POOL = JSON.parse(read('../../src/data/mysteryPool.json'));
const KNOWN = new Set(JSON.parse(read('../../src/data/mysteryAnswers.json')));

describe('Mystery Player first moves', () => {
  // Since 26 Nov 2026 (R5, R7): no free clues, so the starters may no longer
  // be picked by the answer's position and decade. They come from
  // startersForDay (lib/mysteryRules.js, tested in mystery-rules.test.js):
  // curated answers only, one from each of three lines, never the answer.
  const block = SRC.match(/const starters = useMemo\(\(\) => \{[\s\S]*?\}, \[POOL, answer, dayIndex\]\);/)?.[0] || '';
  it('are drawn from the curated footballers by startersForDay, never by the answer\'s position or era', () => {
    expect(block).toContain('KNOWN_PLAYERS.has(p.id)');
    expect(block).toContain('startersForDay(dayIndex, answer.id, known)');
    expect(block).not.toMatch(/answer\.slot|answer\.born/);
    expect(SRC).toContain('import ANSWER_IDS from "../data/mysteryAnswers.json";');
  });
  it('show only before the first guess, and a tap on the Guess pill makes the guess', () => {
    expect(SRC).toContain('{!done && rows.length === 0 && !q && starters.length > 0 && (');
    expect(SRC).toMatch(/className="mq-go" onClick=\{\(\) => submit\(p\)\}/);
  });
  it('the curated list does not hold the politician the open pool does', () => {
    const orban = POOL.find((p) => /Viktor Orb/.test(p.name));
    expect(orban, 'still in the guessable pool').toBeTruthy();
    expect(KNOWN.has(orban.id)).toBe(false);
  });
});
