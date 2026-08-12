// build-lineup-data.mjs — the single payload the web lineup builder fetches.
//
//   node scripts/build-lineup-data.mjs
//
// ⚠️ ONE GLOBAL POOL, NOT ONE POOL PER CLUB. The first version scoped the picker
// to the selected club, which quietly made the tool useless for what people
// actually want to do with it: Alex went looking for Šeško and Bruno Fernandes,
// found neither, and reasonably concluded the player bank was empty. Both were
// present — at clubs other than the one selected. A fan building a rumoured XI
// or an all-time XI needs every player at once.
//
// ⚠️ THE BUILDER DOES NOT BORROW MYSTERY PLAYER'S ELIGIBILITY. That was the bug
// that hid Leny Yoro. Mystery Player is a similarity game: it needs a career
// graph, a position, a nationality and a birth year, so its guess pool demands
// all of them. Yoro (fame 32, current Manchester United CB) has NO P54 club
// membership on Wikidata at all — verified live — so he has no career rows, so
// the Mystery gate correctly rejects him, and the builder inherited that
// rejection. Ayden Heaven fell to the same gate for a missing position. A
// lineup builder needs a NAME; everything else is decoration. So this file has
// its own rule: every fame>=25 footballer from the core fetch is in, plus every
// current squad member, and a data gap degrades the card instead of deleting
// the player.
//
// Sources, unioned in trust order:
//   src/data/squads.json        current squads incl. reserves and academy —
//                               the truest "is there now" and best positions
//   src/data/mysteryPool.json   fame-ranked players with club + position
//   scripts/_mystery-core.json  every fame>=25 footballer, careers or not
//
// ⚠️ PHOTOLESS PLAYERS ARE INCLUDED and render as initials cards. Jamie Gittens
// and Geovany Quenda have ZERO freely-licensed photos on Commons — verified
// live, not assumed. A fan typing their name wants the player; an initials
// card is an answer, a silently missing player reads as a broken product. They
// sort below photographed players within the same activity tier.
//
// ⚠️ ATTRIBUTION TRAVELS WITH THE PHOTO. `a` (author) and `l` (licence) are the
// terms under which CC BY / BY-SA images may be used at all, so they ship in
// the same record as the filename rather than in a file someone can forget to
// load. The file-description URL is derivable from the filename and not stored.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';

// ⚠️ SKIP THE REDIRECTS. Special:FilePath answers 302 -> 301 -> 200, so every
// thumbnail costs two extra round trips. The real CDN path is derivable from
// the md5 of the underscored filename; two characters per player remove both
// hops, and going direct keeps the CORS header the canvas export depends on —
// the redirect chain drops it.
const hashPrefix = (file) => {
  const md5 = createHash('md5').update(String(file).replace(/ /g, '_')).digest('hex');
  return md5.slice(0, 2);      // renderer splits this into <a>/<ab>
};

const SQUADS = JSON.parse(readFileSync('src/data/squads.json', 'utf8'));
const POOL = JSON.parse(readFileSync('src/data/mysteryPool.json', 'utf8'));
const CORE = JSON.parse(readFileSync('scripts/_mystery-core.json', 'utf8'));
const PHOTOS = JSON.parse(readFileSync('src/data/mysteryPhotos.json', 'utf8'));
const P18 = JSON.parse(readFileSync('scripts/_mystery-p18.json', 'utf8'));
const CAREERS = JSON.parse(readFileSync('scripts/_mystery-careers.json', 'utf8'));
let FACES = {};
try { FACES = JSON.parse(readFileSync('src/data/playerFaces.json', 'utf8')); } catch {}
let REPICK = {};
try { REPICK = JSON.parse(readFileSync('src/data/photoRepick.json', 'utf8')); } catch {}
// Hand-curated overrides are the LAST WORD. `null` = every available photo
// fails Alex's bar (recent + sharp + face-on) → initials card, never a bad
// photo. Added 2026-08-10 after the automated repick chose a 127px thumbnail
// for Lammens while a 2871px portrait sat uncategorized on Commons.
let OVERRIDES = {};
try { OVERRIDES = JSON.parse(readFileSync('src/data/photoOverrides.json', 'utf8')); } catch {}
delete OVERRIDES._README;

const OUT = 'public/data/lineup.json';

