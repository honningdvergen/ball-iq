// probe-doubletap.mjs — is a double-tap on "Next" a SCORING bug?
//
// Hypothesis from CLARITY-FINDINGS: answering expands the card, so a user's
// second tap (impatience, or the first tap feeling unregistered) lands where
// the NEXT question has already drawn an option button — recording an answer
// they never chose. "Next →" = 176 dead clicks, 149 of them in /play.
//
//   node scripts/probe-doubletap.mjs [--local]
//
// The decisive measurement is not "did the layout move". It is: at the exact
// screen point "Next" occupied, what element sits there once the next question
// has rendered, and is it a LIVE option?
//
// Two surfaces are tested because they are different components:
//   1. onboarding sample question (.onboard-sample-opt) — what 97.3% of our
//      traffic, being new, actually meets first
//   2. the real quiz (.opt) — where Clarity counted the 149

import { chromium } from 'playwright';

const LOCAL = process.argv.includes('--local');
const BASE = LOCAL ? 'http://localhost:8899' : 'https://balliq.app';

const br = await chromium.launch();
const ctx = await br.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
});
const page = await ctx.newPage();

// What is at (x,y), and would tapping it register an answer?
const at = (x, y) => page.evaluate(({ x, y }) => {
  const el = document.elementFromPoint(x, y);
  if (!el) return { hit: 'nothing' };
  const btn = el.closest('button,a');
  const isOpt = !!el.closest('.opt,.onboard-sample-opt,.to');
  return {
    hit: btn ? btn.tagName + '.' + String(btn.className || '').trim().split(/\s+/)[0] : el.tagName,
    text: (btn?.textContent || el.textContent || '').trim().slice(0, 34),
    isOption: isOpt,
    disabled: btn ? btn.disabled === true : null,
    isNext: btn ? /next|finish|neste/i.test(btn.textContent || '') : false,
  };
}, { x, y });

const box = (sel, textRe) => page.evaluate(({ sel, textRe }) => {
  const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null
    && (!textRe || new RegExp(textRe, 'i').test((e.textContent || '').trim())));
  if (!els.length) return null;
  const r = els[0].getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), top: Math.round(r.y), h: Math.round(r.height) };
}, { sel, textRe });

const report = (surface, v) => {
  console.log(`\n─── ${surface}: the point "Next" occupied now holds`);
  console.log(`    ${v.hit} "${v.text}"  ·  option=${v.isOption} disabled=${v.disabled} isNext=${v.isNext}`);
  if (v.isOption && v.disabled === false) {
    console.log('    🔴 SCORING BUG — a live option sits under the finger.');
    return 'BUG';
  }
  if (v.isOption) { console.log('    🟡 Option, but DISABLED — dead click, no answer recorded.'); return 'DEAD'; }
  if (v.isNext) { console.log('    🟢 Still the advance button — double-tap just advances.'); return 'OK'; }
  console.log('    🟢 No option there — not a scoring bug.');
  return 'OK';
};

console.log(`\nviewport 390x844 · ${BASE}/play`);
await page.goto(`${BASE}/play`, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1800);

// ── surface 1: onboarding sample question ───────────────────────────────────
const results = {};
let opt = await box('.onboard-sample-opt');
if (opt) {
  const h0 = await page.evaluate(() => document.body.scrollHeight);
  await page.evaluate(() => document.querySelector('.onboard-sample-opt').click());
  await page.waitForTimeout(800);
  const h1 = await page.evaluate(() => document.body.scrollHeight);
  const next = await box('.onboard-btn', 'next');
  console.log(`\nonboarding: answered · page ${h0}px → ${h1}px (${h1 - h0 >= 0 ? '+' : ''}${h1 - h0})`);
  if (next) {
    console.log(`  "Next" centre x=${next.x} y=${next.y}`);
    await page.mouse.click(next.x, next.y);
    await page.waitForTimeout(800);
    results.onboarding = report('ONBOARDING', await at(next.x, next.y));
  }
}

// ── get through the rest of onboarding into the app ─────────────────────────
for (let i = 0; i < 4; i++) {
  const done = await page.evaluate(() => {
    const skill = document.querySelector('.onboard-skill');
    if (skill && skill.offsetParent !== null) { skill.click(); return 'skill'; }
    const fin = [...document.querySelectorAll('.onboard-btn, .onboard-skip')]
      .find((b) => b.offsetParent !== null && /finish|skip|next/i.test(b.textContent || ''));
    if (fin) { fin.click(); return fin.textContent.trim(); }
    return null;
  });
  if (!done) break;
  await page.waitForTimeout(700);
}
await page.waitForTimeout(1200);

// ── surface 2: the real quiz ────────────────────────────────────────────────
for (let i = 0; i < 5; i++) {
  if (await box('.opt')) break;
  const clicked = await page.evaluate(() => {
    const c = [...document.querySelectorAll('button,a')].filter((b) => b.offsetParent !== null)
      .find((b) => /^(classic|quick play|play|start)/i.test((b.textContent || '').trim()));
    if (c) { c.click(); return c.textContent.trim().slice(0, 26); }
    return null;
  });
  if (!clicked) break;
  console.log('  → entered:', clicked);
  await page.waitForTimeout(1400);
}

const qopt = await box('.opt');
if (!qopt) {
  console.log('\nCould not reach a real quiz question automatically.');
  console.log('Visible:', (await page.evaluate(() => document.body.innerText.slice(0, 200))).replace(/\n+/g, ' | '));
} else {
  const h0 = await page.evaluate(() => document.body.scrollHeight);
  const ys0 = await page.evaluate(() => [...document.querySelectorAll('.opt')].map((o) => Math.round(o.getBoundingClientRect().y)));
  await page.evaluate(() => document.querySelector('.opt').click());
  await page.waitForTimeout(900);
  const h1 = await page.evaluate(() => document.body.scrollHeight);
  console.log(`\nreal quiz: options at y ${ys0.join(',')} · page ${h0}px → ${h1}px (${h1 - h0 >= 0 ? '+' : ''}${h1 - h0})`);
  const next = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button,a')].filter((e) => e.offsetParent !== null)
      .find((e) => /next/i.test((e.textContent || '').trim()));
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (!next) { console.log('  no "Next" control found after answering'); }
  else {
    console.log(`  "Next →" centre x=${next.x} y=${next.y}`);
    await page.mouse.click(next.x, next.y);
    await page.waitForTimeout(800);
    results.quiz = report('REAL QUIZ', await at(next.x, next.y));
  }
}

console.log('\n═══ SUMMARY', JSON.stringify(results));
await br.close();
