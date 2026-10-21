// Render scenarios for tests/unit/i18n-screens.test.js (i18n step 4).
//
// Each scenario renders one step 4 surface in one state to static markup: the
// shared finish panels (DailyDone, ResultFoot, ChallengeBanner), the results
// of the quiz modes and Daily 7, Hot Streak and True/False, the answer review,
// the History tab, Profile (with the friend profile and blocked users), Settings
// and Onboarding. The golden file next to this (i18n-screens.golden.json)
// holds the markup these scenarios produced on main BEFORE step 4 (every
// string still a literal), so the test can prove the English output is
// byte-identical after the strings moved.
//
// State comes in the way the screens read it: props, localStorage, the mocked
// useAuth (S.auth), and for state a static render never reaches (a loaded
// fetch, an open sheet) the test's useState override: `_state` maps
// '<Component>:<n>', the n-th useState call (0-based) that component makes, to
// the value it starts with (i18n-screens.harness.js). The test file must
// vi.mock react, react-dom and useAuth, routed to the shared `S` object.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DailyDone } from '../../src/components/DailyDone.jsx';
import ResultFoot, { ReportLink } from '../../src/components/ResultFoot.jsx';
import ChallengeBanner from '../../src/components/ChallengeBanner.jsx';
import { HotStreakResults, TrueFalseResults } from '../../src/screens/ModeResults.jsx';
import { Results } from '../../src/screens/ResultsScreen.jsx';
import { DailyReviewScreen, PuzzleReviewScreen, Mini7Strip } from '../../src/screens/ReviewScreens.jsx';
import { DailyTabScreen } from '../../src/screens/DailyScreen.jsx';
import { ProfileScreen, FriendProfileScreen, BlockedUsersScreen } from '../../src/screens/ProfileScreen.jsx';
import { SettingsScreen } from '../../src/screens/SettingsScreen.jsx';
import { OnboardingScreen } from '../../src/screens/OnboardingScreen.jsx';
import { footleAnswerFor } from '../../src/lib/wordle.js';
import { getWordleDateKey } from '../../src/lib/wordleStatus.js';
import { dateToYMD } from '../../src/lib/date.js';

// Icon path data carries no strings and is most of the bytes, so each <svg>
// keeps only its opening tag (same scrub as steps 2 and 3).
export function scrub(html) {
  return html.replace(/(<svg[^>]*>)[\s\S]*?<\/svg>/g, '$1</svg>');
}

const noop = () => {};
const asyncNoop = async () => {};
// Noon on 20 Oct 2026 (the test fakes the clock).
export const TODAY = new Date(2026, 9, 20, 12, 0, 0);
const day = (n) => new Date(2026, 9, 20 - n, 12, 0, 0);
const ymd = (n) => dateToYMD(day(n));

