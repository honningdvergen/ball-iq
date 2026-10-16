// Mates' leagues: sending a finished daily to the league table (phase 1, web).
//
// One call, record_league_result(game, edition, bucket, won), by plain fetch so
// the static islands (/football-wordle/, /transfer-trail/, …) can send it
// without bundling the Supabase client — the same posture as dailyResults.js.
//
// ⚠️ THE CLIENT NEVER SENDS POINTS. It sends the game's own result (guesses,
// clubs used, or the score), the same value daily_results already gets, and
// SQL turns it into points (supabase/migrations/v3_0_mates_leagues.sql,
// _league_points). The scale below is a COPY FOR DISPLAY ONLY ("How points
// work", the Home card's dots); tests/unit/league-sql-parity.test.js pins it to
// the SQL so the two cannot drift.
//
// ⚠️ IT NEEDS A REAL SESSION. The write is granted to `authenticated` only and
// bound to auth.uid(), so it is sent with the player's own access token, never
// the anon key. Where the token comes from:
//   * a getter the app registers (setLeagueTokenSource): supabase.auth.getSession()
//   * otherwise the web session in localStorage (the islands, and the app before
//     it has registered), skipped when it has expired
// No token (a guest with no session yet): the result waits in a small outbox
// (biq_league_outbox, last 16) and is sent on join or the next sign-in. The
// server's time window drops anything stale, so a late flush can never score.
//
// ⚠️ NOT ON NATIVE (phase 1). Installed apps carry the web code they were
// built with; phase 1 ships through Vercel only, and this returns at once in a
// native shell so a build cut from this code sends nothing until phase 2.

const URL_ = 'https://blcisypmngimqkwxrrdm.supabase.co';
const KEY_ = (import.meta.env?.VITE_SUPABASE_KEY || '').trim();
const AUTH_KEY = 'sb-blcisypmngimqkwxrrdm-auth-token';
const OUTBOX_KEY = 'biq_league_outbox';
const OUTBOX_MAX = 16;

export const LEAGUE_GAMES = ['footle', 'daily7', 'trail', 'top10'];
// The server's limits on the bucket, per game.
export const LEAGUE_BUCKET_MAX = { footle: 6, trail: 30, daily7: 7, top10: 10 };
// edition -> the puzzle's day index (days since 1970-01-01): day = edition + offset.
// Footle #1 = day 20577 (footleNumber.js), Trail #1 = 20668 (trail.js),
// Top 10 #1 = 20738 (top10Meta.js); Daily 7's edition IS the day index.
// Hard-coded rather than imported: trail.js is the whole Trail answer log, and
// this file rides in the results panel on every island. The parity test
// imports the real anchors and checks these.
export const LEAGUE_DAY_OFFSET = { footle: 20576, trail: 20667, top10: 20737, daily7: 0 };

export function leagueDayIndex(game, edition) {
  const off = LEAGUE_DAY_OFFSET[game];
  if (off == null || !Number.isInteger(edition)) return null;
  return edition + off;
}

/** Display copy of _league_points. Every played daily is worth 1 to 10. */
export function leaguePoints(game, bucket, won) {
  const b = Number.isInteger(bucket) ? bucket : 0;
  if (game === 'footle' || game === 'trail') return won === true && b >= 1 ? Math.max(5, 11 - b) : 1;
  if (game === 'daily7') return b <= 0 ? 1 : Math.min(7, b) + 3;
  if (game === 'top10') return Math.max(1, Math.min(10, b));
  return null;
}

/** Monday of the week containing a day index. Day 0 was a Thursday. */
export function leagueWeekStart(day) {
  return day - ((((day + 3) % 7) + 7) % 7);
}

// capacitor: protocol (iOS), the class index.html's head script sets, or the
// bridge itself (Android serves from https://localhost).
export function isNativeShell() {
  try {
    if (typeof location !== 'undefined' && location.protocol === 'capacitor:') return true;
    if (typeof document !== 'undefined' && document.documentElement?.classList?.contains('native-app')) return true;
    const C = typeof window !== 'undefined' ? window.Capacitor : null;
    return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  } catch { return false; }
}

let tokenSource = null;
/** The app registers a getter that returns the current access token (or null). */
export function setLeagueTokenSource(fn) { tokenSource = typeof fn === 'function' ? fn : null; }

