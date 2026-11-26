// mystery-photo-sheets.mjs — contact sheets and the owner's review set, drawn
// with the SAME crop rule the app will use (lib/photoCrop.js), from the
// Commons thumbnail the app would ask for.
//
//   node scripts/mystery-photo-sheets.mjs <workdir> <outdir>
//
// Reads scripts/_mystery-photo-picks.json (scripts/mystery-photo-pass.mjs).
// Writes, under <outdir> (outside the repo):
//   photos/answers/current-NN.png   the 648 answers' current Wikidata image,
//                                   round 104 crop drawn at 2x, 50 a sheet,
//                                   name, id and flags under each
//   photos/answers/proposed-NN.png  before / after for every answer with a
//                                   better candidate (R9)
//   photos/famous/famous-104-NN.png and famous-52-NN.png  the 300 most famous
//   review-set/answers/<id>.jpg     the square crop at 624 across, or the
//                                   largest honest size below (R12)
//   review-set/answers/players.json one entry per player in the set
//   review-set/struck.json          everything struck before the owner sees
//                                   it, with the reason
// Pictures are fetched one at a time, politely, and never kept beyond the crop.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import sharp from 'sharp';
import { HERO_PX, LIST_PX, thumbWidthFor, commonsThumb } from '../src/lib/photoCrop.js';

const [WORK, OUT] = process.argv.slice(2);
if (!WORK || !OUT) { console.error('usage: node scripts/mystery-photo-sheets.mjs <workdir> <outdir>'); process.exit(1); }
const UA = 'BallIQ/1.0 (https://balliq.app; portrait framing)';
const REVIEW_PX = 624;
const picks = JSON.parse(readFileSync('scripts/_mystery-photo-picks.json', 'utf8'));
const pool = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const answers = JSON.parse(readFileSync('src/data/mysteryAnswers.json', 'utf8'));
const nations = JSON.parse(readFileSync('src/data/mysteryNations.json', 'utf8'));
const byId = new Map(pool.map((p) => [p.id, p]));
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));
const SLOT = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' };
for (const d of ['photos/answers', 'photos/famous', 'review-set/answers']) mkdirSync(`${OUT}/${d}`, { recursive: true });

// One crop cache per file+size, in the work dir, so a re-run fetches nothing twice.
const CACHE = `${WORK}/crops`;
mkdirSync(CACHE, { recursive: true });
const key = (f) => f.replace(/[^a-z0-9]/gi, '_').slice(0, 80);

async function fetchImg(url) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
      if (r.status === 403) { console.error(`\nBLOCKED (403) fetching ${url}: stopping`); process.exit(2); }
      if (r.status === 429) { if (a === 4) { console.error('\nRATE-LIMITED: stopping'); process.exit(2); } await sleep(15000 * a); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (a === 4) { console.error(`  ! ${url}: ${e.message}`); return null; } await sleep(4000 * a); }
  }
  return null;
}

