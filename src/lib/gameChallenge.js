// "Challenge a mate" for Footle, Transfer Trail and Top 10 (16 Oct 2026; the
// daily design pass's item 5). Daily 7 has had its own /c/SCORE.YYYYMMDD link
// and head-to-head screen since 1.1; this is the same loop for the other three,
// kept deliberately small: one link shape, one banner, one line on the finish.
//
//   balliq.app/c/f.166.3.Alex   Footle No. 166, solved in 3 guesses (0 = missed)
//   balliq.app/c/t.75.2.Alex    Transfer Trail No. 75, got him on club 2 (0 = missed)
//   balliq.app/c/x.5.7.Alex     Top 10 No. 5, 7 of 10
//
// api/c.js unfurls it as a card and sends a person to /play?game=…&gc=TOKEN;
// the boot stores the challenge here and the game screen reads it back. A
// challenge only counts on the SAME puzzle number: anything else is dropped,
// because comparing two different boards would be a lie.

import { t } from '../i18n/index.js';

export const GAME_CODES = { footle: 'f', trail: 't', top10: 'x' };
const BY_CODE = { f: 'footle', t: 'trail', x: 'top10' };
const MAX = { footle: 6, trail: 12, top10: 10 };
const KEY = 'biq_game_challenge';

const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{N} '._-]/gu, '').trim().slice(0, 22);

/** The link a player sends. `score`: guesses or clubs used (0 = missed), or the Top 10 score. */
export function challengeToken(game, edition, score, name = '') {
  const code = GAME_CODES[game];
  if (!code || !Number.isInteger(edition) || edition < 1) return null;
  const s = Math.max(0, Math.min(MAX[game], Math.round(score || 0)));
  const n = cleanName(name);
  return `${code}.${edition}.${s}${n ? '.' + encodeURIComponent(n).replace(/\./g, '%2E') : ''}`;
}

export function parseChallengeToken(token) {
  const m = /^([ftx])\.(\d{1,5})\.(\d{1,2})(?:\.(.+))?$/.exec(String(token || '').trim());
  if (!m) return null;
  const game = BY_CODE[m[1]];
  const score = parseInt(m[3], 10);
  if (score > MAX[game]) return null;
  let name = '';
  try { name = m[4] ? decodeURIComponent(m[4]) : ''; } catch { name = m[4] || ''; }
  return { game, edition: parseInt(m[2], 10), score, name: cleanName(name) };
}

/** Lower is better for Footle and Trail (0 = missed, the worst); higher for Top 10. */
export function compareScores(game, mine, theirs) {
  if (game === 'top10') return Math.sign(mine - theirs);
  const rank = (s) => (s > 0 ? s : 99);
  return Math.sign(rank(theirs) - rank(mine));
}

/**
 * "3/6", "X/6", "2 clubs", "7/10": how a score reads in one short line. Pass
 * `t` for the player's own language (the finish panel); without it the line
 * stays English, for the challenge text that goes out to someone else.
 */
export function scoreLabel(game, s, t) {
  if (game === 'footle') return s > 0 ? `${s}/6` : 'X/6';
  if (game === 'trail') {
    if (t) return s > 0 ? t('gc.clubs', { count: s }) : t('gc.missed');
    return s > 0 ? `${s} ${s === 1 ? 'club' : 'clubs'}` : 'missed';
  }
  return `${s}/10`;
}

/** What the challenger did, for the banner: "Alex solved it in 3". */
export function challengeLine({ game, score, name }) {
  const who = name || t('gc.aMate');
  if (game === 'top10') return t('gc.got10', { who, score });
  if (score <= 0) return t('gc.missedIt', { who });
  if (game === 'footle') return t('gc.solvedIn', { who, score });
  return t('gc.gotHim', { who, count: score });
}

export function storeChallenge(c) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...c, at: Date.now() })); } catch { /* private mode */ }
}

/** The stored challenge for this game and puzzle, or null. */
export function readChallenge(game, edition) {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!c || c.game !== game || c.edition !== edition) return null;
    return c;
  } catch { return null; }
}
