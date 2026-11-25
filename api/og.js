import { ImageResponse } from '@vercel/og';
import { CARD_TIERS, CARD_COMPS, LEAGUE_FACES, tierPalette } from '../src/lib/ballIqCard.js';
import { STITCH_TAUNTS, stitchHeadline, cleanStitchName } from '../src/lib/stitchToken.js';

// Dynamic Open Graph image — renders the player's Ball IQ rating card so a
// shared balliq.app/p?... link previews as their card (overall + tier + six
// competition ratings + photo). Edge runtime; no JSX (plain element trees).
//
// Tier palettes + the competition list (order must match the `r` ratings param)
// come from the SAME module the in-app card renders from, so the share preview
// can never drift from the app again — a hand-copied palette here once shipped
// a violet ELITE while the app showed gold. No test covers this file, so assert
// the import shape at module load instead.
if (!Array.isArray(CARD_COMPS) || CARD_COMPS.length !== 6) {
  throw new Error(`api/og: expected 6 CARD_COMPS from ballIqCard.js, got ${CARD_COMPS?.length}`);
}

export const config = { runtime: 'edge' };

// Inter, the app's own face, at the four weights the cards use (600 snaps
// to 700). Without `fonts`, @vercel/og draws everything in its one bundled
// face, Geist Regular, so every 800/900 heading came out thin. The files are
// static instances of public/fonts/inter-5.3-*.woff2 (Satori reads neither
// woff2 nor variable fonts), latin + latin-ext merged, served from this
// deployment's own /og-fonts/ (web-only: the native prune drops the folder).
// Fetched once per isolate; reusing the same array also lets Satori keep the
// parsed fonts between requests. A failed fetch renders in the default face
// rather than failing the card, and is retried on the next request.
const OG_FONT_WEIGHTS = [500, 700, 800, 900];
let fontsPromise = null;
function loadFonts(origin) {
  fontsPromise ||= Promise.all(OG_FONT_WEIGHTS.map(async (weight) => {
    const res = await fetch(`${origin}/og-fonts/inter-${weight}.ttf`);
    if (!res.ok) throw new Error(`inter-${weight}.ttf: HTTP ${res.status}`);
    return { name: 'Inter', data: await res.arrayBuffer(), weight, style: 'normal' };
  })).catch((err) => {
    console.error('api/og: Inter failed to load, using the default face', err);
    fontsPromise = null;
    return null;
  });
  return fontsPromise;
}

const h = (type, props, ...children) => ({
  type,
  props: { ...(props || {}), children: children.length === 0 ? undefined : (children.length === 1 ? children[0] : children) },
});

// The brand mark on every card: the app icon (the Centre Circle Q, served by
// this deployment, so a new icon reaches the cards with no edit here) and the
// name. Set per request by the handler; every request comes in on balliq.app.
let ORIGIN = 'https://balliq.app';
const brandMark = (color) => h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
  h('img', { src: `${ORIGIN}/icon-192.png`, width: 40, height: 40, style: { width: 40, height: 40, borderRadius: 10 } }),
  h('div', { style: { fontSize: 30, fontWeight: 800, color, display: 'flex' } }, 'Ball IQ'));

// Stump-a-mate card (?t=stump): the question, answer redacted — paired with
// api/q.js. Same 1200×630 canvas, app palette (near-black + brand green).
function stumpCard(sp) {
  const qt = (sp.get('qt') || 'A football question is doing the rounds…').slice(0, 160);
  const cat = (sp.get('c') || '').slice(0, 24);
  // Long questions get a smaller face so they never clip the canvas.
  const qSize = qt.length > 110 ? 44 : qt.length > 70 ? 52 : 62;

  const tree = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#101710 0%,#0B0C10 60%)',
      fontFamily: 'Inter', position: 'relative',
      padding: '0 72px',
    },
  },
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      brandMark('#F0F1F5'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 } },
      h('div', { style: { fontSize: 26, fontWeight: 800, letterSpacing: 4, color: '#58CC02', display: 'flex' } }, 'CAN YOU GET THIS ONE?'),
      h('div', { style: { fontSize: qSize, fontWeight: 900, lineHeight: 1.15, color: '#FFFFFF', display: 'flex' } }, qt),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 } },
        h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0B0C10', background: '#58CC02', padding: '12px 26px', borderRadius: 999 } }, 'Tap to answer'),
        h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, cat ? `${cat} · free, no sign-up` : 'Free, no sign-up'),
      ),
    ),
  );
  return tree;
}