/** The square crop of pick `v` at `px` across (or less, never upscaled). -> { buf, px } */
async function cropOf(v, px) {
  const path = `${CACHE}/${key(v.file)}-${px}.jpg`;
  if (existsSync(path)) { const m = await sharp(path).metadata(); return { buf: readFileSync(path), px: m.width }; }
  const tw = thumbWidthFor(v.crop.side, v.w, px) || v.w; // the original when 3x/needed cannot be reached
  const url = commonsThumb(v.url, tw, v.w);
  const raw = url ? await fetchImg(url) : null;
  await sleep(400);
  if (!raw) return null;
  // Upright first (an original with an EXIF turn), as Commons' own thumbnails are.
  const buf = await sharp(raw).rotate().toBuffer();
  const m = await sharp(buf).metadata();
  const k = m.width / v.w;
  const reg = { left: Math.round(v.crop.x * v.w * k), top: Math.round(v.crop.y * v.h * k), width: Math.round(v.crop.s * v.w * k) };
  reg.height = reg.width;
  reg.width = Math.min(reg.width, m.width - reg.left); reg.height = Math.min(reg.height, m.height - reg.top, reg.width); reg.width = reg.height;
  const out = Math.min(px, reg.width);
  const jpg = await sharp(buf).extract(reg).resize(out, out).jpeg({ quality: 88 }).toBuffer();
  writeFileSync(path, jpg);
  return { buf: jpg, px: out };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function sheet(items, px, file, title) {
  const COLS = 10, cell = px + 28, labelH = 46, W = COLS * cell + 20;
  const rows = Math.ceil(items.length / COLS);
  const H = 44 + rows * (cell + labelH);
  const mask = Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`);
  const comps = [{ input: Buffer.from(`<svg width="${W}" height="40"><text x="12" y="27" font-size="18" font-family="Helvetica" font-weight="bold">${esc(title)}</text></svg>`), left: 0, top: 0 }];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const x = 10 + (i % COLS) * cell + 14, y = 44 + Math.floor(i / COLS) * (cell + labelH);
    if (it.buf) {
      const round = await sharp(it.buf).resize(px, px).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
      comps.push({ input: round, left: x, top: y });
    } else {
      comps.push({ input: Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2 - 1}" fill="#ccc"/><text x="${px / 2}" y="${px / 2 + 4}" font-size="11" text-anchor="middle" font-family="Helvetica">${esc(it.why || 'no photo')}</text></svg>`), left: x, top: y });
    }
    const lines = [it.name.slice(0, 24), it.id, (it.flags || '').slice(0, 30)];
    comps.push({ input: Buffer.from(`<svg width="${cell}" height="${labelH}">${lines.map((l, k) => `<text x="0" y="${12 + k * 13}" font-size="${k ? 10 : 11}" font-family="Helvetica" fill="${k === 2 ? '#b00' : '#111'}">${esc(l)}</text>`).join('')}</svg>`), left: x - 10, top: y + px + 3 });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#f4f4f4' } }).composite(comps).jpeg({ quality: 86 }).toFile(file);
}

const flagText = (v) => (v && v.ok ? Object.entries(v.flags).filter(([, b]) => b).map(([k]) => k).join(' ') : `STRUCK: ${v?.strike || 'none'}`);
const famous = [...pool].sort((a, b) => (b.fame || 0) - (a.fame || 0)).slice(0, 300).map((p) => p.id);
let sheets = 0;

// 1. The answers' current photos at 104 (drawn at 2x so a reader can judge sharpness).
const cur = [];
for (const id of answers) {
  const p = picks[id]; const v = p?.current;
  const c = v && v.crop ? await cropOf(v, HERO_PX * 2) : null;
  cur.push({ id, name: byId.get(id).name, buf: c?.buf, why: v?.strike, flags: flagText(v) });
  if (cur.length % 50 === 0) process.stdout.write(`  answers ${cur.length}\r`);
}
for (let i = 0; i < cur.length; i += 50) { await sheet(cur.slice(i, i + 50), HERO_PX * 2, `${OUT}/photos/answers/current-${String(i / 50 + 1).padStart(2, '0')}.jpg`, `Answers, current Wikidata image, 104 crop at 2x (${i + 1}-${Math.min(i + 50, cur.length)})`); sheets++; }

// 2. Before / after where a better candidate is proposed.
const ba = [];
for (const id of answers) {
  const p = picks[id];
  if (!p?.proposed) continue;
  const before = p.current?.crop ? await cropOf(p.current, HERO_PX * 2) : null;
  const after = await cropOf(p.proposed, HERO_PX * 2);
  ba.push({ id, name: `${byId.get(id).name} BEFORE`, buf: before?.buf, why: p.current?.strike, flags: flagText(p.current) });
  ba.push({ id, name: `${byId.get(id).name} AFTER`, buf: after?.buf, flags: `${flagText(p.proposed)} ${p.proposed.date || ''}`.trim() });
}
for (let i = 0; i < ba.length; i += 50) { await sheet(ba.slice(i, i + 50), HERO_PX * 2, `${OUT}/photos/answers/proposed-${String(i / 50 + 1).padStart(2, '0')}.jpg`, `Answers, before and after the better-photo pass (pass two), 104 crop at 2x`); sheets++; }

