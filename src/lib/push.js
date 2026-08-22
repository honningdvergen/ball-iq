// 1.3 Notifications Phase 2 — native remote push (APNs).
//
// Registers the device with Apple Push Notification service, stores the device
// token in Supabase (device_tokens), and routes notification taps. The SEND
// side lives in the `send-push` Supabase edge function, fired by a database
// webhook when a notifications row is inserted (play invite, and later friend
// requests). This module is the CLIENT half: token registration + tap routing.
//
// Native-only: @capacitor/push-notifications' remote APNs registration is
// meaningless on web (web push would need a different Web-Push/VAPID path), so
// everything here no-ops off-native. Best-effort throughout — push is a
// nice-to-have layered on top of the in-app inbox, never load-bearing.

import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabase.js';

export function pushSupported() {
  // Both native platforms since 1.6.2. The Android half of the old crash
  // (ticket #1650: "Default FirebaseApp is not initialized" hard-crashing
  // outside the JS bridge) is fixed at the root — Firebase project
  // ball-iq-499016 + google-services.json now ship in the build, and
  // Capacitor's gradle template auto-applies the google-services plugin
  // when the file exists. The send-push edge function routes by token
  // platform: ios -> APNs, android -> FCM v1.
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

let _wired = false;        // listeners attached once for the app lifetime
let _uid = null;           // current signed-in user id (token may arrive async)
let _tapCb = null;         // app-provided router for notification taps
let _pendingTap = null;    // a tap that arrived before the router was set
let _tapWired = false;     // tap listener attached (independent of sign-in)

// Persist this device's APNs token for the signed-in user so the edge function
// can target it. Goes through the SECURITY DEFINER register_device_token RPC,
// which clears any prior owner of the token (device re-homed) before inserting.
async function saveToken(token) {
  if (!_uid || !token) return;
  try {
    // ⚠️ supabase.rpc() RESOLVES with {data, error} on a Postgres error — it does
    // NOT throw — so the previous try/catch here discarded failures without even
    // logging them. If this RPC ever starts failing (a grant change, an RLS
    // tweak, a new constraint) the token silently never lands and the user gets
    // no push notifications FOREVER, with zero signal to us.
    //
    // Checked prod 2026-07-30 before changing anything: 20 tokens / 19 users, so
    // this is hardening, not a live outage. But the same swallow-the-error shape
    // had already cost us two real failures that day — sendPlayInvite telling
    // users an opponent was invited when the RPC raised, and report_question
    // thanking users while question_reports stayed empty for the app's whole life.
    const { error } = await supabase.rpc('register_device_token', {
      p_token: token, p_platform: Capacitor.getPlatform(),
    });
    if (error) {
      console.warn('[push] register_device_token', error.message);
      Sentry.captureException(error, { tags: { area: 'push-token' } });
    }
  } catch (e) {
    console.warn('[push] register_device_token threw', e?.message || e);
  }
}

// Set the tap router. Receives the push's `data` payload (e.g. { type, code }).
//
// ⚠️ If a tap already arrived before the router was set, it is REPLAYED here.
// That buffer is the difference between working and not: on a cold launch from
// a notification, iOS delivers the tap while the app is still booting — long
// before React has mounted and called this — and `_tapCb?.()` would silently
// drop it. Reported 2026-08-22: "open the game when you got the app does not
// work when you get game notifications."
export function onPushTap(cb) {
  _tapCb = cb;
  if (_pendingTap) {
    const data = _pendingTap;
    _pendingTap = null;
    try { cb?.(data); } catch { /* routing must never throw */ }
  }
}

// Attach the tap listener as EARLY as possible, independent of sign-in.
//
// ⚠️ This used to live inside registerPush(), which is gated on a userId AND on
// permission already being granted, and is itself called from an effect keyed
// to `user?.id`. So on a cold launch from a notification tap the listener did
// not exist yet: auth had not resolved, registerPush had not run, and
// Capacitor does not buffer plugin events. The tap was dropped and the app
// opened on whatever screen it would have anyway — which is exactly what the
// deep link is supposed to prevent.
//
// Adding a listener does not require registration, permission, or a session,
// so there is no reason to make it wait for any of them. Idempotent.
export function initPushTapRouting() {
  if (!pushSupported() || _tapWired) return;
  _tapWired = true;
  try {
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action?.notification?.data || {};
      if (_tapCb) { try { _tapCb(data); } catch { /* noop */ } }
      else _pendingTap = data;   // replayed by onPushTap()
    });
  } catch { /* a missing plugin must never break boot */ }
}

// Call after sign-in on native. Attaches listeners once and registers with
// APNs. Idempotent. `requestPermission: true` fires the ONE-SHOT iOS permission
// prompt (only the explicit user opt-in path may do this — a deny there is
// permanent); `requestPermission: false` is the passive path (session resolve):
// it only checks the existing permission and proceeds if already granted,
// never prompting.
export async function registerPush(userId, { requestPermission = true } = {}) {
  if (!pushSupported() || !userId) return;
  _uid = userId;
  try {
    const perm = requestPermission
      ? await PushNotifications.requestPermissions()
      : await PushNotifications.checkPermissions();
    if (perm.receive !== 'granted') return; // not granted — leave it
    if (!_wired) {
      _wired = true;
      // Token issued / rotated by APNs → persist it.
      PushNotifications.addListener('registration', (t) => { saveToken(t.value); });
      // ⚠️ This used to swallow the error entirely, on the one code path with a
      // history of hard-crashing Android (#1650, "Default FirebaseApp is not
      // initialized"). Combined with native builds shipping no Sentry client at
      // all, an FCM registration failure on a real device was invisible twice
      // over: nothing thrown to the user, nothing reported to us, and a device
      // that simply never appears in device_tokens. Still non-fatal — a failed
      // registration must never break the app — but no longer silent.
      PushNotifications.addListener('registrationError', (err) => {
        try {
          Sentry.captureException(
            new Error(`push registration failed: ${err?.error || 'unknown'}`),
            { tags: { platform: Capacitor.getPlatform(), area: 'push' } },
          );
        } catch { /* reporting must never throw */ }
      });
    }
    // Belt and braces: the tap listener is normally attached at boot by
    // initPushTapRouting(). Calling it again here is a no-op if it already
    // ran, and covers any path that reaches registration without booting
    // through the app shell.
    initPushTapRouting();
    await PushNotifications.register(); // fires 'registration' with the token
  } catch (err) {
    // Best-effort by design — push must never block sign-in — but report it,
    // for the same reason as registrationError above.
    try {
      Sentry.captureException(err, { tags: { platform: Capacitor.getPlatform(), area: 'push' } });
    } catch { /* reporting must never throw */ }
  }
}

// On sign-out, drop this device's token(s) for the user so a shared device
// doesn't keep pushing the previous account. Best-effort.
export async function unregisterPush(userId) {
  if (!pushSupported()) return;
  _uid = null;
  try {
    if (userId) await supabase.from('device_tokens').delete().eq('user_id', userId).eq('platform', Capacitor.getPlatform());
  } catch { /* noop */ }
}
