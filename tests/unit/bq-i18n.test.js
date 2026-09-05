import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BQ_I18N, BQ_I18N_KEYS } from '../../scripts/seo/bq-i18n.mjs';
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
  });
  it('the engine reads data-i18n once and routes its labels through T()', () => {
    expect(ENGINE).not.toContain('`');
    expect(ENGINE).toContain("JSON.parse(root.getAttribute('data-i18n')||'{}')");
    for (const k of ['question', 'next', 'seeResult', 'srCorrect', 'srWrong', 'keepGoing', 'playAgain', 'share', 'allDone', 'appLine', 'shareTxt', 'yourStreak', 'youPlayed', 'namePrompt']) {
      expect(ENGINE, k).toContain(`T('${k}',`);
    }
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
