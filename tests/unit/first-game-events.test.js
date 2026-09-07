import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * "Started a game" must mean somebody played, not that a screen rendered.
 *
 * `first-game-started` fired off the `playing` predicate, which is derived from
 * `screen`, which the boot router sets straight from the URL. Every /footle
 * share landing, every ?game= door and every club-page hand-off counted as a
 * started game with no interaction at all. Its denominator was landings — which
 * is why "1,045 started, 53 finished, 5%" is not a rate, and why the in-game
 * leak it was used to argue does not follow from it.
 *
 * The name was RENAMED rather than repointed. Repointing would have silently
 * redefined 30 days of existing rows; renaming leaves them queryable and
 * correct as what they always were.
 */
const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
const code = APP.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

describe('the first-game events say what they mean', () => {
  it('the render-fired event is no longer called "started"', () => {
    expect(code, 'the old name must not be written any more').not.toMatch(/loopEvent\("first-game-started"/);
    expect(code).toMatch(/loopEvent\("first-game-reached"/);
  });

  it('a separate event fires only on real input', () => {
    expect(code).toMatch(/loopEvent\("first-game-played"/);
    // The listeners are what make it input-fired; without them it is just
    // another render event with a better name.
    expect(code).toMatch(/addEventListener\("pointerdown", fire/);
    expect(code).toMatch(/addEventListener\("keydown", fire/);
  });

  it('the two use different storage keys, so old devices are not excluded', () => {
    // biq_first_game_started is already set on every device that ever reached a
    // game. Reusing it would mean the new series could never fire for them.
    expect(code).toMatch(/biq_first_game_started/);
    expect(code).toMatch(/biq_first_game_played/);
  });

  it('the input listener is bound to the game predicate, not to a launcher', () => {
    // Seven game screens, one gesture. Hooking launchers means seven hooks that
    // drift; the effect keys off `playing`, as its render-fired sibling does.
    const eff = code.slice(code.indexOf('biq_first_game_played') - 400, code.indexOf('biq_first_game_played') + 200);
    expect(eff).toMatch(/if \(!playing\) return;/);
  });
});
