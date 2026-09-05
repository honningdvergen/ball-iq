import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TOKENS } from '../../src/design/tokens.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');
const lum = (h) => { const c = [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/** The five P2 items of the 2026-09-05 critique, each measured there. */
describe('P2 quick wins stay fixed', () => {
  it('header links and Sign in are 44px targets in both stylesheets', () => {
    for (const f of ['scripts/seo/shell.mjs', 'src/design/front.css']) {
      const s = read(f);
      expect(s, f).toMatch(/\.fd-nav a\{display:inline-flex;align-items:center;min-height:44px/);
      expect(s, f).toMatch(/\.fd-signin\{[^}]*min-height:44px/);
    }
  });
  it('both footers are four columns and the static one draws badges', () => {
    for (const f of ['scripts/seo/shell.mjs', 'src/design/front.css']) {
      expect(read(f), f).toContain('.fd-foot-in{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))');
    }
    const shell = read('scripts/seo/shell.mjs');
    expect(shell).not.toContain('Also on <a');
    expect(shell).toContain("${badge('ios')}${badge('android')}");
    expect(shell).toContain("col('Quizzes'");
    expect(read('src/marketing/FrontDoor.jsx')).not.toContain('byLeague');
  });
  it('/lists pages put the table before the five-question taster', () => {
    const gen = read('scripts/gen-seo-pages.mjs');
    expect(gen.indexOf('${table}')).toBeLessThan(gen.indexOf('<h2>Think you know this? Five questions</h2>'));
  });
  it('/football-quiz/ has the club filter and league jump chips', () => {
    const gen = read('scripts/gen-seo-pages.mjs');
    expect(gen).toContain('id="fq-filter"');
    expect(gen).toContain('class="fq-chip" href="#${lgId(g.league)}"');
    expect(gen).toContain('<script>${FQ_FILTER_JS}</script>');
  });
  it('the caption grey clears AA on every surface', () => {
    for (const bg of [TOKENS.bg, TOKENS.card, TOKENS.card2]) expect(cr(TOKENS.tx4, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
