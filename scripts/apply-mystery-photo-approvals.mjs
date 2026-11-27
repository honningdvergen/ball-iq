// apply-mystery-photo-approvals.mjs: the owner's taps on his photo review page
// become the reviewed list (R11, R12 of the Mystery Player brief, 26 Nov 2026).
//
//   node scripts/apply-mystery-photo-approvals.mjs <decisions dir> <review set players.json>
//
// <decisions dir>   one JSON file per player as the review page's database
//                   holds it (collection "decisions2"): { s: 'approve' |
//                   'reject' | 'hold', name, img, at, why }. Saved by reading
//                   the page's database; never typed by hand.
// <players.json>    the review set the page showed him: per id the Commons
//                   file, the crop and the face box of the exact picture.
//
// An APPROVE writes the id with what he saw (file, crop, face, provenance), so
// the gate in lib/photoCrop.js drops it again if the pick ever changes. A
// REJECT or HOLD removes the id if it was there: his no always wins. An id he
// has not answered is left as it is. Then run build-mystery-photo-lean.mjs.
//
// ⚠️ Nobody but the owner approves a face. This script copies decisions; it
// makes none. Identity rests on the file's provenance and on his own tap.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const [dir, playersPath] = process.argv.slice(2);
if (!dir || !playersPath) { console.error('usage: node scripts/apply-mystery-photo-approvals.mjs <decisions dir> <players.json>'); process.exit(2); }

const OUT = 'src/data/mysteryPhotoReviewed.json';
const file = JSON.parse(readFileSync(OUT, 'utf8'));
const ids = file.ids || {};
const shown = new Map(JSON.parse(readFileSync(playersPath, 'utf8')).map((p) => [p.id, p]));

let added = 0, kept = 0, removed = 0; const unknown = [];
for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const id = f.replace(/\.json$/, '');
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  if (d.s !== 'approve') { if (ids[id]) { delete ids[id]; removed++; } continue; }
  const p = shown.get(id);
  if (!p) { unknown.push(id); continue; }
  const entry = {
    file: p.file,
    crop: { x: p.crop.x, y: p.crop.y, s: p.crop.s },
    face: { x: p.face.x, y: p.face.y, w: p.face.w, h: p.face.h },
    provenance: { how: p.how, names: !!p.names, date: p.date || null, dateFits: !!p.dateFits, faces: 1 },
    approvedBy: 'Alex',
    approvedOn: String(d.at || '').slice(0, 10),
  };
  if (ids[id] && ids[id].file === entry.file && ids[id].crop.x === entry.crop.x && ids[id].crop.y === entry.crop.y && ids[id].crop.s === entry.crop.s) { kept++; continue; }
  ids[id] = entry; added++;
}
// Stable order, so a later batch is a readable diff.
file.ids = Object.fromEntries(Object.entries(ids).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
writeFileSync(OUT, JSON.stringify(file, null, 2) + '\n');
console.log(`approved and written: ${added} new, ${kept} unchanged; taken off after a reject or hold: ${removed}; on the list now: ${Object.keys(file.ids).length}`);
if (unknown.length) console.log(`approved on the page but not in this review set, NOT written: ${unknown.join(', ')}`);
