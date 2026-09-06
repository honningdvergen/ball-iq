// Result-screen copy: the tier line under the score. Moved out of App.jsx on
// 2026-09-06 (review E16) with the Results screen.

// Daily-specific tier copy. Returns the same shape DailySocialProof used
// (emoji + headline + sub), but extracted so the Results screen can use
// the headline/sub as the score-tier tagline without rendering the full
// duplicate-card UI. Daily personality preserved, single celebration.
export function dailyTierCopy(score, total) {
  const safeTotal = total || 7;
  const safeScore = Math.max(0, Math.min(safeTotal, score || 0));
  if (safeScore === safeTotal) return { emoji: "🏆", headline: "Perfect run!",        sub: "All seven correct — flawless." };
  if (safeScore >= 6)          return { emoji: "🌟", headline: "Excellent!",          sub: "One of those days where it just clicks." };
  if (safeScore >= 4)          return { emoji: "⚽", headline: "Solid challenge.",    sub: "Some tough ones in there today." };
  if (safeScore >= 2)          return { emoji: "📈", headline: "Keep going.",         sub: "Tomorrow's another chance to climb." };
  return                              { emoji: "💪", headline: "Everyone starts somewhere.", sub: "Come back tomorrow for a fresh seven." };
}


// Score-tier tagline shown under the score caption on result screens. Maps a
// percentage (0-100) to a one-line emotional beat. Used by Results today;
// other result screens already carry their own emoji+title flavour so they
// don't render this.
export function scoreTagline(pct) {
  if (pct <= 30) return "Tough round.";
  if (pct <= 50) return "Solid effort.";
  if (pct <= 70) return "Strong showing.";
  if (pct <= 89) return "Excellent.";
  return "Brilliant!";
}