export async function leagueAccessToken() {
  if (tokenSource) {
    try { const t = await tokenSource(); if (t) return t; } catch { /* fall through */ }
  }
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    const t = s && s.access_token;
    const exp = Number(s && s.expires_at) || 0;
    if (t && (!exp || exp * 1000 > Date.now() + 30000)) return t;
  } catch { /* private mode */ }
  return null;
}

function valid({ game, edition, bucket }) {
  return LEAGUE_GAMES.includes(game) && Number.isInteger(edition) && edition >= 0
    && Number.isInteger(bucket) && bucket >= 0 && bucket <= LEAGUE_BUCKET_MAX[game];
}

const flagKey = (game, edition) => `biq_lr_${game}_${edition}`;
const sent = (game, edition) => { try { return localStorage.getItem(flagKey(game, edition)) === '1'; } catch { return false; } };
const markSent = (game, edition) => { try { localStorage.setItem(flagKey(game, edition), '1'); } catch { /* private mode */ } };

export function readLeagueOutbox() {
  try {
    const v = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]');
    return Array.isArray(v) ? v.filter(valid) : [];
  } catch { return []; }
}
function writeOutbox(list) {
  try {
    if (!list.length) localStorage.removeItem(OUTBOX_KEY);
    else localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(-OUTBOX_MAX)));
  } catch { /* private mode */ }
}
export function queueLeagueResult(r) {
  if (!valid(r)) return;
  const list = readLeagueOutbox().filter((x) => !(x.game === r.game && x.edition === r.edition));
  list.push({ game: r.game, edition: r.edition, bucket: r.bucket, won: r.won !== false });
  writeOutbox(list);
}

async function send(token, { game, edition, bucket, won }) {
  const r = await fetch(`${URL_}/rest/v1/rpc/record_league_result`, {
    method: 'POST', keepalive: true,
    headers: { 'content-type': 'application/json', apikey: KEY_, authorization: `Bearer ${token}` },
    body: JSON.stringify({ p_game: game, p_edition: edition, p_bucket: bucket, p_won: won !== false }),
  });
  if (!r.ok) { const e = new Error(`record_league_result ${r.status}`); e.status = r.status; throw e; }
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

// ⚠️ TWO PANELS MOUNT PER RESULT (dailyResults.js has the whole story). The
// claim is taken synchronously, before the first await, so the sibling panel
// that runs in the same tick returns at once and only one request goes out.
const claimed = new Set();

/** Fire-and-forget from the results panel. Resolves true when it was sent (now or before). */
export async function recordLeagueResult({ game, edition, bucket, won = true }) {
  const r = { game, edition, bucket, won };
  if (!valid(r) || isNativeShell()) return false;
  try { if (typeof navigator !== 'undefined' && navigator.webdriver === true) return false; } catch { /* no navigator */ }
  const key = `${game}:${edition}`;
  if (claimed.has(key)) return true;   // the sibling panel already has this one
  claimed.add(key);
  if (sent(game, edition)) return true;
  if (!KEY_) return false;
  const token = await leagueAccessToken();
  if (!token) { queueLeagueResult(r); return false; }
  try {
    await send(token, r);
    markSent(game, edition);
    return true;
  } catch (e) {
    // 404: the function is not there (the migration is not applied yet), so
    // keeping the result would only retry a door that does not exist.
    if (e?.status !== 404) queueLeagueResult(r);
    claimed.delete(key);
    return false;
  }
}

let flushing = null;
/** Send what waited for a session. Returns the number sent; safe to call often. */
export function flushLeagueOutbox() {
  if (flushing) return flushing;
  flushing = (async () => {
    const list = readLeagueOutbox();
    if (!list.length || isNativeShell() || !KEY_) return 0;
    const token = await leagueAccessToken();
    if (!token) return 0;
    let n = 0;
    const keep = [];
    for (const r of list) {
      if (sent(r.game, r.edition)) continue;
      try {
        // A null answer is the server declining (stale, or over the throttle):
        // either way it will never count, so it leaves the outbox too.
        await send(token, r);
        markSent(r.game, r.edition);
        n++;
      } catch (e) { if (e?.status !== 404) keep.push(r); }
    }
    writeOutbox(keep);
    return n;
  })().finally(() => { flushing = null; });
  return flushing;
}
