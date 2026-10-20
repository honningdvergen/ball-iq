// Render scenarios for tests/unit/i18n-games.test.js (i18n step 3).
//
// Each scenario renders one daily game's PLAY screen in one state to static
// markup: Footle, the quiz engine (Daily 7 and the quiz modes), the Quiz topic
// screen, Transfer Trail, Mystery Player and Top 10. The golden file next to
// this (i18n-games.golden.json) holds the markup these scenarios produced on
// main BEFORE step 3 (d5d4cbc7, every string still a JSX literal), so the test
// can prove the English output is byte-identical after the strings moved.
//
// State comes in the way the screens read it: localStorage for the dailies'
// saved days, props for the quiz engine. The caller must have vi.mock'ed the
// two async loaders (the player pool and Top 10's lists), routed to the shared
// `S` object (see the test file), and stubbed localStorage with `store`.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FootballWordle } from '../../src/games/FootballWordle.jsx';
import { QuizEngine } from '../../src/screens/QuizEngine.jsx';
import { QuizScreen } from '../../src/screens/QuizScreen.jsx';
import TransferTrail from '../../src/screens/TransferTrail.jsx';
import MysteryPlayer from '../../src/screens/MysteryPlayer.jsx';
import Top10 from '../../src/screens/Top10.jsx';
import { footleAnswerFor } from '../../src/lib/wordle.js';
import { getWordleDateKey } from '../../src/lib/wordleStatus.js';
import { saveMysteryResult, mysteryDayIndex } from '../../src/lib/mysteryPlayer.js';
import { mysteryAnswerIds } from '../../src/lib/scheduleRemote.js';
import { getTop10Number } from '../../src/lib/top10.js';
import { dateToYMD } from '../../src/lib/date.js';

// Icon path data carries no strings and is most of the bytes, so each <svg>
// keeps only its opening tag (same scrub as step 2).
export function scrub(html) {
  return html.replace(/(<svg[^>]*>)[\s\S]*?<\/svg>/g, '$1</svg>');
}

const noop = () => {};
// Noon on 20 Oct 2026 (the test fakes the clock): today and yesterday.
export const TODAY = new Date(2026, 9, 20, 12, 0, 0);
const YESTERDAY = new Date(2026, 9, 19, 12, 0, 0);

// ── Footle ──────────────────────────────────────────────────────────────────
// Wrong guesses of the answer's length that share none of its letters' spots.
function footleMiss(answer, seed) {
  const abc = 'QWZXVJKYBP';
  let s = '';
  for (let i = 0; i < answer.length; i++) {
    let c = abc[(i + seed) % abc.length];
    if (c === answer[i]) c = abc[(i + seed + 1) % abc.length];
    s += c;
  }
  return s;
}
function footleDay(date, rec) {
  return { [`biq_wordle_${getWordleDateKey(date)}`]: JSON.stringify(rec) };
}
const footle = (props = {}) => () => React.createElement(FootballWordle, {
  onBack: noop, onHowToPlay: noop, onReport: noop, date: TODAY, ...props,
});
const footleScenarios = () => {
  const a = footleAnswerFor(TODAY);
  const y = footleAnswerFor(YESTERDAY);
  const m = (n) => footleMiss(a, n);
  return [
    ['footle: fresh board (legend, hard-mode switch)', {}, footle()],
    ['footle: fresh board, hard mode on', { biq_footle_hard: '1' }, footle()],
    ['footle: no back, no help, no report', {}, footle({ onBack: undefined, onHowToPlay: undefined, onReport: undefined })],
    ['footle: two guesses in', footleDay(TODAY, { guesses: [m(1), m(2)], status: 'playing' }), footle()],
    ['footle: three guesses (the clue offer)', footleDay(TODAY, { guesses: [m(1), m(2), m(3)], status: 'playing' }), footle()],
    ['footle: clue taken', footleDay(TODAY, { guesses: [m(1), m(2), m(3)], status: 'playing', clue: 1 }), footle()],
    ['footle: hard mode, one guess in', footleDay(TODAY, { guesses: [m(1)], status: 'playing', hard: true }), footle()],
    ['footle: won in 1', footleDay(TODAY, { guesses: [a], status: 'won' }), footle()],
    ['footle: won in 3', footleDay(TODAY, { guesses: [m(1), m(2), a], status: 'won' }), footle()],
    ['footle: won in 6, hard, clued', footleDay(TODAY, { guesses: [m(1), m(2), m(3), m(4), m(5), a], status: 'won', hard: true, clue: 1 }), footle()],
    ['footle: lost', footleDay(TODAY, { guesses: [m(1), m(2), m(3), m(4), m(5), m(6)], status: 'lost' }), footle()],
    ['footle: archive, fresh', {}, footle({ date: YESTERDAY })],
    ['footle: archive, won', footleDay(YESTERDAY, { guesses: [footleMiss(y, 1), y], status: 'won' }), footle({ date: YESTERDAY })],
  ];
};

