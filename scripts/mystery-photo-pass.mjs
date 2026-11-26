// mystery-photo-pass.mjs — the photo work of Job A for the curated answers and
// the most famous guessable players (A4, A5, R8, R9, R11, R12).
//
//   swiftc -O -o <dir>/facebox scripts/facebox/main.swift
//   FACEBOX=<dir>/facebox node scripts/mystery-photo-pass.mjs <workdir> <phase>
//     phases, in order (each resumes from <workdir>/state.json):
//       meta        Commons size, licence, author, description, date of each
//                   player's Wikidata image (P18), and his Commons category (P373)
//       candidates  the files in that category (R9), filtered by metadata
//       detect      face boxes for every file above (Apple Vision, offline)
//       score       crop rule, quality flags, candidate ranking; writes
//                   scripts/_mystery-photo-picks.json and <workdir>/candidates.json
//
// WHO IT IS rests on provenance only (R11), never on recognising a face:
//   · the file is the Wikidata image of that exact player id (P18), or sits in
//     the Commons category that id's own record links to (P373): no name search
//   · the file's own name or description names the player (checked here as
//     text; every file where it does not is flagged)
//   · where a date is on file it fits the career (not before he was 15)
//   · exactly one face
// Matching is on the id throughout; the name is used only to READ a file's
// own words, never to find a file.
//
// Polite fetching as scripts/build-player-faces.mjs: one request at a time,
// its User-Agent, pauses, 429 backs off, 403 stops the run. Pictures are
// fetched at 600 px for detection, measured, and deleted; nothing large stays.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { faceCrop, HERO_PX, LIST_PX, DENSITY } from '../src/lib/photoCrop.js';
import { normaliseName } from '../src/lib/mysteryPlayer.js';
import { FACE_CONF_MIN } from './audit-mystery-photo-rules.mjs';

const WORK = process.argv[2];
const PHASE = process.argv[3];
if (!WORK || !PHASE) { console.error('usage: node scripts/mystery-photo-pass.mjs <workdir> <meta|candidates|detect|score>'); process.exit(1); }
const FACEBOX = process.env.FACEBOX || '/tmp/facebox';
const UA = 'BallIQ/1.0 (https://balliq.app; portrait framing)';
const API = 'https://commons.wikimedia.org/w/api.php';
mkdirSync(WORK, { recursive: true });
const STATE = `${WORK}/state.json`;
const S = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { cat: {}, meta: {}, members: {}, faces: {}, stats: {} };
const save = () => writeFileSync(STATE, JSON.stringify(S));
for (const v of Object.values(S.meta)) if (v && !(v.file in S.meta)) S.meta[v.file] = v;

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const pool = read('src/data/mysteryPool.json');
const answers = read('src/data/mysteryAnswers.json');
const P18 = read('scripts/_mystery-p18.json');
const byId = new Map(pool.map((p) => [p.id, p]));
const FAMOUS = [...pool].sort((a, b) => (b.fame || 0) - (a.fame || 0)).slice(0, 300).map((p) => p.id);
const TARGETS = [...new Set([...answers, ...FAMOUS])];
const sleep = (ms) => new Promise((s) => setTimeout(s, ms));
const CANDS = 5;
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const FREE = /^(CC0|CC BY|Public domain|PD|No restrictions|Attribution)/i;
const NOTFREE = /\bNC\b|\bND\b|non-commercial|noderiv|fair use|non-free|GFDL/i;
const title = (f) => String(f).replace(/_/g, ' ');

async function get(url, label, binary = false) {
  for (let a = 1; a <= 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: binary ? '*/*' : 'application/json' }, signal: AbortSignal.timeout(60000) });
      if (r.status === 403) { console.error(`\nBLOCKED (HTTP 403) at ${label}: stopping; the checkpoint keeps what is done`); save(); process.exit(2); }
      if (r.status === 429) {
        if (a === 4) { console.error(`\nRATE-LIMITED (429) four times at ${label}: stopping`); save(); process.exit(2); }
        await sleep(15000 * a); continue;
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (binary) return Buffer.from(await r.arrayBuffer());
      const t = await r.text();
      if (!t.trimEnd().endsWith('}')) throw new Error('truncated');
      return JSON.parse(t);
    } catch (e) {
      if (a === 4) { console.error(`  ! ${label}: ${e.message}`); return null; }
      await sleep(4000 * a);
    }
  }
  return null;
}

