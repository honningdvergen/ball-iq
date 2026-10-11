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

/**
 * Nothing a player reads may say the questions are written by hand.
 *
 * They are drafted by a research pipeline and then verified twice; Alex's
 * standing rule is that no page claims otherwise. ⚠️ FOUND LIVE 2026-10-09 on
 * the front door's own "Where do the questions come from?": "Written and
 * fact-checked by hand, not scraped." It sat there through an audit that was
 * looking for exactly this, because the audit read the generated pages and the
 * front door is a React component. So this reads both.
 *
 * Only text a player can see is tested: a string literal or JSX text. Code
 * comments say "by hand" about our own work all the time and are not claims.
 *
 * "Hand-picked" is deliberately NOT caught. Three generated pages call their
 * sets "a hand-picked set of ... questions", which is a claim about choosing
 * the set for the page, not about who wrote the questions. Whether that is
 * also too much is Alex's call (docs/TODO.md), not this test's.
 */
describe('nothing claims the questions are written by hand', () => {
  const MARKETING = fileURLToPath(new URL('../../src/marketing', import.meta.url));
  const pages = [
    ...SOURCES,
    ...readdirSync(MARKETING).filter((f) => /\.(jsx|js)$/.test(f)).map((f) => ({ file: `src/marketing/${f}`, text: readFileSync(`${MARKETING}/${f}`, 'utf8') })),
  ];
  const CLAIM = /(?:written|writ|made|crafted|curated|checked|fact-checked|verified|researched)[^.<>'"`]{0,40}\bby hand\b|\bhand-?(?:written|crafted|made)\b[^.<>'"`]{0,40}question|question[^.<>'"`]{0,60}\bhand-?(?:written|crafted|made)\b/i;
  const visible = (text) => text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')       // block comments
    .replace(/^\s*\/\/.*$/gm, ' ')              // whole-line comments
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');  // JSX comments

  it('on the front door, the static pages and every generated page', () => {
    const offenders = [];
    for (const { file, text } of pages) {
      for (const line of visible(text).split('\n')) {
        const m = line.match(CLAIM);
        if (m) offenders.push(`${file}: …${line.trim().slice(Math.max(0, m.index - 50), m.index + 90)}`);
      }
    }
    expect(offenders, '\n  Say how they are really made: researched against sources and fact-checked.\n').toEqual([]);
  });

  it('the front door says how they are really made', () => {
    const door = pages.find((p) => p.file.endsWith('FrontDoor.jsx')).text;
    expect(door).toMatch(/Where do the questions come from\?<\/dt><dd>Researched against sources and fact-checked, not scraped\./);
  });

  it('the check would have caught the sentence that was live', () => {
    for (const said of ['Written and fact-checked by hand, not scraped.', 'Every question is hand-written.', 'hand-written questions about your club', 'Each one checked by hand.']) expect(said).toMatch(CLAIM);
    for (const fine of ['Researched against sources and fact-checked, not scraped.', 'a hand-picked set of harder football trivia questions', 'Hand of God']) expect(fine).not.toMatch(CLAIM);
    // a comment is not a claim: it is stripped before the match
    expect(visible('// every entry was resolved by hand\nconst a = 1;')).not.toMatch(CLAIM);
  });
});

