// Own maths/stat card → YouTube Short / TikTok video with a PUNCHLINE REVEAL (Alex 09-24:
// "we can not post some dull content"). The setup card shows first, the punchline line pops in
// at --at seconds (whoosh), gentle push-in the whole time, Kevin MacLeod bed under it.
//
//   node social/cardshort.mjs --setup A.png --full B.png --out short.mp4 [--at 3.2] [--dur 9] [--track sneaky]
//   node social/cardshort.mjs --full B.png --out short.mp4            (no reveal: one card)
//
// A.png / B.png come from owncard.mjs (1080x1350, card centred): A = the text WITHOUT the last
// paragraph, B = the full text. Both are cropped to their content and TOP-aligned on a white
// 1080x1920 canvas at 920px wide (TikTok/Shorts crop the sides on tall phones), so the setup
// lines never move when the punchline appears.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mixQuizAudio } from './quizaudio.mjs';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const FULL = arg('full'), SETUP = arg('setup'), OUT = arg('out');
const AT = Number(arg('at', 3.2)), DUR = Number(arg('dur', 9)), TRACK = arg('track', 'sneaky');
if (!FULL || !OUT) { console.error('usage: cardshort.mjs [--setup A.png] --full B.png --out x.mp4 [--at s] [--dur s] [--track key]'); process.exit(1); }
const FF = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const W = 920, FPS = 30;

// Rows (in a 1350-tall card) that contain any non-white pixel → [top, bottom].
function contentRows(png) {
  const raw = execFileSync(FF, ['-v', 'error', '-i', png, '-vf', 'format=gray,scale=64:1350:flags=area', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 24 });
  let top = -1, bot = -1;
  for (let y = 0; y < 1350; y++) {
    let dark = false;
    for (let x = 0; x < 64; x++) if (raw[y * 64 + x] < 235) { dark = true; break; }
    if (dark) { if (top < 0) top = y; bot = y; }
  }
  return [Math.max(0, top - 20), Math.min(1349, bot + 20)];
}

const [ft, fb] = contentRows(FULL);
const fullH = Math.round((fb - ft) * W / 1080);
const topY = Math.round((1920 - fullH) / 2);           // the FULL card is centred; the setup shares its top
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cardshort-'));
// Each card is cropped from its OWN content top (the avatar row), so both start at topY and the
// shared setup lines sit in the same place — owncard centres vertically, so the raw PNGs differ.
const layer = (png, name) => {
  const [t, b] = contentRows(png), out = path.join(tmp, name);
  execFileSync(FF, ['-v', 'error', '-y', '-i', png, '-vf',
    `crop=1080:${b - t}:0:${t},scale=${W}:-2,pad=1080:1920:${(1080 - W) / 2}:${topY}:white`, out]);
  return out;
};
const fullL = layer(FULL, 'full.png');
const setupL = SETUP ? layer(SETUP, 'setup.png') : null;

const silent = path.join(tmp, 'silent.mp4');
const zoom = `zoompan=z='1+0.03*on/${DUR * FPS}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=${FPS}`;
const inputs = setupL ? ['-framerate', String(FPS), '-loop', '1', '-t', String(DUR), '-i', setupL, '-framerate', String(FPS), '-loop', '1', '-t', String(DUR), '-i', fullL]
                      : ['-framerate', String(FPS), '-loop', '1', '-t', String(DUR), '-i', fullL];
const graph = setupL
  ? `[0:v][1:v]overlay=enable='gte(t,${AT})',scale=2160:3840,${zoom},format=yuv420p[v]`
  : `[0:v]scale=2160:3840,${zoom},format=yuv420p[v]`;
execFileSync(FF, ['-v', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[v]', '-t', String(DUR),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS), silent]);

const credit = mixQuizAudio({ video: silent, out: OUT, total: DUR, events: setupL ? [{ t: AT - 0.15, type: 'whoosh' }] : [], track: TRACK, musicVol: 0.35 });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✅ ${OUT}  (${DUR}s${setupL ? `, reveal at ${AT}s` : ''})`);
console.log(credit);
