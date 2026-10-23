// Top 10 — the daily list game. A ranked list of ten, three lives, name them all.
//
// Sibling of trail.js / wordle.js: a frozen schedule and a pure grader, no React
// and no data. The lists themselves live in src/data/top10Lists.json, which the
// screen import()s when it opens, so nothing here adds to Home's eager path
// beyond this file.
//
// ── THE STATE IS THE LIST OF PICKS ───────────────────────────────────────────
// Same rule as Footle and the Trail: store what the player DID, derive the
// rest. A day is { picks: [{ k, n }], gaveUp }: the key and the name of each
// suggestion that was tapped, in order. Hits, misses, lives and the finished
// board are all computed from that against the list, so a reload mid-game
// rebuilds the exact board and a corrected list re-grades an old day honestly.
//
// ── YOU CAN ONLY PICK A NAME FROM THE SUGGESTIONS ────────────────────────────
// A wrong pick costs a life, so free text would tax spelling rather than
// football knowledge ("Borussia Monchengladbach", "Szczesny"). Every answer is
// in the pool the guess box offers, under one name: scripts/gen-top10.mjs
// refuses to build otherwise. A key is the pool's own id for a player and the
// folded name for a club or a nation.
import { dayIndexForDate, dateToYMD } from './date.js';
import { normaliseName } from './mysteryPlayer.js';
import { t } from '../i18n/index.js';
import { TOP10_ANCHOR_DAY, TOP10_DAYS, TOP10_LOG_HASH } from '../data/top10Meta.js';

export const TOP10_LIVES = 3;
export const TOP10_SIZE = 10;
// Hints a game: each shows the first letter of the highest-ranked open name.
export const TOP10_HINTS = 3;

// The anchor (the day of Top 10 #1) and the schedule's length are set in
// scripts/top10/specs.mjs and arrive through the generated top10Meta.js.
export { TOP10_ANCHOR_DAY };

export function getTop10Number(date = new Date()) {
  return dayIndexForDate(date) - TOP10_ANCHOR_DAY + 1;
}

// How many days of lists this device holds: the build's own, or more once a
// longer schedule has been fetched from the site and kept (top10Remote.js,
// which writes this note only after the file passed every check). The note is
// believed only if it was written against THIS build's schedule, so one left
// behind by an older build is ignored after an update.
export const TOP10_DAYS_KEY = 'biq_top10_days';
export function top10Days() {
  try {
    const n = JSON.parse(localStorage.getItem(TOP10_DAYS_KEY) || 'null');
    if (n && n.n === TOP10_DAYS && n.h === TOP10_LOG_HASH && n.a === TOP10_ANCHOR_DAY
      && Number.isInteger(n.d) && n.d > TOP10_DAYS && n.d <= TOP10_DAYS + 1000) return n.d;
  } catch { /* no storage, or not ours */ }
  return TOP10_DAYS;
}

/**
 * Is there a list to play on this date? Home asks this before it draws the row,
 * from the schedule's LENGTH alone, so it never loads the lists to find out.
 * False before launch day and past the end of the schedule this device holds.
 */
export function isTop10Live(date = new Date(), days = top10Days()) {
  const n = getTop10Number(date);
  return n >= 1 && n <= days;
}

/** The list id scheduled for a date, or null before launch / past the log. */
export function getTop10Id(date = new Date(), log = []) {
  const n = getTop10Number(date) - 1;
  return n >= 0 && n < log.length ? log[n] : null;
}

/** Index of the slot a pick fills, or -1. */
export function slotIndexFor(list, key) {
  // `also` is for a name that is a fair answer to THIS list only: Russia for
  // the Soviet Union's European title, the Czech Republic for Czechoslovakia's.
  // The slot still shows the name the record books use.
  return (list?.slots || []).findIndex((s) => s.key === key || (s.also ? s.also.includes(key) : false));
}

/** The "so close" entry a pick matches (11th, 12th ...), or null. */
export function nearFor(list, key) {
  return (list?.near || []).find((s) => s.key === key) || null;
}

/**
 * Everything the board shows, from the picks alone.
 *
 * @param {object} list   { slots: [{ key, name, clue }], near?: [{ key, name, note }] }
 * @param {object} day    { picks: [{ k, n }], gaveUp?: boolean }
 */
