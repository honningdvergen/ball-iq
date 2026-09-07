import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
// ⚠️ FILE-SCOPED, NOT GLOBAL. This file imports the whole 2.4 MB question bank, and on a loaded machine that
// has crossed vitest's 5000ms default twice (2026-09-07) — red on the loaded
// run, green on the clean rerun. A flaky gate trains people to rerun instead of
// read, which is worse than a slow gate. Raising it HERE keeps every other test
// on the short leash that catches genuine hangs.
vi.setConfig({ testTimeout: 20000 });
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * The UI must not promise a question type the bank does not contain.
 *
 * ⚠️ SHIPPED FOR THREE AND A HALF MONTHS. Commit df54c40 (2026-05-07) removed
 * every typed-input question from the bank — "to eliminate spelling-variation
 * friction pre-launch" — and the Classic difficulty sheet went on telling every
 * player that Hard meant "Deep knowledge — some typed answers". Nothing linked
 * the copy to the data, so nothing noticed.
 *
 * This is the cheap half of a class the codebase keeps hitting: a promise in
 * one file and the thing it describes in another, with no assertion between
 * them. Same shape as the distractor and no-question-count gates.
 */
describe('difficulty copy matches what the bank can actually serve', () => {
  const appSrc = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8');

  // Read the descriptions straight out of the difficulty sheet literal rather
  // than importing App.jsx (which would pull in the whole React tree).
  const descs = [...appSrc.matchAll(/\{\s*id:\s*"(easy|medium|hard)"[^}]*?desc:\s*"([^"]*)"/g)]
    .map(([, id, desc]) => ({ id, desc }));

  it('no mode is silently capped below the full range', () => {
    // `diff` is a CEILING in getQs, not a floor: diff:"hard" means the FULL
    // range and diff:"medium" filters out every q.diff==="hard" question.
    //
    // The difficulty pickers were retired on 2026-09-06 and Classic and Local
    // were handed "hard" then. Survival, Legends and Hot Streak were missed and
    // kept passing the `diff` STATE, which defaulted to "medium" -- so from that
    // day every player had a Survival that could not serve a hard question. The
    // state had no UI left to change it (SettingsScreen has no difficulty row),
    // so it was frozen for everyone.
    for (const mode of ['survival', 'legends', 'hotstreak']) {
      // The getQs line specifically -- each mode is also named in the setCat
      // line above it, which carries no diff and would match a looser pattern.
      const call = appSrc.match(new RegExp(`m === "${mode}"\\) \\{ qs = [^\\n]*`))?.[0] || '';
      expect(call, `${mode} must have a getQs call`).toContain('getQs');
      expect(call, `${mode} must ask for the full range`).toMatch(/diff: "hard"/);
    }
    // And the state itself is gone, so nothing can start reading it again.
    expect(appSrc, 'the frozen diff state was removed').not.toMatch(/const \[diff, setDiff\]/);
    // `await getQs({`, so this cannot match getQs's own parameter
    // destructuring at its declaration -- which it did on the first run.
    expect(appSrc, 'no call site passes a bare diff variable').not.toMatch(/await getQs\(\{[^}]*\bdiff,/);
  });

  it('the Classic difficulty sheet is gone (2026-09-06) — Classic is the arc', () => {
    // If difficulty copy ever returns, the typed-answer guard below still
    // sweeps whatever literal it finds.
    expect(appSrc).not.toMatch(/Choose Difficulty/);
    expect(appSrc).toMatch(/diff: "hard", n: 10, ramp: true/);
  });

  it('does not promise typed answers while the bank has none', async () => {
    const mod = await import('../../src/questions.js');
    const QB = mod.QB || mod.default || [];
    const typedCount = QB.filter((q) => q && q.type === 'typed').length;

    const promises = descs.filter(({ desc }) => /\btype(d|-in| in)\b|typing/i.test(desc));

    if (typedCount === 0) {
      expect(
        promises.map((p) => `${p.id}: "${p.desc}"`),
        `\n  The bank contains ZERO type:"typed" questions, but the difficulty\n` +
        `  sheet still advertises them. Either restore typed questions or fix\n` +
        `  the copy — do not ship the promise.\n`,
      ).toEqual([]);
    } else {
      // The other direction, so this test stays honest if typed questions come
      // back: the copy is then allowed to mention them, and a zero above must
      // not be mistaken for "checked and fine".
      expect(typedCount).toBeGreaterThan(0);
    }
  });
});
