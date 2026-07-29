// 5-star lever — the native iOS "Rate ★★★★★" sheet (SKStoreReviewController via
// @capacitor-community/in-app-review), fired at a genuinely happy moment so we
// catch users while they're enjoying the app. iOS itself rate-limits the native
// prompt (~3 shows/year/user) and silently no-ops when it won't show, so we gate
// locally to avoid spending that allowance on low-value moments.

import { Capacitor } from '@capacitor/core';
import { InAppReview } from '@capacitor-community/in-app-review';

const KEY_LAST = 'biq_review_asked_at';
const KEY_COUNT = 'biq_review_asked_count';
const MIN_DAYS_BETWEEN = 45;   // never nag — at most every ~6 weeks

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

// Best-effort request for the native review sheet. Returns true if we asked iOS
// to show it (iOS still decides whether to actually render). Native-only.
export async function maybeRequestReview() {
  try {
    if (!Capacitor.isNativePlatform()) return false;
    const count = parseInt(localStorage.getItem(KEY_COUNT) || '0', 10) || 0;
    if (count >= MAX_LIFETIME) return false;
    const last = parseInt(localStorage.getItem(KEY_LAST) || '0', 10) || 0;
    if (last && (Date.now() - last) < MIN_DAYS_BETWEEN * 86400000) return false;
    // Stamp BEFORE the call so a throw/no-op still counts toward the cooldown.
    localStorage.setItem(KEY_LAST, String(Date.now()));
    localStorage.setItem(KEY_COUNT, String(count + 1));
    await InAppReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
