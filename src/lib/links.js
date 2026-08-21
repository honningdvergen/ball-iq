// Store links — single source of truth for every store CTA in src/.
// (Static HTML — index.html and scripts/gen-seo-pages.mjs — can't import
// this module and keeps its own copies; keep those in sync by hand.)

// Apple App Store numeric ID (App Store Connect → App Information → Apple ID).
// Drives the About "Rate" + "Share" deep links.
export const APP_STORE_ID = "6775975961";
// Country-coded canonical store URL. The country-less /app/id… form errors on
// desktop web (no local store to resolve); country-coded loads everywhere and
// Apple auto-redirects to the viewer's own storefront.
// ⚠️ Was hardcoded to /us/ with the slug "ball-iq-football-trivia" — a name
// the app no longer carries on either store. Apple routes by ID so the stale
// slug still resolves (measured: 200), but the STOREFRONT does not follow the
// viewer despite the note above claiming it does. So every GB, NO, FR and DE
// player tapping Rate or Get-the-app landed on the US storefront, which has
// zero ratings — the emptiest shelf we own, shown to the people most likely
// to be ready to rate.
// Now resolved per visitor. Falls back to /us/ when the region is unreadable,
// which is the old behaviour, so this can only improve on what was there.
const APPLE_STOREFRONTS = new Set(['us','gb','no','de','es','fr','it','br','tr','id','nl','se','dk','fi','ie','pt','pl','ca','au','mx','ar','in','za','be','at','ch','cz','gr','hu','ro','sa','ae']);
export function appStoreUrl() {
  let cc = 'us';
  try {
    const region = (new Intl.Locale(navigator.language).region || '').toLowerCase();
    if (APPLE_STOREFRONTS.has(region)) cc = region;
  } catch { /* older engines, or no navigator — keep us */ }
  return `https://apps.apple.com/${cc}/app/id${APP_STORE_ID}`;
}
// Kept for the handful of module-scope consumers that cannot call a function.
// Prefer appStoreUrl() anywhere a real visitor is tapping.
export const APP_STORE_URL = "https://apps.apple.com/us/app/id6775975961";
// Play package id is app.balliq (build.gradle applicationId) — NOT com.balliq.app;
// the reversed form 404s. Listing goes live when the closed test graduates.
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.balliq";