// ── Quiz engine (Daily 7, Classic, Survival …) ──────────────────────────────
const MCQ = { id: 'q1', q: 'Which club won the 2005 Champions League final in Istanbul?', o: ['Liverpool', 'Milan', 'Chelsea', 'Barcelona'], a: 0, cat: 'UCL', diff: 'medium', hint: 'Liverpool came back from 3-0 down.' };
const MCQ2 = { id: 'q2', q: 'Who scored the winner in the 2014 World Cup final?', o: ['Götze', 'Müller', 'Messi', 'Klose'], a: 0, cat: 'WorldCup', diff: 'hard' };
const TYPED = { id: 'q3', type: 'typed', q: 'Name the Arsenal striker who scored 228 goals for the club.', typed_a: 'Thierry Henry', o: ['Thierry Henry'], a: 0, cat: 'Legends', diff: 'easy' };
const TF = { id: 'q4', type: 'tf', q: 'Leicester won the Premier League in 2016.', a: true, cat: 'PL', diff: 'easy' };
const MGR = { id: 'q5', q: 'Who managed Barcelona in 2009?', o: ['Guardiola', 'Rijkaard', 'Luis Enrique', 'Vilanova'], a: 0, cat: 'Managers', diff: 'medium' };
const CLUBQ = { id: 'q6', q: 'Which year did the club move grounds?', o: ['2006', '2004', '2008', '2010'], a: 0, cat: 'ClubQuiz', diff: 'medium' };
const quiz = (props = {}) => () => React.createElement(QuizEngine, {
  questions: [MCQ, MCQ2, TF], mode: 'classic', diff: 'medium', timerEnabled: true, soundEnabled: false, hintsEnabled: true,
  onComplete: noop, onBack: noop, onReport: noop, ...props,
});
const quizScenarios = () => [
  ['quiz: classic, timed, first question', {}, quiz({ onHowToPlay: noop })],
  ['quiz: daily 7 (untimed)', {}, quiz({ mode: 'daily', questions: [MCQ, MCQ2, MCQ, MCQ2, MCQ, MCQ2, MCQ] })],
  ['quiz: survival, no PB yet', {}, quiz({ mode: 'survival', onHowToPlay: noop })],
  ['quiz: survival, PB 12', {}, quiz({ mode: 'survival', survivalBest: 12 })],
  ['quiz: speed, club label', {}, quiz({ mode: 'speed', quizLabel: 'Arsenal', timerSecondsOverride: 10, questions: [CLUBQ, MCQ] })],
  ['quiz: legends, a typed question (easy, with the first-letter hint)', {}, quiz({ mode: 'legends', diff: 'easy', questions: [TYPED, MCQ] })],
  ['quiz: typed question, hints off', {}, quiz({ mode: 'classic', diff: 'easy', hintsEnabled: false, questions: [TYPED] })],
  ['quiz: true or false', {}, quiz({ mode: 'chaos', questions: [TF, MCQ] })],
  ['quiz: managers category, local mode', {}, quiz({ mode: 'local', questions: [MGR] })],
  ['quiz: unknown mode, no timer', {}, quiz({ mode: 'mystery-mode', timerEnabled: false, questions: [MCQ2] })],
  ['quiz: no questions (could not load)', {}, quiz({ questions: [] })],
];

