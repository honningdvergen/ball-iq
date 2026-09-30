#!/usr/bin/env node
// Every IG carousel → a Facebook slideshow reel (Alex 09-29: FB rewards video only; photo/album posts reach ~nobody).
//   node social/carousel2fb.mjs --caption caption.txt [--track sneaky] [--per 2.4] [--first 3] slide1.png slide2.png …
// Builds the 10–20 s reel (social/carouselreel.mjs), appends the CC music credit to the caption, creates the
// banger-critic draft for facebook and prints the next steps (critic → `social/pz upload` → Metricool FB REEL).
// Rules: fresh only (stale-news test), one topic per reel, ≥5 slides so it runs >10 s (FB only monetises >10 s), keep key text in the centre 840 px.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2), opt = {}, slides = [];
for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (opt[argv[i].slice(2)] = argv[++i]) : slides.push(path.resolve(argv[i]));
if (!opt.caption || slides.length < 3) { console.error('usage: carousel2fb.mjs --caption caption.txt [--track sneaky] slide1.png … (≥3 slides; 5+ for >10 s)'); process.exit(1); }
const track = opt.track || 'sneaky', stamp = new Date().toISOString().slice(5, 16).replace(/[-:T]/g, '');
const dir = `/private/tmp/tt/fbreel`; fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `reel_${stamp}.mp4`);
const log = execFileSync('node', [new URL('./carouselreel.mjs', import.meta.url).pathname, '--out', out, '--per', opt.per || '2.4', '--first', opt.first || '3', '--track', track, ...slides], { encoding: 'utf8' });
const credit = log.trim().split('\n').pop();
const cap = fs.readFileSync(opt.caption, 'utf8').trim().replace(/\n+🎵.*$/s, '') + '\n\n' + credit;
const capFile = path.join(dir, `caption_${stamp}.txt`); fs.writeFileSync(capFile, cap);
console.log(log.trim().split('\n')[0]);
console.log(execFileSync('node', [new URL('./review.mjs', import.meta.url).pathname, 'draft', '--platform', 'facebook', '--format', 'carousel-slideshow-reel', '--text-file', capFile, '--media', out], { encoding: 'utf8' }));
console.log(`next: run the banger-critic on the draft → social/pz upload ${out} → Metricool createScheduledPost (facebook REEL, caption ${capFile}).`);
