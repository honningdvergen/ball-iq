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

/**
 * ⚠️ SCOPED BY ID, NOT BY TAG — changed 2026-08-24 and this is the whole point.
 *
 * While the pack was withheld wholesale, `tag === 'summer2026'` was the right
 * scope. Then Alex ruled on all 89 individually (55 approve · 31 reject · 3
 * hold), so the approved 55 LOST the tag and went back into Classic, League and
 * club draws — which is precisely the route by which two of these reached him
 * in the first place. A tag-scoped test would now inspect three questions,
 * pass, and guard nothing at the exact moment the other 55 became reachable
 * again. The id prefix is stable regardless of tag or withhold state.
 */
describe('topical headline questions are not graded hard', () => {
  const topical = QB.filter((q) => q && /^q_s26/.test(q.id || ''));

  it('the set is present and reachable', () => {
    // Withheld or not, these are the rows the rule is about.
    expect(topical.length).toBeGreaterThan(40);
    const drawable = topical.filter((q) => !q.tag);
    expect(drawable.length, 'the approved questions should be back in the draws').toBeGreaterThan(40);
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

  it('the rule has not been applied so broadly that nothing is hard', () => {
    // ⚠️ The counterweight, rewritten. It used to say "enough hard questions to
    // fill the tile" — but the tile is gone (Alex retired the mode), so that
    // assertion was guarding a thing that no longer exists while reading as if
    // it still protected something.
    //
    // What still needs protecting is the OPPOSITE error: re-grading these to
    // easy en masse would quietly delete them from every club and league draw,
    // since all of those drop easy. Measured after Alex's ruling: 35 hard, 15
    // medium, 8 easy of 58.
    const hard = topical.filter((q) => q.diff === 'hard');
    expect(hard.length, 'grading these easy removes them from club/league draws').toBeGreaterThanOrEqual(20);
    const easy = topical.filter((q) => q.diff === 'easy');
    expect(easy.length / topical.length, 'most of these are not headlines').toBeLessThan(0.4);
  });
});
