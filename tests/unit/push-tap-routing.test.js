import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * A notification tap must survive arriving before the app is ready.
 *
 * ⚠️ PLAYER-REPORTED 2026-08-22: "open the game when you got the app does not
 * work when you get game notifications."
 *
 * The payload was never the problem — send-push puts {type, code} in both the
 * APNs and FCM data, and the app's router deep-links correctly on it. The
 * problem was TIMING, twice over:
 *
 *   1. The OS listener was attached inside registerPush(), which needs a
 *      userId and granted permission and runs from an effect keyed to
 *      `user?.id`. On a cold launch from a notification, iOS delivers the tap
 *      while the app is still booting — before auth resolves — so no listener
 *      existed and Capacitor dropped the event.
 *   2. Even once attached, `_tapCb?.(data)` silently discarded the tap if
 *      React had not yet called onPushTap().
 *
 * Both failures are invisible: the app opens, just on the wrong screen, which
 * reads as "the notification did nothing".
 */

const listeners = {};
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    addListener: vi.fn((event, cb) => { listeners[event] = cb; return { remove: vi.fn() }; }),
    register: vi.fn(),
    requestPermissions: vi.fn(async () => ({ receive: 'granted' })),
    checkPermissions: vi.fn(async () => ({ receive: 'granted' })),
  },
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' },
}));
vi.mock('@sentry/react', () => ({ captureException: vi.fn(), addBreadcrumb: vi.fn() }));
vi.mock('../../src/supabase.js', () => ({ supabase: { from: () => ({ delete: () => ({ eq: () => ({ eq: async () => ({}) }) }) }) } }));

const fireTap = (data) =>
  listeners['pushNotificationActionPerformed']?.({ notification: { data } });

describe('push tap routing', () => {
  beforeEach(() => { vi.resetModules(); for (const k of Object.keys(listeners)) delete listeners[k]; });

  it('attaches the OS listener WITHOUT a signed-in user', async () => {
    // This is the whole first half: the listener must not wait for auth,
    // because a cold-launch tap arrives before auth resolves.
    const { initPushTapRouting } = await import('../../src/lib/push.js');
    initPushTapRouting();
    expect(listeners['pushNotificationActionPerformed'], 'no listener attached at boot').toBeTypeOf('function');
  });

  it('replays a tap that arrived BEFORE the router was set', async () => {
    const { initPushTapRouting, onPushTap } = await import('../../src/lib/push.js');
    initPushTapRouting();

    // Cold launch: the tap lands while React is still booting.
    fireTap({ type: 'play_invite', code: 'ABC123' });

    const routed = [];
    onPushTap((d) => routed.push(d));

    expect(routed, 'the buffered tap was dropped').toHaveLength(1);
    expect(routed[0]).toEqual({ type: 'play_invite', code: 'ABC123' });
  });

  it('routes a tap that arrives after the router is set', async () => {
    const { initPushTapRouting, onPushTap } = await import('../../src/lib/push.js');
    initPushTapRouting();
    const routed = [];
    onPushTap((d) => routed.push(d));
    fireTap({ type: 'play_invite', code: 'XYZ789' });
    expect(routed).toEqual([{ type: 'play_invite', code: 'XYZ789' }]);
  });

  it('replays a buffered tap only once', async () => {
    const { initPushTapRouting, onPushTap } = await import('../../src/lib/push.js');
    initPushTapRouting();
    fireTap({ type: 'play_invite', code: 'ONCE01' });

    const first = [];
    onPushTap((d) => first.push(d));
    const second = [];
    onPushTap((d) => second.push(d));

    expect(first).toHaveLength(1);
    expect(second, 'a re-registered router replayed a stale tap').toHaveLength(0);
  });

  it('is idempotent — repeated init does not stack listeners', async () => {
    const { initPushTapRouting, onPushTap } = await import('../../src/lib/push.js');
    initPushTapRouting();
    initPushTapRouting();
    initPushTapRouting();
    const routed = [];
    onPushTap((d) => routed.push(d));
    fireTap({ type: 'friend_request' });
    expect(routed, 'the tap was delivered more than once').toHaveLength(1);
  });
});
