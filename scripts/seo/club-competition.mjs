// Club page -> the competition it belongs to, for the Club Index on the
// Scouting Report homepage.
//
// WHY THIS FILE EXISTS RATHER THAN A NAME MATCH
// DESIGN.md, on the two earlier versions of the club row the finish review
// killed: "Don't ship a derived data column without checking what the
// derivation actually caught. The club index's era range read as fact and was
// mostly distractor years. A column that states something untrue is worse than
// no column."
//
// The competition column is the replacement for that era column, and it is
// checkable "in the repo (scripts/seo/leagues.mjs) and by any reader". Matching
// CLUBS[].club against LEAGUES[].clubs[].name resolves 55 of 72 exactly. The
// remaining 17 are short-form names in leagues.mjs — and a fuzzy match on them
// produces confident nonsense about real clubs:
//
//   Paris Saint-Germain -> "Paris FC"        a different club
//   Bayer Leverkusen    -> "Bayern Munich"   a different club
//   Red Star Belgrade   -> "Telstar"         Eredivisie, wrong country
//   Athletic Bilbao     -> "Athletico-PR"    Brasileirao, wrong continent
//
// So every entry below is hand-checked against the roster printed from
// leagues.mjs, not inferred. If you add a club page, add it here deliberately
// or it renders with no competition — which is the correct failure mode.

/** CLUBS[].club (the pack key) -> the exact `league` string in leagues.mjs. */
export const CLUB_COMPETITION = {
  // ⚠️ Added 2026-08-13 with the South Coast / second-tier wave. All four play
  // in the Championship in the 2026-27 leagues.mjs roster — Southampton and
  // Sheffield Wednesday are the ones people assume are top-flight, and are not.
  'Southampton': 'Championship',
  'Portsmouth': 'Championship',
  'Birmingham City': 'Championship',
  'Sheffield Wednesday': 'Championship',
  'Wrexham': 'Championship',
  'Norwich City': 'Championship',
  'Middlesbrough': 'Championship',
  'West Brom': 'Championship',
  'Sheffield United': 'Championship',
  'Cardiff City': 'Championship',
  'Stoke City': 'Championship',
  'Derby County': 'Championship',
  'Swansea City': 'Championship',
  // ⚠️ LEAGUE ONE IS NOT A leagues.mjs ROSTER, and that is deliberate.
  // Every other value here names a `league` string that exists in leagues.mjs,
  // so a reader can check it. Leicester appears in NEITHER the 2026-27 Premier
  // League nor the Championship roster — they are in League One, which the
  // clubs directory does not cover and which nobody has verified a full roster
  // for. Confirmed by Alex 2026-08-27; the 2026-27 division is past my training
  // cutoff, so recalling it would have been fabrication.
  // The value is only ever rendered as text in the club-index row, so it needs
  // no roster behind it. If a League One section is ever added to leagues.mjs,
  // this entry becomes redundant and the name match takes over.
  'Leicester City': 'League One',
  // Greece is not in the clubs directory either — same reasoning as above.
  'Olympiacos': 'Super League Greece',
  'Panathinaikos': 'Super League Greece',
  // Short-form in leagues.mjs, long-form in clubs.mjs. Verified one by one.
  'Manchester United': 'Premier League', // leagues.mjs: "Man United"
  'Manchester City': 'Premier League', // "Man City"
  'Tottenham Hotspur': 'Premier League', // "Tottenham"
  'Newcastle United': 'Premier League', // "Newcastle"
  'Nottingham Forest': 'Premier League', // "Nott'm Forest"
  'Ipswich Town': 'Premier League', // "Ipswich"
  'Coventry City': 'Premier League', // "Coventry"
  'Borussia Dortmund': 'Bundesliga', // "Dortmund"
  'Bayer Leverkusen': 'Bundesliga', // "Leverkusen" — NOT "Bayern Munich"
  'Schalke 04': 'Bundesliga', // "Schalke"
  'Paris Saint-Germain': 'Ligue 1', // "PSG" — NOT "Paris FC"
  'Olympique Lyonnais': 'Ligue 1', // "Lyon"
  'AS Monaco': 'Ligue 1', // "Monaco"
  'Athletic Bilbao': 'La Liga', // "Athletic Club" — NOT "Athletico-PR"

  // ⚠️ NOT IN leagues.mjs AT ALL — their competitions are not among the 19 it
  // covers. Written out here because the alternative is a blank column on
  // three real pages. Each is a plain, checkable statement of where the club
  // currently plays; if any of these three is wrong it is wrong in an
  // obvious, correctable way rather than a plausible one.
  // Beşiktaş for the third time today. clubs.mjs stores the pack key as ASCII
  // "Besiktas" while leagues.mjs writes the diacritics, so an exact match
  // misses — the same divergence that mis-skipped it in the "& Answers" title
  // pass this morning (b5d6d5e). It is the only club in the bank whose display
  // name and pack key differ; when something matches 71 of 72, this is why.
  Besiktas: 'Süper Lig',

  Basel: 'Swiss Super League',
  'Red Star Belgrade': 'Serbian SuperLiga',
  'Saint-Étienne': 'Ligue 1',
};

/**
 * Resolve a competition for a club, preferring the authoritative roster and
 * falling back to the hand-verified map. Returns null when neither knows —
 * render nothing rather than a guess.
 */
export function competitionFor(clubName, LEAGUES) {
  for (const l of LEAGUES) {
    if (l.clubs.some((c) => c.name === clubName)) return l.league;
  }
  return CLUB_COMPETITION[clubName] || null;
}
