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
import { getWordleAnswer, gradeWordleGuess } from '../src/lib/wordle.js';
import { pickDailyQuestions } from '../src/lib/quiz.js';
import { dayIndexForDate } from '../src/lib/date.js';
import { QB } from '../src/questions.js';
// Same rule as the Footle answer above: derive in NODE. The Mystery and Trail
// answers ROTATE daily, so a pinned name would silently start producing a
// LOSING board — the shot would still pass its screen assertion and ship a
// failure as marketing.
import { getTrailAnswer } from '../src/lib/trail.js';
import { answerIdForDay, mysteryDayIndex, matchGuess } from '../src/lib/mysteryPlayer.js';
import MYSTERY_SCHEDULE from '../src/data/mysterySchedule.json' with { type: 'json' };
import MYSTERY_POOL from '../src/data/mysteryPool.json' with { type: 'json' };
import MYSTERY_ANSWERS from '../src/data/mysteryAnswers.json' with { type: 'json' };
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

/**
 * Four losing Footle guesses that look like somebody actually played.
 *
 * ⚠️ THIS REPLACES A GENERATOR THAT PRODUCED AN OBVIOUSLY FAKE BOARD, and the
 * failure is worth keeping written down because it passed every check we had.
 * The old rows were built as:
 *     g += (i <= r) ? A[i] : pool[(i * 3 + r * 5) % pool.length]
 * i.e. row r keeps the answer's FIRST r+1 letters IN PLACE and pads the rest
 * from a fixed alphabet. Against ALONSO that shipped, in order:
 *     AOSNAO · ALBIRL · ALOTME · ALONOS · ALONSO
 * Three greens on guess one, "ALO" spelled out by guess three, and not one of
 * the four is a real word, let alone a footballer. Alex's read: "really dumb
 * and easy, you almost wrote the right name in the first couple then got
 * dumber". The board verified fine (≥15 filled tiles) and the screen assertion
 * passed — nothing mechanical can catch "this looks staged", so the shape has
 * to be correct by construction.
 *
 * What makes a board look real:
 *   1. Every guess is a REAL footballer's surname. submitGuess() checks LENGTH
 *      ONLY (App.jsx), so any same-length string is legal — we are free to use
 *      the 9k mystery pool rather than Footle's own 406-name answer list, which
 *      is far too small to furnish a ladder at most word lengths.
 *   2. NO GREENS in the first two rows. A green on guess one is the single
 *      biggest tell; it reads as someone who already knew the answer.
 *   3. Information increases monotonically — letters found, then positions.
 *   4. Recognisable names. Fame-sorted, so a fan reads Neymar/Rooney, not a
 *      third-tier defender who happens to fit.
 *
 * Derived from the answer every run, never pinned: the answer rotates at
 * midnight and a hard-coded ladder would silently start producing a LOSING
 * board — the exact trap already documented for the Mystery and Trail shots.
 */