// ── The shared finish panels ────────────────────────────────────────────────
const STREAK = { count: 5, label: 'daily streak', keepsOnLoss: true, shields: 2 };
const NEXT = [
  { key: 'daily7', name: "Today's Daily 7" },
  { key: 'trail', name: "Today's Transfer Trail" },
  { key: 'top10', name: "Today's Top 10" },
];
const DAY = { keys: ['footle', 'daily7', 'trail', 'top10'], who: () => 'Alex' };
const dd = (props) => () => React.createElement(DailyDone, { game: 'footle', edition: 170, won: true, bucket: 3, onShare: asyncNoop, track: noop, ...props });
// DailyDone's useState calls, in order: now, dist, prev, distReady, busy, shared, challengeState.
const DIST_SMALL = { n: 40, won: 34, buckets: { 1: 2, 2: 6, 3: 12, 4: 9, 5: 4, 6: 1, 0: 6 } };
const DIST_BIG = { n: 1240, won: 1240, buckets: { 0: 10, 1: 30, 2: 80, 3: 160, 4: 260, 5: 330, 6: 240, 7: 130 } };
const DIST_T10 = { n: 60, won: 60, buckets: { 0: 1, 1: 2, 2: 3, 3: 5, 4: 8, 5: 10, 6: 12, 7: 9, 8: 6, 9: 3, 10: 1 } };
const DIST_TRAIL = { n: 52, won: 40, buckets: { 1: 6, 2: 14, 3: 12, 4: 5, 5: 3, 0: 12 } };
const loaded = (dist, prev = null) => ({ "DailyDone:1": dist, "DailyDone:2": prev, "DailyDone:3": true });
const challenge = (rec) => ({ biq_game_challenge: JSON.stringify({ ...rec, at: 1 }) });
const ddScenarios = () => [
  ['dd: footle won in 3, everything on, loading', {}, dd({ streak: STREAK, remind: { state: 'off', onRemind: noop }, nextUp: NEXT, day: DAY, waText: 'x', stump: noop, stitch: noop, save: { onSave: noop, line: 'Non-League · 120 XP · 180 to Championship' }, promoted: { game: 'footle', name: 'Non-League' } })],
  ['dd: footle lost, streak safe, reminder on, early numbers', { _state: loaded(DIST_SMALL) }, dd({ won: false, bucket: 0, streak: { count: 3, label: 'daily streak', keepsOnLoss: true }, remind: { state: 'on', onRemind: noop }, nextUp: NEXT.slice(0, 1), day: DAY })],
  ['dd: footle won in 2, early numbers, one shield', { _state: loaded(DIST_SMALL) }, dd({ bucket: 2, streak: { count: 2, label: 'Footle streak', shields: 1 }, nextUp: [{ key: 'footle', name: "Continue today's Footle" }, ...NEXT], day: DAY })],
  ['dd: daily 7 on 5, headcounts', { _state: loaded(DIST_BIG) }, dd({ game: 'daily7', edition: 2300, bucket: 5, streak: { count: 1, label: 'daily streak' }, nextUp: [{ key: 'footle', name: "Today's Footle" }], day: DAY, save: { onSave: noop, line: 'Sunday League · 40 XP · 60 to Non-League' } })],
  ['dd: daily 7 on 0, early numbers', { _state: loaded({ n: 30, won: 30, buckets: { 0: 4, 1: 3, 2: 5, 3: 6, 4: 5, 5: 4, 6: 2, 7: 1 } }) }, dd({ game: 'daily7', edition: 2300, bucket: 0, streak: { count: 0, label: 'daily streak' } })],
  ['dd: trail won on 2, yesterday stands in', { _state: loaded(null, DIST_TRAIL) }, dd({ game: 'trail', edition: 75, bucket: 2, bucketMax: 6, streak: { count: 1, label: 'Trail streak' }, nextUp: NEXT.slice(2), day: DAY })],
  ['dd: daily 7 yesterday stands in', { _state: loaded(null, DIST_BIG) }, dd({ game: 'daily7', edition: 2300, bucket: 6, streak: { count: 0, label: 'daily streak' } })],
  ['dd: top 10 on 7, a mate beat it', { biq_game_challenge: challenge({ game: 'top10', edition: 12, score: 8, name: 'Sam' }).biq_game_challenge, _state: loaded(DIST_T10) }, dd({ game: 'top10', edition: 12, bucket: 7, streak: { count: 0, label: 'Top 10 streak' }, nextUp: [], day: DAY })],
  ['dd: footle won in 3, beat a mate', challenge({ game: 'footle', edition: 170, score: 4, name: 'Jo' }), dd({ streak: { count: 0 } })],
  ['dd: footle won in 4, level with an unnamed mate', challenge({ game: 'footle', edition: 170, score: 4, name: '' }), dd({ bucket: 4, streak: { count: 9, label: 'Footle streak' } })],
  ['dd: trail missed, mate got it on 1', challenge({ game: 'trail', edition: 75, score: 1, name: 'Kim' }), dd({ game: 'trail', edition: 75, won: false, bucket: 0, streak: { count: 0, label: 'Trail streak' } })],
  ['dd: mystery, day 1, archive', {}, dd({ game: 'mystery', edition: 88, bucket: 6, isArchive: true, streak: { count: 1, label: 'Mystery streak', shields: 1 }, remind: { state: 'off', onRemind: noop } })],
  ['dd: mystery won, all done today (clean sweep)', {}, dd({ game: 'mystery', edition: 88, bucket: 4, streak: { count: 12, label: 'daily streak' }, nextUp: [], day: { keys: ['footle', 'daily7', 'trail', 'mystery'] } })],
  ['dd: guest save, no streak, line only', {}, dd({ streak: { count: 0, label: 'daily streak' }, save: { onSave: noop, line: 'Sunday League · 20 XP' } })],
  ['dd: guest save, 4-day streak, no line', {}, dd({ streak: { count: 4, label: 'daily streak' }, save: { onSave: noop } })],
  ['dd: shared, no label', { _state: { "DailyDone:5": true } }, dd({ streak: { count: 2 } })],
];

