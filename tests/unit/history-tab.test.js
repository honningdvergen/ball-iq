// The History tab on a PHONE (26 Nov 2026; screens/DailyScreen.jsx, screens/history.css).
// Built twice. First from the second drawing (25 Nov; Alex: "Yes, build it"), which reversed
// "HISTORY, not a second Today" of 6 Sept on purpose: Today is always the first row of the list of
// days, and each game not finished today is a play button on it. Of that build he said "things look
// a bit thrown together again instead of carefully designed", "it does not pass the eye test", "the
// scores are a bit confusing", the title "a bit too large and clumsy", and of a day's name over its
// date "do we bother having the date under today". It was redrawn with him six times; of the sixth
// (ball-iq-audit/2026-11-24/finish/history-6-compare.png, the right phone): "Yes, build it".
// What this file holds: the rules with logic in them (the grey line under the streak, what each
// cell of the Today row is, a day's one-line name, the mark a cell draws), what a phone shows in the
// six rendered states of the golden (no day-complete block in any of them), that the wide window
// kept its own layout, its own streak gate and its own day-complete block, and the kit's rules for
// this screen (three type sizes under the title, nothing outlined, lucide and no system emoji,
// "yellow").
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');
const DAILY = read('src/screens/DailyScreen.jsx');
const CSS = read('src/screens/history.css');
const APP = read('src/App.jsx');
const APPCSS = read('src/app.css');
const GOLDEN = JSON.parse(read('tests/unit/i18n-screens.golden.json'));
const EN = (await import('../../src/i18n/en.js')).default;
const ES = (await import('../../src/i18n/es.js')).default;
const { todayCells, streakNoteKey, cellMark, dayLabel } = await import('../../src/screens/DailyScreen.jsx');

