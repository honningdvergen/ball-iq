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
  'Sheffield Utd': 'Sheffield United',
  'Blackburn': 'Blackburn Rovers',
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
  'Lyon': 'Olympique Lyonnais',
  'Monaco': 'AS Monaco',

  // Turkey — the page name is unaccented
  'Beşiktaş': 'Besiktas',
};

// Accent- and punctuation-insensitive fold, used only by the audit below.
const fold = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// Report leagues.mjs clubs that LOOK like they have a page but resolve to null.
//
// These three were all reported as gaps while the pages existed:
//   Lyon     -> Olympique Lyonnais   (page name is the long form)
//   Monaco   -> AS Monaco            (page name carries the prefix)
//   Beşiktaş -> Besiktas             (page name drops the diacritics)
//
// A missing alias is invisible: it reads exactly like real missing coverage, and
// the wave picker then queues a club we already published. Containment alone is
// not safe — "Angers" sits inside "Rangers" — so this only REPORTS, and every
// entry above still had to be confirmed by hand.
export function suspectedMissingAliases(leagues, paged) {
  const pages = [...paged];
  const out = [];
  for (const lg of leagues) {
    for (const c of lg.clubs) {
      if (pageNameFor(c.name, paged)) continue;
      const n = fold(c.name);
      const near = pages.filter((p) => {
        const pn = fold(p);
        return pn === n || (n.length >= 4 && pn.includes(n)) || (pn.length >= 4 && n.includes(pn));
      });
      if (near.length) out.push({ league: lg.league, short: c.name, near });
    }
  }
  return out;
}

// Resolve a leagues.mjs club name to the page name, or null if we have no page.
// `paged` is a Set of clubs.mjs club names.
export function pageNameFor(shortName, paged) {
  const target = CLUB_ALIAS[shortName] || shortName;
  return paged.has(target) ? target : null;
}
