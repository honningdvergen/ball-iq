import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

/**
 * The palette lives in src/design/tokens.js. The 09-04 lift had to touch 32
 * files because the same hexes were typed into stylesheets by hand; the 09-05
 * critique counted #58CC02 in 19 files. Stylesheets read tokens. A literal is
 * allowed only inside a comment or a data: URI (SVG in url() cannot read var()).
 */
const PALETTE = ['58CC02', '06230C', '0B0C10', 'FFC107', '9BA0B8', '1B1E27', '13151C', '242730', '2F3240', '7E828C', 'FF4B4B', 'FF4747', 'F0F1F5'];
function stripAllowed(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g, 'url()');
}
describe('stylesheets carry no inlined palette hex', () => {
  for (const f of ['src/app.css', 'src/games/footle.css', 'src/design/front.css']) {
    it(f, () => {
      const css = stripAllowed(read(f));
      for (const h of PALETTE) {
        const m = css.match(new RegExp(`#${h}(?![0-9A-Fa-f])`, 'gi')) || [];
        expect(m.length, `#${h} typed ${m.length}× in ${f} — use the token`).toBe(0);
      }
    });
  }
});
