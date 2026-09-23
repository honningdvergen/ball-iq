// Long-form (16:9) football quiz video for YouTube — the watch-hours route to YPP.
//   node social/quizlong.mjs --theme arsenal [--n 30] [--track monkeys] [--out name] [--dry]
//
// Why long-form: Shorts watch time never counts toward the 3,000/4,000 watch hours; only long-form does
// (YouTube, verified 09-23). And every frame here is OURS — questions from our own bank — so it clears
// the reused-content review that captioned TV clips would fail (project_youtube_ypp_speedrun).
//
// Zero-fabrication rules carried over from build-reel.mjs: questions are read BY ID from src/questions.js,
// `a` is an INDEX into `o`, flagged entries are refused, the reveal fact is the bank's own hint.
// Output: out/<name>.mp4 (with music + ticks + chimes) and out/<name>.json (title, description with
// chapters + music credit + question ids). --dry renders without marking questions used.

import { chromium } from '../node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixQuizAudio, questionEvents } from './quizaudio.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEDGER = path.join(HERE, 'state', 'used-long.json');
const FFMPEG = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const DRY = process.argv.includes('--dry');

import { THEMES } from './quizthemes.mjs';

const key = arg('theme');
const T = THEMES[key];
if (!T) { console.error(`--theme one of: ${Object.keys(THEMES).join(', ')}`); process.exit(1); }
const N = Number(arg('n', 40));
const TRACK = arg('track', 'monkeys');
const outName = arg('out', `long-${key}-${new Date().toISOString().slice(0, 10)}`);

// ---- pick: easy → medium → hard, unused in long-form ----
const { QB } = await import('../src/questions.js');
const used = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : {};
const pool = QB.filter((q) => q.type === 'mcq' && !q.flag && q.hint && Array.isArray(q.o) && q.o.length === 4 && !used[q.id]
  && new Set(q.o.map((x) => String(x).trim().toLowerCase())).size === 4);