const rfScenarios = () => [
  ['resultfoot: the way out only', {}, () => React.createElement(ResultFoot, { onHome: noop })],
  ['resultfoot: career report and the way out', {}, () => React.createElement(ResultFoot, { thing: 'Career', info: { id: 1 }, onReport: noop, onHome: noop })],
  ['resultfoot: list report, more lists, the way out', {}, () => React.createElement(ResultFoot, { thing: 'List', info: { id: 1 }, onReport: noop, onHome: noop, more: { label: 'More Top 10 lists', onClick: noop } })],
  ['resultfoot: the answer report link alone', {}, () => React.createElement(ReportLink, { thing: 'Answer', info: { id: 1 }, onReport: noop })],
];

const banner = (game, edition) => () => React.createElement(ChallengeBanner, { game, edition, finished: false });
const bannerScenarios = () => [
  ['challenge banner: footle solved in 3', challenge({ game: 'footle', edition: 170, score: 3, name: 'Alex Brynolsen' }), banner('footle', 170)],
  ['challenge banner: footle missed, no name', challenge({ game: 'footle', edition: 170, score: 0, name: '' }), banner('footle', 170)],
  ['challenge banner: trail on 1 club', challenge({ game: 'trail', edition: 75, score: 1, name: 'Sam' }), banner('trail', 75)],
  ['challenge banner: trail on 3 clubs', challenge({ game: 'trail', edition: 75, score: 3, name: 'Sam' }), banner('trail', 75)],
  ['challenge banner: top 10 on 7', challenge({ game: 'top10', edition: 12, score: 7, name: 'Kim' }), banner('top10', 12)],
];

// ── Results ─────────────────────────────────────────────────────────────────
const hot = (result, prevBest) => () => React.createElement(HotStreakResults, { result, prevBest, onRetry: noop, onHome: noop, onShare: noop });
const tf = (result) => () => React.createElement(TrueFalseResults, { result, onRetry: noop, onHome: noop, onShare: noop });
const modeResultScenarios = () => [
  ['hot streak: first run, 3', {}, hot({ score: 3, total: 5 }, 0)],
  ['hot streak: new best 16, was 10', {}, hot({ score: 16, total: 20 }, 10)],
  ['hot streak: 9, best 20', {}, hot({ score: 9, total: 12 }, 20)],
  ['hot streak: 26', {}, hot({ score: 26, total: 28 }, 30)],
  ['hot streak: nothing', {}, hot({ score: 0, total: 0 }, 4)],
  ['true or false: perfect 10', {}, tf({ score: 10, total: 10 })],
  ['true or false: 7 of 10', {}, tf({ score: 7, total: 10 })],
  ['true or false: 3 of 10', {}, tf({ score: 3, total: 10 })],
];

