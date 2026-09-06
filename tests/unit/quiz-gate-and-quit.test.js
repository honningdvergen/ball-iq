import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const APP = read('../../src/App.jsx');
const CSS = read('../../src/app.css');

describe('timed quiz start + quit (2026-09-06)', () => {
  it('no full-screen "Ready?" interstitial: a 3-2-1 over the hidden card, header stays live', () => {
    expect(APP).not.toMatch(/aria-label="Start the quiz"/);
    expect(APP).not.toMatch(/>Ready\?</);
    expect(APP).toMatch(/className="q-countdown"/);
    expect(APP).toMatch(/q-card-gated/);
    expect(CSS).toMatch(/\.q-countdown\{[^}]*pointer-events:none/);
    expect(CSS).toMatch(/\.q-card-gated\{visibility:hidden;\}/);
  });
  it('the countdown effects sit BELOW the `timed` declaration (TDZ crash otherwise)', () => {
    expect(APP.indexOf('const timed = (timerEnabled !== false)')).toBeLessThan(APP.indexOf('const [countdown, setCountdown]'));
  });
  it('the quit confirm is a sheet with the real stake, one green primary and a quiet exit', () => {
    expect(APP).toMatch(/Leave this quiz\?/);
    expect(APP).toMatch(/right from <strong>\{idx\}<\/strong> answered/);
    expect(APP).toMatch(/className="modal-grab"/);
    expect(CSS).toMatch(/\.modal-overlay\{[^}]*align-items:flex-end/);
    expect(CSS.match(/\n\.modal-cancel\{[^}]*\}/)?.[0] || '').toContain('background:var(--accent)');
    expect(CSS.match(/\n\.modal-confirm\{[^}]*\}/)?.[0] || '').toContain('background:var(--s2)');
  });
});
