// The day streak, and the one rule for whether a stored streak is still alive.
//
// ⚠️ THIS EXISTS BECAUSE THE APP TOLD A 58-DAY PLAYER THEY HAD NONE.
// The streak ticks in exactly one place — completing a daily puzzle — and
// hydration was deliberately stopped from reading `login_streak`, on the
// grounds that "AppInner's tickLoginStreak useEffect calls the RPC after auth
// settles". THAT useEffect DOES NOT EXIST, and the same false comment was
// written into three files. So the only thing feeding the display was
// localStorage, and any device without it — a reinstall, a new phone, cleared
// data, a fresh simulator — rendered "0 day streak · play one puzzle to light
// it" while the server held {streak: 1, best: 58} and the History strip
// painted that player's real green squares directly beside it.
//
// Found by opening the app in the simulator on 2026-09-10 and reading two
// screens that disagreed.

/** Days since epoch in the USER'S timezone — the unit the streak is kept in. */
export function localDayNow(now = new Date()) {
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

/**
 * Banked streak freezes. Duplicated from tick_login_streak's guest branch and
 * from the RPC — one shield per 200 XP, capped at 3, minus those spent. The
 * cap is deliberate: an uncapped pile lets a high-XP player run an infinite
 * every-other-day "streak", which kills the loss aversion the streak is for.
 */
export function shieldsAvailable(xp, shieldsUsed) {
  return Math.min(3, Math.max(0, Math.floor((xp || 0) / 200) - (shieldsUsed || 0)));
}

/**
 * What a stored streak record is WORTH TODAY, for display only.
 *
 * A streak survives the day after it was last extended — you have all of today
 * to keep it — and one further day if a shield can freeze the gap. Beyond
 * that it is over and shows 0.
 *
 * ⚠️ DISPLAY ONLY. This never writes and never advances anything: opening the
 * app must not extend a streak, which is exactly why the fix here is a READ
 * and not a call to the tick. Playing is what ticks it.
 */
export function liveStreak(record, today = localDayNow(), shields = 0) {
  const streak = Number(record?.streak) || 0;
  if (streak <= 0) return 0;
  const lastDay = Number(record?.lastDay);
  if (!Number.isFinite(lastDay)) return 0;
  // lastDay ahead of today: a legacy UTC tick banked a later day. Trust it
  // rather than punishing the player for our own clock change.
  if (lastDay >= today - 1) return streak;
  if (lastDay === today - 2 && shields > 0) return streak;
  return 0;
}

/**
 * Does a signed-in player's day still need crediting to the account's streak?
 *
 * ⚠️ THE STREAK TICKS ONLY WHEN A DAILY IS FINISHED, AND THAT MISSED ONE CASE:
 * a daily finished BEFORE the account was there. A new player plays as a guest,
 * finishes a daily (the guest streak ticks locally), then signs in. Sign-in
 * replaces the local record with the account's, the finish event is long gone,
 * and nothing ever tells the server about today. History then read "0 day
 * streak - play one puzzle to light it" beside a lit TODAY square, the Home
 * flame disappeared, and a player who had already finished all four dailies
 * could not earn the day at all. Seen on the simulator on 10 Nov 2026, on a
 * new player's first evening, which is when people sign in.
 *
 * This is NOT ticking on open: it is true only when a daily was really
 * finished today on this device (or the account already holds today's score)
 * and the account's record has not counted today yet. The RPC stays the one
 * writer and is idempotent per local day.
 *
 * @param {object|null} record       the account's login_streak as hydrated ({streak, lastDay, best}) or null
 * @param {boolean}     playedToday  a daily was finished today
 * @param {number}      today        local day number (localDayNow())
 */
export function needsTodayCredit(record, playedToday, today = localDayNow()) {
  if (!playedToday) return false;
  const lastDay = Number(record?.lastDay);
  if (!Number.isFinite(lastDay)) return true;   // no record yet: today is the first day
  return lastDay < today;                        // today (or a legacy day ahead of it) is already counted
}

/**
 * DAYS THE SERVER NEVER HEARD ABOUT (23 Nov 2026). The streak is counted by
 * one call when a daily is finished. When that call failed (a tunnel, a
 * flaky connection late in the evening) the app logged a line to the console
 * and moved on: no report, no second try, nothing kept. The one retry was a
 * check on a later sign-in merge the SAME day, so an evening failure was a
 * missed day and the streak reset the next morning, for a player who had
 * played.
 *
 * A day that fails is written down here per account and sent again before
 * the next tick and at the next sign-in merge. The server takes a day up to
 * two back, so nothing older is kept. Order matters: an owed day must reach
 * the server BEFORE a later one, or the later tick resets the streak first.
 */
const OWED_KEY = 'biq_streak_owed';
const OWED_BACK = 2;

// ⚠️ THE SERVER MEASURES ITS TWO DAYS FROM ITS OWN DAY (UTC), NOT THE PHONE'S.
// A day outside that window is not refused: tick_login_streak quietly uses
// TODAY (UTC) instead. West of UTC in the evening the phone's day is a day
// behind the server's, so an owed day two back on the phone is three back
// there, and sending it would bank the server's today: a day ahead of the
// player, a reset streak, and today's own tick answered "already counted".
// (Caught in review before this shipped.) So a day must be inside BOTH.
const utcDayNow = () => Math.floor(Date.now() / 86400000);

export function owedStreakDays(uid, today = localDayNow(), storage = globalThis.localStorage, utcDay = utcDayNow()) {
  if (!uid) return [];
  try {
    const rec = JSON.parse(storage.getItem(OWED_KEY) || 'null');
    if (!rec || rec.uid !== uid || !Array.isArray(rec.days)) return [];
    return [...new Set(rec.days.filter((d) => Number.isInteger(d) && d <= today && d >= today - OWED_BACK && Math.abs(d - utcDay) <= OWED_BACK))].sort((a, b) => a - b);
  } catch { return []; }
}

function writeOwed(uid, days, storage) {
  try {
    if (days.length) storage.setItem(OWED_KEY, JSON.stringify({ uid, days }));
    else storage.removeItem(OWED_KEY);
  } catch { /* storage blocked: the day is tried again only this session */ }
}

/**
 * Send the owed days (oldest first), then `upTo` if given, through `tick`
 * (day -> Promise<{ data, error }>). Stops at the first failure, because a
 * later day sent past a missing one would reset the streak, and writes down
 * every day still unsent. Returns the last answer the server gave and the
 * error that stopped it, if any.
 */
export async function tickOwedStreak(tick, { uid, today = localDayNow(), upTo = null, storage = globalThis.localStorage, utcDay = utcDayNow() } = {}) {
  const want = owedStreakDays(uid, today, storage, utcDay);
  if (upTo != null && !want.includes(upTo)) want.push(upTo);
  want.sort((a, b) => a - b);
  let data = null;
  for (let i = 0; i < want.length; i++) {
    let res;
    try { res = await tick(want[i]); } catch (e) { res = { data: null, error: e }; }
    if (res?.error) {
      writeOwed(uid, want.slice(i), storage);
      return { data, error: res.error, sent: want.slice(0, i) };
    }
    data = res?.data ?? data;
  }
  writeOwed(uid, [], storage);
  return { data, error: null, sent: want };
}
