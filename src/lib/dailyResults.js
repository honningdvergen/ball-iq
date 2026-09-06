// The honest "how everyone did" behind the results panel (DailyDone.jsx).
//
// Two calls, both through Supabase RPCs by plain fetch so the static islands
// (/football-wordle/, /transfer-trail/, /mystery-player/) can use them without
// bundling the Supabase client — the same posture as marketingEvent.js.
//
//   recordDailyResult({ game, edition, bucket, won })  once per visitor per edition
//   fetchDistribution({ game, edition })               → { n, won, buckets } | null
//
// bucket: guesses / clubs used when won, 0 = did not solve. Daily 7: the score.
// The panel shows the distribution only at n >= MIN_N — nothing fabricated
// before that (the fake percentile this replaces was removed for App Store 2.3).

const URL_ = 'https://blcisypmngimqkwxrrdm.supabase.co';
const KEY_ = (import.meta.env.VITE_SUPABASE_KEY || '').trim();
export const MIN_N = 20;
export const DAILY_GAMES = ['footle', 'daily7', 'trail', 'mystery'];

// Native shells serve from capacitor://localhost (iOS) / https://localhost
// (Android), so the plain hostname guard would treat every phone as a dev box.
function isNative() {
  try {
    if (typeof location !== 'undefined' && location.protocol === 'capacitor:') return true;
    const C = typeof window !== 'undefined' ? window.Capacitor : null;
    return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
  } catch { return false; }
}
function synthetic() {
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver === true) return true;
    if (isNative()) return false;
    const h = typeof location !== 'undefined' ? location.hostname : '';
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local');
  } catch { return false; }
}
// Same id marketingEvent uses, so one browser is one visitor across both tables.
function visitorId() {
  try {
    let v = localStorage.getItem('biq_vid');
    if (!v) {
      v = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : null;
      if (!v) return null;
      localStorage.setItem('biq_vid', v);
    }
    return (v && v.length === 36) ? v : null;
  } catch { return null; }
}
const flagKey = (game, edition) => `biq_dr_${game}_${edition}`;

async function rpc(name, body) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${name}`, {
    method: 'POST', keepalive: true,
    headers: { 'content-type': 'application/json', apikey: KEY_, authorization: `Bearer ${KEY_}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${name} ${r.status}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

export function hasRecorded(game, edition) {
  try { return localStorage.getItem(flagKey(game, edition)) === '1'; } catch { return false; }
}

// Fire-and-forget; resolves true when a row was sent (or already had been).
export async function recordDailyResult({ game, edition, bucket, won = true }) {
  if (!DAILY_GAMES.includes(game) || !Number.isInteger(edition) || edition < 0) return false;
  if (!Number.isInteger(bucket) || bucket < 0 || bucket > 30) return false;
  if (hasRecorded(game, edition)) return true;
  if (synthetic() || !URL_ || !KEY_) return false;
  // ⚠️ NO IDENTIFIER FROM NATIVE. The store listing promises no analytics on the
  // native apps, so a phone's result counts toward "how everyone did" with
  // visitor_id null — deduped only by the per-edition flag below. Web keeps the
  // visitor id (and the server's unique index).
  const vid = isNative() ? null : visitorId();
  if (!isNative() && !vid) return false;
  try {
    await rpc('record_daily_result', { p_game: game, p_edition: edition, p_bucket: bucket, p_won: !!won, p_visitor: vid });
    try { localStorage.setItem(flagKey(game, edition), '1'); } catch { /* private mode */ }
    return true;
  } catch { return false; }
}

export async function fetchDistribution({ game, edition }) {
  if (!DAILY_GAMES.includes(game) || !Number.isInteger(edition)) return null;
  if (!URL_ || !KEY_) return null;
  try {
    const d = await rpc('get_daily_distribution', { p_game: game, p_edition: edition });
    if (!d || typeof d !== 'object') return null;
    const buckets = {};
    for (const [k, v] of Object.entries(d.buckets || {})) buckets[Number(k)] = Number(v) || 0;
    return { n: Number(d.n) || 0, won: Number(d.won) || 0, buckets };
  } catch { return null; }
}

// Pure helpers the panel renders from. `mine` is the player's own bucket.
// Percentile = share of finishers you did BETTER than: fewer guesses wins;
// solving beats not solving; for Daily 7 a higher score wins.
export function summariseDistribution(dist, { game, mine, won }) {
  if (!dist || dist.n < MIN_N) return null;
  const entries = Object.entries(dist.buckets).map(([b, c]) => [Number(b), c]);
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
  let beaten = 0;
  if (game === 'daily7') {
    for (const [b, c] of entries) if (b < mine) beaten += c;
  } else if (won) {
    for (const [b, c] of entries) if (b === 0 || b > mine) beaten += c;
  } else {
    beaten = 0;
  }
  const solvedPct = game === 'daily7' ? null : Math.round((dist.won / total) * 100);
  const beatPct = Math.round((beaten / total) * 100);
  const avg = game === 'daily7'
    ? (entries.reduce((s, [b, c]) => s + b * c, 0) / total)
    : null;
  return { n: dist.n, total, solvedPct, beatPct, avg };
}
