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
// ⚠️ DERIVE THE DAILY ANSWER IN NODE, NOT IN THE PAGE.
// The first version did `import('/src/lib/wordle.js')` inside the browser —
// that path only exists in dev, so against a BUILT bundle it threw, the answer
// came back null, the typing loop was skipped, and the shot shipped an empty
// board. The screen assertion still passed, because the screen was Footle.
import { getWordleAnswer } from '../src/lib/wordle.js';
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
// Subjects that are fine in a quiz and wrong on a storefront.
const SENSITIVE = /disaster|died|death|deaths|killed|tragedy|crash|fire|riot|stadium collapse|munich air|hillsborough|heysel|bradford|ibrox|superga/i;

const SHOTS = [
  { name: '01-home',           expect: 'More modes',   go: async (p) => {} },
  { name: '03-club-picker',    expect: 'Club Quizzes', go: async (p) => {
      await p.getByText('Club Quiz', { exact: true }).first().click(); } },
  // ⚠️ HIDE THE GUEST UPSELL. The capture runs as a guest (no way to sign in
  // headlessly), so Profile opens with a full-width "Save your progress /
  // Sign in / Create account" card above the rating — the largest element on
  // the screen. As a store shot it says "you are not signed in" before it says
  // anything about the app. Suppressing it shows exactly what a real signed-in
  // user sees, which is what the listing is advertising.
  { name: '06-profile',        expect: 'Ball IQ rating', settle: true, go: async (p) => {
      await p.getByText('Profile', { exact: true }).last().click();
      await p.waitForTimeout(1200);
      await p.evaluate(() => {
        // ⚠️ MATCH EXACTLY, NOT startsWith. querySelectorAll returns DOCUMENT
        // ORDER, so ancestors come before descendants — and the banner is the
        // first thing in the profile container, which makes the container's
        // own textContent start with the same string. A startsWith+find hid
        // the entire screen. The screen assertion is what caught it.
        const title = [...document.querySelectorAll('div')]
          .find((d) => (d.textContent || '').trim() === '🌟 Save your progress');
        if (title?.parentElement) title.parentElement.style.display = 'none';
      });
      await p.waitForTimeout(400); } },
  { name: '04-transfer-trail', expect: 'Transfer Trail', go: async (p) => {
      await p.getByText('Transfer Trail', { exact: true }).first().click(); } },

  // ⚠️ A SOLVED BOARD, NOT AN EMPTY ONE. An empty grid shows the format; a
  // solved one shows the payoff. The daily answer is read FROM THE APP rather
  // than hard-coded, because it rotates — a pinned surname would silently start
  // producing a losing board the next day.
  { name: '02-footle', expect: 'Footle',
    // The screen check is not enough here — assert the BOARD actually filled.
    verify: async (p) => (await p.evaluate(() =>
      [...document.querySelectorAll('.wd-tile')].filter((t) => (t.textContent || '').trim()).length)) >= 15,
    go: async (p) => {
      const answer = getWordleAnswer();
      await p.getByText('Play', { exact: true }).first().click();
      await p.waitForTimeout(1800);
      if (answer) {
        // ⚠️ FILL ~5 ROWS. Two guesses proves nothing: the whole point of the
        // screenshot is to TEACH the mechanic at a glance — greens locking in,
        // ambers moving, the answer arriving on the last row. A near-empty
        // board just looks like an unfinished game.
        const A = answer.toUpperCase(), n = A.length;
        const pool = 'AEIOURSTLNMB';
        const decoys = [];
        for (let r = 0; r < 4; r++) {
          // Each row reveals a little more: keep r+1 real letters in place and
          // fill the rest, so the colours visibly converge on the answer.
          let g = '';
          for (let i = 0; i < n; i++) g += (i <= r) ? A[i] : pool[(i * 3 + r * 5) % pool.length];
          decoys.push(g);
        }
        for (const g of [...decoys, A]) {
          await p.keyboard.type(g);
          await p.getByText('ENTER', { exact: true }).first().click();
          await p.waitForTimeout(1150);
        }
      }
      await p.waitForTimeout(1200); } },

  // ⚠️ MUST BE A CORRECT ANSWER. The first attempt at this shot captured a red
  // "Incorrect" — technically the app working, useless as an advert. Options are
  // shuffled per game, so the only reliable way is to answer, check, and move on
  // to the next question if it was wrong.
  { name: '05-quiz-explanation', expect: 'Why?', go: async (p) => {
      await p.goto(BASE + '/play?club=liverpool', { waitUntil: 'networkidle' });
      await p.waitForTimeout(3800);
      for (let attempt = 0; attempt < 10; attempt++) {
        const opts = p.locator('.opt');
        if (!(await opts.count())) break;
        const stem = await p.evaluate(() => document.querySelector('.qd-q, .q, h2')?.textContent || '');
        // ⚠️ A CORRECT ANSWER IS NOT ENOUGH — the SUBJECT has to be right too.
        // The first clean capture landed on the Heysel Stadium disaster: 39
        // people died. Perfectly good football history inside a quiz, grim as
        // the shop window of an App Store listing. Skip anything that would
        // read badly as an advert.
        if (SENSITIVE.test(stem)) {
          const skip = p.getByText(/^Next/).first();
          await opts.first().click(); await p.waitForTimeout(900);
          if (await skip.count()) { await skip.click(); await p.waitForTimeout(1500); }
          continue;
        }
        await opts.nth(attempt % 4).click();
        await p.waitForTimeout(1100);
        const t = await p.evaluate(() => document.body.innerText);
        if (/Correct!/i.test(t) && !/Incorrect/i.test(t)) return;   // got one
        const next = p.getByText(/^Next/).first();
        if (await next.count()) { await next.click(); await p.waitForTimeout(1500); }
      } } },
];


