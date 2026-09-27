// Daily PREDICTION Short (YouTube plan 09-25/27: one repeated template before the biggest fixture).
//   node social/prediction.mjs --top a.jpg --bottom b.jpg --home NORWAY --away PORTUGAL --line "Haaland or Ronaldo tonight?" --credit "📷 Bryan Berlin / CC BY-SA 4.0" --out x.mp4 [--track investigations]
// Two full-bleed photos, big PREDICTION header, "HOME ? – ? AWAY" band, one question. All text inside the
// 840px phone-safe column (every full-screen player crops 9:16 to ~886 of 1080px).
import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { mixQuizAudio } from './quizaudio.mjs';
const a = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const [TOP, BOT, HOME, AWAY, LINE, OUT] = ['top', 'bottom', 'home', 'away', 'line', 'out'].map(a);
const CREDIT = a('credit') || '', TRACK = a('track') || 'investigations';
if (!TOP || !BOT || !HOME || !AWAY || !OUT) { console.error('usage: prediction.mjs --top --bottom --home --away --line --out'); process.exit(1); }
const u = f => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
const HERE = path.dirname(new URL(import.meta.url).pathname), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pred-'));
const band = `${HOME} ? – ? ${AWAY}`, bandSize = Math.min(74, Math.floor(1500 / band.length));
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.setContent(`<style>*{margin:0}body{width:1080px;height:1920px;background:#000;font-family:-apple-system,'SF Pro Display',Helvetica;position:relative;overflow:hidden}
.i{position:absolute;left:0;width:1080px;height:860px;object-fit:cover;object-position:center 25%}
.t{position:absolute;left:120px;right:120px;text-align:center;color:#fff;font-weight:900;-webkit-text-stroke:4px #000;paint-order:stroke fill}
.cr{position:absolute;right:130px;font-size:20px;color:rgba(255,255,255,.75);text-shadow:0 1px 3px #000}</style>
<img class=i style=top:100px src='${u(TOP)}'><img class=i style=top:960px src='${u(BOT)}'>
<div class=t style='top:150px;font-size:110px'>PREDICTION</div>
<div class=t style='top:905px;font-size:${bandSize}px;white-space:nowrap'>${band}</div>
<div class=t style='top:1640px;font-size:56px'>${LINE || ''}</div>
<img src='${u(path.join(HERE, 'assets/shq_logo.jpg'))}' style='position:absolute;right:130px;top:300px;width:90px;border-radius:50%'>
${CREDIT ? `<div class=cr style=top:890px>${CREDIT}</div><div class=cr style=bottom:110px>${CREDIT}</div>` : ''}`);
await p.screenshot({ path: path.join(tmp, 'card.png') }); await b.close();
execFileSync('ffmpeg', ['-v', 'error', '-y', '-loop', '1', '-framerate', '30', '-t', '8', '-i', path.join(tmp, 'card.png'), '-vf',
  "scale=2160:3840,zoompan=z='1+0.03*on/240':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,format=yuv420p", '-c:v', 'libx264', '-crf', '18', path.join(tmp, 's.mp4')]);
console.log(mixQuizAudio({ video: path.join(tmp, 's.mp4'), out: OUT, total: 8, events: [], track: TRACK, musicVol: 0.35 }));
fs.copyFileSync(path.join(tmp, 'card.png'), OUT.replace(/\.mp4$/, '.png'));
console.log('✅', OUT);
