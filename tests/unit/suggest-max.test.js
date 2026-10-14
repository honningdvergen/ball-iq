import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { rankPlayerSuggestions, SUGGEST_MAX } from '../../src/lib/playerSearch.js';

// Alex, build 146, 14 Oct 2026: typed "James" in Top 10 to find England's
// keeper and could not reach him; the box offered six names and David James
// is the seventh. Every guess box now asks for SUGGEST_MAX.
describe('a guess box offers every match a player could want', () => {
  const pool = JSON.parse(readFileSync(new URL('../../src/data/mysteryPool.json', import.meta.url), 'utf8'));
  const list = Array.isArray(pool) ? pool : (pool.players || pool.pool || Object.values(pool)[0]);

  it('"James" reaches David James', () => {
    expect(rankPlayerSuggestions(list, 'James', { limit: SUGGEST_MAX }).map((p) => p.name)).toContain('David James');
  });

  it('the three guess boxes all ask for SUGGEST_MAX, not a short list', () => {
    for (const f of ['Top10.jsx', 'TransferTrail.jsx', 'MysteryPlayer.jsx']) {
      const src = readFileSync(new URL(`../../src/screens/${f}`, import.meta.url), 'utf8');
      const calls = src.match(/rank(Player|List)Suggestions\([^)]*\)/g) || [];
      expect(calls.length, f).toBeGreaterThan(0);
      for (const c of calls) expect(c, f).toContain('SUGGEST_MAX');
    }
  });
});
