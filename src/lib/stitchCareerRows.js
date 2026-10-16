// Stitch-up: the Mystery half of the verified careers, as rows the Trail
// engine can play. Pure; used by scripts/gen-stitch-careers.mjs to write
// src/data/stitchCareers.json, and by the unit test that fails when that file
// has drifted from its sources.
//
// ⚠️ ONLY THE SCHEDULED MYSTERY ANSWERS. Their careers are the ones the Mystery
// reveal already prints as fact, with the checked corrections laid over them
// (mysteryCareerFixes.json, via withCareerFixes). The other ~8,600 careers in
// mysteryCareers.json are raw Wikidata and are never offered here: a
// stitch-up prints the career it is built from.
import { careerOf, withCareerFixes } from './mysteryCareer.js';

const POS = { goalkeeper: 'Goalkeeper', defender: 'Defender', midfielder: 'Midfielder', forward: 'Forward' };

/** Clubs in order, a spell split in two by the file counted once. */
export function stitchClubsFromCareer(spells) {
  const out = [];
  for (const sp of spells) if (out[out.length - 1] !== sp.club) out.push(sp.club);
  return out;
}

/**
 * [{ id, name, nat, pos, clubs }] for every scheduled answer with three or
 * more senior clubs (two show at the start, so a two-club career would be
 * solved by its own board). Order follows the schedule; duplicates dropped.
 */
export function buildMysteryStitchRows({ schedule, pool, careers, fixes }) {
  const fixed = withCareerFixes(careers, fixes);
  const byId = new Map(pool.map((p) => [p.id, p]));
  const seen = new Set();
  const rows = [];
  for (const id of schedule) {
    if (seen.has(id)) continue;
    seen.add(id);
    const p = byId.get(id);
    if (!p) continue;
    const clubs = stitchClubsFromCareer(careerOf(p, fixed));
    if (clubs.length < 3) continue;
    rows.push({ id, name: p.name, nat: p.nat || '', pos: POS[p.position] || '', clubs });
  }
  return rows;
}
