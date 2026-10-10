// Top 10 lists fetched from the site by an installed app (lib/top10Remote.js).
//
// What must never break without someone noticing:
//   - the file the site serves IS the file the app bundles, plus a version and
//     the anchor; both come out of one generator run
//   - a fetched file is used only if it begins with the build's own schedule:
//     the schedule is append-only and two players must never be on different
//     lists on the same day
//   - anything else (a broken file, a rollback, no network, full storage)
//     leaves the app exactly as it was, on its bundled copy
//   - only an installed app fetches; the website never does
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { TOP10_ANCHOR_DAY, TOP10_DAYS, TOP10_LOG_HASH } from '../../src/data/top10Meta.js';
import { logHash } from '../../src/lib/top10Hash.js';
import { isTop10Live, top10Days, TOP10_DAYS_KEY, getTop10Id } from '../../src/lib/top10.js';
import { acceptRemote, cachedTop10, pickTop10Data, refreshTop10, TOP10_REMOTE_URL } from '../../src/lib/top10Remote.js';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const BUNDLED = JSON.parse(read('src/data/top10Lists.json'));
const SERVED_TEXT = read('public/data/top10.json');
const SERVED = JSON.parse(SERVED_TEXT);
const copy = (x) => JSON.parse(JSON.stringify(x));
// The site's file with more days on the end: tomorrow's deploy, as an old build
// sees it. The extra lists are made here (copies of real ones under new ids),
// so scheduling or deleting a real list can never break these tests.
const EXTRA = ['test-extra-one', 'test-extra-two'];
const longer = (extra = EXTRA) => {
  const f = copy(SERVED);
  const model = [f.lists[f.log[0]], f.lists[f.log[1]]];
  extra.forEach((id, i) => { if (!f.lists[id] && EXTRA.includes(id)) f.lists[id] = { ...copy(model[i % 2]), id }; });
  f.log = [...f.log, ...extra];
  return f;
};
const memory = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, _m: m }; };
const answers = (body, ok = true) => async () => ({ ok, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
const withStorage = (s, fn) => { const had = globalThis.localStorage; globalThis.localStorage = s; try { return fn(); } finally { if (had === undefined) delete globalThis.localStorage; else globalThis.localStorage = had; } };

describe('the file the site serves', () => {
  it('is the bundled lists with a version and the anchor in front, nothing else', () => {
    const { v, anchor, ...rest } = SERVED;
    expect(v).toBe(1);
    expect(anchor).toBe(TOP10_ANCHOR_DAY);
    expect(rest).toEqual(BUNDLED);
  });
  it('carries only lists that passed the independent check', () => {
    for (const l of Object.values(SERVED.lists)) expect(l.checked, l.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('the build knows its own schedule by length and hash', () => {
    expect(TOP10_DAYS).toBe(BUNDLED.log.length);
    expect(TOP10_LOG_HASH).toBe(logHash(BUNDLED.log));
    expect(logHash(['a', 'b'])).not.toBe(logHash(['b', 'a']));
    expect(logHash(['ab', 'c'])).not.toBe(logHash(['a', 'bc']));
  });
  it('is served so an installed app can read it: any origin, and not cached for long', () => {
    const rule = JSON.parse(read('vercel.json')).headers.find((h) => h.source === '/data/top10.json');
    const h = Object.fromEntries(rule.headers.map((x) => [x.key, x.value]));
    expect(h['Access-Control-Allow-Origin']).toBe('*');
    expect(h['Cache-Control']).toBe('public, max-age=300');
    expect(TOP10_REMOTE_URL).toBe('https://balliq.app/data/top10.json');
  });
  it('the build check fails if the served file falls behind the bundled one', () => {
    const gen = read('scripts/gen-top10.mjs');
    expect(gen).toMatch(/remoteOnDisk !== remote/);
    expect(gen).toMatch(/writeFileSync\(REMOTE, remote\)/);
    // unchecked lists (--all) are never written to the served file
    expect(gen).toMatch(/if \(!args\.has\('--all'\)\) \{[\s\S]*writeFileSync\(REMOTE, remote\);\s*\}/);
    // and a day already served cannot be moved without saying so
    expect(gen).toMatch(/!args\.has\('--reschedule'\) && !served\.every\(\(id, i\) => TOP10_LOG\[i\] === id\)/);
  });
});

describe('what is accepted', () => {
  it('the site’s own file, and the same file with days added', () => {
    expect(acceptRemote(copy(SERVED)).log).toEqual(BUNDLED.log);
    expect(acceptRemote(longer()).log.length).toBe(TOP10_DAYS + 2);
  });
  it('a list corrected in place is accepted: the ids are what the hash covers', () => {
    const fixed = copy(SERVED); fixed.lists[fixed.log[0]].slots[0].clue = '261 goals';
    expect(acceptRemote(fixed).lists[fixed.log[0]].slots[0].clue).toBe('261 goals');
  });
  it('a schedule that does not begin with the build’s own is refused', () => {
    const swapped = longer(); [swapped.log[0], swapped.log[1]] = [swapped.log[1], swapped.log[0]];
    expect(acceptRemote(swapped)).toBe(null);
    const shorter = copy(SERVED); shorter.log = shorter.log.slice(0, TOP10_DAYS - 1);
    expect(acceptRemote(shorter)).toBe(null);
    const replaced = longer(); replaced.log[TOP10_DAYS - 1] = 'test-extra-one'; replaced.log.pop(); replaced.log.pop();
    expect(acceptRemote(replaced)).toBe(null);
  });
  it('another anchor day, another version, or a day scheduled twice is refused', () => {
    expect(acceptRemote({ ...copy(SERVED), anchor: TOP10_ANCHOR_DAY + 1 })).toBe(null);
    expect(acceptRemote({ ...copy(SERVED), v: 2 })).toBe(null);
    expect(acceptRemote(longer([SERVED.log[0]]))).toBe(null);
  });
  it('a scheduled day with no list, or a list that is not ten good slots, is refused', () => {
    expect(acceptRemote(longer(['no-such-list']))).toBe(null);
    const nine = copy(SERVED); nine.lists[nine.log[3]].slots.pop();
    expect(acceptRemote(nine)).toBe(null);
    const noKey = copy(SERVED); delete noKey.lists[noKey.log[3]].slots[2].key;
    expect(acceptRemote(noKey)).toBe(null);
    const twice = copy(SERVED); twice.lists[twice.log[3]].slots[2].key = twice.lists[twice.log[3]].slots[1].key;
    expect(acceptRemote(twice)).toBe(null);
    const kind = copy(SERVED); kind.lists[kind.log[3]].kind = 'stadium';
    expect(acceptRemote(kind)).toBe(null);
    const renamed = copy(SERVED); renamed.lists[renamed.log[3]].id = 'something-else';
    expect(acceptRemote(renamed)).toBe(null);
  });
  // A file that passes replaces the bundled copy, and a crash while drawing is
  // not something the app falls back from: each of these would have crashed
  // the board or left an answer that could not be typed.
  it('a field the screen draws, of the wrong type, is refused', () => {
    const id = SERVED.log[3];
    const club = SERVED.log.find((x) => SERVED.lists[x].kind === 'club'), cl = (f) => f.lists[club];
    const cases = {
      'a scheduled id that is only an inherited name': (f) => { f.log.push('constructor'); },
      'a clue that is not text': (f) => { f.lists[id].slots[0].clue = { n: 260 }; },
      'a clue label that is not text': (f) => { f.lists[id].clueLabel = 7; },
      'a note that is not text': (f) => { f.lists[id].note = ['x']; },
      'a near miss with no note': (f) => { delete f.lists[id].near[0].note; },
      'a second accepted name that is another slot’s own': (f) => { f.lists[id].slots[0].also = [f.lists[id].slots[1].key]; },
      'an `also` that is not a list': (f) => { f.lists[id].slots[0].also = 'x'; },
      'a pool entry whose other names are not a list': (f) => { f.pools.club[0].aka = 'Spurs'; },
      'a pool entry with no name': (f) => { delete f.pools.nation[0].name; },
      'an extra player with no key': (f) => { f.extras.push({ name: 'Nobody' }); },
      'a club answer that is in no pool, so it could never be typed': (f) => { cl(f).slots[0].key = 'no such club'; },
      'a club near miss that is in no pool': (f) => { cl(f).near[0].key = 'no such club'; },
      'a list that is not an object': (f) => { f.lists[id] = 'x'; },
    };
    for (const [what, breakIt] of Object.entries(cases)) { const f = longer(); breakIt(f); expect(acceptRemote(f), what).toBe(null); }
    expect(acceptRemote(longer())).not.toBe(null); // and the unbroken file passes
  });
  it('a schedule longer than a build could ever need is refused', () => {
    const f = longer();
    for (let i = 0; i < 1001; i++) { const id = `filler-${i}`; f.lists[id] = { ...copy(f.lists[f.log[0]]), id }; f.log.push(id); }
    expect(acceptRemote(f)).toBe(null);
  });

  it('anything that is not the file at all is refused', () => {
    for (const bad of [null, undefined, 7, 'x', [], {}, { v: 1 }, { ...copy(SERVED), lists: [] }, { ...copy(SERVED), pools: null }, { ...copy(SERVED), log: 'premier-league-goals' }]) expect(acceptRemote(bad)).toBe(null);
  });
});

describe('fetching', () => {
  it('a good longer file is kept, and the device then knows the schedule is longer', async () => {
    const s = memory(), body = longer();
    expect(await refreshTop10({ fetchImpl: answers(body), storage: s, now: 1e12 })).toBe('updated');
    expect(cachedTop10(s).log.length).toBe(TOP10_DAYS + 2);
    withStorage(s, () => {
      expect(top10Days()).toBe(TOP10_DAYS + 2);
      const dayAfter = new Date(2026, 9, 12 + TOP10_DAYS); // the first day past the build's own schedule
      expect(isTop10Live(dayAfter)).toBe(true);
      expect(isTop10Live(dayAfter, TOP10_DAYS)).toBe(false);
      expect(getTop10Id(dayAfter, cachedTop10(s).log)).toBe('test-extra-one');
    });
  });
  it('asks the site’s address, without cookies, without the cache', async () => {
    let seen; const s = memory();
    await refreshTop10({ fetchImpl: async (url, opts) => { seen = [url, opts]; return { ok: true, text: async () => SERVED_TEXT }; }, storage: s });
    expect(seen[0]).toBe(TOP10_REMOTE_URL);
    expect(seen[1]).toMatchObject({ cache: 'no-store', credentials: 'omit' });
  });
  it('does not ask again within three hours, unless told to', async () => {
    const s = memory(); let calls = 0;
    const f = async () => { calls++; return { ok: true, text: async () => SERVED_TEXT }; };
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 })).toBe('updated');
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 + 60_000 })).toBe('fresh');
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 + 60_000, force: true })).toBe('same');
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 + 4 * 3600_000 })).toBe('same');
    expect(calls).toBe(3);
    // a clock set back does not lock the app out of ever asking again
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 - 5 * 3600_000 })).toBe('same');
  });
  it('a file that fails the checks changes nothing: the last good one stays', async () => {
    const s = memory();
    await refreshTop10({ fetchImpl: answers(longer()), storage: s, now: 1e12 });
    const kept = s.getItem('biq_top10_remote'), note = s.getItem(TOP10_DAYS_KEY);
    const rolledBack = longer(); [rolledBack.log[0], rolledBack.log[1]] = [rolledBack.log[1], rolledBack.log[0]];
    const huge = JSON.stringify({ ...longer(), padding: 'x'.repeat(1024 * 1024) }); // a good file, too big
    expect(acceptRemote(JSON.parse(huge))).not.toBe(null);
    for (const bad of [rolledBack, 'not json at all', '', { v: 1 }, huge]) {
      expect(await refreshTop10({ fetchImpl: answers(bad), storage: s, now: 2e12, force: true })).toBe('rejected');
      expect(s.getItem('biq_top10_remote')).toBe(kept);
      expect(s.getItem(TOP10_DAYS_KEY)).toBe(note);
    }
  });
  it('after an update, what the older build kept is not used, and this build asks at once', async () => {
    const s = memory(); let calls = 0;
    const f = async () => { calls++; return { ok: true, text: async () => JSON.stringify(longer()) }; };
    await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 });
    // an "update": the same storage, but stamped by a different build
    s.setItem('biq_top10_remote_for', 'another:build');
    s.setItem('biq_top10_remote_at', `another:build|${1e12}`);
    s.setItem(TOP10_DAYS_KEY, JSON.stringify({ d: 40, n: TOP10_DAYS - 6, h: 'deadbeef', a: TOP10_ANCHOR_DAY }));
    expect(cachedTop10(s)).toBe(null);
    withStorage(s, () => expect(top10Days()).toBe(TOP10_DAYS));
    // one minute later: inside the three hours, but this build has never asked
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 + 60_000 })).toBe('updated');
    expect(calls).toBe(2);
    expect(cachedTop10(s).log.length).toBe(TOP10_DAYS + 2);
    withStorage(s, () => expect(top10Days()).toBe(TOP10_DAYS + 2)); // Home and the screen agree again
  });
  it('a note that has gone missing is put back even when the file itself has not changed', async () => {
    const s = memory(), f = answers(longer());
    await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 });
    s.removeItem(TOP10_DAYS_KEY);
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12, force: true })).toBe('updated');
    withStorage(s, () => expect(top10Days()).toBe(TOP10_DAYS + 2));
  });
  it('a build that can no longer read the site’s file does not download it at every open', async () => {
    const s = memory(); let calls = 0;
    const f = async () => { calls++; return { ok: true, text: async () => '{"v":2}' }; };
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 })).toBe('rejected');
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 + 1000 })).toBe('fresh');
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 + 2 * 3600_000 })).toBe('fresh');
    expect(calls).toBe(1);
    expect(await refreshTop10({ fetchImpl: f, storage: s, now: 1e12 + 4 * 3600_000 })).toBe('rejected');
    expect(calls).toBe(2);
    // and a bad answer never costs a good file already kept
    const s2 = memory();
    await refreshTop10({ fetchImpl: answers(longer()), storage: s2, now: 2e12 });
    expect(await refreshTop10({ fetchImpl: f, storage: s2, now: 2e12 + 4 * 3600_000 })).toBe('rejected');
    expect(cachedTop10(s2).log.length).toBe(TOP10_DAYS + 2);
  });
  it('two calls at once make one request', async () => {
    const had = globalThis.fetch, s = memory(); let calls = 0, release;
    globalThis.fetch = () => { calls++; return new Promise((ok) => { release = () => ok({ ok: true, text: async () => SERVED_TEXT }); }); };
    try {
      const a = refreshTop10({ storage: s }), b = refreshTop10({ storage: s });
      await Promise.resolve(); release();
      expect(await a).toBe('updated');
      expect(await b).toBe('updated');
      expect(calls).toBe(1);
    } finally { globalThis.fetch = had; }
  });

  it('no network, a server error or a fetch that throws is "failed" and changes nothing', async () => {
    const s = memory();
    expect(await refreshTop10({ fetchImpl: answers(SERVED, false), storage: s })).toBe('failed');
    expect(await refreshTop10({ fetchImpl: async () => { throw new Error('offline'); }, storage: s })).toBe('failed');
    expect(await refreshTop10({ fetchImpl: answers(SERVED), storage: null })).toBe('failed');
    expect(s._m.size).toBe(0);
    // and a fetch that never answers is given up on
    const never = (url, opts) => new Promise((_, no) => opts.signal.addEventListener('abort', () => no(new Error('aborted'))));
    expect(await refreshTop10({ fetchImpl: never, storage: s, timeoutMs: 20 })).toBe('failed');
  });
  it('storage that fills up half way does not leave Home promising a day the screen has no list for', async () => {
    const s = memory();
    const full = { ...s, setItem: (k, v) => { if (k === 'biq_top10_remote') throw new Error('QuotaExceededError'); s.setItem(k, v); } };
    expect(await refreshTop10({ fetchImpl: answers(longer()), storage: full, now: 1e12 })).toBe('failed');
    expect(s.getItem(TOP10_DAYS_KEY)).toBe(null);
    withStorage(s, () => expect(top10Days()).toBe(TOP10_DAYS));
  });
});

