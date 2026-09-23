// Single-question football quiz Short (9:16, 12s) — the format that goes viral (09-23 research:
// Front Three 20.6M, Evan Ross 17.7M — ONE puzzle, fully on screen from frame 0, answer at the end,
// hard cut back to the start so people rewatch). Multi-question Shorts >45s stall at tens of thousands.
//
//   node social/quizshort.mjs --from out/long-arsenal-01.json        → 4 Shorts: hardest Q of each round
//   node social/quizshort.mjs --theme arsenal --id q_130dae [--out name]
//
// Beats: 0–9s timer drains with ticks (last 3 hot) · 9.0 reveal green/red + chime · 9.8 banter line ·
// 12.0 end (YouTube loops to frame 0). Same zero-fabrication rules as the long-form: read BY ID, `a` is an
// INDEX, flagged refused. Banter lines carry NO facts — they are jokes at the viewer, never claims.

import { chromium } from '../node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from './quizthemes.mjs';
import { mixQuizAudio } from './quizaudio.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const FPS = 30, THINK = 9, TOTAL = 12;
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };

const BANTER = ['Got it wrong? Unfollow yourself.', 'Plastic detected.', 'Your dad got that one.', 'Tell your mate it was easy.',
  'Comment your letter. No editing.', 'Screenshot or it didn\'t happen.', 'Be honest in the comments.', 'Googlers will be named.'];
const TRACKS = ['monkeys', 'investigations', 'weasel', 'polka', 'duck', 'builder'];

const { QB } = await import('../src/questions.js');
const byId = new Map(QB.map((q) => [q.id, q]));

let jobs = [];
const from = arg('from');
if (from) {
  const meta = JSON.parse(fs.readFileSync(path.resolve(from), 'utf8'));
  const ids = meta.questions.map((q) => q.id), per = Math.ceil(ids.length / 4);
  for (let r = 0; r < 4; r++) { const id = ids[Math.min(ids.length - 1, (r + 1) * per - 1)]; jobs.push({ theme: meta.theme, id, long: path.basename(from, '.json'), r }); }
} else {
  jobs = [{ theme: arg('theme'), id: arg('id'), long: arg('long', null), r: 0, out: arg('out') }];
}

const browser = await chromium.launch();
for (const [k, job] of jobs.entries()) {
  const T = THEMES[job.theme]; if (!T) throw new Error('unknown theme ' + job.theme);
  const e = byId.get(job.id); if (!e) throw new Error('no question ' + job.id);
  if (e.flag) throw new Error('refusing flagged question ' + e.id);
  if (typeof e.a !== 'number' || e.o?.[e.a] == null) throw new Error('bad answer index ' + e.id);
  const seed = [...e.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const tags = [`Only real ${T.fans} get this`, `${T.fans}: no Googling`, `Name it before the timer runs out`];
  const d = {
    palette: T.palette, tag: tags[seed % tags.length], q: e.q, o: e.o, a: e.a, think: THINK,
    banter: BANTER[seed % BANTER.length], grid: e.o.every((x) => String(x).length <= 13),
  };
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(HERE, 'quizshort.html'));
  await page.waitForFunction(() => window.ready);
  await page.evaluate((x) => window.setup(x), d);
  const FR = path.join(HERE, '.frames-short'); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
  const n = Math.round(TOTAL * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.at(t), i / FPS);
    await page.screenshot({ path: path.join(FR, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90 });
  }
  await page.close();
  const name = job.out || `short-${job.theme}-${e.id}`;
  const outDir = path.join(HERE, 'out'); fs.mkdirSync(outDir, { recursive: true });
  const silent = path.join(FR, 'silent.mp4'), out = path.join(outDir, name + '.mp4');
  execFileSync(FFMPEG, ['-y', '-framerate', String(FPS), '-i', path.join(FR, '%04d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '19',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], { stdio: 'ignore' });
  const events = [];
  for (let s = 0; s < THINK; s++) events.push({ t: s + 0.02, type: THINK - s <= 3 ? 'tickHot' : 'tick' });
  events.push({ t: THINK, type: 'chime' });
  const track = TRACKS[seed % TRACKS.length];
  const credit = mixQuizAudio({ video: silent, out, total: TOTAL, events, track, musicVol: 0.3, skip: 4 + (seed % 20) });
  const club = T.name === 'Manchester United' ? 'united' : T.name.toLowerCase().replace(/\s+/g, '');
  const meta = {
    title: `Only real ${T.fans} get this 🧠 #${club} #football #quiz`,
    description: [e.q, 'Comment A/B/C/D BEFORE the reveal 👇', '', job.long ? `The full ${T.name} quiz is on our channel — can you beat it?` : '', '', credit].filter((x, i, a) => x || a[i - 1]).join('\n'),
    pinned: 'Answer with one letter. Wrong ones get named and shamed 👇',
    related: job.long, id: e.id, answer: e.o[e.a], track,
  };
  fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(meta, null, 2));
  console.log(`✅ ${out}  [${e.id}] ${e.diff} answer=${JSON.stringify(e.o[e.a])}  · ${track}`);
}
await browser.close();
