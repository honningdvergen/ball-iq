// Pure date utilities shared between App.jsx and screen modules.
// Kept tiny + dependency-free so any caller can import without pulling
// in App.jsx-resident constants.

const DAY_MS = 24 * 60 * 60 * 1000;

export function dateToYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function keyForDate(date) {
  return `biq_daily_${dateToYMD(date)}`;
}

export function dayIndexForDate(date) {
  // Use UTC midnight of the local date so the seed is stable across timezones
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}
