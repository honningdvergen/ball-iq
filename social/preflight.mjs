#!/usr/bin/env node
// Pre-flight — run BEFORE building or queueing anything. Every check here is a mistake made on 09-29:
//   · repeat slide (2 of 6 carousel slides had already run on 09-23 / 09-26; found only at the gate, after the build)
//   · our own tweet card as the image on X (Alex: "posting our own twitter screenshots, ON TWITTER")
//   · caption that lists the slides ("The night in one swipe: 1…9" — Alex cut this pattern 09-28)
//   · a scheduler that is already out of quota (Metricool "account limit" 23:27; Postiz 25 calls/h burned by re-uploads)
//   · a betting logo / a child in the picture (blaze.com on Neymar's shirt, a toddler in the Vardy CTA) — no OCR on this
//     machine, so the tool builds a contact sheet you must LOOK at.
//
//   node social/preflight.mjs --platform instagram|x|threads|facebook|tiktok|youtube
//        [--caption-file cap.txt] [--media a.png,b.png,…] [--scheduler metricool|postiz] [--uploads N] [--at 2026-09-30T08:30]
//   exit 0 = clear (warnings allowed) · exit 1 = blocked. It never posts or uploads anything.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { slotMs } from './verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const platform = (arg('platform') || '').toLowerCase().replace('twitter', 'x');
const capFile = arg('caption-file'), caption = capFile ? fs.readFileSync(capFile, 'utf8') : '';
const media = (arg('media') || '').split(',').filter(Boolean).map((f) => path.resolve(f));
const scheduler = (arg('scheduler') || '').toLowerCase(), uploads = Number(arg('uploads') || 0);
if (!platform) { console.error('usage: preflight.mjs --platform instagram|x|threads|facebook|tiktok|youtube [--caption-file f] [--media a,b] [--scheduler metricool|postiz] [--uploads N] [--at ISO]'); process.exit(1); }

const block = [], warn = [];
const VIDEO = /\.(mp4|mov|m4v|webm)$/i;
const oslo = (d) => new Date(d).toLocaleString('sv-SE', { timeZone: 'Europe/Oslo' }).replace(' ', 'T');
const when = arg('at') ? slotMs(arg('at')) : Date.now();
const hour = Number(oslo(when).slice(11, 13)) + Number(oslo(when).slice(14, 16)) / 60, today = oslo(when).slice(0, 10);

// 1. the shared repeat / brand / critic gate (same code as social/pz and the Metricool hook)
const gate = await import('./gate.mjs');
const g = gate.check({ platform, caption, media });
g.block.forEach((b) => block.push(b)); g.warn.forEach((w) => warn.push(w));

// 2. X: never our own tweet card as the image (overlay.mjs writes a .card marker next to every tweet-card render)
if (platform === 'x') {
  for (const f of media) if (fs.existsSync(f + '.card')) block.push(`X image ${path.basename(f)} is a tweet CARD (our own tweet drawn on the photo). On X the tweet text is the line — use the bare photo. Cards are for Instagram/Threads only.`);
  if (media.length > 1 && !media.some((f) => VIDEO.test(f))) warn.push('X: one picture per post is the winning shape; multi-image only if the set is the joke.');
}