const WRONG = [
  { id: 'q1', q: 'Which club won the 2005 Champions League final?', user: 'Milan', correct: 'Liverpool', hint: 'Istanbul.' },
  { id: 'q2', q: 'Who scored the 2014 World Cup final winner?', user: null, correct: 'Götze' },
];
const ASKED = [
  { id: 'q1', type: 'mcq', q: 'Which club won the 2005 Champions League final?', o: ['Liverpool', 'Milan'], cat: 'UCL', diff: 'hard' },
  { id: 'q9', type: 'mcq', q: 'Who won the 2016 Premier League?', o: ['Leicester', 'Arsenal'], cat: 'PL', diff: 'easy' },
];
const answers = (n, right) => Array.from({ length: n }, (_, i) => ({ isCorrect: i < right }));
const DD_SERVICES = { streak: STREAK, remind: { state: 'off', onRemind: noop }, nextUp: [{ key: 'footle', name: "Today's Footle" }], day: DAY, save: null, track: noop, promoted: null };
const res = (props) => () => React.createElement(Results, { onHome: noop, onRetry: noop, onShare: noop, onPlayFootle: noop, onPlayDaily: noop, onReport: noop, ...props });
const footleToday = (status) => ({ [`biq_wordle_${getWordleDateKey(TODAY)}`]: JSON.stringify(status) });
const resultsScenarios = () => [
  ['results: classic 7/10, new best over 5, footle open', {}, res({ mode: 'classic', result: { score: 7, total: 10, bestStreak: 4, allAnswers: answers(10, 7) }, classicBest: 5, wrongAnswers: WRONG, askedQuestions: ASKED, cardDelta: { ratedAfter: false, toRated: 3 } })],
  ['results: classic 3/10, daily open (the daily is the primary), one more to rate', footleToday({ guesses: ['ABCDEF'], status: 'playing' }), res({ mode: 'classic', result: { score: 3, total: 10, bestStreak: 1, allAnswers: answers(10, 3) }, dailyOpen: true, askedQuestions: ASKED, wrongAnswers: WRONG.slice(0, 1), cardDelta: { ratedAfter: false, toRated: 1 } })],
  ['results: legends 10/10, footle done, just rated', footleToday({ guesses: ['KANE'], status: 'won' }), res({ mode: 'legends', label: 'Arsenal', result: { score: 10, total: 10, bestStreak: 10, allAnswers: answers(10, 10) }, cardDelta: { ratedAfter: true, ratedBefore: false, after: 62 } })],
  ['results: chaos 5/10, rated and moved', footleToday({ guesses: ['KANE'], status: 'won' }), res({ mode: 'chaos', result: { score: 5, total: 10, bestStreak: 3 }, cardDelta: { ratedAfter: true, ratedBefore: true, before: 58, after: 62, faces: [{ abbr: 'EPL', color: '#3D195B', before: 60, after: 66 }, { abbr: 'UCL', color: '#123A8F', before: 55, after: 55 }] } })],
  ['results: chaos 2/10, rating held', footleToday({ guesses: ['KANE'], status: 'won' }), res({ mode: 'chaos', result: { score: 2, total: 10 }, cardDelta: { ratedAfter: true, ratedBefore: true, before: 58, after: 58, faces: [] } })],
  ['results: survival 0 (first-question death)', {}, res({ mode: 'survival', result: { score: 0, total: 1, bestStreak: 0 }, survivalBest: 0 })],
  ['results: survival 12, new best over 8', footleToday({ guesses: ['KANE'], status: 'won' }), res({ mode: 'survival', result: { score: 12, total: 13, bestStreak: 12 }, survivalBest: 8, dailyOpen: true, askedQuestions: ASKED, wrongAnswers: WRONG.slice(1) })],
  ['results: speed 4/10 with a winner', footleToday({ guesses: ['KANE'], status: 'won' }), res({ mode: 'speed', result: { score: 4, total: 10, winner: 'Alex' } })],
  ['results: daily 7 on 5, the panel', {}, res({ mode: 'daily', result: { score: 5, total: 7, bestStreak: 3, allAnswers: answers(7, 5), dailyEdition: 2300 }, dailyDone: DD_SERVICES, wrongAnswers: WRONG, askedQuestions: ASKED })],
  ['results: daily 7 on 7', {}, res({ mode: 'daily', result: { score: 7, total: 7, dailyEdition: 2300 }, dailyDone: DD_SERVICES })],
  ['results: daily 7 on 1, archive', {}, res({ mode: 'daily', result: { score: 1, total: 7, dailyEdition: 2299, dailyArchive: true }, dailyDone: DD_SERVICES })],
];

