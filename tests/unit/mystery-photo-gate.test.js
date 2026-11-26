// Mystery Player photos (Job A, A4, R8, R11, R12, 26 Nov 2026).
// The crop rule at every size, and the gate: no photo ships unread.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import {
  faceCrop, cropStyle, thumbWidthFor, commonsThumb, leanPhotos, approvedPick,
  HERO_PX, LIST_PX, DENSITY, FACE_SHARE, MIN_ROOM_ABOVE, MIN_ROOM_BELOW,
} from '../../src/lib/photoCrop.js';
import lean from '../../src/data/mysteryPhotoLean.json';
import reviewedFile from '../../src/data/mysteryPhotoReviewed.json';

const picks = existsSync('scripts/_mystery-photo-picks.json') ? JSON.parse(readFileSync('scripts/_mystery-photo-picks.json', 'utf8')) : {};
const reviewed = reviewedFile.ids || {};

describe('the crop rule', () => {
  const portrait = { w: 1200, h: 1600 };
  it('centres on the middle of the face box', () => {
    const face = { x: 0.4, y: 0.3, w: 0.2, h: 0.15 };
    const c = faceCrop(face, portrait);
    expect(c.ok).toBe(true);
    const cx = (face.x + face.w / 2) * portrait.w, cy = (face.y + face.h / 2) * portrait.h;
    expect(Math.abs(c.left + c.side / 2 - cx)).toBeLessThan(1);
    expect(Math.abs(c.top + c.side / 2 - cy)).toBeLessThan(1);
    expect(c.offCentre).toBeLessThan(0.01);
    expect(c.side).toBeCloseTo(Math.max(face.w * 1200 / FACE_SHARE, face.h * 1600 * 2.2), 0);
  });
  it('a face near the top edge is shifted down within the picture, never clipped, or refused when the hair has no room', () => {
    // Room for the hair: the crop slides down to the top edge and keeps the head.
    const ok = faceCrop({ x: 0.4, y: 0.06, w: 0.2, h: 0.1 }, portrait);
    expect(ok.ok).toBe(true);
    expect(ok.top).toBe(0);
    // Face box touching the top: no room above the hair at any crop.
    const tight = faceCrop({ x: 0.4, y: 0.0, w: 0.2, h: 0.1 }, portrait);
    expect(tight).toMatchObject({ ok: false, reason: 'no room above the hair' });
  });
  it('Xabi Alonso\'s old box (a full-width square from the top of a 330 x 496 picture) cannot clip his chin: it is refused or given room', () => {
    // The face that box was cut around fills the width at the top.
    const c = faceCrop({ x: 0.05, y: 0.02, w: 0.9, h: 0.55 }, { w: 330, h: 496 });
    expect(c.ok).toBe(false);
  });
  it('the crop keeps at least the minimum room above and below the face, shifted or not', () => {
    for (const y of [0.05, 0.1, 0.3, 0.6, 0.8]) {
      const face = { x: 0.3, y, w: 0.15, h: 0.12 };
      const c = faceCrop(face, portrait);
      if (!c.ok) continue;
      const fy = face.y * portrait.h, fh = face.h * portrait.h;
      expect((fy - c.top) / fh).toBeGreaterThanOrEqual(MIN_ROOM_ABOVE - 1e-6);
      expect((c.top + c.side - (fy + fh)) / fh).toBeGreaterThanOrEqual(MIN_ROOM_BELOW - 1e-6);
      expect(c.left).toBeGreaterThanOrEqual(0);
      expect(c.top + c.side).toBeLessThanOrEqual(portrait.h);
    }
  });
  it('resolution: 3x the display size in real pixels, or that size is not served', () => {
    expect(HERO_PX * DENSITY).toBe(312);
    expect(LIST_PX * DENSITY).toBe(156);
    // A small face in a small picture: the crop is ~200 px, list yes, hero no.
    const small = faceCrop({ x: 0.45, y: 0.3, w: 0.1, h: 0.08 }, { w: 800, h: 1000 });
    expect(small.side).toBeLessThan(312);
    expect(small.side).toBeGreaterThanOrEqual(156);
    expect(small.serves).toEqual({ hero: false, list: true });
    expect(small.srcW.hero).toBe(null);
  });
  it('the thumbnail asked for is a standard Commons step that reaches 3x, never past the original', () => {
    expect(thumbWidthFor(1000, 4000, 312)).toBe(1280); // 312 * 4000/1000 = 1248 -> 1280
    expect(thumbWidthFor(400, 600, 312)).toBe(500); // 468 -> 500
    expect(thumbWidthFor(320, 400, 312)).toBe(400); // 390 -> 500 is past the original: the original
    expect(thumbWidthFor(300, 400, 312)).toBe(null); // even the original cannot reach it
  });
  it('the same crop draws the same at 52 and at 104', () => {
    const img = { w: 1200, h: 1600 };
    const c = faceCrop({ x: 0.4, y: 0.3, w: 0.2, h: 0.15 }, img);
    const a = cropStyle(c, img, 52), b = cropStyle(c, img, 104);
    expect(b.width).toBeCloseTo(a.width * 2, 1);
    expect(b.left).toBeCloseTo(a.left * 2, 1);
  });
  it('Commons thumbnail URLs', () => {
    const u = 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Leo_Messi.jpg';
    expect(commonsThumb(u, 500, 2000)).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi.jpg/500px-Leo_Messi.jpg');
    expect(commonsThumb(u, 2000, 2000)).toBe(u);
    expect(commonsThumb('https://example.com/x.jpg', 500)).toBe(null);
  });
});

describe('the gate: no photo ships unread (R11, R12)', () => {
  it('the lean photo file holds no id that is not on the reviewed list', () => {
    for (const id of Object.keys(lean)) expect(Object.keys(reviewed), id).toContain(id);
  });
  it('every photo in it is exactly the picture and crop that were approved', () => {
    for (const [id, v] of Object.entries(lean)) {
      const r = reviewed[id];
      const pick = approvedPick(id, r, picks);
      expect(pick, `${id}: the approved picture or crop has changed since review`).toBeTruthy();
      expect(v.u).toBe(pick.url);
      expect([v.x, v.y, v.s]).toEqual([r.crop.x, r.crop.y, r.crop.s]);
    }
  });
  it('a reviewed id whose picture or crop changed is NOT written', () => {
    const fakePicks = { Q1: { current: { ok: true, file: 'A.jpg', url: 'u', w: 1000, h: 1000, crop: { x: 0.1, y: 0.1, s: 0.5, srcW: { hero: 960, list: 500 } } } } };
    expect(Object.keys(leanPhotos(fakePicks, { Q1: { file: 'A.jpg', crop: { x: 0.1, y: 0.1, s: 0.5 } } }).out)).toEqual(['Q1']);
    expect(leanPhotos(fakePicks, { Q1: { file: 'B.jpg', crop: { x: 0.1, y: 0.1, s: 0.5 } } }).out).toEqual({});
    expect(leanPhotos(fakePicks, { Q1: { file: 'A.jpg', crop: { x: 0.1, y: 0.2, s: 0.5 } } }).out).toEqual({});
  });
  it('every reviewed entry stores what was reviewed: file, crop, provenance, who approved', () => {
    for (const [id, r] of Object.entries(reviewed)) {
      expect(r.file, id).toBeTruthy();
      expect(r.crop, id).toMatchObject({ x: expect.any(Number), y: expect.any(Number), s: expect.any(Number) });
      expect(r.provenance?.faces, id).toBe(1);
      expect(r.approvedBy, id).toBeTruthy();
    }
  });
});
