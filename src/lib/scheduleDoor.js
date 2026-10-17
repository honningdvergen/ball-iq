// The fetch-door machinery shared by Transfer Trail, Mystery Player and Footle
// (lib/scheduleRemote.js and lib/wordle.js). Moved out of scheduleRemote.js on
// 17 Oct 2026 so Footle, whose answer Home reads on its eager path, can use it
// without pulling the Trail and Mystery logs into Home's bundle. Read
// scheduleRemote.js's header for what the door checks and why.
import { logHash } from './top10Hash.js';

const FRESH_MS = 3 * 60 * 60 * 1000;     // do not ask again within three hours
const MAX_BYTES = 256 * 1024;            // 4 KB each today
const MAX_EXTRA_DAYS = 1500;

const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };

export function makeDoor({ name, url, bundled, entry }) {
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