// ── THE CHALLENGE PICTURES (25 Nov 2026) ────────────────────────────────────
// What a mate sees when a /c/ link lands in a chat: Daily 7 (?t=challenge) and
// Footle, Transfer Trail and Top 10 (?t=gch). Alex gave the earlier pictures
// (a headline that bragged about the sender's score, on flat stripes) "max a 6
// out of 10", and said "Yes, all four" to this one:
//   - THE PICTURE IS THE PUZZLE, the sender's score is the dare. Top 10 shows
//     the list's own question over ten slots; Footle the sender's grid with no
//     letters; Trail the clubs it took; Daily 7 the seven answers.
//   - ON A PITCH SEEN FROM ABOVE. Everything that matters sits inside the
//     middle 630 by 630, over the centre circle, so an app that cuts the
//     picture to a square loses only the two penalty areas. His rule: it has
//     to look good "on snapchat, whatsapp, messages, messenger or WHEREVER".
//   - ⚠️ NEVER THE ANSWER, and never a claim the link does not carry. Which
//     places were named, which questions were right and the grid itself only
//     light up when the link says so (m, p, k below, checked against the
//     score); a link without them draws the honest plain form.
// Optional detail on the link, all checked here and dropped if they disagree
// with the score:
//   m   Top 10 and Daily 7: base 36 of a bit mask, bit i = place or question
//       i + 1 was got. Top 10 has ten bits, Daily 7 seven.
//   p   Footle: "<letters>.<row>.<row>…", each row base 36 of its tiles read
//       as a base 3 number (0 miss, 1 wrong spot, 2 right spot), first row
//       first. A solved grid ends in a row of all 2.
//   k   Trail: how many clubs the career has, so the ones not needed show dim.
const PITCH_A = '#092B1B', PITCH_B = '#0B3421', LIT = '#58CC02', LIT_INK = '#0B2A05', MISS = '#C23B33', MISS_INK = '#2A0806', GOLD = '#FFD34D';
const DARK = 'rgba(0,0,0,0.42)', DARK_INK = 'rgba(255,255,255,0.4)';

function pitchCard({ eye, headline, body, dare }) {
  const stripes = Array.from({ length: 12 }, (_, i) => h('div', { key: i, style: { position: 'absolute', top: 0, left: i * 100, width: 100, height: 630, background: i % 2 ? PITCH_B : PITCH_A } }));
  const line = { fill: 'none', stroke: '#FFFFFF', strokeWidth: 3 };
  const lines = h('svg', { width: 1200, height: 630, viewBox: '0 0 1200 630', style: { position: 'absolute', top: 0, left: 0, opacity: 0.11 } },
    h('rect', { x: 30, y: 30, width: 1140, height: 570, ...line }),
    h('line', { x1: 600, y1: 30, x2: 600, y2: 600, ...line }),
    h('circle', { cx: 600, cy: 315, r: 118, ...line }),
    h('rect', { x: 30, y: 135, width: 170, height: 360, ...line }),
    h('rect', { x: 30, y: 230, width: 62, height: 170, ...line }),
    h('path', { d: 'M200 255 A 76 76 0 0 1 200 375', ...line }),
    h('rect', { x: 1000, y: 135, width: 170, height: 360, ...line }),
    h('rect', { x: 1108, y: 230, width: 62, height: 170, ...line }),
    h('path', { d: 'M1000 255 A 76 76 0 0 0 1000 375', ...line }),
  );
  const n = headline.length;
  const size = n > 40 ? 44 : n > 30 ? 50 : n > 20 ? 56 : 60;
  return h('div', { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: PITCH_A, fontFamily: 'Inter' } },
    ...stripes, lines,
    h('div', { style: { width: 590, display: 'flex', flexDirection: 'column', alignItems: 'center' } },
      h('div', { style: { display: 'flex', fontSize: 23, fontWeight: 800, letterSpacing: 3.2, color: 'rgba(255,255,255,0.66)' } }, eye.toUpperCase()),
      h('div', { style: { display: 'flex', justifyContent: 'center', textAlign: 'center', marginTop: 16, fontSize: size, fontWeight: 900, lineHeight: 1.04, letterSpacing: -size * 0.035, color: '#FFFFFF' } }, headline),
      body,
      h('div', { style: { display: 'flex', marginTop: 28, fontSize: 33, fontWeight: 700, lineHeight: 1.15, color: 'rgba(255,255,255,0.9)' } },
        // Satori drops the space at the edge of a flex item, and sets the spaces inside a `pre` item unevenly:
        // each part is trimmed and the space it began or ended with is given back as a margin.
        ...dare.map((part, i) => h('div', { key: i, style: { display: 'flex', marginLeft: /^\s/.test(part) ? 9 : 0, marginRight: /\s$/.test(part) ? 9 : 0, ...(i % 2 ? { color: GOLD, fontWeight: 900 } : null) } }, part.trim()))),
      h('div', { style: { display: 'flex', marginTop: 16, fontSize: 21, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } }, 'balliq.app'),
    ),
  );
}

