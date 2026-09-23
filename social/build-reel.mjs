// Build one Shithousery HQ quiz reel.
//   node social/build-reel.mjs <theme> [outputName]
//
// Facts come from src/questions.js BY ID. Nothing is retyped: `a` is read as an
// INDEX into `o` (the off-by-one there produces a fluent, confident, WRONG post),
// flagged entries are refused outright, and the reveal line is the bank's own
// hint. The zero-fabrication bar is enforced in code, not by care.

import { chromium } from '../node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES, eraLabel } from './themes.mjs';
import { mixQuizAudio, questionEvents } from './quizaudio.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEDGER = path.join(HERE, 'used-questions.json');
const FPS = Number(process.env.FPS || 30);
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';

const themeKey = process.argv[2];
const outName = process.argv[3] || `shq-${themeKey}-${Date.now()}`;
// --yt: render the YouTube-only variant (persistent "SUBSCRIBE" watermark).
// IG/TikTok/Threads/Facebook get the plain brand mark — "subscribe" is YouTube's
// word, those platforms "follow", and a subscribe prompt there reads as noise.
const YT = process.argv.includes('--yt');
const theme = THEMES[themeKey];
if (!theme) {
  console.error(`unknown theme "${themeKey}". available: ${Object.keys(THEMES).join(', ')}`);
  process.exit(1);
}

const { QB } = await import('../src/questions.js');
const used = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : {};

// base pool: usable, trustworthy, not already shipped
const pool = QB.filter(q =>
  q.type === 'mcq' && !q.flag && q.hint && Array.isArray(q.o) && q.o.length === 4 && !used[q.id]);

let cands = theme.pick(pool);
if (!cands.length) { console.error(`theme "${themeKey}" matched no unused questions`); process.exit(1); }

// escalate easy -> medium -> hard when the theme hasn't already ordered them
let chosen;
if (cands.length <= 3) {
  chosen = cands.slice(0, 3);
} else {
  chosen = [];
  for (const d of ['easy', 'medium', 'hard']) {
    const hit = cands.find(q => q.diff === d && !chosen.includes(q));
    if (hit) chosen.push(hit);
  }
  while (chosen.length < 3) {
    const hit = cands.find(q => !chosen.includes(q));
    if (!hit) break;
    chosen.push(hit);
  }
}
if (chosen.length < 2) { console.error('not enough questions for a reel'); process.exit(1); }

const questions = chosen.map(e => {
  if (e.flag) throw new Error('refusing flagged question ' + e.id);
  const answer = e.o[e.a];                       // INDEX, not the answer
  if (typeof e.a !== 'number' || answer == null) throw new Error('bad answer index ' + e.id);
  console.log(`  [${e.id}] ${e.diff.padEnd(6)} answer=${JSON.stringify(answer)} (a=${e.a})`);
  return { id: e.id, era: eraLabel(e), q: e.q, o: e.o, a: e.a, fact: e.hint.split(/(?<=\.)\s/)[0] };
});

// ---- render ----
const FRAMES = path.join(HERE, '.frames');
fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.addInitScript(d => { window.DATA = d; },
  { questions, theme: { ...theme, pick: undefined, dotCount: questions.length }, yt: YT });
await page.goto('file://' + path.join(HERE, 'reel.html'));
await page.waitForFunction(() => typeof window.renderAt === 'function');
await page.evaluate(() => window.applyTheme());

const total = await page.evaluate(() => window.TOTAL);
const nFrames = Math.round(total * FPS);
console.log(`\n${theme.name} — ${total.toFixed(1)}s, ${nFrames} frames`);
for (let i = 0; i < nFrames; i++) {
  await page.evaluate(t => window.renderAt(t), i / FPS);
  await page.screenshot({ path: path.join(FRAMES, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
}
await browser.close();

// ---- encode ----
const out = path.join(HERE, 'out', outName + '.mp4');
fs.mkdirSync(path.dirname(out), { recursive: true });
const silent = path.join(FRAMES, 'silent.mp4');
execFileSync(FFMPEG, ['-y', '-framerate', String(FPS), '-i', path.join(FRAMES, '%05d.jpg'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p',
  '-profile:v', 'high', '-level', '4.1', '-movflags', '+faststart', silent], { stdio: ['ignore', 'ignore', 'ignore'] });
// Sound (09-23): the silent version got deleted off TikTok. Timings mirror reel.html:
// hook 2.6s, 12s per question, countdown from ~1.6s to the 8.6s reveal.
const HOOK_T = 2.6, Q_T = 12, events = [];
questions.forEach((_, i) => { const s = HOOK_T + i * Q_T; events.push(...questionEvents(s, s + 1.6, s + 8.6, s + 8.6)); });
const track = process.env.TRACK || 'monkeys';
const credit = mixQuizAudio({ video: silent, out, total, events, track });
fs.writeFileSync(out.replace(/\.mp4$/, '.credit.txt'), credit + '\n');

// only mark questions used once the file actually exists
if (!fs.existsSync(out)) { console.error('encode failed'); process.exit(1); }
questions.forEach(q => { used[q.id] = { theme: themeKey, at: new Date().toISOString() }; });
fs.writeFileSync(LEDGER, JSON.stringify(used, null, 2));

console.log(`\n✅ ${out}  (${(fs.statSync(out).size / 1e6).toFixed(1)} MB, ${total.toFixed(1)}s)`);
console.log(`   ledger: ${Object.keys(used).length} questions now used`);
