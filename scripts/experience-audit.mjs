#!/usr/bin/env node
/**
 * Experience audit — the half of quality that numbers alone keep missing.
 *
 * WHY THIS EXISTS. On 2026-08-22 Alex reported seven real defects in one
 * message. Every one had been live for a while; not one had been caught by an
 * audit. Meanwhile I measured tab switching at "17ms, 733 DOM nodes, no tap
 * delay" and nearly declared it healthy — while the actual problem was a blank
 * pane during a chunk fetch. The numbers were right and the conclusion was
 * wrong, because I was measuring what is easy to measure rather than what a
 * person feels.
 *
 * So this checks the things that make an app feel good or bad to USE, and it
 * checks them the way a person meets them: at real phone widths, on real
 * screens, through real interactions.
 *
 *   TAP TARGETS      anything interactive under 44x44 is a mis-tap waiting to
 *                    happen — and mis-taps are how a working app feels broken.
 *   SIDEWAYS SCROLL  a page that shifts horizontally on a phone reads as
 *                    broken even when every feature works.
 *   CONTRAST         text below WCAG AA is unreadable in sunlight, which is
 *                    where football gets watched.
 *   RESPONSIVENESS   click -> next paint on real controls. Not page load:
 *                    load is the wrong question for an app you are inside.
 *   EMPTY FRAMES     a screen that renders nothing for N ms after a tap. This
 *                    is the class that fooled me — fast code, blank screen.
 *
 * ⚠️ WHAT THIS CANNOT DO. It runs in a desktop browser. It cannot feel a
 * phone's CPU, its radio, or a real on-screen keyboard. Two of the five fixes
 * shipped on 2026-08-22 are unverifiable here by construction. Treat every
 * timing below as a FLOOR — the best case, on hardware no player has.
 *
 * Usage:  node scripts/experience-audit.mjs [--url http://localhost:8901]
 * Output: docs/experience-audit.json  (+ a summary on stdout)
 */
import { chromium, devices } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv.find((a) => a.startsWith('--url=')) || '').split('=')[1]
  || 'http://localhost:8901';

const MIN_TAP = 44;          // Apple HIG and WCAG 2.5.5 both land here
const AA_NORMAL = 4.5;       // WCAG AA, text under 18.66px
const AA_LARGE = 3.0;        // WCAG AA, large text

// Widths that actually matter: the smallest phone still in use, a common
// Android, and a large iPhone. A layout that survives 320 survives everything.
const VIEWPORTS = [
  { name: 'iPhone SE (320)', width: 320, height: 568 },
  { name: 'Android (360)', width: 360, height: 800 },
  { name: 'iPhone Pro Max (430)', width: 430, height: 932 },
];

const findings = [];
const add = (severity, area, detail, extra = {}) =>
  findings.push({ severity, area, detail, ...extra });

/** Relative luminance per WCAG. */
function lum([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(fg, bg) {
  const a = lum(fg), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
/**
 * Parse to [r,g,b,a]. Alpha is KEPT, and that matters more than it sounds.
 *
 * ⚠️ SECOND FALSE-POSITIVE SOURCE from the first run. The old version dropped
 * alpha unless it was exactly 0, so a background of rgba(255,255,255,0.055) —
 * a 5.5% white sheen over near-black, which this app uses for raised surfaces —
 * was scored as SOLID WHITE. That reported near-white text on white at 1.27:1
 * and called a perfectly readable button unreadable.
 *
 * Translucent layers must be composited over what is behind them, not treated
 * as opaque.
 */
const parseRgba = (s) => {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((n) => parseFloat(n));
  return [p[0], p[1], p[2], p.length >= 4 ? p[3] : 1];
};

/** Composite src over dst (both [r,g,b,a]); returns an opaque [r,g,b]. */
const over = (src, dst) => {
  const a = src[3];
  return [0, 1, 2].map((i) => Math.round(src[i] * a + dst[i] * (1 - a)));
};

async function seed(context) {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('ballIQ_guestMode', 'true');
      localStorage.setItem('biq_onboarded', '1');
      localStorage.setItem('biq_consent_analytics', 'denied');
    } catch { /* private mode */ }
  });
}

/** Every visibly-interactive element, with its box and colours.
 *
 * ⚠️ TWO CORRECTIONS FROM THE FIRST RUN, which produced 6 of 18 findings that
 * were flatly wrong — a 33% false-positive rate, which is how an audit becomes
 * noise nobody reads.
 *
 * 1. CONTRAST MUST BE MEASURED ON THE NODE THAT HOLDS THE TEXT. The first
 *    version read getComputedStyle(container).color. `.tab-item` inherits
 *    color:rgb(0,0,0) while its label lives in a child span at
 *    rgb(255,255,255) — so it reported the tab bar at 1.34:1 ("invisible")
 *    when it is actually white on near-black. Only elements with a DIRECT text
 *    child are scored now.
 *
 * 2. INLINE LINKS IN PROSE ARE EXEMPT from the 44px floor. WCAG 2.5.5 says so
 *    explicitly, and it is the right call: a "tell us" link inside a sentence
 *    cannot be 44px tall without wrecking the paragraph. Only block-level or
 *    genuinely standalone controls are held to it.
 */
