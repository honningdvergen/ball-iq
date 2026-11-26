// mystery-photo-pass2.mjs — the second photo pass for the curated answers:
// frontal, sharp, a photograph of the person, fifteen candidates, and a
// replacement only when it is clearly better (HQ's follow-up, 26 Nov 2026).
//
//   swiftc -O -o <dir>/portrait scripts/facebox/portrait.swift
//   PORTRAIT=<dir>/portrait node scripts/mystery-photo-pass2.mjs <workdir> <pass1-workdir> <phase>
//     current     measure every answer's (and famous player's) Wikidata image
//     members     for answers whose current picture fails or is flagged: read
//                 their own Commons category, filter by text and metadata
//     detect      measure up to CANDS candidates per such answer
//     score       write scripts/_mystery-photo-picks.json
//     study <names…>  measures of the current and proposed picks of named
//                 players, printed, for setting the lines
//
// THE RULES a picture must pass, all of them, to be used or proposed:
//   provenance  the player's own Wikidata image (P18) or a file in the Commons
//               category his own record links to (P373); the file's own name
//               or description names him; a date, if any, after he was 15
//   one face    exactly one face found
//   frontal     both eyes found, the nose between them (NOSE_OFFSET_MAX of the
//               eye distance from their midpoint), Vision's yaw within YAW_MAX
//   sharp       variance of the Laplacian of the face, grey, at 128 px, at
//               least SHARP_MIN
//   photograph  no artwork, drawing, statue, waxwork, sticker, render,
//               lookalike or scene word in the file's name, description or
//               Commons categories (ART, SCENE below, several languages)
//   crop        lib/photoCrop.js: the head whole with room, 3x at 52 at least
// Polite Commons reads as pass one: one request at a time, pauses, 429 backs
// off, 403 stops; pictures fetched at 600 px, measured and deleted.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { faceCrop, HERO_PX, DENSITY } from '../src/lib/photoCrop.js';
import { normaliseName } from '../src/lib/mysteryPlayer.js';
import { careerOf, withCareerFixes } from '../src/lib/mysteryCareer.js';

const [WORK, PASS1, PHASE, ...ARGS] = process.argv.slice(2);
if (!WORK || !PASS1 || !PHASE) { console.error('usage: node scripts/mystery-photo-pass2.mjs <workdir> <pass1-workdir> <phase>'); process.exit(1); }
const PORTRAIT = process.env.PORTRAIT || '/tmp/portrait';
const UA = 'BallIQ/1.0 (https://balliq.app; portrait framing)';
const API = 'https://commons.wikimedia.org/w/api.php';
mkdirSync(WORK, { recursive: true });
const STATE = `${WORK}/state.json`;
const S = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { meta: {}, cats: {}, members: {}, m: {} };
const P1 = JSON.parse(readFileSync(`${PASS1}/state.json`, 'utf8'));
const save = () => writeFileSync(STATE, JSON.stringify(S));
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const pool = read('src/data/mysteryPool.json');
const answers = read('src/data/mysteryAnswers.json');
const P18 = read('scripts/_mystery-p18.json');
const careers = withCareerFixes(read('src/data/mysteryCareers.json'), read('src/data/mysteryCareerFixes.json'));
const byId = new Map(pool.map((p) => [p.id, p]));
const FAMOUS = [...pool].sort((a, b) => (b.fame || 0) - (a.fame || 0)).slice(0, 300).map((p) => p.id);
const TARGETS = [...new Set([...answers, ...FAMOUS])];
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const title = (f) => String(f).replace(/_/g, ' ');
const CANDS = 15;