describe('what the device believes', () => {
  it('with nothing kept, the build’s own length', () => {
    expect(top10Days()).toBe(TOP10_DAYS);            // no storage at all (node)
    withStorage(memory(), () => expect(top10Days()).toBe(TOP10_DAYS));
  });
  it('a note left by another build, or tampered with, is ignored', () => {
    const good = { d: TOP10_DAYS + 5, n: TOP10_DAYS, h: TOP10_LOG_HASH, a: TOP10_ANCHOR_DAY };
    const believe = (note) => withStorage(memory({ [TOP10_DAYS_KEY]: typeof note === 'string' ? note : JSON.stringify(note) }), () => top10Days());
    expect(believe(good)).toBe(TOP10_DAYS + 5);
    expect(believe({ ...good, n: TOP10_DAYS - 6 })).toBe(TOP10_DAYS);   // written by an older build
    expect(believe({ ...good, h: 'deadbeef' })).toBe(TOP10_DAYS);
    expect(believe({ ...good, a: TOP10_ANCHOR_DAY - 1 })).toBe(TOP10_DAYS);
    expect(believe({ ...good, d: TOP10_DAYS - 3 })).toBe(TOP10_DAYS);   // never shorter than the build
    expect(believe({ ...good, d: 99999 })).toBe(TOP10_DAYS);
    expect(believe({ ...good, d: '25' })).toBe(TOP10_DAYS);
    expect(believe('garbage')).toBe(TOP10_DAYS);
  });
  it('a kept file that no longer passes for this build is not used', () => {
    const stale = longer(); [stale.log[0], stale.log[1]] = [stale.log[1], stale.log[0]];
    const stamp = `${TOP10_ANCHOR_DAY}:${TOP10_DAYS}:${TOP10_LOG_HASH}`;
    expect(cachedTop10(memory({ biq_top10_remote: JSON.stringify(longer()), biq_top10_remote_for: stamp })).log.length).toBe(TOP10_DAYS + 2);
    expect(cachedTop10(memory({ biq_top10_remote: JSON.stringify(stale), biq_top10_remote_for: stamp }))).toBe(null);
    expect(cachedTop10(memory({ biq_top10_remote: '{{{', biq_top10_remote_for: stamp }))).toBe(null);
    // a good file that ANOTHER build fetched is not used: this build has not asked the site itself yet
    expect(cachedTop10(memory({ biq_top10_remote: JSON.stringify(longer()), biq_top10_remote_for: `${TOP10_ANCHOR_DAY}:${TOP10_DAYS - 6}:deadbeef` }))).toBe(null);
    expect(cachedTop10(memory({ biq_top10_remote: JSON.stringify(longer()) }))).toBe(null);
    expect(cachedTop10(memory())).toBe(null);
    expect(cachedTop10(null)).toBe(null);
  });
  it('the screen plays the kept file when it continues the bundled one, otherwise the bundled one', () => {
    const more = acceptRemote(longer());
    expect(pickTop10Data(BUNDLED, more)).toBe(more);
    expect(pickTop10Data(BUNDLED, null)).toBe(BUNDLED);
    const other = { ...more, log: [...more.log] }; other.log[2] = more.log[TOP10_DAYS];
    expect(pickTop10Data(BUNDLED, other)).toBe(BUNDLED);
  });
});

