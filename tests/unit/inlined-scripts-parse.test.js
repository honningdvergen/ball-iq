// ⚠️ THE INLINED GAME SCRIPTS ARE STRINGS UNTIL A BROWSER PARSES THEM.
//
// FG_JS, BQ_JS and the club-quiz engine are all assembled inside template
// literals and injected into generated HTML. `node --check` on the MODULE says
// nothing about them: the module is valid whatever nonsense the string holds.
//
// This test exists because of a real defect. A single `\n` was written inside
// FG_JS to join the share grid's rows — but inside a template literal `\n` is a
// REAL newline, so the emitted script contained a string literal split across
// two lines and every club page's grid died with "Invalid or unexpected token".
// The build was green. All 774 tests passed. The only symptom was that tapping
// a cell did nothing, which is exactly the failure mode
// [play-the-build-the-engine-has-no-gate] was written about.
//
// Escapes inside these literals must be DOUBLED (\\n, \\u2014, \\s) — the
// surrounding template literal eats the first backslash.
import { describe, it, expect } from 'vitest';
import vm from 'node:vm';
import { FG_JS } from '../../scripts/seo/grid-section.mjs';
import { BQ_JS } from '../../scripts/seo/quiz-widget.mjs';

const parses = (src) => {
  // new vm.Script() runs the real parser without executing anything.
  try { new vm.Script(src); return null; } catch (e) { return e.message; }
};

describe('scripts inlined into generated pages actually parse', () => {
  it('FG_JS — the Football Grid', () => {
    expect(parses(FG_JS)).toBe(null);
  });

  it('BQ_JS — the club quiz widget', () => {
    expect(parses(BQ_JS)).toBe(null);
  });

  it('catches the exact bug this was written for', () => {
    // A single \n inside a template literal reaches the emitted script as a
    // line break in the middle of a string. Proof the check can see it.
    const broken = "var x = 'a\nb';";
    expect(parses(broken)).not.toBe(null);
  });
});
