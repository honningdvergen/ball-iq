import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pickTeaserPair } from '../../src/components/FootleHero.jsx';
import { getWordleAnswer, getWordleDayIndex } from '../../src/lib/wordle.js';

/**
 * The Home card must never show you today's answer.
 *
 * ⚠️ IT WAS GOING TO, ON A DATE I CAN NAME. The morning/in-progress hero renders
 * a rotating sample solve — an imperfect guess graded by the real engine, then
 * the sample answer as an ALL-GREEN winning row. Both the teaser rotation and
 * the puzzle schedule key off `getWordleDayIndex()`, so collisions are not
 * random, they are dated:
 *
 *   2027-01-04   teaser answer KANTE === that day's real answer
 *                -> the most-viewed card in the app renders the answer, solved,
 *                   in green, before the player has guessed anything
 *   2026-10-03   teaser guess  PEDRI === that day's real answer
 *
 * This is the kind of defect that is invisible for months and then ruins one
 * specific day for everybody at once. Found while acting on scouting report #4,
 * which flagged the card for a different reason (see below) and did not notice
 * the grid could spoil the puzzle.
 *
 * The second defect the report DID find: this grid rendered the sample solve in
 * every unfinished state, including IN PROGRESS — so a player who had guessed
 * once saw an all-green winning row beside a CTA reading "Continue · 1/6 used".
 * Someone else's solved board, presented as theirs. They now see their own rows.
 */

const SRC = readFileSync(
  fileURLToPath(new URL('../../src/components/FootleHero.jsx', import.meta.url)),
  'utf8',
);

describe('the Footle hero teaser never spoils the puzzle', () => {
  it('no day in the next 420 shows the answer in the sample grid', () => {
    // Behavioural, not structural: walks the REAL schedule through the REAL
    // selection function. Mutation check — reverting pickTeaserPair to a plain
    // `TEASER_PAIRS[dayIndex % len]` reproduces the 2027-01-04 collision.
    const start = new Date('2026-08-24T12:00:00Z');
    const spoilers = [];
    let checked = 0;
    for (let d = 0; d < 420; d += 1) {
      const day = new Date(start.getTime() + d * 86400000);
      const answer = getWordleAnswer(day);
      if (!answer) continue;
      checked += 1;
      const [guess, sampleAnswer] = pickTeaserPair(getWordleDayIndex(day), answer);
      if (guess === answer || sampleAnswer === answer) {
        spoilers.push(`${day.toISOString().slice(0, 10)} — teaser ${guess}/${sampleAnswer} vs answer ${answer}`);
      }
    }
    // ⚠️ A zero is only meaningful if the walk saw anything.
    expect(checked, 'the schedule walk went blind').toBeGreaterThan(400);
    expect(
      spoilers,
      '\n  The Home card would render today\'s answer in its sample grid.\n  ' +
      spoilers.join('\n  ') + '\n',
    ).toEqual([]);
  });

  it('the pair is still deterministic for a given day', () => {
    // Everyone must see the same sample on the same day — it is shared content,
    // and a per-render pick would also flicker on every re-render.
    const answer = getWordleAnswer(new Date('2026-09-01T12:00:00Z'));
    const a = pickTeaserPair(5, answer);
    const b = pickTeaserPair(5, answer);
    expect(a).toEqual(b);
  });

  it('an in-progress player is shown their OWN board, not a sample', () => {
    // Structural: the grid branches on inProgress and renders the stored
    // guesses. The sample is only for someone who has not started.
    expect(/\{inProgress && grades\.length > 0 \? \(/.test(SRC),
      'the grid must branch on in-progress').toBe(true);
    expect(/grades\.slice\(-PREVIEW_ROWS\)\.map/.test(SRC),
      'in-progress must render the player\'s own graded rows').toBe(true);
    expect(/if \(!isDone && !inProgress\) return \{ guesses: \[\], grades: \[\] \};/.test(SRC),
      'guesses must be loaded while in progress, not only when finished').toBe(true);
  });
});
