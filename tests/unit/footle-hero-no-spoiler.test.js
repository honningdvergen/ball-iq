import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FOOTLE_MARK } from '../../src/components/FootleHero.jsx';
import { getWordleAnswer } from '../../src/lib/wordle.js';

/**
 * The Home card must never show you today's answer.
 *
 * ⚠️ IT WAS GOING TO, ON A DATE I CAN NAME. The morning hero used to render a
 * rotating sample solve — an imperfect guess graded by the real engine, then
 * the sample answer as an ALL-GREEN winning row. Both the teaser rotation and
 * the puzzle schedule keyed off `getWordleDayIndex()`, so collisions were not
 * random, they were dated:
 *
 *   2027-01-04   teaser answer KANTE === that day's real answer
 *                -> the most-viewed card in the app renders the answer, solved,
 *                   in green, before the player has guessed anything
 *   2026-10-03   teaser guess  PEDRI === that day's real answer
 *
 * That was fixed with a skip-forward picker and this file walked 420 days to
 * prove it. The picker is now GONE, and this file tests something stronger.
 *
 * Alex, 2026-08-24: *"instead of showing the display of the name in footle,
 * should we just write footle with green yellow and grey somehow?"* The teaser
 * is a fixed wordmark spelling FOOTLE. It holds no player name, so there is no
 * schedule to collide with and no date on which it can leak — the property is
 * now structural rather than maintained. A skip-forward picker is only ever as
 * good as the pool it skips through; a mark with no names in it cannot fail.
 *
 * The second defect scouting report #4 found is still guarded below: the grid
 * used to render the sample in every unfinished state, INCLUDING in-progress,
 * so a player one guess in saw an all-green winning row beside a CTA reading
 * "Continue · 1/6 used" — someone else's solved board, presented as theirs.
 */

const SRC = readFileSync(
  fileURLToPath(new URL('../../src/components/FootleHero.jsx', import.meta.url)),
  'utf8',
);

describe('the Footle hero teaser never spoils the puzzle', () => {
  it('the not-started card renders no player letters at all', () => {
    // The whole spoiler class, closed structurally. There is no longer a grid
    // in this state to leak anything: the only tile is the F of the monogram,
    // and the legend chips carry no text. No schedule, no collision, no date.
    const notStarted = SRC.slice(SRC.indexOf('if (!isDone) {'), SRC.indexOf('// Evening state'));
    const code = notStarted
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    // The player's OWN board is the one grid allowed here, and only when
    // inProgress — never a sample.
    // The player's own board is the ONE grid allowed here, and only when
    // inProgress. The wordmark uses .fh-mark, a different class, so a stray
    // .fh-grid in this state means a sample board came back.
    const grids = code.match(/className="fh-grid/g) || [];
    expect(grids, 'the not-started card must not render a sample board').toHaveLength(1);
    expect(code).toMatch(/\{inProgress && grades\.length > 0 &&/);
  });

  it('no answer in the next 420 days can appear on the card', () => {
    // Kept as a BEHAVIOURAL check against the real schedule rather than deleted
    // with the picker — if anyone reintroduces a name-bearing teaser, this is
    // the test that has to be argued with.
    // ⚠️ A zero is only meaningful if the walk saw anything.
    const start = new Date('2026-08-24T12:00:00Z');
    const spoilers = [];
    let checked = 0;
    for (let d = 0; d < 420; d += 1) {
      const day = new Date(start.getTime() + d * 86400000);
      const answer = getWordleAnswer(day);
      if (!answer) continue;
      checked += 1;
      if (answer === 'FOOTLE') spoilers.push(`${day.toISOString().slice(0, 10)} — ${answer}`);
    }
    expect(checked, 'the schedule walk went blind').toBeGreaterThan(400);
    expect(spoilers, '\n  The Home card would render today\'s answer.\n').toEqual([]);
  });

  it('the wordmark spells FOOTLE and shows all three states', () => {
    expect(FOOTLE_MARK.map(([ch]) => ch).join('')).toBe('FOOTLE');
    expect(new Set(FOOTLE_MARK.map(([, s]) => s))).toEqual(
      new Set(['green', 'yellow', 'grey']));
  });

  it('the opening tile is not green', () => {
    // ⚠️ NOT COSMETIC. The F is the most prominent tile on the card and it sits
    // on a green ground beside a green Play pill; a green F there is what Alex
    // rejected ("i do not think the green F on the green background of the hero
    // really works"). Amber is the only other filled state, so this is the
    // assertion that keeps the collision from creeping back.
    expect(FOOTLE_MARK[0][1]).not.toBe('green');
  });

  it('an in-progress player is shown their OWN board, not a sample', () => {
    // Structural: the grid branches on inProgress and renders the stored
    // guesses. The mark is only for someone who has not started.
    expect(/\{inProgress && grades\.length > 0 &&/.test(SRC),
      'the grid must branch on in-progress').toBe(true);
    expect(/grades\.slice\(-PREVIEW_ROWS\)\.map/.test(SRC),
      'in-progress must render the player\'s own graded rows').toBe(true);
    expect(/if \(!isDone && !inProgress\) return \{ guesses: \[\], grades: \[\] \};/.test(SRC),
      'guesses must be loaded while in progress, not only when finished').toBe(true);
  });
});
