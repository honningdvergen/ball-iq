// Share cards, second design (23 Oct 2026), for the daily modes.
//
// WHY A SECOND DESIGN. The first cards were drawn on a 390×600 canvas, so in a
// chat thumbnail their type came out a few pixels tall (Alex, testing in
// Messages and Snapchat: "horrendous"). Research brief, the same day: the
// result cards that spread (Wrapped, Sofascore screenshots, FUT, Wordle) lead
// with ONE big number, add one line worth bragging about, show the path without
// the answer, and are built for a 9:16 story while keeping everything that
// matters inside the middle square, which is what a chat crop keeps.
//
// The spec, on a 1080×1920 canvas:
//   - nothing smaller than 36 px, and bold weights only (compression eats thin);
//   - the hero, the brag line and the path between y 420 and 1500;
//   - near-black ground with one accent: the mode's own colour;
//   - the Q and "Ball IQ" small at the top, the address small at the foot;
//   - spoiler-free: no player, no club, no answer.
import { tint } from './colourMath.js';

const W = 1080, H = 1920, CX = W / 2;
const BG = '#101318';
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function load(url) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    setTimeout(() => res(null), 1500);
    im.src = url;
  });
}
function text(ctx, s, x, y, size, weight, color, align = 'center') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}

// The hero: a big figure with an optional smaller tail ("9" + "/10"), centred
// as one word.
function hero(ctx, big, tail, y, color) {
  ctx.font = `900 400px ${FONT}`;
  const bw = ctx.measureText(big).width;
  ctx.font = `800 140px ${FONT}`;
  const tw = tail ? ctx.measureText(tail).width + 14 : 0;
  const x0 = CX - (bw + tw) / 2;
  text(ctx, big, x0, y, 400, 900, color, 'left');
  if (tail) text(ctx, tail, x0 + bw + 14, y, 140, 800, '#8E94A8', 'left');
}

// One green and one amber on every card (critic, 23 Oct: five near-greens and
// two ambers across the set read as a rendering error).
const GREEN = '#7BE04A', AMBER = '#F5B82E', DARK = '#262A35', LOSS = '#E5484D';
const tick = (ctx, x, y, s, color) => {
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.28, y + s * 0.02); ctx.lineTo(x - s * 0.06, y + s * 0.24); ctx.lineTo(x + s * 0.3, y - s * 0.22); ctx.stroke();
};
// Rows of tiles, each row centred on its own so a short last row sits in the
// middle instead of hanging off the left.
function tiles(ctx, items, { cols, tile, gap, top, bottom = 1400, radius = 14, draw }) {
  const rows = Math.ceil(items.length / cols);
  const h = rows * tile + (rows - 1) * gap;
  const y0 = top + Math.max(0, (bottom - top - h) / 2);
  for (let r = 0; r < rows; r++) {
    const row = items.slice(r * cols, (r + 1) * cols);
    const x0 = CX - (row.length * tile + (row.length - 1) * gap) / 2;
    row.forEach((it, i) => draw(it, x0 + i * (tile + gap), y0 + r * (tile + gap), tile, radius, r * cols + i));
  }
}
const fill = (ctx, color) => (it, x, y, t, rad) => { ctx.fillStyle = color(it); rr(ctx, x, y, t, t, rad); ctx.fill(); };