// ── The lines (set from the study, see the Job A follow-up report) ──────────
export const FACE_CONF_MIN = 0.65;
// Lines set from the study of 8 bad and 10 good picks (photo-work-2/study.png):
// side-on picks measured |yaw| 44-52 and nose offset 0.17-0.40; good ones |yaw| 0-21
// (Zidane 41, three-quarter turned away) and nose 0.005-0.13 (Zidane 0.17).
export const YAW_MAX = 35; // degrees, Vision face-rectangles revision 3
// 0.20, not 0.15: "Xabi Alonso FCB.jpg", the owner's own example of a clear picture
// facing the camera, measures yaw -23 and nose 0.153. The yaw line does the
// main work; the nose line catches what Vision's yaw under-reads.
export const NOSE_OFFSET_MAX = 0.2; // nose tip from the eyes' midpoint, along the eye line, in eye distances
// Soft picks measured 54-78 (Cantona at the Cosmos, an unattributed PNG render of
// Rashford, Rakitić), the good ones 404-1776: the line sits in the gap.
export const SHARP_MIN = 150; // Laplacian variance of the grey face box at 128 px
const FREE = /^(CC0|CC BY|Public domain|PD|No restrictions|Attribution)/i;
const NOTFREE = /\bNC\b|\bND\b|non-commercial|noderiv|fair use|non-free|GFDL/i;
// Not a photograph of him, in the languages Commons files football in.
export const ART = new RegExp([
  'mural', 'murale', 'graffit', 'mosaic', 'mosaik', 'mosaico', 'statue', 'statua', 'estatua', 'est[aá]tua', 'standbeeld', 'denkmal', '\\bmonument\\b',
  'sculpt', 'skulptur', 'escultura', 'scultura', '\\bbust\\b(?! length)', 'büste',
  '\\bpaint(ed|ing|ings)?\\b', 'gemälde', 'pintura', 'pittura', 'peinture', 'schilderij', 'drawing', 'drawn', '\\bzeichnung', 'dibujo', 'disegno', 'dessin', 'desenho',
  'illustration', 'ilustraci', 'illustrazione', 'caricatur', 'karikatur', 'cartoon', 'comic', 'fumetto', 'sketch', 'artwork', 'fan ?art', 'street.?art', 'wall ?art', '\\bart\\b', '\\bpanel\\b', 'vector', '\\bsvg\\b',
  'wax', 'wachs', 'cera\\b', 'tussaud', 'cardboard', 'cutout', 'pappaufsteller',
  'poster', 'plakat', 'banner', 'tifo', '\\bstamps?\\b', 'briefmarke', '\\bsellos?\\b', 'francobollo', 'sticker', 'aufkleber', 'figurita', 'figurin', 'trading card', 'panini', 'sammelbild', 'card scan',
  'video ?game', 'fifa \\d\\d', '\\bpes\\b', '\\brender', '3d model', 'avatar', 'lookalike', 'look-alike', 'doppelg', 'sosia', 'cosplay', 'costume', 'impersonat',
  'shirt only', 'plaque', '\\bgraves?\\b', '\\btomb', 'funeral',
].join('|'), 'i');
// A scene, a fan, a trophy, not him: the first pass proposed "Photo d'un supporteur de Paul Pogba" (a fan; pass one knew only the English "supporters") and "Золотий м'яч 2004 Андрія Шевченка" (his Ballon d'Or).
export const SCENE = /periodist|journalist|reporter|televisions|crowd|supporte?u?rs?\b|hincha|tifos|aficionad|torcedor|\bfans?\b|ultras|concert|\bshow do\b|samba|wedding|protest|rally|ballon d.or|golden ball|balón de oro|pallone d.oro|bola de ouro|золот|trophy|troph[ée]e|trofeo|pokal|award|statuette/i;
const NAME_STOP = new Set(['de', 'da', 'do', 'dos', 'van', 'von', 'der', 'den', 'del', 'la', 'le', 'di', 'jr', 'junior', 'el', 'al']);
export function namesPlayer(text, player) {
  const t = ` ${normaliseName(text)} `;
  const full = normaliseName(player.name);
  if (t.includes(` ${full} `)) return true;
  const parts = full.split(' ').filter((w) => w.length >= 3 && !NAME_STOP.has(w));
  const last = parts[parts.length - 1];
  return !!last && t.includes(` ${last} `);
}
const yearOf = (d) => { const m = String(d || '').match(/\b(18|19|20)\d\d\b/); return m ? Number(m[0]) : null; };
// A second person named in the file name: a joining word ("and", "y", "mit" …)
// or the surname of another player in the pool ("Kuyt Alonso Liverpool.jpg").
const SURNAMES = new Set(pool.map((x) => normaliseName(x.name).split(" ").pop()).filter((w) => w && w.length >= 4));
const othersNamed = (f, p) => {
  if (/\s(and|&|with|y|e|und|et|con|mit|vs\.?)\s/i.test(` ${title(f).replace(/\.[a-z]+$/i, "")} `)) return true;
  if (!p) return false;
  const mine = new Set(normaliseName(p.name).split(" "));
  return normaliseName(title(f).replace(/\.[a-z]+$/i, "")).split(" ").some((w) => !mine.has(w) && SURNAMES.has(w));
};

