// Top 10: lists that reach an installed app without a new build.
//
// THE PROBLEM. A native build carries the schedule it was built with
// (top10Lists.json). When that runs out the game goes quiet on that phone
// until the owner updates, while the website, which is rebuilt on every push,
// carries on. Build 144 was made with thirteen days in it.
//
// THE CURE. The website serves the same file the app bundles
// (/data/top10.json, written by scripts/gen-top10.mjs in the same run, so the
// two cannot differ). An installed app fetches it, checks it, keeps it, and
// uses it in place of its own copy. The bundled copy is always the fallback:
// offline, a failed fetch or a file that does not pass the checks all leave
// the app exactly as it was.
//
// WHAT IS CHECKED, and why each matters:
//   - the shape, list by list (ten slots, a kind the guess box knows): a
//     broken file must never reach the board
//   - the anchor day: the same day must be Top 10 #1 for everyone
//   - ⚠️ THE FETCHED SCHEDULE MUST BEGIN WITH THE BUILD'S OWN. The schedule is
//     append-only (scripts/top10/specs.mjs). A file whose first days differ
//     from the ones this build shipped with is a rollback or a mistake, and
//     using it would have two players on the same day arguing about different
//     lists. Recognised by a hash of the build's own days (top10Meta.js), so
//     Home can trust the cached LENGTH without loading the lists.
//
// A list may still be CORRECTED in place (a wrong number in a clue): its id
// does not change, so the hash does not, and the fix reaches installed apps
// the same day.
//
// Only an installed app fetches. The website already has the newest file in
// its own bundle, so it never asks for this one.
import { TOP10_ANCHOR_DAY, TOP10_DAYS, TOP10_LOG_HASH } from '../data/top10Meta.js';
import { logHash } from './top10Hash.js';
import { TOP10_SIZE, TOP10_DAYS_KEY } from './top10.js';

export const TOP10_REMOTE_URL = 'https://balliq.app/data/top10.json';
const KEY = 'biq_top10_remote';        // the fetched file, as text
const FOR_KEY = 'biq_top10_remote_for'; // which build fetched and checked it
const AT_KEY = 'biq_top10_remote_at';  // which build last asked the site, and when
const FRESH_MS = 3 * 60 * 60 * 1000;   // do not ask again within three hours
// The real file is under 100 KB at 39 lists. It is also kept in localStorage,
// so it cannot grow without limit: at about 500 lists this ceiling is reached
// and the lists will need splitting by month before then.
const MAX_BYTES = 1024 * 1024;
const MAX_EXTRA_DAYS = 1000;
const KINDS = new Set(['player', 'club', 'nation']);
// This build, as far as the schedule goes. Everything kept is stamped with it.
const BUILD = `${TOP10_ANCHOR_DAY}:${TOP10_DAYS}:${TOP10_LOG_HASH}`;

const isStr = (x) => typeof x === 'string' && x.length > 0;
const strOrAbsent = (x) => x == null || typeof x === 'string';
const strList = (x) => Array.isArray(x) && x.every(isStr);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

// The fetched object if every part of it can be trusted, otherwise null.
// ⚠️ A file that passes REPLACES the bundled copy, days the build covers
// included, and a crash while drawing is not something the app falls back
// from. So every field the screen reads is checked for the type it is read as,
// not only the ones that decide which list is played.
export function acceptRemote(r) {
  try {
    if (!r || typeof r !== 'object' || r.v !== 1 || r.anchor !== TOP10_ANCHOR_DAY) return null;
    const { log, lists, pools, extras } = r;
    if (!Array.isArray(log) || log.length < TOP10_DAYS || log.length > TOP10_DAYS + MAX_EXTRA_DAYS) return null;
    if (!log.every(isStr) || new Set(log).size !== log.length) return null;
    if (logHash(log.slice(0, TOP10_DAYS)) !== TOP10_LOG_HASH) return null;
    if (!lists || typeof lists !== 'object' || Array.isArray(lists)) return null;
    if (!pools || typeof pools !== 'object' || !Array.isArray(extras || [])) return null;
    const inPool = {};
    for (const kind of ['club', 'nation']) {
      if (!Array.isArray(pools[kind])) return null;
      inPool[kind] = new Set();
      for (const e of pools[kind]) {
        if (!e || !isStr(e.key) || !isStr(e.name) || (e.aka != null && !strList(e.aka)) || (e.w != null && typeof e.w !== 'number')) return null;
        inPool[kind].add(e.key);
      }
    }
    for (const e of extras || []) if (!e || !isStr(e.key) || !isStr(e.name)) return null;
    for (const id of Object.keys(lists)) {
      const l = lists[id];
      if (!l || typeof l !== 'object' || l.id !== id || !KINDS.has(l.kind) || !isStr(l.title) || !isStr(l.asOf)) return null;
      if (!strOrAbsent(l.clueLabel) || !strOrAbsent(l.note)) return null;
      if (!Array.isArray(l.slots) || l.slots.length !== TOP10_SIZE || !Array.isArray(l.near || [])) return null;
      const keys = new Set();
      for (const s of l.slots) {
        if (!s || !isStr(s.key) || !isStr(s.name) || !strOrAbsent(s.clue) || (s.also != null && !strList(s.also))) return null;
        if (keys.has(s.key)) return null;
        keys.add(s.key);
      }
      for (const n of l.near || []) {
        if (!n || !isStr(n.key) || !isStr(n.name) || !isStr(n.note) || keys.has(n.key)) return null;
        keys.add(n.key);
      }
      // a second accepted name for a slot must not be another slot's own name
      for (const s of l.slots) for (const k of s.also || []) { if (keys.has(k)) return null; }
      // a club or a nation can only be picked from the pool the file brings, so
      // every answer has to be in it (players come from the app's own pool,
      // and the screen adds any the pool lacks)
      if (l.kind !== 'player') {
        for (const k of keys) if (!inPool[l.kind].has(k)) return null;
        for (const s of l.slots) for (const k of s.also || []) if (!inPool[l.kind].has(k)) return null;
      }
    }
    // every scheduled day has its list (its OWN list: "constructor" is not one)
    if (!log.every((id) => has(lists, id))) return null;
    return { log, lists, pools, extras: extras || [] };
  } catch { return null; }
}

