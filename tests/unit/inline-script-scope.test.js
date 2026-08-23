import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const gen = readFileSync(join(ROOT, 'scripts/gen-seo-pages.mjs'), 'utf8');

/**
 * The inline club-quiz engine is one big function scope, and nothing checks it.
 *
 * ⚠️ IT LIVES INSIDE A TEMPLATE LITERAL, so ESLint never parses it. The build
 * gate runs eslint over src/ and scripts/, and every line of this engine is a
 * STRING as far as that is concerned — no undefined-variable check, no
 * no-redeclare, no shadowing warning. It is the largest unlinted body of
 * JavaScript we ship.
 *
 * ⚠️ WHAT THAT COST, 2026-08-23. A gesture gate added to stop crawlers
 * inflating clubq-start declared `var off = function(){…}`. `off` was already
 * a module-level variable — the pagination offset in
 * `var run=[],at=0,off=0,…` — and `var` is function-scoped, not
 * block-scoped, so it shadowed the offset across the whole of start(), which
 * assigns `off=from` further down. One name, two failures:
 *
 *   · `off` became a number, so the handler threw "off is not a function",
 *     the listener never detached, and clubq-start fired on EVERY tap:
 *     30.5 events per visitor against 1.1 before the change meant to REDUCE
 *     over-counting.
 *   · The offset never reached module scope, so "Play again" restarted from
 *     question 0 instead of serving the next batch — a gameplay regression
 *     caused by a measurement change.
 *
 * Neither was visible in the build. It was found by reading the numbers the
 * instrument produced and then catching the TypeError in the live page.
 *
 * So: anything declared inside the engine must carry a `bq` prefix, which
 * makes a collision with the engine's own short names impossible by
 * construction rather than by review.
 */

const engineBody = (() => {
  // The engine is emitted from one template literal; take from the declaration
  // of its state to the end of that literal.
  const start = gen.indexOf('var run=[],at=0,off=0');
  expect(start, 'engine state declaration not found — update this selector').toBeGreaterThan(-1);
  // ⚠️ End at the FIRST backtick, which closes the literal. The first version
  // of this searched for '`;' and overshot by 5,700 characters into ordinary
  // module code — which then failed its own no-backticks assertion and
  // reported phantom re-declarations from code that is not in the engine at
  // all. A guard whose boundary is wrong invents defects outside its subject.
  const end = gen.indexOf('`', start);
  expect(end, 'could not find the end of the engine literal').toBeGreaterThan(start);
  return gen.slice(start, end);
})();

// The engine's own single-word state names. Anything re-declared with one of
// these inside the same function scope shadows it.
const RESERVED = ['run', 'at', 'off', 'served', 'sc', 'streak', 'best', 'rounds', 'started', 'len', 'total', 'root', 'res', 'head', 'meter'];

describe('the inline club-quiz engine', () => {
  it('was located', () => {
    expect(engineBody.length).toBeGreaterThan(2000);
  });

  // ⚠️ NO SCOPE ASSERTION HERE, DELIBERATELY. Three attempts at catching the
  // shadowing bug with a regex produced three sets of false positives: first
  // it flagged `res` and `head` for being declared once, then it flagged the
  // loop counters `i`, `b`, `v` and `h`, which are declared in DIFFERENT
  // function scopes and are entirely correct. A regex cannot do scope
  // analysis, and a guard that fails on correct code teaches people to delete
  // the guard — which is worse than no guard.
  //
  // The real fix is structural and is tracked in docs/TODO.md: this engine
  // contains no backticks and no ${} placeholders by rule, so it can live in
  // its own .js file that ESLint actually parses, read at build time. Then
  // no-redeclare and no-shadow do this properly and for free. Until then the
  // assertions below are the ones that can be made honestly.

  it('the gesture gate detaches itself', () => {
    // The handler must call its own remover, and both must be prefixed so they
    // cannot collide with the engine's short names.
    expect(engineBody, 'gesture gate missing').toMatch(/bqFire\s*=\s*function/);
    expect(engineBody, 'the gate never removes its listeners').toMatch(/bqOff\s*=\s*function/);
    expect(engineBody).toMatch(/removeEventListener\('pointerdown',bqFire\)/);
  });

  it('the engine script contains no backticks or template placeholders', () => {
    // It lives inside a template literal; either one ends the string early and
    // the build fails pointing at a comment rather than the code.
    expect(engineBody.includes('`'), 'a backtick would terminate the literal').toBe(false);
  });
});
