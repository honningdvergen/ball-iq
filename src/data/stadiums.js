// Stadiums mode data — name every ground in a league (Sporcle-style
// completion run, NOT a daily: no frozen schedule needed, the set only
// changes once a season at promotion/relegation).
//
// ⚠️ SEASON-PINNED DATA. This is the 2026-27 Premier League, verified
// 2026-08-20 against premierleague.com's AGM announcement, the Wikipedia
// season page and NBC's season guide (all agree): Coventry, Ipswich and
// Hull came up; West Ham, Burnley and Wolves went down. Refresh every
// summer alongside the trail-careers verification — a stadium list one
// season stale is the "Van Persie twice in a week" of this mode.
//
// `stadium` is the DISPLAY name — the name fans actually use (sponsor
// names where that is what everyone says: Etihad, Vitality, Gtech, Amex).
// `accept` lists every normalized form that counts as correct, including
// traditional names (Dean Court, Falmer, City of Manchester) and recent
// former sponsors (Ricoh, KCOM). Normalization strips case, diacritics
// and punctuation — see normalizeStadiumGuess below — so accept entries
// are written pre-normalized: lowercase, letters/digits/spaces only.
// Old grounds a club has LEFT are deliberately absent (no White Hart
// Lane, no Goodison Park): accepting them would teach a stale fact.

export const STADIUM_LEAGUES = [
  {
    id: "premier-league",
    name: "Premier League",
    season: "2026-27",
    clubs: [
      { club: "Arsenal",            stadium: "Emirates Stadium",           accept: ["emirates", "emirates stadium", "the emirates", "ashburton grove"] },
      { club: "Aston Villa",        stadium: "Villa Park",                 accept: ["villa park"] },
      { club: "Bournemouth",        stadium: "Vitality Stadium",           accept: ["vitality", "vitality stadium", "dean court"] },
      { club: "Brentford",          stadium: "Gtech Community Stadium",    accept: ["gtech", "gtech community stadium", "gtech stadium", "brentford community stadium"] },
      { club: "Brighton",           stadium: "Amex Stadium",               accept: ["amex", "the amex", "amex stadium", "american express stadium", "american express community stadium", "falmer", "falmer stadium"] },
      { club: "Chelsea",            stadium: "Stamford Bridge",            accept: ["stamford bridge", "the bridge"] },
      { club: "Coventry City",      stadium: "Coventry Building Society Arena", accept: ["coventry building society arena", "cbs arena", "the cbs arena", "ricoh", "ricoh arena"] },
      { club: "Crystal Palace",     stadium: "Selhurst Park",              accept: ["selhurst park", "selhurst"] },
      { club: "Everton",            stadium: "Hill Dickinson Stadium",     accept: ["hill dickinson", "hill dickinson stadium", "everton stadium", "bramley moore", "bramley moore dock", "bramley moore dock stadium"] },
      { club: "Fulham",             stadium: "Craven Cottage",             accept: ["craven cottage", "the cottage"] },
      { club: "Hull City",          stadium: "MKM Stadium",                accept: ["mkm", "mkm stadium", "kcom", "kcom stadium", "kc stadium"] },
      { club: "Ipswich Town",       stadium: "Portman Road",               accept: ["portman road"] },
      { club: "Leeds United",       stadium: "Elland Road",                accept: ["elland road"] },
      { club: "Liverpool",          stadium: "Anfield",                    accept: ["anfield"] },
      { club: "Man City",           stadium: "Etihad Stadium",             accept: ["etihad", "etihad stadium", "the etihad", "city of manchester stadium", "eastlands"] },
      { club: "Man United",         stadium: "Old Trafford",               accept: ["old trafford"] },
      { club: "Newcastle",          stadium: "St James' Park",             accept: ["st james park", "st james", "saint james park", "st james s park"] },
      { club: "Nottingham Forest",  stadium: "City Ground",                accept: ["city ground", "the city ground"] },
      { club: "Sunderland",         stadium: "Stadium of Light",           accept: ["stadium of light", "the stadium of light"] },
      { club: "Tottenham",          stadium: "Tottenham Hotspur Stadium",  accept: ["tottenham hotspur stadium", "spurs stadium", "tottenham stadium", "new white hart lane"] },
    ],
  },
];

// Lowercase, fold diacritics, keep letters/digits as words, collapse spaces.
// "St. James' Park" -> "st james park"; "Câmp Nou" -> "camp nou".
export function normalizeStadiumGuess(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Match a free-typed guess against the league's UNSOLVED clubs. Returns the
// club key or null. Exact normalized match only — with generous accept lists
// per entry, fuzzy matching would create false positives between grounds
// ("city ground" vs "city of manchester stadium" must never collide).
export function matchStadium(league, guess, solvedSet) {
  const g = normalizeStadiumGuess(guess);
  if (!g) return null;
  for (const c of league.clubs) {
    if (solvedSet.has(c.club)) continue;
    if (c.accept.includes(g) || normalizeStadiumGuess(c.stadium) === g) return c.club;
  }
  return null;
}
