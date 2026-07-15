// Store links — single source of truth for every store CTA in src/.
// (Static HTML — index.html and scripts/gen-seo-pages.mjs — can't import
// this module and keeps its own copies; keep those in sync by hand.)

// Apple App Store numeric ID (App Store Connect → App Information → Apple ID).
// Drives the About "Rate" + "Share" deep links.
export const APP_STORE_ID = "6775975961";
// Country-coded canonical store URL. The country-less /app/id… form errors on
// desktop web (no local store to resolve); country-coded loads everywhere and
// Apple auto-redirects to the viewer's own storefront.
export const APP_STORE_URL = "https://apps.apple.com/us/app/ball-iq-football-trivia/id6775975961";
// Play package id is app.balliq (build.gradle applicationId) — NOT com.balliq.app;
// the reversed form 404s. Listing goes live when the closed test graduates.
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.balliq";