// A bit mask from the link, or null: only digits and letters, and exactly as
// many places lit as the score says.
function maskFor(raw, bits, score) {
  if (!/^[0-9a-z]{1,3}$/.test(raw || '')) return null;
  const v = parseInt(raw, 36);
  if (!Number.isFinite(v) || v < 0 || v >= 2 ** bits) return null;
  const got = Array.from({ length: bits }, (_, i) => Boolean(v & (1 << i)));
  return got.filter(Boolean).length === score ? got : null;
}

// Numbered discs joined by a line: the first lit are green, the rest dim.
function discRow(total, lit, caption) {
  const size = Math.min(66, Math.floor((590 - (total - 1) * 20) / total));
  const link = Math.min(34, Math.max(12, Math.floor((590 - total * size) / Math.max(1, total - 1))));
  const row = [];
  for (let i = 0; i < total; i++) {
    if (i) row.push(h('div', { key: 'l' + i, style: { width: link, height: 5, background: 'rgba(255,255,255,0.22)' } }));
    row.push(h('div', { key: 'd' + i, style: { width: size, height: size, borderRadius: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.42), fontWeight: 900, background: i < lit ? LIT : DARK, color: i < lit ? LIT_INK : DARK_INK } }, String(i + 1)));
  }
  return h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 34 } },
    h('div', { style: { display: 'flex', alignItems: 'center' } }, ...row),
    h('div', { style: { display: 'flex', marginTop: 12, fontSize: 20, fontWeight: 700, letterSpacing: 2.4, color: 'rgba(255,255,255,0.5)' } }, caption));
}

function challengeCard(sp) {
  const score = Math.min(7, Math.max(0, parseInt(sp.get('s') || '0', 10) || 0));
  const name = (sp.get('n') || '').slice(0, 22);
  const dateLabel = (sp.get('d') || '').slice(0, 12);
  const who = name || 'Your mate';
  const got = maskFor(sp.get('m'), 7, score);
  // With the mask each dot is its question, in order. Without it the dots only
  // count: greens first, no numbers, so nothing says WHICH ones were right.
  const dots = Array.from({ length: 7 }, (_, i) => {
    const ok = got ? got[i] : i < score;
    return h('div', { key: i, style: { width: 62, height: 62, borderRadius: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, background: ok ? LIT : MISS, color: ok ? LIT_INK : MISS_INK } }, got ? String(i + 1) : '');
  });
  const dare = score === 7 ? [who + ' got ', 'all 7', '. Match that.'] : score === 0 ? [who + ' got ', 'none', '. Can you?'] : [who + ' got ', String(score), ' of 7. Beat that.'];
  return pitchCard({
    eye: dateLabel ? 'Daily 7 · ' + dateLabel : 'Daily 7',
    headline: 'Seven football questions',
    body: h('div', { style: { display: 'flex', gap: 14, marginTop: 34 } }, ...dots),
    dare,
  });
}

// The Top 10 list's own question, by its number. The website serves the same
// schedule the app plays (/data/top10.json); read once per isolate, and a
// failed read falls back to a plain headline rather than failing the card.
let top10Promise = null;
async function top10Title(no) {
  if (!no) return '';
  top10Promise ||= Promise.race([
    fetch(ORIGIN + '/data/top10.json').then((r) => (r.ok ? r.json() : null)),
    new Promise((resolve) => setTimeout(() => resolve(null), 2500)),
  ]).catch(() => null).then((j) => { if (!j) top10Promise = null; return j; });
  const j = await top10Promise;
  const id = j && Array.isArray(j.log) ? j.log[no - 1] : null;
  const title = id && j.lists && j.lists[id] ? j.lists[id].title : '';
  return typeof title === 'string' ? title.slice(0, 60) : '';
}

// Footle's grid from the link: rows of 0 / 1 / 2, or null.
function footleRows(raw, score) {
  const parts = String(raw || '').split('.');
  const cols = parseInt(parts[0], 10);
  if (!(cols >= 3 && cols <= 12) || parts.length < 2 || parts.length > 7) return null;
  const rows = [];
  for (const p of parts.slice(1)) {
    if (!/^[0-9a-z]{1,5}$/.test(p)) return null;
    const v = parseInt(p, 36);
    if (!Number.isFinite(v) || v < 0 || v >= 3 ** cols) return null;
    rows.push(v.toString(3).padStart(cols, '0'));
  }
  const solved = /^2+$/.test(rows[rows.length - 1]);
  if (score > 0 ? (rows.length !== score || !solved) : (rows.length !== 6 || solved)) return null;
  return rows;
}

