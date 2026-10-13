import { describe, it, expect } from 'vitest';
import { createTapLedger } from '../../src/lib/keyTaps.js';

// Footle's keys type on the finger's lift; the click that follows must not type
// again. Each `it` is a sequence seen on a phone, in the order the events came.
describe('which clicks have already been typed (Footle keys)', () => {
  const run = (events, windowMs = 3000) => {
    let clock = 0;
    const ledger = createTapLedger(windowMs, () => clock);
    let typed = '';
    for (const [kind, key, at] of events) {
      if (at != null) clock = at;
      if (kind === 'up') { ledger.lifted(key); typed += key; }
      else if (!ledger.spent(key)) typed += key; // a click nobody has typed yet
    }
    return typed;
  };

  it('a plain tap types once', () => {
    expect(run([['up', 'S'], ['click', 'S']])).toBe('S');
  });

  it('a click that arrives after other keys were lifted is still recognised (13 Oct 2026: "SALAHS")', () => {
    expect(run([['up', 'S'], ['up', 'A'], ['up', 'L'], ['up', 'A'], ['up', 'H'],
      ['click', 'S'], ['click', 'A'], ['click', 'L'], ['click', 'A'], ['click', 'H']])).toBe('SALAH');
  });

  it('a double letter typed fast, two lifts then two clicks, is two letters', () => {
    expect(run([['up', 'L'], ['up', 'L'], ['click', 'L'], ['click', 'L']])).toBe('LL');
  });

  it('two thumbs overlapping get no clicks at all and lose nothing', () => {
    expect(run([['up', 'S'], ['up', 'A']])).toBe('SA');
  });

  it('a press held for any length types once: the window runs from the lift', () => {
    expect(run([['up', 'L', 5000], ['click', 'L', 5010]])).toBe('L');
  });

  it('a note that was never spent lapses, so a later click with no lift still types', () => {
    expect(run([['up', 'S', 0], ['click', 'S', 4000]])).toBe('SS');
  });

  it('a click on a key that was never lifted types (a physical keyboard, assistive tech)', () => {
    expect(run([['click', 'Y']])).toBe('Y');
  });
});
