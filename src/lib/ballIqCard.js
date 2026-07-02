// Ball IQ player-rating card — driven by per-category accuracy. Six "competition"
// face stats + a compiled overall + a Prospect / Pro / Elite rating tier.
// catStats shape (from saveStats): { [cat]: { c: correctCount, a: answeredCount } }.

// The six face stats. `cat` maps to the question bank's cat field; `abbr` is the
// 3-letter card label (the competition's short code).
// `icon` uses country flags (license-safe, unlike the trademarked competition
// logos). England flag for the PL, a star for the UCL, a globe for the World Cup.
export const CARD_COMPS = [
  { abbr: "PRL", cat: "PL",         name: "Premier League",   icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { abbr: "UCL", cat: "UCL",        name: "Champions League", icon: "⭐" },
  { abbr: "WCP", cat: "WorldCup",   name: "World Cup",        icon: "🌍" },
  { abbr: "LAL", cat: "LaLiga",     name: "La Liga",          icon: "🇪🇸" },
  { abbr: "BUN", cat: "Bundesliga", name: "Bundesliga",       icon: "🇩🇪" },
  { abbr: "SEA", cat: "SerieA",     name: "Serie A",          icon: "🇮🇹" },
];

// Accuracy → a 40-99 rating. Bayesian-smoothed with a weak ~0.33 prior (weight 3)
// so a couple of lucky/unlucky early answers don't swing it, and an unplayed comp
// sits at a sensible "rookie" baseline (~60) that climbs as you play.
export function compRating(cs, priorAcc = 0.4) {
  const c = cs?.c || 0;
  const a = cs?.a || 0;
  // Smoothed toward the player's overall accuracy (prior, weight 2): an unplayed
  // competition starts at a rating reflecting their level, then diverges quickly
  // (even a few answers move it) toward the category-specific accuracy.
  const acc = (c + priorAcc * 2) / (a + 2);
  return Math.max(40, Math.min(99, Math.round(40 + acc * 59)));
}

// overall < 65 → prospect, 65-79 → pro, 80+ → elite.
export function cardTier(overall) {
  if (overall >= 80) return "elite";
  if (overall >= 65) return "pro";
  return "prospect";
}

// Tier palettes — Ball IQ's own slate → green → violet ramp (deliberately not a
// metallic bronze/silver/gold scheme). Shared by the in-app card header and the
// share render.
export const CARD_TIERS = {
  elite:    { bg: "linear-gradient(160deg,#241a33 0%,#0c0814 100%)", accent: "#A78BFA", text: "#F3EEFF", label: "ELITE" },
  pro:      { bg: "linear-gradient(160deg,#0f2417 0%,#050d08 100%)", accent: "#22C55E", text: "#EAFBF0", label: "PRO" },
  prospect: { bg: "linear-gradient(160deg,#161c26 0%,#080b10 100%)", accent: "#8AA4C8", text: "#EDF2F8", label: "PROSPECT" },
};

// Compute the full card model from catStats.
export function computeCard(catStats = {}, priorAcc = 0.4) {
  const ratings = CARD_COMPS.map(comp => {
    const cs = catStats[comp.cat];
    return { abbr: comp.abbr, name: comp.name, icon: comp.icon, rating: compRating(cs, priorAcc), answered: cs?.a || 0 };
  });
  const overall = Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length);
  return { ratings, overall, tier: cardTier(overall) };
}
