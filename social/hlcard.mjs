// YouTube "Format A" Short: a Google-style FULL-TIME SCORE CARD on top + a meme clip below with the
// two crests stuck ON the characters. Evidence (LIBRARY_youtube.md, 887 Shorts ranked 09-28): every
// outlier fills ≥60% of the frame with card + clip, crests on the vessel, 5–10 s, loops, out ≤60 min
// after FT. Mr Cristiano's "Norway 3-2 Denmark | Highlights" in this template got 73K; ours (text header
// + small clip + blurred fill) got 5.
//
//   node social/hlcard.mjs --event 401861081 --clip vessel.mp4 --out out.mp4 [--ss 0] [--to 8]
//        [--home-at 0.30,0.55,0.16] [--away-at 0.70,0.45,0.16]   (crest centre x,y + diameter, as fractions of the CLIP)
//        [--clip-h 1000] [--home "Belgium" --away "France" --hs 1 --as 2 --scorers "…|…"]  (manual override)
//
// With --event it reads names, crests, score and scorers from ESPN. No logo, no handle (Alex: no logo).
import { chromium } from '../node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const IN = arg('clip'), OUT = arg('out');
if (!IN || !OUT) { console.error('usage: hlcard.mjs --event <espnId> --clip vessel.mp4 --out out.mp4'); process.exit(1); }
const W = 1080, H = 1920, CARD = 470, CLIPH = Number(arg('clip-h', 1000));
const tmp = fs.mkdtempSync('/tmp/hlcard-');

let home = { name: arg('home'), score: arg('hs'), logo: arg('home-logo') }, away = { name: arg('away'), score: arg('as'), logo: arg('away-logo') };
let scorers = (arg('scorers') || '|').split('|'), status = 'Full-time';
if (arg('event')) {
  const j = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${arg('event')}`)).json();
  const comp = j.header.competitions[0];
  for (const t of comp.competitors) {
    const side = t.homeAway === 'home' ? home : away;
    side.name ||= t.team.displayName; side.score ??= t.score; side.logo ||= t.team.logos?.[0]?.href || t.team.logo; side.id = t.team.id;
  }
  if (comp.status?.type?.state !== 'post') status = comp.status?.type?.shortDetail || 'Live';
  const goals = (j.keyEvents || []).filter((e) => /goal/i.test(e.type?.text || '') && !/disallow/i.test(e.type?.text || ''));
  const fmt = (e) => `${(e.participants?.[0]?.athlete?.shortName || e.participants?.[0]?.athlete?.displayName || '').replace(/^(\w)\w+ /, '$1. ')} ${e.clock?.displayValue || ''}${/own/i.test(e.type?.text) ? ' (og)' : ''}`;
  if (!arg('scorers')) scorers = [home, away].map((s) => goals.filter((e) => String(e.team?.id) === String(s.id)).map(fmt).join('<br>'));
}
const dl = async (url, f) => { fs.writeFileSync(f, Buffer.from(await (await fetch(url)).arrayBuffer())); return f; };
// Country logos on ESPN are a 3:2 flag inside a transparent 500x500 square: cut the centre square of the
// flag so it reads as a round flag badge (club crests are used whole).
const square = (f, url) => { if (!/countries/.test(url)) return f; const o = f.replace('.png', '_sq.png'); execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', f, '-vf', 'crop=ih*0.64:ih*0.64', o]); return o; };
const hl = square(await dl(home.logo, path.join(tmp, 'h.png')), home.logo), al = square(await dl(away.logo, path.join(tmp, 'a.png')), away.logo);
const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;

// 1) the card (dark, Google-style) as a PNG
const card = path.join(tmp, 'card.png');
const html = `<body style="margin:0;background:#000"><div id=c style="width:${W}px;height:${CARD}px;background:#202124;color:#e8eaed;font-family:-apple-system,Helvetica,Arial;position:relative">
<div style="position:absolute;top:48px;left:0;right:0;display:flex;align-items:center;justify-content:space-around">
 <div style="text-align:center;width:300px"><img src="${uri(hl)}" style="width:150px;height:150px;border-radius:50%;object-fit:cover"><div style="font-size:44px;margin-top:14px">${home.name}</div></div>
 <div style="text-align:center"><div style="font-size:130px;font-weight:600;letter-spacing:10px">${home.score}<span style="color:#9aa0a6"> </span>${away.score}</div><div style="display:inline-block;background:#3c4043;border-radius:24px;padding:6px 22px;font-size:32px">${status}</div></div>
 <div style="text-align:center;width:300px"><img src="${uri(al)}" style="width:150px;height:150px;border-radius:50%;object-fit:cover"><div style="font-size:44px;margin-top:14px">${away.name}</div></div>
</div>
<div style="position:absolute;bottom:22px;left:60px;right:60px;display:flex;justify-content:space-between;font-size:30px;color:#bdc1c6;line-height:1.3">
 <div style="text-align:left">${scorers[0] || ''}</div><div style="text-align:right">${scorers[1] || ''}</div></div></div></body>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: CARD } });
await p.setContent(html); await (await p.$('#c')).screenshot({ path: card }); await b.close();

// 2) crest stickers (round PNGs) sized for the clip area
const sticker = (src, d, out) => { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-vf', `scale=${d}:${d},format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-${d / 2},Y-${d / 2}),${d / 2}),alpha(X,Y),0)'`, out]); return out; };
const at = (s, def) => (arg(s) || def).split(',').map(Number);
const [hx, hy, hd] = at('home-at', '0.30,0.55,0.16'), [ax, ay, ad] = at('away-at', '0.70,0.45,0.16');
const hs = sticker(hl, Math.round(hd * W), path.join(tmp, 'hs.png')), as = sticker(al, Math.round(ad * W), path.join(tmp, 'as.png'));

// 3) compose: black canvas, card on top, clip scaled to fill CLIPH (centre-cropped to 1080 wide), crests on it
const ss = arg('ss', '0'), to = arg('to');
const pos = (x, y, d) => [Math.round(x * W - (d * W) / 2), Math.round(CARD + y * CLIPH - (d * W) / 2)];
const [hX, hY] = pos(hx, hy, hd), [aX, aY] = pos(ax, ay, ad);
const hasAudio = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', IN]).toString().trim() !== '';
const fc = `[0:v]scale=-2:${CLIPH},crop=${W}:${CLIPH}[v];color=black:${W}x${H}:d=60[bg];[bg][1:v]overlay=0:0[b1];[b1][v]overlay=0:${CARD}:shortest=1[b2];[b2][2:v]overlay=${hX}:${hY}[b3];[b3][3:v]overlay=${aX}:${aY},format=yuv420p[out]`;
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', ss, ...(to ? ['-to', to] : []), '-i', IN, '-i', card, '-i', hs, '-i', as,
  '-filter_complex', fc, '-map', '[out]', ...(hasAudio ? ['-map', '0:a', '-c:a', 'aac'] : []), '-c:v', 'libx264', '-crf', '20', '-r', '30', OUT]);
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', OUT]).toString().trim();
console.log(`✅ ${OUT} (${Number(dur).toFixed(1)}s${hasAudio ? '' : ', SILENT — add a sound'}) ${home.name} ${home.score}-${away.score} ${away.name}`);
