import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../../scripts/', import.meta.url));
const forges = readdirSync(dir).filter((f) => /forge\.workflow\.js$/.test(f));

/**
 * 'fix' IS A PASS. THIS LINE COST TEN VERIFIED QUESTIONS.
 *
 * The examiner and skeptic share a three-verdict schema: keep / fix / reject.
 * 'fix' means "I tried to break this and could not, but here is a tightened
 * version" — and it arrives WITH the corrected text. Wave Q's skeptic stage
 * read `v.verdict !== 'keep'` and threw, so every 'fix' was binned as a
 * rejection and its correction lost. The run reported "27 survived of 37, all
 * ten casualties rejected by the skeptic"; the journal held 56 keep, 18 fix
 * and ZERO reject. Nothing had been rejected at all.
 *
 * The examiner branch was always right. Only the skeptic's was wrong, which is
 * exactly why it read as the adversarial pass being strict rather than as a
 * bug — the same shape as the "a dead agent is not a rejection" defect.
 */
describe('a forge workflow never treats a fix verdict as a rejection', () => {
  it('has forge scripts to check', () => {
    expect(forges.length).toBeGreaterThan(0);
  });

  it.each(forges)('%s throws only on reject', (file) => {
    const src = readFileSync(dir + file, 'utf8');
    // The exact defect: any equality test against 'keep' that gates a throw.
    expect(src, "verdict !== 'keep' bins every 'fix' — throw on 'reject' instead")
      .not.toMatch(/verdict !== ['"]keep['"]/);
    // Both verifier stages must reach for the corrected text when it comes.
    const fixApplications = src.match(/verdict === ['"]fix['"]/g) || [];
    expect(fixApplications.length, 'examiner and skeptic must both apply v.fixed')
      .toBeGreaterThanOrEqual(2);
  });
});
