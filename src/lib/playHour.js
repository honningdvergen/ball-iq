// When is the reminder? IN THE EVENING. Seven o'clock, or later for a player
// who habitually finishes later; never earlier.
//
// It used to follow the player's own hour anywhere from 08:00 to 22:00
// (Duolingo's model). Alex, 9 Oct 2026, after one landed on his phone at 13:00:
// "it just feels right to get the notification at the end of the day if you
// have forgotten about it, instead of kind of interrupting you mid-work or
// mid-school ... when you won't even finish it anyway." The server's records
// agreed with him: of 33 phones that had learned an hour, 15 had learned one
// before 19:00, four of them 08:00. A reminder is for the day someone forgot,
// and the evening is when that is known and when there is time to play. A
// morning player who has played gets nothing at seven; one who has not, does.
//
// What is kept from the old rule is the late end: the median local hour of the
// last 14 finishes, so someone who always plays at ten is not nudged at seven
// every evening before they would have played anyway. Fourteen, not seven: a
// habit is a fortnight, and one unusual week should not rewrite it.
const KEY = 'biq_play_hours';
export const DEFAULT_REMINDER_HOUR = 19;
const MIN_H = 19, MAX_H = 22, KEEP = 14;

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
