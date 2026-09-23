// "Guess the XI" reel (9:16, ~22s) — built for Facebook's audience (UK, 35+, 90s/00s nostalgia) and for
// what Facebook's ranking rewards (09-23 research): ORIGINAL content (our own graphic, not a caption on a
// viral clip), watched to the END (names reveal one by one after the countdown), no tag/comment-bait text.
//
//   node social/xireel.mjs --id 2005-uefa-champions-league-final-1 [--out name] [--track polka] [--plain]
//
// When social/.fmxi/<id>.json exists (made by fmxi.mjs) the reel uses FotMob's lineup-builder pitch at full
// width — Alex's call 09-23: ours read "bland and narrow". --plain forces the old drawn pitch.
//
// Line-ups come from src/data/xiPool.json (the Ball IQ XI game's data) — never retyped.

import { chromium } from '../node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixQuizAudio } from './quizaudio.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const FPS = 30, THINK = 12, STEP = 0.55, TAIL = 3;

const pool = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'src', 'data', 'xiPool.json'), 'utf8'));
const xi = pool.find((x) => x.id === arg('id'));
if (!xi) { console.error('--id one of:\n' + pool.map((x) => x.id).join('\n')); process.exit(1); }
if (xi.players.length !== 11) { console.error(`XI has ${xi.players.length} players`); process.exit(1); }

const ACCENT = { Liverpool: '#c8102e', 'Manchester United': '#da291c', Chelsea: '#034694', Barcelona: '#a50044', 'Real Madrid': '#febe10',
  'Bayern Munich': '#dc052d', 'Borussia Dortmund': '#fde100', Milan: '#fb090b', Brazil: '#ffdf00', France: '#0055a4', Italy: '#0066b3',
  Spain: '#c60b1e', Netherlands: '#ff6200', Argentina: '#6cace4', Portugal: '#006600' };
const short = (n) => { const parts = n.split(' '); return parts.length > 2 && /^(van|de|di|da|dos|del)$/i.test(parts.at(-2)) ? parts.slice(-2).join(' ') : parts.at(-1); };
// reveal order: goalkeeper → defence → midfield → attack (the order people naturally recite a team)
const RANK = { GK: 0, RB: 1, CB: 1, LB: 1, RWB: 1, LWB: 1, DM: 2, RM: 3, CM: 3, LM: 3, AM: 4, SS: 4, RW: 4, LW: 4, RF: 4, LF: 4, CF: 5 };
const order = xi.players.map((p, i) => i).sort((a, b) => (RANK[xi.players[a].pos] ?? 3) - (RANK[xi.players[b].pos] ?? 3) || a - b);
const d = {
  kick: 'Name the starting XI', title: `${xi.club}`, sub: xi.match, accent: ACCENT[xi.club] || '#e3372b',
  players: xi.players.map((p) => ({ pos: p.pos, no: p.no, short: short(p.name) })), order, think: THINK, step: STEP,
  end: 'How many did you get?',
};
const TOTAL = THINK + order.length * STEP + TAIL;
const FMJ = path.join(HERE, '.fmxi', xi.id + '.json');
const FM = !process.argv.includes('--plain') && fs.existsSync(FMJ) ? JSON.parse(fs.readFileSync(FMJ, 'utf8')) : null;
if (FM) Object.assign(d, { width: FM.width, height: FM.height, hidden: `.fmxi/${xi.id}-hidden.png`, shown: `.fmxi/${xi.id}-shown.png`,
  players: FM.players.map((p) => ({ ...p, no: xi.players[p.poolIdx].no })) });

const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + path.join(HERE, FM ? 'xireel-fm.html' : 'xireel.html')); await page.waitForFunction(() => window.ready);
await page.evaluate((x) => window.setup(x), d);
if (FM) await page.waitForFunction(() => document.getElementById('hid').complete && document.getElementById('hid').naturalWidth > 0);
const FR = path.join(HERE, '.frames-xi'); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
const n = Math.round(TOTAL * FPS);
for (let i = 0; i < n; i++) { await page.evaluate((t) => window.at(t), i / FPS); await page.screenshot({ path: path.join(FR, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90 }); }
await b.close();

const name = arg('out', `xi-${xi.id}`);
const out = path.join(HERE, 'out', name + '.mp4'), silent = path.join(FR, 'silent.mp4');
fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync(FFMPEG, ['-y', '-framerate', String(FPS), '-i', path.join(FR, '%04d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], { stdio: 'ignore' });
const events = [];
for (let s = 0; s < THINK; s++) events.push({ t: s + 0.02, type: THINK - s <= 3 ? 'tickHot' : 'tick' });
order.forEach((_, k) => events.push({ t: THINK + k * STEP, type: 'tick' }));
events.push({ t: THINK + order.length * STEP, type: 'chime' });
const credit = mixQuizAudio({ video: silent, out, total: TOTAL, events, track: arg('track', 'polka'), musicVol: 0.3, skip: 5 });
fs.writeFileSync(path.join(HERE, 'out', name + '.json'), JSON.stringify({ id: xi.id, club: xi.club, match: xi.match, credit,
  caption: `${xi.club}, ${xi.match.replace(/,.*/, '')}. How many can you name before the reveal? 🧠`, players: xi.players.map((p) => p.name) }, null, 2));
console.log(`✅ ${out}  ${TOTAL.toFixed(1)}s  ${xi.club} — ${xi.match}`);