// 3. caption shape
const lines = caption.split('\n');
const numbered = lines.filter((l) => /^\s*\d{1,2}[.)]\s+\S/.test(l)).length;
if (numbered >= 3 || /\b(in one swipe|swipe through|slide \d)\b/i.test(caption)) block.push('Caption lists/explains the slides (numbered list or "in one swipe"). Alex cut this on 09-28 — one line of context, then the question or follow line.');
if (['x', 'threads'].includes(platform) && /#[A-Za-z]/.test(caption)) block.push('Hashtag on X/Threads — banned (A_GRADE_PLAN).');
if (platform === 'instagram' && caption.length > 2200) block.push('Instagram caption over 2,200 characters.');
if ((caption.match(/😭/g) || []).length > 1) warn.push('More than one 😭 in the caption; the 😭 quota is ≤1 of 3 posts.');
if (/\b115-0\b|\bevery (single )?charge\b/i.test(caption)) warn.push('Caption states City lost every charge — CBS says cleared on 1 of 115. Use the PL wording only.');

// 4. windows (Alex/A_GRADE_PLAN): IG no 00:30–09:00; Threads 08–22 (to 24 on big-event days)
const md = path.join(HERE, 'state', 'matchdays.txt');
const tier = fs.existsSync(md) ? (() => { const l = fs.readFileSync(md, 'utf8').split('\n').map((x) => x.trim().split(/\s+/)).find((x) => x[0] === today); return !l ? 1 : l[1] === 'mega' ? 3 : 2; })() : 1;
if (platform === 'instagram' && hour >= 0.5 && hour < 9) block.push(`Instagram slot ${oslo(when).slice(11, 16)} Oslo is inside the overnight ban (00:30–09:00).`);
if (platform === 'threads' && (hour < 8 || hour >= (tier > 1 ? 24 : 22))) block.push(`Threads slot ${oslo(when).slice(11, 16)} Oslo is outside the window (08:00–${tier > 1 ? '24:00 big-event day' : '22:00'}).`);

// 5. scheduler capacity
if (scheduler === 'metricool') {
  const st = path.join(HERE, 'state', 'scheduler_status.json');
  const s = fs.existsSync(st) ? JSON.parse(fs.readFileSync(st, 'utf8')) : {};
  if (s.metricool?.blocked) block.push(`Metricool is marked BLOCKED (${s.metricool.note}, since ${s.metricool.since}). Use Postiz, or clear it after the plan resets: edit social/state/scheduler_status.json.`);
  else warn.push('Metricool hit "account limit" on 09-29 23:27 — after scheduling, read getScheduledPosts and confirm status is not ERROR.');
}
if (scheduler === 'postiz' || !scheduler) {
  const log = path.join(HERE, 'state', 'postiz_calls.log'), now = Date.now();
  const ts = (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n') : []).map((l) => Number(l.split(' ')[0])).filter((t) => t && now - t < 3600e3).sort((a, b) => a - b);
  const need = uploads + 1, left = 25 - ts.length;
  if (need > left) block.push(`Postiz quota: ${ts.length}/25 calls used this hour, this post needs ~${need} (uploads + create). Next free slot ${ts.length ? oslo(ts[0] + 3600e3).slice(11, 16) : 'now'} Oslo. Reuse already-uploaded URLs from social/state/uploads.tsv instead of re-uploading.`);
  else if (left - need < 6) warn.push(`Postiz quota: only ${left - need} calls will remain this hour after this post.`);
}

// 6. picture sanity + the contact sheet a human must look at (no OCR here)
const imgs = media.filter((f) => !VIDEO.test(f) && fs.existsSync(f));
if (platform === 'instagram') for (const f of imgs) {
  try { const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], { encoding: 'utf8' }).trim().split(',').map(Number); if (w && h && Math.abs(w / h - 0.8) > 0.05) warn.push(`${path.basename(f)} is ${w}×${h} — Instagram carousels are 4:5 (1080×1350); it will be cropped.`); } catch { /* ffprobe missing: skip */ }
}
let sheet = '';
if (imgs.length) {
  try {
    sheet = '/private/tmp/tt/preflight_sheet.jpg';
    const ins = imgs.slice(0, 10).flatMap((f) => ['-i', f]);
    const n1 = imgs.slice(0, 10).length;
    const fc = n1 === 1 ? '[0:v]scale=360:450:force_original_aspect_ratio=decrease,pad=360:450:(ow-iw)/2:(oh-ih)/2:color=gray' : imgs.slice(0, 10).map((_, i) => `[${i}:v]scale=360:450:force_original_aspect_ratio=decrease,pad=360:450:(ow-iw)/2:(oh-ih)/2:color=gray[s${i}]`).join(';') + ';' + imgs.slice(0, 10).map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${Math.min(imgs.length, 10)}`;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...ins, '-filter_complex', fc, '-frames:v', '1', sheet]);
  } catch { sheet = ''; }
}

console.log(`PREFLIGHT ${platform}${scheduler ? ' via ' + scheduler : ''} — ${block.length ? 'BLOCKED' : 'clear'}`);
block.forEach((b) => console.log('  ⛔ ' + b)); warn.forEach((w) => console.log('  ⚠️  ' + w));
if (imgs.length) console.log(`  👁  LOOK at ${sheet || 'the slides'} before building/queueing: betting logos (blaze/stake/kalshi/…), children in frame, another account's brand, watermarks. No OCR on this machine — this check is yours.`);
process.exit(block.length ? 1 : 0);
