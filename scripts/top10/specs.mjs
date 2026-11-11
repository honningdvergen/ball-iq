// Top 10: the lists, in the order they were written, and the schedule.
//
// Read by scripts/gen-top10.mjs, which writes src/data/top10Lists.json.
//
// A list is either DERIVED from a table in scripts/seo/lists.mjs (already
// fact-checked row by row, so nothing is retyped and nothing can be mistyped),
// or EXPLICIT: ten slots written out here with the source they were checked
// against. Either way a list ships only after an independent check against the
// web on the day it is added: a derived list is only as current as its table.
//
//   id         stable slug; results and shares are keyed on the day number, but
//              the id is what the schedule freezes
//   kind       'player' | 'club' | 'nation': which names the guess box offers
//   title      the question, as the player reads it
//   clueLabel  what the small value beside each rank means
//   derive     { list, cols, mode }   mode 'last-different' walks the table from
//              its newest row and keeps each name the first time it appears;
//              mode 'all-winners' is every distinct name, newest win first, and
//              must come to exactly ten
//   slots      explicit lists: [{ name, clue }] in rank order, exactly ten.
//              A slot may carry `pin` (a pool id) or `born` (a birth year) to
//              say WHICH man of that name. ⚠️ Read the birth years in
//              `--print` for every new list: a name that is in the pool once
//              can still be the wrong man (see `player` in gen-top10.mjs).
//   near       explicit lists: [{ name, note }] the names just outside
//   club       a club list: the club's web slug ('manchester-united', the same
//              as /quiz/<slug>/ and ?club=<slug>). The app's Top 10 browser groups
//              lists by it, so a fan finds their club's lists (Alex, 15 Oct 2026).
//   asOf       explicit lists: the ISO date the ten were checked
//   source     explicit lists: where they were checked
// The league-champions lists carry an `until` in mid-March rather than at the
// last matchday, because a title can be won weeks early.
//
//   checked    ISO date an independent check against the web last passed.
//              gen-top10 refuses to ship or schedule a list without one.
//   until      ISO date of the next final or ceremony that could change the
//              list. It may be scheduled for any day before that, never on or
//              after it. Required once a list is checked.
//   also       { 'Name in the ten': ['Other name', ...] } names that are a fair
//              answer to this list only (Russia for the Soviet Union)
//   cluePrefix text put before every clue ("Euro " makes "Euro 2020")
//   nearMax    how many "just outside" names to keep (default 3)
//   note       one line shown under the question: what counts, and how level
//              entries are ordered. A ranked list needs it whenever a fan
//              could fairly ask "since when?" or "why is he above him?"
//              ⚠️ A list with a note needs a SHORT title (one line on a phone).
//              The screen is "Top 10", so the title is only the thing ranked:
//              "Most English league titles", not "The 10 clubs with the most
//              English league titles". Two lines of title plus a note pushed
//              the fifth row of the board under the keyboard (measured 9 Oct:
//              the board ended 496pt down against a limit near 470). The
//              builder enforces the lengths.
//
// RANKED LISTS (from 9 Oct 2026). Alex's rule: a Top 10 is ten different
// things ranked by a number, and the number is shown beside the rank. A ranked
// list is written out here (explicit) with the number as each slot's clue, and
// ships only if the cut is clean: the tenth and the eleventh must differ, or
// "the ten" is a matter of opinion. Each was researched from live sources and
// then re-derived by a second, independent checker told to break it; both
// reports are kept outside the repo (~/ball-iq-audit/2026-10-09/top10-ranked/).

