// Mystery Player nations, regions and flags (Job A, A1-A3, 26 Nov 2026).
// Every senior national team a pool player was a member of (Wikidata P54),
// primary first; football's confederation for each; a flag file for each.
import { describe, it, expect } from 'vitest';
import nations from '../../src/data/mysteryNations.json';
import regions from '../../src/data/nationRegions.json';
import pool from '../../src/data/mysteryPool.json';

const regionOf = (n) => Object.entries(regions).find(([k, v]) => Array.isArray(v) && v.includes(n))?.[0] || null;
const of = (id) => (nations.p[id] || []).map((i) => nations.n[i]);
const poolIds = new Set(pool.map((p) => p.id));

describe('nations', () => {
  it('every entry is a pool player, with no repeated nation', () => {
    for (const [id, list] of Object.entries(nations.p)) {
      expect(poolIds.has(id), id).toBe(true);
      expect(new Set(list).size).toBe(list.length);
      for (const i of list) expect(typeof nations.n[i]).toBe('string');
    }
  });
  it('two national teams, primary first: Zaha (Ivory Coast, England), Puskás (Hungary, Spain), Declan Rice (England, Republic of Ireland)', () => {
    expect(of('Q713711')).toEqual(['Ivory Coast', 'England']);
    expect(of('Q482931')[0]).toBe('Hungary');
    expect(of('Q482931')).toContain('Spain');
    expect(of('Q30007142')).toEqual(['England', 'Republic of Ireland']);
  });
  it('the home nations are separate nations, never "United Kingdom"', () => {
    expect(nations.n).toEqual(expect.arrayContaining(['England', 'Scotland', 'Wales', 'Northern Ireland']));
    expect(nations.n).not.toContain('United Kingdom');
    for (const n of nations.n) expect(n).not.toMatch(/women|men's|national| B$|Catalonia|Galicia/i);
  });
  it('hand edits are removals only, and they hold (Cahill: not Samoa; Davids: not Suriname)', () => {
    expect(of('Q187238')).toEqual(['Australia']);
    expect(of('Q185115')).toEqual(['Netherlands']);
  });
});

describe('regions', () => {
  it('every nation in the data has exactly one confederation', () => {
    for (const n of nations.n) {
      const hits = Object.entries(regions).filter(([, v]) => Array.isArray(v) && v.includes(n));
      expect(hits.length, n).toBe(1);
    }
  });
  it('football\'s own grouping: Turkey, Russia, Israel, Kazakhstan UEFA; Australia AFC; Suriname CONCACAF', () => {
    for (const n of ['Turkey', 'Russia', 'Israel', 'Kazakhstan', 'Armenia', 'Azerbaijan', 'Georgia', 'Cyprus']) expect(regionOf(n)).toBe('UEFA');
    expect(regionOf('Australia')).toBe('AFC');
    expect(regionOf('Suriname')).toBe('CONCACAF');
    expect(regionOf('Guyana')).toBe('CONCACAF');
  });
});
