import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const css = readFileSync(join(ROOT, 'src/app.css'), 'utf8');

/**
 * 421–1023px must have rules of its own.
 *
 * ⚠️ IT HAD NONE. The breakpoint census in this file was 8 rules at
 * min-width:1024, 1 at 1280, 1 at max-width:1023 and 1 at 360 — and ZERO
 * between 421 and 1023. Every iPad in portrait, every Android tablet, every
 * foldable opened flat and every half-screen desktop window fell through the
 * gap and got the phone layout unchanged.
 *
 * Measured at 834px (iPad portrait) on 2026-08-23, before the fix: a 420px
 * content column with 414px of unused space beside it, under a tab bar 814px
 * wide — a 394px mismatch between the navigation and the content it
 * navigates. Report #3 graded this area 5.0 and called the band "still a
 * genuine zero"; it is also the thing that would meet App Review first if the
 * app is ever submitted for iPad.
 *
 * These assertions are on the STYLESHEET rather than a rendered page: jsdom
 * does not do layout, so a DOM test here would assert nothing. The rendered
 * behaviour was verified in a real browser at 375, 421, 744, 834 and 1280.
 */
const bandBlock = (() => {
  const i = css.indexOf('@media (min-width: 421px) and (max-width: 1023px)');
  if (i < 0) return '';
  let d = 0;
  let j = css.indexOf('{', i);
  for (; j < css.length; j += 1) {
    if (css[j] === '{') d += 1;
    else if (css[j] === '}') { d -= 1; if (!d) break; }
  }
  return css.slice(i, j + 1);
})();

describe('the tablet band', () => {
  it('exists at all', () => {
    expect(bandBlock, 'no @media block covering 421–1023px').toBeTruthy();
    expect(bandBlock.length).toBeGreaterThan(200);
  });

  it('caps the tab bar so navigation belongs to the content', () => {
    // The defect: .tab-bar is width:calc(100% - 20px) with max-width:none, so
    // on an 834px screen it spanned 814px above a 420px column.
    expect(bandBlock, 'the tab bar is not capped in the band')
      .toMatch(/\.tab-bar\s*\{[^}]*max-width:\s*\d+px/);
  });

  it('widens the content column', () => {
    expect(bandBlock, '.app still inherits the 420px phone column')
      .toMatch(/\.app\s*\{[^}]*max-width:\s*\d+px/);
  });

  it('uses !important, because the standalone mirror would otherwise win', () => {
    // ⚠️ The @media(display-mode: standalone) mirror pins
    // `.app { max-width: 420px !important }`. Without !important here the band
    // would apply in a browser and silently NOT apply once the app is
    // installed — the exact drift this file has been bitten by before.
    const appRule = bandBlock.match(/\.app\s*\{[^}]*\}/)?.[0] || '';
    expect(appRule, '.app in the band must use !important to beat the standalone mirror')
      .toMatch(/!important/);
  });

  it('caps bottom sheets and dialogs', () => {
    expect(bandBlock).toMatch(/\.diff-sheet/);
    expect(bandBlock).toMatch(/modal-overlay/);
  });

  it('does not leak into phones or desktop', () => {
    // The band is bounded on both sides. A one-sided rule would restyle every
    // phone (min-width only) or every desktop (max-width only).
    expect(bandBlock.startsWith('@media (min-width: 421px) and (max-width: 1023px)')).toBe(true);
  });

  it('still has no rules stranded between the phone cap and the band', () => {
    // 420 is the phone column; the band starts at 421. A gap here would
    // recreate the original defect at a narrower width.
    const gaps = [...css.matchAll(/@media\s*\(min-width:\s*(\d+)px\)\s*\{/g)]
      .map((m) => Number(m[1]))
      .filter((w) => w > 421 && w < 1024);
    expect(gaps, `\n  unbounded min-width rules inside the band: ${gaps.join(', ')}\n`).toEqual([]);
  });
});
