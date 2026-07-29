import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';
import { QB_INDEX } from '../../src/questions-index.js';

// src/questions-index.js is a generated, text-free projection of the bank that
// the club and league pickers read instead of loading 2.1MB to render a count.
//
// Two things about it are load-bearing and FAIL SILENTLY:
//
//  1. ROW ORDER. The Daily 7 shuffles by array position (seededShuffle over the
//     mcq-filtered slice). An index that reordered rows would hand different
//     daily questions to anything selecting through it — and the /c/ challenge
//     links and "you beat X" modal both assume every device agrees. Exactly the
//     failure shape as the Math.sin JSC-vs-V8 divergence: invisible, and wrong
//     for months.
//
//  2. THE VALIDITY PREDICATE. Call sites used to pair `type === 'mcq'` with
//     `Array.isArray(q.o)`; the index carries an option COUNT instead, so
//     `n > 0` has to select exactly the same rows or every displayed count
//     quietly drifts.
//
// The generator runs on `npm run dev` and `npm run build`, so staleness should
// be impossible — this test is what catches it if that wiring is ever removed.

describe('questions-index mirrors the bank', () => {
  it('has one row per question', () => {
    expect(QB_INDEX).toHaveLength(QB.length);
  });

  it('preserves row order and the filterable fields', () => {
    const drift = [];
    for (let i = 0; i < QB.length; i++) {
      const a = QB[i], b = QB_INDEX[i];
      if ((a?.id ?? null) !== b.id || (a?.cat ?? null) !== b.cat ||
          (a?.club ?? null) !== b.club || (a?.type ?? null) !== b.type) {
        drift.push({ i, bank: a?.id, index: b.id });
      }
    }
    expect(drift.slice(0, 5)).toEqual([]);
  });

  it('selects the same rows as Array.isArray(q.o) did', () => {
    const oldWay = QB.filter(q => q && q.type === 'mcq' && Array.isArray(q.o)).length;
    const newWay = QB_INDEX.filter(q => q && q.type === 'mcq' && q.n > 0).length;
    expect(newWay).toBe(oldWay);
  });

  it('carries no question text — that is the entire point', () => {
    const keys = new Set(QB_INDEX.flatMap(Object.keys));
    for (const leaked of ['q', 'o', 'a', 'hint', 'explanation']) {
      expect(keys.has(leaked)).toBe(false);
    }
  });
});
