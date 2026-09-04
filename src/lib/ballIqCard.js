// Ball IQ player-rating card — driven by per-category accuracy. Six "competition"
// face stats + a compiled overall + a Prospect / Pro / Elite rating tier.
// catStats shape (from saveStats): { [cat]: { c: correctCount, a: answeredCount } }.

// The six face stats. `cat` maps to the question bank's cat field; `abbr` is the
// 3-letter card label (the competition's short code).
// `icon` uses country flags (license-safe, unlike the trademarked competition
// logos). England flag for the PL, a star for the UCL, a globe for international.
// `color` is the competition's own colour, and it must stay equal to the one
// LEAGUE_QUIZ_SECTIONS (App.jsx) uses for the same `cat` — the quiz picker and
// the rating card naming the same competition in two different colours is the
// drift this app keeps producing. Pinned by tests/unit/card-comp-colours.test.js.
export const CARD_COMPS = [
  { abbr: "EPL", cat: "PL",         name: "Premier League",   icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", color: "#3D195B" },
  { abbr: "UCL", cat: "UCL",        name: "Champions League", icon: "⭐", color: "#123A8F" },
  { abbr: "INT", cat: "WorldCup",   name: "International",     icon: "🌍", color: "#8A6D1B" },
  { abbr: "LAL", cat: "LaLiga",     name: "La Liga",          icon: "🇪🇸", color: "#EE8707" },
  { abbr: "BUN", cat: "Bundesliga", name: "Bundesliga",       icon: "🇩🇪", color: "#D20515" },
  { abbr: "SEA", cat: "SerieA",     name: "Serie A",          icon: "🇮🇹", color: "#0578D3" },
];

// Accuracy → a 40-99 rating. Bayesian-smoothed with a weak ~0.33 prior (weight 3)
// so a couple of lucky/unlucky early answers don't swing it, and an unplayed comp
// sits at a sensible "rookie" baseline (~60) that climbs as you play.
export function compRating(cs, priorAcc = 0.4) {
  const c = cs?.c || 0;
  const a = cs?.a || 0;
  // ⚠️ A PRIOR IS A PRIOR, NOT A VERDICT. Callers pass the player's overall
  // accuracy as priorAcc — and for a brand-new player that "overall" is two
  // answers. Seen live on a fresh device (2026-09-01): 2/2 correct made the
  // prior 1.0, which made acc 1.0, which rendered a 99 GOLD card off two
  // questions — a number that can only fall from there, which is exactly the
  // "it keeps going down the more I play" feeling a real player reported.
  // Clamping the prior to [0.25, 0.75] keeps an unproven player believably
  // mid-table in both directions; with real volume the prior's weight (2)
  // vanishes and the clamp changes nothing.
  const prior = Math.max(0.25, Math.min(0.75, priorAcc));
  // Smoothed toward the player's overall accuracy (prior, weight 2): an unplayed
  // competition starts at a rating reflecting their level, then diverges quickly
  // (even a few answers move it) toward the category-specific accuracy.
  const acc = (c + prior * 2) / (a + 2);
  return Math.max(40, Math.min(99, Math.round(40 + acc * 59)));
}

// BRONZE / SILVER / GOLD. Alex, 2026-08-26: "maybe we should have silver cards
// from 60-74 and gold above that? and bronze below 60? i think maybe the green
// color is worse than silver".
//
// He is right, and for a reason this codebase already had written down: GREEN
// IN THIS APP MEANS CORRECT AND GO. The mode grid was de-greened for exactly
// that reason — nine green icons meant the eye could not rank them — and a
// green TIER competes with green-as-correct in the same way. Bronze/silver/gold
// is also a ladder every football fan already reads, where "prospect / pro /
// elite" had to be learned.
export function cardTier(overall) {
  if (overall >= 75) return "gold";
  if (overall >= 60) return "silver";
  return "bronze";
}

// Tier palettes. Shared by the in-app card header and the share render
// (api/og.js imports these — keep this module the single source of truth).
export const CARD_TIERS = {
  gold:   { bg: "linear-gradient(160deg,#2a2410 0%,#0B0C10 100%)", accent: "#FFC107", text: "#FFF6E0", label: "GOLD" },
  silver: { bg: "linear-gradient(160deg,#1b212a 0%,#080a0f 100%)", accent: "#C7D2E0", text: "#EDF1F7", label: "SILVER" },
  bronze: { bg: "linear-gradient(160deg,#2a1a0e 0%,#0b0705 100%)", accent: "#D08A4E", text: "#F6E7D8", label: "BRONZE" },
};

// ⚠️ OLD SHARE LINKS MUST STILL RENDER. api/og.js takes the tier key from a URL
// parameter, and every /p?... card already sitting in somebody's chat history
// carries elite / pro / prospect. Renaming the keys without this would drop all
// of them to a default palette — a silent regression in the one artefact that
// outlives every deploy.
const LEGACY_TIER = { elite: "gold", pro: "silver", prospect: "bronze" };

/** Resolve a tier key — current or legacy — to a palette. Never returns undefined. */
export function tierPalette(key) {
  return CARD_TIERS[key] || CARD_TIERS[LEGACY_TIER[key]] || CARD_TIERS.silver;
}

// Compute the full card model from catStats.
export function computeCard(catStats = {}, priorAcc = 0.4) {
  const ratings = CARD_COMPS.map(comp => {
    const cs = catStats[comp.cat];
    return { abbr: comp.abbr, cat: comp.cat, name: comp.name, icon: comp.icon, color: comp.color, rating: compRating(cs, priorAcc), answered: cs?.a || 0 };
  });
  const overall = Math.round(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length);
  return { ratings, overall, tier: cardTier(overall) };
}