async function get(url, label, binary = false) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: binary ? '*/*' : 'application/json' }, signal: AbortSignal.timeout(60000) });
      if (r.status === 403) { console.error(`\nBLOCKED (403) at ${label}: stopping`); save(); process.exit(2); }
      if (r.status === 429) { if (a === 4) { console.error(`\nRATE-LIMITED at ${label}: stopping`); save(); process.exit(2); } await sleep(15000 * a); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (binary) return Buffer.from(await r.arrayBuffer());
      const t = await r.text();
      if (!t.trimEnd().endsWith('}')) throw new Error('truncated');
      return JSON.parse(t);
    } catch (e) { if (a === 4) { console.error(`  ! ${label}: ${e.message}`); return null; } await sleep(4000 * a); }
  }
  return null;
}

// Metadata AND Commons categories for up to 40 files.
async function metaFor(files) {
  const need = [...new Set(files.map(title))].filter((f) => !(f in S.meta));
  for (let i = 0; i < need.length; i += 40) {
    const batch = need.slice(i, i + 40);
    const j = await get(`${API}?action=query&format=json&redirects=1&prop=imageinfo|categories&clshow=!hidden&cllimit=max&iiprop=url|size|extmetadata|mime&iiurlwidth=600&titles=`
      + encodeURIComponent(batch.map((f) => 'File:' + f).join('|')), `meta ${i}`);
    if (!j) continue;
    const norm = new Map((j.query?.normalized || []).map((x) => [x.from, x.to]));
    const redir = new Map((j.query?.redirects || []).map((x) => [x.from, x.to]));
    const pages = new Map(Object.values(j.query?.pages || {}).map((p) => [p.title, p]));
    for (const f of batch) {
      let t = 'File:' + f; t = norm.get(t) || t; t = redir.get(t) || t;
      const pg = pages.get(t); const ii = pg?.imageinfo?.[0];
      if (!ii) { S.meta[f] = null; continue; }
      const em = ii.extmetadata || {};
      const v = {
        file: t.replace(/^File:/, ''), w: ii.width, h: ii.height, mime: ii.mime, url: ii.url, thumb600: ii.thumburl, page: ii.descriptionurl,
        licence: strip(em.LicenseShortName?.value), author: strip(em.Artist?.value).slice(0, 160),
        desc: strip(em.ImageDescription?.value).slice(0, 500), object: strip(em.ObjectName?.value).slice(0, 200),
        date: strip(em.DateTimeOriginal?.value).slice(0, 40),
        cats: (pg.categories || []).map((c) => c.title.replace(/^Category:/, '')),
      };
      S.meta[f] = v; S.meta[v.file] = v;
    }
    save();
    await sleep(900);
  }
}

// ── Measures of one picture ─────────────────────────────────────────────────
/** Variance of the 4-neighbour Laplacian of a grey square, 0-255 scale. */
export function laplacianVariance(px, n) {
  let sum = 0, sum2 = 0, k = 0;
  for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) {
    const i = y * n + x;
    const l = px[i - n] + px[i + n] + px[i - 1] + px[i + 1] - 4 * px[i];
    sum += l; sum2 += l * l; k++;
  }
  const m = sum / k;
  return sum2 / k - m * m;
}

