// The Top 10 browser: every list a player may open by name, grouped so a fan
// finds their own club's lists first (Alex, 15 Oct 2026: "if people download
// the app and expect to find the lists they care about and not just play
// through a bunch of other lists that they don't really care about, that
// could be an issue").
//
// A list is open here when it is a CLUB list (a `club` slug) or a past daily,
// and NEVER while it is a daily still to come, club list or not: a list
// played early shows its answers ("Stuck? Show me the list"), and the daily
// would then be played with the answers known (review, 15 Oct 2026: Arsenal's
// top scorers was due as the daily five days later). A club list that is a
// coming daily is still LISTED under its club, locked, with its date, so a fan
// sees what is on the way. Club lists written for the browser are not
// scheduled, so they are open from the day they ship.
// A list played here is saved under `list_<id>` (Top10.jsx), never under a
// day, so it neither counts toward nor collides with the daily.
import { loadTop10Day } from './top10.js';

export const TOP10_CLUB_KEY = 'biq_top10_club';
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function myTop10Club() {
  try { const v = localStorage.getItem(TOP10_CLUB_KEY); return v && SLUG.test(v) ? v : null; } catch { return null; }
}
export function setMyTop10Club(slug) {
  try { if (slug) localStorage.setItem(TOP10_CLUB_KEY, slug); else localStorage.removeItem(TOP10_CLUB_KEY); } catch { /* private mode */ }
}

/**
 * @param data  the Top 10 data ({ log, lists })
 * @param todayNumber  today's Top 10 number (1-based), from getTop10Number()
 * @returns {{ clubs: Map<string, object[]>, past: object[] }}
 *   clubs: slug -> that club's lists, in the order they were written
 *   past:  the non-club lists whose daily has been played, newest first
 */
export function groupTop10Lists(data, todayNumber) {
  const lists = Object.values(data?.lists || {});
  const log = data?.log || [];
  // The day (1-based) each list is or was the daily, if it is scheduled.
  const dayOf = new Map();
  log.forEach((id, i) => { if (!dayOf.has(id)) dayOf.set(id, i + 1); });
  // A Map, not an object: a club slug from a fetched file is data, and
  // "__proto__" or "constructor" must not reach the prototype.
  const clubs = new Map();
  const past = [];
  for (const l of lists) {
    const day = dayOf.get(l.id);
    const coming = !!day && day >= todayNumber; // today's or a coming daily
    if (typeof l.club === 'string' && SLUG.test(l.club)) {
      if (!clubs.has(l.club)) clubs.set(l.club, []);
      clubs.get(l.club).push(coming ? { ...l, day, locked: true } : l);
    } else if (day && !coming) past.push({ ...l, day });
  }
  // Within a club, the lists you can play first, then the coming ones by date.
  for (const [k, v] of clubs) clubs.set(k, [...v.filter((l) => !l.locked), ...v.filter((l) => l.locked).sort((a, b) => a.day - b.day)]);
  past.sort((a, b) => b.day - a.day);
  return { clubs, past };
}

/** What a list's row says about this device's own play of it. */
export function listStatus(id) {
  const s = loadTop10Day(`list_${id}`);
  if (!s || s.id !== id) return { state: 'new' };
  if (s.status === 'done') return { state: 'done', score: s.score || 0 };
  return s.picks.length ? { state: 'open', score: s.score || 0 } : { state: 'new' };
}