async function gameChallengeCard(sp) {
  const code = (sp.get('g') || 'f').slice(0, 1);
  const game = { f: 'Footle', t: 'Transfer Trail', x: 'Top 10' }[code] || 'Footle';
  const s = Math.max(0, Math.min(12, parseInt(sp.get('s') || '0', 10) || 0));
  const no = (sp.get('no') || '').replace(/[^0-9]/g, '').slice(0, 5);
  const name = (sp.get('n') || '').slice(0, 22);
  const who = name || 'Your mate';
  const eye = no ? game + ' · No. ' + no : game;

  if (code === 'x') {
    const score = Math.min(10, s);
    const got = maskFor(sp.get('m'), 10, score);
    const slot = (i) => h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12 } },
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', width: 30, fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.55)' } }, String(i + 1)),
      h('div', { style: { width: 215, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, background: got && got[i] ? LIT : DARK, color: DARK_INK } }, got && got[i] ? '' : '?'));
    const col = (from) => h('div', { style: { display: 'flex', flexDirection: 'column', gap: 9 } }, ...[0, 1, 2, 3, 4].map((k) => slot(from + k)));
    const dare = score === 10 ? [who + ' named ', 'all 10', '. Match that.'] : score === 0 ? [who + ' named ', 'none', '. Can you?'] : [who + ' named ', String(score), ' of 10. Beat that.'];
    return pitchCard({ eye, headline: (await top10Title(parseInt(no, 10))) || 'Name the top ten', body: h('div', { style: { display: 'flex', gap: 26, marginTop: 26 } }, col(0), col(5)), dare });
  }

  if (code === 't') {
    const total = Math.max(0, Math.min(12, parseInt(sp.get('k') || '0', 10) || 0));
    const dare = s <= 0 ? [who + ' missed him. Can you get him?'] : s === 1 ? [who + ' got him in ', '1', '. Match that.'] : [who + ' got him in ', String(s), '. Beat that.'];
    // Without k the dim discs are left out: how many clubs the career has is
    // not ours to guess.
    const n = total >= s && total > 0 ? total : s;
    return pitchCard({ eye, headline: 'Whose career is this?', body: n > 0 ? discRow(n, s, 'CLUBS SHOWN') : h('div', { style: { display: 'flex', marginTop: 20 } }), dare });
  }

  const score = Math.min(6, s);
  const rows = footleRows(sp.get('p'), score);
  let body;
  if (rows) {
    const cols = rows[0].length;
    const t = Math.min(58, Math.floor((300 - (rows.length - 1) * 8) / rows.length), Math.floor((590 - (cols - 1) * 8) / cols));
    body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 30 } },
      ...rows.map((row, r) => h('div', { key: r, style: { display: 'flex', gap: 8 } },
        ...[...row].map((c, i) => h('div', { key: i, style: { width: t, height: t, borderRadius: Math.round(t * 0.2), background: c === '2' ? LIT : c === '1' ? '#FFC107' : DARK } })))));
  } else {
    body = discRow(6, score, 'GUESSES');
  }
  const dare = score <= 0 ? ['Footle beat ' + (name || 'your mate') + '. Can you solve it?'] : score === 1 ? [who + ' solved it in ', '1', '. Match that.'] : [who + ' solved it in ', String(score), '. Beat that.'];
  return pitchCard({ eye, headline: 'Guess the footballer', body, dare });
}

