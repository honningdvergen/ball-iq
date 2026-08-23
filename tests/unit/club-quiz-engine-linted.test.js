import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const ENGINE = 'scripts/seo/club-quiz-engine.js';

/**
 * The club-quiz engine must stay on disk, and stay linted.
 *
 * ⚠️ IT USED TO LIVE IN A TEMPLATE LITERAL, where every line was a STRING to
 * every tool we run — no no-undef, no no-redeclare, no no-shadow. It is the
 * largest body of JavaScript we ship and it was the only one nothing parsed.
 *
 * On 2026-08-23 a gesture gate declared a variable named `off`, colliding with
 * the module-level pagination offset four hundred lines up. `var` is
 * function-scoped, so it shadowed the offset across the whole of start():
 *   · the handler threw "off is not a function", the listener never detached,
 *     and clubq-start fired on EVERY tap — 30.5 events per visitor against 1.1
 *     before the change, which had been made to REDUCE over-counting;
 *   · the real offset never reached module scope, so "Keep going" restarted
 *     from question zero. A gameplay regression from a measurement change.
 *
 * Three regex guards were attempted first and all three produced false
 * positives, because a regex cannot do scope analysis. Moving the file to disk
 * lets ESLint do it properly: with no-shadow on, the same edit now reports
 * "'off' is already declared in the upper scope on line 88" instantly.
 *
 * The extraction was verified byte-identical against a regenerated baseline —
 * an earlier attempt shipped the file's own 20-line header onto ~140 pages and
 * substituted the real Supabase key into the comment naming the placeholders.
 * These assertions keep the arrangement that makes the linting possible.
 */
describe('the club-quiz engine stays linted', () => {
  const engine = read(ENGINE);
  const gen = read('scripts/gen-seo-pages.mjs');
  const pkg = JSON.parse(read('package.json'));
  const eslintCfg = read('eslint.config.js');

  it('lives on disk as real JavaScript', () => {
    expect(engine.length).toBeGreaterThan(20000);
    expect(engine, 'engine body missing').toMatch(/function start\(n,from\)/);
  });

  it('is in the build gate, not merely lintable in principle', () => {
    // The gate ran `eslint src --quiet` for years and scripts/** is ignored,
    // so putting the file on disk without adding it here would change nothing.
    expect(pkg.scripts.build, 'the build does not lint the engine').toContain(ENGINE);
    expect(pkg.scripts.lint, 'npm run lint does not cover the engine').toContain(ENGINE);
  });

  it('has the rules that would have caught the defect', () => {
    const block = eslintCfg.slice(eslintCfg.indexOf(ENGINE));
    for (const rule of ['no-redeclare', 'no-shadow', 'no-undef']) {
      expect(block, `${rule} is not an error for the engine`).toMatch(new RegExp(`'${rule}':\\s*'error'`));
    }
  });

  it('keeps the ENGINE START marker the generator slices from', () => {
    // Without it the generator throws; with it in the wrong place the engine
    // ships truncated. Both happened while building this.
    expect(engine, 'marker missing').toContain('/* ---- ENGINE START');
    const marker = engine.indexOf('/* ---- ENGINE START');
    const iife = engine.indexOf('(function(){');
    expect(iife, 'the marker must sit immediately before the engine IIFE').toBeGreaterThan(marker);
    expect(engine.slice(marker, iife).split('\n').length).toBeLessThan(4);
  });

  it('the generator reads the file rather than inlining a literal', () => {
    expect(gen, 'the engine is inline again').toMatch(/readFileSync\(\s*new URL\('\.\/seo\/club-quiz-engine\.js'/);
    expect(gen, 'placeholder substitution missing').toContain('__BQ_SUPABASE_URL__');
  });

  it('keeps its placeholders quoted so the file parses standalone', () => {
    // They are not valid values; if someone "fixes" them into bare identifiers
    // the file stops parsing and the lint silently covers nothing.
    expect(engine).toMatch(/'__BQ_SUPABASE_URL__'|"__BQ_SUPABASE_URL__"/);
    expect(engine).toMatch(/'__BQ_PUBLISHABLE_KEY__'|"__BQ_PUBLISHABLE_KEY__"/);
  });

  it('contains no backtick or template placeholder', () => {
    // It is interpolated into a <script> tag; a stray backtick terminated the
    // old literal, and the rule is worth keeping either way.
    const body = engine.slice(engine.indexOf('/* ---- ENGINE START'));
    expect(body.includes('`'), 'a backtick in the engine').toBe(false);
    expect(body.includes('${'), 'a template placeholder in the engine').toBe(false);
  });
});
