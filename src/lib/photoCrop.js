// The round face crop for Mystery Player photos (R8, R12; Job A, 26 Nov 2026).
//
// One rule at every size: 52 in the guess list, 104 on the finish. Pure and
// tested (tests/unit/mystery-photo-gate.test.js). Nothing imports it yet; the
// review-set script uses the same function, so what the owner approves is
// exactly what the app will draw.
//
// THE RULE
//   · Centred on the MIDDLE of the HEAD (R12), not cut from the top. Vision's
//     face box runs from about the eyebrows to the bottom of the chin, so the
//     head is that box plus HAIR_LIFT face-heights of forehead and hair above
//     it; the crop's centre is the middle of that, a little above the middle
//     of the face box. Measured on ten real portraits the first version refused
//     (Zidane, Buffon, Lampard, Henry …, ball-iq-audit/2026-11-26/mystery/
//     crop-study/boxes.png): centring on the bare box left the hair the same
//     room as the neck and refused tight, perfectly good head shots.
//   · The face is FACE_SHARE of the crop's width, and the crop is tall enough
//     for ROOM_ABOVE face-heights over the box (forehead and hair) and
//     ROOM_BELOW under it (the chin and a little neck).
//   · A crop that would leave the picture is SHIFTED inside it, and if it is
//     larger than the picture it is made smaller, down to the least that still
//     holds the head with its room. Never left to clip (Xabi Alonso's chin).
//   · If even that cannot fit, the photo is not used at all ('tight').
//   · RESOLUTION: the crop must have DENSITY times its display size in real
//     pixels of the ORIGINAL picture (312 across at 104, 156 at 52). A size it
//     cannot reach is not served; `srcW` is the Commons thumbnail width to ask
//     for so the crop lands at that density without upscaling.
//
// Coordinates: the face box is Vision's, as fractions of the picture's width
// (x, w) and height (y, h), top-left origin. The crop comes back in original
// pixels and as fractions (x, y of width and height; s = side / width).

export const HERO_PX = 104;
export const LIST_PX = 52;
export const DENSITY = 3;
/** Share of the crop's width the face box takes (the lineup builder's 0.42). */
export const FACE_SHARE = 0.42;
/** Forehead and hair above Vision's face box, in face-box heights: the head's top. */
export const HAIR_LIFT = 0.25;
/** Room over and under the face box at full size, in face-box heights (centred on the head: 0.725 and 0.475). */
export const ROOM_ABOVE = 0.6;
export const ROOM_BELOW = 0.6;
/** The least room a shifted or shrunk crop may keep before the photo is refused. */
export const MIN_ROOM_ABOVE = 0.4;
export const MIN_ROOM_BELOW = 0.15;
export const MIN_ROOM_SIDE = 0.15;
/** Face centre further than this share of the side from the crop's centre is flagged off-centre. */
export const OFF_CENTRE = 0.1;
/** Commons' standard thumbnail widths ($wgThumbnailSteps); other widths are rendered on demand and cache poorly. */
export const THUMB_STEPS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];

/** The Commons thumbnail width that gives a crop of `sidePx` (original pixels) `need` pixels, never past the original. */
export function thumbWidthFor(sidePx, imgW, need) {
  if (!(sidePx > 0) || !(imgW > 0)) return null;
  if (sidePx < need) return null; // even the original cannot reach it
  const want = Math.ceil((need * imgW) / sidePx);
  const step = THUMB_STEPS.find((s) => s >= want);
  return step && step < imgW ? step : imgW;
}

/**
 * @param {{x:number,y:number,w:number,h:number}} face  face box, fractions
 * @param {{w:number,h:number}} img  the ORIGINAL picture's size in pixels
 * @returns {{ ok: boolean, reason?: string, left, top, side, x, y, s,
 *   offCentre: number, serves: { hero: boolean, list: boolean },
 *   srcW: { hero: number|null, list: number|null } }}
 */
