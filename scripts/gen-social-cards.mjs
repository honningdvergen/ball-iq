// gen-social-cards.mjs — square promo cards for the @shithouseryhq IG carousel.
//
//   node scripts/gen-social-cards.mjs            # writes marketing/social/*.png
//
// ⚠️ THE DENSITY IS LOCKED AND APPROVED. Alex, 2026-07-18, on the card batch:
// "if too much is happening on the grid card people will not bother reading it
// but this is the perfect amount". The approved recipe is exactly:
//   brand line + ONE headline + ONE 3-4 row grid + URL pill.
// No badges, no subcopy, no decoration. Do not add to it.
//
// ⚠️ SQUARE, ALWAYS. Alex, same day: "a square aspect ratio is really beneficial
// for how the screenshots appear on social media." 1:1 is the only ratio that
// travels uncropped — fills the IG feed and carousel, fine on Threads/X, works
// in a story with padding. Portrait letterboxes; landscape chops.
//
// ⚠️ THE CARD CARRIES A SEARCHABLE URL, NOT THE SHORT ATTRIBUTED ONE.
// This first shipped as balliq.app/ig and Alex caught it: a printed URL cannot
// be tapped, so the ONLY path it has is read-then-search — and nobody types a
// URL into an address bar any more. Googling "balliq.app/ig" returns
// @balliqmedia (7.4K, NBA/NFL satire) and @ball_iq44 — who sell football trivia
// — because /ig is a bare 307 with no page to index and the string collides
// with other "ball iq" accounts. The card was pointing readers at a competitor.
//
// The short links (/ig, /t, /tt, /x) exist to stop a URL rendering TRUNCATED in
// a PROFILE LINK FIELD. That is a tappable-surface problem and they are still
// right there. Applying them to a printed image was the wrong tool: an image
// needs a URL a human can remember and a search engine can find. Verified:
// searching our content surfaces balliq.app/footle directly.
//
// So attribution moves to the BIO link, where it is tapped rather than typed,
// and the card gets the memorable address of the game it is actually showing.
//
// ⚠️ EVERY FACT HERE IS FROZEN REPO DATA, NOT RECALL. Footle answers come from
// WORDLE_ANSWER_LOG (the frozen schedule, so the puzzle numbers are the real
// ones) and the tile colours are graded by the app's OWN gradeWordleGuess, so a
// card can never show scoring the game would not produce. Trail paths come from
// TRAIL_PLAYERS verbatim. The zero-error bar covers marketing too — 25.3K
// football obsessives read this account and its whole credibility is knowing
// football.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { WORDLE_ANSWER_LOG, gradeWordleGuess } from '../src/lib/wordle.js';
import { TRAIL_PLAYERS } from '../src/lib/trail.js';

const OUT = fileURLToPath(new URL('../marketing/social', import.meta.url));
const SIZE = 1080;
const FOOTLE_URL = 'balliq.app/footle';
const TRAIL_URL = 'balliq.app/transfer-trail';

const T = {
  bg: '#0B0C10', card: '#13151C', card2: '#1B1E27', bd: '#242730', bd2: '#2F3240',
  grn: '#58CC02', grnInk: '#06230C', amber: '#FFC107', tx: '#F0F1F5', tx3: '#9BA0B8',
};

/** Puzzle number for an answer, from the FROZEN log — never invented. */
const puzzleNo = (answer) => {
  const i = WORDLE_ANSWER_LOG.indexOf(answer);
  if (i < 0) throw new Error(`"${answer}" is not in WORDLE_ANSWER_LOG — refusing to invent a puzzle number`);
  return i + 1;
};