// ⚠️ DO NOT LET THE VIEWPORT SLICE A CARD IN HALF.
// A store screenshot that ends mid-card ("Classic / 10 Qs, 20s ea…") reads as a
// broken layout rather than a scrollable list. This nudges the scroll so a real
// card boundary lands just above the tab bar, which makes the cut look chosen.
async function settleScroll(p, tabH = 96) {
  await p.evaluate((tab) => {
    const vh = window.innerHeight;
    // ⚠️ MATCH CARDS STRUCTURALLY, NOT ONLY BY CLASS. Half the profile screen
    // is built from inline-styled divs with no class at all (the Scouting
    // Report rows), so a class list found no boundary there and the shot cut
    // mid-row with text bleeding through the translucent tab bar. A rounded
    // corner is what actually makes something a card, so read for that.
    const els = [...document.querySelectorAll('.play-card,.mode-item,.hr-card,.tr-card,section,.pd-rating,div')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        if (r.height < 40 || r.width < 120) return false;
        if (e.matches('.play-card,.mode-item,.hr-card,.tr-card,section,.pd-rating')) return true;
        return parseFloat(getComputedStyle(e).borderTopLeftRadius) >= 12;
      });
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
// ⚠️ DERIVED FROM THE FRAME, not chosen. frame-store-screens.mjs renders at
// 1284x2778 (the 6.5" size this listing actually uses — there is no 6.9" slot)
// and leaves an 875x1739 image area inside the device, an aspect of 1.9874.
// Capturing at any other height means the framer has to crop, and it crops the
// BOTTOM — which is exactly where the tab bar lives. The framer PRINTS the
// number it needs on every run; copy it here if the geometry changes.
const CAPTURE_H = 874;
const ctx = await b.newContext({ viewport: { width: 440, height: CAPTURE_H }, deviceScaleFactor: 3 });
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
  let ok = txt.toLowerCase().includes(s.expect.toLowerCase());
  // A shot may also assert on STATE, not just which screen it landed on.
  if (ok && s.verify) ok = await s.verify(p).catch(() => false);
  if (!ok) bad++;
  await p.screenshot({ path: `${RAW}/${s.name}.png` });
  console.log(`  ${ok ? '✓' : '✗ WRONG SCREEN —'} ${s.name}  (looked for "${s.expect}")`);
  await p.close();
}
if (bad) console.log(`\n  ${bad} shot(s) captured the wrong screen — do not ship these.`);
await b.close();
console.log(`\nraw frames -> ${RAW}`);
