// A football shirt in a club's colours, drawn in SVG: the way the grid (and,
// later, Transfer Trail and Draft) shows a club without its crest.
//
// ⚠️ NO CRESTS, LOGOS OR PHOTOS, EVER. They are trademarks: Apple rejects apps
// for them (guideline 5.2.1) and Manchester United took Football Manager to
// court over its crest. A shirt pattern in two colours is what the reference
// game draws too. So this component draws shapes in the colours it is given
// and, at most, the short name under them: no <image>, no <text> in the SVG,
// no external reference (tests/unit/kit-shirt.test.js holds that).
//
// kit: { p: pattern, c1, c2 } from src/data/gridKits.json.
//   solid     c1 shirt, c2 collar and cuffs
//   stripes   vertical c1 / c2          hoops    horizontal c1 / c2
//   halves    c1 left, c2 right         sash     c1 shirt, c2 diagonal sash
//   sleeves   c1 body, c2 sleeves       centre   c1 shirt, c2 one central stripe
//   diagonal  c1 top left, c2 bottom right       band     c1 shirt, c2 chest band
import React, { useId } from "react";

const BODY = "M22 6 L27 4.5 Q32 9 37 4.5 L42 6 L57 13.5 L51.5 26 L45.5 23.5 L45.5 58 Q32 60 18.5 58 L18.5 23.5 L12.5 26 L7 13.5 Z";
const SLEEVE_L = "M22 6 L7 13.5 L12.5 26 L18.5 23.5 Z";
const SLEEVE_R = "M42 6 L57 13.5 L51.5 26 L45.5 23.5 Z";
const COLLAR = "M27 4.5 Q32 9 37 4.5 L35.5 4 Q32 7 28.5 4 Z";
const CUFF_L = "M7 13.5 L12.5 26 L14.4 25.2 L8.9 12.6 Z";

const range = (from, to, step) => {
  const out = [];
  for (let v = from; v < to; v += step) out.push(v);
  return out;
};

function pattern(p, c1, c2) {
  switch (p) {
    case "stripes":
      return range(6, 58, 6.5).map((x, i) => <rect key={x} x={x} y="0" width="6.5" height="64" fill={i % 2 ? c2 : c1} />);
    case "hoops":
      return range(0, 64, 7).map((y, i) => <rect key={y} x="0" y={y} width="64" height="7" fill={i % 2 ? c2 : c1} />);
    case "halves":
      return [<rect key="l" x="0" y="0" width="32" height="64" fill={c1} />, <rect key="r" x="32" y="0" width="32" height="64" fill={c2} />];
    case "sash":
      return [<rect key="b" x="0" y="0" width="64" height="64" fill={c1} />, <path key="s" d="M14 4 L26 4 L54 62 L42 62 Z" fill={c2} />];
    case "sleeves":
      return [<rect key="b" x="0" y="0" width="64" height="64" fill={c1} />, <path key="l" d={SLEEVE_L} fill={c2} />, <path key="r" d={SLEEVE_R} fill={c2} />];
    case "centre":
      return [<rect key="b" x="0" y="0" width="64" height="64" fill={c1} />, <rect key="s" x="26.5" y="0" width="11" height="64" fill={c2} />];
    case "diagonal":
      return [<rect key="b" x="0" y="0" width="64" height="64" fill={c2} />, <path key="d" d="M0 0 L64 0 L0 64 Z" fill={c1} />];
    case "band":
      return [<rect key="b" x="0" y="0" width="64" height="64" fill={c1} />, <rect key="s" x="0" y="22" width="64" height="8" fill={c2} />];
    default:
      return [<rect key="b" x="0" y="0" width="64" height="64" fill={c1} />];
  }
}

const NEUTRAL = { p: "solid", c1: "#3A4150", c2: "#6B7385" };

/**
 * @param {{ kit?: {p: string, c1: string, c2: string}, name?: string, size?: number, className?: string }} props
 *   `name` is drawn under the shirt (and is its accessible name); without it
 *   the shirt is decorative.
 */
export default function KitShirt({ kit, name, size = 40, className }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const k = kit && kit.c1 ? kit : NEUTRAL;
  const c2 = k.c2 || k.c1;
  // Trim only where the pattern leaves the collar and cuffs in the base colour.
  const trim = k.p === "solid" || k.p === "band" || k.p === "centre" || k.p === "sash";
  const svg = (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <clipPath id={`kit${id}`}><path d={BODY} /></clipPath>
      <g clipPath={`url(#kit${id})`}>{pattern(k.p, k.c1, c2)}</g>
      {trim && <path d={COLLAR} fill={c2} />}
      {trim && k.p === "solid" && <path d={CUFF_L} fill={c2} />}
      {trim && k.p === "solid" && <path d={CUFF_L} fill={c2} transform="translate(64 0) scale(-1 1)" />}
      {/* Two outlines, so a white shirt and a black one both read on any background. */}
      <path d={BODY} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={BODY} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.7" strokeLinejoin="round" />
    </svg>
  );
  if (!name) return <span className={className}>{svg}</span>;
  return (
    <span className={className} role="img" aria-label={name}>
      {svg}
      <span className="kit-name" aria-hidden="true">{name}</span>
    </span>
  );
}
