import { describe, it, expect } from 'vitest';
import { QB } from '../../src/questions.js';
import { RETIRED_TAGS } from '../../src/lib/quiz.js';

/**
 * The chip above a question must never name its answer.
 *
 * Every question shows its category as a chip ("CHAMPIONS LEAGUE", "PREMIER
 * LEAGUE"). Alex, 27 Oct 2026, on q_36e4c2: the chip read CHAMPIONS LEAGUE over
 * "...sent Spurs to a first-ever final in which competition?" with the options
 * FA Cup and Club World Cup for a tie against Ajax. The chip answered it before
 * the options were read. 13 live questions had the same shape.
 *
 * Rule: if the keyed answer contains the chip's words and no distractor does,
 * the chip gives it away. Fix the question (reword the answer to match its
 * siblings, or move it to a category whose chip says nothing), never the chip.
 *
 * Labels mirror CAT_LABELS in App.jsx for the competition categories; the
 * others (History, Legends, International...) never appear as an answer.
 */
const CHIP = {
  UCL: 'Champions League', PL: 'Premier League', LaLiga: 'La Liga',
  Bundesliga: 'Bundesliga', SerieA: 'Serie A', Ligue1: 'Ligue 1',
  SuperLig: 'Süper Lig', Primeira: 'Primeira Liga', Euros: 'Euros',
};
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

describe('the category chip never names the answer', () => {
  it('no live question keys an answer that alone repeats its chip', () => {
    const leaks = [];
    for (const q of QB) {
      if (!q || q.type !== 'mcq' || !Array.isArray(q.o)) continue;
      if (q.tag && RETIRED_TAGS.has(q.tag)) continue;
      const chip = CHIP[q.cat];
      if (!chip) continue;
      const has = (o) => norm(o).includes(norm(chip));
      if (has(q.o[q.a]) && !q.o.some((o, i) => i !== q.a && has(o))) {
        leaks.push(`${q.id} [${q.cat}] ${q.q.slice(0, 60)} => ${q.o[q.a]}`);
      }
    }
    expect(leaks).toEqual([]);
  });
});
