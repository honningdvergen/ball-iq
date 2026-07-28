// shots.mjs — screenshot every page type at real device viewports, and ASSERT
// the things that keep silently breaking.
//
//   node scripts/shots.mjs                 # against the live site
//   node scripts/shots.mjs --local         # against a local `dist` server
//   node scripts/shots.mjs --open          # also write an HTML contact sheet
//
// WHY THIS EXISTS
// Three separate mobile defects shipped to production and survived every
// review, because all of them were invisible at desktop width:
//   1. Homepage: the ~636px Footle card pushed the quiz taster ~1074px down,
//      so a phone's first screen was an EMPTY letter grid.
//   2. Club pages: hero-left (headline + prose + THREE download buttons,
//      ~326px) stacked above the quiz, so the first tappable answer sat 114px
//      below the fold. Every Google visitor was asked to install an app before
//      answering anything.
//   3. Nav: five items fought over ~347px at 375px, so the brand collided with
//      "All quizzes" and both it and the CTA wrapped onto two lines.
//
// Each was found by hand, one at a time, by measuring a real viewport. A
// container-width probe does NOT work — @media keys off the VIEWPORT, so a
// narrow wrapper still renders desktop styles. Only a real viewport tells the
// truth, which is exactly what this automates.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const LOCAL = process.argv.includes('--local');
const SHEET = process.argv.includes('--open');
const BASE = LOCAL ? 'http://localhost:8899' : 'https://balliq.app';
const OUT = path.resolve(process.cwd(), '.shots');

// One per page TYPE — a defect in the generator hits every page of that type,
// so a representative sample catches it without 164 screenshots.
const PAGES = [
  { name: 'home',    url: '/' },
  { name: 'club',    url: '/quiz/manchester-united/' },
  { name: 'player',  url: '/quiz/lewandowski/' },
  { name: 'list',    url: '/lists/ballon-dor-winners/' },
  { name: 'hub',     url: '/quiz/' },
  { name: 'footle',  url: '/football-wordle/' },
];

const DEVICES = [
  { name: 'iphone', width: 375, height: 812, dpr: 2 },   // the 66% case
  { name: 'tablet', width: 768, height: 1024, dpr: 2 },
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
];

// Assertions run IN the page. Each encodes a defect that actually shipped.
const AUDIT = () => {
  const vh = window.innerHeight, vw = window.innerWidth;
  const y = el => el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
  const issues = [];

  // 1. Is anything playable above the fold? (defects 1 and 2)
  const firstTappable = document.querySelector('#biq-taster .to, .qa-opts .to, .mkt-opt, .wd-key');
  if (firstTappable) {
    const fy = y(firstTappable);
    if (fy > vh) issues.push(`first tappable control ${fy - vh}px BELOW the ${vh}px fold`);
  }

  // 2. Does anything overflow horizontally? (a classic phone-only break)
  if (document.documentElement.scrollWidth > vw + 1) {
    issues.push(`horizontal overflow: content ${document.documentElement.scrollWidth}px vs ${vw}px viewport`);
  }

  // 3. Nav wrapping — the brand/CTA collision (defect 3). A single-line nav
  //    should be near its font size; much taller means it wrapped.
  const cta = document.querySelector('.nav-cta, .landing-nav-cta');
  if (cta && cta.getBoundingClientRect().height > 56) {
    issues.push(`nav CTA is ${Math.round(cta.getBoundingClientRect().height)}px tall — likely wrapped to two lines`);
  }

  // 4. Tap targets under Apple's 44pt / Android's 48dp minimum.
  //
  // This is a NOTE, not an issue. Two corrections after measuring properly:
  //   - It is not a WCAG AA failure. 2.5.5 Target Size (44x44) is Level AAA;
  //     under 2.1 AA there is no minimum target size at all. This is platform
  //     ergonomics guidance, so it must not fail the run.
  //   - 2.5.5 exempts links inline in a sentence. Counting every footer and
  //     body link is what produced the meaningless "13-20 per page" number.
  // scripts/a11y.mjs is the conformance check; this stays a smell test.
  const small = [...document.querySelectorAll('a,button')].filter(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.offsetParent === null) return false;
    const p = el.parentElement;
    const inline = el.tagName === 'A' && p && /^(P|LI|SPAN|SMALL|EM|STRONG)$/.test(p.tagName)
      && getComputedStyle(el).display.startsWith('inline');
    return !inline && r.height < 40;
  });
  const notes = small.length ? [`${small.length} standalone tap target(s) under 40px tall (ergonomics, not WCAG AA)`] : [];

  return { issues, notes, docHeight: document.body.scrollHeight };
};

const run = async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const dev of DEVICES) {
    const ctx = await browser.newContext({
      viewport: { width: dev.width, height: dev.height },
      deviceScaleFactor: dev.dpr,
      isMobile: dev.width < 800,
      hasTouch: dev.width < 800,
    });
    for (const p of PAGES) {
      const page = await ctx.newPage();
      const file = `${p.name}-${dev.name}.png`;
      let audit = { issues: ['PAGE FAILED TO LOAD'], notes: [], docHeight: 0 };
      try {
        await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(400);
        audit = await page.evaluate(AUDIT);
        await page.screenshot({ path: path.join(OUT, file) });          // fold view
        await page.screenshot({ path: path.join(OUT, `full-${file}`), fullPage: true });
      } catch (e) {
        audit.issues = [`ERROR: ${e.message.split('\n')[0]}`];
      }
      results.push({ page: p.name, device: dev.name, url: p.url, file, ...audit });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();

  // ── report ────────────────────────────────────────────────────────────────
  let bad = 0;
  console.log(`\nShots written to .shots/  (base: ${BASE})\n`);
  for (const r of results) {
    const tag = r.issues.length ? '⚠️ ' : '✅';
    if (r.issues.length) bad++;
    const note = (r.notes || []).length ? `  · note: ${r.notes.join(' · ')}` : '';
    console.log(`${tag} ${r.page.padEnd(8)} ${r.device.padEnd(8)} ${r.issues.join(' · ') || 'clean'}${note}`);
  }
  console.log(`\n${results.length - bad}/${results.length} clean.`);

  if (SHEET) {
    const rows = results.map(r => `<figure><img src="${r.file}" loading="lazy"><figcaption><b>${r.page} · ${r.device}</b>${r.issues.length ? `<br><span class=bad>${r.issues.join('<br>')}</span>` : '<br><span class=ok>clean</span>'}</figcaption></figure>`).join('');
    fs.writeFileSync(path.join(OUT, 'index.html'),
      `<style>body{background:#0A0A0A;color:#eee;font:14px system-ui;margin:0;padding:24px}h1{font-size:20px}
       .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
       figure{margin:0;background:#111;border:1px solid #242836;border-radius:12px;overflow:hidden}
       img{width:100%;display:block;border-bottom:1px solid #242836}
       figcaption{padding:10px 12px;font-size:12px;line-height:1.5}
       .bad{color:#FF8A8A}.ok{color:#8AE042}</style>
       <h1>Ball IQ — viewport contact sheet <small style="color:#888">${BASE}</small></h1><div class=grid>${rows}</div>`);
    console.log(`Contact sheet: .shots/index.html`);
  }
  process.exit(bad ? 1 : 0);
};

run().catch(e => { console.error(e); process.exit(1); });