function footleLadder(answer) {
  const n = answer.length;
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const best = new Map();
  for (const p of MYSTERY_POOL) {
    if (!p?.name || (p.fame || 0) < 40) continue;
    const parts = norm(p.name).split(/[\s'-]+/).filter(Boolean);
    const sur = parts[parts.length - 1];
    if (sur.length !== n || !/^[A-Z]+$/.test(sur) || sur === answer) continue;
    if ((best.get(sur)?.fame ?? -1) < (p.fame || 0)) best.set(sur, { sur, fame: p.fame || 0 });
  }
  const cands = [...best.values()].sort((a, b) => b.fame - a.fame);
  const score = (g) => {
    const r = gradeWordleGuess(g, answer);
    return { G: r.filter((x) => x === 'green').length, K: r.filter((x) => x !== 'grey').length };
  };
  // Each rung: [minGreens, maxGreens, minKnown, maxKnown]. Widening fallbacks
  // matter — at n=4 or n=9 the pool thins out and a rung can come up empty.
  const rungs = [[0, 0, 1, 2], [0, 0, 3, 4], [1, 2, 3, n - 1], [3, 4, 3, n - 1]];
  const used = new Set();
  const out = [];
  for (const [gMin, gMax, kMin, kMax] of rungs) {
    const pick = cands.find((c) => {
      if (used.has(c.sur)) return false;
      const { G, K } = score(c.sur);
      return G >= gMin && G <= gMax && K >= kMin && K <= kMax;
    })
      // Fallback: nothing in band — take the closest thing that still is not a
      // giveaway, rather than dropping a row and shipping a 3-row board.
      || cands.find((c) => !used.has(c.sur) && score(c.sur).G <= gMax);
    if (pick) { used.add(pick.sur); out.push(pick.sur); }
  }
  return out;
}

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
  // ⚠️ WIN ON THE LAST ATTEMPT, NOT THE FIRST. Alex, 2026-08-15: solve it "on
  // the fifth or sixth so people understand how they work". An instant win
  // teaches nothing — the ladder of revealed clubs IS the mechanic, and only a
  // late win shows it. TRAIL_MAX_ATTEMPTS is 5, so five is the ceiling here:
  // four misses (each revealing another club) then the name.
  { name: '04-transfer-trail', expect: 'Transfer Trail',
    // Assert the WIN actually happened. The screen check alone would happily
    // ship a lost board, which is the same class of miss as the empty Footle
    // grid that shipped before the board assertion existed.
    verify: async (p) => (await p.evaluate(() => /Got it|Solved|Nice/i.test(document.body.innerText))),
    go: async (p) => {
      await p.getByText('Transfer Trail', { exact: true }).first().click();
      await p.waitForTimeout(1400);
      const t = getTrailAnswer(new Date());
      const answer = t ? t.display.join(' ') : null;
      if (!answer) return;
      const decoys = ['Toni Kroos', 'İlkay Gündoğan', 'Leon Goretzka', 'Thomas Müller']
        .filter((n) => n.toLowerCase() !== answer.toLowerCase());
      for (const g of [...decoys.slice(0, 4), answer]) {
        // ⚠️ BY aria-label, NOT BY PLACEHOLDER. This read
        // getByPlaceholder('Type a surname…') and broke the moment that copy
        // changed (2026-08-24: the Footle "surname" sweep renamed it to "Type a
        // player's name…", because Trail answers include mononyms and
        // native-order names like Son Heung-min). The shot then captured the
        // WRONG SCREEN and only the screen assertion caught it. Marketing
        // capture must not be coupled to user-facing wording — the aria-label
        // is the stable contract, and it is also what a screen reader uses.
        await p.getByLabel('Your guess').fill(g);
        await p.waitForTimeout(250);
        await p.getByText('Guess', { exact: true }).first().click();
        await p.waitForTimeout(900);
      }
      await p.waitForTimeout(1200); } },

  // Mystery is unlimited-guess, so this one lands on the SIXTH. The decoys are
  // all keepers when the answer is a keeper: guessing the same position returns
  // low ranks, and the ladder of near-misses narrowing toward 1 is exactly the
  // thing a still image has to explain about a Contexto-style game.
  { name: '07-mystery-player', expect: 'Mystery Player',
    verify: async (p) => (await p.evaluate(() => /Got it|Solved|rank 1|#1\b/i.test(document.body.innerText))),
    go: async (p) => {
      await p.getByText('Mystery Player', { exact: true }).first().click();
      await p.waitForTimeout(1400);
      const id = answerIdForDay(MYSTERY_SCHEDULE, mysteryDayIndex());
      const ans = MYSTERY_POOL.find((x) => x.id === id);
      if (!ans) return;
      /* ⚠️ DECOYS COME FROM THE CURATED ANSWER POOL, NOT THE GUESS POOL.
         First run drew "same slot, fame >= 55" straight from the guess pool and
         put NIELS BOHR in an App Store screenshot — he really did keep goal for
         Akademisk Boldklub, so he is a legitimate GUESS, but a physicist in the
         shot makes the app look broken. mysteryAnswers.json is the hand-curated
         set of players a median fan can name, which is exactly the bar a
         marketing image has to clear. */
      const answerIds = new Set(Array.isArray(MYSTERY_ANSWERS)
        ? MYSTERY_ANSWERS
        : (MYSTERY_ANSWERS.answers || Object.values(MYSTERY_ANSWERS).find(Array.isArray) || []));
      const sameSlot = MYSTERY_POOL
        .filter((x) => answerIds.has(x.id) && x.slot === ans.slot && x.id !== ans.id)
        .sort((a, b) => b.fame - a.fame).slice(0, 5).map((x) => x.name);
      for (const g of [...sameSlot, ans.name]) {
        if (!matchGuess(MYSTERY_POOL, g)) continue;
        await p.getByPlaceholder('Search a player').fill(g);
        await p.waitForTimeout(400);
        // Tap the ranked suggestion rather than pressing Enter — it is the real
        // path a player takes now that the autocomplete exists.
        const opt = p.getByText(g, { exact: true }).last();
        if (await opt.count()) { await opt.click(); } else { await p.keyboard.press('Enter'); }
        await p.waitForTimeout(800);
      }
      await p.waitForTimeout(1200); } },

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
        const A = answer.toUpperCase();
        for (const g of [...footleLadder(A), A]) {
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

  /* ⚠️ STOPS ON THE LAST QUESTION, DELIBERATELY. Alex, 2026-08-15: "would be
     nice to show off those new green and red chips on daily 7."

     Two constraints fought here and this frame settles both. Answering blindly
     gave "1 correct out of 7 — Everyone starts somewhere", a dreadful advert;
     a flawless 7/7 is one colour and teaches nothing. So five right, two wrong
     — and the PROGRESS BAR then reads green·green·red·green·green·red·green,
     which is the chip run itself, above a live question showing "✓ Correct!"
     and the running 5 ✓ 7/7.

     Going one tap further to the results page was tried and abandoned:
     finishing the daily as a GUEST raises the "Save your progress" auth sheet,
     and it appears AFTER the screen assertion runs — the check went green
     while the captured frame was the sign-up sheet. Rather than fight a modal
     for a denser, less legible screen, this stops on the question.

     ⚠️ ANSWERS ARE DERIVED IN NODE BUT MATCHED BY TEXT, because option ORDER is
     shuffled per player (App.jsx shuffles indices before render), so knowing
     `q.a` is useless — only the answer STRING transfers. */
  { name: '08-daily-chips', expect: 'Correct!',
    verify: async (p) => (await p.evaluate(() => {
      const t = document.body.innerText;
      return /Correct!/i.test(t) && /7\s*\/\s*7/.test(t)
        && !/Save your progress|Continue with Apple/i.test(t);
    })),
    go: async (p) => {
      const wanted = pickDailyQuestions(QB, dayIndexForDate(new Date()));
      const WRONG_ON = new Set([3, 6]);          // 5 of 7 correct
      await p.goto(BASE + '/play', { waitUntil: 'networkidle' });
      await p.waitForTimeout(3200);
      await p.getByText('Daily 7', { exact: true }).first().click();
      await p.waitForTimeout(2000);
      for (let i = 0; i < 7; i++) {
        const opts = p.locator('.opt');
        if (!(await opts.count())) break;
        const correct = wanted[i] ? wanted[i].o[wanted[i].a] : null;
        const texts = await opts.allInnerTexts();
        let idx = texts.findIndex((t) => correct && t.includes(correct));
        if (idx < 0) idx = 0;
        if (WRONG_ON.has(i + 1)) idx = texts.findIndex((_, n) => n !== idx);
        await opts.nth(Math.max(0, idx)).click();
        await p.waitForTimeout(950);
        // Advance on every question EXCEPT the last — that final tap opens the
        // results page and, as a guest, the auth sheet behind it.
        if (i < 6) {
          const next = p.getByText(/^(Next|Results|Finish)/i).first();
          if (await next.count()) { await next.click(); await p.waitForTimeout(1300); }
        }
      }
      await p.waitForTimeout(900); } },
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
  // ⚠️ THE CONSENT BANNER WOULD OTHERWISE SHIP IN THE STORE SCREENSHOTS.
  // public/consent.js mounts for any European/UTC time zone, and the machine
  // these are shot on is in Norway — so the first re-shoot after the banner
  // landed (2026-08-23) captured "Decline / Allow" sitting across the bottom
  // of the frame, hiding the tab bar entirely. It is a legitimate part of the
  // product and a terrible thing to put on an install sheet.
  // Seeding a decision means the bar never mounts. 'denied' on purpose: it is
  // the choice that turns Clarity OFF, so a capture run can never write
  // session-replay rows against a robot.
  localStorage.setItem('biq_consent_analytics', 'denied');
}, SEED_STATS);

// ONLY=02-footle,05-quiz-explanation → re-shoot just those. Every shot here is
// non-deterministic (daily answers rotate, quiz options shuffle), so a full run
// to fix ONE image silently re-rolls the other seven — including ones already
// approved. Comma-separated, matched on the shot name.
/**
 * ⚠️ THE BUG THAT SHIPPED TO BOTH STORES, AND WHY NO CHECK CAUGHT IT.
 *
 * 01-home.png went live on the App Store and Play with two mode-grid glyphs
 * bleeding straight through the tab bar — a flame sitting exactly where the D
 * should be, so the Daily tab read "(flame)aily", plus a slashed circle under
 * the Home icon. It was the FIRST screenshot, the one Apple puts on the
 * install sheet, in all 15 localisations. Confirmed 2026-08-23 by downloading
 * the live asset from Apple's CDN, not by re-reading the repo copy.
 *
 * ROOT CAUSE — not an animation, and not a design problem. `.tab-bar` is
 * `rgba(32,35,44,0.34)`: only 34% opaque, with `backdrop-filter: blur(42px)`
 * doing all the visual work. Chromium's screenshot path SUPPORTS
 * backdrop-filter but does not composite it, so the capture keeps the 34%
 * tint and drops the blur — leaving whatever sits behind the bar clearly
 * visible. The `@supports not (backdrop-filter: ...)` fallback in app.css
 * cannot save us here, because it tests SUPPORT, not EFFECT: headless Chrome
 * reports support, so the opaque fallback never fires.
 *
 * The old check asserted which SCREEN was captured, never what it looked like,
 * so it passed on a visibly broken asset. LISTING.md §6 had already written
 * the lesson down for a different shot — "caught by opening the PNG, not by
 * the test" — and it did not generalise into code. This does.
 *
 * Returns the list of surfaces it had to fix, so a NEW translucent element is
 * reported rather than silently papered over.
 */
async function forceOpaqueMaterials(p) {
  return p.evaluate(() => {
    const offenders = [];
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const filter = cs.backdropFilter || cs.webkitBackdropFilter || 'none';
      if (!filter || filter === 'none') continue;
      const m = String(cs.backgroundColor || '').match(/rgba?\(([^)]+)\)/);
      const alpha = m ? parseFloat(m[1].split(',')[3] ?? '1') : 1;
      if (!(alpha < 0.99)) continue; // already opaque — composites fine
      const parts = m[1].split(',').slice(0, 3).map((n) => n.trim());
      // Fully opaque for capture, not the 0.97 the @supports fallback uses:
      // a store asset should carry zero bleed, and 3% of a bright flame glyph
      // is still visible at the size Apple renders the install sheet.
      el.style.setProperty('background-color', `rgb(${parts.join(',')})`, 'important');
      el.style.setProperty('backdrop-filter', 'none', 'important');
      el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      const id = typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/)[0]
        : el.tagName.toLowerCase();
      if (!offenders.includes(id)) offenders.push(id);
    }
    return offenders;
  });
}

const ONLY = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
let bad = 0;
let translucent = 0;
for (const s of SHOTS) {
  if (ONLY.length && !ONLY.includes(s.name)) continue;
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
  const bleed = await forceOpaqueMaterials(p);
  if (bleed.length) {
    translucent += bleed.length;
    console.log(`  ! ${s.name}: ${bleed.length} translucent surface(s) forced opaque for capture — ${bleed.join(', ')}`);
  }
  await p.screenshot({ path: `${RAW}/${s.name}.png` });
  console.log(`  ${ok ? '✓' : '✗ WRONG SCREEN —'} ${s.name}  (looked for "${s.expect}")`);
  await p.close();
}
if (bad) console.log(`\n  ${bad} shot(s) captured the wrong screen — do not ship these.`);
if (translucent) {
  console.log(`  ${translucent} translucent surface(s) were forced opaque across the set.`);
  console.log('  That is the fix working, not a warning — but OPEN THE PNGs anyway.');
}
await b.close();
console.log(`\nraw frames -> ${RAW}`);
