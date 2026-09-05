import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CLUB_PACK_COLOURS, CLUB_PACK_ABBR } from '../../src/data/clubPackColours.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

/**
 * The daily screens mount twice: inside the app (App.jsx) and as Vite islands
 * on the static /football-wordle/, /transfer-trail/ and /mystery-player/
 * pages. The island build is only small because the screens take what the app
 * used to hand them (haptics, sound, confetti, club colours) through a
 * `services` prop and a generated data module instead of importing App.jsx.
 * One `import ... from '../App.jsx'` slipped back in would bundle the whole
 * monolith into a landing page — and the build would still be green.
 */
describe('daily screens stay island-safe', () => {
  for (const f of ['src/screens/TransferTrail.jsx', 'src/screens/MysteryPlayer.jsx', 'src/games/FootballWordle.jsx']) {
    it(`${f} does not import App.jsx`, () => {
      expect(read(f)).not.toMatch(/from\s+['"]\.\.\/App\.jsx['"]/);
    });
  }

  it('the guess pool is loaded on demand, not with the screen', () => {
    for (const f of ['src/screens/TransferTrail.jsx', 'src/screens/MysteryPlayer.jsx']) {
      const src = read(f);
      expect(src).not.toMatch(/^import\s+\w+\s+from\s+['"]\.\.\/data\/mysteryPool\.json['"]/m);
      expect(src).not.toMatch(/^import\s+\w+\s+from\s+['"]\.\.\/data\/mysteryCareers\.json['"]/m);
      expect(src).toMatch(/usePlayerPool/);
    }
  });

  it('every island is a vite input and every daily page mounts one', () => {
    const vite = read('vite.config.js');
    const gen = read('scripts/gen-seo-pages.mjs');
    for (const k of ['footle', 'trail', 'mystery']) {
      expect(vite).toContain(`${k}: new URL('./src/islands/${k}.jsx'`);
      expect(read(`src/islands/${k}.jsx`)).toMatch(/createRoot|mountDaily/);
    }
    expect(gen).toContain("islandAssets('src/islands/footle.jsx')");
    expect(gen).toContain('islandAssets(`src/islands/${cfg.gameParam}.jsx`)');
    expect(gen).toContain('id="${cfg.gameParam}-today"');
  });

  it('the app funnel draws store badges, not platform words or an emoji', () => {
    const fd = read('src/marketing/FrontDoor.jsx');
    expect(fd).toContain('StoreBadge');
    expect(fd).not.toMatch(/>\s*iOS\s*<\/a>|>\s*Android\s*<\/a>/);
    for (const f of ['src/islands/dailyIsland.jsx', 'src/islands/footle.jsx', 'src/App.jsx']) {
      expect(read(f)).not.toContain('📲 Get the free app');
    }
    // One glyph source for the generated pages and the React badge.
    expect(read('scripts/gen-seo-pages.mjs')).toContain("from '../src/lib/storeGlyphs.js'");
    expect(read('scripts/gen-seo-pages.mjs')).not.toMatch(/d="M12\.152 6\.896/);
    // The islands hand the screens the embedded masthead.
    expect(read('src/islands/trail.jsx')).toMatch(/<TransferTrail[^>]*\sembedded/);
    expect(read('src/islands/mystery.jsx')).toMatch(/<MysteryPlayer[^>]*\sembedded/);
  });

  // The app passes its live tables; the island imports the generated module.
  // The generator (scripts/gen-club-index.mjs) runs before vitest in the build,
  // so in the build this always holds; in CI on a branch it catches a CLUB_PACKS
  // edit committed without regenerating.
  it('src/data/clubPackColours.js matches CLUB_PACKS / CLUB_ABBR in App.jsx', () => {
    const app = read('src/App.jsx');
    const packMap = {};
    for (const m of app.matchAll(/name:\s*"([^"]+)"[^\n]*?color:\s*"(#[0-9A-Fa-f]{6})"/g)) packMap[m[1]] = m[2];
    expect(Object.keys(packMap).length).toBeGreaterThan(50);
    expect(CLUB_PACK_COLOURS).toEqual(packMap);
    const abbr = {};
    for (const m of app.match(/export const CLUB_ABBR = \{([\s\S]*?)\n\};/)[1].matchAll(/(\w+):\s*"([^"]+)"/g)) abbr[m[1]] = m[2];
    expect(Object.keys(abbr).length).toBeGreaterThan(40);
    expect(CLUB_PACK_ABBR).toEqual(abbr);
    // The lookups the Trail ladder depends on.
    expect(CLUB_PACK_COLOURS['Liverpool']).toBe('#C8102E');
    expect(CLUB_PACK_ABBR.ManUtd).toBe('MUN');
  });
});