// The phone column of a render, and the wide window's.
const phoneOf = (g) => g.slice(g.indexOf('<div class="daily-col-mobile hs"'), g.indexOf('<div class="daily-desktop">'));
const wideOf = (g) => g.slice(g.indexOf('<div class="daily-desktop">'));
// A render as words: an icon is its lucide name between bars (|check|), tags are bars.
const text = (s) => s.replace(/<svg[^>]*class="lucide lucide-([a-z-]+)[^"]*"[^>]*>[\s\S]*?<\/svg>/g, '|$1|').replace(/<!-- -->/g, '').replace(/<s><\/s>/g, '|dash|').replace(/<u><\/u>/g, '|dot|').replace(/<[^>]+>/g, '|').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\|+/g, '|');
const H = Object.fromEntries(Object.entries(GOLDEN).filter(([k]) => k.startsWith('history: ')));
const fresh = phoneOf(H['history: a new player, nothing played']);
const firstDay = phoneOf(H['history: today played, no past days yet']);
const gaps = phoneOf(H['history: two weeks with gaps, yesterday open']);
const swept = phoneOf(H['history: all done today, yesterday open, streak broke']);
const survival = phoneOf(H['history: all done today and yesterday (survival), at best']);
const broke = phoneOf(H['history: streak broke, yesterday all done']);
const ALL = { fresh, firstDay, gaps, swept, survival, broke };
// The source of the phone column, comments and all.
const PHONE_SRC = DAILY.slice(DAILY.indexOf('<div className="daily-col-mobile hs"'), DAILY.indexOf('{/* /.daily-col-mobile'));
// One row of a render, from its sentence to the next row or the card's end.
const rowOf = (p, day) => { const i = p.indexOf(`aria-label="${day}`); const rest = p.slice(i); const j = rest.search(/<\/div><div class="hs-(row|gap)|<\/div><\/section>/); return rest.slice(0, j); };

// One day as the screen holds it (the `matchdays` memo's row): nothing played, all four games live.
const day = (over = {}) => ({
  ymd: '2026-11-26', dateLabel: 'Today', dateSub: 'Nov 26', isToday: true, isYesterday: false,
  t7Score: undefined, t7Done: false, fAttempt: false, fWon: false, fUsed: 0,
  trAttempt: false, trWon: false, trUsed: 0, trLive: true, myAttempt: false, myWon: false, myUsed: 0, myLive: false,
  t10Live: true, t10Done: false, t10Attempt: false, t10Score: 0, ...over,
});
// Today's games as `todayModes` lists them: only the fields the row reads.
const taps = { footle: () => 'footle', daily7: () => 'daily7', trail: () => 'trail', top10: () => 'top10', mystery: () => 'mystery' };
const games = (over = {}, keys = ['footle', 'daily7', 'trail', 'top10']) => keys.map((key) => ({ key, done: false, started: false, onTap: taps[key], ...(over[key] || {}) }));
const by = (cells) => Object.fromEntries(cells.map((c) => [c.key, c]));

describe('the grey line under "N day streak"', () => {
  it('zero: one puzzle lights it, whatever today holds', () => {
    expect(streakNoteKey(0, false)).toBe('hi.light');
    expect(streakNoteKey(0, true)).toBe('hi.light');
    expect(streakNoteKey(undefined, false)).toBe('hi.light');
    expect(EN['hi.light']).toBe('Play one puzzle to light it');
  });
  it('above zero with today counted: come back tomorrow', () => {
    expect(streakNoteKey(1, true)).toBe('hi.keep');
    expect(streakNoteKey(58, true)).toBe('hi.keep');
    expect(EN['hi.keep']).toBe('Come back tomorrow to keep it');
  });
  it('above zero with today NOT counted yet: playing today keeps it (it said "come back tomorrow" to everyone)', () => {
    expect(streakNoteKey(1, false)).toBe('hi.keepToday');
    expect(streakNoteKey(58, false)).toBe('hi.keepToday');
    // 26 Nov 2026: shorter than the first build's "Play one puzzle today to keep it", the same truth.
    expect(EN['hi.keepToday']).toBe('Play today to keep it');
    expect(ES['hi.keepToday']).toBe('Juega hoy para mantenerla');
  });
  it('a line of its own: no leading dash or dot, in either language', () => {
    for (const k of ['hi.keep', 'hi.light', 'hi.keepToday']) {
      expect(EN[k], k).toMatch(/^[A-Z]/);
      expect(ES[k], k).toMatch(/^[A-ZÁÉÍÓÚÑ]/);
    }
  });
  it('the app\'s own words at every width: no short forms were needed (measured in WebKit)', () => {
    // The longest of the three is 201.8 wide in English and 208.2 in Spanish at 13.5/500; the line
    // has 212 at 320 wide (the card's 264, less the 42 well and its 10 gap), 249 at 375, 267 at 393.
    // So the screen holds one string per case and nothing switches by width.
    expect(PHONE_SRC).toContain('<span className="t7s-sub">{t(streakNoteKey(streak.unbeaten, countedToday))}</span>');
    for (const k of ['hi.keepShort', 'hi.lightShort']) { expect(k in EN, k).toBe(false); expect(k in ES, k).toBe(false); }
  });
  it('"counted" is a daily finished today on this screen, or the streak\'s own record saying so', () => {
    // The record knows a day counted by a game the list does not hold (Mystery Player finished as a
    // side game on a day Top 10 is the fourth daily), so the line cannot ask for a puzzle the streak
    // no longer needs. At zero there is nothing to keep, and the record is not read.
    const memo = DAILY.slice(DAILY.indexOf('const countedToday = useMemo('), DAILY.indexOf('}, [playedCount, loginStreak, today]);'));
    expect(memo).toContain('if (!(loginStreak > 0)) return false;');
    expect(memo).toContain('if (playedCount > 0) return true;');
    expect(memo).toContain('localStorage.getItem("biq_login_streak")');
    expect(memo).toContain('last >= localDayNow(today)');
  });
  it('as rendered: zero, and a streak with a daily finished today', () => {
    expect(text(fresh)).toContain('|0 day streak|Play one puzzle to light it|');
    expect(text(broke)).toContain('|0 day streak|Play one puzzle to light it|');
    expect(text(gaps)).toContain('|1 day streak|Come back tomorrow to keep it|');
    expect(text(survival)).toContain('|2 day streak|Come back tomorrow to keep it|');
  });
});

describe('the Today row\'s four cells', () => {
  it('not started: a play button for each game, with the game\'s own start and its name for a screen reader', () => {
    const cells = todayCells(day(), games());
    expect(cells.map((c) => c.key)).toEqual(['footle', 'daily7', 'trail', 'top10']);
    for (const c of cells) {
      expect(c.state, c.key).toBe('play');
      expect(c.play, c.key).toBe(taps[c.key]);
      expect(c.started, c.key).toBe(false);
    }
    expect(cells.map((c) => c.aria)).toEqual(['Play today’s Footle', 'Play today’s Daily 7', 'Play today’s Transfer Trail', 'Play today’s Top 10']);
  });
  it('in progress: still a play button, and the words say "Continue"', () => {
    // A Top 10 board with picks is "open" in a past row (a dot); today it is a game to go on with.
    const c = by(todayCells(day({ t10Attempt: true, t10Score: 2 }), games({ footle: { started: true }, trail: { started: true }, top10: { started: true } })));
    for (const k of ['footle', 'trail', 'top10']) {
      expect(c[k].state, k).toBe('play');
      expect(c[k].play, k).toBe(taps[k]);
    }
    expect([c.footle.aria, c.trail.aria, c.top10.aria]).toEqual(["Continue today's Footle", "Continue today's Transfer Trail", "Continue today's Top 10"]);
    expect(c.daily7.aria).toBe('Play today’s Daily 7');
  });
  it('finished: exactly what a past row holds for that game, and not a button', () => {
    const m = day({ fAttempt: true, fWon: true, fUsed: 3, t7Done: true, t7Score: 5, trAttempt: true, trWon: false, trUsed: 5, t10Attempt: true, t10Done: true, t10Score: 7 });
    const c = by(todayCells(m, games({ footle: { done: true }, daily7: { done: true }, trail: { done: true }, top10: { done: true } })));
    expect([c.footle.state, c.footle.text]).toEqual(['win', '3']);
    expect([c.daily7.state, c.daily7.text]).toEqual(['win', '5/7']);
    expect(c.trail.state).toBe('miss'); // not solved: the miss mark, as in any row
    expect([c.top10.state, c.top10.text]).toEqual(['win', '7/10']);
    for (const k of Object.keys(c)) expect(c[k].play, k).toBe(null);
    // The sentences a screen reader gets keep the number the eye no longer does.
    expect([c.footle.aria, c.daily7.aria, c.trail.aria, c.top10.aria]).toEqual(['Footle solved in 3', 'Daily 7 5 of 7', 'Transfer Trail not solved', 'Top 10 7 of 10']);
  });
  it('a mix: the finished ones are results, the rest are buttons', () => {
    const c = by(todayCells(day({ t7Done: true, t7Score: 6 }), games({ daily7: { done: true }, footle: { started: true } })));
    expect(c.daily7.state).toBe('win');
    expect(c.daily7.play).toBe(null);
    expect([c.footle.state, c.trail.state, c.top10.state]).toEqual(['play', 'play', 'play']);
  });
  it('not live today: an empty cell, never a button', () => {
    // No Transfer Trail today (its schedule has no answer): the row says so, and so does the list.
    let c = by(todayCells(day({ trLive: false }), games({}, ['footle', 'daily7', 'top10'])));
    expect([c.trail.state, c.trail.play, c.trail.aria]).toEqual(['off', null, '']);
    expect(c.footle.state).toBe('play');
    // The list is what decides (it is Home's own gate): a game it does not hold is not offered,
    // even if the row thinks the day has one.
    c = by(todayCells(day(), games({}, ['footle', 'daily7'])));
    expect([c.trail.state, c.trail.play]).toEqual(['off', null]);
    expect([c.top10.state, c.top10.play]).toEqual(['off', null]);
    // And with no list at all nothing is offered.
    expect(todayCells(day(), undefined).every((x) => x.state === 'off' && x.play === null)).toBe(true);
  });
  it('the fourth game is the day\'s own: Mystery Player on a day Top 10 has no list', () => {
    const m = day({ t10Live: false, myLive: true });
    let c = by(todayCells(m, games({}, ['footle', 'daily7', 'trail', 'mystery'])));
    expect(Object.keys(c)).toEqual(['footle', 'daily7', 'trail', 'mystery']);
    expect([c.mystery.state, c.mystery.aria]).toEqual(['play', 'Play today’s Mystery Player']);
    // Guessed at, not solved: it cannot be lost, so it is a game to go on with.
    c = by(todayCells({ ...m, myAttempt: true, myUsed: 4 }, games({ mystery: { started: true } }, ['footle', 'daily7', 'trail', 'mystery'])));
    expect([c.mystery.state, c.mystery.aria]).toEqual(['play', "Continue today's Mystery Player"]);
    c = by(todayCells({ ...m, myAttempt: true, myWon: true, myUsed: 6 }, games({ mystery: { done: true } }, ['footle', 'daily7', 'trail', 'mystery'])));
    expect([c.mystery.state, c.mystery.text, c.mystery.play]).toEqual(['win', '6', null]);
  });
  it('finished with no result on the row: nothing is printed, and nothing is offered', () => {
    // A Daily 7 the app knows is done but holds no score for: an empty cell is true, "0/7" is not.
    const c = by(todayCells(day(), games({ daily7: { done: true } })));
    expect([c.daily7.state, c.daily7.play, c.daily7.aria]).toEqual(['off', null, '']);
  });
  it('a result on the row wins over a stale flag: no button over a game already played', () => {
    const c = by(todayCells(day({ t7Done: true, t7Score: 4 }), games()));
    expect([c.daily7.state, c.daily7.text, c.daily7.play]).toEqual(['win', '4/7', null]);
  });
  it('the screen feeds it today\'s Daily 7 from the app\'s own flag and score', () => {
    expect(DAILY).toContain('return m && dailyDone && !m.t7Done && Number.isFinite(dailyScore) ? { ...m, t7Done: true, t7Score: dailyScore } : m;');
    expect(PHONE_SRC).toContain('{todayCells(todayRow, todayModes).map(c => (');
    // `started` is a board begun and not finished, for each game that can be left half way.
    for (const s of ['started: f?.status === "in-progress",', 'started: tr?.status === "in-progress",', 'started: !!t10 && t10.status !== "done",', 'started: !!my && my.status !== "won",']) expect(DAILY).toContain(s);
  });
});

// 26 Nov 2026, the sixth drawing. Alex, of the first build: "the scores are a bit confusing". A
// Footle "3" and a Trail "2" were guesses USED beside a Daily 7 "6/7" and a Top 10 "7/10", things
// GOT, with nothing to tell them apart.
describe('the mark a cell draws', () => {
  const today = (over, list) => by(todayCells(day(over), list));
  it('Footle and Transfer Trail: a tick when solved, the cross when not, NEVER a number', () => {
    const c = today({ fAttempt: true, fWon: true, fUsed: 3, trAttempt: true, trWon: false, trUsed: 5 }, games({ footle: { done: true }, trail: { done: true } }));
    expect(cellMark(c.footle)).toBe('tick');
    expect(cellMark(c.trail)).toBe('cross');
    expect(c.footle.score).toBeUndefined();
    expect(c.trail.score).toBeUndefined();
    const won = today({ trAttempt: true, trWon: true, trUsed: 1, fAttempt: true, fWon: false, fUsed: 6 }, games({ footle: { done: true }, trail: { done: true } }));
    expect([cellMark(won.footle), cellMark(won.trail)]).toEqual(['cross', 'tick']);
  });
  it('Daily 7 and Top 10: the score, as the number got and what it is out of', () => {
    const c = today({ t7Done: true, t7Score: 6, t10Attempt: true, t10Done: true, t10Score: 7 }, games({ daily7: { done: true }, top10: { done: true } }));
    expect([cellMark(c.daily7), c.daily7.score]).toEqual(['score', [6, 7]]);
    expect([cellMark(c.top10), c.top10.score]).toEqual(['score', [7, 10]]);
    // A zero is a score too, and a ten out of ten.
    const z = today({ t7Done: true, t7Score: 0, t10Attempt: true, t10Done: true, t10Score: 10 }, games({ daily7: { done: true }, top10: { done: true } }));
    expect([cellMark(z.daily7), z.daily7.score, z.top10.score]).toEqual(['score', [0, 7], [10, 10]]);
  });
  it('Mystery Player in a past row: a tick when solved; a board left open is the dot', () => {
    const past = (over) => by(todayCells(day({ isToday: false, t10Live: false, myLive: true, ...over }), games({ mystery: { done: true } }, ['footle', 'daily7', 'trail', 'mystery'])));
    expect(cellMark(past({ myAttempt: true, myWon: true, myUsed: 14 }).mystery)).toBe('tick');
    expect(cellMark({ state: 'open' })).toBe('dot');
  });
  it('not played is the dash, started and left is the dot, not live is empty, a game to play is the button', () => {
    expect(cellMark({ state: 'none' })).toBe('dash');
    expect(cellMark({ state: 'open', score: [2, 10] })).toBe('dot'); // a Top 10 begun and left: no score yet
    expect(cellMark({ state: 'off' })).toBe('empty');
    expect(cellMark({ state: 'play', score: [0, 7] })).toBe('play');
    const c = today({}, games());
    for (const k of Object.keys(c)) expect(cellMark(c[k]), k).toBe('play');
    expect(cellMark(today({ trLive: false }, games({}, ['footle', 'daily7', 'top10'])).trail)).toBe('empty');
  });
  it('as rendered: ticks and crosses for the solve-or-not games, a white number and a small grey "/7" for the others', () => {
    // Sun Oct 18: Footle lost, Daily 7 5/7, Trail solved (in 2), Top 10 6/10.
    const sun = rowOf(gaps, 'Sun Oct 18');
    expect(text(sun).split('|').filter(Boolean).slice(1)).toEqual(['Sun', 'Oct 18', 'x', '5', '/7', 'check', '6', '/10']);
    expect(sun).toContain('<span class="hs-c" aria-hidden="true"><b>5</b><i>/7</i></span>');
    expect(sun).toContain('<span class="hs-c" aria-hidden="true"><b>6</b><i>/10</i></span>');
    expect(sun).toMatch(/lucide-x hs-x/);
    expect(sun).toMatch(/lucide-check hs-ok/);
    // No number for the Trail solved in 2, and no colour of a game on any result.
    expect(sun).not.toMatch(/>2</);
    expect(sun, 'no inline colour on a result').not.toMatch(/style="/);
    // Today (a Footle solved in 3): a tick, not "3".
    expect(text(rowOf(gaps, 'Today Oct 20')).split('|').filter(Boolean).slice(1)).toEqual(['Today', 'check', 'play', 'play', 'play']);
    // A finished day: tick, score, tick, score. One with a lost Trail: tick, score, cross, score.
    expect(text(rowOf(swept, 'Today Oct 20')).split('|').filter(Boolean).slice(1)).toEqual(['Today', 'check', '6', '/7', 'check', '7', '/10']);
    expect(text(rowOf(survival, 'Today Oct 20')).split('|').filter(Boolean).slice(1)).toEqual(['Today', 'check', '7', '/7', 'x', '10', '/10']);
    // Sat Oct 17: a Top 10 begun and left is the small dot; the other three are dashes.
    expect(text(rowOf(gaps, 'Sat Oct 17')).split('|').filter(Boolean).slice(1)).toEqual(['Sat', 'Oct 17', 'dash', 'dash', 'dash', 'dot']);
    // Thu Oct 8, before Top 10: a solved Mystery Player under the column Top 10 now heads is that
    // game's small mark, in its violet, and a tick (it was the mark and "5"). Wed Oct 7's was left open.
    const thu = rowOf(gaps, 'Thu Oct 8');
    expect(thu).toMatch(/<span class="hs-of" style="color:#B9A5FF"><svg[^>]*lucide-user-round-search[^>]*>[\s\S]*?<\/svg><\/span><svg[^>]*lucide-check hs-ok/);
    expect(thu).toContain('Mystery Player solved in 5');
    expect(text(rowOf(gaps, 'Wed Oct 7')).split('|').filter(Boolean).slice(1)).toEqual(['Wed', 'Oct 7', 'dash', '7', '/7', 'dash', 'dot']);
  });
  it('the four game colours are on the head tiles and the play buttons only', () => {
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    // A score is the screen's own white and grey, a tick the app's green, a cross red.
    expect(rules).toMatch(/\.hs \.hs-c > b\{[^}]*color:var\(--t1\)/);
    expect(rules).toMatch(/\.hs \.hs-c > i\{[^}]*font-size:11px;[^}]*font-weight:600;[^}]*color:var\(--t3\)/);
    expect(rules).toContain('.hs .hs-c .hs-ok{color:var(--accent);}');
    expect(rules).toContain('.hs .hs-c .hs-x{color:#FF6B6B;}');
    // var(--mode) is read by the tile, the play button and the soft pill, and nothing else here.
    const users = [...rules.matchAll(/([^{}]+)\{[^{}]*var\(--mode(-rgb)?\)[^{}]*\}/g)].map((m) => m[1].trim());
    for (const u of users) expect(/hs-tile|hs-play|t7s-cta/.test(u), u).toBe(true);
    // In the list itself the only colours set in the markup are a head tile's, a button's, and Mystery Player's mark.
    for (const [k, p] of Object.entries(ALL)) {
      const list = p.slice(p.indexOf('<section class="gp-list hs-list">'), p.indexOf('</section>', p.indexOf('<section class="gp-list hs-list">')));
      for (const m of list.matchAll(/<(\w+)[^>]*class="([^"]*)"[^>]*style="[^"]*"/g)) expect(/hs-tile|hs-play|hs-of/.test(m[2]), `${k}: ${m[2]}`).toBe(true);
    }
  });
});

