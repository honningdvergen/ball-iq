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
  it('a real ask still starts the 14-day cooldown', async () => {
    const { maybeRequestReview, nativeAskBlockedReason } = await import('../../src/lib/review.js');
    expect(await maybeRequestReview()).toBe(true);
    expect(nativeAskBlockedReason()).toBe('cooldown');
    vi.advanceTimersByTime(13 * 86400000);
    expect(nativeAskBlockedReason()).toBe('cooldown');
    vi.advanceTimersByTime(86400000 + 1000);
    expect(nativeAskBlockedReason()).toBe(null);
  });
});
