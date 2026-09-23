// Re-caption a source clip in the Shithousery HQ voice.
//
//   node social/recaption.mjs --in clip.mp4 --text "setup line" [--beat "punchline"] \
//        [--beat-at 0.6] [--ss 0.4] [--to 11.2] [--zoom 1.08] --out out.mp4
//
// The genre's layout is a white band carrying the caption with the footage
// inset below it. Source clips arrive with SOMEONE ELSE'S caption burned into
// that band, so we detect the footage band, crop to it, and rebuild the canvas
// with our own words.
//
// ⚠️ 2026-09: a caption over an UNTOUCHED clip no longer counts as an edit —
// TikTok's For You standards ("no meaningful or creative edits"), Meta's
// originality rules (borders/captions/speed don't count) and YouTube's reused-
// content policy all say so. So every reel now carries visible edits of OUR own:
//   · a slow push-in on the footage (--zoom, default 1.08, 1 = off)
//   · an optional SECOND BEAT: the caption swaps to a punchline part-way through
//   · --ss/--to to trim dead frames (completion is the one signal TikTok weights)
// No end card: it is dead air, and dead air is what gets swiped.
//
// ⚠️ 2026-09-21, YouTube Studio on our one seeded Short: 97.5% Shorts-feed traffic,
// 46.7% stayed / 53.3% SWIPED. The first frame was a mostly-white screen with small
// text and a small inset video — it read as nothing. v3 opening frame:
//   · the dead space is the footage itself, blurred and dimmed — never blank white
//   · footage runs the FULL 1080 width (--no-bleed insets it to 880 for clips with
//     burned-in subtitles, which the phone's side-crop would slice)
//   · caption type is ~25% bigger; the words still sit inside the safe zone
//
// ⚠️ SAME DAY, Alex overruled the v3 look after seeing it: "the writing is too big…
// it is fully fine to have the video centered and have white space below and above
// it, with the text on the white space above it. no need for the font to be that
// big either." That IS the genre look (midnitefootball, simptv, rivalsbanter). So:
// WHITE canvas is the default again (--backdrop blur keeps the experiment), the
// VIDEO is centred and the caption sits directly above it, type is tweet-sized.
// Kept from v3: full-width footage, push-in, second beat, tall-clip fitting.
//
// Caption text is rendered in a headless browser rather than with ffmpeg's
// drawtext: real line-breaking, real kerning, no manual \n escaping.

import { chromium } from '../node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FFMPEG  = process.env.FFMPEG  || '/opt/homebrew/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE || '/opt/homebrew/bin/ffprobe';
const W = 1080, H = 1920, FPS = 30;

const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const IN = arg('in'), TEXT = arg('text'), OUT = arg('out'), BEAT = arg('beat');
if (!IN || !TEXT || !OUT) {
  console.error('usage: recaption.mjs --in <mp4> --text "<caption>" [--beat "<punchline>"] --out <mp4>');
  process.exit(1);
}
// "Never post anything twice" (Alex 09-23): refuse footage we've already built a reel from.
// Sources are fingerprinted in social/state/hashes.json (platform "source"); --allow-reuse overrides.
const gate = await import('./gate.mjs');
const srcHit = (() => { try { return gate.seenAs(path.resolve(IN), 'source'); } catch { return null; } })();
if (srcHit && !process.argv.includes('--allow-reuse')) {
  console.error(`⛔ ${path.basename(IN)} is footage we already used (${srcHit.file}, ${srcHit.date}). Pick another clip, or pass --allow-reuse if this is a deliberate re-cut.`);
  process.exit(2);
}
const ZOOM = Number(arg('zoom') || 1.08);
const BLEED = !process.argv.includes('--no-bleed');
const BLUR = arg('backdrop') === 'blur';
// --style tweet: regular-weight, tweet-like type for list/stat jokes ("X = 3 / Y = 2"),
// the register midnitefootball / simptv use. Captions may contain real newlines.
const TWEET = arg('style') === 'tweet';
// --loop N: play a very short reaction clip N extra times so the words can be read
const LOOP = Number(arg('loop') || 0);
// --yt: YouTube has no Shorts end-screens and no "follow" word, so a persistent
// watermark on the caption plate (already on screen the whole clip, already
// inside the proven-safe zone between YouTube's top/bottom chrome) is the only
// always-on subscribe prompt. IG/TikTok/Threads keep the plain brand mark —
// those platforms "follow", and "subscribe" there would read as noise.
const YT = process.argv.includes('--yt');

// ---- 0. trim ---------------------------------------------------------------
const srcDur = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration',
  '-of', 'csv=p=0', IN]).toString().trim());
