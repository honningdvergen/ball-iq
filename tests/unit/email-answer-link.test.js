import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * The email answer link must keep the email's promise.
 *
 * The win-back / activate emails put a REAL bank question in the inbox and
 * make every option a link (/play?eq=<id>&ea=<authoredIndex>). The tap has to
 * tell the reader whether they were right and then open the Daily 7. A link
 * that silently dumps a lapsed player into a quiz is the opposite of winning
 * them back — and these go to people who already stopped playing once.
 *
 * ⚠️ THE ORDER IS THE WHOLE FIX, AND IT COST A DEBUGGING SESSION.
 * Verified live in a production build with in-code instrumentation: the
 * handler reached its success stage with the correct question and verdict,
 * called showToast — and NOTHING appeared, because the quiz screen renders a
 * different subtree that contains no `.toast` node at all. Firing the verdict
 * and opening the daily in the same tick therefore shows the reader nothing.
 * So the toast fires first and the daily opens on a timer, after it has been
 * on screen. If a refactor ever makes playDaily() run in the same tick as
 * showToast() again, the verdict silently disappears — hence this gate.
 *
 * `ea` indexes the AUTHORED option order, because the email renders `q.o` as
 * written (the app shuffles per player; the email cannot). Correctness is
 * therefore `ea === q.a` against the unshuffled bank entry.
 */

const SRC = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
const HANDLER = (() => {
  const i = SRC.indexOf('const emailAnswerHandled = useRef(false);');
  if (i < 0) throw new Error('email answer handler not found in App.jsx');
  return SRC.slice(i, SRC.indexOf('}, [playDaily, showToast]);', i));
})();

describe('email answer deep link', () => {
  it('reads both params and strips them so a refresh cannot replay the verdict', () => {
    expect(HANDLER).toMatch(/sp\.get\('eq'\)/);
    expect(HANDLER).toMatch(/sp\.get\('ea'\)/);
    expect(HANDLER).toMatch(/searchParams\.delete\('eq'\)/);
    expect(HANDLER).toMatch(/searchParams\.delete\('ea'\)/);
  });

  it('judges against the AUTHORED answer index, not a shuffled one', () => {
    expect(HANDLER).toMatch(/idx === q\.a/);
  });

  it('opens the daily on a timer, never in the same tick as the toast', () => {
    const toastAt = HANDLER.indexOf('showToast(');
    const timerAt = HANDLER.indexOf('setTimeout(');
    expect(toastAt, 'handler must show a verdict').toBeGreaterThan(-1);
    expect(timerAt, 'daily must open on a timer').toBeGreaterThan(-1);
    expect(timerAt, 'the toast must be fired BEFORE the deferred daily').toBeGreaterThan(toastAt);
    // the success path must NOT call playDaily synchronously after the toast
    const between = HANDLER.slice(toastAt, timerAt);
    expect(between).not.toMatch(/playDaily\(\)/);
  });

  it('clears the pending timer on unmount so no quiz starts behind the user', () => {
    expect(HANDLER).toMatch(/return \(\) => \{[\s\S]*clearTimeout\(emailAnswerTimer\.current\)/);
  });

  it('degrades to the daily for an unknown id or malformed index', () => {
    expect(HANDLER).toMatch(/if \(!q \|\| !Array\.isArray\(q\.o\)\) \{ playDaily\(\); return; \}/);
    expect(HANDLER).toMatch(/catch \{ playDaily\(\); \}/);
  });
});

describe('the linked question resolves in the shipped bank', async () => {
  const mod = await import('../../src/questions.js');
  const QB = Object.values(mod).find(v => Array.isArray(v) && v.length > 1000);

  it('q_e15d6b is present and its authored answer index is stable', () => {
    const q = QB.find(x => x.id === 'q_e15d6b');
    expect(q, 'the email template links this id').toBeTruthy();
    expect(Array.isArray(q.o)).toBe(true);
    expect(q.o[q.a]).toBe('Agüero');
  });
});