// ── Answer review ───────────────────────────────────────────────────────────
const ALL = [
  { q: 'Which club won the 2005 Champions League final?', type: 'mcq', cat: 'UCL', options: ['Liverpool', 'Milan', 'Chelsea', 'Barcelona'], userIdx: 1, correctIdx: 0, isCorrect: false },
  { q: 'Leicester won the Premier League in 2016.', type: 'tf', cat: 'WorldCup', options: ['TRUE', 'FALSE'], userIdx: 0, correctIdx: 0, isCorrect: true },
  { q: 'Name the Arsenal striker with 228 goals.', type: 'typed', cat: 'Legends', userText: 'Henry', correctText: 'Thierry Henry', isCorrect: true },
  { q: 'Name the Spurs striker.', type: 'typed', cat: 'ClubQuiz', userText: 'Kane?', correctText: 'Harry Kane', isCorrect: false, timedOut: true },
  { q: 'Who managed Barcelona in 2009?', type: 'mcq', cat: 'Managers', options: ['Guardiola', 'Rijkaard'], userIdx: null, correctIdx: 0, isCorrect: false, timedOut: true },
];
const HIST = { [ymd(1)]: 5, [ymd(3)]: 7, [ymd(8)]: 2 };
const review = (props) => () => React.createElement(DailyReviewScreen, { date: TODAY, score: 4, dailyHistory: HIST, onBack: noop, ...props });
const puzzle = (props) => () => React.createElement(PuzzleReviewScreen, { date: TODAY, onBack: noop, ...props });
const reviewScenarios = () => {
  const a = footleAnswerFor(TODAY);
  const miss = (n) => 'QWZXVJKYBP'.slice(0, a.length).split('').map((c, i) => (c === a[i] ? 'Q' : 'QWZXVJKYBP'[(i + n) % 10])).join('');
  return [
    ['review: daily 7 today, full review, day 1 streak', {}, review({ allAnswers: ALL, loginStreak: 1 })],
    ['review: daily 7 a past day, missed answers only, 4-day streak', {}, review({ date: day(3), score: 6, wrongAnswers: WRONG.slice(0, 1), loginStreak: 4 })],
    ['review: daily 7, two missed answers', {}, review({ date: day(1), score: 5, wrongAnswers: WRONG })],
    ['review: daily 7, nothing recorded', {}, review({ date: day(8), score: 2 })],
    ['review: the 7-day strip alone', {}, () => React.createElement(Mini7Strip, { history: HIST, today: TODAY })],
    ['review: footle won in 1', {}, puzzle({ guesses: [a], status: 'won' })],
    ['review: footle won in 4, clue, hard', {}, puzzle({ guesses: [miss(1), miss(2), miss(3), a], status: 'won', clue: true, hard: true })],
    ['review: footle won in 6', {}, puzzle({ guesses: [miss(1), miss(2), miss(3), miss(4), miss(5), a], status: 'won' })],
    ['review: footle lost', {}, puzzle({ guesses: [1, 2, 3, 4, 5, 6].map(miss), status: 'lost' })],
    ['review: footle, nothing recorded', {}, puzzle({ guesses: [], status: 'playing' })],
  ];
};

// ── History (the Daily tab) ─────────────────────────────────────────────────
const hist = (props) => () => React.createElement(DailyTabScreen, {
  profile: { name: 'Alex' }, xp: 300, shieldCount: 0, dailyHistory: {}, startMode: noop, setScreen: noop,
  dailyDone: false, dailyScore: null, playDailyForDate: noop, loginStreak: 0, bestLoginStreak: 0, playArchive: noop, ...props,
});
const fl = (n, rec) => ({ [`biq_wordle_${ymd(n)}`]: JSON.stringify(rec) });
const tr = (n, rec) => ({ [`biq_trail_${ymd(n)}`]: JSON.stringify(rec) });
const t10 = (n, rec) => ({ [`biq_top10_${ymd(n)}`]: JSON.stringify(rec) });
const my = (n, rec) => ({ [`biq_mystery_${ymd(n)}`]: JSON.stringify(rec) });
const g = (k) => Array.from({ length: k }, () => 'X');
const historyScenarios = () => [
  ['history: a new player, nothing played', {}, hist()],
  ['history: today played, no past days yet', fl(0, { guesses: g(3), status: 'won' }), hist()],
  ['history: two weeks with gaps, yesterday open', {
    ...fl(0, { guesses: g(3), status: 'won' }), ...fl(2, { guesses: g(6), status: 'lost' }), ...fl(6, { guesses: g(2), status: 'won', arc: true }),
    ...tr(2, { status: 'won', attempts: g(2) }), ...tr(9, { status: 'lost', attempts: g(5) }),
    ...t10(2, { status: 'done', score: 6 }), ...t10(3, { status: 'playing', score: 2, picks: [1] }),
    ...my(12, { won: true, guesses: g(5) }), ...my(13, { won: false, guesses: g(2) }),
  }, hist({ dailyHistory: { [ymd(2)]: 5, [ymd(9)]: 3, [ymd(13)]: 7 }, loginStreak: 1, bestLoginStreak: 6, shieldCount: 1 })],
  ['history: all done today, yesterday open, streak broke', {
    ...fl(0, { guesses: g(3), status: 'won' }), ...tr(0, { status: 'won', attempts: g(2) }), ...t10(0, { status: 'done', score: 7 }),
    ...fl(4, { guesses: g(4), status: 'won' }),
  }, hist({ dailyDone: true, dailyScore: 6, dailyHistory: { [ymd(0)]: 6, [ymd(4)]: 4 }, loginStreak: 1, bestLoginStreak: 1, shieldCount: 2, streakRepair: { fell: 9 } })],
  ['history: all done today and yesterday (survival), at best', {
    ...fl(0, { guesses: g(1), status: 'won' }), ...tr(0, { status: 'lost', attempts: g(5) }), ...t10(0, { status: 'done', score: 10 }),
    ...fl(1, { guesses: g(2), status: 'won' }), ...tr(1, { status: 'won', attempts: g(1) }), ...t10(1, { status: 'done', score: 3 }),
  }, hist({ dailyDone: true, dailyScore: 7, dailyHistory: { [ymd(0)]: 7, [ymd(1)]: 2 }, loginStreak: 2, bestLoginStreak: 2, onStartLeague: noop })],
  ['history: streak broke, yesterday all done', {
    ...fl(1, { guesses: g(2), status: 'won' }), ...tr(1, { status: 'won', attempts: g(1) }), ...t10(1, { status: 'done', score: 3 }),
  }, hist({ dailyHistory: { [ymd(1)]: 2 }, loginStreak: 0, bestLoginStreak: 3, streakRepair: { fell: 3 } })],
];

