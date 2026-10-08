// The guess box must find a player from the spelling a plain keyboard produces.
//
// Until 2026-10-09 the suggestions list folded names with a mark-strip only, so
// the letters that do not decompose (ø ł ı ß đ ð æ) were DELETED rather than
// replaced: "Ødegaard" was searchable as "degaard" and as nothing else. The
// Trail's grader had known better since July, which made it worse: the game
// would have accepted "odegaard", but the list the player picks from never
// offered him. About 150 of the pool's players were affected.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { normaliseName } from '../../src/lib/mysteryPlayer.js';
import { rankPlayerSuggestions } from '../../src/lib/playerSearch.js';
import { normaliseGuess, normaliseVariants } from '../../src/lib/trail.js';
import { LETTER_FOLD } from '../../src/lib/letterFold.js';

const POOL = JSON.parse(readFileSync(new URL('../../src/data/mysteryPool.json', import.meta.url), 'utf8'));
const first = (q) => rankPlayerSuggestions(POOL, q, { limit: 1 })[0]?.name;

describe('normaliseName folds the letters NFD leaves alone', () => {
  it.each([
    ['Martin Ødegaard', 'martin odegaard'],
    ['Pierre-Emile Højbjerg', 'pierre emile hojbjerg'],
    ['Kenan Yıldız', 'kenan yildiz'],
    ['Jakub Błaszczykowski', 'jakub blaszczykowski'],
    ['Weiß', 'weiss'],
    ['Đorđević', 'dordevic'],
    ['Guðjohnsen', 'gudjohnsen'],
    ['Thomas Müller', 'thomas muller'],
    ['İlkay Gündoğan', 'ilkay gundogan'],
  ])('%s -> %s', (name, folded) => {
    expect(normaliseName(name)).toBe(folded);
  });

  it('agrees with the Trail grader, letter for letter', () => {
    for (const p of POOL) {
      expect(normaliseName(p.name).replace(/[^a-z]/g, '')).toBe(normaliseGuess(p.name));
    }
  });

  it('leaves no pool name with a letter folded away to nothing', () => {
    const special = new RegExp(`[${Object.keys(LETTER_FOLD).join('')}]`, 'i');
    const lost = POOL.filter((p) => special.test(p.name) && normaliseName(p.name).length < p.name.replace(/[^\p{L} ]/gu, '').length - 2);
    expect(lost.map((p) => p.name)).toEqual([]);
  });
});

describe('the suggestions list finds them', () => {
  it.each([
    ['odegaard', 'Martin Ødegaard'],
    ['oedegaard', 'Martin Ødegaard'],
    ['hojbjerg', 'Pierre-Emile Højbjerg'],
    ['yildiz', 'Kenan Yıldız'],
    ['blaszczykowski', 'Jakub Błaszczykowski'],
    ['sorloth', 'Alexander Sørloth'],
    ['mueller', 'Thomas Müller'],
    ['muller', 'Thomas Müller'],
    ['gundogan', 'İlkay Gündoğan'],
  ])('%s -> %s', (typed, name) => {
    expect(first(typed)).toBe(name);
  });

  it('every pool player comes up for the plain spelling of his own name', () => {
    const missing = [];
    for (const p of POOL) {
      const [plain] = normaliseVariants(p.name);
      if (!plain || plain.length < 2) continue;
      // normaliseVariants strips spaces; search the longest word instead.
      const word = normaliseName(p.name).split(' ').sort((a, b) => b.length - a.length)[0];
      if (word.length < 2) continue;
      const hits = rankPlayerSuggestions(POOL, word, { limit: 500 });
      if (!hits.some((h) => h.id === p.id)) missing.push(p.name);
    }
    expect(missing).toEqual([]);
  }, 60000);

  it('keeps the order the ranking was tuned for', () => {
    expect(rankPlayerSuggestions(POOL, 'ronaldo', { limit: 2 }).map((p) => p.name)).toEqual(['Cristiano Ronaldo', 'Ronaldo']);
    expect(first('saka')).toBe('Bukayo Saka');
    expect(first('james')).toBe('James Rodríguez');
  });
});
