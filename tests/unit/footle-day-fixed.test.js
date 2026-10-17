import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The Footle board keeps the day it opened on (review, 17 Oct 2026). With
// `date = new Date()` as a default prop, every render after midnight (a
// finished board re-renders each second for its countdown) moved the key, the
// answer and the save to the new day before the 5 s rollover reload, writing
// yesterday's win into today's record. No harness here can re-render a live
// component across midnight, so this holds the shape of the fix in place.
const src = readFileSync(new URL('../../src/games/FootballWordle.jsx', import.meta.url), 'utf8');

describe('the Footle board keeps the day it opened on', () => {
  it('takes no fresh Date as a default prop', () => {
    const sig = src.match(/function FootballWordle\(\{([^}]*)\}/)?.[1] || '';
    expect(sig).toContain('date: dateProp');
    expect(sig).not.toMatch(/date\s*=\s*new Date/);
  });
  it('fixes the day once, and decides archive against that same moment', () => {
    expect(src).toMatch(/const \[openedAt\] = useState\(\(\) => new Date\(\)\);/);
    expect(src).toMatch(/const date = dateProp \|\| openedAt;/);
    expect(src).toMatch(/const isArchive = dateKey !== getWordleDateKey\(openedAt\);/);
  });
  it('still reloads a live board when the real day rolls over', () => {
    expect(src).toMatch(/if \(getWordleDateKey\(\) !== dateKey\) window\.location\.reload\(\);/);
  });
});
