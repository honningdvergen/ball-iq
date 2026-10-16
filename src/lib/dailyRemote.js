// Daily 7: the frozen log, fetched from the site by an installed app.
//
// ⚠️ THE PROBLEM THIS SOLVES (16 Oct 2026). Every build carries its own copy
// of src/data/dailyLog.js, a year of Daily 7 sets. The website is rebuilt on
// every push; an installed app keeps the copy it was built with. So the moment
// the log is regenerated (13 Oct: the two-easy mix; next, drawn without
// replacement), the website and every installed build serve DIFFERENT sevens
// on the same day, and "How everyone did", /c/ challenge links and the
// "everyone gets the same seven" promise all break until the phone updates.
//
// WHY NOT THE OTHER WAYS (each was considered):
//   - Leave future days alone so old builds agree: the repeats stay for a
//     year, because each build's log already runs a year ahead.
//   - Apply the new draw only beyond the horizon old builds carry: that is
//     October 2027, and old builds compute those days with their own bank.
//   - Compute the set on the server and serve only that: the daily would
//     need the network to start, and offline play is a feature.
// So, the Top 10 door (lib/top10Remote.js): the site serves the SAME file the
// build bundles (public/data/daily7.json, written by scripts/gen-daily-log.mjs
// in the same run), an installed app fetches it, checks it, keeps it and plays
// from it. The bundled copy is always the fallback: offline, a failed fetch or
// a file that fails a check leave the app exactly as it was.
//
// ⚠️ WHAT THIS CANNOT FIX: a build that was cut before this file existed has
// no way to ask. Those builds serve their own copy until the player updates.
// So the ORDER is fixed (main session, 16 Oct 2026): this door ships first
// with the log's days unchanged (it rides into 1.8.2), and the log is rebuilt
// (gen-daily-log.mjs --regen-from) only once that build is what players have.
// Builds up to 1.8.1 (152) stay in step until then because nothing moved.
//
// WHAT IS CHECKED:
//   - the shape: a version, the anchor day, and seven distinct ids a day
//   - ⚠️ THE DAYS THE BUILD KNEW AS SERVED NEVER MOVE. The generator records
//     how many leading days may have been served when it wrote the log
//     (`served`: everything through tomorrow), and only ever rewrites days
//     after that. A fetched file that differs from the build's own copy on
//     any of those days is a rollback or a mistake, and is refused.
//   - it is at least as long as the bundled copy: a shorter file would send
//     the build to the live draw sooner than the website.
// Ids the build's bank does not know (a question added after the build) are
// not refused: pickDailyFromLog tops such a slot up from the day's own
// shuffle, so the day still has seven, six of them the website's.
//
// Only an installed app fetches. The website's own bundle is the newest log.
import DAILY_LOG from '../data/dailyLog.js';
import { logHash } from './top10Hash.js';

export const DAILY_REMOTE_URL = 'https://balliq.app/data/daily7.json';
const KEY = 'biq_daily7_remote';         // the fetched file, as text
const FOR_KEY = 'biq_daily7_remote_for'; // which build fetched and checked it
const AT_KEY = 'biq_daily7_remote_at';   // which build last asked the site, and when
const FRESH_MS = 3 * 60 * 60 * 1000;     // do not ask again within three hours
const MAX_BYTES = 512 * 1024;            // 33 KB today; a year more is about 70
const MAX_EXTRA_DAYS = 1500;
const ID = /^[A-Za-z0-9_]{1,40}$/;

const dayKey = (log) => log.days.map((d) => d.join(','));
// This build, as far as the daily goes. Everything kept is stamped with it.
export const DAILY_BUILD = `${DAILY_LOG.anchor}:${DAILY_LOG.served ?? 0}:${DAILY_LOG.days.length}:${logHash(dayKey(DAILY_LOG))}`;

const isDay = (d) => Array.isArray(d) && d.length === 7 && d.every((id) => typeof id === 'string' && ID.test(id)) && new Set(d).size === 7;

/** The fetched object as a log if every part of it can be trusted, otherwise null. */
export function acceptRemoteDaily(r, bundled = DAILY_LOG) {
  try {
    if (!r || typeof r !== 'object' || r.v !== 1 || r.anchor !== bundled.anchor) return null;
    const { days, served } = r;
    if (!Array.isArray(days) || days.length < bundled.days.length || days.length > bundled.days.length + MAX_EXTRA_DAYS) return null;
    if (!Number.isInteger(served) || served < (bundled.served ?? 0) || served > days.length) return null;
    if (!days.every(isDay)) return null;
    const keep = bundled.served ?? 0;
    for (let i = 0; i < keep; i++) {
      const a = days[i], b = bundled.days[i];
      for (let k = 0; k < 7; k++) if (a[k] !== b[k]) return null;
    }
    return { anchor: r.anchor, served, days };
  } catch { return null; }
}

const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };

// The last fetched log, if THIS build fetched it and it still passes. A file
// kept by an earlier build is not used after an update: the update carries a
// log at least as new, and the next fetch (which an update forces) settles it.
export function cachedDailyLog(storage = store()) {
  try {
    if (!storage || storage.getItem(FOR_KEY) !== DAILY_BUILD) return null;
    return acceptRemoteDaily(JSON.parse(storage.getItem(KEY) || 'null'));
  } catch { return null; }
}

/** Has this build asked the site at least once (whatever the answer)? */
export function askedSiteForDaily(storage = store()) {
  try { return String(storage?.getItem(AT_KEY) || '').split('|')[0] === DAILY_BUILD; } catch { return false; }
}

/**
 * Ask the site for its log and keep it if it passes. Never throws.
 * 'updated' | 'same' | 'fresh' (asked recently) | 'rejected' | 'failed'.
 * Two calls at once share one request.
 */
let inFlight = null;
export function refreshDailyLog(opts = {}) {
  if (inFlight && !opts.fetchImpl) return inFlight;
  const run = refresh(opts);
  if (!opts.fetchImpl) { inFlight = run; run.finally(() => { if (inFlight === run) inFlight = null; }); }
  return run;
}
async function refresh({ fetchImpl, storage = store(), now = Date.now(), force = false, timeoutMs = 6000 } = {}) {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!storage || !doFetch) return 'failed';
  try {
    const [askedBy, askedAt] = String(storage.getItem(AT_KEY) || '').split('|');
    const at = askedBy === DAILY_BUILD ? +askedAt || 0 : 0;
    if (!force && at > 0 && now - at >= 0 && now - at < FRESH_MS) return 'fresh';
    const ac = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
    let text;
    try {
      const res = await doFetch(DAILY_REMOTE_URL, { cache: 'no-store', credentials: 'omit', signal: ac?.signal });
      if (!res || !res.ok) return 'failed';
      text = await res.text();
    } finally { if (timer) clearTimeout(timer); }
    try { storage.setItem(AT_KEY, `${DAILY_BUILD}|${now}`); } catch { /* full: ask again next time */ }
    if (typeof text !== 'string' || !text || text.length > MAX_BYTES) return 'rejected';
    let parsed; try { parsed = JSON.parse(text); } catch { return 'rejected'; }
    if (!acceptRemoteDaily(parsed)) return 'rejected';
    if (storage.getItem(FOR_KEY) === DAILY_BUILD && storage.getItem(KEY) === text) return 'same';
    try {
      storage.setItem(KEY, text);
      storage.setItem(FOR_KEY, DAILY_BUILD);
    } catch {
      try { storage.removeItem(FOR_KEY); } catch { /* nothing more to do */ }
      return 'failed';
    }
    return 'updated';
  } catch { return 'failed'; }
}
