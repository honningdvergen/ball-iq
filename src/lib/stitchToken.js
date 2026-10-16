// Stitch-up: the link (16 Oct 2026; return research, "Three new modes" #1).
//
// A player picks a footballer from the VERIFIED careers (lib/stitch.js), says
// how many clubs his mate sees at the start, picks a taunt, and sends:
//
//   balliq.app/s/1x9k2qa.3.4.0-0.Alex
//                │       │ │ │   └ the sender's first name (dots ride as %2E)
//                │       │ │ └ the running score, sender first, then receiver
//                │       │ └ which of the twelve taunts
//                │       └ clubs on the board at the start (2 or more)
//                └ the player, as a hash of his id (stitchHash), never his name
//
// ⚠️ THE TOKEN NEVER CARRIES THE ANSWER. A Trail key is the surname
// ("ZIDANE"), so a token with the key in it would print the answer in the
// address bar. The hash is resolved against the verified list in the app; the
// edge page (api/s.js) and the card (api/og.js) never learn who it is.
//
// No imports, on purpose: api/s.js and api/og.js import this file, and an edge
// bundle should carry nothing it does not need.

// Twelve fixed taunts. Football banter only: nothing about race, religion,
// disability or anyone's body, no slurs, no swearing. Sentence case. The
// INDEX is in links already out in the world, so only ever add to the end.
export const STITCH_TAUNTS = [
  "Bet you can't, you plastic",
  'My nan got this one',
  'Easy if you actually watch football',
  'Thought you knew ball',
  "Five guesses. You'll need six",
  'Go on then, pundit',
  'Even the ref would get this',
  'Bottle job incoming',
  "Highlights merchant, this one's for you",
  "Don't Google it. I'll know",
  'Proper fans only',
  'Name him or never talk ball again',
];

export const STITCH_MIN_SHOWN = 2;
const MAX_TALLY = 99;

export const cleanStitchName = (s) => String(s || '').replace(/\./g, ' ').replace(/[^\p{L}\p{N} '_-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 22);

/** FNV-1a 32-bit of the player's id, base 36: short, stable, opaque. */
export function stitchHash(id) {
  let h = 0x811c9dc5;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

const clampTally = (n) => Math.max(0, Math.min(MAX_TALLY, Math.round(Number(n) || 0)));

/**
 * The link's token, or null when an input is out of range.
 * `tally` is [sender's wins, receiver's wins] so far; a first stitch-up is 0-0.
 */
export function makeStitchToken({ hash, shown, taunt, name = '', tally = [0, 0] }) {
  if (!/^[0-9a-z]{1,7}$/.test(String(hash || ''))) return null;
  if (!Number.isInteger(shown) || shown < STITCH_MIN_SHOWN || shown > 12) return null;
  if (!Number.isInteger(taunt) || taunt < 0 || taunt >= STITCH_TAUNTS.length) return null;
  const n = cleanStitchName(name);
  const t = `${clampTally(tally?.[0])}-${clampTally(tally?.[1])}`;
  return `${hash}.${shown}.${taunt}.${t}${n ? '.' + encodeURIComponent(n).replace(/\./g, '%2E') : ''}`;
}

export function parseStitchToken(token) {
  const m = /^([0-9a-z]{1,7})\.(\d{1,2})\.(\d{1,2})\.(\d{1,2})-(\d{1,2})(?:\.(.+))?$/.exec(String(token || '').trim());
  if (!m) return null;
  const shown = parseInt(m[2], 10), taunt = parseInt(m[3], 10);
  if (shown < STITCH_MIN_SHOWN || shown > 12 || taunt >= STITCH_TAUNTS.length) return null;
  let name = '';
  try { name = m[6] ? decodeURIComponent(m[6]) : ''; } catch { name = m[6] || ''; }
  return { hash: m[1], shown, taunt, tally: [parseInt(m[4], 10), parseInt(m[5], 10)], name: cleanStitchName(name) };
}

/** The card's headline: "Alex stitched you up: whose career is this?" */
export function stitchHeadline(name) {
  return `${cleanStitchName(name) || 'A mate'} stitched you up: whose career is this?`;
}

/**
 * After the receiver plays: the score from the RECEIVER's side, and the tally
 * a link sent back carries (the receiver becomes the sender, so it flips).
 */
export function stitchScore(tally, won) {
  const them = clampTally(tally?.[0]) + (won ? 0 : 1);
  const me = clampTally(tally?.[1]) + (won ? 1 : 0);
  return { me: Math.min(me, MAX_TALLY), them: Math.min(them, MAX_TALLY), backTally: [Math.min(me, MAX_TALLY), Math.min(them, MAX_TALLY)] };
}
