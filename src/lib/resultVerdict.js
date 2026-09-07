// The one-line verdict shown under a score.
//
// Extracted from screens/ModeResults.jsx on 2026-09-07 for weight, not tidiness.
// Six pure lines were the only reason two eager importers — the canvas share-card
// painter in App.jsx and hooks/useShare.js — dragged the whole ModeResults
// screen module into the eager Home chunk. With it here, those screens can load
// on demand and this stays where it is: tiny, sync, and always available.
export function resultVerdict(pct) {
  if (pct === 100) return "Ballon d'Or form";
  if (pct >= 80) return "Top-corner finish";
  if (pct >= 60) return "Solid at the back";
  if (pct >= 40) return "Squad rotation material";
  return "Sunday league, first half";
}