// 3. The 300 most famous at 104 and at 52 (each drawn at 2x).
for (const [px, tag] of [[HERO_PX * 2, '104'], [LIST_PX * 2, '52']]) {
  const items = [];
  for (const id of famous) {
    const v = picks[id]?.proposed || picks[id]?.current;
    const c = v && v.crop ? await cropOf(v, HERO_PX * 2) : null;
    items.push({ id, name: byId.get(id).name, buf: c?.buf, why: v?.strike, flags: flagText(v) });
  }
  for (let i = 0; i < items.length; i += 50) { await sheet(items.slice(i, i + 50), px, `${OUT}/photos/famous/famous-${tag}-${String(i / 50 + 1).padStart(2, '0')}.jpg`, `300 most famous, ${tag} crop at 2x (${i + 1}-${Math.min(i + 50, items.length)})`); sheets++; }
}

// 4. The review set (R12): the proposed pick, else the current one, at 624.
const players = [], struck = [];
let below = 0;
for (const id of answers) {
  const p = byId.get(id);
  const v = picks[id]?.proposed || picks[id]?.current;
  if (!v || !v.ok) { struck.push({ id, name: p.name, reason: v?.strike || 'no photo on file' }); continue; }
  if (v.flags.notNamed) { struck.push({ id, name: p.name, file: v.file, reason: 'the file\'s own name and description do not name the player (R11)' }); continue; }
  // Pass two: a Wikidata image that does not face the camera, with no
  // replacement that passes every rule, leaves the answer without a photo.
  if (v.flags.profile) { struck.push({ id, name: p.name, file: v.file, reason: 'profile: not facing the camera, and no replacement passes every rule' }); continue; }
  if (v.dateFits === false) { struck.push({ id, name: p.name, file: v.file, reason: 'date does not fit the career' }); continue; }
  const c = await cropOf(v, REVIEW_PX);
  if (!c) { struck.push({ id, name: p.name, file: v.file, reason: 'could not fetch the picture' }); continue; }
  writeFileSync(`${OUT}/review-set/answers/${id}.jpg`, c.buf);
  if (c.px < REVIEW_PX) below++;
  const nat = (nations.p[id] || []).map((i) => nations.n[i])[0] || null;
  players.push({
    id, name: p.name, born: p.born, pos: SLOT[p.slot] || null, nat,
    licence: v.licence, author: v.author, page: v.page, file: v.file,
    how: v.how, names: v.names, date: v.date, dateFits: v.dateFits,
    crop: { x: v.crop.x, y: v.crop.y, s: v.crop.s, side: v.crop.side, offCentre: v.crop.offCentre },
    face: v.face, picture: { w: v.w, h: v.h },
    serves: v.crop.serves.hero ? 'both' : v.crop.serves.list ? 'list only' : 'neither',
    srcW: v.crop.srcW, reviewPx: c.px, flags: Object.entries(v.flags).filter(([, b]) => b).map(([k]) => k),
    // The measures a reviewer's rejects can be compared with (pass two):
    // frontal (yaw in degrees, nose offset in eye distances), sharpness
    // (Laplacian variance of the face at 128 px), face share of the crop.
    frontal: v.frontal ?? null, measures: v.measures || null,
    img: `${id}.jpg`,
  });
}
writeFileSync(`${OUT}/review-set/answers/players.json`, JSON.stringify(players, null, 1));
writeFileSync(`${OUT}/review-set/struck.json`, JSON.stringify(struck, null, 1));
console.log(`\nsheets: ${sheets} · review set: ${players.length} players (${below} below ${REVIEW_PX}px) · struck: ${struck.length}`);
const by = {}; for (const s of struck) by[s.reason] = (by[s.reason] || 0) + 1;
console.log(JSON.stringify(by, null, 1));
const serve = {}; for (const p of players) serve[p.serves] = (serve[p.serves] || 0) + 1;
console.log('sizes the set can serve:', JSON.stringify(serve));