export const TOP10_SPECS = [
  { id: 'ballon-dor-last-ten', checked: '2026-10-09', until: '2026-10-26', kind: 'player', clueLabel: 'Last won',
    title: "The last 10 different men's Ballon d'Or winners",
    derive: { list: 'ballon-dor-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'champions-league-last-ten', checked: '2026-10-09', until: '2027-06-05', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Champions League',
    derive: { list: 'champions-league-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'pl-golden-boot-last-ten', checked: '2026-10-09', until: '2027-05-30', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Premier League Golden Boot winners',
    derive: { list: 'premier-league-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'fa-cup-last-ten', checked: '2026-10-09', until: '2027-05-22', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the FA Cup',
    derive: { list: 'fa-cup-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'euro-winning-nations', checked: '2026-10-09', until: '2028-07-09', kind: 'nation', clueLabel: 'Last won',
    title: "Every nation to win the men's Euros", cluePrefix: 'Euro ',
    // UEFA credits both successors with the old states' records, so both are
    // fair answers here, and here only.
    also: { 'Soviet Union': ['Russia'], 'Czechoslovakia': ['Czech Republic', 'Slovakia'] },
    derive: { list: 'euro-winners', cols: ['Winner'], mode: 'all-winners' } },
  { id: 'world-cup-finalists-last-ten', checked: '2026-10-09', until: '2030-07-21', kind: 'nation', clueLabel: 'Last final',
    title: 'The last 10 different nations to play in a World Cup final',
    also: { 'Czechoslovakia': ['Czech Republic', 'Slovakia'] },
    // 13th would be Uruguay in 1950, which had a deciding match and no final.
    // Whether that counts is an argument, so the list stops at 12th.
    nearMax: 2,
    derive: { list: 'world-cup-winners', cols: ['Winner', 'Runner-up'], mode: 'last-different' } },
  { id: 'europa-league-last-ten', checked: '2026-10-09', until: '2027-05-26', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Europa League',
    derive: { list: 'europa-league-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'champions-league-beaten-finalists', checked: '2026-10-09', until: '2027-06-05', kind: 'club', clueLabel: 'Last lost',
    title: 'The last 10 different clubs to lose a Champions League final',
    derive: { list: 'champions-league-winners', cols: ['Runner-up'], mode: 'last-different' } },
  { id: 'league-cup-last-ten', checked: '2026-10-09', until: '2027-03-21', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the English League Cup',
    derive: { list: 'efl-cup-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'la-liga-top-scorer-last-ten', checked: '2026-10-09', until: '2027-05-29', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different La Liga top scorers',
    derive: { list: 'la-liga-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'serie-a-champions-last-ten', checked: '2026-10-09', until: '2027-03-15', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different Serie A champions',
    derive: { list: 'serie-a-champions', cols: ['Champions'], mode: 'last-different' } },
  { id: 'bundesliga-champions-last-ten', checked: '2026-10-09', until: '2027-03-15', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different Bundesliga champions',
    derive: { list: 'bundesliga-champions', cols: ['Champions'], mode: 'last-different' } },
  { id: 'champions-league-top-scorer-last-ten', checked: '2026-10-09', until: '2027-06-05', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Champions League top scorers',
    derive: { list: 'champions-league-top-scorers', cols: ['Player'], mode: 'last-different' } },
  // HELD 2026-10-09. The 2025 final was won by Senegal on the pitch and awarded
  // to Morocco by the confederation's appeal board; Senegal's appeal was heard
  // by the Court of Arbitration for Sport on 8 Oct 2026 with no award yet. The
  // list is right under one outcome and wrong under the other. Check again once
  // the award is published.
  { id: 'afcon-last-ten', kind: 'nation', clueLabel: 'Last won',
    title: 'The last 10 different nations to win the Africa Cup of Nations',
    derive: { list: 'afcon-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'copa-del-rey-last-ten', checked: '2026-10-09', until: '2027-04-24', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Copa del Rey',
    derive: { list: 'copa-del-rey-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'ligue-1-champions-last-ten', checked: '2026-10-09', until: '2027-03-15', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different Ligue 1 champions',
    derive: { list: 'ligue-1-champions', cols: ['Champions'], mode: 'last-different' } },
  { id: 'bundesliga-top-scorer-last-ten', checked: '2026-10-09', until: '2027-05-22', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Bundesliga top scorers',
    derive: { list: 'bundesliga-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'copa-libertadores-last-ten', checked: '2026-10-09', until: '2026-11-28', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Copa Libertadores',
    derive: { list: 'copa-libertadores-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'serie-a-top-scorer-last-ten', checked: '2026-10-09', until: '2027-05-30', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Serie A top scorers',
    derive: { list: 'serie-a-top-scorers', cols: ['Player'], mode: 'last-different' } },
  { id: 'dfb-pokal-last-ten', checked: '2026-10-09', until: '2027-05-29', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the DFB-Pokal',
    derive: { list: 'dfb-pokal-winners', cols: ['Winner'], mode: 'last-different' } },
  { id: 'coppa-italia-last-ten', checked: '2026-10-09', until: '2027-05-19', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Coppa Italia',
    derive: { list: 'coppa-italia-winners', cols: ['Winner'], mode: 'last-different' } },
  // HELD 2026-10-09. Every name and year is right, but FIFA calls the
  // Intercontinental Cup (from 2024) the continuation of the annual Club World
  // Cup, so a fan can fairly argue Paris Saint-Germain belong. An answer that
  // can be argued is not a fair question.
  { id: 'club-world-cup-last-ten', kind: 'club', clueLabel: 'Last won',
    title: 'The last 10 different clubs to win the Club World Cup',
    derive: { list: 'club-world-cup-winners', cols: ['Winner'], mode: 'last-different' } },
  // HELD 2026-10-09. The league names ONE top scorer when players finish level
  // (fewer penalty goals wins), and our table follows that for 2019-20 and
  // 2024-25 but lists both Giroud and Nenê for 2011-12. Fix that row in
  // scripts/seo/lists.mjs first, then check the list again.
  { id: 'ligue-1-top-scorer-last-ten', kind: 'player', clueLabel: 'Last won',
    title: 'The last 10 different Ligue 1 top scorers',
    derive: { list: 'ligue-1-top-scorers', cols: ['Player'], mode: 'last-different' } },

  // ── RANKED ─────────────────────────────────────────────────────────────────
  // Arsenal's 2025-26 title is their 14th. Counted season by season in three
  // lists that agree on all 127 titles (RSSSF, Wikipedia, Transfermarkt).
  // ⚠️ `until` is short on purpose. On 29 Sep 2026 the Premier League said an
  // independent commission had upheld its charges against Manchester City for
  // 2009-10 to 2017-18; City appealed on 1 Oct and the sanction is not yet
  // decided. Three of City's ten titles fall in those seasons. Nothing has
  // been taken away, the same ten clubs would remain either way, but City's
  // number could change. Re-check before every scheduling of this list.
  { id: 'english-league-titles', checked: '2026-10-09', until: '2026-11-30', kind: 'club',
    title: 'Most English league titles',
    note: 'Top-flight titles, 1888 to 2026. Ties go to whichever club got there first.',
    asOf: '2026-10-09',
    source: 'RSSSF England champions (14 Jun 2026); Premier League, 19 May 2026; counted season by season',
    slots: [
      { name: 'Manchester United', clue: '20 titles' },
      { name: 'Liverpool', clue: '20 titles' },
      { name: 'Arsenal', clue: '14 titles' },
      { name: 'Manchester City', clue: '10 titles' },
      { name: 'Everton', clue: '9 titles' },
      { name: 'Aston Villa', clue: '7 titles' },
      { name: 'Sunderland', clue: '6 titles' },
      { name: 'Chelsea', clue: '6 titles' },
      { name: 'Newcastle United', clue: '4 titles' },
      { name: 'Sheffield Wednesday', clue: '4 titles' },
    ],
    nearMax: 4,
    near: [
      { name: 'Blackburn Rovers', note: '3 titles, one short' },
      { name: 'Huddersfield Town', note: '3 titles, one short' },
      { name: 'Wolverhampton Wanderers', note: '3 titles, one short' },
      { name: 'Leeds United', note: '3 titles, one short' },
    ] },
  // The league's own count, which is the authority on its own record: both of
  // its data feeds, Opta and NBC agree on all thirteen. Transfermarkt alone has
  // Phil Neville on 504; the league's nineteen season figures for him sum to
  // 505 (Manchester United 263, Everton 242). Milner retired on 1 June 2026,
  // so nobody in the ten is active. The nearest active player is Jordan
  // Henderson on 464, who cannot reach 505 before 2027-28.
  { id: 'premier-league-appearances', checked: '2026-10-09', until: '2027-08-01', kind: 'player',
    title: 'Most Premier League appearances',
    note: 'Premier League games only, 1992 to today, on the league’s own count.',
    asOf: '2026-10-09',
    source: 'premierleague.com all-time appearances (read 9 Oct 2026); Opta Analyst, 1 Jun 2026',
    slots: [
      { name: 'James Milner', clue: '658 games' },
      { name: 'Gareth Barry', clue: '653 games' },
      { name: 'Ryan Giggs', clue: '632 games' },
      { name: 'Frank Lampard', clue: '609 games' },
      { name: 'David James', clue: '572 games' },
      { name: 'Gary Speed', clue: '535 games' },
      { name: 'Emile Heskey', clue: '516 games' },
      { name: 'Mark Schwarzer', clue: '514 games' },
      { name: 'Jamie Carragher', clue: '508 games' },
      { name: 'Phil Neville', clue: '505 games' },
    ],
    near: [
      { name: 'Rio Ferdinand', note: '504 games, one short' },
      { name: 'Steven Gerrard', note: '504 games, one short' },
      { name: 'Sol Campbell', note: '503 games, two short' },
    ] },
  // ── FIXED AT A PAST BOUNDARY ───────────────────────────────────────────────
  // Each of these is worded "to the end of 2025-26" (or of the 2026 World Cup),
  // so nothing an active player does can change it: the owner's preference for
  // lists that hold. `until` is the end of next season all the same, when the
  // wording would start to read as stale and a fresh list should replace it.
  // One outside source has Defoe on 163; the league, Opta and Wikipedia say 162.
  // Nobody in the ten played in the Premier League after May 2026 (Salah left).
  { id: 'premier-league-goals', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most Premier League goals',
    note: 'Premier League goals only, to the end of 2025-26, on the league’s own count.',
    asOf: '2026-10-09',
    source: 'premierleague.com all-time goals (read 9 Oct 2026); Opta Analyst, 18 May 2026',
    slots: [
      { name: 'Alan Shearer', clue: '260 goals' },
      { name: 'Harry Kane', clue: '213 goals' },
      { name: 'Wayne Rooney', clue: '208 goals' },
      { name: 'Mohamed Salah', clue: '193 goals' },
      { name: 'Andy Cole', clue: '187 goals' },
      { name: 'Sergio Agüero', clue: '184 goals' },
      { name: 'Frank Lampard', clue: '177 goals' },
      { name: 'Thierry Henry', clue: '175 goals' },
      { name: 'Robbie Fowler', clue: '163 goals' },
      { name: 'Jermain Defoe', clue: '162 goals' },
    ],
    near: [
      { name: 'Michael Owen', note: '150 goals, 12 short' },
      { name: 'Les Ferdinand', note: '149 goals, 13 short' },
      { name: 'Teddy Sheringham', note: '146 goals, 16 short' },
    ] },
  // Fixed at the World Cup on purpose. Kane has won four caps since and drew
  // level with Shilton on 125 on 6 Oct 2026; a list "as of today" would expire
  // at England's next match (12 Nov). He did not play the third-place match,
  // which is why he ended the tournament on 121.
  { id: 'england-caps', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most England caps (men)',
    note: 'England men’s caps at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'Englandstats.com, every cap numbered; the FA, 6 Oct 2026; RSSSF',
    slots: [
      { name: 'Peter Shilton', clue: '125 caps' },
      { name: 'Harry Kane', clue: '121 caps' },
      { name: 'Wayne Rooney', clue: '120 caps' },
      { name: 'David Beckham', clue: '115 caps' },
      { name: 'Steven Gerrard', clue: '114 caps' },
      { name: 'Bobby Moore', clue: '108 caps' },
      { name: 'Ashley Cole', clue: '107 caps' },
      { name: 'Bobby Charlton', clue: '106 caps' },
      { name: 'Frank Lampard', clue: '106 caps' },
      { name: 'Billy Wright', clue: '105 caps' },
    ],
    nearMax: 4,
    near: [
      { name: 'Kyle Walker', note: '96 caps, 9 short' },
      { name: 'John Stones', note: '94 caps, 11 short' },
      { name: 'Jordan Pickford', note: '91 caps, 14 short' },
      { name: 'Jordan Henderson', note: '91 caps, 14 short' },
    ] },
  // The boundary is needed: Rashford is back at United on 138. Giggs is level
  // with Spence only because one Charity Shield goal counts (all competitions).
  { id: 'manchester-united-top-scorers', club: 'manchester-united', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Manchester United’s top scorers',
    note: 'All competitions, to the end of 2025-26. Ties go to whoever got there first.',
    asOf: '2026-10-09',
    source: 'MUFCinfo all players, all goals; Wikipedia records page (26 Aug 2026)',
    slots: [
      { name: 'Wayne Rooney', clue: '253 goals' },
      { name: 'Bobby Charlton', clue: '249 goals' },
      { name: 'Denis Law', clue: '237 goals' },
      { name: 'Jack Rowley', clue: '211 goals' },
      { name: 'Dennis Viollet', clue: '179 goals' },
      { name: 'George Best', clue: '179 goals' },
      { name: 'Joe Spence', clue: '168 goals' },
      { name: 'Ryan Giggs', clue: '168 goals' },
      { name: 'Mark Hughes', clue: '163 goals' },
      { name: 'Paul Scholes', clue: '155 goals' },
    ],
    nearMax: 4,
    near: [
      { name: 'Ruud van Nistelrooy', note: '150 goals, 5 short' },
      { name: 'Stan Pearson', note: '148 goals, 7 short' },
      { name: 'David Herd', note: '145 goals, 10 short' },
      { name: 'Cristiano Ronaldo', note: '145 goals, 10 short' },
    ] },
  // Salah left in the summer of 2026 on 257.
  { id: 'liverpool-top-scorers', club: 'liverpool', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Liverpool’s top scorers',
    note: 'All competitions, to the end of 2025-26.',
    asOf: '2026-10-09',
    source: 'liverpoolfc.com and LFChistory.net, which agree on the top 25',
    slots: [
      { name: 'Ian Rush', clue: '346 goals' },
      { name: 'Roger Hunt', clue: '285 goals' },
      { name: 'Mohamed Salah', clue: '257 goals' },
      { name: 'Gordon Hodgson', clue: '241 goals' },
      { name: 'Billy Liddell', clue: '228 goals' },
      { name: 'Steven Gerrard', clue: '186 goals' },
      { name: 'Robbie Fowler', clue: '183 goals' },
      { name: 'Kenny Dalglish', clue: '172 goals' },
      { name: 'Michael Owen', clue: '158 goals' },
      { name: 'Harry Chambers', clue: '151 goals' },
    ],
    near: [
      { name: 'Sam Raybould', note: '130 goals, 21 short' },
      { name: 'Jack Parkinson', note: '128 goals, 23 short' },
      { name: 'Dick Forshaw', note: '124 goals, 27 short' },
    ] },
  // Brain and Drake are level on 139. "Got there first" puts Brain first, as
  // the club prints it; a fewer-games rule would put Drake first.
  { id: 'arsenal-top-scorers', club: 'arsenal', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Arsenal’s top scorers',
    note: 'All competitions, to the end of 2025-26. Ties go to whoever got there first.',
    asOf: '2026-10-09',
    source: 'arsenal.com goalscorers; Wikipedia records page (4 Sep 2026)',
    slots: [
      { name: 'Thierry Henry', clue: '228 goals' },
      { name: 'Ian Wright', clue: '185 goals' },
      { name: 'Cliff Bastin', clue: '178 goals' },
      { name: 'John Radford', clue: '149 goals' },
      { name: 'Jimmy Brain', clue: '139 goals' },
      { name: 'Ted Drake', clue: '139 goals' },
      { name: 'Doug Lishman', clue: '137 goals' },
      { name: 'Robin van Persie', clue: '132 goals' },
      { name: 'Joe Hulme', clue: '125 goals' },
      { name: 'David Jack', clue: '124 goals' },
    ],
    near: [
      { name: 'Dennis Bergkamp', note: '120 goals, 4 short' },
      { name: 'Reg Lewis', note: '118 goals, 6 short' },
      { name: 'Alan Smith', pin: 'Q703932', note: '115 goals, 9 short' }, // Arsenal's, born 1962; not the one born 1980
    ] },
  // Bentley is level with Osgood only because the club counts one Charity
  // Shield goal for him.
  { id: 'chelsea-top-scorers', club: 'chelsea', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Chelsea’s top scorers',
    note: 'All competitions, to the end of 2025-26. Ties go to whoever got there first.',
    asOf: '2026-10-09',
    source: 'chelseafc.com all-time record goalscorers (11 May 2026); Wikipedia records page',
    slots: [
      { name: 'Frank Lampard', clue: '211 goals' },
      { name: 'Bobby Tambling', clue: '202 goals' },
      { name: 'Kerry Dixon', clue: '193 goals' },
      { name: 'Didier Drogba', clue: '164 goals' },
      { name: 'Roy Bentley', clue: '150 goals' },
      { name: 'Peter Osgood', clue: '150 goals' },
      { name: 'Jimmy Greaves', clue: '132 goals' },
      { name: 'George Mills', clue: '125 goals' },
      { name: 'Eden Hazard', clue: '110 goals' },
      { name: 'George Hilsdon', clue: '108 goals' },
    ],
    near: [
      { name: 'Barry Bridges', note: '93 goals, 15 short' },
      { name: 'Tommy Baldwin', note: '92 goals, 16 short' },
      { name: 'Jimmy Floyd Hasselbaink', note: '87 goals, 21 short' },
    ] },
  // Greaves is 266 on the club's count (League 220, FA Cup 32, League Cup 5,
  // Europe 9). The 268 seen elsewhere adds two Charity Shield goals the club
  // does not count; counting them would move no place and not the cut. Five
  // of the lower numbers rest on the club's ledger alone.
  { id: 'tottenham-top-scorers', club: 'tottenham', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Tottenham’s top scorers',
    note: 'The club’s own count, Charity Shield not included, to the end of 2025-26.',
    asOf: '2026-10-09',
    source: 'tottenhamhotspur.com all-time top goalscorers and player pages; Wikipedia records page (2 Oct 2026)',
    slots: [
      { name: 'Harry Kane', clue: '280 goals' },
      { name: 'Jimmy Greaves', clue: '266 goals' },
      { name: 'Bobby Smith', clue: '208 goals' },
      { name: 'Martin Chivers', clue: '174 goals' },
      { name: 'Son Heung-min', clue: '173 goals' },
      { name: 'Cliff Jones', clue: '159 goals' },
      { name: 'Jermain Defoe', clue: '143 goals' },
      { name: 'George Hunt', clue: '138 goals' },
      { name: 'Len Duquemin', clue: '134 goals' },
      { name: 'Alan Gilzean', clue: '133 goals' },
    ],
    near: [
      { name: 'Teddy Sheringham', note: '124 goals, 9 short' },
      { name: 'Robbie Keane', note: '122 goals, 11 short' },
      { name: 'Les Bennett', note: '117 goals, 16 short' },
    ] },
  // ⚠️ Short `until`, for the same reason as english-league-titles: the
  // sanction in the Manchester City case is undecided and could take points
  // from past seasons. The ten could not change (City would need to lose more
  // than 858, and earned 714 in the seasons charged), but City's number and
  // the order of places 6 to 10 could.
  { id: 'premier-league-points', checked: '2026-10-09', until: '2026-11-30', kind: 'club',
    title: 'Most Premier League points ever',
    note: 'Every Premier League season from 1992-93 to 2025-26, added up.',
    asOf: '2026-10-09',
    source: 'The 34 final tables on premierleague.com, summed; Wikipedia season pages, 686 club-seasons, no mismatch',
    slots: [
      { name: 'Manchester United', clue: '2,614 points' },
      { name: 'Arsenal', clue: '2,473 points' },
      { name: 'Liverpool', clue: '2,402 points' },
      { name: 'Chelsea', clue: '2,366 points' },
      { name: 'Tottenham Hotspur', clue: '1,992 points' },
      { name: 'Manchester City', clue: '1,958 points' },
      { name: 'Everton', clue: '1,747 points' },
      { name: 'Newcastle United', clue: '1,656 points' },
      { name: 'Aston Villa', clue: '1,618 points' },
      { name: 'West Ham United', clue: '1,432 points' },
    ],
    near: [
      { name: 'Southampton', note: '1,100 points, 332 short' },
      { name: 'Blackburn Rovers', note: '970 points, 462 short' },
      { name: 'Leeds United', note: '867 points, 565 short' },
    ] },
  // "Completed" matters: one page counts the abandoned 1939-40 season for
  // Sunderland alone (88). Counted for nobody, as every club's own season list
  // has it, Sunderland are on 87. No body owns this number; it was counted.
  { id: 'english-top-flight-seasons', checked: '2026-10-09', until: '2027-06-01', kind: 'club',
    title: 'Most English top-flight seasons',
    note: 'Completed top-flight seasons, 1888-89 to 2025-26. Level clubs by who started there first.',
    asOf: '2026-10-09',
    source: 'Counted club by club over all 127 completed seasons; MyFootballFacts (5 Oct 2026)',
    slots: [
      { name: 'Everton', clue: '123 seasons' },
      { name: 'Aston Villa', clue: '112 seasons' },
      { name: 'Liverpool', clue: '111 seasons' },
      { name: 'Arsenal', clue: '109 seasons' },
      { name: 'Manchester United', clue: '101 seasons' },
      { name: 'Manchester City', clue: '97 seasons' },
      { name: 'Newcastle United', clue: '94 seasons' },
      { name: 'Chelsea', clue: '91 seasons' },
      { name: 'Tottenham Hotspur', clue: '91 seasons' },
      { name: 'Sunderland', clue: '87 seasons' },
    ],
    near: [
      { name: 'West Bromwich Albion', note: '81 seasons, 6 short' },
      { name: 'Bolton Wanderers', note: '73 seasons, 14 short' },
      { name: 'Blackburn Rovers', note: '72 seasons, 15 short' },
    ] },
  // Cannot change before the 2030 tournament opens on 8 June 2030. Sweden is
  // 21 in one table that counts a 1938 walkover; it is outside the ten either
  // way. Germany includes West Germany.
  { id: 'world-cup-matches-won', checked: '2026-10-09', until: '2030-06-08', kind: 'nation',
    title: 'Most World Cup matches won',
    note: 'World Cup matches won, 1930 to 2026. A shoot-out is a draw. Level nations by all-time points.',
    asOf: '2026-10-09',
    source: 'Wikipedia World Cup records, overall team records (6 Oct 2026); Transfermarkt all-time table; all 104 matches of 2026 tallied',
    slots: [
      { name: 'Brazil', clue: '79 wins' },
      { name: 'Germany', clue: '70 wins' },
      { name: 'Argentina', clue: '54 wins' },
      { name: 'Italy', clue: '45 wins' },
      { name: 'France', clue: '45 wins' },
      { name: 'England', clue: '38 wins' },
      { name: 'Spain', clue: '38 wins' },
      { name: 'Netherlands', clue: '32 wins' },
      { name: 'Uruguay', clue: '25 wins' },
      { name: 'Belgium', clue: '24 wins' },
    ],
    near: [
      { name: 'Mexico', note: '21 wins, 3 short' },
      { name: 'Sweden', note: '20 wins, 4 short' },
    ] },
  // Schwarzer 151 and Seaman 140: an older feed of the league's says 152 and
  // 141, each one match too many in 2001-02 (all 38 games of both clubs that
  // season were gone through). The league's website and Opta have it right.
  { id: 'premier-league-clean-sheets', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most Premier League clean sheets',
    note: 'Goalkeepers, Premier League only, to the end of 2025-26. Level keepers by fewer games.',
    asOf: '2026-10-09',
    source: 'premierleague.com clean sheets, goalkeepers (read 9 Oct 2026); Opta Analyst, 7 Aug 2026',
    slots: [
      { name: 'Petr Čech', clue: '202 clean sheets' },
      { name: 'David James', clue: '169 clean sheets' },
      { name: 'Mark Schwarzer', clue: '151 clean sheets' },
      { name: 'David de Gea', clue: '147 clean sheets' },
      { name: 'David Seaman', clue: '140 clean sheets' },
      { name: 'Nigel Martyn', clue: '137 clean sheets' },
      { name: 'Pepe Reina', clue: '136 clean sheets' },
      { name: 'Edwin van der Sar', clue: '132 clean sheets' },
      { name: 'Tim Howard', clue: '132 clean sheets' },
      { name: 'Brad Friedel', clue: '132 clean sheets' },
    ],
    near: [
      { name: 'Peter Schmeichel', note: '128 clean sheets, 4 short' },
      { name: 'Joe Hart', note: '127 clean sheets, 5 short' },
      { name: 'Hugo Lloris', note: '127 clean sheets, 5 short' },
    ] },

  // THIRD BATCH (9 Oct 2026, evening). Twelve candidates went out; six were
  // rejected by the first researcher for a tie at the cut or a tenth place
  // that depends on the source (World Cup matches played, Champions League
  // appearances, German grounds, German titles, Barcelona and Bayern scorers).
  // Reports: ~/ball-iq-audit/2026-10-09/top10-ranked/research-3a.md, -3b.md,
  // verify-3a.md, verify-3b.md.

  // UEFA's own statistics feed, read directly, with qualifying left out. With
  // qualifiers in, Shevchenko (59) joins and Kane and Salah tie on 54: the
  // note is what makes this ten the ten. Fixed at the season's end because
  // Mbappé, Haaland and Kane are all still scoring (71, 59 and 55 on 9 Oct).
  // No third near miss: thirteenth is Ibrahimović and Shevchenko level on 48.
  { id: 'champions-league-goals', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most Champions League goals',
    note: 'UEFA’s count, qualifying left out, to the end of 2025-26. Level players by fewer games.',
    asOf: '2026-10-09',
    source: 'UEFA statistics feed, tournament phase (read 9 Oct 2026); uefa.com all-time top scorers, 10 Sep 2026; RSSSF, 18 Jun 2026',
    slots: [
      { name: 'Cristiano Ronaldo', clue: '140 goals' },
      { name: 'Lionel Messi', clue: '129 goals' },
      { name: 'Robert Lewandowski', clue: '109 goals' },
      { name: 'Karim Benzema', clue: '90 goals' },
      { name: 'Raúl', clue: '71 goals' },
      { name: 'Kylian Mbappé', clue: '70 goals' },
      { name: 'Erling Haaland', clue: '57 goals' },
      { name: 'Thomas Müller', clue: '57 goals' },
      { name: 'Ruud van Nistelrooy', clue: '56 goals' },
      { name: 'Harry Kane', clue: '54 goals' },
    ],
    nearMax: 2,
    near: [
      { name: 'Thierry Henry', note: '50 goals, 4 short' },
      { name: 'Mohamed Salah', note: '50 goals, 4 short' },
    ] },
  // The CLUB's figures, all ten re-read from realmadrid.com. Six of them
  // differ by one to three elsewhere (Ronaldo 450 on the databases: a goal at
  // Real Sociedad in September 2010 that the league gave to Pepe). ⚠️ Never
  // mix sets: English Wikipedia has Pirri 171 and Butragueño 170, and taking
  // one from each ties them. The order is the same on every single source.
  // Two near misses only: thirteenth is Vinícius or Hierro depending on source.
  { id: 'real-madrid-top-scorers', club: 'real-madrid', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Real Madrid’s all-time top scorers',
    note: 'Official matches to the end of 2025-26, by the club’s own count.',
    asOf: '2026-10-09',
    source: 'realmadrid.com, each player’s own page (read 9 Oct 2026); Spanish Wikipedia record table; BDFutbol',
    slots: [
      { name: 'Cristiano Ronaldo', clue: '451 goals' },
      { name: 'Karim Benzema', clue: '354 goals' },
      { name: 'Raúl', clue: '323 goals' },
      { name: 'Alfredo Di Stéfano', clue: '308 goals' },
      { name: 'Santillana', clue: '290 goals' },
      { name: 'Ferenc Puskás', clue: '242 goals' },
      { name: 'Hugo Sánchez', clue: '208 goals' },
      { name: 'Paco Gento', clue: '182 goals' },
      { name: 'Pirri', clue: '172 goals' },
      { name: 'Emilio Butragueño', clue: '171 goals' },
    ],
    nearMax: 2,
    near: [
      { name: 'Amancio Amaro', note: '155 goals, 16 short' },
      { name: 'Míchel', pin: 'Q558689', note: '130 goals, 41 short' },
    ] },
  // BDFutbol's numbers, which Atlético de Madrid's own site prints for the
  // same ten in the same order. Zarra is 251 (La Liga's site agrees; 254 is
  // Transfermarkt alone), Quini 217 (219 elsewhere), Pahiño 212 (213, 214).
  // No variant changes the order or the cut. English Wikipedia's table mixes
  // sets, so it is not the source. Griezmann left for Orlando City in July
  // 2026 on 205; the nearest man still in the league is Iago Aspas on 171.
  { id: 'la-liga-goals', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most La Liga goals',
    note: 'Spanish top division only, to the end of 2025-26, by BDFutbol’s count.',
    asOf: '2026-10-09',
    source: 'BDFutbol all-time scorers (read 9 Oct 2026); atleticodemadrid.com; laliga.com for Zarra',
    slots: [
      { name: 'Lionel Messi', clue: '474 goals' },
      { name: 'Cristiano Ronaldo', clue: '311 goals' },
      { name: 'Telmo Zarra', clue: '251 goals' },
      { name: 'Karim Benzema', clue: '238 goals' },
      { name: 'Hugo Sánchez', clue: '234 goals' },
      { name: 'Raúl', clue: '228 goals' },
      { name: 'Alfredo Di Stéfano', clue: '227 goals' },
      { name: 'César Rodríguez', clue: '221 goals' },
      { name: 'Quini', clue: '217 goals' },
      { name: 'Pahiño', clue: '212 goals' },
    ],
    near: [
      { name: 'Antoine Griezmann', note: '205 goals, 7 short' },
      { name: 'Mundo', note: '196 goals, 16 short' },
      { name: 'Santillana', note: '186 goals, 26 short' },
    ] },
  // Alex's idea. ⚠️ THE CUT IS ONE GAME, and it closes this season: Jordan
  // Pickford ended 2025-26 on 362, is on 367, draws level with tenth at
  // Everton's match on 5 Dec 2026 and passes it on the 12th if he plays them
  // all. Hence the early `until`. The league's older statistics feed has
  // Given 450 and Robinson 374, each one game short in 2009-10; the league's
  // own line-ups, its website and Soccerbase game by game say 451 and 375.
  { id: 'premier-league-goalkeeper-appearances', checked: '2026-10-09', until: '2026-12-05', kind: 'player',
    title: 'Most Premier League games in goal',
    note: 'Goalkeepers, Premier League only, to the end of 2025-26.',
    asOf: '2026-10-09',
    source: 'premierleague.com appearances, goalkeepers (read 9 Oct 2026); Soccerbase game by game; Transfermarkt',
    slots: [
      { name: 'David James', clue: '572 games' },
      { name: 'Mark Schwarzer', clue: '514 games' },
      { name: 'Shay Given', clue: '451 games' },
      { name: 'Brad Friedel', clue: '450 games' },
      { name: 'Petr Čech', clue: '443 games' },
      { name: 'Jussi Jääskeläinen', clue: '436 games' },
      { name: 'David de Gea', clue: '415 games' },
      { name: 'Tim Howard', clue: '399 games' },
      { name: 'Ben Foster', clue: '390 games' },
      { name: 'Łukasz Fabiański', clue: '376 games' },
    ],
    near: [
      { name: 'Paul Robinson', pin: 'Q215824', note: '375 games, 1 short' },
      { name: 'Nigel Martyn', note: '372 games, 4 short' },
      { name: 'Thomas Sørensen', note: '364 games, 12 short' },
    ] },
  // The league's count, which Opta shares; Transfermarkt differs on almost
  // every number (Giggs 169, Milner 87), so the note names the league. No
  // source orders Bergkamp and Salah; fewer games puts Bergkamp first (315 v
  // 328), and so does "got there first". Two near misses only: Sheringham is
  // thirteenth on 75 or 76 depending on the feed. De Bruyne (Napoli) and
  // Salah (Trabzonspor) have left the league; Bruno Fernandes, 73, is the
  // nearest man still in it.
  { id: 'premier-league-assists', checked: '2026-10-09', until: '2027-03-01', kind: 'player',
    title: 'Most Premier League assists',
    note: 'On the Premier League’s own count, to the end of 2025-26. Level players by fewer games.',
    asOf: '2026-10-09',
    source: 'premierleague.com all-time assists (read 9 Oct 2026); Opta Analyst, 24 May 2026',
    slots: [
      { name: 'Ryan Giggs', clue: '162 assists' },
      { name: 'Kevin De Bruyne', clue: '119 assists' },
      { name: 'Cesc Fàbregas', clue: '111 assists' },
      { name: 'Wayne Rooney', clue: '103 assists' },
      { name: 'Frank Lampard', clue: '102 assists' },
      { name: 'Dennis Bergkamp', clue: '94 assists' },
      { name: 'Mohamed Salah', clue: '94 assists' },
      { name: 'David Silva', clue: '93 assists' },
      { name: 'Steven Gerrard', clue: '92 assists' },
      { name: 'James Milner', clue: '90 assists' },
    ],
    nearMax: 2,
    near: [
      { name: 'David Beckham', note: '80 assists, 10 short' },
      { name: 'Christian Eriksen', note: '78 assists, 12 short' },
    ] },
  // The same ten at the end of the 2026 World Cup and on 9 Oct 2026: nobody
  // in it still plays for Spain (nearest: Morata 87, Rodri 74). Torres got to
  // 110 on 23 Jun 2014, Fàbregas on 27 Jun 2016; Raúl to 102 in 2006, Piqué
  // in 2018 (federation pages). Busquets's 143 is on the federation's site.
  { id: 'spain-caps', checked: '2026-10-09', until: '2027-06-01', kind: 'player',
    title: 'Most Spain caps (men)',
    note: 'Spain men’s caps at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'RFEF player pages; RSSSF, 14 Mar 2026; Transfermarkt (read 9 Oct 2026)',
    slots: [
      { name: 'Sergio Ramos', clue: '180 caps' },
      { name: 'Iker Casillas', clue: '167 caps' },
      { name: 'Sergio Busquets', clue: '143 caps' },
      { name: 'Xavi Hernández', clue: '133 caps' },
      { name: 'Andrés Iniesta', clue: '131 caps' },
      { name: 'Andoni Zubizarreta', clue: '126 caps' },
      { name: 'David Silva', clue: '125 caps' },
      { name: 'Xabi Alonso', clue: '114 caps' },
      { name: 'Fernando Torres', clue: '110 caps' },
      { name: 'Cesc Fàbregas', clue: '110 caps' },
    ],
    near: [
      { name: 'Raúl', note: '102 caps, 8 short' },
      { name: 'Gerard Piqué', note: '102 caps, 8 short' },
      { name: 'Carles Puyol', note: '100 caps, 10 short' },
    ] },

  // FOURTH BATCH (11 Oct 2026). Twelve candidates; reports research-4a/4b.md
  // and verify-4a/4b.md beside the others. Rejected or held: Everton's scorers
  // (the club prints five, the sources disagree on tenth), Spanish grounds
  // (ninety seats at the cut, three grounds rebuilt or borrowed: the third
  // country where a grounds list failed, so no more of those), Tottenham's
  // appearances (Kane three short of tenth, club and Wikipedia disagree on the
  // ten), Newcastle's scorers (the club gives Macdonald two totals).

  // Fixed at the World Cup. Mbappé is ninth on 106 there and drew level with
  // Vieira on 107 on 25 Sep 2026; France next play on 12 Nov. Giroud got to 137
  // on 9 Jul 2024, Griezmann on 9 Sep 2024. The three on 97 are in the order
  // they got there (Blanc 2000, Lizarazu 2004, Benzema 2022).
  { id: 'france-caps', checked: '2026-10-11', until: '2027-06-01', kind: 'player',
    title: 'Most France caps (men)',
    note: 'France men’s caps at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'FFF statistics page of 18 Sep 2026; RSSSF; Transfermarkt (read 11 Oct 2026)',
    slots: [
      { name: 'Hugo Lloris', clue: '145 caps' },
      { name: 'Lilian Thuram', clue: '142 caps' },
      { name: 'Olivier Giroud', clue: '137 caps' },
      { name: 'Antoine Griezmann', clue: '137 caps' },
      { name: 'Thierry Henry', clue: '123 caps' },
      { name: 'Marcel Desailly', clue: '116 caps' },
      { name: 'Zinedine Zidane', clue: '108 caps' },
      { name: 'Patrick Vieira', clue: '107 caps' },
      { name: 'Kylian Mbappé', clue: '106 caps' },
      { name: 'Didier Deschamps', clue: '103 caps' },
    ],
    near: [
      { name: 'Laurent Blanc', note: '97 caps, 6 short' },
      { name: 'Bixente Lizarazu', note: '97 caps, 6 short' },
      { name: 'Karim Benzema', note: '97 caps, 6 short' },
    ] },
  // Fixed at the World Cup: Mbappé had 66 there and has 67 now. Fontaine got
  // to 30 on 16 Mar 1960 (in 21 caps), Papin on 13 Dec 1994. One near miss:
  // the federation prints only its top ten, and twelfth is not settled.
  { id: 'france-top-scorers', checked: '2026-10-11', until: '2027-06-01', kind: 'player',
    title: 'France’s top scorers (men)',
    note: 'Goals for France at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'FFF statistics page of 18 Sep 2026; RSSSF; Transfermarkt (read 11 Oct 2026)',
    slots: [
      { name: 'Kylian Mbappé', clue: '66 goals' },
      { name: 'Olivier Giroud', clue: '57 goals' },
      { name: 'Thierry Henry', clue: '51 goals' },
      { name: 'Antoine Griezmann', clue: '44 goals' },
      { name: 'Michel Platini', clue: '41 goals' },
      { name: 'Karim Benzema', clue: '37 goals' },
      { name: 'David Trezeguet', clue: '34 goals' },
      { name: 'Zinedine Zidane', clue: '31 goals' },
      { name: 'Just Fontaine', clue: '30 goals' },
      { name: 'Jean-Pierre Papin', clue: '30 goals' },
    ],
    nearMax: 1,
    near: [
      { name: 'Youri Djorkaeff', note: '28 goals, 2 short' },
    ] },
  // The DFB's own table: pre-war Germany, West Germany, and Germany since 1990.
  // East Germany is another team with another record (Joachim Streich would be
  // third on a count of both), so the note says which Germany. Völler got to
  // 47 in 1994, Klinsmann in 1998; Rummenigge to 45 in 1986, Müller in 2023.
  // Two near misses: thirteenth is Gómez and Lehner level on 31. Nobody active
  // is close (Gnabry 26, Havertz 25).
  { id: 'germany-top-scorers', checked: '2026-10-11', until: '2027-06-01', kind: 'player',
    title: 'Germany’s top scorers (men)',
    note: 'Germany and West Germany, not East, to 11 Oct 2026. Ties go to whoever got there first.',
    asOf: '2026-10-11',
    source: 'DFB record scorers, stamped 11 Oct 2026; RSSSF; Transfermarkt',
    slots: [
      { name: 'Miroslav Klose', clue: '71 goals' },
      { name: 'Gerd Müller', clue: '68 goals' },
      { name: 'Lukas Podolski', clue: '49 goals' },
      { name: 'Rudi Völler', clue: '47 goals' },
      { name: 'Jürgen Klinsmann', clue: '47 goals' },
      { name: 'Karl-Heinz Rummenigge', clue: '45 goals' },
      { name: 'Thomas Müller', clue: '45 goals' },
      { name: 'Uwe Seeler', clue: '43 goals' },
      { name: 'Michael Ballack', clue: '42 goals' },
      { name: 'Oliver Bierhoff', clue: '37 goals' },
    ],
    nearMax: 2,
    near: [
      { name: 'Fritz Walter', note: '33 goals, 4 short' },
      { name: 'Klaus Fischer', note: '32 goals, 5 short' },
    ] },
  // Italy were not at the 2026 World Cup, so this one is dated, not pinned to
  // it. Facchetti's 94 is the federation's count (it includes a 1976 match in
  // the United States that some other federations do not count; without it he
  // has 93 and is still tenth). De Rossi got to 117 in 2017, Chiellini in 2022.
  // ⚠️ ONE near miss on purpose. Twelfth is Donnarumma, who is still playing
  // (87 today, and every match would make his number here wrong); he cannot
  // reach Del Piero's 91 before late March 2027 or the ten before late
  // September 2027.
  { id: 'italy-caps', checked: '2026-10-11', until: '2027-03-01', kind: 'player',
    title: 'Most Italy caps (men)',
    note: 'Italy men’s caps as of 11 October 2026. Ties go to whoever got there first.',
    asOf: '2026-10-11',
    source: 'FIGC records and match list; RSSSF; Transfermarkt (read 11 Oct 2026)',
    slots: [
      { name: 'Gianluigi Buffon', clue: '176 caps' },
      { name: 'Fabio Cannavaro', clue: '136 caps' },
      { name: 'Paolo Maldini', clue: '126 caps' },
      { name: 'Leonardo Bonucci', clue: '121 caps' },
      { name: 'Daniele De Rossi', clue: '117 caps' },
      { name: 'Giorgio Chiellini', clue: '117 caps' },
      { name: 'Andrea Pirlo', clue: '116 caps' },
      { name: 'Dino Zoff', clue: '112 caps' },
      { name: 'Gianluca Zambrotta', clue: '98 caps' },
      { name: 'Giacinto Facchetti', clue: '94 caps' },
    ],
    nearMax: 1,
    near: [
      { name: 'Alessandro Del Piero', note: '91 caps, 3 short' },
    ] },
  // The club's count (MUFCinfo, which the club and Wikipedia both use). Do NOT
  // read manutd.com's November 2023 "Hall of Fame" page: it has Stepney 535 and
  // de Gea 511. Nobody at the club can reach the ten this season: Rashford is
  // on 433 and tops out near 492.
  { id: 'manchester-united-appearances', club: 'manchester-united', checked: '2026-10-11', until: '2027-08-01', kind: 'player',
    title: 'Most Manchester United appearances',
    note: 'All competitions, to the end of 2025-26, on the club’s own count.',
    asOf: '2026-10-11',
    source: 'MUFCinfo all-players table (read 11 Oct 2026); manutd.com, 3 Jan and 8 Jul 2023; Wikipedia records table',
    slots: [
      { name: 'Ryan Giggs', clue: '963 games' },
      { name: 'Bobby Charlton', clue: '758 games' },
      { name: 'Paul Scholes', clue: '718 games' },
      { name: 'Bill Foulkes', clue: '688 games' },
      { name: 'Gary Neville', clue: '602 games' },
      { name: 'Wayne Rooney', clue: '559 games' },
      { name: 'David de Gea', clue: '545 games' },
      { name: 'Alex Stepney', clue: '539 games' },
      { name: 'Tony Dunne', clue: '535 games' },
      { name: 'Denis Irwin', clue: '529 games' },
    ],
    near: [
      { name: 'Joe Spence', note: '510 games, 19 short' },
      { name: 'Arthur Albiston', note: '485 games, 44 short' },
      { name: 'Roy Keane', note: '480 games, 49 short' },
    ] },
  // liverpoolfc.com and LFChistory print the same 25 names and numbers. Hughes
  // and Clemence are level on 665: Hughes got there on 4 Apr 1979, in his last
  // match, Clemence on 27 May 1981 (the club prints "=4", Clemence first).
  // Salah left in 2026 on 442; van Dijk is on 380.
  { id: 'liverpool-appearances', club: 'liverpool', checked: '2026-10-11', until: '2027-08-01', kind: 'player',
    title: 'Most Liverpool appearances',
    note: 'All competitions to the end of 2025-26, the club’s count. Level players by who got there first.',
    asOf: '2026-10-11',
    source: 'liverpoolfc.com all-time appearances (read 11 Oct 2026); LFChistory.net',
    slots: [
      { name: 'Ian Callaghan', clue: '857 games' },
      { name: 'Jamie Carragher', clue: '737 games' },
      { name: 'Steven Gerrard', clue: '710 games' },
      { name: 'Emlyn Hughes', clue: '665 games' },
      { name: 'Ray Clemence', clue: '665 games' },
      { name: 'Ian Rush', clue: '660 games' },
      { name: 'Phil Neal', clue: '650 games' },
      { name: 'Tommy Smith', born: 1945, clue: '638 games' }, // not the pool's Tommy Smith (born 1990)
      { name: 'Bruce Grobbelaar', clue: '628 games' },
      { name: 'Alan Hansen', clue: '620 games' },
    ],
    near: [
      { name: 'Chris Lawler', note: '549 games, 71 short' },
      { name: 'Billy Liddell', note: '534 games, 86 short' },
      { name: 'Kenny Dalglish', note: '515 games, 105 short' },
    ] },
  // The club's records page and its own player pages ("477 appearances for
  // Arsenal, the 10th highest of all time" on Simpson's). One near miss:
  // twelfth is Ray Parlour on 466, 465 or about 470 depending on who counts.
  // Saka is on 320.
  { id: 'arsenal-appearances', club: 'arsenal', checked: '2026-10-11', until: '2027-08-01', kind: 'player',
    title: 'Most Arsenal appearances',
    note: 'All competitions, to the end of 2025-26, on the club’s own count.',
    asOf: '2026-10-11',
    source: 'arsenal.com records and player pages (read 11 Oct 2026); Wikipedia records table, 4 Sep 2026',
    slots: [
      { name: 'David O\'Leary', clue: '722 games' },
      { name: 'Tony Adams', clue: '669 games' },
      { name: 'George Armstrong', clue: '621 games' },
      { name: 'Lee Dixon', clue: '619 games' },
      { name: 'Nigel Winterburn', clue: '584 games' },
      { name: 'David Seaman', clue: '564 games' },
      { name: 'Pat Rice', clue: '528 games' },
      { name: 'Peter Storey', clue: '501 games' },
      { name: 'John Radford', clue: '481 games' },
      { name: 'Peter Simpson', clue: '477 games' },
    ],
    nearMax: 1,
    near: [
      { name: 'Bob John', note: '470 games, 7 short' },
    ] },
  // ⚠️ "CHELSEA'S OWN COUNT" IS THE LIST. The club counts the Full Members' Cup
  // and the 1988 play-offs, and Kerry Dixon is tenth because of them: on league
  // and major cups alone he has 396 and McCreadie (410), Clarke and Ken
  // Armstrong are all ahead of him. The club's own "400 club" article has his
  // 400th game on Boxing Day 1991, so this is how Chelsea itself counts, and
  // the note says so in as many words. Without those words this list is wrong.
  { id: 'chelsea-appearances', club: 'chelsea', checked: '2026-10-11', until: '2027-08-01', kind: 'player',
    title: 'Most Chelsea appearances',
    note: 'Chelsea’s own count, which includes the Full Members’ Cup and play-offs. To the end of 2025-26.',
    asOf: '2026-10-11',
    source: 'chelseafc.com, all-time record appearance-makers (read 11 Oct 2026); Bounder database; Wikipedia, 18 Sep 2026',
    slots: [
      { name: 'Ron Harris', clue: '795 games' },
      { name: 'Peter Bonetti', clue: '729 games' },
      { name: 'John Terry', clue: '717 games' },
      { name: 'Frank Lampard', clue: '648 games' },
      { name: 'John Hollins', clue: '592 games' },
      { name: 'César Azpilicueta', clue: '508 games' },
      { name: 'Petr Čech', clue: '494 games' },
      { name: 'Dennis Wise', clue: '445 games' },
      { name: 'Steve Clarke', clue: '421 games' },
      { name: 'Kerry Dixon', clue: '420 games' },
    ],
    near: [
      { name: 'Eddie McCreadie', note: '410 games, 10 short' },
      { name: 'John Bumstead', note: '409 games, 11 short' },
      { name: 'Ken Armstrong', note: '402 games, 18 short' },
    ] },
  // ── Batch 5 (14 Oct 2026): researched from two sources each, then re-derived
  // by an independent checker (22 PASS, 1 FIX applied: world-cup-appearances
  // keeps one near name, as Serbia ties Switzerland on 13).

  { id: 'champions-league-finals', checked: '2026-10-14', kind: 'club', clueLabel: 'Finals',
    title: 'Most Champions League finals',
    note: 'European Cup and Champions League, 1956 to the 2026 final. Level clubs by most recent final.',
    asOf: '2026-10-14',
    source: 'RSSSF Champions League finals 1956-2026 (updated 18 Jun 2026); Wikipedia list of finals, rev 9 Oct 2026, counted final by final; UEFA match feed for 2026',
    until: '2027-04-27',
    slots: [
      { name: 'Real Madrid', clue: '18 finals' },
      { name: 'Bayern Munich', clue: '11 finals' },
      { name: 'AC Milan', clue: '11 finals' },
      { name: 'Liverpool', clue: '10 finals' },
      { name: 'Juventus', clue: '9 finals' },
      { name: 'Barcelona', clue: '8 finals' },
      { name: 'Inter Milan', clue: '7 finals' },
      { name: 'Benfica', clue: '7 finals' },
      { name: 'Ajax', clue: '6 finals' },
      { name: 'Manchester United', clue: '5 finals' },
    ],
    near: [
      { name: 'Paris Saint-Germain', note: '3 finals, 2 short' },
      { name: 'Borussia Dortmund', note: '3 finals, 2 short' },
      { name: 'Chelsea', note: '3 finals, 2 short' },
    ] },
  { id: 'premier-league-wins', checked: '2026-10-14', kind: 'player', clueLabel: 'Wins',
    title: 'Most Premier League wins',
    note: 'Games won that he played in, league’s own count, to the end of 2025-26. Level by fewer games.',
    asOf: '2026-10-14',
    source: 'Premier League stats feed, all-time wins (read 14 Oct 2026); StatMuse FC career Premier League wins (read 14 Oct 2026)',
    until: '2027-06-01',
    slots: [
      { name: 'Ryan Giggs', clue: '407 wins' },
      { name: 'Frank Lampard', clue: '349 wins' },
      { name: 'James Milner', clue: '336 wins' },
      { name: 'Paul Scholes', clue: '321 wins' },
      { name: 'John Terry', clue: '311 wins' },
      { name: 'Rio Ferdinand', clue: '291 wins' },
      { name: 'Wayne Rooney', clue: '284 wins' },
      { name: 'Petr Čech', clue: '280 wins' },
      { name: 'Phil Neville', clue: '280 wins' },
      { name: 'Michael Carrick', clue: '266 wins' },
    ],
    near: [
      { name: 'Kyle Walker', note: '264 wins, 2 short' },
      { name: 'Jamie Carragher', note: '264 wins, 2 short' },
      { name: 'Gareth Barry', note: '262 wins, 4 short' },
    ] },
  { id: 'real-madrid-appearances', club: 'real-madrid', checked: '2026-10-14', kind: 'player', clueLabel: 'Games',
    title: 'Most Real Madrid appearances',
    note: 'Official matches to the end of 2025-26, by the club’s own count.',
    asOf: '2026-10-14',
    source: 'realmadrid.com, 15 Mar 2025 list and Modrić’s page (read 14 Oct 2026); Transfermarkt record players',
    until: '2027-06-01',
    slots: [
      { name: 'Raúl', clue: '741 games' },
      { name: 'Iker Casillas', clue: '725 games' },
      { name: 'Manolo Sanchís', born: 1965, clue: '710 games' },
      { name: 'Sergio Ramos', clue: '671 games' },
      { name: 'Karim Benzema', clue: '648 games' },
      { name: 'Santillana', clue: '645 games' },
      { name: 'Fernando Hierro', clue: '601 games' },
      { name: 'Paco Gento', clue: '600 games' },
      { name: 'Luka Modrić', clue: '597 games' },
      { name: 'José Antonio Camacho', clue: '577 games' },
    ],
    nearMax: 1,
    near: [
      { name: 'Pirri', note: '561 games, 16 short' },
    ] },
  { id: 'barcelona-appearances', club: 'barcelona', checked: '2026-10-14', kind: 'player', clueLabel: 'Games',
    title: 'Most Barcelona appearances',
    note: 'Official matches to the end of 2025-26, by the club’s own count.',
    asOf: '2026-10-14',
    source: 'fcbarcelona.com articles, 2022 to 2024 (read 14 Oct 2026); BDFutbol Barcelona players; Transfermarkt',
    until: '2027-06-01',
    slots: [
      { name: 'Lionel Messi', clue: '778 games' },
      { name: 'Xavi Hernández', clue: '767 games' },
      { name: 'Sergio Busquets', clue: '722 games' },
      { name: 'Andrés Iniesta', clue: '674 games' },
      { name: 'Gerard Piqué', clue: '616 games' },
      { name: 'Carles Puyol', clue: '593 games' },
      { name: 'Migueli', clue: '549 games' },
      { name: 'Víctor Valdés', clue: '535 games' },
      { name: 'Jordi Alba', clue: '459 games' },
      { name: 'Carles Rexach', clue: '450 games' },
    ],
    nearMax: 1,
    near: [
      { name: 'Marc-André ter Stegen', note: '423 games, 27 short' },
    ] },
  { id: 'spain-top-scorers', checked: '2026-10-14', kind: 'player', clueLabel: 'Goals',
    title: 'Spain’s top scorers (men)',
    note: 'Goals for Spain at the end of the 2026 World Cup.',
    asOf: '2026-07-19',
    source: 'RSSSF, 14 Mar 2026, plus each 2026 goal checked match by match; Wikipedia records table, 6 Oct 2026',
    until: '2027-06-01',
    slots: [
      { name: 'David Villa', clue: '59 goals' },
      { name: 'Raúl', clue: '44 goals' },
      { name: 'Fernando Torres', clue: '38 goals' },
      { name: 'Álvaro Morata', clue: '37 goals' },
      { name: 'David Silva', clue: '35 goals' },
      { name: 'Mikel Oyarzabal', clue: '30 goals' },
      { name: 'Fernando Hierro', clue: '29 goals' },
      { name: 'Fernando Morientes', clue: '27 goals' },
      { name: 'Emilio Butragueño', clue: '26 goals' },
      { name: 'Ferran Torres', clue: '25 goals' },
    ],
    near: [
      { name: 'Alfredo Di Stéfano', note: '23 goals, 2 short' },
      { name: 'Sergio Ramos', note: '23 goals, 2 short' },
      { name: 'Julio Salinas', note: '22 goals, 3 short' },
    ] },
  { id: 'la-liga-seasons', checked: '2026-10-14', kind: 'club', clueLabel: 'Seasons',
    title: 'Most La Liga seasons',
    note: 'Completed seasons, 1929 to 2025-26. Level clubs in all-time points-table order.',
    asOf: '2026-10-14',
    source: 'Spanish Wikipedia all-time table, to 2025-26 (read 14 Oct 2026); RSSSF all-time table to 2024-25 plus 2025-26',
    until: '2027-06-01',
    slots: [
      { name: 'Real Madrid', clue: '95 seasons' },
      { name: 'Barcelona', clue: '95 seasons' },
      { name: 'Athletic Bilbao', clue: '95 seasons' },
      { name: 'Valencia', clue: '91 seasons' },
      { name: 'Atlético Madrid', clue: '89 seasons' },
      { name: 'Espanyol', clue: '89 seasons' },
      { name: 'Sevilla', clue: '82 seasons' },
      { name: 'Real Sociedad', clue: '79 seasons' },
      { name: 'Real Betis', clue: '60 seasons' },
      { name: 'Celta Vigo', clue: '60 seasons' },
    ],
    near: [
      { name: 'Zaragoza', note: '58 seasons, 2 short' },
      { name: 'Valladolid', note: '47 seasons, 13 short' },
      { name: 'Deportivo La Coruña', note: '46 seasons, 14 short' },
    ] },
  { id: 'world-cup-appearances', checked: '2026-10-14', kind: 'nation', clueLabel: 'World Cups',
    title: 'Most World Cups played',
    note: 'World Cup finals, 1930 to 2026. Germany includes West Germany. Level nations by all-time points.',
    asOf: '2026-10-14',
    source: 'Wikipedia National team appearances in the FIFA World Cup (rev 24 Sep 2026); RSSSF total table 1930-2022 plus the 2026 qualifiers (CBS Sports; UEFA play-offs)',
    until: '2030-06-08',
    slots: [
      { name: 'Brazil', clue: '23 World Cups' },
      { name: 'Germany', clue: '21 World Cups' },
      { name: 'Argentina', clue: '19 World Cups' },
      { name: 'Italy', clue: '18 World Cups' },
      { name: 'Mexico', clue: '18 World Cups' },
      { name: 'France', clue: '17 World Cups' },
      { name: 'England', clue: '17 World Cups' },
      { name: 'Spain', clue: '17 World Cups' },
      { name: 'Uruguay', clue: '15 World Cups' },
      { name: 'Belgium', clue: '15 World Cups' },
    ],
    nearMax: 1,
    near: [
        { name: 'Sweden', note: '13 World Cups, 2 short' },
      ] },
  { id: 'portugal-top-scorers', checked: '2026-10-14', kind: 'player', clueLabel: 'Goals',
    title: 'Portugal’s top scorers (men)',
    note: 'Goals for Portugal at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'Wikipedia Portugal records (eu-football, 24 Sep 2026); RSSSF record internationals and João Pinto goal list; Transfermarkt (read 14 Oct 2026)',
    until: '2027-06-01',
    slots: [
      { name: 'Cristiano Ronaldo', clue: '146 goals' },
      { name: 'Pauleta', clue: '47 goals' },
      { name: 'Eusébio', clue: '41 goals' },
      { name: 'Luís Figo', clue: '32 goals' },
      { name: 'Nuno Gomes', clue: '29 goals' },
      { name: 'Bruno Fernandes', born: 1994, clue: '29 goals' },
      { name: 'Hélder Postiga', clue: '27 goals' },
      { name: 'Rui Costa', born: 1972, clue: '26 goals' },
      { name: 'Nani', born: 1986, clue: '24 goals' },
      { name: 'João Pinto', born: 1971, clue: '23 goals' },
    ],
    nearMax: 1,
    near: [
      { name: 'Simão', born: 1979, note: '22 goals, 1 short' },
    ] },
  { id: 'psg-top-scorers', club: 'psg', checked: '2026-10-14', kind: 'player', clueLabel: 'Goals',
    title: 'Paris Saint-Germain’s top scorers',
    note: 'All official matches, 1970 to the end of 2025-26.',
    asOf: '2026-10-14',
    source: 'histoiredupsg.fr all-time scorers, official matches (read 14 Oct 2026); Transfermarkt; CulturePSG for M’Pelé',
    until: '2027-06-01',
    slots: [
      { name: 'Kylian Mbappé', clue: '256 goals' },
      { name: 'Edinson Cavani', clue: '200 goals' },
      { name: 'Zlatan Ibrahimović', clue: '156 goals' },
      { name: 'Neymar', clue: '118 goals' },
      { name: 'Pauleta', clue: '109 goals' },
      { name: 'Dominique Rocheteau', clue: '100 goals' },
      { name: 'Mustapha Dahleb', clue: '98 goals' },
      { name: 'François M\'Pelé', clue: '95 goals' },
      { name: 'Ángel Di María', clue: '92 goals' },
      { name: 'Safet Sušić', clue: '85 goals' },
    ],
    near: [
      { name: 'Raí', born: 1965, note: '72 goals, 13 short' },
      { name: 'Carlos Bianchi', note: '71 goals, 14 short' },
      { name: 'Ousmane Dembélé', note: '61 goals, 24 short' },
    ] },
  { id: 'serie-a-appearances', checked: '2026-10-14', kind: 'player', clueLabel: 'Games',
    title: 'Most Serie A appearances',
    note: 'Serie A games only, 1929-30 to the end of 2025-26. Tie-break play-offs not counted.',
    asOf: '2026-10-14',
    source: 'it.wikipedia Classifica di presenze in Serie A (12 Oct 2026); Sky Sport Italia, 18 Dec 2021; Transfermarkt (read 14 Oct 2026)',
    until: '2027-06-01',
    slots: [
      { name: 'Gianluigi Buffon', clue: '657 games' },
      { name: 'Paolo Maldini', clue: '647 games' },
      { name: 'Francesco Totti', clue: '619 games' },
      { name: 'Javier Zanetti', clue: '615 games' },
      { name: 'Gianluca Pagliuca', clue: '592 games' },
      { name: 'Dino Zoff', clue: '570 games' },
      { name: 'Samir Handanović', clue: '566 games' },
      { name: 'Pietro Vierchowod', clue: '562 games' },
      { name: 'Fabio Quagliarella', clue: '556 games' },
      { name: 'Roberto Mancini', clue: '541 games' },
    ],
    near: [
      { name: 'Silvio Piola', note: '537 games, 4 short' },
      { name: 'Enrico Albertosi', note: '532 games, 9 short' },
      { name: 'Gianni Rivera', note: '527 games, 14 short' },
    ] },
  { id: 'italy-top-scorers', checked: '2026-10-14', kind: 'player', clueLabel: 'Goals',
    title: 'Italy’s top scorers (men)',
    note: 'Italy men’s goals to 14 October 2026. Ties go to whoever got there first.',
    asOf: '2026-10-14',
    source: 'FIGC classifica marcatori (widget, read 14 Oct 2026); RSSSF Italy records (to 7 Jun 2026); Wikipedia records page (2 Oct 2026)',
    until: '2027-06-01',
    slots: [
      { name: 'Gigi Riva', clue: '35 goals' },
      { name: 'Giuseppe Meazza', clue: '33 goals' },
      { name: 'Silvio Piola', clue: '30 goals' },
      { name: 'Roberto Baggio', clue: '27 goals' },
      { name: 'Alessandro Del Piero', clue: '27 goals' },
      { name: 'Adolfo Baloncieri', clue: '25 goals' },
      { name: 'Alessandro Altobelli', clue: '25 goals' },
      { name: 'Filippo Inzaghi', clue: '25 goals' },
      { name: 'Francesco Graziani', clue: '23 goals' },
      { name: 'Christian Vieri', clue: '23 goals' },
    ],
    near: [
      { name: 'Sandro Mazzola', note: '22 goals, one short' },
      { name: 'Daniele De Rossi', note: '21 goals, 2 short' },
      { name: 'Paolo Rossi', note: '20 goals, 3 short' },
    ] },
  { id: 'bundesliga-goals', checked: '2026-10-14', kind: 'player', clueLabel: 'Goals',
    title: 'Most Bundesliga goals',
    note: 'Bundesliga to the end of 2025-26, on the league’s own count. Level in the order they got there.',
    asOf: '2026-10-14',
    source: 'bundesliga.com all-time top scorers (read 14 Oct 2026); Transfermarkt; Wikipedia, rev 26 Sep 2026',
    until: '2027-06-01',
    slots: [
      { name: 'Gerd Müller', clue: '365 goals' },
      { name: 'Robert Lewandowski', clue: '312 goals' },
      { name: 'Klaus Fischer', clue: '268 goals' },
      { name: 'Jupp Heynckes', clue: '220 goals' },
      { name: 'Manfred Burgsmüller', clue: '213 goals' },
      { name: 'Claudio Pizarro', clue: '197 goals' },
      { name: 'Ulf Kirsten', clue: '182 goals' },
      { name: 'Stefan Kuntz', clue: '179 goals' },
      { name: 'Dieter Müller', clue: '177 goals' },
      { name: 'Klaus Allofs', clue: '177 goals' },
    ],
    near: [
      { name: 'Mario Gómez', note: '170 goals, 7 short' },
      { name: 'Hannes Löhr', note: '166 goals, 11 short' },
      { name: 'Karl-Heinz Rummenigge', note: '162 goals, 15 short' },
    ] },
  { id: 'germany-caps', checked: '2026-10-14', kind: 'player', clueLabel: 'Caps',
    title: 'Most Germany caps (men)',
    note: 'Germany and West Germany, not East, at the end of the 2026 World Cup. Level in order reached.',
    asOf: '2026-07-19',
    source: 'DFB record players, stamped 14 Oct 2026; RSSSF; Wikipedia, rev 5 Oct 2026; Transfermarkt match logs',
    until: '2027-06-01',
    slots: [
      { name: 'Lothar Matthäus', clue: '150 caps' },
      { name: 'Miroslav Klose', clue: '137 caps' },
      { name: 'Thomas Müller', clue: '131 caps' },
      { name: 'Lukas Podolski', clue: '130 caps' },
      { name: 'Manuel Neuer', clue: '128 caps' },
      { name: 'Bastian Schweinsteiger', clue: '121 caps' },
      { name: 'Toni Kroos', clue: '114 caps' },
      { name: 'Joshua Kimmich', clue: '114 caps' },
      { name: 'Philipp Lahm', clue: '113 caps' },
      { name: 'Jürgen Klinsmann', clue: '108 caps' },
    ],
    near: [
      { name: 'Jürgen Kohler', note: '105 caps, 3 short' },
      { name: 'Per Mertesacker', note: '104 caps, 4 short' },
      { name: 'Franz Beckenbauer', note: '103 caps, 5 short' },
    ] },
  { id: 'netherlands-caps', checked: '2026-10-14', kind: 'player', clueLabel: 'Caps',
    title: 'Most Netherlands caps (men)',
    note: 'Netherlands caps at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'RSSSF, to 17 Nov 2025; Transfermarkt match logs (read 14 Oct 2026); Wikipedia, rev 12 Oct 2026',
    until: '2027-06-01',
    slots: [
      { name: 'Wesley Sneijder', clue: '134 caps' },
      { name: 'Edwin van der Sar', clue: '130 caps' },
      { name: 'Frank de Boer', clue: '112 caps' },
      { name: 'Memphis Depay', clue: '112 caps' },
      { name: 'Rafael van der Vaart', clue: '109 caps' },
      { name: 'Daley Blind', clue: '108 caps' },
      { name: 'Giovanni van Bronckhorst', clue: '106 caps' },
      { name: 'Dirk Kuyt', clue: '104 caps' },
      { name: 'Robin van Persie', clue: '102 caps' },
      { name: 'Phillip Cocu', clue: '101 caps' },
    ],
    near: [
      { name: 'Arjen Robben', note: '96 caps, 5 short' },
      { name: 'Georginio Wijnaldum', note: '96 caps, 5 short' },
      { name: 'Virgil van Dijk', note: '96 caps, 5 short' },
    ] },
  { id: 'netherlands-top-scorers', checked: '2026-10-14', kind: 'player', clueLabel: 'Goals',
    title: 'Netherlands’ top scorers (men)',
    note: 'Netherlands goals at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'RSSSF, to 17 Nov 2025; Transfermarkt (read 14 Oct 2026); Wikipedia, rev 12 Oct 2026',
    until: '2027-06-01',
    slots: [
      { name: 'Memphis Depay', clue: '55 goals' },
      { name: 'Robin van Persie', clue: '50 goals' },
      { name: 'Klaas-Jan Huntelaar', clue: '42 goals' },
      { name: 'Patrick Kluivert', clue: '40 goals' },
      { name: 'Dennis Bergkamp', clue: '37 goals' },
      { name: 'Arjen Robben', clue: '37 goals' },
      { name: 'Faas Wilkes', clue: '35 goals' },
      { name: 'Ruud van Nistelrooy', clue: '35 goals' },
      { name: 'Abe Lenstra', clue: '33 goals' },
      { name: 'Johan Cruyff', clue: '33 goals' },
    ],
    nearMax: 1,
    near: [
      { name: 'Wesley Sneijder', note: '31 goals, 2 short' },
    ] },
  { id: 'bundesliga-seasons', checked: '2026-10-14', kind: 'club', clueLabel: 'Seasons',
    title: 'Most Bundesliga seasons',
    note: 'Full Bundesliga seasons, 1963-64 to 2025-26. Level clubs by their place in the all-time table.',
    asOf: '2026-10-14',
    source: 'German Wikipedia all-time table, rev 11 Oct 2026; Transfermarkt all-time table (read 14 Oct 2026)',
    until: '2027-05-15',
    slots: [
      { name: 'Bayern Munich', clue: '61 seasons' },
      { name: 'Werder Bremen', clue: '61 seasons' },
      { name: 'Borussia Dortmund', clue: '59 seasons' },
      { name: 'VfB Stuttgart', clue: '59 seasons' },
      { name: 'Borussia Mönchengladbach', clue: '58 seasons' },
      { name: 'Eintracht Frankfurt', clue: '57 seasons' },
      { name: 'Hamburger SV', clue: '56 seasons' },
      { name: 'Schalke 04', clue: '54 seasons' },
      { name: '1. FC Köln', clue: '53 seasons' },
      { name: 'Bayer Leverkusen', clue: '47 seasons' },
    ],
    near: [
      { name: '1. FC Kaiserslautern', note: '44 seasons, 3 short' },
      { name: 'Hertha BSC', note: '40 seasons, 7 short' },
      { name: 'VfL Bochum', note: '38 seasons, 9 short' },
    ] },
  { id: 'juventus-appearances', club: 'juventus', checked: '2026-10-14', kind: 'player', clueLabel: 'Games',
    title: 'Most Juventus appearances',
    note: 'All competitions, to the end of 2025-26, on the club’s own count.',
    asOf: '2026-10-14',
    source: 'juventus.com player articles (read 14 Oct 2026); it.wikipedia Calciatori della Juventus (juworld figures, 21 Sep 2026); Transfermarkt',
    until: '2027-06-01',
    slots: [
      { name: 'Alessandro Del Piero', clue: '705 games' },
      { name: 'Gianluigi Buffon', clue: '685 games' },
      { name: 'Giorgio Chiellini', clue: '561 games' },
      { name: 'Gaetano Scirea', clue: '552 games' },
      { name: 'Giuseppe Furino', clue: '528 games' },
      { name: 'Leonardo Bonucci', clue: '502 games' },
      { name: 'Roberto Bettega', clue: '482 games' },
      { name: 'Dino Zoff', clue: '476 games' },
      { name: 'Giampiero Boniperti', clue: '459 games' },
      { name: 'Sandro Salvadore', clue: '450 games' },
    ],
    nearMax: 2,
    near: [
      { name: 'Franco Causio', note: '447 games, 3 short' },
      { name: 'Antonio Cabrini', note: '440 games, 10 short' },
    ] },
  { id: 'premier-league-penalties', checked: '2026-10-14', kind: 'player', clueLabel: 'Penalties',
    title: 'Most Premier League penalties',
    note: 'Penalty goals, Premier League only, to the end of 2025-26. Level players by fewer games.',
    asOf: '2026-10-14',
    source: 'premierleague.com data feed, all 6,485 players (read 14 Oct 2026); Transfermarkt penalty logs per player; StatMuse',
    until: '2027-06-01',
    slots: [
      { name: 'Alan Shearer', clue: '56 penalties' },
      { name: 'Frank Lampard', clue: '43 penalties' },
      { name: 'Mohamed Salah', clue: '35 penalties' },
      { name: 'Harry Kane', clue: '33 penalties' },
      { name: 'Steven Gerrard', clue: '32 penalties' },
      { name: 'Mark Noble', clue: '28 penalties' },
      { name: 'Sergio Agüero', clue: '27 penalties' },
      { name: 'Jamie Vardy', clue: '27 penalties' },
      { name: 'Bruno Fernandes', born: 1994, clue: '26 penalties' },
      { name: 'Matt Le Tissier', clue: '25 penalties' },
    ],
    nearMax: 2,
    near: [
      { name: 'Thierry Henry', note: '23 penalties, 2 short' },
      { name: 'Wayne Rooney', note: '23 penalties, 2 short' },
    ] },
  { id: 'french-league-titles', checked: '2026-10-14', kind: 'club', clueLabel: 'Titles',
    title: 'Most French league titles',
    note: 'Since 1932-33. Marseille’s 1993 title stripped; Lille from 1946. Level clubs: first there.',
    asOf: '2026-10-14',
    source: 'French Wikipedia palmarès by club (read 14 Oct 2026); Maxifoot, 13 May 2026; English Wikipedia list (rev. 1 Oct 2026)',
    until: '2027-03-15',
    slots: [
      { name: 'Paris Saint-Germain', clue: '14 titles' },
      { name: 'Saint-Étienne', clue: '10 titles' },
      { name: 'Marseille', clue: '9 titles' },
      { name: 'Nantes', clue: '8 titles' },
      { name: 'Monaco', clue: '8 titles' },
      { name: 'Lyon', clue: '7 titles' },
      { name: 'Reims', clue: '6 titles' },
      { name: 'Bordeaux', clue: '6 titles' },
      { name: 'Nice', clue: '4 titles' },
      { name: 'Lille', clue: '4 titles' },
    ],
    nearMax: 2,
    near: [
      { name: 'Sochaux', note: '2 titles, two short' },
      { name: 'Sète', note: '2 titles, two short' },
    ] },
  { id: 'premier-league-club-goals', checked: '2026-10-14', kind: 'club', clueLabel: 'Goals',
    title: 'Most Premier League goals (clubs)',
    note: 'Every Premier League season from 1992-93 to 2025-26, added up.',
    asOf: '2026-10-14',
    source: 'The 34 final tables on premierleague.com, summed (read 14 Oct 2026); Wikipedia all-time table (rev. 23 Sep 2026)',
    until: '2027-06-01',
    slots: [
      { name: 'Manchester United', clue: '2,413 goals' },
      { name: 'Arsenal', clue: '2,336 goals' },
      { name: 'Liverpool', clue: '2,331 goals' },
      { name: 'Chelsea', clue: '2,210 goals' },
      { name: 'Tottenham Hotspur', clue: '2,001 goals' },
      { name: 'Manchester City', clue: '1,997 goals' },
      { name: 'Everton', clue: '1,654 goals' },
      { name: 'Newcastle United', clue: '1,651 goals' },
      { name: 'Aston Villa', clue: '1,506 goals' },
      { name: 'West Ham United', clue: '1,429 goals' },
    ],
    near: [
      { name: 'Southampton', note: '1,140 goals, 289 short' },
      { name: 'Blackburn Rovers', note: '927 goals, 502 short' },
      { name: 'Leicester City', note: '904 goals, 525 short' },
    ] },
  { id: 'belgium-caps', checked: '2026-10-14', kind: 'player', clueLabel: 'Caps',
    title: 'Most Belgium caps (men)',
    note: 'Belgium men’s caps on the RBFA’s count, at the end of the 2026 World Cup.',
    asOf: '2026-07-19',
    source: 'RBFA count via Wikipedia (as of 5 Oct 2026), less post-World Cup caps; RSSSF to 18 Nov 2025 plus 2026 World Cup line-ups',
    until: '2027-06-01',
    slots: [
      { name: 'Jan Vertonghen', clue: '157 caps' },
      { name: 'Axel Witsel', clue: '140 caps' },
      { name: 'Romelu Lukaku', clue: '132 caps' },
      { name: 'Toby Alderweireld', clue: '127 caps' },
      { name: 'Eden Hazard', clue: '126 caps' },
      { name: 'Kevin De Bruyne', clue: '124 caps' },
      { name: 'Thibaut Courtois', clue: '115 caps' },
      { name: 'Dries Mertens', clue: '109 caps' },
      { name: 'Jan Ceulemans', clue: '96 caps' },
      { name: 'Timmy Simons', clue: '94 caps' },
    ],
    near: [
      { name: 'Youri Tielemans', note: '90 caps, 4 short' },
      { name: 'Vincent Kompany', note: '89 caps, 5 short' },
      { name: 'Marouane Fellaini', note: '87 caps, 7 short' },
    ] },
  { id: 'croatia-caps', checked: '2026-10-14', kind: 'player', clueLabel: 'Caps',
    title: 'Most Croatia caps (men)',
    note: 'Croatia men’s caps at the end of the 2026 World Cup. Ties go to whoever got there first.',
    asOf: '2026-07-19',
    source: 'RSSSF to Portugal v Croatia, 2 Jul 2026; HNS count via Wikipedia (6 Oct 2026) less four Nations League games',
    until: '2027-06-01',
    slots: [
      { name: 'Luka Modrić', clue: '202 caps' },
      { name: 'Ivan Perišić', clue: '158 caps' },
      { name: 'Darijo Srna', clue: '134 caps' },
      { name: 'Andrej Kramarić', clue: '119 caps' },
      { name: 'Mateo Kovačić', clue: '117 caps' },
      { name: 'Stipe Pletikosa', clue: '114 caps' },
      { name: 'Ivan Rakitić', clue: '106 caps' },
      { name: 'Josip Šimunić', clue: '105 caps' },
      { name: 'Domagoj Vida', clue: '105 caps' },
      { name: 'Ivica Olić', clue: '104 caps' },
    ],
    near: [
      { name: 'Vedran Ćorluka', note: '103 caps, one short' },
      { name: 'Dario Šimić', note: '100 caps, 4 short' },
      { name: 'Marcelo Brozović', note: '99 caps, 5 short' },
    ] },
  { id: 'uruguay-caps', checked: '2026-10-14', kind: 'player', clueLabel: 'Caps',
    title: 'Most Uruguay caps (men)',
    note: 'Uruguay men’s caps at the end of the 2026 World Cup.',
    asOf: '2026-07-19',
    source: 'Wikipedia (6 Oct 2026) and Transfermarkt (14 Oct 2026), less post-World Cup caps; RSSSF; Uruguayan press (ESPN, El Observador)',
    until: '2027-06-01',
    slots: [
      { name: 'Diego Godín', clue: '161 caps' },
      { name: 'Luis Suárez', clue: '143 caps' },
      { name: 'Fernando Muslera', clue: '137 caps' },
      { name: 'Edinson Cavani', clue: '136 caps' },
      { name: 'Maxi Pereira', clue: '125 caps' },
      { name: 'Martín Cáceres', clue: '116 caps' },
      { name: 'Diego Forlán', clue: '112 caps' },
      { name: 'Cristian Rodríguez', born: 1985, clue: '110 caps' },
      { name: 'José María Giménez', clue: '99 caps' },
      { name: 'Diego Lugano', clue: '95 caps' },
    ],
    nearMax: 2,
    near: [
      { name: 'Egidio Arévalo Ríos', note: '90 caps, 5 short' },
      { name: 'Diego Pérez', born: 1980, note: '89 caps, 6 short' },
    ] },

  // FIFTH BATCH (15 Oct 2026): CLUB LISTS for the Top 10 browser, so a fan
  // finds their own club's lists (Alex: three to five per big club). Not
  // scheduled as dailies: they are open in the browser from the day they ship.
  // Reports: ~/ball-iq-audit/2026-10-15/top10-clubs/ (research-*.md, then an
  // independent verify-*.md that tried to break each one). All worded "to the
  // end of 2025-26", so a goal this season cannot change them.
  { id: 'barcelona-la-liga-goals', club: 'barcelona', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Barcelona’s La Liga goals',
    note: 'La Liga only, to the end of 2025-26, on BDFutbol’s count. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'BDFutbol Barcelona league scorers (read 15 Oct 2026); Spanish Wikipedia and RSSSF agree on the ten and the cut',
    slots: [
      { name: 'Lionel Messi', clue: '474 goals' },
      { name: 'César Rodríguez', clue: '190 goals' },
      { name: 'Luis Suárez', born: 1987, clue: '147 goals' },
      { name: 'László Kubala', clue: '131 goals' },
      { name: 'Samuel Eto’o', clue: '108 goals' },
      { name: 'Mariano Martín', clue: '99 goals' },
      { name: 'Estanislau Basora', clue: '89 goals' },
      { name: 'Patrick Kluivert', clue: '89 goals' },
      { name: 'Rivaldo', clue: '86 goals' },
      { name: 'Josep Escolà', clue: '85 goals' },
    ],
    nearMax: 3,
    near: [
      { name: 'Hristo Stoichkov', note: '83 goals, 2 short' },
      { name: 'Robert Lewandowski', note: '83 goals, 2 short' },
      { name: 'Carles Rexach', note: '81 goals, 4 short' },
    ] },
  { id: 'real-madrid-la-liga-goals', club: 'real-madrid', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Real Madrid’s La Liga goals',
    note: 'La Liga only, to the end of 2025-26, on BDFutbol’s count. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'BDFutbol Real Madrid league scorers (read 15 Oct 2026); Spanish Wikipedia, RSSSF and Transfermarkt agree on the ten and the cut',
    slots: [
      { name: 'Cristiano Ronaldo', clue: '311 goals' },
      { name: 'Karim Benzema', clue: '238 goals' },
      { name: 'Raúl', clue: '228 goals' },
      { name: 'Alfredo Di Stéfano', clue: '216 goals' },
      { name: 'Santillana', clue: '186 goals' },
      { name: 'Hugo Sánchez', clue: '164 goals' },
      { name: 'Ferenc Puskás', clue: '156 goals' },
      { name: 'Paco Gento', clue: '127 goals' },
      { name: 'Emilio Butragueño', clue: '123 goals' },
      { name: 'Pirri', clue: '123 goals' },
    ],
    nearMax: 3,
    near: [
      { name: 'Amancio Amaro', note: '119 goals, 4 short' },
      { name: 'Pahiño', note: '109 goals, 14 short' },
      { name: 'Gonzalo Higuaín', note: '107 goals, 16 short' },
    ] },
  { id: 'manchester-city-appearances', club: 'manchester-city', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Most Manchester City appearances',
    note: 'All competitions, to the end of 2025-26, on the club’s all-time list (mancity.com, 2026).',
    asOf: '2026-10-15',
    source: 'mancity.com articles of 26 May and 5 Oct 2026 (Bernardo Silva 460, 8th; Paul Power 445, 10th); StatCity, Soccerbase and Wikipedia agree. The club’s Legends pages use a lower count: not used.',
    slots: [
      { name: 'Alan Oakes', clue: '680 games' },
      { name: 'Joe Corrigan', clue: '603 games' },
      { name: 'Mike Doyle', clue: '570 games' },
      { name: 'Bert Trautmann', clue: '545 games' },
      { name: 'Colin Bell', born: 1946, clue: '501 games' },
      { name: 'Eric Brook', clue: '493 games' },
      { name: 'Tommy Booth', clue: '491 games' },
      { name: 'Bernardo Silva', clue: '460 games' },
      { name: 'Mike Summerbee', clue: '452 games' },
      { name: 'Paul Power', clue: '445 games' },
    ],
    nearMax: 3,
    near: [
      { name: 'Willie Donachie', note: '436 games, 9 short' },
      { name: 'David Silva', note: '436 games, 9 short' },
      { name: 'Kevin De Bruyne', note: '422 games, 23 short' },
    ] },
  { id: 'manchester-city-premier-league-goals', club: 'manchester-city', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'City’s Premier League goals',
    note: 'Premier League only, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club, added season by season (read 15 Oct 2026); Transfermarkt and StatCity agree on the ten and the cut',
    slots: [
      { name: 'Sergio Agüero', clue: '184 goals' },
      { name: 'Erling Haaland', clue: '112 goals' },
      { name: 'Raheem Sterling', clue: '91 goals' },
      { name: 'Kevin De Bruyne', clue: '72 goals' },
      { name: 'Phil Foden', clue: '68 goals' },
      { name: 'Yaya Touré', clue: '62 goals' },
      { name: 'David Silva', clue: '60 goals' },
      { name: 'Gabriel Jesus', clue: '58 goals' },
      { name: 'Carlos Tevez', clue: '58 goals' },
      { name: 'Edin Džeko', clue: '50 goals' },
    ],
    nearMax: 3,
    near: [
      { name: 'İlkay Gündoğan', note: '45 goals, 5 short' },
      { name: 'Bernardo Silva', note: '45 goals, 5 short' },
      { name: 'Riyad Mahrez', note: '43 goals, 7 short' },
    ] },
  { id: 'manchester-united-premier-league-goals', club: 'manchester-united', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'United’s Premier League goals',
    note: 'Premier League only, to the end of 2025-26.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and MUFCinfo agree',
    slots: [
      { name: 'Wayne Rooney', clue: '183 goals' },
      { name: 'Ryan Giggs', clue: '109 goals' },
      { name: 'Paul Scholes', clue: '107 goals' },
      { name: 'Cristiano Ronaldo', clue: '103 goals' },
      { name: 'Ruud van Nistelrooy', clue: '95 goals' },
      { name: 'Andy Cole', clue: '93 goals' },
      { name: 'Ole Gunnar Solskjær', clue: '91 goals' },
      { name: 'Marcus Rashford', clue: '87 goals' },
      { name: 'Bruno Fernandes', clue: '71 goals' },
      { name: 'Eric Cantona', clue: '64 goals' },
    ],
    nearMax: 2,
    near: [
      { name: 'Anthony Martial', note: '63 goals, 1 short' },
      { name: 'David Beckham', note: '62 goals, 2 short' },
    ] },
  { id: 'manchester-united-premier-league-appearances', club: 'manchester-united', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'United’s Premier League games',
    note: 'Premier League only, subs included, to the end of 2025-26.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and MUFCinfo agree',
    slots: [
      { name: 'Ryan Giggs', clue: '632 games' },
      { name: 'Paul Scholes', clue: '499 games' },
      { name: 'David de Gea', clue: '415 games' },
      { name: 'Gary Neville', clue: '400 games' },
      { name: 'Wayne Rooney', clue: '393 games' },
      { name: 'Roy Keane', clue: '326 games' },
      { name: 'Michael Carrick', clue: '316 games' },
      { name: 'Rio Ferdinand', clue: '312 games' },
      { name: 'Denis Irwin', clue: '296 games' },
      { name: 'Marcus Rashford', clue: '287 games' },
    ],
    nearMax: 3,
    near: [
      { name: 'Patrice Evra', note: '273 games, 14 short' },
      { name: 'Nicky Butt', note: '270 games, 17 short' },
      { name: 'David Beckham', note: '265 games, 22 short' },
    ] },
  { id: 'liverpool-premier-league-goals', club: 'liverpool', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Liverpool’s Premier League goals',
    note: 'Premier League only, to the end of 2025-26.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and LFChistory agree on the ten and the cut',
    slots: [
      { name: 'Mohamed Salah', clue: '191 goals' },
      { name: 'Robbie Fowler', clue: '128 goals' },
      { name: 'Steven Gerrard', clue: '120 goals' },
      { name: 'Michael Owen', clue: '118 goals' },
      { name: 'Sadio Mané', clue: '90 goals' },
      { name: 'Roberto Firmino', clue: '82 goals' },
      { name: 'Luis Suárez', born: 1987, clue: '69 goals' },
      { name: 'Fernando Torres', clue: '65 goals' },
      { name: 'Dirk Kuyt', clue: '51 goals' },
      { name: 'Daniel Sturridge', clue: '50 goals' },
    ],
    nearMax: 2,
    near: [
      { name: 'Diogo Jota', note: '47 goals, 3 short' },
      { name: 'Ian Rush', note: '45 goals, 5 short' },
    ] },
  { id: 'liverpool-premier-league-appearances', club: 'liverpool', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Liverpool’s Premier League games',
    note: 'Premier League only, subs included, to the end of 2025-26.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and LFChistory agree',
    slots: [
      { name: 'Jamie Carragher', clue: '508 games' },
      { name: 'Steven Gerrard', clue: '504 games' },
      { name: 'Jordan Henderson', clue: '360 games' },
      { name: 'Sami Hyypiä', clue: '318 games' },
      { name: 'Mohamed Salah', clue: '315 games' },
      { name: 'Pepe Reina', clue: '285 games' },
      { name: 'Andy Robertson', clue: '275 games' },
      { name: 'Virgil van Dijk', clue: '272 games' },
      { name: 'Robbie Fowler', clue: '266 games' },
      { name: 'Trent Alexander-Arnold', clue: '259 games' },
    ],
    nearMax: 3,
    near: [
      { name: 'Roberto Firmino', note: '256 games, 3 short' },
      { name: 'Alisson Becker', note: '255 games, 4 short' },
      { name: 'Lucas Leiva', note: '247 games, 12 short' },
    ] },
  { id: 'arsenal-premier-league-goals', club: 'arsenal', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Arsenal’s Premier League goals',
    note: 'Premier League only, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt and 11v11 agree',
    slots: [
      { name: 'Thierry Henry', clue: '175 goals' },
      { name: 'Ian Wright', clue: '104 goals' },
      { name: 'Robin van Persie', clue: '96 goals' },
      { name: 'Dennis Bergkamp', clue: '87 goals' },
      { name: 'Olivier Giroud', clue: '73 goals' },
      { name: 'Pierre-Emerick Aubameyang', clue: '68 goals' },
      { name: 'Theo Walcott', clue: '65 goals' },
      { name: 'Robert Pires', clue: '62 goals' },
      { name: 'Bukayo Saka', clue: '60 goals' },
      { name: 'Alexis Sánchez', clue: '60 goals' },
    ],
    nearMax: 1,
    near: [
      { name: 'Alexandre Lacazette', note: '54 goals, 6 short' },
    ] },
  { id: 'arsenal-premier-league-appearances', club: 'arsenal', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Arsenal’s Premier League games',
    note: 'Premier League only, subs included, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and Wikipedia season tables agree',
    slots: [
      { name: 'Ray Parlour', clue: '333 games' },
      { name: 'David Seaman', clue: '325 games' },
      { name: 'Dennis Bergkamp', clue: '315 games' },
      { name: 'Martin Keown', clue: '310 games' },
      { name: 'Lee Dixon', clue: '305 games' },
      { name: 'Patrick Vieira', clue: '279 games' },
      { name: 'Theo Walcott', clue: '270 games' },
      { name: 'Nigel Winterburn', clue: '270 games' },
      { name: 'Aaron Ramsey', born: 1990, clue: '262 games' },
      { name: 'Thierry Henry', clue: '258 games' },
    ],
    nearMax: 2,
    near: [
      { name: 'Tony Adams', note: '255 games, 3 short' },
      { name: 'Laurent Koscielny', note: '255 games, 3 short' },
    ] },
  { id: 'chelsea-premier-league-goals', club: 'chelsea', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Chelsea’s Premier League goals',
    note: 'Premier League only, to the end of 2025-26.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and Wikipedia agree',
    slots: [
      { name: 'Frank Lampard', clue: '147 goals' },
      { name: 'Didier Drogba', clue: '104 goals' },
      { name: 'Eden Hazard', clue: '85 goals' },
      { name: 'Jimmy Floyd Hasselbaink', clue: '69 goals' },
      { name: 'Gianfranco Zola', clue: '59 goals' },
      { name: 'Eiður Guðjohnsen', clue: '54 goals' },
      { name: 'Diego Costa', born: 1988, clue: '52 goals' },
      { name: 'Cole Palmer', clue: '47 goals' },
      { name: 'John Terry', clue: '41 goals' },
      { name: 'Nicolas Anelka', clue: '38 goals' },
    ],
    nearMax: 1,
    near: [
      { name: 'Willian', born: 1988, note: '37 goals, 1 short' },
    ] },
  { id: 'chelsea-premier-league-appearances', club: 'chelsea', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Chelsea’s Premier League games',
    note: 'Premier League only, subs included, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11, StatMuse and Wikipedia agree',
    slots: [
      { name: 'John Terry', clue: '492 games' },
      { name: 'Frank Lampard', clue: '429 games' },
      { name: 'César Azpilicueta', clue: '349 games' },
      { name: 'Petr Čech', clue: '333 games' },
      { name: 'Branislav Ivanović', clue: '261 games' },
      { name: 'Dennis Wise', clue: '261 games' },
      { name: 'Didier Drogba', clue: '254 games' },
      { name: 'Mikel John Obi', clue: '249 games' },
      { name: 'Eden Hazard', clue: '245 games' },
      { name: 'Willian', born: 1988, clue: '234 games' },
    ],
    nearMax: 3,
    near: [
      { name: 'Ashley Cole', note: '229 games, 5 short' },
      { name: 'Gianfranco Zola', note: '229 games, 5 short' },
      { name: 'Gary Cahill', note: '191 games, 43 short' },
    ] },
  { id: 'tottenham-premier-league-goals', club: 'tottenham', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Spurs’ Premier League goals',
    note: 'Premier League only, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11, THFCDB and StatMuse agree on the ten and the cut',
    slots: [
      { name: 'Harry Kane', clue: '213 goals' },
      { name: 'Son Heung-min', clue: '127 goals' },
      { name: 'Teddy Sheringham', clue: '97 goals' },
      { name: 'Jermain Defoe', clue: '91 goals' },
      { name: 'Robbie Keane', clue: '91 goals' },
      { name: 'Gareth Bale', clue: '53 goals' },
      { name: 'Dele Alli', clue: '51 goals' },
      { name: 'Christian Eriksen', clue: '51 goals' },
      { name: 'Chris Armstrong', born: 1971, clue: '48 goals' },
      { name: 'Steffen Iversen', clue: '36 goals' },
    ],
    nearMax: 1,
    near: [
      { name: 'Emmanuel Adebayor', note: '35 goals, 1 short' },
    ] },
  { id: 'tottenham-premier-league-appearances', club: 'tottenham', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Spurs’ Premier League games',
    note: 'Premier League only, subs included, to the end of 2025-26.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and THFCDB agree',
    slots: [
      { name: 'Hugo Lloris', clue: '361 games' },
      { name: 'Son Heung-min', clue: '333 games' },
      { name: 'Harry Kane', clue: '317 games' },
      { name: 'Darren Anderton', clue: '299 games' },
      { name: 'Jermain Defoe', clue: '276 games' },
      { name: 'Eric Dier', clue: '274 games' },
      { name: 'Ledley King', clue: '268 games' },
      { name: 'Aaron Lennon', clue: '266 games' },
      { name: 'Sol Campbell', clue: '255 games' },
      { name: 'Ben Davies', born: 1993, clue: '245 games' },
    ],
    nearMax: 2,
    near: [
      { name: 'Ian Walker', born: 1971, note: '240 games, 5 short' },
      { name: 'Robbie Keane', note: '238 games, 7 short' },
    ] },
  { id: 'newcastle-premier-league-goals', club: 'newcastle', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Newcastle’s Premier League goals',
    note: 'Premier League only, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and Wikipedia season pages agree on the ten and the cut',
    slots: [
      { name: 'Alan Shearer', clue: '148 goals' },
      { name: 'Alexander Isak', clue: '54 goals' },
      { name: 'Callum Wilson', born: 1992, clue: '47 goals' },
      { name: 'Peter Beardsley', clue: '46 goals' },
      { name: 'Shola Ameobi', clue: '43 goals' },
      { name: 'Andy Cole', clue: '43 goals' },
      { name: 'Les Ferdinand', clue: '41 goals' },
      { name: 'Papiss Cissé', clue: '37 goals' },
      { name: 'Nolberto Solano', clue: '37 goals' },
      { name: 'Rob Lee', clue: '34 goals' },
    ],
    nearMax: 3,
    near: [
      { name: 'Ayoze Pérez', note: '33 goals, 1 short' },
      { name: 'Bruno Guimarães', note: '30 goals, 4 short' },
      { name: 'Demba Ba', note: '29 goals, 5 short' },
    ] },
  { id: 'newcastle-premier-league-appearances', club: 'newcastle', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Newcastle’s Premier League games',
    note: 'Premier League only, subs included, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Premier League stats feed by club (read 15 Oct 2026); Transfermarkt, 11v11 and Wikipedia season tables agree',
    slots: [
      { name: 'Shay Given', clue: '354 games' },
      { name: 'Alan Shearer', clue: '303 games' },
      { name: 'Shola Ameobi', clue: '294 games' },
      { name: 'Rob Lee', clue: '267 games' },
      { name: 'Nolberto Solano', clue: '230 games' },
      { name: 'Jacob Murphy', clue: '218 games' },
      { name: 'Gary Speed', clue: '213 games' },
      { name: 'Joelinton', clue: '212 games' },
      { name: 'Fabricio Coloccini', clue: '211 games' },
      { name: 'Fabian Schär', clue: '211 games' },
    ],
    nearMax: 3,
    near: [
      { name: 'Aaron Hughes', note: '205 games, 6 short' },
      { name: 'Steven Taylor', born: 1986, note: '194 games, 17 short' },
      { name: 'Kieron Dyer', note: '190 games, 21 short' },
    ] },
  { id: 'tottenham-appearances', club: 'tottenham', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Most Tottenham appearances',
    note: 'Since Spurs joined the Football League in 1908, on the club’s own count.',
    asOf: '2026-10-15',
    source: 'Tottenham Hotspur official records (read 9 and 15 Oct 2026); Topspurs and 11v11 agree on the ten and the cut',
    slots: [
      { name: 'Steve Perryman', clue: '854 games' },
      { name: 'Gary Mabbutt', clue: '611 games' },
      { name: 'Pat Jennings', clue: '590 games' },
      { name: 'Cyril Knowles', clue: '506 games' },
      { name: 'Glenn Hoddle', clue: '490 games' },
      { name: 'Son Heung-min', clue: '454 games' },
      { name: 'Ted Ditchburn', clue: '452 games' },
      { name: 'Hugo Lloris', clue: '447 games' },
      { name: 'Alan Gilzean', clue: '439 games' },
      { name: 'Jimmy Dimmock', clue: '438 games' },
    ],
    nearMax: 3,
    near: [
      { name: 'Harry Kane', note: '435 games, 3 short' },
      { name: 'Phil Beal', note: '420 games, 18 short' },
      { name: 'John Pratt', note: '415 games, 23 short' },
    ] },
  { id: 'newcastle-top-scorers', club: 'newcastle', checked: '2026-10-15', until: '2027-06-01', kind: 'player',
    title: 'Newcastle’s top scorers',
    note: 'League and cup goals, club records, to the end of 2025-26. Ties are listed alphabetically.',
    asOf: '2026-10-15',
    source: 'Newcastle United club records (archived 29 May 2024); 11v11 and toon1892 agree on the ten and the cut (read 9 and 15 Oct 2026)',
    slots: [
      { name: 'Alan Shearer', clue: '206 goals' },
      { name: 'Jackie Milburn', born: 1924, clue: '200 goals' },
      { name: 'Len White', clue: '153 goals' },
      { name: 'Hughie Gallacher', clue: '143 goals' },
      { name: 'Malcolm Macdonald', clue: '121 goals' },
      { name: 'Peter Beardsley', clue: '119 goals' },
      { name: 'Tommy McDonald', born: 1895, clue: '113 goals' },
      { name: 'Bobby Mitchell', born: 1924, clue: '113 goals' },
      { name: 'Neil Harris', born: 1894, clue: '101 goals' },
      { name: 'Pop Robson', clue: '97 goals' },
    ],
    // On the club's own count (the list's authority); 11v11 has both on 91.
    nearMax: 2,
    near: [
      { name: 'Albert Shepherd', note: '92 goals, 5 short' },
      { name: 'Jock Rutherford', note: '92 goals, 5 short' },
    ] },

  // ── December batch, added 16 Oct 2026 ──────────────────────────────────────
  // Every list is a closed snapshot (a finished season, a past tournament, a
  // published edition), researched from two independent sources and then
  // re-derived by a second checker told to break it. Reports and every URL read:
  // ~/ball-iq-audit/2026-10-16/top10-december/ (research-*.md, verify-*.md,
  // sources.md). Ties inside a ten are ordered alphabetically unless the note
  // says otherwise; the game accepts tied names in either slot's order anyway.

  // The 2027 edition is due in late January 2027 (Deloitte's pattern, not an
  // announced date), so it expires mid-January to be safe.
  { id: 'money-league-2026', checked: '2026-10-16', until: '2027-01-15', kind: 'club',
    title: 'Deloitte Money League 2026',
    note: 'Club revenue in 2024-25, in euros, as Deloitte published it on 22 January 2026.',
    asOf: '2026-10-16',
    source: 'Deloitte Football Money League 2026 (22 Jan 2026: order 1-20, rounded figures); GOAL, Borsa e Finanza and Wikipedia print the same one-decimal figures; ESPN the same order',
    slots: [
      { name: 'Real Madrid', clue: '1,161m euros' },
      { name: 'Barcelona', clue: '974.8m euros' },
      { name: 'Bayern Munich', clue: '860.6m euros' },
      { name: 'Paris Saint-Germain', clue: '837m euros' },
      { name: 'Liverpool', clue: '836.1m euros' },
      { name: 'Manchester City', clue: '829.3m euros' },
      { name: 'Arsenal', clue: '821.7m euros' },
      { name: 'Manchester United', clue: '793.1m euros' },
      { name: 'Tottenham Hotspur', clue: '672.6m euros' },
      { name: 'Chelsea', clue: '584.1m euros' },
    ],
    near: [
      { name: 'Inter Milan', note: '537.5m euros, 46.6m short' },
      { name: 'Borussia Dortmund', note: '531.3m euros, 52.8m short' },
      { name: 'Atlético Madrid', note: '454.5m euros, 129.6m short' },
    ] },
  { id: 'premier-league-2025-26-club-goals', checked: '2026-10-16', until: '2027-12-31', kind: 'club',
    title: 'Premier League goals, 2025-26',
    note: 'Goals scored by each club in the 2025-26 Premier League. Level clubs alphabetically.',
    asOf: '2026-10-16',
    source: 'Wikipedia 2025-26 Premier League final table; ESPN 2025-26 standings; Transfermarkt table: all twenty clubs agree',
    slots: [
      { name: 'Manchester City', clue: '77 goals' },
      { name: 'Arsenal', clue: '71 goals' },
      { name: 'Manchester United', clue: '69 goals' },
      { name: 'Liverpool', clue: '63 goals' },
      { name: 'Bournemouth', clue: '58 goals' },
      { name: 'Chelsea', clue: '58 goals' },
      { name: 'Aston Villa', clue: '56 goals' },
      { name: 'Brentford', clue: '55 goals' },
      { name: 'Newcastle United', clue: '53 goals' },
      { name: 'Brighton & Hove Albion', clue: '52 goals' },
    ],
    near: [
      { name: 'Leeds United', note: '49 goals, 3 short' },
      { name: 'Nottingham Forest', note: '48 goals, 4 short' },
      { name: 'Tottenham Hotspur', note: '48 goals, 4 short' },
    ] },
  // The 2026 ranking is closed (UEFA's feed: last update 3 Jul 2026, no club
  // still playing in 2025-26). UEFA.com's default view is now the live 2027
  // ranking, which is not this list.
  { id: 'uefa-club-coefficients-2026', checked: '2026-10-16', until: '2027-12-31', kind: 'club',
    title: 'UEFA club coefficients, 2026',
    note: 'UEFA’s five-year club ranking at the end of 2025-26 (2021-22 to 2025-26), in points.',
    asOf: '2026-10-16',
    source: 'UEFA coefficients feed, men’s clubs, season 2026 (comp.uefa.com, final 3 Jul 2026); Bert Kassies, UEFA 5-year club ranking 2026 (kassiesa.net): identical to three decimals',
    slots: [
      { name: 'Bayern Munich', clue: '147.500 points' },
      { name: 'Real Madrid', clue: '144.500 points' },
      { name: 'Paris Saint-Germain', clue: '132.000 points' },
      { name: 'Liverpool', clue: '130.000 points' },
      { name: 'Inter Milan', clue: '127.000 points' },
      { name: 'Manchester City', clue: '125.500 points' },
      { name: 'Arsenal', clue: '119.000 points' },
      { name: 'Barcelona', clue: '113.250 points' },
      { name: 'Bayer Leverkusen', clue: '105.000 points' },
      { name: 'Atlético Madrid', clue: '104.750 points' },
    ],
    near: [
      { name: 'Borussia Dortmund', note: '100.750 points, 4 short' },
      { name: 'Chelsea', note: '99.250 points, 5.5 short' },
      { name: 'Roma', note: '97.750 points, 7 short' },
    ] },
  // UEFA merges West Germany into Germany, the Soviet Union and CIS into
  // Russia, Czechoslovakia into the Czech Republic. Transfermarkt does not, and
  // on its split Denmark is tenth instead of Russia: hence the note, and the
  // old names accepted for this list. No Euro match before June 2028.
  { id: 'euro-matches-won', checked: '2026-10-16', until: '2028-06-01', kind: 'nation',
    title: 'Most Euro matches won',
    note: 'Euros 1960 to 2024, UEFA’s count: Russia includes the USSR, Czech Republic Czechoslovakia.',
    asOf: '2026-10-16',
    source: 'UEFA all-time EURO table (14 Jul 2024); Wikipedia EURO records, overall team records; all 388 final-tournament matches tallied from a match-by-match dataset; RSSSF to 2008 plus 2012-2024',
    also: { 'Russia': ['Soviet Union'], 'Czech Republic': ['Czechoslovakia'] },
    slots: [
      { name: 'Germany', clue: '30 wins' },
      { name: 'Spain', clue: '28 wins' },
      { name: 'France', clue: '23 wins' },
      { name: 'Netherlands', clue: '23 wins' },
      { name: 'Italy', clue: '22 wins' },
      { name: 'Portugal', clue: '21 wins' },
      { name: 'England', clue: '18 wins' },
      { name: 'Czech Republic', clue: '15 wins' },
      { name: 'Russia', clue: '13 wins' },
      { name: 'Belgium', clue: '12 wins' },
    ],
    near: [
      { name: 'Denmark', note: '10 wins, 2 short' },
      { name: 'Croatia', note: '9 wins, 3 short' },
    ] },
  // The release of 20 July 2026 (FIFA's dateId FRS_Male_Football_20260611);
  // the next was 7 October. Wikipedia's data module has Spain 1995.98, a typo:
  // FIFA and two news copies print 1995.88.
  { id: 'fifa-ranking-july-2026', checked: '2026-10-16', until: '2027-12-31', kind: 'nation',
    title: 'FIFA ranking after the World Cup',
    note: 'The men’s FIFA world ranking of 20 July 2026, the first after the 2026 World Cup.',
    asOf: '2026-10-16',
    source: 'FIFA men’s ranking, release of 20 July 2026 (inside.fifa.com); Wikipedia FIFA World Rankings data module (rev 20 Jul 2026); The Gazette and MLSsoccer.com copies',
    slots: [
      { name: 'Spain', clue: '1995.88 points' },
      { name: 'Argentina', clue: '1970.37 points' },
      { name: 'France', clue: '1948.97 points' },
      { name: 'England', clue: '1922.83 points' },
      { name: 'Brazil', clue: '1804.92 points' },
      { name: 'Morocco', clue: '1803.99 points' },
      { name: 'Portugal', clue: '1787.85 points' },
      { name: 'Belgium', clue: '1778.36 points' },
      { name: 'Netherlands', clue: '1775.54 points' },
      { name: 'Mexico', clue: '1754.30 points' },
    ],
    near: [
      { name: 'Colombia', note: '1739.89 points, 14.41 short' },
      { name: 'Germany', note: '1726.22 points, 28.08 short' },
      { name: 'Croatia', note: '1723.05 points, 31.25 short' },
    ] },
  // RSSSF also counts the 1967 qualifying round and two play-offs (Chile 68,
  // Paraguay 65); Wikipedia has Argentina 132 and Colombia 53. Same ten, same
  // order, same cut on all three: the numbers shown are CONMEBOL's.
  { id: 'copa-america-matches-won', checked: '2026-10-16', until: '2028-06-01', kind: 'nation',
    title: 'Most Copa América matches won',
    note: 'Copa América 1916 to 2024, on CONMEBOL’s count. Guest nations included.',
    asOf: '2026-10-16',
    source: 'CONMEBOL Copa América all-time standings (copaamerica.com, 15 Aug 2024); RSSSF Copa América 1916-2024 all-time rankings; Wikipedia Copa América records',
    slots: [
      { name: 'Argentina', clue: '133 wins' },
      { name: 'Uruguay', clue: '115 wins' },
      { name: 'Brazil', clue: '109 wins' },
      { name: 'Chile', clue: '67 wins' },
      { name: 'Paraguay', clue: '64 wins' },
      { name: 'Peru', clue: '58 wins' },
      { name: 'Colombia', clue: '51 wins' },
      { name: 'Bolivia', clue: '20 wins' },
      { name: 'Mexico', clue: '20 wins' },
      { name: 'Ecuador', clue: '17 wins' },
    ],
    near: [
      { name: 'Venezuela', note: '11 wins, 6 short' },
    ] },
  // The year list for 31 December. The tournament is over: nothing can change.
  { id: 'world-cup-2026-top-scorers', checked: '2026-10-16', until: '2030-06-08', kind: 'player',
    title: 'Top scorers at the 2026 World Cup',
    note: 'Goals at the 2026 World Cup only. Level players alphabetically.',
    asOf: '2026-10-16',
    source: 'Wikipedia 2026 World Cup goalscorer data (all 104 matches, 308 goals); ESPN tournament statistics; Transfermarkt; Al Jazeera, 21 Jul 2026',
    slots: [
      { name: 'Kylian Mbappé', clue: '10 goals' },
      { name: 'Lionel Messi', clue: '8 goals' },
      { name: 'Jude Bellingham', clue: '7 goals' },
      { name: 'Erling Haaland', clue: '7 goals' },
      { name: 'Ousmane Dembélé', clue: '6 goals' },
      { name: 'Harry Kane', clue: '6 goals' },
      { name: 'Mikel Oyarzabal', clue: '5 goals' },
      { name: 'Julián Quiñones', clue: '4 goals' },
      { name: 'Ismaïla Sarr', clue: '4 goals' },
      { name: 'Vinícius Júnior', clue: '4 goals' },
    ],
    nearMax: 2,
    near: [
      { name: 'Cristiano Ronaldo', note: '3 goals, 1 short' },
      { name: 'Bukayo Saka', note: '3 goals, 1 short' },
    ] },
  { id: 'premier-league-2025-26-top-scorers', checked: '2026-10-16', until: '2027-12-31', kind: 'player',
    title: 'Premier League top scorers 2025-26',
    note: 'League goals in the 2025-26 Premier League. Level players alphabetically.',
    asOf: '2026-10-16',
    source: 'Wikipedia 2025-26 Premier League top scorers (citing premierleague.com); ESPN scoring stats 2025-26; Transfermarkt top scorers 2025/26',
    slots: [
      { name: 'Erling Haaland', clue: '27 goals' },
      { name: 'Igor Thiago', clue: '22 goals' },
      { name: 'Antoine Semenyo', clue: '17 goals' },
      { name: 'Ollie Watkins', clue: '16 goals' },
      { name: 'Morgan Gibbs-White', clue: '15 goals' },
      { name: 'João Pedro', born: 2001, clue: '15 goals' },
      { name: 'Dominic Calvert-Lewin', clue: '14 goals' },
      { name: 'Viktor Gyökeres', clue: '14 goals' },
      { name: 'Eli Junior Kroupi', clue: '13 goals' },
      { name: 'Danny Welbeck', clue: '13 goals' },
    ],
    nearMax: 1,
    near: [
      { name: 'Jean-Philippe Mateta', note: '12 goals, 1 short' },
    ] },
  { id: 'la-liga-2025-26-top-scorers', checked: '2026-10-16', until: '2027-12-31', kind: 'player',
    title: 'La Liga top scorers 2025-26',
    note: 'League goals in 2025-26 (the Pichichi and LaLiga agree). Level players alphabetically.',
    asOf: '2026-10-16',
    source: 'Marca Pichichi table (24 May 2026); LaLiga official scorers 2025/26; ESPN and BeSoccer agree',
    slots: [
      { name: 'Kylian Mbappé', clue: '25 goals' },
      { name: 'Vedat Muriqi', clue: '23 goals' },
      { name: 'Ante Budimir', clue: '17 goals' },
      { name: 'Ferran Torres', clue: '16 goals' },
      { name: 'Lamine Yamal', clue: '16 goals' },
      { name: 'Vinícius Júnior', clue: '16 goals' },
      { name: 'Mikel Oyarzabal', clue: '15 goals' },
      { name: 'Borja Iglesias', clue: '14 goals' },
      { name: 'Robert Lewandowski', clue: '14 goals' },
      { name: 'Toni Martínez', born: 1997, clue: '14 goals' },
    ],
    near: [
      { name: 'Georges Mikautadze', note: '13 goals, 1 short' },
      { name: 'Raphinha', note: '13 goals, 1 short' },
      { name: 'Alexander Sørloth', note: '13 goals, 1 short' },
    ] },
  // RSSSF's record page is frozen at Brazil v Scotland, 24 Jun 2026, the
  // boundary. On live numbers Christie (74) is in and Boyd out, so the wording
  // must stay "at the end of the 2026 World Cup". Transfermarkt has Fletcher 81.
  { id: 'scotland-caps', checked: '2026-10-16', until: '2027-12-31', kind: 'player',
    title: 'Most Scotland caps (men)',
    note: 'Scotland men’s caps at the end of the 2026 World Cup.',
    asOf: '2026-07-19',
    source: 'RSSSF Scotland record internationals (to 24 Jun 2026); Wikipedia list (SFA profiles) less the autumn 2026 caps, from RSSSF line-ups; Transfermarkt agrees on the ten and the cut',
    slots: [
      { name: 'Kenny Dalglish', clue: '102 caps' },
      { name: 'Andy Robertson', clue: '97 caps' },
      { name: 'Jim Leighton', clue: '91 caps' },
      { name: 'John McGinn', clue: '89 caps' },
      { name: 'Craig Gordon', clue: '84 caps' },
      { name: 'Darren Fletcher', clue: '80 caps' },
      { name: 'Alex McLeish', clue: '77 caps' },
      { name: 'Paul McStay', born: 1964, clue: '76 caps' },
      { name: 'Scott McTominay', clue: '73 caps' },
      { name: 'Tom Boyd', born: 1965, clue: '72 caps' },
    ],
    nearMax: 2,
    near: [
      { name: 'Ryan Christie', note: '71 caps, 1 short' },
      { name: 'Grant Hanley', note: '70 caps, 2 short' },
    ] },
  // All ten are retired; the nearest active player, Séamus Coleman, has 81.
  // Transfermarkt is one off for Staunton, Quinn, McGeady and Cascarino; RSSSF
  // and Wikipedia agree on every number shown.
  { id: 'ireland-caps', checked: '2026-10-16', until: '2027-06-01', kind: 'player',
    title: 'Most Republic of Ireland caps',
    note: 'Republic of Ireland men’s caps to 16 October 2026. Ties go to whoever got there first.',
    asOf: '2026-10-16',
    source: 'RSSSF Republic of Ireland record internationals; Wikipedia list of Republic of Ireland international footballers (4 Oct 2026); Transfermarkt agrees on the ten and the cut',
    slots: [
      { name: 'Robbie Keane', clue: '146 caps' },
      { name: 'Shay Given', clue: '134 caps' },
      { name: "John O'Shea", clue: '118 caps' },
      { name: 'Kevin Kilbane', clue: '110 caps' },
      { name: 'James McClean', clue: '103 caps' },
      { name: 'Steve Staunton', clue: '102 caps' },
      { name: 'Damien Duff', clue: '100 caps' },
      { name: 'Aiden McGeady', clue: '93 caps' },
      { name: 'Niall Quinn', clue: '91 caps' },
      { name: 'Glenn Whelan', clue: '91 caps' },
    ],
    nearMax: 2,
    near: [
      { name: 'Tony Cascarino', note: '88 caps, 3 short' },
      { name: 'Shane Long', note: '88 caps, 3 short' },
    ] },
  // Zanetti is 142 on the AFA's 2018 count, 143 on Wikipedia's list and 145 on
  // RSSSF and his own Wikipedia page: the list names RSSSF, whose numbers it
  // prints for all ten, in RSSSF's order (Di María above Zanetti, both 145).
  // RSSSF counts two 1995-96 matches others leave out, which is also why
  // Simeone (104 elsewhere) and Ayala (112 on NFT) differ; no place changes.
  // ⚠️ NOT CHECKED (16 Oct): three numbers a fan can fairly dispute is below
  // the zero-error bar, so it does not ship. Northern Ireland took its day.
  { id: 'argentina-caps', kind: 'player',
    title: 'Most Argentina caps (men)',
    note: 'Argentina men’s caps at the end of the 2026 World Cup, on RSSSF’s count.',
    asOf: '2026-10-16',
    source: 'RSSSF Argentina record internationals; national-football-teams.com (both at the 19 Jul 2026 final); Wikipedia list less the 6 Oct 2026 caps',
    slots: [
      { name: 'Lionel Messi', clue: '207 caps' },
      { name: 'Javier Mascherano', clue: '147 caps' },
      { name: 'Ángel Di María', clue: '145 caps' },
      { name: 'Javier Zanetti', clue: '145 caps' },
      { name: 'Nicolás Otamendi', clue: '139 caps' },
      { name: 'Roberto Ayala', clue: '115 caps' },
      { name: 'Diego Simeone', born: 1970, clue: '106 caps' },
      { name: 'Sergio Agüero', clue: '101 caps' },
      { name: 'Oscar Ruggeri', clue: '97 caps' },
      { name: 'Sergio Romero', born: 1987, clue: '96 caps' },
    ],
    nearMax: 2,
    near: [
      { name: 'Rodrigo De Paul', note: '94 caps, 2 short' },
      { name: 'Diego Maradona', note: '91 caps, 5 short' },
    ] },
  // The cut is one point (Udinese 50, Sassuolo 49) but the season is over and
  // no deduction is pending on any source.
  { id: 'serie-a-2025-26-table', checked: '2026-10-16', until: '2027-12-31', kind: 'club',
    title: 'Serie A 2025-26: the top ten',
    note: 'Points in the 2025-26 Serie A, final table.',
    asOf: '2026-10-16',
    source: 'ESPN Serie A 2025-26 standings (all 38 played); Transfermarkt final table; Wikipedia 2025-26 Serie A table: every row agrees',
    slots: [
      { name: 'Inter Milan', clue: '87 points' },
      { name: 'Napoli', clue: '76 points' },
      { name: 'Roma', clue: '73 points' },
      { name: 'Como', clue: '71 points' },
      { name: 'AC Milan', clue: '70 points' },
      { name: 'Juventus', clue: '69 points' },
      { name: 'Atalanta', clue: '59 points' },
      { name: 'Bologna', clue: '56 points' },
      { name: 'Lazio', clue: '54 points' },
      { name: 'Udinese', clue: '50 points' },
    ],
    near: [
      { name: 'Sassuolo', note: '49 points, 1 short' },
      { name: 'Torino', note: '45 points, 5 short' },
      { name: 'Parma', note: '45 points, 5 short' },
    ] },
  // Live in principle (Magennis and McNair still play; next matches 14 and 17
  // Nov), hence "to 16 October". Magennis 93 = NFT's 91 to 28 Sep plus two
  // substitute caps on 2 and 5 Oct (ESPN line-ups), as Wikipedia has it;
  // RSSSF's 89 is at 7 Jun. NFT has Evans 106; Wikipedia, RSSSF and the Irish
  // FA say 107. Nobody below can reach 88 by 1 January (McNair 85).
  { id: 'northern-ireland-caps', checked: '2026-10-16', until: '2027-12-31', kind: 'player',
    title: 'Most Northern Ireland caps',
    note: 'Northern Ireland men’s caps to 16 October 2026. Ties go to whoever got there first.',
    asOf: '2026-10-16',
    source: 'Wikipedia Northern Ireland national team, most capped (updated 5 Oct 2026); RSSSF Northern Ireland record internationals (to 7 Jun 2026); national-football-teams.com plus ESPN line-ups of 2 and 5 Oct; Irish FA (Evans)',
    slots: [
      { name: 'Steven Davis', born: 1985, clue: '140 caps' },
      { name: 'Pat Jennings', clue: '119 caps' },
      { name: 'Aaron Hughes', clue: '112 caps' },
      { name: 'Jonny Evans', clue: '107 caps' },
      { name: 'David Healy', born: 1979, clue: '95 caps' },
      { name: 'Josh Magennis', clue: '93 caps' },
      { name: 'Mal Donaghy', born: 1957, clue: '91 caps' },
      { name: 'Kyle Lafferty', clue: '89 caps' },
      { name: 'Sammy McIlroy', clue: '88 caps' },
      { name: 'Maik Taylor', born: 1971, clue: '88 caps' },
    ],
    nearMax: 2,
    near: [
      { name: 'Keith Gillespie', note: '86 caps, 2 short' },
      { name: 'Paddy McNair', note: '85 caps, 3 short' },
    ] },
  // Cannot change before the 2030 World Cup. Very close to two lists already
  // played (matches won, 15 Oct; World Cups played, 19 Nov): a spare, not
  // scheduled unless a better nation list fails.
  { id: 'world-cup-matches-played', checked: '2026-10-16', until: '2030-06-08', kind: 'nation',
    title: 'Most World Cup matches played',
    note: 'Men’s World Cup matches, 1930 to 2026. Germany includes West Germany.',
    asOf: '2026-10-16',
    source: 'RSSSF World Cup total rankings 1930-2022 plus FIFA’s 2026 Competition Summary; Wikipedia all-time table (2026); Transfermarkt all-time table',
    slots: [
      { name: 'Brazil', clue: '119 matches' },
      { name: 'Germany', clue: '116 matches' },
      { name: 'Argentina', clue: '96 matches' },
      { name: 'Italy', clue: '83 matches' },
      { name: 'England', clue: '82 matches' },
      { name: 'France', clue: '81 matches' },
      { name: 'Spain', clue: '75 matches' },
      { name: 'Mexico', clue: '65 matches' },
      { name: 'Uruguay', clue: '62 matches' },
      { name: 'Netherlands', clue: '59 matches' },
    ],
    nearMax: 1,
    near: [
      { name: 'Belgium', note: '57 matches, 2 short' },
    ] },
];

// Days since epoch of Top 10 #1 (the shared day index: local calendar date as a
// UTC day number, lib/date.js). ⚠️ Set once, on the day the game first ships,
// and never moved: every share text and every recorded result carries the
// number that falls out of it. Monday 12 October 2026, by Alex's word on
// 9 Oct. From the first second of that day this number is fixed for good.
export const TOP10_ANCHOR_DAY = 20738;

// The schedule: TOP10_LOG[n] is Top 10 #(n + 1). ⚠️ APPEND ONLY once the game
// is live. A released native build carries this file; reordering it would have
// two players on the same day arguing about different lists.
//
// The first twenty-seven days, 12 October to 7 November 2026. The opening list is the one
// most players can finish (ten famous names), because the first day decides
// whether anyone comes back for the second; the lists with pre-war names in
// their last slots are spaced out, and clubs, players and nations alternate.
// ⚠️ TWENTY-SEVEN DAYS IS ALL THERE IS. On the day after the last entry the game
// goes quiet and Mystery Player returns to Today by itself. More lists must be
// appended before 7 November, and a native build must not ship to the stores
// on this schedule alone: it would run dry days after release. The lists have
// to reach the app from the server first (see docs/TODO.md).
export const TOP10_LOG = [
  'premier-league-goals',            // Mon 12 Oct  #1
  'english-league-titles',           // Tue 13
  'england-caps',                    // Wed 14
  'world-cup-matches-won',           // Thu 15
  'liverpool-top-scorers',           // Fri 16
  'premier-league-appearances',      // Sat 17
  'manchester-united-top-scorers',   // Sun 18
  'premier-league-points',           // Mon 19
  'arsenal-top-scorers',             // Tue 20
  'premier-league-clean-sheets',     // Wed 21
  'chelsea-top-scorers',             // Thu 22
  'english-top-flight-seasons',      // Fri 23
  'tottenham-top-scorers',           // Sat 24
  // Third batch, added 9 Oct. Lists that share answers are kept apart: the
  // three with Ronaldo, Benzema and Raúl in them are on separate days, and
  // the keepers come eight days after the clean sheets.
  'champions-league-goals',          // Sun 25
  'premier-league-assists',          // Mon 26
  'spain-caps',                      // Tue 27
  'real-madrid-top-scorers',         // Wed 28
  'premier-league-goalkeeper-appearances', // Thu 29  (must run before 5 Dec)
  'la-liga-goals',                   // Fri 30
  // Fourth batch, added 11 Oct. Clubs and countries in turn; the two France
  // lists (Mbappé, Giroud, Henry, Griezmann, Zidane in both) five days apart.
  'manchester-united-appearances',   // Sat 31
  'france-top-scorers',              // Sun 1 Nov
  'liverpool-appearances',           // Mon 2
  'germany-top-scorers',             // Tue 3
  'arsenal-appearances',             // Wed 4
  'italy-caps',                      // Thu 5
  'chelsea-appearances',             // Fri 6
  'france-caps',                     // Sat 7
  // Batch 5 from Sun 8 Nov: lists that share answers are kept a week or more apart.
  'champions-league-finals',         // Sun 8 Nov
  'premier-league-wins',             // Mon 9
  'barcelona-appearances',           // Tue 10
  'netherlands-top-scorers',         // Wed 11
  'la-liga-seasons',                 // Thu 12
  'germany-caps',                    // Fri 13
  'premier-league-penalties',        // Sat 14
  'psg-top-scorers',                 // Sun 15
  'croatia-caps',                    // Mon 16
  'serie-a-appearances',             // Tue 17
  'real-madrid-appearances',         // Wed 18
  'world-cup-appearances',           // Thu 19
  'bundesliga-goals',                // Fri 20
  'premier-league-club-goals',       // Sat 21
  'french-league-titles',            // Sun 22
  'netherlands-caps',                // Mon 23
  'uruguay-caps',                    // Tue 24
  'juventus-appearances',            // Wed 25
  'portugal-top-scorers',            // Thu 26
  'spain-top-scorers',               // Fri 27
  'bundesliga-seasons',              // Sat 28
  'belgium-caps',                    // Sun 29
  'italy-top-scorers',               // Mon 30
  // December, added 16 Oct. The eighteen club lists of 15 Oct (already open in
  // the Top 10 browser; scheduling one locks it there until its day) and
  // thirteen new closed snapshots. A club, league or nation list every four
  // days; a club's two or three lists at least a week apart, as are lists that
  // share a name; the lists with pre-war names in their last places (Barcelona,
  // Tottenham, Newcastle, City) five or more days apart.
  'money-league-2026',               // Tue 1 Dec
  'liverpool-premier-league-goals',  // Wed 2
  'manchester-united-premier-league-appearances', // Thu 3
  'euro-matches-won',                // Fri 4
  'tottenham-premier-league-goals',  // Sat 5  (north London derby at Tottenham)
  'real-madrid-la-liga-goals',       // Sun 6
  'scotland-caps',                   // Mon 7
  'chelsea-premier-league-goals',    // Tue 8
  'premier-league-2025-26-club-goals', // Wed 9
  'barcelona-la-liga-goals',         // Thu 10
  'newcastle-premier-league-appearances', // Fri 11
  'manchester-city-premier-league-goals', // Sat 12
  'copa-america-matches-won',        // Sun 13
  'la-liga-2025-26-top-scorers',     // Mon 14
  'tottenham-appearances',           // Tue 15
  'arsenal-premier-league-goals',    // Wed 16
  'liverpool-premier-league-appearances', // Thu 17
  'uefa-club-coefficients-2026',     // Fri 18
  'premier-league-2025-26-top-scorers', // Sat 19
  'manchester-united-premier-league-goals', // Sun 20
  'newcastle-top-scorers',           // Mon 21
  'tottenham-premier-league-appearances', // Tue 22
  'fifa-ranking-july-2026',          // Wed 23
  'northern-ireland-caps',           // Thu 24
  'arsenal-premier-league-appearances', // Fri 25
  'chelsea-premier-league-appearances', // Sat 26
  'ireland-caps',                    // Sun 27
  'manchester-city-appearances',     // Mon 28
  'newcastle-premier-league-goals',  // Tue 29
  'serie-a-2025-26-table',           // Wed 30
  'world-cup-2026-top-scorers',      // Thu 31  (the year's list)
];

// One name per club. Keys are folded spellings found in the tables and in
// scripts/seo/leagues.mjs; the value is the name the player sees and picks.
// Only pairs that are certainly the same club belong here: "Inter" is Inter
// Milan in every table we hold, but "Racing", "Nacional" and "Red Star" are
// each several clubs and stay as written.
export const CLUB_CANON = {
  'milan': 'AC Milan',
  'inter': 'Inter Milan',
  'internazionale': 'Inter Milan',
  'ambrosiana inter': 'Inter Milan',
  'tsv 1860 munich': '1860 Munich',
  'az 67': 'AZ',
  'koln': '1. FC Köln',
  'fc schalke 04': 'Schalke 04',
  'schalke': 'Schalke 04',
  'stuttgart': 'VfB Stuttgart',
  'hamburg': 'Hamburger SV',
  'dortmund': 'Borussia Dortmund',
  'leverkusen': 'Bayer Leverkusen',
  'frankfurt': 'Eintracht Frankfurt',
  'freiburg': 'SC Freiburg',
  'sparta': 'Sparta Rotterdam',
  'twente': 'FC Twente',
  'utrecht': 'FC Utrecht',
  'basaksehir': 'İstanbul Başakşehir',
  'tottenham': 'Tottenham Hotspur',
  'newcastle': 'Newcastle United',
  'west ham': 'West Ham United',
  'birmingham': 'Birmingham City',
  'blackburn': 'Blackburn Rovers',
  'bolton': 'Bolton Wanderers',
  'brighton': 'Brighton & Hove Albion',
  'charlton': 'Charlton Athletic',
  'coventry': 'Coventry City',
  'ipswich': 'Ipswich Town',
  'preston': 'Preston North End',
  'newell s': "Newell's Old Boys",
  'velez': 'Vélez Sarsfield',
  'al hilal': 'Al-Hilal',
  'estudiantes': 'Estudiantes',
  'estudiantes lp': 'Estudiantes',
  'vitoria sc': 'Vitória de Guimarães',
  'man city': 'Manchester City',
  'man united': 'Manchester United',
  'psg': 'Paris Saint-Germain',
  'gladbach': 'Borussia Mönchengladbach',
  'athletic club': 'Athletic Bilbao',
  'nott m forest': 'Nottingham Forest',
  'psv eindhoven': 'PSV',
  'sheffield utd': 'Sheffield United',
  'wolves': 'Wolverhampton Wanderers',
  'west brom': 'West Bromwich Albion',
  'qpr': 'Queens Park Rangers',
  'deportivo': 'Deportivo La Coruña',
  'argentinos jrs': 'Argentinos Juniors',
  'racing': 'Racing Club',
  'athletico pr': 'Athletico Paranaense',
  'ny red bulls': 'New York Red Bulls',
  'ne revolution': 'New England Revolution',
  'sporting kc': 'Sporting Kansas City',
  'nycfc': 'New York City FC',
  'lafc': 'Los Angeles FC',
  'dep riestra': 'Deportivo Riestra',
  'indep rivadavia': 'Independiente Rivadavia',
};

// Two footballers, one name: which of them a table means. Keyed by the folded
// name, valued by the pool id. A list that means the other one sets its own
// `pins`. gen-top10 stops on any shared name that is not listed here.
export const PLAYER_PINS = {
  'luis suarez': 'Q26517', // the Uruguayan, born 1987
  'frank lampard': 'Q41533', // the son, born 1978; his father (born 1948) is in the pool too
};

// Extra spellings a player might type for a club, beyond its own name.
export const CLUB_AKA = {
  'Inter Milan': ['Internazionale', 'Inter'],
  'AC Milan': ['Milan'],
  'Paris Saint-Germain': ['PSG'],
  'Manchester United': ['Man Utd', 'Man United'],
  'Manchester City': ['Man City'],
  'Tottenham Hotspur': ['Spurs'],
  'Wolverhampton Wanderers': ['Wolves'],
  'Borussia Dortmund': ['BVB', 'Dortmund'],
  'Borussia Mönchengladbach': ['Gladbach'],
  'Bayern Munich': ['Bayern München', 'FC Bayern'],
  '1. FC Köln': ['Cologne', 'Koln'],
  'Bayer Leverkusen': ['Leverkusen'],
  'Eintracht Frankfurt': ['Frankfurt'],
  'Hamburger SV': ['Hamburg', 'HSV'],
  'Atlético Madrid': ['Atleti'],
  'Athletic Bilbao': ['Athletic Club'],
  'Sporting CP': ['Sporting Lisbon'],
  'Red Star Belgrade': ['Crvena zvezda'],
  'Nottingham Forest': ["Nott'm Forest"],
  'Sheffield Wednesday': ['Sheff Wed'],
  'Sheffield United': ['Sheff Utd'],
  'West Bromwich Albion': ['West Brom', 'WBA'],
  'Queens Park Rangers': ['QPR'],
  'Brighton & Hove Albion': ['Brighton'],
  'Marseille': ['Olympique de Marseille', 'OM'],
  'Lyon': ['Olympique Lyonnais', 'OL'],
  'Saint-Étienne': ['St Etienne', 'ASSE'],
  'PSV': ['PSV Eindhoven'],
  'Steaua București': ['FCSB', 'Steaua Bucharest'],
};

// Nations: one name per team, and the old names people still type.
export const NATION_CANON = {
  'west germany': 'Germany',
  'zaire': 'DR Congo',
};
export const NATION_AKA = {
  'Germany': ['West Germany', 'Deutschland'],
  'Netherlands': ['Holland'],
  'Ivory Coast': ["Côte d'Ivoire", 'Cote d Ivoire'],
  'United States': ['USA', 'America'],
  'South Korea': ['Korea Republic'],
  'Soviet Union': ['USSR'],
  'DR Congo': ['Zaire', 'Congo DR'],
  'Czechoslovakia': ['Czecho-Slovakia'],
  'Türkiye': ['Turkey'],
  'Czech Republic': ['Czechia'],
  'Republic of Ireland': ['Ireland', 'Eire'],
  'England': [],
};

// National teams the guess box offers beyond those that appear in a table, so a
// nations list is not a pick from the seventy sides that ever reached a final.
export const MORE_NATIONS = [
  'Albania', 'Angola', 'Austria', 'Belgium', 'Bosnia and Herzegovina', 'Bulgaria', 'Burkina Faso',
  'Canada', 'Cape Verde', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Czech Republic',
  'Ecuador', 'Finland', 'Gabon', 'Georgia', 'Guinea', 'Honduras', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Jamaica', 'Jordan', 'Mali', 'Mexico', 'Montenegro', 'New Zealand', 'North Korea',
  'North Macedonia', 'Northern Ireland', 'Norway', 'Panama', 'Paraguay', 'Peru', 'Poland',
  'Republic of Ireland', 'Romania', 'Russia', 'Scotland', 'Senegal', 'Serbia', 'Slovakia',
  'Slovenia', 'Sweden', 'Switzerland', 'Togo', 'Trinidad and Tobago', 'Türkiye', 'Ukraine',
  'United Arab Emirates', 'Uzbekistan', 'Venezuela', 'Wales', 'Yugoslavia', 'Zimbabwe',
];