// ── Profile ─────────────────────────────────────────────────────────────────
const CAT = { PL: { a: 40, c: 28 }, UCL: { a: 22, c: 12 }, WorldCup: { a: 15, c: 9 }, Legends: { a: 12, c: 5 }, Records: { a: 3, c: 2 } };
const STATS = { gamesPlayed: 24, totalAnswered: 180, totalCorrect: 110, bestScore: 9, bestStreak: 7, bestIQ: 118, bestHotStreak: 14, bestTrueFalse: 16, catStats: CAT };
const prof = (props) => () => React.createElement(ProfileScreen, {
  profile: { name: 'Alex' }, setProfile: noop, stats: STATS, xp: 1640, loginStreak: 6, bestLoginStreak: 9,
  earnedBadges: new Set(['first_blood', 'roll5', 'speed_demon', 'perfect']), onShareProfile: noop, onSaveCard: noop, onShowWeekly: noop,
  onToast: noop, onChallenge: noop, onOpenFriend: noop, onPlayDaily: noop, onPlayLeague: noop, onSetCardLeague: noop, isActiveTab: true, ...props,
});
const USER = { id: 'u1', email: 'alex@example.com' };
const signedIn = { user: USER, profile: { username: 'Alex', avatar_url: null, total_score: 4200 }, isGuest: false, isAnonUser: false };
const guest = { user: null, profile: null, isGuest: true, isAnonUser: false };
const FRIEND = (id, name, score) => ({ id: `f${id}`, status: 'accepted', requester_id: 'u1', addressee_id: `p${id}`, addressee: { id: `p${id}`, username: name, total_score: score } });
const FRIENDSHIPS = [
  FRIEND(1, 'Jo', 5200), FRIEND(2, 'Sam Lee', 1800),
  { id: 'f3', status: 'pending', requester_id: 'p3', addressee_id: 'u1', requester: { id: 'p3', username: 'Kim', total_score: 900 } },
  { id: 'f4', status: 'pending', requester_id: 'u1', addressee_id: 'p4', addressee: { id: 'p4', username: 'Rob', total_score: 10 } },
];
// ProfileScreenImpl's useState calls: showAvatarMenu 0, uploading 1, recalSeen 2,
// leaguePickerOpen 3, pendingCrop 4, sampleDismissed 5, editingName 6,
// nameDraft 7, pendingName 8, selectedBadgeId 9. FriendsSection's: search 0,
// results 1, searching 2, friendships 3, loading 4, loadError 5, blockMask 6.
const profileScenarios = () => [
  ['profile: guest, first visit (the example card)', {}, prof({ stats: { gamesPlayed: 0, totalAnswered: 0 }, xp: 0, loginStreak: 0, bestLoginStreak: 0, earnedBadges: new Set(), profile: {} }), guest],
  ['profile: guest, 4 answered, example dismissed', { biq_sample_card_dismissed: '1' }, prof({ stats: { gamesPlayed: 1, totalAnswered: 4, totalCorrect: 3 }, xp: 30, loginStreak: 1, earnedBadges: new Set(['first_blood']) }), guest],
  ['profile: anonymous invite player, rated', { biq_sample_card_dismissed: '1' }, prof({ profile: { name: 'Player' } }), { ...signedIn, profile: { username: 'player_9x2', total_score: 10 }, isAnonUser: true }],
  ['profile: signed in, rated, friends and requests', { biq_sample_card_dismissed: '1', _state: { "ProfileScreenImpl:2": false, "ProfileScreenImpl:9": 'speed_demon', "FriendsSection:3": FRIENDSHIPS } }, prof(), signedIn],
  ['profile: signed in, no friends yet, badge locked open, no rating yet', { biq_sample_card_dismissed: '1', _state: { "ProfileScreenImpl:9": 'goat' } }, prof({ stats: { gamesPlayed: 2, totalAnswered: 0, totalCorrect: 0 }, earnedBadges: new Set(), loginStreak: 0 }), signedIn],
  ['profile: friend search, nothing found', { biq_sample_card_dismissed: '1', _state: { "FriendsSection:0": 'zz' } }, prof(), signedIn],
  ['profile: friend search, two found', { biq_sample_card_dismissed: '1', _state: { "FriendsSection:0": 'jo', "FriendsSection:1": [{ id: 'p8', username: 'Joan', total_score: 1234 }, { id: 'p9', username: 'Jorge', total_score: 0 }] } }, prof(), signedIn],
  ['profile: friends failed to load', { biq_sample_card_dismissed: '1', _state: { "FriendsSection:5": true } }, prof(), signedIn],
  ['profile: editing the name', { biq_sample_card_dismissed: '1', _state: { "ProfileScreenImpl:6": true, "ProfileScreenImpl:7": 'Alex B' } }, prof(), signedIn],
  ['profile: set your name (default name)', { biq_sample_card_dismissed: '1' }, prof({ profile: {} }), { ...signedIn, profile: { username: 'Player' } }],
  ['profile: photo menu open', { biq_sample_card_dismissed: '1', _state: { "ProfileScreenImpl:0": true } }, prof(), signedIn],
  ['profile: league picker open', { biq_sample_card_dismissed: '1', _state: { "ProfileScreenImpl:3": true } }, prof({ stats: { ...STATS, cardLeague: 'LaLiga' } }), signedIn],
  ['profile: crop sheet open', { biq_sample_card_dismissed: '1', _state: { "ProfileScreenImpl:4": { name: 'x.jpg' } } }, prof(), signedIn],
  ['profile: a weak spread (all-rounder), no streak', { biq_sample_card_dismissed: '1' }, prof({ stats: { ...STATS, bestHotStreak: 0, bestTrueFalse: 0, catStats: { PL: { a: 20, c: 12 }, UCL: { a: 20, c: 12 }, WorldCup: { a: 20, c: 12 } } }, loginStreak: 0, onPlayLeague: undefined }), signedIn],
];

