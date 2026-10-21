// Mates' leagues: the invite link, the words on the table, and the calls.
//
// A league is a name and an invite link. Mates join from the link (as guests
// if they like), points come from the four dailies (leagueResults.js sends
// them, SQL scores them), the week runs Monday to Sunday and goes final at
// Monday 00:00 in the league's own zone. Spec: ball-iq-audit/2026-10-16/leagues.
//
//   balliq.app/l/K7QM2XPA.The%20Lads.Alex
//     code: 8 characters from a 31-symbol alphabet (no 0/O, 1/I/L)
//     name, inviter: LABELS ONLY, URI-encoded, for the preview card and the
//     join screen. The real name comes from the server after joining.
//
// api/l.js unfurls it (no database read) and sends a person to
// /play?league=TOKEN; the app's boot hands the token to the join screen.
//
// ⚠️ PHASE 1 IS WEB ONLY. Every call here returns null in a native shell, and
// the league UI is hidden there (isNativeShell), so nothing reaches the
// installed apps before build 1.9. Without the migration applied the calls
// come back empty and the UI shows nothing: no league card, no crash.

import { isNativeShell, leagueWeekStart, flushLeagueOutbox, setLeagueTokenSource } from './leagueResults.js';
import '../i18n/en.js'; // the full English table: not on Home's eager path
import { t } from '../i18n/index.js';

// Re-exported so the app reaches the results lib through this lazy chunk: a
// dynamic import of leagueResults.js from App.jsx pulled it into Home's eager
// graph (measured: +4 KB in the shared chunk).
export { isNativeShell, flushLeagueOutbox, setLeagueTokenSource };
export const LEAGUE_CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;
const MEMBER_KEY = 'biq_league_member';
const INVITE_KEY = 'biq_league_invite';
const CLAIM_KEY = 'biq_league_claim';
const SEEN_FINAL_PREFIX = 'biq_league_seen_';

// Labels ride in a dot-separated token, so a label may not carry a dot (a
// decoded %2E in a query string would split it in the wrong place). Letters,
// numbers, spaces, apostrophes, hyphens and underscores.
const cleanLabel = (s, max) => String(s || '').replace(/\./g, ' ').replace(/[^\p{L}\p{N} '_-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);
const enc = (s) => encodeURIComponent(s).replace(/\./g, '%2E');

/** "K7QM2XPA.The%20Lads.Alex"; the inviter is optional. Null for a bad code. */
export function leagueInviteToken(code, name = '', inviter = '') {
  const c = String(code || '').toUpperCase();
  if (!LEAGUE_CODE_RE.test(c)) return null;
  const n = cleanLabel(name, 32);
  const w = cleanLabel(inviter, 22);
  return `${c}.${enc(n)}${w ? '.' + enc(w) : ''}`;
}

export function leagueInviteUrl(code, name, inviter) {
  const t = leagueInviteToken(code, name, inviter);
  return t ? `https://balliq.app/l/${t}` : null;
}

/** { code, name, inviter } or null. Accepts the token encoded or already decoded. */
export function parseLeagueInviteToken(token) {
  const raw = String(token || '').trim();
  const m = /^([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8})(?:\.([^.]*))?(?:\.([^.]*))?$/i.exec(raw);
  if (!m) return null;
  const dec = (s) => { try { return decodeURIComponent(s || ''); } catch { return s || ''; } };
  return { code: m[1].toUpperCase(), name: cleanLabel(dec(m[2]), 32), inviter: cleanLabel(dec(m[3]), 22) };
}

// ── local markers ──
const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } };
/** Whether this browser is in a league: gates the Home card's fetch for guests. */
export const isLeagueMember = () => get(MEMBER_KEY) === '1';
export const setLeagueMember = (on) => set(MEMBER_KEY, on ? '1' : null);
export function storeLeagueInvite(token) { if (parseLeagueInviteToken(token)) set(INVITE_KEY, JSON.stringify({ token, at: Date.now() })); }
export function readLeagueInvite() {
  try {
    const v = JSON.parse(get(INVITE_KEY) || 'null');
    if (!v || Date.now() - v.at > 7 * 86400000) return null;
    return parseLeagueInviteToken(v.token);
  } catch { return null; }
}
export const clearLeagueInvite = () => set(INVITE_KEY, null);

