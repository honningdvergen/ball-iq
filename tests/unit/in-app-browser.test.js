import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inAppFromUA, socialFromUtm, inAppSource } from '../../src/lib/inAppBrowser.js';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');

/**
 * THE IN-APP-BROWSER STRIP (website audit 2026-10-15, item 7). Social visitors
 * play Footle inside Instagram, Threads, Facebook, TikTok and X, where the
 * Smart App Banner never shows. These pins keep the detection honest, keep the
 * /get source inside api/get.js's allow-list, and keep the strip's height paid
 * for in the Footle budget so ENTER never moves.
 */
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const UAS = {
  instagram: `${IOS} Instagram 350.0.0.30.80 (iPhone14,5; iOS 18_0; en_GB; en; scale=3.00; 1170x2532; 640000000)`,
  threads: `${IOS} Barcelona 360.0.0.25.80 (iPhone14,5; iOS 18_0; en_GB; en; scale=3.00; 1170x2532) Instagram 350.0.0.30.80`,
  facebook: `${IOS} [FBAN/FBIOS;FBAV/480.0.0.40.110;FBBV/600000000;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/18.0;FBSS/3;FBID/phone;FBLC/en_GB;FBOP/5]`,
  tiktok: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36 trill_360000 BytedanceWebview/d8a21c6',
  x: `${IOS} Twitter for iPhone/10.60`,
};

describe('in-app browser detection', () => {
  it('names each social app from its own browser', () => {
    for (const [name, ua] of Object.entries(UAS)) expect(inAppFromUA(ua), name).toBe(name);
  });

  it('reads Threads as Threads even when Instagram is in the user agent too', () => {
    expect(inAppFromUA(UAS.threads)).toBe('threads');
  });

  it('leaves plain Safari and Chrome alone', () => {
    expect(inAppFromUA(`${IOS} Version/18.0 Safari/604.1`)).toBe(null);
    expect(inAppFromUA('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36')).toBe(null);
  });

  it('counts a social utm_source and nothing else', () => {
    expect(socialFromUtm('?utm_source=instagram')).toBe('instagram');
    expect(socialFromUtm('?utm_source=instagram_story')).toBe('instagram-story');
    expect(socialFromUtm('?utm_source=threads&utm_medium=bio')).toBe('threads');
    expect(socialFromUtm('?utm_source=newsletter')).toBe(null);
    expect(socialFromUtm('?utm_source=google')).toBe(null);
    expect(socialFromUtm('')).toBe(null);
  });

  it('prefers the browser over the tag', () => {
    expect(inAppSource({ ua: UAS.tiktok, search: '?utm_source=instagram' })).toBe('tiktok');
    expect(inAppSource({ ua: `${IOS} Safari/604.1`, search: '?utm_source=x' })).toBe('x');
  });

  it('only ever produces a source api/get.js accepts', () => {
    const all = [...Object.values(UAS).map(inAppFromUA), ...['instagram', 'instagram_story', 'ig', 'fb', 'twitter', 'youtube', 'bluesky', 'telegram'].map((s) => socialFromUtm(`?utm_source=${s}`))];
    for (const s of all) expect(`${s}-inapp`).toMatch(/^[a-z0-9-]{1,40}$/);
  });
});

describe('in-app strip wiring', () => {
  const css = read('src/games/footle.css');
  const strip = read('src/components/InAppStrip.jsx');
  const game = read('src/games/FootballWordle.jsx');

  it('is paid for in the tile cap, so ENTER does not move', () => {
    expect(css).toMatch(/--wd-tile-cap:clamp\([^;]*var\(--wd-inapp-h, 0px\)/);
    expect(css).toMatch(/\.wd-screen\.has-inapp\{--wd-inapp-h:44px;\}/);
    expect(css).toMatch(/\.wd-inapp\{[^}]*height:30px/);
    expect(game).toMatch(/has-inapp/);
  });

  it('never shows in the native app, and remembers a dismissal safely', () => {
    expect(strip).toMatch(/isNativeShell\(\)/);
    expect(strip).toMatch(/try \{ localStorage\.setItem/);
    expect(read('src/lib/inAppBrowser.js')).toMatch(/capacitor:[\s\S]*native-app[\s\S]*isNativePlatform/);
  });

  it('sends the tap to /get with an in-app source', () => {
    expect(strip).toMatch(/href=\{`\/get\?src=\$\{src\}-inapp`\}/);
  });
});

describe('store taps in Clarity', () => {
  it('both listeners send store_tap and a store tag', () => {
    for (const f of ['index.html', 'scripts/seo/shell.mjs']) {
      const s = read(f);
      expect(s, f).toMatch(/clarity\('event', ?'store_tap'\)/);
      expect(s, f).toMatch(/clarity\('set', ?'store', ?st\)/);
      expect(s, f).toMatch(/__biqStoreTap/);
    }
  });

  it('index.html runs it only off native', () => {
    const s = read('index.html');
    const guard = s.indexOf('if (!isNative) {');
    const tap = s.indexOf("window.clarity('event', 'store_tap')");
    expect(guard).toBeGreaterThan(-1);
    expect(tap).toBeGreaterThan(guard);
  });
});
