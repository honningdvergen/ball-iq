import { supabase } from '../supabase.js';
import { safeSetItem } from '../safeStorage.js';

/**
 * A durable outbox for `scores` rows.
 *
 * ⚠️ WHY THIS EXISTS: `scores` WAS THE ONLY GAME RECORD WITHOUT A RETRY, and it
 * is the one every metric reads.
 *
 * Measured against prod on 2026-08-24, today-only so archive plays and guest
 * back-sync are both excluded:
 *
 *     day      finished in user_game_state   score rows   missing
 *     08-23                 13                   12          1
 *     08-22                 18                   15          3
 *     08-20                 19                   14          5
 *     08-19                 18                   12          6
 *     week                 137                  110         27   (~20%)
 *
 * The cause is an asymmetry, not a bug in either half. `wordle_state` is
 * eventually consistent: the write is skipped when there is no user, but the
 * day stays in localStorage and `hydrate` back-syncs every local-only day at
 * sign-in (useAuth.jsx, `localOnlyWordleDays`). `scores` had no equivalent — the
 * insert is guarded by `if (user?.id)` and has no retry, so a game finished
 * before auth hydrated, while signed out, or during a blip is gone for good.
 *
 * The damage compounds, which is why this is worth fixing before any retention
 * number is trusted:
 *   · the "56% never return" figure is partly an artifact of the gap
 *   · `enqueue_web_daily_reminders` decides "did they play today" from `scores`,
 *     so it nags people who played
 *   · 12 accounts have finished puzzles on the server and a profile reading
 *     games_played 0, xp 0, total_score 0 — one with 12 finished Footles.
 *     "I played and it didn't save" is a three-star review with a screenshot.
 *
 * ⚠️ IDEMPOTENT BY CLIENT-GENERATED ID. Every queued row carries a uuid used as
 * the `scores` primary key, so a flush that partially succeeded and retries
 * cannot double-count. Without it a retry loop would inflate exactly the number
 * this file exists to make honest.
 *
 * ⚠️ Rows queued while signed OUT are attributed to whoever next signs in on
 * this device. That is deliberate and matches what the wordle back-sync already
 * does with local-only days — the alternative is discarding the play entirely,
 * which is the behaviour being fixed. Capped by age so a long-dormant device
 * cannot donate months-old games to a new account.
 */

const KEY = 'biq_score_outbox';
/** Older than this and we drop rather than misattribute. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Never let a broken flush grow the queue without bound. */
const MAX_ROWS = 200;

function uuid() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* fall through */ }
  // Not security-sensitive: this is a dedupe key, not a secret.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function readOutbox() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeOutbox(rows) {
  try { safeSetItem(KEY, JSON.stringify(rows.slice(-MAX_ROWS))); } catch { /* quota */ }
}

/** Queue a row for later. Returns the row so callers can log it. */
export function enqueueScore(row) {
  const queued = { ...row, id: row.id || uuid(), queued_at: Date.now() };
  writeOutbox([...readOutbox(), queued]);
  return queued;
}

/**
 * Write a score now, and queue it if that is not possible or fails.
 *
 * This is the ONLY way a score should be written — the five call sites in
 * App.jsx each had their own fire-and-forget insert, which is how the gap
 * stayed invisible: no single place to notice it or fix it.
 */
export async function saveScore(userId, row) {
  const withId = { ...row, id: row.id || uuid() };
  if (!userId) { enqueueScore(withId); return { queued: true }; }
  try {
    const { error } = await supabase.from('scores').insert({ ...withId, user_id: userId });
    // 23505 = the row is already there. A previous attempt DID land; treat the
    // retry as the success it is rather than queueing a third copy.
    if (error && error.code !== '23505') { enqueueScore(withId); return { queued: true, error }; }
    return { saved: true };
  } catch (e) {
    enqueueScore(withId);
    return { queued: true, error: e };
  }
}

/**
 * Drain the outbox. Safe to call repeatedly; call once auth has settled.
 * Returns { sent, dropped, kept } so the caller can log a real number.
 */
export async function flushScoreOutbox(userId) {
  if (!userId) return { sent: 0, dropped: 0, kept: readOutbox().length };
  const all = readOutbox();
  if (!all.length) return { sent: 0, dropped: 0, kept: 0 };

  const now = Date.now();
  const fresh = [], stale = [];
  for (const r of all) ((now - (r.queued_at || 0)) > MAX_AGE_MS ? stale : fresh).push(r);

  const kept = [];
  let sent = 0;
  let i = 0;
  for (; i < fresh.length; i += 1) {
    const { queued_at: q, ...cols } = fresh[i];
    // ⚠️ STAMP THE PLAY TIME, NOT THE FLUSH TIME. `created_at` defaults to
    // now(), so a game played Monday and flushed Thursday would land on
    // Thursday — which would corrupt the exact per-day counts this file exists
    // to make honest, and would do it invisibly. `queued_at` is set at game
    // end, so it IS the play moment.
    //
    // Clamped to now because this is a device clock: a phone set to 2029 could
    // otherwise write a row into the future that every "last 7 days" query
    // silently carries forever. Skewed-backwards clocks we accept — the row is
    // still closer to the truth than the flush time.
    const playedAt = q ? new Date(Math.min(q, now)).toISOString() : undefined;
    try {
      const { error } = await supabase.from('scores').insert({
        ...cols,
        user_id: userId,
        ...(playedAt ? { created_at: playedAt } : {}),
      });
      if (error && error.code !== '23505') { kept.push(fresh[i]); continue; }
      sent += 1;
    } catch {
      // Still offline. Keep this one and stop — hammering a dead connection
      // just burns the rest of the queue for nothing. `i` is advanced so the
      // slice below does not queue it a second time.
      kept.push(fresh[i]);
      i += 1;
      break;
    }
  }
  const untouched = fresh.slice(i);   // never attempted; try again next flush
  writeOutbox([...kept, ...untouched]);
  return { sent, dropped: stale.length, kept: kept.length + untouched.length };
}
