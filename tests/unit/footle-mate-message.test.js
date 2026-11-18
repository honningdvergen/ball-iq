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

// 18 Nov 2026: the pill floated over the top of the screen for six seconds and
// covered the game's title on Alex's phone ("To," was what was left of
// "Top 10"). The score to beat is now the header's own second line.
describe('the score to beat sits in the header, over nothing', () => {
  const BANNER = read('components/ChallengeBanner.jsx');
  const code = BANNER.slice(BANNER.indexOf('export default function ChallengeBanner'));
  it('is in the flow, never fixed, and has no timer to take it away', () => {
    expect(code).not.toMatch(/position:\s*"fixed"/);
    expect(code).not.toMatch(/setTimeout|zIndex/);
    expect(code).toContain('if (!c || finished) return children;');
  });
  it('the name is the part that trims; the score and "Beat it?" never are', () => {
    expect(code).toMatch(/textOverflow: "ellipsis", whiteSpace: "nowrap" \}\}>\{who\}<\/span>/);
    expect(code).toMatch(/flexShrink: 0, whiteSpace: "nowrap" \}\}>· \{scoreLabel\(game, c\.score, t\)\}<\/span>/);
    // One line high: "Beat it?" wraps to a second line the fixed height hides, whole.
    expect(code).toMatch(/flexWrap: "wrap"[^}]*height: "1\.35em"[^}]*overflow: "hidden"/);
  });
  it('each game puts it where its usual second line was, and only on the live puzzle', () => {
    expect(read('screens/Top10.jsx')).toContain('sub={isArchive || embedded ? sub : <ChallengeBanner game="top10" edition={number} finished={g.done}>{sub}</ChallengeBanner>}');
    expect(read('screens/TransferTrail.jsx')).toContain('<ChallengeBanner game="trail" edition={daily && !isArchive ? number : -1} finished={done}>');
    expect(read('games/FootballWordle.jsx')).toContain('<div className="wd-sub"><ChallengeBanner game="footle" edition={isArchive ? -1 : getFootleNumber(date)} finished={state.status !== "playing"}>');
    // Top 10 hides its second line when a short phone has the keyboard up: not when it is the score to beat.
    expect(read('screens/top10.css')).toContain('.t10.is-tight .t10-head-sub:has(.ch-line) { display: block; }');
    for (const f of ['screens/Top10.jsx', 'screens/TransferTrail.jsx', 'games/FootballWordle.jsx']) {
      expect((read(f).match(/<ChallengeBanner /g) || []).length, f).toBe(1);
    }
  });
});