// imageinfo for up to 40 titles; fills S.meta[file].
async function metaFor(files) {
  const need = files.filter((f) => !(title(f) in S.meta));
  for (let i = 0; i < need.length; i += 40) {
    const batch = need.slice(i, i + 40);
    const j = await get(`${API}?action=query&format=json&redirects=1&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=600&titles=`
      + encodeURIComponent(batch.map((f) => 'File:' + title(f)).join('|')), `meta ${i}`);
    if (!j) continue;
    const norm = new Map((j.query?.normalized || []).map((x) => [x.from, x.to]));
    const redir = new Map((j.query?.redirects || []).map((x) => [x.from, x.to]));
    const pages = new Map(Object.values(j.query?.pages || {}).map((p) => [p.title, p]));
    for (const f of batch) {
      let t = 'File:' + title(f); t = norm.get(t) || t; t = redir.get(t) || t;
      const ii = pages.get(t)?.imageinfo?.[0];
      if (!ii) { S.meta[title(f)] = null; continue; }
      const em = ii.extmetadata || {};
      S.meta[title(f)] = {
        file: t.replace(/^File:/, ''), w: ii.width, h: ii.height, mime: ii.mime, url: ii.url, thumb600: ii.thumburl, page: ii.descriptionurl,
        licence: strip(em.LicenseShortName?.value), author: strip(em.Artist?.value).slice(0, 160),
        desc: strip(em.ImageDescription?.value).slice(0, 400), object: strip(em.ObjectName?.value).slice(0, 200),
        date: strip(em.DateTimeOriginal?.value).slice(0, 40),
      };
      // Also under the canonical title Commons answered with (after a redirect
      // or a normalised first letter), which is what later phases look up.
      S.meta[S.meta[title(f)].file] = S.meta[title(f)];
    }
    save();
    await sleep(900);
  }
}

