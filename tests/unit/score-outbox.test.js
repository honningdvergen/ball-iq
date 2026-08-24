import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Every finished game must end up in `scores`, exactly once, on the right day.
 *
 * ⚠️ MEASURED AGAINST PROD 2026-08-24: 137 games finished in the last week,
 * 110 score rows. ~20% of real play was missing from the one table every
 * metric reads — the retention figure, the "did they play today" check that
 * drives the daily reminder push, and every profile total.
 *
 * The cause was an asymmetry, not a crash. `wordle_state` is eventually
 * consistent (skipped when signed out, back-synced at sign-in by `hydrate`).
 * `scores` was fire-and-forget: `if (user?.id)` and no retry, so a game
 * finished before auth hydrated, while signed out, or during a network blip
 * was gone permanently. Nothing logged. Nothing to notice.
 *
 * Three properties are load-bearing and each one, if broken, fails SILENTLY in
 * the direction of looking correct:
 *
 *   1. ONE DOOR. Five call sites each had their own insert, which is precisely
 *      why the gap survived — there was no single place where anyone could see
 *      it. A sixth raw insert would reopen it.
 *   2. IDEMPOTENT. A retrying outbox without a dedupe key inflates exactly the
 *      number it exists to make honest. Worse than the bug it fixes, because
 *      over-counting looks like growth.
 *   3. STAMPED WITH THE PLAY TIME. `created_at` defaults to now(), so a
 *      backfilled row lands on the flush date. Per-day counts would still be
 *      wrong, just wrong in a new place — and the totals would look fixed.
 */

const insertMock = vi.fn();
vi.mock('../../src/supabase.js', () => ({
  supabase: { from: () => ({ insert: (row) => insertMock(row) }) },
}));

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { saveScore, flushScoreOutbox, readOutbox } = await import('../../src/lib/scoreOutbox.js');

const APP = readFileSync(fileURLToPath(new URL('../../src/App.jsx', import.meta.url)), 'utf8');
const USER = '11111111-2222-3333-4444-555555555555';

beforeEach(() => {
  store.clear();
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
});

describe('no finished game is lost', () => {
  it('there is exactly ONE door into the scores table', () => {
    // ⚠️ The load-bearing assertion. A raw insert anywhere in App.jsx is a
    // write with no retry — the original bug, reintroduced.
    const raw = [...APP.matchAll(/from\(\s*['"]scores['"]\s*\)\s*\.insert/g)];
    expect(
      raw.map((m) => APP.slice(m.index, m.index + 80).replace(/\s+/g, ' ')),
      '\n  Write scores through saveScore() so the row survives a failed write.\n',
    ).toEqual([]);
    // …and the door is actually in use. A zero above is meaningless if every
    // call site was deleted instead of migrated.
    expect(APP.match(/saveScore\(/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
  });

  it('a game finished while signed out is queued, not dropped', () => {
    saveScore(null, { game_mode: 'footle', score: 4, correct_answers: 1, total_questions: 1 });
    expect(insertMock).not.toHaveBeenCalled();
    expect(readOutbox()).toHaveLength(1);
  });

  it('a failed write is queued and lands on the next flush', async () => {
    insertMock.mockResolvedValueOnce({ error: { code: '08006', message: 'network' } });
    await saveScore(USER, { game_mode: 'classic', score: 7, total_questions: 10 });
    expect(readOutbox()).toHaveLength(1);

    insertMock.mockResolvedValue({ error: null });
    const { sent } = await flushScoreOutbox(USER);
    expect(sent).toBe(1);
    expect(readOutbox()).toHaveLength(0);
  });

  it('a partially-succeeded flush cannot double-count', async () => {
    saveScore(null, { game_mode: 'trail', score: 3, total_questions: 1 });
    const id = readOutbox()[0].id;

    // The row already landed on a previous attempt: Postgres answers 23505 on
    // the primary key. That is a SUCCESS, not a failure to retry forever.
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } });
    const { sent } = await flushScoreOutbox(USER);
    expect(sent).toBe(1);
    expect(readOutbox()).toHaveLength(0);
    expect(insertMock.mock.calls[0][0].id).toBe(id);
  });

  it('a backfilled row carries the play time, not the flush time', async () => {
    saveScore(null, { game_mode: 'mystery', score: 2, total_questions: 1 });
    const queuedAt = readOutbox()[0].queued_at;

    await flushScoreOutbox(USER);
    const written = insertMock.mock.calls[0][0];
    expect(written.created_at, 'without this the row lands on the flush date').toBeTruthy();
    expect(new Date(written.created_at).getTime()).toBe(queuedAt);
    expect(written.queued_at, 'the local bookkeeping field must not be sent').toBeUndefined();
  });

  it('a device clock set to the future cannot write a future row', async () => {
    saveScore(null, { game_mode: 'classic', score: 5, total_questions: 10 });
    const rows = readOutbox();
    rows[0].queued_at = Date.now() + 5 * 365 * 24 * 60 * 60 * 1000;   // phone set to 2031
    localStorage.setItem('biq_score_outbox', JSON.stringify(rows));

    await flushScoreOutbox(USER);
    const written = insertMock.mock.calls[0][0];
    expect(new Date(written.created_at).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('an offline flush keeps the queue instead of burning it', async () => {
    saveScore(null, { game_mode: 'classic', score: 1, total_questions: 10 });
    saveScore(null, { game_mode: 'classic', score: 2, total_questions: 10 });
    insertMock.mockRejectedValue(new Error('offline'));

    const { sent } = await flushScoreOutbox(USER);
    expect(sent).toBe(0);
    expect(readOutbox(), 'both rows must survive a dead connection').toHaveLength(2);
  });

  it('flushing with no user is a no-op, never a wipe', async () => {
    saveScore(null, { game_mode: 'footle', score: 4, total_questions: 1 });
    const { sent } = await flushScoreOutbox(null);
    expect(sent).toBe(0);
    expect(readOutbox()).toHaveLength(1);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
