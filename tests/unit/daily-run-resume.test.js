import { describe, it, expect, beforeEach } from 'vitest';
import { DAILY_RUN_KEY, saveDailyRun, loadDailyRun, clearDailyRun, dailyRunAnswered } from '../../src/lib/dailyRun.js';

/**
 * 10 Nov 2026: leaving Daily 7 after an answer lost the run, and going back in
 * dealt the same seven from 1/7, so the answers could be read and replayed.
 * The run is now saved after every answer (lib/dailyRun.js). These pin what
 * counts as "the same run": the same day AND the same seven questions.
 */
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

const QS = Array.from({ length: 7 }, (_, i) => ({ id: `q${i}`, q: `Question ${i}?`, o: ['a', 'b', 'c', 'd'], a: 0 }));
const rec = (isCorrect) => ({ q: 'x', type: 'mcq', options: ['a', 'b', 'c', 'd'], userIdx: isCorrect ? 0 : 1, correctIdx: 0, isCorrect, timedOut: false });
const STATE = { answered: 2, score: 1, streak: 0, bestStreak: 1, wrong: [{ id: 'q1', q: 'Question 1?', correct: 'a', user: 'b' }], all: [rec(true), rec(false)] };
const DAY = '2026-11-10';

beforeEach(() => store.clear());

describe('Daily 7 run snapshot', () => {
  it('round-trips everything the result needs', () => {
    saveDailyRun(DAY, QS, STATE);
    expect(loadDailyRun(DAY, QS)).toMatchObject(STATE);
    expect(dailyRunAnswered(DAY)).toBe(2);
  });

  it('the same seven with options reshuffled is still the same run', () => {
    saveDailyRun(DAY, QS, STATE);
    const reshuffled = QS.map((q) => ({ ...q, o: [...q.o].reverse(), a: 3 }));
    expect(loadDailyRun(DAY, reshuffled)?.answered).toBe(2);
  });

  it('another day is ignored and removed', () => {
    saveDailyRun(DAY, QS, STATE);
    expect(dailyRunAnswered('2026-11-11')).toBe(0);
    expect(loadDailyRun('2026-11-11', QS)).toBeNull();
    expect(store.has(DAILY_RUN_KEY)).toBe(false);
  });

  it('another question set is ignored and removed', () => {
    saveDailyRun(DAY, QS, STATE);
    const other = QS.map((q, i) => (i === 3 ? { ...q, id: 'zz' } : q));
    expect(loadDailyRun(DAY, other)).toBeNull();
    expect(store.has(DAILY_RUN_KEY)).toBe(false);
  });

  it('corrupt or impossible data is ignored and removed', () => {
    for (const bad of ['{not json', 'null', '[]', JSON.stringify({ day: DAY }),
      JSON.stringify({ day: DAY, fp: 'q0', answered: 3, score: 9, streak: 0, bestStreak: 0, wrong: [], all: [1, 2, 3] }),
      JSON.stringify({ day: DAY, fp: 'q0', answered: 2, score: 1, streak: 0, bestStreak: 1, wrong: [], all: [1] })]) {
      store.set(DAILY_RUN_KEY, bad);
      expect(dailyRunAnswered(DAY), bad).toBe(0);
      expect(loadDailyRun(DAY, QS), bad).toBeNull();
      expect(store.has(DAILY_RUN_KEY), bad).toBe(false);
    }
  });

  it('is cleared on completion', () => {
    saveDailyRun(DAY, QS, { ...STATE, answered: 7, score: 6, streak: 5, bestStreak: 5, all: Array.from({ length: 7 }, (_, i) => rec(i !== 1)) });
    expect(loadDailyRun(DAY, QS)?.answered).toBe(7);
    clearDailyRun();
    expect(loadDailyRun(DAY, QS)).toBeNull();
    expect(dailyRunAnswered(DAY)).toBe(0);
  });

  it('storage that throws never breaks the quiz', () => {
    const real = globalThis.localStorage;
    globalThis.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
    try {
      expect(() => saveDailyRun(DAY, QS, STATE)).not.toThrow();
      expect(loadDailyRun(DAY, QS)).toBeNull();
      expect(dailyRunAnswered(DAY)).toBe(0);
      expect(() => clearDailyRun()).not.toThrow();
    } finally { globalThis.localStorage = real; }
  });

  it('the engine saves on every answer, resumes on mount and clears on completion', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const ENGINE = readFileSync(fileURLToPath(new URL('../../src/screens/QuizEngine.jsx', import.meta.url)), 'utf8');
    expect(ENGINE).toMatch(/dailyDay \? loadDailyRun\(dailyDay, questions\)/);
    expect(ENGINE).toMatch(/if \(dailyDay && correct !== "timeout"\) saveDailyRun\(/);
    expect(ENGINE).toMatch(/if \(dailyDay\) clearDailyRun\(\);/);
  });
});