// Wikidata's formal club names are not what a fan calls them. Trimming the
// legal suffixes is cosmetic, but "Manchester United F.C." next to "Arsenal"
// reads as a bug rather than a data source.
const tidyClub = (c) => String(c || '')
  .replace(/\s+(F\.?C\.?|A\.?F\.?C\.?|S\.?C\.?|C\.?F\.?|B\.?V\.?|S\.?A\.?D\.?)$/i, '')
  .replace(/^(FC|AFC|SC|CF|AC|SS|SSC|AS|RC|CD)\s+/i, '')
  .trim();

// ⚠️ FORWARD IS TESTED BEFORE MIDFIELD. Wikidata hands some players the
// unordered pair ["midfielder","forward"]; testing midfield first filed Messi,
// Pelé and Totti as MF. Same ordering as build-mystery-pool-v2, kept in sync.
function slotOf(poss) {
  const s = (poss || []).join(' ').toLowerCase();
  if (!s) return null;
  if (/goalkeep|keeper/.test(s)) return 'GK';
  if (/\bback\b|defend|sweeper|stopper/.test(s)) return 'DF';
  if (/\bforward\b|striker|winger/.test(s)) return 'FW';
  if (/midfield|playmaker/.test(s)) return 'MF';
  if (/attack/.test(s)) return 'FW';
  return null;
}

// ── assemble the population ────────────────────────────────────────────────
const players = new Map();
const src = { squads: 0, pool: 0, core: 0 };

// Squads first: truest current club, most specific position, and the reserves
// and academy players the fame pool floors out of.
for (const [club, squad] of Object.entries(SQUADS))
  for (const p of squad) {
    if (players.has(p.id)) continue;
    src.squads++;
    players.set(p.id, { id: p.id, name: p.name, slot: p.slot || null,
      club, born: p.born || null, nat: p.nat || null, squad: 1 });
  }

// The fame pool fills in named clubs and positions for everyone it covers.
for (const p of POOL) {
  if (players.has(p.id)) continue;
  src.pool++;
  players.set(p.id, { id: p.id, name: p.name, slot: p.slot || null,
    club: tidyClub(p.club), born: p.born || null,
    nat: p.nat || p.country || null, squad: 0 });
}

// Core remainder: the players Mystery's gates reject — no career recorded
// (Yoro), no position (Heaven). A blank club is honest; absence is not.
for (const p of CORE) {
  if (players.has(p.id)) continue;
  src.core++;
  players.set(p.id, { id: p.id, name: p.name, slot: slotOf(p.poss),
    club: null, born: p.born || null, nat: (p.nats && p.nats[0]) || null, squad: 0 });
}

// ⚠️ BORN-BEFORE-1980 CUT — Alex, 2026-08-10, "for now, to declutter the search
// bank". Removes Zidane (1972), Ronaldo R9 (1976), Beckham (1975), Totti
// (1976) and Buffon (1978) along with Pelé, Maradona and Cruyff. Players with
// NO recorded birth year are KEPT — that gap is far more often a current
// fringe player than a pre-war one, and dropping them would repeat the
// mistake that hid Luke Shaw.
const BORN_FROM = 1980;
for (const [id, p] of [...players]) if (p.born && p.born < BORN_FROM) players.delete(id);

// Active = in a current squad, or holding an open club spell begun 2015+.
// ⚠️ Known limit: a player with no P54 at all (Yoro) cannot be proven active
// and sorts with the retired until the squad refresh picks him up. Search
// still finds him. Do NOT fabricate activity from birth year.
const okYear = (y) => Number.isFinite(y) && y >= 1850 && y <= 2027;
const isActive = (id, inSquad) => {
  if (inSquad) return true;
  return (CAREERS[id] || []).some((c) => okYear(c.start) && c.start >= 2015 && !c.end);
};

