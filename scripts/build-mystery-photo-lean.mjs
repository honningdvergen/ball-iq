// build-mystery-photo-lean.mjs — the ONE photo file the Mystery play screen
// reads (A4), carrying a photo ONLY for ids on the reviewed list (R11, R12).
//
//   node scripts/build-mystery-photo-lean.mjs
//
// In:  scripts/_mystery-photo-picks.json   per id: the current Wikidata image
//                                           and any proposed better one, each
//                                           with its provenance, face box and
//                                           crop (scripts/mystery-photo-pass.mjs)
//      src/data/mysteryPhotoReviewed.json  { ids: { id: { file, crop, … } } }
// Out: src/data/mysteryPhotoLean.json      { id: { u, w, h, x, y, s, hero, list, a, l, pg } }
//        u   the original file's URL on upload.wikimedia.org (commonsThumb()
//            in lib/photoCrop.js turns it into the thumbnail to fetch)
//        w,h the original picture's size
//        x,y,s  the crop: left / width, top / height, side / width
//        hero, list  the thumbnail width that gives the 104 / 52 crop 3x its
//            display size, or 0 when the picture cannot serve that size
//        a, l, pg  author, licence, Commons page (the "Photo credits" sheet)
//
// ⚠️ THE GATE. An id is written only if it is on the reviewed list AND the
// picture and crop the owner approved are still exactly what the picks file
// holds (file name and crop numbers). A re-run of the photo pass that changes
// either drops the id until it is approved again. The list starts EMPTY, so
// the first build of the screens shows the shirt in a ring for everyone.
// tests/unit/mystery-photo-gate.test.js fails the build on any drift.
import { readFileSync, writeFileSync } from 'fs';
import { leanPhotos } from '../src/lib/photoCrop.js';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const picks = read('scripts/_mystery-photo-picks.json');
const reviewed = read('src/data/mysteryPhotoReviewed.json').ids || {};
const { out, dropped } = leanPhotos(picks, reviewed);
writeFileSync('src/data/mysteryPhotoLean.json', JSON.stringify(out));
console.log(`photos written: ${Object.keys(out).length} (reviewed: ${Object.keys(reviewed).length})`);
if (dropped.length) console.log(`reviewed but changed since, NOT written: ${dropped.join(', ')}`);