// Stitch-up card (?t=stitch, 16 Oct 2026), paired with api/s.js: who sent it,
// the taunt and how many clubs show. ⚠️ NEVER THE ANSWER: no player and no
// club reaches this function (the link carries a hash, not a name). Trail
// blue, sentence case, no eyebrow.
function stitchCard(sp) {
  const name = cleanStitchName(sp.get('n') || '');
  const k = parseInt(sp.get('k') || '', 10);
  const taunt = Number.isInteger(k) && k >= 0 && k < STITCH_TAUNTS.length ? STITCH_TAUNTS[k] : '';
  const c = Math.max(2, Math.min(12, parseInt(sp.get('c') || '2', 10) || 2));
  const blue = '#7CC3F0'; // src/lib/accents.js MODE_ACCENT.trail
  const head = stitchHeadline(name);
  return h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#0f1820 0%,#0B0C10 60%)',
      fontFamily: 'Inter', position: 'relative', padding: '0 72px',
    },
  },
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      brandMark('#F0F1F5'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, 'Stitch-up'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 } },
      h('div', { style: { fontSize: head.length > 46 ? 62 : 70, fontWeight: 900, lineHeight: 1.08, letterSpacing: -1.5, color: '#FFFFFF', display: 'flex' } }, head),
      ...(taunt ? [h('div', { style: { fontSize: 36, fontWeight: 700, color: blue, display: 'flex' } }, `“${taunt}”`)] : []),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 } },
        h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0B0C10', background: blue, padding: '12px 26px', borderRadius: 999 } }, 'Name him'),
        h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, `${c} clubs to start · five guesses · free`),
      ),
    ),
  );
}

// Mates' league invite card (?t=league, phase 1), paired with api/l.js. The
// league's name, who sent it and the format. NO member count and NO table:
// nothing about a league's size reaches a stranger. Sentence case throughout.
function leagueCard(sp) {
  const name = (sp.get('n') || '').slice(0, 32) || "Mates' league";
  const who = (sp.get('w') || '').slice(0, 22) || 'A mate';
  const gold = '#FFC107';
  return h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#17150d 0%,#0B0C10 60%)',
      fontFamily: 'Inter', position: 'relative', padding: '0 72px',
    },
  },
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      brandMark('#F0F1F5'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 } },
      h('div', { style: { fontSize: 32, fontWeight: 700, color: gold, display: 'flex' } }, `${who} invited you`),
      h('div', { style: { fontSize: name.length > 18 ? 76 : 96, fontWeight: 900, lineHeight: 1.02, letterSpacing: -2, color: '#FFFFFF', display: 'flex' } }, name),
      h('div', { style: { fontSize: 28, fontWeight: 600, color: '#9BA0B8', display: 'flex' } }, 'Mon to Sun · Footle, Daily 7, Transfer Trail, Top 10 · Free'),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 10 } },
        h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0B0C10', background: '#58CC02', padding: '12px 26px', borderRadius: 999 } }, 'Join the league'),
        h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, 'Points start the day you join'),
      ),
    ),
  );
}

// Multiplayer invite card (?t=invite): a /join/CODE link previewed as an
// invitation rather than a generic app ad. Before this, every invite unfurled
// as the static index.html card ("The Ultimate Football Quiz") — the recipient
// could not tell an invite from a download link, so the room code (the one
// thing they need) was invisible until they tapped.
function inviteCard(sp) {
  const code = (sp.get('c') || '').slice(0, 6);
  const name = (sp.get('n') || '').slice(0, 22);
  const who = name || 'A mate';

  // The code is the payload — render it as discrete glyph tiles so it stays
  // legible in a thumbnailed chat preview and can be typed in by hand if the
  // tap-through ever fails.
  const tiles = code
    ? Array.from(code, (ch, i) =>
        h('div', {
          key: i,
          style: {
            width: 78, height: 96, borderRadius: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 52, fontWeight: 900, color: '#FFFFFF',
            background: '#1A1D27', border: '2px solid #2A2E3C',
          },
        }, ch)
      )
    : [];

  const tree = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#101710 0%,#0B0C10 60%)',
      fontFamily: 'Inter', position: 'relative',
      padding: '0 72px',
    },
  },
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      brandMark('#F0F1F5'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 } },
      h('div', { style: { fontSize: 26, fontWeight: 800, letterSpacing: 4, color: '#58CC02', display: 'flex' } }, 'MULTIPLAYER INVITE'),
      h('div', { style: { fontSize: 60, fontWeight: 900, lineHeight: 1.1, color: '#FFFFFF', display: 'flex' } }, `${who} wants to play you`),
      ...(tiles.length
        ? [h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 700, color: '#9BA0B8', marginRight: 8 } }, 'ROOM'),
            ...tiles,
          )]
        : []),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 } },
        h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0B0C10', background: '#58CC02', padding: '12px 26px', borderRadius: 999 } }, 'Tap to join'),
        h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, 'Head-to-head · free, no sign-up'),
      ),
    ),
  );
  return tree;
}