// ── The Quiz topic screen ───────────────────────────────────────────────────
const topic = (initialTopic, extra = {}) => () => React.createElement(QuizScreen, {
  initialTopic, onStartMode: noop, onStartCat: noop, onStadiums: noop, onBack: noop, ...extra,
});
const quizScreenScenarios = () => [
  ['quiz screen: everything', {}, topic(undefined)],
  ['quiz screen: chaos', {}, topic('chaos')],
  ['quiz screen: legends', {}, topic('Legends')],
  ['quiz screen: Premier League, rated', {}, topic('PL', { catStats: { PL: { a: 30, c: 20 } }, cardLeague: 'PL' })],
  ['quiz screen: managers (no face)', {}, topic('Managers', { catStats: {}, cardLeague: null })],
];

// ── Transfer Trail ──────────────────────────────────────────────────────────
export const TRAIL_PLAYER = {
  key: 'test-alonso', display: ['Xabi', 'Alonso'], nat: 'Spain', pos: 'Midfielder',
  clubs: ['Real Sociedad', 'Eibar', 'Real Sociedad', 'Liverpool', 'Real Madrid', 'Bayern Munich'],
  loans: { 1: true },
};
const trailDay = (date, rec) => ({ [`biq_trail_${dateToYMD(date)}`]: JSON.stringify(rec) });
const miss = (text) => ({ text, skipped: false });
const skip = { text: '', skipped: true };
const trail = (props = {}) => () => React.createElement(TransferTrail, { player: TRAIL_PLAYER, date: TODAY, onBack: noop, onReport: noop, ...props });
const trailScenarios = () => [
  ['trail: fresh', {}, trail()],
  ['trail: one wrong guess', trailDay(TODAY, { status: 'playing', attempts: [miss('Steven Gerrard')] }), trail()],
  ['trail: three misses (the hint), a skip among them', trailDay(TODAY, { status: 'playing', attempts: [miss('Gerrard'), skip, miss('Busquets')] }), trail()],
  ['trail: one guess left', trailDay(TODAY, { status: 'playing', attempts: [miss('Gerrard'), skip, miss('Busquets'), skip] }), trail()],
  ['trail: won on the first two clubs', trailDay(TODAY, { status: 'won', attempts: [miss('Xabi Alonso')] }), trail()],
  ['trail: won after two misses', trailDay(TODAY, { status: 'won', attempts: [miss('Gerrard'), skip, miss('Alonso')] }), trail()],
  ['trail: lost', trailDay(TODAY, { status: 'lost', attempts: [skip, skip, skip, skip, miss('Gerrard')] }), trail()],
  ['trail: archive, lost', trailDay(YESTERDAY, { status: 'lost', attempts: [skip, skip, skip, skip, skip] }), trail({ date: YESTERDAY })],
  ['trail: embedded (static page), fresh', {}, trail({ embedded: true, onBack: undefined })],
  ['trail: embedded, won', trailDay(TODAY, { status: 'won', attempts: [miss('Alonso')] }), trail({ embedded: true, onBack: undefined })],
  ['trail: no career (coming soon)', {}, trail({ player: { key: 'none', display: [], clubs: [] } })],
];

