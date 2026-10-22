// Builds src/data/draftLanes.json: which side of the pitch each Draft player
// played on, so the Draft pitch puts Salah on the right wing and Rio Ferdinand
// in the middle of the back four (Alex, 22 Oct 2026: both landed on the left,
// because the squad tables only know GK/DF/MF/FW and the pitch filled each line
// from the left).
//
//   node scripts/gen-draft-lanes.mjs <infobox.json>
//
// The input maps each player's Wikidata id to the `position` field of his
// English Wikipedia infobox (fetched for the 3,742 Draft players on 22 Oct
// 2026, kept in ~/ball-iq-audit/2026-10-22/draft-roles/). The FIRST position
// listed is his main one and the only one read. A lane is display only: the
// season model never sees it.
//   L / R   a sided role: left-back, right winger, left wing-back …
//   C       a central one: centre-back, striker, central/defensive/attacking mid
//   W       wide but no side given: winger, full-back, wide midfielder
// A bare "defender", "midfielder" or "forward" says nothing about where, and
// such a man gets no lane: the pitch fills him into whatever place is left.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) { console.error('usage: node scripts/gen-draft-lanes.mjs <infobox.json>'); process.exit(1); }
const box = JSON.parse(readFileSync(src, 'utf8'));
const squads = JSON.parse(readFileSync(join(ROOT, 'src/data/draftSquads.json'), 'utf8')).squads;

// The infobox's wikitext down to plain words: links to their shown text,
// references and templates dropped.
export const plain = (s) => (s || '')
  .replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  .replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').toLowerCase().trim();

export function lane(field) {
  const first = plain(field).split(/,|\/|;|\bor\b|\band\b|<br|\n/)[0].trim().replace(/[-\s]+/g, ' ');
  if (!first) return null;
  const side = /\bleft\b/.test(first) ? 'L' : /\bright\b/.test(first) ? 'R' : null;
  if (side && /(back|wing|winger|midfielder|forward|half|defender|wide)/.test(first)) return side;
  if (/(centre|center|central) (back|half|defender)|sweeper|stopper|libero/.test(first)) return 'C';
  if (/striker|(centre|center) forward|second striker|target man|false (9|nine)/.test(first)) return 'C';
  if (/(defensive|central|centre|center|attacking|holding|box to box|deep lying) midfielder|playmaker/.test(first)) return 'C';
  if (/winger|full back|fullback|wing back|wide midfielder|outside forward|wing half/.test(first)) return 'W';
  return null;
}

const ids = new Set(squads.flatMap((q) => q[10].map((r) => r[0])));
const out = { L: [], R: [], C: [], W: [] };
let none = 0;
for (const id of [...ids].sort((a, b) => a - b)) {
  const l = lane(box['Q' + id]);
  if (l) out[l].push(id); else none++;
}
writeFileSync(join(ROOT, 'src/data/draftLanes.json'), JSON.stringify(out) + '\n');
console.log(`draftLanes: L ${out.L.length} · R ${out.R.length} · C ${out.C.length} · W ${out.W.length} · no lane ${none} (of ${ids.size})`);
