// Render scenarios for tests/unit/i18n-home-nav.test.js (i18n step 2).
//
// Each scenario renders one surface of Home or the navigation to static
// markup. The golden file next to this (i18n-home-nav.golden.json) holds the
// markup these scenarios produced on main BEFORE step 2 (d1a8e1b2, the commit
// that still had every string as a JSX literal), so the test can prove the
// English output is byte-identical after the strings moved into en.js.
//
// The caller must have vi.mock'ed the state readers HomeScreen uses, routed
// to the shared `S` object this module exports (see the test file).
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeScreen } from '../../src/screens/HomeScreen.jsx';
import { MultiplayerCard } from '../../src/components/MultiplayerCard.jsx';
import { BiqNav } from '../../src/BiqNav.jsx';
import { AppBar } from '../../src/components/AppBar.jsx';
import { SiteHeader } from '../../src/marketing/SiteHeader.jsx';

// Two things are scrubbed on both sides. The dateline is the device's own
// locale (toLocaleDateString(undefined, …)), which differs between a Mac and
// CI, so it becomes a token. Icon path data carries no strings and is most of
// the bytes, so each <svg> keeps only its opening tag.
export const DATELINE = '@@DATELINE@@';
export function scrub(html) {
  return html
    .replace(/(<span class="hg-dateline">)[^<]*(<\/span>)/g, `$1${DATELINE}$2`)
    .replace(/(<svg[^>]*>)[\s\S]*?<\/svg>/g, '$1</svg>');
}

const noop = () => {};
const CLUB_PACKS = {
  Arsenal: { name: 'Arsenal', color: '#EF0107' },
  Liverpool: { name: 'Liverpool', color: '#C8102E' },
  Barcelona: { name: 'Barcelona', color: '#A50044' },
  Chelsea: { name: 'Chelsea', color: '#034694' },
  ManCity: { name: 'Manchester City', color: '#6CABDD' },
  RealMadrid: { name: 'Real Madrid', color: '#FFFFFF' },
  Tottenham: { name: 'Tottenham', color: '#132257' },
  ManUtd: { name: 'Manchester United', color: '#DA291C' },
  Ajax: { name: 'Ajax' },
};
const CLUB_ABBR = { Arsenal: 'ARS', Liverpool: 'LIV', Barcelona: 'BAR', Chelsea: 'CHE', ManCity: 'MCI', RealMadrid: 'RMA', Tottenham: 'TOT' };
const PLAYED_STATS = {
  totalAnswered: 120, totalCorrect: 84, bestScore: 8,
  catStats: { pl: { a: 40, c: 30 }, ucl: { a: 30, c: 20 } },
};

const baseState = () => ({
  ws: { kind: 'none' }, trailLive: true, trailDay: null, top10Live: true, top10Day: null, mysteryRes: null,
  auth: { user: null, profile: null, isGuest: true, openAuthPrompt: noop },
});

const home = (props = {}) => React.createElement(HomeScreen, {
  profile: null, loginStreak: 0, streakPulsing: false, bestLoginStreak: 0, stats: {}, xp: 0, dailyHistory: [],
  dailyDone: false, dailyScore: 0, setTab: noop, setNameEditNonce: noop, setScreen: noop, showToast: noop,
  viewPuzzleStatus: noop, viewDailyScore: noop, startMode: noop, shareCard: noop, challenge: null,
  onPlayChallenge: noop, onDismissChallenge: noop, setOnlineAutoCreate: noop,
  clubPacks: CLUB_PACKS, clubAbbr: CLUB_ABBR, launchClubQuiz: noop,
  ...props,
});

const TODAY = '20261020';
const YESTERDAY = '20261019';

