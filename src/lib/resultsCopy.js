// Result-screen copy: the tier line under the score. Moved out of App.jsx on
// 2026-09-06 (review E16) with the Results screen.

// Daily-specific tier copy. Returns the same shape DailySocialProof used
// (emoji + headline + sub), but extracted so the Results screen can use
// the headline/sub as the score-tier tagline without rendering the full
// duplicate-card UI. Daily personality preserved, single celebration.
// The results screen prints these in the player's language: the d7.h<band> /
// d7.s<band> keys in i18n/en.js, the same English as this table (which the
// share card keeps).
const DAILY_TIERS = [
  { emoji: "🏆", headline: "Perfect run!",        sub: "All seven correct — flawless." },
  { emoji: "🌟", headline: "Excellent!",          sub: "One of those days where it just clicks." },
  { emoji: "⚽", headline: "Solid challenge.",    sub: "Some tough ones in there today." },
  { emoji: "📈", headline: "Keep going.",         sub: "Tomorrow's another chance to climb." },
  // "Everyone starts somewhere" over a 1/7 read as a pat on the head (16 Oct 2026).
  { emoji: "💪", headline: "A tough set today.", sub: "Tomorrow's seven are brand new." },
];
export function dailyTierCopy(score, total) {
  return DAILY_TIERS[dailyTierBand(score, total)];
}
export function dailyTierBand(score, total) {
  const safeTotal = total || 7;
  const safeScore = Math.max(0, Math.min(safeTotal, score || 0));
  return safeScore === safeTotal ? 0 : safeScore >= 6 ? 1 : safeScore >= 4 ? 2 : safeScore >= 2 ? 3 : 4;
}


// Score-tier tagline shown under the score caption on result screens. Maps a
// percentage (0-100) to a one-line emotional beat. Used by Results today;
// other result screens already carry their own emoji+title flavour so they
// don't render this.
export function scoreTagline(pct) {
  return ["Tough round.", "Solid effort.", "Strong showing.", "Excellent.", "Brilliant!"][scoreTaglineBand(pct)];
}
/** scoreTagline's band, 0-4: the tag.<band> keys in i18n/en.js. */
export function scoreTaglineBand(pct) {
  return pct <= 30 ? 0 : pct <= 50 ? 1 : pct <= 70 ? 2 : pct <= 89 ? 3 : 4;
}

