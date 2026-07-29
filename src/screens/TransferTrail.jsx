// Transfer Trail — daily "name the player from their career" screen.
// Spec: docs/transfer-trail-spec-v2.md.
//
// The career is revealed chronologically, two clubs to open, one more per miss.
// v1 asked players to SORT a scrambled career instead; it was pulled the hour it
// shipped, because sorting is only deduction if you already know whose career it
// is — without recognition it is blind permutation. Naming the player is the
// genre convention and needs no tutorial.
//
// Only revealed clubs are drawn. No "?" placeholders for the rest: the LENGTH of
// a career is itself a clue — a six-club journeyman reads very differently from
// a three-club one-club-man — and handing that over free undoes the ladder.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dateToYMD } from "../lib/date.js";
import {
  TRAIL_MAX_ATTEMPTS,
  getTrailNumber,
  guessMatchesPlayer,
  cluesShown,
  hintFor,
  computeTrailStreak,
  buildTrailShareText,
} from "../lib/trail.js";
import { Confetti, haptic } from "../App.jsx";

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
  const number = getTrailNumber(date);
  const career = useMemo(() => player?.clubs || [], [player]);

  // Attempts are the raw submissions — { text, skipped } — and everything else
  // derives. Same store-inputs-not-derived-state rule as Footle, so a mid-game
  // reload rebuilds the exact board rather than trusting a cached verdict.
  const [attempts, setAttempts] = useState(() => loadDay(ymd)?.attempts || []);
  const [entry, setEntry] = useState("");
  const [shake, setShake] = useState(false);

  const won = attempts.some((a) => !a.skipped && guessMatchesPlayer(a.text, player));
  const misses = attempts.filter((a) => a.skipped || !guessMatchesPlayer(a.text, player)).length;
  const lost = !won && misses >= TRAIL_MAX_ATTEMPTS;
  const done = won || lost;

  const shown = done ? career.length : cluesShown(misses, career.length);
  const clubsUsed = won ? cluesShown(misses, career.length) : career.length;
  const hint = done ? null : hintFor(player, misses);
  const left = Math.max(0, TRAIL_MAX_ATTEMPTS - misses);

  useEffect(() => {
    saveDay(ymd, { status: won ? "won" : lost ? "lost" : "playing", attempts });
  }, [ymd, attempts, won, lost]);

  // Fire the shared daily-completed event exactly once. App.jsx listens and
  // cancels the evening reminder, awards XP and writes the `scores` row — a mode
  // that stays silent here is invisible in the only table anyone queries, which
  // is how Footle went months looking unplayed. Ref-guarded because the screen
  // re-mounts whenever you navigate back into a finished puzzle.
  const announced = useRef(false);
  useEffect(() => {
    if (!done || announced.current) return;
    announced.current = true;
    try {
      window.dispatchEvent(new CustomEvent("biq:daily-completed", {
        detail: { positive: won, game: "trail", won, attempts: Math.max(1, misses) },
      }));
    } catch { /* best effort; never block the reveal */ }
  }, [done, won, misses]);

  const submit = useCallback((skipped) => {
    if (done) return;
    const text = skipped ? "" : entry.trim();
    if (!skipped && !text) return;
    const hit = !skipped && guessMatchesPlayer(text, player);
    setAttempts((a) => [...a, { text, skipped: !!skipped }]);
    setEntry("");
    if (hit) haptic("hardCorrect");
    else { haptic("wrong"); setShake(true); setTimeout(() => setShake(false), 420); }
  }, [done, entry, player]);

  const streak = useMemo(() => (won ? computeTrailStreak(date) : 0), [won, date]);
  const shareText = useMemo(
    () => (done ? buildTrailShareText({ number, won, clubsUsed, streak }) : ""),
    [done, number, won, clubsUsed, streak]
  );
  const onShare = useCallback(async () => {
    if (!shareText) return;
    try { if (navigator.share) { await navigator.share({ text: shareText }); return; } } catch { return; }
    try {
      await navigator.clipboard.writeText(shareText);
      window.dispatchEvent(new CustomEvent("biq:show-toast", { detail: "📋 Copied — paste it anywhere" }));
    } catch {}
  }, [shareText]);

  // Unrouted or a bad day index: land somewhere real rather than on a blank board.
  if (!career.length) {
    return (
      <div className="screen" style={{ padding: 24, textAlign: "center" }}>
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div style={{ marginTop: 60, fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>Transfer Trail</div>
        <div style={{ fontSize: 14, color: "var(--t2)", marginTop: 8 }}>Coming soon — a new career to name every day.</div>
      </div>
    );
  }

  const wrongOnes = attempts.filter((a) => !a.skipped && !guessMatchesPlayer(a.text, player));

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", minHeight: "100%", paddingBottom: 20 }}>
      {won && Confetti ? <Confetti /> : null}

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px" }}>
        <button className="back-btn" onClick={onBack} aria-label="Back">←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t1)" }}>
            Transfer Trail{number > 0 ? ` #${number}` : ""}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--t2)" }}>
            {done ? (won ? "Solved" : "Not this time") : "Name the player from their career"}
          </div>
        </div>
        {!done && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: left <= 1 ? "var(--red)" : "var(--t1)" }}>{left}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)" }}>left</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "6px 2px" }}>
        {career.slice(0, shown).map((club, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--s1)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "13px 15px",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", width: 14, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--t1)", flex: 1, minWidth: 0 }}>{club}</span>
            {player.loans?.[i] && (
              <span style={{ fontSize: 10.5, color: "var(--gold)", fontWeight: 700, flexShrink: 0 }}>loan</span>
            )}
          </div>
        ))}
      </div>

      {hint && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 11,
                      background: "rgba(255,193,7,0.10)", border: "1px solid rgba(255,193,7,0.3)",
                      color: "var(--gold)", fontSize: 13, fontWeight: 700 }}>
          {hint}
        </div>
      )}

      {wrongOnes.length > 0 && !done && (
        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {wrongOnes.map((a, i) => (
            <span key={i} style={{ fontSize: 12.5, color: "var(--t3)", textDecoration: "line-through",
                                   background: "var(--s2)", borderRadius: 8, padding: "4px 9px" }}>{a.text}</span>
          ))}
        </div>
      )}

      {!done && (
        <>
          <div style={{ marginTop: 14, display: "flex", gap: 8,
                        transform: shake ? "translateX(-4px)" : "none", transition: "transform .12s" }}>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(false); }}
              placeholder="Type a surname…"
              aria-label="Your guess"
              autoCapitalize="words" autoCorrect="off" autoComplete="off" spellCheck={false}
              enterKeyHint="go"
              style={{ flex: 1, minWidth: 0, background: "var(--s1)", border: "1px solid var(--border)",
                       borderRadius: 12, padding: "13px 15px", color: "var(--t1)", fontSize: 15,
                       fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={() => submit(false)} disabled={!entry.trim()}
              style={{ flexShrink: 0, padding: "0 20px", borderRadius: 12, border: "none",
                       background: entry.trim() ? "var(--accent)" : "var(--s2)",
                       color: entry.trim() ? "#06230C" : "var(--t3)", fontWeight: 800, fontSize: 14,
                       fontFamily: "inherit", cursor: entry.trim() ? "pointer" : "default" }}>Guess</button>
          </div>
          <button onClick={() => submit(true)}
            style={{ marginTop: 8, width: "100%", background: "transparent", border: "1px solid var(--border)",
                     borderRadius: 11, padding: "10px", color: "var(--t2)", fontSize: 13, fontWeight: 700,
                     fontFamily: "inherit", cursor: "pointer" }}>
            Skip — show me another club
          </button>
        </>
      )}

      {done && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--t2)" }}>It was</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--t1)", marginTop: 2 }}>
            {(player.display || []).join(" ")}
          </div>
          <div style={{ fontSize: 13, color: "var(--t2)", marginTop: 6 }}>
            {won
              ? `Got it on ${clubsUsed} club${clubsUsed === 1 ? "" : "s"}${streak > 1 ? ` · 🔥 ${streak}-day streak` : ""}`
              : "Out of guesses — back tomorrow"}
          </div>
          <button onClick={onShare}
            style={{ marginTop: 16, width: "100%", padding: "14px", borderRadius: 999, border: "none",
                     background: "var(--accent)", color: "#06230C", fontWeight: 800, fontSize: 15,
                     fontFamily: "inherit", cursor: "pointer" }}>Share result</button>
          <button onClick={onBack}
            style={{ marginTop: 8, width: "100%", padding: "12px", borderRadius: 999,
                     border: "1px solid var(--border)", background: "transparent", color: "var(--t2)",
                     fontWeight: 700, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>Back home</button>
        </div>
      )}
    </div>
  );
}
