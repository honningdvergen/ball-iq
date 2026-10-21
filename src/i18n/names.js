// The names the game's own tables keep in English (lib/scoring.js's LEVELS,
// lib/ballIqCard.js's tiers and faces), in the player's language. Here and not
// in those files: api/og.js imports them at the edge, and the share card
// prints their English.
import { t } from './index.js';
import { LEVELS } from '../lib/scoring.js';

/**
 * lib/date.js formatCountdown ("5h 12m" · "12m" · "soon", kept English and
 * dependency-free there) in the player's language: the time.* keys, "12 h 0 min"
 * in Spanish. Same rounding.
 */
export function countdownText(ms) {
  if (ms <= 0) return t('time.soon');
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h === 0 ? t('time.m', { m }) : t('time.hm', { h, m });
}

/** A level ("Non-League"): the lvl.<index> keys. An unknown name passes through. */
export function levelName(name) {
  const i = LEVELS.findIndex((l) => l.name === name);
  return i < 0 ? name : t(`lvl.${i}`);
}

/** A card tier ('gold' | 'silver' | 'bronze'): the tier.* keys. */
export const tierName = (tier) => t(`tier.${tier}`);

/**
 * A card face's competition (a CARD_COMPS row): its `name`, or its `short`
 * when `short` is set. Premier League and Champions League read the same in
 * both languages; the rest are the cc.* keys.
 */
export function compName(r, short = false) {
  const k = `cc.${r.cat}${short ? '.s' : ''}`;
  const v = t(k);
  return v === k ? (short ? r.short || r.name : r.name) : v;
}
