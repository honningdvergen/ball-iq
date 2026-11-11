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