async function measureBatch(files) {
  const TMP = `${WORK}/tmp`;
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
  const paths = new Map();
  for (const f of files) {
    const m = S.meta[f];
    const buf = m?.thumb600 ? await get(m.thumb600, `img ${f}`, true) : null;
    if (buf && ((buf[0] === 0xFF && buf[1] === 0xD8) || (buf[0] === 0x89 && buf[1] === 0x50))) {
      const p = `${TMP}/${paths.size}.img`;
      // A damaged file (a broken JPEG stream) is skipped, not fatal.
      try { writeFileSync(p, await sharp(buf).rotate().jpeg({ quality: 95 }).toBuffer()); paths.set(p, f); } catch { S.m[f] = { faces: 0, err: 'unreadable picture' }; }
    }
    await sleep(400);
  }
  let out = '';
  try { out = execFileSync(PORTRAIT, [...paths.keys()], { encoding: 'utf8', maxBuffer: 64 << 20 }); } catch (e) { console.error('detector failed', e.message); }
  for (const line of out.split('\n').filter(Boolean)) {
    let r; try { r = JSON.parse(line); } catch { continue; }
    const f = paths.get(r.file); if (!f) continue;
    if (!r.ok) { if (r.err !== 'unreadable') S.m[f] = { faces: 0 }; continue; }
    const md = await sharp(r.file).metadata();
    const W = md.width, H = md.height;
    const v = { faces: r.faces, x: r.x, y: r.y, w: r.w, h: r.h, conf: r.conf, roll: r.roll, yaw: r.yaw, pitch: r.pitch, quality: r.quality };
    // Frontal: both eyes, and the nose tip between them.
    if (r.leftEye && r.rightEye && r.nose) {
      const lx = r.leftEye.x * W, rx = r.rightEye.x * W, ly = r.leftEye.y * H, ry = r.rightEye.y * H;
      const d = Math.hypot(rx - lx, ry - ly);
      const mx = (lx + rx) / 2, my = (ly + ry) / 2;
      // Offset of the nose from the eyes' midpoint ALONG the eye line, in eye distances.
      const ux = (rx - lx) / d, uy = (ry - ly) / d;
      v.eyes = 2;
      v.noseOffset = d > 0 ? +Math.abs(((r.nose.x * W - mx) * ux + (r.nose.y * H - my) * uy) / d).toFixed(3) : null;
      v.eyeDistShare = +(d / (r.w * W)).toFixed(3); // eye distance as a share of face width
    } else v.eyes = (r.leftEye ? 1 : 0) + (r.rightEye ? 1 : 0);
    // Sharpness: the face box (grown 10%), grey, 128 px square.
    try {
      const fx = r.x * W, fy = r.y * H, fw = r.w * W, fh = r.h * H;
      const left = Math.max(0, Math.round(fx - fw * 0.05)), top = Math.max(0, Math.round(fy - fh * 0.05));
      const width = Math.min(W - left, Math.round(fw * 1.1)), height = Math.min(H - top, Math.round(fh * 1.1));
      const { data } = await sharp(r.file).extract({ left, top, width, height }).greyscale().resize(128, 128, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
      v.sharp = Math.round(laplacianVariance(data, 128));
      v.facePx = Math.round(fw); // face width in the 600-px picture
      const crop = faceCrop(r, { w: W, h: H });
      const reg = crop.ok ? { left: crop.left, top: crop.top, width: crop.side, height: crop.side } : { left, top, width, height };
      reg.width = Math.min(reg.width, W - reg.left); reg.height = Math.min(reg.height, H - reg.top);
      v.lum = Math.round((await sharp(r.file).extract(reg).greyscale().stats()).channels[0].mean);
    } catch { /* leave out */ }
    S.m[f] = v;
  }
  rmSync(TMP, { recursive: true, force: true });
  save();
}

// ── The verdict on one file for one player ──────────────────────────────────
export function judge(file, player, how) {
  const m = S.meta[file] || P1.meta[file];
  const v = { file, how, ok: false, strike: null };
  if (!m) { v.strike = 'no Commons record'; return v; }
  Object.assign(v, { page: m.page, url: m.url, w: m.w, h: m.h, licence: m.licence, author: m.author, date: m.date || null });
  const words = `${m.file} ${m.object || ''} ${m.desc || ''} ${(m.cats || []).join(' | ')}`;
  v.names = namesPlayer(`${m.file} ${m.object || ''} ${m.desc || ''}`, player);
  const y = yearOf(m.date);
  v.dateFits = y == null ? null : y >= player.born + 15 && y <= 2026;
  if (!/jpe?g|png|tiff?/i.test(m.mime || m.file) || !FREE.test(m.licence) || NOTFREE.test(m.licence) || !m.author || /^unknown|unknown author/i.test(m.author)) { v.strike = 'licence, author or format'; return v; }
  if (!v.names) { v.strike = 'the file does not name the player'; return v; }
  if (v.dateFits === false) { v.strike = `date ${y} before he was 15`; return v; }
  const art = words.match(ART); const scene = words.match(SCENE);
  if (art) { v.strike = `not a photograph of him ("${art[0]}" in its name, description or categories)`; return v; }
  // On a candidate a scene word strikes it; on his own Wikidata image it is a flag for the reader.
  if (scene && how === 'category') { v.strike = `a scene, not a portrait ("${scene[0]}")`; return v; }
  if (how === 'category' && othersNamed(m.file, player)) { v.strike = 'the file name names someone else too'; return v; }
  const f = S.m[m.file];
  if (!f) { v.strike = 'not measured'; return v; }
  if (f.faces !== 1) { v.strike = f.faces ? 'more than one face' : 'no face'; return v; }
  v.face = { x: f.x, y: f.y, w: f.w, h: f.h, conf: f.conf };
  v.measures = { yaw: f.yaw != null ? Math.round(f.yaw) : null, roll: f.roll != null ? Math.round(f.roll) : null, eyes: f.eyes, noseOffset: f.noseOffset ?? null, sharp: f.sharp ?? null, quality: f.quality != null ? +f.quality.toFixed(2) : null, lum: f.lum ?? null };
  if (f.conf < FACE_CONF_MIN) { v.strike = 'low face confidence'; return v; }
  v.frontal = f.eyes === 2 && f.noseOffset != null && f.noseOffset <= NOSE_OFFSET_MAX && (f.yaw == null || Math.abs(f.yaw) <= YAW_MAX);
  // A candidate must face the camera; his own Wikidata image is flagged "profile".
  if (!v.frontal && how === 'category') { v.strike = 'profile: not facing the camera'; return v; }
  if (!(f.sharp >= SHARP_MIN)) { v.strike = 'soft or blurred face'; return v; }
  const crop = faceCrop(f, { w: m.w, h: m.h });
  if (!crop.ok) { v.strike = `crop: ${crop.reason}`; return v; }
  v.crop = crop;
  v.measures.faceShare = +(f.w * m.w / crop.side).toFixed(3); // face width as a share of the crop
  if (!crop.serves.list) { v.strike = 'cannot reach 3x at the list size'; return v; }
  v.flags = {
    profile: !v.frontal,
    dark: f.lum != null && f.lum < 70,
    smallFace: !crop.serves.hero,
    wide: m.w / m.h > 1.3,
    offCentre: crop.offCentre > 0.1,
    othersNamed: othersNamed(m.file, player),
    scene: !!scene,
  };
  // Preference among pictures that pass every rule: facing the camera, lit,
  // in a club or national shirt (read from its categories), the face large;
  // for a retired player an in-career picture; newer only breaks ties.
  const last = Math.max(...careerOf(player, careers, 2026).map((s) => s.to ?? 2026), 0);
  const inCareer = y && y <= last + 1;
  const shirt = /national (football|soccer) team|\bF\.?C\.?\b|football club|players of|in (the )?\d{4}.*(cup|league)|matches|squad/i.test((m.cats || []).join(' | '));
  v.score = Math.round(40 * Math.min(1, crop.side / (HERO_PX * DENSITY * 2))
    + 20 * (1 - Math.min(1, Math.abs(f.yaw || 0) / YAW_MAX)) + 10 * (1 - Math.min(1, (f.noseOffset || 0) / NOSE_OFFSET_MAX))
    + (f.lum == null ? 0 : f.lum < 70 ? -15 : f.lum <= 200 ? 10 : 0)
    + Math.min(15, (f.sharp - SHARP_MIN) / 20)
    + (shirt ? 10 : 0) + (inCareer ? 8 : 0)
    + (y ? Math.min(3, Math.max(0, (y - 2005) / 7)) : 0));
  v.ok = true;
  return v;
}
const flagCount = (x) => Object.values(x.flags || {}).filter(Boolean).length;

// ── phase: current ─────────────────────────────────────────────────────────
if (PHASE === 'current') {
  const files = TARGETS.map((id) => P18[id] && title(P18[id])).filter(Boolean);
  await metaFor(files);
  const todo = files.map((f) => S.meta[f]?.file).filter((f) => f && !(f in S.m));
  console.log(`${todo.length} current pictures to measure`);
  for (let i = 0; i < todo.length; i += 30) { await measureBatch(todo.slice(i, i + 30)); process.stdout.write(`  ${Math.min(i + 30, todo.length)}/${todo.length}\r`); }
  console.log('');
}

const currentOf = (id) => {
  const p = byId.get(id);
  return P18[id] && S.meta[title(P18[id])] ? judge(S.meta[title(P18[id])].file, p, 'P18') : { ok: false, strike: P18[id] ? 'no Commons record' : 'no Wikidata image' };
};
// Worth a search: struck, or flagged for something a reader would see at once
// (not facing the camera, dark, too small for the hero size, a scene, a second
// person named). Off-centre and wide pictures are left to the reader.
const SERIOUS = ['profile', 'dark', 'smallFace', 'scene', 'othersNamed'];
const needsBetter = (id) => { const c = currentOf(id); return !c.ok || SERIOUS.some((k) => c.flags?.[k]); };

// ── phase: members ─────────────────────────────────────────────────────────
if (PHASE === 'members') {
  const want = answers.filter((id) => P1.cat[id] && needsBetter(id) && !(id in S.members));
  console.log(`${want.length} answers to search for a better picture`);
  let n = 0;
  for (const id of want) {
    const p = byId.get(id);
    const j = await get(`${API}?action=query&format=json&list=categorymembers&cmtype=file&cmlimit=200&cmtitle=` + encodeURIComponent('Category:' + P1.cat[id]), `cat ${id}`);
    if (!j) continue;
    await sleep(500);
    // Cheap first: the file name alone (names him, a picture, no art word, no
    // second person), then the best-looking 30 by name get their metadata.
    const files = (j.query?.categorymembers || []).map((m) => m.title.replace(/^File:/, ''))
      .filter((f) => /\.(jpe?g|png|tiff?)$/i.test(f) && namesPlayer(f, p) && !ART.test(f) && !SCENE.test(f) && !othersNamed(f, p));
    await metaFor(files.slice(0, 120));
    S.members[id] = rankCandidates(files.map((f) => S.meta[f]).filter(Boolean), p);
    if (++n % 10 === 0) { save(); process.stdout.write(`  ${n}/${want.length}\r`); }
  }
  save();
  console.log(`\ncandidates: ${Object.values(S.members).reduce((a, b) => a + b.length, 0)} for ${Object.keys(S.members).length} answers`);
}

/**
 * The cheap ranking, before any picture is fetched. Free licence with a real
 * author; no art or scene word in the description or categories; dated after
 * he was 15; at least 400 px; not a panorama. Then, best first:
 *   · a PORTRAIT-LIKE NAME: once his name, dates, numbers and "cropped" are
 *     taken out, little is left ("Xabi Alonso FCB.jpg" leaves "FCB"); a long
 *     remainder is usually a match report or names a second person
 *     ("Xabi Alonso Arturo Vidal Training …")
 *   · portrait or squarish shape
 *   · at most two from one shoot (names equal once the digits are gone), so
 *     fifteen looks are fifteen different pictures
 *   · size only as the last tie-break, capped: a 609 x 853 head shot is
 *     enough, and the first ranking by size alone sent fifteen training-ground
 *     frames of Xabi Alonso ahead of the one the owner found.
 */
export function rankCandidates(metas, p) {
  const nameWords = new Set(normaliseName(p.name).split(' '));
  const remainder = (m) => normaliseName(m.file.replace(/\.[a-z]+$/i, ''))
    .split(' ').filter((w) => w && !nameWords.has(w) && !/^\d+$/.test(w) && !/^(cropped|jpg|img|dsc|photo|foto)$/.test(w)).length;
  const series = (m) => m.file.replace(/\.[a-z]+$/i, '').replace(/[\d\s\-_()]+/g, ' ').trim().toLowerCase();
  const ok = metas.filter((m) => m && /jpe?g|png|tiff?/i.test(m.mime || '') && FREE.test(m.licence) && !NOTFREE.test(m.licence) && m.author && !/unknown/i.test(m.author))
    .filter((m) => !ART.test(`${m.file} ${m.desc} ${m.object} ${(m.cats || []).join(' ')}`) && !SCENE.test(`${m.file} ${m.desc} ${m.object}`) && !othersNamed(m.file, p))
    .filter((m) => { const y = yearOf(m.date); return !y || y >= p.born + 15; })
    .filter((m) => m.w >= 400 && m.h >= 400 && m.w / m.h <= 1.6)
    .sort((a, b) => remainder(a) - remainder(b)
      || ((b.h >= b.w * 0.9) - (a.h >= a.w * 0.9))
      || Math.min(b.w * b.h, 1.5e6) - Math.min(a.w * a.h, 1.5e6));
  const perSeries = new Map(); const out = [];
  for (const m of ok) {
    const k = series(m); const n = perSeries.get(k) || 0;
    if (n >= 2) continue;
    perSeries.set(k, n + 1); out.push(m.file);
    if (out.length >= CANDS) break;
  }
  return out;
}

// ── phase: rerank ──────────────────────────────────────────────────────────
// Re-rank the candidates already read, from the metadata on file (every file
// whose Commons categories include the player's own), without a new fetch.
if (PHASE === 'rerank') {
  const uniq = [...new Map(Object.values(S.meta).filter(Boolean).map((m) => [m.file, m])).values()];
  for (const id of Object.keys(S.members)) {
    const cat = P1.cat[id];
    S.members[id] = rankCandidates(uniq.filter((m) => (m.cats || []).includes(cat)), byId.get(id));
  }
  save();
  console.log(`re-ranked: ${Object.values(S.members).reduce((a, b) => a + b.length, 0)} candidates for ${Object.keys(S.members).length} answers`);
}

// ── phase: detect ──────────────────────────────────────────────────────────
if (PHASE === 'detect') {
  const todo = [...new Set(Object.values(S.members).flat())].filter((f) => !(f in S.m));
  console.log(`${todo.length} candidate pictures to measure`);
  for (let i = 0; i < todo.length; i += 30) { await measureBatch(todo.slice(i, i + 30)); process.stdout.write(`  ${Math.min(i + 30, todo.length)}/${todo.length}\r`); }
  console.log('');
}

// ── phase: study ───────────────────────────────────────────────────────────
if (PHASE === 'study') {
  await metaFor(ARGS);
  const todo = ARGS.map((f) => S.meta[title(f)]?.file).filter((f) => f && !(f in S.m));
  if (todo.length) await measureBatch(todo);
  for (const f of ARGS.map((x) => S.meta[title(x)]?.file || x)) {
    const v = S.m[f] || S.m[title(f)];
    console.log(f, JSON.stringify(v));
  }
}

// ── phase: score ───────────────────────────────────────────────────────────
if (PHASE === 'score') {
  const picks = {}, cands = {}, count = {};
  const bump = (k) => { count[k] = (count[k] || 0) + 1; };
  for (const id of TARGETS) {
    const p = byId.get(id);
    const cur = currentOf(id);
    const isAnswer = answers.includes(id);
    const others = isAnswer ? (S.members[id] || []).filter((f) => !P18[id] || f !== S.meta[title(P18[id])]?.file).map((f) => judge(f, p, 'category')) : [];
    const good = others.filter((c) => c.ok && flagCount(c) === 0).sort((a, b) => b.score - a.score);
    // Keep a current picture that passes every rule and carries no flag. A
    // replacement must pass every rule with no flag of its own.
    const proposed = (!cur.ok || flagCount(cur) > 0) && good[0] ? good[0] : null;
    picks[id] = { name: p.name, answer: isAnswer, famous: FAMOUS.includes(id), current: cur, proposed };
    if (isAnswer) {
      cands[id] = { name: p.name, category: P1.cat[id] || null, current: cur, looked: (S.members[id] || []).length, top3: good.slice(0, 3), struckCandidates: others.filter((c) => !c.ok).map((c) => ({ file: c.file, strike: c.strike })) };
      bump(`answers current: ${cur.ok ? (flagCount(cur) ? 'usable but flagged' : 'usable, clean') : `struck: ${cur.strike.replace(/\(.*\)/, '').trim()}`}`);
      bump(`answers outcome: ${proposed ? 'replacement proposed' : cur.ok ? 'keep current' : 'no photo'}`);
      for (const c of others) if (!c.ok) bump(`candidates struck: ${c.strike.replace(/\(.*\)/, '').trim()}`);
      if (cur.ok) for (const [k, v] of Object.entries(cur.flags)) if (v) bump(`answers current flag: ${k}`);
    } else if (FAMOUS.includes(id)) bump(`famous current: ${cur.ok ? 'usable' : `struck: ${cur.strike.replace(/\(.*\)/, '').trim()}`}`);
  }
  writeFileSync('scripts/_mystery-photo-picks.json', JSON.stringify(picks));
  writeFileSync(`${WORK}/candidates.json`, JSON.stringify(cands, null, 1));
  console.log(Object.entries(count).sort().map(([k, v]) => `${k}: ${v}`).join('\n'));
}