// Era 1990+ (the audience is 70% aged 35+: their football is the 90s/00s — feedback_question_era_targeting).
// A question with no year in it is kept (most are timeless: "which club did X join").
// themes.yearOf only sees 1950–2029, so the first cut let 1919/1933/1935 questions through (09-23 fact-check).
// Read EVERY year 1800–2029 in question + hint; drop the question if even its latest year is pre-1990.
// Rule: every year in the QUESTION must be 1990+ ("still the record in 2025" in a 1935 question doesn't make it
// 90s content); a question with no year in it is judged by the latest year in its hint.
const years = (txt) => [...String(txt).matchAll(/\b(18\d\d|19\d\d|20[0-2]\d)s?\b/g)].map((m) => Number(m[1]));
const inEra = (q) => { const ys = years(q.q); if (ys.length) return Math.min(...ys) >= 1990; const hs = years(q.hint); return !hs.length || Math.max(...hs) >= 1990; };
const SKIP = new Set(String(arg('skip', '')).split(',').filter(Boolean));   // hand-excluded ids (same-moment overlaps the filter can't see)
const cands = T.pick(pool).filter(inEra).filter((q) => !SKIP.has(q.id));
// 4 rounds of N/4 (09-23 viral research: top football quiz long-forms ramp Easy → Medium → Hard → Impossible,
// ~10 min, 10s per question). Round 1 easy, round 2 medium, rounds 3–4 hard.
const per = Math.floor(N / 4), want = { easy: per, medium: per, hard: N - 2 * per };
// No two questions in one video may share an answer, or be about the same thing (09-23 first render had
// Wenger twice, Vieira twice, and "The Invincibles" + "2003-04" back to back): unique answer, and no
// question may contain another chosen question's answer (strong same-topic signal).
// æ/ø/å/ß aren't combining marks, so NFD alone left "Solskjær" ≠ "Solskjaer" (09-23 United draft had THREE
// Solskjær-1999 questions). Transliterate first.
const norm = (x) => String(x).toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').replace(/ß/g, 'ss').replace(/[łđ]/g, (c) => ({ 'ł': 'l', 'đ': 'd' }[c])).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();
const surname = (x) => norm(x).split(/\s+/).pop();
const chosen = [];
const clash = (q) => chosen.some((c) => {
  const a1 = norm(q.o[q.a]), a2 = norm(c.o[c.a]);
  if (a1 === a2 || (a1.length > 3 && surname(q.o[q.a]) === surname(c.o[c.a]) && isNaN(Number(a1)))) return true;
  // same subject: a question whose STEM names another chosen answer's surname is about the same moment
  const s1 = surname(q.o[q.a]), s2 = surname(c.o[c.a]);
  if ((s2.length > 4 && isNaN(Number(s2)) && norm(q.q).split(/\s+/).includes(s2)) || (s1.length > 4 && isNaN(Number(s1)) && norm(c.q).split(/\s+/).includes(s1))) return true;
  const qt = norm(q.q + ' ' + q.hint), ct = norm(c.q + ' ' + c.hint);
  return (isNaN(Number(a2)) && a2.length > 3 && qt.includes(a2)) || (isNaN(Number(a1)) && a1.length > 3 && ct.includes(a1));
});
for (const d of ['easy', 'medium', 'hard']) {
  let k = 0;
  for (const q of cands.filter((q) => q.diff === d)) { if (k >= want[d]) break; if (!clash(q)) { chosen.push(q); k++; } }
}
for (const q of cands) { if (chosen.length >= N) break; if (!chosen.includes(q) && !clash(q)) chosen.push(q); }
if (chosen.length < Math.min(12, N)) { console.error(`only ${chosen.length} unused questions for ${key}`); process.exit(1); }
// --ids <verified.json>: render EXACTLY the questions a fact-check passed (minus --skip), in that order — so
// dropping a same-match duplicate never pulls in an unverified replacement.
const IDS = arg('ids');
if (IDS) {
  const byId = new Map(QB.map((q) => [q.id, q]));
  chosen.length = 0;
  for (const { id } of JSON.parse(fs.readFileSync(path.resolve(IDS), 'utf8')).questions) if (!SKIP.has(id) && byId.get(id)) chosen.push(byId.get(id));
}
const Qs = chosen.slice(0, IDS ? chosen.length : N).map((e) => {
  if (e.flag) throw new Error('refusing flagged question ' + e.id);
  const answer = e.o[e.a];
  if (typeof e.a !== 'number' || answer == null) throw new Error('bad answer index ' + e.id);
  return { id: e.id, diff: e.diff, q: e.q, o: e.o, a: e.a, fact: e.hint.split(/(?<=\.)\s/)[0] };
});
const n = Qs.length;
const ROUNDS = [['Round 1', 'Warm-up', 'If you miss these, log off.'], ['Round 2', 'Proper fans only', 'This is where it gets serious.'],
  ['Round 3', 'Hard', 'Most people drop off here.'], ['Round 4', 'Only real fans', 'Nobody gets all of these.']];
const NR = ROUNDS.length, perRound = Math.ceil(n / NR);
const roundOf = (i) => Math.min(NR - 1, Math.floor(i / perRound));

// ---- timeline (seconds) ----
// Cold open teases the last (hardest) question — "stay to the end" — then 4 rounds; 13s per question
// (10s timer incl. reading, 3s reveal). No slow logo intro (YouTube's own related-video guidance).
const COLD = 6, ROUND = 4, COUNT = 10, REVEAL = 3, OUTRO = 10;
const segs = []; const events = []; const chapters = [];
let t = 0;
const push = (kind, data, dur) => { segs.push({ kind, data, dur, t }); t += dur; };
chapters.push([0, 'Intro']);
push('intro', { kick: `${n} ${T.name.toUpperCase()} QUESTIONS · SCORE YOURSELF`, big: ['1% get', `question ${n}.`, 'Stay to the end.'], sub: `Only real ${T.fans} get ${Math.round(n * 0.67)}+.` }, COLD);
Qs.forEach((q, i) => {
  const r = roundOf(i);
  if (i === 0 || roundOf(i - 1) !== r) {
    chapters.push([t, `${ROUNDS[r][0]}: ${ROUNDS[r][1]}`]);
    const rn = Math.min(perRound, n - r * perRound);
    push('round', { kick: `${ROUNDS[r][0].toUpperCase()} · ${rn} QUESTIONS`, big: [ROUNDS[r][1] + '.'], sub: `${ROUNDS[r][2]} ${Math.round(rn * 0.8)}+/${rn} = real fan.` }, ROUND);
  }
  const qStart = t, base = { ...q, n: i + 1, total: n, roundName: `${ROUNDS[r][0]} · ${ROUNDS[r][1]}`, countFrom: COUNT };
  for (let c = COUNT; c >= 1; c--) push('question', { ...base, count: c, reveal: false }, 1);
  events.push(...questionEvents(qStart, qStart + 1, qStart + COUNT, qStart + COUNT));
  push('question', { ...base, reveal: true }, REVEAL);
});
chapters.push([t, 'How many did you get?']);
push('outro', { big: ['How many', 'did you get?'], rows: [[`${Math.round(n * 0.83)}+`, 'Legend. Genuinely.'], [`${Math.round(n * 0.5)}–${Math.round(n * 0.83) - 1}`, 'Proper fan.'], [`Under ${Math.round(n * 0.5)}`, 'Plastic. Sorry.']], pill: 'Comment your score 👇' }, OUTRO);
const TOTAL = t;

