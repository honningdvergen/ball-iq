import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HTML = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

/**
 * index.html used to ship the ORIGINAL marketing landing — a sticky "Get the
 * app" nav, emoji feature cards, "Take Ball IQ with you", two store links and
 * a footer — plus three reserved ad-slot containers, as 21 KB of a 67 KB file.
 * By 2026-09-05 it was hidden on every route (/ via the front door, /play via
 * body.biq-app, PWA and native via killswitches) and every visitor still paid
 * to parse it. Deleted that day. This keeps it from growing back.
 */
describe('index.html carries no ghost landing', () => {
  it('has none of the landing chrome or ad-slot containers', () => {
    for (const needle of ['landing-top', 'landing-bottom', 'landing-nav', 'landing-features', 'landing-signup', 'landing-footer', 'ad-slot-', 'full-bleed']) {
      expect(HTML, needle).not.toContain(needle);
    }
  });
  it('still has what the app boot needs', () => {
    expect(HTML).toContain('<div id="root">');
    expect(HTML).toContain('id="preboot-start"');
    expect(HTML).toContain('html.native-app .biq-nav { display: none !important; }');
  });
});
