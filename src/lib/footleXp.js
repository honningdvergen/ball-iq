// Footle XP: a loss still pays (the player showed up), a win pays more the
// fewer guesses it took. Shared by the app shell (awards it once per day on
// biq:daily-completed) and the result card (shows it), so the number a player
// is told and the number they receive cannot disagree.
export function getFootleXP(won, guesses) {
  if (!won) return 10;
  const g = Math.min(6, Math.max(1, guesses || 6));
  return 30 + (6 - g) * 6;
}
