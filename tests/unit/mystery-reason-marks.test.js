import { describe, it, expect } from 'vitest';
import '../../src/i18n/en.js';
import { reasonMarks } from '../../src/lib/mysteryPlayer.js';

/**
 * The guess list prints club, position and era as three marks, lit when the
 * guess shares it with the answer (12 Nov 2026). All three are always said:
 * the sentence form (reasonLine) leaves a missed position out, and the first
 * version of the marks, which parsed that sentence, lit "No shared club".
 */
describe('reasonMarks', () => {
  const x = (o) => ({ shared: [], samePosition: false, gap: 12, era: 'far', bornWhen: 'later', ...o });
  it('says all three, a miss included, and lights only what is shared', () => {
    expect(reasonMarks(x({}))).toEqual([
      { text: 'No shared club', hit: false }, { text: 'Other position', hit: false }, { text: 'Later era', hit: false },
    ]);
    expect(reasonMarks(x({ samePosition: true, gap: 6, era: 'near' }))).toEqual([
      { text: 'No shared club', hit: false }, { text: 'Same position', hit: true }, { text: 'Born 6 years later', hit: false },
    ]);
  });
  it('a shared club and the same era are lit; teammates outrank a shared club', () => {
    const m = reasonMarks(x({ shared: [{ club: 'Barcelona', together: 0 }], samePosition: true, gap: 2, era: 'same', bornWhen: 'earlier' }));
    expect(m.map((k) => k.hit)).toEqual([true, true, true]);
    expect(m[0].text).toBe('Shared Barcelona');
    expect(reasonMarks(x({ shared: [{ club: 'Arsenal', together: 3 }, { club: 'Barcelona', together: 0 }] }))[0]).toEqual({ text: 'Teammates at Arsenal', hit: true });
  });
  it('nothing to say about the answer itself or a player it does not know', () => {
    expect(reasonMarks(null)).toEqual([]);
    expect(reasonMarks(x({ gap: null, era: null, bornWhen: null })).length).toBe(2);
  });
});