// "do we bother having the date under today" (Alex, 26 Nov 2026).
describe('a day\'s name is one line', () => {
  const older = (d, loc) => ({ isToday: false, isYesterday: false, dateLabel: d.toLocaleDateString(loc, { weekday: 'short' }), dateSub: d.toLocaleDateString(loc, { month: 'short', day: 'numeric' }) });
  it('Today and Yesterday are their word alone', () => {
    expect(dayLabel({ isToday: true, isYesterday: false, dateLabel: 'Today', dateSub: 'Nov 26' })).toEqual(['Today']);
    expect(dayLabel({ isToday: false, isYesterday: true, dateLabel: 'Yesterday', dateSub: 'Nov 25' })).toEqual(['Yesterday']);
    expect(dayLabel({ isToday: true, isYesterday: false, dateLabel: 'Hoy', dateSub: '26 nov' })).toEqual(['Hoy']);
  });
  it('an older day is its weekday and its short date, in the phone\'s own order', () => {
    const d = new Date(2026, 10, 24, 12);
    expect(dayLabel(older(d, 'en-GB')).join(' ')).toBe('Tue 24 Nov');
    expect(dayLabel(older(d, 'en-US')).join(' ')).toBe('Tue Nov 24');
    expect(dayLabel(older(d, 'es')).join(' ')).toBe('mar 24 nov');
    // Two parts, so the stylesheet can let the weekday go where both do not fit and keep the date.
    expect(dayLabel(older(d, 'en-GB'))).toEqual(['Tue', '24 Nov']);
  });
  it('the screen builds them from the same words the rows\' sentences use', () => {
    expect(DAILY).toContain('else dateLabel = d.toLocaleDateString(lang, { weekday: "short" });');
    expect(DAILY).toContain('const dateSub = d.toLocaleDateString(lang, { month: "short", day: "numeric" });');
    expect(DAILY).toContain('return <span className="hs-day">{dayLabel(m).map((part, i) => <span key={i}>{part}</span>)}</span>;');
  });
  it('as rendered: no second line anywhere, and no date under Today', () => {
    for (const [k, p] of Object.entries(ALL)) {
      expect(p, k).toContain('<span class="hs-day"><span>Today</span></span>');
      // The kit's two-line body is on the cards with a well only, never in a day's row.
      const list = p.slice(p.indexOf('<section class="gp-list hs-list">'), p.indexOf('</section>', p.indexOf('<section class="gp-list hs-list">')));
      expect(list, k).not.toMatch(/t7s-(body|title|sub)/);
    }
    expect(gaps).toContain('<span class="hs-day"><span>Yesterday</span></span>');
    expect(gaps).toContain('<span class="hs-day"><span>Sun</span><span>Oct 18</span></span>');
    expect(text(gaps)).not.toContain('|Today|Oct 20|');
    // The sentence for a screen reader still names the date.
    expect(gaps).toContain('role="group" aria-label="Today Oct 20 — Footle solved in 3, Daily 7 not played, Transfer Trail not played, Top 10 not played"');
  });
  it('one line in the stylesheet too: 16/500 in a soft white, tabular, and the weekday gives way before the date does', () => {
    const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    const rule = rules.slice(rules.indexOf('.hs .hs-day{'), rules.indexOf('}', rules.indexOf('.hs .hs-day{')));
    for (const s of ['font-size:16px', 'font-weight:500', 'font-variant-numeric:tabular-nums', 'white-space:nowrap', 'color:#C9CCD6', 'display:flex', 'flex-wrap:wrap', 'align-content:flex-end', 'height:20px', 'line-height:20px', 'overflow:hidden']) expect(rule, s).toContain(s);
    expect(rules).toContain('.hs .hs-row{height:52px;}');
    // 16 at every width: the smallest phones set it a hair closer, never smaller.
    expect(rules).not.toMatch(/\.hs \.hs-day\{[^}]*font-size:(?!16px)/);
  });
});

