import React, { useMemo, useCallback } from "react";
import { APP_NAME } from "../lib/scoring.js";
import { readWordleTodayStatus, getWordleDateKey } from "../lib/wordleStatus.js";
import { getWordleAnswer, gradeWordleGuess, computeFootleStreak, getFootleNumber } from "../lib/wordle.js";

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
// The morning card's wordmark.
//
// ⚠️ FIRST, A CORRECTION I OWE THIS FILE. The grid that used to sit here — a
// sample guess graded by the real engine, then the answer solved — was NOT a
// spoiler mechanism, it was a demonstration of how the mode works, and a good
// one: it showed a guess and an outcome rather than a static palette. Two dated
// collisions did exist (2027-01-04 KANTE, 2026-10-03 PEDRI, both found by
// walking the frozen schedule) but `pickTeaserPair` had ALREADY fixed them by
// skipping to the next non-colliding pair. Removing the whole mechanism was
// more than the bug required. Alex, 2026-08-25: *"you do know that the grid on
// the right of the footle hero is not a spoiler though? it is a display of how
// the mode works."* Correct.
//
// What replaced it is a choice, not a fix: the tiles spell FOOTLE, so the card
// names the mode and shows the colour language in one object instead of
// carrying a 27px white heading AND a grid that said the same thing twice.
//
// ⚠️ SCALE AND GROUND WERE THE REAL PROBLEM, not the idea. The first attempt
// put 46px saturated tiles on the full green gradient, over a green glow, above
// a green Play pill — four green masses in a 362x150 box. Alex: *"just
// overwhelming and too huge"*. Both dials came down: 30px tiles, and
// .footle-hero's ground pulled back to a quiet green (see app.css) so the
// tiles are the brightest thing on the card rather than the fourth.
//
// The arrangement is Alex's: yellow F, green O O, grey T, yellow L, green E.
// A yellow opener matters more than it looks — the F is the most prominent
// tile, and a green one there sat directly on the green ground.
//
// ⚠️ THE TILES REUSE .fh-tile-green / .fh-tile-yellow. Those are the classes
// html.biq-cb overrides, so the wordmark recolours to orange/blue with the rest
// of the game for free. A bespoke class here would silently opt the hero out of
// colour-blind mode — exactly the bug found on this card, where the board and
// keyboard switched palettes and the hero did not.
export const FOOTLE_MARK = [
  ["F", "yellow"], ["O", "green"], ["O", "green"],
  ["T", "grey"],   ["L", "yellow"], ["E", "green"],
];

