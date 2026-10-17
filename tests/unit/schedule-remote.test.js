// The Transfer Trail log and the Mystery schedule fetched from the site by an
// installed app (lib/scheduleRemote.js). The Daily 7 door's tests
// (daily-remote.test.js), once for each log.
//
// What must never break without someone noticing:
//   - the file the site serves IS the log the app bundles, plus a version and
//     the served horizon the app bundles beside it; one generator run writes both
//   - a fetched file is used only if it agrees with the build's own copy on
//     every day the build knew as served, AND with the copy this build already
//     kept on every day that copy called served: a rollback cannot rewrite them
//   - a regenerated FUTURE is accepted: that is the whole point, so a phone
//     follows the website after the log is re-planned
//   - anything else (a broken file, a rollback, no network, full storage)
//     leaves the app on its bundled copy
//   - an entry this build cannot play falls back to the bundled one that day
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { TRAIL_ANSWER_LOG, TRAIL_ANCHOR_DAY, TRAIL_PLAYERS, getTrailAnswerForDayIndex } from '../../src/lib/trail.js';
import { MYSTERY_ANCHOR_DAY } from '../../src/lib/mysteryPlayer.js';
import MYSTERY_SCHEDULE from '../../src/data/mysterySchedule.json';
import SERVED_HORIZON from '../../src/data/scheduleServed.json';
import * as R from '../../src/lib/scheduleRemote.js';
import * as W from '../../src/lib/wordle.js';
import { FOOTLE_SERVED } from '../../src/data/footleServed.js';
import { planScheduleRemote, trailPublishedLength } from '../../scripts/lib/schedule-remote.mjs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const copy = (x) => JSON.parse(JSON.stringify(x));
const memory = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, _m: m }; };
const answers = (body, ok = true) => async () => ({ ok, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
const dateOf = (dayIndex) => { const d = new Date(dayIndex * 86400000); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12); };

const DOORS = [
  {
    name: 'trail', file: 'public/data/trail.json', url: 'https://balliq.app/data/trail.json',
    bundled: { anchor: TRAIL_ANCHOR_DAY, served: SERVED_HORIZON.trail, days: TRAIL_ANSWER_LOG },
    accept: R.acceptRemoteTrail, cached: R.cachedTrailLog, refresh: R.refreshTrailLog, asked: R.askedSiteForTrail,
    URL: R.TRAIL_REMOTE_URL, BUILD: R.TRAIL_BUILD,
    // A different entry this build can play, and malformed ones.
    other: (k) => TRAIL_PLAYERS.find((p) => p.key !== k).key,
    bad: ['', 'lower_case', '<script>', 7, null, 'X'.repeat(41)],
  },
  {
    name: 'mystery', file: 'public/data/mystery.json', url: 'https://balliq.app/data/mystery.json',
    bundled: { anchor: MYSTERY_ANCHOR_DAY, served: SERVED_HORIZON.mystery, days: MYSTERY_SCHEDULE },
    accept: R.acceptRemoteMystery, cached: R.cachedMysterySchedule, refresh: R.refreshMysterySchedule, asked: R.askedSiteForMystery,
    URL: R.MYSTERY_REMOTE_URL, BUILD: R.MYSTERY_BUILD,
    other: (id) => (id === MYSTERY_SCHEDULE[0] ? MYSTERY_SCHEDULE[1] : MYSTERY_SCHEDULE[0]),
    bad: ['', 'Q', 'Q0123', 'q615', '<script>', 615, null],
  },
  {
    // Footle's door lives in lib/wordle.js (Home reads the answer on its eager path).
    name: 'footle', file: 'public/data/footle.json', url: 'https://balliq.app/data/footle.json',
    bundled: { anchor: W.WORDLE_ANCHOR_DAY, served: SERVED_HORIZON.footle, days: W.WORDLE_ANSWER_LOG },
    accept: W.acceptRemoteFootle, cached: W.cachedFootleLog, refresh: W.refreshFootleLog, asked: W.askedSiteForFootle,
    URL: W.FOOTLE_REMOTE_URL, BUILD: W.FOOTLE_BUILD,
    other: (w) => W.WORDLE_ANSWER_POOL.find((x) => x !== w),
    bad: ['', 'ab', 'lower', 'O\'NEIL', '<script>', 'X'.repeat(13), 7, null],
  },
];

describe.each(DOORS)('$name: the file the site serves', (D) => {
  const SERVED = JSON.parse(read(D.file));
  it('is the bundled log with a version and the bundled served horizon, nothing else', () => {
    expect(SERVED).toEqual({ v: 1, anchor: D.bundled.anchor, served: D.bundled.served, days: D.bundled.days });
    expect(read(D.file)).toBe(JSON.stringify(SERVED) + '\n');
  });
  it('is served to an app on another origin', () => {
    const vercel = JSON.parse(read('vercel.json'));
    const rule = vercel.headers.find((h) => h.source === `/data/${D.name}.json`);
    expect(rule?.headers.find((h) => h.key === 'Access-Control-Allow-Origin')?.value).toBe('*');
    expect(rule?.headers.find((h) => h.key === 'Cache-Control')?.value).toBe('public, max-age=300');
    expect(D.URL).toBe(D.url);
  });
  it("passes the build's own checks", () => {
    expect(D.accept(SERVED)).not.toBeNull();
  });
});

describe.each(DOORS)('$name: accept', (D) => {
  const SERVED = JSON.parse(read(D.file));
  const regenerated = () => {
    const f = copy(SERVED); const i = f.days.length - 1;
    f.days[i] = D.other(f.days[i]);
    f.served = Math.min(f.days.length, f.served + 3);
    return f;
  };
  it('accepts a regenerated future', () => {
    expect(D.accept(regenerated())?.days.at(-1)).toBe(D.other(D.bundled.days.at(-1)));
  });
  it('accepts a longer log', () => {
    const f = copy(SERVED); f.days.push(f.days[0]);
    expect(D.accept(f)).not.toBeNull();
  });
  it('refuses a file that moves a day the build knew as served', () => {
    for (const i of [0, D.bundled.served - 1]) {
      const f = copy(SERVED); f.days[i] = D.other(f.days[i]);
      expect(D.accept(f), `day ${i}`).toBeNull();
    }
  });
  it('refuses a file that moves a day the KEPT copy called served (a rollback)', () => {
    const kept = D.accept(regenerated());
    const i = kept.served - 1;
    // the kept copy calls more days served than the bundle; the site rolls back
    const rolledBack = copy(SERVED);
    expect(D.accept(rolledBack)).not.toBeNull();       // fine against the bundle alone
    expect(D.accept(rolledBack, kept)).toBeNull();     // calls fewer days served than the kept copy
    const moved = copy(kept); moved.v = 1; moved.days = [...kept.days]; moved.days[i] = D.other(moved.days[i]);
    if (i >= D.bundled.served) expect(D.accept(moved)).not.toBeNull();
    expect(D.accept(moved, kept)).toBeNull();
    // shorter than the kept copy, though as long as the bundle
    const longKept = { ...kept, days: [...kept.days, kept.days[0]] };
    expect(D.accept({ ...copy(kept), v: 1 }, longKept)).toBeNull();
    expect(D.accept({ ...copy(kept), v: 1 }, kept)).not.toBeNull(); // the same file again is fine
  });
  it('refuses a wrong version, anchor, a shorter log or a smaller served count', () => {
    expect(D.accept({ ...copy(SERVED), v: 2 })).toBeNull();
    expect(D.accept({ ...copy(SERVED), anchor: SERVED.anchor + 1 })).toBeNull();
    expect(D.accept({ ...copy(SERVED), days: SERVED.days.slice(0, -1) })).toBeNull();
    expect(D.accept({ ...copy(SERVED), served: D.bundled.served - 1 })).toBeNull();
    expect(D.accept({ ...copy(SERVED), served: SERVED.days.length + 1 })).toBeNull();
    expect(D.accept({ ...copy(SERVED), served: '9' })).toBeNull();
  });
  it('refuses a malformed day', () => {
    for (const b of D.bad) {
      const r = copy(SERVED); r.days[r.days.length - 1] = b;
      expect(D.accept(r), JSON.stringify(b)).toBeNull();
    }
    expect(D.accept(null)).toBeNull();
    expect(D.accept('x')).toBeNull();
    expect(D.accept({ ...copy(SERVED), days: 'x' })).toBeNull();
  });
});

describe.each(DOORS)('$name: refresh and cached', (D) => {
  const SERVED_TEXT = read(D.file);
  const SERVED = JSON.parse(SERVED_TEXT);
  const regenerated = () => {
    const f = copy(SERVED); const i = f.days.length - 1;
    f.days[i] = D.other(f.days[i]);
    f.served = Math.min(f.days.length, f.served + 3);
    return f;
  };
  it('keeps a good file', async () => {
    const s = memory();
    expect(D.asked(s)).toBe(false);
    const file = regenerated();
    expect(await D.refresh({ fetchImpl: answers(file), storage: s })).toBe('updated');
    expect(D.asked(s)).toBe(true);
    expect(D.cached(s).days.at(-1)).toBe(file.days.at(-1));
  });
  it('asks the right address, without credentials and past the HTTP cache', async () => {
    let seen;
    await D.refresh({ fetchImpl: async (u, o) => { seen = { u, o }; return { ok: true, text: async () => SERVED_TEXT }; }, storage: memory() });
    expect(seen.u).toBe(D.url);
    expect(seen.o).toMatchObject({ cache: 'no-store', credentials: 'omit' });
  });
  it('does not ask again within three hours, then does', async () => {
    const s = memory(); const now = 1_800_000_000_000;
    let calls = 0; const f = async () => { calls++; return { ok: true, text: async () => SERVED_TEXT }; };
    expect(await D.refresh({ fetchImpl: f, storage: s, now })).toBe('updated');
    expect(await D.refresh({ fetchImpl: f, storage: s, now: now + 60_000 })).toBe('fresh');
    expect(await D.refresh({ fetchImpl: f, storage: s, now: now + 4 * 3600_000 })).toBe('same');
    expect(calls).toBe(2);
  });
  it('a rejected or failed answer leaves what was kept untouched', async () => {
    const s = memory();
    await D.refresh({ fetchImpl: answers(regenerated()), storage: s });
    const before = D.cached(s);
    const moved = copy(SERVED); moved.days[0] = D.other(moved.days[0]);
    expect(await D.refresh({ fetchImpl: answers(moved), storage: s, force: true })).toBe('rejected');
    // the site rolled back to the file before the regeneration
    expect(await D.refresh({ fetchImpl: answers(SERVED_TEXT), storage: s, force: true })).toBe('rejected');
    expect(await D.refresh({ fetchImpl: answers('not json'), storage: s, force: true })).toBe('rejected');
    expect(await D.refresh({ fetchImpl: answers('x'.repeat(300 * 1024)), storage: s, force: true })).toBe('rejected');
    expect(await D.refresh({ fetchImpl: answers('', false), storage: s, force: true })).toBe('failed');
    expect(await D.refresh({ fetchImpl: async () => { throw new Error('offline'); }, storage: s, force: true })).toBe('failed');
    expect(D.cached(s)).toEqual(before);
  });
  it('a file kept by another build is not used', () => {
    const s = memory({ [`biq_${D.name}_remote`]: SERVED_TEXT, [`biq_${D.name}_remote_for`]: 'some:other:build' });
    expect(D.cached(s)).toBeNull();
    s.setItem(`biq_${D.name}_remote_for`, D.BUILD);
    expect(D.cached(s)).not.toBeNull();
  });
  it('a kept file that no longer passes is not used', () => {
    const bad = copy(SERVED); bad.days[0] = D.other(bad.days[0]);
    const s = memory({ [`biq_${D.name}_remote`]: JSON.stringify(bad), [`biq_${D.name}_remote_for`]: D.BUILD });
    expect(D.cached(s)).toBeNull();
  });
  it('full storage never throws and never half-keeps', async () => {
    const s = memory(); s.setItem = () => { throw new Error('QuotaExceeded'); };
    expect(await D.refresh({ fetchImpl: answers(SERVED_TEXT), storage: s })).toBe('failed');
    expect(D.cached(s)).toBeNull();
  });
  it('no storage or no fetch is a failure, not a throw', async () => {
    expect(await D.refresh({ fetchImpl: answers(SERVED_TEXT), storage: null })).toBe('failed');
    expect(D.cached(null)).toBeNull();
  });
});

describe('the screens play from the kept copy, the bundle as fallback', () => {
  const keep = (name, file) => memory({ [`biq_${name}_remote`]: JSON.stringify(file), [`biq_${name}_remote_for`]: name === 'trail' ? R.TRAIL_BUILD : R.MYSTERY_BUILD });
  const SERVED_TRAIL = JSON.parse(read('public/data/trail.json'));
  const SERVED_MYSTERY = JSON.parse(read('public/data/mystery.json'));

  it('Trail: a re-planned future day plays the site\'s career; a served day reads the same', () => {
    const f = copy(SERVED_TRAIL); const i = f.days.length - 1;
    const other = TRAIL_PLAYERS.find((p) => p.key !== f.days[i]);
    f.days[i] = other.key;
    const s = keep('trail', f);
    const lastDay = TRAIL_ANCHOR_DAY + i;
    const bundled = getTrailAnswerForDayIndex(lastDay);
    expect(R.trailPlayerForDate(dateOf(lastDay), bundled, s).key).toBe(other.key);
    const servedDay = TRAIL_ANCHOR_DAY + 3;
    expect(R.trailPlayerForDate(dateOf(servedDay), getTrailAnswerForDayIndex(servedDay), s).key).toBe(TRAIL_ANSWER_LOG[3]);
  });
  it('Trail: a career this build does not have falls back to the bundled player', () => {
    const f = copy(SERVED_TRAIL); const i = f.days.length - 1;
    f.days[i] = 'ADDED_AFTER_THIS_BUILD';
    const s = keep('trail', f);
    const lastDay = TRAIL_ANCHOR_DAY + i;
    const bundled = getTrailAnswerForDayIndex(lastDay);
    expect(R.trailPlayerForDate(dateOf(lastDay), bundled, s)).toBe(bundled);
  });
  it('Trail: nothing kept (the website) is the bundled player, unchanged', () => {
    const day = TRAIL_ANCHOR_DAY + 10;
    const bundled = getTrailAnswerForDayIndex(day);
    expect(R.trailPlayerForDate(dateOf(day), bundled, memory())).toBe(bundled);
    expect(R.trailPlayerForDate(dateOf(day), bundled, null)).toBe(bundled);
  });
  it('Mystery: the site\'s id first, the bundled id after it when they differ', () => {
    const f = copy(SERVED_MYSTERY); const i = f.days.length - 1;
    f.days[i] = 'Q999999999';
    const s = keep('mystery', f);
    expect(R.mysteryAnswerIds(MYSTERY_ANCHOR_DAY + i, s)).toEqual(['Q999999999', MYSTERY_SCHEDULE[i]]);
    expect(R.mysteryAnswerIds(MYSTERY_ANCHOR_DAY + 3, s)).toEqual([MYSTERY_SCHEDULE[3]]);
  });
  it('Mystery: nothing kept (the website) is the bundled id, unchanged; no day, no id', () => {
    expect(R.mysteryAnswerIds(MYSTERY_ANCHOR_DAY + 5, memory())).toEqual([MYSTERY_SCHEDULE[5]]);
    expect(R.mysteryAnswerIds(MYSTERY_ANCHOR_DAY - 1, memory())).toEqual([]);
    expect(R.mysteryAnswerIds(MYSTERY_ANCHOR_DAY + MYSTERY_SCHEDULE.length, memory())).toEqual([]);
  });
});

describe('Footle plays from the kept copy, the bundle as fallback', () => {
  const SERVED_FOOTLE = JSON.parse(read('public/data/footle.json'));
  const keep = (file) => memory({ biq_footle_remote: JSON.stringify(file), biq_footle_remote_for: W.FOOTLE_BUILD });
  const last = SERVED_FOOTLE.days.length - 1;
  it('a re-planned future day plays the site\'s answer; a served day reads the same', () => {
    const f = copy(SERVED_FOOTLE); const other = W.WORDLE_ANSWER_POOL.find((x) => x !== f.days[last]);
    f.days[last] = other;
    const s = keep(f);
    expect(W.getWordleAnswerForDayIndex(W.WORDLE_ANCHOR_DAY + last, s)).toBe(other);
    expect(W.getWordleAnswerForDayIndex(W.WORDLE_ANCHOR_DAY + 3, s)).toBe(W.WORDLE_ANSWER_LOG[3]);
  });
  it('an answer this build cannot play (not in its word list) falls back to the bundled one', () => {
    const f = copy(SERVED_FOOTLE); f.days[last] = 'ZZZZZQX';
    expect(W.getWordleAnswerForDayIndex(W.WORDLE_ANCHOR_DAY + last, keep(f))).toBe(W.WORDLE_ANSWER_LOG[last]);
  });
  it('nothing kept (the website) is the bundled answer, unchanged, and past the log the stride still runs', () => {
    expect(W.getWordleAnswerForDayIndex(W.WORDLE_ANCHOR_DAY + 5, memory())).toBe(W.WORDLE_ANSWER_LOG[5]);
    const beyond = W.WORDLE_ANCHOR_DAY + W.WORDLE_ANSWER_LOG.length + 3;
    expect(W.getWordleAnswerForDayIndex(beyond, memory())).toBe(W.getWordleAnswerForDayIndex(beyond, null));
  });
  it('the answer a player already met wins over any schedule (stamped in the day record)', () => {
    const d = new Date(2026, 11, 28, 12);                     // a future day, beyond the served horizon
    const key = `biq_wordle_${d.getFullYear()}-${d.getMonth() + 1 < 10 ? '0' : ''}${d.getMonth() + 1}-${d.getDate()}`;
    const scheduled = W.getWordleAnswer(d, null);
    const met = W.WORDLE_ANSWER_POOL.find((x) => x !== scheduled);
    const s = memory({ [key]: JSON.stringify({ guesses: ['ABCDE'], status: 'won', answer: met }) });
    expect(W.footleAnswerFor(d, undefined, s)).toBe(met);
    s.setItem(key, JSON.stringify({ guesses: ['ABCDE'], status: 'won' }));        // an old record: no stamp
    expect(W.footleAnswerFor(d, undefined, s)).toBe(scheduled);
    s.setItem(key, JSON.stringify({ guesses: [], status: 'playing', answer: 'NOTAPLAYER' }));
    expect(W.footleAnswerFor(d, undefined, s)).toBe(scheduled);                   // a stamp it cannot play is ignored
    expect(W.footleAnswerFor(d, 'GIVEN', memory())).toBe('GIVEN');                // no record: the caller's fallback
  });
  it('the JS copy of the served horizon equals the JSON one', () => {
    expect(FOOTLE_SERVED).toBe(SERVED_HORIZON.footle);
  });
});

describe('the generator side (scripts/lib/schedule-remote.mjs)', () => {
  // (Not "a plan changes nothing": `served` follows the calendar, so a plan
  // made tomorrow records one more day. The equality above is the drift test.)
  it('the Trail horizon covers every day frozen in trail-schedule.test.js', () => {
    expect(SERVED_HORIZON.trail).toBeGreaterThanOrEqual(trailPublishedLength());
  });
  it('refuses, before writing anything, to move a day recorded as served', () => {
    const days = [...MYSTERY_SCHEDULE]; days[SERVED_HORIZON.mystery - 1] = 'Q1';
    expect(() => planScheduleRemote('mystery', { anchor: MYSTERY_ANCHOR_DAY, days })).toThrow(/refusing/);
    const trail = [...TRAIL_ANSWER_LOG]; trail[0] = 'HENRY';
    expect(() => planScheduleRemote('trail', { anchor: TRAIL_ANCHOR_DAY, days: trail })).toThrow(/refusing/);
    expect(() => planScheduleRemote('mystery', { anchor: MYSTERY_ANCHOR_DAY + 1, days: MYSTERY_SCHEDULE })).toThrow(/anchor/);
    expect(() => planScheduleRemote('mystery', { anchor: MYSTERY_ANCHOR_DAY, days: MYSTERY_SCHEDULE.slice(0, -1) })).toThrow(/shorter/);
  });
  it('refuses to move today or tomorrow even when the saved served count is days old (review, 17 Oct)', () => {
    const anchor = W.WORDLE_ANCHOR_DAY;
    const late = new Date((anchor + SERVED_HORIZON.footle + 6) * 86400000);   // a week after the count was saved
    const today = Math.floor(Date.UTC(late.getFullYear(), late.getMonth(), late.getDate()) / 86400000) - anchor;
    for (const i of [today, today + 1]) {
      const days = [...W.WORDLE_ANSWER_LOG]; days[i] = W.WORDLE_ANSWER_POOL.find((x) => x !== days[i]);
      expect(() => planScheduleRemote('footle', { anchor, days, now: late }), `day ${i}`).toThrow(/refusing/);
    }
    const days = [...W.WORDLE_ANSWER_LOG]; days[today + 2] = W.WORDLE_ANSWER_POOL.find((x) => x !== days[today + 2]);
    expect(() => planScheduleRemote('footle', { anchor, days, now: late })).not.toThrow();
  });
  it('accepts a re-planned future and never records fewer days as served', () => {
    const days = [...MYSTERY_SCHEDULE]; days[days.length - 1] = 'Q1';
    const plan = planScheduleRemote('mystery', { anchor: MYSTERY_ANCHOR_DAY, days });
    expect(plan.changed).toBe(true);
    expect(plan.served).toBeGreaterThanOrEqual(SERVED_HORIZON.mystery);
  });
});

describe('the sign-in merge keeps the stamps a remote record lacks (useAuth.jsx)', async () => {
  const { mergeWordleRecords } = await import('../../src/lib/wordleStatus.js');
  it('keeps a local answer and arc the remote copy does not carry; remote wins on everything else', () => {
    const local = { '2026-12-28': { guesses: ['MOYES'], status: 'won', answer: 'MOYES', arc: 1 }, '2026-12-27': { guesses: [], status: 'playing' } };
    const remote = { '2026-12-28': { guesses: ['MOYES'], status: 'won' }, '2026-12-26': { guesses: ['KANE'], status: 'lost' } };
    const m = mergeWordleRecords(local, remote);
    expect(m['2026-12-28']).toEqual({ guesses: ['MOYES'], status: 'won', answer: 'MOYES', arc: 1 });
    expect(m['2026-12-26']).toEqual(remote['2026-12-26']);
    expect(m['2026-12-27']).toEqual(local['2026-12-27']);
  });
  it('a local answer is not lent to a remote board with different guesses', () => {
    const m = mergeWordleRecords({ d: { guesses: ['MOYES'], status: 'won', answer: 'MOYES' } }, { d: { guesses: ['KANE', 'ERIKSEN'], status: 'won' } });
    expect(m.d.answer).toBeUndefined();
  });
  it('a stamp on the remote copy is kept as it is', () => {
    const m = mergeWordleRecords({ d: { guesses: ['A'], status: 'won', answer: 'OLD' } }, { d: { guesses: ['A'], status: 'won', answer: 'NEW' } });
    expect(m.d.answer).toBe('NEW');
  });
});
