// colourMath.js — painting a colour: tint / lift / onColour / contrast / inkOn.
//
// ⚠️ SPLIT FROM clubColour.js ON 2026-10-16 so Home does not carry club data.
// The Ball IQ card (lib/ballIqCard.js, on Home's eager path) needs only this
// maths; clubColour.js also holds the alias and colour tables for ~300 clubs,
// which only the Trail, Stadiums and the club picker read. Importing one helper
// from clubColour.js put the whole module in the eager chunk. clubColour.js
// re-exports all five, so its importers and tests are unchanged; anything on
// Home's eager path imports from HERE.

export function tint(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Make a colour visible as a tint on a dark card, WITHOUT throwing away its hue.
//
// Every black-and-white side carries #111111 (Juventus, Santos, Botafogo,
// Atlético Mineiro). At 30% alpha on a dark card that is invisible, so those
// rows looked uncoloured even though the lookup had succeeded — which is how
// Gilberto Silva's real América-MG → Atlético-MG move read as one club twice.
//
// ⚠️ THE FIRST VERSION MIXED TOWARDS WHITE, and that is a different operation
// from lightening: it desaturates. On the rating card exactly one competition
// crosses the threshold — the Premier League's #3D195B — and it came out
// #a898b5, a washed lavender-grey. Alex, looking at his own card: "is epl not
// supposed to have that purple hue?" It is. Lightening in HSL keeps hue and
// saturation and only raises lightness, so a dark purple becomes a lighter
// PURPLE. A genuinely neutral colour (#111111 has zero saturation) still
// resolves to grey, which is correct — it has no hue to preserve.
//
// Lift ONLY the value used for a tint or border. The badge keeps the true club
// colour, where black with white type is authentic and legible.
export function lift(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  if ((0.2126 * r + 0.7152 * g + 0.0722 * b) >= 0.18) return hex;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, sat = 0;
  if (d !== 0) {
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const L = Math.max(l, 0.45);
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = L < 0.5 ? L * (1 + sat) : L + sat - L * sat;
  const pp = 2 * L - q;
  const out = sat === 0 ? [L, L, L] : [hue(pp, q, h + 1 / 3), hue(pp, q, h), hue(pp, q, h - 1 / 3)];
  return `#${out.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
}

// Readable ink on a club colour — WCAG relative luminance, not a naive average,
// so Dortmund yellow and Real Madrid white get dark type.
export function onColour(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] > 0.42 ? "#14181F" : "#FFFFFF";
}

// ── A colour you can READ on the dark card ───────────────────────────────────
// lift() is for tints and borders: it stops at 45% lightness, which is still
// dark blue on navy when it is used for TEXT. The question's category chip
// used it, and "CHAMPIONS LEAGUE" was close to unreadable on Alex's phone
// (his own recording, 12 Oct 2026). inkOn() keeps the hue and the saturation
// and raises the lightness only as far as it takes to reach the contrast
// asked for against the background: 4.5 to 1 is the standard for small text.
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
};
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
export function inkOn(hex, bg = '#13151C', min = 4.5) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return hex;
  if (contrast(hex, bg) >= min) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), mn = Math.min(r, g, b), d = max - mn;
  const l0 = (max + mn) / 2;
  let h = 0, sat = 0;
  if (d !== 0) {
    sat = l0 > 0.5 ? d / (2 - max - mn) : d / (max + mn);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const hue = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  const at = (L) => {
    const q = L < 0.5 ? L * (1 + sat) : L + sat - L * sat, p = 2 * L - q;
    const out = sat === 0 ? [L, L, L] : [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
    return `#${out.map((c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0')).join('')}`;
  };
  for (let L = Math.max(l0, 0.3); L <= 0.97; L += 0.02) { const c = at(L); if (contrast(c, bg) >= min) return c; }
  return at(0.97);
}

// A club badge whose colour almost matches the dark page (Rosenborg #1A1A1A,
// Juventus, Newcastle, Spurs navy: 25 packs under 1.6:1) vanishes into it, and
// the white letters float with no tile behind them (simulator tour, 27 Oct).
// Those badges get a faint light edge; the club's own colour is unchanged.
export const swatchEdge = (hex, bg = '#13151C') =>
  /^#[0-9a-f]{6}$/i.test(hex || '') && contrast(hex, bg) < 1.6 ? 'inset 0 0 0 1px rgba(255,255,255,0.22)' : '';
