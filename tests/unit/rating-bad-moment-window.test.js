// 16 Nov 2026: a bad moment blocked the rating ask for 24 hours, which also
// swallowed the next day's good moment for anyone who plays at about the same
// time each day. Read 2 to 15 Nov: 140 asks turned away as bad-moment against
// 83 shown. The block now lasts the sitting, not the day.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' } }));
vi.mock('@capacitor-community/in-app-review', () => ({ InAppReview: { requestReview: vi.fn(async () => {}) } }));

const store = new Map();
beforeEach(() => {
  store.clear();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); } };
  vi.useFakeTimers({ now: new Date('2026-11-16T08:05:00Z') });
});
afterEach(() => { vi.useRealTimers(); });

describe('a bad moment and the rating ask', () => {
  it('blocks the ask in the sitting it happened in', async () => {
    const { markBadReviewMoment, nativeAskBlockedReason } = await import('../../src/lib/review.js');
    expect(nativeAskBlockedReason()).toBe(null);
    markBadReviewMoment();
    expect(nativeAskBlockedReason()).toBe('bad-moment');
    vi.advanceTimersByTime(5 * 3600000 + 59 * 60000);
    expect(nativeAskBlockedReason()).toBe('bad-moment');
  });
  it('is over by the same time next day, and by the evening', async () => {
    const { markBadReviewMoment, nativeAskBlockedReason } = await import('../../src/lib/review.js');
    markBadReviewMoment();                          // lost Footle at 08:05
    vi.advanceTimersByTime(6 * 3600000 + 1000);     // that afternoon
    expect(nativeAskBlockedReason()).toBe(null);
    vi.setSystemTime(new Date('2026-11-17T08:00:00Z')); // solved it at 08:00 the next day
    expect(nativeAskBlockedReason()).toBe(null);
  });
  it('a real ask still starts a cooldown: three days, then a week, then a fortnight (22 Nov 2026)', async () => {
    const { maybeRequestReview, nativeAskBlockedReason, reviewGapDays } = await import('../../src/lib/review.js');
    expect([0, 1, 2, 3, 4, 24].map(reviewGapDays)).toEqual([0, 3, 7, 14, 14, 14]);
    expect([NaN, -1, undefined].map(reviewGapDays)).toEqual([0, 0, 0]);
    const day = 86400000;
    // First ask: blocked for three days, not fourteen.
    expect(await maybeRequestReview()).toBe(true);
    expect(nativeAskBlockedReason()).toBe('cooldown');
    vi.advanceTimersByTime(3 * day - 1000);
    expect(nativeAskBlockedReason()).toBe('cooldown');
    expect(await maybeRequestReview()).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(nativeAskBlockedReason()).toBe(null);
    // Second ask: a week.
    expect(await maybeRequestReview()).toBe(true);
    vi.advanceTimersByTime(7 * day - 1000);
    expect(nativeAskBlockedReason()).toBe('cooldown');
    vi.advanceTimersByTime(2000);
    expect(nativeAskBlockedReason()).toBe(null);
    // Third ask and every one after: the old fortnight.
    expect(await maybeRequestReview()).toBe(true);
    vi.advanceTimersByTime(13 * day);
    expect(nativeAskBlockedReason()).toBe('cooldown');
    vi.advanceTimersByTime(day + 1000);
    expect(nativeAskBlockedReason()).toBe(null);
  });
  it('a bad moment still wins inside a short gap', async () => {
    const { maybeRequestReview, markBadReviewMoment, nativeAskBlockedReason } = await import('../../src/lib/review.js');
    expect(await maybeRequestReview()).toBe(true);
    vi.advanceTimersByTime(3 * 86400000 + 1000);
    markBadReviewMoment();
    expect(nativeAskBlockedReason()).toBe('bad-moment');
    expect(await maybeRequestReview()).toBe(false);
  });
});
