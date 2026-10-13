/**
 * A game's name in its header, with its edition number set the one way.
 *
 * ⚠️ THE NUMBER WAS WRITTEN THREE WAYS. Home's rows say "Footle No. 163" with
 * the number small and grey. Open a game and the header said "Transfer Trail
 * #72" or "Top 10 #2" at the title's own size and weight, while Footle and
 * Mystery Player put "No. 72" on the line beneath (13 Oct 2026). One form now,
 * Home's: the name, then "No. N" smaller and quieter beside it. Share texts
 * keep "#72": that is the convention where they are read.
 *
 * Inline styles on purpose: Transfer Trail also mounts on a static page that
 * does not load the app's stylesheet.
 */
const TITLE = { fontSize: 20, fontWeight: 800, color: "var(--t1)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const NO = { marginLeft: 7, fontSize: 13, fontWeight: 700, color: "var(--t3)", WebkitTextFillColor: "var(--t3)", fontVariantNumeric: "tabular-nums" };

export default function GameTitle({ children, no, className, style }) {
  return (
    <div className={className} style={{ ...TITLE, ...style }}>
      {children}{no > 0 ? <span style={NO}>No. {no}</span> : null}
    </div>
  );
}
