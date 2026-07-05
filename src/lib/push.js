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

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../supabase.js';

export function pushSupported() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

let _wired = false;        // listeners attached once for the app lifetime
let _uid = null;           // current signed-in user id (token may arrive async)
let _tapCb = null;         // app-provided router for notification taps

// Persist this device's APNs token for the signed-in user so the edge function
// can target it. Goes through the SECURITY DEFINER register_device_token RPC,
// which clears any prior owner of the token (device re-homed) before inserting.
async function saveToken(token) {
  if (!_uid || !token) return;
  try {
    await supabase.rpc('register_device_token', { p_token: token, p_platform: Capacitor.getPlatform() });
  } catch { /* best-effort */ }
}

// Set the tap router BEFORE registerPush so a cold-launch-from-notification tap
// isn't missed. Receives the push's `data` payload (e.g. { type, code }).
export function onPushTap(cb) { _tapCb = cb; }

// Call after sign-in on native. Requests permission (first call only shows the
// iOS prompt), attaches listeners once, and registers with APNs. Idempotent.
export async function registerPush(userId) {
  if (!pushSupported() || !userId) return;
  _uid = userId;
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return; // user declined — leave it
    if (!_wired) {
      _wired = true;
      // Token issued / rotated by APNs → persist it.
      PushNotifications.addListener('registration', (t) => { saveToken(t.value); });
      PushNotifications.addListener('registrationError', () => { /* non-fatal */ });
      // Tap on a delivered push (foreground or from the tray) → route in-app.
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        try { _tapCb?.(action?.notification?.data || {}); } catch { /* noop */ }
      });
    }
    await PushNotifications.register(); // fires 'registration' with the token
  } catch { /* best-effort */ }
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
