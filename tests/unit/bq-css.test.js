import { describe, it, expect } from 'vitest';
import { BQ_CSS } from '../../scripts/seo/quiz-widget.mjs';

/**
 * The .bq ribbon's [hidden] override was once pasted INSIDE the .bq-daily
 * declaration block. Browsers now parse that as CSS nesting — a descendant
 * selector that never matches — so the "fix" shipped green and the empty
 * amber bar stayed on every page under 24 questions (2026-09-05). A rule that
 * exists to beat another rule has to be at the top level, so this checks the
 * brace depth where it starts, not just that the text is present.
 */
function depthAt(css, idx) {
  let d = 0;
  for (let i = 0; i < idx; i++) { const ch = css[i]; if (ch === '{') d++; else if (ch === '}') d--; }
  return d;
}

describe('bq widget CSS', () => {
  it('has the [hidden] override for the ribbon, at the top level', () => {
    const rule = '.bq-daily[hidden]{display:none}';
    const idx = BQ_CSS.indexOf(rule);
    expect(idx, 'override missing').toBeGreaterThan(-1);
    expect(depthAt(BQ_CSS, idx), 'override is nested inside another rule').toBe(0);
    // and it comes after the display:flex rule it overrides
    expect(BQ_CSS.indexOf('.bq-daily{display:flex')).toBeLessThan(idx);
  });
  it('no top-level rule is left unbalanced', () => {
    expect(depthAt(BQ_CSS, BQ_CSS.length)).toBe(0);
  });
});
