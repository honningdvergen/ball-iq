import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { rootCss, TOKENS } from '../../src/design/tokens.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

/**
 * One palette, one place. The 2026-09-05 critique measured three body font
 * strings and a :root in app.css re-typing the hexes tokens.js already held
 * (and the islands copying that block a third time). The palette lift of
 * 09-04 had to touch 32 files for the same reason. These pin the shape:
 * tokens.js is the only place a palette value is written; app.css and the
 * islands read the app's names as aliases from it; body text uses --font.
 */
describe('one tokens.css', () => {
  const root = rootCss();
  it("rootCss() carries the app's names as aliases onto the web palette", () => {
    for (const [k, v] of [['s1', 'var(--card)'], ['border', 'var(--bd)'], ['accent', 'var(--grn)'], ['t2', 'var(--tx3)'], ['text', 'var(--tx)'], ['red', 'var(--wrong)'], ['gold', 'var(--amber)']]) {
      expect(TOKENS[k]).toBe(v);
      expect(root).toContain(`--${k}:${v}`);
    }
    expect(TOKENS.font).toMatch(/^'Inter',system-ui/);
    expect(root).toContain('--font:');
  });
  it('app.css defines no palette of its own', () => {
    const css = read('src/app.css');
    expect(css).not.toMatch(/^\s*--s1:\s*#/m);
    expect(css).not.toMatch(/^\s*--accent:\s*#/m);
    expect(css).not.toMatch(/^\s*--text:\s*#/m);
    expect(css).not.toMatch(/^\s*--[a-z0-9-]+:\s*inherit;/m);
  });
  it('the islands read the tokens instead of copying them', () => {
    const gen = read('scripts/gen-seo-pages.mjs');
    const i = gen.indexOf('.fw-host{');
    const host = gen.slice(i, gen.indexOf('}', i));
    expect(host).not.toContain('--s1:');
    expect(host).not.toContain('--accent:');
  });
  it('every body font declaration reads var(--font)', () => {
    for (const f of ['src/app.css', 'scripts/gen-seo-pages.mjs', 'scripts/seo/answer-shell.mjs', 'src/design/front.css', 'vite.config.js']) {
      expect(read(f), f).not.toMatch(/font-family:\s*'?Inter'?,/);
    }
    expect(read('src/app.css')).toContain('body{font-family:var(--font);');
  });
});
