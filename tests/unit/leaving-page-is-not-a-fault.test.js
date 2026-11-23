// 23 Nov 2026. A browser visitor on bare /play is sent to "/". The navigation
// cancelled the front door's chunk and stylesheet requests, Vite reported each
// as a preload error, and the stale-chunk self-heal answered with a RELOAD,
// which overrode the redirect: the page, the page again, then the front door.
// Seen on the live site in WebKit and Chromium; BALL-IQ-35 in Sentry. It also
// spent the one reload a session is allowed, so a real stale chunk later in
// the session had no cure.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../src/main.jsx', import.meta.url), 'utf8');

describe('a page that is leaving is not a fault', () => {
  it('the self-heal does nothing once the page is going away', () => {
    const heal = src.slice(src.indexOf('const heal = ('), src.indexOf("window.addEventListener('vite:preloadError'"));
    const guard = heal.indexOf('if (window.__biqReloading || window.__biqLeaving) return');
    expect(guard).toBeGreaterThan(-1);
    // before it looks at the error at all, and before it spends the session's one reload
    expect(guard).toBeLessThan(heal.indexOf('isChunkError(msg)) return'));
    expect(guard).toBeLessThan(heal.indexOf("sessionStorage.setItem(RELOAD_FLAG"));
  });

  it('bare /play says it is leaving before it navigates, and starts no fetch behind the navigation', () => {
    expect(src).toContain("if (_barePlay) { try { window.__biqLeaving = true; window.location.replace('/') }");
    expect(src).toContain('else if (!_barePlay) loadFrontDoor()');
    expect(src).not.toMatch(/\nelse loadFrontDoor\(\)/);
  });

  it('every navigation away sets the flag, and it clears itself when the page did not go', () => {
    const at = src.indexOf("window.addEventListener('beforeunload'");
    expect(at).toBeGreaterThan(-1);
    const body = src.slice(at, at + 220);
    expect(body).toContain('window.__biqLeaving = true');
    expect(body).toMatch(/setTimeout\(\(\) => \{ window\.__biqLeaving = false \}, 4000\)/);
    // registered before the self-heal's own listeners
    expect(at).toBeLessThan(src.indexOf("window.addEventListener('vite:preloadError'"));
  });

  it('requests a navigation cancelled are not sent to Sentry, and nothing else is dropped', () => {
    expect(src).toMatch(/if \(window\.__biqLeaving && LEAVING_NOISE\.test\(/);
    const re = new RegExp(src.match(/const LEAVING_NOISE = \/(.+)\/i/)[1], 'i');
    expect(re.test('Unable to preload CSS for /assets/top10-CkkJYovi.css')).toBe(true);
    expect(re.test('Importing a module script failed.')).toBe(true);
    expect(re.test("TypeError: undefined is not an object (evaluating 'a.name')")).toBe(false);
    expect(re.test('SupabaseError: 42501: permission denied for table profiles')).toBe(false);
  });
});
