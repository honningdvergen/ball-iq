// 5-star lever — the native iOS "Rate ★★★★★" sheet (SKStoreReviewController via
// @capacitor-community/in-app-review), fired at a genuinely happy moment so we
// catch users while they're enjoying the app. iOS itself rate-limits the native
// prompt (~3 shows/year/user) and silently no-ops when it won't show, so we gate
// locally to avoid spending that allowance on low-value moments.

import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';

const KEY_LAST = 'biq_review_asked_at';
const KEY_COUNT = 'biq_review_asked_count';
// 14, not 45 (2026-08-20, reviews push): Apple enforces its own ~3-shows/
// year budget server-side and silently no-ops the rest — our local cooldown
// only decides how often we ENTER the lottery, not how often users see it.
// At 45 days a user gave us ~8 lottery tickets a year; at 14 they give ~26,
// and Apple still caps what renders. The number that must stay conservative
// is the WEB prompt's (below), because that one always renders.
const MIN_DAYS_BETWEEN = 14;

// ⚠️ THIS NUMBER USED TO BE 4, AND THAT WAS COSTING US RATINGS.
//
// InAppReview.requestReview() resolves the same way whether iOS rendered the
// sheet or silently declined to — the API gives back no signal at all. iOS
// declines often (its own 3-per-365-days budget, "In-App Ratings & Reviews"
// switched off in Settings, too soon after the last one). We stamp the counter
// BEFORE the call, which is right for the cooldown but was fatal against a hard
// lifetime cap: four invisible no-ops and we would never ask that user again,
// for the life of the install. The most engaged players — the ones who'd give
// five stars — were the most likely to burn all four on nothing.
//
// So the ceiling is now a sanity backstop, not a policy. The real limiter is
// Apple's, it is enforced on their side, and it cannot be spammed past.
const MAX_LIFETIME = 24;

const KEY_BAD = 'biq_review_bad_at';
const BAD_MOMENT_COOLDOWN_H = 24;

// Sentiment suppression (review panel, 2026-08-19): never spend a rating ask
// on a session where something just went wrong. A player who reported a bad
// question or hit an error boundary is the one predicted 1-star source with
// the prompt as their nearest outlet — route that energy to feedback instead,
// and simply skip the ask for a day. Callers: the question-report flow and the
// tab error boundary.
export function markBadReviewMoment() {
  try { localStorage.setItem(KEY_BAD, String(Date.now())); } catch {}
}

/**
 * Undo a bad-moment mark that turned out not to be one.
 *
 * ⚠️ WHY THIS EXISTS RATHER THAN A CONDITION AT THE CALL SITE. reportQuestion()
 * marks a bad moment the instant the report button is tapped — BEFORE the
 * reason sheet opens — because the tap itself is the signal and we must never
 * make a second tap the price of being heard. That is right for four of the
 * five reasons.
 *
 * It is wrong for "Too easy — gives itself away". That is not a complaint about
 * quality, it is a confident expert telling us the bank is beneath them, and
 * scouting report #4 found it is the shape MORE THAN HALF our reporters have:
 * 16 of 30 reports carrying a pick came from someone who answered CORRECTLY.
 * Suppressing the ask for them mutes exactly the players most likely to give
 * five stars.
 *
 * ⚠️ Deliberately NOT "move the mark into sendQuestionReport and gate it on
 * reason" — the panel suggested that and the critic caught it: reason is null
 * on skip and on backdrop/Escape dismiss, so that version would have switched
 * sentiment suppression OFF for most reports. Mark first, clear only on the one
 * reason we can prove is a compliment.
 */
export function clearBadReviewMoment() {
  try { localStorage.removeItem(KEY_BAD); } catch {}
}