// ── Mystery Player ──────────────────────────────────────────────────────────
// The pool and careers are the real files (the test's usePlayerPool mock hands
// them over synchronously); the answer is the real one for TODAY.
function mysteryGuesses(S, date, n, withAnswer) {
  const ans = mysteryAnswerIds(mysteryDayIndex(date))[0];
  const picks = S.mysteryPool.filter((p) => p.id !== ans).slice(0, n);
  const out = picks.map((p) => ({ id: p.id, name: p.name, club: p.club, rank: 999, band: 'cold' }));
  if (withAnswer) {
    const a = S.mysteryPool.find((p) => p.id === ans);
    out.unshift({ id: a.id, name: a.name, club: a.club, rank: 1, band: 'win' });
  }
  return out;
}
const mystery = (props = {}) => () => React.createElement(MysteryPlayer, { onExit: noop, date: TODAY, ...props });
const mysteryScenarios = (S) => [
  ['mystery: fresh, the pool not loaded yet', { _pool: false }, mystery()],
  ['mystery: fresh, the pool in (free clues, the key to the colours)', {}, mystery()],
  ['mystery: three guesses', { _mystery: () => saveMysteryResult(TODAY, { won: false, guesses: mysteryGuesses(S, TODAY, 3), hintsUsed: 0, clues: 3 }) }, mystery()],
  ['mystery: five guesses (club clue ready, give up offered)', { _mystery: () => saveMysteryResult(TODAY, { won: false, guesses: mysteryGuesses(S, TODAY, 5), hintsUsed: 0, clues: 3 }) }, mystery()],
  ['mystery: seven guesses, club clue taken', { _mystery: () => saveMysteryResult(TODAY, { won: false, guesses: mysteryGuesses(S, TODAY, 7), hintsUsed: 1, clues: 3 }) }, mystery()],
  ['mystery: nine guesses, both clues taken', { _mystery: () => saveMysteryResult(TODAY, { won: false, guesses: mysteryGuesses(S, TODAY, 9), hintsUsed: 2, clues: 3 }) }, mystery()],
  ['mystery: won in 1', { _mystery: () => saveMysteryResult(TODAY, { won: true, guesses: mysteryGuesses(S, TODAY, 0, true), hintsUsed: 0, clues: 3 }) }, mystery()],
  ['mystery: won in 6 with a clue', { _mystery: () => saveMysteryResult(TODAY, { won: true, guesses: mysteryGuesses(S, TODAY, 5, true), hintsUsed: 1, clues: 3 }) }, mystery()],
  ['mystery: gave up after 5', { _mystery: () => saveMysteryResult(TODAY, { won: false, gaveUp: true, guesses: mysteryGuesses(S, TODAY, 5), hintsUsed: 0, clues: 3 }) }, mystery()],
  ['mystery: archive, two guesses', { _mystery: () => saveMysteryResult(YESTERDAY, { won: false, guesses: mysteryGuesses(S, YESTERDAY, 2), hintsUsed: 0, clues: 3, arc: 1 }) }, mystery({ date: YESTERDAY })],
  ['mystery: embedded (static page), fresh', {}, mystery({ embedded: true, onExit: undefined })],
  ['mystery: embedded, two guesses', { _mystery: () => saveMysteryResult(TODAY, { won: false, guesses: mysteryGuesses(S, TODAY, 2), hintsUsed: 0, clues: 3 }) }, mystery({ embedded: true, onExit: undefined })],
  ['mystery: no puzzle today', { _noAnswer: true }, mystery()],
];

