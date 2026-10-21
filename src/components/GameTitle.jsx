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
// ⚠️ THE NAME COMES FIRST. As one nowrap line with an ellipsis, a 360pt phone
// drew "Transfer Trail…" and "Mystery Player N…": the number pushed the name
// out and was then cut itself (review, 13 Oct 2026; Trail needs 181pt and has
// 169). So the row wraps and is one line tall: where the number does not fit
// beside the name it falls to a second line that is not shown, and the name
// stands whole. Home and the share text still carry the number.
import { useT } from '../i18n/index.js';

const TITLE = { display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 7, height: "1.2em", overflow: "hidden", fontSize: 20, fontWeight: 800, color: "var(--t1)", lineHeight: 1.2 };
const NAME = { maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const NO = { fontSize: 13, fontWeight: 700, color: "var(--t3)", WebkitTextFillColor: "var(--t3)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

export default function GameTitle({ children, no, className, style }) {
  const t = useT();
  return (
    <div className={className} style={{ ...TITLE, ...style }}>
      <span style={NAME}>{children}</span>{no > 0 ? <span style={NO}>{t('game.no', { n: no })}</span> : null}
    </div>
  );
}
