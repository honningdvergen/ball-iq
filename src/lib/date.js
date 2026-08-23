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

// ── NEXT-PUZZLE COUNTDOWN ─────────────────────────────────────────────────────
// Shared by the Daily hub's "KO in Xh Ym" chip and every daily mode's result
// screen. Lived privately in DailyScreen until 2026-08-23, when Alex asked for
// the same thing on a solved Mystery Player: "we need a result screen here then
// until the next mystery player loads you know". Extracted rather than copied —
// a second implementation of a time calculation is how two surfaces start
// disagreeing about when tomorrow begins.
//
// ⚠️ LOCAL midnight, never UTC. dayIndexForDate and dateToYMD both key off the
// user's LOCAL date, so each player's puzzles roll at their own midnight. A UTC
// anchor misled UTC-negative users (New York at 19:00 saw "24h" when the real
// answer was 5h) and UTC-positive ones (Tokyo at 23:30 saw "9h 30m" against an
// actual 30m). Sprint #70 LL6.
export function msToNextLocalMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** "5h 12m" · "12m" · "soon". Deliberately coarse — a ticking second hand on a
 *  24-hour wait is noise, and it would re-render every second to say nothing. */
export function formatCountdown(ms) {
  if (ms <= 0) return 'soon';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