// Club / category landing card (?t=club): the SEO pages (/quiz/<slug>/) point
// og:image here instead of the static app card, so a shared link unfurls as
// "How well do you know Arsenal?" with the club's own colour — infinitely more
// clickable to a fan than a generic "Ultimate Football Quiz · 3,900+ questions"
// ad. `n` = display name, `b` = 3-letter badge, `c` = brand hex, `k` = kind
// label (e.g. "Club quiz" / "League quiz"). All are presentation; no payload.
function clubCard(sp) {
  const name = (sp.get('n') || 'Football').slice(0, 28);
  const badge = (sp.get('b') || '').slice(0, 4).toUpperCase();
  const kind = (sp.get('k') || 'Quiz').slice(0, 20);
  // Sanitise the colour to a hex literal — this string goes straight into a
  // style value, and the param is attacker-influenceable via a crafted link.
  const rawC = sp.get('c') || '';
  const brand = /^#?[0-9a-fA-F]{6}$/.test(rawC) ? (rawC[0] === '#' ? rawC : '#' + rawC) : '#58CC02';
  // Dark brand colours (Juventus, Newcastle) need light badge text; light ones
  // (Dortmund yellow, Madrid white) need dark. Same luminance test the site uses.
  const r = parseInt(brand.slice(1, 3), 16), g = parseInt(brand.slice(3, 5), 16), b = parseInt(brand.slice(5, 7), 16);
  const badgeText = (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0B0C10' : '#FFFFFF';

  const tree = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#101710 0%,#0B0C10 60%)',
      fontFamily: 'Inter', position: 'relative',
      padding: '0 72px',
    },
  },
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      brandMark('#F0F1F5'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', alignItems: 'center', gap: 40 } },
      ...(badge ? [h('div', {
        style: {
          width: 150, height: 150, borderRadius: 32, display: 'flex', flexShrink: 0,
          alignItems: 'center', justifyContent: 'center',
          fontSize: 54, fontWeight: 900, letterSpacing: 2,
          background: brand, color: badgeText, border: '2px solid rgba(255,255,255,0.12)',
        },
      }, badge)] : []),
      // flex: 1 bounds the column to the space left of the badge, so a long
      // headline wraps instead of running off the canvas.
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 18 } },
        h('div', { style: { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: '#58CC02', display: 'flex' } }, kind.toUpperCase()),
        h('div', { style: { fontSize: 66, fontWeight: 900, lineHeight: 1.05, color: '#FFFFFF', display: 'flex' } }, `How well do you know ${name}?`),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 } },
          h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0B0C10', background: '#58CC02', padding: '12px 26px', borderRadius: 999 } }, 'Play free'),
          h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, 'No sign-up · answers explained'),
        ),
      ),
    ),
  );
  return tree;
}

// Club-quiz SCORE card (?t=iq) — paired with api/iq.js.
//
// This is the authority lever. Our own ranking diagnosis says the fundamentals
// are clean and the ceiling on "football quiz" is links, not pages; we took 11
// referral sessions in the week to 2026-08-13. A score is the one thing a
// football fan will voluntarily paste into a group chat, so it needs to unfurl
// as something worth pasting — the club's own colour, a number, and the club's
// own vocabulary for what that number means.
function scoreCard(sp) {
  const name = (sp.get('n') || 'Football').slice(0, 28);
  const badge = (sp.get('b') || '').slice(0, 4).toUpperCase();
  const tier = (sp.get('r') || '').slice(0, 28);
  const iq = String(Math.min(999, Math.max(0, parseInt((sp.get('iq') || '0').slice(0, 4), 10) || 0)));
  const line = (sp.get('sc') || '').slice(0, 12).replace(/[^0-9/]/g, '');
  // Sender's name. The kicker line has ~34 chars of safe width next to the
  // 250px badge; a combo that would overflow moves the name to the caption
  // instead of risking a clipped card.
  const sender = (sp.get('p') || '').slice(0, 14);
  const senderInKicker = sender && (sender.length + name.length) <= 30;
  // Same hex sanitiser and luminance test as clubCard — the colour goes
  // straight into a style value and the param rides in from a crafted link.
  const rawC = sp.get('c') || '';
  const brand = /^#?[0-9a-fA-F]{6}$/.test(rawC) ? (rawC[0] === '#' ? rawC : '#' + rawC) : '#58CC02';
  const r = parseInt(brand.slice(1, 3), 16), g = parseInt(brand.slice(3, 5), 16), b = parseInt(brand.slice(5, 7), 16);
  const onBrand = (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0B0C10' : '#FFFFFF';

  const tree = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg,#101710 0%,#0B0C10 60%)',
      fontFamily: 'Inter', position: 'relative',
      padding: '0 72px',
    },
  },
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      brandMark('#F0F1F5'),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: '#F0F1F5', opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', alignItems: 'center', gap: 48 } },
      h('div', {
        style: {
          width: 250, height: 250, borderRadius: 40, display: 'flex', flexShrink: 0,
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: brand, color: onBrand, border: '2px solid rgba(255,255,255,0.12)',
        },
      },
        h('div', { style: { fontSize: 22, fontWeight: 800, letterSpacing: 3, opacity: 0.75, display: 'flex' } }, badge || 'IQ'),
        h('div', { style: { fontSize: 118, fontWeight: 900, lineHeight: 1, display: 'flex' } }, iq),
      ),
      // flex: 1 bounds the column so a long tier name wraps on the canvas.
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 14 } },
        h('div', { style: { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: '#9BA0B8', display: 'flex' } }, senderInKicker ? `${sender.toUpperCase()}'S ${name.toUpperCase()} IQ` : `${name.toUpperCase()} IQ`),
        ...(tier ? [h('div', { style: { fontSize: 72, fontWeight: 900, lineHeight: 1.04, color: '#FFFFFF', display: 'flex' } }, tier)] : []),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 } },
          ...(line ? [h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0B0C10', background: '#58CC02', padding: '12px 26px', borderRadius: 999 } }, `${line} correct`)] : []),
          h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: '#9BA0B8' } }, sender && !senderInKicker ? `Beat ${sender} — free, no sign-up` : 'Beat it — free, no sign-up'),
        ),
      ),
    ),
  );
  return tree;
}