// ── photo resolution: a re-picked photo beats P18, either beats nothing ────
const TARGET_FACE = 0.42;      // fraction of the card the face occupies
const CARD_PX = 320;
// ⚠️ CARD_PX ALONE ASKED FOR 1x AND SHIPPED IT TO EVERY DEVICE. srcW used to
// be CARD_PX/side, which delivers a crop of exactly 320px — so all 5,463
// cropped photos were 1x, on retina phones and in the 1080px export alike.
// Measured across the pool: ZERO players were being served a retina-sharp
// crop. That is what "high resolution photos for everyone" was failing on.
//
// CROP_PX is the width we now want ACROSS THE CROP. The request is capped by
// what Commons actually holds (scripts/_source-dims.json) — asking for more
// than the original just returns the original and wastes a redirect — and by
// MAX_SRC so a tight face on a huge original cannot pull a multi-megabyte
// file onto a pitch showing eleven of them.
const CROP_PX = 640;
// ⚠️ 500 IS A HARD CEILING, NOT A PREFERENCE. The Commons CDN serves only
// pre-rendered widths — MEASURED on a real file this session: 250 and 500
// return real JPEGs, 640/800/1000/1500/1800 ALL return HTTP 400. The only
// path that renders arbitrary widths is Special:FilePath, which redirects
// 302->301->200 AND drops the CORS header — and a tainted canvas breaks the
// "Download image" export outright. So asking for more than 500 buys a slow
// round trip and a broken export, not a sharper face.
//
// This is why the crop path CANNOT deliver "high resolution for everyone".
// A Commons-hosted crop tops out at side*500 px. True retina needs images we
// host ourselves, which is exactly what the cutout pipeline produces: cut
// once, store a square PNG, serve it from our own bucket with CORS intact and
// the head already scaled to a fixed fraction. Cutouts fix resolution, head
// uniformity and CORS in one move; crop-width tuning fixes none of them.
const MAX_SRC = 500;
let SRC_DIMS = {};
try { SRC_DIMS = JSON.parse(readFileSync('scripts/_source-dims.json', 'utf8')); }
catch { console.warn('  ! _source-dims.json missing — run scripts/fetch-source-dims.mjs; falling back to uncapped requests'); }
// Same framing maths as build-player-faces.mjs — ONE crop model everywhere,
// so the picker, the pitch and the export cannot disagree.
function repickBox(b, id) {
  if (!b || b.h == null) return null;          // early trial rows lacked h
  const side = Math.min(1, b.w / TARGET_FACE);
  const cx = b.x + b.w / 2, cy = b.y + b.h * 0.42;
  const x = Math.max(0, Math.min(1 - side, cx - side / 2));
  const y = Math.max(0, Math.min(1 - side, cy - side / 2));
  return [+x.toFixed(4), +y.toFixed(4), +side.toFixed(4), srcWidthFor(side, id)];
}
// Shared by BOTH box paths. The pre-baked FACES boxes carry their own stale
// 1x srcW and bypass repickBox entirely — recomputing there too is the
// difference between fixing 2,129 players and fixing a subset of them.
function srcWidthFor(side, id) {
  const want = Math.ceil(CROP_PX / side / 50) * 50;
  const have = (SRC_DIMS[id] || {}).w || 0;
  return Math.min(MAX_SRC, have || MAX_SRC, want);
}
function photoOf(id) {
  if (id in OVERRIDES) {
    const ov = OVERRIDES[id];
    if (!ov) return null;                        // curated "no acceptable photo"
    return { f: ov.file, a: ov.author, l: ov.licence, x: repickBox(ov.box, id) };
  }
  const rp = REPICK[id];
  if (rp && rp.file) return { f: rp.file, a: rp.author, l: rp.licence, x: repickBox(rp.box, id) };
  const ph = PHOTOS[id], file = P18[id];
  if (ph && file) {
    const fc = FACES[id];
    return { f: file, a: ph.author, l: ph.licence, x: fc ? [fc.x, fc.y, fc.s, srcWidthFor(fc.s, id)] : null };
  }
  return null;
}

// ── rank and emit ──────────────────────────────────────────────────────────
const fame = new Map(POOL.map((p) => [p.id, p.fame || 0]));
for (const p of CORE) if (!fame.has(p.id)) fame.set(p.id, p.fame || 0);

const rows = [...players.values()]
  .map((p) => ({ ...p, active: isActive(p.id, p.squad), photo: photoOf(p.id) }))
  // Active before retired (Alex: "we first and foremost want ACTIVE players"),
  // photographed before initials cards, then fame, then name.
  .sort((a, b) => (b.active - a.active)
    || ((b.photo ? 1 : 0) - (a.photo ? 1 : 0))
    || (fame.get(b.id) || 0) - (fame.get(a.id) || 0)
    || a.name.localeCompare(b.name))
  .map((p) => ({
    i: p.id, n: p.name, s: p.slot, c: p.club || null,
    b: p.born, t: p.nat, q: p.squad, v: p.active ? 1 : 0,
    f: p.photo ? p.photo.f : null,
    h: p.photo ? hashPrefix(p.photo.f) : null,
    a: p.photo ? p.photo.a : null,
    l: p.photo ? p.photo.l : null,
    x: p.photo ? p.photo.x : null,
  }));