/**
 * Why a native ask would not show — WITHOUT spending anything.
 *
 * ⚠️ EXISTS SO THE FUNNEL CANNOT LIE. The call sites logged
 * `rate-prompt-shown` and THEN called maybeRequestReview(), which returns
 * false on a suppressed ask without a word. So every ask killed by a bad
 * moment, the cooldown or the lifetime cap was recorded as shown — and the
 * suppression levers we have been adding all week (a report, a crash, a lost
 * Footle, a rage-quit) are exactly the things that would have inflated it.
 * The instrument would have looked healthiest precisely where it was most
 * wrong.
 *
 * Read-only and side-effect free: safe to call before deciding what to log.
 * `maybeRequestReview` delegates to it so there is ONE implementation of the
 * policy — two copies would drift, and the drift would be invisible.
 */
export function nativeAskBlockedReason() {
  try {
    if (!Capacitor.isNativePlatform()) return 'not-native';
    const bad = parseInt(localStorage.getItem(KEY_BAD) || '0', 10) || 0;
    if (bad && (Date.now() - bad) < BAD_MOMENT_COOLDOWN_H * 3600000) return 'bad-moment';
    const count = parseInt(localStorage.getItem(KEY_COUNT) || '0', 10) || 0;
    if (count >= MAX_LIFETIME) return 'lifetime-cap';
    const last = parseInt(localStorage.getItem(KEY_LAST) || '0', 10) || 0;
    if (last && (Date.now() - last) < MIN_DAYS_BETWEEN * 86400000) return 'cooldown';
    return null;
  } catch { return 'storage-error'; }
}

// Best-effort request for the native review sheet. Returns true if we asked iOS
// to show it (iOS still decides whether to actually render). Native-only.
export async function maybeRequestReview() {
  try {
    if (nativeAskBlockedReason()) return false;
    const count = parseInt(localStorage.getItem(KEY_COUNT) || '0', 10) || 0;
    // Stamp BEFORE the call so a throw/no-op still counts toward the cooldown.
    localStorage.setItem(KEY_LAST, String(Date.now()));
    localStorage.setItem(KEY_COUNT, String(count + 1));
    await InAppReview.requestReview();
    return true;
  } catch {
    return false;
  }
}

// ── Web rate prompt policy ────────────────────────────────────────────────
// The web ask renders every time (no OS lottery), so IT needs the manners
// the native path outsources to Apple: at most 3 lifetime shows, 60 days
// apart, never in a session where something just went wrong (same KEY_BAD
// the native ask honours). Replaces the old biq_rate_shown boolean, which
// was once-per-device-EVER and gated on a 9/10 Classic run — a bar most web
// players structurally never crossed (the dailies are where the joy is, and
// Classic is the #3-4 mode). Legacy "1" migrates as one spent show.
const KEY_WEB_COUNT = 'biq_rate_web_count';
const KEY_WEB_LAST = 'biq_rate_web_at';
const WEB_MAX_LIFETIME = 3;
const WEB_MIN_DAYS_BETWEEN = 60;

function webShowCount() {
  try {
    const c = parseInt(localStorage.getItem(KEY_WEB_COUNT) || '0', 10) || 0;
    if (c > 0) return c;
    return localStorage.getItem('biq_rate_shown') !== null ? 1 : 0;
  } catch { return 0; }
}

export function webRatePromptEligible() {
  try {
    if (Capacitor.isNativePlatform()) return false;
    const bad = parseInt(localStorage.getItem(KEY_BAD) || '0', 10) || 0;
    if (bad && (Date.now() - bad) < BAD_MOMENT_COOLDOWN_H * 3600000) return false;
    if (webShowCount() >= WEB_MAX_LIFETIME) return false;
    const last = parseInt(localStorage.getItem(KEY_WEB_LAST) || '0', 10) || 0;
    if (last && (Date.now() - last) < WEB_MIN_DAYS_BETWEEN * 86400000) return false;
    return true;
  } catch { return false; }
}

export function markWebRatePromptShown() {
  try {
    localStorage.setItem(KEY_WEB_COUNT, String(webShowCount() + 1));
    localStorage.setItem(KEY_WEB_LAST, String(Date.now()));
  } catch {}
}
