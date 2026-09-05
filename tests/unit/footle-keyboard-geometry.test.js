import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSS = readFileSync(fileURLToPath(new URL('../../src/app.css', import.meta.url)), 'utf8')
  // + the Footle board's rules, which moved to src/games/footle.css on 2026-09-05;
  // the app bundle imports both, so the gate reads what the app ships.
  + '\n' + readFileSync(fileURLToPath(new URL('../../src/games/footle.css', import.meta.url)), 'utf8');
/** Body of the first rule whose selector text starts with `start`. Literal
 *  indexOf rather than a built regex — the selectors here contain `.`, `{` and
 *  `-`, and escaping them into a pattern is how the first cut of this helper
 *  silently returned null and failed three passing assertions. */
const rule = (start) => {
  const i = CSS.indexOf(start);
  if (i === -1) return null;
  // `start` already contains the opening brace, so locate it INSIDE start.
  // Searching forward from the end of `start` instead walks past it and
  // returns the NEXT rule's body — which is what the first two cuts of this
  // helper did, quietly failing three assertions that were actually true.
  const open = i + start.indexOf('{');
  const close = CSS.indexOf('}', open);
  return close === -1 ? null : CSS.slice(open + 1, close);
};

/**
 * FOOTLE KEYBOARD GEOMETRY — measured, not guessed.
 *
 * Alex asked whether the keys could be bigger and harder to mis-tap. Measured
 * live at 405x881 before answering:
 *
 *   key visual 34.8 x 48px · pitch 40.8px · hit area 40.8px
 *
 * ⚠️ THE WIDTH CANNOT GROW, and that is arithmetic rather than an opinion. The
 * hit areas already tile EXACTLY — 40.8px pitch against a 40.8px hit area, so
 * there is no gap between neighbours and no overlap either. Ten keys at Apple's
 * 44pt minimum would need 440px; the screen is 405. iOS's own keyboard uses
 * ~32pt keys for the same reason. Anything "wider" here can only come from
 * overlapping neighbours, which trades a miss for a wrong letter.
 *
 * So the accuracy left on the table was VERTICAL, and there was a lot of room:
 * 233px sat unused below ENTER — 26% of the screen — because .wd-keyboard used
 * `margin-bottom:auto`, which in a flex column pushes the keyboard UP and parks
 * the slack underneath. On a 6.3" phone that means reaching up to type.
 *
 * Now: keys 56px (vertical pitch 54 -> 62px, still tiling exactly), keyboard
 * anchored to the bottom, and the grid centred so the remaining slack splits
 * above and below the tiles instead of pooling in one hole.
 */
describe('footle keyboard geometry', () => {
  it('extends the hit area to exactly the gap — tiling, never overlapping', () => {
    // --kb-gap is 6px, so ::after must inset -3px: half the gap on each side of
    // a key closes the gap to its neighbour and stops precisely there. A larger
    // inset would overlap the neighbour and hand taps to whichever paints last.
    expect(CSS).toMatch(/--kb-gap:\s*6px/);
    expect(rule('.wd-key::after')).toMatch(/inset:\s*-3px -3px/);
  });

  it('sizes keys off the full width, with no wasted horizontal space', () => {
    // 10 keys + 9 gaps == 100%. Any other formula leaves width unused, and
    // width is the scarce axis.
    expect(CSS).toMatch(/--kb-key:\s*calc\(\(100% - 9 \* var\(--kb-gap\)\) \/ 10\)/);
  });

  it('anchors the keyboard to the BOTTOM, not the top', () => {
    // ⚠️ margin-TOP:auto. With margin-bottom:auto the flex column pushed every
    // spare pixel below the keys — 233px measured — and the player reached up
    // to type. The desktop block re-centres by resetting margin-top; if that
    // ever flips back to margin-bottom the mobile layout silently regresses.
    const k = rule('.wd-keyboard{display');
    expect(k).toMatch(/margin-top:\s*auto/);
    expect(k).not.toMatch(/margin-bottom:\s*auto/);
  });

  it('gives keys more height than the old 48px, and short screens their own', () => {
    const key = rule('.wd-key{position');
    const h = /height:\s*(\d+)px/.exec(key);
    expect(h).toBeTruthy();
    expect(Number(h[1])).toBeGreaterThan(48);
    // The max-height:700px block exists so the six-row grid still fits on a
    // small phone; it must keep its own smaller key or tall keys overflow it.
    const short = /@media \(max-height: 700px\) \{([\s\S]*?)\n\}/.exec(CSS);
    expect(short && short[1]).toMatch(/\.wd-key\{height:\s*\d+px;\}/);
  });

  it('lets the grid absorb the slack instead of leaving one hole', () => {
    expect(rule('.wd-grid{display')).toMatch(/justify-content:center;flex:1 1 auto/);
    // The finished board packs tight against its result copy — it must NOT grow.
    expect(rule('.wd-grid.wd-grid--ended')).toMatch(/flex:0 0 auto/);
  });
});
