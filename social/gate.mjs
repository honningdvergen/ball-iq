// Pre-publish gate — every rule Alex has had to say twice, enforced instead of remembered.
//
//   node social/gate.mjs check  --platform instagram --caption cap.txt [--settings '{}'] media1.png media2.png …
//   node social/gate.mjs record --platform instagram --post <postId> media…     (after a successful create)
//   node social/gate.mjs seen   media…                                           (which platforms a file already went to)
//
// `social/pz posts:create` runs `check` and `record` for you — call this directly only to test.
//
// Rules (each one is a mistake that actually happened):
//   · Facebook          → BLOCK. FB reach only comes from Alex posting in the IG app with Share to
//                         Facebook; Postiz/MBS FB posts get 0–33 views (09-22/09-23 route test).
//   · IG carousel > 10  → BLOCK. The API rejects it (car_B failed 09-23).
//   · Kalshi / Stake    → BLOCK. "We are not partners with them" (Alex 09-23). Caption + file names;
//                         there is no OCR here, so an image with the logo still needs your eyes.
//   · Repeat            → BLOCK. "Never post anything twice" (Alex 09-23, after the Endrick printer
//                         came back). Every image, and 3 frames of every video, is fingerprinted
//                         (dHash); a match on the SAME platform within Hamming 6 is a repeat. The same
//                         reel on TikTok and YouTube is fine — that's distribution, not a repeat.
//                         The last slide of a carousel is exempt: it's the Follow CTA, reused on purpose.
//   · Double audio      → BLOCK. An IG `audio` track on a clip that already has sound plays both
//                         (the 7-points reel, 09-22).
//   · Empty caption     → BLOCK on Instagram/TikTok/YouTube.
//   · Silent video      → BLOCK on TikTok/Instagram/YouTube (mean ≤ −40 dB, no IG track): Alex deleted
//                         the quiet quiz reel from TikTok, 09-23 — "not fit for tiktok at all".
//
// State lives in social/state/ (in the repo, not /tmp — a reboot must not wipe "never twice").

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(HERE, 'state');
const HASHES = path.join(STATE, 'hashes.json');
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const FFPROBE = FFMPEG.replace(/ffmpeg$/, 'ffprobe');
const BANNED = /kalshi|\bstake(\.com|\s*(bet|casino|sportsbook))?\b|polymarket/i;
const MATCH = 6;          // max Hamming distance (of 64 bits) that counts as the same picture
const VIDEO = /\.(mp4|mov|m4v|webm)$/i;

export const PLATFORMS = {
  cmu9lqvlu0epls40yekgje5i2: 'instagram',
  cmu9lrmr90et0mi0yeb84yykm: 'facebook',
  cmub1plxb007apg0yn63flv4l: 'threads',
  cmu9lzcgv0exbmi0yhat4pawy: 'youtube',
  cmu9lyiaj0esbs40yo64ksyd8: 'tiktok',
};

const load = () => { try { return JSON.parse(fs.readFileSync(HASHES, 'utf8')); } catch { return []; } };
const save = (db) => { fs.mkdirSync(STATE, { recursive: true }); fs.writeFileSync(HASHES, JSON.stringify(db, null, 1)); };

