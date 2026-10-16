// Stitch-up: which footballers a player may build a Trail from (16 Oct 2026).
//
// ⚠️ VERIFIED CAREERS ONLY. A stitch-up prints a career as fact to someone who
// cannot check it, so it is built from exactly two sources:
//   · the Transfer Trail careers (TRAIL_PLAYERS: hand-checked, loans marked,
//     house spellings), which win wherever a player is in both;
//   · the scheduled Mystery Player answers, with the checked corrections laid
//     over them (src/data/stitchCareers.json, written by
//     scripts/gen-stitch-careers.mjs from the same files the Mystery reveal
//     prints its career from).
// Never the other ~8,600 careers in mysteryCareers.json.
//
// Lazy: only the Stitch-up screen imports this (Home's eager budget).
import { TRAIL_PLAYERS, getTrailAnswerForDayIndex, getTrailDayIndex, normaliseGuess } from './trail.js';
import { answerIdForDay } from './mysteryPlayer.js';
import MYSTERY_ROWS from '../data/stitchCareers.json';
import MYSTERY_SCHEDULE from '../data/mysterySchedule.json';
import { stitchHash, STITCH_MIN_SHOWN } from './stitchToken.js';

const nameKey = (s) => normaliseGuess(s);

function fromTrail(p) {
  return { ...p, id: `t:${p.key}`, name: (p.display || []).join(' '), src: 't' };
}
function fromMystery(r) {
  const words = String(r.name || '').trim().split(/\s+/);
  const display = words.length > 1 ? [words[0], words.slice(1).join(' ')] : [words[0]];
  return {
    key: `M_${r.id}`, id: `m:${r.id}`, name: r.name, display, nat: r.nat || '', pos: r.pos || '',
    clubs: r.clubs, loans: r.clubs.map(() => false), src: 'm',
  };
}

let ALL = null;
/** Every verified career, both sources, duplicates included (for old links). */
function all() {
  if (!ALL) ALL = [...TRAIL_PLAYERS.filter((p) => p?.clubs?.length >= 3).map(fromTrail), ...MYSTERY_ROWS.map(fromMystery)];
  return ALL;
}

/**
 * Today's daily answers, a day either side: a stitch-up must not hand anyone
 * the Trail or the Mystery Player they are about to play. By name, so a
 * Mystery answer who is also a Trail career is caught under either.
 */
export function dailyAnswerNames(now = new Date()) {
  const out = new Set();
  const day = getTrailDayIndex(now);
  for (let d = day - 1; d <= day + 1; d++) {
    const t = getTrailAnswerForDayIndex(d);
    if (t) out.add(nameKey((t.display || []).join(' ')));
    const mid = answerIdForDay(MYSTERY_SCHEDULE, d);
    const m = mid && MYSTERY_ROWS.find((r) => r.id === mid);
    if (m) out.add(nameKey(m.name));
  }
  return out;
}

/** The players a sender may pick from: one row a player, Trail careers first. */
export function stitchPlayers(now = new Date()) {
  const skip = dailyAnswerNames(now);
  const seen = new Set();
  const out = [];
  for (const p of all()) {
    const k = nameKey(p.name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    if (skip.has(k)) continue;
    out.push(p);
  }
  return out;
}

export const stitchHashOf = (p) => stitchHash(p.id);

/** The player behind a link's hash, or null. Searches both sources whole, so a
 *  link made before a Mystery answer gained a Trail career still opens. */
export function findStitchPlayer(hash) {
  if (!hash) return null;
  return all().find((p) => stitchHash(p.id) === hash) || null;
}

/** Clubs a sender may show at the start: two up to one short of the career. */
export function stitchShownRange(p) {
  const n = p?.clubs?.length || 0;
  return { min: STITCH_MIN_SHOWN, max: Math.max(STITCH_MIN_SHOWN, n - 1) };
}

/** Name search for the builder: word starts first, then anywhere. */
export function searchStitchPlayers(list, q, limit = 8) {
  const k = nameKey(q);
  if (k.length < 2) return [];
  const starts = [], within = [];
  for (const p of list) {
    const words = String(p.name).split(/[\s-]+/).map(nameKey);
    if (nameKey(p.name).startsWith(k) || words.some((w) => w.startsWith(k))) starts.push(p);
    else if (nameKey(p.name).includes(k)) within.push(p);
    if (starts.length >= limit) break;
  }
  return [...starts, ...within].slice(0, limit);
}

/** A few names to start from, different each visit, Trail careers only (the
 *  best-known names, hand-checked). */
export function stitchIdeas(list, n = 5, rnd = Math.random) {
  // A partial shuffle: always n steps, whatever rnd returns.
  const pool = list.filter((p) => p.src === 't');
  const k = Math.min(n, pool.length);
  for (let i = 0; i < k; i++) {
    const j = i + Math.min(pool.length - i - 1, Math.floor(Math.max(0, rnd()) * (pool.length - i)));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, k);
}