const SS = Number(arg('ss') || 0), TO = Number(arg('to') || srcDur);
const dur = Math.max(0.5, TO - SS) * (LOOP + 1);
const BEAT_AT = BEAT ? dur * Number(arg('beat-at') || 0.6) : null;

// ---- 1. find the footage band -------------------------------------------
// Sources are NOT always 1080x1920 — tweet videos arrive at 720x642, 576x1024 etc.
// Everything below works in SOURCE pixels and scales once at composite time.
const probeAt = Number(arg('at') || SS + Math.min(2, dur / 2));
const [IW, IH] = execFileSync(FFPROBE, ['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0:s=x', IN]).toString().trim().split('x').map(Number);
// Sample 8 columns per row. A row is PADDING only if it is uniformly pure white
// or pure black across its whole width. (A single averaged column called a pale
// wall "white" and a window divider "black", and cropped a 4-way video call down
// to its bottom half — deleting Chelsea and United, i.e. the entire joke.)
const COLS = 8;
const raw = execFileSync(FFMPEG, ['-v', 'error', '-ss', String(probeAt), '-i', IN, '-frames:v', '1',
  '-vf', `format=gray,scale=${COLS}:${IH}`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 26 });
const rowIsPad = y => { let w = true, k = true;
  for (let c = 0; c < COLS; c++) { const v = raw[y * COLS + c]; if (v < 236) w = false; if (v > 15) k = false; }
  return w || k; };

// Content runs. A burned-in caption is several SHORT runs (one per text line);
// footage is one or more LONG runs (a split-screen has an internal divider).
// Band = from the first long run to the last long run. Short runs are text: drop.
const runs = []; let cur = -1;
for (let y = 0; y <= IH; y++) {
  const content = y < IH && !rowIsPad(y);
  if (content && cur < 0) cur = y;
  if (!content && cur >= 0) { runs.push([cur, y]); cur = -1; }
}
const long = runs.filter(([a2, b2]) => b2 - a2 >= IH * 0.12);
let bandY = 0, bandH = IH;
if (long.length) { bandY = long[0][0]; bandH = long[long.length - 1][1] - bandY; }
else console.log('  no footage band found; using full frame');
bandH -= bandH % 2; // h264 needs even dimensions
console.log(`  footage band: y=${bandY} h=${bandH}`);

// SAFE ZONE. Phones are ~19.5:9, taller than our 9:16 frame, so TikTok / Shorts /
// Reels scale the video to fill the HEIGHT and crop the sides: visible width =
// 16/19.5 = 82%, i.e. ~97px lost per side at 1080. With 52px padding the caption
// and the brand mark were sliced off at the left edge on two live posts.
// Keep all TEXT inside the middle ~76%; footage may bleed, words may not.
const SAFE_X = 130;

// ---- 2. render the caption plate(s) ---------------------------------------
// Both beats share ONE plate height (the taller of the two) so the footage does
// not jump when the caption swaps.
const longest = [TEXT, BEAT].filter(Boolean).sort((a, b) => b.length - a.length)[0];
const fontPx = TWEET ? 46 : (longest.length > 95 ? 44 : longest.length > 60 ? 48 : 52);
const plateHtml = (txt, h) => `<!DOCTYPE html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${h}px;background:#fff}
  #w{width:100%;height:100%;display:flex;flex-direction:column;
     justify-content:flex-end;align-items:flex-start;padding:0 ${SAFE_X}px 34px}
  #t{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-weight:400;white-space:pre-line;
     font-size:${fontPx}px;line-height:1.16;letter-spacing:-.015em;color:#0a0a0a;max-width:100%;text-wrap:${TWEET ? "wrap" : "balance"}}
  #m{margin-top:22px;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
     font-size:21px;font-weight:800;letter-spacing:.34em;color:#b4bcc6;text-transform:uppercase}
</style><div id="w"><div id="t"></div><div id="m">${YT ? 'Shithousery HQ · Subscribe' : 'Shithousery HQ'}</div></div>
<script>document.getElementById('t').textContent=${JSON.stringify(txt)}</script>`;

const tmp = fs.mkdtempSync('/tmp/recap-');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: 600 }, deviceScaleFactor: 1 });
const measure = async txt => { await page.setContent(plateHtml(txt, 600));
  return page.evaluate(() => document.getElementById('t').offsetHeight + document.getElementById('m').offsetHeight + 22); };
