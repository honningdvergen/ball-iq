// The recipient side of "Stump a mate": one question, then the door to the app.
// Extracted from App.jsx on 2026-09-06 (review E16).
import { useState, useEffect } from "react";
import { haptic, loopEvent } from "../App.jsx";
import { stumpLink, shareStumpText } from "../lib/stump.js";
import { useT } from "../i18n/index.js";
import "../i18n/en.js"; // the full English table: not on Home's eager path
import { useQuestionText } from "../i18n/questionText.js";

export function StumpScreen({ row, onPlayFull, onHome }) {
  const t = useT();
  // The question as the player reads it; `row` (and its link) stays English.
  const shown = useQuestionText().q(row);
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
    const text = t(gotIt ? "share.stumpPassGot" : "share.stumpPassMissed", { link: stumpLink(row) });
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
        <div className="page-title">{t("sm.title")}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t2)", marginBottom: 10 }}>
        {t("sm.bet", { c: row.cat ? ` (${row.cat})` : "" })}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.35, color: "var(--text)", letterSpacing: "-0.2px" }}>{shown.q}</div>
      <div style={{ marginTop: 14 }}>
        {shown.o.map((opt, i) => (
          <button key={i} style={optStyle(i)} onClick={() => onPick(i)} disabled={done}>{opt}</button>
        ))}
      </div>
      {done && (
        <>
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 17, fontWeight: 800, color: gotIt ? "var(--accent)" : "var(--red, #FF5A5A)" }}>
            {gotIt ? t("sm.got") : t("sm.stumped")}
          </div>
          {shown.hint && (
            <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 12, background: "var(--card, var(--s2))", border: "1px solid var(--bd, var(--border2))", fontSize: 14, lineHeight: 1.5, color: "var(--t2)" }}>
              {shown.hint}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 20 }}>
            <button className="btn-3d" onClick={onPass}>{t("sm.pass")}</button>
            {/* the conversion step — the reason the loop exists */}
            <button className="btn-3d ghost" onClick={() => { loopEvent("stump-convert", { got: gotIt }); onPlayFull(); }}>{t("sm.full")}</button>
            <button className="btn-3d ghost" onClick={onHome}>{t("sm.explore")}</button>
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
