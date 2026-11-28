// A sync this phone still owes the account.
//
// ⚠️ WHY (28 Nov 2026, Alex on a flight, signed in, no network): a finished
// game writes three kinds of thing to the account. The `scores` row has a
// durable queue (lib/scoreOutbox.js). The streak day has one (lib/streak.js).
// The XP and score DELTAS and the day's Daily 7 answers had only the catch-up
// that runs when the profile is read at start (useAuth, hydrateLocalFromRemote),
// so a phone that lost its connection mid-sitting and got it back kept showing
// mates a poorer card until the app was next cold-started, which on a phone can
// be days. Meanwhile the player was shown "Score didn't sync, check your
// connection" beside the banner saying everything would sync.
//
// So: a write that fails leaves this mark. When the phone is back (the browser's
// `online` event, or the app coming to the front), useAuth sees the mark and
// reads the profile again, which runs the same catch-up a cold start runs. The
// mark is cleared only once that catch-up has nothing left to send.
const KEY = 'biq_sync_owed';

export function markSyncOwed(storage = globalThis.localStorage) {
  try { storage.setItem(KEY, String(Date.now())); } catch { /* storage blocked: the next cold start still catches up */ }
}

export function syncOwed(storage = globalThis.localStorage) {
  try { return !!storage.getItem(KEY); } catch { return false; }
}

export function clearSyncOwed(storage = globalThis.localStorage) {
  try { storage.removeItem(KEY); } catch { /* nothing to clear */ }
}

/**
 * Did this write fail because it could not leave the phone, as opposed to the
 * server refusing it? A network failure needs no warning of its own: the
 * offline banner is already on screen saying progress will sync.
 */
export function isNetFail(err, nav = globalThis.navigator) {
  try { if (nav && nav.onLine === false) return true; } catch { /* no navigator */ }
  return /load failed|failed to fetch|networkerror|network request failed|network connection|internet|timed? ?out|aborted/i.test(String(err?.message || err || ''));
}
