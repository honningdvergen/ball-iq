import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
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
    expect(APP).toMatch(/\{isWebBrowser && !inGame && \(\n\s*<>\n\s*<SiteHeader/);
    expect(APP).toMatch(/className="q-sticky-foot"/);
    expect(CSS).toMatch(/\.q-sticky-foot\{position:sticky;bottom:0/);
    expect(CSS).toMatch(/\.next-btn-primary\{position:static/);
    // The flag is a Lucide <Flag/> now (review C: no glyphs as icons); the
    // label text is the stable anchor.
    const report = APP.indexOf('/> Report a problem</>}');
    const next = APP.indexOf('className="q-sticky-foot"');
    expect(report).toBeGreaterThan(-1);
    expect(report).toBeLessThan(next);
  });
  it('no Classic difficulty picker: the tile starts the arc directly', () => {
    const HOME = read('../../src/screens/HomeScreen.jsx');
    expect(HOME).not.toMatch(/setShowDiffPicker/);
    expect(APP).not.toMatch(/showDiffPicker|startClassicWithDiff/);
  });
});
