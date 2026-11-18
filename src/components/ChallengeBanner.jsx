// The score a mate set, for a friend who arrives from a challenge link:
// "Jonas · 7/10  Beat it?". Shown only on the same puzzle and only before they
// finish; the finish panel then shows the head-to-head.
//
// ⚠️ IN THE HEADER'S OWN SECOND LINE, NOT OVER IT (18 Nov 2026). It was a pill
// floating over the top of the screen for six seconds: on Alex's phone it
// covered the game's title ("To," was what was left of "Top 10") and half the
// line under it, at the moment a new player is finding out what the screen
// is. It could not be a row of its own (Footle and Top 10 budget their height
// so ENTER and the keyboard stay on a small phone's screen, --wd-chrome), so
// it takes the place of the line under the title, at that line's own height,
// and stays for the whole game: the number to beat is worth more on minute
// two than in the first six seconds. Wrap the header's usual line in it; with
// no challenge it draws that line.
//
// One line, always: a long name trims, the score never does, and "Beat it?"
// drops off whole when there is no room for it (it wraps to a second line the
// fixed height hides), rather than being cut mid-word.
import React, { useMemo } from "react";
import { Swords } from "lucide-react";
import { readChallenge, scoreLabel } from "../lib/gameChallenge.js";
import { MODE_ACCENT, MODE_RGB } from "../lib/accents.js";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path

export default function ChallengeBanner({ game, edition, finished, children = null }) {
  const t = useT();
  const c = useMemo(() => readChallenge(game, edition), [game, edition]);
  if (!c || finished) return children;
  const who = String(c.name || "").split(" ")[0] || t("gc.aMate");
  const accent = MODE_ACCENT[game];
  const rgb = MODE_RGB[game] || "88,204,2";
  // A tinted chip a size up from the grey line it replaces (18 Nov 2026: on
  // Alex's phone the first version was "small and really unnoticed"). It is
  // the reason this player opened the link, so it has to be seen in the first
  // second; the chip is 20 px tall, which the header's 44 px row still holds.
  return (
    <span className="ch-line" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 8, height: 20, lineHeight: "20px", overflow: "hidden", fontSize: 13.5, color: "var(--t1)", WebkitTextFillColor: "var(--t1)", fontWeight: 800 }}>
      <span className="ch-chip" style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0, maxWidth: "100%", height: 20, padding: "0 9px 0 7px", borderRadius: 999, background: `rgba(${rgb},0.16)`, boxShadow: `inset 0 0 0 1px rgba(${rgb},0.45)`, boxSizing: "border-box" }}>
        <Swords size={13} strokeWidth={2.5} color={accent} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{who}</span>
        <span style={{ flexShrink: 0, whiteSpace: "nowrap", color: accent, WebkitTextFillColor: accent }}>{scoreLabel(game, c.score, t)}</span>
      </span>
      <strong style={{ whiteSpace: "nowrap", color: accent, WebkitTextFillColor: accent }}>{t("gc.beatIt")}</strong>
    </span>
  );
}