const friend = (data, extra = {}) => () => React.createElement(FriendProfileScreen, { friendId: 'p1', onBack: noop, onChallenge: noop, onToast: noop, ...extra });
const FRIEND_ROW = { id: 'p1', username: 'Jo', avatar_id: null, avatar_url: null, total_score: 5200, games_played: 40, correct_answers: 300, xp: 3400, stats: { totalAnswered: 520, bestScore: 10, bestStreak: 12, bestIQ: 131, bestHotStreak: 18, bestTrueFalse: 19, catStats: CAT } };
// FriendProfileScreenImpl: data 0, menuOpen 1, reportOpen 2, blockConfirmOpen 3, reportReason 4, reportMessage 5, submitting 6.
const friendScenarios = () => [
  ['friend: loading', {}, friend()],
  ['friend: could not load', { _state: { "FriendProfileScreenImpl:0": false } }, friend()],
  ['friend: loaded', { _state: { "FriendProfileScreenImpl:0": FRIEND_ROW } }, friend()],
  ['friend: no stats, no xp', { _state: { "FriendProfileScreenImpl:0": { id: 'p2', username: null, stats: null } } }, friend()],
  ['friend: the menu', { _state: { "FriendProfileScreenImpl:0": FRIEND_ROW, "FriendProfileScreenImpl:1": true } }, friend()],
  ['friend: report sheet', { _state: { "FriendProfileScreenImpl:0": FRIEND_ROW, "FriendProfileScreenImpl:2": true } }, friend()],
  ['friend: report sending', { _state: { "FriendProfileScreenImpl:0": FRIEND_ROW, "FriendProfileScreenImpl:2": true, "FriendProfileScreenImpl:6": true } }, friend()],
  ['friend: block sheet', { _state: { "FriendProfileScreenImpl:0": FRIEND_ROW, "FriendProfileScreenImpl:3": true } }, friend()],
  ['friend: blocking', { _state: { "FriendProfileScreenImpl:0": FRIEND_ROW, "FriendProfileScreenImpl:3": true, "FriendProfileScreenImpl:6": true } }, friend()],
  ['blocked users: loading', {}, () => React.createElement(BlockedUsersScreen, { onBack: noop, onToast: noop })],
  ['blocked users: none', { _state: { "BlockedUsersScreenImpl:0": [] } }, () => React.createElement(BlockedUsersScreen, { onBack: noop, onToast: noop })],
  ['blocked users: two', { _state: { "BlockedUsersScreenImpl:0": [{ id: 'a', username: 'Troll' }, { id: 'b', username: 'Unknown' }] } }, () => React.createElement(BlockedUsersScreen, { onBack: noop, onToast: noop })],
];

