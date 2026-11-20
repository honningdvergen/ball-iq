// Ballpark (prototype, web only, 20 Nov 2026): three football numbers a day,
// one guess each, scored on how close you got.
//
// Alex, 20 Nov 2026: "maybe fermi gg for example into a gamemode". The mechanic
// (estimate a number, see the truth and how far off you were) is the genre's;
// the name, the look, the scoring scale and every question are ours.
//
// Pure logic only: nothing here touches the DOM, so the scoring is testable and
// the screen (screens/Ballpark.jsx) stays a thin view over it.
//
// ⚠️ ZERO ERROR applies to the DATA, not just this code. Every number in
// data/ballparkQuestions.json was checked against two sources by an independent
// verifier before it went in (~/ball-iq-audit/2026-11-20/ballpark/verdicts.json).
// A question whose figure is contested between reputable sources is cut, not
// "picked". Do not add a number here on one source.
import DATA from "../data/ballparkQuestions.json";

export const BALLPARK_PER_DAY = 3;
export const BALLPARK_MAX = 100 * BALLPARK_PER_DAY;
// The largest value the keypad will build: twelve whole digits. Football's
// biggest honest numbers are television audiences in the billions.
export const BALLPARK_VALUE_CAP = 1e12;
const SAVE_KEY = "biq_ballpark";
export const DAY_MS = 24 * 60 * 60 * 1000;

// ── The schedule ───────────────────────────────────────────────────────────
// PROTOTYPE: a short frozen list of days that repeats. Before this leaves the
// prototype it needs what Footle and the Trail have: an append-only answer log
// keyed by day number, so adding a question can never rewrite a past day, and
// "Ballpark #N" is a real edition number instead of a slot. Questions pinned to
// a date ("As of November 2026") must not come round again once it has passed.
export const BALLPARK_DAYS = DATA.days;
export const BALLPARK_ANCHOR_DAY = 20778; // local days since epoch for 21 Nov 2026: Ballpark #1

const byId = new Map(DATA.questions.map((q) => [q.id, q]));
export const ballparkQuestion = (id) => byId.get(id) || null;

// Local calendar day, as the other dailies count it: new numbers at the
// player's own midnight.
export function localDayIndex(date = new Date()) {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / DAY_MS);
}

// 1-based slot in the frozen list. `force` (the prototype's ?day=N) wins when
// it names a real day.
export function ballparkSlot(date = new Date(), force = null, days = BALLPARK_DAYS) {
  const n = days.length;
  const f = Number(force);
  if (Number.isInteger(f) && f >= 1 && f <= n) return f;
  const off = localDayIndex(date) - BALLPARK_ANCHOR_DAY;
  return (((off % n) + n) % n) + 1;
}

export function ballparkDay(slot, days = BALLPARK_DAYS) {
  const ids = days[slot - 1] || [];
  return ids.map(ballparkQuestion).filter(Boolean);
}

// ── Scoring ────────────────────────────────────────────────────────────────
// How many times out you were, always >= 1: 2 means double or half.
export function ballparkFactor(guess, answer) {
  const g = Number(guess), a = Number(answer);
  if (!(g > 0) || !(a > 0)) return Infinity;
  return g >= a ? g / a : a / g;
}

// Exact means exact (to float error), never "near enough". The first draft
// called anything inside half a percent "spot on" and rounded anything inside
// about one percent up to 100: 212 against 211 was told it was right. A player
// is never told that unless it is true.
export function ballparkExact(guess, answer) {
  const g = Number(guess), a = Number(answer);
  return g > 0 && a > 0 && Math.abs(g - a) <= a * 1e-9;
}

// 100 for exact and only for exact, 99 at best otherwise, 70 for a factor of
// two, 0 from a factor of ten. A log scale, because being 3 goals out on 30 and
// 300,000 people out on 3 million are the same size of miss.
export function ballparkPoints(guess, answer) {
  const f = ballparkFactor(guess, answer);
  if (!Number.isFinite(f)) return 0;
  if (ballparkExact(guess, answer)) return 100;
  return Math.min(99, Math.max(0, Math.round(100 * (1 - Math.log10(f)))));
}

// 0 Top corner · 1 On target · 2 Off the post · 3 Wide · 4 Row Z
export const BALLPARK_TIER_AT = [1.05, 1.25, 2, 5];
export function ballparkTier(guess, answer) {
  const f = ballparkFactor(guess, answer);
  const i = BALLPARK_TIER_AT.findIndex((edge) => f <= edge);
  return i === -1 ? BALLPARK_TIER_AT.length : i;
}

// -1 too low, 0 exact, 1 too high.
export function ballparkSide(guess, answer) {
  if (ballparkExact(guess, answer)) return 0;
  return Number(guess) < Number(answer) ? -1 : 1;
}