describe('what a phone shows', () => {
  it('the title\'s row: "History" over the countdown, and the tiles on the same row', () => {
    for (const [k, p] of Object.entries(ALL)) {
      expect(p.slice(0, 260), k).toMatch(/^<div class="daily-col-mobile hs" style="--hs-colmax:54px"><div class="hs-top"><div class="hs-id"><div class="hs-title">History<\/div><div class="hs-count">New puzzles in <b>12h 0m<\/b><\/div><\/div>/);
      expect((p.match(/class="hs-title"/g) || []).length, k).toBe(1);
    }
    // The app's shell: the gear as a tile, on that row. A signed-in player: the bell before it.
    expect(fresh).toContain('</div><div class="hs-tools"><button type="button" class="icon-btn hdr-ic hs-btn" aria-label="Settings">');
    expect((fresh.match(/class="icon-btn hdr-ic hs-btn"/g) || []).length).toBe(1);
    const tools = gaps.slice(gaps.indexOf('<div class="hs-tools">'), gaps.indexOf('<section'));
    expect([...tools.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1])).toEqual(['Notifications, 2 new', 'Settings']);
    expect(tools).toContain('<span class="notif-dot" aria-hidden="true"></span>');
    // A browser tab: the website's own bar carries both, so the row has no tiles.
    expect(broke).not.toContain('hs-tools');
    expect(broke).not.toContain('<button type="button" class="icon-btn');
    expect(PHONE_SRC).toContain('{showSettings && (');
    expect(PHONE_SRC).toContain('<button type="button" onClick={onOpenSettings} className="icon-btn hdr-ic hs-btn" aria-label={t("nav.settings")}>');
  });
  it('the app hands the tiles their handlers, and its own strip no longer stands over this tab', () => {
    expect(APP).toContain('{!isWebBrowser && !inGame && !(screen === "home" && (tab === "home" || tab === "online" || tab === "daily")) && (');
    const at = APP.indexOf('<DailyTabScreen');
    const props = APP.slice(at, APP.indexOf('/>', at));
    for (const s of ['showSettings={!isWebBrowser}', 'onOpenSettings={openSettings}', 'onOpenNotifs={user ? openNotifs : undefined}', 'notifCount={notifCount}']) expect(props, s).toContain(s);
  });
  it('a new player: the same screen with one day in it', () => {
    expect(text(fresh)).toContain('|Recent days|F|clipboard-list|route|list-ordered|Today|play|play|play|play|Each day you play gets a row here|');
    expect((fresh.match(/class="hs-row"/g) || []).length).toBe(1);
    expect((fresh.match(/<button type="button" class="hs-play"/g) || []).length).toBe(4);
    for (const g of ['Footle', 'Daily 7', 'Transfer Trail', 'Top 10']) expect(fresh).toContain(`aria-label="Play today’s ${g}"`);
    // Gone: the "No days yet" card, its dashed chips and its gradient button.
    for (const s of ['No days yet', 'Finish any of today', 'dashed', 'btn btn-p']) expect(fresh, s).not.toContain(s);
  });
  it('the streak card is always there, at zero too, with fourteen squares and its two ends in sentence case', () => {
    for (const [k, p] of Object.entries(ALL)) {
      expect((p.match(/class="gp-list hs-streak" role="status"/g) || []).length, k).toBe(1);
      const sq = p.slice(p.indexOf('<div class="hs-sq" role="group" aria-label="Form — last 14 days">'), p.indexOf('<div class="hs-ends">'));
      expect((sq.match(/<span /g) || []).length, k).toBe(14);
      // Each square is an image with its sentence: a bare span may not carry a label (axe, 25 Nov 2026).
      expect((sq.match(/<span (class="[a-z -]+" )?role="img" aria-label="/g) || []).length, k).toBe(14);
      expect(text(p), k).toContain('|2 weeks ago|Today|');
    }
    expect(PHONE_SRC).not.toMatch(/hasFormHistory &&/);
    // A day played is lit; today not yet played is the yellow line; a day caught up later is dimmer.
    expect((fresh.match(/class="is-due"/g) || []).length).toBe(1);
    expect(fresh).not.toContain('class="is-on');
    expect((gaps.match(/class="is-on is-late"/g) || []).length).toBe(1);
    expect(gaps).not.toContain('class="is-due"'); // a Footle finished today
  });
  it('the label is alone on its line, and the games head their columns inside the card as images with their names', () => {
    for (const [k, p] of Object.entries(ALL)) {
      expect(p, k).toContain('</section><div class="home-section-title">Recent days</div><section class="gp-list hs-list"><div class="hs-heads"><span aria-hidden="true"></span>');
      const heads = p.slice(p.indexOf('<div class="hs-heads">'), p.indexOf('<div class="hs-row"'));
      expect([...heads.matchAll(/<span class="hs-tile" role="img" aria-label="([^"]+)" title="\1"/g)].map((m) => m[1]), k).toEqual(['Footle', 'Daily 7', 'Transfer Trail', 'Top 10']);
      // The Footle letter, and the app's own lucide marks for the other three.
      expect(text(heads), k).toBe('|F|clipboard-list|route|list-ordered|');
      // The four coloured words are gone from the screen.
      for (const w of ['FOOTLE', 'DAILY 7', 'TRAIL', 'TOP 10']) expect(text(p), `${k} ${w}`).not.toContain(`|${w}|`);
    }
    // Each tile in its game's own colour (lib/accents.js).
    for (const s of ['style="--mode:#8AE042;--mode-rgb:88,204,2"', 'style="--mode:#FFC107;--mode-rgb:255,170,0"', 'style="--mode:#7CC3F0;--mode-rgb:78,168,222"', 'style="--mode:#FF9B7A;--mode-rgb:255,138,101"']) expect(fresh, s).toContain(s);
    // The fourth is the day's own game: Mystery Player's mark on a day Top 10 has no list.
    expect(DAILY).toContain('{cols.map(c => <HeadTile key={c.key} mode={c.key} />)}');
    expect(DAILY).toContain('{mode === "footle" ? <b aria-hidden="true">F</b> : <ModeGlyph mode={mode} size={15} />}');
  });
  it('Today is the first day for everyone; a first-day player gets their result and the one line', () => {
    for (const [k, p] of Object.entries(ALL)) {
      const list = p.slice(p.indexOf('</div><div class="hs-row"') + 6);
      expect(list.slice(0, 200), k).toMatch(/^<div class="hs-row" role="group" aria-label="Today Oct 20 — /);
    }
    expect(text(firstDay)).toContain('|Today|check|play|play|play|Each day you play gets a row here|');
    expect((firstDay.match(/class="hs-play"/g) || []).length).toBe(3);
    expect(firstDay).not.toContain('aria-label="Play today’s Footle"');
  });
  it('a finished day prints four results and no button; yesterday\'s open games are bare arrows', () => {
    expect(rowOf(swept, 'Today Oct 20')).not.toContain('<button');
    const yday = rowOf(swept, 'Yesterday Oct 19');
    expect((yday.match(/<button type="button" class="hs-play is-bare"/g) || []).length).toBe(4);
    expect(yday).not.toContain('class="hs-play"');
    for (const s of ['aria-label="Play Yesterday&#x27;s Footle"', 'aria-label="Catch up — play yesterday&#x27;s Daily 7"', 'aria-label="Play Yesterday&#x27;s Transfer Trail"', 'aria-label="Play Yesterday&#x27;s Top 10"']) expect(yday, s).toContain(s);
    // Only yesterday replays: no older row holds a button.
    const older = gaps.slice(gaps.indexOf('aria-label="Sun Oct 18'));
    expect(older.slice(0, older.indexOf('</section>'))).not.toContain('<button');
  });
  it('NO day-complete block on a phone, in any state: no "Clean sweep", no "Today\'s done", no Survival, no pills of its own', () => {
    // Alex, of the card: "survival never runs out? i am not sure what that even points to in this
    // context". Two of the six states are finished days (one all won, one with a lost Trail).
    for (const [k, p] of Object.entries(ALL)) {
      for (const s of ['Clean sweep', "Today's done", 'Today&#x27;s done', 'Survival', 'Yesterday is still open', 'lucide-check"', 'confetti']) expect(p, `${k}: ${s}`).not.toContain(s);
      // The streak card comes straight after the title's row, or after the repair card alone.
      expect(p, k).toMatch(/<\/div><\/div>(<section class="gp-list"><div class="todays-seven-secondary is-still" style="--mode:#FF6B6B[^"]*">[\s\S]*?<\/section>)?<section class="gp-list hs-streak"/);
    }
    expect(text(swept)).toContain('|Today|check|6|/7|check|7|/10|');
    // The only pills left on the screen are the repair card's: there they are the way to repair.
    expect((swept.match(/class="hs-pills"/g) || []).length).toBe(1);
    for (const k of ['fresh', 'firstDay', 'gaps', 'survival', 'broke']) expect(ALL[k], k).not.toContain('hs-pills');
    // In the source: the phone column never mounts it, and the component has no phone variant left.
    expect(PHONE_SRC.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')).not.toMatch(/DayComplete|playSurvival|allWon|Confetti/);
    const dc = DAILY.slice(DAILY.indexOf('function DayComplete('), DAILY.indexOf('// The comeback banner'));
    expect(dc).toContain('function DayComplete({ open, onSurvival, wide, todayYMD, swept = false }) {');
    expect(dc).not.toMatch(/\bkit\b|gp-list|hs-pills|t7s-/);
    // And the wide window's block, which IS in the page on a phone (its layout not displayed), must
    // not celebrate there: no buzz and no confetti where nobody can see it. It asks the layout's own
    // display, so a wide window celebrates exactly when it did.
    expect(dc).toContain('const layout = rootRef.current?.closest(".daily-desktop");');
    expect(dc).toContain('if (layout && getComputedStyle(layout).display === "none") return;');
    expect(dc.indexOf('getComputedStyle(layout).display === "none"')).toBeLessThan(dc.indexOf('localStorage.setItem("biq_sweep_seen", todayYMD);'));
    expect(read('src/app.css')).toMatch(/\.daily-desktop\{display:none;\}/);
  });
  it('a run of days off is one quiet line inside the card, and a screen reader still gets the dates', () => {
    expect((gaps.match(/class="hs-gap"/g) || []).length).toBe(3);
    // As words only it gets: a label on a bare div is one the accessibility check refuses.
    expect(gaps).toContain('<div class="hs-gap"><span class="sr-only">Oct 15 – Oct 16: </span>2 days off</div>');
    expect(gaps, 'one card for all days').not.toMatch(/border-radius:13px/);
    expect((gaps.match(/<section class="gp-list hs-list">/g) || []).length).toBe(1);
  });
  it('every row keeps its sentence for a screen reader, and no label sits on a bare span or div', () => {
    expect(gaps).toContain('role="group" aria-label="Sun Oct 18 — Footle not solved, Daily 7 5 of 7, Transfer Trail solved in 2, Top 10 6 of 10"');
    expect(gaps).toContain('role="status" aria-label="1-day daily streak, best 6"');
    // The countdown's words are its sentence; it carries no label of its own.
    expect(gaps).toContain('<div class="hs-count">New puzzles in <b>12h 0m</b></div>');
    // What is only drawn is hidden from it.
    expect((gaps.match(/<span class="hs-c" aria-hidden="true">/g) || []).length).toBeGreaterThan(12);
    // aria-label only where a role or a control can carry it (axe: aria-prohibited-attr).
    for (const [k, p] of Object.entries(ALL)) {
      for (const m of p.matchAll(/<(\w+)((?:\s+[\w-]+(?:="[^"]*")?)*)>/g)) {
        if (!/\saria-label="/.test(m[2])) continue;
        expect(m[1] === 'button' || /\srole="(img|group|status)"/.test(m[2]), `${k}: <${m[1]}${m[2].slice(0, 80)}>`).toBe(true);
      }
    }
  });
  it('the repair card and the shields line are still there, as plain cards with lucide icons', () => {
    expect(text(swept)).toContain("|heart-crack|Your 9-day streak broke|Play one of yesterday's puzzles before midnight to repair it|flame|Footle|flame|Daily 7|flame|Transfer Trail|flame|Top 10|");
    expect(text(swept)).toContain('|shield|2 streak shields ready|Auto-protects your streak if you miss a day — earn one every 200 XP|');
    expect(text(broke)).toContain("|heart-crack|Your 3-day streak broke|Yesterday's puzzles are all done — the repair will land with your next play|");
    expect(swept).toContain('aria-label="Repair the streak — play yesterday&#x27;s Footle"');
    // The order: the repair card, then the streak card, then the days, then the shields.
    const at = (s) => swept.indexOf(s);
    expect(at('lucide-heart-crack')).toBeLessThan(at('hs-streak'));
    expect(at('hs-streak')).toBeLessThan(at('hs-list'));
    expect(at('hs-list')).toBeLessThan(at('lucide-shield'));
  });
  it('no system emoji and no text glyph for an icon anywhere in the phone column', () => {
    for (const [k, p] of Object.entries(ALL)) {
      expect(p, k).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/u);
      expect(p.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '|'), k).not.toMatch(/[✓✗↺·]/);
    }
    expect(PHONE_SRC).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});

describe('the wide window is as it was', () => {
  it('its own streak card keeps its gate, its table keeps its pills, chips and empty words, and its day-complete block is its own', () => {
    const wideSrc = DAILY.slice(DAILY.indexOf('<div className="daily-desktop">'));
    expect(wideSrc).toMatch(/\{hasFormHistory && \(\s*<div className="hr-card hr-streak"/);
    expect(wideSrc).toContain('{t(playedCount > 0 ? "hi.fromTomorrow" : "hi.playFirst")}');
    expect(wideSrc).toContain('<ReplayCell key={c.key} w={DCOL_W}');
    expect(wideSrc).toContain('<ScoreCell key={c.key} w={DCOL_W}');
    expect(wideSrc).toContain('<StreakRepairBanner repair={streakRepair} open={dayOpen} wide />');
    expect(wideSrc).toContain('{allDone && <DayComplete open={dayOpen} onSurvival={playSurvival} wide todayYMD={todayYMD} swept={allWon} />}');
    for (const s of ['hs-', 'gp-list', 'todayCells', 'DayCell', 'HeadTile', 'DayName', ' kit']) expect(wideSrc, s).not.toContain(s);
  });
  it('as rendered: no streak card for a player with no played day, the old empty line, no kit class', () => {
    const w = wideOf(H['history: a new player, nothing played']);
    expect(w).not.toContain('hr-streak');
    expect(w).toContain('Play today, then your recent days show up here.');
    for (const k of Object.keys(H)) expect(wideOf(H[k]), k).not.toMatch(/class="[^"]*\b(hs-[a-z]+|gp-list|t7s-[a-z]+)\b/);
    expect(wideOf(H['history: two weeks with gaps, yesterday open'])).toContain('hr-card hr-streak');
  });
  it('as rendered: the day-complete block is still in the wide window, with its words, its numbers and Survival', () => {
    const won = wideOf(H['history: all done today, yesterday open, streak broke']);
    expect(won).toContain('>Clean sweep<');
    expect(won).toContain('>Yesterday is still open<');
    const lost = wideOf(H['history: all done today and yesterday (survival), at best']);
    for (const s of ['>Today&#x27;s done<', '>Survival never runs out<', '>Survival</button>']) expect(lost, s).toContain(s);
    // Its table keeps the chips and the numbers a phone no longer prints (yesterday's Footle in 2).
    for (const s of ['>2</span>', '>2/7</span>', '>3/10</span>']) expect(lost, s).toContain(s);
    for (const k of ['hi.done', 'hi.yOpen', 'hi.survNever']) { expect(typeof EN[k], k).toBe('string'); expect(typeof ES[k], k).toBe('string'); }
  });
  it('the phone column is the only thing that takes the kit: every rule of its stylesheet starts at .hs', () => {
    const body = CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '').replace(/\}\s*\}/g, '}');
    const selectors = [...body.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((m) => m[1].split(',')).map((s) => s.trim()).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(40);
    // One rule does not: the page's gutter under 360 wide is the app's own, and the tab's pane clips
    // what reaches out of it, so it is the pane that is widened, and only the pane holding this
    // screen, and never in a browser tab.
    const PANE = 'body:not(.biq-web) .tab-pane:has(> .daily-screen)';
    for (const s of selectors) expect(/^\.hs(\s|$)/.test(s) || s === PANE, s).toBe(true);
    expect(selectors.filter((s) => s === PANE).length).toBe(1);
    expect(CSS).toMatch(/@media \(max-width: 359px\)\{[^@]*body:not\(\.biq-web\) \.tab-pane:has\(> \.daily-screen\)\{margin-left:-4px;margin-right:-4px;\}\s*\}\s*$/);
    expect(DAILY).toContain('<div className="daily-col-mobile hs" style={{ "--hs-colmax": `${COL_W}px` }}>');
    expect((DAILY.match(/className="[^"]*\bhs\b[^-]/g) || []).length).toBe(1);
    // The class must not be one another screen already draws (.hs-miss is Hot Streak's, in app.css).
    const mine = [...new Set([...CSS.matchAll(/\.(hs-[a-z0-9]+)/g)].map((m) => m[1]))];
    for (const c of mine) expect(APPCSS, c).not.toMatch(new RegExp(`\\.${c}\\b`));
  });
});

describe('the kit\'s rules on this screen', () => {
  const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  it('type at 11, 13.5 and 16 under a title of 24, and nothing between, at every width', () => {
    const sizes = [...new Set([...rules.matchAll(/font-size:([\d.]+)px/g)].map((m) => m[1]))].sort((a, b) => a - b);
    expect(sizes).toEqual(['11', '13.5', '16', '24']);
    // 24 is the title's alone (it was 32, on a line of its own: "a bit too large and clumsy").
    for (const m of rules.matchAll(/([^{}]+)\{[^{}]*font-size:24px[^{}]*\}/g)) expect(m[1].trim()).toBe('.hs .hs-title');
    expect(rules).toMatch(/\.hs \.hs-title\{font-size:24px;line-height:1;font-weight:800;/);
    // The smallest phones change no size.
    const small = rules.slice(rules.indexOf('@media (max-width: 359px)'));
    expect(small).not.toMatch(/font-size/);
    // And the phone column sets no size of its own in the markup.
    expect(PHONE_SRC).not.toMatch(/fontSize/);
    for (const p of [fresh, gaps, swept]) expect(p).not.toMatch(/font-size:/);
  });
  it('one rhythm: 20 between sections, 10 from the label to its card, the wells 42', () => {
    expect(rules).toContain('.hs .hs-top + .gp-list{margin-top:20px;}');
    expect(rules).toMatch(/\.hs \.home-section-title\{display:block;margin:20px 4px 10px;/);
    expect(rules).toContain('.hs .t7s-icon{width:42px;height:42px;border:0;border-radius:12px;}');
    expect(rules).toContain('.hs .hs-heads{height:48px;}');
    expect(rules).toMatch(/\.hs \.hs-tile\{[^}]*width:28px;height:28px;border-radius:9px;/);
    expect(rules).toMatch(/\.hs \.hs-gap\{[^}]*height:34px;/);
  });
  it('filled, never outlined; no glow', () => {
    expect(rules).not.toMatch(/border:\s*1(\.5)?px/);
    expect(rules).not.toMatch(/outline:/);
    // The only lines: the hairline between rows, today's yellow square, a focus ring.
    const shadows = [...rules.matchAll(/box-shadow:([^;}]+)/g)].map((m) => m[1].trim());
    expect(shadows.sort()).toEqual(['0 0 0 2px var(--mode)', 'inset 0 0 0 1.5px var(--gold)', 'inset 0 1px 0 rgba(255,255,255,0.07)', 'none', 'none']);
    for (const p of Object.values(ALL)) expect(p).not.toMatch(/border:1(\.5)?px|box-shadow/);
  });
  it('numbers are Inter with tabular figures, never the mono face', () => {
    expect(rules).not.toMatch(/font-family:(?!inherit)/);
    for (const sel of ['.hs .hs-count b', '.hs .hs-c > b', '.hs .hs-c > i', '.hs .hs-day', '.hs .hs-gap', '.hs .hs-num']) {
      const rule = rules.slice(rules.indexOf(`${sel}{`), rules.indexOf('}', rules.indexOf(`${sel}{`)));
      expect(rule, sel).toContain('font-variant-numeric:tabular-nums');
    }
    for (const s of ['<span class="t7s-title hs-num">0 day streak</span>', '<span class="t7s-title hs-num">2 streak shields ready</span>']) expect(fresh + swept, s).toContain(s);
    // Not on a sentence: Inter's tabular hyphen opens a gap in "9-day".
    expect(swept).toContain('<span class="t7s-title">Your 9-day streak broke</span>');
  });
  it('a play button is the whole column wide and 48 of the row\'s 52 high; the column is never under 44', () => {
    expect(rules).toMatch(/\.hs \.hs-play\{[^}]*width:100%;height:48px;/);
    expect(rules).toMatch(/\.hs \.hs-play span\{[^}]*width:36px;height:36px;border-radius:50%;/);
    for (const m of rules.matchAll(/--hs-col:clamp\((\d+)px,/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(44);
    expect((rules.match(/--hs-col:clamp\(/g) || []).length).toBe(2);
    // The widths the two formulas give: 54 at 393, 53.5 at 375, 49.75 at 360; 44 at 320.
    const col = (vw) => Math.min(54, Math.max(44, vw < 360 ? (vw - 144) / 4 : (Math.min(vw, 420) - 161) / 4));
    expect([393, 375, 360, 359, 320].map(col)).toEqual([54, 53.5, 49.75, 53.75, 44]);
    expect(rules).toContain('--hs-col:clamp(44px,calc((min(100vw,420px) - 161px) / 4),var(--hs-colmax))');
    expect(rules).toContain('--hs-col:clamp(44px,calc((100vw - 144px) / 4),var(--hs-colmax))');
    // The soft pills: 36 to the eye, 44 to the thumb.
    expect(rules).toMatch(/\.hs \.gp-list \.t7s-cta\{[^}]*height:36px;/);
    expect(rules).toContain('.hs .gp-list .t7s-cta::after{content:"";position:absolute;left:0;right:0;top:-4px;bottom:-4px;}');
  });
  it('"yellow", never the other word, in what this change wrote', () => {
    expect(CSS).not.toMatch(/amber/i);
    expect(PHONE_SRC).not.toMatch(/amber/i);
    for (const fn of ['function DayCell(', 'function HeadTile(', 'export function dayLabel(', 'export function cellMark(', 'export function todayCells(', 'export function streakNoteKey(']) {
      const i = DAILY.indexOf(fn);
      expect(i, fn).toBeGreaterThan(0);
      expect(DAILY.slice(i - 1400, i + 1200), fn).not.toMatch(/amber/i);
    }
  });
  it('the stylesheet rides in the tab\'s own chunk, and the screen brings nothing heavy to Home', () => {
    expect(DAILY).toContain('import "./history.css";');
    expect(APP).toMatch(/const DailyTabScreen = withSuspense\(lazyNamed\(\(\) => import\('\.\/screens\/DailyScreen\.jsx'\), 'DailyTabScreen'\)/);
    expect(APP).not.toMatch(/history\.css/);
  });
});

describe('the words', () => {
  it('new and changed strings have both languages; what the old screen said is gone from both', () => {
    for (const k of ['hi.keepToday', 'hi.firstRow', 'hi.keep', 'hi.light', 'hi.2wk', 'hi.playToday']) {
      expect(typeof EN[k], k).toBe('string');
      expect(typeof ES[k], k).toBe('string');
      expect(ES[k], k).not.toBe(EN[k]);
    }
    expect(EN['hi.2wk']).toBe('2 weeks ago');
    expect(EN['hi.firstRow']).toBe('Each day you play gets a row here');
    for (const k of ['hi.noDays', 'hi.empty', 'hi.four', 'hi.three', 'hi.TODAY']) {
      expect(k in EN, k).toBe(false);
      expect(k in ES, k).toBe(false);
      expect(DAILY, k).not.toContain(`"${k}"`);
    }
  });
  it('every hi.* key the screen asks for exists, and every hi.* key in the table is asked for', () => {
    const asked = new Set([...DAILY.matchAll(/["'](hi\.[A-Za-z0-9]+)["']/g)].map((m) => m[1]));
    const base = (k) => k.replace(/_(one|other)$/, '');
    const have = new Set(Object.keys(EN).filter((k) => k.startsWith('hi.')).map(base));
    for (const k of asked) expect(have.has(k), `${k} is asked for`).toBe(true);
    for (const k of have) expect(asked.has(k), `${k} is in the table`).toBe(true);
  });
});