// ---- render stills ----
const FR = path.join(HERE, '.frames-long'); fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('file://' + path.join(HERE, 'quizlong.html'));
await page.waitForFunction(() => window.ready);
await page.evaluate((p) => window.theme(p), T.palette);
const list = [];
for (let i = 0; i < segs.length; i++) {
  const s = segs[i];
  await page.evaluate(([k, d]) => window[k](d), [s.kind, s.data]);
  const f = path.join(FR, String(i).padStart(5, '0') + '.jpg');
  await page.screenshot({ path: f, type: 'jpeg', quality: 92 });
  list.push(`file '${f}'\nduration ${s.dur}`);
}
await browser.close();
list.push(`file '${path.join(FR, String(segs.length - 1).padStart(5, '0') + '.jpg')}'`);   // concat demuxer needs the last file twice
fs.writeFileSync(path.join(FR, 'list.txt'), list.join('\n') + '\n');

// ---- encode + sound ----
const outDir = path.join(HERE, 'out'); fs.mkdirSync(outDir, { recursive: true });
const silent = path.join(FR, 'silent.mp4'), out = path.join(outDir, outName + '.mp4');
execFileSync(FFMPEG, ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(FR, 'list.txt'), '-vf', 'fps=30,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-tune', 'stillimage', '-movflags', '+faststart', silent], { stdio: 'ignore' });
const credit = mixQuizAudio({ video: silent, out, total: TOTAL, events, track: TRACK, musicVol: 0.22 });

// ---- metadata ----
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const title = T.fans === 'football fans'
  ? `${n} ${T.name} Questions Only Real Football Fans Get Right (Score Yourself)`
  : `${n} ${T.name} Questions Only Real ${T.fans.replace(/\b\w/g, (c) => c.toUpperCase())} Get Right (Score Yourself)`;
const description = [
  `How many can you get? Comment your score 👇 ${Math.round(n * 0.83)}+ is legend territory.`,
  '',
  ...chapters.map(([s, l]) => `${mmss(s)} ${l}`),
  '',
  `Play today's football guessing game: https://balliq.app/footle?utm_source=youtube`,
  `New quiz every week — subscribe so you don't miss your club's.`,
  '',
  credit,
  '',
  `#${T.name.replace(/\s+/g, '').toLowerCase()} #footballquiz #premierleague`,
].join('\n');
fs.writeFileSync(path.join(outDir, outName + '.json'), JSON.stringify({ title, description, total: TOTAL, theme: key, track: TRACK, questions: Qs.map((q) => ({ id: q.id, diff: q.diff, answer: q.o[q.a] })) }, null, 2));

if (!DRY) { Qs.forEach((q) => { used[q.id] = { theme: key, video: outName, at: new Date().toISOString() }; }); fs.writeFileSync(LEDGER, JSON.stringify(used, null, 2)); }
console.log(`✅ ${out}  ${mmss(TOTAL)}  ${n} questions  ${(fs.statSync(out).size / 1e6).toFixed(1)} MB${DRY ? '  (dry: ledger untouched)' : ''}`);
console.log(`   ${title}`);
