import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = readFileSync(fileURLToPath(new URL('../../scripts/forge-curate.mjs', import.meta.url)), 'utf8');

/**
 * CURATION ONLY EVER SAW ITS OWN BATCH.
 *
 * Wave Q's ten recovered questions were curated clean and still contained the
 * Ayresome Park question already live on the Middlesbrough page, plus one
 * keying a player named in a live stem. Both were caught by hand. A top-up is
 * the normal shape of this work — every club that grows gets one — so the live
 * pack has to be part of the comparison rather than something the operator is
 * trusted to remember.
 *
 * Verified against the real case: re-running the pre-drop batch reports
 * `new [9] "Ayresome Park"` as a duplicate of the live question.
 */
describe('forge-curate judges a batch against the live pack', () => {
  it('reads the live pack for the club being curated', () => {
    expect(SRC).toMatch(/const livePack = /);
    // Keyed on the bank's `club` value — a mismatch reads as "no live pack"
    // and silently checks nothing, which is worse than not checking at all.
    expect(SRC).toMatch(/club:"\$\{clubField\}"/);
  });

  it('reports duplicates and leaks against what is already on the page', () => {
    expect(SRC).toMatch(/DUPLICATES A LIVE QUESTION/);
    expect(SRC).toMatch(/LEAKS AGAINST THE LIVE PACK/);
  });

  it('does not compare an already-inserted batch against itself', () => {
    // Re-running curation after add-questions matched every question against
    // its own live copy and reported the whole set as leaking.
    expect(SRC).toMatch(/newStems/);
    expect(SRC).toMatch(/filter\(\(l\) => !newStems\.has\(norm\(l\.q\)\)\)/);
  });
});
