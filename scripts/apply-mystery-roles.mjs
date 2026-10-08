#!/usr/bin/env node
/**
 * Write the checked roles in src/data/mysteryRoles.json back to the pool's
 * RANKING fields, so the position clue and the ranks agree.
 *
 * WHY. `slot` (100 points) and `position` (50) are Wikidata tokens. The clue
 * stopped trusting them on 2026-10-08 and prints a source-checked role
 * instead, which left days where the two disagreed: the clue said
 * "midfielder" and every defender guessed was ranked a band closer. Alex's
 * ruling the same day: it should not be confusing to players.
 *
 * WHAT IT DOES, for each answer with a checked role:
 *   · `slot` becomes the role's line (GK / DF / MF / FW).
 *   · `position` becomes the role's own word, with two exceptions. A winger
 *     already labelled "wing half" keeps that token: it is what 537 of the
 *     pool's wingers carry, so it is the token that still matches them. And
 *     the one real wing half is filed as a midfielder, which is what a
 *     half-back was.
 * A role recorded as null (the sources disagree) is left alone.
 *
 * WHAT IT MOVES. Only ranks: on that player's own day every guess is scored
 * against the corrected line, and as a guess on other days he moves by the
 * same 100 or 50 points. The schedule is not read or written; no day changes
 * its answer.
 *
 * Idempotent, and it has to be: build-mystery-pool-v2.mjs rebuilds the pool
 * from Wikidata and would undo all of this. Re-run after any rebuild;
 * audit-mystery-schedule.mjs fails the build until you do.
 *
 * Usage: node scripts/apply-mystery-roles.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { roleLine } from '../src/lib/mysteryPlayer.js';

const FILE = new URL('../src/data/mysteryPool.json', import.meta.url);
const pool = JSON.parse(readFileSync(FILE, 'utf8'));
const roles = JSON.parse(readFileSync(new URL('../src/data/mysteryRoles.json', import.meta.url), 'utf8'));

export function rankingTokens(role, current) {
  const slot = roleLine(role);
  if (role === 'wing half') return { slot, position: 'midfielder' };
  if (role === 'winger' && current === 'wing half') return { slot, position: current };
  return { slot, position: role };
}

const byId = new Map(pool.map((p) => [p.id, p]));
const moved = [];
for (const [id, role] of Object.entries(roles)) {
  if (role === null) continue;
  const p = byId.get(id);
  if (!p) throw new Error(`${id} has a checked role but is not in the pool`);
  const want = rankingTokens(role, p.position);
  if (!want.slot) throw new Error(`${id}: "${role}" is not a position the ranking knows`);
  if (p.slot === want.slot && p.position === want.position) continue;
  moved.push(`${p.slot}/${p.position} -> ${want.slot}/${want.position}${p.slot !== want.slot ? '   (line moved)' : ''}`);
  p.slot = want.slot;
  p.position = want.position;
}

if (!process.argv.includes('--dry') && moved.length) writeFileSync(FILE, JSON.stringify(pool, null, 2));
// Counts only: the rows are tomorrow's answers and this prints into build logs.
const tally = {};
for (const m of moved) tally[m] = (tally[m] || 0) + 1;
console.log(`${moved.length} pool row(s) brought in line with their checked role`);
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(2)} × ${k}`);
