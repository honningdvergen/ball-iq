// ─── THE RETURN COUNTER (8 Nov 2026) ──────────────────────────────────────────
// The 7 Nov health report graded retention "unmeasurable where it matters":
// ninety percent of play is in the app, and the app sends no identifier by
// design (privacy policy; App Store label). This answers "do people come
// back?" without one: a COHORT counter, not a user counter (Tide HQ's pattern).
//
//   · The phone remembers the DAY it first opened Ball IQ (biq_install_day).
//     That day never leaves the phone.
//   · At most once per calendar day it sends one event, "app-day", carrying
//     only: the ISO week of that first day ("2026-W45"), how many days ago it
//     was as a coarse bucket (0, 1, 2-3, 4-7, 8-14, 15-30, 31+), and whether
//     the phone is in a mates' league (0/1).
//   · Server-side that is a count per (week, bucket): the classic day-1,
//     day-7 and day-30 curves, with no way to follow a person, because there
//     is no key to follow them by.
//
// Existing installs: the first day is taken from the earliest dated daily the
// phone has stored (biq_trail_2026-10-03 and friends). A phone that has
// played but kept no dated history reports week "pre" (before the counter),
// never as a new install.
//
// Read it with: select meta->>'w' as week, meta->>'b' as bucket, count(*)
//   from funnel_events where event = 'app-day' group by 1, 2 order by 1, 2;

export const INSTALL_KEY = 'biq_install_day';
export const SENT_KEY = 'biq_app_day_sent';
export const BUCKETS = ['0', '1', '2-3', '4-7', '8-14', '15-30', '31+'];
const DAY_RE = /^biq_(?:trail|daily|wordle|mystery|top10)_(\d{4}-\d{2}-\d{2})$/;
const FIRST_PLAUSIBLE = '2026-06-01';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function bucketFor(days) {
  if (!(days >= 0)) return '0';
  if (days === 0) return '0';
  if (days === 1) return '1';
  if (days <= 3) return '2-3';
  if (days <= 7) return '4-7';
  if (days <= 14) return '8-14';
  if (days <= 30) return '15-30';
  return '31+';
}

/** ISO 8601 week of a local calendar day given as YYYY-MM-DD: "2026-W45". */
export function isoWeek(day) {
  const [y, m, d] = day.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const daysBetween = (a, b) => {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
};

function earliestPlayedDay(ls) {
  let best = null;
  for (let i = 0; i < ls.length; i++) {
    const m = DAY_RE.exec(ls.key(i) || '');
    if (m && m[1] >= FIRST_PLAUSIBLE && (!best || m[1] < best)) best = m[1];
  }
  return best;
}

/**
 * The phone's first day, set once. Returns "pre" for a phone that has played
 * before the counter existed but kept no dated history.
 */
export function installDay(today, ls) {
  const kept = ls.getItem(INSTALL_KEY);
  if (kept) return kept;
  const todayYmd = ymd(today);
  const earliest = earliestPlayedDay(ls);
  const playedBefore = !!ls.getItem('biq_first_game_played') || !!ls.getItem('biq_onboarded');
  const day = earliest && earliest <= todayYmd ? earliest : playedBefore ? 'pre' : todayYmd;
  ls.setItem(INSTALL_KEY, day);
  return day;
}

/**
 * Today's event, or null when today's has already been sent. Marks the day as
 * sent: call it only when about to send.
 */
export function appDayEvent(today = new Date(), ls = globalThis.localStorage) {
  try {
    const todayYmd = ymd(today);
    if (ls.getItem(SENT_KEY) === todayYmd) return null;
    const first = installDay(today, ls);
    const w = first === 'pre' ? 'pre' : isoWeek(first);
    const b = first === 'pre' ? '31+' : bucketFor(daysBetween(first, todayYmd));
    const lg = ls.getItem('biq_league_member') === '1' ? '1' : '0';
    ls.setItem(SENT_KEY, todayYmd);
    return { name: 'app-day', meta: { w, b, lg } };
  } catch {
    return null;
  }
}

/**
 * How many different days this phone has played a daily (from the dated
 * daily keys). The rating ask uses it: ask people who come back, not people
 * on their first go (8 Nov 2026).
 */
export function playDays(ls = globalThis.localStorage) {
  try {
    const days = new Set();
    for (let i = 0; i < ls.length; i++) { const m = DAY_RE.exec(ls.key(i) || ''); if (m) days.add(m[1]); }
    return days.size;
  } catch { return 0; }
}

/** The only shape the native path may send for app-day (App.jsx nativeRateMeta). */
export function cleanAppDayMeta(meta) {
  const out = {};
  if (!meta) return out;
  if (typeof meta.w === 'string' && (/^\d{4}-W\d{2}$/.test(meta.w) || meta.w === 'pre')) out.w = meta.w;
  if (BUCKETS.includes(meta.b)) out.b = meta.b;
  if (meta.lg === '0' || meta.lg === '1') out.lg = meta.lg;
  return out;
}
