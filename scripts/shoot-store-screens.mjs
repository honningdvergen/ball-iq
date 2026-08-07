// shoot-store-screens.mjs — App Store screenshots, captured and framed.
//
//   npx vite preview --port 4324 --strictPort &
//   node scripts/shoot-store-screens.mjs
//
// ⚠️ WHY THE BROWSER AND NOT THE SIMULATOR.
// The screens that sell the app need a PLAYED-IN account — an empty profile
// reading "No stats yet" is the worst possible store shot. Seeding that on the
// simulator means writing WKWebView's localStorage inside the app container,
// with the app closed, and hoping. Playwright's WEBKIT is the same engine as
// WKWebView, takes localStorage in one line, and at 440x956 @3x produces
// 1320x2868 — pixel-identical to an iPhone 17 Pro Max capture.
//
// ⚠️ THE RATING IS COMPUTED, NOT FAKED. The card is driven by
// computeCard(catStats, accuracy) in src/lib/ballIqCard.js:
//     rating = 40 + 59 * (correct + 2*prior) / (answered + 2)
// so the numbers below were solved BACKWARDS from a target overall of 82 and
// then verified through the real function. Hard-coding "82" into the DOM would
// have produced a card whose six sub-ratings do not average to their own
// overall — the kind of detail a screenshot makes permanent.
import { webkit } from '@playwright/test';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE = process.env.BASE || 'http://localhost:4324';
const RAW = resolve('screenshots/raw');
mkdirSync(RAW, { recursive: true });

// Solved for OVERALL 82 (>=80 = elite, the gold card). Spread is deliberately
// uneven — a real player is better at the league they watch.
//   EPL 88 · UCL 85 · LAL 83 · SEA 82 · INT 79 · BUN 76
const SEED_STATS = {
  gamesPlayed: 46,
  bestScore: 10,
  bestStreak: 14,
  totalCorrect: 287,
  totalAnswered: 385,
  catStats: {
    PL:         { c: 114, a: 140 },
    UCL:        { c: 58,  a: 76  },
    WorldCup:   { c: 36,  a: 54  },
    LaLiga:     { c: 35,  a: 48  },
    Bundesliga: { c: 18,  a: 30  },
    SerieA:     { c: 26,  a: 37  },
  },
};

// ⚠️ NAVIGATE BY CLICKING, AND ASSERT ON SCREEN-SPECIFIC TEXT.
// The first version used invented query params (?tab=profile, ?screen=club-quiz).
// They do not route, so every shot silently captured Home — and the "is it
// empty?" check passed all of them, because Home is not empty. A capture script
// that cannot tell WHICH screen it captured is worse than none: it produces
// four plausible files and a false sense of completion. Each entry now names a
// string that ONLY appears on its own screen.
// ⚠️ `settle` IS OPT-IN, AND MOST SCREENS MUST NOT USE IT.
// Auto-scrolling to align a card boundary with the tab bar sounds universally
// good and is not: on Home it optimised the BOTTOM edge and sliced the greeting
// and streak chip off the TOP, which is the most valuable thing on that screen.
// A grid running past the fold is honest — it is what a phone actually shows,
// and it signals there is more. Only settle where the bottom edge is the
// problem and nothing above it matters.
const SHOTS = [
  { name: '01-home',           expect: 'More modes',   go: async (p) => {} },
  { name: '03-club-picker',    expect: 'Club Quizzes', go: async (p) => {
      await p.getByText('Club Quiz', { exact: true }).first().click(); } },
  { name: '06-profile',        expect: 'Ball IQ rating', settle: true, go: async (p) => {
      await p.getByText('Profile', { exact: true }).last().click();
      await p.waitForTimeout(1200); } },
  { name: '04-transfer-trail', expect: 'Transfer Trail', go: async (p) => {
      await p.getByText('Transfer Trail', { exact: true }).first().click(); } },
];


// ⚠️ DO NOT LET THE VIEWPORT SLICE A CARD IN HALF.
// A store screenshot that ends mid-card ("Classic / 10 Qs, 20s ea…") reads as a
// broken layout rather than a scrollable list. This nudges the scroll so a real
// card boundary lands just above the tab bar, which makes the cut look chosen.
async function settleScroll(p, tabH = 96) {
  await p.evaluate((tab) => {
    const vh = window.innerHeight;
    const els = [...document.querySelectorAll('.play-card,.mode-item,.hr-card,.tr-card,section,.pd-rating')]
      .filter((e) => e.getBoundingClientRect().height > 40);
    if (!els.length) return;
    const y = window.scrollY;
    const bottoms = els.map((e) => e.getBoundingClientRect().bottom + y);
    const target = y + vh - tab;
    let best = null, bd = Infinity;
    for (const bm of bottoms) { const d = Math.abs(bm - target); if (d < bd) { bd = d; best = bm; } }
    if (best == null || bd > vh * 0.45) return;   // nothing sensible nearby: leave it
    window.scrollBy(0, best - target + 12);
  }, tabH);
}

const b = await webkit.launch();
const ctx = await b.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
await ctx.addInitScript((stats) => {
  localStorage.setItem('biq_onboarded', '1');
  // The green "Welcome to Ball IQ!" tip is a SEPARATE flag from onboarding
  // and reappears on every fresh profile — it covered the greeting in the
  // first framed pass.
  localStorage.setItem('biq_first_tip_shown', '1');
  localStorage.setItem('biq_rate_shown', '1');
  localStorage.setItem('ballIQ_guestMode', '1');
  localStorage.setItem('biq_stats', JSON.stringify(stats));
  localStorage.setItem('biq_profile', JSON.stringify({ name: 'Alex' }));
  // ⚠️ shape is { streak, lastDay, best } — NOT { count }. The first attempt
  // used `count` and the card silently showed a 1-day streak, because the
  // reader defaults to 0 when `streak` is not a number. lastDay must be
  // TODAY or the streak is treated as broken.
  localStorage.setItem('biq_login_streak', JSON.stringify({
    streak: 9, best: 14, lastDay: Math.floor(Date.now() / 86400000),
  }));
  localStorage.setItem('biq_xp', '1840');
}, SEED_STATS);

let bad = 0;
for (const s of SHOTS) {
  const p = await ctx.newPage();
  await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3800);
  try { await s.go(p); } catch (e) { console.log(`  ! ${s.name}: navigation click failed — ${e.message.split('\n')[0]}`); }
  await p.waitForTimeout(2600);
  if (s.settle) { await settleScroll(p); await p.waitForTimeout(500); }
  const txt = await p.evaluate(() => document.body.innerText);
  // case-insensitive: WebKit's innerText applies text-transform, so a label
  // authored as "Ball IQ rating" reads back as "BALL IQ RATING".
  const ok = txt.toLowerCase().includes(s.expect.toLowerCase());
  if (!ok) bad++;
  await p.screenshot({ path: `${RAW}/${s.name}.png` });
  console.log(`  ${ok ? '✓' : '✗ WRONG SCREEN —'} ${s.name}  (looked for "${s.expect}")`);
  await p.close();
}
if (bad) console.log(`\n  ${bad} shot(s) captured the wrong screen — do not ship these.`);
await b.close();
console.log(`\nraw frames -> ${RAW}`);
