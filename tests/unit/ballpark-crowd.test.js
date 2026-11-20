// Ballpark's "closer than N others" (20 Nov 2026): what is asked of the
// database, when nothing is asked at all, and which line a player is shown.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const calls = [];
let answer = { n: 0, beat: 0 };
let fake = false;
let backend = true;
let vid = '11111111-2222-3333-4444-555555555555';
vi.mock('../../src/lib/dailyResults.js', () => ({
  rpc: async (name, body) => { calls.push([name, body]); if (answer instanceof Error) throw answer; return answer; },
  synthetic: () => fake,
  hasBackend: () => backend,
  visitorId: () => vid,
}));

const { crowdStanding, crowdLine, cleanStanding, CROWD_PCT_FROM, __resetCrowdForTests } = await import('../../src/lib/ballparkCrowd.js');

beforeEach(() => { calls.length = 0; answer = { n: 0, beat: 0 }; fake = false; backend = true; vid = '11111111-2222-3333-4444-555555555555'; __resetCrowdForTests(); });

describe('asking how a guess stands', () => {
  it('sends the question, the guess, the true answer and the device id, and returns the two counts', async () => {
    answer = { n: 41, beat: 27 };
    expect(await crowdStanding({ id: 'wc-goals-total', guess: 2500, answer: 2720 })).toEqual({ n: 41, beat: 27 });
    expect(calls).toEqual([['ballpark_guess', { p_question: 'wc-goals-total', p_guess: 2500, p_answer: 2720, p_visitor: vid }]]);
  });
  it('asks once for the same question and guess, however often the reveal is drawn', async () => {
    answer = { n: 3, beat: 1 };
    await Promise.all([1, 2, 3].map(() => crowdStanding({ id: 'q-one', guess: 5, answer: 6 })));
    await crowdStanding({ id: 'q-one', guess: 5, answer: 6 });
    expect(calls.length).toBe(1);
  });
  it('a failed call says nothing, and coming back tries again', async () => {
    answer = new Error('offline');
    expect(await crowdStanding({ id: 'q-one', guess: 5, answer: 6 })).toBeNull();
    answer = { n: 2, beat: 2 };
    expect(await crowdStanding({ id: 'q-one', guess: 5, answer: 6 })).toEqual({ n: 2, beat: 2 });
    expect(calls.length).toBe(2);
  });
  it('nothing is sent from a test browser or localhost, without a device id, or for a guess that is not one', async () => {
    fake = true;
    expect(await crowdStanding({ id: 'q-one', guess: 5, answer: 6 })).toBeNull();
    fake = false; backend = false;
    expect(await crowdStanding({ id: 'q-one', guess: 5, answer: 6 })).toBeNull();
    backend = true; vid = null;
    expect(await crowdStanding({ id: 'q-one', guess: 5, answer: 6 })).toBeNull();
    vid = 'x'.repeat(36);
    for (const bad of [{ id: 'q', guess: 0, answer: 6 }, { id: 'q', guess: NaN, answer: 6 }, { id: 'q', guess: 5, answer: 0 }, { id: null, guess: 5, answer: 6 }]) {
      expect(await crowdStanding(bad)).toBeNull();
    }
    expect(calls.length).toBe(0);
  });
  it('an answer that is not two sane counts is treated as no answer', () => {
    for (const bad of [null, undefined, 'x', [], {}, { n: 3 }, { n: -1, beat: 0 }, { n: 2, beat: 3 }, { n: 2.5, beat: 1 }, { n: '4', beat: 'x' }]) {
      expect(cleanStanding(bad), JSON.stringify(bad)).toBeNull();
    }
    expect(cleanStanding({ n: 4, beat: 4 })).toEqual({ n: 4, beat: 4 });
    expect(cleanStanding({ n: '4', beat: '1' })).toEqual({ n: 4, beat: 1 });
  });
});

describe('the line a player is shown', () => {
  it('no answer, no line: it is never guessed at', () => {
    expect(crowdLine(null)).toBeNull();
    expect(crowdLine({ n: 2, beat: 9 })).toBeNull();
  });
  it('the first to answer is told so', () => {
    expect(crowdLine({ n: 0, beat: 0 })).toEqual({ key: 'bp.crowd.first', vars: {} });
  });
  it('against one other player it says who was closer, and a tie is not a win', () => {
    expect(crowdLine({ n: 1, beat: 1 }).key).toBe('bp.crowd.oneWon');
    expect(crowdLine({ n: 1, beat: 0 }).key).toBe('bp.crowd.oneLost');
  });
  it('with a few players it counts heads; a percentage of seven people would be noise', () => {
    expect(crowdLine({ n: 7, beat: 3 })).toEqual({ key: 'bp.crowd.count', vars: { beat: 3, n: 7 } });
    expect(crowdLine({ n: CROWD_PCT_FROM - 1, beat: 0 }).key).toBe('bp.crowd.count');
  });
  it('from twenty players on it is a percentage, 0 to 100', () => {
    expect(crowdLine({ n: 20, beat: 13 })).toEqual({ key: 'bp.crowd.pct', vars: { p: 65, n: 20 } });
    expect(crowdLine({ n: 143, beat: 0 }).vars.p).toBe(0);
    expect(crowdLine({ n: 143, beat: 143 }).vars.p).toBe(100);
  });
  it('the percentage is rounded down, and 100 is only for beating every one of them', () => {
    expect(crowdLine({ n: 300, beat: 299 }).vars.p).toBe(99);
    expect(crowdLine({ n: 1000, beat: 999 }).vars.p).toBe(99);
    expect(crowdLine({ n: 1000, beat: 616 }).vars.p).toBe(61);
    expect(crowdLine({ n: 1000, beat: 5 }).vars.p).toBe(0);
  });
});
