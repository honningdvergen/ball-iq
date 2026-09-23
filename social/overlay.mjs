// Tweet-ON-photo post (Football Planet format, Alex 09-23: "clean pictures and tweets ON the
// pictures themselves… quite original").
//
//   node social/overlay.mjs --tweet <syndication.json> --bg <photo.jpg> --out post.png
//        [--card dark|light] [--focus "center 25%"] [--y bottom|top] [--allow-bare]
//
// The ORIGINALITY is in the pairing: a real tweet + a photo WE chose that adds the joke
// (their best one: "never seen a La Liga player succeed in the Premier League" over Di María in
// a United shirt). Instagram/Meta count "adding a perspective" as original; a bare repost isn't.
//
// Rules (enforced): the tweet must be a real one (syndication JSON with id + user); the photo must
// be ours to use — a Commons file from src/data/mysteryPhotos.json (licence + author printed for the
// caption) or the tweet's OWN photo. Never a random web image.

import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const TW = arg('tweet'), BG = arg('bg'), OUT = arg('out');
// --own "text": OUR account's post on the photo (Alex 09-23, Football Planet "Players with ZERO haters"
// format, "just put my account there"). Needs --bg (a Commons photo from mysteryPhotos.json).
const OWN = arg('own');
const CARD = arg('card') || 'dark', FOCUS = arg('focus') || 'center 25%', Y = arg('y') || 'bottom';
if ((!TW && !OWN) || !OUT) { console.error('usage: overlay.mjs --tweet t.json --bg photo.jpg --out post.png [--card dark|light] [--focus "center 25%"] [--y bottom|top]'); process.exit(1); }

const t = OWN
  ? { id_str: 'own', text: OWN.replace(/\\n/g, '\n'), user: { name: 'Shithousery HQ', screen_name: 'shithouseryhq', verified: true } }
  : JSON.parse(fs.readFileSync(TW, 'utf8'));
if (!t.id_str || !t.user?.screen_name) { console.error('REFUSING: not a real tweet (no id_str/user)'); process.exit(1); }
const dir = TW ? path.dirname(TW) : '';
const avatar = OWN ? (arg('avatar') || '/private/tmp/tt/own/shq_avatar.jpg') : path.join(dir, `${t.id_str}_av.jpg`);
if (!fs.existsSync(avatar)) { console.error(`REFUSING: no avatar file ${avatar} (run dl.mjs)`); process.exit(1); }
const bg = BG || path.join(dir, `${t.id_str}_0.jpg`);
if (OWN && !BG) { console.error('REFUSING: --own needs --bg (a licensed Commons photo)'); process.exit(1); }
if (!fs.existsSync(bg)) { console.error(`REFUSING: no background photo (${bg})`); process.exit(1); }

const W = 1080, H = 1350;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uri = (p) => `data:image/${/\.png$/i.test(p) ? 'png' : 'jpeg'};base64,${fs.readFileSync(p).toString('base64')}`;
const text = (t.text || '').replace(/https:\/\/t\.co\/\S+/g, '').replace(/&amp;/g, '&').trim();
const verified = t.user.is_blue_verified || t.user.verified;
const BADGE = `<svg viewBox="0 0 22 22" width="30" height="30"><path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;
const dark = CARD === 'dark';
const fs_ = text.length > 180 ? 34 : text.length > 110 ? 38 : 42;

const html = `<!DOCTYPE html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#000}
body{font-family:-apple-system,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;position:relative}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${FOCUS}}
.card{position:absolute;left:60px;right:60px;${Y === 'top' ? 'top:70px' : 'bottom:80px'};
  border-radius:26px;padding:30px 34px 34px;
  background:${dark ? 'rgba(15,20,25,.86)' : '#fff'};color:${dark ? '#fff' : '#0f1419'};
  box-shadow:0 10px 40px rgba(0,0,0,.35)}
.top{display:flex;align-items:center;gap:18px;margin-bottom:18px}
.av{width:78px;height:78px;border-radius:50%;object-fit:cover}
.nm{display:flex;align-items:center;gap:8px;font-size:33px;font-weight:800}
.hd{font-size:28px;color:${dark ? '#a8b3bd' : '#536471'}}
.tx{font-size:${fs_}px;line-height:1.28;white-space:pre-wrap}
</style>
<img class="bg" src="${uri(bg)}">
<div class="card"><div class="top"><img class="av" src="${uri(avatar)}">
<div><div class="nm">${esc(t.user.name)}${verified ? BADGE : ''}</div><div class="hd">@${esc(t.user.screen_name)}</div></div></div>
<div class="tx">${esc(text)}</div></div>
${arg('credit') ? `<div style="position:absolute;right:40px;bottom:26px;font-size:19px;color:rgba(255,255,255,.75);text-shadow:0 1px 3px rgba(0,0,0,.9)">${esc(arg('credit'))}</div>` : ''}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html);
await page.waitForLoadState('networkidle');
const box = await page.evaluate(() => document.querySelector('.card').getBoundingClientRect().toJSON());
if (box.top < 40 || box.bottom > 1350 - 20) { console.error(`card overflows (${Math.round(box.top)}–${Math.round(box.bottom)}) — shorten or use --y top`); process.exit(1); }
await page.screenshot({ path: OUT });
await browser.close();
console.log(`✅ ${OUT}  (card ${Math.round(box.top)}–${Math.round(box.bottom)}px)  ${OWN ? 'own post' : `source: https://x.com/${t.user.screen_name}/status/${t.id_str}`}`);