export default async function handler(req) {
  const url = new URL(req.url);
  ORIGIN = url.origin;
  const fonts = await loadFonts(url.origin);
  return new ImageResponse(await cardTree(url.searchParams), {
    width: 1200, height: 630, emoji: 'twemoji', ...(fonts && { fonts }),
  });
}

// Every card is a plain element tree; the handler turns it into the PNG.
function cardTree(sp) {
  if (sp.get('t') === 'iq') return scoreCard(sp);
  if (sp.get('t') === 'stump') return stumpCard(sp);
  if (sp.get('t') === 'challenge') return challengeCard(sp);
  if (sp.get('t') === 'gch') return gameChallengeCard(sp);
  if (sp.get('t') === 'invite') return inviteCard(sp);
  if (sp.get('t') === 'league') return leagueCard(sp);
  if (sp.get('t') === 'stitch') return stitchCard(sp);
  if (sp.get('t') === 'club') return clubCard(sp);
  const name = (sp.get('n') || 'Ball IQ Player').slice(0, 22);
  let img = sp.get('img') || '';
  // SSRF guard: this endpoint fetches `img` server-side, so only proxy images
  // from our own Supabase storage host. Any attacker-controlled ?img= URL is
  // dropped to the emoji fallback rather than fetched.
  if (img) {
    try {
      const u = new URL(img);
      if (u.protocol !== 'https:' || u.hostname !== 'blcisypmngimqkwxrrdm.supabase.co') img = '';
    } catch { img = ''; }
  }
  // Clamp every free-text param — this is a compute-billed edge function, so
  // unbounded inputs are a cost/abuse vector (n/qt/c were already sliced; e/ov/r
  // were not — medical security-client finding). Ratings also caps its entry
  // count so a giant CSV can't fan out the render.
  const emoji = (sp.get('e') || '⚽').slice(0, 8);
  const overall = (sp.get('ov') || '—').slice(0, 4);
  // Own-property guard: prototype keys like ti=constructor resolve truthy on a
  // plain object lookup and would render the card with undefined styling
  // (fresh-code audit — no crash, but deterministic fallback is better).
  const tiKey = sp.get('ti');
  // tierPalette resolves the CURRENT keys and the legacy elite/pro/prospect
  // that every already-shared /p link still carries.
  const t = tierPalette(tiKey);
  const ratings = (sp.get('r') || '').slice(0, 64).split(',').slice(0, 6);
  // ⚠️ SLOT 0 IS THE SHARER'S OWN LEAGUE, so the label has to travel with the
  // numbers. `r` is POSITIONAL, and without `lg` a La Liga rating would be
  // published under "EPL" on every unfurl — the same English bias the card
  // itself just shed, except public. Links shared before 2026-09-10 carry no
  // `lg` and fall back to the Premier League, which is what they meant.
  const lg = (sp.get('lg') || '').slice(0, 16);
  const league = LEAGUE_FACES.find((l) => l.cat === lg) || LEAGUE_FACES[0];
  const comps = [league, ...CARD_COMPS.slice(1)];
  // `s` = day streak (same param the /p description line uses). ≥2 earns a flame
  // chip — a 0/1 "streak" is noise, not a brag.
  const streak = Math.min(9999, Math.max(0, parseInt((sp.get('s') || '0').slice(0, 5), 10) || 0));
  // Strongest league = highest of the six ratings (first wins ties); its chip
  // gets an accent ring. -1 (no valid numbers) elevates nothing.
  let bestIdx = -1;
  let bestVal = -Infinity;
  ratings.forEach((v, i) => {
    const num = parseInt(v, 10);
    if (Number.isFinite(num) && num > bestVal) { bestVal = num; bestIdx = i; }
  });

  const avatarInner = img
    ? h('img', { src: img, width: 190, height: 190, style: { width: 190, height: 190, borderRadius: 95, objectFit: 'cover' } })
    : h('div', { style: { width: 190, height: 190, borderRadius: 95, background: '#16181F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 } }, emoji);
  const avatar = h('div', { style: { display: 'flex', padding: 5, borderRadius: 102, background: t.accent } }, avatarInner);

  // Every cell carries the same border/padding (transparent when not the best)
  // so the elevated chip doesn't knock the grid out of alignment.
  const cell = (comp, val, isBest) => h('div', {
    style: {
      display: 'flex', alignItems: 'center', gap: 12, width: 256,
      padding: '6px 12px', borderRadius: 14,
      border: isBest ? `2px solid ${t.accent}` : '2px solid transparent',
      background: isBest ? 'rgba(255,255,255,0.07)' : 'transparent',
    },
  },
    h('div', { style: { fontSize: 34, display: 'flex' } }, comp.icon),
    h('div', { style: { fontSize: 48, fontWeight: 900, color: t.accent, display: 'flex' } }, val || '—'),
    h('div', { style: { fontSize: 23, fontWeight: 700, color: t.text, opacity: 0.85, display: 'flex' } }, comp.abbr),
  );
  const rows = [];
  for (let i = 0; i < 6; i += 2) {
    rows.push(h('div', { style: { display: 'flex', gap: 26 } },
      cell(comps[i], ratings[i], i === bestIdx),
      cell(comps[i + 1], ratings[i + 1], i + 1 === bestIdx)));
  }

  const tree = h('div', {
    style: {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: t.bg, fontFamily: 'Inter', position: 'relative',
      padding: '0 64px',
    },
  },
    h('div', { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 38%)' } }),
    h('div', { style: { position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      brandMark(t.text),
      h('div', { style: { fontSize: 22, fontWeight: 500, color: t.text, opacity: 0.6, display: 'flex' } }, 'balliq.app'),
    ),
    h('div', { style: { flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 56 } },
      // Overall block
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' } },
        h('div', { style: { fontSize: 150, fontWeight: 900, color: t.accent, lineHeight: 1, display: 'flex' } }, overall),
        h('div', { style: { fontSize: 24, fontWeight: 800, letterSpacing: 3, color: t.text, opacity: 0.65, marginTop: 6, display: 'flex' } }, 'OVERALL'),
        h('div', { style: { fontSize: 26, fontWeight: 800, letterSpacing: 2, color: t.accent, marginTop: 10, display: 'flex' } }, t.label),
      ),
      // Avatar + name (+ streak chip when the streak is worth bragging about)
      // maxWidth keeps a long name from shoving the overall and the ratings
      // off the canvas: it steps down a size and wraps under the avatar.
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 260 } },
        avatar,
        h('div', { style: { fontSize: name.length > 16 ? 32 : name.length > 10 ? 38 : 44, lineHeight: 1.1, fontWeight: 800, color: t.text, marginTop: 18, display: 'flex', textAlign: 'center', justifyContent: 'center' } }, name),
        ...(streak >= 2 ? [
          h('div', { style: { display: 'flex', alignItems: 'center', fontSize: 24, fontWeight: 800, color: t.text, background: 'rgba(255,255,255,0.08)', padding: '8px 20px', borderRadius: 999, marginTop: 14 } }, `🔥 ${streak} day streak`),
        ] : []),
      ),
      // Ratings
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 24 } }, ...rows),
    ),
    // Challenge line — same tone as the Daily-7 card's "Beat it today" CTA.
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, paddingBottom: 30 } },
      h('div', { style: { display: 'flex', fontSize: 24, fontWeight: 800, color: '#0B0C10', background: t.accent, padding: '10px 24px', borderRadius: 999 } }, 'Think you can beat this?'),
      h('div', { style: { display: 'flex', fontSize: 22, fontWeight: 600, color: t.text, opacity: 0.65 } }, 'Free football trivia · balliq.app'),
    ),
  );

  return tree;
}
