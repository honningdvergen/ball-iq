// audit-photo-standard.mjs — measure the lineup pool against the photo bar.
//
//   node scripts/audit-photo-standard.mjs
//
// THE BAR (Alex, twice, verbatim): "quality standardized photos for each
// player, cropped so their heads are the same size" · "high resolution photos
// for everyone". Until this file existed, "standardized" was an intention with
// nothing measuring it, which is how 20% of the pool ended up rendering heads
// at the wrong size without anyone noticing.
//
// ── THE TWO RENDER PATHS, AND WHY ONE IS STRUCTURALLY CORRECT ────────────────
//
// CUTOUT (978 players): background removed, face box stored, and the renderer
// scales the head to a FIXED fraction of the disc. Head size is uniform BY
// CONSTRUCTION — you cannot get it wrong, because the scale is solved for.
//
// CROP BOX (5,463 players): a square crop of the original photo, sized
// side = min(1, faceWidth / TARGET_FACE). The face fills exactly TARGET_FACE
// of the card... unless that min() CLAMPS. When the face is already wider than
// TARGET_FACE of the source image, the crop becomes the whole image and the
// head renders BIGGER than every other head on the pitch. There is no fix in
// the maths: you cannot zoom out of an image that has no more image. It needs
// a wider source photo — or the cutout path, which sidesteps framing entirely
// because a background-free head can be composited at any scale.
//
// So "done" means: cutouts for everyone, not crops for everyone.
//
// ⚠️ THIS GATE IS MECHANICAL AND THEREFORE PARTIAL. It measures size, framing
// and resolution. It CANNOT see that the photo is the wrong person, shot from
// behind, or ten years stale — mechanical checks passed a country singer, a
// religious statue and a woman as three different male footballers earlier in
// this project. Passing this gate means "not disqualified", never "approved".
// Eyes remain the last step.
import { readFileSync } from 'fs';

const CARD_PX = 320;          // rendered disc size
const RETINA = CARD_PX * 2;   // what a 2x screen actually asks for
const TARGET_FACE = 0.42;     // must match build-lineup-data.mjs

const pool = JSON.parse(readFileSync('public/data/lineup.json', 'utf8'));
const players = Array.isArray(pool) ? pool : (pool.players || Object.values(pool)[0]);
let cutouts = {};
try { cutouts = JSON.parse(readFileSync('public/lineup/cutouts/meta.json', 'utf8')); } catch {}

const fail = { missing: [], headSize: [], lowRes: [] };

for (const p of players) {
  const hasCutout = !!cutouts[p.i];
  if (hasCutout) continue;              // uniform by construction; resolution checked at cut time
  if (!p.f || !p.x) { fail.missing.push(p); continue; }
  const [, , side, srcW] = p.x;
  // side clamped at 1 => the crop is the whole image => head is oversized.
  if (side >= 0.9999) fail.headSize.push(p);
  // srcW IS the crop width delivered. Under 2x the card, the head is soft.
  if (srcW < RETINA) fail.lowRes.push(p);
}

const union = new Set([...fail.missing, ...fail.headSize, ...fail.lowRes].map((p) => p.i));
const cutCount = players.filter((p) => cutouts[p.i]).length;

const pct = (n) => `${((100 * n) / players.length).toFixed(1)}%`;
console.log(`pool: ${players.length} players`);
console.log(`  ✅ cutout (head size uniform by construction): ${cutCount}  ${pct(cutCount)}`);
console.log('');
console.log(`  ❌ no photo at all                : ${fail.missing.length}  ${pct(fail.missing.length)}`);
console.log(`  ❌ head renders oversized (clamp) : ${fail.headSize.length}  ${pct(fail.headSize.length)}`);
console.log(`  ❌ under ${RETINA}px (soft on retina) : ${fail.lowRes.length}  ${pct(fail.lowRes.length)}`);
console.log('');
console.log(`  BELOW THE BAR (union, deduped)    : ${union.size}  ${pct(union.size)}`);
console.log(`  AT THE BAR                        : ${players.length - union.size}  ${pct(players.length - union.size)}`);

// Who it hurts most: the players people actually pick.
const BIG = /Manchester United|Manchester City|Liverpool|Arsenal|Chelsea|Tottenham|Real Madrid|Barcelona|Bayern|Paris Saint|Juventus|Milan|Inter|Atl[ée]tico|Borussia Dortmund/;
const big = players.filter((p) => BIG.test(p.c || ''));
const bigBad = big.filter((p) => union.has(p.i));
console.log('');
console.log(`  big-club players below the bar    : ${bigBad.length} of ${big.length}  (${((100 * bigBad.length) / big.length).toFixed(1)}%)`);
for (const p of bigBad.slice(0, 15)) {
  const why = !p.f ? 'no photo' : (p.x[2] >= 0.9999 ? 'oversized head' : `${p.x[3]}px`);
  console.log(`      ${p.n} — ${p.c} (${why})`);
}
