// a11y.mjs — WCAG 2.1 AA audit of the live marketing/SEO pages, measured at a
// real mobile viewport.
//
//   node scripts/a11y.mjs                 # against the live site
//   node scripts/a11y.mjs --local         # against a local `dist` server
//
// WHY THIS EXISTS, AND WHAT IT CORRECTS
// `shots.mjs` flags "N tap targets under 40px". That number was never a WCAG AA
// failure and it over-reported badly:
//   - 2.5.5 Target Size (44x44) is Level **AAA**, not AA. Under 2.1 AA there is
//     NO minimum target size at all. It's Apple HIG / Android guidance we care
//     about here, not conformance.
//   - Even under AAA, 2.5.5 EXEMPTS links inline in a sentence. shots.mjs
//     counted every footer and body link, which is why it reported 13-20/page.
// So this script separates the two: real AA failures (contrast, missing
// accessible names, landmarks) from platform-ergonomics warnings on STANDALONE
// controls only.
//
// Contrast is computed from real resolved colours: the element's own `color`
// against the nearest ancestor with a non-transparent background. That matters
// on a dark theme where most elements are transparent over one dark page bg.

import { chromium } from 'playwright';

const LOCAL = process.argv.includes('--local');
const BASE = LOCAL ? 'http://localhost:8899' : 'https://balliq.app';

// One per page TYPE — a generator defect hits every page of that type.
const PAGES = [
  { name: 'home', url: '/' },
  { name: 'club', url: '/quiz/manchester-united/' },
  { name: 'player', url: '/quiz/lewandowski/' },
  { name: 'list', url: '/lists/ballon-dor-winners/' },
  { name: 'hub', url: '/quiz/' },
  { name: 'footle', url: '/football-wordle/' },
  { name: 'study', url: '/study/football-trivia-memory/' },
];