/** [name, state patch, element] — state patch is applied to S before render. */
export const SCENARIOS = [
  ['home: guest, nothing played, Top 10 day (Mystery as a side row)', {}, () => home()],
  ['home: first session, notifications, named challenge today', {}, () => home({
    firstSession: true, notifCount: 3, onOpenNotifs: noop, loginStreak: 4, bestLoginStreak: 9,
    challenge: { name: 'Sam', score: 5, date: TODAY },
  })],
  ['home: unnamed challenge on yesterday\'s score, bell with no count, no settings gear', {}, () => home({
    notifCount: 0, onOpenNotifs: noop, showSettings: false,
    challenge: { score: 6, date: YESTERDAY },
  })],
  ['home: everything in progress (Footle 3 of 6, Top 10 open, Mystery side row 1 guess)', {
    ws: { kind: 'in-progress', used: 3 },
    top10Day: { status: 'playing', picks: ['a', 'b'], score: 2 },
    mysteryRes: { guesses: ['x'] },
  }, () => home({ dailyDone: true, dailyScore: 5, stats: PLAYED_STATS, xp: 2350, loginStreak: 12, bestLoginStreak: 20, profile: { name: 'Alex' } })],
  ['home: Mystery side row with 2 guesses, Footle solved', {
    ws: { kind: 'won', used: 4 }, mysteryRes: { guesses: ['x', 'y'] },
  }, () => home()],
  ['home: Mystery side row done, Footle lost, Trail done', {
    ws: { kind: 'lost', used: 6 }, mysteryRes: { won: true }, trailDay: { status: 'won' },
  }, () => home()],
  ['home: no Top 10 today — Mystery is the fourth daily, 1 guess in', {
    top10Live: false, mysteryRes: { guesses: ['x'] },
  }, () => home()],
  ['home: no Top 10 today — Mystery daily with 3 guesses, Trail off', {
    top10Live: false, trailLive: false, mysteryRes: { guesses: ['x', 'y', 'z'] },
  }, () => home()],
  ['home: no Top 10 today — Mystery daily done', {
    top10Live: false, mysteryRes: { gaveUp: true },
  }, () => home()],
  ['home: all four done (the done strip)', {
    ws: { kind: 'won', used: 2 }, trailDay: { status: 'lost' }, top10Day: { status: 'done', score: 7, picks: [] },
  }, () => home({ dailyDone: true, dailyScore: 7 })],
  ['home: all three done, Trail and Top 10 off', {
    ws: { kind: 'won', used: 2 }, trailLive: false, top10Live: false,
  }, () => home({ dailyDone: true, dailyScore: 3 })],
  ['home: no club packs (finder hidden)', {}, () => home({ clubPacks: null })],
  ['multiplayer card', {}, () => React.createElement(MultiplayerCard, { onInvite: noop, onOpen: noop })],
  ['BiqNav: home tab, daily not done, signed out', {}, () => React.createElement(BiqNav, { tab: 'home', setTab: noop, setScreen: noop, dailyDone: false, onHomeClick: noop })],
  ['BiqNav: settings active, 12 notifications', {}, () => React.createElement(BiqNav, { tab: 'profile', active: 'settings', setTab: noop, setScreen: noop, dailyDone: true, onHomeClick: noop, notifCount: 12, onOpenNotifs: noop })],
  ['BiqNav: 3 notifications', {}, () => React.createElement(BiqNav, { tab: 'online', setTab: noop, setScreen: noop, dailyDone: true, onHomeClick: noop, notifCount: 3, onOpenNotifs: noop })],
  ['AppBar: signed out', {}, () => React.createElement(AppBar, { tab: 'home', setTab: noop, setScreen: noop, dailyDone: false })],
  ['AppBar: 2 notifications, settings active', {}, () => React.createElement(AppBar, { tab: 'daily', active: 'settings', setTab: noop, setScreen: noop, dailyDone: true, notifCount: 2, onOpenNotifs: noop })],
  ['AppBar: bell with no count', {}, () => React.createElement(AppBar, { tab: 'online', setTab: noop, setScreen: noop, dailyDone: true, notifCount: 0, onOpenNotifs: noop })],
  ['SiteHeader: signed out', {}, () => React.createElement(SiteHeader, {})],
  ['SiteHeader: signed in, games active', {}, () => React.createElement(SiteHeader, { signedIn: true, active: 'games', onProfile: noop })],
];

/** Render every scenario against the shared state object; returns { name: html }. */
export function renderAll(S) {
  const out = {};
  for (const [name, patch, make] of SCENARIOS) {
    Object.assign(S, baseState(), patch);
    out[name] = scrub(renderToStaticMarkup(make()));
  }
  return out;
}
