// 22 Nov 2026: people tap Footle's colour key expecting more (Clarity counted
// about 300 taps a week on it and the line beside it, with nothing happening).
// The key now opens the same rules sheet as "?", and looks the same.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const src = read('src/games/FootballWordle.jsx');
const css = read('src/games/footle.css');
const golden = JSON.parse(read('tests/unit/i18n-games.golden.json'));

describe("Footle's colour key", () => {
  it('is a button that does what "?" does, and its spoken name keeps the words on screen', () => {
    expect(src).toMatch(/<button type="button" className="wd-legend wd-legend--tap" onClick=\{onHowToPlay\}>/);
    const html = golden['footle: fresh board (legend, hard-mode switch)'];
    const key = html.slice(html.indexOf('<button type="button" class="wd-legend wd-legend--tap">'), html.indexOf('</button>', html.indexOf('wd-legend--tap')));
    expect(key).not.toContain('aria-label');
    expect(key.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).toBe('right spot wrong spot . How to play Footle');
  });
  it('stays plain text where there is no rules sheet to open', () => {
    const plain = golden['footle: no back, no help, no report'];
    expect(plain).toContain('<div class="wd-legend" aria-hidden="true">');
    expect(plain).not.toContain('wd-legend--tap');
    expect(golden['footle: fresh board (legend, hard-mode switch)']).toContain('<button type="button" class="wd-legend wd-legend--tap">');
  });
  it('has no chrome of its own and does not change the height of its slot', () => {
    const rule = css.slice(css.indexOf('.wd-legend--tap{'), css.indexOf('}', css.indexOf('.wd-legend--tap{')));
    expect(rule).toContain('padding:0;border:0;background:none');
    expect(rule).not.toMatch(/min-height|height:/);
    // The larger hit area is an overlay, so the board and keyboard stay put.
    expect(css).toMatch(/\.wd-legend--tap::after\{content:"";position:absolute;inset:-12px -8px;\}/);
  });
});
