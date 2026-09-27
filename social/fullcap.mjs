// Full-frame reel/Short: the clip fills the whole 9:16 screen from frame 1, ONE caption line on top,
// our round logo as a small watermark. This is the layout every growing football Shorts channel uses
// (channel study 09-25: judeslander 118K median, streamer-clip channels 18K) — nobody uses our old
// white caption band, where the clip filled ~40% of the screen.
//
//   node social/fullcap.mjs --in clip.mp4 --text "caption" --out out.mp4 [--ss 0] [--to 12] [--fit cover|width] [--zoom 1.05] [--top 1180] [--score "Norway 1 2 Portugal"]
//
// --fit cover (default): crop the clip to fill 1080x1920 (talking heads, fan clips).
// --fit width: landscape match footage at full width over a blurred copy of itself (keeps the whole pitch).
import { chromium } from '../node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 1080, H = 1920, FPS = 30;
const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const IN = arg('in'), TEXT = arg('text'), OUT = arg('out');
if (!IN || !TEXT || !OUT) { console.error('usage: fullcap.mjs --in clip.mp4 --text "…" --out out.mp4 [--ss s] [--to s] [--fit cover|width]'); process.exit(1); }
const FIT = arg('fit') || 'cover', ZOOM = Number(arg('zoom') || 1.05);
const srcDur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', IN]).toString().trim());
const SS = Number(arg('ss') || 0), TO = Number(arg('to') || srcDur), dur = TO - SS;

// caption: white bold text with a heavy black outline, lower third (above the app UI at the bottom)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const logo = `data:image/jpeg;base64,${fs.readFileSync(path.join(HERE, 'assets/shq_logo.jpg')).toString('base64')}`;
const html = `<!doctype html><meta charset=utf-8><style>*{margin:0}html,body{width:${W}px;height:${H}px;background:transparent}
.s{position:absolute;left:120px;right:120px;top:${arg("scoretop")||230}px;text-align:center;font:900 92px/1.05 -apple-system,"SF Pro Display",Helvetica,Arial;color:#fff;-webkit-text-stroke:5px #000;paint-order:stroke fill;text-transform:uppercase}
.c{position:absolute;left:120px;right:120px;top:${arg("top")||1180}px;text-align:center;font:800 58px/1.18 -apple-system,"SF Pro Display",Helvetica,Arial;color:#fff;
-webkit-text-stroke:3px #000;paint-order:stroke fill;text-shadow:0 4px 14px rgba(0,0,0,.6)}
.l{position:absolute;right:40px;top:250px;width:96px;height:96px;border-radius:50%;opacity:.85;box-shadow:0 2px 10px rgba(0,0,0,.4)}</style>
${arg("score")?`<div class=s>${esc(arg("score"))}</div>`:""}<div class=c>${esc(TEXT)}</div>${process.argv.includes("--nologo")?"":`<img class=l src="${logo}">`}`;
const tmp = fs.mkdtempSync('/tmp/fullcap-'); const plate = path.join(tmp, 'plate.png');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
await p.setContent(html); await p.screenshot({ path: plate, omitBackground: true }); await b.close();

// Trim the SOURCE's own letterbox and burned-in caption band (same row analysis as recaption.mjs):
// rows that are uniformly pure white/black are padding; short content runs are text; the band is
// from the first to the last LONG run. Then the footage alone fills our frame.
let cropF = '';
if (arg('crop')) cropF = `crop=${arg('crop')},`;
else {
  const [IW, IH] = execFileSync('ffprobe', ['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0:s=x', IN]).toString().trim().split('x').map(Number);
  const COLS = 8, at = SS + Math.min(2, dur / 2);
  const raw = execFileSync('ffmpeg', ['-v','error','-ss',String(at),'-i',IN,'-frames:v','1','-vf',`format=gray,scale=${COLS}:${IH}`,'-f','rawvideo','-'], { maxBuffer: 1 << 26 });
  const pad = y => { let w = true, k = true; for (let c = 0; c < COLS; c++) { const v = raw[y*COLS+c]; if (v < 236) w = false; if (v > 15) k = false; } return w || k; };
  const runs = []; let cur = -1;
  for (let y = 0; y <= IH; y++) { const on = y < IH && !pad(y); if (on && cur < 0) cur = y; if (!on && cur >= 0) { runs.push([cur, y]); cur = -1; } }
  const long = runs.filter(([a, b]) => b - a >= IH * 0.12);
  if (long.length) { const y0 = long[0][0]; let h = long[long.length-1][1] - y0; h -= h % 2; if (h < IH - 4) cropF = `crop=${IW}:${h}:0:${y0},`; }
}
const N = Math.round(dur * FPS);
const push = `scale=${W * 2}:${H * 2},zoompan=z='1+${(ZOOM - 1).toFixed(4)}*on/${N}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`;
const chain = FIT === 'width'
  ? `[0:v]${cropF}fps=${FPS},split=2[a][b];[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:4,eq=brightness=-0.25[bg];` +
    `[b]scale=${W}:-2[fg];[bg][fg]overlay=0:(H-h)/2,${push}[v];[v][1:v]overlay=0:0[o]`
  : `[0:v]${cropF}fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},${push}[v];[v][1:v]overlay=0:0[o]`;
execFileSync('ffmpeg', ['-y', '-ss', String(SS), '-t', String(dur), '-i', IN, '-i', plate, '-filter_complex', chain,
  '-map', '[o]', '-map', '0:a?', '-t', String(dur), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  '-r', String(FPS), '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', OUT], { stdio: ['ignore', 'ignore', 'ignore'] });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✅ ${OUT} crop:${cropF||'none'}`); console.log(`✅ ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB, ${dur.toFixed(1)}s, fit ${FIT})`);