export const FootleHero = React.memo(function FootleHeroImpl({ onPlay, onReview, shareCard }) {
  const ws = readWordleTodayStatus();
  const isWon = ws.kind === "won";
  const isLost = ws.kind === "lost";
  const isDone = isWon || isLost;
  const inProgress = ws.kind === "in-progress";

  const dateKey = getWordleDateKey();
  const today = useMemo(() => new Date(), [dateKey]);
  const streak = useMemo(() => isWon ? computeFootleStreak(today) : 0, [isWon, today, dateKey]);

  // Today's answer length is needed for the morning grid preview's column
  // count (G1 refinement) — getWordleAnswer is pure/deterministic so calling
  // it in both states is cheap. Guesses + grades only computed in terminal
  // states since they require the localStorage read + grading pass.
  const answer = useMemo(() => getWordleAnswer(), [dateKey]);
  // ⚠️ Loaded when IN PROGRESS too, not just when finished. The card used to
  // render a rotating sample solve in this state — someone else's board, with
  // an all-green winning row — directly beside a CTA reading
  // "Continue · 1/6 used". A player mid-puzzle was shown a solved grid that was
  // not theirs. Their own rows are both honest and more useful.
  const { guesses, grades } = useMemo(() => {
    if (!isDone && !inProgress) return { guesses: [], grades: [] };
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
  }, [isDone, inProgress, dateKey, answer]);

  const onShare = useCallback(async () => {
    if (!isDone || !shareCard) return;
    const grid = grades.map(row =>
      row.map(c => c === "green" ? "🟩" : c === "yellow" ? "🟨" : "⬛").join("")
    ).join("\n");
    const num = getFootleNumber();
    const tag = num > 0 ? ` #${num}` : "";
    // Same Wordle-convention format as the other two share builders (review
    // screen + FootballWordle in App.jsx) — the three MUST stay in sync: the
    // #N token is what makes grids comparable between strangers in a feed.
    const head = `⚽ ${APP_NAME} Footle${tag} ${isWon ? guesses.length : "X"}/6`;
    const streakLine = isWon && streak > 0 ? `\n🔥 ${streak}-day Footle streak` : "";
    const textFallback = `${head}${streakLine}\n\n${grid}\n\nballiq.app/footle`;
    const dateLabel = today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    await shareCard("wordle", {
      score: guesses.length, total: 6, grades, dateLabel, failed: isLost, num,
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
    return (
      <button className={`footle-hero footle-hero-morning${inProgress ? "" : " footle-hero--mark"}`} onClick={onPlay} aria-label={inProgress ? `Continue today's Footle — ${ws.used} of 6 used` : "Play today's Footle"}>
        <div className="fh-body">
          {/* The "Daily · Footle" eyebrow that used to sit here is gone (Alex,
              2026-07-29): the card lives inside a section already headed DAILY
              and its own title says Footle, so the eyebrow spent a line saying
              both words a second time. */}
          {/* The wordmark IS the heading — no white "Footle" above it, or the
              card says its own name twice. Not rendered while a puzzle is in
              progress: that state shows the player's own board instead. */}
          {!inProgress && (
            <div className="fh-mark" aria-hidden="true">
              {FOOTLE_MARK.map(([ch, state], i) => (
                <span className={`fh-tile fh-tile-${state} fh-mark-tile`} key={i}>{ch}</span>
              ))}
            </div>
          )}
          {inProgress && <div className="fh-title">Footle</div>}
          {/* ⚠️ "SURNAME" IS WRONG ON 33 OF THE 406 ANSWERS (8.1%, ~1 day in
              12): PELE, XAVI, RAUL, NEYMAR, WILLIAN, ISCO, PEDRI, ENDRICK and
              26 more are single-name players — WORDLE_FULL_NAMES stores them
              with an empty first-name prefix, which is how that count is
              derived rather than remembered. The word was removed once already
              because losing on a mononym felt unfair to players, and
              footle-prompt-copy.test.js was written to keep it out.
              Alex, 2026-08-24, asked for it back knowing the trade. Recorded
              here so the next person to read this file finds the number
              attached to the decision instead of re-discovering it. */}
          <div className="fh-sub">Surname of a footballer in 6 guesses</div>
          <div className="fh-cta-row">
            <span className="fh-cta">{inProgress ? `Continue · ${ws.used}/6 used` : "Play"}</span>
          </div>
        </div>
        {/* ⚠️ A PLAYER MID-PUZZLE SEES THEIR OWN BOARD, NOT A SAMPLE ONE.
            This grid used to render a rotating sample solve in every unfinished
            state — including in-progress, where an all-green winning row sat
            directly beside "Continue · N/6 used". The most-viewed card in the
            app was showing a stranger's solved puzzle as if it were yours. */}
        {inProgress && grades.length > 0 && (
          <div className="fh-grid" aria-hidden="true" style={{"--fh-cols": cols}}>
            {grades.slice(-PREVIEW_ROWS).map((row, r) => {
              const guess = guesses.slice(-PREVIEW_ROWS)[r] || "";
              return (
                <div className="fh-row" key={r}>
                  {row.map((c, i) => (
                    <div key={i} className={`fh-tile fh-tile-${c}`}>{guess[i]}</div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
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
        {/* ⚠️ NAME THE MODE — the label used to read just "N-day streak".
            Home, Daily and Profile render `loginStreak`: the cross-mode "days
            you showed up" count, which ticks on ANY daily completion and is
            server-authoritative. This is `computeFootleStreak`: consecutive
            days you SOLVED Footle, derived from local history. Different
            question, different number — and until now both wore the same flame
            and the same three words, so a player could read 12 on Home and 3
            here on the same day with no way to tell which was lying. Neither
            was. Mystery and Trail had the identical collision (four surfaces,
            not the two the report counted). Both numbers stay; the label now
            says which one you are looking at. */}
        {isWon && streak > 0 && (
          <div className="fh-sub">🔥 {streak}-day Footle streak</div>
        )}
        {isLost && (
          <div className="fh-sub">Better luck tomorrow.</div>
        )}
        <div className="fh-cta-row">
          <button className="fh-cta" onClick={() => onReview && onReview(ws)} aria-label="Review today's Footle">Review</button>
          <button className="fh-cta fh-cta-secondary" onClick={onShare} aria-label="Share today's Footle">↗︎ Share</button>
        </div>
      </div>
      {/* --fh-tile shrinks for long surnames so an 8-col grid never overlaps
          the "Solved in N guesses" text column. */}
      <div className="fh-grid" aria-hidden="true" style={{"--fh-cols": cols, "--fh-tile": cols >= 8 ? "17px" : cols === 7 ? "19px" : cols === 6 ? "21px" : "24px"}}>
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
