// 1.1 Retention — local daily-reminder notifications (evening streak-saver).
//
// Strategy (decided 2026-06-25): one nudge at ~7pm local, ONLY if the user
// hasn't played today, cancelled the moment they do. We schedule a rolling
// 7-day window ahead so reminders keep firing even if the app isn't opened for
// a few days; each app open reschedules a fresh window. Copy is streak-agnostic
// (no day-count) because a notification scheduled days in advance can't know
// the live streak — and a stale "12-day streak" would read wrong.
//
// Native-only: @capacitor/local-notifications has a web implementation, but it
// can't fire while the page is closed, so a daily reminder is meaningless on
// web. We no-op everywhere except iOS/Android.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const REMINDER_HOUR = 19;   // 7pm local
const WINDOW_DAYS = 7;      // schedule a rolling week ahead
// Win-back tail: after the daily week goes quiet, a decaying set of nudges so
// a lapsed user is still reachable (previously the app went permanently silent
// after 7 days — the single biggest retention hole). Rescheduled — and thereby
// pushed out — on every app open, so an active user never sees these. iOS
// allows 64 pending local notifications; we use 12.
const WINBACK = [
  { off: 8,  body: 'Your streak misses you — 2 minutes gets it back 🔥' },
  { off: 11, body: "New Daily 7 and Footle drop every day — today's are waiting ⚽" },
  { off: 15, body: 'Club quizzes: 17 clubs, deep cuts only. Still know yours? 🛡️' },
  { off: 22, body: 'Your rivals are pulling ahead on the leaderboard 👀' },
  { off: 30, body: 'One quiz. Two minutes. See what you still remember ⚽' },
];
// Reminder ids are namespaced by day-offset from "today". Because we
// reschedule the whole window on every app open, "today" is always offset 0 —
// so cancelTodayReminder() can always target ID_BASE + 0.
const ID_BASE = 700000;

export function notificationsSupported() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

// Returns 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unsupported'.
export async function getNotifPermission() {
  if (!notificationsSupported()) return 'unsupported';
  try { return (await LocalNotifications.checkPermissions()).display; }
  catch { return 'unsupported'; }
}

// Fires the iOS system prompt (only effective the first time). Returns granted.
export async function requestNotifPermission() {
  if (!notificationsSupported()) return false;
  try { return (await LocalNotifications.requestPermissions()).display === 'granted'; }
  catch { return false; }
}

// 7pm local on today+offset, or null if that instant has already passed.
function atFutureLocal(offsetDays) {
  const now = new Date();
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, REMINDER_HOUR, 0, 0, 0);
  return at.getTime() > now.getTime() ? at : null;
}

// Daily-window copy rotates by weekday so a week of reminders never reads as
// the same string seven times (all streak-agnostic — a notification scheduled
// days ahead can't know the live count).
const DAILY_BODIES = [
  "Today's Footle & Daily 7 are still open — keep your streak going 🔥",
  "Two minutes, seven questions — today's Daily 7 is waiting ⚽",
  "Tonight's Footle is still unsolved. One good guess could do it 🧠",
  "Don't lose the streak — today's puzzles close at midnight 🔥",
  "Quick one before the day ends? Footle & the Daily 7 are open ⚽",
  "Your daily fix: Footle and the 7. Still time tonight 🎯",
  "Streak check — today's games are still open 🔥",
];

// (Re)schedule the rolling window. skipToday omits offset 0 — pass true when
// the user has already completed today's daily so we don't nag them tonight.
export async function scheduleReminderWindow({ skipToday = false } = {}) {
  if (!notificationsSupported()) return;
  try {
    if ((await getNotifPermission()) !== 'granted') return;
    await cancelAllReminders();
    const notifications = [];
    for (let off = skipToday ? 1 : 0; off < WINDOW_DAYS; off++) {
      const at = atFutureLocal(off);
      if (!at) continue;
      notifications.push({
        id: ID_BASE + off,
        title: 'Ball IQ',
        body: DAILY_BODIES[at.getDay() % DAILY_BODIES.length],
        schedule: { at, allowWhileIdle: true },
      });
    }
    for (const w of WINBACK) {
      const at = atFutureLocal(w.off);
      if (!at) continue;
      notifications.push({
        id: ID_BASE + w.off,
        title: 'Ball IQ',
        body: w.body,
        schedule: { at, allowWhileIdle: true },
      });
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch { /* non-fatal: reminders are best-effort */ }
}

// Tapping any reminder should land on the Daily tab (the notification's
// implicit CTA), not just the last-viewed screen. Returns an unsubscribe fn.
export function onReminderTap(cb) {
  if (!notificationsSupported()) return () => {};
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', () => {
    try { cb(); } catch { /* noop */ }
  });
  return () => { handle.then(h => h.remove()).catch(() => {}); };
}

// Cancel tonight's reminder — call when the user completes today's Footle/Daily 7.
export async function cancelTodayReminder() {
  if (!notificationsSupported()) return;
  try { await LocalNotifications.cancel({ notifications: [{ id: ID_BASE }] }); } catch { /* noop */ }
}

// Cancel the whole window + win-back tail (Settings → off, or before a
// reschedule). Clears a generous id range (covers the day-30 tail) so no
// stray reminder survives a window shift.
export async function cancelAllReminders() {
  if (!notificationsSupported()) return;
  try {
    const ids = [];
    for (let i = 0; i <= 31; i++) ids.push({ id: ID_BASE + i });
    await LocalNotifications.cancel({ notifications: ids });
  } catch { /* noop */ }
}
