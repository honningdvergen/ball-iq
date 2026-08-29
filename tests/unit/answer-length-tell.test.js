// The long-answer tell (Alex, live MP test 2026-08-29): "almost always the
// drastically longer answer option is right, which is a real defect."
// Measured that night: the longest option was CORRECT in 42.4% of 6,823 MCQs
// (chance ≈ 25-30% with ties), and 21 questions were DRASTIC — correct at
// least 1.6× the longest distractor AND 20+ chars longer, readable as the
// answer without any football knowledge. Those 21 were rebalanced by padding
// distractors (never by changing the correct answer's text).
//
// This gate keeps the drastic tier at zero, so the forge and every future
// hand-add can't quietly reintroduce the tell. The mild statistical skew is
// tolerated — natural phrasing makes true answers a little longer — the gate
// targets the exploitable extreme, not the distribution.
import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';

function isDrastic(o, a) {
  const lens = o.map((s) => String(s).length);
  const cLen = lens[a];
  const maxOther = Math.max(...lens.filter((_, i) => i !== a));
  return cLen >= maxOther * 1.6 && cLen - maxOther >= 20;
}

describe('the long-answer tell', () => {
  it('detector self-check: flags a synthetic giveaway, passes a balanced set', () => {
    expect(isDrastic(['A very long and detailed correct answer indeed', 'No', 'Nope', 'Nah'], 0)).toBe(true);
    expect(isDrastic(['A fairly long correct answer', 'A fairly long wrong answer', 'Another decent length', 'Also reasonable'], 0)).toBe(false);
  });

  it('no MCQ lets the longest option give itself away drastically', () => {
    const offenders = QB
      .filter((q) => q.type === 'mcq' && Array.isArray(q.o) && q.o.length === 4 && typeof q.a === 'number')
      .filter((q) => isDrastic(q.o, q.a))
      .map((q) => q.id);
    expect(offenders, `drastic long-answer giveaways: ${offenders.join(', ')}`).toEqual([]);
  });
});
