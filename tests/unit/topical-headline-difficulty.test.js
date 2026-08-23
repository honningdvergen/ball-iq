import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';

/**
 * A headline is not a hard question.
 *
 * ⚠️ ALEX HAS NOW MADE THIS CALL TWICE, on the same pack.
 *
 * First on 2026-08-21, after scoring 7/10 on the summer-2026 tile: *"one
 * question was who won the world cup just a month ago, come on."* Fourteen
 * headline questions were moved to easy and the tile was re-cut to serve hard
 * only.
 *
 * Again on 2026-08-23, device-testing: *"those two questions are too easy to
 * not know"* — the Real Madrid and Liverpool manager appointments, both still
 * labelled hard, and both reached him through the general **Managers**
 * category rather than the topical tile. That is the part the first fix
 * missed: a topical question carries a `cat` as well as its `tag`, so
 * re-cutting the TILE does nothing about the League and Classic draws it also
 * appears in.
 *
 * Why difficulty is the right lever rather than a filter: club, league and
 * topical draws all drop `easy`, so grading a headline honestly removes it
 * from every mode aimed at engaged fans while leaving it available to a casual
 * Classic player who genuinely may not know it. The label becomes true instead
 * of the question becoming hidden.
 *
 * ⚠️ Deliberately narrow. It matches the shape of an appointment/succession
 * headline, not "recent" in general — plenty of 2026 questions are legitimately
 * hard (exact fees, appearance counts, who held the record before). Widening
 * this into "no recent question may be hard" would gut the pack.
 */
const HEADLINE = /\bwho (replaced|succeeded)\b|\bwhich manager (replaced|succeeded|took over)\b|\bsucceeded .+ (at|as)\b|\breplaced .+ as\b/i;

describe('topical headline questions are not graded hard', () => {
  const topical = QB.filter((q) => q && q.tag === 'summer2026');

  it('the pack is present', () => {
    expect(topical.length).toBeGreaterThan(50);
  });

  it('no appointment headline is labelled hard or medium', () => {
    const offenders = topical
      .filter((q) => HEADLINE.test(q.q || '') && q.diff !== 'easy')
      .map((q) => `${q.id} [${q.diff}] ${q.q.slice(0, 70)}`);
    expect(
      offenders,
      `\n  A manager appointment everyone read about is not a hard question.\n` +
      `  Grade it easy — club, league and topical draws all drop easy, so it\n` +
      `  stops reaching the audience that already knows it.\n  ${offenders.join('\n  ')}\n`,
    ).toEqual([]);
  });

  it('the pack still has enough hard questions to fill the tile', () => {
    // The topical tile serves onlyDiff:'hard' and needs 10. If a future
    // re-grade empties that tier the tile silently stops working, so this is
    // the counterweight that stops the rule above being applied too broadly.
    const hard = topical.filter((q) => q.diff === 'hard');
    expect(hard.length, 'the topical tile draws 10 hard questions').toBeGreaterThanOrEqual(20);
  });
});
