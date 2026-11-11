// REAL_GAPS lets ONE exact, sourced gap through the answer bar's hole rule
// (Ball IQ HQ, 7 Nov 2026). Everything else must still fail.
import { describe, it, expect } from 'vitest';
import { answerBar, REAL_GAPS, MAX_GAP } from '../../scripts/mystery-answer-bar.mjs';
import { withCareerFixes } from '../../src/lib/mysteryCareer.js';
import pool from '../../src/data/mysteryPool.json';
import rawCareers from '../../src/data/mysteryCareers.json';
import fixes from '../../src/data/mysteryCareerFixes.json';
import roles from '../../src/data/mysteryRoles.json';
import exclusions from '../../src/data/mysteryExclusions.json';

const careers = withCareerFixes(rawCareers, fixes);
const byId = new Map(pool.map((p) => [p.id, p]));
const hole = (r) => r.why.filter((w) => /hole in the career record/.test(w));
const bar = (p, c = careers) => answerBar(p, { careers: c, roles, exclusions });

// A careers object with one player's spells replaced (labels added if new).
function withSpells(id, spells) {
  return withCareerFixes(rawCareers, { ...fixes, [id]: spells });
}

describe('REAL_GAPS', () => {
  it('names the player and one exact gap for every entry', () => {
    for (const [id, g] of Object.entries(REAL_GAPS)) {
      expect(id).toMatch(/^Q\d+$/);
      expect(byId.get(id)?.name, id).toBe(g.player);
      expect(g.until - g.after).toBeGreaterThan(MAX_GAP);
    }
  });

  it("lets Honda's real 2022-23 gap through, so day 139 stays", () => {
    expect(hole(bar(byId.get('Q202054')))).toEqual([]);
  });

  it('still fails Honda for any other gap', () => {
    const honda = byId.get('Q202054');
    const moved = withSpells('Q202054', [
      ['Nagoya Grampus', 2005, 2007], ['AC Milan', 2014, 2017], ['Paro FC', 2024, 2024],
    ]);
    expect(hole(bar(honda, moved)).length).toBe(1);
  });

  it('still fails anyone not on the list with the same gap', () => {
    const other = pool.find((p) => !REAL_GAPS[p.id] && p.id === 'Q2339'); // van Persie
    const gapped = withSpells(other.id, [
      ['Feyenoord Rotterdam', 2001, 2004], ['Arsenal F.C.', 2004, 2012], ['Manchester United F.C.', 2015, 2019],
    ]);
    expect(hole(bar(other, gapped)).length).toBe(1);
  });
});