const shell = (inner) => `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&display=swap">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${SIZE}px;height:${SIZE}px;background:${T.bg};color:${T.tx};
       font-family:Archivo,"Helvetica Neue",Arial,sans-serif;display:flex}
  .card{flex:1;display:flex;flex-direction:column;justify-content:space-between;
        padding:88px 84px 76px}
  .brand{font-size:26px;font-weight:800;letter-spacing:.22em;color:${T.tx3};text-transform:uppercase}
  .brand b{color:${T.grn}}
  .head{font-size:62px;font-weight:800;letter-spacing:-.02em;line-height:1.06}
  .head span{color:${T.grn}}
  .pill{align-self:flex-start;background:${T.grn};color:${T.grnInk};font-size:30px;font-weight:800;
        padding:16px 30px;border-radius:999px;letter-spacing:.01em}
  .rows{display:flex;flex-direction:column;gap:14px}
  .row{display:flex;gap:14px}
  .t{width:104px;height:104px;border-radius:14px;display:flex;align-items:center;justify-content:center;
     font-size:48px;font-weight:800;background:${T.card2};border:2px solid ${T.bd2};color:${T.tx}}
  .t.g{background:${T.grn};border-color:${T.grn};color:${T.grnInk}}
  .t.y{background:${T.amber};border-color:${T.amber};color:#231A00}
  .club{display:flex;align-items:center;gap:22px;background:${T.card};border:2px solid ${T.bd};
        border-radius:18px;padding:24px 30px;font-size:40px;font-weight:600}
  .club i{width:14px;height:14px;border-radius:50%;background:${T.bd2};flex:none;font-style:normal}
  .club.last i{background:${T.grn}}
  .club em{font-style:normal;color:${T.tx3};font-size:26px;font-weight:600;margin-left:auto;letter-spacing:.1em}
</style>${inner}`;

/** Footle: a solved board, graded by the game's own function. */
function footleCard({ answer, guesses }) {
  const n = puzzleNo(answer);
  const rows = guesses.map((g) => {
    const marks = gradeWordleGuess(g, answer);   // ⚠️ the app's grader, never a copy
    return `<div class="row">${[...g].map((ch, i) =>
      `<div class="t ${marks[i] === 'green' ? 'g' : marks[i] === 'yellow' ? 'y' : ''}">${ch}</div>`).join('')}</div>`;
  }).join('');
  return shell(`<div class="card">
    <div class="brand">Ball <b>IQ</b></div>
    <div class="head">Footle <span>No. ${n}</span></div>
    <div class="rows">${rows}</div>
    <div class="pill">${FOOTLE_URL}</div>
  </div>`);
}

/** Transfer Trail: a career path, last club highlighted. */
function trailCard(key) {
  const p = TRAIL_PLAYERS.find((x) => x.key === key);
  if (!p) throw new Error(`no TRAIL_PLAYERS entry for ${key} — refusing to invent a career`);
  // ⚠️ NO "NOW" TAG, AND NO HIGHLIGHTED LAST ROW. The first version marked the
  // final club "NOW" — a claim about the present that TRAIL_PLAYERS does not
  // make. The data gives the ORDER of a career, not that the last entry is
  // current, and trail careers need re-verifying every transfer window. A card
  // that silently ages into a wrong fact is exactly what the zero-error bar is
  // for, and a printed asset cannot be corrected after it is posted.
  const rows = p.clubs.map((c) => `<div class="club"><i></i>${c}</div>`).join('');
  return shell(`<div class="card">
    <div class="brand">Ball <b>IQ</b></div>
    <div class="head">Name him from<br><span>his clubs</span></div>
    <div class="rows">${rows}</div>
    <div class="pill">${TRAIL_URL}</div>
  </div>`);
}

const CARDS = [
  // Guesses are themselves real Footle answers, so every word on every card is
  // a footballer's surname the game itself uses.
  ['footle-baggio', footleCard({ answer: 'BAGGIO', guesses: ['SAGNOL', 'CHIESA', 'BAGGIO'] })],
  ['footle-rooney', footleCard({ answer: 'ROONEY', guesses: ['BIELSA', 'ROBSON', 'ROONEY'] })],
  ['trail-hakimi', trailCard('HAKIMI')],
  ['trail-dybala', trailCard('DYBALA')],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
for (const [name, html] of CARDS) {
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  ✓ ${name}.png`);
}
await browser.close();
console.log(`\n  ${CARDS.length} cards → ${OUT}  (${SIZE}x${SIZE})\n`);
