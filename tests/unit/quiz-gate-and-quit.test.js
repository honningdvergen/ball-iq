import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
// The engine left App.jsx on 2026-09-06 (E16, brick 9); the web-shell gate stays in App.
const APP = read('../../src/App.jsx') + '\n' + read('../../src/screens/QuizEngine.jsx');
const CSS = read('../../src/app.css');

describe('timed quiz start + quit (2026-09-06)', () => {
  it('no start gate at all: no "Ready?" interstitial, no 3-2-1 — the clock runs from Q1', () => {
    expect(APP).not.toMatch(/aria-label="Start the quiz"/);
    expect(APP).not.toMatch(/>Ready\?</);
    expect(APP).not.toMatch(/q-countdown/);
    expect(CSS).not.toMatch(/q-countdown|q-card-gated/);
    expect(APP).toMatch(/const \[armed, setArmed\] = useState\(true\);/);
  });
  it('the quit confirm is a centred, stacked sheet: title, the stake, a full-width primary, plain-text quit', () => {
    expect(APP).toMatch(/Leave this quiz\?/);
    expect(APP).toMatch(/right from <strong>\{idx\}<\/strong> answered/);
    expect(APP).toMatch(/className="modal-grab"/);
    expect(APP).not.toMatch(/modal-well/);
    expect(CSS).toMatch(/\.modal-overlay\{[^}]*align-items:flex-end/);
    expect(CSS).toMatch(/\.modal-head\{[^}]*flex-direction:column/);
    expect(CSS).toMatch(/\.modal-btns\{[^}]*flex-direction:column/);
    expect(CSS.match(/\n\.modal-cancel\{[^}]*\}/)?.[0] || '').toContain('background:var(--accent)');
    expect(CSS.match(/\n\.modal-confirm\{[^}]*\}/)?.[0] || '').toContain('background:none');
  });
  it('web chrome is hidden during a game; the sticky footer fades; report precedes the primary (review A2-A4)', () => {
    // ⚠️ Pinned `!inGame` until 2026-09-07, which is only the three shared-quiz
    // screens. On /play?game=footle the site header stayed live -- 57px of
    // wordmark and plain <a href> nav (Today / Games / Clubs / Quizzes / Lists)
    // over a running round, a full page navigation out with no confirm. `playing`
    // covers the four standalone games too, and unmounting the components is
    // what fixes it; the .fd-appbar CSS rule only ever hid the tab strip.
    expect(APP).toMatch(/\{isWebBrowser && !playing && \(\n\s*<>\n\s*<SiteHeader/);
    expect(APP).toMatch(/className="q-sticky-foot"/);
    expect(CSS).toMatch(/\.q-sticky-foot\{position:sticky;bottom:0/);
    expect(CSS).toMatch(/\.next-btn-primary\{position:static/);
    // The flag is a Lucide <Flag/> now (review C: no glyphs as icons); the
    // label text is the stable anchor.
    // ⚠️ The report link is INSIDE the footer since 2026-09-07, so "report
    // precedes the footer in source" is no longer the requirement — and it
    // never was the real one. It read correctly in source while overlapping
    // the primary on screen: measured at 375x812, the link sat at y741-785
    // under a footer occupying 722-812, and elementFromPoint at the link's
    // centre returned .next-btn-primary. What matters is that report comes
    // BEFORE the primary within the footer, which is what a player taps.
    const report = APP.indexOf('/> Report a problem</>}');
    const primary = APP.indexOf('className="next-btn-primary"');
    const foot = APP.indexOf('className="q-sticky-foot"');
    expect(report).toBeGreaterThan(-1);
    expect(report, 'the report link is inside the footer').toBeGreaterThan(foot);
    expect(report, 'and above the primary within it').toBeLessThan(primary);
  });
  it('no Classic difficulty picker: the tile starts the arc directly', () => {
    const HOME = read('../../src/screens/HomeScreen.jsx');
    expect(HOME).not.toMatch(/setShowDiffPicker/);
    expect(APP).not.toMatch(/showDiffPicker|startClassicWithDiff/);
  });
});
