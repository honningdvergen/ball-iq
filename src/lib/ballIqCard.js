// Ball IQ player card — a FIFA-style card driven by per-category accuracy.
// Six "competition" face stats + a compiled overall + a bronze/silver/gold tier.
// catStats shape (from saveStats): { [cat]: { c: correctCount, a: answeredCount } }.

// The six face stats. `cat` maps to the question bank's cat field; `abbr` is the
// 3-letter card label (FIFA's PAC/SHO/PAS/DRI/DEF/PHY equivalent).
// `icon` uses country flags (FIFA-card convention) — license-safe, unlike the
// trademarked competition logos. England flag for the PL, a star for the UCL,
// a globe for the World Cup.
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

// overall < 65 → bronze, 65-79 → silver, 80+ → gold.
export function cardTier(overall) {
  if (overall >= 80) return "gold";
  if (overall >= 65) return "silver";
  return "bronze";
}

// Tier palettes — shared by the in-app card header and the share render.
export const CARD_TIERS = {
  gold:   { bg: "linear-gradient(160deg,#2c2510 0%,#0e0c05 100%)", accent: "#F0C24B", text: "#FDF6E3", label: "GOLD" },
  silver: { bg: "linear-gradient(160deg,#1d1f26 0%,#0b0c0f 100%)", accent: "#C7CED8", text: "#F2F4F8", label: "SILVER" },
  bronze: { bg: "linear-gradient(160deg,#241a12 0%,#0e0a06 100%)", accent: "#CE8B36", text: "#F5ECE2", label: "BRONZE" },
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