const COLLECT = () => {
  const out = [];
  const sel = 'button, a, [role="button"], input, select, textarea, .opt, .play-card, .mode-item, .tab-item';
  const directText = (el) => [...el.childNodes]
    .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('').length > 0;
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
    const inlineInProse = cs.display === 'inline' && el.tagName === 'A';
    // ⚠️ HIT SLOP IS INVISIBLE TO getBoundingClientRect(). A control can be
    // 30x30 on screen and still present a 44x44 touch area via a ::after
    // pseudo-element (see .hit44 in app.css). Without this the audit reports
    // every FIXED control as still broken — which is worse than missing them,
    // because it teaches you to ignore the list.
    const after = getComputedStyle(el, '::after');
    const slop = after && after.content !== 'none'
      ? Math.min(parseFloat(after.minWidth) || 0, parseFloat(after.minHeight) || 0)
      : 0;
    // Collect every background layer up the tree, translucent ones included,
    // stopping at the first opaque one. Compositing happens in node.
    const bgLayers = [];
    for (let node = el, i = 0; node && i < 12; i++, node = node.parentElement) {
      const c = getComputedStyle(node).backgroundColor;
      const m = String(c).match(/rgba?\(([^)]+)\)/);
      if (!m) continue;
      const p = m[1].split(',').map(Number);
      const a = p.length >= 4 ? p[3] : 1;
      if (a === 0) continue;
      bgLayers.push([p[0], p[1], p[2], a]);
      if (a === 1) break;
    }
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().slice(0, 40),
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
      w: Math.round(r.width), h: Math.round(r.height),
      color: cs.color, bgLayers, fontSize: parseFloat(cs.fontSize),
      bold: (parseInt(cs.fontWeight, 10) || 400) >= 700,
      scoreContrast: directText(el),   // see correction 1
      exemptFromTapFloor: inlineInProse, // see correction 2
      slop,                              // 44 when .hit44 (or equivalent) applies
    });
  }
  return out;
};

async function auditViewport(browser, vp, screens) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['iPhone 13'].userAgent,
  });
  await seed(context);
  const page = await context.newPage();

  for (const screen of screens) {
    await page.goto(`${BASE}${screen.path}`, { waitUntil: 'load' }).catch(() => {});
    await page.waitForTimeout(screen.settle ?? 2600);
    if (screen.enter) { try { await screen.enter(page); } catch { /* optional */ } }
    await page.waitForTimeout(600);

    // ── sideways scroll ────────────────────────────────────────────────
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      win: window.innerWidth,
      widest: (() => {
        let worst = null;
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 && (!worst || r.right > worst.right)) {
            worst = { right: Math.round(r.right), tag: el.tagName.toLowerCase(),
                      cls: (el.className || '').toString().slice(0, 40) };
          }
        }
        return worst;
      })(),
    }));
    if (overflow.doc > overflow.win + 1) {
      add('high', 'layout',
        `${screen.name} scrolls sideways at ${vp.width}px (content ${overflow.doc}px)`,
        { viewport: vp.name, screen: screen.name, worst: overflow.widest });
    }

    // ── tap targets + contrast ─────────────────────────────────────────
    const els = await page.evaluate(COLLECT);
    for (const e of els) {
      // A link whose ROW is already 44 tall is a full-width tap target; failing
      // it on width alone is stricter than WCAG asks and produces noise. The
      // footer's About/Terms are 39x44 and 41x44 by deliberate design — the
      // row is tappable, neighbours are 20px apart. Flag only when the control
      // misses the floor on BOTH axes, or is a genuine control (not a link).
      // A control with sufficient hit slop already meets the floor by touch,
      // whatever its painted size.
      if (e.slop >= MIN_TAP) continue;
      const bothAxesShort = e.w < MIN_TAP && e.h < MIN_TAP;
      const isLink = e.tag === 'a';
      if (!e.exemptFromTapFloor && (bothAxesShort || (!isLink && (e.w < MIN_TAP || e.h < MIN_TAP)))) {
        // Sub-44 is only a real problem when it is genuinely tappable; inputs
        // inside a larger tap row are reported once, by the row.
        add('medium', 'tap-target',
          `${e.w}x${e.h}px — "${e.label || e.cls || e.tag}"`,
          { viewport: vp.name, screen: screen.name, min: MIN_TAP });
      }
      const fgRaw = e.scoreContrast ? parseRgba(e.color) : null;
      // Composite bottom-up onto the page ground, then the text onto that.
      let bg = null;
      if (e.bgLayers && e.bgLayers.length) {
        bg = [10, 10, 10];                       // --bg, the app's ground
        for (let i = e.bgLayers.length - 1; i >= 0; i--) bg = over(e.bgLayers[i], [...bg, 1]);
      }
      const fg = fgRaw && bg ? over(fgRaw, [...bg, 1]) : null;
      if (fg && bg) {
        const ratio = contrast(fg, bg);
        const need = (e.fontSize >= 24 || (e.fontSize >= 18.66 && e.bold)) ? AA_LARGE : AA_NORMAL;
        if (ratio < need) {
          add('medium', 'contrast',
            `${ratio.toFixed(2)}:1 (needs ${need}) — "${e.label || e.cls}" ${e.fontSize}px`,
            { viewport: vp.name, screen: screen.name });
        }
      }
    }
  }
  await context.close();
}