// "1.42", "3.6", "36", "1,000+": the factor as the player reads it.
export function factorLabel(f, locale) {
  if (!Number.isFinite(f) || f >= 1000) return `${(1000).toLocaleString(locale)}+`;
  if (f >= 10) return Math.round(f).toLocaleString(locale);
  if (f >= 2) return f.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return f.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// The miss as a person would say it. Under a factor of two a percentage is the
// natural way ("8% too low"); past it, the factor is ("3.6× too high").
// { side: 0 } for spot on, else { side, pct } or { side, x }.
export function ballparkMiss(guess, answer, locale) {
  const side = ballparkSide(guess, answer);
  if (side === 0) return { side };
  const f = ballparkFactor(guess, answer);
  if (f < 2) return { side, pct: Math.max(1, Math.round((Math.abs(Number(guess) - Number(answer)) / Number(answer)) * 100)) };
  return { side, x: factorLabel(f, locale) };
}

// Where the guess sits on the reveal's scale: -1 is a tenth of the answer (or
// worse), 0 is exact, 1 is ten times it (or worse).
export function ballparkOffset(guess, answer) {
  const g = Number(guess), a = Number(answer);
  if (!(g > 0) || !(a > 0)) return -1;
  return Math.max(-1, Math.min(1, Math.log10(g / a)));
}

// ── The shot map ───────────────────────────────────────────────────────────
// Every guess is a shot at goal, and the picture says what the tier's name
// says: a ball in the top corner, on target, on the post, wide of it, or up in
// Row Z. Left of the goal is too low, right is too high. Alex, 20 Nov 2026, on
// the first results screen (a list of text): "this looks bad though does it
// not?" It did: there was nothing to look at. The goal is ours; no other
// estimation game draws its result this way.
//
// Drawn in a 320 x 150 box, of which the top 12 are cropped away (screens/
// Ballpark.jsx ShotMap): ground at y 128, the posts at x 96 and 224, the bar at
// y 50. The goal is most of the picture; only Row Z uses the corners above it.
export const SHOT_BOX = { w: 320, h: 150, top: 12, ground: 128, left: 96, right: 224, bar: 50, spot: { x: 160, y: 143 } };
const TIER_LOG = [0, Math.log10(1.05), Math.log10(1.25), Math.log10(2), Math.log10(5), 1];
// Where shot `i` (0, 1, 2) lands. `i` only nudges the height, so three shots of
// the same kind on the same side do not sit on top of each other.
export function shotSpot(guess, answer, i = 0) {
  const tier = ballparkTier(guess, answer);
  const o = Math.abs(ballparkOffset(guess, answer));
  const side = Number(guess) < Number(answer) ? -1 : 1;
  // How far through its own tier the miss is, 0 to 1.
  const u = Math.max(0, Math.min(1, (o - TIER_LOG[tier]) / ((TIER_LOG[tier + 1] - TIER_LOG[tier]) || 1)));
  const nudge = [0, 14, -14][i] || 0;
  const cx = 160;
  if (tier === 0) return { tier, x: cx + side * 50, y: 63 + Math.abs(nudge) * 0.5 };  // tucked under the bar, inside the post
  if (tier === 1) return { tier, x: cx + side * (8 + 26 * u), y: 102 + nudge * 0.7 };  // inside the frame, drifting to the post
  if (tier === 2) return { tier, x: cx + side * 64, y: 96 + nudge };                 // on the post itself
  if (tier === 3) return { tier, x: cx + side * (86 + 34 * u), y: 119 - Math.abs(nudge) * 0.4 }; // rolling past it
  return { tier, x: cx + side * (132 + 14 * u), y: 32 + Math.abs(nudge) };           // high and far: Row Z
}

// 0 poor · 1 fair · 2 good · 3 excellent, for the one line under the total.
export function ballparkVerdict(total) {
  if (total >= 270) return 3;
  if (total >= 210) return 2;
  if (total >= 130) return 1;
  return 0;
}

// ── The keypad's number ────────────────────────────────────────────────────
// The player types the whole number, blank, with no help. Alex, 20 Nov 2026, on
// the first draft's "thousand / million / billion" buttons: "you go in totally
// blank so you type the full number. that is better". He is right twice: the
// buttons were a second thing to operate, and choosing "million" is itself a
// hint at the size of the answer. The screen reads the typed number back in
// words under the figure, so the zeros can be checked without being counted.
const WORD_SCALES = [1e3, 1e6, 1e9];
const MAX_DIGITS = 12;
const MAX_DECIMALS = 3;

// The figure after one more key. `key` is a digit, "." or "back".
export function pressKey(text, key) {
  const cur = String(text || "");
  if (key === "back") return cur.slice(0, -1);
  if (key === ".") {
    if (cur.includes(".")) return cur;
    return cur === "" ? "0." : `${cur}.`;
  }
  if (!/^[0-9]$/.test(key)) return cur;
  const [whole, frac] = cur.split(".");
  if (frac !== undefined) return frac.length >= MAX_DECIMALS ? cur : cur + key;
  if (whole === "0") return key; // no leading zeros: "0" then "7" is "7"
  if (whole.length >= MAX_DIGITS) return cur;
  return cur + key;
}

export function keypadValue(text) {
  const n = parseFloat(String(text || ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, BALLPARK_VALUE_CAP);
}

// The typed figure with its thousands marks, keeping a trailing "." or zeros
// the player has just typed ("1,250.", "0.50").
export function keypadShown(text, locale) {
  const cur = String(text || "");
  if (cur === "") return "";
  const [whole, frac] = cur.split(".");
  const head = Number(whole || "0").toLocaleString(locale);
  if (frac === undefined) return head;
  const point = (1.1).toLocaleString(locale).charAt(1);
  return `${head}${point}${frac}`;
}

// A whole figure in full, or with up to three decimals when it has them.
export function fullNumber(n, locale) {
  return Number(n).toLocaleString(locale, { maximumFractionDigits: 3 });
}

// { n: "3.6", scale: 1e6, exact } for numbers worth saying in words, else null.
// Three significant figures, so 2,360,000,000 reads "2.36 billion".
export function roundedParts(n, locale) {
  const v = Number(n);
  let scale = [...WORD_SCALES].reverse().find((s) => v >= s * 10 || (s >= 1e6 && v >= s));
  if (!scale) return null;
  const round = (sc) => { const x = v / sc; const d = x >= 100 ? 0 : x >= 10 ? 1 : 2; return [Math.round(x * 10 ** d) / 10 ** d, d]; };
  let [rounded, digits] = round(scale);
  // 999,999 must not read "1,000 thousand": rounding past a boundary moves up a word.
  const bigger = WORD_SCALES[WORD_SCALES.indexOf(scale) + 1];
  if (rounded >= 1000 && bigger) { scale = bigger; [rounded, digits] = round(scale); }
  const shown = rounded.toLocaleString(locale, { maximumFractionDigits: digits });
  // `exact` when nothing was rounded away (265,000,000 is 265 million, not "about").
  return { n: shown, scale, exact: Math.abs(rounded * scale - v) < 0.0005 };
}

// ── The save ───────────────────────────────────────────────────────────────
// { [key]: { g: [number, ...], s: seen } }. `g` holds one locked guess per
// answered question: a guess is locked the moment it is made, so a reload
// cannot buy a second go. `s` counts the reveals the player has moved on from,
// so a reload in the middle of a reveal comes back to that reveal, not past it.
//
// The key is the CALENDAR day for a real day ("d20778") and the slot for a day
// opened on purpose from the prototype's list ("p3"). Keyed by slot alone, the
// short list coming round again would have found last week's guesses waiting
// and left nothing to play.
const KEEP_DAYS = 30;
export function ballparkSaveKey(slot, forced, date = new Date()) {
  return forced ? `p${slot}` : `d${localDayIndex(date)}`;
}

// Safari with cookies blocked and some in-app browsers throw on the very
// mention of localStorage, so it is only ever touched inside a try.
function readAll(storage) {
  try {
    const st = storage || globalThis.localStorage;
    const raw = JSON.parse(st.getItem(SAVE_KEY) || "null");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch { return {}; }
}

export function loadBallpark(key, storage) {
  const row = readAll(storage)[key];
  const g = Array.isArray(row?.g) ? row.g.filter((x) => Number.isFinite(x) && x > 0).slice(0, BALLPARK_PER_DAY) : [];
  // An older row with no count: every locked guess is taken as seen.
  const seen = Number.isInteger(row?.s) && row.s >= 0 ? Math.min(row.s, g.length) : g.length;
  return { g, seen };
}

export function saveBallpark(key, guesses, seen, storage) {
  try {
    const st = storage || globalThis.localStorage;
    const all = readAll(st);
    const g = guesses.slice(0, BALLPARK_PER_DAY);
    all[key] = { g, s: Math.max(0, Math.min(Number(seen) || 0, g.length)) };
    const oldest = localDayIndex() - KEEP_DAYS;
    for (const k of Object.keys(all)) { const m = /^d(\d+)$/.exec(k); if (m && Number(m[1]) < oldest) delete all[k]; }
    st.setItem(SAVE_KEY, JSON.stringify(all));
    return true;
  } catch { return false; }
}

export function ballparkTotal(guesses, questions) {
  return questions.reduce((sum, q, i) => sum + (guesses[i] > 0 ? ballparkPoints(guesses[i], q.answer) : 0), 0);
}

// ── Share ──────────────────────────────────────────────────────────────────
// One square a question, coloured by how close. Squares are content here (the
// share text), never an icon in the interface.
const SQUARES = ["🎯", "🟩", "🟨", "🟧", "⬜"];
export function ballparkSquares(guesses, questions) {
  return questions.map((q, i) => SQUARES[ballparkTier(guesses[i], q.answer)]).join("");
}
