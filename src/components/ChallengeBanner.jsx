// The line a friend sees when they arrive from a challenge link (16 Oct 2026):
// "Alex solved it in 3 · Can you beat it?". Shown only on the same puzzle and
// only before they finish; the finish panel then shows the head-to-head.
//
// ⚠️ AN OVERLAY, NOT A ROW. Footle and Top 10 budget their height so ENTER and
// the keyboard stay on a small phone's screen (--wd-chrome); a row above the
// board would push them off. It floats at the top, then leaves after a few
// seconds or on a tap.
import React, { useEffect, useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { readChallenge, challengeLine } from "../lib/gameChallenge.js";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";

export default function ChallengeBanner({ game, edition, finished }) {
  const c = useMemo(() => readChallenge(game, edition), [game, edition]);
  const [open, setOpen] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOpen(false), 6000); return () => clearTimeout(t); }, []);
  if (!c || finished || !open) return null;
  const rgb = MODE_RGB[game] || "88,204,2";
  // First name only: the score is the point of the line and must never be the part that trims.
  const line = challengeLine({ ...c, name: String(c.name || "").split(" ")[0] });
  return (
    <button type="button" onClick={() => setOpen(false)} aria-label={`${line}. Can you beat it? Tap to close`}
      style={{
        position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 60,
        top: "calc(env(safe-area-inset-top, 0px) + 10px)", maxWidth: "min(92vw, 420px)", width: "max-content",
        display: "flex", alignItems: "center", gap: 9, padding: "9px 14px", borderRadius: 999,
        background: "var(--s1, #15171f)", border: `1px solid rgba(${rgb},0.5)`, boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
        color: "var(--t1)", WebkitTextFillColor: "var(--t1)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, textAlign: "left", cursor: "pointer",
      }}>
      <Swords size={17} strokeWidth={2.3} color={MODE_ACCENT[game]} aria-hidden="true" style={{ flexShrink: 0 }} />
      {/* One line, always: a long name trims with an ellipsis, "Beat it?" never does. */}
      <span style={{ minWidth: 0, flex: "0 1 auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line}</span>
      <strong style={{ flexShrink: 0, whiteSpace: "nowrap", color: MODE_ACCENT[game], WebkitTextFillColor: MODE_ACCENT[game] }}>Beat it?</strong>
    </button>
  );
}
