import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BQ_I18N, BQ_I18N_KEYS, BQ_I18N_REVIEWED } from '../../scripts/seo/bq-i18n.mjs';
import { renderQuizSet } from '../../scripts/seo/quiz-widget.mjs';

const ENGINE = readFileSync(fileURLToPath(new URL('../../scripts/seo/club-quiz-engine.js', import.meta.url)), 'utf8');

// The English defaults live inline in the engine as T('key','…'); this map is
// what each localised template must be able to substitute.
const PLACEHOLDERS = {
  yourIq: ['name'], right: ['sc', 'n', 'pct', 'best'], daysRow: ['d'], keepGoing: ['more'], share: ['name'], allDone: ['name'],
  shareTxt: ['name', 'iq', 'tier', 'sc', 'n'], quizTitle: ['name'], quick: ['n'], standard: ['n'], todaySet: ['name'], freshOrder: ['date'],
  dayOk: ['n'], dayKeep: ['n'], earlier: ['sc', 'n', 'iq'],
};

describe('bq widget i18n', () => {
  it('every language carries every key, and every template its placeholders', () => {
    for (const [lang, t] of Object.entries(BQ_I18N)) {
      for (const k of BQ_I18N_KEYS) expect(t[k], `${lang}.${k}`).toBeDefined();
      expect(t.tiers, `${lang}.tiers`).toHaveLength(6);
      for (const [k, ph] of Object.entries(PLACEHOLDERS)) for (const p of ph) expect(t[k], `${lang}.${k} lacks {${p}}`).toContain(`{${p}}`);
    }
    expect(Object.keys(BQ_I18N).sort()).toEqual(['de', 'es', 'fr', 'id', 'it', 'nl', 'pt', 'tr']);
    for (const l of BQ_I18N_REVIEWED) expect(BQ_I18N[l], `${l} reviewed but has no table`).toBeDefined();
  });
  it('every language is approved and both localised builders render the widget with lang', () => {
    expect([...BQ_I18N_REVIEWED].sort()).toEqual(Object.keys(BQ_I18N).sort());
    const gen = readFileSync(fileURLToPath(new URL('../../scripts/gen-seo-pages.mjs', import.meta.url)), 'utf8');
    expect((gen.match(/lang: cfg\.lang \}\)/g) || []).length).toBe(2);
  });
  it('the engine reads data-i18n once and routes its labels through T()', () => {
    expect(ENGINE).not.toContain('`');
    expect(ENGINE).toContain("JSON.parse(root.getAttribute('data-i18n')||'{}')");
    for (const k of ['question', 'next', 'seeResult', 'srCorrect', 'srWrong', 'keepGoing', 'playAgain', 'share', 'allDone', 'appLine', 'shareTxt', 'yourStreak', 'youPlayed', 'namePrompt']) {
      expect(ENGINE, k).toContain(`T('${k}',`);
    }
    // Declared BEFORE its first reader. The first cut declared I18N forty lines
    // below the tiers line that reads I18N.tiers, and every club page's engine
    // died at boot ("Cannot read properties of undefined (reading 'tiers')") —
    // caught by playing the local build, not by any gate. There is no DOM in
    // this test environment to boot the engine, so order is what we can pin.
    expect(ENGINE.indexOf('var I18N={};')).toBeGreaterThan(-1);
    expect(ENGINE.indexOf('var I18N={};')).toBeLessThan(ENGINE.indexOf('I18N.tiers'));
    expect(ENGINE.indexOf('function T(k,d)')).toBeLessThan(ENGINE.indexOf("T('question'"));
    // the raw literals must not survive OUTSIDE a T() default
    expect(ENGINE).not.toMatch(/textContent='Question '/);
    expect(ENGINE).not.toMatch(/\?'See your result →':'Next question →'/);
  });
  it('renderQuizSet({lang}) localises the markup and ships the table', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: `q${i}`, q: `Q${i}`, o: ['a', 'b', 'c', 'd'], a: 0, hint: 'why', diff: 'hard' }));
    const es = renderQuizSet(rows, { name: 'Boca', tiers: ['a', 'b', 'c', 'd', 'e', 'f'], lang: 'es' });
    expect(es).toContain('data-lang="es"');
    expect(es).toContain('data-i18n="');
    expect(es).toContain('Siguiente →');
    expect(es).toContain('<b>Por qué</b>');
    expect(es).toContain('difícil');
    const en = renderQuizSet(rows, { name: 'Boca', tiers: ['a', 'b', 'c', 'd', 'e', 'f'] });
    expect(en).not.toContain('data-i18n="'); // the engine script reads the attribute, so the bare word is always present
    expect(en).toContain('Next question →');
  });
});
