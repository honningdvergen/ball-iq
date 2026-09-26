// Carousel → Facebook/YouTube reel (Alex 09-26: a 2-card maths reel did well on FB; "make 10 second
// plus reels out of the carousels … switch slides with a softer sound"). One topic per reel.
//
//   node social/carouselreel.mjs --out reel.mp4 [--per 2.4] [--first 3] [--track sneaky] [--title "…"] a.png b.png …
//
// Each 1080x1350 slide sits full width, centred on a white 1080x1920 canvas (optional --title above it),
// hard cut between slides with the soft 'swipe' sfx, gentle push-in, music bed under it.
// FB only pays on reels >10s, so aim for 5–8 slides (≈12–20s).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mixQuizAudio } from './quizaudio.mjs';

const argv = process.argv.slice(2), opt = {}, slides = [];
for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (opt[argv[i].slice(2)] = argv[++i]) : slides.push(argv[i]);
const W = Number(opt.w || 840);  // ALL full-screen players (FB too) crop 9:16 to the phone (19.5:9 shows ~886 of 1080px) — Alex 09-26 saw every slide cut; 840 + 2.5% push-in stays inside
const OUT = opt.out, PER = Number(opt.per || 2.4), FIRST = Number(opt.first || 3), TRACK = opt.track || 'sneaky';
if (!OUT || slides.length < 2) { console.error('usage: carouselreel.mjs --out x.mp4 [--per s] [--first s] [--title "…"] a.png b.png …'); process.exit(1); }
const FF = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg', FPS = 30;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'carreel-'));

const durs = slides.map((_, i) => i === 0 ? FIRST : PER);
const total = durs.reduce((a, b) => a + b, 0);
const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "’").replace(/:/g, '\\:');
const titleF = opt.title ? `,drawtext=fontfile=/System/Library/Fonts/Supplemental/Arial Black.ttf:text='${esc(opt.title)}':fontsize=54:fontcolor=black:x=(w-tw)/2:y=150` : '';

const parts = slides.map((png, i) => {
  const out = path.join(tmp, `s${i}.mp4`), n = Math.round(durs[i] * FPS);
  execFileSync(FF, ['-v', 'error', '-y', '-loop', '1', '-framerate', String(FPS), '-t', String(durs[i]), '-i', png, '-vf',
    `scale=${W}:-2,pad=1080:1920:(1080-iw)/2:(1920-ih)/2+${opt.title ? 60 : 0}:white${titleF},scale=2160:3840,` +
    `zoompan=z='1+0.025*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(FPS), out]);
  return out;
});
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
const silent = path.join(tmp, 'silent.mp4');
execFileSync(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);

let t = 0; const events = [];
for (let i = 0; i < durs.length - 1; i++) { t += durs[i]; events.push({ t: t - 0.1, type: 'swipe' }); }
const credit = mixQuizAudio({ video: silent, out: OUT, total, events, track: TRACK, musicVol: 0.3 });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✅ ${OUT} (${slides.length} slides, ${total.toFixed(1)}s)`);
console.log(credit);
