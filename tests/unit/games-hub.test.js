import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GAMES_PAGE } from '../../scripts/seo/content.mjs';
import { GAMES_NAV } from '../../src/marketing/siteNav.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

/**
 * /football-games/ is the hub for the second head term (Alex, 2026-09-05:
 * top 5 on "football quiz" AND "football games" is queued, never parked).
 * Every page's Games link must point at it, the footer and the hub must
 * render one list, and the copy must carry no question count.
 */
describe('the /football-games/ hub', () => {
  it('is configured for the term and within the SERP limits', () => {
    expect(GAMES_PAGE.slug).toBe('football-games');
    expect(GAMES_PAGE.title).toMatch(/^Football Games/);
    expect(GAMES_PAGE.title.length).toBeLessThanOrEqual(60);
    expect(GAMES_PAGE.description.length).toBeLessThanOrEqual(160);
    const copy = [GAMES_PAGE.description, GAMES_PAGE.lede, ...GAMES_PAGE.body, ...GAMES_PAGE.faq.flatMap((f) => [f.q, f.a])].join(' ');
    expect(copy).not.toMatch(/\d{1,3},\d{3}/);
    expect(copy).not.toMatch(/\d+\s*\+?\s*questions/i);
  });
  it('one games list: siteNav feeds the footer and the hub', () => {
    expect(GAMES_NAV.length).toBeGreaterThanOrEqual(14);
    expect(GAMES_NAV.filter((g) => g.daily).map((g) => g.key)).toEqual(['footle', 'daily', 'trail', 'mystery']);
    expect(read('scripts/seo/shell.mjs')).toContain('GAMES_NAV.map((g) => [g.name, g.href])');
    expect(read('scripts/gen-seo-pages.mjs')).toContain("import { GAMES_NAV } from '../src/marketing/siteNav.js';");
  });
  it('both headers send Games to the hub, and the generator builds + sitemaps it', () => {
    expect(read('scripts/seo/shell.mjs')).toContain('href="${b}/football-games/"');
    expect(read('scripts/seo/shell.mjs')).not.toContain('href="${b}/#games"');
    expect(read('src/marketing/SiteHeader.jsx')).toContain('href="/football-games/">Games');
    const gen = read('scripts/gen-seo-pages.mjs');
    expect(gen).toContain('buildGamesPage();');
    expect(gen).toContain('loc: `${SITE.base}/${GAMES_PAGE.slug}/`');
    expect(gen).toContain('href="${SITE.base}/football-games/">daily games</a>');
  });
});
