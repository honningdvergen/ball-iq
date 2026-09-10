// The recipient side of "Stump a mate": one question, then the door to the app.
// Extracted from App.jsx on 2026-09-06 (review E16).
import { useState, useEffect } from "react";
import { haptic, loopEvent } from "../App.jsx";
import { stumpLink, shareStumpText } from "../lib/stump.js";

export function StumpScreen({ row, onPlayFull, onHome }) {
  const [picked, setPicked] = useState(-1);
  const done = picked >= 0;
  const gotIt = done && picked === row.a;

  // ⚠️ THE WHOLE RECIPIENT SIDE WAS UNINSTRUMENTED. This screen is the far end
  // of the app's k-factor loop — a stranger arriving from a friend's link — and
  // nothing recorded that they landed, answered, or converted. So a loop that
  // has fired zero times could not be told apart from one that works and is
  // simply invisible to us. Three events, matching the three real steps.
  useEffect(() => { loopEvent("stump-land", { cat: row?.cat || null }); }, [row?.cat]);

  const onPick = (i) => {
    if (done) return;
    setPicked(i);
    loopEvent("stump-answered", { got: i === row.a });
    haptic(i === row.a ? "correct" : "wrong");
  };
  const onPass = () => {
    loopEvent("stump-pass", { got: gotIt });   // the chain continuing = k > 0
    const text = gotIt
      ? `Got it ✅ your turn 😏 ⚽ ${stumpLink(row)}`
      : `It got me too 🙈 can YOU get it? ⚽ ${stumpLink(row)}`;
    shareStumpText(text);
  };

  const optStyle = (i) => {
    const base = { display: "block", width: "100%", textAlign: "left", padding: "14px 16px", marginTop: 10, borderRadius: 12, border: "1.5px solid var(--bd, var(--border2))", background: "var(--card, var(--s2))", color: "var(--text, var(--text))", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: done ? "default" : "pointer" };
    if (!done) return base;
    if (i === row.a) return { ...base, borderColor: "var(--accent, var(--accent))", background: "rgba(88,204,2,0.12)" };
    if (i === picked) return { ...base, borderColor: "var(--red, #FF5A5A)", background: "rgba(255,90,90,0.10)", opacity: 0.9 };
    return { ...base, opacity: 0.55 };
  };

  return (
    <div className="screen">
      <div className="page-hdr">
        <div className="page-title">🥜 Stump a mate</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", marginBottom: 10 }}>
        A mate bets you can't get this{row.cat ? ` (${row.cat})` : ""}:
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.35, color: "var(--text)", letterSpacing: "-0.2px" }}>{row.q}</div>
      <div style={{ marginTop: 14 }}>
        {row.o.map((opt, i) => (
          <button key={i} style={optStyle(i)} onClick={() => onPick(i)} disabled={done}>{opt}</button>
        ))}
      </div>
      {done && (
        <>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 17, fontWeight: 800, color: gotIt ? "var(--accent)" : "var(--red, #FF5A5A)" }}>
            {gotIt ? "⚽ You got it!" : "Stumped! 🥜"}
          </div>
          {row.hint && (
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 12, background: "var(--card, var(--s2))", border: "1px solid var(--bd, var(--border2))", fontSize: 14, lineHeight: 1.5, color: "var(--t2)" }}>
              {row.hint}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 20 }}>
            <button className="btn-3d" onClick={onPass}>🥜 Pass it on</button>
            {/* the conversion step — the reason the loop exists */}
            <button className="btn-3d ghost" onClick={() => { loopEvent("stump-convert", { got: gotIt }); onPlayFull(); }}>Play the full quiz</button>
            <button className="btn-3d ghost" onClick={onHome}>Explore Ball IQ</button>
          </div>
        </>
      )}
    </div>
  );
}

// Last-7-days mini-strip used inside DailyReviewScreen. Always renders
// the rolling 7-day window ending on today (universal "your recent
// rhythm" framing — decoupled from the day being reviewed). Reuses the
// MonthlyCalendar's color language: green = done, soft red = missed,
// neutral = before user's first daily, accent ring = today.
