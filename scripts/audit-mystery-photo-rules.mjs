// audit-mystery-photo-rules.mjs — what the A4 "right person or no photo"
// rules leave, measured on the photo data already on file (no fetch).
//
//   node scripts/audit-mystery-photo-rules.mjs
//
// A photo may be used only when ALL hold, checked in this order:
//   1. a record exists in src/data/mysteryPhotos.json for that player id
//   2. it is the Wikidata image (P18) of that same id: its Commons page names
//      exactly the file scripts/_mystery-p18.json holds for the id. That is
//      how fetch-mystery-photos.mjs builds the file: it asks Wikidata for
//      `wd:<id> wdt:P18 ?img` and stores the answer under the same id, never
//      by a name search, so a namesake cannot swap in.
//   3. a face box exists (src/data/playerFaces.json) and found exactly ONE face
//   4. the face confidence is at or above FACE_CONF_MIN
//   5. licence and author are both present
// Rules for the CROP and the RESOLUTION (R8, R12) need the original picture
// size and the raw face box, which the data on file does not hold; they are
// applied by scripts/mystery-photo-pass.mjs on the answers and famous players.
import { readFileSync } from 'fs';

/**
 * ⚠️ WHY 0.65. Vision's confidence on the 7,743 single-face boxes on file runs
 * 0.58 to 0.93, median 0.81, and is unimodal: it is not a face/no-face switch.
 * The bottom tail under 0.65 (64 boxes, under 1%) is where a detector picks a
 * badge, a crowd or a blurred head; above it the distribution is smooth. So the
 * floor cuts that tail and nothing else; the human review does the rest.
 */
export const FACE_CONF_MIN = 0.65;

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const pool = read('src/data/mysteryPool.json');
const answers = read('src/data/mysteryAnswers.json');
const PHOTOS = read('src/data/mysteryPhotos.json');
const FACES = read('src/data/playerFaces.json');
const P18 = read('scripts/_mystery-p18.json');
const fileOf = (u) => decodeURIComponent(String(u || '').split('/wiki/File:')[1] || '').replace(/_/g, ' ');

export function photoVerdict(id) {
  const ph = PHOTOS[id];
  if (!ph) return 'no photo record';
  if (!P18[id] || fileOf(ph.page) !== String(P18[id]).replace(/_/g, ' ')) return 'not the P18 of this id';
  const f = FACES[id];
  if (f === false) return 'no face detected';
  if (!f) return 'never run through the detector';
  if (f.faces !== 1) return 'more than one face';
  if (!(f.conf >= FACE_CONF_MIN)) return `face confidence under ${FACE_CONF_MIN}`;
  if (!ph.licence || !ph.author) return 'no licence or author';
  return 'ok';
}

function tally(ids) {
  const c = {};
  for (const id of ids) { const v = photoVerdict(id); c[v] = (c[v] || 0) + 1; }
  return c;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('pool   ', pool.length, JSON.stringify(tally(pool.map((p) => p.id))));
  console.log('answers', answers.length, JSON.stringify(tally(answers)));
}