// Each mode: its colour, its header, what the hero says, a brag line that only
// ever brags (critic: "4 below par" and "1 hint used" are confessions, not
// something anyone posts), a quiet second line, and the path drawing in the
// band between y 1000 and 1400.
const MODES = {
  footle: {
    acc: '#8AE042', name: 'FOOTLE', path_: 'footle',
    hero: (d) => (d.failed ? ['X', '/6'] : [String(d.score), '/6']),
    label: (d) => (d.failed ? 'not today' : d.score === 1 ? 'first guess' : 'guesses'),
    brag: (d) => (d.streak > 1 ? `🔥 ${d.streak}-day streak` : d.score === 1 ? 'First time of asking' : d.hard ? 'Hard mode' : ''),
    path(ctx, d) {
      const g = Array.isArray(d.grades) ? d.grades : [];
      const cols = g[0]?.length || 5;
      const col = { green: GREEN, yellow: AMBER, grey: DARK };
      tiles(ctx, g.flat(), { cols, tile: Math.min(104, Math.floor((400 - (g.length - 1) * 16) / Math.max(1, g.length))), gap: 16, top: 1000, radius: 18, draw: fill(ctx, (c) => col[c] || DARK) });
    },
  },
  draft: {
    acc: '#FF8FB8', name: 'DRAFT', path_: 'draft',
    hero: (d) => [String(d.pts ?? 0), ''],
    label: (d) => (d.par != null ? `points · par ${d.par}` : 'points'),
    brag: (d) => {
      if (d.par != null && d.pts > d.par) return `Beat par by ${d.pts - d.par}`;
      if (d.par != null && d.pts === d.par) return 'Level with par';
      return d.streak > 1 ? `🔥 ${d.streak}-day streak` : `${d.w} wins`;
    },
    sub: (d) => `Won ${d.w} · Drew ${d.d} · Lost ${d.l}`,
    path(ctx, d) {
      // The season as a strip: two rows of nineteen, in the order played.
      const col = { w: GREEN, d: '#555B6E', l: LOSS };
      tiles(ctx, Array.isArray(d.matches) ? d.matches : [], { cols: 19, tile: 46, gap: 6, top: 1040, bottom: 1360, radius: 9, draw: fill(ctx, (r) => col[r] || col.d) });
    },
  },
  top10: {
    acc: '#FF9B7A', name: 'TOP 10', path_: 'top10',
    hero: (d) => [String((d.found || []).filter(Boolean).length), `/${(d.found || []).length || 10}`],
    label: () => 'found',
    brag: (d) => {
      const all = (d.found || []).length > 0 && (d.found || []).every(Boolean);
      const h = Number(d.hints) || 0, l = Number(d.lives) || 0;
      if (all) return h ? 'All ten' : l === 3 ? 'All ten, not a life lost' : 'All ten, no hints';
      if (!h) return 'No hints needed';
      return d.streak > 1 ? `🔥 ${d.streak}-day streak` : '';
    },
    sub: (d) => d.title || '',
    path(ctx, d, acc) {
      tiles(ctx, (d.found || []).slice(0, 10), { cols: 5, tile: 150, gap: 20, top: 1000, radius: 26, draw: (ok, x, y, t, rad, i) => {
        ctx.fillStyle = ok ? acc : '#20242E'; rr(ctx, x, y, t, t, rad); ctx.fill();
        text(ctx, String(i + 1), x + t / 2, y + t / 2 + 20, 56, 900, ok ? '#2A0E05' : '#4E5466');
      } });
    },
  },
  trail: {
    acc: '#7CC3F0', name: 'TRANSFER TRAIL', path_: 'trail',
    hero: (d) => (d.won ? [String(d.clubsUsed), ''] : ['X', '']),
    label: (d) => (d.won ? (d.clubsUsed === 1 ? 'club needed' : 'clubs needed') : 'not today'),
    brag: (d) => (!d.won ? '' : d.streak > 1 ? `🔥 ${d.streak}-day streak` : d.clubsUsed <= 2 ? 'Barely needed the clues' : 'Got him'),
    path(ctx, d, acc) {
      // The trail as a chain of clubs: the ones it took, the one that clicked
      // (ticked, in the accent) and the ones never needed, outlined.
      const max = Number(d.max) || 5, used = d.won ? Math.min(max, Number(d.clubsUsed) || 0) : max;
      const r = 55, gap = 60, w = max * 2 * r + (max - 1) * gap, x0 = CX - w / 2 + r, y = 1200;
      ctx.fillStyle = '#2A3A4A'; ctx.fillRect(x0, y - 3, (max - 1) * (2 * r + gap), 6);
      for (let i = 0; i < max; i++) {
        const x = x0 + i * (2 * r + gap), hit = d.won && i === used - 1, before = i < used - (d.won ? 1 : 0) || (!d.won);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        if (hit) { ctx.fillStyle = acc; ctx.fill(); tick(ctx, x, y, r * 1.3, '#04202E'); }
        else if (before) { ctx.fillStyle = '#2A3A4A'; ctx.fill(); }
        else { ctx.fillStyle = BG; ctx.fill(); ctx.strokeStyle = 'rgba(124,195,240,0.3)'; ctx.lineWidth = 5; ctx.stroke(); }
      }
    },
  },
  mystery: {
    acc: '#B9A5FF', name: 'MYSTERY PLAYER', path_: 'mystery',
    hero: (d) => (d.won ? [String((d.bands || []).length), ''] : ['?', '']),
    label: (d) => (d.won ? ((d.bands || []).length === 1 ? 'guess' : 'guesses') : 'gave up'),
    brag: (d) => (!d.won ? '' : d.streak > 1 ? `🔥 ${d.streak}-day streak` : (d.bands || []).length <= 3 ? 'Barely needed a clue' : 'Got him'),
    path(ctx, d) {
      // Coldest first, ending on the answer. Close guesses are the same green
      // as the answer but hollow: one green, two meanings told by fill.
      const b = (d.bands || []).slice(-30);
      const tile = b.length <= 10 ? 84 : 72;
      tiles(ctx, b, { cols: 10, tile, gap: 12, top: 1000, radius: 18, draw: (x0, x, y, t, rad) => {
        rr(ctx, x, y, t, t, rad);
        if (x0 === 'hot') { ctx.fillStyle = 'rgba(123,224,74,0.14)'; ctx.fill(); ctx.strokeStyle = GREEN; ctx.lineWidth = 6; rr(ctx, x + 3, y + 3, t - 6, t - 6, rad - 3); ctx.stroke(); }
        else { ctx.fillStyle = x0 === 'win' ? GREEN : x0 === 'warm' ? AMBER : DARK; ctx.fill(); }
      } });
    },
  },
};

