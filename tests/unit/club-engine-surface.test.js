import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ENGINE = readFileSync(fileURLToPath(new URL('../../scripts/seo/club-quiz-engine.js', import.meta.url)), 'utf8');
// Comments out, so an assertion cannot be satisfied by its own explanation.
const CODE = ENGINE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/**
 * The engine's funnel rows are the only per-page signal from the surface that
 * carries ~39% of all play. seo-funnel-attribution.test.js guards the
 * GENERATOR's attribution; when commit 07a838b moved the engine into its own
 * file, nothing guarded the engine's — and it had been stamping 'club-page' on
 * every page class that embeds it since the day it shipped.
 */
describe('the club engine attributes its rows to the real page class', () => {
  it('derives the surface from data-kind, in ONE place', () => {
    expect(CODE).toMatch(/var kind=\(root&&root\.getAttribute\('data-kind'\)\)\|\|''/);
    expect(CODE).toMatch(/surface:daily\?'daily-page':\(\(kind&&kind!=='unknown'\)\?kind\+'-page':'club-page'\)/);
  });

  it("'club-page' appears only as the fallback for a page with no data-kind", () => {
    // If someone reintroduces a bare surface:'club-page', every listicle and
    // hub page becomes a club page again.
    const bare = CODE.match(/surface:\s*'club-page'/g) || [];
    expect(bare, "a hardcoded surface:'club-page' is back").toHaveLength(0);
  });

  it('carries kind on the row so the class can be filtered without parsing the surface', () => {
    expect(CODE).toMatch(/if\(kind\)meta\.kind=kind;/);
  });

  it('still names the daily surface on the daily island (daily-page)', () => {
    expect(CODE).toMatch(/daily\?'daily-page'/);
  });
});