const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };

// The last fetched file, if THIS build fetched it and it still passes.
// A file kept by an earlier build is not used after an update, even though it
// would pass: the new build may carry a corrected list that the old file does
// not, and until this build has asked the site itself it cannot know which is
// newer. The next fetch (which an update forces) puts it right.
export function cachedTop10(storage = store()) {
  try {
    if (!storage || storage.getItem(FOR_KEY) !== BUILD) return null;
    return acceptRemote(JSON.parse(storage.getItem(KEY) || 'null'));
  } catch { return null; }
}

// What the game screen should play from: the fetched file when there is a good
// one, otherwise the copy the build carries. `bundled` is the build's own
// top10Lists.json, which is checked against in full here (the hash stood in
// for it while it was not loaded).
export function pickTop10Data(bundled, remote) {
  if (!remote || !bundled) return bundled;
  for (let i = 0; i < bundled.log.length; i++) if (remote.log[i] !== bundled.log[i]) return bundled;
  return remote;
}

// The small note Home reads to know how long the schedule now is, without
// parsing the lists (top10Days in top10.js). It names the build's own
// schedule, so a note written by an older build is ignored after an update.
const daysNote = (days) => JSON.stringify({ d: days, n: TOP10_DAYS, h: TOP10_LOG_HASH, a: TOP10_ANCHOR_DAY });

/**
 * Ask the site for its lists and keep them if they pass. Never throws.
 * Returns 'updated' (something this device believes has changed: draw again),
 * 'same' (asked, nothing new), 'fresh' (asked recently, did not ask again),
 * 'rejected' (fetched, failed the checks; what was kept is untouched) or
 * 'failed' (no answer).
 * Two calls at once share one request.
 */
let inFlight = null;
export function refreshTop10(opts = {}) {
  if (inFlight && !opts.fetchImpl) return inFlight;
  const run = refresh(opts);
  if (!opts.fetchImpl) { inFlight = run; run.finally(() => { if (inFlight === run) inFlight = null; }); }
  return run;
}
async function refresh({ fetchImpl, storage = store(), now = Date.now(), force = false, timeoutMs = 6000 } = {}) {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!storage || !doFetch) return 'failed';
  try {
    // The first time this build runs (a fresh install or an update), ask at
    // once: whatever an earlier build kept is no longer used. After that, at
    // most every three hours, whatever the answer was.
    const mine = storage.getItem(FOR_KEY) === BUILD;
    const [askedBy, askedAt] = String(storage.getItem(AT_KEY) || '').split('|');
    const at = askedBy === BUILD ? +askedAt || 0 : 0;
    if (!force && at > 0 && now - at >= 0 && now - at < FRESH_MS) return 'fresh';
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
    let text;
    try {
      const res = await doFetch(TOP10_REMOTE_URL, { cache: 'no-store', credentials: 'omit', signal: ac?.signal });
      if (!res || !res.ok) return 'failed';
      text = await res.text();
    } finally { if (timer) clearTimeout(timer); }
    // The site answered. Good file or bad, do not ask again for three hours: a
    // build that can no longer read the site's file would otherwise download
    // it every time the app came to the front.
    try { storage.setItem(AT_KEY, `${BUILD}|${now}`); } catch { /* full: ask again next time */ }
    if (!isStr(text) || text.length > MAX_BYTES) return 'rejected';
    let parsed; try { parsed = JSON.parse(text); } catch { return 'rejected'; }
    const good = acceptRemote(parsed);
    if (!good) return 'rejected';
    const note = daysNote(good.log.length);
    if (mine && storage.getItem(KEY) === text && storage.getItem(TOP10_DAYS_KEY) === note) return 'same';
    // The note is written first: if the larger write fails (storage full), Home
    // must not promise a day the screen then has no list for, so undo it.
    const before = storage.getItem(TOP10_DAYS_KEY);
    try {
      storage.setItem(TOP10_DAYS_KEY, note);
      storage.setItem(KEY, text);
      storage.setItem(FOR_KEY, BUILD);
    } catch {
      try { if (before == null) storage.removeItem(TOP10_DAYS_KEY); else storage.setItem(TOP10_DAYS_KEY, before); } catch { /* nothing more to do */ }
      return 'failed';
    }
    return 'updated';
  } catch { return 'failed'; }
}

// Is this the installed app? Read from the global, not from @capacitor/core:
// the Top 10 screen is built to mount on a static page too, and must not pull
// the native bridge into such a bundle.
export function isInstalledApp() {
  try { return !!window.Capacitor?.isNativePlatform?.(); } catch { return false; }
}
