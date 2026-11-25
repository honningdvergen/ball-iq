// The sums behind the signed-in Profile on a phone (screens/ProfileScreen.jsx,
// 25 Nov 2026): where a player stands among their mates, what is next for
// them (the next rank, the nearest badge, the weakest area), and how many
// badges they hold. Alex, of the scouting report this replaced: "This has to
// have value for the players, do they care about their accuracy, daystreak and
// longest run? I do not really think so?"
//
// Pure, so every rule here has a test (tests/unit/profile-next.test.js). Only
// the Profile's own chunk imports this file: nothing here reaches Home.
import { LEVELS, getLevelInfo, computeBadges, MIN_RATED_ANSWERS } from './scoring.js';
import { computeCard } from './ballIqCard.js';

/**
 * A mate's rating: the big number on their own card, or null while they have
 * too few answers for one.
 *
 * `p` is a profiles row as the friends query returns it. The lifetime the card
 * needs is the `correct_answers` COLUMN beside the blob's `totalAnswered`,
 * never a `totalCorrect` inside the blob (it is null there for every account):
 * the friend profile screen learned that on 11 Sep 2026, when a mate read 69
 * to his friends and 74 to himself. The pinned league travels with it.
 */
export function mateRating(p) {
  const st = (p?.stats && typeof p.stats === 'object') ? p.stats : {};
  const card = computeCard(st.catStats || {}, undefined, { c: p?.correct_answers || 0, a: st.totalAnswered || 0 }, st.cardLeague);
  return card.rated ? card.overall : null;
}

/**
 * The mates table: the player's own row among their mates, best rating first.
 *
 * It ranks on RATING because the card's big number is the rating (the old
 * friends table ranked on total score, a number the card never shows). A mate
 * with no rating yet comes after every rated one. Equal ratings, and the
 * unrated among themselves, fall back to total score, then to the name so the
 * order never flips between two visits.
 *
 * Each row: { id, username, rating (number or null), score, isMe, ... }.
 * Returns new rows with `place` (1, 2, 3 ...) added; nothing is mutated.
 */
export function rankMates(me, mates = []) {
  const rows = [...mates.map((m) => ({ ...m, isMe: false })), { ...me, isMe: true }];
  const rated = (r) => Number.isFinite(r.rating);
  rows.sort((a, b) => {
    if (rated(a) !== rated(b)) return rated(a) ? -1 : 1;
    if (rated(a) && a.rating !== b.rating) return b.rating - a.rating;
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    return String(a.username || '').localeCompare(String(b.username || ''));
  });
  return rows.map((r, i) => ({ ...r, rating: rated(r) ? r.rating : null, place: i + 1 }));
}

// A record with every number at its largest, however deep it is asked: any
// field reads as another one of these, and any comparison reads it as the
// biggest whole number there is. computeBadges, handed this, awards every
// badge it has a rule for.
const everything = () => new Proxy(function max() {}, {
  get: (_, key) => (key === Symbol.toPrimitive ? () => Number.MAX_SAFE_INTEGER : everything()),
});

/**
 * The badges a player can really win, out of `ids`, in the same order.
 *
 * Asked of computeBadges itself, not kept as a list: a badge the wall draws
 * but no rule awards (Globetrotter, "100 International Qs", on 25 Nov 2026)
 * is left out, and comes back by itself the day it gets a rule. The phone
 * counts, offers and draws only these: "7 of 12" promised a twelfth nobody
 * could get, and a player holding the other eleven saw it as their nearest
 * badge for ever.
 */