// ── phase: meta ─────────────────────────────────────────────────────────────
if (PHASE === 'meta') {
  const needCat = answers.filter((id) => !(id in S.cat));
  for (let i = 0; i < needCat.length; i += 100) {
    const chunk = needCat.slice(i, i + 100);
    const q = `SELECT ?p ?cat WHERE { VALUES ?p { ${chunk.map((id) => 'wd:' + id).join(' ')} } ?p wdt:P373 ?cat }`;
    const r = await get('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), `P373 ${i}`);
    if (!r) continue;
    for (const id of chunk) S.cat[id] = null;
    for (const b of r.results.bindings) S.cat[b.p.value.split('/').pop()] = b.cat.value;
    save();
    await sleep(900);
  }
  await metaFor(TARGETS.map((id) => P18[id]).filter(Boolean));
  console.log(`categories: ${Object.values(S.cat).filter(Boolean).length}/${answers.length} · P18 metadata: ${TARGETS.filter((id) => P18[id] && S.meta[title(P18[id])]).length}/${TARGETS.length}`);
}

// ── shared readers ──────────────────────────────────────────────────────────
const NAME_STOP = new Set(['de', 'da', 'do', 'dos', 'van', 'von', 'der', 'den', 'del', 'la', 'le', 'di', 'jr', 'junior', 'el', 'al']);
/** Does a file's own name, title or description name this player? Text only. */
export function namesPlayer(m, player) {
  const text = ` ${normaliseName(`${m.file} ${m.object} ${m.desc}`)} `;
  const full = normaliseName(player.name);
  if (text.includes(` ${full} `)) return true;
  const parts = full.split(' ').filter((w) => w.length >= 3 && !NAME_STOP.has(w));
  const last = parts[parts.length - 1];
  return !!last && text.includes(` ${last} `);
}
const SCENE = /periodist|journalist|reporter|televisions|crowd|supporters|\bfans\b|concert|\bshow do\b|samba|tribute|memorial|funeral|grave|tomb/i;
const ART = /\bpanel\b|mural|graffit|mosaic|statue|sculpt|\bbust\b|street.?art|painting|drawing|caricature|cartoon|wax|madame tussaud|cardboard|cutout|poster|banner|tifo|stamp|sticker|trading card|panini|figurine|wall ?art|artwork|portrait painted|\bart\b|denkmal|estatua|est[aá]tua|murale|pintura|dibujo|fresque|statua/i;
const yearOf = (d) => { const m = String(d || '').match(/\b(18|19|20)\d\d\b/); return m ? Number(m[0]) : null; };
// A picture, freely licensed, with an author to credit. Its SIZE is judged by
// the crop rule (3x at a display size), not here.
const usableMeta = (m) => !!m && /jpe?g|png|tiff?/i.test(m.mime || m.file) && FREE.test(m.licence) && !NOTFREE.test(m.licence) && !!m.author;

// ── phase: candidates (R9) ─────────────────────────────────────────────────
if (PHASE === 'candidates') {
  let n = 0;
  for (const id of answers) {
    if (id in S.members) continue;
    const cat = S.cat[id];
    if (!cat) { S.members[id] = []; continue; }
    const j = await get(`${API}?action=query&format=json&list=categorymembers&cmtype=file&cmlimit=60&cmtitle=` + encodeURIComponent('Category:' + cat), `cat ${id}`);
    if (!j) continue; // not recorded: retried next run
    const files = (j.query?.categorymembers || []).map((m) => m.title.replace(/^File:/, ''));
    await sleep(500);
    await metaFor(files);
    const p = byId.get(id);
    // Keep the eight most promising by what the metadata can say: free, named,
    // a picture, dated after he was 15; newest first, then the largest.
    const keep = files.map((f) => S.meta[title(f)]).filter((m) => usableMeta(m) && namesPlayer(m, p))
      .filter((m) => { const y = yearOf(m.date); return !y || y >= p.born + 15; })
      .filter((m) => m.w / m.h <= 2)
      .sort((a, b) => (yearOf(b.date) || 0) - (yearOf(a.date) || 0) || b.w * b.h - a.w * a.h)
      .slice(0, 8).map((m) => m.file);
    S.members[id] = keep;
    if (++n % 20 === 0) { save(); process.stdout.write(`  ${n} categories read\r`); }
  }
  save();
  console.log(`\ncandidates kept: ${Object.values(S.members).reduce((a, b) => a + b.length, 0)} for ${Object.values(S.members).filter((x) => x.length).length} answers`);
}

// ── phase: detect ───────────────────────────────────────────────────────────
if (PHASE === 'detect') {
  if (!existsSync(FACEBOX)) { console.error(`no detector at ${FACEBOX}`); process.exit(1); }
  // Five candidates an answer at most (newest first, as the candidates phase
  // ordered them): enough to find a better picture, polite to Commons.
  const files = [...new Set([...TARGETS.map((id) => P18[id] && title(P18[id])), ...Object.values(S.members).flatMap((l) => l.slice(0, CANDS))].filter(Boolean))]
    .map((f) => S.meta[f] ? S.meta[f].file : null).filter((f) => f && !(f in S.faces));
  console.log(`${files.length} pictures to detect`);
  const TMP = `${WORK}/tmp`;
  for (let i = 0; i < files.length; i += 30) {
    rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
    const paths = new Map();
    for (const f of files.slice(i, i + 30)) {
      const m = S.meta[f];
      const buf = m?.thumb600 ? await get(m.thumb600, `img ${f}`, true) : null;
      if (buf && ((buf[0] === 0xFF && buf[1] === 0xD8) || (buf[0] === 0x89 && buf[1] === 0x50))) {
        const p = `${TMP}/${paths.size}.img`;
        writeFileSync(p, buf); paths.set(p, f);
      }
      await sleep(400);
    }
    let out = '';
    try { out = execFileSync(FACEBOX, [...paths.keys()], { encoding: 'utf8', maxBuffer: 64 << 20 }); } catch (e) { console.error('detector failed', e.message); }
    for (const line of out.split('\n').filter(Boolean)) {
      let r; try { r = JSON.parse(line); } catch { continue; }
      const f = paths.get(r.file); if (!f) continue;
      if (!r.ok) { if (r.err !== 'unreadable') S.faces[f] = false; continue; }
      const face = { x: +r.x.toFixed(4), y: +r.y.toFixed(4), w: +r.w.toFixed(4), h: +r.h.toFixed(4), conf: +r.conf.toFixed(2), faces: r.faces };
      // Brightness of the face region itself (mean luminance 0-255), for the dark flag.
      try {
        const meta = await sharp(r.file).metadata();
        const crop = faceCrop(face, { w: meta.width, h: meta.height });
        const reg = crop.ok ? { left: crop.left, top: crop.top, width: crop.side, height: crop.side }
          : { left: Math.max(0, Math.round(face.x * meta.width)), top: Math.max(0, Math.round(face.y * meta.height)), width: Math.max(1, Math.round(face.w * meta.width)), height: Math.max(1, Math.round(face.h * meta.height)) };
        reg.width = Math.min(reg.width, meta.width - reg.left); reg.height = Math.min(reg.height, meta.height - reg.top);
        const st = await sharp(r.file).extract(reg).greyscale().stats();
        face.lum = Math.round(st.channels[0].mean);
        face.sharp = +(st.sharpness || 0).toFixed(2);
      } catch { /* leave lum out */ }
      S.faces[f] = face;
    }
    save();
    process.stdout.write(`  ${Math.min(i + 30, files.length)}/${files.length}\r`);
  }
  rmSync(TMP, { recursive: true, force: true });
  console.log('');
}

// ── phase: score ────────────────────────────────────────────────────────────
// The verdict on one file for one player: provenance, the crop, the flags.
export function judge(file, player, how) {
  const m = S.meta[file];
  const f = S.faces[file];
  const v = { file, how, ok: false, strike: null };
  if (!m) { v.strike = 'no Commons record'; return v; }
  Object.assign(v, { page: m.page, url: m.url, w: m.w, h: m.h, licence: m.licence, author: m.author, date: m.date || null });
  v.names = namesPlayer(m, player);
  const y = yearOf(m.date);
  v.dateFits = y == null ? null : y >= player.born + 15 && y <= 2026;
  if (!usableMeta(m)) { v.strike = 'licence, author or format'; return v; }
  if (f === undefined) { v.strike = 'not detected'; return v; }
  if (f === false) { v.strike = 'no face'; return v; }
  v.face = { x: f.x, y: f.y, w: f.w, h: f.h, conf: f.conf, faces: f.faces };
  if (f.faces !== 1) { v.strike = 'more than one face'; return v; }
  if (f.conf < FACE_CONF_MIN) { v.strike = 'low face confidence'; return v; }
  if (v.dateFits === false) { v.strike = `date ${y} does not fit (born ${player.born})`; return v; }
  // A file whose own name says it shows someone else too ("Alisson Becker and
  // Virgil van Dijk") is never a candidate, even when the detector found one
  // face: the other person may be turned away or cut off. On the Wikidata
  // image itself it is a flag for the reader.
  v.othersNamed = /\s(and|&|with|y|e|und|et|con|mit)\s/i.test(` ${m.file.replace(/\.[a-z]+$/i, '')} `);
  if (v.othersNamed && how === 'category') { v.strike = 'the file name names someone else too'; return v; }
  // ⚠️ NOT A PHOTOGRAPH OF HIM. A player's own category holds murals, mosaics,
  // statues and fan art, newly dated and named for him, and the first run
  // proposed a mural of Ronaldo and a mosaic of Zlatan over real photographs.
  // A face detector finds a face on a mural, so the words decide.
  v.artwork = ART.test(`${m.file} ${m.object} ${m.desc}`);
  if (v.artwork && how === 'category') { v.strike = 'artwork, not a photograph (file name or description)'; return v; }
  // A file whose own words describe a scene, not him: the second run proposed
  // a reporter outside Dani Alves's trial ("Periodistes i televisions davant
  // del palau de justícia …") and the samba singer Bebeto's show filed in the
  // footballer's category. Read from the words, never from the face.
  v.scene = SCENE.test(`${m.file} ${m.object} ${m.desc}`);
  if (v.scene && how === 'category') { v.strike = 'the file describes a scene or someone else (file name or description)'; return v; }
  const crop = faceCrop(f, { w: m.w, h: m.h });
  if (!crop.ok) { v.strike = `crop: ${crop.reason}`; return v; }
  v.crop = crop;
  v.flags = {
    dark: f.lum != null && f.lum < 70,
    smallFace: !crop.serves.hero,
    wide: m.w / m.h > 1.3,
    offCentre: crop.offCentre > 0.1,
    notNamed: !v.names,
    othersNamed: v.othersNamed,
    artwork: v.artwork,
    scene: v.scene,
  };
  if (!crop.serves.list) { v.strike = 'cannot reach 3x at the list size'; return v; }
  v.lum = f.lum ?? null;
  // Machine score: resolution first, then light, then a centred crop, then a
  // recent picture. Not a verdict on identity, only on what a sheet will show.
  v.score = Math.round(Math.min(1, crop.side / (HERO_PX * DENSITY * 2)) * 50
    + (f.lum == null ? 0 : f.lum < 60 ? -30 : f.lum < 80 ? -10 : f.lum <= 200 ? 15 : 0)
    + (1 - Math.min(1, crop.offCentre / 0.15)) * 10
    + (y ? Math.max(0, Math.min(10, y - 2010)) : 0)
    + (v.names ? 10 : -20));
  v.ok = true;
  return v;
}

if (PHASE === 'score') {
  const picks = {};
  const cands = {};
  const count = {};
  const bump = (k) => { count[k] = (count[k] || 0) + 1; };
  for (const id of TARGETS) {
    const p = byId.get(id);
    const inc = P18[id] && S.meta[title(P18[id])] ? judge(S.meta[title(P18[id])].file, p, 'P18') : { ok: false, strike: P18[id] ? 'no Commons record' : 'no Wikidata image' };
    const isAnswer = answers.includes(id);
    const others = isAnswer ? (S.members[id] || []).slice(0, CANDS).filter((f) => !P18[id] || f !== S.meta[title(P18[id])]?.file).map((f) => judge(f, p, 'category')) : [];
    const good = others.filter((c) => c.ok).sort((a, b) => b.score - a.score);
    // ⚠️ A CLEAN WIKIDATA IMAGE IS KEPT. A candidate is proposed only where the
    // current picture is struck, or carries a quality flag the candidate does
    // not (dark, small face, wide, off-centre, not named, names others), and
    // scores higher. Recency alone never replaces a good photograph.
    const flagCount = (x) => Object.values(x.flags || {}).filter(Boolean).length;
    const better = good.filter((c) => !inc.ok || (flagCount(inc) > flagCount(c) && c.score > inc.score));
    const best = better[0] || (inc.ok ? inc : null);
    picks[id] = {
      name: p.name, answer: isAnswer, famous: FAMOUS.includes(id),
      current: inc, proposed: best && best !== inc ? best : null,
    };
    if (isAnswer) {
      cands[id] = { name: p.name, category: S.cat[id] || null, current: inc, top3: good.slice(0, 3) };
      bump(`answers: current ${inc.ok ? 'usable' : `struck (${inc.strike})`}`);
      bump(`answers: ${best ? (best === inc ? 'keep current' : 'better candidate proposed') : 'no usable photo at all'}`);
      if (!S.cat[id]) bump('answers: no Commons category (P373)');
      if (inc.ok) for (const [k, v] of Object.entries(inc.flags)) if (v) bump(`answers current flag: ${k}`);
    }
    if (FAMOUS.includes(id)) bump(`famous: current ${inc.ok ? 'usable' : `struck (${inc.strike})`}`);
  }
  writeFileSync('scripts/_mystery-photo-picks.json', JSON.stringify(picks));
  writeFileSync(`${WORK}/candidates.json`, JSON.stringify(cands, null, 1));
  console.log(Object.entries(count).sort().map(([k, v]) => `${k}: ${v}`).join('\n'));
}
