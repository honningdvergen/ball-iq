// The sums behind the signed-in Profile on a phone (src/lib/profileNext.js, 25 Nov 2026):
// the mates table, the nearest badge, "N of M" badges, the next rank, the weakest area.
import { describe, it, expect } from 'vitest';
import { mateRating, rankMates, badgeCount, nearestBadge, badgeNeed, nextRank, ladder, verdict, faceWord } from '../../src/lib/profileNext.js';
import { computeBadges, LEVELS, MIN_RATED_ANSWERS } from '../../src/lib/scoring.js';
import { computeCard } from '../../src/lib/ballIqCard.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The wall's own ids, in its own order, read off the source: importing the screen would need a
// Supabase key just to count badges.
const SCREEN = readFileSync(fileURLToPath(new URL('../../src/screens/ProfileScreen.jsx', import.meta.url)), 'utf8');
const IDS = [...SCREEN.slice(SCREEN.indexOf('export const BADGE_DEFS = ['), SCREEN.indexOf('// ── Profile picture')).matchAll(/^\s*\["(\w+)",\s+\w+,/gm)].map((m) => m[1]);
const row = (username, rating, score = 0) => ({ id: username, username, rating, score });

describe('the mates table ranks on rating', () => {
  const me = row('Alex', 75, 5118);
  it('best rating first, the player\'s own row among them, places 1 to N', () => {
    const t = rankMates(me, [row('VAR Victim', 68), row('Stat Padder', 81), row('Hoofball Enjoyer', 61)]);
    expect(t.map((r) => [r.place, r.username, r.rating, r.isMe])).toEqual([
      [1, 'Stat Padder', 81, false], [2, 'Alex', 75, true], [3, 'VAR Victim', 68, false], [4, 'Hoofball Enjoyer', 61, false],
    ]);
  });
  it('alone, the player is first', () => {
    expect(rankMates(me).map((r) => [r.place, r.username, r.isMe])).toEqual([[1, 'Alex', true]]);
  });
  it('a mate with no rating yet comes after every rated one, whatever their score', () => {
    const t = rankMates(me, [row('New Signing', null, 99999), row('Jo', 40, 1)]);
    expect(t.map((r) => r.username)).toEqual(['Alex', 'Jo', 'New Signing']);
    expect(t[2].rating).toBe(null);
  });
  it('an unrated player stands after their rated mates, and before an unrated mate with less score', () => {
    const t = rankMates(row('Alex', null, 300), [row('Jo', 52, 10), row('Kim', null, 100), row('Sam', undefined, 900)]);
    expect(t.map((r) => [r.place, r.username, r.rating])).toEqual([[1, 'Jo', 52], [2, 'Sam', null], [3, 'Alex', null], [4, 'Kim', null]]);
  });
  it('equal ratings fall back to total score, then to the name', () => {
    const t = rankMates(row('Alex', 70, 500), [row('Jo', 70, 800), row('Bea', 70, 500), row('Zed', 70, 100)]);
    expect(t.map((r) => r.username)).toEqual(['Jo', 'Alex', 'Bea', 'Zed']);
  });
  it('does not change the rows it was given', () => {
    const mates = [row('Jo', 80)];
    rankMates(me, mates);
    expect(mates).toEqual([row('Jo', 80)]);
    expect(me).toEqual(row('Alex', 75, 5118));
  });
});

describe('a mate\'s rating is the number on their own card', () => {
  const cat = { PL: { a: 40, c: 28 }, UCL: { a: 22, c: 12 }, WorldCup: { a: 15, c: 9 } };
  it('computed from the column beside the blob, as their profile screen does it', () => {
    const p = { correct_answers: 300, stats: { totalAnswered: 520, catStats: cat, cardLeague: 'LaLiga' } };
    const card = computeCard(cat, undefined, { c: 300, a: 520 }, 'LaLiga');
    expect(card.rated).toBe(true);
    expect(mateRating(p)).toBe(card.overall);
  });
  it('no rating while they have too few answers, or no stats at all', () => {
    expect(mateRating({ correct_answers: 2, stats: { totalAnswered: 3, catStats: { PL: { a: 3, c: 2 } } } })).toBe(null);
    expect(mateRating({ stats: null })).toBe(null);
    expect(mateRating({})).toBe(null);
    expect(mateRating(null)).toBe(null);
  });
});

describe('badges: N of M', () => {
  it('the wall has twelve badges, first_blood first', () => {
    expect(IDS.length).toBe(12);
    expect([IDS[0], IDS[11]]).toEqual(['first_blood', 'world_class']);
  });
  it('counts what is held out of what the wall draws', () => {
    expect(badgeCount(new Set(['first_blood', 'roll5', 'perfect']), IDS)).toEqual({ n: 3, m: 12 });
    expect(badgeCount(new Set(), IDS)).toEqual({ n: 0, m: 12 });
    expect(badgeCount(new Set(IDS), IDS)).toEqual({ n: 12, m: 12 });
  });
  it('an id the wall does not draw is not counted', () => {
    expect(badgeCount(new Set(['first_blood', 'a_retired_badge']), IDS).n).toBe(1);
  });
});

describe('the nearest badge', () => {
  const ask = (o) => nearestBadge({ ids: IDS, earned: new Set(), stats: {}, xp: 0, streak: 0, ...o });
  it('Alex today: a streak of one day is day 1 of 5 for On a Roll', () => {
    const earned = new Set(['first_blood', 'speed_demon', 'perfect', 'survivor', 'scholar', 'faithful', 'legend_xp']);
    expect(ask({ earned, streak: 1, xp: 5118, stats: { gamesPlayed: 300, bestIQ: 118 } })).toEqual({ id: 'roll5', have: 1, need: 5, kind: 'day' });
  });
  it('the largest share done wins', () => {
    // 40 of 50 games (80%) against 300 of 500 correct (60%) and day 2 of 5 (40%).
    expect(ask({ earned: new Set(['first_blood']), streak: 2, stats: { gamesPlayed: 40, totalCorrect: 300 } })).toEqual({ id: 'faithful', have: 40, need: 50, kind: 'games' });
  });
  it('equal shares go to the one with less left', () => {
    // Day 3 of 5 and 6 of 10 are both 60%: two days left beats four points left.
    expect(ask({ earned: new Set(['first_blood']), streak: 3, stats: { gamesPlayed: 1, bestScore: 6 } }).id).toBe('roll5');
    // 6 of 30 days and 100 of 500 correct are both 20%: 24 left beats 400.
    expect(ask({ earned: new Set(['first_blood', 'roll5']), streak: 6, stats: { gamesPlayed: 1, totalCorrect: 100 } }).id).toBe('roll30');
  });
  it('nothing started: the first badge not held, with no figure', () => {
    expect(ask({})).toEqual({ id: 'first_blood', plain: true });
    expect(ask({ earned: new Set(['first_blood']), stats: { gamesPlayed: 0 } })).toEqual({ id: 'roll5', plain: true });
  });
  it('an IQ badge never carries a figure, however close the best IQ is', () => {
    const earned = new Set(IDS.filter((id) => !['big_brain', 'goat', 'world_class'].includes(id)));
    expect(ask({ earned, stats: { bestIQ: 119 }, xp: 9000, streak: 40 })).toEqual({ id: 'big_brain', plain: true });
  });
  it('a count already at its mark on a badge not held prints no figure', () => {
    expect(ask({ earned: new Set(['first_blood']), stats: { gamesPlayed: 60 } })).toEqual({ id: 'roll5', plain: true });
  });
  it('every badge held: nothing to show', () => {
    expect(ask({ earned: new Set(IDS) })).toBe(null);
  });
  it('the one badge with no rule is the last one left, and has no figure', () => {
    const earned = new Set(IDS.filter((id) => id !== 'world_class'));
    expect(ask({ earned, stats: { gamesPlayed: 400, catStats: { WorldCup: { a: 99, c: 60 } } }, xp: 30000, streak: 50 })).toEqual({ id: 'world_class', plain: true });
  });
  it('every mark here is the mark computeBadges awards the badge at', () => {
    const base = { gamesPlayed: 0, bestHotStreak: 0, bestScore: 0, bestStreak: 0, totalCorrect: 0 };
    const field = { first_blood: 'gamesPlayed', speed_demon: 'bestHotStreak', perfect: 'bestScore', survivor: 'bestStreak', scholar: 'totalCorrect', faithful: 'gamesPlayed' };
    const at = (id, v) => {
      if (id === 'roll5' || id === 'roll30') return computeBadges(base, 0, v).has(id);
      if (id === 'legend_xp') return computeBadges(base, v, 0).has(id);
      return computeBadges({ ...base, [field[id]]: v }, 0, 0).has(id);
    };
    const measured = IDS.filter((id) => badgeNeed(id) !== null);
    expect(measured.sort()).toEqual(['faithful', 'first_blood', 'legend_xp', 'perfect', 'roll30', 'roll5', 'scholar', 'speed_demon', 'survivor']);
    for (const id of measured) {
      expect(at(id, badgeNeed(id) - 1), `${id} one short`).toBe(false);
      expect(at(id, badgeNeed(id)), `${id} at the mark`).toBe(true);
    }
  });
});

describe('the next rank', () => {
  it('Alex today: 5,118 XP is 2,882 short of Icon', () => {
    expect(nextRank(5118)).toEqual({ top: false, name: 'Icon', toGo: 2882 });
  });
  it('a new player is 100 XP from Non-League', () => {
    expect(nextRank(0)).toEqual({ top: false, name: 'Non-League', toGo: 100 });
    expect(nextRank(undefined)).toEqual({ top: false, name: 'Non-League', toGo: 100 });
  });
  it('at the top rank there is no next: the row names the rank held', () => {
    const top = LEVELS[LEVELS.length - 1];
    expect(nextRank(top.xpNeeded)).toEqual({ top: true, name: top.name });
    expect(nextRank(top.xpNeeded + 99999)).toEqual({ top: true, name: 'Immortal' });
  });
  it('the ladder marks every rank, and the bar is the share of the way', () => {
    const l = ladder(5118);
    expect(l.rows.map((r) => r.state)).toEqual(['done', 'done', 'done', 'done', 'done', 'cur', 'next', 'far']);
    expect([l.level.name, l.nextLevel.name, l.toGo, l.pct]).toEqual(['Cult Hero', 'Icon', 2882, 42]);
    const top = ladder(25000);
    expect(top.rows.map((r) => r.state)).toEqual(['done', 'done', 'done', 'done', 'done', 'done', 'done', 'cur']);
    expect([top.nextLevel, top.toGo, top.pct]).toEqual([null, 0, 100]);
    expect(ladder(0).rows.map((r) => r.state).slice(0, 3)).toEqual(['cur', 'next', 'far']);
  });
});

describe('the weakest area and the kind of player', () => {
  const face = (abbr, rating, answered = MIN_RATED_ANSWERS) => ({ abbr, rating, answered });
  it('the weakest of the areas the player has really played', () => {
    const v = verdict({ ratings: [face('EPL', 78), face('CLUBS', 70), face('RECORDS', 85), face('UCL', 40, 3)] });
    expect([v.strongest.abbr, v.weakest.abbr, v.identity]).toEqual(['RECORDS', 'CLUBS', 'specialist']);
  });
  it('one rated area names no weakest; none names nothing', () => {
    const one = verdict({ ratings: [face('EPL', 78), face('UCL', 50, 9)] });
    expect([one.strongest.abbr, one.weakest, one.identity]).toEqual(['EPL', null, 'rising']);
    expect(verdict({ ratings: [] })).toEqual({ strongest: null, weakest: null, identity: 'rising' });
    expect(verdict(null).weakest).toBe(null);
  });
  it('a narrow spread over three areas is an all-rounder', () => {
    expect(verdict({ ratings: [face('EPL', 66), face('UCL', 64), face('NATIONS', 63)] }).identity).toBe('allRounder');
    expect(verdict({ ratings: [face('EPL', 66), face('UCL', 64)] }).identity).toBe('rising');
  });
  it('a card label as running text', () => {
    expect(['EPL', 'UCL', 'NATIONS', 'CLUBS', 'LA LIGA', 'SERIE A', 'LIGUE 1', 'SÜPER LIG', 'BUNDESLIGA'].map(faceWord))
      .toEqual(['EPL', 'UCL', 'Nations', 'Clubs', 'La Liga', 'Serie A', 'Ligue 1', 'Süper Lig', 'Bundesliga']);
  });
});
