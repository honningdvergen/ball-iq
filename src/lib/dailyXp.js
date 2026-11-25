// What a finished Transfer Trail and a finished Top 10 pay.
//
// Shared by the app shell (which awards it once, on biq:daily-completed) and
// the result card (which shows it in yellow under the verdict), so the number
// a player is told and the number they receive cannot disagree. Footle's twin
// is lib/footleXp.js. Until 25 Nov 2026 both sums lived in App.jsx alone,
// because nothing else printed them.

// Transfer Trail: 40 for naming the player, 10 for showing up.
export function getTrailXP(won) {
  return won ? 40 : 10;
}

// Top 10: four a name, fifteen more for all ten. Nothing found pays nothing.
export function getTop10XP(found, perfect) {
  const n = Math.max(0, Math.min(10, Math.round(Number(found) || 0)));
  return n * 4 + (perfect ? 15 : 0);
}