function dhashAt(file, ss) {
  const args = ['-v', 'error', ...(ss != null ? ['-ss', String(ss)] : []), '-i', file, '-frames:v', '1',
    '-vf', 'scale=9:8:flags=area,format=gray', '-f', 'rawvideo', '-'];
  const px = execFileSync(FFMPEG, args, { maxBuffer: 1 << 20 });
  if (px.length < 72) throw new Error(`could not read a frame from ${file}`);
  let bits = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits = (bits << 1n) | (px[y * 9 + x] > px[y * 9 + x + 1] ? 1n : 0n);
  return bits.toString(16).padStart(16, '0');
}
const duration = (f) => Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()) || 0;
export function fingerprint(file) {
  if (!VIDEO.test(file)) return [dhashAt(file)];
  const d = duration(file);
  return [0.25, 0.5, 0.75].map((p) => dhashAt(file, (d * p).toFixed(2)));
}
const ham = (a, b) => { let x = BigInt('0x' + a) ^ BigInt('0x' + b), n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };
function findRepeat(fp, platform, db) {
  const need = fp.length === 1 ? 1 : 2;   // video: 2 of 3 frames must match
  return db.find((e) => e.platform === platform && e.fp.length === fp.length &&
    fp.filter((h, i) => ham(h, e.fp[i]) <= MATCH).length >= need);
}
// ffmpeg prints volumedetect to STDERR (the first version read stdout, got NaN, and let a silent
// clip PASS — caught by the 09-23 test). No audio stream at all counts as silent.
const meanVolume = (f) => {
  const r = spawnSync(FFMPEG, ['-i', f, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = String(r.stderr || '').match(/mean_volume: (-?[\d.]+)/);
  return m ? Number(m[1]) : -Infinity;
};

export const seenAs = (file, platform) => findRepeat(fingerprint(file), platform, load());

export function check({ platform, caption = '', settings = {}, media = [], unmapped = 0 }) {
  const block = [], warn = [];
  if (platform === 'facebook' && process.env.PZ_ALLOW_FB !== '1')
    block.push('Facebook: FB reach only comes from Alex posting in the IG app with Share to Facebook ON. Claude does not schedule FB (09-23 route test: Postiz/MBS FB posts got 0–33 views). Override: PZ_ALLOW_FB=1.');
  if (platform === 'instagram' && media.length + unmapped > 10)
    block.push(`Instagram carousel has ${media.length + unmapped} items — the API maximum is 10.`);
  const bannedText = [caption, ...media.map((f) => path.basename(f))].find((t) => BANNED.test(t));
  if (bannedText) block.push(`Kalshi/Stake/betting mention ("${bannedText.match(BANNED)[0]}") — not partners, never post it (Alex 09-23).`);
  if (['instagram', 'tiktok', 'youtube'].includes(platform) && !caption.trim()) block.push('Empty caption.');

  const db = load();
  const isCarousel = media.length >= 3 && !media.some((f) => VIDEO.test(f));
  media.forEach((f, i) => {
    if (!fs.existsSync(f)) { warn.push(`media not found locally, not fingerprinted: ${f}`); return; }
    if (isCarousel && i === media.length - 1) return;   // the Follow CTA slide is reused on purpose
    const hit = findRepeat(fingerprint(f), platform, db);
    if (hit) block.push(`REPEAT on ${platform}: ${path.basename(f)} matches ${hit.file} (posted ${hit.date}${hit.post ? ', post ' + hit.post : ''}).`);
  });
  const vid = media.find((f) => VIDEO.test(f) && fs.existsSync(f));
  if (vid) {
    const vol = meanVolume(vid);
    if (platform === 'instagram' && settings.audio && vol > -50)
      block.push(`Double audio: the clip already has sound (${vol} dB) and an IG track is set. Remove "audio" or use a silent file.`);
    if (vol <= -40 && !settings.audio) {
      const msg = `Clip is silent/near-silent (${vol} dB) with no track — Alex deleted the quiet quiz reel from TikTok ("horrible… not fit for tiktok at all", 09-23).`;
      if (['tiktok', 'instagram', 'youtube'].includes(platform)) block.push(msg); else warn.push(msg);
    }
  }
  if (unmapped) warn.push(`${unmapped} media URL(s) not uploaded through social/pz — not fingerprinted, repeat check skipped for them.`);
  return { block, warn };
}

export function record({ platform, post = '', media = [] }) {
  const db = load(); const date = new Date().toISOString().slice(0, 16);
  const isCarousel = media.length >= 3 && !media.some((f) => VIDEO.test(f));
  media.forEach((f, i) => {
    if (!fs.existsSync(f) || (isCarousel && i === media.length - 1)) return;
    db.push({ platform, post, date, file: f, fp: fingerprint(f) });
  });
  save(db);
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (n) => { const i = rest.indexOf('--' + n); if (i < 0) return null; const v = rest[i + 1]; rest.splice(i, 2); return v; };
  const platform = opt('platform'), capFile = opt('caption'), post = opt('post') || '', set = opt('settings');
  const media = rest.map((f) => path.resolve(f));
  if (cmd === 'check') {
    const r = check({ platform, caption: capFile ? fs.readFileSync(capFile, 'utf8') : '', settings: set ? JSON.parse(set) : {}, media });
    r.warn.forEach((w) => console.log('⚠️  ' + w));
    r.block.forEach((b) => console.log('⛔ ' + b));
    console.log(r.block.length ? 'BLOCKED' : 'PASS'); process.exit(r.block.length ? 2 : 0);
  } else if (cmd === 'record') {
    record({ platform, post, media }); console.log(`recorded ${media.length} file(s) for ${platform}`);
  } else if (cmd === 'seen') {
    const db = load();
    for (const f of media) { const fp = fingerprint(f); const hits = Object.values(PLATFORMS).map((p) => [p, findRepeat(fp, p, db)]).filter(([, h]) => h);
      console.log(path.basename(f), hits.length ? hits.map(([p, h]) => `${p} (${h.date})`).join(', ') : 'never posted'); }
  } else { console.error('usage: gate.mjs check|record|seen …'); process.exit(1); }
}