// ⚠️ THE APP REMOUNTS WHEN A GUEST SIGNS IN. AppGate unmounts AppInner while a
// new anonymous session's profile loads (App.jsx), so a sheet held in React
// state would vanish mid-join. The sheet's step lives here instead, the way
// /join/CODE keeps biq_pending_join: App reads it back on mount (inline, under
// the same key, to keep this file out of Home's eager graph).
//   { kind: 'join', token } | { kind: 'create', seed, vs, h2h, made? } | { kind: 'open', id }
export const LEAGUE_UI_KEY = 'biq_league_ui';
export function saveLeagueUi(v) {
  set(LEAGUE_UI_KEY, v ? JSON.stringify({ ...v, at: Date.now() }) : null);
  // A sheet mounted after a remount follows the step the unmounted one reached.
  try { window.dispatchEvent(new CustomEvent('biq:league-ui')); } catch { /* old WebView */ }
}
export function readLeagueUi() {
  try {
    const v = JSON.parse(get(LEAGUE_UI_KEY) || 'null');
    return v && Date.now() - v.at < 15 * 60000 ? v : null;
  } catch { return null; }
}
/** After a join or a create: tell the app to open the table (now, or on its next mount). */
export function announceLeagueOpen(id) {
  saveLeagueUi({ kind: 'open', id });
  try { window.dispatchEvent(new CustomEvent('biq:league-open', { detail: { id } })); } catch { /* old WebView */ }
}

