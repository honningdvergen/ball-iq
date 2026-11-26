// Mystery Player flags (Job A, A3, 26 Nov 2026): a real flag picture for every
// nation in src/data/mysteryNations.json, as static files in public/flags/
// (Commons PNG renderings, licence beside them), never bundled into JS.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import nations from '../../src/data/mysteryNations.json';
import flags from '../../src/data/nationFlags.json';

describe('flags', () => {
  // The CIS side of 1992 played under no state's flag; with Oman, the two nations
  // without one (scripts/fetch-nation-flags.mjs, NO_FLAG). Oman's only flag file on
  // Commons is under "OGL-om 1.0", a licence the fetch does not recognise as free;
  // one player in the pool (none among the answers) reads Oman.
  const NO_FLAG = new Set(['CIS', 'Oman']);
  it('every nation has a flag file that exists in public/', () => {
    for (const n of nations.n) {
      if (NO_FLAG.has(n)) { expect(flags[n]).toBeUndefined(); continue; }
      expect(flags[n], n).toMatch(/^flags\/[a-z0-9-]+\.png$/);
      expect(existsSync(`public/${flags[n]}`), flags[n]).toBe(true);
    }
  });
  it('the files are real PNGs and small (fetched one by one, never bundled)', () => {
    for (const f of Object.values(flags)) {
      const b = readFileSync(`public/${f}`);
      expect(b[0] === 0x89 && b[1] === 0x50, f).toBe(true);
      expect(b.length).toBeLessThan(20000);
    }
  });
  it('the licence of every flag is recorded beside the files', () => {
    const lic = readFileSync('public/flags/LICENCES.md', 'utf8');
    for (const f of Object.values(flags)) expect(lic).toContain(f);
  });
  it('no JS file imports a flag picture', () => {
    // nationFlags.json holds paths, not pictures; the pictures sit in public/.
    for (const v of Object.values(flags)) expect(v.startsWith('flags/')).toBe(true);
  });
});
