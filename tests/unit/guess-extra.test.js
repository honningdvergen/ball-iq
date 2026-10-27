// The guess box knows every player we hold (scripts/gen-guess-extra.mjs).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import pool from '../../src/data/mysteryPool.json';
import extra from '../../src/data/guessExtra.json';
import squads from '../../src/data/squads.json';
import draft from '../../src/data/draftSquads.json';
import { normaliseName } from '../../src/lib/mysteryPlayer.js';
import { rankPlayerSuggestions } from '../../src/lib/playerSearch.js';
import { withExtras } from '../../src/lib/usePlayerPool.js';
import { top10GuessPool, slotIndexFor } from '../../src/lib/top10.js';
import top10 from '../../src/data/top10Lists.json';

const all = withExtras(pool, extra);
const known = new Set(all.flatMap((p) => [p.name, ...(p.aka || [])]).map(normaliseName));

describe('guessExtra.json', () => {
  it('holds every Draft and squads player the pool lacks, by name', () => {
    const names = [
      ...draft.squads.flatMap((s) => s[10].map((r) => r[1])),
      ...Object.values(squads).flat().map((m) => m.name),
    ];
    const missing = [...new Set(names)].filter((n) => !known.has(normaliseName(n)));
    expect(missing).toEqual([]);
  });

  it('never repeats a pool player, by id or by name', () => {
    const ids = new Set(pool.map((p) => p.id));
    const names = new Set(pool.map((p) => normaliseName(p.name)));
    expect(extra.add.filter((r) => ids.has(r.id) || names.has(normaliseName(r.name)))).toEqual([]);
    expect(new Set(extra.add.map((r) => r.id)).size).toBe(extra.add.length);
    // a second spelling only ever names a record the pool already holds
    expect(Object.keys(extra.aka).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('carries only the fields the squads hold', () => {
    for (const r of extra.add) {
      expect(Object.keys(r).every((k) => ['id', 'name', 'club', 'born', 'aka'].includes(k))).toBe(true);
      expect(typeof r.name).toBe('string');
    }
  });

  it('finds the players Alex could not type', () => {
    const top = (q) => rankPlayerSuggestions(all, q).map((p) => p.name);
    expect(top('Mkhitaryan')).toContain('Henrikh Mkhitaryan');
    expect(top('mkhitarian')).toContain('Henrikh Mkhitaryan');
    expect(top('John Barnes')).toContain('John Barnes');
    expect(top('Nico Gonzalez')).toContain('Nicolás González');
  });

  it('leaves the imported pool untouched', () => {
    expect(pool.some((p) => p.aka)).toBe(false);
    expect(all.length).toBe(pool.length + extra.add.length);
  });

  // Review, 26 Oct: Gary Mabbutt is a Top 10 answer keyed "x:gary mabbutt" and
  // now also a guessExtra row (Q716756). The id row listed first and graded a
  // miss. Every answer on every player list must come up as its own key.
  it('offers every Top 10 answer under the key its list grades', () => {
    // Only the new rows can cause it, so the box is built from just those that
    // share a name with a list answer: fast, where the whole pool took 5s.
    const byName = new Map();
    for (const r of extra.add) for (const n of [r.name, ...(r.aka || [])]) byName.set(normaliseName(n), r);
    const bad = [];
    for (const [id, list] of Object.entries(top10.lists)) {
      if (list.kind !== 'player') continue;
      const twins = list.slots.map((s) => byName.get(normaliseName(s.name))).filter(Boolean);
      if (!twins.length) continue;
      const box = top10GuessPool(list, twins, top10.extras);
      for (const s of list.slots) {
        const named = box.filter((p) => normaliseName(p.name) === normaliseName(s.name));
        if (named.some((p) => slotIndexFor(list, p.id) < 0)) bad.push(`${id}: ${s.name}`);
      }
    }
    expect(bad).toEqual([]);
  });

  // Mystery ranks a guess by its career; these rows have none.
  it('is never handed to Mystery Player', () => {
    const src = readFileSync(new URL('../../src/screens/MysteryPlayer.jsx', import.meta.url), 'utf8');
    expect(src).not.toMatch(/extras\s*:\s*true/);
  });
});
