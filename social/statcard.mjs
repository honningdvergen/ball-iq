// Build an original Shithousery HQ stat card.
//
//   node social/statcard.mjs --big "21%" --label "GOALS CONCEDED FROM DISTANCE" \
//     --who "David Raya" --sub "Premier League, 2021-26" \
//     --claim "Second-highest proportion in Premier League history" \
//     --source "LiveScore" --out card.png
//
// Original artwork, source credited on the card. That matters twice: it keeps
// us honest about where a stat came from (if the source is wrong, the card
// says who to blame), and original graphics are safe for YouTube, where
// reposted branded assets are the clearest reused-content signal there is.
//
// 1080x1350 (4:5) — the tallest ratio Meta's feed allows, so it occupies the
// most screen on a phone.

import { chromium } from '../node_modules/playwright/index.mjs';

const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const BIG    = arg('big')    || '';
const LABEL  = arg('label')  || '';
const WHO    = arg('who')    || '';
const SUB    = arg('sub')    || '';
const CLAIM  = arg('claim')  || '';
const SOURCE = arg('source') || '';
const OUT    = arg('out')    || 'card.png';
const ACCENT = arg('accent') || '#00d26a';

const html = `<!DOCTYPE html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1350px;background:#080b10;overflow:hidden}
  body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  #glow{position:absolute;inset:0;
    background:radial-gradient(130% 80% at 50% 8%, #16202c 0%, #0b1017 50%, #080b10 100%)}
  #wrap{position:relative;height:100%;display:flex;flex-direction:column;
    justify-content:center;padding:0 88px}
  #who{font-size:52px;font-weight:800;color:#fff;letter-spacing:-.02em}
  #sub{margin-top:12px;font-size:32px;font-weight:600;color:#7d8896}
  #big{margin-top:52px;font-size:300px;line-height:.86;font-weight:900;
    letter-spacing:-.05em;color:${ACCENT}}
  #label{margin-top:18px;font-size:46px;font-weight:800;color:#fff;
    letter-spacing:.01em;line-height:1.14;text-transform:uppercase}
  #rule{margin-top:54px;width:132px;height:8px;border-radius:5px;background:${ACCENT}}
  #claim{margin-top:40px;font-size:40px;font-weight:600;color:#c3cbd6;line-height:1.32}
  #foot{position:absolute;left:88px;right:88px;bottom:70px;
    display:flex;justify-content:space-between;align-items:baseline}
  .mark{font-size:24px;font-weight:800;letter-spacing:.34em;color:#5b6675;text-transform:uppercase}
</style>
<div id="glow"></div>
<div id="wrap">
  <div id="who"></div>
  <div id="sub"></div>
  <div id="big"></div>
  <div id="label"></div>
  <div id="rule"></div>
  <div id="claim"></div>
</div>
<div id="foot"><div class="mark" id="src"></div><div class="mark">Shithousery HQ</div></div>
<script>
  const set=(id,v)=>{document.getElementById(id).textContent=v};
  set('who',${JSON.stringify(WHO)});
  set('sub',${JSON.stringify(SUB)});
  set('big',${JSON.stringify(BIG)});
  set('label',${JSON.stringify(LABEL)});
  set('claim',${JSON.stringify(CLAIM)});
  set('src',${JSON.stringify(SOURCE ? 'Source: ' + SOURCE : '')});
</script>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.screenshot({ path: OUT });
await browser.close();
console.log(`✅ ${OUT}`);
