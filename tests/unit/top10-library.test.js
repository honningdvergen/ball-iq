// The Top 10 browser's grouping rules (src/lib/top10Library.js): club lists are
// always open and grouped by club; every other list only after its day as the
// daily has passed, newest first, so the browser never spoils a coming daily.
import { describe, it, expect, beforeEach } from 'vitest';
import { groupTop10Lists, listStatus, myTop10Club, setMyTop10Club } from '../../src/lib/top10Library.js';
import { saveTop10Day } from '../../src/lib/top10.js';
import data from '../../src/data/top10Lists.json';

// The runner is node: an in-memory localStorage, as tests/unit/acct-funnel.test.js does.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
};

const fake = {
  log: ['a', 'b', 'utd-1', 'c', 'd'],
  lists: {
    a: { id: 'a', title: 'A' }, b: { id: 'b', title: 'B' }, c: { id: 'c', title: 'C' }, d: { id: 'd', title: 'D' },
    'utd-1': { id: 'utd-1', title: 'United 1', club: 'manchester-united' },
    'utd-2': { id: 'utd-2', title: 'United 2', club: 'manchester-united' },
    loose: { id: 'loose', title: 'Never scheduled' },
  },
};

describe('groupTop10Lists', () => {
  it('groups club lists by club once open', () => {
    const g = groupTop10Lists(fake, 9);
    expect(g.clubs.get('manchester-united').map((l) => l.id)).toEqual(['utd-1', 'utd-2']);
  });
  it('opens other lists only once their daily has passed, newest first', () => {
    const g = groupTop10Lists(fake, 4); // today is No. 4 ('c'): a, b are past; c is today; d is to come
    expect(g.past.map((l) => [l.id, l.day])).toEqual([['b', 2], ['a', 1]]);
  });
  it('locks a club list while it is today\'s or a coming daily, and opens it after', () => {
    // 'utd-1' is the daily on day 3: listed last and locked until day 4.
    const at = (n) => groupTop10Lists(fake, n).clubs.get('manchester-united').map((l) => `${l.id}${l.locked ? ':locked' : ''}`);
    expect(at(2)).toEqual(['utd-2', 'utd-1:locked']);
    expect(at(3)).toEqual(['utd-2', 'utd-1:locked']);
    expect(at(4)).toEqual(['utd-1', 'utd-2']);
  });
  it('ignores a club that is not a slug, and never touches the prototype', () => {
    const bad = { log: [], lists: { x: { id: 'x', title: 'X', club: '__proto__' }, y: { id: 'y', title: 'Y', club: 'Bad Club' } } };
    expect([...groupTop10Lists(bad, 1).clubs.keys()]).toEqual([]);
  });
  it('never shows a list that was never a daily and has no club', () => {
    expect(groupTop10Lists(fake, 99).past.map((l) => l.id)).not.toContain('loose');
  });
  it('every club list in the real data names its club by a slug', () => {
    const clubs = Object.values(data.lists).filter((l) => l.club);
    expect(clubs.length).toBeGreaterThan(5);
    for (const l of clubs) expect(l.club).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe('listStatus and the chosen club', () => {
  beforeEach(() => localStorage.clear());
  it('reads a list played by name, never a day', () => {
    expect(listStatus('utd-1')).toEqual({ state: 'new' });
    saveTop10Day('list_utd-1', { id: 'utd-1', status: 'playing', score: 3, picks: ['x', 'y', 'z'] });
    expect(listStatus('utd-1')).toEqual({ state: 'open', score: 3 });
    saveTop10Day('list_utd-1', { id: 'utd-1', status: 'done', score: 7, picks: ['x'] });
    expect(listStatus('utd-1')).toEqual({ state: 'done', score: 7 });
  });
  it('remembers the chosen club and forgets it on null', () => {
    expect(myTop10Club()).toBe(null);
    setMyTop10Club('liverpool');
    expect(myTop10Club()).toBe('liverpool');
    setMyTop10Club(null);
    expect(myTop10Club()).toBe(null);
  });
});