export function gradeTop10(list, day) {
  const slots = list?.slots || [];
  const found = new Array(slots.length).fill(false);
  const order = [];   // slot indexes in the order they were found
  const wrong = [];   // { key, name } for every miss that cost a life, in order
  const close = [];   // { key, name, near } for every near miss: 11th, 12th ...
  const seen = new Set();
  let done = false;
  for (const pick of day?.picks || []) {
    const key = pick?.k;
    // A day stored before a list was corrected can hold picks past its new
    // end, or the same key twice. Neither may count again.
    if (!key || done || seen.has(key)) continue;
    seen.add(key);
    const i = slotIndexFor(list, key);
    if (i >= 0) { found[i] = true; order.push(i); }
    else {
      // A NEAR MISS IS FREE. Naming the club in eleventh place is knowing the
      // subject, not guessing, and taking a life for it is the complaint the
      // rival list games collect most. It is shown, and the life stays.
      const near = nearFor(list, key);
      if (near) close.push({ key, name: pick.n || near.name, near });
      else wrong.push({ key, name: pick.n || '' });
    }
    if (wrong.length >= TOP10_LIVES || order.length === slots.length) done = true;
  }
  const score = order.length;
  const perfect = slots.length > 0 && score === slots.length;
  const out = !perfect && wrong.length >= TOP10_LIVES;
  const gaveUp = !perfect && !out && !!day?.gaveUp;
  return {
    found, order, wrong, close, score, picked: seen,
    lives: Math.max(0, TOP10_LIVES - wrong.length),
    perfect, out, gaveUp,
    done: perfect || out || gaveUp,
  };
}

/** What adding a key to a day would be: 'hit' | 'near' | 'miss' | 'repeat'. */
export function outcomeOf(list, day, key) {
  if ((day?.picks || []).some((p) => p?.k === key)) return 'repeat';
  if (slotIndexFor(list, key) >= 0) return 'hit';
  return nearFor(list, key) ? 'near' : 'miss';
}

// ── THE GUESS BOX, for clubs and nations ─────────────────────────────────────
// Players go through lib/playerSearch.js, which ranks nine thousand names by
// fame. Clubs and nations are a few hundred entries with no fame to rank by,
// so the order is simply how well the text matches: the whole name, then the
// start of a word, then anywhere. An entry also answers to its `aka` spellings
// ("Spurs", "PSG", "Holland") and is always shown under its one name.
export function rankListSuggestions(pool, text, { limit = 6, exclude } = {}) {
  const q = normaliseName(text);
  if (q.length < 2) return [];
  const scored = [];
  for (const e of pool || []) {
    if (exclude && exclude.has(e.key)) continue;
    let best = 0;
    for (const raw of [e.name, ...(e.aka || [])]) {
      const n = normaliseName(raw);
      if (!n.includes(q)) continue;
      const s = n === q ? 4 : n.startsWith(q) ? 3 : n.split(' ').some((w) => w.startsWith(q)) ? 2 : 1;
      if (s > best) best = s;
    }
    if (best) scored.push({ e, s: best });
  }
  return scored
    // Equal matches go to the bigger name first: `w` counts how often an entry
    // appears among winners and finalists in our tables, so "liv" offers
    // Liverpool before Livorno and "real" Real Madrid before Real Unión.
    .sort((a, b) => b.s - a.s || (b.e.w || 0) - (a.e.w || 0) || a.e.name.length - b.e.name.length || a.e.name.localeCompare(b.e.name))
    .slice(0, limit)
    .map((x) => x.e);
}

// The finished board's row, by the height of the screen: 60pt where there is
// room, less on a short phone, so that Share under the board is on screen
// without scrolling. Measured 12 and 13 Oct 2026 with ten-row boards: at 60pt
// Share ended 108pt below the fold on an iPhone SE, 25 on a 13 mini and 21 on
// a 360x800 Android. Each 1pt off the row gives 5pt back.
export const doneRowFor = (h) => (h >= 800 ? 60 : h >= 720 ? 52 : 46);
export const T10_SHORT_UNDER = 720;

// A name with one very long word ("Borussia Mönchengladbach", "1. FC
// Kaiserslautern") cannot be wrapped between words to fit half a phone, and
// the board would break it inside the word. Such a name is set a size smaller
// (top10.css, .t10-name.is-long). Thirteen letters is where a single word
// stops fitting the large size at 402pt; a hyphen is a place to break.
export const hasLongWord = (name) => String(name || '').split(/[\s-]+/).some((w) => w.length >= 13);

