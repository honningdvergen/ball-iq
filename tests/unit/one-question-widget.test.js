import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GEN = readFileSync(fileURLToPath(new URL('../../scripts/gen-seo-pages.mjs', import.meta.url)), 'utf8');

/**
 * The 2026-09-05 critique counted four multiple-choice widgets on one domain.
 * The static site's five-question "taster" is gone from the English pages:
 * listicles and /football-quiz/ render the same .bq widget (renderQuizSet) as
 * every club, league and category page and the served Daily 7. Its script
 * survives only inside the localised club-page builders, whose translated UI
 * the .bq engine cannot yet speak. This pins that count so the taster cannot
 * creep back onto an English page; when the localised pages move over, drop
 * the expected count to 0 and delete TASTER_*.
 */
describe('one question widget on the static site', () => {
  it('no English page renders the old taster', () => {
    expect(GEN).not.toMatch(/renderTaster\(/);
    expect(GEN).not.toContain('taster: hasTaster');
  });
  it('TASTER_JS is emitted only by the localised builders (2 sites)', () => {
    expect((GEN.match(/<script>\$\{TASTER_JS\}<\/script>/g) || []).length).toBe(2);
  });
  it('the English pages that had the taster now render the .bq widget', () => {
    expect(GEN).toContain("renderQuizSet(tasterRows, { name: 'this list'");
    expect(GEN).toContain("renderQuizSet(tasterRows, { name: 'football'");
  });
});
