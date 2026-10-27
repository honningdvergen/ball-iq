import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { noBreakScores, NB_HYPHEN } from '../../src/lib/noBreakScore.js';
import { renderQuizItems } from '../../scripts/seo/quiz-widget.mjs';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

/**
 * 2026-10-16: "6-1" wrapped after its hyphen on narrow phones (seen on the
 * /quiz/bodo-glimt/ question cards). A digit-hyphen-digit is drawn with U+2011
 * NON-BREAKING HYPHEN instead, at render time only. The bank keeps its plain
 * hyphens, so search, answer matching, shares, reports and structured data
 * read exactly what they read before.
 */
describe('scores never break after the hyphen', () => {
  it('turns a hyphen between two digits into U+2011, and nothing else', () => {
    expect(NB_HYPHEN).toBe('‑');
    expect(noBreakScores('Bodø/Glimt won 6-1')).toBe('Bodø/Glimt won 6‑1');
    expect(noBreakScores('a 4-4-2 in 1988-89')).toBe('a 4‑4‑2 in 1988‑89');
    expect(noBreakScores('Saint-Étienne at half-time')).toBe('Saint-Étienne at half-time');
    expect(noBreakScores('a goal difference of -3')).toBe('a goal difference of -3');
    // An en dash keeps its look and is held to its digits by word joiners.
    expect(noBreakScores('won 2–0')).toBe('won 2\u2060–\u20600');
    expect(noBreakScores('the 2010–11 season')).toBe('the 2010\u2060–\u206011 season');
    expect(noBreakScores('Lille – Lens')).toBe('Lille – Lens');
    expect(noBreakScores(undefined)).toBe(undefined);
    expect(noBreakScores(7)).toBe(7);
  });

  // ⚠️ 26 Oct 2026: STATIC PAGES NO LONGER CARRY THE CHARACTERS. Google reads
  // them, and from 16 Oct they held 8,794 U+2011 and 1,818 zero-width U+2060
  // across 406 pages, four days before a ~93% site-wide drop. They keep plain
  // text and hold a score together with a nowrap span (scripts/seo/nb-html.mjs).
  it('the static quiz card keeps plain text, holds the score with a span, and still grades by index', () => {
    const html = renderQuizItems([{ id: 'q_t1', q: 'Final score 6-1?', o: ['6-1', '2-0', '1-1', '3-2'], a: 0 }]);
    expect(html).toContain('Final score <span style="white-space:nowrap">6-1</span>?');
    expect(html).not.toMatch(/[\u2011\u2060]/);
    const a = Number(html.match(/data-a="(\d)"/)[1]);
    const opts = [...html.matchAll(/<span class="tt">(.*?)<\/button>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    expect(opts[a]).toBe('6-1');
  });

  it('is applied where the app draws stems and options, never written back, never on static pages', () => {
    const qe = read('src/screens/QuizEngine.jsx');
    // qv: the question as the player reads it (i18n step 5, Spanish text when es).
    expect(qe).toContain('{noBreakScores(qv.q)}');
    expect(qe).toContain('{noBreakScores(opt)}');
    // The bank itself never carries the display character.
    expect(read('src/questions.js')).not.toContain('\u2011');
    for (const f of ['scripts/gen-seo-pages.mjs', 'scripts/seo/daily-answers-page.mjs', 'scripts/seo/quiz-widget.mjs']) {
      expect(read(f)).not.toContain('noBreakScores(');
    }
    const gen = read('scripts/gen-seo-pages.mjs');
    expect(gen).toContain('<p class="q">${nbHtml(r.q)}</p>');
    expect(gen).toContain('<p class="ans-q">${nbHtml(r.q)}</p>');
  });
});