// ── THE BOARD ABOVE THE KEYBOARD ─────────────────────────────────────────────
// Alex, in the simulator on launch day: "one important thing is that the
// keyboard does not block the view of the list on ANY phone". Until then the
// rows were one fixed height that had been measured to clear the keyboard on
// one phone (an iPhone 17), which is not a rule, it is a coincidence.
//
// So the board is fitted, not fixed. `avail` is the room between the top of
// the board and the top of the keyboard, measured on the device. Five rows
// (the board is two columns of five) share it:
//   - up to 60pt a row: the same as the board with no keyboard up
//   - never below 30pt: under that a name and its number cannot be read
//   - if the rows would come out under 44pt, the screen's header is asked to
//     shrink first (`tight`: the note, the date line and the sub-heading go),
//     which hands the board about 60pt more. Once tight it stays tight for as
//     long as the keyboard is up, so the two cannot flip back and forth.
// `fits` is false only when even 30pt rows under a tight header do not clear
// the keyboard (under about 316pt between the top of the screen and the
// keyboard, measured 12 Oct 2026). The screen does nothing with it yet: the
// page can be scrolled then. No phone we have run reaches it, but nothing in
// the suite proves that for a small phone in a browser with its bars showing.
export const T10_ROW_MAX = 60, T10_ROW_MIN = 30, T10_ROW_TIGHT_UNDER = 44;
// The gap between rows goes with the type size (top10.css: .is-l, base, .is-s),
// and four gaps come out of the room before the five rows share it. The first
// version of this used one gap for all three and the large size overflowed the
// keyboard by a few points on two phones (measured, 12 Oct 2026).
const T10_GAPS = { l: 8, m: 5, s: 4 };
const rowsIn = (avail, size) => Math.floor((avail - 4 * T10_GAPS[size]) / 5);
export function fitTop10Board(avail, tight = false) {
  const l = rowsIn(avail, 'l'), m = rowsIn(avail, 'm'), s = rowsIn(avail, 's');
  const [size, each] = l >= 52 ? ['l', l] : m >= 38 ? ['m', Math.min(m, 51)] : ['s', s];
  return { row: Math.max(T10_ROW_MIN, Math.min(T10_ROW_MAX, each)), tight: tight || m < T10_ROW_TIGHT_UNDER, size, fits: s >= T10_ROW_MIN };
}

// ── PERSISTENCE ──────────────────────────────────────────────────────────────
const storeKey = (ymd) => `biq_top10_${ymd}`;

export function loadTop10Day(ymd) {
  try {
    const raw = localStorage.getItem(storeKey(ymd));
    if (!raw) return null;
    const p = JSON.parse(raw);
    return Array.isArray(p?.picks) ? p : null;
  } catch { return null; }
}

export function saveTop10Day(ymd, state) {
  try { localStorage.setItem(storeKey(ymd), JSON.stringify(state)); } catch { /* private mode */ }
}

/**
 * Days in a row with a finished list, ending today. Finishing counts whatever
 * the score: a streak that needed ten out of ten would end most weeks, and the
 * habit worth rewarding is turning up. Archive plays (arc) never count.
 */
export function computeTop10Streak(today = new Date()) {
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i < 366; i++) {
    const p = loadTop10Day(dateToYMD(cursor));
    if (!p || p.status !== 'done' || p.arc) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ── SHARE ────────────────────────────────────────────────────────────────────
/**
 * The result as text. One square per rank in list order, so the shape shows
 * WHERE the gaps were (everyone gets the top three; the bottom of a list is
 * where it is won) without naming a single answer.
 */
export function buildTop10ShareText({ number, title, found = [], lives = 0, streak = 0 } = {}) {
  const score = found.filter(Boolean).length;
  const head = `⚽ Ball IQ · Top 10${number > 0 ? ` #${number}` : ''}`;
  const squares = found.map((f) => (f ? '🟩' : '⬛')).join('');
  const hearts = '❤️'.repeat(lives) + '🤍'.repeat(Math.max(0, TOP10_LIVES - lives));
  const streakLine = streak > 1 ? `\n${t('share.top10Streak', { n: streak })}` : '';
  return `${head}\n${title}\n${squares} ${score}/${found.length}\n${hearts}${streakLine}\n\nhttps://balliq.app/top10`;
}

/** "20 Jul 2026" from an ISO date: the "as of" line every list carries. */
export function formatAsOf(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return '';
  // The short month names, Jan … Dec, are one space-separated i18n string.
  const months = t('top10.months').split(' ');
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}
