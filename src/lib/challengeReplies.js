// The sender hears back (12 Nov 2026).
//
// "Send it to a mate" sends a link to today's Footle, Transfer Trail or Top 10
// with the sender's score on it. The mate has always seen the head-to-head;
// the sender was told nothing unless the mate sent one back. This file is the
// way back, with no account on either side:
//
//   * the sender's device makes a random 12-character id and puts it on the
//     link (?r=…), and remembers it here (biq_sent_challenges);
//   * the mate's device, on finishing that puzzle, writes one row against the
//     id (record_challenge_reply);
//   * the sender's Home asks for the rows on its own ids
//     (get_challenge_replies) and shows the newest it has not shown before.
//
// The id is a capability, not an identity: whoever holds it can reply to it
// and read its replies, and it exists for one puzzle. Both calls are plain
// fetch with the anon key, the same posture as dailyResults.js.
//
// ⚠️ NO DEVICE IDENTIFIER GOES WITH A REPLY. The installed apps send no
// visitor id anywhere (the store listings promise none). The server needs
// something to keep one device to one reply per link, so the reply carries a
// random uuid made for THAT link and kept only here (biq_reply_keys).
//
// SQL: supabase/migrations/v3_3_challenge_replies.sql. Until that migration is
// applied both calls fail quietly and nothing shows: the feature is inert.

const URL_ = 'https://blcisypmngimqkwxrrdm.supabase.co';
const KEY_ = (import.meta.env?.VITE_SUPABASE_KEY || '').trim();
const SENT_KEY = 'biq_sent_challenges';
const SEEN_KEY = 'biq_reply_seen';
const RKEY_KEY = 'biq_reply_keys';
const SENT_MAX = 12;
const KEEP_MS = 3 * 24 * 60 * 60 * 1000;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const RID = /^[A-Z2-7]{12}$/;
export const REPLY_GAMES = ['footle', 'trail', 'top10'];

export const isReplyId = (s) => typeof s === 'string' && RID.test(s);
// The same set the link's own name allows (gameChallenge.js cleanName), so a
// reply can carry nothing a challenge link could not.
const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{N} '._-]/gu, '').trim().slice(0, 22);

function readJson(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v == null ? fallback : v; } catch { return fallback; }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

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

function newReplyId() {
  try {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    let out = '';
    for (const b of bytes) out += ALPHABET[b & 31];
    return out;
  } catch { return null; }
}

