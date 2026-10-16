// Transfer Trail and Mystery Player: the frozen answer logs, fetched from the
// site by an installed app. The same door Daily 7 got on 16 Oct 2026
// (lib/dailyRemote.js); read that file's header for why it is built this way.
//
// ⚠️ THE PROBLEM. Every build carries its own copy of the Trail log
// (TRAIL_ANSWER_LOG in lib/trail.js) and the Mystery schedule
// (data/mysterySchedule.json). The website is rebuilt on every push; an
// installed app keeps the copy it was built with. So whenever either log's
// future is re-planned (the Mystery future was, 14 Oct 2026, which is why
// builds before 1.8.0 (149) already serve different Mystery answers from the
// website), the website and the phones disagree on the day's answer, and
// "everyone gets the same player today" breaks until the phone updates.
//
// THE DOOR. The site serves the SAME log the build bundles, plus a version and
// the served horizon (public/data/trail.json and public/data/mystery.json,
// written by scripts/lib/schedule-remote.mjs from the generators' own runs:
// gen-mystery-schedule.mjs, rekey-mystery-repeats.mjs, trail-freeze.mjs, and
// gen-schedule-remote.mjs after a hand edit of the Trail log). An installed
// app fetches it, checks it, keeps it and plays from it. The bundled copy is
// always the fallback: offline, a failed fetch or a file that fails a check
// leave the app exactly as it was.
//
// ⚠️ WHAT THIS CANNOT FIX: a build cut before this file existed has no way to
// ask. Those builds (and so every build before 1.8.0 (149) for Mystery) serve
// their own copy until the player updates.
//
// WHAT IS CHECKED (the served-days guard):
//   - the shape: a version, the anchor day, and a well-formed entry per day
//   - ⚠️ THE DAYS THE BUILD KNEW AS SERVED NEVER MOVE. The generator records
//     how many leading days may have been served when it wrote the log
//     (`served`: everything through tomorrow, and for the Trail at least the
//     days frozen in tests/unit/trail-schedule.test.js), and refuses to move
//     them. A fetched file that differs from the build's own copy on any of
//     those days is a rollback or a mistake, and is refused.
//   - ⚠️ AND THE DAYS A KEPT FILE CALLED SERVED NEVER MOVE EITHER. Daily 7
//     compares a fetched file with the bundle only. Here it is also compared
//     with the file this build already kept: once a phone has played from the
//     site's copy, a later file must agree with that copy on every day it
//     called served, and may not call fewer days served. So a site rolled back
//     to an older deploy cannot rewrite days the phone has already played.
//   - it is at least as long as the bundled (and the kept) copy.
// An entry the build cannot play (a Trail career or a Mystery player added
// after the build) is not refused: the screen falls back to the bundled
// answer for that one day (trailPlayerForDate, mysteryAnswerIds).
//
// Only an installed app fetches (App.jsx, the same moments as Daily 7 and
// Top 10). Nothing is ever kept on the website, so there the readers below
// return the bundled answer: the website's own bundle is the newest log.
//
// ⚠️ KEEP THIS OFF HOME'S EAGER PATH (scripts/audit-home-budget.mjs). App.jsx
// loads it with import(); the two game screens import it, and they are lazy.
import { TRAIL_ANSWER_LOG, TRAIL_ANCHOR_DAY, getTrailAnswerForDayIndex, getTrailDayIndex } from './trail.js';
import { MYSTERY_ANCHOR_DAY, answerIdForDay } from './mysteryPlayer.js';
import MYSTERY_SCHEDULE from '../data/mysterySchedule.json';
import SERVED from '../data/scheduleServed.json';
import { logHash } from './top10Hash.js';

const FRESH_MS = 3 * 60 * 60 * 1000;     // do not ask again within three hours
const MAX_BYTES = 256 * 1024;            // 4 KB each today
const MAX_EXTRA_DAYS = 1500;

const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };

