// Challenge links for Footle, Trail and Top 10 (16 Oct 2026).
import { describe, it, expect } from 'vitest';
import { challengeToken, parseChallengeToken, compareScores, scoreLabel, challengeLine } from '../../src/lib/gameChallenge.js';

describe('gameChallenge', () => {
  it('round-trips a token, dots in a name included', () => {
    const t = challengeToken('footle', 166, 3, 'J.Doe');
    expect(t).toBe('f.166.3.J%2EDoe');
    expect(parseChallengeToken(t)).toEqual({ game: 'footle', edition: 166, score: 3, name: 'J.Doe' });
    expect(parseChallengeToken('x.5.10')).toEqual({ game: 'top10', edition: 5, score: 10, name: '' });
  });
  it('refuses what is not a game challenge, including the Daily 7 form', () => {
    expect(parseChallengeToken('5.20261016.Alex')).toBe(null);
    expect(parseChallengeToken('f.166.9')).toBe(null); // Footle has six guesses
    expect(challengeToken('daily7', 1, 5)).toBe(null);
  });
  it('fewer guesses win, a miss is the worst; Top 10 counts up', () => {
    expect(compareScores('footle', 2, 3)).toBe(1);
    expect(compareScores('footle', 0, 6)).toBe(-1);
    expect(compareScores('footle', 0, 0)).toBe(0);
    expect(compareScores('trail', 1, 0)).toBe(1);
    expect(compareScores('top10', 7, 9)).toBe(-1);
  });
  it('reads in plain words', () => {
    expect(scoreLabel('footle', 0)).toBe('X/6');
    expect(scoreLabel('trail', 1)).toBe('1 club');
    expect(challengeLine({ game: 'footle', score: 3, name: 'Alex' })).toBe('Alex solved it in 3');
    expect(challengeLine({ game: 'top10', score: 7, name: '' })).toBe('A mate got 7/10');
  });
});