/** Click-to-paint on real controls, plus how long the screen stays EMPTY. */
async function auditResponsiveness(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    userAgent: devices['iPhone 13'].userAgent,
  });
  await seed(context);
  const page = await context.newPage();
  await page.goto(`${BASE}/play`, { waitUntil: 'load' });
  await page.waitForTimeout(3200);

  const timings = [];
  const tabs = await page.$$('.tab-item');
  for (let round = 0; round < 3; round++) {
    for (const t of tabs) {
      const name = (await t.textContent())?.trim() || '?';
      const ms = await page.evaluate((el) => new Promise((res) => {
        const t0 = performance.now();
        el.click();
        requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t0)));
      }), t);
      // ⚠️ THE CHECK THAT WOULD HAVE CAUGHT THE ONLINE TAB. A pane can paint
      // in one frame and still be BLANK because its lazy chunk has not landed.
      const emptyMs = await page.evaluate(() => new Promise((res) => {
        const t0 = performance.now();
        const tick = () => {
          const pane = [...document.querySelectorAll('.tab-pane')]
            .find((p) => getComputedStyle(p).display !== 'none');
          const filled = pane && (pane.textContent || '').trim().length > 20;
          if (filled || performance.now() - t0 > 2500) res(Math.round(performance.now() - t0));
          else requestAnimationFrame(tick);
        };
        tick();
      }));
      timings.push({ control: `tab:${name}`, paintMs: +ms.toFixed(1), emptyMs });
      await page.waitForTimeout(220);
    }
  }
  await context.close();

  const byControl = {};
  for (const t of timings) (byControl[t.control] ||= []).push(t);
  for (const [control, runs] of Object.entries(byControl)) {
    const med = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    const paint = med(runs.map((r) => r.paintMs));
    const empty = med(runs.map((r) => r.emptyMs));
    if (empty > 120) {
      add('high', 'responsiveness',
        `${control} shows an EMPTY pane for ~${empty}ms after the tap (paint ${paint}ms)`,
        { note: 'a lazy chunk is loading; paint speed is not the problem' });
    }
  }
  return byControl;
}

// ── run ────────────────────────────────────────────────────────────────────
const browser = await chromium.launch();

const SCREENS = [
  { name: 'Home', path: '/play' },
  { name: 'Club page (Arsenal)', path: '/quiz/arsenal/' },
  { name: 'Mystery Player', path: '/play', enter: async (p) => {
      const c = await p.$('.play-card:has-text("Mystery Player")'); if (c) await c.click();
    } },
  { name: 'Transfer Trail', path: '/play', enter: async (p) => {
      const c = await p.$('.play-card:has-text("Transfer Trail")'); if (c) await c.click();
    } },
];

for (const vp of VIEWPORTS) await auditViewport(browser, vp, SCREENS);
const responsiveness = await auditResponsiveness(browser);
await browser.close();

// ── report ─────────────────────────────────────────────────────────────────
// Dedupe: the same tiny control on three viewports is ONE problem, not three.
const seen = new Map();
for (const f of findings) {
  const key = `${f.area}|${f.detail.replace(/\d+x\d+px/, '')}|${f.screen || ''}`;
  if (!seen.has(key)) seen.set(key, { ...f, viewports: [f.viewport] });
  else if (f.viewport && !seen.get(key).viewports.includes(f.viewport)) seen.get(key).viewports.push(f.viewport);
}
const deduped = [...seen.values()];
const order = { high: 0, medium: 1, low: 2 };
deduped.sort((a, b) => order[a.severity] - order[b.severity]);

mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs/experience-audit.json'),
  JSON.stringify({ base: BASE, responsiveness, findings: deduped }, null, 2));

const counts = deduped.reduce((a, f) => ({ ...a, [f.area]: (a[f.area] || 0) + 1 }), {});
console.log(`\nExperience audit — ${deduped.length} finding(s)\n`);
console.log('  by area:', Object.entries(counts).map(([k, v]) => `${k}:${v}`).join('  ') || 'none');
console.log('\n  responsiveness (median, desktop = FLOOR not real-world):');
for (const [c, runs] of Object.entries(responsiveness)) {
  const med = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  console.log(`    ${c.padEnd(16)} paint ${String(med(runs.map(r => r.paintMs))).padStart(6)}ms   empty ${med(runs.map(r => r.emptyMs))}ms`);
}
console.log('\n  top findings:');
for (const f of deduped.slice(0, 18)) {
  console.log(`    [${f.severity}] ${f.area}: ${f.detail}${f.screen ? `  (${f.screen})` : ''}`);
}
console.log(`\n  full report → docs/experience-audit.json\n`);
