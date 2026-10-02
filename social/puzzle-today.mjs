#!/usr/bin/env node
// Morning sheet for the daily puzzle posts (plan: /mnt/project-files/plans/daily-puzzle-posts.md, 2026-10-02).
// Prints today's Footle number, YESTERDAY's answer (for the reveal line), and the seven Daily 7 questions
// with their q_ids, answers and hints, read from the same code the game runs, so nothing is typed by hand.
//
//   node social/puzzle-today.mjs                → today (Oslo date)
//   node social/puzzle-today.mjs --date 2026-10-01
//   node social/puzzle-today.mjs --pick 3       → also print a ready tg.mjs quiz-poll command for question 3
//   node social/puzzle-today.mjs --spoil        → also print TODAY's Footle answer (off by default: play it first,
//                                                 the grid we post must be a real one)
//
// Facts in posts must come verbatim from src/questions.js, cited by q_id. Questions with flag:true are marked
// and must not be posted. Short links: Footle /tgf (Telegram) /igs (IG Story); Daily 7 /d7 (Telegram) /d7s (IG Story).
import { QB } from '../src/questions.js';
import { pickDailyQuestions } from '../src/lib/dailyDraw.js';
import { dayIndexForDate } from '../src/lib/date.js';
import { getWordleAnswer, getFootleNumber } from '../src/lib/wordle.js';

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > -1 && !process.argv[i + 1]?.startsWith('--') ? process.argv[i + 1] : (i > -1 ? true : null); };
const osloYMD = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const ymd = typeof arg('date') === 'string' ? arg('date') : osloYMD;
if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) { console.error('--date must be YYYY-MM-DD'); process.exit(1); }
const [y, m, d] = ymd.split('-').map(Number);
// Local noon of that calendar date: the game keys every daily off the player's LOCAL date, so building the
// Date from y/m/d (not from a UTC timestamp) gives the puzzle a player in Oslo or London sees that day.
const day = new Date(y, m - 1, d, 12), prev = new Date(y, m - 1, d - 1, 12);

const num = getFootleNumber(day);
console.log(`\n${ymd}\n`);
console.log(`FOOTLE #${num}`);
console.log(`  yesterday #${num - 1} was ${getWordleAnswer(prev)}   (reveal line / Telegram spoiler: <tg-spoiler>${getWordleAnswer(prev)}</tg-spoiler>)`);
if (arg('spoil')) console.log(`  today #${num} is ${getWordleAnswer(day)}`);
else console.log(`  today's answer hidden (--spoil to show). Play balliq.app/footle first and share the real grid.`);

const qs = pickDailyQuestions(QB, dayIndexForDate(day));
console.log(`\nDAILY 7`);
qs.forEach((q, i) => {
  console.log(`\n  ${i + 1}. [${q.id}] ${q.diff || ''}${q.flag ? '  ⚠️ FLAGGED, do not post' : ''}`);
  console.log(`     Q: ${q.q}`);
  console.log(`     options: ${q.o.join(' | ')}`);
  console.log(`     answer: ${q.o[q.a]}   (a=${q.a} is an INDEX into options)`);
  if (q.hint) console.log(`     hint: ${q.hint}`);
});

const pick = Number(arg('pick'));
if (pick) {
  const q = qs[pick - 1];
  if (!q) { console.error(`\n--pick must be 1–${qs.length}`); process.exit(1); }
  if (q.flag) { console.error(`\nquestion ${pick} (${q.id}) is flagged; pick another`); process.exit(1); }
  const sh = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
  const explain = (q.hint || '').length <= 200 ? q.hint : '';
  console.log(`\nTelegram quiz poll for ${q.id} (draft the question through review.mjs first; the gate checks the question text):`);
  console.log(`  node social/tg.mjs send --poll ${sh(q.q)} --options ${sh(q.o.join('|'))} --correct ${q.a}${explain ? ` --explain ${sh(explain)}` : ''}`);
  if (q.q.length > 300) console.log('  ⚠️ question is over Telegram\'s 300-char limit; shorten it');
  if (q.hint && !explain) console.log('  (hint is over 200 chars, so no --explain; write a shorter one from the hint)');
}
console.log('');