// ── words ──
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const dayDate = (day) => new Date(day * 86400000);
/** "13 Oct" for a day index. */
export function dayLabel(day) { const d = dayDate(day); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; }
export const weekOfLabel = (weekStart) => `Week of ${dayLabel(weekStart)}`;
/** "Oslo" for Europe/Oslo, "New York" for America/New_York. */
export function zoneCity(tz) { const s = String(tz || 'UTC').split('/').pop().replace(/_/g, ' '); return s || 'UTC'; }
export function whistleLine(meta) {
  if (!meta) return '';
  if (meta.is_final) return `${weekOfLabel(meta.week_start)} · Final table`;
  return `${weekOfLabel(meta.week_start)} · Final whistle Sun midnight (${zoneCity(meta.tz)})`;
}
export function ordinal(n) {
  const v = n % 100;
  const s = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${s}`;
}
/** "=2" when shared, else "2". */
export const rankText = (rank, tied) => (tied ? `=${rank}` : String(rank));

// The Home card's "Final table is in" also clears on this device once opened,
// so it does not wait for the next fetch.
export const markFinalSeen = (id, weekStart) => set(SEEN_FINAL_PREFIX + id, String(weekStart));
const seenFinal = (id, weekStart) => Number(get(SEEN_FINAL_PREFIX + id)) >= weekStart;

/** Line 2 of the Home card. */
export function homeCardLine(l) {
  if (!l) return '';
  if (l.last_final_unseen && !seenFinal(l.id, l.week_start - 7)) return 'Final table is in';
  const pts = l.my_points || 0;
  if (!l.my_rank || (pts === 0 && !l.leader_points)) return 'Points from today, Monday to Sunday';
  const place = `${l.my_tied ? '=' : ''}${ordinal(l.my_rank)}`;
  if (l.leader_name) return l.gap > 0 ? `${place} · ${l.gap} behind ${l.leader_name}` : `${place} · level with ${l.leader_name}`;
  return `${place} · ${pts} ${pts === 1 ? 'point' : 'points'}`;
}

export const LABEL_COPY = { crown: 'Winner', spoon: 'Wooden spoon', bottled: 'Bottled it', ghost: "Didn't turn up" };

/** "The Lads, week of 13 Oct: Alex wins on 214. Wooden spoon: Sam. Bottled it: Jon." */
export function finalShareText(meta, rows) {
  const winners = rows.filter((r) => r.labels?.includes('crown')).map((r) => r.name);
  const names = (lab) => rows.filter((r) => r.labels?.includes(lab)).map((r) => r.name);
  const and = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
  const top = rows[0]?.points || 0;
  const parts = [`${meta.name}, week of ${dayLabel(meta.week_start)}:`];
  if (winners.length === 1) parts.push(`${winners[0]} wins on ${top}.`);
  else if (winners.length > 1) parts.push(`${and(winners)} share it on ${top}.`);
  else parts.push('nobody scored.');
  if (names('spoon').length) parts.push(`Wooden spoon: ${and(names('spoon'))}.`);
  if (names('bottled').length) parts.push(`Bottled it: ${and(names('bottled'))}.`);
  return parts.join(' ');
}
// The two invites are in the sharer's language (i18n step 6; English pinned
// in tests/unit/i18n-last-english.test.js). The rest of this file's copy is
// still English, like the league screens.
export const inviteShareText = (name, url) => t('share.leagueInvite', { name, url });

const GAME_NAME = { footle: 'Footle', trail: 'Transfer Trail', top10: 'Top 10', daily7: 'Daily 7' };
const h2hScore = (game, s) => (game === 'top10' ? `${s}/10` : game === 'daily7' ? `${s}/7` : s > 0 ? String(s) : 'X');
/** "Footle No. 166: 3 v your 5. Make it a week? {link}" */
export function h2hShareText(h, url) {
  if (!h || !GAME_NAME[h.game]) return null;
  const what = h.game === 'daily7' ? 'Daily 7' : t('share.h2hWhat', { game: GAME_NAME[h.game], edition: h.edition });
  return t('share.h2h', { what, mine: h2hScore(h.game, h.mine), theirs: h2hScore(h.game, h.theirs), url });
}
/** The name a head-to-head league starts with: "Alex v Sam". */
export function h2hLeagueName(rival, me) {
  const a = cleanLabel(me, 14), b = cleanLabel(rival, 14);
  return a && b ? `${a} v ${b}` : b ? `${b} v me` : "Mates' league";
}

export const ERROR_COPY = {
  bad_name: 'Pick another name for the league.',
  bad_display_name: 'Pick another name to play under.',
  rate_limited: 'Too many tries for now. Have another go in a bit.',
  too_many: "You're in ten leagues already. Leave one to join this.",
  full: 'This league is full: twenty players.',
  not_found: "That invite doesn't open a league. Ask for a fresh link.",
  offline: "Couldn't reach Ball IQ. Check your connection and try again.",
  unavailable: "Leagues aren't open yet. Try again soon.",
};
export const membersBucket = (n) => (n <= 2 ? '2' : n <= 5 ? '3-5' : '6+');
export const leagueTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
export const leagueThisWeek = (today) => leagueWeekStart(today);

// ── calls ──
// Through the app's Supabase client, loaded on demand so this file stays light
// for the screens that import it. A missing function (migration not applied)
// is remembered for the session: one quiet miss, then no more calls.
let missing = false;
async function call(name, args) {
  if (missing || isNativeShell()) return { error: { code: 'unavailable' } };
  try {
    const { supabase } = await import('../supabase.js');
    const { data, error } = await supabase.rpc(name, args || {});
    if (error) {
      if (error.code === 'PGRST202' || error.code === '42883' || /could not find the function/i.test(error.message || '')) missing = true;
      return { error };
    }
    return { data };
  } catch (e) { return { error: e }; }
}
const errCode = (r) => (r?.error ? (r.error.code === 'unavailable' || missing ? 'unavailable' : 'offline') : r?.data?.error || null);

export async function createLeague({ name, displayName, seed = 'manual' }) {
  const r = await call('create_league', { p_name: name, p_tz: leagueTz(), p_display_name: displayName, p_seed: seed });
  const err = errCode(r) || (!r.data ? 'unavailable' : null);
  if (err) return { error: err };
  setLeagueMember(true);
  flushLeagueOutbox().catch(() => {});
  return r.data;
}
export async function joinLeague({ code, displayName }) {
  const r = await call('join_league', { p_code: code, p_display_name: displayName });
  const err = errCode(r) || (!r.data ? 'unavailable' : null);
  if (err) return { error: err };
  setLeagueMember(true);
  // Results finished before joining were waiting for a session.
  flushLeagueOutbox().catch(() => {});
  return r.data;
}
export async function leaveLeague(id) { const r = await call('leave_league', { p_league_id: id }); return !r.error; }
/** [] when not in any, null when the call failed or leagues are not live. */
export async function getMyLeagues() {
  const r = await call('get_my_leagues');
  if (r.error || !Array.isArray(r.data)) return null;
  setLeagueMember(r.data.length > 0);
  return r.data;
}
export async function getLeagueTable(id, weekStart = null) {
  const r = await call('get_league_table', { p_league_id: id, p_week_start: weekStart });
  return r.error ? null : r.data || null;
}

// ── keeping a guest's league across a sign-in ──
// An anonymous player who signs in to an EXISTING account gets a new user id.
// Before the sign-in, a single-use token is issued for the anonymous id; after
// it, the account redeems it and the server moves the memberships and results.
// An email upgrade keeps the id and needs none of this.
export async function prepareLeagueClaim(fromUserId) {
  if (!fromUserId || !isLeagueMember()) return;
  const r = await call('league_issue_claim');
  if (typeof r.data === 'string' && r.data) set(CLAIM_KEY, JSON.stringify({ t: r.data, from: fromUserId, at: Date.now() }));
}
/** The number of rows moved, or null when there was nothing to redeem. */
export async function redeemLeagueClaim(userId) {
  let c = null;
  try { c = JSON.parse(get(CLAIM_KEY) || 'null'); } catch { c = null; }
  if (!c || !c.t) return null;
  if (Date.now() - c.at > 30 * 60000) { set(CLAIM_KEY, null); return null; }
  if (!userId || c.from === userId) return null;
  const r = await call('league_claim', { p_token: c.t });
  set(CLAIM_KEY, null);
  const moved = Number(r.data) || 0;
  if (moved > 0) setLeagueMember(true);
  return moved;
}
export const hasPendingLeagueClaim = () => !!get(CLAIM_KEY);
