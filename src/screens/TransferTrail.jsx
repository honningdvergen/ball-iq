// Transfer Trail — daily "put the career in order" screen (docs/transfer-trail-spec.md §2).
// INERT until routed from App.jsx: nothing imports this file yet. The screen is
// prop-driven — the router passes the day's dataset row — so it carries zero
// data of its own (TRAIL_PLAYERS ships empty until the verified forge fills it).
//
// Interaction model (spec): tap-two-to-swap (no drag lib, mobile-first), 5
// attempts, per-rung grading colours + ⬆️/⬇️ direction arrows, spoiler-free
// convergence-grid share. Persistence: biq_trail_<ymd> stores the raw
// arrangements (labels), grades recompute from gradeTrail — same
// store-inputs-not-derived-state pattern as Footle's biq_wordle_<ymd>.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { dateToYMD } from "../lib/date.js";
import {
  TRAIL_MAX_ATTEMPTS,
  getTrailNumber,
  getTrailDayIndex,
  gradeTrail,
  isTrailSolved,
  scrambleBench,
  computeTrailStreak,
  buildTrailShareText,
} from "../lib/trail.js";
import { Confetti, haptic } from "../App.jsx";

const MARK_BG = { green: "#58CC02", yellow: "#FFC107", grey: "var(--s2)" };
const MARK_FG = { green: "#06230C", yellow: "#0A0A0A", grey: "var(--t1)" };

function loadDay(ymd) {
  try {
    const raw = localStorage.getItem(`biq_trail_${ymd}`);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return Array.isArray(p?.attempts) ? p : null;
  } catch { return null; }
}
function saveDay(ymd, state) {
  try { localStorage.setItem(`biq_trail_${ymd}`, JSON.stringify(state)); } catch {}
}