// ── Settings ────────────────────────────────────────────────────────────────
const SETTINGS = { timer: true, sound: false, haptics: true, colorBlind: false };
const settings = (props) => () => React.createElement(SettingsScreen, {
  settings: SETTINGS, onUpdate: noop, onClearStats: noop, onBack: noop, onAccountDeleted: noop, ...props,
});
const auth = (o) => ({ signOut: asyncNoop, exitGuestMode: noop, openAuthPrompt: noop, ...o });
// SettingsScreenImpl: confirmDelete 0, deleting 1, confirmClearStats 2, appVer 3, confirmSignOut 4.
const settingsScenarios = () => [
  ['settings: guest, everything off', {}, settings(), auth(guest)],
  ['settings: signed in, native reminders, help rows', {}, settings({ notifSupported: true, notifEnabled: true, onShowHelp: noop, onShowPrivacy: noop, onShowKnownIssues: noop, onClearSeen: noop, onShowBlocked: noop }), auth(signedIn)],
  ['settings: signed in with Hide My Email, reminders blocked', {}, settings({ notifSupported: true, notifBlocked: true, onShowPrivacy: noop }), auth({ ...signedIn, user: { id: 'u1', email: 'x1@privaterelay.appleid.com' } })],
  ['settings: profile loading, web push on', {}, settings({ webPushAvailable: true, webPushOn: true }), auth({ user: USER, profile: null, isGuest: false })],
  ['settings: web push blocked, reviewer', {}, settings({ webPushAvailable: true, webPushBlocked: true, onOpenReview: noop }), auth({ ...signedIn, user: { id: 'u1', email: 'review@balliq.app' } })],
  ['settings: reset stats sheet', { _state: { "SettingsScreenImpl:2": true } }, settings(), auth(signedIn)],
  ['settings: sign out sheet', { _state: { "SettingsScreenImpl:4": true } }, settings(), auth(signedIn)],
  ['settings: delete sheet', { _state: { "SettingsScreenImpl:0": true } }, settings(), auth(signedIn)],
  ['settings: deleting', { _state: { "SettingsScreenImpl:0": true, "SettingsScreenImpl:1": true } }, settings(), auth(signedIn)],
];

// ── Onboarding ──────────────────────────────────────────────────────────────
const onboard = () => () => React.createElement(OnboardingScreen, { onDone: noop });
const onboardingScenarios = () => [
  ['onboarding: unanswered', {}, onboard()],
  ['onboarding: answered right', { _state: { "OnboardingScreen:0": 1 } }, onboard()],
  ['onboarding: answered wrong', { _state: { "OnboardingScreen:0": 2 } }, onboard()],
];

export function buildScenarios() {
  return [
    ...ddScenarios(),
    ...rfScenarios(),
    ...bannerScenarios(),
    ...modeResultScenarios(),
    ...resultsScenarios(),
    ...reviewScenarios(),
    ...historyScenarios(),
    ...profileScenarios(),
    ...friendScenarios(),
    ...settingsScenarios(),
    ...onboardingScenarios(),
  ];
}

/**
 * Render every scenario; returns { name: html }. `S` is the shared mock state
 * (S.auth for useAuth, S.state for the useState override), `store` the stubbed
 * localStorage's Map (cleared before each scenario).
 */
export function renderAll(S, store) {
  const out = {};
  for (const [name, patch, make, authState] of buildScenarios()) {
    store.clear();
    S.auth = authState || auth(guest);
    S.state = patch._state || null;
    S.calls = {};
    for (const [k, v] of Object.entries(patch)) if (!k.startsWith('_')) store.set(k, v);
    try {
      out[name] = scrub(renderToStaticMarkup(make()));
    } finally {
      S.state = null;
    }
  }
  return out;
}
