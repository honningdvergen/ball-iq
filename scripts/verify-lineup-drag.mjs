// verify-lineup-drag.mjs — regression test for drag-to-swap on /lineup/
//
//   (serve public/ on :8899, then) node scripts/verify-lineup-drag.mjs
//
// ⚠️ USES SYNTHETIC PointerEvents, NOT page.mouse. Playwright's WebKit coalesces
// synthetic mouse moves so hard that it delivered 2 of 12 — the drag threshold
// was never crossed in a delivered event, and the harness reported "drag is
// broken" three times while the feature worked. Dispatching the events directly
// tests OUR logic instead of the driver's input timing.
//
// ⚠️ This proves the LOGIC. Real trackpad and touch behaviour still wants a
// human check; real input fires at ~60Hz, far denser than the driver managed.
import { webkit } from '@playwright/test';
const b = await webkit.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('pageerror', e => console.log('PAGEERROR:', e.message));
await p.goto('http://localhost:8899/lineup/#f=4-3-3&p=0-0-0-0-0-0-0-0-0-0-0', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
for (const i of [8, 9]) {
  await p.locator('.slot').nth(i).click(); await p.waitForTimeout(250);
  await p.locator('.opt').first().click(); await p.waitForTimeout(350);
}
const out = await p.evaluate(async () => {
  const slots = document.querySelectorAll('.slot');
  const r8 = slots[8].getBoundingClientRect(), r9 = slots[9].getBoundingClientRect();
  const at = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse',
    clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
  const before = [...document.querySelectorAll('.nm')].map(n => n.textContent);
  at(slots[8], 'pointerdown', r8.left + r8.width/2, r8.top + r8.height/2);
  at(window,   'pointermove', r8.left + r8.width/2 + 30, r8.top + r8.height/2);
  const ghost = !!document.querySelector('.ghost');
  at(window,   'pointermove', r9.left + r9.width/2, r9.top + r9.height/2);
  const over = !!document.querySelector('.slot.over');
  at(window,   'pointerup',   r9.left + r9.width/2, r9.top + r9.height/2);
  await new Promise(r => setTimeout(r, 300));
  const after = [...document.querySelectorAll('.nm')].map(n => n.textContent);
  return { before, after, ghost, over, swapped: before[0] === after[1] && before[1] === after[0] };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
