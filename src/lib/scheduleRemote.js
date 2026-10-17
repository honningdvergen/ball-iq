// Transfer Trail and Mystery Player: the frozen answer logs, fetched from the
// site by an installed app. The same door Daily 7 got on 16 Oct 2026
// (lib/dailyRemote.js); read that file's header for why it is built this way.
//
// ⚠️ THE PROBLEM. Every build carries its own copy of the Trail log
// (TRAIL_ANSWER_LOG in lib/trail.js) and the Mystery schedule
// (data/mysterySchedule.json). The website is rebuilt on every push; an
// installed app keeps the copy it was built with. So whenever either log's
// future is re-planned (the Mystery future was, 14 Oct 2026, which is why
// builds before 1.8.0 (149) already serve different Mystery answers from the
// website), the website and the phones disagree on the day's answer, and
// "everyone gets the same player today" breaks until the phone updates.
//
// THE DOOR. The site serves the SAME log the build bundles, plus a version and
// the served horizon (public/data/trail.json and public/data/mystery.json,
// written by scripts/lib/schedule-remote.mjs from the generators' own runs:
// gen-mystery-schedule.mjs, rekey-mystery-repeats.mjs, trail-freeze.mjs, and
// gen-schedule-remote.mjs after a hand edit of the Trail log). An installed
// app fetches it, checks it, keeps it and plays from it. The bundled copy is
// always the fallback: offline, a failed fetch or a file that fails a check
// leave the app exactly as it was.
//
// ⚠️ WHAT THIS CANNOT FIX: a build cut before this file existed has no way to
// ask. Those builds (and so every build before 1.8.0 (149) for Mystery) serve
// their own copy until the player updates.
//
// WHAT IS CHECKED (the served-days guard):
//   - the shape: a version, the anchor day, and a well-formed entry per day
//   - ⚠️ THE DAYS THE BUILD KNEW AS SERVED NEVER MOVE. The generator records
//     how many leading days may have been served when it wrote the log
//     (`served`: everything through tomorrow, and for the Trail at least the
//     days frozen in tests/unit/trail-schedule.test.js), and refuses to move
//     them. A fetched file that differs from the build's own copy on any of
//     those days is a rollback or a mistake, and is refused.
//   - ⚠️ AND THE DAYS A KEPT FILE CALLED SERVED NEVER MOVE EITHER. Daily 7
//     compares a fetched file with the bundle only. Here it is also compared
//     with the file this build already kept: once a phone has played from the
//     site's copy, a later file must agree with that copy on every day it
//     called served, and may not call fewer days served. So a site rolled back
//     to an older deploy cannot rewrite days the phone has already played.
//   - it is at least as long as the bundled (and the kept) copy.
// An entry the build cannot play (a Trail career or a Mystery player added
// after the build) is not refused: the screen falls back to the bundled
// answer for that one day (trailPlayerForDate, mysteryAnswerIds).
//
// Only an installed app fetches (App.jsx, the same moments as Daily 7 and
// Top 10). Nothing is ever kept on the website, so there the readers below
// return the bundled answer: the website's own bundle is the newest log.
//
// ⚠️ KEEP THIS OFF HOME'S EAGER PATH (scripts/audit-home-budget.mjs). App.jsx
// loads it with import(); the two game screens import it, and they are lazy.
import { TRAIL_ANSWER_LOG, TRAIL_ANCHOR_DAY, getTrailAnswerForDayIndex, getTrailDayIndex } from './trail.js';
import { MYSTERY_ANCHOR_DAY, answerIdForDay } from './mysteryPlayer.js';
import MYSTERY_SCHEDULE from '../data/mysterySchedule.json';
import SERVED from '../data/scheduleServed.json';
import { makeDoor } from './scheduleDoor.js';
import { refreshFootleLog } from './wordle.js';

// ── Transfer Trail ────────────────────────────────────────────────────────────
export const TRAIL_REMOTE_URL = 'https://balliq.app/data/trail.json';
const TRAIL_BUNDLED = { anchor: TRAIL_ANCHOR_DAY, served: SERVED.trail, days: TRAIL_ANSWER_LOG };
const trail = makeDoor({ name: 'trail', url: TRAIL_REMOTE_URL, bundled: TRAIL_BUNDLED, entry: /^[A-Z0-9_]{1,40}$/ });
export const TRAIL_BUILD = trail.BUILD;
export const acceptRemoteTrail = trail.accept;
export const cachedTrailLog = trail.cached;
export const askedSiteForTrail = trail.asked;
/** 'updated' | 'same' | 'fresh' (asked recently) | 'rejected' | 'failed'. Never throws. */
export const refreshTrailLog = trail.refresh;

/**
 * The Trail player for `date`: from the kept site copy when there is one and
 * this build knows that career, otherwise `fallback` (the bundled answer the
 * caller already resolved).
 */
export function trailPlayerForDate(date, fallback, storage) {
  try {
    const live = cachedTrailLog(storage);
    if (!live) return fallback;
    return getTrailAnswerForDayIndex(getTrailDayIndex(date), live.days) || fallback;
  } catch { return fallback; }
}

// ── Mystery Player ────────────────────────────────────────────────────────────
export const MYSTERY_REMOTE_URL = 'https://balliq.app/data/mystery.json';
const MYSTERY_BUNDLED = { anchor: MYSTERY_ANCHOR_DAY, served: SERVED.mystery, days: MYSTERY_SCHEDULE };
const mystery = makeDoor({ name: 'mystery', url: MYSTERY_REMOTE_URL, bundled: MYSTERY_BUNDLED, entry: /^Q[1-9][0-9]{0,11}$/ });
export const MYSTERY_BUILD = mystery.BUILD;
export const acceptRemoteMystery = mystery.accept;
export const cachedMysterySchedule = mystery.cached;
export const askedSiteForMystery = mystery.asked;
/** 'updated' | 'same' | 'fresh' (asked recently) | 'rejected' | 'failed'. Never throws. */
export const refreshMysterySchedule = mystery.refresh;

/**
 * The day's answer ids, best first: the kept site copy's, then the bundled
 * one if it differs. The screen plays the first one its pool holds, so a
 * player added after this build falls back to the bundled answer that day.
 */
export function mysteryAnswerIds(dayIndex, storage) {
  const bundledId = answerIdForDay(MYSTERY_SCHEDULE, dayIndex);
  let liveId = null;
  try { const live = cachedMysterySchedule(storage); if (live) liveId = answerIdForDay(live.days, dayIndex); } catch { liveId = null; }
  return [...new Set([liveId, bundledId].filter(Boolean))];
}

/** All three doors at once (App.jsx: a moment after start and on every resume).
 * Footle's door lives in lib/wordle.js (Home reads it); this only asks it. */
export function refreshSchedules() {
  return Promise.all([refreshTrailLog(), refreshMysterySchedule(), refreshFootleLog()])
    .then(([trail, mystery, footle]) => ({ trail, mystery, footle }));
}