// ⚠️ PRE-FILL DRAWS FROM squads.json ONLY, never the fame pool's club label —
// that label means "the club a player is KNOWN for" (it led a Manchester
// United filter with Rooney and Fellaini). Pre-fill also still REQUIRES a
// photo: a pre-filled XI of initials cards reads as a broken tool, and every
// squad regular has one. A club that cannot field one GK, three DF, three MF
// and one FW with photos is not offered at all.
const bySlotRank = {};
for (const [club, squad] of Object.entries(SQUADS)) {
  const eligible = squad
    .filter((p) => photoOf(p.id) && p.slot)
    .sort((a, b) => (fame.get(b.id) || 0) - (fame.get(a.id) || 0));
  const buckets = { GK: [], DF: [], MF: [], FW: [], CB: [], FB: [] };
  for (const p of eligible) {
    if (!buckets[p.slot]) continue;
    buckets[p.slot].push(p.id);
    if (p.slot === 'DF') {
      const pos = String(p.position || '');
      if (/full.?back|wing.?back|left.?back|right.?back/.test(pos)) buckets.FB.push(p.id);
      else if (/centre.?back|center.?back|centre.?half|centerhalf|stopper/.test(pos)) buckets.CB.push(p.id);
    }
  }
  if (buckets.GK.length && buckets.DF.length >= 3 && buckets.MF.length >= 3 && buckets.FW.length)
    bySlotRank[club] = buckets;
}

mkdirSync('public/data', { recursive: true });
writeFileSync(OUT, JSON.stringify({ players: rows, teams: bySlotRank }));

// ── report — measured, so a regression is visible in the build log ─────────
const bytes = readFileSync(OUT).length;
const withPhoto = rows.filter((r) => r.f).length;
const withCrop = rows.filter((r) => r.x).length;
const active = rows.filter((r) => r.v).length;
const noDob = rows.filter((r) => !r.b).length;
const repicked = rows.filter((r) => REPICK[r.i] && REPICK[r.i].file).length;
console.log(`wrote ${OUT} — ${rows.length} players, ${(bytes / 1024).toFixed(0)}kB`);
console.log(`  sources: squads ${src.squads} · mystery pool +${src.pool} · core-only +${src.core} (before the born cut)`);
console.log(`  born ${BORN_FROM}+ · kept ${noDob} with no recorded birth year`);
console.log(`  active ${active} · retired/unrecorded ${rows.length - active} (selectable, ranked below)`);
console.log(`  with a photo ${withPhoto} · initials cards ${rows.length - withPhoto} · face-cropped ${withCrop} · re-picked ${repicked}`);
console.log(`  pre-fillable teams: ${Object.keys(bySlotRank).length} of ${Object.keys(SQUADS).length} clubs`);

// The names a fan will type. If any are missing the pool is wrong — fail loud
// here, not in a playtest. Yoro, Heaven and Andrey Santos are on this list
// BECAUSE each was missing once, each for a different reason.
const CHECK = ['Benjamin Šeško', 'Bruno Fernandes', 'Erling Haaland', 'Kylian Mbappé',
  'Lamine Yamal', 'Jude Bellingham', 'Mohamed Salah', 'Bukayo Saka',
  'Leny Yoro', 'Ayden Heaven', 'Andrey Santos', 'Jamie Gittens'];
const byName = new Map(rows.map((r) => [r.n, r]));
const missing = CHECK.filter((n) => !byName.has(n));
if (missing.length) {
  console.error(`\n✗ MISSING: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`\nspot-check: all ${CHECK.length} names present`);
for (const n of CHECK.slice(8)) {
  const r = byName.get(n);
  console.log(`  ${n.padEnd(16)} ${r.f ? 'photo' : 'initials card'}${r.s ? ' · ' + r.s : ''}${r.c ? ' · ' + r.c : ''}`);
}
