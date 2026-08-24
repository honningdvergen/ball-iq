/**
 * The signup → first-play funnel, and ONLY the parts that are not already
 * derivable from the database.
 *
 * ⚠️ WHY THIS EXISTS. Measured 2026-08-24: 36.2% of accounts (79 of 218) have
 * never played a single game, and it is not improving — 33.9% of the last 30
 * days' signups are in the same state. Meanwhile, of the 131 who DID play, only
 * 15.3% played once and vanished; the rest average 9.7 plays and one is at 77.
 *
 * So retention is not the problem. It is good. A third of the water never
 * reaches the bucket. That inverts the "leaky bucket, retention first" thesis
 * this project had been carrying, and every person converted past the first
 * game is worth ~9.7 plays at 85% return odds.
 *
 * ⚠️ WHAT THIS DELIBERATELY DOES NOT MEASURE. Counts, provider splits, retention
 * curves and never-played rates are ALL derivable today from profiles, scores,
 * user_game_state and auth.users — a SQL query answered every one of those
 * questions before a line of this file existed. Instrumenting them again would
 * add a second, weaker source of truth that can disagree with the first.
 *
 * What the database cannot say is WHERE SOMEBODY STOPPED: whether they met the
 * mandatory username wall, whether they ever reached Home, whether they opened
 * a game and abandoned it. That is the whole remit here.
 *
 * ⚠️ EVERY STEP FIRES WHILE SIGNED IN, which is the point. `record_funnel_event`
 * records auth.uid() server-side, and today 907 of 908 `first-game-started`
 * rows have a NULL user_id — the existing funnel is effectively anonymous and
 * cannot be joined to an account, which is exactly why those 79 people are
 * invisible. A step recorded while signed out is a step we cannot attribute.
 *
 * ⚠️ NATIVE SENDS NOTHING IDENTIFYING. loopEvent already strips the visitor id,
 * the account id and all meta on native (privacy §4 / the store declarations),
 * so on native these events degrade to anonymous counts by design. They still
 * tell us how many people reach each step; they cannot tell us who.
 */

import { safeSetItem } from '../safeStorage.js';

const KEY = 'biq_acct_funnel';

/**
 * Steps, in order. Kept as a list so a reader can see the whole journey in one
 * place and so `stepIndex` can order them without a second lookup table.
 */
export const ACCT_STEPS = [
  'acct-session',      // signed in and the app booted
  'acct-username',     // cleared the mandatory username wall
  'acct-home',         // reached Home — the app is usable from here
  'acct-first-play',   // opened their first game
  'acct-first-finish', // finished it
];

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

/**
 * Fire `step` at most once per account, per device.
 *
 * Per DEVICE, not globally: localStorage is all we have, and a second device is
 * a genuinely different journey worth seeing rather than a duplicate to
 * suppress. The row carries the account id server-side, so the two are
 * distinguishable after the fact.
 *
 * Returns true if it fired, so callers can avoid extra work behind it.
 */
export function markAcctStep(userId, step, emit, meta) {
  if (!userId || !step || typeof emit !== 'function') return false;
  try {
    const all = read();
    const seen = all[userId] || {};
    if (seen[step]) return false;
    seen[step] = 1;
    // Only ever keep the CURRENT account. This is funnel bookkeeping, not user
    // data, and an unbounded map keyed by every account that ever signed in on
    // a shared device would grow without limit.
    safeSetItem(KEY, JSON.stringify({ [userId]: seen }));
    emit(step, meta);
    return true;
  } catch { return false; }
}

/** Test seam + a way to re-walk the funnel when QA'ing it. */
export function resetAcctFunnel() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

/** Which steps this device has already recorded for `userId`. */
export function acctStepsSeen(userId) {
  if (!userId) return [];
  const seen = read()[userId] || {};
  return ACCT_STEPS.filter((s) => seen[s]);
}
