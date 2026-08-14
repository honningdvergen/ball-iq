// Web Push — the reminder path for players the native engine can't reach.
//
// src/lib/notifications.js covers iOS and Android with LOCAL notifications and
// covers them well. It is a deliberate no-op on web, because a local
// notification cannot fire while the page is closed. So a visitor who arrives
// from one of the ~302 SEO pages, plays, and closes the tab is unreachable —
// which is most of the traffic.
//
// ⚠️ iOS/iPadOS grants Web Push ONLY inside a Home-Screen-installed PWA. A
// plain Safari tab gets nothing, and `Notification` is not even defined there,
// so on iOS this is downstream of install conversion, not a substitute for it.
// Desktop and Android work in an ordinary tab.

import { Capacitor } from '@capacitor/core';
import { supabase } from '../supabaseClient.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Is Web Push even possible here? Four conditions, and all four genuinely
 * occur in the wild:
 *  - not native (the native build has its own, better, local reminders)
 *  - the browser has PushManager (Safari < 16.4, most in-app webviews: no)
 *  - a service worker can register (file://, some privacy modes: no)
 *  - we actually have a key to subscribe with (unset env = don't pretend)
 */
export function webPushSupported() {
  try {
    if (Capacitor.isNativePlatform()) return false;
    if (typeof window === 'undefined') return false;
    if (!('serviceWorker' in navigator)) return false;
    if (!('PushManager' in window)) return false;
    if (typeof Notification === 'undefined') return false;
    return VAPID_PUBLIC_KEY.length > 0;
  } catch { return false; }
}

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function webPushPermission() {
  if (!webPushSupported()) return 'unsupported';
  try { return Notification.permission; } catch { return 'unsupported'; }
}

// The browser wants applicationServerKey as raw bytes, not the base64url string
// it is invariably distributed as. Note base64url→base64: '-'→'+', '_'→'/', and
// the padding the URL-safe alphabet drops has to come back or atob throws.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function persist(sub) {
  const json = sub.toJSON();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user?.id) return false;
  // Conflict on endpoint, not on (user_id): the same browser re-subscribing
  // must UPDATE its row. Inserting instead would accumulate duplicates and the
  // user would get the same notification three times.
  const { error } = await supabase
    .from('web_push_subscriptions')
    .upsert(
      { user_id: user.id, subscription: json, endpoint: json.endpoint, last_seen_at: new Date().toISOString() },
      { onConflict: 'endpoint' },
    );
  // ⚠️ supabase.rpc/from RESOLVE on error rather than throwing — an unchecked
  // call here would silently drop the subscription and the user would simply
  // never receive anything, with nothing in any log.
  if (error) { console.warn('[webpush] persist failed:', error.message); return false; }
  return true;
}

/**
 * Subscribe this browser. MUST be called from a real user gesture — Safari
 * rejects Notification.requestPermission() outside one, and Chrome's heuristics
 * punish permission prompts that fire on load.
 *
 * Returns true only if we end up with a persisted subscription.
 */
export async function enableWebPush() {
  if (!webPushSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;
    const appKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    // An existing subscription made with a DIFFERENT VAPID key is worse than
    // none: it looks healthy client-side and every send fails server-side. If
    // the key ever changes, drop the stale one before subscribing.
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      const sameKey = existing.options?.applicationServerKey
        && new Uint8Array(existing.options.applicationServerKey).every((b, i) => b === appKey[i]);
      if (sameKey) return await persist(existing);
      await existing.unsubscribe();
    }

    const sub = await reg.pushManager.subscribe({
      // Required by Chrome. A silent push is grounds for revoking the
      // permission entirely, so the SW always calls showNotification().
      userVisibleOnly: true,
      applicationServerKey: appKey,
    });
    return await persist(sub);
  } catch (e) {
    console.warn('[webpush] enable failed:', e?.message || e);
    return false;
  }
}

export async function disableWebPush() {
  if (!webPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    // Delete server-side too. Leaving the row means we keep sending to a dead
    // endpoint until it 410s — noise, and it delays nothing useful.
    const { error } = await supabase.from('web_push_subscriptions').delete().eq('endpoint', endpoint);
    if (error) console.warn('[webpush] delete failed:', error.message);
  } catch (e) {
    console.warn('[webpush] disable failed:', e?.message || e);
  }
}

/**
 * Re-assert an existing subscription on startup.
 *
 * ⚠️ Safari does not fire `pushsubscriptionchange` reliably, and browsers
 * rotate endpoints on their own schedule. Without this, a subscription that
 * silently changed leaves a stale row and the user stops receiving anything,
 * with no error anywhere. Cheap, idempotent, and only runs when permission is
 * already granted — it never prompts.
 */
export async function refreshWebPushSubscription() {
  if (!webPushSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await persist(sub);
    else await enableWebPush(); // permission is granted, so this cannot prompt
  } catch { /* best effort */ }
}
