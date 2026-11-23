// 23 Nov 2026. JetBrains Mono draws its zero with a dot in the middle; at score
// size that zero reads as an eight (Alex, on the Hot Streak score: "zeros that
// can look a bit like an eight"). The same complaint had been patched one
// screen at a time before (DailyScreen, the profile card). Every number the
// player reads is now Inter with tabular figures. The mono face is kept for
// room codes only: their alphabet (A-HJ-NP-Z2-9) has no zero in it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizeJoinCode } from '../../src/App.jsx';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('no dotted zero where a player reads a number', () => {
  it('the app stylesheets use the mono face for room codes and nothing else', () => {
    const rules = [];
    for (const f of ['src/app.css', 'src/games/footle.css', 'src/components/resultCard.css', 'src/components/dailyDone.css', 'src/screens/league.css', 'src/screens/top10.css']) {
      const css = strip(read(f));
      for (const m of css.matchAll(/([^{}]+)\{[^{}]*JetBrains Mono[^{}]*\}/g)) rules.push(`${f}: ${m[1].trim().split('\n').pop().trim()}`);
    }
    expect(rules.sort()).toEqual(['src/app.css: .code-val', 'src/app.css: .og-code-input', 'src/app.css: .og-code-val']);
  });

  it('a room code can never contain a zero, so the mono face is safe there', () => {
    expect(normalizeJoinCode('a0b1c2o8')).toBe('ABC28');
    expect(normalizeJoinCode('000000')).toBeNull();
  });

  it('scores and timers drawn inline use the app font with tabular figures', () => {
    const app = read('src/App.jsx');
    const hs = app.slice(app.indexOf('function HotStreakEngine('), app.indexOf('function HotStreakEngine(') + 9000);
    expect(hs).toContain('fontFamily:"var(--font)",fontVariantNumeric:"tabular-nums",fontSize:22');
    expect(read('src/screens/OnlineMultiplayer.jsx')).toContain('const MONO = "var(--font)";');
    for (const f of ['src/screens/DailyScreen.jsx', 'src/screens/LocalPlay.jsx']) expect(read(f), f).not.toMatch(/fontFamily:\s*["`'][^\n]{0,4}JetBrains Mono/);
    expect(strip(read('src/games/footle.css'))).toMatch(/\.wd-countdown-time\{font-family:var\(--font\);font-variant-numeric:tabular-nums/);
  });
});
