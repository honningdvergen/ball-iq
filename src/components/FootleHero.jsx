import React, { useMemo, useCallback } from "react";
import { APP_NAME } from "../lib/scoring.js";
import { readWordleTodayStatus, getWordleDateKey } from "../lib/wordleStatus.js";
import { getWordleAnswer, gradeWordleGuess, computeFootleStreak } from "../lib/wordle.js";

// FootleHero — Home tab daily-zone card. Morning state shows an empty
// grid preview + Play CTA; evening state (won/lost) shows the user's
// actual guess pattern as a colored mini-grid + score + streak + Review/
// Share CTAs. State is read fresh from localStorage on every render so
// the hero updates immediately after the user completes the puzzle and
// navigates home (parent re-renders on screen change, hero re-reads).
// Memoizes on ws.kind so the heavier grade/share computation only runs
// when the status changes.
//
// shareCard is passed in as a prop — its full implementation lives in
// App.jsx (drawing canvas, Web Share API, clipboard fallback). Sprint
// #17 Stage 3 extracted FootleHero to this module but left shareCard
// in App.jsx because it's too entangled with toast plumbing + the
// canvas card drawer to move cleanly.
export const FootleHero = React.memo(function FootleHeroImpl({ onPlay, onReview, shareCard }) {
  const ws = readWordleTodayStatus();
  const isWon = ws.kind === "won";
  const isLost = ws.kind === "lost";
  const isDone = isWon || isLost;

  const dateKey = getWordleDateKey();
  const today = useMemo(() => new Date(), [dateKey]);
  const streak = useMemo(() => isWon ? computeFootleStreak(today) : 0, [isWon, today, dateKey]);

  // Today's answer length is needed for the morning grid preview's column
  // count (G1 refinement) — getWordleAnswer is pure/deterministic so calling
  // it in both states is cheap. Guesses + grades only computed in terminal
  // states since they require the localStorage read + grading pass.
  const answer = useMemo(() => getWordleAnswer(), [dateKey]);
  const { guesses, grades } = useMemo(() => {
    if (!isDone) return { guesses: [], grades: [] };
    let gs = [];
    try {
      const raw = localStorage.getItem(`biq_wordle_${dateKey}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p?.guesses)) gs = p.guesses;
      }
    } catch {}
    const gr = gs.map(g => gradeWordleGuess(g, answer));
    return { guesses: gs, grades: gr };
  }, [isDone, dateKey, answer]);

  const onShare = useCallback(async () => {
    if (!isDone || !shareCard) return;
    const grid = grades.map(row =>
      row.map(c => c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬛").join("")
    ).join("\n");
    const score = isWon ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}` : "Didn't solve today";
    const scoreLine = isWon && streak > 0 ? `${score} · 🔥 ${streak}-day streak` : score;
    const textFallback = `⚽ ${APP_NAME} — Footle\n${scoreLine}\n\n${grid}\n\nballiq.app`;
    const dateLabel = today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    await shareCard("wordle", {
      score: guesses.length, total: 6, grades, dateLabel, failed: isLost,
    }, { onToast: () => {}, textFallback });
  }, [isDone, isWon, isLost, guesses, grades, streak, today, shareCard]);

  // I2: morning grid is a fixed-width Wordle-style teaser (identity over
  // accuracy — the actual answer length leaks in the subtitle anyway).
  // Evening grid uses today's actual answer length (4-8 cols).
  // Home Tweaks follow-up: the teaser is capped at 2 ROWS in both states
  // (the full 6-row board read as a huge grid on Home — the design frame
  // shows a compact 2-row strip). Evening keeps the LAST two rows so the
  // winning green row stays the payoff.
  const PREVIEW_ROWS = 2;
  const cols = answer.length || 5;
  if (!isDone) {
    const inProgress = ws.kind === "in-progress";
    return (
      <button className="footle-hero footle-hero-morning" onClick={onPlay} aria-label={inProgress ? `Continue today's Footle — ${ws.used} of 6 used` : "Play today's Footle"}>
        <div className="fh-body">
          <div className="fh-eyebrow">Daily · Footle</div>
          <div className="fh-title">Footle</div>
          <div className="fh-sub">
            {cols} letters · 6 guesses · daily<br />
            Surname of a footballer or manager
          </div>
          <div className="fh-cta-row">
            <span className="fh-cta">{inProgress ? `Continue · ${ws.used}/6 used` : "Play"}</span>
          </div>
        </div>
        <div className="fh-grid" aria-hidden="true" style={{"--fh-cols": 5}}>
          {/* Sample solve, graded with REAL Footle logic vs answer MESSI:
              row 1 guess MOSES -> M green, O grey, S green (pos 3), E yellow,
              S yellow (second S exists at pos 4); row 2 MESSI all green.
              Teaches all three states and pays off with the solve. */}
          <div className="fh-row">
            <div className="fh-tile fh-tile-green">M</div>
            <div className="fh-tile fh-tile-grey">O</div>
            <div className="fh-tile fh-tile-green">S</div>
            <div className="fh-tile fh-tile-yellow">E</div>
            <div className="fh-tile fh-tile-yellow">S</div>
          </div>
          <div className="fh-row">
            <div className="fh-tile fh-tile-green">M</div>
            <div className="fh-tile fh-tile-green">E</div>
            <div className="fh-tile fh-tile-green">S</div>
            <div className="fh-tile fh-tile-green">S</div>
            <div className="fh-tile fh-tile-green">I</div>
          </div>
        </div>
      </button>
    );
  }

  // Evening state — solved or lost. Shows the LAST two guess rows (capped
  // like the morning teaser) padded up to 2 so morning/evening proportions
  // match.
  const shownGrades = grades.slice(-PREVIEW_ROWS);
  const padRows = Math.max(0, PREVIEW_ROWS - shownGrades.length);
  return (
    <div className="footle-hero footle-hero-evening" role="group" aria-label={isWon ? `Footle solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}` : "Footle — missed today"}>
      <div className="fh-body">
        <div className="fh-eyebrow">Daily · Footle</div>
        <div className="fh-title">{isWon ? "Solved" : "Missed"}</div>
        <div className="fh-score">
          {isWon ? <>in <strong>{guesses.length}</strong> {guesses.length === 1 ? "guess" : "guesses"}</> : <>today</>}
        </div>
        {isWon && streak > 0 && (
          <div className="fh-sub">🔥 {streak}-day streak</div>
        )}
        {isLost && (
          <div className="fh-sub">Better luck tomorrow.</div>
        )}
        <div className="fh-cta-row">
          <button className="fh-cta" onClick={() => onReview && onReview(ws)} aria-label="Review today's Footle">Review</button>
          <button className="fh-cta fh-cta-secondary" onClick={onShare} aria-label="Share today's Footle">↗︎ Share</button>
        </div>
      </div>
      <div className="fh-grid" aria-hidden="true" style={{"--fh-cols": cols}}>
        {shownGrades.map((row, r) => (
          <div className="fh-row" key={r}>
            {row.map((c, i) => <div key={i} className={`fh-tile fh-tile-${c}`} />)}
          </div>
        ))}
        {Array.from({ length: padRows }).map((_, r) => (
          <div className="fh-row" key={`pad-${r}`}>
            {Array.from({ length: cols }).map((_, c) => <div key={c} className="fh-tile fh-tile-empty" />)}
          </div>
        ))}
      </div>
    </div>
  );
});
