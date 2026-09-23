// YouTube thumbnail (1280x720) for a long-form quiz: big text left, a licensed Commons photo right.
//   node social/thumbnail.mjs --photo p.jpg --credit "📷 … / CC BY-SA 4.0" --kick "40 ARSENAL QUESTIONS" --big "ONLY REAL\nGOONERS" --sub "Can you get 27+?" --accent "#ef3340" --out t.jpg
import { chromium } from '../node_modules/playwright/index.mjs';
import fs from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\\n/g, '<br>');
const photo = 'data:image/jpeg;base64,' + fs.readFileSync(arg('photo')).toString('base64');
const A = arg('accent', '#ef3340');
const html = `<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;overflow:hidden;background:#0a0708;font-family:-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif;position:relative}
.ph{position:absolute;right:0;top:0;width:640px;height:720px;object-fit:cover;object-position:${arg('focus', 'center 20%')}}
.fade{position:absolute;inset:0;background:linear-gradient(90deg,#0a0708 0%,#0a0708 42%,rgba(10,7,8,.6) 58%,rgba(10,7,8,0) 75%)}
.t{position:absolute;left:56px;top:70px;width:700px;color:#fff}
.k{display:inline-block;background:${A};color:#fff;font-weight:900;font-size:40px;padding:10px 20px;border-radius:12px;letter-spacing:.02em}
.b{font-size:118px;line-height:.95;font-weight:900;letter-spacing:-.03em;margin-top:26px;text-transform:uppercase}
.s{font-size:52px;font-weight:800;margin-top:26px;color:#ffd84d}
.c{position:absolute;right:14px;bottom:10px;font-size:15px;color:rgba(255,255,255,.7);text-shadow:0 1px 2px #000}</style>
<img class="ph" src="${photo}"><div class="fade"></div>
<div class="t"><div class="k">${esc(arg('kick'))}</div><div class="b">${esc(arg('big'))}</div><div class="s">${esc(arg('sub'))}</div></div>
<div class="c">${esc(arg('credit', ''))}</div>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.setContent(html); await p.waitForLoadState('networkidle');
await p.screenshot({ path: arg('out'), type: 'jpeg', quality: 92 }); await b.close();
console.log('✅', arg('out'));
