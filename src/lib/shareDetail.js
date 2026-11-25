// What a shared link may tell the picture beyond the score (25 Nov 2026).
//
// The picture a /c/ link shows in a chat is the puzzle itself (api/og.js). With
// only the score on the link it can draw the plain form: numbered guesses, ten
// open slots, the clubs shown, seven dots that only count. These few characters
// let it draw what the sender's own finish shows, and still never an answer:
//
//   p   Footle: "<letters>.<row>.<row>…", each row its tiles read as a base 3
//       number (0 miss, 1 wrong spot, 2 right spot) and written in base 36.
//       Colours only: no letter ever leaves the phone.
//   m   Top 10 and Daily 7: a bit mask in base 36, bit i = place or question
//       i + 1 was got.
//   k   Transfer Trail: how many clubs the career has.
//
// api/c.js passes them on by shape, and api/og.js checks each against the
// score and draws the plain form if they disagree, so a mistake here costs
// detail and never truth. Kept in step with api/og.js by hand (an edge
// function cannot import from src/); tests/unit/share-detail.test.js draws the
// real picture from these strings.

const TILE = { '🟩': '2', '🟧': '2', '🟨': '1', '🟦': '1', '⬛': '0', '⬜': '0' };

/** The Footle grid as the game shares it (rows of squares, one per line) -> "p=7.9.1r.zik", or "". */
export function footleDetail(grid) {
  const rows = String(grid || '').split('\n').map((r) => [...r.trim()]).filter((r) => r.length);
  if (!rows.length || rows.length > 6) return '';
  const cols = rows[0].length;
  if (cols < 3 || cols > 12) return '';
  const out = [];
  for (const row of rows) {
    if (row.length !== cols) return '';
    let digits = '';
    for (const sq of row) { if (!(sq in TILE)) return ''; digits += TILE[sq]; }
    out.push(parseInt(digits, 3).toString(36));
  }
  return `p=${cols}.${out.join('.')}`;
}

const mask = (flags) => flags.reduce((v, on, i) => (on ? v | (1 << i) : v), 0).toString(36);

/** Top 10: which of the ten places were named, in rank order -> "m=…", or "". */
export function top10Detail(found) {
  return Array.isArray(found) && found.length === 10 ? `m=${mask(found.map(Boolean))}` : '';
}

/** Transfer Trail: the number of clubs in the career -> "k=…", or "". */
export function trailDetail(clubs) {
  return Number.isInteger(clubs) && clubs >= 1 && clubs <= 12 ? `k=${clubs}` : '';
}

// The Daily 7's link is made far from its result (hooks/useShare.js knows the
// score only), so the finish leaves today's seven marks here when it draws
// them. Nothing is kept past the session, and a share with no marks left here
// sends the link as it always was.
let dailyMarks = null;
export function setDailyMarks(right) {
  dailyMarks = Array.isArray(right) && right.length === 7 ? right.map(Boolean) : null;
}
/** Daily 7: which of the seven were right, if the finish left them and they add up to `score`. */
export function dailyDetail(score) {
  if (!dailyMarks || dailyMarks.filter(Boolean).length !== score) return '';
  return `m=${mask(dailyMarks)}`;
}

/** A link with its detail: joined to whatever query the link already has. */
export function withDetail(url, detail) {
  return detail ? `${url}${url.includes('?') ? '&' : '?'}${detail}` : url;
}
