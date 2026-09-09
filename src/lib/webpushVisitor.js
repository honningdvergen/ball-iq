// Web push for a SIGNED-OUT browser on a static daily page (2026-09-09).
//
// The app's webpush.js persists by user id through the Supabase client; a
// static page has neither. This talks to two anon RPCs over fetch with the
// publishable key (the same way marketingEvent.js and the .bq engine do), keyed
// by the visitor id the page already writes to daily_results (biq_vid), and
// registers /sw.js itself — the generated pages never register it, only the
// app shell does — but only on the tap, never on load.
//
// States mirror useLocalNotifications' resultsRemindState so DailyDone needs
// no new branch: 'off' | 'on' | 'blocked' | 'unsupported'.
import { visitorId } from './dailyResults.js';
import { getReminderHour } from './playHour.js';

const URL_ = 'https://blcisypmngimqkwxrrdm.supabase.co';
const KEY_ = (import.meta.env.VITE_SUPABASE_KEY || '').trim();
const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();
const ON_KEY = 'biq_web_remind_endpoint';

function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function visitorPushSupported() {
  try {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
      && 'PushManager' in window && VAPID_PUBLIC_KEY.length > 0 && KEY_.length > 0 && !!visitorId();
  } catch { return false; }
}

export function visitorRemindState() {
  if (!visitorPushSupported()) return 'unsupported';
  try {
    if (Notification.permission === 'denied') return 'blocked';
    if (Notification.permission === 'granted' && localStorage.getItem(ON_KEY)) return 'on';
  } catch { /* fall through */ }
  return 'off';
}

async function rpc(name, body) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${name}`, {
    method: 'POST', keepalive: true,
    headers: { 'content-type': 'application/json', apikey: KEY_, authorization: `Bearer ${KEY_}` },
    body: JSON.stringify(body),
  });
  return r.ok;
}

/** Ask, subscribe, persist. Resolves to the new state. Call from a user gesture. */
export async function enableVisitorPush() {
  if (!visitorPushSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';
    const reg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.register('/sw.js'));
    await navigator.serviceWorker.ready;
    const appKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      const k = sub.options?.applicationServerKey;
      const same = k && new Uint8Array(k).every((b, i) => b === appKey[i]);
      if (!same) { await sub.unsubscribe(); sub = null; }
    }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
    const json = sub.toJSON();
    const ok = await rpc('subscribe_web_push', {
      p_visitor: visitorId(), p_subscription: json, p_endpoint: json.endpoint,
      p_tz: -new Date().getTimezoneOffset(), p_hour: getReminderHour(),
    });
    if (!ok) return 'off';
    try { localStorage.setItem(ON_KEY, json.endpoint); } catch { /* ignore */ }
    return 'on';
  } catch (e) {
    console.warn('[webpush-visitor] enable failed:', e?.message || e);
    return 'off';
  }
}

export async function disableVisitorPush() {
  try {
    const endpoint = localStorage.getItem(ON_KEY);
    localStorage.removeItem(ON_KEY);
    if (endpoint) await rpc('unsubscribe_web_push', { p_endpoint: endpoint });
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch { /* ignore */ }
  return 'off';
}