/** What this device has sent, newest first, nothing older than three days. */
export function sentChallenges(now = Date.now()) {
  const list = readJson(SENT_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.filter((c) => c && isReplyId(c.rid) && REPLY_GAMES.includes(c.game) && Number.isInteger(c.edition) && now - (c.at || 0) < KEEP_MS);
}

/**
 * The id to put on a challenge link for this puzzle. One id per puzzle: a
 * player who sends today's Footle to three mates sends the same id three
 * times, and each mate's reply lands on it. Null where there is no crypto.
 */
export function replyIdFor(game, edition, score) {
  if (!REPLY_GAMES.includes(game) || !Number.isInteger(edition)) return null;
  const list = sentChallenges();
  const have = list.find((c) => c.game === game && c.edition === edition);
  if (have) return have.rid;
  const rid = newReplyId();
  if (!rid) return null;
  writeJson(SENT_KEY, [{ rid, game, edition, score: Number.isInteger(score) ? score : 0, at: Date.now() }, ...list].slice(0, SENT_MAX));
  return rid;
}

const claimed = new Set();
// The reply key per link, in memory too: where storage cannot be written a
// second call must still use the SAME key, or the server stores a second row.
const keyFor = new Map();
/**
 * The mate's side: this device finished a puzzle it was sent. Sent once per
 * link. Never for a link this device sent itself (opening your own link and
 * looking at your own finished puzzle is not a mate playing it).
 */
/** The name the server has for this device's reply to a link, or '' (nothing confirmed). */
export function replyNamed(rid) {
  const keys = readJson(RKEY_KEY, {});
  const e = keys && typeof keys === 'object' ? keys[rid] : null;
  return e && e.done && typeof e.name === 'string' ? e.name : '';
}
/** A link this device sent itself: nobody to tell. */
export const isOwnLink = (rid) => sentChallenges().some((c) => c.rid === rid);

/** May a name go with a reply without the player typing it here? The website: yes. An installed app: no. */
export const sendsNameUnasked = () => !isNative();

/**
 * `explicit`: the player typed this name to say who they are (MateNameAsk).
 * That is their choice, so it is sent from an installed app too, and it goes
 * even when the result itself was reported earlier: the server puts a name
 * that arrives later on the stored row (v3_4_challenge_reply_name.sql).
 */
export async function recordChallengeReply({ rid, game, edition, score, name = '', explicit = false }) {
  if (!isReplyId(rid) || !REPLY_GAMES.includes(game) || !Number.isInteger(edition)) return false;
  if (synthetic() || !KEY_) return false;
  if (sentChallenges().some((c) => c.rid === rid)) return false;
  // Two finish panels mount per result (phone and desktop): claim before the first await.
  const keys = readJson(RKEY_KEY, {});
  const entry = keys && typeof keys === 'object' ? keys[rid] : null;
  // The name as it will go: none from an installed app unless typed for this.
  const sending = (isNative() && !explicit) ? '' : cleanName(name);
  // Done, and nothing new to say: a typed name goes again only when it is not
  // the one already stored with the reply.
  if (entry && entry.done && (!explicit || entry.name === sending)) return true;
  if (claimed.has(rid) && !explicit) return true;
  claimed.add(rid);
  let key = (entry && entry.key) || keyFor.get(rid);
  if (!key) {
    try { key = crypto.randomUUID(); } catch { key = null; }
    if (!key) { claimed.delete(rid); return false; }
  }
  keyFor.set(rid, key);
  const save = (done) => {
    const all = readJson(RKEY_KEY, {});
    const next = { ...(all && typeof all === 'object' ? all : {}), [rid]: { key, done, name: done ? sending : ((entry && entry.name) || ''), at: Date.now() } };
    // Keep the newest 20: these are per-link keys, not a history.
    const trimmed = Object.fromEntries(Object.entries(next).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 20));
    writeJson(RKEY_KEY, trimmed);
  };
  if (!(entry && entry.done)) save(false);
  try {
    // true: stored. false: the server turned it away (its hourly backstop, or
    // the link is full), so this is NOT marked done and the next finish panel
    // or visit tries again.
    const ok = await rpc('record_challenge_reply', {
      p_cid: rid, p_game: game, p_edition: edition,
      p_score: Math.max(0, Math.round(score || 0)),
      // ⚠️ THE INSTALLED APPS SEND NO NAME. Their store listings promise that
      // nothing about the player leaves the phone unasked, and a signed-out
      // player never agreed to this one. The sender's card says "A mate". The
      // website sends the name the player goes by, as its challenge links do.
      p_name: sending, p_replier: key,
    });
    if (ok === true) {
      save(true);
      // The ask on the finish panel (both of its mounted copies) follows this.
      try { if (sending) window.dispatchEvent(new CustomEvent('biq:reply-named', { detail: { rid, name: sending } })); } catch { /* no window */ }
      return true;
    }
    if (!(entry && entry.done)) claimed.delete(rid);
    return false;
  } catch { if (!(entry && entry.done)) claimed.delete(rid); return false; }
}

export const replyKey = (r) => `${r.rid}:${r.at}`;
// A reply that was shown without a name is shown again once it has one.
const seenId = (r) => `${r.rid}:${r.at}:${r.name ? 'n' : ''}`;

let lastFetch = 0;
let lastResult = [];
/**
 * Replies to what this device sent that it has not shown yet, oldest first:
 * [{ rid, game, edition, mine, theirs, name, at }]. At most one network call
 * a minute; an empty list where nothing was sent, without a call.
 */
export async function fetchNewReplies({ force = false } = {}) {
  const sent = sentChallenges();
  if (!sent.length) {
    // Nothing sent in three days: drop the key, so Home stops loading the card.
    try { localStorage.removeItem(SENT_KEY); } catch { /* private mode */ }
    return [];
  }
  if (!KEY_ || synthetic()) return [];
  const now = Date.now();
  if (!force && now - lastFetch < 60000) return unseen(lastResult);
  lastFetch = now;
  try {
    const rows = await rpc('get_challenge_replies', { p_cids: sent.map((c) => c.rid) });
    const byRid = new Map(sent.map((c) => [c.rid, c]));
    lastResult = (Array.isArray(rows) ? rows : []).map((r) => {
      const mine = byRid.get(r.cid);
      if (!mine || mine.game !== r.game || mine.edition !== r.edition) return null;
      return { rid: r.cid, game: r.game, edition: r.edition, mine: mine.score, theirs: r.score, name: typeof r.name === 'string' ? r.name : '', at: r.at };
    }).filter(Boolean);
  } catch { lastResult = []; }
  return unseen(lastResult);
}

function unseen(list) {
  const seen = new Set(readJson(SEEN_KEY, []));
  return list.filter((r) => !seen.has(seenId(r)));
}

/** The card was shown and put away: do not show this reply again. */
export function markReplySeen(reply) {
  const seen = readJson(SEEN_KEY, []);
  const next = [seenId(reply), ...(Array.isArray(seen) ? seen : [])].slice(0, 60);
  writeJson(SEEN_KEY, [...new Set(next)]);
}

// Tests reset the module's memory between cases.
export function __resetChallengeRepliesForTests() { claimed.clear(); keyFor.clear(); lastFetch = 0; lastResult = []; }
