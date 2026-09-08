// THE navigation. One definition, two renderers.
//
// ⚠️ THIS FILE EXISTS BECAUSE THE NAV SHIPPED TO ONLY HALF THE SITE. The
// intent groups were built inside scripts/gen-seo-pages.mjs, so they rendered
// on the ~180 GENERATED pages and nowhere else — the React homepage kept its
// own hardcoded four links, and a visitor going homepage → club page got a
// different menu with different words. "There and everywhere" was the point;
// building it in the generator quietly meant "there".
//
// So: plain ESM, no JSX, no imports. That is what lets BOTH consumers read it —
// Vite bundles it for the React homepage, and the Node build script imports it
// directly. Keep it dependency-free or the build script breaks.
//
// Consumers (update all when adding one):
//   • scripts/gen-seo-pages.mjs  → static dropdowns + mobile panel, inline JS
//   • src/marketing/ScoutingReport.jsx → the live homepage header
//
// Hrefs are ROOT-RELATIVE. The generator prefixes SITE.base; React uses them
// as-is.
export const NAV_GROUPS = [
  { key: 'games', label: 'Games', items: [
    ['Daily 7', '/daily-football-quiz/'],
    ['Footle — football Wordle', '/football-wordle/'],
    ['Transfer Trail', '/transfer-trail/'],
    ['Mystery Player', '/mystery-player/'],
    ['Guess the XI', '/xi/'],
    // ⚠️ NO 'Lineup Builder' ENTRY. /lineup/ is live but deliberately UNLINKED
    // until Alex signs off — "i still need to test the lineup builder more
    // before it goes live". A nav rebuild put it here on ~180 pages by reflex;
    // a game with 156 curated monograms and an uneyeballed fame tail is not
    // something to hand a first-time visitor. Restore on his word — and note
    // that adding it here now lights it up on the homepage too.
  ] },
  { key: 'quizzes', label: 'Quizzes', items: [
    // ⚠️ THE ANCHOR CARRIES THE HEAD TERM. /quiz/ is the deliberate target for
    // "football quiz" (gen-seo-pages.mjs, the 2026-08-16 canonical decision),
    // and 347 pages link it — but as "All quizzes", "Quizzes", "League Quiz".
    // The phrase it is meant to rank for reached it from nowhere. Measured
    // 2026-09-09: bare "football quiz" 51 impressions / 0 clicks in 28 days.
    ['Football quizzes', '/quiz/'],
    ['Club quizzes', '/quiz/clubs/'],
    ['Premier League', '/quiz/premier-league/'],
    ['Champions League', '/quiz/champions-league/'],
    ['World Cup', '/quiz/world-cup/'],
    ['Legends', '/quiz/legends/'],
  ] },
  { key: 'discover', label: 'Discover', items: [
    ['Records & lists', '/lists/'],
    ['Football fun facts', '/fun-facts/'],
    ['Football quotes', '/football-quotes/'],
    ['Club nicknames', '/club-nicknames/'],
    ['The trivia data study', '/study/football-trivia-memory/'],
    ['About Ball IQ', '/about/'],
  ] },
];
