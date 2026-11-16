// Challenge links for Footle, Trail and Top 10 (16 Oct 2026).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { challengeToken, parseChallengeToken, compareScores, scoreLabel, challengeLine, challengeFromUrl } from '../../src/lib/gameChallenge.js';

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
  // 1.8.7 Android walk, 16 Nov 2026: a "send it to a mate" link opened plain
  // Home in the installed app. The native link handler sent every /c/ token
  // to the Daily 7 parser, and the web capture reads window.location, which a
  // universal link never changes in a native shell.
  it('reads a challenge out of a full link, the way a native shell receives it', () => {
    expect(challengeFromUrl('https://balliq.app/c/f.197.4.Alex?r=ABCDEFGH2345'))
      .toEqual({ game: 'footle', edition: 197, score: 4, name: 'Alex', rid: 'ABCDEFGH2345' });
    expect(challengeFromUrl('https://balliq.app/c/t.75.0')).toEqual({ game: 'trail', edition: 75, score: 0, name: '' });
    expect(challengeFromUrl('https://balliq.app/c/x.5.7.J%C3%B8rgen')).toEqual({ game: 'top10', edition: 5, score: 7, name: 'Jørgen' });
  });
  it('a reply id that is not well formed is dropped, the challenge is kept', () => {
    expect(challengeFromUrl('https://balliq.app/c/f.197.4.Alex?r=nope')).toEqual({ game: 'footle', edition: 197, score: 4, name: 'Alex' });
  });
  it('is null for the Daily 7 link, other paths and junk, so those keep their own handlers', () => {
    expect(challengeFromUrl('https://balliq.app/c/5.20261116.Alex')).toBe(null);
    expect(challengeFromUrl('https://balliq.app/join/ABCDEF')).toBe(null);
    expect(challengeFromUrl('https://balliq.app/c/f.197.9')).toBe(null);
    expect(challengeFromUrl('not a url')).toBe(null);
    expect(challengeFromUrl(undefined)).toBe(null);
  });
  it('the native link handler tries the game challenge before the Daily 7 parser', () => {
    const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
    const from = APP.indexOf('const tryCapture = (url) => {');
    const body = APP.slice(from, APP.indexOf('CapApp.getLaunchUrl()', from));
    const gc = body.indexOf('const gc = challengeFromUrl(url);');
    const d7 = body.indexOf('const ch = parseChallengeStr(cm[1]);');
    expect(from).toBeGreaterThan(-1);
    expect(gc).toBeGreaterThan(-1);
    expect(d7).toBeGreaterThan(gc);
    expect(body.slice(gc, d7)).toContain('storeChallenge(gc);');
    expect(body.slice(gc, d7)).toContain('setScreen(gc.game === "footle" ? "wordle" : gc.game);');
    expect(body.slice(gc, d7)).toContain('return;');
    // Today's puzzle, and a fresh screen even when that game is already open.
    expect(body.slice(gc, d7)).toContain('setArchiveDate(null); setTop10ListId(null);');
    expect(body.slice(gc, d7)).toContain('setChallengeSeen((n) => n + 1);');
    expect(APP).toContain('<FootballWordle key={challengeSeen} ');
    expect(APP).toContain('<TransferTrail key={`${dateToYMD(day)}:${challengeSeen}`} ');
    expect(APP).toContain('<Top10 key={`${top10ListId || "day"}:${challengeSeen}`} ');
  });
});