export const V2_TYPES = new Set(['wordle', 'draft', 'top10', 'trail', 'mystery']);

export async function renderShareCardV2(type, data = {}) {
  const key = type === 'wordle' ? 'footle' : type;
  const M = MODES[key];
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  try { if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1000))]); } catch { /* default face */ }
  ctx.textBaseline = 'alphabetic';

  // Ground: near-black, one wash of the mode's colour from the top.
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(CX, 680, 0, CX, 680, 900);
  glow.addColorStop(0, tint(M.acc, 0.16)); glow.addColorStop(1, tint(M.acc, 0));
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // Top: the Q and the name, small and quiet.
  const q = await load('/marketing/ball.png');
  ctx.globalAlpha = 0.75;
  ctx.font = `800 40px ${FONT}`;
  const nameW = ctx.measureText('Ball IQ').width;
  const markW = q ? 54 + 16 : 0, bx = CX - (markW + nameW) / 2;
  if (q) ctx.drawImage(q, bx, 168, 54, 54);
  text(ctx, 'Ball IQ', bx + markW, 210, 40, 800, '#F2F3F7', 'left');
  ctx.globalAlpha = 1;

  // The mode, tracked, and the day's number, not ("FOOTLE #120").
  ctx.font = `800 44px ${FONT}`;
  const nm = M.name, no = Number(data.num) > 0 ? `  #${data.num}` : '';
  const trackW = [...nm].reduce((a, c) => a + ctx.measureText(c).width + 6, -6);
  const noW = no ? ctx.measureText(no).width : 0;
  let hx = CX - (trackW + noW) / 2;
  ctx.fillStyle = M.acc; ctx.textAlign = 'left';
  for (const c of nm) { ctx.fillText(c, hx, 380); hx += ctx.measureText(c).width + 6; }
  if (no) { ctx.fillStyle = '#8E94A8'; ctx.fillText(no, hx - 6, 380); }
  ctx.textAlign = 'center';

  // Hero and its label, close together so they read as one.
  const [big, tail] = M.hero(data);
  hero(ctx, big, tail, 760, '#FFFFFF');
  text(ctx, M.label(data).toUpperCase(), CX, 830, 40, 800, '#8E94A8');

  // Brag line, then a quieter second line where the mode has one.
  const brag = M.brag(data);
  if (brag) text(ctx, brag, CX, 916, 54, 800, M.acc);
  const sub = M.sub ? M.sub(data) : '';
  if (sub) {
    ctx.font = `700 38px ${FONT}`;
    let s = sub; while (ctx.measureText(s).width > W - 160 && s.length > 4) s = s.slice(0, -2);
    text(ctx, s === sub ? s : `${s.trimEnd()}…`, CX, brag ? 972 : 916, 38, 700, '#C3C7D4');
  }

  M.path(ctx, data, M.acc);

  // The invitation as an outline, so it does not compete with the score, and
  // where to go: short addresses only (balliq.app/draft, not ?game=draft).
  const ask = (key === 'trail' || key === 'mystery') && !data.won ? 'Can you get him?' : key === 'footle' && data.failed ? 'Can you get it?' : 'Can you beat me?';
  ctx.font = `900 50px ${FONT}`;
  const pw = Math.max(560, ctx.measureText(ask).width + 120), ph = 108, py = 1496;
  ctx.strokeStyle = M.acc; ctx.lineWidth = 4; rr(ctx, CX - pw / 2, py, pw, ph, ph / 2); ctx.stroke();
  text(ctx, ask, CX, py + 70, 50, 900, M.acc);
  text(ctx, `balliq.app/${M.path_}`, CX, 1790, 40, 700, '#9BA0B8');

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))), 'image/png');
  });
}
