// clubFaceRoute.js — bank club name -> the Ball IQ card face its answers feed.
//
// ONE implementation, two callers:
//   · scripts/gen-club-index.mjs writes the result into the GENERATED
//     src/data/clubPackColours.js (CLUB_NAME_TO_COMP), which the build-time SEO
//     pages read to stamp `data-face` on a club page.
//   · src/App.jsx builds the same map at boot from CLUB_PACK_TO_QB +
//     CLUB_LEAGUES — tables Home already carries — and hands it to
//     ballIqCard.js via setClubRoutes().
//
// ⚠️ WHY THE APP DOES NOT IMPORT THE GENERATED TABLE (2026-09-21). ballIqCard.js
// used to `import { CLUB_NAME_TO_COMP }` from the generated module, and that one
// import put the whole colours chunk (12 KB, growing with every club wave) on
// Home's blocking path. The Brasileirão wave tipped the budget and production
// deploys failed silently for four days. The map is DERIVED data: deriving it
// from the tables already in the entry chunk costs nothing per wave. A lazy
// import() was the wrong tool — recordAnswers is synchronous, and a club answer
// filed before the map arrived would land on the wrong face for good.
//
// Route: club -> pack (CLUB_PACK_TO_QB inverted) -> country (CLUB_LEAGUES) -> face.
//   · nothing may be unrouted: a country whose league has no face of its own
//     falls to Clubs, where the read-time fold would put it anyway.
//   · a club answer is STORED under its real league, never pre-pooled — see
//     faceCatFor in ballIqCard.js.
export const LEAGUE_TO_COMP = {
  england: 'PL', spain: 'LaLiga', italy: 'SerieA', germany: 'Bundesliga',
  france: 'Ligue1', turkiye: 'SuperLig', portugal: 'Primeira',
};

/** @param packToQb pack id -> bank club name. @param packLeague pack id -> country. */
export function buildClubRoutes(packToQb, packLeague) {
  const routes = {};
  for (const [pack, name] of Object.entries(packToQb || {})) {
    const country = packLeague?.[pack];
    if (typeof country !== 'string' || !country) continue; // a pack with no country has no route
    routes[name] = LEAGUE_TO_COMP[country] || 'Clubs';
  }
  return routes;
}
