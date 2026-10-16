// The Daily 7 log fetched from the site by an installed app (lib/dailyRemote.js).
//
// What must never break without someone noticing:
//   - the file the site serves IS the log the app bundles, plus a version;
//     both come out of one generator run
//   - a fetched file is used only if it agrees with the build's own copy on
//     every day the build knew as served: those days never move
//   - a regenerated FUTURE is accepted: that is the whole point, so a phone
//     follows the website after the log is rebuilt
//   - anything else (a broken file, a rollback, no network, full storage)
//     leaves the app on its bundled copy
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import DAILY_LOG from '../../src/data/dailyLog.js';
import { QB } from '../../src/questions.js';
import { pickDailyQuestions } from '../../src/lib/dailyDraw.js';
import { acceptRemoteDaily, cachedDailyLog, refreshDailyLog, askedSiteForDaily, DAILY_REMOTE_URL, DAILY_BUILD } from '../../src/lib/dailyRemote.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const SERVED_TEXT = read('public/data/daily7.json');
const SERVED = JSON.parse(SERVED_TEXT);
const copy = (x) => JSON.parse(JSON.stringify(x));
const memory = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, _m: m }; };
const answers = (body, ok = true) => async () => ({ ok, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
// The site's file after a later regeneration: one future day changed.
const regenerated = () => {
  const f = copy(SERVED);
  const i = f.days.length - 1;
  f.days[i] = [...f.days[i]].reverse();
  f.served = Math.min(f.days.length, f.served + 3);
  return f;
};

describe('the file the site serves', () => {
  it('is the bundled log with a version in front, nothing else', () => {
    const { v, ...rest } = SERVED;
    expect(v).toBe(1);
    expect(rest).toEqual(DAILY_LOG);
  });
  it('is served to an app on another origin', () => {
    const vercel = JSON.parse(read('vercel.json'));
    const rule = vercel.headers.find((h) => h.source === '/data/daily7.json');
    expect(rule?.headers.find((h) => h.key === 'Access-Control-Allow-Origin')?.value).toBe('*');
    expect(DAILY_REMOTE_URL).toBe('https://balliq.app/data/daily7.json');
  });
  it('passes the build\'s own checks', () => {
    expect(acceptRemoteDaily(SERVED)).not.toBeNull();
  });
});

describe('acceptRemoteDaily', () => {
  it('accepts a regenerated future', () => {
    expect(acceptRemoteDaily(regenerated())?.days.at(-1)).toEqual([...DAILY_LOG.days.at(-1)].reverse());
  });
  it('accepts a longer log', () => {
    const f = copy(SERVED); f.days.push(f.days[0].map((id) => `${id}x`));
    expect(acceptRemoteDaily(f)).not.toBeNull();
  });
  it('refuses a file that moves a day the build knew as served', () => {
    for (const i of [0, DAILY_LOG.served - 1]) {
      const f = copy(SERVED); f.days[i] = [...f.days[i]].reverse();
      expect(acceptRemoteDaily(f), `day ${i}`).toBeNull();
    }
  });
  it('refuses a wrong version, anchor, a shorter log or a smaller served count', () => {
    expect(acceptRemoteDaily({ ...copy(SERVED), v: 2 })).toBeNull();
    expect(acceptRemoteDaily({ ...copy(SERVED), anchor: SERVED.anchor + 1 })).toBeNull();
    expect(acceptRemoteDaily({ ...copy(SERVED), days: SERVED.days.slice(0, -1) })).toBeNull();
    expect(acceptRemoteDaily({ ...copy(SERVED), served: DAILY_LOG.served - 1 })).toBeNull();
    expect(acceptRemoteDaily({ ...copy(SERVED), served: SERVED.days.length + 1 })).toBeNull();
  });
  it('refuses a malformed day', () => {
    const bad = [
      (d) => d.slice(0, 6),
      (d) => [...d.slice(0, 6), d[0]],
      (d) => [...d.slice(0, 6), 7],
      (d) => [...d.slice(0, 6), '<script>'],
    ];
    for (const f of bad) {
      const r = copy(SERVED); const i = r.days.length - 1; r.days[i] = f(r.days[i]);
      expect(acceptRemoteDaily(r)).toBeNull();
    }
    expect(acceptRemoteDaily(null)).toBeNull();
    expect(acceptRemoteDaily('x')).toBeNull();
  });
});

describe('refreshDailyLog and cachedDailyLog', () => {
  it('keeps a good file and plays from it', async () => {
    const s = memory();
    expect(askedSiteForDaily(s)).toBe(false);
    const file = regenerated();
    expect(await refreshDailyLog({ fetchImpl: answers(file), storage: s })).toBe('updated');
    expect(askedSiteForDaily(s)).toBe(true);
    const log = cachedDailyLog(s);
    expect(log.days.at(-1)).toEqual(file.days.at(-1));
    const last = DAILY_LOG.anchor + DAILY_LOG.days.length - 1;
    expect(pickDailyQuestions(QB, last, log).map((q) => q.id)).toEqual(file.days.at(-1));
    // a served day reads the same from either copy
    expect(pickDailyQuestions(QB, DAILY_LOG.anchor + 3, log).map((q) => q.id)).toEqual(DAILY_LOG.days[3]);
  });
  it('does not ask again within three hours, then does', async () => {
    const s = memory(); const now = 1_800_000_000_000;
    let calls = 0; const f = async () => { calls++; return { ok: true, text: async () => SERVED_TEXT }; };
    expect(await refreshDailyLog({ fetchImpl: f, storage: s, now })).toBe('updated');
    expect(await refreshDailyLog({ fetchImpl: f, storage: s, now: now + 60_000 })).toBe('fresh');
    expect(await refreshDailyLog({ fetchImpl: f, storage: s, now: now + 4 * 3600_000 })).toBe('same');
    expect(calls).toBe(2);
  });
  it('a rejected or failed answer leaves what was kept untouched', async () => {
    const s = memory();
    await refreshDailyLog({ fetchImpl: answers(SERVED_TEXT), storage: s });
    const before = cachedDailyLog(s);
    const rollback = copy(SERVED); rollback.days[0] = [...rollback.days[0]].reverse();
    expect(await refreshDailyLog({ fetchImpl: answers(rollback), storage: s, force: true })).toBe('rejected');
    expect(await refreshDailyLog({ fetchImpl: answers('not json'), storage: s, force: true })).toBe('rejected');
    expect(await refreshDailyLog({ fetchImpl: answers('', false), storage: s, force: true })).toBe('failed');
    expect(await refreshDailyLog({ fetchImpl: async () => { throw new Error('offline'); }, storage: s, force: true })).toBe('failed');
    expect(cachedDailyLog(s)).toEqual(before);
  });
  it('a file kept by another build is not used', () => {
    const s = memory({ biq_daily7_remote: SERVED_TEXT, biq_daily7_remote_for: 'some:other:build' });
    expect(cachedDailyLog(s)).toBeNull();
    s.setItem('biq_daily7_remote_for', DAILY_BUILD);
    expect(cachedDailyLog(s)).not.toBeNull();
  });
  it('full storage never throws and never half-keeps', async () => {
    const s = memory(); s.setItem = () => { throw new Error('QuotaExceeded'); };
    expect(await refreshDailyLog({ fetchImpl: answers(SERVED_TEXT), storage: s })).toBe('failed');
    expect(cachedDailyLog(s)).toBeNull();
  });
});
