// Mystery Player careers keep EVERY spell at a club, not one per club.
//
// 16 Oct 2026: fetch-mystery-careers.mjs kept the first P54 statement per club
// and dropped the rest, so Buffon lost Juventus 2001-18, Henry Arsenal
// 1999-2007 and Cristiano Ronaldo Manchester United 2021-22. One statement
// holding two stints (two starts, two ends) came out as a spell that ended
// before it started. These tests pin the shipped data and the rules that
// repaired it (scripts/lib/mystery-spells.mjs).
import { describe, it, expect } from 'vitest';
import { careerOf, withCareerFixes } from '../../src/lib/mysteryCareer.js';
import { statementCollector, spellsFromStatements, mergeSpells } from '../../scripts/lib/mystery-spells.mjs';
import rawCareers from '../../src/data/mysteryCareers.json';
import fixes from '../../src/data/mysteryCareerFixes.json';
import pool from '../../src/data/mysteryPool.json';

const careers = withCareerFixes(rawCareers, fixes);
const byId = new Map(pool.map((p) => [p.id, p]));

describe('shipped careers', () => {
  it('no spell ends before it starts', () => {
    const bad = [];
    for (const [pid, spells] of Object.entries(careers.p)) {
      for (const [i, from, to] of spells) {
        if (from != null && to != null && to < from) bad.push(`${pid} ${careers.c[i]} ${from}-${to}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('Buffon keeps both Juventus spells, 2001-2018 and 2019-2021', () => {
    const juve = careerOf(byId.get('Q68060'), careers).filter((s) => s.club === 'Juventus');
    expect(juve).toContainEqual({ club: 'Juventus', from: 2001, to: 2018 });
    expect(juve).toContainEqual({ club: 'Juventus', from: 2019, to: 2021 });
  });

  it('second stints are kept for other repeat signings', () => {
    const has = (id, club, from, to) => expect(careerOf(byId.get(id), careers)).toContainEqual({ club, from, to });
    has('Q45901', 'Arsenal', 1999, 2007);              // Henry
    has('Q11571', 'Manchester United', 2021, 2022);    // Cristiano Ronaldo
    has('Q129027', 'Manchester United', 2016, 2022);   // Pogba
    has('Q41244', 'AC Milan', 1999, 2006);             // Shevchenko
  });
});

const stmt = (id, starts, ends, name = id) => ({ id, name, starts: new Set(starts), ends: new Set(ends) });

describe('spellsFromStatements', () => {
  it('keeps two statements at the same club as two spells', () => {
    const out = spellsFromStatements([stmt('juve', [2019], [2021]), stmt('juve', [2001], [2018])]);
    expect(out.map((s) => [s.start, s.end])).toEqual([[2001, 2018], [2019, 2021]]);
  });

  it('pairs two stints written on ONE statement instead of crossing them', () => {
    const out = spellsFromStatements([stmt('lev', [2008, 2001], [2011, 2005])]);
    expect(out.map((s) => [s.start, s.end])).toEqual([[2001, 2005], [2008, 2011]]);
  });

  it('collects SPARQL rows per statement, so the cross product cannot leak', () => {
    const c = statementCollector();
    for (const start of ['2001-07-01', '2019-07-01']) for (const end of ['2018-06-30', '2021-06-30'])
      c.add('buffon', { st: 's1', club: 'juve', clubLabel: 'Juventus FC', start, end });
    expect(spellsFromStatements(c.statements('buffon')).map((s) => [s.start, s.end])).toEqual([[2001, 2018], [2019, 2021]]);
  });

  it('drops exact duplicates and an undated twin of a dated spell', () => {
    const out = spellsFromStatements([stmt('a', [2001], [2004]), stmt('a', [2001], [2004]), stmt('a', [], [])]);
    expect(out).toHaveLength(1);
  });

  it('swaps a backwards spell and marks it reversed', () => {
    const [s] = spellsFromStatements([stmt('a', [2008], [2001])]);
    expect([s.start, s.end, s.reversed]).toEqual([2001, 2008, true]);
  });
});

describe('mergeSpells', () => {
  const sameClub = (a, b) => a === b;
  const base = () => ({
    c: ['Juventus FC', 'Parma', 'Toulouse FC', 'San Lorenzo'],
    p: {
      buffon: [[1, 1995, 2001], [0, 2019, 2021]],
      acosta: [[3, 1988, 1993], [2, 2005, 1991]],
    },
  });

  it('adds the lost stint under the label already shipped, and skips one already there', () => {
    const c = base();
    const stats = mergeSpells(c, { buffon: [
      { id: 'q1', name: 'Juventus FC', start: 2001, end: 2018 },
      { id: 'q1', name: 'Juventus FC', start: 2019, end: 2021 },
    ] }, { sameClub });
    expect(c.p.buffon).toEqual([[1, 1995, 2001], [0, 2001, 2018], [0, 2019, 2021]]);
    expect(stats.added).toBe(1);
  });

  it('leaves a club the shipped career does not have alone', () => {
    const c = base();
    const stats = mergeSpells(c, { buffon: [{ id: 'q9', name: 'Paris Saint-Germain FC', start: 2018, end: 2019 }] }, { sameClub });
    expect(c.p.buffon).toHaveLength(2);
    expect(stats.newClubsSkipped).toBe(1);
  });

  it('skips a fetched spell that overlaps a shipped one at the same club', () => {
    const c = base();
    mergeSpells(c, { buffon: [{ id: 'q1', name: 'Juventus FC', start: 2018, end: 2021 }] }, { sameClub });
    expect(c.p.buffon).toEqual([[1, 1995, 2001], [0, 2019, 2021]]);
  });

  it('removes a backwards shipped spell and drops a reversed one that clashes with another club', () => {
    const c = base();
    const stats = mergeSpells(c, { acosta: [{ id: 'q2', name: 'Toulouse FC', start: 1991, end: 2005, reversed: true }] }, { sameClub });
    expect(c.p.acosta).toEqual([[3, 1988, 1993]]);
    expect(stats).toMatchObject({ repaired: 1, reversedDropped: 1, added: 0 });
  });
});
