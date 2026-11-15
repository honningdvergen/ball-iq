// 15 Nov 2026: three small things on the game most people finish.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../src/${p}`, import.meta.url)), 'utf8');
const FOOTLE = read('games/FootballWordle.jsx');
const DD = read('components/DailyDone.jsx');

describe('Footle: the keyboard does not give the row away', () => {
  it('while a row is flipping, the keys are graded on the rows before it', () => {
    expect(FOOTLE).toContain('getWordleKeyState(k, animRow >= 0 ? state.guesses.slice(0, animRow) : state.guesses, answer)');
    expect(FOOTLE).not.toContain('getWordleKeyState(k, state.guesses, answer)');
  });
});

describe('"Send it to a mate" carries the coloured grid', () => {
  it('Footle hands the finish panel its grid, the same one the share text uses', () => {
    expect(FOOTLE).toMatch(/const shareGrid = useMemo\(\(\) => \{/);
    expect(FOOTLE).toMatch(/const grid = shareGrid;/);
    expect(FOOTLE).toMatch(/challengeGrid=\{shareGrid\}/);
  });
  it('the message is the line, then the grid, then the link on its own line', () => {
    expect(DD).toContain('const text = challengeGrid ? `${line}\\n\\n${challengeGrid}\\n` : line;');
    expect(DD).toContain('navigator.share({ text, url })');
    expect((DD.match(/writeText\(challengeGrid \? `\$\{text\}\\n\$\{url\}` : `\$\{text\} \$\{url\}`\)/g) || []).length).toBe(2);
  });
  it('a game with no grid sends the line as before', () => {
    expect(DD).toMatch(/challengeGrid = ""/);
  });
});

describe('the challenge banner', () => {
  it('has a ring in the page colour, so nothing under it peeks out', () => {
    expect(read('components/ChallengeBanner.jsx')).toContain('boxShadow: "0 0 0 10px var(--bg, #0b0c10), 0 12px 32px rgba(0,0,0,0.45)"');
  });
});
