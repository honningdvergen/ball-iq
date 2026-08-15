// Shared player-name autocomplete for the guess-a-footballer modes.
//
// ONE implementation on purpose. Mystery Player and Transfer Trail both ask a
// player to type a name, and the ranking below was tuned against real queries
// (see the tuning notes in each branch). Two copies would drift the first time
// one was touched — which is exactly how the standalone CSS mirror, the pool
// nationality pass and the dob pass all silently reverted on 2026-08-14/15.
//
// ── HOW IT RANKS, and why it is not just a substring filter ──────────────────
// The pool is 9k+ deep, so plain `includes()` buries the obvious answer:
//   "saka"   → 32 matches, mostly Sakai / Sakamoto / Sakaguchi / Hosaka.
//   "shaw"   → Shawcross and Earnshaw sat level with Luke Shaw.
// Before this, the good answer only came first because the pool FILE happened
// to be fame-ordered — nothing in the code put it there, and any re-export
// would have moved it.
//
// FAME LEADS, position breaks ties. People mostly search a surname, but plenty
// of players are known by their first name, and "james" is the case that fixes
// the weighting: the expected order is James Rodríguez (90), James Milner (63),
// Reece James (55), David James (48) — fame order, first names and surnames
// interleaved. So the positional bonuses sit in the SAME range as a fame gap,
// never above it. An earlier attempt used +1000 surname vs +250 first-name — a
// gap fame (max 211) can never close — and it buried James Rodríguez.
import { normaliseName } from './mysteryPlayer.js';

export function scorePlayerMatch(p, q) {
  const full = normaliseName(p.name);
  const parts = full.split(' ').filter(Boolean);
  let s = 0;
  // 60, not 250: a mononym's full name IS a partial query. At 250, typing
  // "ronaldo" put R9 (fame 124) above Cristiano (fame 211), which is not who
  // anyone means.
  if (full === q) s = 60;
  else if (parts.some((w) => w === q)) s = 45;        // Saka · Reece James · James Milner
  else if (parts.some((w) => w.startsWith(q))) s = 25; // Sakai · Shawcross
  // else buried mid-word (Hosaka, Earnshaw) — fame alone
  s += p.fame || 0;
  // Recency nudge, smaller still: settles same-surname pile-ups (35 players
  // match "santos" and the 1950s Brazilians outrank the current ones on fame)
  // without reordering real prominence. At +30 it flipped André Silva above
  // Thiago Silva, whose fame is 23 higher — hence 12.
  if (p.born >= 1995) s += 12; else if (p.born >= 1985) s += 6;
  return s;
}

/**
 * @param {Array} pool     player records ({ id, name, fame, born, club })
 * @param {string} text    raw user input
 * @param {object} [opts]  { exclude?: Set<id>, limit?: number }
 * @returns {Array} ranked player records, best first
 */
export function rankPlayerSuggestions(pool, text, opts = {}) {
  const q = normaliseName(text);
  // Two characters minimum: one letter matches thousands and is never a real
  // intent, and rendering that list on every keystroke janks a mid-range phone.
  if (q.length < 2) return [];
  const { exclude, limit = 8 } = opts;
  return pool
    .filter((p) => (!exclude || !exclude.has(p.id)) && normaliseName(p.name).includes(q))
    .map((p) => ({ p, s: scorePlayerMatch(p, q) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

/**
 * Subtitle under a suggested name, used to tell two players apart.
 *
 * ⚠️ NATIONALITY IS DELIBERATELY ABSENT. `nat` is unreliable on a chunk of the
 * pool — it collapses toward the CLUB's country, so Messi, Vinícius Júnior and
 * James Rodríguez all read "Spain". Birth year separates the two Ronaldos
 * (1976 / 1985 / 1965) without asserting anything false.
 */
export function suggestionSubtitle(p) {
  return [p.born, p.club].filter(Boolean).join(' · ');
}