// ── Top 10 ──────────────────────────────────────────────────────────────────
const SLOT_NAMES = ['Alan Shearer', 'Harry Kane', 'Wayne Rooney', 'Andy Cole', 'Sergio Agüero', 'Frank Lampard', 'Thierry Henry', 'Robbie Fowler', 'Jermain Defoe', 'Mohamed Salah'];
function top10Data({ kind = 'player', clueLabel = 'Club', note = 'Premier League goals only. Level entries share a rank by date reached.' } = {}) {
  const n = getTop10Number(TODAY);
  const slots = SLOT_NAMES.map((name, i) => ({ key: `s${i}`, name, clue: i % 3 === 0 ? 'Newcastle' : null }));
  const list = { id: `t-${kind}`, kind, title: kind === 'player' ? 'Most Premier League goals' : 'Most World Cup wins', asOf: '2026-10-01', clueLabel, note, slots, near: [{ key: 'n1', name: 'Michael Owen', note: '11th, 150 goals' }] };
  return {
    log: Array.from({ length: n + 1 }, () => list.id),
    lists: { [list.id]: list },
    pools: { nation: [{ key: 'br', name: 'Brazil' }], club: [] },
    extras: [{ key: 'x1', name: 'Les Ferdinand' }],
  };
}
const t10Day = (date, rec) => ({ [`biq_top10_${dateToYMD(date)}`]: JSON.stringify(rec) });
const top10 = (props = {}) => () => React.createElement(Top10, { date: TODAY, onBack: noop, onReport: noop, ...props });
const top10Scenarios = () => {
  const P = top10Data();
  const id = 't-player';
  const picks = (ks) => ks.map((k) => ({ k, n: k }));
  return [
    ['top10: loading', { _top10: null }, top10()],
    ['top10: could not load', { _top10: 'failed' }, top10()],
    ['top10: no list today (coming soon)', { _top10: { ...P, log: [] } }, top10()],
    ['top10: fresh, a player list', { _top10: P }, top10()],
    ['top10: fresh, a nation list with no clue label or note', { _top10: top10Data({ kind: 'nation', clueLabel: null, note: null }) }, top10()],
    ['top10: three found, one miss, one near', { _top10: P, ...t10Day(TODAY, { id, status: 'playing', picks: picks(['s0', 'zz', 's4', 'n1', 's9']), score: 3 }) }, top10()],
    ['top10: one life left', { _top10: P, ...t10Day(TODAY, { id, status: 'playing', picks: picks(['s1', 'z1', 'z2']), score: 1 }) }, top10()],
    ['top10: out of lives', { _top10: P, ...t10Day(TODAY, { id, status: 'done', picks: picks(['s1', 's2', 'z1', 'z2', 'z3']), score: 2 }) }, top10()],
    ['top10: gave up on nought', { _top10: P, ...t10Day(TODAY, { id, status: 'done', picks: [], gaveUp: true, score: 0 }) }, top10()],
    ['top10: perfect, no miss', { _top10: P, ...t10Day(TODAY, { id, status: 'done', picks: picks(SLOT_NAMES.map((_, i) => `s${i}`)), score: 10 }) }, top10()],
    ['top10: perfect, one life spare', { _top10: P, ...t10Day(TODAY, { id, status: 'done', picks: picks(['z1', 'z2', ...SLOT_NAMES.map((_, i) => `s${i}`)]), score: 10 }) }, top10({ onMoreLists: noop })],
    ['top10: perfect, two lives spare', { _top10: P, ...t10Day(TODAY, { id, status: 'done', picks: picks(['z1', ...SLOT_NAMES.map((_, i) => `s${i}`)]), score: 10 }) }, top10()],
    ['top10: a list by name (no number), half found', { _top10: P, 'biq_top10_list_t-player': JSON.stringify({ id, status: 'playing', picks: picks(['s0', 's1']), score: 2 }) }, top10({ listId: id })],
    ['top10: embedded (static page), fresh', { _top10: P }, top10({ embedded: true, onBack: undefined })],
  ];
};

export function buildScenarios(S) {
  return [
    ...footleScenarios(),
    ...quizScenarios(),
    ...quizScreenScenarios(),
    ...trailScenarios(),
    ...mysteryScenarios(S),
    ...top10Scenarios(),
  ];
}

/**
 * Render every scenario; returns { name: html }. `S` is the shared mock state,
 * `store` the stubbed localStorage's Map (cleared before each scenario).
 */
export function renderAll(S, store) {
  const out = {};
  for (const [name, patch, make] of buildScenarios(S)) {
    store.clear();
    S.poolReady = patch._pool !== false;
    S.noAnswer = !!patch._noAnswer;
    S.top10 = Object.hasOwn(patch, '_top10') ? patch._top10 : null;
    for (const [k, v] of Object.entries(patch)) if (!k.startsWith('_')) store.set(k, v);
    if (patch._mystery) patch._mystery();
    out[name] = scrub(renderToStaticMarkup(make()));
  }
  return out;
}
