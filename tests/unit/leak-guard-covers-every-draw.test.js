import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Every dimension the app draws a pool by must be a dimension the leak guard
 * groups by.
 *
 * ⚠️ THIS IS THE FAILURE THAT PRODUCED A SELF-CONFIRMING ZERO.
 *
 * `gen-leak-conflicts.mjs` grouped questions by `cat` and by `club`. When the
 * topical tile shipped it introduced a THIRD selection dimension — App.jsx
 * passes `{ tag: TOPICAL_PACK.tag, onlyDiff: "hard" }` — and nothing connected
 * the two facts. A pool the generator never groups is a pool it never guards,
 * so the newest, Home-featured, NEW-badged pack was the leakiest surface in the
 * app while every instrument said clean.
 *
 * Worse, `audit-leaks-full.mjs` enumerated the SAME two keys, so its "0
 * unguarded" was not evidence of anything. It would have printed a green tick
 * over this forever. A zero from an instrument that cannot see the thing is the
 * most dangerous number in this repo — it has now happened three times.
 *
 * The exhaustive pair check lives in scripts/audit-leaks-full.mjs (~25s, run
 * with --strict in the build). THIS test is the cheap structural one: it does
 * not check pairs at all, it checks that the guard's group keys still cover the
 * app's draw keys. That is the thing that actually went wrong, and it is the
 * thing a new mode will get wrong next.
 */

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
const GEN = read('../../scripts/gen-leak-conflicts.mjs');
const AUDIT = read('../../scripts/audit-leaks-full.mjs');

/**
 * Every dimension the app narrows a question pool by.
 *
 * ⚠️ They do NOT all live in getQs, which is what my first version of this test
 * assumed and got wrong. `cat` and `tag` are getQs options; `club` never goes
 * through getQs at all — launchClubQuiz filters `q.club === qbName` directly
 * against the bank. Two draw paths, three dimensions, and the guard has to
 * cover all three regardless of which function does the filtering.
 */
const DRAW_KEYS = ['cat', 'tag', 'club'];
/** …of which these are the ones getQs itself accepts. */
const GETQS_KEYS = ['cat', 'tag'];

describe('the leak guard covers every dimension the app draws by', () => {
  it('getQs still narrows by exactly the dimensions we think it does', () => {
    // ⚠️ If a new filter appears in getQs, this fails and someone has to decide
    // whether the guard needs a new group key. That decision is the point.
    const sig = APP.match(/async function getQs\(\{([^}]*)\}/);
    expect(sig, 'getQs should still exist with a destructured options object').toBeTruthy();
    const params = sig[1].split(',').map((s) => s.trim().split(/[=:]/)[0].trim()).filter(Boolean);
    for (const key of GETQS_KEYS) {
      expect(params, `getQs should still accept "${key}"`).toContain(key);
    }
    // The third dimension takes the other road: club packs bypass getQs and
    // filter the bank directly. If that ever moves into getQs, or a NEW direct
    // filter appears, someone has to decide whether the guard needs a new key.
    expect(
      /q\.club === qbName/.test(APP),
      'launchClubQuiz should still filter the bank by q.club directly',
    ).toBe(true);
  });

  it('the conflict generator groups by every draw dimension', () => {
    // Mutation check: deleting the `byTag` pass fails this.
    // ⚠️ Anchored to the actual grouping guard line, not to "does the word
    // appear somewhere". The first version accepted either a loose regex OR the
    // presence of a `byTag` identifier, and deleting the whole tag pass still
    // passed it — the alternation matched prose in the comment above the code
    // it was meant to be checking. A guard that reads its own documentation is
    // not a guard.
    for (const key of DRAW_KEYS) {
      expect(
        GEN.includes(`if (!q || !q.${key} || q.type !== 'mcq'`),
        `gen-leak-conflicts.mjs must build a group map keyed on "${key}" — a pool\n` +
        'it never groups is a pool it never guards, which is exactly how the\n' +
        'topical pack shipped unguarded while every instrument read clean.',
      ).toBe(true);
    }
  });

  it('the full audit enumerates every draw dimension too', () => {
    // ⚠️ The audit re-deriving from the RULES is good design, but it is only
    // worth anything if it enumerates the same pools the app serves. When it
    // listed two keys and the app drew by three, its zero certified nothing.
    const groups = AUDIT.match(/const GROUPS = \[([\s\S]*?)\];/);
    expect(groups, 'audit-leaks-full.mjs should still declare GROUPS').toBeTruthy();
    for (const key of DRAW_KEYS) {
      expect(groups[1], `GROUPS must include key '${key}'`).toMatch(new RegExp(`key: '${key}'`));
    }
  });

  it('the topical draw actually consults the conflict map', () => {
    // The map knowing a pair is useless if the draw never asks. The club and
    // league paths called pickAvoidingConflicts directly; the topical one did
    // not, so fixing the generator alone would have changed nothing a player
    // experiences — the "fixed in one half" habit, again.
    expect(
      /avoidConflicts: true/.test(APP),
      'the topical getQs call must pass avoidConflicts: true',
    ).toBe(true);
    expect(
      /if \(avoidConflicts\) pool = pickAvoidingConflicts\(pool, pool\.length, conflictsWith\);/.test(APP),
      'getQs must apply the guard when asked. Passing pool.length REORDERS rather\n' +
      'than selects, so the ramp and diversity filters still run and a session can\n' +
      'never be shortened by the guard.',
    ).toBe(true);
  });
});