export default function TransferTrail({ player, date = new Date(), onBack }) {
  const ymd = dateToYMD(date);
  const answer = useMemo(() => player?.clubs || [], [player]);
  const number = getTrailNumber(date);

  // Restore: attempts are stored as raw label arrays; everything else derives.
  const [attempts, setAttempts] = useState(() => loadDay(ymd)?.attempts || []);
  const grades = useMemo(() => attempts.map((a) => gradeTrail(a, answer)), [attempts, answer]);
  const won = grades.some(isTrailSolved);
  const lost = !won && attempts.length >= TRAIL_MAX_ATTEMPTS;
  const done = won || lost;

  // Current working arrangement: last submitted attempt, else the daily bench.
  const [arrangement, setArrangement] = useState(() => {
    const stored = loadDay(ymd);
    if (stored?.attempts?.length) return stored.attempts[stored.attempts.length - 1];
    return answer.length ? scrambleBench(answer, getTrailDayIndex(date)) : [];
  });
  const [selected, setSelected] = useState(null); // rung index of the first tap
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    saveDay(ymd, { status: won ? "won" : lost ? "lost" : "playing", attempts });
  }, [ymd, attempts, won, lost]);

  // Last attempt's grades, shown only on rungs untouched since that submit —
  // a moved chip's old colour would be a lie, so it resets to neutral.
  const lastAttempt = attempts.length ? attempts[attempts.length - 1] : null;
  const lastGrades = grades.length ? grades[grades.length - 1] : null;
  const rungGrade = (i) =>
    lastAttempt && lastGrades && arrangement[i] === lastAttempt[i] ? lastGrades[i] : null;

  const tapRung = useCallback((i) => {
    if (done) return;
    haptic("select");
    setSelected((sel) => {
      if (sel === null) return i;
      if (sel === i) return null;
      setArrangement((arr) => {
        const next = [...arr];
        [next[sel], next[i]] = [next[i], next[sel]];
        return next;
      });
      return null;
    });
  }, [done]);

  const submit = useCallback(() => {
    if (done || !arrangement.length) return;
    const g = gradeTrail(arrangement, answer);
    setAttempts((a) => [...a, [...arrangement]]);
    setSelected(null);
    if (isTrailSolved(g)) {
      haptic("hardCorrect");
      setShowConfetti(true);
    } else {
      haptic("wrong");
    }
  }, [done, arrangement, answer]);

  const streak = useMemo(() => (won ? computeTrailStreak(date) : 0), [won, date]);
  const shareText = useMemo(
    () => (done ? buildTrailShareText(grades, { number, won, streak }) : ""),
    [done, grades, number, won, streak]
  );
  const onShare = useCallback(async () => {
    if (!shareText) return;
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "📋 Copied — paste it anywhere" }));
    } catch {}
  }, [shareText]);

  // Dataset not wired yet (or a bad route): show a graceful placeholder rather
  // than a blank board. This is the only path reachable while the screen is
  // unrouted, and it keeps the component safe to mount in tests.
  if (!answer.length) {
    return (
      <div className="screen" style={{ padding: 24, textAlign: "center" }}>
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div style={{ marginTop: 60, fontSize: 40 }}>🔀</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)", marginTop: 12 }}>Transfer Trail</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>Coming soon — a new career to untangle every day.</div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", minHeight: "100%", paddingBottom: 20 }}>
      {showConfetti && Confetti ? <Confetti /> : null}

      {/* header — mirrors the Footle header layout */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px" }}>
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Transfer Trail{number > 0 ? ` #${number}` : ""}</div>
          <div style={{ fontSize: 12.5, color: "var(--t2)" }}>Put the career in order — first club at the top</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t2)", textAlign: "center" }}>
          <div>{Math.max(0, TRAIL_MAX_ATTEMPTS - attempts.length)}</div>
          <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>left</div>
        </div>
      </div>

      {/* board */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 2px", flex: 1 }}>
        {arrangement.map((club, i) => {
          const g = rungGrade(i);
          const isSel = selected === i;
          const loan = player.loans?.[player.clubs.indexOf(club)]; // display-only hint chip
          return (
            <button
              key={`${club}-${i}`}
              onClick={() => tapRung(i)}
              disabled={done}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "13px 14px", borderRadius: 12, cursor: done ? "default" : "pointer",
                background: g ? MARK_BG[g.mark] : "var(--s1)",
                color: g ? MARK_FG[g.mark] : "var(--t1)",
                border: isSel ? "2px solid var(--accent)" : "2px solid var(--border)",
                transform: isSel ? "scale(1.02)" : "none",
                transition: "transform 0.12s ease, background 0.2s ease",
                fontFamily: "inherit", fontSize: 15.5, fontWeight: 700, textAlign: "left",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, opacity: 0.55, width: 16 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>
                {club}
                {loan ? <span style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.7, marginLeft: 6 }}>(loan)</span> : null}
              </span>
              {g && g.mark !== "green" ? (
                <span aria-label={g.dir === "up" ? "belongs earlier" : "belongs later"} style={{ fontSize: 15 }}>
                  {g.dir === "up" ? "⬆️" : "⬇️"}
                </span>
              ) : null}
              {g && g.mark === "green" ? <span style={{ fontSize: 15 }}>✓</span> : null}
            </button>
          );
        })}
      </div>

      {/* controls / result */}
      {!done ? (
        <div style={{ padding: "6px 2px" }}>
          <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", marginBottom: 8 }}>
            {selected === null ? "Tap two clubs to swap them" : "Now tap where it should go"}
          </div>
          <button
            className="wd-share"
            onClick={submit}
            style={{ width: "100%", background: "var(--accent)", color: "#06230C", fontWeight: 800 }}
          >
            Submit order
          </button>
        </div>
      ) : (
        <div style={{ padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t1)" }}>
            {won ? `Solved in ${attempts.length}/${TRAIL_MAX_ATTEMPTS} 🎉` : "Out of attempts"}
          </div>
          <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 6 }}>
            {player.display?.join(" ") || "Mystery player"}
            {won && streak > 1 ? ` · 🔥 ${streak}-day streak` : ""}
          </div>
          {lost && (
            <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 10, lineHeight: 1.6 }}>
              {answer.map((c, i) => `${i + 1}. ${c}${player.years?.[i] ? ` (${player.years[i]})` : ""}`).join("  →  ")}
            </div>
          )}
          <button
            className="wd-share"
            onClick={onShare}
            style={{ width: "100%", marginTop: 14, background: "var(--accent)", color: "#06230C", fontWeight: 800 }}
          >
            Share your grid
          </button>
        </div>
      )}
    </div>
  );
}