function makeDoor({ name, url, bundled, entry }) {
  const KEY = `biq_${name}_remote`;          // the fetched file, as text
  const FOR_KEY = `biq_${name}_remote_for`;  // which build fetched and checked it
  const AT_KEY = `biq_${name}_remote_at`;    // which build last asked the site, and when
  // This build, as far as this log goes. Everything kept is stamped with it.
  const BUILD = `${bundled.anchor}:${bundled.served}:${bundled.days.length}:${logHash(bundled.days)}`;

  /** The fetched object as a log if every part of it can be trusted, otherwise null. */
  function accept(r, kept = null, base = bundled) {
    try {
      if (!r || typeof r !== 'object' || r.v !== 1 || r.anchor !== base.anchor) return null;
      const { days, served } = r;
      const floor = Math.max(base.days.length, kept?.days.length ?? 0);
      if (!Array.isArray(days) || days.length < floor || days.length > base.days.length + MAX_EXTRA_DAYS) return null;
      if (!Number.isInteger(served) || served < Math.max(base.served, kept?.served ?? 0) || served > days.length) return null;
      if (!days.every((d) => typeof d === 'string' && entry.test(d))) return null;
      for (let i = 0; i < base.served; i++) if (days[i] !== base.days[i]) return null;
      if (kept) for (let i = 0; i < kept.served; i++) if (days[i] !== kept.days[i]) return null;
      return { anchor: r.anchor, served, days };
    } catch { return null; }
  }

  // Parsed once per kept text: the screens read this on every mount.
  let memoText = null, memoLog = null;
  // The last fetched log, if THIS build fetched it and it still passes. A file
  // kept by an earlier build is not used after an update: the update carries a
  // log at least as new, and the next fetch (which an update forces) settles it.
  function cached(storage = store()) {
    try {
      if (!storage || storage.getItem(FOR_KEY) !== BUILD) return null;
      const text = storage.getItem(KEY) || 'null';
      if (text !== memoText) { memoLog = accept(JSON.parse(text)); memoText = text; }
      return memoLog;
    } catch { return null; }
  }

  /** Has this build asked the site at least once (whatever the answer)? */
  function asked(storage = store()) {
    try { return String(storage?.getItem(AT_KEY) || '').split('|')[0] === BUILD; } catch { return false; }
  }

  async function refresh({ fetchImpl, storage = store(), now = Date.now(), force = false, timeoutMs = 6000 } = {}) {
    const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (!storage || !doFetch) return 'failed';
    try {
      const [askedBy, askedAt] = String(storage.getItem(AT_KEY) || '').split('|');
      const at = askedBy === BUILD ? +askedAt || 0 : 0;
      if (!force && at > 0 && now - at >= 0 && now - at < FRESH_MS) return 'fresh';
      const ac = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
      let text;
      try {
        const res = await doFetch(url, { cache: 'no-store', credentials: 'omit', signal: ac?.signal });
        if (!res || !res.ok) return 'failed';
        text = await res.text();
      } finally { if (timer) clearTimeout(timer); }
      try { storage.setItem(AT_KEY, `${BUILD}|${now}`); } catch { /* full: ask again next time */ }
      if (typeof text !== 'string' || !text || text.length > MAX_BYTES) return 'rejected';
      let parsed; try { parsed = JSON.parse(text); } catch { return 'rejected'; }
      if (!accept(parsed, cached(storage))) return 'rejected';
      if (storage.getItem(FOR_KEY) === BUILD && storage.getItem(KEY) === text) return 'same';
      try {
        storage.setItem(KEY, text);
        storage.setItem(FOR_KEY, BUILD);
      } catch {
        try { storage.removeItem(FOR_KEY); } catch { /* nothing more to do */ }
        return 'failed';
      }
      return 'updated';
    } catch { return 'failed'; }
  }

  // Two calls at once share one request.
  let inFlight = null;
  function refreshShared(opts = {}) {
    if (inFlight && !opts.fetchImpl) return inFlight;
    const run = refresh(opts);
    if (!opts.fetchImpl) { inFlight = run; run.finally(() => { if (inFlight === run) inFlight = null; }); }
    return run;
  }

  return { BUILD, accept, cached, asked, refresh: refreshShared };
}

// ── Transfer Trail ────────────────────────────────────────────────────────────
export const TRAIL_REMOTE_URL = 'https://balliq.app/data/trail.json';
const TRAIL_BUNDLED = { anchor: TRAIL_ANCHOR_DAY, served: SERVED.trail, days: TRAIL_ANSWER_LOG };
const trail = makeDoor({ name: 'trail', url: TRAIL_REMOTE_URL, bundled: TRAIL_BUNDLED, entry: /^[A-Z0-9_]{1,40}$/ });
export const TRAIL_BUILD = trail.BUILD;
export const acceptRemoteTrail = trail.accept;
export const cachedTrailLog = trail.cached;
export const askedSiteForTrail = trail.asked;
/** 'updated' | 'same' | 'fresh' (asked recently) | 'rejected' | 'failed'. Never throws. */
export const refreshTrailLog = trail.refresh;

/**
 * The Trail player for `date`: from the kept site copy when there is one and
 * this build knows that career, otherwise `fallback` (the bundled answer the
 * caller already resolved).
 */
export function trailPlayerForDate(date, fallback, storage) {
  try {
    const live = cachedTrailLog(storage);
    if (!live) return fallback;
    return getTrailAnswerForDayIndex(getTrailDayIndex(date), live.days) || fallback;
  } catch { return fallback; }
}

// ── Mystery Player ────────────────────────────────────────────────────────────
export const MYSTERY_REMOTE_URL = 'https://balliq.app/data/mystery.json';
const MYSTERY_BUNDLED = { anchor: MYSTERY_ANCHOR_DAY, served: SERVED.mystery, days: MYSTERY_SCHEDULE };
const mystery = makeDoor({ name: 'mystery', url: MYSTERY_REMOTE_URL, bundled: MYSTERY_BUNDLED, entry: /^Q[1-9][0-9]{0,11}$/ });
export const MYSTERY_BUILD = mystery.BUILD;
export const acceptRemoteMystery = mystery.accept;
export const cachedMysterySchedule = mystery.cached;
export const askedSiteForMystery = mystery.asked;
/** 'updated' | 'same' | 'fresh' (asked recently) | 'rejected' | 'failed'. Never throws. */
export const refreshMysterySchedule = mystery.refresh;

/**
 * The day's answer ids, best first: the kept site copy's, then the bundled
 * one if it differs. The screen plays the first one its pool holds, so a
 * player added after this build falls back to the bundled answer that day.
 */
export function mysteryAnswerIds(dayIndex, storage) {
  const bundledId = answerIdForDay(MYSTERY_SCHEDULE, dayIndex);
  let liveId = null;
  try { const live = cachedMysterySchedule(storage); if (live) liveId = answerIdForDay(live.days, dayIndex); } catch { liveId = null; }
  return [...new Set([liveId, bundledId].filter(Boolean))];
}

/** Both doors at once (App.jsx: a moment after start and on every resume). */
export function refreshSchedules() {
  return Promise.all([refreshTrailLog(), refreshMysterySchedule()]).then(([trail, mystery]) => ({ trail, mystery }));
}
