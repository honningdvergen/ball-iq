// Transfer Trail — the day, without the careers.
//
// Which day it is, the puzzle number, whether the Trail is live on a day, and
// the day as it was saved. That is all Home, the Daily tab, the website's
// front door and App.jsx ask of the Trail, and until 24 Nov 2026 they asked it
// of lib/trail.js, which put every career, the answer log, the positions and
// the alias tables (about 80 KB of source) on Home's eager JavaScript
// (scripts/audit-home-budget.mjs).
//
// ⚠️ KEEP THIS FILE SMALL, AND KEEP lib/trail.js OFF HOME'S PATH. Anything on
// Home's path imports from here, never from lib/trail.js
// (tests/unit/trail-off-home.test.js). lib/trail.js re-exports everything
// below, so the game screens and the scripts read it where they always did.
import { dateToYMD } from "./date.js";

// ── Puzzle number ─────────────────────────────────────────────────────────────
// Same day-index math as footleNumber.js.
//
// ⚠️ PROVISIONAL AGAIN — the mode is DARK. It was briefly pointed at 2026-07-29
// and reverted the same hour: Alex, on seeing the screen, "transfer trail is not
// ready and not intended to look like that". Verified in prod before reverting
// that `scores` held ZERO rows for game_mode='trail', so no puzzle number had
// ever been played or shared and the anchor was still free to move. That is the
// ONLY condition under which it may move — once a single grid is out in the
// world, the number is load-bearing and shifting it renumbers everyone's.
//
// Set this to the real launch day in the SAME commit that declares the screen
// ready. Until then getTrailAnswerForDayIndex returns null for every date
// before it, so Home shows no Trail row and the route sends you home.
export const DAY_MS = 24 * 60 * 60 * 1000;
// ⚠️ LIVE. Was 20697 (2026-09-01) and commented "PROVISIONAL, mode is dark" —
// a placeholder from when the engine shipped inert awaiting a career
// spot-check. That check is now done: all 44 careers verified 2026-08-03,
// which found and fixed one real defect (Courtois listed Chelsea BEFORE the
// Atletico loan, a club he had not played a minute for) and confirmed the two
// recent moves against sources (Kante to Fenerbahce, Feb 2026; Pogba to
// Monaco, Jun 2025).
//
// The placeholder outlived its reason and left a finished daily game dark for
// days while memory recorded it as "LIVE". If you ever set this ahead again,
// verify getTrailAnswer() returns a player on the day you ship.
export const TRAIL_ANCHOR_DAY = 20668; // days since epoch — Trail #1

export function getTrailDayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

export function getTrailNumber(date = new Date()) {
  return getTrailDayIndex(date) - TRAIL_ANCHOR_DAY + 1;
}

/**
 * Is there a Trail to play on this day? The same answer as
 * `!!getTrailAnswer(date)` in lib/trail.js, without the careers: the bundled
 * log is never empty, it wraps instead of running out, and it only names
 * careers that exist (tests/unit/trail-schedule.test.js), so the one thing
 * left to ask is whether the day is on or after the anchor.
 * tests/unit/trail-off-home.test.js holds the two to each other on every day
 * of the log and past its end.
 */
export function hasTrailOn(date = new Date()) {
  return getTrailDayIndex(date) >= TRAIL_ANCHOR_DAY;
}

/**
 * A day's stored Trail state, normalised to { status, used } — the same shape
 * Footle's history uses, so screens can treat all the daily modes alike.
 * Returns null when the day was never opened.
 *
 * Exported because THREE screens now need it (the Trail itself, the Daily tab,
 * the Home daily zone) and each hand-rolled read of `biq_trail_<ymd>` is a
 * chance for them to disagree about what "played" means.
 */
export function loadTrailDay(date = new Date()) {
  try {
    const raw = localStorage.getItem(`biq_trail_${dateToYMD(date)}`);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return { status: p?.status || null, used: Array.isArray(p?.attempts) ? p.attempts.length : 0 };
  } catch { return null; }
}
