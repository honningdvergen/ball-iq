import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CLUB_PACK_ABBR, CLUB_PACK_COLOURS } from '../../src/data/clubPackColours.js';

const R = (p) => fileURLToPath(new URL('../../' + p, import.meta.url));
const APP = readFileSync(R('src/App.jsx'), 'utf8');
const lit = (name) => {
  const m = APP.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`)); const out = {};
  for (const e of m[1].matchAll(/["']?([\w-]+)["']?:\s*"([^"]+)"/g)) out[e[1]] = e[2];
  return out;
};

/**
 * The club badge code and colour on a generated page must be the app's.
 * Two hand-typed maps in gen-seo-pages.mjs drifted from CLUB_ABBR / CLUB_PACKS
 * (FCB vs BAR, ACM vs MIL, five colours). The generator now derives them; this
 * checks the BUILT pages, which is the only place the derivation can be judged.
 */
describe('club badge parity: page == app', () => {
  const SLUG_TO_PACK = lit('CLUB_SLUG_TO_PACK'), PACK_TO_NAME = lit('CLUB_PACK_TO_QB');
  it('the join the generator relies on covers the packs', () => {
    const codes = Object.values(SLUG_TO_PACK).filter((p) => CLUB_PACK_ABBR[p]).length;
    const colours = Object.values(SLUG_TO_PACK).filter((p) => CLUB_PACK_COLOURS[PACK_TO_NAME[p]]).length;
    expect(codes).toBeGreaterThanOrEqual(60);
    expect(colours).toBeGreaterThanOrEqual(60);
  });
  it('every built club page shows the app\'s code and colour (skips when dist/ is absent)', () => {
    // ⚠️ vitest runs BEFORE vite build + gen-seo in `npm run build`, so on the
    // first gate after a generator change dist/ is the PREVIOUS build. Judging it
    // then reports the exact drift the change removes. Only judge a dist that is
    // newer than the generator; the next gate (and Vercel) always is.
    const gen = statSync(R('scripts/gen-seo-pages.mjs')).mtimeMs;
    const idx = R('dist/index.html');
    if (!existsSync(idx) || statSync(idx).mtimeMs < gen) return;
    const diffs = [];
    for (const [slug, pack] of Object.entries(SLUG_TO_PACK)) {
      const f = R(`dist/quiz/${slug}/index.html`);
      if (!existsSync(f)) continue;
      const html = readFileSync(f, 'utf8');
      const badge = html.match(/data-badge="([^"]*)"/)?.[1];
      const color = html.match(/data-color="([^"]*)"/)?.[1];
      if (CLUB_PACK_ABBR[pack] && badge && badge !== CLUB_PACK_ABBR[pack]) diffs.push(`${slug}: page ${badge} vs app ${CLUB_PACK_ABBR[pack]}`);
      const hex = CLUB_PACK_COLOURS[PACK_TO_NAME[pack]];
      if (hex && color && color.toLowerCase() !== hex.toLowerCase()) diffs.push(`${slug}: page ${color} vs app ${hex}`);
    }
    expect(diffs, 'built pages disagree with the app').toEqual([]);
  });
});
