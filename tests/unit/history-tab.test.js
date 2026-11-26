// The History tab on a PHONE (26 Nov 2026; screens/DailyScreen.jsx, screens/history.css).
// Alex, of the drawing it is built from (ball-iq-audit/2026-11-24/finish/history-2.png): "Yes, build
// it". It reverses "HISTORY, not a second Today" of 6 Sept on purpose: Today is always the first row
// of the list of days, and each game not finished today is a play button on it.
// What this file holds: the two rules with logic in them (the grey line under the streak, and what
// each cell of the Today row is), what a phone shows in the six rendered states of the golden, that
// the wide window kept its own layout and its own streak gate, and the kit's rules for this screen
// (three type sizes under the title, nothing outlined, lucide and no system emoji, "yellow").
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
const { todayCells, streakNoteKey } = await import('../../src/screens/DailyScreen.jsx');

// The phone column of a render, and the wide window's.
const phoneOf = (g) => g.slice(g.indexOf('<div class="daily-col-mobile hs"'), g.indexOf('<div class="daily-desktop">'));
const wideOf = (g) => g.slice(g.indexOf('<div class="daily-desktop">'));
const text = (s) => s.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '|').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\|+/g, '|');
const H = Object.fromEntries(Object.entries(GOLDEN).filter(([k]) => k.startsWith('history: ')));
const fresh = phoneOf(H['history: a new player, nothing played']);
const firstDay = phoneOf(H['history: today played, no past days yet']);
const gaps = phoneOf(H['history: two weeks with gaps, yesterday open']);
const swept = phoneOf(H['history: all done today, yesterday open, streak broke']);
const survival = phoneOf(H['history: all done today and yesterday (survival), at best']);
const broke = phoneOf(H['history: streak broke, yesterday all done']);
// The source of the phone column, comments and all.
const PHONE_SRC = DAILY.slice(DAILY.indexOf('<div className="daily-col-mobile hs"'), DAILY.indexOf('{/* /.daily-col-mobile'));

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
  it('above zero with today NOT counted yet: one puzzle today keeps it (it said "come back tomorrow" to everyone)', () => {
    expect(streakNoteKey(1, false)).toBe('hi.keepToday');
    expect(streakNoteKey(58, false)).toBe('hi.keepToday');
    expect(EN['hi.keepToday']).toBe('Play one puzzle today to keep it');
  });
  it('a line of its own now: no leading dash or dot, in either language', () => {
    for (const k of ['hi.keep', 'hi.light', 'hi.keepToday']) {
      expect(EN[k], k).toMatch(/^[A-Z]/);
      expect(ES[k], k).toMatch(/^[A-ZÁÉÍÓÚÑ]/);
    }
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
    expect(PHONE_SRC).toContain('{t(streakNoteKey(streak.unbeaten, countedToday))}');
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
  it('finished: exactly what a past row prints for that game, and not a button', () => {
    const m = day({ fAttempt: true, fWon: true, fUsed: 3, t7Done: true, t7Score: 5, trAttempt: true, trWon: false, trUsed: 5, t10Attempt: true, t10Done: true, t10Score: 7 });
    const c = by(todayCells(m, games({ footle: { done: true }, daily7: { done: true }, trail: { done: true }, top10: { done: true } })));
    expect([c.footle.state, c.footle.text]).toEqual(['win', '3']);
    expect([c.daily7.state, c.daily7.text]).toEqual(['win', '5/7']);
    expect(c.trail.state).toBe('miss'); // not solved: the miss mark, as in any row
    expect([c.top10.state, c.top10.text]).toEqual(['win', '7/10']);
    for (const k of Object.keys(c)) expect(c[k].play, k).toBe(null);
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

describe('what a phone shows', () => {
  it('a new player: the same screen with one row in it', () => {
    expect(text(fresh)).toContain('|History|New puzzles in |12h 0m|');
    expect(text(fresh)).toContain('|Recent days|FOOTLE|DAILY 7|TRAIL|TOP 10|Today|Oct 20|Each day you play gets a row here|');
    expect((fresh.match(/class="hs-row"/g) || []).length).toBe(1);
    expect((fresh.match(/<button type="button" class="hs-play"/g) || []).length).toBe(4);
    for (const g of ['Footle', 'Daily 7', 'Transfer Trail', 'Top 10']) expect(fresh).toContain(`aria-label="Play today’s ${g}"`);
    // Gone: the "No days yet" card, its dashed chips and its gradient button.
    for (const s of ['No days yet', 'Finish any of today', 'dashed', 'btn btn-p']) expect(fresh, s).not.toContain(s);
  });
  it('the streak card is always there, at zero too, with fourteen squares and its two ends in sentence case', () => {
    for (const [k, p] of Object.entries({ fresh, firstDay, gaps, swept, survival, broke })) {
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
  it('Today is the first row for everyone; a first-day player gets their result and the one line', () => {
    for (const [k, p] of Object.entries({ fresh, firstDay, gaps, swept, survival, broke })) {
      const list = p.slice(p.indexOf('<section class="gp-list hs-list">'));
      expect(list.slice(0, 400), k).toMatch(/^<section class="gp-list hs-list"><div class="hs-row" role="group" aria-label="Today Oct 20 — /);
    }
    expect(text(firstDay)).toContain('|Today|Oct 20|3|Each day you play gets a row here|');
    expect((firstDay.match(/class="hs-play"/g) || []).length).toBe(3);
    expect(firstDay).not.toContain('aria-label="Play today’s Footle"');
  });
  it('a finished day prints four results and no button; yesterday\'s open games are bare arrows', () => {
    expect(text(swept)).toContain('|Today|Oct 20|3|6/7|2|7/10|Yesterday|Oct 19|');
    const today = swept.slice(swept.indexOf('<section class="gp-list hs-list">'), swept.indexOf('aria-label="Yesterday Oct 19'));
    expect(today).not.toContain('<button');
    const yday = swept.slice(swept.indexOf('aria-label="Yesterday Oct 19'), swept.indexOf('class="hs-gap"'));
    expect((yday.match(/<button type="button" class="hs-play is-bare"/g) || []).length).toBe(4);
    expect(yday).not.toContain('class="hs-play"');
    for (const s of ['aria-label="Play Yesterday&#x27;s Footle"', 'aria-label="Catch up — play yesterday&#x27;s Daily 7"', 'aria-label="Play Yesterday&#x27;s Transfer Trail"', 'aria-label="Play Yesterday&#x27;s Top 10"']) expect(yday, s).toContain(s);
    // Only yesterday replays: no older row holds a button.
    const older = gaps.slice(gaps.indexOf('aria-label="Sun Oct 18'));
    expect(older.slice(0, older.indexOf('</section>'))).not.toContain('<button');
  });
  it('a score is a plain number in the game\'s colour; a miss, an open board, an unplayed game and a game not live each have their mark', () => {
    // Sun Oct 18: Footle lost, Daily 7 5/7, Trail in 2, Top 10 6/10.
    const sun = gaps.slice(gaps.indexOf('aria-label="Sun Oct 18'), gaps.indexOf('aria-label="Sat Oct 17'));
    expect(sun).toContain('lucide-x hs-x');
    expect(sun).toContain('<b style="color:#FFC107;-webkit-text-fill-color:#FFC107">5/7</b>');
    expect(sun).toContain('<b style="color:#7CC3F0;-webkit-text-fill-color:#7CC3F0">2</b>');
    expect(sun).toContain('<b style="color:#FF9B7A;-webkit-text-fill-color:#FF9B7A">6/10</b>');
    expect(sun, 'no chip under a score').not.toMatch(/border-radius:999px|padding:3px 8px/);
    // Sat Oct 17: a Top 10 begun and left is the small dot; the other three are dashes.
    const sat = gaps.slice(gaps.indexOf('aria-label="Sat Oct 17'), gaps.indexOf('class="hs-gap"'));
    expect((sat.match(/<s><\/s>/g) || []).length).toBe(3);
    expect((sat.match(/<i><\/i>/g) || []).length).toBe(1);
    // Thu Oct 8, before Top 10: a Mystery Player result under the column Top 10 now heads carries
    // that game's mark, in its violet; Wed Oct 7's board was left open.
    const thu = gaps.slice(gaps.indexOf('aria-label="Thu Oct 8'), gaps.indexOf('aria-label="Wed Oct 7'));
    expect(thu).toMatch(/<b style="color:#B9A5FF;-webkit-text-fill-color:#B9A5FF"><svg[^>]*lucide-user-round-search[^>]*>[\s\S]*?<\/svg>5<\/b>/);
    expect(gaps.slice(gaps.indexOf('aria-label="Thu Oct 8'), gaps.indexOf('aria-label="Thu Oct 8') + 130)).toContain('Mystery Player solved in 5');
  });
  it('a run of days off is one quiet line inside the card, and a screen reader still gets the dates', () => {
    expect((gaps.match(/class="hs-gap"/g) || []).length).toBe(3);
    expect(gaps).toContain('<div class="hs-gap" aria-label="Oct 15 – Oct 16: 2 days off">2 days off</div>');
    expect(gaps, 'one card for all days').not.toMatch(/border-radius:13px/);
    expect((gaps.match(/<section class="gp-list hs-list">/g) || []).length).toBe(1);
  });
  it('every row and every cell keeps its sentence for a screen reader', () => {
    expect(gaps).toContain('role="group" aria-label="Today Oct 20 — Footle solved in 3, Daily 7 not played, Transfer Trail not played, Top 10 not played"');
    expect(gaps).toContain('role="group" aria-label="Sun Oct 18 — Footle not solved, Daily 7 5 of 7, Transfer Trail solved in 2, Top 10 6 of 10"');
    expect(gaps).toContain('role="status" aria-label="1-day daily streak, best 6"');
    expect(gaps).toContain('<span class="hs-count" aria-label="New puzzles in 12h 0m">');
    // What is only drawn is hidden from it.
    expect((gaps.match(/<span class="hs-c" aria-hidden="true">/g) || []).length).toBeGreaterThan(12);
  });
  it('the repair, day-complete and shields blocks are still there, as plain cards with lucide icons', () => {
    expect(text(swept)).toContain("|Your 9-day streak broke|Play one of yesterday's puzzles before midnight to repair it|Footle|Daily 7|Transfer Trail|Top 10|");
    // 26 Nov 2026: with yesterday open the card is its tick and two lines. Yesterday's four games
    // are offered once, by the Yesterday row's arrows, not a second time as pills on this card.
    expect(text(swept)).toContain("|Clean sweep|Yesterday is still open|");
    expect(text(swept)).not.toContain("|Yesterday is still open|Footle|");
    // (The streak-repair card above it keeps its own pills: in this state they are the way to repair.)
    expect((swept.match(/class="hs-pills"/g) || []).length).toBe(1);
    expect(text(swept)).toContain('|2 streak shields ready|Auto-protects your streak if you miss a day — earn one every 200 XP|');
    // "Clean sweep" only when every game today was won: this day has a lost Trail, so it is "Today's done".
    expect(text(survival)).toContain("|Today's done|Survival never runs out|Survival|");
    expect(text(swept)).not.toContain("Today's done");
    expect(text(broke)).toContain("|Your 3-day streak broke|Yesterday's puzzles are all done — the repair will land with your next play|");
    for (const s of ['lucide-heart-crack', 'lucide-check', 'lucide-shield', 'lucide-flame']) expect(swept, s).toContain(s);
    expect(swept).toContain('aria-label="Repair the streak — play yesterday&#x27;s Footle"');
    // The day-complete card's own "Play yesterday's X" pills are gone from a phone (26 Nov 2026).
    expect(swept).not.toContain('aria-label="Play yesterday&#x27;s Top 10"');
    // The order: what is about today first, then the streak card, then the days, then the shields.
    const at = (s) => swept.indexOf(s);
    expect(at('lucide-heart-crack')).toBeLessThan(at('lucide-check'));
    expect(at('lucide-check')).toBeLessThan(at('hs-streak'));
    expect(at('hs-streak')).toBeLessThan(at('hs-list'));
    expect(at('hs-list')).toBeLessThan(at('lucide-shield'));
  });
  it('no system emoji and no text glyph for an icon anywhere in the phone column', () => {
    for (const [k, p] of Object.entries({ fresh, firstDay, gaps, swept, survival, broke })) {
      expect(p, k).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/u);
      expect(text(p), k).not.toMatch(/[✓✗↺·]/);
    }
    expect(PHONE_SRC).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});

describe('the wide window is as it was', () => {
  it('its own streak card keeps its gate, and its table keeps its pills, chips and empty words', () => {
    const wideSrc = DAILY.slice(DAILY.indexOf('<div className="daily-desktop">'));
    expect(wideSrc).toMatch(/\{hasFormHistory && \(\s*<div className="hr-card hr-streak"/);
    expect(wideSrc).toContain('{t(playedCount > 0 ? "hi.fromTomorrow" : "hi.playFirst")}');
    expect(wideSrc).toContain('<ReplayCell key={c.key} w={DCOL_W}');
    expect(wideSrc).toContain('<ScoreCell key={c.key} w={DCOL_W}');
    expect(wideSrc).toContain('<StreakRepairBanner repair={streakRepair} open={dayOpen} wide />');
    expect(wideSrc).toContain('{allDone && <DayComplete open={dayOpen} onSurvival={playSurvival} wide todayYMD={todayYMD} swept={allWon} />}');
    for (const s of ['hs-', 'gp-list', 'todayCells', 'DayCell', ' kit']) expect(wideSrc, s).not.toContain(s);
  });
  it('as rendered: no streak card for a player with no played day, the old empty line, no kit class', () => {
    const w = wideOf(H['history: a new player, nothing played']);
    expect(w).not.toContain('hr-streak');
    expect(w).toContain('Play today, then your recent days show up here.');
    for (const k of Object.keys(H)) expect(wideOf(H[k]), k).not.toMatch(/class="[^"]*\b(hs-[a-z]+|gp-list|t7s-[a-z]+)\b/);
    expect(wideOf(H['history: two weeks with gaps, yesterday open'])).toContain('hr-card hr-streak');
  });
  it('the phone column is the only thing that takes the kit: every rule of its stylesheet starts at .hs', () => {
    const body = CSS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '').replace(/\}\s*\}/g, '}');
    const selectors = [...body.matchAll(/([^{}]+)\{[^{}]*\}/g)].flatMap((m) => m[1].split(',')).map((s) => s.trim()).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(40);
    // (One rule names the browser-tab shell first: body.biq-web .hs ...)
    for (const s of selectors) expect(/^(body\.biq-web )?\.hs(\s|$)/.test(s), s).toBe(true);
    expect(DAILY).toContain('<div className="daily-col-mobile hs" style={{ "--hs-colmax": `${COL_W}px` }}>');
    expect((DAILY.match(/className="[^"]*\bhs\b[^-]/g) || []).length).toBe(1);
    // The class must not be one another screen already draws (.hs-miss is Hot Streak's, in app.css).
    const mine = [...new Set([...CSS.matchAll(/\.(hs-[a-z0-9]+)/g)].map((m) => m[1]))];
    for (const c of mine) expect(APPCSS, c).not.toMatch(new RegExp(`\\.${c}\\b`));
  });
});

describe('the kit\'s rules on this screen', () => {
  const rules = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  it('type at 11, 13.5 and 16 under the title, and nothing between', () => {
    const sizes = [...new Set([...rules.matchAll(/font-size:([\d.]+)px/g)].map((m) => m[1]))].sort((a, b) => a - b);
    expect(sizes).toEqual(['11', '13.5', '16', '28', '32']);
    // 32 (28 under 360 wide) is the title's alone.
    for (const m of rules.matchAll(/([^{}]+)\{[^{}]*font-size:(28|32)px[^{}]*\}/g)) expect(m[1].trim()).toBe('.hs .hs-title');
    // And the phone column sets no size of its own in the markup.
    expect(PHONE_SRC).not.toMatch(/fontSize/);
    for (const p of [fresh, gaps, swept]) expect(p).not.toMatch(/font-size:/);
  });
  it('filled, never outlined; no glow', () => {
    expect(rules).not.toMatch(/border:\s*1(\.5)?px/);
    expect(rules).not.toMatch(/outline:/);
    // The only lines: the hairline between rows, today's yellow square, a focus ring.
    const shadows = [...rules.matchAll(/box-shadow:([^;}]+)/g)].map((m) => m[1].trim());
    expect(shadows.sort()).toEqual(['0 0 0 2px var(--mode)', 'inset 0 0 0 1.5px var(--gold)', 'inset 0 1px 0 rgba(255,255,255,0.07)', 'none', 'none']);
    for (const p of [fresh, gaps, swept, survival, broke]) expect(p).not.toMatch(/border:1(\.5)?px|box-shadow/);
  });
  it('numbers are Inter with tabular figures, never the mono face', () => {
    expect(rules).not.toMatch(/font-family:(?!inherit)/);
    for (const sel of ['.hs .hs-count b', '.hs .hs-c b', '.hs .hs-gap', '.hs .hs-num,.hs .hs-row .t7s-sub']) {
      const rule = rules.slice(rules.indexOf(`${sel}{`), rules.indexOf('}', rules.indexOf(`${sel}{`)));
      expect(rule, sel).toContain('font-variant-numeric:tabular-nums');
    }
    for (const s of ['<span class="t7s-title hs-num">0 day streak</span>', '<span class="t7s-title hs-num">2 streak shields ready</span>']) expect(fresh + swept, s).toContain(s);
    // Not on a sentence: Inter's tabular hyphen opens a gap in "9-day".
    expect(swept).toContain('<span class="t7s-title">Your 9-day streak broke</span>');
  });
  it('a play button is the whole column wide and 56 high; the column is never under 44', () => {
    expect(rules).toMatch(/\.hs \.hs-play\{[^}]*width:100%;height:56px;/);
    expect(rules).toMatch(/\.hs \.hs-play span\{[^}]*width:36px;height:36px;border-radius:50%;/);
    for (const m of rules.matchAll(/--hs-col:clamp\((\d+)px,/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(44);
    expect((rules.match(/--hs-col:clamp\(/g) || []).length).toBe(2);
    // The soft pills: 36 to the eye, 44 to the thumb.
    expect(rules).toMatch(/\.hs \.gp-list \.t7s-cta\{[^}]*height:36px;/);
    expect(rules).toContain('.hs .gp-list .t7s-cta::after{content:"";position:absolute;left:0;right:0;top:-4px;bottom:-4px;}');
  });
  it('"yellow", never the other word, in what this change wrote', () => {
    expect(CSS).not.toMatch(/amber/i);
    expect(PHONE_SRC).not.toMatch(/amber/i);
    for (const fn of ['function DayCell(', 'export function todayCells(', 'export function streakNoteKey(']) {
      const i = DAILY.indexOf(fn);
      expect(DAILY.slice(i - 1400, i + 1200), fn).not.toMatch(/amber/i);
    }
  });
  it('the strip\'s gear and bell are tiles over this tab too, by rules both tabs can reach', () => {
    expect(APP).toContain('<div className={screen === "home" && (tab === "profile" || tab === "daily") ? "hdr hdr-guest" : "hdr"}>');
    expect(APPCSS).toContain('.hdr.hdr-guest .icon-btn{border:0;border-radius:14px;background:var(--s1);color:var(--t2);}');
    expect(read('src/screens/guestProfile.css')).not.toMatch(/\.hdr\.hdr-guest/);
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