export function awardableBadges(ids) {
  const can = computeBadges(everything(), Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  return ids.filter((id) => can.has(id));
}

/** "N of M": the badges held out of the badges there are. An id the wall does not draw is not counted. */
export function badgeCount(earned, ids) {
  const has = earned instanceof Set ? earned : new Set(earned || []);
  return { n: ids.filter((id) => has.has(id)).length, m: ids.length };
}

// What a badge counts, from the same fields computeBadges (lib/scoring.js)
// awards it on, so a line like "Day 3 of 5" turns into the badge at the very
// moment it says it will. The test holds every `need` here to computeBadges.
//
// Three badges are NOT here, on purpose, and so never show a figure:
//   big_brain, goat: a best IQ is not a count from nought, so "118 of 120"
//     would read as nearly there for a score most rounds land near anyway;
//   world_class: computeBadges has no rule that awards it (and the phone
//     does not show it at all: awardableBadges above).
// `kind` picks the words of the grey line (ProfileScreen: sp.bd.<kind>).
const BADGE_MEASURES = {
  first_blood: { need: 1,    kind: 'games',   of: (d) => d.stats.gamesPlayed },
  roll5:       { need: 5,    kind: 'day',     of: (d) => d.streak },
  roll30:      { need: 30,   kind: 'day',     of: (d) => d.streak },
  speed_demon: { need: 12,   kind: 'best',    of: (d) => d.stats.bestHotStreak },
  perfect:     { need: 10,   kind: 'best',    of: (d) => d.stats.bestScore },
  survivor:    { need: 20,   kind: 'best',    of: (d) => d.stats.bestStreak },
  scholar:     { need: 500,  kind: 'correct', of: (d) => d.stats.totalCorrect },
  faithful:    { need: 50,   kind: 'games',   of: (d) => d.stats.gamesPlayed },
  legend_xp:   { need: 3000, kind: 'xp',      of: (d) => d.xp },
};
export const badgeNeed = (id) => BADGE_MEASURES[id]?.need ?? null;

/**
 * The badge nearest to being won.
 *
 * Among the badges not yet held whose progress the player's own numbers
 * measure, the one with the largest share done; equal shares go to the one
 * with less left. `streak` is the streak running TODAY: a best streak of five
 * would already have won the badge, so what is left to count is the current run.
 *
 * Returns { id, have, need, kind } for that badge;
 *         { id, plain: true } when nothing measurable has been started: the
 *         first badge not held, in the wall's own order, to be shown with its
 *         plain criteria and no figure;
 *         null when every badge is held (the row is left out).
 */
export function nearestBadge({ ids, earned, stats, xp, streak }) {
  const has = earned instanceof Set ? earned : new Set(earned || []);
  const open = ids.filter((id) => !has.has(id));
  if (!open.length) return null;
  const d = { stats: stats || {}, xp: xp || 0, streak: streak || 0 };
  let best = null;
  for (const id of open) {
    const m = BADGE_MEASURES[id];
    if (!m) continue;
    const have = Math.floor(Number(m.of(d)) || 0);
    // Nothing started is not progress; and a count already at its mark on a
    // badge not held means the two disagree, so no figure is printed for it.
    if (have <= 0 || have >= m.need) continue;
    const cand = { id, have, need: m.need, kind: m.kind };
    // Shares compared as cross products, so 1 of 5 and 6 of 30 are exactly equal.
    const diff = best ? have * best.need - best.have * m.need : 1;
    if (diff > 0 || (diff === 0 && m.need - have < best.need - best.have)) best = cand;
  }
  return best || { id: open[0], plain: true };
}

/**
 * The next rank on the ladder: { top: false, name, toGo } with the XP still
 * needed, or { top: true, name } on the last rung, where `name` is the rank
 * the player holds.
 */
export function nextRank(xp) {
  const { level, nextLevel } = getLevelInfo(xp || 0);
  return nextLevel
    ? { top: false, name: nextLevel.name, toGo: Math.max(0, nextLevel.xpNeeded - (xp || 0)) }
    : { top: true, name: level.name };
}

/**
 * The ladder as its screen draws it: every rank with where the player stands
 * on it ('done' | 'cur' | 'next' | 'far'), and the share of the way from the
 * rank held to the next (100 on the last rung).
 */
export function ladder(xp) {
  const { level, nextLevel, progress } = getLevelInfo(xp || 0);
  const cur = LEVELS.indexOf(level);
  return {
    level, nextLevel, pct: Math.max(0, Math.min(100, progress)),
    toGo: nextLevel ? Math.max(0, nextLevel.xpNeeded - (xp || 0)) : 0,
    rows: LEVELS.map((l, i) => ({ name: l.name, xpNeeded: l.xpNeeded, state: i < cur ? 'done' : i === cur ? 'cur' : i === cur + 1 ? 'next' : 'far' })),
  };
}

/**
 * The verdict the old scouting report made, kept for two lines of the new
 * screen: the weakest area (the "Needs work" row) and what kind of player
 * this is (the card's second line).
 *
 * Only areas with enough of the player's OWN answers count: computeCard seeds
 * an unplayed area from the overall, and ranking those would name a weakest
 * area the player has never played. A weakest needs two rated areas; a
 * specialist needs five points between the best and the weakest.
 * `identity`: 'specialist' (of `strongest`), 'allRounder' or 'rising'.
 */
export function verdict(card) {
  const played = [...(card?.ratings || [])].filter((r) => r.answered >= MIN_RATED_ANSWERS).sort((a, b) => b.rating - a.rating);
  const strongest = played[0] || null;
  const weakest = played.length >= 2 ? played[played.length - 1] : null;
  const spread = strongest && weakest ? strongest.rating - weakest.rating : 0;
  return { strongest, weakest, identity: strongest && spread >= 5 ? 'specialist' : played.length >= 3 ? 'allRounder' : 'rising' };
}

/**
 * A card label as running text: "CLUBS" is "Clubs", "LA LIGA" is "La Liga";
 * "EPL" and "UCL" are initials and stay as they are.
 */
export function faceWord(abbr) {
  const s = String(abbr || '');
  if (/^[A-Z]{2,3}$/.test(s)) return s;
  return s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, sp, ch) => sp + ch.toUpperCase());
}
