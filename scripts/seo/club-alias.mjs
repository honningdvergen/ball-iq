// leagues.mjs short name -> clubs.mjs page name.
//
// WHY THIS FILE EXISTS RATHER THAN A NAME MATCH
// leagues.mjs holds 356 clubs under the short names a league table uses
// ("Man City", "Dortmund", "Nott'm Forest"); clubs.mjs holds 76 page names in
// long form ("Manchester City", "Borussia Dortmund", "Nottingham Forest").
// Joining the two is needed to answer "which clubs still have no page", and
// every automated attempt at it has produced confident nonsense:
//
//   FUZZY MATCH  Angers        -> Rangers                 wrong country
//                Paris FC      -> Paris Saint-Germain     a different club
//                Cercle Brugge -> Club Brugge             a different club
//   GUESSED      Brighton      -> Brighton & Hove Albion  our page is "Brighton"
//   ALIAS        West Ham      -> West Ham United         our page is "West Ham"
//                Wolves        -> Wolverhampton Wanderers our page is "Wolves"
//
// The first three invent coverage we do not have. The last three invent GAPS we
// do not have — and that is how "Premier League 19/20, Brighton missing" got
// reported when the league is complete. Both directions are wrong, so both
// directions need checking by hand.
//
// ⚠️ ONLY ENTRIES THAT DIFFER GO HERE. If a short name already equals a page
// name it needs no alias, and adding one is how the Brighton error happened.
// Every line below was verified against CLUBS by exact lookup.
export const CLUB_ALIAS = {
  // England — long-form pages
  'Man City': 'Manchester City',
  'Man United': 'Manchester United',
  'Newcastle': 'Newcastle United',
  "Nott'm Forest": 'Nottingham Forest',
  'Tottenham': 'Tottenham Hotspur',
  'Ipswich': 'Ipswich Town',
  'Coventry': 'Coventry City',
  // NOTE: Brighton, West Ham, Wolves and Bournemouth are NOT aliased —
  // clubs.mjs uses the short form for all four.

  // Spain
  'Athletic Club': 'Athletic Bilbao',

  // Germany
  'Dortmund': 'Borussia Dortmund',
  'Leverkusen': 'Bayer Leverkusen',
  'Schalke': 'Schalke 04',

  // France
  'PSG': 'Paris Saint-Germain',
};

// Resolve a leagues.mjs club name to the page name, or null if we have no page.
// `paged` is a Set of clubs.mjs club names.
export function pageNameFor(shortName, paged) {
  const target = CLUB_ALIAS[shortName] || shortName;
  return paged.has(target) ? target : null;
}
