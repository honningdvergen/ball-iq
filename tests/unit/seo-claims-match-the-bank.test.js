import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { QB } from '../../src/questions.js';

/**
 * A promise on an indexed page must be true of the thing it promises.
 *
 * ⚠️ FOUND 2026-08-24 WHILE MEASURING CLUB PACK DEPTH. Three live club pages
 * told readers that the app holds "hundreds more questions" for that club:
 *
 *     "get the full Juventus quiz — hundreds more questions …"
 *     "The full Juventus quiz — with hundreds more questions …"
 *     "open the Ball IQ app for the full Ajax quiz — hundreds more questions"
 *
 * Not one of the 86 club packs has 100 questions. Arsenal is the largest at 65
 * and the median is 40 — so the claim was false for EVERY club, on pages that
 * are indexed and are the biggest traffic source we have. It is also the worst
 * possible place to overstate: it is the promise made BEFORE the install, so
 * the player who believes it is the one who counts.
 *
 * The same sentence about the World Cup set is TRUE (657 questions) and stays.
 * That is the point of measuring rather than banning a phrase.
 *
 * ⚠️ Fixed by DROPPING the magnitude, not by stating the real one — printing a
 * question count is separately forbidden (a standing rule with seven previous
 * disguises), and a number in prose rots the moment the bank grows.
 */

const SEO_DIR = fileURLToPath(new URL('../../scripts/seo', import.meta.url));
const SOURCES = readdirSync(SEO_DIR)
  .filter((f) => f.endsWith('.mjs'))
  .map((f) => ({ file: `scripts/seo/${f}`, text: readFileSync(`${SEO_DIR}/${f}`, 'utf8') }));

/** Live pack sizes, so the threshold is measured and not remembered. */
function clubPackSizes() {
  const byClub = new Map();
  for (const q of QB) {
    if (!q?.club) continue;
    if (q.tag === 'summer2026') continue;
    byClub.set(q.club, (byClub.get(q.club) || 0) + 1);
  }
  return byClub;
}

describe('SEO claims match the bank', () => {
  it('the sources and the bank are both visible', () => {
    // A zero on either side makes every assertion below vacuously true.
    expect(SOURCES.length).toBeGreaterThan(2);
    expect(QB.length).toBeGreaterThan(6000);
    expect(clubPackSizes().size).toBeGreaterThan(50);
  });

  it('no club page claims "hundreds" of questions for a club', () => {
    const biggest = Math.max(...clubPackSizes().values());
    // If a pack ever genuinely reaches 200+, this assertion is what tells you
    // the claim has become sayable — change it deliberately, with the number.
    expect(
      biggest,
      'a club pack now has 200+ questions — "hundreds" may be defensible again',
    ).toBeLessThan(200);

    const offenders = [];
    for (const { file, text } of SOURCES) {
      for (const m of text.matchAll(/hundreds\s+(?:more|of)[^."]{0,40}questions/gi)) {
        const window = text.slice(Math.max(0, m.index - 260), m.index);
        // Only a CLUB claim is false; the World Cup set really does hold 657.
        if (/\bquiz\b/i.test(window) && !/World Cup|Champions League|Euro/i.test(window)) {
          offenders.push(`${file}: …${text.slice(Math.max(0, m.index - 60), m.index + 30).replace(/\s+/g, ' ')}`);
        }
      }
    }
    expect(
      offenders,
      `\n  Largest club pack is ${biggest} questions; the median is far lower.\n` +
      '  Drop the magnitude rather than stating it — a printed question count\n' +
      '  is separately forbidden, and a number in prose rots as the bank grows.\n',
    ).toEqual([]);
  });

  it('the true World Cup claim is left alone', () => {
    // ⚠️ Guards against "fixing" this by banning the phrase everywhere, which
    // would delete an accurate sentence and make the page weaker for nothing.
    const wc = QB.filter((q) => q?.cat === 'WorldCup').length;
    expect(wc, 'the World Cup set should still justify "hundreds"').toBeGreaterThanOrEqual(200);
    const content = SOURCES.find((s) => s.file.endsWith('content.mjs'));
    expect(content.text).toMatch(/full World Cup quiz in the app for hundreds more/);
  });
});
