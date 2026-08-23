import { describe, it, expect } from 'vitest';
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

  it('found the difficulty descriptions to check', () => {
    expect(descs.length, 'difficulty sheet literal not found — update this selector')
      .toBeGreaterThanOrEqual(3);
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
