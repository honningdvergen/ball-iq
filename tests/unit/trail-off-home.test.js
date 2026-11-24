// The Trail's careers stay off Home's eager JavaScript (24 Nov 2026).
//
// lib/trail.js is every Trail career, the answer log, the positions and the
// alias tables: about 80 KB of source that grows with every wave. It rode on
// Home because four modules on Home's path imported three small helpers from
// it. Those helpers live in lib/trailDay.js now, and Home's "is there a Trail
// today?" is hasTrailOn() instead of !!getTrailAnswer().
//
// Two things can go wrong silently, and this file is what fails when they do:
//   1. somebody imports lib/trail.js from Home's path again (the build's
//      budget gate would notice only once the total passes 909 KB);
//   2. hasTrailOn() and getTrailAnswer() stop agreeing, so Home offers a Trail
//      the screen cannot open, or hides one it can.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as trail from '../../src/lib/trail.js';
import * as day from '../../src/lib/trailDay.js';
import * as R from '../../src/lib/scheduleRemote.js';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const rel = (f) => relative(SRC, f).split('\\').join('/');
const read = (f) => readFileSync(f, 'utf8');

// Static `import … from './x'`, `import './x'` and `export … from './x'`.
// A dynamic import('./x') is not followed: that is the whole eager/lazy line.
// (The same reading of the tree as tests/unit/i18n-eager-english.test.js.)
const STATIC = /(?:^|\n)\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
function resolveSpec(from, spec) {
  const base = resolve(dirname(from), spec);
  for (const c of [base, `${base}.js`, `${base}.jsx`]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}
const staticImports = (f) => [...read(f).matchAll(STATIC)].map((m) => resolveSpec(f, m[1])).filter(Boolean);
/** Everything reachable from `roots` through static imports, as src-relative paths. */
function reach(roots) {
  const seen = new Set();
  (function walk(files) {
    for (const f of files) {
      if (!f || seen.has(f) || !/\.(jsx?)$/.test(f)) continue;
      seen.add(f);
      walk(staticImports(f));
    }
  })(roots.map((r) => resolve(SRC, r)));
  return [...seen].map(rel);
}
const EAGER = reach(['main.jsx', 'GameRoot.jsx']);

// The modules that read the Trail's day without playing it. Each took its
// helpers from lib/trail.js until 24 Nov 2026.
//   App.jsx, HomeScreen.jsx   Home's eager path itself (the budget gate's sum)
//   DailyScreen.jsx           the Daily tab: its own chunk, fetched as soon as Home is up
//   FrontDoor.jsx             the website's front page: its own chunk, a visitor's first paint
const HOME_EAGER = ['App.jsx', 'screens/HomeScreen.jsx'];
const HOME_NEAR = ['screens/DailyScreen.jsx', 'marketing/FrontDoor.jsx'];
const HOME_PATH = [...HOME_EAGER, ...HOME_NEAR];
// The heavy module, and the modules that import it statically: reaching any of
// them from Home's path brings the careers with it.
const HEAVY = ['lib/trail.js', 'lib/stitch.js', 'lib/scheduleRemote.js', 'screens/TransferTrail.jsx', 'screens/StitchUp.jsx'];

describe('lib/trail.js is off Home\'s eager path', () => {
  it('the walk can see the tree, and the named modules are on Home\'s path', () => {
    expect(EAGER.length).toBeGreaterThan(30);
    for (const f of HOME_EAGER) expect(EAGER, f).toContain(f);
    expect(EAGER).toContain('lib/trailDay.js');
  });

  it('no module on Home\'s path statically imports the careers', () => {
    for (const f of HOME_PATH) {
      const imports = staticImports(resolve(SRC, f)).map(rel);
      for (const h of HEAVY) expect(imports, `${f} imports ${h} statically`).not.toContain(h);
      expect(imports, `${f} reads the Trail's day from lib/trailDay.js`).toContain('lib/trailDay.js');
    }
  });

  it('nothing reachable from main.jsx or GameRoot.jsx through static imports is the careers', () => {
    for (const h of HEAVY) expect(EAGER, h).not.toContain(h);
  });

  it('nor anything the Daily tab or the front door reaches through static imports', () => {
    for (const f of HOME_NEAR) {
      const graph = reach([f]);
      expect(graph, f).toContain('lib/trailDay.js');
      for (const h of HEAVY) expect(graph, `${f} reaches ${h}`).not.toContain(h);
    }
  });

  it('the heavy modules really do carry it (so the list above is the right list)', () => {
    for (const h of HEAVY.slice(1)) expect(staticImports(resolve(SRC, h)).map(rel), h).toContain('lib/trail.js');
  });

  it('lib/trailDay.js stays small: it imports the date helper and nothing else', () => {
    const f = resolve(SRC, 'lib/trailDay.js');
    expect(staticImports(f).map(rel)).toEqual(['lib/date.js']);
    expect(read(f)).not.toMatch(/\bimport\s*\(/);
    // The careers file is ~80 KB. A day helper has no business near that.
    expect(statSync(f).size).toBeLessThan(6 * 1024);
  });

  it('App.jsx hands the lazy screen the day, and the lazy screen resolves the career for that day', () => {
    const app = read(resolve(SRC, 'App.jsx'));
    expect(app).toContain("const TransferTrail = lazyNamed(() => import('./screens/TransferTrail.jsx'), 'DailyTransferTrail');");
    expect(app).toContain('if (!hasTrailOn(day)) { setTimeout(goHome, 0); return null; }');
    expect(app).toContain('<TransferTrail key={`${dateToYMD(day)}:${challengeSeen}`} date={day} ');
    expect(app).not.toMatch(/getTrailAnswer\s*\(/);
    const screen = read(resolve(SRC, 'screens/TransferTrail.jsx'));
    const at = screen.indexOf('export function DailyTransferTrail(');
    expect(at).toBeGreaterThan(-1);
    const body = screen.slice(at);
    expect(body).toContain('const player = getTrailAnswer(date);');
    expect(body).toContain('if (!player) return null;');
    expect(body).toContain('<TransferTrail player={player} date={date} onBack={onBack} {...rest} />');
  });
});

describe('lib/trail.js still exports everything it did', () => {
  it('the moved helpers are the same bindings, re-exported', () => {
    for (const name of ['DAY_MS', 'TRAIL_ANCHOR_DAY', 'getTrailDayIndex', 'getTrailNumber', 'hasTrailOn', 'loadTrailDay']) {
      expect(day[name], name).toBeDefined();
      expect(trail[name], name).toBe(day[name]);
    }
  });

  it('and the names the rest of the app and the scripts import are all still there', () => {
    // Every export of lib/trail.js the day before the split (00d0e12a), by name.
    const BEFORE = [
      'TRAIL_MAX_ATTEMPTS', 'DAY_MS', 'TRAIL_ANCHOR_DAY', 'getTrailDayIndex', 'getTrailNumber', 'TRAIL_PLAYERS',
      'TRAIL_ANSWER_LOG', 'getTrailPlayerByKey', 'getTrailAnswerForDayIndex', 'getTrailAnswer', 'TRAIL_ALIASES',
      'TRAIL_POSITIONS', 'normaliseGuess', 'normaliseVariants', 'acceptedNamesFor', 'guessMatchesPlayer',
      'TRAIL_OPENING_CLUBS', 'cluesShown', 'TRAIL_OPEN_THREE', 'openingFor', 'hintFor', 'loadTrailDay',
      'computeTrailStreak', 'buildTrailShareText', 'finishedBefore', 'startsAnnounced', 'owesCredit', 'enterGuess',
      'TRAIL_CLUB_ALIASES', 'trailClubKey', 'guessCareers', 'playedForAll', 'wrongPathNote',
    ];
    for (const name of BEFORE) expect(trail[name], name).toBeDefined();
  });
});

// A local noon on the calendar day with this day index (getTrailDayIndex reads
// the local date, so noon is the same day in every timezone).
const dateOf = (dayIndex) => { const d = new Date(dayIndex * 86400000); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12); };

describe('hasTrailOn(day) is !!getTrailAnswer(day)', () => {
  const { TRAIL_ANCHOR_DAY, TRAIL_ANSWER_LOG, TRAIL_PLAYERS, getTrailAnswer, getTrailAnswerForDayIndex, getTrailDayIndex } = trail;
  const N = TRAIL_ANSWER_LOG.length;
  // A month before the first Trail, every day of the log, and a full second
  // lap past its end (the log wraps instead of running out).
  const DAYS = [];
  for (let i = TRAIL_ANCHOR_DAY - 30; i <= TRAIL_ANCHOR_DAY + 2 * N + 30; i++) DAYS.push(i);

  it('what hasTrailOn leans on: the log is not empty and names only careers that exist', () => {
    expect(N).toBeGreaterThan(0);
    const keys = new Set(TRAIL_PLAYERS.map((p) => p.key));
    expect(TRAIL_ANSWER_LOG.filter((k) => !keys.has(k))).toEqual([]);
  });

  it('on every day of the log, the month before it and a full lap past its end', () => {
    const differ = [];
    for (const i of DAYS) {
      const date = dateOf(i);
      expect(getTrailDayIndex(date)).toBe(i);
      if (day.hasTrailOn(date) !== !!getTrailAnswer(date)) differ.push(i - TRAIL_ANCHOR_DAY);
      // The day index is the whole question: the same answer by index.
      if (day.hasTrailOn(date) !== !!getTrailAnswerForDayIndex(i)) differ.push(i - TRAIL_ANCHOR_DAY);
    }
    expect(differ).toEqual([]);
    // Both sides of the line were really looked at.
    expect(day.hasTrailOn(dateOf(TRAIL_ANCHOR_DAY - 1))).toBe(false);
    expect(day.hasTrailOn(dateOf(TRAIL_ANCHOR_DAY))).toBe(true);
    expect(getTrailAnswer(dateOf(TRAIL_ANCHOR_DAY - 1))).toBeNull();
    expect(getTrailAnswer(dateOf(TRAIL_ANCHOR_DAY)).key).toBe(TRAIL_ANSWER_LOG[0]);
  });

  it('today, with no argument, the way Home and App.jsx ask', () => {
    expect(day.hasTrailOn()).toBe(!!getTrailAnswer());
  });

  it('at both ends of a day: midnight and the last second', () => {
    for (const off of [0, 1, N - 1, N, N + 1]) {
      const noon = dateOf(TRAIL_ANCHOR_DAY + off);
      for (const [h, m, s] of [[0, 0, 0], [23, 59, 59]]) {
        const d = new Date(noon.getFullYear(), noon.getMonth(), noon.getDate(), h, m, s);
        expect(day.hasTrailOn(d), `${off} ${h}h`).toBe(!!getTrailAnswer(d));
      }
    }
    const eve = dateOf(TRAIL_ANCHOR_DAY - 1);
    expect(day.hasTrailOn(new Date(eve.getFullYear(), eve.getMonth(), eve.getDate(), 23, 59, 59))).toBe(false);
  });

  // An installed app can play from the log the site serves (lib/scheduleRemote.js).
  // The screen resolves it as trailPlayerForDate(date, bundled): the site's
  // career when this build has it, the bundled one when it does not. Home never
  // read the kept copy and still does not; what must hold is that the screen
  // has a player on exactly the days Home offers one.
  describe('with a kept copy of the site\'s log', () => {
    const memory = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
    const keep = (file) => memory({ biq_trail_remote: JSON.stringify(file), biq_trail_remote_for: R.TRAIL_BUILD });
    const SERVED = JSON.parse(readFileSync(new URL('../../public/data/trail.json', import.meta.url), 'utf8'));
    const copy = (x) => JSON.parse(JSON.stringify(x));
    const playable = (s) => DAYS.filter((i) => !!R.trailPlayerForDate(dateOf(i), getTrailAnswer(dateOf(i)), s));
    const offered = DAYS.filter((i) => day.hasTrailOn(dateOf(i)));

    it('the kept copy is really read', () => {
      const f = copy(SERVED); const i = f.days.length - 1;
      const other = TRAIL_PLAYERS.find((p) => p.key !== f.days[i]);
      f.days[i] = other.key;
      const s = keep(f);
      expect(R.cachedTrailLog(s)).not.toBeNull();
      expect(R.trailPlayerForDate(dateOf(TRAIL_ANCHOR_DAY + i), getTrailAnswerForDayIndex(TRAIL_ANCHOR_DAY + i), s).key).toBe(other.key);
    });

    it('a re-planned day: the screen has a player on exactly the days Home offers', () => {
      const f = copy(SERVED); const i = f.days.length - 1;
      f.days[i] = TRAIL_PLAYERS.find((p) => p.key !== f.days[i]).key;
      expect(playable(keep(f))).toEqual(offered);
    });

    it('a key this build has no career for: the bundled player, so still the same days', () => {
      const f = copy(SERVED); const i = f.days.length - 1;
      f.days[i] = 'ADDED_AFTER_THIS_BUILD';
      const s = keep(f);
      const d = dateOf(TRAIL_ANCHOR_DAY + i);
      expect(R.trailPlayerForDate(d, getTrailAnswer(d), s)).toBe(getTrailAnswer(d));
      expect(playable(s)).toEqual(offered);
    });

    it('nothing kept (the website): the same days', () => {
      expect(playable(memory())).toEqual(offered);
      expect(playable(null)).toEqual(offered);
    });
  });
});

describe('the saved day reads as it did', () => {
  it('biq_trail_<ymd>, normalised to { status, used }', () => {
    const d = new Date(2026, 10, 24, 12);
    const store = new Map();
    vi.stubGlobal('localStorage', { getItem: (k) => (store.has(k) ? store.get(k) : null) });
    try {
      expect(day.loadTrailDay(d)).toBeNull();
      store.set('biq_trail_2026-11-24', JSON.stringify({ status: 'won', attempts: [{ text: 'a' }, { skipped: true }] }));
      expect(day.loadTrailDay(d)).toEqual({ status: 'won', used: 2 });
      store.set('biq_trail_2026-11-24', JSON.stringify({ attempts: 'nope' }));
      expect(day.loadTrailDay(d)).toEqual({ status: null, used: 0 });
      store.set('biq_trail_2026-11-24', '{not json');
      expect(day.loadTrailDay(d)).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('the puzzle number counts from the anchor: #1 on the first day', () => {
    expect(day.getTrailNumber(dateOf(day.TRAIL_ANCHOR_DAY))).toBe(1);
    expect(day.getTrailNumber(dateOf(day.TRAIL_ANCHOR_DAY + 113))).toBe(114);
    expect(day.TRAIL_ANCHOR_DAY).toBe(20668);
  });
});

// App.jsx used to resolve the day's career and hand it to the screen. It hands
// over the day now, and DailyTransferTrail (in the lazy chunk) resolves the
// career. The first frame must be the one the screen drew when it was given
// the player: same markup, in every state a day can be saved in.
describe('the app\'s Trail route draws the frame it drew', () => {
  const { TRAIL_ANCHOR_DAY, TRAIL_ANSWER_LOG, getTrailAnswer } = trail;
  const store = new Map();
  const noop = () => {};
  let React, renderToStaticMarkup, Screen, Daily;
  beforeAll(async () => {
    vi.stubGlobal('localStorage', { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
    vi.stubGlobal('sessionStorage', { getItem: () => null, setItem() {}, removeItem() {} });
    vi.stubGlobal('navigator', { language: 'en-US', userAgent: 'Mozilla/5.0 (Macintosh)' });
    vi.stubGlobal('document', { documentElement: { lang: 'en', classList: { contains: () => false } } });
    await (await import('../../src/i18n/index.js')).initI18n();
    React = (await import('react')).default;
    ({ renderToStaticMarkup } = await import('react-dom/server'));
    const m = await import('../../src/screens/TransferTrail.jsx');
    Screen = m.default;
    Daily = m.DailyTransferTrail;
  });
  afterAll(() => { vi.unstubAllGlobals(); });

  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const skip = { text: '', skipped: true };
  const SAVED = (player) => [
    null,
    { status: 'playing', attempts: [{ text: 'Nobody Atall' }] },
    { status: 'playing', attempts: [skip, skip, { text: 'Nobody Atall' }] },
    { status: 'won', attempts: [skip, { text: player.display.join(' ') }] },
    { status: 'lost', attempts: [skip, skip, skip, skip, skip] },
  ];

  it('DailyTransferTrail with a day is TransferTrail with that day\'s player, markup for markup', () => {
    const N = TRAIL_ANSWER_LOG.length;
    let frames = 0;
    // The first day, around today, the last day of the log and the first of its second lap.
    for (const off of [0, 1, 112, 113, 114, N - 1, N]) {
      const date = dateOf(TRAIL_ANCHOR_DAY + off);
      const player = getTrailAnswer(date);
      expect(player.key).toBe(TRAIL_ANSWER_LOG[off % N]);
      for (const saved of SAVED(player)) {
        store.clear();
        if (saved) store.set(`biq_trail_${ymd(date)}`, JSON.stringify(saved));
        const before = renderToStaticMarkup(React.createElement(Screen, { player, date, onBack: noop, onReport: noop }));
        const after = renderToStaticMarkup(React.createElement(Daily, { date, onBack: noop, onReport: noop }));
        expect(after, `day ${off + 1}, ${saved ? saved.status : 'unopened'}`).toBe(before);
        // It is a real board: the first club of that career is on it.
        expect(after).toContain(player.clubs[0].replace(/&/g, '&amp;'));
        frames++;
      }
    }
    expect(frames).toBe(35);
  });

  it('a day before the first Trail draws nothing (App.jsx has already sent the player home)', () => {
    store.clear();
    expect(renderToStaticMarkup(React.createElement(Daily, { date: dateOf(TRAIL_ANCHOR_DAY - 1), onBack: noop, onReport: noop }))).toBe('');
  });
});