let textH = await measure(TEXT);
if (BEAT) textH = Math.max(textH, await measure(BEAT));
const plateH = Math.ceil((textH + 34 + 40) / 2) * 2;          // text + bottom pad + top breathing room
await page.setViewportSize({ width: W, height: plateH });
const plates = [];
for (const [i, txt] of [TEXT, BEAT].filter(Boolean).entries()) {
  await page.setContent(plateHtml(txt, plateH));
  const p = path.join(tmp, `plate${i}.png`); await page.screenshot({ path: p }); plates.push(p);
}
await browser.close();

// ---- 3. composite --------------------------------------------------------
// white canvas -> footage under the plate -> plate on top.
//
// ⚠️ Centre the plate+footage BLOCK vertically. Pinning the plate to y=0 leaves
// whatever is left over as dead space at the bottom — on a 646px band that was
// 773px of empty white below the video, which is exactly what it looks like:
// a broken crop. Caught on a live TikTok, not in review.
// Footage is inset to the width a tall phone actually shows (82% ≈ 886px), so
// subtitles burned into the SOURCE clip survive the side-crop as well. The first
// safe-zone pass protected our caption and still sliced "SPURS…GOAL" to "PURS…GOA".
let FG_W = BLEED ? W : 880;
let fgH = Math.round(bandH * FG_W / IW / 2) * 2;
// tall (9:16) sources: plate + full-width footage would overflow the canvas — fit to height
// the apps draw their own UI over the top ~220px (tabs/search) and bottom ~320px
// (username, caption, music) — tall clips are fitted BETWEEN those, never under them
const UI_TOP = 220, UI_BOTTOM = 320;
const MAXH = Math.floor((H - plateH - UI_TOP - UI_BOTTOM) / 2) * 2;
if (fgH > MAXH) { fgH = MAXH; FG_W = Math.round(fgH * IW / bandH / 2) * 2; }
const FG_X = Math.round((W - FG_W) / 2);
// centre the VIDEO; the caption sits on the white directly above it
let videoY = Math.round((H - fgH) / 2);
if (videoY - plateH < UI_TOP) videoY = plateH + UI_TOP;          // keep the words clear of the top UI
const offY = Math.max(0, videoY - plateH);

// Push-in: zoompan works on integer pixels, so zoom a 2x upscale and let it
// downsample — at native size a slow zoom visibly shivers.
const N = Math.round(dur * FPS);
const push = ZOOM > 1
  ? `,fps=${FPS},scale=${FG_W * 2}:${fgH * 2},zoompan=z='1+${(ZOOM - 1).toFixed(4)}*on/${N}':d=1:` +
    `x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${FG_W}x${fgH}:fps=${FPS}`
  : `,fps=${FPS}`;

const inputs = ['-f', 'lavfi', '-i', `color=c=${BLUR ? 'black' : 'white'}:s=${W}x${H}:d=${dur}:r=${FPS}`,
  ...(LOOP ? ['-stream_loop', String(LOOP)] : []), '-ss', String(SS), ...(LOOP ? [] : ['-t', String(dur)]), '-i', IN, '-i', plates[0]];
// backdrop = the same footage, scaled to cover the canvas, blurred and dimmed
let chain = `[1:v]crop=${IW}:${bandH}:0:${bandY},split=2[c1][c2];` +
  `[c2]fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},` +
  `boxblur=28:4,eq=brightness=-0.22:saturation=0.8[blur];` +
  `[c1]scale=${FG_W}:${fgH}${push}[fg];` +
  `[0:v][blur]overlay=0:0:enable='${BLUR ? 1 : 0}'[b0];[b0][fg]overlay=${FG_X}:${videoY}[bg];[bg][2:v]overlay=0:${offY}[v1]`;
let last = 'v1';
if (BEAT) { inputs.push('-i', plates[1]);
  chain += `;[v1][3:v]overlay=0:${offY}:enable='gte(t,${BEAT_AT.toFixed(2)})'[v2]`; last = 'v2'; }

execFileSync(FFMPEG, ['-y', ...inputs, '-filter_complex', chain,
  '-map', `[${last}]`, '-map', '1:a?', '-t', String(dur),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-profile:v', 'high', '-level', '4.1', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '128k', OUT],
  { stdio: ['ignore', 'ignore', 'ignore'] });

fs.rmSync(tmp, { recursive: true, force: true });
const mb = (fs.statSync(OUT).size / 1e6).toFixed(1);
if (!srcHit) gate.record({ platform: 'source', post: 'recaption:' + path.basename(OUT), media: [path.resolve(IN)] });
console.log(`✅ ${OUT}  (${mb} MB, ${dur.toFixed(1)}s, zoom ${ZOOM}${BEAT ? `, beat at ${BEAT_AT.toFixed(1)}s` : ''})`);
