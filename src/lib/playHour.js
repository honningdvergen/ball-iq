// When does THIS player play? The reminder fires at the hour they habitually
// finish a daily, not at an arbitrary 7pm (Duolingo's model). We keep the local
// hour of the last 7 completions and take the median, clamped to 8–22 so a
// midnight player is nudged at 22:00 rather than at 00:00.
const KEY = 'biq_play_hours';
export const DEFAULT_REMINDER_HOUR = 19;
const MIN_H = 8, MAX_H = 22, KEEP = 7;

function read() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.filter((h) => Number.isInteger(h) && h >= 0 && h < 24) : []; }
  catch { return []; }
}

// Call once per completed daily (not on archive plays, not on re-opens).
export function noteCompletionHour(now = new Date()) {
  try {
    const a = read(); a.push(now.getHours());
    localStorage.setItem(KEY, JSON.stringify(a.slice(-KEEP)));
  } catch { /* private mode */ }
}

export function getReminderHour() {
  const a = read();
  if (a.length === 0) return DEFAULT_REMINDER_HOUR;
  const s = a.slice().sort((x, y) => x - y);
  const med = s[Math.floor((s.length - 1) / 2)];
  return Math.max(MIN_H, Math.min(MAX_H, med));
}

export function reminderHourLabel(h = getReminderHour()) {
  return `${String(h).padStart(2, '0')}:00`;
}
