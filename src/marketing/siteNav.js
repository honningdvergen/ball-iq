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

// Every game, once — for the generated pages' footer (shell.mjs), the
// /football-games/ hub (gen-seo-pages.mjs) and, in time, the front door's
// mode cards. Static page where one exists (crawlable, and the page a
// searcher expects), the app runner otherwise. `line` is one line, never a
// sentence about us. Order: the four dailies, then the modes.
export const GAMES_NAV = [
  { key: 'footle', name: 'Footle', href: '/football-wordle/', line: 'Guess the surname in six', daily: true },
  { key: 'daily', name: 'Daily 7', href: '/daily-football-quiz/', line: 'Seven questions, the same for everyone', daily: true },
  { key: 'trail', name: 'Transfer Trail', href: '/transfer-trail/', line: 'Follow the moves, name the player', daily: true },
  { key: 'mystery', name: 'Mystery Player', href: '/mystery-player/', line: 'Guess who from career clues', daily: true },
  { key: 'xi', name: 'Guess the XI', href: '/xi/', line: 'Name the line-up from a famous match' },
  { key: 'clubquiz', name: 'Club Quiz', href: '/quiz/clubs/', line: 'Pick your club, ten on them' },
  { key: 'leaguequiz', name: 'League Quiz', href: '/quiz/', line: 'One competition, its history' },
  { key: 'classic', name: 'Classic', href: '/play?game=classic', line: 'Ten questions, twenty seconds each' },
  { key: 'survival', name: 'Survival', href: '/play?game=survival', line: 'One wrong answer and it ends' },
  { key: 'hotstreak', name: 'Hot Streak', href: '/play?game=hotstreak', line: 'Sixty seconds, as many as you can' },
  { key: 'stadiums', name: 'Stadiums', href: '/play?game=stadiums', line: 'Name every ground in the league' },
  { key: 'legends', name: 'Legends', href: '/quiz/legends/', line: 'Pre-2000 greats only' },
  { key: 'chaos', name: 'Chaos', href: '/play?game=chaos', line: 'Quotes, nicknames and the rest' },
  { key: 'online', name: 'Play a friend', href: '/play?game=online', line: 'Live rooms, up to eight of you' },
];
