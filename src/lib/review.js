// 5-star lever — the native iOS "Rate ★★★★★" sheet (SKStoreReviewController via
// @capacitor-community/in-app-review), fired at a genuinely happy moment so we
// catch users while they're enjoying the app. iOS itself rate-limits the native
// prompt (~3 shows/year/user) and silently no-ops when it won't show, so we gate
// locally to avoid spending that allowance on low-value moments.

import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';
import { appStoreUrl, PLAY_STORE_URL } from './links.js';

const KEY_LAST = 'biq_review_asked_at';
const KEY_COUNT = 'biq_review_asked_count';
// 14, not 45 (2026-08-20, reviews push): Apple enforces its own ~3-shows/
// year budget server-side and silently no-ops the rest — our local cooldown
// only decides how often we ENTER the lottery, not how often users see it.
// At 45 days a user gave us ~8 lottery tickets a year; at 14 they give ~26,
// and Apple still caps what renders. The number that must stay conservative
// is the WEB prompt's (below), because that one always renders.
const MIN_DAYS_BETWEEN = 14;
// ⚠️ THE FIRST TWO GAPS ARE SHORT ON PURPOSE (22 Nov 2026). Read 8 to 21 Nov:
// 92 asks sent to iOS, 446 happy moments turned away by this cooldown, and
// the UK store stood at eight ratings. Most new phones are gone within a
// fortnight (about one in five comes back the next day), so a second ticket
// at day 15 mostly went to nobody. The second ask may now come three days
// after the first and the third a week after that, while the player is still
// here. Apple's own limit (three sheets in 365 days, enforced on its side) is
// untouched and still decides what anyone sees; from the fourth ask on, the
// gap is the old fourteen days.
const GAP_DAYS_AFTER = [0, 3, 7];
/** Days that must pass before the next ask, given how many have been made. */
export function reviewGapDays(asked) {
  const n = Number.isFinite(asked) && asked > 0 ? Math.floor(asked) : 0;
  return n < GAP_DAYS_AFTER.length ? GAP_DAYS_AFTER[n] : MIN_DAYS_BETWEEN;
}

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
// ⚠️ SIX HOURS, NOT A DAY (16 Nov 2026). The point is "never in a session
// where something just went wrong". At 24 it also swallowed the NEXT day's
// good moment for anyone who plays at about the same time each day: lose
// Footle at 08:05, solve it at 08:00 tomorrow, and the ask was still blocked.
// And one mark (a lost Footle, a quit quiz, a bruising round) silenced all
// five triggers for the rest of that day and the next morning. Read 2 to 15
// Nov: 140 asks turned away as bad-moment against 83 shown. Six hours still
// covers the sitting it happened in and the rest of that evening.
const BAD_MOMENT_COOLDOWN_H = 6;

// Sentiment suppression (review panel, 2026-08-19): never spend a rating ask
// on a session where something just went wrong. A player who reported a bad
// question or hit an error boundary is the one predicted 1-star source with
// the prompt as their nearest outlet — route that energy to feedback instead,
// and simply skip the ask for the rest of that sitting (BAD_MOMENT_COOLDOWN_H).
// Callers: the question-report flow, the error boundaries, a lost Footle, a
// quit quiz and a bruising round.
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
    if (last && (Date.now() - last) < reviewGapDays(count) * 86400000) return 'cooldown';
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

// ── Rate links a player taps ──────────────────────────────────────────────
// The native sheet above is Apple's lottery: ~3 renders a year, no signal back.
// A link the player taps themselves is not part of that budget, and both stores
// allow it (what they forbid is a custom pop-up that asks for stars). So the
// store page is one tap away wherever a happy player already looks, and the
// lottery stays reserved for the moments it was built for.
//
// Store-specific on purpose: an Android player sent to the App Store cannot
// leave a review at all (the bug SettingsScreen's rateApp once had).
export function ratingStore() {
  try {
    const p = Capacitor.getPlatform?.();
    if (p === 'android') return 'play';
    if (p === 'ios') return 'app-store';
  } catch {}
  const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
  return /Android/i.test(ua) && !/Windows Phone/i.test(ua) ? 'play' : 'app-store';
}

export function openStoreRating() {
  const store = ratingStore();
  const url = store === 'play' ? PLAY_STORE_URL : `${appStoreUrl({ campaign: false })}?action=write-review`;
  try { window.open(url, '_blank'); } catch {}
  return store;
}

// Only someone with the app installed can rate it, so web players (most of
// the base) never see an in-page rate link: on the web it would be a request
// they cannot fulfil.
export function canRateInStore() {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}