const AUDIT = () => {
  // WCAG 1.4.3 contrast: sRGB relative luminance, then (L1+.05)/(L2+.05).
  const parse = (s) => {
    const n = (s.match(/[\d.]+/g) || []).map(Number);
    return { rgb: n.slice(0, 3), a: n.length > 3 ? n[3] : 1 };
  };
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (fg, bg) => {
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  };
  // Walk up for the first painted background. Semi-transparent layers are
  // composited over what's behind them so the ratio reflects what's on screen.
  //
  // Gradients matter here: reading only `background-color` reported the orange
  // Daily 7 band as 1:1 (its bg-color is transparent over the near-black page)
  // when the real text sits on #FF6A00→#FFC107. So a gradient contributes ALL
  // its colour stops as candidates and the caller scores against the worst one.
  // Gradient stops carry alpha and MUST be composited, not read raw. Reading
  // the raw triple out of `linear-gradient(135deg, rgba(88,204,2,0.10), …)`
  // scores text against OPAQUE green when the pixel is really a near-black
  // tint — that invented 10 phantom failures on the app's home screen before
  // it was caught. Layers are collected top-down, flattened bottom-up.
  const bgOf = (el) => {
    const layers = [];
    let n = el;
    while (n) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage.includes('gradient')) {
        const stops = [...cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)].map((m) => {
          const v = m[1].split(',').map(Number);
          return { rgb: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 };
        });
        if (stops.length) layers.push({ stops });
      }
      const { rgb, a } = parse(cs.backgroundColor);
      if (a > 0) {
        layers.push({ stops: [{ rgb, a }] });
        if (a === 1) break;                    // opaque: nothing below shows
      }
      n = n.parentElement;
    }
    const over = (top, under) => top.rgb.map((c, i) => c * top.a + under[i] * (1 - top.a));
    let bases = [[10, 10, 10]];                // page canvas
    for (let i = layers.length - 1; i >= 0; i--) {
      const next = [];
      for (const base of bases) for (const s of layers[i].stops) next.push(over(s, base));
      bases = next.slice(0, 8);
    }
    return bases;
  };

  const contrast = [], small = [], noName = [], noFocus = [];
  const seen = new Set();

  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.offsetParent === null) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') return;
    // 1.4.3 exempts incidental/decorative text. The giant ⚽/🔥 watermarks are
    // aria-hidden at low opacity and are background art, not content.
    if (el.closest('[aria-hidden="true"]')) return;

    // ── 1.4.3 contrast — only leaf elements carrying their own text
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim()).join(' ');
    if (own) {
      const { rgb, a } = parse(cs.color);
      // Score against the WORST candidate — a gradient must pass along its
      // whole run, not just at the stop that happens to flatter the text.
      const cands = bgOf(el);
      let cr = Infinity, bg = cands[0];
      for (const c of cands) {
        const fg = a === 1 ? rgb : rgb.map((v, j) => v * a + c[j] * (1 - a));
        const r2 = ratio(fg, c);
        if (r2 < cr) { cr = r2; bg = c; }
      }
      const px = parseFloat(cs.fontSize);
      const large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
      const need = large ? 3 : 4.5;
      if (cr < need) {
        const key = `${cs.color}|${Math.round(px)}|${el.tagName}`;
        if (!seen.has(key)) {
          seen.add(key);
          contrast.push({
            t: own.slice(0, 40), px, ratio: +cr.toFixed(2), need,
            color: cs.color, bg: `rgb(${bg.map(Math.round)})`,
            sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
          });
        }
      }
    }

    if (el.tagName !== 'A' && el.tagName !== 'BUTTON' && !el.hasAttribute('tabindex')) return;
    const txt = (el.textContent || '').trim();

    // ── platform target size (NOT an AA criterion). 2.5.5 exempts inline links.
    const p = el.parentElement;
    const inline = el.tagName === 'A' && p && /^(P|LI|SPAN|SMALL|EM|STRONG)$/.test(p.tagName)
      && getComputedStyle(el).display.startsWith('inline');
    if (!inline && (r.height < 44 || r.width < 44)) {
      small.push({ t: txt.slice(0, 28) || `<${el.tagName}>`, w: Math.round(r.width), h: Math.round(r.height) });
    }

    // ── 4.1.2 name/role/value
    if (!txt && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')
        && !el.getAttribute('title') && !el.querySelector('img[alt]:not([alt=""])')) {
      noName.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 30) });
    }

    // ── 2.4.7 visible focus. An author reset (outline:none) with no replacement
    //    is the failure; the UA default focus ring is fine.
    if (cs.outlineStyle === 'none' && !cs.boxShadow.includes('rgb')) noFocus.push(txt.slice(0, 24));
  });

  return {
    contrast, small: small.slice(0, 12), smallCount: small.length,
    noName: noName.slice(0, 6), noNameCount: noName.length,
    landmarks: {
      main: document.querySelectorAll('main').length,
      h1: document.querySelectorAll('h1').length,
      lang: document.documentElement.lang || '(none)',
      skip: !!document.querySelector('a[href^="#"][class*="skip"], .skip-link'),
      imgNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    },
  };
};

const br = await chromium.launch();
const ctx = await br.newContext({
  viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
let fails = 0;
for (const { name, url } of PAGES) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(300);
    const r = await page.evaluate(AUDIT);
    const bad = r.contrast.length + r.noNameCount + (r.landmarks.main === 0 ? 1 : 0)
      + (r.landmarks.h1 !== 1 ? 1 : 0) + r.landmarks.imgNoAlt;
    if (bad) fails++;
    console.log(`\n──── ${name.padEnd(7)} ${url}`);
    console.log(`  AA contrast failures (1.4.3): ${r.contrast.length}`);
    r.contrast.forEach((c) => console.log(`     ${String(c.ratio).padStart(5)}:1 need ${c.need}  ${c.px}px  ${c.color} on ${c.bg}\n        ${c.sel}\n        "${c.t}"`));
    console.log(`  AA no accessible name (4.1.2): ${r.noNameCount}`);
    r.noName.forEach((n) => console.log(`     <${n.tag}> .${n.cls}`));
    console.log(`  AA structure: main=${r.landmarks.main} h1=${r.landmarks.h1} lang=${r.landmarks.lang} img-without-alt=${r.landmarks.imgNoAlt} skip-link=${r.landmarks.skip}`);
    console.log(`  ergonomics — standalone controls <44px (AAA/platform, not AA): ${r.smallCount}`);
    r.small.forEach((s) => console.log(`     ${s.w}x${s.h}  "${s.t}"`));
  } catch (e) {
    console.log(`\n──── ${name}  ERROR: ${e.message.split('\n')[0]}`);
    fails++;
  }
  await page.close();
}
await br.close();
console.log(`\n${PAGES.length - fails}/${PAGES.length} pages clean of AA failures.`);
