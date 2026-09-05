import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The Footle board may never grow taller than the screen it has to fit in.
 *
 * ⚠️ THIS BUG HAS SHIPPED TWICE, THE SECOND TIME AS THE FIRST ONE'S BLIND SPOT.
 *
 * Sprint #82: 4- and 5-letter answers ballooned the row, tiles hit ~84px, and
 * six rows of them pushed the keyboard off an iPhone 14 Pro. The fix capped
 * tile WIDTH at 64px, and the comment in app.css still explains it that way.
 *
 * 2026-08-30, build 107, reported by a real player on a 5-letter answer
 * (MESSI): the ENTER button was a sliver at the bottom edge, and "came back"
 * after the first guess. It was never a touch bug — the first guess unmounts
 * the legend row, freeing ~29px, so the button that had been BELOW THE FOLD
 * came into view. Measured at 360x784 with five columns: ENTER's bottom sat
 * at 788px inside a 791px viewport. Three pixels.
 *
 * Why the first fix could not prevent the second bug: a tile is SQUARE.
 * Capping its width also fixes its height, so the width cap silently decides
 * how tall six rows are — and nothing ever compared that number to the
 * viewport. Worse, the two bugs are inversely triggered: a SHORT answer makes
 * the TALLEST board, so the case the width cap was written for is exactly the
 * case that overflows vertically.
 *
 * Hence this gate: the row's max-width must be a function of a cap that is
 * itself derived from the viewport HEIGHT. A future refactor that reinstates
 * a purely width-derived cap (the obvious "simplification" — the numbers look
 * redundant) would reintroduce a bug no test, type or lint could otherwise
 * see, on the app's most-played mode.
 *
 * Related standing rule: gate the invariant, or make the drift impossible.
 */

const CSS = readFileSync(
  fileURLToPath(new URL('../../src/games/footle.css', import.meta.url)),
  'utf8',
);

// Declarations that size a playable board row, minus the game-over variant
// (a different, non-interactive layout with no keyboard beneath it).
const rowRules = CSS.split('\n').filter(
  (l) => l.includes('.wd-row{') && !l.includes('--ended'),
);

describe('footle board fits the screen', () => {
  it('sizes rows from a cap, not a bare pixel literal', () => {
    expect(rowRules.length).toBeGreaterThan(0);
    for (const rule of rowRules) {
      const maxWidth = /max-width:([^;}]+)/.exec(rule)?.[1] ?? '';
      expect(
        maxWidth,
        'A .wd-row max-width must be built from var(--wd-tile-cap) so the ' +
          'height budget can shrink it. A hardcoded per-tile pixel value is ' +
          'the Sprint #82 shape that shipped the ENTER-below-the-fold bug. ' +
          `Offending rule: ${rule.trim().slice(0, 120)}`,
      ).toMatch(/var\(--wd-tile-cap/);
    }
  });

  it('derives that cap from viewport HEIGHT, not width alone', () => {
    const capDecl = /--wd-tile-cap:([^;}]+)/.exec(CSS)?.[1] ?? '';
    expect(capDecl, '--wd-tile-cap must be declared in app.css').not.toBe('');
    // dvh, not vh: iOS Safari's vh is the LARGEST viewport (URL bar hidden),
    // which over-reports the space actually available and would hand back the
    // exact overflow this gate exists to prevent.
    expect(
      capDecl,
      'The tile cap must include a dynamic-viewport-height term — that is ' +
        'the whole point: six square rows have to fit the space left after ' +
        'the header, legend and keyboard.',
    ).toMatch(/dvh/);
    // It must still respect a ceiling, or tall screens grow tiles without
    // limit and re-create the Sprint #82 horizontal ballooning.
    expect(
      capDecl,
      'The cap must stay bounded above (clamp/min) so tall screens do not ' +
        'balloon the tiles — the bug the width cap was written for.',
    ).toMatch(/clamp\(|min\(/);
  });

  it('keeps a usable floor so the board never collapses', () => {
    const floorDecl = /--wd-tile-cap:\s*clamp\(([^,]+),/.exec(CSS)?.[1] ?? '';
    const floor = parseInt(floorDecl, 10);
    expect(
      Number.isFinite(floor) && floor >= 20,
      `The clamp floor (${floorDecl || 'missing'}) must be a real minimum ` +
        'tile size — an unbounded shrink trades an unreachable button for ' +
        'an unreadable board.',
    ).toBe(true);
  });
});