describe('who fetches, and when', () => {
  const app = read('src/App.jsx'), screen = read('src/screens/Top10.jsx');
  it('only an installed app asks, a moment after start and when it comes back to the front', () => {
    const at = app.indexOf("import('./lib/top10Remote.js')");
    expect(at).toBeGreaterThan(0);
    const effect = app.slice(app.lastIndexOf('useEffect(() => {', at), at);
    expect(effect).toMatch(/if \(!IS_NATIVE\) return undefined;/);
    expect(app).toMatch(/top10Tick=\{top10Tick\}/);
  });
  it('the fetch module is loaded on demand, never with Home', () => {
    expect(app).not.toMatch(/from ['"]\.\/lib\/top10Remote\.js['"]/);
    expect(read('src/screens/HomeScreen.jsx')).not.toMatch(/top10Remote/);
    expect(read('src/lib/top10.js')).not.toMatch(/top10Remote\.js['"]/);
  });
  it('the website never even loads the fetching code: on the web the screen makes the one import it always did', () => {
    expect(screen).toMatch(/native \? import\("\.\.\/lib\/top10Remote\.js"\)\.catch\(\(\) => null\) : null/);
    expect((screen.match(/import\("\.\.\/lib\/top10Remote\.js"\)/g) || []).length).toBe(1); // that conditional one, and no other
    expect(screen).toMatch(/native = !!window\.Capacitor\?\.isNativePlatform\?\.\(\)/);
  });
  it('an installed app fetches before saying there is no list, and tells Home when that changed something', () => {
    expect(screen).toMatch(/if \(remote && missing\) \{/);
    expect(screen).toMatch(/pickTop10Data\(bundled, remote\.cachedTop10\(\)\)/);
    expect(screen).toMatch(/new Event\("biq:top10-updated"\)/);
    expect(app).toMatch(/addEventListener\('biq:top10-updated', bump\)/);
  });
  it('a list asked for by a name the lists object only inherits is "no such list"', () => {
    expect(screen).toMatch(/Object\.hasOwn\(data\.lists, wanted\) \? data\.lists\[wanted\] : null/);
  });
  it('the widget, the next-up rows and the history tab follow Home when the schedule grows', () => {
    expect(app).toMatch(/\[dailyDone, loginStreak, top10Tick\]/);
    expect(app).toMatch(/stats\?\.gamesPlayed, xp, top10Tick\]/);
    expect(app).toMatch(/key=\{`daily-\$\{top10Tick\}`/);
  });
  it('a fetched list’s answers can all be typed, even one this build’s pool does not hold', () => {
    expect(screen).toMatch(/for \(const e of \[\.\.\.list\.slots, \.\.\.\(list\.near \|\| \[\]\)\]\) if \(!have\.has\(e\.key\)\)/);
  });
});
