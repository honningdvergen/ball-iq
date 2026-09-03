// The Discover and More link lists — shared by the front door's footer
// (FrontDoor.jsx), the generated pages' footer (scripts/seo/shell.mjs) and
// the served answer pages (scripts/seo/answer-shell.mjs). One list, three
// footers, no drift.
//
// Re-pointed 2026-09-04 on the GSC 28-day read (memory
// project_gsc_28d_2026_09_04): Discover used to lead with facts, quotes and
// nicknames, which pulled 0 clicks on 104 impressions between them, while
// the Footle answer page converted 20% of its impressions. Discover now
// lists what people actually search for. The three content pages keep a
// link under More so they stay indexed and reachable — the orphan gate
// (scripts/audit-orphan-pages.mjs) would otherwise fail the build, and it
// would be right to.
export const DISCOVER = [
  ['Football quiz', '/football-quiz/'],
  ['All quizzes', '/quiz/'],
  ['Clubs by league', '/quiz/clubs/'],
  ["Today's Footle answer", '/football-wordle/answer/'],
  ['Daily 7 answers', '/daily-football-quiz/answers/'],
  ['Every list', '/lists/'],
];

export const MORE = [
  ['Football facts', '/fun-facts/'],
  ['Football quotes', '/football-quotes/'],
  ['Club nicknames', '/club-nicknames/'],
  ['Trivia memory study', '/study/football-trivia-memory/'],
];