export function faceCrop(face, img) {
  const W = Number(img?.w), H = Number(img?.h);
  if (!face || !(W > 0) || !(H > 0) || !(face.w > 0) || !(face.h > 0)) return { ok: false, reason: 'no face box or size' };
  const fx = face.x * W, fy = face.y * H, fw = face.w * W, fh = face.h * H;
  // The middle of the head: the face box with HAIR_LIFT of hair on top.
  const cx = fx + fw / 2, cy = fy - (HAIR_LIFT * fh) / 2 + fh / 2;
  const want = Math.max(fw / FACE_SHARE, fh * (1 + ROOM_ABOVE + ROOM_BELOW));
  const least = Math.max(fw * (1 + 2 * MIN_ROOM_SIDE), fh * (1 + MIN_ROOM_ABOVE + MIN_ROOM_BELOW));
  const room = Math.min(W, H);
  if (least > room) return { ok: false, reason: 'tight' };
  const side = Math.min(want, room);
  const left = Math.max(0, Math.min(W - side, cx - side / 2));
  const top = Math.max(0, Math.min(H - side, cy - side / 2));
  const above = (fy - top) / fh, below = (top + side - (fy + fh)) / fh;
  const sides = Math.min(fx - left, left + side - (fx + fw)) / fw;
  if (above < MIN_ROOM_ABOVE - 1e-9) return { ok: false, reason: 'no room above the hair' };
  if (below < MIN_ROOM_BELOW - 1e-9) return { ok: false, reason: 'no room below the chin' };
  if (sides < MIN_ROOM_SIDE - 1e-9) return { ok: false, reason: 'face at the side edge' };
  const offCentre = Math.hypot(cx - (left + side / 2), cy - (top + side / 2)) / side;
  const hero = thumbWidthFor(side, W, HERO_PX * DENSITY);
  const list = thumbWidthFor(side, W, LIST_PX * DENSITY);
  return {
    ok: true,
    left: Math.round(left), top: Math.round(top), side: Math.round(side),
    x: +(left / W).toFixed(4), y: +(top / H).toFixed(4), s: +(side / W).toFixed(4),
    offCentre: +offCentre.toFixed(3),
    serves: { hero: hero != null, list: list != null },
    srcW: { hero, list },
  };
}

// ── The reviewed-list gate (R11, R12) ───────────────────────────────────────

export function sameCrop(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.s === b.s;
}

/**
 * The pick a review approved, if the picks file still holds it unchanged
 * (same Commons file, same crop numbers); else null.
 */
export function approvedPick(id, entry, picks) {
  const p = picks?.[id];
  if (!p || !entry) return null;
  for (const v of [p.proposed, p.current]) {
    if (v && v.ok && v.file === entry.file && sameCrop(v.crop, entry.crop)) return v;
  }
  return null;
}

/**
 * The lean photo file: one entry per reviewed id whose approved pick is still
 * on file and can serve at least the list size. -> { out, dropped }
 */
export function leanPhotos(picks, reviewed) {
  const out = {};
  const dropped = [];
  for (const [id, entry] of Object.entries(reviewed || {})) {
    const v = approvedPick(id, entry, picks);
    if (!v || !(v.crop?.srcW?.list > 0)) { dropped.push(id); continue; }
    out[id] = {
      u: v.url, w: v.w, h: v.h, x: v.crop.x, y: v.crop.y, s: v.crop.s,
      hero: v.crop.srcW.hero || 0, list: v.crop.srcW.list || 0,
      a: v.author, l: v.licence, pg: v.page,
    };
  }
  return { out, dropped };
}

/**
 * The URL of a Commons thumbnail `width` pixels wide, from the original file's
 * URL (https://upload.wikimedia.org/wikipedia/commons/a/ab/Name.jpg). A width
 * at or past the original's returns the original: Commons never upscales.
 */
export function commonsThumb(url, width, originalWidth) {
  const m = String(url || '').match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)/);
  if (!m) return null;
  if (!(width > 0) || (originalWidth && width >= originalWidth)) return `${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
  return `${m[1]}/thumb/${m[2]}/${m[3]}/${m[4]}/${width}px-${m[4]}${/\.(tiff?|svg)$/i.test(m[4]) ? '.jpg' : ''}`;
}

/**
 * How to draw a crop at `px` with an <img> inside a round, overflow-hidden box
 * of that size: the image's rendered width and height and its offset, in CSS
 * pixels. Works for any thumbnail width, since the crop is in fractions.
 */
export function cropStyle(crop, img, px) {
  const k = px / (crop.s * img.w); // CSS px per original px
  return {
    width: +(img.w * k).toFixed(2), height: +(img.h * k).toFixed(2),
    left: +(-crop.x * img.w * k).toFixed(2), top: +(-crop.y * img.h * k).toFixed(2),
  };
}
