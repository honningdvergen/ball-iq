// Regression test for the Mystery Player ranking bug a PLAYER reported.
//
// Alex's friend, 2026-08-15, on the Jan Oblak puzzle: Fernando Torres came back
// at rank 137 and Saúl Ñíguez at 386, and that made no sense to him. He was
// right, and the reason is worth keeping pinned:
//
//   Saúl   Atlético 2012-2025  ->  eleven years as Oblak's teammate
//   Torres Atlético 1995-2001  ->  left thirteen years before Oblak arrived
//
// Two separate faults stacked:
//   1. similarity() could only count DISTINCT CLUB NAMES, so both scored one
//      shared club and identical points. Time together was invisible.
//   2. latestClub() picks the LONGEST spell, not the most recent — right for an
//      active player, wrong for a retired one. Torres was labelled an Atlético
//      player off a spell that ended in 2001, and collected the full
//      current-club bonus for it.
//
// These assertions use hand-built fixtures rather than the shipped data, so the
// test states the RULE and cannot drift when the pool is rebuilt.
import { describe, it, expect } from 'vitest';
import { similarity, rankPool } from '../../src/lib/mysteryPlayer.js';

// clubs: 0 = Atlético Madrid, 1 = Flamengo, 2 = Liverpool
const careers = {
  c: ['Atlético Madrid', 'Flamengo', 'Liverpool F.C.'],
  p: {
    oblak: [[0, 2014, null]],                       // still there
    saul: [[0, 2012, 2025], [1, 2025, null]],       // 11 yrs with Oblak, now Flamengo
    torres: [[0, 1995, 2001], [2, 2007, 2011]],     // retired, never overlapped
    koke: [[0, 2011, null]],                        // still Oblak's teammate
  },
};
const P = {
  oblak: { id: 'oblak', club: 'Atlético Madrid', slot: 'GK', nat: 'Slovenia', born: 1993, dob: '1993-01-07' },
  saul: { id: 'saul', club: 'Flamengo', slot: 'MF', nat: 'Spain', born: 1994, dob: '1994-11-21' },
  torres: { id: 'torres', club: 'Atlético Madrid', slot: 'FW', nat: 'Spain', born: 1984, dob: '1984-03-20' },
  koke: { id: 'koke', club: 'Atlético Madrid', slot: 'MF', nat: 'Spain', born: 1992, dob: '1992-01-08' },
};

describe('Mystery Player — teammate overlap', () => {
  it('ranks a long-time teammate above a retired player who never overlapped', () => {
    const s = similarity(P.saul, P.oblak, careers);
    const t = similarity(P.torres, P.oblak, careers);
    expect(s).toBeGreaterThan(t);
  });

  it('still gives credit for having played for the club at all', () => {
    // Alex, 2026-08-15: "torres did play for atletico once, that should still
    // count for some likeness but less so than players who have been teammates
    // for a long time." A shared club with zero overlap must beat no link.
    const stranger = { id: 'x', club: 'Nowhere', slot: 'FW', nat: 'Brazil', born: 1984, dob: '1984-03-20' };
    const withNoLink = similarity(stranger, P.oblak, { c: careers.c, p: { ...careers.p, x: [[2, 1999, 2003]] } });
    const torres = similarity(P.torres, P.oblak, careers);
    expect(torres).toBeGreaterThan(withNoLink);
  });

  it('does not pay the current-club bonus to a retired player', () => {
    // Torres and Koke are both labelled "Atlético Madrid". Only Koke is still
    // there, so only Koke may collect it — and Koke also overlaps Oblak.
    const ranks = rankPool(Object.values(P), P.oblak, careers);
    expect(ranks.get('koke')).toBeLessThan(ranks.get('torres'));
    expect(ranks.get('saul')).toBeLessThan(ranks.get('torres'));
  });

  it('scores more overlap higher than less', () => {
    const long = { ...P.saul, id: 'long' };
    const short = { ...P.saul, id: 'short' };
    const c = {
      c: careers.c,
      p: { ...careers.p, long: [[0, 2014, 2025]], short: [[0, 2014, 2015]] },
    };
    expect(similarity(long, P.oblak, c)).toBeGreaterThan(similarity(short, P.oblak, c));
  });

  it('treats unknown years as no overlap rather than crashing', () => {
    const c = { c: careers.c, p: { ...careers.p, blank: [[0, null, null]] } };
    const blank = { id: 'blank', club: 'Atlético Madrid', slot: 'GK', nat: 'Slovenia', born: 1993, dob: '1993-01-07' };
    expect(Number.isFinite(similarity(blank, P.oblak, c))).toBe(true);
  });
});
